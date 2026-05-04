"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface TestResult {
  reply: string;
  riskLevel: "green" | "yellow" | "red";
  action: string;
  note?: string;
}

const SAMPLE_MESSAGES = [
  "¿Qué es el ácido hialurónico?",
  "¿Puedo usar retinol si tengo la piel sensible?",
  "Me salió un granito, ¿qué puedo hacer sin irritarme?",
  "¿Puedo mezclar vitamina C con ácido glicólico?",
  "¿Qué medicamento tomo para el acné?",
  "Tengo la cara muy hinchada y me arde mucho",
];

const riskConfig = {
  green: {
    label: "GREEN",
    classes: "bg-green-50 border-green-200 text-green-800",
    dot: "bg-green-500",
  },
  yellow: {
    label: "YELLOW",
    classes: "bg-yellow-50 border-yellow-200 text-yellow-800",
    dot: "bg-yellow-500",
  },
  red: {
    label: "RED",
    classes: "bg-red-50 border-red-200 text-red-800",
    dot: "bg-red-500",
  },
};

export default function SkinCopilotTestPage() {
  const [phone, setPhone] = useState("+56912345678");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/skin-copilot/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setResult(data as TestResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-xl px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Internal tool
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              Skin Copilot — Test Console
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Simula una conversación con el asistente sin necesitar WhatsApp real.
              Los mensajes se guardan en Supabase si está configurado.
            </p>
          </div>

          {/* Sample messages */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mensajes de prueba
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_MESSAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMessage(s)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground/70 hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56912345678"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Mensaje</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="¿Puedo usar retinol si tengo la piel sensible?"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Enviar mensaje →"}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-6 space-y-3">
              {/* Risk badge */}
              <div
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold ${riskConfig[result.riskLevel].classes}`}
              >
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${riskConfig[result.riskLevel].dot}`}
                />
                <span>
                  {riskConfig[result.riskLevel].label} — {result.action}
                </span>
              </div>

              {/* Reply */}
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Respuesta del asistente
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.reply}</p>
              </div>

              {/* Dev note */}
              {result.note && (
                <p className="text-xs text-muted-foreground">{result.note}</p>
              )}
            </div>
          )}

          {/* Links */}
          <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground space-y-1">
            <p>
              Endpoints:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">POST /api/skin-copilot/test-chat</code>{" "}
              ·{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">GET /api/skin-copilot/profile</code>
            </p>
            <p>
              Webhook:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">GET|POST /api/whatsapp/webhook</code>
            </p>
            <p className="mt-2">
              <Link href="/" className="underline hover:text-foreground">
                ← Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
