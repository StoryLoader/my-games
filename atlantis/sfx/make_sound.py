#!/usr/bin/env python3
"""make_sound.py — the effects track of 「아틀란티스 전설」, synthesized here from code (no recorded or downloaded sound, no music).
Every event is placed from js/cues.js with the same anchors js/scenes.js uses (cue starts and about(): the phrase's
character position in the line), so a re-timed narration needs only this script run again.

  python3 sfx/make_sound.py <out.wav>     48 kHz stereo, 16-bit, the film's full length

Layers, by place (the same shot table as scenes.js): the open sea (swell, surf, wind, gulls at noon), the stone hall of
Sais (room tone, a far drip), the storm (wind, rain, thunder on the lightning), under the water (a muffled rumble,
bubbles), dawn (calm water). Events: the water ripple at each change of place and a deep plunge at each chapter; oars and
timbers of the fleets; the armies at war (c02–c03); the bull at the pillar; the gleam of orichalcum; the earthquake and the
flood; the held silence where the Critias breaks off; Thera's eruption; Helike's wave; a last drop on still water.
"""
import json, os, re, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CJ = open(os.path.join(HERE, '..', 'js', 'cues.js'), encoding='utf-8').read()
D = json.loads(CJ[CJ.index('{'):CJ.rindex('}') + 1])
CUES = {c['id']: c for c in D['cues']}
END = D.get('duration') or (D['cues'][-1]['end'] + 3)
N = int(END * SR) + SR
t = np.arange(N) / SR
L = np.zeros((2, N))

def S(i): return CUES[i]['start']
def E(i): return CUES[i]['end']
def at(i, f): c = CUES[i]; return c['start'] + max(0, min(1, f)) * c['duration']
WCH = re.compile(r'[\s.,!?·…"\'“”‘’()\[\]『』-]')
def about(i, phrase):
    c = CUES[i]; txt = c.get('text', ''); k = txt.find(phrase)
    if k < 0: return c['start']
    w = lambda s: len(WCH.sub('', s)); return c['start'] + c['duration'] * w(txt[:k]) / max(1, w(txt))

def T_(d): return np.arange(int(d * SR)) / SR
def band(sig, lo, hi):
    X = np.fft.rfft(sig); f = np.fft.rfftfreq(len(sig), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(sig))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def loop(seed, lo, hi, dur=37.0, brown=False):
    """a long band-limited noise made from a seamless loop (a full-length FFT of the whole film is too slow)"""
    n = int(dur * SR); xf = int(1.0 * SR); r = np.random.default_rng(seed).standard_normal(n + xf)
    if brown: r = np.cumsum(r) * 0.02
    y = band(r, lo, hi); a = y[:n].copy(); w = np.linspace(0, 1, xf); a[:xf] = a[:xf] * w + y[n:n + xf] * (1 - w)
    reps = N // n + 1; return norm(np.tile(a, reps)[:N])
def noise(seed, d): return np.random.default_rng(seed).standard_normal(int(d * SR))
def place(snd, at_, gain=1.0, pan=0.0):
    i = int(at_ * SR)
    if i >= N or i + len(snd) <= 0: return
    if i < 0: snd = snd[-i:]; i = 0
    n = min(len(snd), N - i); l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[0, i:i + n] += snd[:n] * gain * l * 1.41; L[1, i:i + n] += snd[:n] * gain * r * 1.41

# ---------------- where we are: the same shot table as js/scenes.js (cue → place) ----------------
SHOTS = [('op01', 'dusk'), ('op02', 'dusk'), ('op03', 'dusk'), ('op04', 'dusk'), ('op06', 'dusk'),
         ('a01', 'hall'), ('b01', 'noon'), ('b02', 'noon'), ('b03', 'noon'), ('b04', 'hall'), ('b05', 'noon'), ('b06', 'hall'),
         ('b08', 'noon'), ('b13', 'hall'), ('b15', 'noon'), ('b16', 'dusk'), ('c01', 'dusk'), ('c03', 'hall'), ('c04', 'storm'),
         ('c05', 'mud'), ('c06', 'hall'), ('d01', 'under'), ('d10', 'noon'), ('d12', 'ash'), ('d14', 'noon'), ('d19', 'storm'), ('d21', 'under'), ('d22', 'storm'),
         ('e01', 'dawn'), ('e02', 'hall'), ('e06', 'dawn'), ('e08', 'hall'), ('e09', 'dawn')]
