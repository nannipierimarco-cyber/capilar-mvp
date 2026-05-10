"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { type MembershipKey } from "@/lib/plans";

const INCLUDES = [
  "Revisión médica",
  "Receta si corresponde",
  "Producto Farmacia Autorizada",
  "Despacho a domicilio",
  "Seguimiento por WhatsApp + AI",
  "Historial capilar consolidado",
];

const MEMBERSHIPS: {
  key: MembershipKey;
  title: string;
  badge: string | null;
  savingsBadge: string | null;
  monthlyPrice: string;
  total: string;
  desc: string;
}[] = [
  {
    key: "6m",
    title: "6 meses",
    badge: null,
    savingsBadge: "Ahorra 33%",
    monthlyPrice: "$19.990/mes",
    total: "Total $119.940",
    desc: "Para quienes quieren continuidad y mejor precio mensual.",
  },
  {
    key: "3m",
    title: "3 meses",
    badge: "Más popular",
    savingsBadge: "Ahorra 17%",
    monthlyPrice: "$24.990/mes",
    total: "Total $74.970",
    desc: "Para comenzar con seguimiento durante el primer ciclo.",
  },
  {
    key: "1m",
    title: "1 mes",
    badge: null,
    savingsBadge: null,
    monthlyPrice: "$29.990/mes",
    total: "Total $29.990",
    desc: "Para probar el servicio durante el primer mes.",
  },
];

function MembershipContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") ?? "inicio";
  const journey = searchParams.get("journey") ?? "treatment";
  const isTransplant = journey === "transplant";

  const [selected, setSelected] = useState<MembershipKey>("6m");

  function handleContinue() {
    router.push(`/checkout?plan=${plan}&membership=${selected}`);
  }

  // Transplant journey: redirect to checkout without membership selection
  if (isTransplant) {
    return (
      <main className="flex-1 mx-auto w-full max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-3">Evaluación capilar</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Tu evaluación incluye revisión médica, análisis de fotos y orientación sobre el proceso
          adecuado para tu caso. El médico define el siguiente paso.
        </p>
        <LinkButton
          href="/checkout?plan=trasplante"
          className="w-full rounded-full justify-center h-12"
        >
          Continuar a la consulta
        </LinkButton>
      </main>
    );
  }

  return (
    <>
      {/* Sticky bottom CTA — mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
        <Button
          onClick={handleContinue}
          className="w-full rounded-full justify-center h-12 text-base"
        >
          Continuar
        </Button>
      </div>

      <main className="flex-1 mx-auto w-full max-w-md px-4 py-10 pb-32 md:pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold leading-snug">
            Tu ruta recomendada: Plan Inicio Capilar
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Tu plan combina revisión médica, tratamiento sujeto a indicación, farmacia autorizada,
            despacho y seguimiento.
          </p>
        </div>

        {/* Product card */}
        <Card className="rounded-2xl shadow-sm border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-bold text-base">Plan de tratamiento</p>
                <p className="text-sm font-semibold text-primary mt-0.5">
                  Dutasteride + Minoxidil
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Sujeto a revisión médica</p>
              </div>
            </div>
            <div className="relative mb-4 mt-3 w-full overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.04] px-4 py-4 sm:px-5 sm:py-5">
              <div className="relative h-[clamp(200px,min(50vw,340px),340px)] w-full">
                <Image
                  src="/dutasteride-minoxidil.png"
                  alt="Referencia ilustrativa: minoxidil oral y dutasteride, sujetos a receta e indicación médica"
                  fill
                  unoptimized
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, 28rem"
                />
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3 mt-3">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border leading-relaxed">
              El tratamiento final depende exclusivamente de la revisión médica. Perfecto no diagnostica
              ni prescribe automáticamente.
            </p>
          </CardContent>
        </Card>

        <p className="text-base font-semibold text-center pt-1">Elige tu membresía capilar</p>

        {/* Membership options */}
        <div className="space-y-3">
          {MEMBERSHIPS.map((m) => {
            const isSelected = selected === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-foreground bg-foreground/5 shadow-sm"
                    : "border-border bg-white hover:border-foreground/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base">{m.title}</span>
                    {m.badge && (
                      <span className="text-xs font-semibold bg-foreground text-background px-2 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                    )}
                    {m.savingsBadge && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        {m.savingsBadge}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected ? "border-foreground bg-foreground" : "border-border"
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 bg-background rounded-full block" />}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-lg">{m.monthlyPrice}</span>
                  <span className="text-sm text-muted-foreground">{m.total}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground -mt-1">
          El envío se agrega en el siguiente paso.
        </p>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button
            onClick={handleContinue}
            className="w-full rounded-full h-12 text-base"
          >
            Continuar
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pb-4">
          El cargo queda sujeto a revisión médica. Si el médico determina que no corresponde
          avanzar, gestionaremos la devolución del pago.
        </p>

      </main>
    </>
  );
}

export default function MembershipPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Cargando...
          </div>
        }
      >
        <MembershipContent />
      </Suspense>
      <Footer />
    </div>
  );
}
