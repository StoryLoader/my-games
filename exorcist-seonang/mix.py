#!/usr/bin/env python3
"""mix.py — the sound of 「서낭나무」: ambience beds per place, foley at the picture's event times (events.json, exported from the
page's window.EV by the library's events.mjs), the score (music/score.wav) ducked under every line, and the voices
(voices/*.wav at the times in timeline.json). Everything is synthesized here (numpy + the library's core/audio/sfx.py helpers).
The god's line (g1) is 서하's voice doubled by a lower layer of itself (a phase-vocoder pitch shift, a hair late);
the site manager's first line (k1, small in the wide shot) gets a little distance. True silence for T.hush: only the drip.

  $LIB/.venv/bin/python mix.py [out.wav]       → mix.wav (48 kHz stereo); the viewer's mp3 is loudness-normalized to −14 LUFS
"""
import json, os, sys, wave
import numpy as np
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, lp, hp, bp, noise, add, compress, thump, clack   # noqa: E402
from scipy.signal import resample_poly, fftconvolve, stft, istft    # noqa: E402
import soundfile as sf                                               # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T, DUR, VO = TL['T'], TL['DUR'], TL['VO']
SH = {s[0]: (s[1], s[2]) for s in TL['SHOTS']}
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
N = int(DUR * SR); rng = np.random.default_rng(1205)
amb, fol, voc = (np.zeros((N, 2)) for _ in range(3))
tt = lambda d: np.arange(int(round(d * SR))) / SR
t_all = np.arange(N) / SR
def curve(keys): k = np.array(sorted(keys), float); return np.interp(t_all, k[:, 0], k[:, 1])
def gate(spans, ramp=.25):
    keys = [[0, 0], [DUR, 0]]
    for a, b in spans: keys += [[a - ramp, 0], [a, 1], [b, 1], [b + ramp, 0]]
    return curve(keys)
def loopnoise(d, lo, hi, seed):
    r = np.random.default_rng(seed).standard_normal(int(d * SR) + SR); x = bp(r, lo, hi, 2)[:int(d * SR)]; return x / (np.abs(x).max() + 1e-9)
def fit(x, n): return x[:n] if len(x) >= n else np.pad(x, (0, n - len(x)))

# —— where we are ——
night = gate([(0, SH['vision'][0]), (SH['confront'][0], SH['eyes'][0]), (SH['climb'][0], SH['climax'][1])])
under = gate([SH['vision']]); eyes = gate([SH['eyes']]); dawn = gate([SH['dawn']], 1.0)
site = gate([(0, SH['vision'][0]), (SH['confront'][0], SH['dig'][0])])
for c, s in ((0, 1), (1, 2)):
    wind = loopnoise(DUR, 90, 700, s) * (.7 + .3 * np.sin(2 * np.pi * .07 * t_all + s)) + loopnoise(DUR, 1200, 3500, s + 3) * .06
    amb[:, c] += wind * .05 * (night + .5 * eyes)
    hum = sum(np.sin(2 * np.pi * f * t_all + s * k) * a for k, (f, a) in enumerate([(60, .5), (120, .3), (180, .15)]))   # a far generator / city hum
    amb[:, c] += (hum * .25 + loopnoise(DUR, 40, 160, s + 7) * .6) * .03 * site
    deep = loopnoise(DUR, 30, 220, s + 11) * (.6 + .4 * np.sin(2 * np.pi * .11 * t_all))   # under the ground: a pressure, a slow breathing
    amb[:, c] += deep * .07 * under
    air = loopnoise(DUR, 300, 4000, s + 13)   # dawn: thin open air
    amb[:, c] += air * .012 * dawn

# —— foley ——
def drip(v=1.0):   # an ink drop: a small 'ting' and a wet low dab
    x = tt(.6); y = np.sin(2 * np.pi * 1650 * x * (1 + .1 * np.exp(-x * 30))) * np.exp(-x * 18) * .6 + np.sin(2 * np.pi * 180 * x) * np.exp(-x * 25) * .8
    return y * v
def bristle(d, v=1.0, lo=400, hi=3800):   # a brush on paper: banded hiss with hair grains (no metallic swish)
    x = tt(d); y = bp(noise(d), lo, hi) * .5 + hp(noise(d), 2500) * (rng.random(len(x)) > .992) * 2.5
    return y * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .6 * v
def strokes(d, v=1.0, n=10):   # the title written stroke by stroke
    out = np.zeros(int(d * SR) + SR)
    for k in range(n):
        dd = rng.uniform(.18, .4); i = int((k / n) * d * SR); s = bristle(dd, v * rng.uniform(.6, 1)); out[i:i + len(s)] += s
    return out
