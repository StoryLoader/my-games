#!/usr/bin/env python3
"""score.py — the original score of 「막차」, composed here and synthesized from scratch with numpy (no samples, no recordings).
80s Cel Anime palette (STYLE §7): dark synth / city-pop colours — an analog arpeggio, FM electric piano and FM bells, a string pad,
slap bass and gated-reverb drums for the action, a brass hit on the title, one beat of true silence before the decision,
a semitone lift for the last phrase, and the tape running out at the end.
♩ = 96 (one bar 2.5 s), C minor; the sections follow story.js bar for bar.

  $LIB/.venv/bin/python music/score.py      → music/score.wav (48 kHz stereo), music/CUES.md
"""
import os, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000; BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT; DUR = 49 * BAR
N = int((DUR + 3) * SR)
rng = np.random.default_rng(1984)
bus = {k: np.zeros((N, 2)) for k in ('pad', 'keys', 'arp', 'bass', 'drums', 'brass', 'bell')}
cues = []
def T(bar, beat=0.0): return (bar * 4 + beat) * BEAT
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x)
def bp(x, lo, hi, o=2): return sosfilt(sos('band', [lo, hi], o), x)
def env(d, a=.01, r=.2, s=1.0):
    n = int(d * SR); e = np.ones(n) * s; ai = max(1, int(a * SR)); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai) * s; e[-ri:] *= np.linspace(1, 0, ri); return e
def put(b, x, t, g=1.0, pan=0.0):
    i = int(t * SR); x = x.astype(np.float64)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[b][i:i + len(x), 0] += x * g * l * 1.41; bus[b][i:i + len(x), 1] += x * g * r * 1.41

# —— instruments ——
def saw(f, d, det=(-.08, 0, .07)):
    x = tt(d); y = np.zeros(len(x))
    for c in det: ph = rng.random(); y += 2 * ((x * f * 2 ** (c / 12) + ph) % 1) - 1
    return y / len(det)
def pad(m, d, v=.5):   # string pad: detuned saws, slow attack, low-passed
    return lp(saw(hz(m), d, (-.12, -.04, .05, .11)), 2200) * env(d, .8, 1.0) * v * .1
def epiano(m, d=1.6, v=.6):   # FM electric piano: 1:1 carrier, decaying index, bell transient
    x = tt(d); f = hz(m); I = 2.2 * np.exp(-x * 6) + .3
    y = np.sin(2 * np.pi * f * x + I * np.sin(2 * np.pi * f * x)) * np.exp(-x * 2.2)
    y += .25 * np.sin(2 * np.pi * f * 14 * x) * np.exp(-x * 40)
    y[:48] *= np.linspace(0, 1, 48); return y * v * .16
def bell(m, d=2.6, v=.6):   # FM bell: 1:3.5 ratio
    x = tt(d); f = hz(m); y = np.sin(2 * np.pi * f * x + 3 * np.exp(-x * 3) * np.sin(2 * np.pi * f * 3.5 * x)) * np.exp(-x * 1.6)
    y[:48] *= np.linspace(0, 1, 48); return y * v * .16
def arpnote(m, d=.16, v=.5, cut=2400):   # analog arp: square/saw blend through a decaying low-pass
    x = tt(d); f = hz(m); y = .6 * np.sign(np.sin(2 * np.pi * f * x)) + .4 * (2 * ((x * f) % 1) - 1)
    y = lp(y, cut) * np.exp(-x * 9); y[:24] *= np.linspace(0, 1, 24); return y * v * .09
def slap(m, d=.28, v=.7):   # slap bass: bright attack, fast filter sweep
    x = tt(d); f = hz(m); y = 2 * ((x * f) % 1) - 1
    y = lp(y, 900) * np.exp(-x * 7) + lp(y, 3600) * np.exp(-x * 40) * .6 + np.sin(2 * np.pi * f * x) * .5 * np.exp(-x * 5)
    y[:24] *= np.linspace(0, 1, 24); return y * v * .22
def subbass(m, d, v=.6): x = tt(d); return np.sin(2 * np.pi * hz(m) * x) * env(d, .02, .1) * v * .3
def kick(v=1.0):
    x = tt(.4); f = 48 + 110 * np.exp(-x * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9) * v * .7
