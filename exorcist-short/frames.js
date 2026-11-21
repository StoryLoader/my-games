// 막차 — look-dev frames (vertical 1080×1920): the model sheet and three style frames from the film
// Two canvases per frame, as in the library's cel-anime engine: g = colour (painted plate + cels), e = emissive (only what gives light).
import { canvas, W, H, TAU, LWK, rgba, mix, vgrad, airbrush, rng, hash, poly, path, cel, line } from './cel.js';
import { head80 } from './heads.js';
import { pal, CH } from './cast.js';
import { speedLines, lamp, flare } from './fx.js';

const [LC, LG] = canvas(W, H), [MC, MG] = canvas(W, H);
// draw cels on their own layer, composite onto the plate, and stamp their silhouette black into the emissive canvas (glow never bleeds through a character)
export function celLayer(S, fn, o = {}) {
  LG.setTransform(1, 0, 0, 1, 0, 0); LG.clearRect(0, 0, W, H); LG.globalAlpha = 1; LG.globalCompositeOperation = 'source-over';
  fn(LG);
  S.g.drawImage(LC, 0, 0);
  if (o.occlude !== false) {
    MG.setTransform(1, 0, 0, 1, 0, 0); MG.globalCompositeOperation = 'source-over'; MG.clearRect(0, 0, W, H); MG.drawImage(LC, 0, 0);
    MG.globalCompositeOperation = 'source-in'; MG.fillStyle = '#000'; MG.fillRect(0, 0, W, H); MG.globalCompositeOperation = 'source-over';
    S.e.drawImage(MC, 0, 0);
  }
  return LC;
}
// homography: unit square (u right, v up) → screen quad [p00, p10, p11, p01]
function quadMap(p00, p10, p11, p01) {
  const [x0, y0] = p00, [x1, y1] = p10, [x2, y2] = p11, [x3, y3] = p01;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, G = (dx3 * dy2 - dx2 * dy3) / den, Hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + G * x1, b = x3 - x0 + Hh * x3, d = y1 - y0 + G * y1, e = y3 - y0 + Hh * y3;
  return (u, v) => { const w = G * u + Hh * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
}
const quad = (M, u0, v0, u1, v1) => [M(u0, v0), M(u1, v0), M(u1, v1), M(u0, v1)];
const fillQuad = (c, q, col) => { c.fillStyle = col; c.beginPath(); q.forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0], p[1])); c.closePath(); c.fill(); };
const qPath = q => { const p = new Path2D(); q.forEach((pt, i) => p[i ? 'lineTo' : 'moveTo'](pt[0], pt[1])); p.closePath(); return p; };

// ——————————————————————————————————————————— model sheet ———
function cell(g, x, y, w, h, label, fn) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#e2dee8'; g.fillRect(x, y, w, h); fn(); g.restore();
  g.strokeStyle = '#8a8494'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = '#3a3448'; g.font = '700 22px Pretendard'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(label, x + 12, y + 10);
}
export function sheet(S) {
  const { g } = S;
  g.fillStyle = '#cfcad6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2436'; g.font = '46px "Black Han Sans"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('막차 — 모델 시트 v1', 22, 20);
  g.font = '600 20px Pretendard'; g.fillText('80s cel anime · 낮 기준 색 · 서하 / 무진 / 서준', 24, 76);
  const PS = pal('seoha', 'day'), PM = pal('mujin', 'day'), PJ = pal('seojun', 'day');
  const head = (x, y, s, P, ch, o) => { g.save(); g.translate(x, y); g.scale(s, s); head80(g, P, { ch, wind: 0, ...o }); g.restore(); };
  [['서하 3/4 · 결연', 'q', 'determined'], ['서하 옆', 'side', 'determined'], ['서하 정면', 'front', 'neutral']].forEach(([lab, view, expr], i) =>
    cell(g, i * 360, 108, 360, 600, lab, () => head(i * 360 + 190, 108 + 290, 1.5, PS, CH.seoha, { view, expr })));
  [['외침', 'shout'], ['놀람', 'surprised'], ['차갑게', 'stern'], ['입꼬리', 'smile']].forEach(([lab, expr], i) =>
    cell(g, i * 270, 708, 270, 430, '서하 · ' + lab, () => head(i * 270 + 140, 708 + 200, 1.08, PS, CH.seoha, { view: 'q', expr })));
  cell(g, 0, 1138, 360, 560, '무진 3/4 · 굳은 얼굴', () => head(185, 1138 + 250, 1.32, PM, CH.mujin, { view: 'q', expr: 'stern' }));
  cell(g, 360, 1138, 360, 560, '무진 · 일갈', () => head(360 + 185, 1138 + 250, 1.32, PM, CH.mujin, { view: 'q', expr: 'shout' }));
  cell(g, 720, 1138, 360, 560, '서준 · 잠듦', () => head(720 + 180, 1138 + 250, 1.32, PJ, CH.seojun, { view: 'q', expr: 'asleep' }));
  // colour models per lighting set
  const sets = [['낮', 'day'], ['객차', 'car'], ['없는 역', 'station'], ['터널', 'tunnel']];
  g.font = '700 20px Pretendard'; g.fillStyle = '#2a2436';
  sets.forEach(([lab, L], i) => {
    const x = 20 + i * 262, y = 1716; g.fillStyle = '#2a2436'; g.fillText(lab, x, y);
    const A = pal('seoha', L), B = pal('mujin', L);
    [A.skin.f, A.skin.s, A.hair.f, A.coat.f, A.coat.s, A.accent.f, B.skin.f, B.robe.f, B.vest.f, B.beads.f].forEach((c, k) => { g.fillStyle = c; g.fillRect(x + (k % 5) * 46, y + 30 + Math.floor(k / 5) * 64, 42, 58); });
  });
}

