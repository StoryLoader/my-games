#!/usr/bin/env python3
"""mix.py — sound of 「악몽을 지키는 파수꾼 2 — 열두 번째 등불」: ambience beds per place, foley at the picture's event times (events.json,
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

# —— ambience beds: the tower room's low air; outside (wind, crickets) faint through stone, loud when the small window is open;
# dawn birds in the mornings; the town wide under the title ——
SH = {s['id']: (s['a'], s['b']) for s in TL['SHOTS']}
def inside(ids): return curve([[0, 0]] + sum([[[SH[i][0] - .2, 0], [SH[i][0], 1], [SH[i][1], 1], [SH[i][1] + .2, 0]] for i in ids], []) + [[DUR, 0]])
town = inside(['title']); room = 1 - town
morning = inside(['count', 'resolve', 'morning2', 'dawn', 'wink'])
nightO = inside(['night1', 'night2', 'night3', 'reveal', 'decide'])
winOpen = curve([[0, 0], [T['winOpen'], 0], [T['winOpen'] + .8, 1], [SH['decide'][1], 1], [SH['decide'][1] + .5, 0], [DUR, 0]])
hush = curve([[0, 1], [60.4, 1], [61.2, .45], [T['winOpen'], .45], [T['winOpen'] + .5, 1], [DUR, 1]])   # holding his breath
fade = curve([[0, 0], [.8, 1], [T['fadeOut'][0], 1], [DUR, 0]])
for c, s in ((0, 1), (1, 2)):
    wind = loopnoise(DUR, 120, 900, s, True) * (.7 + .3 * np.sin(t_all * .37 + s))
    amb[:, c] += wind * .05 * (town + room * nightO * (.25 + .6 * winOpen)) * fade
    rm = loopnoise(DUR, 50, 260, s + 4, True)
    amb[:, c] += rm * .05 * room * hush * fade
cr = np.zeros(N)
for k in range(int(DUR / .21)):
    t0 = k * .21 + .03 * np.sin(k)
    if (k % 7) in (5, 6): continue
    i = int(t0 * SR); x = tt(.05); bb = np.sin(2 * np.pi * 4300 * x) * np.sin(np.pi * x / .05) ** 2; cr[i:i + len(bb)] += bb[:max(0, min(len(bb), N - i))]
g = (town + room * nightO * (.18 + .8 * winOpen)) * fade
amb[:, 0] += cr * .012 * g; amb[:, 1] += np.roll(cr, 3000) * .010 * g
def bird(seed):
    r = np.random.default_rng(seed); n = r.integers(3, 6); out = np.zeros(int(1.2 * SR))
    for j in range(n):
        x = tt(.09); f = 3200 + r.random() * 1500; ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * x / .09))) / SR) * np.sin(np.pi * x / .09)
        i = int(j * .16 * SR); out[i:i + len(ch)] += ch
    return out
for a_, b_ in [SH['count'], SH['resolve'], SH['morning2'], (SH['dawn'][0], SH['wink'][1] - 1.5)]:
    for k in range(int((b_ - a_) / 1.6)): add(amb, bird(int(a_ * 10) + k) * .028, a_ + .4 + k * 1.6 + (k % 3) * .3, 1, .5 + (k % 3) * .15)
def owl(v=1.0):
    x = tt(1.3); f = 380 + 25 * np.exp(-x * 3); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * ((x < .35) * np.sin(np.pi * x / .35) + (x > .55) * np.sin(np.pi * np.clip((x - .55) / .7, 0, 1)) * .8)
    return lp(y, 1200) * v
add(amb, owl(.03), 26.5, 1, -.5); add(amb, owl(.025), 57.6, 1, .5)

# —— foley ——
def step(v=1.0, soft=False):
    x = tt(.14); y = lp(noise(.14), 1800 if not soft else 900) * np.exp(-x * 45) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) * .5
    return y * v * (.5 if soft else 1)
def walks(a, b, rate=8, soft=False, pan=0):
    for k in range(int(np.ceil(a * rate)), int(b * rate)):
        if k % 2 == 0: add(fol, step(.12 + .03 * (k % 4 == 0), soft), k / rate, 1, pan)
def glass_tick(v=1.0, f=3800):
    x = tt(.08); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 70) + hp(noise(.08), 4000) * np.exp(-x * 120) * .4) * v
def chime(v=1.0):   # the dialogue box
    x = tt(1.2); return (np.sin(2 * np.pi * 1318 * x) * np.exp(-x * 5) + .6 * np.sin(2 * np.pi * 1975 * x) * np.exp(-x * 6) * (x > .07)) * v
def lid(v=1.0):   # the twelfth lantern's lid: always the same two notes (a clue you can hear)
    x = tt(.5); y = np.sin(2 * np.pi * 1760 * x) * np.exp(-x * 18) + .7 * np.sin(2 * np.pi * 2637 * x) * np.exp(-x * 22) * (x > .06)
    return (y + hp(noise(.5), 3500) * np.exp(-x * 60) * .3) * v
def sprinkle(d, v=1.0):
    x = tt(d); y = hp(noise(d), 2500) * (rng.random(len(x)) > .92) * 1.5 + bp(noise(d), 1500, 6000) * .25
    return y * np.sin(np.pi * np.clip(x / d, 0, 1)) ** .5 * v
def scratch(v=1.0):
    x = tt(.6); return bp(noise(.6), 2500, 7000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 9 * x))) * np.sin(np.pi * x / .6) * v
def rustle(v=1.0, d=.7):
    x = tt(d); return bp(noise(d), 800, 5000) * (.5 + .5 * np.sin(2 * np.pi * 6 * x) ** 2) * np.sin(np.pi * x / d) * v
def blow(v=1.0):
    x = tt(.7); return bp(noise(.7), 300, 1800) * np.sin(np.pi * np.clip(x / .5, 0, 1)) ** 2 * v + lp(noise(.7), 200) * np.exp(-x * 8) * v * .3
def creak(d=.9, v=1.0, f0=300, f1=520):
    x = tt(d); f = f0 + (f1 - f0) * (x / d) + 25 * np.sin(2 * np.pi * 7 * x)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(x)) > .7); y = bp(y.astype(float), 400, 2600)
    return y * np.sin(np.pi * x / d) ** .7 * v
def little_bell(v=1.0):   # the bell on the thread: a quick jingle, then ringing
    x = tt(2.4); y = np.zeros(len(x))
    for j, dt in enumerate([0, .07, .15, .21, .33, .5]):
        i = int(dt * SR); f = 2900 + 120 * (j % 3); k = tt(2.4 - dt); y[i:] += (np.sin(2 * np.pi * f * k) + .5 * np.sin(2 * np.pi * f * 2.76 * k) * np.exp(-k * 6)) * np.exp(-k * (3 + j)) * (.9 ** j)
    return y * v
def whoomp(v=1.0):   # the cloth pulled off, the light on
    x = tt(.8); return (bp(noise(.8), 200, 1600) * np.exp(-x * 7) + np.sin(2 * np.pi * 70 * x) * np.exp(-x * 9) * .6) * v
def shimmer(d=2.4, v=1.0):
    x = tt(d); f = 1800 * np.exp(-x * .5) + 700; y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2.01))
    return y * np.sin(np.pi * x / d) * v * .3
def clink(v=1.0):
    x = tt(.4); return (np.sin(2 * np.pi * 2100 * x) * np.exp(-x * 25) + np.sin(2 * np.pi * 3400 * x) * np.exp(-x * 35) * .5) * v
def set_down(v=1.0):
    x = tt(.5); return (lp(noise(.5), 700) * np.exp(-x * 30) + np.sin(2 * np.pi * 120 * x) * np.exp(-x * 25) * .6) * v + np.pad(clink(v * .5), (0, len(x) - int(round(.4 * SR))))
def paws(d, v=1.0):   # soft pads on snow (under the dog's shadow, very low)
    out = np.zeros(int(d * SR))
    for k in range(int(d * 6)):
        i = int(k / 6 * SR + rng.uniform(0, .03) * SR); p = lp(noise(.06), 900) * np.exp(-tt(.06) * 50); out[i:i + len(p)] += p[:max(0, len(out) - i)]
    return out * v

for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'tap': add(fol, glass_tick(.035, 3300 + 300 * e['i']), t + .05, 1, -.2 + .2 * e['i'])
    elif ty == 'click': add(fol, lid(.09), t, 1, .35)
    elif ty == 'blink': add(fol, hp(noise(.15), 1500) * np.exp(-tt(.15) * 30) * .02, t)
    elif ty == 'flour': add(fol, sprinkle(e['d'], .05), t, 1, .3)
    elif ty == 'steps': walks(t, t + e['d'], rate=7 if e.get('soft') else 8, soft=bool(e.get('soft')), pan=.3 if e.get('soft') else 0)
    elif ty == 'scratch': add(fol, glass_tick(.05, 4200), t, 1, .3); add(fol, scratch(.02), t + .1, 1, .3)
    elif ty == 'thread': add(fol, rustle(.03, e['d'] * .6), t + .3, 1, -.1); add(fol, glass_tick(.02, 2900), t + e['d'] - .3, 1, .3)
    elif ty == 'cloth': add(fol, rustle(.04, .9), t, 1, .25)
    elif ty == 'blowOut': add(fol, blow(.05), t - .25, 1, .25)
    elif ty == 'window': add(fol, creak(1.0, .05), t, 1, .6)
    elif ty == 'bell': add(fol, little_bell(.11), t, 1, .35)
    elif ty == 'uncover': add(fol, whoomp(.12), t - .05, 1, .2); add(fol, rustle(.05, .5), t - .1, 1, .2)
    elif ty == 'vision': add(fol, shimmer(3.0, .08), t)
    elif ty == 'setDown': add(fol, set_down(.1), t, 1, -.1)
    elif ty == 'sit': add(fol, rustle(.04, .7), t, 1, -.1); add(fol, rustle(.03, .7), t + .4, 1, .2)
    elif ty == 'dog': add(fol, paws(8.5, .03), t + .3, 1, .1)
    elif ty == 'eye': add(fol, rustle(.015, .4), t - .1, 1, -.3)
    elif ty == 'voice' and e.get('dlg'): add(fol, chime(.03), t - .35)

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
