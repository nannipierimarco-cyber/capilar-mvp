"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ScoreCapilarAnswers } from "@/lib/scoreCapilar";

interface Question {
  key: keyof ScoreCapilarAnswers;
  label: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: "edad",
    label: "¿Cuántos años tienes?",
    options: ["18–24", "25–34", "35–44", "45–54", "55+"],
  },
  {
    key: "zona",
    label: "¿Qué zona te preocupa más?",
    options: [
      "Entradas",
      "Coronilla",
      "Densidad general",
      "Caída difusa",
      "Post-trasplante",
      "Estoy evaluando trasplante",
      "No estoy seguro",
    ],
  },
  {
    key: "tiempo",
    label: "¿Hace cuánto lo notas?",
    options: ["Menos de 3 meses", "3–6 meses", "6–12 meses", "Más de 1 año", "Más de 3 años"],
  },
  {
    key: "avance",
    label: "¿Cómo describirías el avance?",
    options: ["Estable", "Lento", "Rápido", "Por épocas", "No sé"],
  },
  {
    key: "previo",
    label: "¿Has usado algo antes?",
    options: [
      "Nada",
      "Shampoo/vitaminas",
      "Tratamiento médico",
      "PRP/mesoterapia",
      "Trasplante",
      "Prefiero no decir",
    ],
  },
  {
    key: "busca",
    label: "¿Qué estás buscando principalmente?",
    options: [
      "Entender qué me pasa",
      "Prevenir que avance",
      "Mejorar densidad",
      "Saber si necesito trasplante",
      "Seguimiento post-trasplante",
      "Comparar opciones",
    ],
  },
  {
    key: "disposicion",
    label: "¿Estarías dispuesto a hacer una revisión médica online si tu score lo recomienda?",
    options: ["Sí, esta semana", "Sí, este mes", "Tal vez", "Solo quiero información"],
  },
];

const EMPTY: ScoreCapilarAnswers = {
  edad: "",
  zona: "",
  tiempo: "",
  avance: "",
  previo: "",
  busca: "",
  disposicion: "",
};

export default function MiniQuiz({
  onComplete,
}: {
  onComplete: (answers: ScoreCapilarAnswers) => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<ScoreCapilarAnswers>(EMPTY);
  const [advancing, setAdvancing] = useState(false);

  const q = QUESTIONS[qIndex];
  const isLast = qIndex === QUESTIONS.length - 1;

  function handleSelect(value: string) {
    if (advancing) return;
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);
    setAdvancing(true);
    setTimeout(() => {
      setAdvancing(false);
      if (isLast) {
        onComplete(newAnswers);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
        setQIndex((i) => i + 1);
      }
    }, 320);
  }

  function handleBack() {
    if (qIndex === 0) return;
    setQIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
        Pregunta {qIndex + 1} de {QUESTIONS.length}
      </p>

      <h2 className="text-2xl font-bold mb-6 leading-snug">{q.label}</h2>

      <div className="space-y-2">
        {q.options.map((opt) => {
          const isSelected = answers[q.key] === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              disabled={advancing}
              className={cn(
                "w-full text-left border rounded-2xl px-4 py-3.5 text-sm transition-all",
                isSelected
                  ? "border-primary bg-accent ring-1 ring-primary text-accent-foreground font-medium"
                  : "border-border hover:border-primary/50 bg-white"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {qIndex > 0 && (
        <button
          type="button"
          onClick={handleBack}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </button>
      )}
    </div>
  );
}
