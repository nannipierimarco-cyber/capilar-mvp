import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseIncomingWhatsAppMessage, sendWhatsAppText } from "@/lib/whatsapp";
import { classifySkinMessage } from "@/lib/skinCopilot/classifier";
import { generateSkinCopilotReply } from "@/lib/skinCopilot/ai";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** GET — Meta webhook verification handshake */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

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

  // Ignore non-text messages or status updates for now
  if (!incoming || !incoming.text) {
    return NextResponse.json({ ok: true });
  }

  const { phone, messageId, text } = incoming;

  const supabase = getServiceClient();
  if (!supabase) {
    console.error("[Webhook] Supabase not configured — cannot process message from", phone);
    return NextResponse.json({ ok: true });
  }

  try {
    // 1. Find or create user
    let userId: string;
    const { data: existing } = await supabase
      .from("skin_copilot_users")
      .select("id")
      .eq("phone_number", phone)
      .single();

    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("skin_copilot_users")
        .insert({ phone_number: phone })
        .select("id")
        .single();
      if (error || !created) {
        console.error("[Webhook] Failed to create user:", error);
        return NextResponse.json({ ok: true });
      }
      userId = created.id;
    }

    // 2. Save inbound message
    await supabase.from("whatsapp_messages").insert({
      user_id: userId,
      whatsapp_message_id: messageId,
      direction: "inbound",
      message_type: "text",
      message_text: text,
    });

    // 3. Fetch skin profile for context
    const { data: profile } = await supabase
      .from("skin_profiles")
      .select("skin_type, main_concern, sensitivity, allergies, current_products, previous_treatments, doctor_notes")
      .eq("user_id", userId)
      .single();

    // 4. Fetch last 5 messages for conversational context
    const { data: recentMsgs } = await supabase
      .from("whatsapp_messages")
      .select("direction, message_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const context = (recentMsgs ?? [])
      .reverse()
      .map((m) => `${m.direction === "inbound" ? "Usuaria" : "Asistente"}: ${m.message_text}`)
      .join("\n");

    // 5. Classify risk
    const risk = classifySkinMessage(text, profile);

    // 6. Generate AI reply
    const reply = await generateSkinCopilotReply({
      userMessage: text,
      profile,
      context,
      riskClassification: risk,
    });

    // 7. Persist outbound message and AI interaction
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
        retrieved_context: { recentMessages: recentMsgs, profile },
        ai_answer: reply,
        risk_level: risk.riskLevel,
        action: risk.action,
      }),
    ]);

    // 8. Escalate red cases to doctor queue
    if (risk.riskLevel === "red") {
      await supabase.from("doctor_escalations").insert({
        user_id: userId,
        reason: risk.reason,
        message_snapshot: text,
        risk_level: risk.riskLevel,
        status: "pending",
      });
    }

    // 9. Send reply via WhatsApp
    await sendWhatsAppText(phone, reply);
  } catch (err) {
    console.error("[Webhook] Unhandled error:", err);
    // Still return 200 — don't let WhatsApp flood with retries
  }

  return NextResponse.json({ ok: true });
}
