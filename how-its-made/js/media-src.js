/* media-src.js — the clips this video plays (js/media.js, references/footage.md). Every file is in provenance.json:
   demo_a…e are excerpts of the finished video 「반도체 vs 우주선」, rendered from ../chip-vs-rocket by render.py
   (the user asked to show the finished video at the start and the end); the rest are effects synthesized by
   sfx/make_sfx.py (16×16 black pictures — only their sound is used). No background music in a tutorial. */
window.MEDIA_SRC = {
  level: -17.3,   // the narration's integrated loudness (LUFS)
  clips: {
    demo_a: { file: 'assets/user/vid/demo_a.mp4', master: 'assets/user/vid/demo_a.mp4', w: 1920, h: 1080, dur: 6.0 },
    demo_b: { file: 'assets/user/vid/demo_b.mp4', master: 'assets/user/vid/demo_b.mp4', w: 1920, h: 1080, dur: 7.0 },
    demo_c: { file: 'assets/user/vid/demo_c.mp4', master: 'assets/user/vid/demo_c.mp4', w: 1920, h: 1080, dur: 7.0 },
    demo_d: { file: 'assets/user/vid/demo_d.mp4', master: 'assets/user/vid/demo_d.mp4', w: 1920, h: 1080, dur: 7.0 },
    demo_e: { file: 'assets/user/vid/demo_e.mp4', master: 'assets/user/vid/demo_e.mp4', w: 1920, h: 1080, dur: 8.2 },
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
    rewind: { file: 'assets/user/sfx/rewind.mp4', master: 'assets/user/sfx/rewind.mp4', w: 16, h: 16, dur: 1.25 },
    buzz: { file: 'assets/user/sfx/buzz.mp4', master: 'assets/user/sfx/buzz.mp4', w: 16, h: 16, dur: 0.55 },
  },
};
