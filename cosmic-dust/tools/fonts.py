#!/usr/bin/env python3
"""fonts.py — subset the film's three fonts to exactly the characters it prints (every string literal with Hangul in js/*.js —
the promise, the subtitles, the labels, the ruler — plus every digit and sign the clock and the year readout can produce),
write fonts/*-sub.woff2 + fonts/chars.txt, then check that every character is in every subset (0 missing glyphs is the bar).

  $LIB/.venv/bin/python tools/fonts.py
"""
import glob, os, re, subprocess, sys
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = [   # page family, source, subset file
    ('TITLE', 'BlackHanSans-Regular.ttf', 'blackhansans-sub.woff2'),
    ('MONO', 'D2CodingBold.ttf', 'd2coding-sub.woff2'),
    ('SUBF', 'GowunDodum-Regular.ttf', 'gowundodum-sub.woff2'),
]
chars = set('0123456789:,.·=≈- ')                                   # clock "1:59", years "5,750만 년 전", "4.6억"
for f in glob.glob(os.path.join(HERE, 'js', '*.js')):
    src = open(f, encoding='utf-8').read()
    for m in re.finditer(r"'([^'\n]*)'|`([^`]*)`|\"([^\"\n]*)\"", src):
        s = next(g for g in m.groups() if g is not None)
        if re.search(r'[가-힣]', s): chars |= set(s.replace('\\n', '\n'))
chars = ''.join(sorted(c for c in chars if c >= ' '))
open(os.path.join(HERE, 'fonts', 'chars.txt'), 'w', encoding='utf-8').write(chars)
import json
UP = os.path.join(HERE, 'fonts', 'used.json')
USED = json.load(open(UP, encoding='utf-8')) if os.path.exists(UP) else {}
missing_total = 0
for fam, src, out in FONTS:
    dst = os.path.join(HERE, 'fonts', out)
    subprocess.run([sys.executable, '-m', 'fontTools.subset', os.path.join(HERE, 'fonts', src), f'--text={chars}', '--flavor=woff2',
                    f'--output-file={dst}', '--layout-features=*', '--no-hinting'], check=True)
    cmap = TTFont(dst).getBestCmap()
    need = USED.get(fam, chars)                                     # what the page really draws in this font (from the sweep), else all
    miss = [c for c in need if c not in ' \n' and ord(c) not in cmap]
    missing_total += len(miss)
    print(f'{out}: {len(chars)} chars ({len(need)} drawn), {os.path.getsize(dst) // 1024} KB, missing {len(miss)} {"".join(miss)}')
print('missing glyphs total', missing_total)
