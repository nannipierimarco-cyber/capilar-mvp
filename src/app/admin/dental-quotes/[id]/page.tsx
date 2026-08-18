import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@supabase/supabase-js";
import QuoteDetailPanel from "./QuoteDetailPanel";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function DentalQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const supabase = getAdminClient();

  const { data: quote, error } = await supabase
    .from("dental_quote_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) notFound();

  const SIGNED_URL_SECONDS = 7 * 24 * 3600; // 7 days — long enough for the clinic to open the link from the WhatsApp message
  let signedFileUrl: string | null = null;
  let signedFileUrlError = false;

  if (quote.storage_path) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("dental-quotes")
      .createSignedUrl(quote.storage_path, SIGNED_URL_SECONDS);
    if (signedError || !signedData) {
      console.error("[dental-quotes:detail] createSignedUrl error:", signedError);
      signedFileUrlError = true;
    } else {
      signedFileUrl = signedData.signedUrl;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#0EA5E9] uppercase">
              Perfecto Labs · Admin
            </span>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Detalle de cotización
            </h1>
          </div>
          <Link
            href="/admin/dental-quotes"
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Todas las cotizaciones
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <QuoteDetailPanel quote={quote} signedFileUrl={signedFileUrl} signedFileUrlError={signedFileUrlError} />
      </div>
    </div>
  );
}
