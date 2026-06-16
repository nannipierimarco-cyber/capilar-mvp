export const BRAND_DENTAL = {
  name: "Perfecto Labs Dental",
  vertical: "dental",
  tone: ["premium", "claro", "confiable", "moderno", "no alarmista"] as const,
  visualStyle: ["clean", "healthcare premium", "blanco", "azul suave", "neutros"] as const,
  restrictions: [
    "No prometer resultados garantizados",
    "No diagnosticar definitivamente desde fotos",
    "No usar antes/después falsos",
    "No usar claims médicos absolutos",
  ],
  ctas: [
    "Evalúa tu sonrisa",
    "Descubre tus opciones",
    "Agenda una evaluación",
    "Recibe una orientación inicial",
  ],
} as const;

export type BrandConfig = typeof BRAND_DENTAL;

export type PostFormat =
  | "static_educational"
  | "price_explainer"
  | "myth_vs_fact"
  | "reel_script";

export const FORMATS: PostFormat[] = [
  "static_educational",
  "price_explainer",
  "myth_vs_fact",
  "reel_script",
];

export const PILLARS = [
  "Educación dental",
  "Desmitificación",
  "Valor",
  "Tratamientos",
  "Prevención",
];

export const PERSONAS = [
  "Adulto 30-45 que evita el dentista por miedo o costo",
  "Persona con mitos sobre el dentista",
  "Paciente interesado en mejorar su sonrisa",
  "Adulto joven 25-35 activo en redes",
  "Paciente listo para tomar acción pero indeciso",
];

export const FUNNEL_STAGES = ["awareness", "consideration", "decision"] as const;
