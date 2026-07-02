import Link from "next/link";
import { FileText, Sparkles, Printer } from "lucide-react";

export default function Home() {
  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>

      <nav style={{ background: "#1e293b", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #0f172a" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
          Print<span style={{ color: "#0ea5e9" }}>AI</span>
        </span>
        <Link href="/auth" style={{ background: "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, textDecoration: "none", boxShadow: "0 2px 8px rgba(14,165,233,0.35)" }}>
          Start a project
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 0", textAlign: "center" }}>

        <div style={{ display: "inline-block", background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, letterSpacing: "0.5px", marginBottom: 28 }}>
          AI-POWERED WEB-TO-PRINT
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 20 }}>
          From brief to<br />
          <span style={{ color: "#0ea5e9" }}>print-ready</span> in minutes
        </h1>

        <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
          AI generates professional brochure designs instantly. Share with clients, collect feedback, and send to print — all in one place.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 80 }}>
          <Link href="/auth" style={{ background: "#0ea5e9", color: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 28px", borderRadius: 10, textDecoration: "none", boxShadow: "0 2px 12px rgba(14,165,233,0.4)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} /> Start a new project
          </Link>
          <a href="#how-it-works" style={{ background: "#fff", color: "#475569", fontSize: 15, fontWeight: 500, padding: "14px 28px", borderRadius: 10, textDecoration: "none", border: "1.5px solid #e2e8f0", display: "inline-flex", alignItems: "center" }}>
            See how it works
          </a>
        </div>

        <div id="how-it-works" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 60 }}>
          {[
            {
              Icon: FileText,
              title: "Submit a brief",
              desc: "Describe your brand and requirements in plain English",
              color: "#0ea5e9",
              shadow: "rgba(14,165,233,0.3)"
            },
            {
              Icon: Sparkles,
              title: "AI generates designs",
              desc: "Get 3 professional concepts in under 2 minutes",
              color: "#8b5cf6",
              shadow: "rgba(139,92,246,0.3)"
            },
            {
              Icon: Printer,
              title: "Approve and print",
              desc: "Client reviews, annotates, and approves print-ready PDF",
              color: "#10b981",
              shadow: "rgba(16,185,129,0.3)"
            },
          ].map(({ Icon, title, desc, color, shadow }) => (
            <div key={title} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", textAlign: "left" }}>
              <div style={{ background: "#1e293b", padding: "18px 20px", borderBottom: "1px solid #0f172a" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${shadow}` }}>
                  <Icon size={18} color="#fff" />
                </div>
              </div>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "24px 40px", textAlign: "center" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>PrintAI © 2026</span>
      </footer>

    </div>
  );
}
