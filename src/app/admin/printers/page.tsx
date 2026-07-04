"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface Printer {
  id: string; name: string; city: string; rating: number;
  review_count: number; pricing: Record<string, number>; turnaround_days: number;
  approved: boolean;
}

interface PrintOrder {
  id: string; brief_id: string | null; printer_id: string; quantity: string;
  quoted_price: number; status: string; created_at: string;
}

const emptyForm = { name: "", city: "", rating: "4.0", review_count: "0", turnaround_days: "3", pricing: '{\n  "250 copies": 8,\n  "500 copies": 6,\n  "1,000 copies": 5,\n  "2,500 copies": 4,\n  "5,000 copies": 3.3,\n  "10,000+ copies": 2.7\n}' };
const emptyLoginForm = { businessName: "", city: "", email: "", password: "", contactPhone: "", turnaroundDays: "3", pricing: emptyForm.pricing };

export default function AdminPrintersPage() {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = useIsAdmin();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [loginError, setLoginError] = useState("");
  const [loginSaving, setLoginSaving] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const load = async () => {
    const { data: p } = await supabase.from("printers").select("*").order("created_at", { ascending: false });
    setPrinters(p || []);
    const { data: o } = await supabase.from("print_orders").select("*").order("created_at", { ascending: false });
    setOrders(o || []);
  };

  const addPrinter = async () => {
    setFormError("");
    let pricing: Record<string, number>;
    try { pricing = JSON.parse(form.pricing); } catch { setFormError("Pricing must be valid JSON."); return; }
    setSaving(true);
    const { error } = await supabase.from("printers").insert([{
      name: form.name, city: form.city, rating: parseFloat(form.rating),
      review_count: parseInt(form.review_count, 10), turnaround_days: parseInt(form.turnaround_days, 10),
      pricing,
    }]);
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setForm(emptyForm);
    load();
  };

  const deletePrinter = async (id: string) => {
    if (!confirm("Delete this printer?")) return;
    await supabase.from("printers").delete().eq("id", id);
    load();
  };

  const approvePrinter = async (id: string) => {
    await supabase.from("printers").update({ approved: true }).eq("id", id);
    load();
  };

  const createPartnerLogin = async () => {
    setLoginError(""); setCreatedCreds(null);
    let pricing: Record<string, number>;
    try { pricing = JSON.parse(loginForm.pricing); } catch { setLoginError("Pricing must be valid JSON."); return; }
    setLoginSaving(true);
    try {
      const res = await fetch("/api/admin/create-partner", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "printer", email: loginForm.email, password: loginForm.password,
          businessName: loginForm.businessName, city: loginForm.city,
          contactPhone: loginForm.contactPhone, turnaroundDays: parseInt(loginForm.turnaroundDays, 10) || 3,
          pricing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedCreds({ email: data.email, password: data.password });
      setLoginForm(emptyLoginForm);
      load();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Failed to create login.");
    } finally {
      setLoginSaving(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("print_orders").update({ status }).eq("id", id);
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
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>Admin · Printers</span>
        <button onClick={() => router.push("/admin/agencies")} style={{ marginLeft: "auto", background: "none", border: "none", color: sky, fontSize: 13, cursor: "pointer" }}>Go to Agencies admin →</button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {printers.some(p => !p.approved) && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#92400e", marginBottom: 16 }}>Pending approval</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {printers.filter(p => !p.approved).map(p => (
                <div key={p.id} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: navy, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{p.city} — self-signed up, awaiting approval</div>
                  </div>
                  <button onClick={() => approvePrinter(p.id)} style={{ background: "#10b981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Create a printer login</h2>
        <div style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 14, padding: 20, marginBottom: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input placeholder="Business name" value={loginForm.businessName} onChange={e => setLoginForm({ ...loginForm, businessName: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="City" value={loginForm.city} onChange={e => setLoginForm({ ...loginForm, city: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Login email" type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Temp password (min 6 chars)" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Contact phone" value={loginForm.contactPhone} onChange={e => setLoginForm({ ...loginForm, contactPhone: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Turnaround (days)" value={loginForm.turnaroundDays} onChange={e => setLoginForm({ ...loginForm, turnaroundDays: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <textarea placeholder="Pricing JSON" value={loginForm.pricing} onChange={e => setLoginForm({ ...loginForm, pricing: e.target.value })} style={{ gridColumn: "1 / -1", minHeight: 110, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "monospace", fontSize: 12 }} />
          {loginError && <div style={{ gridColumn: "1 / -1", color: "#dc2626", fontSize: 12 }}>{loginError}</div>}
          {createdCreds && (
            <div style={{ gridColumn: "1 / -1", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, fontSize: 12, color: "#15803d" }}>
              Login created — share these with the printer: <strong>{createdCreds.email}</strong> / <strong>{createdCreds.password}</strong>
            </div>
          )}
          <button onClick={createPartnerLogin} disabled={loginSaving || !loginForm.businessName || !loginForm.email || loginForm.password.length < 6} style={{ gridColumn: "1 / -1", background: indigo, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loginSaving ? "Creating..." : "Create login & listing"}
          </button>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Add a printer</h2>
        <div style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 14, padding: 20, marginBottom: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Rating (0-5)" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Review count" value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }} />
          <input placeholder="Turnaround (days)" value={form.turnaround_days} onChange={e => setForm({ ...form, turnaround_days: e.target.value })} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, gridColumn: "1 / -1" }} />
          <textarea placeholder="Pricing JSON" value={form.pricing} onChange={e => setForm({ ...form, pricing: e.target.value })} style={{ gridColumn: "1 / -1", minHeight: 130, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "monospace", fontSize: 12 }} />
          {formError && <div style={{ gridColumn: "1 / -1", color: "#dc2626", fontSize: 12 }}>{formError}</div>}
          <button onClick={addPrinter} disabled={saving || !form.name || !form.city} style={{ gridColumn: "1 / -1", background: indigo, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={15} /> {saving ? "Saving..." : "Add printer"}
          </button>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>All printers ({printers.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {printers.map(p => (
            <div key={p.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: navy, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{p.city} · ★{p.rating} ({p.review_count}) · {p.turnaround_days}d {!p.approved && <span style={{ color: "#92400e" }}>· pending approval</span>}</div>
              </div>
              <button onClick={() => deletePrinter(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Incoming print requests ({orders.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No requests yet.</p>}
          {orders.map(o => (
            <div key={o.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: navy, fontWeight: 600 }}>{o.quantity} · ₹{Number(o.quoted_price).toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(o.created_at).toLocaleString("en-IN")}</div>
              </div>
              <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}>
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="printing">Printing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
