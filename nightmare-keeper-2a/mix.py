#!/usr/bin/env python3
"""mix.py — sound of 「악몽을 지키는 파수꾼 2 — A 할머니의 첫 꿈」: ambience beds per place, foley at the picture's event times (events.json,
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
TOWER = [SH[k] for k in ('dream', 'window', 'rope', 'keyhole', 'crisis', 'pull', 'snore')]
in_tower = curve([[0, 0]] + sum([[[max(0, a - .2), 0], [a, 1], [b, 1], [b + .2, 0]] for a, b in TOWER], []) + [[DUR, 0]])
in_tower[:int(.3 * SR)] = 1
dawn = curve([[0, 0], [T['doorOut'][0] - 2.0, 0], [T['doorOut'][0] + 4, 1], [DUR, 1]])
fade = curve([[0, 0], [.8, 1], [T['fadeOut'][0], 1], [DUR, 0]])
for c, s in ((0, 1), (1, 2)):
    wind = loopnoise(DUR, 120, 900, s, True) * (.7 + .3 * np.sin(t_all * .37 + s))
    amb[:, c] += wind * .05 * (1 - in_tower) * (1 - .55 * dawn) * fade
    room = loopnoise(DUR, 50, 260, s + 4, True)
    amb[:, c] += room * .05 * in_tower
cr = np.zeros(N)
for k in range(int(DUR / .21)):
    t0 = k * .21 + .03 * np.sin(k)
    if (k % 7) in (5, 6): continue
    i = int(t0 * SR); x = tt(.05); bb = np.sin(2 * np.pi * 4300 * x) * np.sin(np.pi * x / .05) ** 2; cr[i:i + len(bb)] += bb[:max(0, min(len(bb), N - i))]
g = (1 - in_tower) * (1 - dawn)
amb[:, 0] += cr * .010 * g; amb[:, 1] += np.roll(cr, 3000) * .009 * g
def bird(seed):
    r = np.random.default_rng(seed); n = r.integers(3, 6); out = np.zeros(int(1.2 * SR))
    for j in range(n):
        x = tt(.09); f = 3200 + r.random() * 1500; ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * x / .09))) / SR) * np.sin(np.pi * x / .09)
        i = int(j * .16 * SR); out[i:i + len(ch)] += ch
    return out
for k in range(20): add(amb, bird(k) * .045 * (.6 if k < 2 else 1), T['doorOut'][0] - 1.5 + k * .68 + (k % 3) * .23, 1, -.6 + (k % 5) * .3)
# the swarm: a bed of countless wingbeats, louder as it presses; muffled behind the shutters; gone once the bell scatters it
press = curve([[0, 0], [T['emerge'][0], 0], [T['turn'], .25], [24, .55], [55, .7], [T['rattle'][1], 1.0], [T['bell'], 1.0], [T['bell'] + 3.5, .35], [T['scatter'][1], 0], [DUR, 0]])
shut = curve([[0, 0], [T['shut'], 0], [T['shut'] + .6, 1], [97.5, 1], [98.5, 0], [DUR, 0]])
for c, s in ((0, 11), (1, 12)):
    r = np.random.default_rng(s).standard_normal(N)
    am = .55 + .45 * np.sin(2 * np.pi * (26 + 4 * np.sin(t_all * .3 + s)) * t_all) ** 2
    buzz = bp(r, 250, 2600, 2) * am
    muff = lp(buzz, 650)
    mtrack = buzz * (1 - in_tower * shut) + muff * in_tower * shut * 1.6
    amb[:, c] += mtrack * .022 * press * fade

# —— foley ——
def step(v=1.0, soft=False):
    x = tt(.14); y = lp(noise(.14), 1800 if not soft else 900) * np.exp(-x * 45) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) * .5
    return y * v * (.5 if soft else 1)
def walks(a, b, rate=9, soft=False, pan=0, v=.12):
    k0 = int(np.ceil(a * rate))
    for k in range(k0, int(b * rate)):
        if k % 2 == 0: add(fol, step(v + .03 * (k % 4 == 0), soft), k / rate, 1, pan)
def wings(d=1.6, v=1.0, rate=28):
    nz = noise(d); x = np.arange(len(nz)) / SR; am = .5 + .5 * np.sin(2 * np.pi * rate * x) ** 2; y = bp(nz, 300, 2400) * am * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .6
    return y * v
def glass_tick(v=1.0, f=3800):
    x = tt(.08); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 70) + hp(noise(.08), 4000) * np.exp(-x * 120) * .4) * v
def crack(v=1.0):
    d = .9; x = tt(d); y = np.zeros(len(x))
    for j in range(26):
        i = int((j / 26) ** 1.6 * .5 * SR + rng.uniform(0, .01) * SR); g_ = glass_tick(rng.uniform(.2, .8) * (1 - j / 34), rng.uniform(3500, 7800)); y[i:i + len(g_)] += g_[:max(0, len(y) - i)]
    return (y + hp(noise(d), 3000) * np.exp(-x * 14) * .5) * v
def knock(v=1.0, f=180):   # a moth body against a wooden shutter
    x = tt(.12); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 40) + bp(noise(.12), 400, 2200) * np.exp(-x * 70) * .6) * v
def thud(v=1.0, f=90):
    x = tt(.35); return (np.sin(2 * np.pi * f * x * (1 - .2 * x)) * np.exp(-x * 14) + lp(noise(.35), 500) * np.exp(-x * 25) * .5) * v
def clink(v=1.0):
    x = tt(.4); return (np.sin(2 * np.pi * 2100 * x) * np.exp(-x * 25) + np.sin(2 * np.pi * 3400 * x) * np.exp(-x * 35) * .5) * v
def chime(v=1.0):
    x = tt(1.2); return (np.sin(2 * np.pi * 1318 * x) * np.exp(-x * 5) + .6 * np.sin(2 * np.pi * 1975 * x) * np.exp(-x * 6) * (x > .07)) * v
def tink(v=1.0, f=1175):
    x = tt(1.6); return (np.sin(2 * np.pi * f * x) + .4 * np.sin(2 * np.pi * f * 2.01 * x) * np.exp(-x * 3)) * np.exp(-x * 2.2) * np.minimum(1, x / .003) * v
def creak(d=.8, v=1.0, f0=420, f1=640, metal=True):
    x = tt(d); f = f0 + (f1 - f0) * (x / d) + 25 * np.sin(2 * np.pi * 7 * x)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(x)) > (.6 if metal else .8))
    y = bp(y.astype(float), 600 if metal else 250, 3200 if metal else 1500)
    return y * np.sin(np.pi * x / d) ** .7 * v
def rustle(v=1.0, d=.7):
    x = tt(d); return bp(noise(d), 800, 5000) * (.5 + .5 * np.sin(2 * np.pi * 6 * x) ** 2) * np.sin(np.pi * x / d) * v
def sigh(v=1.0, d=1.6):
    x = tt(d); return bp(noise(d), 300, 1400) * np.sin(np.pi * x / d) ** 2 * v
def bloom(v=1.0):
    d = 2.8; x = tt(d); f = 700 + 2400 * (1 - np.exp(-x * 1.6)); y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2.01))
    return (y * .3 + lp(noise(d), 400) * .6) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 1.4 * v
def snore(v=1.0):   # in: a rising rasp; out: a low flutter
    d1, d2 = 1.0, .9; x1 = tt(d1); x2 = tt(d2)
    inh = bp(noise(d1), 300, 1500) * (.4 + .6 * (np.sin(2 * np.pi * 38 * x1) > 0)) * np.sin(np.pi * x1 / d1) ** 1.5
    exh = (np.sign(np.sin(2 * np.pi * 62 * x2)) * .4 + lp(noise(d2), 600) * .6) * np.sin(np.pi * x2 / d2) ** 1.2
    return np.concatenate([inh * .9, exh * .7]) * v
def rope(v=1.0, d=.7):
    x = tt(d); y = bp(noise(d), 500, 2500) * (np.sin(2 * np.pi * 14 * x) ** 8) * 2 + creak(d, .4, 220, 300, metal=False)
    return y * v
def bell(v=1.0):   # a bronze bell in D: hum, prime, minor tierce, quint, nominal + a few inharmonic partials; the strike; a long decay
    d = 11.0; x = tt(d); f0 = 146.8
    parts = [(.5, 1.0, .35), (1.0, .9, .6), (1.19, .55, .9), (1.5, .45, 1.1), (2.0, .7, 1.4), (2.51, .28, 2.0), (2.66, .22, 2.4), (3.01, .25, 2.6), (4.16, .14, 3.6), (5.43, .08, 4.5)]
    y = sum(a * np.sin(2 * np.pi * f0 * m * x + m) * np.exp(-x * dk) for m, a, dk in parts)
    y *= 1 + .08 * np.sin(2 * np.pi * 2.2 * x)                      # the beat of a real bell
    y += hp(noise(d), 1500) * np.exp(-x * 40) * .8 + lp(noise(d), 200) * np.exp(-x * 9) * .9
    return y * np.minimum(1, x / .002) * v
def footsteps_run(a, b, v=.06, pan=0, rate=5.5):
    t = a
    while t < b: add(fol, step(v * rng.uniform(.6, 1.1), soft=True), t, 1, pan + rng.uniform(-.2, .2)); t += 1 / rate * rng.uniform(.85, 1.15)

big = np.zeros((N, 2))
for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'bloom': add(fol, bloom(.18), t - .2)
    elif ty == 'turn': add(fol, wings(2.6, .16, 30), t - .2, 1, -.3); add(fol, wings(2.6, .16, 33), t, 1, .3); add(fol, whoosh(1.2, .1), t)
    elif ty == 'collect': add(fol, wings(2.2, .09, 30), t - 1.4, 1, -.2); add(fol, whoosh(.8, .07), t - .3, 1, .2); add(fol, clink(.05), t + .3)
    elif ty == 'crack': add(fol, crack(.16), t)
    elif ty == 'shutters': add(fol, creak(.5, .04, 200, 300, metal=False), t - .1, 1, -.2); add(fol, thud(.18, 110), t + .45, 1, -.2); add(fol, thud(.16, 120), t + .62, 1, .2); add(fol, clink(.05), t + .8)
    elif ty == 'rattle':
        x = t
        while x < T['rattle'][1]:
            u = (x - T['rattle'][0]) / (T['rattle'][1] - T['rattle'][0])
            add(fol, knock(.03 + .06 * u, 150 + 70 * (int(x * 7) % 3)), x, 1, -.2 + .4 * ((x * 3) % 1))
            if int(x * 11) % 3 == 0: add(fol, glass_tick(.015 + .025 * u, 3400 + 600 * (int(x * 5) % 3)), x + .03, 1, .1)
            x += .5 - .38 * u
    elif ty == 'keyhole': add(fol, creak(.25, .03, 1800, 2400), t - .1, 1, .4); add(fol, wings(1.2, .06, 26), t, 1, .3)
    elif ty == 'dive': add(fol, whoosh(.5, .08), t, 1, .1); add(fol, thud(.22, 80), t + .65); add(fol, rustle(.04, .5), t + .6)
    elif ty == 'catch': add(fol, thud(.06, 300), t); add(fol, rustle(.03, .3), t)
    elif ty == 'touch': add(fol, rustle(.03, .8), t)
    elif ty == 'walk': walks(t, T['walk'][1], rate=7, soft=True, pan=-.1, v=.1)
    elif ty == 'untie': add(fol, rope(.06, .9), t - .4)
    elif ty == 'pull': add(fol, rope(.09, 1.0), t - .1); add(fol, creak(.8, .03, 300, 520), t + .1, 1, 0)
    elif ty == 'bell': add(big, bell(1.0), t); add(big, bell(.18), t + .35, 1, -.5); add(big, bell(.1), t + .7, 1, .5)
    elif ty == 'snore': add(fol, snore(.12), t)
    elif ty == 'doorTower': add(fol, creak(1.1, .045, 170, 240, metal=False), t - .2, 1, -.2)
    elif ty == 'stretch': add(fol, rustle(.04, .9), t); add(fol, sigh(.04, 1.3), t + .4)
    elif ty == 'winLight': add(fol, tink(.03, [1175, 1319, 1480, 1760][e['i'] % 4]), t, 1, pan * .8)
    elif ty == 'doorOpen': add(fol, creak(.45, .025, 260, 380, metal=False), t, 1, pan * .7); footsteps_run(t + .3, min(98.8, t + 9), v=.05, pan=pan * .6)
    elif ty == 'voice' and e.get('dlg'): add(fol, chime(.03), t - .35)
# the bell's last whisper as the film ends
add(big, bell(.03), 117.8, 1, .2)

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
voc = level(voc, -17); mus = level(mus, -21); amb = level(amb, -31); fol = level(fol, -28); big = level(big, -22)
# per-line auto-duck (down only): music and ambience to ≈10 dB under each line
duck = np.ones(N)
for a, b in lines.values():
    duck = np.minimum(duck, 1 - .72 * np.clip(np.minimum((t_all - (a - .25)) / .25, ((b + .4) - t_all) / .4), 0, 1))
mix = voc + mus * duck[:, None] + amb * (.4 + .6 * duck)[:, None] + fol + big
for a, b in lines.values():
    i0, i1 = int(a * SR), int(b * SR)
    mm = (mus * duck[:, None])[i0:i1]; gap = rms_db(voc[i0:i1]) - (rms_db(mm) if np.abs(mm).max() > 1e-6 else -120)
    print(f'{[k for k, v in lines.items() if v == (a, b)][0]:4s} voice above music {gap:5.1f} dB')
mix = np.tanh(mix * 1.6) / 1.6
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print(out, round(N / SR, 2), 's')
