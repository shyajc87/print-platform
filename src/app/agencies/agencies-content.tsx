"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Star, Send, CheckCircle, Phone, Mail, Palette } from "lucide-react";

interface Agency {
  id: string;
  name: string;
  city: string;
  specialty: string;
  rating: number;
  review_count: number;
  contact_phone: string;
  contact_email: string;
}

interface MyRequest {
  id: string;
  message: string;
  status: string;
  created_at: string;
  agency_id: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} fill={i <= Math.round(rating) ? "#f59e0b" : "none"} color="#f59e0b" />
      ))}
    </div>
  );
}

export default function AgenciesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get("id");
  const supabase = createClient();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("design_agencies").select("*").order("rating", { ascending: false });
      if (err) throw err;
      setAgencies(data || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mine } = await supabase.from("agency_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        setMyRequests(mine || []);
      }

      if (briefId) {
        const { data: brief } = await supabase.from("briefs").select("product_description").eq("id", briefId).single();
        if (brief?.product_description) setMessage(brief.product_description);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load designers.");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (agency: Agency) => {
    if (!message.trim()) { setError("Describe what you need before sending."); return; }
    setError("");
    setSending(agency.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error: insertErr } = await supabase.from("agency_requests").insert([{
        brief_id: briefId || null, agency_id: agency.id, user_id: user.id,
        message: message.trim(), status: "sent",
      }]);
      if (insertErr) throw insertErr;
      setSentTo(prev => ({ ...prev, [agency.id]: true }));
      const { data: mine } = await supabase.from("agency_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setMyRequests(mine || []);
    } catch (err) {
      console.error(err);
      setError("Failed to send request. Please try again.");
    } finally {
      setSending(null);
    }
  };

  const respondToRequest = async (id: string, status: string) => {
    await supabase.from("agency_requests").update({ status }).eq("id", id);
    setMyRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  const navy = "#111827";
  const indigo = "#4f46e5";
  const green = "#10b981";
  const purple = "#8b5cf6";

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #000" }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: "#374151" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>Custom designer</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: navy, marginBottom: 6 }}>Get a human designer</h2>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Prefer a real design agency over AI? Describe what you need and send it to one or more nearby studios.</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 14, padding: 18, marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Your requirement</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Need a trifold brochure for a new residential project in OMR, premium look, gold and navy tones, launch in 2 weeks."
            style={{ width: "100%", minHeight: 90, resize: "none", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#f8fafc" }}
          />
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}
        {myRequests.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: navy, marginBottom: 10 }}>Your sent requests</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myRequests.map(r => {
                const agency = agencies.find(a => a.id === r.agency_id);
                return (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #e7e5e0", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: navy }}>{agency?.name || "Agency"}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "#f3f4f6", padding: "3px 9px", borderRadius: 20, textTransform: "capitalize" }}>{r.status.replace("_", " ")}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", marginBottom: r.status === "completed" ? 10 : 0 }}>{r.message}</p>
                    {r.status === "completed" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => respondToRequest(r.id, "approved")} style={{ background: green, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                        <button onClick={() => respondToRequest(r.id, "changes_requested")} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#374151", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>Request changes</button>
                      </div>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => router.push(r.brief_id ? `/printers?id=${r.brief_id}` : "/printers")} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>Choose a printer</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && <p style={{ color: "#6b7280", fontSize: 14 }}>Loading designers...</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {agencies.map(agency => (
            <div key={agency.id} style={{ background: "#fff", border: "1.5px solid #e7e5e0", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Palette size={18} color="#fff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: navy }}>{agency.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                    <Stars rating={agency.rating} />
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{agency.rating} ({agency.review_count} reviews)</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{agency.specialty} · {agency.city}</div>
                </div>
              </div>

              {sentTo[agency.id] ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: green, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    <CheckCircle size={14} /> Request sent
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={11} /> {agency.contact_phone}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={11} /> {agency.contact_email}</div>
                </div>
              ) : (
                <button
                  onClick={() => sendRequest(agency)}
                  disabled={sending === agency.id}
                  style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                >
                  <Send size={13} /> {sending === agency.id ? "Sending..." : "Send requirement"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
