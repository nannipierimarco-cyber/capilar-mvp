"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getMembershipPlan, SHIPPING_AMOUNT, formatCLP } from "@/lib/plans";

const PLAN_FEATURES = [
  "Revisión médica",
  "Receta si corresponde",
  "Producto Farmacia Autorizada",
  "Despacho a domicilio",
  "Seguimiento por WhatsApp + AI",
  "Historial capilar consolidado",
];

const FAQ_ITEMS = [
  {
    q: "¿Me están cobrando antes de la revisión médica?",
    a: "Sí. El pago reserva tu plan y activa la revisión médica. Si el médico determina que no corresponde avanzar, gestionaremos la devolución.",
  },
  {
    q: "¿La receta está garantizada?",
    a: "No. La receta y el tratamiento dependen exclusivamente del criterio médico.",
  },
  {
    q: "¿Quién prepara o dispensa el tratamiento?",
    a: "Una farmacia autorizada, solo cuando existe indicación médica.",
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "inicio";
  const membershipParam = searchParams.get("membership") ?? null;
  const isTransplant = planParam === "trasplante";

  const membership = getMembershipPlan(membershipParam);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setIntakeId(localStorage.getItem("capilar_intake_id"));
  }, []);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/flow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "inicio",
          membership: membershipParam ?? "1m",
          intake_id: intakeId,
        }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Error al iniciar el pago. Inténtalo nuevamente.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Error de red. Inténtalo nuevamente o contacta soporte.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransplant() {
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/success";
    }, 800);
  }

  if (isTransplant) {
    return (
      <main className="flex-1 mx-auto w-full max-w-md px-4 py-10 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Evaluación clínica</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sin costo. Un médico revisa tu caso y te orienta sobre el proceso.
          </p>
        </div>
        <Card className="rounded-2xl shadow-sm border-border bg-accent/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm leading-relaxed">
              Tu evaluación incluye revisión médica, análisis de fotos y antecedentes. El médico
              define el siguiente paso adecuado para tu caso.
            </p>
          </CardContent>
        </Card>
        <Button
          onClick={handleTransplant}
          disabled={loading}
          className="w-full rounded-full h-12"
        >
          {loading ? "Enviando solicitud..." : "Solicitar evaluación clínica"}
        </Button>
        <div className="text-center">
          <LinkButton href="/" variant="ghost" className="text-sm text-muted-foreground">
            ← Volver al inicio
          </LinkButton>
        </div>
      </main>
    );
  }

  const subtotal = membership?.subtotal ?? 29990;
  const total = subtotal + SHIPPING_AMOUNT;
  const membershipLabel = membership?.label ?? "Membresía 1 mes";

  return (
    <main className="flex-1 mx-auto w-full max-w-md px-4 py-10 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ya casi terminamos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revisa tu pedido y confirma para ir al pago.
        </p>
      </div>

      {/* Plan summary */}
      <Card className="rounded-2xl shadow-sm border-border">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
            Tu plan
          </p>
          <p className="font-bold">Plan Inicio Perfecto</p>
          <p className="text-sm text-muted-foreground mt-0.5 mb-3">
            Dutasteride + Minoxidil, sujeto a revisión médica
          </p>
          <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.04] px-4 py-4 sm:px-5 sm:py-5">
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
          <div className="inline-block bg-foreground text-background text-xs font-semibold px-2.5 py-1 rounded-full mb-4">
            {membershipLabel}
          </div>
          <ul className="space-y-1.5">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Price breakdown */}
      <Card className="rounded-2xl shadow-sm border-border">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
            Resumen de pago
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{membershipLabel}</span>
              <span className="font-medium">{formatCLP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Envío</span>
              <span className="font-medium">{formatCLP(SHIPPING_AMOUNT)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border mt-1">
              <span>Total</span>
              <span>{formatCLP(total)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            El costo de envío se agrega al final del pedido.
          </p>
        </CardContent>
      </Card>

      {/* Compliance card */}
      <Card className="rounded-2xl shadow-sm border-border bg-accent/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm leading-relaxed">
            Reserva tu plan. El cargo queda sujeto a revisión médica. Si el médico determina que no
            corresponde avanzar, no activaremos el tratamiento y gestionaremos la devolución del pago.
          </p>
        </CardContent>
      </Card>

      {/* Consent checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-foreground shrink-0"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          He leído y acepto el consentimiento médico informado, los términos y condiciones y la
          política de privacidad.
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* CTA */}
      <div className="space-y-3 pb-6">
        <Button
          onClick={handlePay}
          disabled={loading || !consented}
          className="w-full rounded-full h-12 text-base"
        >
          {loading ? "Redirigiendo a Flow..." : "Ir al pago"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Los medicamentos son prescritos solo si corresponde y dispensados por farmacia autorizada.
        </p>
      </div>

      {/* FAQ accordion */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Preguntas frecuentes
        </p>
        <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {FAQ_ITEMS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none text-sm font-medium select-none">
                <span>{q}</span>
                <span className="text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="text-center pb-4">
        <LinkButton href="/membership?plan=inicio&journey=treatment" variant="ghost" className="text-sm text-muted-foreground">
          ← Cambiar membresía
        </LinkButton>
      </div>

    </main>
  );
}

export default function CheckoutPage() {
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
        <CheckoutContent />
      </Suspense>
      <Footer />
    </div>
  );
}
