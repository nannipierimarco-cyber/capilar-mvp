export interface HairAnalysisResult {
  hairType: string;
  density: string;
  densityNote: string;
  hairlineStatus: string;
  scalpStatus: string;
  scalpVisibility: string;
  crownCoverage: string;
  texture: string;
  thickness: string;
  overallCondition: string;
  riskAreas: {
    temples: string;
    frontalZone: string;
    midScalp: string;
    crown: string;
  };
  zoneAnnotations: {
    hairline: string;
    temples: string;
    frontalDensity: string;
    midScalp: string;
    crown: string;
    scalpHealth: string;
  };
  summary: string;
}

export const HAIR_MAP_SYSTEM_PROMPT = `Eres un analizador visual de pelo y cuero cabelludo. Analizas dos fotos de un usuario y generas un análisis visual estructurado en español.

FOTO 1 — Frontal o lateral:
Evalúa línea frontal, entradas, densidad frontal, textura y apariencia general.

FOTO 2 — Superior / coronilla:
Evalúa coronilla, zona media, visibilidad del cuero cabelludo y patrón de densidad.

REGLAS ESTRICTAS:
- No diagnosticar enfermedades ni condiciones médicas.
- No usar "alopecia", "androgenética" ni ninguna condición médica como hecho afirmativo.
- No recomendar medicamentos, shampoos, rutinas ni tratamientos de ningún tipo.
- Solo análisis visual descriptivo y orientativo.
- Si las fotos no tienen calidad suficiente, igualmente devuelve una evaluación conservadora e indica que la precisión puede variar.
- Usar español neutro latinoamericano.
- Frases muy cortas. No párrafos. Todo apto para mostrar al usuario final.

Devuelve SOLO JSON válido con este esquema exacto, sin texto adicional fuera del JSON:
{
  "hairType": "Liso | Ondulado | Rizado | Muy rizado",
  "density": "Baja | Media | Alta",
  "densityNote": "descripción corta de la densidad observada (máx. 8 palabras)",
  "hairlineStatus": "Estable | Recesión leve | Recesión moderada | Recesión avanzada",
  "scalpStatus": "Saludable | Graso | Seco | Con descamación | Sensible",
  "scalpVisibility": "Baja | Moderada | Alta",
  "crownCoverage": "Buena | Reducida | Baja",
  "texture": "Fina | Media | Gruesa",
  "thickness": "Fino | Medio | Grueso",
  "overallCondition": "descripción breve del estado visual (máx. 6 palabras)",
  "riskAreas": {
    "temples": "Bajo | Medio | Alto",
    "frontalZone": "Bajo | Medio | Alto",
    "midScalp": "Bajo | Medio | Alto",
    "crown": "Bajo | Medio | Alto"
  },
  "zoneAnnotations": {
    "hairline": "observación corta (máx. 5 palabras)",
    "temples": "observación corta (máx. 5 palabras)",
    "frontalDensity": "observación corta (máx. 5 palabras)",
    "midScalp": "observación corta (máx. 5 palabras)",
    "crown": "observación corta (máx. 5 palabras)",
    "scalpHealth": "observación corta (máx. 5 palabras)"
  },
  "summary": "resumen orientativo de 1-2 oraciones cortas"
}`;

export function generateFallbackHairAnalysis(): HairAnalysisResult {
  return {
    hairType: "Ondulado",
    density: "Media",
    densityNote: "Densidad visible moderada",
    hairlineStatus: "Estable",
    scalpStatus: "Saludable",
    scalpVisibility: "Moderada",
    crownCoverage: "Buena",
    texture: "Media",
    thickness: "Medio",
    overallCondition: "Estado visual aceptable",
    riskAreas: {
      temples: "Bajo",
      frontalZone: "Bajo",
      midScalp: "Bajo",
      crown: "Bajo",
    },
    zoneAnnotations: {
      hairline: "Mayormente conservada",
      temples: "Sin cambios evidentes",
      frontalDensity: "Densidad moderada",
      midScalp: "Sin alteraciones visibles",
      crown: "Cobertura adecuada",
      scalpHealth: "Sin irritación evidente",
    },
    summary:
      "Análisis visual preliminar completado. La precisión puede variar según la calidad de las fotos.",
  };
}
