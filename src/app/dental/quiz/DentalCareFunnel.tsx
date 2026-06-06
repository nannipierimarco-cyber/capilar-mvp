"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DentalLead } from "@/lib/dental/types";

const STEPS = [
  {
    key: "queQuieresResolver",
    question: "¿Qué quieres resolver?",
    subtitle: "Cuéntanos tu principal interés dental",
    options: [
      { value: "alinear", label: "Alinear mis dientes", icon: "📐" },
      { value: "color", label: "Mejorar el color de mi sonrisa", icon: "✨" },
      { value: "reparar", label: "Arreglar dientes quebrados o desgastados", icon: "🦷" },
      { value: "implantar", label: "Reemplazar una pieza faltante / implante", icon: "🔩" },
      { value: "encias", label: "Mejorar encías o sonrisa gingival", icon: "🩸" },
      { value: "orientacion", label: "No estoy seguro, quiero orientación", icon: "🤔" },
    ],
  },
  {
    key: "prioridadUsuario",
    question: "¿Qué es lo más importante para ti?",
    subtitle: "Esto nos ayuda a personalizar tu orientación inicial",
    options: [
      { value: "saber_costo", label: "Saber cuánto podría costar", icon: "💰" },
      { value: "saber_tratamiento", label: "Saber qué tratamiento necesito", icon: "🔍" },
      { value: "comparar", label: "Comparar opciones antes de ir a una clínica", icon: "⚖️" },
      { value: "financiar", label: "Encontrar una opción financiable", icon: "📋" },
      { value: "rapido", label: "Mejorar mi sonrisa lo antes posible", icon: "⚡" },
    ],
  },
];

