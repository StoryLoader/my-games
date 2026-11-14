#!/usr/bin/env python3
"""make_sfx.py — the tutorial's sound effects, synthesized here from code (no recorded or downloaded sound).
The user asked (2026-11-12) for code-synthesized SFX; a tutorial has no background music.

  python3 sfx/make_sfx.py <outdir>  → <outdir>/{keys,step,pop}.wav (48 kHz mono, 16-bit), kept outside the project;
  each is then wrapped as a tiny black-picture mp4 in assets/user/sfx/ (ffmpeg, storyboard.md → 소리)

keys  a short burst of keyboard clicks, 0.7 s
step  a two-note chime for a new step, 1.0 s
pop   a soft pop when a panel appears, 0.25 s
Deterministic (fixed seed).
"""
import math, os, random, struct, sys, wave

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
rng = random.Random(1114)


def write(name, xs, peak):
    m = max(1e-9, max(abs(x) for x in xs)); xs = [x / m * peak for x in xs]
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x)) * 32767)) for x in xs))


def keys():
    n = int(0.7 * SR); out = [0.0] * n; t = 0.02
    while t < 0.62:
        i0 = int(t * SR); f = 1800 + rng.random() * 1600; a = 0.6 + rng.random() * 0.4
        for i in range(int(0.02 * SR)):
            if i0 + i >= n: break
            u = i / SR; out[i0 + i] += a * (math.sin(2 * math.pi * f * u) * 0.5 + rng.uniform(-1, 1) * 0.5) * math.exp(-u * 260)
        t += 0.055 + rng.random() * 0.05
    return out


def step():
    n = int(1.0 * SR); out = []
    for i in range(n):
        t = i / SR; a = math.sin(2 * math.pi * 784 * t) * math.exp(-t * 6) * min(1, t / 0.004)
        t2 = t - 0.16; b = (math.sin(2 * math.pi * 1175 * t2) * math.exp(-t2 * 5) * min(1, t2 / 0.004)) if t2 > 0 else 0
        out.append(a + 0.9 * b)
    return out


def pop():
    n = int(0.25 * SR)
    return [math.sin(2 * math.pi * (520 - 900 * (i / SR)) * (i / SR)) * math.exp(-(i / SR) * 28) for i in range(n)]


if __name__ == '__main__':
    write('keys', keys(), 0.22); write('step', step(), 0.25); write('pop', pop(), 0.3)
    print('wrote keys, step, pop to', OUT)
