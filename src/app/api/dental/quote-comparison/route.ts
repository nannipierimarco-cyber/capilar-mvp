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

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // 4MB — Vercel serverless body limit is 4.5MB

function parseOptionalAmount(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    console.error("[quote-comparison] formData parse error:", e);
    return NextResponse.json(
      { error: "No se pudo leer el formulario. Intenta nuevamente.", step: "parse" },
      { status: 400 }
    );
  }

  const patientName   = (formData.get("patient_name") as string | null)?.trim();
  const phone         = (formData.get("patient_phone") as string | null)?.trim();
  const email         = (formData.get("patient_email") as string | null)?.trim().toLowerCase();
  const clinicName    = (formData.get("original_clinic_name") as string | null)?.trim() || null;
  const treatmentType = (formData.get("main_treatment_type") as string | null)?.trim() || null;
  const amountRaw     = formData.get("original_quote_amount") as string | null;
  const file          = formData.get("original_file") as File | null;
  const consent       = formData.get("consent") as string | null;

  if (!patientName || patientName.length < 3) {
    return NextResponse.json({ error: "Nombre y apellido requeridos", step: "validate" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Falta WhatsApp", step: "validate" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Falta email", step: "validate" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Falta archivo", step: "validate" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Archivo demasiado grande", step: "validate" },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido", step: "validate" },
      { status: 400 }
    );
  }
  if (consent !== "true") {
    return NextResponse.json(
      { error: "Debes aceptar los términos para continuar", step: "validate" },
      { status: 400 }
    );
  }

  const originalQuoteAmount = parseOptionalAmount(amountRaw);
  if (amountRaw?.trim() && originalQuoteAmount === null) {
    return NextResponse.json(
      { error: "Monto cotizado inválido", step: "validate" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    console.error("[quote-comparison] arrayBuffer error:", e);
    return NextResponse.json(
      { error: "No se pudo leer el archivo adjunto", step: "read_file" },
      { status: 500 }
    );
  }

  const today       = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const cleanName   = safeFileName(file.name.replace(/\.[^.]+$/, "")) || "cotizacion";
  const storagePath = `quote-comparisons/${today}/${randomUUID()}-${cleanName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("dental-quotes")
    .upload(storagePath, fileBuffer, {
      contentType:  file.type,
      cacheControl: "3600",
      upsert:       false,
    });

  if (uploadError) {
    console.error("[quote-comparison] storage_upload_failed:", uploadError);
    return NextResponse.json(
      { error: uploadError.message, step: "storage" },
      { status: 500 }
    );
  }

  const { data: record, error: insertError } = await supabase
    .from("dental_quote_requests")
    .insert({
      patient_name:              patientName,
      patient_phone:             phone,
      patient_email:             email,
      original_clinic_name:      clinicName,
      main_treatment_type:       treatmentType,
      original_quote_amount:     originalQuoteAmount,
      storage_path:              storagePath,
      original_file_name:        file.name,
      original_file_mime_type:   file.type,
      original_file_size:        file.size,
      source:                    "quote_comparison",
      status:                    "submitted",
    })
    .select("id")
    .single();

  if (insertError || !record) {
    console.error("[quote-comparison] database_insert_failed:", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "sin detalle", step: "database" },
      { status: 500 }
    );
  }

  console.log(`[quote-comparison] record saved — id=${record.id}`);
  return NextResponse.json({ success: true, quote_request_id: record.id });
}
