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

2편 「남은 불」 (30–60, night): crickets, the sword set against stone, sitting down, twigs dropped on the pile, the ember
catching (a soft whoomp) and the fire crackling, feathers, the cape drawn over the crow.
3편 「남은 꿈」 (60–90): the fire flaring into a low drone; the dream — war drums, a far host roaring, four sword clashes,
the banner falling, the blow that breaks the sword (crack and a long ring), the fall, a heartbeat, all muffled after he
falls; the wake into near silence, the tear hissing in the ash; dawn birds, the sword planted, the last footsteps
(no scrape: the sword stays behind).
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
while x < 30.0:
    p = phase_at(x + 1 / 240)
    for f, side in ((0.25, -1), (0.75, 1)):
        if np.floor(p - f) > np.floor(prev - f) and amp_at(x) > 0.35: steps.append((x, side))
    prev = p; x += 1 / 240

# 2편 and 3편: the same gait (a step at phase 0.25 and 0.75 of each stride), from the distance js/acts.js walks
def walk_steps(t0, t1, dist):
    out, x, prev = [], t0, dist(t0)
    while x < t1:
        p = dist(x + 1 / 240) / TL['stride']
        for f, side in ((0.25, -1), (0.75, 1)):
            if np.floor(p - f) > np.floor(prev - f): out.append((x, side))
        prev = p; x += 1 / 240
    return out
_A2, _A3 = TL['act2'], TL['act3']
steps += walk_steps(30.0, 30.0 + (_A2['camp'][0] - _A2['walkFrom']) / 0.85, lambda x: 0.85 * (x - 30.0))
_w3 = _A3['walk']
steps3 = walk_steps(_w3[0], END, lambda x: 0.85 * (x - _w3[0]) * min(1, max(0, (x - _w3[0]) / (END - _w3[0]))))
steps += steps3

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
A2, A3 = TL['act2'], TL['act3']
WALK2_END = 30.0 + (A2['camp'][0] - A2['walkFrom']) / 0.85            # js/acts.js walks him 0.85 m/s up to the camp
wind_lvl = per_shot([0.95, 0.55, 0.62, 0.45, 0.9, 0.62, 0.85,
                     0.6, 0.5, 0.48, 0.45, 0.52, 0.4, 0.66,            # 2편: a quieter night wind
                     0.34, 0.12, 0.12, 0.12, 0.08, 0.16, 0.66])         # 3편: under the dream, the hush on waking, dawn
# each part ends dipping into black and comes back up out of it
fade = env_keys([[0, 1], [TL['fade'][0], 1], [TL['fade'][1], 0.25], [30.0, 0.25], [31.4, 1],
                 [A2['fade'][0], 1], [A2['fade'][1], 0.3], [60.0, 0.3], [A3['fadeIn'][1], 1],
                 [A3['fade'][0], 1], [A3['fade'][1], 0.2], [END, 0.0]])
dream = env_keys([[0, 0], [A3['red'][0], 0], [A3['dream'][0], 1], [78.8, 1], [78.86, 0], [END, 0]])   # the dream world
quiet = 1 - 0.8 * dream                                                                          # the waking world goes away under it
for ch, seed in ((0, 1), (1, 2)):
    r = np.random.default_rng(seed)
    low = band(np.cumsum(r.standard_normal(N)) * 0.02, 40, 420); low /= np.abs(low).max()
    howl = band(r.standard_normal(N), 520, 980); howl /= np.abs(howl).max()
    hiss = band(r.standard_normal(N), 2500, 9000); hiss /= np.abs(hiss).max()
    L[ch] += low * 0.5 * gusts * wind_lvl * fade * quiet
    L[ch] += howl * 0.07 * (gusts ** 2) * wind_lvl * fade * quiet
    L[ch] += hiss * 0.05 * gusts * per_shot([0.7, 0.9, 0.7, 0.5, 0.6, 0.9, 0.7,
                                              0.5, 0.45, 0.4, 0.35, 0.4, 0.3, 0.55, 0.3, 0, 0, 0, 0, 0.18, 0.75]) * fade * quiet