starts = [S(c) for c, _ in SHOTS] + [END + 5]
def mask(kinds, fade=0.5):
    """1 while the shot's place is one of kinds, with short fades at the cuts"""
    m = np.zeros(N)
    for k, (c, p) in enumerate(SHOTS):
        if p in kinds: a, b = int(starts[k] * SR), int(starts[k + 1] * SR); m[a:min(b, N)] = 1
    w = int(fade * SR); c = np.concatenate([[0], np.cumsum(m)]); h = w // 2   # a moving average via the running sum
    i = np.arange(N); lo = np.clip(i - h, 0, N); hi = np.clip(i + h, 0, N)
    return (c[hi] - c[lo]) / w

SEA = mask(('dusk', 'noon', 'dawn', 'mud', 'ash'))
HALL = mask(('hall',)); STORM = mask(('storm',)); UNDER = mask(('under',)); NOON = mask(('noon',))
# the held silence after Zeus's unfinished sentence (c07 → c08): every bed drops away
hold = np.ones(N); a, b = E('c07') + 0.05, S('c08') + 0.4
hold *= np.clip(1 - (t - a) / 0.25, 0, 1) + np.clip((t - b) / 0.8, 0, 1) * (t > b)
hold = np.clip(hold, 0, 1)

# ---------------- beds ----------------
swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 7.3) ** 2            # waves arrive every few seconds
for ch, seed in ((0, 1), (1, 2)):
    surf = loop(seed, 120, 1400, 41.0 + seed, brown=True); hiss = loop(seed + 10, 1500, 6000, 29.0 + seed)
    sw = 0.55 + 0.45 * np.sin(2 * np.pi * t / 7.3 + ch * 0.9) ** 2
    L[ch] += (surf * 0.13 + hiss * 0.028) * sw * SEA * hold
    room = loop(seed + 20, 60, 500, 33.0 + seed, brown=True)
    L[ch] += room * 0.05 * HALL * hold
    wind = loop(seed + 30, 250, 2200, 23.0 + seed); rain = loop(seed + 40, 2500, 9000, 19.0 + seed)
    howl = 0.5 + 0.5 * np.sin(t * 0.7 + ch) * np.sin(t * 0.23)
    L[ch] += (wind * 0.09 * (0.5 + howl) + rain * 0.05 + surf * 0.12) * STORM * hold
    deep = loop(seed + 50, 30, 260, 31.0 + seed, brown=True)
    L[ch] += deep * 0.16 * UNDER * hold
# the mud sea (c05): a slow thick slap instead of surf
MUD = mask(('mud',)); L += loop(77, 60, 400, 27.0, brown=True) * 0.08 * MUD * (0.5 + 0.5 * np.sin(t * 0.9)) * hold

def drip():
    d = T_(0.5); return np.sin(2 * np.pi * (1300 + 900 * np.exp(-d * 40)) * d) * np.exp(-d * 30)
for k in range(400):
    x = 3 + k * 4.1 + 1.3 * np.sin(k * 1.7)
    if x < END and HALL[int(x * SR)] > 0.9: place(drip(), x, 0.05, pan=0.5 * np.sin(k))
def gull(seed):
    r = np.random.default_rng(seed); d = T_(0.5); f = 1900 - 700 * d / 0.5 + 200 * np.sin(2 * np.pi * 14 * d)
    ph = 2 * np.pi * np.cumsum(f) / SR; v = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    return norm(v * np.sin(np.pi * d / 0.5) ** 0.7 * (0.8 + 0.2 * r.random()))
for k in range(200):
    x = 2 + k * 5.3 + 1.8 * np.sin(k * 2.9)
    if x < END and NOON[int(x * SR)] > 0.9:
        for j in range(1 + k % 3): place(gull(500 + k * 3 + j), x + j * 0.42, 0.04, pan=0.6 * np.sin(k * 1.3))
def bubbles(seed, d=2.0, n=24):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(n):
        f0 = r.uniform(500, 1600); x = T_(0.08); b = np.sin(2 * np.pi * f0 * (1 + 2.5 * x) * x) * np.exp(-x * 60)
        i = int(r.uniform(0, d - 0.1) * SR); out[i:i + len(b)] += b * r.uniform(0.3, 1)
    return norm(out)
for k in range(140):
    x = 1 + k * 3.7 + 1.2 * np.sin(k * 3.1)
    if x < END and UNDER[int(x * SR)] > 0.9: place(bubbles(600 + k, 1.6, 10 + k % 12), x, 0.07, pan=0.5 * np.sin(k))

