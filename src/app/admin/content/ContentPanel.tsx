"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Post {
  id: string;
  topic: string;
  angle: string | null;
  image_prompt: string | null;
  image_url: string | null;
  caption: string | null;
  hashtags: string | null;
  scheduled_at: string | null;
  status: "draft" | "approved" | "posted";
  posted_at: string | null;
  vertical: string;
  created_at: string;
  // Content engine fields
  format: string | null;
  pillar: string | null;
  hook: string | null;
  cta: string | null;
  generation_status: string | null;
  // AI Content Planner fields
  batch_id: string | null;
  generation_request_id: string | null;
  creative_brief: Record<string, unknown> | null;
  visual_direction: string | null;
  text_overlay: string | null;
  thumbnail_prompt: string | null;
  content_objective: string | null;
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getNextMonday(): string {
  const d = new Date();
  const dow = d.getDay();
  const delta = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

const STATUS_CONFIG = {
  draft:    { label: "Borrador",   bg: "bg-gray-100",   text: "text-gray-600"  },
  approved: { label: "Programado", bg: "bg-green-100",  text: "text-green-700" },
  posted:   { label: "Publicado",  bg: "bg-blue-100",   text: "text-blue-700"  },
};

const GEN_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  idea:             { label: "Idea",         bg: "bg-gray-100",   text: "text-gray-400"  },
  copy_ready:       { label: "Copy listo",   bg: "bg-amber-100",  text: "text-amber-700" },
  asset_ready:      { label: "Imagen lista", bg: "bg-sky-100",    text: "text-sky-700"   },
  ready_for_review: { label: "Para revisar", bg: "bg-green-100",  text: "text-green-700" },
};

const FORMAT_LABELS: Record<string, string> = {
  static_educational: "Educativo",
  price_explainer:    "Precio",
  myth_vs_fact:       "Mito/Hecho",
  reel_script:        "Reel",
};

