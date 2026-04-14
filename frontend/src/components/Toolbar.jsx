import React, { useRef } from "react";
import useEditorStore from "../store/useEditorStore";
import { uploadImage } from "../api/client";
import "./Toolbar.css";

const tools = [
  { id: "select", icon: "cursor", label: "Select", shortcut: "V" },
  { id: "text",   icon: "text",   label: "Text",   shortcut: "T" },
  { id: "rect",   icon: "rect",   label: "Rectangle", shortcut: "R" },
  { id: "circle", icon: "circle", label: "Circle",    shortcut: "C" },
  { id: "triangle", icon: "triangle", label: "Triangle", shortcut: "" },
  { id: "image",  icon: "image",  label: "Image",  shortcut: "I" },
  { id: "brush",  icon: "brush",  label: "Brush",  shortcut: "B" },
];

const ToolIcon = ({ id }) => {
  const icons = {
    cursor: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 3l14 9-7 1-3 7L5 3z"/>
      </svg>
    ),
    text: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
      </svg>
    ),
    rect: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
      </svg>
    ),
    circle: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
      </svg>
    ),
    triangle: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3L22 21H2L12 3z"/>
      </svg>
    ),
    image: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
    brush: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08M7.07 14.94C3.9 16.16 2 18.47 2 22c2.35-.63 4.57-1.48 6.93-2.07"/>
      </svg>
    ),
  };
  return icons[id] || null;
};

const Toolbar = () => {
  const { 
    activeTool, setActiveTool, canvas, toggleGrid, showGrid, 
    setActivePanel, activePanel, undo, redo, canUndo, canRedo 
  } = useEditorStore();
  const fileInputRef = useRef(null);

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (!canvas) return;

    if (toolId === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    } else if (toolId === "brush") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 4;
      canvas.freeDrawingBrush.color = "#7C3AED";
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = false;
    }

    if (toolId === "text") addText();
    else if (toolId === "rect") addRect();
    else if (toolId === "circle") addCircle();
    else if (toolId === "triangle") addTriangle();
    else if (toolId === "image") fileInputRef.current?.click();
  };

  const addText = () => {
    if (!canvas) return;
    const { fabric } = window;
    const text = new fabric.IText("Double-click to edit", {
      left: 150, top: 150,
      fontSize: 28,
      fontFamily: "Inter, sans-serif",
      fill: "#1a1a2e",
      fontWeight: "700",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setActiveTool("select");
    canvas.selection = true;
  };

  const addRect = () => {
    if (!canvas) return;
    const { fabric } = window;
    const rect = new fabric.Rect({
      left: 100, top: 100, width: 180, height: 120,
      fill: "#7C3AED", rx: 8, ry: 8, opacity: 0.85,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setActiveTool("select");
    canvas.selection = true;
  };

  const addCircle = () => {
    if (!canvas) return;
    const { fabric } = window;
    const circle = new fabric.Circle({
      left: 120, top: 120, radius: 70,
      fill: "#2DD4BF", opacity: 0.85,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    setActiveTool("select");
    canvas.selection = true;
  };

  const addTriangle = () => {
    if (!canvas) return;
    const { fabric } = window;
    const tri = new fabric.Triangle({
      left: 120, top: 120, width: 140, height: 130,
      fill: "#F59E0B", opacity: 0.85,
    });
    canvas.add(tri);
    canvas.setActiveObject(tri);
    canvas.renderAll();
    setActiveTool("select");
    canvas.selection = true;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;
    try {
      const res = await uploadImage(file);
      const url = `http://localhost:8000${res.data.url}`;
      const { fabric } = window;
      fabric.Image.fromURL(url, (img) => {
        const maxW = canvas.width * 0.5;
        if (img.width > maxW) img.scaleToWidth(maxW);
        img.set({ left: 80, top: 80 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    } catch (err) {
      console.error("Upload failed:", err);
    }
    e.target.value = "";
    setActiveTool("select");
    canvas.selection = true;
  };

  return (
    <aside className="gafs-toolbar">
      <div className="gafs-toolbar__tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`gafs-tool-btn ${activeTool === tool.id ? "gafs-tool-btn--active" : ""}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
          >
            <ToolIcon id={tool.icon} />
            <span className="gafs-tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="gafs-toolbar__divider" />

      <div className="gafs-toolbar__history">
        <button
          className="gafs-tool-btn"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />
          </svg>
          <span className="gafs-tool-label">Undo</span>
        </button>
        <button
          className="gafs-tool-btn"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13" />
          </svg>
          <span className="gafs-tool-label">Redo</span>
        </button>
      </div>

      <div className="gafs-toolbar__divider" />

      <div className="gafs-toolbar__extras">
        <button
          className={`gafs-tool-btn ${showGrid ? "gafs-tool-btn--active" : ""}`}
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
          </svg>
          <span className="gafs-tool-label">Grid</span>
        </button>

        <button
          className={`gafs-tool-btn gafs-tool-btn--ai ${activePanel === "ai" ? "gafs-tool-btn--active" : ""}`}
          onClick={() => setActivePanel("ai")}
          title="AI Studio"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4z"/>
            <path d="M12 10v4m0 4h.01M8.25 20.25l3.75-6 3.75 6"/>
          </svg>
          <span className="gafs-tool-label">AI</span>
        </button>

        <button
          className={`gafs-tool-btn ${activePanel === "mockup" ? "gafs-tool-btn--active" : ""}`}
          onClick={() => setActivePanel("mockup")}
          title="Mockup Generator"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span className="gafs-tool-label">Mockup</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
    </aside>
  );
};

export default Toolbar;
