"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MESSAGES = [
  "Analizando estructura dental...",
  "Evaluando estado de encías...",
  "Detectando acumulación de sarro...",
  "Revisando alineación y color...",
  "Generando orientación personalizada...",
];

export default function DentalAnalizandoPage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    analyze();
  }, []);

  async function analyze() {
    const answersRaw = sessionStorage.getItem("dental_answers");
    const leadRaw = sessionStorage.getItem("dental_lead");
    const photoFrontalData = sessionStorage.getItem("dental_photo_frontal");
    const photoAbiertaData = sessionStorage.getItem("dental_photo_abierta");
    const answers = answersRaw ? JSON.parse(answersRaw) : {};
    const lead = leadRaw ? JSON.parse(leadRaw) : {};

    try {
      let analysis = null;
      let isFallback = true;

      const toBlob = (dataUrl: string): Blob => {
        const [header, data] = dataUrl.split(",");
        const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
        const binary = atob(data);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new Blob([arr], { type: mime });
      };

      if (photoFrontalData) {
        const formData = new FormData();
        formData.append("answers", JSON.stringify(answers));
        formData.append("photoFrontal", toBlob(photoFrontalData), "frontal.jpg");
        if (photoAbiertaData) formData.append("photoAbierta", toBlob(photoAbiertaData), "abierta.jpg");
        const aiRes = await fetch("/api/ai/dental-map", { method: "POST", body: formData });
        if (aiRes.ok) { const aiData = await aiRes.json(); analysis = aiData.analysis; isFallback = aiData.isFallback; }
      }

      if (!analysis) {
        const { generateFallbackDentalReport } = await import("@/lib/dental/types");
        analysis = generateFallbackDentalReport();
        isFallback = true;
      }

      // Upload photos to Supabase Storage so infographic can use them
      let photoPaths: { frontal?: string; abierta?: string } = {};
      if (photoFrontalData) {
        try {
          const uploadForm = new FormData();
          uploadForm.append("photoFrontal", toBlob(photoFrontalData), "frontal.jpg");
          if (photoAbiertaData) uploadForm.append("photoAbierta", toBlob(photoAbiertaData), "abierta.jpg");
          const uploadRes = await fetch("/api/dental/upload-photos", { method: "POST", body: uploadForm });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            photoPaths = uploadData.paths ?? {};
          }
        } catch (uploadErr) {
          console.error("[dental/analizando] photo upload failed:", uploadErr);
        }
      }

      const leadRes = await fetch("/api/dental/lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead, answers, analysis, photoPaths }),
      });
      let reportId = "demo";
      if (leadRes.ok) { const leadData = await leadRes.json(); reportId = leadData.id ?? "demo"; }

      sessionStorage.setItem("dental_report", JSON.stringify(analysis));
      sessionStorage.setItem("dental_analysis_id", reportId);
      sessionStorage.setItem("dental_is_fallback", String(isFallback));
      router.replace(`/dental/reporte/${reportId}`);
    } catch (err) {
      console.error("[dental/analizando] Error:", err);
      router.replace("/dental/reporte/demo");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="text-6xl animate-bounce">🦷</div>
        <h2 className="text-2xl font-semibold text-gray-900">Analizando tu salud dental</h2>
        <p className="text-base text-gray-500">Nuestra IA está revisando tus fotos y respuestas. Esto toma unos segundos...</p>
        <div className="w-full space-y-2 mt-4">
          {MESSAGES.map((msg, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600"
              style={{ animation: "fadeIn 0.4s ease forwards", animationDelay: `${i * 0.8}s`, opacity: 0 }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] flex-shrink-0" />
              {msg}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
