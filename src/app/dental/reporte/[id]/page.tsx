"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DentalMapReport, VisualLevel, VisualRiskLevel } from "@/lib/dental/types";
import { generateFallbackDentalReport } from "@/lib/dental/types";

// ── Colores y etiquetas de riesgo visual ────────────────────────────────────

const RISK_COLOR: Record<VisualRiskLevel, string> = {
  low: "#0F6E56",
  medium: "#BA7517",
  high: "#D85A30",
};
const RISK_LABEL: Record<VisualRiskLevel, string> = {
  low: "Prioridad baja",
  medium: "Prioridad media",
  high: "Prioridad alta",
};
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

// ── Catálogo de tratamientos ────────────────────────────────────────────────

type PriceLevel = "bajo" | "medio" | "alto";

interface TreatmentOption {
  id: string;
  icon: string;
  title: string;
  rationale: string;
  priceRange: string;
  priceLevel: PriceLevel;
  costFactor: string;
}

const PRICE_LEVEL_COLOR: Record<PriceLevel, string> = {
  bajo: "#0F6E56",
  medio: "#BA7517",
  alto: "#0EA5E9",
};

const TREATMENT_CATALOG: Record<string, TreatmentOption> = {
  cleaning: {
    id: "cleaning", icon: "🪥",
    title: "Limpieza / evaluación preventiva",
    rationale: "Recomendable como punto de partida para cualquier caso dental.",
    priceRange: "$30.000 – $80.000",
    priceLevel: "bajo",
    costFactor: "Puede incluir radiografías o exámenes adicionales cobrados aparte.",
  },
  whitening: {
    id: "whitening", icon: "✨",
    title: "Blanqueamiento dental",
    rationale: "Podría ser recomendable si el color o las manchas son tu principal inquietud.",
    priceRange: "$80.000 – $250.000",
    priceLevel: "bajo",
    costFactor: "Tipo de técnica (clínica o domiciliaria), sesiones necesarias y sensibilidad previa.",
  },
  orthodontics: {
    id: "orthodontics", icon: "📐",
    title: "Ortodoncia",
    rationale: "Podría evaluarse si hay desalineación, apiñamiento o alteraciones de mordida visibles.",
    priceRange: "$900.000 – $2.800.000",
    priceLevel: "alto",
    costFactor: "Tipo de aparato (brackets o alineadores), complejidad y duración del tratamiento.",
  },
  veneers: {
    id: "veneers", icon: "💎",
    title: "Carillas / diseño de sonrisa",
    rationale: "Podría ser una opción para transformar forma, color y alineación de forma estética.",
    priceRange: "$1.200.000 – $4.000.000+",
    priceLevel: "alto",
    costFactor: "Número de piezas, material (porcelana vs. resina) y preparación dental requerida.",
  },
  implant: {
    id: "implant", icon: "🔩",
    title: "Implante dental",
    rationale: "Podría ser recomendable evaluar si hay piezas faltantes o daño estructural grave.",
    priceRange: "$600.000 – $1.500.000+ por pieza",
    priceLevel: "alto",
    costFactor: "Calidad del hueso disponible, necesidad de injerto y corona final sobre el implante.",
  },
  restoration: {
    id: "restoration", icon: "🔧",
    title: "Restauraciones / resinas",
    rationale: "Podría ser recomendable si se observan señales de desgaste, fracturas o caries visibles.",
    priceRange: "$60.000 – $180.000 por pieza",
    priceLevel: "medio",
    costFactor: "Número de piezas, extensión del daño y material utilizado.",
  },
  crown: {
    id: "crown", icon: "👑",
    title: "Corona / rehabilitación",
    rationale: "Podría evaluarse si hay piezas con daño estructural importante que no admiten resina simple.",
    priceRange: "$300.000 – $900.000+ por pieza",
    priceLevel: "alto",
    costFactor: "Material de la corona, necesidad de tratamiento de conducto previo y número de piezas.",
  },
  gums: {
    id: "gums", icon: "🩸",
    title: "Tratamiento de encías",
    rationale: "Podría ser recomendable si hay señales de inflamación, sangrado o retracción gingival.",
    priceRange: "$80.000 – $400.000",
    priceLevel: "medio",
    costFactor: "Severidad de la afección, número de cuadrantes y si requiere cirugía.",
  },
};

const TREATMENT_ORDER = [
  "cleaning", "whitening", "orthodontics", "veneers",
  "restoration", "crown", "implant", "gums",
];

