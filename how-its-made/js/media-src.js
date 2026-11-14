/* media-src.js — the clips this video plays (js/media.js, references/footage.md). Every file is in provenance.json:
   demo_a…e are excerpts of the finished video 「반도체 vs 우주선」, rendered from ../chip-vs-rocket by render.py
   (the user asked to show the finished video at the start and the end); keys/step are effects synthesized by
   sfx/make_sfx.py (16×16 black pictures — only their sound is used). No background music in a tutorial. */
window.MEDIA_SRC = {
  level: -15.5,   // the narration's integrated loudness (LUFS)
  clips: {
    demo_a: { file: 'assets/user/vid/demo_a.mp4', master: 'assets/user/vid/demo_a.mp4', w: 1920, h: 1080, dur: 6.0 },
    demo_b: { file: 'assets/user/vid/demo_b.mp4', master: 'assets/user/vid/demo_b.mp4', w: 1920, h: 1080, dur: 7.0 },
    demo_c: { file: 'assets/user/vid/demo_c.mp4', master: 'assets/user/vid/demo_c.mp4', w: 1920, h: 1080, dur: 7.0 },
    demo_d: { file: 'assets/user/vid/demo_d.mp4', master: 'assets/user/vid/demo_d.mp4', w: 1920, h: 1080, dur: 7.0 },
    demo_e: { file: 'assets/user/vid/demo_e.mp4', master: 'assets/user/vid/demo_e.mp4', w: 1920, h: 1080, dur: 8.2 },
    keys: { file: 'assets/user/sfx/keys.mp4', master: 'assets/user/sfx/keys.mp4', w: 16, h: 16, dur: 0.7 },
    step: { file: 'assets/user/sfx/step.mp4', master: 'assets/user/sfx/step.mp4', w: 16, h: 16, dur: 1.0 },
  },
};
