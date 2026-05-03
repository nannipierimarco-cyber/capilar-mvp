"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { type PatientStatus, STATUS_LABELS } from "@/lib/types";

const ALL_STATUSES: PatientStatus[] = [
  "lead",
  "completed_quiz",
  "paid",
  "consultation_scheduled",
  "medically_reviewed",
  "prescription_sent",
  "pharmacy_ordered",
  "shipped",
  "active_subscription",
  "referred_to_clinic",
  "prp_closed",
  "transplant_closed",
  "not_eligible",
];

export function StatusUpdater({
  intakeId,
  currentStatus,
  currentNotes,
}: {
  intakeId: string;
  currentStatus: PatientStatus;
  currentNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PatientStatus>(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("intakes")
      .update({ status, admin_notes: notes })
      .eq("id", intakeId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.refresh();
    }, 1500);
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h2 className="font-semibold mb-4">Gestión interna</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Estado del paciente</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors text-left ${
                  status === s
                    ? "border-primary bg-accent text-accent-foreground font-semibold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Notas internas</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del médico, coordinación con farmacia, seguimiento..."
            rows={3}
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className="rounded-full px-6"
        >
          {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
