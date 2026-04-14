import React, { useState, useEffect } from "react";
import useEditorStore from "../store/useEditorStore";
import { removeBg } from "../api/client";
import "./PropertiesPanel.css";

const PropertiesPanel = () => {
  const { selectedObject, canvas, setActivePanel, aiOnline } = useEditorStore();
  const [fill, setFill] = useState("#000000");
  const [opacity, setOpacity] = useState(1);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Inter");
  
  // Img filters
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      setFill(selectedObject.fill || "#000000");
      setOpacity(selectedObject.opacity !== undefined ? selectedObject.opacity : 1);
      
      if (selectedObject.type === "i-text" || selectedObject.type === "text") {
        setText(selectedObject.text || "");
        setFontSize(selectedObject.fontSize || 32);
        setFontFamily(selectedObject.fontFamily || "Inter");
      }
    }
  }, [selectedObject]);

  const updateProp = (key, val) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(key, val);
    canvas.renderAll();
  };

  const applyImageFilter = () => {
    if (!selectedObject || selectedObject.type !== "image" || !canvas) return;
    const { fabric } = window;
    selectedObject.filters = [];
    if (brightness !== 0) {
      selectedObject.filters.push(new fabric.Image.filters.Brightness({ brightness }));
    }
    if (contrast !== 0) {
      selectedObject.filters.push(new fabric.Image.filters.Contrast({ contrast }));
    }
    selectedObject.applyFilters();
    canvas.renderAll();
  };

  const handleRemoveBg = async () => {
    if (!selectedObject || selectedObject.type !== "image" || !canvas) return;
    setIsRemovingBg(true);
    try {
        const b64 = selectedObject.toDataURL({ format: 'png' });
        const res = await removeBg(b64);
        const { fabric } = window;
        fabric.Image.fromURL(`data:image/png;base64,${res.data.image_base64}`, (img) => {
            img.set({
               left: selectedObject.left,
               top: selectedObject.top,
               scaleX: selectedObject.scaleX,
               scaleY: selectedObject.scaleY,
               angle: selectedObject.angle
            });
            canvas.add(img);
            canvas.remove(selectedObject);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    } catch(e) {
        console.error("BG Removal failed", e);
    }
    setIsRemovingBg(false);
  };

  if (!selectedObject) {
    return (
      <aside className="gafs-prop-panel gafs-prop-panel--empty">
        <div className="gafs-prop-empty-state">
           <svg viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" /></svg>
           <span>Select an object to edit its properties</span>
        </div>
      </aside>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "text";
  const isImage = selectedObject.type === "image";
  const isShape = ["rect", "circle", "triangle", "polygon"].includes(selectedObject.type);

  return (
    <aside className="gafs-prop-panel">
      <div className="gafs-prop-panel__header">
        <h3>{isText ? "Text settings" : isImage ? "Image settings" : "Shape settings"}</h3>
      </div>

      <div className="gafs-prop-group">
        <label>Opacity: {Math.round(opacity * 100)}%</label>
        <input
          type="range"
          className="gafs-range-slider"
          min="0" max="1" step="0.01"
          value={opacity}
          onChange={(e) => {
            setOpacity(e.target.value);
            updateProp("opacity", parseFloat(e.target.value));
          }}
        />
      </div>

      {(isShape || isText) && (
        <div className="gafs-prop-group">
          <label>Color</label>
          <div className="gafs-color-picker">
             <input
                type="color"
                value={fill === null ? "#000" : fill}
                onChange={(e) => {
                setFill(e.target.value);
                updateProp("fill", e.target.value);
                }}
             />
             <span className="gafs-color-hex">{fill}</span>
          </div>
        </div>
      )}

      {isText && (
        <>
          <div className="gafs-prop-group">
            <label>Text Content</label>
            <textarea
              className="gafs-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                updateProp("text", e.target.value);
              }}
              rows={3}
            />
          </div>
          <div className="gafs-prop-group">
             <label>Font Family</label>
             <select 
               className="gafs-input"
               value={fontFamily}
               onChange={(e) => {
                   setFontFamily(e.target.value);
                   updateProp("fontFamily", e.target.value);
               }}
             >
                 <option value="Inter">Inter</option>
                 <option value="Arial">Arial</option>
                 <option value="Times New Roman">Times New Roman</option>
                 <option value="Courier New">Courier New</option>
             </select>
          </div>
          <div className="gafs-prop-group">
            <label>Font Size</label>
            <input
              type="number"
              className="gafs-input"
              value={fontSize}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFontSize(val);
                updateProp("fontSize", val);
              }}
            />
          </div>
        </>
      )}

      {isImage && (
        <>
           <div className="gafs-prop-group">
              <label>Brightness</label>
              <input type="range" className="gafs-range-slider" min="-1" max="1" step="0.05" value={brightness} onChange={(e)=>{setBrightness(e.target.value); applyImageFilter();}} />
           </div>
           <div className="gafs-prop-group mb-4">
              <label>Contrast</label>
              <input type="range" className="gafs-range-slider" min="-1" max="1" step="0.05" value={contrast} onChange={(e)=>{setContrast(e.target.value); applyImageFilter();}} />
           </div>
           
           <div className="gafs-prop-divider" />
           
           <div className="gafs-prop-group">
              <label className="mb-2 text-muted">AI Actions</label>
              <button 
                 className="gafs-btn-outline mb-2" 
                 style={{width:'100%', display:'flex', gap:'8px', alignItems:'center', justifyContent:'center'}}
                 onClick={handleRemoveBg}
                 disabled={isRemovingBg || !aiOnline}
              >
                  {isRemovingBg ? <span className="gafs-spinner"></span> : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                  Remove Background
              </button>
              
              <button 
                 className="gafs-btn-primary" 
                 style={{width:'100%'}}
                 onClick={() => setActivePanel("ai")}
              >
                  ✨ AI AI Style / Inpaint
              </button>
           </div>
        </>
      )}
      
      <div className="gafs-prop-divider" />
      <div className="gafs-prop-group" style={{marginTop:'auto', paddingBottom:'16px'}}>
          <button 
             className="gafs-btn-outline" 
             style={{width:'100%', borderColor:'rgba(239, 68, 68, 0.5)', color:'#EF4444'}}
             onClick={() => {
                 if(canvas){
                     canvas.remove(selectedObject);
                     canvas.renderAll();
                 }
             }}
          >
              Delete Layer
          </button>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
