// Pixel characters of 「악몽을 지키는 파수꾼」, drawn pixel by pixel (3/4 view facing right), one frame per pose, packed
// into an atlas; billboards take the scene light (the library's 2.5D engine: px.js billboard / atlas method).
//   노을 — the old keeper: teal cloak (the one colour no set uses), white hair in a bun, an iron lantern
//   하루 — the boy: white night clothes, dark hair, bare feet
//   moths — the nightmares: small violet moths (2 flap frames) and the big one on the cottage roof, whose wings carry teal
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 30;   // character pixel → metres
const FW = 34, FH = 50;

const C = {
  cloak: ramp(['#0c2a2c', '#134244', '#1d5e5c', '#2a7c74', '#3f9a8c'], .22),     // teal
  cloakIn: ramp(['#2b1830', '#43263f'], .22),
  dress: ramp(['#2a2236', '#3d3350', '#55496b'], .22),
  skin: ramp(['#a8705c', '#cc917a', '#e7b79c', '#f6d7c2'], .22),
  hairW: ramp(['#8e8c98', '#b9b7c2', '#dddbe4', '#f4f3f8'], .22),
  hairD: ramp(['#120d14', '#241a24', '#3a2b36'], .22),
  pj: ramp(['#7f8494', '#aeb3c2', '#d8dce6', '#f2f4f8'], .22),
  pjStripe: ramp(['#6a7aa0', '#8ea0c4'], .22),
  iron: ramp(['#121216', '#26262e', '#3e3e4a', '#5c5c6a'], .22),
  glass: ramp(['#ff8a1c', '#ffc14a', '#ffe79a', '#fffbe6'], .22),
  boot: ramp(['#140e0c', '#2a1d16', '#3e2c20'], .22),
  violet: ramp(['#1c0d2a', '#3a1856', '#6a2c96', '#a256d8', '#d9a8ff'], .22),
};
const INK = hex('#1a1016');

// —— the lantern: iron frame, amber glass; lit 0..1 sets the flame; a few violet specks = moths caught inside (moths 0..1) ——
function lantern(P, E, x, y, lit = 1, moths = 0, fill = 0, crk = 0) {
  P.set(x + 2, y - 2, C.iron(.6, 0, 0)); P.set(x + 1, y - 1, C.iron(.7, 0, 0)); P.set(x + 3, y - 1, C.iron(.7, 0, 0));
  P.rect(x, y, 5, 1, C.iron(.9, 0, 0));
  for (let j = 1; j <= 5; j++) for (let i = 0; i < 5; i++) {
    if (i === 0 || i === 4) { P.set(x + i, y + j, C.iron(i === 0 ? .7 : .4, i, j)); continue; }
    const cx = i - 2, cy = j - 3.2, r = Math.hypot(cx * 1.1, cy * .8), f = lit * (1.35 - r * .45);
    const vio = fill > 0 && ((i * 7 + j * 5) % 10) / 10 < fill * .85;   // 2편: the glass fills with violet moths
    if (vio) { const c = C.violet(.62 + .3 * (((i + j) % 2)), x + i, y + j); P.set(x + i, y + j, c); E && E.set(x + i, y + j, c); }
    else if (lit > .04 && f > .35) { const c = C.glass(Math.min(.99, f * .75), x + i, y + j); P.set(x + i, y + j, c); E && E.set(x + i, y + j, c); }
    else P.set(x + i, y + j, hex('#2a2430'));
  }
  if (crk) { const w = hex('#f6eeff'); [[1, 1], [2, 2], [2, 3], [3, 4], [1, 4]].forEach(([i, j]) => { P.set(x + i, y + j, w); E && E.set(x + i, y + j, w); }); }
  if (moths > .2) { const v = C.violet(.75, 0, 0); P.set(x + 1, y + 4, v); E && E.set(x + 1, y + 4, v); }
  if (moths > .5) { const v = C.violet(.9, 0, 0); P.set(x + 3, y + 2, v); E && E.set(x + 3, y + 2, v); }
  P.rect(x, y + 6, 5, 1, C.iron(.6, 0, 0));
}

