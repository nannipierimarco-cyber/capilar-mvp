"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MapaCapilarReport } from "@/lib/mapaCapilar";

const PHONE_PREFIX_OPTIONS = [
  { value: "+56", label: "🇨🇱 +56" },
  { value: "+54", label: "🇦🇷 +54" },
  { value: "+51", label: "🇵🇪 +51" },
] as const;

interface ContactData {
  email: string;
  phonePrefix: string;
  phoneNine: string;
  phoneRest: string;
}

function buildWhatsAppNumber(c: ContactData): string {
  const rest = c.phoneRest.replace(/\D/g, "");
  const nine = c.phoneNine.replace(/\D/g, "") || "9";
  return `${c.phonePrefix.trim()}${nine}${rest}`;
}

function validateChileMobile(c: ContactData): boolean {
  if (c.phonePrefix !== "+56") {
    const rest = c.phoneRest.replace(/\D/g, "");
    return rest.length >= 6 && rest.length <= 12;
  }
  const rest = c.phoneRest.replace(/\D/g, "");
  const nine = c.phoneNine.replace(/\D/g, "") || "9";
  if (nine.length > 2) return false;
  return rest.length === 8;
}

// ─── Report sub-components ────────────────────────────────────────────────────

function DensityBadge({ value }: { value: string }) {
  const cls =
    value === "Alta"
      ? "bg-green-100 text-green-700"
      : value === "Baja"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", cls)}>{value}</span>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ReportView({
  report,
  answers,
}: {
  report: MapaCapilarReport;
  answers: Record<string, string>;
}) {
  const densityZones: [string, string][] = [
    ["Frontal", report.densityMap.frontal],
    ["Entradas", report.densityMap.entradas],
    ["Superior", report.densityMap.superior],
    ["Coronilla", report.densityMap.coronilla],
    ["Laterales", report.densityMap.laterales],
  ];

  const nextStepStyle = report.nextStep.includes("trasplante")
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : report.nextStep.includes("revisión")
    ? "bg-blue-50 border-blue-200 text-blue-800"
    : "bg-green-50 border-green-200 text-green-700";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
          Mapa Capilar AI
        </div>
        <p className="text-xs text-gray-400">
          Análisis visual orientativo según la foto subida y tus respuestas.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <p className="text-sm text-gray-700 leading-relaxed italic">
          &ldquo;{report.summary}&rdquo;
        </p>
      </div>

      {/* Main metrics */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Métricas visuales
          </p>
        </div>
        <div className="px-5">
          <MetricRow label="Tipo de pelo aparente" value={report.hairType} />
          <MetricRow label="Densidad visual" value={report.visualDensity} />
          <MetricRow label="Línea capilar visual" value={report.hairlineRecession} />
          <MetricRow
            label="Visibilidad del cuero cabelludo"
            value={report.scalpVisibility}
          />
          <MetricRow label="Cobertura de coronilla" value={report.crownCoverage} />
        </div>
      </div>

      {/* Observation zones */}
      <div className="border border-gray-200 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Zonas a observar
        </p>
        <div className="flex flex-wrap gap-2">
          {report.observationZones.length > 0 ? (
            report.observationZones.map((zone) => (
              <span
                key={zone}
                className="bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full"
              >
                {zone}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">Sin zonas de atención particular</span>
          )}
        </div>
      </div>

      {/* Density map */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Mapa de densidad
          </p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-2.5">
          {densityZones.map(([zone, val]) => (
            <div
              key={zone}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              <span className="text-sm text-gray-600">{zone}</span>
              <DensityBadge value={val} />
            </div>
          ))}
        </div>
      </div>

      {/* Next step */}
      <div className={cn("rounded-2xl border p-5", nextStepStyle)}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-60">
          Próximo paso orientativo
        </p>
        <p className="font-semibold text-base">{report.nextStep}</p>
      </div>

      {/* Answers recap */}
      {answers.concern && (
        <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
            Tus respuestas
          </p>
          <div className="space-y-1 text-sm text-gray-600">
            {answers.concern && (
              <p>
                Preocupación principal:{" "}
                <span className="text-gray-900 font-medium">{answers.concern}</span>
              </p>
            )}
            {answers.duration && (
              <p>
                Tiempo con cambios:{" "}
                <span className="text-gray-900 font-medium">{answers.duration}</span>
              </p>
            )}
            {answers.goal && (
              <p>
                Objetivo:{" "}
                <span className="text-gray-900 font-medium">{answers.goal}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/quiz"
        className="block w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base text-center hover:bg-primary/90 active:scale-[.98] transition-all"
      >
        Continuar con evaluación médica
      </Link>
      <p className="text-xs text-gray-400 text-center -mt-2">
        Un médico revisará tu caso y determinará si corresponde tratamiento.
      </p>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center leading-relaxed pb-6">
        Mapa visual generado por AI. No constituye diagnóstico médico ni reemplaza una
        evaluación profesional.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportePage() {
  const router = useRouter();
  const [report, setReport] = useState<MapaCapilarReport | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [view, setView] = useState<"form" | "report">("form");
  const [contact, setContact] = useState<ContactData>({
    email: "",
    phonePrefix: "+56",
    phoneNine: "9",
    phoneRest: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactData | "phone", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rawAnswers = sessionStorage.getItem("mapa_capilar_answers");
    if (!rawAnswers) {
      router.replace("/mapa-capilar");
      return;
    }
    setAnswers(JSON.parse(rawAnswers) as Record<string, string>);

    const rawReport = sessionStorage.getItem("mapa_capilar_report");
    if (rawReport) {
      setReport(JSON.parse(rawReport) as MapaCapilarReport);
    }
  }, [router]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ContactData | "phone", string>> = {};
    if (!contact.email.trim() || !contact.email.includes("@")) errs.email = "Email inválido";
    if (!validateChileMobile(contact)) {
      errs.phone =
        contact.phonePrefix === "+56"
          ? "Ingresa el 9 y 8 dígitos del móvil (ej. 9 + 12345678)"
          : "Ingresa un número válido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    // Non-blocking lead save
    const analysisId = sessionStorage.getItem("mapa_capilar_analysis_id") ?? null;
    fetch("/api/mapa-capilar/save-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: contact.email.trim(),
        phone: buildWhatsAppNumber(contact),
        concern: answers.concern ?? "",
        duration: answers.duration ?? "",
        previousTreatment: answers.previousTreatment ?? "",
        familyHistory: answers.familyHistory ?? "",
        goal: answers.goal ?? "",
        report: report ?? undefined,
        analysisId,
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

  // Report view
  if (view === "report") {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 h-14 flex items-center">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Nilo</span>
          </div>
        </header>
        <main className="max-w-md mx-auto px-5 py-8">
          {report ? (
            <ReportView report={report} answers={answers} />
          ) : (
            // Fallback: report not available (e.g. sessionStorage write failed)
            <div className="text-center py-16 space-y-4">
              <p className="text-gray-600">
                Tu análisis fue procesado. Para ver tu reporte completo, continúa con la
                evaluación médica.
              </p>
              <Link
                href="/quiz"
                className="inline-block bg-primary text-white font-semibold px-8 py-4 rounded-2xl text-base hover:bg-primary/90 transition-colors"
              >
                Continuar con evaluación médica
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Contact form view
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center">
          <span className="text-lg font-semibold tracking-tight text-gray-900">Nilo</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Tu Mapa Capilar AI está listo
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Deja tu email y WhatsApp para ver tu reporte visual.
          </h1>
          <p className="text-sm text-gray-500">
            Solo te contactaremos respecto a tu mapa capilar. Tus datos son privados.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={contact.email}
              placeholder="tu@email.com"
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              className={inputClass(errors.email)}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
            <div className="flex gap-2 items-stretch">
              <select
                value={contact.phonePrefix}
                onChange={(e) => setContact((c) => ({ ...c, phonePrefix: e.target.value }))}
                className={cn(
                  "shrink-0 w-[100px] px-2 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30",
                  errors.phone ? "border-red-400" : "border-gray-200"
                )}
                aria-label="Prefijo país"
              >
                {PHONE_PREFIX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={2}
                value={contact.phoneNine}
                onChange={(e) =>
                  setContact((c) => ({ ...c, phoneNine: e.target.value.replace(/\D/g, "").slice(0, 2) }))
                }
                className={cn(
                  "w-11 shrink-0 text-center px-1 py-3.5 rounded-xl border text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30",
                  errors.phone ? "border-red-400" : "border-gray-200"
                )}
                aria-label="Prefijo móvil (ej. 9)"
              />
              <input
                type="tel"
                inputMode="numeric"
                value={contact.phoneRest}
                placeholder="12345678"
                onChange={(e) =>
                  setContact((c) => ({ ...c, phoneRest: e.target.value.replace(/\D/g, "").slice(0, 8) }))
                }
                className={cn(
                  "min-w-0 flex-1 px-4 py-3.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30",
                  errors.phone ? "border-red-400" : "border-gray-200"
                )}
                aria-label="Número móvil"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            <p className="text-xs text-gray-400 mt-1.5">
              Chile: deja el 9 y completa 8 dígitos después (formato típico 9 1234 5678).
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? "Preparando reporte..." : "Ver mi reporte"}
          </button>

          <p className="text-xs text-gray-400 text-center pb-4">
            Al continuar aceptas que Nilo procese tus datos para mostrarte tu reporte.
          </p>
        </div>
      </main>
    </div>
  );
}
