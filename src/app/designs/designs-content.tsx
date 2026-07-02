"use client";
import { Suspense } from "react";
import DesignsContent from "./designs-content";

export default function DesignsContent() {
  return (
    <Suspense fallback={
      <div style={{ background: "#f0f4f8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading designs...</p>
        </div>
      </div>
    }>
      <DesignsContent />
    </Suspense>
  );
}
