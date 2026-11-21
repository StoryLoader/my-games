#!/usr/bin/env python3
"""mix.py — the sound of 「막차」: ambience beds per place, foley at the picture's event times (events.json, exported from the
page's window.EV), the score (music/score.wav) ducked under every line, and the voices (voices/*.wav at the times in timeline.json).
Everything is synthesized here (the library's core/audio/sfx.py helpers + numpy); nothing recorded or downloaded.
The PA and the 1984 driver go through a station-speaker band (~380–2800 Hz); 무진's far shout (m5) gets distance.

  $LIB/.venv/bin/python mix.py [out.wav]       → mix.wav (48 kHz stereo); the viewer's mp3 is loudness-normalized to −14 LUFS
"""
import json, os, sys, wave
import numpy as np
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, lp, hp, bp, norm, noise, add, compress, thump, heartbeat, rumble, whoosh, clack, ignite   # noqa: E402
from scipy.signal import resample_poly, fftconvolve                                                       # noqa: E402
import soundfile as sf                                                                                     # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T, DUR, VO, BEAT = TL['T'], TL['DUR'], TL['VO'], TL['BEAT']
SH = {s[0]: (s[1], s[2]) for s in TL['SHOTS']}
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
DURS = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
N = int(DUR * SR); rng = np.random.default_rng(84)
amb, fol, voc = (np.zeros((N, 2)) for _ in range(3))
tt = lambda d: np.arange(int(round(d * SR))) / SR
t_all = np.arange(N) / SR
def curve(keys): k = np.array(keys, float); return np.interp(t_all, k[:, 0], k[:, 1])
def gate(spans, ramp=.12):
    keys = [[0, 0]]
    for a, b in spans: keys += [[a - ramp, 0], [a, 1], [b, 1], [b + ramp, 0]]
    keys.append([DUR, 0]); keys.sort(); return curve(keys)
def loopnoise(d, lo, hi, seed):
    r = np.random.default_rng(seed).standard_normal(int(d * SR) + SR); x = bp(r, lo, hi, 2)[:int(d * SR)]; return x / (np.abs(x).max() + 1e-9)

# —— where we are ——
CAR = [SH['two'], SH['seoha'], SH['track'], SH['phone'], SH['talisman'], SH['speed'], SH['mujin'], SH['peel'], SH['wake'], SH['map'], SH['freeze']]
CAB = [SH['cab'], SH['raise'], SH['decide'], SH['mic'], SH['driver']]
PLAT = [SH['hook'], SH['door'], SH['arrive']]
TUN = [SH['title']]
in_car, in_cab, on_plat, in_tun = gate(CAR), gate(CAB), gate(PLAT), gate(TUN)
moving = curve([[0, 0], [T['depart'], 0], [T['depart'] + 1.5, 1], [T['brakes'], 1], [T['flash'] + .4, 0], [DUR, 0]])
fast = curve([[0, 0], [SH['speed'][0], 0], [SH['speed'][0] + .5, 1], [SH['peel'][1], 1], [SH['peel'][1] + 1, 0], [DUR, 0]])
for c, s in ((0, 1), (1, 2)):
    hum = np.sin(2 * np.pi * 120 * t_all + s) * .5 + loopnoise(DUR, 60, 220, s) * .8       # car: fluorescent hum + body rumble
    amb[:, c] += hum * .03 * (in_car + in_cab * .8) * (.5 + .5 * moving)
    roar = loopnoise(DUR, 80, 1400, s + 5)                                                      # tunnel wind outside, louder when fast
    amb[:, c] += roar * .05 * moving * (.5 + .9 * fast + 1.4 * in_tun) * (1 - on_plat * .7)
    air = loopnoise(DUR, 100, 900, s + 9)                                                       # the station's air, a far drip
    amb[:, c] += air * .02 * on_plat
# rail joints on the beat grid while moving (double clacks, faster in the chase)
t = T['depart'] + .3
while t < T['flash'] - .2:
    k = moving[int(t * SR)]
    if k > .05:
        v = .05 * k * (1 + .6 * fast[int(t * SR)])
        add(fol, clack(.8, v), t, 1, -.2); add(fol, clack(.9, v * .8), t + .11, 1, .2)
    t += BEAT * (.5 if fast[int(t * SR)] > .5 else 1)