# ---------------- transitions: the ripple at each change of place, a deep plunge at chapters ----------------
def swish(seed, d=1.4):
    x = T_(d); w = norm(band(noise(seed, d), 200, 1800)) * np.sin(np.pi * x / d) ** 2
    gurgle = np.sin(2 * np.pi * (300 + 120 * np.sin(2 * np.pi * 7 * x)) * x) * np.sin(np.pi * x / d) ** 3
    return norm(w + 0.15 * gurgle)
def plunge(seed):
    d = T_(2.4); hit = norm(band(noise(seed, 2.4), 80, 1200)) * np.exp(-d * 6)
    boom = np.sin(2 * np.pi * (70 + 40 * np.exp(-d * 5)) * d) * np.exp(-d * 2.2)
    return norm(hit * 0.7 + boom + 0.25 * bubbles(seed + 1, 2.4, 30) * np.exp(-d * 1.5))
RIPPLES = ['op04', 'b04', 'b05', 'b06', 'b08', 'b13', 'b15', 'c03', 'c04', 'c06', 'd10', 'd19', 'd21', 'd22', 'e02', 'e06', 'e08', 'e09']
for k, c in enumerate(RIPPLES): place(swish(100 + k), S(c) - 0.7, 0.13, pan=0.3 * np.sin(k))
for k, c in enumerate(['a01', 'b01', 'c01', 'd01', 'e01']): place(plunge(150 + k), S(c) - 0.6, 0.3)

# ---------------- storms: thunder on the same times as the lightning in scenes.js ----------------
def thunder(seed, d=4.0):
    r = np.random.default_rng(seed); x = T_(d)
    crack = norm(band(r.standard_normal(len(x)), 800, 7000)) * np.exp(-x * 14)
    roll = norm(band(np.cumsum(r.standard_normal(len(x))) * 0.02, 25, 300)) * np.minimum(1, x / 0.15) * np.exp(-x * 0.9) * (0.7 + 0.3 * np.sin(2 * np.pi * 1.3 * x))
    return norm(crack * 0.5 + roll)
for a_, b_ in ((S('c04'), E('c04q') + 1), (S('d19'), E('d20') + 1)):
    x, k = a_ + 0.6, 0
    while x < b_:
        place(thunder(200 + k + int(a_)), x + 0.05, 0.22 if k % 2 else 0.3, pan=0.4 * np.sin(k * 1.9)); x += 2.3 + 1.1 * np.sin(k * 2.3 + 1); k += 1

# ---------------- ships: oars and timbers ----------------
def oars(seed, d, rate=0.95):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); x = 0.2
    while x < d - 1:
        st = norm(band(r.standard_normal(int(0.5 * SR)), 300, 2500)) * np.sin(np.pi * T_(0.5) / 0.5) ** 2 * np.exp(-T_(0.5) * 3)
        i = int(x * SR); out[i:i + len(st)] += st; x += rate
    creak = norm(band(r.standard_normal(len(out)), 300, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * T_(d))) ** 6)
    return norm(out + 0.3 * creak) * np.minimum(1, T_(d) / 1.0) * np.minimum(1, (d - T_(d)) / 1.0)
place(oars(300, E('c02') - S('c01') + 1), S('c01'), 0.12)
place(oars(301, E('e07') - S('e06') + 0.5, 1.1), S('e06'), 0.1, pan=-0.2)
place(oars(302, E('a06') - S('a01') + 0.5, 1.4), S('a01') + 0.6, 0.05)  # Solon's ship, painted, far

# ---------------- the armies (c02–c03): war cries, clashing bronze, the tramp of hoplites ----------------
def clang(seed):
    r = np.random.default_rng(seed); d = T_(1.0); f0 = r.uniform(420, 640)   # bronze, a little lower than iron
    s = sum(a * np.sin(2 * np.pi * f0 * m * d + r.random() * 6) * np.exp(-d * dk) for m, a, dk in ((1, 1, 4), (2.76, 0.7, 6), (5.4, 0.45, 9), (8.9, 0.3, 12)))
    return norm(s * 0.6 + norm(band(r.standard_normal(len(d)), 1200, 9000)) * np.exp(-d * 45) * 1.6)
