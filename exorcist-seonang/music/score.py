#!/usr/bin/env python3
"""score.py — the original score of 「서낭나무」, composed here and synthesized in code (numpy + the library's physically
modelled guqin from core/audio/pluck.py; no samples, no recordings).
Ink Wash palette (STYLE §7) in Korean folk colour: a low plucked silk string (거문고-like, the guqin model played low with
slides and 농현 vibrato), a breathy 대금-like flute with a buzzing 청, 장구 (궁편 · 채편), 큰북, 징, 꽹과리, and the 방울 motif
(서하's theme: a bell shiver answered by four harmonics, A–E–D–A). 계면조-like A minor pentatonic (A C D E G): E shakes, D bends down to C.
Unmetred where the picture is empty; the walk, the dig and the fight on the 0.75 s beat (80 bpm); true silence (all zero) for
T.hush, so the only sound there is the drip (in the mix); one 징 on the flying white.

  $LIB/.venv/bin/python music/score.py      → music/score.wav (48 kHz stereo), music/CUES.md
"""
import json, os, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import pluck as P   # noqa: E402

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T, DUR, BEAT = TL['T'], TL['DUR'], TL['BEAT']
SH = {s[0]: (s[1], s[2]) for s in TL['SHOTS']}
SR = 48000; N = int((DUR + 4) * SR)
rng = np.random.default_rng(500)
KEYS = ('string', 'flute', 'drum', 'metal', 'bell', 'drone')
bus = {k: np.zeros((N, 2)) for k in KEYS}
late = {k: np.zeros((N, 2)) for k in KEYS}   # what starts after the bell dies (T.dead), kept apart so the cut can kill the tails
cues = []
def tt(d): return np.arange(int(round(d * SR))) / SR
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x)
def bp(x, lo, hi, o=2): return sosfilt(sos('band', [lo, hi], o), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(d, a=.01, r=.2):
    n = int(round(d * SR)); e = np.ones(n); ai = max(1, min(n, int(a * SR))); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def put(b, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR)); x = np.asarray(x, np.float64)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    B = late if t >= T['dead'] else bus
    B[b][i:i + len(x), 0] += x * g * l * 1.41; B[b][i:i + len(x), 1] += x * g * r * 1.41

# —— instruments ——
A2, C3, D3, E3, G3, A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5 = 45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81
def gm(m, d=4.0, v=.6, bend=None, vib=None, harm=False):   # 거문고-like low silk string (guqin model)
    kw = {}
    if bend: kw['bend'] = bend
    if vib: kw['vib'] = vib
    return P.pluck('guqin', m, d, vel=v, harmonic=harm, **kw).astype(np.float64)
def daegeum(m, d, v=.5, vib=.18, bendto=None, breath=.35):   # breathy flute with a buzzing membrane (청)
    x = tt(d); f0 = hz(m)
    f = f0 * np.ones(len(x))
    if bendto is not None: f = f0 * 2 ** (np.interp(x, [0, d * .55, d * .8, d], [0, 0, bendto, bendto]) / 12)
    f = f * 2 ** ((vib * np.sin(2 * np.pi * 5.2 * x) * np.clip((x - .5) / .6, 0, 1)) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + .32 * np.sin(2 * ph + .3) + .12 * np.sin(3 * ph + 1.1) + .05 * np.sin(4 * ph)
    air = bp(rng.standard_normal(len(x)), f0 * .8, f0 * 3.5) * breath * (1 + .5 * np.sin(2 * np.pi * 3.1 * x))
    y = tone + air
    buzz = bp(np.tanh(y * 3.0), 1800, 4200) * .22   # the 청 membrane's rattle
    e = env(d, .25, .6) * (1 + .15 * np.sin(2 * np.pi * .7 * x))
    return (y + buzz) * e * v * .09
def gung(v=.8):   # 장구 궁편: low skin, a little pitch drop
    x = tt(.7); f = 105 * (1 + .35 * np.exp(-x * 30))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7) + bp(rng.standard_normal(len(x)), 150, 900) * np.exp(-x * 40) * .25
    return y * v * .5
