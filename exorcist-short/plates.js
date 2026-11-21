// 막차 — painted plates (background art painted once at load, colour + emissive pair; per frame they are only drawn and slid)
import { canvas, W, H, TAU, rgba, mix, vgrad, airbrush, rng, hash, path } from './cel.js';
import { head80 } from './heads.js';
import { pal, CH } from './cast.js';
import { lamp } from './fx.js';

export function quadMap(p00, p10, p11, p01) {
  const [x0, y0] = p00, [x1, y1] = p10, [x2, y2] = p11, [x3, y3] = p01;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, G = (dx3 * dy2 - dx2 * dy3) / den, Hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + G * x1, b = x3 - x0 + Hh * x3, d = y1 - y0 + G * y1, e = y3 - y0 + Hh * y3;
  return (u, v) => { const w = G * u + Hh * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
}
export const quad = (M, u0, v0, u1, v1) => [M(u0, v0), M(u1, v0), M(u1, v1), M(u0, v1)];
export const fillQuad = (c, q, col) => { c.fillStyle = col; c.beginPath(); q.forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0], p[1])); c.closePath(); c.fill(); };
export const qPath = q => { const p = new Path2D(); q.forEach((pt, i) => p[i ? 'lineTo' : 'moveTo'](pt[0], pt[1])); p.closePath(); return p; };

