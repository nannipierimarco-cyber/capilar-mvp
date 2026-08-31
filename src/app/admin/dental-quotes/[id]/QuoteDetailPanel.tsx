"use client";
import { useState } from "react";

interface QuoteRecord {
  id: string;
  patient_name: string | null;
  patient_rut: string | null;
  patient_phone: string;
  patient_email: string | null;
  original_file_url: string | null;
  storage_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  preferred_commune: string | null;
  original_clinic_name: string | null;
  original_quote_amount: number | null;
  main_treatment_type: string | null;
  extracted_summary: string | null;
  extracted_treatments: unknown[] | null;
  missing_information: unknown | null;
  assigned_clinic_id: string | null;
  assigned_doctor_name: string | null;
  partner_quote_amount: number | null;
  partner_quote_details: unknown | null;
  partner_quote_notes: string | null;
  partner_quote_submitted_at: string | null;
  whatsapp_sent_at: string | null;
  appointment_url: string | null;
  clinic_whatsapp_phone: string | null;
  whatsapp_manual_message: string | null;
  whatsapp_manual_sent_at: string | null;
  whatsapp_manual_sent_by: string | null;
  whatsapp_manual_status: string | null;
  clinic_batch_notes: string | null;
}

const STATUS_OPTIONS = [
  { value: "submitted",          label: "Recibido" },
  { value: "in_review",          label: "En revisión" },
  { value: "sent_to_clinic",     label: "Enviado a clínica" },
  { value: "quote_sent",         label: "Cotización enviada" },
  { value: "appointment_booked", label: "Cita agendada" },
  { value: "closed",             label: "Cerrado" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted:          "bg-gray-100 text-gray-600",
  in_review:          "bg-amber-100 text-amber-700",
  sent_to_clinic:     "bg-indigo-100 text-indigo-700",
  quote_sent:         "bg-sky-100 text-sky-700",
  appointment_booked: "bg-green-100 text-green-700",
  closed:             "bg-blue-100 text-blue-700",
};

const WA_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente",  color: "bg-amber-100 text-amber-700" },
  sent:    { label: "Enviado",    color: "bg-green-100 text-green-700" },
  failed:  { label: "Fallido",    color: "bg-red-100 text-red-700" },
};

function isHeicPath(path: string | null): boolean {
  return /\.(heic|heif)$/i.test(path ?? "");
}

function buildPatientWhatsAppMessage(q: QuoteRecord): string {
  const hasPartnerQuote = q.partner_quote_amount || q.partner_quote_notes;

  if (!hasPartnerQuote) {
    return `Hola, somos Perfecto Labs 🦷 Recibimos tu cotización dental y ya la estamos revisando. Te enviaremos una alternativa por este WhatsApp en menos de 24 horas.`;
  }

  const lines: string[] = [
    `Hola, somos Perfecto Labs 🦷`,
    ``,
    `Revisamos tu cotización y tenemos una alternativa para ti:`,
  ];
  if (q.main_treatment_type) lines.push(`📋 Tratamiento: ${q.main_treatment_type}`);
  if (q.partner_quote_amount) lines.push(`💰 Nueva cotización estimada: $${q.partner_quote_amount.toLocaleString("es-CL")}`);
  if (q.assigned_doctor_name) lines.push(`👨‍⚕️ Clínica: ${q.assigned_doctor_name}`);
  if (q.partner_quote_notes)  lines.push(`📝 ${q.partner_quote_notes}`);
  if (q.appointment_url)      lines.push(`📅 Agenda aquí: ${q.appointment_url}`);
  lines.push(``);
  lines.push(`⚠️ La cotización es referencial y sujeta a evaluación presencial.`);
  return lines.join("\n");
}

