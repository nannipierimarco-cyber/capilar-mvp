"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ── Step type & progress ──────────────────────────────────────

type SkinStep =
  | "hero"
  | "concern"
  | "areas"
  | "evolution"
  | "lesion"
  | "symptoms"
  | "photos"
  | "routine"
  | "treatments"
  | "history"
  | "redflags"
  | "goals"
  | "notes"
  | "contact"
  | "submitting";

const STEP_PROGRESS: Record<SkinStep, number> = {
  hero: 0,
  concern: 8,
  areas: 16,
  evolution: 24,
  lesion: 31,
  symptoms: 38,
  photos: 46,
  routine: 54,
  treatments: 62,
  history: 70,
  redflags: 78,
  goals: 84,
  notes: 90,
  contact: 95,
  submitting: 98,
};

// ── Form data ─────────────────────────────────────────────────

interface SkinFormData {
  main_concern: string;
  affected_areas: string[];
  duration: string;
  progression: string;
  lesion_description: string[];
  concern_score: number;
  symptoms: string[];
  current_routine: string[];
  active_ingredients_frequency: string;
  irritation_from_routine: string;
  previous_treatments: string[];
  previous_treatment_response: string;
  pregnancy_status: string;
  medical_conditions: string[];
  current_medications: string;
  current_medications_note: string;
  allergies: string;
  allergies_note: string;
  red_flags: string[];
  main_goal: string;
  preference: string;
  additional_notes: string;
  full_name: string;
  email: string;
  phone: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  sex_at_birth: string;
}

type SkinFormSetter = <K extends keyof SkinFormData>(key: K, value: SkinFormData[K]) => void;

const INITIAL_FORM: SkinFormData = {
  main_concern: "",
  affected_areas: [],
  duration: "",
  progression: "",
  lesion_description: [],
  concern_score: 5,
  symptoms: [],
  current_routine: [],
  active_ingredients_frequency: "",
  irritation_from_routine: "",
  previous_treatments: [],
  previous_treatment_response: "",
  pregnancy_status: "",
  medical_conditions: [],
  current_medications: "",
  current_medications_note: "",
  allergies: "",
  allergies_note: "",
  red_flags: [],
  main_goal: "",
  preference: "",
  additional_notes: "",
  full_name: "",
  email: "",
  phone: "",
  age: "",
  weight_kg: "",
  height_cm: "",
  sex_at_birth: "",
};

const URGENT_FLAGS = new Set([
  "Fiebre",
  "Dolor fuerte",
  "Hinchazón rápida",
  "Pus abundante",
  "Lesión cerca del ojo",
  "Herida que no sana",
  "Sangrado espontáneo",
  "Mancha/lunar que cambió rápido",
  "Lunar con varios colores",
  "Lunar irregular/asimétrico",
  "Picazón o dolor persistente en una lesión",
]);

// ── Reusable UI atoms ──────────────────────────────────────────

function OptionBtn({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left border rounded-2xl px-4 py-3.5 text-sm transition-all",
        selected
          ? "border-primary bg-accent ring-1 ring-primary text-accent-foreground font-medium"
          : "border-border hover:border-primary/50 bg-white"
      )}
    >
      {label}
    </button>
  );
}

function SingleSelect({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <OptionBtn
          key={opt}
          label={opt}
          selected={value === opt}
          onClick={() => onChange(opt)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function MultiSelect({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    const isExclusive = opt === "Ninguno" || opt === "Ninguna";
    if (isExclusive) {
      onChange(values.includes(opt) ? [] : [opt]);
      return;
    }
    const base = values.filter((v) => v !== "Ninguno" && v !== "Ninguna");
    onChange(base.includes(opt) ? base.filter((v) => v !== opt) : [...base, opt]);
  }
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <OptionBtn
          key={opt}
          label={opt}
          selected={values.includes(opt)}
          onClick={() => toggle(opt)}
        />
      ))}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      ← Volver
    </button>
  );
}

function StepLabel({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
      Paso {current} de {total}
    </p>
  );
}

// ── Step sub-components ────────────────────────────────────────

