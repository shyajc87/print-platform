import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function buildPrompt(brief: {
  brand_name: string;
  industry: string;
  product_description: string;
  key_message: string;
  mood: string;
  primary_colour: string;
  secondary_colour: string;
}): string {
  const moodMap: Record<string, string> = {
    premium: "luxury elegant sophisticated high-end",
    modern: "clean minimal contemporary sleek",
    bold: "vibrant energetic high-contrast striking",
    warm: "friendly approachable inviting human",
    corporate: "professional trustworthy formal structured",
    natural: "earthy organic sustainable green",
  };

  const industryMap: Record<string, string> = {
    "real-estate": "residential property architecture modern homes gated community",
    "food-beverage": "food photography restaurant cuisine delicious",
    healthcare: "medical clean sterile professional health",
    education: "learning students campus academic",
    retail: "fashion lifestyle product shopping",
    finance: "business corporate finance wealth",
    technology: "tech digital innovation futuristic",
    other: "professional business corporate",
  };

  const mood = moodMap[brief.mood] || "professional";
  const industry = industryMap[brief.industry] || "professional business";
  const colours = [brief.primary_colour, brief.secondary_colour]
    .filter(Boolean)
    .join(" and ");

  return `${mood} brochure design for ${brief.brand_name}, ${industry}, ${colours ? `${colours} color palette,` : ""} ${brief.key_message || brief.product_description}, print ready marketing material, professional layout`;
}

export async function POST(req: NextRequest) {
  try {
    const { briefId } = await req.json();

    const { data: brief, error: briefError } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    await supabase
      .from("briefs")
      .update({ status: "generating" })
      .eq("id", briefId);

    const basePrompt = buildPrompt(brief);

    const styleVariants = [
      `${basePrompt}, clean minimal layout, bold headline typography, white space`,
      `${basePrompt}, rich full-bleed imagery, elegant serif typography overlay`,
      `${basePrompt}, geometric modern grid layout, strong visual hierarchy`,
    ];

    const imageUrls = styleVariants.map((prompt, i) => {
      const encoded = encodeURIComponent(
        `Professional print brochure design, ${prompt}, high quality, 300 DPI, editorial`
      );
      return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=1131&seed=${i * 77 + 200}&nologo=true&enhance=true&model=flux`;
    });

    const designInserts = imageUrls.map((url, index) => ({
      brief_id: briefId,
      image_url: url,
      ai_prompt: styleVariants[index],
      version_number: index + 1,
      status: "pending",
    }));

    const { data: designs, error: designError } = await supabase
      .from("designs")
      .insert(designInserts)
      .select();

    if (designError) throw new Error(designError.message);

    await supabase
      .from("briefs")
      .update({ status: "designs_ready" })
      .eq("id", briefId);

    return NextResponse.json({ success: true, designs, briefId });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generation error:", message);
    return NextResponse.json(
      { error: "Failed to generate designs", detail: message },
      { status: 500 }
    );
  }
}
