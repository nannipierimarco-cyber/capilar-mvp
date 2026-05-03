import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Nilo — Salud estética personalizada, desde tu casa",
  description:
    "Evaluaciones online, médicos especialistas y seguimiento inteligente para cuidar tu pelo y tu piel.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <VerticalsSection />
        <TrustBar />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-hero-bg py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hero-eyebrow">
          Plataforma de salud estética
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-hero-headline md:text-5xl">
          Salud estética personalizada,{" "}
          <span className="text-primary">desde tu casa.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-hero-muted">
          Evaluaciones online, médicos especialistas y seguimiento inteligente para cuidar
          tu pelo y tu piel.
        </p>
      </div>
    </section>
  );
}

function VerticalsSection() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          <VerticalCard
            eyebrow="Cabello masculino"
            title="Tu ruta capilar, ordenada y personalizada"
            description="Evalúa tu caída, entiende tu score capilar y accede a una ruta médica personalizada con tratamiento mensual y seguimiento."
            features={[
              "Evaluación capilar online",
              "Consulta médica de 15 min",
              "Tratamiento mensual a domicilio",
              "Score Capilar gratis",
            ]}
            ctaLabel="Evaluar mi cabello"
            ctaHref="/salud-capilar"
            theme="green"
          />
          <VerticalCard
            eyebrow="Piel femenina"
            title="Tu historial de piel, inteligente y continuo"
            description="Evalúa tu piel, crea tu historial inteligente y agenda con una dermatóloga especializada en tu caso."
            features={[
              "Evaluación de piel online",
              "Revisión por dermatóloga",
              "Historial y seguimiento",
              "Skin Copilot por WhatsApp",
            ]}
            ctaLabel="Evaluar mi piel"
            ctaHref="/dermatologia-mujer"
            theme="rose"
          />
        </div>
      </div>
    </section>
  );
}

type VerticalCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  theme: "green" | "rose";
};

function VerticalCard({
  eyebrow,
  title,
  description,
  features,
  ctaLabel,
  ctaHref,
  theme,
}: VerticalCardProps) {
  const isGreen = theme === "green";

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md ${
        isGreen ? "border-border" : "border-rose-100"
      }`}
    >
      {/* Card header band */}
      <div className={`px-8 py-7 ${isGreen ? "bg-primary" : "bg-rose-600"}`}>
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
            isGreen ? "text-primary-foreground/70" : "text-rose-100"
          }`}
        >
          {eyebrow}
        </p>
        <h2
          className={`mt-2 text-2xl font-bold leading-snug ${
            isGreen ? "text-primary-foreground" : "text-white"
          }`}
        >
          {title}
        </h2>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-6 bg-white px-8 py-7">
        <p className="text-muted-foreground leading-relaxed">{description}</p>

        <ul className="space-y-2 text-sm">
          {features.map((feat) => (
            <li key={feat} className="flex items-center gap-2.5">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isGreen
                    ? "bg-accent text-accent-foreground"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                ✓
              </span>
              <span className="text-foreground/80">{feat}</span>
            </li>
          ))}
        </ul>

        <LinkButton
          href={ctaHref}
          className={`mt-auto w-full rounded-full font-semibold ${
            isGreen
              ? ""
              : "border-0 bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {ctaLabel}
        </LinkButton>
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-t border-border bg-muted/40 py-8">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">Siempre con validación profesional.</strong>{" "}
          La IA orienta, los médicos especialistas diagnostican y prescriben.
          Tus datos son tratados con privacidad y seguridad.
        </p>
      </div>
    </section>
  );
}