def cloth(d, v=1.0):   # cloth strips fluttering: soft flaps
    x = tt(d); y = bp(noise(d), 200, 1400) * (.3 + .7 * np.abs(np.sin(2 * np.pi * 2.3 * x + 3 * np.sin(2 * np.pi * .4 * x)))) ** 2
    return y * np.minimum(1, x / .4) * np.minimum(1, (d - x) / .6) * v
def sealtok(v=1.0):   # the seal pressed: a wooden tok, a paper crackle
    n = int(.3 * SR); y = fit(thump(.8, 160), n) + fit(np.pad(bp(noise(.25), 1500, 6000) * np.exp(-tt(.25) * 20) * .3, (int(.03 * SR), 0)), n)
    return y * v
def step(v=1.0):   # a step on gravel and dust
    x = tt(.22); y = bp(noise(.22), 500, 4000) * np.exp(-x * 22) * (rng.random(len(x)) > .6) + lp(noise(.22), 300) * np.exp(-x * 30) * .6
    return y * v
def bellring(v=1.0, d=1.6):   # 무당방울: a cluster of small brass bells shaken
    out = np.zeros(int(d * SR) + SR)
    for j in range(int(26 * d / 1.6) + 8):
        f = rng.uniform(2600, 5400); x = tt(.5); y = np.sin(2 * np.pi * f * x) * np.exp(-x * rng.uniform(8, 16)) + .4 * np.sin(2 * np.pi * f * 2.7 * x) * np.exp(-x * 20)
        i = int(rng.uniform(0, d * .85) * SR); out[i:i + len(y)] += y * rng.uniform(.3, 1)
    return out * v * .12
def deadbell(v=1.0):   # the bells shaken and nothing rings: dull clicks, a hand's thump
    out = np.zeros(int(1.2 * SR))
    for j in range(14):
        c = clack(rng.uniform(1.6, 2.4), .3); i = int(rng.uniform(0, .9) * SR); out[i:i + len(c)] += c[:len(out) - i]
    return out * v
def bloom(v=1.0, d=2.4):   # ink blooming in water: a low wet swell
    x = tt(d); y = lp(noise(d), 500) * .8 + np.sin(2 * np.pi * 48 * x) * .4
    return y * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 1.5 * v
def engine(d, v=1.0):   # the excavator: a diesel idle, the hydraulic whine when the arm moves
    x = tt(d); f = 32 + 2 * np.sin(2 * np.pi * .3 * x)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + lp(noise(d), 180) * .8
    y = lp(y, 420) * (1 + .25 * np.sin(2 * np.pi * f / 2 * x))
    wh = np.sin(2 * np.pi * np.cumsum(600 + 220 * np.sin(2 * np.pi * .25 * x)) / SR) * .08
    return (y + wh) * np.minimum(1, x / .8) * np.minimum(1, (d - x) / 1.5) * v
def bite(v=1.0):   # the teeth into packed earth
    y = fit(thump(1.0, 60), int(.6 * SR))
    return (y + fit(bp(noise(.5), 300, 3000) * np.exp(-tt(.5) * 9), len(y)) * .6) * v
def tear(v=1.0, d=1.8):   # roots tearing out: creaks and snaps
    x = tt(d); y = bp(noise(d), 120, 900) * .5 * np.exp(-x * 1.2)
    for j in range(16):
        c = clack(rng.uniform(.5, 1.1), rng.uniform(.3, .8)); i = int(rng.uniform(0, d * .8) * SR); y[i:i + len(c)] += c[:len(y) - i]
    return y * v
def crack(d=2.8, v=1.0):   # the ground splitting: a rumble and dry cracks
    x = tt(d); y = lp(noise(d), 120) * 1.2 * np.minimum(1, x / .3) * np.exp(-np.maximum(0, x - d * .6) * 2)
    for j in range(22):
        c = clack(rng.uniform(.4, .9), rng.uniform(.3, .9)); i = int(rng.uniform(0, d * .7) * SR); y[i:i + len(c)] += c[:len(y) - i]
    return y * v
