// ─── ReportPDFDocument ────────────────────────────────────────────────────────
// @react-pdf/renderer document. Import ONLY via dynamic import — never at the
// top level in App Router (crashes SSR).
//
// Usage (inside an async click handler):
//   const { pdf } = await import('@react-pdf/renderer')
//   const { ReportPDFDocument } = await import('./ReportPDFDocument')

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { HairMapAnalysisReport } from "@/lib/mapaCapilar";

// ─── Font registration — CDN only, NOT /public/fonts/ ─────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 700,
    },
  ],
});

// ─── Palette ──────────────────────────────────────────────────────────────────
const gold = "#B8956A";
const cream = "#FAF8F5";
const ink = "#1C1917";
const inkMuted = "#57534E";
const green = "#6B9B7A";
const amber = "#C9A227";
const red = "#C45C5C";

function scoreColor(score: number) {
  if (score >= 70) return green;
  if (score >= 45) return amber;
  return red;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    backgroundColor: cream,
    paddingHorizontal: 32,
    paddingVertical: 36,
    fontSize: 9,
    color: ink,
  },

  // Header
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  brandName: {
    fontSize: 10,
    fontWeight: 700,
    color: gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandSub: {
    fontSize: 7,
    color: inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: ink,
    textAlign: "center",
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 8,
    color: inkMuted,
    textAlign: "center",
  },
  dateText: {
    fontSize: 7,
    color: inkMuted,
    textAlign: "center",
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8DCC8",
    marginVertical: 10,
  },

  // Score hero
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "stretch",
  },
  scoreBox: {
    width: 64,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
  },
  scoreDenom: {
    fontSize: 7,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  scoreInfo: {
    flex: 1,
    justifyContent: "center",
  },
  scorePriority: {
    fontSize: 7,
    color: inkMuted,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  scoreMainFinding: {
    fontSize: 10,
    fontWeight: 700,
    color: ink,
    marginBottom: 4,
  },
  scoreConfidence: {
    fontSize: 8,
    color: inkMuted,
  },

  // Photos
  photosSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: gold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: "center",
  },
  photoRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoCol: {
    flex: 1,
  },
  photoFrame: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
    backgroundColor: "#E8E0D6",
    height: 130,
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  photoLabel: {
    fontSize: 7,
    color: inkMuted,
    textAlign: "center",
  },

  // Zone bars
  zonesSection: {
    marginBottom: 14,
  },
  zoneRow: {
    marginBottom: 5,
  },
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  zoneName: {
    fontSize: 8,
    fontWeight: 700,
    color: ink,
  },
  zoneScore: {
    fontSize: 8,
    color: inkMuted,
  },
  zoneTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E8E0D6",
    overflow: "hidden",
  },
  zoneFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Risk areas
  riskSection: {
    marginBottom: 14,
  },
  riskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 5,
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DCC8",
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 1,
  },
  riskContent: { flex: 1 },
  riskArea: {
    fontSize: 8,
    fontWeight: 700,
    color: ink,
  },
  riskReason: {
    fontSize: 7,
    color: inkMuted,
    marginTop: 1,
  },
  riskBadge: {
    fontSize: 6,
    fontWeight: 700,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Visual analysis pills
  pillsSection: {
    marginBottom: 14,
  },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  pillItem: {
    width: "48%",
    padding: 7,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DCC8",
  },
  pillLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  pillValue: {
    fontSize: 8,
    fontWeight: 700,
    color: ink,
  },

  // Disclaimer — mandatory
  disclaimer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#F5F0E8",
    borderWidth: 1,
    borderColor: "#E8DCC8",
  },
  disclaimerTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7,
    color: inkMuted,
    lineHeight: 1.4,
  },
});

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReportPDFDocumentProps {
  report: HairMapAnalysisReport;
  /** base64 data URL, max 800px — resolve from Supabase before passing */
  frontalBase64?: string;
  /** base64 data URL, max 800px — resolve from Supabase before passing */
  crownBase64?: string;
  generatedAt?: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function ReportPDFDocument({
  report,
  frontalBase64,
  crownBase64,
  generatedAt,
}: ReportPDFDocumentProps) {
  const { summary, visualAnalysis, zones, riskAreas, header, recommendedRoutine, ingredientHints } =
    report;
  const scoreCol = scoreColor(summary.overallScore);
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  return (
    <Document
      title="Mapa Capilar AI — Perfecto"
      author="Perfecto"
      subject="Análisis visual capilar orientativo"
    >
      <Page size="A4" style={s.page}>
        {/* ── 1. Header ── */}
        <View style={s.header}>
          <View style={s.brandRow}>
            <Text style={s.brandName}>Perfecto</Text>
          </View>
          <Text style={s.brandSub}>Mapa Capilar AI</Text>
          <Text style={s.reportTitle}>{header?.title ?? "Análisis visual capilar"}</Text>
          <Text style={s.reportSubtitle}>
            {header?.subtitle ?? "Evaluación orientativa de tricología digital"}
          </Text>
          <Text style={s.dateText}>{dateStr}</Text>
        </View>
        <View style={s.divider} />

        {/* ── 2. Score gauge ── */}
        <View style={s.scoreRow}>
          <View style={[s.scoreBox, { backgroundColor: scoreCol }]}>
            <Text style={s.scoreNumber}>{summary.overallScore}</Text>
            <Text style={s.scoreDenom}>/100</Text>
          </View>
          <View style={s.scoreInfo}>
            <Text style={s.scorePriority}>{summary.priority}</Text>
            <Text style={s.scoreMainFinding}>{summary.mainFinding}</Text>
            <Text style={s.scoreConfidence}>
              Confianza: {summary.confidence}
            </Text>
          </View>
        </View>

        {/* ── 3. Two photos side by side ── */}
        <View style={s.photosSection}>
          <Text style={s.sectionLabel}>Análisis fotográfico</Text>
          <View style={s.photoRow}>
            {/* Frontal / lateral */}
            <View style={s.photoCol}>
              <View style={s.photoFrame}>
                {frontalBase64 ? (
                  <Image src={frontalBase64} style={s.photo} />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 7, color: inkMuted }}>
                      Sin foto frontal
                    </Text>
                  </View>
                )}
              </View>
              <Text style={s.photoLabel}>Vista frontal / lateral</Text>
            </View>

            {/* Crown */}
            <View style={s.photoCol}>
              <View style={s.photoFrame}>
                {crownBase64 ? (
                  <Image src={crownBase64} style={s.photo} />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 7, color: inkMuted }}>
                      Sin foto coronilla
                    </Text>
                  </View>
                )}
              </View>
              <Text style={s.photoLabel}>Coronilla</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Zone score bars (max 4 observations per skill) ── */}
        <View style={s.zonesSection}>
          <Text style={s.sectionLabel}>Indicadores por zona</Text>
          {(
            [
              ["Línea frontal", zones.frontalLine],
              ["Densidad frontal", zones.frontalDensity],
              ["Entradas", zones.temples],
              ["Coronilla", zones.crown],
            ] as const
          ).map(([name, zone]) => (
            <View key={name} style={s.zoneRow}>
              <View style={s.zoneHeader}>
                <Text style={s.zoneName}>{name}</Text>
                <Text style={s.zoneScore}>{zone.score} — {zone.label}</Text>
              </View>
              <View style={s.zoneTrack}>
                <View
                  style={[
                    s.zoneFill,
                    {
                      width: `${zone.score}%`,
                      backgroundColor: scoreColor(zone.score),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── 5. Risk areas (max 3 per skill) ── */}
        {riskAreas.length > 0 && (
          <View style={s.riskSection}>
            <Text style={s.sectionLabel}>Áreas de atención</Text>
            {riskAreas.slice(0, 3).map((risk, i) => {
              const dotColor =
                risk.level === "Alto" ? red : risk.level === "Medio" ? amber : green;
              const badgeStyle =
                risk.level === "Alto"
                  ? { backgroundColor: "#FEF2F2", color: "#B91C1C" }
                  : risk.level === "Medio"
                  ? { backgroundColor: "#FFFBEB", color: "#92400E" }
                  : { backgroundColor: "#F0FDF4", color: "#166534" };
              return (
                <View key={i} style={s.riskItem}>
                  <View style={[s.riskDot, { backgroundColor: dotColor }]} />
                  <View style={s.riskContent}>
                    <Text style={s.riskArea}>{risk.area}</Text>
                    <Text style={s.riskReason}>{risk.reason}</Text>
                  </View>
                  <Text style={[s.riskBadge, badgeStyle]}>{risk.level}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── 6. Visual analysis pills ── */}
        <View style={s.pillsSection}>
          <Text style={s.sectionLabel}>Análisis visual</Text>
          <View style={s.pillsGrid}>
            {[
              { label: "Tipo de pelo", value: visualAnalysis.hairType },
              { label: "Densidad", value: visualAnalysis.density },
              { label: "Línea capilar", value: visualAnalysis.hairline },
              {
                label: "Cuero cabelludo",
                value: [visualAnalysis.scalpState, visualAnalysis.scalpVisibility]
                  .filter(Boolean)
                  .join(" · ") || visualAnalysis.scalpVisibility,
              },
              { label: "Coronilla", value: visualAnalysis.crownCoverage },
              { label: "Textura", value: visualAnalysis.hairTexture },
              { label: "Grosor", value: visualAnalysis.hairThickness },
              { label: "Estado general", value: visualAnalysis.overallCondition },
            ].map(({ label, value }) => (
              <View key={label} style={s.pillItem}>
                <Text style={s.pillLabel}>{label}</Text>
                <Text style={s.pillValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Mandatory medical disclaimer ── */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerTitle}>Aviso importante</Text>
          <Text style={s.disclaimerText}>
            Este análisis es solo con fines informativos y no constituye un diagnóstico médico.
            Para una atención personalizada, consulta a un dermatólogo certificado.
          </Text>
          <Text style={[s.disclaimerText, { marginTop: 3 }]}>
            Este reporte es visual y orientativo. No reemplaza una evaluación médica profesional.
            Los resultados pueden variar según la calidad de las fotografías y las condiciones de
            iluminación.
          </Text>
        </View>
      </Page>

      {(recommendedRoutine || ingredientHints) && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionLabel}>Rutina de apoyo general</Text>
          {recommendedRoutine && (
            <View style={{ marginBottom: 14 }}>
              <View style={s.pillsGrid}>
                {(
                  [
                    ["Limpiar", recommendedRoutine.cleanse],
                    ["Tratar", recommendedRoutine.treat],
                    ["Proteger", recommendedRoutine.protect],
                    ["Peinar", recommendedRoutine.style],
                  ] as const
                ).map(([title, bullets]) => (
                  <View key={title} style={s.pillItem}>
                    <Text style={s.pillLabel}>{title}</Text>
                    <Text style={s.pillValue}>
                      {(bullets.length ? bullets : ["—"]).join(" · ")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {ingredientHints &&
            (ingredientHints.helpful.length > 0 || ingredientHints.avoid.length > 0) && (
              <View>
                <Text style={s.sectionLabel}>Ingredientes (orientación)</Text>
                <View style={s.pillsGrid}>
                  <View style={s.pillItem}>
                    <Text style={s.pillLabel}>Útiles</Text>
                    <Text style={s.pillValue}>
                      {ingredientHints.helpful.length ? ingredientHints.helpful.join(", ") : "—"}
                    </Text>
                  </View>
                  <View style={s.pillItem}>
                    <Text style={s.pillLabel}>Moderar</Text>
                    <Text style={s.pillValue}>
                      {ingredientHints.avoid.length ? ingredientHints.avoid.join(", ") : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>{report.disclaimer}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
