import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

export const maxDuration = 30;

// ── Design tokens ─────────────────────────────────────────────────────────────
const G  = "#C4A55A";
const D  = "#1E180A";
const C  = "#F5F0E8";
const CD = "#EDE8DF";
const M  = "#7A6F5F";
const GR = "#4A8A5A";
const OR = "#D97C4A";
const RE = "#C45C5C";

const W  = 794;
const H  = 1180;
const PH = 16;

// Photo section fixed heights (satori doesn't support aspect-ratio)
const PHOTO_H = 230;

// ── Auth ──────────────────────────────────────────────────────────────────────
function verifyToken(id: string, token: string): boolean {
  const secret = process.env.ANALYSIS_ACCESS_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(id).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

// ── Photo → base64 ────────────────────────────────────────────────────────────
async function toBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return undefined;
  }
}


// ── Supabase photo URL resolver ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolvePhotoUrl(supabase: any, stored: string | null): Promise<string | undefined> {
  if (!stored) return undefined;
  if (stored.startsWith("http")) return stored;
  const { data } = await supabase.storage
    .from("patient-photos")
    .createSignedUrl(stored, 300);
  return data?.signedUrl ?? undefined;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function CheckBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 8, background: GR }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 4L3 5.5L6.5 2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function WarnBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 8, background: OR }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M4 2V4.5M4 6h.01" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      background: CD, borderTop: `1.5px solid ${G}`,
      paddingTop: 5, paddingBottom: 5,
    }}>
      <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: 2, color: M, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

function MetricPill({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      flex: 1, paddingTop: 7, paddingBottom: 7, paddingLeft: 3, paddingRight: 3, gap: 3,
      borderRight: last ? "none" : `0.5px solid ${G}`,
    }}>
      <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" }}>{label}</span>
      <span style={{ fontFamily: "sans-serif", fontSize: 8.5, fontWeight: 700, color: D, textAlign: "center", lineHeight: 1.2 }}>{value}</span>
    </div>
  );
}

function Chip({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: 3, paddingBottom: 3, paddingLeft: 5, paddingRight: 5,
      borderRadius: 3,
      background: active ? G : "rgba(196,165,90,0.08)",
      border: `0.5px solid ${active ? G : "rgba(196,165,90,0.3)"}`,
      marginBottom: 2,
    }}>
      <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: active ? 700 : 400, color: active ? "#fff" : M }}>
        {label}
      </span>
    </div>
  );
}

function RiskDot({ level }: { level: string }) {
  const color = level === "Alto" ? RE : level === "Medio" ? OR : GR;
  return <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />;
}

function HeatCircle({ intensity }: { intensity: number }) {
  const pct = Math.max(0, Math.min(100, intensity));
  const inner = pct > 65 ? RE : pct > 45 ? OR : GR;
  const mid   = pct > 55 ? OR : "#D4A84B";
  return (
    <div style={{
      width: 72, height: 72, borderRadius: 36,
      background: `radial-gradient(circle at 55% 42%, ${inner} 0%, ${mid} 38%, ${GR} 72%, ${C} 100%)`,
      border: `1px solid ${G}`, opacity: 0.88,
    }} />
  );
}

function DensityCircle({ label, dense }: { label: string; dense: boolean }) {
  const xs = dense ? [3,7,11,15,19,23] : [7,15];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ width: 38, height: 38, borderRadius: 19, background: "#F0EBE0", border: `0.8px solid ${G}`, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", paddingBottom: 2 }}>
        <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
          {xs.map((x) => <line key={x} x1={x} y1="22" x2={x - 1} y2="3" stroke={D} strokeWidth={dense ? 1.4 : 1.2} strokeLinecap="round"/>)}
        </svg>
      </div>
      <span style={{ fontFamily: "sans-serif", fontSize: 6, color: M, textAlign: "center", lineHeight: 1.2, maxWidth: 52 }}>{label}</span>
    </div>
  );
}

