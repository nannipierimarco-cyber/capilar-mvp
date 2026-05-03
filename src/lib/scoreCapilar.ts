export interface ScoreCapilarAnswers {
  edad: string;
  zona: string;
  tiempo: string;
  avance: string;
  previo: string;
  busca: string;
  disposicion: string;
}

export interface ScoreCapilarResult {
  score: number;
  prioridad: string;
  ruta: string;
  edadCapilar: number;
}

const EDAD_POINTS: Record<string, number> = {
  "18–24": -3,
  "25–34": -6,
  "35–44": -10,
  "45–54": -14,
  "55+": -18,
};

const ZONA_POINTS: Record<string, number> = {
  "Entradas": -10,
  "Coronilla": -14,
  "Densidad general": -12,
  "Caída difusa": -12,
  "Post-trasplante": -8,
  "Estoy evaluando trasplante": -22,
  "No estoy seguro": -6,
};

const TIEMPO_POINTS: Record<string, number> = {
  "Menos de 3 meses": -4,
  "3–6 meses": -7,
  "6–12 meses": -11,
  "Más de 1 año": -16,
  "Más de 3 años": -20,
};

const AVANCE_POINTS: Record<string, number> = {
  "Estable": -4,
  "Lento": -8,
  "Rápido": -22,
  "Por épocas": -10,
  "No sé": -6,
};

const BUSCA_POINTS: Record<string, number> = {
  "Entender qué me pasa": -5,
  "Prevenir que avance": -8,
  "Mejorar densidad": -12,
  "Saber si necesito trasplante": -22,
  "Seguimiento post-trasplante": -10,
  "Comparar opciones": -8,
};

const EDAD_BASELINE: Record<string, number> = {
  "18–24": 23,
  "25–34": 31,
  "35–44": 40,
  "45–54": 50,
  "55+": 58,
};

export function computeScore(answers: ScoreCapilarAnswers): number {
  const raw =
    100 +
    (EDAD_POINTS[answers.edad] ?? 0) +
    (ZONA_POINTS[answers.zona] ?? 0) +
    (TIEMPO_POINTS[answers.tiempo] ?? 0) +
    (AVANCE_POINTS[answers.avance] ?? 0) +
    (BUSCA_POINTS[answers.busca] ?? 0);
  return Math.min(100, Math.max(0, raw));
}

export function computePriority(score: number): string {
  if (score >= 85) return "Muy buen punto de partida";
  if (score >= 70) return "Buen punto de partida";
  if (score >= 50) return "Conviene monitorear";
  if (score >= 30) return "Conviene revisar con médico";
  return "Revisión prioritaria recomendada";
}

export function computeRoute(answers: ScoreCapilarAnswers, score: number): string {
  if (
    answers.zona === "Estoy evaluando trasplante" ||
    answers.busca === "Saber si necesito trasplante"
  ) {
    return "Evaluación de procedimiento / trasplante";
  }
  if (answers.zona === "Post-trasplante" || answers.busca === "Seguimiento post-trasplante") {
    return "Seguimiento post-trasplante";
  }
  if (score >= 70) return "Educación y monitoreo";
  if (score >= 50) return "Monitoreo + posible revisión médica";
  return "Revisión médica capilar online";
}

export function computeApparentAge(answers: ScoreCapilarAnswers, score: number): number {
  const baseline = EDAD_BASELINE[answers.edad] ?? 40;
  if (score >= 85) return baseline - 4;
  if (score >= 70) return baseline - 2;
  if (score >= 50) return baseline + 1;
  if (score >= 30) return baseline + 4;
  return baseline + 7;
}

export function computeResult(answers: ScoreCapilarAnswers): ScoreCapilarResult {
  const score = computeScore(answers);
  return {
    score,
    prioridad: computePriority(score),
    ruta: computeRoute(answers, score),
    edadCapilar: computeApparentAge(answers, score),
  };
}
