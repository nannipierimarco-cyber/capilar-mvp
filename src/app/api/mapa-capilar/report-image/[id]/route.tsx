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

const W      = 794;
const H      = 1200;
const PH     = 14;
const PHOTO_H = 232;

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

// ── Photo helpers ─────────────────────────────────────────────────────────────
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolvePhotoUrl(supabase: any, stored: string | null): Promise<string | undefined> {
  if (!stored) return undefined;
  if (stored.startsWith("http")) return stored;
  const { data } = await supabase.storage.from("patient-photos").createSignedUrl(stored, 300);
  return data?.signedUrl ?? undefined;
}

// ── Badge icons ───────────────────────────────────────────────────────────────
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

// ── Assessment Summary metric icons ───────────────────────────────────────────
function MIHairType() {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
      <path d="M1 10 C3.5 6,6 6,8.5 9 C11 12,13.5 12,16 9 C18.5 6,21 6,23 8" stroke={G} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M1 13.5 C3.5 9.5,6 9.5,8.5 12.5 C11 15.5,13.5 15.5,16 12.5 C18.5 9.5,21 9.5,23 11.5" stroke={G} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
    </svg>
  );
}

function MIDensity() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
      <rect x="0.5" y="0.5" width="21" height="17" rx="1.5" stroke={G} strokeWidth="0.9" fill="rgba(196,165,90,0.07)"/>
      <line x1="4" y1="11" x2="4" y2="16" stroke={G} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="7.5" y1="8" x2="7.5" y2="16" stroke={G} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="11" y1="5" x2="11" y2="16" stroke={G} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="14.5" y1="9" x2="14.5" y2="16" stroke={G} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="18" y1="3" x2="18" y2="16" stroke={G} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function MIHairline() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 18 C2 11,5 2,10 2 C15 2,18 11,18 18" stroke={G} strokeWidth="1" fill="rgba(196,165,90,0.08)" strokeLinecap="round"/>
      <line x1="5.5" y1="6" x2="4.5" y2="2" stroke={D} strokeWidth="1" strokeLinecap="round"/>
      <line x1="8"   y1="4" x2="8"   y2="0.5" stroke={D} strokeWidth="1" strokeLinecap="round"/>
      <line x1="10"  y1="3.5" x2="10" y2="0" stroke={D} strokeWidth="1" strokeLinecap="round"/>
      <line x1="12"  y1="4" x2="12"  y2="0.5" stroke={D} strokeWidth="1" strokeLinecap="round"/>
      <line x1="14.5" y1="6" x2="15.5" y2="2" stroke={D} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function MIScalp() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={G} strokeWidth="1" fill="rgba(196,165,90,0.07)"/>
      <circle cx="10" cy="10" r="5"   stroke={G} strokeWidth="0.7" fill="none" strokeDasharray="2.5 2"/>
      <circle cx="10" cy="10" r="1.8" fill={G} opacity="0.55"/>
    </svg>
  );
}

function MITexture() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
      <path d="M0 4 C2.5 2,5 2,7.5 4 C10 6,12.5 6,15 4 C17.5 2,20 2,22 3.5" stroke={G} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M0 9 C2.5 7,5 7,7.5 9 C10 11,12.5 11,15 9 C17.5 7,20 7,22 8.5" stroke={G} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M0 14 C2.5 12,5 12,7.5 14 C10 16,12.5 16,15 14 C17.5 12,20 12,22 13.5" stroke={G} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function MICrown() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
      <path d="M1 15 L1 7 L6.5 12 L11 1 L15.5 12 L21 7 L21 15 Z" stroke={G} strokeWidth="1" fill="rgba(196,165,90,0.12)" strokeLinejoin="round"/>
      <line x1="1" y1="15" x2="21" y2="15" stroke={G} strokeWidth="1.1"/>
    </svg>
  );
}

function MIVisibility() {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
      <path d="M1 8 C4.5 1,19.5 1,23 8 C19.5 15,4.5 15,1 8 Z" stroke={G} strokeWidth="1" fill="rgba(196,165,90,0.08)"/>
      <circle cx="12" cy="8" r="3.5" stroke={G} strokeWidth="0.9" fill={G} opacity="0.22"/>
      <circle cx="12" cy="8" r="1.5" fill={G} opacity="0.65"/>
    </svg>
  );
}

