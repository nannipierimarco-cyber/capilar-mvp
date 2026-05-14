import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as { intake_id?: string; doctor_id?: string };
  const { intake_id, doctor_id } = body;

  if (!intake_id || !doctor_id) {
    return NextResponse.json({ error: "intake_id y doctor_id son requeridos" }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("patient_id")
    .eq("id", intake_id)
    .single();

  if (intakeError || !intake) {
    return NextResponse.json({ error: "Intake no encontrado" }, { status: 404 });
  }

  // Upsert — unique constraint on intake_id ensures one review per intake
  const { error } = await supabase.from("medical_reviews").upsert(
    {
      intake_id,
      patient_id: (intake as { patient_id: string }).patient_id,
      doctor_id,
      status: "pending_booking",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "intake_id" }
  );

  if (error) {
    console.error("[assign-doctor] upsert error:", error);
    return NextResponse.json({ error: "Error al asignar médico" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
