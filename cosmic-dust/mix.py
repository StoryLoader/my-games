#!/usr/bin/env python3
"""mix.py — the sound of 「마지막 한 프레임」: no music. Only the film's own machinery, synthesized here (the library's
core/audio/sfx.py helpers + numpy; nothing recorded or downloaded), and the narrator.

  · the projector: a steady intermittent clatter — the beat of time — from 0 s, quickening from 103 s toward the dinosaurs,
    stopping dead at 120.0 s. Then TRUE SILENCE (digital zero) until 121.6 s; the first sound after it is the needle's mark.
  · the needle: a scrape for every cut-in (text, the halfway line, the teal band), a dry tick for every mark on the ruler.
  · light: one glockenspiel-like note for every star and every spark of life that switches on; a sine "drawn soundtrack"
    flutter under things that gather or grow; low swells for the Big Bang, the Sun and the extinction flash.
Events come from the page (events.json, exported from window.EV by the library's events.mjs): one timeline for picture and sound.

  $LIB/.venv/bin/python mix.py   → mix.wav (48 kHz stereo, −16 LUFS, ≤ −3 dBTP) and mix_viewer.wav (−14 LUFS after mp3)
"""
import json, os, subprocess, sys, wave
import numpy as np
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, lp, hp, bp, noise, add, compress, thump, whoosh   # noqa: E402
from scipy.signal import resample_poly                                # noqa: E402
import soundfile as sf                                                # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR, EV = E['dur'], E['ev']
FREEZE, NEEDLE = 120.0, 121.6                     # the projector stops; the needle touches the film again
N = int(DUR * SR); rng = np.random.default_rng(1380)
t_all = np.arange(N) / SR
tt = lambda d: np.arange(int(round(d * SR))) / SR
fol, voc = np.zeros((N, 2)), np.zeros((N, 2))

# —— the projector: claw clicks at a rate that quickens toward the dinosaurs, a motor under it; dead stop at 120.0 ——
def rate(t): return 3.2 if t < 103 else 3.2 * (14 / 3.2) ** (((t - 103) / (FREEZE - 103)) ** 2.2)
def claw(v):
    x = tt(.035); c = bp(noise(.035), 1400, 5200) * np.exp(-x * 260) * .9 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 120) * .5
    return c * v
t = .18
while t < FREEZE - .01:
    k = rng.uniform(.85, 1.0); add(fol, claw(.16 * k), t, 1, -.25); add(fol, claw(.07 * k), t + .018, 1, -.25)   # pull-down + shutter
    t += 1 / rate(t)
motor = (np.sin(2 * np.pi * 50 * t_all) * .5 + np.sin(2 * np.pi * 100 * t_all + 1) * .3 + bp(rng.standard_normal(N), 200, 900) * .35) * .012
motor *= np.clip(t_all / .6, 0, 1) * (t_all < FREEZE)
fol[:, 0] += motor * .9; fol[:, 1] += motor * .7

# —— the needle, light and weather of the cosmos ——
def scrape(d, v=1.0):   # a needle cutting emulsion: gritty high noise with a thin squeal riding on it
    x = tt(d); grit = hp(noise(d), 2600) * (.45 + .55 * (rng.random(len(x)) > .55))
    env = np.minimum(1, x / .02) * np.minimum(1, (d - x) / .05)
    sq = np.sin(2 * np.pi * np.cumsum(3100 + 600 * np.sin(2 * np.pi * 2.3 * x) + rng.uniform(-80, 80)) / SR) * .12
    return (lp(grit, 9000) * .55 + sq) * env * v * .5
