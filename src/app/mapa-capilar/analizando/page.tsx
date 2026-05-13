"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

const MESSAGES = [
  "Analizando línea frontal...",
  "Evaluando densidad capilar...",
  "Revisando coronilla...",
  "Cruzando respuestas iniciales...",
  "Generando tu Mapa Capilar...",
];

export default function AnalizandoPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(30);
  const [msgIndex, setMsgIndex] = useState(0);
  const called = useRef(false);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1_000);

    const msgRotation = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 5_500);

    if (!called.current) {
      called.current = true;

      void (async () => {
        const rawAnswers = sessionStorage.getItem("mapa_capilar_answers");
        if (!rawAnswers) {
          router.replace("/mapa-capilar");
          return;
        }

        const answers = JSON.parse(rawAnswers) as Record<string, string>;
        const photoFrontal = sessionStorage.getItem("mapa_capilar_photo_frontal") ?? undefined;
        const photoCrown = sessionStorage.getItem("mapa_capilar_photo_crown") ?? undefined;

        const minWait = new Promise<void>((resolve) => setTimeout(resolve, 30_000));

        let analysisId: string | null = null;
        let report: HairMapAnalysisReport | undefined;

        const apiCall = fetch("/api/mapa-capilar/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: {
              concern: answers.concern ?? "",
              duration: answers.duration ?? "",
              previousTreatment: answers.previousTreatment ?? "",
              familyHistory: answers.familyHistory ?? "",
              goal: answers.goal ?? "",
            },
            photoFrontal,
            photoCrown,
          }),
        })
          .then((r) => r.json())
          .then((data: { id?: string | null; accessToken?: string | null; report?: HairMapAnalysisReport }) => {
            analysisId = data.id ?? null;
            report = data.report;
            if (data.accessToken) {
              try {
                sessionStorage.setItem("mapa_capilar_access_token", data.accessToken);
              } catch { /* ignore */ }
            }
          })
          .catch(() => {
            // Network error — will use fallback via sessionStorage on reporte page
          });

        await Promise.all([apiCall, minWait]);

        // Store report and ID for reporte page
        if (report) {
          try {
            sessionStorage.setItem("mapa_capilar_report", JSON.stringify(report));
          } catch { /* ignore */ }
        }
        if (analysisId) {
          try {
            sessionStorage.setItem("mapa_capilar_analysis_id", analysisId);
          } catch { /* ignore */ }
        }

        const dest = analysisId
          ? `/mapa-capilar/reporte/${analysisId}`
          : "/mapa-capilar/reporte";
        router.push(dest);
      })();
    }

    return () => {
      clearInterval(countdown);
      clearInterval(msgRotation);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elapsed = 30 - timeLeft;
  const pct = Math.round((elapsed / 30) * 100);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center">
          <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-5 py-10 text-center gap-8">
        {/* Circular progress */}
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="#f3f4f6" strokeWidth="6" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 48}`}
              strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{timeLeft}s</span>
            <span className="text-xs text-gray-400">analizando</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Generando tu Mapa Capilar AI</h1>
          <p className="text-primary font-medium text-sm">{MESSAGES[msgIndex]}</p>
        </div>

        {/* Step checklist */}
        <div className="w-full space-y-3 text-left">
          {MESSAGES.map((msg, i) => {
            const done = msgIndex > i;
            const active = msgIndex === i;
            return (
              <div key={msg} className="flex items-center gap-3 text-sm">
                <div
                  className={[
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                    done
                      ? "bg-primary"
                      : active
                      ? "border-2 border-primary bg-primary/10"
                      : "bg-gray-100",
                  ].join(" ")}
                >
                  {done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={done || active ? "text-gray-800" : "text-gray-400"}>{msg}</span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
          Este análisis es visual y orientativo. No constituye diagnóstico médico.
        </p>
      </div>
    </div>
  );
}
