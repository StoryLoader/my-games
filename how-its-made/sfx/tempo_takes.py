#!/usr/bin/env python3
"""tempo_takes.py — play this video's narration takes a little faster, same voice, same pitch.

The user asked for it on 2026-11-14 ("나레이션은 그대로가되 배속을 살짝 높이고" — the voice sounded sleepy), which
overrides the skill's default of never changing the speed of a take. Only this project does it.

  python3 sfx/tempo_takes.py <project dir> [factor]      (default factor 1.12)

For every take named in js/cues.js (.tts-cache/<take>.pcm, 16-bit mono 44.1 kHz as Fish Audio returned it) that is not
yet stretched: the original is kept outside the project (~/.cache/tempo-takes/<project>/<take>.pcm) and the take is
replaced by ffmpeg's rubberband
time-stretch (tempo only; the pitch stays). .tts-cache/tempo.json remembers which takes are done, so running it again
after new takes were recorded stretches only those. The skill's check.mjs reports the stretched takes as changed since
tts.mjs wrote them — that report is true and is left standing (generated.json is not touched); copy the originals back
and delete tempo.json to return to 1x. Afterwards: delete every "cut" in script.json, run tts.mjs, read
the takes (wave.mjs --unreviewed), set the cuts, run tts.mjs again — the timings then come from the faster takes.
"""
import json, os, re, shutil, subprocess, sys

proj = sys.argv[1]
factor = float(sys.argv[2]) if len(sys.argv) > 2 else 1.12
cache = os.path.join(proj, '.tts-cache')
orig = os.path.join(os.path.expanduser('~/.cache/tempo-takes'), os.path.basename(os.path.abspath(proj))); os.makedirs(orig, exist_ok=True)
man_path = os.path.join(cache, 'tempo.json')
man = json.load(open(man_path)) if os.path.exists(man_path) else {'factor': factor, 'takes': {}}
if abs(man['factor'] - factor) > 1e-9:
    sys.exit(f"this cache was stretched ×{man['factor']} — copy the originals back from ~/.cache/tempo-takes first to use another factor")

takes = re.findall(r'"take":\s*"([0-9a-f]+)"', open(os.path.join(proj, 'js', 'cues.js'), encoding='utf-8').read())
done = 0
for k in takes:
    if k in man['takes']: continue
    src = os.path.join(cache, k + '.pcm'); keep = os.path.join(orig, k + '.pcm'); tmp = src + '.tmp'
    if not os.path.exists(keep): shutil.copy2(src, keep)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', '44100', '-ac', '1', '-i', keep,
                    '-af', f'rubberband=tempo={factor}', '-f', 's16le', '-ar', '44100', '-ac', '1', tmp], check=True)
    os.replace(tmp, src)
    man['takes'][k] = {'before': os.path.getsize(keep) / 88200, 'after': os.path.getsize(src) / 88200}
    done += 1
json.dump(man, open(man_path, 'w'), indent=1)
tot_b = sum(man['takes'][k]['before'] for k in takes if k in man['takes']); tot_a = sum(man['takes'][k]['after'] for k in takes if k in man['takes'])
print(f'×{factor}: {done} take(s) stretched now, {len(takes)} in use · {tot_b:.1f}s → {tot_a:.1f}s')
