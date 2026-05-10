"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PhotoData {
  frontal: File | null;
  top: File | null;
}

interface Zone {
  key: "frontal" | "top";
  label: string;
  description: string;
  file: File | null;
  preview: string | null;
  set: (f: File | null, preview: string | null) => void;
}

export default function PhotoUpload({
  onComplete,
  onBack,
}: {
  onComplete: (photos: PhotoData) => void;
  onBack: () => void;
}) {
  const [frontal, setFrontal] = useState<File | null>(null);
  const [frontalPreview, setFrontalPreview] = useState<string | null>(null);
  const [top, setTop] = useState<File | null>(null);
  const [topPreview, setTopPreview] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const bothReady = frontal !== null && top !== null;

  const zones: Zone[] = [
    {
      key: "frontal",
      label: "Foto frontal o lateral",
      description:
        "Sube una foto clara donde se vea la línea frontal, entradas y densidad del pelo desde el frente o costado.",
      file: frontal,
      preview: frontalPreview,
      set: (f, p) => {
        setFrontal(f);
        setFrontalPreview(p);
      },
    },
    {
      key: "top",
      label: "Foto superior / coronilla",
      description:
        "Sube una foto tomada desde arriba donde se vea claramente la coronilla y la parte superior del cuero cabelludo.",
      file: top,
      preview: topPreview,
      set: (f, p) => {
        setTop(f);
        setTopPreview(p);
      },
    },
  ];

  function handleFileChange(zone: Zone, file: File | undefined) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    zone.set(file, preview);
  }

  function handleSubmit() {
    setAttempted(true);
    if (bothReady) onComplete({ frontal, top });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Sube tus 2 fotos para crear tu Mapa Capilar</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Necesitamos una foto frontal/lateral y una foto desde arriba para analizar línea frontal,
        entradas, densidad y coronilla.
      </p>

      <div className="bg-accent/60 rounded-xl p-3 mb-6 text-xs text-accent-foreground/80 space-y-0.5">
        <p className="font-medium mb-1">Tips para mejores fotos:</p>
        <p>• Buena luz natural o artificial</p>
        <p>• Pelo seco, sin gel ni gorro</p>
        <p>• Mostrar claramente la zona afectada</p>
      </div>

      {/* Mobile: stacked — Desktop: side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {zones.map((zone) => (
          <label
            key={zone.key}
            className={cn(
              "border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors flex flex-col",
              zone.file
                ? "border-primary"
                : attempted && !zone.file
                ? "border-destructive"
                : "border-border hover:border-primary/50"
            )}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange(zone, e.target.files?.[0])}
            />

            {/* Image preview */}
            {zone.preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zone.preview}
                  alt={zone.label}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Cambiar
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-5 min-h-[120px]">
                <span className="text-3xl text-muted-foreground">📷</span>
                <p className="text-xs font-semibold mt-2">{zone.label}</p>
              </div>
            )}

            <div className="px-4 py-3 border-t border-border bg-background/60">
              <p className="text-xs font-semibold text-foreground">{zone.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {zone.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {attempted && !bothReady && (
        <p className="text-sm text-destructive mb-4">
          Para generar tu Mapa Capilar necesitamos ambas fotos: frontal/lateral y superior/coronilla.
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={attempted && !bothReady}
        className="w-full rounded-full h-12"
      >
        Generar mi Mapa Capilar
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver
      </button>
    </div>
  );
}