def snare(v=1.0):   # gated-reverb snare: body + noise, a big room cut off sharply
    x = tt(.36); body = np.sin(2 * np.pi * 190 * x) * np.exp(-x * 30)
    nz = bp(rng.standard_normal(len(x)), 900, 7000) * np.exp(-x * 9)
    room = bp(rng.standard_normal(len(x)), 500, 6000) * .5; gate = (x < .26).astype(float) * np.exp(-x * 2)
    return (body * .6 + nz * .7 + room * gate) * v * .42
def hat(v=.5, open_=False):
    d = .22 if open_ else .05; x = tt(d); return hp(rng.standard_normal(len(x)), 7000) * np.exp(-x * (14 if open_ else 80)) * v * .2
def tom(f=110, v=.7): x = tt(.5); return np.sin(2 * np.pi * np.cumsum(f * (1 + np.exp(-x * 12))) / SR) * np.exp(-x * 7) * v * .5
def brass(ms, d=.9, v=.8):   # brass stab: detuned saws, fast filter bloom
    x = tt(d); y = np.zeros(len(x))
    for m in ms: y += saw(hz(m), d, (-.1, 0, .09))
    y = lp(y, 900) * .5 + lp(y, 4500) * np.exp(-x * 8) * .9
    return y * env(d, .015, .35) * v * .08
def riser(d, v=.6): x = tt(d); return hp(rng.standard_normal(len(x)), 1500) * (x / d) ** 2 * v * .12

# —— harmony ——
CM = [[48, 55, 58, 62, 63], [44, 51, 55, 58, 60], [41, 48, 51, 55, 58], [43, 50, 53, 55, 59]]   # Cm9 · A♭maj7 · Fm9 · G7sus/G
WARM = [[51, 55, 58, 62], [46, 50, 53, 58], [48, 51, 55, 58], [44, 48, 51, 55]]                 # E♭maj7 · B♭ · Cm7 · A♭maj7
LIFT = [[49, 56, 59, 63, 64], [45, 52, 56, 59, 61], [42, 49, 52, 56, 59], [44, 51, 54, 56, 60]]  # the same loop, a semitone up

def pads(b0, b1, prog, v=.5, oct=12):
    for b in range(b0, b1):
        ch = prog[(b - b0) % len(prog)]
        for i, m in enumerate(ch[1:]): put('pad', pad(m + oct - 12, BAR + .6, v), T(b), 1, -.5 + i * .33)
def keys(b0, b1, prog, v=.5, pattern=(0, 1.5, 2.5)):
    for b in range(b0, b1):
        ch = prog[(b - b0) % len(prog)]
        for bt in pattern:
            for m in ch[1:]: put('keys', epiano(m + 12, 1.4, v), T(b, bt), 1, .15)
def arps(b0, b1, prog, v=.5, rate=4, cut=2400, oct=24):
    for b in range(b0, b1):
        ch = prog[(b - b0) % len(prog)]; seq = [ch[0], ch[2], ch[3], ch[4] if len(ch) > 4 else ch[1], ch[3], ch[2]]
        for k in range(4 * rate):
            m = seq[k % len(seq)] + oct; put('arp', arpnote(m, .16, v * (1 if k % rate == 0 else .7), cut), T(b, k / rate), 1, -.4 + .8 * ((k % 6) / 5))
def groove(b0, b1, prog, v=1.0, slapbass=True, four=True):
    for b in range(b0, b1):
        ch = prog[(b - b0) % len(prog)]; root = ch[0] - 12
        for bt in range(4):
            if four or bt in (0, 2): put('drums', kick(v), T(b, bt))
            if bt in (1, 3): put('drums', snare(v), T(b, bt), 1, .05)
            for h in (0, .5): put('drums', hat(.45 * v, open_=(h == .5 and bt == 3)), T(b, bt + h), 1, .3)
        if slapbass:
            for bt, dm in [(0, 0), (.75, 12), (1.5, 0), (2, 7), (2.75, 12), (3.5, 10)]: put('bass', slap(root + dm, .26, .8 * v), T(b, bt))
        else:
            put('bass', subbass(root, BAR * .95, .7 * v), T(b))

