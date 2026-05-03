import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type MedicalReviewStatus } from "@/lib/types";

const FINAL_STATUSES: MedicalReviewStatus[] = [
  "approved_to_advance",
  "not_eligible_online",
  "referred_to_clinic",
  "completed",
];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // 1. Verify Supabase Auth session
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getAdminClient();

  // 2. Look up doctor profile
  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctorProfile) {
    return NextResponse.json({ error: "Perfil médico no encontrado" }, { status: 403 });
  }

  // 3. Parse and validate body
  const body = await req.json() as {
    review_id?: string;
    status?: string;
    medical_decision?: string;
    doctor_notes?: string;
  };
  const { review_id, status, medical_decision, doctor_notes } = body;

  if (!review_id || !status) {
    return NextResponse.json({ error: "review_id y status son requeridos" }, { status: 400 });
  }

  // 4. Verify the review belongs to this doctor and get intake_id
  const { data: review } = await supabase
    .from("medical_reviews")
    .select("id, doctor_id, intake_id")
    .eq("id", review_id)
    .single();

  if (!review || review.doctor_id !== (doctorProfile as { id: string }).id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // 5. Set reviewed_at only for final decisions
  const isFinal = FINAL_STATUSES.includes(status as MedicalReviewStatus);
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status,
    medical_decision: medical_decision ?? null,
    doctor_notes: doctor_notes ?? null,
    updated_at: now,
  };
  if (isFinal) {
    updatePayload.reviewed_at = now;
  }

  const { error } = await supabase
    .from("medical_reviews")
    .update(updatePayload)
    .eq("id", review_id);

  if (error) {
    console.error("[doctor/review] update error:", error);
    return NextResponse.json({ error: "Error al guardar decisión" }, { status: 500 });
  }

  // 6. When doctor marks not_eligible_online, flag paid order for refund
  if (status === "not_eligible_online" && review.intake_id) {
    const { data: paidOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("intake_id", review.intake_id)
      .eq("status", "paid_pending_medical_review")
      .maybeSingle();

    if (paidOrder) {
      await supabase
        .from("orders")
        .update({
          status: "refund_pending",
          refund_requested_at: now,
          updated_at: now,
        })
        .eq("id", paidOrder.id);
    }
  }

  return NextResponse.json({ ok: true });
}
