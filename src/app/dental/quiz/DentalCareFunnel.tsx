"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DentalQuizAnswers, DentalLead } from "@/lib/dental/types";

const STEPS = [
  {
    id: 1, key: "motivoPrincipal" as keyof DentalQuizAnswers,
    question: "Que te trajo aqui hoy?",
    subtitle: "Cuentanos tu principal preocupacion dental",
    options: [
      { value: "dolor", label: "Dolor o molestia", icon: "🦷" },
      { value: "estetica", label: "No me gusta como se ven mis dientes", icon: "✨" },
      { value: "encias", label: "Encias que sangran o inflaman", icon: "🩸" },
      { value: "mal_aliento", label: "Mal aliento recurrente", icon: "💨" },
      { value: "revision", label: "Hace tiempo que no voy al dentista", icon: "📅" },
    ],
  },
  {
    id: 2, key: "dolorReciente" as keyof DentalQuizAnswers,
    question: "Has tenido dolor dental en los ultimos 3 meses?",
    subtitle: "Incluye sensibilidad, punzadas o molestias",
    options: [
      { value: "frecuente", label: "Si, con frecuencia", icon: "🔴" },
      { value: "ocasional", label: "Si, de vez en cuando", icon: "🟡" },
      { value: "frio_dulce", label: "Solo al comer frio o dulce", icon: "🧊" },
      { value: "no", label: "No, ningun dolor", icon: "✅" },
    ],
  },
  {
    id: 3, key: "ultimaVisita" as keyof DentalQuizAnswers,
    question: "Cuando fue tu ultima visita al dentista?",
    subtitle: "Sin juzgar, queremos saber donde partimos",
    options: [
      { value: "menos_6m", label: "Menos de 6 meses", icon: "🗓️" },
      { value: "6_12m", label: "Entre 6 y 12 meses", icon: "📆" },
      { value: "1_3a", label: "Entre 1 y 3 anos", icon: "⏳" },
      { value: "mas_3a", label: "Mas de 3 anos o nunca", icon: "⚠️" },
    ],
  },
  {
    id: 4, key: "enciasNgran" as keyof DentalQuizAnswers,
    question: "Tus encias sangran al cepillarte o usar hilo dental?",
    subtitle: "El sangrado es una senal que no debemos ignorar",
    options: [
      { value: "siempre", label: "Siempre o casi siempre", icon: "🩸" },
      { value: "aveces", label: "A veces", icon: "🔸" },
      { value: "rara_vez", label: "Muy rara vez", icon: "🔹" },
      { value: "nunca", label: "Nunca", icon: "✅" },
    ],
  },
  {
    id: 5, key: "sensibilidad" as keyof DentalQuizAnswers,
    question: "Sientes sensibilidad al frio, calor o alimentos dulces?",
    subtitle: "La sensibilidad puede indicar erosion del esmalte",
    options: [
      { value: "intensa", label: "Si, sensibilidad intensa", icon: "⚡" },
      { value: "leve", label: "Si, sensibilidad leve", icon: "🔸" },
      { value: "solo_frio", label: "Solo con cosas muy frias", icon: "🧊" },
      { value: "no", label: "No tengo sensibilidad", icon: "✅" },
    ],
  },
  {
    id: 6, key: "colorDientes" as keyof DentalQuizAnswers,
    question: "Como describirias el color de tus dientes?",
    subtitle: "Tu percepcion nos ayuda a personalizar el analisis",
    options: [
      { value: "muy_amarillos", label: "Muy amarillos o manchados", icon: "😬" },
      { value: "algo_amarillos", label: "Un poco amarillos", icon: "😐" },
      { value: "manchas", label: "Blancos pero con manchas", icon: "🔸" },
      { value: "conforme", label: "Estoy conforme con el color", icon: "😊" },
    ],
  },
  {
    id: 7, key: "interesTratamiento" as keyof DentalQuizAnswers,
    question: "Te interesa mejorar tu sonrisa o salud dental?",
    subtitle: "Queremos entender que esperas de esta evaluacion",
    options: [
      { value: "mucho", label: "Si, es algo que me preocupa mucho", icon: "💪" },
      { value: "si_pero_no_se", label: "Si, pero no se por donde empezar", icon: "🤔" },
      { value: "si_si_no_caro", label: "Si, si no es muy caro", icon: "💰" },
      { value: "solo_saber", label: "Solo quiero saber como estoy", icon: "🔍" },
    ],
  },
  {
    id: 8, key: "historialMedico" as keyof DentalQuizAnswers,
    question: "Tomas medicamentos o tienes alguna condicion medica?",
    subtitle: "Diabetes, hipertension y otros pueden afectar la salud bucal",
    options: [
      { value: "si", label: "Si, tengo condicion o tomo medicamentos", icon: "💊" },
      { value: "no", label: "No, estoy sano/a", icon: "✅" },
      { value: "prefiero_no", label: "Prefiero no decir", icon: "🔒" },
    ],
  },
];

