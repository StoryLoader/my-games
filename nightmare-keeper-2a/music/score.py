#!/usr/bin/env python3
"""score.py — the original score of 「악몽을 지키는 파수꾼 2 — A 할머니의 첫 꿈」, composed here and synthesized in code (no samples, no recordings).
Chamber-fantasy colours from the style's palette: harp and pizzicato bass (physically modelled, the library's pluck.py),
celesta (FM bells), a string pad and a low "ah" choir (additive saws through formant filters), a recorder-like voice,
timpani and a hand drum. D dorian → D major, ♩ = 72; the sections follow TREATMENT.md §소리 and the times in timeline.json. A warm bloom for the
dream, the swarm's turn, a driving catch, a true silence at the decision, a held breath — the bell — and the town waking in D major.

  $LIB/.venv/bin/python music/score.py            → music/score.wav (48 kHz stereo) and music/CUES.md
"""
import json, os, sys, wave
import numpy as np
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, lp, hp, bp, norm, noise, add          # noqa: E402
import pluck as P                                          # noqa: E402
from scipy.signal import butter, sosfilt                   # noqa: E402

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
T, DUR = TL['T'], TL['DUR']
N = int((DUR + 4) * SR); out = np.zeros((N, 2)); bus = {k: np.zeros((N, 2)) for k in ('harp', 'cel', 'pad', 'choir', 'low', 'perc', 'wind')}
BEAT = 60 / 72
rng = np.random.default_rng(5)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
tt = lambda d: np.arange(int(d * SR)) / SR
cues = []

def env_adsr(d, a=.02, r=.3):
    n = int(d * SR); e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e

# —— instruments ——
def harp(m, vel=.6): return P.pluck('harp', m, None, vel)
def pizz(m, vel=.7): return P.pluck('upright_bass_pizz', m, None, vel)
def celesta(m, d=2.2, vel=.7):
    x = tt(d); f = hz(m); mod = np.sin(2 * np.pi * f * 3.5 * x) * 2.2 * np.exp(-x * 9)
    y = np.sin(2 * np.pi * f * x + mod) * np.exp(-x * 2.6) + .3 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x * 7)
    y[:48] *= np.linspace(0, 1, 48); return y * vel * .22
def saw_stack(m, d, det=(-.07, 0, .06), top=4200):
    x = tt(d); y = np.zeros(len(x)); f0 = hz(m)
    for c in det:
        f = f0 * 2 ** (c / 12); ph = rng.random() * 6.28; vib = .002 * np.sin(2 * np.pi * 5.2 * x + ph)
        for k in range(1, int(top / f) + 1): y += np.sin(2 * np.pi * f * k * x * (1 + vib) + ph * k) / k
    return y / len(det)
def strings(m, d, vel=.5, trem=0):
    y = lp(saw_stack(m, d), 2600) * env_adsr(d, .9, 1.2)
    if trem: y *= .7 + .3 * np.sin(2 * np.pi * trem * tt(d))
    return y * vel * .08
FORM = [(700, 1.0, 80), (1150, .55, 90), (2600, .25, 120)]
def choir(m, d, vel=.5):
    s = saw_stack(m, d, det=(-.12, -.04, .05, .11), top=5000); y = np.zeros(len(s))
    for f, a, bw in FORM: y += a * bp(s, f - bw, f + bw, 2)
    return y * env_adsr(d, 1.4, 1.6) * vel * .55
def recorder(m, d, vel=.5):
    x = tt(d); f = hz(m); vib = 1 + .006 * np.sin(2 * np.pi * 5 * x) * np.minimum(1, x / .4)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; y = np.sin(ph) + .25 * np.sin(2 * ph) + .08 * np.sin(3 * ph)
    y += bp(noise(d), 1500, 4500) * .04
    return y * env_adsr(d, .06, .18) * vel * .12
def timp(m=38, vel=.7):
    x = tt(2.4); f = hz(m) * (1 + .05 * np.exp(-x * 20)); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.6)
    y += lp(noise(2.4), 300) * np.exp(-x * 14) * .4; return y * vel * .5
def drum(vel=.6):
    x = tt(.5); y = np.sin(2 * np.pi * (110 * np.exp(-x * 9) + 70) * x) * np.exp(-x * 11) + bp(noise(.5), 600, 2500) * np.exp(-x * 40) * .5
    return y * vel * .45

def put(b, x, t, g=1.0, pan=0.0): add(bus[b], x.astype(np.float64), t, g, pan)