def warcry(seed, d=2.6, n=36, pitch=180, swell=0.5):
    """a host shouting: many voices, each a buzzy tone gliding up then down, shaped by the formants of 'a'"""
    r = np.random.default_rng(seed); x = T_(d); out = np.zeros(len(x))
    for k in range(n):
        f0 = pitch * r.uniform(0.75, 1.45); st = r.uniform(0, 0.5); ln = r.uniform(d * 0.5, d - st)
        e = np.clip((x - st) / 0.18, 0, 1) * np.clip((st + ln - x) / 0.5, 0, 1)
        fr = f0 * (1 + 0.18 * np.clip((x - st) / 0.4, 0, 1) - 0.12 * np.clip((x - st - ln * 0.6) / (ln * 0.4), 0, 1)) * (1 + 0.012 * np.sin(2 * np.pi * r.uniform(4, 6.5) * x + k))
        ph = 2 * np.pi * np.cumsum(fr) / SR
        out += sum(np.sin(m * ph) / m ** 0.9 for m in range(1, 14)) * e * r.uniform(0.5, 1.0)
    voiced = band(out, 600, 1300) + band(out, 1900, 2900) * 0.45 + band(out, 250, 500) * 0.4
    breath = band(r.standard_normal(len(x)), 500, 3500) * 0.25 * np.clip(x / 0.3, 0, 1)
    return norm((norm(voiced) + norm(breath) * 0.3) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** swell)
def melee(seed, d=3.0, rate=7.0):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); x = 0.0; k = 0
    while x < d - 1.0:
        c = clang(seed * 10 + k); i = int(x * SR); n = min(len(c), len(out) - i); out[i:i + n] += c[:n] * r.uniform(0.15, 0.6); x += r.exponential(1 / rate); k += 1
    out += norm(band(r.standard_normal(len(out)), 150, 1200)) * 0.25
    return norm(out) * np.minimum(1, T_(d) / 0.3) * np.minimum(1, (d - T_(d)) / 0.6)
def tramp(seed, d=4.0, rate=0.55):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); x = 0.0
    while x < d - 0.4:
        for j in range(12):
            st = band(r.standard_normal(int(0.12 * SR)), 60, 600) * np.exp(-T_(0.12) * 40); i = int((x + r.uniform(0, 0.08)) * SR); out[i:i + len(st)] += st * r.uniform(0.4, 1)
        x += rate
    return norm(out)
ARMY = [('c02', 0.05, 0.2, -0.3, 'cry'), ('c02', 0.3, 0.16, -0.2, 'melee'), ('c02', 0.65, 0.16, 0.2, 'melee'),
        ('c03', 0.0, 0.18, 0.0, 'tramp'), ('c03', 0.3, 0.22, 0.0, 'cry'), ('c03', 0.4, 0.2, 0.0, 'melee'), ('c03', 0.75, 0.2, 0.3, 'melee')]
for n_, (cid, f, g, pan, kind) in enumerate(ARMY):
    t0 = at(cid, f); g *= 0.42   # under the voice
    if kind == 'cry': place(warcry(3000 + n_, 3.2), t0, g, pan)
    elif kind == 'melee': place(melee(3100 + n_, 3.4), t0, g, pan)
    elif kind == 'tramp': place(tramp(3200 + n_, 4.0), t0, g, pan)

# ---------------- the empire: the gleam of orichalcum, the temple, the bull ----------------
def gleam(f=880, d=2.4):
    x = T_(d); s = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x * dk) for m, a, dk in ((1, 1, 1.6), (2.01, 0.5, 2.2), (3.03, 0.3, 3), (4.2, 0.2, 4)))
    return norm(s * np.minimum(1, x / 0.02))
place(gleam(660), about('b10', '놋쇠'), 0.04, -0.3); place(gleam(740), about('b10', '주석'), 0.04, 0.3)
place(gleam(880), about('b10', '오레이칼코스'), 0.07); place(gleam(990), about('b10', '오레이칼코스') + 0.12, 0.04, 0.4)
place(gleam(830), about('b11', '오레이칼코스'), 0.04)
def hum(d, f=55):
    x = T_(d); return norm(np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.01 * x) + 0.3 * np.sin(2 * np.pi * f * 3.02 * x)) * np.minimum(1, x / 1.2) * np.minimum(1, (d - x) / 1.2)
place(hum(E('b12') - S('b12') + 0.5), S('b12'), 0.06)
def bellow(seed):
    r = np.random.default_rng(seed); x = T_(1.8); f = 95 + 40 * np.sin(np.pi * np.clip(x / 1.6, 0, 1)) ** 0.5
    ph = 2 * np.pi * np.cumsum(f) / SR; v = sum(np.sin(m * ph) / m ** 0.8 for m in range(1, 18))
    v = band(v, 80, 1400) * np.minimum(1, x / 0.15) * np.exp(-np.maximum(0, x - 1.3) * 6)
    return norm(v + 0.2 * band(r.standard_normal(len(x)), 200, 2000) * np.exp(-x * 2))
place(bellow(400), about('b14', '황소') - 0.2, 0.12, 0.2)