# ---------------- footfalls, armour, sword ----------------
foot_lvl = per_shot([0.12, 1.0, 0.55, 0.32, 0.22, 0.5, 0.3, 0.42, 0.7, 0.6, 0.6, 0.5, 0.6, 0.3, 0.5, 0.6, 0.6, 0.6, 0.6, 0.7, 0.55]) \
           * np.where(t < 30, 1 - 0.55 * np.clip((t - 25) / 5, 0, 1), 1)
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
scrape_lvl = per_shot([0.05, 0.85, 0.32, 0.14, 0.1, 0.22, 0.1, 0.3] + [0] * 13)
moving = np.array([amp_at(x) if x < 30 else (1.0 if x < WALK2_END else 0.0) for x in t[::480]]); moving = np.interp(t, t[::480], moving)
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
cloth_lvl = per_shot([0.05, 0.12, 0.3, 0.22, 0.1, 0.35, 0.1, 0.12, 0.06, 0.04, 0.05, 0.05, 0.05, 0.08, 0.04, 0, 0, 0, 0, 0.04, 0.25]) * gusts * fade
L += cl * flutter * cloth_lvl * 0.09

# ---------------- the crow ----------------
crow_dist = lambda x: [0.18, 0.7, 0.85, 1.0, 0.7, 0.75, 0.4, 0.5, 0.8, 0.8, 0.8, 0.6, 0.9, 0.4, 0.6, 0.6, 0.6, 0.6, 0.6, 0.9, 0.7][min(20, int(np.searchsorted(SH, x, side='right') - 1))]
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


# =============================== 2편 「남은 불」 and 3편 「남은 꿈」 ===============================
def tone(f, d, decay, ph=0.0): x = T_(d); return np.sin(2 * np.pi * f * x + ph) * np.exp(-x * decay)
def noise(seed, d): return np.random.default_rng(seed).standard_normal(int(d * SR))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def thump(seed, f=70, d=0.45, dk=14):
    x = T_(d); fr = f * (1 + 0.6 * np.exp(-x * 30)); s_ = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-x * dk)
    return norm(s_ + band(noise(seed, d), 80, 900) * np.exp(-x * 40) * 0.6)
def clang(seed, big=1.0, ring=1.2):
    """sword on sword: an inharmonic metal ring over a hard noise hit"""
    r = np.random.default_rng(seed); x = T_(ring + 0.3); f0 = r.uniform(520, 700)
    s_ = sum(a * np.sin(2 * np.pi * f0 * m * x + r.random() * 6) * np.exp(-x * dk / ring)
             for m, a, dk in ((1, 1, 2.2), (2.76, 0.8, 3.0), (5.40, 0.55, 4.2), (8.93, 0.35, 6.0), (13.3, 0.2, 8.0)))
    hit = band(r.standard_normal(len(x)), 900, 9000) * np.exp(-x * 45) * 2.2 * big
    return norm(s_ * 0.6 + hit) * np.minimum(1, x / 0.001)
night = env_keys([[0, 0], [29.8, 0], [31.4, 1], [A3['red'][0], 1], [A3['dream'][0], 0], [79.0, 0], [79.3, 0.6], [84.0, 0.4], [85.5, 0], [END, 0]])

# crickets: a few far, slow pulse-trains, only at night
cri = np.zeros(N); r = np.random.default_rng(31)
for k in range(3):
    f = 4200 + 450 * k; pr = 0.55 + 0.17 * k; x = r.uniform(30, 31)
    while x < 85:
        d = T_(0.11); chirp = np.sin(2 * np.pi * f * d) * (0.5 + 0.5 * np.sin(2 * np.pi * 70 * d)) * np.sin(np.pi * d / 0.11) ** 2
        i = int(x * SR); n = min(len(d), N - i); cri[i:i + n] += chirp[:n] * r.uniform(0.5, 1.0)
        x += pr * r.uniform(0.85, 1.25) + (r.uniform(0.6, 2.0) if r.random() < 0.18 else 0)
L[0] += cri * 0.018 * night * fade; L[1] += np.roll(cri, 2400) * 0.018 * night * fade

# 2편 actions
place(L, clang(41, 0.3, 0.7), A2['swordDown'][1] - 0.05, 0.05, pan=-0.35)               # the sword set against the stone
place(L, band(noise(42, 0.25), 1500, 5000) * np.exp(-T_(0.25) * 14), A2['swordDown'][1] - 0.12, 0.04, pan=-0.35)
place(L, thump(43, 62, 0.5, 11), A2['sit'][1] - 0.12, 0.34)                                # he sits down, heavily
for k in range(4): place(L, clink(600 + k), A2['sit'][1] - 0.1 + 0.07 * k, 0.09 * (1 - 0.2 * k), pan=0.1 * k - 0.15)
x = A2['crowDown'][0]                                                                      # the crow comes down off his shoulder
while x < A2['crowDown'][1]: place(L, flap(1500 + int(x * 10), 0.8), x, 0.26, pan=0.2); x += 0.25
def twig_drop(seed):
    r = np.random.default_rng(seed); out = np.zeros(int(0.5 * SR))
    for k, (at, a) in enumerate(((0.0, 1.0), (0.07, 0.45), (0.15, 0.22))):            # a knock and two little bounces
        x = T_(0.12); f = r.uniform(900, 1400)
        tick = (np.sin(2 * np.pi * f * x) + 0.6 * np.sin(2 * np.pi * f * 2.3 * x)) * np.exp(-x * 70) + band(r.standard_normal(len(x)), 1500, 6000) * np.exp(-x * 120) * 0.6
        i = int(at * SR); out[i:i + len(x)] += tick * a
    return norm(out)
