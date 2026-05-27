export type AppointmentVertical = "dental" | "hair" | "skin";

export interface VerticalConfig {
  title: string;
  subtitle: string;
  serviceDefault: string;
  services: string[];
  hubspotService: string;
  hubspotChannel: string;
}

export const APPOINTMENT_VERTICALS: Record<AppointmentVertical, VerticalConfig> = {
  dental: {
    title: "Agenda tu evaluación dental",
    subtitle: "Revisemos tu caso y definamos la mejor ruta de tratamiento.",
    serviceDefault: "Evaluación dental",
    services: [
      "Evaluación dental",
      "Ortodoncia / alineadores",
      "Estética dental",
      "Implantes / rehabilitación",
      "Limpieza / diagnóstico",
    ],
    hubspotService: "Evaluación dental",
    hubspotChannel: "website_dental",
  },
  hair: {
    title: "Agenda tu evaluación capilar",
    subtitle: "Revisemos tu caso y definamos tu ruta capilar.",
    serviceDefault: "Evaluación capilar",
    services: [
      "Evaluación capilar",
      "PRP / mesoterapia",
      "Trasplante capilar",
      "Seguimiento capilar",
    ],
    hubspotService: "Evaluación capilar",
    hubspotChannel: "website_hair",
  },
  skin: {
    title: "Agenda tu evaluación dermatológica",
    subtitle: "Revisemos tu piel y definamos próximos pasos.",
    serviceDefault: "Evaluación dermatológica",
    services: [
      "Evaluación dermatológica",
      "Acné",
      "Manchas",
      "Anti-aging",
      "Rutina personalizada",
    ],
    hubspotService: "Evaluación dermatológica",
    hubspotChannel: "website_skin",
  },
};

export function isValidVertical(v: unknown): v is AppointmentVertical {
  return v === "dental" || v === "hair" || v === "skin";
}