const OBJECTIVE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  awareness:  { label: "Awareness",  bg: "bg-blue-50",    text: "text-blue-600"   },
  education:  { label: "Educación",  bg: "bg-indigo-50",  text: "text-indigo-600" },
  leads:      { label: "Leads",      bg: "bg-orange-50",  text: "text-orange-600" },
  conversion: { label: "Conversión", bg: "bg-rose-50",    text: "text-rose-600"   },
  trust:      { label: "Confianza",  bg: "bg-teal-50",    text: "text-teal-600"   },
};

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onSave,
  onStatusChange,
  onDelete,
  onMergePost,
}: {
  post: Post;
  onSave: (id: string, updates: Partial<Post>) => Promise<void>;
  onStatusChange: (id: string, status: Post["status"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMergePost: (id: string, partial: Partial<Post>) => void;
}) {
  const [caption, setCaption]               = useState(post.caption ?? "");
  const [hashtags, setHashtags]             = useState(post.hashtags ?? "");
  const [scheduledAt, setScheduledAt]       = useState(toLocalDatetimeValue(post.scheduled_at));
  const [visualDirection, setVisualDirection] = useState(post.visual_direction ?? "");
  const [textOverlay, setTextOverlay]         = useState(post.text_overlay ?? "");
  const [localImageUrl, setLocalImageUrl]   = useState(post.image_url);
  const [dirty, setDirty]                   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatingImage, setGeneratingImage]         = useState(false);
  const [regeneratingCopy, setRegeneratingCopy]       = useState(false);
  const [showDirectionInput, setShowDirectionInput]   = useState(false);
  const [directionText, setDirectionText]             = useState("");
  const [regeneratingFromDirection, setRegeneratingFromDirection] = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusCfg    = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
  const genCfg       = post.generation_status ? GEN_STATUS_CONFIG[post.generation_status] : null;
  const objectiveCfg = post.content_objective ? OBJECTIVE_CONFIG[post.content_objective] : null;
  const campaignTheme = (post.creative_brief as Record<string, string> | null)?.campaign_theme ?? null;

  const missingImage   = !localImageUrl;
  const missingCaption = !caption.trim();
  const canPublish     = !missingImage && !missingCaption;

  function markDirty() {
    setDirty(true);
    setError(null);
  }

  async function handleUpload(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen no puede superar 8MB");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `post-${post.id}-${Date.now()}.${ext}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress: { loaded: number; total: number }) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        } as any);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setLocalImageUrl(publicUrl);
      setUploadProgress(100);
      await onSave(post.id, { image_url: publicUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(post.id, {
        caption,
        hashtags,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        visual_direction: visualDirection || null,
        text_overlay: textOverlay || null,
      });
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule() {
    if (!localImageUrl) { setError("Agrega una imagen antes de aprobar"); return; }
    if (!caption.trim()) { setError("Agrega un caption antes de aprobar"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(post.id, {
        caption,
        hashtags,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: "approved",
        visual_direction: visualDirection || null,
        text_overlay: textOverlay || null,
      });
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aprobar");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishNow() {
    if (!localImageUrl) { setError("Agrega una imagen antes de publicar"); return; }
    if (!caption.trim()) { setError("Agrega un caption antes de publicar"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(post.id, {
        caption,
        hashtags,
        scheduled_at: new Date().toISOString(),
        status: "approved",
        visual_direction: visualDirection || null,
        text_overlay: textOverlay || null,
      });
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al publicar");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    setSaving(true);
    setError(null);
    try {
      await onStatusChange(post.id, "draft");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este post?")) return;
    setDeleting(true);
    try {
      await onDelete(post.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
      setDeleting(false);
    }
  }

  async function handleGenerateImage() {
    setGeneratingImage(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setLocalImageUrl(data.image_url);
      onMergePost(post.id, { image_url: data.image_url, generation_status: "asset_ready" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando imagen");
    } finally {
      setGeneratingImage(false);
    }
  }

  async function handleRegenerateCopy() {
    setRegeneratingCopy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/regenerate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      const p = data.post;
      if (p.caption != null) setCaption(p.caption);
      if (p.hashtags != null) setHashtags(p.hashtags);
      setDirty(false);
      onMergePost(post.id, {
        caption: p.caption,
        hashtags: p.hashtags,
        hook: p.hook,
        cta: p.cta,
        image_prompt: p.image_prompt,
        generation_status: p.generation_status,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error regenerando copy");
    } finally {
      setRegeneratingCopy(false);
    }
  }

  async function handleRegenerateFromDirection() {
    if (!directionText.trim()) return;
    setRegeneratingFromDirection(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/regenerate-from-direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, direction: directionText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      const u = data.updated;
      if (u.caption != null) setCaption(u.caption);
      if (u.hashtags != null) setHashtags(u.hashtags);
      setDirty(false);
      setShowDirectionInput(false);
      setDirectionText("");
      onMergePost(post.id, {
        caption: u.caption,
        hashtags: u.hashtags,
        hook: u.hook,
        image_prompt: u.image_prompt,
        visual_direction: u.visual_direction,
        generation_status: "copy_ready",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error regenerando desde dirección");
    } finally {
      setRegeneratingFromDirection(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image */}
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center relative">
        {localImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localImageUrl} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <span className="text-white text-sm font-semibold">{uploadProgress}%</span>
            <div className="w-2/3 bg-white/30 rounded-full h-1.5">
              <div
                className="bg-[#00B289] h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {generatingImage && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-xs font-semibold">Generando con DALL-E…</span>
          </div>
        )}
      </div>

      {/* Upload / AI generate buttons (only when no image and not loading) */}
      {!localImageUrl && !uploading && !generatingImage && (
        <div className="px-5 pt-4 flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#00B289] hover:text-[#00B289] transition-colors"
          >
            + Subir imagen
          </button>
          {post.status !== "posted" && (
            <button
              onClick={handleGenerateImage}
              disabled={!post.image_prompt}
              title={!post.image_prompt ? "Genera el copy primero (necesita image_prompt)" : "Generar con DALL-E 3"}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 border-dashed border-gray-200 text-gray-400 hover:border-purple-400 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ✨ Generar imagen
            </button>
          )}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Campaign theme (if from a batch) */}
        {campaignTheme && (
          <div className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5 font-medium truncate">
            🎯 {campaignTheme}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1A1F36]/8 text-[#1A1F36]">
            {post.topic}
          </span>
          {post.format && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
              {FORMAT_LABELS[post.format] ?? post.format}
            </span>
          )}
          {post.pillar && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              {post.pillar}
            </span>
          )}
          {objectiveCfg && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${objectiveCfg.bg} ${objectiveCfg.text}`}>
              {objectiveCfg.label}
            </span>
          )}
          {post.vertical && post.vertical !== "dental" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
              {post.vertical}
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
            {statusCfg.label}
          </span>
          {genCfg && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${genCfg.bg} ${genCfg.text}`}>
              {genCfg.label}
            </span>
          )}
          {post.status !== "posted" && missingImage && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Falta imagen
            </span>
          )}
          {post.status !== "posted" && missingCaption && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Falta caption
            </span>
          )}
          {post.status !== "posted" && canPublish && post.status === "draft" && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              Listo para aprobar
            </span>
          )}
          {post.status !== "posted" && canPublish && post.status === "approved" && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              Listo para publicar
            </span>
          )}
        </div>

        {/* Hook / CTA display */}
        {(post.hook || post.cta) && (
          <div className="flex gap-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
            {post.hook && (
              <div className="flex-1 min-w-0">
                <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Hook</span>
                <p className="truncate">{post.hook}</p>
              </div>
            )}
            {post.cta && (
              <div className="flex-1 min-w-0 border-l border-gray-200 pl-3">
                <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">CTA</span>
                <p className="truncate">{post.cta}</p>
              </div>
            )}
          </div>
        )}

        {/* Visual direction — editable */}
        {post.status !== "posted" ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Dirección visual
            </label>
            <textarea
              value={visualDirection}
              onChange={(e) => { setVisualDirection(e.target.value); markDirty(); }}
              rows={2}
              placeholder="Describe el estilo visual: paleta, mood, composición…"
              className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>
        ) : post.visual_direction ? (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
            <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Dirección visual</span>
            <p className="line-clamp-2">{post.visual_direction}</p>
          </div>
        ) : null}

        {/* Text overlay — editable */}
        {post.status !== "posted" ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Texto en imagen <span className="text-gray-300 font-normal normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              value={textOverlay}
              onChange={(e) => { setTextOverlay(e.target.value); markDirty(); }}
              placeholder="Ej: ¿Sabías que…? · Dejarlo vacío = imagen sin texto"
              className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>
        ) : post.text_overlay ? (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
            <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Texto en imagen</span>
            <p>{post.text_overlay}</p>
          </div>
        ) : null}

        {/* Caption */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => { setCaption(e.target.value); markDirty(); }}
            rows={4}
            className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[#00B289] transition-colors"
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Hashtags
          </label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => { setHashtags(e.target.value); markDirty(); }}
            className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00B289] transition-colors"
          />
        </div>

        {/* Scheduled at */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Fecha programada
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => { setScheduledAt(e.target.value); markDirty(); }}
            className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00B289] transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Content generation buttons */}
        {post.status !== "posted" && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateImage}
              disabled={generatingImage || !post.image_prompt}
              title={!post.image_prompt ? "Genera el copy primero (necesita image_prompt)" : "Generar imagen con DALL-E 3"}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generatingImage ? "Generando…" : "✨ Generar imagen"}
            </button>
            {post.status === "draft" && (
              <button
                onClick={handleRegenerateCopy}
                disabled={regeneratingCopy}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors"
              >
                {regeneratingCopy ? "Regenerando…" : "✍️ Regenerar copy"}
              </button>
            )}
          </div>
        )}

        {/* Regenerar desde dirección */}
        {post.status !== "posted" && (
          <div className="space-y-2">
            {!showDirectionInput ? (
              <button
                onClick={() => setShowDirectionInput(true)}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-left"
              >
                🧭 Regenerar desde dirección…
              </button>
            ) : (
              <div className="space-y-2 border border-indigo-100 rounded-xl p-3 bg-indigo-50/50">
                <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Nueva dirección
                </label>
                <textarea
                  value={directionText}
                  onChange={(e) => setDirectionText(e.target.value)}
                  placeholder="Ej: hazlo más premium y enfocado en precio…"
                  rows={2}
                  className="w-full text-sm text-[#1A1F36] border border-indigo-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 bg-white transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerateFromDirection}
                    disabled={regeneratingFromDirection || !directionText.trim()}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {regeneratingFromDirection ? "Aplicando…" : "Aplicar dirección"}
                  </button>
                  <button
                    onClick={() => { setShowDirectionInput(false); setDirectionText(""); }}
                    className="py-2 px-3 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#1A1F36] text-white hover:bg-[#2d3555] disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}

          {post.status !== "posted" && (
            <>
              <button
                onClick={handleSchedule}
                disabled={saving || !canPublish}
                title={missingImage ? "Falta imagen" : missingCaption ? "Falta caption" : undefined}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#00B289] text-white hover:bg-[#009e7a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "…" : "✓ Aprobar programación"}
              </button>
              <button
                onClick={handlePublishNow}
                disabled={saving || !canPublish}
                title={missingImage ? "Falta imagen" : missingCaption ? "Falta caption" : undefined}
                className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#1A1F36] text-white hover:bg-[#2d3555] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "…" : "⚡ Publicar ahora"}
              </button>
            </>
          )}

          {post.status === "approved" && (
            <button
              onClick={handleReject}
              disabled={saving}
              className="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "…" : "✕ Rechazar"}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {deleting ? "…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Content Planner Panel ──────────────────────────────────────────────────

function AiContentPlanner({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen]             = useState(false);
  const [briefText, setBriefText]   = useState("");
  const [count, setCount]           = useState(7);
  const [vertical, setVertical]     = useState("dental");
  const [weekStart, setWeekStart]   = useState(getNextMonday());
  const [objective, setObjective]   = useState("leads");
  const [primaryCta, setPrimaryCta] = useState("Agenda una evaluación");
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  // Visual direction state
  const [visualOpen, setVisualOpen]   = useState(false);
  const [visualStyle, setVisualStyle] = useState("Premium healthcare, clean, modern, trustworthy, white and soft blue palette, elegant dental aesthetic, not generic stock.");
  const [visualMood, setVisualMood]   = useState("premium");
  const [imageTypePref, setImageTypePref] = useState("static-post");
  const [textDensity, setTextDensity]     = useState("headline-only");
  const [avoidVisuals, setAvoidVisuals]   = useState("Avoid invasive dental procedures, blood, exaggerated perfect teeth, fake before/after comparisons, cheap stock-photo look, fear-based visuals.");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [assetProvider, setAssetProvider]   = useState("openai");

  async function handleGenerate() {
    if (!briefText.trim()) {
      setError("Escribe un brief para continuar");
      return;
    }
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/content/generate-from-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical,
          user_prompt: briefText,
          count,
          week_start: weekStart,
          objective,
          primary_cta: primaryCta,
          visual_style:           visualStyle,
          visual_mood:            visualMood,
          image_type_preference:  imageTypePref,
          text_density:           textDensity,
          avoid_visuals:          avoidVisuals,
          reference_notes:        referenceNotes,
          asset_provider:         assetProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      const n = data.count ?? data.posts?.length ?? count;
      setSuccess(`Se generaron ${n} post${n !== 1 ? "s" : ""} desde tu brief.`);
      setBriefText("");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando desde brief");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => { setOpen((v) => !v); setError(null); setSuccess(null); }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">🤖</span>
          <div className="text-left">
            <p className="text-sm font-bold text-[#1A1F36]">AI Content Planner</p>
            <p className="text-xs text-gray-400">Genera contenido desde un brief maestro</p>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          <div className="pt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Brief de contenido
            </label>
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="Ej: Quiero 7 contenidos para Perfecto Labs Dental esta semana. Foco en estética dental, precios transparentes y ortodoncia invisible. Tono premium, confiable y moderno. CTA principal: agenda una evaluación."
              rows={5}
              className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(14, Number(e.target.value))))}
                className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Vertical
              </label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 bg-white transition-colors"
              >
                <option value="dental">Dental</option>
                <option value="capilar">Capilar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Inicio semana
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Objetivo
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 bg-white transition-colors"
              >
                <option value="awareness">Awareness</option>
                <option value="education">Educación</option>
                <option value="leads">Leads</option>
                <option value="conversion">Conversión</option>
                <option value="trust">Confianza</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              CTA principal
            </label>
            <input
              type="text"
              value={primaryCta}
              onChange={(e) => setPrimaryCta(e.target.value)}
              placeholder="Agenda una evaluación"
              className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Visual Direction sub-section */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setVisualOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Dirección visual</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={`text-gray-400 transition-transform duration-200 ${visualOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {visualOpen && (
              <div className="px-4 pb-4 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Estilo visual
                  </label>
                  <textarea
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    rows={2}
                    className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Mood
                    </label>
                    <select
                      value={visualMood}
                      onChange={(e) => setVisualMood(e.target.value)}
                      className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 bg-white transition-colors"
                    >
                      <option value="premium">Premium</option>
                      <option value="editorial">Editorial</option>
                      <option value="clean">Clean</option>
                      <option value="aspirational">Aspiracional</option>
                      <option value="clinical">Clínico</option>
                      <option value="social-ad">Social Ad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Tipo imagen
                    </label>
                    <select
                      value={imageTypePref}
                      onChange={(e) => setImageTypePref(e.target.value)}
                      className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 bg-white transition-colors"
                    >
                      <option value="static-post">Post estático</option>
                      <option value="reel-cover">Cover de reel</option>
                      <option value="testimonial-quote">Quote testimonial</option>
                      <option value="price-explainer">Explainer precio</option>
                      <option value="educational-graphic">Gráfico educativo</option>
                      <option value="lifestyle">Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Texto en imagen
                    </label>
                    <select
                      value={textDensity}
                      onChange={(e) => setTextDensity(e.target.value)}
                      className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 bg-white transition-colors"
                    >
                      <option value="no-text">Sin texto</option>
                      <option value="minimal-text">Mínimo</option>
                      <option value="headline-only">Solo titular</option>
                      <option value="moderate-text">Moderado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Proveedor de imagen
                    </label>
                    <select
                      value={assetProvider}
                      onChange={(e) => setAssetProvider(e.target.value)}
                      className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 bg-white transition-colors"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="higgsfield_later">Higgsfield (manual)</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Evitar en visuals
                  </label>
                  <textarea
                    value={avoidVisuals}
                    onChange={(e) => setAvoidVisuals(e.target.value)}
                    rows={2}
                    className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Notas de referencia <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea
                    value={referenceNotes}
                    onChange={(e) => setReferenceNotes(e.target.value)}
                    rows={2}
                    placeholder="Marcas de referencia, ejemplos visuales, links…"
                    className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !briefText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando contenido…
              </>
            ) : (
              "✨ Generar contenido desde brief"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── ContentPanel ──────────────────────────────────────────────────────────────

export default function ContentPanel() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError]         = useState<string | null>(null);
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [weekError, setWeekError]           = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress]       = useState<{ done: number; total: number } | null>(null);
  const [imageResult, setImageResult]           = useState<{ ok: number; failed: { topic: string; error: string }[] } | null>(null);

  // Apply visual direction to drafts
  const [applyVdOpen, setApplyVdOpen]       = useState(false);
  const [applyVdText, setApplyVdText]       = useState("");
  const [applyVdRunning, setApplyVdRunning] = useState(false);
  const [applyVdProgress, setApplyVdProgress] = useState<{ done: number; total: number } | null>(null);
  const [applyVdResult, setApplyVdResult]   = useState<{ ok: number; skipped: string[] } | null>(null);
  const [applyVdError, setApplyVdError]     = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/posts");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Error al cargar posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSave = useCallback(async (id: string, updates: Partial<Post>) => {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Error ${res.status}`);
    }
    const { post } = await res.json();
    setPosts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...post } : p));
      const order = { draft: 0, approved: 1, posted: 2 };
      return updated.sort(
        (a, b) =>
          (order[a.status as keyof typeof order] ?? 3) -
          (order[b.status as keyof typeof order] ?? 3)
      );
    });
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: Post["status"]) => {
    await handleSave(id, { status });
  }, [handleSave]);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Error ${res.status}`);
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleMergePost = useCallback((id: string, partial: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...partial } : p)));
  }, []);

  const handleGenerateWeek = useCallback(async () => {
    setGeneratingWeek(true);
    setWeekError(null);
    try {
      const weekStart = getNextMonday();
      const res = await fetch("/api/admin/content/generate-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical: "dental", count: 7, week_start: weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      await fetchPosts();
    } catch (e) {
      setWeekError(e instanceof Error ? e.message : "Error generando posts");
    } finally {
      setGeneratingWeek(false);
    }
  }, [fetchPosts]);

  const handleGeneratePendingImages = useCallback(async () => {
    const pending = posts.filter(
      (p) => p.status !== "posted" && !p.image_url && p.image_prompt?.trim()
    );

    if (pending.length === 0) {
      setImageResult({ ok: 0, failed: [{ topic: "__none__", error: "No hay imágenes pendientes por generar." }] });
      return;
    }

    setGeneratingImages(true);
    setImageResult(null);
    setImageProgress({ done: 0, total: pending.length });

    const failed: { topic: string; error: string }[] = [];
    let ok = 0;

    for (let i = 0; i < pending.length; i++) {
      const post = pending[i];
      setImageProgress({ done: i, total: pending.length });
      try {
        const res = await fetch("/api/admin/content/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: post.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
        handleMergePost(post.id, { image_url: data.image_url, generation_status: "asset_ready" });
        ok++;
      } catch (e) {
        failed.push({
          topic: post.topic ?? post.id,
          error: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    }

    setImageProgress({ done: pending.length, total: pending.length });
    setImageResult({ ok, failed });
    setGeneratingImages(false);
    await fetchPosts();
  }, [posts, handleMergePost, fetchPosts]);

  const handleApplyVisualDirection = useCallback(async () => {
    if (!applyVdText.trim()) { setApplyVdError("Escribe una instrucción"); return; }
    const targets = posts.filter((p) => p.status !== "posted" && !p.image_url);
    if (targets.length === 0) { setApplyVdError("No hay borradores sin imagen a los que aplicar"); return; }
    setApplyVdRunning(true);
    setApplyVdError(null);
    setApplyVdResult(null);
    setApplyVdProgress({ done: 0, total: targets.length });
    let ok = 0;
    const skipped: string[] = [];
    for (let i = 0; i < targets.length; i++) {
      const post = targets[i];
      try {
        const res = await fetch(`/api/admin/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visual_direction: applyVdText.trim() }),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        handleMergePost(post.id, { visual_direction: applyVdText.trim() });
        ok++;
      } catch (e) {
        skipped.push(post.topic ?? post.id);
      }
      setApplyVdProgress({ done: i + 1, total: targets.length });
    }
    setApplyVdResult({ ok, skipped });
    setApplyVdRunning(false);
  }, [posts, applyVdText, handleMergePost]);

  const draftCount    = posts.filter((p) => p.status === "draft").length;
  const approvedCount = posts.filter((p) => p.status === "approved").length;
  const postedCount   = posts.filter((p) => p.status === "posted").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#1A1F36] uppercase">
              Perfecto Labs
            </span>
            <h1 className="text-lg font-bold text-[#1A1F36] leading-tight">
              Panel de contenido
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="font-semibold text-gray-600">{draftCount} borrador{draftCount !== 1 ? "es" : ""}</span>
            <span className="font-semibold text-[#00B289]">{approvedCount} programado{approvedCount !== 1 ? "s" : ""}</span>
            {postedCount > 0 && (
              <span className="font-semibold text-blue-500">{postedCount} publicado{postedCount !== 1 ? "s" : ""}</span>
            )}
            <button
              onClick={fetchPosts}
              className="ml-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Recargar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-5.51" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-4 py-6">
        {/* AI Content Planner */}
        <AiContentPlanner onSuccess={fetchPosts} />

        {/* Apply visual direction to drafts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
          <button
            type="button"
            onClick={() => { setApplyVdOpen((v) => !v); setApplyVdError(null); setApplyVdResult(null); }}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🎨</span>
              <div className="text-left">
                <p className="text-sm font-bold text-[#1A1F36]">Aplicar dirección visual a borradores</p>
                <p className="text-xs text-gray-400">Asigna un estilo visual global a posts sin imagen</p>
              </div>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round"
              className={`text-gray-400 transition-transform duration-200 ${applyVdOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {applyVdOpen && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              <textarea
                value={applyVdText}
                onChange={(e) => setApplyVdText(e.target.value)}
                rows={3}
                placeholder="Ej: Premium healthcare, clean, modern, soft blue and white palette, no invasive procedures."
                className="w-full text-sm text-[#1A1F36] border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-400 transition-colors"
              />
              {applyVdRunning && applyVdProgress && (
                <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                  Aplicando… {applyVdProgress.done}/{applyVdProgress.total}
                </p>
              )}
              {applyVdError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{applyVdError}</p>
              )}
              {applyVdResult && (
                <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  Dirección visual aplicada a {applyVdResult.ok} post{applyVdResult.ok !== 1 ? "s" : ""}.
                  {applyVdResult.skipped.length > 0 && ` ${applyVdResult.skipped.length} fallaron.`}
                </p>
              )}
              <button
                type="button"
                onClick={handleApplyVisualDirection}
                disabled={applyVdRunning || !applyVdText.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
              >
                {applyVdRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    Aplicando…
                  </>
                ) : (
                  "Aplicar a borradores sin imagen"
                )}
              </button>
              <p className="text-xs text-gray-400">Solo afecta posts que no están publicados y no tienen imagen.</p>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-xs text-gray-400">
            {posts.length} post{posts.length !== 1 ? "s" : ""} en total
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGeneratePendingImages}
              disabled={generatingImages || generatingWeek || loading}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-all"
            >
              {generatingImages && imageProgress ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  {`Generando imágenes ${imageProgress.done}/${imageProgress.total}…`}
                </>
              ) : (
                "✨ Generar imágenes pendientes"
              )}
            </button>
            <button
              onClick={handleGenerateWeek}
              disabled={generatingWeek || generatingImages}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {generatingWeek ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando…
                </>
              ) : (
                "✨ Generar 7 posts"
              )}
            </button>
          </div>
        </div>

        {weekError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-4">
            {weekError}
          </div>
        )}

        {imageResult && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${
            imageResult.failed.length === 1 && imageResult.failed[0].topic === "__none__"
              ? "bg-gray-50 border border-gray-200 text-gray-500"
              : imageResult.failed.length === 0
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}>
            {imageResult.failed.length === 1 && imageResult.failed[0].topic === "__none__" ? (
              imageResult.failed[0].error
            ) : (
              <>
                <p className="font-semibold">
                  Se generaron {imageResult.ok} imagen{imageResult.ok !== 1 ? "es" : ""}.
                  {imageResult.failed.length > 0 && ` ${imageResult.failed.length} fallaron.`}
                </p>
                {imageResult.failed.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {imageResult.failed.map((f, i) => (
                      <li key={i} className="text-xs">
                        <span className="font-medium">{f.topic}:</span> {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <div className="w-5 h-5 border-2 border-[#00B289] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando posts…</span>
          </div>
        )}

        {fetchError && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
            {fetchError}
          </div>
        )}

        {!loading && !fetchError && posts.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">No hay posts todavía.</p>
            <p className="text-xs mt-1">Usa el AI Content Planner o "Generar 7 posts" para empezar.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSave={handleSave}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onMergePost={handleMergePost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