function PhotoStep({
  photos,
  setPhotos,
  onContinue,
  onBack,
}: {
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue = photos.length >= 2;
  const canAdd = photos.length < 8;

  function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 8 - photos.length;
    setPhotos((prev) => [...prev, ...files.slice(0, remaining)]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <StepLabel current={6} total={13} />
      <h2 className="text-2xl font-bold mb-1">Fotos de tu piel</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Mínimo 2 fotos, máximo 8. Sin filtros, con buena luz natural.
      </p>

      <div className="bg-accent/60 rounded-xl p-3 mb-5 text-xs text-accent-foreground/80 space-y-0.5">
        <p className="font-medium mb-1">Para el rostro:</p>
        <p>• Foto frontal completa • Perfil izquierdo y derecho</p>
        <p>• Foto cercana de la zona afectada • Con luz natural, sin filtro</p>
        <p className="mt-1.5 font-medium">Para lesiones puntuales:</p>
        <p>• Foto cercana enfocada • Foto más lejana para ver ubicación</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {photos.map((file, i) => (
          <div
            key={i}
            className="relative border-2 border-primary/50 bg-accent/60 rounded-2xl p-2 flex flex-col items-center justify-center text-center min-h-[90px]"
          >
            <span className="text-xl">✓</span>
            <p className="text-[10px] font-semibold mt-1 text-primary truncate w-full text-center px-1">
              {file.name.length > 14 ? file.name.slice(0, 14) + "…" : file.name}
            </p>
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1.5 text-[11px] text-muted-foreground hover:text-destructive leading-none"
            >
              ✕
            </button>
          </div>
        ))}
        {canAdd && (
          <label className="border-2 border-dashed border-border rounded-2xl p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[90px]">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleAdd}
            />
            <span className="text-2xl text-muted-foreground">+</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Agregar</p>
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        {photos.length < 2
          ? `Agrega al menos ${2 - photos.length} foto${2 - photos.length > 1 ? "s" : ""} más para continuar`
          : `${photos.length} foto${photos.length > 1 ? "s" : ""} lista${photos.length > 1 ? "s" : ""}`}
      </p>

      <Button onClick={onContinue} disabled={!canContinue} className="w-full rounded-full h-12">
        Continuar
      </Button>
      <BackBtn onClick={onBack} />
    </div>
  );
}

function HistoryStep({
  formData,
  set,
  onContinue,
  onBack,
}: {
  formData: SkinFormData;
  set: SkinFormSetter;
  onContinue: () => void;
  onBack: () => void;
}) {
  const showMedicalConditions = !!formData.pregnancy_status;
  const showMedications = showMedicalConditions && formData.medical_conditions.length > 0;
  const showAllergies =
    showMedications &&
    !!formData.current_medications &&
    (formData.current_medications !== "Sí, los escribiré" || true);

  const canContinue =
    !!formData.pregnancy_status &&
    formData.medical_conditions.length > 0 &&
    !!formData.current_medications &&
    !!formData.allergies;

  return (
    <div>
      <StepLabel current={9} total={13} />
      <h2 className="text-2xl font-bold mb-6 leading-snug">Antecedentes médicos</h2>

      <p className="text-sm font-semibold mb-3">
        ¿Estás embarazada, buscando embarazo o lactando?
      </p>
      <SingleSelect
        options={[
          "No",
          "Sí, embarazada",
          "Sí, buscando embarazo",
          "Sí, lactando",
          "Prefiero hablarlo con el médico",
          "No aplica",
        ]}
        value={formData.pregnancy_status}
        onChange={(v) => set("pregnancy_status", v)}
      />

      {showMedicalConditions && (
        <>
          <p className="text-sm font-semibold mt-6 mb-3">
            ¿Tienes alguna condición médica relevante?
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Puedes seleccionar más de una opción.
          </p>
          <MultiSelect
            options={[
              "Ninguna",
              "Alergias",
              "Asma / dermatitis atópica",
              "Diabetes",
              "Enfermedad autoinmune",
              "Problemas hormonales",
              "SOP / ovario poliquístico",
              "Enfermedad hepática",
              "Enfermedad renal",
              "Otra",
              "Prefiero hablarlo con el médico",
            ]}
            values={formData.medical_conditions}
            onChange={(v) => set("medical_conditions", v)}
          />
        </>
      )}

      {showMedications && (
        <>
          <p className="text-sm font-semibold mt-6 mb-3">¿Tomas medicamentos actualmente?</p>
          <SingleSelect
            options={[
              "No",
              "Sí, los escribiré",
              "Prefiero subir foto",
              "Prefiero hablarlo con el médico",
            ]}
            value={formData.current_medications}
            onChange={(v) => set("current_medications", v)}
          />
          {formData.current_medications === "Sí, los escribiré" && (
            <Input
              value={formData.current_medications_note}
              onChange={(e) => set("current_medications_note", e.target.value)}
              placeholder="Ej: metformina, anticonceptivos, omeprazol…"
              className="mt-3"
            />
          )}
        </>
      )}

      {showAllergies && (
        <>
          <p className="text-sm font-semibold mt-6 mb-3">
            ¿Tienes alergias a medicamentos o productos?
          </p>
          <SingleSelect
            options={["No", "Sí", "No sé"]}
            value={formData.allergies}
            onChange={(v) => set("allergies", v)}
          />
          {formData.allergies === "Sí" && (
            <Input
              value={formData.allergies_note}
              onChange={(e) => set("allergies_note", e.target.value)}
              placeholder="¿A qué? (opcional)"
              className="mt-3"
            />
          )}
        </>
      )}

      {canContinue && (
        <Button onClick={onContinue} className="w-full mt-6 rounded-full h-12">
          Continuar
        </Button>
      )}
      <BackBtn onClick={onBack} />
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  age?: string;
  weight_kg?: string;
  height_cm?: string;
}

function ContactStep({
  formData,
  set,
  onSubmit,
  onBack,
}: {
  formData: SkinFormData;
  set: SkinFormSetter;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<ContactErrors>({});

  function validate(): boolean {
    const e: ContactErrors = {};
    if (!formData.full_name.trim()) e.full_name = "El nombre es obligatorio.";
    if (!EMAIL_RE.test(formData.email.trim())) e.email = "Ingresa un email válido.";
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 7)
      e.phone = "Ingresa un número de WhatsApp válido.";
    if (formData.age && isNaN(parseInt(formData.age, 10)))
      e.age = "Ingresa una edad válida.";
    if (formData.weight_kg && isNaN(parseFloat(formData.weight_kg)))
      e.weight_kg = "Ingresa un peso válido (kg).";
    if (formData.height_cm && isNaN(parseFloat(formData.height_cm)))
      e.height_cm = "Ingresa una altura válida (cm).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div>
      <StepLabel current={13} total={13} />
      <h2 className="text-2xl font-bold mb-1">Tus datos de contacto</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Para que el dermatólogo pueda revisar tu caso y contactarte.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="sk-name">Nombre completo</Label>
          <Input
            id="sk-name"
            value={formData.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="name"
            className="mt-1.5"
          />
          {errors.full_name && (
            <p className="text-xs text-destructive mt-1">{errors.full_name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sk-email">Email</Label>
          <Input
            id="sk-email"
            type="email"
            value={formData.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            className="mt-1.5"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sk-phone">WhatsApp</Label>
          <Input
            id="sk-phone"
            type="tel"
            inputMode="tel"
            value={formData.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+56 9 1234 5678"
            autoComplete="tel"
            className="mt-1.5"
          />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="sk-age">Edad</Label>
            <Input
              id="sk-age"
              type="number"
              inputMode="numeric"
              value={formData.age}
              onChange={(e) => set("age", e.target.value)}
              placeholder="25"
              className="mt-1.5"
            />
            {errors.age && (
              <p className="text-xs text-destructive mt-1">{errors.age}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sk-weight">Peso (kg)</Label>
            <Input
              id="sk-weight"
              type="number"
              inputMode="decimal"
              value={formData.weight_kg}
              onChange={(e) => set("weight_kg", e.target.value)}
              placeholder="65"
              className="mt-1.5"
            />
            {errors.weight_kg && (
              <p className="text-xs text-destructive mt-1">{errors.weight_kg}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sk-height">Altura (cm)</Label>
            <Input
              id="sk-height"
              type="number"
              inputMode="decimal"
              value={formData.height_cm}
              onChange={(e) => set("height_cm", e.target.value)}
              placeholder="165"
              className="mt-1.5"
            />
            {errors.height_cm && (
              <p className="text-xs text-destructive mt-1">{errors.height_cm}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Sexo asignado al nacer</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Opcional. Puede ser relevante para el dermatólogo.
          </p>
          <SingleSelect
            options={["Masculino", "Femenino", "Prefiero no responder"]}
            value={formData.sex_at_birth}
            onChange={(v) => set("sex_at_birth", v)}
          />
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Tus datos son confidenciales y se usan solo para que el dermatólogo pueda revisar tu caso.
      </p>

      <Button
        onClick={() => {
          if (validate()) onSubmit();
        }}
        className="w-full mt-6 rounded-full h-12"
      >
        Enviar pre-evaluación
      </Button>
      <BackBtn onClick={onBack} />
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────

function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex-1">
      <section className="bg-[#F5F0EC]">
        <div className="mx-auto max-w-lg px-4 pb-12 pt-8 sm:px-6">
          <Link href="/" className="block font-semibold text-xl tracking-tight mb-8">
            Perfecto
          </Link>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
            Pre-evaluación dermatológica
          </p>
          <h1 className="mx-auto mt-4 max-w-sm text-center text-4xl font-bold leading-tight tracking-tight sm:max-w-none sm:text-5xl">
            Evaluación de piel{" "}
            <span className="text-primary">personalizada</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-snug text-foreground/70">
            Responde algunas preguntas, sube fotos y ayuda al dermatólogo a
            revisar tu caso con más contexto antes de la visita.
          </p>
          <div className="mx-auto mt-8 w-full max-w-sm">
            <Button
              onClick={onStart}
              className="h-14 w-full rounded-full px-8 text-base font-semibold"
            >
              Comenzar evaluación gratis
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-foreground/40">
            Pre-evaluación orientativa. No constituye diagnóstico médico.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="mx-auto max-w-lg px-4">
          <div className="space-y-4">
            {[
              { n: "1", label: "Responde preguntas sobre tu piel" },
              { n: "2", label: "Sube fotos de la zona afectada" },
              { n: "3", label: "Deja tus datos de contacto" },
              { n: "4", label: "El dermatólogo revisa tu caso con contexto" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {s.n}
                </div>
                <p className="text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <Button onClick={onStart} className="w-full mt-8 rounded-full h-12">
            Comenzar ahora
          </Button>
        </div>
      </section>
    </main>
  );
}

// ── Main funnel ───────────────────────────────────────────────

function trackEvent(name: string, props?: Record<string, unknown>) {
  console.log(`[nilo:skin] ${name}`, props ?? {});
}

export default function SkinAssessmentFunnel() {
  const router = useRouter();
  const [step, setStep] = useState<SkinStep>("hero");
  const [formData, setFormData] = useState<SkinFormData>(INITIAL_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [advancing, setAdvancing] = useState(false);

  function set<K extends keyof SkinFormData>(key: K, value: SkinFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function goTo(next: SkinStep) {
    window.scrollTo({ top: 0, behavior: "instant" });
    setStep(next);
  }

  function autoAdvance(next: SkinStep) {
    if (advancing) return;
    setAdvancing(true);
    setTimeout(() => {
      setAdvancing(false);
      goTo(next);
    }, 280);
  }

  const hasUrgentFlag = formData.red_flags.some((f) => URGENT_FLAGS.has(f));
  const showProgress = step !== "hero";

  async function handleSubmit() {
    goTo("submitting");

    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let photoUrls: string[] = [];

    try {
      const supabase = createClient();
      const results = await Promise.all(
        photos.map(async (file, i) => {
          const path = `skin-assessments/${tempId}/${Date.now() + i}-${file.name}`;
          const { error } = await supabase.storage
            .from("skin-assessment-photos")
            .upload(path, file);
          if (error) return null;
          trackEvent("skin_assessment_photo_uploaded", { index: i });
          return supabase.storage
            .from("skin-assessment-photos")
            .getPublicUrl(path).data.publicUrl;
        })
      );
      photoUrls = results.filter((u): u is string => u !== null);
    } catch {
      // Non-blocking — submission continues without photos on storage failure
    }

    try {
      const currentMedsFinal =
        formData.current_medications === "Sí, los escribiré"
          ? formData.current_medications_note || "Sí (sin especificar)"
          : formData.current_medications;

      const allergiesFinal =
        formData.allergies === "Sí"
          ? formData.allergies_note || "Sí (sin especificar)"
          : formData.allergies;

      const payload = {
        ...formData,
        current_medications: currentMedsFinal,
        allergies: allergiesFinal,
        photo_urls: photoUrls,
        product_photo_urls: [] as string[],
      };

      const res = await fetch("/api/skin-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("[skin-assessment] Submit error:", await res.text());
      } else {
        trackEvent("skin_assessment_submitted");
      }
    } catch (err) {
      console.error("[skin-assessment] Unexpected error:", err);
    }

    router.push("/evaluacion-piel/gracias");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showProgress && (
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="mx-auto max-w-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="text-sm font-semibold text-primary">
                Perfecto
              </Link>
              <span className="text-xs text-muted-foreground">Pre-evaluación de piel</span>
            </div>
            <Progress value={STEP_PROGRESS[step]} className="h-1.5" />
          </div>
        </div>
      )}

      <div
        className={
          step === "hero" || step === "submitting"
            ? "flex-1"
            : "flex-1 mx-auto w-full max-w-xl px-4 py-8"
        }
      >
        {/* Hero */}
        {step === "hero" && (
          <HeroSection
            onStart={() => {
              trackEvent("skin_assessment_started");
              goTo("concern");
            }}
          />
        )}

        {/* Step 1 — Main concern */}
        {step === "concern" && (
          <div>
            <StepLabel current={1} total={13} />
            <h2 className="text-2xl font-bold mb-6 leading-snug">
              ¿Qué quieres mejorar o revisar principalmente?
            </h2>
            <SingleSelect
              options={[
                "Acné / granos / espinillas",
                "Manchas oscuras",
                "Marcas de acné",
                "Piel grasa / poros visibles",
                "Piel seca / irritada",
                "Rosácea / rojez / ardor",
                "Arrugas / textura / envejecimiento",
                "Lunares o manchas que cambiaron",
                "Heridas, costras o lesiones que no sanan",
                "Otro",
              ]}
              value={formData.main_concern}
              onChange={(v) => {
                set("main_concern", v);
                autoAdvance("areas");
              }}
              disabled={advancing}
            />
          </div>
        )}

        {/* Step 2 — Affected areas */}
        {step === "areas" && (
          <div>
            <StepLabel current={2} total={13} />
            <h2 className="text-2xl font-bold mb-2 leading-snug">
              ¿Dónde aparece principalmente?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Puedes seleccionar más de una opción.
            </p>
            <MultiSelect
              options={[
                "Frente",
                "Mejillas",
                "Mentón / mandíbula",
                "Nariz",
                "Cuello",
                "Pecho",
                "Espalda",
                "Hombros",
                "Brazos",
                "Manos",
                "Piernas",
                "Otra zona",
                "Prefiero hablarlo con el médico",
              ]}
              values={formData.affected_areas}
              onChange={(v) => set("affected_areas", v)}
            />
            <Button
              onClick={() => goTo("evolution")}
              disabled={formData.affected_areas.length === 0}
              className="w-full mt-6 rounded-full h-12"
            >
              Continuar
            </Button>
            <BackBtn onClick={() => goTo("concern")} />
          </div>
        )}

        {/* Step 3 — Evolution */}
        {step === "evolution" && (
          <div>
            <StepLabel current={3} total={13} />
            <h2 className="text-2xl font-bold mb-6 leading-snug">
              Evolución del problema
            </h2>

            <p className="text-sm font-semibold mb-3">¿Hace cuánto empezó?</p>
            <SingleSelect
              options={[
                "Menos de 1 semana",
                "1 a 4 semanas",
                "1 a 3 meses",
                "3 a 12 meses",
                "Más de 1 año",
                "Desde siempre / recurrente",
              ]}
              value={formData.duration}
              onChange={(v) => set("duration", v)}
            />

            {formData.duration && (
              <>
                <p className="text-sm font-semibold mt-6 mb-3">
                  ¿Ha empeorado últimamente?
                </p>
                <SingleSelect
                  options={[
                    "Sí, rápido",
                    "Sí, lentamente",
                    "Está igual",
                    "Mejora y vuelve",
                    "No estoy seguro/a",
                  ]}
                  value={formData.progression}
                  onChange={(v) => set("progression", v)}
                />
              </>
            )}

            {formData.duration && formData.progression && (
              <Button
                onClick={() => goTo("lesion")}
                className="w-full mt-6 rounded-full h-12"
              >
                Continuar
              </Button>
            )}
            <BackBtn onClick={() => goTo("areas")} />
          </div>
        )}

        {/* Step 4 — Lesion description */}
        {step === "lesion" && (
          <div>
            <StepLabel current={4} total={13} />
            <h2 className="text-2xl font-bold mb-2 leading-snug">
              ¿Cómo describirías lo que ves?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Puedes seleccionar más de una opción.
            </p>
            <MultiSelect
              options={[
                "Puntos negros / puntos blancos",
                "Granos rojos",
                "Granos con pus",
                "Bultos profundos o dolorosos",
                "Manchas café / oscuras",
                "Manchas rojas",
                "Descamación",
                "Piel muy seca",
                "Rojez difusa",
                "Vasitos visibles",
                "Placas gruesas",
                "Herida / costra",
                "Lunar / mancha que cambió",
                "No sé",
              ]}
              values={formData.lesion_description}
              onChange={(v) => set("lesion_description", v)}
            />
            <Button
              onClick={() => goTo("symptoms")}
              disabled={formData.lesion_description.length === 0}
              className="w-full mt-6 rounded-full h-12"
            >
              Continuar
            </Button>
            <BackBtn onClick={() => goTo("evolution")} />
          </div>
        )}

        {/* Step 5 — Symptoms */}
        {step === "symptoms" && (
          <div>
            <StepLabel current={5} total={13} />
            <h2 className="text-2xl font-bold mb-6 leading-snug">Síntomas</h2>

            <div className="mb-6">
              <p className="text-sm font-semibold mb-1">
                Del 1 al 10, ¿cuánto te molesta o preocupa?
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                1 = poco, 10 = mucho
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">1</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={formData.concern_score}
                  onChange={(e) =>
                    set("concern_score", parseInt(e.target.value, 10))
                  }
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground">10</span>
                <span className="w-9 text-center font-bold text-primary text-lg">
                  {formData.concern_score}
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold mb-2">
              ¿Hay dolor, ardor o picazón?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Puedes seleccionar más de una opción.
            </p>
            <MultiSelect
              options={[
                "No",
                "Picazón leve",
                "Picazón fuerte",
                "Ardor",
                "Dolor",
                "Sensación de quemazón",
                "Sangrado",
              ]}
              values={formData.symptoms}
              onChange={(v) => set("symptoms", v)}
            />

            <Button
              onClick={() => goTo("photos")}
              disabled={formData.symptoms.length === 0}
              className="w-full mt-6 rounded-full h-12"
            >
              Continuar
            </Button>
            <BackBtn onClick={() => goTo("lesion")} />
          </div>
        )}

        {/* Step 6 — Photos */}
        {step === "photos" && (
          <PhotoStep
            photos={photos}
            setPhotos={setPhotos}
            onContinue={() => goTo("routine")}
            onBack={() => goTo("symptoms")}
          />
        )}

        {/* Step 7 — Routine */}
        {step === "routine" && (
          <div>
            <StepLabel current={7} total={13} />
            <h2 className="text-2xl font-bold mb-6 leading-snug">
              Rutina actual de piel
            </h2>

            <p className="text-sm font-semibold mb-2">
              ¿Qué usas actualmente en la piel?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Puedes seleccionar más de una opción.
            </p>
            <MultiSelect
              options={[
                "Limpiador",
                "Hidratante",
                "Protector solar",
                "Vitamina C",
                "Retinol / retinal / tretinoína",
                "Ácido salicílico",
                "Ácido glicólico / láctico",
                "Peróxido de benzoilo",
                "Niacinamida",
                "Aceites",
                "Scrubs / exfoliantes físicos",
                "Productos anti-manchas",
                "Medicamentos recetados",
                "Nada",
                "No sé",
              ]}
              values={formData.current_routine}
              onChange={(v) => set("current_routine", v)}
            />

            {formData.current_routine.length > 0 && (
              <>
                <p className="text-sm font-semibold mt-6 mb-3">
                  ¿Con qué frecuencia usas ácidos, retinol o exfoliantes?
                </p>
                <SingleSelect
                  options={[
                    "Nunca",
                    "1 vez por semana",
                    "2 a 3 veces por semana",
                    "Todos los días",
                    "Más de una vez al día",
                    "No sé",
                  ]}
                  value={formData.active_ingredients_frequency}
                  onChange={(v) => set("active_ingredients_frequency", v)}
                />
              </>
            )}

            {formData.active_ingredients_frequency && (
              <>
                <p className="text-sm font-semibold mt-6 mb-3">
                  ¿Tu piel se pela, arde o queda roja después de tu rutina?
                </p>
                <SingleSelect
                  options={["Sí", "No", "A veces"]}
                  value={formData.irritation_from_routine}
                  onChange={(v) => set("irritation_from_routine", v)}
                />
              </>
            )}

            {formData.irritation_from_routine && (
              <Button
                onClick={() => goTo("treatments")}
                className="w-full mt-6 rounded-full h-12"
              >
                Continuar
              </Button>
            )}
            <BackBtn onClick={() => goTo("photos")} />
          </div>
        )}

        {/* Step 8 — Previous treatments */}
        {step === "treatments" && (
          <div>
            <StepLabel current={8} total={13} />
            <h2 className="text-2xl font-bold mb-6 leading-snug">
              Tratamientos anteriores
            </h2>

            <p className="text-sm font-semibold mb-2">
              ¿Has usado tratamientos antes para este problema?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Puedes seleccionar más de una opción.
            </p>
            <MultiSelect
              options={[
                "Ninguno",
                "Productos cosméticos",
                "Cremas recetadas",
                "Antibióticos tópicos",
                "Antibióticos orales",
                "Retinoides tópicos",
                "Isotretinoína",
                "Anticonceptivos / tratamiento hormonal",
                "Peeling / láser / procedimientos",
                "No sé los nombres",
              ]}
              values={formData.previous_treatments}
              onChange={(v) => set("previous_treatments", v)}
            />

            {formData.previous_treatments.length > 0 && (
              <>
                <p className="text-sm font-semibold mt-6 mb-3">
                  ¿Qué pasó con esos tratamientos?
                </p>
                <SingleSelect
                  options={[
                    "Mejoré",
                    "Mejoré y volvió",
                    "No mejoré",
                    "Me irrité",
                    "Lo dejé por efectos secundarios",
                    "No fui constante",
                    "No aplica",
                  ]}
                  value={formData.previous_treatment_response}
                  onChange={(v) => set("previous_treatment_response", v)}
                />
              </>
            )}

            {formData.previous_treatment_response && (
              <Button
                onClick={() => goTo("history")}
                className="w-full mt-6 rounded-full h-12"
              >
                Continuar
              </Button>
            )}
            <BackBtn onClick={() => goTo("routine")} />
          </div>
        )}

        {/* Step 9 — Medical history */}
        {step === "history" && (
          <HistoryStep
            formData={formData}
            set={set}
            onContinue={() => goTo("redflags")}
            onBack={() => goTo("treatments")}
          />
        )}

        {/* Step 10 — Red flags */}
        {step === "redflags" && (
          <div>
            <StepLabel current={10} total={13} />
            <h2 className="text-2xl font-bold mb-2 leading-snug">
              ¿Tienes alguno de estos síntomas o señales?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Puedes seleccionar más de una opción.
            </p>

            <MultiSelect
              options={[
                "Fiebre",
                "Dolor fuerte",
                "Hinchazón rápida",
                "Pus abundante",
                "Lesión cerca del ojo",
                "Herida que no sana",
                "Sangrado espontáneo",
                "Mancha/lunar que cambió rápido",
                "Lunar con varios colores",
                "Lunar irregular/asimétrico",
                "Picazón o dolor persistente en una lesión",
                "Ninguno",
              ]}
              values={formData.red_flags}
              onChange={(v) => set("red_flags", v)}
            />

            {hasUrgentFlag && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Revisión prioritaria recomendada
                </p>
                <p className="text-sm text-amber-700">
                  Por tus respuestas, recomendamos que este caso sea revisado
                  con prioridad por un dermatólogo.
                </p>
              </div>
            )}

            <Button
              onClick={() => goTo("goals")}
              disabled={formData.red_flags.length === 0}
              className="w-full mt-6 rounded-full h-12"
            >
              Continuar
            </Button>
            <BackBtn onClick={() => goTo("history")} />
          </div>
        )}

        {/* Step 11 — Goals */}
        {step === "goals" && (
          <div>
            <StepLabel current={11} total={13} />
            <h2 className="text-2xl font-bold mb-6 leading-snug">Tu objetivo</h2>

            <p className="text-sm font-semibold mb-3">
              ¿Cuál es tu objetivo principal?
            </p>
            <SingleSelect
              options={[
                "Eliminar brotes",
                "Reducir manchas",
                "Mejorar textura",
                "Reducir rojez/sensibilidad",
                "Controlar grasa",
                "Mejorar cicatrices",
                "Anti-aging preventivo",
                "Revisar una lesión preocupante",
                "Tener una rutina dermatológica simple",
              ]}
              value={formData.main_goal}
              onChange={(v) => set("main_goal", v)}
            />

            {formData.main_goal && (
              <>
                <p className="text-sm font-semibold mt-6 mb-3">
                  ¿Qué prefieres?
                </p>
                <SingleSelect
                  options={[
                    "Rutina simple de pocos pasos",
                    "Tratamiento médico si el dermatólogo lo indica",
                    "Evitar medicamentos si es posible",
                    "Estoy abierto/a a opciones médicas",
                    "Solo quiero evaluación",
                  ]}
                  value={formData.preference}
                  onChange={(v) => set("preference", v)}
                />
              </>
            )}

            {formData.preference && (
              <Button
                onClick={() => goTo("notes")}
                className="w-full mt-6 rounded-full h-12"
              >
                Continuar
              </Button>
            )}
            <BackBtn onClick={() => goTo("redflags")} />
          </div>
        )}

        {/* Step 12 — Additional notes */}
        {step === "notes" && (
          <div>
            <StepLabel current={12} total={13} />
            <h2 className="text-2xl font-bold mb-2 leading-snug">
              ¿Algo más que quieras contarle al dermatólogo?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Opcional, pero puede ser muy útil para tu revisión.
            </p>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => set("additional_notes", e.target.value)}
              placeholder="Ej: cuándo empeora, productos que te irritaron, tratamientos anteriores, dudas específicas, cambios recientes, etc."
              className="min-h-[140px] rounded-2xl resize-none"
            />
            <Button
              onClick={() => goTo("contact")}
              className="w-full mt-6 rounded-full h-12"
            >
              Continuar
            </Button>
            <BackBtn onClick={() => goTo("goals")} />
          </div>
        )}

        {/* Step 13 — Contact */}
        {step === "contact" && (
          <ContactStep
            formData={formData}
            set={set}
            onSubmit={handleSubmit}
            onBack={() => goTo("notes")}
          />
        )}

        {/* Submitting */}
        {step === "submitting" && (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold">Guardando tu evaluación...</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Un momento, estamos registrando tus respuestas y fotos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