for n, (a, b) in enumerate(A2['trips']):                                                    # two trips for twigs
    x = a
    while x < a + 0.6: place(L, flap(1600 + n * 20 + int((x - a) * 10), 0.9), x, 0.3, pan=0.3 + 0.5 * (x - a)); x += 1 / 3.6
    x = b - 0.95
    while x < b - 0.35: place(L, flap(1650 + n * 20 + int((x - b) * 10), 0.8), x, 0.24, pan=0.5 - 0.6 * (x - b + 0.95)); x += 1 / 3.2
    place(L, twig_drop(1700 + n), b - 0.4, 0.2, pan=0.05)
    place(L, flap(1690 + n, 0.6), b - 0.25, 0.18, pan=-0.1)
# the ember brightens, catches, and the fire burns through the night (and dies down toward the dream)
ign = A2['ignite']
ev2 = np.clip((t - A2['ember'][0]) / (ign - A2['ember'][0]), 0, 1) * np.clip((ign + 0.5 - t) / 0.5, 0, 1)
L += (np.sin(2 * np.pi * (110 + 40 * ev2) * t) + 0.4 * np.sin(2 * np.pi * (220 + 80 * ev2) * t)) * ev2 * 0.03
wh = band(noise(51, 1.4), 60, 700); x = T_(1.4); wh = norm(wh) * np.minimum(1, x / 0.18) * np.exp(-np.maximum(0, x - 0.18) * 3.2)
place(L, wh, ign - 0.15, 0.32)
fire_lvl = env_keys([[0, 0], [ign, 0], [A2['blaze'][1], 1], [A2['fade'][0], 1], [A2['fade'][1], 0.35], [60.0, 0.35], [A3['fadeIn'][1], 0.6],
                     [A3['flare'][0], 0.6], [A3['flare'][1], 1.2], [A3['dream'][0], 0], [79.0, 0], [79.3, 0.25], [84.0, 0.2], [85.0, 0], [END, 0]])
fire_lvl *= per_shot([0] * 7 + [0.5, 0.7, 0.8, 1.0, 0.85, 1.0, 0.55, 0.9, 0, 0, 0, 0, 0.9, 0.3])
roar = band(np.random.default_rng(52).standard_normal(N), 70, 500); roar = norm(roar) * (0.6 + 0.4 * np.sin(t * 2.3) * np.sin(t * 0.7 + 1))
L += roar * fire_lvl * 0.17
cr_ = np.zeros(N); r = np.random.default_rng(53); x = ign
while x < END:                                                                             # crackles: little pops, a few bigger snaps
    big = r.random() < 0.1; d = T_(0.05 if not big else 0.12)
    pop = band(r.standard_normal(len(d)), 900 if not big else 400, 7000) * np.exp(-d * (160 if not big else 55))
    i = int(x * SR); n = min(len(d), N - i); cr_[i:i + n] += pop[:n] * r.uniform(0.3, 1.0) * (2.0 if big else 1.0)
    x += r.exponential(0.09)
L[0] += cr_ * fire_lvl * 0.1; L[1] += np.roll(cr_, 300) * fire_lvl * 0.1
# the crow nods off and nestles in; the cape drawn over it
place(L, norm(band(noise(61, 1.2), 1800, 6000)) * np.sin(np.pi * np.clip(T_(1.2) / 1.2, 0, 1)) ** 2, A2['nestle'][0] + 0.1, 0.05, pan=0.1)
place(L, flap(62, 0.5), A2['nestle'][0] + 0.45, 0.14)
place(L, norm(band(noise(63, 1.0), 250, 1800)) * np.sin(np.pi * np.clip(T_(1.0) / 1.0, 0, 1)) ** 1.5, A2['cover'][0], 0.12, pan=-0.1)
for n, (ct, lv) in enumerate(A2['caws'] + A3['caws']):
    far = lv < 0.3
    place(L, caw(950 + n, far), ct - 0.05, 0.42 * lv * (1.4 if far else 1) * crow_dist(ct), pan=0.2)

