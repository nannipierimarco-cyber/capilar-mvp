import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  parseIncomingWhatsAppMessage,
  sendWhatsAppText,
  markMessageAsRead,
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

/** Returns the list of allowed test phones, or null if the allowlist is not configured. */
function getAllowedPhones(): string[] | null {
  const raw = process.env.SKIN_COPILOT_ALLOWED_TEST_PHONES;
  if (!raw?.trim()) return null;
  return raw.split(",").map((p) => p.trim()).filter(Boolean);
}

/** GET — Meta webhook verification handshake */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[Webhook] WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[Webhook] Verification failed — token mismatch or wrong mode");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** POST — Receive and process incoming WhatsApp messages */
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    // Always return 200 to prevent WhatsApp from retrying indefinitely
    return NextResponse.json({ ok: true });
  }

  const incoming = parseIncomingWhatsAppMessage(payload);

  // Ignore non-text messages or status updates
  if (!incoming || !incoming.text) {
    return NextResponse.json({ ok: true });
  }

  const { phone, messageId, text } = incoming;

  console.log("[Webhook] Inbound WhatsApp message received from", phone.slice(0, 4) + "***");

  // ── Phone allowlist guard ──────────────────────────────────────────────────
  const allowedPhones = getAllowedPhones();
  if (allowedPhones && !allowedPhones.includes(phone)) {
    console.log("[Webhook] Phone not in allowed test phones —", phone.slice(0, 4) + "*** ignored");
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
