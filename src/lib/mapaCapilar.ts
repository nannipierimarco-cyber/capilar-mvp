export type Field = "concern" | "duration" | "previousTreatment" | "familyHistory" | "goal";
export type MapaCapilarAnswers = Record<Field, string>;

// â”€â”€â”€ Rich analysis report (new flow with [id] route) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface HairMapMetricStripItem {
  key: string;
  label: string;
  value: string;
}

export interface HairMapDensityDisk {
  label: string;
  intensity: number;
  caption: string;
}

export interface HairMapCrownDensityMap {
  heatmapIntensity: number;
  legend: string;
}

export type ScalpZoneStripIcon = "check" | "warn" | "neutral";

export interface HairMapScalpZoneStripItem {
  zone: string;
  icon: ScalpZoneStripIcon;
  micro: string;
}

export interface HairMapRecommendedRoutine {
  cleanse: string[];
  treat: string[];
  protect: string[];
  style: string[];
}

export interface HairMapIngredientHints {
  helpful: string[];
  avoid: string[];
}

export interface HairMapAnalysisReport {
  /** InfografÃ­a de una columna â†’ export como imagen; metadato opcional del modelo */
  outputHint?: { layout?: string; language?: string };
  brandLine?: string;
  header?: { title: string; subtitle: string };
  summary: {
    title: string;
    mainFinding: string;
    overallScore: number;
    confidence: "Baja" | "Media" | "Alta";
    priority: string;
  };
  userContext: {
    age: string;
    gender: string;
    mainConcern: string;
    hairLossDuration: string;
    familyHistory: string;
    scalpSymptoms: string[];
    washFrequency: string;
    previousTreatments: string;
    goal?: string;
    questionnaireVsPhotoNote?: string;
  };
  visualAnalysis: {
    hairType: string;
    density: string;
    hairline: string;
    scalpVisibility: string;
    /** Estado aparente del cuero (tricologÃ­a); opcional, enriquece la infografÃ­a */
    scalpState?: string;
    crownCoverage: string;
    hairTexture: string;
    hairThickness: string;
    overallCondition: string;
  };
  /** Fila de 8 mÃ©tricas cortas para strip visual; si falta, el front deriva de visualAnalysis */
  metricStrip?: HairMapMetricStripItem[];
  densityComparison?: {
    frontal: HairMapDensityDisk;
    crown: HairMapDensityDisk;
  };
  crownDensityMap?: HairMapCrownDensityMap;
  scalpZoneStrip?: HairMapScalpZoneStripItem[];
  zones: {
    frontalLine: { status: string; score: number; label: string };
    frontalDensity: { status: string; score: number; label: string };
    temples: { status: string; score: number; label: string };
    crown: { status: string; score: number; label: string };
    scalpHealth: { status: string; score: number; label: string };
  };
  riskAreas: Array<{
    area: string;
    level: "Bajo" | "Medio" | "Alto";
    reason: string;
  }>;
  visualTags: string[];
  photoCallouts: {
    frontPhoto: Array<{ label: string; area: string; level: "Bajo" | "Medio" | "Alto" }>;
    crownPhoto: Array<{ label: string; area: string; level: "Bajo" | "Medio" | "Alto" }>;
  };
  /** Autocuidado cosmÃ©tico general, sin marcas ni fÃ¡rmacos */
  recommendedRoutine?: HairMapRecommendedRoutine;
  ingredientHints?: HairMapIngredientHints;
  disclaimer: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function clampScore(n: unknown, fallback: number): number {
  const x = typeof n === "number" ? n : parseFloat(String(n));
  if (!Number.isFinite(x)) return fallback;
  return Math.min(100, Math.max(0, Math.round(x)));
}

function asLevel(v: unknown): "Bajo" | "Medio" | "Alto" {
  const s = String(v);
  if (s === "Alto" || s === "Medio" || s === "Bajo") return s;
  return "Bajo";
}

function asConfidence(v: unknown): "Baja" | "Media" | "Alta" {
  const s = String(v);
  if (s === "Baja" || s === "Media" || s === "Alta") return s;
  return "Media";
}

function asZone(
  v: unknown,
  fallback: { status: string; score: number; label: string }
): { status: string; score: number; label: string } {
  if (!isRecord(v)) return fallback;
  return {
    status: str(v.status, fallback.status),
    score: clampScore(v.score, fallback.score),
    label: str(v.label, fallback.label),
  };
}

function asPhotoCalloutList(
  arr: unknown
): Array<{ label: string; area: string; level: "Bajo" | "Medio" | "Alto" }> {
  if (!Array.isArray(arr)) return [];
  const out: Array<{ label: string; area: string; level: "Bajo" | "Medio" | "Alto" }> = [];
  for (const item of arr) {
    if (!isRecord(item)) continue;
    out.push({
      label: str(item.label, "ObservaciÃ³n"),
      area: str(item.area, "â€”"),
      level: asLevel(item.level),
    });
  }
  return out.slice(0, 6);
}

function asRiskAreas(arr: unknown): HairMapAnalysisReport["riskAreas"] {
  if (!Array.isArray(arr)) return [];
  const out: HairMapAnalysisReport["riskAreas"] = [];
  for (const item of arr) {
    if (!isRecord(item)) continue;
    out.push({
      area: str(item.area, "Zona"),
      level: asLevel(item.level),
      reason: str(item.reason, ""),
    });
  }
  return out.slice(0, 8);
}

function asMetricStrip(arr: unknown): HairMapMetricStripItem[] | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const out: HairMapMetricStripItem[] = [];
  for (const item of arr) {
    if (!isRecord(item)) continue;
    const label = str(item.label, "");
    const value = str(item.value, "");
    if (!label || !value) continue;
    out.push({
      key: str(item.key, label.toLowerCase().replace(/\s+/g, "_")),
      label,
      value,
    });
  }
  return out.length >= 4 ? out.slice(0, 12) : undefined;
}

