"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapaCapilarAnswers } from "@/lib/mapaCapilar";

/** Una sola pregunta (alineada al quiz): el resto de campos del JSON van fijos para la API. */
function answersFromRouteChoice(route: "treatment" | "transplant"): MapaCapilarAnswers {
  if (route === "transplant") {
    return {
      concern: "Evaluación de trasplante",
      duration: "No especificado",
      previousTreatment: "No especificado",
      familyHistory: "No especificado",
      goal: "Evaluar trasplante",
    };
  }
  return {
    concern: "Frenar caída del pelo",
    duration: "No especificado",
    previousTreatment: "No especificado",
    familyHistory: "No especificado",
    goal: "Frenar la caída",
  };
}

const ROUTE_OPTIONS: {
  value: "treatment" | "transplant";
  title: string;
  desc: string;
}[] = [
  {
    value: "treatment",
    title: "Frenar la caída",
    desc: "Aún tengo pelo y quiero cuidarlo. Quiero entender si corresponde tratamiento médico.",
  },
  {
    value: "transplant",
    title: "Evaluar trasplante",
    desc: "Ya perdí densidad o estoy considerando una recuperación capilar y quiero saber si tiene sentido avanzar.",
  },
];

type Step = "hero" | number | "photo";

const STEP_ORDER: Step[] = ["hero", 0, "photo"];

const PHOTO_SLOTS = [
  {
    id: "frontal",
    label: "Frontal / lateral",
    hint: "Elegí una foto desde tu galería",
    required: true,
  },
  {
    id: "coronilla",
    label: "Coronilla",
    hint: "Elegí una foto desde tu galería",
    required: true,
  },
] as const;

