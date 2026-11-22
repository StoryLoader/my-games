#!/usr/bin/env python3
"""tts.py lines.json voices_dir — 막차's voices: Google Cloud Text-to-Speech (Chirp 3: HD) for 서하, 서준 and the PA, and
Fish Audio community voices (free model s2.1-pro-free) for 무진 and the 1984 driver. Same outputs as the library's core/tts/tts.py:
<id>.wav (24 kHz mono, trimmed) and dur.json, so asr_check.py, mix.py and the overlay read them unchanged.

Each sentence is synthesized on its own (markup input: a comma gets [pause short], an ellipsis [pause]) and the sentences
are joined with 0.3 s of silence. Takes are cached by (voice, rate, markup) in voices_dir/.cache/.
The API key is never in this file: the session's network proxy adds it for texttospeech.googleapis.com.
"""
import base64, hashlib, json, os, re, ssl, sys, time, urllib.request, wave
import numpy as np

SR = 24000
CAST = {   # who → (voice, speaking rate). 막차: dialogue only, no narrator.
    'seoha': ('ko-KR-Chirp3-HD-Kore', 1.0),                     # 서하: a cool, firm woman in her late 20s
    'mujin': ('fish:a36c3dd96a79431f87072de815559e97', 0.95),   # 무진: Fish Audio community voice "70대 노스님"
    'seojun': ('ko-KR-Chirp3-HD-Achird', 1.0),                  # 서준: a young man (Puck's "정거장" was misheard)
    'pa': ('ko-KR-Chirp3-HD-Erinome', 0.92),                    # the station PA (band-passed in the mix)
    'driver': ('fish:d7ae98bb52d74c3796208c6d390c5372', 0.85),  # the 1984 driver: Fish Audio community voice "노인" (band-passed, quiet)
}
lines_path, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, '.cache'), exist_ok=True)
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')


def fish_key():
    k = os.environ.get('FISH_API_KEY')
    if k: return k
    env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.claude', 'skills', 'script-to-motion', '.env')
    return [l.split('=', 1)[1].strip().strip('"') for l in open(env) if l.startswith('FISH_API_KEY=')][0]


def synth_fish(text, ref, speed):
    """Fish Audio TTS (free model s2.1-pro-free), raw 16-bit PCM at SR; cached like the Google takes"""
    key = hashlib.sha256(json.dumps(['fish', ref, speed, text]).encode()).hexdigest()[:20]
    cp = os.path.join(out, '.cache', key + '.npy')
    if os.path.exists(cp): return np.load(cp)
    body = json.dumps({'text': text, 'reference_id': ref, 'format': 'pcm', 'sample_rate': SR, 'latency': 'normal', 'prosody': {'speed': speed, 'volume': 0}}).encode()
    for a in range(5):
        try:
            req = urllib.request.Request('https://api.fish.audio/v1/tts', body, {'Authorization': 'Bearer ' + fish_key(), 'Content-Type': 'application/json', 'model': 's2.1-pro-free'})
            y = np.frombuffer(urllib.request.urlopen(req, timeout=180, context=ctx).read(), '<i2').astype(np.float32) / 32768
            np.save(cp, y); return y
        except Exception as e:
            if a == 4: raise
            print('retry', str(e)[:100], file=sys.stderr); time.sleep(2 * 2 ** a)


def synth(markup, voice, rate):
    key = hashlib.sha256(json.dumps([voice, rate, markup]).encode()).hexdigest()[:20]
    cp = os.path.join(out, '.cache', key + '.npy')
    if os.path.exists(cp): return np.load(cp)
    body = json.dumps({'input': {'markup': markup}, 'voice': {'languageCode': 'ko-KR', 'name': voice},
                       'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': SR, 'speakingRate': rate}}).encode()
    for a in range(5):
        try:
            req = urllib.request.Request('https://texttospeech.googleapis.com/v1/text:synthesize', body, {'Content-Type': 'application/json'})
            d = json.load(urllib.request.urlopen(req, timeout=120, context=ctx))
            raw = base64.b64decode(d['audioContent']); i = raw.find(b'data') + 8
            y = np.frombuffer(raw[i:], '<i2').astype(np.float32) / 32768
            np.save(cp, y); return y
        except Exception as e:
            if a == 4: raise
            print('retry', e, file=sys.stderr); time.sleep(2 * 2 ** a)


def trim(y, thr=0.006, edge=0.04):
    idx = np.where(np.abs(y) > thr)[0]
    if not len(idx): return y
    a, b = max(0, idx[0] - int(edge * SR)), min(len(y), idx[-1] + int(edge * SR * 2))
    return y[a:b]


durs = {}
for L in json.load(open(lines_path, encoding='utf-8')):
    voice, rate = CAST[L['who']]
    if L.get('voice'): voice = L['voice']
    sents = [s for s in re.split(r'(?<=[.?!])\s+', L.get('say', L['text']).strip()) if s]
    parts = []
    for s in sents:
        if voice.startswith('fish:'): parts.append(trim(synth_fish(s, voice[5:], rate)))
        else:
            m = s.replace('…', ' [pause] ').replace(',', ', [pause short]')
            parts.append(trim(synth(m, voice, rate)))
        parts.append(np.zeros(int(.3 * SR), np.float32))
    y = np.concatenate(parts[:-1])
    p = os.path.join(out, L['id'] + '.wav')
    with wave.open(p, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    durs[L['id']] = round(len(y) / SR, 3)
    print(f"{L['id']:4s} {durs[L['id']]:5.2f}s  {voice.split('-')[-1]:8s} {L['text']}")
json.dump(durs, open(os.path.join(out, 'dur.json'), 'w'), indent=1)
