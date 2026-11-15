/* media-src.js — the clips this video plays (js/media.js, references/footage.md). One clip: the whole soundtrack,
   synthesized by sfx/make_sound.py (a 16x16 black picture around it — only its sound is used). No narration. */
window.MEDIA_SRC = {
  level: -20,
  clips: {
    soundtrack: { file: 'assets/user/sfx/soundtrack.mp4', master: 'assets/user/sfx/soundtrack.mp4', w: 16, h: 16, dur: 30.0 },
  },
};
