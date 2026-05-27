import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { generateFallbackDentalReport } from "@/lib/dental/types";
import type { DentalMapReport, VisualLevel, DashboardLevel } from "@/lib/dental/types";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Design tokens — no 8-digit hex, no rgba() for Satori compat
const G   = "#C4A55A";
const C   = "#F5F0E8";
const CD  = "#EDE8DF";
const D   = "#1E180A";
const M   = "#7A6F5F";
const SEP = "#DDD5C0"; // gold-tinted separator (replaces G+"50")

const VISUAL_LEVEL_COLOR: Record<VisualLevel, string> = {
  favorable:          "#4A8A5A",
  mild_attention:     "#C4973A",
  moderate_attention: "#D97C4A",
  review_suggested:   "#0EA5E9",
};
const VISUAL_LEVEL_BG: Record<VisualLevel, string> = {
  favorable:          "#EAF3EC",
  mild_attention:     "#FBF3E6",
  moderate_attention: "#FBF0E6",
  review_suggested:   "#E6F5FB",
};
const VISUAL_LEVEL_LABEL: Record<VisualLevel, string> = {
  favorable:          "Favorable",
  mild_attention:     "Atención leve",
  moderate_attention: "A revisar",
  review_suggested:   "Eval. sugerida",
};
const DASH_COLOR: Record<DashboardLevel, string> = {
  low: "#D97C4A", medium: "#C4973A", high: "#4A8A5A",
};
const DASH_BG: Record<DashboardLevel, string> = {
  low: "#FBF0E6", medium: "#FBF3E6", high: "#EAF3EC",
};
const DASH_LABEL: Record<DashboardLevel, string> = {
  low: "A revisar", medium: "Moderado", high: "Favorable",
};
const RISK_COLOR: Record<string, string> = {
  low: "#4A8A5A", medium: "#C4973A", high: "#D97C4A",
};
const RISK_BG: Record<string, string> = {
  low: "#EAF3EC", medium: "#FBF3E6", high: "#FBF0E6",
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

  const score   = analysis.summary.visualScore;
  const risk    = analysis.summary.visualRiskLevel;
  const riskC   = RISK_COLOR[risk]  ?? "#C4973A";
  const riskBg  = RISK_BG[risk]     ?? "#FBF3E6";
  const riskL   = RISK_LABEL[risk]  ?? "Riesgo visual medio";
  const pct     = Math.round((score / 100) * 100);
  const findings = analysis.visualFindings.slice(0, 5);
  const zones    = analysis.zoneAnalysis.slice(0, 5);

  return new ImageResponse(
    (
      <div style={{ width: 794, height: 1200, backgroundColor: C, fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 22, paddingBottom: 22, paddingLeft: 32, paddingRight: 32, borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: G }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: D }}>PERFECTO</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: G }}>DENTAL VISUAL REPORT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 9, color: M }}>Evaluación visual preliminar</span>
            <span style={{ fontSize: 9, color: M }}>No constituye diagnóstico médico</span>
          </div>
        </div>

        {/* Score row */}
        <div style={{ display: "flex", paddingTop: 24, paddingBottom: 16, paddingLeft: 32, paddingRight: 32, gap: 20, alignItems: "center" }}>
          {/* Score circle — simple box, no SVG transform */}
          <div style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 48, backgroundColor: CD, borderWidth: 4, borderStyle: "solid", borderColor: riskC }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: D, lineHeight: "1" }}>{score}</span>
              <span style={{ fontSize: 9, color: M }}>/100</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: D }}>{analysis.summary.headline}</span>
              <span style={{ fontSize: 9, fontWeight: 700, paddingTop: 3, paddingBottom: 3, paddingLeft: 10, paddingRight: 10, borderRadius: 20, backgroundColor: riskBg, color: riskC }}>{riskL}</span>
            </div>
            <span style={{ fontSize: 12, color: M }}>{analysis.summary.subheadline}</span>
            {/* Score bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ height: 8, backgroundColor: CD, borderRadius: 4, display: "flex", width: "100%" }}>
                <div style={{ width: `${pct}%`, height: "100%", backgroundColor: riskC, borderRadius: 4 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: SEP, marginLeft: 32, marginRight: 32 }} />

        {/* Two-column body */}
        <div style={{ display: "flex", paddingTop: 18, paddingBottom: 0, paddingLeft: 32, paddingRight: 32, gap: 20 }}>

          {/* Left: Visual findings */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: G, marginBottom: 3 }}>SEÑALES VISUALES</span>
            {findings.map((f) => (
              <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, backgroundColor: CD, borderRadius: 8, gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: D }}>{f.label}</span>
                  <span style={{ fontSize: 9, color: M }}>{f.description.length > 60 ? f.description.slice(0, 60) + "…" : f.description}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, paddingTop: 2, paddingBottom: 2, paddingLeft: 7, paddingRight: 7, borderRadius: 10, backgroundColor: VISUAL_LEVEL_BG[f.visualLevel], color: VISUAL_LEVEL_COLOR[f.visualLevel] }}>
                  {VISUAL_LEVEL_LABEL[f.visualLevel]}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Zone analysis */}
          <div style={{ display: "flex", flexDirection: "column", width: 210, gap: 9 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: G, marginBottom: 3 }}>ANÁLISIS POR ZONA</span>
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

        <div style={{ height: 1, backgroundColor: SEP, marginLeft: 32, marginRight: 32, marginTop: 14 }} />

        {/* Dashboard */}
        <div style={{ display: "flex", flexDirection: "column", paddingTop: 14, paddingBottom: 10, paddingLeft: 32, paddingRight: 32 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: G }}>DASHBOARD VISUAL</span>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            {DASH_KEYS.map(({ key, label }) => {
              const level = analysis.visualDashboard[key];
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, backgroundColor: CD, borderRadius: 8, flex: 1 }}>
                  <span style={{ fontSize: 8, color: M }}>{label}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, paddingTop: 2, paddingBottom: 2, paddingLeft: 5, paddingRight: 5, borderRadius: 6, backgroundColor: DASH_BG[level], color: DASH_COLOR[level] }}>{DASH_LABEL[level]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next step */}
        <div style={{ marginTop: 10, marginBottom: 0, marginLeft: 32, marginRight: 32, paddingTop: 14, paddingBottom: 14, paddingLeft: 18, paddingRight: 18, borderRadius: 12, backgroundColor: "#0C85BF", display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{analysis.nextStep.title}</span>
          <span style={{ fontSize: 10, color: "#DDEEF8" }}>{analysis.nextStep.description}</span>
          <div style={{ display: "flex", marginTop: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#FFFFFF", color: "#0C85BF", paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 14, borderRadius: 20 }}>
              {analysis.nextStep.ctaLabel}
            </span>
          </div>
        </div>

        {/* Disclaimer + footer */}
        <div style={{ paddingTop: 10, paddingBottom: 18, paddingLeft: 32, paddingRight: 32, display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
          <span style={{ fontSize: 8, color: M, textAlign: "center" }}>{analysis.disclaimer}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: SEP }} />
            <span style={{ fontSize: 9, color: G, fontWeight: 600 }}>PERFECTO LABS</span>
            <div style={{ flex: 1, height: 1, backgroundColor: SEP }} />
          </div>
        </div>

      </div>
    ),
    { width: 794, height: 1200 }
  );
}
