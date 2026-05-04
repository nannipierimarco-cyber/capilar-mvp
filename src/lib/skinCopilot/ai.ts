// Fine-tuning could improve tone and brevity in a future phase,
// but should NEVER be used as the source of clinical memory —
// memory must always come from the DB profile/history retrieval.

import { SKIN_COPILOT_SYSTEM_PROMPT } from "./prompt";
import type { RiskClassification } from "./classifier";

export interface GenerateReplyOptions {
  userMessage: string;
  profile: Record<string, unknown> | null;
  context: string;
  riskClassification: RiskClassification;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const SAFE_REDIRECT =
  "Esto requiere revisión médica. No puedo diagnosticar ni indicar tratamiento por WhatsApp. " +
  "Te recomiendo agendar una revisión con una dermatóloga para evaluarlo de forma segura. " +
  "Si los síntomas son intensos, progresan rápido o hay dolor importante, busca atención médica.";

const MOCK_GREEN =
  "[Dev — configura OPENAI_API_KEY] El ácido hialurónico es un hidratante compatible con casi todos los tipos de piel y seguro para pieles sensibles.";

const MOCK_YELLOW =
  "[Dev — configura OPENAI_API_KEY] Según tu historial, te recomendaría introducir este activo con cuidado. Lo mejor es validarlo con tu dermatóloga antes de hacer cambios en la rutina. Puedo guardar esta duda para tu próxima revisión, ¿te parece?";

export async function generateSkinCopilotReply({
  userMessage,
  profile,
  context,
  riskClassification,
}: GenerateReplyOptions): Promise<string> {
  // RED: never call AI — always return the safe redirect immediately
  if (riskClassification.riskLevel === "red") {
    return SAFE_REDIRECT;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[SkinCopilot] OPENAI_API_KEY not set — returning mock response for development");
    return riskClassification.riskLevel === "yellow" ? MOCK_YELLOW : MOCK_GREEN;
  }

  const profileContext = profile
    ? `\n\nPerfil de piel registrado:\n${JSON.stringify(profile, null, 2)}`
    : "\n\nNo hay perfil de piel registrado todavía.";

  const cautionNote =
    riskClassification.riskLevel === "yellow"
      ? "\n\nNIVEL DE RIESGO: YELLOW. Responde con cautela, sin certezas clínicas. Recomienda validación dermatológica si es relevante y ofrece guardar la información en el historial."
      : "";

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content: SKIN_COPILOT_SYSTEM_PROMPT + profileContext + cautionNote,
    },
  ];

  if (context) {
    messages.push({
      role: "assistant",
      content: `Historial reciente de la conversación:\n${context}`,
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 350,
        temperature: 0.45,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[SkinCopilot] OpenAI error:", res.status, errText);
      return SAFE_REDIRECT;
    }

    const data = (await res.json()) as OpenAIResponse;
    return data.choices?.[0]?.message?.content ?? SAFE_REDIRECT;
  } catch (err) {
    console.error("[SkinCopilot] Fetch error:", err);
    return SAFE_REDIRECT;
  }
}
