// 막차 — the shots. Each shot draws into S.g (colour) and S.e (emissive); cels on 12 fps (performance beats on 8), camera and light on 24.
import { canvas, W, H, TAU, LWK, rgba, mix, vgrad, airbrush, rng, hash, poly, path, cel, line } from './cel.js';
import { head80 } from './heads.js';
import { pal, CH } from './cast.js';
import { speedLines, lamp, flare } from './fx.js';
import { celLayer, talismanHand, fist } from './frames.js';
import { PLAT, quad, fillQuad, qPath, paintPlatform, paintCar, CAR, tunnelWindow, paintCarLong, paintCab, CAB, tunnelAhead, paintMap, MAPST } from './plates.js';
import { bellHand, handset, phone, driverBack, driverBacklit, shadowPerson, SHADOW_PTS } from './props.js';
import { VO, T, BEAT, seg, ss, clamp, q12, q8 } from './story.js';

// ——— plates, painted once (lazily) ———
const PL = {}; const plate = (k, fn) => PL[k] || (PL[k] = fn());
function drawPlate(S, P, o = {}) {
  const k = o.k || 1, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, dx = o.dx || 0, dy = o.dy || 0;
  for (const [c, src] of [[S.g, P.gc], [S.e, P.ec]]) { c.save(); c.translate(cx + dx, cy + dy); c.scale(k, k); c.translate(-cx, -cy); c.drawImage(src, 0, 0); c.restore(); }
}
const cam = (S, k, cx, cy, dx = 0, dy = 0) => { for (const c of [S.g, S.e]) { c.translate(cx + dx, cy + dy); c.scale(k, k); c.translate(-cx, -cy); } };
const camReset = S => { for (const c of [S.g, S.e]) c.setTransform(1, 0, 0, 1, 0, 0); };

// ——— performance: lip flaps (8 fps) from the measured line timings, blinks ———
let DURS = {}; export const setDurs = d => { DURS = d; };
const speaking = (who, t) => VO.find(v => v.who === who && t >= v.t && t < v.t + (DURS[v.id] ?? 2));
const FLAPS = ['talk', 'set', 'talk', 'closed', 'talk', 'set'];
function mouthOf(who, t, rest) { const v = speaking(who, t); if (!v) return rest; const k = Math.floor((t - v.t) * 8); return FLAPS[(k + Math.floor(hash(k * 1.7 + v.t) * 3)) % FLAPS.length]; }
const blink = (t, seed) => ((q8(t) + seed * 1.37) % (2.9 + seed * .4)) < .125;
function face(who, t, base, seed, o = {}) {
  const v = speaking(who, t), m = mouthOf(who, t, null);
  const r = { expr: base };
  if (m) r.mouth = (base === 'shout' && m !== 'closed') ? (m === 'set' ? 'pant' : 'shout') : m;
  if (!o.noBlink && blink(t, seed)) r.open = 0;
  return r;
}
const bands = (c, t, cols = ['#ff8a2c', '#ff9a3c'], speed = 1400, a = .3) => {   // light bands sweeping across the cels (source-atop)
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < cols.length; k++) {
    const x = W + 300 - ((t * speed + k * 1100) % 2400);
    const gr = c.createLinearGradient(x - 180, 0, x + 180, 0); gr.addColorStop(0, rgba(cols[k], 0)); gr.addColorStop(.5, rgba(cols[k], a)); gr.addColorStop(1, rgba(cols[k], 0));
    c.fillStyle = gr; c.beginPath(); c.moveTo(x - 180, 0); c.lineTo(x + 180, 0); c.lineTo(x + 40, H); c.lineTo(x - 320, H); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
};
// impact frame: everything drawn so far as a flat silhouette over radial lines (2 frames)
const [IC, IG] = canvas(W, H);
function impactFrame(S, cx, cy, layer) {
  IG.setTransform(1, 0, 0, 1, 0, 0); IG.globalCompositeOperation = 'source-over'; IG.clearRect(0, 0, W, H); IG.drawImage(layer, 0, 0);
  IG.globalCompositeOperation = 'source-in'; IG.fillStyle = '#0a0812'; IG.fillRect(0, 0, W, H); IG.globalCompositeOperation = 'source-over';
  S.g.setTransform(1, 0, 0, 1, 0, 0); S.g.fillStyle = '#f4f0ff'; S.g.fillRect(0, 0, W, H);
  speedLines(S.g, S.fr, { type: 'radial', cx, cy, n: 150, col: '#0a0812', a: .9, r0: 220, seed: 9, wmul: 1.4 });
  S.g.drawImage(IC, 0, 0); S.e.fillStyle = '#000'; S.e.fillRect(0, 0, W, H);
  S.over = { bloom: .15, halo: 0 };
}
const shake = (t, t0, amp = 22) => { const k = seg(t, t0, t0 + .3); if (k <= 0 || k >= 1) return [0, 0]; const f = Math.floor(t * 24); return [(hash(f * 1.3) - .5) * amp * (1 - k), (hash(f * 2.1) - .5) * amp * (1 - k)]; };

