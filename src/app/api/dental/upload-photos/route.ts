import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photoFrontal = formData.get("photoFrontal") as File | null;
    const photoAbierta = formData.get("photoAbierta") as File | null;

    if (!photoFrontal) {
      return NextResponse.json({ error: "photoFrontal required" }, { status: 400 });
    }

    const uploadId = nanoid(12);
    const paths: { frontal: string; abierta?: string } = { frontal: "" };

    const frontalBuf = Buffer.from(await photoFrontal.arrayBuffer());
    const frontalPath = `dental/${uploadId}/frontal.jpg`;
    const { error: e1 } = await supabase.storage
      .from("patient-photos")
      .upload(frontalPath, frontalBuf, { contentType: "image/jpeg", upsert: true });
    if (e1) throw new Error(`frontal upload: ${e1.message}`);
    paths.frontal = frontalPath;

    if (photoAbierta) {
      const abiertaBuf = Buffer.from(await photoAbierta.arrayBuffer());
      const abiertaPath = `dental/${uploadId}/abierta.jpg`;
      const { error: e2 } = await supabase.storage
        .from("patient-photos")
        .upload(abiertaPath, abiertaBuf, { contentType: "image/jpeg", upsert: true });
      if (!e2) paths.abierta = abiertaPath;
    }

    return NextResponse.json({ uploadId, paths });
  } catch (err) {
    console.error("[dental/upload-photos]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
