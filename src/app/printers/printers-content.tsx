"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Star, Clock, CheckCircle, Printer as PrinterIcon } from "lucide-react";

interface Printer {
  id: string;
  name: string;
  city: string;
  rating: number;
  review_count: number;
  pricing: Record<string, number>;
  turnaround_days: number;
}

interface Brief {
  id: string;
  brand_name: string;
  quantity: string;
  size: string;
}

const QUANTITY_OPTIONS = ["250 copies", "500 copies", "1,000 copies", "2,500 copies", "5,000 copies", "10,000+ copies"];

function parseQty(q: string): number {
  const digits = q.replace(/[^0-9]/g, "");
  return parseInt(digits || "0", 10);
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

export default function PrintersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get("id");
  const supabase = createClient();

  const [brief, setBrief] = useState<Brief | null>(null);
  const [manualQty, setManualQty] = useState(QUANTITY_OPTIONS[2]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ printer: Printer; total: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [briefId]);

  const load = async () => {
    setLoading(true);
    try {
      if (briefId) {
        const { data: briefData, error: briefErr } = await supabase
          .from("briefs").select("id, brand_name, quantity, size").eq("id", briefId).single();
        if (briefErr || !briefData) throw new Error("Brief not found");
        if (!briefData.quantity) { setError("This project has no print quantity set."); setLoading(false); return; }
        setBrief(briefData);
      }

      const { data: printerData, error: printerErr } = await supabase
        .from("printers").select("*").order("rating", { ascending: false });
      if (printerErr) throw printerErr;
      setPrinters(printerData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load printers.");
    } finally {
      setLoading(false);
    }
  };

  const activeQty = brief?.quantity || manualQty;

  const quoteFor = (printer: Printer): number | null => {
    const perUnit = printer.pricing[activeQty];
    if (perUnit == null) return null;
    return perUnit * parseQty(activeQty);
  };

  const sortedPrinters = [...printers]
    .map(p => ({ printer: p, total: quoteFor(p) }))
    .filter(x => x.total != null)
    .sort((a, b) => (a.total as number) - (b.total as number));

  const selectPrinter = async (printer: Printer, total: number) => {
    setSelecting(printer.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error: insertErr } = await supabase.from("print_orders").insert([{
        brief_id: brief?.id || null, printer_id: printer.id, user_id: user.id,
        quantity: activeQty, quoted_price: total, status: "requested",
      }]);
      if (insertErr) throw insertErr;
      setConfirmed({ printer, total });
    } catch (err) {
      console.error(err);
      setError("Failed to place print request. Please try again.");
    } finally {
      setSelecting(null);
    }
  };

  const navy = "#111827";
  const indigo = "#4f46e5";
  const green = "#10b981";

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #000" }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: "#374151" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>Choose a printer</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
        {loading && <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>Loading printers...</p>}
        {error && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>{error}</p>
            <button onClick={() => router.push("/dashboard")} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>Back to dashboard</button>
          </div>
        )}

        {!loading && !error && confirmed && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={26} color="#fff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: navy, marginBottom: 8 }}>Print request sent</h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              {confirmed.printer.name} has received your request for {activeQty} at ₹{confirmed.total.toLocaleString("en-IN")}.
            </p>
            <button onClick={() => router.push("/dashboard")} style={{ background: indigo, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 24px", cursor: "pointer", fontFamily: "inherit" }}>Back to dashboard</button>
          </div>
        )}

        {!loading && !error && !confirmed && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: navy, marginBottom: 6 }}>{brief ? `Printers for ${brief.brand_name}` : "Browse printers"}</h2>
              <p style={{ fontSize: 13, color: "#6b7280" }}>Showing quotes for {activeQty}, sorted lowest price first.</p>
            </div>

            {!brief && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Quantity</label>
                <select value={manualQty} onChange={e => setManualQty(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}>
                  {QUANTITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedPrinters.length === 0 && (
                <p style={{ color: "#6b7280", fontSize: 14 }}>No printers currently quote for this quantity tier.</p>
              )}
              {sortedPrinters.map(({ printer, total }, i) => (
                <div key={printer.id} style={{ background: "#fff", border: `1.5px solid ${i === 0 ? green : "#e7e5e0"}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PrinterIcon size={18} color="#e5e7eb" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: navy }}>{printer.name}</span>
                        {i === 0 && <span style={{ background: green, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>LOWEST PRICE</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        <Stars rating={printer.rating} />
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{printer.rating} ({printer.review_count} reviews)</span>
                        <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {printer.turnaround_days}d turnaround</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{printer.city}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: navy }}>₹{(total as number).toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>for {activeQty}</div>
                    <button
                      onClick={() => selectPrinter(printer, total as number)}
                      disabled={selecting === printer.id}
                      style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {selecting === printer.id ? "Sending..." : "Select this printer"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
