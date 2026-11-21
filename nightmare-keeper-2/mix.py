#!/usr/bin/env python3
"""mix.py — sound of 「악몽을 지키는 파수꾼」: ambience beds per place, foley at the picture's event times (events.json,
exported from the page's window.EV), the score (music/score.wav), the voices (voices/*.wav at the times in timeline.json).
All effects are synthesized here (the library's core/audio/sfx.py helpers + numpy); nothing recorded or downloaded.

  $LIB/.venv/bin/python mix.py [out.wav]       → mix.wav (48 kHz stereo); mux.sh sets −14 LUFS afterwards
"""
import json, os, sys, wave
import numpy as np
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, lp, hp, bp, norm, noise, brown, add, compress, thump, heartbeat, rumble, whoosh   # noqa: E402
from scipy.signal import resample_poly                                                             # noqa: E402
import soundfile as sf                                                                             # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T, DUR, VO = TL['T'], TL['DUR'], TL['VO']
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
DURS = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
N = int(DUR * SR); rng = np.random.default_rng(9)
amb, fol, voc = (np.zeros((N, 2)) for _ in range(3))
tt = lambda d: np.arange(int(d * SR)) / SR
seg = lambda t, a, b: np.clip((t - a) / (b - a), 0, 1)
t_all = np.arange(N) / SR
def curve(keys):
    k = np.array(keys, float); return np.interp(t_all, k[:, 0], k[:, 1])
def loopnoise(d, lo, hi, seed, brownish=False):
    r = np.random.default_rng(seed).standard_normal(int(d * SR) + SR)
    if brownish: r = np.cumsum(r) * .02; r -= np.convolve(r, np.ones(4800) / 4800, 'same')
    x = bp(r, lo, hi, 2)[:int(d * SR)]; return x / (np.abs(x).max() + 1e-9)

# —— ambience beds (gain curves follow the places) ——
TOWER = [(7.5, 15.2), (37.5, 53.0)]
in_tower = curve([[0, 0]] + sum([[[a - .3, 0], [a, 1], [b, 1], [b + .3, 0]] for a, b in TOWER], []) + [[DUR, 0]])
dawn = curve([[0, 0], [T['dawn'] + 1, 0], [T['dawn'] + 8, 1], [DUR, 1]])
fade_in = curve([[0, 0], [0.01, 0], [1.2, 1], [DUR, 1]])   # the wind starts before the picture (J-cut)
for c, s in ((0, 1), (1, 2)):
    wind = loopnoise(DUR, 120, 900, s, True) * (.7 + .3 * np.sin(t_all * .37 + s))
    amb[:, c] += wind * .05 * (1 - in_tower) * (1 - .5 * dawn)
    room = loopnoise(DUR, 50, 260, s + 4, True)
    amb[:, c] += room * .05 * in_tower
# crickets in the town at night (pulses of 4.3 kHz), gone at dawn; birds at dawn
cr = np.zeros(N)
for k in range(int(DUR / .21)):
    t0 = k * .21 + .03 * np.sin(k)
    if (k % 7) in (5, 6): continue
    i = int(t0 * SR); x = tt(.05); b = np.sin(2 * np.pi * 4300 * x) * np.sin(np.pi * x / .05) ** 2; cr[i:i + len(b)] += b[:max(0, min(len(b), N - i))]
amb[:, 0] += cr * .012 * (1 - in_tower) * (1 - dawn); amb[:, 1] += np.roll(cr, 3000) * .010 * (1 - in_tower) * (1 - dawn)
def bird(seed):
    r = np.random.default_rng(seed); n = r.integers(3, 6); out = np.zeros(int(1.2 * SR))
    for j in range(n):
        x = tt(.09); f = 3200 + r.random() * 1500; ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * x / .09))) / SR) * np.sin(np.pi * x / .09)
        i = int(j * .16 * SR); out[i:i + len(ch)] += ch
    return out
for k in range(18): add(amb, bird(k) * .05, T['dawn'] + 3 + k * .48 + (k % 3) * .2, 1, -.6 + (k % 5) * .3)

