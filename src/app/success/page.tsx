import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const NEXT_STEPS = [
  "Un médico revisará tu evaluación.",
  "Si corresponde, coordinaremos receta, farmacia autorizada y despacho.",
  "Si el médico necesita más información, te contactaremos.",
  "Si el médico determina que no corresponde avanzar, gestionaremos la devolución del pago.",
];

export default function SuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-md px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-green-600">✓</span>
        </div>
        <h1 className="text-2xl font-bold">Pago recibido</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Tu caso quedó pendiente de revisión médica.
        </p>

        <div className="mt-8">
          <Card className="border-border shadow-none text-left">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold mb-3">Próximos pasos</p>
              {NEXT_STEPS.map((text, i) => (
                <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          ¿Tienes preguntas? Escríbenos por WhatsApp y te respondemos a la brevedad.
        </p>

        <div className="mt-8">
          <LinkButton href="/" variant="ghost" className="text-sm text-muted-foreground">
            ← Volver al inicio
          </LinkButton>
        </div>
      </main>
      <Footer />
    </div>
  );
}
