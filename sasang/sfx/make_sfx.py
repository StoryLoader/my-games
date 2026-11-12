#!/usr/bin/env python3
"""make_sfx.py — the video's sound effects, synthesized here from code (no recorded sound).
The user asked (2026-11-12) for code-synthesized SFX alongside free-licence music.

  python3 sfx/make_sfx.py <outdir>  → <outdir>/{swish,stamp,chime}.wav (48 kHz mono, 16-bit), kept outside the project;
  then each is wrapped as a tiny silent-picture mp4 in assets/user/sfx/ (ffmpeg, see storyboard.md → Sound)

swish  a brush stroke: band-passed noise swept upward, ~0.45 s
stamp  a seal pressed on paper: low thump + short papery click, ~0.35 s
chime  a small bronze bell: inharmonic partials with slow decay, ~2.2 s
Deterministic (fixed seed), so re-running gives identical files.
"""
import math, os, random, struct, wave

SR = 48000
import sys
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
rng = random.Random(1894)


def write(name, xs, peak=0.35):
    m = max(1e-9, max(abs(x) for x in xs))
    xs = [x / m * peak for x in xs]
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x)) * 32767)) for x in xs))


def biquad_bp(xs, f0s, q):
    """band-pass with a centre frequency per sample (RBJ cookbook)"""
    y = []; x1 = x2 = y1 = y2 = 0.0
    for x, f0 in zip(xs, f0s):
        w0 = 2 * math.pi * f0 / SR; al = math.sin(w0) / (2 * q); c = math.cos(w0)
        b0, b2, a0, a1, a2 = al, -al, 1 + al, -2 * c, 1 - al
        v = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, x, y1, v; y.append(v)
    return y


def swish():
    n = int(0.45 * SR)
    noise = [rng.uniform(-1, 1) for _ in range(n)]
    f = [700 + 3800 * (i / n) ** 1.4 for i in range(n)]
    y = biquad_bp(noise, f, 1.6)
    env = [math.sin(math.pi * min(1, (i / n) / 0.55)) ** 1.5 * (1 - i / n) ** 0.6 for i in range(n)]
    return [a * b for a, b in zip(y, env)]


def stamp():
    n = int(0.35 * SR); out = []
    for i in range(n):
        t = i / SR
        thump = math.sin(2 * math.pi * (95 + 60 * math.exp(-t * 40)) * t) * math.exp(-t * 22)
        click = rng.uniform(-1, 1) * math.exp(-t * 180) * 0.6
        out.append(thump + click)
    return out


def chime():
    n = int(2.2 * SR); parts = [(880, 1.0, 2.2), (880 * 2.76, 0.45, 3.5), (880 * 5.40, 0.22, 5.5), (880 * 1.5, 0.3, 2.8)]
    out = []
    for i in range(n):
        t = i / SR; att = min(1, t / 0.004)
        out.append(att * sum(a * math.sin(2 * math.pi * f * t) * math.exp(-t * d) for f, a, d in parts))
    return out


if __name__ == '__main__':
    write('swish', swish(), 0.30)
    write('stamp', stamp(), 0.45)
    write('chime', chime(), 0.25)
    print('wrote', ', '.join(sorted(os.listdir(OUT))))
