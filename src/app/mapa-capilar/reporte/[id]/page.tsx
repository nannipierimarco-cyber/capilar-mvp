"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  generateFallbackAnalysisReport,
  type HairMapAnalysisReport,
} from "@/lib/mapaCapilar";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  Alto: "bg-red-100 text-red-700",
  Medio: "bg-amber-100 text-amber-700",
  Bajo: "bg-green-100 text-green-700",
};

function LevelBadge({ level }: { level: "Alto" | "Medio" | "Bajo" | string }) {
  const cls = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] ?? "bg-gray-100 text-gray-600";
  return <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", cls)}>{level}</span>;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{score}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[55%]">{value}</span>
    </div>
  );
}

// ─── Full Report ─────────────────────────────────────────────────────────────

function FullReport({
  report,
  frontalUrl,
  crownUrl,
}: {
  report: HairMapAnalysisReport;
  frontalUrl?: string;
  crownUrl?: string;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let heightLeft = pdfH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pdfW, pdfH);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfW, pdfH);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save("mapa-capilar-ai.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }, []);

  const s = report.summary;
  const scoreColor = s.overallScore >= 70 ? "text-green-600" : s.overallScore >= 45 ? "text-amber-500" : "text-red-500";

  return (
    <div>
      {/* Download button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-60"
        >
          {downloading ? (
            "Generando PDF..."
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Descargar PDF
            </>
          )}
        </button>
      </div>

      <div ref={reportRef} className="space-y-5 bg-white">
        {/* Header */}
        <div className="text-center space-y-2 pb-2">
          <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Mapa Capilar AI
          </div>
          <p className="text-xs text-gray-400">Análisis visual orientativo — no constituye diagnóstico médico</p>
        </div>

        {/* Summary with score */}
        <div className="bg-gray-50 rounded-2xl p-5 flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-white border border-gray-200 flex flex-col items-center justify-center shadow-sm">
            <span className={cn("text-2xl font-bold tabular-nums", scoreColor)}>{s.overallScore}</span>
            <span className="text-[10px] text-gray-400 font-medium">/100</span>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.priority}</p>
            <p className="text-sm font-semibold text-gray-900 leading-snug">{s.mainFinding}</p>
            <p className="text-xs text-gray-500">Confianza: <span className="font-medium text-gray-700">{s.confidence}</span></p>
          </div>
        </div>

        {/* Photos */}
        {(frontalUrl || crownUrl) && (
          <SectionCard title="Fotos analizadas">
            <div className="grid grid-cols-2 gap-3">
              {frontalUrl && (
                <div className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={frontalUrl} alt="Foto frontal" className="w-full aspect-square object-cover rounded-xl" />
                  <p className="text-xs text-center text-gray-500">Frontal / lateral</p>
                </div>
              )}
              {crownUrl && (
                <div className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={crownUrl} alt="Coronilla" className="w-full aspect-square object-cover rounded-xl" />
                  <p className="text-xs text-center text-gray-500">Coronilla</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* User context */}
        <SectionCard title="Contexto del usuario">
          <div>
            <MetricRow label="Preocupación principal" value={report.userContext.mainConcern} />
            <MetricRow label="Tiempo con cambios" value={report.userContext.hairLossDuration} />
            <MetricRow label="Historial familiar" value={report.userContext.familyHistory} />
            <MetricRow label="Tratamientos previos" value={report.userContext.previousTreatments} />
          </div>
        </SectionCard>

        {/* Visual analysis */}
        <SectionCard title="Análisis visual">
          <div>
            <MetricRow label="Tipo de pelo" value={report.visualAnalysis.hairType} />
            <MetricRow label="Densidad capilar" value={report.visualAnalysis.density} />
            <MetricRow label="Línea capilar" value={report.visualAnalysis.hairline} />
            <MetricRow label="Visibilidad del cuero cabelludo" value={report.visualAnalysis.scalpVisibility} />
            <MetricRow label="Cobertura de coronilla" value={report.visualAnalysis.crownCoverage} />
            <MetricRow label="Textura del pelo" value={report.visualAnalysis.hairTexture} />
            <MetricRow label="Grosor aparente" value={report.visualAnalysis.hairThickness} />
            <MetricRow label="Estado general" value={report.visualAnalysis.overallCondition} />
          </div>
        </SectionCard>

        {/* Zone scores */}
        <SectionCard title="Scores por zona">
          <div className="space-y-4">
            {([
              ["Línea frontal", report.zones.frontalLine],
              ["Densidad frontal", report.zones.frontalDensity],
              ["Entradas", report.zones.temples],
              ["Coronilla", report.zones.crown],
              ["Salud del cuero cabelludo", report.zones.scalpHealth],
            ] as [string, { score: number; status: string; label: string }][]).map(([name, zone]) => (
              <div key={name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">{name}</span>
                  <span className="text-xs text-gray-500">{zone.label}</span>
                </div>
                <ScoreBar score={zone.score} label={zone.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Risk areas */}
        {report.riskAreas.length > 0 && (
          <SectionCard title="Áreas de riesgo">
            <div className="space-y-3">
              {report.riskAreas.map((risk, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{risk.area}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{risk.reason}</p>
                  </div>
                  <LevelBadge level={risk.level} />
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Callouts */}
        {(report.photoCallouts.frontPhoto.length > 0 || report.photoCallouts.crownPhoto.length > 0) && (
          <SectionCard title="Callouts visuales">
            <div className="space-y-4">
              {report.photoCallouts.frontPhoto.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Foto frontal</p>
                  <div className="space-y-2">
                    {report.photoCallouts.frontPhoto.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm text-gray-700">{c.label}</span>
                          <span className="text-xs text-gray-400 ml-1.5">({c.area})</span>
                        </div>
                        <LevelBadge level={c.level} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.photoCallouts.crownPhoto.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Coronilla</p>
                  <div className="space-y-2">
                    {report.photoCallouts.crownPhoto.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm text-gray-700">{c.label}</span>
                          <span className="text-xs text-gray-400 ml-1.5">({c.area})</span>
                        </div>
                        <LevelBadge level={c.level} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Visual tags */}
        {report.visualTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {report.visualTags.map((tag) => (
              <span key={tag} className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">{report.disclaimer}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 pb-10 space-y-3">
        <Link
          href="/quiz"
          className="block w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base text-center hover:bg-primary/90 transition-colors"
        >
          Continuar con evaluación médica
        </Link>
        <p className="text-xs text-gray-400 text-center">
          Un médico revisará tu caso y determinará si corresponde tratamiento.
        </p>
      </div>
    </div>
  );
}

// ─── Contact gate ─────────────────────────────────────────────────────────────

const FINAL_INTEREST_OPTIONS = [
  "Evaluar trasplante capilar",
  "Soluciones para minimizar la caída",
  "Solo quiero conocer mi situación capilar",
];

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  age: string;
  finalInterest: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReporteIdPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [report, setReport] = useState<HairMapAnalysisReport | null>(null);
  const [frontalUrl, setFrontalUrl] = useState<string | undefined>();
  const [crownUrl, setCrownUrl] = useState<string | undefined>();
  const [view, setView] = useState<"form" | "report">("form");
  const [contact, setContact] = useState<ContactForm>({
    name: "", email: "", phone: "", age: "", finalInterest: "",
  });
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load report from sessionStorage (set by analizando page) or fallback
  useEffect(() => {
    const rawAnswers = sessionStorage.getItem("mapa_capilar_answers");
    const rawReport = sessionStorage.getItem("mapa_capilar_report");

    if (rawReport) {
      setReport(JSON.parse(rawReport) as HairMapAnalysisReport);
    } else {
      const answers = rawAnswers
        ? (JSON.parse(rawAnswers) as Partial<Record<string, string>>)
        : {};
      setReport(generateFallbackAnalysisReport(answers as Parameters<typeof generateFallbackAnalysisReport>[0]));
    }

    // Try to get photo URLs from Supabase via the analysis ID
    if (id) {
      fetch(`/api/mapa-capilar/get-analysis?id=${id}`)
        .then((r) => r.json())
        .then((data: { frontalUrl?: string; crownUrl?: string; report?: HairMapAnalysisReport }) => {
          if (data.frontalUrl) setFrontalUrl(data.frontalUrl);
          if (data.crownUrl) setCrownUrl(data.crownUrl);
          if (data.report && !rawReport) setReport(data.report);
        })
        .catch(() => {});
    }
  }, [id]);

  const validate = (): boolean => {
    const errs: Partial<ContactForm> = {};
    if (!contact.name.trim()) errs.name = "Requerido";
    if (!contact.email.includes("@")) errs.email = "Email inválido";
    if (contact.phone.replace(/\D/g, "").length < 8) errs.phone = "Número inválido";
    if (!contact.age || isNaN(Number(contact.age))) errs.age = "Ingresa tu edad";
    if (!contact.finalInterest) errs.finalInterest = "Selecciona una opción";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    // Save lead non-blocking
    fetch("/api/mapa-capilar/save-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contact,
        concern: (() => { try { return JSON.parse(sessionStorage.getItem("mapa_capilar_answers") ?? "{}").concern ?? ""; } catch { return ""; } })(),
        goal: (() => { try { return JSON.parse(sessionStorage.getItem("mapa_capilar_answers") ?? "{}").goal ?? ""; } catch { return ""; } })(),
        report: report ?? undefined,
      }),
    }).catch(() => {});

    window.scrollTo({ top: 0, behavior: "smooth" });
    setView("report");
    setSubmitting(false);
  };

  const inputClass = (err?: string) =>
    cn(
      "w-full px-4 py-3.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow",
      err ? "border-red-400" : "border-gray-200"
    );

  // ── Report view ──
  if (view === "report") {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 h-14 flex items-center">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
          </div>
        </header>
        <main className="max-w-md mx-auto px-5 py-8">
          {report ? (
            <FullReport report={report} frontalUrl={frontalUrl} crownUrl={crownUrl} />
          ) : (
            <div className="text-center py-16 space-y-4">
              <p className="text-gray-600">
                Tu análisis fue procesado. Continúa con la evaluación médica para conocer más.
              </p>
              <Link
                href="/quiz"
                className="inline-block bg-primary text-white font-semibold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-colors"
              >
                Continuar con evaluación médica
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Contact gate ──
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center">
          <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-10">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tu Mapa Capilar AI está listo
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Completa tus datos para ver tu reporte.
          </h1>
          <p className="text-sm text-gray-500">
            Tus datos son privados y solo se usan para enviarte tu reporte.
          </p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input type="text" value={contact.name} placeholder="Tu nombre"
              onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
              className={inputClass(errors.name)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={contact.email} placeholder="tu@email.com"
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              className={inputClass(errors.email)} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
            <input type="tel" value={contact.phone} placeholder="+56 9 1234 5678"
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              className={inputClass(errors.phone)} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Edad</label>
            <input type="number" value={contact.age} placeholder="30" min="16" max="90"
              onChange={(e) => setContact((c) => ({ ...c, age: e.target.value }))}
              className={inputClass(errors.age)} />
            {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
          </div>

          {/* Final interest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Qué te interesa explorar después?
            </label>
            <div className="flex flex-col gap-2.5">
              {FINAL_INTEREST_OPTIONS.map((opt) => (
                <button key={opt} type="button"
                  onClick={() => setContact((c) => ({ ...c, finalInterest: opt }))}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all",
                    contact.finalInterest === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.finalInterest && <p className="text-xs text-red-500 mt-1">{errors.finalInterest}</p>}
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
          >
            {submitting ? "Preparando reporte..." : "Ver mi reporte"}
          </button>

          <p className="text-xs text-gray-400 text-center pb-4">
            Al continuar aceptas que procesemos tus datos para mostrarte tu reporte.
          </p>
        </div>
      </main>
    </div>
  );
}