function MICondition() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1L12.5 7H19L13.5 11L15.5 17.5L10 13.5L4.5 17.5L6.5 11L1 7H7.5Z" stroke={G} strokeWidth="0.9" fill="rgba(196,165,90,0.12)" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
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

// ── Metric pill (with icon) ───────────────────────────────────────────────────
function MetricPill({
  label, value, icon, last,
}: {
  label: string; value: string; icon: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      flex: 1, paddingTop: 7, paddingBottom: 7, paddingLeft: 4, paddingRight: 4, gap: 3,
      borderRight: last ? "none" : `0.5px solid ${G}`,
    }}>
      {icon}
      <span style={{ fontFamily: "sans-serif", fontSize: 6, color: M, textTransform: "uppercase", letterSpacing: 0.7, textAlign: "center" }}>{label}</span>
      <span style={{ fontFamily: "sans-serif", fontSize: 7.5, fontWeight: 700, color: D, textAlign: "center", lineHeight: 1.25 }}>{value}</span>
    </div>
  );
}

// ── Analysis chip ─────────────────────────────────────────────────────────────
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

// ── Risk dot ──────────────────────────────────────────────────────────────────
function RiskDot({ level }: { level: string }) {
  const color = level === "Alto" ? RE : level === "Medio" ? OR : GR;
  return <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />;
}

// ── Heat circle ───────────────────────────────────────────────────────────────
function HeatCircle({ intensity }: { intensity: number }) {
  const pct   = Math.max(0, Math.min(100, intensity));
  const inner = pct > 65 ? RE : pct > 45 ? OR : GR;
  const mid   = pct > 55 ? OR : "#D4A84B";
  return (
    <div style={{
      width: 68, height: 68, borderRadius: 34,
      background: `radial-gradient(circle at 55% 42%, ${inner} 0%, ${mid} 38%, ${GR} 72%, ${C} 100%)`,
      border: `1px solid ${G}`, opacity: 0.88,
    }} />
  );
}

// ── Density circle (hair strand illustration) ─────────────────────────────────
function DensityCircle({ label, dense }: { label: string; dense: boolean }) {
  const xs = dense ? [3, 7, 11, 15, 19, 23] : [7, 15];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: "#F0EBE0", border: `0.8px solid ${G}`, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", paddingBottom: 2 }}>
        <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
          {xs.map((x) => (
            <line key={x} x1={x} y1="24" x2={x - 1} y2="4" stroke={D} strokeWidth={dense ? 1.4 : 1.2} strokeLinecap="round"/>
          ))}
        </svg>
      </div>
      <span style={{ fontFamily: "sans-serif", fontSize: 6, color: M, textAlign: "center", lineHeight: 1.25, maxWidth: 54 }}>{label}</span>
    </div>
  );
}

// ── Zone head icon ────────────────────────────────────────────────────────────
function ZoneHeadIcon() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 14, background: "rgba(196,165,90,0.12)" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1 C5 1,2 3,2 7 S4 13,7 13 S12 11,12 7 S9 1,7 1" stroke={G} strokeWidth="0.9" fill="none"/>
        <line x1="4.5" y1="5" x2="4" y2="1.5" stroke={D} strokeWidth="0.9" strokeLinecap="round"/>
        <line x1="7"   y1="4" x2="7"   y2="1"   stroke={D} strokeWidth="0.9" strokeLinecap="round"/>
        <line x1="9.5" y1="5" x2="10"  y2="1.5" stroke={D} strokeWidth="0.9" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ── Routine column ────────────────────────────────────────────────────────────
