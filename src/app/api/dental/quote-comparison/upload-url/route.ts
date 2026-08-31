import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Extension-based allowlist as the source of truth — iOS/Android report unreliable
// or empty `file.type` for HEIC/HEIF, so we can't gate on mime type alone.
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "heic", "heif"];
const MAX_BYTES = 20 * 1024 * 1024; // 20MB — enforced by the Storage bucket itself, not this route

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

// Returns a short-lived signed upload token so the browser can PUT the file
// straight to Supabase Storage — no file bytes ever pass through this Vercel
// function, keeping large uploads free of any serverless body-size limit.
export async function POST(req: NextRequest) {
  let body: { fileName?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const fileName = body.fileName?.trim();
  const fileSize = body.fileSize;

  if (!fileName) {
    return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 });
  }

  if (typeof fileSize === "number" && fileSize > MAX_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 400 });
  }

  const today       = new Date().toISOString().slice(0, 10);
  const cleanName   = safeFileName(fileName.replace(/\.[^.]+$/, "")) || "cotizacion";
  const storagePath = `quote-comparisons/${today}/${randomUUID()}-${cleanName}.${ext}`;

  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from("dental-quotes")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("[quote-comparison/upload-url] createSignedUploadUrl failed:", error);
    return NextResponse.json({ error: "No se pudo iniciar la subida" }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
