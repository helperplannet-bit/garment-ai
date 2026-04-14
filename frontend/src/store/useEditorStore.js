// GAFS v1 — Global State Store (Zustand)
import { create } from "zustand";

const useEditorStore = create((set, get) => ({
  // Canvas state
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  // Active tool
  activeTool: "select", // select | text | rect | circle | triangle | image | brush
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Grid visibility
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  // History
  history: [],
  historyIndex: -1,
  pushHistory: (state) =>
    set((s) => {
      const trimmed = s.history.slice(0, s.historyIndex + 1);
      return {
        history: [...trimmed, state],
        historyIndex: trimmed.length,
      };
    }),
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  undo: () => {
    const { history, historyIndex, canvas } = get();
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const state = history[nextIndex];
      set({ historyIndex: nextIndex });
      if (canvas) {
        canvas.loadFromJSON(state, () => canvas.renderAll());
      }
    }
  },

  redo: () => {
    const { history, historyIndex, canvas } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      set({ historyIndex: nextIndex });
      if (canvas) {
        canvas.loadFromJSON(state, () => canvas.renderAll());
      }
    }
  },

  // Selected object properties
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),

  // Layers
  layers: [],
  setLayers: (layers) => set({ layers }),

  // Project
  projectName: "Untitled Project",
  projectId: null,
  setProjectName: (name) => set({ projectName: name }),
  setProjectId: (id) => set({ projectId: id }),
  isSaved: true,
  setIsSaved: (v) => set({ isSaved: v }),

  // AI Status
  aiOnline: false,
  setAiOnline: (v) => set({ aiOnline: v }),
  aiLoading: false,
  setAiLoading: (v) => set({ aiLoading: v }),
  lastAiImage: null,
  setLastAiImage: (img) => set({ lastAiImage: img }),

  // Panels
  activePanel: null, // null | "ai" | "mockup" | "projects"
  setActivePanel: (p) => set((s) => ({ activePanel: s.activePanel === p ? null : p })),

  // Mockup
  mockupResult: null,
  setMockupResult: (img) => set({ mockupResult: img }),

  // Canvas config
  canvasWidth: 800,
  canvasHeight: 600,
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
}));

export default useEditorStore;
