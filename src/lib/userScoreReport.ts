import type { ScoreCapilarAnswers } from "./scoreCapilar";

export interface UserScoreReport {
  friendly_summary: string;
  score_explanation: string;
  main_concern_area: string;
  preliminary_route_explanation: string;
  common_mistakes: [string, string, string];
  next_steps: [string, string, string];
  cta_title: string;
  cta_body: string;
  cta_button: string;
  disclaimer: string;
}

export const USER_SCORE_REPORT_SYSTEM_PROMPT = `Eres el generador del "Mapa Capilar Nilo", un reporte educativo y orientador para usuarios de Nilo, una plataforma digital de salud capilar en Chile.

Tu tarea es generar un reporte amigable, claro y de orientación preliminar para el usuario final — no para un médico.

REGLAS ESTRICTAS (no negociables):
- NO digas "tienes alopecia" ni ninguna condición médica como hecho.
- NO digas "tienes alopecia androgenética".
- NO menciones ni recomiendes medicamentos ni dosis específicas.
- NO digas "necesitas minoxidil", "necesitas dutasteride", "debes tomar...".
- NO uses la palabra "diagnóstico" en ningún contexto afirmativo.
- NO uses "garantizado", "garantizamos", "vas a recuperar pelo", "vas a perder pelo si no...".
- NO crees miedo, urgencia exagerada ni vergüenza.
- NO hagas afirmaciones clínicas definitivas.
- NUNCA digas que la IA detectó o analizó biológicamente las fotos. Si hay fotos, di "según las fotos cargadas" o "según lo que podemos observar".

LENGUAJE PERMITIDO:
- "orientación preliminar", "perfil preliminar"
- "según tus respuestas", "según tus respuestas y las fotos cargadas"
- "podría ser útil revisar", "vale la pena evaluar"
- "ruta preliminar", "si decides avanzar"
- "un médico puede revisar", "si corresponde"
- "no constituye diagnóstico médico", "no reemplaza una evaluación profesional"

TONO:
- Español neutro chileno/latinoamericano.
- Cálido, claro, premium y simple.
- Responsable. No clínico. No alarmista. No cursi. No agresivamente comercial.
- Como un amigo informado que te orienta con cuidado.

Devuelve SOLO JSON válido con exactamente este esquema, sin texto adicional:
{
  "friendly_summary": "párrafo amigable (2-3 oraciones) que resume la situación orientativa del usuario sin diagnósticos, reconociendo su caso y motivando el siguiente paso",
  "score_explanation": "explicación clara (2 oraciones) de qué significa el score para este usuario específico",
  "main_concern_area": "zona principal de preocupación tal como la declaró el usuario",
  "preliminary_route_explanation": "explicación cálida (2 oraciones) de la ruta preliminar y por qué aplica a su perfil declarado",
  "common_mistakes": ["error común 1", "error común 2", "error común 3"],
  "next_steps": ["paso concreto 1", "paso concreto 2", "paso concreto 3"],
  "cta_title": "Confirma tu ruta con revisión médica",
  "cta_body": "Tu Score te orienta. La revisión médica permite que un profesional revise tus antecedentes y fotos con más detalle.",
  "cta_button": "Completar evaluación médica",
  "disclaimer": "Este resultado es preliminar y educativo. No constituye diagnóstico médico ni indicación de tratamiento. La recomendación final depende de una revisión profesional."
}`;

export function buildUserScorePrompt(params: {
  answers: ScoreCapilarAnswers;
  score: number;
  prioridad: string;
  edadCapilar: number;
  ruta: string;
  photosUploaded: number;
}): string {
  const { answers, score, prioridad, edadCapilar, ruta, photosUploaded } = params;
  return [
    "Genera el Mapa Capilar Nilo para el siguiente usuario:",
    "",
    "DATOS DEL QUIZ:",
    `- Edad: ${answers.edad}`,
    `- Zona de preocupación principal: ${answers.zona}`,
    `- Tiempo que lo nota: ${answers.tiempo}`,
    `- Avance percibido: ${answers.avance}`,
    `- Uso previo de productos/tratamientos: ${answers.previo}`,
    `- Qué está buscando: ${answers.busca}`,
    `- Disposición a revisión médica online: ${answers.disposicion}`,
    "",
    "SCORE CAPILAR (determinístico, basado en sus respuestas):",
    `- Score: ${score}/100`,
    `- Prioridad orientativa: ${prioridad}`,
    `- Edad capilar aparente (estimación preliminar): ${edadCapilar} años`,
    `- Ruta preliminar: ${ruta}`,
    "",
    "FOTOS:",
    photosUploaded > 0
      ? `- El usuario subió ${photosUploaded} foto(s). Se adjuntan para referencia visual general.`
      : "- El usuario no subió fotos en este flujo.",
    "",
    "Genera el Mapa Capilar Nilo. Responde en español neutro/latinoamericano. Devuelve solo JSON válido con el esquema indicado.",
  ].join("\n");
}

