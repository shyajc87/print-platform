import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { renderBrochureHtml, getPageSizeMm } from "@/lib/templates";
import { renderManyToPdfAndPng } from "@/lib/renderPdf";
import {
  buildImagePrompt, fetchRefImageAsBase64, generateWithNanoBanana, pollinationsUrl, ANGLE_VARIANTS,
  buildFullDesignPrompt, generateFullAiDesign, generateFullAiDesignWithGptImage,
} from "@/lib/aiImage";

export const maxDuration = 60;

const GEMINI_KEY = process.env.GEMINI_API_KEY!;

interface Brief {
  brand_name: string; industry: string; product_description: string;
  target_audience: string; key_message: string; mood: string;
  primary_colour: string; secondary_colour: string; size: string;
  quantity?: string; additional_notes?: string; location?: string;
  reference_image_url?: string | null;
  logo_url?: string | null; contact_phone?: string | null; badges?: string | null;
  price1_amount?: string | null; price1_label?: string | null;
  price2_amount?: string | null; price2_label?: string | null;
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

async function toBufferAndType(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (url.startsWith("data:")) {
    const [meta, b64] = url.split(",");
    const contentType = meta.match(/data:(.*);base64/)?.[1] || "image/png";
    return { buffer: Buffer.from(b64, "base64"), contentType };
  }
  const res = await fetch(url);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

export async function POST(req: NextRequest) {
  const debug: string[] = [];
  try {
    const { briefId, mode } = await req.json();
    const generationMode: "template" | "ai_express" = mode === "ai_express" ? "ai_express" : "template";
    const supabase = await createServerClient();

    const { data: brief, error: briefError } = await supabase.from("briefs").select("*").eq("id", briefId).single();
    if (briefError || !brief) return NextResponse.json({ error: "Brief not found", detail: briefError?.message }, { status: 404 });

    debug.push(`key_present: ${GEMINI_KEY ? "yes-" + GEMINI_KEY.slice(0, 6) : "MISSING"}`);
    debug.push(`mode: ${generationMode}`);

    await supabase.from("briefs").update({ status: "generating" }).eq("id", briefId);

    const refImages: { data: string; mimeType: string }[] = [];
    if (brief.reference_image_url) {
      const ref = await fetchRefImageAsBase64(brief.reference_image_url);
      if (ref) refImages.push(ref);
      else debug.push("reference image: failed to fetch, proceeding without it");
    }

    const pageSize = getPageSizeMm(brief.size);
    const designs: Array<{ image_url: string; pdf_url: string; raw_image_url: string | null; engine: string }> = [];

    if (generationMode === "ai_express") {
      // ---- AI Express: single-shot whole-design generation, no template layer ----
      const fullPrompt = buildFullDesignPrompt(brief as Brief);
      const results = await Promise.all([0, 1].map(async (i) => {
        const gpt = await generateFullAiDesignWithGptImage(fullPrompt, pageSize);
        if (gpt.img) { debug.push(`v${i + 1}: gpt-image-1 OK`); return { url: gpt.img, engine: "gpt-image-1" }; }
        debug.push(`v${i + 1}: gpt-image-1 failed → ${gpt.err}, falling back to nano banana`);
        const nano = await generateFullAiDesign(fullPrompt, refImages);
        if (nano.img) { debug.push(`v${i + 1}: nano (ai_express fallback) OK`); return { url: nano.img, engine: "nano-banana-2-express" }; }
        debug.push(`v${i + 1}: nano (ai_express fallback) also failed → ${nano.err}`);
        return null;
      }));

      const htmls = results.filter(Boolean).map(r => {
        const logoOverlay = brief.logo_url
          ? `<img src="${brief.logo_url}" style="position:absolute; top:4%; left:4%; max-width:18%; max-height:12%; object-fit:contain;" />`
          : "";
        return `<!DOCTYPE html><html><body style="margin:0"><div style="position:relative; width:100%; height:100%;"><img src="${r!.url}" style="width:100%;height:100%;object-fit:cover;display:block;"/>${logoOverlay}</div></body></html>`;
      });
      const rendered = await renderManyToPdfAndPng(htmls, pageSize);
      for (let i = 0; i < rendered.length; i++) {
        const r = rendered[i];
        if ("error" in r) { debug.push(`v${i + 1}: pdf wrap failed → ${r.error}`); continue; }
        const png = await uploadBuffer(supabase, r.png, "image/png", briefId, `express-${i + 1}.png`);
        const pdf = await uploadBuffer(supabase, r.pdf, "application/pdf", briefId, `express-${i + 1}.pdf`);
        if (!png.url || !pdf.url) { debug.push(`v${i + 1}: upload failed → ${png.err || pdf.err}`); continue; }
        designs.push({ image_url: png.url, pdf_url: pdf.url, raw_image_url: png.url, engine: results[i]!.engine });
      }

      if (designs.length === 0) throw new Error("AI Express generation failed for all attempts. See debug for details.");

      const inserts = designs.map((d, i) => ({
        brief_id: briefId, image_url: d.image_url, pdf_url: d.pdf_url, raw_image_url: d.raw_image_url,
        ai_prompt: `[${d.engine}] ${fullPrompt}`, generation_mode: "ai_express",
        version_number: i + 1, status: "pending",
      }));
      const { data: insertedDesigns, error: designError } = await supabase.from("designs").insert(inserts).select();
      if (designError) throw new Error(designError.message);

      await supabase.from("briefs").update({ status: "designs_ready" }).eq("id", briefId);
      return NextResponse.json({ success: true, designs: insertedDesigns, briefId, debug });
    }

    // ---- Precision Studio (default): AI background only + real template text ----
    const imagePrompt = await buildImagePrompt(brief as Brief);
    const variants = ANGLE_VARIANTS.map(angle => `${imagePrompt} ${angle}`);

    const backgrounds = await Promise.all(variants.map(async (prompt, i) => {
      const nano = await generateWithNanoBanana(prompt, refImages);
      if (nano.img) { debug.push(`v${i + 1}: nano OK`); return { url: nano.img, engine: "nano-banana-2" }; }
      debug.push(`v${i + 1}: nano failed → ${nano.err}, using pollinations`);
      return { url: pollinationsUrl(prompt, i * 77 + 200), engine: "pollinations" };
    }));

    const rawUploads = await Promise.all(backgrounds.map(async (bg, i) => {
      try {
        const { buffer, contentType } = await toBufferAndType(bg.url);
        const ext = contentType.includes("png") ? "png" : "jpg";
        return await uploadBuffer(supabase, buffer, contentType, briefId, `raw-${i + 1}.${ext}`);
      } catch (e) {
        return { url: null, err: e instanceof Error ? e.message : "raw upload failed" };
      }
    }));

    const htmls = backgrounds.map(bg => renderBrochureHtml(brief as Brief, bg.url));
    const rendered = await renderManyToPdfAndPng(htmls, pageSize);

    for (let i = 0; i < rendered.length; i++) {
      const r = rendered[i];
      if ("error" in r) { debug.push(`v${i + 1}: template render failed → ${r.error}`); continue; }
      const png = await uploadBuffer(supabase, r.png, "image/png", briefId, `concept-${i + 1}.png`);
      const pdf = await uploadBuffer(supabase, r.pdf, "application/pdf", briefId, `concept-${i + 1}.pdf`);
      if (!png.url || !pdf.url) { debug.push(`v${i + 1}: upload failed → ${png.err || pdf.err}`); continue; }
      if (!rawUploads[i]?.url) debug.push(`v${i + 1}: raw image upload failed → ${rawUploads[i]?.err}`);
      designs.push({ image_url: png.url, pdf_url: pdf.url, raw_image_url: rawUploads[i]?.url || null, engine: backgrounds[i].engine });
    }

    if (designs.length === 0) throw new Error("All concepts failed to render. See debug for details.");

    const inserts = designs.map((d, i) => ({
      brief_id: briefId, image_url: d.image_url, pdf_url: d.pdf_url, raw_image_url: d.raw_image_url,
      ai_prompt: `[${d.engine}] ${imagePrompt}`, generation_mode: "template",
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
