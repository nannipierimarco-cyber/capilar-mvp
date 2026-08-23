"use client";
import { useState } from "react";
import type { DentalMapReport } from "@/lib/dental/types";

interface DentalPatientRecord {
  id: string;
  nombre: string | null;
  telefono: string;
  email: string;
  answers: Record<string, string> | null;
  analysis: (Record<string, unknown> & Partial<DentalMapReport>) | null;
  overall_score: number | null;
  urgency_level: string | null;
  status: string;
  doctor_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contactado" },
  { value: "converted", label: "Convertido" },
];

const STATUS_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-600",
  contacted: "bg-amber-100 text-amber-700",
  converted: "bg-green-100 text-green-700",
};

const QUESTION_LABELS: Record<string, string> = {
  queQuieresResolver: "¿Qué quieres resolver?",
  prioridadUsuario: "¿Qué es lo más importante para ti?",
};

const ANSWER_LABELS: Record<string, string> = {
  alinear: "Alinear mis dientes",
  color: "Mejorar el color de mi sonrisa",
  reparar: "Arreglar dientes quebrados o desgastados",
  implantar: "Reemplazar una pieza faltante / implante",
  encias: "Mejorar encías o sonrisa gingival",
  orientacion: "No estoy seguro, quiero orientación",
  saber_costo: "Saber cuánto podría costar",
  saber_tratamiento: "Saber qué tratamiento necesito",
  comparar: "Comparar opciones antes de ir a una clínica",
  financiar: "Encontrar una opción financiable",
  rapido: "Mejorar mi sonrisa lo antes posible",
};

export default function DentalPatientPanel({
  patient,
  frontalUrl,
  abiertaUrl,
}: {
  patient: DentalPatientRecord;
  frontalUrl: string | null;
  abiertaUrl: string | null;
}) {
  const [status, setStatus] = useState(patient.status ?? "lead");
  const [notes, setNotes] = useState(patient.doctor_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dental/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, doctor_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const analysis = patient.analysis;
  const answers = patient.answers ?? {};
  const answerEntries = Object.entries(answers);
  const statusColorClass = STATUS_COLORS[status] ?? STATUS_COLORS.lead;

  return (
    <div className="space-y-5">
      {/* Datos personales */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Datos personales</h2>
        <Row label="Nombre" value={patient.nombre || "— (no recopilado en este flujo)"} />
        <Row label="WhatsApp" value={patient.telefono} />
        <Row label="Email" value={patient.email} />
        <Row
          label="Fecha de registro"
          value={new Date(patient.created_at).toLocaleDateString("es-CL", {
            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        />
      </div>

      {/* Quiz dental */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Quiz dental</h2>
        {answerEntries.length === 0 ? (
          <p className="text-sm text-gray-400">Sin respuestas registradas.</p>
        ) : (
          answerEntries.map(([key, value]) => (
            <div key={key} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
              <p className="text-xs font-semibold text-gray-500">{QUESTION_LABELS[key] ?? key}</p>
              <p className="text-sm text-gray-800 mt-0.5">{ANSWER_LABELS[value] ?? value}</p>
            </div>
          ))
        )}
      </div>

      {/* Archivos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Fotos subidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <PhotoSlot label="Foto frontal" url={frontalUrl} />
          <PhotoSlot label="Boca abierta" url={abiertaUrl} />
        </div>
      </div>

      {/* Análisis AI */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Análisis AI</h2>
          {patient.overall_score != null && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700">
              Score: {patient.overall_score}/100
            </span>
          )}
        </div>

        {!analysis ? (
          <p className="text-sm text-gray-400">No hay análisis disponible.</p>
        ) : (
          <>
            {analysis.summary && (
              <div className="bg-sky-50 rounded-xl px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-900">{analysis.summary.headline}</p>
                <p className="text-xs text-gray-600 mt-1">{analysis.summary.subheadline}</p>
              </div>
            )}

            {Array.isArray(analysis.visualFindings) && analysis.visualFindings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hallazgos visuales</p>
                <div className="space-y-1.5">
                  {analysis.visualFindings.map((f, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-gray-700">{f.label}</span>
                      <span className="text-xs text-gray-400 text-right">{f.visualLevel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(analysis.treatmentOptions) && analysis.treatmentOptions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tratamientos sugeridos</p>
                <div className="space-y-2">
                  {analysis.treatmentOptions.map((t, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                      <p className="text-sm font-medium text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.whyItMayApply}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1">{t.estimatedPriceRangeCLP?.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.disclaimer && (
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-50 pt-3">{analysis.disclaimer}</p>
            )}

            <button
              type="button"
              onClick={() => setShowRawJson((v) => !v)}
              className="text-xs font-medium text-[#0EA5E9] hover:underline"
            >
              {showRawJson ? "Ocultar JSON completo" : "Ver JSON completo (structured output)"}
            </button>
            {showRawJson && (
              <pre className="text-xs bg-gray-50 rounded-xl px-3 py-2.5 overflow-x-auto">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>

      {/* Campos internos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Campos internos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0EA5E9] transition-colors"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notas internas">
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0EA5E9] transition-colors bg-white"
            placeholder="Notas del equipo (no visibles para el paciente)…"
          />
        </Field>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-10 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] disabled:opacity-50 transition-colors"
        >
          {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400">Estado actual:</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColorClass}`}>
            {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function PhotoSlot({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="w-full h-40 object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" />
        </a>
      ) : (
        <div className="w-full h-40 rounded-xl border border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
          <p className="text-xs text-gray-400 text-center px-3">No disponible</p>
        </div>
      )}
    </div>
  );
}
