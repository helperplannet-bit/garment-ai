"""
GAFS v1 — Project Save/Load Module
Handles JSON project persistence to disk.
"""

import base64
import json
import os
import uuid
import re
from datetime import datetime

# Path relative to backend
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECTS_DIR = os.path.join(BASE_DIR, "projects")
BLOBS_DIR = os.path.join(BASE_DIR, "assets", "blobs")


def ensure_dir():
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    os.makedirs(BLOBS_DIR, exist_ok=True)


def extract_blobs(data: dict) -> dict:
    """
    Recursively find base64 image strings in project data,
    save them to BLOBS_DIR, and replace with filenames.
    """
    # Simple regex for data:image/png;base64,...
    # This is a bit naive but works for Fabric.js image sources
    data_str = json.dumps(data)
    
    def replace_b64(match):
        prefix = match.group(1)
        b64_content = match.group(2)
        blob_id = f"blob_{uuid.uuid4().hex[:8]}.png"
        blob_path = os.path.join(BLOBS_DIR, blob_id)
        
        try:
            with open(blob_path, "wb") as f:
                f.write(base64.b64decode(b64_content))
            # Return URL/Path for the frontend to consume
            return f'"{prefix}/assets/blobs/{blob_id}"'
        except Exception:
            return match.group(0)

    # Regex to find "src": "data:image/png;base64,..."
    # We look for "src": "data:image/...;base64,[A-Za-z0-9+/=]+"
    pattern = r'"src":\s*"data:image/[^;]+;base64,([^"]+)"'
    
    # We'll do it manually to handle the replacement better
    # Actually, let's just use a simpler approach for now: 
    # Iterate through objects in fabric_json if present
    if "fabric_json" in data and "objects" in data["fabric_json"]:
        for obj in data["fabric_json"]["objects"]:
            if obj.get("type") == "image" and obj.get("src", "").startswith("data:image"):
                src = obj["src"]
                try:
                    b64_part = src.split(",")[1]
                    blob_id = f"blob_{uuid.uuid4().hex[:8]}.png"
                    blob_path = os.path.join(BLOBS_DIR, blob_id)
                    with open(blob_path, "wb") as f:
                        f.write(base64.b64decode(b64_part))
                    # Point to the backend URL (relative for simplicity)
                    obj["src"] = f"/assets/blobs/{blob_id}"
                except Exception as e:
                    print(f"Failed to extract blob: {e}")
    
    return data


def save_project(project_data: dict, project_id: str = None) -> dict:
    """
    Save a project JSON to disk.
    Returns the project metadata (id, name, saved_at).
    """
    ensure_dir()

    # Extract large images to separate files
    project_data = extract_blobs(project_data)

    if not project_id:
        project_id = str(uuid.uuid4())[:8]

    project_data["id"] = project_id
    project_data["saved_at"] = datetime.now().isoformat()

    filename = f"{project_id}.json"
    filepath = os.path.join(PROJECTS_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(project_data, f, indent=2, ensure_ascii=False)

    return {
        "id": project_id,
        "name": project_data.get("name", "Untitled Project"),
        "saved_at": project_data["saved_at"],
        "file": filename,
    }


def load_project(project_id: str) -> dict:
    """Load a project JSON from disk by ID."""
    ensure_dir()
    filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Project not found: {project_id}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def list_projects() -> list:
    """Return a list of all saved projects (metadata only)."""
    ensure_dir()
    projects = []
    for filename in os.listdir(PROJECTS_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(PROJECTS_DIR, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                projects.append({
                    "id": data.get("id", filename.replace(".json", "")),
                    "name": data.get("name", "Untitled"),
                    "saved_at": data.get("saved_at", ""),
                    "canvas_size": data.get("canvas", {}).get("size", {}),
                })
            except Exception:
                pass
    return sorted(projects, key=lambda x: x["saved_at"], reverse=True)


def delete_project(project_id: str) -> bool:
    """Delete a project by ID."""
    filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if os.path.exists(filepath):
        os.remove(filepath)
        return True
    return False
