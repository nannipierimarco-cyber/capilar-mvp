"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { isSkinCarePath } from "@/lib/skinCareRoutes";
import { isDentalPath } from "@/lib/dentalRoutes";
import { cn } from "@/lib/utils";

const DENTAL_COMPARISON_URL = "/dental-care/comparar-presupuesto";

const DENTAL_GUIDE_LINKS = [
  { label: "¿Tu presupuesto está caro?", href: "/dental-care/presupuesto-dental-caro" },
  { label: "Segunda opinión dental", href: "/dental-care/segunda-opinion-presupuesto-dental" },
  { label: "Presupuesto de implantes", href: "/dental-care/comparar-presupuesto-implantes-dentales" },
  { label: "Presupuesto de ortodoncia", href: "/dental-care/comparar-presupuesto-ortodoncia" },
  { label: "Cómo leer tu presupuesto", href: "/dental-care/como-leer-un-presupuesto-dental" },
] as const;

/** Dropdown de guías dentales. Usa <details>/<summary> nativo: funciona con clic y teclado sin estado JS. */
function DentalGuidesMenu({ panelClassName }: { panelClassName: string }) {
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-full px-2 text-sm font-semibold text-[#0C4A6E] transition-colors hover:text-[#0284C7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] [&::-webkit-details-marker]:hidden">
        Guías
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-open:rotate-180">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className={panelClassName}>
        <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0284C7]">
          Guías dentales
        </p>
        <ul className="space-y-0.5">
          {DENTAL_GUIDE_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block min-h-11 rounded-xl px-3 py-2.5 text-sm leading-5 text-slate-700 transition-colors hover:bg-[#F0F9FF] hover:text-[#0284C7]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/** Header exclusivo para /dental-care y /dental — sin enlaces a capilar, skin care ni homepage general. */
function DentalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#BAE6FD] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link href="/dental-care" className="min-w-0 shrink font-semibold tracking-tight text-[#0C4A6E]">
          <span className="hidden text-xl sm:inline">Perfecto Labs — Dental</span>
          <span className="whitespace-nowrap text-lg sm:hidden">Perfecto Dental</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/dental-care" className="text-sm font-semibold text-[#0C4A6E] transition-colors hover:text-[#0284C7]">
            Inicio
          </Link>
          <DentalGuidesMenu panelClassName="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#BAE6FD] bg-white p-2 shadow-lg" />
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="md:hidden">
            <DentalGuidesMenu panelClassName="fixed inset-x-4 top-16 z-50 mt-2 rounded-2xl border border-[#BAE6FD] bg-white p-2 shadow-lg" />
          </div>
          <LinkButton
            href={DENTAL_COMPARISON_URL}
            size="sm"
            className="whitespace-nowrap rounded-full border-0 bg-[#0EA5E9] px-3 text-white hover:bg-[#0284C7] sm:px-5"
          >
            <span className="hidden sm:inline">Comparar gratis</span>
            <span className="sm:hidden">Comparar</span>
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

/** Homepage: hero verde móvil incluye su propia barra; ocultar header global solo por debajo de md. */
export default function Header({ hideOnMobile }: { hideOnMobile?: boolean }) {
  const pathname = usePathname();

  if (isDentalPath(pathname)) {
    return <DentalHeader />;
  }

  const hideMapaCapilarCta = isSkinCarePath(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        hideOnMobile && "hidden md:block"
      )}
    >
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl tracking-tight text-primary">
          Perfecto
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/#como-funciona" className="hover:text-foreground transition-colors">
            Cómo funciona
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {!hideMapaCapilarCta && (
            <LinkButton
              href="/mapa-capilar"
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full px-4 border-primary/40 text-primary hover:border-primary hover:bg-accent"
            >
              Mapa Capilar AI
            </LinkButton>
          )}
          <LinkButton href="/quiz" size="sm" className="rounded-full px-5">
            Comenzar evaluación
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
