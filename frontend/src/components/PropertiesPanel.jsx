import React, { useEffect, useState } from "react";
import useEditorStore from "../store/useEditorStore";
import "./PropertiesPanel.css";

const ColorSwatch = ({ value, onChange, label }) => (
  <div className="gafs-prop-row">
    <label className="gafs-prop-label">{label}</label>
    <div className="gafs-color-input-wrap">
      <input type="color" className="gafs-color-input" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} />
      <span className="gafs-color-hex">{(value || "#000000").toUpperCase()}</span>
    </div>
  </div>
);

const SliderRow = ({ label, value, min, max, step = 0.01, onChange, displayFn }) => (
  <div className="gafs-prop-row">
    <label className="gafs-prop-label">{label}</label>
    <div className="gafs-slider-wrap">
      <input type="range" className="gafs-slider" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      <span className="gafs-slider-val">{displayFn ? displayFn(value) : value}</span>
    </div>
  </div>
);

const FONTS = ["Inter", "Arial", "Georgia", "Courier New", "Impact", "Trebuchet MS", "Verdana", "Times New Roman"];

const PropertiesPanel = () => {
  const { selectedObject, canvas } = useEditorStore();
  const [props, setProps] = useState({});

  useEffect(() => {
    if (!selectedObject) { setProps({}); return; }
    setProps({
      fill:       selectedObject.fill || "#000000",
      stroke:     selectedObject.stroke || "transparent",
      strokeWidth: selectedObject.strokeWidth || 0,
      opacity:    selectedObject.opacity ?? 1,
      // text
      fontSize:   selectedObject.fontSize || 24,
      fontFamily: selectedObject.fontFamily || "Inter",
      fontWeight: selectedObject.fontWeight || "normal",
      fontStyle:  selectedObject.fontStyle || "normal",
      underline:  selectedObject.underline || false,
      textAlign:  selectedObject.textAlign || "left",
      // position
      left:       Math.round(selectedObject.left || 0),
      top:        Math.round(selectedObject.top || 0),
      width:      Math.round(selectedObject.getScaledWidth ? selectedObject.getScaledWidth() : selectedObject.width || 0),
      height:     Math.round(selectedObject.getScaledHeight ? selectedObject.getScaledHeight() : selectedObject.height || 0),
      angle:      Math.round(selectedObject.angle || 0),
    });
  }, [selectedObject]);

  const apply = (changes) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(changes);
    canvas.renderAll();
    setProps((p) => ({ ...p, ...changes }));
  };

  if (!selectedObject) {
    return (
      <aside className="gafs-props-panel">
        <div className="gafs-props-panel__header">Properties</div>
        <div className="gafs-props-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <p>Select an object on the canvas to edit its properties</p>
        </div>
      </aside>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "text";
  const isImage = selectedObject.type === "image";

  return (
    <aside className="gafs-props-panel">
      <div className="gafs-props-panel__header">
        Properties
        <span className="gafs-props-type-badge">{selectedObject.type}</span>
      </div>

      <div className="gafs-props-section">
        <div className="gafs-props-section-title">Transform</div>
        <div className="gafs-prop-grid-2">
          <div className="gafs-prop-row">
            <label className="gafs-prop-label">X</label>
            <input type="number" className="gafs-prop-input" value={props.left || 0}
              onChange={(e) => apply({ left: Number(e.target.value) })} />
          </div>
          <div className="gafs-prop-row">
            <label className="gafs-prop-label">Y</label>
            <input type="number" className="gafs-prop-input" value={props.top || 0}
              onChange={(e) => apply({ top: Number(e.target.value) })} />
          </div>
        </div>
        <SliderRow label="Rotation" value={props.angle || 0} min={-180} max={180} step={1}
          onChange={(v) => apply({ angle: v })} displayFn={(v) => `${v}°`} />
        <SliderRow label="Opacity" value={props.opacity ?? 1} min={0} max={1}
          onChange={(v) => apply({ opacity: v })} displayFn={(v) => `${Math.round(v * 100)}%`} />
      </div>

      {!isImage && (
        <div className="gafs-props-section">
          <div className="gafs-props-section-title">Fill & Stroke</div>
          <ColorSwatch label="Fill" value={props.fill} onChange={(v) => apply({ fill: v })} />
          <ColorSwatch label="Stroke" value={props.stroke} onChange={(v) => apply({ stroke: v })} />
          <SliderRow label="Stroke Width" value={props.strokeWidth || 0} min={0} max={20} step={0.5}
            onChange={(v) => apply({ strokeWidth: v })} displayFn={(v) => `${v}px`} />
        </div>
      )}

      {isText && (
        <div className="gafs-props-section">
          <div className="gafs-props-section-title">Typography</div>
          <div className="gafs-prop-row">
            <label className="gafs-prop-label">Font</label>
            <select className="gafs-prop-select" value={props.fontFamily}
              onChange={(e) => apply({ fontFamily: e.target.value })}>
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <SliderRow label="Size" value={props.fontSize || 24} min={8} max={120} step={1}
            onChange={(v) => apply({ fontSize: v })} displayFn={(v) => `${v}px`} />
          <div className="gafs-prop-row">
            <label className="gafs-prop-label">Style</label>
            <div className="gafs-text-style-btns">
              <button className={`gafs-style-btn ${props.fontWeight === "bold" ? "active" : ""}`}
                onClick={() => apply({ fontWeight: props.fontWeight === "bold" ? "normal" : "bold" })}
                style={{ fontWeight: "bold" }}>B</button>
              <button className={`gafs-style-btn ${props.fontStyle === "italic" ? "active" : ""}`}
                onClick={() => apply({ fontStyle: props.fontStyle === "italic" ? "normal" : "italic" })}
                style={{ fontStyle: "italic" }}>I</button>
              <button className={`gafs-style-btn ${props.underline ? "active" : ""}`}
                onClick={() => apply({ underline: !props.underline })}
                style={{ textDecoration: "underline" }}>U</button>
            </div>
          </div>
          <ColorSwatch label="Color" value={props.fill} onChange={(v) => apply({ fill: v })} />
          <div className="gafs-prop-row">
            <label className="gafs-prop-label">Align</label>
            <div className="gafs-text-style-btns">
              {["left","center","right"].map((a) => (
                <button key={a} className={`gafs-style-btn ${props.textAlign === a ? "active" : ""}`}
                  onClick={() => apply({ textAlign: a })}>
                  {a === "left" ? "⬅" : a === "center" ? "⬛" : "➡"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="gafs-props-section">
        <div className="gafs-props-section-title">Actions</div>
        <div className="gafs-action-btns">
          <button className="gafs-action-btn" onClick={() => { canvas.bringToFront(selectedObject); canvas.renderAll(); }}>Bring Front</button>
          <button className="gafs-action-btn" onClick={() => { canvas.sendToBack(selectedObject); canvas.renderAll(); }}>Send Back</button>
          <button className="gafs-action-btn gafs-action-btn--danger"
            onClick={() => { canvas.remove(selectedObject); canvas.discardActiveObject(); canvas.renderAll(); }}>
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
