import { DENTAL_ANALYSIS_SYSTEM_PROMPT, buildDentalAnalysisPrompt } from "./dentalAnalysisPrompt";

export { DENTAL_ANALYSIS_SYSTEM_PROMPT as DENTAL_MAP_SYSTEM_PROMPT };

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
  return buildDentalAnalysisPrompt(patientContext);
}