# —— harmony: D dorian cycle and the major turn at the end ——
DOR = [[50, 53, 57, 60, 64], [45, 52, 55, 60, 64], [43, 50, 55, 59, 62], [48, 52, 55, 59, 64]]   # Dm9 · Am7 · G · Cmaj7
MAJ = [[50, 54, 57, 61, 64], [47, 54, 57, 59, 66], [43, 50, 55, 59, 61], [45, 52, 57, 61, 64]]   # D(add9) · Bm · G(add#11) · A
MOTIF = [74, 77, 81, 79, 76]          # D5 F5 A5 G5 E5 — the keeper's motif
MOTIF_MAJ = [74, 78, 81, 79, 76]      # D5 F#5 A5 G5 E5

def arps(t0, t1, prog, rate=2, vel=.45, bars_per=1, oct=12, bus_='harp'):
    """harp arpeggio from t0 to t1, `rate` notes per beat"""
    k, t = 0, t0
    while t < t1 - .05:
        bar = int((t - t0) / (4 * BEAT * bars_per)); ch = prog[bar % len(prog)]; pat = [0, 2, 1, 3, 4, 3, 1, 2]
        m = ch[pat[k % 8] % len(ch)] + oct; put(bus_, harp(m, vel * (1 if k % rate == 0 else .8)), t, 1, -.25 + .5 * ((k % 8) / 7))
        k += 1; t += BEAT / rate

def pads(t0, t1, prog, inst, vel=.5, bars_per=1, oct=0, trem=0):
    t, bar = t0, 0
    while t < t1 - .1:
        d = min(4 * BEAT * bars_per, t1 - t) + .8; ch = prog[bar % len(prog)]
        for i, m in enumerate(ch[1:]):
            m2 = m + oct
            if m2 < 48: m2 += 12          # no pad notes below MIDI 48 (low-end balance)
            put('pad' if inst == 'strings' else 'choir', strings(m2, d, vel, trem) if inst == 'strings' else choir(m2, d, vel), t, 1, -.4 + .8 * i / 3)
        t += 4 * BEAT * bars_per; bar += 1

def bassline(t0, t1, prog, vel=.6, every=1, bars_per=1):
    t, k = t0, 0
    while t < t1 - .05:
        bar = int((t - t0) / (4 * BEAT * bars_per)); ch = prog[bar % len(prog)]; m = ch[0] - 12 if ch[0] >= 48 else ch[0]
        put('low', pizz(m if k % 2 == 0 else m + 7, vel), t); t += BEAT * every; k += 1

def motif(t0, notes, inst='cel', step=None, vel=.7, oct=0):
    step = step or BEAT
    for i, m in enumerate(notes):
        if inst == 'cel': put('cel', celesta(m + oct, 2.4, vel), t0 + i * step, 1, .15)
        else: put('cel', recorder(m + oct - 12, step * .95, vel), t0 + i * step, 1, -.1)

SH = {s['id']: (s['a'], s['b']) for s in TL['SHOTS']}
EVS = json.load(open(os.path.join(HERE, 'events.json')))['ev']
BELLM = [74, 69]      # the bell motif: a falling fourth (D5 → A4), planted on the harp when the rope is shown