# 3편: the flare and the fall into the dream
x = T_(A3['dream'][0] - A3['flare'][0] + 0.3)
swell = band(noise(71, x[-1] + 1 / SR), 40, 300); swell = norm(swell) * (x / x[-1]) ** 2
place(L, swell + 0.5 * np.sin(2 * np.pi * 55 * x) * (x / x[-1]) ** 2, A3['flare'][0], 0.18)
D = np.zeros((2, N))                                                                       # the dream bus: its own big reverb
dr = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.6 * t + 1) + 0.3 * np.sin(2 * np.pi * 110.4 * t)
fallen = env_keys([[0, 0], [A3['fall'][1] - 0.2, 0], [A3['fall'][1] + 0.6, 1], [END, 1]])
D += dr * dream * 0.07 * (1 - 0.5 * fallen)
host = band(np.random.default_rng(72).standard_normal(N), 180, 900); host = norm(host)
host_sw = env_keys([[63, 0.3], [64.0, 1], [65.5, 0.55], [67.0, 1.0], [68.5, 0.6], [70.0, 1.0], [72.0, 0.7], [73.2, 1.1], [75.2, 0.25], [79, 0.15]])
D[0] += host * host_sw * dream * 0.16; D[1] += np.roll(host, 9000) * host_sw * dream * 0.16
x = A3['dream'][0] + 0.15; k = 0                                                           # war drums, slower and gone after the fall
while x < A3['fall'][1]:
    place(D, thump(800 + k, 58 if k % 4 == 0 else 72, 0.6, 9), x, (0.5 if k % 4 == 0 else 0.3), pan=0.4 * np.sin(k))
    x += 0.78 if x < A3['blow'] - 0.5 else 1.1; k += 1
for n, c in enumerate(A3['clash']):                                                         # the four clashes
    place(D, clang(820 + n, 1.0, 1.2), c - 0.02, 0.62, pan=0.1 * (n % 2 * 2 - 1))
bf = A3['bannerFall']                                                                       # the banner comes down
place(D, norm(band(noise(830, bf[1] - bf[0]), 300, 2500)) * np.sin(np.pi * T_(bf[1] - bf[0]) / (bf[1] - bf[0])) ** 2, bf[0], 0.16, pan=-0.4)
place(D, thump(831, 90, 0.4, 16), bf[1] - 0.02, 0.32, pan=-0.4)
bl = A3['blow']                                                                             # the blow: the sword breaks
place(D, clang(840, 1.6, 0.6), bl - 0.02, 0.8)
crack = band(noise(841, 0.2), 1500, 12000) * np.exp(-T_(0.2) * 30); place(D, norm(crack), bl, 0.55)
x = T_(3.0); ringing = (np.sin(2 * np.pi * 3150 * x) + 0.5 * np.sin(2 * np.pi * 3167 * x) + 0.3 * np.sin(2 * np.pi * 4720 * x)) * np.exp(-x * 1.2) * np.minimum(1, x / 0.01)
place(D, ringing, bl + 0.01, 0.16)
age = (1.1 + np.sqrt(1.1 ** 2 + 4 * 0.85 * 1.55)) / (2 * 0.85)                               # the tip lands where js/acts.js lets it fall
whirl = band(noise(842, age), 600, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 5.3 / np.pi * T_(age) * 3))
place(D, norm(whirl) * np.linspace(1, 0.3, len(whirl)), bl + 0.05, 0.06, pan=-0.3)
place(D, clang(843, 0.5, 0.35), bl + age, 0.16, pan=-0.45)
fa = A3['fall']                                                                             # he falls
place(D, thump(850, 55, 0.8, 7), fa[1] - 0.08, 0.7)
for k in range(5): place(D, clink(860 + k), fa[1] - 0.05 + 0.06 * k, 0.16 * (1 - 0.15 * k), pan=0.1 * k - 0.2)
x = fa[0] + 0.4; k = 0                                                                      # his heartbeat, slowing
while x < 78.7:
    place(D, thump(870 + k, 48, 0.25, 22), x, 0.4); place(D, thump(900 + k, 44, 0.25, 26), x + 0.2, 0.26)
    x += 0.95 + 0.12 * k; k += 1
x = A3['crowLand'][0]                                                                       # the crow comes down onto his chest (their first meeting)
while x < A3['crowLand'][1]:
    place(D, flap(950 + int(x * 10), 0.9), x, 0.3 * (0.6 + 0.4 * (x - A3['crowLand'][0]) / 1.4), pan=0.25); x += 1 / 2.6 if x < 77.7 else 1 / 4.5
