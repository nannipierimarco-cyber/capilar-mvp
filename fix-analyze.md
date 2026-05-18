En src/app/api/mapa-capilar/analyze/route.ts haz estos cambios:

1. Reemplaza los imports de mapaCapilar con:
import { generateFallbackHairAnalysis } from "@/lib/hairMapAnalysis";
import type { HairMapReport } from "@/lib/types";

2. Reemplaza la funcion buildPass2User completa con esta:

function buildPass2User(prose: string, answers: Partial<MapaCapilarAnswers>): string {
  return `Clinical analysis narrative:
"""
${prose}
"""

Convert the narrative into this exact JSON. Fill every field from the narrative. Return ONLY valid JSON:

{
  "patient": {
    "hair_type": "Lacio | Ondulado | Rizado | Muy rizado",
    "norwood_stage": 1,
    "norwood_label": "Norwood N - descripcion breve",
    "report_id": "RPT-AAAAMMDD-XXXX"
  },
  "photo_annotations": {
    "frontal": [
      { "label": "observacion corta", "position": "linea_frontal | sien_izquierda | sien_derecha | densidad_frontal | vertex | coronilla | occipital" }
    ],
    "coronilla": [
      { "label": "observacion corta", "position": "vertex | coronilla | occipital | sien_izquierda | sien_derecha" }
    ]
  },
  "density_map": {
    "zones": {
      "frontal":     { "level": "alta | media | baja | muy_baja", "color_hex": "#hex", "notes": "corto" },
      "vertex":      { "level": "alta | media | baja | muy_baja", "color_hex": "#hex", "notes": "corto" },
      "coronilla":   { "level": "alta | media | baja | muy_baja", "color_hex": "#hex", "notes": "corto" },
      "occipital":   { "level": "alta | media | baja | muy_baja", "color_hex": "#hex", "notes": "corto" },
      "entrada_izq": { "level": "alta | media | baja | muy_baja", "color_hex": "#hex", "notes": "corto" },
      "entrada_der": { "level": "alta | media | baja | muy_baja", "color_hex": "#hex", "notes": "corto" }
    },
    "density_comparison": {
      "zone_a_label": "texto",
      "zone_b_label": "texto",
      "summary": "max 2 oraciones"
    }
  },
  "evaluation_summary": {
    "hair_type":        { "value": "texto", "detail": "" },
    "density":          { "value": "texto", "detail": "texto" },
    "hairline":         { "value": "texto", "detail": "" },
    "scalp_condition":  { "value": "texto", "detail": "texto" },
    "texture":          { "value": "texto", "detail": "" },
    "crown_coverage":   { "value": "texto", "detail": "" },
    "scalp_visibility": { "value": "texto", "detail": "" },
    "overall_health":   { "value": "texto", "detail": "" }
  },
  "selectors": {
    "hair_type":       { "options": ["Lacio","Ondulado","Rizado","Muy rizado"], "selected": "valor" },
    "density":         { "options": ["Baja","Media","Alta"], "selected": "valor", "note": "texto" },
    "hairline":        { "options": ["Estable","Retroceso leve","Retroceso moderado","Retroceso avanzado"], "selected": "valor" },
    "scalp_condition": { "options": ["Sano","Graso","Seco","Descamado","Sensible"], "selected": "valor", "note": "texto" },
    "risk_areas": [
      { "zone": "Entradas",              "level": "bajo | medio | alto", "dots": 1 },
      { "zone": "Zona frontal",          "level": "bajo | medio | alto", "dots": 1 },
      { "zone": "Cuero cabelludo medio", "level": "bajo | medio | alto", "dots": 1 },
      { "zone": "Coronilla",             "level": "bajo | medio | alto", "dots": 1 }
    ]
  },
  "zone_annotations": [
    { "zone": "linea_capilar",         "label": "Linea capilar",            "status": "texto", "state": "ok | warning | alert", "icon": "hairline" },
    { "zone": "entradas",              "label": "Entradas",                 "status": "texto", "state": "ok | warning | alert", "icon": "temples" },
    { "zone": "densidad_frontal",      "label": "Densidad frontal",         "status": "texto", "state": "ok | warning | alert", "icon": "density_front" },
    { "zone": "cuero_cabelludo_medio", "label": "Cuero cabelludo medio",    "status": "texto", "state": "ok | warning | alert", "icon": "mid_scalp" },
    { "zone": "coronilla",             "label": "Coronilla",                "status": "texto", "state": "ok | warning | alert", "icon": "crown" },
    { "zone": "salud_cuero_cabelludo", "label": "Salud del cuero cabelludo","status": "texto", "state": "ok | warning | alert", "icon": "scalp_health" }
  ],
  "follicular_health": {
    "shaft_caliber": "fino | medio | grueso",
    "sebum_level": "normal | elevado | bajo",
    "scalp_inflammation": "ninguna | leve | moderada | severa",
    "visible_miniaturization": false,
    "estimated_density_hairs_per_cm2": "60-80",
    "notes": "texto"
  },
  "clinical_next_steps": {
    "priority":    { "action": "texto", "description": "texto en ingles" },
    "recommended": { "action": "texto", "description": "texto en ingles" },
    "optional":    { "action": "texto", "description": "texto en ingles" },
    "long_term":   { "action": "texto", "description": "texto en ingles" }
  },
  "disclaimer": "Este analisis es orientativo y no reemplaza una evaluacion medica profesional."
}`;
}

3. En la seccion "Two-pass AI analysis", cambia:
   let report: HairMapAnalysisReport = fallback;
   por:
   let report: HairMapReport = generateFallbackHairAnalysis();

4. En el bloque donde se parsea el JSON del Pass 2, reemplaza:
   report = normalizeHairMapReport(JSON.parse(jsonText) as unknown, answers);
   por:
   report = JSON.parse(jsonText) as HairMapReport;

5. Elimina las importaciones de generateFallbackAnalysisReport, normalizeHairMapReport, HairMapAnalysisReport del import de mapaCapilar. Mantén solo MapaCapilarAnswers si se usa en otros lugares del archivo.