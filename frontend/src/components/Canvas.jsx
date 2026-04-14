import React, { useEffect, useRef, useCallback } from "react";
import useEditorStore from "../store/useEditorStore";
import "./Canvas.css";

const CanvasEditor = ({ onCanvasReady }) => {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const {
    activeTool, setCanvas, showGrid, setSelectedObject,
    setLayers, pushHistory, canvasWidth, canvasHeight,
  } = useEditorStore();

  /* ── Init Fabric canvas ── */
  useEffect(() => {
    const { fabric } = window;
    if (!fabric || !canvasElRef.current) return;

    const fc = new fabric.Canvas(canvasElRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    fabricRef.current = fc;
    setCanvas(fc);
    if (onCanvasReady) onCanvasReady(fc);

    // Selection events
    fc.on("selection:created", (e) => setSelectedObject(e.selected?.[0] || null));
    fc.on("selection:updated", (e) => setSelectedObject(e.selected?.[0] || null));
    fc.on("selection:cleared", () => setSelectedObject(null));

    // History on object modified
    const saveHistory = () => pushHistory(fc.toJSON());
    fc.on("object:added", saveHistory);
    fc.on("object:modified", saveHistory);
    fc.on("object:removed", saveHistory);

    // Layer sync
    const syncLayers = () => {
      const objs = fc.getObjects().map((o, i) => ({
        id: o.id || i,
        type: o.type,
        name: o.name || `${o.type} ${i + 1}`,
        visible: o.visible !== false,
      }));
      setLayers([...objs].reverse());
    };
    fc.on("object:added", syncLayers);
    fc.on("object:removed", syncLayers);
    fc.on("object:modified", syncLayers);

    return () => { fc.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Grid overlay ── */
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const { fabric } = window;

    // Remove old grid
    const oldGrid = fc.getObjects().filter((o) => o._isGrid);
    oldGrid.forEach((o) => fc.remove(o));

    if (showGrid) {
      const gridSize = 40;
      const w = fc.width;
      const h = fc.height;
      const lines = [];
      for (let x = 0; x <= w; x += gridSize) {
        lines.push(new fabric.Line([x, 0, x, h], {
          stroke: "rgba(124,58,237,0.12)", strokeWidth: 1,
          selectable: false, evented: false, _isGrid: true,
        }));
      }
      for (let y = 0; y <= h; y += gridSize) {
        lines.push(new fabric.Line([0, y, w, y], {
          stroke: "rgba(124,58,237,0.12)", strokeWidth: 1,
          selectable: false, evented: false, _isGrid: true,
        }));
      }
      lines.forEach((l) => fc.add(l));
      fc.sendToBack(...lines);
    }
    fc.renderAll();
  }, [showGrid]);

  /* ── Keyboard shortcuts ── */
  const handleKeyDown = useCallback((e) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();

    // Delete selected
    if ((e.key === "Delete" || e.key === "Backspace") && active && !active.isEditing) {
      fc.remove(active);
      fc.discardActiveObject();
      fc.renderAll();
    }
    // Undo
    if (e.ctrlKey && e.key === "z") {
      e.preventDefault();
      const store = useEditorStore.getState();
      if (store.historyIndex > 0) {
        const prev = store.history[store.historyIndex - 1];
        fc.loadFromJSON(prev, () => fc.renderAll());
        useEditorStore.setState({ historyIndex: store.historyIndex - 1 });
      }
    }
    // Redo
    if (e.ctrlKey && e.key === "y") {
      e.preventDefault();
      const store = useEditorStore.getState();
      if (store.historyIndex < store.history.length - 1) {
        const next = store.history[store.historyIndex + 1];
        fc.loadFromJSON(next, () => fc.renderAll());
        useEditorStore.setState({ historyIndex: store.historyIndex + 1 });
      }
    }
    // Duplicate
    if (e.ctrlKey && e.key === "d" && active) {
      e.preventDefault();
      active.clone((cloned) => {
        cloned.set({ left: active.left + 20, top: active.top + 20 });
        fc.add(cloned);
        fc.setActiveObject(cloned);
        fc.renderAll();
      });
    }
    // Bring to front
    if (e.key === "]" && active) { fc.bringToFront(active); fc.renderAll(); }
    // Send to back
    if (e.key === "[" && active) { fc.sendToBack(active); fc.renderAll(); }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="gafs-canvas-wrapper">
      <div className="gafs-canvas-container">
        <div className="gafs-canvas-shadow">
          <canvas ref={canvasElRef} id="gafs-fabric-canvas" />
        </div>
      </div>
      <div className="gafs-canvas-info">
        <span>{canvasWidth} × {canvasHeight}px</span>
        <span>•</span>
        <span>Del: delete · Ctrl+Z: undo · Ctrl+D: duplicate · [ ] : layer order</span>
      </div>
    </div>
  );
};

export default CanvasEditor;