export function generateFallbackReport(params: {
  answers: ScoreCapilarAnswers;
  score: number;
  prioridad: string;
  edadCapilar: number;
  ruta: string;
}): UserScoreReport {
  const { answers, score, ruta } = params;

  let friendly_summary: string;
  if (score < 40) {
    friendly_summary = `Según tus respuestas, tu situación capilar está en una etapa donde actuar con anticipación marca la diferencia. Es un buen momento para entender mejor tu caso antes de que avance.`;
  } else if (score < 60) {
    friendly_summary = `Según tus respuestas, tu caso tiene señales que vale la pena revisar con orientación profesional. No estás solo en esto — hay un camino claro para entender tu situación.`;
  } else if (score < 80) {
    friendly_summary = `Según tus respuestas y las fotos cargadas, tu perfil indica que una evaluación profesional puede ayudarte a entender tus opciones. Es un paso natural y tiene sentido darlo pronto.`;
  } else {
    friendly_summary = `Según tus respuestas y las fotos cargadas, tu situación merece atención profesional. Hay opciones disponibles y lo más valioso es entender tu caso con claridad antes de decidir.`;
  }

  let score_explanation: string;
  if (score < 40) {
    score_explanation = `Tu Score de ${score}/100 refleja un perfil en etapa temprana. Cuanto antes evalúes tu caso con un profesional, más herramientas tienes disponibles.`;
  } else if (score < 60) {
    score_explanation = `Tu Score de ${score}/100 refleja un perfil intermedio. Una revisión profesional puede orientarte sobre las alternativas que corresponden según tu situación.`;
  } else if (score < 80) {
    score_explanation = `Tu Score de ${score}/100 refleja un perfil que se beneficia de atención profesional pronto. Una evaluación médica te permite entender las opciones con claridad.`;
  } else {
    score_explanation = `Tu Score de ${score}/100 refleja un perfil avanzado. El paso más importante es entender tu caso en detalle con un especialista para evaluar las alternativas disponibles.`;
  }

  const common_mistakes: [string, string, string] = [
    "Esperar demasiado antes de buscar orientación profesional",
    "Copiar rutinas o tratamientos de internet sin validación médica",
    "No llevar un registro fotográfico periódico para comparar la evolución",
  ];

  let next_steps: [string, string, string];
  if (ruta === "Evaluación de procedimiento / trasplante") {
    next_steps = [
      "Completar tu evaluación médica para que un especialista revise tu caso con tus fotos y antecedentes",
      "Consultar sobre las opciones disponibles según tu perfil y timing",
      "Mantener un registro fotográfico para hacer seguimiento de tu evolución",
    ];
  } else if (ruta === "Seguimiento post-trasplante") {
    next_steps = [
      "Coordinar un seguimiento médico para evaluar los resultados de tu procedimiento",
      "Mantener una rutina de cuidado capilar con orientación profesional",
      "Registrar tu evolución con fotos periódicas para detectar cambios",
    ];
  } else if (ruta === "Revisión médica capilar online") {
    next_steps = [
      "Completar tu evaluación médica online para que un especialista revise tu caso",
      "Preparar tus antecedentes, historial y fotos para la consulta",
      "Evaluar junto a un médico qué opciones corresponden según tu perfil",
    ];
  } else {
    next_steps = [
      "Informarte sobre tu situación capilar con orientación de un profesional",
      "Incorporar hábitos que apoyan la salud del cabello según tu perfil",
      "Hacer seguimiento periódico con fotos comparables para detectar cambios a tiempo",
    ];
  }

  const ruta_desc =
    ruta === "Educación y monitoreo"
      ? "Esto indica que hay espacio para informarte y hacer seguimiento antes de tomar decisiones."
      : "Una revisión profesional puede orientarte sobre las alternativas disponibles para tu situación.";

  return {
    friendly_summary,
    score_explanation,
    main_concern_area: answers.zona,
    preliminary_route_explanation: `Tu ruta preliminar es "${ruta}". ${ruta_desc}`,
    common_mistakes,
    next_steps,
    cta_title: "Confirma tu ruta con revisión médica",
    cta_body:
      "Tu Score te orienta. La revisión médica permite que un profesional revise tus antecedentes y fotos con más detalle.",
    cta_button: "Completar evaluación médica",
    disclaimer:
      "Este resultado es preliminar y educativo. No constituye diagnóstico médico ni indicación de tratamiento. La recomendación final depende de una revisión profesional.",
  };
}
