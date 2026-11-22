#!/usr/bin/env python3
"""make_sound.py — the lecture's own effects track, synthesized here from code (no recorded or downloaded sound, no music:
the user's standing rule for explainers). The events are the ones the scenes registered (sfx/events.json, written by
sfx/export_events.mjs from the page), so the sound sits on the same frames as the picture.

  python3 sfx/make_sound.py            → assets/user/sfx/sfx.mp4 (16x16 black + AAC 192k, from a 48 kHz stereo master)

Palette (the world: a magic-lantern table at night): the lantern struck and its low hum; glass plates lifted and set
down (clinks, slides), letters engraved (a fine scratch with a crystalline ring), small chimes as steps light, a breath of
air for each dive into the window, a wax seal pressed and broken, the hand lantern guttering, the lantern snuffed.
Under the talk, a very low bed: room tone and the lantern's sparse crackle — silent while the film plays (its own sound).
"""
import json, os, subprocess
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
CJ = open(os.path.join(ROOT, 'js', 'cues.js'), encoding='utf-8').read()
D = json.loads(CJ[CJ.index('{'):CJ.rindex('}') + 1]); CUES = {c['id']: c for c in D['cues']}
END = D['duration']; N = int(END * SR) + SR
EV = json.load(open(os.path.join(HERE, 'events.json')))
F0 = CUES['op03']['end'] + 0.7; F1 = F0 + 127.0                       # the whole film (its own sound)
H0 = CUES['d04']['end'] + 0.3; H1 = H0 + 13.0                         # the highlight
L = np.zeros((2, N))
rng = np.random.default_rng(7)

def T_(d): return np.arange(int(d * SR)) / SR
def band(sig, lo, hi):
    X = np.fft.rfft(sig); f = np.fft.rfftfreq(len(sig), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(sig))
def noise(d, seed): return np.random.default_rng(seed).standard_normal(int(d * SR))
def env(d, a=0.005, r=None, k=6.0):
    t = T_(d); e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-k * t / d) if r is None else e * np.clip((d - t) / r, 0, 1)
def norm(x, p=1.0): return x / (np.abs(x).max() + 1e-9) * p
def partials(f, ratios, d, decay, seed=0, amps=None):
    t = T_(d); r = np.random.default_rng(seed); out = np.zeros_like(t)
    for i, q in enumerate(ratios):
        a = (amps[i] if amps else 1 / (1 + i)) ; ph = r.uniform(0, 6.28)
        out += a * np.sin(2 * np.pi * f * q * t + ph) * np.exp(-t * decay * (1 + 0.6 * i))
    return out * np.minimum(1, t / 0.002)
def place(snd, at, gain=1.0, pan=0.0, verb=True):
    i = int(at * SR)
    if i >= N or i + len(snd) <= 0: return
    s = snd[: max(0, N - i)]
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[0, i:i + len(s)] += s * gain * lg * 1.41; L[1, i:i + len(s)] += s * gain * rg * 1.41
    if verb:   # a small dark room: a few soft reflections, wider in stereo
        for k, (dt, g2, pp) in enumerate([(0.031, 0.32, -0.6), (0.047, 0.28, 0.6), (0.083, 0.2, -0.3), (0.131, 0.14, 0.4), (0.197, 0.09, 0)]):
            j = i + int(dt * SR); s2 = band(s, 200, 5000)[: max(0, N - j)] if k > 1 else s[: max(0, N - j)]
            L[0, j:j + len(s2)] += s2 * gain * g2 * (1 - pp) * 0.7; L[1, j:j + len(s2)] += s2 * gain * g2 * (1 + pp) * 0.7

# —— the sounds ——
def ignite():
    strike = band(noise(0.16, 1), 1800, 7000) * env(0.16, 0.002, k=9)
    whoosh = band(noise(1.1, 2), 150, 1400) * np.sin(np.linspace(0, np.pi, int(1.1 * SR))) ** 1.5
    thump = np.sin(2 * np.pi * 70 * T_(0.4)) * env(0.4, 0.004, k=8)
    out = np.zeros(int(1.3 * SR)); out[:len(strike)] += norm(strike, 0.7)
    j = int(0.08 * SR); out[j:j + len(whoosh)] += norm(whoosh, 0.45); out[j:j + len(thump)] += thump * 0.35
    return out
