import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { buildImagePrompt, fetchRefImageAsBase64, generateWithNanoBanana, pollinationsUrl, BriefForImage } from "@/lib/aiImage";

// Generates a single background image for the editor's "Generate with AI" tool.
// Accepts either a briefId (reuses that brief's details) or a raw prompt string.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let brief: BriefForImage;

    if (body.briefId) {
      const supabase = await createServerClient();
      const { data, error } = await supabase.from("briefs").select("*").eq("id", body.briefId).single();
      if (error || !data) return NextResponse.json({ error: "Brief not found" }, { status: 404 });
      brief = data;
    } else if (body.prompt) {
      const nano = await generateWithNanoBanana(body.prompt, null);
      if (nano.img) return NextResponse.json({ imageUrl: nano.img, engine: "nano-banana-2" });
      return NextResponse.json({ imageUrl: pollinationsUrl(body.prompt, Date.now() % 1000), engine: "pollinations" });
    } else {
      return NextResponse.json({ error: "Provide briefId or prompt" }, { status: 400 });
    }

    const imagePrompt = await buildImagePrompt(brief);
    const refImage = body.referenceImageUrl ? await fetchRefImageAsBase64(body.referenceImageUrl) : null;
    const nano = await generateWithNanoBanana(imagePrompt, refImage);
    if (nano.img) return NextResponse.json({ imageUrl: nano.img, engine: "nano-banana-2", prompt: imagePrompt });
    return NextResponse.json({ imageUrl: pollinationsUrl(imagePrompt, Date.now() % 1000), engine: "pollinations", prompt: imagePrompt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
