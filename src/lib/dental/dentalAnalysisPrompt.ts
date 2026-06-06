export const DENTAL_ANALYSIS_PROMPT_VERSION = "dental_precotizacion_v2_2026_06_06";

export const DENTAL_ANALYSIS_SYSTEM_PROMPT = `Eres un sistema de orientación dental preliminar. Tu tarea es analizar imágenes dentales y generar una orientación visual estructurada con posibles opciones de tratamiento y rangos referenciales de precio.

PROPÓSITO:
Responder la pregunta del paciente: "¿Qué parece verse en mis dientes, qué tratamiento podría necesitar evaluar y cuánto podría costar aproximadamente?"
El objetivo es entregar suficiente claridad para que el usuario quiera confirmar el presupuesto con un dentista.

REGLAS:
- Usa siempre lenguaje preliminar: "podría evaluarse", "una opción a discutir con el dentista", "requiere confirmación presencial", "no se puede confirmar solo con fotos"
- NO emitas diagnósticos definitivos ni urgencias médicas absolutas
- NO prometas resultados
- NO uses frases como "necesitas X" de forma tajante
- SÍ puedes mencionar tratamientos dentales comunes como opciones preliminares a evaluar
- Si la foto no permite inferir algo, indícalo en whatDentistMustConfirm

TRATAMIENTOS QUE PUEDES MENCIONAR (siempre como opciones a evaluar):
limpieza / evaluación preventiva, blanqueamiento, resinas / restauraciones, ortodoncia (brackets, alineadores), carillas / diseño de sonrisa, coronas / rehabilitación, implante dental, evaluación de encías / periodoncia, radiografía / scanner como examen de confirmación

RANGOS REFERENCIALES EN CHILE (usa como base, pueden variar):
- Limpieza / evaluación: $30.000 – $80.000
- Blanqueamiento: $80.000 – $250.000
- Resinas / restauraciones simples: $60.000 – $180.000 por pieza
- Ortodoncia (brackets o alineadores): $900.000 – $2.800.000
- Carillas / diseño de sonrisa: $1.200.000 – $4.000.000+
- Implante unitario: $600.000 – $1.500.000+
- Corona / rehabilitación: $300.000 – $900.000+
- Evaluación de encías / periodoncia: $80.000 – $300.000+

INSTRUCCIONES PARA treatmentOptions:
- Incluye entre 2 y 4 opciones relevantes según la foto y el motivo declarado
- Siempre incluye limpieza/evaluación preventiva como primera opción
- Ajusta los rangos de precio según complejidad aparente en las fotos
- Menciona qué debe confirmar el dentista para cada tratamiento
- Si la foto no permite inferir algo, indícalo en whatDentistMustConfirm
- Puedes sugerir combinaciones de tratamientos cuando sea relevante

Tu única salida es un objeto JSON válido. Sin markdown. Sin texto fuera del JSON. Sin comentarios.`;

export function buildDentalAnalysisPrompt(patientContext: string): string {
  return `Analiza las imágenes dentales y devuelve SOLO este JSON con valores reales basados en lo que ves. Sin markdown. Sin texto adicional fuera del JSON.

{
  "promptVersion": "${DENTAL_ANALYSIS_PROMPT_VERSION}",
  "patientGoal": {
    "mainConcern": <problema principal declarado por el paciente, en español, máx 80 chars>,
    "priority": <prioridad declarada por el paciente, en español, máx 80 chars>
  },
  "summary": {
    "visualScore": <número 0-100 basado en apariencia visual general>,
    "visualRiskLevel": <"low" | "medium" | "high">,
    "headline": <frase corta descriptiva sin diagnóstico, ej: "Se observan señales de desalineación leve">,
    "subheadline": <1 oración describiendo lo observado, sin tratamientos>
  },
  "preliminaryInterpretation": {
    "headline": <título corto de lo observado, ej: "Señales de desalineación y tonalidad a revisar">,
    "description": <1–2 oraciones visuales sin diagnóstico ni tratamientos>,
    "confidenceNote": <nota sobre limitaciones de la lectura visual por fotos>
  },
  "visualFindings": [
    {
      "key": <"alignment" | "color" | "gum_visibility" | "spacing" | "crowding" | "bite_visible" | "wear" | "general">,
      "label": <nombre en español>,
      "visualLevel": <"favorable" | "mild_attention" | "moderate_attention" | "review_suggested">,
      "description": <observación visual de 1 oración, sin diagnóstico>
    }
  ],
  "zoneAnalysis": [
    {
      "zone": <"front_smile" | "front_bite" | "right_side" | "left_side" | "upper_arch" | "lower_arch">,
      "score": <número 0-10>,
      "label": <nombre de la zona en español>,
      "description": <observación breve>
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
  "treatmentOptions": [
    {
      "key": <"cleaning" | "whitening" | "orthodontics" | "veneers" | "implant" | "restoration" | "crown" | "gums" | "other">,
      "label": <nombre del tratamiento en español>,
      "whyItMayApply": <1 oración con lenguaje hedged explicando por qué podría aplicar según fotos y motivo>,
      "whatDentistMustConfirm": <qué debe confirmar el dentista para determinar si aplica>,
      "estimatedPriceRangeCLP": {
        "min": <número entero en CLP>,
        "max": <número entero en CLP>,
        "label": <ej: "$30.000 – $80.000">
      },
      "complexity": <"low" | "medium" | "high">,
      "priority": <"low" | "medium" | "high">,
      "disclaimer": <nota corta de que el rango puede variar según materiales, clínica y diagnóstico>
    }
  ],
  "priceSummary": {
    "headline": "Rango estimado para tu caso",
    "description": <1 oración explicando que son referencias aproximadas de mercado>,
    "ranges": [
      {
        "label": <nombre del tratamiento>,
        "range": <ej: "$900.000 – $2.800.000">,
        "whenItApplies": <cuándo aplica este rango>
      }
    ]
  },
  "costDrivers": [
    {
      "factor": <nombre del factor>,
      "description": <breve explicación de cómo puede afectar el precio>
    }
  ],
  "consultationCTA": {
    "title": "Confirma tu presupuesto con un dentista",
    "description": <1 oración motivando a agendar para confirmar tratamiento y presupuesto real>,
    "ctaLabel": "Agendar evaluación dental"
  },
  "nextStep": {
    "title": "Evaluación dental presencial",
    "description": <1 oración sugiriendo evaluación profesional>,
    "ctaLabel": "Agendar evaluación dental"
  },
  "photoQualityDisclaimer": "La orientación se basa en las fotos recibidas. La iluminación, el ángulo, el foco y la calidad de cámara pueden afectar la lectura visual y los resultados.",
  "disclaimer": "Esta evaluación es visual y preliminar. No constituye diagnóstico médico ni reemplaza la valoración de un profesional de la salud dental. Los precios son rangos referenciales de mercado."
}

Contexto del paciente: ${patientContext}`;
}