def hungry(d, v=1.0):   # the 아귀: dry breaths, many, and teeth clicking
    x = tt(d); y = np.zeros(len(x))
    for k in range(7):
        f0 = rng.uniform(300, 1100); am = np.clip(np.sin(2 * np.pi * rng.uniform(.5, 1.4) * x + k), 0, 1) ** 2
        y += bp(noise(d), f0, f0 * 2.2) * am * rng.uniform(.4, 1)
    for j in range(int(d * 6)):
        c = clack(rng.uniform(2.2, 3.2), rng.uniform(.05, .2)); i = int(rng.uniform(0, d - .1) * SR); y[i:i + len(c)] += c[:len(y) - i]
    return y * np.minimum(1, x / .8) * np.minimum(1, (d - x) / .8) * v * .5
def strike(v=1.0):   # 무진's beads: a heavy thud and the beads' clatter
    out = fit(thump(1.2 * v, 70), int(.6 * SR))
    for j in range(10): c = clack(rng.uniform(1.3, 1.9), .25 * v); i = int(rng.uniform(0, .15) * SR); out[i:i + len(c)] += c[:len(out) - i]
    return out
def split(v=1.0):   # a wet tear and ink spatter
    x = tt(.7); y = bp(noise(.7), 400, 2600) * np.exp(-x * 7) * .7
    for j in range(12): i = int(rng.uniform(.05, .6) * SR); d = drip(.25)[:int(.12 * SR)]; y[i:i + len(d)] += d[:len(y) - i]
    return y * v
def barefoot(d, v=1.0):   # bare feet on the steel arm: soft palm-taps on metal
    out = np.zeros(int(d * SR) + SR); t = 0
    while t < d:
        x = tt(.3); y = (lp(noise(.3), 250) * np.exp(-x * 30) + np.sin(2 * np.pi * 310 * x) * np.exp(-x * 14) * .25 + np.sin(2 * np.pi * 517 * x) * np.exp(-x * 18) * .12)
        i = int(t * SR); out[i:i + len(y)] += y * rng.uniform(.6, 1); t += rng.uniform(.55, .8)
    return out * v
def whitestroke(v=1.0):   # the flying white: one huge dry brush across the paper
    d = 1.1; x = tt(d); y = bp(noise(d), 250, 5000) * np.exp(-np.maximum(0, x - .35) * 4) * np.minimum(1, x / .04)
    y += hp(noise(d), 3000) * (rng.random(len(x)) > .97) * 1.5 * np.exp(-x * 3)
    return y * v
def sink(d, v=1.0):   # sucked back down: the breaths reversed, a low swell closing
    y = hungry(d, 1)[::-1] * .8; x = tt(d); y = fit(y, len(x)) + lp(noise(d), 160) * (x / d) ** 2 * .9
    return y * v
def birds(d, v=1.0):   # dawn: a few small birds, far
    out = np.zeros(int(d * SR) + SR)
    for j in range(int(d * 1.6)):
        f0 = rng.uniform(2800, 4600); n = rng.integers(2, 6); i = int(rng.uniform(0, d - 1) * SR)
        for k in range(n):
            x = tt(.09); y = np.sin(2 * np.pi * np.cumsum(f0 * (1 + .25 * np.sin(np.pi * x / .09))) / SR) * np.sin(np.pi * x / .09)
            s = i + int(k * .12 * SR); out[s:s + len(y)] += y * rng.uniform(.2, .6)
    return out * v

for e in EV:
    t, ty, v = e['t'], e['type'], e.get('v', 1); d = e.get('d', 1)
    if ty == 'drip': add(fol, drip(.5), t, 1, .1)
    elif ty == 'strips': add(fol, cloth(d, .12), t, 1, .2)
    elif ty == 'brush': add(fol, strokes(d, .3, 11), t, 1, -.1)
    elif ty == 'seal': add(fol, sealtok(.5), t, 1, .15)
    elif ty == 'step': add(fol, step(.18), t, 1, -.25 + .5 * ((e.get('k', 0)) % 2))
    elif ty == 'bell': add(fol, bellring(1.1, d), t, 1, .15)
    elif ty == 'lift': add(fol, cloth(3.0, .3), t, 1, -.1)
    elif ty == 'bloom': add(fol, bloom(.3), t)
    elif ty == 'engine': add(fol, engine(d + 4, .25), t, 1, .25)
    elif ty == 'bite': add(fol, bite(.7), t, 1, .1)
    elif ty == 'tear': add(fol, tear(.5), t, 1, .05)
    elif ty == 'crack': add(fol, crack(d, .55), t, 1, -.15)
    elif ty == 'rise': add(fol, hungry(T['dead'] - t, .7), t, 1, 0)
    elif ty == 'strike': add(fol, strike(.7), t, 1, -.15)
    elif ty == 'split': add(fol, split(.5), t, 1, .1)
    elif ty == 'deadbell': add(fol, deadbell(.6), t, 1, .1)
    elif ty == 'climb': add(fol, barefoot(d, .22), t, 1, 0)
    elif ty == 'white': add(fol, whitestroke(.9), t, 1, 0)
    elif ty == 'sink': add(fol, sink(d, .5), t, 1, 0)
    elif ty == 'close': add(fol, thump(.9, 50)[:int(.8 * SR)], t)
    elif ty == 'birds': add(fol, birds(d, .07), t, 1, .3)
