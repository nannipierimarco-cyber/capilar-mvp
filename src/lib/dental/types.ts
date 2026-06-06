// ─── Dental Care — tipos y constantes ────────────────────────────────────────

export interface DentalQuizAnswers {
  motivoPrincipal: "dolor" | "estetica" | "encias" | "mal_aliento" | "revision" | "";
  dolorReciente: "frecuente" | "ocasional" | "frio_dulce" | "no" | "";
  ultimaVisita: "menos_6m" | "6_12m" | "1_3a" | "mas_3a" | "";
  enciasNgran: "siempre" | "aveces" | "rara_vez" | "nunca" | "";
  sensibilidad: "intensa" | "leve" | "solo_frio" | "no" | "";
  colorDientes: "muy_amarillos" | "algo_amarillos" | "manchas" | "conforme" | "";
  interesTratamiento: "mucho" | "si_pero_no_se" | "si_si_no_caro" | "solo_saber" | "";
  historialMedico: "si" | "no" | "prefiero_no" | "";
}

export type DentalAnswerKey = keyof DentalQuizAnswers;

export interface DentalLead {
  nombre: string;
  telefono: string;
  email: string;
}

// ─── New visual-first schema (dental_visual_v1_2026_05_27) ────────────────────

export type VisualLevel = "favorable" | "mild_attention" | "moderate_attention" | "review_suggested";
export type VisualRiskLevel = "low" | "medium" | "high";
export type DashboardLevel = "low" | "medium" | "high";

export interface VisualFinding {
  key: "alignment" | "color" | "gum_visibility" | "spacing" | "crowding" | "bite_visible" | "wear" | "general";
  label: string;
  visualLevel: VisualLevel;
  description: string;
}

export interface ZoneAnalysis {
  zone: "front_smile" | "front_bite" | "right_side" | "left_side" | "upper_arch" | "lower_arch";
  score: number;
  label: string;
  description: string;
}

export interface VisualDashboard {
  alignment: DashboardLevel;
  smileAesthetics: DashboardLevel;
  symmetry: DashboardLevel;
  apparentColor: DashboardLevel;
  visibleBite: DashboardLevel;
  gums: DashboardLevel;
  generalVisualState: DashboardLevel;
}

// ─── v2 schema additions (dental_precotizacion_v2) ───────────────────────────

export type TreatmentKey = "cleaning" | "whitening" | "orthodontics" | "veneers" | "implant" | "restoration" | "crown" | "gums" | "other";
export type ComplexityLevel = "low" | "medium" | "high";

export interface TreatmentOptionAI {
  key: TreatmentKey;
  label: string;
  whyItMayApply: string;
  whatDentistMustConfirm: string;
  estimatedPriceRangeCLP: { min: number; max: number; label: string };
  complexity: ComplexityLevel;
  priority: ComplexityLevel;
  disclaimer: string;
}

export interface PreliminaryInterpretation {
  headline: string;
  description: string;
  confidenceNote: string;
}

export interface PriceSummary {
  headline: string;
  description: string;
  ranges: Array<{ label: string; range: string; whenItApplies: string }>;
}

export interface CostDriver {
  factor: string;
  description: string;
}

// ─── Core report type ─────────────────────────────────────────────────────────

export interface DentalMapReport {
  promptVersion: string;
  summary: {
    visualScore: number;
    visualRiskLevel: VisualRiskLevel;
    headline: string;
    subheadline: string;
  };
  visualFindings: VisualFinding[];
  zoneAnalysis: ZoneAnalysis[];
  visualDashboard: VisualDashboard;
  nextStep: {
    title: string;
    description: string;
    ctaLabel: string;
  };
  disclaimer: string;
  // v2 optional fields
  patientGoal?: { mainConcern: string; priority: string };
  preliminaryInterpretation?: PreliminaryInterpretation;
  treatmentOptions?: TreatmentOptionAI[];
  priceSummary?: PriceSummary;
  costDrivers?: CostDriver[];
  consultationCTA?: { title: string; description: string; ctaLabel: string };
  photoQualityDisclaimer?: string;
}

// ─── Quiz scoring (independent of AI report) ─────────────────────────────────

export interface DentalScoreResult {
  score: number;
  urgencyScore: number;
  paymentPropensity: number;
  category: "preventivo" | "correctivo_leve" | "correctivo_urgente";
  label: string;
  color: string;
  cta: string;
}

