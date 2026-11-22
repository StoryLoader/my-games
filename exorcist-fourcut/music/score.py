#!/usr/bin/env python3
"""score.py — the original score of 「네 컷」, composed here and synthesized from scratch with numpy (no samples, no recordings).
1-bit Dither palette (STYLE §7): a small, cold ensemble that sits under the machines — bass clarinet, glockenspiel, pizzicato and
bowed low strings, a slightly detuned upright piano, brushed percussion. The printer's rows are the pulse when it prints;
silence is used for the curtain, the last count and the verdict.
♩ = 96 (one beat 0.625 s), D minor. The four-note glockenspiel motif (A F E D) is the four frames; at the end it stops on C♯.
Sections follow story.js (timeline.json) shot for shot.

  $LIB/.venv/bin/python music/score.py      → music/score.wav (48 kHz stereo), music/CUES.md
"""
import json, os, wave
import numpy as np
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T, DUR, BEAT = TL['T'], TL['DUR'], TL['BEAT']
SH = {s[0]: (s[2], s[3]) for s in TL['SHOTS']}
SR = 48000; N = int((DUR + 2) * SR)
rng = np.random.default_rng(424)
bus = {k: np.zeros((N, 2)) for k in ('glock', 'clar', 'pizz', 'bow', 'piano', 'brush')}
cues = []
def b(n): return n * BEAT
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x)
def bp(x, lo, hi, o=2): return sosfilt(sos('band', [lo, hi], o), x)
def env(d, a=.01, r=.2):
    n = int(d * SR); e = np.ones(n); ai = max(1, min(n, int(a * SR))); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def put(k, x, t, g=1.0, pan=0.0):
    i = int(t * SR); x = np.asarray(x, np.float64)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[k][i:i + len(x), 0] += x * g * l * 1.41; bus[k][i:i + len(x), 1] += x * g * r * 1.41

# —— instruments ——
def glock(m, d=2.2, v=.6):   # metal bar: inharmonic partials, bright strike, long ring
    x = tt(d); f = hz(m)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x * 1.6) + .35 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 5) + .12 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 12)
    y[:24] *= np.linspace(0, 1, 24); return y * v * .16
def clar(m, d, v=.6, vib=.004):   # bass clarinet: odd harmonics (a closed pipe), breath, slow attack, a small late vibrato
    x = tt(d); f = hz(m) * (1 + vib * np.sin(2 * np.pi * 5 * x) * np.minimum(1, x / .8))
    ph = 2 * np.pi * np.cumsum(f) / SR; y = sum(np.sin(ph * k) / k ** 1.3 for k in (1, 3, 5, 7, 9))
    y = lp(y, 1400) + bp(rng.standard_normal(len(x)), 800, 2400) * .05
    return y * env(d, .09, .25) * v * .12
def pizz(m, v=.6, d=1.0):   # plucked low string: Karplus–Strong
    f = hz(m); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .994
    return lp(out, 1800) * v * .3
def bowed(m, d, v=.5, trem=0.0, bright=1200):   # bowed low strings: detuned saws, slow bow, optional tremolo
    x = tt(d); y = np.zeros(len(x))
    for c in (-.07, 0, .06):
        ph = rng.random(); y += 2 * ((x * hz(m) * 2 ** (c / 12) + ph) % 1) - 1
    y = lp(y / 3, bright)
    if trem: y *= .55 + .45 * np.abs(np.sin(2 * np.pi * trem * x))
    return y * env(d, .6, .8) * v * .1
def piano(m, d=2.5, v=.6, det=4.0):   # a slightly detuned upright: three strings a few cents apart, hammer thump, stretched partials
    x = tt(d); y = np.zeros(len(x)); f0 = hz(m)
    for c in (-det, 0, det * .8):
        f = f0 * 2 ** (c / 1200)
        for k in range(1, 7): y += np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * x) * np.exp(-x * (1.2 + k * .9)) / k ** 1.1
    y += lp(rng.standard_normal(len(x)), 400) * np.exp(-x * 60) * .4
    y[:24] *= np.linspace(0, 1, 24); return y * v * .05
def brush(v=.5, d=.5):   # brush swish on a snare
    x = tt(d); return bp(rng.standard_normal(len(x)), 1500, 8000) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2 * v * .08
