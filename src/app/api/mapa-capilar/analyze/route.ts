import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import {
  generateFallbackAnalysisReport,
  normalizeHairMapReport,
  type HairMapAnalysisReport,
  type MapaCapilarAnswers,
} from "@/lib/mapaCapilar";
import { checkRateLimit } from "@/lib/rateLimit";

function generateAccessToken(id: string): string | null {
  const secret = process.env.ANALYSIS_ACCESS_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(id).digest("hex");
}

const ALLOWED_PHOTO_MIME = /^data:image\/(jpeg|png|webp|gif);base64,/;
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Pass 1: Visual analysis in free prose ─────────────────────────────────────
// GPT-4o analyzes the photos without any JSON schema constraint so it can
// describe exactly what it observes. Schema constraints at this stage
// reduce accuracy because the model prioritises format over content.
const PASS1_SYSTEM = `You are a clinical trichology specialist performing a visual hair and scalp assessment.
Analyze the provided photos with clinical precision.
Describe only what is directly observable in the images — do not invent, assume, or fabricate details.
Use clinical, descriptive language. Note explicitly when something is unclear or not visible in the photos.
This is a visual assessment tool only. Do not provide medical diagnoses or treatment prescriptions.`;

function buildPass1User(answers: Partial<MapaCapilarAnswers>, hasPhotos: boolean): string {
  return `Patient profile:
- Main concern: ${answers.concern ?? "Not specified"}
- Duration of changes: ${answers.duration ?? "Not specified"}
- Previous treatments: ${answers.previousTreatment ?? "Not specified"}
- Family history of hair loss: ${answers.familyHistory ?? "Not specified"}
- Goal: ${answers.goal ?? "Not specified"}

${hasPhotos
    ? `Analyze the attached photos and provide a detailed visual assessment covering:

1. HAIR TYPE & TEXTURE: Describe the curl pattern, thickness, and texture of individual strands.
2. HAIRLINE: Describe the shape and position. Note any recession, irregularities, or temples involvement.
3. OVERALL DENSITY: Describe density uniformly or by zone (frontal, mid-scalp, crown/vertex).
4. CROWN / VERTEX: Describe the coverage, visible scalp, and any thinning pattern observed.
5. SCALP HEALTH: Note visible scalp condition (oiliness, dryness, redness, flaking if visible).
6. ZONE-BY-ZONE NOTES: Briefly characterize each of: hairline, temples, frontal zone, mid-scalp, crown, and overall scalp.
7. KEY CALLOUTS FROM EACH PHOTO: For the frontal photo, list up to 3 specific observations tied to visible areas. Same for the crown photo.
8. RISK ASSESSMENT: Identify which zones appear most affected. Assign a rough level (Low / Medium / High).

Be specific and honest about what you can and cannot see. Uncertainty is preferable to fabrication.`
    : `No photos available. Base the assessment only on the patient profile above. Be conservative and note the absence of visual data.`
  }`;
}

// ── Pass 2: Structure prose into full JSON ────────────────────────────────────
// No photos needed here — we only convert the prose from pass 1.
// This guarantees all fields the infographic needs are populated from
// real observations, not hardcoded defaults.
const PASS2_SYSTEM = `You are a data structuring assistant. Convert a clinical hair analysis narrative into the exact JSON schema provided.
Rules:
- Use ONLY information present in the narrative. Do not add observations that are not there.
- For fields not addressed in the narrative, use "—" or the most appropriate neutral value.
- Routine and ingredient recommendations should be general hair-care guidance (not pharmaceutical prescriptions).
- Return ONLY valid JSON. No text outside the JSON object.`;

