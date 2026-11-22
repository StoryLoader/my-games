/* media-src.js — the clips this video plays (js/media.js, references/footage.md). Only sound effects: each is a 16×16 black
   picture wrapped around a sound synthesized by sfx/make_sfx.py (provenance.json). No background music in an explainer. */
window.MEDIA_SRC = {
  level: -15.6,   // the narration's integrated loudness (LUFS)
  clips: {
    bell: { file: 'assets/user/sfx/bell.mp4', master: 'assets/user/sfx/bell.mp4', w: 16, h: 16, dur: 1.75 },
    buzz: { file: 'assets/user/sfx/buzz.mp4', master: 'assets/user/sfx/buzz.mp4', w: 16, h: 16, dur: 0.55 },
    dial: { file: 'assets/user/sfx/dial.mp4', master: 'assets/user/sfx/dial.mp4', w: 16, h: 16, dur: 0.6 },
    hit: { file: 'assets/user/sfx/hit.mp4', master: 'assets/user/sfx/hit.mp4', w: 16, h: 16, dur: 1.55 },
    keys_a: { file: 'assets/user/sfx/keys_a.mp4', master: 'assets/user/sfx/keys_a.mp4', w: 16, h: 16, dur: 0.85 },
    keys_b: { file: 'assets/user/sfx/keys_b.mp4', master: 'assets/user/sfx/keys_b.mp4', w: 16, h: 16, dur: 0.85 },
    knock: { file: 'assets/user/sfx/knock.mp4', master: 'assets/user/sfx/knock.mp4', w: 16, h: 16, dur: 0.45 },
    ok: { file: 'assets/user/sfx/ok.mp4', master: 'assets/user/sfx/ok.mp4', w: 16, h: 16, dur: 0.7 },
    pop: { file: 'assets/user/sfx/pop.mp4', master: 'assets/user/sfx/pop.mp4', w: 16, h: 16, dur: 0.37 },
    slide: { file: 'assets/user/sfx/slide.mp4', master: 'assets/user/sfx/slide.mp4', w: 16, h: 16, dur: 1.45 },
    stamp: { file: 'assets/user/sfx/stamp.mp4', master: 'assets/user/sfx/stamp.mp4', w: 16, h: 16, dur: 0.55 },
    tick: { file: 'assets/user/sfx/tick.mp4', master: 'assets/user/sfx/tick.mp4', w: 16, h: 16, dur: 0.27 },
    wind: { file: 'assets/user/sfx/wind.mp4', master: 'assets/user/sfx/wind.mp4', w: 16, h: 16, dur: 3.75 },
  },
};
