"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  patientId: string;
  patientName: string;
}

export function DeletePatientButton({ patientId, patientName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Eliminar a ${patientName} y todos sus datos? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/patients/${patientId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Error desconocido");
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar paciente");
      setLoading(false);
    }
  }

  return (
    <div className="ml-auto flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
        className="gap-1.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {loading ? "Eliminando..." : "Eliminar paciente"}
      </Button>
      {error && (
        <p className="text-xs text-destructive max-w-48 text-right">{error}</p>
      )}
    </div>
  );
}
