import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Takes an EXISTING image + a plain-English instruction ("make the
// background blue", "add a mountain behind the house", "make the text
// bigger") and asks GPT-Image-1 to edit it — not regenerate from scratch.
// This uses OpenAI's /v1/images/edits endpoint, which genuinely edits the
// provided image rather than ignoring it and starting fresh.
export async function POST(req: NextRequest) {
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set on the server" }, { status: 500 });
  }
  try {
    const { imageUrl, instruction } = await req.json();
    if (!imageUrl || !instruction) {
      return NextResponse.json({ error: "imageUrl and instruction are required" }, { status: 400 });
    }

    // Fetch the existing image (handles both remote URLs and base64 data URLs).
    let imageBuffer: Buffer;
    let imageMime = "image/png";
    if (imageUrl.startsWith("data:")) {
      const [meta, b64] = imageUrl.split(",");
      imageMime = meta.match(/data:(.*);base64/)?.[1] || "image/png";
      imageBuffer = Buffer.from(b64, "base64");
    } else {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) return NextResponse.json({ error: `Failed to fetch source image: HTTP ${imgRes.status}` }, { status: 400 });
      imageMime = imgRes.headers.get("content-type") || "image/png";
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    }

    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("image", new Blob([new Uint8Array(imageBuffer)], { type: imageMime }), "image.png");
    form.append("prompt", instruction);

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}` },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `OpenAI edit failed: HTTP ${res.status}: ${errText.slice(0, 300)}` }, { status: 500 });
    }

    const data = await res.json();
    const item = data?.data?.[0];
    if (item?.b64_json) return NextResponse.json({ imageUrl: `data:image/png;base64,${item.b64_json}` });
    if (item?.url) return NextResponse.json({ imageUrl: item.url });
    return NextResponse.json({ error: "No image returned from edit request" }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
