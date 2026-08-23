import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type Intake, type Patient, STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

const JOURNEY_LABELS = {
  treatment: "Tratamiento",
  transplant: "Trasplante",
  both: "Tratamiento + Trasplante",
};

interface MapaCapilarLead {
  id: string;
  email: string;
  phone: string;
  age: number | null;
  created_at: string;
  hair_map_analyses: {
    id: string;
    goal: string | null;
    concern: string | null;
    status: string | null;
  } | null;
}


export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; journey?: string; tab?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  const { status: filterStatus, journey: filterJourney, tab } = await searchParams;
  const activeTab = tab === "mapa-capilar" ? "mapa-capilar" : "pacientes";

  const supabase = await createClient();

  // Fetch patients (always, for count in header)
  let query = supabase
    .from("intakes")
    .select("*, patients(*)")
    .order("created_at", { ascending: false });

  if (filterStatus) query = query.eq("status", filterStatus);
  if (filterJourney) query = query.eq("journey_type", filterJourney);

  const { data: intakes } = await query;
  const rows = (intakes ?? []) as (Intake & { patients: Patient })[];

  // Fetch mapa-capilar leads when on that tab (from patients table)
  let mapaCapilarLeads: MapaCapilarLead[] = [];
  if (activeTab === "mapa-capilar") {
    const adminDb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await adminDb
      .from("patients")
      .select("id, email, phone, age, created_at, hair_map_analyses(id, goal, concern, status)")
      .eq("source", "mapa_capilar")
      .order("created_at", { ascending: false })
      .limit(200);
    mapaCapilarLeads = (data ?? []) as unknown as MapaCapilarLead[];
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-semibold text-primary">Capilar</p>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/doctors" className="text-sm text-muted-foreground hover:text-foreground">
              Médicos
            </Link>
            <Link href="/admin/dental" className="text-sm text-muted-foreground hover:text-foreground">
              Dental IA
            </Link>
            <Link href="/admin/dental-quotes" className="text-sm text-muted-foreground hover:text-foreground">
              Cotizaciones dentales
            </Link>
            <span className="text-sm text-muted-foreground">{rows.length} pacientes</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-border rounded-xl p-1 w-fit">
          <Link
            href="/admin"
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "pacientes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pacientes
          </Link>
          <Link
            href="/admin?tab=mapa-capilar"
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "mapa-capilar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mapa Capilar AI
          </Link>
        </div>

        {activeTab === "pacientes" && (
          <>
            <Filters currentStatus={filterStatus} currentJourney={filterJourney} />
            <div className="mt-4 bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paciente</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ruta</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                        Teléfono
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
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          No hay pacientes que coincidan con los filtros.
                        </td>
                      </tr>
                    )}
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {row.patients?.first_name} {row.patients?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{row.patients?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs">
                            {JOURNEY_LABELS[row.journey_type] ?? row.journey_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                              STATUS_COLORS[row.status]
                            }`}
                          >
                            {STATUS_LABELS[row.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {row.patients?.phone}
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
                            href={`/admin/patients/${row.id}`}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "mapa-capilar" && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Leads — Mapa Capilar AI</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{mapaCapilarLeads.length} leads registrados</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contacto</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Objetivo
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Edad
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Fecha
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {mapaCapilarLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        No hay leads de Mapa Capilar todavía.
                      </td>
                    </tr>
                  )}
                  {mapaCapilarLeads.map((lead) => {
                    const analysis = Array.isArray(lead.hair_map_analyses)
                      ? lead.hair_map_analyses[0]
                      : lead.hair_map_analyses;
                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{lead.email}</p>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {analysis?.goal ?? analysis?.concern ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {lead.age ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/mapa-capilar/${lead.id}`}
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
        )}
      </div>
    </div>
  );
}

function Filters({
  currentStatus,
  currentJourney,
}: {
  currentStatus?: string;
  currentJourney?: string;
}) {
  const journeys = [
    { value: "", label: "Todas las rutas" },
    { value: "treatment", label: "Tratamiento" },
    { value: "transplant", label: "Trasplante" },
    { value: "both", label: "Ambos" },
  ];

  const statuses = [
    { value: "", label: "Todos los estados" },
    { value: "lead", label: "Lead" },
    { value: "completed_quiz", label: "Quiz completo" },
    { value: "paid", label: "Pagado" },
    { value: "consultation_scheduled", label: "Consulta agendada" },
    { value: "medically_reviewed", label: "Revisado" },
    { value: "active_subscription", label: "Suscripción activa" },
    { value: "referred_to_clinic", label: "Derivado a clínica" },
    { value: "not_eligible", label: "No apto" },
  ];

  function buildHref(params: Record<string, string>) {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    if (params.journey) p.set("journey", params.journey);
    return `/admin?${p.toString()}`;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {journeys.map((j) => (
        <Link
          key={j.value}
          href={buildHref({ status: currentStatus ?? "", journey: j.value })}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            (currentJourney ?? "") === j.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white border-border hover:border-primary/50"
          }`}
        >
          {j.label}
        </Link>
      ))}
      <span className="w-px bg-border mx-1" />
      {statuses.map((s) => (
        <Link
          key={s.value}
          href={buildHref({ status: s.value, journey: currentJourney ?? "" })}
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