function RoutineCol({ icon, label, items, last }: { icon: React.ReactNode; label: string; items: string[]; last?: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      borderRight: last ? "none" : `0.5px solid ${G}`,
      paddingLeft: 8, paddingRight: 8, paddingTop: 10, paddingBottom: 8, gap: 5,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {icon}
        <span style={{ fontFamily: "sans-serif", fontSize: 7, fontWeight: 700, color: D, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
            <span style={{ fontSize: 7, color: G, lineHeight: 1.4 }}>•</span>
            <span style={{ fontFamily: "sans-serif", fontSize: 7.5, color: D, lineHeight: 1.3 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main infographic ───────────────────────────────────────────────────────────
function Infographic({ report, frontalB64, crownB64 }: {
  report: HairMapAnalysisReport;
  frontalB64?: string;
  crownB64?: string;
}) {
  const va      = report.visualAnalysis ?? {} as HairMapAnalysisReport["visualAnalysis"];
  const zones   = report.zones ?? {} as HairMapAnalysisReport["zones"];
  const risks   = report.riskAreas ?? [];
  const routine = report.recommendedRoutine;
  const ing     = report.ingredientHints;
  const callF   = (report.photoCallouts?.frontPhoto ?? []).slice(0, 3);
  const callC   = (report.photoCallouts?.crownPhoto  ?? []).slice(0, 3);
  const zoneStr = report.scalpZoneStrip ?? [];
  const denComp = report.densityComparison;
  const crown   = report.crownDensityMap;
  const brand   = report.brandLine ?? "PERFECTO";

  const metrics = report.metricStrip ?? [
    { key: "ht",  label: "Hair Type",         value: va.hairType },
    { key: "den", label: "Density",            value: va.density },
    { key: "hl",  label: "Hairline",           value: va.hairline },
    { key: "sc",  label: "Scalp",              value: va.scalpState ?? "—" },
    { key: "tx",  label: "Texture",            value: va.hairTexture },
    { key: "cc",  label: "Crown Coverage",     value: va.crownCoverage },
    { key: "sv",  label: "Scalp Visibility",   value: va.scalpVisibility },
    { key: "oc",  label: "Overall Condition",  value: va.overallCondition },
  ];

  function active(field: string | undefined | null, opt: string) {
    if (!field) return false;
    return field.toLowerCase().includes(opt.toLowerCase());
  }

  const htOpts  = ["Straight","Wavy","Curly","Coily"];
  const denOpts = ["Low","Medium","High"];
  const hlOpts  = ["Stable","Mild recession","Moderate recession","Advanced recession"];
  const scOpts  = ["Healthy","Oily","Dry","Flaky","Sensitive"];

  const riskZones = ["Temples","Frontal zone","Mid-scalp","Crown","Overall"];

  const defaultZones = [
    { zone:"Hairline",  icon:"check"   as const, micro: zones?.frontalLine?.label   ?? "Stable"     },
    { zone:"Temples",   icon:"neutral" as const, micro: zones?.temples?.label       ?? "Normal"     },
    { zone:"Frontal",   icon:"check"   as const, micro: zones?.frontalDensity?.label ?? "Good"      },
    { zone:"Mid-scalp", icon:"check"   as const, micro: "Maintained"                                },
    { zone:"Crown",     icon:"warn"    as const, micro: zones?.crown?.label         ?? "Thinning"   },
    { zone:"Scalp",     icon:"check"   as const, micro: zones?.scalpHealth?.label   ?? "Normal"     },
  ];
  const zoneItems = zoneStr.length >= 4 ? zoneStr : defaultZones;

  const defRoutine = {
    cleanse: ["Gentle volumising shampoo","Ketoconazole wash 1–2×/week"],
    treat:   ["Scalp serum","Caffeine + peptides","Consider growth support"],
    protect: ["Low heat","UV & scalp care","Avoid heavy buildup"],
    style:   ["Lightweight volumising products","Avoid greasy finish","Crown-friendly styling"],
  };
  const r   = routine ?? defRoutine;
  const ing2 = ing ?? { helpful:["Caffeine","Peptides","Niacinamide","Ketoconazole","Panthenol"], avoid:["Heavy oils","Waxy products"] };

  // Callout label positions — pixel values (satori doesn't resolve % in absolute children)
  const calloutPositions = [
    { top: 18,  right: 4 },
    { top: 87,  right: 4 },
    { top: 149, right: 4 },
  ];

  // SVG for callout lines (percentage-based viewBox)
  const fAnchors = [{ ax:20,ay:28,lx:72,ly:10 },{ ax:52,ay:20,lx:72,ly:40 },{ ax:75,ay:44,lx:72,ly:68 }];
  const cAnchors = [{ ax:50,ay:24,lx:72,ly:10 },{ ax:30,ay:50,lx:72,ly:40 },{ ax:64,ay:56,lx:72,ly:68 }];

  return (
    <div style={{ width: W, height: H, background: C, display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: PH, paddingRight: PH, paddingTop: 12, paddingBottom: 10, borderBottom: `1px solid ${G}` }}>
        <div style={{ display: "flex", flexDirection: "column", border: `0.8px solid ${G}`, paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3, borderRadius: 3 }}>
          <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M, letterSpacing: 0.8 }}>Likely visual</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M, letterSpacing: 0.8 }}>assessment</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "serif", fontSize: 26, fontWeight: 700, color: D, lineHeight: 1 }}>AI Hair & Scalp Analysis</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 9, color: M, fontStyle: "italic", letterSpacing: 0.5 }}>Visual trichology assessment</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", border: `1px solid ${G}`, padding: 6, borderRadius: 4, gap: 2, minWidth: 62 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polygon points="9,1 17,6 17,12 9,17 1,12 1,6" stroke={G} strokeWidth="1" fill="none"/>
            <polygon points="9,5 13,7.5 13,10.5 9,13 5,10.5 5,7.5" stroke={G} strokeWidth="0.6" fill="none"/>
          </svg>
          <span style={{ fontFamily: "sans-serif", fontSize: 6, fontWeight: 700, color: D, letterSpacing: 1.5, textTransform: "uppercase" }}>{brand}</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 5, color: M, letterSpacing: 0.5, textTransform: "uppercase" }}>Trichology Clinic</span>
        </div>
      </div>

      {/* PHOTOS + HEATMAP */}
      <div style={{ display: "flex", gap: 0, paddingLeft: PH, paddingRight: PH, paddingTop: 8, paddingBottom: 6 }}>

        {/* Frontal */}
        <div style={{ flex: 1, marginRight: 6, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", position: "relative", width: "100%", height: PHOTO_H, borderRadius: 5, overflow: "hidden", border: `0.8px solid ${G}`, background: "#C8C0B8" }}>
            {frontalB64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontalB64} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            )}
            <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 5, left: 5, background: "rgba(255,255,255,0.9)", paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, letterSpacing: 1, color: D, textTransform: "uppercase" }}>Frontal View</span>
            </div>
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {fAnchors.filter((_, i) => !!callF[i]).map((a, i) => (
                <g key={i}>
                  <line x1={a.ax} y1={a.ay} x2={a.lx} y2={a.ly} stroke={G} strokeWidth={0.7} strokeDasharray="2 1.5"/>
                  <circle cx={a.ax} cy={a.ay} r={1.4} fill={G}/>
                </g>
              ))}
            </svg>
            {callF.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", position: "absolute", top: calloutPositions[i].top, right: calloutPositions[i].right, background: "rgba(255,255,255,0.88)", paddingLeft: 3, paddingRight: 3, paddingTop: 2, paddingBottom: 2, borderRadius: 2, border: `0.4px solid ${G}`, maxWidth: "38%" }}>
                <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: D, lineHeight: 1.2 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Crown */}
        <div style={{ flex: 1, marginRight: 6, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", position: "relative", width: "100%", height: PHOTO_H, borderRadius: 5, overflow: "hidden", border: `0.8px solid ${G}`, background: "#C8C0B8" }}>
            {crownB64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={crownB64} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            )}
            <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 5, left: 5, background: "rgba(255,255,255,0.9)", paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, letterSpacing: 1, color: D, textTransform: "uppercase" }}>Crown View</span>
            </div>
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {cAnchors.filter((_, i) => !!callC[i]).map((a, i) => (
                <g key={i}>
                  <line x1={a.ax} y1={a.ay} x2={a.lx} y2={a.ly} stroke={G} strokeWidth={0.7} strokeDasharray="2 1.5"/>
                  <circle cx={a.ax} cy={a.ay} r={1.4} fill={G}/>
                </g>
              ))}
            </svg>
            {callC.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", position: "absolute", top: calloutPositions[i].top, right: calloutPositions[i].right, background: "rgba(255,255,255,0.88)", paddingLeft: 3, paddingRight: 3, paddingTop: 2, paddingBottom: 2, borderRadius: 2, border: `0.4px solid ${G}`, maxWidth: "38%" }}>
                <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: D, lineHeight: 1.2 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Density map */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, height: PHOTO_H }}>
          <div style={{ flex: 1, border: `0.8px solid ${G}`, borderRadius: 5, background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, gap: 4 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.5, color: M, textTransform: "uppercase" }}>Scalp Density Map</span>
            <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: M }}>Top view overlay</span>
            <HeatCircle intensity={crown?.heatmapIntensity ?? 55} />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: GR }}>High</span>
              <div style={{ width: 40, height: 5, borderRadius: 3, background: `linear-gradient(to right, ${GR}, #D4A84B, ${OR}, ${RE})` }} />
              <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: RE }}>Low</span>
            </div>
            <span style={{ fontFamily: "sans-serif", fontSize: 6, color: M, textAlign: "center", lineHeight: 1.3 }}>{crown?.legend ?? "Crown: visible thinning"}</span>
          </div>
          <div style={{ border: `0.8px solid ${G}`, borderRadius: 5, background: "#FAF7F2", padding: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 6, fontWeight: 700, letterSpacing: 1, color: M, textTransform: "uppercase" }}>Density Comparison</span>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <DensityCircle label={denComp?.frontal.caption ?? "Frontal Zone\nStronger"} dense={true} />
              <DensityCircle label={denComp?.crown.caption  ?? "Crown Zone\nLower"} dense={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ASSESSMENT SUMMARY */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <SectionHeader label="Assessment Summary" />
        <div style={{ display: "flex" }}>
          {metrics.map((m, i) => <MetricPill key={i} label={m.label} value={m.value} last={i === metrics.length - 1} />)}
        </div>
      </div>

      {/* 5 ANALYSIS SECTIONS */}
      <div style={{ display: "flex", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        {/* 1 Hair Type */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ display: "flex", alignItems: "center", background: CD, borderBottom: `0.5px solid ${G}`, paddingTop: 4, paddingBottom: 4, paddingLeft: 5, paddingRight: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, color: D }}>1. Hair Type</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5, gap: 2, flex: 1 }}>
            {htOpts.map((o) => <Chip key={o} label={o} active={active(va.hairType, o)} />)}
          </div>
        </div>
        {/* 2 Density */}
        <div style={{ flex: 0.8, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ display: "flex", alignItems: "center", background: CD, borderBottom: `0.5px solid ${G}`, paddingTop: 4, paddingBottom: 4, paddingLeft: 5, paddingRight: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, color: D }}>2. Density</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5, gap: 2, flex: 1 }}>
            {denOpts.map((o) => <Chip key={o} label={o} active={active(va.density, o)} />)}
          </div>
        </div>
        {/* 3 Hairline */}
        <div style={{ flex: 1.3, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ display: "flex", alignItems: "center", background: CD, borderBottom: `0.5px solid ${G}`, paddingTop: 4, paddingBottom: 4, paddingLeft: 5, paddingRight: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, color: D }}>3. Hairline</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5, gap: 2, flex: 1 }}>
            {hlOpts.map((o) => <Chip key={o} label={o} active={active(va.hairline, o)} />)}
          </div>
        </div>
        {/* 4 Scalp */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ display: "flex", alignItems: "center", background: CD, borderBottom: `0.5px solid ${G}`, paddingTop: 4, paddingBottom: 4, paddingLeft: 5, paddingRight: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, color: D }}>4. Scalp</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5, gap: 2, flex: 1 }}>
            {scOpts.map((o) => <Chip key={o} label={o} active={active(va.scalpState ?? va.scalpVisibility, o)} />)}
          </div>
        </div>
        {/* 5 Risk Areas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", background: CD, borderBottom: `0.5px solid ${G}`, paddingTop: 4, paddingBottom: 4, paddingLeft: 5, paddingRight: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, color: D }}>5. Risk Areas</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 5, paddingBottom: 5, paddingLeft: 6, paddingRight: 6, gap: 5, flex: 1, justifyContent: "center" }}>
            {riskZones.map((zone, i) => {
              const found  = risks.find((r) => r.area.toLowerCase().includes(zone.split(" ")[0].toLowerCase()));
              const level  = found?.level ?? (i < 2 ? "Alto" : i < 3 ? "Medio" : "Bajo");
              const level2 = level === "Alto" ? "Medio" : "Bajo";
              return (
                <div key={zone} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M }}>{zone}</span>
                  <div style={{ display: "flex", gap: 3 }}>
                    <RiskDot level={level} />
                    <RiskDot level={level2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SCALP-ZONE ANNOTATION */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <SectionHeader label="Scalp-Zone Annotation" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          {zoneItems.slice(0, 6).map((z, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 4, borderRight: i < 5 ? `0.5px solid ${G}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 13, background: "rgba(196,165,90,0.12)" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1 C5 1, 2 3, 2 6.5 S4 12, 6.5 12 S11 10, 11 6.5 S8 1, 6.5 1" stroke={G} strokeWidth="0.9" fill="none"/>
                  <line x1="4.5" y1="5" x2="4" y2="1.5" stroke={D} strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="6.5" y1="4.5" x2="6.5" y2="1" stroke={D} strokeWidth="0.9" strokeLinecap="round"/>
                  <line x1="8.5" y1="5" x2="9" y2="1.5" stroke={D} strokeWidth="0.9" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "sans-serif", fontSize: 7, fontWeight: 700, color: D }}>{z.zone}</span>
              <span style={{ fontFamily: "sans-serif", fontSize: 6, color: M, textAlign: "center", lineHeight: 1.2 }}>{z.micro}</span>
              {z.icon === "warn" ? <WarnBadge /> : <CheckBadge />}
            </div>
          ))}
        </div>
      </div>

      {/* RECOMMENDED ROUTINE */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <SectionHeader label="Recommended Routine" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          <RoutineCol label="Cleanse" items={r.cleanse} icon={
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <rect x="5" y="0" width="8" height="3" rx="1" fill={G} opacity="0.5"/>
              <path d="M3 6 C2 8, 1 11, 1 14 L1 20 C1 22 2 23 4 23 L14 23 C16 23 17 22 17 20 L17 14 C17 11 16 8 15 6 Z" fill={G} opacity="0.18" stroke={G} strokeWidth="0.7"/>
              <line x1="5" y1="13" x2="13" y2="13" stroke={G} strokeWidth="0.7"/>
              <line x1="5" y1="16" x2="13" y2="16" stroke={G} strokeWidth="0.7"/>
            </svg>
          }/>
          <RoutineCol label="Treat" items={r.treat} icon={
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <rect x="5" y="0" width="6" height="3" rx="1" fill={G} opacity="0.5"/>
              <rect x="4" y="3" width="8" height="15" rx="2" fill={G} opacity="0.18" stroke={G} strokeWidth="0.7"/>
              <path d="M8 18 L8 23" stroke={G} strokeWidth="1.1" strokeLinecap="round"/>
              <circle cx="8" cy="23" r="1.5" fill={G} opacity="0.45"/>
            </svg>
          }/>
          <RoutineCol label="Protect" items={r.protect} icon={
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <path d="M10 1 L18 5 L18 11 C18 16 14 20 10 22 C6 20 2 16 2 11 L2 5 Z" fill={G} opacity="0.18" stroke={G} strokeWidth="0.8"/>
              <path d="M7 11 L9.5 13.5 L13 8" stroke={G} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }/>
          <RoutineCol label="Style" items={r.style} last icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="4.5" cy="4.5" r="2.5" stroke={G} strokeWidth="0.8" fill={G} opacity="0.15"/>
              <circle cx="4.5" cy="15.5" r="2.5" stroke={G} strokeWidth="0.8" fill={G} opacity="0.15"/>
              <line x1="7" y1="6.5" x2="17" y2="16.5" stroke={G} strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="7" y1="13.5" x2="17" y2="3.5" stroke={G} strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          }/>
        </div>
      </div>

      {/* INGREDIENTS GUIDE */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <SectionHeader label="Ingredients Guide" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, borderRight: `0.5px solid ${G}` }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, color: GR, textTransform: "uppercase", letterSpacing: 1 }}>Helpful</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {ing2.helpful.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", background: "rgba(74,138,90,0.12)", border: `0.5px solid ${GR}`, borderRadius: 3, paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ fontFamily: "sans-serif", fontSize: 7.5, color: GR }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, color: RE, textTransform: "uppercase", letterSpacing: 1 }}>Avoid Overload</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {ing2.avoid.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", background: "rgba(196,92,92,0.1)", border: `0.5px solid ${RE}`, borderRadius: 3, paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ fontFamily: "sans-serif", fontSize: 7.5, color: RE }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginLeft: PH, marginRight: PH, marginBottom: 10 }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M }}>Image-based AI assessment</span>
        <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M }}>Results may vary with time & lifestyle</span>
        <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M }}>Consult a trichologist for personalized diagnosis</span>
      </div>
    </div>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!process.env.ANALYSIS_ACCESS_SECRET) {
    return new Response("Service not configured", { status: 503 });
  }
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!verifyToken(id, token)) {
    return new Response("Unauthorized", { status: 403 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new Response("DB not configured", { status: 503 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("hair_map_analyses")
      .select("photo_frontal_url, photo_crown_url, analysis_json")
      .eq("id", id)
      .single();

    if (error || !data?.analysis_json) {
      return new Response("Not found", { status: 404 });
    }

    const report = data.analysis_json as HairMapAnalysisReport;
    console.log("[report-image] DB OK, analysis_json keys:", Object.keys(report ?? {}));

    // Fetch photos in parallel (fonts use next/og built-in Noto)
    const [frontalB64, crownB64] = await Promise.all([
      resolvePhotoUrl(supabase, data.photo_frontal_url ?? null).then((u) => u ? toBase64(u) : undefined),
      resolvePhotoUrl(supabase, data.photo_crown_url  ?? null).then((u) => u ? toBase64(u) : undefined),
    ]);
    console.log("[report-image] photos resolved, frontal:", !!frontalB64, "crown:", !!crownB64);

    // Buffer the full ImageResponse stream inside the try/catch so satori
    // errors are caught here instead of escaping to Next.js's error boundary.
    console.log("[report-image] calling ImageResponse...");
    const imgResponse = new ImageResponse(
      <Infographic report={report} frontalB64={frontalB64} crownB64={crownB64} />,
      { width: W, height: H }
    );
    const buf = await imgResponse.arrayBuffer(); // satori renders here — throws if it crashes
    console.log("[report-image] image generated OK, bytes:", buf.byteLength);

    return new Response(buf, {
      headers: {
        "content-type": "image/png",
        "Content-Disposition": `attachment; filename="mapa-capilar-${id.slice(0, 8)}.png"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error("[report-image] CRASH:", msg);
    await new Promise((r) => setTimeout(r, 300));
    return new Response("Error generating image", { status: 500 });
  }
}
