"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { type QuizData, type JourneyType, INITIAL_QUIZ_DATA } from "@/lib/types";
import { triggerDoctorReport } from "@/app/actions/triggerDoctorReport";
import { usePostHog } from "posthog-js/react";

type QuizStep =
  | "intro"
  | "route"
  | "hairpattern"
  | "hairloss"
  | "history"
  | "transition"
  | "conditions"
  | "medications"
  | "medical"
  | "transplant"
  | "photos"
  | "personal"
  | "submitting";

function intakeGoalFromRoute(journeyType: JourneyType | null): string | null {
  if (!journeyType) return null;
  if (journeyType === "transplant") return "Evaluar recuperación capilar";
  if (journeyType === "both") return "Tratamiento y evaluación clínica";
  return "Frenar la caída";
}

/** Solo los 8 dígitos tras +56 9 (guardados en quiz `phone`). */
function formatChileMobileForDb(localDigits: string): string {
  const d = normalizeChileMobileLocalDigits(localDigits);
  if (d.length !== 8) return "";
  return `+56 9 ${d.slice(0, 4)} ${d.slice(4)}`;
}

/** Extrae los 8 dígitos del celular ante pegados tipo +569… o 9xxxxxxxx. */
function normalizeChileMobileLocalDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("569") && d.length >= 11) d = d.slice(3);
  else if (d.startsWith("56") && d.length >= 10) d = d.slice(2);
  if (d.startsWith("9") && d.length === 9) d = d.slice(1);
  return d.slice(0, 8);
}

/** RUT u otro ID: sin puntos, espacios colapsados, dígito verificador en mayúsculas. */
function normalizeNationalIdForDb(raw: string): string {
  const t = raw.trim().replace(/\./g, "").replace(/\s+/g, "");
  return t ? t.toUpperCase() : "";
}

function isNationalIdInputValid(raw: string): boolean {
  return normalizeNationalIdForDb(raw).length >= 7;
}

// "both" kept as legacy fallback — not exposed in UI
const STEPS_BY_ROUTE: Record<JourneyType, QuizStep[]> = {
  treatment:  ["hairpattern", "hairloss", "history", "transition", "conditions", "medications", "medical",    "photos", "personal"],
  transplant: ["hairpattern", "hairloss", "history", "transition", "conditions", "medications", "transplant", "photos", "personal"],
  both:       ["hairpattern", "hairloss", "history", "transition", "conditions", "medications", "medical",    "photos", "personal"],
};

function getProgress(step: QuizStep, journeyType: JourneyType | null): number {
  if (step === "intro") return 0;
  if (step === "route") return 5;
  if (!journeyType) return 5;
  const steps = STEPS_BY_ROUTE[journeyType];
  const idx = steps.indexOf(step);
  if (idx === -1) return 100;
  return Math.round(((idx + 1) / steps.length) * 100);
}

function getStepLabel(step: QuizStep, journeyType: JourneyType | null): string {
  if (step === "intro" || step === "route" || !journeyType) return "";
  const steps = STEPS_BY_ROUTE[journeyType];
  const idx = steps.indexOf(step);
  if (idx === -1) return "";
  return `Paso ${idx + 1} de ${steps.length}`;
}

