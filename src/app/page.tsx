"use client";
import { useState } from "react";
import { Sparkles, FileText, Printer } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .hero-title { font-size: 30px !important; }
          .hero-btns { flex-direction: column !important; }
          .hero-btns button, .hero-btns a { width: 100% !important; justify-content: center !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .nav-inner { padding: 14px 20px !important; }
          .hero-inner { padding: 48px 20px 0 !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .feature-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .cta-primary { transition: transform 0.15s, box-shadow 0.15s; }
        .cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,165,233,0.45) !important; }
        .feature-card { transition: transform 0.15s, border-color 0.15s; }
        .feature-card:hover { transform: translateY(-2px); border-color: #cbd5e1 !important; }
      `}</style>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <nav className="nav-inner" style={{ background: "#1e293b", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Printer size={17} color="#0ea5e9" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#f1f5f9" }}>Print<span style={{ color: "#0ea5e9" }}>AI</span></span>
        </div>
        <button onClick={() => setAuthOpen(true)} style={{ background: "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(14,165,233,0.35)" }}>
          Sign in
        </button>
      </nav>

      <div className="hero-inner" style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px 0", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, letterSpacing: "0.5px", marginBottom: 24, border: "1px solid #bae6fd" }}>
          AI-POWERED WEB-TO-PRINT
        </div>

        <h1 className="hero-title" style={{ fontSize: 46, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 18 }}>
          From brief to<br /><span style={{ color: "#0ea5e9" }}>print-ready</span> in minutes
        </h1>

        <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 36px" }}>
          AI generates professional brochure designs instantly. Share with clients, collect feedback, and send to print.
        </p>

        <div className="hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 72, flexWrap: "wrap" }}>
          <button className="cta-primary" onClick={() => setAuthOpen(true)} style={{ background: "#0ea5e9", color: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 28px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(14,165,233,0.4)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} /> Start a project
          </button>
          <a href="#how-it-works" style={{ background: "#fff", color: "#475569", fontSize: 15, fontWeight: 500, padding: "14px 28px", borderRadius: 10, textDecoration: "none", border: "1.5px solid #e2e8f0", display: "inline-flex", alignItems: "center" }}>
            See how it works
          </a>
        </div>

        <div id="how-it-works" className="feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 60 }}>
          {[
            { Icon: FileText, title: "Submit a brief", desc: "Describe your brand and requirements in plain English", color: "#0ea5e9", shadow: "rgba(14,165,233,0.3)", step: "01" },
            { Icon: Sparkles, title: "AI generates designs", desc: "Get 3 professional concepts in under 2 minutes", color: "#8b5cf6", shadow: "rgba(139,92,246,0.3)", step: "02" },
            { Icon: Printer, title: "Approve and print", desc: "Review, annotate, and approve your print-ready PDF", color: "#10b981", shadow: "rgba(16,185,129,0.3)", step: "03" },
          ].map(({ Icon, title, desc, color, shadow, step }) => (
            <div className="feature-card" key={title} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", textAlign: "left", cursor: "default" }}>
              <div style={{ background: "#1e293b", padding: "16px 18px", borderBottom: "1px solid #0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${shadow}` }}>
                  <Icon size={17} color="#fff" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.5px" }}>{step}</span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 5 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "20px 40px", textAlign: "center", background: "#fff" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>PrintAI © 2026</span>
      </footer>
    </div>
  );
}
