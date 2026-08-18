"use client";
import { useState } from "react";

export default function FileLinkButton({
  quoteId,
  hasFile,
  fallbackUrl,
  className,
  label = "Ver archivo →",
}: {
  quoteId: string;
  hasFile: boolean;
  fallbackUrl?: string | null;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (!hasFile && !fallbackUrl) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  async function handleClick() {
    if (!hasFile) {
      window.open(fallbackUrl!, "_blank", "noopener,noreferrer");
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/dental-quotes/${quoteId}/signed-url`);
      const data = await res.json();
      if (!res.ok || !data.signedUrl) throw new Error();
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className ?? "text-xs font-medium text-[#0EA5E9] hover:underline disabled:opacity-50"}
    >
      {loading ? "Generando link…" : error ? "Error — reintentar" : label}
    </button>
  );
}
