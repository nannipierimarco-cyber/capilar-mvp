import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    token = formData.get("token") as string | null;
  } else {
    // Fallback: try JSON (some Flow sandbox versions)
    try {
      const body = await req.json() as { token?: string };
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
