import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ValuePropMarquee } from "@/components/ValuePropMarquee";

export const metadata: Metadata = {
  title: "Dental Care — Análisis de salud bucal AI | Perfecto Labs",
  description: "Responde 8 preguntas, sube una foto y recibe un reporte dental personalizado generado por inteligencia artificial.",
};

export default function DentalCarePage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <ValuePropMarquee />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <AIReportSection />
        <UseCasesSection />
        <DifferentiatorSection />
        <MedicalTrustSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-[#E8F4F0] py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D7A5F]">
          Dental Care — Perfecto Labs
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-[#1A4A38] md:text-5xl">
          Tu salud dental analizada por IA.{" "}
          <span className="text-[#2D7A5F]">En 60 segundos.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
          Responde 8 preguntas, sube una foto de tu boca y recibe un reporte dental
          personalizado. Sin turnos. Sin esperas.
        </p>
        <div className="mt-8">
          <LinkButton
            href="/dental/quiz"
            size="lg"
            className="h-12 rounded-full border-0 bg-[#2D7A5F] px-8 text-base font-semibold text-white hover:bg-[#3D8B6E]"
          >
            Analizar mi salud dental
          </LinkButton>
        </div>
        <p className="mt-3 text-sm text-gray-400">Gratis · Sin crear cuenta · El dentista te contacta en 24h</p>
      </div>
    </section>
  );
}

