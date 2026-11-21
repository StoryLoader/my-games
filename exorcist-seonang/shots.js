// 서낭나무 — the shots. Each draws one picture into a layer set (wet / dry / col) and returns the compositor's parameters.
// Transitions are ink blooms (A → B through a spreading drop) or the style's one hard cut (to her eyes).
import { mk, draw, mass, blot, TONE } from './ink.js';
import { hero, POSE } from './figure.js';
import { init as siteInit, layers, blit, camXf, setCam, strips, excavator, agwi, TREE, GY, UNDER_OY } from './site.js';
import { writeTitle } from './title.js';
import { seal, VERM } from './seal.js';
import { T } from './story.js';
import { clamp, lerp, ss, eio, mulberry, vnoise } from '/core/lib.js';

export const tq = t => Math.floor(t * 12 + 1e-6) / 12;            // figures, blooms of drawings step at 12 fps
const seg = (t, a, b) => clamp((t - a) / (b - a));
const NIGHT = [.885, .862, .812], DAWN = [.958, .93, .862];
const scr = A => A.xf(1, 0, 0);
function nightSky(A, k = 1) { const c = A.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const g = c.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, `rgba(0,0,0,${.2 * k})`); g.addColorStop(.6, `rgba(0,0,0,${.06 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 1100); c.restore(); }
function worldO(cam, o = {}) { const { s, tx, ty } = camXf(cam); return { paper: [-tx, -ty, s], paperCol: NIGHT, bleed: 6, rim: .8, vig: .26, warm: .45, ...o }; }
const screenO = (o = {}) => ({ paper: [0, 0, 1], paperCol: NIGHT, bleed: 6, rim: .8, vig: .26, warm: .45, ...o });
// apply an extra transform to the three contexts of a layer set around fn
function withXf(A, m, fn) { for (const c of [A.cw, A.cd, A.cc]) { c.save(); c.transform(...m); } fn(); for (const c of [A.cw, A.cd, A.cc]) c.restore(); }
const rotAt = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y]; };
const fig = (A, pose, X) => hero(A.ink, typeof pose === 'string' ? POSE[pose] : pose, { seed: 7, ...X, t: tq(X.t ?? 0), boil: Math.floor((X.t ?? 0) * 12) % 5 });
const walkPose = t => (Math.floor(t * 3) % 2 ? 'walk1' : 'walk2');

export function init() { siteInit(); }

// —— 1 open / 2 title: the site from high above; strips moving with no wind; the frozen excavator; a fallen driver; the manager on the phone ——
const EXC_FROZEN = [830, GY, .95, -2.35, 4.4, 1.85];
function site(A, t, o = {}) {
  const cam = o.cam;
  blit(A, layers().sky, cam);
  setCam(A, cam);
  strips(A.ink, TREE[0], TREE[1], 1, t < T.stripsMove ? T.stripsMove : t, o.lift || 0);
  if (o.exc) excavator(A.ink, ...o.exc);
  if (o.fallen) withXf(A, rotAt(o.fallen[0], o.fallen[1], -Math.PI / 2 + .1), () => fig(A, 'stand', { x: o.fallen[0], y: o.fallen[1], s: .95, ch: 'boss', t: 0, seed: 31 }));
  for (const f of o.figs || []) fig(A, f.pose, { ...f });
  return cam;
}
function open(A, t) {
  const cam = { x: 540, y: 1560, z: lerp(.52, .6, ss(t / 16)) };
  site(A, t, { cam, exc: EXC_FROZEN, fallen: [905, GY - 6], figs: [{ pose: 'stand', x: 1010, y: GY, s: .95, dir: -1, ch: 'boss', t, seed: 41 }] });
  nightSky(A);
  return worldO(cam, { fade: 1 - ss(t / 1.2) });
}
function title(A, t, TMP) {
  const o = open(A, t);
  scr(A); writeTitle(A.ink, TMP, 70, 220, 190, seg(t, T.titleW[0], T.titleW[1]));
  A.cc.setTransform(1, 0, 0, 1, 0, 0); seal(A.cc, 128, 1028, 78, ss(seg(t, T.seal1, T.seal1 + .25)), 5);
  return { ...o, fade: 0 };
}
// —— 3 arrive: lateral tracking at ground level, 서하 in front, 무진 behind ——
function arrive(A, t) {
  const u = seg(t, T.walk[0], T.walk[1]), xs = lerp(-40, 400, u), cam = { x: clamp(xs - 30, 60, 380), y: 1830, z: 2.3 };
  const walking = t < T.walk[1] - .6;
  site(A, t, { cam, figs: [
    { pose: walking ? walkPose(t + .17) : 'stand', x: xs - 150, y: GY, s: 1.6, dir: 1, ch: 'mujin', t, seed: 51 },
    { pose: walking ? walkPose(t) : (t > 28.4 && t < 32.6 ? 'draw' : 'stand'), x: xs, y: GY, s: 1.5, dir: 1, ch: 'seoha', t, seed: 61 },
  ] });
  // footprints behind them (a dry dab per step)
  for (let k = 0; k < 18; k++) { const fx = lerp(-40, 400, k / 18); if (fx > xs - 20) break; blot(A.cw, fx - 10, GY + 4, 3, .25, 0, .4, k); }
  nightSky(A, .8);
  return worldO(cam);
}
// —— 4 bell insert: her hand, the 방울 (a cluster of small bells on a handle), the red thread at the wrist ——
function bellInsert(A, t, ring = 1) {
  scr(A);
  const R = mulberry(4), shake = ring ? Math.sin(tq(t) * 60) * 10 * ring : 0;
  // sleeve from the lower left, the fist
  mass(A.cw, [[-40, 1920], [-40, 1460], [260, 1180], [420, 1260], [200, 1920]], .2, 6, 3);
  draw(A.ink, mk([[-20, 1500], [180, 1300], [330, 1210]], { w: 90, tone: .7, darkDir: [-1, 1], side: .85, brWet: true, body: .3, dry: .45, wet: .9, prof: 'robe', seed: 11 }));
  draw(A.ink, mk([[300, 1230], [400, 1180], [470, 1120]], { w: 70, tone: .28, wet: 1, dry: .1, prof: 'lens', seed: 12 }));   // the fist, clear ink
  draw(A.ink, mk([[330, 1200], [372, 1150], [430, 1120], [480, 1130]], { w: 4, tone: TONE.nong, dry: .4, prof: 'tip', seed: 13 }));
  draw(A.ink, mk([[300, 1262], [356, 1250]], { w: 9, color: VERM, tone: .95, dry: .2, prof: 'even', nb: 8, seed: 14 }));   // the red thread
  // handle and bells
  const hx = 470 + shake * .3, hy = 1110;
  draw(A.ink, mk([[hx - 30, hy + 20], [hx + 40, hy - 90], [hx + 80, hy - 190]], { w: 16, tone: TONE.jiao, dry: .3, prof: 'even', seed: 15 }));
  const bx = hx + 110 + shake, by = hy - 330;
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * Math.PI * 2, r = k ? 112 : 0, x = bx + Math.cos(a) * r + (ring ? Math.sin(tq(t) * 47 + k) * 9 * ring : 0), y = by + Math.sin(a) * r * .8;
    draw(A.ink, mk(Array.from({ length: 9 }, (_, i) => { const b = i / 8 * Math.PI * 2; return [x + Math.cos(b) * 50, y + Math.sin(b) * 50]; }), { w: 13, tone: .85, dry: .35, wet: .3, prof: 'even', seed: 20 + k }));
    blot(A.cw, x + 6, y + 20, 11, .9, 0, .7, k); draw(A.ink, mk([[x - 50, y + 4], [x + 50, y + 4]], { w: 4, tone: .7, dry: .6, prof: 'tip', seed: 60 + k }));
  }
  for (let k = 0; k < 3; k++) draw(A.ink, mk([[hx + 40, hy - 160], [hx - 40 - k * 60, hy - 60 + k * 40], [hx - 120 - k * 80, hy + 60 + k * 90]], { w: 10, tone: [.3, .16, .5][k], dry: .3, wet: .7, prof: 'tip', seed: 30 + k }));   // cloth tails
  if (ring) for (let k = 0; k < 8; k++) { const a = -2.4 + k * .35 + (Math.floor(t * 12) % 2) * .1, r = 230 + R() * 50; draw(A.ink, mk([[bx + Math.cos(a) * r, by + Math.sin(a) * r], [bx + Math.cos(a) * (r + 50), by + Math.sin(a) * (r + 50)]], { w: 3, tone: .6 * ring, dry: .7, prof: 'tip', seed: 40 + k })); }
  return screenO();
}
// —— the crown: strips standing straight up in no wind ——
function crown(A, t) {
  const cam = { x: 540, y: 1700, z: 1.55 };
  site(A, t, { cam, lift: ss(seg(t, T.lift, T.lift + 1.4)) });
  return worldO(cam);
}
// —— 5 vision: the hanging-scroll tilt down through the roots; the hungry dead, pale shapes cut out of the dark ——
const AG = [[360, 2620, 1.4, 1], [720, 2700, 1.6, 2], [520, 2900, 1.9, 3], [250, 3050, 1.5, 4], [860, 3000, 1.7, 5], [600, 3250, 2.2, 6], [400, 3350, 1.6, 7], [820, 3400, 1.8, 8]];
function vision(A, t) {
  const cam = { x: 540, y: lerp(2400, 2900, eio(seg(t, T.tilt[0], T.tilt[1]))), z: 1.0 };
  blit(A, layers().sky, cam); blit(A, layers().under, cam, UNDER_OY);
  setCam(A, cam);
  for (const [x, y, s, sd] of AG) {
    // remove ink where they are (paper white = their pale bodies), then a few burnt lines
    A.cw.save(); A.cw.globalCompositeOperation = 'destination-out';
    A.cw.fillStyle = 'rgba(0,0,0,.55)'; A.cw.beginPath(); A.cw.ellipse(x, y - 60 * s, 36 * s, 32 * s, 0, 0, 7); A.cw.fill();
    A.cw.fillStyle = 'rgba(0,0,0,.95)'; A.cw.beginPath(); A.cw.ellipse(x, y - 164 * s, 11 * s, (10 + 5 * Math.sin(t * 5 + sd)) * s, 0, 0, 7); A.cw.fill();
    A.cw.restore();
    agwi(A.ink, x, y, s, t, sd, { am: .75 });
  }
  return worldO(cam);
}
// —— 6 confront: 서하 and the site manager, the empty lot between them ——
function confront(A, t) {
  scr(A);
  draw(A.ink, mk([[-20, 1508], [1100, 1500]], { w: 6, tone: .25, dry: .7, prof: 'even', seed: 3 }));
  mass(A.cw, [[0, 1510], [1080, 1500], [1080, 1580], [0, 1590]], .06, 4, 2);
  fig(A, t > 53.8 && t < 57.6 ? 'draw' : 'stand', { x: 260, y: 1500, s: 4.0, dir: 1, ch: 'seoha', t, seed: 61 });
  fig(A, 'stand', { x: 830, y: 1500, s: 4.1, dir: -1, ch: 'boss', t, seed: 41 });
  return screenO();
}
// —— 7 dig: low angle, the excavator towering; the bucket bites the roots; the ground cracks ——
function crackPts(seed, x0, y0, len) {
  const R = mulberry(seed), P = [[x0, y0]]; let x = x0, y = y0, a = (R() - .5) * .6 + (seed % 2 ? 0 : Math.PI);
  for (let i = 0; i < 7; i++) { a += (R() - .5) * .9; x += Math.cos(a) * len / 7; y += Math.sin(a) * len / 7 * .35; P.push([x, y]); }
  return P;
}
function cracks(A, cx, cy, p, n = 7, len = 520) {
  for (let k = 0; k < n; k++) draw(A.ink, mk(crackPts(100 + k, cx, cy, len * (.6 + (k % 3) * .25)), { w: 7, tone: TONE.jiao, dry: .45, wet: .2, prof: 'nail', seed: 200 + k }), clamp(p * 1.3 - k * .06));
}
function dig(A, t) {
  const k = lerp(1, 1.12, seg(t, 63.6, 74.4)), shake = (Math.exp(-Math.max(0, t - T.bite) * 6) * (t > T.bite ? 1 : 0) + Math.exp(-Math.max(0, t - T.tear) * 5) * (t > T.tear ? 1 : 0)) * 14;
  A.xf(k, 540 - 540 * k, 1200 - 1200 * k);
  // the ground and the trunk's foot at the left
  mass(A.cw, [[-200, 1760], [1300, 1750], [1300, 2300], [-200, 2300]], .14, 6, 5, [0, 1760, 0, 2200, 1, .3]);
  draw(A.ink, mk([[-200, 1760], [1300, 1748]], { w: 8, tone: .45, dry: .6, prof: 'even', seed: 6 }));
  mass(A.cw, [[60, 1780], [110, 1100], [90, 400], [130, -100], [380, -100], [330, 500], [350, 1100], [420, 1780]], .5, 10, 7, [60, 0, 420, 0, 1.2, .6]);
  draw(A.ink, mk([[80, 1780], [110, 1100], [100, 400], [130, -100]], { w: 70, tone: .85, darkDir: [-1, 0], side: .9, brWet: true, body: .35, dry: .45, wet: .9, prof: 'rise', seed: 8 }));
  draw(A.ink, mk([[400, 1780], [345, 1100], [330, 500], [380, -100]], { w: 40, tone: .8, darkDir: [1, 0], side: .9, brWet: true, body: .3, dry: .5, wet: .6, prof: 'even', seed: 10 }));   // bark, the lit edge dark
  for (const [bx, by, br] of [[230, 1340, 22], [180, 700, 16], [290, 420, 12]]) blot(A.cw, bx, by, br, .6, 0, .6, bx);   // knots
  draw(A.ink, mk([[96, 990], [240, 1030], [372, 1000]], { w: 14, tone: .85, dry: .35, prof: 'even', seed: 12 }));   // the rope round the trunk
  strips(A.ink, 240, 1780, 2.6, t, 0, 21);
  for (const [a, b] of [[60, -1], [420, 1]]) draw(A.ink, mk([[a, 1760], [a + b * 120, 1800], [a + b * 260, 1820]], { w: 50, tone: .7, darkDir: [0, 1], side: .8, brWet: true, body: .3, dry: .5, wet: .8, prof: 'cone', seed: 9 + a }));
  // the excavator: bucket comes down to the roots, bites, tears them up
  const down = ss(seg(t, T.engine, T.bite)), pull = ss(seg(t, T.tear, T.tear + 1.2));
  const boomA = lerp(-1.6, -2.15, down) + pull * .25, armA = lerp(4.0, 3.8, down) - pull * .35, bA = lerp(1.0, 1.7, down) - pull * .6;
  const ex = excavator(A.ink, 860, 1800 + shake * .2, 2.0, boomA, armA, bA);
  if (t > T.tear) {   // torn roots hanging from the bucket
    for (let j = 0; j < 5; j++) { const [x, y] = ex.teeth[j]; draw(A.ink, mk([[x, y], [x - 10 + j * 4, y + 60 + j * 14], [x - 20 + j * 8, y + 130 + j * 20]], { w: 9, tone: .8, dry: .55, prof: 'cone', seed: 300 + j })); }
  }
  if (t > T.crack[0]) { cracks(A, 300, 1765, seg(t, T.crack[0], T.crack[1])); blot(A.cw, 300, 1780, 40 + 220 * ss(seg(t, T.crack[0], T.crack[1] + 1)), .5, 0, .3, 7); }
  return screenO({ shake: [(vnoise(t * 40) - .5) * shake, (vnoise(t * 37 + 9) - .5) * shake] });
}
// —— 8 agwi: they rise from the crack in ink blooms; the manager cowers; 무진 (from behind) holds them; one is split ——
const RISE = [[520, 3.6, 2, 1180], [300, 2.6, 1, 1190], [760, 2.9, 3, 1200], [150, 2.0, 4, 1215], [920, 2.2, 5, 1215], [420, 1.7, 6, 1235], [650, 1.8, 7, 1235]];
function drawAgwiField(A, t, riseFn, o = {}) {
  RISE.forEach(([x, s, sd, gy], i) => {
    const rise = riseFn(i); if (rise <= 0) return;
    const split = o.split?.[sd];
    if (split && t > split) {   // split by a stroke: the upper half rises and fades, the lower half slumps; splatter stays
      const u = seg(t, split, split + 1.1), cy = gy - 110 * s;
      for (const [side, dy, rot, am] of [[-1, -120 * u, -.25 * u, 1 - u], [1, 40 * u, .3 * u, 1 - u * .6]]) {
        for (const c of [A.cw, A.cd]) { c.save(); c.beginPath(); if (side < 0) c.rect(x - 400, cy - 600, 800, 600 + (cy - cy)); else c.rect(x - 400, cy, 800, 600); c.clip(); c.translate(x, cy); c.rotate(rot); c.translate(-x, -cy + dy); }
        agwi(A.ink, x, gy, s, t, sd, { rise, am });
        for (const c of [A.cw, A.cd]) c.restore();
      }
      const R = mulberry(sd * 9); for (let k = 0; k < 22; k++) blot(A.cw, x + (R() - .5) * 300, cy + (R() - .5) * 120, 3 + R() * 7, .7 * (1 - u * .3), 0, 1, k);
      return;
    }
    agwi(A.ink, x, gy, s, t, sd, { rise, am: o.am ?? 1, lean: (x - 540) / 1600 });
  });
}
function agwiShot(A, t) {
  scr(A);
  const shake = (t > T.strike1 ? Math.exp(-(t - T.strike1) * 6) : 0) * 12 + (t > T.strike2 ? Math.exp(-(t - T.strike2) * 6) : 0) * 12;
  draw(A.ink, mk([[-20, 1252], [1100, 1246]], { w: 6, tone: .4, dry: .6, prof: 'even', seed: 3 }));
  cracks(A, 520, 1255, 1, 7, 620);
  const spread = ss(seg(t, 74.4, 78.5));
  for (let k = 0; k < 5; k++) blot(A.cw, 520 + (k - 2) * 150, 1268 + (k % 2) * 10, (60 + 220 * spread) * (1 - Math.abs(k - 2) * .18), .4, 0, .45, 7 + k);   // the dark spreading from the crack
  drawAgwiField(A, t, i => ss(seg(t, T.rise[0] + i * .45, T.rise[0] + 2.2 + i * .45)), { split: { 2: T.strike1 + .08, 7: T.strike2 + .08 } });
  fig(A, 'stand', { x: 1010, y: 1250, s: 1.3, dir: -1, ch: 'boss', t, seed: 41 });
  const striking = (t > T.strike1 - .25 && t < T.strike1 + .35) || (t > T.strike2 - .25 && t < T.strike2 + .35);
  fig(A, striking ? 'backWrite' : 'back', { x: 300, y: 2180, s: 10.0, dir: 1, ch: 'mujin', t, seed: 51 });
  for (const ts of [T.strike1, T.strike2]) if (t > ts - .04 && t < ts + .3) draw(A.ink, mk([[700, 700], [520, 1000], [300, 1300]], { w: 30, tone: .9, dry: .88, prof: 'even', rough: .2, nb: 50, seed: 500 + Math.floor(ts) }), seg(t, ts - .04, ts + .06));
  return screenO({ shake: [(vnoise(t * 40) - .5) * shake, (vnoise(t * 33) - .5) * shake] });
}
// —— 9 fail: 무진, front, close ——
function mujinClose(A, t) {
  scr(A);
  fig(A, 'front', { x: 540, y: 2050, s: 13, dir: 1, ch: 'mujin', t, seed: 51 });
  return screenO();
}
// —— 10 eyes: the style's one hard cut: her eyes in a few strokes ——
function eyes(A, t) {
  const k = lerp(1, 1.06, seg(t, 95.9, 100.6));
  A.xf(k, 540 - 540 * k, 960 - 960 * k);
  draw(A.ink, mk([[-40, 560], [300, 640], [700, 700], [1120, 820]], { w: 120, tone: .75, darkDir: [0, -1], side: .9, brWet: true, body: .35, dry: .4, wet: .9, prof: 'robe', seed: 3 }));   // a lock of hair across
  for (const [cx, dir] of [[330, -1], [760, 1]]) {
    draw(A.ink, mk([[cx - 150, 880], [cx, 846], [cx + 150, 872]], { w: 22, tone: TONE.jiao, dry: .35, wet: .2, prof: 'nail', seed: 10 + cx }));   // upper lid
    draw(A.ink, mk([[cx - 120, 760], [cx, 736], [cx + 130, 752]], { w: 18, tone: TONE.nong, dry: .5, prof: 'nail', seed: 20 + cx }));   // brow
    draw(A.ink, mk([[cx - 20, 900], [cx + 20, 905]], { w: 46, tone: TONE.jiao, wet: .6, dry: .15, prof: 'dot', seed: 30 + cx }));    // iris
    draw(A.ink, mk([[cx - 90, 960], [cx + 100, 958]], { w: 5, tone: .3, dry: .7, prof: 'tip', seed: 40 + cx }));                   // lower lid
  }
  blot(A.cw, 540, 1060, 460, .025, 0, .6, 9);   // a soft clear wash of the face
  return screenO({ vig: .3 });
}
// —— 11 climb: the hanging-scroll tilt up the excavator arm; she ends on the blade ——
const EXC_RAISED = [760, GY, 1.5, -1.95, .25, -1.57];
function climbPath(u) {   // along the raised arm: base → pivot → elbow → wrist/blade (world)
  const [x, y, s, bA, aA] = EXC_RAISED, piv = [x + 40 * s, y - 120 * s], el = [piv[0] + Math.cos(bA) * 300 * s, piv[1] + Math.sin(bA) * 300 * s], wr = [el[0] + Math.cos(bA + aA) * 220 * s, el[1] + Math.sin(bA + aA) * 220 * s];
  const P = [[x - 120, y], piv, el, [wr[0], wr[1] - 112 * s]];
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
  let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const f = d / L[i]; return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)]; } d -= L[i]; }
  return P[P.length - 1];
}
function climb(A, t) {
  const u = eio(seg(t, T.climbTilt[0], T.climbTilt[1]));
  // the blade comes down through the top of the frame on the right while 무진's line (m5) is up on the left; then it centres for her stand
  const cam = { x: lerp(410, 640, eio(seg(t, 105.8, T.stand))), y: lerp(1820, 760, u), z: lerp(1.25, 1.5, u) };
  const cu = ss(seg(t, 102.0, T.stand)), p = climbPath(cu);
  site(A, t, { cam, exc: EXC_RAISED, figs: [
    { pose: 'front', x: 420, y: GY, s: 1.08, dir: 1, ch: 'mujin', t, seed: 51 },
    { pose: 'stand', x: 980, y: GY, s: 1.0, dir: -1, ch: 'boss', t, seed: 41 },
    { pose: t < T.stand ? (Math.floor(t * 4) % 2 ? 'touch' : 'walk2') : 'front', x: p[0], y: p[1], s: 1.0, dir: 1, ch: 'seoha', t, seed: 61 },
  ] });
  return worldO(cam);
}
// —— 12 climax: still on the blade; one stroke of flying white crosses the frame; the god speaks; they sink back ——
function onBlade(A, t) {
  const p = climbPath(1), z = lerp(1.7, 1.95, seg(t, 113, 116.2)), cam = { x: p[0], y: p[1] - 60, z };
  site(A, t, { cam, exc: EXC_RAISED, figs: [{ pose: t > T.white[1] ? 'bow' : 'front', x: p[0], y: p[1], s: 1.0, dir: 1, ch: 'seoha', t, seed: 61 }] });
  if (t > T.white[1]) {   // the god arrives: a clear-ink halo spreading behind her
    const r = 60 + 420 * ss(seg(t, T.white[1], T.white[1] + 1.6));
    for (let k = 0; k < 3; k++) blot(A.cw, p[0], p[1] - 60, r * (1 - k * .25), .06, 0, 1, 40 + k);
  }
  scr(A);
  if (t > T.white[0]) draw(A.ink, mk([[1180, 240], [800, 700], [420, 1150], [-120, 1700]], { w: 230, tone: .95, dry: .5, wet: .05, prof: 'even', rough: .2, nb: 64, seed: 777, fade: .05 }), seg(t, T.white[0], T.white[1]), 1 - .7 * seg(t, T.white[1] + .6, T.white[1] + 2.4));
  return worldO(cam, { flash: t > T.white[1] ? .25 * Math.exp(-(t - T.white[1]) * 5) : 0 });
}
function sinking(A, t) {
  scr(A);
  draw(A.ink, mk([[-20, 1252], [1100, 1246]], { w: 6, tone: .4, dry: .6, prof: 'even', seed: 3 }));
  const close = 1 - ss(seg(t, 118.6, T.close));
  if (close > 0) cracks(A, 520, 1255, close, 7, 620);
  for (let k = 0; k < 5; k++) blot(A.cw, 520 + (k - 2) * 150, 1268 + (k % 2) * 10, (60 + 220 * close) * (1 - Math.abs(k - 2) * .18), .4 * close, 0, .45, 7 + k);
  drawAgwiField(A, t, i => 1 - ss(seg(t, T.sink[0] + i * .3, T.sink[0] + 2.0 + i * .3)), {});
  fig(A, 'front', { x: 330, y: 1250, s: 1.8, dir: 1, ch: 'mujin', t, seed: 51 });
  fig(A, 'stand', { x: 960, y: 1250, s: 1.6, dir: -1, ch: 'boss', t, seed: 41 });
  return screenO();
}
// —— 13 dawn: the opening framing again; the tree stays; the parked excavator; three small figures; the red thread drying ——
const EXC_PARKED = [880, GY, .95, -2.8, 1.9, 1.2];
function dawn(A, t) {
  const cam = { x: 540, y: 1600, z: lerp(.62, .66, seg(t, 121, 131.6)) };
  site(A, t, { cam, exc: EXC_PARKED, figs: [
    { pose: 'front', x: 450, y: GY, s: 1.0, dir: 1, ch: 'seoha', t, seed: 61 },
    { pose: 'front', x: 380, y: GY, s: 1.08, dir: 1, ch: 'mujin', t, seed: 51 },
    { pose: 'stand', x: 660, y: GY, s: 1.0, dir: -1, ch: 'boss', t, seed: 41 },
  ] });
  scr(A); mass(A.cw, [[0, 900], [1080, 860], [1080, 1000], [0, 1040]], .05 * ss(seg(t, 121, 125)), 20, 4);   // a pale band of first light
  return worldO(cam, { paperCol: DAWN, vig: .18, warm: .65 });
}
function thread(A, t) {
  scr(A);
  const dry = seg(t, T.thread[0] + .4, T.thread[1]);
  draw(A.ink, mk([[-60, 1500], [400, 1120], [900, 760], [1180, 560]], { w: 280, tone: .2, wet: 1 - .8 * dry, dry: .1, prof: 'robe', seed: 3 }));   // the forearm, clear ink, drying
  draw(A.ink, mk([[-60, 1640], [420, 1260], [1180, 700]], { w: 60, tone: .6, darkDir: [0, 1], side: .85, brWet: true, body: .3, dry: .45, wet: .8 - .6 * dry, prof: 'robe', seed: 4 }));
  for (const [a, b] of [[[420, 1000], [560, 1210]], [[452, 980], [592, 1188]]]) draw(A.ink, mk([a, b], { w: 16, color: VERM, tone: .95, dry: .25, prof: 'even', nb: 10, seed: 5 + a[0] }));
  A.cc.setTransform(1, 0, 0, 1, 0, 0); seal(A.cc, 870, 1520, 110, ss(seg(t, T.seal2, T.seal2 + .25)), 9);
  return screenO({ paperCol: DAWN, vig: .18, warm: .65, fade: ss(seg(t, T.fade[0], T.fade[1])) });
}

// —— dispatcher with ink-bloom transitions ——
function bloomPair(A, B, t, fa, fb, t0, t1, c) {
  const oa = fa(A, t), ob = fb(B, t), u = seg(t, t0, t1);
  return { ...oa, paperB: ob.paper, bleedB: ob.bleed, rimB: ob.rim, trans: [c[0], c[1], 20 + 2600 * ss(u), 1] };
}
export function frame(t, A, B, TMP) {
  if (t < 9.6) return open(A, t);
  if (t < 15.6) return title(A, t, TMP);
  if (t < 33.4) return arrive(A, t);
  if (t < 36.0) return bellInsert(A, t, t > T.ring[0] && t < T.ring[1] ? 1 : 0);
  if (t < 36.9) return bloomPair(A, B, t, bellInsert, crown, 36.0, 36.9, [620, 760]);
  if (t < 38.6) return crown(A, t);
  if (t < 41.4) return bloomPair(A, B, t, crown, vision, 38.6, 41.4, [540, 1400]);
  if (t < 52.8) return vision(A, t);
  if (t < 63.6) return confront(A, t);
  if (t < 74.4) return dig(A, t);
  if (t < 88.0) return agwiShot(A, t);
  if (t < 90.6) return bellInsert(A, t, 0);
  if (t < 91.4) return bloomPair(A, B, t, (a, tt) => bellInsert(a, tt, 0), mujinClose, 90.6, 91.4, [620, 760]);
  if (t < 95.9) return mujinClose(A, t);
  if (t < 100.6) return eyes(A, t);
  if (t < 113.0) return climb(A, t);
  if (t < 116.2) return onBlade(A, t);
  if (t < 117.0) return bloomPair(A, B, t, onBlade, sinking, 116.2, 117.0, [540, 1000]);
  if (t < 121.0) return sinking(A, t);
  if (t < 131.6) return dawn(A, t);
  if (t < 132.4) return bloomPair(A, B, t, dawn, thread, 131.6, 132.4, [500, 1100]);
  return thread(A, t);
}
// subtitle position in each shot's empty paper: [x, y, size]
export function subPos(id, t) {
  if (t < 15.6) return [70, 250, 50];
  if (t < 41) return [70, 240, 50];
  if (t < 52.8) return [50, 120, 44, 430];
  if (t < 95.9) return [70, 260, 50];
  if (t < 100.6) return [70, 1560, 50];
  if (t < 106.4) return [60, 230, 46, 560];
  if (t < 113) return [70, 230, 50];
  if (t < 121) return [70, 1620, 54];
  return [70, 260, 50];
}
