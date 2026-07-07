// Shared AI background-image generation logic, used by both the automatic
// concept pipeline (api/generate) and the editor's "Generate AI image" tool
// (api/ai-image). Kept in one place so both stay in sync.

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

export interface BriefForImage {
  brand_name: string; industry: string; product_description: string;
  target_audience?: string; key_message?: string; mood?: string;
  primary_colour?: string; secondary_colour?: string; size?: string;
  location?: string;
}

const SIZE_LABELS: Record<string, string> = {
  "a4-bifold": "A4 Bifold (210 x 297 mm)",
  "a4-trifold": "A4 Trifold (210 x 297 mm)",
  "a5-single": "A5 Single (148 x 210 mm)",
  "dl-bifold": "DL Bifold (99 x 210 mm)",
  "square-210": "Square (210 x 210 mm)",
  "custom": "custom size",
};

// Genuinely different framing per concept, so the 3 generated images aren't
// near-duplicates of the same shot.
export const ANGLE_VARIANTS = [
  "Wide aerial drone shot from directly overhead, midday natural light, expansive establishing view.",
  "Eye-level ground view looking toward the main approach, warm golden-hour lighting.",
  "Three-quarter elevated angle from slightly to one side, soft early-morning light with long shadows.",
];

// Detects whether the brief is about VACANT LAND (a plot for sale) vs a
// FINISHED PROPERTY (villa/house/apartment for sale) — these need completely
// different imagery, and getting this wrong (e.g. showing a landscaped villa
// for a bare land listing) is a content error, not just a style issue.
function detectRealEstateSubject(brief: BriefForImage): string | null {
  if (brief.industry !== "real-estate") return null;
  const text = `${brief.product_description} ${brief.key_message || ""}`.toLowerCase();
  const plotWords = ["plot", "plots", "land", "site", "acre", "cent", "sqft plot", "vacant", "survey no", "dtcp", "layout"];
  const builtWords = ["villa", "house", "apartment", "flat", "bungalow", "duplex", "cottage", "home for sale", "township"];
  const hasPlot = plotWords.some(w => text.includes(w));
  const hasBuilt = builtWords.some(w => text.includes(w));

  if (hasPlot && !hasBuilt) {
    return "This is VACANT, UNDEVELOPED LAND for sale — NOT a finished house or villa. Show an empty plot of land with visible boundary markers/stakes, freshly cleared or graveled access roads, surrounding greenery. Absolutely NO houses, villas, or completed buildings should appear in the image — the land is empty and ready for construction.";
  }
  if (hasBuilt) {
    return "This is a FINISHED, move-in-ready property for sale. Show a completed, professionally landscaped house/villa exterior with visible architectural details.";
  }
  return null; // ambiguous — let the model use general judgement
}

function briefToPromptLines(brief: BriefForImage): string {
  const lines = [
    `Brand: ${brief.brand_name}`,
    `Industry: ${brief.industry}`,
    `Promoting: ${brief.product_description}`,
  ];
  if (brief.target_audience) lines.push(`Target audience: ${brief.target_audience}`);
  if (brief.location) lines.push(`Location: ${brief.location}`);
  if (brief.key_message) lines.push(`Key message: ${brief.key_message}`);
  if (brief.mood) lines.push(`Mood/style: ${brief.mood}`);
  const colours = [brief.primary_colour, brief.secondary_colour].filter(Boolean).join(", ");
  if (colours) lines.push(`Colours: ${colours}`);
  if (brief.size) lines.push(`Format: ${SIZE_LABELS[brief.size] || brief.size}`);
  const subjectHint = detectRealEstateSubject(brief);
  if (subjectHint) lines.push(`IMPORTANT subject clarification: ${subjectHint}`);
  lines.push(
    `Market default: Indian market — visual style and imagery that feels locally relatable${brief.location ? ` for ${brief.location}` : ""}.`
  );
  return lines.join("\n");
}

