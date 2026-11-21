#!/usr/bin/env python3
"""mix.py — the sound of 「네 컷」: room tone per place, foley at the picture's event times (events.json, exported from the page's
window.EV), the score (music/score.wav) ducked under every line, and the voices (voices/*.wav at the times in timeline.json).
Everything is synthesized here (the library's core/audio/sfx.py helpers + numpy); nothing recorded or downloaded.
STYLE §7: a mechanical, printed world — the thermal printer's rows, relays and shutters, the flash charging, curtain rings,
fluorescent hum, a stamp, a pushpin, beads on a hard floor, a fax tone for the wipe. The booth's voice comes through a small
speaker; the girl whispers; 서하's last line is heard through the glass of the photograph.

  $LIB/.venv/bin/python mix.py [out.wav]     → mix.wav (48 kHz stereo, −16 LUFS integrated, true peak ≤ −3 dBTP)
"""
import json, os, subprocess, sys, wave
import numpy as np
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, lp, hp, bp, noise, add, compress, limit, thump, clack, click, whoosh   # noqa: E402
from scipy.signal import resample_poly, fftconvolve                                 # noqa: E402
import soundfile as sf                                                               # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T, DUR, BEAT = TL['T'], TL['DUR'], TL['BEAT']
SH = {s[0]: (s[2], s[3]) for s in TL['SHOTS']}
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
WHO = {l['id']: l['who'] for l in json.load(open(os.path.join(HERE, 'lines.json')))}
N = int(DUR * SR); rng = np.random.default_rng(24)
amb, fol, voc = (np.zeros((N, 2)) for _ in range(3))
tt = lambda d: np.arange(int(round(d * SR))) / SR
t_all = np.arange(N) / SR
def curve(keys): k = np.array(keys, float); return np.interp(t_all, k[:, 0], k[:, 1])
def gate(spans, ramp=.03):
    keys = [[0, 0]]
    for a, b in spans: keys += [[max(0, a - ramp), 0], [a, 1], [b, 1], [b + ramp, 0]]
    keys.append([DUR, 0]); keys.sort(); return curve(keys)
def loopnoise(d, lo, hi, seed):
    r = np.random.default_rng(seed).standard_normal(int(d * SR) + SR); x = bp(r, lo, hi, 2)[:int(d * SR)]; return x / (np.abs(x).max() + 1e-9)

# —— where we are: the shop (fluorescent hum), the booth (closer, the fan), the alley (wind, a far city) ——
ALLEY = [SH['two'], SH['glide']]
BOOTH = [SH['lens1'], SH['shoulder'], SH['lens4'], (T['resolve'][0], SH['fall'][1])]
SHOP = [SH['print'], SH['title'], SH['wall'], SH['curtain'], SH['outside'], SH['release'], SH['print2'], SH['mujin'], SH['door'], (SH['fall'][0], T['resolve'][0]), SH['end']]
in_alley, in_booth, in_shop = gate(ALLEY), gate(BOOTH), gate(SHOP)
dark = curve([[0, 1], [T['dark'], 1], [T['dark'] + .05, 0], [SH['end'][0], 0], [SH['end'][0] + .1, 1], [DUR, 1]])
for c in (0, 1):
    hum = (np.sin(2 * np.pi * 120 * t_all + c) * .6 + np.sin(2 * np.pi * 240 * t_all) * .25 + loopnoise(DUR, 2000, 6000, c) * .15)
    amb[:, c] += hum * .02 * (in_shop + in_booth * .6) * dark
    fan = loopnoise(DUR, 90, 500, c + 3); amb[:, c] += fan * .04 * in_booth * dark
    wind = loopnoise(DUR, 120, 1200, c + 7) * (.6 + .4 * np.sin(2 * np.pi * .07 * t_all + c)); amb[:, c] += wind * .05 * in_alley
    city = loopnoise(DUR, 40, 160, c + 11); amb[:, c] += city * .05 * in_alley

# —— foley ——
def row(v=1.0):   # one thermal-printer row: a stepper tick and a paper hiss
    x = tt(.05); return (bp(noise(.05), 2500, 9000) * np.exp(-x * 120) * .6 + np.sin(2 * np.pi * 1350 * x) * np.exp(-x * 90) * .4) * v
def motor(d, v=1.0):   # the printer's feed motor under the rows
    x = tt(d); y = np.sin(2 * np.pi * np.cumsum(380 + 20 * np.sin(2 * np.pi * 3 * x)) / SR) * .5 + bp(noise(d), 300, 1200) * .5
    return y * np.minimum(1, x / .1) * np.minimum(1, (d - x) / .1) * v
def flash(v=1.0):   # the flash charging (a rising whine), the shutter, the pop
    out = np.zeros(int(1.6 * SR)); x = tt(.7)
    whine = np.sin(2 * np.pi * np.cumsum(2000 + 7000 * (x / .7) ** 2) / SR) * (x / .7) ** 2 * .12
    out[:len(whine)] += whine
    i = int(.7 * SR); s = clack(1.4, .9); out[i:i + len(s)] += s[:len(out) - i]
    p = hp(noise(.5), 1800) * np.exp(-tt(.5) * 9) * .6; th = thump(.5, 120); p[:len(th)] += th * .4
    out[i:i + len(p)] += p[:len(out) - i]
    return out * v