function buildPass2User(prose: string, answers: Partial<MapaCapilarAnswers>): string {
  return `Clinical analysis narrative:
"""
${prose}
"""

Patient profile:
- Concern: ${answers.concern ?? "Not specified"}
- Duration: ${answers.duration ?? "Not specified"}
- Previous treatment: ${answers.previousTreatment ?? "Not specified"}
- Family history: ${answers.familyHistory ?? "Not specified"}
- Goal: ${answers.goal ?? "Not specified"}

Convert the narrative into this exact JSON structure. Fill every field from the narrative above:

{
  "summary": {
    "title": "AI Hair & Scalp Analysis",
    "mainFinding": "single concise sentence summarising the main visual finding (max 15 words)",
    "overallScore": <integer 0-100 reflecting overall hair/scalp health>,
    "confidence": "Low|Medium|High",
    "priority": "brief description of the most important action area"
  },
  "userContext": {
    "mainConcern": "${answers.concern ?? "Not specified"}",
    "hairLossDuration": "${answers.duration ?? "Not specified"}",
    "familyHistory": "${answers.familyHistory ?? "Not specified"}",
    "previousTreatments": "${answers.previousTreatment ?? "Not specified"}"
  },
  "visualAnalysis": {
    "hairType": "Straight|Wavy|Curly|Coily",
    "density": "<concise density description, e.g. 'Medium overall'>",
    "hairline": "Stable|Mild recession|Moderate recession|Advanced recession",
    "scalpState": "Healthy|Oily|Dry|Flaky|Sensitive",
    "scalpVisibility": "Low|Moderate|High",
    "crownCoverage": "Good|Reduced|Low",
    "hairTexture": "Fine|Medium thickness|Coarse",
    "overallCondition": "<brief descriptor, max 6 words>"
  },
  "zones": {
    "frontalLine": { "status": "<brief>", "score": <0-100>, "label": "<2-3 words>" },
    "frontalDensity": { "status": "<brief>", "score": <0-100>, "label": "<2-3 words>" },
    "temples": { "status": "<brief>", "score": <0-100>, "label": "<2-3 words>" },
    "crown": { "status": "<brief>", "score": <0-100>, "label": "<2-3 words>" },
    "scalpHealth": { "status": "<brief>", "score": <0-100>, "label": "<2-3 words>" }
  },
  "riskAreas": [
    { "area": "<zone name>", "level": "Low|Medium|High", "reason": "<brief reason from narrative>" }
  ],
  "photoCallouts": {
    "frontPhoto": [
      { "label": "<Zone>\\n<Observation>" },
      { "label": "<Zone>\\n<Observation>" },
      { "label": "<Zone>\\n<Observation>" }
    ],
    "crownPhoto": [
      { "label": "<Zone>\\n<Observation>" },
      { "label": "<Zone>\\n<Observation>" },
      { "label": "<Zone>\\n<Observation>" }
    ]
  },
  "scalpZoneStrip": [
    { "zone": "Hairline",        "icon": "check|warn|neutral", "micro": "<2-5 word status>" },
    { "zone": "Temples",         "icon": "check|warn|neutral", "micro": "<2-5 word status>" },
    { "zone": "Frontal density", "icon": "check|warn|neutral", "micro": "<2-5 word status>" },
    { "zone": "Mid-scalp",       "icon": "check|warn|neutral", "micro": "<2-5 word status>" },
    { "zone": "Crown",           "icon": "check|warn|neutral", "micro": "<2-5 word status>" },
    { "zone": "Scalp health",    "icon": "check|warn|neutral", "micro": "<2-5 word status>" }
  ],
  "densityComparison": {
    "frontal": { "caption": "Frontal Zone\\n<density label>" },
    "crown":   { "caption": "Crown Zone\\n<density label>" }
  },
  "crownDensityMap": {
    "heatmapIntensity": <integer 0-100, higher = more thinning at crown>,
    "legend": "<brief description of crown density, max 6 words>"
  },
  "recommendedRoutine": {
    "cleanse":  ["<product type/approach>", "<product type/approach>"],
    "treat":    ["<ingredient/approach>", "<ingredient/approach>", "<ingredient/approach>"],
    "protect":  ["<habit/approach>", "<habit/approach>"],
    "style":    ["<styling guidance>", "<styling guidance>", "<styling guidance>"]
  },
  "ingredientHints": {
    "helpful": ["<ingredient>", "<ingredient>", "<ingredient>", "<ingredient>", "<ingredient>"],
    "avoid":   ["<ingredient/product type>", "<ingredient/product type>"]
  },
  "brandLine": "PERFECTO",
  "disclaimer": "This is a visual assessment only and does not constitute a medical diagnosis. Consult a licensed dermatologist or trichologist for personalised care."
}`;
}

