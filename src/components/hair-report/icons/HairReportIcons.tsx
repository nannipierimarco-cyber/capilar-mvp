"use client";

type P = { className?: string; stroke?: string };

const STD = (stroke?: string) => ({
  stroke: stroke ?? "#3D3835",
  strokeWidth: 1.3,
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
});

// ── Assessment Summary ────────────────────────────────────────────────────────

/** 3 sinusoidal hair strands — hair type */
export function HairTypeIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path {...STD(stroke)} d="M3.5 8 C6 5.5 9.5 5.5 12 8 C14.5 10.5 18 10.5 20.5 8 C22 6.5 23.5 6.5 24.5 7.5" />
      <path {...STD(stroke)} d="M3.5 14 C6 11.5 9.5 11.5 12 14 C14.5 16.5 18 16.5 20.5 14 C22 12.5 23.5 12.5 24.5 13.5" />
      <path {...STD(stroke)} d="M3.5 20 C6 17.5 9.5 17.5 12 20 C14.5 22.5 18 22.5 20.5 20 C22 18.5 23.5 18.5 24.5 19.5" />
    </svg>
  );
}

/** Dome-fan of 9 strands on arc base — density */
export function DensityIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      {/* Scalp arc base */}
      <path d="M5 24.5 Q14 22 23 24.5" fill="none" stroke={s} strokeWidth={1.3}
        strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {/* 9 strands — tallest in center, tapering to sides */}
      <line x1="6"   y1="24.5" x2="5.5"  y2="15"   stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="8"   y1="24.5" x2="7.5"  y2="10.5" stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="10"  y1="24.5" x2="10"   y2="8"    stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="12"  y1="24.5" x2="12"   y2="6.5"  stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="14"  y1="24.5" x2="14"   y2="6"    stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="16"  y1="24.5" x2="16"   y2="6.5"  stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="18"  y1="24.5" x2="18"   y2="8"    stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="20"  y1="24.5" x2="20.5" y2="10.5" stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="22"  y1="24.5" x2="22.5" y2="15"   stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Closed oval head shape + inner hairline arc — hairline */
export function HairlineIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      {/* Closed oval representing the head from front view */}
      <ellipse {...STD(stroke)} cx="14" cy="16.5" rx="7" ry="8.5" />
      {/* Inner hairline recession arc */}
      <path {...STD(stroke)} d="M9.5 12.5 C10.5 9.5 12.5 8.5 14 8.5 C15.5 8.5 17.5 9.5 18.5 12.5" />
    </svg>
  );
}

/** Scalp oval from above + 3 follicle pore dots */
export function ScalpIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <ellipse {...STD(stroke)} cx="14" cy="12.5" rx="8.5" ry="5.5" />
      <path {...STD(stroke)} d="M8.5 18 C10 21.5 12 22.5 14 22.5 C16 22.5 18 21.5 19.5 18" />
      <circle cx="10.5" cy="11" r="1.1" fill={s} stroke="none" />
      <circle cx="14"   cy="9.5" r="1.1" fill={s} stroke="none" />
      <circle cx="17.5" cy="11" r="1.1" fill={s} stroke="none" />
    </svg>
  );
}

/** Single flowing S-curve hair fiber — texture */
export function TextureIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path {...STD(stroke)} d="M13.5 5 C17.5 8.5 9.5 12.5 14 16.5 C17.5 19.5 13 23 13.5 24" />
    </svg>
  );
}

/** Dashed concentric rings — crown coverage (matches reference dashed style) */
export function CrownCoverageIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <circle cx="14" cy="14" r="9.5" fill="none" stroke={s} strokeWidth={1.3}
        strokeDasharray="2.5 1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx="14" cy="14" r="5.5" fill="none" stroke={s} strokeWidth={1.3}
        strokeDasharray="2 1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx="14" cy="14" r="1.8" fill={s} stroke="none" />
    </svg>
  );
}

/** Dot matrix pattern — scalp visibility */
export function ScalpVisibilityIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <circle cx="8.5"  cy="12"  r="1.7" fill={s} stroke="none" />
      <circle cx="14"   cy="10"  r="1.7" fill={s} stroke="none" />
      <circle cx="19.5" cy="12"  r="1.7" fill={s} stroke="none" />
      <circle cx="11.5" cy="18"  r="1.7" fill={s} stroke="none" />
      <circle cx="16.5" cy="18"  r="1.7" fill={s} stroke="none" />
    </svg>
  );
}

/** Circle with checkmark — overall condition (matches reference circle style, not shield) */
export function OverallConditionIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <circle {...STD(stroke)} cx="14" cy="14" r="9.5" />
      <path {...STD(stroke)} d="M9 14.5 L12.5 18 L19 10.5" />
    </svg>
  );
}

// ── Scalp-zone annotation ─────────────────────────────────────────────────────

/** Head arch + hairline arc + short hair strokes at crown */
export function HairlineZoneIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      {/* Head outline */}
      <path {...STD(stroke)} d="M5 22 C5 14 9 7 14 7 C19 7 23 14 23 22" />
      {/* Hairline arc */}
      <path {...STD(stroke)} d="M8.5 17.5 C9.5 13.5 11.5 11.5 14 11.5 C16.5 11.5 18.5 13.5 19.5 17.5" />
      {/* Short hair strokes at crown */}
      <line x1="11"  y1="8.5"  x2="10.5" y2="11.5" stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="14"  y1="7.5"  x2="14"   y2="11.5" stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="17"  y1="8.5"  x2="17.5" y2="11.5" stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Bilateral temple recession curves */