def chae(v=.8):   # 장구 채편: the thin stick on the tight skin, a sharp '딱'
    x = tt(.25); y = bp(rng.standard_normal(len(x)), 900, 5200) * np.exp(-x * 55) * .8 + np.sin(2 * np.pi * 420 * x) * np.exp(-x * 30) * .5
    return y * v * .45
def buk(v=.8):   # 큰북: a deep barrel drum
    x = tt(1.6); f = 58 * (1 + .25 * np.exp(-x * 18))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.6) + bp(rng.standard_normal(len(x)), 60, 400) * np.exp(-x * 14) * .4
    return y * v * .8
def jing(v=.8, f=98.0, d=7.0):   # 징: a large flat gong with its slow 'wail' (pitch dips then lifts, beating partials)
    x = tt(d); y = np.zeros(len(x))
    wail = 1 - .02 * np.exp(-x * 1.5) + .012 * np.sin(2 * np.pi * .35 * x) * np.exp(-x * .3)
    for r, a, tau in [(1, 1, 3.2), (1.007, .8, 3.0), (1.52, .45, 2.2), (2.03, .35, 1.8), (2.71, .2, 1.2), (3.44, .14, .8), (4.27, .08, .5)]:
        y += a * np.sin(2 * np.pi * np.cumsum(f * r * wail) / SR + rng.random() * 6) * np.exp(-x / tau)
    y *= np.minimum(1, x / .012)
    y += bp(rng.standard_normal(len(x)), 200, 1800) * np.exp(-x * 25) * .3   # the mallet
    return y * v * .22
def kkwaeng(v=.8, open_=True):   # 꽹과리: a small bright gong; open rings, 막음 (damped) chokes
    d = .9 if open_ else .14; x = tt(d); y = np.zeros(len(x))
    for r, a in [(1, 1), (1.41, .8), (2.13, .7), (2.9, .5), (3.7, .35), (4.6, .25)]:
        y += a * np.sin(2 * np.pi * 820 * r * x + rng.random() * 6) * np.exp(-x * (5 if open_ else 30) * (1 + r * .2))
    y += hp(rng.standard_normal(len(x)), 3000) * np.exp(-x * 40) * .4
    return y * v * .12
def bells(v=.6, d=1.2):   # 방울: a cluster of small brass bells shaken
    out = np.zeros(int(d * SR))
    for j in range(22):
        f = rng.uniform(2800, 5600); x = tt(.45); y = np.sin(2 * np.pi * f * x) * np.exp(-x * rng.uniform(9, 16)) + .35 * np.sin(2 * np.pi * f * 2.7 * x) * np.exp(-x * 22)
        i = int(rng.uniform(0, d * .55) * SR); out[i:i + len(y)] += y[:len(out) - i] * rng.uniform(.3, 1)
    return out * v * .08
def drone(m, d, v=.5):   # a low bowed-air drone under the empty pictures (two detuned sines through breath)
    x = tt(d); f = hz(m)
    y = np.sin(2 * np.pi * f * x) + .6 * np.sin(2 * np.pi * f * 1.003 * x + 1) + .25 * np.sin(2 * np.pi * f * 2 * x)
    y += bp(rng.standard_normal(len(x)), f * 1.5, f * 6) * .3
    return lp(y, 900) * env(d, 1.5, 2.0) * v * .07
MOTIF = [(0, A5), (.42, E5), (.84, D5), (1.5, A4)]
def motif(t, v=.5, pan=.25, harm=True):   # 서하's theme: a bell shiver, then four harmonics
    put('bell', bells(v * .9), t, 1, pan)
    for dt, m in MOTIF: put('string', gm(m, 3.2, v, harm=harm), t + .35 + dt, .8, pan)

