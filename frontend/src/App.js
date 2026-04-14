import React, { useEffect, useCallback } from "react";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import CanvasEditor from "./components/Canvas";
import PropertiesPanel from "./components/PropertiesPanel";
import LayersPanel from "./components/LayersPanel";
import AIPanel from "./components/AIPanel";
import MockupPanel from "./components/MockupPanel";
import useEditorStore from "./store/useEditorStore";
import { checkHealth } from "./api/client";
import "./App.css";

function App() {
  const { activePanel, canvas, setAiOnline, canvasWidth, canvasHeight } = useEditorStore();

  // Poll backend health every 10 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await checkHealth();
        setAiOnline(res.data.ai_engine?.online || false);
      } catch {
        setAiOnline(false);
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [setAiOnline]);

  const handleExportPng = useCallback(() => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `gafs-design-${Date.now()}.png`;
    a.click();
  }, [canvas]);

  return (
    <div className="gafs-app">
      <Header onExportPng={handleExportPng} />

      <div className="gafs-workspace">
        {/* Left sidebar */}
        <div className="gafs-left-sidebar">
          <Toolbar />
          <LayersPanel />
        </div>

        {/* Main canvas area */}
        <main className="gafs-main">
          <CanvasEditor />
        </main>

        {/* Right properties panel */}
        <PropertiesPanel />
      </div>

      {/* Floating panels */}
      {activePanel === "ai" && <AIPanel />}
      {activePanel === "mockup" && <MockupPanel />}
    </div>
  );
}

export default App;