def tap(v=.5): x = tt(.12); return (bp(rng.standard_normal(len(x)), 2000, 9000) * np.exp(-x * 45) + np.sin(2 * np.pi * 180 * x) * np.exp(-x * 40) * .5) * v * .12
def cluster(ms, v=.8, d=3.5):
    y = sum(piano(m, d, v) for m in ms); return y

MOTIF = [81, 77, 76, 74]          # A F E D — the four frames
def motif(t, v=.55, gap=b(1), notes=MOTIF, pan=.25):
    for k, m in enumerate(notes): put('glock', glock(m, 2.4, v), t + k * gap, 1, pan)

# A print 0–8.75: the printer is the pulse; a bowed D under it, the motif once, high and far
put('bow', bowed(38, 8.0, .4), 1.2, 1, -.2); put('bow', bowed(45, 7.0, .3), 2.4, 1, .2)
motif(3.0, .35, b(1.5)); cues.append(('motif — the first strip', 3.0))
# B two 8.75–18.75: pizzicato walking slowly in D minor, bass clarinet holding under the lines
for k, m in enumerate([38, 45, 41, 40, 38, 45, 43, 41, 38, 45, 41, 40, 38, 37]): put('pizz', pizz(m, .55), SH['two'][0] + .2 + k * b(1.1), 1, -.3)
put('clar', clar(50, 4.0, .45), 9.0); put('clar', clar(48, 3.5, .4), 13.4); put('clar', clar(49, 3.0, .45), 16.2)
# C title 18.75–22.5: the stamp — a low piano cluster on it, the motif rising after, then nothing
put('piano', cluster([26, 33, 38, 39], 1.0, 4.0), T['stamp']); cues.append(('title stamp cluster', T['stamp']))
motif(T['stamp'] + .6, .55, b(.75), [74, 76, 77, 81])
# D glide 22.5–35: brushes, a pizzicato ostinato, sparse piano, bass clarinet in the gaps of 무진's rule
for k in range(int((SH['glide'][1] - SH['glide'][0]) / BEAT)):
    t = SH['glide'][0] + k * BEAT
    put('brush', brush(.45, .45), t, 1, .3)
    if k % 2: put('brush', tap(.35), t, 1, .35)
    put('pizz', pizz([38, 45, 41, 40][k % 4], .45), t, 1, -.25)
for k, ch in enumerate([[50, 53, 57], [48, 52, 57], [46, 50, 53], [45, 49, 52]]):
    for m in ch: put('piano', piano(m, 3.0, .4), SH['glide'][0] + k * b(5), 1, .1)
