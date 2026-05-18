Reemplaza completamente el archivo src/app/mapa-capilar/reporte/[id]/page.tsx con este contenido exacto:

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { generateFallbackHairAnalysis } from "@/lib/hairMapAnalysis";
import HairReportNew from "@/components/mapa-capilar/HairReportNew";
import type { HairMapReport } from "@/lib/types";

const PHONE_PREFIX_OPTIONS = [
  { value: "+56", label: "CL +56" },
  { value: "+54", label: "AR +54" },
  { value: "+51", label: "PE +51" },
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
  return c.phonePrefix.trim() + nine + rest;
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

function ReportView({ report }: { report: HairMapReport }) {
  const frontalUrl = sessionStorage.getItem("mapa_capilar_photo_frontal") ?? null;
  const coronillaUrl = sessionStorage.getItem("mapa_capilar_photo_crown") ?? null;
  return (
    <div className="space-y-6 pb-12">
      <HairReportNew
        report={report}
        frontalImageUrl={frontalUrl}
        coronillaImageUrl={coronillaUrl}
      />
      <Link
        href="/quiz"
        className="block w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base text-center hover:bg-primary/90 transition-colors"
      >
        Evaluar Tratamiento online
      </Link>
      <p className="text-xs text-gray-400 text-center">
        Un medico revisara tu caso y determinara si corresponde tratamiento.
      </p>
    </div>
  );
}

export default function ReporteIdPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [report, setReport] = useState<HairMapReport | null>(null);
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
    const rawReport = sessionStorage.getItem("mapa_capilar_report");
    if (rawReport) {
      try {
        const parsed = JSON.parse(rawReport) as unknown;
        if (typeof parsed === "object" && parsed !== null && "patient" in parsed) {
          setReport(parsed as HairMapReport);
          return;
        }
      } catch {}
    }
    setReport(generateFallbackHairAnalysis());
  }, [id]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ContactForm | "phone", string>> = {};
    if (!contact.email.trim() || !contact.email.includes("@")) errs.email = "Email invalido";
    if (!validateChileMobile(contact)) {
      errs.phone = contact.phonePrefix === "+56"
        ? "Ingresa el 9 y 8 digitos del movil"
        : "Ingresa un numero valido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const answersRaw = sessionStorage.getItem("mapa_capilar_answers");
    const parsed = (() => {
      try { return JSON.parse(answersRaw ?? "{}") as Record<string, string>; }
      catch { return {} as Record<string, string>; }
    })();
    const analysisId = id ?? sessionStorage.getItem("mapa_capilar_analysis_id") ?? null;
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

  if (view === "report") {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 h-14 flex items-center">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 sm:px-5 py-8">
          {report ? (
            <ReportView report={report} />
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">Cargando tu reporte...</p>
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
            Tu Mapa Capilar AI esta listo
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
              >
                {PHONE_PREFIX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={2}
                value={contact.phoneNine}
                onChange={(e) => setContact((c) => ({ ...c, phoneNine: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                className={cn(
                  "w-11 shrink-0 text-center px-1 py-3.5 rounded-xl border text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30",
                  errors.phone ? "border-red-400" : "border-gray-200"
                )}
              />
              <input
                type="tel"
                inputMode="numeric"
                value={contact.phoneRest}
                placeholder="12345678"
                onChange={(e) => setContact((c) => ({ ...c, phoneRest: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                className={cn(
                  "min-w-0 flex-1 px-4 py-3.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30",
                  errors.phone ? "border-red-400" : "border-gray-200"
                )}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            <p className="text-xs text-gray-400 mt-1.5">
              Chile: deja el 9 y completa 8 digitos (ej. 9 1234 5678).
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