import React, { useRef } from "react";
import useEditorStore from "../store/useEditorStore";
import { uploadImage } from "../api/client";
import "./Toolbar.css";

const tools = [
  { id: "move",    icon: "move",    label: "Pan",     shortcut: "Space" },
  { id: "select",  icon: "cursor",  label: "Select",  shortcut: "V" },
  { id: "text",    icon: "text",    label: "Text",    shortcut: "T" },
  { id: "rect",    icon: "rect",    label: "Shape",   shortcut: "R" },
  { id: "image",   icon: "image",   label: "Image",   shortcut: "I" },
  { id: "brush",   icon: "brush",   label: "Brush",   shortcut: "B" },
  { id: "eraser",  icon: "eraser",  label: "Eraser",  shortcut: "E" },
  { id: "mask",    icon: "mask",    label: "AI Mask", shortcut: "M" },
];

const ToolIcon = ({ id }) => {
  const icons = {
    move: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20"/></svg>
    ),
    cursor: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-3 7L5 3z"/></svg>
    ),
    text: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
    ),
    rect: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
    ),
    image: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
    ),
    brush: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08M7.07 14.94C3.9 16.16 2 18.47 2 22c2.35-.63 4.57-1.48 6.93-2.07"/></svg>
    ),
    eraser: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H4L20 4v16z"/></svg> // placeholder for eraser
    ),
    mask: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z" strokeDasharray="4 4" strokeDashoffset="0"/></svg>
    )
  };
  return icons[id] || null;
};

const Toolbar = () => {
  const { activeTool, setActiveTool, canvas, toggleGrid, showGrid, setActivePanel, activePanel } = useEditorStore();
  const fileInputRef = useRef(null);

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (!canvas) return;

    // Reset interactions
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.forEachObject(o => o.set('selectable', false));

    if (toolId === "select") {
      canvas.selection = true;
      canvas.forEachObject(o => {
        if (!o.isMask && !o._isGrid && !o.locked) o.set('selectable', true);
      });
      canvas.defaultCursor = 'default';
    } else if (toolId === "move") {
       canvas.defaultCursor = 'grab';
    } else if (toolId === "brush") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = "#7C3AED";
      canvas.freeDrawingBrush.strokeLineCap = "round";
      canvas.freeDrawingBrush.strokeLineJoin = "round";
    } else if (toolId === "mask") {
      // AI Masking brush uses a distinct neon green color and tags logic later
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 30;
      canvas.freeDrawingBrush.color = "rgba(0, 255, 128, 0.45)"; // Neon green semi transparent
      canvas.freeDrawingBrush.strokeLineCap = "round";
    } else if (toolId === "eraser") {
      // In Fabric, erasing is simulated by masking or drawing white. For now we use white.
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 20;
      canvas.freeDrawingBrush.color = "#ffffff";
    }

    // Shapes & Entities triggers
    if (toolId === "text") addText();
    else if (toolId === "rect") addRect();
    else if (toolId === "image") fileInputRef.current?.click();
  };

  const addText = () => {
    if (!canvas) return;
    const { fabric } = window;
    const text = new fabric.IText("Double-click to edit", {
      left: canvas.width/2 - 100, top: canvas.height/2,
      fontSize: 32, fontFamily: "Inter", fill: "#f0f0ff", fontWeight: "700",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    handleToolClick("select");
  };

  const addRect = () => {
    if (!canvas) return;
    const { fabric } = window;
    const rect = new fabric.Rect({
      left: canvas.width/2 - 50, top: canvas.height/2 - 50, width: 100, height: 100,
      fill: "#7C3AED", rx: 0, ry: 0, opacity: 1,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    handleToolClick("select");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;
    try {
      const res = await uploadImage(file);
      const url = `http://localhost:8000${res.data.url}`;
      const { fabric } = window;
      fabric.Image.fromURL(url, (img) => {
        // Downscale excessively large images physically to preserve performance
        if (img.width > 2000 || img.height > 2000) {
            const scale = 2000 / Math.max(img.width, img.height);
            img.scale(scale);
        }
        
        // Fit visually to canvas
        const maxW = canvas.width * 0.6;
        if (img.getScaledWidth() > maxW) {
            img.scaleToWidth(maxW);
        }
        
        img.set({ left: 50, top: 50 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    } catch (err) {
      console.error("Upload failed:", err);
    }
    e.target.value = "";
    handleToolClick("select");
  };

  return (
    <aside className="gafs-toolbar">
      <div className="gafs-toolbar__tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`gafs-tool-btn ${activeTool === tool.id ? "gafs-tool-btn--active" : ""}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.label} [${tool.shortcut}]`}
          >
            <ToolIcon id={tool.icon} />
            <span className="gafs-tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="gafs-toolbar__divider" />

      <div className="gafs-toolbar__extras">
        <button className={`gafs-tool-btn ${showGrid ? "gafs-tool-btn--active" : ""}`} onClick={toggleGrid} title="Snap Grid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
          <span className="gafs-tool-label">Grid</span>
        </button>

        <button className={`gafs-tool-btn ${activePanel === "mockup" ? "gafs-tool-btn--active" : ""}`} onClick={() => setActivePanel("mockup")} title="Live Mockup Generator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span className="gafs-tool-label">Mockup</span>
        </button>
      </div>

      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
    </aside>
  );
};

export default Toolbar;
