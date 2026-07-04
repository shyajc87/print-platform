import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

interface Brief {
  brand_name: string; industry: string; product_description: string;
  target_audience: string; key_message: string; mood: string;
  primary_colour: string; secondary_colour: string; size: string;
  quantity?: string; additional_notes?: string;
}

const SIZE_LABELS: Record<string, string> = {
  "a4-bifold": "A4 Bifold (210 x 297 mm)",
  "a4-trifold": "A4 Trifold (210 x 297 mm)",
  "a5-single": "A5 Single (148 x 210 mm)",
  "dl-bifold": "DL Bifold (99 x 210 mm)",
  "square-210": "Square (210 x 210 mm)",
  "custom": "custom size",
};

// Builds the image-generation prompt entirely from what the user entered in the brief.
// No invented style language, region, or aesthetic is added — only the user's own words and choices.
function briefToPromptLines(brief: Brief): string {
  const lines = [
    `Brand: ${brief.brand_name}`,
    `Industry: ${brief.industry}`,
    `Promoting: ${brief.product_description}`,
  ];
  if (brief.target_audience) lines.push(`Target audience: ${brief.target_audience}`);
  if (brief.key_message) lines.push(`Key message: ${brief.key_message}`);
  if (brief.mood) lines.push(`Mood/style: ${brief.mood}`);
  const colours = [brief.primary_colour, brief.secondary_colour].filter(Boolean).join(", ");
  if (colours) lines.push(`Colours: ${colours}`);
  if (brief.size) lines.push(`Format: ${SIZE_LABELS[brief.size] || brief.size}`);
  if (brief.additional_notes) lines.push(`Additional content to include: ${brief.additional_notes}`);
  return lines.join("\n");
}

async function buildPrompt(brief: Brief): Promise<string> {
  const briefText = briefToPromptLines(brief);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an expert print designer. Convert this brief into an image generation prompt using only the details given below — do not invent a style, region, colour, or theme that isn't in the brief. Output ONLY the prompt, 60-80 words, no quotes.\n${briefText}` }] }],
          generationConfig: { maxOutputTokens: 200 },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text.trim();
    throw new Error("empty text response");
  } catch {
    // Fallback: use the brief's own fields directly, nothing invented.
    return briefText.replace(/\n/g, ", ");
  }
}

async function generateWithNanoBanana(prompt: string): Promise<{ img: string | null; err: string | null }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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

function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=1131&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

async function uploadToStorage(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  base64DataUrl: string, briefId: string, version: number
): Promise<{ url: string | null; err: string | null }> {
  try {
    const [meta, b64] = base64DataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "image/png";
    const ext = mime.split("/")[1] || "png";
    const buffer = Buffer.from(b64, "base64");
    const path = `${briefId}/concept-${version}.${ext}`;
    const { error } = await supabase.storage.from("designs").upload(path, buffer, { contentType: mime, upsert: true });
    if (error) return { url: null, err: `storage: ${error.message}` };
    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    return { url: data.publicUrl, err: null };
  } catch (e) {
    return { url: null, err: `upload exception: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

export async function POST(req: NextRequest) {
  const debug: string[] = [];
  try {
    const { briefId } = await req.json();
    const supabase = await createServerClient();

    const { data: brief, error: briefError } = await supabase.from("briefs").select("*").eq("id", briefId).single();
    if (briefError || !brief) return NextResponse.json({ error: "Brief not found", detail: briefError?.message }, { status: 404 });

    debug.push(`key_present: ${GEMINI_KEY ? "yes-" + GEMINI_KEY.slice(0, 6) : "MISSING"}`);

    await supabase.from("briefs").update({ status: "generating" }).eq("id", briefId);
    const basePrompt = await buildPrompt(brief);
    // All 3 concepts use the same user-derived prompt; natural model variation
    // produces different layouts without us dictating a style.
    const variants = [basePrompt, basePrompt, basePrompt];

    const imageUrls = await Promise.all(variants.map(async (prompt, i) => {
      const nano = await generateWithNanoBanana(prompt);
      if (nano.img) {
        const up = await uploadToStorage(supabase, nano.img, briefId, i + 1);
        if (up.url) { debug.push(`v${i + 1}: nano OK`); return { url: up.url, engine: "nano-banana-2" }; }
        debug.push(`v${i + 1}: nano img OK but upload failed → ${up.err}`);
      } else {
        debug.push(`v${i + 1}: nano failed → ${nano.err}`);
      }
      return { url: pollinationsUrl(prompt, i * 77 + 200), engine: "pollinations" };
    }));

    const inserts = imageUrls.map((img, i) => ({
      brief_id: briefId, image_url: img.url, ai_prompt: `[${img.engine}] ${variants[i]}`,
      version_number: i + 1, status: "pending",
    }));
    const { data: designs, error: designError } = await supabase.from("designs").insert(inserts).select();
    if (designError) throw new Error(designError.message);

    await supabase.from("briefs").update({ status: "designs_ready" }).eq("id", briefId);
    return NextResponse.json({ success: true, designs, briefId, engine: imageUrls[0].engine, debug });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to generate designs", detail: message, debug }, { status: 500 });
  }
}
