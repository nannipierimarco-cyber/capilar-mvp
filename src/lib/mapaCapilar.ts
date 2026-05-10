export type Field = "concern" | "duration" | "previousTreatment" | "familyHistory" | "goal";
export type MapaCapilarAnswers = Record<Field, string>;

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