function RoutineCol({ icon, label, items, last }: {
  icon: React.ReactNode; label: string; items: string[]; last?: boolean;
}) {
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

// ── Main infographic ──────────────────────────────────────────────────────────
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

  const metrics = [
    { label: "Hair Type",        value: va.hairType        ?? "—", icon: <MIHairType />   },
    { label: "Density",          value: va.density         ?? "—", icon: <MIDensity />    },
    { label: "Hairline",         value: va.hairline        ?? "—", icon: <MIHairline />   },
    { label: "Scalp",            value: va.scalpState      ?? "—", icon: <MIScalp />      },
    { label: "Texture",          value: va.hairTexture     ?? "—", icon: <MITexture />    },
    { label: "Crown Coverage",   value: va.crownCoverage   ?? "—", icon: <MICrown />      },
    { label: "Scalp Visibility", value: va.scalpVisibility ?? "—", icon: <MIVisibility /> },
    { label: "Overall Condition",value: va.overallCondition ?? "—", icon: <MICondition /> },
  ];

  function active(field: string | undefined | null, opt: string) {
    if (!field) return false;
    return field.toLowerCase().includes(opt.toLowerCase());
  }

  const htOpts  = ["Straight", "Wavy", "Curly", "Coily"];
  const denOpts = ["Low", "Medium", "High"];
  const hlOpts  = ["Stable", "Mild recession", "Moderate recession", "Advanced recession"];
  const scOpts  = ["Healthy", "Oily", "Dry", "Flaky", "Sensitive"];
  const riskZones = ["Temples", "Frontal zone", "Mid-scalp", "Crown", "Overall"];

  const defaultZones = [
    { zone: "Hairline",  icon: "check"   as const, micro: zones?.frontalLine?.label    ?? "Mostly preserved" },
    { zone: "Temples",   icon: "neutral" as const, micro: zones?.temples?.label        ?? "Mild recession"   },
    { zone: "Frontal density", icon: "check" as const, micro: zones?.frontalDensity?.label ?? "Fair to good" },
    { zone: "Mid-scalp", icon: "check"   as const, micro: "Maintained"                                       },
    { zone: "Crown",     icon: "warn"    as const, micro: zones?.crown?.label          ?? "Visible thinning" },
    { zone: "Scalp health", icon: "check" as const, micro: zones?.scalpHealth?.label  ?? "No obvious irritation" },
  ];
  const zoneItems = zoneStr.length >= 4 ? zoneStr : defaultZones;

  const defRoutine = {
    cleanse: ["Gentle volumising shampoo", "Ketoconazole wash 1–2×/week"],
    treat:   ["Scalp serum", "Caffeine + peptides", "Consider growth support"],
    protect: ["Low heat", "UV & scalp care", "Avoid heavy buildup"],
    style:   ["Lightweight volumising products", "Avoid greasy finish", "Crown-friendly styling"],
  };
  const r    = routine ?? defRoutine;
  const ing2 = ing ?? {
    helpful: ["Caffeine", "Peptides", "Niacinamide", "Ketoconazole", "Panthenol"],
    avoid:   ["Heavy oils", "Waxy products"],
  };

  // Callout anchor positions (pixel values — satori doesn't resolve % in absolute children)
  const calloutPositions = [
    { top: 20,  right: 4 },
    { top: 88,  right: 4 },
    { top: 152, right: 4 },
  ];

  // SVG line anchors (in viewBox 0 0 100 100)
  const fAnchors = [
    { ax: 22, ay: 26, lx: 72, ly: 11 },
    { ax: 55, ay: 22, lx: 72, ly: 42 },
    { ax: 74, ay: 46, lx: 72, ly: 70 },
  ];
  const cAnchors = [
    { ax: 50, ay: 22, lx: 72, ly: 11 },
    { ax: 32, ay: 52, lx: 72, ly: 42 },
    { ax: 66, ay: 58, lx: 72, ly: 70 },
  ];

  return (
    <div style={{ width: W, height: H, background: C, display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: PH, paddingRight: PH, paddingTop: 12, paddingBottom: 10, borderBottom: `1px solid ${G}` }}>

        {/* Left badge */}
        <div style={{ display: "flex", flexDirection: "column", border: `0.8px solid ${G}`, paddingLeft: 7, paddingRight: 7, paddingTop: 4, paddingBottom: 4, borderRadius: 3 }}>
          <span style={{ fontFamily: "sans-serif", fontSize: 7, color: M, letterSpacing: 0.6 }}>Likely visual</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 7, color: M, letterSpacing: 0.6 }}>assessment</span>
        </div>

        {/* Center title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontFamily: "serif", fontSize: 30, fontWeight: 700, color: D, lineHeight: 1 }}>AI Hair &amp; Scalp Analysis</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 9.5, color: M, fontStyle: "italic", letterSpacing: 0.5 }}>Visual trichology assessment</span>
        </div>

        {/* Right brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", border: `1px solid ${G}`, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, borderRadius: 4, gap: 3, minWidth: 68 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polygon points="11,1.5 20.5,7 20.5,15 11,20.5 1.5,15 1.5,7" stroke={G} strokeWidth="1.1" fill="none"/>
            <polygon points="11,6 16,9 16,13 11,16 6,13 6,9"             stroke={G} strokeWidth="0.7" fill="none"/>
          </svg>
          <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, color: D, letterSpacing: 1.5, textTransform: "uppercase" }}>{brand}</span>
          <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: M, letterSpacing: 0.5, textTransform: "uppercase" }}>Trichology Clinic</span>
        </div>
      </div>

      {/* ── PHOTOS + HEATMAP ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", paddingLeft: PH, paddingRight: PH, paddingTop: 8, paddingBottom: 6 }}>

        {/* Frontal photo */}
        <div style={{ flex: 1, marginRight: 5, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", position: "relative", width: "100%", height: PHOTO_H, borderRadius: 5, overflow: "hidden", border: `0.8px solid ${G}`, background: "#C8C0B8" }}>
            {frontalB64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontalB64} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            )}
            {/* Label */}
            <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 6, left: 6, background: "rgba(255,255,255,0.92)", paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: 1, color: D, textTransform: "uppercase" }}>Frontal View</span>
            </div>
            {/* Callout lines */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {fAnchors.filter((_, i) => !!callF[i]).map((a, i) => (
                <g key={i}>
                  <line x1={a.ax} y1={a.ay} x2={a.lx} y2={a.ly} stroke={G} strokeWidth={0.8} strokeDasharray="2.5 1.5"/>
                  <circle cx={a.ax} cy={a.ay} r={1.5} fill={G}/>
                </g>
              ))}
            </svg>
            {/* Callout labels */}
            {callF.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", position: "absolute", top: calloutPositions[i].top, right: calloutPositions[i].right, background: "rgba(255,255,255,0.9)", paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 2, border: `0.5px solid ${G}`, maxWidth: "40%" }}>
                <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: D, lineHeight: 1.3 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Crown photo */}
        <div style={{ flex: 1, marginRight: 5, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", position: "relative", width: "100%", height: PHOTO_H, borderRadius: 5, overflow: "hidden", border: `0.8px solid ${G}`, background: "#C8C0B8" }}>
            {crownB64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={crownB64} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            )}
            <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 6, left: 6, background: "rgba(255,255,255,0.92)", paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: 1, color: D, textTransform: "uppercase" }}>Crown View</span>
            </div>
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {cAnchors.filter((_, i) => !!callC[i]).map((a, i) => (
                <g key={i}>
                  <line x1={a.ax} y1={a.ay} x2={a.lx} y2={a.ly} stroke={G} strokeWidth={0.8} strokeDasharray="2.5 1.5"/>
                  <circle cx={a.ax} cy={a.ay} r={1.5} fill={G}/>
                </g>
              ))}
            </svg>
            {callC.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", position: "absolute", top: calloutPositions[i].top, right: calloutPositions[i].right, background: "rgba(255,255,255,0.9)", paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 2, border: `0.5px solid ${G}`, maxWidth: "40%" }}>
                <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: D, lineHeight: 1.3 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Density map */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, height: PHOTO_H }}>
          {/* Heatmap */}
          <div style={{ flex: 1, border: `0.8px solid ${G}`, borderRadius: 5, background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, gap: 4 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.5, color: M, textTransform: "uppercase" }}>Scalp Density Map</span>
            <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: M, letterSpacing: 0.5, textTransform: "uppercase" }}>Top View Overlay</span>
            <HeatCircle intensity={crown?.heatmapIntensity ?? 55} />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: GR }}>High Density</span>
              <div style={{ width: 36, height: 5, borderRadius: 3, background: `linear-gradient(to right, ${GR}, #D4A84B, ${OR}, ${RE})` }} />
              <span style={{ fontFamily: "sans-serif", fontSize: 5.5, color: RE }}>Low Density</span>
            </div>
          </div>
          {/* Density comparison */}
          <div style={{ border: `0.8px solid ${G}`, borderRadius: 5, background: "#FAF7F2", paddingTop: 7, paddingBottom: 7, paddingLeft: 8, paddingRight: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 6, fontWeight: 700, letterSpacing: 1, color: M, textTransform: "uppercase" }}>Density Comparison</span>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <DensityCircle label={denComp?.frontal?.caption ?? "Frontal Zone\nStronger Density"} dense={true}  />
              <DensityCircle label={denComp?.crown?.caption  ?? "Crown Zone\nLower Density"}    dense={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ASSESSMENT SUMMARY ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <SectionHeader label="Assessment Summary" />
        <div style={{ display: "flex" }}>
          {metrics.map((m, i) => (
            <MetricPill key={i} label={m.label} value={m.value} icon={m.icon} last={i === metrics.length - 1} />
          ))}
        </div>
      </div>

      {/* ── 5 ANALYSIS SECTIONS ──────────────────────────────────────────────── */}
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
        <div style={{ flex: 0.85, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
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

      {/* ── SCALP-ZONE ANNOTATION ────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <SectionHeader label="Scalp-Zone Annotation" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          {zoneItems.slice(0, 6).map((z, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 4, borderRight: i < 5 ? `0.5px solid ${G}` : "none" }}>
              <ZoneHeadIcon />
              <span style={{ fontFamily: "sans-serif", fontSize: 7, fontWeight: 700, color: D, textAlign: "center" }}>{z.zone}</span>
              <span style={{ fontFamily: "sans-serif", fontSize: 6, color: M, textAlign: "center", lineHeight: 1.25 }}>{z.micro}</span>
              {z.icon === "warn" ? <WarnBadge /> : <CheckBadge />}
            </div>
          ))}
        </div>
      </div>

      {/* ── RECOMMENDED ROUTINE ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
        <SectionHeader label="Recommended Routine" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          <RoutineCol label="Cleanse" items={r.cleanse} icon={
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <rect x="5" y="0" width="8" height="3" rx="1" fill={G} opacity="0.5"/>
              <path d="M3 6 C2 8,1 11,1 14 L1 20 C1 22,2 23,4 23 L14 23 C16 23,17 22,17 20 L17 14 C17 11,16 8,15 6 Z" fill={G} opacity="0.18" stroke={G} strokeWidth="0.7"/>
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
              <path d="M10 1 L18 5 L18 11 C18 16,14 20,10 22 C6 20,2 16,2 11 L2 5 Z" fill={G} opacity="0.18" stroke={G} strokeWidth="0.8"/>
              <path d="M7 11 L9.5 13.5 L13 8" stroke={G} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }/>
          <RoutineCol label="Style" items={r.style} last icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="4.5" cy="4.5"  r="2.5" stroke={G} strokeWidth="0.8" fill={G} opacity="0.15"/>
              <circle cx="4.5" cy="15.5" r="2.5" stroke={G} strokeWidth="0.8" fill={G} opacity="0.15"/>
              <line x1="7" y1="6.5"  x2="17" y2="16.5" stroke={G} strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="7" y1="13.5" x2="17" y2="3.5"  stroke={G} strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          }/>
        </div>
      </div>

      {/* ── INGREDIENTS GUIDE ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <SectionHeader label="Ingredients Guide" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          {/* Helpful */}
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
          {/* Avoid */}
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

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginLeft: PH, marginRight: PH, marginBottom: 10 }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M }}>Image-based AI assessment</span>
        <span style={{ fontFamily: "sans-serif", fontSize: 6.5, color: M }}>Results may vary with time &amp; lifestyle</span>
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

    const [frontalB64, crownB64] = await Promise.all([
      resolvePhotoUrl(supabase, data.photo_frontal_url ?? null).then((u) => u ? toBase64(u) : undefined),
      resolvePhotoUrl(supabase, data.photo_crown_url   ?? null).then((u) => u ? toBase64(u) : undefined),
    ]);
    console.log("[report-image] photos resolved, frontal:", !!frontalB64, "crown:", !!crownB64);

    console.log("[report-image] calling ImageResponse...");
    const imgResponse = new ImageResponse(
      <Infographic report={report} frontalB64={frontalB64} crownB64={crownB64} />,
      { width: W, height: H }
    );
    const buf = await imgResponse.arrayBuffer();
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
