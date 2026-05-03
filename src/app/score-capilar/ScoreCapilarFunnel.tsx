"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { computeResult, type ScoreCapilarAnswers, type ScoreCapilarResult } from "@/lib/scoreCapilar";
import { generateFallbackReport, type UserScoreReport } from "@/lib/userScoreReport";
import MiniQuiz from "./components/MiniQuiz";
import ContactForm, { type ContactData } from "./components/ContactForm";
import PhotoUpload, { type PhotoData } from "./components/PhotoUpload";
import ResultsView from "./components/ResultsView";

type Step = "hero" | "quiz" | "contact" | "photos" | "submitting" | "results";

const STEP_PROGRESS: Record<Step, number> = {
  hero: 0,
  quiz: 30,
  contact: 60,
  photos: 80,
  submitting: 95,
  results: 100,
};

function trackEvent(name: string, props?: Record<string, unknown>) {
  // TODO: Replace with real analytics (e.g. Segment, Posthog, GA4)
  console.log(`[nilo:event] ${name}`, props ?? {});
}

export default function ScoreCapilarFunnel() {
  const [step, setStep] = useState<Step>("hero");
  const [answers, setAnswers] = useState<ScoreCapilarAnswers | null>(null);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [result, setResult] = useState<ScoreCapilarResult | null>(null);
  const [aiReport, setAiReport] = useState<UserScoreReport | null>(null);
  const [isFallbackReport, setIsFallbackReport] = useState(false);

  function goTo(next: Step) {
    window.scrollTo({ top: 0, behavior: "instant" });
    setStep(next);
  }

  async function handlePhotosComplete(photos: PhotoData) {
    if (!answers || !contactData) return;

    const computed = computeResult(answers);
    setResult(computed);
    goTo("submitting");

    trackEvent("user_score_report_generation_started", { score: computed.score, ruta: computed.ruta });

    // Non-blocking: save lead and upload photos. Results always show regardless of DB/upload outcome.
    // TODO: Run the SQL migration to create score_capilar_leads before going live.
    //   CREATE TABLE score_capilar_leads (
    //     id uuid primary key default gen_random_uuid(),
    //     nombre text, whatsapp text, email text,
    //     q_edad text, q_zona text, q_tiempo text, q_avance text,
    //     q_previo text, q_busca text, q_disposicion text,
    //     score integer, prioridad text, ruta text, edad_capilar integer,
    //     photo_frontal_url text, photo_top_url text,
    //     created_at timestamptz default now()
    //   );

    let frontalUrl: string | null = null;
    let topUrl: string | null = null;
    let leadId: string | null = null;

    try {
      const supabase = createClient();
      const ts = Date.now();

      if (photos.frontal) {
        const path = `score-capilar/${ts}_frontal`;
        const { error } = await supabase.storage
          .from("patient-photos")
          .upload(path, photos.frontal);
        if (!error) {
          frontalUrl = supabase.storage.from("patient-photos").getPublicUrl(path).data.publicUrl;
        }
      }

      if (photos.top) {
        const path = `score-capilar/${ts + 1}_top`;
        const { error } = await supabase.storage
          .from("patient-photos")
          .upload(path, photos.top);
        if (!error) {
          topUrl = supabase.storage.from("patient-photos").getPublicUrl(path).data.publicUrl;
        }
      }

      const { data: insertedLead } = await supabase
        .from("score_capilar_leads")
        .insert({
          nombre: contactData.nombre,
          whatsapp: contactData.whatsapp,
          email: contactData.email,
          q_edad: answers.edad,
          q_zona: answers.zona,
          q_tiempo: answers.tiempo,
          q_avance: answers.avance,
          q_previo: answers.previo,
          q_busca: answers.busca,
          q_disposicion: answers.disposicion,
          score: computed.score,
          prioridad: computed.prioridad,
          ruta: computed.ruta,
          edad_capilar: computed.edadCapilar,
          photo_frontal_url: frontalUrl,
          photo_top_url: topUrl,
        })
        .select("id")
        .single();

      leadId = insertedLead?.id ?? null;
    } catch {
      // Never block the user from seeing their result.
    }

    // Generate AI report — falls back gracefully on any error
    try {
      const photosUploaded = [photos.frontal, photos.top].filter(Boolean).length;
      const res = await fetch("/api/ai/user-score-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          score: computed.score,
          prioridad: computed.prioridad,
          edadCapilar: computed.edadCapilar,
          ruta: computed.ruta,
          photosUploaded,
          photoFrontalUrl: frontalUrl,
          photoTopUrl: topUrl,
          leadId,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { report: UserScoreReport; isFallback: boolean };
        setAiReport(data.report);
        setIsFallbackReport(data.isFallback);
        trackEvent("user_score_report_generated", {
          score: computed.score,
          isFallback: data.isFallback,
        });
      } else {
        throw new Error(`API responded ${res.status}`);
      }
    } catch (err) {
      console.error("[score-capilar] AI report failed, using fallback:", err);
      const fallback = generateFallbackReport({
        answers,
        score: computed.score,
        prioridad: computed.prioridad,
        edadCapilar: computed.edadCapilar,
        ruta: computed.ruta,
      });
      setAiReport(fallback);
      setIsFallbackReport(true);
      trackEvent("user_score_report_failed", { score: computed.score });
    }

    goTo("results");
    trackEvent("user_score_report_viewed", { score: computed.score });
  }

  const showProgress = step !== "hero" && step !== "results";

  return (
    <div className="min-h-screen flex flex-col">
      {showProgress && (
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="mx-auto max-w-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="text-sm font-semibold text-primary">
                Nilo
              </Link>
              <span className="text-xs text-muted-foreground">Score Capilar</span>
            </div>
            <Progress value={STEP_PROGRESS[step]} className="h-1.5" />
          </div>
        </div>
      )}

      {step === "hero" && <HeroSection onStart={() => goTo("quiz")} />}

      {step === "quiz" && (
        <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
          <MiniQuiz
            onComplete={(a) => {
              setAnswers(a);
              goTo("contact");
            }}
          />
        </div>
      )}

      {step === "contact" && (
        <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
          <ContactForm
            onComplete={(c) => {
              setContactData(c);
              goTo("photos");
            }}
            onBack={() => goTo("quiz")}
          />
        </div>
      )}

      {step === "photos" && (
        <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
          <PhotoUpload onComplete={handlePhotosComplete} onBack={() => goTo("contact")} />
        </div>
      )}

      {step === "submitting" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold">Estamos preparando tu Mapa Capilar...</h2>
            <p className="text-muted-foreground text-sm mt-2">Un momento, estamos analizando tus respuestas.</p>
          </div>
        </div>
      )}

      {step === "results" && result && answers && (
        <ResultsView
          result={result}
          zona={answers.zona}
          aiReport={aiReport}
          isFallback={isFallbackReport}
          onMedicalCtaClick={() =>
            trackEvent("user_score_report_medical_cta_clicked", { score: result.score })
          }
        />
      )}
    </div>
  );
}

