"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, FileText, Sparkles, CheckCircle, Clock, LogOut, Printer } from "lucide-react";

interface Brief {
  id: string;
  brand_name: string;
  industry: string;
  size: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pending:       { label: "Brief submitted", color: "#92400e", bg: "#fef3c7", Icon: Clock },
  generating:    { label: "Generating",      color: "#1e40af", bg: "#dbeafe", Icon: Sparkles },
  designs_ready: { label: "Ready to review", color: "#065f46", bg: "#d1fae5", Icon: FileText },
  approved:      { label: "Approved",         color: "#064e3b", bg: "#a7f3d0", Icon: CheckCircle },
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      const { data } = await supabase.from("briefs").select("*").order("created_at", { ascending: false }).limit(10);
      setBriefs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const approved = briefs.filter(b => b.status === "approved").length;
  const inProgress = briefs.filter(b => ["pending", "generating", "designs_ready"].includes(b.status)).length;

  const navy = "#1e293b";
  const sky = "#0ea5e9";

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Printer size={18} color={sky} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>Print<span style={{ color: sky }}>AI</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: sky }}>{initials}</div>
          <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontFamily: "inherit" }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a" }}>{greeting}, {name.split(" ")[0]}</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Here's an overview of your print projects</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total projects", value: briefs.length, sub: "all time" },
            { label: "In progress", value: inProgress, sub: "active now" },
            { label: "Approved", value: approved, sub: "completed" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: "#0f172a" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        <button onClick={() => router.push("/brief")} style={{ width: "100%", background: sky, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, padding: "14px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(14,165,233,0.3)" }}>
          <Plus size={18} /> New project
        </button>

        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent projects</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>Loading your projects...</div>
        ) : briefs.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <FileText size={22} color={sky} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>No projects yet</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Start your first project and get AI-generated designs in minutes.</div>
            <button onClick={() => router.push("/brief")} style={{ background: sky, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>
              Start a project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {briefs.map(brief => {
              const cfg = statusConfig[brief.status] || statusConfig.pending;
              const Icon = cfg.Icon;
              return (
                <div key={brief.id} onClick={() => brief.status === "designs_ready" && router.push(`/designs?id=${brief.id}`)} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: brief.status === "designs_ready" ? "pointer" : "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={18} color="#94a3b8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{brief.brand_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{brief.industry} · {brief.size}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                      <Icon size={11} />
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {new Date(brief.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
