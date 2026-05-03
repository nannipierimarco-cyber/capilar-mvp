import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createFlowPayment } from "@/lib/payments/flow";
import { getMembershipPlan, SHIPPING_AMOUNT } from "@/lib/plans";

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    plan?: string;
    membership?: string;
    intake_id?: string;
  };
  const { plan, membership, intake_id } = body;

  // Validate plan — only "inicio" supported for paid flow
  if (plan !== "inicio") {
    return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
  }

  // Amount always determined server-side — never trusted from client
  const membershipPlan = getMembershipPlan(membership);
  if (!membershipPlan) {
    return NextResponse.json(
      { error: "Membresía no válida. Opciones: 6m, 3m, 1m" },
      { status: 400 }
    );
  }

  const subtotal = membershipPlan.subtotal;
  const amount = subtotal + SHIPPING_AMOUNT;
  const subject = `Plan Inicio Capilar — ${membershipPlan.label}`;

  const supabase = getAdminDb();

  // Look up patient info from intake
  let patientId: string | null = null;
  let patientEmail = "";
  if (intake_id) {
    const { data: intake } = await supabase
      .from("intakes")
      .select("patient_id, patients(email)")
      .eq("id", intake_id)
      .single();
    if (intake) {
      patientId = intake.patient_id ?? null;
      const p = intake.patients as { email?: string } | null;
      patientEmail = p?.email ?? "";
    }
  }

  // Create order with status payment_pending
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      patient_id: patientId,
      intake_id: intake_id ?? null,
      plan: "inicio",
      amount,
      currency: "CLP",
      status: "payment_pending",
      payment_provider: "flow",
      membership_months: membershipPlan.months,
      membership_monthly_price: membershipPlan.monthlyPrice,
      shipping_amount: SHIPPING_AMOUNT,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[flow/create] insert order:", orderError);
    return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const urlReturn = `${appUrl}/checkout/return`;
  const urlConfirmation = `${appUrl}/api/payments/flow/confirm`;

  let flowResult;
  try {
    flowResult = await createFlowPayment({
      commerceOrder: order.id,
      subject,
      amount,
      email: patientEmail,
      urlReturn,
      urlConfirmation,
    });
  } catch (err) {
    console.error("[flow/create] Flow API:", err);
    await supabase
      .from("orders")
      .update({ status: "payment_failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    return NextResponse.json({ error: "Error al conectar con Flow" }, { status: 502 });
  }

  await supabase
    .from("orders")
    .update({
      provider_token: flowResult.token,
      provider_order_id: String(flowResult.flowOrder),
      status: "payment_started",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const paymentUrl = `${flowResult.url}?token=${flowResult.token}`;
  return NextResponse.json({ url: paymentUrl, order_id: order.id });
}