// ——————————————————————————————————————————— F1: 없는 역 (signature) ———
// the last train stopped at a station that isn't on the map: 1984 tiles, dead sodium lamps; a sleeper inside, his shadow standing on the platform
export function platform(S) {
  const { g, e, t } = S, fr = Math.floor(t * 12);
  // ceiling + back wall in sodium dark
  vgrad(g, 0, 0, W, H, [[0, '#0c0a14'], [.3, '#1a1420'], [.62, '#1e1820'], [1, '#08070c']]);
  // train side plane: u along the car (0 near-right → 1 far-left), v height (0 floor → 1 roof)
  const M = quadMap([1240, 1250], [-300, 1012], [-300, 560], [1240, 290]);
  // ceiling soffit + lamp row toward the far end
  g.fillStyle = '#120e16'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 250); g.lineTo(0, 520); g.closePath(); g.fill();
  for (let k = 0; k < 6; k++) {
    const u = .04 + k * .2, [x, y] = M(u, 1.18), dead = k === 2;
    const s = 1 / (1 + u * 1.6);
    g.fillStyle = '#2a2228'; g.fillRect(x - 70 * s, y - 10 * s, 140 * s, 16 * s);
    if (!dead) { g.fillStyle = '#ffd9a0'; g.fillRect(x - 60 * s, y - 2 * s, 120 * s, 8 * s); lamp(null, e, x, y + 2 * s, 34 * s, '#ffb347', .7); airbrush(g, x, y + 60 * s, 220 * s, 120 * s, '#ffb347', .14); }
  }
  // the car body
  const body = quad(M, 0, 0, 1, 1);
  fillQuad(g, body, '#8f9aa6');
  g.save(); g.clip(qPath(body));
  vgrad(g, 0, 250, W, 1050, [[0, '#a8b0b8'], [.35, '#7c8692'], [1, '#4a525e']]);
  fillQuad(g, quad(M, 0, 0, 1, .12), '#2e343e');                        // skirt
  fillQuad(g, quad(M, 0, .25, 1, .31), '#3aa060');                       // green band (generic, no logo)
  fillQuad(g, quad(M, 0, .31, 1, .325), '#b8f0c8');
  fillQuad(g, quad(M, 0, .9, 1, 1), '#5a626c');                          // roof band
  for (let k = 0; k < 14; k++) { const [x0, y0] = M(k / 13, 0), [x1, y1] = M(k / 13, 1); g.strokeStyle = rgba('#000000', .12); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }   // panel seams
  g.restore();
  // doors and windows (u spans), the open door at u .26–.36 spills light
  const WIN = [[.04, .2], [.42, .6], [.7, .8], [.88, .97]], DOOR = [.27, .37], DOOR2 = [.63, .67];
  for (const [u0, u1] of WIN) {
    const q = quad(M, u0, .38, u1, .76);
    fillQuad(g, q, '#9cc8c4'); fillQuad(e, q, rgba('#7fd8c8', .28));
    g.save(); g.clip(qPath(q));
    const [ax, ay] = M(u0, .38), [bx, by] = M(u1, .76);
    vgrad(g, Math.min(ax, bx) - 40, Math.min(ay, by) - 40, Math.abs(bx - ax) + 80, Math.abs(by - ay) + 80, [[0, '#d8f4ee'], [.3, '#9ccac4'], [1, '#5e8a90']]);
    // inside: the far bench and its passengers (backlit by the car's tubes)
    const seat = quad(M, u0 - .02, .38, u1 + .02, .5); fillQuad(g, seat, '#3a5a8a');
    g.restore();
    const fq = quad(M, u0 - .006, .37, u1 + .006, .77); g.strokeStyle = '#2e3440'; g.lineWidth = 6; g.stroke(qPath(fq));
  }
  // the sleeping passenger in the big window (u .42–.60): head against the far wall, hood up, earbuds
  {
    const q = quad(M, .42, .38, .6, .76), [cx, cy] = M(.505, .54), s = .78;
    celLayer(S, c => { c.save(); c.clip(qPath(q)); c.translate(cx, cy); c.rotate(.22); c.scale(s, s); head80(c, pal('seojun', 'car'), { ch: CH.seojun, view: 'q', expr: 'asleep', wind: 0 }); c.restore(); }, { occlude: false });
    g.save(); g.clip(qPath(q)); g.globalCompositeOperation = 'lighter';   // a glass reflection streak
    const [rx, ry] = M(.47, .76); const gr = g.createLinearGradient(rx - 60, 0, rx + 60, 0); gr.addColorStop(0, rgba('#ffffff', 0)); gr.addColorStop(.5, rgba('#ffffff', .2)); gr.addColorStop(1, rgba('#ffffff', 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(rx - 40, ry); g.lineTo(rx + 40, ry); g.lineTo(rx - 60, ry + 420); g.lineTo(rx - 140, ry + 420); g.fill(); g.restore();
  }
  // open doors: bright interior, the floor of the car, light pouring out
  for (const [u0, u1] of [DOOR, DOOR2]) {
    const q = quad(M, u0, .03, u1, .86);
    fillQuad(g, q, '#cfeee8'); fillQuad(e, q, rgba('#aef4e6', .45));
    g.save(); g.clip(qPath(q)); const [fx, fy] = M((u0 + u1) / 2, .03), [tx, ty] = M((u0 + u1) / 2, .86);
    vgrad(g, 0, ty, W, fy - ty, [[0, '#f4fffc'], [.55, '#c2e4de'], [1, '#86a8a4']]);
    const [px0, py0] = M(u0 + (u1 - u0) * .62, .03), [px1, py1] = M(u0 + (u1 - u0) * .62, .86); g.strokeStyle = '#8a969c'; g.lineWidth = 9; g.beginPath(); g.moveTo(px0, py0); g.lineTo(px1, py1); g.stroke();
    g.restore();
    g.strokeStyle = '#3a404a'; g.lineWidth = 7; g.stroke(qPath(quad(M, u0 - .004, .02, u1 + .004, .87)));
  }
  // platform floor: below the car's floor line, wet, with the safety line
  const [ex0, ey0] = M(0, -.03), [ex1, ey1] = M(1, -.03);
  g.fillStyle = '#26222a'; g.beginPath(); g.moveTo(ex0, ey0); g.lineTo(ex1, ey1); g.lineTo(-300, H); g.lineTo(W + 200, H); g.closePath(); g.fill();
  vgrad(g, 0, 1000, W, 920, [[0, rgba('#3a2e2a', .0)], [.4, rgba('#2c2428', .5)], [1, rgba('#0a080c', .9)]]);
  const yl = (u, d) => { const [x, y] = M(u, -.05); return [x + d * 60, y + d * 150]; };
  g.strokeStyle = '#d8b02a'; g.lineWidth = 16; g.beginPath(); { const a = yl(0, 1), b = yl(1, .4); g.moveTo(a[0] + 40, a[1]); g.lineTo(b[0], b[1]); } g.stroke();
  // reflections on the wet floor: each lit opening smeared straight down in broken vertical streaks
  for (const [u0, u1, k0] of [...WIN.map(w => [...w, .55]), [...DOOR, 1], [...DOOR2, .8]]) {
    const [ax, ay] = M(u0, 0), [bx, by] = M(u1, 0), x0 = Math.min(ax, bx), w = Math.abs(bx - ax), y0 = Math.max(ay, by) + 24, R = rng(Math.floor(u0 * 997));
    for (let x = x0 + w * .06; x < x0 + w * .94; x += 9) {
      const len = 240 + R() * 360, a = .2 * k0 * (.5 + R() * .5);
      for (const [ctx, k] of [[g, 1], [e, .45]]) {
        const gr = ctx.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, rgba('#c8f8ee', a * k)); gr.addColorStop(1, rgba('#c8f8ee', 0));
        ctx.fillStyle = gr; ctx.fillRect(x + Math.sin(x * .7) * 3, y0, 5 + R() * 4, len);
      }
    }
    for (let yy = y0 + 30; yy < y0 + 600; yy += 22 + R() * 18) { g.fillStyle = rgba('#26222a', .55); g.fillRect(x0 - 10, yy, w + 20, 5); }   // ripple bands break the streaks
  }
  // the light spill from the open door onto the platform (a trapezoid toward the camera)
  const [d0x, d0y] = M(DOOR[0], 0), [d1x, d1y] = M(DOOR[1], 0);
  const spill = [[d1x, d1y], [d0x, d0y], [d0x + 330, d0y + 600], [d1x + 90, d1y + 690]];
  g.save(); g.globalCompositeOperation = 'lighter'; fillQuad(g, spill, rgba('#9fe8dc', .22)); g.restore(); fillQuad(e, spill, rgba('#6fd8c8', .25));
  // the shadow: a standing silhouette of the sleeper (hood up), on the platform in the spill, no shadow of its own
  const sx = (d0x + d1x) / 2 + 150, sy = (d0y + d1y) / 2 + 470;
  celLayer(S, c => {
    c.translate(sx, sy); const k = 1.12; c.scale(k, k);
    const sil = path([[-6, -476], [26, -470], [48, -448], [56, -414], [50, -380], [40, -366], [66, -356], [96, -340], [110, -312], [116, -250], [120, -170], [114, -112], [102, -110], [98, -170], [90, -236], [84, -190], [80, -120], [78, -40], [72, 0], [46, 0], [40, -60], [26, -150], [12, -60], [8, 0], [-18, 0], [-22, -60], [-26, -150], [-30, -236], [-42, -170], [-48, -112], [-60, -110], [-62, -170], [-60, -250], [-56, -312], [-40, -340], [-20, -356], [-38, -372], [-50, -400], [-50, -436], [-34, -464]]);
    cel(c, sil, { f: '#07060d', rim: { c: '#b066ff', d: [3, 2] }, l: '#1a0f30', lw: 1.5 });
    const R = rng(31 + fr % 3); c.fillStyle = 'rgba(40,18,70,.55)'; for (let k = 0; k < 14; k++) { c.beginPath(); c.ellipse(-50 + R() * 140, -6 - R() * 40, 16 + R() * 22, 6 + R() * 8, 0, 0, TAU); c.fill(); }   // smoke curling off its feet
  }, { occlude: true });
  e.save(); e.translate(sx, sy); e.scale(1.12, 1.12); e.strokeStyle = rgba('#9a4cff', .5); e.lineWidth = 7; e.stroke(path([[-6, -476], [26, -470], [48, -448], [56, -414], [50, -380], [40, -366], [66, -356], [96, -340], [110, -312], [116, -250], [120, -170]], false)); e.restore();
  // foreground pillar: 1984 tiles (mint, olive under sodium), a blank station-name plate
  const px = 862;
  g.fillStyle = '#7d9470'; g.fillRect(px, 0, W - px, H);
  g.save(); g.beginPath(); g.rect(px, 0, W - px, H); g.clip();
  for (let y = 0; y < H; y += 54) for (let x = px; x < W; x += 54) { g.fillStyle = mix('#8fa680', '#5f7458', hash(x * .13 + y * .07) * .6); g.fillRect(x + 2, y + 2, 50, 50); }
  vgrad(g, px, 0, W - px, H, [[0, rgba('#0a0810', .55)], [.35, rgba('#0a0810', .1)], [.75, rgba('#2a1c10', .35)], [1, rgba('#0a0810', .8)]]);
  g.fillStyle = rgba('#000000', .35); g.fillRect(px, 0, 26, H);
  g.restore();
  g.fillStyle = '#1c2a4a'; g.fillRect(px + 34, 640, 170, 300); g.strokeStyle = '#e8ecf4'; g.lineWidth = 4; g.strokeRect(px + 44, 650, 150, 280);
  g.fillStyle = rgba('#e8ecf4', .25); g.fillRect(px + 60, 700, 118, 6); g.fillRect(px + 60, 880, 118, 4);   // the name is gone: only the rules of the plate remain
  airbrush(g, px + 120, 790, 60, 90, '#ffb347', .08);
}

