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
  logo_url?: string | null;
  contact_phone?: string | null;
  badges?: string | null;
  price1_amount?: string | null;
  price1_label?: string | null;
  price2_amount?: string | null;
  price2_label?: string | null;
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

function badgesFromText(text?: string | null): string[] {
  return (text || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);
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
  const badges = badgesFromText(b.badges);
  const hasPrice1 = !!(b.price1_amount || b.price1_label);
  const hasPrice2 = !!(b.price2_amount || b.price2_label);
  const locationParts = (b.location || "").split(",").map(s => s.trim()).filter(Boolean);
  const locationSmall = locationParts.length > 1 ? locationParts[0] : "";
  const locationBig = locationParts.length > 1 ? locationParts.slice(1).join(", ") : locationParts[0] || "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseStyles(colourVars("--accent", "#1e293b", b.primary_colour), colourVars("--accent2", "#0ea5e9", b.secondary_colour))}
    .hero { position: absolute; inset: 0; background-image: url('${imageDataUrl}'); background-size: cover; background-position: center; }
    .top-scrim { position: absolute; top: 0; left: 0; right: 0; height: 22%; background: linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0)); }
    .location { position: absolute; top: 4%; left: 6%; color: #fff; }
    .location .small { font-size: 1.7vh; font-weight: 600; letter-spacing: 1px; opacity: 0.9; }
    .location .big { font-size: 3.6vh; font-weight: 800; letter-spacing: 0.5px; margin-top: 0.3vh; }
    .badges { position: absolute; left: 4%; top: 30%; display: flex; flex-direction: column; gap: 1vh; }
    .badge { background: rgba(15,23,42,0.82); color: #fff; font-size: 1.3vh; font-weight: 700; padding: 0.9vh 1.2vh; border-radius: 0.6vh; text-align: center; letter-spacing: 0.3px; max-width: 9vh; }
    .bottom-scrim { position: absolute; left: 0; right: 0; bottom: 9vh; height: 40%; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0)); }
    .prices { position: absolute; left: 6%; right: 6%; bottom: 11vh; display: flex; gap: 3%; }
    .price-box { flex: 1; background: rgba(15,23,42,0.72); border: 1px solid rgba(255,255,255,0.25); border-radius: 0.8vh; padding: 1.4vh 1vh; text-align: center; }
    .price-box .amount { font-size: 2.8vh; font-weight: 800; color: var(--accent2); }
    .price-box .label { font-size: 1.3vh; color: #f1f5f9; margin-top: 0.4vh; text-transform: uppercase; letter-spacing: 0.4px; }
    .tagline { position: absolute; left: 6%; right: 6%; bottom: ${hasPrice1 || hasPrice2 ? "20vh" : "11vh"}; color: #fff; font-size: 1.9vh; font-weight: 600; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }
    .brandbar { position: absolute; left: 0; right: 0; bottom: 0; height: 9vh; background: var(--accent); display: flex; align-items: center; padding: 0 4%; gap: 3%; }
    .brandbar img { height: 6vh; width: 6vh; object-fit: contain; background: #fff; border-radius: 0.6vh; padding: 0.4vh; }
    .brandbar .name { color: #fff; font-size: 2.2vh; font-weight: 800; flex: 1; }
    .brandbar .phone { color: #fff; font-size: 2vh; font-weight: 700; white-space: nowrap; }
  </style></head><body>
    <div class="page">
      <div class="hero"></div>
      <div class="top-scrim"></div>
      ${locationBig ? `<div class="location">
        ${locationSmall ? `<div class="small">${escapeHtml(locationSmall)}</div>` : ""}
        <div class="big">${escapeHtml(locationBig)}</div>
      </div>` : ""}
      ${badges.length ? `<div class="badges">${badges.map(x => `<div class="badge">${escapeHtml(x)}</div>`).join("")}</div>` : ""}
      <div class="bottom-scrim"></div>
      ${b.key_message ? `<div class="tagline">${escapeHtml(b.key_message)}</div>` : ""}
      ${(hasPrice1 || hasPrice2) ? `<div class="prices">
        ${hasPrice1 ? `<div class="price-box"><div class="amount">${escapeHtml(b.price1_amount)}</div><div class="label">${escapeHtml(b.price1_label)}</div></div>` : ""}
        ${hasPrice2 ? `<div class="price-box"><div class="amount">${escapeHtml(b.price2_amount)}</div><div class="label">${escapeHtml(b.price2_label)}</div></div>` : ""}
      </div>` : ""}
      <div class="brandbar">
        ${b.logo_url ? `<img src="${b.logo_url}" alt="logo" />` : ""}
        <div class="name">${escapeHtml(b.brand_name)}</div>
        ${b.contact_phone ? `<div class="phone">${escapeHtml(b.contact_phone)}</div>` : ""}
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
    .footer-strip img { height: 3vh; width: 3vh; object-fit: contain; background: #fff; border-radius: 0.4vh; margin-right: 1vh; }
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
        <span class="brand" style="display:flex;align-items:center;">${b.logo_url ? `<img src="${b.logo_url}" alt="logo" />` : ""}${escapeHtml(b.brand_name)}</span>
        <span class="tag">${escapeHtml(b.contact_phone || b.additional_notes || b.target_audience || "")}</span>
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
        <span class="tag">${escapeHtml(b.location || "")}${b.contact_phone ? ` · ${escapeHtml(b.contact_phone)}` : ""}</span>
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
