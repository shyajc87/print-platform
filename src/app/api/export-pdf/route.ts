import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { renderManyToPdfAndPng } from "@/lib/renderPdf";

export const maxDuration = 60;

// Takes the editor's exported SVG (from fabric.js canvas.toSVG(), which keeps
// text as real vector text, not flattened pixels) and turns it into a
// print-ready PDF at the correct physical page size.
export async function POST(req: NextRequest) {
  try {
    const { svg, widthMm, heightMm, briefId } = await req.json();
    if (!svg || !widthMm || !heightMm) {
      return NextResponse.json({ error: "svg, widthMm, and heightMm are required" }, { status: 400 });
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; }
      svg { display: block; width: 100%; height: 100%; }
    </style></head><body>${svg}</body></html>`;

    const [rendered] = await renderManyToPdfAndPng([html], { w: widthMm, h: heightMm });
    if ("error" in rendered) {
      return NextResponse.json({ error: `Render failed: ${rendered.error}` }, { status: 500 });
    }

    const supabase = await createServerClient();
    const path = `${briefId || "custom"}/edited-${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage.from("designs").upload(path, rendered.pdf, {
      contentType: "application/pdf", upsert: true,
    });
    if (uploadErr) return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });

    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    return NextResponse.json({ pdfUrl: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
