"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";
import type { ScoreCapilarResult } from "@/lib/scoreCapilar";
import type { UserScoreReport } from "@/lib/userScoreReport";

const PRIORITY_CONFIG: Record<string, { cls: string }> = {
  "Muy buen punto de partida":          { cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Buen punto de partida":              { cls: "text-teal-700 bg-teal-50 border-teal-200" },
  "Conviene monitorear":                { cls: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  "Conviene revisar con médico":        { cls: "text-orange-700 bg-orange-50 border-orange-200" },
  "Revisión prioritaria recomendada":   { cls: "text-red-700 bg-red-50 border-red-200" },
};

export default function ResultsView({
  result,
  zona,
  aiReport,
  isFallback,
  onMedicalCtaClick,
}: {
  result: ScoreCapilarResult;
  zona: string;
  aiReport: UserScoreReport | null;
  isFallback: boolean;
  onMedicalCtaClick?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const priority = PRIORITY_CONFIG[result.prioridad] ?? { cls: "text-muted-foreground bg-muted border-border" };

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : "https://nilo.cl/score-capilar";
    const text = `Me hice el Score Capilar de Nilo. Es una orientación preliminar para entender tu ruta capilar. Hazlo gratis aquí: ${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const errores = aiReport?.common_mistakes ?? [
    "Esperar demasiado antes de evaluar",
    "Copiar rutinas de internet o de otra persona",
    "No hacer seguimiento con fotos comparables",
  ];

  const pasos = aiReport?.next_steps ?? null;

  const disclaimer =
    aiReport?.disclaimer ??
    "Este resultado es preliminar y educativo. No constituye diagnóstico médico ni indicación de tratamiento. La recomendación final depende de una revisión profesional.";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 py-6">
        <div className="mx-auto max-w-xl">
          <Link
            href="/"
            className="text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors"
          >
            ← Nilo
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-primary-foreground leading-snug">
            Tu Mapa Capilar Nilo
          </h1>
          <p className="mt-1 text-xs text-primary-foreground/70">
            Una orientación preliminar para entender tu ruta capilar. No constituye diagnóstico médico.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
        {/* Score card */}
        <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Score Capilar
          </p>
          <div className="text-7xl font-bold text-primary leading-none mb-3">
            {result.score}
            <span className="text-3xl font-normal text-muted-foreground">/100</span>
          </div>
          <span
            className={cn(
              "inline-block text-sm font-semibold px-3 py-1 rounded-full border",
              priority.cls
            )}
          >
            {result.prioridad}
          </span>
          <p className="text-xs text-muted-foreground mt-3">
            Mientras más alto el score, más favorable es tu perfil capilar preliminar.
          </p>
        </div>

        {/* Edad capilar */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Edad capilar aparente
          </p>
          <p className="text-3xl font-bold text-foreground">
            {result.edadCapilar}{" "}
            <span className="text-lg font-normal text-muted-foreground">años</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            estimación preliminar basada en tus respuestas
          </p>
        </div>

        {/* Ruta preliminar */}
        <div className="rounded-2xl border border-primary/25 bg-accent/40 p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-1">
            Ruta preliminar
          </p>
          <p className="text-lg font-bold text-foreground">{result.ruta}</p>
          {aiReport?.preliminary_route_explanation && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {aiReport.preliminary_route_explanation}
            </p>
          )}
          {!aiReport?.preliminary_route_explanation && (
            <p className="text-xs text-muted-foreground mt-1">
              La recomendación final depende de una revisión profesional.
            </p>
          )}
        </div>

        {/* AI friendly summary */}
        {aiReport?.friendly_summary && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Tu situación capilar
            </p>
            <p className="text-sm text-foreground leading-relaxed">{aiReport.friendly_summary}</p>
          </div>
        )}

        {/* Bridge sentence */}
        <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 text-center">
          <p className="text-sm font-medium text-primary/80 italic">
            "Tu Score te orienta. Tu Mapa Capilar te explica. La revisión médica confirma tu ruta."
          </p>
        </div>

        {/* Score explanation */}
        {aiReport?.score_explanation && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Qué significa tu score
            </p>
            <p className="text-sm text-foreground leading-relaxed">{aiReport.score_explanation}</p>
          </div>
        )}

        {/* Zona principal (shown only if no AI summary — AI puts it inline) */}
        {!aiReport && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Zona principal de preocupación
            </p>
            <p className="text-lg font-semibold text-foreground">{zona}</p>
          </div>
        )}

        {/* Errores comunes */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Errores comunes según tu perfil
          </p>
          <div className="space-y-3">
            {errores.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">{e}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos pasos */}
        {pasos && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Próximos pasos
            </p>
            <div className="space-y-3">
              {pasos.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA block */}
        <div className="rounded-2xl border border-primary/30 bg-white p-6 shadow-sm space-y-3">
          <p className="text-base font-bold text-foreground">
            {aiReport?.cta_title ?? "Confirma tu ruta con revisión médica"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {aiReport?.cta_body ??
              "Tu Score te orienta. La revisión médica permite que un profesional revise tus antecedentes y fotos con más detalle."}
          </p>
          {/* div captures click for analytics before Link navigates */}
          <div onClick={onMedicalCtaClick}>
            <LinkButton href="/quiz" className="w-full rounded-full h-12 text-base">
              {aiReport?.cta_button ?? "Completar evaluación médica"}
            </LinkButton>
          </div>
        </div>

        {/* Share */}
        <Button
          variant="outline"
          onClick={handleShare}
          className="w-full rounded-full h-12 text-base"
        >
          {copied ? "¡Enlace copiado!" : "Compartir mi Score"}
        </Button>

        {/* Disclaimer */}
        <div className="rounded-2xl bg-muted/50 p-4 pb-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="font-semibold text-foreground">Aviso:</strong>{" "}
            {disclaimer}
          </p>
          {isFallback && (
            <p className="text-xs text-muted-foreground mt-2">
              No pudimos generar el reporte personalizado en este momento, pero tu Score Capilar está listo.
            </p>
          )}
        </div>

        <div className="pb-10" />
      </div>
    </div>
  );
}
