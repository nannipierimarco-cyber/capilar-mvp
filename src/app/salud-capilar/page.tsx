import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ValuePropMarquee } from "@/components/ValuePropMarquee";

export const metadata: Metadata = {
  title: "Salud Capilar Masculina — Perfecto",
  description:
    "Evalúa tu caída, entiende tu score capilar y accede a una ruta médica personalizada con tratamiento mensual a domicilio.",
};

export default function SaludCapilarPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header hideOnMobile />
      <main className="flex-1">
        <Hero />
        <ValuePropMarquee />
        <HowItWorks />
        <WhatIncludes />
        <MonthlyTreatment />
        <ProceduresSection />
        <TwoPathsSection />
        <WhyContinuity />
        <FAQSection />
        <SafetyNote />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <>
      {/* Mobile: hero verde premium (texto + CTAs; sin imagen grande) */}
      <section className="relative bg-hero-mobile-bg text-white md:hidden">
        <div className="mx-auto max-w-lg px-4 pb-12 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-3 pb-8 pt-1">
            <Link
              href="/"
              className="shrink-0 font-semibold text-xl tracking-tight text-white"
            >
              Perfecto
            </Link>
            <Link href="/score-capilar" className="hidden">
              Score Capilar Gratis
            </Link>
            <Link
              href="/mapa-capilar"
              className="text-xs font-semibold text-white border border-white/30 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors"
            >
              Mapa Capilar AI
            </Link>
          </div>

          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
            Evaluación capilar online
          </p>

          <h1 className="mx-auto mt-5 max-w-[min(100%,22rem)] text-center text-4xl font-bold leading-[0.98] tracking-[-0.03em] text-white sm:max-w-none sm:text-5xl">
            Entiende tu caída <span className="text-hero-mobile-accent">antes de decidir</span> qué
            hacer.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-center text-[17px] leading-snug text-white/88 sm:text-lg">
            Perfecto te ayuda a identificar si hoy necesitas frenar la caída o evaluar un trasplante
            capilar, con revisión médica y seguimiento.
          </p>

          <div className="mx-auto mt-9 w-full max-w-md">
            <LinkButton
              href="/quiz"
              size="lg"
              className="h-14 w-full rounded-full border-0 bg-white px-8 text-base font-semibold text-hero-mobile-bg shadow-sm hover:bg-white/95"
            >
              Comenzar evaluación
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Desktop: hero crema + grid con imagen */}
      <section className="relative hidden overflow-hidden bg-hero-bg text-hero-headline md:block">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20">
          <div className="grid items-center gap-14 md:grid-cols-2">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hero-eyebrow">
                Evaluación capilar online
              </p>
              <h1 className="mt-4 text-5xl font-bold leading-[1.08] tracking-[-0.03em] text-hero-headline">
                Entiende tu caída <span className="text-primary">antes de decidir</span> qué hacer.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-hero-muted">
                Perfecto te ayuda a identificar si hoy necesitas frenar la caída o evaluar un trasplante
                capilar, con revisión médica y seguimiento.
              </p>
              <div className="mt-8">
                <LinkButton href="/quiz" size="lg" className="h-12 rounded-full px-8 text-base">
                  Comenzar evaluación
                </LinkButton>
              </div>
            </div>
            <div>
              <div className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-2xl bg-neutral-100 shadow-xl">
                <Image
                  src="/hero-promo-farmacia.png"
                  alt="Tratamiento capilar 100% online, precio claro, despacho a domicilio y farmacia autorizada"
                  fill
                  className="object-contain object-center"
                  sizes="50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Completa tu evaluación y recibe aprobación",
      description:
        "Responde el cuestionario capilar y sube fotos de tu cabello. Toma menos de 5 minutos.",
    },
    {
      number: "02",
      title: "Agenda consulta online",
      description:
        "Un médico especialista revisará tu caso y, si corresponde, definirá un tratamiento personalizado. Tu plan está pensado para ayudarte a avanzar de forma segura y efectiva.",
    },
    {
      number: "03",
      title: "Recibe tu tratamiento sin salir de tu casa",
      description:
        "Coordinamos tu receta con farmacia autorizada y te lo enviamos a domicilio.",
    },
  ];

  return (
    <section id="como-funciona" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Tu ruta capilar, simple y{" "}
            <span className="text-primary">personalizada</span>.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Un proceso simple y completamente online, con supervisión médica real.
          </p>
        </div>

        <div className="mb-12 grid items-center gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-10 lg:gap-x-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/hombre1.jpg"
              alt="Consulta médica capilar online"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center px-1 text-center md:px-6">
            <h3 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Método <span className="text-primary">Perfecto</span>: ¿Cómo funciona?
            </h3>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.number} className="border-border shadow-none">
              <CardContent className="pt-6">
                <span className="text-5xl font-bold leading-none text-primary/35 md:text-6xl">
                  {step.number}
                </span>
                <h3 className="mt-2 font-semibold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatIncludes() {
  const items = [
    { icon: "🩺", title: "Consulta médica online", desc: "15 min con especialista capilar" },
    { icon: "📷", title: "Revisión de fotos", desc: "Análisis de tu zona afectada" },
    { icon: "📋", title: "Receta si corresponde", desc: "Solo si el médico lo indica" },
    { icon: "🏥", title: "Producto Farmacia Autorizada", desc: "Coordinamos la preparación magistral" },
    { icon: "📦", title: "Despacho mensual", desc: "Llega directo a tu domicilio" },
    { icon: "📊", title: "Seguimiento digital", desc: "Check-ins y reporte fotográfico" },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Qué incluye</h2>
          <p className="mt-3 text-muted-foreground">
            Todo lo que necesitas para empezar y mantener tu tratamiento.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.title} className="border-border shadow-none">
              <CardContent className="pt-5 pb-5">
                <span className="text-2xl">{item.icon}</span>
                <p className="mt-2 font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function MonthlyTreatment() {
  return (
    <section className="bg-primary text-primary-foreground py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
              Tratamiento mensual
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">
              Tu tratamiento llega cada mes sin que tengas que hacer nada
            </h2>
            <p className="mt-4 opacity-80 leading-relaxed">
              Coordinamos minoxidil oral, dutasteride, finasteride u otros tratamientos
              indicados por tu médico. Preparación magistral en farmacia autorizada y
              despacho mensual a tu domicilio.
            </p>
            <ul className="mt-6 space-y-2 text-sm opacity-90">
              {[
                "Sin colas en farmacia",
                "Sin coordinar recetas tú mismo",
                "Seguimiento y renovación médica cuando corresponda",
                "Ajuste de tratamiento según evolución",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs shrink-0">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <LinkButton
              href="/quiz"
              variant="secondary"
              className="mt-8 rounded-full px-6"
            >
              Iniciar evaluación
            </LinkButton>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/tratamiento-mensual-banner-mobile.png"
                alt="100% online, precio claro, despacho a domicilio, farmacia autorizada — minoxidil y dutasteride bajo indicación médica"
                fill
                className="object-cover md:hidden"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <Image
                src="/hombre2.jpg"
                alt="Tratamiento capilar mensual a domicilio"
                fill
                className="hidden object-cover md:block"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="bg-primary-foreground/10 rounded-2xl p-5 space-y-1">
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-3">
                Tu timeline
              </p>
              {[
                { time: "Hoy", desc: "Evaluación y revisión médica" },
                { time: "30 días", desc: "Primer check-in digital" },
                { time: "3 meses", desc: "Revisión de adherencia y evolución" },
                { time: "6 meses", desc: "Ajustar plan o evaluar procedimiento" },
                { time: "12 meses", desc: "Mantener, optimizar o considerar trasplante" },
              ].map((item, i, arr) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground/60 mt-1 shrink-0" />
                    {i < arr.length - 1 && (
                      <div className="w-px bg-primary-foreground/20 my-1" style={{ height: 18 }} />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-semibold leading-tight">{item.time}</p>
                    <p className="text-xs opacity-70">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProceduresSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">
            ¿Tratamiento o trasplante? Primero entendamos tu caso.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Algunas personas necesitan comenzar por frenar la caída. Otras ya están en una etapa
            donde tiene sentido evaluar recuperación capilar con una clínica. Nuestra plataforma
            te ayuda a ordenar esa decisión antes de tomar un camino.
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[16/7]">
          <Image
            src="/hombre4.jpg"
            alt="Clínica capilar partner — evaluación de recuperación capilar"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-end p-6 md:p-10">
            <div className="text-white max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
                Clínicas partner certificadas
              </p>
              <p className="text-xl md:text-2xl font-bold leading-snug">
                Evaluación profesional cuando corresponde
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TwoPathsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Dos caminos posibles</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border shadow-none overflow-hidden">
            <div className="bg-accent p-6">
              <h3 className="font-bold text-xl text-accent-foreground">Frenar la caída</h3>
            </div>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si todavía tienes pelo que cuidar, el primer paso puede ser evaluar tratamiento
                médico, receta si corresponde, farmacia autorizada, despacho y seguimiento.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none overflow-hidden">
            <div className="bg-primary p-6">
              <h3 className="font-bold text-xl text-primary-foreground">Evaluar trasplante</h3>
            </div>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si ya perdiste densidad o estás considerando recuperación capilar, te ayudamos
                a ordenar antecedentes, fotos e historial antes de avanzar con una clínica partner.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function WhyContinuity() {
  return (
    <section className="bg-muted/60 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Por qué la continuidad importa</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          El minoxidil y otros tratamientos capilares requieren uso constante durante meses
          para mostrar resultados. Interrumpir el tratamiento puede revertir los avances.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            {
              title: "Primeros 3 meses",
              desc: "Es normal ver caída aumentada al inicio. Es parte del proceso de renovación.",
            },
            {
              title: "3 a 6 meses",
              desc: "El folículo empieza a fortalecerse. Se nota reducción en la caída activa.",
            },
            {
              title: "6 a 12 meses",
              desc: "Los resultados de densidad y calidad son más visibles con adherencia constante.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-background rounded-xl p-5 text-left">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "¿El cuestionario reemplaza una consulta médica?",
      a: "No. El cuestionario prepara la información para que el médico pueda revisar tu caso de forma eficiente en la consulta online de 15 minutos. El diagnóstico y la receta los emite el médico.",
    },
    {
      q: "¿Me garantizan que recibiré tratamiento?",
      a: "No garantizamos tratamiento. La receta y el tratamiento se emiten solo si el médico lo considera clínicamente apropiado según tu caso.",
    },
    {
      q: "¿Qué medicamentos incluye el tratamiento?",
      a: "Depende de tu caso. Puede incluir minoxidil oral, dutasteride, finasteride u otros indicados por el médico. Los medicamentos magistrales se preparan en farmacia autorizada.",
    },
    {
      q: "¿Puedo cancelar mi suscripción en cualquier momento?",
      a: "Sí. Puedes pausar o cancelar tu plan mensual cuando lo necesites sin penalización.",
    },
    {
      q: "¿Qué pasa si no soy candidato a tratamiento?",
      a: "El médico te explicará el motivo. Dependiendo del caso, podría derivarte para evaluación de procedimiento clínico o sugerirte otras alternativas.",
    },
    {
      q: "¿Atienden a mujeres también?",
      a: "Sí. El cuestionario incluye preguntas específicas para mujeres y los médicos están capacitados para evaluar alopecia femenina.",
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Preguntas frecuentes</h2>
        </div>
        <Accordion multiple={false} className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-5 data-open:bg-white"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function SafetyNote() {
  return (
    <section className="bg-accent/50 py-10">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="text-sm text-accent-foreground/80 leading-relaxed">
          <strong className="font-semibold">Aviso médico:</strong> Esta plataforma conecta
          pacientes con médicos y farmacias autorizadas. No realizamos diagnósticos
          automáticos. Un médico revisará tu caso y definirá si corresponde tratamiento.
          La receta se emite solo si es clínicamente apropiado. El medicamento es
          dispensado por farmacia autorizada bajo supervisión médica.
        </p>
        <LinkButton href="/quiz" size="lg" className="mt-6 rounded-full px-8">
          Comenzar evaluación
        </LinkButton>
      </div>
    </section>
  );
}
