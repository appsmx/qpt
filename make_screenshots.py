"""Genera capturas (screenshots) de la PWA para el manifest / tiendas."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT, exist_ok=True)

BG_TOP = (221, 216, 201)     # #ddd8c9
BG_BOT = (233, 230, 220)     # #e9e6dc
INK = (46, 58, 54)           # #2e3a36
INK_SOFT = (92, 107, 100)    # #5c6b64
ACCENT = (111, 155, 143)     # #6f9b8f
ACCENT_DARK = (46, 74, 69)   # #2e4a45
CARD = (244, 242, 234)       # #f4f2ea
VICT = (122, 160, 196)
BAL = (111, 155, 143)
BULLY = (201, 139, 107)

FONTS = [
    "/opt/toolchains/.local/share/mise/installs/ruby/3.4.4/lib/ruby/3.4.0/rdoc/generator/template/darkfish/fonts/SourceCodePro-Bold.ttf",
    "/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf",
]

def font(size):
    for p in FONTS:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def gradient_bg(W, H):
    img = Image.new("RGB", (W, H), BG_BOT)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    return img

def center(d, text, y, fnt, fill, W):
    bbox = d.textbbox((0, 0), text, font=fnt)
    w = bbox[2] - bbox[0]
    d.text(((W - w) / 2 - bbox[0], y), text, font=fnt, fill=fill)

W, H = 1080, 1920

# ---------- Screenshot 1: inicio ----------
img = gradient_bg(W, H)
d = ImageDraw.Draw(img)
d.rounded_rectangle([70, 230, W - 70, H - 230], radius=24, fill=CARD, outline=INK, width=8)
center(d, "TEST DE AUTORREFLEXION", 330, font(36), INK_SOFT, W)
center(d, "¿Que personalidad", 470, font(78), ACCENT_DARK, W)
center(d, "tienes?", 570, font(78), ACCENT_DARK, W)
# texto intro
intro = [
    "Responde con sinceridad unas",
    "preguntas sobre como actuas",
    "en situaciones sociales.",
    "",
    "Al final obtendras un resultado",
    "del 1 al 100 que estima tu",
    "tendencia.",
]
y = 760
for line in intro:
    center(d, line, y, font(40), INK, W)
    y += 64
# boton
d.rounded_rectangle([170, 1360, W - 170, 1470], radius=10, fill=ACCENT, outline=INK, width=6)
center(d, "COMENZAR", 1390, font(52), (255, 255, 255), W)
center(d, "appsmx.github.io/qpt", H - 150, font(34), INK_SOFT, W)
img.save(os.path.join(OUT, "screenshot-1.png"))

# ---------- Screenshot 2: resultado ----------
img = gradient_bg(W, H)
d = ImageDraw.Draw(img)
d.rounded_rectangle([70, 180, W - 70, H - 180], radius=24, fill=CARD, outline=INK, width=8)
center(d, "TU RESULTADO", 300, font(40), INK_SOFT, W)
# circulo
cx, cy, r = W // 2, 640, 230
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BG_BOT, outline=INK, width=10)
center(d, "50", 520, font(180), ACCENT_DARK, W)
center(d, "/ 100", 760, font(54), INK_SOFT, W)
center(d, "Equilibrado y asertivo", 1000, font(58), ACCENT_DARK, W)
# barra de escala
bx, bw, by, bh = 160, W - 320, 1140, 26
for i in range(bw):
    t = i / bw
    if t < 0.5:
        tt = t / 0.5
        col = tuple(int(VICT[k] + (BAL[k] - VICT[k]) * tt) for k in range(3))
    else:
        tt = (t - 0.5) / 0.5
        col = tuple(int(BAL[k] + (BULLY[k] - BAL[k]) * tt) for k in range(3))
    d.line([(bx + i, by), (bx + i, by + bh)], fill=col)
d.rectangle([bx, by, bx + bw, by + bh], outline=INK, width=4)
mx = bx + int(0.5 * bw)
d.rectangle([mx - 5, by - 18, mx + 5, by + bh + 18], fill=INK)
center(d, "Abusado        Equilibrio        Abusador", by + 70, font(30), INK_SOFT, W)
# consejo
adv = [
    "Mantén ese equilibrio: cuidas",
    "tus límites y la empatía hacia",
    "los demás por igual.",
]
y = 1340
for line in adv:
    center(d, line, y, font(38), INK, W)
    y += 58
center(d, "appsmx.github.io/qpt", H - 150, font(34), INK_SOFT, W)
img.save(os.path.join(OUT, "screenshot-2.png"))

print("Capturas generadas:", os.listdir(OUT))
