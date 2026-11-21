// 막차 — the film page (page contract: window.DUR, window.render(t), window.READY, window.EV, window.TEXTS).
// ?look=1 shows the look-dev frames (t 0..4) instead.
import { canvas, W, H, rgba } from './cel.js';
import { makePost } from './post.js';
import { DUR, SHOTS, shotAt, VO, T, BEAT, bar } from './story.js';
import { SHOT_FN, setDurs } from './scenes.js';
import { hud, subSpans } from './hud.js';

const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
await document.fonts.load('80px "Black Han Sans"', '막차 다음 이야기 시청 2 7 운전실');
for (const w of [600, 700, 800]) await document.fonts.load(`${w} 50px Pretendard`, '이번 역은 없는 역입니다 안내 방송 기관사 누나 운행표');
await document.fonts.load('italic 800 46px Pretendard', 'LINE 2 · 00:48');
let DURS = {}; try { const r = await fetch('voices/dur.json'); if (r.ok) DURS = await r.json(); } catch (x) { }
setDurs(DURS);
const SPANS = subSpans(DURS);
const LOOK = qs.get('look') ? await import('./frames.js') : null;
const RAW = { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 };

function render(t) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const fr = Math.floor(t * 12 + 1e-6);
  let over = {};
  if (LOOK) {
    const k = Math.floor(t), S = { g, e, t, lt: t - k };
    if (k === 0) { LOOK.sheet(S); over = RAW; } else if (k === 1) LOOK.platform(S); else if (k === 2) LOOK.bust(S); else LOOK.impact(S, k > 3);
    ov.clearRect(0, 0, W, H);
  } else {
    const [id, t0, t1] = shotAt(t), S = { g, e, t, lt: t - t0, u: (t - t0) / (t1 - t0), fr, over: {} };
    SHOT_FN[qs.get('shot') || id](S);
    over = S.over || {};
    hud(ov, t, SPANS, !!qs.get('nosub'));
  }
  if (t < .6) over = { ...over, power: Math.min(1, t / .6) };
  if (window.__NODRAW) return;
  post.render(sc, gc, Math.round(t * 24), ovc, over);
}
// —— sound events for the mixer (mix.py reads them through the library's events.mjs) ——
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  add('crton', 0); add('tapeclick', .05);
  for (const v of VO) { if (v.who === 'pa') add('chime', v.t - 1.0); }
  add('ptt', 90.9); add('chime', 90.0);
  add('doors', T.doorsClose); add('depart', T.depart);
  add('brass', bar(3)); add('whoosh', bar(3) - .2);
  add('slap', T.slap); add('ignite', T.ignite); add('impact', T.impact1, { v: 1.2 });
  for (const p of T.punches) add('punch', p);
  add('bell', T.bellBreak, { v: 1.2 }); add('impact', T.bellBreak); add('bell', T.raise, { v: .9 }); add('bell', 85.2, { v: .35 }); add('bell', 86.9, { v: .5 });
  add('whispers', T.shadowOff[0], { d: 3 }); add('whispers', bar(21), { d: bar(26) - bar(21) }); add('whispers', T.peel[0], { d: T.peel[1] - T.peel[0], v: 1.2 });
  add('brakes', T.brakes, { d: 2.6 }); add('flash', T.flash); add('cap', T.capOff); add('glitch', T.erase);
  add('freeze', T.freeze); add('tapeout', T.tapeOut);
  return ev.sort((a, b) => a.t - b.t);
}
window.EV = events();
window.TEXTS = VO.map(v => ({ t: v.t, text: v.text, who: v.who }));
window.render = render; window.DUR = LOOK ? 5 : DUR; window.POST = post;
render(LOOK ? 1.5 : 10.5);
window.READY = true;
