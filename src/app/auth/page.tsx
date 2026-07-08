"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Printer, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const supabase = createClient();

  const handleSignIn = async () => {
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password,
    });
    if (error) { setError(error.message); setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const pending = localStorage.getItem("pendingPartnerSignup");
    if (profile?.role === "agency" || profile?.role === "printer" || (!profile && pending)) {
      router.push("/partner/dashboard");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  const handleSignUp = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setError("Check your email to confirm your account.");
    setLoading(false);
  };

  const pwdStrength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : /[^a-zA-Z0-9]/.test(form.password) ? 4 : 3;

  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][pwdStrength];
  const strengthLabel = ["", "Too short", "Fair", "Good", "Strong"][pwdStrength];

  const s = {
    page: { minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "Inter, system-ui, sans-serif" } as React.CSSProperties,
    card: { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "32px 28px", width: "100%", maxWidth: 400 } as React.CSSProperties,
    logo: { textAlign: "center" as const, marginBottom: 28 },
    logoMark: { width: 48, height: 48, borderRadius: 12, background: "#e0f2fe", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
    logoName: { fontSize: 18, fontWeight: 600, color: "#0f172a" },
    logoSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
    seg: { display: "flex", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: 3, marginBottom: 24, gap: 3 },
    segBtn: (active: boolean) => ({ flex: 1, padding: "8px", fontSize: 13, fontWeight: 500, textAlign: "center" as const, borderRadius: 8, border: active ? "1px solid #e2e8f0" : "none", cursor: "pointer", fontFamily: "inherit", color: active ? "#0f172a" : "#64748b", background: active ? "#fff" : "transparent" }),
    label: { display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 6 },
    fieldWrap: { position: "relative" as const, marginBottom: 14 },
    icon: { position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
    input: { width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, color: "#0f172a", fontSize: 14, fontFamily: "inherit", padding: "11px 40px", outline: "none" },
    eyeBtn: { position: "absolute" as const, right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 },
    submitBtn: (canSubmit: boolean) => ({ width: "100%", background: canSubmit ? "#0ea5e9" : "#e2e8f0", color: canSubmit ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, padding: "13px", cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }),
    divider: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
    dividerLine: { flex: 1, height: 1, background: "#e2e8f0" },
    dividerText: { fontSize: 12, color: "#94a3b8" },
    googleBtn: { width: "100%", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, color: "#0f172a", fontSize: 13, fontWeight: 500, padding: "11px 12px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
    bottomLink: { textAlign: "center" as const, fontSize: 13, color: "#64748b" },
    errorBox: (isInfo: boolean) => ({ background: isInfo ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isInfo ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: isInfo ? "#15803d" : "#dc2626", marginBottom: 16 }),
  };

  const canSubmitSignIn = form.email && form.password;
  const canSubmitSignUp = form.name && form.email && form.password.length >= 6;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoMark}><Printer size={22} color="#0ea5e9" /></div>
          <div style={{ ...s.logoName, color: "#0ea5e9" }}>Talaio</div>
          <div style={s.logoSub}>{tab === "signin" ? "Welcome back" : "Create your account"}</div>
        </div>

        <div style={s.seg}>
          <button style={s.segBtn(tab === "signin")} onClick={() => { setTab("signin"); setError(""); }}>Sign in</button>
          <button style={s.segBtn(tab === "signup")} onClick={() => { setTab("signup"); setError(""); }}>Create account</button>
        </div>

        {error && <div style={s.errorBox(error.includes("Check"))}>{error}</div>}

        {tab === "signup" && (
          <div>
            <label style={s.label}>Full name</label>
            <div style={s.fieldWrap}>
              <User size={16} style={s.icon} />
              <input style={s.input} type="text" placeholder="Shyam Sundar" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label style={s.label}>Email address</label>
          <div style={s.fieldWrap}>
            <Mail size={16} style={s.icon} />
            <input style={s.input} type="email" placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
        </div>

        <div>
          <label style={s.label}>Password</label>
          <div style={s.fieldWrap}>
            <Lock size={16} style={s.icon} />
            <input style={{ ...s.input, paddingRight: 40 }} type={showPwd ? "text" : "password"} placeholder={tab === "signup" ? "Min. 6 characters" : "••••••••"} value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())} />
            <button style={s.eyeBtn} onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Hide password" : "Show password"}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {tab === "signup" && form.password.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwdStrength ? strengthColor : "#e2e8f0" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: strengthColor }}>{strengthLabel}</div>
            </div>
          )}
        </div>

        {tab === "signin" && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, marginTop: -8 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>Forgot password?</button>
          </div>
        )}

        <button
          style={s.submitBtn(tab === "signin" ? !!canSubmitSignIn : !!canSubmitSignUp)}
          onClick={tab === "signin" ? handleSignIn : handleSignUp}
          disabled={loading}
        >
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {tab === "signin" ? "Signing in..." : "Creating account..."}</> : <><ArrowRight size={16} /> {tab === "signin" ? "Sign in" : "Create account"}</>}
        </button>

        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>or</span>
          <div style={s.dividerLine} />
        </div>

        <button style={s.googleBtn} onClick={async () => {
          const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
          if (error) setError(error.message);
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={s.bottomLink}>
          {tab === "signin" ? <>Don't have an account? <button onClick={() => setTab("signup")} style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>Create one</button></> : <>Already have an account? <button onClick={() => setTab("signin")} style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>Sign in</button></>}
        </div>
        <div style={{ ...s.bottomLink, marginTop: 12, fontSize: 12 }}>
          Design agency or print company? <button onClick={() => router.push("/partner-signup")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8b5cf6", fontSize: 12, fontWeight: 500, fontFamily: "inherit" }}>Partner with us</button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
