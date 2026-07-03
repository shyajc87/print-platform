"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import {
  Printer, Search, ShoppingCart, Sparkles, FileText, LayoutGrid, Package,
  Shirt, Gift, PenTool, Award, Truck, ShieldCheck, Receipt, Building2,
  Soup, Rocket, ShoppingBag, GraduationCap, Pill, PartyPopper, Store,
  IdCard, Bookmark, Tag, ArrowRight, CheckCircle2
} from "lucide-react";

const C = {
  paper: "#faf9f7",
  ink: "#111827",
  indigo: "#4f46e5",
  indigoDark: "#4338ca",
  indigoLight: "#eef2ff",
  indigoBorder: "#c7d2fe",
  amber: "#f59e0b",
  text: "#111827",
  textSub: "#6b7280",
  textMute: "#9ca3af",
  border: "#e7e5e0",
  card: "#ffffff",
};

const CATEGORIES = [
  { Icon: Sparkles, label: "AI Designs", active: true },
  { Icon: IdCard, label: "Visiting Cards" },
  { Icon: FileText, label: "Brochures" },
  { Icon: LayoutGrid, label: "Hoardings" },
  { Icon: Package, label: "Packaging" },
  { Icon: Shirt, label: "Apparel" },
  { Icon: Gift, label: "Corporate Gifts" },
  { Icon: PenTool, label: "Stationery" },
  { Icon: Award, label: "Certificates" },
  { Icon: Truck, label: "Same Day" },
];

const POPULAR = [
  { Icon: FileText, label: "Brochures" },
  { Icon: LayoutGrid, label: "Hoardings" },
  { Icon: IdCard, label: "Visiting Cards" },
  { Icon: Package, label: "Packaging" },
  { Icon: Shirt, label: "T-Shirts" },
  { Icon: PenTool, label: "Stationery" },
  { Icon: Bookmark, label: "Standees" },
  { Icon: Award, label: "Certificates" },
  { Icon: Gift, label: "Corp Gifts" },
  { Icon: Tag, label: "Labels" },
];

const BUSINESS = [
  { Icon: Building2, label: "Real Estate" },
  { Icon: Soup, label: "Restaurants & Cafes" },
  { Icon: Rocket, label: "Startups" },
  { Icon: ShoppingBag, label: "Retail & Fashion" },
  { Icon: GraduationCap, label: "Education" },
  { Icon: Pill, label: "Healthcare" },
  { Icon: PartyPopper, label: "Events & Weddings" },
  { Icon: Store, label: "E-commerce" },
];

/* 3D carousel industries — 8 faces of the rotating cylinder */
const CAROUSEL = [
  { Icon: Building2, label: "Real Estate", color: "#4f46e5", bg: "#eef2ff" },
  { Icon: Soup, label: "Food & Beverage", color: "#ea580c", bg: "#fff7ed" },
  { Icon: ShoppingBag, label: "Retail & Fashion", color: "#db2777", bg: "#fdf2f8" },
  { Icon: GraduationCap, label: "Education", color: "#0891b2", bg: "#ecfeff" },
  { Icon: Pill, label: "Healthcare", color: "#059669", bg: "#ecfdf5" },
  { Icon: Rocket, label: "Startups", color: "#7c3aed", bg: "#f5f3ff" },
  { Icon: PartyPopper, label: "Events", color: "#e11d48", bg: "#fff1f2" },
  { Icon: Store, label: "E-commerce", color: "#b45309", bg: "#fffbeb" },
];

const TRUST = [
  { Icon: Truck, title: "Same-day delivery", sub: "Chennai, Bangalore, Hyderabad" },
  { Icon: Sparkles, title: "AI-generated designs", sub: "3 concepts in under 2 minutes" },
  { Icon: ShieldCheck, title: "Print-ready output", sub: "300 DPI, CMYK, bleed included" },
  { Icon: Receipt, title: "GST invoices", sub: "Automatic on every order" },
];

