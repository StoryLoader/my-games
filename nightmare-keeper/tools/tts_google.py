#!/usr/bin/env python3
"""tts_google.py lines.json voices_dir — Korean voices with Google Cloud Text-to-Speech (Chirp 3: HD), the voice engine the
user chose for this film (2026-11-18: narration + character lines). Same outputs as the library's core/tts/tts.py:
<id>.wav (24 kHz mono, trimmed) and dur.json, so asr_check.py, mix.py and the overlay read them unchanged.

Each sentence is synthesized on its own (markup input: a comma gets [pause short], an ellipsis [pause]) and the sentences
are joined with 0.3 s of silence. Takes are cached by (voice, rate, markup) in voices_dir/.cache/.
The API key is never in this file: the session's network proxy adds it for texttospeech.googleapis.com.
"""
import base64, hashlib, json, os, re, ssl, sys, time, urllib.request, wave
import numpy as np

SR = 24000
CAST = {   # who → (voice, speaking rate). The library's storybook narrator is slow (~.82–.90).
    'narrator': ('ko-KR-Chirp3-HD-Algenib', 0.88),   # the calm male narrator the user chose earlier
    'noeul': ('ko-KR-Chirp3-HD-Gacrux', 0.9),        # the old keeper: a mature woman's voice
    'haru': ('ko-KR-Chirp3-HD-Leda', 1.0),           # the boy: a light, young voice
}
lines_path, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, '.cache'), exist_ok=True)
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')


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
    voice, rate = CAST[L.get('who', 'narrator')]
    sents = [s for s in re.split(r'(?<=[.?!])\s+', L.get('say', L['text']).strip()) if s]
    parts = []
    for s in sents:
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
