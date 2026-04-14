import React, { useEffect, useRef } from "react";
import useEditorStore from "../store/useEditorStore";
import "./Canvas.css";

const CanvasEditor = () => {
  const {
    setCanvas, setActiveTool, pushHistory,
    setLayers, setSelectedObject, activeTool,
    showGrid, setZoom, setIsSaved, canvasWidth, canvasHeight
  } = useEditorStore();
  const canvasRef = useRef(null);

  useEffect(() => {
    const { fabric } = window;
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#111115", /* default dark */
      preserveObjectStacking: true, // Crucial for layer logic
    });

    setCanvas(initCanvas);

    // Save initial state
    pushHistory(initCanvas.toJSON());

    const updateStore = () => {
      // Sync layer state to React
      const objects = initCanvas.getObjects().filter(o => !o._isGrid);
      setLayers([...objects].reverse()); // Top layer is index 0 in UI
      setIsSaved(false);
    };

    const handleSelect = () => {
      const activeObj = initCanvas.getActiveObject();
      setSelectedObject(activeObj);
    };

    initCanvas.on("object:added", updateStore);
    initCanvas.on("object:removed", updateStore);
    initCanvas.on("object:modified", (e) => {
      updateStore();
      pushHistory(initCanvas.toJSON(["id", "name", "selectable", "lockMovementX", "lockMovementY", "lockRotation", "lockScalingX", "lockScalingY", "isMask", "visible"]));
    });

    initCanvas.on("selection:created", handleSelect);
    initCanvas.on("selection:updated", handleSelect);
    initCanvas.on("selection:cleared", () => setSelectedObject(null));

    // Handle Mask/Brush tagging on path creation
    initCanvas.on("path:created", (e) => {
        const path = e.path;
        if (useEditorStore.getState().activeTool === "mask") {
            path.set({ isMask: true, name: "AI Mask", opacity: 0.8 });
        }
    });

    // -------- ZOOM & PAN LOGIC (Phase 2) --------
    initCanvas.on("mouse:wheel", (opt) => {
      const e = opt.e;
      if (e.ctrlKey || e.metaKey) {
          // Zoom
          e.preventDefault();
          e.stopPropagation();
          let zoom = initCanvas.getZoom();
          zoom *= 0.999 ** e.deltaY;
          if (zoom > 5) zoom = 5;
          if (zoom < 0.1) zoom = 0.1;
          initCanvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
          setZoom(zoom);
      } else {
         // Pan vertically/horizontally
         const vpt = initCanvas.viewportTransform;
         vpt[4] -= e.deltaX;
         vpt[5] -= e.deltaY;
         initCanvas.requestRenderAll();
      }
    });

    let isDragging = false;
    let lastPosX;
    let lastPosY;

    initCanvas.on("mouse:down", (opt) => {
        const evt = opt.e;
        // Pan if Spacebar down OR Middle mouse clicked OR active tool is 'move'
        if ((evt.altKey || evt.button === 1 || useEditorStore.getState().activeTool === "move") && !initCanvas.isDrawingMode) {
            isDragging = true;
            initCanvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
        }
    });

    initCanvas.on("mouse:move", (opt) => {
        if (isDragging) {
           const e = opt.e;
           const vpt = initCanvas.viewportTransform;
           vpt[4] += e.clientX - lastPosX;
           vpt[5] += e.clientY - lastPosY;
           initCanvas.requestRenderAll();
           lastPosX = e.clientX;
           lastPosY = e.clientY;
        }
    });

    initCanvas.on("mouse:up", () => {
        isDragging = false;
        if (useEditorStore.getState().activeTool === "select") {
            initCanvas.selection = true;
        }
    });

    // Handle Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Don't intercept if typing in an input or a text element
      if (e.target.tagName.toLowerCase() === "input" || e.target.tagName.toLowerCase() === "textarea") return;
      if (initCanvas.getActiveObject() && initCanvas.getActiveObject().isEditing) return;

      if ((e.key === "Delete" || e.key === "Backspace") && initCanvas.getActiveObjects().length > 0) {
        initCanvas.getActiveObjects().forEach((obj) => {
           if(!obj.locked) initCanvas.remove(obj);
        });
        initCanvas.discardActiveObject();
      }
      
      // Store shortcuts
      const state = useEditorStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
         e.preventDefault();
         if(state.canUndo()) state.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
         e.preventDefault();
         if(state.canRedo()) state.redo();
      }
      
      // Tool shortcuts
      if (e.key.toLowerCase() === 'v') setActiveTool("select");
      if (e.key.toLowerCase() === 't') setActiveTool("text");
      if (e.key.toLowerCase() === 'r') setActiveTool("rect");
      if (e.key.toLowerCase() === 'm') setActiveTool("mask");
      if (e.key.toLowerCase() === ' ') setActiveTool("move");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      initCanvas.dispose();
      setCanvas(null);
    };
  }, []);

  // Grid system toggle
  useEffect(() => {
    const canvas = useEditorStore.getState().canvas;
    if (!canvas) return;

    if (showGrid) {
      const gridObjects = [];
      const { fabric } = window;
      const gridSize = 50;
      for (let i = 0; i < (canvas.width / gridSize); i++) {
        const line = new fabric.Line([i * gridSize, 0, i * gridSize, canvas.height], { stroke: '#27272a', selectable: false, _isGrid: true, evented: false });
        gridObjects.push(line);
        canvas.add(line);
      }
      for (let i = 0; i < (canvas.height / gridSize); i++) {
        const line = new fabric.Line([0, i * gridSize, canvas.width, i * gridSize], { stroke: '#27272a', selectable: false, _isGrid: true, evented: false });
        gridObjects.push(line);
        canvas.add(line);
      }
      // Send grid to bottom visually
      gridObjects.forEach(obj => obj.sendToBack());
    } else {
      canvas.getObjects().forEach(obj => {
        if (obj._isGrid) canvas.remove(obj);
      });
    }
  }, [showGrid]);

  return (
    <div className="gafs-canvas-container">
      <div className="gafs-canvas-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasEditor;
