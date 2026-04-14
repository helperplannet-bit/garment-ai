"""
GAFS v1 — FastAPI Backend
Garment AI Factory System — Main Application
"""

import base64
import io
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from modules import ai_engine, mockup as mockup_module, project as project_module

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Garment AI Factory System API",
    description="GAFS v1 — Backend for local AI garment design studio",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "assets"
OUTPUTS_DIR = BASE_DIR / "outputs"
MOCKUPS_DIR = BASE_DIR / "mockups"

for d in [ASSETS_DIR, OUTPUTS_DIR, MOCKUPS_DIR]:
    d.mkdir(exist_ok=True)

# Serve static files
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")

# Generate placeholder mockup on startup
try:
    mockup_module.generate_placeholder_mockup("tshirt_front.png")
    mockup_module.generate_placeholder_mockup("tshirt_back.png")
except Exception as e:
    print(f"Warning: Could not generate placeholder mockups: {e}")


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class AIGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    width: Optional[int] = 512
    height: Optional[int] = 512
    steps: Optional[int] = 20
    model: Optional[str] = None

class AIEditRequest(BaseModel):
    image_base64: str
    prompt: str
    negative_prompt: Optional[str] = ""
    strength: Optional[float] = 0.7
    steps: Optional[int] = 20
    model: Optional[str] = None

class InpaintRequest(BaseModel):
    image_base64: str
    mask_base64: str
    prompt: str
    negative_prompt: Optional[str] = ""
    steps: Optional[int] = 20
    model: Optional[str] = None

class BackgroundRemoveRequest(BaseModel):
    image_base64: str

class MockupRequest(BaseModel):
    design_base64: str
    mockup_name: Optional[str] = "tshirt_front.png"
    position_x: Optional[float] = 0.5
    position_y: Optional[float] = 0.35
    scale: Optional[float] = 0.4

class SaveProjectRequest(BaseModel):
    project_id: Optional[str] = None
    name: Optional[str] = "Untitled Project"
    canvas: Optional[dict] = {}
    elements: Optional[list] = []
    images: Optional[list] = []
    text: Optional[list] = []
    fabric_json: Optional[dict] = None


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "GAFS v1 API is running", "status": "ok"}


@app.get("/health")
def health():
    """Check backend + AI engine status."""
    ai_status = ai_engine.check_sd_status()
    return {
        "backend": "ok",
        "ai_engine": ai_status,
        "mockups": mockup_module.get_available_mockups(),
    }


# ── Module 1: File Upload ─────────────────────────────────────────────────────

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file. Returns URL path to access it."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    ext = Path(file.filename).suffix or ".png"
    unique_name = f"{uuid.uuid4().hex[:8]}{ext}"
    dest = ASSETS_DIR / unique_name

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {
        "filename": unique_name,
        "url": f"/assets/{unique_name}",
        "original_name": file.filename,
        "size": dest.stat().st_size,
    }


# ── Module 2: AI Image Generation ─────────────────────────────────────────────

@app.post("/ai-generate")
def ai_generate(req: AIGenerateRequest):
    """Generate an image from a text prompt using Stable Diffusion txt2img."""
    try:
        image_b64 = ai_engine.text_to_image(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            steps=req.steps,
            model=req.model,
        )
        return {
            "success": True,
            "image_base64": image_b64,
            "prompt": req.prompt,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/ai-edit")
def ai_edit(req: AIEditRequest):
    """Modify an existing image using Stable Diffusion img2img."""
    try:
        image_b64 = ai_engine.image_to_image(
            base64_image=req.image_base64,
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            strength=req.strength,
            steps=req.steps,
            model=req.model,
        )
        return {"success": True, "image_base64": image_b64}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/ai-inpaint")
def ai_inpaint(req: InpaintRequest):
    """Inpainting — edit a specific masked area of an image."""
    try:
        image_b64 = ai_engine.inpaint(
            base64_image=req.image_base64,
            base64_mask=req.mask_base64,
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            steps=req.steps,
            model=req.model,
        )
        return {"success": True, "image_base64": image_b64}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/ai-remove-bg")
def ai_remove_background(req: BackgroundRemoveRequest):
    """Remove background from an image (white → transparent)."""
    try:
        result_b64 = ai_engine.remove_background(req.image_base64)
        return {"success": True, "image_base64": result_b64}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai-models")
def list_ai_models():
    """Retrieve available stable diffusion models."""
    return {"models": ai_engine.get_sd_models()}

# ── Module 3: Mockup Generator ────────────────────────────────────────────────

@app.get("/mockups")
def list_mockups():
    """List available T-shirt mockup templates."""
    return {"mockups": mockup_module.get_available_mockups()}


@app.post("/mockup")
def generate_mockup(req: MockupRequest):
    """Composite a design image onto a T-shirt mockup template."""
    try:
        composite_b64 = mockup_module.composite_design_on_mockup(
            design_base64=req.design_base64,
            mockup_name=req.mockup_name,
            position_x=req.position_x,
            position_y=req.position_y,
            scale=req.scale,
        )
        # Optionally save to outputs
        out_name = f"mockup_{uuid.uuid4().hex[:8]}.png"
        out_path = OUTPUTS_DIR / out_name
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(composite_b64))

        return {
            "success": True,
            "image_base64": composite_b64,
            "output_url": f"/outputs/{out_name}",
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Module 4: Project System ──────────────────────────────────────────────────

@app.post("/save")
def save_project(req: SaveProjectRequest):
    """Save a project to disk as JSON."""
    try:
        data = req.dict()
        result = project_module.save_project(data, project_id=req.project_id)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects")
def list_projects():
    """List all saved projects."""
    try:
        return {"projects": project_module.list_projects()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/load/{project_id}")
def load_project(project_id: str):
    """Load a project by ID."""
    try:
        data = project_module.load_project(project_id)
        return {"success": True, "project": data}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/projects/{project_id}")
def delete_project(project_id: str):
    """Delete a project by ID."""
    deleted = project_module.delete_project(project_id)
    if deleted:
        return {"success": True, "message": f"Project {project_id} deleted"}
    raise HTTPException(status_code=404, detail="Project not found")
