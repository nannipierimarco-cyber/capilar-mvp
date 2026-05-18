"use client";

import { useRef, useState } from "react";
import type { HairMapReport } from "@/lib/types";

// ─── Color helpers ────────────────────────────────────────────────

const GOLD = "#c9a84c";
const CREAM = "#fafaf8";
const BORDER = "#e6d9bc";
const DARK = "#1a1a1a";
const MUTED = "#6b7280";
const LIGHT_BG = "#ffffff";

const levelColor: Record<string, string> = {
  alta:     "#4a7c4e",
  media:    "#8B9E77",
  baja:     "#C4A882",
  muy_baja: "#c0392b",
};

const levelLabel: Record<string, string> = {
  alta:     "Alta",
  media:    "Media",
  baja:     "Baja",
  muy_baja: "Muy baja",
};

const stateColor: Record<string, string> = {
  ok:      "#4a7c4e",
  warning: "#c9a84c",
  alert:   "#c0392b",
};

const stateIcon: Record<string, string> = {
  ok:      "check_circle",
  warning: "warning",
  alert:   "error",
};

const dotColor: Record<string, string> = {
  bajo:  "#4a7c4e",
  medio: "#c9a84c",
  alto:  "#c0392b",
};

// ─── Sub-components ───────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: GOLD }}>
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ backgroundColor: LIGHT_BG, borderColor: BORDER }}
    >
      {children}
    </div>
  );
}

function StateIcon({ state }: { state: string }) {
  const color = stateColor[state] ?? MUTED;
  if (state === "ok") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
        <path d="M7 12l3 3 7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "warning") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L2 21h20L12 3z" fill={color} opacity="0.15" />
        <path d="M12 9v5M12 17h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
      <path d="M12 8v5M12 16h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function NorwoodBar({ stage }: { stage: number }) {
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div
            key={n}
            className="flex-1 h-2 rounded-sm"
            style={{
              backgroundColor: n <= stage ? GOLD : "#ede8df",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px]" style={{ color: MUTED }}>I</span>
        <span className="text-[8px]" style={{ color: MUTED }}>VII</span>
      </div>
    </div>
  );
}