def hum(d=3.2):
    t = T_(d); h = sum(np.sin(2 * np.pi * 55 * k * t) / k ** 1.3 for k in (1, 2, 3, 4))
    return h * np.minimum(1, t / 0.9) * np.clip((d - t) / 1.2, 0, 1) * 0.22
def clink(seed):
    f = 1900 + np.random.default_rng(seed).uniform(-250, 450)
    return partials(f, [1, 2.76, 5.40, 8.93], 0.7, 9, seed, [1, .6, .35, .2]) * 0.55
def tick(seed):
    f = 3000 + np.random.default_rng(seed).uniform(-300, 300)
    out = partials(f, [1, 2.3], 0.08, 40, seed) * 0.4; n = band(noise(0.02, seed), 3000, 9000) * env(0.02, 0.001) * 0.05; out[:len(n)] += n
    return out
def lift(seed):
    d = 0.9; n = noise(d, seed); t = T_(d)
    sweep = np.zeros_like(n)
    for k in range(6):   # a band moving up as the plate slides
        a, b = int(k * len(n) / 6), int((k + 1) * len(n) / 6)
        sweep[a:b] = band(n, 700 + 400 * k, 1500 + 600 * k)[a:b]
    out = norm(sweep * np.sin(np.pi * t / d) ** 2, 0.22); c = clink(seed + 5) * 0.25; j = len(out) - len(c); out[j:] += c
    return out
def etch(seed):
    d = 1.4; scr = band(noise(0.55, seed), 2500, 8000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 23 * T_(0.55)))) * env(0.55, 0.01, r=0.25)
    ring = partials(2637, [1, 1.5, 2.0, 3.01], d, 3.2, seed, [.5, .35, .25, .12])
    out = np.zeros(int(d * SR)); out[:len(scr)] += norm(scr, 0.12); out += ring * 0.28
    return out
def chime(seed):
    f = [880, 1046.5, 1174.7, 1318.5, 1568][seed % 5]
    return partials(f, [1, 2.0, 3.0, 4.16], 1.6, 2.4, seed, [1, .35, .15, .08]) * 0.32
def bell(seed): return partials(660, [1, 2.4, 3.9, 5.4], 2.2, 1.6, seed, [1, .5, .3, .15]) * 0.32
def dive(seed):
    d = 1.8; t = T_(d); n = noise(d, seed)
    lo = band(n, 120, 900) * (t / d) ** 2.2 * 1.0
    hi = band(n, 1500, 6000) * (t / d) ** 3 * 0.25
    boom = np.zeros_like(t); j = int((d - 0.25) * SR); bt = T_(0.25)
    boom[j:j + len(bt)] = np.sin(2 * np.pi * 48 * bt) * np.exp(-bt * 10)
    return norm(lo + hi, 0.55) * np.clip((d - t) / 0.12, 0, 1) + boom * 0.6
def whoosh(seed):
    d = 0.55; t = T_(d); return norm(band(noise(d, seed), 400, 2600) * np.sin(np.pi * t / d) ** 2, 0.2)
def rattle(seed):
    out = np.zeros(int(1.7 * SR)); r = np.random.default_rng(seed)
    for k in range(26):
        s = clink(seed * 100 + k) * r.uniform(0.15, 0.4); j = int(r.uniform(0, 1.2) * SR); out[j:j + len(s)] += s[: len(out) - j]
    return out
def count(seed):
    out = np.zeros(int(1.6 * SR)); x = 0.0; k = 0
    while x < 1.4:
        s = tick(seed + k) * 0.8; j = int(x * SR); out[j:j + len(s)] += s; x += 0.03 + 0.12 * (x / 1.4) ** 2; k += 1
    return out
