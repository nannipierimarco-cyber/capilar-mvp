"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { HairAnalysisResult } from "@/lib/hairMapAnalysis";

// ─── Config ──────────────────────────────────────────────────────────────────

const FRONTAL_CALLOUTS = [
  { label: "Línea frontal", x: 50, y: 16 },
  { label: "Entradas", x: 18, y: 30 },
  { label: "Densidad frontal", x: 80, y: 46 },
  { label: "Textura", x: 22, y: 66 },
  { label: "Cobertura frontal", x: 62, y: 76 },
];

const CROWN_CALLOUTS = [
  { label: "Coronilla", x: 50, y: 50 },
  { label: "Vis. cuero cab.", x: 76, y: 26 },
  { label: "Zona media", x: 24, y: 42 },
  { label: "Densidad superior", x: 72, y: 70 },
  { label: "Cobertura coronilla", x: 38, y: 20 },
];

const RISK_PILL: Record<string, string> = {
  Bajo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medio: "bg-amber-50 text-amber-700 border-amber-200",
  Alto: "bg-red-50 text-red-700 border-red-200",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HairMapReportProps {
  frontalImageUrl: string | null;
  crownImageUrl: string | null;
  analysisResult: HairAnalysisResult;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HairMapReport({
  frontalImageUrl,
  crownImageUrl,
  analysisResult: r,
}: HairMapReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#fafaf8",
      });
      const a = document.createElement("a");
      a.download = "mapa-capilar-ia.png";
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("[HairMapReport] download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Title + download button — outside capture area */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground leading-tight">
            Tu Mapa Capilar está listo
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Revisa tu análisis visual y descarga tu reporte personalizado.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 whitespace-nowrap"
        >
          {downloading ? "Generando…" : "Descargar reporte"}
        </button>
      </div>

      {/* Scroll wrapper for mobile */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        {/* ═══ REPORT — captured for download ═══ */}
        <div
          ref={reportRef}
          className="min-w-[680px] rounded-2xl border border-[#e6d9bc] overflow-hidden text-[#1a1a1a]"
          style={{ backgroundColor: "#fafaf8", fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          {/* HEADER */}
          <div
            className="px-6 py-5 flex items-start justify-between border-b border-[#e6d9bc]"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1"
                style={{ color: "#c9a84c" }}
              >
                Perfecto Labs
              </p>
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "#1a1a1a" }}>
                Mapa Capilar IA
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                Análisis visual de pelo y cuero cabelludo
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap mt-1"
              style={{
                backgroundColor: "#fdf3d8",
                color: "#8a6c2c",
                borderColor: "#e6d9bc",
              }}
            >
              Evaluación visual estimada
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* ── PHOTOS ── */}
            <div className="grid grid-cols-2 gap-4">
              <PhotoCard
                label="Vista frontal / lateral"
                imageUrl={frontalImageUrl}
                callouts={FRONTAL_CALLOUTS}
              />
              <PhotoCard
                label="Vista superior / coronilla"
                imageUrl={crownImageUrl}
                callouts={CROWN_CALLOUTS}
              />
            </div>

            {/* ── DENSITY MAP + STATE ── */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "3fr 2fr" }}>
              {/* Density bars */}
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
              >
                <SectionLabel>Mapa de densidad</SectionLabel>
                <div className="space-y-2.5 mt-3">
                  {[
                    { label: "Entradas", value: r.riskAreas.temples },
                    { label: "Zona frontal", value: r.riskAreas.frontalZone },
                    { label: "Zona media", value: r.riskAreas.midScalp },
                    { label: "Coronilla", value: r.riskAreas.crown },
                  ].map(({ label, value }) => (
                    <DensityBar key={label} label={label} level={value} />
                  ))}
                  {/* Legend */}
                  <div className="flex gap-4 pt-1">
                    {[
                      { color: "#34d399", label: "Baja afectación" },
                      { color: "#fbbf24", label: "Media" },
                      { color: "#f87171", label: "Alta afectación" },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[9px]" style={{ color: "#6b7280" }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall condition */}
              <div
                className="rounded-xl border p-4 flex flex-col justify-center"
                style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
              >
                <SectionLabel>Estado general</SectionLabel>
                <p className="text-base font-bold mt-2 leading-snug" style={{ color: "#1a1a1a" }}>
                  {r.overallCondition}
                </p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#6b7280" }}>
                  {r.summary}
                </p>
              </div>
            </div>

            {/* ── SUMMARY CARDS ── */}
            <div>
              <SectionLabel>Resumen del análisis</SectionLabel>
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {[
                  { symbol: "〰", title: "Tipo de pelo", value: r.hairType },
                  { symbol: "◈", title: "Densidad general", value: r.density, note: r.densityNote },
                  { symbol: "—", title: "Línea capilar", value: r.hairlineStatus },
                  { symbol: "◇", title: "Cuero cabelludo", value: r.scalpStatus },
                  { symbol: "○", title: "Vis. cuero cabelludo", value: r.scalpVisibility },
                  { symbol: "●", title: "Cobertura coronilla", value: r.crownCoverage },
                  { symbol: "≈", title: "Textura", value: r.texture },
                  { symbol: "≡", title: "Grosor", value: r.thickness },
                  { symbol: "✦", title: "Estado general", value: r.overallCondition },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border p-3"
                    style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
                  >
                    <div className="text-base mb-1">{card.symbol}</div>
                    <p
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: "#6b7280" }}
                    >
                      {card.title}
                    </p>
                    <p className="text-xs font-bold mt-0.5 leading-snug" style={{ color: "#1a1a1a" }}>
                      {card.value}
                    </p>
                    {card.note && (
                      <p className="text-[9px] mt-0.5" style={{ color: "#9ca3af" }}>
                        {card.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── CLASSIFIERS ── */}
            <div>
              <SectionLabel>Clasificadores visuales</SectionLabel>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <ClassifierRow
                  label="Tipo de pelo"
                  options={["Liso", "Ondulado", "Rizado", "Muy rizado"]}
                  selected={r.hairType}
                />
                <ClassifierRow
                  label="Densidad"
                  options={["Baja", "Media", "Alta"]}
                  selected={r.density}
                />
                <ClassifierRow
                  label="Línea capilar"
                  options={[
                    "Estable",
                    "Recesión leve",
                    "Recesión moderada",
                    "Recesión avanzada",
                  ]}
                  selected={r.hairlineStatus}
                />
                <ClassifierRow
                  label="Cuero cabelludo"
                  options={["Saludable", "Graso", "Seco", "Con descamación", "Sensible"]}
                  selected={r.scalpStatus}
                />
              </div>
            </div>

            {/* ── RISK AREAS ── */}
            <div>
              <SectionLabel>Áreas de riesgo</SectionLabel>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {[
                  { label: "Entradas", value: r.riskAreas.temples },
                  { label: "Zona frontal", value: r.riskAreas.frontalZone },
                  { label: "Zona media", value: r.riskAreas.midScalp },
                  { label: "Coronilla", value: r.riskAreas.crown },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border p-3 flex items-center justify-between"
                    style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
                  >
                    <span className="text-xs font-medium" style={{ color: "#1a1a1a" }}>
                      {label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        RISK_PILL[value] ?? "bg-gray-50 text-gray-600 border-gray-200"
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ZONE ANNOTATIONS ── */}
            <div>
              <SectionLabel>Anotación por zona</SectionLabel>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {[
                  { symbol: "—", title: "Línea frontal", value: r.zoneAnnotations.hairline },
                  { symbol: "◈", title: "Entradas", value: r.zoneAnnotations.temples },
                  {
                    symbol: "▦",
                    title: "Densidad frontal",
                    value: r.zoneAnnotations.frontalDensity,
                  },
                  { symbol: "○", title: "Zona media", value: r.zoneAnnotations.midScalp },
                  { symbol: "◎", title: "Coronilla", value: r.zoneAnnotations.crown },
                  {
                    symbol: "◇",
                    title: "Cuero cabelludo",
                    value: r.zoneAnnotations.scalpHealth,
                  },
                ].map(({ symbol, title, value }) => (
                  <div
                    key={title}
                    className="rounded-xl border p-3"
                    style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
                  >
                    <span className="text-sm">{symbol}</span>
                    <p
                      className="text-[9px] uppercase tracking-wider mt-1"
                      style={{ color: "#6b7280" }}
                    >
                      {title}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#1a1a1a" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DISCLAIMER ── */}
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
            >
              <p className="text-[10px] leading-relaxed" style={{ color: "#6b7280" }}>
                <strong style={{ color: "#8a6c2c" }}>Aviso:</strong> Este análisis es una
                evaluación visual estimada generada con IA. No reemplaza una consulta médica o
                diagnóstico profesional. Los resultados pueden variar según iluminación, ángulo de
                foto, largo del pelo y calidad de imagen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary action */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full rounded-full border border-border h-12 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60"
      >
        {downloading ? "Generando reporte…" : "Descargar reporte (PNG)"}
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{ color: "#8a6c2c" }}
    >
      {children}
    </p>
  );
}

function PhotoCard({
  label,
  imageUrl,
  callouts,
}: {
  label: string;
  imageUrl: string | null;
  callouts: { label: string; x: number; y: number }[];
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
        style={{ color: "#8a6c2c" }}
      >
        {label}
      </p>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ backgroundColor: "#ede8df", aspectRatio: "3/4" }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              Foto no disponible
            </p>
          </div>
        )}

        {/* Callout markers */}
        {imageUrl &&
          callouts.map((c) => (
            <div
              key={c.label}
              className="absolute flex items-center gap-0.5 pointer-events-none"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full border-2 border-white flex-shrink-0"
                style={{ backgroundColor: "#c9a84c", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
              />
              <span
                className="text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
              >
                {c.label}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function DensityBar({ label, level }: { label: string; level: string }) {
  const barWidth = level === "Alto" ? "75%" : level === "Medio" ? "50%" : "25%";
  const barColor = level === "Alto" ? "#f87171" : level === "Medio" ? "#fbbf24" : "#34d399";
  const labelColor =
    level === "Alto" ? "#b91c1c" : level === "Medio" ? "#92400e" : "#065f46";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-20 flex-shrink-0" style={{ color: "#6b7280" }}>
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "#ede8df" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: barWidth, backgroundColor: barColor }}
        />
      </div>
      <span
        className="text-[9px] font-bold w-10 text-right"
        style={{ color: labelColor }}
      >
        {level}
      </span>
    </div>
  );
}

function ClassifierRow({
  label,
  options,
  selected,
}: {
  label: string;
  options: string[];
  selected: string;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ backgroundColor: "#ffffff", borderColor: "#e6d9bc" }}
    >
      <p
        className="text-[9px] uppercase tracking-wider mb-2"
        style={{ color: "#6b7280" }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isSelected = opt === selected;
          return (
            <span
              key={opt}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
              style={
                isSelected
                  ? { backgroundColor: "#c9a84c", color: "#ffffff", borderColor: "#c9a84c" }
                  : { backgroundColor: "#fafaf8", color: "#9ca3af", borderColor: "#e6d9bc" }
              }
            >
              {opt}
            </span>
          );
        })}
      </div>
    </div>
  );
}
