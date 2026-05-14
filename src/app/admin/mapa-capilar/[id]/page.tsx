import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminToken } from "@/lib/admin/auth";
import { createClient } from "@supabase/supabase-js";

interface HairMapAnalysis {
  id: string;
  concern: string | null;
  goal: string | null;
  status: string | null;
  analysis_json: Record<string, unknown> | null;
  photo_frontal_url: string | null;
  photo_crown_url: string | null;
  created_at: string;
}

interface PatientWithAnalysis {
  id: string;
  email: string;
  phone: string;
  age: number | null;
  created_at: string;
  hair_map_analyses: HairMapAnalysis[];
}

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function MapaCapilarLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!verifyAdminToken(token ?? "")) redirect("/admin/login");

  const { id } = await params;
  const db = getAdminDb();

  const { data, error } = await db
    .from("patients")
    .select("id, email, phone, age, created_at, hair_map_analyses(id, concern, goal, status, analysis_json, photo_frontal_url, photo_crown_url, created_at)")
    .eq("id", id)
    .eq("source", "mapa_capilar")
    .single();

  if (error || !data) notFound();

  const patient = data as PatientWithAnalysis;
  const analysis = patient.hair_map_analyses?.[0] ?? null;
  const report = analysis?.analysis_json ?? null;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/admin?tab=mapa-capilar" className="text-sm text-muted-foreground hover:text-foreground">
            ← Mapa Capilar AI
          </Link>
          <div>
            <h1 className="text-xl font-bold">Lead Mapa Capilar</h1>
            <p className="text-sm text-muted-foreground">{patient.email}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Contact */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-3">Datos de contacto</h2>
          <InfoRow label="Email" value={patient.email} />
          <InfoRow label="Teléfono" value={patient.phone} />
          <InfoRow label="Edad" value={patient.age?.toString()} />
          <InfoRow
            label="Fecha"
            value={new Date(patient.created_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
        </div>

        {/* Analysis context */}
        {analysis && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-3">Contexto del análisis</h2>
            <InfoRow label="Preocupación" value={analysis.concern} />
            <InfoRow label="Objetivo" value={analysis.goal} />
            <InfoRow label="Estado análisis" value={analysis.status} />
          </div>
        )}

        {/* Photos */}
        {(analysis?.photo_frontal_url || analysis?.photo_crown_url) && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-3">Fotos subidas</h2>
            <div className="flex gap-3 flex-wrap">
              {analysis.photo_frontal_url && (
                <a
                  href={`/api/mapa-capilar/get-analysis?id=${analysis.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  Ver análisis completo con fotos →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Report JSON */}
        {report && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-3">Reporte AI</h2>
            <ReportSummary report={report} />
          </div>
        )}

        {!analysis && (
          <div className="bg-white rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
            Este lead no tiene un análisis AI vinculado todavía.
          </div>
        )}
      </div>
    </div>
  );
}

function ReportSummary({ report }: { report: Record<string, unknown> }) {
  // Handle both old MapaCapilarReport shape and new HairMapAnalysisReport shape
  const summary = report.summary as Record<string, unknown> | string | undefined;
  const visualAnalysis = report.visualAnalysis as Record<string, unknown> | undefined;
  const zones = report.zones as Record<string, unknown> | undefined;

  return (
    <div className="space-y-3 text-sm">
      {typeof summary === "object" && summary && (
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="font-medium">{String(summary.mainFinding ?? summary.title ?? "")}</p>
          {summary.overallScore != null && (
            <p className="text-xs text-muted-foreground mt-1">Score: {String(summary.overallScore)} / 100 · Confianza: {String(summary.confidence ?? "—")}</p>
          )}
        </div>
      )}
      {typeof summary === "string" && (
        <p className="italic text-muted-foreground">&ldquo;{summary}&rdquo;</p>
      )}
      {visualAnalysis && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(visualAnalysis).map(([k, v]) => (
            <div key={k} className="bg-muted/30 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</p>
              <p className="font-medium text-xs">{String(v)}</p>
            </div>
          ))}
        </div>
      )}
      {zones && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">Zonas</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(zones).map(([k, v]) => {
              const zone = v as Record<string, unknown>;
              return (
                <div key={k} className="bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</p>
                  <p className="font-medium text-xs">{String(zone?.label ?? zone?.status ?? v)}</p>
                  {zone?.score != null && (
                    <p className="text-xs text-muted-foreground">{String(zone.score)}/100</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
