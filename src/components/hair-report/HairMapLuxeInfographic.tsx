"use client";

import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";
import { cn } from "@/lib/utils";
import { A4_WIDTH_PX, HR } from "./tokens";
import {
  DiamondOrnament,
  IconCrownRing,
  IconDensityBundle,
  IconFollicleDiscDense,
  IconFollicleDiscSparse,
  IconFooterCalendar,
  IconFooterCamera,
  IconFooterPerson,
  IconHairlineHead,
  IconHairTypeStrands,
  IconScalpSurface,
  IconShieldCheck,
  IconTextureSingle,
  IconVisibilityDots,
  IconZoneCrownSwirl,
  IconZoneFrontalFollicles,
  IconZoneHairline,
  IconZoneMidScalp,
  IconZoneScalpSparkles,
  IconZoneTemples,
} from "./icons";

function closestOption(value: string, options: string[]): string {
  const v = value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  for (const o of options) {
    const o2 = o.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (v.includes(o2) || o2.split(/\s+/).some((w) => w.length > 2 && v.includes(w))) return o;
  }
  return options[Math.floor(options.length / 2)] ?? value;
}

function mapHairTypeEsToEn(va: string): string {
  const v = va.toLowerCase();
  if (/afro|coily|muy riz/i.test(v)) return "Coily";
  if (/rizado|rizo|curly/i.test(v)) return "Curly";
  if (/ondulad|wavy/i.test(v)) return "Wavy";
  if (/liso|straight/i.test(v)) return "Straight";
  return closestOption(va, ["Straight", "Wavy", "Curly", "Coily"]);
}

function mapDensityEsToEn(va: string): string {
  if (/baja|low/i.test(va)) return "Low";
  if (/alta|high/i.test(va)) return "High";
  return closestOption(va, ["Low", "Medium", "High"]);
}

function mapHairlineEsToEn(va: string): string {
  if (/estable|stable/i.test(va)) return "Stable";
  if (/leve|mild/i.test(va)) return "Mild recession";
  if (/moderad/i.test(va)) return "Moderate recession";
  if (/avanzad|advanced/i.test(va)) return "Advanced recession";
  return closestOption(va, ["Stable", "Mild recession", "Moderate recession", "Advanced recession"]);
}

function mapScalpEsToEn(va: string): string {
  if (/salud|healthy/i.test(va)) return "Healthy";
  if (/gras|oily/i.test(va)) return "Oily";
  if (/sec|dry/i.test(va)) return "Dry";
  if (/descam|flaky|flake/i.test(va)) return "Flaky";
  if (/sensibl|sensitive/i.test(va)) return "Sensitive";
  return closestOption(va, ["Healthy", "Oily", "Dry", "Flaky", "Sensitive"]);
}

function riskDotClass(level: string): string {
  if (level === "Alto") return HR.red;
  if (level === "Medio") return HR.orange;
  return HR.green;
}

const FRONT_ANCHORS: { x: number; y: number; lx: number; ly: number }[] = [
  { x: 18, y: 32, lx: 78, ly: 12 },
  { x: 50, y: 22, lx: 78, ly: 38 },
  { x: 78, y: 38, lx: 78, ly: 64 },
];

const CROWN_ANCHORS: { x: number; y: number; lx: number; ly: number }[] = [
  { x: 50, y: 28, lx: 78, ly: 14 },
  { x: 32, y: 48, lx: 78, ly: 44 },
  { x: 62, y: 52, lx: 78, ly: 72 },
];