# the dream bus: a muffled, cavernous room; gone the instant he wakes
ir2_t = T_(2.4); ir2 = band(np.random.default_rng(5).standard_normal(len(ir2_t)) * np.exp(-ir2_t * 2.2), 120, 3500); ir2 /= np.sqrt((ir2 ** 2).sum())
for ch in range(2):
    D[ch] = D[ch] * 0.8 + np.fft.irfft(np.fft.rfft(D[ch], 2 * N) * np.fft.rfft(ir2, 2 * N), 2 * N)[:N] * 0.45
    muff = band(D[ch], 20, 900)                                                             # after the fall it all goes under water
    D[ch] = D[ch] * (1 - 0.8 * fallen) + muff * 0.8 * fallen
L += D * 0.42 * (1 - np.clip((t - 78.8) / 0.06, 0, 1))[None, :]   # under 1편's level: loud, not deafening

# the wake: armour rattles once, the crow startles up; then near silence — and the tear hisses in the ash
wk = A3['wake']
for k in range(6): place(L, clink(1000 + k), wk + 0.03 + 0.05 * k, 0.14 * (1 - 0.13 * k), pan=0.12 * k - 0.3)
place(L, thump(1010, 70, 0.3, 20), wk + 0.02, 0.16)
x = A3['startle'][0] + 0.05
while x < A3['startle'][1]: place(L, flap(1020 + int(x * 10), 1.0), x, 0.36, pan=0.15); x += 1 / 5
dp = A3['drop']; x = T_(0.9)
sizzle = band(noise(1030, 0.9), 2500, 11000) * np.exp(-x * 5) * (0.6 + 0.4 * np.random.default_rng(1031).random(len(x)) ** 6)
place(L, norm(sizzle) * np.minimum(1, x / 0.01), dp, 0.16)
place(L, tone(2400, 0.05, 90), dp, 0.05)
place(L, norm(band(noise(1040, 1.0), 1800, 6000)) * np.sin(np.pi * T_(1.0)) ** 2, A3['nuzzle'][0], 0.06, pan=0.2)   # feathers on his cheek
# dawn: a few birds far off, the sword planted, the crow onto the hilt and back, and the last walk (no scrape now)
r = np.random.default_rng(1100); x = 84.6
while x < END - 0.4:
    d = T_(r.uniform(0.07, 0.14)); f0 = r.uniform(3000, 4600); sw_ = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.25 * np.sin(np.pi * d / d[-1]))) / SR) * np.sin(np.pi * d / d[-1]) ** 2
    for rep_ in range(r.integers(1, 4)): place(L, sw_, x + rep_ * (len(d) / SR + 0.04), 0.025 * r.uniform(0.5, 1), pan=r.uniform(-0.7, 0.7))
    x += r.uniform(0.6, 1.6)
pl = A3['plant']
place(L, norm(band(noise(1110, 0.25), 200, 3000)) * np.exp(-T_(0.25) * 16), pl[1] - 0.04, 0.3)   # the blade bites the earth
place(L, thump(1111, 80, 0.3, 18), pl[1] - 0.03, 0.3)
place(L, clang(1112, 0.2, 0.4), pl[1], 0.05)
place(L, clink(1113), A3['hilt'][1] - 0.05, 0.1, pan=0.2)                                  # the crow lands on the hilt
for a_, b_ in ((A3['hilt'][0], A3['hilt'][1]), (A3['shoulder'][0], A3['shoulder'][1])):
    x = a_
    while x < b_: place(L, flap(1120 + int(x * 10), 0.8), x, 0.26, pan=0.2); x += 1 / 4.5

# ---------------- a little space, the fade, the level ----------------
ir_t = T_(0.9); ir = np.random.default_rng(3).standard_normal(len(ir_t)) * np.exp(-ir_t * 5.5); ir = band(ir, 200, 5000); ir /= np.sqrt((ir ** 2).sum())
for ch in range(2):
    wet = np.fft.irfft(np.fft.rfft(L[ch], 2 * N) * np.fft.rfft(ir, 2 * N), 2 * N)[:N]
    L[ch] = L[ch] + wet * 0.22
L *= np.minimum(1, t / 0.4)[None, :]
L *= (1 - np.clip((t - (END - 0.5)) / 0.5, 0, 1))[None, :]
L = L / np.abs(L[:, :int(30 * SR)]).max() * 0.6                      # 1편 keeps its level; the limiter holds the clashes
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
