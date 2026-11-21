/* audio-master.js — in a normal browser the player plays ONE soundtrack: assets/user/mix/lecture_mix.mp3 (narration + the
   film's own sound + the lecture's effects, mixed by sfx/mix_master.py), started by the first click. A clip that has to
   unmute itself later can be held back by the browser's autoplay rule (an embedded page, an artifact), so the film's
   sound is not left to separate clips there. render.py (?render) and the review tools keep the narration and the clips
   (js/scenes.js places them only then), so nothing is ever heard twice. */
(function () {
  const Q = new URLSearchParams(location.search);
  window.LIVE_MIX = !Q.has('render') && navigator.webdriver !== true;
  if (window.LIVE_MIX && window.VIDEO_DATA) {
    window.VIDEO_DATA.audio = 'assets/user/mix/lecture_mix.mp3';
    window.VIDEO_DATA.audioDuration = window.VIDEO_DATA.duration;
  }
})();
