#!/usr/bin/env python3
"""mix.py — sound of 「악몽을 지키는 파수꾼 2 — 반딧불의 밤」: ambience beds per place, foley at the picture's event times (events.json,
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
tt = lambda d: np.arange(int(round(d * SR))) / SR
seg = lambda t, a, b: np.clip((t - a) / (b - a), 0, 1)
t_all = np.arange(N) / SR
def curve(keys):
    k = np.array(keys, float); return np.interp(t_all, k[:, 0], k[:, 1])
def loopnoise(d, lo, hi, seed, brownish=False):
    r = np.random.default_rng(seed).standard_normal(int(d * SR) + SR)
    if brownish: r = np.cumsum(r) * .02; r -= np.convolve(r, np.ones(4800) / 4800, 'same')
    x = bp(r, lo, hi, 2)[:int(d * SR)]; return x / (np.abs(x).max() + 1e-9)

# —— ambience beds (gain curves follow the places) ——
SH = {s['id']: (s['a'], s['b']) for s in TL['SHOTS']}
TOWER = [SH['shelf'], (SH['towerRelease'][0], SH['wake'][1])]
in_tower = curve([[0, 0]] + sum([[[a - .3, 0], [a, 1], [b, 1], [b + .3, 0]] for a, b in TOWER], []) + [[DUR, 0]])
dawn = curve([[0, 0], [T['dawn'] - 1.4, 0], [T['dawn'] + 4, 1], [DUR, 1]])          # birds before the cut (J-cut)
hush = curve([[0, 1], [T['crack'] - .1, 1], [T['crack'] + .4, .35], [T['transform'] - .5, .35], [T['transform'] + 2, 1], [DUR, 1]])
fade = curve([[0, 0], [1.2, 1], [T['fadeOut'][0], 1], [DUR, 0]])
for c, s in ((0, 1), (1, 2)):
    wind = loopnoise(DUR, 120, 900, s, True) * (.7 + .3 * np.sin(t_all * .37 + s))
    amb[:, c] += wind * .05 * (1 - in_tower) * (1 - .55 * dawn) * hush * fade
    room = loopnoise(DUR, 50, 260, s + 4, True)
    amb[:, c] += room * .05 * in_tower
# crickets in the town at night, quieter in the palm silence; gone at dawn; birds at dawn
cr = np.zeros(N)
for k in range(int(DUR / .21)):
    t0 = k * .21 + .03 * np.sin(k)
    if (k % 7) in (5, 6): continue
    i = int(t0 * SR); x = tt(.05); bb = np.sin(2 * np.pi * 4300 * x) * np.sin(np.pi * x / .05) ** 2; cr[i:i + len(bb)] += bb[:max(0, min(len(bb), N - i))]
g = (1 - in_tower) * (1 - dawn) * hush
amb[:, 0] += cr * .012 * g; amb[:, 1] += np.roll(cr, 3000) * .010 * g
def bird(seed):
    r = np.random.default_rng(seed); n = r.integers(3, 6); out = np.zeros(int(1.2 * SR))
    for j in range(n):
        x = tt(.09); f = 3200 + r.random() * 1500; ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * x / .09))) / SR) * np.sin(np.pi * x / .09)
        i = int(j * .16 * SR); out[i:i + len(ch)] += ch
    return out
for k in range(22): add(amb, bird(k) * .045 * (.6 if k < 2 else 1), T['dawn'] - 1.0 + k * .7 + (k % 3) * .23, 1, -.6 + (k % 5) * .3)
# fireflies: a faint glassy twinkle while they fly (release, the tower, one at dawn)
def twinkle(v=1.0, f=5200):
    x = tt(.25); return np.sin(2 * np.pi * f * x) * np.exp(-x * 22) * np.minimum(1, x / .004) * v
for a, b, dens in [(T['flyOff'], 62.0, 1.6), (68.8, 85.4, 4.5), (87.6, 103.6, 4.0)]:
    n = int((b - a) * dens)
    for j in range(n): add(amb, twinkle(.03 * rng.uniform(.4, 1), rng.uniform(4200, 7200)), a + rng.random() * (b - a), 1, rng.uniform(-.8, .8))

# —— foley ——
def step(v=1.0, soft=False):
    x = tt(.14); y = lp(noise(.14), 1800 if not soft else 900) * np.exp(-x * 45) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) * .5
    return y * v * (.5 if soft else 1)
def walks(a, b, rate=9, soft=False, pan=0):
    k0 = int(np.ceil(a * rate))
    for k in range(k0, int(b * rate)):
        if k % 2 == 0: add(fol, step(.12 + .03 * (k % 4 == 0), soft), k / rate, 1, pan)
cs = T['collect']; pw = T['patrolWalk']
spans = [(pw[0], cs[0] - .9)] + [(cs[i] + .9, cs[i + 1] - .9) for i in range(len(cs) - 1)] + [(cs[-1] + .9, pw[1])]
for a, b in spans: walks(a, b)
walks(T['noeulOut'][0] + .2, T['noeulOut'][1], rate=7, soft=True, pan=-.2)
def wings(d=1.6, v=1.0, rate=28):
    nz = noise(d); x = np.arange(len(nz)) / SR; am = .5 + .5 * np.sin(2 * np.pi * rate * x) ** 2; y = bp(nz, 300, 2400) * am * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .6
    return y * v
def glass_tick(v=1.0, f=3800):
    x = tt(.08); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 70) + hp(noise(.08), 4000) * np.exp(-x * 120) * .4) * v
def crack(v=1.0):   # a glass crack: a sharp tick, then a crinkle running along it
    d = .9; x = tt(d); y = np.zeros(len(x))
    for j in range(26):
        i = int((j / 26) ** 1.6 * .5 * SR + rng.uniform(0, .01) * SR); g_ = glass_tick(rng.uniform(.2, .8) * (1 - j / 34), rng.uniform(3500, 7800)); y[i:i + len(g_)] += g_[:max(0, len(y) - i)]
    y += hp(noise(d), 3000) * np.exp(-x * 14) * .5
    return y * v
def chime(v=1.0):   # the dialogue box: a soft two-note chime
    x = tt(1.2); return (np.sin(2 * np.pi * 1318 * x) * np.exp(-x * 5) + .6 * np.sin(2 * np.pi * 1975 * x) * np.exp(-x * 6) * (x > .07)) * v
def bell(v=1.0, f=587):   # a small warm bell (a window turning gold)
    x = tt(2.6); return (np.sin(2 * np.pi * f * x) + .45 * np.sin(2 * np.pi * f * 2.0 * x) * np.exp(-x * 1.8) + .2 * np.sin(2 * np.pi * f * 3.01 * x) * np.exp(-x * 3)) * np.exp(-x * 1.5) * np.minimum(1, x / .003) * v
def clink(v=1.0):
    x = tt(.4); return (np.sin(2 * np.pi * 2100 * x) * np.exp(-x * 25) + np.sin(2 * np.pi * 3400 * x) * np.exp(-x * 35) * .5) * v
def set_down(v=1.0):   # the lantern set on stone
    x = tt(.5); return (lp(noise(.5), 700) * np.exp(-x * 30) + np.sin(2 * np.pi * 120 * x) * np.exp(-x * 25) * .6) * v + np.pad(clink(v * .5), (0, len(x) - int(round(.4 * SR))))
def creak(d=.8, v=1.0, f0=420, f1=640, metal=True):   # a small hinge
    x = tt(d); f = f0 + (f1 - f0) * (x / d) + 25 * np.sin(2 * np.pi * 7 * x)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(x)) > (.6 if metal else .8))
    y = bp(y.astype(float), 600 if metal else 250, 3200 if metal else 1500)
    return y * np.sin(np.pi * x / d) ** .7 * v
def bloom(v=1.0):   # the first firefly: a soft warm swell with a shimmer on top
    d = 2.6; x = tt(d); f = 900 + 2600 * (1 - np.exp(-x * 2)); y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2.01))
    return (y * .3 + lp(noise(d), 500) * .5) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 1.5 * v
def rustle(v=1.0, d=.7):
    x = tt(d); return bp(noise(d), 800, 5000) * (.5 + .5 * np.sin(2 * np.pi * 6 * x) ** 2) * np.sin(np.pi * x / d) * v
def sigh(v=1.0):
    x = tt(1.6); return bp(noise(1.6), 300, 1400) * np.sin(np.pi * x / 1.6) ** 2 * v
def lid(v=1.0, f=4200):   # a small glass lid lifting off
    x = tt(.3); g_ = glass_tick(1, f); return np.pad(g_, (0, len(x) - len(g_))) * v + hp(noise(.3), 3000) * np.exp(-x * 30) * v * .15

PENT = [587, 659, 740, 880, 988, 1175]
for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'collect': add(fol, clink(.05), t - .85); add(fol, wings(1.8, .06), t - .7, 1, -.3); add(fol, whoosh(.5, .045), t + .3, 1, .2)
    elif ty == 'rattle':
        x = t; end = T['crack'] if t == T['rattle'][-1] else T['rattle'][-1]
        while x < end - .05: u = (x - T['rattle'][0]) / (T['crack'] - T['rattle'][0]); add(fol, glass_tick(.02 + .06 * u, 3400 + 700 * (int(x * 7) % 3)), x, 1, -.15 + .3 * ((x * 3) % 1)); x += .45 - .37 * u
        add(fol, wings(end - t, .025 + .02 * (t > T['rattle'][0]), 32), t)
    elif ty == 'crack': add(fol, crack(.22), t); add(fol, thump(.08, 70), t)
    elif ty == 'escape': add(fol, wings(.9, .05, 24), t, 1, .3)
    elif ty == 'setDown': add(fol, set_down(.1), t + .25); add(fol, rustle(.02, .5), t - .1)
    elif ty == 'land': add(fol, wings(.45, .04, 18), t - .4, 1, .1)
    elif ty == 'wing': add(fol, wings(.5, .05, 3.2), t, 1, .1); add(fol, heartbeat(.12), t + .05)
    elif ty == 'transform': add(fol, bloom(.16), t - .3); add(fol, bell(.06, 1175), t)
    elif ty == 'flyOff': add(fol, whoosh(.6, .03), t, 1, -.2)
    elif ty == 'openDoor': add(fol, creak(.7, .05), t - .15); add(fol, wings(2.4, .07, 30), t + .4, 1, .2); add(fol, whoosh(1.2, .05), t + .5)
    elif ty == 'winGold': add(fol, bell(.035, PENT[e['i'] % len(PENT)] / (1 if e['i'] < 99 else 2)), t, 1, pan * .8)
    elif ty == 'shelfOpen': add(fol, lid(.03, 3800 + 900 * (int(t * 17) % 4)), t, 1, pan * .7)
    elif ty == 'wake': add(fol, rustle(.04, .9), t); add(fol, sigh(.03), t + .4)
    elif ty == 'doorOpen': add(fol, creak(1.2, .045, 180, 260, metal=False), t - .3, 1, -.3)
    elif ty == 'sit': add(fol, rustle(.04, .8), t, 1, -.1)
    elif ty == 'voice' and e.get('dlg'): add(fol, chime(.03), t - .35)
# the tower's shelf: one big breath of air as the lanterns open (sustained, under the lids)
add(fol, bp(noise(5.0), 200, 1400) * np.sin(np.pi * tt(5.0) / 5.0) ** 2 * .02, 87.4)

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
voc = level(voc, -17); mus = level(mus, -21); amb = level(amb, -31); fol = level(fol, -28)
# per-line auto-duck (down only): music and ambience to ≈10 dB under each line
duck = np.ones(N)
for a, b in lines.values():
    duck = np.minimum(duck, 1 - .72 * np.clip(np.minimum((t_all - (a - .25)) / .25, ((b + .4) - t_all) / .4), 0, 1))
mix = voc + mus * duck[:, None] + amb * (.4 + .6 * duck)[:, None] + fol
for a, b in lines.values():
    i0, i1 = int(a * SR), int(b * SR)
    mm = (mus * duck[:, None])[i0:i1]; gap = rms_db(voc[i0:i1]) - (rms_db(mm) if np.abs(mm).max() > 1e-6 else -120)
    print(f'{[k for k, v in lines.items() if v == (a, b)][0]:4s} voice above music {gap:5.1f} dB')
mix = np.tanh(mix * 1.6) / 1.6
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print(out, round(N / SR, 2), 's')
