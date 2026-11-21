// 마지막 한 프레임 — look-dev page (page contract: window.DUR, window.render(t), window.READY). t picks the frame:
// 0 the promise · 1 the sun and the Earth (1:20) · 2 the freeze (signature) · 3 inside the last 1/16.
// The light pass is the library demo's: halation (9 px and 28 px additive), dust, corner falloff, one-drawing flicker, weave, grain.
'use strict';
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const SC = mk(W, H), sctx = SC.getContext('2d');
window.READY = false;
window.render = t => {
  const dn = Math.floor(t * 15 + 1e-6), k = Math.min(FRAMES.length - 1, Math.floor(t + 1e-6));
  setG(sctx); sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over'; sctx.filter = 'none';
  sctx.drawImage(EM[dn % 4], 0, 0);
  FRAMES[k](t, dn);
  const wx = Math.sin(dn * 1.7) * .9, wy = Math.cos(dn * 1.3) * 1.1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(SC, wx, wy);
  ctx.save(); ctx.filter = 'blur(9px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4; ctx.drawImage(SC, wx, wy); ctx.restore();
  ctx.save(); ctx.filter = 'blur(28px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .2; ctx.drawImage(SC, wx, wy); ctx.restore();
  ctx.drawImage(DUST[dn % DUST.length], 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${.05 * h1(dn * 3.3)})`; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(GRAIN[Math.floor(t * 30) % GRAIN.length], 0, 0);
};
(async () => {
  for (let i = 0; i < 4; i++){ EM.push(makeEmulsion(9 + i * 17)); DUST.push(makeDust(55 + i * 13)); }
  for (let i = 0; i < 3; i++) GRAIN.push(makeGrain(7 + i));
  for (const [fam, url] of [['TITLE', 'fonts/BlackHanSans-Regular.ttf'], ['MONO', 'fonts/D2CodingBold.ttf'], ['SUBF', 'fonts/GowunDodum-Regular.ttf']]){ const f = new FontFace(fam, `url('${url}')`); await f.load(); document.fonts.add(f); }
  window.DUR = FRAMES.length;
  window.READY = true;
})();