function asScalpZoneStrip(arr: unknown): HairMapScalpZoneStripItem[] | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const out: HairMapScalpZoneStripItem[] = [];
  for (const item of arr) {
    if (!isRecord(item)) continue;
    const iconRaw = String(item.icon ?? "neutral");
    const icon: ScalpZoneStripIcon =
      iconRaw === "check" || iconRaw === "warn" || iconRaw === "neutral" ? iconRaw : "neutral";
    out.push({
      zone: str(item.zone, "Zona"),
      icon,
      micro: str(item.micro, ""),
    });
  }
  return out.length > 0 ? out.slice(0, 8) : undefined;
}

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
}

function asRecommendedRoutine(v: unknown): HairMapRecommendedRoutine | undefined {
  if (!isRecord(v)) return undefined;
  const cleanse = asStringArray(v.cleanse, 4);
  const treat = asStringArray(v.treat, 4);
  const protect = asStringArray(v.protect, 4);
  const style = asStringArray(v.style, 4);
  if (!cleanse.length && !treat.length && !protect.length && !style.length) return undefined;
  return { cleanse, treat, protect, style };
}

function asIngredientHints(v: unknown): HairMapIngredientHints | undefined {
  if (!isRecord(v)) return undefined;
  const helpful = asStringArray(v.helpful, 12);
  const avoid = asStringArray(v.avoid, 12);
  if (!helpful.length && !avoid.length) return undefined;
  return { helpful, avoid };
}

function asDensityDisk(v: unknown, fallback: HairMapDensityDisk): HairMapDensityDisk {
  if (!isRecord(v)) return fallback;
  return {
    label: str(v.label, fallback.label),
    intensity: clampScore(v.intensity, fallback.intensity),
    caption: str(v.caption, fallback.caption),
  };
}

