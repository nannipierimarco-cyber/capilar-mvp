export type RiskLevel = "green" | "yellow" | "red";

export type RiskAction =
  | "answer_general"
  | "cautious_guidance"
  | "save_to_history"
  | "escalate_to_dermatologist"
  | "urgent_medical_redirect";

export interface RiskClassification {
  riskLevel: RiskLevel;
  action: RiskAction;
  reason: string;
}

// RED — urgent symptoms requiring immediate medical care
const RED_URGENT_KEYWORDS = [
  "pus", "sangr", "hinchad", "arde mucho", "arde muchísimo",
  "dolor fuerte", "dolor intenso", "dolor severo", "urgencia", "emergencia",
  "me quema mucho", "reacción fuerte", "reacción severa", "anafilax",
];

// RED — prescription, diagnosis, or controlled medical topics
const RED_MEDICAL_KEYWORDS = [
  "medicamento", "receta", "dosis", "pastilla", "comprimido",
  "antibiótico", "antibiotic", "corticoide", "corticosteroid",
  "tretinoína", "tretinoina", "isotretinoína", "isotretinoina",
  "embarazada", "embarazo", "lactancia", "lactando",
  "prescripción", "prescripcion", "biopsia",
  "cáncer", "cancer", "melanoma", "carcinoma",
  "infección", "infeccion",
  "herpes", "celulitis infecciosa",
];

// RED — diagnosis framing ("¿tengo X?", "será X?", "tengo X")
const RED_DIAGNOSIS_PATTERNS: RegExp[] = [
  /(tengo|es|será|podría ser|puede ser)\s+(rosácea|rosacea|psoriasis|eccema|eczema|dermatitis|acné severo|herpes)/i,
  /¿(tengo|es|será|podría ser)\s+(rosácea|rosacea|psoriasis|eccema|dermatitis|melanoma|cáncer)/i,
  /diagnóstico|diagnostico|me diagnosticaron/i,
];

// YELLOW — active ingredients, mixing actives, mild reactions, routine changes
const YELLOW_KEYWORDS = [
  "retinol", "retinoide", "retinoid",
  "vitamina c", "vitamina c",
  "ácido glicólico", "acido glicol",
  "ácido salicílico", "acido salicil",
  "ácido azelaico", "acido azelaic",
  "ácido láctico", "acido lactico",
  "ácido mandélico", "acido mandel",
  "niacinamida", "niacinamide",
  "exfoliante", "exfoliar", "exfoliación",
  "peeling", "químico",
  "mezclar activos", "mezclar estos", "combinar activos", "combinar estos",
  "¿puedo usar", "¿puedo mezclar", "¿puedo combinar",
  "granito", "granitos", "brote",
  "me irritó", "me irrito", "se irritó",
  "enrojecimiento", "picazón", "picor",
  "reacción leve", "reaccion leve", "reaccioné",
  "nueva crema", "nuevo producto", "producto nuevo",
  "cambiar rutina", "cambiar mi rutina",
];

export function classifySkinMessage(
  message: string,
  _profile?: Record<string, unknown> | null
): RiskClassification {
  const lower = message.toLowerCase();

  // 1. RED — urgent physical symptoms
  const urgentHit = RED_URGENT_KEYWORDS.find((kw) => lower.includes(kw));
  if (urgentHit) {
    return {
      riskLevel: "red",
      action: "urgent_medical_redirect",
      reason: `Urgent symptom detected: "${urgentHit}"`,
    };
  }

  // 2. RED — medical/prescription topics
  const medicalHit = RED_MEDICAL_KEYWORDS.find((kw) => lower.includes(kw));
  if (medicalHit) {
    return {
      riskLevel: "red",
      action: "escalate_to_dermatologist",
      reason: `Medical keyword detected: "${medicalHit}"`,
    };
  }

  // 3. RED — diagnosis request patterns
  const diagnosisHit = RED_DIAGNOSIS_PATTERNS.find((p) => p.test(lower));
  if (diagnosisHit) {
    return {
      riskLevel: "red",
      action: "escalate_to_dermatologist",
      reason: "Diagnosis framing detected",
    };
  }

  // 4. YELLOW — active ingredients / mild reactions / routine changes
  const yellowHit = YELLOW_KEYWORDS.find((kw) => lower.includes(kw));
  if (yellowHit) {
    return {
      riskLevel: "yellow",
      action: "cautious_guidance",
      reason: `Active/reaction keyword: "${yellowHit}"`,
    };
  }

  // 5. GREEN — general skincare question
  return {
    riskLevel: "green",
    action: "answer_general",
    reason: "General skincare question — no risk patterns detected",
  };
}