// —— 노을 —— p: {step 0..3|null, bob, arm:'low'|'up'|'fwd'|'none', kneel, sit, lit, moths, blink, closed, look}
function drawNoeul(P, E, p) {
  const by = (p.bob || 0) + (p.kneel ? 14 : 0) + (p.sit ? 11 : 0), top = 19 + by;
  // legs (only the boots show under the long cloak)
  if (!p.kneel && !p.sit) {
    const st = p.step ?? -1, legs = st < 0 ? [[13, 0], [17, 0]] : [[[11, 0], [19, -1]], [[13, -1], [17, 0]], [[19, -1], [11, 0]], [[17, 0], [13, -1]]][st];
    legs.forEach(([lx, ly], i) => { for (let y = 44; y < 48 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.boot(i ? .5 : .8, x, y)); P.rect(lx, 47 + ly, 5, 1, C.boot(.1, 0, 0)); });
  }
  if (p.sit) { P.rect(20, 45, 8, 3, C.dress(.4, 0, 0)); P.rect(26, 46, 3, 2, C.boot(.6, 0, 0)); }
  // cloak: a long bell, hood down on the shoulders
  const bot = p.kneel ? 47 : p.sit ? 47 : 45, hem = p.hem || 0, shL = 10, shR = 22, hmL = p.kneel ? 3 : p.sit ? 6 : 8 - hem, hmR = p.kneel ? 29 : p.sit ? 26 : 24 + hem;
  P.poly([[shL, top], [shR, top], [hmR, bot], [hmL, bot]], (x, y) => {
    const u = (y - top) / (bot - top), l = hmL * u + shL * (1 - u), r = hmR * u + shR * (1 - u), s = (x - l) / (r - l);
    let v = .66 - s * .42 + (1 - u) * .12; if ((x + (y >> 2)) % 5 === 0 && u > .3) v -= .16; if (s < .1) v += .1;
    return C.cloak(v, x, y);
  });
  // the front opening shows the dark dress; a little brass clasp
  if (!p.kneel && !p.sit) for (let y = top + 3; y < bot - 3; y++) P.set(20, y, C.dress(.6 - (y > top + 14 ? .2 : 0), 20, y));
  P.rect(11, top - 1, 11, 2, C.cloak(.85, 0, 0)); P.set(16, top + 1, hex('#c9a24a'));
  // head: a little forward and down (stooped)
  const hx = 16 + (p.kneel ? 1 : 0), hy = 12 + by + (p.sit ? 1 : 0) - (p.look ? 1 : 0), fx = hx + 2, fy = hy + 1;
  P.ellipse(fx, fy, 4.8, 5.2, (x, y, dx, dy) => C.skin(.6 - dx * .1 - dy * .28 + (dx > .55 ? -.2 : 0), x, y));
  // white hair swept back into a bun
  for (let x = Math.floor(fx - 5); x <= fx + 3; x++) for (let y = Math.floor(fy - 5.5); y < fy - 2.5 + (x < fx - 2 ? 4 : 0); y++) P.set(x, y, C.hairW(.62 + (x - fx) * .04 - (y - fy) * .03, x, y));
  P.ellipse(fx - 5, fy - 4.5, 2.6, 2.4, (x, y, dx, dy) => C.hairW(.75 - dy * .3 - dx * .1, x, y));
  // eyes: open / blink / closed (sleep); round spectacles glint
  const ey = Math.round(fy);
  if (p.closed) { P.set(Math.round(fx + 2), ey, INK); P.set(Math.round(fx + 1), ey, INK); P.set(Math.round(fx - 1), ey, INK); }
  else if (p.blink) { P.set(Math.round(fx + 2), ey, C.skin(.2, 0, 0)); P.set(Math.round(fx - 1), ey, C.skin(.2, 0, 0)); }
  else { P.set(Math.round(fx + 2), ey, INK); P.set(Math.round(fx - 1), ey, INK); P.set(Math.round(fx + 2), ey - 1, hex('#e8f0ff')); }
  P.set(Math.round(fx + 1), ey - 2, C.hairW(.95, 0, 0)); P.set(Math.round(fx + 2), ey - 2, C.hairW(.95, 0, 0));   // brows
  P.set(Math.round(fx + 4), ey + 1, C.skin(.35, 0, 0)); P.set(Math.round(fx + 1), ey + 3, C.skin(.3, 0, 0)); P.set(Math.round(fx + 2), ey + 3, C.skin(.3, 0, 0));
  // arms + lantern
  const arm = p.arm || 'low', lit = p.lit ?? 1, moths = p.moths || 0;
  const sleeve = pts => pts.forEach(([x, y]) => { P.set(x, y, C.cloak(.55, x, y)); P.set(x, y + 1, C.cloak(.3, x, y)); });
  if (arm === 'low') { sleeve([[21, top + 2], [22, top + 3], [23, top + 4], [23, top + 5], [23, top + 6], [23, top + 7]]); P.rect(23, top + 8, 2, 2, C.skin(.55, 0, 0)); lantern(P, E, 22, top + 11, lit, moths); }
  if (arm === 'up') { sleeve([[21, top + 1], [22, top], [23, top - 2], [24, top - 4], [24, top - 6], [25, top - 8]]); P.rect(25, top - 10, 2, 2, C.skin(.55, 0, 0)); lantern(P, E, 24, top - 6, lit, moths); }
  if (arm === 'fwd') { sleeve([[21, top + 2], [22, top + 3], [23, top + 3], [24, top + 4], [25, top + 5], [26, top + 5]]); P.rect(27, top + 5, 2, 2, C.skin(.55, 0, 0)); lantern(P, E, 26, top + 8, lit, moths); }
  if (arm === 'kneel') { lantern(P, E, 25, top + 8, lit, moths); P.rect(24, top + 6, 2, 2, C.skin(.5, 0, 0)); sleeve([[21, top + 2], [22, top + 3], [23, top + 4], [23, top + 5]]); }
  if (arm === 'rest') { P.rect(18, top + 12, 4, 2, C.skin(.45, 0, 0)); }   // hands folded in the lap (asleep)
}

