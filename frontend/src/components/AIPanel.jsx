import React, { useState, useEffect } from "react";
import useEditorStore from "../store/useEditorStore";
import { aiGenerate, aiEdit, aiInpaint, getAIModels } from "../api/client";
import "./AIPanel.css";

const AIPanel = () => {
  const { activePanel, setActivePanel, canvas, aiOnline, aiModels, setAiModels, aiLoading, setAiLoading } = useEditorStore();
  const [prompt, setPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("");
  const [strength, setStrength] = useState(0.7);
  const [activeTab, setActiveTab] = useState("txt2img");
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
     if (activePanel === "ai" && aiOnline && aiModels.length === 0) {
         getAIModels().then(res => {
             setAiModels(res.data.models);
             if (res.data.models.length > 0) setSelectedModel(res.data.models[0].title);
         }).catch(console.error);
     }
  }, [activePanel, aiOnline]);

  if (activePanel !== "ai") return null;

  const getCanvasData = () => {
    if (!canvas) return null;
    const oldZoom = canvas.getZoom();
    canvas.setZoom(1);
    const data = canvas.toDataURL({ format: "png", multiplier: 1 });
    canvas.setZoom(oldZoom);
    return data.split(",")[1]; // Get pure base64 without prefix
  };

  const extractMaskData = () => {
     if (!canvas) return null;
     
     // 1. Hide everything except brushes tagged as "isMask"
     const objects = canvas.getObjects();
     const originalVisibilities = objects.map(o => o.visible);
     let maskFound = false;
     
     objects.forEach(o => {
         if (o.isMask) {
             o.visible = true;
             o.set({ stroke: "#ffffff", opacity: 1, color: "#ffffff" }); // SD expects white for inpaint areas
             maskFound = true;
         } else {
             o.visible = false;
         }
     });

     if (!maskFound) {
         objects.forEach((o, i) => o.visible = originalVisibilities[i]);
         return null;
     }

     const oldZoom = canvas.getZoom();
     canvas.setZoom(1);
     const oldBg = canvas.backgroundColor;
     canvas.backgroundColor = "#000000"; // SD expects black for unmasked
     canvas.renderAll();
     
     const maskDataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
     
     // Restore
     canvas.backgroundColor = oldBg;
     objects.forEach((o, i) => {
          o.visible = originalVisibilities[i];
          if (o.isMask) {
             o.set({ stroke: "rgba(0, 255, 128, 0.45)" }); // Restore green brush
          }
     });
     canvas.setZoom(oldZoom);
     canvas.renderAll();
     
     return maskDataUrl.split(",")[1];
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setAiLoading(true);
    try {
      if (activeTab === "txt2img") {
        const res = await aiGenerate(prompt, negPrompt, 512, 512, 20, selectedModel);
        addImageToCanvas(res.data.image_base64);
      } else if (activeTab === "img2img" || activeTab === "style") {
        const b64 = getCanvasData();
        const adjustedStrength = activeTab === "style" ? 0.8 : strength; // Style transfer uses high denoising
        const res = await aiEdit(b64, prompt, negPrompt, adjustedStrength, 20, selectedModel);
        addImageToCanvas(res.data.image_base64);
      } else if (activeTab === "inpaint") {
        const b64 = getCanvasData();
        const maskB64 = extractMaskData();
        if(!maskB64) {
            alert("No AI Mask found on canvas! Please draw a mask first using the Mask brush.");
            setAiLoading(false);
            return;
        }
        const res = await aiInpaint(b64, maskB64, prompt, negPrompt, 20, selectedModel);
        
        // After successful inpaint, we should delete the mask layer from canvas to keep it clean
        canvas.getObjects().forEach(o => { if(o.isMask) canvas.remove(o); });
        addImageToCanvas(res.data.image_base64);
      }
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Check backend logs.");
    }
    setAiLoading(false);
  };

  const addImageToCanvas = (base64Str) => {
    const { fabric } = window;
    fabric.Image.fromURL(`data:image/png;base64,${base64Str}`, (img) => {
      img.set({ left: 50, top: 50 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      
      const el = document.createElement("div");
      el.className = "gafs-toast gafs-toast--success";
      el.textContent = "AI Image injected";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }, { crossOrigin: "anonymous" });
  };

  return (
    <div className="gafs-ai-panel">
      <div className="gafs-ai-panel__header">
        <h3>AI Studio</h3>
        <button className="gafs-icon-btn" onClick={() => setActivePanel(null)}>✕</button>
      </div>

      {!aiOnline && (
        <div style={{color:'#EF4444', fontSize:'12px', padding:'10px', background:'rgba(239,68,68,0.1)', margin:'10px', borderRadius:'6px'}}>
          Stable Diffusion API is Offline. Please run AUTOMATIC1111 on port 7860.
        </div>
      )}

      {aiModels.length > 0 && (
         <div className="gafs-ai-group">
            <label>Model Checkpoint</label>
            <select className="gafs-input" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                {aiModels.map(m => (
                    <option key={m.title} value={m.title}>{m.model_name}</option>
                ))}
            </select>
         </div>
      )}

      <div className="gafs-ai-tabs">
        <button className={activeTab === "txt2img" ? "active" : ""} onClick={() => setActiveTab("txt2img")}>Txt2Img</button>
        <button className={activeTab === "img2img" ? "active" : ""} onClick={() => setActiveTab("img2img")}>Img2Img</button>
        <button className={activeTab === "style" ? "active" : ""} onClick={() => setActiveTab("style")}>Style</button>
        <button className={activeTab === "inpaint" ? "active" : ""} onClick={() => setActiveTab("inpaint")}>Inpaint</button>
      </div>

      <div className="gafs-ai-group">
        <label>Prompt</label>
        <textarea
          className="gafs-input"
          placeholder="A cyberpunk street, neon lights..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="gafs-ai-group">
        <label>Negative Prompt</label>
        <textarea
          className="gafs-input"
          placeholder="blurry, low quality, bad anatomy..."
          value={negPrompt}
          onChange={(e) => setNegPrompt(e.target.value)}
        />
      </div>

      {activeTab === "img2img" && (
        <div className="gafs-ai-group">
          <label>Denoising Strength: {strength}</label>
          <input type="range" className="gafs-range-slider" min="0" max="1" step="0.05" value={strength} onChange={(e) => setStrength(e.target.value)} />
        </div>
      )}

      <button
         className="gafs-btn-primary"
         style={{margin: '16px', background: 'var(--accent-grad)'}}
         disabled={!prompt || aiLoading || !aiOnline}
         onClick={handleGenerate}
      >
        {aiLoading ? "Rendering..." : "Generate & Insert"}
      </button>
    </div>
  );
};

export default AIPanel;
