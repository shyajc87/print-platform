"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2, Building2, Soup, Pill, GraduationCap, Shirt, Coins, Cpu, MoreHorizontal, Palette, Printer } from "lucide-react";

const INDUSTRIES = [
  { value: "real-estate", label: "Real Estate", Icon: Building2 },
  { value: "food-beverage", label: "Food & Bev", Icon: Soup },
  { value: "healthcare", label: "Healthcare", Icon: Pill },
  { value: "education", label: "Education", Icon: GraduationCap },
  { value: "retail", label: "Retail", Icon: Shirt },
  { value: "finance", label: "Finance", Icon: Coins },
  { value: "technology", label: "Technology", Icon: Cpu },
  { value: "other", label: "Other", Icon: MoreHorizontal },
];

const MOODS = [
  { value: "premium", label: "Premium", desc: "Luxury, refined, aspirational" },
  { value: "modern", label: "Modern", desc: "Clean lines, minimal whitespace" },
  { value: "bold", label: "Bold", desc: "Vibrant, high contrast, energetic" },
  { value: "warm", label: "Warm", desc: "Friendly, approachable, human" },
  { value: "corporate", label: "Corporate", desc: "Trustworthy, structured, formal" },
  { value: "natural", label: "Natural", desc: "Earthy, organic, sustainable" },
];

const SIZES = [
  { value: "a4-bifold", label: "A4 Bifold", dim: "210 × 297 mm", popular: true },
  { value: "a4-trifold", label: "A4 Trifold", dim: "210 × 297 mm" },
  { value: "a5-single", label: "A5 Single", dim: "148 × 210 mm" },
  { value: "dl-bifold", label: "DL Bifold", dim: "99 × 210 mm" },
  { value: "square-210", label: "Square", dim: "210 × 210 mm" },
  { value: "custom", label: "Other size", dim: "Custom" },
];

