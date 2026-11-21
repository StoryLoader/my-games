#!/usr/bin/env python3
"""srt_cues.py out.json — subtitle cues from timeline.json + voices/dur.json, the same windows the overlay draws (ui.js):
in 0.35 s before the voice; out .95 s after it (dialogue 1.1 s), never into the next line. Dialogue lines carry the speaker."""
import json, os, sys
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(H, 'timeline.json'))); D = json.load(open(os.path.join(H, 'voices', 'dur.json')))
vs = sorted(TL['VO'], key=lambda v: v['t']); cues = []
for i, v in enumerate(vs):
    nxt = vs[i + 1]['t'] - .4 if i + 1 < len(vs) else 1e9
    t1 = min(v['t'] + D[v['id']] + (1.1 if v.get('dlg') else .95), nxt, TL['DUR'])
    cues.append({'t0': round(v['t'] - .35, 2), 't1': round(t1, 2), 'text': (v['who'] + ': ' if v.get('dlg') else '') + v['sub']})
json.dump(cues, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
