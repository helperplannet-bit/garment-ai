# GAFS v1 — Garment AI Factory System

> A local AI-powered garment design studio — Canva-like editor + Stable Diffusion AI + Mockup Generator.

---

## 🚀 Quick Start

### Step 1 — Install Everything
Double-click `install.bat`
*(Or run manually — see below)*

### Step 2 — Start Backend
Double-click `start-backend.bat`
- Runs FastAPI at **http://localhost:8000**
- API docs at **http://localhost:8000/docs**

### Step 3 — Start Frontend
Double-click `start-frontend.bat`
- Opens React studio at **http://localhost:3000**

---

## 🧩 Modules

| Module | Description |
|--------|-------------|
| 🎨 Design Editor | Fabric.js canvas — text, shapes, images, layers, undo/redo |
| 🤖 AI Studio | Stable Diffusion txt2img / img2img / inpaint / remove-bg |
| 🖼 Mockup Generator | Overlay design on T-shirt templates |
| 💾 Project System | Save/load projects as JSON |
| 🔌 API Backend | FastAPI with all endpoints |

---

## ⚙️ Manual Install

### Backend (Python 3.10+)
```bat
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend (Node.js 18+)
```bat
cd frontend
npm install
npm start
```

---

## 🤖 AI Features (Optional)

AI features require **AUTOMATIC1111 Stable Diffusion** running locally:

1. Install AUTOMATIC1111: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Run `webui-user.bat`
3. Make sure it starts at **http://127.0.0.1:7860**
4. The GAFS AI badge will turn **green** when connected

> Without SD running, all other features (canvas, mockup, save/load) work normally.

---

## 📁 Project Structure

```
garment-ai/
├── backend/
│   ├── main.py              ← FastAPI app
│   ├── modules/
│   │   ├── ai_engine.py     ← Stable Diffusion API
│   │   ├── mockup.py        ← Mockup compositor (Pillow)
│   │   └── project.py       ← Save/load JSON
│   ├── assets/              ← Uploaded images
│   ├── outputs/             ← Generated mockups
│   ├── mockups/             ← T-shirt templates
│   ├── projects/            ← Saved projects (JSON)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/      ← All React components
│       ├── api/client.js    ← Axios API client
│       └── store/           ← Zustand global state
├── install.bat              ← One-click install
├── start-backend.bat        ← Run backend
└── start-frontend.bat       ← Run frontend
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Backend + AI status |
| POST | `/upload` | Upload image |
| POST | `/ai-generate` | Text → Image (SD) |
| POST | `/ai-edit` | Img2Img edit (SD) |
| POST | `/ai-inpaint` | Inpainting (SD) |
| POST | `/ai-remove-bg` | Remove background |
| POST | `/mockup` | Generate mockup |
| GET | `/mockups` | List templates |
| POST | `/save` | Save project |
| GET | `/load/{id}` | Load project |
| GET | `/projects` | List all projects |
| DELETE | `/projects/{id}` | Delete project |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `T` | Text tool |
| `R` | Rectangle |
| `C` | Circle |
| `Delete` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+D` | Duplicate |
| `[` | Send backward |
| `]` | Bring forward |

---

*Built with React + Fabric.js + FastAPI + Stable Diffusion*