// ── OpenAI fetch helper ───────────────────────────────────────────────────────
async function callOpenAI(
  messages: Array<{ role: string; content: unknown }>,
  opts: { maxTokens: number; timeoutMs: number; jsonMode?: boolean }
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages,
        max_tokens: opts.maxTokens,
        temperature: 0.15,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[analyze] OpenAI error", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[analyze] OpenAI call", isAbort ? "timed out" : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function uploadPhoto(dataUrl: string, path: string): Promise<string | null> {
  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    const buffer = Buffer.from(base64, "base64");
    const supabase = getAdminClient();
    const { error } = await supabase.storage
      .from("patient-photos")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}

interface RequestBody {
  answers: Partial<MapaCapilarAnswers>;
  photoFrontal?: string;
  photoCrown?: string;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per 10 minutes per IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const { allowed } = checkRateLimit(`analyze:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Intenta nuevamente en unos minutos." },
      { status: 429 }
    );
  }

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { answers, photoFrontal, photoCrown } = body;

  if (photoFrontal && !ALLOWED_PHOTO_MIME.test(photoFrontal)) {
    return NextResponse.json({ error: "Invalid photo format" }, { status: 400 });
  }
  if (photoCrown && !ALLOWED_PHOTO_MIME.test(photoCrown)) {
    return NextResponse.json({ error: "Invalid photo format" }, { status: 400 });
  }

  const hasPhotos = !!(photoFrontal || photoCrown);
  const fallback = generateFallbackAnalysisReport(answers);
  const hasDB = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Create DB record
  let recordId: string | null = null;
  if (hasDB) {
    try {
      const supabase = getAdminClient();
      const { data } = await supabase
        .from("hair_map_analyses")
        .insert({
          concern: answers.concern ?? null,
          duration: answers.duration ?? null,
          previous_treatment: answers.previousTreatment ?? null,
          family_history: answers.familyHistory ?? null,
          goal: answers.goal ?? null,
          status: "processing",
        })
        .select("id")
        .single();
      recordId = data?.id ?? null;
    } catch {
      /* proceed without persistence */
    }
  }

  // Upload photos (parallel with AI calls)
  let frontalUrl: string | null = null;
  let crownUrl: string | null = null;

  if (hasDB && recordId) {
    const ts = Date.now();
    [frontalUrl, crownUrl] = await Promise.all([
      photoFrontal
        ? uploadPhoto(photoFrontal, `mapa-capilar/${recordId}_${ts}_frontal`)
        : Promise.resolve(null),
      photoCrown
        ? uploadPhoto(photoCrown, `mapa-capilar/${recordId}_${ts}_crown`)
        : Promise.resolve(null),
    ]);
  }

  // ── Two-pass AI analysis ────────────────────────────────────────────────────
  let report: HairMapAnalysisReport = fallback;

  if (process.env.OPENAI_API_KEY) {
    // ── Pass 1: free-form visual analysis with photos ───────────────────────
    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" } };

    const pass1Content: ContentPart[] = [
      { type: "text", text: buildPass1User(answers, hasPhotos) },
    ];

    if (photoFrontal?.startsWith("data:image")) {
      pass1Content.push({ type: "text", text: "PHOTO 1 — Frontal/lateral view:" });
      pass1Content.push({ type: "image_url", image_url: { url: photoFrontal, detail: "high" } });
    }
    if (photoCrown?.startsWith("data:image")) {
      pass1Content.push({ type: "text", text: "PHOTO 2 — Crown/vertex view:" });
      pass1Content.push({ type: "image_url", image_url: { url: photoCrown, detail: "high" } });
    }

    console.log("[analyze] Pass 1: requesting visual prose analysis...");
    const prose = await callOpenAI(
      [
        { role: "system", content: PASS1_SYSTEM },
        { role: "user",   content: pass1Content },
      ],
      { maxTokens: 900, timeoutMs: 20_000, jsonMode: false }
    );

    if (prose) {
      console.log("[analyze] Pass 1 OK, prose length:", prose.length);

      // ── Pass 2: convert prose to full structured JSON ────────────────────
      console.log("[analyze] Pass 2: structuring into JSON...");
      const jsonText = await callOpenAI(
        [
          { role: "system", content: PASS2_SYSTEM },
          { role: "user",   content: buildPass2User(prose, answers) },
        ],
        { maxTokens: 2500, timeoutMs: 20_000, jsonMode: true }
      );

      if (jsonText) {
        try {
          report = normalizeHairMapReport(JSON.parse(jsonText) as unknown, answers);
          console.log("[analyze] Pass 2 OK, report keys:", Object.keys(report));
        } catch {
          console.error("[analyze] Pass 2 JSON parse failed — using fallback");
        }
      } else {
        console.warn("[analyze] Pass 2 returned null — using fallback");
      }
    } else {
      console.warn("[analyze] Pass 1 returned null — using fallback");
    }
  } else {
    console.warn("[analyze] OPENAI_API_KEY not set — using fallback");
  }

  // Update DB record with results
  if (hasDB && recordId) {
    try {
      const supabase = getAdminClient();
      await supabase
        .from("hair_map_analyses")
        .update({
          photo_frontal_url: frontalUrl,
          photo_crown_url:   crownUrl,
          analysis_json:     report,
          status:            "done",
        })
        .eq("id", recordId);
    } catch {
      /* ignore */
    }
  }

  const accessToken = recordId ? generateAccessToken(recordId) : null;
  return NextResponse.json({
    id: recordId,
    accessToken,
    report,
    isFallback: !process.env.OPENAI_API_KEY,
  });
}
