// 마지막 한 프레임 — the page (contract: window.DUR, window.render(t), window.READY, window.EV, window.PREWARM).
// The film steps on twos: one drawing per 1/15 s; render(t) draws the drawing that t falls in (and does nothing if it already shows it).
// Light pass (library demo): halation 9 px and 28 px additive, dust, corner falloff, one-drawing flicker, weave, grain.
// At the freeze (120 s → 121.6 s) the projector has stopped: the last drawing is held exactly — no boil, weave, flicker or grain change.
'use strict';
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const SC = mk(W, H), sctx = SC.getContext('2d');
window.READY = false;
window.DUR = DUR;

// subtitles: [from, to, text]; each line cut in left to right in 0.3 s
const SUBTL = [];
VO.forEach(([id, t0], i) => {
  const parts = SUBS[id]; if (!parts) return;
  const next = VO[i + 1] ? VO[i + 1][1] : DUR;
  let end = Math.min(t0 + VOEND[id] + .35, next - .05); if (t0 < T.freeze) end = Math.min(end, T.freeze);
  parts.forEach(([off, txt], k) => SUBTL.push([t0 + off, parts[k + 1] ? t0 + parts[k + 1][0] - .02 : end, txt]));
});
function subtitles(t, dn){
  for (const [a, b, txt] of SUBTL){
    if (t < a || t >= b) continue;
    const L = txt.split('\n'), fade = b === T.freeze ? 1 : 1 - seg(t, b - .12, b);   // the freeze cuts its line off dead
    L.forEach((ln, i) => cutText(txtImg(ln, SUBF, 46), 150, 1560 + i * 64, seg(t, a + i * .15, a + i * .15 + .3), dn, { tip: false, a: fade }));
  }
}
const rulerA = t => t < 9.4 ? .5 * seg(t, .3, 1.0) : lerp(.5, 1, seg(t, 9.4, 10.4));