export default function QuizPage() {
  const router = useRouter();
  const ph = usePostHog();
  const [currentStep, setCurrentStep] = useState<QuizStep>("intro");
  const [data, setData] = useState<QuizData>(INITIAL_QUIZ_DATA);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ph?.capture("quiz_started");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback((updates: Partial<QuizData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  function getNextStep(step: QuizStep): QuizStep | null {
    if (step === "intro") return "route";
    if (step === "route") return "hairpattern";
    if (!data.journeyType) return null;
    const steps = STEPS_BY_ROUTE[data.journeyType];
    const idx = steps.indexOf(step);
    if (idx === -1 || idx === steps.length - 1) return null;
    return steps[idx + 1];
  }

  function getPrevStep(step: QuizStep): QuizStep | null {
    if (step === "intro") return null;
    if (step === "route") return "intro";
    if (!data.journeyType) return "route";
    const steps = STEPS_BY_ROUTE[data.journeyType];
    const idx = steps.indexOf(step);
    if (idx === 0) return "route";
    if (idx === -1) return null;
    return steps[idx - 1];
  }

  function handleNext() {
    const next = getNextStep(currentStep);
    if (currentStep === "photos") ph?.capture("photos_uploaded");
    if (next) {
      setCurrentStep(next);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    const prev = getPrevStep(currentStep);
    if (prev) {
      setCurrentStep(prev);
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit() {
    setCurrentStep("submitting");
    setError(null);
    const supabase = createClient();

    function logOp(op: string, status: "start" | "ok" | "fail", payloadKeys?: string[], err?: unknown) {
      if (status === "start") {
        console.log(`[quiz/submit] ${op} — keys: [${(payloadKeys ?? []).join(", ")}]`);
      } else if (status === "ok") {
        console.log(`[quiz/submit] ${op} — OK`);
      } else {
        const e = err as { message?: string; details?: string; hint?: string; code?: string } | null;
        console.error(`[quiz/submit] ${op} — FAIL`, {
          message: e?.message ?? String(err),
          details: e?.details ?? null,
          hint: e?.hint ?? null,
          code: e?.code ?? null,
        });
      }
    }

    try {
      const nid = normalizeNationalIdForDb(data.nationalId);
      const basePatientInsert = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: formatChileMobileForDb(data.phone),
        age: parseInt(data.age) || null,
        sex: data.sex || null,
        city: null,
      };

      const patientPayload = {
        ...basePatientInsert,
        rut: nid || null,
        consented_at: data.consented ? new Date().toISOString() : null,
      };
      logOp("patient insert", "start", Object.keys(patientPayload));
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert(patientPayload)
        .select()
        .single();

      if (patientError) {
        logOp("patient insert", "fail", undefined, patientError);
        throw patientError;
      }
      if (!patient) throw new Error("No se pudo crear el paciente");
      logOp("patient insert", "ok");

      const intakePayload = {
        patient_id: patient.id,
        journey_type: data.journeyType,
        hair_loss_duration: data.hairLossDuration || null,
        main_area: data.hairPattern || null,
        sudden_or_gradual: data.suddenOrGradual || null,
        loss_in_patches: null,
        severe_irritation: data.severeIrritation,
        family_history: data.familyHistory,
        previous_treatments: data.previousTreatments.length ? data.previousTreatments : null,
        goal: intakeGoalFromRoute(data.journeyType),
        medical_conditions: data.medicalConditions.length ? data.medicalConditions : null,
        used_minoxidil: data.usedMinoxidil,
        used_finasteride: data.usedFinasteride,
        used_dutasteride: data.usedDutasteride,
        had_side_effects: data.hadSideEffects,
        current_medications: data.currentMedications,
        current_medications_note: data.currentMedicationsNote || null,
        drug_allergies: data.drugAllergies,
        drug_allergies_note: data.drugAllergiesNote || null,
        heart_disease: data.heartDisease,
        liver_disease: data.liverDisease,
        kidney_disease: data.kidneyDisease,
        prostate_history: data.prostateHistory,
        planning_children: data.planningChildren,
        is_pregnant_or_lactating: data.isPregnantOrLactating,
        previous_transplant: data.previousTransplant,
        loss_severity: data.lossSeverity || null,
        transplant_timing: data.transplantTiming || null,
        budget_range: data.budgetRange || null,
        financing_interest: data.financingInterest,
        transplant_priority: data.transplantPriority || null,
        // treatment route: openToClinicalEval; transplant route: prpInterest (used treatment before)
        prp_interest: data.journeyType === "treatment" ? data.openToClinicalEval : data.prpInterest,
        status: "completed_quiz",
      };
      logOp("intake insert", "start", Object.keys(intakePayload));
      const { data: intake, error: intakeError } = await supabase
        .from("intakes")
        .insert(intakePayload)
        .select()
        .single();

      if (intakeError) {
        logOp("intake insert", "fail", undefined, intakeError);
        throw intakeError;
      }
      logOp("intake insert", "ok");

      const photoTypes = [
        { key: "photoFrontal" as const, type: "frontal" },
        { key: "photoTemples" as const, type: "temples" },
        { key: "photoCrown" as const, type: "crown" },
        { key: "photoSide" as const, type: "side" },
      ];

      for (const { key, type } of photoTypes) {
        const file = data[key];
        if (!file) continue;
        const path = `${patient.id}/${type}_${Date.now()}`;
        logOp(`photo upload [${type}]`, "start", ["bucket:patient-photos", `path:${type}_*`]);
        const { error: uploadError } = await supabase.storage
          .from("patient-photos")
          .upload(path, file);
        if (uploadError) {
          logOp(`photo upload [${type}]`, "fail", undefined, uploadError);
          throw uploadError;
        }
        logOp(`photo upload [${type}]`, "ok");

        const { data: urlData } = supabase.storage
          .from("patient-photos")
          .getPublicUrl(path);
        logOp(`photo insert [${type}]`, "start", ["patient_id", "intake_id", "type", "url"]);
        const { error: photoInsertError } = await supabase.from("photos").insert({
          patient_id: patient.id,
          intake_id: intake.id,
          type,
          url: urlData.publicUrl,
        });
        if (photoInsertError) {
          logOp(`photo insert [${type}]`, "fail", undefined, photoInsertError);
          throw photoInsertError;
        }
        logOp(`photo insert [${type}]`, "ok");
      }

      localStorage.setItem("capilar_intake_id", intake.id);

      logOp("ai doctor-report trigger", "start", ["intake_id"]);
      triggerDoctorReport(intake.id).catch((e) =>
        logOp("ai doctor-report trigger", "fail", undefined, e)
      );

      const journeyQuery =
        data.journeyType === "transplant" ? "transplant" : "treatment";
      ph?.capture("quiz_completed", { journey_type: data.journeyType });
      router.push(`/membership?plan=inicio&journey=${journeyQuery}`);
    } catch (err) {
      const e = err as { message?: string; details?: string; hint?: string; code?: string };
      console.error("[quiz/submit] unhandled error", {
        message: e.message ?? String(err),
        details: e.details ?? null,
        hint: e.hint ?? null,
        code: e.code ?? null,
      });
      setError("Ocurrió un error al guardar tu evaluación. Por favor intenta nuevamente.");
      setCurrentStep("personal");
    }
  }

  const progress = getProgress(currentStep, data.journeyType);
  const stepLabel = getStepLabel(currentStep, data.journeyType);
  const prevStep = getPrevStep(currentStep);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="mx-auto max-w-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-sm font-semibold text-primary">
              Perfecto
            </Link>
            {stepLabel && (
              <span className="text-xs text-muted-foreground">{stepLabel}</span>
            )}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
        {currentStep === "intro" && (
          <IntroStep onNext={() => { setCurrentStep("route"); window.scrollTo(0, 0); }} />
        )}
        {currentStep === "route" && (
          <RouteStep
            data={data}
            onChange={onChange}
            onNext={() => {
              if (data.journeyType) {
                ph?.capture("route_selected", { journey_type: data.journeyType });
                setCurrentStep("hairpattern");
                window.scrollTo(0, 0);
              }
            }}
          />
        )}
        {currentStep === "hairpattern" && (
          <HairPatternStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "hairloss" && (
          <HairLossStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "history" && (
          <HistoryStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "transition" && (
          <TransitionStep onNext={handleNext} />
        )}
        {currentStep === "conditions" && (
          <MedicalConditionsStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "medications" && (
          <CurrentMedicationsStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "medical" && (
          <MedicalStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "transplant" && (
          <TransplantStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "photos" && (
          <PhotoStep
            data={data}
            onChange={onChange}
            onNext={handleNext}
            onBack={handleBack}
            error={error}
          />
        )}
        {currentStep === "personal" && (
          <PersonalStep data={data} onChange={onChange} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "submitting" && <SubmittingStep />}

        {currentStep !== "intro" && currentStep !== "route" && currentStep !== "submitting" && prevStep && (
          <button
            onClick={handleBack}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared interfaces & primitives
// ---------------------------------------------------------------------------

interface StepProps {
  data: QuizData;
  onChange: (updates: Partial<QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "border rounded-xl py-3 text-sm font-medium transition-colors",
            value === true
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border hover:border-primary/50"
          )}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "border rounded-xl py-3 text-sm font-medium transition-colors",
            value === false
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border hover:border-primary/50"
          )}
        >
          No
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Intro screen
// ---------------------------------------------------------------------------

function IntroStep({ onNext }: { onNext: () => void }) {
  const HERO_EXISTS = true; // public/hero-hair-contrast.png confirmed present
  const steps = [
    {
      n: "1",
      title: "Completa tu evaluación",
      desc: "Responde preguntas simples y sube fotos.",
    },
    {
      n: "2",
      title: "Recibe una ruta recomendada",
      desc: "Te orientamos entre frenar la caída o evaluar recuperación capilar.",
    },
    {
      n: "3",
      title: "Un médico revisa tu caso",
      desc: "Si corresponde, activamos receta, farmacia autorizada, despacho y seguimiento.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero image */}
      {HERO_EXISTS ? (
        <div className="relative h-[280px] w-full overflow-hidden rounded-2xl bg-white shadow-sm">
          <Image
            src="/hero-hair-contrast.png"
            alt="Evaluación capilar Perfecto"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 480px"
            priority
          />
        </div>
      ) : (
        <div className="w-full h-52 rounded-2xl bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Imagen de evaluación capilar</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold leading-snug">
          Entiende tu caída antes de decidir qué hacer.
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Perfecto te ayuda a identificar si hoy necesitas frenar la caída o evaluar una recuperación
          capilar más avanzada.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.n} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {step.n}
            </div>
            <div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button onClick={onNext} className="w-full rounded-full h-12 text-base">
          Continuar
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          La evaluación de Perfecto orienta tu siguiente paso, pero no reemplaza la revisión médica.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Journey selection (2 options)
// ---------------------------------------------------------------------------

function RouteStep({
  data,
  onChange,
  onNext,
}: {
  data: QuizData;
  onChange: (u: Partial<QuizData>) => void;
  onNext: () => void;
}) {
  const routes: { value: "treatment" | "transplant"; title: string; desc: string }[] = [
    {
      value: "treatment",
      title: "Frenar la caída",
      desc: "Aún tengo pelo y quiero cuidarlo. Quiero entender si corresponde tratamiento médico.",
    },
    {
      value: "transplant",
      title: "Evaluar trasplante",
      desc: "Ya perdí densidad o estoy considerando una recuperación capilar y quiero saber si tiene sentido avanzar.",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">¿Qué quieres resolver?</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Elige la opción que mejor describe tu situación. Esto define tu evaluación.
      </p>
      <div className="space-y-3">
        {routes.map((route) => (
          <button
            key={route.value}
            type="button"
            onClick={() => onChange({ journeyType: route.value })}
            className={cn(
              "w-full text-left border rounded-2xl p-5 transition-all",
              data.journeyType === route.value
                ? "border-primary bg-accent ring-1 ring-primary"
                : "border-border hover:border-primary/50 bg-white"
            )}
          >
            <p className="font-semibold text-base">{route.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{route.desc}</p>
          </button>
        ))}
      </div>
      <Button
        onClick={onNext}
        disabled={!data.journeyType}
        className="w-full mt-6 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Hair loss diagnostic
// ---------------------------------------------------------------------------

function HairLossStep({ data, onChange, onNext }: StepProps) {
  const durations = [
    "Menos de 6 meses",
    "6–12 meses",
    "+1 año",
  ];

  const isValid =
    data.hairLossDuration &&
    data.suddenOrGradual &&
    data.severeIrritation !== null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Tu caída capilar</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Cuéntanos sobre tu caída para personalizar tu evaluación.
      </p>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">¿Desde cuándo notas la caída?</p>
          <div className="grid grid-cols-2 gap-2">
            {durations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ hairLossDuration: d })}
                className={cn(
                  "border rounded-xl py-2.5 text-sm text-left px-3 transition-colors",
                  data.hairLossDuration === d
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">¿La caída es gradual o repentina?</p>
          <div className="grid grid-cols-2 gap-3">
            {(["gradual", "sudden"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ suddenOrGradual: v })}
                className={cn(
                  "border rounded-xl py-3 text-sm font-medium transition-colors",
                  data.suddenOrGradual === v
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                )}
              >
                {v === "gradual" ? "Gradual" : "Repentina"}
              </button>
            ))}
          </div>
        </div>

        <YesNoField
          label="¿Tienes irritación fuerte, heridas, costras o picazón severa?"
          value={data.severeIrritation}
          onChange={(v) => onChange({ severeIrritation: v })}
        />
      </div>
      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full mt-6 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: History
// ---------------------------------------------------------------------------

function HistoryStep({ data, onChange, onNext }: StepProps) {
  const treatments = ["Minoxidil", "Finasteride", "Dutasteride", "Ninguno"];

  const isValid = data.familyHistory !== null;

  function toggleTreatment(t: string) {
    const current = data.previousTreatments;
    if (t === "Ninguno") {
      onChange({ previousTreatments: current.includes("Ninguno") ? [] : ["Ninguno"] });
      return;
    }
    const without = current.filter((x) => x !== "Ninguno");
    if (without.includes(t)) {
      onChange({ previousTreatments: without.filter((x) => x !== t) });
    } else {
      onChange({ previousTreatments: [...without, t] });
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Historial</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Esta información ayuda al médico a entender tu contexto.
      </p>
      <div className="space-y-6">
        <YesNoField
          label="¿Tienes antecedentes familiares de alopecia?"
          value={data.familyHistory}
          onChange={(v) => onChange({ familyHistory: v })}
        />

        <div>
          <p className="text-sm font-medium mb-2">Tratamientos previos (elige todos los que apliquen)</p>
          <div className="grid grid-cols-2 gap-2">
            {treatments.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTreatment(t)}
                className={cn(
                  "border rounded-xl py-2.5 text-sm px-3 transition-colors",
                  data.previousTreatments.includes(t)
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full mt-6 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Transition screen (no data collected)
// ---------------------------------------------------------------------------

function TransitionStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl">✓</span>
      </div>
      <h2 className="text-2xl font-bold mb-3">Ya casi terminamos</h2>
      <p className="text-muted-foreground leading-relaxed">
        Ahora necesitamos revisar algunos antecedentes importantes para completar tu evaluación.
      </p>
      <Button onClick={onNext} className="w-full mt-8 rounded-full h-12">
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Medical conditions (multi-select)
// ---------------------------------------------------------------------------

const MEDICAL_CONDITIONS = [
  "Cáncer de próstata",
  "Enfermedades inmunológicas",
  "Presión arterial alta",
  "Presión arterial baja",
  "Problemas de tiroides",
  "Enfermedades del corazón",
  "Enfermedades del riñón",
  "Enfermedades del hígado",
  "Infertilidad o tratamientos de fertilidad",
  "Ninguna de las anteriores",
] as const;

function MedicalConditionsStep({ data, onChange, onNext }: StepProps) {
  const [condError, setCondError] = useState<string | null>(null);

  function toggleCondition(condition: string) {
    const current = data.medicalConditions;
    if (condition === "Ninguna de las anteriores") {
      onChange({
        medicalConditions: current.includes("Ninguna de las anteriores")
          ? []
          : ["Ninguna de las anteriores"],
      });
      return;
    }
    const without = current.filter((c) => c !== "Ninguna de las anteriores");
    onChange({
      medicalConditions: without.includes(condition)
        ? without.filter((c) => c !== condition)
        : [...without, condition],
    });
  }

  function handleNext() {
    if (data.medicalConditions.length === 0) {
      setCondError("Por favor selecciona una opción.");
      return;
    }
    setCondError(null);
    onNext();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Condiciones médicas</h2>
      <p className="text-muted-foreground text-sm mb-6">
        ¿Tienes o has tenido alguna de estas condiciones médicas?
      </p>

      <div className="space-y-2 mb-5">
        {MEDICAL_CONDITIONS.map((condition) => {
          const selected = data.medicalConditions.includes(condition);
          return (
            <button
              key={condition}
              type="button"
              onClick={() => toggleCondition(condition)}
              className={cn(
                "w-full text-left border rounded-2xl px-4 py-3 text-sm transition-all flex items-center justify-between gap-3",
                selected
                  ? "border-primary bg-accent ring-1 ring-primary"
                  : "border-border hover:border-primary/50 bg-white"
              )}
            >
              <span>{condition}</span>
              {selected && (
                <span className="shrink-0 text-primary font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-muted/40 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold mb-1">¿Por qué lo preguntamos?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Esta información ayuda al médico a evaluar si corresponde avanzar con tratamiento
          o si necesita revisar antecedentes adicionales.
        </p>
      </div>

      {condError && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-xl p-3">
          {condError}
        </p>
      )}

      <Button onClick={handleNext} className="w-full rounded-full h-12">
        Continuar →
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Current medications (yes/no + textarea)
// ---------------------------------------------------------------------------

function CurrentMedicationsStep({ data, onChange, onNext }: StepProps) {
  const [medError, setMedError] = useState<string | null>(null);

  function handleNext() {
    if (data.currentMedications === null) {
      setMedError("Por favor selecciona una opción.");
      return;
    }
    if (data.currentMedications === true && !data.currentMedicationsNote.trim()) {
      setMedError("Por favor indica qué medicamentos utilizas.");
      return;
    }
    setMedError(null);
    onNext();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Medicamentos actuales</h2>
      <p className="text-muted-foreground text-sm mb-1">
        ¿Tomas algún medicamento actualmente?
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Medicamentos que uses periódicamente.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => onChange({ currentMedications: true })}
          className={cn(
            "border rounded-xl py-3 text-sm font-medium transition-colors",
            data.currentMedications === true
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border hover:border-primary/50"
          )}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({ currentMedications: false, currentMedicationsNote: "" })
          }
          className={cn(
            "border rounded-xl py-3 text-sm font-medium transition-colors",
            data.currentMedications === false
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border hover:border-primary/50"
          )}
        >
          No
        </button>
      </div>

      {data.currentMedications === true && (
        <div className="mb-5">
          <p className="text-sm font-medium mb-2">¿Cuáles utilizas actualmente?</p>
          <Textarea
            value={data.currentMedicationsNote}
            onChange={(e) => onChange({ currentMedicationsNote: e.target.value })}
            placeholder="Escribe tu respuesta aquí…"
            className="min-h-[100px] rounded-xl resize-none"
          />
        </div>
      )}

      <div className="bg-muted/40 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold mb-1">¿Por qué lo preguntamos?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Es importante para que el médico evalúe antecedentes y pueda descartar posibles
          contraindicaciones.
        </p>
      </div>

      {medError && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-xl p-3">
          {medError}
        </p>
      )}

      <Button onClick={handleNext} className="w-full rounded-full h-12">
        Continuar →
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Medical screening — simplified for "Frenar caída" route
// ---------------------------------------------------------------------------

function MedicalStep({ data, onChange, onNext }: StepProps) {
  const isValid = data.openToClinicalEval !== null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Siguiente paso</h2>
      <p className="text-muted-foreground text-sm mb-6">
        El cuestionario no diagnostica. Responde según tu disposición actual.
      </p>
      <div className="space-y-5">
        <YesNoField
          label="¿Estarías dispuesto a una evaluación de trasplante si el médico lo recomienda?"
          value={data.openToClinicalEval}
          onChange={(v) => onChange({ openToClinicalEval: v })}
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Esta información es confidencial y solo la revisa el médico asignado.
      </p>
      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full mt-4 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Transplant assessment — simplified for "Evaluar trasplante" route
// ---------------------------------------------------------------------------

function TransplantStep({ data, onChange, onNext }: StepProps) {
  const timings = [
    "Lo antes posible",
    "En 1–3 meses",
    "En 3–6 meses",
    "Solo estoy cotizando",
  ];
  const budgets = [
    "Menos de $1.5M",
    "$1.5M – $3M",
    "$3M – $5M",
    "No sé aún",
  ];

  const isValid =
    data.previousTransplant !== null &&
    data.transplantTiming &&
    data.budgetRange &&
    data.financingInterest !== null &&
    data.prpInterest !== null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Evaluación de trasplante</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Esta información permite a los especialistas pre-evaluar tu caso.
      </p>
      <div className="space-y-6">
        <YesNoField
          label="¿Ya te hiciste un trasplante capilar antes?"
          value={data.previousTransplant}
          onChange={(v) => onChange({ previousTransplant: v })}
        />

        <div>
          <p className="text-sm font-medium mb-2">¿Cuándo te gustaría realizarlo?</p>
          <div className="grid grid-cols-2 gap-2">
            {timings.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ transplantTiming: t })}
                className={cn(
                  "border rounded-xl py-2.5 text-sm px-3 text-left transition-colors",
                  data.transplantTiming === t
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Presupuesto aproximado</p>
          <div className="grid grid-cols-2 gap-2">
            {budgets.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onChange({ budgetRange: b })}
                className={cn(
                  "border rounded-xl py-2.5 text-sm px-3 text-left transition-colors",
                  data.budgetRange === b
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <YesNoField
          label="¿Tienes interés en financiamiento?"
          value={data.financingInterest}
          onChange={(v) => onChange({ financingInterest: v })}
        />

        <YesNoField
          label="¿Has usado tratamiento médico para estabilizar la caída?"
          value={data.prpInterest}
          onChange={(v) => onChange({ prpInterest: v })}
        />
      </div>
      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full mt-6 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Photos
// ---------------------------------------------------------------------------

interface PhotoStepProps extends StepProps {
  error: string | null;
}

function PhotoStep({ data, onChange, onNext, error }: PhotoStepProps) {
  const photos: {
    key: keyof Pick<QuizData, "photoFrontal" | "photoTemples" | "photoCrown" | "photoSide">;
    label: string;
    hint: string;
    required: boolean;
  }[] = [
    { key: "photoFrontal", label: "Frontal",    hint: "Frente completa, mirando a la cámara",   required: true  },
    { key: "photoCrown",   label: "Coronilla",  hint: "Vista superior, pelo hacia adelante",    required: true  },
    { key: "photoTemples", label: "Entradas",   hint: "Zona de las entradas laterales",         required: false },
    { key: "photoSide",    label: "Lateral",    hint: "Perfil completo",                        required: false },
  ];

  const requiredUploaded = photos.filter((p) => p.required).every((p) => data[p.key] !== null);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Sube tus fotos</h2>
      <p className="text-muted-foreground text-sm mb-2">
        Elige imágenes desde la galería de tu dispositivo (no uses la cámara en vivo). Las fotos permiten
        que la consulta médica sea más eficiente.
      </p>
      <div className="bg-accent/60 rounded-xl p-3 mb-6 text-xs text-accent-foreground/80 space-y-0.5">
        <p className="font-medium mb-1">Instrucciones:</p>
        <p>• Buena luz natural o artificial</p>
        <p>• Pelo seco, sin gel ni gorro</p>
        <p>• Cámara estable</p>
        <p>• Mostrar claramente la zona afectada</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map(({ key, label, hint, required }) => {
          const file = data[key] as File | null;
          return (
            <label
              key={key}
              className={cn(
                "border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[120px]",
                file
                  ? "border-primary bg-accent/60"
                  : "border-border hover:border-primary/50"
              )}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  onChange({ [key]: f });
                }}
              />
              {file ? (
                <>
                  <span className="text-2xl">✓</span>
                  <p className="text-xs font-semibold mt-1 text-primary">{label}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {file.name}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-2xl text-muted-foreground">📷</span>
                  <p className="text-xs font-semibold mt-1">{label}</p>
                  {!required && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full mt-0.5">
                      opcional
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                </>
              )}
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive bg-destructive/10 rounded-xl p-3">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Frontal y coronilla son obligatorias. Entradas y lateral son opcionales.
        Son confidenciales y solo las verá el médico asignado.
      </p>

      <Button
        onClick={onNext}
        disabled={!requiredUploaded}
        className="w-full mt-4 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Personal data (last step before submit)
// ---------------------------------------------------------------------------

function PersonalStep({ data, onChange, onNext }: StepProps) {
  const phoneDigits = normalizeChileMobileLocalDigits(data.phone);
  const isValid =
    data.firstName.trim() &&
    data.lastName.trim() &&
    isNationalIdInputValid(data.nationalId) &&
    data.email.trim() &&
    phoneDigits.length === 8 &&
    data.age.trim() &&
    data.sex &&
    data.consented === true;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Casi listo — tus datos</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Necesitamos esta información para enviarte tu evaluación y coordinar el siguiente paso.
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName" className="text-sm mb-1.5 block">Nombre</Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder="Juan"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm mb-1.5 block">Apellido</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              placeholder="García"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="nationalId" className="text-sm mb-1.5 block">
            RUT / documento de identidad
          </Label>
          <Input
            id="nationalId"
            autoComplete="off"
            value={data.nationalId}
            onChange={(e) => onChange({ nationalId: e.target.value })}
            placeholder="12.345.678-9"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Necesario para la revisión médica y la receta. Si no tienes RUT chileno, indica tu
            documento.
          </p>
        </div>
        <div>
          <Label htmlFor="email" className="text-sm mb-1.5 block">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="juan@email.com"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm mb-1.5 block">Teléfono celular</Label>
          <div
            className={cn(
              "flex w-full min-w-0 rounded-lg border border-input bg-transparent shadow-xs overflow-hidden",
              "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
            )}
          >
            <span
              className="flex shrink-0 items-center border-r border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground select-none"
              aria-hidden
            >
              +56 9
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phoneDigits}
              onChange={(e) => {
                onChange({ phone: normalizeChileMobileLocalDigits(e.target.value) });
              }}
              placeholder="1234 5678"
              className="flex-1 min-w-0 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-describedby="phone-hint"
            />
          </div>
          <p id="phone-hint" className="text-xs text-muted-foreground mt-1.5">
            Solo los 8 dígitos de tu número móvil (el código de país y el 9 ya están fijos).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="age" className="text-sm mb-1.5 block">Edad</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="99"
              value={data.age}
              onChange={(e) => onChange({ age: e.target.value })}
              placeholder="35"
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Sexo</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ sex: s })}
                  className={cn(
                    "border rounded-xl py-2.5 text-sm font-medium transition-colors",
                    data.sex === s
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {s === "male" ? "Hombre" : "Mujer"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <input
          id="consent"
          type="checkbox"
          checked={data.consented}
          onChange={(e) => onChange({ consented: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary"
        />
        <label htmlFor="consent" className="cursor-pointer text-sm leading-snug text-muted-foreground">
          Acepto que Nilo trate mis datos personales y de salud para coordinar mi evaluación capilar.
          Entiendo que esta evaluación no es un diagnóstico médico y que un médico revisará mi caso
          antes de cualquier indicación de tratamiento.{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Política de privacidad
          </Link>
          .
        </label>
      </div>
      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full mt-4 rounded-full h-12"
      >
        Enviar evaluación
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Submitting
// ---------------------------------------------------------------------------

function SubmittingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-6" />
      <h2 className="text-xl font-bold">Guardando tu evaluación...</h2>
      <p className="text-muted-foreground text-sm mt-2">
        Estamos subiendo tus fotos y registrando tu caso. Un momento.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Hair loss pattern visual selection
// ---------------------------------------------------------------------------

/** Order matches positions in `public/quiz-hair-pattern-grid.png` (filas de izquierda a derecha, arriba abajo). */
const HAIR_PATTERNS = [
  "Sin caída visible",
  "Entradas leves",
  "Entradas notorias",
  "Entradas notorias y coronilla leve",
  "Entradas y coronilla notorias",
  "Entradas y coronilla conectadas",
  "Calvicie avanzada",
  "Calvicie completa",
  "En parches",
] as const;

function HairPatternStep({ data, onChange, onNext }: StepProps) {
  const isValid = !!data.hairPattern;

  return (
    <div>
      <h2 className="sr-only">
        ¿Cuál de las siguientes imágenes representa mejor tu patrón de caída del pelo?
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        Toca el recuadro que mejor coincida con tu patrón. Es tu declaración — no es un diagnóstico.
      </p>

      <div className="relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
        <Image
          src="/quiz-hair-pattern-grid.png"
          alt=""
          width={1200}
          height={1350}
          className="w-full h-auto pointer-events-none select-none"
          priority
        />
        {/* 9 zonas clicables alineadas al grid 3×3 bajo el título del arte */}
        <div
          className={cn(
            "absolute z-10 inset-[3%] grid grid-cols-3 gap-[2.5%]",
            "grid-rows-[minmax(0,19%)_repeat(3,minmax(0,1fr))]"
          )}
        >
          <div className="col-span-3 min-h-0 pointer-events-none" aria-hidden />
          {HAIR_PATTERNS.map((pattern) => (
            <button
              key={pattern}
              type="button"
              aria-label={pattern}
              aria-pressed={data.hairPattern === pattern}
              onClick={() => onChange({ hairPattern: pattern })}
              className={cn(
                "min-h-[44px] min-w-0 rounded-xl transition-colors touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                data.hairPattern === pattern
                  ? "bg-primary/25 ring-2 ring-primary ring-inset"
                  : "bg-transparent hover:bg-primary/10 active:bg-primary/15"
              )}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Seleccionado:{" "}
        <span className="font-medium text-foreground">
          {data.hairPattern ?? "—"}
        </span>
      </p>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full mt-6 rounded-full h-12"
      >
        Continuar
      </Button>
    </div>
  );
}
