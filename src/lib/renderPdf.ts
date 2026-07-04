import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Renders the same HTML twice: once to a physical-size PDF (the print-ready
// deliverable) and once to a smaller PNG (for the on-screen gallery preview).
// Runs in Vercel's serverless environment via @sparticuz/chromium, since the
// full puppeteer download doesn't fit/run there.
//
// Accepts multiple HTML strings and renders them from a single browser launch
// (one Chromium cold-start instead of one per variant).
export async function renderManyToPdfAndPng(
  htmls: string[],
  pageSizeMm: { w: number; h: number }
): Promise<Array<{ pdf: Buffer; png: Buffer } | { error: string }>> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const previewWidth = 800;
  const previewHeight = Math.round(previewWidth * (pageSizeMm.h / pageSizeMm.w));

  try {
    const results: Array<{ pdf: Buffer; png: Buffer } | { error: string }> = [];
    for (const html of htmls) {
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load", timeout: 20000 });

        const pdf = await page.pdf({
          width: `${pageSizeMm.w}mm`,
          height: `${pageSizeMm.h}mm`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        await page.setViewport({ width: previewWidth, height: previewHeight });
        const png = await page.screenshot({ type: "png" });
        await page.close();

        results.push({ pdf: Buffer.from(pdf), png: Buffer.from(png) });
      } catch (e) {
        results.push({ error: e instanceof Error ? e.message : "render failed" });
      }
    }
    return results;
  } finally {
    await browser.close();
  }
}

