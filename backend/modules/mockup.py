"""
GAFS v1 — Mockup Generator Module
Composites a user design onto a T-shirt base template using Pillow.
"""

import base64
import io
import os
from PIL import Image, ImageFilter

MOCKUPS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mockups")


def get_available_mockups() -> list:
    """Return list of available mockup template names."""
    if not os.path.exists(MOCKUPS_DIR):
        return []
    return [f for f in os.listdir(MOCKUPS_DIR) if f.lower().endswith(".png")]


def composite_design_on_mockup(
    design_base64: str,
    mockup_name: str,
    position_x: float = 0.5,   # 0.0–1.0 relative to mockup width
    position_y: float = 0.35,  # 0.0–1.0 relative to mockup height
    scale: float = 0.4,        # fraction of mockup width
) -> str:
    """
    Overlay a design image onto a T-shirt mockup template.
    
    Args:
        design_base64: Base64-encoded PNG design (with transparency)
        mockup_name: Filename of the base mockup template
        position_x: Horizontal center (0–1 fraction of mockup width)
        position_y: Vertical center (0–1 fraction of mockup height)
        scale: Design width as fraction of mockup width

    Returns:
        Base64-encoded composite PNG
    """
    # Load mockup template
    mockup_path = os.path.join(MOCKUPS_DIR, mockup_name)
    if not os.path.exists(mockup_path):
        raise FileNotFoundError(f"Mockup template not found: {mockup_name}")

    mockup = Image.open(mockup_path).convert("RGBA")
    mw, mh = mockup.size

    # Decode design
    design_data = base64.b64decode(design_base64)
    design = Image.open(io.BytesIO(design_data)).convert("RGBA")

    # Scale design
    target_width = int(mw * scale)
    ratio = target_width / design.width
    target_height = int(design.height * ratio)
    design = design.resize((target_width, target_height), Image.LANCZOS)

    # Calculate top-left position
    paste_x = int(mw * position_x) - target_width // 2
    paste_y = int(mh * position_y) - target_height // 2

    # Composite
    composite = mockup.copy()
    composite.paste(design, (paste_x, paste_y), mask=design)

    # Return as base64
    buffer = io.BytesIO()
    composite.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def generate_placeholder_mockup(mockup_name: str = "tshirt_front.png"):
    """
    Generate a simple placeholder T-shirt mockup template programmatically
    if no real template exists.
    """
    from PIL import ImageDraw, ImageFont

    os.makedirs(MOCKUPS_DIR, exist_ok=True)
    path = os.path.join(MOCKUPS_DIR, mockup_name)

    if os.path.exists(path):
        return  # Already exists

    # Create a simple T-shirt silhouette
    w, h = 600, 700
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # T-shirt color
    shirt_color = (30, 30, 40, 255)  # Dark navy

    # Body
    draw.rectangle([120, 200, 480, 650], fill=shirt_color)

    # Left sleeve
    sleeve_l = [(120, 200), (20, 160), (60, 300), (120, 320)]
    draw.polygon(sleeve_l, fill=shirt_color)

    # Right sleeve
    sleeve_r = [(480, 200), (580, 160), (540, 300), (480, 320)]
    draw.polygon(sleeve_r, fill=shirt_color)

    # Collar (cut out effect)
    draw.ellipse([230, 180, 370, 250], fill=(0, 0, 0, 0))

    # Subtle shading on sides
    for i in range(30):
        alpha = int(40 * (i / 30))
        draw.line([(120 + i, 200), (120 + i, 650)], fill=(0, 0, 0, alpha))
        draw.line([(480 - i, 200), (480 - i, 650)], fill=(0, 0, 0, alpha))

    img.save(path, format="PNG")
    print(f"Generated placeholder mockup: {path}")
