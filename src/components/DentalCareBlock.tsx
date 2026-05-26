"use client";

import Link from "next/link";

const FEATURES = [
  { icon: "🦷", title: "Quiz clinico dental", desc: "8 preguntas para entender tu salud bucal antes del analisis" },
  { icon: "📸", title: "Foto de tu boca", desc: "Sube una foto y nuestra IA la analiza zona por zona" },
  { icon: "🔬", title: "Reporte AI personalizado", desc: "Score dental, hallazgos y plan de accion con inteligencia artificial" },
  { icon: "👨‍⚕️", title: "Conecta con un dentista", desc: "Te conectamos con un dentista Perfecto Labs para tu consulta" },
];

export default function DentalCareBlock() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🦷</span>
          <span className="text-sm font-semibold tracking-widest text-sky-500 uppercase">Dental Care</span>
          <span className="text-xs bg-sky-100 text-sky-600 font-medium px-2 py-0.5 rounded-full">Nuevo</span>
        </div>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              Analiza tu salud dental con IA —{" "}
              <span className="text-sky-500">antes de que sea un problema</span>
            </h2>
            <p className="text-base text-gray-500 mb-6">
              Responde unas preguntas, sube una foto de tu boca y nuestra IA te da un diagnostico preliminar y te conecta con el dentista indicado.
            </p>
            <div className="space-y-4 mb-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-3 items-start">
                  <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/dental/quiz"
              className="inline-flex items-center gap-2 px-7 py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors text-base">
              Analizar mi salud dental <span>→</span>
            </Link>
            <p className="mt-3 text-xs text-gray-400">Gratis · Sin necesidad de crear cuenta · Resultado en 60 segundos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-sky-500 tracking-widest">PERFECTO DENTAL</p>
                <p className="text-sm text-gray-500">Reporte de salud bucal AI</p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-3 py-1 rounded-full">Urgencia media</span>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F1EFE8" strokeWidth="10"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#EF9F27" strokeWidth="10" strokeLinecap="round" strokeDasharray="151 251"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">62</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Acumulacion de sarro en zona inferior</p>
                <p className="text-xs text-gray-400 mt-0.5">Se recomienda limpieza profesional</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "Manchas", status: "Leve", color: "#BA7517" },
                { label: "Sarro", status: "Moderado", color: "#D85A30" },
                { label: "Encias", status: "Leve", color: "#BA7517" },
                { label: "Alineacion", status: "Normal", color: "#0F6E56" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: item.color + "18", color: item.color }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-sky-50 rounded-xl px-4 py-3 text-xs text-sky-700 font-medium">
              📅 Un dentista revisara tu reporte y te contactara esta semana
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
