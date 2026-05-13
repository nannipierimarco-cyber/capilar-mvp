import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

function verifyAccessToken(id: string, token: string): boolean {
  const secret = process.env.ANALYSIS_ACCESS_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(id).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.ANALYSIS_ACCESS_SECRET) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!verifyAccessToken(id, token)) {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
  }

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
