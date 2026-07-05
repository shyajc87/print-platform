"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Sparkles, Loader2, Building2, Soup, Pill, GraduationCap, Shirt, Coins, Cpu, MoreHorizontal, Palette, Printer, Upload, X } from "lucide-react";

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
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [refImage, setRefImage] = useState<File | null>(null);
  const [refImagePreview, setRefImagePreview] = useState<string>("");
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [form, setForm] = useState({
    brandName: "", industry: "real-estate", productDescription: "",
    targetAudience: "", location: "", keyMessage: "", mood: "premium",
    primaryColour: "", secondaryColour: "", size: "a4-bifold",
    quantity: "", deadline: "", additionalNotes: "",
    contactPhone: "", badges: "", price1Amount: "", price1Label: "",
    price2Amount: "", price2Label: "",
  });

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const canSubmit = form.brandName && form.productDescription && form.quantity;

  const onPickImage = (file: File | null) => {
    setRefImage(file);
    if (file) setRefImagePreview(URL.createObjectURL(file));
    else setRefImagePreview("");
  };

  const onPickLogo = (file: File | null) => {
    setLogoImage(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
    else setLogoPreview("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let referenceImageUrl = "";
      if (refImage) {
        const { data: { user } } = await supabase.auth.getUser();
        const ext = refImage.name.split(".").pop() || "jpg";
        const path = `${user?.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("references").upload(path, refImage, { upsert: true });
        if (upErr) throw new Error(`Reference image upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("references").getPublicUrl(path);
        referenceImageUrl = pub.publicUrl;
      }

      let logoUrl = "";
      if (logoImage) {
        const { data: { user } } = await supabase.auth.getUser();
        const ext = logoImage.name.split(".").pop() || "png";
        const path = `${user?.id}/${Date.now()}-logo.${ext}`;
        const { error: upErr } = await supabase.storage.from("logos").upload(path, logoImage, { upsert: true });
        if (upErr) throw new Error(`Logo upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("logos").getPublicUrl(path);
        logoUrl = pub.publicUrl;
      }

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referenceImageUrl, logoUrl }),
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
  const sky = "#0ea5e9";
  const purple = "#8b5cf6";
  const green = "#10b981";

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
    overflow: "hidden", marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const inputStyle: React.CSSProperties = {
    background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10,
    color: "#0f172a", fontSize: 14, fontFamily: "inherit",
    padding: "11px 14px", outline: "none", width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#64748b",
    letterSpacing: "0.8px", textTransform: "uppercase" as const,
    display: "block", marginBottom: 6,
  };

  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        .brief-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .brief-grid-ind { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        .brief-grid-mood { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .brief-grid-size { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        @media (max-width: 640px) {
          .brief-grid-2 { grid-template-columns: 1fr !important; }
          .brief-grid-ind { grid-template-columns: repeat(2,1fr) !important; }
          .brief-grid-mood { grid-template-columns: 1fr 1fr !important; }
          .brief-grid-size { grid-template-columns: 1fr 1fr !important; }
          .brief-body { padding: 16px !important; }
          .brief-footer { padding: 16px 20px !important; flex-direction: column !important; gap: 12px !important; }
          .brief-footer-btn { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #0f172a" }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ width: 1, height: 16, background: "#334155" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>New Brochure Brief</span>
        <span style={{ marginLeft: "auto", background: sky, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>AI-Powered</span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 100px" }}>

        <div style={cardStyle}>
          <div style={{ background: navy, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #0f172a" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: sky, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(14,165,233,0.4)" }}>
              <Building2 size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Brand information</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Tell us about the brand this brochure is for</div>
            </div>
          </div>
          <div className="brief-body" style={{ padding: "20px" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Brand / company name *</label>
              <input style={inputStyle} type="text" placeholder="Green Valley Properties" value={form.brandName} onChange={e => set("brandName", e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Industry</label>
              <div className="brief-grid-ind">
                {INDUSTRIES.map(({ value, label, Icon }) => (
                  <button key={value} onClick={() => set("industry", value)} style={{ border: `1.5px solid ${form.industry === value ? sky : "#e2e8f0"}`, borderRadius: 10, padding: "10px 6px", cursor: "pointer", background: form.industry === value ? "#e0f2fe" : "#f8fafc", fontSize: 11, fontWeight: 500, color: form.industry === value ? "#0369a1" : "#475569", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit", boxShadow: form.industry === value ? "0 2px 8px rgba(14,165,233,0.15)" : "none" }}>
                    <Icon size={18} color={form.industry === value ? sky : "#94a3b8"} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>What are you promoting? *</label>
              <textarea style={{ ...inputStyle, minHeight: 88, resize: "none", lineHeight: 1.6 }} placeholder="New residential plotted development in Tambaram, Chennai. DTCP approved, gated community, plots from 600 to 1200 sqft starting at Rs 18 lakhs." value={form.productDescription} onChange={e => set("productDescription", e.target.value)} />
              <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 3 }}>{form.productDescription.length} / 500</div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Target audience</label>
              <input style={inputStyle} type="text" placeholder="Middle-income families looking for first home in Chennai suburbs" value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Location / city</label>
              <input style={inputStyle} type="text" placeholder="e.g. OMR, Pudhupakkam, Chennai" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ background: navy, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #0f172a" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: purple, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(139,92,246,0.4)" }}>
              <Palette size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Design direction</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Pick a mood — AI crafts the visual language around it</div>
            </div>
          </div>
          <div className="brief-body" style={{ padding: "20px" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Key message or tagline</label>
              <input style={inputStyle} type="text" placeholder="Your Dream Home Awaits" value={form.keyMessage} onChange={e => set("keyMessage", e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Mood and style</label>
              <div className="brief-grid-mood">
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => set("mood", m.value)} style={{ border: `1.5px solid ${form.mood === m.value ? sky : "#e2e8f0"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", background: form.mood === m.value ? "#e0f2fe" : "#f8fafc", textAlign: "left", fontFamily: "inherit", boxShadow: form.mood === m.value ? "0 2px 10px rgba(14,165,233,0.18)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: form.mood === m.value ? sky : "#cbd5e1", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: form.mood === m.value ? "#0369a1" : "#1e293b" }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 14 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Brand colours</label>
              <div className="brief-grid-2">
                <input style={inputStyle} type="text" placeholder="Primary — e.g. Deep Blue" value={form.primaryColour} onChange={e => set("primaryColour", e.target.value)} />
                <input style={inputStyle} type="text" placeholder="Secondary — e.g. Gold" value={form.secondaryColour} onChange={e => set("secondaryColour", e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Reference image (optional)</label>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Upload a site photo, product shot, or logo — AI will use it as a base or reference when generating the design.</div>
              {refImagePreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={refImagePreview} alt="Reference preview" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, border: "1.5px solid #e2e8f0" }} />
                  <button onClick={() => onPickImage(null)} style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", border: "2px solid #fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={12} color="#fff" />
                  </button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 140, height: 140, border: "1.5px dashed #cbd5e1", borderRadius: 10, cursor: "pointer", background: "#f8fafc" }}>
                  <Upload size={20} color="#94a3b8" />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Upload image</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => onPickImage(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ background: navy, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #0f172a" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(139,92,246,0.4)" }}>
              <Upload size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Brand elements (optional)</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Logo, contact number, trust badges, price call-outs</div>
            </div>
          </div>
          <div className="brief-body" style={{ padding: "20px" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Logo</label>
              {logoPreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={logoPreview} alt="Logo preview" style={{ width: 100, height: 100, objectFit: "contain", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff" }} />
                  <button onClick={() => onPickLogo(null)} style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", border: "2px solid #fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={12} color="#fff" />
                  </button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 100, height: 100, border: "1.5px dashed #cbd5e1", borderRadius: 10, cursor: "pointer", background: "#f8fafc" }}>
                  <Upload size={18} color="#94a3b8" />
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>Upload logo</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => onPickLogo(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Phone number</label>
              <input style={inputStyle} type="text" placeholder="+91 98765 43210" value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Trust badges</label>
              <input style={inputStyle} type="text" placeholder="e.g. DTCP Approved, RERA Registered" value={form.badges} onChange={e => set("badges", e.target.value)} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Comma-separated. Shown as small badges on the design.</div>
            </div>
            <div className="brief-grid-2">
              <div>
                <label style={labelStyle}>Price call-out 1</label>
                <input style={{ ...inputStyle, marginBottom: 8 }} type="text" placeholder="₹27L onwards" value={form.price1Amount} onChange={e => set("price1Amount", e.target.value)} />
                <input style={inputStyle} type="text" placeholder="Plots start from" value={form.price1Label} onChange={e => set("price1Label", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Price call-out 2</label>
                <input style={{ ...inputStyle, marginBottom: 8 }} type="text" placeholder="₹51L onwards" value={form.price2Amount} onChange={e => set("price2Amount", e.target.value)} />
                <input style={inputStyle} type="text" placeholder="Villas start from" value={form.price2Label} onChange={e => set("price2Label", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ background: navy, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #0f172a" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: green, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(16,185,129,0.4)" }}>
              <Printer size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Print specifications</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Canvas size and production quantity</div>
            </div>
          </div>
          <div className="brief-body" style={{ padding: "20px" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Brochure format</label>
              <div className="brief-grid-size">
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => set("size", s.value)} style={{ border: `1.5px solid ${form.size === s.value ? sky : "#e2e8f0"}`, borderRadius: 10, padding: "12px 10px", cursor: "pointer", background: form.size === s.value ? "#e0f2fe" : "#f8fafc", textAlign: "center", fontFamily: "inherit", boxShadow: form.size === s.value ? "0 2px 10px rgba(14,165,233,0.18)" : "none" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, fontWeight: 500 }}>{s.dim}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: form.size === s.value ? "#0369a1" : "#1e293b" }}>{s.label}</div>
                    {s.popular && <div style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 600, padding: "2px 7px", background: sky, color: "#fff", borderRadius: 20 }}>Popular</div>}
                  </button>
                ))}
              </div>
            </div>
            <div className="brief-grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Print quantity *</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.quantity} onChange={e => set("quantity", e.target.value)}>
                  <option value="">Select quantity</option>
                  {["250 copies","500 copies","1,000 copies","2,500 copies","5,000 copies","10,000+ copies"].map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Deadline</label>
                <input style={inputStyle} type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Additional notes</label>
              <textarea style={{ ...inputStyle, minHeight: 72, resize: "none" }} placeholder="Address, phone, website, or any specific content to include..." value={form.additionalNotes} onChange={e => set("additionalNotes", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="brief-footer" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: navy, borderTop: "1px solid #0f172a", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{canSubmit ? "All required fields complete" : "Fill required fields to continue"}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: canSubmit ? green : "#475569", marginTop: 2 }}>
            {canSubmit ? "✦ Ready to generate AI designs" : "Brand name, description, and quantity required"}
          </div>
        </div>
        <button className="brief-footer-btn" onClick={handleSubmit} disabled={!canSubmit || loading} style={{ background: canSubmit ? sky : "#334155", border: "none", borderRadius: 10, color: canSubmit ? "#fff" : "#64748b", fontSize: 14, fontWeight: 600, padding: "13px 24px", cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", boxShadow: canSubmit ? "0 2px 8px rgba(14,165,233,0.4)" : "none" }}>
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : <><Sparkles size={16} /> Generate AI designs</>}
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
