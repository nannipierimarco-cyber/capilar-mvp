import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = {
  title: "Recibimos tu evaluación — Perfecto",
  description: "Tu pre-evaluación dermatológica fue enviada correctamente.",
};

export default function EvaluacionPielGraciasPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Recibimos tu evaluación de piel.
          </h1>

          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Tus respuestas y fotos quedaron guardadas para que el dermatólogo
            pueda revisar tu caso con más contexto antes de la visita.
          </p>

          <p className="mt-3 text-sm text-muted-foreground">
            Este proceso no genera diagnóstico automático. La revisión clínica
            corresponde exclusivamente al dermatólogo.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <LinkButton href="/agendar-consulta" className="rounded-full h-12">
              Agendar visita dermatológica
            </LinkButton>
            <LinkButton
              href="/"
              variant="outline"
              className="rounded-full h-12"
            >
              Volver al inicio
            </LinkButton>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