export function calculateDentalScore(answers: DentalQuizAnswers): DentalScoreResult {
  let urgency = 0;
  let payment = 0;
  if (answers.motivoPrincipal === "dolor") urgency += 30;
  if (answers.motivoPrincipal === "encias") urgency += 20;
  if (answers.dolorReciente === "frecuente") urgency += 25;
  else if (answers.dolorReciente === "ocasional") urgency += 15;
  else if (answers.dolorReciente === "frio_dulce") urgency += 10;
  if (answers.ultimaVisita === "mas_3a") urgency += 20;
  else if (answers.ultimaVisita === "1_3a") urgency += 10;
  if (answers.enciasNgran === "siempre") urgency += 15;
  else if (answers.enciasNgran === "aveces") urgency += 8;
  if (answers.sensibilidad === "intensa") urgency += 15;
  else if (answers.sensibilidad === "leve") urgency += 8;
  if (answers.interesTratamiento === "mucho") payment += 40;
  else if (answers.interesTratamiento === "si_pero_no_se") payment += 25;
  else if (answers.interesTratamiento === "si_si_no_caro") payment += 15;
  if (answers.motivoPrincipal === "estetica") payment += 20;
  if (answers.colorDientes === "muy_amarillos") payment += 15;
  else if (answers.colorDientes === "algo_amarillos") payment += 8;
  if (answers.ultimaVisita === "mas_3a") payment += 10;
  urgency = Math.min(urgency, 100);
  payment = Math.min(payment, 100);
  const score = Math.round((urgency * 0.6 + payment * 0.4));
  let category: DentalScoreResult["category"];
  let label: string;
  let color: string;
  let cta: string;
  if (urgency >= 50 || score >= 60) {
    category = "correctivo_urgente"; label = "Revision prioritaria"; color = "#D85A30";
    cta = "Hay señales visuales que vale la pena revisar con un profesional pronto.";
  } else if (score >= 30) {
    category = "correctivo_leve"; label = "Revision recomendada"; color = "#BA7517";
    cta = "Hay algunos aspectos a evaluar. Un profesional puede orientarte.";
  } else {
    category = "preventivo"; label = "Mantenimiento preventivo"; color = "#0F6E56";
    cta = "Tu evaluación visual se ve favorable. Mantén revisiones periódicas.";
  }
  return { score, urgencyScore: urgency, paymentPropensity: payment, category, label, color, cta };
}

export function generateFallbackDentalReport(): DentalMapReport {
  return {
    promptVersion: "dental_visual_v1_2026_05_27",
    summary: {
      visualScore: 65,
      visualRiskLevel: "medium",
      headline: "Evaluación visual completada",
      subheadline: "Se identificaron algunas zonas que podrían beneficiarse de una evaluación presencial.",
    },
    visualFindings: [
      { key: "color", label: "Color aparente", visualLevel: "mild_attention", description: "Se observa tonalidad que podría revisarse en evaluación presencial." },
      { key: "alignment", label: "Alineación aparente", visualLevel: "moderate_attention", description: "Hay aspectos de alineación aparente que vale la pena evaluar." },
      { key: "gum_visibility", label: "Encías visibles", visualLevel: "mild_attention", description: "Las encías se ven con algunas señales visuales a revisar." },
      { key: "spacing", label: "Espaciado", visualLevel: "favorable", description: "El espaciado entre piezas se ve dentro de rangos visuales normales." },
    ],
    zoneAnalysis: [
      { zone: "front_smile", score: 7, label: "Sonrisa frontal", description: "Aspecto general con algunas áreas de atención visual." },
      { zone: "front_bite", score: 6, label: "Mordida frontal", description: "La mordida visible tiene aspectos a revisar." },
      { zone: "upper_arch", score: 7, label: "Arcada superior", description: "Arcada superior con señales visuales leves." },
      { zone: "lower_arch", score: 6, label: "Arcada inferior", description: "Arcada inferior con algunas zonas a evaluar." },
    ],
    visualDashboard: {
      alignment: "medium",
      smileAesthetics: "medium",
      symmetry: "high",
      apparentColor: "medium",
      visibleBite: "medium",
      gums: "medium",
      generalVisualState: "medium",
    },
    nextStep: {
      title: "Evaluación dental presencial",
      description: "Una evaluación con un profesional permitirá revisar en detalle las zonas identificadas.",
      ctaLabel: "Agendar evaluación dental",
    },
    disclaimer: "Esta evaluación es visual y preliminar. No constituye diagnóstico médico ni reemplaza la valoración de un profesional de la salud dental.",
  };
}
