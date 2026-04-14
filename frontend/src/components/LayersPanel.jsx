import React from "react";
import useEditorStore from "../store/useEditorStore";
import "./LayersPanel.css";

const typeIcon = (type) => {
  const icons = {
    "i-text": "T",
    text: "T",
    rect: "▭",
    circle: "○",
    triangle: "△",
    image: "🖼",
    path: "✏",
    group: "⊞",
  };
  return icons[type] || "◈";
};

const LayersPanel = () => {
  const { layers, canvas } = useEditorStore();

  const selectLayer = (layerId) => {
    if (!canvas) return;
    const objs = canvas.getObjects();
    // layers are reversed index, so find by position
    const total = objs.length;
    const idx = total - 1 - layers.findIndex((l) => l.id === layerId);
    const obj = objs[idx];
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const toggleVisible = (layerId, e) => {
    e.stopPropagation();
    if (!canvas) return;
    const objs = canvas.getObjects();
    const total = objs.length;
    const layerIdx = layers.findIndex((l) => l.id === layerId);
    const idx = total - 1 - layerIdx;
    const obj = objs[idx];
    if (obj) {
      obj.set("visible", !obj.visible);
      canvas.renderAll();
    }
  };

  const deleteLayer = (layerId, e) => {
    e.stopPropagation();
    if (!canvas) return;
    const objs = canvas.getObjects();
    const total = objs.length;
    const layerIdx = layers.findIndex((l) => l.id === layerId);
    const idx = total - 1 - layerIdx;
    const obj = objs[idx];
    if (obj) { canvas.remove(obj); canvas.renderAll(); }
  };

  return (
    <div className="gafs-layers">
      <div className="gafs-layers__header">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6l8-4 8 4-8 4-8-4zM2 12l8 4 8-4M2 9l8 4 8-4"/>
        </svg>
        Layers
        <span className="gafs-layers-count">{layers.length}</span>
      </div>

      <div className="gafs-layers__list">
        {layers.length === 0 ? (
          <div className="gafs-layers-empty">Canvas is empty</div>
        ) : (
          layers.map((layer) => (
            <div key={layer.id} className="gafs-layer-item" onClick={() => selectLayer(layer.id)}>
              <span className="gafs-layer-icon">{typeIcon(layer.type)}</span>
              <span className="gafs-layer-name">{layer.name}</span>
              <div className="gafs-layer-actions">
                <button className="gafs-layer-btn" title="Toggle visibility"
                  onClick={(e) => toggleVisible(layer.id, e)}>
                  {layer.visible !== false ? "👁" : "🚫"}
                </button>
                <button className="gafs-layer-btn gafs-layer-btn--del" title="Delete"
                  onClick={(e) => deleteLayer(layer.id, e)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
