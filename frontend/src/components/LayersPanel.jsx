import React, { useState } from "react";
import useEditorStore from "../store/useEditorStore";
import "./LayersPanel.css";

const LayersPanel = () => {
  const { canvas, layers, setLayers, setSelectedObject, selectedObject } = useEditorStore();
  const [draggedIdx, setDraggedIdx] = useState(null);

  if (!layers || layers.length === 0) return null;

  const handleSelect = (obj) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
    setSelectedObject(obj);
  };

  const handleToggleVisibility = (e, obj) => {
    e.stopPropagation();
    obj.set("visible", !obj.visible);
    if(canvas) {
       canvas.renderAll();
       canvas.fire("object:modified", { target: obj }); // Trigger layer sync
    }
  };

  const handleToggleLock = (e, obj) => {
    e.stopPropagation();
    const isLocked = obj.locked || false;
    obj.set({
      locked: !isLocked,
      selectable: isLocked, // true if it was locked and we unlock it
      evented: isLocked
    });
    if(canvas) {
        if (!isLocked && canvas.getActiveObject() === obj) {
            canvas.discardActiveObject();
        }
        canvas.renderAll();
        canvas.fire("object:modified", { target: obj }); // Trigger layer sync
    }
  };

  // Drag and Drop ordering
  const onDragStart = (e, index) => {
     setDraggedIdx(index);
     e.dataTransfer.effectAllowed = "move";
  };
  
  const onDragOver = (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e, targetIdx) => {
      e.preventDefault();
      if(draggedIdx === null || draggedIdx === targetIdx || !canvas) return;
      
      const newLayers = [...layers];
      const itemsToMove = newLayers.splice(draggedIdx, 1);
      newLayers.splice(targetIdx, 0, itemsToMove[0]);
      
      // Since bottom layer is 0 in Fabric.js, we must reverse map UI to Fabric index
      const reversedLayers = [...newLayers].reverse();
      reversedLayers.forEach((obj, idx) => {
          obj.moveTo(idx);
      });
      canvas.renderAll();
      setLayers(newLayers);
      setDraggedIdx(null);
  };

  return (
    <div className="gafs-layers-panel">
      <div className="gafs-layers-panel__header">
        <h4>Layers ({layers.length})</h4>
        <span className="gafs-layers-hint" title="Drag to reorder layers">↕ Drag</span>
      </div>
      <div className="gafs-layers-list">
        {layers.map((obj, i) => {
          const isSelected = selectedObject === obj;
          const isLocked = obj.locked;
          const isHidden = !obj.visible;
          
          let name = obj.name || obj.type;
          if (name === "i-text") name = "Text";
          if (name === "rect") name = "Rectangle";
          if (obj.isMask) name = "AI Mask";

          return (
            <div
              key={`${obj.id || i}-${i}`}
              className={`gafs-layer-item ${isSelected ? "gafs-layer-item--active" : ""}`}
              onClick={() => handleSelect(obj)}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={(e) => onDrop(e, i)}
              style={draggedIdx === i ? {opacity: 0.5} : {}}
            >
              <div className="gafs-layer-item__drag">⋮⋮</div>
              <div className="gafs-layer-item__name">{name}</div>
              <div className="gafs-layer-item__actions">
                <button className={`gafs-layer-btn ${isLocked ? "gafs-layer-btn--active" : ""}`} onClick={(e) => handleToggleLock(e, obj)} title="Lock">
                   {isLocked ? (
                       <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                   ) : (
                       <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
                   )}
                </button>
                <button className={`gafs-layer-btn ${isHidden ? "gafs-layer-btn--active" : ""}`} onClick={(e) => handleToggleVisibility(e, obj)} title="Visible">
                   {isHidden ? (
                       <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                   ) : (
                       <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                   )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayersPanel;
