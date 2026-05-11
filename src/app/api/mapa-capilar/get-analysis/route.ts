import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("hair_map_analyses")
      .select("photo_frontal_url, photo_crown_url, analysis_json, status")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({
      ok: true,
      frontalUrl: data.photo_frontal_url ?? undefined,
      crownUrl: data.photo_crown_url ?? undefined,
      report: (data.analysis_json as HairMapAnalysisReport) ?? undefined,
      status: data.status,
    });
  } catch (err) {
    console.error("[mapa-capilar/get-analysis]", err);
    return NextResponse.json({ ok: false });
  }
}