# —— the score, cue by cue ——
# 1 open (0–9.6): night; a drone, sparse low strings; one shiver when the strips move with no wind
put('drone', drone(A2, 10.5, .7), 0, 1, 0)
for t, m, v in [(.6, A2, .55), (4.3, E3, .4), (7.4, D3, .45)]: put('string', gm(m, 4, v, vib=(4.5, .2, 1.2)), t, 1, -.2)
put('bell', bells(.25, 1.4), T['stripsMove'], 1, .3)
cues.append(('open: drone + low strings', 0))
# 2 title (9.6–15.6): the flute's long call while the title is written; 큰북 on the seal
put('flute', daegeum(E4, 3.6, .55, bendto=-2), T['titleW'][0], 1, .1)
put('flute', daegeum(A4, 2.6, .45), T['titleW'][0] + 3.3, 1, .1)
put('drum', buk(.7), T['seal1'], 1, 0); put('metal', jing(.35, 98, 5), T['seal1'] + .02, 1, 0)
put('drone', drone(A2, 6.5, .5), 9.6, 1, 0)
cues.append(('title: flute call', T['titleW'][0])); cues.append(('seal: buk + jing', T['seal1']))
# 3 arrive (15.6–33.4): the walk on the beat — 장구 (덩 · 쿵 · 덕), a strolling string line, the motif once
w0, w1 = T['walk']; b = w0; i = 0
while b < w1 - .1:
    k = i % 4
    if k == 0: put('drum', gung(.5), b, 1, -.1); put('drum', chae(.35), b, 1, .1)
    elif k == 2: put('drum', chae(.3), b, 1, .15)
    elif k == 3: put('drum', gung(.3), b + BEAT * .5, 1, -.1)
    b += BEAT; i += 1
LINE = [(0, A3, 2), (2, C4, 1), (3, D4, 2), (5, E4, 3), (8, D4, 1), (9, C4, 2), (11, A3, 3), (14, G3, 1), (15, A3, 4),
        (19, E4, 2), (21, G4, 1), (22, E4, 2), (24, D4, 3), (27, C4, 2), (29, A3, 4)]
for bt, m, l in LINE:
    bend = [(l * BEAT * .55, 0), (l * BEAT * .9, -1)] if m == D4 else None
    vib = (4.8, .3, .35) if m == E4 else None
    put('string', gm(m, l * BEAT + 1.2, .5, bend=bend, vib=vib), w0 + bt * BEAT, .9, -.15)
put('drone', drone(A2, 18.2, .35), 15.6, 1, 0)
motif(w0 + 26 * BEAT, .45)
cues.append(('arrive: 장구 walk + strolling string', w0))
# 4 bell (33.4–41): the bell is real (foley); the music lifts with the strips, then the bloom opens — 큰북 roll + 징
put('flute', daegeum(A4, 3.2, .4, breath=.6), T['lift'], 1, .2)
r0, r1 = T['bloom']; t = r0
while t < r1:
    u = (t - r0) / (r1 - r0); put('drum', buk(.25 + .5 * u), t, 1, -.1); t += .22 - .1 * u
put('metal', jing(.7, 92, 7.5), r1, 1, 0); put('drone', drone(A2 - 2, 13, .7), r0, 1, 0)
cues.append(('bloom: buk roll → jing', r0))
# 5 vision (41–52.8): under the roots — drone, a low flute bending down, far 징
put('flute', daegeum(D4, 4.2, .4, bendto=-2, breath=.55), 42.2, 1, -.2)
put('flute', daegeum(A3 + 12, 3.6, .3, bendto=-1, breath=.6), 46.8, 1, .25)
put('metal', jing(.3, 86, 6), 50.4, 1, .3)
for t, m in [(41.6, A2), (45.0, A2), (48.6, G3 - 12)]: put('string', gm(m, 4, .45), t, 1, -.25)
cues.append(('vision: drone + falling flute', 41.0))
# 6 confront (52.8–63.6): two sides; a slow 큰북 heartbeat, the low string
put('drone', drone(A2, 11.2, .45), 52.8, 1, 0)
t = 53.4
while t < 63.4: put('drum', buk(.35), t, 1, 0); put('drum', buk(.18), t + .32, 1, 0); t += 1.5
for t, m in [(53.0, E3), (56.0, D3), (59.0, C3), (62.0, A2)]: put('string', gm(m, 3.2, .45, vib=(4, .2, .8)), t, 1, -.2)
cues.append(('confront: heartbeat buk', 52.8))
# 7 dig (63.6–74.4): the machine; 큰북 on the beat building; 꽹과리 in at the bite; a 징 at the crack
t = T['engine']; k = 0
while t < SH['dig'][1]:
    u = (t - T['engine']) / (SH['dig'][1] - T['engine'])
    put('drum', buk(.3 + .45 * u), t, 1, 0)
    if t > T['bite']: put('metal', kkwaeng(.35 + .3 * u, open_=(k % 4 == 0)), t, 1, .35); put('drum', chae(.4), t + BEAT * .5, 1, -.2)
    t += BEAT; k += 1
