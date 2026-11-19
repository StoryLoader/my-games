#!/usr/bin/env python3
"""mix_master.py — one soundtrack for live playback: the narration, the film's own sound (the Shorts cut's track, whole at
F0 and the 13-second highlight at H0) and the lecture's effects, mixed into a single file the player starts with the
first click. Separate <video> clips that unmute later can be held back by a browser's autoplay rule (an embedded page,
an artifact); one audio element that starts on the click cannot.

  python3 sfx/mix_master.py        → assets/user/mix/lecture_mix.mp3 (48 kHz stereo, −16 LUFS integrated, true peak −1.5 dB)

The same placements as js/scenes.js: F0 = end of op03 + 0.7 s (film 0–127 s), H0 = end of d04 + 0.3 s (film 109.4 s on,
13 s, 0.3 s in / 0.7 s out). The film is level-matched to the narration as media.js would (−19.2 − (−14.0) dB), the
effects at 0.6. js/audio-master.js points the player at this file in a normal browser; render.py and the review tools
keep the narration + clips (js/scenes.js places the clips only there), so nothing is heard twice.
"""
import json, os, subprocess, tempfile, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
CJ = open(os.path.join(ROOT, 'js', 'cues.js'), encoding='utf-8').read()
D = json.loads(CJ[CJ.index('{'):CJ.rindex('}') + 1]); CUES = {c['id']: c for c in D['cues']}
END = D['duration']; N = int(round(END * SR))
F0 = CUES['op03']['end'] + 0.7
H0 = CUES['d04']['end'] + 0.3; HIN, HDUR = 109.4, 13.0
LEVEL, FILM_LUFS = -19.2, -14.0

def decode(path, ss=None, t=None):
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss)] if ss is not None else []) + ['-i', path] + (['-t', str(t)] if t else []) + ['-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, check=True, capture_output=True).stdout, dtype='<f4')
    return a.reshape(-1, 2).T.copy()

def add(dst, src, at, gain=1.0):
    i = int(round(at * SR)); n = min(src.shape[1], N - i)
    if n > 0: dst[:, i:i + n] += src[:, :n] * gain

mix = np.zeros((2, N), dtype=np.float32)
add(mix, decode(os.path.join(ROOT, 'audio', 'narration.wav')), 0.0)
g = 10 ** ((LEVEL - FILM_LUFS) / 20)
film = os.path.join(ROOT, 'assets', 'user', 'film', 'film_sound.mp4')
add(mix, decode(film), F0, g)
hl = decode(film, HIN, HDUR); n = hl.shape[1]; t = np.arange(n) / SR
env = np.clip(t / 0.3, 0, 1) * np.clip((HDUR - t) / 0.7, 0, 1)
add(mix, hl * env, H0, g)
add(mix, decode(os.path.join(ROOT, 'assets', 'user', 'sfx', 'sfx.mp4')), 0.0, 0.6)

tmp = tempfile.mkdtemp(); raw = os.path.join(tmp, 'mix.wav')
with wave.open(raw, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype('<i2').tobytes())
# two-pass loudness: measure, then a linear gain to −16 LUFS with a true-peak ceiling
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=20:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
J = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-16:TP=-1.5:LRA=20:measured_I={J['input_i']}:measured_TP={J['input_tp']}:measured_LRA={J['input_lra']}"
      f":measured_thresh={J['input_thresh']}:offset={J['target_offset']}:linear=true")
out = os.path.join(ROOT, 'assets', 'user', 'mix'); os.makedirs(out, exist_ok=True)
dst = os.path.join(out, 'lecture_mix.mp3')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', '128k', dst], check=True)
os.remove(raw)
print(f'F0 {F0:.2f} · H0 {H0:.2f} · {END:.2f} s · measured {J["input_i"]} LUFS → −16 → {dst} ({os.path.getsize(dst) / 1e6:.1f} MB)')