# A — 0 → 9: the first good dream: a celesta bloom in D major, a soft string pad
put('pad', strings(62, 9.5, .22) + strings(66, 9.5, .18) + strings(69, 9.5, .16), .3)
for j, m in enumerate([62, 66, 69, 74, 78, 81]): put('cel', celesta(m + 12, 3.0, .55 - .05 * j), T['bloom'] + j * .11, 1, -.4 + .16 * j)
for k, m in enumerate([74, 78, 81, 79, 76]): put('harp', harp(m - 12, .3), 3.2 + k * BEAT * 1.4, 1, .15)
cues.append(('the dream blooms', T['bloom']))
# B — 9 → 18.4: the map: unease (dorian drone, sparse harp); the swarm turns (tremolo swell, low hit)
put('low', lp(saw_stack(38, 10, det=(-.05, .05), top=600), 220) * env_adsr(10, 2, 2) * .05, 9.0)
arps(9.2, 15.0, [[50, 53, 57, 60, 64], [46, 53, 57, 62, 65]], rate=1, vel=.26)
pads(13.2, 18.6, [[50, 53, 56, 60, 63]], 'strings', vel=.28, bars_per=2, trem=9)
put('perc', timp(38, .35), T['turn']); put('low', pizz(38, .7), T['turn']); cues.append(('the swarm turns', T['turn']))
# C — 18.4 → 24.4: the title: the keeper's motif on celesta over tremolo, dark choir
pads(18.4, 24.6, [[50, 53, 57, 60, 63]], 'choir', vel=.3, bars_per=2, oct=-12)
motif(19.2, MOTIF, 'cel', vel=.7); cues.append(('title motif', 19.2))
# D — 24.4 → 42: waiting: a pulse (pizzicato), a repeated harp note, low pad; the bell motif when the rope is shown
bassline(24.4, 42.0, [[50, 53, 57, 60, 64], [48, 52, 55, 60, 64]], vel=.4, every=2)
pads(24.4, 34.2, [[50, 53, 57, 60, 64], [46, 53, 57, 62, 65]], 'strings', vel=.22)
t = 24.6
while t < 34.0: put('harp', harp(62, .22), t, 1, .25); t += BEAT
pads(34.0, 42.2, [[43, 50, 55, 58, 62], [45, 52, 57, 60, 64]], 'strings', vel=.24)
for k, m in enumerate(BELLM): put('harp', harp(m, .45), 36.2 + k * BEAT * 1.5, 1, 0); put('harp', harp(m - 12, .3), 36.2 + k * BEAT * 1.5)
for k, m in enumerate(BELLM): put('cel', celesta(m + 12, 2.4, .3), 40.0 + k * BEAT * 1.5, 1, .2)
cues.append(('bell motif (plant)', 36.2))
# E — 42 → 55: the catch: driving eighths, hand drum, rising harp; a celesta swirl down on every wave
bassline(42.2, 55.0, DOR, vel=.55, every=.5)
for k in range(int((55 - 42.2) / BEAT)):
    t = 42.2 + k * BEAT; put('perc', drum(.55 if k % 2 else .7), t, 1, -.2)
    if k % 2: put('perc', drum(.3), t + BEAT / 2, 1, .2)
arps(42.2, 55.0, DOR, rate=2, vel=.38, oct=12)
for c in T['collect']:
    for j, m in enumerate([93, 89, 86, 81, 77, 74]): put('cel', celesta(m, 1.4, .4), c - .9 + j * .08, 1, .4 - .14 * j)
pads(50.0, 55.2, [[50, 53, 57, 62, 63]], 'strings', vel=.3, bars_per=2, trem=9)
cues.append(('the catch', 42.2))
# F — 55 → 66: pressure: tremolo, harp repeats faster and faster; a hit at the catch, then held breath
pads(55.0, 66.2, [[50, 53, 56, 60, 63], [50, 53, 57, 60, 63]], 'strings', vel=.3, bars_per=1, trem=10)
pads(55.0, 66.2, [[38, 50, 53, 57, 60]], 'choir', vel=.28, bars_per=3, oct=-12)
t = 55.4
while t < T['dive'] - .1:
    u = (t - 55.4) / (T['dive'] - 55.4); put('harp', harp(63 if int(t * 3) % 2 else 62, .28 + .25 * u), t, 1, .2); t += BEAT * (1 - .72 * u)