// ——————————————————————————————————————————— F2: held bust, light bands ———
// 서하 at the cab door: the tunnel's lamps sweep across her in bands; she holds up a talisman
export function bust(S) {
  const { g, e, t, lt = t } = S, P = pal('seoha', 'car'), fr = Math.floor(t * 12);
  vgrad(g, 0, 0, W, H, [[0, '#0a0c16'], [.5, '#141626'], [1, '#07080e']]);
  // the window behind her: black tunnel with orange lamps streaking past
  g.fillStyle = '#05060a'; g.fillRect(40, 300, 1000, 760); g.strokeStyle = '#c8ccc0'; g.lineWidth = 18; g.strokeRect(40, 300, 1000, 760);
  g.save(); g.beginPath(); g.rect(49, 309, 982, 742); g.clip();
  speedLines(g, fr, { type: 'h', n: 26, col: '#ff9a3c', a: .8, hmax: 14, seed: 3 }); speedLines(e, fr, { type: 'h', n: 26, col: '#ff8a2c', a: .7, hmax: 14, seed: 3 });
  speedLines(g, fr + 5, { type: 'h', n: 40, col: '#4a5a8a', a: .5, hmax: 4, seed: 4 });
  g.restore();
  // fluorescent tube above
  g.fillStyle = '#e8fffa'; g.fillRect(140, 110, 800, 22); lamp(null, e, 540, 121, 60, '#a8fff0', .5); e.fillStyle = rgba('#b8fff4', .6); e.fillRect(140, 110, 800, 22);
  airbrush(g, 540, 160, 520, 140, '#bff4ea', .12);
  // the cel: 서하, 3/4, determined; light bands (tunnel lamps) slide across her
  const s = 2.9, X = 500, Y = 900;
  celLayer(S, c => {
    c.translate(X, Y); c.scale(s, s);
    head80(c, P, { ch: CH.seoha, view: 'q', expr: 'determined', wind: 0, look: [.45, -.05], reflect: '#ff9a3c', rim: { c: '#ff9a3c', d: [1.4, .6] } });
    c.setTransform(1, 0, 0, 1, 0, 0);
    // the hand with the talisman, foreground right (paper between index and middle finger)
    talismanHand(c, P, 860, 1330, -.12);
    c.globalCompositeOperation = 'source-atop';
    for (let k = 0; k < 2; k++) {
      const x = W + 300 - ((t * 1400 + k * 1100) % 2400);
      const gr = c.createLinearGradient(x - 180, 0, x + 180, 0); gr.addColorStop(0, rgba('#ff8a2c', 0)); gr.addColorStop(.5, rgba('#ff9a3c', .34)); gr.addColorStop(1, rgba('#ff8a2c', 0));
      c.fillStyle = gr; c.beginPath(); c.moveTo(x - 180, 0); c.lineTo(x + 180, 0); c.lineTo(x + 40, H); c.lineTo(x - 320, H); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  });
}
export function talismanHand(c, P, x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  // sleeve + shirt cuff (the forearm rises from the bottom edge)
  cel(c, poly([[-150, 640], [-136, 250], [60, 236], [140, 620]]), { f: P.coat.f, s: P.coat.s, so: [-30, 0], h: P.coat.h, ho: [8, 0], l: P.coat.l, lw: 4 });
  cel(c, poly([[-142, 262], [-150, 212], [64, 196], [66, 248]]), { f: P.shirt.f, s: P.shirt.s, so: [0, -10], l: P.shirt.l, lw: 3.5 });
  const S = { f: P.skin.f, s: P.skin.s, h: P.skin.h, l: P.skin.l, lw: 3.2 };
  // back of the hand (palm away from us), knuckle line slanted
  cel(c, [[-112, 214], [-122, 118, 1], [-96, 20], [-40, -2], [30, 8], [70, 40, 1], [64, 140], [44, 206]], { ...S, so: [-18, -6] });
  // the talisman held upright between index and middle finger: behind the fingers
  const T = poly([[-70, -360], [58, -372], [70, -10], [-56, 0]]);
  cel(c, T, { f: P.talisman.f, s: P.talisman.s, sh: [[[-70, -360], [-42, -362], [-30, -2], [-56, 0]]], l: P.talisman.l, lw: 3 });
  c.save(); c.clip(T); c.strokeStyle = P.ink; c.lineCap = 'round';
  c.lineWidth = 7; c.strokeRect(-48, -340, 98, 316);                     // a border, as on a real 부적
  c.lineWidth = 9; c.beginPath(); c.moveTo(0, -318); c.lineTo(2, -60); c.stroke();   // the spine stroke
  const R = rng(17);
  for (let k = 0; k < 6; k++) { const yy = -290 + k * 40; c.beginPath(); c.moveTo(-30 + R() * 8, yy + R() * 6); c.quadraticCurveTo(0, yy - 10, 32 - R() * 8, yy + 6); c.stroke(); }
  c.lineWidth = 6; c.beginPath(); c.arc(2, -78, 24, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-14, -94); c.lineTo(18, -62); c.stroke();
  c.restore();
  // index and middle finger: long, slightly tapered, knuckle creases; the paper sits between them
  cel(c, [[-62, 30], [-70, -60], [-66, -150], [-46, -168, 1], [-30, -150], [-28, -60], [-24, 24]], { ...S, so: [-8, 0] });
  cel(c, [[-20, 22], [-20, -80], [-14, -176], [6, -196, 1], [22, -176], [22, -80], [26, 26]], { ...S, so: [-8, 0] });
  for (const [x0, x1, y0] of [[-66, -28, -70], [-20, 22, -86]]) line(c, [[x0 + 4, y0], [x1 - 4, y0 - 2]], P.skin.l, 1.8);
  // ring and little finger curled into the palm, thumb pressed over them
  cel(c, [[28, 30], [66, 34], [82, 64, 1], [68, 92], [30, 88]], { ...S, so: [-6, -6] });
  cel(c, [[30, 92], [64, 96], [74, 124, 1], [58, 148], [30, 140]], { ...S, so: [-6, -6] });
  cel(c, [[-118, 150], [-110, 96], [-62, 92], [10, 108, 1], [-6, 128], [-70, 140]], { ...S, so: [-6, -6] });
  c.restore();
}

// ——————————————————————————————————————————— F3: 무진's fist (and its impact frame) ———
export function impact(S, inv = false) {
  const { g, e, t } = S, P = pal('mujin', 'tunnel'), fr = Math.floor(t * 12);
  const FX = 380, FY = 1230;
  if (!inv) {
    vgrad(g, 0, 0, W, H, [[0, '#0e0a1c'], [.6, '#1c1230'], [1, '#08060e']]);
    // the doorway behind him, crowded with shadow passengers
    g.fillStyle = '#2a2440'; g.fillRect(560, 180, 520, 1200); g.fillStyle = '#c8f4ec'; g.fillRect(600, 220, 440, 1140); e.fillStyle = rgba('#8fe8dc', .5); e.fillRect(600, 220, 440, 1140);
    const R = rng(5);
    for (let k = 0; k < 6; k++) { const x = 640 + k * 80 + R() * 30, y = 420 + R() * 120, s = .9 + R() * .4; g.fillStyle = '#0a0812'; g.beginPath(); g.ellipse(x, y, 40 * s, 52 * s, 0, 0, TAU); g.fill(); g.fillRect(x - 70 * s, y + 40 * s, 140 * s, 900); e.fillStyle = rgba('#9a4cff', .35); e.beginPath(); e.ellipse(x, y, 44 * s, 56 * s, 0, 0, TAU); e.fill(); }
    speedLines(g, fr, { type: 'radial', cx: FX, cy: FY, n: 120, col: '#e8e0ff', a: .55, r0: 260, seed: 9 });
    speedLines(e, fr, { type: 'radial', cx: FX, cy: FY, n: 50, col: '#b48cff', a: .35, r0: 300, seed: 9 });
  } else {
    g.fillStyle = '#f4f0ff'; g.fillRect(0, 0, W, H);
    speedLines(g, fr, { type: 'radial', cx: FX, cy: FY, n: 150, col: '#0a0812', a: .9, r0: 240, seed: 9, wmul: 1.4 });
  }
  const L = celLayer(S, c => {
    // 무진: low angle, shouting; the fist thrust at the lens, beads wound round the knuckles
    c.save(); c.translate(690, 760); c.scale(2.35, 2.35);
    head80(c, P, { ch: CH.mujin, view: 'q', expr: 'shout', wind: 0, look: [.1, .3], rim: { c: '#b48cff', d: [1.5, 1] } });
    c.restore();
    fist(c, P, FX, FY, 1);
  }, { occlude: !inv });
  if (inv) {   // impact frame: the cel layer as a flat black silhouette over the radial lines
    MG.setTransform(1, 0, 0, 1, 0, 0); MG.clearRect(0, 0, W, H); MG.drawImage(L, 0, 0); MG.globalCompositeOperation = 'source-in'; MG.fillStyle = '#0a0812'; MG.fillRect(0, 0, W, H); MG.globalCompositeOperation = 'source-over';
    g.fillStyle = '#f4f0ff'; g.fillRect(0, 0, W, H); speedLines(g, fr, { type: 'radial', cx: FX, cy: FY, n: 150, col: '#0a0812', a: .9, r0: 240, seed: 9, wmul: 1.4 });
    g.drawImage(MC, 0, 0); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  } else { lamp(g, e, FX - 60, FY - 120, 22, '#ffb347', .9); }
}
export function fist(c, P, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // forearm (robe sleeve) back to his shoulder
  cel(c, poly([[60, 60], [210, 40], [330, 260], [140, 300]]), { f: P.robe.f, s: P.robe.s, so: [-20, -10], h: P.robe.h, ho: [8, 4], l: P.robe.l, lw: 4 });   // sleeve: the arm runs back behind the fist to his shoulder
  const S = { f: P.skin.f, s: P.skin.s, h: P.skin.h, l: P.skin.l, lw: 4 };
  // the fist, knuckles toward the lens (foreshortened): back of the hand, four knuckles, folded fingers, thumb across
  cel(c, [[-236, -40, 1], [-214, -176], [-150, -214, 1], [-100, -196], [-50, -230, 1], [0, -214], [50, -232, 1], [100, -210], [150, -222, 1], [206, -150], [232, -30, 1], [206, 110], [80, 186, 1], [-90, 196], [-206, 126, 1]], { ...S, so: [-28, -20], ho: [10, 8] });
  for (let k = 0; k < 4; k++) { const kx = -150 + k * 100, ky = -120 + Math.abs(k - 1.5) * 18; cel(c, [[kx - 48, ky], [kx - 30, ky - 54], [kx + 30, ky - 56], [kx + 50, ky], [kx + 30, ky + 40], [kx - 30, ky + 40]], { ...S, so: [-10, -10], lw: 3 }); }
  for (let k = 0; k < 4; k++) { const kx = -150 + k * 100; line(c, [[kx - 40, 40], [kx + 40, 34]], P.skin.l, 3); line(c, [[kx - 44, 100], [kx + 34, 96]], mix(P.skin.l, P.skin.f, .3), 2.5); }
  cel(c, [[-230, 40], [-120, 60], [40, 70], [120, 110], [60, 160], [-120, 150], [-220, 110]], { ...S, so: [-10, -10] });   // thumb across
  // beads wound round the knuckles: two diagonal turns of big beads + a tassel
  for (let turn = 0; turn < 2; turn++) for (let i = 0; i < 9; i++) {
    const u = i / 8, bx = -210 + u * 430, by = -30 + turn * 90 - u * 120 + Math.sin(u * Math.PI) * -20;
    const B = new Path2D(); B.arc(bx, by, 22, 0, TAU);
    cel(c, B, { f: P.beads.f, s: P.beads.s, so: [-7, -7], h: P.beads.h, hi: [[[bx - 9, by - 12], [bx, by - 16], [bx - 4, by - 4]]], l: P.beads.l, lw: 2.6 });
  }
  cel(c, [[210, -150], [250, -60], [236, 40], [218, -50]], { f: '#8a2a20', s: '#4a1410', so: [-4, 0], l: '#2a0806', lw: 2.5 });   // tassel
  c.restore();
}