export default function BriefPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brandName: "", industry: "real-estate", productDescription: "",
    targetAudience: "", keyMessage: "", mood: "premium",
    primaryColour: "", secondaryColour: "", size: "a4-bifold",
    quantity: "", deadline: "", additionalNotes: "",
  });

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const canSubmit = form.brandName && form.productDescription;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/designs?id=${data.brief.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const navy = "#1e293b";
  const navyBorder = "#0f172a";
  const skyBlue = "#0ea5e9";
  const purple = "#8b5cf6";
  const green = "#10b981";

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
    overflow: "hidden", marginBottom: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  };

  const cardHeaderStyle = (accent: string): React.CSSProperties => ({
    background: navy, padding: "18px 24px", display: "flex",
    alignItems: "center", gap: 12, borderBottom: `1px solid ${navyBorder}`,
  });

  const iconBadge = (color: string, shadow: string): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 10, background: color,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 2px 8px ${shadow}`,
  });

  const inputStyle: React.CSSProperties = {
    background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10,
    color: "#0f172a", fontSize: 14, fontFamily: "inherit",
    padding: "11px 14px", outline: "none", width: "100%",
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#64748b",
    letterSpacing: "0.8px", textTransform: "uppercase" as const,
  };

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", paddingBottom: 80, fontFamily: "Inter, system-ui, sans-serif" }}>

      <div style={{ background: navy, padding: "16px 36px", display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${navyBorder}` }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ width: 1, height: 16, background: "#334155" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>New Brochure Brief</span>
        <span style={{ marginLeft: "auto", background: skyBlue, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>AI-Powered</span>
      </div>

      <div style={{ background: navy, padding: "0 36px", display: "flex", gap: 0, borderBottom: `1px solid ${navyBorder}` }}>
        {[{ n: 1, label: "Brand details", state: "done" }, { n: 2, label: "Design direction", state: "active" }, { n: 3, label: "Print specs", state: "pending" }].map((s) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: s.state === "active" ? `2px solid ${skyBlue}` : "2px solid transparent", color: s.state === "active" ? "#f1f5f9" : s.state === "done" ? green : "#64748b", fontSize: 13, fontWeight: 500 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: s.state === "active" ? skyBlue : s.state === "done" ? green : "#334155", color: "#fff" }}>
              {s.state === "done" ? "✓" : s.n}
            </div>
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px 0" }}>

        <div style={cardStyle}>
          <div style={cardHeaderStyle(skyBlue)}>
            <div style={iconBadge(skyBlue, "rgba(14,165,233,0.4)")}><Building2 size={18} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>Brand information</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Tell us about the brand this brochure is for</div>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>Brand / company name</label>
              <input style={{ ...inputStyle, marginTop: 6 }} type="text" placeholder="Green Valley Properties" value={form.brandName} onChange={e => set("brandName", e.target.value)} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>Industry</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 8 }}>
                {INDUSTRIES.map(({ value, label, Icon }) => (
                  <button key={value} onClick={() => set("industry", value)} style={{ border: `1.5px solid ${form.industry === value ? skyBlue : "#e2e8f0"}`, borderRadius: 10, padding: "11px 8px", cursor: "pointer", background: form.industry === value ? "#e0f2fe" : "#f8fafc", fontSize: 12, fontWeight: 500, color: form.industry === value ? "#0369a1" : "#475569", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, fontFamily: "inherit", boxShadow: form.industry === value ? "0 2px 8px rgba(14,165,233,0.15)" : "none" }}>
                    <Icon size={20} color={form.industry === value ? skyBlue : "#94a3b8"} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>What are you promoting?</label>
              <textarea style={{ ...inputStyle, marginTop: 6, minHeight: 88, resize: "none" as const, lineHeight: 1.6 }} placeholder="New residential plotted development in Tambaram, Chennai. DTCP approved, gated community, plots from 600 to 1200 sqft starting at Rs 18 lakhs." value={form.productDescription} onChange={e => set("productDescription", e.target.value)} />
              <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right" as const, marginTop: 4 }}>{form.productDescription.length} / 500</div>
            </div>
            <div>
              <label style={fieldLabel}>Target audience</label>
              <input style={{ ...inputStyle, marginTop: 6 }} type="text" placeholder="Middle-income families looking for first home in Chennai suburbs" value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle(purple)}>
            <div style={iconBadge(purple, "rgba(139,92,246,0.4)")}><Palette size={18} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>Design direction</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pick a mood — AI crafts the visual language around it</div>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Key message or tagline</label>
              <input style={{ ...inputStyle, marginTop: 6 }} type="text" placeholder="Your Dream Home Awaits — DTCP Approved Plots in Tambaram" value={form.keyMessage} onChange={e => set("keyMessage", e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Mood and style</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 8 }}>
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => set("mood", m.value)} style={{ border: `1.5px solid ${form.mood === m.value ? skyBlue : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", background: form.mood === m.value ? "#e0f2fe" : "#f8fafc", textAlign: "left" as const, fontFamily: "inherit", boxShadow: form.mood === m.value ? "0 2px 10px rgba(14,165,233,0.18)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: form.mood === m.value ? skyBlue : "#cbd5e1" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: form.mood === m.value ? "#0369a1" : "#1e293b" }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 16 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Brand colours</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
                <input style={inputStyle} type="text" placeholder="Primary — e.g. Deep Blue, Navy" value={form.primaryColour} onChange={e => set("primaryColour", e.target.value)} />
                <input style={inputStyle} type="text" placeholder="Secondary — e.g. Gold, White" value={form.secondaryColour} onChange={e => set("secondaryColour", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle(green)}>
            <div style={iconBadge(green, "rgba(16,185,129,0.4)")}><Printer size={18} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>Print specifications</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Canvas size and production quantity</div>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>Brochure format</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 8 }}>
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => set("size", s.value)} style={{ border: `1.5px solid ${form.size === s.value ? skyBlue : "#e2e8f0"}`, borderRadius: 12, padding: "14px 12px", cursor: "pointer", background: form.size === s.value ? "#e0f2fe" : "#f8fafc", textAlign: "center" as const, fontFamily: "inherit", boxShadow: form.size === s.value ? "0 2px 10px rgba(14,165,233,0.18)" : "none" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{s.dim}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.size === s.value ? "#0369a1" : "#1e293b" }}>{s.label}</div>
                    {s.popular && <div style={{ display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 600, padding: "2px 8px", background: skyBlue, color: "#fff", borderRadius: 20 }}>Most popular</div>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={fieldLabel}>Print quantity</label>
                <select style={{ ...inputStyle, marginTop: 6, cursor: "pointer" }} value={form.quantity} onChange={e => set("quantity", e.target.value)}>
                  <option value="">Select quantity</option>
                  {["250 copies","500 copies","1,000 copies","2,500 copies","5,000 copies","10,000+ copies"].map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Deadline</label>
                <input style={{ ...inputStyle, marginTop: 6 }} type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Additional notes</label>
              <textarea style={{ ...inputStyle, marginTop: 6, minHeight: 72, resize: "none" as const }} placeholder="Address, phone, website, or any specific content to include..." value={form.additionalNotes} onChange={e => set("additionalNotes", e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ background: navy, borderRadius: 16, border: `1px solid ${navyBorder}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>All sections complete</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: green, marginTop: 2 }}>✦ Ready to generate 3 AI concepts</div>
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ background: canSubmit ? skyBlue : "#334155", border: "none", borderRadius: 10, color: canSubmit ? "#fff" : "#64748b", fontSize: 14, fontWeight: 600, padding: "13px 24px", cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", boxShadow: canSubmit ? "0 2px 8px rgba(14,165,233,0.4)" : "none" }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : <><Sparkles size={16} /> Generate AI designs</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
