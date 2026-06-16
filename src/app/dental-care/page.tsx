import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ValuePropMarquee } from "@/components/ValuePropMarquee";

export const metadata: Metadata = {
  title: "Pre-cotización dental online | Perfecto Labs",
  description: "Sube fotos de tus dientes, responde unas preguntas rápidas y recibe una orientación inicial con posibles tratamientos y rangos referenciales de precio. Sin turnos ni esperas.",
};

export default function DentalCarePage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <ValuePropMarquee />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <ReportSection />
        <QuoteComparisonBlock />
        <DisclaimerSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-[#F0F9FF] py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">
          Perfecto Labs — Dental
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-[#0C4A6E] md:text-5xl">
          Recibe una pre-cotización dental online{" "}
          <span className="text-[#0EA5E9]">en menos de 1 minuto</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
          Sube fotos de tus dientes, responde unas preguntas rápidas y recibe una orientación
          inicial con posibles tratamientos y rangos referenciales de precio.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <LinkButton
            href="/dental/quiz"
            size="lg"
            className="h-12 rounded-full border-0 bg-[#0EA5E9] px-8 text-base font-semibold text-white hover:bg-[#0284C7]"
          >
            Obtener mi pre-cotización dental
          </LinkButton>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-[#0EA5E9] hover:text-[#0284C7] underline-offset-4 hover:underline transition-colors"
          >
            Ver cómo funciona
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          Gratis · Sin crear cuenta · El presupuesto final se confirma con evaluación clínica
        </p>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      icon: "💸",
      text: "No sabes si necesitas algo simple o un tratamiento más caro.",
    },
    {
      icon: "❓",
      text: "No sabes si tu caso puede requerir ortodoncia, carillas, implantes, blanqueamiento o una evaluación más profunda.",
    },
    {
      icon: "😟",
      text: "No quieres llegar a una consulta sin una idea previa de precio.",
    },
    {
      icon: "🤔",
      text: "No quieres sentir que te están vendiendo algo que no entiendes.",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Ir al dentista sin saber cuánto puede costar genera incertidumbre
          </h2>
        </div>
        <div className="space-y-4">
          {problems.map((p) => (
            <div
              key={p.text}
              className="flex items-start gap-4 rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4"
            >
              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{p.icon}</span>
              <p className="text-sm leading-relaxed text-gray-700">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const deliverables = [
    { icon: "🗂️", label: "Posibles caminos de tratamiento" },
    { icon: "💰", label: "Rangos referenciales de precio" },
    { icon: "⚖️", label: "Factores que pueden cambiar el costo" },
    { icon: "➡️", label: "Próximo paso recomendado" },
    { icon: "📅", label: "Opción de agendar para confirmar presupuesto" },
  ];

  return (
    <section className="bg-[#F0F9FF] py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0C4A6E] md:text-4xl">
            Primero entiende tus opciones. Después decides si agendar.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-600">
            Perfecto Labs te entrega una orientación inicial basada en tus fotos y respuestas,
            para que llegues a tu consulta con contexto — no con incertidumbre.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {deliverables.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-3 rounded-2xl border border-[#BAE6FD] bg-white px-4 py-3.5"
            >
              <span className="text-xl flex-shrink-0">{d.icon}</span>
              <span className="text-sm font-medium text-gray-800">{d.label}</span>
            </div>
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
      title: "Cuéntanos qué quieres mejorar",
      desc: "Responde unas preguntas rápidas sobre tu situación dental y lo que más te preocupa.",
    },
    {
      number: "02",
      title: "Sube fotos de tus dientes",
      desc: "Una foto frontal y una de perfil. Buena luz, sin filtros. En menos de un minuto.",
    },
    {
      number: "03",
      title: "Recibe tu orientación inicial y rangos de precio",
      desc: "Posibles tratamientos, rangos referenciales de costo y tu próximo paso recomendado.",
    },
  ];

  return (
    <section id="como-funciona" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Cómo funciona
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Tres pasos para tener claridad sobre tu situación dental sin salir de casa.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-6"
            >
              <span className="text-4xl font-bold leading-none text-[#0EA5E9]/30">
                {step.number}
              </span>
              <h3 className="mt-3 text-sm font-semibold leading-snug text-[#0C4A6E]">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportSection() {
  const cards = [
    {
      icon: "🦷",
      title: "Posibles tratamientos a evaluar",
      desc: "Identificamos qué tipos de intervención podrían ser relevantes para tu caso.",
    },
    {
      icon: "💰",
      title: "Rango de precio referencial",
      desc: "Estimados orientativos basados en el mercado. El presupuesto final lo confirma el profesional.",
    },
    {
      icon: "🔴",
      title: "Nivel de prioridad",
      desc: "Una idea de qué tan urgente puede ser actuar según lo observado en tus fotos y respuestas.",
    },
    {
      icon: "⚖️",
      title: "Qué puede cambiar el costo",
      desc: "Factores como materiales, complejidad, radiografías o criterio clínico que afectan el precio real.",
    },
    {
      icon: "➡️",
      title: "Próximo paso recomendado",
      desc: "Si tienes sentido agendar evaluación, qué especialidad buscar o qué preguntar en consulta.",
    },
  ];

  return (
    <section className="bg-[#F0F9FF] py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0C4A6E] md:text-4xl">
            Qué incluye tu orientación inicial
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            No es un diagnóstico. Es un punto de partida con información real para que llegues
            preparado a tu consulta.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {cards.slice(0, 3).map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#BAE6FD] bg-white p-6 shadow-none"
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {cards.slice(3).map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#BAE6FD] bg-white p-6 shadow-none"
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteComparisonBlock() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] px-8 py-10 text-center">
          <span className="text-4xl">📋</span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0C4A6E] md:text-3xl">
            ¿Ya tienes una cotización dental?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-gray-600">
            Súbela y te ayudamos a conseguir una alternativa más conveniente con clínicas verificadas.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Revisamos tu presupuesto y te enviamos una nueva cotización por WhatsApp en menos de 24 horas.
          </p>
          <a
            href="/dental-care/comparar-presupuesto"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#0EA5E9] px-8 text-base font-semibold text-white hover:bg-[#0284C7] transition-colors"
          >
            Comparar mi presupuesto
          </a>
          <p className="mt-3 text-xs text-gray-400">
            Gratis · Sin compromisos · Respuesta en menos de 24 horas
          </p>
        </div>
      </div>
    </section>
  );
}

function DisclaimerSection() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5">
          <p className="text-xs leading-relaxed text-gray-500">
            <span className="font-semibold text-gray-700">Aviso importante: </span>
            La orientación entregada por Perfecto Labs no reemplaza una evaluación odontológica. Los
            precios son rangos referenciales y pueden variar según radiografías, diagnóstico clínico,
            materiales, complejidad y criterio profesional.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#0EA5E9] py-16 md:py-20">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Obtén claridad antes de agendar
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/80 leading-relaxed">
          Sube tus fotos, responde unas preguntas rápidas y recibe orientación inicial con rangos
          de precio. Sin compromisos.
        </p>
        <LinkButton
          href="/dental/quiz"
          size="lg"
          className="mt-8 h-12 rounded-full border-0 bg-white px-10 text-base font-semibold text-[#0284C7] hover:bg-sky-50"
        >
          Empezar mi pre-cotización
        </LinkButton>
        <p className="mt-4 text-xs text-white/60">
          El presupuesto final se confirma con evaluación clínica profesional.
        </p>
      </div>
    </section>
  );
}
