import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppTextResult } from "@/lib/whatsapp";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // 4MB — Vercel serverless body limit is 4.5MB
const SIGNED_URL_SECONDS = 14 * 24 * 3600; // 14 days
const CLINIC_WHATSAPP = (process.env.CLINIC_WHATSAPP_TO ?? "56998056526").replace(/\D/g, "");

function parseOptionalAmount(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildClinicMessage(params: {
  fullName: string;
  rut: string;
  phone: string;
  email: string;
  treatmentType: string | null;
  quotedAmount: number | null;
  externalClinicName: string | null;
  fileUrl: string;
}): string {
  const { fullName, rut, phone, email, treatmentType, quotedAmount, externalClinicName, fileUrl } = params;
  const amountStr = quotedAmount ? `$${quotedAmount.toLocaleString("es-CL")}` : "No informado";
  return [
    "Nueva cotización dental recibida en Perfecto Labs 🦷",
    "",
    `Paciente: ${fullName}`,
    `RUT: ${rut}`,
    `Teléfono: ${phone}`,
    `Email: ${email}`,
    "",
    `Tratamiento cotizado: ${treatmentType ?? "No informado"}`,
    `Monto cotizado: ${amountStr}`,
    `Clínica origen: ${externalClinicName ?? "No informada"}`,
    "",
    "Ver cotización:",
    fileUrl,
    "",
    "Acción sugerida:",
    "Contactar al paciente y ofrecer una mejor propuesta.",
  ].join("\n");
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
  const rut           = (formData.get("patient_rut") as string | null)?.trim().toUpperCase();
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
  if (!rut || rut.length < 8) {
    return NextResponse.json({ error: "RUT requerido", step: "validate" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "WhatsApp requerido", step: "validate" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido", step: "validate" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido", step: "validate" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "El archivo no puede superar 4MB", step: "validate" },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usa PDF, PNG, JPG o WebP", step: "validate" },
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

  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const fileName = `quote-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("dental-quotes")
    .upload(fileName, fileBuffer, {
      contentType:  file.type,
      cacheControl: "3600",
      upsert:       false,
    });

  if (uploadError) {
    console.error("[quote-comparison] storage upload error:", uploadError);
    return NextResponse.json(
      { error: `Error al subir el archivo: ${uploadError.message}`, step: "storage" },
      { status: 500 }
    );
  }

  // Prefer signed URL (14 days); fall back to public URL
  const { data: signedUrlData } = await supabase.storage
    .from("dental-quotes")
    .createSignedUrl(fileName, SIGNED_URL_SECONDS);

  const fileUrl = signedUrlData?.signedUrl
    ?? supabase.storage.from("dental-quotes").getPublicUrl(fileName).data.publicUrl;

  const { data: record, error: insertError } = await supabase
    .from("dental_quote_requests")
    .insert({
      patient_name:          patientName,
      patient_rut:           rut,
      patient_phone:         phone,
      patient_email:         email,
      original_clinic_name:  clinicName,
      main_treatment_type:   treatmentType,
      original_quote_amount: originalQuoteAmount,
      original_file_url:     fileUrl,
      status:                "submitted",
    })
    .select("id")
    .single();

  if (insertError || !record) {
    console.error("[quote-comparison] db insert error:", insertError);
    return NextResponse.json(
      { error: `Error al guardar la solicitud: ${insertError?.message ?? "sin detalle"}`, step: "database" },
      { status: 500 }
    );
  }

  console.log(`[quote-comparison] record saved — id=${record.id}, sending WhatsApp to ${CLINIC_WHATSAPP}`);

  const waMessage = buildClinicMessage({
    fullName:           patientName,
    rut,
    phone,
    email,
    treatmentType,
    quotedAmount:       originalQuoteAmount,
    externalClinicName: clinicName,
    fileUrl,
  });

  const waResult = await sendWhatsAppTextResult(CLINIC_WHATSAPP, waMessage);

  const updatePayload = waResult.ok
    ? { status: "sent_to_clinic", whatsapp_sent_at: new Date().toISOString() }
    : {
        status:          "failed_to_send",
        // Store full Meta error body so we can diagnose token/template/phone issues in Supabase
        whatsapp_error:  waResult.metaBody ?? waResult.error ?? "unknown error",
      };

  await supabase
    .from("dental_quote_requests")
    .update(updatePayload)
    .eq("id", record.id);

  console.log(`[quote-comparison] done — id=${record.id}, wa_ok=${waResult.ok}, wa_messageId=${waResult.messageId ?? "n/a"}`);
  return NextResponse.json({ success: true, quote_request_id: record.id });
}
