"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "heic", "heif"];
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]/20 transition-colors";

type Step = "upload" | "details";

type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  landing_path: string | null;
  referrer: string | null;
};

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function guessContentType(file: File): string {
  if (file.type) return file.type;
  return MIME_BY_EXTENSION[fileExtension(file.name)] ?? "application/octet-stream";
}

function fireLead() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Lead");
  }
}

export default function CompararPresupuestoPage() {
  const ph = usePostHog();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const attributionRef = useRef<Attribution>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    landing_path: null,
    referrer: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    attributionRef.current = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      fbclid: params.get("fbclid"),
      landing_path: window.location.pathname,
      referrer: document.referrer || null,
    };
    ph?.capture("LandingView");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startUpload = useCallback(
    async (candidate: File) => {
      setUploadError(null);

      const ext = fileExtension(candidate.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError("Formato no permitido. Usa PDF, JPG, PNG, WEBP o HEIC.");
        return;
      }
      if (candidate.size > MAX_BYTES) {
        setUploadError("El archivo pesa demasiado. Máximo 20MB.");
        return;
      }

      setFile(candidate);
      setUploading(true);
      ph?.capture("QuoteUploadStarted");

      try {
        const initRes = await fetch("/api/dental/quote-comparison/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: candidate.name, fileSize: candidate.size }),
        });
        const initData = (await initRes.json().catch(() => ({}))) as {
          path?: string;
          token?: string;
          error?: string;
        };
        if (!initRes.ok || !initData.path || !initData.token) {
          setUploadError(initData.error ?? "No se pudo iniciar la subida. Intenta nuevamente.");
          return;
        }

        const supabase = createClient();
        const { error: uploadErr } = await supabase.storage
          .from("dental-quotes")
          .uploadToSignedUrl(initData.path, initData.token, candidate, {
            contentType: guessContentType(candidate),
          });

        if (uploadErr) {
          console.error("[comparar-presupuesto] upload failed:", uploadErr);
          setUploadError("No se pudo subir el archivo. Intenta nuevamente.");
          return;
        }

        setStoragePath(initData.path);
        ph?.capture("QuoteUploadCompleted");
        setStep("details");
      } catch {
        setUploadError("Error de red. Verifica tu conexión e intenta nuevamente.");
      } finally {
        setUploading(false);
      }
    },
    [ph]
  );

  function resetFile() {
    setFile(null);
    setStoragePath(null);
    setUploadError(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!patientName.trim() || patientName.trim().length < 3) {
      setSubmitError("Ingresa tu nombre y apellido");
      return;
    }
    if (phoneDigits.length !== 8) {
      setSubmitError("Ingresa un WhatsApp válido");
      return;
    }
    if (!storagePath || !file) {
      setSubmitError("Vuelve a subir tu cotización");
      setStep("upload");
      return;
    }
    if (!consent) {
      setSubmitError("Debes aceptar los términos para continuar");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dental/quote-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          patient_phone: `+56 9 ${phoneDigits}`,
          storage_path: storagePath,
          original_file_name: file.name,
          original_file_mime_type: guessContentType(file),
          original_file_size: file.size,
          consent: true,
          ...attributionRef.current,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; step?: string };

      if (!res.ok) {
        const stepLabel: Record<string, string> = {
          parse: "Error al leer la solicitud",
          database: "Error guardando tu solicitud",
          file_missing: "No pudimos confirmar tu archivo subido",
        };
        const prefix = data.step ? stepLabel[data.step] : null;
        setSubmitError(
          prefix ? `${prefix}. Intenta nuevamente.` : (data.error ?? "Error al enviar. Intenta nuevamente.")
        );
        return;
      }

      ph?.capture("QuoteLeadSubmitted");
      fireLead();
      setSubmitted(true);
    } catch {
      setSubmitError("Error de red. Verifica tu conexión e intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-[#F0F9FF]">
      <Header />
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full py-10 md:py-14 px-4">
          <div className="w-full max-w-md mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0EA5E9] text-center mb-3">
              Comparación de presupuestos dentales
            </p>

            {submitted ? (
              <SuccessState />
            ) : (
              <>
                <div className="text-center mb-5">
                  <h1 className="text-3xl font-bold tracking-tight text-[#0C4A6E] leading-snug">
                    ¿Ya tienes una cotización dental?
                  </h1>
                  <p className="mt-3 text-base leading-relaxed text-gray-600">
                    Súbela y busca una alternativa a un precio más competitivo.
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#0284C7]">
                    Gratis · Sin compromiso · Respuesta en menos de 24 h
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Revisamos tu presupuesto y consultamos clínicas dentales seleccionadas. Recibes la
                    alternativa directamente por WhatsApp.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#BAE6FD] p-6 shadow-sm">
                  {step === "upload" ? (
                    <UploadStep
                      dragOver={dragOver}
                      setDragOver={setDragOver}
                      uploading={uploading}
                      uploadError={uploadError}
                      fileInputRef={fileInputRef}
                      onFileChosen={startUpload}
                    />
                  ) : (
                    <DetailsStep
                      file={file}
                      onChangeFile={resetFile}
                      patientName={patientName}
                      setPatientName={setPatientName}
                      phoneDigits={phoneDigits}
                      setPhoneDigits={setPhoneDigits}
                      consent={consent}
                      setConsent={setConsent}
                      submitting={submitting}
                      submitError={submitError}
                      onSubmit={handleSubmit}
                    />
                  )}
                </div>

                <TrustRow />
              </>
            )}
          </div>
        </section>

        {!submitted && (
          <>
            <HowItWorksSection />
            <WhyUsSection />
            <ExampleSection />
            <FaqSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function UploadStep({
  dragOver,
  setDragOver,
  uploading,
  uploadError,
  fileInputRef,
  onFileChosen,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  uploading: boolean;
  uploadError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChosen: (file: File) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-[#0C4A6E] text-center">Sube tu cotización dental</h2>
      <p className="text-sm text-gray-500 text-center mt-1 mb-4">Foto, PDF o screenshot</p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
        }}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFileChosen(f);
        }}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors disabled:opacity-60 ${
          dragOver ? "border-[#0EA5E9] bg-[#F0F9FF]" : "border-gray-200 hover:border-[#0EA5E9]"
        }`}
      >
        {uploading ? (
          <span className="flex flex-col items-center gap-2 text-[#0EA5E9]">
            <span className="w-6 h-6 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin inline-block" />
            <span className="text-sm font-medium">Subiendo tu cotización…</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span className="text-3xl">📎</span>
            <span className="text-sm font-semibold text-[#0EA5E9]">Subir mi cotización gratis</span>
            <span className="text-xs text-gray-400">
              PDF, JPG, PNG, WEBP o HEIC · máx. 20MB · arrastra o selecciona
            </span>
          </span>
        )}
      </button>

      {uploadError && (
        <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {uploadError}
        </div>
      )}
    </div>
  );
}

function DetailsStep({
  file,
  onChangeFile,
  patientName,
  setPatientName,
  phoneDigits,
  setPhoneDigits,
  consent,
  setConsent,
  submitting,
  submitError,
  onSubmit,
}: {
  file: File | null;
  onChangeFile: () => void;
  patientName: string;
  setPatientName: (v: string) => void;
  phoneDigits: string;
  setPhoneDigits: (v: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-[#0EA5E9] bg-[#F0F9FF] px-4 py-3">
          <span className="text-lg flex-shrink-0">
            {fileExtension(file.name) === "pdf" ? "📄" : "🖼️"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0C4A6E] truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={onChangeFile}
            className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
          >
            Cambiar
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          ¿A qué WhatsApp te enviamos la alternativa? <span className="text-[#0EA5E9]">*</span>
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
            onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className={`flex-1 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          ¿Cómo te llamas? <span className="text-[#0EA5E9]">*</span>
        </label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="María González"
          className={inputClass}
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0EA5E9] accent-[#0EA5E9] flex-shrink-0 cursor-pointer"
        />
        <label htmlFor="consent" className="text-xs leading-relaxed text-gray-500 cursor-pointer">
          Acepto que Perfecto Labs revise mi cotización y comparta la información necesaria con clínicas
          asociadas para buscar una alternativa. Usamos tus datos únicamente para gestionar esta solicitud.
        </label>
      </div>

      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {submitError}
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
          "Comparar mi cotización gratis"
        )}
      </button>
      <p className="text-xs text-center text-gray-400">
        Gratis · Sin compromiso · Recibes la alternativa por WhatsApp
      </p>
    </form>
  );
}

