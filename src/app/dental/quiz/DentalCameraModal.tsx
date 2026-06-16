"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  photoType: "frontal" | "abierta";
  onCapture: (file: File) => void;
  onClose: () => void;
}

type ModalMode = "camera" | "preview" | "error";

export default function DentalCameraModal({
  open,
  photoType,
  onCapture,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<ModalMode>("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flash, setFlash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(
    async (facing: "environment" | "user" = "environment") => {
      setCameraReady(false);
      if (!navigator.mediaDevices?.getUserMedia) {
        setMode("error");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // AbortError si se desmonta antes de completar
        }
        setCameraReady(true);
        setMode("camera");
      } catch {
        setMode("error");
      }
    },
    []
  );

  useEffect(() => {
    if (open) {
      setFlash(false);
      setPreviewUrl(null);
      setPendingFile(null);
      setMode("camera");
      startCamera(facingMode);
    } else {
      stopCamera();
      setMode("camera");
    }
    return () => stopCamera();
    // facingMode no va en deps — se pasa explícitamente al llamar startCamera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startCamera, stopCamera]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File(
          [blob],
          `dental_${photoType}_${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        const url = canvas.toDataURL("image/jpeg", 0.92);
        stopCamera();
        setPendingFile(file);
        setPreviewUrl(url);
        setMode("preview");
      },
      "image/jpeg",
      0.92
    );
  }

  function handleFlipCamera() {
    const next: "environment" | "user" =
      facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    stopCamera();
    startCamera(next);
  }

  function handleRetake() {
    setPendingFile(null);
    setPreviewUrl(null);
    startCamera(facingMode);
  }

  function handleUsePhoto() {
    if (pendingFile) onCapture(pendingFile);
  }

  function handleGalleryFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    stopCamera();
    setPendingFile(file);
    setPreviewUrl(url);
    setMode("preview");
  }

  function handleClose() {
    stopCamera();
    setMode("camera");
    setPreviewUrl(null);
    setPendingFile(null);
    onClose();
  }

  if (!open) return null;

  const photoLabel = photoType === "frontal" ? "Foto frontal" : "Boca abierta";
  const guideText =
    photoType === "frontal"
      ? "Centra tu sonrisa dentro de la guía"
      : "Abre la boca y centra dientes y encías";
  const microCopy =
    photoType === "frontal"
      ? "Muestra los dientes de frente, con buena luz y sin filtros"
      : "Intenta mostrar la mayor cantidad posible de dientes y encías";

  // ── Vista previa ───────────────────────────────────────────────────────────
  if (mode === "preview" && previewUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Vista previa"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradientes arriba y abajo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 65%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-12 pb-4">
          <button
            onClick={handleRetake}
            aria-label="Repetir foto"
            className="w-11 h-11 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <IconRetake />
          </button>
          <div className="flex-1 text-center">
            <span className="text-white text-sm font-semibold tracking-wide">
              Vista previa
            </span>
          </div>
          <div className="w-11" />
        </div>

        {/* Bottom sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] px-6 pt-4 pb-10 shadow-2xl">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0EA5E9] text-center mb-1">
            {photoLabel}
          </p>
          <p className="text-base font-bold text-gray-900 text-center mb-1">
            ¿Usar esta foto?
          </p>
          <p className="text-sm text-gray-400 text-center mb-6">
            Asegúrate de que los dientes se vean con buena iluminación.
          </p>
          <button
            onClick={handleUsePhoto}
            className="w-full py-[15px] rounded-2xl bg-[#0EA5E9] text-white font-semibold text-base mb-3 active:opacity-90 transition-opacity"
          >
            Usar esta foto
          </button>
          <button
            onClick={handleRetake}
            className="w-full py-[15px] rounded-2xl border border-gray-200 text-gray-700 font-semibold text-base active:bg-gray-50 transition-colors"
          >
            Repetir foto
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (mode === "error") {
    return (
      <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col">
        {/* Header */}
        <div className="flex items-center px-5 pt-12 pb-4">
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <IconClose />
          </button>
        </div>

        {/* Mensaje */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 gap-5">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 flex items-center justify-center">
            <IconCameraOff />
          </div>
          <p className="text-white font-bold text-center text-lg">
            No pudimos abrir la cámara
          </p>
          <p className="text-white/50 text-sm text-center leading-relaxed max-w-xs">
            Puedes subir una foto desde tu galería.
          </p>
        </div>

        {/* Bottom sheet */}
        <div className="bg-white rounded-t-[28px] px-6 pt-4 pb-10 shadow-2xl">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-[15px] rounded-2xl bg-[#0EA5E9] text-white font-semibold text-base mb-3 active:opacity-90 transition-opacity"
          >
            Subir desde galería
          </button>
          <button
            onClick={handleClose}
            className="w-full py-[15px] rounded-2xl border border-gray-200 text-gray-600 font-semibold text-base active:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleGalleryFile(e.target.files?.[0])}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ── Cámara ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden">
      {/* Flash de captura */}
      {flash && (
        <div className="absolute inset-0 bg-white z-20 pointer-events-none" />
      )}

      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center px-5 pt-12 pb-2">
        <button
          onClick={handleClose}
          aria-label="Cerrar cámara"
          className="w-11 h-11 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <IconClose />
        </button>
        <div className="flex-1 text-center">
          <span className="text-white text-sm font-semibold tracking-widest uppercase opacity-90">
            {photoLabel}
          </span>
        </div>
        <div className="w-11" />
      </div>

      {/* ── Pill superior ── */}
      <div className="relative z-10 flex justify-center py-2">
        <div className="flex items-center gap-2 bg-black/55 border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
          <IconInfo />
          <span className="text-white text-xs font-medium">
            {guideText}
          </span>
        </div>
      </div>

      {/* ── Zona de captura (spotlight) ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-[6%]">
        {/*
          box-shadow con spread enorme crea el efecto de "spotlight":
          todo oscuro fuera del rectángulo, transparente adentro.
          overflow-hidden del padre lo recorta al viewport.
        */}
        <div
          className="relative w-full"
          style={{
            aspectRatio: "4 / 3",
            borderRadius: "20px",
            boxShadow: "0 0 0 100vmax rgba(0, 0, 0, 0.60)",
          }}
        >
          {/* Corners blancos */}
          <div className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-white rounded-tl-[20px]" />
          <div className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-white rounded-tr-[20px]" />
          <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-white rounded-bl-[20px]" />
          <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-white rounded-br-[20px]" />

          {/* Silueta dental SVG */}
          {cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {photoType === "frontal" ? <FrontalGuide /> : <OpenMouthGuide />}
            </div>
          )}
        </div>

        {/* Texto microcopy bajo la zona */}
        {cameraReady && (
          <p className="mt-4 text-white/60 text-xs font-medium text-center tracking-wide px-4">
            {microCopy}
          </p>
        )}
      </div>

      {/* ── Controles ── */}
      <div className="relative z-10 flex items-center justify-center gap-10 py-5">
        {/* Galería */}
        <button
          onClick={() => galleryInputRef.current?.click()}
          aria-label="Subir desde galería"
          className="w-11 h-11 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <IconGallery />
        </button>

        {/* Captura */}
        <button
          onClick={handleCapture}
          disabled={!cameraReady}
          aria-label="Tomar foto"
          className="w-[72px] h-[72px] rounded-full bg-white disabled:opacity-25 active:scale-90 transition-transform shadow-2xl ring-4 ring-white/25"
        />

        {/* Cambiar cámara */}
        <button
          onClick={handleFlipCamera}
          aria-label="Cambiar cámara"
          className="w-11 h-11 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <IconFlip />
        </button>
      </div>

      {/* ── Bottom sheet de ayuda ── */}
      <div className="relative z-10 bg-white rounded-t-[28px] px-6 pt-3 pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-900 text-center mb-0.5">
          Usa la cámara principal para obtener mejores resultados
        </p>
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          {microCopy}
        </p>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleGalleryFile(e.target.files?.[0])}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ── SVG: Foto Frontal — sonrisa natural, 6 dientes, curvas de labios ──────────

function FrontalGuide() {
  return (
    <svg viewBox="0 0 300 160" className="w-[80%] max-w-[300px]" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Labio superior */}
      <path d="M 68 66 C 115 42 185 42 232 66" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.40" />

      {/* 6 dientes superiores — incisivos centrales, laterales, caninos */}
      {/* Canino L */}
      <rect x="80"  y="66" width="16" height="34" rx="4" stroke="white" strokeWidth="1.6" opacity="0.82" />
      {/* Lateral L */}
      <rect x="98"  y="62" width="21" height="38" rx="4" stroke="white" strokeWidth="1.6" opacity="0.88" />
      {/* Central L */}
      <rect x="121" y="58" width="27" height="44" rx="4" stroke="white" strokeWidth="1.8" opacity="0.95" />
      {/* Central R */}
      <rect x="152" y="58" width="27" height="44" rx="4" stroke="white" strokeWidth="1.8" opacity="0.95" />
      {/* Lateral R */}
      <rect x="181" y="62" width="21" height="38" rx="4" stroke="white" strokeWidth="1.6" opacity="0.88" />
      {/* Canino R */}
      <rect x="204" y="66" width="16" height="34" rx="4" stroke="white" strokeWidth="1.6" opacity="0.82" />

      {/* Línea de contacto — labios cerrados ligeramente */}
      <line x1="74" y1="104" x2="226" y2="104" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.28" />

      {/* 6 dientes inferiores */}
      {/* Canino L */}
      <rect x="82"  y="107" width="16" height="28" rx="4" stroke="white" strokeWidth="1.6" opacity="0.65" />
      {/* Lateral L */}
      <rect x="100" y="107" width="21" height="31" rx="4" stroke="white" strokeWidth="1.6" opacity="0.72" />
      {/* Central L */}
      <rect x="123" y="107" width="25" height="34" rx="4" stroke="white" strokeWidth="1.6" opacity="0.78" />
      {/* Central R */}
      <rect x="152" y="107" width="25" height="34" rx="4" stroke="white" strokeWidth="1.6" opacity="0.78" />
      {/* Lateral R */}
      <rect x="179" y="107" width="21" height="31" rx="4" stroke="white" strokeWidth="1.6" opacity="0.72" />
      {/* Canino R */}
      <rect x="202" y="107" width="16" height="28" rx="4" stroke="white" strokeWidth="1.6" opacity="0.65" />

      {/* Labio inferior */}
      <path d="M 68 140 C 115 160 185 160 232 140" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.40" />
    </svg>
  );
}

// ── SVG: Boca Abierta — oval, 8 dientes, arcos de encías, apertura amplia ─────

function OpenMouthGuide() {
  return (
    <svg viewBox="0 0 280 240" className="w-[68%] max-w-[260px]" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Óvalo exterior — apertura bucal */}
      <ellipse cx="140" cy="120" rx="118" ry="106" stroke="white" strokeWidth="1.8" strokeDasharray="6 4" opacity="0.28" />

      {/* Arco encía superior */}
      <path d="M 30 102 Q 140 50 250 102" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.42" />

      {/* 8 dientes superiores — arcada superior completa */}
      {/* Molar/premolar L */}
      <rect x="32"  y="102" width="14" height="24" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.72" />
      {/* Premolar L */}
      <rect x="48"  y="94"  width="17" height="29" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.78" />
      {/* Canino L */}
      <rect x="67"  y="87"  width="19" height="34" rx="3.5" stroke="white" strokeWidth="1.6" opacity="0.85" />
      {/* Lateral L */}
      <rect x="88"  y="82"  width="22" height="39" rx="4"   stroke="white" strokeWidth="1.6" opacity="0.90" />
      {/* Central L */}
      <rect x="112" y="78"  width="24" height="43" rx="4"   stroke="white" strokeWidth="1.8" opacity="0.96" />
      {/* Central R */}
      <rect x="144" y="78"  width="24" height="43" rx="4"   stroke="white" strokeWidth="1.8" opacity="0.96" />
      {/* Lateral R */}
      <rect x="170" y="82"  width="22" height="39" rx="4"   stroke="white" strokeWidth="1.6" opacity="0.90" />
      {/* Canino R */}
      <rect x="194" y="87"  width="19" height="34" rx="3.5" stroke="white" strokeWidth="1.6" opacity="0.85" />
      {/* Premolar R */}
      <rect x="215" y="94"  width="17" height="29" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.78" />
      {/* Molar/premolar R */}
      <rect x="234" y="102" width="14" height="24" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.72" />

      {/* Espacio de apertura — boca abierta */}
      <line x1="24" y1="148" x2="256" y2="148" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.30" />

      {/* 8 dientes inferiores */}
      {/* Molar/premolar L */}
      <rect x="32"  y="152" width="14" height="22" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.72" />
      {/* Premolar L */}
      <rect x="48"  y="152" width="17" height="26" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.78" />
      {/* Canino L */}
      <rect x="67"  y="152" width="19" height="30" rx="3.5" stroke="white" strokeWidth="1.6" opacity="0.85" />
      {/* Lateral L */}
      <rect x="88"  y="152" width="22" height="34" rx="4"   stroke="white" strokeWidth="1.6" opacity="0.90" />
      {/* Central L */}
      <rect x="112" y="152" width="24" height="37" rx="4"   stroke="white" strokeWidth="1.8" opacity="0.96" />
      {/* Central R */}
      <rect x="144" y="152" width="24" height="37" rx="4"   stroke="white" strokeWidth="1.8" opacity="0.96" />
      {/* Lateral R */}
      <rect x="170" y="152" width="22" height="34" rx="4"   stroke="white" strokeWidth="1.6" opacity="0.90" />
      {/* Canino R */}
      <rect x="194" y="152" width="19" height="30" rx="3.5" stroke="white" strokeWidth="1.6" opacity="0.85" />
      {/* Premolar R */}
      <rect x="215" y="152" width="17" height="26" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.78" />
      {/* Molar/premolar R */}
      <rect x="234" y="152" width="14" height="22" rx="3.5" stroke="white" strokeWidth="1.5" opacity="0.72" />

      {/* Arco encía inferior */}
      <path d="M 30 182 Q 140 228 250 182" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.42" />
    </svg>
  );
}

// ── Iconos inline ─────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function IconRetake() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 .49-5.51" />
    </svg>
  );
}

function IconFlip() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function IconGallery() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconCameraOff() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