function buildClinicWhatsAppMessage(q: QuoteRecord, signedFileUrl: string | null): string {
  const lines: string[] = [
    `Hola, nueva cotización dental recibida en Perfecto Labs 🦷`,
    ``,
  ];
  if (q.patient_name)           lines.push(`Paciente: ${q.patient_name}`);
  if (q.patient_phone)          lines.push(`WhatsApp: ${q.patient_phone}`);
  if (q.patient_email)          lines.push(`Email: ${q.patient_email}`);
  if (q.main_treatment_type)    lines.push(`Tratamiento: ${q.main_treatment_type}`);
  if (q.original_clinic_name)   lines.push(`Clínica origen: ${q.original_clinic_name}`);
  if (q.original_quote_amount)  lines.push(`Monto cotizado: $${q.original_quote_amount.toLocaleString("es-CL")}`);
  if (q.preferred_commune)      lines.push(`Comuna: ${q.preferred_commune}`);
  lines.push(``);
  lines.push(`Archivo cotización:`);
  lines.push(signedFileUrl ?? "no disponible");
  lines.push(``);
  lines.push(`Acción sugerida:`);
  lines.push(`Revisar la cotización adjunta y responder con una alternativa referencial, indicando precio estimado, qué incluye, qué no incluye y si requiere evaluación presencial.`);
  return lines.join("\n");
}

