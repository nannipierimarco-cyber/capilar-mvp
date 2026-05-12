"use client";

import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";
import { cn } from "@/lib/utils";
import {
  Activity,
  Droplets,
  ScanFace,
  Sparkles,
  SunMedium,
  Wind,
  Layers,
  CircleDot,
} from "lucide-react";

/* ─── Premium palette (trichology report aesthetic) ─── */
const gold = "#B8956A";
const goldLight = "#E8DCC8";
const cream = "#FAF8F5";
const ink = "#1C1917";
const inkMuted = "#57534E";

function scoreHue(score: number): string {
  if (score >= 70) return "#6B9B7A";
  if (score >= 45) return "#C9A227";
  return "#C45C5C";
}

function levelDotClass(level: string): string {
  if (level === "Alto") return "bg-red-400";
  if (level === "Medio") return "bg-amber-400";
  return "bg-emerald-400";
}

/** Match free-text from AI to one option for pill highlight */
function closestOption(value: string, options: string[]): string {
  const v = value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  for (const o of options) {
    const o2 = o.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (v.includes(o2) || o2.split(/\s+/).some((w) => w.length > 2 && v.includes(w))) return o;
  }
  return options[Math.floor(options.length / 2)] ?? value;
}

function PillSelector({
  label,
  options,
  current,
}: {
  label: string;
  options: string[];
  current: string;
}) {
  const active = closestOption(current, options);
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <span
            key={o}
            className={cn(
              "text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors",
              o === active
                ? "border border-transparent bg-[#F5EFE6] text-stone-900"
                : "border border-stone-100 bg-stone-50/80 text-stone-500"
            )}
            style={o === active ? { borderColor: gold, borderWidth: 1, borderStyle: "solid" } : undefined}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Abstract follicle density rings — illustrative, not clinical measurement */
function FollicleDensityRings({
  label,
  score,
  sub,
}: {
  label: string;
  score: number;
  sub: string;
}) {
  const hue = scoreHue(score);
  const dense = Math.min(1, Math.max(0, score / 100));
  const count = 28;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[88px] h-[88px]">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <circle cx="50" cy="50" r="46" fill="#F5F0E8" stroke={goldLight} strokeWidth="1" />
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const r = 12 + (i % 5) * 5.5;
            const x = 50 + Math.cos(angle) * r * 0.85;
            const y = 50 + Math.sin(angle) * r * 0.85;
            const threshold = 3 - Math.round(dense * 2);
            const show =
              (i * 11 + Math.round(dense * 100)) % Math.max(2, threshold) !== 0 || dense >= 0.65;
            if (!show) return null;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={1.1 + dense * 0.6}
                fill={hue}
                opacity={0.35 + dense * 0.45}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-bold tabular-nums" style={{ color: hue }}>
            {score}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-stone-800 mt-2 leading-tight">{label}</p>
      <p className="text-[9px] text-stone-500 mt-0.5 max-w-[100px] leading-snug">{sub}</p>
    </div>
  );
}

function OrnamentalRule() {
  return (
    <div className="flex items-center justify-center gap-3 py-1" aria-hidden>
      <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#C9A227]/60" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#C9A227] shrink-0">
        <path
          d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.8 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="currentColor"
          fillOpacity="0.15"
        />
      </svg>
      <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#C9A227]/60" />
    </div>
  );
}