function TrustRow() {
  return (
    <div className="mt-5">
      <div className="grid grid-cols-3 gap-2 text-center">
        {["100% gratis", "Sin compromiso", "Respuesta < 24 h"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-[#BAE6FD] bg-white px-2 py-3 text-xs font-medium text-[#0C4A6E]"
          >
            <span className="block text-[#0EA5E9] text-base mb-1">✓</span>
            {label}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">
        Usamos tus datos únicamente para gestionar tu solicitud y buscar una alternativa dental.
      </p>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="bg-white rounded-2xl border border-[#BAE6FD] p-8 text-center shadow-sm">
      <div className="text-5xl mb-5">🦷</div>
      <h2 className="text-2xl font-bold text-[#0C4A6E] leading-snug">
        ¡Listo! Ya recibimos tu cotización
      </h2>
      <p className="mt-3 text-base leading-relaxed text-gray-600">
        Vamos a revisar tu presupuesto y buscar una alternativa. Te contactaremos por WhatsApp.
      </p>
      <p className="mt-4 text-xs text-gray-400">
        Nuestro objetivo es responder en menos de 24 horas.
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

function HowItWorksSection() {
  const steps = [
    { number: "01", title: "Sube tu cotización", desc: "Puede ser una foto, screenshot o PDF." },
    {
      number: "02",
      title: "La revisamos",
      desc: "Identificamos el tratamiento y consultamos clínicas seleccionadas.",
    },
    { number: "03", title: "Recibe una alternativa", desc: "Te la enviamos directamente por WhatsApp." },
  ];

  return (
    <section className="w-full bg-white py-14 md:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center md:text-3xl">
          Así funciona
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-5">
              <span className="text-3xl font-bold leading-none text-[#0EA5E9]/30">{step.number}</span>
              <h3 className="mt-2 text-sm font-semibold leading-snug text-[#0C4A6E]">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUsSection() {
  return (
    <section className="w-full bg-[#F0F9FF] py-14 md:py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-[#0C4A6E] md:text-3xl">
          ¿Por qué podemos conseguirte otra alternativa?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-600">
          Trabajamos con clínicas dentales que buscan recibir nuevos pacientes. Revisamos tu tratamiento
          y consultamos alternativas competitivas por ti.
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
          Tú decides si alguna alternativa te interesa. No existe obligación de contratar.
        </p>
      </div>
    </section>
  );
}

function ExampleSection() {
  return (
    <section className="w-full bg-white py-14 md:py-16">
      <div className="mx-auto max-w-md px-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center md:text-3xl">
          Ejemplo de comparación
        </h2>
        <div className="mt-8 rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Cotización actual</p>
            <p className="mt-1 text-sm text-gray-700">Implante + corona</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">$1.250.000</p>
          </div>
          <div className="my-4 text-center text-2xl text-[#0EA5E9]">↓</div>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#0284C7]">Alternativa</p>
            <p className="mt-1 text-sm text-gray-700">Clínica seleccionada</p>
            <p className="mt-1 text-2xl font-bold text-[#0284C7]">$890.000</p>
          </div>
          <div className="mt-5 rounded-xl bg-white border border-[#BAE6FD] px-4 py-3 text-center">
            <p className="text-xs font-medium text-gray-500">Ahorro potencial</p>
            <p className="mt-0.5 text-lg font-bold text-[#0C4A6E]">$360.000</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-center text-gray-400">
          Ejemplo ilustrativo. Los precios y tratamientos dependen de la evaluación de cada clínica.
        </p>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  { q: "¿El servicio realmente es gratis?", a: "Sí. Comparar tu cotización no tiene costo para ti." },
  { q: "¿Tengo que contratar la alternativa?", a: "No. Tú decides libremente si quieres avanzar." },
  { q: "¿Qué puedo subir?", a: "Una foto, screenshot o PDF de tu cotización dental." },
  {
    q: "¿Cuándo recibiré una respuesta?",
    a: "Nuestro objetivo es enviarte una alternativa en menos de 24 horas cuando exista una opción disponible.",
  },
  { q: "¿Qué hacen con mis datos?", a: "Los usamos para gestionar tu solicitud y buscar una alternativa dental." },
];

function FaqSection() {
  return (
    <section className="w-full bg-[#F0F9FF] py-14 md:py-16">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center md:text-3xl mb-6">
          Preguntas frecuentes
        </h2>
        <div className="rounded-2xl border border-[#BAE6FD] bg-white px-6">
          <Accordion>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-[#0C4A6E]">{item.q}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
