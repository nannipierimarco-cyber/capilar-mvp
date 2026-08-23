import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@supabase/supabase-js";
import DentalPatientPanel from "./DentalPatientPanel";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const SIGNED_URL_SECONDS = 3600; // 1 hour — enough for an admin review session

export default async function DentalPatientDetailPage({
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

  const { data: patient, error } = await supabase
    .from("dental_patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) notFound();

  const photos = (patient.analysis as Record<string, unknown> | null)?._photos as
    { frontal?: string; abierta?: string } | undefined;

  let frontalUrl: string | null = null;
  let abiertaUrl: string | null = null;

  if (photos?.frontal) {
    const { data } = await supabase.storage.from("patient-photos").createSignedUrl(photos.frontal, SIGNED_URL_SECONDS);
    frontalUrl = data?.signedUrl ?? null;
  }
  if (photos?.abierta) {
    const { data } = await supabase.storage.from("patient-photos").createSignedUrl(photos.abierta, SIGNED_URL_SECONDS);
    abiertaUrl = data?.signedUrl ?? null;
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
              Detalle paciente dental
            </h1>
          </div>
          <Link
            href="/admin/dental"
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Todos los pacientes
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <DentalPatientPanel patient={patient} frontalUrl={frontalUrl} abiertaUrl={abiertaUrl} />
      </div>
    </div>
  );
}
