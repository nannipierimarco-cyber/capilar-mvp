import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import {
  type DoctorProfile,
  type MedicalReview,
  type Intake,
  type Patient,
  type Photo,
  type AiDoctorReport,
  MEDICAL_REVIEW_STATUS_LABELS,
} from "@/lib/types";
import { displayNationalId } from "@/lib/utils";
import { LogoutButton } from "../../LogoutButton";
import { DoctorAiReportView } from "./DoctorAiReportView";
import { MedicalReviewForm } from "./MedicalReviewForm";

function getAdminDb() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const JOURNEY_LABELS: Record<string, string> = {
  treatment: "Tratamiento",
  transplant: "Trasplante",
  both: "Tratamiento + Trasplante",
};

const PHOTO_LABELS: Record<string, string> = {
  frontal: "Frontal",
  temples: "Entradas",
  crown: "Coronilla",
  side: "Lateral",
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3">
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

function BoolRow({ label, value, warn = false }: { label: string; value: boolean | null; warn?: boolean }) {
  const isYes = value === true;
  return (
    <div className="flex justify-between items-center py-1 text-sm border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${isYes && warn ? "text-orange-600" : ""}`}>
        {isYes ? "Sí" : value === false ? "No" : "—"}
      </span>
    </div>
  );
}

export default async function DoctorPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/doctor/login");

  const { id: intakeId } = await params;
  const adminDb = getAdminDb();

  // 2. Get doctor profile
  const { data: profileData } = await adminDb
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profileData) redirect("/doctor");
  const doctorProfile = profileData as DoctorProfile;

  // 3. Find the medical_review for this intake assigned to this doctor
  const { data: reviewData } = await adminDb
    .from("medical_reviews")
    .select("*")
    .eq("intake_id", intakeId)
    .eq("doctor_id", doctorProfile.id)
    .maybeSingle();

  if (!reviewData) {
    // This intake is not assigned to this doctor
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-semibold text-lg mb-2">Acceso denegado</p>
          <p className="text-sm text-muted-foreground mb-4">
            Este caso no está asignado a tu cuenta.
          </p>
          <Link href="/doctor" className="text-sm text-primary hover:underline">
            ← Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  const review = reviewData as MedicalReview;

  // 4. Fetch all patient data using service role
  const [
    { data: intakeData },
    { data: photosData },
    { data: aiReportsData },
  ] = await Promise.all([
    adminDb.from("intakes").select("*, patients(*)").eq("id", intakeId).single(),
    adminDb.from("photos").select("*").eq("intake_id", intakeId),
    adminDb
      .from("ai_doctor_reports")
      .select("*")
      .eq("intake_id", intakeId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!intakeData) redirect("/doctor");

  const intake = intakeData as Intake & { patients: Patient };
  const patient = intake.patients;
  const photos = (photosData ?? []) as Photo[];
  const aiReport = (aiReportsData?.[0] ?? null) as AiDoctorReport | null;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/doctor" className="text-sm text-muted-foreground hover:text-foreground">
              ← Panel
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {patient?.first_name} {patient?.last_name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {JOURNEY_LABELS[intake.journey_type] ?? intake.journey_type}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* A. Patient summary */}
        <Section title="Resumen del paciente">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCard label="Nombre" value={`${patient?.first_name ?? "—"} ${patient?.last_name ?? ""}`} />
            <InfoCard
              label="RUT / ID"
              value={displayNationalId(patient?.rut, intake.admin_notes)}
            />
            <InfoCard label="Email" value={patient?.email ?? "—"} />
            <InfoCard label="Teléfono" value={patient?.phone ?? "—"} />
            <InfoCard
              label="Edad / Sexo"
              value={`${patient?.age ?? "—"} / ${patient?.sex === "male" ? "Hombre" : patient?.sex === "female" ? "Mujer" : "—"}`}
            />
            <InfoCard
              label="Fecha de registro"
              value={new Date(intake.created_at).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </Section>

        {/* B. Consultation status */}
        <Section title="Estado de consulta">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado actual</span>
              <span className="text-sm font-semibold">
                {MEDICAL_REVIEW_STATUS_LABELS[review.status] ?? review.status}
              </span>
            </div>
            {review.consultation_scheduled_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consulta agendada</span>
                <span className="text-sm font-semibold">
                  {new Date(review.consultation_scheduled_at).toLocaleString("es-CL")}
                </span>
              </div>
            )}
            {review.calendly_event_url && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Evento Calendly</span>
                <a
                  href={review.calendly_event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Ver evento →
                </a>
              </div>
            )}
            {doctorProfile.calendly_url && !review.consultation_scheduled_at && (
              <div className="pt-2">
                <a
                  href={doctorProfile.calendly_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  Agendar consulta →
                </a>
                {/* TODO Phase 2: integrate Calendly webhooks/API to automatically update
                    consultation_scheduled_at and calendly_event_url after patient books. */}
              </div>
            )}
          </div>
        </Section>

        {/* C. Intake answers */}
        <Section title="Respuestas del cuestionario">
          <div className="space-y-0">

            <div className="flex justify-between items-center py-1 text-sm border-b border-border/50">
              <span className="text-muted-foreground">Patrón visual declarado</span>
              <span className="font-medium">{intake.hair_pattern ?? intake.main_area ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm border-b border-border/50">
              <span className="text-muted-foreground">Duración de la caída</span>
              <span className="font-medium">{intake.hair_loss_duration ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm border-b border-border/50">
              <span className="text-muted-foreground">Patrón de inicio</span>
              <span className="font-medium">{intake.sudden_or_gradual ?? "—"}</span>
            </div>
            <BoolRow label="Caída en parches" value={intake.loss_in_patches} warn />
            <BoolRow label="Irritación severa del cuero cabelludo" value={intake.severe_irritation} warn />
            <BoolRow label="Antecedentes familiares de caída" value={intake.family_history} />
            <div className="flex justify-between items-center py-1 text-sm border-b border-border/50">
              <span className="text-muted-foreground">Objetivo</span>
              <span className="font-medium">{intake.goal ?? "—"}</span>
            </div>
            {Array.isArray(intake.previous_treatments) && intake.previous_treatments.length > 0 && (
              <div className="flex justify-between items-center py-1 text-sm border-b border-border/50">
                <span className="text-muted-foreground">Tratamientos previos</span>
                <span className="font-medium">{intake.previous_treatments.join(", ")}</span>
              </div>
            )}
          </div>

          {(intake.journey_type === "treatment" || intake.journey_type === "both") && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Screening médico
              </p>
              <div className="space-y-0">
                <BoolRow label="Uso previo de minoxidil" value={intake.used_minoxidil} />
                <BoolRow label="Uso previo de finasteride" value={intake.used_finasteride} />
                <BoolRow label="Uso previo de dutasteride" value={intake.used_dutasteride} />
                <BoolRow label="Efectos secundarios previos" value={intake.had_side_effects} warn />
                <BoolRow label="Medicamentos actuales" value={intake.current_medications} warn />
                <BoolRow label="Alergias a medicamentos" value={intake.drug_allergies} warn />
                <BoolRow label="Enfermedad cardíaca" value={intake.heart_disease} warn />
                <BoolRow label="Enfermedad hepática" value={intake.liver_disease} warn />
                <BoolRow label="Enfermedad renal" value={intake.kidney_disease} warn />
                <BoolRow label="Antecedentes prostáticos" value={intake.prostate_history} warn />
                <BoolRow label="Planea tener hijos pronto" value={intake.planning_children} warn />
                <BoolRow label="Embarazada o lactando" value={intake.is_pregnant_or_lactating} warn />
              </div>
              {intake.current_medications_note && (
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Medicamentos:</strong> {intake.current_medications_note}
                </p>
              )}
              {intake.drug_allergies_note && (
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Alergias:</strong> {intake.drug_allergies_note}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* D. Photos */}
        {photos.length > 0 && (
          <Section title="Fotos del paciente">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
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

        {/* E. AI preliminary report */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-1">Informe preliminar AI</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Este informe fue generado por AI como apoyo preliminar. No constituye diagnóstico,
            prescripción ni aprobación de tratamiento. Debe ser revisado por el médico.
          </p>
          {aiReport ? (
            <DoctorAiReportView report={aiReport} />
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Informe AI pendiente de generación.
            </p>
          )}
        </div>

        {/* F. Medical decision form */}
        <Section title="Decisión médica">
          <MedicalReviewForm review={review} />
        </Section>

      </div>
    </div>
  );
}
