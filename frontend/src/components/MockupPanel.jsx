import React, { useState, useEffect } from "react";
import useEditorStore from "../store/useEditorStore";
import { listMockups, generateMockup } from "../api/client";
import "./MockupPanel.css";

const MockupPanel = () => {
  const { canvas, setMockupResult, mockupResult, setActivePanel } = useEditorStore();
  const [mockups, setMockups] = useState([]);
  const [selectedMockup, setSelectedMockup] = useState("tshirt_front.png");
  const [posX, setPosX] = useState(0.5);
  const [posY, setPosY] = useState(0.35);
  const [scale, setScale] = useState(0.4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMockups()
      .then((r) => {
        setMockups(r.data.mockups || []);
        if (r.data.mockups?.length > 0) setSelectedMockup(r.data.mockups[0]);
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!canvas) { setError("Canvas is empty"); return; }
    setError(""); setLoading(true);
    try {
      const designB64 = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
      const res = await generateMockup(designB64, selectedMockup, posX, posY, scale);
      setMockupResult(res.data.image_base64);
    } catch (e) {
      setError(e.response?.data?.detail || "Mockup generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Debounced live preview
  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvas && selectedMockup) handleGenerate();
    }, 500);
    return () => clearTimeout(timer);
  }, [posX, posY, scale, selectedMockup]);

  const handleDownload = () => {
    if (!mockupResult) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${mockupResult}`;
    a.download = "mockup.png";
    a.click();
  };

  return (
    <div className="gafs-mockup-panel">
      <div className="gafs-panel-header">
        <div className="gafs-panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          Mockup Generator
        </div>
        <button className="gafs-panel-close" onClick={() => setActivePanel(null)}>✕</button>
      </div>

      <div className="gafs-ai-body">
        {/* Template selector */}
        <div className="gafs-field">
          <label className="gafs-field-label">Base Template</label>
          <div className="gafs-mockup-grid">
            {mockups.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No templates found. Backend generates them automatically.</p>
            ) : mockups.map((m) => (
              <button
                key={m}
                className={`gafs-mockup-thumb ${selectedMockup === m ? "active" : ""}`}
                onClick={() => setSelectedMockup(m)}
              >
                {m.replace(".png", "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Position controls */}
        <div className="gafs-field">
          <label className="gafs-field-label">Horizontal Position: {Math.round(posX * 100)}%</label>
          <input type="range" className="gafs-slider-input" min={0.1} max={0.9} step={0.01}
            value={posX} onChange={(e) => setPosX(parseFloat(e.target.value))} />
        </div>

        <div className="gafs-field">
          <label className="gafs-field-label">Vertical Position: {Math.round(posY * 100)}%</label>
          <input type="range" className="gafs-slider-input" min={0.1} max={0.8} step={0.01}
            value={posY} onChange={(e) => setPosY(parseFloat(e.target.value))} />
        </div>

        <div className="gafs-field">
          <label className="gafs-field-label">Design Scale: {Math.round(scale * 100)}%</label>
          <input type="range" className="gafs-slider-input" min={0.1} max={0.8} step={0.01}
            value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
        </div>

        {error && <div className="gafs-error-box">{error}</div>}

        <button className={`gafs-generate-btn ${loading ? "loading" : ""}`}
          onClick={handleGenerate} disabled={loading}>
          {loading ? <><span className="spinner" /> Generating…</> : <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Generate Mockup
          </>}
        </button>

        {/* Result */}
        {mockupResult && (
          <div className="gafs-ai-result">
            <div className="gafs-ai-result-header">Mockup Preview</div>
            <img
              src={`data:image/png;base64,${mockupResult}`}
              alt="Mockup result"
              className="gafs-ai-result-img"
            />
            <div className="gafs-ai-result-actions">
              <button className="gafs-result-btn" onClick={handleDownload}>⬇ Download PNG</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockupPanel;
