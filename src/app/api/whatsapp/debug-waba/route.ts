/**
 * TEMPORARY DEBUG ENDPOINT — remove before opening to real users.
 *
 * GET /api/whatsapp/debug-waba
 * Headers: x-admin-secret: <ADMIN_SECRET>
 *
 * Calls the Graph API to verify:
 *   1. Phone number details for WHATSAPP_PHONE_NUMBER_ID
 *   2. Associated WABA ID
 *   3. Webhook subscription status for that WABA
 *
 * Never logs or returns the access token.
 */

import { NextRequest, NextResponse } from "next/server";

function apiVersion(): string {
  return process.env.WHATSAPP_API_VERSION ?? "v23.0";
}

async function graphGet(path: string, token: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `https://graph.facebook.com/${apiVersion()}/${path}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { networkError: String(err) } };
  }
}

/** Strip any token-like values from a Graph API error object before returning it. */
function sanitize(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string" && v.length > 40 && /^[A-Za-z0-9_\-]+$/.test(v)) {
      result[k] = "[redacted]";
    } else if (typeof v === "object") {
      result[k] = sanitize(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  // Auth guard
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers.get("x-admin-secret");
  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return NextResponse.json({
      error: "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID",
    }, { status: 500 });
  }

  // Known WABA ID — used directly to avoid whatsapp_business_account field permission issues
  const KNOWN_WABA_ID = "1662955004950888";

  // ── 1. Phone number details (simple fields only) ──────────────────────────
  const phoneResult = await graphGet(
    `${phoneNumberId}?fields=id,display_phone_number,verified_name,code_verification_status,quality_rating,platform_type`,
    token
  );

  // ── 2. WABA details ───────────────────────────────────────────────────────
  const wabaResult = await graphGet(
    `${KNOWN_WABA_ID}?fields=id,name,account_review_status,on_behalf_of_business_info`,
    token
  );

  // ── 3. Webhook subscription for this WABA ────────────────────────────────
  const subscriptionResult = await graphGet(
    `${KNOWN_WABA_ID}/subscribed_apps`,
    token
  );

  // ── 4. Token identity ─────────────────────────────────────────────────────
  const tokenDebug = await graphGet("me?fields=id,name,type", token);

  return NextResponse.json({
    envCheck: {
      hasToken: !!token,
      hasPhoneNumberId: !!phoneNumberId,
      phoneNumberIdConfigured: phoneNumberId,
      wabaIdUsed: KNOWN_WABA_ID,
    },
    phoneNumber: phoneResult.ok
      ? sanitize(phoneResult.data)
      : { error: sanitize(phoneResult.data), httpStatus: phoneResult.status },
    waba: wabaResult.ok
      ? sanitize(wabaResult.data)
      : { error: sanitize(wabaResult.data), httpStatus: wabaResult.status },
    webhookSubscriptions: subscriptionResult.ok
      ? sanitize(subscriptionResult.data)
      : { error: sanitize(subscriptionResult.data), httpStatus: subscriptionResult.status },
    tokenIdentity: tokenDebug.ok
      ? sanitize(tokenDebug.data)
      : { error: sanitize(tokenDebug.data), httpStatus: tokenDebug.status },
  });
}
