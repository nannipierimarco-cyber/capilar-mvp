import type { HairMapReport } from "@/lib/types";

export const HAIR_MAP_SYSTEM_PROMPT = `You are a clinical trichology AI for Perfecto Labs. You analyze patient hair and scalp photographs with the precision of a senior trichologist. Your sole output is a single valid JSON object. No markdown. No explanation. No preamble. No text outside the JSON. Only describe what is visually observable. Use clinical trichology terminology. Descriptions in Spanish. Clinical next steps in English.`;

export const HAIR_MAP_USER_PROMPT = `Analiza las fotografias capilares adjuntas. Evalua: tipo de pelo, densidad por zona, linea frontal, retroceso en entradas, visibilidad del cuero cabelludo, cobertura coronilla, condicion del cuero cabelludo, salud folicular, areas de riesgo, etapa Norwood. Devuelve UNICAMENTE este JSON completo: { "patient": { "hair_type": "Lacio|Ondulado|Rizado|Muy rizado", "norwood_stage": 1, "norwood_label": "Norwood N descripcion", "report_id": "RPT-AAAAMMDD-XXXX" }, "photo_annotations": { "frontal": [{ "label": "observacion", "position": "linea_frontal|sien_izquierda|sien_derecha|densidad_frontal|vertex|coronilla|occipital" }], "coronilla": [{ "label": "observacion", "position": "vertex|coronilla|occipital|sien_izquierda|sien_derecha" }] }, "density_map": { "zones": { "frontal": { "level": "alta|media|baja|muy_baja", "color_hex": "#hex", "notes": "texto" }, "vertex": { "level": "alta|media|baja|muy_baja", "color_hex": "#hex", "notes": "texto" }, "coronilla": { "level": "alta|media|baja|muy_baja", "color_hex": "#hex", "notes": "texto" }, "occipital": { "level": "alta|media|baja|muy_baja", "color_hex": "#hex", "notes": "texto" }, "entrada_izq": { "level": "alta|media|baja|muy_baja", "color_hex": "#hex", "notes": "texto" }, "entrada_der": { "level": "alta|media|baja|muy_baja", "color_hex": "#hex", "notes": "texto" } }, "density_comparison": { "zone_a_label": "texto", "zone_b_label": "texto", "summary": "texto" } }, "evaluation_summary": { "hair_type": { "value": "texto", "detail": "" }, "density": { "value": "texto", "detail": "texto" }, "hairline": { "value": "texto", "detail": "" }, "scalp_condition": { "value": "texto", "detail": "texto" }, "texture": { "value": "texto", "detail": "" }, "crown_coverage": { "value": "texto", "detail": "" }, "scalp_visibility": { "value": "texto", "detail": "" }, "overall_health": { "value": "texto", "detail": "" } }, "selectors": { "hair_type": { "options": ["Lacio","Ondulado","Rizado","Muy rizado"], "selected": "valor" }, "density": { "options": ["Baja","Media","Alta"], "selected": "valor", "note": "texto" }, "hairline": { "options": ["Estable","Retroceso leve","Retroceso moderado","Retroceso avanzado"], "selected": "valor" }, "scalp_condition": { "options": ["Sano","Graso","Seco","Descamado","Sensible"], "selected": "valor", "note": "texto" }, "risk_areas": [{ "zone": "Entradas", "level": "bajo|medio|alto", "dots": 1 }, { "zone": "Zona frontal", "level": "bajo|medio|alto", "dots": 1 }, { "zone": "Cuero cabelludo medio", "level": "bajo|medio|alto", "dots": 1 }, { "zone": "Coronilla", "level": "bajo|medio|alto", "dots": 1 }] }, "zone_annotations": [{ "zone": "linea_capilar", "label": "Linea capilar", "status": "texto", "state": "ok|warning|alert", "icon": "hairline" }, { "zone": "entradas", "label": "Entradas", "status": "texto", "state": "ok|warning|alert", "icon": "temples" }, { "zone": "densidad_frontal", "label": "Densidad frontal", "status": "texto", "state": "ok|warning|alert", "icon": "density_front" }, { "zone": "cuero_cabelludo_medio", "label": "Cuero cabelludo medio", "status": "texto", "state": "ok|warning|alert", "icon": "mid_scalp" }, { "zone": "coronilla", "label": "Coronilla", "status": "texto", "state": "ok|warning|alert", "icon": "crown" }, { "zone": "salud_cuero_cabelludo", "label": "Salud del cuero cabelludo", "status": "texto", "state": "ok|warning|alert", "icon": "scalp_health" }], "follicular_health": { "shaft_caliber": "fino|medio|grueso", "sebum_level": "normal|elevado|bajo", "scalp_inflammation": "ninguna|leve|moderada|severa", "visible_miniaturization": false, "estimated_density_hairs_per_cm2": "60-80", "notes": "texto" }, "clinical_next_steps": { "priority": { "action": "texto", "description": "texto" }, "recommended": { "action": "texto", "description": "texto" }, "optional": { "action": "texto", "description": "texto" }, "long_term": { "action": "texto", "description": "texto" } }, "disclaimer": "Este analisis es orientativo y no reemplaza una evaluacion medica profesional." }`;

