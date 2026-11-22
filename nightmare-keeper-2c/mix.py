#!/usr/bin/env python3
"""mix.py — sound of 「악몽을 지키는 파수꾼 2 — C 칠십 년 치 꿈」: ambience beds per place, foley at the picture's event times (events.json,
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
SHOTS = TL['SHOTS']
def where(kind):
    keys = [[0, 0]]
    for s in SHOTS:
        on = 1 if kind(s) else 0; keys += [[s['a'] + .01, on], [s['b'] - .01, on]]
    return curve(keys + [[DUR, 0]])
in_tower = where(lambda s: s['set'] == 'tower')
night_town = where(lambda s: s['set'] == 'town' and s['b'] <= 95.5)
morning = where(lambda s: s['a'] >= 95.3)
fade = curve([[0, 0], [1.0, 1], [T['fadeOut'][0], 1], [DUR, 0]])
for c, s in ((0, 1), (1, 2)):
    wind = loopnoise(DUR, 120, 900, s, True) * (.7 + .3 * np.sin(t_all * .37 + s))
    amb[:, c] += wind * .05 * night_town * fade
    room = loopnoise(DUR, 50, 260, s + 4, True)
    amb[:, c] += room * .05 * in_tower * fade
    breeze = loopnoise(DUR, 300, 2400, s + 8, True)
    amb[:, c] += breeze * .014 * morning * fade
# crickets in the town at night; a stove's crackle in the tower; birds in the morning
cr = np.zeros(N)
for k in range(int(DUR / .21)):
    t0 = k * .21 + .03 * np.sin(k)
    if (k % 7) in (5, 6): continue
    i = int(t0 * SR); x = tt(.05); bb = np.sin(2 * np.pi * 4300 * x) * np.sin(np.pi * x / .05) ** 2; cr[i:i + len(bb)] += bb[:max(0, min(len(bb), N - i))]
amb[:, 0] += cr * .012 * night_town; amb[:, 1] += np.roll(cr, 3000) * .010 * night_town
stove = np.zeros((N, 2))
for k in range(int(DUR * 3)):
    t0 = rng.random() * DUR; x = tt(.02); add(stove, hp(noise(.02), 2000) * np.exp(-x * 200) * .05 * rng.random(), t0, 1, .5)
amb += stove * in_tower[:, None]
def bird(seed):
    r = np.random.default_rng(seed); n = r.integers(3, 6); out = np.zeros(int(1.2 * SR))
    for j in range(n):
        x = tt(.09); f = 3200 + r.random() * 1500; ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * x / .09))) / SR) * np.sin(np.pi * x / .09)
        i = int(j * .16 * SR); out[i:i + len(ch)] += ch
    return out
for k in range(34): add(amb, bird(k) * .045, 95.6 + k * .75 + (k % 3) * .21, 1, -.6 + (k % 5) * .3)
for k in range(5): add(amb, bird(k + 40) * .02, 121.8 + k * .7, 1, .4)

# —— foley ——
def step(v=1.0, soft=False):
    x = tt(.14); y = lp(noise(.14), 1800 if not soft else 900) * np.exp(-x * 45) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) * .5
    return y * v * (.5 if soft else 1)
def walks(a, b, rate=9, soft=False, pan=0, v=.12):
    for k in range(int(np.ceil(a * rate)), int(b * rate)):
        if k % 2 == 0: add(fol, step(v + .03 * (k % 4 == 0), soft), k / rate, 1, pan)
def chime(v=1.0):   # the dialogue box
    x = tt(1.2); return (np.sin(2 * np.pi * 1318 * x) * np.exp(-x * 5) + .6 * np.sin(2 * np.pi * 1975 * x) * np.exp(-x * 6) * (x > .07)) * v
def snore(v=1.0, d=.95):   # a rattling snore: low noise, amplitude-modulated (the soft palate), rising then falling
    x = tt(d); am = .55 + .45 * np.sign(np.sin(2 * np.pi * (26 + 6 * x / d) * x)); env = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 1.2
    y = (bp(noise(d), 80, 700, 2) * am + np.sin(2 * np.pi * np.cumsum(70 + 30 * np.sin(np.pi * x / d)) / SR) * .4 * am) * env
    return y * v
def inhale(v=1.0, d=.7):
    x = tt(d); return bp(noise(d), 600, 3000, 2) * np.sin(np.pi * x / d) ** 2 * v
def pop(v=1.0, f0=320):   # 퐁: a bubble — a quick upward glide and a click
    d = .28; x = tt(d); f = f0 * (1 + 2.2 * (1 - np.exp(-x * 30))); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 14) * np.minimum(1, x / .004)
    y += hp(noise(d), 3000) * np.exp(-x * 120) * .3
    return y * v
def glide(f0, f1, d, v=1.0):   # a slide whistle
    x = tt(d); f = f0 * (f1 / f0) ** (x / d); vib = 1 + .01 * np.sin(2 * np.pi * 6 * x); y = np.sin(2 * np.pi * np.cumsum(f * vib) / SR)
    y += .15 * np.sin(2 * 2 * np.pi * np.cumsum(f) / SR) + bp(noise(d), 800, 3000) * .05
    return y * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .5 * v
def shimmer(d=1.6, v=1.0, f0=1800):
    x = tt(d); f = f0 + 900 * x / d; y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2.01))
    return y * np.sin(np.pi * x / d) * v * .3
def wings(d=1.6, v=1.0, rate=28):
    nz = noise(d); x = np.arange(len(nz)) / SR; am = .5 + .5 * np.sin(2 * np.pi * rate * x) ** 2
    return bp(nz, 300, 2400) * am * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .6 * v
def bell(v=1.0, f=587, d=2.6):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .45 * np.sin(2 * np.pi * f * 2.0 * x) * np.exp(-x * 1.8) + .2 * np.sin(2 * np.pi * f * 3.01 * x) * np.exp(-x * 3)) * np.exp(-x * 1.5) * np.minimum(1, x / .003) * v
def creak(d=.8, v=1.0, f0=420, f1=640, metal=True):
    x = tt(d); f = f0 + (f1 - f0) * (x / d) + 25 * np.sin(2 * np.pi * 7 * x)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(x)) > (.6 if metal else .8))
    return bp(y.astype(float), 600 if metal else 250, 3200 if metal else 1500) * np.sin(np.pi * x / d) ** .7 * v
PENT = [587, 659, 740, 880, 988, 1175, 1319]
for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'snore': add(fol, inhale(.04), t - .85, 1, -.1); add(fol, snore(.22), t - .05, 1, -.1)
    elif ty == 'bigSnore': add(fol, inhale(.07, 1.0), t - 1.1, 1, -.1); add(fol, snore(.42, 1.4), t - .1, 1, -.1); add(fol, thump(.3, 55), t + .35)
    elif ty == 'pop': add(fol, pop(.2, [320, 360, 400, 300, 420, 340, 380, 440, 330, 460][e['i'] % 10]), t, 1, -.2 + .1 * (e['i'] % 5))
    elif ty == 'popSmall':
        for j in range(6): add(fol, pop(.08, 300 + 40 * ((e['i'] + j * 3) % 9)), t + j * .04, 1, -.6 + .2 * j)
    elif ty == 'play': add(fol, shimmer(1.4, .07), t - .2, 1, .2)
    elif ty == 'jump': add(fol, glide(500, 1500, .5, .09), t - .05, 1, .1)
    elif ty == 'thud': add(fol, glide(1400, 380, .45, .08), t - .5, 1, .1); add(fol, thump(.35, 70), t, 1, .1); add(fol, step(.25), t + .02, 1, .1)
    elif ty == 'hatLand': add(fol, pop(.1, 700), t, 1, .1); add(fol, wings(.4, .04, 18), t - .35, 1, .1)
    elif ty == 'stream': add(fol, wings(6.5, .09, 34), t, 1, .3); add(fol, whoosh(2.4, .06), t + 1.2, 1, .2); add(fol, whoosh(2.4, .05), t + 3.6, 1, .4)
    elif ty == 'blueRise': add(fol, bell(.06, 294, 4.0), t); add(fol, shimmer(3.0, .05, 900), t + .2)
    elif ty == 'blueOut': add(fol, whoosh(1.6, .05), t + .4, 1, .3)
    elif ty == 'spin': add(fol, shimmer(1.8, .07, 1400), t)
    elif ty == 'winColor': add(fol, bell(.035, PENT[e['i'] % len(PENT)]), t, 1, pan * .8); add(fol, pop(.05, 500 + 30 * (e['i'] % 7)), t - .05, 1, pan * .8)
    elif ty == 'winKeep': add(fol, bell(.02, 294 if e['i'] % 2 else 330, 2.0), t, 1, pan * .8)
    elif ty == 'spout': add(fol, wings(4.5, .08, 30), t, 1, -.2); add(fol, whoosh(1.6, .07), t + .2, 1, -.3)
    elif ty == 'doorOpen': add(fol, creak(1.2, .05, 180, 260, metal=False), t - .2, 1, -.1)
    elif ty == 'villagerWalk': walks(t, e['t1'], rate=7, soft=True, pan=.3 - .1 * e['i'], v=.1)
    elif ty == 'voice' and e.get('dlg'): add(fol, chime(.03), t - .35)
walks(T['run'][0], T['run'][1], rate=10, v=.13)            # the alley run
walks(T['jump'] - .9, T['jump'], rate=10, v=.12, pan=.1)   # the run-up to the jump
walks(T['noeulOut'][0] + .1, T['noeulOut'][1], rate=7, soft=True, pan=-.1)
# 노을's snores carry on softly under the shadow plays (off screen): the T.snores list already covers 20–45 s

# —— voices: compress, match RMS, characters low-passed ~7 kHz so they sit in the world ——
lines = {}
for v in VO:
    y, sr = sf.read(os.path.join(HERE, 'voices', v['id'] + '.wav'))
    y = resample_poly(y, SR, sr) if sr != SR else y
    y = compress(y.astype(np.float64), thr=.2, ratio=3)
    if v.get('dlg'): y = lp(y, 7000)
    y *= .12 / (np.sqrt(np.mean(y ** 2)) + 1e-9)
    add(voc, y, v['t'], 1, {'h': .12, 'k': -.08, 'v': .18 if v['id'] == 'v1' else -.18}.get(v['id'][0], 0) if v.get('dlg') else 0)
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
