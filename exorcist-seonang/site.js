// The redevelopment site at night, as one tall hanging scroll (world units = screen px at zoom 1; width 1080):
// sky (a tower crane, apartment frames in clear ink) → the 서낭나무 and the fence at ground level (y = 2000) → under the ground
// the roots and, below them, the hungry dead (아귀) the tree has held down for five hundred years.
// Static parts are painted once into cached wet/dry layers; the cloth strips, the excavator, the figures and the 아귀 are drawn per frame.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { clamp, lerp, mulberry, vnoise } from '/core/lib.js';

export const WW = 1080, GY = 2000;                     // world width, ground line
export const TREE = [540, GY];
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function layer(w, h) { const wet = cv(w, h), dry = cv(w, h); return { wet, dry, h, ink: { wet: wet.getContext('2d'), dry: dry.getContext('2d') } }; }
let L = null;
export const layers = () => L;

// —— the tree: trunk (wet masses + loaded strokes), limbs, dry twigs, foliage clusters of wet dots ——
function tree(I, x, y, s, seed = 5) {
  const R = mulberry(seed), T = p => [x + p[0] * s, y + p[1] * s, p[2] ?? 1];
  // trunk: a twisted mass, darker on the left, roots flaring at the base
  mass(I.wet, [[-60, 0], [-38, -120], [-46, -260], [-30, -420], [-44, -560], [-16, -600], [24, -590], [40, -470], [30, -330], [46, -200], [40, -80], [70, 0]].map(T), .5, 6 * s, seed, [x - 60 * s, 0, x + 70 * s, 0, 1.3, .6]);
  draw(I, mk([[-52, 0], [-36, -150], [-42, -300], [-30, -450], [-40, -580]].map(T), { w: 34 * s, tone: .86, darkDir: [-1, 0], side: .9, brWet: true, body: .35, dry: .45, wet: .9, prof: 'rise', seed: seed * 7 }));
  draw(I, mk([[60, 0], [40, -110], [44, -240], [30, -380], [34, -520], [20, -600]].map(T), { w: 22 * s, tone: .6, darkDir: [1, 0], side: .85, brWet: true, body: .25, dry: .55, wet: .8, prof: 'rise', seed: seed * 7 + 1 }));
  for (let k = 0; k < 7; k++) { const yy = -40 - k * 80 - R() * 30; draw(I, mk([[-30 + R() * 20, yy], [-10 + R() * 30, yy - 30 - R() * 20]].map(T), { w: 7 * s, tone: .7, dry: .7, wet: .3, prof: 'tip', seed: seed * 40 + k }), 1, .8); }   // bark knots
  for (const [a, b] of [[-1, 1], [1, 1]]) draw(I, mk([[a * 40, -6], [a * 90, 4], [a * 140, 10]].map(T), { w: 22 * s, tone: .7, darkDir: [0, 1], side: .8, brWet: true, body: .3, dry: .5, wet: .8, prof: 'cone', seed: seed * 9 + (a > 0 ? 1 : 0) }));
  // limbs: three heavy, then dry twigs (flying white)
  const limbs = [[[-20, -560], [-120, -680], [-260, -760], [-380, -800]], [[10, -590], [40, -720], [20, -860], [60, -960]], [[30, -560], [160, -650], [300, -700], [420, -760]], [[-30, -600], [-80, -760], [-180, -900]]];
  limbs.forEach((lb, i) => {
    draw(I, mk(lb.map((p, j) => [...T(p).slice(0, 2), 1 - j * .18]), { w: (26 - i * 3) * s, tone: .8, darkDir: [0, 1], side: .8, brWet: true, body: .3, dry: .5, wet: .7, prof: 'cone', seed: seed * 11 + i }));
    for (let k = 0; k < 7; k++) {
      const u = .3 + R() * .7, a0 = lb[Math.floor(u * (lb.length - 1))], a1 = lb[Math.min(lb.length - 1, Math.floor(u * (lb.length - 1)) + 1)];
      const bx = lerp(a0[0], a1[0], R()), by = lerp(a0[1], a1[1], R()), ang = -Math.PI / 2 + (R() - .5) * 2.2, len = 60 + R() * 110;
      draw(I, mk([[bx, by], [bx + Math.cos(ang) * len * .5 + (R() - .5) * 20, by + Math.sin(ang) * len * .5], [bx + Math.cos(ang) * len, by + Math.sin(ang) * len]].map(T), { w: (4 + R() * 4) * s, tone: .85, dry: .65, wet: .1, prof: 'tip', seed: seed * 100 + i * 10 + k }));
    }
  });
  // foliage: clusters of wet dots (dense and dark near the limbs, pale at the edges), the crown dissolving upward
  for (let k = 0; k < 26; k++) {
    const cxk = -380 + R() * 800, cyk = -760 - R() * 260 + Math.abs(cxk) * .18, n = 14 + Math.floor(R() * 14);
    for (let j = 0; j < n; j++) blot(I.wet, x + (cxk + (R() - .5) * 120) * s, y + (cyk + (R() - .5) * 70) * s, (7 + R() * 9) * s, .18 + R() * .3, R() * 3, .6 + R() * .3, seed + k * 31 + j);
  }
  // the straw rope (금줄) round the trunk at chest height
  draw(I, mk([[-46, -300], [0, -288], [46, -300]].map(T), { w: 7 * s, tone: .78, dry: .6, wet: .2, prof: 'even', seed: seed * 3 + 77 }));
}
// cloth strips (오색 천, in ink tones only) hanging from the rope; they lift when the bell rings. lift 0..1, t for the flutter
export function strips(I, x, y, s, t, lift = 0, seed = 21) {
  const R = mulberry(seed), tones = [.34, .16, .6, .25, .45, .2, .5, .3];
  for (let k = 0; k < 8; k++) {
    const ax = (-42 + k * 12) * s, ay = (-296 + Math.abs(k - 3.5) * 1.5) * s, len = (60 + R() * 50) * s, ph = R() * 6;
    const pts = [];
    for (let i = 0; i <= 5; i++) {
      const u = i / 5, wave = Math.sin(t * (3 + R() * .01) + ph - u * 3) * (4 + 10 * lift) * u * s;
      const dirA = lerp(Math.PI / 2, -Math.PI / 2 + (k - 3.5) * .18, lift);
      pts.push([x + ax + Math.cos(dirA) * len * u + wave, y + ay + Math.sin(dirA) * len * u]);
    }
    draw(I, mk(pts, { w: (6 + R() * 4) * s, tone: tones[k], dry: .3, wet: .6, prof: 'even', rough: .2, seed: seed * 10 + k }));
  }
}

