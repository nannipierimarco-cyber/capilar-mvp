"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { isSkinCarePath } from "@/lib/skinCareRoutes";
import { isDentalPath } from "@/lib/dentalRoutes";
import { cn } from "@/lib/utils";

/** Homepage: hero verde móvil incluye su propia barra; ocultar header global solo por debajo de md. */
export default function Header({ hideOnMobile }: { hideOnMobile?: boolean }) {
  const pathname = usePathname();
  const isDental = isDentalPath(pathname);
  const hideMapaCapilarCta = isSkinCarePath(pathname) || isDental;

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
          {!isDental && (
            <LinkButton href="/quiz" size="sm" className="rounded-full px-5">
              Comenzar evaluación
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
