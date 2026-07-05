import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Renders MULTIPLE pages (e.g. front + back) into a SINGLE multi-page PDF.
// Each page is wrapped in a fixed-size div with a forced page break after it,
// so Chromium's print pipeline splits them into separate PDF pages at the
// correct physical size.
export async function renderCombinedPdf(
  pageHtmls: string[],
  pageSizeMm: { w: number; h: number }
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const combined = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; }
      @page { size: ${pageSizeMm.w}mm ${pageSizeMm.h}mm; margin: 0; }
      .sheet { width: ${pageSizeMm.w}mm; height: ${pageSizeMm.h}mm; overflow: hidden; position: relative; page-break-after: always; }
      .sheet:last-child { page-break-after: auto; }
      .sheet > * { width: 100%; height: 100%; }
    </style></head><body>
      ${pageHtmls.map(h => `<div class="sheet">${h}</div>`).join("")}
    </body></html>`;

    const page = await browser.newPage();
    await page.setContent(combined, { waitUntil: "load", timeout: 20000 });
    const pdf = await page.pdf({
      width: `${pageSizeMm.w}mm`, height: `${pageSizeMm.h}mm`,
      printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

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