function ProblemSection() {
  const painPoints = [
    {
      icon: "😬",
      title: "Sin historial dental claro",
      desc: "Cada consulta parte de cero. No tienes registro de qué tratamientos tuviste, qué recomendó cada dentista ni cómo evolucionó tu boca.",
    },
    {
      icon: "🗓️",
      title: "Turnos que se aplazan",
      desc: "El 60% de las personas posterga su revisión dental por falta de tiempo. Los problemas pequeños se vuelven costosos.",
    },
    {
      icon: "💸",
      title: "Tratamientos sin contexto",
      desc: "Gastas en blanqueamientos, productos y consultas sin entender qué tiene realmente tu boca y qué necesita primero.",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            El problema con la salud dental hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            La mayoría de las personas no sabe cómo está su boca hasta que hay dolor. Y para entonces, el costo ya es mayor.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {painPoints.map((point) => (
            <Card key={point.title} className="border-border shadow-none">
              <CardContent className="pt-6">
                <span className="text-3xl">{point.icon}</span>
                <h3 className="mt-3 font-semibold">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Quiz clínico de 8 preguntas",
      desc: "Dolor, sensibilidad, color, encías, historial médico. En menos de 2 minutos.",
    },
    {
      number: "02",
      title: "Sube una foto de tu boca",
      desc: "Una foto frontal de tu sonrisa. La IA analiza zona por zona con precisión clínica.",
    },
    {
      number: "03",
      title: "Reporte AI personalizado",
      desc: "Score dental, hallazgos por zona, factores de riesgo y plan de acción con prioridades.",
    },
    {
      number: "04",
      title: "Un dentista revisa tu caso",
      desc: "Te conectamos con un dentista Perfecto Labs que revisa tu reporte y te contacta en 24h.",
    },
  ];

  return (
    <section className="bg-[#E8F4F0]/40 py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Cómo funciona</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Cuatro pasos para tener un análisis dental real sin salir de tu casa.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl bg-white p-6 shadow-none border border-border">
              <span className="text-4xl font-bold leading-none text-[#2D7A5F]/35">{step.number}</span>
              <h3 className="mt-3 font-semibold text-sm leading-snug">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIReportSection() {
  const findings = [
    { label: "Manchas", status: "Leve", color: "#BA7517" },
    { label: "Sarro", status: "Moderado", color: "#D85A30" },
    { label: "Encias", status: "Leve", color: "#BA7517" },
    { label: "Alineacion", status: "Normal", color: "#2D7A5F" },
    { label: "Desgaste", status: "Leve", color: "#BA7517" },
    { label: "Caries", status: "Leve", color: "#BA7517" },
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="overflow-hidden rounded-2xl border border-[#D1EDE4]">
          <div className="bg-[#2D7A5F] px-8 py-8 md:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
              Ejemplo de reporte
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Reporte de salud bucal AI
            </h2>
            <p className="mt-3 max-w-lg text-white/90 leading-relaxed">
              Análisis visual zona por zona con score global, hallazgos clínicos y plan de acción priorizado.
            </p>
          </div>
          <div className="bg-[#E8F4F0] px-8 py-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#D1EDE4" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3D8B6E" strokeWidth="10" strokeLinecap="round" strokeDasharray="151 251" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">62</span>
                  <span className="text-[8px] text-gray-400">/100</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Acumulacion de sarro en zona inferior</p>
                <p className="text-xs text-gray-500 mt-0.5">Se recomienda limpieza profesional</p>
                <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#BA7517]/10 text-[#BA7517]">
                  Urgencia media
                </span>
              </div>
            </div>
            <p className="mb-3 text-sm font-medium text-gray-700">Hallazgos por zona:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {findings.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-[#D1EDE4] bg-white px-4 py-2.5"
                >
                  <span className="text-xs text-gray-600">{item.label}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: item.color + "18", color: item.color }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-xl border border-[#D1EDE4] bg-white px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">Aviso:</strong> El reporte es orientativo
              y no reemplaza un diagnóstico clínico profesional. Un dentista revisará tu caso antes de
              cualquier intervención.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const cases = [
    { icon: "🦷", title: "Revisión preventiva", desc: "No fuiste al dentista en más de un año y quieres saber cómo está tu boca." },
    { icon: "😬", title: "Blanqueamiento", desc: "Quieres mejorar el color de tus dientes y saber si eres buen candidato." },
    { icon: "🩸", title: "Encías sensibles", desc: "Sangrado al cepillarte o sensación de inflamación que no sabes cómo interpretar." },
    { icon: "🧊", title: "Sensibilidad dental", desc: "Dolor con el frío, calor o dulces que no has evaluado con un profesional." },
    { icon: "⚡", title: "Dolor o molestia", desc: "Algo te molesta pero no es urgencia. Quieres entender qué puede ser antes de ir." },
    { icon: "📋", title: "Segunda opinión", desc: "Un dentista te dijo que necesitas tratamiento y quieres un análisis independiente." },
  ];

  return (
    <section className="bg-[#E8F4F0]/40 py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">¿Para qué tipo de caso?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            El análisis está diseñado para distintas preocupaciones dentales, desde preventivas hasta correctivas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {cases.map((c) => (
            <Card key={c.title} className="border-border shadow-none">
              <CardContent className="pt-5 pb-5">
                <span className="text-2xl">{c.icon}</span>
                <p className="mt-2 font-medium text-sm">{c.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DifferentiatorSection() {
  return (
    <section className="bg-[oklch(0.22_0.012_75)] py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          Tu boca tiene historia.{" "}
          <span className="text-[#3D8B6E]">Ahora tienes el análisis para entenderla.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
          En lugar de esperar a que haya dolor, entiende hoy el estado real de tu boca. Score,
          hallazgos y próximos pasos en un solo reporte.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Score dental global", icon: "📊" },
            { label: "Análisis por zona", icon: "🔬" },
            { label: "Plan de acción claro", icon: "📋" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
              <span className="text-3xl">{item.icon}</span>
              <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MedicalTrustSection() {
  const bullets = [
    "La IA no diagnostica",
    "La IA no prescribe tratamientos",
    "Un dentista valida tu caso",
    "Tus fotos y datos se tratan con privacidad",
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border px-8 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Compromiso
            </p>
            <h2 className="mt-1 text-2xl font-bold">Siempre con validación profesional</h2>
          </div>
          <div className="px-8 py-6">
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8F4F0] text-[10px] font-bold text-[#2D7A5F]">
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#E8F4F0] py-16 md:py-20">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Empieza con tu análisis dental gratuito
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground leading-relaxed">
          Responde 8 preguntas, sube una foto y recibe un reporte personalizado. Un dentista
          revisa tu caso y te contacta en 24h.
        </p>
        <LinkButton
          href="/dental/quiz"
          size="lg"
          className="mt-8 h-12 rounded-full border-0 bg-[#2D7A5F] px-10 text-base font-semibold text-white hover:bg-[#3D8B6E]"
        >
          Analizar mi salud dental
        </LinkButton>
        <p className="mt-4 text-xs text-muted-foreground">
          El análisis es orientativo. El diagnóstico y tratamiento son definidos solo por profesionales habilitados.
        </p>
      </div>
    </section>
  );
}
