import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { SkinAssessment } from "@/lib/types";

const PRIORITY_LABELS: Record<string, string> = {
  urgent_review: "Urgente",
  high: "Alta",
  normal: "Normal",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent_review: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  normal: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  reviewed: "Revisado",
  archived: "Archivado",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-emerald-100 text-emerald-700",
  archived: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  acne: "Acné",
  hyperpigmentation: "Manchas oscuras",
  acne_marks_scars: "Marcas de acné",
  oily_pores: "Piel grasa",
  dry_irritated: "Piel seca/irritada",
  rosacea_redness: "Rosácea/rojez",
  texture_aging: "Textura/envejecimiento",
  mole_lesion_review: "Lunares/lesiones",
  wound_non_healing: "Heridas que no sanan",
  other: "Otro",
};

export default async function AdminSkinPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string; status?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  const { priority: filterPriority, status: filterStatus } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("skin_assessments")
    .select("*")
    .order("created_at", { ascending: false });

  if (filterPriority) query = query.eq("priority", filterPriority);
  if (filterStatus) query = query.eq("status", filterStatus);

  const { data } = await query;
  const rows = (data ?? []) as SkinAssessment[];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-semibold text-primary">Perfecto</p>
            <h1 className="text-xl font-bold">Evaluaciones de Piel</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Hair Care
            </Link>
            <Link
              href="/admin/doctors"
              className="hover:text-foreground transition-colors"
            >
              Médicos
            </Link>
            <span className="font-medium text-foreground">{rows.length} casos</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <SkinFilters
          currentPriority={filterPriority}
          currentStatus={filterStatus}
        />

        <div className="mt-4 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Paciente
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Motivo / Categoría
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Prioridad
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Contacto
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                    Fecha
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No hay evaluaciones de piel que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const priorityColor =
                    PRIORITY_COLORS[row.priority ?? "normal"] ??
                    PRIORITY_COLORS.normal;
                  const statusColor =
                    STATUS_COLORS[row.status ?? "new"] ?? STATUS_COLORS.new;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{row.main_concern ?? "—"}</p>
                        {row.skin_category && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {CATEGORY_LABELS[row.skin_category] ?? row.skin_category}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${priorityColor}`}
                        >
                          {PRIORITY_LABELS[row.priority ?? "normal"] ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}
                        >
                          {STATUS_LABELS[row.status ?? "new"] ?? row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        <p>{row.phone}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/skin/${row.id}`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkinFilters({
  currentPriority,
  currentStatus,
}: {
  currentPriority?: string;
  currentStatus?: string;
}) {
  const priorities = [
    { value: "", label: "Todas" },
    { value: "urgent_review", label: "Urgente" },
    { value: "high", label: "Alta" },
    { value: "normal", label: "Normal" },
  ];

  const statuses = [
    { value: "", label: "Todos los estados" },
    { value: "new", label: "Nuevo" },
    { value: "reviewed", label: "Revisado" },
    { value: "archived", label: "Archivado" },
  ];

  function buildHref(params: Record<string, string>) {
    const p = new URLSearchParams();
    if (params.priority) p.set("priority", params.priority);
    if (params.status) p.set("status", params.status);
    const qs = p.toString();
    return `/admin/skin${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {priorities.map((p) => (
        <Link
          key={p.value}
          href={buildHref({
            priority: p.value,
            status: currentStatus ?? "",
          })}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            (currentPriority ?? "") === p.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white border-border hover:border-primary/50"
          }`}
        >
          {p.label}
        </Link>
      ))}
      <span className="w-px bg-border mx-1" />
      {statuses.map((s) => (
        <Link
          key={s.value}
          href={buildHref({
            priority: currentPriority ?? "",
            status: s.value,
          })}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            (currentStatus ?? "") === s.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white border-border hover:border-primary/50"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