def tick(v=1.0): x = tt(.03); return (hp(noise(.03), 3000) * np.exp(-x * 420) + np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 300) * .4) * v * .6
def glock(f, v=1.0, soft=False, chord=False):   # a struck bar: the fundamental and its inharmonic overtones
    d = 2.6 if not soft else 1.6; x = tt(d); y = np.zeros(len(x))
    for ff in ([f, f * 1.26, f * 1.5] if chord else [f]):
        y += (np.sin(2 * np.pi * ff * x) * np.exp(-x * (1.6 if not soft else 3)) + np.sin(2 * np.pi * ff * 2.76 * x) * np.exp(-x * 6) * .35
              + np.sin(2 * np.pi * ff * 5.4 * x) * np.exp(-x * 14) * (.15 if not soft else .05))
    y *= np.minimum(1, x / .002); return lp(y, 7000) * v * .16
def flutter(d, f0, f1, v=1.0):   # the drawn optical soundtrack: a sine gliding, its amplitude fluttering at 7 Hz
    x = tt(d); f = f0 * (f1 / f0) ** (x / d); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.75 + .25 * np.sin(2 * np.pi * 7 * x))
    return y * np.sin(np.pi * x / d) ** 1.5 * v * .07
def swell(d, f=38, v=1.0):   # a low swell: a sub sine and dark noise rising and falling
    x = tt(d); env = (x / d) ** .5 * np.exp(-x / (d * .35)); env /= env.max()
    y = np.sin(2 * np.pi * np.cumsum(f * (1 + .4 * x / d)) / SR) * .8 + lp(noise(d), 160) * 1.2
    return y * env * v * .35
def burst(v=1.0):   # a star dying: a crackle that blooms and thins, and a soft thud
    d = 2.2; x = tt(d); cr = bp(noise(d), 500, 6000) * (rng.random(len(x)) > .93) * np.exp(-x * 1.6)
    y = cr * 1.2 + lp(noise(d), 300) * np.exp(-x * 2.5) * .6; th = thump(.8, 60); y[:len(th)] += th * .5; return y * v * .35
def pop(v=1.0): d = .5; x = tt(d); return bp(noise(d), 800, 5000) * (rng.random(len(x)) > .9) * np.exp(-x * 7) * v * .35
def impact(v=1.0):
    d = 1.4; x = tt(d); y = lp(noise(d), 500) * np.exp(-x * 3) * .8; th = thump(1.0, 45); y[:len(th)] += th; return y * v * .55
def mark(v=1.0):   # the needle touching the stopped film: one dry scratch
    x = tt(.16); return (hp(noise(.16), 2000) * np.exp(-x * 30) * .7 + np.sin(2 * np.pi * 2900 * x) * np.exp(-x * 40) * .3) * v * .7
def fall(d, v=1.0): x = tt(d); f = 220 * (70 / 220) ** (x / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) * v * .12

vo_at = {}
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'vo': vo_at[e['id']] = t
    elif ty == 'bang': add(fol, swell(5.5, 32, 1.0), t, 1, 0); add(fol, hp(noise(1.2), 300) * np.exp(-tt(1.2) * 3) * .18, t, 1, 0)
    elif ty == 'swell': add(fol, swell(3.0, 40, e.get('v', 1)), t - .1, 1, 0)
    elif ty == 'cut': add(fol, scrape(e['d'], e.get('v', 1)), t, 1, .15)
    elif ty == 'tick': add(fol, tick(.8), t, 1, -.1)
    elif ty == 'glock': add(fol, glock(e['f'], e.get('v', 1), bool(e.get('soft')), bool(e.get('chord'))), t, 1, rng.uniform(-.4, .4))
    elif ty == 'flutter': add(fol, flutter(e['d'], e['f0'], e['f1']), t, 1, 0)
    elif ty == 'whoosh': add(fol, whoosh(e['d'], .22), t, 1, 0)
    elif ty == 'burst': add(fol, burst(1), t, 1, .1)
    elif ty == 'pop': add(fol, pop(e.get('v', 1)), t, 1, rng.uniform(-.6, .6))
    elif ty == 'impact': add(fol, impact(e.get('v', 1)), t, 1, 0)
    elif ty == 'mark': add(fol, mark(1), t, 1, 0)
    elif ty == 'fall': add(fol, fall(e['d']), t, 1, 0)