# A 0–3: the station that isn't there — pad, a slow cold arpeggio, one FM bell motif
pads(0, 3, [CM[0], CM[0], CM[1]], .45)
arps(0, 3, [CM[0], CM[0], CM[1]], .3, rate=2, cut=1400)
for k, m in enumerate([75, 74, 70, 67]): put('bell', bell(m, 2.4, .45), T(1, k * .75), 1, .2)
put('drums', riser(BAR * .9, .5), T(2, .4))
# B 3–5: the title — brass hit on the downbeat, toms, the arpeggio opens
put('brass', brass([60, 63, 67, 70], 1.2, 1.0), T(3)); put('drums', kick(1.2), T(3)); put('drums', snare(1.1), T(3))
for k in range(4): put('drums', tom(150 - k * 18, .7), T(4, 2 + k * .5))
arps(3, 5, [CM[0], CM[2]], .45, rate=4, cut=3200)
pads(3, 5, [CM[0], CM[2]], .4)
for b in range(3, 5):
    for bt in range(4): put('bass', subbass(36 if b == 3 else 41, BEAT * .9, .6), T(b, bt))
cues.append(('title brass hit', T(3)))
# C 5–12: the car — a soft night groove under the dialogue (FM keys, sub bass, brushed hats)
keys(5, 12, CM, .42)
for b in range(5, 12):
    ch = CM[(b - 5) % 4]; put('bass', subbass(ch[0] - 12, BAR * .95, .5), T(b))
    for bt in range(4): put('drums', hat(.3), T(b, bt + .5), 1, .3)
    put('drums', kick(.5), T(b)); put('drums', kick(.4), T(b, 2.5))
pads(9, 12, CM[1:], .3)
# D 12–14: 서하 close — tension rising
pads(12, 14, [CM[3], CM[3]], .45); arps(12, 14, [CM[3]], .35, rate=4, cut=2000); put('drums', riser(BAR * 2, .5), T(12))
# E 14–17: tracking through the cars → 서준
arps(14, 17, [CM[0], CM[1], CM[0]], .45, rate=4, cut=2600); pads(14, 17, [CM[0], CM[1], CM[0]], .35)
for b in range(14, 16):
    for bt in range(4): put('drums', kick(.6), T(b, bt))
put('brass', brass([59, 62, 65, 68], .8, .8), T(15, 3.6)); cues.append(('서준 stab', T(15, 3.6)))   # the reveal (38.9 s)
# F 17–18: the talisman — music thins to a held low note and a riser into the impact
put('pad', pad(36, BAR + .2, .6), T(17)); put('drums', riser(BAR, .8), T(17))
# G 18–26: the action — full groove, slap bass, gated snare, brass stabs on the punches
groove(18, 26, [CM[0], CM[0], CM[2], CM[3]], 1.0)
arps(18, 26, [CM[0], CM[0], CM[2], CM[3]], .4, rate=4, cut=3400)
put('brass', brass([60, 63, 67], .9, 1.0), T(18))
for p in [T(23), T(23, 2), T(24), T(25), T(25, 2)]: put('brass', brass([55, 58, 62, 65], .5, .9), p); put('drums', snare(1.1), p)
cues.append(('action', T(18)))
# H 26–28: the shadow peels — drums out, a heartbeat kick, a dissonant pad
for b in range(26, 28):
    for bt in (0, .4, 2, 2.4): put('drums', kick(.7 if bt in (0, 2) else .45), T(b, bt))
for m in [48, 54, 59, 63]: put('pad', pad(m, BAR * 2 + .5, .4), T(26))
# I 28–34: the cab — low drone, a ticking clock, sparse eerie bells; the build under 무진's shout
put('pad', lp(saw(hz(36), BAR * 6, (-.05, .05)), 400) * env(BAR * 6, 1.5, 1.0) * .1, T(28))
for b in range(28, 34):
    for bt in range(4): put('drums', hat(.25), T(b, bt), 1, -.2)
