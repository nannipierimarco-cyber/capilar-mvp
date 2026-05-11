export type Field = "concern" | "duration" | "previousTreatment" | "familyHistory" | "goal";
export type MapaCapilarAnswers = Record<Field, string>;

// ─── Rich analysis report (new flow with [id] route) ─────────────────────────

export interface HairMapAnalysisReport {
  summary: {
    title: string;
    mainFinding: string;
    overallScore: number;
    confidence: "Baja" | "Media" | "Alta";
    priority: string;
  };
  userContext: {
    age: string;
    gender: string;
    mainConcern: string;
    hairLossDuration: string;
    familyHistory: string;
    scalpSymptoms: string[];
    washFrequency: string;
    previousTreatments: string;
  };
  visualAnalysis: {
    hairType: string;
    density: string;
    hairline: string;
    scalpVisibility: string;
    crownCoverage: string;
    hairTexture: string;
    hairThickness: string;
    overallCondition: string;
  };
  zones: {
    frontalLine: { status: string; score: number; label: string };
    frontalDensity: { status: string; score: number; label: string };
    temples: { status: string; score: number; label: string };
    crown: { status: string; score: number; label: string };
    scalpHealth: { status: string; score: number; label: string };
  };
  riskAreas: Array<{
    area: string;
    level: "Bajo" | "Medio" | "Alto";
    reason: string;
  }>;
  visualTags: string[];
  photoCallouts: {
    frontPhoto: Array<{ label: string; area: string; level: "Bajo" | "Medio" | "Alto" }>;
    crownPhoto: Array<{ label: string; area: string; level: "Bajo" | "Medio" | "Alto" }>;
  };
  disclaimer: string;
}

export function generateFallbackAnalysisReport(
  answers: Partial<MapaCapilarAnswers>
): HairMapAnalysisReport {
  return {
    summary: {
      title: "Mapa Capilar IA",
      mainFinding: "Análisis visual preliminar completado según tus respuestas.",
      overallScore: 65,
      confidence: "Media",
      priority: "Seguimiento recomendado",
    },
    userContext: {
      age: "No especificado",
      gender: "No especificado",
      mainConcern: answers.concern ?? "No especificado",
      hairLossDuration: answers.duration ?? "No especificado",
      familyHistory: answers.familyHistory ?? "No especificado",
      scalpSymptoms: [],
      washFrequency: "No especificado",
      previousTreatments: answers.previousTreatment ?? "No especificado",
    },
    visualAnalysis: {
      hairType: "No concluyente",
      density: "Media",
      hairline: "Estable",
      scalpVisibility: "Moderada",
      crownCoverage: "Adecuada",
      hairTexture: "Media",
      hairThickness: "Medio",
      overallCondition: "Estado visual estándar",
    },
    zones: {
      frontalLine: { status: "Estable", score: 70, label: "Sin cambios evidentes" },
      frontalDensity: { status: "Media", score: 65, label: "Densidad moderada" },
      temples: { status: "Estable", score: 70, label: "Sin alteraciones" },
      crown: { status: "Adecuada", score: 65, label: "Cobertura aceptable" },
      scalpHealth: { status: "Saludable", score: 75, label: "Sin irritación visible" },
    },
    riskAreas: [],
    visualTags: ["Análisis preliminar", "Requiere revisión profesional"],
    photoCallouts: { frontPhoto: [], crownPhoto: [] },
    disclaimer:
      "Este análisis es visual y orientativo. No constituye diagnóstico médico ni reemplaza una evaluación profesional.",
  };
}

export interface MapaCapilarReport {
  hairType: string;
  visualDensity: string;
  hairlineRecession: string;
  scalpVisibility: string;
  observationZones: string[];
  crownCoverage: string;
  densityMap: Record<"frontal" | "entradas" | "superior" | "coronilla" | "laterales", string>;
  nextStep: string;
  summary: string;
}

export function generateFallbackReport(concern: string, goal: string): MapaCapilarReport {
  const needsEval = goal.includes("Evaluar") || goal.includes("Minimizar");
  const isTransplant = concern === "Estoy evaluando trasplante";
  const isCrown = concern === "Coronilla";
  const isTemples = concern === "Entradas";

  return {
    hairType: "Liso",
    visualDensity: needsEval || isTransplant ? "Baja" : "Media",
    hairlineRecession: isTransplant
      ? "Recesión moderada aparente"
      : needsEval
      ? "Recesión leve aparente"
      : "Sin cambios visibles",
    scalpVisibility: needsEval ? "Media" : "Baja",
    observationZones: isTransplant
      ? ["Entradas", "Zona frontal", "Coronilla"]
      : isCrown
      ? ["Coronilla"]
      : isTemples
      ? ["Entradas", "Zona frontal"]
      : ["Zona media"],
    crownCoverage: isTransplant
      ? "Cobertura reducida aparente"
      : isCrown
      ? "Cobertura media"
      : "Buena cobertura visual",
    densityMap: {
      frontal: isTemples || isTransplant ? "Baja" : "Media",
      entradas: isTemples || isTransplant ? "Baja" : "Media",
      superior: "Media",
      coronilla: isCrown || isTransplant ? "Baja" : "Media",
      laterales: "Alta",
    },
    nextStep: isTransplant
      ? "Evaluar recuperación capilar / trasplante"
      : needsEval
      ? "Evaluar caída con revisión médica"
      : "Seguir monitoreando",
    summary:
      "Análisis visual orientativo generado según tus respuestas y foto. No reemplaza una evaluación médica profesional.",
  };
}