type FunnelStep = "quiz" | "photo" | "lead";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DentalCareFunnel() {
  const router = useRouter();
  const [funnelStep, setFunnelStep] = useState<FunnelStep>("quiz");
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [photoFrontal, setPhotoFrontal] = useState<File | null>(null);
  const [photoAbierta, setPhotoAbierta] = useState<File | null>(null);
  const [photoFrontalPreview, setPhotoFrontalPreview] = useState<string | null>(null);
  const [photoAbiertaPreview, setPhotoAbiertaPreview] = useState<string | null>(null);
  const [lead, setLead] = useState<DentalLead>({ nombre: "", telefono: "", email: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const frontalCameraRef = useRef<HTMLInputElement>(null);
  const frontalGalleryRef = useRef<HTMLInputElement>(null);
  const abiertaCameraRef = useRef<HTMLInputElement>(null);
  const abiertaGalleryRef = useRef<HTMLInputElement>(null);

  const TOTAL_STAGES = 4; // 2 quiz + foto + datos
  const progressPct =
    funnelStep === "quiz"
      ? ((quizStep + 1) / TOTAL_STAGES) * 100
      : funnelStep === "photo"
      ? (3 / TOTAL_STAGES) * 100
      : 100;

  function handleAnswer(value: string) {
    const currentKey = STEPS[quizStep].key;
    const updated = { ...answers, [currentKey]: value };
    setAnswers(updated);
    if (quizStep < STEPS.length - 1) {
      setTimeout(() => setQuizStep((s) => s + 1), 180);
    } else {
      setFunnelStep("photo");
    }
  }

  function handlePhotoChange(file: File | null, type: "frontal" | "abierta") {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "frontal") {
      setPhotoFrontal(file);
      setPhotoFrontalPreview(preview);
    } else {
      setPhotoAbierta(file);
      setPhotoAbiertaPreview(preview);
    }
  }

  async function handleSubmit() {
    if (!lead.nombre || !lead.telefono || !lead.email) return;
    setIsAnalyzing(true);
    try {
      // Await FileReader before router.push to prevent race condition
      const [frontalData, abiertaData] = await Promise.all([
        photoFrontal ? readFileAsDataURL(photoFrontal) : Promise.resolve(null),
        photoAbierta ? readFileAsDataURL(photoAbierta) : Promise.resolve(null),
      ]);
      sessionStorage.setItem("dental_answers", JSON.stringify(answers));
      sessionStorage.setItem("dental_lead", JSON.stringify(lead));
      if (frontalData) sessionStorage.setItem("dental_photo_frontal", frontalData);
      if (abiertaData) sessionStorage.setItem("dental_photo_abierta", abiertaData);
      router.push("/dental/analizando");
    } catch {
      setIsAnalyzing(false);
    }
  }

  const currentStep = STEPS[quizStep];

  // ── Quiz steps ─────────────────────────────────────────────────────────────
  if (funnelStep === "quiz") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest text-[#0EA5E9]">PERFECTO DENTAL</span>
          <span className="text-xs text-gray-400">{quizStep + 1} de {STEPS.length}</span>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[#0EA5E9] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            {currentStep.question}
          </h2>
          <p className="text-base text-gray-500 text-center mb-8">{currentStep.subtitle}</p>
          <div className="w-full space-y-3">
            {currentStep.options.map((opt) => {
              const isSelected = answers[currentStep.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-[#0EA5E9] bg-[#F0F9FF] text-[#0C4A6E]"
                      : "border-gray-200 hover:border-[#0EA5E9] hover:bg-[#F0F9FF]"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-base font-medium text-gray-800">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {quizStep > 0 && (
            <button
              onClick={() => setQuizStep((s) => s - 1)}
              className="mt-6 text-sm text-gray-400 hover:text-gray-600"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Fotos ──────────────────────────────────────────────────────────────────
  if (funnelStep === "photo") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest text-[#0EA5E9]">PERFECTO DENTAL</span>
          <span className="text-xs text-gray-400">Fotos</span>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[#0EA5E9] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
          <div className="mb-3 text-4xl">📸</div>
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Sube fotos de tus dientes
          </h2>
          <p className="text-base text-gray-500 text-center mb-2">
            Mientras mejores sean las fotos, más útil será la orientación inicial.
          </p>
          <p className="text-xs text-gray-400 text-center mb-8">
            Buena luz · dientes limpios · sin filtros
          </p>

          {/* Foto frontal */}
          <div className="w-full mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Foto frontal <span className="text-red-400">*</span>
            </p>
            {photoFrontalPreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#0EA5E9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoFrontalPreview} alt="Frontal" className="h-full w-full object-cover" />
                <button
                  onClick={() => { setPhotoFrontal(null); setPhotoFrontalPreview(null); }}
                  className="absolute top-2 right-2 bg-white text-gray-600 text-xs px-2.5 py-1 rounded-lg shadow font-medium"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-2xl mb-1">😁</span>
                  <p className="text-xs text-gray-400">Sonrisa de frente · buena luz</p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Puedes tomar una foto ahora o subir una desde tu galería.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => frontalCameraRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#0EA5E9] bg-[#F0F9FF] text-[#0284C7] text-sm font-medium"
                  >
                    📷 Tomar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => frontalGalleryRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium"
                  >
                    🖼️ Galería
                  </button>
                </div>
              </div>
            )}
            <input ref={frontalCameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null, "frontal")} />
            <input ref={frontalGalleryRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null, "frontal")} />
          </div>

          {/* Foto boca abierta */}
          <div className="w-full mb-8">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Boca abierta{" "}
              <span className="text-gray-400 font-normal">(opcional, recomendada)</span>
            </p>
            {photoAbiertaPreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#0EA5E9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoAbiertaPreview} alt="Abierta" className="h-full w-full object-cover" />
                <button
                  onClick={() => { setPhotoAbierta(null); setPhotoAbiertaPreview(null); }}
                  className="absolute top-2 right-2 bg-white text-gray-600 text-xs px-2.5 py-1 rounded-lg shadow font-medium"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-2xl mb-1">🦷</span>
                  <p className="text-xs text-gray-400">Boca abierta amplia · buena luz</p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Mientras mejor sea la iluminación, más útil será la orientación.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => abiertaCameraRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#0EA5E9] bg-[#F0F9FF] text-[#0284C7] text-sm font-medium"
                  >
                    📷 Tomar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => abiertaGalleryRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium"
                  >
                    🖼️ Galería
                  </button>
                </div>
              </div>
            )}
            <input ref={abiertaCameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null, "abierta")} />
            <input ref={abiertaGalleryRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null, "abierta")} />
          </div>

          <button
            onClick={() => setFunnelStep("lead")}
            disabled={!photoFrontal}
            className="w-full py-4 rounded-xl bg-[#0EA5E9] text-white font-semibold text-base disabled:opacity-40 hover:bg-[#0284C7] transition-colors"
          >
            Continuar
          </button>
          <button
            onClick={() => { setQuizStep(STEPS.length - 1); setFunnelStep("quiz"); }}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Datos de contacto ──────────────────────────────────────────────────────
  const canSubmit =
    lead.nombre.length > 1 &&
    lead.telefono.length > 7 &&
    lead.email.includes("@");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-[#0EA5E9]">PERFECTO DENTAL</span>
        <span className="text-xs text-gray-400">Tus datos</span>
      </div>
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-[#0EA5E9]" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
        <div className="mb-3 text-4xl">📬</div>
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          ¿Dónde enviamos tu orientación?
        </h2>
        <p className="text-base text-gray-500 text-center mb-8">
          Te mostraremos tu orientación inicial y también la guardaremos para que puedas volver
          a verla.
        </p>
        <div className="w-full space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: María González"
              value={lead.nombre}
              onChange={(e) => setLead((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp / Teléfono
            </label>
            <input
              type="tel"
              placeholder="+56 9 1234 5678"
              value={lead.telefono}
              onChange={(e) => setLead((p) => ({ ...p, telefono: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="tucorreo@email.com"
              value={lead.email}
              onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
          Tu información es privada. Solo la usamos para mostrarte tu orientación y que un
          especialista pueda contactarte si lo deseas.
        </p>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isAnalyzing}
          className="w-full py-4 rounded-xl bg-[#0EA5E9] text-white font-semibold text-base disabled:opacity-40 hover:bg-[#0284C7] transition-colors"
        >
          {isAnalyzing ? "Preparando orientación…" : "Ver mi orientación inicial"}
        </button>
        <button
          onClick={() => setFunnelStep("photo")}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