function DensityOval({ report }: { report: HairMapReport }) {
  const z = report.density_map.zones;
  const zones = [
    { id: "frontal",     label: "Frontal",    cx: 160, cy: 80,  rx: 55, ry: 28, data: z.frontal },
    { id: "entrada_izq", label: "Ent. Izq",   cx: 68,  cy: 110, rx: 38, ry: 22, data: z.entrada_izq },
    { id: "entrada_der", label: "Ent. Der",   cx: 252, cy: 110, rx: 38, ry: 22, data: z.entrada_der },
    { id: "vertex",      label: "Vértex",     cx: 160, cy: 148, rx: 50, ry: 30, data: z.vertex },
    { id: "coronilla",   label: "Coronilla",  cx: 160, cy: 210, rx: 55, ry: 32, data: z.coronilla },
    { id: "occipital",   label: "Occipital",  cx: 160, cy: 270, rx: 60, ry: 28, data: z.occipital },
  ];

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[260px] mx-auto">
      <ellipse cx="160" cy="175" rx="130" ry="155" fill="#ede8df" stroke={BORDER} strokeWidth="1.5" />
      {zones.map((z) => (
        <g key={z.id}>
          <ellipse
            cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
            fill={levelColor[z.data.level]}
            fillOpacity="0.75"
            stroke="white"
            strokeWidth="1"
          />
          <text x={z.cx} y={z.cy + 1} textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fontWeight="600" fill="white">
            {z.label}
          </text>
          <text x={z.cx} y={z.cy + 10} textAnchor="middle" dominantBaseline="middle"
            fontSize="6.5" fill="white" opacity="0.9">
            {levelLabel[z.data.level]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PhotoWithAnnotations({
  label,
  imageUrl,
  annotations,
}: {
  label: string;
  imageUrl: string | null;
  annotations: Array<{ label: string; position: string }>;
}) {
  const positions: Record<string, { x: string; y: string }> = {
    linea_frontal:    { x: "50%", y: "12%" },
    sien_izquierda:   { x: "15%", y: "28%" },
    sien_derecha:     { x: "85%", y: "28%" },
    densidad_frontal: { x: "75%", y: "45%" },
    vertex:           { x: "50%", y: "35%" },
    coronilla:        { x: "50%", y: "55%" },
    occipital:        { x: "50%", y: "78%" },
  };

  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: GOLD }}>
        {label}
      </p>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ backgroundColor: "#ede8df", aspectRatio: "3/4" }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs" style={{ color: MUTED }}>Foto no disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

interface HairReportNewProps {
  report: HairMapReport;
  frontalImageUrl: string | null;
  coronillaImageUrl: string | null;
  patientName?: string;
}

export default function HairReportNew({
  report: r,
  frontalImageUrl,
  coronillaImageUrl,
  patientName,
}: HairReportNewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, backgroundColor: CREAM });
      const a = document.createElement("a");
      a.download = `mapa-capilar-${r.patient.report_id}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("[HairReportNew] download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  const evalKeys = [
    { key: "hair_type",        label: "Tipo de pelo",       symbol: "≋" },
    { key: "density",          label: "Densidad",           symbol: "◈" },
    { key: "hairline",         label: "Línea capilar",      symbol: "—" },
    { key: "scalp_condition",  label: "Cuero cabelludo",    symbol: "◇" },
    { key: "texture",          label: "Textura",            symbol: "≈" },
    { key: "crown_coverage",   label: "Cobertura coronilla",symbol: "◎" },
    { key: "scalp_visibility", label: "Vis. cuero cab.",    symbol: "○" },
    { key: "overall_health",   label: "Estado general",     symbol: "✦" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Download button — outside capture */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: DARK }}>Tu Mapa Capilar</h2>
          <p className="text-sm" style={{ color: MUTED }}>Análisis tricológico personalizado</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: GOLD }}
        >
          {downloading ? "Generando…" : "Descargar"}
        </button>
      </div>

      {/* ═══ REPORT — captured for download ═══ */}
      <div
        ref={reportRef}
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: CREAM, borderColor: BORDER, fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* ── HEADER ── */}
        <div className="px-5 py-4 border-b flex items-start justify-between" style={{ backgroundColor: LIGHT_BG, borderColor: BORDER }}>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
              Perfecto Labs · Advanced Hair & Scalp Science
            </p>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: DARK }}>
              {patientName ?? "Trichology Diagnostic Report"}
            </h1>
            <div className="flex gap-3 mt-1">
              <span className="text-[10px]" style={{ color: MUTED }}>
                Tipo: <strong style={{ color: DARK }}>{r.patient.hair_type}</strong>
              </span>
              <span className="text-[10px]" style={{ color: MUTED }}>
                Etapa: <strong style={{ color: DARK }}>{r.patient.norwood_label}</strong>
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[8px]" style={{ color: MUTED }}>{r.patient.report_id}</p>
            <p className="text-[8px] mt-0.5" style={{ color: MUTED }}>
              {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* ── FOTOS + MAPA DENSIDAD ── */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <PhotoWithAnnotations
              label="Vista Frontal"
              imageUrl={frontalImageUrl}
              annotations={r.photo_annotations.frontal}
            />
            <PhotoWithAnnotations
              label="Vista Coronilla"
              imageUrl={coronillaImageUrl}
              annotations={r.photo_annotations.coronilla}
            />
            <div>
              <SectionTitle>Mapa de Densidad</SectionTitle>
              <DensityOval report={r} />
              <div className="mt-2 space-y-1">
                {Object.entries(levelColor).map(([k, c]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c }} />
                    <span className="text-[8px]" style={{ color: MUTED }}>{levelLabel[k]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── NORWOOD SCALE ── */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SectionTitle>Escala Norwood</SectionTitle>
                <p className="text-sm font-bold" style={{ color: DARK }}>{r.patient.norwood_label}</p>
                <NorwoodBar stage={r.patient.norwood_stage} />
              </div>
              <div className="flex-1">
                <SectionTitle>Comparación de Densidad</SectionTitle>
                <p className="text-[10px]" style={{ color: DARK }}>
                  <strong>{r.density_map.density_comparison.zone_a_label}</strong>
                </p>
                <p className="text-[10px] mt-1" style={{ color: DARK }}>
                  <strong>{r.density_map.density_comparison.zone_b_label}</strong>
                </p>
                <p className="text-[9px] mt-1.5" style={{ color: MUTED }}>
                  {r.density_map.density_comparison.summary}
                </p>
              </div>
            </div>
          </Card>

          {/* ── RESUMEN DE EVALUACIÓN ── */}
          <div>
            <SectionTitle>Resumen de Evaluación</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {evalKeys.map(({ key, label, symbol }) => {
                const item = r.evaluation_summary[key];
                return (
                  <Card key={key} className="!p-3">
                    <div className="text-base mb-1">{symbol}</div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
                    <p className="text-[10px] font-bold mt-0.5 leading-snug" style={{ color: DARK }}>{item.value}</p>
                    {item.detail && (
                      <p className="text-[8px] mt-0.5" style={{ color: MUTED }}>{item.detail}</p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ── SELECTORES ── */}
          <div>
            <SectionTitle>Clasificadores Visuales</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "1. Tipo de pelo",    opts: r.selectors.hair_type.options,        sel: r.selectors.hair_type.selected,        note: "" },
                { label: "2. Densidad",         opts: r.selectors.density.options,           sel: r.selectors.density.selected,           note: r.selectors.density.note },
                { label: "3. Línea capilar",    opts: r.selectors.hairline.options,          sel: r.selectors.hairline.selected,          note: "" },
                { label: "4. Cuero cabelludo",  opts: r.selectors.scalp_condition.options,   sel: r.selectors.scalp_condition.selected,   note: r.selectors.scalp_condition.note },
              ].map(({ label, opts, sel, note }) => (
                <Card key={label} className="!p-3">
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>{label}</p>
                  <div className="flex flex-wrap gap-1">
                    {opts.map((opt) => (
                      <span
                        key={opt}
                        className="text-[8px] font-semibold px-2 py-0.5 rounded-full border"
                        style={
                          opt === sel
                            ? { backgroundColor: GOLD, color: "white", borderColor: GOLD }
                            : { backgroundColor: CREAM, color: "#9ca3af", borderColor: BORDER }
                        }
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                  {note && <p className="text-[8px] mt-1.5" style={{ color: MUTED }}>• {note}</p>}
                </Card>
              ))}
            </div>

            {/* Risk areas */}
            <div className="mt-2">
              <Card className="!p-3">
                <p className="text-[8px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>5. Áreas de Riesgo</p>
                <div className="space-y-1.5">
                  {r.selectors.risk_areas.map((area) => (
                    <div key={area.zone} className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: DARK }}>{area.zone}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((d) => (
                          <div
                            key={d}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: d <= area.dots ? dotColor[area.level] : "#ede8df" }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* ── ANOTACIÓN POR ZONAS ── */}
          <div>
            <SectionTitle>Anotación por Zonas del Cuero Cabelludo</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {r.zone_annotations.map((z) => (
                <Card key={z.zone} className="!p-3">
                  <div className="flex items-start gap-2">
                    <StateIcon state={z.state} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold leading-tight" style={{ color: DARK }}>{z.label}</p>
                      <p className="text-[8px] mt-0.5 leading-snug" style={{ color: MUTED }}>{z.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── SALUD FOLICULAR ── */}
          <Card>
            <SectionTitle>Salud Folicular</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Calibre del tallo",   value: r.follicular_health.shaft_caliber },
                { label: "Nivel de sebo",        value: r.follicular_health.sebum_level },
                { label: "Inflamación",          value: r.follicular_health.scalp_inflammation },
                { label: "Miniaturización",      value: r.follicular_health.visible_miniaturization ? "Visible" : "No visible" },
                { label: "Densidad estimada",    value: `${r.follicular_health.estimated_density_hairs_per_cm2} c/cm²` },
                { label: "Observación",          value: r.follicular_health.notes },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: DARK }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── CLINICAL NEXT STEPS ── */}
          <Card className="!p-4">
            <p className="text-[8px] font-bold uppercase tracking-wider mb-2" style={{ color: "#c0392b" }}>
              Recomendación Clínica
            </p>
            <p className="text-[11px] font-bold leading-snug" style={{ color: DARK }}>
              Consulta con Dermatólogo Capilar
            </p>
            <p className="text-[9px] mt-1.5 leading-relaxed" style={{ color: MUTED }}>
              Para un diagnóstico preciso y un plan de tratamiento personalizado,
              te recomendamos agendar una consulta con un dermatólogo especializado
              en salud capilar.
            </p>
          </Card>

          {/* ── DISCLAIMER ── */}
          <div className="rounded-xl border px-4 py-3" style={{ backgroundColor: LIGHT_BG, borderColor: BORDER }}>
            <p className="text-[9px] leading-relaxed" style={{ color: MUTED }}>
              <strong style={{ color: "#8a6c2c" }}>Aviso: </strong>
              {r.disclaimer}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
