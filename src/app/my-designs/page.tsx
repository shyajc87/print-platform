"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Download, Edit3, FileText } from "lucide-react";

interface Design {
  id: string;
  brief_id: string | null;
  image_url: string;
  pdf_url?: string;
  ai_prompt: string;
  created_at: string;
}

export default function MyDesignsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    const { data } = await supabase
      .from("designs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDesigns(data || []);
    setLoading(false);
  };

  const navy = "#111827", indigo = "#4f46e5";

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>My Designs</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {loading && <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>}
        {!loading && designs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 16 }}>No saved designs yet.</p>
            <button onClick={() => router.push("/editor")} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>
              Open the editor
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {designs.map(d => (
            <div key={d.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, overflow: "hidden" }}>
              <img src={d.image_url} alt="Saved design" style={{ width: "100%", aspectRatio: "210/297", objectFit: "cover", display: "block" }} />
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                  {new Date(d.created_at).toLocaleDateString("en-IN")}{d.brief_id ? " · linked to a project" : " · standalone"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => router.push(`/editor?bg=${encodeURIComponent(d.image_url)}`)} style={{ flex: 1, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, color: "#7c3aed", fontSize: 12, fontWeight: 600, padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                    <Edit3 size={12} /> Edit
                  </button>
                  {d.pdf_url && (
                    <a href={d.pdf_url} download target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: indigo, borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none" }}>
                      <FileText size={12} /> PDF
                    </a>
                  )}
                  <a href={d.image_url} download target="_blank" rel="noopener noreferrer" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#374151", fontSize: 12, fontWeight: 600, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <Download size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
