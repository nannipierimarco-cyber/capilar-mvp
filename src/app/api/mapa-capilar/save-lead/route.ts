import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { MapaCapilarReport } from "@/lib/mapaCapilar";

interface LeadBody {
  name?: string;
  email: string;
  phone: string;
  age?: string;
  finalInterest?: string;
  concern: string;
  duration: string;
  previousTreatment: string;
  familyHistory: string;
  goal: string;
  photoUrl?: string;
  report?: MapaCapilarReport | Record<string, unknown>;
  analysisId?: string | null;
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ageNum = body.age != null && body.age !== "" ? parseInt(body.age, 10) : NaN;

  try {
    // 1. Check if a mapa_capilar patient with this email already exists
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("email", body.email)
      .eq("source", "mapa_capilar")
      .maybeSingle();

    let patientId: string | null = existing?.id ?? null;

    if (!patientId) {
      const { data: newPatient, error: insertError } = await supabase
        .from("patients")
        .insert({
          email: body.email,
          first_name: body.name?.trim().split(" ")[0] ?? "",
          last_name: body.name?.trim().split(" ").slice(1).join(" ") ?? "",
          phone: body.phone,
          age: !isNaN(ageNum) ? ageNum : null,
          source: "mapa_capilar",
          status: "lead",
        })
        .select("id")
        .single();
      if (insertError) {
        console.warn("[save-lead] patient insert warning:", insertError.message);
      }
      patientId = newPatient?.id ?? null;
    }

    // 2. Link hair_map_analyses to patient if analysisId provided
    if (patientId && body.analysisId) {
      const { error: linkError } = await supabase
        .from("hair_map_analyses")
        .update({ patient_id: patientId })
        .eq("id", body.analysisId);
      if (linkError) {
        console.warn("[save-lead] link analysis warning:", linkError.message);
      }
    }

    // 3. Keep writing to hair_map_leads for backward compat
    const { error: leadError } = await supabase.from("hair_map_leads").insert({
      name: body.name?.trim() || null,
      email: body.email,
      phone: body.phone,
      age: !isNaN(ageNum) ? ageNum : null,
      main_concern: body.concern,
      duration: body.duration,
      previous_treatment: body.previousTreatment,
      family_history: body.familyHistory,
      goal: body.goal,
      final_interest: body.finalInterest?.trim() || null,
      photo_url: body.photoUrl ?? null,
      report_json: body.report ?? null,
    });

    if (leadError) {
      console.warn("[save-lead] hair_map_leads insert warning:", leadError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mapa-capilar/save-lead] Unexpected error:", err);
    return NextResponse.json({ ok: true, warning: "DB save failed" });
  }
}
