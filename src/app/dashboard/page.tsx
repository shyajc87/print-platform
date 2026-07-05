"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { Plus, FileText, Sparkles, CheckCircle, Clock, LogOut, Printer, ChevronRight, Star, Palette, ShieldCheck } from "lucide-react";

interface Brief {
  id: string;
  brand_name: string;
  industry: string;
  size: string;
  status: string;
  created_at: string;
}

interface PrinterSummary { id: string; name: string; rating: number; }
interface AgencySummary { id: string; name: string; rating: number; }

const statusConfig: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pending:       { label: "Brief submitted", color: "#92400e", bg: "#fef3c7", Icon: Clock },
  generating:    { label: "Generating",      color: "#1e40af", bg: "#dbeafe", Icon: Sparkles },
  designs_ready: { label: "Ready to review", color: "#065f46", bg: "#d1fae5", Icon: FileText },
  approved:      { label: "Approved",        color: "#064e3b", bg: "#a7f3d0", Icon: CheckCircle },
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = useIsAdmin();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [printers, setPrinters] = useState<PrinterSummary[]>([]);
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      const { data } = await supabase
        .from("briefs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setBriefs(data || []);

      const { data: printerData } = await supabase
        .from("printers").select("id, name, rating").order("rating", { ascending: false }).limit(5);
      setPrinters(printerData || []);

      const { data: agencyData } = await supabase
        .from("design_agencies").select("id, name, rating").order("rating", { ascending: false }).limit(5);
      setAgencies(agencyData || []);

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
    <div className="dash-shell" style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
        .dash-layout { width: 100%; margin: 0; padding: 28px 32px; display: flex; gap: 24px; align-items: stretch; box-sizing: border-box; }
        .dash-sidebar { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; order: 2; }
        .dash-content { flex: 1; min-width: 0; padding: 0; order: 1; display: flex; flex-direction: column; min-height: 0; }
        .dash-quick-actions { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 10px; }
        @media (max-width: 700px) {
          .dash-quick-actions { grid-template-columns: 1fr 1fr; }
        }
        .dash-content-scroll { overflow-y: auto; padding-right: 4px; }
        .sidebar-item:hover { background: #f0f9ff !important; }
        @media (min-width: 769px) {
          .dash-shell { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
          .dash-layout { flex: 1; min-height: 0; overflow: hidden; }
          .dash-sidebar { max-height: 100%; overflow-y: auto; }
          .dash-content-scroll { flex: 1; }
        }
        @media (max-width: 768px) {
          .dash-layout { flex-direction: column; padding: 20px 16px; }
          .dash-sidebar { width: 100%; }
        }
        @media (max-width: 480px) {
          .dash-stats { grid-template-columns: 1fr 1fr; }
          .project-row { flex-direction: column; align-items: flex-start !important; gap: 10px; }
          .project-badge-wrap { align-self: flex-start; }
        }
      `}</style>

      <div style={{ background: navy, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #0f172a" }}>
        <div onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Printer size={17} color={sky} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>
            Print<span style={{ color: sky }}>AI</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAdmin && (
            <button onClick={() => router.push("/admin/printers")} style={{ background: "none", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "inherit", padding: "5px 10px" }}>
              <ShieldCheck size={13} /> Admin
            </button>
          )}
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: sky }}>
            {initials}
          </div>
          <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontFamily: "inherit" }}>
            <LogOut size={14} />
            <span style={{ display: "none" }} className="hide-mobile">Sign out</span>
          </button>
        </div>
      </div>

      <div className="dash-layout">
        <aside className="dash-sidebar">
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <Printer size={14} color={sky} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Print companies</span>
            </div>
            {printers.map(p => (
              <div key={p.id} onClick={() => router.push("/printers")} className="sidebar-item" style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}><Star size={10} fill="#f59e0b" color="#f59e0b" /> {p.rating}</span>
              </div>
            ))}
            <div onClick={() => router.push("/printers")} style={{ padding: "10px 14px", fontSize: 12, color: sky, fontWeight: 600, cursor: "pointer" }}>View all →</div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <Palette size={14} color="#8b5cf6" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Custom designers</span>
            </div>
            {agencies.map(a => (
              <div key={a.id} onClick={() => router.push("/agencies")} className="sidebar-item" style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}><Star size={10} fill="#f59e0b" color="#f59e0b" /> {a.rating}</span>
              </div>
            ))}
            <div onClick={() => router.push("/agencies")} style={{ padding: "10px 14px", fontSize: 12, color: sky, fontWeight: 600, cursor: "pointer" }}>View all →</div>
          </div>
        </aside>

        <div className="dash-content">
        <div style={{ flexShrink: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.3px" }}>
            {greeting}, {name.split(" ")[0]}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Here's an overview of your print projects</p>
        </div>

        <div className="dash-stats">
          {[
            { label: "Total projects", value: briefs.length, sub: "all time" },
            { label: "In progress", value: inProgress, sub: "active now" },
            { label: "Approved", value: approved, sub: "completed" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="dash-quick-actions" style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push("/brief")}
            style={{ background: sky, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, padding: "13px 10px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 2px 8px rgba(14,165,233,0.3)" }}
          >
            <Plus size={16} /> New project
          </button>
          <button
            onClick={() => router.push("/editor")}
            style={{ background: "#fff", color: "#7c3aed", border: "1.5px solid #ddd6fe", borderRadius: 12, fontSize: 12, fontWeight: 600, padding: "13px 8px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Design from scratch
          </button>
          <button
            onClick={() => router.push("/my-designs")}
            style={{ background: "#fff", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, padding: "13px 8px", cursor: "pointer", fontFamily: "inherit" }}
          >
            My Designs
          </button>
          <button
            onClick={() => router.push("/agencies")}
            style={{ background: "#fff", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, padding: "13px 8px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Custom designer
          </button>
        </div>

        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Recent projects
          </span>
          {!loading && briefs.length > 0 && (
            <span style={{ fontSize: 11, color: "#cbd5e1" }}>{briefs.length} total</span>
          )}
        </div>
        </div>

        <div className="dash-content-scroll">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
            Loading your projects...
          </div>
        ) : briefs.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FileText size={24} color={sky} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>No projects yet</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
              Start your first project and get AI-generated designs in minutes.
            </div>
            <button
              onClick={() => router.push("/brief")}
              style={{ background: sky, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}
            >
              Start a project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {briefs.map(brief => {
              const cfg = statusConfig[brief.status] || statusConfig.pending;
              const Icon = cfg.Icon;
              const isClickable = brief.status === "designs_ready" || brief.status === "approved";
              return (
                <div
                  key={brief.id}
                  onClick={() => isClickable && router.push(`/designs?id=${brief.id}`)}
                  className="project-row"
                  style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: isClickable ? "pointer" : "default", transition: "border-color 0.15s", gap: 12 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={16} color="#475569" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {brief.brand_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {brief.industry} · {brief.size} · {new Date(brief.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>
                  <div className="project-badge-wrap" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      <Icon size={11} />
                      {cfg.label}
                    </div>
                    {isClickable && <ChevronRight size={16} color="#94a3b8" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
