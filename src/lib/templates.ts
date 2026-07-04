// Renders a print-ready brochure as HTML, using the brief's own text as REAL text
// (never AI-generated pixels) and the AI-generated image purely as a background/hero
// visual. This is what makes prices, phone numbers, and spellings reliable.

interface TemplateBrief {
  brand_name: string;
  industry: string;
  product_description: string;
  target_audience?: string;
  key_message?: string;
  mood?: string;
  primary_colour?: string;
  secondary_colour?: string;
  size?: string;
  additional_notes?: string;
  location?: string;
}

const SIZE_MM: Record<string, { w: number; h: number }> = {
  "a4-bifold": { w: 210, h: 297 },
  "a4-trifold": { w: 210, h: 297 },
  "a5-single": { w: 148, h: 210 },
  "dl-bifold": { w: 99, h: 210 },
  "square-210": { w: 210, h: 210 },
  "custom": { w: 210, h: 297 },
};

export function getPageSizeMm(size?: string) {
  return SIZE_MM[size || "a4-bifold"] || SIZE_MM["a4-bifold"];
}

// Industries grouped into layout "families" — genuinely different structures,
// not just a recolored copy of the same template.
const FAMILY: Record<string, "hero" | "grid" | "corporate"> = {
  "real-estate": "hero",
  "education": "hero",
  "other": "hero",
  "food-beverage": "grid",
  "retail": "grid",
  "healthcare": "corporate",
  "finance": "corporate",
  "technology": "corporate",
};

