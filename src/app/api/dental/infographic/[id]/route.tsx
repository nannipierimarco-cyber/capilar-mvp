import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { generateFallbackDentalReport } from "@/lib/dental/types";
import type { DentalMapReport, VisualLevel, DashboardLevel } from "@/lib/dental/types";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const G   = "#C4A55A";
const D   = "#1E180A";
const C   = "#F5F0E8";
const CD  = "#EDE8DF";
const M   = "#7A6F5F";
const SEP = "#DDD5C0";
const W   = 794;
const H   = 1200;

const VLABEL: Record<VisualLevel, string> = {
  favorable: "Favorable", mild_attention: "Leve", moderate_attention: "A revisar", review_suggested: "Eval. sug.",
};
const VCOLOR: Record<VisualLevel, string> = {
  favorable: "#4A8A5A", mild_attention: "#C4973A", moderate_attention: "#D97C4A", review_suggested: "#0EA5E9",
};
const VBG: Record<VisualLevel, string> = {
  favorable: "#EAF3EC", mild_attention: "#FBF3E6", moderate_attention: "#FBF0E6", review_suggested: "#E6F5FB",
};
const DLABEL: Record<DashboardLevel, string> = { low: "A revisar", medium: "Moderado", high: "Favorable" };
const DCOLOR: Record<DashboardLevel, string> = { low: "#D97C4A", medium: "#C4973A", high: "#4A8A5A" };
const DBG: Record<DashboardLevel, string>    = { low: "#FBF0E6", medium: "#FBF3E6", high: "#EAF3EC" };
const RLABEL: Record<string, string> = { low: "Riesgo bajo", medium: "Riesgo medio", high: "Prioridad alta" };
const RCOLOR: Record<string, string> = { low: "#4A8A5A", medium: "#C4973A", high: "#D97C4A" };
const RBG: Record<string, string>    = { low: "#EAF3EC", medium: "#FBF3E6", high: "#FBF0E6" };

const DASH_KEYS: { key: keyof DentalMapReport["visualDashboard"]; label: string }[] = [
  { key: "alignment", label: "Alineación" }, { key: "smileAesthetics", label: "Estética" },
  { key: "symmetry", label: "Simetría" }, { key: "apparentColor", label: "Color" },
  { key: "visibleBite", label: "Mordida" }, { key: "gums", label: "Encías" },
  { key: "generalVisualState", label: "General" },
];

function isNewSchema(obj: unknown): obj is DentalMapReport {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return typeof r.promptVersion === "string" && Array.isArray(r.visualFindings);
}

