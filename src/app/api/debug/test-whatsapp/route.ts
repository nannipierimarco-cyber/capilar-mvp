import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTextResult } from "@/lib/whatsapp";

// Internal-only endpoint for diagnosing WhatsApp delivery.
// Requires x-internal-secret header matching INTERNAL_API_SECRET env var.
// Remove or gate behind a feature flag before public launch.

export async function POST(req: NextRequest) {
  const secret         = req.headers.get("x-internal-secret");
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET not configured on this environment" },
      { status: 500 }
    );
  }
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { to?: string; message?: string } = {};
  try {
    body = (await req.json()) as { to?: string; message?: string };
  } catch {
    // Body is optional — use defaults
  }

  const to      = (body.to ?? process.env.CLINIC_WHATSAPP_TO ?? "56998056526").replace(/\D/g, "");
  const message = body.message ?? `Prueba Perfecto Labs WhatsApp — ${new Date().toISOString()}`;

  const result = await sendWhatsAppTextResult(to, message);

  return NextResponse.json({
    ok:              result.ok,
    to,
    messageId:       result.messageId   ?? null,
    metaStatus:      result.metaStatus  ?? null,
    metaBody:        result.metaBody    ?? null,
    error:           result.error       ?? null,
    // Env var diagnostics (presence only — never values)
    env: {
      hasAccessToken:   Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      clinicTo:         process.env.CLINIC_WHATSAPP_TO ?? "(not set — default 56998056526)",
      apiVersion:       process.env.WHATSAPP_API_VERSION ?? "v23.0 (default)",
    },
  });
}