// —— 하루 —— p: {arm:'side'|'point'|'reach'|'hold', lit, moths, blink, look, step}
function drawHaru(P, E, p) {
  const dn = (p.crouch ? 5 : 0) + (p.sit ? 6 : 0), by = (p.bob || 0) + 8 + dn, top = 22 + by, sb = 39 + dn;      // a child: shorter (about 1.4 m); crouching / sitting sinks the body
  // bare feet + pyjama trousers (sitting on a step: the legs reach forward)
  if (p.sit) { P.rect(19, sb, 9, 3, C.pj(.5, 0, 0)); P.rect(19, sb, 9, 1, C.pj(.7, 0, 0)); P.rect(28, sb, 2, 3, C.skin(.45, 0, 0)); }
  else { const st = p.step ?? -1, legs = st < 0 ? [[13, 0], [17, 0]] : [[[12, 0], [18, -1]], [[14, -1], [16, 0]], [[18, -1], [12, 0]], [[16, 0], [14, -1]]][st];
    legs.forEach(([lx, ly]) => { for (let y = sb - 1; y < 47 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.pj(.55 - (x === lx ? .2 : 0) + ((y >> 1) % 3 === 0 ? -.15 : 0), x, y)); P.rect(lx, 47 + ly, 4, 1, C.skin(.45, 0, 0)); }); }
  // shirt with soft stripes
  P.poly([[11, top], [21, top], [22, sb], [10, sb]], (x, y) => { const s = (x - 10) / 12; let v = .7 - s * .35; if (y % 4 === 0) return C.pjStripe(.6 - s * .3, x, y); return C.pj(v, x, y); });
  P.rect(15, top + 1, 2, 1, C.pj(.95, 0, 0));
  // head: a bit big for the body (child), messy dark hair
  const hx = 16, hy = top - 7 - (p.look ? 1 : 0), fx = hx + 2, fy = hy + 1;
  P.ellipse(fx, fy, 5, 5.4, (x, y, dx, dy) => C.skin(.62 - dx * .1 - dy * .26 + (dx > .55 ? -.2 : 0), x, y));
  for (let x = Math.floor(fx - 5); x <= fx + 4; x++) { const d = 3 + ((x * 5) % 3 === 0 ? 1 : 0); for (let y = Math.floor(fy - 6); y < fy - 5 + d; y++) P.set(x, y, C.hairD(.55 + (x - fx) * .04, x, y)); }
  for (let y = Math.floor(fy - 3); y < fy + 3; y++) { P.set(Math.floor(fx - 5), y, C.hairD(.4, 0, y)); P.set(Math.floor(fx - 4), y, C.hairD(.5, 0, y)); }
  const ey = Math.round(fy);
  if (p.closed) { P.set(Math.round(fx + 2), ey, INK); P.set(Math.round(fx + 1), ey, INK); P.set(Math.round(fx - 1), ey, INK); P.set(Math.round(fx - 2), ey, INK); }
  else if (p.blink) { P.set(Math.round(fx + 2), ey, C.skin(.2, 0, 0)); P.set(Math.round(fx - 1), ey, C.skin(.2, 0, 0)); }
  else { P.set(Math.round(fx + 2), ey, INK); P.set(Math.round(fx + 2), ey - 1, INK); P.set(Math.round(fx - 1), ey, INK); P.set(Math.round(fx - 1), ey - 1, INK); }
  P.set(Math.round(fx + 3), ey + 2, hex('#e8907a')); P.set(Math.round(fx - 2), ey + 2, hex('#e8907a'));
  const arm = p.arm || 'side';
  const sl = pts => pts.forEach(([x, y]) => { P.set(x, y, C.pj(.65, x, y)); P.set(x, y + 1, C.pj(.4, x, y)); });
  if (arm === 'side') { sl([[20, top + 2], [21, top + 4], [21, top + 6], [21, top + 8]]); P.rect(21, top + 10, 2, 2, C.skin(.55, 0, 0)); }
  if (arm === 'point') { sl([[20, top + 1], [21, top], [22, top - 2], [23, top - 4]]); P.rect(23, top - 6, 2, 2, C.skin(.6, 0, 0)); }
  if (arm === 'reach') { sl([[20, top + 2], [22, top + 3], [24, top + 4], [26, top + 4]]); P.rect(27, top + 4, 2, 2, C.skin(.6, 0, 0)); }
  const lk = [p.lit ?? 1, p.moths || 0, p.fill || 0, p.crk || 0];
  if (arm === 'hold') { sl([[20, top + 2], [21, top + 4], [22, top + 5]]); P.rect(21, top + 6, 3, 2, C.skin(.55, 0, 0)); lantern(P, E, 20, top + 8, ...lk); }
  if (arm === 'hup') { sl([[20, top + 1], [21, top - 1], [22, top - 3]]); P.rect(22, top - 5, 2, 2, C.skin(.6, 0, 0)); lantern(P, E, 21, top - 4, ...lk); }
  if (arm === 'hfwd') { sl([[20, top + 2], [22, top + 3], [24, top + 4]]); P.rect(25, top + 4, 2, 2, C.skin(.6, 0, 0)); lantern(P, E, 24, top + 6, ...lk); }
  if (arm === 'palm') { sl([[20, top + 2], [21, top + 3], [22, top + 3]]); P.rect(23, top + 3, 3, 1, C.skin(.62, 0, 0)); P.set(25, top + 2, C.skin(.5, 0, 0)); lantern(P, E, 26, 41, ...lk); }
  if (arm === 'lap') { sl([[20, top + 2], [20, top + 4]]); P.rect(17, top + 5, 4, 2, C.skin(.5, 0, 0)); lantern(P, E, 17, top + 5, ...lk); }
}

