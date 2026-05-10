"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Field } from "@/lib/mapaCapilar";

interface Question {
  field: Field;
  question: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    field: "concern",
    question: "¿Qué te preocupa más hoy?",
    options: [
      "Entradas",
      "Coronilla",
      "Pérdida general de densidad",
      "Caída excesiva",
      "Estoy evaluando trasplante",
      "No estoy seguro",
    ],
  },
  {
    field: "duration",
    question: "¿Hace cuánto notas cambios en tu pelo?",
    options: [
      "Menos de 3 meses",
      "3 a 6 meses",
      "6 a 12 meses",
      "Más de 1 año",
      "Más de 3 años",
    ],
  },
  {
    field: "previousTreatment",
    question: "¿Has usado algún tratamiento capilar antes?",
    options: [
      "No",
      "Sí, shampoo o productos cosméticos",
      "Sí, minoxidil",
      "Sí, finasteride/dutasteride",
      "Sí, otro tratamiento",
      "No estoy seguro",
    ],
  },
  {
    field: "familyHistory",
    question: "¿Alguien en tu familia tiene pérdida de pelo?",
    options: ["Padre", "Madre", "Hermanos", "Abuelos", "No", "No estoy seguro"],
  },
  {
    field: "goal",
    question: "¿Qué estás buscando ahora?",
    options: [
      "Entender mi situación capilar",
      "Minimizar la caída",
      "Evaluar tratamiento médico",
      "Evaluar trasplante capilar",
      "Comparar opciones",
    ],
  },
];

type Answers = Partial<Record<Field, string>>;
type Step = "hero" | number | "photo";

const STEP_ORDER: Step[] = ["hero", 0, 1, 2, 3, 4, "photo"];

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function MapaCapilarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("hero");
  const [answers, setAnswers] = useState<Answers>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress =
    step === "hero" ? 0 : Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);

  const goTo = useCallback((next: Step) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setStep(next);
  }, []);

  const handleAnswer = useCallback(
    (field: Field, value: string) => {
      setAnswers((prev) => ({ ...prev, [field]: value }));
      const idx = STEP_ORDER.indexOf(step);
      const next = STEP_ORDER[idx + 1];
      if (next !== undefined) {
        setTimeout(() => goTo(next), 160);
      }
    },
    [step, goTo]
  );

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) goTo(STEP_ORDER[idx - 1]);
  }, [step, goTo]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(false);
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!photoFile) {
      setPhotoError(true);
      return;
    }
    setSubmitting(true);
    try {
      const photoBase64 = await compressImage(photoFile);
      sessionStorage.setItem("mapa_capilar_answers", JSON.stringify(answers));
      try {
        sessionStorage.setItem("mapa_capilar_photo", photoBase64);
      } catch {
        // Photo too large for sessionStorage — proceed without it
      }
    } catch {
      sessionStorage.setItem("mapa_capilar_answers", JSON.stringify(answers));
    }
    router.push("/mapa-capilar/analizando");
  }, [photoFile, answers, router]);

  const questionIndex = typeof step === "number" ? step : -1;
  const currentQuestion = questionIndex >= 0 ? QUESTIONS[questionIndex] : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-gray-900">Nilo</span>
          {step !== "hero" && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {step !== "hero" && (
        <div className="w-full h-1 bg-gray-100">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <main className="max-w-md mx-auto px-5 py-10">
        {/* HERO */}
        {step === "hero" && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
              Mapa Capilar AI
            </div>

            <h1 className="text-[2rem] font-bold leading-tight text-gray-900">
              Visualiza tu situación capilar en menos de 2 minutos.
            </h1>

            <p className="text-gray-500 text-base leading-relaxed">
              Responde 5 preguntas, sube una foto de tu pelo y recibe un mapa visual
              orientativo de densidad, línea frontal y zonas a observar.
            </p>

            <button
              onClick={() => goTo(0)}
              className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base hover:bg-primary/90 active:scale-[.98] transition-all"
            >
              Crear mi mapa capilar
            </button>

            <p className="text-xs text-gray-400">
              Este análisis es orientativo y no constituye diagnóstico médico.
            </p>

            {/* How it works */}
            <div className="w-full bg-gray-50 rounded-2xl p-6 text-left space-y-4 mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Cómo funciona
              </p>
              {[
                ["1", "Responde 5 preguntas sobre tu situación capilar"],
                ["2", "Sube una foto de tu pelo con buena luz"],
                ["3", "Recibe tu Mapa Capilar AI orientativo en segundos"],
              ].map(([num, text]) => (
                <div key={num} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {num}
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {currentQuestion && (
          <div className="flex flex-col gap-6">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Pregunta {questionIndex + 1} de 5
              </p>
              <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.field] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(currentQuestion.field, option)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all duration-150 active:scale-[.98]",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PHOTO UPLOAD */}
        {step === "photo" && (
          <div className="flex flex-col gap-6">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Último paso
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                Sube una foto clara de tu pelo
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Idealmente con buena luz, mostrando la zona que más te preocupa: entradas,
                parte superior o coronilla.
              </p>
            </div>

            {/* Upload zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden",
                photoPreview
                  ? "border-primary aspect-[4/3]"
                  : photoError
                  ? "border-red-400 bg-red-50 aspect-[4/3]"
                  : "border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5 aspect-[4/3]"
              )}
            >
              {photoPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Vista previa de tu foto"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="bg-white rounded-full p-2.5 shadow-md">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                  <Upload
                    className={cn("w-8 h-8", photoError ? "text-red-400" : "text-gray-400")}
                  />
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        photoError ? "text-red-600" : "text-gray-600"
                      )}
                    >
                      {photoError ? "La foto es obligatoria para continuar" : "Toca para subir foto"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP</p>
                  </div>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {photoPreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-gray-500 underline underline-offset-2 text-center -mt-2"
              >
                Cambiar foto
              </button>
            )}

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                Tips para mejor resultado
              </p>
              <ul className="text-xs text-gray-600 space-y-1.5">
                {[
                  "Buena luz natural o artificial",
                  "Pelo seco, sin gel ni gorro",
                  "Mostrar claramente la zona afectada",
                  "Cámara estable, sin movimiento",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 font-bold">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Preparando análisis..." : "Generar mi mapa"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
