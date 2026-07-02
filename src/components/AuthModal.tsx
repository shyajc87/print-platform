"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    if (!isOpen) { setError(""); setForm({ name: "", email: "", password: "" }); }
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setError(error.message); setLoading(false); return; }
    onClose(); router.push("/dashboard"); router.refresh();
  };

  const handleSignUp = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setError("check_email");
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  const pwdStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(form.password) ? 4 : 3;
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  const strengthLabels = ["", "Too short", "Fair", "Good", "Strong"];

  const canSubmit = tab === "signin" ? form.email && form.password : form.name && form.email && form.password.length >= 6;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden", animation: "modalIn 0.2s ease" }}
      >
        <div style={{ background: "#1e293b", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Printer size={17} color="#0ea5e9" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>Print<span style={{ color: "#0ea5e9" }}>AI</span></span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px 24px 28px" }}>
          <div style={{ display: "flex", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: 3, marginBottom: 22, gap: 3 }}>
            {(["signin", "signup"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }} style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: tab === t ? "1px solid #e2e8f0" : "none", cursor: "pointer", fontFamily: "inherit", color: tab === t ? "#0f172a" : "#64748b", background: tab === t ? "#fff" : "transparent" }}>
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {error === "check_email" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Mail size={22} color="#10b981" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Check your email</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.</div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</div>
              )}

              {tab === "signup" && (
                <Field label="Full name" icon={<User size={15} />}>
                  <input type="text" placeholder="Shyam Sundar" value={form.name} onChange={e => set("name", e.target.value)} style={inputStyle} />
                </Field>
              )}

              <Field label="Email" icon={<Mail size={15} />}>
                <input type="email" placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} onKeyDown={e => e.key === "Enter" && canSubmit && (tab === "signin" ? handleSignIn() : handleSignUp())} />
              </Field>

              <Field label="Password" icon={<Lock size={15} />} right={
                <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }>
                <input type={showPwd ? "text" : "password"} placeholder={tab === "signup" ? "Min. 6 characters" : "••••••••"} value={form.password} onChange={e => set("password", e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} onKeyDown={e => e.key === "Enter" && canSubmit && (tab === "signin" ? handleSignIn() : handleSignUp())} />
              </Field>

              {tab === "signup" && form.password.length > 0 && (
                <div style={{ marginTop: -10, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwdStrength ? strengthColors[pwdStrength] : "#e2e8f0" }} />)}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColors[pwdStrength] }}>{strengthLabels[pwdStrength]}</div>
                </div>
              )}

              {tab === "signin" && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, marginTop: -8 }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 13, fontFamily: "inherit" }}>Forgot password?</button>
                </div>
              )}

              <button onClick={tab === "signin" ? handleSignIn : handleSignUp} disabled={!canSubmit || loading} style={{ width: "100%", background: canSubmit ? "#0ea5e9" : "#e2e8f0", color: canSubmit ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, padding: "13px", cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canSubmit ? "0 2px 8px rgba(14,165,233,0.3)" : "none" }}>
                {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />{tab === "signin" ? "Signing in..." : "Creating account..."}</> : <><ArrowRight size={15} />{tab === "signin" ? "Sign in" : "Create account"}</>}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </div>

              <button onClick={handleGoogle} style={{ width: "100%", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, color: "#0f172a", fontSize: 13, fontWeight: 500, padding: "11px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0",
  borderRadius: 10, color: "#0f172a", fontSize: 14, fontFamily: "inherit",
  padding: "11px 14px 11px 36px", outline: "none",
};

function Field({ label, icon, right, children }: { label: string; icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>{icon}</div>
        {children}
        {right}
      </div>
    </div>
  );
}