export default function QuoteDetailPanel({
  quote,
  signedFileUrl,
  signedFileUrlError,
}: {
  quote: QuoteRecord;
  signedFileUrl: string | null;
  signedFileUrlError: boolean;
}) {
  const [fields, setFields] = useState({
    patient_name:            quote.patient_name ?? "",
    preferred_commune:       quote.preferred_commune ?? "",
    original_clinic_name:    quote.original_clinic_name ?? "",
    original_quote_amount:   quote.original_quote_amount?.toString() ?? "",
    main_treatment_type:     quote.main_treatment_type ?? "",
    assigned_clinic_id:      quote.assigned_clinic_id ?? "",
    assigned_doctor_name:    quote.assigned_doctor_name ?? "",
    partner_quote_amount:    quote.partner_quote_amount?.toString() ?? "",
    partner_quote_notes:     quote.partner_quote_notes ?? "",
    appointment_url:         quote.appointment_url ?? "",
    status:                  quote.status ?? "submitted",
    clinic_whatsapp_phone:   quote.clinic_whatsapp_phone ?? "",
    whatsapp_manual_message: quote.whatsapp_manual_message ?? buildClinicWhatsAppMessage(quote, signedFileUrl),
    clinic_batch_notes:      quote.clinic_batch_notes ?? "",
  });

  const [waManualStatus, setWaManualStatus] = useState(quote.whatsapp_manual_status ?? "");
  const [waManualSentAt, setWaManualSentAt] = useState(quote.whatsapp_manual_sent_at ?? "");

  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [markError, setMarkError]     = useState<string | null>(null);

  function update(field: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...fields,
        original_quote_amount: fields.original_quote_amount ? parseInt(fields.original_quote_amount) : null,
        partner_quote_amount:  fields.partner_quote_amount  ? parseInt(fields.partner_quote_amount)  : null,
      };
      const res = await fetch(`/api/admin/dental-quotes/${quote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function handleCopyPatientWhatsApp() {
    const msg = buildPatientWhatsAppMessage({ ...quote, ...fields,
      original_quote_amount: fields.original_quote_amount ? parseInt(fields.original_quote_amount) : null,
      partner_quote_amount: fields.partner_quote_amount ? parseInt(fields.partner_quote_amount) : null,
    } as QuoteRecord);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  async function handleMarkSent() {
    setMarkingSent(true);
    setMarkError(null);
    const now = new Date().toISOString();
    // Advance the main status too, but never downgrade one that's already further along.
    const shouldAdvanceStatus = fields.status === "submitted" || fields.status === "in_review";
    try {
      const res = await fetch(`/api/admin/dental-quotes/${quote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_manual_sent_at: now,
          whatsapp_manual_sent_by: "admin",
          whatsapp_manual_status:  "sent",
          whatsapp_manual_message: fields.whatsapp_manual_message,
          clinic_whatsapp_phone:   fields.clinic_whatsapp_phone,
          clinic_batch_sent_at:    now,
          clinic_batch_notes:      fields.clinic_batch_notes,
          ...(shouldAdvanceStatus ? { status: "sent_to_clinic" } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setWaManualStatus("sent");
      setWaManualSentAt(now);
      if (shouldAdvanceStatus) update("status", "sent_to_clinic");
    } catch (e) {
      setMarkError(e instanceof Error ? e.message : "Error al marcar como enviado");
    } finally {
      setMarkingSent(false);
    }
  }

  const cleanPhone = fields.clinic_whatsapp_phone.replace(/\D/g, "");
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fields.whatsapp_manual_message)}`
    : "";

  const statusColorClass = STATUS_COLORS[fields.status] ?? STATUS_COLORS.submitted;
  const waStatusCfg = WA_STATUS_CONFIG[waManualStatus] ?? null;

  return (
    <div className="space-y-5">
      {/* Read-only patient info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Información del paciente</h2>

        {quote.patient_name && <Row label="Nombre" value={quote.patient_name} />}
        {quote.patient_rut && <Row label="RUT" value={quote.patient_rut} />}
        <Row label="WhatsApp" value={quote.patient_phone} />
        {quote.patient_email && <Row label="Email" value={quote.patient_email} />}
        {quote.original_clinic_name && <Row label="Clínica original" value={quote.original_clinic_name} />}
        {quote.original_quote_amount != null && (
          <Row
            label="Monto cotizado"
            value={`$${quote.original_quote_amount.toLocaleString("es-CL")}`}
          />
        )}
        <Row label="Recibido" value={new Date(quote.created_at).toLocaleDateString("es-CL", {
          day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
        })} />

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cotización original</p>
          {!quote.storage_path ? (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 inline-block">
              ⚠️ Archivo no disponible
            </p>
          ) : signedFileUrlError || !signedFileUrl ? (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 inline-block">
              No se pudo generar el link temporal del archivo.
            </p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={signedFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0EA5E9] hover:underline"
              >
                📎 Ver cotización subida →
              </a>
              {isHeicPath(quote.storage_path) && (
                <span className="text-xs text-gray-400">
                  HEIC image — download to view
                </span>
              )}
            </div>
          )}
        </div>

        {quote.extracted_summary && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Resumen IA</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-sky-50 rounded-xl px-3 py-2.5">{quote.extracted_summary}</p>
          </div>
        )}

        {Array.isArray(quote.extracted_treatments) && quote.extracted_treatments.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tratamientos extraídos</p>
            <pre className="text-xs bg-gray-50 rounded-xl px-3 py-2.5 overflow-x-auto">
              {JSON.stringify(quote.extracted_treatments, null, 2)}
            </pre>
          </div>
        )}

        {quote.missing_information != null && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Información faltante</p>
            <pre className="text-xs bg-amber-50 rounded-xl px-3 py-2.5 overflow-x-auto">
              {JSON.stringify(quote.missing_information, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Editable internal fields */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Campos internos</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado">
            <select
              value={fields.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0EA5E9] transition-colors"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Nombre paciente">
            <input type="text" value={fields.patient_name} onChange={(e) => update("patient_name", e.target.value)}
              className={inputClass} placeholder="Nombre" />
          </Field>
          <Field label="Comuna preferida">
            <input type="text" value={fields.preferred_commune} onChange={(e) => update("preferred_commune", e.target.value)}
              className={inputClass} placeholder="Providencia, Las Condes…" />
          </Field>
          <Field label="Clínica original">
            <input type="text" value={fields.original_clinic_name} onChange={(e) => update("original_clinic_name", e.target.value)}
              className={inputClass} placeholder="Nombre de la clínica" />
          </Field>
          <Field label="Monto original (CLP)">
            <input type="number" value={fields.original_quote_amount} onChange={(e) => update("original_quote_amount", e.target.value)}
              className={inputClass} placeholder="350000" />
          </Field>
          <Field label="Tratamiento principal">
            <input type="text" value={fields.main_treatment_type} onChange={(e) => update("main_treatment_type", e.target.value)}
              className={inputClass} placeholder="Ej: Ortodoncia invisible" />
          </Field>
          <Field label="Doctor / Clínica asignada">
            <input type="text" value={fields.assigned_doctor_name} onChange={(e) => update("assigned_doctor_name", e.target.value)}
              className={inputClass} placeholder="Nombre del doctor o clínica partner" />
          </Field>
          <Field label="Monto cotización partner (CLP)">
            <input type="number" value={fields.partner_quote_amount} onChange={(e) => update("partner_quote_amount", e.target.value)}
              className={inputClass} placeholder="280000" />
          </Field>
          <Field label="Link de agendamiento">
            <input type="url" value={fields.appointment_url} onChange={(e) => update("appointment_url", e.target.value)}
              className={inputClass} placeholder="https://calendly.com/…" />
          </Field>
        </div>

        <Field label="Notas cotización partner">
          <textarea value={fields.partner_quote_notes} onChange={(e) => update("partner_quote_notes", e.target.value)}
            rows={3} className={`${inputClass} resize-none`} placeholder="Detalles adicionales de la cotización…" />
        </Field>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-[#0284C7] disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar cambios"}
          </button>

          <button
            onClick={handleCopyPatientWhatsApp}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? "✓ Copiado" : "📋 Copiar mensaje WhatsApp"}
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400">Estado actual:</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColorClass}`}>
            {STATUS_OPTIONS.find((o) => o.value === fields.status)?.label ?? fields.status}
          </span>
        </div>
      </div>

      {/* WhatsApp manual a clínica */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">WhatsApp a clínica</h2>
          {waStatusCfg ? (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${waStatusCfg.color}`}>
              {waStatusCfg.label}
            </span>
          ) : (
            <span className="text-xs text-gray-300 px-2.5 py-1">Sin enviar</span>
          )}
        </div>

        {waManualSentAt && (
          <p className="text-xs text-gray-400">
            Enviado el {new Date(waManualSentAt).toLocaleDateString("es-CL", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}

        <Field label="WhatsApp de la clínica (con código de país)">
          <input
            type="tel"
            value={fields.clinic_whatsapp_phone}
            onChange={(e) => update("clinic_whatsapp_phone", e.target.value)}
            className={inputClass}
            placeholder="56998765432"
          />
          <p className="mt-1 text-xs text-gray-400">Sin espacios ni guiones. Ej: 56998765432</p>
        </Field>

        <Field label="Mensaje para la clínica">
          <textarea
            value={fields.whatsapp_manual_message}
            onChange={(e) => update("whatsapp_manual_message", e.target.value)}
            rows={8}
            className={`${inputClass} resize-y font-mono text-xs`}
          />
        </Field>

        <Field label="Notas internas">
          <textarea
            value={fields.clinic_batch_notes}
            onChange={(e) => update("clinic_batch_notes", e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Notas para el equipo interno (no se envían al paciente ni a la clínica)…"
          />
        </Field>

        {markError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{markError}</p>
        )}

        <div className="flex items-center gap-3">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 inline-flex items-center justify-center rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
            >
              Abrir WhatsApp
            </a>
          ) : (
            <div className="flex-1 h-10 inline-flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed">
              Ingresa número primero
            </div>
          )}

          <button
            onClick={handleMarkSent}
            disabled={markingSent || waManualStatus === "sent"}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {markingSent ? "Guardando…" : waManualStatus === "sent" ? "✓ Marcado como enviado" : "Marcar como enviado"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors bg-white";

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