function ScalpZoneIcon({
  zone,
  variant,
  micro,
}: {
  zone: string;
  variant: "ok" | "warn" | "neutral";
  /** Si viene del modelo, reemplaza la etiqueta OK/Revisar */
  micro?: string;
}) {
  const cls =
    variant === "ok"
      ? "bg-emerald-50 border-emerald-200/80 text-emerald-700"
      : variant === "warn"
      ? "bg-amber-50 border-amber-200/80 text-amber-800"
      : "bg-stone-50 border-stone-200/80 text-stone-600";
  const label = micro?.trim()
    ? micro.trim()
    : variant === "ok"
    ? "OK"
    : variant === "warn"
    ? "Revisar"
    : "—";
  return (
    <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border", cls)}>
        <ScanFace className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <span className="text-[9px] font-medium text-stone-600 text-center leading-tight">{zone}</span>
      <span
        className={cn(
          "text-[8px] font-semibold uppercase tracking-wide text-center leading-tight px-0.5 line-clamp-2",
          variant === "ok" && "text-emerald-600",
          variant === "warn" && "text-amber-600",
          variant === "neutral" && "text-stone-500",
          micro && "normal-case font-medium text-stone-600"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export interface HairMapPremiumInfographicProps {
  report: HairMapAnalysisReport;
  frontalUrl?: string;
  crownUrl?: string;
  className?: string;
}

const METRIC_ICONS: Record<string, typeof Wind> = {
  hairType: Wind,
  density: Activity,
  hairline: ScanFace,
  scalp: Droplets,
  texture: Layers,
  thickness: CircleDot,
  crown: Sparkles,
  overall: SunMedium,
};

export function HairMapPremiumInfographic({
  report,
  frontalUrl,
  crownUrl,
  className,
}: HairMapPremiumInfographicProps) {
  const s = report.summary;
  const va = report.visualAnalysis;
  const z = report.zones;

  const metricStrip: { label: string; value: string; Icon: typeof Wind }[] =
    report.metricStrip && report.metricStrip.length >= 4
      ? report.metricStrip.map((m) => ({
          label: m.label,
          value: m.value,
          Icon: METRIC_ICONS[m.key] ?? Sparkles,
        }))
      : [
          { label: "Tipo", value: va.hairType, Icon: Wind },
          { label: "Densidad", value: va.density, Icon: Activity },
          { label: "Línea", value: va.hairline, Icon: ScanFace },
          {
            label: "Cuero",
            value: va.scalpState ?? va.scalpVisibility,
            Icon: Droplets,
          },
          { label: "Textura", value: va.hairTexture, Icon: Layers },
          { label: "Grosor", value: va.hairThickness, Icon: CircleDot },
          { label: "Coronilla", value: va.crownCoverage, Icon: Sparkles },
          { label: "Estado", value: va.overallCondition, Icon: SunMedium },
        ];

  const riskNames = new Set(report.riskAreas.map((r) => r.area.toLowerCase()));

  const zoneStripLegacy = [
    { name: "Frontal", ok: !riskNames.has("zona frontal") && !riskNames.has("frente") },
    { name: "Entradas", ok: !riskNames.has("entradas") },
    { name: "Media", ok: !riskNames.has("zona media") },
    { name: "Coronilla", ok: !riskNames.has("coronilla") },
    { name: "Laterales", ok: !riskNames.has("laterales") },
    { name: "Cuero", ok: z.scalpHealth.score >= 50 },
  ];

  const scalpStripFromAi =
    report.scalpZoneStrip && report.scalpZoneStrip.length > 0
      ? report.scalpZoneStrip.map((row) => ({
          zone: row.zone,
          variant: row.icon === "check" ? ("ok" as const) : row.icon === "warn" ? ("warn" as const) : ("neutral" as const),
          micro: row.micro,
        }))
      : null;

  const frontalDisk = report.densityComparison?.frontal;
  const crownDisk = report.densityComparison?.crown;
  const heatIntensity = report.crownDensityMap?.heatmapIntensity ?? z.crown.score;
  const heatOpacity = 0.28 + (Math.min(100, Math.max(0, heatIntensity)) / 100) * 0.38;

  return (
    <div
      className={cn(
        "rounded-3xl overflow-hidden border border-stone-200/90 shadow-xl shadow-stone-200/40",
        className
      )}
      style={{ background: `linear-gradient(180deg, ${cream} 0%, #FFFFFF 45%, ${cream} 100%)` }}
    >
      {/* Header */}
      <header className="px-6 pt-8 pb-4 text-center relative">
        <div
          className="absolute inset-x-0 top-0 h-24 opacity-[0.07] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${gold} 0%, transparent 70%)`,
          }}
        />
        <div className="flex justify-end items-start mb-2">
          <div className="flex items-center gap-2 text-stone-600">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden>
              <path d="M20 4L35 20L20 36L5 20L20 4Z" stroke={gold} strokeWidth="1.2" fill={`${gold}22`} />
            </svg>
            <div className="text-left leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: gold }}>
                Perfecto
              </p>
              <p className="text-[8px] text-stone-500 uppercase tracking-wider">Mapa capilar</p>
            </div>
          </div>
        </div>
        <h1
          className="text-[1.65rem] leading-tight font-semibold tracking-tight px-2"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: ink }}
        >
          {report.header?.title ?? "Análisis visual capilar"}
        </h1>
        <p className="text-xs mt-2 font-medium" style={{ color: inkMuted }}>
          {report.header?.subtitle ?? "Evaluación orientativa de tricología digital"}
        </p>
        {report.userContext.questionnaireVsPhotoNote ? (
          <p className="text-[10px] text-stone-500 mt-2 px-3 leading-snug italic">
            {report.userContext.questionnaireVsPhotoNote}
          </p>
        ) : null}
        <OrnamentalRule />
      </header>

      {/* Hero score */}
      <div className="px-5 mb-6">
        <div
          className="rounded-2xl border p-4 flex gap-4 items-stretch"
          style={{
            borderColor: goldLight,
            background: "linear-gradient(135deg, #FFFFFF 0%, #F7F2EA 100%)",
          }}
        >
          <div
            className="shrink-0 w-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-md"
            style={{ background: `linear-gradient(145deg, ${scoreHue(s.overallScore)}, ${gold})` }}
          >
            <span className="text-2xl font-bold tabular-nums leading-none">{s.overallScore}</span>
            <span className="text-[9px] opacity-90 mt-1">/100</span>
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              {s.priority}
            </p>
            <p className="text-sm font-semibold text-stone-900 leading-snug mt-1">{s.mainFinding}</p>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Confianza: <span className="font-medium text-stone-700">{s.confidence}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Photo row + density illustration */}
      <div className="px-5 mb-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3 text-center"
          style={{ color: gold }}
        >
          Análisis fotográfico
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-[4/5] bg-stone-100 shadow-inner">
              {frontalUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={frontalUrl}
                  alt="Vista frontal"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs px-4 text-center">
                  Sin foto frontal
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/55 to-transparent pt-8 pb-2 px-2">
                <p className="text-[10px] font-semibold text-white">Vista frontal</p>
              </div>
            </div>
            {report.photoCallouts.frontPhoto.length > 0 && (
              <ul className="space-y-1">
                {report.photoCallouts.frontPhoto.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-stone-600">
                    <span className="text-[#C9A227] mt-0.5">◆</span>
                    <span>
                      <span className="font-medium text-stone-800">{c.label}</span>
                      <span className="text-stone-400"> · {c.area}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-[4/5] bg-stone-100 shadow-inner">
              {crownUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crownUrl}
                    alt="Coronilla"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-multiply"
                    style={{
                      opacity: heatOpacity,
                      background:
                        "radial-gradient(circle at 50% 42%, rgba(196,92,92,0.45) 0%, rgba(201,162,39,0.25) 35%, rgba(107,155,122,0.2) 65%, transparent 85%)",
                    }}
                    aria-hidden
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs px-4 text-center">
                  Sin foto coronilla
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/55 to-transparent pt-8 pb-2 px-2">
                <p className="text-[10px] font-semibold text-white">Coronilla</p>
                <p className="text-[8px] text-white/85 mt-0.5">
                  {report.crownDensityMap?.legend ?? "Mapa de densidad orientativo"}
                </p>
              </div>
            </div>
            {report.photoCallouts.crownPhoto.length > 0 && (
              <ul className="space-y-1">
                {report.photoCallouts.crownPhoto.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-stone-600">
                    <span className="text-[#C9A227] mt-0.5">◆</span>
                    <span>
                      <span className="font-medium text-stone-800">{c.label}</span>
                      <span className="text-stone-400"> · {c.area}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-5 pt-4 border-t border-stone-200/80">
          <FollicleDensityRings
            label={frontalDisk?.label ?? "Zona frontal"}
            score={frontalDisk?.intensity ?? z.frontalDensity.score}
            sub={frontalDisk?.caption ?? z.frontalDensity.label}
          />
          <FollicleDensityRings
            label={crownDisk?.label ?? "Coronilla"}
            score={crownDisk?.intensity ?? z.crown.score}
            sub={crownDisk?.caption ?? z.crown.label}
          />
        </div>
      </div>

      {/* Metric icon strip */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {metricStrip.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-stone-100 bg-white/80 p-2.5 text-center shadow-sm"
            >
              <Icon className="w-4 h-4 mx-auto mb-1 text-stone-500" strokeWidth={1.5} />
              <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-400">
                {label}
              </p>
              <p className="text-[10px] font-semibold text-stone-800 leading-tight mt-0.5 line-clamp-2">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pill selectors */}
      <div className="px-5 mb-6 grid grid-cols-2 gap-2.5">
        <PillSelector
          label="Tipo de pelo"
          options={["Liso", "Ondulado", "Rizado", "Muy rizado"]}
          current={va.hairType}
        />
        <PillSelector label="Densidad" options={["Baja", "Media", "Alta"]} current={va.density} />
        <PillSelector
          label="Línea capilar"
          options={["Estable", "Recesión leve", "Recesión moderada", "Recesión avanzada"]}
          current={va.hairline}
        />
        <PillSelector
          label="Cuero cabelludo (aparente)"
          options={[
            "Saludable aparente",
            "Graso aparente",
            "Seco aparente",
            "Descamación aparente",
            "Sensible aparente",
            "No concluyente",
            "Saludable",
            "Graso",
            "Seco",
            "Descamación",
            "Sensible",
          ]}
          current={va.scalpState ?? va.scalpVisibility}
        />
      </div>

      {/* Risk areas */}
      <div className="px-5 mb-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3"
          style={{ color: gold }}
        >
          Áreas de atención
        </p>
        <div className="rounded-2xl border border-stone-200 bg-white/90 p-3 space-y-2">
          {report.riskAreas.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-2">
              Sin zonas marcadas como prioritarias en este análisis.
            </p>
          ) : (
            report.riskAreas.map((risk, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className={cn("w-2 h-2 rounded-full shrink-0", levelDotClass(risk.level))} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-800">{risk.area}</p>
                  <p className="text-[10px] text-stone-500 leading-snug">{risk.reason}</p>
                </div>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0",
                    risk.level === "Alto" && "bg-red-50 text-red-700",
                    risk.level === "Medio" && "bg-amber-50 text-amber-800",
                    risk.level === "Bajo" && "bg-emerald-50 text-emerald-700"
                  )}
                >
                  {risk.level}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scalp zones strip */}
      <div className="px-5 mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-3 text-center">
          Zonas del cuero cabelludo
        </p>
        <div className="flex justify-between gap-1 px-1">
          {scalpStripFromAi
            ? scalpStripFromAi.map((row) => (
                <ScalpZoneIcon key={row.zone} zone={row.zone} variant={row.variant} micro={row.micro} />
              ))
            : zoneStripLegacy.map((z) => (
                <ScalpZoneIcon key={z.name} zone={z.name} variant={z.ok ? "ok" : "warn"} />
              ))}
        </div>
      </div>

      {/* Zone score bars — compact */}
      <div className="px-5 mb-6 space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Indicadores por zona
        </p>
        {(
          [
            ["Línea frontal", z.frontalLine],
            ["Densidad frontal", z.frontalDensity],
            ["Entradas", z.temples],
            ["Coronilla", z.crown],
            ["Cuero cabelludo", z.scalpHealth],
          ] as const
        ).map(([name, zone]) => (
          <div key={name}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="font-medium text-stone-700">{name}</span>
              <span className="text-stone-500">{zone.score}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden border border-stone-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${zone.score}%`, backgroundColor: scoreHue(zone.score) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {report.visualTags.length > 0 && (
        <div className="px-5 mb-6 flex flex-wrap gap-2 justify-center">
          {report.visualTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-3 py-1.5 rounded-full border"
              style={{ borderColor: goldLight, background: "#FFFCF7", color: inkMuted }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Context summary — compact */}
      <div className="px-5 mb-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Contexto declarado
        </p>
        <div className="grid gap-1.5 text-[10px] text-stone-600">
          <p>
            <span className="text-stone-400">Preocupación:</span>{" "}
            <span className="font-medium text-stone-800">{report.userContext.mainConcern}</span>
          </p>
          <p>
            <span className="text-stone-400">Evolución:</span>{" "}
            <span className="font-medium text-stone-800">{report.userContext.hairLossDuration}</span>
          </p>
          {report.userContext.goal ? (
            <p>
              <span className="text-stone-400">Objetivo:</span>{" "}
              <span className="font-medium text-stone-800">{report.userContext.goal}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-8 pt-2 border-t border-stone-200/80 bg-white/50">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[9px] text-stone-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C9A227]" />
            Evaluación visual asistida
          </span>
          <span>Los resultados pueden variar</span>
          <span>Consulta a un profesional para diagnóstico</span>
        </div>
        <p className="text-[9px] text-stone-400 text-center mt-3 leading-relaxed">{report.disclaimer}</p>
      </footer>
    </div>
  );
}
