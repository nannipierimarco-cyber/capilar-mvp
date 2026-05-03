import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Dermatología para mujeres — Nilo",
  description:
    "Evalúa tu piel, crea tu historial inteligente y recibe orientación revisada por dermatólogas. Acné, manchas, rosácea, antiaging y más.",
};

export default function DermatologiaMujerPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <SkinCopilotSection />
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
    <section className="bg-hero-bg py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">
          Dermatología online para mujeres
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-hero-headline md:text-5xl">
          Tu piel cambia.{" "}
          <span className="text-rose-600">Tu tratamiento también debería.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-hero-muted">
          Completa una evaluación online, crea tu historial inteligente de piel y recibe
          orientación revisada por dermatólogas.
        </p>
        <div className="mt-8">
          <LinkButton
            href="/evaluacion-piel"
            size="lg"
            className="h-12 rounded-full border-0 bg-rose-600 px-8 text-base font-semibold text-white hover:bg-rose-700"
          >
            Empezar evaluación de piel
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const painPoints = [
    {
      icon: "🧴",
      title: "Cremas sin contexto",
      desc: "Probaste productos de TikTok, Reddit y amigas. Algunos funcionaron, otros irritaron. No sabes por qué.",
    },
    {
      icon: "🗂️",
      title: "Sin historial ordenado",
      desc: "Cada consulta parte de cero. No tienes registro de qué activos usaste, qué recomendó cada médico ni cómo evolucionó tu piel.",
    },
    {
      icon: "🔄",
      title: "Rutinas que no se sostienen",
      desc: "Armaste tu rutina ideal varias veces, pero cambia de temporada, de médico o de piel y tienes que empezar de nuevo.",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            El problema con el skincare hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Muchas mujeres prueban cremas, rutinas, tratamientos y especialistas, pero no
            tienen un historial ordenado de qué funcionó, qué irritó su piel y qué recomendó
            cada médico.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {painPoints.map((point) => (
            <Card key={point.title} className="border-border shadow-none">
              <CardContent className="pt-6">
                <span className="text-3xl">{point.icon}</span>
                <h3 className="mt-3 font-semibold">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {point.desc}
                </p>
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
      title: "Responde un cuestionario de piel",
      desc: "Tipo de piel, rutina actual, sensibilidades, objetivos y antecedentes. En menos de 5 minutos.",
    },
    {
      number: "02",
      title: "Sube fotos de forma segura",
      desc: "Fotos de tu rostro y zonas de interés. Tratadas con privacidad, usadas solo para tu revisión médica.",
    },
    {
      number: "03",
      title: "Una dermatóloga revisa tu caso",
      desc: "Recibes orientación profesional basada en tu historial, fotos y objetivos. No es un bot.",
    },
    {
      number: "04",
      title: "Activa tu Skin Copilot por WhatsApp",
      desc: "Tu asistente inteligente de piel, disponible para consultas rápidas en tu día a día.",
    },
  ];

  return (
    <section className="bg-muted/40 py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Cómo funciona
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Cuatro pasos para tener un historial de piel que trabaja contigo.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl bg-white p-6 shadow-none border border-border">
              <span className="text-4xl font-bold leading-none text-rose-200">
                {step.number}
              </span>
              <h3 className="mt-3 font-semibold text-sm leading-snug">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkinCopilotSection() {
  const questions = [
    "¿Esta crema me sirve para mi tipo de piel?",
    "Me salió un granito, ¿qué puedo hacer sin irritarme?",
    "¿Puedo mezclar estos activos?",
    "¿Esto va contra lo que me indicó la dermatóloga?",
  ];

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="overflow-hidden rounded-2xl border border-rose-100">
          <div className="bg-rose-600 px-8 py-8 md:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">
              Novedad
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Skin Copilot por WhatsApp
            </h2>
            <p className="mt-3 max-w-lg text-rose-100 leading-relaxed">
              Tu asistente de piel inteligente, disponible cuando lo necesitas. Consulta dudas
              cotidianas con contexto de tu historial real.
            </p>
          </div>
          <div className="bg-rose-50 px-8 py-8">
            <p className="mb-4 text-sm font-medium text-foreground">Preguntas que puedes hacer:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {questions.map((q) => (
                <div
                  key={q}
                  className="flex items-start gap-3 rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm text-foreground/80"
                >
                  <span className="mt-0.5 shrink-0 text-rose-400">💬</span>
                  <span className="leading-snug">{q}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-xl border border-rose-100 bg-white px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">Aviso:</strong> El chat no reemplaza
              una consulta médica. Te orienta según tu historial y deriva a una dermatóloga cuando
              corresponde.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const cases = [
    { icon: "🔴", title: "Acné adulto", desc: "Brotes persistentes después de los 25, con o sin cicatrices." },
    { icon: "🟤", title: "Manchas y melasma", desc: "Hiperpigmentación hormonal, solar o post-inflamatoria." },
    { icon: "🌸", title: "Rosácea y piel sensible", desc: "Enrojecimiento, sensibilidad aumentada y reactividad." },
    { icon: "✨", title: "Antiaging preventivo", desc: "Rutina basada en evidencia para tu edad y tipo de piel." },
    { icon: "💧", title: "Rutina de skincare", desc: "Orden correcto de activos, limpieza y fotoprotección." },
    { icon: "📈", title: "Seguimiento post tratamiento", desc: "Historial activo después de procedimientos o prescripciones." },
  ];

  return (
    <section className="bg-muted/40 py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            ¿Para qué tipo de caso?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            La plataforma está diseñada para acompañar diferentes etapas del cuidado de tu piel.
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
          Tu piel tiene memoria.{" "}
          <span className="text-rose-300">Ahora tu tratamiento también.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
          Guardamos tu historial, fotos, productos, tratamientos, sensibilidad y evolución
          para ayudarte a tomar mejores decisiones cada vez.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Historial de piel", icon: "📋" },
            { label: "Fotos de evolución", icon: "📷" },
            { label: "Activos y reacciones", icon: "🧪" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6"
            >
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
    "La IA no prescribe",
    "La dermatóloga valida el caso",
    "Tus datos se tratan con privacidad y seguridad",
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
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
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
    <section className="bg-rose-50 py-16 md:py-20">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Empieza con una evaluación de piel
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground leading-relaxed">
          Completa tu cuestionario, sube tus fotos y recibe orientación revisada por una
          dermatóloga. Sin esperas largas, sin coordinar tú todo.
        </p>
        <LinkButton
          href="/evaluacion-piel"
          size="lg"
          className="mt-8 h-12 rounded-full border-0 bg-rose-600 px-10 text-base font-semibold text-white hover:bg-rose-700"
        >
          Comenzar ahora
        </LinkButton>
        <p className="mt-4 text-xs text-muted-foreground">
          El diagnóstico y la prescripción son emitidos solo por profesionales habilitados.
        </p>
      </div>
    </section>
  );
}