function deriveTreatmentOptions(
  answers: Record<string, string>,
  report: DentalMapReport
): TreatmentOption[] {
  const ids = new Set<string>(["cleaning"]);

  // Primary signal: new lean quiz field; fallback to old field
  const intent = answers.queQuieresResolver ?? answers.motivoPrincipal ?? "";

  if (intent === "alinear") {
    ids.add("orthodontics");
    ids.add("veneers");
  } else if (intent === "color" || intent === "estetica") {
    ids.add("whitening");
    ids.add("veneers");
  } else if (intent === "reparar" || intent === "dolor") {
    ids.add("restoration");
    ids.add("crown");
  } else if (intent === "implantar") {
    ids.add("implant");
  } else if (intent === "encias") {
    ids.add("gums");
  } else {
    // "orientacion", "revision", "mal_aliento" or unknown → derive from analysis
    if (report.visualDashboard.alignment === "low") ids.add("orthodontics");
    if (report.visualDashboard.apparentColor === "low") ids.add("whitening");
    if (report.visualDashboard.gums !== "high") ids.add("gums");
    if (report.summary.visualRiskLevel !== "low") ids.add("restoration");
  }

  // Cross-analysis: add based on specific visual findings
  const hasWear = report.visualFindings.some(
    (f) => f.key === "wear" && f.visualLevel !== "favorable"
  );
  const hasCrowding = report.visualFindings.some(
    (f) => f.key === "crowding" && f.visualLevel !== "favorable"
  );
  if (hasWear && !ids.has("restoration")) ids.add("restoration");
  if (hasCrowding && !ids.has("orthodontics")) ids.add("orthodontics");

  return TREATMENT_ORDER.filter((id) => ids.has(id))
    .map((id) => TREATMENT_CATALOG[id])
    .slice(0, 4);
}

// ── Rangos de precio estáticos ──────────────────────────────────────────────

const PRICE_REFERENCE = [
  { label: "Limpieza / evaluación", range: "$30.000 – $80.000" },
  { label: "Blanqueamiento", range: "$80.000 – $250.000" },
  { label: "Resinas / restauraciones simples", range: "$60.000 – $180.000 por pieza" },
  { label: "Ortodoncia", range: "$900.000 – $2.800.000" },
  { label: "Carillas / diseño de sonrisa", range: "$1.200.000 – $4.000.000+" },
  { label: "Implante unitario", range: "$600.000 – $1.500.000+" },
  { label: "Corona / rehabilitación", range: "$300.000 – $900.000+" },
];

const COST_FACTORS = [
  "Necesidad de radiografías o scanner diagnóstico",
  "Número de piezas afectadas",
  "Estado de encías y hueso de soporte",
  "Materiales seleccionados (cerámica, resina, zirconio)",
  "Urgencia y complejidad del caso",
  "Experiencia y especialización del profesional",
  "Clínica o consulta (ubicación y equipamiento)",
];

// ── Componente principal ────────────────────────────────────────────────────

