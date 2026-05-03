import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOrderByToken(token: string) {
  const { data } = await getAdminDb()
    .from("orders")
    .select("id, status, amount, paid_at")
    .eq("provider_token", token)
    .maybeSingle();
  return data;
}

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let variant: "paid" | "pending" | "failed" | "unknown" = "unknown";
  let orderId: string | null = null;

  if (token) {
    const order = await getOrderByToken(token);
    if (order) {
      orderId = order.id;
      if (order.status === "paid_pending_medical_review") variant = "paid";
      else if (order.status === "payment_failed") variant = "failed";
      else variant = "pending";
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-md px-4 py-16 text-center">
        {variant === "paid" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-green-600">✓</span>
            </div>
            <h1 className="text-2xl font-bold">Pago recibido</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Tu caso quedó pendiente de revisión médica.
            </p>
            <Link
              href={orderId ? `/agendar-consulta?order_id=${orderId}` : "/agendar-consulta"}
              className="mt-6 inline-flex items-center justify-center bg-foreground text-background font-semibold rounded-full py-3 px-6 text-sm hover:opacity-90 transition-opacity"
            >
              Agendar consulta médica
            </Link>
            <div className="mt-3">
              <Link
                href="/success"
                className="text-sm text-muted-foreground hover:underline"
              >
                Ver próximos pasos →
              </Link>
            </div>
          </>
        )}

        {variant === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold">Estamos confirmando tu pago</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Tu pago está siendo confirmado. Te avisaremos apenas quede registrado.
            </p>
          </>
        )}

        {variant === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-red-600">✕</span>
            </div>
            <h1 className="text-2xl font-bold">No pudimos confirmar el pago</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              No pudimos confirmar el pago. Puedes intentarlo nuevamente o hablar con soporte.
            </p>
            <Link
              href="/checkout?plan=inicio"
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              ← Intentar nuevamente
            </Link>
          </>
        )}

        {variant === "unknown" && (
          <>
            <h1 className="text-2xl font-bold">Estado de pago</h1>
            <p className="mt-3 text-muted-foreground">
              No encontramos información sobre este pago.
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
