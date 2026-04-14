import React, { useState } from "react";
import useEditorStore from "../store/useEditorStore";
import { saveProject, listProjects, loadProject } from "../api/client";
import "./Header.css";

const Header = ({ onExportPng, onExportMockup }) => {
  const {
    projectName, setProjectName, projectId, setProjectId,
    canvas, isSaved, setIsSaved, aiOnline, setActivePanel, activePanel,
  } = useEditorStore();

  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingName, setEditingName] = useState(false);

  const handleSave = async () => {
    if (!canvas) return;
    const fabricJson = canvas.toJSON(["id", "name", "selectable"]);
    try {
      const res = await saveProject({
        project_id: projectId || undefined,
        name: projectName,
        fabric_json: fabricJson,
        canvas: { width: canvas.width, height: canvas.height },
      });
      setProjectId(res.data.id);
      setIsSaved(true);
      showNotification("Project saved ✓", "success");
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
        canvas.loadFromJSON(proj.fabric_json, () => canvas.renderAll());
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

  const showNotification = (msg, type) => {
    const el = document.createElement("div");
    el.className = `gafs-toast gafs-toast--${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
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
            <span className="gafs-logo-sub">v1 Studio</span>
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
            <button className="gafs-project-name-btn" onClick={() => setEditingName(true)}>
              {projectName}
              {!isSaved && <span className="gafs-unsaved-dot" />}
            </button>
          )}
        </div>

        {/* Actions */}
        <nav className="gafs-header__actions">
          <button className="gafs-btn gafs-btn--ghost" onClick={handleNew} title="New Project">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"/></svg>
            New
          </button>
          <button className="gafs-btn gafs-btn--ghost" onClick={handleOpenProjects} title="Open Project">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
            Open
          </button>
          <button className="gafs-btn gafs-btn--ghost" onClick={handleSave} title="Save Project">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z"/></svg>
            Save
          </button>

          <div className="gafs-header__divider" />

          <button className="gafs-btn gafs-btn--primary" onClick={onExportPng} title="Export PNG">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            Export PNG
          </button>

          {/* AI Status badge */}
          <div className={`gafs-ai-badge ${aiOnline ? "gafs-ai-badge--online" : "gafs-ai-badge--offline"}`}>
            <span className="gafs-ai-badge__dot" />
            <span className="gafs-ai-badge__text">{aiOnline ? "AI ENGINE ONLINE" : "AI ENGINE OFFLINE"}</span>
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
                <p className="gafs-empty-state">No saved projects yet.</p>
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
