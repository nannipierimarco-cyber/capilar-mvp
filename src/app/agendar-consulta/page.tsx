import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  ensureMedicalReviewBooking,
  resolveCalendlyHref,
} from "@/lib/calendly";
import { type DoctorProfile, type MedicalReview, type Patient, type Intake, type Order } from "@/lib/types";

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function AgendarConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; intake_id?: string; patient_id?: string }>;
}) {
  const { order_id, intake_id, patient_id } = await searchParams;
  const db = getAdminDb();

  let order: Order | null = null;
  let intake: (Intake & { patients: Patient | null }) | null = null;
  let review: MedicalReview | null = null;
  let doctor: DoctorProfile | null = null;
  let resolvedIntakeId = intake_id ?? null;
  let resolvedPatientId = patient_id ?? null;

  if (order_id) {
    const { data } = await db.from("orders").select("*").eq("id", order_id).maybeSingle();
    order = data as Order | null;
    if (order?.intake_id) resolvedIntakeId = order.intake_id;
    if (order?.patient_id) resolvedPatientId = order.patient_id;
  }

  if (resolvedIntakeId) {
    const { data } = await db
      .from("intakes")
      .select("*, patients(*)")
      .eq("id", resolvedIntakeId)
      .maybeSingle();
    intake = data as (Intake & { patients: Patient | null }) | null;
    if (intake?.patient_id) resolvedPatientId = intake.patient_id;
  } else if (resolvedPatientId) {
    const { data } = await db
      .from("intakes")
      .select("*, patients(*)")
      .eq("patient_id", resolvedPatientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    intake = data as (Intake & { patients: Patient | null }) | null;
    if (intake) resolvedIntakeId = intake.id;
  }

  const patient = intake?.patients ?? null;

  if (resolvedIntakeId) {
    const { data } = await db
      .from("medical_reviews")
      .select("*")
      .eq("intake_id", resolvedIntakeId)
      .maybeSingle();
    review = data as MedicalReview | null;
  }

  if (resolvedIntakeId && resolvedPatientId) {
    const booking = await ensureMedicalReviewBooking(
      db,
      resolvedIntakeId,
      resolvedPatientId,
      review
    );
    review = booking.review;
    doctor = booking.doctor;
  } else if (review?.doctor_id) {
    const { data } = await db
      .from("doctor_profiles")
      .select("*")
      .eq("id", review.doctor_id)
      .maybeSingle();
    doctor = data as DoctorProfile | null;
  }

  const isPostPayment = Boolean(order_id);
  const utmContent = resolvedIntakeId ?? order_id ?? resolvedPatientId ?? "perfecto_labs";
  const calendlyHref = resolveCalendlyHref(doctor, patient, utmContent);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-14">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Agenda tu consulta médica</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed text-sm max-w-sm mx-auto">
            {isPostPayment
              ? "Tu pago fue recibido. Ahora agenda tu revisión médica online para que un médico pueda evaluar tu caso."
              : "Tu evaluación está lista. Elige un horario disponible para tu revisión médica online."}
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <BookingCard doctor={doctor} review={review} calendlyHref={calendlyHref} />
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
          Esta agenda no garantiza receta ni tratamiento. El médico revisará tu caso y definirá si
          corresponde avanzar.
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BookingCard({
  doctor,
  review,
  calendlyHref,
}: {
  doctor: DoctorProfile | null;
  review: MedicalReview | null;
  calendlyHref: string | null;
}) {
  if (!calendlyHref) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6 leading-relaxed">
        El link de agenda aún no está disponible. Te contactaremos por WhatsApp para coordinar tu
        consulta.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {doctor?.full_name && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Médico asignado
          </p>
          <p className="font-semibold text-lg">{doctor.full_name}</p>
          {doctor.specialty && (
            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
          )}
        </div>
      )}

      {review?.consultation_scheduled_at ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <p className="font-semibold mb-0.5">Consulta ya agendada</p>
          <p>
            {new Date(review.consultation_scheduled_at).toLocaleString("es-CL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {review.calendly_event_url && (
            <a
              href={review.calendly_event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-green-700 hover:underline text-xs"
            >
              Ver detalle del evento →
            </a>
          )}
        </div>
      ) : (
        <a
          href={calendlyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-foreground text-background font-semibold rounded-full py-3.5 text-sm hover:opacity-90 transition-opacity"
        >
          Agendar consulta
        </a>
      )}
    </div>
  );
}
