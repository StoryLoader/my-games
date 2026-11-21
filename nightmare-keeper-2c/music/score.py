#!/usr/bin/env python3
"""score.py — the original score of 「악몽을 지키는 파수꾼 2 — C 칠십 년 치 꿈」, composed here and synthesized in code (no samples, no recordings).
Chamber-fantasy colours from the style's palette: harp and pizzicato bass (physically modelled, the library's pluck.py),
celesta (FM bells), a string pad and a low "ah" choir (additive saws through formant filters), a recorder-like voice,
timpani and a hand drum. D major; the theme is a waltz for the fish in a top hat (3/4, a bar = 1.26 s), heard playful, comic, grand over the town,
then slow and tender for the keeper's own dream; film 1's keeper motif returns at dawn. Times from timeline.json.

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
tt = lambda d: np.arange(int(round(d * SR))) / SR
cues = []

def env_adsr(d, a=.02, r=.3):
    n = int(round(d * SR)); e = np.ones(n); ai = max(1, min(n, int(a * SR))); ri = max(1, min(n, int(r * SR)))
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


# —— C: the fish waltz ——
BAR = 1.26; B3 = BAR / 3
CH = {'D': [38, 62, 66, 69], 'A': [33, 61, 64, 67], 'Bm': [35, 62, 66, 71], 'Em': [40, 64, 67, 71], 'G': [31, 62, 67, 71], 'F#m': [42, 61, 66, 69]}
WALTZ = [(69, 2), (66, 1), (69, 2), (74, 1), (73, 2), (71, 1), (69, 3), (67, 2), (64, 1), (67, 2), (73, 1), (71, 2), (69, 1), (66, 3),
         (69, 2), (66, 1), (69, 2), (74, 1), (76, 2), (74, 1), (73, 3), (71, 2), (73, 1), (74, 2), (76, 1), (78, 2), (76, 1), (74, 3)]
PROG = ['D', 'D', 'A', 'D', 'Em', 'A', 'A', 'D', 'D', 'D', 'Bm', 'A', 'G', 'A', 'D', 'D']
def reed(m, d, vel=.5):   # a bassoon-ish reed: saws through a low formant
    s = saw_stack(m, d, det=(-.03, .03), top=3000); y = .7 * bp(s, 250, 700, 2) + .3 * bp(s, 900, 1500, 2)
    return y * env_adsr(d, .03, .12) * vel * .5
def oompah(t0, t1, prog=PROG, vel=.4, bass='pizz', chord='harp', oct=12):
    t, k = t0, 0
    while t < t1 - .05:
        ch = CH[prog[k % len(prog)]]
        put('low', (pizz(ch[0] + 12, vel) if bass == 'pizz' else reed(ch[0] + 12, B3 * .9, vel * .9)), t)
        for b in (1, 2):
            for j, m in enumerate(ch[1:]): put('harp' if chord == 'harp' else 'pad', harp(m + oct - 12, vel * .55) if chord == 'harp' else strings(m, B3 * .9, vel * .6), t + b * B3, 1, -.3 + .3 * j)
        t += BAR; k += 1
def tune(t0, notes, inst='cel', vel=.6, oct=0, beat=B3, stop=None, pan=.15):
    t = t0
    for m, b in notes:
        if stop and t >= stop: break
        if inst == 'cel': put('cel', celesta(m + oct, 1.6 + b * beat, vel), t, 1, pan)
        elif inst == 'rec': put('cel', recorder(m + oct - 12, b * beat * .95, vel), t, 1, -.1)
        elif inst == 'reed': put('cel', reed(m + oct - 24, b * beat * .9, vel), t, 1, 0)
        elif inst == 'str': put('pad', strings(m + oct - 12, b * beat + .3, vel), t, 1, .1)
        else: put('harp', harp(m + oct, vel), t, 1, pan)
        t += b * beat
    return t

# A — 0 → 13.4: 노을 snoring; a sneaky pizzicato on the tiptoe (the pops have their own sounds in the mix)
for k in range(9):
    t = 1.4 + k * BAR * 1.2
    for j, m in enumerate([62, 66, 69] if k % 2 == 0 else [61, 64, 69]): put('low', pizz(m - 12 + (12 if j else 0), .32), t + j * B3 * .5, 1, -.2 + .2 * j)
put('pad', strings(62, 4.5, .14) + strings(69, 4.5, .1), 8.8)
cues.append(('tiptoe pizzicato', 1.4))
# B — 13.4 → 19.6: the title — the waltz, first heard on celesta over harp oom-pah-pah
oompah(13.7, 19.4, vel=.36); tune(13.7, WALTZ[:14], 'cel', vel=.6, oct=12, stop=19.3); cues.append(('waltz: title', 13.7))
# C — 19.6 → 34.6: the shadow plays — the fish waltz on the recorder; teapots in staccato; the flyer on strings
oompah(T['fishOn'], T['fishOff'], vel=.34); tune(T['fishOn'], WALTZ, 'rec', vel=.55, stop=T['fishOff'] - .1)
t = T['teapotOn']
for k in range(int((31.4 - T['teapotOn']) / B3)):
    m = [74, 78, 81, 78][k % 4]; put('cel', celesta(m + 12, .6, .32), t + k * B3, 1, -.4 + .8 * (k % 3) / 2); put('low', pizz(([38, 45] if k % 3 == 0 else [62, 57])[k % 2] - (12 if k % 3 == 0 else 0), .4), t + k * B3)
pads(31.4, T['teapotOff'] + .4, [[50, 62, 66, 69, 74]], 'strings', vel=.3, bars_per=2)
tune(31.5, [(81, 3), (79, 1.5), (78, 1.5), (76, 3), (74, 3)], 'cel', vel=.5, beat=B3)
cues.append(('fish waltz', T['fishOn'])); cues.append(('teapots', T['teapotOn'])); cues.append(('flyer', 31.4))
# D — 34.6 → 48.4: the chase — a comic run; stops dead for the jump and the fall (the slide whistles are in the mix); the waltz on a reed under the hat
for k in range(int((T['jump'] - 35.0) / (B3 * .5))):
    t = 35.0 + k * B3 * .5; m = [62, 64, 66, 67, 69, 67, 66, 64][k % 8]
    put('low', pizz(m - 12, .36), t, 1, -.2 + .4 * (k % 2))
gate_marks = [(T['jump'] - .05, T['sitUp'] + .2)]
oompah(T['hatShadow'][0], T['hatShadow'][1] + .2, vel=.3, bass='reed'); tune(T['hatShadow'][0], WALTZ[:10], 'reed', vel=.7, oct=0, stop=T['hatShadow'][1])
cues.append(('chase', 35.0)); cues.append(('hat waltz (reed)', T['hatShadow'][0]))
# E — 48.4 → 58: the biggest snore (music holds its breath), then the burst: a celesta cascade, tremolo strings rising, up the pipe
pads(49.3, 57.8, [[50, 57, 62, 66, 69], [52, 59, 64, 67, 71], [54, 61, 66, 69, 73]], 'strings', vel=.34, bars_per=1, trem=10)
for k in range(60):
    t = 49.3 + k * .12; put('cel', celesta(74 + [0, 4, 7, 12, 16, 19, 24, 19][k % 8] + (k // 16) * 2, .9, .3), t, 1, -.6 + 1.2 * ((k * 7) % 11) / 10)
put('perc', timp(38, .25), 49.3)
cues.append(('burst', 49.3))
# F — 58 → 76.2: over the town — the waltz grand: strings, harp, celesta; then the alley in eighths
oompah(58.2, 70.6, vel=.4); tune(58.2, WALTZ, 'cel', vel=.55, oct=12, stop=70.5); tune(58.2, WALTZ, 'str', vel=.4, oct=0, stop=70.5)
pads(62.6, 70.6, [[50, 62, 66, 69], [45, 61, 64, 69]], 'choir', vel=.22, bars_per=2, oct=-12)
for k in range(int((T['run'][1] - 70.8) / (B3 * .5))):
    t = 70.8 + k * B3 * .5; put('low', pizz([50, 54, 57, 62][k % 4] - 12, .38), t); 
    if k % 3 == 0: put('harp', harp([74, 78, 81][(k // 3) % 3], .3), t, 1, .3)
cues.append(('waltz over the town', 58.2)); cues.append(('alley', 70.8))
# G — 76.2 → 90.4: a breath of silence, then the last dream: the waltz slow and tender on celesta, strings under; minor colours for the long years
SLOW = ['Bm', 'Bm', 'G', 'D', 'Em', 'A', 'D', 'D']
pads(77.4, 90.3, [CH[c] for c in SLOW], 'strings', vel=.28, bars_per=1)
tune(77.6, [(66, 3), (69, 3), (71, 3), (69, 3), (67, 3), (64, 3), (66, 3), (62, 3)], 'cel', vel=.55, oct=12, beat=B3 * 1.7)
for k in range(int((90.2 - 77.6) / (BAR * 1.7))): put('harp', harp(CH[SLOW[k % len(SLOW)]][0] + 24, .3), 77.6 + k * BAR * 1.7, 1, -.2)
cues.append(('last dream (slow)', 77.6))
# H — 90.4 → 95.4: every window: the choir swells; a low bell
pads(90.4, 95.6, [[38, 50, 57, 62, 66], [45, 57, 61, 64, 69]], 'choir', vel=.36, bars_per=2, oct=0)
for k in range(4): put('perc', timp(38 + [0, 7, 0, 7][k], .12), 90.6 + k * BAR)
# I — 95.4 → 121.6: morning — warm strings and harp, quiet under the voices; the keeper's motif (film 1) in major when she comes out
pads(95.6, 121.4, [CH[c] for c in ['D', 'G', 'D', 'A']], 'strings', vel=.22, bars_per=2)
arps(95.8, 121.0, MAJ, rate=1, vel=.22, oct=12)
motif(T['noeulOut'][0] + .2, MOTIF_MAJ, 'cel', vel=.55)
tune(119.4, [(69, 2), (66, 1), (69, 2), (74, 1)], 'cel', vel=.5, oct=12)
cues.append(('morning', 95.6)); cues.append(('keeper motif (major)', T['noeulOut'][0] + .2))
# J — 121.6 → 125.6: the coda — one more turn of the waltz for the spinning fish, then the last chord
oompah(121.8, 124.4, vel=.36); tune(121.8, WALTZ[:6], 'cel', vel=.6, oct=12, stop=124.4)
for j, m in enumerate([62, 66, 69, 74, 78]): put('cel', celesta(m + 12, 3.0, .45), 124.3 + j * .06, 1, -.3 + .15 * j)

# —— silences: the jump-and-fall stop, the big snore's breath, the breath before the last dream ——
def gate(a, b, fade_out=.05, fade_in=.6, keep=('wind',)):
    i0, i1 = int(a * SR), int(b * SR); f0 = max(1, int(fade_out * SR)); f1 = max(1, int(fade_in * SR))
    for k, B in bus.items():
        if k in keep: continue
        B[i0:i0 + f0] *= np.linspace(1, 0, f0)[:, None]; B[i0 + f0:i1] = 0; B[i1:i1 + f1] *= np.linspace(0, 1, f1)[:, None]
for a, b in gate_marks: gate(a, b, fade_out=.04, fade_in=.2)
gate(T['big'] - .5, T['big'] + .35, fade_out=.2, fade_in=.02)
gate(76.0, 77.5, fade_out=.5, fade_in=.3)

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
    f.write('# Score cues (music/score.py)\n\nD major, the fish waltz in 3/4 (a bar = 1.26 s). Times in seconds, from timeline.json.\n\n| cue | t |\n|---|---|\n' + ''.join(f'| {a} | {b:.2f} |\n' for a, b in cues))
print('music/score.wav', round(len(out) / SR, 2), 's')