// ——————————————————————————————— shots ———
// 1 the station that isn't there: the sleeper's shadow steps off; the PA; the doors close
export function hook(S) {
  const { g, e, t } = S, P = plate('platN', () => paintPlatform('none')), k = 1 + .05 * ss(t / 7.5);
  const sh = t > T.depart ? [(hash(Math.floor(t * 24)) - .5) * 6, 0] : [0, 0];
  drawPlate(S, P, { k, cx: 540, cy: 900, dx: sh[0] });
  cam(S, k, 540, 900, sh[0]);
  doorsLeaves(S, ss(seg(t, T.doorsClose, T.doorsClose + .5)));
  const p = ss(seg(t, T.shadowOff[0], T.shadowOff[1])), { M, DOOR } = PLAT;
  const [a0x, a0y] = M((DOOR[0] + DOOR[1]) / 2, .02), x = a0x + (P.sx - a0x) * p, y = a0y + (P.sy - a0y) * p, s = .55 + (1.12 - .55) * p;
  const bob = p > 0 && p < 1 ? -Math.abs(Math.sin(Math.floor(t * 12) * Math.PI / 2)) * 8 : 0;
  if (t > T.shadowOff[0]) {
    celLayer(S, c => shadowPerson(c, x, y + bob, s, { k: Math.min(1, (t - T.shadowOff[0]) * 2.5), fr: S.fr }));
    e.save(); e.globalAlpha = .5 * Math.min(1, (t - T.shadowOff[0]) * 2); e.translate(x, y + bob); e.scale(s, s); e.strokeStyle = '#9a4cff'; e.lineWidth = 7; e.stroke(path(SHADOW_PTS.slice(0, 12), false)); e.restore();
  }
  camReset(S);
  if (t > T.depart) { const a = seg(t, T.depart, 7.5); g.fillStyle = rgba('#000000', .15 * a); speedLines(g, S.fr, { type: 'h', n: 30, col: '#c8f4ee', a: .25 * a, hmax: 5, seed: 2 }); }
}
function doorsLeaves(S, c) {   // stainless door leaves sliding shut over the openings
  if (c <= 0) return;
  const { M, DOOR, DOOR2 } = PLAT;
  for (const [u0, u1] of [DOOR, DOOR2]) {
    const m = (u0 + u1) / 2, hw = (u1 - u0) / 2 * c;
    for (const [a, b] of [[u0, u0 + hw], [u1 - hw, u1]]) {
      const q = quad(M, a, .03, b, .86); fillQuad(S.g, q, '#9aa4ae'); fillQuad(S.e, q, '#000');
      const w = quad(M, a + (b - a) * .2, .4, a + (b - a) * .8, .74); fillQuad(S.g, w, '#c8ecE6'.toLowerCase());
    }
  }
}

