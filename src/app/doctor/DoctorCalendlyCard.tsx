"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type DoctorProfile } from "@/lib/types";

export function DoctorCalendlyCard({ doctor }: { doctor: DoctorProfile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState(doctor.calendly_url ?? "");
  const [availabilityNotes, setAvailabilityNotes] = useState(doctor.availability_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/doctor/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendly_url: calendlyUrl,
          availability_notes: availabilityNotes,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al guardar");
      } else {
        setSaved(true);
        setEditing(false);
        setTimeout(() => {
          setSaved(false);
          router.refresh();
        }, 1200);
      }
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Mi disponibilidad Calendly</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary hover:underline"
          >
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Link Calendly
            </label>
            <input
              type="url"
              value={calendlyUrl}
              onChange={(e) => setCalendlyUrl(e.target.value)}
              placeholder="https://calendly.com/dr-nombre/consulta"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Notas de disponibilidad
            </label>
            <textarea
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              placeholder="Ej: Disponible lunes a viernes 9–13h"
              rows={2}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || saved}
              className="rounded-full"
            >
              {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar"}
            </Button>
            <button
              onClick={() => {
                setEditing(false);
                setCalendlyUrl(doctor.calendly_url ?? "");
                setAvailabilityNotes(doctor.availability_notes ?? "");
                setError(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground shrink-0">Link Calendly</span>
            {doctor.calendly_url ? (
              <a
                href={doctor.calendly_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate max-w-xs"
              >
                {doctor.calendly_url}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          {doctor.availability_notes && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Disponibilidad</span>
              <span className="text-right">{doctor.availability_notes}</span>
            </div>
          )}
          {!doctor.calendly_url && !doctor.availability_notes && (
            <p className="text-muted-foreground text-sm">
              Sin link de agenda configurado. Haz clic en Editar para agregar tu link de Calendly.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