# —— the narrator (Algenib), dry and close ——
lines = {}
for vid, t in vo_at.items():
    y, sr = sf.read(os.path.join(HERE, 'voices', vid + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = resample_poly(y, SR, sr) if sr != SR else y
    y = compress(hp(y.astype(np.float64), 70), thr=.2, ratio=3)
    y *= .12 / (np.sqrt(np.mean(y[np.abs(y) > 1e-4] ** 2)) + 1e-9)
    add(voc, y, t, 1, 0); lines[vid] = (t, t + len(y) / SR)

def rms_db(x): s = x[np.abs(x).sum(1) > 1e-6] if x.ndim > 1 else x; return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12) if len(s) else -120
def level(x, db): return x * 10 ** ((db - rms_db(x)) / 20)
voc = level(voc, -17); fol = level(fol, -31)
# effects step back under every line (−6 dB), so the voice always sits on top
duck = np.ones(N)
for a, b in lines.values(): duck = np.minimum(duck, 1 - .5 * np.clip(np.minimum((t_all - (a - .2)) / .2, ((b + .3) - t_all) / .3), 0, 1))
fol *= duck[:, None]
worst = 99
for k, (a, b) in sorted(lines.items(), key=lambda kv: kv[1][0]):
    i0, i1 = int(a * SR), int(min(b, DUR) * SR); f = fol[i0:i1]
    gap = rms_db(voc[i0:i1]) - (rms_db(f) if np.abs(f).max() > 1e-7 else -120); worst = min(worst, gap)
    print(f'{k:4s} {a:6.2f}–{b:6.2f}  voice over effects {gap:5.1f} dB')
print('min voice-over-effects', round(worst, 1), 'dB')
mix = voc + fol
mix = hp(mix.T, 30, 2).T
mix = np.tanh(mix * 1.3) / 1.3
quiet = (t_all >= FREEZE) & (t_all < NEEDLE)   # the stopped projector: digital silence, applied after every filter
def hush(x): x[quiet] = 0; return x
mix = hush(mix)

out = os.path.join(HERE, 'mix.wav')
def write(x, out=out):
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
def measure(out=out):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = r[r.rfind('Summary:'):]; I = float(s.split('I:')[1].split('LUFS')[0]); P = float(s.split('Peak:')[1].split('dBFS')[0]); return I, P
def tplimit(x, ceil, look=.004):   # true-peak limiter: gain follows the 4× oversampled peak, held and smoothed
    from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(1); pk = up[:len(x) * 4].reshape(-1, 4).max(1)
    n = int(look * SR); g = np.minimum(1, ceil / np.maximum(maximum_filter1d(pk, 2 * n + 1), 1e-9))
    g = uniform_filter1d(minimum_filter1d(g, 2 * n + 1), n); return x * g[:, None]
write(mix); I, P = measure()
for _ in range(4):
    mix *= 10 ** ((-16 - I) / 20); mix = hush(tplimit(mix, 10 ** (-3.4 / 20))); write(mix); I, P = measure()
    if abs(I + 16) < .3 and P <= -3: break
print(out, round(N / SR, 2), 's', 'integrated', I, 'LUFS', 'true peak', P, 'dBTP')
vout = os.path.join(HERE, 'mix_viewer.wav'); v = mix.copy()
for _ in range(5):
    v *= 10 ** ((-13.7 - I) / 20); v = hush(tplimit(v, 10 ** (-2.4 / 20))); write(v, vout); I, P = measure(vout)
    if abs(I + 13.7) < .15: break
print(vout, 'integrated', I, 'LUFS', 'true peak', P, 'dBTP')
q = np.abs(v[quiet]).max(); print('freeze 120.0–121.6 s peak', q, '(0 = true silence)')
