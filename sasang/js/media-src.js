/* media-src.js — the sound clips this video plays (js/media.js, references/footage.md). Every file is listed in
   provenance.json: music and effects synthesized for this video by sfx/make_bgm.py and
   sfx/make_sfx.py (the user asked for code-synthesized sound). Their pictures are 16×16 black frames — only their sound is used. */
window.MEDIA_SRC = {
  level: -18.2,   // the narration's integrated loudness (LUFS); clips with `lufs` are level-matched to it
  clips: {
    swish: { file: 'assets/user/sfx/swish.mp4', master: 'assets/user/sfx/swish.mp4', w: 16, h: 16, dur: 0.45 },
    stamp: { file: 'assets/user/sfx/stamp.mp4', master: 'assets/user/sfx/stamp.mp4', w: 16, h: 16, dur: 0.35 },
    bgm: { file: 'assets/user/sfx/bgm.mp4', master: 'assets/user/sfx/bgm.mp4', w: 16, h: 16, dur: 316.0, lufs: -19.1 },
    chime: { file: 'assets/user/sfx/chime.mp4', master: 'assets/user/sfx/chime.mp4', w: 16, h: 16, dur: 2.2 },
  },
};