for k in range(10):   # a far drip at the platforms
    add(amb, np.sin(2 * np.pi * 1800 * tt(.08)) * np.exp(-tt(.08) * 60) * .02, 1.3 + k * 2.7, 1, .5)

# —— foley ——
def chime(v=1.0):   # a generic two-tone station chime (not any operator's)
    out = np.zeros(int(1.4 * SR))
    for k, f in enumerate([1046.5, 784.0]):
        x = tt(.9); y = (np.sin(2 * np.pi * f * x) + .3 * np.sin(2 * np.pi * f * 2 * x)) * np.exp(-x * 4); i = int(k * .42 * SR); out[i:i + len(y)] += y[:len(out) - i]
    return out * v
def bellring(v=1.0, d=1.6):   # 무당방울: a cluster of small brass bells shaken
    out = np.zeros(int(d * SR))
    for j in range(26):
        f = rng.uniform(2600, 5200); x = tt(.5); y = np.sin(2 * np.pi * f * x) * np.exp(-x * rng.uniform(8, 16)) + .4 * np.sin(2 * np.pi * f * 2.7 * x) * np.exp(-x * 20)
        i = int(rng.uniform(0, d * .6) * SR); out[i:i + len(y)] += y[:len(out) - i] * rng.uniform(.3, 1)
    return out * v * .12
def burn(d=1.5, v=1.0):
    x = tt(d); cr = hp(noise(d), 2000) * (rng.random(len(x)) > .985) * 3 + bp(noise(d), 200, 1600) * .4
    return cr * np.minimum(1, x / .2) * np.exp(-np.maximum(0, x - d * .7) * 6) * v
def whispers(d, v=1.0):   # the shadows: breathy formant noise, many voices
    x = tt(d); y = np.zeros(len(x))
    for k in range(6):
        f0 = rng.uniform(500, 1400); src = noise(d); am = .5 + .5 * np.sin(2 * np.pi * rng.uniform(2, 5) * x + k)
        y += bp(src, f0, f0 * 1.8) * am * rng.uniform(.5, 1)
    return y * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .5 * v * .05
def brakes(d=2.6, v=1.0):
    x = tt(d); f = 2400 - 600 * x / d; y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.6 + .4 * np.sin(2 * np.pi * 7 * x)) + hp(noise(d), 3000) * .4
    return y * np.minimum(1, x / .3) * np.exp(-np.maximum(0, x - d * .7) * 4) * v * .1
def doors(v=1.0):
    x = tt(1.0); y = bp(noise(1.0), 200, 2000) * np.exp(-x * 2) * .5; y[int(.62 * SR):int(.7 * SR)] += thump(1, 90)[:int(.08 * SR)] * 2
    return y * v * .3
def tape(kind, v=1.0):
    if kind == 'click': x = tt(.12); return (bp(noise(.12), 800, 5000) * np.exp(-x * 60) + np.sin(2 * np.pi * 120 * x) * np.exp(-x * 30)) * v * .4
    if kind == 'whine': x = tt(.8); return np.sin(2 * np.pi * np.cumsum(15000 - 8000 * x) / SR) * np.exp(-x * 4) * v * .02
    x = tt(.9); return (thump(1, 60)[:len(x)] if False else 0) + bp(noise(.9), 100, 3000) * np.exp(-x * 5) * v * .3
def impact(v=1.0):
    return np.concatenate([thump(1.2 * v, 55), np.zeros(int(.2 * SR))])[:int(.55 * SR)] * .9 + np.pad(hp(noise(.3), 1500) * np.exp(-tt(.3) * 18) * .5 * v, (0, int(.25 * SR)))
def punchhit(v=1.0):   # fist + beads: a thud, a wooden clatter
    out = impact(v) * .8
    for j in range(8): i = int(rng.uniform(0, .12) * SR); c = clack(rng.uniform(1.2, 1.8), .25 * v); out[i:i + len(c)] += c[:len(out) - i]
    return out
def flash(v=1.0): x = tt(1.2); return (hp(noise(1.2), 2500) * np.exp(-x * 3) * .4 + np.sin(2 * np.pi * np.cumsum(300 + 2000 * np.exp(-x * 4)) / SR) * np.exp(-x * 3) * .3) * v