# —— foley ——
def step(v=1.0, soft=False):
    x = tt(.14); y = lp(noise(.14), 1800 if not soft else 900) * np.exp(-x * 45) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) * .5
    return y * v * (.5 if soft else 1)
def walks(a, b, rate=9, soft=False, pan=0):
    k0 = int(np.ceil(a * rate))
    for k in range(k0, int(b * rate)):
        if k % 2 == 0: add(fol, step(.12 + .03 * (k % 4 == 0), soft), k / rate, 1, pan)
cs = T['collect']; pw = T['patrolWalk']
spans = [(pw[0], cs[0] - .9)] + [(cs[i] + .7, cs[i + 1] - .9) for i in range(len(cs) - 1)] + [(cs[-1] + .7, pw[1])]
for a, b in spans: walks(a, b)
s0, s1, s2 = T['chaseStops']
for a, b in [(61.6, s0 - .4), (s0 + 2.4, s1 - .4), (s1 + 2.4, s2 - .4), (s2 + 2.4, 80.8), (82.6, 89.2)]: walks(a, b)
walks(108.9, 110.2, rate=8, soft=True, pan=.2)
def wings(d=1.6, v=1.0, rate=28):
    x = tt(d); am = .5 + .5 * np.sin(2 * np.pi * rate * x) ** 2; y = bp(noise(d), 300, 2400) * am * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .6
    return y * v
def glass_tick(v=1.0, f=3800):
    x = tt(.08); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 70) + hp(noise(.08), 4000) * np.exp(-x * 120) * .4) * v
def shatter(v=1.0, d=1.6):
    x = tt(d); y = np.zeros(len(x))
    for j in range(60):
        i = int(abs(rng.normal(0, .25)) * SR); g = glass_tick(rng.uniform(.2, 1), rng.uniform(2500, 7500)); y[i:i + len(g)] += g[:max(0, len(y) - i)]
    y += hp(noise(d), 2500) * np.exp(-x * 9) * .6
    return y * v
def chime(v=1.0):   # the dialogue box: a soft two-note chime
    x = tt(1.2); return (np.sin(2 * np.pi * 1318 * x) * np.exp(-x * 5) + .6 * np.sin(2 * np.pi * 1975 * x) * np.exp(-x * 6) * (x > .07)) * v
def low_bell(v=1.0, f=196):
    x = tt(3.0); return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 1.5) + .25 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 3)) * np.exp(-x * 1.1) * v
def clink(v=1.0):
    x = tt(.4); return (np.sin(2 * np.pi * 2100 * x) * np.exp(-x * 25) + np.sin(2 * np.pi * 3400 * x) * np.exp(-x * 35) * .5) * v
def gutter(v=1.0):
    x = tt(1.3); y = bp(noise(1.3), 300, 2000) * (rng.random(len(x)) > .97) * 3 + lp(noise(1.3), 400) * np.exp(-x * 3) * .4
    return y * np.exp(-x * 1.4) * v
def shimmer(d=2.4, v=1.0):
    x = tt(d); f = 2400 * np.exp(-x * .7) + 600; y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2.01))
    return y * np.sin(np.pi * x / d) * v * .3
def sigh(v=1.0):
    x = tt(1.6); return bp(noise(1.6), 300, 1400) * np.sin(np.pi * x / 1.6) ** 2 * v
def flare(v=1.0):
    x = tt(.7); return lp(noise(.7), 1200) * np.exp(-x * 5) * np.minimum(1, x / .03) * v

