import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin/auth";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import {
  type Intake,
  type Patient,
  type Photo,
  type AiDoctorReport,
  type DoctorProfile,
  type MedicalReview,
  type Order,
  ORDER_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/types";
import { displayNationalId } from "@/lib/utils";
import { StatusUpdater } from "./StatusUpdater";
import { AiReportSection } from "./AiReportSection";
import { DoctorAssigner } from "./DoctorAssigner";
import { DeletePatientButton } from "./DeletePatientButton";

const JOURNEY_LABELS = {
  treatment: "Tratamiento",
  transplant: "Trasplante",
  both: "Tratamiento + Trasplante",
};

const PHOTO_LABELS = {
  frontal: "Frontal",
  temples: "Entradas",
  crown: "Coronilla",
  side: "Lateral",
};

function getAdminDb() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const supabase = await createClient();
  const adminDb = getAdminDb();

  const { data: intake, error } = await supabase
    .from("intakes")
    .select("*, patients(*)")
    .eq("id", id)
    .single();

  if (error || !intake) notFound();

  const [
    { data: photos },
    { data: aiReports },
    { data: doctors },
    { data: reviewData },
    { data: orderData },
  ] = await Promise.all([
    supabase.from("photos").select("*").eq("intake_id", id),
    supabase.from("ai_doctor_reports").select("*").eq("intake_id", id).order("created_at", { ascending: false }).limit(1),
    adminDb.from("doctor_profiles").select("*").eq("is_active", true).order("full_name"),
    adminDb.from("medical_reviews").select("*").eq("intake_id", id).maybeSingle(),
    adminDb.from("orders").select("*").eq("intake_id", id).order("created_at", { ascending: false }).limit(1),
  ]);

  const row = intake as Intake & { patients: Patient };
  const photoList = (photos ?? []) as Photo[];
  const aiReport = (aiReports?.[0] ?? null) as AiDoctorReport | null;
  const doctorList = (doctors ?? []) as DoctorProfile[];
  const currentReview = (reviewData ?? null) as MedicalReview | null;
  const currentOrder = (orderData?.[0] ?? null) as Order | null;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Admin
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {row.patients?.first_name} {row.patients?.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">{row.patients?.email}</p>
          </div>
          <DeletePatientButton
            patientId={row.patients?.id}
            patientName={`${row.patients?.first_name ?? ""} ${row.patients?.last_name ?? ""}`.trim()}
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <InfoCard
            label="RUT / ID"
            value={displayNationalId(row.patients?.rut, row.admin_notes)}
          />
          <InfoCard label="Teléfono" value={row.patients?.phone ?? "—"} />
          <InfoCard
            label="Edad / Sexo"
            value={`${row.patients?.age ?? "—"} / ${row.patients?.sex === "male" ? "Hombre" : row.patients?.sex === "female" ? "Mujer" : "—"}`}
          />
          <InfoCard
            label="Ruta"
            value={JOURNEY_LABELS[row.journey_type] ?? row.journey_type}
          />
          <InfoCard label="Patrón visual" value={row.hair_pattern ?? row.main_area ?? "—"} />
          <InfoCard label="Duración caída" value={row.hair_loss_duration ?? "—"} />
          <InfoCard label="Objetivo" value={row.goal ?? "—"} />
          <InfoCard
            label="Antecedentes familiares"
            value={row.family_history === true ? "Sí" : row.family_history === false ? "No" : "—"}
          />
          <InfoCard
            label="Fecha"
            value={new Date(row.created_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
        </div>

        {(row.journey_type === "treatment" || row.journey_type === "both") && (
          <Section title="Screening médico">
            {row.medical_conditions && row.medical_conditions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground font-medium mb-1.5">
                  Condiciones médicas declaradas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {row.medical_conditions.map((c: string) => (
                    <span
                      key={c}
                      className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MedicalFlag label="Minoxidil previo" value={row.used_minoxidil} />
              <MedicalFlag label="Finasteride previo" value={row.used_finasteride} />
              <MedicalFlag label="Dutasteride previo" value={row.used_dutasteride} />
              <MedicalFlag label="Efectos secundarios" value={row.had_side_effects} warn />
              <MedicalFlag label="Medicamentos actuales" value={row.current_medications} warn />
              <MedicalFlag label="Alergias" value={row.drug_allergies} warn />
              <MedicalFlag label="Enfermedad cardíaca" value={row.heart_disease} warn />
              <MedicalFlag label="Enfermedad hepática" value={row.liver_disease} warn />
              <MedicalFlag label="Enfermedad renal" value={row.kidney_disease} warn />
            </div>
            {row.current_medications_note && (
              <p className="mt-2 text-sm">
                <strong>Medicamentos:</strong> {row.current_medications_note}
              </p>
            )}
            {row.drug_allergies_note && (
              <p className="mt-1 text-sm">
                <strong>Alergias:</strong> {row.drug_allergies_note}
              </p>
            )}
          </Section>
        )}

        {(row.journey_type === "transplant" || row.journey_type === "both") && (
          <Section title="Evaluación de trasplante">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoCard
                label="Severidad"
                value={
                  row.loss_severity === "mild"
                    ? "Leve"
                    : row.loss_severity === "moderate"
                    ? "Moderada"
                    : row.loss_severity === "advanced"
                    ? "Avanzada"
                    : "—"
                }
              />
              <InfoCard label="Timing" value={row.transplant_timing ?? "—"} />
              <InfoCard label="Presupuesto" value={row.budget_range ?? "—"} />
              <InfoCard label="Prioridad" value={row.transplant_priority ?? "—"} />
              <InfoCard
                label="Financiamiento"
                value={
                  row.financing_interest === true
                    ? "Sí"
                    : row.financing_interest === false
                    ? "No"
                    : "—"
                }
              />
              <InfoCard
                label="Interés en PRP"
                value={
                  row.prp_interest === true ? "Sí" : row.prp_interest === false ? "No" : "—"
                }
              />
            </div>
          </Section>
        )}

        {photoList.length > 0 && (
          <Section title="Fotos">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photoList.map((photo) => (
                <div key={photo.id} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {PHOTO_LABELS[photo.type] ?? photo.type}
                  </p>
                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={photo.url}
                      alt={photo.type}
                      width={200}
                      height={200}
                      className="rounded-xl object-cover w-full aspect-square hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              ))}
            </div>
          </Section>
        )}

        <AiReportSection intakeId={id} report={aiReport} />

        {/* Payment status */}
        {currentOrder ? (
          <Section title="Pago">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado del pago</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    currentOrder.status === "paid_pending_medical_review"
                      ? "bg-green-100 text-green-800"
                      : currentOrder.status === "refund_pending"
                      ? "bg-orange-100 text-orange-800"
                      : currentOrder.status === "refunded"
                      ? "bg-blue-100 text-blue-800"
                      : currentOrder.status === "payment_failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ORDER_STATUS_LABELS[currentOrder.status] ?? currentOrder.status}
                </span>
              </div>
              {currentOrder.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monto</span>
                  <span className="text-sm font-semibold">
                    ${currentOrder.amount.toLocaleString("es-CL")} {currentOrder.currency}
                  </span>
                </div>
              )}
              {currentOrder.paid_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagado el</span>
                  <span className="text-sm font-semibold">
                    {new Date(currentOrder.paid_at).toLocaleString("es-CL")}
                  </span>
                </div>
              )}
              {currentOrder.status === "refund_pending" && (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-orange-800">
                    Reembolso pendiente — procesar manualmente en Flow
                  </p>
                  {currentOrder.refund_requested_at && (
                    <p className="text-xs text-orange-700 mt-1">
                      Solicitado el{" "}
                      {new Date(currentOrder.refund_requested_at).toLocaleString("es-CL")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>
        ) : null}

        <DoctorAssigner intakeId={id} doctors={doctorList} currentReview={currentReview} />

        <StatusUpdater intakeId={id} currentStatus={row.status} currentNotes={row.admin_notes ?? ""} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="font-semibold text-sm mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MedicalFlag({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: boolean | null;
  warn?: boolean;
}) {
  const isYes = value === true;
  const isNo = value === false;
  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold mt-0.5 ${
          isYes && warn ? "text-orange-600" : isYes ? "text-foreground" : isNo ? "text-muted-foreground" : "text-muted-foreground"
        }`}
      >
        {isYes ? "Sí" : isNo ? "No" : "—"}
      </p>
    </div>
  );
}
