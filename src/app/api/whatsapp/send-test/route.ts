/**
 * TEMPORARY TESTING ENDPOINT — remove before opening to real users.
 *
 * POST /api/whatsapp/send-test
 * Body: { "to": "+56998056526", "message": "..." }
 *
 * Validates that "to" is in SKIN_COPILOT_ALLOWED_TEST_PHONES, then sends
 * a WhatsApp message via the Cloud API and returns the raw API status.
 */

import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/whatsapp";

function getAllowedPhones(): string[] | null {
  const raw = process.env.SKIN_COPILOT_ALLOWED_TEST_PHONES;
  if (!raw?.trim()) return null;
  return raw.split(",").map((p) => normalizePhone(p)).filter(Boolean);
}

function apiBase(): string {
  const version = process.env.WHATSAPP_API_VERSION ?? "v23.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("[SendTest] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return NextResponse.json(
      { ok: false, error: "Missing WhatsApp env vars on server" },
      { status: 500 }
    );
  }

  let body: { to?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { to, message } = body;

  if (!to || !message) {
    return NextResponse.json(
      { ok: false, error: 'Body must include "to" and "message"' },
      { status: 400 }
    );
  }

  const normalizedTo = normalizePhone(to);
  const allowedPhones = getAllowedPhones();

  if (allowedPhones && !allowedPhones.includes(normalizedTo)) {
    console.warn("[SendTest] Rejected — number not in SKIN_COPILOT_ALLOWED_TEST_PHONES");
    return NextResponse.json(
      { ok: false, error: "Phone number not in allowed test list" },
      { status: 403 }
    );
  }

  console.log("[SendTest] Sending test message to", normalizedTo.slice(0, 5) + "***");

  let apiStatus: number;
  let apiBody: string;

  try {
    const res = await fetch(apiBase(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: { body: message, preview_url: false },
      }),
    });

    apiStatus = res.status;
    apiBody = await res.text();
  } catch (err) {
    console.error("[SendTest] Network error calling WhatsApp Cloud API:", err);
    return NextResponse.json(
      { ok: false, error: "Network error reaching WhatsApp Cloud API" },
      { status: 502 }
    );
  }

  if (apiStatus >= 200 && apiStatus < 300) {
    console.log("[SendTest] Message sent successfully, apiStatus:", apiStatus);
    return NextResponse.json({ ok: true, apiStatus });
  }

  // Return sanitized error — parse JSON if possible, strip any token leakage
  let sanitizedError: unknown;
  try {
    const parsed = JSON.parse(apiBody);
    // Return the error structure from Meta but never the raw token
    sanitizedError = parsed?.error ?? parsed;
  } catch {
    sanitizedError = "Non-JSON error from WhatsApp API";
  }

  console.error("[SendTest] WhatsApp API error", apiStatus, sanitizedError);
  return NextResponse.json({ ok: false, apiStatus, error: sanitizedError }, { status: apiStatus });
}
