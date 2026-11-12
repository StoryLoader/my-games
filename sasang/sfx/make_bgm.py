#!/usr/bin/env python3
"""make_bgm.py — the video's background music, composed and synthesized here from code (no recorded or downloaded sound).
The user asked (2026-11-12) for free-licence music and code-synthesized sound together; the free-licence track could not be
downloaded in this session (Wikimedia Commons refused original-file downloads), so the music is made here.

  python3 sfx/make_bgm.py <outdir> [seconds]   → <outdir>/bgm.wav (48 kHz stereo, 16-bit)

A calm piece in D major pentatonic (D E F# A B), 80 BPM: a soft pad on a looping progression (D · Bm · G · A),
a low sine bass, and gayageum-like plucks (additive partials, faster decay on higher partials, a light 농현 vibrato).
Deterministic (fixed seed).
"""
import math, os, sys, wave
import numpy as np

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 320.0
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
rng = np.random.default_rng(1894)
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# progression (MIDI roots) and chord tones
PROG = [(50, [62, 66, 69]), (47, [62, 66, 71]), (43, [62, 67, 71]), (45, [61, 64, 69]),
        (50, [62, 66, 69]), (47, [62, 66, 71]), (43, [62, 67, 71]), (45, [64, 69, 73])]
PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81]


def add(sig, t0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    if i < 0: sig, i = sig[-i:], 0
    sig = sig[:N - i]
    L[i:i + len(sig)] += sig * math.cos((pan + 1) * math.pi / 4)
    R[i:i + len(sig)] += sig * math.sin((pan + 1) * math.pi / 4)


def pad(notes, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    s = sum(np.sin(2 * np.pi * hz(m) * t * (1 + d)) for m in notes for d in (-0.0015, 0.0015))
    s += 0.3 * sum(np.sin(2 * np.pi * hz(m) * 2 * t) for m in notes)
    return s * env * 0.05


def bass(m, dur):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 1.6) * np.minimum(1, t / 0.02) * 0.22


def pluck(m, dur=2.4, amp=0.2):
    t = np.arange(int(dur * SR)) / SR
    f = hz(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.6))   # 농현-like vibrato after the attack
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum((1 / k) * np.sin(k * ph) * np.exp(-t * (1.8 + 1.4 * k)) for k in range(1, 9))
    return s * np.minimum(1, t / 0.004) * amp


bars = int(DUR / BAR) + 1
for b in range(bars):
    t0 = b * BAR
    root, chord = PROG[b % len(PROG)]
    add(pad(chord, BAR + 1.2), t0 - 0.3, 0.0)
    if b >= 2:
        add(bass(root, BEAT * 2), t0, -0.1); add(bass(root + 7, BEAT * 2) * 0.6, t0 + 2 * BEAT, -0.1)
    if b >= 4:
        # 3–5 plucks per bar on eighth-note slots, chord tones favoured
        slots = sorted(rng.choice(8, size=int(rng.integers(3, 6)), replace=False))
        for s in slots:
            pool = [p for p in PENTA if p % 12 in {c % 12 for c in chord}] if rng.random() < 0.7 else PENTA
            m = int(rng.choice(pool))
            add(pluck(m, amp=0.16 + 0.06 * rng.random()), t0 + s * BEAT / 2, float(rng.uniform(-0.5, 0.5)))
    if b % 8 == 7:   # a soft high answer at the end of each phrase
        add(pluck(81, 3.0, 0.12), t0 + 3 * BEAT, 0.4)

fade = np.ones(N); fi = int(2.5 * SR); fo = int(7 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
L *= fade; R *= fade
m = max(np.abs(L).max(), np.abs(R).max())
L, R = L / m * 0.5, R / m * 0.5
os.makedirs(OUT, exist_ok=True)
pcm = (np.stack([L, R], 1) * 32767).astype('<i2')
with wave.open(os.path.join(OUT, 'bgm.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', os.path.join(OUT, 'bgm.wav'), f'{DUR:.1f}s')
