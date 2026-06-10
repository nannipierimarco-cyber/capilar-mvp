"use client";
import { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]/20 transition-colors";

export default function CompararPresupuestoPage() {
  const [patientName, setPatientName]   = useState("");
  const [rut, setRut]                   = useState("");
  const [phoneDigits, setPhoneDigits]   = useState("");
  const [email, setEmail]             = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [consent, setConsent]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [uploadStep, setUploadStep]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUploadStep(null);

    if (!patientName.trim() || patientName.trim().length < 3) {
      setError("Ingresa tu nombre y apellido");
      return;
    }
    if (!rut.trim()) { setError("Ingresa tu RUT"); return; }
    if (phoneDigits.length !== 8) { setError("Ingresa los 8 dígitos de tu celular"); return; }
    if (!email.trim()) { setError("Ingresa tu email"); return; }
    if (!file) { setError("Sube tu cotización"); return; }
    if (file.size > MAX_BYTES) { setError("El archivo no puede superar 4MB"); return; }
    if (!consent) { setError("Debes aceptar los términos para continuar"); return; }

    setSubmitting(true);
    try {
      setUploadStep("Subiendo cotización…");
      const fd = new FormData();
      fd.append("patient_name", patientName.trim());
      fd.append("patient_rut", rut.trim().toUpperCase());
      fd.append("patient_phone", `+56 9 ${phoneDigits}`);
      fd.append("patient_email", email.trim());
      fd.append("original_file", file);
      fd.append("consent", "true");

      const res  = await fetch("/api/dental/quote-comparison", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({})) as { error?: string; step?: string };

      if (!res.ok) {
        const stepLabel: Record<string, string> = {
          parse:     "Error al leer el formulario",
          validate:  "Error de validación",
          read_file: "Error al leer el archivo",
          storage:   "Error al subir el archivo",
          database:  "Error al guardar la solicitud",
        };
        const prefix = data.step ? stepLabel[data.step] ?? data.step : null;
        setError(prefix ? `${prefix}: ${data.error}` : (data.error ?? "Error al enviar. Intenta nuevamente."));
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Error de red. Verifica tu conexión e intenta nuevamente.");
    } finally {
      setSubmitting(false);
      setUploadStep(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-[#F0F9FF]">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        <div className="w-full max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0EA5E9] text-center mb-4">
            Perfecto Labs — Dental
          </p>

          {submitted ? (
            <SuccessState />
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-[#0C4A6E] leading-snug">
                  ¿Ya tienes una cotización dental?
                </h1>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  Súbela y te ayudamos a conseguir una alternativa más conveniente con clínicas verificadas.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Revisamos tu presupuesto y te enviamos una nueva cotización por WhatsApp en menos de 24 horas.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-[#BAE6FD] p-6 space-y-5 shadow-sm"
              >
                {/* Nombre y apellido */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nombre y apellido <span className="text-[#0EA5E9]">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="María González"
                    className={inputClass}
                  />
                </div>

                {/* RUT */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    RUT <span className="text-[#0EA5E9]">*</span>
                  </label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className={inputClass}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    WhatsApp <span className="text-[#0EA5E9]">*</span>
                  </label>
                  <div className="flex gap-2 items-stretch">
                    <span className="shrink-0 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm flex items-center">
                      +56 9
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="12345678"
                      maxLength={8}
                      value={phoneDigits}
                      onChange={(e) =>
                        setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      className={`flex-1 ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email <span className="text-[#0EA5E9]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={inputClass}
                  />
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Sube tu cotización <span className="text-[#0EA5E9]">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">PDF, foto o screenshot · máx. 4MB</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > MAX_BYTES) {
                        setError("El archivo no puede superar 4MB");
                        e.target.value = "";
                        return;
                      }
                      setFile(f);
                      setError(null);
                    }}
                  />

                  {file ? (
                    <div className="flex items-center gap-3 rounded-xl border border-[#0EA5E9] bg-[#F0F9FF] px-4 py-3">
                      <span className="text-lg flex-shrink-0">
                        {file.type === "application/pdf" ? "📄" : "🖼️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0C4A6E] truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl border-2 border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors text-center"
                    >
                      <span className="block text-2xl mb-1">📎</span>
                      Seleccionar archivo
                      <span className="block text-xs mt-1 text-gray-300">PDF, PNG, JPG, WebP · máx. 4MB</span>
                    </button>
                  )}
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0EA5E9] accent-[#0EA5E9] flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="consent" className="text-xs leading-relaxed text-gray-500 cursor-pointer">
                    Acepto que Perfecto Labs revise mi cotización y comparta la información necesaria con clínicas asociadas para generar una alternativa. Entiendo que la cotización final puede requerir evaluación presencial.
                  </label>
                </div>

                {uploadStep && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-600 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block flex-shrink-0" />
                    {uploadStep}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-full bg-[#0EA5E9] text-white text-base font-semibold hover:bg-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      Enviando…
                    </span>
                  ) : (
                    "Recibir cotización por WhatsApp"
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-gray-400 mt-4">
                La cotización puede ser referencial y está sujeta a evaluación presencial.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SuccessState() {
  return (
    <div className="bg-white rounded-2xl border border-[#BAE6FD] p-8 text-center shadow-sm">
      <div className="text-5xl mb-5">🦷</div>
      <h2 className="text-2xl font-bold text-[#0C4A6E] leading-snug">
        Recibimos tu cotización
      </h2>
      <p className="mt-3 text-base leading-relaxed text-gray-600">
        Nuestro equipo la revisará y te enviaremos una alternativa por WhatsApp en menos de 24 horas.
      </p>
      <p className="mt-4 text-xs text-gray-400">
        La cotización puede ser referencial y sujeta a evaluación presencial.
      </p>
      <a
        href="/dental-care"
        className="mt-6 inline-block text-sm font-medium text-[#0EA5E9] hover:text-[#0284C7] underline-offset-4 hover:underline transition-colors"
      >
        Volver a Dental Care
      </a>
    </div>
  );
}
