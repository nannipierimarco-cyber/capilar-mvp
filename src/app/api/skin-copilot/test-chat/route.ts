import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classifySkinMessage } from "@/lib/skinCopilot/classifier";
import { generateSkinCopilotReply } from "@/lib/skinCopilot/ai";

/**
 * POST /api/skin-copilot/test-chat
 *
 * Simulate a Skin Copilot conversation without a real WhatsApp connection.
 *
 * Body: { phone: string; message: string }
 * Response: { reply: string; riskLevel: "green"|"yellow"|"red"; action: string }
 */
export async function POST(req: NextRequest) {
  let body: { phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { phone, message } = body;
  if (!phone || !message) {
    return NextResponse.json(
      { error: "Both 'phone' and 'message' fields are required" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Stateless fallback — works without DB (useful for early development)
  if (!supabaseUrl || !serviceRoleKey) {
    const risk = classifySkinMessage(message, null);
    const reply = await generateSkinCopilotReply({
      userMessage: message,
      profile: null,
      context: "",
      riskClassification: risk,
    });
    return NextResponse.json({
      reply,
      riskLevel: risk.riskLevel,
      action: risk.action,
      note: "Stateless mode — Supabase not configured. No history saved.",
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let userId: string | null = null;
  let profile: Record<string, unknown> | null = null;
  let context = "";

  try {
    // Find or create user
    let { data: user } = await supabase
      .from("skin_copilot_users")
      .select("id")
      .eq("phone_number", phone)
      .single();

    if (!user) {
      const { data: created } = await supabase
        .from("skin_copilot_users")
        .insert({ phone_number: phone })
        .select("id")
        .single();
      user = created;
    }

    userId = user?.id ?? null;

    if (userId) {
      // Load skin profile and recent messages in parallel
      const [{ data: p }, { data: msgs }] = await Promise.all([
        supabase
          .from("skin_profiles")
          .select("skin_type, main_concern, sensitivity, allergies, current_products, doctor_notes")
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
      context = (msgs ?? [])
        .reverse()
        .map((m) => `${m.direction === "inbound" ? "Usuaria" : "Asistente"}: ${m.message_text}`)
        .join("\n");

      // Save inbound message
      await supabase.from("whatsapp_messages").insert({
        user_id: userId,
        direction: "inbound",
        message_type: "text",
        message_text: message,
      });
    }
  } catch (err) {
    // DB tables may not exist yet — fall through to stateless mode
    console.warn("[test-chat] DB error (tables may not exist yet):", err);
    userId = null;
  }

  // Classify and generate reply
  const risk = classifySkinMessage(message, profile);
  const reply = await generateSkinCopilotReply({
    userMessage: message,
    profile,
    context,
    riskClassification: risk,
  });

  // Persist results if DB is available
  if (userId) {
    try {
      const saves = [
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
          user_question: message,
          retrieved_context: { profile },
          ai_answer: reply,
          risk_level: risk.riskLevel,
          action: risk.action,
        }),
      ];

      if (risk.riskLevel === "red") {
        saves.push(
          supabase.from("doctor_escalations").insert({
            user_id: userId,
            reason: risk.reason,
            message_snapshot: message,
            risk_level: risk.riskLevel,
            status: "pending",
          })
        );
      }

      await Promise.all(saves);
    } catch (err) {
      console.warn("[test-chat] Failed to persist results:", err);
    }
  }

  return NextResponse.json({
    reply,
    riskLevel: risk.riskLevel,
    action: risk.action,
  });
}
