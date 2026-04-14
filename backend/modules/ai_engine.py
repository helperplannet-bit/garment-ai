"""
GAFS v1 — AI Engine Module
Connects to Stable Diffusion AUTOMATIC1111 local API (port 7860)
Handles: txt2img, img2img, inpainting
"""

import base64
import io
import requests
from PIL import Image

SD_BASE_URL = "http://127.0.0.1:7860"
TIMEOUT = 120  # seconds

def check_sd_status() -> dict:
    """Check if Stable Diffusion API is reachable."""
    try:
        r = requests.get(f"{SD_BASE_URL}/sdapi/v1/options", timeout=5)
        if r.status_code == 200:
            return {"online": True, "message": "Stable Diffusion is online"}
    except Exception:
        pass
    return {"online": False, "message": "Stable Diffusion offline — start AUTOMATIC1111 at port 7860"}


def text_to_image(prompt: str, negative_prompt: str = "", width: int = 512, height: int = 512, steps: int = 20) -> str:
    """
    Generate image from text prompt via SD txt2img API.
    Returns base64-encoded PNG string.
    """
    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "width": width,
        "height": height,
        "steps": steps,
        "cfg_scale": 7,
        "sampler_name": "DPM++ 2M Karras",
        "batch_size": 1,
        "n_iter": 1,
    }
    try:
        r = requests.post(f"{SD_BASE_URL}/sdapi/v1/txt2img", json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        return data["images"][0]  # base64 string
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Cannot connect to Stable Diffusion. Make sure AUTOMATIC1111 is running at port 7860.")
    except Exception as e:
        raise RuntimeError(f"AI generation failed: {str(e)}")


def image_to_image(base64_image: str, prompt: str, negative_prompt: str = "", strength: float = 0.7, steps: int = 20) -> str:
    """
    Modify existing image based on prompt (img2img).
    Returns base64-encoded PNG string.
    """
    payload = {
        "init_images": [base64_image],
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "denoising_strength": strength,
        "steps": steps,
        "cfg_scale": 7,
        "sampler_name": "DPM++ 2M Karras",
        "batch_size": 1,
    }
    try:
        r = requests.post(f"{SD_BASE_URL}/sdapi/v1/img2img", json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        return data["images"][0]
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Cannot connect to Stable Diffusion. Make sure AUTOMATIC1111 is running at port 7860.")
    except Exception as e:
        raise RuntimeError(f"AI edit failed: {str(e)}")


def inpaint(base64_image: str, base64_mask: str, prompt: str, negative_prompt: str = "", steps: int = 20) -> str:
    """
    Inpainting — edit a masked area of an image.
    Returns base64-encoded PNG string.
    """
    payload = {
        "init_images": [base64_image],
        "mask": base64_mask,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "inpainting_fill": 1,  # 0: fill, 1: original, 2: latent noise, 3: latent nothing
        "inpaint_full_res": True,
        "inpaint_full_res_padding": 32,
        "mask_blur": 4,
        "resize_mode": 0,
        "steps": steps,
        "cfg_scale": 7,
        "sampler_name": "DPM++ 2M Karras",
        "batch_size": 1,
        "denoising_strength": 0.75,
        "mask_mode": 0,  # 0: Inpaint masked, 1: Inpaint not masked
        "inpainting_mask_invert": 0,
    }
    try:
        r = requests.post(f"{SD_BASE_URL}/sdapi/v1/img2img", json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        return data["images"][0]
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Cannot connect to Stable Diffusion.")
    except Exception as e:
        raise RuntimeError(f"Inpainting failed: {str(e)}")


def remove_background(base64_image: str) -> str:
    """
    Simple background removal using PIL (no AI required).
    Converts white/near-white background to transparent.
    Returns base64-encoded PNG string.
    """
    try:
        img_data = base64.b64decode(base64_image)
        img = Image.open(io.BytesIO(img_data)).convert("RGBA")
        data = img.getdata()
        new_data = []
        for item in data:
            # Make near-white pixels transparent
            if item[0] > 200 and item[1] > 200 and item[2] > 200:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        img.putdata(new_data)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Background removal failed: {str(e)}")
