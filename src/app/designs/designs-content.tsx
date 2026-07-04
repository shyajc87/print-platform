"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, ArrowLeft, Loader2, Sparkles, Download, X, ZoomIn, Maximize2 } from "lucide-react";

interface Design {
  id: string;
  image_url: string;
  pdf_url?: string;
  raw_image_url?: string;
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
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [lightbox, setLightbox] = useState<Design | null>(null);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!briefId) { router.push("/brief"); return; }
    loadOrGenerate();
  }, [briefId]);

  const loadOrGenerate = async () => {
    setChecking(true);
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("designs")
        .select("*")
        .eq("brief_id", briefId)
        .order("version_number", { ascending: true });

      if (fetchErr) throw fetchErr;

      if (existing && existing.length > 0) {
        // Designs already generated for this brief — show them, don't regenerate.
        setDesigns(existing);
        const approvedDesign = existing.find((d: Design) => d.status === "approved");
        if (approvedDesign) { setSelected(approvedDesign.id); setApproved(true); }
        setChecking(false);
        return;
      }

      setChecking(false);
      await generateDesigns();
    } catch (err) {
      console.error(err);
      setChecking(false);
      await generateDesigns();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox]);

  const generateDesigns = async () => {
    setGenerating(true); setError("");
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
    }
  };

  const approveDesign = async () => {
    if (!selected || !briefId) return;
    try {
      await supabase.from("designs").update({ status: "pending" }).eq("brief_id", briefId);
      await supabase.from("designs").update({ status: "approved" }).eq("id", selected);
      await supabase.from("briefs").update({ status: "approved" }).eq("id", briefId);
      setApproved(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save approval. Please try again.");
    }
  };

  const cleanPrompt = (p: string) => p.replace(/^\[[^\]]+\]\s*/, "");

  const navy = "#111827";
  const indigo = "#4f46e5";
  const green = "#10b981";

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        .designs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 900px) { .designs-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .designs-grid { grid-template-columns: 1fr; } }
        .design-card { transition: transform .15s, box-shadow .15s, border-color .15s; }
        .design-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(17,24,39,.12); }
        .design-card:hover .zoom-hint { opacity: 1; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes lbIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Header */}
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #000" }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: "#374151" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>AI Design Concepts</span>
        <span style={{ marginLeft: "auto", background: indigo, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>Step 2 of 3</span>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px" }}>

        {(generating || checking) && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: indigo, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(79,70,229,.4)" }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: navy, marginBottom: 8 }}>Generating your designs</h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>AI is creating 3 unique concepts tailored to the Indian market</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto" }}>
              {["Reading your brief...", "Writing design prompt...", "Generating concepts..."].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e7e5e0" }}>
                  <Loader2 size={16} color={indigo} style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 16, color: "#dc2626", marginBottom: 16 }}>{error}</div>
            <button onClick={generateDesigns} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 24px", cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
          </div>
        )}

        {!generating && !checking && !error && designs.length > 0 && !approved && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: navy, marginBottom: 6 }}>Choose your direction</h2>
              <p style={{ fontSize: 14, color: "#6b7280" }}>Tap any design to view it full-size. Click to select your favourite.</p>
            </div>

            <div className="designs-grid" style={{ marginBottom: 32 }}>
              {designs.map((design) => (
                <div key={design.id} className="design-card" style={{ borderRadius: 16, border: `2px solid ${selected === design.id ? indigo : "#e7e5e0"}`, overflow: "hidden", background: "#fff", boxShadow: selected === design.id ? "0 4px 20px rgba(79,70,229,.25)" : "0 1px 3px rgba(0,0,0,.06)" }}>
                  <div style={{ background: navy, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>Concept {design.version_number}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/editor?id=${briefId}&bg=${encodeURIComponent(design.raw_image_url || design.image_url)}`); }}
                      style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#7c3aed", padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Customize in editor
                    </button>
                    {selected === design.id && <span style={{ background: indigo, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>Selected</span>}
                  </div>

                  {/* Image — click to zoom */}
                  <div onClick={() => setLightbox(design)} style={{ position: "relative", aspectRatio: "10/16", background: "#f1f5f9", overflow: "hidden", cursor: "zoom-in" }}>
                    <img src={design.image_url} alt={`Design concept ${design.version_number}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div className="zoom-hint" style={{ position: "absolute", inset: 0, background: "rgba(17,24,39,.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}>
                      <div style={{ background: "rgba(255,255,255,.95)", borderRadius: 20, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: navy }}>
                        <ZoomIn size={14} /> View full size
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
                    <button onClick={() => setSelected(design.id)} style={{ flex: 1, background: selected === design.id ? indigo : "#f3f4f6", color: selected === design.id ? "#fff" : "#374151", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "9px", cursor: "pointer", fontFamily: "inherit" }}>
                      {selected === design.id ? "✓ Selected" : "Select this"}
                    </button>
                    <button onClick={() => setLightbox(design)} aria-label="Expand" style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "9px 11px", cursor: "pointer", color: "#374151" }}>
                      <Maximize2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: navy, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 24px rgba(0,0,0,.12)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{selected ? "Concept selected" : "Select a concept to continue"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected ? green : "#9ca3af", marginTop: 2 }}>{selected ? "✦ Ready to approve" : "Tap 'Select this' on any design"}</div>
              </div>
              <button onClick={approveDesign} disabled={!selected} style={{ background: selected ? green : "#374151", border: "none", borderRadius: 10, color: selected ? "#fff" : "#6b7280", fontSize: 14, fontWeight: 600, padding: "13px 24px", cursor: selected ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
                <CheckCircle size={16} /> Approve this design
              </button>
            </div>
          </>
        )}

        {approved && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 4px 20px rgba(16,185,129,.4)" }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: navy, marginBottom: 8 }}>Design approved!</h2>
            <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 32 }}>Your selected concept has been approved and sent to the print queue.</p>

            {(() => {
              const approvedDesign = designs.find(d => d.id === selected);
              if (!approvedDesign) return null;
              return (
                <div style={{ maxWidth: 320, margin: "0 auto 32px", borderRadius: 16, overflow: "hidden", border: "2px solid " + green, boxShadow: "0 4px 20px rgba(0,0,0,.1)", cursor: "zoom-in" }} onClick={() => setLightbox(approvedDesign)}>
                  <img src={approvedDesign.image_url} alt="Approved design" style={{ width: "100%", display: "block" }} />
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={designs.find(d => d.id === selected)?.pdf_url || designs.find(d => d.id === selected)?.image_url || "#"} download target="_blank" rel="noopener noreferrer" style={{ background: indigo, borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 24px", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={16} /> Download print-ready PDF
              </a>
              <button onClick={() => router.push(`/printers?id=${briefId}`)} style={{ background: green, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 24px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                Choose a printer
              </button>
              <button onClick={() => router.push("/dashboard")} style={{ background: "#fff", border: "1.5px solid #e7e5e0", borderRadius: 10, color: "#374151", fontSize: 14, fontWeight: 500, padding: "13px 24px", cursor: "pointer", fontFamily: "inherit" }}>
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "lbIn .2s ease" }}>
          <button onClick={() => setLightbox(null)} aria-label="Close" style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <img src={lightbox.image_url} alt={`Concept ${lightbox.version_number} full size`} style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>Concept {lightbox.version_number}</span>
              <button onClick={() => { setSelected(lightbox.id); setLightbox(null); }} style={{ background: selected === lightbox.id ? green : indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={14} /> {selected === lightbox.id ? "Selected" : "Select this design"}
              </button>
              <a href={lightbox.pdf_url || lightbox.image_url} download target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 18px", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Download size={14} /> Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