put('metal', jing(.6, 90, 6), T['crack'][0], 1, 0)
put('drone', drone(A2 - 1, 11, .45), 63.6, 1, 0)
cues.append(('dig: buk build, kkwaeng at bite', T['engine'])); cues.append(('crack: jing', T['crack'][0]))
# 8 agwi (74.4–88): the 굿 full: 장구 + 큰북 + 꽹과리 driving (eighths), a low string ostinato, the flute crying; 징 on each strike
t = SH['agwi'][0] + .2; k = 0
while t < T['dead'] - .05:
    s = k % 8
    put('drum', chae(.42 if s in (0, 3, 6) else .22), t, 1, .2)
    if s in (0, 4): put('drum', gung(.6), t, 1, -.2); put('drum', buk(.55), t, 1, 0)
    if s in (2, 6): put('drum', gung(.32), t, 1, -.2)
    put('metal', kkwaeng(.42 if s % 2 == 0 else .22, open_=(s == 0)), t, 1, .4)
    if s == 0: put('string', gm(A2 + (12 if (k // 8) % 2 else 0), 1.6, .55), t, 1, -.3)
    if s == 4: put('string', gm(E3, 1.4, .45), t, 1, -.3)
    t += BEAT / 2; k += 1
for t, m, d, bt in [(76.0, E5, 2.6, -2), (79.4, D5, 2.4, -2), (83.4, A5, 2.0, -3)]: put('flute', daegeum(m, d, .5, bendto=bt, breath=.5), t, 1, .15)
for ts in (T['strike1'], T['strike2']): put('metal', jing(.85, 96, 5), ts, 1, 0); put('drum', buk(1.0), ts, 1, 0)
cues.append(('agwi: full 굿 drive', SH['agwi'][0])); cues.append(('strikes: jing + buk', T['strike1']))
# 9 fail (88–95.9): the bell is dead — the music stops on it; a thin low drone only
put('drone', drone(A2 - 3, 8.2, .5), T['dead'] + .4, 1, 0)
put('string', gm(A2 - 3, 6, .4), T['dead'] + 2.0, 1, -.2)
cues.append(('dead bell: music stops', T['dead']))
# 10 eyes (95.9–100.6): a held breath of flute over one 큰북
put('drum', buk(.55), SH['eyes'][0], 1, 0)
put('flute', daegeum(E4, 4.4, .35, breath=.7), SH['eyes'][0] + .2, 1, 0)
# 11 climb (100.6–113): the 작두 tempo — 장구 slow then faster, the motif rising on the strings, the flute climbing
c0, c1 = SH['climb'][0] + .4, T['hush'][0] - .1; t = c0; k = 0
while t < c1:
    u = (t - c0) / (c1 - c0); put('drum', gung(.35 + .35 * u), t, 1, -.15)
    if k % 2: put('drum', chae(.3 + .3 * u), t, 1, .15)
    if u > .55: put('metal', kkwaeng(.15 + .35 * u, open_=False), t, 1, .35)
    t += BEAT * (1.0 - .55 * u); k += 1
motif(T['climbTilt'][0] + .2, .5)
for k, (m, dt) in enumerate([(A3, 0), (C4, 1.6), (D4, 3.0), (E4, 4.3), (G4, 5.4), (A4, 6.4), (C5, 7.2), (E5, 8.0)]):
    put('string', gm(m, 2.6, .45 + .04 * k), T['climbTilt'][0] + 2.4 + dt, 1, -.1)
put('flute', daegeum(A4, 4.0, .4, breath=.4), T['stand'] - 1.0, 1, .1)
put('flute', daegeum(E5, 2.6, .45, vib=.3), T['stand'] + 2.8, 1, .1)
put('drone', drone(A2, 12.0, .45), SH['climb'][0], 1, 0)
cues.append(('climb: 작두 tempo + motif rising', SH['climb'][0]))
# 12 hush → white (112.4–113.9 silence; 113.9 one 징 + 꽹과리 crash); the god's voice over a deep drone; they sink, the ground closes
put('metal', jing(1.0, 82, 9), T['white'][0], 1, 0); put('drum', buk(1.0), T['white'][0], 1, 0)
put('metal', kkwaeng(.6, True), T['white'][0], 1, .4); put('bell', bells(.7, 1.6), T['white'][0] + .05, 1, -.3)
put('drone', drone(A2 - 12 + 12, 7.5, .8), T['white'][0] + .3, 1, 0)
put('flute', daegeum(A3 + 12, 5.0, .35, breath=.8), T['sink'][0], 1, 0)
t = T['sink'][0]
while t < T['sink'][1]: put('drum', buk(.3), t, 1, 0); t += 1.2
put('drum', buk(.9), T['close'], 1, 0); put('metal', jing(.45, 92, 6), T['close'] + .02, 1, 0)
cues.append(('true silence', T['hush'][0])); cues.append(('flying white: jing', T['white'][0])); cues.append(('ground closes', T['close']))
# 13 dawn (121–137): the walk's line again, slow and in the open; the motif resolved; the flute; the last 징 under the seal
d0 = SH['dawn'][0] + .6
for bt, m, l in [(0, A3, 3), (3, C4, 2), (5, E4, 3), (8, D4, 2), (10, C4, 3), (13, A3, 4), (18, E4, 3), (21, G4, 2), (23, A4, 4)]:
    put('string', gm(m, l * BEAT * 1.3 + 1.5, .5, vib=(4.6, .25, .5) if m == E4 else None), d0 + bt * BEAT * 1.3, 1, -.1)
put('flute', daegeum(E5, 4.0, .35, breath=.35), 124.6, 1, .2)
put('flute', daegeum(A4, 4.5, .35, breath=.35), 129.2, 1, .2)
motif(T['thread'][0] + .3, .4, harm=True)
put('metal', jing(.4, 98, 5), T['seal2'], 1, 0); put('drum', buk(.4), T['seal2'], 1, 0)
put('drone', drone(A2, 16.5, .35), 121.0, 1, 0)
cues.append(('dawn: the line again, slow', 121.0)); cues.append(('seal: buk + jing', T['seal2']))

# —— mix the buses; a little room; the silence; the fade ——
LEV = {'string': 1.0, 'flute': .8, 'drum': .9, 'metal': .75, 'bell': .8, 'drone': .8}
ir = rng.standard_normal(int(1.6 * SR)) * np.exp(-np.arange(int(1.6 * SR)) / (.35 * SR)); ir[:int(.012 * SR)] = 0
ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())   # unit-energy room
def room(x, mix=.22):
    for c in range(2): x[:, c] = x[:, c] + fftconvolve(x[:, c], np.roll(ir, c * 37))[:N] * mix
    return x
pre = room(sum(bus[k] * LEV[k] for k in KEYS)); post = room(sum(late[k] * LEV[k] for k in KEYS))
i0, f = int(T['dead'] * SR), int(.06 * SR)   # the dead bell: everything ringing (and its room) stops on T.dead (a 60 ms cut)
pre[i0 - f:i0] *= np.linspace(1, 0, f)[:, None]; pre[i0:] = 0
out = pre + post
# true silence
h0, h1 = int(T['hush'][0] * SR), int(T['hush'][1] * SR); g = int(.03 * SR)
out[h0 - g:h0] *= np.linspace(1, 0, g)[:, None]; out[h0:h1] = 0
# fade
fa, fb = int(T['fade'][0] * SR), int(DUR * SR)
out[fa:fb] *= np.linspace(1, 0, fb - fa)[:, None] ** 1.5; out[fb:] = 0
out = out[:int(DUR * SR)]
out /= max(1e-9, np.abs(out).max()); out *= .85
with wave.open(os.path.join(HERE, 'music', 'score.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
with open(os.path.join(HERE, 'music', 'CUES.md'), 'w') as fh:
    fh.write('# Score cues (music/score.py)\n\nA 계면조-like pentatonic (A C D E G); the beat is 0.75 s where there is one. True silence for T.hush.\n\n| cue | t |\n|---|---|\n' + ''.join(f'| {a} | {b:.2f} |\n' for a, b in cues))
print('music/score.wav', round(len(out) / SR, 2), 's')
