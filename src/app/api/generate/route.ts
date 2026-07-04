import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { renderBrochureHtml, getPageSizeMm } from "@/lib/templates";
import { renderManyToPdfAndPng } from "@/lib/renderPdf";

// Puppeteer/Chromium cold starts + multiple renders can take a while.
export const maxDuration = 60;

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

interface Brief {
  brand_name: string; industry: string; product_description: string;
  target_audience: string; key_message: string; mood: string;
  primary_colour: string; secondary_colour: string; size: string;
  quantity?: string; additional_notes?: string; location?: string;
  reference_image_url?: string | null;
}

const SIZE_LABELS: Record<string, string> = {
  "a4-bifold": "A4 Bifold (210 x 297 mm)",
  "a4-trifold": "A4 Trifold (210 x 297 mm)",
  "a5-single": "A5 Single (148 x 210 mm)",
  "dl-bifold": "DL Bifold (99 x 210 mm)",
  "square-210": "Square (210 x 210 mm)",
  "custom": "custom size",
};

function briefToPromptLines(brief: Brief): string {
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

// Builds a prompt for a BACKGROUND/HERO IMAGE ONLY. Text (brand name, price,
// phone number, etc.) is rendered separately as real HTML text by the template
// — the AI is never asked to render text, since image models can't reliably
// spell small print text, get exact prices right, or match brand colours.
async function buildImagePrompt(brief: Brief): Promise<string> {
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

async function fetchRefImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
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

async function generateWithNanoBanana(
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

function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(`photographic background, no text, no logos, ${prompt}`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1000&height=1000&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

async function uploadBuffer(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  buffer: Buffer, contentType: string, briefId: string, filename: string
): Promise<{ url: string | null; err: string | null }> {
  try {
    const path = `${briefId}/${filename}`;
    const { error } = await supabase.storage.from("designs").upload(path, buffer, { contentType, upsert: true });
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
    const imagePrompt = await buildImagePrompt(brief);
    const variants = [imagePrompt, imagePrompt, imagePrompt];

    const refImage = brief.reference_image_url
      ? await fetchRefImageAsBase64(brief.reference_image_url)
      : null;
    if (brief.reference_image_url && !refImage) debug.push("reference image: failed to fetch, proceeding without it");

    // 1. Get a background image per concept (Nano Banana, falling back to Pollinations).
    const backgrounds = await Promise.all(variants.map(async (prompt, i) => {
      const nano = await generateWithNanoBanana(prompt, refImage);
      if (nano.img) { debug.push(`v${i + 1}: nano OK`); return { url: nano.img, engine: "nano-banana-2" }; }
      debug.push(`v${i + 1}: nano failed → ${nano.err}, using pollinations`);
      return { url: pollinationsUrl(prompt, i * 77 + 200), engine: "pollinations" };
    }));

    // 2. Render each background into the industry-appropriate HTML template
    //    (real text for brand/price/phone — never AI-generated pixels).
    const htmls = backgrounds.map(bg => renderBrochureHtml(brief, bg.url));

    // 3. Convert each templated page into a print-ready PDF + preview PNG.
    const pageSize = getPageSizeMm(brief.size);
    const rendered = await renderManyToPdfAndPng(htmls, pageSize);

    const designs: Array<{ image_url: string; pdf_url: string; engine: string }> = [];
    for (let i = 0; i < rendered.length; i++) {
      const r = rendered[i];
      if ("error" in r) { debug.push(`v${i + 1}: template render failed → ${r.error}`); continue; }
      const png = await uploadBuffer(supabase, r.png, "image/png", briefId, `concept-${i + 1}.png`);
      const pdf = await uploadBuffer(supabase, r.pdf, "application/pdf", briefId, `concept-${i + 1}.pdf`);
      if (!png.url || !pdf.url) { debug.push(`v${i + 1}: upload failed → ${png.err || pdf.err}`); continue; }
      designs.push({ image_url: png.url, pdf_url: pdf.url, engine: backgrounds[i].engine });
    }

    if (designs.length === 0) throw new Error("All concepts failed to render. See debug for details.");

    const inserts = designs.map((d, i) => ({
      brief_id: briefId, image_url: d.image_url, pdf_url: d.pdf_url,
      ai_prompt: `[${d.engine}] ${imagePrompt}`,
      version_number: i + 1, status: "pending",
    }));
    const { data: insertedDesigns, error: designError } = await supabase.from("designs").insert(inserts).select();
    if (designError) throw new Error(designError.message);

    await supabase.from("briefs").update({ status: "designs_ready" }).eq("id", briefId);
    return NextResponse.json({ success: true, designs: insertedDesigns, briefId, debug });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to generate designs", detail: message, debug }, { status: 500 });
  }
}
