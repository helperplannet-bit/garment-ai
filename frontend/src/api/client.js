// GAFS v1 — Axios API Client
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 120000,
});

// Health / Status
export const checkHealth = () => API.get("/health");

// Upload
export const uploadImage = (file) => {
  const form = new FormData();
  form.append("file", file);
  return API.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// AI Generate
export const aiGenerate = (prompt, negPrompt = "", width = 512, height = 512, steps = 20, model = null) =>
  API.post("/ai-generate", { prompt, negative_prompt: negPrompt, width, height, steps, model });

// AI Edit (img2img)
export const aiEdit = (imageBase64, prompt, negPrompt = "", strength = 0.7, steps = 20, model = null) =>
  API.post("/ai-edit", { image_base64: imageBase64, prompt, negative_prompt: negPrompt, strength, steps, model });

// AI Inpaint
export const aiInpaint = (imageBase64, maskBase64, prompt, negPrompt = "", steps = 20, model = null) =>
  API.post("/ai-inpaint", { image_base64: imageBase64, mask_base64: maskBase64, prompt, negative_prompt: negPrompt, steps, model });

// Remove Background
export const removeBg = (imageBase64) =>
  API.post("/ai-remove-bg", { image_base64: imageBase64 });

// AI Models
export const getAIModels = () => API.get("/ai-models");

// Mockup
export const listMockups = () => API.get("/mockups");
export const generateMockup = (designBase64, mockupName, posX, posY, scale) =>
  API.post("/mockup", {
    design_base64: designBase64,
    mockup_name: mockupName,
    position_x: posX,
    position_y: posY,
    scale,
  });

// Projects
export const saveProject = (data) => API.post("/save", data);
export const loadProject = (id) => API.get(`/load/${id}`);
export const listProjects = () => API.get("/projects");
export const deleteProject = (id) => API.delete(`/projects/${id}`);

export default API;