function escapeHtml(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// CSS custom-property fallback trick: if the user's colour word/hex is invalid,
// the browser silently ignores that line and keeps the fallback that came before it.
function colourVars(varName: string, fallback: string, userValue?: string): string {
  const cleaned = (userValue || "").trim();
  const candidate = /^#[0-9a-fA-F]{3,8}$/.test(cleaned)
    ? cleaned
    : cleaned.split(/\s+/).pop() || ""; // "Deep Blue" -> "Blue"
  return `${varName}: ${fallback}; ${candidate ? `${varName}: ${candidate};` : ""}`;
}

function bulletsFromText(text: string): string[] {
  // Split on common separators so free-typed briefs render as a clean bullet list.
  return text
    .split(/[,•\n]|(?:\s-\s)/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function baseStyles(accent: string, accent2: string) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; font-family: 'Helvetica Neue', Arial, sans-serif; }
    :root { ${accent} ${accent2} }
    .page { width: 100%; height: 100vh; position: relative; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
    .footer-strip { background: var(--accent); color: #fff; padding: 3.5% 6%; display: flex; justify-content: space-between; align-items: center; font-size: 1.4vh; }
    .brand { font-weight: 800; letter-spacing: 0.5px; }
    .tag { font-size: 1.6vh; opacity: 0.85; }
  `;
}

function heroTemplate(b: TemplateBrief, imageDataUrl: string): string {
  const bullets = bulletsFromText(b.product_description);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseStyles(colourVars("--accent", "#1e293b", b.primary_colour), colourVars("--accent2", "#0ea5e9", b.secondary_colour))}
    .hero { flex: 0 0 58%; background-image: url('${imageDataUrl}'); background-size: cover; background-position: center; position: relative; }
    .hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 55%); }
    .hero-text { position: absolute; left: 6%; right: 6%; bottom: 5%; color: #fff; }
    .hero-text h1 { font-size: 4.2vh; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .hero-text p { font-size: 2vh; opacity: 0.92; margin-top: 0.5vh; }
    .body { flex: 1; padding: 5% 6%; display: flex; flex-direction: column; justify-content: center; gap: 1.6vh; }
    .body h2 { font-size: 2.6vh; color: var(--accent); font-weight: 700; }
    ul { list-style: none; display: flex; flex-direction: column; gap: 1vh; }
    li { font-size: 1.9vh; color: #1f2937; padding-left: 1.6em; position: relative; }
    li::before { content: "—"; position: absolute; left: 0; color: var(--accent2); font-weight: 700; }
  </style></head><body>
    <div class="page">
      <div class="hero">
        <div class="hero-text">
          <h1>${escapeHtml(b.brand_name)}</h1>
          ${b.key_message ? `<p>${escapeHtml(b.key_message)}</p>` : ""}
        </div>
      </div>
      <div class="body">
        <h2>${escapeHtml(b.industry.replace("-", " "))}${b.location ? ` · ${escapeHtml(b.location)}` : ""}</h2>
        <ul>${bullets.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>
      <div class="footer-strip">
        <span class="brand">${escapeHtml(b.brand_name)}</span>
        <span class="tag">${escapeHtml(b.additional_notes || b.target_audience || "")}</span>
      </div>
    </div>
  </body></html>`;
}

function gridTemplate(b: TemplateBrief, imageDataUrl: string): string {
  const bullets = bulletsFromText(b.product_description);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseStyles(colourVars("--accent", "#b91c1c", b.primary_colour), colourVars("--accent2", "#f59e0b", b.secondary_colour))}
    .top { padding: 5% 6% 2%; display: flex; justify-content: space-between; align-items: flex-start; }
    .top h1 { font-size: 3.6vh; color: var(--accent); font-weight: 800; }
    .top .tagline { font-size: 1.8vh; color: #6b7280; margin-top: 0.5vh; max-width: 60%; }
    .badge { background: var(--accent2); color: #fff; font-size: 1.6vh; font-weight: 700; padding: 0.8vh 1.6vh; border-radius: 999px; white-space: nowrap; }
    .photo { flex: 1; margin: 0 6%; border-radius: 1.2vh; background-image: url('${imageDataUrl}'); background-size: cover; background-position: center; }
    .chips { display: flex; flex-wrap: wrap; gap: 1vh; padding: 3% 6%; }
    .chip { background: #fef2f2; border: 1px solid var(--accent); color: var(--accent); font-size: 1.6vh; font-weight: 600; padding: 0.8vh 1.6vh; border-radius: 999px; }
  </style></head><body>
    <div class="page">
      <div class="top">
        <div>
          <h1>${escapeHtml(b.brand_name)}</h1>
          ${b.key_message ? `<div class="tagline">${escapeHtml(b.key_message)}</div>` : ""}
        </div>
        ${b.location ? `<span class="badge">${escapeHtml(b.location)}</span>` : ""}
      </div>
      <div class="photo"></div>
      <div class="chips">${bullets.map(x => `<span class="chip">${escapeHtml(x)}</span>`).join("")}</div>
      <div class="footer-strip">
        <span class="brand">${escapeHtml(b.brand_name)}</span>
        <span class="tag">${escapeHtml(b.additional_notes || b.target_audience || "")}</span>
      </div>
    </div>
  </body></html>`;
}

function corporateTemplate(b: TemplateBrief, imageDataUrl: string): string {
  const bullets = bulletsFromText(b.product_description);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseStyles(colourVars("--accent", "#0f172a", b.primary_colour), colourVars("--accent2", "#0ea5e9", b.secondary_colour))}
    .cols { flex: 1; display: flex; }
    .left { flex: 0 0 42%; background: var(--accent); color: #fff; padding: 6%; display: flex; flex-direction: column; justify-content: space-between; }
    .left h1 { font-size: 3.2vh; font-weight: 800; line-height: 1.25; }
    .left p { font-size: 1.8vh; opacity: 0.85; margin-top: 1.5vh; }
    .right { flex: 1; background-image: url('${imageDataUrl}'); background-size: cover; background-position: center; }
    .points { display: flex; flex-direction: column; gap: 1.2vh; margin-top: 3vh; }
    .point { font-size: 1.7vh; padding-left: 1.4em; position: relative; }
    .point::before { content: "✓"; position: absolute; left: 0; color: var(--accent2); font-weight: 800; }
  </style></head><body>
    <div class="page">
      <div class="cols">
        <div class="left">
          <div>
            <h1>${escapeHtml(b.brand_name)}</h1>
            ${b.key_message ? `<p>${escapeHtml(b.key_message)}</p>` : ""}
            <div class="points">${bullets.map(x => `<div class="point">${escapeHtml(x)}</div>`).join("")}</div>
          </div>
          <div style="font-size:1.5vh; opacity:0.75;">${escapeHtml(b.additional_notes || b.target_audience || "")}</div>
        </div>
        <div class="right"></div>
      </div>
      <div class="footer-strip">
        <span class="brand">${escapeHtml(b.industry.replace("-", " "))}</span>
        <span class="tag">${escapeHtml(b.location || "")}</span>
      </div>
    </div>
  </body></html>`;
}

export function renderBrochureHtml(brief: TemplateBrief, imageDataUrl: string): string {
  const family = FAMILY[brief.industry] || "hero";
  if (family === "grid") return gridTemplate(brief, imageDataUrl);
  if (family === "corporate") return corporateTemplate(brief, imageDataUrl);
  return heroTemplate(brief, imageDataUrl);
}
