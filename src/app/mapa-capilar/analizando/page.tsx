"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MapaCapilarReport } from "@/lib/mapaCapilar";

const MESSAGES = [
  "Analizando foto...",
  "Evaluando zonas de densidad...",
  "Revisando línea frontal...",
  "Construyendo reporte visual...",
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
    }, 6_500);

    if (!called.current) {
      called.current = true;

      void (async () => {
        const rawAnswers = sessionStorage.getItem("mapa_capilar_answers");
        if (!rawAnswers) {
          router.replace("/mapa-capilar");
          return;
        }

        const answers = JSON.parse(rawAnswers) as Record<string, string>;
        const photosRaw = sessionStorage.getItem("mapa_capilar_photos");
        let photosRecord: Record<string, string> | undefined;
        if (photosRaw) {
          try {
            photosRecord = JSON.parse(photosRaw) as Record<string, string>;
          } catch {
            photosRecord = undefined;
          }
        }
        const legacyPhoto = sessionStorage.getItem("mapa_capilar_photo");

        const minWait = new Promise<void>((resolve) => setTimeout(resolve, 30_000));

        let report: MapaCapilarReport | undefined;

        const apiCall = fetch("/api/mapa-capilar/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concern: answers.concern ?? "",
            duration: answers.duration ?? "",
            previousTreatment: answers.previousTreatment ?? "",
            familyHistory: answers.familyHistory ?? "",
            goal: answers.goal ?? "",
            photoBase64: legacyPhoto ?? undefined,
            photos: photosRecord,
          }),
        })
          .then((r) => r.json())
          .then((data: { report?: MapaCapilarReport }) => {
            report = data.report;
          })
          .catch(() => {
            // API call failed — fallback will be generated server-side
          });

        await Promise.all([apiCall, minWait]);

        if (report) {
          try {
            sessionStorage.setItem("mapa_capilar_report", JSON.stringify(report));
          } catch {
            // sessionStorage write failed — reporte page will handle missing report gracefully
          }
        }

        router.push("/mapa-capilar/reporte");
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
          <span className="text-lg font-semibold tracking-tight text-gray-900">Nilo</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-5 py-10 text-center gap-8">
        {/* Circular progress */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="6"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{timeLeft}s</span>
          </div>
        </div>

        {/* Title + current message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Estamos generando tu Mapa Capilar AI
          </h1>
          <p className="text-primary font-medium text-sm min-h-[20px]">{MESSAGES[msgIndex]}</p>
        </div>

        {/* Step list */}
        <div className="w-full space-y-3 text-left">
          {MESSAGES.map((msg, i) => {
            const done = msgIndex > i;
            const active = msgIndex === i;
            return (
              <div key={msg} className="flex items-center gap-3 text-sm">
                <div
                  className={[
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500",
                    done
                      ? "bg-primary"
                      : active
                      ? "border-2 border-primary bg-primary/10"
                      : "bg-gray-100",
                  ].join(" ")}
                >
                  {done && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 12 12"
                    >
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
                <span className={done || active ? "text-gray-800" : "text-gray-400"}>
                  {msg}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Este análisis es orientativo y no reemplaza una evaluación médica.
        </p>
      </div>
    </div>
  );
}
