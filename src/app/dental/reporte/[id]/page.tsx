"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DentalMapReport } from "@/lib/dental/types";
import { calculateDentalScore, generateFallbackDentalReport } from "@/lib/dental/types";

const SEVERITY_COLOR: Record<string, string> = { normal: "#0F6E56", leve: "#BA7517", moderado: "#D85A30", severo: "#A32D2D" };
const SEVERITY_LABEL: Record<string, string> = { normal: "Normal", leve: "Leve", moderado: "Moderado", severo: "Severo" };

export default function DentalReportePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<DentalMapReport | null>(null);
  const [loading, setLoading] = useState(true);

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
        <button onClick={() => router.push("/dental/quiz")} className="px-6 py-3 bg-sky-500 text-white rounded-xl font-medium">Iniciar analisis</button>
      </div>
    </div>
  );

  const answers = (() => { try { return JSON.parse(sessionStorage.getItem("dental_answers") ?? "{}"); } catch { return {}; } })();
  const scoreResult = calculateDentalScore(answers);
  const score = report.summary.overallScore;
  const urgencyColors: Record<string, string> = { alta: "#D85A30", media: "#BA7517", baja: "#0F6E56" };
  const urgencyColor = urgencyColors[report.summary.urgencyLevel] ?? "#BA7517";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium tracking-widest text-sky-500">PERFECTO DENTAL</span>
          <p className="text-sm text-gray-500">Reporte de salud bucal AI</p>
        </div>
        <button onClick={() => router.push("/agendar-consulta")}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
          Agendar consulta
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Score dental</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: urgencyColor + "18", color: urgencyColor }}>
              Urgencia {report.summary.urgencyLevel}
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
              <p className="text-base font-medium text-gray-900 mb-1">{report.summary.mainFinding}</p>
              <p className="text-sm text-gray-500">{scoreResult.cta}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hallazgos clinicos</h2>
          <div className="space-y-3">
            {Object.values(report.findings).map((finding) => (
              <div key={finding.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{finding.label}</p>
                  <p className="text-xs text-gray-400">{finding.description}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ml-3"
                  style={{ background: SEVERITY_COLOR[finding.severity] + "18", color: SEVERITY_COLOR[finding.severity] }}>
                  {SEVERITY_LABEL[finding.severity]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analisis por zona</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.values(report.zones).map((zone) => (
              <div key={zone.label} className="bg-gray-50 rounded-xl p-4">
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
                <p className="text-xs text-gray-400 mt-1">{zone.notes}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan de accion</h2>
          {report.recommendations.immediate.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Prioritario</p>
              {report.recommendations.immediate.map((r) => (
                <div key={r} className="flex gap-2 mb-1"><span className="text-red-400 flex-shrink-0">●</span><p className="text-sm text-gray-700">{r}</p></div>
              ))}
            </div>
          )}
          {report.recommendations.shortTerm.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Proximos 1-3 meses</p>
              {report.recommendations.shortTerm.map((r) => (
                <div key={r} className="flex gap-2 mb-1"><span className="text-amber-400 flex-shrink-0">●</span><p className="text-sm text-gray-700">{r}</p></div>
              ))}
            </div>
          )}
          {report.recommendations.longTerm.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Mantenimiento</p>
              {report.recommendations.longTerm.map((r) => (
                <div key={r} className="flex gap-2 mb-1"><span className="text-teal-400 flex-shrink-0">●</span><p className="text-sm text-gray-700">{r}</p></div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0F6E56 100%)" }}>
          <h3 className="text-lg font-semibold mb-2">{report.nextStep}</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
            Un dentista de Perfecto Labs revisara tu reporte y te contactara para confirmar tu consulta.
          </p>
          <button onClick={() => router.push("/agendar-consulta")}
            className="w-full py-3 bg-white text-sky-600 font-semibold rounded-xl hover:bg-sky-50 transition-colors">
            Agendar mi consulta
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center px-4 pb-4">
          Este analisis es orientativo y no reemplaza un diagnostico clinico profesional. Generado con inteligencia artificial — Perfecto Labs.
        </p>
      </div>
    </div>
  );
}