async function toBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch { return undefined; }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let analysis: DentalMapReport & { _photos?: { frontal?: string; abierta?: string } } =
    generateFallbackDentalReport();
  let frontalB64: string | undefined;
  let abiertaB64: string | undefined;

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
        analysis = data.analysis as typeof analysis;
      }
      // Load photos from storage
      const photos = (data?.analysis as Record<string, unknown>)?._photos as
        { frontal?: string; abierta?: string } | undefined;
      if (photos?.frontal) {
        const { data: su } = await supabase.storage
          .from("patient-photos")
          .createSignedUrl(photos.frontal, 300);
        if (su?.signedUrl) frontalB64 = await toBase64(su.signedUrl);
      }
      if (photos?.abierta) {
        const { data: su } = await supabase.storage
          .from("patient-photos")
          .createSignedUrl(photos.abierta, 300);
        if (su?.signedUrl) abiertaB64 = await toBase64(su.signedUrl);
      }
    } catch (err) {
      console.error("[dental/infographic]", err);
    }
  }

  const score    = analysis.summary.visualScore;
  const risk     = analysis.summary.visualRiskLevel;
  const riskC    = RCOLOR[risk] ?? "#C4973A";
  const riskBg   = RBG[risk]   ?? "#FBF3E6";
  const riskL    = RLABEL[risk] ?? "Riesgo medio";
  const findings = analysis.visualFindings.slice(0, 5);
  const zones    = analysis.zoneAnalysis.slice(0, 6);
  const hasPhotos = !!(frontalB64 || abiertaB64);

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, backgroundColor: C, fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, paddingBottom: 18, paddingLeft: 28, paddingRight: 28, borderBottomWidth: 1.5, borderBottomStyle: "solid", borderBottomColor: G }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: D }}>PERFECTO</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: G }}>DENTAL VISUAL REPORT</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: 8, color: M }}>Evaluación visual preliminar</span>
              <span style={{ fontSize: 8, color: M }}>No constituye diagnóstico médico</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 18, backgroundColor: D }}>
              <span style={{ fontSize: 18 }}>🦷</span>
            </div>
          </div>
        </div>

        {/* ── Score + headline ── */}
        <div style={{ display: "flex", paddingTop: 16, paddingBottom: 14, paddingLeft: 28, paddingRight: 28, gap: 18, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: 44, backgroundColor: CD, borderWidth: 5, borderStyle: "solid", borderColor: riskC, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: D, lineHeight: "1" }}>{score}</span>
              <span style={{ fontSize: 8, color: M }}>/100</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: D }}>{analysis.summary.headline}</span>
              <span style={{ fontSize: 9, fontWeight: 700, paddingTop: 3, paddingBottom: 3, paddingLeft: 10, paddingRight: 10, borderRadius: 20, backgroundColor: riskBg, color: riskC }}>{riskL}</span>
            </div>
            <span style={{ fontSize: 11, color: M }}>{analysis.summary.subheadline}</span>
            <div style={{ display: "flex", height: 7, backgroundColor: CD, borderRadius: 4, marginTop: 2 }}>
              <div style={{ width: `${score}%`, height: "100%", backgroundColor: riskC, borderRadius: 4 }} />
            </div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: SEP, marginLeft: 28, marginRight: 28 }} />

        {/* ── Photos (if available) or zone bars full width ── */}
        {hasPhotos ? (
          <div style={{ display: "flex", paddingTop: 14, paddingBottom: 14, paddingLeft: 28, paddingRight: 28, gap: 12 }}>
            {frontalB64 && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 5 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: G }}>VISTA FRONTAL</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frontalB64} style={{ width: "100%", height: 180, borderRadius: 8, objectFit: "cover", borderWidth: 1, borderStyle: "solid", borderColor: SEP }} alt="" />
              </div>
            )}
            {abiertaB64 && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 5 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: G }}>BOCA ABIERTA</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={abiertaB64} style={{ width: "100%", height: 180, borderRadius: 8, objectFit: "cover", borderWidth: 1, borderStyle: "solid", borderColor: SEP }} alt="" />
              </div>
            )}
          </div>
        ) : null}

        {hasPhotos ? <div style={{ height: 1, backgroundColor: SEP, marginLeft: 28, marginRight: 28 }} /> : null}

        {/* ── Two-column: findings + zones ── */}
        <div style={{ display: "flex", paddingTop: 14, paddingBottom: 0, paddingLeft: 28, paddingRight: 28, gap: 16, flex: 1 }}>

          {/* Left: Visual findings */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: G, marginBottom: 2 }}>SEÑALES VISUALES</span>
            {findings.map((f) => (
              <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 7, paddingBottom: 7, paddingLeft: 9, paddingRight: 9, backgroundColor: CD, borderRadius: 7, gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: D }}>{f.label}</span>
                  <span style={{ fontSize: 8, color: M }}>{f.description.length > 58 ? f.description.slice(0, 58) + "…" : f.description}</span>
                </div>
                <span style={{ fontSize: 7, fontWeight: 700, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, borderRadius: 8, backgroundColor: VBG[f.visualLevel], color: VCOLOR[f.visualLevel] }}>
                  {VLABEL[f.visualLevel]}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Zone analysis */}
          <div style={{ display: "flex", flexDirection: "column", width: 200, gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: G, marginBottom: 2 }}>ANÁLISIS POR ZONA</span>
            {zones.map((z) => {
              const bc = z.score >= 8 ? "#4A8A5A" : z.score >= 5 ? "#C4973A" : "#D97C4A";
              return (
                <div key={z.zone} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, color: D, fontWeight: 500 }}>{z.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: bc }}>{z.score}/10</span>
                  </div>
                  <div style={{ display: "flex", height: 5, backgroundColor: CD, borderRadius: 3 }}>
                    <div style={{ width: `${z.score * 10}%`, height: "100%", backgroundColor: bc, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: SEP, marginLeft: 28, marginRight: 28, marginTop: 12 }} />

        {/* ── Dashboard ── */}
        <div style={{ display: "flex", flexDirection: "column", paddingTop: 12, paddingBottom: 8, paddingLeft: 28, paddingRight: 28 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: G, marginBottom: 8 }}>DASHBOARD VISUAL</span>
          <div style={{ display: "flex", gap: 6 }}>
            {DASH_KEYS.map(({ key, label }) => {
              const level = analysis.visualDashboard[key];
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 7, paddingBottom: 7, paddingLeft: 6, paddingRight: 6, backgroundColor: CD, borderRadius: 7, flex: 1 }}>
                  <span style={{ fontSize: 7, color: M }}>{label}</span>
                  <span style={{ fontSize: 7, fontWeight: 700, paddingTop: 2, paddingBottom: 2, paddingLeft: 4, paddingRight: 4, borderRadius: 5, backgroundColor: DBG[level], color: DCOLOR[level] }}>{DLABEL[level]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8, marginLeft: 28, marginRight: 28, paddingTop: 14, paddingBottom: 14, paddingLeft: 18, paddingRight: 18, borderRadius: 12, backgroundColor: "#0C85BF", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{analysis.nextStep.title}</span>
          <span style={{ fontSize: 9, color: "#DDEEF8" }}>{analysis.nextStep.description}</span>
          <div style={{ display: "flex", marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#FFFFFF", color: "#0C85BF", paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 14, borderRadius: 18 }}>
              {analysis.nextStep.ctaLabel}
            </span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", flexDirection: "column", paddingTop: 10, paddingBottom: 16, paddingLeft: 28, paddingRight: 28, gap: 8, marginTop: "auto" }}>
          <span style={{ fontSize: 7, color: M, textAlign: "center" }}>{analysis.disclaimer}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: SEP }} />
            <span style={{ fontSize: 8, color: G, fontWeight: 600 }}>PERFECTO LABS</span>
            <div style={{ flex: 1, height: 1, backgroundColor: SEP }} />
          </div>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}
