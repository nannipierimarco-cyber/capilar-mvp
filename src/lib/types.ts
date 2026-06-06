export type JourneyType = "treatment" | "transplant" | "both";

export type PatientStatus =
  | "lead"
  | "completed_quiz"
  | "paid"
  | "consultation_scheduled"
  | "medically_reviewed"
  | "prescription_sent"
  | "pharmacy_ordered"
  | "shipped"
  | "active_subscription"
  | "referred_to_clinic"
  | "prp_closed"
  | "transplant_closed"
  | "not_eligible";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  rut: string | null;
  email: string;
  phone: string;
  age: number | null;
  sex: "male" | "female" | null;
  city: string | null;
  source: string | null;
  consented_at: string | null;
  created_at: string;
}

export interface Intake {
  id: string;
  patient_id: string;
  journey_type: JourneyType;
  hair_loss_duration: string | null;
  main_area: string | null;
  sudden_or_gradual: string | null;
  loss_in_patches: boolean | null;
  severe_irritation: boolean | null;
  family_history: boolean | null;
  previous_treatments: string[] | null;
  goal: string | null;
  used_minoxidil: boolean | null;
  used_finasteride: boolean | null;
  used_dutasteride: boolean | null;
  had_side_effects: boolean | null;
  medical_conditions: string[] | null;
  current_medications: boolean | null;
  current_medications_note: string | null;
  drug_allergies: boolean | null;
  drug_allergies_note: string | null;
  heart_disease: boolean | null;
  liver_disease: boolean | null;
  kidney_disease: boolean | null;
  prostate_history: boolean | null;
  planning_children: boolean | null;
  is_pregnant_or_lactating: boolean | null;
  previous_transplant: boolean | null;
  loss_severity: "mild" | "moderate" | "advanced" | null;
  transplant_timing: string | null;
  budget_range: string | null;
  financing_interest: boolean | null;
  transplant_priority: string | null;
  prp_interest: boolean | null;
  hair_pattern: string | null;
  status: PatientStatus;
  admin_notes: string | null;
  created_at: string;
  patients?: Patient;
}

export interface Photo {
  id: string;
  patient_id: string;
  intake_id: string;
  type: "frontal" | "temples" | "crown" | "side";
  url: string;
  created_at: string;
}

export interface QuizData {
  journeyType: JourneyType | null;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phone: string;
  age: string;
  sex: "male" | "female" | "";
  hairLossDuration: string;
  suddenOrGradual: "gradual" | "sudden" | "";
  severeIrritation: boolean | null;
  familyHistory: boolean | null;
  previousTreatments: string[];
  usedMinoxidil: boolean | null;
  usedFinasteride: boolean | null;
  usedDutasteride: boolean | null;
  hadSideEffects: boolean | null;
  medicalConditions: string[];
  currentMedications: boolean | null;
  currentMedicationsNote: string;
  drugAllergies: boolean | null;
  drugAllergiesNote: string;
  heartDisease: boolean | null;
  liverDisease: boolean | null;
  kidneyDisease: boolean | null;
  prostateHistory: boolean | null;
  planningChildren: boolean | null;
  isPregnantOrLactating: boolean | null;
  openToClinicalEval: boolean | null;
  hairPattern: string;
  previousTransplant: boolean | null;
  lossSeverity: "mild" | "moderate" | "advanced" | "";
  transplantTiming: string;
  budgetRange: string;
  financingInterest: boolean | null;
  transplantPriority: string;
  prpInterest: boolean | null;
  photoFrontal: File | null;
  photoTemples: File | null;
  photoCrown: File | null;
  photoSide: File | null;
  consented: boolean;
}

export const INITIAL_QUIZ_DATA: QuizData = {
  journeyType: null,
  firstName: "",
  lastName: "",
  nationalId: "",
  email: "",
  phone: "",
  age: "",
  sex: "",
  hairLossDuration: "",
  suddenOrGradual: "",
  severeIrritation: null,
  familyHistory: null,
  previousTreatments: [],
  usedMinoxidil: null,
  usedFinasteride: null,
  usedDutasteride: null,
  hadSideEffects: null,
  medicalConditions: [],
  currentMedications: null,
  currentMedicationsNote: "",
  drugAllergies: null,
  drugAllergiesNote: "",
  heartDisease: null,
  liverDisease: null,
  kidneyDisease: null,
  prostateHistory: null,
  planningChildren: null,
  isPregnantOrLactating: null,
  openToClinicalEval: null,
  hairPattern: "",
  previousTransplant: null,
  lossSeverity: "",
  transplantTiming: "",
  budgetRange: "",
  financingInterest: null,
  transplantPriority: "",
  prpInterest: null,
  photoFrontal: null,
  photoTemples: null,
  photoCrown: null,
  photoSide: null,
  consented: false,
};