for k, (b, m) in enumerate([(29, 79), (30, 75), (31, 78), (32, 74)]): put('bell', bell(m, 3, .35), T(b, 1), 1, .3)
pads(32, 34, [CM[3], CM[3]], .5); put('drums', riser(BAR * 1.6, .7), T(32, 2))
# —— one beat of true silence (T(34, 2.5) → T(34, 3.5)); then the decision ——
SIL0, SIL1 = T(34, 2.5), T(34, 3.5)
pads(34, 36, [WARM[3], WARM[0]], .4); put('bell', bell(79, 3.5, .5), SIL1 + .1)
cues.append(('true silence', SIL0))
# J 36–39: the PA handset — warm chords rising under her announcement
keys(36, 39, WARM[:3], .4, pattern=(0, 2)); pads(36, 39, WARM[:3], .45)
for b in range(36, 39): put('bass', subbass(WARM[(b - 36) % 3][0] - 12, BAR * .95, .45), T(b))
# K 39–41: arrival — the flash: a bright chord, a bell cascade, strings
put('brass', brass([56, 60, 63, 67, 70], 1.6, .9), T(39)); pads(39, 41, [WARM[3], [46, 50, 53, 58]], .55)
for k, m in enumerate([84, 82, 79, 77, 75, 72, 70, 67]): put('bell', bell(m, 2.4, .4), T(39, .25 + k * .25), 1, -.6 + k * .15)
cues.append(('arrival', T(39)))
# L 41–43: the driver's goodbye — soft keys and strings
keys(41, 43, [WARM[0], WARM[3]], .36, pattern=(0,)); pads(41, 43, [WARM[0], WARM[3]], .4)
# M 43–46: wake — a light city-pop groove returns (no slap; soft kick, keys, bass)
keys(43, 46, WARM, .4); groove(43, 46, WARM, .55, slapbass=False, four=False)
# N 46–49: the semitone lift for the last phrase; a brass stab on the freeze; the tape runs out
keys(46, 49, LIFT, .45); pads(46, 49, LIFT, .45); groove(46, 48, LIFT, .7, slapbass=True)
FREEZE = T(47) + 1.0
put('brass', brass([61, 64, 68, 71], 1.0, 1.0), FREEZE); put('drums', snare(1.0), FREEZE); put('drums', kick(1.0), FREEZE)
for k, m in enumerate([85, 80, 76, 73]): put('bell', bell(m, 2.6, .4), FREEZE + .3 + k * .2)
cues.append(('semitone lift', T(46))); cues.append(('freeze stab', FREEZE))

# —— mix the buses; true silence; the tape runs out (pitch and level sag, then nothing) ——
LEV = {'pad': 1.0, 'keys': .9, 'arp': .8, 'bass': 1.0, 'drums': .9, 'brass': .9, 'bell': .8}
out = sum(bus[k] * LEV[k] for k in bus)
for c in range(2): out[:, c] = out[:, c] - .3 * lp(out[:, c], 90)
i0, i1 = int(SIL0 * SR), int(SIL1 * SR); f = int(.02 * SR)
out[i0 - f:i0] *= np.linspace(1, 0, f)[:, None]; out[i0:i1] = 0
TAPE = DUR - .9
k0, k1 = int(TAPE * SR), int((DUR - .1) * SR)
idx = np.arange(k0, k1); sag = (idx - k0) / (k1 - k0)   # read slower and slower: the tape drags to a stop
src = k0 + np.cumsum(1 - .85 * sag ** 1.5)
for c in range(2): out[k0:k1, c] = np.interp(src, np.arange(len(out)), out[:, c]) * (1 - sag) ** 1.2
out[k1:] = 0
out = out[:int(DUR * SR)]
out /= max(1e-9, np.abs(out).max()); out *= .85
with wave.open(os.path.join(HERE, 'music', 'score.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
with open(os.path.join(HERE, 'music', 'CUES.md'), 'w') as fh:
    fh.write('# Score cues (music/score.py)\n\nC minor, ♩ = 96 (bar 2.5 s); last phrase a semitone up.\n\n| cue | t |\n|---|---|\n' + ''.join(f'| {a} | {b:.2f} |\n' for a, b in cues))
print('music/score.wav', round(len(out) / SR, 2), 's')
