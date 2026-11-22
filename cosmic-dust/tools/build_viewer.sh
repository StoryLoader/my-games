#!/bin/sh
# build_viewer.sh <out dir> — the playable page (no video render): the film's plain scripts joined in load order and minified
# with esbuild into one app.js, the soundtrack mix_viewer.wav (−14 LUFS after mp3, from mix.py) → mix.mp3, the font subsets
# (tools/fonts.py) with their licences, and tools/viewer.html as index.html.
# Needs esbuild reachable as $ESBUILD (npm i esbuild@0.24.2 in a work folder) and ffmpeg.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); OUT=${1:?out dir}; WORK=${WORK:-$OUT/../cd_build}; ESBUILD=${ESBUILD:-esbuild}
mkdir -p "$OUT/fonts" "$WORK"
cat "$HERE/js/base.js" "$HERE/js/kit.js" "$HERE/js/story.js" "$HERE/js/scenes.js" "$HERE/js/main.js" > "$WORK/app.src.js"
"$ESBUILD" "$WORK/app.src.js" --minify --target=es2020 --outfile="$OUT/app.js" --log-level=warning
ffmpeg -hide_banner -loglevel error -y -i "$HERE/mix_viewer.wav" -ar 48000 -c:a libmp3lame -b:a 192k "$OUT/mix.mp3"
cp "$HERE"/fonts/*-sub.woff2 "$HERE"/fonts/OFL-*.txt "$OUT/fonts/"
cp "$HERE/tools/viewer.html" "$OUT/index.html"; cp "$HERE/CREDITS" "$OUT/CREDITS.txt" 2>/dev/null || true
echo "$OUT/index.html"