export interface HairAnalysisResultLegacy {
  hairType: string;
  density: string;
  densityNote?: string;
  hairlineStatus: string;
  scalpStatus: string;
  scalpVisibility: string;
  crownCoverage: string;
  texture: string;
  thickness: string;
  overallCondition: string;
  summary: string;
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
}

export type HairAnalysisResult = HairAnalysisResultLegacy;

export function generateFallbackHairAnalysis(): HairMapReport {
  return {
    patient: {
      hair_type: "Ondulado",
      norwood_stage: 2,
      norwood_label: "Norwood 2 - Retroceso leve en entradas",
      report_id: `RPT-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-0000`,
    },
    photo_annotations: {
      frontal: [
        { label: "Linea frontal estable", position: "linea_frontal" },
        { label: "Densidad normal", position: "densidad_frontal" },
        { label: "Entradas conservadas", position: "sien_izquierda" },
      ],
      coronilla: [
        { label: "Vertice sin adelgazamiento", position: "vertex" },
        { label: "Coronilla con buena cobertura", position: "coronilla" },
      ],
    },
    density_map: {
      zones: {
        frontal:     { level: "media", color_hex: "#8B9E77", notes: "Densidad conservada" },
        vertex:      { level: "media", color_hex: "#8B9E77", notes: "Sin cambios visibles" },
        coronilla:   { level: "baja",  color_hex: "#C4A882", notes: "Leve adelgazamiento" },
        occipital:   { level: "alta",  color_hex: "#5C7A5C", notes: "Zona donante sana" },
        entrada_izq: { level: "baja",  color_hex: "#C4A882", notes: "Retroceso leve" },
        entrada_der: { level: "baja",  color_hex: "#C4A882", notes: "Retroceso leve" },
      },
      density_comparison: {
        zone_a_label: "Zona occipital - Densidad mas alta",
        zone_b_label: "Coronilla - Densidad mas baja",
        summary: "La zona occipital presenta mayor densidad que la coronilla.",
      },
    },
    evaluation_summary: {
      hair_type:        { value: "Ondulado",                detail: "" },
      density:          { value: "Media en general",        detail: "Reducida en coronilla" },
      hairline:         { value: "Retroceso leve",          detail: "" },
      scalp_condition:  { value: "Generalmente sano",       detail: "Sin irritacion aparente" },
      texture:          { value: "Grosor medio",            detail: "" },
      crown_coverage:   { value: "Buena cobertura",         detail: "" },
      scalp_visibility: { value: "Baja visibilidad",        detail: "" },
      overall_health:   { value: "Buena calidad del tallo", detail: "" },
    },
    selectors: {
      hair_type:       { options: ["Lacio", "Ondulado", "Rizado", "Muy rizado"], selected: "Ondulado" },
      density:         { options: ["Baja", "Media", "Alta"], selected: "Media", note: "Densidad menor en la coronilla" },
      hairline:        { options: ["Estable", "Retroceso leve", "Retroceso moderado", "Retroceso avanzado"], selected: "Retroceso leve" },
      scalp_condition: { options: ["Sano", "Graso", "Seco", "Descamado", "Sensible"], selected: "Sano", note: "" },
      risk_areas: [
        { zone: "Entradas",              level: "medio", dots: 2 },
        { zone: "Zona frontal",          level: "bajo",  dots: 1 },
        { zone: "Cuero cabelludo medio", level: "bajo",  dots: 1 },
        { zone: "Coronilla",             level: "medio", dots: 2 },
      ],
    },
    zone_annotations: [
      { zone: "linea_capilar",         label: "Linea capilar",            status: "Mayormente conservada",  state: "ok",      icon: "hairline" },
      { zone: "entradas",              label: "Entradas",                 status: "Retroceso leve",          state: "warning", icon: "temples" },
      { zone: "densidad_frontal",      label: "Densidad frontal",         status: "Buena a normal",          state: "ok",      icon: "density_front" },
      { zone: "cuero_cabelludo_medio", label: "Cuero cabelludo medio",    status: "Densidad mantenida",      state: "ok",      icon: "mid_scalp" },
      { zone: "coronilla",             label: "Coronilla",                status: "Adelgazamiento leve",     state: "warning", icon: "crown" },
      { zone: "salud_cuero_cabelludo", label: "Salud del cuero cabelludo",status: "Sin irritacion aparente", state: "ok",      icon: "scalp_health" },
    ],
    follicular_health: {
      shaft_caliber: "medio",
      sebum_level: "normal",
      scalp_inflammation: "ninguna",
      visible_miniaturization: false,
      estimated_density_hairs_per_cm2: "70-90",
      notes: "Foliculos en buen estado general",
    },
    clinical_next_steps: {
      priority:    { action: "Dermatologist consult",  description: "Confirm diagnosis and rule out underlying causes" },
      recommended: { action: "Trichoscopy",            description: "Detailed follicular assessment to monitor progression" },
      optional:    { action: "PRP therapy",            description: "Platelet-rich plasma to stimulate follicular activity" },
      long_term:   { action: "Hair transplant eval",   description: "Evaluate candidacy after 12 months of treatment" },
    },
    disclaimer: "Este analisis es orientativo y no reemplaza una evaluacion medica profesional. Consulta un dermatologo certificado.",
  };
}
