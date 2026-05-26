import type { SupabaseClient } from "@supabase/supabase-js";
import type { DoctorProfile, MedicalReview, Patient } from "@/lib/types";

export function buildCalendlyUrl(
  baseUrl: string,
  patient: Patient | null,
  utmContent: string
): string {
  if (!patient) return baseUrl;
  const params = new URLSearchParams({
    name: `${patient.first_name} ${patient.last_name}`.trim(),
    email: patient.email,
    utm_source: "perfecto_labs",
    utm_campaign: "medical_review",
    utm_content: utmContent,
  });
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${params.toString()}`;
}

export function getDefaultCalendlyUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_DEFAULT_CALENDLY_URL?.trim();
  return url || null;
}

/** Assigns first available doctor with Calendly when intake has no medical review yet. */
export async function ensureMedicalReviewBooking(
  db: SupabaseClient,
  intakeId: string,
  patientId: string,
  existingReview: MedicalReview | null
): Promise<{ review: MedicalReview | null; doctor: DoctorProfile | null }> {
  if (existingReview?.doctor_id) {
    const { data } = await db
      .from("doctor_profiles")
      .select("*")
      .eq("id", existingReview.doctor_id)
      .maybeSingle();
    return {
      review: existingReview,
      doctor: (data as DoctorProfile | null) ?? null,
    };
  }

  let doctor: DoctorProfile | null = null;

  const preferredId = process.env.DEFAULT_DOCTOR_ID?.trim();
  if (preferredId) {
    const { data } = await db
      .from("doctor_profiles")
      .select("*")
      .eq("id", preferredId)
      .eq("is_active", true)
      .maybeSingle();
    doctor = data as DoctorProfile | null;
  }

  if (!doctor?.calendly_url) {
    const { data } = await db
      .from("doctor_profiles")
      .select("*")
      .eq("is_active", true)
      .not("calendly_url", "is", null)
      .order("full_name")
      .limit(1)
      .maybeSingle();
    doctor = data as DoctorProfile | null;
  }

  if (!doctor?.calendly_url) {
    return { review: existingReview, doctor: null };
  }

  const { data: review, error } = await db
    .from("medical_reviews")
    .upsert(
      {
        intake_id: intakeId,
        patient_id: patientId,
        doctor_id: doctor.id,
        status: "pending_booking",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "intake_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[ensureMedicalReviewBooking] upsert error:", error);
    return { review: existingReview, doctor };
  }

  return { review: review as MedicalReview, doctor };
}

export function resolveCalendlyHref(
  doctor: DoctorProfile | null,
  patient: Patient | null,
  utmContent: string
): string | null {
  const base = doctor?.calendly_url?.trim() || getDefaultCalendlyUrl();
  if (!base) return null;
  return buildCalendlyUrl(base, patient, utmContent);
}
