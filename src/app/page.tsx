import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Globe,
  ShieldCheck,
  Tag,
  Activity,
  Lock,
  MessageCircle,
} from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import Footer from "@/components/layout/Footer";
import { ValuePropMarquee } from "@/components/ValuePropMarquee";

export const metadata: Metadata = {
  title: "Nilo — Salud estética personalizada, desde tu casa",
  description:
    "Evaluaciones online, médicos especialistas y seguimiento inteligente para cuidar tu pelo y tu piel sin pasos innecesarios.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <main className="flex-1">
        <HeroSection />
        <ValuePropMarquee />
        <TrustBar />
        <HairCareBlock />
        <SkinCareBlock />
      </main>
      <Footer />
    </div>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="bg-hero-mobile-bg text-white">
      <div className="mx-auto max-w-5xl px-4">
        {/* Inline nav */}
        <nav className="flex items-center justify-between py-5">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white"
          >
            Nilo
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/score-capilar"
              className="hidden text-xs font-semibold text-white/80 border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors sm:inline"
            >
              Score Capilar Gratis
            </Link>
            <LinkButton
              href="/quiz"
              size="sm"
              className="rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              Comenzar →
            </LinkButton>
          </div>
        </nav>

        {/* Content */}
        <div className="pb-10 pt-8 text-center md:pb-14 md:pt-10">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/90">
              Atención especializada 100% online
            </span>
          </div>

          {/* Title */}
          <h1 className="mx-auto mt-6 max-w-2xl text-[2.6rem] font-bold leading-[1.05] tracking-[-0.03em] md:text-6xl">
            Salud estética, redefinida para la{" "}
            <span className="text-hero-mobile-accent">vida real.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/70 md:text-lg">
            Evaluaciones online, médicos especialistas y seguimiento inteligente
            para cuidar tu pelo y tu piel sin pasos innecesarios.
          </p>

          {/* Category cards */}
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <CategoryCard
              href="#hair-care"
              label="Hair Care"
              imageSrc="/hombre3.jpg"
              imageAlt="Cuidado capilar"
              imagePosition="object-top"
            />
            <CategoryCard
              href="#skin-care"
              label="Skin Care"
              imageSrc={null}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

type CategoryCardProps = {
  href: string;
  label: string;
  imageSrc: string | null;
  imageAlt?: string;
  imagePosition?: string;
};

function CategoryCard({
  href,
  label,
  imageSrc,
  imageAlt = "",
  imagePosition = "object-center",
}: CategoryCardProps) {
  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/15 cursor-pointer"
    >
      {/* Visual area */}
      <div className="relative h-48 overflow-hidden sm:h-52">
        {imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className={`${imagePosition} object-cover transition-transform duration-500 group-hover:scale-105`}
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          </>
        ) : (
          <>
            {/* Premium mauve gradient for Skin Care */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3d1120] via-[#6b1f3a] to-[#9b3060]" />
            <div className="absolute -left-4 -top-4 h-36 w-36 rounded-full bg-white/8" />
            <div className="absolute -bottom-6 -right-6 h-44 w-44 rounded-full bg-white/5" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        )}

        {/* Bottom label */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-5">
          <span className="text-lg font-bold text-white">{label}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 transition-colors group-hover:bg-white/25">
            <ArrowRight className="size-4 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </a>
  );
}

/* ─── TRUST BAR ──────────────────────────────────────────────────────────── */

const trustItems = [
  { icon: Globe, label: "100% online" },
  { icon: Tag, label: "Precios claros" },
  { icon: ShieldCheck, label: "Médicos especialistas" },
  { icon: Activity, label: "Seguimiento inteligente" },
  { icon: Lock, label: "Privacidad y seguridad" },
  { icon: MessageCircle, label: "Atención guiada" },
];

function TrustBar() {
  return (
    <section className="border-b border-border bg-background py-7">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">
          {trustItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              <span className="whitespace-nowrap font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HAIR CARE BLOCK ────────────────────────────────────────────────────── */

const hairBullets = [
  "Ingredientes respaldados clínicamente",
  "Enfoque en cuero cabelludo y folículo",
  "Ruta para prevenir caída o evaluar trasplante",
  "Seguimiento simple y directo",
];

function HairCareBlock() {
  return (
    <section id="hair-care" className="scroll-mt-4 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col gap-8 md:flex-row md:gap-10 lg:gap-14">

          {/* Left column: main image + benefits — second on mobile, first on desktop */}
          <div className="order-2 shrink-0 md:order-1 md:w-[290px] lg:w-[330px]">
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-sm">
              <Image
                src="/hombre2.jpg"
                alt="Tratamiento capilar masculino"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 330px"
              />
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-accent/40 p-6">
              <p className="text-sm font-semibold leading-snug text-foreground">
                Soporte personalizado para resultados capilares duraderos
              </p>
              <ul className="mt-4 space-y-2.5">
                {hairBullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column: eyebrow + title + portraits + text + CTA — first on mobile */}
          <div className="order-1 flex flex-1 flex-col gap-5 md:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/50">
              Targeted Hair Restoration
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.6rem]">
              Cuidado probado para la caída y la regeneración capilar
            </h2>

            {/* Two portrait images */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm">
                <Image
                  src="/hombre1.jpg"
                  alt="Resultado capilar"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 45vw, 22vw"
                />
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm">
                <Image
                  src="/hombre4.jpg"
                  alt="Tratamiento capilar"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 45vw, 22vw"
                />
              </div>
            </div>

            {/* Text + CTA */}
            <p className="leading-relaxed text-muted-foreground">
              Evalúa tu caída, entiende tu score capilar y descubre si hoy
              necesitas prevenir, tratar o evaluar una solución más avanzada.
            </p>
            <div>
              <LinkButton href="/salud-capilar" className="rounded-full px-8">
                Conocer Hair Care
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SKIN CARE BLOCK ────────────────────────────────────────────────────── */

const skinBullets = [
  "Evaluación inicial online",
  "Revisión por dermatóloga",
  "Historial inteligente de tu piel",
  "Seguimiento y orientación por WhatsApp",
  "Derivación cuando corresponde",
];

function SkinCareBlock() {
  return (
    <section id="skin-care" className="scroll-mt-4 bg-muted/40 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col gap-8 md:flex-row md:gap-10 lg:gap-14">

          {/* Left column: main "image" + benefits — second on mobile, first on desktop */}
          <div className="order-2 shrink-0 md:order-1 md:w-[290px] lg:w-[330px]">
            {/* Skin Care premium gradient tile */}
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-sm bg-gradient-to-br from-[#8b2252] via-[#b52d6a] to-[#d45c86]">
              <div className="absolute -left-6 -top-6 h-36 w-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -right-4 h-28 w-28 rounded-full bg-white/8" />
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="absolute bottom-5 left-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Skin health
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-6">
              <p className="text-sm font-semibold leading-snug text-foreground">
                Todo lo que necesitas para tomar mejores decisiones sobre tu piel
              </p>
              <ul className="mt-4 space-y-2.5">
                {skinBullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-500">
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column — first on mobile */}
          <div className="order-1 flex flex-1 flex-col gap-5 md:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400">
              Personalized Skin Guidance
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.6rem]">
              Skin care más simple, guiado por dermatología
            </h2>

            {/* Two portrait tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm bg-gradient-to-br from-[#fce7ef] to-[#f9d0e2]">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-200/50 blur-2xl" />
                <div className="absolute bottom-8 left-4 h-20 w-20 rounded-full bg-pink-200/40 blur-xl" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-1 w-8 rounded-full bg-rose-200/60" />
                </div>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm bg-gradient-to-br from-[#f9d5e8] to-[#fde8f2]">
                <div className="absolute -left-4 top-4 h-28 w-28 rounded-full bg-rose-100/60 blur-2xl" />
                <div className="absolute bottom-6 right-4 h-16 w-16 rounded-full bg-pink-100/70 blur-xl" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-1 w-12 rounded-full bg-rose-200/50" />
                </div>
              </div>
            </div>

            {/* Text + CTA */}
            <p className="leading-relaxed text-muted-foreground">
              Organiza tu historial, entiende mejor tu piel y recibe una ruta
              clara para dudas de skincare, acné, manchas, sensibilidad o
              seguimiento de tratamientos.
            </p>
            <div>
              <LinkButton
                href="/dermatologia-mujer"
                className="rounded-full border-0 bg-rose-600 px-8 text-white hover:bg-rose-700"
              >
                Conocer Skin Care
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