for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'collect': add(fol, wings(1.6, .05), t - 1.2, 1, -.3); add(fol, whoosh(.5, .05), t - .1, 1, .2); add(fol, flare(.05), t + .1)
    elif ty == 'collectBig': add(fol, wings(2.0, .07), t + .1, 1, .2); add(fol, whoosh(.6, .07), t + 1.2); add(fol, flare(.07), t + 1.6)
    elif ty == 'knock':
        x = t
        while x < T['burst'] - .05: u = (x - t) / (T['burst'] - t); add(fol, glass_tick(.03 + .07 * u, 3600 + 600 * (int(x * 7) % 3)), x, 1, -.2 + .4 * ((x * 3) % 1)); x += .5 - .42 * u
    elif ty == 'rumble': add(fol, rumble(4.4, .16), t)
    elif ty == 'crack': add(fol, hp(noise(.3), 3000) * np.exp(-tt(.3) * 12) * .1, t); add(fol, glass_tick(.08, 5200), t)
    elif ty == 'burst': add(fol, shatter(.32, 2.2), t); add(fol, thump(.4, 52), t); add(fol, wings(3.2, .14, 34), t + .1, 1, .3); add(fol, whoosh(.9, .12), t + .05, 1, -.3)
    elif ty == 'shatter': add(fol, shatter(.1, .9), t, 1, rng.uniform(-.6, .6))
    elif ty == 'winViolet': add(fol, low_bell(.05, 196 if e['i'] % 2 else 220), t, 1, pan * .8)
    elif ty == 'winOff': add(fol, glass_tick(.012, 2600), t, 1, pan * .8)
    elif ty == 'lift': add(fol, clink(.05), t)
    elif ty == 'gutter': add(fol, gutter(.12), t - .4)
    elif ty == 'heart': add(fol, heartbeat(.5), t)
    elif ty == 'handover': add(fol, clink(.06), t); add(fol, sigh(.03), t - .2)
    elif ty == 'shrink': add(fol, shimmer(2.4, .1), t)
    elif ty == 'sleep': add(fol, sigh(.035), t + .1)
    elif ty == 'voice' and e.get('dlg'): add(fol, chime(.03), t - .35)
# the big moth's slow wingbeat while it sits on the roof (low, soft)
for k in range(int((T['shrink'][0] - 81) / .77)):
    t = 81 + k * .77
    if T['refuse'] < t < T['refuse'] + 1.6 or T['nearlyOut'] - .4 < t < T['relight']: continue
    add(fol, lp(noise(.5), 500) * np.sin(np.pi * tt(.5) / .5) ** 2 * .02, t, 1, .4)

# —— voices: compress, match RMS, characters low-passed ~7 kHz so they sit in the world ——
lines = {}
for v in VO:
    y, sr = sf.read(os.path.join(HERE, 'voices', v['id'] + '.wav'))
    y = resample_poly(y, SR, sr) if sr != SR else y
    y = compress(y.astype(np.float64), thr=.2, ratio=3)
    if v.get('dlg'): y = lp(y, 7000)
    y *= .12 / (np.sqrt(np.mean(y ** 2)) + 1e-9)
    add(voc, y, v['t'], 1, .12 if v.get('dlg') and v['id'].startswith('h') else (-.08 if v.get('dlg') else 0))
    lines[v['id']] = (v['t'], v['t'] + len(y) / SR)

# —— music ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:N]
if len(mus) < N: mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))

# levels by RMS: voice −17, music −21, ambience −30, foley −27 dB RMS
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x[np.abs(x).sum(1) > 1e-6] ** 2)) + 1e-12)
def level(x, db): return x * 10 ** ((db - rms_db(x)) / 20)
voc = level(voc, -17); mus = level(mus, -20); amb = level(amb, -31); fol = level(fol, -28)
# per-line auto-duck (down only): music and ambience to ≈10 dB under each line
duck = np.ones(N)
for a, b in lines.values():
    duck = np.minimum(duck, 1 - .62 * np.clip(np.minimum((t_all - (a - .25)) / .25, ((b + .4) - t_all) / .4), 0, 1))
mix = voc + mus * duck[:, None] + amb * (.4 + .6 * duck)[:, None] + fol
for a, b in lines.values():
    i0, i1 = int(a * SR), int(b * SR)
    gap = rms_db(voc[i0:i1]) - rms_db((mus * duck[:, None])[i0:i1] + 1e-9)
    print(f'{[k for k, v in lines.items() if v == (a, b)][0]:4s} voice above music {gap:5.1f} dB')
mix = np.tanh(mix * 1.6) / 1.6
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print(out, round(N / SR, 2), 's')
