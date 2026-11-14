#!/usr/bin/env python3
"""make_sfx.py — the tutorial's sound effects, synthesized here from code (no recorded or downloaded sound).
The user asked (2026-11-12) for code-synthesized SFX and (2026-11-14) for more of them, louder — the first set could
hardly be heard ("효과음은 하나도 없어서 지루한 느낌"). A tutorial has no background music.

  python3 sfx/make_sfx.py <outdir>  → <outdir>/<name>.wav (48 kHz mono, 16-bit), kept outside the project;
  each is then wrapped as a tiny black-picture mp4 in assets/user/sfx/ (ffmpeg, storyboard.md → 소리)

keys_a, keys_b  two bursts of keyboard clicks (alternated while a command types itself), 0.7 s
enter           the return key at the end of a command, 0.22 s
step            a two-note chime for a new step, 1.0 s
whoosh          a soft swish when the left-hand headline changes, 0.5 s
pop             a card, chip or node pops in, 0.22 s
tick            a line or row appears, 0.08 s
ok              a rising two-note "done" for green result lines and the chosen skill, 0.55 s
shutter         a camera click — frames being photographed one by one, 0.16 s
hit             a low soft impact where the finished video is revealed, 1.4 s
rewind          a falling tape scrub for "되감기", 1.1 s
buzz            a short low double buzz for the frozen-screen problem, 0.38 s
Deterministic (fixed seeds).
"""
import os, sys, wave
import numpy as np

SR = 48000
LEAD = 0.03
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'


def T(d): return np.arange(int(d * SR)) / SR


