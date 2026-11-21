#!/usr/bin/env python3
"""make_sfx.py — the video's sound effects, synthesized here from code (no recorded or downloaded sound).
The user asked (2026-11-12) for code-synthesized SFX; this explainer has no background music.

  python3 sfx/make_sfx.py <outdir>  → <outdir>/{swish,hit,bell}.wav (48 kHz mono, 16-bit), kept outside the project;
  each is then wrapped as a tiny black-picture mp4 in assets/user/sfx/ (ffmpeg, storyboard.md → 소리)

swish  a card sliding in: band-passed noise swept upward, 0.4 s
hit    a verdict stamp: low thump + short click, 0.45 s
bell   a round bell: inharmonic partials, struck once, 1.8 s
Deterministic (fixed seed).
"""
import math, os, random, struct, sys, wave

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
rng = random.Random(2026)


def write(name, xs, peak):
    m = max(1e-9, max(abs(x) for x in xs)); xs = [x / m * peak for x in xs]
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x)) * 32767)) for x in xs))


def bandpass(xs, f0s, q):
    y = []; x1 = x2 = y1 = y2 = 0.0
    for x, f0 in zip(xs, f0s):
        w0 = 2 * math.pi * f0 / SR; al = math.sin(w0) / (2 * q); c = math.cos(w0)
        v = (al * x - al * x2 + 2 * c * y1 - (1 - al) * y2) / (1 + al)
        x2, x1, y2, y1 = x1, x, y1, v; y.append(v)
    return y


def swish():
    n = int(0.4 * SR); noise = [rng.uniform(-1, 1) for _ in range(n)]
    y = bandpass(noise, [500 + 3000 * (i / n) ** 1.3 for i in range(n)], 1.4)
    return [a * math.sin(math.pi * i / n) ** 1.6 for i, a in enumerate(y)]


def hit():
    n = int(0.45 * SR); out = []
    for i in range(n):
        t = i / SR
        out.append(math.sin(2 * math.pi * (70 + 90 * math.exp(-t * 35)) * t) * math.exp(-t * 14) + rng.uniform(-1, 1) * math.exp(-t * 160) * 0.5)
    return out


def bell():
    n = int(1.8 * SR); parts = [(587, 1.0, 2.6), (587 * 2.0, 0.5, 3.4), (587 * 2.76, 0.4, 4.2), (587 * 5.4, 0.18, 6.5)]
    return [min(1, (i / SR) / 0.003) * sum(a * math.sin(2 * math.pi * f * (i / SR)) * math.exp(-(i / SR) * d) for f, a, d in parts) for i in range(n)]


if __name__ == '__main__':
    write('swish', swish(), 0.28); write('hit', hit(), 0.5); write('bell', bell(), 0.28)
    print('wrote swish, hit, bell to', OUT)