add(fol, hungry(SH['vision'][1] - SH['vision'][0] - 1, .35), SH['vision'][0] + .6, 1, 0)   # the mouths under the roots

# —— voices ——
def pshift(y, semis):   # phase-vocoder pitch shift that keeps the length (stretch, then resample back)
    r = 2 ** (semis / 12); n = 1024; hop = n // 4
    f, t_, Z = stft(y, nperseg=n, noverlap=n - hop); mag, ph = np.abs(Z), np.angle(Z)
    steps = np.arange(0, Z.shape[1] - 1, r); w = 2 * np.pi * hop * np.arange(Z.shape[0]) / n
    acc = ph[:, 0].copy(); out = np.zeros((Z.shape[0], len(steps)), complex)
    for k, s in enumerate(steps):
        i = int(s); fr = s - i; m = (1 - fr) * mag[:, i] + fr * mag[:, i + 1]
        out[:, k] = m * np.exp(1j * acc)
        dp = ph[:, i + 1] - ph[:, i] - w; dp -= 2 * np.pi * np.round(dp / (2 * np.pi)); acc += w + dp
    _, z = istft(out, nperseg=n, noverlap=n - hop)
    z = resample_poly(z, 1000, int(round(1000 * r))) if r != 1 else z
    return fit(z, len(y))
def far(y):
    ir = np.random.default_rng(3).standard_normal(int(.5 * SR)) * np.exp(-np.arange(int(.5 * SR)) / (.09 * SR)); ir /= np.sqrt((ir ** 2).sum())
    return bp(y, 120, 8000) * .9 + fftconvolve(y, ir)[:len(y)] * .07
lines = {}
for v in VO:
    y, sr = sf.read(os.path.join(HERE, 'voices', v['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = resample_poly(y, SR, sr) if sr != SR else y
    y = compress(y.astype(np.float64), thr=.2, ratio=3)
    if v['id'] == 'k1': y = far(y)
    if v['who'] == 'god':
        low = pshift(y, -5); low = np.pad(bp(low, 90, 5000), (int(.028 * SR), 0))[:len(y)]
        ir = np.random.default_rng(5).standard_normal(int(1.2 * SR)) * np.exp(-np.arange(int(1.2 * SR)) / (.25 * SR)); ir /= np.sqrt((ir ** 2).sum())
        y = y * .8 + low * .75; y = y + fftconvolve(y, ir)[:len(y)] * .16
    y *= .12 / (np.sqrt(np.mean(y ** 2)) + 1e-9) * ({'boss': .95}.get(v['who'], 1.0))
    pan = {'seoha': -.12, 'mujin': .14, 'boss': .2, 'god': 0}[v['who']]
    if v['id'] == 'k1': pan = .35
    add(voc, y, v['t'], 1, pan); lines[v['id']] = (v['t'], v['t'] + len(y) / SR)

# —— score ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:N]
if len(mus) < N: mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))

def rms_db(x): s = x[np.abs(x).sum(1) > 1e-6] if x.ndim > 1 else x; return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12) if len(s) else -120
def level(x, db): return x * 10 ** ((db - rms_db(x)) / 20)
fg = 10 ** ((-25 - rms_db(fol)) / 20)
voc = level(voc, -17); mus = level(mus, -21); amb = level(amb, -33); fol = fol * fg
duck = np.ones(N)
for a, b in lines.values(): duck = np.minimum(duck, 1 - .7 * np.clip(np.minimum((t_all - (a - .25)) / .25, ((b + .4) - t_all) / .4), 0, 1))
mix = voc + mus * duck[:, None] + amb * (.55 + .45 * duck)[:, None] + fol
# true silence: everything goes to zero for T.hush, and the one drip is laid back in alone
h0, h1 = T['hush']; hush = 1 - np.clip(np.minimum((t_all - (h0 - .04)) / .04, (h1 - t_all) / .02), 0, 1)
dripbuf = np.zeros((N, 2)); add(dripbuf, drip(.5), T['drip'], 1, .1)
mix = mix * hush[:, None] + dripbuf * fg * (1 - hush)[:, None]
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
