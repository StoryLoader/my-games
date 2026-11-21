#!/usr/bin/env python3
"""thumbnail.py <frame.jpg> <claude-symbol.svg> <out.jpg> — the Shorts thumbnail (1080×1920) of 「악몽을 지키는 파수꾼」.
A frame of the film (library still.mjs, t = 88.5 s: the giant moth on the cottage roof, 노을 below with her hand lantern),
the label "코드로 만든 단편 시네마" with the Claude symbol (Anthropic's mark, from Wikimedia Commons File:Claude_AI_symbol.svg),
and the title. Fonts: Gowun Batang Bold (SIL OFL 1.1). Needs Pillow and svg.path."""
import re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
from svg.path import parse_path, Move

frame, svgf, out = sys.argv[1:4]
FONT = '/home/user/my-games/nightmare-lecture/fonts/gowun-batang/GowunBatang-Bold.ttf'
W, H = 1080, 1920
img = Image.open(frame).convert('RGB').resize((W, H))
# tighten a little on the cottage and the moth
z = 1.10; cw, ch = int(W / z), int(H / z); x0 = (W - cw) // 2; y0 = int((H - ch) * 0.35)
img = img.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)
img = ImageEnhance.Brightness(img).enhance(1.12); img = ImageEnhance.Contrast(img).enhance(1.06)
# darken the band where the type sits (lower middle) so the title reads, keep the moth and the windows bright
shade = Image.new('L', (W, H), 0); d = ImageDraw.Draw(shade)
for y in range(H):
    a = 0
    if y > 1000: a = min(205, int((y - 1000) / 260 * 205))
    if y < 260: a = max(a, int((260 - y) / 260 * 120))
    d.line([(0, y), (W, y)], fill=a)
img = Image.composite(Image.new('RGB', (W, H), (6, 5, 14)), img, shade)

def text_layer(txt, font, fill, xy, anchor='mm', glow=None, gr=18, ga=1.0):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if glow:
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(g).text(xy, txt, font=font, fill=glow, anchor=anchor)
        g = g.filter(ImageFilter.GaussianBlur(gr))
        for _ in range(2): lay = Image.alpha_composite(lay, g)
    ImageDraw.Draw(lay).text(xy, txt, font=font, fill=fill, anchor=anchor)
    return lay

base = img.convert('RGBA')
# title, two lines, warm white with a violet glow (the moth's colour) and a dark edge
f1 = ImageFont.truetype(FONT, 132); f2 = ImageFont.truetype(FONT, 176)
for txt, f, y in (('악몽을 지키는', f1, 1352), ('파수꾼', f2, 1540)):
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((W // 2, y + 8), txt, font=f, fill=(0, 0, 0, 200), anchor='mm')
    base = Image.alpha_composite(base, sh.filter(ImageFilter.GaussianBlur(10)))
    base = Image.alpha_composite(base, text_layer(txt, f, (255, 238, 210, 255), (W // 2, y), glow=(170, 110, 255, 230), gr=26))

# the label with the Claude symbol in front of it
fl = ImageFont.truetype(FONT, 58); label = '코드로 만든 단편 시네마'
tw = ImageDraw.Draw(Image.new('RGB', (1, 1))).textbbox((0, 0), label, font=fl)[2]
S = 84; gap = 22; total = S + gap + tw; lx = (W - total) // 2; ly = 1168
svg = open(svgf, encoding='utf-8').read()
d_attr = re.search(r'<path[^>]*\sd="([^"]+)"', svg).group(1)
path = parse_path(d_attr); SS = 4; sym = Image.new('L', (100 * SS, 100 * SS), 0); sd = ImageDraw.Draw(sym)
polys, cur = [], []
for seg in path:
    if isinstance(seg, Move):
        if len(cur) > 2: polys.append(cur)
        cur = []; continue
    n = 12 if type(seg).__name__ in ('CubicBezier', 'QuadraticBezier', 'Arc') else 1
    for i in range(n + 1):
        p = seg.point(i / n); cur.append((p.real * SS, p.imag * SS))
if len(cur) > 2: polys.append(cur)
for p in polys: sd.polygon(p, fill=255)
sym = sym.resize((S, S), Image.LANCZOS)
col = Image.new('RGBA', (S, S), (217, 119, 87, 255)); col.putalpha(sym)
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); glow.paste(col, (lx, ly - S // 2), col)
base = Image.alpha_composite(base, glow.filter(ImageFilter.GaussianBlur(10)))
base.alpha_composite(col, (lx, ly - S // 2))
base = Image.alpha_composite(base, text_layer(label, fl, (255, 224, 190, 255), (lx + S + gap, ly + 2), anchor='lm', glow=(255, 150, 70, 170), gr=14))
# a thin rule between label and title
rl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(rl).line([(W // 2 - 170, 1240), (W // 2 + 170, 1240)], fill=(230, 200, 150, 150), width=3)
base = Image.alpha_composite(base, rl)
base.convert('RGB').save(out, quality=93)
print(out)
