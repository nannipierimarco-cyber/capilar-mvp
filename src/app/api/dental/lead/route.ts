import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, answers, analysis } = body as {
      lead: { nombre: string; telefono: string; email: string };
      answers: Record<string, string>;
      analysis: Record<string, unknown>;
    };
    const id = nanoid(12);
    const { error } = await supabase.from("dental_patients").insert({
      id, nombre: lead.nombre, telefono: lead.telefono, email: lead.email,
      answers, analysis,
      overall_score: (analysis?.summary as Record<string, unknown>)?.overallScore ?? null,
      urgency_level: (analysis?.summary as Record<string, unknown>)?.urgencyLevel ?? null,
      status: "lead", created_at: new Date().toISOString(),
    });
    if (error) console.error("[dental/lead] Supabase error:", error);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/sync-lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lead.email, firstName: lead.nombre.split(" ")[0], lastName: lead.nombre.split(" ").slice(1).join(" "), phone: lead.telefono, source: "dental_funnel" }),
      });
    } catch { /* silencioso */ }
    return NextResponse.json({ id, success: true });
  } catch (err) {
    console.error("[dental/lead] Error:", err);
    return NextResponse.json({ error: "Error guardando lead" }, { status: 500 });
  }
}