const NOEUL = {
  idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, blink: { arm: 'low', blink: 1 },
  nw0: { step: 0, arm: 'none', hem: 1 }, nw1: { step: 1, arm: 'none', bob: -1 }, nw2: { step: 2, arm: 'none', hem: -1 }, nw3: { step: 3, arm: 'none', bob: -1 }, nidle: { arm: 'none' },
  w0: { step: 0, arm: 'low', hem: 1 }, w1: { step: 1, arm: 'low', bob: -1 }, w2: { step: 2, arm: 'low', hem: -1 }, w3: { step: 3, arm: 'low', bob: -1 },
  up: { arm: 'up' }, up1: { arm: 'up', bob: 1 }, fwd: { arm: 'fwd' }, look: { arm: 'low', look: 1 },
  kneel: { kneel: 1, arm: 'kneel' }, kneelShut: { kneel: 1, arm: 'kneel', closed: 1 },
  empty: { arm: 'none' }, kneelEmpty: { kneel: 1, arm: 'none' }, sleep: { sit: 1, arm: 'rest', closed: 1 }, sitWake: { sit: 1, arm: 'rest' },
};
const HARU = {
  hw0: { step: 0, arm: 'hold' }, hw1: { step: 1, arm: 'hold', bob: -1 }, hw2: { step: 2, arm: 'hold' }, hw3: { step: 3, arm: 'hold', bob: -1 },
  hup: { arm: 'hup' }, hup1: { arm: 'hup', bob: 1 }, hfwd: { arm: 'hfwd' }, hfwdB: { arm: 'hfwd', blink: 1 },
  crouch: { crouch: 1, arm: 'palm', look: 1 }, crouch1: { crouch: 1, arm: 'palm', look: 1, bob: 1 },
  lap: { sit: 1, arm: 'lap', closed: 1 }, lap1: { sit: 1, arm: 'lap', closed: 1, bob: 1 },
  idle0: { arm: 'side' }, idle1: { arm: 'side', bob: 1 }, blink: { arm: 'side', blink: 1 }, point: { arm: 'point', look: 1 },
  reach: { arm: 'reach' }, hold: { arm: 'hold' }, hold1: { arm: 'hold', bob: 1 },
  w0: { step: 0, arm: 'side' }, w1: { step: 1, arm: 'side', bob: -1 }, w2: { step: 2, arm: 'side' }, w3: { step: 3, arm: 'side', bob: -1 },
};
// lantern frames that depend on a level: <name>@<lit>@<moths> are generated on demand (levels quantised so the atlas stays small)
const LEVELS = [1, .82, .64, .46, .3, .14, .05];

