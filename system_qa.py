import requests
import base64
import time
import os
import json

BASE_URL = "http://localhost:8000"

# Small red square base64
TEST_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAALUlEQVRYR+3QQREAAAzCQJ9/aaYx8D0mIDSTZlIKpAApECmQAqlACqQCKZAKpIAnE1GqAXOn7VMAAAAASUVORK5CYII="

def log(msg, status="INFO"):
    colors = {"INFO": "\033[94m", "SUCCESS": "\033[92m", "FAIL": "\033[91m", "RESET": "\033[0m"}
    print(f"{colors.get(status, '')}[{status}] {msg}{colors['RESET']}")

def run_tests():
    log("Starting Full System QA Workflow...", "INFO")
    
    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        if r.status_code == 200:
            log("Backend is accessible", "SUCCESS")
        else:
            log(f"Backend returned {r.status_code}", "FAIL")
            return
    except Exception as e:
        log(f"Backend offline: {e}", "FAIL")
        return

    # 2. Upload test image
    log("Testing Image Upload...")
    img_data = base64.b64decode(TEST_IMAGE_B64)
    files = {'file': ('test.png', img_data, 'image/png')}
    start = time.time()
    r = requests.post(f"{BASE_URL}/upload", files=files)
    elapsed = time.time() - start
    if r.status_code == 200:
        log(f"Upload successful ({elapsed:.2f}s)", "SUCCESS")
    else:
        log(f"Upload failed: {r.text}", "FAIL")

    # 3. AI Generate (Skip if SD Offline)
    log("Testing AI Generate (skipping if SD offline)...")
    payload = {"prompt": "a red cat", "steps": 1}
    try:
        r = requests.post(f"{BASE_URL}/ai-generate", json=payload, timeout=20)
        if r.status_code == 200:
            log("AI Generate successful", "SUCCESS")
        else:
            log(f"AI Generate skipped or failed (Status: {r.status_code})", "INFO")
    except:
        log("AI Generate timeout (SD likely offline)", "INFO")

    # 4. Project Save/Load (Integrated Fix Test)
    log("Testing Project System (Optimized Blob Storage)...")
    project_data = {
        "name": "QA Test Project",
        "fabric_json": {
            "objects": [
                {"type": "image", "src": f"data:image/png;base64,{TEST_IMAGE_B64}"}
            ]
        }
    }
    r = requests.post(f"{BASE_URL}/save", json=project_data)
    if r.status_code == 200:
        p_id = r.json().get("id")
        log(f"Project saved (ID: {p_id})", "SUCCESS")
        
        # Verify blob extraction
        r_load = requests.get(f"{BASE_URL}/load/{p_id}")
        proj = r_load.json().get("project", {})
        src = proj.get("fabric_json", {}).get("objects", [{}])[0].get("src", "")
        if "/assets/blobs/" in src:
            log("Blob extraction verified! base64 replaced with file path.", "SUCCESS")
        else:
            log("Blob extraction failed to replace base64.", "FAIL")
    else:
        log(f"Project save failed: {r.text}", "FAIL")

    # 5. Mockup Generation
    log("Testing Mockup Generation...")
    mock_payload = {
        "design_base64": TEST_IMAGE_B64,
        "mockup_name": "tshirt_front.png",
        "position_x": 0.5,
        "position_y": 0.35,
        "scale": 0.4
    }
    r = requests.post(f"{BASE_URL}/mockup", json=mock_payload)
    if r.status_code == 200:
        log("Mockup generation successful", "SUCCESS")
    else:
        log(f"Mockup generation failed: {r.text}", "FAIL")

    log("QA Workflow Completed.", "INFO")

if __name__ == "__main__":
    run_tests()
