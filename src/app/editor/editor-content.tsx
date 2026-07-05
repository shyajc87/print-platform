"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPageSizeMm } from "@/lib/templates";
import {
  Type, Square, Circle as CircleIcon, Image as ImageIcon, Sparkles, Undo2, Redo2,
  Trash2, BringToFront, SendToBack, Save, Download, ArrowLeft, Loader2, ZoomIn, ZoomOut,
  Maximize, QrCode, Star, Heart, CheckCircle2, MapPin, Phone, Home as HomeIcon, Award, ArrowRight as ArrowRightIcon,
  Image as LogoIcon, Palette,
} from "lucide-react";

interface Brief {
  id: string; brand_name: string; industry: string; product_description: string;
  key_message?: string; target_audience?: string; primary_colour?: string;
  secondary_colour?: string; size?: string; additional_notes?: string; location?: string;
  logo_url?: string | null;
}

type Family = "hero" | "grid" | "corporate" | "blank";
type Side = "front" | "back";

const CANVAS_BASE_WIDTH = 500;

// A small self-contained clipart set — simple, recognizable shapes, no
// external icon library dependency (kept as raw SVG strings for fabric to load).
const CLIPART: { name: string; Icon: any; svg: string }[] = [
  { name: "Star", Icon: Star, svg: `<svg viewBox="0 0 24 24"><path fill="#f59e0b" d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6z"/></svg>` },
  { name: "Heart", Icon: Heart, svg: `<svg viewBox="0 0 24 24"><path fill="#e24b4a" d="M12 21s-7.5-4.6-10-9.3C.5 8.3 2.4 5 6 5c2 0 3.4 1 6 3.4C14.6 6 16 5 18 5c3.6 0 5.5 3.3 4 6.7C19.5 16.4 12 21 12 21z"/></svg>` },
  { name: "Check", Icon: CheckCircle2, svg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b981"/><path fill="#fff" d="M9.5 16.2 5.8 12.5l1.4-1.4 2.3 2.3 6-6 1.4 1.4z"/></svg>` },
  { name: "Location", Icon: MapPin, svg: `<svg viewBox="0 0 24 24"><path fill="#e24b4a" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>` },
  { name: "Phone", Icon: Phone, svg: `<svg viewBox="0 0 24 24"><path fill="#0ea5e9" d="M6.6 10.8c1.4 2.7 3.7 5 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1z"/></svg>` },
  { name: "Home", Icon: HomeIcon, svg: `<svg viewBox="0 0 24 24"><path fill="#7c3aed" d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>` },
  { name: "Badge", Icon: Award, svg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6" fill="#f59e0b"/><path fill="#f59e0b" d="M8.5 14 6 21l6-3 6 3-2.5-7z"/></svg>` },
  { name: "Arrow", Icon: ArrowRightIcon, svg: `<svg viewBox="0 0 24 24"><path fill="#111827" d="M4 11h13.2l-4.6-4.6L14 5l7 7-7 7-1.4-1.4 4.6-4.6H4z"/></svg>` },
];

export default function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get("id");
  const bgParam = searchParams.get("bg");
  const supabase = createClient();

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const fabricCanvasRef = useRef<any>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const suppressHistoryRef = useRef(false);
  const sideJsonRef = useRef<{ front: any; back: any }>({ front: null, back: null });

  const [brief, setBrief] = useState<Brief | null>(null);
  const [pageSize, setPageSize] = useState({ w: 210, h: 297 });
  const [gallery, setGallery] = useState(true);
  const [ready, setReady] = useState(false);
  const [side, setSide] = useState<Side>("front");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFill, setSelectedFill] = useState("#111827");
  const [selectedFontSize, setSelectedFontSize] = useState(28);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState<{ id: number; label: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showClipart, setShowClipart] = useState(false);
  const [error, setError] = useState("");

  const canvasHeight = Math.round(CANVAS_BASE_WIDTH * (pageSize.h / pageSize.w));

  useEffect(() => {
    if (!briefId) { setReady(true); return; }
    (async () => {
      const { data } = await supabase.from("briefs").select("*").eq("id", briefId).single();
      if (data) { setBrief(data); setPageSize(getPageSizeMm(data.size)); }
      setReady(true);
    })();
  }, [briefId]);

  const [pendingFamily, setPendingFamily] = useState<Family | null>(null);
  const canvasBuiltRef = useRef(false);

  useEffect(() => {
    if (ready && bgParam && gallery) { setPendingFamily("blank"); setGallery(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, bgParam]);

  const refreshLayers = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const objs = canvas.getObjects();
    setLayers(objs.map((o: any, i: number) => ({
      id: i,
      label: o.type === "i-text" || o.type === "text" ? `Text: ${(o.text || "").slice(0, 18)}` : o.type === "image" ? "Image" : o.type === "rect" ? "Rectangle" : o.type === "circle" ? "Circle" : (o.type === "group" ? "Clipart" : o.type),
    })).reverse());
  }, []);

  const pushHistory = useCallback(() => {
    if (suppressHistoryRef.current) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > 40) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    refreshLayers();
  }, [refreshLayers]);

  // The <canvas> element only exists in the DOM once `gallery` is false, so
  // the actual fabric.Canvas construction has to happen AFTER that render —
  // not inside the click handler itself, which fires while the gallery
  // screen (with no <canvas> yet) is still showing.
  const buildCanvas = useCallback(async (family: Family) => {
    const fabric = await import("fabric");
    fabricRef.current = fabric;
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: CANVAS_BASE_WIDTH, height: canvasHeight, backgroundColor: "#ffffff",
    });
    fabricCanvasRef.current = canvas;

    canvas.on("selection:created", (e: any) => onSelect(e.selected?.[0]));
    canvas.on("selection:updated", (e: any) => onSelect(e.selected?.[0]));
    canvas.on("selection:cleared", () => setSelectedType(null));
    canvas.on("object:modified", pushHistory);
    canvas.on("object:added", pushHistory);
    canvas.on("object:removed", pushHistory);

    if (family !== "blank") applyStarterLayout(fabric, canvas, family, brief);

    if (bgParam) {
      try {
        const img = await fabric.FabricImage.fromURL(bgParam, { crossOrigin: "anonymous" });
        img.scaleToWidth(CANVAS_BASE_WIDTH);
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
      } catch { /* ignore, fall back to whatever the layout already has */ }
    }

    sideJsonRef.current.front = canvas.toJSON();
    sideJsonRef.current.back = null;

    suppressHistoryRef.current = true;
    setTimeout(() => { suppressHistoryRef.current = false; pushHistory(); }, 50);
  }, [brief, canvasHeight, pushHistory, bgParam]);

  // Runs once the editor screen (and its <canvas> element) has actually mounted.
  useEffect(() => {
    if (!gallery && pendingFamily && !canvasBuiltRef.current) {
      canvasBuiltRef.current = true;
      buildCanvas(pendingFamily);
    }
  }, [gallery, pendingFamily, buildCanvas]);

  const initCanvas = (family: Family) => {
    setPendingFamily(family);
    setGallery(false);
  };


  function onSelect(obj: any) {
    if (!obj) { setSelectedType(null); return; }
    setSelectedType(obj.type);
    setSelectedFill(obj.fill || "#111827");
    if (obj.type === "i-text" || obj.type === "text") setSelectedFontSize(obj.fontSize || 28);
  }

  function applyStarterLayout(fabric: any, canvas: any, family: Family, brief: Brief | null) {
    const w = CANVAS_BASE_WIDTH, h = canvasHeight;
    const brand = brief?.brand_name || "Your Brand";
    const tagline = brief?.key_message || "Your tagline here";
    const bullets = (brief?.product_description || "Detail one, Detail two, Detail three")
      .split(/[,•\n]/).map(s => s.trim()).filter(Boolean).slice(0, 4);
    const notes = brief?.additional_notes || brief?.target_audience || "Contact info here";
    const accent = brief?.primary_colour && /^#[0-9a-fA-F]{3,8}$/.test(brief.primary_colour) ? brief.primary_colour : (family === "grid" ? "#b91c1c" : family === "corporate" ? "#0f172a" : "#1e293b");

    if (family === "hero") {
      const heroH = h * 0.56;
      canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: heroH, fill: "#94a3b8", selectable: true }));
      canvas.add(new fabric.IText(brand.toUpperCase(), { left: w * 0.06, top: heroH - 70, fontSize: 30, fontWeight: "bold", fill: "#ffffff" }));
      canvas.add(new fabric.IText(tagline, { left: w * 0.06, top: heroH - 32, fontSize: 14, fill: "#ffffff" }));
      let y = heroH + 24;
      bullets.forEach(b => { canvas.add(new fabric.IText(`—  ${b}`, { left: w * 0.06, top: y, fontSize: 13, fill: "#1f2937" })); y += 24; });
      canvas.add(new fabric.Rect({ left: 0, top: h - 40, width: w, height: 40, fill: accent }));
      canvas.add(new fabric.IText(brand, { left: w * 0.06, top: h - 30, fontSize: 12, fontWeight: "bold", fill: "#ffffff" }));
      canvas.add(new fabric.IText(notes, { left: w * 0.5, top: h - 30, fontSize: 10, fill: "#ffffff" }));
    } else if (family === "grid") {
      canvas.add(new fabric.IText(brand, { left: w * 0.06, top: 20, fontSize: 24, fontWeight: "bold", fill: accent }));
      canvas.add(new fabric.IText(tagline, { left: w * 0.06, top: 52, fontSize: 12, fill: "#6b7280" }));
      canvas.add(new fabric.Rect({ left: w * 0.06, top: 90, width: w * 0.88, height: h * 0.5, rx: 10, ry: 10, fill: "#94a3b8" }));
      let x = w * 0.06, y = 90 + h * 0.5 + 16;
      bullets.forEach(b => {
        const chip = new fabric.IText(b, { left: x, top: y, fontSize: 11, fill: accent, backgroundColor: "#fef2f2" });
        canvas.add(chip); x += (chip.width || 60) + 20;
      });
      canvas.add(new fabric.Rect({ left: 0, top: h - 40, width: w, height: 40, fill: accent }));
      canvas.add(new fabric.IText(brand, { left: w * 0.06, top: h - 30, fontSize: 12, fontWeight: "bold", fill: "#ffffff" }));
      canvas.add(new fabric.IText(notes, { left: w * 0.5, top: h - 30, fontSize: 10, fill: "#ffffff" }));
    } else {
      const leftW = w * 0.42;
      canvas.add(new fabric.Rect({ left: 0, top: 0, width: leftW, height: h - 40, fill: accent }));
      canvas.add(new fabric.Rect({ left: leftW, top: 0, width: w - leftW, height: h - 40, fill: "#94a3b8" }));
      canvas.add(new fabric.IText(brand, { left: 20, top: 24, fontSize: 20, fontWeight: "bold", fill: "#ffffff", width: leftW - 40 }));
      canvas.add(new fabric.IText(tagline, { left: 20, top: 60, fontSize: 12, fill: "#e2e8f0", width: leftW - 40 }));
      let y = 100;
      bullets.forEach(b => { canvas.add(new fabric.IText(`✓ ${b}`, { left: 20, top: y, fontSize: 11, fill: "#ffffff", width: leftW - 40 })); y += 22; });
      canvas.add(new fabric.Rect({ left: 0, top: h - 40, width: w, height: 40, fill: accent }));
      canvas.add(new fabric.IText(brief?.industry || "industry", { left: 20, top: h - 30, fontSize: 11, fill: "#ffffff" }));
      canvas.add(new fabric.IText(brief?.location || "", { left: w * 0.6, top: h - 30, fontSize: 11, fill: "#ffffff" }));
    }
    canvas.renderAll();
  }

  // ---- Front / Back ----
  const switchSide = async (newSide: Side) => {
    if (newSide === side) return;
    const canvas = fabricCanvasRef.current;
    sideJsonRef.current[side] = canvas.toJSON();
    suppressHistoryRef.current = true;
    if (sideJsonRef.current[newSide]) {
      await canvas.loadFromJSON(sideJsonRef.current[newSide]);
    } else {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
    }
    canvas.renderAll();
    setSide(newSide);
    historyRef.current = [JSON.stringify(canvas.toJSON())];
    historyIndexRef.current = 0;
    suppressHistoryRef.current = false;
    refreshLayers();
  };

  // ---- Toolbar actions ----
  const addText = () => {
    const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
    const t = new fabric.IText("Edit me", { left: 60, top: 60, fontSize: 24, fill: "#111827" });
    canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
  };
  const addRect = () => {
    const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
    const r = new fabric.Rect({ left: 60, top: 60, width: 120, height: 80, fill: "#0ea5e9" });
    canvas.add(r); canvas.setActiveObject(r); canvas.renderAll();
  };
  const addCircle = () => {
    const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
    const c = new fabric.Circle({ left: 60, top: 60, radius: 50, fill: "#8b5cf6" });
    canvas.add(c); canvas.setActiveObject(c); canvas.renderAll();
  };
  const addImageFile = (file: File) => {
    const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
    const reader = new FileReader();
    reader.onload = async () => {
      const img = await fabric.FabricImage.fromURL(reader.result as string, { crossOrigin: "anonymous" });
      img.scaleToWidth(200);
      canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
    };
    reader.readAsDataURL(file);
  };
  const addLogo = async () => {
    const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
    if (brief?.logo_url) {
      try {
        const img = await fabric.FabricImage.fromURL(brief.logo_url, { crossOrigin: "anonymous" });
        img.scaleToWidth(90);
        img.set({ left: 20, top: 20 });
        canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
        return;
      } catch { /* fall through to manual upload */ }
    }
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => { if (input.files?.[0]) addImageFile(input.files[0]); };
    input.click();
  };
  const addClipart = async (svg: string) => {
    const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
    setShowClipart(false);
    try {
      const result = await fabric.loadSVGFromString(svg);
      const obj = fabric.util.groupSVGElements(result.objects, result.options);
      obj.scaleToWidth(60);
      obj.set({ left: 80, top: 80 });
      canvas.add(obj); canvas.setActiveObject(obj); canvas.renderAll(); pushHistory();
    } catch (e) {
      setError("Couldn't add clipart: " + (e instanceof Error ? e.message : "unknown error"));
    }
  };
  const addQrCode = async () => {
    const text = window.prompt("Enter the URL or text for the QR code:");
    if (!text) return;
    setAiLoading(true); setError("");
    try {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(text, { width: 300, margin: 1 });
      const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
      const img = await fabric.FabricImage.fromURL(dataUrl);
      img.scaleToWidth(100);
      img.set({ left: 60, top: 60 });
      canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); pushHistory();
    } catch (e) {
      setError("Couldn't generate QR code: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setAiLoading(false);
    }
  };
  const generateAiImage = async () => {
    setAiLoading(true); setError("");
    try {
      const res = await fetch("/api/ai-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefId ? { briefId } : { prompt: `${brief?.brand_name || "brand"} ${brief?.industry || ""} background` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      const fabric = fabricRef.current, canvas = fabricCanvasRef.current;
      const img = await fabric.FabricImage.fromURL(data.imageUrl, { crossOrigin: "anonymous" });
      img.scaleToWidth(CANVAS_BASE_WIDTH);
      canvas.add(img); canvas.sendObjectToBack(img); canvas.renderAll(); pushHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };
  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas.getActiveObject();
    if (obj) { canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); }
  };
  const bringForward = () => { const c = fabricCanvasRef.current; const o = c.getActiveObject(); if (o) { c.bringObjectForward(o); c.renderAll(); pushHistory(); } };
  const sendBackward = () => { const c = fabricCanvasRef.current; const o = c.getActiveObject(); if (o) { c.sendObjectBackwards(o); c.renderAll(); pushHistory(); } };
  const applyFill = (color: string) => {
    setSelectedFill(color);
    const c = fabricCanvasRef.current; const o = c.getActiveObject();
    if (o) { o.set("fill", color); c.renderAll(); pushHistory(); }
  };
  const applyFontSize = (size: number) => {
    setSelectedFontSize(size);
    const c = fabricCanvasRef.current; const o = c.getActiveObject();
    if (o) { o.set("fontSize", size); c.renderAll(); pushHistory(); }
  };
  const applyBgColor = (color: string) => {
    setBgColor(color);
    const c = fabricCanvasRef.current;
    if (c) { c.backgroundColor = color; c.renderAll(); pushHistory(); }
  };
  const selectLayer = (indexFromTop: number) => {
    const c = fabricCanvasRef.current;
    const objs = c.getObjects();
    const obj = objs[objs.length - 1 - indexFromTop];
    if (obj) { c.setActiveObject(obj); c.renderAll(); onSelect(obj); }
  };

  // ---- Zoom (uses fabric's native zoom + canvas dimensions, so mouse/object
  // coordinates stay correct — a pure CSS transform would throw off clicks) ----
  const applyZoom = (newZoom: number) => {
    const clamped = Math.max(0.3, Math.min(3, newZoom));
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.setZoom(clamped);
    canvas.setDimensions({ width: CANVAS_BASE_WIDTH * clamped, height: canvasHeight * clamped });
    setZoom(clamped);
  };
  const zoomIn = () => applyZoom(zoom * 1.15);
  const zoomOut = () => applyZoom(zoom / 1.15);
  const resetZoom = () => applyZoom(1);

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    suppressHistoryRef.current = true;
    fabricCanvasRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
      fabricCanvasRef.current.renderAll(); suppressHistoryRef.current = false; refreshLayers();
    });
  };
  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    suppressHistoryRef.current = true;
    fabricCanvasRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
      fabricCanvasRef.current.renderAll(); suppressHistoryRef.current = false; refreshLayers();
    });
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const canvas = fabricCanvasRef.current;
      sideJsonRef.current[side] = canvas.toJSON();

      const previewDataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
      const blob = await (await fetch(previewDataUrl)).blob();
      const path = `${briefId || "custom"}/editor-preview-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("designs").upload(path, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("designs").getPublicUrl(path);

      await supabase.from("designs").insert([{
        brief_id: briefId || null, image_url: pub.publicUrl,
        canvas_json: { front: sideJsonRef.current.front, back: sideJsonRef.current.back },
        ai_prompt: "[editor] user-edited design", version_number: 0, status: "pending",
      }]);
      if (briefId) await supabase.from("briefs").update({ status: "designs_ready" }).eq("id", briefId);
      alert("Saved! Find it in your designs list.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    setExporting(true); setError("");
    try {
      const canvas = fabricCanvasRef.current;
      const currentSide = side;
      sideJsonRef.current[currentSide] = canvas.toJSON();
      const zoomBefore = zoom;
      if (zoomBefore !== 1) { canvas.setZoom(1); canvas.setDimensions({ width: CANVAS_BASE_WIDTH, height: canvasHeight }); }

      // Temporarily load whichever side isn't currently on-screen so we can
      // export its SVG too, then restore the view exactly as the user left it.
      const pages: string[] = [];
      const order: Side[] = ["front", "back"];
      for (const s of order) {
        if (!sideJsonRef.current[s]) continue;
        if (s !== currentSide) { suppressHistoryRef.current = true; await canvas.loadFromJSON(sideJsonRef.current[s]); }
        pages.push(canvas.toSVG());
      }
      // restore original view
      suppressHistoryRef.current = true;
      await canvas.loadFromJSON(sideJsonRef.current[currentSide]);
      if (zoomBefore !== 1) { canvas.setZoom(zoomBefore); canvas.setDimensions({ width: CANVAS_BASE_WIDTH * zoomBefore, height: canvasHeight * zoomBefore }); }
      canvas.renderAll();
      suppressHistoryRef.current = false;

      const res = await fetch("/api/export-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages, widthMm: pageSize.w, heightMm: pageSize.h, briefId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      window.open(data.pdfUrl, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const navy = "#111827", indigo = "#4f46e5", sky = "#0ea5e9";
  const toolBtn: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

  if (!ready) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif", color: "#6b7280" }}>Loading...</div>;

  if (gallery) {
    const cards: { family: Family; label: string; bg: string }[] = [
      { family: "hero", label: "Hero layout", bg: "linear-gradient(#1e293b, #94a3b8)" },
      { family: "grid", label: "Grid layout", bg: "linear-gradient(#b91c1c, #94a3b8)" },
      { family: "corporate", label: "Corporate layout", bg: "linear-gradient(90deg, #0f172a 42%, #94a3b8 42%)" },
      { family: "blank", label: "Start blank", bg: "#f1f5f9" },
    ];
    return (
      <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ background: navy, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, fontFamily: "inherit" }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>Choose a starting point</span>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          {cards.map(c => (
            <div key={c.family} onClick={() => initCanvas(c.family)} style={{ cursor: "pointer", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ height: 160, background: c.bg }} />
              <div style={{ padding: 12, fontSize: 13, fontWeight: 600, color: navy, textAlign: "center" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: navy, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setGallery(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, fontFamily: "inherit" }}>
          <ArrowLeft size={15} /> Layouts
        </button>
        <div style={{ width: 1, height: 20, background: "#374151" }} />

        <div style={{ display: "flex", background: "#1f2937", borderRadius: 8, padding: 2 }}>
          <button onClick={() => switchSide("front")} style={{ background: side === "front" ? "#374151" : "none", border: "none", color: "#f9fafb", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Front</button>
          <button onClick={() => switchSide("back")} style={{ background: side === "back" ? "#374151" : "none", border: "none", color: "#f9fafb", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
        </div>
        <div style={{ width: 1, height: 20, background: "#374151" }} />

        <button onClick={addText} title="Add text" style={toolBtn}><Type size={16} /></button>
        <button onClick={addRect} title="Add rectangle" style={toolBtn}><Square size={16} /></button>
        <button onClick={addCircle} title="Add circle" style={toolBtn}><CircleIcon size={16} /></button>
        <label title="Upload image" style={{ ...toolBtn, cursor: "pointer" }}>
          <ImageIcon size={16} />
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addImageFile(e.target.files[0])} />
        </label>
        <button onClick={addLogo} title="Add logo" style={toolBtn}><LogoIcon size={16} /></button>
        <button onClick={addQrCode} title="Add QR code" style={toolBtn}><QrCode size={16} /></button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowClipart(s => !s)} title="Clipart" style={toolBtn}><Palette size={16} /></button>
          {showClipart && (
            <div style={{ position: "absolute", top: "110%", left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, zIndex: 10, boxShadow: "0 4px 20px rgba(0,0,0,.12)" }}>
              {CLIPART.map(c => (
                <button key={c.name} onClick={() => addClipart(c.svg)} title={c.name} style={{ ...toolBtn, width: 36, height: 36 }}>
                  <c.Icon size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={generateAiImage} disabled={aiLoading} title="Generate with AI" style={{ ...toolBtn, background: "#f5f3ff", borderColor: "#c4b5fd" }}>
          {aiLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={16} color="#7c3aed" />}
        </button>
        <div style={{ width: 1, height: 20, background: "#374151" }} />
        <button onClick={undo} title="Undo" style={toolBtn}><Undo2 size={16} /></button>
        <button onClick={redo} title="Redo" style={toolBtn}><Redo2 size={16} /></button>
        <button onClick={bringForward} title="Bring forward" style={toolBtn}><BringToFront size={16} /></button>
        <button onClick={sendBackward} title="Send backward" style={toolBtn}><SendToBack size={16} /></button>
        <button onClick={deleteSelected} title="Delete" style={toolBtn}><Trash2 size={16} /></button>
        <div style={{ width: 1, height: 20, background: "#374151" }} />
        <button onClick={zoomOut} title="Zoom out" style={toolBtn}><ZoomOut size={16} /></button>
        <span style={{ color: "#9ca3af", fontSize: 12, minWidth: 38, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} title="Zoom in" style={toolBtn}><ZoomIn size={16} /></button>
        <button onClick={resetZoom} title="Reset zoom" style={toolBtn}><Maximize size={16} /></button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ background: indigo, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={exportPdf} disabled={exporting} style={{ background: "#10b981", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Download size={14} /> {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "8px 20px", fontSize: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 16, padding: 20 }}>
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Layers ({side})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
            {layers.map(l => (
              <button key={l.id} onClick={() => selectLayer(l.id)} style={{ textAlign: "left", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{l.label}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Page background</div>
          <input type="color" value={bgColor} onChange={e => applyBgColor(e.target.value)} style={{ width: "100%", height: 32 }} />
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", overflow: "auto" }}>
          <div style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,.1)", height: "fit-content" }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>

        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Properties</div>
          {selectedType ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748b" }}>Color</label>
                <input type="color" value={selectedFill} onChange={e => applyFill(e.target.value)} style={{ width: "100%", height: 32 }} />
              </div>
              {(selectedType === "i-text" || selectedType === "text") && (
                <div>
                  <label style={{ fontSize: 11, color: "#64748b" }}>Font size</label>
                  <input type="number" value={selectedFontSize} onChange={e => applyFontSize(parseInt(e.target.value, 10) || 12)} style={{ width: "100%", padding: 6, border: "1px solid #e2e8f0", borderRadius: 6 }} />
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#9ca3af" }}>Select an object to edit it.</p>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
