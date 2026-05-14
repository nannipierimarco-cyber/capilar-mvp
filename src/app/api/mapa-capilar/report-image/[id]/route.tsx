import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

// ── Design tokens ─────────────────────────────────────────────────────────────
const G = "#C4A55A";   // gold
const D = "#1E180A";   // dark ink
const C = "#F5F0E8";   // cream bg
const CD = "#EDE8DF";  // section header bg
const M = "#7A6F5F";   // muted
const GR = "#4A8A5A";  // green
const OR = "#D97C4A";  // orange
const RE = "#C45C5C";  // red

const W = 794;
const H = 1180;
const PH = 16; // horizontal padding

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

// ── Helpers ───────────────────────────────────────────────────────────────────
async function toBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return undefined;
  }
}

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  return res.arrayBuffer();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolvePhotoUrl(
  supabase: any,
  stored: string | null
): Promise<string | undefined> {
  if (!stored) return undefined;
  if (stored.startsWith("http")) return stored;
  const { data } = await supabase.storage
    .from("patient-photos")
    .createSignedUrl(stored, 300);
  return data?.signedUrl ?? undefined;
}

// ── SVG Icons (inline paths, no external deps) ────────────────────────────────

function IconHairWave() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <path d="M1 8 C4 3, 7 3, 10 8 S16 13, 19 8" stroke={D} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M3 12 C6 7, 9 7, 12 12 S18 17, 21 12" stroke={D} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  );
}

function IconFollicleDense() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      {[4,8,12,16,20].map((x) => (
        <line key={x} x1={x} y1="18" x2={x - 1} y2="4" stroke={D} strokeWidth="1.5" strokeLinecap="round"/>
      ))}
    </svg>
  );
}

function IconFollicleSparse() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      {[6,14].map((x) => (
        <line key={x} x1={x} y1="18" x2={x - 1} y2="4" stroke={D} strokeWidth="1.5" strokeLinecap="round"/>
      ))}
    </svg>
  );
}

function IconBottle() {
  return (
    <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
      <rect x="6" y="0" width="8" height="4" rx="1" fill={G} opacity="0.6"/>
      <path d="M4 7 C2 9, 1 12, 1 15 L1 22 C1 24, 2 25, 4 25 L16 25 C18 25, 19 24, 19 22 L19 15 C19 12, 18 9, 16 7 Z" fill={G} opacity="0.25" stroke={G} strokeWidth="0.8"/>
      <line x1="6" y1="14" x2="14" y2="14" stroke={G} strokeWidth="0.8"/>
      <line x1="6" y1="17" x2="14" y2="17" stroke={G} strokeWidth="0.8"/>
    </svg>
  );
}

function IconDropper() {
  return (
    <svg width="18" height="26" viewBox="0 0 18 26" fill="none">
      <rect x="6" y="0" width="6" height="3" rx="1" fill={G} opacity="0.6"/>
      <rect x="5" y="3" width="8" height="16" rx="2" fill={G} opacity="0.22" stroke={G} strokeWidth="0.8"/>
      <path d="M9 19 L9 25" stroke={G} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="9" cy="26" r="2" fill={G} opacity="0.5"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
      <path d="M11 1 L19 5 L19 12 C19 17 15 21 11 23 C7 21 3 17 3 12 L3 5 Z" fill={G} opacity="0.2" stroke={G} strokeWidth="0.9"/>
      <path d="M7 12 L10 15 L15 9" stroke={G} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconScissors() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="5" cy="5" r="3" stroke={G} strokeWidth="0.9" fill={G} opacity="0.15"/>
      <circle cx="5" cy="17" r="3" stroke={G} strokeWidth="0.9" fill={G} opacity="0.15"/>
      <line x1="8" y1="7" x2="19" y2="18" stroke={G} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="15" x2="19" y2="4" stroke={G} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

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
        <path d="M4 2V4.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="4" cy="6" r="0.8" fill="#fff"/>
      </svg>
    </div>
  );
}

