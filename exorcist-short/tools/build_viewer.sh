#!/bin/sh
# build_viewer.sh <out dir> — the playable page (no video render): the film's modules bundled with esbuild into one app.js,
# the soundtrack mix.wav → mix.mp3 (−14 LUFS), the font subsets, voices/dur.json, and tools/viewer.html as index.html.
# Needs esbuild 0.24 reachable from $WORK (npm i esbuild@0.24.2 in a work folder) and ffmpeg.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); OUT=${1:?out dir}; WORK=${WORK:-$OUT/../mc_build}
mkdir -p "$OUT/fonts" "$OUT/voices" "$WORK/src"
cp "$HERE"/*.js "$WORK/src/"
(cd "$WORK" && npx esbuild src/main.js --bundle --format=esm --minify --target=es2022 --outfile="$OUT/app.js")
ffmpeg -hide_banner -loglevel error -y -i "$HERE/mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a libmp3lame -b:a 160k "$OUT/mix.mp3"
cp "$HERE"/fonts/*.woff2 "$HERE"/fonts/fonts.css "$HERE"/fonts/OFL-*.txt "$OUT/fonts/"; cp "$HERE/voices/dur.json" "$OUT/voices/"
cp "$HERE/tools/viewer.html" "$OUT/index.html"; cp "$HERE/CREDITS" "$OUT/CREDITS.txt" 2>/dev/null || true
echo "$OUT/index.html"
