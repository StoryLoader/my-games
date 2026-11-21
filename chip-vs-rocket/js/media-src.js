/* media-src.js — the sound clips this video plays (js/media.js, references/footage.md). Every file is listed in
   provenance.json: effects synthesized for this video by sfx/make_sfx.py (the user asked for code-synthesized sound).
   Their pictures are 16×16 black frames — only their sound is used. No background music in this explainer. */
window.MEDIA_SRC = {
  level: -15.7,   // the narration's integrated loudness (LUFS)
  clips: {
    swish: { file: 'assets/user/sfx/swish.mp4', master: 'assets/user/sfx/swish.mp4', w: 16, h: 16, dur: 0.4 },
    hit: { file: 'assets/user/sfx/hit.mp4', master: 'assets/user/sfx/hit.mp4', w: 16, h: 16, dur: 0.45 },
    bell: { file: 'assets/user/sfx/bell.mp4', master: 'assets/user/sfx/bell.mp4', w: 16, h: 16, dur: 1.8 },
  },
};