let shown = -1;
window.render = t => {
  t = clamp(t, 0, DUR - 1e-4);
  const dn = Math.floor(t * 15 + 1e-6);
  if (dn === shown) return; shown = dn;
  const tq = dn / 15;
  const held = tq >= T.freeze - 1e-6 && tq < T.pullStrip;     // the projector has stopped
  const fdn = held ? Math.floor(T.freeze * 15) - 1 : dn;     // …so every plate stays on the last drawing
  setG(sctx); sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over'; sctx.filter = 'none';
  sctx.drawImage(EM[fdn % 4], 0, 0);
  const [id, a] = shotAt(tq);
  SHOT_FN[id](tq, tq - a, fdn);
  if (tq < T.freeze) timeRuler(tq, dn, rulerA(tq));
  subtitles(tq, fdn);
  const wx = Math.sin(fdn * 1.7) * .9, wy = Math.cos(fdn * 1.3) * 1.1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(SC, wx, wy);
  ctx.save(); ctx.filter = 'blur(9px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4; ctx.drawImage(SC, wx, wy); ctx.restore();
  if (!window.LITE){ ctx.save(); ctx.filter = 'blur(28px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .2; ctx.drawImage(SC, wx, wy); ctx.restore(); }   // a slow device drops the wide halo
  ctx.drawImage(DUST[fdn % DUST.length], 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${.05 * h1(fdn * 3.3)})`; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(GRAIN[(fdn * 2) % GRAIN.length], 0, 0);
};

// sound events for mix.py (exported by the library's events.mjs). Types:
// bang · swell · cut{d} (needle scrape) · tick · glock{f,v} · flutter{d,f0,f1} · burst · pop · whoosh{d} · impact · mark · fall{d}
const EV = [];
const ev = (t, type, o = {}) => EV.push(Object.assign({ t: +t.toFixed(3), type }, o));
ev(0, 'bang');
[[.4, .9], [1.3, .7], [2.0, 1.6], [3.6, 1.0], [9.6, 1.2], [11.0, 1.8], [15.8, 1.8], [59.4, 1.0], [159.7, 1.3]].forEach(([t, d]) => ev(t, 'cut', { d }));
ev(20.2, 'tick'); ev(20.3, 'cut', { d: .5 });
for (const [mt] of MARKS) if (mt > 0) ev(mt, 'tick');
// the first stars, one note each (a pentatonic, falling quieter as they crowd in)
[0, .35, .6, .9, 1.3, 1.8, 2.4, 3.1].forEach((d, i) => ev(T.firstStars + d, 'glock', { f: [1568, 1760, 2093, 2349, 2637, 3136, 2349, 2093][i], v: 1 - i * .08 }));
ev(27.6, 'flutter', { d: 2.6, f0: 220, f1: 660 });                // the galaxy gathering
ev(30.2, 'whoosh', { d: 4.6 });                                 // the pull-back
ev(36.0, 'flutter', { d: 3.8, f0: 330, f1: 140 });              // the star swelling
ev(40.0, 'burst');
for (let i = 0; i < 9; i++) ev(43 + (i + 1) * 4.5 / 9 - .25, 'glock', { f: [1319, 1568, 1760, 2093, 1760, 2349, 2093, 2637, 3136][i], v: .7 });
{ const q = rng(91); for (let i = 0; i < 14; i++){ const t0 = 48 + i * 1.3 + q() * .6; q(); q(); ev(t0, 'pop', { v: .5 + .04 * i }); } }
ev(67.0, 'flutter', { d: 12.5, f0: 80, f1: 240 });              // the cloud collapsing (a slow rising drawn tone)
ev(T.sun, 'glock', { f: 1047, v: 1.2, chord: 1 }); ev(T.sun, 'swell', { v: .5 });
ev(T.earth, 'impact', { v: .35 });
[0, .3, .7, 1.2, 1.8].forEach((d, i) => ev(T.life + d, 'glock', { f: [784, 988, 1175, 988, 1319][i], v: .8, soft: 1 }));
ev(T.oxygen, 'flutter', { d: 1.6, f0: 900, f1: 1800 });
ev(T.cambrian, 'flutter', { d: 2.2, f0: 300, f1: 1200 });
ev(T.dinoOut - .25, 'whoosh', { d: .3 }); ev(T.dinoOut, 'impact', { v: 1 }); ev(T.dinoOut, 'swell', { v: 1 });
// 120.0: the projector stops dead. True silence. The first sound after it is the needle.
ev(T.pullStrip, 'mark'); ev(T.pullStrip + .1, 'cut', { d: 1.6, v: .5 });
[124.4, 126.4, 128.0, 133.0].forEach(t => ev(t, 'tick'));
ev(T.band, 'cut', { d: .8 }); ev(T.band + .1, 'glock', { f: 2637, v: .8 });
ev(T.push, 'flutter', { d: 1.4, f0: 200, f1: 520 });
HIST.forEach(([t0]) => { ev(t0, 'cut', { d: .5 }); ev(t0, 'tick'); });
ev(T.pull, 'fall', { d: 3.2 });
ev(159.45, 'glock', { f: 2637, v: .7 });                        // the last point of teal
for (const [id, t] of VO) ev(t, 'vo', { id });               // the voices' start times, so the mixer reads one timeline
window.EV = EV;
// one time in each shot, drawn while loading (the cover is the promise)
window.PREWARM = [4.6, 12, 31, 41, 70, 82, 92, 116, 131, 146, 156];
window.COVER = 5.0;

(async () => {
  for (let i = 0; i < 4; i++){ EM.push(makeEmulsion(9 + i * 17)); DUST.push(makeDust(55 + i * 13)); }
  for (let i = 0; i < 3; i++) GRAIN.push(makeGrain(7 + i));
  const sub = !!window.FONTS_SUB;   // the published viewer ships subsets (tools/fonts.py); the working page reads the full fonts
  for (const [fam, url] of [['TITLE', sub ? 'fonts/blackhansans-sub.woff2' : 'fonts/BlackHanSans-Regular.ttf'], ['MONO', sub ? 'fonts/d2coding-sub.woff2' : 'fonts/D2CodingBold.ttf'], ['SUBF', sub ? 'fonts/gowundodum-sub.woff2' : 'fonts/GowunDodum-Regular.ttf']]){ const f = new FontFace(fam, `url('${url}')`); await f.load(); document.fonts.add(f); }
  window.READY = true;
})();