function PhotoCalloutCard({
  pill,
  imageUrl,
  callouts,
  anchors,
  emptyLabel,
}: {
  pill: string;
  imageUrl?: string;
  callouts: { text: string }[];
  anchors: typeof FRONT_ANCHORS;
  emptyLabel: string;
}) {
  const list = callouts.slice(0, 3);
  while (list.length < 3) list.push({ text: "—" });
  return (
    <div className="rounded-lg border bg-white p-2 shadow-sm" style={{ borderColor: HR.border }}>
      <div
        className="mb-1.5 inline-block rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]"
        style={{ background: HR.cardWarm, color: HR.inkMuted }}
      >
        {pill}
      </div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-stone-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-[10px] text-stone-400">
            {emptyLabel}
          </div>
        )}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {anchors.map((a, i) => (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={a.lx}
              y2={a.ly}
              stroke={HR.gold}
              strokeWidth={0.5}
              strokeDasharray="1.8 1.4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {anchors.map((a, i) => (
          <div
            key={`dot-${i}`}
            className="pointer-events-none absolute rounded-full border-2 border-white/70"
            style={{
              left: `calc(${a.x}% - 4px)`,
              top: `calc(${a.y}% - 4px)`,
              width: 8,
              height: 8,
              background: HR.gold,
              boxShadow: "0 0 4px rgba(0,0,0,0.45)",
            }}
          />
        ))}
        {anchors.map((a, i) => (
          <div
            key={`l-${i}`}
            className="pointer-events-none absolute text-right text-[7px] font-semibold leading-tight"
            style={{
              right: "3%",
              top: `${7 + i * 29}%`,
              maxWidth: "44%",
              color: "#FFFFFF",
              textShadow: "0 1px 4px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.5)",
            }}
          >
            {list[i]?.text ?? "—"}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScalpDensityMapPanel({
  crownUrl,
  heatIntensity,
}: {
  crownUrl?: string;
  heatIntensity: number;
}) {
  const t = Math.min(1, Math.max(0, heatIntensity / 100));
  const overlayOpacity = 0.48 + t * 0.22;
  return (
    <div className="flex h-full flex-col gap-2">
      <div
        className="flex flex-1 flex-col rounded-lg border bg-white p-2 shadow-sm"
        style={{ borderColor: HR.border }}
      >
        <p className="text-center text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: HR.ink }}>
          Scalp density map
        </p>
        <p className="mb-1.5 text-center text-[7px] uppercase tracking-wide" style={{ color: HR.inkMuted }}>
          Top view overlay
        </p>
        <div className="relative flex-1 overflow-hidden rounded-md bg-stone-100" style={{ minHeight: 140 }}>
          {crownUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={crownUrl} alt="" className="h-full w-full object-cover" crossOrigin="anonymous" />
              {/* Radial heatmap — no blend mode for reliable html-to-image capture */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: overlayOpacity,
                  background: `radial-gradient(circle at 50% 42%,
                    rgba(196,92,92,0.92) 0%,
                    rgba(217,124,74,0.68) 16%,
                    rgba(212,168,75,0.52) 30%,
                    rgba(90,143,106,0.36) 50%,
                    rgba(90,143,106,0.14) 68%,
                    transparent 84%)`,
                }}
              />
              {/* Dashed circle annotations centered on crown zone */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50" cy="42" r="10"
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="0.8"
                  strokeDasharray="2.2 2"
                />
                <circle
                  cx="50" cy="42" r="22"
                  fill="none"
                  stroke="rgba(255,255,255,0.40)"
                  strokeWidth="0.6"
                  strokeDasharray="1.8 2.5"
                />
                <circle
                  cx="50" cy="42" r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="0.5"
                  strokeDasharray="1.2 3"
                />
              </svg>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[9px] text-stone-400">No crown photo</div>
          )}
        </div>
        <div className="mt-2">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${HR.green} 0%, ${HR.yellow} 35%, ${HR.orange} 65%, ${HR.red} 100%)`,
            }}
          />
          <div className="mt-0.5 flex justify-between text-[7px] font-medium" style={{ color: HR.inkMuted }}>
            <span>High density</span>
            <span>Low density</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-2 shadow-sm" style={{ borderColor: HR.border }}>
        <p className="mb-2 text-center text-[8px] font-bold uppercase tracking-[0.14em]" style={{ color: HR.ink }}>
          Density comparison
        </p>
        <div className="flex justify-around gap-2">
          <div className="flex flex-col items-center text-center">
            <IconFollicleDiscDense className="h-14 w-14" />
            <p className="mt-1 text-[8px] font-semibold" style={{ color: HR.ink }}>
              Frontal zone
            </p>
            <p className="text-[7px]" style={{ color: HR.inkMuted }}>
              Stronger density
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconFollicleDiscSparse className="h-14 w-14" />
            <p className="mt-1 text-[8px] font-semibold" style={{ color: HR.ink }}>
              Crown zone
            </p>
            <p className="text-[7px]" style={{ color: HR.inkMuted }}>
              Lower density
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PillBlock({
  num,
  title,
  options,
  active,
}: {
  num: number;
  title: string;
  options: string[];
  active: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border bg-white p-2 shadow-sm" style={{ borderColor: HR.border }}>
      <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wide" style={{ color: HR.gold }}>
        {num}. {title}
      </p>
      <div className="flex flex-col gap-1">
        {options.map((o) => {
          const on = o === active;
          return (
            <div
              key={o}
              className={cn("rounded-md border px-1.5 py-1 text-center text-[8px] font-medium leading-tight")}
              style={{
                borderColor: on ? HR.gold : HR.border,
                background: on ? "#F5EFE6" : HR.cardWarm,
                color: on ? HR.ink : HR.inkMuted,
              }}
            >
              {o}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskAreasBlock({ report }: { report: HairMapAnalysisReport }) {
  const areas = ["Temples", "Frontal zone", "Mid-scalp", "Crown"];

  function norm(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, "");
  }

  function levelForRow(labelEn: string): "Bajo" | "Medio" | "Alto" {
    const l = labelEn.toLowerCase();
    for (const r of report.riskAreas) {
      const a = norm(r.area);
      if (l.includes("temple") && (a.includes("entrada") || a.includes("temple"))) return r.level;
      if (l.includes("frontal") && a.includes("frontal")) return r.level;
      if (l.includes("mid") && (a.includes("media") || a.includes("mid"))) return r.level;
      if (l.includes("crown") && (a.includes("coronilla") || a.includes("crown"))) return r.level;
    }
    return "Bajo";
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border bg-white p-2 shadow-sm" style={{ borderColor: HR.border }}>
      <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wide" style={{ color: HR.gold }}>
        5. Risk areas
      </p>
      <div className="flex flex-col gap-1.5">
        {areas.map((a) => {
          const lv = levelForRow(a);
          const col = riskDotClass(lv);
          const filled = lv === "Alto" ? 3 : lv === "Medio" ? 2 : 1;
          return (
            <div key={a} className="flex items-center justify-between gap-1">
              <span className="text-[8px] font-medium" style={{ color: HR.ink }}>
                {a}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: i < filled ? col : HR.border }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface HairMapLuxeInfographicProps {
  report: HairMapAnalysisReport;
  frontalUrl?: string;
  crownUrl?: string;
  className?: string;
  forCapture?: boolean;
}

export function HairMapLuxeInfographic({ report, frontalUrl, crownUrl, className, forCapture }: HairMapLuxeInfographicProps) {
  const va = report.visualAnalysis;
  const z = report.zones;
  const heat = report.crownDensityMap?.heatmapIntensity ?? z.crown.score;

  const frontCallouts = (report.photoCallouts.frontPhoto.length
    ? report.photoCallouts.frontPhoto
    : [{ label: "Temples", area: "" }, { label: "Hairline", area: "" }, { label: "Frontal density", area: "" }]
  ).map((c) => ({ text: `${c.area ? `${c.area}: ` : ""}${c.label}`.trim() || c.label }));

  const crownCallouts = (report.photoCallouts.crownPhoto.length
    ? report.photoCallouts.crownPhoto
    : [{ label: "Vertex (crown)", area: "" }, { label: "Scalp visibility", area: "" }, { label: "Mid-scalp", area: "" }]
  ).map((c) => ({ text: `${c.area ? `${c.area}: ` : ""}${c.label}`.trim() || c.label }));

  const hairEn = mapHairTypeEsToEn(va.hairType);
  const densityEn = mapDensityEsToEn(va.density);
  const hairlineEn = mapHairlineEsToEn(va.hairline);
  const scalpEn = mapScalpEsToEn(va.scalpState ?? va.scalpVisibility);

  const summaryCards: { Icon: typeof IconHairTypeStrands; label: string; value: string }[] = [
    { Icon: IconHairTypeStrands, label: "Hair type", value: hairEn },
    { Icon: IconDensityBundle, label: "Density", value: densityEn },
    { Icon: IconHairlineHead, label: "Hairline", value: hairlineEn },
    { Icon: IconScalpSurface, label: "Scalp", value: scalpEn },
    { Icon: IconTextureSingle, label: "Texture", value: va.hairTexture },
    { Icon: IconCrownRing, label: "Crown coverage", value: va.crownCoverage },
    { Icon: IconVisibilityDots, label: "Scalp visibility", value: va.scalpVisibility },
    { Icon: IconShieldCheck, label: "Overall condition", value: va.overallCondition },
  ];

  const strip = report.scalpZoneStrip;
  const zoneRow = strip?.length
    ? strip.map((s) => ({
        title: s.zone,
        micro: s.micro,
        ok: s.icon === "check",
        Icon:
          s.zone.toLowerCase().includes("hairline") ? IconZoneHairline
          : s.zone.toLowerCase().includes("temple") ? IconZoneTemples
          : s.zone.toLowerCase().includes("frontal") ? IconZoneFrontalFollicles
          : s.zone.toLowerCase().includes("mid") ? IconZoneMidScalp
          : s.zone.toLowerCase().includes("crown") ? IconZoneCrownSwirl
          : IconZoneScalpSparkles,
      }))
    : [
        { title: "Hairline", micro: z.frontalLine.label, ok: z.frontalLine.score >= 55, Icon: IconZoneHairline },
        { title: "Temples", micro: z.temples.label, ok: z.temples.score >= 55, Icon: IconZoneTemples },
        { title: "Frontal density", micro: z.frontalDensity.label, ok: z.frontalDensity.score >= 55, Icon: IconZoneFrontalFollicles },
        { title: "Mid-scalp", micro: "Pattern review", ok: z.frontalDensity.score >= 50, Icon: IconZoneMidScalp },
        { title: "Crown", micro: z.crown.label, ok: z.crown.score >= 50, Icon: IconZoneCrownSwirl },
        { title: "Scalp health", micro: z.scalpHealth.label, ok: z.scalpHealth.score >= 55, Icon: IconZoneScalpSparkles },
      ];

  return (
    <div
      className={cn("mx-auto overflow-hidden rounded-sm shadow-lg", className)}
      style={{
        width: "min(100%, " + A4_WIDTH_PX + "px)",
        maxWidth: A4_WIDTH_PX,
        background: HR.cream,
        color: HR.ink,
      }}
    >
      <div className="px-5 pb-6 pt-5">
        {/* Header */}
        <div className="relative mb-3 grid grid-cols-[1fr_auto] items-start gap-2">
          <div>
            <div
              className="mb-2 inline-block rounded-md border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide"
              style={{ borderColor: HR.border, color: HR.inkMuted, background: HR.card }}
            >
              Likely visual assessment
            </div>
            <h1
              className="text-[1.35rem] font-semibold leading-tight tracking-tight md:text-[1.5rem]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {report.header?.title ?? "AI Hair & Scalp Analysis"}
            </h1>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: HR.inkMuted }}>
              {report.header?.subtitle ?? "Visual trichology assessment"}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex flex-col items-end leading-tight">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: HR.gold }}>
                Perfecto
              </span>
              <span className="text-[7px] uppercase tracking-wider" style={{ color: HR.inkMuted }}>
                Mapa capilar
              </span>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C5A059]/70" />
          <DiamondOrnament className="h-2.5 w-2.5 shrink-0" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C5A059]/70" />
        </div>

        {/* 3-column hero */}
        <div className={cn("mb-5 grid gap-2", forCapture ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3")}>
          <PhotoCalloutCard
            pill="Frontal view"
            imageUrl={frontalUrl}
            callouts={frontCallouts}
            anchors={FRONT_ANCHORS}
            emptyLabel="Frontal photo"
          />
          <PhotoCalloutCard
            pill="Crown view"
            imageUrl={crownUrl}
            callouts={crownCallouts}
            anchors={CROWN_ANCHORS}
            emptyLabel="Crown photo"
          />
          <div className="min-h-[200px] sm:min-h-0">
            <ScalpDensityMapPanel crownUrl={crownUrl} heatIntensity={heat} />
          </div>
        </div>

        {/* Assessment summary */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C5A059]/60" />
          <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: HR.gold }}>
            Assessment summary
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C5A059]/60" />
        </div>
        <div className={cn("mb-5 grid gap-1.5", forCapture ? "grid-cols-8" : "grid-cols-4 sm:grid-cols-8")}>
          {summaryCards.map(({ Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-lg border bg-white px-1 py-2 text-center shadow-sm"
              style={{ borderColor: HR.border }}
            >
              <Icon className="mb-1 h-6 w-6 shrink-0" stroke={HR.lineHair} />
              <p className="text-[6px] font-bold uppercase leading-tight tracking-wide" style={{ color: HR.inkMuted }}>
                {label}
              </p>
              <p className="mt-0.5 line-clamp-3 text-[7px] font-semibold leading-snug" style={{ color: HR.ink }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Classification row — 5 columnas como referencia */}
        <div className={cn("mb-5 grid gap-1.5", forCapture ? "grid-cols-5" : "grid-cols-2 min-[640px]:grid-cols-3 min-[760px]:grid-cols-5")}>
          <PillBlock num={1} title="Hair type" options={["Straight", "Wavy", "Curly", "Coily"]} active={hairEn} />
          <PillBlock num={2} title="Density" options={["Low", "Medium", "High"]} active={densityEn} />
          <PillBlock
            num={3}
            title="Hairline"
            options={["Stable", "Mild recession", "Moderate recession", "Advanced recession"]}
            active={hairlineEn}
          />
          <PillBlock
            num={4}
            title="Scalp"
            options={["Healthy", "Oily", "Dry", "Flaky", "Sensitive"]}
            active={scalpEn}
          />
          <RiskAreasBlock report={report} />
        </div>

        {/* Scalp-zone annotation */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C5A059]/60" />
          <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: HR.gold }}>
            Scalp-zone annotation
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C5A059]/60" />
        </div>
        <div className={cn("mb-5 grid gap-1.5", forCapture ? "grid-cols-6" : "grid-cols-3 sm:grid-cols-6")}>
          {zoneRow.map((row) => (
            <div
              key={row.title}
              className="flex flex-col items-center rounded-lg border bg-white px-1 py-2 text-center shadow-sm"
              style={{ borderColor: HR.border }}
            >
              <row.Icon className="mb-1 h-7 w-7" stroke={HR.lineHair} />
              <p className="text-[7px] font-bold uppercase leading-tight" style={{ color: HR.ink }}>
                {row.title}
              </p>
              <p className="mt-0.5 line-clamp-2 min-h-[2rem] text-[6.5px] leading-snug" style={{ color: HR.inkMuted }}>
                {row.micro}
              </p>
              <span
                className="mt-1 text-[10px] font-bold"
                style={{ color: row.ok ? HR.green : HR.orange }}
              >
                {row.ok ? "✓" : "!"}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-between gap-3 border-t pt-3 text-[7px]" style={{ borderColor: HR.border }}>
          <div className="flex max-w-[30%] flex-col items-center gap-0.5 text-center">
            <IconFooterCamera className="h-4 w-4" stroke={HR.gold} />
            <span style={{ color: HR.inkMuted }}>Evaluación visual asistida por imagen</span>
          </div>
          <div className="flex max-w-[34%] flex-col items-center gap-0.5 text-center">
            <IconFooterCalendar className="h-4 w-4" stroke={HR.gold} />
            <span style={{ color: HR.inkMuted }}>Los resultados pueden variar con el tiempo y hábitos</span>
          </div>
          <div className="flex max-w-[32%] flex-col items-center gap-0.5 text-center">
            <IconFooterPerson className="h-4 w-4" stroke={HR.gold} />
            <span style={{ color: HR.inkMuted }}>Consulta a un profesional para diagnóstico personalizado</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[7px] leading-relaxed" style={{ color: HR.inkMuted }}>
          {report.disclaimer}
        </p>
      </div>
    </div>
  );
}
