"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DentalMapReport, VisualLevel, VisualRiskLevel, DashboardLevel } from "@/lib/dental/types";
import { calculateDentalScore, generateFallbackDentalReport } from "@/lib/dental/types";

const VISUAL_LEVEL_COLOR: Record<VisualLevel, string> = {
  favorable: "#0F6E56",
  mild_attention: "#BA7517",
  moderate_attention: "#D85A30",
  review_suggested: "#0EA5E9",
};

const VISUAL_LEVEL_LABEL: Record<VisualLevel, string> = {
  favorable: "Favorable",
  mild_attention: "Leve atención",
  moderate_attention: "A revisar",
  review_suggested: "Evaluación sugerida",
};

const RISK_COLOR: Record<VisualRiskLevel, string> = {
  low: "#0F6E56",
  medium: "#BA7517",
  high: "#D85A30",
};

const RISK_LABEL: Record<VisualRiskLevel, string> = {
  low: "Riesgo visual bajo",
  medium: "Riesgo visual medio",
  high: "Prioridad visual alta",
};

const DASHBOARD_LABEL: Record<DashboardLevel, string> = {
  low: "A revisar",
  medium: "Moderado",
  high: "Favorable",
};

const DASHBOARD_COLOR: Record<DashboardLevel, string> = {
  low: "#D85A30",
  medium: "#BA7517",
  high: "#0F6E56",
};

const DASHBOARD_KEYS: { key: keyof DentalMapReport["visualDashboard"]; label: string }[] = [
  { key: "alignment", label: "Alineación aparente" },
  { key: "smileAesthetics", label: "Estética de sonrisa" },
  { key: "symmetry", label: "Simetría" },
  { key: "apparentColor", label: "Color aparente" },
  { key: "visibleBite", label: "Mordida visible" },
  { key: "gums", label: "Encías" },
  { key: "generalVisualState", label: "Estado visual general" },
];

export default function DentalReportePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<DentalMapReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [infographicExpanded, setInfographicExpanded] = useState(false);
  const showInfographic = params.id !== "demo";

  useEffect(() => {
    const raw = sessionStorage.getItem("dental_report");
    if (raw) { try { setReport(JSON.parse(raw)); } catch { setReport(generateFallbackDentalReport()); } }
    else if (params.id === "demo") { setReport(generateFallbackDentalReport()); }
    setLoading(false);
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-pulse">🦷</div></div>;
  if (!report) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Reporte no encontrado</p>
        <button onClick={() => router.push("/dental/quiz")} className="px-6 py-3 bg-sky-500 text-white rounded-xl font-medium">Iniciar análisis</button>
      </div>
    </div>
  );

  const answers = (() => { try { return JSON.parse(sessionStorage.getItem("dental_answers") ?? "{}"); } catch { return {}; } })();
  const scoreResult = calculateDentalScore(answers);
  const score = report.summary.visualScore;
  const riskColor = RISK_COLOR[report.summary.visualRiskLevel] ?? "#BA7517";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium tracking-widest text-sky-500">PERFECTO DENTAL</span>
          <p className="text-sm text-gray-500">Evaluación visual preliminar</p>
        </div>
        <button onClick={() => router.push(`/agendar-consulta?vertical=dental&source=dental_report&reportId=${params.id}`)}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
          Agendar consulta
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Infografía premium */}
        {showInfographic && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setInfographicExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">Infografía visual dental</p>
                <p className="text-xs text-gray-400 mt-0.5">Resumen visual generado por IA</p>
              </div>
              <span className="text-sky-500 text-xs font-semibold">
                {infographicExpanded ? "Ocultar ↑" : "Ver infografía ↓"}
              </span>
            </button>
            {infographicExpanded && (
              <div className="px-4 pb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/dental/infographic/${params.id}`}
                  alt="Infografía dental visual"
                  className="w-full rounded-xl shadow-sm"
                  style={{ maxWidth: 794 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Score visual */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Evaluación visual</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: riskColor + "18", color: riskColor }}>
              {RISK_LABEL[report.summary.visualRiskLevel]}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F1EFE8" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={score >= 70 ? "#0F6E56" : score >= 45 ? "#BA7517" : "#D85A30"}
                  strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 251} 251`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{score}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-gray-900 mb-1">{report.summary.headline}</p>
              <p className="text-sm text-gray-500">{report.summary.subheadline}</p>
            </div>
          </div>
        </div>

        {/* Señales visuales */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Señales visuales</h2>
          <div className="space-y-3">
            {report.visualFindings.map((finding) => (
              <div key={finding.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{finding.label}</p>
                  <p className="text-xs text-gray-400">{finding.description}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ml-3"
                  style={{ background: VISUAL_LEVEL_COLOR[finding.visualLevel] + "18", color: VISUAL_LEVEL_COLOR[finding.visualLevel] }}>
                  {VISUAL_LEVEL_LABEL[finding.visualLevel]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Análisis por zona */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Análisis por zona</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {report.zoneAnalysis.map((zone) => (
              <div key={zone.zone} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-600">{zone.label}</p>
                  <span className="text-sm font-bold" style={{ color: zone.score >= 8 ? "#0F6E56" : zone.score >= 5 ? "#BA7517" : "#D85A30" }}>
                    {zone.score}/10
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${zone.score * 10}%`, background: zone.score >= 8 ? "#1D9E75" : zone.score >= 5 ? "#EF9F27" : "#D85A30" }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{zone.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard visual */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard visual</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DASHBOARD_KEYS.map(({ key, label }) => {
              const level = report.visualDashboard[key];
              return (
                <div key={key} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: DASHBOARD_COLOR[level] + "18", color: DASHBOARD_COLOR[level] }}>
                    {DASHBOARD_LABEL[level]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximo paso sugerido */}
        <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0F6E56 100%)" }}>
          <h3 className="text-lg font-semibold mb-2">{report.nextStep.title}</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
            {report.nextStep.description}
          </p>
          <button onClick={() => router.push(`/agendar-consulta?vertical=dental&source=dental_report&reportId=${params.id}`)}
            className="w-full py-3 bg-white text-sky-600 font-semibold rounded-xl hover:bg-sky-50 transition-colors">
            {report.nextStep.ctaLabel}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center px-4 pb-4">
          {report.disclaimer}
        </p>
      </div>
    </div>
  );
}
