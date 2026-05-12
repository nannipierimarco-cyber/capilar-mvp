"use client";

import { HR } from "./tokens";

type IconProps = { className?: string; stroke?: string };

const base = (p: IconProps) => ({
  stroke: p.stroke ?? HR.lineHair,
  strokeWidth: 1.15,
  fill: "none" as const,
  vectorEffect: "non-scaling-stroke" as const,
});

export function IconHairTypeStrands({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path {...base({ stroke })} d="M10 26c2-8 1-14 0-18M14 28c3-10 2-16 1-20M18 26c2-7 2-13 1-17" />
    </svg>
  );
}

export function IconDensityBundle({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path
        {...base({ stroke })}
        d="M8 24c1-6 2-10 4-12M12 26c1-5 3-9 5-11M16 24c0-4 2-8 4-10M20 26c-1-5 0-9 2-11M24 24c-2-4-1-8 1-10"
      />
    </svg>
  );
}

export function IconHairlineHead({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path {...base({ stroke })} d="M8 22c0-8 4-14 8-14s8 6 8 14M10 18c2-4 5-6 6-6s4 2 6 6" />
    </svg>
  );
}

export function IconScalpSurface({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <ellipse {...base({ stroke })} cx="16" cy="14" rx="10" ry="6" />
      <path {...base({ stroke })} d="M10 20c2 2 4 3 6 3s4-1 6-3M12 12l1 1M16 10l1 1M20 12l-1 1" />
    </svg>
  );
}

export function IconTextureSingle({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path {...base({ stroke })} d="M16 6c-2 6-3 12-2 18c0 3 1 5 2 6" />
    </svg>
  );
}

export function IconCrownRing({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <circle {...base({ stroke })} cx="16" cy="16" r="9" />
      <circle {...base({ stroke })} cx="16" cy="16" r="4" />
    </svg>
  );
}

export function IconVisibilityDots({ className, stroke }: IconProps) {
  const c = stroke ?? HR.lineHair;
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <circle cx="10" cy="14" r="1.5" fill={c} stroke="none" />
      <circle cx="16" cy="12" r="1.5" fill={c} stroke="none" />
      <circle cx="22" cy="14" r="1.5" fill={c} stroke="none" />
      <circle cx="14" cy="20" r="1.5" fill={c} stroke="none" />
      <circle cx="20" cy="20" r="1.5" fill={c} stroke="none" />
    </svg>
  );
}

export function IconShieldCheck({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path {...base({ stroke })} d="M16 4l10 4v8c0 6-4 11-10 14-6-3-10-8-10-14V8l10-4z" />
      <path
        {...base({ stroke })}
        d="M12 16l3 3 6-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFooterCamera({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect {...base({ stroke })} x="3" y="7" width="18" height="12" rx="2" />
      <path {...base({ stroke })} d="M8 7V5h8v2M12 12h.01" strokeLinecap="round" />
    </svg>
  );
}

export function IconFooterCalendar({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect {...base({ stroke })} x="4" y="5" width="16" height="15" rx="2" />
      <path {...base({ stroke })} d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

export function IconFooterPerson({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle {...base({ stroke })} cx="12" cy="8" r="3" />
      <path {...base({ stroke })} d="M6 20c0-4 3-6 6-6s6 2 6 6" />
    </svg>
  );
}

export function IconZoneHairline({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path {...base({ stroke })} d="M6 18c2-6 6-10 8-10s6 4 8 10" />
      <path {...base({ stroke })} d="M10 16c1-2 3-3 4-3s3 1 4 3" />
    </svg>
  );
}

export function IconZoneTemples({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path {...base({ stroke })} d="M8 20c0-8 3-12 6-12s6 4 6 12M10 14c2-2 4-3 4-3" />
    </svg>
  );
}

export function IconZoneFrontalFollicles({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path {...base({ stroke })} d="M10 6v14M14 8v12M18 6v14" />
      <path {...base({ stroke })} d="M8 22h12" />
    </svg>
  );
}

export function IconZoneMidScalp({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <circle {...base({ stroke })} cx="14" cy="14" r="8" strokeDasharray="2 3" />
      <circle {...base({ stroke })} cx="14" cy="14" r="3" />
    </svg>
  );
}

export function IconZoneCrownSwirl({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path
        {...base({ stroke })}
        d="M14 6c4 0 8 3 8 7a6 6 0 01-12 4 5 5 0 008-3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconZoneScalpSparkles({ className, stroke }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden>
      <path
        {...base({ stroke })}
        d="M14 4v4M14 20v4M6 14h4M18 14h4M8 8l2.5 2.5M17.5 17.5L20 20M20 8l-2.5 2.5M8.5 17.5L6 20"
      />
    </svg>
  );
}

export function IconFollicleDiscDense({ className, stroke }: IconProps) {
  const st = stroke ?? HR.lineHair;
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <circle {...base({ stroke: st })} cx="24" cy="24" r="20" fill="#F5F0E8" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = 6 + (i % 4) * 3.2;
        const x = 24 + Math.cos(a) * r;
        const y = 24 + Math.sin(a) * r;
        return (
          <line key={i} x1={x} y1={y - 4} x2={x} y2={y + 4} stroke={st} strokeWidth={1.8} />
        );
      })}
    </svg>
  );
}

export function IconFollicleDiscSparse({ className, stroke }: IconProps) {
  const st = stroke ?? HR.lineHair;
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <circle {...base({ stroke: st })} cx="24" cy="24" r="20" fill="#F5F0E8" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 8 + (i % 3) * 4;
        const x = 24 + Math.cos(a) * r;
        const y = 24 + Math.sin(a) * r;
        return (
          <line
            key={i}
            x1={x}
            y1={y - 3}
            x2={x}
            y2={y + 3}
            stroke={st}
            strokeWidth={1}
            opacity={0.45}
          />
        );
      })}
    </svg>
  );
}

export function DiamondOrnament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" aria-hidden>
      <path d="M6 1l2 4 4 1-4 1-2 4-2-4-4-1 4-1z" fill={HR.gold} opacity={0.85} />
    </svg>
  );
}