/**
 * Fusiona JSON del modelo (o filas antiguas) con el esquema actual para que la UI y el PDF no rompan.
 */
export function normalizeHairMapReport(
  raw: unknown,
  answers?: Partial<MapaCapilarAnswers>
): HairMapAnalysisReport {
  const base = generateFallbackAnalysisReport(answers ?? {});
  if (!isRecord(raw)) return base;

  const summaryIn = isRecord(raw.summary) ? raw.summary : {};
  const summary: HairMapAnalysisReport["summary"] = {
    title: str(summaryIn.title, base.summary.title),
    mainFinding: str(summaryIn.mainFinding, base.summary.mainFinding),
    overallScore: clampScore(summaryIn.overallScore, base.summary.overallScore),
    confidence: asConfidence(summaryIn.confidence),
    priority: str(summaryIn.priority, base.summary.priority),
  };

  const ucIn = isRecord(raw.userContext) ? raw.userContext : {};
  const userContext: HairMapAnalysisReport["userContext"] = {
    age: str(ucIn.age, base.userContext.age),
    gender: str(ucIn.gender, base.userContext.gender),
    mainConcern: str(ucIn.mainConcern, base.userContext.mainConcern),
    hairLossDuration: str(ucIn.hairLossDuration, base.userContext.hairLossDuration),
    familyHistory: str(ucIn.familyHistory, base.userContext.familyHistory),
    scalpSymptoms: Array.isArray(ucIn.scalpSymptoms)
      ? ucIn.scalpSymptoms.map((x) => String(x)).filter(Boolean)
      : base.userContext.scalpSymptoms,
    washFrequency: str(ucIn.washFrequency, base.userContext.washFrequency),
    previousTreatments: str(ucIn.previousTreatments, base.userContext.previousTreatments),
    goal: ucIn.goal !== undefined ? str(ucIn.goal, "") || undefined : base.userContext.goal,
    questionnaireVsPhotoNote:
      ucIn.questionnaireVsPhotoNote !== undefined
        ? str(ucIn.questionnaireVsPhotoNote, "") || undefined
        : base.userContext.questionnaireVsPhotoNote,
  };

  const vaIn = isRecord(raw.visualAnalysis) ? raw.visualAnalysis : {};
  const visualAnalysis: HairMapAnalysisReport["visualAnalysis"] = {
    hairType: str(vaIn.hairType, base.visualAnalysis.hairType),
    density: str(vaIn.density, base.visualAnalysis.density),
    hairline: str(vaIn.hairline, base.visualAnalysis.hairline),
    scalpVisibility: str(vaIn.scalpVisibility, base.visualAnalysis.scalpVisibility),
    scalpState:
      vaIn.scalpState !== undefined
        ? str(vaIn.scalpState, "") || undefined
        : base.visualAnalysis.scalpState,
    crownCoverage: str(vaIn.crownCoverage, base.visualAnalysis.crownCoverage),
    hairTexture: str(vaIn.hairTexture, base.visualAnalysis.hairTexture),
    hairThickness: str(vaIn.hairThickness, base.visualAnalysis.hairThickness),
    overallCondition: str(vaIn.overallCondition, base.visualAnalysis.overallCondition),
  };

  const zonesIn = isRecord(raw.zones) ? raw.zones : {};
  const zones: HairMapAnalysisReport["zones"] = {
    frontalLine: asZone(zonesIn.frontalLine, base.zones.frontalLine),
    frontalDensity: asZone(zonesIn.frontalDensity, base.zones.frontalDensity),
    temples: asZone(zonesIn.temples, base.zones.temples),
    crown: asZone(zonesIn.crown, base.zones.crown),
    scalpHealth: asZone(zonesIn.scalpHealth, base.zones.scalpHealth),
  };

  const photoIn = isRecord(raw.photoCallouts) ? raw.photoCallouts : {};
  const photoCallouts = {
    frontPhoto: asPhotoCalloutList(photoIn.frontPhoto),
    crownPhoto: asPhotoCalloutList(photoIn.crownPhoto),
  };

  const densityIn = isRecord(raw.densityComparison) ? raw.densityComparison : {};
  const densityComparison =
    raw.densityComparison && isRecord(raw.densityComparison)
      ? {
          frontal: asDensityDisk(densityIn.frontal, {
            label: "Zona frontal",
            intensity: zones.frontalDensity.score,
            caption: zones.frontalDensity.label,
          }),
          crown: asDensityDisk(densityIn.crown, {
            label: "Coronilla",
            intensity: zones.crown.score,
            caption: zones.crown.label,
          }),
        }
      : undefined;

  const crownMapIn = isRecord(raw.crownDensityMap) ? raw.crownDensityMap : undefined;
  const crownDensityMap =
    crownMapIn && (crownMapIn.heatmapIntensity !== undefined || crownMapIn.legend !== undefined)
      ? {
          heatmapIntensity: clampScore(crownMapIn.heatmapIntensity, zones.crown.score),
          legend: str(crownMapIn.legend, "Densidad orientativa"),
        }
      : undefined;

  const riskAreas: HairMapAnalysisReport["riskAreas"] = Array.isArray(raw.riskAreas)
    ? asRiskAreas(raw.riskAreas)
    : base.riskAreas;
  const visualTags: string[] = Array.isArray(raw.visualTags)
    ? asStringArray(raw.visualTags, 12)
    : base.visualTags;

  return {
    outputHint: isRecord(raw.outputHint)
      ? { layout: str(raw.outputHint.layout, ""), language: str(raw.outputHint.language, "") }
      : undefined,
    brandLine: raw.brandLine !== undefined ? str(raw.brandLine, "") || undefined : undefined,
    header:
      isRecord(raw.header) && (raw.header.title || raw.header.subtitle)
        ? {
            title: str(raw.header.title, "Mapa Capilar AI"),
            subtitle: str(raw.header.subtitle, "EvaluaciÃ³n visual orientativa"),
          }
        : undefined,
    summary,
    userContext,
    visualAnalysis,
    metricStrip: asMetricStrip(raw.metricStrip),
    densityComparison,
    crownDensityMap,
    scalpZoneStrip: asScalpZoneStrip(raw.scalpZoneStrip),
    zones,
    riskAreas,
    visualTags,
    photoCallouts,
    recommendedRoutine: asRecommendedRoutine(raw.recommendedRoutine),
    ingredientHints: asIngredientHints(raw.ingredientHints),
    disclaimer: str(raw.disclaimer, base.disclaimer),
  };
}

