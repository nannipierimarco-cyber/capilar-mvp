export const DENTAL_INFOGRAPHIC_PROMPT_VERSION = "dental_infographic_v1_2026_05_27";

// Text prompt for future DALL-E / gpt-image-1 integration.
// Currently the infographic is rendered via next/og (ImageResponse) using this spec.
export function buildDentalInfographicPrompt(): string {
  return `Create a premium dental visual analysis infographic for Perfecto Labs.

Visual style:
- Vertical A4 format (794x1200px)
- Cream/off-white background (#F5F0E8)
- Gold accent lines (#C4A55A)
- Elegant dark typography (#1E180A)
- Soft rounded cards
- Perfecto Labs branding

Sections to include:
- Header: "PERFECTO" logo + "DENTAL VISUAL REPORT" subtitle
- Visual score gauge (circular, 0-100) with risk level badge
- Summary headline and subheadline
- Visual findings list: labeled observations with color-coded levels (favorable / mild_attention / moderate_attention / review_suggested)
- Zone analysis: horizontal bars per dental zone (front_smile, front_bite, upper_arch, lower_arch, etc.)
- Visual dashboard: 7 metrics grid (alignment, smileAesthetics, symmetry, apparentColor, visibleBite, gums, generalVisualState) each shown as low/medium/high
- Next step CTA box with gradient background
- Disclaimer footer

Restrictions (must NOT include):
- No diagnosis
- No treatment plan
- No recommended treatments (no whitening, orthodontics, veneers, implants, surgery)
- No budget or pricing
- No before/after claims
- No medical urgency statements
- Language must be visual and preliminary only`;
}
