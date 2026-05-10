import type { Metadata } from "next";
import SkinAssessmentFunnel from "./SkinAssessmentFunnel";

export const metadata: Metadata = {
  title: "Evaluación de Piel — Perfecto",
  description:
    "Pre-evaluación dermatológica online. Responde preguntas, sube fotos y ayuda al dermatólogo a revisar tu caso antes de la visita.",
};

export default function EvaluacionPielPage() {
  return <SkinAssessmentFunnel />;
}