export default function Home() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const startProject = () => setAuthOpen(true);

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-nav { scrollbar-width: none; }
        .cat-tab:hover { color: ${C.indigo} !important; }
        .cat-card, .biz-card { transition: border-color .15s, transform .15s, box-shadow .15s; }
        .cat-card:hover, .biz-card:hover { border-color: ${C.indigoBorder} !important; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(79,70,229,.08); }
        .cta-btn { transition: background .15s, transform .1s; }
        .cta-btn:hover { background: ${C.indigoDark} !important; }
        .cta-btn:active { transform: scale(.98); }

        /* ── 3D rotating industry carousel ── */
        .stage3d {
          width: 200px; height: 240px;
          perspective: 900px;
          flex-shrink: 0;
          margin-right: 70px;
        }
        .ring3d {
          width: 100%; height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: spin3d 24s linear infinite;
        }
        .stage3d:hover .ring3d { animation-play-state: paused; }
        .face3d {
          position: absolute;
          top: 50%; left: 50%;
          width: 112px; height: 150px;
          margin: -75px 0 0 -56px;
          background: #fff;
          border: 1px solid ${C.border};
          border-radius: 14px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px;
          backface-visibility: hidden;
          box-shadow: 0 8px 24px rgba(17,24,39,.08);
        }
        .face-icon {
          width: 46px; height: 46px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .face-label { font-size: 11px; font-weight: 600; color: ${C.ink}; text-align: center; padding: 0 10px; }
        .face-badge {
          position: absolute; top: 9px; right: 9px;
          background: ${C.indigo}; color: #fff;
          font-size: 8px; font-weight: 700;
          padding: 2px 6px; border-radius: 4px;
          letter-spacing: .3px;
        }
        @keyframes spin3d {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ring3d { animation: none; }
        }

        @media (max-width: 860px) {
          .ai-hero { flex-direction: column !important; gap: 28px !important; }
          .trust-row { display: grid !important; grid-template-columns: 1fr 1fr !important; }
          .trust-item { border-right: none !important; border-bottom: 1px solid ${C.border}; }
          .nav-links { display: none !important; }
          .search-wrap { max-width: none !important; }
        }
        @media (max-width: 560px) {
          .hero-h1 { font-size: 24px !important; }
          .ai-input-row { flex-direction: column !important; }
          .ai-input-row button { width: 100% !important; justify-content: center !important; }
          .trust-row { grid-template-columns: 1fr !important; }
          .navbar { flex-wrap: wrap !important; }
          .search-wrap { order: 3; flex-basis: 100% !important; margin-top: 10px; }
          .stage3d { width: 150px; height: 190px; margin: 0 auto !important; }
          .face3d { width: 96px; height: 128px; margin: -64px 0 0 -48px; }
          .ring3d .face3d { transform-origin: center; }
        }
      `}</style>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <div style={{ background: C.ink, color: "#e5e7eb", textAlign: "center", fontSize: 12, fontWeight: 500, padding: "8px 16px" }}>
        <Sparkles size={12} style={{ display: "inline", verticalAlign: -2, color: C.amber }} />{" "}
        AI generates print-ready designs in 2 minutes · Same-day delivery in Chennai, Bangalore & Hyderabad
      </div>

      <nav className="navbar" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Printer size={16} color={C.amber} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: "-0.3px" }}>
            Print<span style={{ color: C.indigo }}>AI</span>
          </span>
        </div>

        <div className="search-wrap" style={{ flex: 1, maxWidth: 460, position: "relative" }}>
          <input type="text" placeholder="Search brochures, hoardings, visiting cards..." style={{ width: "100%", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, padding: "9px 38px 9px 14px", fontFamily: "inherit", outline: "none" }} />
          <Search size={16} color={C.textMute} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
          <span className="nav-links" style={{ fontSize: 13, color: C.textSub, cursor: "pointer" }}>Track order</span>
          <button aria-label="Cart" style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: C.textSub, padding: 4 }}>
            <ShoppingCart size={19} />
          </button>
          <button className="cta-btn" onClick={startProject} style={{ background: C.indigo, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, padding: "8px 18px", cursor: "pointer", fontFamily: "inherit" }}>
            Sign in
          </button>
        </div>
      </nav>

      <div className="cat-nav" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", overflowX: "auto" }}>
        {CATEGORIES.map(({ Icon, label, active }) => (
          <div key={label} className="cat-tab" style={{ padding: "11px 14px", fontSize: 13, color: active ? C.indigo : C.textSub, whiteSpace: "nowrap", cursor: "pointer", borderBottom: `2px solid ${active ? C.indigo : "transparent"}`, display: "flex", alignItems: "center", gap: 6, fontWeight: active ? 600 : 400, transition: "color .15s" }}>
            <Icon size={15} />
            {label}
          </div>
        ))}
      </div>

      {/* AI Hero with 3D carousel */}
      <div className="ai-hero" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "36px 24px", display: "flex", alignItems: "center", gap: 40, maxWidth: 1100, margin: "0 auto", overflow: "hidden" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.indigoLight, color: C.indigo, border: `1px solid ${C.indigoBorder}`, fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, marginBottom: 14 }}>
            <Sparkles size={12} /> NEW · AI-POWERED DESIGN
          </div>
          <h1 className="hero-h1" style={{ fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1.2, marginBottom: 10, letterSpacing: "-0.5px" }}>
            Describe your brand.<br />We design it in 2 minutes.
          </h1>
          <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>
            Tell us what you need in plain English — our AI generates 3 print-ready concepts instantly. Works for every industry.
          </p>
          <div className="ai-input-row" style={{ display: "flex", gap: 10, maxWidth: 540 }}>
            <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && startProject()} placeholder="e.g. Luxury real estate brochure for Green Valley, Chennai..." style={{ flex: 1, background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, padding: "12px 14px", fontFamily: "inherit", outline: "none" }} />
            <button className="cta-btn" onClick={startProject} style={{ background: C.indigo, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, padding: "12px 20px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 10px rgba(79,70,229,.3)" }}>
              <Sparkles size={15} /> Generate designs
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 14 }}>
            {["Print-ready PDF output", "3 concepts in 2 min", "No design skills needed"].map(t => (
              <span key={t} style={{ fontSize: 12, color: C.textMute, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={13} color="#10b981" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* 3D rotating industry carousel */}
        <div className="stage3d" aria-label="Industries we support">
          <div className="ring3d">
            {CAROUSEL.map(({ Icon, label, color, bg }, i) => (
              <div
                key={label}
                className="face3d"
                style={{ transform: `rotateY(${i * 45}deg) translateZ(150px)` }}
              >
                <div className="face-badge">AI</div>
                <div className="face-icon" style={{ background: bg }}>
                  <Icon size={24} color={color} />
                </div>
                <span className="face-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="trust-row" style={{ display: "flex", background: C.card, borderBottom: `1px solid ${C.border}`, maxWidth: 1100, margin: "0 auto" }}>
        {TRUST.map(({ Icon, title, sub }, i) => (
          <div key={title} className="trust-item" style={{ flex: 1, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderRight: i < TRUST.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <Icon size={21} color={C.indigo} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{title}</div>
              <div style={{ fontSize: 11.5, color: C.textMute, marginTop: 1 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Popular categories</h2>
          <span style={{ fontSize: 12, color: C.indigo, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>View all <ArrowRight size={12} /></span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
          {POPULAR.map(({ Icon, label }) => (
            <div key={label} className="cat-card" onClick={startProject} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 10px", textAlign: "center", cursor: "pointer" }}>
              <Icon size={23} color={C.indigo} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.3, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Shop by business type</h2>
          <span style={{ fontSize: 12, color: C.indigo, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>View all <ArrowRight size={12} /></span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {BUSINESS.map(({ Icon, label }) => (
            <div key={label} className="biz-card" onClick={startProject} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon size={19} color={C.textMute} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.4 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: C.ink, padding: "32px 24px", marginTop: 20 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Printer size={14} color={C.amber} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb" }}>Print<span style={{ color: "#818cf8" }}>AI</span></span>
          </div>
          <span style={{ fontSize: 12, color: "#6b7280" }}>© 2026 PrintAI · AI-powered web-to-print · Chennai, India</span>
        </div>
      </footer>
    </div>
  );
}