// ——— the platform: mode 'none' (the station that isn't there) | 'real' (a lit, real station) ———
export const PLAT = { M: quadMap([1240, 1250], [-300, 1012], [-300, 560], [1240, 290]), WIN: [[.04, .2], [.42, .6], [.7, .8], [.88, .97]], DOOR: [.27, .37], DOOR2: [.63, .67] };
export function paintPlatform(mode) {
  const [gc, g] = canvas(W, H), [ec, e] = canvas(W, H), real = mode === 'real', { M, WIN, DOOR, DOOR2 } = PLAT;
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, real ? [[0, '#3a3c44'], [.3, '#5a5e66'], [.62, '#4a4c54'], [1, '#26262c']] : [[0, '#0c0a14'], [.3, '#1a1420'], [.62, '#1e1820'], [1, '#08070c']]);
  g.fillStyle = real ? '#2e3038' : '#120e16'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 250); g.lineTo(0, 520); g.closePath(); g.fill();
  for (let k = 0; k < 6; k++) {
    const u = .04 + k * .2, [x, y] = M(u, 1.18), dead = !real && k === 2, s = 1 / (1 + u * 1.6), col = real ? '#f2fbff' : '#ffb347';
    g.fillStyle = '#2a2228'; g.fillRect(x - 70 * s, y - 10 * s, 140 * s, 16 * s);
    if (!dead) { g.fillStyle = real ? '#ffffff' : '#ffd9a0'; g.fillRect(x - 60 * s, y - 2 * s, 120 * s, 8 * s); lamp(null, e, x, y + 2 * s, 34 * s, col, .7); airbrush(g, x, y + 60 * s, 220 * s, 120 * s, col, real ? .2 : .14); }
  }
  const body = quad(M, 0, 0, 1, 1);
  fillQuad(g, body, '#8f9aa6');
  g.save(); g.clip(qPath(body));
  vgrad(g, 0, 250, W, 1050, real ? [[0, '#d0d6dc'], [.35, '#a4acb6'], [1, '#6a727e']] : [[0, '#a8b0b8'], [.35, '#7c8692'], [1, '#4a525e']]);
  fillQuad(g, quad(M, 0, 0, 1, .12), '#2e343e');
  fillQuad(g, quad(M, 0, .25, 1, .31), '#3aa060');
  fillQuad(g, quad(M, 0, .31, 1, .325), '#b8f0c8');
  fillQuad(g, quad(M, 0, .9, 1, 1), '#5a626c');
  for (let k = 0; k < 14; k++) { const [x0, y0] = M(k / 13, 0), [x1, y1] = M(k / 13, 1); g.strokeStyle = rgba('#000000', .12); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
  for (const [u0, u1] of WIN) {
    const q = quad(M, u0, .38, u1, .76);
    fillQuad(g, q, '#9cc8c4'); fillQuad(e, q, rgba('#7fd8c8', .28));
    g.save(); g.clip(qPath(q));
    const [ax, ay] = M(u0, .38), [bx, by] = M(u1, .76);
    vgrad(g, Math.min(ax, bx) - 40, Math.min(ay, by) - 40, Math.abs(bx - ax) + 80, Math.abs(by - ay) + 80, [[0, '#d8f4ee'], [.3, '#9ccac4'], [1, '#5e8a90']]);
    fillQuad(g, quad(M, u0 - .02, .38, u1 + .02, .5), '#3a5a8a');
    g.restore();
    g.strokeStyle = '#2e3440'; g.lineWidth = 6; g.stroke(qPath(quad(M, u0 - .006, .37, u1 + .006, .77)));
  }
  { // the sleeper in the big window (painted into the plate: he doesn't move)
    const q = quad(M, .42, .38, .6, .76), [cx, cy] = M(.505, .54), s = .78;
    g.save(); g.clip(qPath(q)); g.translate(cx, cy); g.rotate(.22); g.scale(s, s); head80(g, pal('seojun', 'car'), { ch: CH.seojun, view: 'q', expr: 'asleep', wind: 0 }); g.restore();
    g.save(); g.clip(qPath(q)); g.globalCompositeOperation = 'lighter';
    const [rx, ry] = M(.47, .76); const gr = g.createLinearGradient(rx - 60, 0, rx + 60, 0); gr.addColorStop(0, rgba('#ffffff', 0)); gr.addColorStop(.5, rgba('#ffffff', .2)); gr.addColorStop(1, rgba('#ffffff', 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(rx - 40, ry); g.lineTo(rx + 40, ry); g.lineTo(rx - 60, ry + 420); g.lineTo(rx - 140, ry + 420); g.fill(); g.restore();
  }
  for (const [u0, u1] of [DOOR, DOOR2]) {   // open doors: the lit car inside (cool, not blown out), a pole
    const q = quad(M, u0, .03, u1, .86);
    fillQuad(g, q, '#a8cec8'); fillQuad(e, q, rgba('#9ae8da', .36));
    g.save(); g.clip(qPath(q)); const [fx, fy] = M((u0 + u1) / 2, .03), [tx, ty] = M((u0 + u1) / 2, .86);
    vgrad(g, 0, ty, W, fy - ty, [[0, '#e2f6f2'], [.35, '#b4d8d2'], [.62, '#6e9aa4'], [.64, '#3a5a8a'], [.78, '#2e4a70'], [.8, '#8aa0a6'], [1, '#5a6e72']]);   // ceiling light, far seats, floor
    const [px0, py0] = M(u0 + (u1 - u0) * .62, .03), [px1, py1] = M(u0 + (u1 - u0) * .62, .86); g.strokeStyle = '#c8d4d8'; g.lineWidth = 9; g.beginPath(); g.moveTo(px0, py0); g.lineTo(px1, py1); g.stroke();
    g.restore();
    g.strokeStyle = '#3a404a'; g.lineWidth = 7; g.stroke(qPath(quad(M, u0 - .004, .02, u1 + .004, .87)));
  }
  const [ex0, ey0] = M(0, -.03), [ex1, ey1] = M(1, -.03);
  g.fillStyle = real ? '#5a5a62' : '#26222a'; g.beginPath(); g.moveTo(ex0, ey0); g.lineTo(ex1, ey1); g.lineTo(-300, H); g.lineTo(W + 200, H); g.closePath(); g.fill();
  vgrad(g, 0, 1000, W, 920, [[0, rgba('#3a2e2a', 0)], [.4, rgba('#2c2428', real ? .2 : .5)], [1, rgba('#0a080c', real ? .5 : .9)]]);
  const yl = (u, d) => { const [x, y] = M(u, -.05); return [x + d * 60, y + d * 150]; };
  g.strokeStyle = '#d8b02a'; g.lineWidth = 16; g.beginPath(); { const a = yl(0, 1), b = yl(1, .4); g.moveTo(a[0] + 40, a[1]); g.lineTo(b[0], b[1]); } g.stroke();
  for (const [u0, u1, k0] of [...WIN.map(w => [...w, .55]), [...DOOR, 1], [...DOOR2, .8]]) {
    const [ax, ay] = M(u0, 0), [bx, by] = M(u1, 0), x0 = Math.min(ax, bx), w = Math.abs(bx - ax), y0 = Math.max(ay, by) + 24, R = rng(Math.floor(u0 * 997));
    for (let x = x0 + w * .06; x < x0 + w * .94; x += 9) {
      const len = 240 + R() * 360, a = .2 * k0 * (.5 + R() * .5);
      for (const [ctx, k] of [[g, 1], [e, .45]]) { const gr = ctx.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, rgba('#c8f8ee', a * k)); gr.addColorStop(1, rgba('#c8f8ee', 0)); ctx.fillStyle = gr; ctx.fillRect(x + Math.sin(x * .7) * 3, y0, 5 + R() * 4, len); }
    }
    for (let yy = y0 + 30; yy < y0 + 600; yy += 22 + R() * 18) { g.fillStyle = rgba(real ? '#5a5a62' : '#26222a', .55); g.fillRect(x0 - 10, yy, w + 20, 5); }
  }
  const [d0x, d0y] = M(DOOR[0], 0), [d1x, d1y] = M(DOOR[1], 0);
  const spill = [[d1x, d1y], [d0x, d0y], [d0x + 330, d0y + 600], [d1x + 90, d1y + 690]];
  g.save(); g.globalCompositeOperation = 'lighter'; fillQuad(g, spill, rgba('#9fe8dc', real ? .12 : .22)); g.restore(); fillQuad(e, spill, rgba('#6fd8c8', .22));
  // foreground pillar: 1984 tiles; the station-name plate (blank at the station that isn't there, 시청 at the real one)
  const px = 862;
  g.fillStyle = '#7d9470'; g.fillRect(px, 0, W - px, H);
  g.save(); g.beginPath(); g.rect(px, 0, W - px, H); g.clip();
  for (let y = 0; y < H; y += 54) for (let x = px; x < W; x += 54) { g.fillStyle = mix(real ? '#b8e0c8' : '#8fa680', real ? '#88b49c' : '#5f7458', hash(x * .13 + y * .07) * .6); g.fillRect(x + 2, y + 2, 50, 50); }
  vgrad(g, px, 0, W - px, H, [[0, rgba('#0a0810', real ? .25 : .55)], [.35, rgba('#0a0810', .1)], [.75, rgba('#2a1c10', real ? .1 : .35)], [1, rgba('#0a0810', real ? .45 : .8)]]);
  g.fillStyle = rgba('#000000', .35); g.fillRect(px, 0, 26, H);
  g.restore();
  g.fillStyle = '#1c2a4a'; g.fillRect(px + 34, 640, 170, 300); g.strokeStyle = '#e8ecf4'; g.lineWidth = 4; g.strokeRect(px + 44, 650, 150, 280);
  if (real) { g.fillStyle = '#ffffff'; g.font = '62px "Black Han Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('시', px + 119, 750); g.fillText('청', px + 119, 830); e.fillStyle = rgba('#ffffff', .25); e.fillRect(px + 44, 650, 150, 280); }
  else { g.fillStyle = rgba('#e8ecf4', .25); g.fillRect(px + 60, 700, 118, 6); g.fillRect(px + 60, 880, 118, 4); airbrush(g, px + 120, 790, 60, 90, '#ffb347', .08); }
  return { gc, ec, spill, sx: (d0x + d1x) / 2 + 150, sy: (d0y + d1y) / 2 + 470 };
}

// ——— the car seen across the aisle (two-shots): windows onto the tunnel, the far bench, poles, straps ———
export const CAR = { win: [[60, 360, 300, 470], [400, 360, 300, 470], [740, 360, 300, 470]] };
export function paintCar() {
  const [gc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, [[0, '#d6dcd8'], [.17, '#c2cac8'], [.5, '#aab4b4'], [1, '#6a7478']]);
  // ceiling: two fluorescent tubes, an advert strip
  g.fillStyle = '#e6ece8'; g.fillRect(0, 0, W, 210);
  for (const y of [60, 150]) { g.fillStyle = '#f8fffd'; g.fillRect(40, y, 1000, 18); e.fillStyle = rgba('#c8fff4', .55); e.fillRect(40, y, 1000, 18); airbrush(g, 540, y + 40, 600, 80, '#e8fffa', .25); }
  g.fillStyle = '#9aa4a8'; g.fillRect(0, 230, W, 90); for (let k = 0; k < 4; k++) { g.fillStyle = ['#e8d8b0', '#c8dce8', '#e8c8c8', '#d8e8c8'][k]; g.fillRect(20 + k * 266, 240, 246, 70); g.fillStyle = rgba('#2a3040', .35); g.fillRect(40 + k * 266, 262, 140, 10); g.fillRect(40 + k * 266, 282, 100, 8); }
  // windows: dark (the tunnel is drawn into them per frame)
  for (const [x, y, w, h] of CAR.win) { g.fillStyle = '#08090e'; g.fillRect(x, y, w, h); g.strokeStyle = '#e8ece4'; g.lineWidth = 16; g.strokeRect(x, y, w, h); g.strokeStyle = '#8a9494'; g.lineWidth = 3; g.strokeRect(x - 9, y - 9, w + 18, h + 18); }
  // the overhead rail + straps
  g.fillStyle = '#c8d0d4'; g.fillRect(0, 338, W, 10);
  for (let x = 40; x < W; x += 110) { g.strokeStyle = '#3a4a5a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 344); g.lineTo(x, 440); g.stroke(); g.strokeStyle = '#e8eef0'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 26, 440); g.lineTo(x + 26, 440); g.lineTo(x, 490); g.closePath(); g.stroke(); }
  // bench back + seat (blue), the floor
  g.fillStyle = '#7a8488'; g.fillRect(0, 850, W, 40);
  vgrad(g, 0, 890, W, 360, [[0, '#4a6aa8'], [1, '#2e4a84']]);
  for (let x = 0; x < W; x += 154) { g.fillStyle = rgba('#1a2a50', .5); g.fillRect(x, 890, 4, 360); }
  vgrad(g, 0, 1250, W, 110, [[0, '#5a7ab8'], [1, '#2a4070']]);
  g.fillStyle = '#1a1e28'; g.fillRect(0, 1360, W, 60);
  vgrad(g, 0, 1420, W, 500, [[0, '#7a8288'], [1, '#4a5056']]);
  const R = rng(4); for (let k = 0; k < 900; k++) { g.fillStyle = rgba(R() < .5 ? '#ffffff' : '#000000', .08); g.fillRect(R() * W, 1420 + R() * 500, 3, 3); }
  // stanchion poles
  for (const x of [26, 1050]) { vgrad(g, x - 9, 0, 18, H, [[0, '#f0f4f6'], [1, '#a8b0b4']]); g.fillStyle = rgba('#ffffff', .7); g.fillRect(x - 4, 0, 4, H); }
  return { gc, ec };
}
// the tunnel outside a window: dark, orange lamps streaking past (speed 0..1; 0 = stopped at a lit station)
export function tunnelWindow(g, e, x, y, w, h, t, speed = 1, station = 0) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (station > 0) { vgrad(g, x, y, w, h, [[0, mix('#08090e', '#e8f0ee', station)], [1, mix('#08090e', '#8aa8a0', station)]]); }
  const R = rng(9);
  for (let k = 0; k < 7; k++) {
    const yy = y + 30 + R() * (h - 60), L = 120 + 600 * speed, v = 1600 + R() * 900;
    const xx = x + w - (((t * v * speed + R() * 3000) % (w + L + 400)));
    for (const [c, a] of [[g, .85], [e, .6]]) { const gr = c.createLinearGradient(xx, 0, xx + L, 0); gr.addColorStop(0, rgba('#ff9a3c', 0)); gr.addColorStop(.6, rgba('#ffb060', a)); gr.addColorStop(1, rgba('#ffd090', a)); c.fillStyle = gr; c.fillRect(xx, yy, L, 6 + R() * 8); }
  }
  g.fillStyle = rgba('#2a3040', .5); g.fillRect(x, y + h * .78, w, 4);   // the tunnel wall's cable run
  g.restore();
}

// ——— the long car (side tracking): 3600 wide, windows, benches, the door to the next car ———
export function paintCarLong() {
  const LW = 3600, [gc, g] = canvas(LW, H), [ec, e] = canvas(LW, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, LW, H);
  vgrad(g, 0, 0, LW, H, [[0, '#d6dcd8'], [.17, '#c2cac8'], [.5, '#aab4b4'], [1, '#6a7478']]);
  g.fillStyle = '#e6ece8'; g.fillRect(0, 0, LW, 210);
  for (const y of [60, 150]) { g.fillStyle = '#f8fffd'; g.fillRect(0, y, LW, 18); e.fillStyle = rgba('#c8fff4', .5); e.fillRect(0, y, LW, 18); }
  g.fillStyle = '#c8d0d4'; g.fillRect(0, 338, LW, 10);
  const wins = [];
  for (let x = 40; x < LW; x += 360) { if (x > 1380 && x < 1800) continue; g.fillStyle = '#08090e'; g.fillRect(x, 360, 300, 470); g.strokeStyle = '#e8ece4'; g.lineWidth = 16; g.strokeRect(x, 360, 300, 470); wins.push([x, 360, 300, 470]); }
  for (let x = 40; x < LW; x += 110) { if (x > 1400 && x < 1780) continue; g.strokeStyle = '#3a4a5a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 344); g.lineTo(x, 440); g.stroke(); g.strokeStyle = '#e8eef0'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 26, 440); g.lineTo(x + 26, 440); g.lineTo(x, 490); g.closePath(); g.stroke(); }
  g.fillStyle = '#7a8488'; g.fillRect(0, 850, LW, 40);
  vgrad(g, 0, 890, LW, 360, [[0, '#4a6aa8'], [1, '#2e4a84']]);
  vgrad(g, 0, 1250, LW, 110, [[0, '#5a7ab8'], [1, '#2a4070']]);
  g.fillStyle = '#1a1e28'; g.fillRect(0, 1360, LW, 60);
  vgrad(g, 0, 1420, LW, 500, [[0, '#7a8288'], [1, '#4a5056']]);
  // the gangway door into car 7, with its number plate
  vgrad(g, 1420, 300, 340, 1120, [[0, '#9aa4aa'], [1, '#6a747a']]);
  g.fillStyle = '#14161c'; g.fillRect(1480, 420, 220, 420); g.strokeStyle = '#d8dee0'; g.lineWidth = 10; g.strokeRect(1480, 420, 220, 420);
  g.fillStyle = '#1c2a4a'; g.fillRect(1530, 330, 120, 70); g.fillStyle = '#ffffff'; g.font = '56px "Black Han Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', 1590, 367);
  for (const x of [1400, 1780]) { vgrad(g, x - 9, 0, 18, H, [[0, '#f0f4f6'], [1, '#a8b0b4']]); }
  return { gc, ec, LW, wins };
}

// ——— the cab: windshield onto the tunnel, the green-lit console, the 1984 timetable ———
export const CAB = { ws: [[110, 220], [970, 220], [1040, 900], [40, 900]] };
export function paintCab() {
  const [gc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, [[0, '#14161e'], [.5, '#1c2028'], [1, '#0a0c10']]);
  g.fillStyle = '#05060a'; g.beginPath(); CAB.ws.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath(); g.fill();
  g.strokeStyle = '#3a404c'; g.lineWidth = 22; g.stroke();
  // console
  vgrad(g, 0, 900, W, 560, [[0, '#3a4450'], [.2, '#2a323c'], [1, '#14181e']]);
  g.fillStyle = '#4a5460'; g.fillRect(0, 900, W, 30);
  for (const [x, y, r] of [[230, 1060, 70], [420, 1040, 56], [640, 1050, 64], [840, 1070, 52]]) {
    g.fillStyle = '#0a1410'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#8a98a0'; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#7dffb0'; g.lineWidth = 3; for (let k = 0; k < 9; k++) { const a = Math.PI * (.8 + k * .175); g.beginPath(); g.moveTo(x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72); g.lineTo(x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86); g.stroke(); }
    e.fillStyle = rgba('#5aff9a', .35); e.beginPath(); e.arc(x, y, r, 0, TAU); e.fill();
  }
  for (let k = 0; k < 8; k++) { const col = ['#5aff9a', '#ff5a4a', '#ffd04a'][k % 3]; g.fillStyle = col; g.fillRect(180 + k * 90, 1180, 40, 20); lamp(null, e, 200 + k * 90, 1190, 16, col, .6); }
  // the timetable clipped to the console: 1984. 5. 22 (the day the loop line was completed)
  g.save(); g.translate(760, 1290); g.rotate(-.08);
  g.fillStyle = '#e8dcb8'; g.fillRect(-150, -110, 300, 220); g.fillStyle = '#5a4a2a'; g.fillRect(-40, -126, 80, 24);
  g.fillStyle = '#3a2e1a'; g.font = '800 30px Pretendard'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('운행표', 0, -64); g.font = '700 26px Pretendard'; g.fillText('1984. 5. 22', 0, -22);
  g.fillStyle = rgba('#3a2e1a', .5); for (let k = 0; k < 4; k++) g.fillRect(-110, 16 + k * 22, 220, 6);
  g.restore();
  // the handset hook (left)
  g.fillStyle = '#3a404c'; g.fillRect(70, 1000, 60, 140);
  return { gc, ec };
}
// pseudo-3D tunnel seen ahead (rings of lamps, two rails), clipped by the caller; speed scales the rush; 'lit' brightens toward a station
export function tunnelAhead(g, e, t, cx, cy, speed = 1, lit = 0, wide = 1) {
  vgrad(g, cx - 1400, cy - 1400, 2800, 2800, [[0, mix('#0a0a10', '#d8e8e4', lit)], [1, mix('#05060a', '#5a6a70', lit)]]);
  const n = 14;
  for (let i = n; i >= 1; i--) {
    const z = ((i - (t * speed * 1.4) % 1) / n), s = 1 / (z * 6 + .15), rw = 260 * s * wide, rh = 220 * s;
    if (z <= 0 || s > 40) continue;
    const a = Math.min(1, z * 3) * Math.min(1, (1 - z) * 4);
    g.strokeStyle = rgba(mix('#2a2a34', '#a8b0b0', lit), .35 * a); g.lineWidth = Math.max(1, 3 * s);
    g.beginPath(); g.roundRect(cx - rw, cy - rh, rw * 2, rh * 1.6, rh * .5); g.stroke();
    const lx = cx - rw * .9, ly = cy - rh * .1;
    lamp(g, e, lx, ly, 7 * s, '#ffb050', .8 * a); lamp(g, e, cx + rw * .9, ly, 7 * s, '#ffb050', .6 * a);
  }
  for (const side of [-1, 1]) { g.strokeStyle = rgba('#c8ccd0', .55); g.lineWidth = 6; g.beginPath(); g.moveTo(cx + side * 12, cy + 120); g.lineTo(cx + side * 520, cy + 1400); g.stroke(); }
  g.fillStyle = rgba('#ffe8b0', .18); g.beginPath(); g.moveTo(cx - 40, cy + 120); g.lineTo(cx + 40, cy + 120); g.lineTo(cx + 700, cy + 1400); g.lineTo(cx - 700, cy + 1400); g.fill();   // headlight on the rails
  lamp(g, e, cx, cy + 40, 10, lit > .5 ? '#ffffff' : '#5aff9a', .9);   // a signal far ahead
}

// ——— the route map (a generic loop diagram: real station names, our own design) ———
export const MAPST = ['시청', '을지로입구', '동대문', '', '신당', '왕십리', '성수', '강변', '잠실', '삼성', '강남', '사당', '신림', '구로디지털단지', '영등포구청', '홍대입구', '신촌', '이대', '충정로'];
export function paintMap() {
  const [gc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, [[0, '#c8ccc8'], [1, '#9aa09c']]);
  g.fillStyle = '#f4f2ea'; g.fillRect(70, 260, 940, 1400); g.strokeStyle = '#5a6468'; g.lineWidth = 8; g.strokeRect(70, 260, 940, 1400);
  g.fillStyle = '#2a3040'; g.font = '56px "Black Han Sans"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('2', 120, 340); g.font = '800 34px Pretendard'; g.fillText('순환선', 170, 342);
  const cx = 540, cy = 980, rx = 330, ry = 470;
  g.strokeStyle = '#3aa060'; g.lineWidth = 26; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.stroke();
  MAPST.forEach((nm, i) => {
    const a = -Math.PI / 2 + i / MAPST.length * TAU, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    if (nm) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 15, 0, TAU); g.fill(); g.strokeStyle = '#2a3040'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#2a3040'; g.font = '700 27px Pretendard'; const out = Math.cos(a) >= 0; g.textAlign = out ? 'left' : 'right'; g.fillText(nm, x + (out ? 30 : -30), y); }
  });
  return { gc, ec, at: i => { const a = -Math.PI / 2 + i / MAPST.length * TAU; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }, blank: MAPST.indexOf('') };
}