function atlas(table, draw) {
  const names = Object.keys(table), n = names.length, P = new PX(FW * n, FH), E = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH), e1 = new PX(FW, FH); draw(p1, e1, table[k]); p1.outline(.3);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c); const e = e1.get(x, y); if (e) E.set(i * FW + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done()); for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return { tex, em, names, n };
}
function expand(base, keys) {   // add every lantern level for the poses that carry the lantern
  const out = { ...base };
  for (const k of keys) for (const L of LEVELS) for (const m of [0, 1]) out[`${k}@${L}@${m}`] = { ...base[k], lit: L, moths: m };
  return out;
}
const FILLS = [0, .25, .5, .75, 1];
function expandFill(base, keys) {   // 2편: the boy's lantern by how full of moths it is, and whether its glass has cracked
  const out = { ...base };
  for (const k of keys) for (const F of FILLS) for (const c of [0, 1]) out[`${k}@${F}@${c}`] = { ...base[k], lit: 1, fill: F, crk: c, moths: F > .1 ? 1 : 0 };
  return out;
}

export function makeChar(kind) {
  const TB = kind === 'noeul' ? expand(NOEUL, ['idle0', 'idle1', 'w0', 'w1', 'w2', 'w3', 'up', 'up1', 'fwd', 'look'])
    : expandFill(HARU, ['hold', 'hold1', 'hw0', 'hw1', 'hw2', 'hw3', 'hup', 'hup1', 'hfwd', 'hfwdB', 'crouch', 'crouch1', 'lap', 'lap1']);
  const A = atlas(TB, kind === 'noeul' ? drawNoeul : drawHaru);
  const mesh = billboard(A.tex, FW * SPX, FH * SPX, { em: A.em, emCol: '#ffffff', emI: 2.2 });
  // a light held at the sprite must not burn it out (the style's pitfall): cap the lit colour
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.35 + totalEmissiveRadiance);\n#include <opaque_fragment>'); };
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  const sh = blob(.36, .55); sh.position.y = .015; root.add(sh);
  // the lantern's centre (sprite pixels) per arm; the boy's from his own drawing (top = 30, +5 crouching, +6 sitting)
  const lanternOf = kind === 'noeul' ? { low: [24.5, 32], up: [26.5, 16], fwd: [28.5, 29], kneel: [27.5, 45] }
    : { hold: [22, 41], hup: [23, 29], hfwd: [26, 39], palm: [28, 44], lap: [19, 44] };
  const SET = kind === 'noeul' ? LEVELS : FILLS;
  const q = v => SET.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
  return {
    root, mesh, table: TB,
    // name, or name + lantern level: frame('w1', .6, 1)
    frame(name, lit, moths) { const key = lit == null ? name : `${name}@${q(lit)}@${moths ? 1 : 0}`; const i = A.names.indexOf(key in TB ? key : name); if (i < 0) throw new Error('frame ' + key); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
    lanternPos(name, flip = false) {
      const p = TB[name] || {}, k = lanternOf[p.arm] || lanternOf.low || lanternOf.hold, by = (p.bob || 0);
      const v = new THREE.Vector3((k[0] - FW / 2) * SPX * (flip ? -1 : 1), (FH - k[1] - by - (p.kneel ? 0 : 0)) * SPX, .08);
      v.applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y); return v.add(root.position);
    },
    // 2편: where the boy's open palm is (the moth lands there)
    palmPos(flip = false) { const v = new THREE.Vector3((24.5 - FW / 2) * SPX * (flip ? -1 : 1), (FH - 36.5) * SPX, .1); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y); return v.add(root.position); },
  };
}

