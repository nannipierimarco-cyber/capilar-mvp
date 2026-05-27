import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { generateFallbackDentalReport } from "@/lib/dental/types";
import type { DentalMapReport, VisualLevel, DashboardLevel } from "@/lib/dental/types";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Design tokens
const G  = "#C4A55A"; // gold
const C  = "#F5F0E8"; // cream
const CD = "#EDE8DF"; // card bg
const D  = "#1E180A"; // dark
const M  = "#7A6F5F"; // muted

const VISUAL_LEVEL_COLOR: Record<VisualLevel, string> = {
  favorable:           "#4A8A5A",
  mild_attention:      "#C4973A",
  moderate_attention:  "#D97C4A",
  review_suggested:    "#0EA5E9",
};
const VISUAL_LEVEL_LABEL: Record<VisualLevel, string> = {
  favorable:           "Favorable",
  mild_attention:      "Atención leve",
  moderate_attention:  "A revisar",
  review_suggested:    "Evaluación sugerida",
};
const DASH_COLOR: Record<DashboardLevel, string> = {
  low: "#D97C4A", medium: "#C4973A", high: "#4A8A5A",
};
const DASH_LABEL: Record<DashboardLevel, string> = {
  low: "A revisar", medium: "Moderado", high: "Favorable",
};
const RISK_COLOR: Record<string, string> = {
  low: "#4A8A5A", medium: "#C4973A", high: "#D97C4A",
};
const RISK_LABEL: Record<string, string> = {
  low: "Riesgo visual bajo", medium: "Riesgo visual medio", high: "Prioridad visual alta",
};

const DASH_KEYS: { key: keyof DentalMapReport["visualDashboard"]; label: string }[] = [
  { key: "alignment",          label: "Alineación"   },
  { key: "smileAesthetics",    label: "Estética"     },
  { key: "symmetry",           label: "Simetría"     },
  { key: "apparentColor",      label: "Color"        },
  { key: "visibleBite",        label: "Mordida"      },
  { key: "gums",               label: "Encías"       },
  { key: "generalVisualState", label: "General"      },
];

function isNewSchema(obj: unknown): obj is DentalMapReport {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return typeof r.promptVersion === "string" && Array.isArray(r.visualFindings);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let analysis: DentalMapReport = generateFallbackDentalReport();

  if (id !== "demo") {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data } = await supabase
        .from("dental_patients")
        .select("analysis")
        .eq("id", id)
        .maybeSingle();
      if (data?.analysis && isNewSchema(data.analysis)) {
        analysis = data.analysis as DentalMapReport;
      }
    } catch (err) {
      console.error("[dental/infographic]", err);
    }
  }

  const score    = analysis.summary.visualScore;
  const risk     = analysis.summary.visualRiskLevel;
  const riskC    = RISK_COLOR[risk] ?? "#C4973A";
  const riskL    = RISK_LABEL[risk] ?? "Riesgo visual medio";
  const dashArr  = Math.round((score / 100) * 251);
  const findings = analysis.visualFindings.slice(0, 5);
  const zones    = analysis.zoneAnalysis.slice(0, 5);

  return new ImageResponse(
    (
      <div style={{ width: 794, height: 1200, backgroundColor: C, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 32px", borderBottom: `2px solid ${G}` }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: D, letterSpacing: "0.05em" }}>PERFECTO</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: G, letterSpacing: "0.2em" }}>DENTAL VISUAL REPORT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 9, color: M }}>Evaluación visual preliminar</span>
            <span style={{ fontSize: 9, color: M }}>No constituye diagnóstico médico</span>
          </div>
        </div>

        {/* Score row */}
        <div style={{ display: "flex", padding: "24px 32px 16px", gap: 20, alignItems: "center" }}>
          <div style={{ width: 96, height: 96, display: "flex", position: "relative" }}>
            <svg width={96} height={96} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke={CD} strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={riskC} strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${dashArr} 251`}
                transform="rotate(-90 50 50)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: D, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 9, color: M }}>/100</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: D }}>{analysis.summary.headline}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: riskC + "25", color: riskC }}>{riskL}</span>
            </div>
            <span style={{ fontSize: 12, color: M, lineHeight: 1.5 }}>{analysis.summary.subheadline}</span>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: G + "50", margin: "0 32px" }} />

        {/* Two-column body */}
        <div style={{ display: "flex", padding: "18px 32px", gap: 20 }}>

          {/* Left: Visual findings */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: "0.18em", marginBottom: 3 }}>SEÑALES VISUALES</span>
            {findings.map((f) => (
              <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 10px", backgroundColor: CD, borderRadius: 8, gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: D }}>{f.label}</span>
                  <span style={{ fontSize: 9, color: M, lineHeight: 1.3 }}>{f.description.length > 65 ? f.description.slice(0, 65) + "…" : f.description}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 10, backgroundColor: VISUAL_LEVEL_COLOR[f.visualLevel] + "22", color: VISUAL_LEVEL_COLOR[f.visualLevel], whiteSpace: "nowrap", flexShrink: 0 }}>
                  {VISUAL_LEVEL_LABEL[f.visualLevel]}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Zone analysis */}
          <div style={{ display: "flex", flexDirection: "column", width: 210, gap: 9 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: "0.18em", marginBottom: 3 }}>ANÁLISIS POR ZONA</span>
            {zones.map((z) => {
              const bc = z.score >= 8 ? "#4A8A5A" : z.score >= 5 ? "#C4973A" : "#D97C4A";
              return (
                <div key={z.zone} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: D, fontWeight: 500 }}>{z.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: bc }}>{z.score}/10</span>
                  </div>
                  <div style={{ height: 5, backgroundColor: CD, borderRadius: 3, display: "flex" }}>
                    <div style={{ width: `${z.score * 10}%`, height: "100%", backgroundColor: bc, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: G + "50", margin: "0 32px" }} />

        {/* Dashboard */}
        <div style={{ padding: "14px 32px 10px" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: "0.18em" }}>DASHBOARD VISUAL</span>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            {DASH_KEYS.map(({ key, label }) => {
              const level = analysis.visualDashboard[key];
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 8px", backgroundColor: CD, borderRadius: 8, flex: 1 }}>
                  <span style={{ fontSize: 8, color: M, textAlign: "center" }}>{label}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: DASH_COLOR[level] }}>{DASH_LABEL[level]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next step */}
        <div style={{ margin: "10px 32px", padding: "14px 18px", borderRadius: 12, background: "linear-gradient(135deg, #0EA5E9 0%, #0F6E56 100%)", display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{analysis.nextStep.title}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{analysis.nextStep.description}</span>
          <div style={{ display: "flex", marginTop: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#fff", color: "#0EA5E9", padding: "5px 14px", borderRadius: 20 }}>
              {analysis.nextStep.ctaLabel}
            </span>
          </div>
        </div>

        {/* Disclaimer + footer */}
        <div style={{ padding: "6px 32px 18px", display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
          <span style={{ fontSize: 8, color: M, lineHeight: 1.4, textAlign: "center" }}>{analysis.disclaimer}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: G + "50" }} />
            <span style={{ fontSize: 9, color: G, letterSpacing: "0.18em", fontWeight: 600 }}>PERFECTO LABS</span>
            <div style={{ flex: 1, height: 1, backgroundColor: G + "50" }} />
          </div>
        </div>

      </div>
    ),
    { width: 794, height: 1200 }
  );
}
