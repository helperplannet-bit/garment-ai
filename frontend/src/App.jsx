import React, { useEffect } from "react";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import CanvasEditor from "./components/Canvas";
import PropertiesPanel from "./components/PropertiesPanel";
import LayersPanel from "./components/LayersPanel";
import AIPanel from "./components/AIPanel";
import MockupPanel from "./components/MockupPanel";
import useEditorStore from "./store/useEditorStore";
import API from "./api/client";
import "./App.css";

function App() {
  const { setAiOnline } = useEditorStore();

  useEffect(() => {
    // Health check loop for AI backend status
    const interval = setInterval(async () => {
      try {
        const res = await API.get("/health");
        setAiOnline(res.data.ai_status.online);
      } catch (e) {
        setAiOnline(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [setAiOnline]);

  return (
    <div className="app-container">
      <Header />
      <div className="app-main">
        <Toolbar />
        <CanvasEditor />
        <LayersPanel />
        <PropertiesPanel />
        <AIPanel />
        <MockupPanel />
      </div>
    </div>
  );
}

export default App;
