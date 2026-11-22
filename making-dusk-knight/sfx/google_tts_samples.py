#!/usr/bin/env python3
"""google_tts_samples.py — Korean male narration samples from Google Cloud Text-to-Speech (REST, v1).
The API key is never in this file. Either the session's network proxy adds the X-Goog-Api-Key header for
texttospeech.googleapis.com (a network secret on the environment), or the environment variable GOOGLE_TTS_API_KEY
holds it and this script sends it in that header (never printed).
  python3 sfx/google_tts_samples.py <out_dir> [voice,voice,…]   → lists ko-KR male voices, writes samples (mp3) + samples.json
"""
import base64, json, os, sys, urllib.request, urllib.error

API = 'https://texttospeech.googleapis.com/v1'
LINE = '방금 보신 장면은, 남은 길이라는 삼십 초짜리 쓰리디 단편의 마지막 팔 초입니다. 오늘은 이 단편을 어떤 글로 주문했는지, 그리고 왜 그렇게 써야 하는지를 하나씩 풀어 보겠습니다.'

def call(path, body=None):
    req = urllib.request.Request(API + path, data=None if body is None else json.dumps(body).encode(), headers={'Content-Type': 'application/json', **({'X-Goog-Api-Key': os.environ['GOOGLE_TTS_API_KEY']} if os.environ.get('GOOGLE_TTS_API_KEY') else {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'HTTP {e.code}: {e.read().decode()[:300]}')

out = sys.argv[1] if len(sys.argv) > 1 else 'samples'
os.makedirs(out, exist_ok=True)
voices = [v for v in call('/voices?languageCode=ko-KR')['voices'] if v.get('ssmlGender') == 'MALE']
rank = lambda n: (0 if 'Chirp3-HD' in n else 1 if 'Chirp-HD' in n else 2 if 'Neural2' in n else 3 if 'Wavenet' in n else 4, n)
names = sorted((v['name'] for v in voices), key=rank)
print(len(names), 'male ko-KR voices:', ', '.join(names))
# the five most natural tiers first: Chirp 3 HD voices, then Neural2 / WaveNet
pick = [v for v in sys.argv[2].split(',')] if len(sys.argv) > 2 else names[:5]
meta = []
for i, n in enumerate(pick, 1):
    r = call('/text:synthesize', {'input': {'text': LINE}, 'voice': {'languageCode': 'ko-KR', 'name': n}, 'audioConfig': {'audioEncoding': 'MP3', 'speakingRate': 1.0}})
    f = os.path.join(out, f'sample{i}_{n}.mp3'); open(f, 'wb').write(base64.b64decode(r['audioContent'])); meta.append({'n': i, 'voice': n, 'file': os.path.basename(f)})
    print('wrote', f)
json.dump({'text': LINE, 'samples': meta}, open(os.path.join(out, 'samples.json'), 'w'), ensure_ascii=False, indent=2)
