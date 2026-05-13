"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  generateFallbackAnalysisReport,
  normalizeHairMapReport,
  type HairMapAnalysisReport,
  type MapaCapilarAnswers,
} from "@/lib/mapaCapilar";
import { HairMapLuxeInfographic } from "@/components/hair-report/HairMapLuxeInfographic";

// ─── Mandatory disclaimer — on screen (download is JPEG of the infographic) ───

const DISCLAIMER =
  "Este análisis es solo con fines informativos y no constituye un diagnóstico médico. Para una atención personalizada, consulta a un dermatólogo certificado.";

function MedicalDisclaimer() {
  return (
    <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
      <span className="font-semibold">Aviso importante: </span>
      {DISCLAIMER}
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
  const reportCaptureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const handleDownloadImage = useCallback(async () => {
    const el = reportCaptureRef.current;
    if (!el || !report) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#FDFBF7",
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "mapa-capilar-perfecto.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Image export failed:", err);
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }, [report]);

  return (
    <div>
      {/* Off-screen capture target — always 794px, forCapture layout (no responsive breakpoints) */}
      <div
        aria-hidden="true"
        ref={reportCaptureRef}
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: 794,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          background: "#FDFBF7",
          padding: 4,
        }}
      >
        <HairMapLuxeInfographic forCapture report={report} frontalUrl={frontalUrl} crownUrl={crownUrl} />
      </div>

      <div id="hair-report-image" className="bg-[#FDFBF7] p-1 sm:p-2 rounded-3xl">
        <HairMapLuxeInfographic report={report} frontalUrl={frontalUrl} crownUrl={crownUrl} />
      </div>

      <MedicalDisclaimer />

      <div className="mt-6 pb-10 space-y-3">
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 text-sm font-medium text-primary border border-primary/30 px-4 py-3.5 rounded-2xl hover:bg-primary/5 transition-colors disabled:opacity-60"
        >
          {downloading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generando imagen...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Descargar imagen
            </>
          )}
        </button>
        {downloadError && (
          <p className="text-xs text-red-500 text-center">
            No se pudo generar la imagen. Recarga e intenta de nuevo. Si persiste, usa captura de
            pantalla.
          </p>
        )}
        <Link
          href="/quiz"
          className="block w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base text-center hover:bg-primary/90 transition-colors"
        >
          Evaluar Tratamiento online
        </Link>
        <p className="text-xs text-gray-400 text-center">
          Un médico revisará tu caso y determinará si corresponde tratamiento.
        </p>
      </div>
    </div>
  );
}

// ─── Contact gate — email + WhatsApp (Chile por defecto) ─────────────────────

const PHONE_PREFIX_OPTIONS = [
  { value: "+56", label: "🇨🇱 +56" },
  { value: "+54", label: "🇦🇷 +54" },
  { value: "+51", label: "🇵🇪 +51" },
] as const;

interface ContactForm {
  email: string;
  phonePrefix: string;
  phoneNine: string;
  phoneRest: string;
}

function buildWhatsAppNumber(c: ContactForm): string {
  const rest = c.phoneRest.replace(/\D/g, "");
  const nine = c.phoneNine.replace(/\D/g, "") || "9";
  return `${c.phonePrefix.trim()}${nine}${rest}`;
}

function validateChileMobile(c: ContactForm): boolean {
  if (c.phonePrefix !== "+56") {
    const rest = c.phoneRest.replace(/\D/g, "");
    return rest.length >= 6 && rest.length <= 12;
  }
  const rest = c.phoneRest.replace(/\D/g, "");
  const nine = c.phoneNine.replace(/\D/g, "") || "9";
  if (nine.length > 2) return false;
  return rest.length === 8;
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
    email: "",
    phonePrefix: "+56",
    phoneNine: "9",
    phoneRest: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm | "phone", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rawAnswers = sessionStorage.getItem("mapa_capilar_answers");
    const rawReport = sessionStorage.getItem("mapa_capilar_report");

    const answersParsed = rawAnswers
      ? (JSON.parse(rawAnswers) as Partial<MapaCapilarAnswers>)
      : {};

    if (rawReport) {
      setReport(normalizeHairMapReport(JSON.parse(rawReport) as unknown, answersParsed));
    } else {
      setReport(generateFallbackAnalysisReport(answersParsed));
    }

    if (id) {
      const accessToken = sessionStorage.getItem("mapa_capilar_access_token") ?? "";
      const url = `/api/mapa-capilar/get-analysis?id=${encodeURIComponent(id)}&token=${encodeURIComponent(accessToken)}`;
      fetch(url)
        .then((r) => r.json())
        .then((data: { frontalUrl?: string; crownUrl?: string; report?: HairMapAnalysisReport }) => {
          if (data.frontalUrl) setFrontalUrl(data.frontalUrl);
          if (data.crownUrl) setCrownUrl(data.crownUrl);
          if (data.report && !rawReport) {
            setReport(normalizeHairMapReport(data.report as unknown, answersParsed));
          }
        })
        .catch(() => {});
    }
  }, [id]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ContactForm | "phone", string>> = {};
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

    const answersRaw = sessionStorage.getItem("mapa_capilar_answers");
    const parsed = (() => {
      try {
        return JSON.parse(answersRaw ?? "{}") as Record<string, string>;
      } catch {
        return {} as Record<string, string>;
      }
    })();

    fetch("/api/mapa-capilar/save-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: contact.email.trim(),
        phone: buildWhatsAppNumber(contact),
        concern: parsed.concern ?? "",
        duration: parsed.duration ?? "",
        previousTreatment: parsed.previousTreatment ?? "",
        familyHistory: parsed.familyHistory ?? "",
        goal: parsed.goal ?? "",
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

  if (view === "report") {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 h-14 flex items-center">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 sm:px-5 py-8">
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
                Evaluar Tratamiento online
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

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
            Deja tu email y WhatsApp para ver tu reporte.
          </h1>
          <p className="text-sm text-gray-500">
            Solo te contactaremos respecto a tu mapa capilar. Tus datos son privados.
          </p>
        </div>

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
