"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import HairReportNew from "@/components/mapa-capilar/HairReportNew";
import type { HairMapReport } from "@/lib/types";

const GOLD = "#c9a84c";

// ─── Loading screen ───────────────────────────────────────────────

function LoadingScreen({ secondsLeft }: { secondsLeft: number }) {
  const pct = Math.round(((30 - secondsLeft) / 30) * 100);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
            style={{ color: GOLD }}
          >
            Perfecto · Análisis capilar
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Preparando tu reporte
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Estamos analizando tus fotos y respuestas para generar tu evaluación
            personalizada.
          </p>
        </div>

        {/* Progress bar */}
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

        {/* Steps */}
        <div className="space-y-3 text-left">
          {[
            { label: "Evaluando patrón de caída", done: secondsLeft < 22 },
            { label: "Analizando densidad por zona", done: secondsLeft < 14 },
            { label: "Calculando etapa Norwood", done: secondsLeft < 7 },
            { label: "Generando mapa capilar", done: secondsLeft <= 0 },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500"
                style={{
                  backgroundColor: done ? GOLD : "#f3f4f6",
                }}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className="text-sm transition-colors duration-500"
                style={{ color: done ? "#1a1a1a" : "#9ca3af" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
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
}: {
  report: HairMapReport;
  frontalUrl: string | null;
  crownUrl: string | null;
  patientName: string;
  journey: string | null;
}) {
  const membershipUrl = journey
    ? `/membership?plan=inicio&journey=${journey}`
    : "/membership?plan=inicio";

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center">
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Perfecto
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-5 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full"
            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          >
            Tu evaluación capilar está lista
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tu Mapa Capilar
          </h1>
          <p className="text-sm text-gray-500">
            Análisis personalizado basado en tus fotos y respuestas.
          </p>
        </div>

        <HairReportNew
          report={report}
          frontalImageUrl={frontalUrl}
          coronillaImageUrl={crownUrl}
          patientName={patientName || undefined}
        />

        {/* CTA */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center space-y-4">
          <div>
            <p className="text-base font-bold text-gray-900">
              ¿Quieres iniciar tu tratamiento?
            </p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Un médico revisará tu caso y definirá si corresponde tratamiento.
              Si es apto, coordinamos receta, farmacia y despacho a domicilio.
            </p>
          </div>
          <Link
            href={membershipUrl}
            className="block w-full rounded-2xl py-4 text-base font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: GOLD }}
          >
            Iniciar mi tratamiento
          </Link>
          <p className="text-xs text-gray-400">
            El tratamiento solo se activa si el médico lo indica. Sin diagnóstico
            ni garantías implícitas.
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
  const journey = searchParams.get("journey");

  const [secondsLeft, setSecondsLeft] = useState(30);
  const [result, setResult] = useState<{
    report: HairMapReport;
    frontalUrl: string | null;
    crownUrl: string | null;
    patientName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchedRef = useRef(false);

  // Countdown
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [result]);

  // Fetch report
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
          isFallback: boolean;
        }>;
      })
      .then((data) => {
        setResult({
          report: data.report,
          frontalUrl: data.frontalUrl,
          crownUrl: data.crownUrl,
          patientName: data.patientName,
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

  if (!result) {
    return <LoadingScreen secondsLeft={secondsLeft} />;
  }

  return (
    <ReportScreen
      report={result.report}
      frontalUrl={result.frontalUrl}
      crownUrl={result.crownUrl}
      patientName={result.patientName}
      journey={journey}
    />
  );
}

// ─── Page export ──────────────────────────────────────────────────

export default function ResultsPage() {
  return (
    <Suspense
      fallback={<LoadingScreen secondsLeft={30} />}
    >
      <ResultsInner />
    </Suspense>
  );
}
