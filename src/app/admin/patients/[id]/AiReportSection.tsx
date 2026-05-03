"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, RefreshCw, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AiDoctorReport, type PhotoObservation } from "@/lib/types";

const RISK_COLORS: Record<string, string> = {
  Bajo: "bg-green-100 text-green-800",
  Medio: "bg-yellow-100 text-yellow-800",
  Alto: "bg-red-100 text-red-800",
};

const PHOTO_QUALITY_COLORS: Record<string, string> = {
  buena: "bg-green-100 text-green-800",
  media: "bg-yellow-100 text-yellow-800",
  baja: "bg-red-100 text-red-800",
  insuficiente: "bg-gray-100 text-gray-700",
};

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${className ?? "bg-muted text-muted-foreground"}`}>
      {text}
    </span>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${className ?? "text-muted-foreground"}`}>
      {children}
    </p>
  );
}

function PhotoObservationSection({ obs }: { obs: PhotoObservation }) {
  return (
    <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-blue-700" />
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">
          Observación preliminar de fotos
        </p>
      </div>

      <div className="grid gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Fotos recibidas</p>
          {obs.received_photos.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {obs.received_photos.map((p, i) => (
                <Badge key={i} text={p} className="bg-blue-100 text-blue-800" />
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Ninguna foto recibida</span>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Calidad de fotos</p>
          <Badge
            text={obs.photo_quality}
            className={PHOTO_QUALITY_COLORS[obs.photo_quality] ?? "bg-muted text-muted-foreground"}
          />
        </div>

        {obs.visible_areas_to_review.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Zonas visibles a revisar</p>
            <ul className="space-y-1">
              {obs.visible_areas_to_review.map((area, i) => (
                <li key={i} className="text-sm leading-relaxed">• {area}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Consistencia con respuestas del paciente</p>
          <p className="text-sm leading-relaxed">{obs.consistency_with_answers}</p>
        </div>

        {obs.recommended_additional_photos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Fotos adicionales sugeridas</p>
            <div className="flex flex-wrap gap-1.5">
              {obs.recommended_additional_photos.map((p, i) => (
                <Badge key={i} text={p} className="bg-orange-100 text-orange-800" />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Resumen visual preliminar</p>
          <p className="text-sm leading-relaxed">{obs.photo_observation_summary}</p>
        </div>
      </div>

      <div className="border-t border-blue-200 pt-3">
        <p className="text-xs text-blue-700 italic">
          Esta observación visual fue generada por AI como apoyo preliminar. No constituye diagnóstico y debe ser validada por un médico.
        </p>
      </div>
    </div>
  );
}

function ReportDisplay({ report }: { report: AiDoctorReport }) {
  return (
    <div className="space-y-5">

      {/* Header badges: nivel de atención, ruta, próximo paso */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge
          text={`Nivel de atención: ${report.risk_level ?? "—"}`}
          className={RISK_COLORS[report.risk_level ?? ""] ?? "bg-muted text-muted-foreground"}
        />
        <Badge
          text={report.preliminary_route ?? "—"}
          className="bg-blue-100 text-blue-800"
        />
        <Badge
          text={report.operational_next_step ?? "—"}
          className="bg-purple-100 text-purple-800"
        />
      </div>

      {/* A. Resumen del caso */}
      <div>
        <SectionLabel>Resumen del caso</SectionLabel>
        <p className="text-sm leading-relaxed">{report.summary_for_doctor ?? "—"}</p>
      </div>

      {/* B. Observación preliminar de fotos */}
      {report.photo_observation ? (
        <PhotoObservationSection obs={report.photo_observation} />
      ) : (
        <div className="border border-muted rounded-xl p-4 flex items-center gap-2 text-muted-foreground">
          <Camera className="w-4 h-4 shrink-0" />
          <p className="text-sm">Observación de fotos no generada</p>
        </div>
      )}

      {/* E. Señales de alerta a revisar */}
      {report.red_flags && report.red_flags.length > 0 && (
        <div>
          <SectionLabel className="text-orange-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Señales de alerta a revisar
          </SectionLabel>
          <ul className="space-y-1">
            {report.red_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* F. Preguntas sugeridas para el médico */}
      {report.doctor_questions && report.doctor_questions.length > 0 && (
        <div>
          <SectionLabel>Preguntas sugeridas para el médico</SectionLabel>
          <ul className="space-y-1">
            {report.doctor_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* G. Consideraciones clínicas posibles */}
      {report.possible_considerations && report.possible_considerations.length > 0 && (
        <div>
          <SectionLabel>Consideraciones clínicas posibles</SectionLabel>
          <ul className="space-y-1">
            {report.possible_considerations.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* I. Nota para comunicación al paciente */}
      {report.patient_facing_copy_suggestion && (
        <div className="bg-muted/40 rounded-xl p-4">
          <SectionLabel>Nota para comunicación al paciente</SectionLabel>
          <p className="text-sm italic text-muted-foreground">{report.patient_facing_copy_suggestion}</p>
        </div>
      )}

      {/* J. Nota interna de seguridad */}
      <div className="border border-orange-200 bg-orange-50 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-orange-800 mb-0.5">Nota interna de seguridad</p>
          <p className="text-xs text-orange-800">{report.internal_note}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Generado: {new Date(report.created_at).toLocaleString("es-CL")} · Modelo: {report.model_name ?? "—"}
      </p>
    </div>
  );
}

export function AiReportSection({
  intakeId,
  report: initialReport,
}: {
  intakeId: string;
  report: AiDoctorReport | null;
}) {
  const router = useRouter();
  const [report, setReport] = useState<AiDoctorReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(force = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/doctor-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_id: intakeId, force }),
      });
      const json = await res.json() as { ok?: boolean; skipped?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al generar informe");
      } else {
        router.refresh();
      }
    } catch {
      setError("Error de red al generar informe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">Informe preliminar AI para médico</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generado automáticamente. No constituye diagnóstico ni prescripción.
          </p>
        </div>
        {!report && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(false)}
            disabled={loading}
            className="gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generando..." : "Generar informe AI"}
          </Button>
        )}
        {report && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleGenerate(true)}
            disabled={loading}
            className="gap-1.5 text-muted-foreground shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Regenerando..." : "Regenerar"}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3 mb-4">{error}</p>
      )}

      {report ? (
        <ReportDisplay report={report} />
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Informe AI pendiente</p>
          <p className="text-xs text-muted-foreground mt-1">
            Haz clic en "Generar informe AI" para crear el informe preliminar.
          </p>
        </div>
      )}
    </div>
  );
}