def write(name, x, peak):
    x = np.asarray(x, dtype=np.float64); x = x / max(1e-9, np.abs(x).max()) * peak
    n = len(x); f = int(0.004 * SR); x[-f:] *= np.linspace(1, 0, f)          # no click at the cut
    # 30 ms of silence before and 120 ms after: a player that starts a clip a few ms late, or stops it on the dot, must
    # not eat the attack or the tail (scenes.js starts every effect LEAD seconds early)
    x = np.concatenate([np.zeros(int(LEAD * SR)), x, np.zeros(int(0.12 * SR))]); n = len(x)
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
    win = int(0.05 * SR); rms = max(np.sqrt(np.mean(x[i:i + win] ** 2)) for i in range(0, max(1, n - win), win // 2)) if n > win else np.sqrt(np.mean(x ** 2))
    print(f'{name:8s} {n / SR:.2f}s  peak {20 * np.log10(peak):6.1f} dBFS  loudest 50 ms {20 * np.log10(rms):6.1f} dBFS')


def band(x, lo, hi):
    """zero-phase band-pass by FFT (smooth edges)"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) * 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x))


def click(rng, f, a):
    """one key: a bright tick and a duller body"""
    t = T(0.03); n = rng.uniform(-1, 1, len(t))
    return a * (0.55 * band(n, 1500, 7000) * np.exp(-t * 330) * 6 + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t * 210) + 0.5 * np.sin(2 * np.pi * 240 * t) * np.exp(-t * 150))


def keys(seed):
    rng = np.random.default_rng(seed); out = np.zeros(int(0.7 * SR)); t = 0.015
    while t < 0.63:
        c = click(rng, 1700 + rng.random() * 1500, 0.6 + rng.random() * 0.4); i = int(t * SR); out[i:i + len(c)] += c[:len(out) - i]
        t += 0.05 + rng.random() * 0.055
    return out


def enter():
    rng = np.random.default_rng(7); t = T(0.22); n = rng.uniform(-1, 1, len(t))
    return 0.9 * np.sin(2 * np.pi * (170 - 200 * t) * t) * np.exp(-t * 34) + 0.5 * band(n, 900, 5000) * np.exp(-t * 120) * 5 + 0.3 * np.sin(2 * np.pi * 1250 * t) * np.exp(-t * 90)


def note(f, d, decay, harm=(1, 0.35, 0.12)):
    t = T(d); return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(harm)) * np.exp(-t * decay) * np.minimum(1, t / 0.004)


def step():
    out = np.zeros(int(1.0 * SR)); a = note(783.99, 1.0, 5.5); b = note(1174.66, 0.84, 5.0)
    out += a; out[int(0.16 * SR):] += 0.95 * b; return out


def ok():
    out = np.zeros(int(0.55 * SR)); a = note(1318.5, 0.55, 9, (1, 0.2)); b = note(1760.0, 0.45, 8, (1, 0.2))
    out += 0.8 * a; out[int(0.1 * SR):] += b; return out


def whoosh():
    rng = np.random.default_rng(3); t = T(0.5); n = rng.uniform(-1, 1, len(t)); out = np.zeros(len(t))
    # a noise band whose centre sweeps up then down: mix of fixed bands faded in turn
    for i, (lo, hi) in enumerate([(300, 700), (600, 1400), (1200, 2800), (2400, 5200)]):
        c = 0.14 + i * 0.075; out += band(n, lo, hi) * np.exp(-((t - c) / 0.085) ** 2)
    return out * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 0.7


def pop():
    t = T(0.22); return np.sin(2 * np.pi * (640 * t - 1100 * t * t)) * np.exp(-t * 26) * np.minimum(1, t / 0.002)


def tick():
    t = T(0.12); return (np.sin(2 * np.pi * 1500 * t) + 0.5 * np.sin(2 * np.pi * 2250 * t)) * np.exp(-t * 60) * np.minimum(1, t / 0.0015)


def shutter():
    rng = np.random.default_rng(5); t = T(0.16); n = rng.uniform(-1, 1, len(t)); b = band(n, 1800, 9000)
    return b * (np.exp(-t * 160) + 0.8 * np.exp(-np.maximum(0, t - 0.07) * 190) * (t > 0.07)) + 0.25 * np.sin(2 * np.pi * 320 * t) * np.exp(-t * 60)


def hit():
    rng = np.random.default_rng(9); t = T(1.4); n = rng.uniform(-1, 1, len(t))
    boom = np.sin(2 * np.pi * (62 * t + 30 * (1 - np.exp(-t * 18)) / 18)) * np.exp(-t * 4.2)
    air = band(n, 2500, 9000) * np.exp(-t * 3.2) * np.minimum(1, t / 0.02) * 0.9
    tone = (np.sin(2 * np.pi * 523.25 * t) + 0.7 * np.sin(2 * np.pi * 783.99 * t)) * np.exp(-t * 2.6) * 0.22
    return boom + 0.35 * air + tone


def rewind():
    t = T(1.1); f = 1500 * np.exp(-t * 1.5) + 260; ph = 2 * np.pi * np.cumsum(f) / SR
    flut = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * (26 - 12 * t) * t))
    return (np.sin(ph) + 0.4 * np.sin(2 * ph)) * flut * np.sin(np.pi * np.clip(t / 1.1, 0, 1)) ** 0.5


def buzz():
    t = T(0.38); s = np.tanh(3 * np.sin(2 * np.pi * 138 * t)) + 0.4 * np.tanh(3 * np.sin(2 * np.pi * 207 * t))
    g = ((t < 0.15) | (t > 0.21)) * 1.0
    return band(s * g, 90, 2400)


if __name__ == '__main__':
    write('keys_a', keys(1114), 0.5); write('keys_b', keys(2206), 0.5); write('enter', enter(), 0.6)
    write('step', step(), 0.55); write('whoosh', whoosh(), 0.45); write('pop', pop(), 0.55); write('tick', tick(), 0.55)
    write('ok', ok(), 0.5); write('shutter', shutter(), 0.45); write('hit', hit(), 0.7); write('rewind', rewind(), 0.4); write('buzz', buzz(), 0.4)
