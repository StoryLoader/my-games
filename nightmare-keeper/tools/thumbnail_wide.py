#!/usr/bin/env python3
"""thumbnail_wide.py <frame.jpg> <claude-symbol.svg> <out.jpg> — the YouTube thumbnail (1280×720) of the long-form lecture
「악몽을 지키는 파수꾼」 제작기. A landscape frame of the film (library still.mjs, t = 88.5 s: the giant moth on the cottage roof,
노을 below with her hand lantern), darkened on the left for the type: the Claude symbol (Anthropic's mark, Wikimedia Commons
File:Claude_AI_symbol.svg) with "코드로 만든 단편 시네마", the title in two lines and a subtitle. Gowun Batang Bold (SIL OFL 1.1).
Needs Pillow and svg.path."""
import re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
from svg.path import parse_path, Move

frame, svgf, out = sys.argv[1:4]
FONT = '/home/user/my-games/nightmare-lecture/fonts/gowun-batang/GowunBatang-Bold.ttf'
W, H = 1280, 720
img = Image.open(frame).convert('RGB')
# frame the cottage and the moth on the right: a slight push in, shifted so the cottage sits right of centre
z = 1.12; cw, ch = int(img.width / z), int(img.height / z); x0 = int((img.width - cw) * 0.62); y0 = int((img.height - ch) * 0.30)
img = img.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)
img = ImageEnhance.Brightness(img).enhance(1.15); img = ImageEnhance.Contrast(img).enhance(1.06)
shade = Image.new('L', (W, H), 0); d = ImageDraw.Draw(shade)
for x in range(W):
    a = int(max(0, min(1, (760 - x) / 560)) ** 1.2 * 225)
    d.line([(x, 0), (x, H)], fill=a)
img = Image.composite(Image.new('RGB', (W, H), (6, 5, 14)), img, shade)
base = img.convert('RGBA')

def layer(txt, font, fill, xy, anchor='lm', glow=None, gr=16, shadow=True):
    out_ = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if shadow:
        s = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(s).text((xy[0], xy[1] + 5), txt, font=font, fill=(0, 0, 0, 210), anchor=anchor)
        out_ = Image.alpha_composite(out_, s.filter(ImageFilter.GaussianBlur(8)))
    if glow:
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(g).text(xy, txt, font=font, fill=glow, anchor=anchor)
        g = g.filter(ImageFilter.GaussianBlur(gr)); out_ = Image.alpha_composite(out_, g); out_ = Image.alpha_composite(out_, g)
    ImageDraw.Draw(out_).text(xy, txt, font=font, fill=fill, anchor=anchor)
    return out_

X = 70
# the label with the Claude symbol
S = 54; fl = ImageFont.truetype(FONT, 38); ly = 128
svg = open(svgf, encoding='utf-8').read(); path = parse_path(re.search(r'<path[^>]*\sd="([^"]+)"', svg).group(1))
SS = 4; sym = Image.new('L', (100 * SS, 100 * SS), 0); sd = ImageDraw.Draw(sym); polys, cur = [], []
for seg in path:
    if isinstance(seg, Move):
        if len(cur) > 2: polys.append(cur)
        cur = []; continue
    n = 12 if type(seg).__name__ in ('CubicBezier', 'QuadraticBezier', 'Arc') else 1
    for i in range(n + 1):
        p = seg.point(i / n); cur.append((p.real * SS, p.imag * SS))
if len(cur) > 2: polys.append(cur)
for p in polys: sd.polygon(p, fill=255)
col = Image.new('RGBA', (S, S), (217, 119, 87, 255)); col.putalpha(sym.resize((S, S), Image.LANCZOS))
g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); g.paste(col, (X, ly - S // 2), col)
base = Image.alpha_composite(base, g.filter(ImageFilter.GaussianBlur(8))); base.alpha_composite(col, (X, ly - S // 2))
base = Image.alpha_composite(base, layer('코드로 만든 단편 시네마', fl, (255, 224, 190, 255), (X + S + 16, ly + 2), glow=(255, 150, 70, 150), gr=10))
# the title, two lines, and the subtitle
f1 = ImageFont.truetype(FONT, 92); f2 = ImageFont.truetype(FONT, 92); f3 = ImageFont.truetype(FONT, 36)
base = Image.alpha_composite(base, layer('한 문장이', f1, (255, 240, 214, 255), (X - 4, 290), glow=(170, 110, 255, 210), gr=22))
base = Image.alpha_composite(base, layer('2분 영화가', f2, (255, 240, 214, 255), (X - 4, 400), glow=(170, 110, 255, 210), gr=22))
base = Image.alpha_composite(base, layer('되기까지', f2, (255, 214, 150, 255), (X - 4, 510), glow=(255, 150, 60, 200), gr=22))
rl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(rl).line([(X, 590), (X + 300, 590)], fill=(230, 200, 150, 160), width=3)
base = Image.alpha_composite(base, rl)
base = Image.alpha_composite(base, layer('「악몽을 지키는 파수꾼」 제작기 · 클로드 코드 스킬', f3, (236, 226, 210, 255), (X, 632)))
base.convert('RGB').save(out, quality=93)
print(out)
