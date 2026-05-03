"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type MedicalReview, type MedicalReviewStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: MedicalReviewStatus; label: string }[] = [
  { value: "pending_review", label: "Revisión pendiente" },
  { value: "needs_more_info", label: "Solicitar más información" },
  { value: "approved_to_advance", label: "Corresponde avanzar con tratamiento" },
  { value: "not_eligible_online", label: "No corresponde avanzar por este flujo" },
  { value: "referred_to_clinic", label: "Derivar a evaluación clínica" },
  { value: "completed", label: "Consulta completada" },
];

export function MedicalReviewForm({ review }: { review: MedicalReview }) {
  const [status, setStatus] = useState<MedicalReviewStatus>(review.status);
  const [decision, setDecision] = useState(review.medical_decision ?? "");
  const [notes, setNotes] = useState(review.doctor_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/doctor/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: review.id,
          status,
          medical_decision: decision,
          doctor_notes: notes,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al guardar decisión");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="review-status">Estado de la revisión</Label>
        <select
          id="review-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MedicalReviewStatus)}
          className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="medical-decision">Decisión médica</Label>
        <Textarea
          id="medical-decision"
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          placeholder="Describe la decisión clínica para este caso..."
          rows={4}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="doctor-notes">Notas del médico</Label>
        <Textarea
          id="doctor-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas internas, seguimiento, coordinación..."
          rows={3}
          className="mt-1"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</p>
      )}

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3">
          ✓ Decisión médica guardada correctamente.
        </p>
      )}

      <Button onClick={handleSave} disabled={saving || saved} className="rounded-full">
        {saving ? "Guardando..." : "Guardar decisión médica"}
      </Button>
    </div>
  );
}
