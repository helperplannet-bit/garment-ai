import React, { useState } from "react";
import useEditorStore from "../store/useEditorStore";
import { saveProject, listProjects, loadProject } from "../api/client";
import "./Header.css";

const Header = () => {
  const {
    projectName, setProjectName, projectId, setProjectId,
    canvas, isSaved, setIsSaved, aiOnline, setActivePanel,
    undo, redo, canUndo, canRedo, zoom, setZoom
  } = useEditorStore();

  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingName, setEditingName] = useState(false);

  const handleSave = async () => {
    if (!canvas) return;
    const fabricJson = canvas.toJSON(["id", "name", "selectable", "lockMovementX", "lockMovementY", "lockRotation", "lockScalingX", "lockScalingY", "isMask"]);
    try {
      const res = await saveProject({
        project_id: projectId || undefined,
        name: projectName,
        fabric_json: fabricJson,
        canvas: { width: canvas.width, height: canvas.height },
      });
      setProjectId(res.data.id);
      setIsSaved(true);
      showNotification("Project saved securely to disk", "success");
    } catch (e) {
      showNotification("Save failed!", "error");
    }
  };

  const handleOpenProjects = async () => {
    try {
      const res = await listProjects();
      setProjects(res.data.projects);
      setShowProjectsModal(true);
    } catch (e) {
      showNotification("Could not load projects", "error");
    }
  };

  const handleLoadProject = async (id) => {
    try {
      const res = await loadProject(id);
      const proj = res.data.project;
      if (proj.fabric_json && canvas) {
        canvas.loadFromJSON(proj.fabric_json, () => {
          canvas.renderAll();
          // Force reset zoom to ensure loaded project fits viewport conceptually
          if(canvas.viewportTransform) {
             canvas.setViewportTransform([1,0,0,1,0,0]);
             setZoom(1);
          }
        });
        setProjectName(proj.name);
        setProjectId(proj.id);
        setIsSaved(true);
      }
      setShowProjectsModal(false);
      showNotification("Project loaded ✓", "success");
    } catch (e) {
      showNotification("Load failed!", "error");
    }
  };

  const handleNew = () => {
    if (canvas) {
      canvas.clear();
      canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
    }
    setProjectName("Untitled Project");
    setProjectId(null);
    setIsSaved(true);
  };

  const handleExportPng = () => {
    if (!canvas) return;
    // reset zoom before export to get natural resolution
    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    canvas.setZoom(currentZoom);
    
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `gafs-design-${Date.now()}.png`;
    a.click();
    showNotification("High quality PNG exported", "success");
  };

  const handleDownloadJSON = () => {
    if (!canvas) return;
    const fabricJson = canvas.toJSON(["id", "name", "selectable", "lockMovementX", "lockMovementY", "lockRotation", "lockScalingX", "lockScalingY", "isMask"]);
    const jsonStr = JSON.stringify({
        id: projectId || `local-${Date.now()}`,
        name: projectName,
        fabric_json: fabricJson,
        canvas: { width: canvas.width, height: canvas.height }
    }, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_gafs.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Project JSON downloaded", "success");
  };

  const showNotification = (msg, type) => {
    const el = document.createElement("div");
    el.className = `gafs-toast gafs-toast--${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  };

  return (
    <>
      <header className="gafs-header">
        {/* Logo section */}
        <div className="gafs-header__logo">
          <div className="gafs-logo-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" fill="url(#logoGrad)" />
              <path d="M16 8L10 11V21L16 24L22 21V11L16 8Z" fill="rgba(255,255,255,0.15)" />
              <defs>
                <linearGradient id="logoGrad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C3AED" />
                  <stop offset="1" stopColor="#2DD4BF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="gafs-logo-text">
            <span className="gafs-logo-title">GAFS</span>
            <span className="gafs-logo-sub">STUDIO</span>
          </div>
        </div>
        
        {/* Canvas Controls: Undo/Redo/Zoom */}
        <div className="gafs-header__controls">
            <div className="gafs-control-group">
                <button className="gafs-icon-btn" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" style={{display:'none'}}/><path d="M3 10h10a4 4 0 014 4v4M3 10l5-5M3 10l5 5"/></svg>
                </button>
                <button className="gafs-icon-btn" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a4 4 0 00-4 4v4M21 10l-5-5M21 10l-5 5"/></svg>
                </button>
            </div>
            
            <div className="gafs-control-group">
                <span className="gafs-zoom-label" title="Hold Ctrl + Mousewheel to zoom on canvas">
                    {Math.round(zoom * 100)}%
                </span>
            </div>
        </div>

        {/* Project name */}
        <div className="gafs-header__project">
          {editingName ? (
            <input
              className="gafs-project-name-input"
              value={projectName}
              onChange={(e) => { setProjectName(e.target.value); setIsSaved(false); }}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              autoFocus
            />
          ) : (
            <button className="gafs-project-name-btn" onClick={() => setEditingName(true)} title="Rename Project">
              {projectName}
              {!isSaved && <span className="gafs-unsaved-dot" />}
            </button>
          )}
        </div>

        {/* Actions */}
        <nav className="gafs-header__actions">
          <button className="gafs-text-btn" onClick={handleNew}>New</button>
          <button className="gafs-text-btn" onClick={handleOpenProjects}>Open</button>
          <button className="gafs-text-btn" onClick={handleSave}>Save</button>
          
          <div className="gafs-header__divider" />
          
          <button className="gafs-text-btn dropdown-anchor">
            Export ▾
            <div className="gafs-dropdown-menu">
                <div className="gafs-dropdown-item" onClick={handleExportPng}>Export as PNG</div>
                <div className="gafs-dropdown-item" onClick={handleDownloadJSON}>Download Project (JSON)</div>
            </div>
          </button>

          <button className="gafs-btn gafs-btn--ai" onClick={() => setActivePanel("ai")}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4z"/><path d="M12 10v4m0 4h.01M8.25 20.25l3.75-6 3.75 6"/></svg>
             AI Studio
          </button>

          {/* AI Status badge */}
          <div className={`gafs-ai-badge ${aiOnline ? "gafs-ai-badge--online" : "gafs-ai-badge--offline"}`} title={aiOnline ? "Connected to Stable Diffusion" : "Stable Diffusion offline"}>
            <span className="gafs-ai-badge__dot" />
          </div>
        </nav>
      </header>

      {/* Projects Modal */}
      {showProjectsModal && (
        <div className="gafs-modal-overlay" onClick={() => setShowProjectsModal(false)}>
          <div className="gafs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gafs-modal__header">
              <h2>Saved Projects</h2>
              <button className="gafs-modal__close" onClick={() => setShowProjectsModal(false)}>✕</button>
            </div>
            <div className="gafs-modal__body">
              {projects.length === 0 ? (
                <p className="gafs-empty-state">No saved projects found in backend.</p>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="gafs-project-card" onClick={() => handleLoadProject(p.id)}>
                    <div className="gafs-project-card__name">{p.name}</div>
                    <div className="gafs-project-card__meta">
                      ID: {p.id} · {p.saved_at ? new Date(p.saved_at).toLocaleString() : "Unknown date"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
