import { DENTAL_ANALYSIS_SYSTEM_PROMPT, buildDentalAnalysisPrompt } from "./dentalAnalysisPrompt";

export { DENTAL_ANALYSIS_SYSTEM_PROMPT as DENTAL_MAP_SYSTEM_PROMPT };

export function buildDentalUserPrompt(answers: Record<string, string>): string {
  const photoCount = answers._photoCount ?? "1 o más fotos";
  const patientContext = [
    `Problema principal declarado: ${answers.queQuieresResolver ?? answers.motivoPrincipal ?? "no especificado"}`,
    `Prioridad del paciente: ${answers.prioridadUsuario ?? answers.interesTratamiento ?? "no especificado"}`,
    `Fotos recibidas: ${photoCount}`,
    `Objetivo del análisis: generar orientación inicial, posibles tratamientos a evaluar y rangos referenciales de precio`,
  ].join(". ");
  return buildDentalAnalysisPrompt(patientContext);
}