// 2 the title: rushing down the tunnel; 「막차」 in chrome, flickering on at 12 fps, a light sweep, a star glint
export function title(S) {
  const { g, e, t, lt } = S;
  tunnelAhead(g, e, t, 540, 820, 1.4, 0, 1.1);
  const on = lt < .5 ? (Math.floor(lt * 12) % 2 === 0 ? 1 : 0) : 1;
  if (!on) return;
  chromeText(S, '막차', 540, 900, 330, ss(seg(lt, 1.4, 2.4)));
  g.save(); g.font = 'italic 800 46px Pretendard'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = '#0a0612'; g.lineWidth = 8; g.strokeText('LINE 2 · 00:48', 540, 1130); g.fillStyle = '#8ff4ff'; g.fillText('LINE 2 · 00:48', 540, 1130); g.restore();
  e.save(); e.font = 'italic 800 46px Pretendard'; e.textAlign = 'center'; e.textBaseline = 'middle'; e.fillStyle = rgba('#5ae8ff', .6); e.fillText('LINE 2 · 00:48', 540, 1130); e.restore();
  if (lt > 2.4 && lt < 3.2) { const a = 1 - Math.abs(lt - 2.8) / .4; flare(e, 790, 760, .5 * a, '#ffffff', { ghosts: false, streak: 500 }); }
}
export function chromeText(S, txt, x, y, size, sweep = 0) {
  const { g, e } = S;
  for (const c of [g, e]) { c.save(); c.font = `${size}px "Black Han Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; }
  const m = g.measureText(txt), top = y - size * .45, bot = y + size * .45;
  g.strokeStyle = '#120a22'; g.lineWidth = size * .09; g.strokeText(txt, x, y);
  g.strokeStyle = '#ff4fa8'; g.lineWidth = size * .03; g.strokeText(txt, x, y);
  const gr = g.createLinearGradient(0, top, 0, bot);
  [[0, '#8fd8ff'], [.44, '#ffffff'], [.47, '#ffffff'], [.5, '#6a4aa8'], [.74, '#ff6ab0'], [1, '#ffd06a']].forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillText(txt, x, y);
  if (sweep > 0 && sweep < 1) {   // a white light sweep across the letters
    g.globalCompositeOperation = 'source-atop'; const sx = x - m.width / 2 - 200 + (m.width + 400) * sweep;
    const sg = g.createLinearGradient(sx - 60, 0, sx + 60, 0); sg.addColorStop(0, rgba('#ffffff', 0)); sg.addColorStop(.5, rgba('#ffffff', .9)); sg.addColorStop(1, rgba('#ffffff', 0));
    g.fillStyle = sg; g.fillRect(sx - 60, top - 40, 120, bot - top + 80); g.globalCompositeOperation = 'source-over';
  }
  e.strokeStyle = '#ff4fa8'; e.lineWidth = size * .05; e.strokeText(txt, x, y); e.fillStyle = rgba('#ffd8f0', .35); e.fillText(txt, x, y);
  for (const c of [g, e]) c.restore();
}

// 3 the car: 서하 and 무진 on the far bench, facing each other a little
export function two(S) {
  const { g, e, t } = S, P = plate('car', paintCar), k = 1 + .06 * ss(seg(t, 27.9, 30));
  drawPlate(S, P, { k, cx: 760, cy: 900 });
  cam(S, k, 760, 900);
  for (const [x, y, w, h] of CAR.win) tunnelWindow(g, e, x, y, w, h, t, 1);
  camReset(S);
  celLayer(S, c => {
    c.translate(760, 900); c.scale(k, k); c.translate(-760, -900);
    c.save(); c.translate(270, 980); c.scale(1.74, 1.74); head80(c, pal('seoha', 'car'), { ch: CH.seoha, view: 'q', wind: 0, look: [.4, 0], ...face('seoha', t, 'determined', 1) }); c.restore();
    c.save(); c.translate(830, 962); c.scale(-1.8, 1.8); head80(c, pal('mujin', 'car'), { ch: CH.mujin, view: 'q', wind: 0, look: [.35, .05], ...face('mujin', t, 'stern', 2) }); c.restore();
    bands(c, t, ['#ff8a2c'], 900, .22);
  });
}
// 4 서하 close, the talisman comes up: "끝은, 제가 내요."
export function seoha(S) {
  const { g, e, t } = S, P = pal('seoha', 'car');
  carWindowBack(S, t, 1);
  const hy = 1900 - 570 * ss(seg(t, 32.7, 33.3));
  celLayer(S, c => {
    c.translate(500, 900); c.scale(2.9, 2.9);
    head80(c, P, { ch: CH.seoha, view: 'q', wind: 0, look: [.45, -.05], reflect: '#ff9a3c', rim: { c: '#ff9a3c', d: [1.4, .6] }, ...face('seoha', t, 'determined', 3) });
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (hy < 1900) talismanHand(c, P, 860, hy, -.12);
    bands(c, t, ['#ff8a2c', '#ff9a3c'], 1400, .34);
  });
}
function carWindowBack(S, t, speed = 1, station = 0) {   // the window behind a close-up: tunnel streaks, a tube above
  const { g, e } = S, fr = S.fr;
  vgrad(g, 0, 0, W, H, [[0, '#0a0c16'], [.5, '#141626'], [1, '#07080e']]);
  g.fillStyle = '#05060a'; g.fillRect(40, 300, 1000, 760); g.strokeStyle = '#c8ccc0'; g.lineWidth = 18; g.strokeRect(40, 300, 1000, 760);
  g.save(); g.beginPath(); g.rect(49, 309, 982, 742); g.clip();
  if (station > 0) vgrad(g, 0, 300, W, 760, [[0, mix('#05060a', '#e8f4f0', station)], [1, mix('#05060a', '#9ab8b0', station)]]);
  if (speed > 0) { speedLines(g, fr, { type: 'h', n: 26, col: '#ff9a3c', a: .8 * speed, hmax: 14, seed: 3 }); speedLines(e, fr, { type: 'h', n: 26, col: '#ff8a2c', a: .7 * speed, hmax: 14, seed: 3 }); speedLines(g, fr + 5, { type: 'h', n: 40, col: '#4a5a8a', a: .5 * speed, hmax: 4, seed: 4 }); }
  g.restore();
  g.fillStyle = '#e8fffa'; g.fillRect(140, 110, 800, 22); lamp(null, e, 540, 121, 60, '#a8fff0', .5); e.fillStyle = rgba('#b8fff4', .6); e.fillRect(140, 110, 800, 22);
  airbrush(g, 540, 160, 520, 140, '#bff4ea', .12);
}

// 5 side tracking through the cars → 서준 asleep in car 7
export function track(S) {
  const { g, e, t } = S, P = plate('carLong', paintCarLong), camX = 1950 * ss(seg(t, 35, 38.6)), walking = t < 38.6;
  for (const [c, src] of [[g, P.gc], [e, P.ec]]) c.drawImage(src, -camX, 0);
  for (const [x, y, w, h] of P.wins) if (x - camX > -320 && x - camX < W) tunnelWindow(g, e, x - camX, y, w, h, t, 1);
  const fr = Math.floor(t * 12), bob = walking ? -Math.abs(Math.sin(fr * Math.PI / 2)) * 10 : 0;
  celLayer(S, c => {
    c.save(); c.translate(2390 - camX, 900); c.rotate(.22); c.scale(1.35, 1.35); head80(c, pal('seojun', 'car'), { ch: CH.seojun, view: 'q', expr: 'asleep', wind: 0 }); c.restore();
    c.save(); c.translate(330, 840 + bob); c.scale(1.45, 1.45);
    head80(c, pal('seoha', 'car'), { ch: CH.seoha, view: 'side', wind: walking ? .35 : 0, ph: (fr % 4) / 4, ...face('seoha', t, t > 38.85 ? 'surprised' : 'determined', 4, { noBlink: t > 38.6 }) });
    c.restore();
    bands(c, t, ['#ff8a2c'], 1100, .2);
  });
}
// 6 insert: his phone, his last message
export function phoneShot(S) {
  const { g, e, t, lt } = S;
  vgrad(g, 0, 0, W, H, [[0, '#2e3a36'], [1, '#141a18']]);
  const R = rng(3); for (let k = 0; k < 14; k++) { const col = ['#ff9a3c', '#8ff4ff', '#ffe08a'][k % 3]; airbrush(g, R() * W, R() * H, 60 + R() * 90, 60 + R() * 90, col, .18); lamp(null, e, R() * W, R() * H, 20 + R() * 30, col, .12); }
  // his lap (the hoodie), his hand
  const PJ = pal('seojun', 'car');
  cel(g, [[-60, 1500], [200, 1260], [880, 1240], [1140, 1480], [1140, 1980], [-60, 1980]], { f: PJ.hood.f, s: PJ.hood.s, so: [-30, -20], l: PJ.hood.l, lw: 4 });
  phone(g, e, 540, 900 - 20 * ss(lt / 2.5), -.06, t, PJ);
  cel(g, [[180, 1180], [260, 1100], [330, 1140], [300, 1300], [200, 1330]], { f: PJ.skin.f, s: PJ.skin.s, so: [-10, -6], l: PJ.skin.l, lw: 3 });   // thumb at the edge
  const sw = seg(lt, .3, 1.6); if (sw > 0 && sw < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const x = -200 + sw * 1500; const gr = g.createLinearGradient(x - 80, 0, x + 80, 0); gr.addColorStop(0, rgba('#ffffff', 0)); gr.addColorStop(.5, rgba('#ffffff', .25)); gr.addColorStop(1, rgba('#ffffff', 0)); g.fillStyle = gr; g.translate(540, 900); g.rotate(-.5); g.fillRect(x - 540 - 80, -1200, 160, 2400); g.restore(); }
}
// 7 the cab door: the talisman slapped on, glowing, igniting
export function talismanShot(S) {
  const { g, e, t, lt } = S, P = pal('seoha', 'car');
  vgrad(g, 0, 0, W, H, [[0, '#5a6874'], [1, '#2e3640']]);
  g.fillStyle = '#7a8894'; g.fillRect(90, 120, 900, 1700); g.strokeStyle = '#2a323a'; g.lineWidth = 8; g.strokeRect(90, 120, 900, 1700);
  for (let y = 160; y < 1800; y += 120) for (const x of [130, 950]) { g.fillStyle = '#4a5662'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  g.fillStyle = '#0c0e14'; g.fillRect(320, 220, 440, 300); g.strokeStyle = '#c8ccd0'; g.lineWidth = 10; g.strokeRect(320, 220, 440, 300);
  g.fillStyle = '#f2f2ee'; g.fillRect(420, 580, 240, 64); g.fillStyle = '#1a1e26'; g.font = '800 40px Pretendard'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('운전실', 540, 613);
  const stuck = t >= T.slap, burn = seg(t, T.ignite, T.ignite + .9);
  if (stuck) {   // the talisman on the door
    const T0 = [[430, 720], [650, 712], [660, 1330], [440, 1340]];
    cel(g, poly(T0), { f: P.talisman.f, s: P.talisman.s, sh: [[[430, 720], [470, 718], [476, 1338], [440, 1340]]], l: P.talisman.l, lw: 4 });
    g.save(); g.clip(poly(T0)); g.strokeStyle = P.ink; g.lineCap = 'round'; g.lineWidth = 12; g.strokeRect(462, 752, 168, 556);
    g.lineWidth = 14; g.beginPath(); g.moveTo(546, 790); g.lineTo(548, 1240); g.stroke();
    const R = rng(17); for (let k = 0; k < 6; k++) { const yy = 830 + k * 66; g.beginPath(); g.moveTo(490 + R() * 10, yy); g.quadraticCurveTo(546, yy - 16, 604 - R() * 10, yy + 8); g.stroke(); }
    const glow = seg(t, T.slap + .2, T.ignite); e.save(); e.clip(poly(T0)); e.strokeStyle = rgba('#ff3a1c', .9 * glow); e.lineWidth = 16; e.strokeRect(462, 752, 168, 556); e.beginPath(); e.moveTo(546, 790); e.lineTo(548, 1240); e.stroke(); e.restore();
    if (burn > 0) {   // the burning edge climbs from the bottom; char below it
      const by = 1340 - 640 * burn;
      g.fillStyle = '#1a0e08'; g.fillRect(400, by, 300, 1400 - by);
      for (const c of [g, e]) { const gr = c.createLinearGradient(0, by - 50, 0, by + 30); gr.addColorStop(0, rgba('#ff6a1c', 0)); gr.addColorStop(.6, rgba('#ffb04a', .95)); gr.addColorStop(1, rgba('#ff3a10', .6)); c.fillStyle = gr; c.fillRect(420, by - 50, 260, 80); }
      const Re = rng(5 + S.fr % 4); for (let k = 0; k < 18; k++) lamp(g, e, 430 + Re() * 240, by - Re() * 240 * burn, 3 + Re() * 4, '#ffb04a', .9);
    }
    g.restore();
    if (burn > .7) flare(e, 546, 1340 - 640 * burn, (burn - .7) * 2.5, '#ffb04a', { ghosts: false, streak: 600 });
  }
  // the hand: in, slap, out
  const hin = ss(seg(t, T.slap - .6, T.slap)), hout = ss(seg(t, T.slap + .35, T.slap + .9)), hy = 1900 - 820 * hin + 900 * hout;
  if (hy < 1900) celLayer(S, c => { c.translate(560, hy); c.rotate(-.05); c.scale(1.15, 1.15); handFlat(c, P); });
}
function handFlat(c, P) {   // an open palm pressing forward (back of the hand toward us)
  const S = { f: P.skin.f, s: P.skin.s, h: P.skin.h, l: P.skin.l, lw: 3.2 };
  cel(c, poly([[-150, 700], [-136, 250], [100, 236], [150, 680]]), { f: P.coat.f, s: P.coat.s, so: [-30, 0], h: P.coat.h, ho: [8, 0], l: P.coat.l, lw: 4 });
  cel(c, [[-120, 240], [-130, 110], [-100, 10], [100, 10], [120, 110], [96, 240]], { ...S, so: [-16, -6] });
  for (let k = 0; k < 4; k++) { const x = -96 + k * 62; cel(c, [[x - 24, 30], [x - 26, -150 + Math.abs(k - 1.5) * 26], [x + 2, -176 + Math.abs(k - 1.5) * 26, 1], [x + 28, -150 + Math.abs(k - 1.5) * 26], [x + 26, 30]], { ...S, so: [-8, 0] }); }
  cel(c, [[-120, 150], [-200, 60], [-190, 20], [-140, 40], [-100, 100]], { ...S, so: [-6, -6] });
}
// 8 impact → speed: the train answers the talisman by running faster
export function speed(S) {
  const { g, e, t, lt } = S, P = pal('seoha', 'tunnel');
  vgrad(g, 0, 0, W, H, [[0, '#0a0618'], [1, '#1a0c20']]);
  speedLines(g, S.fr, { type: 'h', n: 90, col: '#ffb060', a: .7, hmax: 18, seed: 31 }); speedLines(e, S.fr, { type: 'h', n: 50, col: '#ff8a2c', a: .55, hmax: 14, seed: 31 });
  speedLines(g, S.fr + 3, { type: 'h', n: 60, col: '#c8b8ff', a: .45, hmax: 6, seed: 32 });
  const L = celLayer(S, c => {
    c.translate(520, 960); c.scale(2.7, 2.7);
    head80(c, P, { ch: CH.seoha, view: 'q', wind: .9, ph: (S.fr % 4) / 4, look: [.3, -.1], rim: { c: '#ffb060', d: [1.6, .8] }, ...face('seoha', t, lt < .8 ? 'surprised' : 'determined', 5) });
    bands(c, t, ['#ffb060', '#ff6a2c'], 3200, .38);
  });
  if (lt < 2 / 12) impactFrame(S, 540, 900, L);
}
// 9 무진: "멈춰라! 싸울수록 빨라진다!"
export function mujin(S) {
  const { g, e, t } = S, P = pal('mujin', 'tunnel');
  vgrad(g, 0, 0, W, H, [[0, '#0e0a1c'], [1, '#1a1026']]);
  speedLines(g, S.fr, { type: 'h', n: 80, col: '#ffb060', a: .55, hmax: 16, seed: 41 }); speedLines(e, S.fr, { type: 'h', n: 40, col: '#ff8a2c', a: .45, hmax: 12, seed: 41 });
  celLayer(S, c => {
    c.translate(560, 920); c.scale(2.6, 2.6);
    head80(c, P, { ch: CH.mujin, view: 'q', wind: 0, look: [.25, .05], rim: { c: '#ffb060', d: [1.4, .8] }, ...face('mujin', t, 'shout', 6) });
    bands(c, t, ['#ffb060'], 3000, .3);
  });
}
// 10 the next station that isn't there: shadows stream to the door; 무진 backlit, filling it
export function door(S) {
  const { g, e, t, lt } = S, P = plate('platN', () => paintPlatform('none')), { M, DOOR } = PLAT;
  drawPlate(S, P);
  const [dcx, dcy] = M((DOOR[0] + DOOR[1]) / 2, .45), [fx, fy] = M((DOOR[0] + DOOR[1]) / 2, .03);
  celLayer(S, c => {   // 무진 in the doorway: a backlit silhouette with a warm rim
    c.save(); c.clip(qPath(quad(M, DOOR[0], .03, DOOR[1], .86))); c.translate(dcx + 6, dcy - 40); c.scale(.62, .62);
    head80(c, pal('mujin', 'sil'), { ch: CH.mujin, view: 'front', expr: 'stern', wind: 0, skinRim: '#ffe0b0', rim: { c: '#ffe0b0', d: [2, 1] } });
    c.fillStyle = '#100c18'; c.fillRect(-190, 330, 380, 700); c.restore();
  });
  const R = rng(77);
  celLayer(S, c => {
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, d = .55 + R() * .5, st = 52.5 + i * .25, p = ss(seg(t, st, st + 4.5));
      const x0 = dcx + side * (420 + R() * 260), y0 = 1280 + R() * 500, x = x0 + (fx + side * 40 * (1 - p) - x0) * p, y = y0 + (fy + 30 - y0) * p, s = d * (1 - p * .45);
      shadowPerson(c, x, y, s, { k: .95, v: i % 3, flip: side > 0, fr: S.fr + i });
    }
  });
}
// 11 무진's fists: each punch on the beat, a two-frame impact
export function punch(S) {
  const { g, e, t } = S, P = pal('mujin', 'tunnel');
  const pi = T.punches.filter(p => t >= p).length - 1, tp = pi >= 0 ? T.punches[pi] : -9, since = t - tp;
  const [sx, sy] = shake(t, tp, 26);
  vgrad(g, 0, 0, W, H, [[0, '#0e0a1c'], [.6, '#1c1230'], [1, '#08060e']]);
  g.fillStyle = '#2a2440'; g.fillRect(560, 180, 520, 1200); g.fillStyle = '#c8f4ec'; g.fillRect(600, 220, 440, 1140); e.fillStyle = rgba('#8fe8dc', .5); e.fillRect(600, 220, 440, 1140);
  const FX = 380 + sx, FY = 1230 + sy;
  speedLines(g, S.fr, { type: 'radial', cx: FX, cy: FY, n: 120, col: '#e8e0ff', a: .5, r0: 260, seed: 9 });
  const thrust = since < .3 ? 1.12 : .86 + .26 * ss(seg(since, .3, 1.1));
  const L = celLayer(S, c => {
    c.save(); c.translate(690 + sx, 760 + sy); c.scale(2.35, 2.35);
    head80(c, P, { ch: CH.mujin, view: 'q', wind: 0, look: [.1, .3], rim: { c: '#b48cff', d: [1.5, 1] }, expr: 'shout', mouth: since < .5 ? 'shout' : 'pant' });
    c.restore();
    fist(c, P, FX, FY, thrust);
    const R = rng(3 + pi);   // shadows in the foreground, blown back by the last punch
    for (let k = 0; k < 3; k++) { const fly = ss(seg(since, 0, .6)); shadowPerson(c, (k === 1 ? 120 : k === 2 ? 980 : -40) + (k - 1) * 300 * fly, 2050 + 120 * fly, 1.8 + R() * .3, { k: 1 - fly * .8, v: k, flip: k === 2, fr: S.fr + k }); }
  });
  lamp(g, e, FX - 60, FY - 120, 22, '#ffb347', .9);
  if (since >= 0 && since < 2 / 12) impactFrame(S, FX, FY, L);
}
// 12 his shadow peels from his feet: lying flat on the floor, it stands up off his shoes and is pulled toward the door
export function peel(S) {
  const { g, e, t } = S, p = ss(seg(t, T.peel[0], T.peel[1] - .6));
  vgrad(g, 0, 0, W, H, [[0, '#2e4a84'], [.12, '#2a4070'], [.16, '#1a1e28'], [.2, '#7a8288'], [1, '#4a5056']]);
  const R = rng(4); for (let k = 0; k < 700; k++) { g.fillStyle = rgba(R() < .5 ? '#ffffff' : '#000000', .08); g.fillRect(R() * W, 390 + R() * 1530, 4, 4); }
  const FX = 640, FY = 1500;   // his heels
  // the shadow: flat on the floor (foreshortened) → upright, sliding left toward the door
  celLayer(S, c => {
    const sy = .28 + .72 * p, rot = -1.05 * (1 - p) - .12 * p, dx = -320 * ss(seg(p, .4, 1));
    c.save(); c.translate(FX - 60 + dx, FY - 20); c.rotate(rot); c.scale(1.9, 1.9 * sy);
    cel(c, path(SHADOW_PTS), { f: '#07060d', rim: { c: '#b066ff', d: [3, 2] }, l: '#1a0f30', lw: 1.5 });
    c.restore();
    if (p > .05) { const Rw = rng(9 + S.fr % 3); c.fillStyle = 'rgba(60,24,100,.5)'; for (let k = 0; k < 18; k++) { c.beginPath(); c.ellipse(FX - 80 + dx * Rw() - Rw() * 200, FY - 40 - Rw() * 500 * p, 20 + Rw() * 34, 8 + Rw() * 12, 0, 0, TAU); c.fill(); } }
  });
  e.save(); e.globalAlpha = .25 + .45 * p; lamp(null, e, FX - 200, FY - 300 * p, 220, '#7a3cff', .6); e.restore();
  // his legs and sneakers (in front of the shadow's root)
  celLayer(S, c => {
    for (const x of [FX - 120, FX + 120]) {
      cel(c, [[x - 92, 380], [x + 92, 380], [x + 104, 1330], [x - 84, 1336]], { f: '#3a4a6a', s: '#22304a', so: [-20, 0], h: '#5a6a90', ho: [6, 0], l: '#0e1424', lw: 3 });
      line(c, [[x - 40, 700], [x - 30, 1200]], '#22304a', 2.5);
      cel(c, [[x - 110, 1330], [x + 100, 1320], [x + 180, 1390, 1], [x + 196, 1460], [x + 150, 1500], [x - 110, 1506], [x - 140, 1460]], { f: '#f2f4f8', s: '#b8c0cc', so: [-12, -12], h: '#ffffff', l: '#3a4250', lw: 3 });
      c.fillStyle = '#2a2e38'; c.fillRect(x - 138, 1490, 336, 22);
      line(c, [[x - 60, 1360], [x + 60, 1352]], '#8a94a4', 3); line(c, [[x - 50, 1392], [x + 70, 1384]], '#8a94a4', 3);
    }
  });
}
// 13 the cab: the bell breaks the door; the 1984 driver at the console, murmuring the stations
export function cab(S) {
  const { g, e, t, lt } = S;
  if (lt < 2.5) {   // the door bursts: impact on the bell, then 서하 in the doorway, lit green from the console
    vgrad(g, 0, 0, W, H, [[0, '#0e1016'], [1, '#05060a']]);
    const P = pal('seoha', 'car');
    const L = celLayer(S, c => {
      c.save(); c.translate(500, 960); c.scale(2.5, 2.5); head80(c, P, { ch: CH.seoha, view: 'q', wind: .4, ph: (S.fr % 4) / 4, look: [.3, .05], rim: { c: '#7dffb0', d: [-1.4, 1.2] }, expr: 'shout', mouth: 'set' }); c.restore();
      bellHand(c, P, 860, 760, .25, { ring: 1 - seg(t, T.bellBreak, T.bellBreak + 1.5), ph: t * 4 });
    });
    if (t >= T.bellBreak && t < T.bellBreak + 2 / 12) impactFrame(S, 860, 640, L);
    else if (t < T.bellBreak) { g.fillStyle = rgba('#000000', .65); g.fillRect(0, 0, W, H); }
    return;
  }
  const P = plate('cab', paintCab), k = 1 + .05 * ss(seg(t, 72.5, 80));
  drawPlate(S, P, { k, cx: 540, cy: 1000 });
  cam(S, k, 540, 1000);
  g.save(); g.clip(qPath(CAB.ws)); e.save(); e.clip(qPath(CAB.ws)); tunnelAhead(g, e, t, 540, 560, 1.1, 0, 1.4); g.restore(); e.restore();
  camReset(S);
  celLayer(S, c => { c.translate(540, 1000); c.scale(k, k); c.translate(-540, -1000); driverBack(c, 540, 1180, 1.6); });
}
// 14 서하 raises the bell; 무진's shout carries from the far end of the train
export function raise(S) {
  const { g, e, t } = S, P = pal('seoha', 'car');
  cabBack(S, t);
  const up = ss(seg(t, T.raise, T.raise + .6));
  celLayer(S, c => {
    c.save(); c.translate(470, 980); c.scale(2.6, 2.6);
    head80(c, P, { ch: CH.seoha, view: 'q', wind: 0, look: [.35, -.05], rim: { c: '#7dffb0', d: [-1.4, 1.4] }, ...face('seoha', t, t > 83.6 ? 'surprised' : 'determined', 7) });
    c.restore();
    bellHand(c, P, 870, 1500 - 620 * up, .2 - .1 * up, { ring: up < 1 ? 1 : .25, ph: t * 3 });
    bands(c, t, ['#ff9a3c'], 1300, .26);
  });
}
function cabBack(S, t, lit = 0, spd = 1) {   // behind her: the windshield and the tunnel, the console glow below
  const { g, e } = S;
  vgrad(g, 0, 0, W, H, [[0, '#101218'], [1, '#05060a']]);
  g.save(); g.beginPath(); g.rect(0, 120, W, 900); g.clip(); e.save(); e.beginPath(); e.rect(0, 120, W, 900); e.clip();
  tunnelAhead(g, e, t, 640, 520, spd, lit, 1.3); g.restore(); e.restore();
  g.strokeStyle = '#3a404c'; g.lineWidth = 24; g.strokeRect(0, 120, W, 900);
  vgrad(g, 0, 1300, W, 620, [[0, '#2a323c'], [1, '#0a0c10']]); airbrush(g, 540, 1500, 700, 260, '#5aff9a', .14); lamp(null, e, 540, 1600, 120, '#3aff8a', .25);
}
// 15 the decision: held bust, light bands slowing; the bell lowers; then her eyes
export function decide(S) {
  const { g, e, t, lt } = S, P = pal('seoha', 'car');
  if (lt < 2.5) {
    cabBack(S, t, 0, .7);
    const down = ss(seg(t, 86.9, 87.4));
    celLayer(S, c => {
      c.save(); c.translate(500, 920); c.scale(2.9, 2.9);
      head80(c, P, { ch: CH.seoha, view: 'q', wind: 0, look: [.35, .1], reflect: '#ff9a3c', rim: { c: '#ff9a3c', d: [1.4, .6] }, expr: 'determined', E: { brow: [2, 0, 2], lid: .2 } });
      c.restore();
      bellHand(c, P, 860, 880 + 700 * down + Math.sin(t * 40) * 3 * (1 - down), .1, { ring: .15, ph: t * 5 });
      bands(c, t, ['#ff8a2c', '#ff9a3c'], 700, .34);
    });
  } else {   // extreme close-up on the near eye: it closes, then opens
    vgrad(g, 0, 0, W, H, [[0, '#120e18'], [1, '#08060c']]);
    const shut = t > 88.4 && t < 89.25;
    celLayer(S, c => {
      c.translate(540 + 21 * 7.2, 960 - 22 * 7.2); c.scale(7.2, 7.2); LWK.k = .45;
      head80(c, P, { ch: CH.seoha, view: 'q', wind: 0, look: [.3, 0], reflect: '#ffb060', open: shut ? 0 : 1, expr: 'determined', E: { brow: [3, 0, 2], lid: .25 } });
      LWK.k = 1;
      bands(c, t, ['#ff9a3c'], 500, .3);
    });
  }
}
// 16 the PA handset: her hand takes it; then her profile: "이번 역은, 종착역입니다…"
export function mic(S) {
  const { g, e, t, lt } = S, P = pal('seoha', 'car');
  if (lt < 2.5) {
    const C = plate('cab', paintCab);
    g.save(); g.translate(540, 960); g.scale(2.2, 2.2); g.translate(-200, -1100); g.drawImage(C.gc, 0, 0); g.restore();
    e.save(); e.translate(540, 960); e.scale(2.2, 2.2); e.translate(-200, -1100); e.drawImage(C.ec, 0, 0); e.restore();
    const R = rng(8); for (let k = 0; k < 10; k++) airbrush(g, R() * W, R() * 700, 60 + R() * 60, 60 + R() * 60, '#5aff9a', .12);
    const lift = ss(seg(t, T.grab, T.grab + .7)), hin = ss(seg(t, T.grab - .6, T.grab));
    celLayer(S, c => {
      handset(c, 420 + 80 * lift, 1000 - 380 * lift, -.15 + .2 * lift, 1.6, [200, 800]);
      if (hin > 0) { c.save(); c.translate(560 + 300 * (1 - hin), 1150 - 380 * lift + 400 * (1 - hin)); c.scale(1.3, 1.3); handFlat(c, P); c.restore(); }
    });
    const sw = seg(lt, .2, 1.4); if (sw > 0 && sw < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const x = -200 + sw * 1500; const gr = g.createLinearGradient(x - 80, 0, x + 80, 0); gr.addColorStop(0, rgba('#ffffff', 0)); gr.addColorStop(.5, rgba('#ffffff', .22)); gr.addColorStop(1, rgba('#ffffff', 0)); g.fillStyle = gr; g.fillRect(x - 80, 0, 160, H); g.restore(); }
    return;
  }
  const slow = 1 - seg(t, 93, 97.5);
  cabBack(S, t, seg(t, 95.5, 97.5) * .6, slow);
  celLayer(S, c => {
    c.save(); c.translate(430, 920); c.scale(2.7, 2.7);
    head80(c, P, { ch: CH.seoha, view: 'side', wind: 0, ...face('seoha', t, 'neutral', 8, { noBlink: true }), E: { lid: .3, brow: [-2, 1, 2] } });
    c.restore();
    handset(c, 720, 1150, .5, 1.5, [-300, 900]);
    bands(c, t, ['#ffb060', '#ffe0a0'], 600 + 600 * slow, .3);
  });
}
// 17 the flash: a real station; the shadows go home into the windows
export function arrive(S) {
  const { g, e, t, lt } = S, P = plate('platR', () => paintPlatform('real')), { M, WIN } = PLAT;
  drawPlate(S, P);
  const R = rng(19);
  celLayer(S, c => {
    for (let i = 0; i < 6; i++) {
      const w = WIN[i % 4], [wx, wy] = M((w[0] + w[1]) / 2, .5), x0 = 120 + R() * 700, y0 = 1350 + R() * 420, p = ss(seg(t, T.home[0] + i * .18, T.home[1] - .4 + i * .1));
      const x = x0 + (wx - x0) * p, y = y0 + (wy + 120 - y0) * p, s = (.8 + R() * .3) * (1 - p * .75);
      if (p < 1) shadowPerson(c, x, y, s, { k: 1 - p * .9, v: i % 3, flip: i % 2 === 1, smoke: 0 });
    }
  });
  for (const w of WIN) { const [wx, wy] = M((w[0] + w[1]) / 2, .57); lamp(null, e, wx, wy, 60, '#c8a0ff', .35 * Math.sin(Math.PI * seg(t, T.home[0], T.home[1] + .6))); }
  if (lt < .6) { const a = lt < 2 / 24 ? 1 : 1 - seg(lt, .08, .6); g.fillStyle = rgba('#ffffff', a); g.fillRect(0, 0, W, H); e.fillStyle = rgba('#ffffff', a * .8); e.fillRect(0, 0, W, H); }
}
// 18 the driver, backlit by the station light, takes off his cap, bows, fades
export function driver(S) {
  const { g, e, t } = S;
  cabBack(S, t, 1, 0);
  const capOff = t >= T.capOff, bow = ss(seg(t, T.capOff + .6, T.capOff + 1.3)) - ss(seg(t, T.capOff + 2.0, T.capOff + 2.6)) * .6, fade = 1 - ss(seg(t, T.fade[0], T.fade[1]));
  celLayer(S, c => driverBacklit(c, 540, 820, 1.25, { capOff, bow, alpha: fade }));
  if (fade < 1) { const R = rng(23); for (let k = 0; k < 30; k++) { const y = 1500 - ((t - T.fade[0]) * (120 + R() * 200) + R() * 600) % 1200; lamp(g, e, 360 + R() * 360, y, 3 + R() * 4, '#ffe6b0', (1 - fade) * .8); } }
}
// 19 서준 wakes: "누나? 나 몇 정거장이나 지났어?" "…한 바퀴."
export function wake(S) {
  const { g, e, t } = S, P = plate('car', paintCar);
  drawPlate(S, P);
  for (const [x, y, w, h] of CAR.win) tunnelWindow(g, e, x, y, w, h, t, 0, 1);
  const smile = t > 113.3;
  celLayer(S, c => {
    c.save(); c.translate(270, 990); c.rotate(.04); c.scale(1.72, 1.72); head80(c, pal('seojun', 'car'), { ch: CH.seojun, view: 'q', wind: 0, look: [.4, 0], ...face('seojun', t, t < 108.2 ? 'asleep' : 'neutral', 9) }); c.restore();
    c.save(); c.translate(830, 972); c.scale(-1.74, 1.74); head80(c, pal('seoha', 'car'), { ch: CH.seoha, view: 'q', wind: 0, look: [.35, 0], ...face('seoha', t, smile ? 'smile' : 'neutral', 10) }); c.restore();
  });
}
// 20 the route map: the nameless station is erased
export function map(S) {
  const { g, e, t, lt } = S, P = plate('map', paintMap), k = 1 + .04 * lt / 2.5;
  drawPlate(S, P, { k, cx: 540, cy: 960 });
  cam(S, k, 540, 960);
  const [bx, by] = P.at(P.blank), gone = ss(seg(t, T.erase, T.erase + .5));
  g.globalAlpha = 1 - gone; g.fillStyle = '#2a1a40'; g.beginPath(); g.arc(bx, by, 17, 0, TAU); g.fill(); g.strokeStyle = '#9a4cff'; g.lineWidth = 5; g.stroke(); g.globalAlpha = 1;
  e.globalAlpha = (1 - gone) * (.5 + .3 * Math.sin(t * 8)); lamp(null, e, bx, by, 20, '#9a4cff', .8); e.globalAlpha = 1;
  if (gone >= 1) { g.fillStyle = '#3aa060'; g.beginPath(); g.arc(bx, by, 14, 0, TAU); g.fill(); }
  camReset(S);
  const sw = seg(lt, .2, 1.6); if (sw > 0 && sw < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const x = -200 + sw * 1500; const gr = g.createLinearGradient(x - 90, 0, x + 90, 0); gr.addColorStop(0, rgba('#ffffff', 0)); gr.addColorStop(.5, rgba('#ffffff', .2)); gr.addColorStop(1, rgba('#ffffff', 0)); g.fillStyle = gr; g.translate(540, 960); g.rotate(-.5); g.fillRect(x - 540 - 90, -1400, 180, 2800); g.restore(); }
  if (t > T.erase && t < T.erase + .3) S.over = { track: .8 };
}
// 21 the freeze: 서하's half smile, the card "다음 이야기", the tape runs out
export function freeze(S) {
  const { g, e, t } = S, P = pal('seoha', 'car'), tf = Math.min(t, T.freeze);
  carWindowBack(S, tf, 0, 1);
  celLayer(S, c => {
    c.translate(520, 940); c.scale(2.8, 2.8);
    head80(c, P, { ch: CH.seoha, view: 'q', wind: 0, look: [.45, 0], reflect: '#ffe0a0', expr: tf > 118.1 ? 'smile' : 'neutral', open: 1 });
  });
  if (t >= T.freeze) {
    S.over = { sat: .55, contrast: .25 };
    const a = ss(seg(t, T.freeze + .3, T.freeze + .9)), x = 540 + 700 * (1 - a);
    chromeText(S, '다음 이야기', x, 1500, 116, seg(t, T.freeze + .9, T.freeze + 1.8));
  }
  if (t > T.tapeOut) S.over = { ...(S.over || {}), track: .9, power: Math.max(0, 1 - seg(t, T.tapeOut + .35, T.tapeOut + .85)) };
}
export const SHOT_FN = { hook, title, two, seoha, track, phone: phoneShot, talisman: talismanShot, speed, mujin, door, punch, peel, cab, raise, decide, mic, arrive, driver, wake, map, freeze };
