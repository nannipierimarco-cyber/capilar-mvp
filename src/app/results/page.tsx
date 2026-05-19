"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import HairReportNew from "@/components/mapa-capilar/HairReportNew";
import type { HairMapReport } from "@/lib/types";
import type { IntakeSnapshot } from "@/app/api/ai/patient-report/route";

// ─── Design tokens (same as HairReportNew) ────────────────────────
const GOLD   = "#c9a84c";
const CREAM  = "#fafaf8";
const BORDER = "#e6d9bc";
const DARK   = "#1a1a1a";
const MUTED  = "#6b7280";
const RED    = "#c0392b";

// ─── Shared primitives ────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: GOLD }}>
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ backgroundColor: "#ffffff", borderColor: BORDER }}
    >
      {children}
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────

function LoadingScreen({ secondsLeft }: { secondsLeft: number }) {
  const pct = Math.round(((30 - secondsLeft) / 30) * 100);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: GOLD }}>
            Perfecto · Análisis capilar
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Preparando tu reporte</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Estamos analizando tus fotos y respuestas para generar tu evaluación personalizada.
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: GOLD }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {secondsLeft > 0 ? `Listo en aprox. ${secondsLeft}s…` : "Finalizando…"}
          </p>
        </div>
        <div className="space-y-3 text-left">
          {[
            { label: "Evaluando patrón de caída",   done: secondsLeft < 22 },
            { label: "Analizando densidad por zona", done: secondsLeft < 14 },
            { label: "Calculando etapa Norwood",     done: secondsLeft < 7  },
            { label: "Generando mapa capilar",       done: secondsLeft <= 0 },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500"
                style={{ backgroundColor: done ? GOLD : "#f3f4f6" }}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              <span className="text-sm transition-colors duration-500" style={{ color: done ? DARK : "#9ca3af" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Clinical profile section ─────────────────────────────────────

const SEVERITY_LABEL: Record<string, string> = {
  mild:     "Leve",
  moderate: "Moderada",
  advanced: "Avanzada",
};

const JOURNEY_LABEL: Record<string, string> = {
  treatment:  "Tratamiento médico online",
  transplant: "Evaluación de trasplante",
  both:       "Tratamiento médico + evaluación de trasplante",
};

function ClinicalProfileSection({ intake }: { intake: IntakeSnapshot }) {
  const redFlags: string[] = [];
  if (intake.severe_irritation) redFlags.push("Irritación severa del cuero cabelludo");
  if (intake.heart_disease)     redFlags.push("Enfermedad cardíaca declarada");
  if (intake.liver_disease)     redFlags.push("Enfermedad hepática declarada");
  if (intake.kidney_disease)    redFlags.push("Enfermedad renal declarada");

  const treatments = intake.previous_treatments?.filter(Boolean) ?? [];
  const conditions = intake.medical_conditions?.filter(
    (c) => c && c !== "Ninguna de las anteriores"
  ) ?? [];

  const journeyLabel = intake.journey_type ? (JOURNEY_LABEL[intake.journey_type] ?? intake.journey_type) : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: CREAM, borderColor: BORDER }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ backgroundColor: "#ffffff", borderColor: BORDER }}>
        <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
          Perfecto · Evaluación capilar
        </p>
        <h2 className="text-lg font-bold mt-0.5" style={{ color: DARK }}>Tu Perfil Clínico</h2>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
          Resumen de tus respuestas para revisión médica
        </p>
      </div>

      <div className="p-4 space-y-4">

        {/* Row 1: Duración + Historial familiar + Nivel */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="!p-3">
            <SectionTitle>Duración caída</SectionTitle>
            <p className="text-sm font-semibold" style={{ color: DARK }}>
              {intake.hair_loss_duration ?? "—"}
            </p>
          </Card>
          <Card className="!p-3">
            <SectionTitle>Historial familiar</SectionTitle>
            <p className="text-sm font-semibold" style={{ color: DARK }}>
              {intake.family_history === true ? "Sí" : intake.family_history === false ? "No" : "—"}
            </p>
          </Card>
          <Card className="!p-3">
            <SectionTitle>Nivel de pérdida</SectionTitle>
            <p className="text-sm font-semibold" style={{ color: DARK }}>
              {intake.loss_severity ? (SEVERITY_LABEL[intake.loss_severity] ?? intake.loss_severity) : "—"}
            </p>
          </Card>
        </div>

        {/* Row 2: Tratamientos previos + Condiciones médicas */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-3">
            <SectionTitle>Tratamientos previos</SectionTitle>
            {treatments.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {treatments.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#f3f0e8", color: DARK, border: `1px solid ${BORDER}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: MUTED }}>Ninguno reportado</p>
            )}
          </Card>
          <Card className="!p-3">
            <SectionTitle>Condiciones médicas</SectionTitle>
            {conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {conditions.map((c) => (
                  <span
                    key={c}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: MUTED }}>Ninguna reportada</p>
            )}
          </Card>
        </div>

        {/* Row 3: Medicamentos actuales + Señales de alerta */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-3">
            <SectionTitle>Medicamentos actuales</SectionTitle>
            <p className="text-sm font-semibold" style={{ color: DARK }}>
              {intake.current_medications === true ? "Sí" : intake.current_medications === false ? "No" : "—"}
            </p>
          </Card>
          <Card className="!p-3">
            <SectionTitle>Señales de alerta</SectionTitle>
            {redFlags.length > 0 ? (
              <div className="space-y-1">
                {redFlags.map((f) => (
                  <div key={f} className="flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: RED }} />
                    <p className="text-[9px] leading-snug font-medium" style={{ color: RED }}>{f}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#4a7c4e" }}>Sin señales de alerta</p>
            )}
          </Card>
        </div>

        {/* Ruta recomendada */}
        {journeyLabel && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: "#f3f0e8", borderColor: BORDER, border: `1px solid ${BORDER}` }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: GOLD }}
            />
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Ruta recomendada</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: DARK }}>{journeyLabel}</p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[9px] leading-relaxed" style={{ color: MUTED }}>
          <strong style={{ color: "#8a6c2c" }}>Nota: </strong>
          Este perfil es un resumen de tus respuestas declaradas. Un médico habilitado revisará tu caso
          antes de cualquier indicación de tratamiento.
        </p>
      </div>
    </div>
  );
}

// ─── Report screen ────────────────────────────────────────────────

function ReportScreen({
  report,
  frontalUrl,
  crownUrl,
  patientName,
  journey,
  intake,
}: {
  report: HairMapReport;
  frontalUrl: string | null;
  crownUrl: string | null;
  patientName: string;
  journey: string | null;
  intake: IntakeSnapshot | null;
}) {
  const membershipUrl = journey
    ? `/membership?plan=inicio&journey=${journey}`
    : "/membership?plan=inicio";

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center">
          <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-5 py-8 space-y-8">
        {/* Hero badge */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full"
            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          >
            Tu evaluación capilar está lista
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tu Mapa Capilar</h1>
          <p className="text-sm text-gray-500">
            Análisis personalizado basado en tus fotos y respuestas.
          </p>
        </div>

        {/* Hair map report */}
        <HairReportNew
          report={report}
          frontalImageUrl={frontalUrl}
          coronillaImageUrl={crownUrl}
          patientName={patientName || undefined}
        />

        {/* Clinical profile */}
        {intake && <ClinicalProfileSection intake={intake} />}

        {/* CTA — prominent */}
        <div
          className="rounded-2xl p-6 space-y-4 text-center"
          style={{ backgroundColor: CREAM, border: `1.5px solid ${BORDER}` }}
        >
          <div className="space-y-1">
            <p className="text-lg font-bold" style={{ color: DARK }}>
              ¿Quieres iniciar tu tratamiento?
            </p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              Un médico revisará tu caso y definirá si corresponde tratamiento.
              Si es apto, coordinamos receta, farmacia y despacho a domicilio.
            </p>
          </div>
          <Link
            href={membershipUrl}
            className="block w-full rounded-2xl py-5 text-lg font-bold text-white text-center transition-opacity hover:opacity-90 shadow-md"
            style={{ backgroundColor: GOLD }}
          >
            Iniciar mi tratamiento →
          </Link>
          <p className="text-[10px]" style={{ color: MUTED }}>
            El tratamiento solo se activa si el médico lo indica. Sin diagnóstico ni garantías implícitas.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────

function ResultsInner() {
  const searchParams = useSearchParams();
  const intakeId = searchParams.get("intake_id");
  const journey  = searchParams.get("journey");

  const [secondsLeft, setSecondsLeft] = useState(30);
  const [result, setResult] = useState<{
    report: HairMapReport;
    frontalUrl: string | null;
    crownUrl: string | null;
    patientName: string;
    intake: IntakeSnapshot | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Countdown
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [result]);

  // Fetch
  useEffect(() => {
    if (!intakeId || fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("/api/ai/patient-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake_id: intakeId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{
          report: HairMapReport;
          frontalUrl: string | null;
          crownUrl: string | null;
          patientName: string;
          intake: IntakeSnapshot | null;
          isFallback: boolean;
        }>;
      })
      .then((data) => {
        setResult({
          report:      data.report,
          frontalUrl:  data.frontalUrl,
          crownUrl:    data.crownUrl,
          patientName: data.patientName,
          intake:      data.intake,
        });
      })
      .catch((err: unknown) => {
        console.error("[results] fetch error:", err);
        setError("No pudimos generar tu reporte. Por favor intenta nuevamente.");
      });
  }, [intakeId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-gray-900 font-semibold">Ocurrió un problema</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Link
            href="/quiz"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: GOLD }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!result) return <LoadingScreen secondsLeft={secondsLeft} />;

  return (
    <ReportScreen
      report={result.report}
      frontalUrl={result.frontalUrl}
      crownUrl={result.crownUrl}
      patientName={result.patientName}
      intake={result.intake}
      journey={journey}
    />
  );
}

// ─── Page export ──────────────────────────────────────────────────

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingScreen secondsLeft={30} />}>
      <ResultsInner />
    </Suspense>
  );
}
