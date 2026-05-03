import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Evaluación de Piel — Nilo",
  description: "Evaluación dermatológica online. Próximamente.",
};

export default function EvaluacionPielPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-3xl">
            🌿
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Evaluación de piel
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Pronto podrás completar tu evaluación dermatológica online.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Estamos preparando una experiencia diseñada para ti, con revisión por dermatóloga y seguimiento inteligente.
          </p>
          <LinkButton
            href="/dermatologia-mujer"
            variant="outline"
            className="mt-8 rounded-full px-6"
          >
            ← Volver a dermatología
          </LinkButton>
        </div>
      </main>
      <Footer />
    </div>
  );
}
