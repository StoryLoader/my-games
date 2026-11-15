#!/usr/bin/env python3
"""make_sound.py — the whole soundtrack of 「남은 길」, synthesized here from code (no recorded or downloaded sound).
The user asked (2026-11-15) for "코드로 합성한 자연음과 효과음" and no narration.

  python3 sfx/make_sound.py <out.wav>       48 kHz stereo, 16-bit, exactly the film's length

Everything is placed from js/timeline.js (the same beats js/scenes.js animates): the footfalls come from the same
speed curve and gait, the caws, wingbeats, the gust and the fade from the same times. Each shot sets how near the
microphone is (the far opening, the feet close up, the face close up, the wide sky …); levels glide across a cut.

Layers: wind (low rumble + a thin howl, gusting), dry grass hiss, footfalls (dirt crunch + a soft thump), armour
clinks, the broken sword scraping the ground, cape and banner flutter, the crow (caws, wingbeats), a faint warm hum
when the knight's eyes glow, a small room of reverb. Deterministic (fixed seeds).
"""
import json, os, re, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
TLs = open(os.path.join(HERE, '..', 'js', 'timeline.js'), encoding='utf-8').read()
TL = json.loads(TLs[TLs.index('{'):TLs.rindex('}') + 1])
END = TL['shots'][-1]
N = int(END * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(1977)

# ---------------- the walk: the same curve as js/scenes.js ----------------
SP = TL['speed']
def speed_at(x):
    if x <= SP[0][0]: return SP[0][1]
    for i in range(1, len(SP)):
        if x <= SP[i][0]: return SP[i - 1][1] + (SP[i][1] - SP[i - 1][1]) * (x - SP[i - 1][0]) / (SP[i][0] - SP[i - 1][0])
    return SP[-1][1]
def dist_at(x):
    d = 0.0
    for i in range(1, len(SP)):
        (a, va), (b, vb) = SP[i - 1], SP[i]
        if x <= a: break
        e = min(x, b); ve = va + (vb - va) * (e - a) / (b - a); d += (va + ve) / 2 * (e - a)
    if x > SP[-1][0]: d += SP[-1][1] * (x - SP[-1][0])
    return d
phase_at = lambda x: dist_at(x) / TL['stride']
amp_at = lambda x: min(1, max(0, speed_at(x) / 0.85))
steps = []
x, prev = 0.0, phase_at(0)
while x < END:
    p = phase_at(x + 1 / 240)
    for f, side in ((0.25, -1), (0.75, 1)):
        if np.floor(p - f) > np.floor(prev - f) and amp_at(x) > 0.35: steps.append((x, side))
    prev = p; x += 1 / 240

# ---------------- helpers ----------------
def band(sig, lo, hi):
    X = np.fft.rfft(sig); f = np.fft.rfftfreq(len(sig), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(sig))
def env_keys(keys):
    """piecewise-linear envelope over the whole film from [[time, value], …]"""
    ks = np.array(keys, dtype=float); return np.interp(t, ks[:, 0], ks[:, 1])
SH = TL['shots']
def per_shot(vals, xf=0.18):
    """a level per shot, gliding xf seconds across each cut"""
    keys = []
    for i, v in enumerate(vals):
        a, b = SH[i], SH[i + 1]
        keys += [[a + (xf if i else 0), v], [b - (xf if i < len(vals) - 1 else 0), v]]
    return env_keys(keys)
def place(buf, snd, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    n = min(len(snd), N - i)
    if n <= 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + n] += snd[:n] * gain * l * 1.41; buf[1, i:i + n] += snd[:n] * gain * r * 1.41
def T_(d): return np.arange(int(d * SR)) / SR
L = np.zeros((2, N))

# ---------------- wind and grass ----------------
gusts = 0.55 + 0.25 * np.sin(t * 0.37 + 1) + 0.18 * np.sin(t * 0.91 + 2.3) + 0.12 * np.sin(t * 1.7)
gusts += 1.4 * np.exp(-((t - TL['gust'] - 0.5) / 0.8) ** 2)
wind_lvl = per_shot([0.95, 0.55, 0.62, 0.45, 0.9, 0.62, 0.85])
fade = 1 - 0.75 * np.clip((t - TL['fade'][0]) / (TL['fade'][1] - TL['fade'][0]), 0, 1)
fade *= 1 - np.clip((t - (END - 0.6)) / 0.6, 0, 1)
for ch, seed in ((0, 1), (1, 2)):
    r = np.random.default_rng(seed)
    low = band(np.cumsum(r.standard_normal(N)) * 0.02, 40, 420); low /= np.abs(low).max()
    howl = band(r.standard_normal(N), 520, 980); howl /= np.abs(howl).max()
    hiss = band(r.standard_normal(N), 2500, 9000); hiss /= np.abs(hiss).max()
    L[ch] += low * 0.5 * gusts * wind_lvl * fade
    L[ch] += howl * 0.07 * (gusts ** 2) * wind_lvl * fade
    L[ch] += hiss * 0.05 * gusts * per_shot([0.7, 0.9, 0.7, 0.5, 0.6, 0.9, 0.7]) * fade

# ---------------- footfalls, armour, sword ----------------
foot_lvl = per_shot([0.12, 1.0, 0.55, 0.32, 0.22, 0.5, 0.3]) * (1 - 0.55 * np.clip((t - 25) / 5, 0, 1))
def footfall(seed, lame):
    r = np.random.default_rng(seed); d = T_(0.32)
    crunch = band(r.standard_normal(len(d)), 260, 2600) * np.exp(-d * (32 if not lame else 22))
    thump = np.sin(2 * np.pi * (78 + 8 * r.random()) * d) * np.exp(-d * 30) * 0.9
    grains = np.zeros(len(d))
    for _ in range(10):
        k = int(r.uniform(0.005, 0.12) * SR); g = band(r.standard_normal(240), 1500, 7000) * np.exp(-np.arange(240) / 40)
        grains[k:k + 240] += g * r.uniform(0.2, 0.6)
    drag = band(r.standard_normal(len(d)), 400, 2200) * np.exp(-((d - 0.09) / 0.06) ** 2) * (0.5 if lame else 0)
    return crunch * 0.8 + thump + grains * 0.5 + drag
def clink(seed):
    r = np.random.default_rng(seed); d = T_(0.5); f0 = r.uniform(1700, 2500)
    s = sum(a * np.sin(2 * np.pi * f0 * m * d + r.random() * 6) * np.exp(-d * dk) for m, a, dk in ((1, 1, 11), (1.53, 0.6, 14), (2.31, 0.4, 18), (3.1, 0.25, 24)))
    tonk = np.sin(2 * np.pi * r.uniform(420, 560) * d) * np.exp(-d * 28) * 0.5
    return (s * 0.35 + tonk) * np.minimum(1, d / 0.002)
for n, (st, side) in enumerate(steps):
    i = int(st * SR); lv = foot_lvl[min(i, N - 1)]
    place(L, footfall(100 + n, side > 0), st, 0.55 * lv, pan=-0.15 * side)
    place(L, clink(500 + n), st + 0.01, 0.16 * lv * (0.6 + 0.4 * ((n * 7) % 5) / 4), pan=0.1)
# the sword dragging: a gritty scrape that jerks forward with every step
scrape_lvl = per_shot([0.05, 0.85, 0.32, 0.14, 0.1, 0.22, 0.1])
moving = np.array([amp_at(x) for x in t[::480]]); moving = np.interp(t, t[::480], moving)
jerk = np.zeros(N)
for st, side in steps:
    i = int(st * SR); k = np.arange(min(int(0.35 * SR), N - i)); jerk[i:i + len(k)] += np.exp(-k / SR / 0.12) * (1.0 if side > 0 else 0.6)
r = np.random.default_rng(7)
grit = band(r.standard_normal(N), 1400, 5200); grit /= np.abs(grit).max()
grind = band(r.standard_normal(N), 150, 420); grind /= np.abs(grind).max()
am = np.repeat(r.uniform(0.3, 1.0, N // 900 + 1), 900)[:N]
scrape = (grit * am * 0.6 + grind * 0.4) * (0.25 + 0.75 * np.minimum(1.5, jerk)) * moving * scrape_lvl
L += scrape * 0.22

# ---------------- cloth: the cape, the banner and the scarf at the grave ----------------
cl = band(np.random.default_rng(11).standard_normal(N), 300, 2200); cl /= np.abs(cl).max()
flutter = 0.5 + 0.5 * np.sin(2 * np.pi * (9 + 4 * np.sin(t * 0.8)) * t) * np.sin(2 * np.pi * 3.1 * t + 1)
cloth_lvl = per_shot([0.05, 0.12, 0.3, 0.22, 0.1, 0.35, 0.1]) * gusts
L += cl * flutter * cloth_lvl * 0.09

# ---------------- the crow ----------------
crow_dist = lambda x: [0.18, 0.7, 0.85, 1.0, 0.7, 0.75, 0.4][min(6, int(np.searchsorted(SH, x, side='right') - 1))]
def caw(seed, far):
    r = np.random.default_rng(seed); d = T_(0.46)
    f0 = 560 - 110 * d / 0.46 + 14 * np.sin(2 * np.pi * 31 * d) + r.uniform(-30, 30)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    src = sum(np.sin(k * ph) / k ** 0.85 for k in range(1, 18))
    src *= 0.65 + 0.35 * band(r.standard_normal(len(d)), 60, 400) / 0.05
    v = band(src, 700, 1500) * 1.0 + band(src, 1900, 2900) * 0.7 + band(src, 3200, 4200) * 0.25
    e = np.minimum(1, d / 0.025) * np.exp(-((d - 0.17) / 0.17) ** 2 * 1.2)
    out = v * e
    if far: out = band(out, 300, 2400)
    return out / (np.abs(out).max() + 1e-9)
for n, (ct, lv) in enumerate(TL['crow']['caws']):
    far = lv < 0.3
    place(L, caw(900 + n, far), ct - 0.05, 0.42 * lv * (1.4 if far else 1) * crow_dist(ct), pan=0.25)
def flap(seed, size=1.0):
    r = np.random.default_rng(seed); d = T_(0.16)
    w = band(r.standard_normal(len(d)), 180, 1500) * np.sin(np.pi * np.clip(d / 0.12, 0, 1)) ** 1.5
    return w / (np.abs(w).max() + 1e-9) * size
C = TL['crow']
k = 0; x = C['takeoff']
while x < C['land'] - 1.6:                      # takeoff and climb, fading as the bird goes up and away
    hz = 3.4 if x < C['takeoff'] + 1 else 2.6
    dist = 1 - 0.65 * min(1, (x - C['takeoff']) / 2.5)
    place(L, flap(1200 + k), x, 0.5 * dist, pan=0.3 * dist); x += 1 / hz; k += 1
x = C['land'] - 0.5
while x < C['land'] + 0.4:                      # braking on the pommel
    place(L, flap(1300 + k, 0.8), x, 0.32, pan=-0.2); x += 0.25; k += 1
x = C['hop'][0]
while x < C['hop'][1]:                          # the hop back onto the shoulder
    place(L, flap(1400 + k, 0.7), x, 0.3, pan=0.1); x += 0.24; k += 1

# ---------------- the eyes' warmth (s04): a faint low hum, barely there ----------------
ev = TL['knight']['ember']
hum_env = np.clip((t - ev) / 0.9, 0, 1) * np.clip((C['takeoff'] + 1.0 - t) / 1.2, 0, 1)
hum = (np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 165 * t + 1) + 0.25 * np.sin(2 * np.pi * 220.5 * t)) * hum_env
L += hum * 0.022

# ---------------- a little space, the fade, the level ----------------
ir_t = T_(0.9); ir = np.random.default_rng(3).standard_normal(len(ir_t)) * np.exp(-ir_t * 5.5); ir = band(ir, 200, 5000); ir /= np.sqrt((ir ** 2).sum())
for ch in range(2):
    wet = np.fft.irfft(np.fft.rfft(L[ch], 2 * N) * np.fft.rfft(ir, 2 * N), 2 * N)[:N]
    L[ch] = L[ch] + wet * 0.22
L *= np.minimum(1, t / 0.4)[None, :]
L *= (1 - np.clip((t - (END - 0.5)) / 0.5, 0, 1))[None, :]
L = L / np.abs(L).max() * 0.6
# bring it up to a listenable level (about -20 LUFS) with a gentle look-ahead limiter, so the footfalls and caws keep their shape
L *= 10 ** (9.0 / 20)
CEIL = 0.89; env = np.abs(L).max(axis=0); la = int(0.004 * SR)
need = np.minimum(1.0, CEIL / np.maximum(env, 1e-9))
need = np.lib.stride_tricks.sliding_window_view(np.pad(need, (0, la - 1), constant_values=1.0), la).min(axis=1)
g = np.empty_like(need); cur = 1.0; rel = np.exp(-1 / (0.09 * SR))
for i in range(len(need)):
    cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * rel
    g[i] = cur
g = np.convolve(g, np.ones(la) / la, mode='same'); L *= g[None, :]
L = np.clip(L, -0.97, 0.97)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'soundtrack.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(L.T, -1, 1) * 32767).astype('<i2').tobytes())
print(f'wrote {out}: {END:.2f}s, {len(steps)} footfalls, {len(TL["crow"]["caws"])} caws')
