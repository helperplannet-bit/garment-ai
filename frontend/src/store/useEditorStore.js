import { create } from "zustand";

const useEditorStore = create((set, get) => ({
  // Canvas state
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  // Tool state
  activeTool: "select", // select | text | rect | circle | triangle | image | brush | move | eraser | mask
  setActiveTool: (tool) => set({ activeTool: tool }),

  // View state
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  zoom: 1,
  setZoom: (val) => set({ zoom: val }),

  // History system
  history: [],
  historyIndex: -1,
  pushHistory: (state) =>
    set((s) => {
      const trimmed = s.history.slice(0, s.historyIndex + 1);
      return { history: [...trimmed, state], historyIndex: trimmed.length };
    }),
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
  undo: () => {
    const { historyIndex, history, canvas } = get();
    if (historyIndex > 0 && canvas) {
      canvas.loadFromJSON(history[historyIndex - 1], () => {
        canvas.renderAll();
        set({ historyIndex: historyIndex - 1 });
      });
    }
  },
  redo: () => {
    const { historyIndex, history, canvas } = get();
    if (historyIndex < history.length - 1 && canvas) {
      canvas.loadFromJSON(history[historyIndex + 1], () => {
        canvas.renderAll();
        set({ historyIndex: historyIndex + 1 });
      });
    }
  },

  // Sidebar & Layers
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),
  layers: [],
  setLayers: (layers) => set({ layers }),
  
  // Project tracking
  projectName: "Untitled Project",
  projectId: null,
  setProjectName: (name) => set({ projectName: name }),
  setProjectId: (id) => set({ projectId: id }),
  isSaved: true,
  setIsSaved: (v) => set({ isSaved: v }),

  // AI Connection & Status
  aiOnline: false,
  setAiOnline: (v) => set({ aiOnline: v }),
  aiModels: [],
  setAiModels: (models) => set({ aiModels: models }),
  aiLoading: false,
  setAiLoading: (v) => set({ aiLoading: v }),
  lastAiImage: null,
  setLastAiImage: (img) => set({ lastAiImage: img }),

  // UI Panels
  activePanel: null, // null | "ai" | "mockup"
  setActivePanel: (p) => set((s) => ({ activePanel: s.activePanel === p ? null : p })),

  // Mockup settings
  mockupResult: null,
  setMockupResult: (img) => set({ mockupResult: img }),
  
  // Base canvas settings
  canvasWidth: 800,
  canvasHeight: 600,
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
}));

export default useEditorStore;
