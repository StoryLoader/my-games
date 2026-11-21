/* media-src.js — the clips this video plays (js/media.js, references/footage.md).
   film: the sound of 「악몽을 지키는 파수꾼」 exactly as in the Shorts cut (narration, 노을's grandmother voice, score and
   effects, mastered at −14 LUFS), copied unchanged from nightmare-keeper/nightmare-keeper-shorts.mp4 and wrapped in a
   16x16 black picture — only its sound is used; the picture is the film itself, rendered live (js/film/nk_film.js). */
window.MEDIA_SRC = {
  level: -19.2,   // the narration's integrated loudness (Google TTS ko-KR-Chirp3-HD-Algenib, as measured for atlantis)
  clips: {
    sfx: { file: 'assets/user/sfx/sfx.mp4', master: 'assets/user/sfx/sfx.mp4', w: 16, h: 16, dur: 906.16 },   // the lecture's own effects (sfx/make_sound.py)
    film: { file: 'assets/user/film/film_sound.mp4', master: 'assets/user/film/film_sound.mp4', w: 16, h: 16, dur: 127.0, lufs: -14.0 },
  },
};
