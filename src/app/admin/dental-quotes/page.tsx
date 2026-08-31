import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@supabase/supabase-js";
import FileLinkButton from "./FileLinkButton";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const STATUS_LABELS: Record<string, string> = {
  submitted:          "Recibido",
  in_review:          "En revisión",
  sent_to_clinic:     "Enviado a clínica",
  quote_sent:         "Cotización enviada",
  appointment_booked: "Cita agendada",
  closed:             "Cerrado",
};

const STATUS_COLORS: Record<string, string> = {
  submitted:          "bg-gray-100 text-gray-600",
  in_review:          "bg-amber-100 text-amber-700",
  sent_to_clinic:     "bg-indigo-100 text-indigo-700",
  quote_sent:         "bg-sky-100 text-sky-700",
  appointment_booked: "bg-green-100 text-green-700",
  closed:             "bg-blue-100 text-blue-700",
};

export default async function DentalQuotesAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  const supabase = getAdminClient();
  const { data: quotes, error } = await supabase
    .from("dental_quote_requests")
    .select("id, patient_name, patient_phone, patient_email, storage_path, original_file_url, status, created_at")
    .order("created_at", { ascending: false });

  const rows = quotes ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#0EA5E9] uppercase">
              Perfecto Labs · Admin
            </span>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Cotizaciones dentales
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{rows.length} solicitud{rows.length !== 1 ? "es" : ""}</span>
            <Link
              href="/admin"
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
            Error cargando solicitudes: {error.message}
          </div>
        )}

        {rows.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm">No hay solicitudes todavía.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Archivo</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((q) => {
                    const status = q.status ?? "submitted";
                    const labelCfg = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(q.created_at).toLocaleDateString("es-CL", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {q.patient_name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                          {q.patient_phone}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {q.patient_email}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${labelCfg}`}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <FileLinkButton
                            quoteId={q.id}
                            hasFile={Boolean(q.storage_path)}
                            fallbackUrl={q.original_file_url}
                          />
                          {/\.(heic|heif)$/i.test(q.storage_path ?? "") && (
                            <div className="text-[10px] text-gray-400 mt-0.5">HEIC — download to view</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/dental-quotes/${q.id}`}
                            className="text-xs font-semibold text-gray-500 hover:text-[#0EA5E9] transition-colors"
                          >
                            Ver detalle →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
