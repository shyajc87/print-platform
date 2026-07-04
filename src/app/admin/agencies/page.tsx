"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Agency {
  id: string; name: string; city: string; specialty: string;
  rating: number; review_count: number; contact_phone: string; contact_email: string;
}

interface AgencyRequest {
  id: string; brief_id: string | null; agency_id: string; message: string;
  status: string; created_at: string;
}

const emptyForm = { name: "", city: "", specialty: "", rating: "4.0", review_count: "0", contact_phone: "", contact_email: "" };

export default function AdminAgenciesPage() {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = useIsAdmin();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [requests, setRequests] = useState<AgencyRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const load = async () => {
    const { data: a } = await supabase.from("design_agencies").select("*").order("created_at", { ascending: false });
    setAgencies(a || []);
    const { data: r } = await supabase.from("agency_requests").select("*").order("created_at", { ascending: false });
    setRequests(r || []);
  };

  const addAgency = async () => {
    setFormError("");
    setSaving(true);
    const { error } = await supabase.from("design_agencies").insert([{
      name: form.name, city: form.city, specialty: form.specialty,
      rating: parseFloat(form.rating), review_count: parseInt(form.review_count, 10),
      contact_phone: form.contact_phone, contact_email: form.contact_email,
    }]);
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setForm(emptyForm);
    load();
  };

  const deleteAgency = async (id: string) => {
    if (!confirm("Delete this agency?")) return;
    await supabase.from("design_agencies").delete().eq("id", id);
    load();
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from("agency_requests").update({ status }).eq("id", id);
    load();
  };

  const navy = "#111827";
  const sky = "#0ea5e9";
  const indigo = "#4f46e5";

  if (isAdmin === null) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif", color: "#6b7280" }}>Checking access...</div>;
  if (isAdmin === false) return (
    <div style={{ padding: 40, fontFamily: "Inter, sans-serif", textAlign: "center" }}>
      <p style={{ color: "#dc2626", marginBottom: 12 }}>You don&apos;t have admin access.</p>
      <button onClick={() => router.push("/dashboard")} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", cursor: "pointer" }}>Back to dashboard</button>
    </div>
  );

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13 }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: "#374151" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>Admin · Agencies</span>
        <button onClick={() => router.push("/admin/printers")} style={{ marginLeft: "auto", background: "none", border: "none", color: sky, fontSize: 13, cursor: "pointer" }}>Go to Printers admin →</button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Add a design agency</h2>
        <div style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 14, padding: 20, marginBottom: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, gridColumn: "1 / -1" }} />
          <input placeholder="Rating (0-5)" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Review count" value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Contact phone" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Contact email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          {formError && <div style={{ gridColumn: "1 / -1", color: "#dc2626", fontSize: 12 }}>{formError}</div>}
          <button onClick={addAgency} disabled={saving || !form.name || !form.city} style={{ gridColumn: "1 / -1", background: indigo, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={15} /> {saving ? "Saving..." : "Add agency"}
          </button>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>All agencies ({agencies.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {agencies.map(a => (
            <div key={a.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: navy, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{a.specialty} · {a.city} · ★{a.rating} ({a.review_count})</div>
              </div>
              <button onClick={() => deleteAgency(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Incoming design requests ({requests.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No requests yet.</p>}
          {requests.map(r => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>{r.message}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(r.created_at).toLocaleString("en-IN")}</div>
                <select value={r.status} onChange={e => updateRequestStatus(r.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}>
                  <option value="sent">Sent</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
