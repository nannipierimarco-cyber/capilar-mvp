"use client";

import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";
import { cn } from "@/lib/utils";
import { A4_WIDTH_PX, HR } from "./tokens";
import {
  DiamondOrnament,
  BrandDiamond,
  HairTypeIcon,
  DensityIcon,
  HairlineIcon,
  ScalpIcon,
  TextureIcon,
  CrownCoverageIcon,
  ScalpVisibilityIcon,
  OverallConditionIcon,
  HairlineZoneIcon,
  TemplesIcon,
  FrontalDensityIcon,
  MidScalpIcon,
  CrownIcon,
  ScalpHealthIcon,
  FollicleDenseIcon,
  FollicleSparseIcon,
  CameraIcon,
  CalendarIcon,
  UserIcon,
} from "./icons/HairReportIcons";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function riskColor(level: string): string {
  if (level === "Alto") return HR.red;
  if (level === "Medio") return HR.orange;
  return HR.green;
}

// ── Photo callout anchors ─────────────────────────────────────────────────────

const FRONT_ANCHORS = [
  { x: 18, y: 30, lx: 76, ly: 11 },
  { x: 50, y: 22, lx: 76, ly: 38 },
  { x: 74, y: 40, lx: 76, ly: 65 },
];

const CROWN_ANCHORS = [
  { x: 50, y: 26, lx: 76, ly: 13 },
  { x: 30, y: 50, lx: 76, ly: 42 },
  { x: 62, y: 54, lx: 76, ly: 71 },
];

// ── Sub-components ────────────────────────────────────────────────────────────

