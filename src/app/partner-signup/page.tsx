"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Printer, Palette, ArrowRight, Loader2 } from "lucide-react";

const DEFAULT_PRICING = '{\n  "250 copies": 8,\n  "500 copies": 6,\n  "1,000 copies": 5,\n  "2,500 copies": 4,\n  "5,000 copies": 3.3,\n  "10,000+ copies": 2.7\n}';

export default function PartnerSignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<"agency" | "printer">("agency");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    email: "", password: "", businessName: "", city: "",
    specialty: "", contactPhone: "", contactEmail: "",
    turnaroundDays: "3", pricing: DEFAULT_PRICING,
  });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const canSubmit = form.email && form.password.length >= 6 && form.businessName && form.city;

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      let pricing: Record<string, number> | null = null;
      if (role === "printer") {
        try { pricing = JSON.parse(form.pricing); } catch { throw new Error("Pricing must be valid JSON."); }
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
      });
      if (signUpErr) throw signUpErr;

      if (!signUpData.session) {
        // Email confirmation required — stash the business details to finish setup on first login.
        localStorage.setItem("pendingPartnerSignup", JSON.stringify({ email: form.email, role, form }));
        setDone(true);
        setLoading(false);
        return;
      }

      await completePartnerSetup(signUpData.user!.id, role, form, pricing);
      router.push("/partner/dashboard");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  async function completePartnerSetup(
    userId: string, role: "agency" | "printer",
    formArg: typeof form, pricing: Record<string, number> | null
  ) {
    let entityId: string;
    if (role === "agency") {
      entityId = crypto.randomUUID();
      const { error } = await supabase.from("design_agencies").insert([{
        id: entityId, name: formArg.businessName, city: formArg.city, specialty: formArg.specialty || "General design",
        contact_phone: formArg.contactPhone, contact_email: formArg.contactEmail || formArg.email,
        rating: 0, review_count: 0, approved: false,
      }]);
      if (error) throw error;
    } else {
      entityId = crypto.randomUUID();
      const { error } = await supabase.from("printers").insert([{
        id: entityId, name: formArg.businessName, city: formArg.city, pricing: pricing || {},
        turnaround_days: parseInt(formArg.turnaroundDays, 10) || 3,
        contact_phone: formArg.contactPhone, contact_email: formArg.contactEmail || formArg.email,
        rating: 0, review_count: 0, approved: false,
      }]);
      if (error) throw error;
    }
    const { error: profileErr } = await supabase.from("profiles").insert([{ id: userId, role, entity_id: entityId }]);
    if (profileErr) throw profileErr;
  }

  const navy = "#1e293b";
  const sky = "#0ea5e9";
  const purple = "#8b5cf6";

  const inputStyle: React.CSSProperties = { width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, color: "#0f172a", fontSize: 14, fontFamily: "inherit", padding: "11px 14px", outline: "none" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px", textTransform: "uppercase", display: "block", marginBottom: 6 };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, maxWidth: 420, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 10 }}>Check your email</h2>
          <p style={{ fontSize: 14, color: "#64748b" }}>Confirm your email, then sign in — your {role === "agency" ? "design agency" : "print company"} profile will be set up automatically, pending admin approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "32px 28px", width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: navy }}>Partner with Print<span style={{ color: sky }}>AI</span></div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>List your business and start receiving requests</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setRole("agency")} style={{ flex: 1, border: `1.5px solid ${role === "agency" ? purple : "#e2e8f0"}`, background: role === "agency" ? "#f5f3ff" : "#f8fafc", borderRadius: 10, padding: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Palette size={18} color={role === "agency" ? purple : "#94a3b8"} />
            <span style={{ fontSize: 12, fontWeight: 600, color: role === "agency" ? purple : "#475569" }}>Design agency</span>
          </button>
          <button onClick={() => setRole("printer")} style={{ flex: 1, border: `1.5px solid ${role === "printer" ? sky : "#e2e8f0"}`, background: role === "printer" ? "#e0f2fe" : "#f8fafc", borderRadius: 10, padding: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Printer size={18} color={role === "printer" ? sky : "#94a3b8"} />
            <span style={{ fontSize: 12, fontWeight: 600, color: role === "printer" ? sky : "#475569" }}>Print company</span>
          </button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Business name</label>
            <input style={inputStyle} value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder={role === "agency" ? "Pixel & Print Studio" : "Sri Kumaran Print Works"} />
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input style={inputStyle} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Chennai" />
          </div>
          {role === "agency" && (
            <div>
              <label style={labelStyle}>Specialty</label>
              <input style={inputStyle} value={form.specialty} onChange={e => set("specialty", e.target.value)} placeholder="Real estate & retail brochures" />
            </div>
          )}
          {role === "printer" && (
            <>
              <div>
                <label style={labelStyle}>Turnaround (days)</label>
                <input style={inputStyle} value={form.turnaroundDays} onChange={e => set("turnaroundDays", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Pricing per copy (JSON, by quantity tier)</label>
                <textarea style={{ ...inputStyle, minHeight: 120, fontFamily: "monospace", fontSize: 12 }} value={form.pricing} onChange={e => set("pricing", e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label style={labelStyle}>Contact phone</label>
            <input style={inputStyle} value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+91 98400 11223" />
          </div>
          <div>
            <label style={labelStyle}>Login email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@business.com" />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min. 6 characters" />
          </div>

          <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ background: canSubmit ? navy : "#e2e8f0", color: canSubmit ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, padding: "13px", cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><ArrowRight size={16} /> Create partner account</>}
          </button>
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Your listing stays hidden from customers until an admin approves it.</p>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
