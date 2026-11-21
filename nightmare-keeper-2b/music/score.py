#!/usr/bin/env python3
"""score.py — the original score of 「악몽을 지키는 파수꾼 2 — 반딧불의 밤」, composed here and synthesized in code (no samples, no recordings).
Chamber-fantasy colours from the style's palette: harp and pizzicato bass (physically modelled, the library's pluck.py),
celesta (FM bells), a string pad and a low "ah" choir (additive saws through formant filters), a recorder-like voice,
timpani and a hand drum. D dorian → D major, ♩ = 72; the sections follow TREATMENT.md §6 and the times in timeline.json. Film 1's keeper motif
on a lone harp; a new firefly theme (celesta, D major) born out of the silence at the crack.

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

FF = [(81, 1), (86, 1), (85, .5), (83, .5), (81, 1), (78, 1), (83, 1), (81, 2)]            # the firefly theme (D major)
FF_ANS = [(81, 1), (86, 1), (88, .5), (86, .5), (85, 1), (81, 1), (83, .5), (85, .5), (86, 2)]
def theme(t0, notes, inst='cel', vel=.7, oct=0, beat=BEAT, pan=.15):
    t = t0
    for m, b in notes:
        if inst == 'cel': put('cel', celesta(m + oct, 2.6, vel), t, 1, pan)
        elif inst == 'rec': put('cel', recorder(m + oct - 12, b * beat * .95, vel), t, 1, -.1)
        else: put('harp', harp(m + oct, vel), t, 1, pan)
        t += b * beat
    return t

# A — 0 → 13.8: alone at the tower door. The keeper's motif on a single harp, slow and careful; the title on celesta
put('low', lp(saw_stack(38, 14.5, det=(-.05, .05), top=600), 220) * env_adsr(14.5, 2.5, 3) * .05, 0)
arps(1.6, 7.6, DOR[:2], rate=1, vel=.3)
for k, m in enumerate(MOTIF): put('harp', harp(m - 12, .42), 3.0 + k * BEAT * 1.25, 1, .2)
pads(7.5, 13.9, DOR[2:], 'strings', vel=.26)
motif(8.35, MOTIF, 'cel', vel=.75); cues.append(('title motif (celesta)', 8.35))
arps(8.35, 13.6, DOR[2:] + DOR[:1], rate=1, vel=.24)
# B — 13.8 → 23: the tower room, last night's nightmares asleep on the shelf: string pad and sparse harp, hushed
pads(13.9, 23.2, [DOR[0], DOR[3]], 'strings', vel=.22, bars_per=2)
for k, m in enumerate([62, 69, 65, 64, 62, 60, 62, 57]):
    put('harp', harp(m, .3), 14.6 + k * BEAT * 1.4, 1, -.15 + .04 * k)
# C — 23 → 34: the round: harp in eighths, pizzicato, the lantern fills; a celesta pair on each lift
arps(23.4, 34.0, DOR, rate=2, vel=.36)
bassline(23.4, 34.0, DOR, vel=.5, every=2)
for c in T['collect']: put('cel', celesta(86, 1.6, .45), c + .35, 1, .3); put('cel', celesta(93, 1.2, .28), c + .6, 1, -.3)
motif(29.9, MOTIF, 'rec', step=BEAT, vel=.5)
cues.append(('the round', 23.4))
# D — 34 → 41.3: the lantern is full: tremolo strings, the harp repeating faster, a dark choir; it stops at the crack
pads(34.0, T['crack'], [[50, 53, 57, 60, 63], [50, 53, 56, 60, 63]], 'choir', vel=.26, bars_per=1, oct=-12)
pads(35.0, T['crack'], [[50, 53, 57, 62, 63]], 'strings', vel=.26, bars_per=3, trem=9)
t = 34.6
while t < T['crack'] - .1:
    u = (t - 34.6) / (T['crack'] - 34.6); put('harp', harp(62 + (1 if int(t * 3) % 2 else 0), .3 + .28 * u), t, 1, .2); t += BEAT * (1 - .75 * u)
t = 38.4
while t < T['crack'] - .05:
    u = (t - 38.4) / (T['crack'] - 38.4); put('perc', timp(38, .05 + .2 * u ** 1.5), t); t += .2 - .1 * u
bassline(34.0, T['crack'], [DOR[0]], vel=.45, every=1)
cues.append(('silence (crack)', T['crack']))
# E — the palm: silence; a thin warm pad as the light reaches the moth; ONE celesta note when it turns into a firefly
put('pad', strings(62, 4.2, .2) + strings(66, 4.2, .16) + strings(69, 4.2, .14), 48.6)
put('pad', strings(62, 3.2, .1) * np.linspace(.4, 1, int(3.2 * SR)), T['transform'] - 3.1)
put('cel', celesta(86, 4.0, .85), T['transform'], 1, 0); cues.append(('the first firefly: one note', T['transform']))
# F — the firefly theme: celesta alone, then harp (D major) as it flies home; a bell-chord when its window turns gold
theme(T['flyOff'] - .4, FF, 'cel', vel=.7)
arps(T['flyOff'] + .8, 62.6, MAJ, rate=1, vel=.28, oct=12)
pads(55.0, 62.8, MAJ[:2], 'strings', vel=.24)
for j, m in enumerate([74, 78, 81, 86]): put('cel', celesta(m, 2.4, .45), T['homeArrive'] + .05 + j * .09, 1, -.3 + .2 * j)
cues.append(('home window gold', T['homeArrive']))
# G — 62.5 → 68.5: the decision: harp and strings hold under his line, a lift into the release
pads(62.6, 68.6, [MAJ[2], MAJ[3]], 'strings', vel=.26, bars_per=1)
for k, m in enumerate([62, 66, 69, 74, 73, 69, 71, 73]): put('harp', harp(m, .32), 62.8 + k * BEAT * .9, 1, .15)
put('cel', celesta(81, 2.4, .5), T['openDoor'] + .1); put('cel', celesta(86, 2.4, .4), T['openDoor'] + .35)
# H — 68.5 → 85.6: the release: the theme broadens: harp 8ths, pizzicato, strings, choir; every window a celesta note
arps(68.6, 85.4, MAJ, rate=2, vel=.34, oct=12)
bassline(68.6, 85.4, MAJ, vel=.48, every=1)
pads(68.6, 85.6, MAJ, 'strings', vel=.34)
pads(76.2, 85.6, MAJ, 'choir', vel=.28, oct=-12)
theme(76.4, FF, 'rec', vel=.55); theme(76.4 + 8 * BEAT, FF_ANS, 'cel', vel=.6)
PENT = [74, 76, 78, 81, 83, 86, 88, 90]
for k, w in enumerate([e for e in json.load(open(os.path.join(HERE, 'events.json')))['ev'] if e['type'] == 'winGold' and e['t'] > 65]):
    put('cel', celesta(PENT[k % len(PENT)] + (12 if k >= 8 else 0) - (12 if k >= 12 else 0), 1.8, .38), w['t'] + .04, 1, w.get('pan', 0) * .6)
cues.append(('release: theme broadens', 68.6))
# I — 85.6 → 87.5 a breath (gate); then the tower: the shelf opens lantern by lantern (rising celesta), gold swell
SHO = [e['t'] for e in json.load(open(os.path.join(HERE, 'events.json')))['ev'] if e['type'] == 'shelfOpen']
SC = [74, 76, 78, 81, 83]
for k, t in enumerate(SHO): put('cel', celesta(SC[k % 5] + 12 * (k // 5 % 3), 1.6, .32 + .12 * (k / len(SHO))), t + .02, 1, -.5 + (k % 5) * .25)
pads(87.6, 97.2, [MAJ[0], MAJ[2], MAJ[3], MAJ[0]], 'strings', vel=.36, bars_per=1)
pads(88.6, 97.2, [MAJ[0], MAJ[1]], 'choir', vel=.34, bars_per=2, oct=-12)
arps(92.2, 97.0, MAJ, rate=2, vel=.3, oct=24)
put('perc', timp(38, .22), 87.6); put('perc', timp(45, .16), 93.95)
cues.append(('shelf opens', SHO[0]))
# J — 97 → 104: she wakes among them: harp alone with a high string; the keeper's motif in major, slow
pads(97.2, 104.2, [MAJ[0]], 'strings', vel=.2, bars_per=2, oct=12)
for k, m in enumerate(MOTIF_MAJ): put('harp', harp(m, .36), 97.6 + k * BEAT * 1.3, 1, -.1)
# K — 104 → 120: dawn, the lullaby: 3/4 harp, celesta theme slowly, recorder answers, the last chord on the fade
L = BEAT * 1.15
k, t = 0, 104.3
LUL = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]]
while t < 118.6:
    ch = LUL[int((t - 104.3) / (3 * L)) % 4]; m = [ch[0], ch[2], ch[3]][k % 3] + 12
    put('harp', harp(m, .3 if k % 3 else .36), t, 1, -.2 + .2 * (k % 3)); k += 1; t += L
pads(104.3, 118.9, LUL, 'strings', vel=.24, bars_per=1)
theme(110.0, [(m - 12, b * 1.15) for m, b in FF], 'cel', vel=.48)
motif(115.4, MOTIF_MAJ, 'rec', step=BEAT * 1.4, vel=.42)
for j, m in enumerate([74, 81, 86, 90]): put('cel', celesta(m, 4.0, .45 - .05 * j), 118.2 + j * .14, 1, -.2 + .15 * j)
cues.append(('lullaby', 104.3))

# —— silences: the crack (everything stops, a tail stays) and the breath before the shelf ——
def gate(a, b, fade_out=.05, fade_in=.6, keep=('wind',)):
    i0, i1 = int(a * SR), int(b * SR); f0 = max(1, int(fade_out * SR)); f1 = max(1, int(fade_in * SR))
    for k, B in bus.items():
        if k in keep: continue
        B[i0:i0 + f0] *= np.linspace(1, 0, f0)[:, None]; B[i0 + f0:i1] = 0; B[i1:i1 + f1] *= np.linspace(0, 1, f1)[:, None]
tail = sum(bus[k][int(T['crack'] * SR) - int(1.2 * SR):int(T['crack'] * SR)] for k in ('choir', 'pad', 'harp'))
gate(T['crack'], 48.6, fade_out=.04, fade_in=.05)
gate(85.5, 87.55, fade_out=.9, fade_in=.05)
rv = np.zeros((int(4 * SR), 2)); ir = rng.standard_normal(int(3.5 * SR)) * np.exp(-np.arange(int(3.5 * SR)) / (1.0 * SR))
for c in range(2): rv[:, c] = np.convolve(tail[:, c], ir)[:len(rv)] * .003
add(bus['pad'], rv[:, 0], T['crack'], 1, -.3); add(bus['pad'], rv[:, 1], T['crack'], 1, .3)

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
