import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { MapaCapilarReport } from "@/lib/mapaCapilar";

interface LeadBody {
  name: string;
  email: string;
  phone: string;
  age: string;
  finalInterest: string;
  concern: string;
  duration: string;
  previousTreatment: string;
  familyHistory: string;
  goal: string;
  photoUrl?: string;
  report?: MapaCapilarReport;
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // DB not configured — skip silently
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ageNum = parseInt(body.age, 10);

    const { error } = await supabase.from("hair_map_leads").insert({
      name: body.name,
      email: body.email,
      phone: body.phone,
      age: isNaN(ageNum) ? null : ageNum,
      main_concern: body.concern,
      duration: body.duration,
      previous_treatment: body.previousTreatment,
      family_history: body.familyHistory,
      goal: body.goal,
      final_interest: body.finalInterest,
      photo_url: body.photoUrl ?? null,
      report_json: body.report ?? null,
    });

    if (error) {
      console.warn("[mapa-capilar/save-lead] DB insert warning:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mapa-capilar/save-lead] Unexpected error:", err);
    // Never block the user response on DB failure
    return NextResponse.json({ ok: true, warning: "DB save failed" });
  }
}
