import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = getAdminClient();

  const { data, error } = await supabase.storage
    .from("patient-photos")
    .createSignedUrl(decodeURIComponent(path), 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const imageRes = await fetch(data.signedUrl);
  if (!imageRes.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: imageRes.status });
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = await imageRes.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
