"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PhotoData {
  frontal: File | null;
  top: File | null;
}

export default function PhotoUpload({
  onComplete,
  onBack,
}: {
  onComplete: (photos: PhotoData) => void;
  onBack: () => void;
}) {
  const [frontal, setFrontal] = useState<File | null>(null);
  const [top, setTop] = useState<File | null>(null);

  const bothReady = frontal !== null && top !== null;

  const zones: {
    key: "frontal" | "top";
    label: string;
    hint: string;
    file: File | null;
    set: (f: File | null) => void;
  }[] = [
    {
      key: "frontal",
      label: "Foto frontal",
      hint: "Frente completa, mirando a la cámara",
      file: frontal,
      set: setFrontal,
    },
    {
      key: "top",
      label: "Foto desde arriba",
      hint: "Vista superior, pelo hacia adelante",
      file: top,
      set: setTop,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Sube tus 2 fotos</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Estas fotos nos ayudan a orientar mejor tu Score Capilar. No reemplazan una revisión médica.
      </p>

      <div className="bg-accent/60 rounded-xl p-3 mb-6 text-xs text-accent-foreground/80 space-y-0.5">
        <p className="font-medium mb-1">Tips para mejores fotos:</p>
        <p>• Buena luz natural o artificial</p>
        <p>• Pelo seco, sin gel ni gorro</p>
        <p>• Mostrar claramente la zona afectada</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {zones.map(({ key, label, hint, file, set }) => (
          <label
            key={key}
            className={cn(
              "border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[140px]",
              file
                ? "border-primary bg-accent/60"
                : "border-border hover:border-primary/50"
            )}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => set(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <span className="text-3xl">✓</span>
                <p className="text-xs font-semibold mt-1.5 text-primary">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[110px]">
                  {file.name}
                </p>
              </>
            ) : (
              <>
                <span className="text-3xl text-muted-foreground">📷</span>
                <p className="text-xs font-semibold mt-1.5">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
              </>
            )}
          </label>
        ))}
      </div>

      <Button
        onClick={() => onComplete({ frontal, top })}
        disabled={!bothReady}
        className="w-full rounded-full h-12"
      >
        Ver mi Score Capilar
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
