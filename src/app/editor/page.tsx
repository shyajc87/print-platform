import { Suspense } from "react";
import EditorContent from "./editor-content";

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#f0f4f8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading editor...</p>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
