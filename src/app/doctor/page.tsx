import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { type DoctorProfile, type MedicalReview, type Intake, type Patient, MEDICAL_REVIEW_STATUS_LABELS } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { DoctorCalendlyCard } from "./DoctorCalendlyCard";

function getAdminDb() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ReviewRow = MedicalReview & {
  intakes: (Intake & { patients: Patient | null }) | null;
};

const JOURNEY_LABELS: Record<string, string> = {
  treatment: "Tratamiento",
  transplant: "Trasplante",
  both: "Tratamiento + Trasplante",
};

function StatusBadge({ status }: { status: string }) {
  const label = MEDICAL_REVIEW_STATUS_LABELS[status as keyof typeof MEDICAL_REVIEW_STATUS_LABELS] ?? status;
  const colorMap: Record<string, string> = {
    pending_assignment: "bg-gray-100 text-gray-700",
    pending_booking: "bg-yellow-100 text-yellow-700",
    consultation_booked: "bg-blue-100 text-blue-700",
    pending_review: "bg-orange-100 text-orange-700",
    needs_more_info: "bg-purple-100 text-purple-700",
    approved_to_advance: "bg-green-100 text-green-700",
    not_eligible_online: "bg-red-100 text-red-700",
    referred_to_clinic: "bg-teal-100 text-teal-700",
    completed: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[status] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function StatCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default async function DoctorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor/login");
  }

  const adminDb = getAdminDb();

  const { data: profileData } = await adminDb
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-semibold text-lg mb-2">Perfil médico no encontrado</p>
          <p className="text-sm text-muted-foreground">
            Tu cuenta no tiene un perfil médico asociado. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  const doctorProfile = profileData as DoctorProfile;

  const { data: reviewsData } = await adminDb
    .from("medical_reviews")
    .select("*, intakes(*, patients(*))")
    .eq("doctor_id", doctorProfile.id)
    .order("created_at", { ascending: false });

  const reviews = (reviewsData ?? []) as ReviewRow[];

  const now = new Date();
  const pendingBooking = reviews.filter((r) =>
    ["pending_assignment", "pending_booking"].includes(r.status)
  ).length;
  const booked = reviews.filter((r) => r.status === "consultation_booked").length;
  const pendingReview = reviews.filter((r) =>
    ["pending_review", "needs_more_info"].includes(r.status)
  ).length;
  const reviewedThisMonth = reviews.filter((r) => {
    if (!r.reviewed_at) return false;
    const d = new Date(r.reviewed_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-semibold text-primary">Capilar</p>
            <h1 className="text-xl font-bold">Panel médico</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consultas y pacientes asignados para revisión.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground hidden md:block">
              Dr. {doctorProfile.full_name}
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Calendly card */}
        <DoctorCalendlyCard doctor={doctorProfile} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Pendientes de agenda" count={pendingBooking} />
          <StatCard label="Consultas agendadas" count={booked} />
          <StatCard label="Pendientes de revisión" count={pendingReview} />
          <StatCard label="Revisados este mes" count={reviewedThisMonth} />
        </div>

        {/* Patient list */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Pacientes asignados</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tienes pacientes asignados aún.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((review) => {
                const intake = review.intakes;
                const patient = intake?.patients;
                return (
                  <div
                    key={review.id}
                    className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {patient?.first_name ?? "—"} {patient?.last_name ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient?.email} · {patient?.phone}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {JOURNEY_LABELS[intake?.journey_type ?? ""] ?? intake?.journey_type ?? "—"}
                        </span>
                        <StatusBadge status={review.status} />
                        {review.consultation_scheduled_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.consultation_scheduled_at).toLocaleString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/doctor/patients/${review.intake_id}`}
                      className="text-sm font-medium text-primary hover:underline shrink-0"
                    >
                      Revisar caso →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
