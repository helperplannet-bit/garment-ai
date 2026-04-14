import React, { useState } from "react";
import useEditorStore from "../store/useEditorStore";
import { aiGenerate, aiEdit, aiInpaint, removeBg } from "../api/client";
import "./AIPanel.css";

const TABS = ["txt2img", "img2img", "inpaint", "remove-bg"];
const TAB_LABELS = { "txt2img": "Text → Image", "img2img": "Edit Image", "inpaint": "Inpaint", "remove-bg": "Remove BG" };

const AIPanel = () => {
  const { canvas, aiOnline, aiLoading, setAiLoading, setLastAiImage, lastAiImage, setActivePanel } = useEditorStore();
  const [tab, setTab] = useState("txt2img");
  const [prompt, setPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("blurry, low quality, watermark");
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [steps, setSteps] = useState(20);
  const [strength, setStrength] = useState(0.7);
  const [error, setError] = useState("");
  const [resultImg, setResultImg] = useState(null);

  const getCanvasBase64 = () => {
    if (!canvas) return null;
    return canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
  };

  const addImageToCanvas = (base64) => {
    if (!canvas) return;
    const { fabric } = window;
    const dataUrl = `data:image/png;base64,${base64}`;
    fabric.Image.fromURL(dataUrl, (img) => {
      const maxW = canvas.width * 0.6;
      if (img.width > maxW) img.scaleToWidth(maxW);
      img.set({ left: 60, top: 60 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    setError(""); setAiLoading(true); setResultImg(null);
    try {
      let res;
      if (tab === "txt2img") {
        res = await aiGenerate(prompt, negPrompt, width, height, steps);
      } else if (tab === "img2img") {
        const b64 = getCanvasBase64();
        if (!b64) { setError("Canvas is empty."); setAiLoading(false); return; }
        res = await aiEdit(b64, prompt, negPrompt, strength, steps);
      } else if (tab === "inpaint") {
        const b64 = getCanvasBase64();
        if (!b64) { setError("Canvas is empty."); setAiLoading(false); return; }
        res = await aiInpaint(b64, b64, prompt, negPrompt);
      } else if (tab === "remove-bg") {
        const b64 = getCanvasBase64();
        if (!b64) { setError("Canvas is empty."); setAiLoading(false); return; }
        res = await removeBg(b64);
      }
      const img = res.data.image_base64;
      setResultImg(img);
      setLastAiImage(img);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || "AI request failed";
      setError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="gafs-ai-panel">
      <div className="gafs-panel-header">
        <div className="gafs-panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4z"/>
            <path d="M20 20a8 8 0 10-16 0"/>
          </svg>
          AI Studio
        </div>
        <div className={`gafs-ai-status ${aiOnline ? "online" : "offline"}`}>
          <span className="dot" /> {aiOnline ? "SD Online" : "SD Offline"}
        </div>
        <button className="gafs-panel-close" onClick={() => setActivePanel(null)}>✕</button>
      </div>

      {!aiOnline && (
        <div className="gafs-ai-offline-banner">
          ⚠ Stable Diffusion is not running. Start AUTOMATIC1111 at port 7860 to use AI features.
        </div>
      )}

      {/* Tabs */}
      <div className="gafs-ai-tabs">
        {TABS.map((t) => (
          <button key={t} className={`gafs-ai-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="gafs-ai-body">
        {/* Prompt */}
        {tab !== "remove-bg" && (
          <>
            <div className="gafs-field">
              <label className="gafs-field-label">Prompt</label>
              <textarea className="gafs-textarea" rows={3} placeholder="Describe what you want to generate…"
                value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>
            <div className="gafs-field">
              <label className="gafs-field-label">Negative Prompt</label>
              <textarea className="gafs-textarea" rows={2} placeholder="What to avoid…"
                value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)} />
            </div>
          </>
        )}

        {tab === "txt2img" && (
          <div className="gafs-field-row">
            <div className="gafs-field">
              <label className="gafs-field-label">Width</label>
              <select className="gafs-select" value={width} onChange={(e) => setWidth(Number(e.target.value))}>
                {[256, 512, 768, 1024].map(v => <option key={v} value={v}>{v}px</option>)}
              </select>
            </div>
            <div className="gafs-field">
              <label className="gafs-field-label">Height</label>
              <select className="gafs-select" value={height} onChange={(e) => setHeight(Number(e.target.value))}>
                {[256, 512, 768, 1024].map(v => <option key={v} value={v}>{v}px</option>)}
              </select>
            </div>
            <div className="gafs-field">
              <label className="gafs-field-label">Steps</label>
              <input type="number" className="gafs-input" min={5} max={50} value={steps}
                onChange={(e) => setSteps(Number(e.target.value))} />
            </div>
          </div>
        )}

        {tab === "img2img" && (
          <div className="gafs-field">
            <label className="gafs-field-label">Strength: {Math.round(strength * 100)}%</label>
            <input type="range" className="gafs-slider-input" min={0.1} max={1} step={0.05}
              value={strength} onChange={(e) => setStrength(parseFloat(e.target.value))} />
          </div>
        )}

        {tab === "remove-bg" && (
          <div className="gafs-info-box">
            Removes white/light backgrounds from the current canvas state and adds it as a new transparent-BG image.
          </div>
        )}

        {error && <div className="gafs-error-box">{error}</div>}

        <button
          className={`gafs-generate-btn ${aiLoading ? "loading" : ""}`}
          onClick={handleGenerate}
          disabled={aiLoading || !aiOnline}
        >
          {aiLoading ? (
            <><span className="spinner" /> Generating…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg> Generate</>
          )}
        </button>

        {/* Result preview */}
        {resultImg && (
          <div className="gafs-ai-result">
            <div className="gafs-ai-result-header">Generated Image</div>
            <img src={`data:image/png;base64,${resultImg}`} alt="AI result" className="gafs-ai-result-img" />
            <div className="gafs-ai-result-actions">
              <button className="gafs-result-btn" onClick={() => addImageToCanvas(resultImg)}>
                ➕ Add to Canvas
              </button>
              <a
                className="gafs-result-btn"
                href={`data:image/png;base64,${resultImg}`}
                download="ai-generated.png"
              >
                ⬇ Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;
