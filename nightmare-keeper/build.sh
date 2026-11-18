#!/bin/sh
# 악몽을 지키는 파수꾼 — one command: timeline → voices (Google TTS) + speech check → score → events → mix → subtitles → picture → master
#   sh build.sh                       everything (the picture takes ~2 h on CPU WebGL; minutes on a GPU)
#   STOP_BEFORE_VIDEO=1 sh build.sh   sound and subtitles only
# Needs the Lemo-Opuscar library (core, voice and music tiers: setup.sh deps voice music), ffmpeg 7+, and for new voice
# takes network access to texttospeech.googleapis.com with a key (the takes are cached in voices/.cache/).
set -e
LIB=/root/lemo-opuscar
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=nightmare-keeper; FPS=30
node "$HERE/tools/export.mjs"                                                  # story.js → timeline.json
python3 "$HERE/tools/tts_google.py" "$HERE/lines.json" "$HERE/voices"          # Korean voices (cached)
(cd "$LIB" && HF_HUB_DISABLE_XET=1 "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang ko)
"$PY" "$HERE/music/score.py"                                                   # → music/score.wav
(cd "$LIB" && node core/render/events.mjs "$HERE")                             # window.EV → events.json
"$PY" "$HERE/mix.py" "$HERE/mix.wav"
"$PY" "$HERE/tools/srt_cues.py" "$HERE/out_cues.json" && "$PY" "$LIB/core/render/srt.py" "$HERE/out_cues.json" "$HERE/subtitles_ko.srt" && rm "$HERE/out_cues.json"
[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture"; exit 0; }
mkdir -p "$HERE/out"
(cd "$LIB" && node core/render/video.mjs "$HERE" --fps $FPS --workers 2 --out "$HERE/out/video.mp4")
(cd "$LIB" && sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/$NAME.mp4" $FPS 0)
(cd "$LIB" && node core/render/still.mjs "$HERE" 96.5 --out "$HERE/out/poster") && cp "$HERE/out/poster/t_96.5.jpg" "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
