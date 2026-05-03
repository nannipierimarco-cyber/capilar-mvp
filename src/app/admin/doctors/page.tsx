import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { type DoctorProfile } from "@/lib/types";
import CreateDoctorForm from "./CreateDoctorForm";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function AdminDoctorsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || token !== process.env.ADMIN_SECRET) {
    redirect("/admin/login");
  }

  const supabase = getAdminClient();

  const [{ data: doctors }, { data: reviews }] = await Promise.all([
    supabase.from("doctor_profiles").select("*").order("full_name"),
    supabase.from("medical_reviews").select("doctor_id"),
  ]);

  const doctorList = (doctors ?? []) as DoctorProfile[];

  const assignedCount = new Map<string, number>();
  for (const r of reviews ?? []) {
    const row = r as { doctor_id: string | null };
    if (row.doctor_id) {
      assignedCount.set(row.doctor_id, (assignedCount.get(row.doctor_id) ?? 0) + 1);
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Admin
          </Link>
          <div>
            <h1 className="text-xl font-bold">Médicos</h1>
            <p className="text-sm text-muted-foreground">{doctorList.length} médico{doctorList.length !== 1 ? "s" : ""} registrado{doctorList.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Create doctor form */}
        <CreateDoctorForm />

        {/* Doctor list */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-base">Doctores registrados</h2>
          </div>
          {doctorList.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay médicos registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Especialidad</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">N° registro</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Calendly</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Pacientes</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorList.map((doc) => (
                    <tr key={doc.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{doc.full_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.email}</p>
                        {doc.availability_notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">{doc.availability_notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {doc.specialty ?? "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {doc.license_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {doc.calendly_url ? (
                          <a
                            href={doc.calendly_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Ver link →
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold">
                          {assignedCount.get(doc.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            doc.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {doc.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
