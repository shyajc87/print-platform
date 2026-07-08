"use client";
import { useEffect, useState } from "react";
import { Sparkles, Star, CheckCircle2, FileText, Download, Printer as PrinterIcon } from "lucide-react";

const STEP_DURATION_MS = 5500;
const STEPS = ["01 · SUBMIT BRIEF", "02 · AI GENERATES DESIGNS", "03 · CHOOSE A PRINTER"];

const BRAND_NAME = "Green Acres Estates";

export default function LiveDemo() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [typedLen, setTypedLen] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
  const [printerSelected, setPrinterSelected] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  // Advance the step loop
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep(s => (s + 1) % STEPS.length);
    }, STEP_DURATION_MS);
    return () => clearInterval(stepTimer);
  }, []);

  // Reset per-step animation state whenever the step changes
  useEffect(() => {
    setProgress(0);
    setTypedLen(0);
    setSelectedConcept(null);
    setPrinterSelected(false);
    setPdfReady(false);

    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(100, p + 100 / (STEP_DURATION_MS / 60)));
    }, 60);

    let subTimers: ReturnType<typeof setTimeout>[] = [];
    if (step === 0) {
      const typeTimer = setInterval(() => {
        setTypedLen(l => (l < BRAND_NAME.length ? l + 1 : l));
      }, 70);
      subTimers.push(typeTimer as unknown as ReturnType<typeof setTimeout>);
    } else if (step === 1) {
      subTimers.push(setTimeout(() => setSelectedConcept(1), 2600));
    } else if (step === 2) {
      subTimers.push(setTimeout(() => setPrinterSelected(true), 1800));
      subTimers.push(setTimeout(() => setPdfReady(true), 3400));
    }

    return () => {
      clearInterval(progressTimer);
      subTimers.forEach(t => clearInterval(t as unknown as ReturnType<typeof setInterval>));
    };
  }, [step]);

  const navy = "#111827", indigo = "#4f46e5", sky = "#0ea5e9", green = "#10b981";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px 36px" }}>
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e7e5e0", boxShadow: "0 8px 30px rgba(17,24,39,.08)", background: "#fff" }}>
        {/* Browser chrome */}
        <div style={{ background: "#f8fafc", borderBottom: "1px solid #e7e5e0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center", background: "#fff", border: "1px solid #e7e5e0", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
            printai.app/brief/PB-2481
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.5px" }}>LIVE DEMO</span>
        </div>

        {/* Step tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e7e5e0" }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{
              flex: 1, textAlign: "center", padding: "10px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px",
              background: i === step ? navy : "#fff", color: i === step ? "#fff" : "#94a3b8",
              transition: "background .3s, color .3s",
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ minHeight: 300, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
          {step === 0 && (
            <div key="s0" style={{ animation: "demoFadeIn .4s ease" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
                Tell us about your brand
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 5 }}>Brand name</label>
                <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: navy, fontWeight: 500, minHeight: 20 }}>
                  {BRAND_NAME.slice(0, typedLen)}
                  <span style={{ opacity: typedLen < BRAND_NAME.length ? 1 : 0, borderRight: `2px solid ${indigo}`, marginLeft: 1 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {["Real Estate", "A4 Bifold", "Premium"].map(tag => (
                  <span key={tag} style={{ background: "#eef2ff", color: indigo, border: "1px solid #c7d2fe", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>{tag}</span>
                ))}
              </div>
              <button style={{ background: indigo, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, padding: "11px 20px", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}>
                <Sparkles size={14} /> Generate designs
              </button>
            </div>
          )}

          {step === 1 && (
            <div key="s1" style={{ animation: "demoFadeIn .4s ease" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
                3 AI concepts, ready in seconds
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: selectedConcept === i ? `2px solid ${green}` : "1px solid #e2e8f0", position: "relative" }}>
                    <div style={{
                      height: 110,
                      background: i === 0 ? "linear-gradient(135deg,#1e293b,#64748b)" : i === 1 ? "linear-gradient(135deg,#92400e,#f59e0b)" : "linear-gradient(135deg,#0f172a,#3b82f6)",
                      position: "relative",
                    }}>
                      {selectedConcept === null && (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent)", animation: "demoShimmer 1.4s infinite" }} />
                      )}
                      <div style={{ position: "absolute", left: 8, bottom: 8, color: "#fff", fontSize: 10, fontWeight: 700 }}>{BRAND_NAME.toUpperCase()}</div>
                    </div>
                    {selectedConcept === i && (
                      <div style={{ position: "absolute", top: 6, right: 6, background: green, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
                        <CheckCircle2 size={10} /> SELECTED
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="s2" style={{ animation: "demoFadeIn .4s ease" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
                Get a real quote, download print-ready
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1.5px solid ${printerSelected ? green : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14, transition: "border-color .3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PrinterIcon size={16} color="#e2e8f0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: navy }}>Chennai Digital Press</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" /> 4.8 · 1 day turnaround
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: navy }}>₹4,750</div>
                  {printerSelected && <div style={{ fontSize: 10, color: green, fontWeight: 600, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><CheckCircle2 size={11} /> Selected</div>}
                </div>
              </div>
              <div style={{ opacity: pdfReady ? 1 : 0.35, transition: "opacity .4s", display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px" }}>
                <FileText size={18} color={green} />
                <div style={{ flex: 1, fontSize: 12, color: "#15803d", fontWeight: 500 }}>green-acres-estates-print-ready.pdf</div>
                <Download size={16} color={green} />
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#f1f5f9" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: sky, transition: "width .06s linear" }} />
        </div>
      </div>

      <style>{`
        @keyframes demoFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes demoShimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