type Anchor = { x: number; y: number; lx: number; ly: number };

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
  anchors: Anchor[];
  emptyLabel: string;
}) {
  const list = callouts.slice(0, 3);
  while (list.length < 3) list.push({ text: "—" });

  return (
    <div
      className="rounded-lg border overflow-hidden shadow-sm"
      style={{ borderColor: HR.border }}
    >
      {/* Photo fills the entire card — no space above */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-1.5"
            style={{ background: "#D4CCC2" }}
          >
            <svg viewBox="0 0 32 32" className="h-8 w-8 opacity-35" fill="none" stroke="#6B6560" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="9" width="28" height="18" rx="2.5" />
              <path d="M9 9 V7 A2 2 0 0 1 11 5 H21 A2 2 0 0 1 23 7 V9" />
              <circle cx="16" cy="18" r="4.5" />
            </svg>
            <span className="text-[7px] font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>{emptyLabel}</span>
          </div>
        )}

        {/* Pill label overlaid on photo — top-left */}
        <div className="pointer-events-none absolute left-2 top-2">
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.14em]"
            style={{
              background: "rgba(255,255,255,0.88)",
              color: HR.ink,
              boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            }}
          >
            {pill}
          </span>
        </div>

        {/* Dashed callout lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {anchors.map((a, i) => (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={a.lx} y2={a.ly}
              stroke={HR.gold}
              strokeWidth={0.5}
              strokeDasharray="1.8 1.4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Gold anchor dots */}
        {anchors.map((a, i) => (
          <div
            key={`dot-${i}`}
            className="pointer-events-none absolute rounded-full border border-white/80"
            style={{
              left: `calc(${a.x}% - 3px)`,
              top: `calc(${a.y}% - 3px)`,
              width: 6,
              height: 6,
              background: HR.gold,
              boxShadow: "0 0 4px rgba(0,0,0,0.6)",
            }}
          />
        ))}

        {/* Label text */}
        {anchors.map((a, i) => (
          <div
            key={`lbl-${i}`}
            className="pointer-events-none absolute text-right leading-tight"
            style={{
              right: "3%",
              top: `${7 + i * 29}%`,
              maxWidth: "48%",
              fontSize: 7,
              fontWeight: 600,
              color: "#FFFFFF",
              textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7)",
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
  const overlayOpacity = 0.46 + t * 0.24;

  return (
    <div className="flex h-full flex-col gap-1.5">
      {/* Map card */}
      <div
        className="flex flex-1 flex-col rounded-lg border bg-white shadow-sm overflow-hidden"
        style={{ borderColor: HR.border }}
      >
        <div className="px-2 pt-1.5 pb-1 text-center">
          <p
            className="text-[8px] font-bold uppercase tracking-[0.16em]"
            style={{ color: HR.ink }}
          >
            Scalp density map
          </p>
          <p
            className="text-[6.5px] uppercase tracking-[0.1em]"
            style={{ color: HR.inkMuted }}
          >
            Top view overlay
          </p>
        </div>

        <div
          className="relative flex-1 overflow-hidden bg-stone-100"
          style={{ aspectRatio: "5/6", minHeight: 0 }}
        >
          {/* Base: real photo or neutral warm fallback */}
          {crownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={crownUrl}
              alt=""
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "#D6C9B8" }} />
          )}

          {/* Radial heatmap — always visible regardless of photo */}
          <div
            className="absolute inset-0"
            style={{
              opacity: crownUrl ? overlayOpacity : 0.72,
              background: `radial-gradient(circle at 50% 44%,
                rgba(196,92,92,0.94) 0%,
                rgba(217,124,74,0.72) 14%,
                rgba(212,168,75,0.55) 28%,
                rgba(90,143,106,0.38) 48%,
                rgba(90,143,106,0.14) 66%,
                transparent 82%)`,
            }}
          />
          {/* Dashed concentric circles */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="44" r="9"  fill="none" stroke="rgba(255,255,255,0.7)"  strokeWidth="0.8" strokeDasharray="2.2 2"   strokeLinecap="round" />
            <circle cx="50" cy="44" r="20" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="0.6" strokeDasharray="1.8 2.5" strokeLinecap="round" />
            <circle cx="50" cy="44" r="34" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" strokeDasharray="1.2 3"   strokeLinecap="round" />
          </svg>
        </div>

        {/* Gradient legend */}
        <div className="px-2 pt-1.5 pb-2">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${HR.green} 0%, ${HR.yellow} 38%, ${HR.orange} 65%, ${HR.red} 100%)`,
            }}
          />
          <div
            className="mt-0.5 flex justify-between"
            style={{ fontSize: 6.5, color: HR.inkMuted, fontWeight: 500 }}
          >
            <span>High density</span>
            <span>Low density</span>
          </div>
        </div>
      </div>

      {/* Density comparison */}
      <div
        className="rounded-lg border bg-white px-2 py-2 shadow-sm"
        style={{ borderColor: HR.border }}
      >
        <p
          className="mb-1.5 text-center text-[7.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: HR.ink }}
        >
          Density comparison
        </p>
        <div className="flex justify-around">
          <div className="flex flex-col items-center text-center">
            <FollicleDenseIcon className="h-12 w-12" />
            <p className="mt-0.5 text-[7.5px] font-semibold leading-tight" style={{ color: HR.ink }}>
              Frontal zone
            </p>
            <p style={{ fontSize: 6.5, color: HR.inkMuted }}>Stronger density</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <FollicleSparseIcon className="h-12 w-12" />
            <p className="mt-0.5 text-[7.5px] font-semibold leading-tight" style={{ color: HR.ink }}>
              Crown zone
            </p>
            <p style={{ fontSize: 6.5, color: HR.inkMuted }}>Lower density</p>
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
    <div
      className="flex min-w-0 flex-1 flex-col rounded-lg border bg-white px-2 py-2 shadow-sm"
      style={{ borderColor: HR.border }}
    >
      <p
        className="mb-1.5 text-[7.5px] font-bold uppercase tracking-wide"
        style={{ color: HR.gold }}
      >
        {num}. {title}
      </p>
      <div className="flex flex-col gap-1">
        {options.map((o) => {
          const on = o === active;
          return (
            <div
              key={o}
              className="rounded border px-1.5 py-1 text-center leading-tight"
              style={{
                fontSize: 7.5,
                fontWeight: on ? 600 : 400,
                borderColor: on ? HR.gold : HR.border,
                background: on ? "#F9EDD6" : HR.cardWarm,
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
    <div
      className="flex min-w-0 flex-1 flex-col rounded-lg border bg-white px-2 py-2 shadow-sm"
      style={{ borderColor: HR.border }}
    >
      <p
        className="mb-1.5 text-[7.5px] font-bold uppercase tracking-wide"
        style={{ color: HR.gold }}
      >
        5. Risk areas
      </p>
      <div className="flex flex-col gap-1.5">
        {areas.map((a) => {
          const lv = levelForRow(a);
          const col = riskColor(lv);
          const filled = lv === "Alto" ? 3 : lv === "Medio" ? 2 : 1;
          return (
            <div key={a} className="flex items-center justify-between gap-1">
              <span style={{ fontSize: 7.5, fontWeight: 500, color: HR.ink }}>{a}</span>
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

// ── Main export ───────────────────────────────────────────────────────────────

export interface HairMapLuxeInfographicProps {
  report: HairMapAnalysisReport;
  frontalUrl?: string;
  crownUrl?: string;
  className?: string;
  forCapture?: boolean;
}

type HairIcon = (props: { className?: string; stroke?: string }) => React.ReactElement;

export function HairMapLuxeInfographic({
  report,
  frontalUrl,
  crownUrl,
  className,
  forCapture,
}: HairMapLuxeInfographicProps) {
  const va = report.visualAnalysis;
  const z = report.zones;
  const heat = report.crownDensityMap?.heatmapIntensity ?? z.crown.score;

  const frontCallouts = (
    report.photoCallouts.frontPhoto.length
      ? report.photoCallouts.frontPhoto
      : [
          { label: "Temples", area: "" },
          { label: "Hairline", area: "" },
          { label: "Frontal density", area: "" },
        ]
  ).map((c) => ({ text: `${c.area ? `${c.area}: ` : ""}${c.label}`.trim() || c.label }));

  const crownCallouts = (
    report.photoCallouts.crownPhoto.length
      ? report.photoCallouts.crownPhoto
      : [
          { label: "Vertex (crown)", area: "" },
          { label: "Scalp visibility", area: "" },
          { label: "Mid-scalp", area: "" },
        ]
  ).map((c) => ({ text: `${c.area ? `${c.area}: ` : ""}${c.label}`.trim() || c.label }));

  const hairEn = mapHairTypeEsToEn(va.hairType);
  const densityEn = mapDensityEsToEn(va.density);
  const hairlineEn = mapHairlineEsToEn(va.hairline);
  const scalpEn = mapScalpEsToEn(va.scalpState ?? va.scalpVisibility);

  const summaryCards: { Icon: HairIcon; label: string; value: string }[] = [
    { Icon: HairTypeIcon,          label: "Hair type",        value: hairEn },
    { Icon: DensityIcon,           label: "Density",          value: densityEn },
    { Icon: HairlineIcon,          label: "Hairline",         value: hairlineEn },
    { Icon: ScalpIcon,             label: "Scalp",            value: scalpEn },
    { Icon: TextureIcon,           label: "Texture",          value: va.hairTexture },
    { Icon: CrownCoverageIcon,     label: "Crown coverage",   value: va.crownCoverage },
    { Icon: ScalpVisibilityIcon,   label: "Scalp visibility", value: va.scalpVisibility },
    { Icon: OverallConditionIcon,  label: "Overall condition",value: va.overallCondition },
  ];

  const strip = report.scalpZoneStrip;
  const zoneRow = strip?.length
    ? strip.map((s) => ({
        title: s.zone,
        micro: s.micro,
        ok: s.icon === "check",
        Icon: (
          s.zone.toLowerCase().includes("hairline")  ? HairlineZoneIcon
          : s.zone.toLowerCase().includes("temple")  ? TemplesIcon
          : s.zone.toLowerCase().includes("frontal") ? FrontalDensityIcon
          : s.zone.toLowerCase().includes("mid")     ? MidScalpIcon
          : s.zone.toLowerCase().includes("crown")   ? CrownIcon
          : ScalpHealthIcon
        ) as HairIcon,
      }))
    : [
        { title: "Hairline",        micro: z.frontalLine.label,   ok: z.frontalLine.score >= 55,    Icon: HairlineZoneIcon  as HairIcon },
        { title: "Temples",         micro: z.temples.label,       ok: z.temples.score >= 55,        Icon: TemplesIcon       as HairIcon },
        { title: "Frontal density", micro: z.frontalDensity.label,ok: z.frontalDensity.score >= 55, Icon: FrontalDensityIcon as HairIcon },
        { title: "Mid-scalp",       micro: "Pattern review",      ok: z.frontalDensity.score >= 50, Icon: MidScalpIcon      as HairIcon },
        { title: "Crown",           micro: z.crown.label,         ok: z.crown.score >= 50,          Icon: CrownIcon         as HairIcon },
        { title: "Scalp health",    micro: z.scalpHealth.label,   ok: z.scalpHealth.score >= 55,    Icon: ScalpHealthIcon   as HairIcon },
      ];

  // Grid classes — forCapture forces full columns regardless of viewport breakpoints
  const photosGrid    = forCapture ? "grid-cols-3 gap-2"     : "grid-cols-1 gap-2 sm:grid-cols-3";
  const assessGrid    = forCapture ? "grid-cols-8 gap-1.5"   : "grid-cols-4 gap-1.5 sm:grid-cols-8";
  const classifyGrid  = forCapture ? "grid-cols-5 gap-1.5"   : "grid-cols-2 gap-1.5 min-[640px]:grid-cols-3 min-[760px]:grid-cols-5";
  const zoneGrid      = forCapture ? "grid-cols-6 gap-1.5"   : "grid-cols-3 gap-1.5 sm:grid-cols-6";

  return (
    <div
      className={cn("mx-auto overflow-hidden rounded-sm", className)}
      style={{
        width: `min(100%, ${A4_WIDTH_PX}px)`,
        maxWidth: A4_WIDTH_PX,
        background: HR.cream,
        color: HR.ink,
        boxShadow: "0 2px 24px rgba(44,40,37,0.10)",
      }}
    >
      <div className="px-5 pb-5 pt-4">

        {/* ── Header ── */}
        <div className="relative mb-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div
              className="inline-block self-start rounded border px-2 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ borderColor: HR.border, color: HR.inkMuted, background: HR.card }}
            >
              Likely visual assessment
            </div>
            <h1
              className="text-[1.45rem] font-semibold leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif', color: HR.ink }}
            >
              {report.header?.title ?? "AI Hair & Scalp Analysis"}
            </h1>
            <p
              className="text-[8.5px] font-medium uppercase tracking-[0.2em]"
              style={{ color: HR.inkMuted }}
            >
              {report.header?.subtitle ?? "Visual trichology assessment"}
            </p>
          </div>
          {/* Brand mark — top right */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <BrandDiamond className="h-8 w-7" />
            <p className="text-[7.5px] font-bold uppercase tracking-[0.18em] leading-tight text-center" style={{ color: HR.gold }}>
              Nilo
            </p>
            <p className="text-[6px] uppercase tracking-[0.14em] leading-tight text-center" style={{ color: HR.inkMuted }}>
              Trichology Clinic
            </p>
          </div>
        </div>

        {/* Gold divider */}
        <div className="mb-3.5 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${HR.gold}90)` }} />
          <DiamondOrnament className="h-2.5 w-2.5 shrink-0" />
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${HR.gold}90)` }} />
        </div>

        {/* ── 3-column photo grid ── */}
        <div className={cn("mb-4 grid", photosGrid)}>
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
          <div>
            <ScalpDensityMapPanel crownUrl={crownUrl} heatIntensity={heat} />
          </div>
        </div>

        {/* ── Section divider: Assessment Summary ── */}
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${HR.gold}70)` }} />
          <span
            className="shrink-0 text-[8px] font-bold uppercase tracking-[0.2em]"
            style={{ color: HR.gold }}
          >
            Assessment summary
          </span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${HR.gold}70)` }} />
        </div>

        {/* 8 summary cards */}
        <div className={cn("mb-4 grid", assessGrid)}>
          {summaryCards.map(({ Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-lg border bg-white px-1 py-2 text-center shadow-sm"
              style={{ borderColor: HR.border }}
            >
              <Icon className="mb-1 h-6 w-6 shrink-0" stroke={HR.lineHair} />
              <p
                className="leading-tight uppercase tracking-wide"
                style={{ fontSize: 6, fontWeight: 700, color: HR.inkMuted }}
              >
                {label}
              </p>
              <p
                className="mt-0.5 line-clamp-3 leading-snug"
                style={{ fontSize: 7, fontWeight: 600, color: HR.ink }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── 5 classification blocks ── */}
        <div className={cn("mb-4 grid", classifyGrid)}>
          <PillBlock num={1} title="Hair type" options={["Straight","Wavy","Curly","Coily"]} active={hairEn} />
          <PillBlock num={2} title="Density"   options={["Low","Medium","High"]} active={densityEn} />
          <PillBlock
            num={3} title="Hairline"
            options={["Stable","Mild recession","Moderate recession","Advanced recession"]}
            active={hairlineEn}
          />
          <PillBlock
            num={4} title="Scalp"
            options={["Healthy","Oily","Dry","Flaky","Sensitive"]}
            active={scalpEn}
          />
          <RiskAreasBlock report={report} />
        </div>

        {/* ── Section divider: Scalp-Zone Annotation ── */}
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${HR.gold}70)` }} />
          <span
            className="shrink-0 text-[8px] font-bold uppercase tracking-[0.18em]"
            style={{ color: HR.gold }}
          >
            Scalp-zone annotation
          </span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${HR.gold}70)` }} />
        </div>

        {/* 6 zone cards */}
        <div className={cn("mb-4 grid", zoneGrid)}>
          {zoneRow.map((row) => (
            <div
              key={row.title}
              className="flex flex-col items-center rounded-lg border bg-white px-1 py-2 text-center shadow-sm"
              style={{ borderColor: HR.border }}
            >
              <row.Icon className="mb-1 h-7 w-7 shrink-0" stroke={HR.lineHair} />
              <p
                className="font-bold uppercase leading-tight"
                style={{ fontSize: 7, color: HR.ink }}
              >
                {row.title}
              </p>
              <p
                className="mt-0.5 line-clamp-2"
                style={{ fontSize: 6.5, color: HR.inkMuted, minHeight: "1.8rem", lineHeight: 1.4 }}
              >
                {row.micro}
              </p>
              <span
                className="mt-1 font-bold leading-none"
                style={{ fontSize: 11, color: row.ok ? HR.green : HR.orange }}
              >
                {row.ok ? "✓" : "!"}
              </span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex flex-wrap justify-between gap-3 border-t pt-3"
          style={{ borderColor: HR.border }}
        >
          {[
            { Icon: CameraIcon,   text: "Image-based AI assessment" },
            { Icon: CalendarIcon, text: "Results may vary with time & lifestyle" },
            { Icon: UserIcon,     text: "Consult a trichologist for personalized diagnosis" },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex max-w-[32%] flex-col items-center gap-0.5 text-center">
              <Icon className="h-4 w-4 shrink-0" stroke={HR.gold} />
              <span style={{ fontSize: 7, color: HR.inkMuted, lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>

        <p
          className="mt-2.5 text-center leading-relaxed"
          style={{ fontSize: 6.5, color: HR.inkMuted }}
        >
          {report.disclaimer}
        </p>
      </div>
    </div>
  );
}