// ── Section header (gold top-border + cream bg) ───────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      background: CD, borderTop: `1.5px solid ${G}`,
      paddingTop: 5, paddingBottom: 5,
    }}>
      <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, letterSpacing: 2, color: M, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

// ── Metric pill (used in assessment summary strip) ────────────────────────────
function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      flex: 1, paddingTop: 8, paddingBottom: 8, gap: 3,
      borderRight: `0.5px solid ${G}`,
    }}>
      <span style={{ fontFamily: "Inter", fontSize: 7, color: M, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 700, color: D, textAlign: "center", lineHeight: 1.2 }}>{value}</span>
    </div>
  );
}

// ── Option chip (used in the 5 detail sections) ───────────────────────────────
function OptionChip({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: 3, paddingBottom: 3, paddingLeft: 5, paddingRight: 5,
      borderRadius: 3,
      background: active ? G : "rgba(196,165,90,0.08)",
      border: `0.5px solid ${active ? G : "rgba(196,165,90,0.25)"}`,
      marginBottom: 2,
    }}>
      <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: active ? 700 : 400, color: active ? "#fff" : M }}>
        {label}
      </span>
    </div>
  );
}

// ── Callout overlay on photo ──────────────────────────────────────────────────
function PhotoCalloutSvg({ callouts }: { callouts: Array<{ label: string }> }) {
  const anchors = [
    { ax: 20, ay: 30, lx: 68, ly: 12 },
    { ax: 55, ay: 20, lx: 68, ly: 40 },
    { ax: 75, ay: 45, lx: 68, ly: 68 },
  ];
  const list = callouts.slice(0, 3);
  while (list.length < 3) list.push({ label: "" });

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
      {list.map((c, i) => {
        if (!c.label) return null;
        const a = anchors[i];
        return (
          <g key={i}>
            <line x1={a.ax} y1={a.ay} x2={a.lx} y2={a.ly} stroke={G} strokeWidth={0.6} strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke"/>
            <circle cx={a.ax} cy={a.ay} r={1.2} fill={G} vectorEffect="non-scaling-stroke"/>
          </g>
        );
      })}
    </svg>
  );
}

// ── Heatmap approximation (CSS radial gradient) ───────────────────────────────
function HeatmapDisk({ intensity }: { intensity: number }) {
  const pct = Math.max(0, Math.min(100, intensity));
  const mid = pct > 60 ? OR : pct > 30 ? "#D4A84B" : GR;
  const inner = pct > 70 ? RE : pct > 50 ? OR : GR;
  return (
    <div style={{
      width: 80, height: 80, borderRadius: 40,
      background: `radial-gradient(circle at 55% 45%, ${inner} 0%, ${mid} 40%, ${GR} 75%, ${C} 100%)`,
      border: `1px solid ${G}`,
      opacity: 0.85,
    }} />
  );
}

// ── Density disk (frontal / crown comparison) ─────────────────────────────────
function DensityCircle({ label, dense }: { label: string; dense: boolean }) {
  const lines = dense ? [4, 8, 12, 16, 20, 24] : [7, 15, 23];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 20,
        background: "#F0EBE0", border: `0.8px solid ${G}`,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        overflow: "hidden", paddingBottom: 2,
      }}>
        <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
          {lines.map((x) => (
            <line key={x} x1={x} y1="24" x2={x - 1} y2="4" stroke={D} strokeWidth={dense ? 1.4 : 1.2} strokeLinecap="round"/>
          ))}
        </svg>
      </div>
      <span style={{ fontFamily: "Inter", fontSize: 7, color: M, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
    </div>
  );
}

// ── Risk dot ──────────────────────────────────────────────────────────────────
function RiskDot({ level }: { level: string }) {
  const color = level === "Alto" ? RE : level === "Medio" ? OR : GR;
  return <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />;
}

