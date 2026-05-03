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
  prioridad: "baja" | "media" | "media-alta" | "alta";
  ruta: string;
  edadCapilar: number;
}

const EDAD_POINTS: Record<string, number> = {
  "18–24": 5,
  "25–34": 10,
  "35–44": 15,
  "45–54": 20,
  "55+": 25,
};

const ZONA_POINTS: Record<string, number> = {
  "Entradas": 10,
  "Coronilla": 15,
  "Densidad general": 12,
  "Caída difusa": 10,
  "Post-trasplante": 8,
  "Estoy evaluando trasplante": 20,
  "No estoy seguro": 5,
};

const TIEMPO_POINTS: Record<string, number> = {
  "Menos de 3 meses": 5,
  "3–6 meses": 8,
  "6–12 meses": 12,
  "Más de 1 año": 18,
  "Más de 3 años": 22,
};

const AVANCE_POINTS: Record<string, number> = {
  "Estable": 5,
  "Lento": 8,
  "Rápido": 20,
  "Por épocas": 10,
  "No sé": 5,
};

const BUSCA_POINTS: Record<string, number> = {
  "Entender qué me pasa": 5,
  "Prevenir que avance": 10,
  "Mejorar densidad": 12,
  "Saber si necesito trasplante": 20,
  "Seguimiento post-trasplante": 10,
  "Comparar opciones": 8,
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
    50 +
    (EDAD_POINTS[answers.edad] ?? 0) +
    (ZONA_POINTS[answers.zona] ?? 0) +
    (TIEMPO_POINTS[answers.tiempo] ?? 0) +
    (AVANCE_POINTS[answers.avance] ?? 0) +
    (BUSCA_POINTS[answers.busca] ?? 0);
  return Math.min(100, Math.max(0, raw));
}

export function computePriority(score: number): "baja" | "media" | "media-alta" | "alta" {
  if (score <= 39) return "baja";
  if (score <= 59) return "media";
  if (score <= 79) return "media-alta";
  return "alta";
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
  if (score >= 60) return "Revisión médica capilar online";
  return "Educación y monitoreo";
}

export function computeApparentAge(answers: ScoreCapilarAnswers, score: number): number {
  const baseline = EDAD_BASELINE[answers.edad] ?? 40;
  if (score < 40) return baseline - 2;
  if (score <= 59) return baseline;
  if (score <= 79) return baseline + 3;
  return baseline + 5;
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
