import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  let body: { file_name?: string; file_type?: string; file_size?: number; phone?: string; email?: string; consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 });
  }

  const { file_name, file_type, file_size, phone, email, consent } = body;

  if (!phone?.trim()) {
    return NextResponse.json({ error: "WhatsApp requerido" }, { status: 400 });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Debes aceptar los términos para continuar" }, { status: 400 });
  }
  if (!file_name || !file_type) {
    return NextResponse.json({ error: "Datos del archivo requeridos" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file_type)) {
    return NextResponse.json({ error: "Formato no permitido. Usa PDF, PNG, JPG o WebP" }, { status: 400 });
  }
  if (file_size && file_size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });
  }

  const ext = file_name.split(".").pop()?.toLowerCase() ?? "pdf";
  const path = `quote-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from("dental-quotes")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[quote-upload-url] createSignedUploadUrl error:", error);
    return NextResponse.json(
      { error: "No se pudo preparar el upload. Intenta nuevamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  });
}