export function generateFallbackAnalysisReport(
  answers: Partial<MapaCapilarAnswers>
): HairMapAnalysisReport {
  return {
    summary: {
      title: "Mapa Capilar IA",
      mainFinding: "AnÃ¡lisis visual preliminar completado segÃºn tus respuestas.",
      overallScore: 65,
      confidence: "Media",
      priority: "Seguimiento recomendado",
    },
    userContext: {
      age: "No especificado",
      gender: "No especificado",
      mainConcern: answers.concern ?? "No especificado",
      hairLossDuration: answers.duration ?? "No especificado",
      familyHistory: answers.familyHistory ?? "No especificado",
      scalpSymptoms: [],
      washFrequency: "No especificado",
      previousTreatments: answers.previousTreatment ?? "No especificado",
      goal: answers.goal ?? "No especificado",
    },
    visualAnalysis: {
      hairType: "No concluyente",
      density: "Media",
      hairline: "Estable",
      scalpVisibility: "Moderada",
      scalpState: "No concluyente",
      crownCoverage: "Adecuada",
      hairTexture: "Media",
      hairThickness: "Medio",
      overallCondition: "Estado visual estÃ¡ndar",
    },
    zones: {
      frontalLine: { status: "Estable", score: 70, label: "Sin cambios evidentes" },
      frontalDensity: { status: "Media", score: 65, label: "Densidad moderada" },
      temples: { status: "Estable", score: 70, label: "Sin alteraciones" },
      crown: { status: "Adecuada", score: 65, label: "Cobertura aceptable" },
      scalpHealth: { status: "Saludable", score: 75, label: "Sin irritaciÃ³n visible" },
    },
    riskAreas: [],
    visualTags: ["AnÃ¡lisis preliminar", "Requiere revisiÃ³n profesional"],
    photoCallouts: { frontPhoto: [], crownPhoto: [] },
    disclaimer:
      "Este anÃ¡lisis es visual y orientativo. No constituye diagnÃ³stico mÃ©dico ni reemplaza una evaluaciÃ³n profesional.",
  };
}

