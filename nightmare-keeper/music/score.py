#!/usr/bin/env python3
"""score.py — the original score of 「악몽을 지키는 파수꾼」, composed here and synthesized in code (no samples, no recordings).
Chamber-fantasy colours from the style's palette: harp and pizzicato bass (physically modelled, the library's pluck.py),
celesta (FM bells), a string pad and a low "ah" choir (additive saws through formant filters), a recorder-like voice,
timpani and a hand drum. D dorian, ♩ = 72; the sections follow TREATMENT.md §6 and the times in timeline.json.

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

# A — 0 → 20: night over the toy town; the drone and a slow harp; celesta motif under the title
put('low', lp(saw_stack(38, 21, det=(-.05, .05), top=600), 220) * env_adsr(21, 2.5, 3) * .06, 0)
arps(1.0, 16.6, DOR, rate=1, vel=.36, bars_per=1)
pads(7.5, 15.4, DOR[1:], 'strings', vel=.32, bars_per=1)
motif(17.05, MOTIF, 'cel', vel=.8); cues.append(('title motif', 17.05))
arps(17.05, 21.0, DOR, rate=1, vel=.28)
# B — 20 → 37.5: the round: harp in eighths, pizzicato, the recorder answers; a celesta note on each moth caught
arps(21.0, 37.4, DOR, rate=2, vel=.4)
bassline(21.0, 37.4, DOR, vel=.55, every=2)
motif(27.5, MOTIF, 'rec', step=BEAT * 1.5, vel=.6)
for c in T['collect']: put('cel', celesta(86, 1.6, .5), c + .3, 1, .3); put('cel', celesta(93, 1.2, .3), c + .55, 1, -.3)
pads(32.0, 37.6, [DOR[0]], 'strings', vel=.3, bars_per=2)
cues.append(('door, motif home', 32.0))
# C — 37.5 → 47.6: the swell: choir pad, string tremolo, harp repeats getting faster, timpani roll; hard stop at the burst
pads(37.5, T['burst'], [[50, 53, 57, 60, 63], [50, 53, 56, 60, 63]], 'choir', vel=.3, bars_per=1, oct=-12)
pads(40.0, T['burst'], [[50, 53, 57, 62, 63]], 'strings', vel=.3, bars_per=3, trem=9)
t = 37.8
while t < T['burst'] - .1:
    u = (t - 37.8) / (T['burst'] - 37.8); put('harp', harp(62 + (1 if int(t * 3) % 2 else 0), .35 + .3 * u), t, 1, .2); t += BEAT * (1 - .78 * u)
t = 42.0
while t < T['burst'] - .05:
    u = (t - 42) / (T['burst'] - 42); put('perc', timp(38, .06 + .32 * u ** 1.5), t); t += .16 - .08 * u
cues.append(('hard stop (burst)', T['burst']))
# the hard stop: everything that rings past the burst is cut, a reverb tail stays (applied below on the buses)
# 53 → 61: the low choir alone while the windows turn violet
pads(53.2, 61.0, [[38, 50, 53, 57, 60]], 'choir', vel=.42, bars_per=3, oct=-12)
# D — 61 → 81: the chase: pizzicato 16ths, harp climbing, hand drum; each alley's save lands on a beat
bassline(61.0, 81.0, DOR, vel=.6, every=.5)
for k in range(int((81 - 61) / BEAT)):
    t = 61 + k * BEAT; put('perc', drum(.5 if k % 2 else .7), t, 1, -.2)
    if k % 2: put('perc', drum(.3), t + BEAT / 2, 1, .2)
arps(61.0, 81.0, DOR, rate=2, vel=.42, oct=24)
for s in T['chaseStops']:
    for j, m in enumerate([74, 78, 81, 86]): put('cel', celesta(m, 1.8, .55), s + 1.6 + j * .12, 1, -.3 + .2 * j)
    cues.append((f'save {s}', s + 1.6))
motif(69.0, MOTIF, 'rec', step=BEAT, vel=.6, oct=12)
# E — 81 → 103.6: the cottage: choir pad and a sparse harp; the music stops at the refusal; the heartbeat alone
pads(81.0, T['refuse'], [[50, 53, 57, 60, 64], [46, 53, 57, 62, 65]], 'choir', vel=.4, bars_per=2, oct=-12)
for k, m in enumerate([62, 65, 69, 67, 64, 62, 60, 57]):
    t = 82.0 + k * BEAT * 2
    if t < T['refuse'] - .3: put('harp', harp(m, .38), t, 1, .2)
cues.append(('silence (refusal)', T['refuse'])); cues.append(('silence (heartbeat)', T['heartbeat']))
put('pad', strings(62, 4.2, .25) + strings(65, 4.2, .2), 97.6)     # under the boy's line: a thin pad only
# F — 103.6 → 127: the turn to major: celesta + harp + strings; the motif in major as she sleeps and at dawn
pads(103.8, 125.5, MAJ, 'strings', vel=.4, bars_per=1)
arps(104.2, 124.0, MAJ, rate=2, vel=.34, oct=12)
motif(T['sleep'] - .2, MOTIF_MAJ, 'cel', vel=.75); cues.append(('motif in major (sleep)', T['sleep'] - .2))
motif(118.4, MOTIF_MAJ, 'rec', step=BEAT * 1.25, vel=.55)
put('cel', celesta(86, 4.0, .6), 124.6); put('cel', celesta(81, 4.0, .45), 124.75); put('cel', celesta(74, 4.0, .4), 124.9)
bassline(104.0, 124.0, MAJ, vel=.45, every=2)

# —— the hard stop at the burst and the silence before the boy's line: cut the buses, keep a tail ——
def gate(a, b, fade_out=.05, fade_in=.6, keep=('wind',)):
    i0, i1 = int(a * SR), int(b * SR); f0 = max(1, int(fade_out * SR)); f1 = max(1, int(fade_in * SR))
    for k, B in bus.items():
        if k in keep: continue
        B[i0:i0 + f0] *= np.linspace(1, 0, f0)[:, None]; B[i0 + f0:i1] = 0; B[i1:i1 + f1] *= np.linspace(0, 1, f1)[:, None]
tail = sum(bus[k][int(T['burst'] * SR) - int(1.2 * SR):int(T['burst'] * SR)] for k in ('choir', 'pad'))
gate(T['burst'], 53.15)
gate(T['refuse'], T['refuse'] + 1.6, fade_out=.25, fade_in=.3)   # the moth does not come: the music stops (the thin pad under the boy's line comes in at 97.6)
gate(T['nearlyOut'] - .4, T['relight'], fade_out=.3, fade_in=1.2)
# a reverb tail after the burst: the last 1.2 s smeared into a long decay
rv = np.zeros((int(4 * SR), 2)); ir = rng.standard_normal(int(3.5 * SR)) * np.exp(-np.arange(int(3.5 * SR)) / (1.1 * SR))
for c in range(2): rv[:, c] = np.convolve(tail[:, c], ir)[:len(rv)] * .004
add(bus['pad'], rv[:, 0], T['burst'], 1, -.3); add(bus['pad'], rv[:, 1], T['burst'], 1, .3)

LEV = {'harp': 1.0, 'cel': .9, 'pad': 1.0, 'choir': .9, 'low': .9, 'perc': .9, 'wind': 1}
for k, B in bus.items(): out += B * LEV[k]
# low-end balance: a gentle shelf under 120 Hz
for c in range(2): out[:, c] = out[:, c] - .35 * lp(out[:, c], 110)
out = out[:int(DUR * SR)]
out /= max(1e-9, np.abs(out).max()); out *= .8
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
with wave.open(os.path.join(HERE, 'music', 'score.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
with open(os.path.join(HERE, 'music', 'CUES.md'), 'w') as f:
    f.write('# Score cues (music/score.py)\n\nD dorian, ♩ = 72. Times in seconds, from timeline.json.\n\n| cue | t |\n|---|---|\n' + ''.join(f'| {a} | {b:.2f} |\n' for a, b in cues))
print('music/score.wav', round(len(out) / SR, 2), 's')