export default function DentalReportePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<DentalMapReport | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [infographicExpanded, setInfographicExpanded] = useState(false);
  const [infographicState, setInfographicState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const showInfographic = params.id !== "demo";

  useEffect(() => {
    // Try sessionStorage first (fast path, no flicker on first visit)
    const raw = sessionStorage.getItem("dental_report");
    if (raw) {
      try { setReport(JSON.parse(raw)); } catch { setReport(generateFallbackDentalReport()); }
      try {
        const ans = sessionStorage.getItem("dental_answers");
        if (ans) setAnswers(JSON.parse(ans));
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }
    if (params.id === "demo") {
      setReport(generateFallbackDentalReport());
      setLoading(false);
      return;
    }
    // Supabase fallback (page reload or direct link)
    fetch(`/api/dental/report/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.report) setReport(data.report as DentalMapReport);
        if (data?.answers) setAnswers(data.answers as Record<string, string>);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🦷</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Reporte no encontrado</p>
          <button
            onClick={() => router.push("/dental/quiz")}
            className="px-6 py-3 bg-[#0EA5E9] text-white rounded-xl font-medium"
          >
            Obtener mi orientación dental
          </button>
        </div>
      </div>
    );
  }

  const score = report.summary.visualScore;
  const riskLevel = report.summary.visualRiskLevel;
  const riskColor = RISK_COLOR[riskLevel] ?? "#BA7517";
  const treatments = deriveTreatmentOptions(answers, report);
  const agendarHref = `/agendar-consulta?vertical=dental&source=dental_report&reportId=${params.id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Barra superior ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[#0EA5E9]">PERFECTO DENTAL</span>
          <p className="text-xs text-gray-400 leading-none mt-0.5">Orientación dental inicial</p>
        </div>
        <button
          onClick={() => router.push(agendarHref)}
          className="px-4 py-2 bg-[#0EA5E9] text-white text-sm font-semibold rounded-xl hover:bg-[#0284C7] transition-colors"
        >
          Confirmar presupuesto
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero: título + score ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0EA5E9] mb-1">
            Tu orientación dental inicial
          </p>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{report.summary.headline}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {report.summary.subheadline}
          </p>
          <div className="flex items-center gap-5">
            {/* Score ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F1EFE8" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={score >= 70 ? "#0F6E56" : score >= 45 ? "#BA7517" : "#D85A30"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 251} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{score}</span>
                <span className="text-[9px] text-gray-400">/ 100</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: riskColor + "18", color: riskColor }}
              >
                {RISK_LABEL[riskLevel]}
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                Estos resultados son una guía preliminar basada en tus fotos y respuestas.
                El presupuesto definitivo requiere evaluación odontológica.
              </p>
            </div>
          </div>
        </div>

        {/* ── Infografía (collapsible, solo si no es demo) ─────────────── */}
        {showInfographic && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => {
                setInfographicExpanded((v) => {
                  if (!v) setInfographicState("loading");
                  return !v;
                });
              }}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">Infografía visual dental</p>
                <p className="text-xs text-gray-400 mt-0.5">Resumen visual generado por IA</p>
              </div>
              <span className="text-[#0EA5E9] text-xs font-semibold">
                {infographicExpanded ? "Ocultar ↑" : "Ver infografía ↓"}
              </span>
            </button>
            {infographicExpanded && (
              <div className="px-4 pb-4">
                {infographicState === "loading" && (
                  <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                    Generando infografía…
                  </div>
                )}
                {infographicState === "error" && (
                  <div className="flex items-center justify-center py-6 text-sm text-red-400">
                    No se pudo cargar la infografía.
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/dental/infographic/${params.id}`}
                  alt="Infografía dental visual"
                  className={`w-full rounded-xl shadow-sm ${infographicState === "ok" ? "" : "hidden"}`}
                  style={{ maxWidth: 794 }}
                  onLoad={() => setInfographicState("ok")}
                  onError={() => setInfographicState("error")}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Lo que vemos en tus fotos ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Lo que vemos en tus fotos</h2>
          <div className="space-y-3">
            {report.visualFindings.map((finding) => (
              <div
                key={finding.key}
                className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{finding.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{finding.description}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
                  style={{
                    background: VISUAL_LEVEL_COLOR[finding.visualLevel] + "18",
                    color: VISUAL_LEVEL_COLOR[finding.visualLevel],
                  }}
                >
                  {VISUAL_LEVEL_LABEL[finding.visualLevel]}
                </span>
              </div>
            ))}
          </div>
          {/* Zone bars */}
          {report.zoneAnalysis.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Por zona
              </p>
              <div className="space-y-2.5">
                {report.zoneAnalysis.map((zone) => (
                  <div key={zone.zone}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-600">{zone.label}</p>
                      <span
                        className="text-xs font-bold"
                        style={{ color: zone.score >= 8 ? "#0F6E56" : zone.score >= 5 ? "#BA7517" : "#D85A30" }}
                      >
                        {zone.score}/10
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${zone.score * 10}%`,
                          background: zone.score >= 8 ? "#1D9E75" : zone.score >= 5 ? "#EF9F27" : "#D85A30",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Posibles tratamientos ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Posibles caminos de tratamiento
          </h2>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            No podemos confirmarlo solo con fotos. Estos son los tratamientos que podrías
            considerar evaluar con un profesional.
          </p>
          <div className="space-y-4">
            {treatments.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.icon}</span>
                    <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                    style={{ background: PRICE_LEVEL_COLOR[t.priceLevel] + "18", color: PRICE_LEVEL_COLOR[t.priceLevel] }}
                  >
                    {t.priceLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.rationale}</p>
                <div className="flex items-center justify-between pt-2.5 border-t border-[#BAE6FD]">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                      Rango referencial
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{t.priceRange}</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  <span className="font-medium text-gray-500">El rango puede variar según: </span>
                  {t.costFactor}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rangos de precio referenciales ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Rangos referenciales que podrías considerar
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Precios de mercado en Chile para referencia. No son un presupuesto.
          </p>
          <div className="space-y-2">
            {PRICE_REFERENCE.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 text-right ml-4 flex-shrink-0">
                  {item.range}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Los precios son rangos referenciales de mercado y pueden variar por clínica,
            materiales, exámenes, radiografías, complejidad y diagnóstico clínico.
          </p>
        </div>

        {/* ── Qué puede cambiar el costo ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Qué puede cambiar el costo
          </h2>
          <ul className="space-y-2.5">
            {COST_FACTORS.map((factor) => (
              <li key={factor} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center">
                  <span className="text-[8px] text-[#0EA5E9] font-bold">→</span>
                </span>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {/* ── CTA principal ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" }}
        >
          <h3 className="text-lg font-semibold mb-2">Confirma tu presupuesto con un dentista</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
            Esta orientación es un punto de partida. Un dentista puede darte un presupuesto
            real revisando tu caso en persona o por videollamada.
          </p>
          <button
            onClick={() => router.push(agendarHref)}
            className="w-full py-3 bg-white text-[#0284C7] font-semibold rounded-xl hover:bg-sky-50 transition-colors"
          >
            Confirmar mi presupuesto con un dentista
          </button>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <p className="text-xs text-gray-400 text-center px-4 pb-6 leading-relaxed">
          La orientación entregada por Perfecto Labs no reemplaza una evaluación odontológica.
          Los precios son rangos referenciales y pueden variar según radiografías, diagnóstico
          clínico, materiales, complejidad y criterio profesional.
        </p>

      </div>
    </div>
  );
}