def beep(v=1.0, f=1760): x = tt(.12); return np.sin(2 * np.pi * f * x) * np.minimum(1, (.12 - x) / .02) * v * .25
def stamp(v=1.0): return np.concatenate([thump(1.0, 95)[:int(.25 * SR)] * .8 + np.pad(bp(noise(.06), 600, 4000) * .6, (0, int(.19 * SR))), np.zeros(int(.1 * SR))]) * v
def rings(d=.9, v=1.0):   # curtain rings sliding on a rail
    out = np.zeros(int(d * SR))
    for j in range(14):
        c = clack(rng.uniform(1.6, 2.4), rng.uniform(.15, .35)); i = int(j / 14 * d * .85 * SR); out[i:i + len(c)] += c[:len(out) - i]
    out += bp(noise(d), 400, 3000) * np.sin(np.pi * tt(d) / d) * .25
    return out * v
def breath(d=1.6, v=1.0): x = tt(d); return bp(noise(d), 300, 2400) * np.sin(np.pi * x / d) ** 2 * v * .4
def shimmer(d=1.4, v=1.0):
    x = tt(d); y = sum(np.sin(2 * np.pi * f * x) * np.exp(-x * 2.5) for f in (2793, 3520, 4186, 5274)); return y * v * .06
def flutter(v=1.0): x = tt(.09); return bp(noise(.09), 1200, 7000) * np.exp(-x * 50) * v
def pin(v=1.0): return click(1.6, .8) * v
def snap(v=1.0): x = tt(.08); return hp(noise(.08), 2500) * np.exp(-x * 90) * v * 1.2
def bead(v=1.0): return clack(rng.uniform(1.7, 2.6), v)
def pound(v=1.0, muffled=False):
    y = np.concatenate([thump(v, 70), np.zeros(int(.1 * SR))]); y[:int(.05 * SR)] += bp(noise(.05), 200, 1500) * v * .4
    return lp(y, 350 if muffled else 900)
def fax(d, v=1.0):   # a scanning tone: carrier with a fast line-rate warble
    x = tt(d); return np.sin(2 * np.pi * (2100 * x + 6 * np.sin(2 * np.pi * 28 * x))) * .3 * np.minimum(1, x / .03) * v
def rip(v=1.0): x = tt(.7); return bp(noise(.7), 700, 6000) * (rng.random(len(x)) > .6) * np.exp(-x * 4) * v
def switch(v=1.0): return np.concatenate([click(.8, 1.0), np.zeros(200)]) * v

rows = sorted([e for e in EV if e['type'] == 'row'], key=lambda e: e['t'])
for e in rows: add(fol, row(.5), e['t'], 1, .1)
for a, z in (T['printA'], T['printB'], T['receipt']): add(fol, motor(z - a + .1, .08), a - .05, 1, .1)
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'flash': add(fol, flash(.9 if e['i'] == 3 else .6), t - .7, 1, 0)
    elif ty == 'stamp': add(fol, stamp(.9), t)
    elif ty == 'blink': add(fol, flutter(.3), t, 1, .4)
    elif ty == 'curtain': add(fol, rings(.8, .8), t - .5, 1, -.3)
    elif ty == 'curtainOpen': add(fol, rings(.8, .6), t - .3, 1, -.2)
    elif ty == 'hand': add(fol, breath(1.8, .5), t - .2, 1, .3)
    elif ty == 'mirror': add(fol, shimmer(1.6, .8), t + .4, 1, 0)
    elif ty == 'freed':
        for k in range(60): add(fol, flutter(rng.uniform(.15, .35)), t + rng.uniform(0, T['freed'][1] - T['freed'][0]), 1, rng.uniform(-.6, .6))
        add(fol, thump(.35, 80), t + .7, 1, .3); add(fol, thump(.3, 70), t + 1.0, 1, .4)
    elif ty == 'pin': add(fol, pin(.6), t, 1, .3); add(fol, thump(.2, 160), t, 1, .3)
    elif ty == 'snap':
        add(fol, snap(.8), t, 1, .1)
        for k in range(8):   # beads on the floor: each falls, hits and bounces twice
            t0 = t + .38 + rng.uniform(-.05, .12)
            for j, (dt, g) in enumerate(((0, .45), (.16, .22), (.27, .1))): add(fol, bead(g), t0 + dt + j * .01 + rng.uniform(0, .03), 1, rng.uniform(-.5, .5))
    elif ty == 'push': add(fol, whoosh(2.4, .5), t, 1, 0)
    elif ty == 'through': add(fol, rip(.6), t, 1, 0); add(fol, thump(.7, 60), t, 1, 0)
    elif ty == 'dark': add(fol, switch(.6), t, 1, -.2)
    elif ty == 'wipe': add(fol, fax(.4, .5), t, 1, 0)