for e in EV:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'chime': add(fol, chime(.05), t, 1, .1)
    elif ty == 'ptt': add(fol, tape('click', .3), t)
    elif ty == 'crton': add(fol, tape('whine', 1), t)
    elif ty == 'tapeclick': add(fol, tape('click', .8), t)
    elif ty == 'doors': add(fol, doors(1), t, 1, -.3)
    elif ty == 'depart': add(fol, rumble(2.0, .25), t)
    elif ty == 'whoosh': add(fol, whoosh(.6, .25), t)
    elif ty == 'slap': add(fol, thump(.5, 140), t); add(fol, hp(noise(.08), 1500) * .3, t)
    elif ty == 'ignite': add(fol, burn(1.6, .12), t); add(fol, ignite(.25), t + .7)
    elif ty == 'impact': add(fol, impact(.5 * v), t)
    elif ty == 'punch': add(fol, punchhit(.5), t, 1, -.2)
    elif ty == 'bell': add(fol, bellring(v), t, 1, .2)
    elif ty == 'whispers': add(fol, whispers(e.get('d', 2), v), t, 1, -.3)
    elif ty == 'brakes': add(fol, brakes(e.get('d', 2.6), 1), t)
    elif ty == 'flash': add(fol, flash(.25), t)
    elif ty == 'cap': add(fol, bp(noise(.4), 300, 2000) * np.exp(-tt(.4) * 8) * .08, t)
    elif ty == 'glitch' or ty == 'tapeout': add(fol, tape('noise', .6), t)
    elif ty == 'freeze': add(fol, tape('click', .6), t)
# 서준's shadow peeling: a low swell and a heartbeat under it
add(fol, heartbeat(.35), T['peel'][0] + .2); add(fol, heartbeat(.3), T['peel'][0] + 1.6); add(fol, heartbeat(.3), T['peel'][0] + 3.0)

# —— voices ——
def speaker(y): return bp(y, 380, 2800, 3) * 1.8   # station speaker band
def far(y):
    ir = np.random.default_rng(3).standard_normal(int(.6 * SR)) * np.exp(-np.arange(int(.6 * SR)) / (.12 * SR))
    wet = fftconvolve(y, ir)[:len(y)] * .02; return bp(y, 180, 5000) * .8 + wet
lines = {}
for v in VO:
    y, sr = sf.read(os.path.join(HERE, 'voices', v['id'] + '.wav'))
    y = resample_poly(y, SR, sr) if sr != SR else y
    y = compress(y.astype(np.float64), thr=.2, ratio=3)
    if v['who'] in ('pa', 'driver'): y = speaker(y)
    if v['id'] == 'm5': y = far(y)
    y *= .12 / (np.sqrt(np.mean(y ** 2)) + 1e-9) * ({'driver': .7, 'pa': .9}.get(v['who'], 1.0))
    pan = {'seoha': -.12, 'mujin': .14, 'seojun': -.1, 'pa': 0, 'driver': .05}[v['who']]
    add(voc, y, v['t'], 1, pan); lines[v['id']] = (v['t'], v['t'] + len(y) / SR)

# —— score ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:N]
if len(mus) < N: mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))

def rms_db(x): s = x[np.abs(x).sum(1) > 1e-6] if x.ndim > 1 else x; return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12) if len(s) else -120
def level(x, db): return x * 10 ** ((db - rms_db(x)) / 20)
voc = level(voc, -17); mus = level(mus, -21); amb = level(amb, -32); fol = level(fol, -26)
duck = np.ones(N)
for a, b in lines.values(): duck = np.minimum(duck, 1 - .72 * np.clip(np.minimum((t_all - (a - .25)) / .25, ((b + .4) - t_all) / .4), 0, 1))
mix = voc + mus * duck[:, None] + amb * (.5 + .5 * duck)[:, None] + fol
worst = 99
for k, (a, b) in lines.items():
    i0, i1 = int(a * SR), int(b * SR); mm = (mus * duck[:, None])[i0:i1]
    gap = rms_db(voc[i0:i1]) - (rms_db(mm) if np.abs(mm).max() > 1e-6 else -120); worst = min(worst, gap)
    print(f'{k:4s} voice above music {gap:5.1f} dB')
print('min voice-over-music', round(worst, 1), 'dB')
mix = np.tanh(mix * 1.5) / 1.5
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print(out, round(N / SR, 2), 's')
