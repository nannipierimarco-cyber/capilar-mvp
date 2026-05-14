import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "@/lib/admin/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function extractStoragePath(url: string): string {
  if (url.startsWith("https://")) {
    const marker = "/patient-photos/";
    const idx = url.indexOf(marker);
    return idx !== -1 ? url.slice(idx + marker.length) : url;
  }
  return url;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: patientId } = await params;

  if (!patientId) {
    return NextResponse.json({ error: "patient_id requerido" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // 1. Collect photo URLs and intake IDs before deleting
  const [
    { data: photoRows, error: photoFetchError },
    { data: intakeRows, error: intakeFetchError },
  ] = await Promise.all([
    supabase.from("photos").select("url").eq("patient_id", patientId),
    supabase.from("intakes").select("id").eq("patient_id", patientId),
  ]);

  if (photoFetchError) {
    console.error("[delete-patient] fetch photos fail:", photoFetchError);
    return NextResponse.json(
      { error: `Error al obtener fotos: ${photoFetchError.message}` },
      { status: 500 }
    );
  }
  if (intakeFetchError) {
    console.error("[delete-patient] fetch intakes fail:", intakeFetchError);
    return NextResponse.json(
      { error: `Error al obtener intakes: ${intakeFetchError.message}` },
      { status: 500 }
    );
  }

  // 2a. Delete ai_doctor_reports by intake_id (covers rows where patient_id is null)
  const intakeIds = (intakeRows ?? []).map((r) => r.id as string);
  if (intakeIds.length > 0) {
    const { error: aiByIntakeError } = await supabase
      .from("ai_doctor_reports")
      .delete()
      .in("intake_id", intakeIds);
    if (aiByIntakeError) {
      console.error("[delete-patient] ai_doctor_reports (by intake_id) delete fail:", aiByIntakeError);
      return NextResponse.json(
        { error: `Error al borrar ai_doctor_reports: ${aiByIntakeError.message}` },
        { status: 500 }
      );
    }
  }

  // 2b. Delete remaining child rows in dependency order
  const steps: Array<{ table: string; filter: string; value: string }> = [
    { table: "medical_reviews",   filter: "patient_id", value: patientId },
    { table: "orders",            filter: "patient_id", value: patientId },
    { table: "photos",            filter: "patient_id", value: patientId },
    { table: "intakes",           filter: "patient_id", value: patientId },
  ];

  for (const step of steps) {
    const { error } = await supabase
      .from(step.table)
      .delete()
      .eq(step.filter, step.value);
    if (error) {
      console.error(`[delete-patient] ${step.table} delete fail:`, error);
      return NextResponse.json(
        { error: `Error al borrar ${step.table}: ${error.message}` },
        { status: 500 }
      );
    }
  }

  // 3. Delete patient row
  const { error: patientError } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId);

  if (patientError) {
    console.error("[delete-patient] patients delete fail:", patientError);
    return NextResponse.json(
      { error: `Error al borrar paciente: ${patientError.message}` },
      { status: 500 }
    );
  }

  // 4. Delete storage files (best-effort — DB already cleaned)
  if (photoRows && photoRows.length > 0) {
    const paths = photoRows
      .map((r) => extractStoragePath(r.url as string))
      .filter(Boolean);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("patient-photos")
        .remove(paths);
      if (storageError) {
        console.error("[delete-patient] storage remove fail:", storageError);
        // Non-fatal: DB already clean; log and continue
      }
    }
  }

  return NextResponse.json({ ok: true });
}
