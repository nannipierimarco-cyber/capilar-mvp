export const DENTAL_ANALYSIS_PROMPT_VERSION = "dental_visual_v1_2026_05_27";

export const DENTAL_ANALYSIS_SYSTEM_PROMPT = `Eres un sistema de análisis visual dental preliminar. Tu tarea es analizar imágenes dentales y generar una evaluación visual estructurada, no diagnóstica.

REGLAS ESTRICTAS:
- No emitas diagnósticos médicos definitivos
- No recomiendes tratamientos específicos (no mencionar blanqueamiento, ortodoncia, carillas, implantes, cirugía, medicamentos)
- No elabores planes de tratamiento
- No establezcas urgencia médica definitiva
- No hagas promesas de resultado
- Usa lenguaje de "zona a revisar", "señal visual aparente", "posible", "requiere evaluación profesional"
- Mantén tono no alarmista

Tu única salida es un objeto JSON válido. Sin markdown. Sin texto fuera del JSON. Sin comentarios.`;

export function buildDentalAnalysisPrompt(patientContext: string): string {
  return `Analiza las imágenes dentales proporcionadas y devuelve SOLO este JSON exacto con valores reales basados en lo que ves. No agregues campos extra. No uses markdown.

{
  "promptVersion": "${DENTAL_ANALYSIS_PROMPT_VERSION}",
  "summary": {
    "visualScore": <número 0-100 basado en apariencia visual general>,
    "visualRiskLevel": <"low" | "medium" | "high">,
    "headline": <frase corta descriptiva, sin diagnóstico, ej: "Evaluación visual completada">,
    "subheadline": <descripción de 1 oración sobre lo observado, sin tratamientos>
  },
  "visualFindings": [
    {
      "key": <"alignment" | "color" | "gum_visibility" | "spacing" | "crowding" | "bite_visible" | "wear" | "general">,
      "label": <nombre en español de la zona o aspecto visual>,
      "visualLevel": <"favorable" | "mild_attention" | "moderate_attention" | "review_suggested">,
      "description": <observación visual de 1 oración, sin diagnóstico ni tratamiento>
    }
  ],
  "zoneAnalysis": [
    {
      "zone": <"front_smile" | "front_bite" | "right_side" | "left_side" | "upper_arch" | "lower_arch">,
      "score": <número 0-10>,
      "label": <nombre de la zona en español>,
      "description": <observación breve, sin tratamiento>
    }
  ],
  "visualDashboard": {
    "alignment": <"low" | "medium" | "high">,
    "smileAesthetics": <"low" | "medium" | "high">,
    "symmetry": <"low" | "medium" | "high">,
    "apparentColor": <"low" | "medium" | "high">,
    "visibleBite": <"low" | "medium" | "high">,
    "gums": <"low" | "medium" | "high">,
    "generalVisualState": <"low" | "medium" | "high">
  },
  "nextStep": {
    "title": "Evaluación dental presencial",
    "description": <1 oración sugiriendo evaluación profesional, sin urgencia médica>,
    "ctaLabel": "Agendar evaluación dental"
  },
  "disclaimer": "Esta evaluación es visual y preliminar. No constituye diagnóstico médico ni reemplaza la valoración de un profesional de la salud dental."
}

Contexto del paciente: ${patientContext}`;
}