HIT = T['catch'] + .3   # just after his "안 돼!"
put('perc', timp(38, .5), HIT); put('low', pizz(38, .8), HIT); cues.append(('the catch (hit)', HIT))
t = HIT + .8
while t < 66.0: put('harp', harp(62, .2), t, 1, .25); t += BEAT * .75
# G — 66 → 80.4: the decision: low choir; SILENCE (only the glass); one harp note when he looks up; the walk swells; a held breath
pads(66.0, 68.8, [[38, 50, 53, 57, 60]], 'choir', vel=.3, bars_per=2, oct=-12)
put('harp', harp(74, .5), T['lookUp'], 1, 0); put('cel', celesta(86, 3.0, .35), T['lookUp'] + .05); cues.append(('one note: he looks up', T['lookUp']))
put('pad', strings(62, T['pull'] + .2 - 75.4, .3) * np.linspace(.2, 1, int(round((T['pull'] + .2 - 75.4) * SR)))[:len(tt(T['pull'] + .2 - 75.4))], 75.4)
put('pad', strings(69, T['pull'] + .2 - 75.4, .26) * np.linspace(.2, 1, int(round((T['pull'] + .2 - 75.4) * SR)))[:len(tt(T['pull'] + .2 - 75.4))], 75.4)
t = 75.6
while t < T['pull']: u = (t - 75.6) / (T['pull'] - 75.6); put('perc', timp(38, .12 + .25 * u), t); t += .6 - .35 * u
cues.append(('silence (decision)', 68.8)); cues.append(('held breath', T['pull'] + .2))
# H — 80.45 → 99: the bell, then the town wakes: a wide D major (choir, strings, harp, pizz); a celesta note on every window
B0 = T['bell']
pads(B0 + .05, 99.2, MAJ, 'strings', vel=.42)
pads(B0 + .05, 99.2, MAJ, 'choir', vel=.32, oct=-12)
arps(B0 + 3.0, 98.8, MAJ, rate=2, vel=.36, oct=12)
bassline(B0 + 3.0, 98.8, MAJ, vel=.5, every=1)
motif(88.2, MOTIF_MAJ, 'rec', step=BEAT, vel=.55); motif(92.6, MOTIF_MAJ, 'cel', vel=.55, oct=12)
PENT = [74, 76, 78, 81, 83, 86, 88, 90]
for k, e in enumerate(sorted([e for e in EVS if e['type'] == 'winLight'], key=lambda e: e['t'])): put('cel', celesta(PENT[k % 8] + (12 if k >= 8 else 0), 1.8, .36), e['t'] + .03, 1, e.get('pan', 0) * .6)
cues.append(('the town wakes', B0))
# I — 99 → 106.4: quiet again; a little comic pizzicato after each snore
pads(99.2, 106.6, [MAJ[0], MAJ[2]], 'strings', vel=.2, bars_per=2)
for s in T['snores']: put('low', pizz(50, .45), s + 1.15); put('low', pizz(45, .4), s + 1.45)
for k, m in enumerate([74, 78, 81]): put('harp', harp(m, .3), 99.8 + k * BEAT * 2, 1, .1)
# J — 106.4 → 121: dawn lullaby (3/4 harp, the motif slowly), the last chord
L = BEAT * 1.15
k, t = 0, 106.6
LUL = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]]
while t < 119.6:
    ch = LUL[int((t - 106.6) / (3 * L)) % 4]; m = [ch[0], ch[2], ch[3]][k % 3] + 12
    put('harp', harp(m, .3 if k % 3 else .36), t, 1, -.2 + .2 * (k % 3)); k += 1; t += L
pads(106.6, 120.6, LUL, 'strings', vel=.24, bars_per=1)
motif(111.0, MOTIF_MAJ, 'cel', step=BEAT * 1.4, vel=.45)
for j, m in enumerate([74, 81, 86, 90]): put('cel', celesta(m, 4.0, .45 - .05 * j), 118.6 + j * .14, 1, -.2 + .15 * j)
cues.append(('dawn lullaby', 106.6))

# —— silences: the decision (only the glass), and the held breath before the bell ——
def gate(a, b, fade_out=.05, fade_in=.6, keep=('wind',)):
    i0, i1 = int(a * SR), int(b * SR); f0 = max(1, int(fade_out * SR)); f1 = max(1, int(fade_in * SR))
    for k, B in bus.items():
        if k in keep: continue
        B[i0:i0 + f0] *= np.linspace(1, 0, f0)[:, None]; B[i0 + f0:i1] = 0; B[i1:i1 + f1] *= np.linspace(0, 1, f1)[:, None]
gate(68.8, T['lookUp'] - .02, fade_out=.5, fade_in=.02)
gate(T['pull'] + .25, B0, fade_out=.12, fade_in=.01)

LEV = {'harp': 1.0, 'cel': .9, 'pad': 1.0, 'choir': .9, 'low': .9, 'perc': .9, 'wind': 1}
for k, B in bus.items(): out += B * LEV[k]
for c in range(2): out[:, c] = out[:, c] - .35 * lp(out[:, c], 110)
out = out[:int(DUR * SR)]
fo = int((DUR - T['fadeOut'][0]) * SR); out[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
out /= max(1e-9, np.abs(out).max()); out *= .8
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
with wave.open(os.path.join(HERE, 'music', 'score.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
with open(os.path.join(HERE, 'music', 'CUES.md'), 'w') as f:
    f.write('# Score cues (music/score.py)\n\nD dorian → D major, ♩ = 72. Times in seconds, from timeline.json.\n\n| cue | t |\n|---|---|\n' + ''.join(f'| {a} | {b:.2f} |\n' for a, b in cues))
print('music/score.wav', round(len(out) / SR, 2), 's')
