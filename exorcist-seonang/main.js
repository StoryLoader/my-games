// 서낭나무 — the page (contract: window.DUR, window.render(t), window.READY, window.EV, window.TEXTS)
import { makeComp, layerSet } from './comp.js';
import { DUR, T, VO, SHOTS, subSpans } from './story.js';
import { subtitle } from './subs.js';
import * as S from './shots.js';
import { clamp } from '/core/lib.js';

const q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('c'));
const A = layerSet(), B = layerSet(), TMP = layerSet();
await document.fonts.load('50px SongMyung', '서하무진소장벌써세명째예요저나무에손만대면기사가그대로쓰러져');
await document.fonts.load('190px NanumBrush', '서낭나무');
let DURS = {}; try { const r = await fetch('voices/dur.json'); if (r.ok) DURS = await r.json(); } catch (x) { }
const SPANS = subSpans(DURS), NOSUB = q.has('nosub');
S.init();

function render(t) {
  A.clear(); B.clear();
  const o = S.frame(t, A, B, TMP) || {};
  if (!NOSUB) for (const v of SPANS) {
    if (t < v.a || t > v.b) continue;
    const k = Math.min(clamp((t - v.a) / .3), clamp((v.b - t) / .35));
    const [x, y, size, maxW] = S.subPos(v.id, t);
    subtitle(A, v.text, x, y, k, { size, maxW: maxW || 900 });
  }
  if (window.__NODRAW) return;
  comp(A, B, o);
}
// sound events for the mixer (the same times the picture uses)
function events() {
  const E = [], add = (type, t, o = {}) => E.push({ type, t: +t.toFixed(3), ...o });
  for (const v of VO) add('vo', v.t, { id: v.id, who: v.who });
  add('drip', 0.6); add('strips', T.stripsMove, { d: 6 });
  add('brush', T.titleW[0], { d: T.titleW[1] - T.titleW[0] }); add('seal', T.seal1);
  for (let k = 0; k < 40; k++) { const ts = T.walk[0] + k / 1.5; if (ts > T.walk[1] - .6) break; add('step', ts, { k }); }
  add('bell', T.ring[0], { d: T.ring[1] - T.ring[0] }); add('lift', T.lift); add('bloom', T.bloom[0]); add('bloom', 36.0);
  add('engine', T.engine, { d: 10 }); add('bite', T.bite); add('tear', T.tear); add('crack', T.crack[0], { d: T.crack[1] - T.crack[0] });
  add('rise', T.rise[0], { d: 6 }); add('strike', T.strike1); add('split', T.strike1 + .08); add('strike', T.strike2); add('split', T.strike2 + .08);
  add('deadbell', T.dead); add('bloom', 90.6); add('cut', 95.9);
  add('climb', 102.0, { d: T.stand - 102 }); add('silence', T.hush[0], { t1: T.hush[1] }); add('drip', T.drip); add('white', T.white[0]); add('gong', T.white[1]);
  add('sink', T.sink[0], { d: T.sink[1] - T.sink[0] }); add('close', T.close); add('bloom', 116.2); add('birds', 121.2, { d: 15 }); add('bloom', 131.6); add('seal', T.seal2);
  return E.sort((a, b) => a.t - b.t);
}
window.EV = events();
window.TEXTS = VO.map(v => ({ t: v.t, text: v.text, who: v.who }));
window.render = render; window.DUR = DUR;
window.PREWARM = SHOTS.map(s => (s[1] + s[2]) / 2);
render(+(q.get('t') ?? 12));
window.READY = true;