// —— moths: a 2-frame atlas for point sprites (small), and the big moth as a lit billboard ——
export function mothAtlas() {
  const P = new PX(32, 16);
  for (const f of [0, 1]) {
    const ox = f * 16, wy = f ? 2 : 0;
    // wings: two pairs, violet with pale spots; frame 1 = wings folded up
    P.ellipse(ox + 5, 7 - wy, 4.2, f ? 2.4 : 3.6, (x, y, dx, dy) => C.violet(.55 + dy * .2 - Math.abs(dx) * .2, x, y));
    P.ellipse(ox + 11, 7 - wy, 4.2, f ? 2.4 : 3.6, (x, y, dx, dy) => C.violet(.55 + dy * .2 - Math.abs(dx) * .2, x, y));
    P.ellipse(ox + 5.5, 10, 2.6, 2, (x, y) => C.violet(.4, x, y)); P.ellipse(ox + 10.5, 10, 2.6, 2, (x, y) => C.violet(.4, x, y));
    P.set(ox + 4, 6 - wy, C.violet(.98, 0, 0)); P.set(ox + 12, 6 - wy, C.violet(.98, 0, 0));
    for (let y = 5; y < 12; y++) P.set(ox + 8, y, C.violet(.15, 0, 0)), P.set(ox + 7, y, C.violet(.25, 0, 0));
    P.set(ox + 6, 4, C.violet(.2, 0, 0)); P.set(ox + 9, 4, C.violet(.2, 0, 0));
  }
  const t = texOf(P.done()); return t;
}
// a point-sprite swarm: fn(i, t, o) sets o.x,y,z, o.a (alpha), o.s (size, m), o.f (flap phase)
export function moths(n, fn) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), a = new Float32Array(n), sz = new Float32Array(n), fr = new Float32Array(n);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('a', new THREE.BufferAttribute(a, 1)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1)); g.setAttribute('fr', new THREE.BufferAttribute(fr, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: mothAtlas() }, glow: { value: 1.6 } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float a, sz, fr; varying float vA, vF; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; gl_PointSize = sz * 1080. * projectionMatrix[1][1] * .5 / -mv.z; vA = a; vF = fr; }`,
    fragmentShader: `uniform sampler2D map; uniform float glow; varying float vA, vF; void main(){ vec2 uv = gl_PointCoord; uv.y = 1. - uv.y; uv.x = (floor(uv.x * 16.) + .5) / 32. + step(.5, vF) * .5; uv.y = (floor(uv.y * 16.) + .5) / 16.;
      vec4 c = texture2D(map, uv); if (c.a < .5) discard; gl_FragColor = vec4(c.rgb * glow, vA); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 4;
  const o = { x: 0, y: 0, z: 0, a: 1, s: .3, f: 0 };
  p.userData.update = t => { for (let i = 0; i < n; i++) { o.a = 1; o.s = .3; o.f = 0; fn(i, t, o); pos[i * 3] = o.x; pos[i * 3 + 1] = o.y; pos[i * 3 + 2] = o.z; a[i] = o.a; sz[i] = o.s; fr[i] = o.f; }
    for (const k of ['position', 'a', 'sz', 'fr']) g.attributes[k].needsUpdate = true; };
  return p;
}
// the big moth on the cottage roof: 72×48 px, two frames (wings open / half), teal eyespots — the keeper's colour
export function bigMoth() {
  const W = 72, H = 48, P = new PX(W * 2, H), E = new PX(W * 2, H);
  for (const f of [0, 1]) {
    const ox = f * W, sp = f ? .82 : 1;
    for (const s of [-1, 1]) {
      const cx = ox + W / 2 + s * 15 * sp, cy = 20;
      P.ellipse(cx, cy, 16 * sp, 15, (x, y, dx, dy) => { const vein = Math.abs(((Math.atan2(dy, dx * s) + 3) * 3) % 1 - .5) < .07; const v = .5 + dy * .15 - Math.hypot(dx, dy) * .25; if (vein) { const c = C.violet(.85, x, y); E.set(x, y, c); return c; } return C.violet(v, x, y); });
      P.ellipse(ox + W / 2 + s * 11 * sp, 36, 10 * sp, 9, (x, y, dx, dy) => C.violet(.42 - Math.hypot(dx, dy) * .2, x, y));
      // eyespot: teal ring with a pale centre (her cloak's teal)
      P.ellipse(cx + s * 3, cy - 1, 4.5, 4.5, (x, y, dx, dy) => { const r = Math.hypot(dx, dy), c = r > .62 ? C.cloak(.85, x, y) : r > .3 ? C.cloak(.55, x, y) : hex('#e8fff8'); E.set(x, y, c); return c; });
    }
    for (let y = 8; y < 42; y++) for (let x = ox + W / 2 - 2; x < ox + W / 2 + 2; x++) P.set(x, y, C.violet(.18 + (y % 3 === 0 ? .1 : 0), x, y));
    P.line(ox + W / 2 - 1, 8, ox + W / 2 - 7, 1, C.violet(.3, 0, 0)); P.line(ox + W / 2 + 1, 8, ox + W / 2 + 7, 1, C.violet(.3, 0, 0));
  }
  P.outline(.35, [16, 8, 24]);
  const tex = texOf(P.done()), em = texOf(E.done()); for (const t of [tex, em]) t.repeat.set(.5, 1);
  const mesh = billboard(tex, W * SPX * 1.6, H * SPX * 1.6, { em, emCol: '#ffffff', emI: 1.8, ay: .5 });
  return { mesh, frame(i) { tex.offset.x = em.offset.x = i ? .5 : 0; } };
}
export { FW, FH, NOEUL, HARU };
