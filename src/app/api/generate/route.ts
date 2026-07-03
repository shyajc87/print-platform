import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

interface Brief {
  brand_name: string;
  industry: string;
  product_description: string;
  target_audience: string;
  key_message: string;
  mood: string;
  primary_colour: string;
  secondary_colour: string;
  size: string;
}

/* ── Step 1: Gemini text model writes the design prompt (free tier) ── */
async function buildPrompt(brief: Brief): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert print designer. Convert this brochure brief into a precise image generation prompt. Output ONLY the prompt, 60-80 words, no explanation or quotes. Include visual style, color palette, layout composition, industry imagery.

Brief:
Brand: ${brief.brand_name}
Industry: ${brief.industry}
Promoting: ${brief.product_description}
Target audience: ${brief.target_audience || "general"}
Key message: ${brief.key_message || "not specified"}
Mood: ${brief.mood}
Colours: ${[brief.primary_colour, brief.secondary_colour].filter(Boolean).join(", ") || "designer's choice"}`
            }]
          }],
          generationConfig: { maxOutputTokens: 200 },
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text.trim();
    throw new Error("empty");
  } catch {
    // Fallback: rule-based prompt
    const moodMap: Record<string, string> = {
      premium: "luxury elegant sophisticated", modern: "clean minimal contemporary",
      bold: "vibrant high-contrast striking", warm: "friendly approachable inviting",
      corporate: "professional trustworthy formal", natural: "earthy organic sustainable",
    };
    return `${moodMap[brief.mood] || "professional"} brochure design for ${brief.brand_name}, ${brief.industry} industry, ${brief.key_message || brief.product_description}`;
  }
}

/* ── Step 2a: Nano Banana 2 image generation ── */
async function generateWithNanoBanana(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a professional print brochure cover design: ${prompt}. Portrait A4 format, print-ready quality, editorial layout, sharp typography, no watermarks.`
            }]
          }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const part = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
    );
    if (!part?.inlineData?.data) return null;
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  } catch {
    return null;
  }
}

/* ── Step 2b: Pollinations fallback (free, always works) ── */
function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(
    `Professional print brochure design, ${prompt}, high quality, editorial layout`
  );
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=1131&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

/* ── Step 3: upload base64 images to Supabase Storage ── */
async function uploadToStorage(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  base64DataUrl: string,
  briefId: string,
  version: number
): Promise<string | null> {
  try {
    const [meta, b64] = base64DataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "image/png";
    const ext = mime.split("/")[1] || "png";
    const buffer = Buffer.from(b64, "base64");
    const path = `${briefId}/concept-${version}.${ext}`;

    const { error } = await supabase.storage
      .from("designs")
      .upload(path, buffer, { contentType: mime, upsert: true });
    if (error) return null;

    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { briefId } = await req.json();
    const supabase = await createServerClient();

    const { data: brief, error: briefError } = await supabase
      .from("briefs").select("*").eq("id", briefId).single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    await supabase.from("briefs").update({ status: "generating" }).eq("id", briefId);

    const basePrompt = await buildPrompt(brief);
    const variants = [
      `${basePrompt}, clean minimal layout, bold headline typography`,
      `${basePrompt}, rich full-bleed imagery, elegant overlay typography`,
      `${basePrompt}, geometric modern grid layout, strong visual hierarchy`,
    ];

    // Try Nano Banana for all 3; fall back per-image to Pollinations
    const imageUrls = await Promise.all(
      variants.map(async (prompt, i) => {
        const nano = await generateWithNanoBanana(prompt);
        if (nano) {
          const stored = await uploadToStorage(supabase, nano, briefId, i + 1);
          if (stored) return { url: stored, engine: "nano-banana-2" };
        }
        return { url: pollinationsUrl(prompt, i * 77 + 200), engine: "pollinations" };
      })
    );

    const inserts = imageUrls.map((img, i) => ({
      brief_id: briefId,
      image_url: img.url,
      ai_prompt: `[${img.engine}] ${variants[i]}`,
      version_number: i + 1,
      status: "pending",
    }));

    const { data: designs, error: designError } = await supabase
      .from("designs").insert(inserts).select();
    if (designError) throw new Error(designError.message);

    await supabase.from("briefs").update({ status: "designs_ready" }).eq("id", briefId);

    return NextResponse.json({
      success: true,
      designs,
      briefId,
      engine: imageUrls[0].engine,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generation error:", message);
    return NextResponse.json({ error: "Failed to generate designs", detail: message }, { status: 500 });
  }
}
