#!/bin/sh
# build_viewer.sh <out dir> — the playable page (no video render): story/town/tower/… bundled with esbuild into one app.js
# (three.js included), the soundtrack mix.wav → mix.mp3 (−14 LUFS), the font subsets and voices/dur.json, and tools/viewer.html
# as index.html. The page draws the film live in the browser (WebGL) with the soundtrack as its clock.
# Needs: node with esbuild 0.24 and three 0.170 in NODE_PATH's reach (npm i esbuild@0.24.2 three@0.170.0 in a work folder), ffmpeg.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); OUT=${1:?out dir}; WORK=${WORK:-$OUT/../nk2_build}; LIB=${LIB:-/root/lemo-opuscar}
mkdir -p "$OUT/fonts" "$OUT/voices" "$WORK/src"
cp "$HERE"/*.js "$WORK/src/" && cp "$LIB/core/lib.js" "$WORK/src/lib.js" && sed -i "s#'/core/lib.js'#'./lib.js'#" "$WORK/src/"*.js
(cd "$WORK" && npx esbuild src/main.js --bundle --format=esm --minify --target=es2022 --outfile="$OUT/app.js")
ffmpeg -hide_banner -loglevel error -y -i "$HERE/mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a libmp3lame -b:a 160k "$OUT/mix.mp3"
cp "$HERE"/fonts/*.woff2 "$HERE"/fonts/fonts.css "$HERE"/fonts/OFL-*.txt "$OUT/fonts/"; cp "$HERE/voices/dur.json" "$OUT/voices/"
cp "$HERE/tools/viewer.html" "$OUT/index.html"; cp "$HERE/CREDITS" "$OUT/CREDITS.txt"; cp "$HERE/LICENSE-engine" "$OUT/LICENSE-engine.txt"
echo "$OUT/index.html"