export const STATUS_LABELS: Record<PatientStatus, string> = {
  lead: "Lead",
  completed_quiz: "Quiz completo",
  paid: "Pagado",
  consultation_scheduled: "Consulta agendada",
  medically_reviewed: "Revisado",
  prescription_sent: "Receta enviada",
  pharmacy_ordered: "En farmacia",
  shipped: "Despachado",
  active_subscription: "Suscripción activa",
  referred_to_clinic: "Derivado a clínica",
  prp_closed: "PRP cerrado",
  transplant_closed: "Trasplante cerrado",
  not_eligible: "No apto",
};

export interface PhotoObservation {
  received_photos: string[];
  photo_quality: "buena" | "media" | "baja" | "insuficiente";
  visible_areas_to_review: string[];
  consistency_with_answers: string;
  recommended_additional_photos: string[];
  photo_observation_summary: string;
}

export interface AiDoctorReport {
  id: string;
  patient_id: string | null;
  intake_id: string;
  summary_for_doctor: string | null;
  preliminary_route: string | null;
  risk_level: string | null;
  red_flags: string[] | null;
  doctor_questions: string[] | null;
  possible_considerations: string[] | null;
  operational_next_step: string | null;
  patient_facing_copy_suggestion: string | null;
  internal_note: string | null;
  model_name: string | null;
  photo_observation: PhotoObservation | null;
  created_at: string;
}

// ── Doctor Portal ────────────────────────────────────────────

export type MedicalReviewStatus =
  | "pending_assignment"
  | "pending_booking"
  | "consultation_booked"
  | "pending_review"
  | "needs_more_info"
  | "approved_to_advance"
  | "not_eligible_online"
  | "referred_to_clinic"
  | "completed";

export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  vertical: "dental" | "hair" | "skin" | null;
  license_number: string | null;
  calendly_url: string | null;
  calendly_event_type_uri: string | null;
  calendly_user_uri: string | null;
  calendly_is_active: boolean;
  availability_notes: string | null;
  max_consultations_per_day: number | null;
  is_active: boolean;
  created_at: string;
}