# the count on the preview screen (b4): one beep a number
for t in T['count3']: add(fol, beep(.6), t, 1, 0)
# 무진 pounding the curtain that is a wall (his lean peaks: sin(9t)); 서하 pounding the glass from inside (sin(9t) > .7)
for k in range(200):
    t = (np.pi / 2 + 2 * np.pi * k) / 9
    if SH['outside'][0] + .2 < t < SH['outside'][1] - .1: add(fol, pound(.7), t, 1, -.2)
    if T['resolve'][1] < t < T['dark']: add(fol, pound(.55, muffled=True), t, 1, 0)

# —— voices ——
def speaker(y): return np.tanh(bp(y, 420, 3200, 3) * 2.2) * .8   # the booth's little speaker
def whisper(y):
    br = bp(noise(len(y) / SR), 1800, 6500) * np.convolve(np.abs(y), np.ones(480) / 480, 'same') * 3.0
    ir = rng.standard_normal(int(.5 * SR)) * np.exp(-tt(.5) / .09); wet = fftconvolve(y, ir)[:len(y)] * .015
    return hp(y, 250) * .8 + br + wet
def glass(y):
    ir = rng.standard_normal(int(.35 * SR)) * np.exp(-tt(.35) / .05); wet = fftconvolve(lp(y, 2200), ir)[:len(y)] * .02
    return lp(hp(y, 200), 2400) * .9 + wet
lines = {}
for vid, t in TL['VO']:
    y, sr = sf.read(os.path.join(HERE, 'voices', vid + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = resample_poly(y, SR, sr) if sr != SR else y
    y = compress(y.astype(np.float64), thr=.2, ratio=3)
    who = WHO[vid]
    if who == 'booth': y = speaker(y)
    if who == 'ghost': y = whisper(y)
    if vid == 's8': y = glass(y)
    y *= .12 / (np.sqrt(np.mean(y[np.abs(y) > 1e-4] ** 2)) + 1e-9) * {'booth': .8, 'ghost': .85}.get(who, 1.0)
    pan = {'seoha': -.1, 'mujin': .14, 'jieun': -.2, 'booth': 0, 'ghost': .3}[who]
    add(voc, y, t, 1, pan); lines[f'{vid}@{t}'] = (t, t + len(y) / SR)

# —— score ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:N]
if len(mus) < N: mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))

def rms_db(x): s = x[np.abs(x).sum(1) > 1e-6] if x.ndim > 1 else x; return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12) if len(s) else -120
def level(x, db): return x * 10 ** ((db - rms_db(x)) / 20)
voc = level(voc, -17); mus = level(mus, -22); amb = level(amb, -36); fol = level(fol, -25)
duck = np.ones(N)
for a, b in lines.values(): duck = np.minimum(duck, 1 - .82 * np.clip(np.minimum((t_all - (a - .25)) / .25, ((b + .4) - t_all) / .4), 0, 1))
mix = voc + mus * duck[:, None] + amb * (.6 + .4 * duck)[:, None] + fol
worst = 99
for k, (a, b) in lines.items():
    i0, i1 = int(a * SR), int(b * SR); mm = (mus * duck[:, None])[i0:i1]
    gap = rms_db(voc[i0:i1]) - (rms_db(mm) if np.abs(mm).max() > 1e-6 else -120); worst = min(worst, gap)
    print(f'{k:10s} voice above music {gap:5.1f} dB')
print('min voice-over-music', round(worst, 1), 'dB')
mix = hp(mix.T, 40, 2).T
mix = np.tanh(mix * 1.4) / 1.4
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'mix.wav')
def write(x):
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
def measure():
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = r[r.rfind('Summary:'):]; I = float(s.split('I:')[1].split('LUFS')[0]); P = float(s.split('Peak:')[1].split('dBFS')[0]); return I, P
def tplimit(x, ceil, look=.004):   # a true-peak limiter: the gain follows the 4× oversampled peak, held and smoothed so it never lets one through
    from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(1); pk = up[:len(x) * 4].reshape(-1, 4).max(1)
    n = int(look * SR); g = np.minimum(1, ceil / np.maximum(maximum_filter1d(pk, 2 * n + 1), 1e-9))
    g = uniform_filter1d(minimum_filter1d(g, 2 * n + 1), n); return x * g[:, None]
# master to −16 LUFS integrated with the true peak at or under −3 dBTP (gain, then a soft limiter if needed)
write(mix); I, P = measure()
for _ in range(4):
    mix *= 10 ** ((-16 - I) / 20)
    mix = tplimit(mix, 10 ** (-3.4 / 20))
    write(mix); I, P = measure()
    if abs(I + 16) < .3 and P <= -3: break
print(out, round(N / SR, 2), 's', 'integrated', I, 'LUFS', 'true peak', P, 'dBTP')