export interface MapaCapilarReport {
  hairType: string;
  visualDensity: string;
  hairlineRecession: string;
  scalpVisibility: string;
  observationZones: string[];
  crownCoverage: string;
  densityMap: Record<"frontal" | "entradas" | "superior" | "coronilla" | "laterales", string>;
  nextStep: string;
  summary: string;
}

export function generateFallbackReport(concern: string, goal: string): MapaCapilarReport {
  const needsEval = goal.includes("Evaluar") || goal.includes("Minimizar");
  const isTransplant = concern === "Estoy evaluando trasplante";
  const isCrown = concern === "Coronilla";
  const isTemples = concern === "Entradas";

  return {
    hairType: "Liso",
    visualDensity: needsEval || isTransplant ? "Baja" : "Media",
    hairlineRecession: isTransplant
      ? "RecesiÃ³n moderada aparente"
      : needsEval
      ? "RecesiÃ³n leve aparente"
      : "Sin cambios visibles",
    scalpVisibility: needsEval ? "Media" : "Baja",
    observationZones: isTransplant
      ? ["Entradas", "Zona frontal", "Coronilla"]
      : isCrown
      ? ["Coronilla"]
      : isTemples
      ? ["Entradas", "Zona frontal"]
      : ["Zona media"],
    crownCoverage: isTransplant
      ? "Cobertura reducida aparente"
      : isCrown
      ? "Cobertura media"
      : "Buena cobertura visual",
    densityMap: {
      frontal: isTemples || isTransplant ? "Baja" : "Media",
      entradas: isTemples || isTransplant ? "Baja" : "Media",
      superior: "Media",
      coronilla: isCrown || isTransplant ? "Baja" : "Media",
      laterales: "Alta",
    },
    nextStep: isTransplant
      ? "Evaluar recuperaciÃ³n capilar / trasplante"
      : needsEval
      ? "Evaluar caÃ­da con revisiÃ³n mÃ©dica"
      : "Seguir monitoreando",
    summary:
      "AnÃ¡lisis visual orientativo generado segÃºn tus respuestas y foto. No reemplaza una evaluaciÃ³n mÃ©dica profesional.",
  };
}

// â”€â”€â”€ Nuevo normalizer para HairMapReport (schema rico directo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Si el JSON de OpenAI ya viene con el nuevo schema (tiene patient.norwood_stage),
// lo devolvemos directo sin transformar. Si no, usamos el fallback.
import type { HairMapReport } from "@/lib/types";

export function normalizeToHairMapReport(
  raw: unknown,
  _answers?: Partial<MapaCapilarAnswers>
): HairMapReport {
  if (
    isRecord(raw) &&
    isRecord(raw.patient) &&
    typeof (raw.patient as Record<string, unknown>).norwood_stage === "number"
  ) {
    return raw as unknown as HairMapReport;
  }
  // fallback al schema rico
  const { generateFallbackHairAnalysis } = require("@/lib/hairMapAnalysis");
  return generateFallbackHairAnalysis() as HairMapReport;
}