export function TemplesIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path {...STD(stroke)} d="M4.5 21 C4.5 14.5 6.5 10 10 10 C11.5 10 12.5 11 13 13.5" />
      <path {...STD(stroke)} d="M23.5 21 C23.5 14.5 21.5 10 18 10 C16.5 10 15.5 11 15 13.5" />
      <path {...STD(stroke)} d="M13 13.5 Q14 15.5 15 13.5" />
    </svg>
  );
}

/** 5-strand fan with base — frontal density */
export function FrontalDensityIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path d="M6 23.5 L22 23.5" fill="none" stroke={s} strokeWidth={1.3}
        strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="8"  y1="23.5" x2="7"   y2="14"   stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="11" y1="23.5" x2="10"  y2="9"    stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="14" y1="23.5" x2="14"  y2="7"    stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="17" y1="23.5" x2="18"  y2="9"    stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1="20" y1="23.5" x2="21"  y2="14"   stroke={s} strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Dashed outer orbit + solid inner circle — mid-scalp zone */
export function MidScalpIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <circle
        cx="14" cy="14" r="9"
        fill="none"
        stroke={stroke ?? "#3D3835"}
        strokeWidth={1.3}
        strokeDasharray="2.5 2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle {...STD(stroke)} cx="14" cy="14" r="3.5" />
    </svg>
  );
}

/** Expanding whorl spiral — crown zone */
export function CrownIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path
        {...STD(stroke)}
        d="M14 14
           C15 13 16.5 13 17 14.5
           C17.5 16 16.5 18 14.5 18.5
           C12 19 9.5 17.5 9 15
           C8.5 12 10 9.5 12.5 8.5
           C15.5 7.5 19 8.5 21 11
           C23 13.5 22.5 18 20 20.5"
      />
    </svg>
  );
}

/** Radial sunburst + center circle — scalp health */
export function ScalpHealthIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <circle {...STD(stroke)} cx="14" cy="14" r="4" />
      <path {...STD(stroke)} d="M14 5.5 L14 8 M14 20 L14 22.5 M5.5 14 L8 14 M20 14 L22.5 14" />
      <path {...STD(stroke)} d="M8.1 8.1 L9.8 9.8 M18.2 18.2 L19.9 19.9 M19.9 8.1 L18.2 9.8 M9.8 18.2 L8.1 19.9" />
    </svg>
  );
}

// ── Density comparison discs ──────────────────────────────────────────────────

export function FollicleDenseIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="20" fill="#F5F0E8" stroke={s} strokeWidth={1.2} />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = 5 + (i % 4) * 3;
        const x = 24 + Math.cos(a) * r;
        const y = 24 + Math.sin(a) * r;
        return (
          <line
            key={i} x1={x} y1={y - 4.5} x2={x} y2={y + 4.5}
            stroke={s} strokeWidth={2} strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function FollicleSparseIcon({ className, stroke }: P) {
  const s = stroke ?? "#3D3835";
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="20" fill="#F5F0E8" stroke={s} strokeWidth={1.2} />
      {Array.from({ length: 11 }).map((_, i) => {
        const a = (i / 11) * Math.PI * 2;
        const r = 8 + (i % 3) * 4;
        const x = 24 + Math.cos(a) * r;
        const y = 24 + Math.sin(a) * r;
        return (
          <line
            key={i} x1={x} y1={y - 3.5} x2={x} y2={y + 3.5}
            stroke={s} strokeWidth={1.2} strokeLinecap="round" opacity={0.55}
          />
        );
      })}
    </svg>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function CameraIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect {...STD(stroke)} x="2" y="7" width="20" height="13" rx="2" />
      <path {...STD(stroke)} d="M7 7 V5.5 A1.5 1.5 0 0 1 8.5 4 H15.5 A1.5 1.5 0 0 1 17 5.5 V7" />
      <circle {...STD(stroke)} cx="12" cy="13.5" r="3" />
    </svg>
  );
}

export function CalendarIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect {...STD(stroke)} x="3" y="4" width="18" height="17" rx="2" />
      <path {...STD(stroke)} d="M8 2 V6 M16 2 V6 M3 10 H21" />
    </svg>
  );
}

export function UserIcon({ className, stroke }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle {...STD(stroke)} cx="12" cy="8" r="3.5" />
      <path {...STD(stroke)} d="M5 21 C5 17 8.1 14.5 12 14.5 C15.9 14.5 19 17 19 21" />
    </svg>
  );
}

/** Gold diamond ornament */
export function DiamondOrnament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" aria-hidden>
      <path d="M6 1 L8 5 L12 6 L8 7 L6 11 L4 7 L0 6 L4 5 Z" fill="#C5A059" opacity={0.85} />
    </svg>
  );
}

/** Geometric diamond brand mark */
export function BrandDiamond({ className, stroke }: P) {
  const s = stroke ?? "#C5A059";
  return (
    <svg className={className} viewBox="0 0 32 36" aria-hidden fill="none">
      <path stroke={s} strokeWidth={1.4} vectorEffect="non-scaling-stroke"
        d="M16 2 L30 10 L30 26 L16 34 L2 26 L2 10 Z" />
      <path stroke={s} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.6}
        d="M16 8 L24 13 L24 23 L16 28 L8 23 L8 13 Z" />
      <circle cx="16" cy="18" r="1.5" fill={s} opacity={0.8} />
    </svg>
  );
}
