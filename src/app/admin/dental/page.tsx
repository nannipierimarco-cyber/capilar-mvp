import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface DentalPatientRow {
  id: string;
  nombre: string | null;
  telefono: string;
  email: string;
  answers: Record<string, string> | null;
  analysis: Record<string, unknown> | null;
  overall_score: number | null;
  urgency_level: string | null;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  contacted: "Contactado",
  converted: "Convertido",
};

const STATUS_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-600",
  contacted: "bg-amber-100 text-amber-700",
  converted: "bg-green-100 text-green-700",
};

const URGENCY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const URGENCY_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-emerald-100 text-emerald-700",
};

const INTERES_LABELS: Record<string, string> = {
  alinear: "Alinear dientes",
  color: "Mejorar color / sonrisa",
  reparar: "Reparar dientes",
  implantar: "Implante / pieza faltante",
  encias: "Encías / sonrisa gingival",
  orientacion: "Orientación general",
};

function getPhotos(analysis: Record<string, unknown> | null): { frontal?: string; abierta?: string } {
  const photos = analysis?._photos as { frontal?: string; abierta?: string } | undefined;
  return photos ?? {};
}

function getInteres(answers: Record<string, string> | null): string {
  const key = answers?.queQuieresResolver;
  if (!key) return "—";
  return INTERES_LABELS[key] ?? key;
}

export default async function DentalAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; fotos?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  const { q, estado, fotos } = await searchParams;
  const supabase = getAdminClient();

  let query = supabase
    .from("dental_patients")
    .select("id, nombre, telefono, email, answers, analysis, overall_score, urgency_level, status, created_at")
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("status", estado);
  if (q) query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  let rows = (data ?? []) as DentalPatientRow[];

  if (fotos === "ambas") {
    rows = rows.filter((r) => {
      const p = getPhotos(r.analysis);
      return Boolean(p.frontal && p.abierta);
    });
  } else if (fotos === "sin") {
    rows = rows.filter((r) => {
      const p = getPhotos(r.analysis);
      return !p.frontal;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#0EA5E9] uppercase">
              Perfecto Labs · Admin
            </span>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Evaluación dental por IA
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{rows.length} paciente{rows.length !== 1 ? "s" : ""}</span>
            <Link
              href="/admin"
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
            Error cargando pacientes: {error.message}
          </div>
        )}

        {/* Búsqueda y filtros */}
        <form className="flex flex-wrap items-center gap-3 mb-4" action="/admin/dental" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, teléfono o email…"
            className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0EA5E9] bg-white"
          />
          <select
            name="estado"
            defaultValue={estado ?? ""}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="">Todos los estados</option>
            <option value="lead">Lead</option>
            <option value="contacted">Contactado</option>
            <option value="converted">Convertido</option>
          </select>
          <select
            name="fotos"
            defaultValue={fotos ?? ""}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="">Todas las fotos</option>
            <option value="ambas">Con ambas fotos</option>
            <option value="sin">Sin foto frontal</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] transition-colors"
          >
            Filtrar
          </button>
          {(q || estado || fotos) && (
            <Link href="/admin/dental" className="text-xs font-medium text-gray-400 hover:text-gray-600">
              Limpiar
            </Link>
          )}
        </form>

        {rows.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-2xl mb-2">🦷</p>
            <p className="text-sm">No hay pacientes todavía.</p>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Interés principal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Urgencia</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fotos</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((p) => {
                    const status = p.status ?? "lead";
                    const photos = getPhotos(p.analysis);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("es-CL", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {p.nombre || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                          {p.telefono}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {p.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {getInteres(p.answers)}
                        </td>
                        <td className="px-4 py-3">
                          {p.urgency_level ? (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${URGENCY_COLORS[p.urgency_level] ?? "bg-gray-100 text-gray-600"}`}>
                              {URGENCY_LABELS[p.urgency_level] ?? p.urgency_level}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {photos.frontal && photos.abierta ? "Frontal + abierta" : photos.frontal ? "Solo frontal" : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/dental/${p.id}`}
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