put('clar', clar(45, 2.4, .5), 33.0)
# E wall 35–46.25: thinning; a glock tick on the blink; the poster — a low bowed minor second swelling
for k, m in enumerate([62, 65, 64, 62]): put('piano', piano(m, 3, .35), 35.4 + k * b(4), 1, .2)
put('glock', glock(88, 1.5, .4), T['blink'], 1, .4)
put('bow', bowed(38, 5.2, .55, bright=900), T['posterIn'] - .3, 1, -.2); put('bow', bowed(39, 5.0, .45, bright=900), T['posterIn'], 1, .2)
cues.append(('poster swell', T['posterIn']))
# F curtain 46.25–55: low strings tremolo rising toward the closing curtain, cut dead on it
for m, p in ((38, -.3), (45, .3), (50, 0)): put('bow', bowed(m, T['entClose'] - 47.0 + .02, .45, trem=6, bright=1500) * env(T['entClose'] - 47.0 + .02, .5, .02), 47.0, 1, p)
cues.append(('silence: the curtain closes', T['entClose']))
# G lens1 55–66.25: one far filtered tone; a cluster on each flash
put('bow', bowed(62, 5.0, .18, bright=700), 55.6, 1, .4)
for f in T['flash'][:2]: put('piano', cluster([26, 32, 38, 44], .8, 3.2), f, 1, 0); put('glock', glock(86, 1.6, .45), f + .02, 1, .3)
# H outside 66.25–71.25: agitated low tremolo, brushed rolls under the pounding
put('bow', bowed(40, 5.0, .55, trem=9, bright=1400), SH['outside'][0], 1, -.2); put('bow', bowed(41, 4.6, .45, trem=9, bright=1400), SH['outside'][0] + .3, 1, .2)
for k in range(8): put('brush', brush(.5, .6), SH['outside'][0] + k * .62, 1, .3)
# I shoulder 71.25–85: almost nothing — the hand: one high glock and a bass clarinet growl; her eyes: low pizz like a pulse
put('glock', glock(93, 2.5, .45), T['hand'], 1, .3); put('clar', clar(34, 3.2, .55, vib=.012), T['hand'] + .1, 1, -.2)
for k in range(7): put('pizz', pizz(33, .5, .8), 77.3 + k * .62, 1, -.1)
put('piano', cluster([26, 32, 38, 44], .8, 2.6), T['flash'][2])
# J lens4 85–93.75: everything climbs to the biggest flash, then silence
d = T['flash'][3] - 85.2
for m, p in ((38, -.4), (45, .4), (50, -.1), (56, .1)): put('bow', bowed(m, d, .5, trem=7, bright=2200) * env(d, 2.5, .02), 85.2, 1, p)
put('clar', clar(38, d, .6) * env(d, 1.5, .02), 85.2, 1, -.2)
for k in range(int(d / .3)): put('brush', tap(.25 + .5 * k / (d / .3)), 85.4 + k * .3, 1, .3)
put('piano', cluster([21, 26, 27, 33, 38, 39], 1.1, 4.0), T['flash'][3]); cues.append(('the last flash; silence after', T['flash'][3]))
# K release 93.75–101.25: relief that does not last — a B♭ chord, the motif slowly
for m in (46, 50, 53, 58): put('bow', bowed(m, 6.5, .35, bright=1600), 94.4, 1, (m - 52) / 20)
motif(95.6, .4, b(2), [74, 77, 81, 82])
put('piano', piano(62, 3, .45), T['pin'], 1, .2)
# L print2 101.25–108.75: the printer pulse again; the motif in the low register, the bass clarinet uneasy
motif(102.9, .4, b(1.5), [69, 65, 64, 62]); put('clar', clar(37, 5.5, .45, vib=.01), 102.8, 1, -.2)
# M mujin 108.75–115: a suspended chord that never lands
for m in (38, 43, 45, 50): put('bow', bowed(m, 5.2, .3, bright=1100), 109.0, 1, (m - 44) / 14)
# N door 115–120: a wrong piano (more detuned) under the smile; cut on the snap
for k, m in enumerate([74, 73, 74, 70]): put('piano', piano(m, 2.6, .45, det=22), 115.6 + k * b(1.5), 1, .2)
cues.append(('silence: the beads snap', T['snap']))
# O fall 120–128.75: a rising cluster through the dots; inside: muffled; the dark: one far filtered tone
d = T['resolve'][0] - T['push'][0]
for m in (38, 39, 44, 45): put('bow', bowed(m, d + .05, .55, trem=11, bright=2600) * env(d + .05, d * .9, .02), T['push'][0], 1, (m - 41) / 8)
put('piano', cluster([21, 26, 32, 33], 1.0, 3.5), T['resolve'][0])
put('bow', lp(bowed(50, 3.2, .3, bright=600), 500), T['resolve'][1] + .2, 1, 0)
put('bow', lp(bowed(62, 1.9, .2, bright=500), 500), T['dark'] + .05, 1, .3)
# P end 128.75–133.75: the receipt prints; the motif once, stopping on C♯
motif(T['receipt'][0] + .2, .45, b(1.25), [81, 77, 76, 73]); cues.append(('motif ends on C♯', T['receipt'][0] + .2 + b(3.75)))
put('bow', bowed(38, 4.0, .25, bright=800), 129.4, 1, -.2)

gains = {'glock': .9, 'clar': 1.0, 'pizz': .9, 'bow': 1.0, 'piano': 1.0, 'brush': .8}
mix = sum(bus[k] * g for k, g in gains.items())
# a small dark room: short early reflections
for dly, g in ((.023, .22), (.041, .16), (.067, .1)):
    i = int(dly * SR); mix[i:] += np.stack([lp(mix[:-i, 1], 3000) * g, lp(mix[:-i, 0], 3000) * g], 1)
mix = hp(mix.T, 45, 2).T
mix = mix[:int(DUR * SR)] / (np.abs(mix).max() + 1e-9) * .8
with wave.open(os.path.join(HERE, 'music', 'score.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
with open(os.path.join(HERE, 'music', 'CUES.md'), 'w') as f:
    f.write('# 네 컷 — score cues (synthesized in music/score.py)\n\n| t (s) | cue |\n|---|---|\n' + ''.join(f'| {t:.2f} | {c} |\n' for c, t in sorted(cues, key=lambda c: c[1])))
print('music/score.wav', round(len(mix) / SR, 2), 's')
