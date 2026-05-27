"use client";

import { useState } from "react";
import type { VerticalConfig } from "@/lib/appointmentVerticals";

interface Props {
  config: VerticalConfig;
  vertical: string;
  reportId?: string;
}

export function AppointmentBookingForm({ config, vertical, reportId }: Props) {
  const [email, setEmail] = useState("");
  const [service, setService] = useState(config.serviceDefault);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          appointmentStatus: "scheduled",
          service,
          channel: config.hubspotChannel,
          ...(reportId ? { confirmationUrl: `/dental/reporte/${reportId}` } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Error al registrar la cita");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-lg">¡Solicitud recibida!</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Te contactaremos a <span className="font-medium">{email}</span> para confirmar tu cita.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
          Servicio
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        >
          {config.services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Enviando..." : "Solicitar cita"}
      </button>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Esta solicitud no garantiza receta ni tratamiento. El especialista revisará tu caso.
      </p>
    </form>
  );
}
