/*
 * scenes.js — 「악몽을 지키는 파수꾼은 어떻게 만들어졌나」: the integrator.
 * One world (storyboard.md): a magic-lantern table at night — one amber lantern below, seven etched glass plates above
 * it, a projection window on top where the film itself appears, rendered live by js/film/nk_film.js (NK.render(t)).
 * The chapters are built by js/seg/*.js on the master timeline, every time taken from the cues.
 *   F0 = the film plays whole (127 s, its own sound: the Shorts cut's track, assets/user/film/film_sound.mp4)
 *   H0 = the highlight replay (film 109.4–122.4 s, 13 s: 하루 takes the hand lantern → 노을 sleeps → dawn → "아주 좋은 꿈을.")
 */
Video.define(async (ctx) => {
  const { cue } = ctx;
  await window.NK.boot();                       // the film's renderer, sets and overlay fonts
  const K = KIT(ctx);
  const M = MEDIA.install(ctx);
  K.S = (id) => cue(id).start; K.E = (id) => cue(id).end;
  K.A = (id, phrase, off = 0) => cue(id).about(phrase, off);
  K.F0 = K.E('op03') + 0.7;                     // the whole film
  K.FILM = 127.0;
  K.H0 = K.E('d04') + 0.3;                      // the highlight
  K.HIN = 109.4; K.HDUR = 13.0;
  K.FULL = { x: 0, y: 0, s: 1, o: 1, bz: 0, ov: 1 };

  // the film's own sound (unchanged, level-matched to the narration by media.js) and the lecture's effects:
  // in a normal browser they are already in the one soundtrack (js/audio-master.js, sfx/mix_master.py);
  // render.py and the review tools get them as clips with the narration
  if (!window.LIVE_MIX) {
    M.clip(K.$('sfxbox'), 'film', { x: 0, y: 0, w: 4, h: 4, start: K.F0, dur: K.FILM, audio: true, vol: 1 });
    M.clip(K.$('sfxbox'), 'film', { x: 0, y: 0, w: 4, h: 4, start: K.H0, in: K.HIN, dur: K.HDUR, audio: true, vol: [[0, 0], [0.3, 1], [12.3, 1], [13.0, 0]] });
    if (M.SRC.sfx) M.clip(K.$('sfxbox'), 'sfx', { x: 0, y: 0, w: 4, h: 4, start: 0, dur: M.SRC.sfx.dur, audio: true, vol: 0.6 });
  }

  SEG.open(ctx, K);
  SEG.ch1(ctx, K);
  SEG.ch2(ctx, K);
  SEG.ch3(ctx, K);
  SEG.close(ctx, K);
});
window.SEG = window.SEG || {};
