#!/usr/bin/env python3
"""make_sound.py — the effects track of 「항우 vs 여포」, synthesized here from code (no recorded or downloaded sound, no music).
Every event is placed from js/cues.js with the same anchors js/scenes.js uses (cue starts, and about(): the phrase's
character position in the line), so a re-timed narration needs only this script run again.

  python3 sfx/make_sound.py <out.wav>     48 kHz stereo, 16-bit, the film's full length

Layers: a soft wind bed; ink drops and mist passes at the transitions; seals stamped; the bronze cauldron's low hum;
hooves; war drums and clashing iron; fire; water; the thrown halberd and the arrow; cracks in the paper; jade chimes and
a cup breaking; boats sinking and clay pots breaking; a rope pulled tight; a far chant of Chu songs at Gaixia.
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
WCH = re.compile(r'[\s.,!?·…"\'“”‘’()\[\]-]')
def about(i, phrase):
    c = CUES[i]; txt = c.get('text', ''); k = txt.find(phrase)
    if k < 0: return c['start']
    w = lambda s: len(WCH.sub('', s)); return c['start'] + c['duration'] * w(txt[:k]) / max(1, w(txt))

rng = np.random.default_rng(2026)
def T_(d): return np.arange(int(d * SR)) / SR
def band(sig, lo, hi):
    X = np.fft.rfft(sig); f = np.fft.rfftfreq(len(sig), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(sig))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def loop(seed, lo, hi, dur=37.0, brown=False):
    """a long band-limited noise made from a seamless loop (a full-length FFT of a 19-minute film is too slow)"""
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
def env(keys):
    ks = np.array(sorted(keys), dtype=float); return np.interp(t, ks[:, 0], ks[:, 1])
def span(a, b, lvl, fade=0.8):
    return env([[0, 0], [max(0, a - fade), 0], [a, lvl], [b, lvl], [b + fade, 0], [END + 2, 0]])

# ---------------- the wind bed (quiet, always) ----------------
g = 0.6 + 0.25 * np.sin(t * 0.21 + 1) + 0.15 * np.sin(t * 0.57 + 2)
for ch, seed in ((0, 1), (1, 2)):
    low = loop(seed, 50, 380, 41.0 + seed, brown=True)
    air = loop(seed + 10, 900, 4200, 29.0 + seed)
    L[ch] += low * 0.10 * g + air * 0.018 * g

# ---------------- transitions: ink drops (chapters) and mist passes ----------------
def drop():
    d = T_(1.8); plop = np.sin(2 * np.pi * (520 * np.exp(-d * 9) + 180) * d) * np.exp(-d * 22)
    bloom = norm(band(noise(5, 1.8), 40, 260)) * np.minimum(1, d / 0.5) * np.exp(-np.maximum(0, d - 0.5) * 2.4)
    return plop * 0.6 + bloom * 0.9
def mistpass():
    d = T_(1.6); w = norm(band(noise(6, 1.6), 300, 2600)) * np.sin(np.pi * d / 1.6) ** 2; return w
for i in ('ki01', 'sg01', 'jn01', 'gy01', 'ep01'): place(drop(), S(i) - 0.9, 0.42)
for i in ('op06', 'ki15', 'sg21', 'jn17', 'gy23', 'ep08', 'ep14', 'sg03', 'sg12', 'jn09', 'gy03'): place(mistpass(), S(i) - 0.8, 0.16)

# ---------------- seals ----------------
def seal_thump(seed):
    d = T_(0.5); th = np.sin(2 * np.pi * (95 + 30 * np.exp(-d * 30)) * d) * np.exp(-d * 18)
    slap = norm(band(noise(seed, 0.5), 500, 5000)) * np.exp(-d * 60)
    return norm(th + 0.5 * slap)
for k in range(4): place(seal_thump(40 + k), at('op11', 0.18 + k * 0.2) + 0.2, 0.42, pan=-0.45 + k * 0.3)
for i in ('ki01', 'sg01', 'jn01', 'gy01'): place(seal_thump(50), S(i) + 0.3, 0.5)

# ---------------- the bronze cauldron: a low bell-like hum ----------------
def bronze(d=4.0, seed=0):
    x = T_(d); f0 = 98
    s = sum(a * np.sin(2 * np.pi * f0 * m * x + seed * m) * np.exp(-x * dk) for m, a, dk in ((1, 1, 0.7), (2.01, 0.55, 1.0), (2.76, 0.4, 1.4), (4.1, 0.25, 2.2), (5.43, 0.12, 3)))
    return norm(s) * np.minimum(1, x / 0.02)
place(bronze(5, 1), S('ki06') + 2.4 + 2.2, 0.32)
place(bronze(5, 2), S('ki07') + 0.1, 0.26)
place(bronze(4, 3), S('jn12') + 0.2, 0.22)
place(bronze(6, 4), S('ep14') + 0.2, 0.3)
place(bronze(6, 5), S('ep16') + 1.0, 0.34)
place(bronze(8, 6), S('ep17') + 0.6, 0.3)

# ---------------- hooves ----------------
def hoof(seed):
    d = T_(0.18); x = np.sin(2 * np.pi * (140 + 40 * np.random.default_rng(seed).random()) * d) * np.exp(-d * 40)
    return norm(x + 0.5 * norm(band(noise(seed, 0.18), 300, 3000)) * np.exp(-d * 70))
def gallop(a, b, gain=0.25, rate=1.7, pan=0.0):
    x = a; k = 0
    while x < b:
        for off in (0, 0.07, 0.17, 0.24): place(hoof(1000 + k * 4 + int(off * 100)), x + off / rate * 1.7, gain * (0.7 + 0.3 * ((k + int(off * 10)) % 3) / 2), pan)
        x += 1 / rate * 1.0; k += 1
for i, gn in (('ki14', 0.25), ('ki17', 0.25), ('sg19', 0.12), ('sg20', 0.25), ('sg31', 0.2), ('jn18', 0.18), ('jn22', 0.18), ('gy11', 0.2), ('gy12', 0.16), ('gy13', 0.12)):
    gallop(S(i), E(i), gn)
gallop(S('sg34'), E('sg36'), 0.24, 1.9)
gallop(S('gy16'), E('gy16'), 0.24, 1.9)

# ---------------- war: drums, clashing iron, a far host ----------------
def drum(seed, f=62):
    d = T_(0.9); s = np.sin(2 * np.pi * (f * (1 + 0.5 * np.exp(-d * 25))) * d) * np.exp(-d * 5.5)
    return norm(s + 0.4 * norm(band(noise(seed, 0.9), 60, 900)) * np.exp(-d * 30))
def clang(seed):
    r = np.random.default_rng(seed); d = T_(1.0); f0 = r.uniform(520, 700)
    s = sum(a * np.sin(2 * np.pi * f0 * m * d + r.random() * 6) * np.exp(-d * dk) for m, a, dk in ((1, 1, 4), (2.76, 0.7, 6), (5.4, 0.45, 9), (8.9, 0.3, 12)))
    return norm(s * 0.6 + norm(band(r.standard_normal(len(d)), 1200, 9000)) * np.exp(-d * 45) * 1.6)
for k in range(9): place(drum(60 + k), at('sg09', 0.05 + k * 0.1), 0.42, pan=(k % 3 - 1) * 0.3); place(clang(80 + k), at('sg09', 0.08 + k * 0.1), 0.12, pan=(k % 2 * 2 - 1) * 0.4)
for k in range(10): place(drum(100 + k, 55), S('sg16') + k * 0.55, 0.36)
host = loop(9, 160, 900, 23.0)
L += host * (span(S('sg16'), E('sg16'), 0.05) + span(S('sg36') - 3, E('sg36'), 0.035) + span(S('gy14'), E('gy16'), 0.04))
for k in range(3): place(drum(120 + k, 58), at('gy16', 0.08 + k * 0.32), 0.45); place(clang(130 + k), at('gy16', 0.14 + k * 0.32), 0.16)
for k in range(6): place(drum(140 + k, 70), at('ki19', 0.1 + k * 0.15), 0.2)

# ---------------- fire ----------------
cr = np.zeros(N); r = np.random.default_rng(53); x = 0.0
while x < END:
    big = r.random() < 0.1; d = T_(0.05 if not big else 0.12)
    pop = band(r.standard_normal(len(d)), 900 if not big else 400, 7000) * np.exp(-d * (160 if not big else 55))
    i = int(x * SR); n = min(len(d), N - i); cr[i:i + n] += pop[:n] * r.uniform(0.3, 1.0) * (2 if big else 1); x += r.exponential(0.08)
roar = loop(54, 60, 500, 19.0)
fire = span(about('sg06', '막사를'), E('sg08'), 1.0) + span(S('jn09') + 1, E('jn09'), 1.3) + span(S('jn12'), E('jn12'), 0.6) + span(S('gy03'), E('gy10'), 0.25)
L[0] += (cr * 0.05 + roar * 0.07) * fire; L[1] += (np.roll(cr, 300) * 0.05 + roar * 0.07) * fire
place(norm(band(noise(55, 1.4), 60, 700)) * np.minimum(1, T_(1.4) / 0.2) * np.exp(-np.maximum(0, T_(1.4) - 0.2) * 3), about('sg06', '막사를'), 0.3)

# ---------------- water ----------------
wat = loop(60, 200, 1800, 17.0) * (0.6 + 0.4 * np.sin(t * 1.3) * np.sin(t * 0.37))
water = span(S('ki12'), E('ki13'), 0.6) + span(S('sg06'), E('sg06'), 0.8) + span(S('sg17'), E('sg17'), 0.9) + span(S('jn24'), E('jn27'), 0.8) + span(S('gy17'), E('gy22'), 0.8) + span(S('gy24'), E('gy25'), 0.6)
L += wat * 0.05 * water
for k in range(6): place(norm(band(noise(70 + k, 1.2), 80, 600)) * np.sin(np.pi * T_(1.2) / 1.2), S('sg06') + 0.4 + k * 0.35, 0.18, pan=-0.6 + k * 0.24)  # boats going under
pot = lambda seed: norm(band(noise(seed, 0.3), 700, 6000)) * np.exp(-T_(0.3) * 26)
for k in range(5): place(pot(80 + k), about('sg06', '솥을') + k * 0.18, 0.3, pan=-0.5 + k * 0.25)

# ---------------- iron in flight: the thrown halberd, the arrows ----------------
def whoosh(d=0.6, seed=0, lo=400, hi=3000):
    x = T_(d); return norm(band(noise(seed, d), lo, hi)) * np.sin(np.pi * x / d) ** 2
place(whoosh(0.9, 3, 300, 2200), about('sg23', '수극') - 0.5, 0.3)
place(clang(150), about('sg23', '수극') + 1.2, 0.12)
place(whoosh(0.35, 4, 1500, 7000), about('ki17', '비장') - 2, 0.2)
twang = lambda: np.sin(2 * np.pi * 180 * T_(0.4)) * np.exp(-T_(0.4) * 14)
place(twang(), S('sg40') + 0.45, 0.25); place(whoosh(0.45, 5, 1500, 7000), S('sg40') + 0.5, 0.22)
place(clang(160), S('sg40') + 0.95, 0.3)

# ---------------- cuts and cracks ----------------
place(whoosh(0.3, 7, 900, 6000), at('sg05', 0.55), 0.3); place(whoosh(0.3, 8, 900, 6000), at('sg30', 0.4), 0.3)
def crack(seed):
    d = T_(0.9); r = np.random.default_rng(seed); out = np.zeros(len(d))
    for _ in range(40): i = int(r.uniform(0, 0.7) * SR); s = band(r.standard_normal(600), 1500, 9000) * np.exp(-np.arange(600) / 80); out[i:i + 600] += s * r.uniform(0.3, 1)
    return norm(out + 0.4 * norm(band(noise(seed + 1, 0.9), 60, 300)) * np.exp(-d * 6))
for i in ('jn03', 'jn06', 'jn09', 'jn13'): place(crack(200 + len(i)), S(i), 0.28)
def chime(f): x = T_(1.4); return np.sin(2 * np.pi * f * x) * np.exp(-x * 4) + 0.4 * np.sin(2 * np.pi * f * 2.7 * x) * np.exp(-x * 7)
for k in range(3): place(chime(1760 + k * 120), at('jn07', 0.35 + k * 0.12), 0.1)
place(norm(band(noise(210, 0.5), 2000, 11000)) * np.exp(-T_(0.5) * 10), about('jn08', '깨뜨리며'), 0.3)
# the rope pulled tight
def creak(seed): x = T_(0.8); return norm(band(noise(seed, 0.8), 200, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * x))) * np.sin(np.pi * x / 0.8)
place(creak(220), S('gy26') + 0.2, 0.18); place(creak(221), S('gy33') + 1.0, 0.24)

# ---------------- night: the far chant of Chu songs at Gaixia ----------------
x = t
chant = sum(np.sin(2 * np.pi * f * x + p) for f, p in ((147, 0), (220.5, 1), (196, 2), (294, 0.5)))
form = 0.0
chant_env = span(S('gy04') + 0.5, E('gy06'), 1.0, 2.0) * (0.6 + 0.4 * np.sin(t * 0.9))
L += norm(chant) * 0.02 * chant_env
crick = np.zeros(N); r = np.random.default_rng(240); x0 = S('gy03')
while x0 < E('gy12'):
    d = T_(0.08); c = np.sin(2 * np.pi * 4300 * d) * np.sin(np.pi * d / 0.08) ** 2; i = int(x0 * SR); crick[i:i + len(d)] += c; x0 += 0.5 * r.uniform(0.8, 1.3)
L += crick * 0.01

# ---------------- level ----------------
L *= np.minimum(1, t / 0.8)[None, :]
L *= (1 - np.clip((t - (END - 1.5)) / 1.5, 0, 1))[None, :]
L = L[:, :int(END * SR)]
pk = np.abs(L).max(); L = L / pk * 0.5
# a gentle limiter at −1 dBFS
L = np.tanh(L * 1.6) / np.tanh(1.6) * 0.89
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'sfx.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(L.T, -1, 1) * 32767).astype('<i2').tobytes())
print(f'wrote {out}: {END:.2f}s')
