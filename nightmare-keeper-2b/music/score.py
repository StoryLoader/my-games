#!/usr/bin/env python3
"""score.py — the original score of 「악몽을 지키는 파수꾼 2 — 열두 번째 등불」, composed here and synthesized in code (no samples, no recordings).
Chamber-fantasy colours from the style's palette: harp and pizzicato bass (physically modelled, the library's pluck.py),
celesta (FM bells), a string pad and a low "ah" choir (additive saws through formant filters), a recorder-like voice,
timpani and a hand drum. D dorian → D major, ♩ = 72; the sections follow TREATMENT.md §6 and the times in timeline.json. Film 1's keeper motif
for the counting; a chromatic celesta riddle for the empty lantern; a pizzicato clock for the watching nights; silence before the
bell; a low scare under the huge shadow; one harp note at the reveal; a warm D-major waltz (3/4) for the dog's shadow; a lullaby.

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

RIDDLE = [81, 80, 79, 78, 83, 82]            # A5 G#5 G5 F#5 B5 A#5 — the riddle of the empty lantern (chromatic)
def notes(t0, seq, inst='cel', vel=.6, step=BEAT, oct=0, pan=.15, d=2.4):
    t = t0
    for m, b in seq:
        if m is not None:
            if inst == 'cel': put('cel', celesta(m + oct, d, vel), t, 1, pan)
            elif inst == 'harp': put('harp', harp(m + oct, vel), t, 1, pan)
            else: put('cel', recorder(m + oct - 12, b * step * .95, vel), t, 1, -.1)
        t += b * step
    return t
def clock(t0, t1, every, m=(38, 45), vel=.4):   # a pizzicato clock: tick (root) / tock (fifth)
    k, t = 0, t0
    while t < t1 - .05: put('low', pizz(m[k % 2], vel * (1 if k % 2 == 0 else .8)), t, 1, -.15 + .3 * (k % 2)); k += 1; t += every
def waltz(t0, t1, prog, vel=.34, bar=3 * BEAT * .92, melody=None, mvel=.55):
    k, t = 0, t0
    while t < t1 - .1:
        ch = prog[int((t - t0) / bar) % len(prog)]; i = k % 3
        if i == 0: put('low', pizz(ch[0] - 12 if ch[0] >= 48 else ch[0], vel * 1.2), t)
        else: [put('harp', harp(m + 12, vel * .8), t, 1, -.2 + .4 * j) for j, m in enumerate(ch[1:3])]
        k += 1; t += bar / 3
    if melody: notes(t0 + bar, melody, 'cel', vel=mvel, step=bar / 3)

# A — 0 → 10.6: dawn, counting: a lone harp, a little uneasy; the riddle when the empty lantern is seen
put('low', lp(saw_stack(38, 11, det=(-.05, .05), top=600), 220) * env_adsr(11, 2.0, 3) * .045, 0)
for k, m in enumerate([62, 65, 69, 65]): put('harp', harp(m, .32), .7 + k * BEAT * 1.15, 1, .1)
notes(4.6, [(m, .75) for m in RIDDLE[:4]], 'cel', vel=.55, d=2.0); cues.append(('riddle (empty lantern)', 4.6))
pads(5.0, 10.8, [[50, 53, 57, 60, 63]], 'strings', vel=.2, bars_per=2)
# B — 10.6 → 16.6: the title: the riddle in full over a low drone
put('low', lp(saw_stack(38, 7, det=(-.05, .05), top=700), 240) * env_adsr(7, 1.0, 2.0) * .06, 10.4)
notes(11.0, [(m, .75) for m in RIDDLE] + [(74, 2)], 'cel', vel=.7); cues.append(('title riddle', 11.0))
pads(11.0, 16.6, [[50, 53, 56, 60, 63]], 'strings', vel=.24, bars_per=2)
# C — 16.6 → 22.6: he decides: pizzicato steps up, a harp answer
for k, m in enumerate([50, 53, 57, 62]): put('low', pizz(m - 12, .45), 17.0 + k * BEAT * .75)
for k, m in enumerate([74, 77, 81]): put('harp', harp(m, .36), 19.6 + k * BEAT * .5, 1, .2)
# D — 22.6 → 39: the first night: the pizzicato clock (waiting), a thin pad; the blink stops it; the click: a celesta stab
clock(22.9, T['blink'] - .05, BEAT, vel=.34)
pads(22.6, T['blink'], [[50, 53, 57, 60, 64], [46, 53, 57, 62, 65]], 'strings', vel=.2, bars_per=2)
for k, t in enumerate([27.0, 30.4]): notes(t, [(m, .75) for m in RIDDLE[:3]], 'cel', vel=.35, oct=-12 if k else 0, d=1.8)
for j, m in enumerate([75, 81, 86]): put('cel', celesta(m, 2.0, .6), T['click1'] + .08 + j * .03, 1, -.2 + .2 * j)
cues.append(('the click (night 1)', T['click1']))
pads(T['click1'] + .3, 39.0, [[50, 53, 56, 60, 63]], 'strings', vel=.22, bars_per=2, trem=7)
# E — 39 → 45: the second night: the clock a little faster, harp eighths; 45 → 55 the morning: footprints, the scratch
clock(39.4, 44.9, BEAT * .75, vel=.36)
arps(39.4, 44.9, DOR[:2], rate=2, vel=.28)
notes(46.4, [(m, .75) for m in RIDDLE[:4]], 'cel', vel=.5); notes(T['scratch'] - .1, [(81, .5), (80, .5), (85, 2)], 'cel', vel=.6); cues.append(('the same lantern', T['scratch']))
pads(45.2, 55.0, [[50, 53, 57, 62, 64]], 'strings', vel=.2, bars_per=3)
# F — 55 → 60.4: the third night, setting the trap: a harp ostinato over the clock, quicker still; then silence
clock(55.3, 60.4, BEAT * .5, vel=.36)
t = 55.4
while t < 60.3: put('harp', harp(62 if int((t - 55.4) / (BEAT * .5)) % 2 else 63, .28), t, 1, .2); t += BEAT * .5
cues.append(('silence (hiding)', 60.4))
put('low', lp(saw_stack(37, 8.6, det=(-.04, .04), top=400), 160) * env_adsr(8.6, 2.5, 1.0) * .03, 60.6)   # a held breath, barely there
# G — the light: a low hit and a dissonant swell under the huge wings; it falls as the shadow shrinks; one harp note at the cut
put('perc', timp(33, .5), T['uncover']); put('low', lp(saw_stack(26, 4, det=(-.1, .1), top=500), 300) * env_adsr(4, .05, 2.4) * .11, T['uncover'])
for m in (50, 51, 56): put('pad', strings(m + 12, 3.6, .26, trem=11), T['uncover'] + .05)
pads(T['standUp'], 74.4, [[50, 53, 57, 62, 64]], 'strings', vel=.22, bars_per=2)
put('harp', harp(74, .55), 74.55, 1, 0); cues.append(('reveal: one harp note', 74.55))
# H — 74.5 → 88: 봄이 and her dog: celesta and strings, tender (D major with a minor colour)
pads(75.0, 88.4, [[50, 54, 57, 62, 64], [47, 54, 57, 62, 66], [43, 50, 55, 58, 62], [45, 52, 57, 61, 64]], 'strings', vel=.24, bars_per=1)
notes(T['vision'] + .2, [(81, 1), (78, 1), (76, 1), (74, 2), (None, 1), (78, 1), (76, 1), (73, 1), (74, 3)], 'cel', vel=.42, step=BEAT * 1.1)
# I — the decision: a silence; one harp note when the lantern touches the floor; the waltz with the dog's shadow
cues.append(('silence (decision)', 88.6))
put('harp', harp(74, .5), T['setDown'] + .05, 1, 0); put('harp', harp(81, .4), T['setDown'] + .5, 1, .2)
WALTZ_P = [[50, 57, 62, 66], [45, 57, 61, 64], [47, 54, 59, 62], [43, 55, 59, 62]]
WALTZ_M = [(81, 2), (78, 1), (79, 2), (76, 1), (78, 2), (74, 1), (76, 3), (81, 2), (83, 1), (85, 2), (81, 1), (86, 3), (None, 3)]
waltz(T['dogShadow'][0] - .3, 101.0, WALTZ_P, vel=.32, melody=WALTZ_M, mvel=.5); cues.append(('waltz (the dog)', T['dogShadow'][0]))
# J — 101 → 120: dawn, the lullaby (slower waltz, a recorder answers); a two-note button when 노을 opens her eye
waltz(101.2, 118.6, WALTZ_P, vel=.24, bar=3 * BEAT * 1.15, melody=[(m - 12 if m else None, b) for m, b in WALTZ_M[:7]], mvel=.36)
notes(108.0, [(74, 1.5), (78, 1.5), (81, 3)], 'rec', vel=.4, step=BEAT)
pads(101.2, 119.0, [[50, 57, 62, 66], [45, 57, 61, 64]], 'strings', vel=.18, bars_per=2)
put('cel', celesta(86, 2.4, .5), T['eyeOpen'] + .1, 1, .2); put('cel', celesta(90, 2.4, .4), T['eyeOpen'] + .35, 1, .3)
for j, m in enumerate([74, 81, 86]): put('cel', celesta(m, 4.0, .4 - .05 * j), 117.6 + j * .14, 1, -.2 + .15 * j)

# —— the silences: hiding (60.4 → the bell), the decision (88.6 → set down) ——
def gate(a, b, fade_out=.05, fade_in=.6, keep=('wind', 'low')):
    i0, i1 = int(a * SR), int(b * SR); f0 = max(1, int(fade_out * SR)); f1 = max(1, int(fade_in * SR))
    for k, B in bus.items():
        if k in keep: continue
        B[i0:i0 + f0] *= np.linspace(1, 0, f0)[:, None]; B[i0 + f0:i1] = 0; B[i1:i1 + f1] *= np.linspace(0, 1, f1)[:, None]
gate(60.45, T['uncover'] - .02, fade_out=.6, fade_in=.02)
gate(88.6, T['setDown'], fade_out=1.0, fade_in=.02)
gate(T['blink'] - .02, T['click1'] + .05, fade_out=.1, fade_in=.02, keep=())

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
    f.write('# Score cues (music/score.py)\n\nD minor/dorian → D major, ♩ = 72. Times in seconds, from timeline.json.\n\n| cue | t |\n|---|---|\n' + ''.join(f'| {a} | {b:.2f} |\n' for a, b in cues))
print('music/score.wav', round(len(out) / SR, 2), 's')