export async function buildImagePrompt(brief: BriefForImage): Promise<string> {
  const briefText = briefToPromptLines(brief);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a photo art director. Convert this brief into a description of a BACKGROUND/HERO IMAGE ONLY — describe the visual scene, subject, lighting, and mood. Follow any "IMPORTANT subject clarification" line exactly — it corrects a common mistake. Do NOT mention any text, words, numbers, prices, logos, or typography — those are added separately. Output ONLY the image description, 40-60 words, no quotes.\n${briefText}` }] }],
          generationConfig: { maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim().split(/\s+/).length >= 10) return text.trim();
    throw new Error("text response missing or too short");
  } catch {
    const subjectHint = detectRealEstateSubject(brief);
    return `A photographic scene representing ${brief.industry.replace("-", " ")}: ${brief.product_description}${subjectHint ? `. ${subjectHint}` : ""}`;
  }
}

export async function fetchRefImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

// Accepts MULTIPLE reference images (e.g. several of the customer's own real
// site photos) so the model can draw style/content cues from all of them,
// not just one. Pass an empty array for a pure text-to-image generation.
export async function generateWithNanoBanana(
  prompt: string,
  refImages: { data: string; mimeType: string }[]
): Promise<{ img: string | null; err: string | null }> {
  try {
    const noTextInstruction = "Photographic background image, no text, no words, no numbers, no logos, no typography anywhere in the image: ";
    const parts: Record<string, unknown>[] = [];
    if (refImages.length > 0) {
      for (const ref of refImages) parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
      parts.push({ text: `Use the attached image(s) as a base/reference (e.g. real site photos, product, or logo) — match their real content and style where relevant. ${noTextInstruction}${prompt}` });
    } else {
      parts.push({ text: `${noTextInstruction}${prompt}` });
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      return { img: null, err: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = await res.json();
    const part = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
    );
    if (!part?.inlineData?.data) return { img: null, err: "no inlineData in response" };
    return { img: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, err: null };
  } catch (e) {
    return { img: null, err: `exception: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

export function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(`photographic background, no text, no logos, ${prompt}`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1000&height=1000&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

// ---------------------------------------------------------------------------
// "AI Express" mode: single-shot whole-design generation (like Emergent's
// approach). The AI renders EVERYTHING itself — brand name, price, badges,
// phone — as pixels in one image. No template compositing. Faster, more
// "designed"-looking when it works, but text accuracy is not guaranteed —
// this is the tradeoff being deliberately offered as a user choice, not
// hidden. Kept clearly separate from the reliable "Precision Studio" path.
// ---------------------------------------------------------------------------

export interface FullDesignBrief extends BriefForImage {
  quantity?: string;
  additional_notes?: string;
  logo_url?: string | null;
  contact_phone?: string | null;
  badges?: string | null;
  price1_amount?: string | null;
  price1_label?: string | null;
  price2_amount?: string | null;
  price2_label?: string | null;
}

export function buildFullDesignPrompt(brief: FullDesignBrief): string {
  const lines: string[] = [];

  // Brand name gets an emphasized, explicitly flagged instruction of its own —
  // models weight instructions marked as high-priority more heavily, and this
  // is the single most important piece of text to get exactly right.
  lines.push(
    `CRITICAL: The brand name "${brief.brand_name}" must be rendered with EXACT spelling, fully visible, positioned with at least an 8% safe margin from every edge of the image so it is never cropped or cut off.`
  );

  lines.push(`Design a complete, professional print marketing poster/card for this brand.`);
  lines.push(`Industry: ${brief.industry}.`);

  // Remaining fields as explicit, enumerated "Label: value" lines rather than
  // folded into prose — much easier for the model to render each one precisely
  // instead of paraphrasing or dropping details.
  const fields: [string, string | null | undefined][] = [
    ["Promoting", brief.product_description],
    ["Headline", brief.key_message],
    ["Location", brief.location],
    ["Trust badges/icons to include", brief.badges],
    ["Price 1", brief.price1_amount ? `${brief.price1_amount}${brief.price1_label ? ` (${brief.price1_label})` : ""}` : null],
    ["Price 2", brief.price2_amount ? `${brief.price2_amount}${brief.price2_label ? ` (${brief.price2_label})` : ""}` : null],
    ["Phone number", brief.contact_phone],
  ];
  for (const [label, value] of fields) {
    if (value) lines.push(`${label}: "${value}" — render this exact text visibly and spelled correctly.`);
  }

  const colours = [brief.primary_colour, brief.secondary_colour].filter(Boolean).join(" and ");
  if (colours) lines.push(`Brand colours: ${colours}.`);
  if (brief.mood) lines.push(`Style/mood: ${brief.mood}.`);

  // Logo hint: if a real logo exists, don't have the model hallucinate its own —
  // reserve clean space for it instead (a real logo can be composited in later).
  if (brief.logo_url) {
    lines.push(`A real logo will be placed separately — reserve a clean, simple rectangular area (e.g. top-left corner) for it. Do NOT draw or invent any logo graphic yourself.`);
  }

  lines.push(
    `Composition rules: maintain a safe margin from all edges for every text element, sharp and legible typography throughout, professional commercial print-advertisement quality, well-balanced layout.`
  );

  return lines.join(" ");
}

export async function generateFullAiDesign(
  prompt: string,
  refImages: { data: string; mimeType: string }[]
): Promise<{ img: string | null; err: string | null }> {
  try {
    const parts: Record<string, unknown>[] = [];
    for (const ref of refImages) parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
    parts.push({ text: prompt });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      return { img: null, err: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = await res.json();
    const part = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
    );
    if (!part?.inlineData?.data) return { img: null, err: "no inlineData in response" };
    return { img: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, err: null };
  } catch (e) {
    return { img: null, err: `exception: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