// ── Routine column ────────────────────────────────────────────────────────────
function RoutineCol({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      borderRight: `0.5px solid ${G}`, paddingLeft: 8, paddingRight: 8,
      paddingTop: 10, paddingBottom: 8, gap: 5,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {icon}
        <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, color: D, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
            <span style={{ fontSize: 7, color: G, marginTop: 1 }}>•</span>
            <span style={{ fontFamily: "Inter", fontSize: 8, color: D, lineHeight: 1.3 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main infographic component ────────────────────────────────────────────────
function Infographic({
  report,
  frontalB64,
  crownB64,
}: {
  report: HairMapAnalysisReport;
  frontalB64?: string;
  crownB64?: string;
}) {
  const va = report.visualAnalysis;
  const zones = report.zones;
  const risks = report.riskAreas ?? [];
  const routine = report.recommendedRoutine;
  const ingredients = report.ingredientHints;
  const callouts = report.photoCallouts;
  const scalpZones = report.scalpZoneStrip ?? [];
  const densityComp = report.densityComparison;
  const crownMap = report.crownDensityMap;

  // Derive metric strip values
  const metrics = report.metricStrip ?? [
    { key: "hairType",        label: "Hair Type",        value: va.hairType },
    { key: "density",         label: "Density",          value: va.density },
    { key: "hairline",        label: "Hairline",         value: va.hairline },
    { key: "scalp",           label: "Scalp",            value: va.scalpState ?? "—" },
    { key: "texture",         label: "Texture",          value: va.hairTexture },
    { key: "crownCoverage",   label: "Crown Coverage",   value: va.crownCoverage },
    { key: "scalpVisibility", label: "Scalp Visibility", value: va.scalpVisibility },
    { key: "overall",         label: "Overall Condition",value: va.overallCondition },
  ];

  // Selected states for 5 sections
  const htOpts = ["Straight", "Wavy", "Curly", "Coily"];
  const denOpts = ["Low", "Medium", "High"];
  const hlOpts  = ["Stable", "Mild recession", "Moderate recession", "Advanced recession"];
  const scOpts  = ["Healthy", "Oily", "Dry", "Flaky", "Sensitive"];

  function activeHt(o: string)  { return va.hairType.toLowerCase().includes(o.toLowerCase()); }
  function activeDen(o: string) { return va.density.toLowerCase().includes(o.toLowerCase()); }
  function activeHl(o: string)  { return va.hairline.toLowerCase().includes(o.toLowerCase()); }
  function activeSc(o: string)  {
    const s = (va.scalpState ?? va.scalpVisibility).toLowerCase();
    return s.includes(o.toLowerCase());
  }

  const riskZoneNames = ["Temples", "Frontal zone", "Mid-scalp", "Crown", "Overall"];

  // Zone annotation fallback
  const defaultZones = [
    { zone: "Hairline", icon: "check" as const,   micro: zones.frontalLine.label },
    { zone: "Temples",  icon: "neutral" as const, micro: zones.temples.label },
    { zone: "Frontal",  icon: "check" as const,   micro: zones.frontalDensity.label },
    { zone: "Mid-scalp",icon: "check" as const,   micro: "Maintained" },
    { zone: "Crown",    icon: "warn" as const,    micro: zones.crown.label },
    { zone: "Scalp",    icon: "check" as const,   micro: zones.scalpHealth.label },
  ];
  const zoneItems = scalpZones.length >= 4 ? scalpZones : defaultZones;

  const routineDefaults = {
    cleanse: ["Gentle volumising shampoo", "Ketoconazole wash 1–2×/week"],
    treat:   ["Scalp serum", "Caffeine + peptides", "Consider growth support"],
    protect: ["Low heat", "UV & scalp care", "Avoid heavy buildup"],
    style:   ["Lightweight volumising products", "Avoid greasy finish", "Crown-friendly styling"],
  };
  const r = routine ?? routineDefaults;

  const ingDefaults = {
    helpful: ["Caffeine", "Peptides", "Niacinamide", "Ketoconazole", "Panthenol"],
    avoid:   ["Heavy oils", "Waxy products"],
  };
  const ing = ingredients ?? ingDefaults;

  const brandLine = report.brandLine ?? "PERFECTO";

  return (
    <div style={{ width: W, height: H, background: C, display: "flex", flexDirection: "column", fontFamily: "Inter" }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: PH, paddingRight: PH, paddingTop: 12, paddingBottom: 10,
        borderBottom: `1px solid ${G}`,
      }}>
        {/* Small label top-left */}
        <div style={{
          display: "flex", flexDirection: "column",
          border: `0.8px solid ${G}`, paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3,
          borderRadius: 3,
        }}>
          <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M, letterSpacing: 0.8 }}>Likely visual</span>
          <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M, letterSpacing: 0.8 }}>assessment</span>
        </div>

        {/* Title center */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "Playfair", fontSize: 28, fontWeight: 700, color: D, letterSpacing: -0.5, lineHeight: 1 }}>
            AI Hair &amp; Scalp Analysis
          </span>
          <span style={{ fontFamily: "Inter", fontSize: 9.5, color: M, fontStyle: "italic", letterSpacing: 0.5 }}>
            Visual trichology assessment
          </span>
        </div>

        {/* Brand box top-right */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          border: `1px solid ${G}`, padding: 6, borderRadius: 4, gap: 2,
          minWidth: 64,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,7 19,13 10,19 1,13 1,7" stroke={G} strokeWidth="1" fill="none"/>
            <polygon points="10,5 15,8 15,12 10,15 5,12 5,8" stroke={G} strokeWidth="0.6" fill="none"/>
          </svg>
          <span style={{ fontFamily: "Inter", fontSize: 6, fontWeight: 700, color: D, letterSpacing: 1.5, textTransform: "uppercase" }}>{brandLine}</span>
          <span style={{ fontFamily: "Inter", fontSize: 5, color: M, letterSpacing: 0.5, textTransform: "uppercase" }}>Trichology Clinic</span>
        </div>
      </div>

      {/* ── PHOTOS + HEATMAP ROW ── */}
      <div style={{ display: "flex", gap: 0, paddingLeft: PH, paddingRight: PH, paddingTop: 10, paddingBottom: 8, flex: "0 0 auto" }}>
        {/* Frontal photo */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginRight: 6 }}>
          <div style={{
            position: "relative", width: "100%", borderRadius: 5,
            overflow: "hidden", border: `0.8px solid ${G}`,
            aspectRatio: "3/4", background: "#D4CCC2",
          }}>
            {frontalB64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontalB64} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: M }}>No photo</span>
              </div>
            )}
            {/* Pill label */}
            <div style={{ position: "absolute", top: 5, left: 5 }}>
              <div style={{ background: "rgba(255,255,255,0.9)", paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }}>
                <span style={{ fontFamily: "Inter", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.2, color: D, textTransform: "uppercase" }}>Frontal View</span>
              </div>
            </div>
            {/* Callout lines */}
            <PhotoCalloutSvg callouts={callouts.frontPhoto ?? []} />
            {/* Callout labels */}
            {(callouts.frontPhoto ?? []).slice(0, 3).map((c, i) => {
              const positions = [{ top: "8%", right: "2%" }, { top: "36%", right: "2%" }, { top: "62%", right: "2%" }];
              const pos = positions[i] ?? positions[0];
              return (
                <div key={i} style={{ position: "absolute", ...pos, maxWidth: "38%" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.88)", paddingLeft: 3, paddingRight: 3, paddingTop: 1.5, paddingBottom: 1.5, borderRadius: 2,
                    border: `0.4px solid ${G}`,
                  }}>
                    <span style={{ fontFamily: "Inter", fontSize: 6, color: D, lineHeight: 1.2 }}>{c.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crown photo */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginRight: 6 }}>
          <div style={{
            position: "relative", width: "100%", borderRadius: 5,
            overflow: "hidden", border: `0.8px solid ${G}`,
            aspectRatio: "3/4", background: "#D4CCC2",
          }}>
            {crownB64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={crownB64} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: M }}>No photo</span>
              </div>
            )}
            <div style={{ position: "absolute", top: 5, left: 5 }}>
              <div style={{ background: "rgba(255,255,255,0.9)", paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }}>
                <span style={{ fontFamily: "Inter", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.2, color: D, textTransform: "uppercase" }}>Crown View</span>
              </div>
            </div>
            <PhotoCalloutSvg callouts={callouts.crownPhoto ?? []} />
            {(callouts.crownPhoto ?? []).slice(0, 3).map((c, i) => {
              const positions = [{ top: "8%", right: "2%" }, { top: "36%", right: "2%" }, { top: "62%", right: "2%" }];
              const pos = positions[i] ?? positions[0];
              return (
                <div key={i} style={{ position: "absolute", ...pos, maxWidth: "38%" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.88)", paddingLeft: 3, paddingRight: 3, paddingTop: 1.5, paddingBottom: 1.5, borderRadius: 2,
                    border: `0.4px solid ${G}`,
                  }}>
                    <span style={{ fontFamily: "Inter", fontSize: 6, color: D, lineHeight: 1.2 }}>{c.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scalp density map */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Heatmap */}
          <div style={{
            border: `0.8px solid ${G}`, borderRadius: 5, background: "#FAF7F2",
            display: "flex", flexDirection: "column", alignItems: "center", padding: 8, gap: 4,
          }}>
            <span style={{ fontFamily: "Inter", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.5, color: M, textTransform: "uppercase" }}>Scalp Density Map</span>
            <span style={{ fontFamily: "Inter", fontSize: 5.5, color: M, letterSpacing: 0.5 }}>Top view overlay</span>
            <HeatmapDisk intensity={crownMap?.heatmapIntensity ?? 55} />
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "Inter", fontSize: 6, color: GR }}>High Density</span>
              <div style={{ width: 50, height: 6, borderRadius: 3, background: `linear-gradient(to right, ${GR}, #D4A84B, ${OR}, ${RE})` }} />
              <span style={{ fontFamily: "Inter", fontSize: 6, color: RE }}>Low Density</span>
            </div>
            <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M, textAlign: "center", lineHeight: 1.3, paddingTop: 2 }}>{crownMap?.legend ?? "Crown: visible thinning"}</span>
          </div>

          {/* Density comparison */}
          <div style={{
            border: `0.8px solid ${G}`, borderRadius: 5, background: "#FAF7F2",
            padding: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontFamily: "Inter", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.5, color: M, textTransform: "uppercase" }}>Density Comparison</span>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <DensityCircle label={densityComp?.frontal.caption ?? "Frontal Zone\nStronger Density"} dense={true} />
              <DensityCircle label={densityComp?.crown.caption ?? "Crown Zone\nLower Density"} dense={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ASSESSMENT SUMMARY ── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
        <SectionHeader label="Assessment Summary" />
        <div style={{ display: "flex" }}>
          {metrics.map((m, i) => (
            <MetricPill key={i} label={m.label} value={m.value} />
          ))}
        </div>
      </div>

      {/* ── 5 ANALYSIS SECTIONS ── */}
      <div style={{ display: "flex", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
        {/* 1. Hair Type */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ background: CD, borderBottom: `0.5px solid ${G}`, padding: "4px 6px" }}>
            <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, color: D }}>1. Hair Type</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 6px", gap: 2, flex: 1 }}>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 4 }}>
              {htOpts.map((o) => <OptionChip key={o} label={o} active={activeHt(o)} />)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                <path d="M1 4 C3 1, 5 1, 7 4 S11 7, 13 4" stroke={G} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
              </svg>
              <span style={{ fontFamily: "Inter", fontSize: 7, color: M }}>Wavy pattern</span>
            </div>
          </div>
        </div>

        {/* 2. Density */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ background: CD, borderBottom: `0.5px solid ${G}`, padding: "4px 6px" }}>
            <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, color: D }}>2. Density</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 6px", gap: 2, flex: 1 }}>
            <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
              {denOpts.map((o) => <OptionChip key={o} label={o} active={activeDen(o)} />)}
            </div>
            <div style={{ background: "rgba(196,165,90,0.1)", borderRadius: 2, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }}>
              <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M }}>↓ Lower density at crown</span>
            </div>
          </div>
        </div>

        {/* 3. Hairline */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ background: CD, borderBottom: `0.5px solid ${G}`, padding: "4px 6px" }}>
            <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, color: D }}>3. Hairline</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 6px", gap: 2, flex: 1 }}>
            {hlOpts.map((o) => <OptionChip key={o} label={o} active={activeHl(o)} />)}
          </div>
        </div>

        {/* 4. Scalp */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${G}` }}>
          <div style={{ background: CD, borderBottom: `0.5px solid ${G}`, padding: "4px 6px" }}>
            <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, color: D }}>4. Scalp</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 6px", gap: 2, flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 3 }}>
              {scOpts.map((o) => <OptionChip key={o} label={o} active={activeSc(o)} />)}
            </div>
          </div>
        </div>

        {/* 5. Risk Areas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: CD, borderBottom: `0.5px solid ${G}`, padding: "4px 6px" }}>
            <span style={{ fontFamily: "Inter", fontSize: 7.5, fontWeight: 700, color: D }}>5. Risk Areas</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 6px", gap: 4, flex: 1 }}>
            {riskZoneNames.map((zone, i) => {
              const found = risks.find((r) => r.area.toLowerCase().includes(zone.split(" ")[0].toLowerCase()));
              const level = found?.level ?? (i < 2 ? "Alto" : i < 3 ? "Medio" : "Bajo");
              return (
                <div key={zone} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Inter", fontSize: 7, color: M }}>{zone}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <RiskDot level={level} />
                    <RiskDot level={level === "Alto" ? "Medio" : "Bajo"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SCALP-ZONE ANNOTATION ── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
        <SectionHeader label="Scalp-Zone Annotation" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          {zoneItems.slice(0, 6).map((z, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              paddingTop: 8, paddingBottom: 8, gap: 4,
              borderRight: i < 5 ? `0.5px solid ${G}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 14, background: `rgba(196,165,90,0.12)` }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1 C5 1, 2 3, 2 7 S4 13, 7 13 S12 11, 12 7 S9 1, 7 1" stroke={G} strokeWidth="0.9" fill="none"/>
                  <line x1="5" y1="5" x2="4" y2="1" stroke={D} strokeWidth="1" strokeLinecap="round"/>
                  <line x1="7" y1="5" x2="7" y2="1" stroke={D} strokeWidth="1" strokeLinecap="round"/>
                  <line x1="9" y1="5" x2="10" y2="1" stroke={D} strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "Inter", fontSize: 7, fontWeight: 700, color: D }}>{z.zone}</span>
              <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M, textAlign: "center", lineHeight: 1.2 }}>{z.micro}</span>
              {z.icon === "check" ? <CheckBadge /> : z.icon === "warn" ? <WarnBadge /> : <CheckBadge />}
            </div>
          ))}
        </div>
      </div>

      {/* ── RECOMMENDED ROUTINE ── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
        <SectionHeader label="Recommended Routine" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          <RoutineCol icon={<IconBottle />}   label="Cleanse" items={r.cleanse} />
          <RoutineCol icon={<IconDropper />}  label="Treat"   items={r.treat} />
          <RoutineCol icon={<IconShield />}   label="Protect" items={r.protect} />
          <RoutineCol icon={<IconScissors />} label="Style"   items={r.style} />
        </div>
      </div>

      {/* ── INGREDIENTS GUIDE ── */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: PH, marginRight: PH, border: `0.8px solid ${G}`, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <SectionHeader label="Ingredients Guide" />
        <div style={{ display: "flex", background: "#FAF7F2" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", borderRight: `0.5px solid ${G}` }}>
            <span style={{ fontFamily: "Inter", fontSize: 6.5, fontWeight: 700, color: GR, textTransform: "uppercase", letterSpacing: 1 }}>Helpful</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {ing.helpful.map((item, i) => (
                <div key={i} style={{ background: `rgba(74,138,90,0.12)`, border: `0.5px solid ${GR}`, borderRadius: 3, paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ fontFamily: "Inter", fontSize: 7.5, color: GR }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px" }}>
            <span style={{ fontFamily: "Inter", fontSize: 6.5, fontWeight: 700, color: RE, textTransform: "uppercase", letterSpacing: 1 }}>Avoid Overload</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {ing.avoid.map((item, i) => (
                <div key={i} style={{ background: "rgba(196,92,92,0.1)", border: `0.5px solid ${RE}`, borderRadius: 3, paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ fontFamily: "Inter", fontSize: 7.5, color: RE }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginLeft: PH, marginRight: PH, marginBottom: 8, gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke={M} strokeWidth="0.8"/>
            <path d="M5 3V5.5" stroke={M} strokeWidth="0.8" strokeLinecap="round"/>
            <circle cx="5" cy="7" r="0.5" fill={M}/>
          </svg>
          <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M }}>Image-based AI assessment</span>
        </div>
        <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M }}>Results may vary with time &amp; lifestyle</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1 L9 4 L9 9 L5 9 L1 9 L1 4 Z" stroke={M} strokeWidth="0.8" fill="none"/>
          </svg>
          <span style={{ fontFamily: "Inter", fontSize: 6.5, color: M }}>Consult a trichologist for personalized diagnosis</span>
        </div>
      </div>
    </div>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth
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

    // Fetch analysis
    const { data, error } = await supabase
      .from("hair_map_analyses")
      .select("photo_frontal_url, photo_crown_url, analysis_json, status")
      .eq("id", id)
      .single();

    if (error || !data?.analysis_json) {
      return new Response("Not found", { status: 404 });
    }

    const report = data.analysis_json as HairMapAnalysisReport;

    // Fetch photos + fonts in parallel
    const [frontalRaw, crownRaw, interRegular, interBold, playfairBold] = await Promise.all([
      resolvePhotoUrl(supabase, data.photo_frontal_url ?? null).then((url) => (url ? toBase64(url) : undefined)),
      resolvePhotoUrl(supabase, data.photo_crown_url ?? null).then((url) => (url ? toBase64(url) : undefined)),
      fetchFont("https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2"),
      fetchFont("https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7W0Q5nw.woff2"),
      fetchFont("https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXBYf9lbo.woff2"),
    ]);

    return new ImageResponse(
      <Infographic report={report} frontalB64={frontalRaw} crownB64={crownRaw} />,
      {
        width: W,
        height: H,
        fonts: [
          { name: "Inter",    data: interRegular, weight: 400, style: "normal" },
          { name: "Inter",    data: interBold,    weight: 700, style: "normal" },
          { name: "Playfair", data: playfairBold,  weight: 700, style: "normal" },
        ],
        headers: {
          "Content-Disposition": `attachment; filename="mapa-capilar-${id.slice(0, 8)}.png"`,
          "Cache-Control": "private, max-age=300",
        },
      }
    );
  } catch (err) {
    console.error("[report-image]", err);
    return new Response("Error generating image", { status: 500 });
  }
}
