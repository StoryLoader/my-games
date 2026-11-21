#!/usr/bin/env python3
"""fonts.py — subset the film's four fonts to exactly the characters it prints (every string literal in the picture's modules,
plus digits and basic punctuation for the clocks and dates), write fonts/*.woff2 + fonts/fonts.css + fonts/chars.txt, then check
that every character is in every subset (0 missing glyphs is the bar).

  $LIB/.venv/bin/python tools/fonts.py
"""
import glob, os, re, subprocess, sys
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, 'fonts', 'src')
FONTS = [   # family, css weight, source, subset file
    ('Black Han Sans', '400', 'BlackHanSans-Regular.ttf', 'blackhansans-sub.woff2'),
    ('D2Coding', '700', 'D2CodingBold.ttf', 'd2coding-sub.woff2'),
    ('Nanum Myeongjo', '800', 'NanumMyeongjo-ExtraBold.ttf', 'nanummyeongjo-sub.woff2'),
]
chars = set('0123456789/.:- ')
for f in glob.glob(os.path.join(HERE, '*.js')):
    src = open(f, encoding='utf-8').read()
    for m in re.finditer(r"'([^'\n]*)'|`([^`]*)`|\"([^\"\n]*)\"", src):
        s = next(g for g in m.groups() if g is not None)
        if re.search(r'[가-힣]', s) or re.fullmatch(r'[0-9 ./:\-n]+', s): chars |= set(s)
chars |= set('abcdefghijklmnopqrstuvwxyz')   # "n/4"-style labels and the mono font's Latin
chars = ''.join(sorted(c for c in chars if c >= ' '))
open(os.path.join(HERE, 'fonts', 'chars.txt'), 'w', encoding='utf-8').write(chars)
css, missing_total = [], 0
for fam, wt, src, out in FONTS:
    dst = os.path.join(HERE, 'fonts', out)
    subprocess.run([sys.executable, '-m', 'fontTools.subset', os.path.join(SRC, src), f'--text={chars}', '--flavor=woff2', f'--output-file={dst}', '--layout-features=*', '--no-hinting'], check=True)
    cmap = TTFont(dst).getBestCmap(); miss = [c for c in chars if c != ' ' and ord(c) not in cmap]
    missing_total += len(miss)
    print(f'{out}: {len(chars)} chars, {os.path.getsize(dst) // 1024} KB, missing {len(miss)} {"".join(miss)}')
    css.append(f"@font-face {{ font-family: '{fam}'; src: url({out}) format('woff2'); font-weight: {wt}; font-display: block; }}")
open(os.path.join(HERE, 'fonts', 'fonts.css'), 'w').write('\n'.join(css) + '\n')
print('missing glyphs total', missing_total)
