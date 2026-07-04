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
          contents: [{ parts: [{ text: `You are a photo art director. Convert this brief into a description of a BACKGROUND/HERO IMAGE ONLY — describe the visual scene, subject, lighting, and mood. Do NOT mention any text, words, numbers, prices, logos, or typography — those are added separately. Output ONLY the image description, 40-60 words, no quotes.\n${briefText}` }] }],
          generationConfig: { maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim().split(/\s+/).length >= 10) return text.trim();
    throw new Error("text response missing or too short");
  } catch {
    return `A photographic scene representing ${brief.industry.replace("-", " ")}: ${brief.product_description}`;
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

export async function generateWithNanoBanana(
  prompt: string,
  refImage: { data: string; mimeType: string } | null
): Promise<{ img: string | null; err: string | null }> {
  try {
    const noTextInstruction = "Photographic background image, no text, no words, no numbers, no logos, no typography anywhere in the image: ";
    const parts: Record<string, unknown>[] = [];
    if (refImage) {
      parts.push({ inlineData: { mimeType: refImage.mimeType, data: refImage.data } });
      parts.push({ text: `Use the attached image as a base/reference (e.g. site photo, product, or logo). ${noTextInstruction}${prompt}` });
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