export interface MedicalReview {
  id: string;
  patient_id: string;
  intake_id: string;
  doctor_id: string | null;
  status: MedicalReviewStatus;
  medical_decision: string | null;
  doctor_notes: string | null;
  consultation_scheduled_at: string | null;
  calendly_event_url: string | null;
  calendly_event_uri: string | null;
  calendly_invitee_uri: string | null;
  calendly_invitee_email: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const MEDICAL_REVIEW_STATUS_LABELS: Record<MedicalReviewStatus, string> = {
  pending_assignment: "Pendiente de asignación",
  pending_booking: "Pendiente de agenda",
  consultation_booked: "Consulta agendada",
  pending_review: "Revisión pendiente",
  needs_more_info: "Solicitar más información",
  approved_to_advance: "Corresponde avanzar con tratamiento",
  not_eligible_online: "No corresponde avanzar por este flujo",
  referred_to_clinic: "Derivar a evaluación clínica",
  completed: "Consulta completada",
};

// ── Orders / Payments ────────────────────────────────────────

export type OrderStatus =
  | "payment_pending"
  | "payment_started"
  | "paid_pending_medical_review"
  | "payment_failed"
  | "refund_pending"
  | "refunded"
  | "cancelled";

export interface Order {
  id: string;
  patient_id: string | null;
  intake_id: string | null;
  plan: string | null;
  amount: number | null;
  currency: string;
  status: OrderStatus;
  payment_provider: string | null;
  provider_order_id: string | null;
  provider_token: string | null;
  provider_payment_id: string | null;
  provider_status: string | null;
  paid_at: string | null;
  refund_requested_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  payment_pending: "Pago pendiente",
  payment_started: "Pago iniciado",
  paid_pending_medical_review: "Pagado — pendiente de revisión médica",
  payment_failed: "Pago fallido",
  refund_pending: "Reembolso pendiente",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

// ── Skin Assessment ──────────────────────────────────────────

export type SkinPriority = "urgent_review" | "high" | "normal";

export interface SkinAssessment {
  id: string;
  created_at: string;
  assessment_type: string;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  sex_at_birth: string | null;
  country: string | null;
  city: string | null;
  main_concern: string | null;
  skin_category: string | null;
  affected_areas: string[] | null;
  duration: string | null;
  progression: string | null;
  lesion_description: string[] | null;
  concern_score: number | null;
  symptoms: string[] | null;
  current_routine: string[] | null;
  active_ingredients_frequency: string | null;
  irritation_from_routine: string | null;
  previous_treatments: string[] | null;
  previous_treatment_response: string | null;
  pregnancy_status: string | null;
  medical_conditions: string[] | null;
  current_medications: string | null;
  allergies: string | null;
  red_flags: string[] | null;
  main_goal: string | null;
  preference: string | null;
  additional_notes: string | null;
  photo_urls: string[] | null;
  product_photo_urls: string[] | null;
  priority: SkinPriority | null;
  status: string;
  doctor_summary: string | null;
  raw_answers: Record<string, unknown> | null;
}

export const STATUS_COLORS: Record<PatientStatus, string> = {
  lead: "bg-gray-100 text-gray-700",
  completed_quiz: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  consultation_scheduled: "bg-yellow-100 text-yellow-700",
  medically_reviewed: "bg-teal-100 text-teal-700",
  prescription_sent: "bg-cyan-100 text-cyan-700",
  pharmacy_ordered: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  active_subscription: "bg-green-100 text-green-700",
  referred_to_clinic: "bg-orange-100 text-orange-700",
  prp_closed: "bg-lime-100 text-lime-700",
  transplant_closed: "bg-emerald-200 text-emerald-800",
  not_eligible: "bg-red-100 text-red-700",
};

export interface HairMapDensityZone {
  level: "alta" | "media" | "baja" | "muy_baja";
  color_hex: string;
  notes: string;
}

export interface HairMapPhotoAnnotation {
  label: string;
  position: string;
}

export interface HairMapRiskArea {
  zone: string;
  level: "bajo" | "medio" | "alto";
  dots: number;
}

export interface HairMapZoneAnnotation {
  zone: string;
  label: string;
  status: string;
  state: "ok" | "warning" | "alert";
  icon: string;
}

export interface HairMapReport {
  patient: {
    hair_type: string;
    norwood_stage: number;
    norwood_label: string;
    report_id: string;
  };
  photo_annotations: {
    frontal: HairMapPhotoAnnotation[];
    coronilla: HairMapPhotoAnnotation[];
  };
  density_map: {
    zones: {
      frontal: HairMapDensityZone;
      vertex: HairMapDensityZone;
      coronilla: HairMapDensityZone;
      occipital: HairMapDensityZone;
      entrada_izq: HairMapDensityZone;
      entrada_der: HairMapDensityZone;
    };
    density_comparison: {
      zone_a_label: string;
      zone_b_label: string;
      summary: string;
    };
  };
  evaluation_summary: {
    hair_type:        { value: string; detail: string };
    density:          { value: string; detail: string };
    hairline:         { value: string; detail: string };
    scalp_condition:  { value: string; detail: string };
    texture:          { value: string; detail: string };
    crown_coverage:   { value: string; detail: string };
    scalp_visibility: { value: string; detail: string };
    overall_health:   { value: string; detail: string };
  };
  selectors: {
    hair_type:       { options: string[]; selected: string };
    density:         { options: string[]; selected: string; note: string };
    hairline:        { options: string[]; selected: string };
    scalp_condition: { options: string[]; selected: string; note: string };
    risk_areas: HairMapRiskArea[];
  };
  zone_annotations: HairMapZoneAnnotation[];
  follicular_health: {
    shaft_caliber: string;
    sebum_level: string;
    scalp_inflammation: string;
    visible_miniaturization: boolean;
    estimated_density_hairs_per_cm2: string;
    notes: string;
  };
  clinical_next_steps: {
    priority:    { action: string; description: string };
    recommended: { action: string; description: string };
    optional:    { action: string; description: string };
    long_term:   { action: string; description: string };
  };
  disclaimer: string;
}