export function init() {
  if (L) return;
  L = { sky: layer(WW, 2400), under: layer(WW, 2300) };
  const S = L.sky.ink, R = mulberry(3);
  // far apartment frames (clear ink, dry), dissolving downward into mist
  for (const [x0, x1, top] of [[700, 1000, 1240], [420, 560, 1520]]) {
    for (let x = x0; x <= x1; x += 48) draw(S, mk([[x, top + R() * 30], [x + (R() - .5) * 6, GY - 40]], { w: 3.4, tone: .2, dry: .75, prof: 'tip', seed: Math.floor(x * 3 + top) }), 1, .8);
    for (let y = top; y < GY - 60; y += 70) draw(S, mk([[x0 - 6, y], [x1 + 6, y + (R() - .5) * 6]], { w: 2.6, tone: .16, dry: .8, prof: 'tip', seed: Math.floor(y * 7 + x0) }), 1, .7);
  }
  // the tower crane: a mast of burnt lines, the jib across the sky, a hanging hook
  const cx = 900, cTop = 640;   // the tower crane stands at the right; its jib reaches left over the site (the left sky stays empty for the title)
  for (const dx of [-14, 14]) draw(S, mk([[cx + dx, GY - 20], [cx + dx * .9, cTop]], { w: 4, tone: .8, dry: .45, prof: 'even', seed: 300 + dx }));
  for (let y = cTop + 30; y < GY - 30; y += 46) draw(S, mk([[cx - 14, y], [cx + 14, y + 40]], { w: 1.8, tone: .6, dry: .6, prof: 'tip', seed: 400 + y }), 1, .8);
  draw(S, mk([[cx + 140, cTop + 14], [cx - 560, cTop]], { w: 5, tone: .82, dry: .4, prof: 'even', seed: 501 }));
  draw(S, mk([[cx + 140, cTop + 34], [cx - 560, cTop + 22]], { w: 2.4, tone: .6, dry: .6, prof: 'even', seed: 502 }));
  for (let x = cx - 540; x < cx + 120; x += 40) draw(S, mk([[x, cTop + 32], [x + 30, cTop + 4]], { w: 1.4, tone: .5, dry: .7, prof: 'tip', seed: 600 + x }), 1, .7);
  draw(S, mk([[cx - 420, cTop + 20], [cx - 420, cTop + 420]], { w: 1.6, tone: .55, dry: .5, prof: 'tip', seed: 701 }));
  blot(S.wet, cx - 420, cTop + 430, 8, .7, 0, 1, 4);
  // ground: a pale wash band fading down and toward the edges (no hard ends), rubble dots, tyre ruts
  const G = S.wet; const gr = G.createLinearGradient(0, GY - 30, 0, GY + 260);
  gr.addColorStop(0, 'rgba(0,0,0,.26)'); gr.addColorStop(.25, 'rgba(0,0,0,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  G.fillStyle = gr; G.fillRect(0, GY - 30, WW, 300);
  G.globalCompositeOperation = 'destination-in'; const gx = G.createLinearGradient(0, 0, WW, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.12, '#000'); gx.addColorStop(.88, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)'); G.fillStyle = gx; G.fillRect(0, GY - 40, WW, 320); G.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 60; k++) blot(S.wet, 60 + R() * 960, GY + 10 + R() * 120, 2 + R() * 4, .3 + R() * .3, R() * 3, .5, k + 9);
  for (const [a, b] of [[640, 860], [720, 1000]]) draw(S, mk([[a, GY + 40], [b, GY + 90]], { w: 9, tone: .3, dry: .8, prof: 'even', seed: a }), 1, .8);
  // the fence (low panels, posts), broken where the site opened
  for (let x = 30; x < 1050; x += 74) { if (x > 380 && x < 700) continue; draw(S, mk([[x, GY - 6], [x + 2, GY - 78]], { w: 3.2, tone: .7, dry: .4, prof: 'even', seed: 800 + x })); mass(S.wet, [[x, GY - 74], [x + 70, GY - 72], [x + 70, GY - 10], [x, GY - 12]], .1, 2, x); }
  tree(S, TREE[0], TREE[1], 1, 5);
  // —— under the ground (layer origin y = GY - 100) ——
  const U = L.under.ink, oy = GY - 100, R2 = mulberry(8);
  const Ug = U.wet; const dg = Ug.createLinearGradient(0, 100, 0, 2300);
  dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(.18, 'rgba(0,0,0,.16)'); dg.addColorStop(.55, 'rgba(0,0,0,.5)'); dg.addColorStop(1, 'rgba(0,0,0,.82)');
  Ug.fillStyle = dg; Ug.fillRect(0, 100, WW, 2200);
  // roots: loaded strokes reaching down and out, the deepest wrapping round the dark
  for (let k = 0; k < 14; k++) {
    const a0 = (k / 13 - .5) * 2.4 + (R2() - .5) * .3, x0 = TREE[0] + (R2() - .5) * 80, pts = [[x0, 100]];
    let x = x0, y = 100, a = Math.PI / 2 + a0 * .6;
    for (let i = 0; i < 7; i++) { a += (R2() - .5) * .5 + a0 * .08; const st = 90 + R2() * 120; x += Math.cos(a) * st; y += Math.sin(a) * st; pts.push([x, y]); }
    draw(U, mk(pts.map((p, i) => [p[0], p[1], 1 - i * .11]), { w: 26 - Math.abs(a0) * 6, tone: .82, darkDir: [-1, 0], side: .7, brWet: true, body: .35, dry: .5, wet: .7, prof: 'cone', seed: 900 + k }));
  }
}
// blit a cached layer through the camera (cam = {x, y, z}: world point at the screen centre, zoom)
export const camXf = cam => ({ s: cam.z, tx: 540 - cam.x * cam.z, ty: 960 - cam.y * cam.z });
export function blit(A, lay, cam, oy = 0, am = 1) {
  const { s, tx, ty } = camXf(cam);
  for (const k of ['wet', 'dry']) { const c = A.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = am; c.drawImage(lay[k], tx, ty + oy * s, WW * s, lay.h * s); c.restore(); }
}
export const UNDER_OY = GY - 100;
export function setCam(A, cam) { const { s, tx, ty } = camXf(cam); A.xf(s, tx, ty); }

// —— the excavator: tracks, cab, boom and arm (straight loaded strokes), the bucket with five teeth ——
// x, y = track base centre; s scale; boom/arm angles (radians); returns the bucket-teeth point
export function excavator(I, x, y, s, boomA = -.9, armA = .9, bucketA = 1.4, o = {}) {
  const T = p => [x + p[0] * s, y + p[1] * s];
  mass(I.wet, [[-150, 0], [150, 0], [170, -40], [-170, -40]].map(T), .62, 3 * s, 11, [x, y, x, y - 40 * s, 1, .8]);   // tracks
  for (let k = 0; k < 6; k++) blot(I.wet, x + (-130 + k * 52) * s, y - 20 * s, 15 * s, .5, 0, 1, k);
  mass(I.wet, [[-130, -40], [120, -40], [120, -130], [-60, -130], [-130, -100]].map(T), .5, 3 * s, 12, [x, y - 40 * s, x, y - 130 * s, 1, .7]);   // body
  mass(I.wet, [[-110, -130], [-20, -130], [-20, -230], [-90, -230], [-110, -200]].map(T), .42, 3 * s, 13);   // cab
  mass(I.wet, [[-96, -150], [-34, -150], [-34, -214], [-84, -214]].map(T), -.0, 0, 14);
  draw(I, mk([T([-96, -214]), T([-34, -214]), T([-34, -150])], { w: 3 * s, tone: .85, dry: .4, prof: 'even', seed: 15 }));
  const pivot = [40, -120], elbow = [pivot[0] + Math.cos(boomA) * 300, pivot[1] + Math.sin(boomA) * 300];
  const wrist = [elbow[0] + Math.cos(boomA + armA) * 220, elbow[1] + Math.sin(boomA + armA) * 220];
  draw(I, mk([T(pivot), T([(pivot[0] + elbow[0]) / 2, (pivot[1] + elbow[1]) / 2 - 14]), T(elbow)], { w: 36 * s, tone: .78, darkDir: [0, 1], side: .8, brWet: true, body: .4, dry: .35, wet: .7, prof: 'even', seed: 16 }));
  draw(I, mk([T(elbow), T(wrist)], { w: 26 * s, tone: .82, darkDir: [0, 1], side: .8, brWet: true, body: .4, dry: .35, wet: .7, prof: 'even', seed: 17 }));
  draw(I, mk([T([pivot[0] + 30, pivot[1] + 10]), T([elbow[0] + 6, elbow[1] + 30])], { w: 8 * s, tone: .9, dry: .3, prof: 'even', seed: 18 }));   // hydraulic ram
  // bucket: a curved mass and five teeth along its lip
  const b = bucketA, bc = [wrist[0] + Math.cos(b) * 60, wrist[1] + Math.sin(b) * 60], n = [Math.cos(b + Math.PI / 2), Math.sin(b + Math.PI / 2)];
  const lipA = [bc[0] + n[0] * 44 + Math.cos(b) * 30, bc[1] + n[1] * 44 + Math.sin(b) * 30], lipB = [bc[0] - n[0] * 44 + Math.cos(b) * 30, bc[1] - n[1] * 44 + Math.sin(b) * 30];
  mass(I.wet, [wrist, [wrist[0] + n[0] * 30, wrist[1] + n[1] * 30], lipA, lipB, [wrist[0] - n[0] * 36, wrist[1] - n[1] * 36]].map(T), .62, 2 * s, 19);
  const teeth = [];
  for (let k = 0; k < 5; k++) { const u = k / 4, p0 = [lerp(lipA[0], lipB[0], u), lerp(lipA[1], lipB[1], u)], p1 = [p0[0] + Math.cos(b) * 42, p0[1] + Math.sin(b) * 42]; draw(I, mk([T(p0), T(p1)], { w: 9 * s, tone: TONE.jiao, dry: .2, prof: 'nail', seed: 20 + k })); teeth.push(T(p1)); }
  draw(I, mk([T(lipA), T(lipB)], { w: 5 * s, tone: TONE.jiao, dry: .3, prof: 'even', seed: 26 }));
  return { teeth, lip: [T(lipA), T(lipB)], wrist: T(wrist), elbow: T(elbow) };
}

// —— 아귀 (hungry ghost): a swollen belly of pale wash, a needle-thin neck, a small head that is all mouth (the mouth left as paper),
// thin burnt limbs and claws. rise 0..1 grows it out of the ground; t boils the strokes (on twos)
export function agwi(I, x, y, s, t, seed = 1, o = {}) {
  const rise = clamp(o.rise ?? 1), am = o.am ?? 1, R = mulberry(seed), lean = (R() - .5) * .3 + (o.lean || 0);
  const T = p => [x + (p[0] + p[1] * -lean) * s, y + p[1] * s * rise, p[2] ?? 1];
  const boil = Math.floor(t * 12) % 3;
  // belly
  mass(I.wet, Array.from({ length: 14 }, (_, k) => { const a = k / 14 * Math.PI * 2; return T([Math.cos(a) * 34, -60 + Math.sin(a) * 30]); }), .3 * am, 3 * s, seed + boil);
  draw(I, mk([T([-30, -84]), T([-38, -60]), T([-26, -34])], { w: 6 * s, tone: .7, darkDir: [-1, 0], side: .8, brWet: true, body: .3, dry: .5, wet: .6, prof: 'lens', seed: seed * 7 + boil }), 1, am);
  // neck and head (the mouth stays paper)
  draw(I, mk([T([0, -88]), T([2 + lean * 10, -128]), T([0, -150])], { w: 2.2 * s, tone: TONE.jiao, dry: .3, prof: 'tip', seed: seed * 9 }), 1, am);
  const hx = 0, hy = -164, mo = .6 + .4 * Math.sin(t * 5 + seed);
  draw(I, mk(Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + k / 10 * Math.PI * 2; return T([hx + Math.cos(a) * 15, hy + Math.sin(a) * (12 + 6 * mo)]); }), { w: 7 * s, tone: .9, dry: .35, wet: .4, prof: 'even', seed: seed * 11 + boil }), 1, am);
  for (const dx of [-6, 6]) draw(I, mk([T([hx + dx, hy - 12]), T([hx + dx * 1.6, hy - 20])], { w: 2 * s, tone: TONE.jiao, dry: .3, prof: 'tip', seed: seed * 13 + dx }), 1, am);   // eyes
  // arms reaching up, claws
  for (const sd of [-1, 1]) {
    const reach = .6 + .4 * Math.sin(t * 3 + seed + sd);
    const e = [sd * 40, -96 - 20 * reach], h = [sd * (52 + 10 * reach), -140 - 40 * reach];
    draw(I, mk([T([sd * 26, -82]), T(e), T(h)], { w: 2.4 * s, tone: TONE.jiao, dry: .35, prof: 'tip', seed: seed * 17 + sd + boil }), 1, am);
    for (let k = -1; k <= 1; k++) draw(I, mk([T(h), T([h[0] + sd * 4 + k * 5, h[1] - 12])], { w: 1.4 * s, tone: TONE.jiao, dry: .4, prof: 'tip', seed: seed * 19 + k }), 1, am);
  }
  // legs (thin, bent), dissolving into the ground
  for (const sd of [-1, 1]) draw(I, mk([T([sd * 14, -34]), T([sd * 26, -16]), T([sd * 18, 0])], { w: 2.6 * s, tone: .8, dry: .5, prof: 'tip', seed: seed * 23 + sd }), 1, am * rise);
}
