"use client";

import { useState, useEffect } from "react";

interface Props {
  vertical: string;
  calendlyUrl: string;
  doctorId?: string;
  doctorName?: string;
  reportId?: string;
}

type Step = "email" | "booking" | "done";

export function CalendlyEmbedBooking({ vertical, calendlyUrl, doctorId, doctorName, reportId }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [syncing, setSyncing] = useState(false);

  const embedUrl =
    `${calendlyUrl}?embed_type=Inline&hide_gdpr_banner=1&hide_landing_page_details=1` +
    (email ? `&email=${encodeURIComponent(email)}` : "");

  useEffect(() => {
    if (step !== "booking") return;

    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://calendly.com") return;

      let msg: Record<string, unknown>;
      try {
        msg =
          typeof e.data === "string"
            ? (JSON.parse(e.data) as Record<string, unknown>)
            : (e.data as Record<string, unknown>);
      } catch {
        return;
      }

      if (msg.event !== "calendly.event_scheduled") return;

      const payload = msg.payload as Record<string, unknown> | undefined;
      const eventUri = (payload?.event as Record<string, unknown> | undefined)
        ?.uri as string | undefined;
      const inviteeUri = (payload?.invitee as Record<string, unknown> | undefined)
        ?.uri as string | undefined;

      if (!eventUri || !inviteeUri) return;

      setSyncing(true);
      fetch("/api/appointments/calendly-embed-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventUri, inviteeUri, vertical, doctorId, doctorName, reportId }),
      })
        .catch(() => {
          // HubSpot sync failure does not block UX — booking already confirmed in Calendly
          console.error("[calendly-embed] backend sync failed — booking still confirmed in Calendly");
        })
        .finally(() => {
          setSyncing(false);
          setStep("done");
        });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [step, email, vertical, doctorId, doctorName, reportId]);

  if (step === "done") {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-lg">¡Cita agendada!</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Recibirás un email de confirmación en{" "}
          <span className="font-medium">{email}</span>.
        </p>
      </div>
    );
  }

  if (step === "booking") {
    return (
      <div className="space-y-3">
        {syncing && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            Registrando tu cita…
          </p>
        )}
        <iframe
          src={embedUrl}
          width="100%"
          height="700"
          frameBorder="0"
          title="Agendar consulta"
          className="rounded-xl border border-border block"
        />
      </div>
    );
  }

  // Step: email — collect before opening embed so Calendly pre-fills it
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setStep("booking");
      }}
      className="space-y-5"
    >
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
      <button
        type="submit"
        className="w-full rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Ver disponibilidad →
      </button>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Esta solicitud no garantiza receta ni tratamiento. El especialista revisará tu caso.
      </p>
    </form>
  );
}
