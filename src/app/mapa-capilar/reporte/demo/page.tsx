"use client";

import { HairMapLuxeInfographic } from "@/components/hair-report/HairMapLuxeInfographic";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

const DEMO: HairMapAnalysisReport = {
  header: {
    title: "AI Hair & Scalp Analysis",
    subtitle: "Visual trichology assessment",
  },
  summary: {
    title: "Mapa Capilar IA",
    mainFinding: "Patrón compatible con adelgazamiento leve en corona y entradas.",
    overallScore: 62,
    confidence: "Media",
    priority: "Seguimiento recomendado",
  },
  userContext: {
    age: "32",
    gender: "Masculino",
    mainConcern: "Coronilla y entradas",
    hairLossDuration: "1-2 años",
    familyHistory: "Sí",
    scalpSymptoms: [],
    washFrequency: "3 veces por semana",
    previousTreatments: "Ninguno",
    goal: "Frenar la caída",
  },
  visualAnalysis: {
    hairType: "Wavy",
    density: "Medium overall",
    hairline: "Mild recession",
    scalpVisibility: "Moderate at vertex",
    scalpState: "Generally healthy",
    crownCoverage: "Reduced",
    hairTexture: "Medium thickness",
    hairThickness: "Medium",
    overallCondition: "Good shaft quality",
  },
  zones: {
    frontalLine:    { status: "Stable",           score: 72, label: "Mostly preserved" },
    frontalDensity: { status: "Fair to good",     score: 65, label: "Fair to good" },
    temples:        { status: "Mild recession",   score: 52, label: "Mild recession" },
    crown:          { status: "Visible thinning", score: 38, label: "Visible thinning" },
    scalpHealth:    { status: "Healthy",          score: 78, label: "No obvious irritation" },
  },
  crownDensityMap: {
    heatmapIntensity: 68,
    legend: "Elevated crown zone",
  },
  riskAreas: [
    { area: "Temples",      level: "Medio", reason: "Mild bilateral recession" },
    { area: "Frontal zone", level: "Bajo",  reason: "Density mostly preserved" },
    { area: "Mid-scalp",    level: "Medio", reason: "Early thinning signs" },
    { area: "Crown",        level: "Alto",  reason: "Visible density reduction at vertex" },
  ],
  visualTags: ["Androgenetic pattern", "Crown thinning", "Mild temple recession"],
  photoCallouts: {
    frontPhoto: [
      { label: "Temples",         area: "Mild recession", level: "Medio" },
      { label: "Hairline",        area: "Mild recession", level: "Medio" },
      { label: "Frontal density", area: "Fair to good",   level: "Bajo"  },
    ],
    crownPhoto: [
      { label: "Vertex (crown)",   area: "Visible thinning",    level: "Alto"  },
      { label: "Scalp visibility", area: "Moderate at vertex",  level: "Medio" },
      { label: "Mid-scalp",        area: "Maintained",          level: "Bajo"  },
    ],
  },
  disclaimer:
    "Este análisis es visual y orientativo. No constituye diagnóstico médico ni reemplaza una evaluación profesional.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen py-8" style={{ background: "#F0EDE8" }}>
      <div className="mx-auto max-w-[840px] px-4">
        <p className="mb-3 text-center text-xs font-medium text-stone-400 uppercase tracking-widest">
          Visual demo · datos estáticos · sin fotos reales
        </p>
        <div className="rounded-2xl p-2 shadow-xl" style={{ background: "#FDFBF7" }}>
          <HairMapLuxeInfographic report={DEMO} />
        </div>
      </div>
    </div>
  );
}
