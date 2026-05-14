import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { getFlowPaymentStatus, flowStatusToOrderStatus } from "@/lib/payments/flow";

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Flow sends a POST with token in the form body when payment is confirmed
export async function POST(req: NextRequest) {
  let token: string | null = null;
  const contentType = req.headers.get("content-type") ?? "";
  const rawBody = await req.text();

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    token = params.get("token");

    // Verify Flow HMAC-SHA256 signature (same algorithm as lib/payments/flow.ts sign())
    const flowSecret = process.env.FLOW_SECRET_KEY;
    if (flowSecret) {
      const receivedSig = params.get("s");
      if (!receivedSig) {
        console.error("[flow/confirm] Missing signature parameter 's'");
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      const signedContent = [...params.entries()]
        .filter(([k]) => k !== "s")
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}${v}`)
        .join("");
      const expected = createHmac("sha256", flowSecret).update(signedContent).digest("hex");
      let valid = false;
      try {
        valid = timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(receivedSig, "hex"));
      } catch { /* buffer length mismatch = invalid */ }
      if (!valid) {
        console.error("[flow/confirm] Invalid HMAC signature — rejecting");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
      console.log("[flow/confirm] HMAC signature verified");
    } else {
      console.warn("[flow/confirm] FLOW_SECRET_KEY not set — skipping HMAC check (degraded mode)");
    }
  } else {
    // Fallback: JSON (sandbox/testing environments)
    try {
      const body = JSON.parse(rawBody) as { token?: string };
      token = body.token ?? null;
    } catch {
      // ignore
    }
  }

  if (!token) {
    return NextResponse.json({ error: "token missing" }, { status: 400 });
  }

  const supabase = getAdminDb();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("provider_token", token)
    .maybeSingle();

  if (!order) {
    console.error("[flow/confirm] order not found for token:", token);
    // Return 200 to prevent Flow from retrying endlessly
    return NextResponse.json({ ok: false, error: "order not found" });
  }

  let flowStatus;
  try {
    flowStatus = await getFlowPaymentStatus(token);
  } catch (err) {
    console.error("[flow/confirm] getStatus error:", err);
    return NextResponse.json({ error: "Flow API error" }, { status: 502 });
  }

  const newStatus = flowStatusToOrderStatus(flowStatus.status);
  const isPaid = newStatus === "paid_pending_medical_review";

  await supabase
    .from("orders")
    .update({
      status: newStatus,
      provider_status: String(flowStatus.status),
      provider_payment_id: String(flowStatus.flowOrder),
      paid_at: isPaid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return NextResponse.json({ ok: true });
}
