import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import {
  parseIncomingWhatsAppMessage,
  sendWhatsAppText,
  markMessageAsRead,
  normalizePhone,
} from "@/lib/whatsapp";
import { classifySkinMessage } from "@/lib/skinCopilot/classifier";
import { generateSkinCopilotReply } from "@/lib/skinCopilot/ai";

const FALLBACK_REPLY =
  "Gracias por escribir. Estamos revisando tu mensaje y pronto podremos ayudarte. " +
  "Si tienes síntomas intensos o que empeoran rápido, busca atención médica.";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Returns the allowlist of normalized phone numbers (digits only), or null if not configured. */
function getAllowedPhones(): string[] | null {
  const raw = process.env.SKIN_COPILOT_ALLOWED_TEST_PHONES;
  if (!raw?.trim()) return null;
  return raw.split(",").map((p) => normalizePhone(p)).filter(Boolean);
}

/** GET — Meta webhook verification handshake */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  console.log("[Webhook:GET] method=GET", {
    hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
    hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    mode,
    hasChallenge: !!challenge,
    tokenMatch: token === process.env.WHATSAPP_VERIFY_TOKEN,
  });

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[Webhook:GET] Verification succeeded");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[Webhook:GET] Verification failed — token mismatch or wrong mode");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** POST — Receive and process incoming WhatsApp messages */
export async function POST(req: NextRequest) {
  console.log("[Webhook:POST] method=POST", {
    hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
    hasAllowedPhones: !!process.env.SKIN_COPILOT_ALLOWED_TEST_PHONES,
  });

  // Read raw body first — required for HMAC-SHA256 verification over raw bytes
  const rawBody = await req.text();

  // Verify Meta X-Hub-Signature-256 — always return 200 to Meta even on failure
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sigHeader = req.headers.get("x-hub-signature-256") ?? "";
    const receivedSig = sigHeader.startsWith("sha256=") ? sigHeader.slice(7) : "";
    if (!receivedSig) {
      console.warn("[Webhook:POST] X-Hub-Signature-256 missing or malformed — ignoring payload");
      return NextResponse.json({ ok: true });
    }
    const expectedSig = createHmac("sha256", appSecret).update(rawBody).digest("hex");
    let valid = false;
    try {
      valid = timingSafeEqual(Buffer.from(expectedSig, "hex"), Buffer.from(receivedSig, "hex"));
    } catch { /* buffer length mismatch = invalid */ }
    if (!valid) {
      console.warn("[Webhook:POST] Invalid Meta signature — ignoring payload");
      return NextResponse.json({ ok: true });
    }
  } else {
    console.warn("[Webhook:POST] WHATSAPP_APP_SECRET not set — skipping signature check (degraded mode)");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    console.warn("[Webhook:POST] Failed to parse JSON body");
    // Always return 200 to prevent WhatsApp from retrying indefinitely
    return NextResponse.json({ ok: true });
  }

  const entries = Array.isArray((payload as any)?.entry) ? (payload as any).entry : [];
  const firstChanges = entries[0]?.changes ?? [];
  const firstValue = firstChanges[0]?.value ?? {};
  const hasMessages = Array.isArray(firstValue.messages) && firstValue.messages.length > 0;
  const hasStatuses = Array.isArray(firstValue.statuses) && firstValue.statuses.length > 0;

  console.log("[Webhook:POST] payload structure", {
    hasEntry: entries.length > 0,
    entryCount: entries.length,
    hasChanges: firstChanges.length > 0,
    hasMessages,
    hasStatuses,
    messageCount: hasMessages ? firstValue.messages.length : 0,
  });

  // ── Status update logging ─────────────────────────────────────────────────
  if (hasStatuses) {
    const statuses: unknown[] = firstValue.statuses as unknown[];
    for (const s of statuses) {
      const st = s as Record<string, unknown>;
      const recipientRaw = String(st.recipient_id ?? "");
      const errors = Array.isArray(st.errors)
        ? (st.errors as Record<string, unknown>[]).map((e) => ({
            code: e.code,
            title: e.title,
          }))
        : undefined;
      console.log("[Webhook:STATUS]", {
        messageId: st.id,
        status: st.status,
        timestamp: st.timestamp,
        recipientPrefix: recipientRaw.slice(0, 5) + "***",
        ...(errors?.length ? { errors } : {}),
      });
    }
  }

  const incoming = parseIncomingWhatsAppMessage(payload);

  // Ignore non-text messages or status updates
  if (!incoming || !incoming.text) {
    console.log("[Webhook:POST] No actionable message — ignored (status update or non-text)");
    return NextResponse.json({ ok: true });
  }

  const { phone, messageId, text } = incoming;

  console.log("[Webhook:POST] Inbound text message from", phone.slice(0, 5) + "***", "msgId:", messageId.slice(0, 8) + "...");

  // ── Phone allowlist guard ──────────────────────────────────────────────────
  const allowedPhones = getAllowedPhones();
  const normalizedPhone = normalizePhone(phone);
  console.log("[Webhook:POST] Allowlist check", {
    incomingPrefix: normalizedPhone.slice(0, 5) + "***",
    allowlistSize: allowedPhones?.length ?? "disabled",
    passed: !allowedPhones || allowedPhones.includes(normalizedPhone),
  });
  if (allowedPhones && !allowedPhones.includes(normalizedPhone)) {
    console.log("[Webhook:POST] Phone not in allowlist — ignored");
    return NextResponse.json({ ok: true });
  }

  // Mark message as read (shows double blue tick)
  markMessageAsRead(messageId).catch(() => {});

  const supabase = getServiceClient();
  if (!supabase) {
    console.warn("[Webhook] Missing WhatsApp env vars — Supabase not configured, running stateless");
  }

  let userId: string | null = null;
  let profile: Record<string, unknown> | null = null;
  let context = "";

  if (supabase) {
    try {
      // Find or create user
      let { data: existing } = await supabase
        .from("skin_copilot_users")
        .select("id")
        .eq("phone_number", phone)
        .single();

      if (!existing) {
        const { data: created, error } = await supabase
          .from("skin_copilot_users")
          .insert({ phone_number: phone })
          .select("id")
          .single();
        if (error || !created) {
          console.error("[Webhook] Failed to create user:", error?.message);
        } else {
          existing = created;
        }
      }

      userId = existing?.id ?? null;

      if (userId) {
        // Save inbound message
        await supabase.from("whatsapp_messages").insert({
          user_id: userId,
          whatsapp_message_id: messageId,
          direction: "inbound",
          message_type: "text",
          message_text: text,
        });

        // Fetch profile and recent messages in parallel
        const [{ data: p }, { data: recentMsgs }] = await Promise.all([
          supabase
            .from("skin_profiles")
            .select(
              "skin_type, main_concern, sensitivity, allergies, current_products, previous_treatments, doctor_notes"
            )
            .eq("user_id", userId)
            .single(),
          supabase
            .from("whatsapp_messages")
            .select("direction, message_text")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        profile = p;
        context = (recentMsgs ?? [])
          .reverse()
          .map(
            (m) =>
              `${m.direction === "inbound" ? "Usuaria" : "Asistente"}: ${m.message_text}`
          )
          .join("\n");
      }
    } catch (err) {
      console.warn("[Webhook] DB error (tables may not exist yet):", err);
      userId = null;
    }
  }

  // Classify and generate reply
  const risk = classifySkinMessage(text, profile);
  let reply: string;
  try {
    reply = await generateSkinCopilotReply({
      userMessage: text,
      profile,
      context,
      riskClassification: risk,
    });
    console.log("[Webhook] Skin Copilot reply generated (risk:", risk.riskLevel + ")");
  } catch (err) {
    console.error("[Webhook] generateSkinCopilotReply threw:", err);
    reply = FALLBACK_REPLY;
  }

  // Persist outbound message and AI interaction
  if (supabase && userId) {
    try {
      await Promise.all([
        supabase.from("whatsapp_messages").insert({
          user_id: userId,
          direction: "outbound",
          message_type: "text",
          message_text: reply,
          risk_level: risk.riskLevel,
          action: risk.action,
        }),
        supabase.from("ai_interactions").insert({
          user_id: userId,
          user_question: text,
          retrieved_context: { profile },
          ai_answer: reply,
          risk_level: risk.riskLevel,
          action: risk.action,
        }),
      ]);

      if (risk.riskLevel === "red") {
        await supabase.from("doctor_escalations").insert({
          user_id: userId,
          reason: risk.reason,
          message_snapshot: text,
          risk_level: risk.riskLevel,
          status: "pending",
        });
      }
    } catch (err) {
      console.warn("[Webhook] Failed to persist results:", err);
    }
  }

  // Send reply via WhatsApp
  await sendWhatsAppText(phone, reply);

  return NextResponse.json({ ok: true });
}