function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex-1">
      <section className="bg-hero-mobile-bg text-white">
        <div className="mx-auto max-w-lg px-4 pb-12 pt-8 sm:px-6">
          <Link href="/" className="block font-semibold text-xl tracking-tight text-white mb-8">
            Nilo
          </Link>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            Orientación preliminar y educativa
          </p>
          <h1 className="mx-auto mt-4 max-w-sm text-center text-4xl font-bold leading-tight tracking-tight text-white sm:max-w-none sm:text-5xl">
            Descubre tu <span className="text-hero-mobile-accent">Score Capilar</span> gratis
          </h1>
          <p className="mx-auto mt-5 max-w-md text-center text-[16px] leading-snug text-white/85">
            Responde unas preguntas simples, sube 2 fotos y recibe una orientación
            preliminar para entender tu ruta capilar.
          </p>
          <div className="mx-auto mt-8 w-full max-w-sm">
            <Button
              onClick={onStart}
              className="h-14 w-full rounded-full border-0 bg-white px-8 text-base font-semibold text-hero-mobile-bg shadow-sm hover:bg-white/95"
            >
              Hacer mi Score Gratis
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-white/55">
            Resultado preliminar y educativo. No constituye diagnóstico médico ni indicación de
            tratamiento.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="mx-auto max-w-lg px-4">
          <div className="space-y-4">
            {[
              { n: "1", label: "Responde 7 preguntas simples" },
              { n: "2", label: "Deja tus datos de contacto" },
              { n: "3", label: "Sube 2 fotos de tu cabello" },
              { n: "4", label: "Recibe tu Score y ruta preliminar" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {s.n}
                </div>
                <p className="text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <Button onClick={onStart} className="w-full mt-8 rounded-full h-12">
            Comenzar ahora
          </Button>
        </div>
      </section>
    </main>
  );
}
