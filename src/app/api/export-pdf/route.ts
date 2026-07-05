import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { renderCombinedPdf } from "@/lib/renderPdf";

export const maxDuration = 60;

function wrapSvg(svg: string): string {
  return `<style>*{margin:0;padding:0;}svg{display:block;width:100%;height:100%;}</style>${svg}`;
}

// Takes the editor's exported SVG page(s) (from fabric.js canvas.toSVG(),
// which keeps text as real vector text, not flattened pixels) and turns them
// into ONE print-ready PDF at the correct physical page size. Accepts either
// a single `svg` (legacy, single page) or a `pages` array (e.g. [front, back]
// -> a 2-page PDF).
export async function POST(req: NextRequest) {
  try {
    const { svg, pages, widthMm, heightMm, briefId } = await req.json();
    const svgPages: string[] = pages && Array.isArray(pages) ? pages : svg ? [svg] : [];
    if (svgPages.length === 0 || !widthMm || !heightMm) {
      return NextResponse.json({ error: "pages (or svg), widthMm, and heightMm are required" }, { status: 400 });
    }

    const pdfBuffer = await renderCombinedPdf(svgPages.map(wrapSvg), { w: widthMm, h: heightMm });

    const supabase = await createServerClient();
    const path = `${briefId || "custom"}/edited-${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage.from("designs").upload(path, pdfBuffer, {
      contentType: "application/pdf", upsert: true,
    });
    if (uploadErr) return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });

    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    return NextResponse.json({ pdfUrl: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
