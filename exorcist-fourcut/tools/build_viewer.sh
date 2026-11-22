#!/bin/sh
# build_viewer.sh <out dir> — the playable page (no video render): the film's modules bundled with esbuild into one app.js,
# the soundtrack mix_viewer.wav (−14 LUFS, from mix.py) → mix.mp3, the font subsets, and tools/viewer.html as index.html.
# Needs esbuild 0.24 + three 0.170 reachable from $WORK/node_modules (npm i esbuild@0.24.2 three@0.170.0 in a work folder) and ffmpeg.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); OUT=${1:?out dir}; WORK=${WORK:-$OUT/../fc_build}; LIB=${LIB:-$HOME/lemo-opuscar}
mkdir -p "$OUT/fonts" "$WORK/src"
cp "$HERE"/*.js "$WORK/src/"; cp "$LIB/core/lib.js" "$WORK/src/lib.js"
sed -i "s|'/core/lib.js'|'./lib.js'|" "$WORK"/src/*.js
(cd "$WORK" && npx esbuild src/main.js --bundle --format=esm --minify --target=es2022 --outfile="$OUT/app.js")
ffmpeg -hide_banner -loglevel error -y -i "$HERE/mix_viewer.wav" -ar 48000 -c:a libmp3lame -b:a 192k "$OUT/mix.mp3"   # mix.py already mastered it to −14 LUFS
cp "$HERE"/fonts/*.woff2 "$HERE"/fonts/fonts.css "$HERE"/fonts/OFL-*.txt "$OUT/fonts/"
cp "$HERE/tools/viewer.html" "$OUT/index.html"; cp "$HERE/CREDITS" "$OUT/CREDITS.txt" 2>/dev/null || true
echo "$OUT/index.html"
