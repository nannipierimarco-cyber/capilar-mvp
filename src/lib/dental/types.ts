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

export interface DentalMapReport {
  brandLine: "PERFECTO";
  summary: {
    title: string;
    mainFinding: string;
    overallScore: number;
    urgencyLevel: "alta" | "media" | "baja";
    confidence: "Alta" | "Media" | "Baja";
  };
  zones: {
    frontal: ZoneAssessment;
    lateral_izq: ZoneAssessment;
    lateral_der: ZoneAssessment;
    superior: ZoneAssessment;
    inferior: ZoneAssessment;
  };
  findings: {
    staining: FindingDetail;
    calculus: FindingDetail;
    gumHealth: FindingDetail;
    alignment: FindingDetail;
    erosion: FindingDetail;
    cariesRisk: FindingDetail;
  };
  riskFactors: string[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  treatmentInterest: {
    whitening: boolean;
    orthodontics: boolean;
    periodontal: boolean;
    restoration: boolean;
    preventive: boolean;
  };
  nextStep: string;
}

interface ZoneAssessment {
  label: string;
  score: number;
  notes: string;
}

interface FindingDetail {
  label: string;
  severity: "normal" | "leve" | "moderado" | "severo";
  description: string;
}

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
    category = "correctivo_urgente"; label = "Atencion prioritaria"; color = "#D85A30";
    cta = "Tu boca necesita atencion pronto. Agenda con nuestro dentista esta semana.";
  } else if (score >= 30) {
    category = "correctivo_leve"; label = "Revision recomendada"; color = "#BA7517";
    cta = "Hay algunos puntos a revisar. Un dentista puede ayudarte antes de que avancen.";
  } else {
    category = "preventivo"; label = "Mantenimiento preventivo"; color = "#0F6E56";
    cta = "Tu salud bucal parece estar bien. Manten el ritmo con una revision preventiva.";
  }
  return { score, urgencyScore: urgency, paymentPropensity: payment, category, label, color, cta };
}

export function generateFallbackDentalReport(): DentalMapReport {
  return {
    brandLine: "PERFECTO",
    summary: { title: "Analisis Dental AI", mainFinding: "Acumulacion de sarro en zona interproximal", overallScore: 62, urgencyLevel: "media", confidence: "Media" },
    zones: {
      frontal: { label: "Frontal", score: 6, notes: "Manchas superficiales visibles" },
      lateral_izq: { label: "Lateral izq.", score: 7, notes: "Dentro de parametros" },
      lateral_der: { label: "Lateral der.", score: 7, notes: "Dentro de parametros" },
      superior: { label: "Arcada superior", score: 6, notes: "Sarro leve en molares" },
      inferior: { label: "Arcada inferior", score: 5, notes: "Mayor acumulacion de sarro" },
    },
    findings: {
      staining: { label: "Manchas", severity: "leve", description: "Decoloracion superficial moderada" },
      calculus: { label: "Sarro", severity: "moderado", description: "Acumulacion en zona inferior" },
      gumHealth: { label: "Encias", severity: "leve", description: "Leve inflamacion marginal" },
      alignment: { label: "Alineacion", severity: "normal", description: "Alineacion dentro de parametros" },
      erosion: { label: "Desgaste", severity: "leve", description: "Desgaste incisal leve" },
      cariesRisk: { label: "Caries", severity: "leve", description: "Riesgo bajo-moderado" },
    },
    riskFactors: ["Higiene interproximal insuficiente", "Acidez frecuente", "Largo tiempo sin control"],
    recommendations: {
      immediate: ["Limpieza profesional (profilaxis)"],
      shortTerm: ["Control y revision de puntos de sarro", "Evaluacion periodontal"],
      longTerm: ["Mantenimiento semestral", "Uso de hilo dental diario"],
    },
    treatmentInterest: { whitening: true, orthodontics: false, periodontal: true, restoration: false, preventive: true },
    nextStep: "Agenda tu consulta dental para una evaluacion completa y limpieza profesional.",
  };
}
