"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type DoctorProfile, type MedicalReview, MEDICAL_REVIEW_STATUS_LABELS } from "@/lib/types";

export function DoctorAssigner({
  intakeId,
  doctors,
  currentReview,
}: {
  intakeId: string;
  doctors: DoctorProfile[];
  currentReview: MedicalReview | null;
}) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState(currentReview?.doctor_id ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedDoctor = doctors.find((d) => d.id === currentReview?.doctor_id);

  async function handleAssign() {
    if (!doctorId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/assign-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_id: intakeId, doctor_id: doctorId }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al asignar");
      } else {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          router.refresh();
        }, 1200);
      }
    } catch {
      setError("Error de red al asignar médico");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h2 className="font-semibold mb-4">Asignación médica</h2>

      {currentReview && (
        <div className="mb-4 p-3 bg-muted/40 rounded-xl text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Estado revisión</span>
            <span className="text-xs font-semibold">
              {MEDICAL_REVIEW_STATUS_LABELS[currentReview.status] ?? currentReview.status}
            </span>
          </div>
          {assignedDoctor && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Médico asignado</span>
                <span className="text-xs font-semibold">{assignedDoctor.full_name}</span>
              </div>
              {assignedDoctor.calendly_url && (
                <div className="pt-1">
                  <a
                    href={assignedDoctor.calendly_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Abrir link Calendly del médico →
                  </a>
                </div>
              )}
            </>
          )}
          {currentReview.consultation_scheduled_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Consulta agendada</span>
              <span className="text-xs">
                {new Date(currentReview.consultation_scheduled_at).toLocaleString("es-CL")}
              </span>
            </div>
          )}
          {currentReview.calendly_event_url && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Evento Calendly</span>
              <a
                href={currentReview.calendly_event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Ver evento →
              </a>
            </div>
          )}
          {currentReview.calendly_invitee_email && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Email invitado</span>
              <span className="text-xs">{currentReview.calendly_invitee_email}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className="flex-1 text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— Seleccionar médico —</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={handleAssign}
          disabled={!doctorId || saving || saved}
          className="rounded-full shrink-0"
        >
          {saved ? "✓ Asignado" : saving ? "Asignando..." : "Asignar"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