const EMPTY_ANSWERS: DentalQuizAnswers = {
  motivoPrincipal: "", dolorReciente: "", ultimaVisita: "", enciasNgran: "",
  sensibilidad: "", colorDientes: "", interesTratamiento: "", historialMedico: "",
};

type FunnelStep = "quiz" | "photo" | "lead" | "done";

export default function DentalCareFunnel() {
  const router = useRouter();
  const [funnelStep, setFunnelStep] = useState<FunnelStep>("quiz");
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<DentalQuizAnswers>(EMPTY_ANSWERS);
  const [photoFrontal, setPhotoFrontal] = useState<File | null>(null);
  const [photoAbierta, setPhotoAbierta] = useState<File | null>(null);
  const [photoFrontalPreview, setPhotoFrontalPreview] = useState<string | null>(null);
  const [photoAbiertaPreview, setPhotoAbiertaPreview] = useState<string | null>(null);
  const [lead, setLead] = useState<DentalLead>({ nombre: "", telefono: "", email: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const frontalRef = useRef<HTMLInputElement>(null);
  const abiertaRef = useRef<HTMLInputElement>(null);
  const currentStep = STEPS[quizStep];

  function handleAnswer(value: string) {
    const updated = { ...answers, [currentStep.key]: value };
    setAnswers(updated);
    if (quizStep < STEPS.length - 1) { setTimeout(() => setQuizStep((s) => s + 1), 200); }
    else { setFunnelStep("photo"); }
  }

  function handlePhotoChange(file: File | null, type: "frontal" | "abierta") {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "frontal") { setPhotoFrontal(file); setPhotoFrontalPreview(preview); }
    else { setPhotoAbierta(file); setPhotoAbiertaPreview(preview); }
  }

  function handleLeadChange(field: keyof DentalLead, value: string) {
    setLead((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!lead.nombre || !lead.telefono || !lead.email) return;
    setIsAnalyzing(true);
    sessionStorage.setItem("dental_answers", JSON.stringify(answers));
    sessionStorage.setItem("dental_lead", JSON.stringify(lead));
    if (photoFrontal) {
      const reader = new FileReader();
      reader.onloadend = () => { sessionStorage.setItem("dental_photo_frontal", reader.result as string); };
      reader.readAsDataURL(photoFrontal);
    }
    if (photoAbierta) {
      const reader = new FileReader();
      reader.onloadend = () => { sessionStorage.setItem("dental_photo_abierta", reader.result as string); };
      reader.readAsDataURL(photoAbierta);
    }
    router.push("/dental/analizando");
  }

  if (funnelStep === "quiz") {
    const progress = ((quizStep + 1) / STEPS.length) * 100;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-400">PERFECTO DENTAL</span>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-[#2D7A5F] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full">
          <p className="text-sm text-gray-400 mb-4">{quizStep + 1} de {STEPS.length}</p>
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">{currentStep.question}</h2>
          <p className="text-base text-gray-500 text-center mb-8">{currentStep.subtitle}</p>
          <div className="w-full space-y-3">
            {currentStep.options.map((opt) => {
              const isSelected = answers[currentStep.key] === opt.value;
              return (
                <button key={opt.value} onClick={() => handleAnswer(opt.value)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                    isSelected ? "border-[#2D7A5F] bg-[#E8F4F0] text-[#1A4A38]" : "border-gray-200 hover:border-[#3D8B6E] hover:bg-gray-50"
                  }`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-base font-medium text-gray-800">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {quizStep > 0 && (
            <button onClick={() => setQuizStep((s) => s - 1)} className="mt-6 text-sm text-gray-400 hover:text-gray-600">
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  if (funnelStep === "photo") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-400">PERFECTO DENTAL</span>
        </div>
        <div className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
          <div className="mb-2 text-4xl">📸</div>
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Ahora analicemos tu boca</h2>
          <p className="text-base text-gray-500 text-center mb-8">
            Necesitamos una foto frontal de tu sonrisa. Si puedes, sube tambien una con la boca abierta.
          </p>
          <div className="w-full mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Foto frontal <span className="text-red-400">*</span></p>
            <div onClick={() => frontalRef.current?.click()}
              className={`w-full h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                photoFrontalPreview ? "border-[#3D8B6E] bg-[#E8F4F0]" : "border-gray-200 hover:border-[#3D8B6E]"
              }`}>
              {photoFrontalPreview
                ? <img src={photoFrontalPreview} alt="Frontal" className="h-full w-full object-cover rounded-xl" />
                : <><span className="text-3xl mb-2">😁</span><p className="text-sm text-gray-500">Sonrisa de frente</p><p className="text-xs text-gray-400 mt-1">Toca para subir foto</p></>
              }
            </div>
            <input ref={frontalRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null, "frontal")} />
          </div>
          <div className="w-full mb-8">
            <p className="text-sm font-medium text-gray-700 mb-2">Boca abierta <span className="text-gray-400 font-normal">(opcional)</span></p>
            <div onClick={() => abiertaRef.current?.click()}
              className={`w-full h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                photoAbiertaPreview ? "border-[#3D8B6E] bg-[#E8F4F0]" : "border-gray-200 hover:border-[#3D8B6E]"
              }`}>
              {photoAbiertaPreview
                ? <img src={photoAbiertaPreview} alt="Abierta" className="h-full w-full object-cover rounded-xl" />
                : <><span className="text-3xl mb-2">🦷</span><p className="text-sm text-gray-500">Boca abierta amplia</p><p className="text-xs text-gray-400 mt-1">Toca para subir foto</p></>
              }
            </div>
            <input ref={abiertaRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null, "abierta")} />
          </div>
          <button onClick={() => setFunnelStep("lead")} disabled={!photoFrontal}
            className="w-full py-4 rounded-xl bg-[#2D7A5F] text-white font-semibold text-base disabled:opacity-40 hover:bg-[#235F4A] transition-colors">
            Continuar
          </button>
          <button onClick={() => setFunnelStep("quiz")} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
            Volver al quiz
          </button>
        </div>
      </div>
    );
  }

  if (funnelStep === "lead") {
    const canSubmit = lead.nombre.length > 1 && lead.telefono.length > 7 && lead.email.includes("@");
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-400">PERFECTO DENTAL</span>
        </div>
        <div className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
          <div className="mb-2 text-4xl">🔬</div>
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Casi listo!</h2>
          <p className="text-base text-gray-500 text-center mb-8">
            Ingresa tus datos para enviarte el analisis y conectarte con un dentista de Perfecto Labs.
          </p>
          <div className="w-full space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input type="text" placeholder="Ej: Maria Gonzalez" value={lead.nombre}
                onChange={(e) => handleLeadChange("nombre", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[#3D8B6E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Telefono</label>
              <input type="tel" placeholder="+56 9 1234 5678" value={lead.telefono}
                onChange={(e) => handleLeadChange("telefono", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[#3D8B6E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="tucorreo@email.com" value={lead.email}
                onChange={(e) => handleLeadChange("email", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[#3D8B6E]" />
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mb-6">
            Tu informacion es privada. Solo la usamos para enviarte el analisis y que un dentista pueda contactarte.
          </p>
          <button onClick={handleSubmit} disabled={!canSubmit || isAnalyzing}
            className="w-full py-4 rounded-xl bg-[#2D7A5F] text-white font-semibold text-base disabled:opacity-40 hover:bg-[#235F4A] transition-colors">
            {isAnalyzing ? "Preparando analisis..." : "Ver mi analisis dental"}
          </button>
          <button onClick={() => setFunnelStep("photo")} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return null;
}