def shimmer(seed):
    out = np.zeros(int(2.4 * SR))
    for k in range(9):
        s = partials([1568, 1760, 2093, 2349, 2637][k % 5] * (1 + 0.5 * (k // 5)), [1, 2.0, 3.0], 1.4, 3, seed + k) * 0.12
        j = int(k * 0.11 * SR); out[j:j + len(s)] += s
    return out
def seal(seed):
    th = np.sin(2 * np.pi * 95 * T_(0.3)) * env(0.3, 0.003, k=9) * 0.6
    cr = band(noise(0.25, seed), 1200, 6000) * env(0.25, 0.002, k=12) * 0.15
    out = np.zeros(int(0.4 * SR)); out[:len(th)] += th; out[:len(cr)] += cr; return out
def scratch(seed): return norm(band(noise(0.35, seed), 1500, 4200) * env(0.35, 0.01, r=0.1), 0.16)
def gutter(seed):
    d = 0.6; t = T_(d); return norm(band(noise(d, seed), 80, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * env(d, 0.02, k=4), 0.22)
def stop(seed):   # a soft wooden marker
    return partials(720, [1, 2.9], 0.18, 26, seed) * 0.45
def snuff(seed):
    d = 0.8; t = T_(d); return norm(band(noise(d, seed), 150, 2000) * np.sin(np.pi * t / d) ** 1.5, 0.3)

SND = dict(ignite=lambda s: ignite(), hum=lambda s: hum(), clink=clink, tick=tick, lift=lift, etch=etch, chime=chime, bell=bell,
           dive=dive, whoosh=whoosh, rattle=rattle, count=count, shimmer=shimmer, seal=seal, scratch=scratch, gutter=gutter,
           stop=stop, snuff=snuff)
GAIN = dict(ignite=0.9, hum=0.8, clink=0.55, tick=0.5, lift=0.7, etch=0.55, chime=0.6, bell=0.6, dive=0.85, whoosh=0.6,
            rattle=0.5, count=0.5, shimmer=0.5, seal=0.7, scratch=0.6, gutter=0.6, stop=0.7, snuff=0.8)
for k, e in enumerate(EV):
    f = SND.get(e['type'])
    if f is None: print('no sound for', e['type']); continue
    place(f(k + 11), e['t'], GAIN[e['type']] * e.get('gain', 1), pan=float(np.sin(k * 1.7)) * 0.35)

# —— the bed: room tone + the lantern's sparse crackle, off while the film plays ——
t = np.arange(N) / SR
LOOP = int(37 * SR); room1 = band(np.cumsum(rng.standard_normal(LOOP)) * 0.02, 30, 220); room1 -= room1.mean()
xf = int(0.5 * SR); room1[:xf] *= np.linspace(0, 1, xf); room1[-xf:] *= np.linspace(1, 0, xf)
room = np.tile(room1, N // LOOP + 1)[:N]; room = norm(room, 1) * 0.012
crack = np.zeros(N); k = 0
x = 0.4
while x < END:
    s = band(noise(0.012, 900 + k), 1500, 7000) * env(0.012, 0.0005, k=7) * rng.uniform(0.004, 0.02)
    j = int(x * SR); crack[j:j + len(s)] += s[: N - j]; x += rng.exponential(0.55); k += 1
bed = room + crack
gate = np.ones(N)
for a, b in ((F0 - 0.4, F1 + 0.3), (H0 - 0.4, H1 + 0.2)):
    ia, ib = int(a * SR), int(b * SR); gate[ia:ib] = 0
    r = int(0.5 * SR); gate[max(0, ia - r):ia] = np.minimum(gate[max(0, ia - r):ia], np.linspace(1, 0, ia - max(0, ia - r)))
    gate[ib:ib + r] = np.minimum(gate[ib:ib + r], np.linspace(0, 1, len(gate[ib:ib + r])))
start = np.clip(t / 1.0, 0, 1); bed *= gate * start
L[0] += bed; L[1] += np.roll(bed, 37)

pk = np.abs(L).max(); L = L / max(pk, 1e-9) * min(pk, 0.7) if pk > 0.7 else L
out = os.path.join(ROOT, 'assets', 'user', 'sfx'); os.makedirs(out, exist_ok=True)
import wave
pcm = (np.clip(L.T, -1, 1) * 32767).astype('<i2')
import tempfile
wavp = os.path.join(tempfile.mkdtemp(), 'sfx.wav')   # the 48 kHz master stays out of the repo (174 MB); the AAC copy is the asset
with wave.open(wavp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=16x16:r=30', '-i', wavp,
                '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '192k',
                '-shortest', '-movflags', '+faststart', os.path.join(out, 'sfx.mp4')], check=True)
os.remove(wavp)
print('sfx', round(END, 2), 's ·', len(EV), 'events · peak', round(float(np.abs(L).max()), 3), '→', os.path.join(out, 'sfx.mp4'))
