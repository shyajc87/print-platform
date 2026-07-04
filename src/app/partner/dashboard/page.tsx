"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Printer as PrinterIcon, Palette, AlertCircle } from "lucide-react";

interface Profile { role: string; entity_id: string | null; }
interface AgencyRequest { id: string; message: string; status: string; created_at: string; brief_id: string | null; }
interface PrintOrder { id: string; quantity: string; quoted_price: number; status: string; created_at: string; material?: string; paper_type?: string; confirmed_size?: string; brief_id: string | null; }

const AGENCY_STATUSES = ["sent", "contacted", "in_progress", "completed", "changes_requested", "approved", "declined"];
const PRINTER_STATUSES = ["requested", "confirmed", "printing", "completed", "cancelled"];

export default function PartnerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entityName, setEntityName] = useState("");
  const [entityApproved, setEntityApproved] = useState(true);
  const [requests, setRequests] = useState<AgencyRequest[]>([]);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmForm, setConfirmForm] = useState({ material: "", paper_type: "", confirmed_size: "" });
  const [notPartner, setNotPartner] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    let { data: profileRow } = await supabase.from("profiles").select("role, entity_id").eq("id", user.id).maybeSingle();

    // First login after email-confirmation signup — finish the pending partner setup now.
    if (!profileRow) {
      const pending = localStorage.getItem("pendingPartnerSignup");
      if (pending) {
        try {
          const { email, role, form } = JSON.parse(pending);
          if (email === user.email) {
            let pricing = null;
            if (role === "printer") { try { pricing = JSON.parse(form.pricing); } catch { pricing = {}; } }
            let entityId: string;
            if (role === "agency") {
              const { data } = await supabase.from("design_agencies").insert([{
                name: form.businessName, city: form.city, specialty: form.specialty || "General design",
                contact_phone: form.contactPhone, contact_email: form.contactEmail || form.email,
                rating: 0, review_count: 0, approved: false,
              }]).select().single();
              entityId = data.id;
            } else {
              const { data } = await supabase.from("printers").insert([{
                name: form.businessName, city: form.city, pricing: pricing || {},
                turnaround_days: parseInt(form.turnaroundDays, 10) || 3,
                contact_phone: form.contactPhone, contact_email: form.contactEmail || form.email,
                rating: 0, review_count: 0, approved: false,
              }]).select().single();
              entityId = data.id;
            }
            await supabase.from("profiles").insert([{ id: user.id, role, entity_id: entityId }]);
            localStorage.removeItem("pendingPartnerSignup");
            const { data: refreshed } = await supabase.from("profiles").select("role, entity_id").eq("id", user.id).maybeSingle();
            profileRow = refreshed;
          }
        } catch (err) { console.error("Failed to complete pending partner setup", err); }
      }
    }

    if (!profileRow || (profileRow.role !== "agency" && profileRow.role !== "printer")) {
      setNotPartner(true);
      setLoading(false);
      return;
    }
    setProfile(profileRow);

    if (profileRow.role === "agency") {
      const { data: entity } = await supabase.from("design_agencies").select("name, approved").eq("id", profileRow.entity_id).single();
      setEntityName(entity?.name || "");
      setEntityApproved(!!entity?.approved);
      const { data } = await supabase.from("agency_requests").select("*").eq("agency_id", profileRow.entity_id).order("created_at", { ascending: false });
      setRequests(data || []);
    } else {
      const { data: entity } = await supabase.from("printers").select("name, approved").eq("id", profileRow.entity_id).single();
      setEntityName(entity?.name || "");
      setEntityApproved(!!entity?.approved);
      const { data } = await supabase.from("print_orders").select("*").eq("printer_id", profileRow.entity_id).order("created_at", { ascending: false });
      setOrders(data || []);
    }
    setLoading(false);
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from("agency_requests").update({ status }).eq("id", id);
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  const startConfirm = (order: PrintOrder) => {
    setConfirmingId(order.id);
    setConfirmForm({ material: order.material || "", paper_type: order.paper_type || "", confirmed_size: order.confirmed_size || "" });
  };

  const submitConfirm = async (order: PrintOrder) => {
    if (!confirmForm.material || !confirmForm.paper_type || !confirmForm.confirmed_size) return;
    await supabase.from("print_orders").update({
      material: confirmForm.material, paper_type: confirmForm.paper_type,
      confirmed_size: confirmForm.confirmed_size, status: "confirmed",
    }).eq("id", order.id);
    setOrders(os => os.map(o => o.id === order.id ? { ...o, ...confirmForm, status: "confirmed" } : o));
    setConfirmingId(null);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("print_orders").update({ status }).eq("id", id);
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh(); };

  const navy = "#111827";
  const indigo = "#4f46e5";
  const sky = "#0ea5e9";

  if (loading) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif", color: "#6b7280" }}>Loading your board...</div>;

  if (notPartner) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, sans-serif", textAlign: "center" }}>
        <div>
          <p style={{ color: "#374151", marginBottom: 16, fontSize: 14 }}>This account isn't set up as a partner (design agency or print company).</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => router.push("/partner-signup")} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>Sign up as a partner</button>
            <button onClick={() => router.push("/dashboard")} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#374151", padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>Back to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const statuses = profile?.role === "agency" ? AGENCY_STATUSES : PRINTER_STATUSES;

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #000" }}>
        {profile?.role === "agency" ? <Palette size={16} color="#a78bfa" /> : <PrinterIcon size={16} color={sky} />}
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>{entityName || "Partner board"}</span>
        <span style={{ fontSize: 11, color: "#9ca3af", border: "1px solid #374151", borderRadius: 20, padding: "2px 10px" }}>{profile?.role === "agency" ? "Design agency" : "Print company"}</span>
        <button onClick={signOut} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "inherit" }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {!entityApproved && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92400e" }}>
          <AlertCircle size={15} /> Your listing is pending admin approval — customers can't see or send you requests yet.
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {profile?.role === "agency" ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Your design requests ({requests.length})</h2>
            {requests.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No requests yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {requests.map(r => (
                <div key={r.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>{r.message}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(r.created_at).toLocaleString("en-IN")}</span>
                    <select value={r.status} onChange={e => updateRequestStatus(r.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontFamily: "inherit" }}>
                      {AGENCY_STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, marginBottom: 16 }}>Your print orders ({orders.length})</h2>
            {orders.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No orders yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.map(o => (
                <div key={o.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: navy }}>{o.quantity} · ₹{Number(o.quoted_price).toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(o.created_at).toLocaleString("en-IN")}</span>
                  </div>

                  {o.material && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                      {o.material} · {o.paper_type} · {o.confirmed_size}
                    </div>
                  )}

                  {o.status === "requested" && confirmingId !== o.id && (
                    <button onClick={() => startConfirm(o)} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                      Confirm material & size
                    </button>
                  )}

                  {confirmingId === o.id && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <input placeholder="Material (e.g. Art paper)" value={confirmForm.material} onChange={e => setConfirmForm({ ...confirmForm, material: e.target.value })} style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <input placeholder="Paper GSM/type" value={confirmForm.paper_type} onChange={e => setConfirmForm({ ...confirmForm, paper_type: e.target.value })} style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <input placeholder="Confirmed size" value={confirmForm.confirmed_size} onChange={e => setConfirmForm({ ...confirmForm, confirmed_size: e.target.value })} style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <button onClick={() => submitConfirm(o)} style={{ gridColumn: "1 / -1", background: "#10b981", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px", cursor: "pointer", fontFamily: "inherit" }}>Save & confirm</button>
                    </div>
                  )}

                  {o.status !== "requested" && (
                    <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontFamily: "inherit" }}>
                      {PRINTER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
