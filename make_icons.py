"""Genera los iconos PNG del juego (minimalista retro)."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

BG = (46, 74, 69)        # verde salvia oscuro  #2e4a45
CREAM = (244, 242, 234)  # crema                #f4f2ea
ACCENT = (111, 155, 143)  # verde salvia         #6f9b8f

FONT_CANDIDATES = [
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/opt/toolchains/.local/share/mise/installs/ruby/3.4.4/lib/ruby/3.4.0/rdoc/generator/template/darkfish/fonts/SourceCodePro-Bold.ttf",
    "/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf",
]

def get_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def rounded(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)

def draw_icon(size, maskable=False):
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)

    # Para maskable dejamos zona de seguridad (no dibujamos forma hasta el borde)
    pad = int(size * (0.18 if maskable else 0.12))
    inner = (pad, pad, size - pad, size - pad)

    if not maskable:
        # tarjeta interior crema con borde
        rounded(d, inner, radius=int(size * 0.12), fill=ACCENT)
        b2 = (pad + size * 0.04, pad + size * 0.04, size - pad - size * 0.04, size - pad - size * 0.04)
        rounded(d, b2, radius=int(size * 0.10), fill=BG)

    # Signo de interrogacion centrado
    font = get_font(int(size * 0.55))
    text = "?"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1]
    d.text((tx, ty), text, font=font, fill=CREAM)
    return img

draw_icon(192).save(os.path.join(OUT, "icon-192.png"))
draw_icon(512).save(os.path.join(OUT, "icon-512.png"))
draw_icon(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))
print("Iconos generados en", OUT)
print(os.listdir(OUT))