# ---------------- the night of the end: earthquake, collapse, flood ----------------
def quake(seed, d):
    r = np.random.default_rng(seed); x = T_(d)
    rumble = norm(band(np.cumsum(r.standard_normal(len(x))) * 0.02, 18, 160)) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * x) * np.sin(2 * np.pi * 0.31 * x))
    out = rumble.copy(); y = 0.5
    while y < d - 1:
        cr = norm(band(r.standard_normal(int(0.9 * SR)), 150, 3000)) * np.exp(-T_(0.9) * 5); i = int(y * SR); out[i:i + len(cr)] += cr * r.uniform(0.3, 0.8); y += r.uniform(0.6, 1.6)
    return norm(out) * np.minimum(1, x / 0.8) * np.minimum(1, (d - x) / 2.0)
def flood(seed, d):
    x = T_(d); r = noise(seed, d); roar = norm(band(r, 80, 2500)) * np.clip(x / (d * 0.4), 0, 1) ** 1.5
    return roar * np.minimum(1, (d - x) / 2.5)
q0 = S('c04q'); qd = E('c04q') - q0 + 2.5
place(quake(500, qd), q0, 0.34); place(flood(501, qd - 1), q0 + 2.0, 0.22)
place(plunge(502), about('c04q', '바다') + 0.3, 0.3)
# the Critias breaks off: a last low pulse under 'spake as follows —', then nothing until c08
place(hum(3.0, 41), at('c07', 0.55), 0.08)

# ---------------- the search ----------------
def sonar(f=1250):
    x = T_(2.6); return np.sin(2 * np.pi * f * x) * np.exp(-x * 2.2) * np.minimum(1, x / 0.01)
for k, c in enumerate(['d01', 'd03', 'd09', 'd21']): place(sonar(1180 + 40 * k), S(c) + 1.2, 0.035, 0.3 * (k % 2 * 2 - 1))
def page(seed):   # a heavy old book turning a page (Kircher, Donnelly)
    d = T_(0.7); return norm(band(noise(seed, 0.7), 900, 7000)) * np.sin(np.pi * d / 0.7) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * d))
place(page(600), about('d04', '지하 세계') - 0.3, 0.07); place(page(601), about('d05', '아틀란티스, 대홍수') - 0.3, 0.07)
# Thera erupts
def eruption(seed, d=5.0):
    r = np.random.default_rng(seed); x = T_(d)
    blast = norm(band(r.standard_normal(len(x)), 20, 400)) * np.exp(-x * 1.1) * np.minimum(1, x / 0.03)
    boom = np.sin(2 * np.pi * (38 + 30 * np.exp(-x * 3)) * x) * np.exp(-x * 0.9)
    rocks = np.zeros(len(x)); y = 0.6
    while y < d - 0.5:
        st = band(r.standard_normal(int(0.2 * SR)), 400, 4000) * np.exp(-T_(0.2) * 25); i = int(y * SR); rocks[i:i + len(st)] += st * r.uniform(0.2, 0.7); y += r.exponential(0.15)
    return norm(blast + boom * 0.8 + 0.25 * norm(rocks) * np.exp(-x * 0.4))
place(eruption(700), about('d12', '거대한') - 0.2, 0.3)
place(quake(701, 4.5), about('d13', '무너져') - 0.3, 0.14)
# Helike: a winter night, the earthquake and the wave
place(quake(710, 5.0), about('d20', '지진') - 0.4, 0.26); place(flood(711, 4.5), about('d20', '해일') - 0.2, 0.24)

# ---------------- the end: still water, one drop, concentric rings ----------------
def drop():
    d = T_(2.2); plop = np.sin(2 * np.pi * (700 * np.exp(-d * 14) + 240) * d) * np.exp(-d * 18)
    return norm(plop + 0.3 * norm(band(noise(800, 2.2), 200, 1500)) * np.exp(-d * 3))
place(drop(), S('e09') + 0.3, 0.16)
place(drop(), E('e11') + 0.6, 0.12)

# ---------------- level ----------------
L *= np.minimum(1, t / 0.8)[None, :]
L *= (1 - np.clip((t - (END - 1.5)) / 1.5, 0, 1))[None, :]
L = L[:, :int(END * SR)]
pk = np.abs(L).max(); L = L / pk * 0.5
L = np.tanh(L * 1.6) / np.tanh(1.6) * 0.89      # a gentle limiter at −1 dBFS
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'sfx.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(L.T, -1, 1) * 32767).astype('<i2').tobytes())
print(f'wrote {out}: {END:.2f}s')
