export const DENTAL_MAP_SYSTEM_PROMPT = `Crea una infografía visual premium de análisis dental usando las fotos del paciente. El resultado debe parecer un reporte profesional de odontología estética generado por IA. Fondo crema/off-white, acentos dorados, tipografía elegante, branding Perfecto Labs. Tu única salida es un objeto JSON válido. Sin markdown. Sin texto fuera del JSON.`;

const REPORT_PROMPT_TEMPLATE = `Crea una infografía visual premium de análisis dental y sonrisa. Formato vertical tipo A4, estética médica premium, fondo crema/off-white, bordes suaves, acentos dorados, tipografía elegante, branding Perfecto Labs. Devuelve SOLO JSON válido con estos campos: brandLine, summary (title, mainFinding, overallScore, urgencyLevel, confidence), zones (frontal, lateral_izq, lateral_der, superior, inferior — cada una con label, score 0-10, notes), findings (staining, calculus, gumHealth, alignment, erosion, cariesRisk — cada una con label, severity normal/leve/moderado/severo, description), visualScores (alignment, aesthetics, symmetry, color, bite, gums, overall — cada uno con score 0-100 y level bajo/medio/alto), classifications (alignmentClass, colorClass, symmetryClass, biteClass, spacingClass, gumsClass), riskFactors array, recommendations (immediate, shortTerm, longTerm arrays), treatmentInterest (whitening, orthodontics, periodontal, restoration, preventive booleans), nextStep string. Contexto del paciente: PATIENT_CONTEXT`;

export function buildDentalUserPrompt(answers: Record<string, string>): string {
  const patientContext = [
    `Motivo: ${answers.motivoPrincipal ?? "no especificado"}`,
    `Dolor reciente: ${answers.dolorReciente ?? "no especificado"}`,
    `Ultima visita: ${answers.ultimaVisita ?? "no especificado"}`,
    `Encias sangran: ${answers.enciasNgran ?? "no especificado"}`,
    `Sensibilidad: ${answers.sensibilidad ?? "no especificado"}`,
    `Color dientes: ${answers.colorDientes ?? "no especificado"}`,
    `Interes tratamiento: ${answers.interesTratamiento ?? "no especificado"}`,
    `Historial medico: ${answers.historialMedico ?? "no especificado"}`,
  ].join(", ");

  return REPORT_PROMPT_TEMPLATE.replace("PATIENT_CONTEXT", patientContext);
}
