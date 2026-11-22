#!/usr/bin/env python3
"""look.py <name> <still.jpg>... — review the library's still.mjs frames under this repo's look rule: the stills become a
clip (one second each), and a script-to-motion render.py films that clip into a contact sheet in screenshots/<name>/.
Only the sheet paths it prints are opened."""
import os, subprocess, sys, tempfile

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, stills = sys.argv[1], sys.argv[2:]
res = os.environ.get('RES')
with tempfile.TemporaryDirectory() as tmp:
    clip = os.path.join(tmp, 'look.mp4')
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for s in stills: cmd += ['-loop', '1', '-t', '1', '-i', s]
    fc = ''.join(f'[{i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=10[v{i}];' for i in range(len(stills)))
    fc += ''.join(f'[v{i}]' for i in range(len(stills))) + f'concat=n={len(stills)}:v=1:a=0[o]'
    subprocess.run(cmd + ['-filter_complex', fc, '-map', '[o]', '-pix_fmt', 'yuv420p', clip], check=True)
    at = ','.join(f'{i + .5:.1f}' for i in range(len(stills)))
    args = ['python3', os.path.join(here, '..', 'atlantis', 'render.py'), clip, '--screenshot', '--at', at, '--out', os.path.join(here, 'screenshots', name)]
    if res: args += ['--res', res]
    out = subprocess.run(args, capture_output=True, text=True)
    print('\n'.join(l for l in (out.stdout + out.stderr).splitlines() if l.endswith('.jpg')) or out.stderr[-800:])
