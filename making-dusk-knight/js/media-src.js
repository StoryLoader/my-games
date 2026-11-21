/* media-src.js — the clips this video plays (js/media.js, references/footage.md). Every file is in provenance.json:
   film = the finished short 「남은 길」, rendered from ../dusk-knight by its render.py (1080p, 30 fps, with its sound);
   ladder_v0…v3 = the same shot (8.0–12.45 s) rendered from copies of that project with look ingredients switched off
   (storyboard.md → 화면 자료); the rest are effects synthesized by sfx/make_sfx.py (16×16 black pictures — only the sound is used). */
window.MEDIA_SRC = {
  level: -18.8,   // the narration's integrated loudness (Google TTS ko-KR-Chirp3-HD-Sadaltager takes, measured 2026-11-16)
  clips: {
    film: { file: 'assets/user/vid/film.mp4', master: 'assets/user/vid/film.mp4', w: 1920, h: 1080, dur: 30.0, lufs: -20.3 },
    ladder_v0: { file: 'assets/user/vid/ladder_v0.mp4', master: 'assets/user/vid/ladder_v0.mp4', w: 1920, h: 1080, dur: 4.46 },
    ladder_v1: { file: 'assets/user/vid/ladder_v1.mp4', master: 'assets/user/vid/ladder_v1.mp4', w: 1920, h: 1080, dur: 4.46 },
    ladder_v2: { file: 'assets/user/vid/ladder_v2.mp4', master: 'assets/user/vid/ladder_v2.mp4', w: 1920, h: 1080, dur: 4.46 },
    ladder_v3: { file: 'assets/user/vid/ladder_v3.mp4', master: 'assets/user/vid/ladder_v3.mp4', w: 1920, h: 1080, dur: 4.46 },
    keys_a: { file: 'assets/user/sfx/keys_a.mp4', master: 'assets/user/sfx/keys_a.mp4', w: 16, h: 16, dur: 0.85 },
    keys_b: { file: 'assets/user/sfx/keys_b.mp4', master: 'assets/user/sfx/keys_b.mp4', w: 16, h: 16, dur: 0.85 },
    enter: { file: 'assets/user/sfx/enter.mp4', master: 'assets/user/sfx/enter.mp4', w: 16, h: 16, dur: 0.37 },
    step: { file: 'assets/user/sfx/step.mp4', master: 'assets/user/sfx/step.mp4', w: 16, h: 16, dur: 1.14 },
    whoosh: { file: 'assets/user/sfx/whoosh.mp4', master: 'assets/user/sfx/whoosh.mp4', w: 16, h: 16, dur: 0.65 },
    pop: { file: 'assets/user/sfx/pop.mp4', master: 'assets/user/sfx/pop.mp4', w: 16, h: 16, dur: 0.37 },
    tick: { file: 'assets/user/sfx/tick.mp4', master: 'assets/user/sfx/tick.mp4', w: 16, h: 16, dur: 0.27 },
    ok: { file: 'assets/user/sfx/ok.mp4', master: 'assets/user/sfx/ok.mp4', w: 16, h: 16, dur: 0.7 },
    shutter: { file: 'assets/user/sfx/shutter.mp4', master: 'assets/user/sfx/shutter.mp4', w: 16, h: 16, dur: 0.31 },
    hit: { file: 'assets/user/sfx/hit.mp4', master: 'assets/user/sfx/hit.mp4', w: 16, h: 16, dur: 1.55 },
  },
};
