"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, Loader2, Sparkles, Download } from "lucide-react";

interface Design {
  id: string;
  image_url: string;
  version_number: number;
  status: string;
  ai_prompt: string;
}

export default function DesignsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get("id");

  const [designs, setDesigns] = useState<Design[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!briefId) {
      router.push("/brief");
      return;
    }
    generateDesigns();
  }, [briefId]);

  const generateDesigns = async () => {
    setGenerating(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setDesigns(data.designs);
    } catch (err) {
      console.error(err);
      setError("Failed to generate designs. Please try again.");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setApproved(true);
  };

  const navy = "#1e293b";
  const skyBlue = "#0ea5e9";
  const green = "#10b981";

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>

      <div style={{ background: navy, padding: "16px 36px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #0f172a" }}>
        <button onClick={() => router.push("/brief")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Back to brief
        </button>
        <div style={{ width: 1, height: 16, background: "#334155" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>AI Design Concepts</span>
        <span style={{ marginLeft: "auto", background: skyBlue, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
          Step 2 of 3
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {generating && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: skyBlue, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(14,165,233,0.4)" }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Generating your designs</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>AI is creating 3 unique brochure concepts based on your brief</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto" }}>
              {["Reading your brief...", "Writing design prompt...", "Generating 3 concepts..."].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <Loader2 size={16} color={skyBlue} style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#475569" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 16, color: "#dc2626", marginBottom: 16 }}>{error}</div>
            <button onClick={generateDesigns} style={{ background: skyBlue, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 24px", cursor: "pointer", fontFamily: "inherit" }}>
              Try again
            </button>
          </div>
        )}

        {!generating && !error && designs.length > 0 && !approved && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Choose your direction</h2>
              <p style={{ fontSize: 14, color: "#64748b" }}>3 unique AI-generated concepts based on your brief. Click one to select it.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
              {designs.map((design) => (
                <div
                  key={design.id}
                  onClick={() => setSelected(design.id)}
                  style={{ borderRadius: 16, border: `2px solid ${selected === design.id ? skyBlue : "#e2e8f0"}`, overflow: "hidden", cursor: "pointer", background: "#fff", boxShadow: selected === design.id ? "0 4px 20px rgba(14,165,233,0.25)" : "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
                >
                  <div style={{ background: navy, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Concept {design.version_number}</span>
                    {selected === design.id && (
                      <span style={{ background: skyBlue, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>Selected</span>
                    )}
                  </div>
                  <div style={{ aspectRatio: "10/16", background: "#f1f5f9", overflow: "hidden" }}>
                    <img
                      src={design.image_url}
                      alt={`Design concept ${design.version_number}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                      {design.ai_prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: navy, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{selected ? "Concept selected" : "Select a concept to continue"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected ? green : "#475569", marginTop: 2 }}>
                  {selected ? "✦ Ready to approve and send to print" : "Click a design above to select it"}
                </div>
              </div>
              <button
                onClick={handleApprove}
                disabled={!selected}
                style={{ background: selected ? green : "#334155", border: "none", borderRadius: 10, color: selected ? "#fff" : "#64748b", fontSize: 14, fontWeight: 600, padding: "13px 24px", cursor: selected ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", boxShadow: selected ? "0 2px 8px rgba(16,185,129,0.4)" : "none" }}
              >
                <CheckCircle size={16} />
                Approve this design
              </button>
            </div>
          </>
        )}

        {approved && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Design approved!</h2>
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 40 }}>Your selected concept has been approved and sent to the print queue.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={{ background: skyBlue, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", boxShadow: "0 2px 8px rgba(14,165,233,0.4)" }}>
                <Download size={16} /> Download PDF
              </button>
              <button onClick={() => router.push("/brief")} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, color: "#475569", fontSize: 14, fontWeight: 500, padding: "13px 24px", cursor: "pointer", fontFamily: "inherit" }}>
                Start new project
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