type PhotoSlotId = (typeof PHOTO_SLOTS)[number]["id"];

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
  const [answers, setAnswers] = useState<MapaCapilarAnswers | null>(null);
  const [slotPhotos, setSlotPhotos] = useState<Partial<Record<PhotoSlotId, File>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress =
    step === "hero" ? 0 : Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);

  const goTo = useCallback((next: Step) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setStep(next);
  }, []);

  const handleRouteChoice = useCallback(
    (route: "treatment" | "transplant") => {
      setAnswers(answersFromRouteChoice(route));
      setTimeout(() => goTo("photo"), 160);
    },
    [goTo]
  );

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) goTo(STEP_ORDER[idx - 1]);
  }, [step, goTo]);

  const setSlotFile = useCallback((slot: PhotoSlotId, file: File | null) => {
    setPhotoError(false);
    setSlotPhotos((prev) => {
      if (!file) {
        const next = { ...prev };
        delete next[slot];
        return next;
      }
      return { ...prev, [slot]: file };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!slotPhotos.frontal || !slotPhotos.coronilla) {
      setPhotoError(true);
      return;
    }
    setSubmitting(true);
    const payload = answers ?? answersFromRouteChoice("treatment");
    sessionStorage.setItem("mapa_capilar_answers", JSON.stringify(payload));
    try {
      const frontalB64 = await compressImage(slotPhotos.frontal);
      const crownB64 = await compressImage(slotPhotos.coronilla);
      sessionStorage.setItem("mapa_capilar_photo_frontal", frontalB64);
      sessionStorage.setItem("mapa_capilar_photo_crown", crownB64);
    } catch {
      try {
        sessionStorage.removeItem("mapa_capilar_photo_frontal");
        sessionStorage.removeItem("mapa_capilar_photo_crown");
      } catch {
        /* ignore */
      }
    }
    router.push("/mapa-capilar/analizando");
  }, [slotPhotos, answers, router]);

  const questionIndex = typeof step === "number" ? step : -1;
  const showRouteQuestion = questionIndex === 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-gray-900">Perfecto</span>
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

      {step !== "hero" && (
        <div className="w-full h-1 bg-gray-100">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <main className="max-w-md mx-auto px-5 py-10">
        {step === "hero" && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
              Mapa Capilar AI
            </div>

            <h1 className="text-[2rem] font-bold leading-tight text-gray-900">
              Visualiza tu situación capilar en menos de 2 minutos.
            </h1>

            <p className="text-gray-500 text-base leading-relaxed">
              Responde una pregunta, sube 2 fotos desde tu galería (frontal y coronilla) y recibe un
              reporte visual orientativo con densidad, línea frontal y zonas a observar.
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

            <div className="w-full bg-gray-50 rounded-2xl p-6 text-left space-y-4 mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Cómo funciona
              </p>
              {[
                ["1", "Indica qué quieres resolver (frenar caída o evaluar trasplante)"],
                ["2", "Sube 2 fotos desde tu galería: frontal y coronilla"],
                ["3", "Recibe tu reporte visual orientativo personalizado"],
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

        {showRouteQuestion && (
          <div className="flex flex-col gap-6">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Pregunta 1 de 1
              </p>
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">¿Qué quieres resolver?</h1>
              <p className="text-sm text-gray-500">
                Elige la opción que mejor describe tu situación.
              </p>
            </div>

            <div className="space-y-3">
              {ROUTE_OPTIONS.map((route) => {
                return (
                  <button
                    key={route.value}
                    type="button"
                    onClick={() => handleRouteChoice(route.value)}
                    className={cn(
                      "w-full text-left border-2 rounded-2xl p-5 transition-all active:scale-[.98]",
                      "border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50/80"
                    )}
                  >
                    <p className="font-semibold text-base text-gray-900">{route.title}</p>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{route.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "photo" && (
          <div className="flex flex-col gap-6">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Siguiente paso
              </p>
              <h2 className="text-2xl font-bold text-gray-900">Sube 2 fotos de tu pelo</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Elegí imágenes desde la galería de tu dispositivo (no uses la cámara en vivo). Necesitamos
                una foto frontal y una de coronilla; ambas son obligatorias.
              </p>
            </div>

            <div className="bg-primary/10 rounded-xl p-3 text-xs text-primary/90 space-y-0.5 border border-primary/15">
              <p className="font-semibold text-primary mb-1">Instrucciones:</p>
              <p>• Buena luz natural o artificial</p>
              <p>• Pelo seco, sin gel ni gorro</p>
              <p>• Foto estable y nítida</p>
              <p>• Mostrar claramente la zona afectada</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PHOTO_SLOTS.map((slot) => {
                const file = slotPhotos[slot.id] ?? null;
                const missing = photoError && !file;
                return (
                  <label
                    key={slot.id}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[130px]",
                      file
                        ? "border-primary bg-primary/5"
                        : missing
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-primary/40 bg-white"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        setSlotFile(slot.id, f);
                      }}
                    />
                    {file ? (
                      <>
                        <span className="text-2xl text-primary">✓</span>
                        <p className="text-xs font-semibold mt-1 text-primary">{slot.label}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[110px]">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl text-gray-400" aria-hidden>
                          🖼
                        </span>
                        <p
                          className={cn(
                            "text-xs font-semibold mt-1",
                            missing ? "text-red-600" : "text-gray-900"
                          )}
                        >
                          {slot.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{slot.hint}</p>
                      </>
                    )}
                  </label>
                );
              })}
            </div>

            {photoError && (
              <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl py-3 px-3">
                Ambas fotos son obligatorias para generar el mapa.
              </p>
            )}

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Tus fotos son confidenciales y se usan exclusivamente para el análisis visual orientativo.
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !slotPhotos.frontal || !slotPhotos.coronilla}
              className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Preparando análisis..." : "Generar mi mapa"}
            </button>
            {(!slotPhotos.frontal || !slotPhotos.coronilla) && (
              <p className="text-xs text-gray-400 text-center">
                {!slotPhotos.frontal && !slotPhotos.coronilla
                  ? "Sube la foto frontal y la foto de coronilla para continuar."
                  : !slotPhotos.frontal
                    ? "Falta la foto frontal o lateral."
                    : "Falta la foto de coronilla."}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
