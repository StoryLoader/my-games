/* media-src.js — the clips this video plays (js/media.js, references/footage.md). One clip: the effects track,
   synthesized by sfx/make_sound.py from the cue times (a 16x16 black picture around it — only its sound is used). */
window.MEDIA_SRC = {
  level: -19.2,   // the narration's integrated loudness (Google TTS ko-KR-Chirp3-HD-Algenib, measured 2026-11-17)
  clips: {
    sfx: { file: 'assets/user/sfx/sfx.mp4', master: 'assets/user/sfx/sfx.mp4', w: 16, h: 16, dur: 1145.84 },
  },
};
