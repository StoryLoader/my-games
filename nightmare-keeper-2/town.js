// The town set of 「악몽을 지키는 파수꾼 2」: the same diorama as the first film (the tower on its mound, three rows of
// half-timbered houses on a cobbled street, the cottage at the east edge). Every house has its own window material, so
// each window can be amber (asleep), or gold-green (its nightmare came home as a firefly: a good dream).
// Characters: 하루 with the keeper's lantern, 노을 at dawn; the moths; the fireflies.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, ground, billboard, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, ridge } from './kit.js';
import { sky, stars, particles, beamCard, flick } from './fx.js';
import { makeChar, moths, SPX } from './chars.js';
import { T, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const FS = window.FILM_SIZE || [innerWidth, innerHeight], PORT = FS[1] > FS[0], FOVK = PORT ? 1.65 : 1;   // the vertical cut: a taller lens; the map shots turn so the town's long axis runs down the frame
const AMBER = new THREE.Color('#ffae55'), VIOLET = new THREE.Color('#b46cff'), DREAM = new THREE.Color('#c9ff8a'), FIRE = new THREE.Color('#d8ff7a'), DAWN_SKY = new THREE.Color('#e0a07a');
const eio = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

// a window pane whose hue comes from the emissive colour (map: dark frame + dim glass; emissive map: the panes)
let _winTex = null;
function winTex() {
  if (_winTex) return _winTex;
  const P = new PX(12, 16), E = new PX(12, 16), F = ramp(['#1a0f0b', '#33200f', '#4d3219']), G = ramp(['#1c1c2a', '#2a2a3c', '#3a3a50']), L = ramp(['#5a5a5a', '#9a9a9a', '#d8d8d8', '#ffffff']);
  P.fill((x, y) => { const fr = x === 0 || x === 11 || y === 0 || y === 15 || x === 5 || x === 6 || y === 7; if (fr) return F(y === 0 || x === 0 ? .9 : .4, x, y); const v = .55 + (1 - y / 16) * .25 + (h2(x, y, 3) - .5) * .25 - (x > 6 && y > 8 ? .25 : 0); E.set(x, y, L(v, x, y)); return G(v, x, y); });
  _winTex = [texOf(P.done()), texOf(E.done())]; return _winTex;
}
function winMat() { const [m, e] = winTex(); return new THREE.MeshStandardMaterial({ map: m, emissiveMap: e, emissive: new THREE.Color(AMBER), emissiveIntensity: 2.2, roughness: .6 }); }

// a small pixel pine (billboard)
function pine(seed, hM = 4) {
  const W = 28, H = 48, P = new PX(W, H), G = ramp(['#06100e', '#0d1e19', '#163027', '#224536'], .3), B = ramp(['#140d0a', '#2a1b12'], .3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / H, tier = (y % 12) / 12, half = (2 + v * 11 + tier * 3) * (y > 6 ? 1 : .6);
    if (y > H - 7) { if (Math.abs(x - W / 2) < 2) P.set(x, y, B(.5, x, y)); continue; }
    if (Math.abs(x - W / 2 + (fbm(y * .3, 0, seed) - .5) * 2) < half) P.set(x, y, G(.35 + (x - W / 2) / W * -.6 + (1 - tier) * .2 + (h2(x, y, seed) - .5) * .25, x, y));
  }
  P.outline(.25);
  return billboard(texOf(P.done()), W / H * hM, hM, { shadow: true });
}

export function buildTown() {
  const scene = new THREE.Scene(), MM = mats(), R = mulberry(7);
  scene.fog = new THREE.FogExp2('#141c34', .016);
  const SK = sky({ moonDir: new THREE.Vector3(.35, .32, -1), top: '#050818', mid: '#101d3e', hor: '#2c3a5e' }); scene.add(SK.mesh);
  const ST = stars(900, 11); scene.add(ST);

  // —— lights ——
  const moon = new THREE.DirectionalLight('#8fa8e0', 1.0); moon.position.set(25, 45, -40); moon.target.position.set(0, 0, -4);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -45, right: 45, top: 40, bottom: -40, near: 1, far: 160 }); moon.shadow.bias = -.0006; moon.shadow.normalBias = .02;
  scene.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight('#3a4c7a', '#0a0a12', .9); scene.add(hemi);

  // —— ground, streets ——
  const grass = mat(ground(96, 96, { seed: 21, grass: ['#0b1512', '#132219', '#1d3322', '#2a4730', '#3b5e3c'], dirt: ['#17120f', '#2a2119', '#3f3123', '#56442f'], mask: (u, v) => .62 + .3 * Math.sin(u * 9) * Math.sin(v * 7) }));
  scene.add(mesh(new THREE.BoxGeometry(76, .4, 52).translate(1, -.2, -6), grass));
  const cob = mat(cobbles(96, 96, { seed: 4 }));
  const street = (x0, x1, z0, z1) => scene.add(mesh(new THREE.BoxGeometry(x1 - x0, .08, z1 - z0).translate((x0 + x1) / 2, .04, (z0 + z1) / 2), cob));
  street(-24, 31, -.2, 4.2); street(-9.5, -6.5, -17, -.2); street(5, 8, -17, -.2); street(-24, -18.5, -6, -.2);
  // the edge of the diorama (it is a model): a dark plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(77, 3, 53).translate(1, -1.9, -6), new THREE.MeshStandardMaterial({ color: '#0c0a10', roughness: 1 })); scene.add(plinth);

  // —— houses (group = which alley's moths they belong to) ——
  const H = [];
  const pools = [];
  const add = (o, grp) => { const hh = house(o); scene.add(hh); const m = winMat(); hh.userData.windows.forEach(q => q.material = m);
    // windows on the back too (the map shots see every house from above), and a glow pool before each face: from above the town reads as lamp dots
    hh.userData.windows.slice().forEach(q => { if (Math.abs(q.rotation.y) > .1) return; const b = q.clone(); b.position.z = -q.position.z; b.rotation.y = Math.PI; hh.add(b); });
    const gs = []; for (const sgn of [1, -1]) { const gl = glow('#ffae55', 3.2, .9); gl.position.set(0, 1.6, sgn * (o.d / 2 + .9)); hh.add(gl); gs.push(gl); pools.push(gl); }
    H.push({ g: hh, m, gs, grp, x: o.x, z: o.z, ry: o.ry || 0, w: o.w, d: o.d, h: o.h }); return hh; };
  add({ x: -14, z: -5.5, w: 5.6, d: 4.6, h: 4.2, wall: 'wall', roof: 'roof', door: 1.3, windows: [[-1.5, 2]], upper: [[-1.2, 3.4], [1.3, 3.4]] }, 0);
  add({ x: -3, z: -5.8, w: 5.2, d: 4.4, h: 4.8, wall: 'wall3', roof: 'roof3', door: -1.2, windows: [[1.1, 2]], upper: [[-1.1, 3.8], [1.2, 3.8]] }, 0);
  add({ x: 2.4, z: -5.2, w: 4.2, d: 4, h: 3.6, wall: 'wall2', roof: 'roof', chimney: false, windows: [[-.8, 2], [.9, 2]] }, 1);
  add({ x: 11.6, z: -5.6, w: 5.6, d: 4.6, h: 4.4, wall: 'wall', roof: 'roof2', door: -1.4, windows: [[1.2, 2.1]], upper: [[-1.2, 3.6], [1.2, 3.6]] }, 1);
  add({ x: 17.6, z: -5.4, w: 4.6, d: 4.4, h: 4, wall: 'wall3', roof: 'roof', windows: [[-1, 2], [1, 2]] }, 2);
  add({ x: 22.8, z: -5.6, w: 4.4, d: 4.4, h: 4.6, wall: 'wall2', roof: 'roof3', door: 1, windows: [[-1, 2.2]], upper: [[0, 3.8]] }, 2);
  add({ x: -12.5, z: 9.4, w: 5.4, d: 4.4, h: 4.2, wall: 'wall3', roof: 'roof2', ry: Math.PI, windows: [[-1.3, 2], [1.3, 2]], upper: [[0, 3.5]] }, 0);
  add({ x: -3.5, z: 9.2, w: 5, d: 4.2, h: 3.8, wall: 'wall', roof: 'roof', ry: Math.PI, door: 1.2, windows: [[-1.2, 2]] }, 0);
  add({ x: 3.4, z: 9.6, w: 5.4, d: 4.6, h: 4.6, wall: 'wall2', roof: 'roof3', ry: Math.PI, windows: [[-1.3, 2.2], [1.3, 2.2]], upper: [[0, 3.8]] }, 1);
  add({ x: 12.4, z: 9.2, w: 5.2, d: 4.2, h: 4, wall: 'wall', roof: 'roof2', ry: Math.PI, door: -1, windows: [[1.2, 2]] }, 1);
  add({ x: 18.8, z: 9.6, w: 5, d: 4.6, h: 4.4, wall: 'wall3', roof: 'roof', ry: Math.PI, windows: [[-1.1, 2.1], [1.1, 2.1]] }, 2);
  add({ x: -1, z: -14, w: 6, d: 5, h: 5.6, wall: 'wall3', roof: 'roof2', windows: [[-1.5, 2.8], [1.5, 2.8]], upper: [[0, 4.5]] }, 0);
  add({ x: 11, z: -13.8, w: 5.4, d: 4.8, h: 5, wall: 'wall', roof: 'roof', windows: [[0, 2.6]], upper: [[-1.2, 4], [1.2, 4]] }, 1);
  add({ x: 17.5, z: -14.4, w: 5, d: 4.6, h: 4.4, wall: 'wall2', roof: 'roof3', windows: [[-1, 2.2], [1, 2.2]] }, 2);
  // —— the tower ——
  const stone = mat(rock(96, 96, { seed: 7, cols: ['#17161d', '#28272f', '#3a3843', '#4f4c57', '#67636d'] }));
  const mound = mesh(new THREE.CylinderGeometry(5.6, 6.6, 1.4, 20).translate(-22, .7, -10), stone); scene.add(mound);
  const steps = box(2.4, .5, 1.6, stone); steps.position.set(-22, 0, -3.7); scene.add(steps);
  const towerBody = mesh(new THREE.CylinderGeometry(2.1, 2.4, 10, 18).translate(-22, 6.4, -10), stone); scene.add(towerBody);
  const ring = mesh(new THREE.CylinderGeometry(2.5, 2.5, .4, 18).translate(-22, 11.4, -10), stone); scene.add(ring);
  const lroom = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.8, 18, 1, true).translate(-22, 12.5, -10), new THREE.MeshStandardMaterial({ color: '#1a1424', emissive: VIOLET, emissiveIntensity: 1.2, roughness: .4, side: THREE.DoubleSide }));
  scene.add(lroom);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = box(.16, 1.8, .16, MM.beam); p.position.set(-22 + Math.cos(a) * 1.92, 11.6, -10 + Math.sin(a) * 1.92); scene.add(p); }
  const roofC = mesh(new THREE.ConeGeometry(2.8, 2.6, 18).translate(-22, 14.7, -10), MM.roof2); scene.add(roofC);
  const door = box(1.1, 2.0, .14, MM.plankDark); door.position.set(-22, 1.4, -7.62); scene.add(door);
  const doorLamp = new THREE.PointLight('#ffb050', 5, 7, 2); doorLamp.position.set(-21.1, 3.6, -7.0); scene.add(doorLamp);
  const doorGlow = glow('#ffc070', .9, 1.1); doorGlow.position.set(-21.1, 3.5, -7.4); scene.add(doorGlow);
  const topLight = new THREE.PointLight(VIOLET, 18, 22, 2); topLight.position.set(-22, 12.6, -10); scene.add(topLight);
  const topGlow = glow('#c890ff', 6, 1.2); topGlow.position.set(-22, 12.6, -10); topGlow.material.depthTest = false; topGlow.renderOrder = 5; scene.add(topGlow);

  // —— the cottage at the east edge ——
  const cottage = house({ x: 29.2, z: -3.4, w: 4.4, d: 4, h: 3.1, wall: 'wall3', roof: 'roof3', door: 1, windows: [[-1, 1.7]], rh: 1.9 }); scene.add(cottage);
  const cm = winMat(); cottage.userData.windows.forEach(q => q.material = cm);
  const cotLight = new THREE.PointLight(AMBER, 5, 8, 2); cotLight.position.set(28.2, 1.8, -.6); scene.add(cotLight);
  const fence = new THREE.Group(); for (let i = 0; i < 9; i++) { const p = box(.12, .8, .12, MM.beam); p.position.set(25.2 + i * .9, 0, 1.7); fence.add(p); } const rail = box(7.4, .1, .1, MM.beam); rail.position.set(28.8, .55, 1.7); fence.add(rail); scene.add(fence);

  // —— trees, background ridges ——
  [[-30, -20], [-27, -2], [-31, 6], [-6, -22], [4, -21], [24, -16], [30, -12], [33, 4], [27, 12], [-20, 14], [-28, 14], [8, 15], [33, -20], [-16, -21]].forEach(([x, z], i) => { const p = pine(i + 3, 3.4 + R() * 2.2); p.position.set(x, 0, z); scene.add(p); p.userData.pine = 1; });
  for (const [x, z, w, h, c, s] of [[0, -58, 160, 22, '#0b1226', 3], [-30, -72, 140, 30, '#0a0f20', 8], [40, -70, 140, 26, '#0a0f20', 5]]) { const r = ridge(w, h, c, s); r.position.set(x, -2, z); scene.add(r); }

  // —— characters ——
  const N = makeChar('noeul'), Hr = makeChar('haru'); scene.add(N.root, Hr.root);
  const lamp = new THREE.PointLight('#ffb050', 6, 11, 2); lamp.castShadow = true; lamp.shadow.bias = -.004; lamp.shadow.mapSize.set(512, 512); scene.add(lamp);
  const halo = glow('#ffc070', 1.1, 1.2); scene.add(halo);
  const fillL = new THREE.PointLight('#9fb2e8', 1.5, 7, 2); scene.add(fillL);


  // —— the night's plan ——
  // the boy's spot when he opens the lantern; the house the first firefly goes home to; the order the rest go home in
  const SPOT = new THREE.Vector3(.6, 0, 2.2), HOME = 2;
  H.forEach(h => { const q = h.g.userData.windows[0]; h.g.updateMatrixWorld(true); h.win = q.getWorldPosition(new THREE.Vector3()); });
  const order = H.map((h, i) => [i, Math.hypot(h.x - SPOT.x, h.z - SPOT.z)]).filter(([i]) => i !== HOME).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  H.forEach((h, i) => { h.goldAt = i === HOME ? T.homeArrive : T.releaseStart + 1.7 + order.indexOf(i) * T.releaseStep; });
  const COT_WIN = (() => { const q = cottage.userData.windows[0]; cottage.updateMatrixWorld(true); return q.getWorldPosition(new THREE.Vector3()); })();
  const cotGoldAt = T.releaseStart + 1.7 + order.length * T.releaseStep + .4;

  // —— window lights per alley (not shadow-casting): amber → gold as the dreams come home ——
  const GL = [[-8, 2.6, 2], [6, 2.6, 2], [18, 2.6, 2]].map(([x, y, z]) => { const L = new THREE.PointLight(AMBER, 7, 12, 2); L.position.set(x, y, z); scene.add(L); return L; });
  // the first firefly's light: a new light near the ground — the shadows jump when it is lit (the style's native move)
  const ffLight = new THREE.PointLight(FIRE, 0, 9, 2); ffLight.castShadow = true; ffLight.shadow.bias = -.004; ffLight.shadow.mapSize.set(512, 512); scene.add(ffLight);
  const ffGlow = glow('#e4ff9a', 1.4, 1.2); scene.add(ffGlow);

  // —— where things are this frame (set in update before the swarms) ——
  const lampAt = new THREE.Vector3(), palmAt = new THREE.Vector3(), ffPos = new THREE.Vector3();
  const fillAt = t => {                    // how full the lantern is (the meter of this film: it fills)
    if (t < T.collect[0] + 1.2) return 0;
    if (t < T.full) return T.fillSteps[T.collect.filter(c => t >= c + 1.2).length];
    if (t < T.openDoor) return 1;
    return 1 - ss(seg(t, T.openDoor, T.openDoor + 2.2));
  };
  const curl = (i, u, a, b, k = 1) => {   // a curving flight a → b, u 0..1
    const s = ss(u), wob = Math.sin(u * Math.PI) * (1.2 + (i % 5) * .3) * k, ph = i * 2.39;
    return [lerp(a.x, b.x, s) + Math.cos(ph + u * 7) * wob, lerp(a.y, b.y, s) + Math.sin(u * Math.PI) * 1.4 * k + Math.sin(ph + u * 9) * wob * .4, lerp(a.z, b.z, s) + Math.sin(ph + u * 7) * wob];
  };
  // the first firefly: on the palm from the transform, lifts off, flies home to its window, stays there glowing
  const ffAt = (t, out) => {
    if (t < T.flyOff) return out.copy(palmAt).add(new THREE.Vector3(0, .05 + .03 * Math.sin(t * 3), 0));
    const u = seg(t, T.flyOff, T.homeArrive), p = curl(3, u, palmAt.clone().add(new THREE.Vector3(0, .1, 0)), H[HOME].win.clone().add(new THREE.Vector3(0, 0, .5)), .5);
    out.set(p[0], p[1], p[2]); if (t > T.homeArrive) out.set(H[HOME].win.x + Math.sin(t * 1.3) * .25, H[HOME].win.y + .2 + Math.sin(t * 2) * .12, H[HOME].win.z + .5);
    return out;
  };

  // —— moths (violet): the round, the full lantern, the one that escapes ——
  const PATROL_SRC = [H[0], H[6], H[1]];
  const MS = moths(80, (i, t, o) => {
    o.a = 0; o.f = Math.floor(t * 9 + i * .37) % 2;
    // 1) the round: moths leave windows and swirl into his lantern
    if (i < 36) { const k = Math.floor(i / 12), t0 = T.collect[k] - 1.0 + (i % 12) * .09, u = seg(t, t0, t0 + 1.5);
      if (t > t0 && u < 1 && t < T.full) { const p = curl(i, u, PATROL_SRC[k].win, lampAt, .6); o.x = p[0]; o.y = p[1]; o.z = p[2]; o.a = 1; o.s = .3; } return; }
    // 2) inside the full lantern: pressing at the glass, faster and faster until the door opens
    if (i < 60) { const j = i - 36, on = t > T.collect[0] + 1 && t < T.openDoor + .3 + j * .08 && j < 24 * fillAt(t) + 1;
      if (!on) return; const rate = 2 + 6 * ss(seg(t, T.rattle[0], T.crack)), ph = j * 2.1, r = .07 + .03 * Math.sin(t * rate + ph);
      let x = lampAt.x + Math.cos(t * rate * .7 + ph) * r, y = lampAt.y + Math.sin(t * rate + ph * 1.3) * r * 1.2, z = lampAt.z + .05 + Math.sin(t * rate * .9 + ph) * r * .6;
      if (t > T.openDoor) { const u = seg(t, T.openDoor + j * .08, T.openDoor + j * .08 + .9); y += u * 1.2; x += Math.cos(ph) * u * .6; o.a = 1 - u; }   // out of the open door: each turns into a firefly
      o.x = x; o.y = y; o.z = z; o.a = (t > T.openDoor ? o.a : 1); o.s = .12; o.f = Math.floor(t * 14 + j) % 2; return; }
    // 3) the one that slips out through the crack and lands on his palm
    if (i === 60) { if (t < T.escape || t > T.transform + .7) return;
      const u = seg(t, T.escape, T.land), from = lampAt.clone().add(new THREE.Vector3(.05, .12, .04));
      const p = curl(5, u, from, palmAt.clone().add(new THREE.Vector3(0, .07, .02)), .35); o.x = p[0]; o.y = p[1]; o.z = p[2];
      o.s = .22; o.a = 1 - ss(seg(t, T.transform, T.transform + .7)); o.f = t > T.land ? (T.heart.some(h => t > h && t < h + .3) ? 1 : 0) : Math.floor(t * 8) % 2; }
  });
  scene.add(MS);

  // —— fireflies (soft additive glows): the first one; the release; the ones that stay by the windows; the one on the lantern at dawn ——
  const NR = 14 * 6;
  const FF = particles(1 + NR + 6 + 40 + 1, (i, t, o) => {
    o.a = 0; o.r = .85; o.g = 1; o.b = .48; o.s = .22;
    const tw = .75 + .25 * Math.sin(t * (2.3 + (i % 7) * .4) + i);
    if (i === 0) { if (t < T.transform - .2 || t > 104) return; const p = ffPos; o.x = p.x; o.y = p.y; o.z = p.z; o.a = ss(seg(t, T.transform - .2, T.transform + .4)) * tw; o.s = .34; return; }
    const j = i - 1;
    // the release: out of the lantern, up and away to every window (each house gets six), arriving as the window turns gold
    if (j < NR + 6) { const isCot = j >= NR, h = isCot ? null : H[order[Math.floor(j / 6) % order.length]];
      const dst = isCot ? COT_WIN : h.win, arrive = isCot ? cotGoldAt : h.goldAt, t0 = T.openDoor + (j % 24) * .08, t1 = arrive;
      if (t < t0 || t > 104) return;
      const src = SPOT.clone().add(new THREE.Vector3(.25, 1.3, .1));
      if (t < t1) { const u = seg(t, t0, t1), up = Math.sin(u * Math.PI) * 4.5, p = curl(j, u, src, dst.clone().add(new THREE.Vector3(0, 0, .6)), 1.4); o.x = p[0]; o.y = p[1] + up; o.z = p[2]; }
      else { const ph = j * 1.7; o.x = dst.x + Math.sin(t * 1.1 + ph) * .8; o.y = dst.y + .3 + Math.sin(t * 1.7 + ph) * .4; o.z = dst.z + .7 + Math.cos(t * 1.3 + ph) * .5; }
      o.a = tw * ss(seg(t, t0, t0 + .5)) * (1 - ss(seg(t, 101, 104))); o.s = .26; return; }
    // a few hover in the street the whole second half (the town at peace)
    const k = j - NR - 6;
    if (k < 40) { if (t < T.releaseStart + 3) return; const R2 = h2(k, 1, 9), R3 = h2(k, 2, 9); o.x = -24 + R2 * 54 + Math.sin(t * .3 + k) * 1.2; o.y = .6 + h2(k, 3, 9) * 4 + Math.sin(t * .5 + k * 1.3) * .4; o.z = -12 + R3 * 22;
      o.a = tw * .9 * ss(seg(t, T.releaseStart + 3, T.releaseStart + 7)) * (t > T.dawn + 8 ? 1 - ss(seg(t, T.dawn + 8, T.dawn + 14)) : 1); o.s = .2; return; }
    // the one that rests on the empty lantern at dawn (the first film ended with a moth there)
    if (t < T.dawn) return; o.x = lampAt.x; o.y = lampAt.y + .2 + .02 * Math.sin(t * 2); o.z = lampAt.z + .04; o.a = tw; o.s = .3;
  }, { soft: 1 });
  scene.add(FF);
  const motes = particles(160, (i, t, o) => { const R2 = h2(i, 1, 4), R3 = h2(i, 2, 4); o.x = -30 + R2 * 62 + Math.sin(t * .2 + i) * 1; o.y = .5 + h2(i, 3, 4) * 7 + Math.sin(t * .4 + i * 1.3) * .3; o.z = -20 + R3 * 34; o.a = .25; o.s = .06; o.r = .7; o.g = .75; o.b = 1; }, { soft: 1 }); scene.add(motes);

  // —— shots: camera keys (shot-local time); the vertical cut uses these with a taller lens (FOVK) ——
  const CAM = {
    open: { p: track([[0, [-18.5, 3.5, -2.1]], [7.5, [-19.3, 3.0, -3.3]]]), l: track([[0, [-21.1, 2.25, -6.3]], [7.5, [-21.1, 2.2, -6.3]]]), fov: 30 },
    title: { p: track([[0, [-7, 16.5, 16]], [6.3, [-9, 14, 13.5]]]), l: track([[0, [-19, 6, -8]], [6.3, [-20, 5.5, -8]]]), fov: 32 },
    patrol: { fov: 30 },
    full: { p: track([[0, [1.7, 3.3, 6.0]], [8.5, [1.25, 2.5, 4.7]]]), l: track([[0, [.7, 1.05, 2.2]], [8.5, [.7, 1.0, 2.2]]]), fov: 30 },
    palm: { p: track([[0, [1.3, 2.5, 4.8]], [2.0, [1.5, 1.25, 4.25]], [12.5, [1.55, 1.15, 4.05]]]), l: track([[0, [.7, 1.0, 2.2]], [2.0, [.8, .7, 2.3]], [12.5, [.8, .7, 2.3]]]), fov: 30 },
    home: { p: track([[0, [1.5, 1.2, 3.9]], [3.2, [2.2, 2.6, 4.4]], [7.5, [3.6, 5.2, 4.6]]]), fov: 32 },
    resolve: { p: track([[0, [2.0, 2.9, 5.6]], [6, [1.7, 2.3, 4.6]]]), l: track([[0, [.75, 1.05, 2.2]], [6, [.75, 1.1, 2.2]]]), fov: 30 },
    release: { p: track([[0, [3, 64, -4.0]], [17.5, [3, 58, -4.0]]]), l: track([[0, [3.01, 0, -4]], [17.5, [3.01, 0, -4]]]), fov: 36 },
    dawn: { p: track([[0, [-19.0, 2.7, .9]], [16, [-20.0, 2.0, -.6]]]), l: track([[0, [-21.8, 1.05, -3.8]], [16, [-21.8, .95, -3.8]]]), fov: 30 },
  };
  const up = new THREE.Vector3();
  const walkH = (t, rate = 9) => ['hw0', 'hw1', 'hw2', 'hw3'][Math.floor(t * rate) % 4];
  const walkN = (t, rate = 7) => ['nw0', 'nw1', 'nw2', 'nw3'][Math.floor(t * rate) % 4];
  const BLINKS = [2.4, 5.9, 9.1, 26.8, 31.9, 36.2, 57.9, 64.2, 106.2, 110.7, 116.3];
  const blinking = t => BLINKS.some(b => t > b && t < b + .12);

  let focusObj = null, tiltW = .08;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id;
    const top3 = id === 'release' || id === 'title';
    const dawn = ss(seg(t, T.dawn, T.dawn + 9)), peace = ss(seg(t, T.releaseStart + 2, T.releaseStart + 12));
    scene.fog.color.set('#141c34').lerp(new THREE.Color('#18243a'), peace * .6).lerp(new THREE.Color('#6a5a6e'), dawn);
    scene.fog.density = lerp(.016, .011, dawn);
    SK.u.top.value.set('#050818').lerp(new THREE.Color('#2c3e6a'), dawn); SK.u.mid.value.set('#101d3e').lerp(new THREE.Color('#7a6a8c'), dawn); SK.u.hor.value.set('#2c3a5e').lerp(DAWN_SKY, dawn); SK.u.moonI.value = 1 - dawn;
    ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = 1 - dawn;
    moon.color.set('#8fa8e0').lerp(new THREE.Color('#ffc49a'), dawn); moon.intensity = lerp(1.7, 2.8, dawn);
    moon.position.set(lerp(25, 60, dawn), lerp(45, 16, dawn), lerp(-40, -6, dawn));
    hemi.color.set('#46598c').lerp(new THREE.Color('#c8b4cc'), dawn); hemi.intensity = lerp(2.0, 2.6, dawn);
    // —— windows: amber, then gold-green when their dream comes home ——
    H.forEach(h => {
      const g = ss(seg(t, h.goldAt, h.goldAt + .35)), pop = Math.exp(-Math.max(0, t - h.goldAt) / .25) * (t > h.goldAt ? 1 : 0);
      h.m.emissive.copy(AMBER).lerp(DREAM, g); h.m.emissiveIntensity = (2.2 + 1.6 * pop) * (1 - .55 * dawn);
      h.gs.forEach(gl => { gl.material.color.copy(AMBER).lerp(DREAM, g).multiplyScalar(.9 * (1 + pop) * (1 - dawn * .5)); gl.scale.setScalar(top3 ? 4.2 : 3.2); });
    });
    const cg = ss(seg(t, cotGoldAt, cotGoldAt + .35)); cm.emissive.copy(AMBER).lerp(DREAM, cg); cm.emissiveIntensity = 2.2 * (1 - .55 * dawn);
    GL.forEach((L, g) => { const hs = H.filter(h => h.grp === g), v = hs.reduce((a, h) => a + (t > h.goldAt ? 1 : 0), 0) / hs.length; L.color.copy(AMBER).lerp(DREAM, v); L.intensity = 7 * (1 - dawn * .7); });
    // the tower top: violet (the kept nightmares) → gold (released) while the shelf opens
    const tg = ss(seg(t, T.towerGold[0], T.towerGold[1])), tp = flick(t, 2);
    topLight.color.copy(VIOLET).lerp(new THREE.Color('#ffd27a'), tg); topLight.intensity = 16 * tp * (1 - dawn * .6);
    topGlow.material.color.set('#c890ff').lerp(new THREE.Color('#ffe09a'), tg); topGlow.material.opacity = 1 - dawn * .5;
    lroom.material.emissive.copy(VIOLET).lerp(new THREE.Color('#ffc86a'), tg); lroom.material.emissiveIntensity = 1.3 * tp * (1 - dawn * .5);
    doorLamp.intensity = 5 * flick(t, 5) * (1 - dawn); doorGlow.material.opacity = 1 - dawn;
    cotLight.intensity = 5 * (1 - dawn * .8);

    // —— characters by shot ——
    N.root.visible = false; Hr.root.visible = true;
    let hf = Math.floor(t * 1.3) % 2 ? 'hold1' : 'hold', hx = SPOT.x, hy = 0, hz = SPOT.z, hflip = false, fill = fillAt(t), crk = t >= T.crack ? 1 : 0;
    let nf = 'nidle', nx = -21.4, ny = 1.4, nz = -6.2;
    if (id === 'open' || id === 'title') { hx = -21.1; hz = -6.3; hy = 1.4; }
    if (id === 'patrol') { const w0 = T.patrolWalk[0], w1 = T.patrolWalk[1], u = seg(t, w0, w1); hx = lerp(-13, 0, u);
      const lift = T.collect.find(c => t > c - .9 && t < c + .9);
      if (lift != null) { hx = lerp(-13, 0, seg(lift - .9, w0, w1)); hf = Math.floor(t * 1.4) % 2 ? 'hup1' : 'hup'; } else if (t > w0 && t < w1) hf = walkH(t); }
    if (id === 'full' || id === 'resolve' || (id === 'palm' && t < T.crouch)) { hf = (blinking(t) ? 'hfwdB' : 'hfwd'); hx = SPOT.x; if (id === 'full' && t > T.rattle[0]) hx += Math.sin(t * 40) * .004 * ss(seg(t, T.rattle[0], T.crack)); }
    if (id === 'palm' && t >= T.crouch) hf = Math.floor(t * .9) % 2 ? 'crouch1' : 'crouch';
    if (id === 'home') hf = t < T.flyOff + 1.2 ? 'crouch' : 'hold';
    if (id === 'release') { hf = Math.floor(t * 1.2) % 2 ? 'hup1' : 'hup'; }
    if (id === 'dawn') { hx = -22.45; hy = .5; hz = -3.55; hf = Math.floor(t * .5) % 2 ? 'lap1' : 'lap';
      N.root.visible = t > T.noeulOut[0] - .2; const u = ss(seg(t, T.noeulOut[0], T.noeulOut[1]));
      nx = lerp(-21.3, -21.35, u); nz = lerp(-6.2, -3.75, u); ny = lerp(1.4, .5, ss(seg(t, T.noeulOut[0] + 1.2, T.noeulOut[1])));
      nf = t < T.noeulOut[0] ? 'nidle' : t < T.noeulOut[1] ? walkN(t) : t < T.sitBy ? 'nidle' : 'sitWake'; }
    Hr.root.position.set(hx, hy, hz); N.root.position.set(nx, ny, nz);

    // —— camera ——
    const C = CAM[id] || CAM.title; cam.fov = C.fov * FOVK; cam.updateProjectionMatrix();
    if (id === 'patrol') { const x = Hr.root.position.x; if (PORT) { cam.position.set(x + .5, 5.2, 7.4); cam.lookAt(x + .3, .6, 1.6); } else { cam.position.set(x + 1.6, 5.4, 7.6); cam.lookAt(x + 1.0, .9, 1.6); } }
    else if (id === 'home') { cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(ffAt(t, ffPos).clone().lerp(H[HOME].win, ss(seg(t, T.homeArrive - 1, T.homeArrive + .8)) * .5)); }
    else {
      const top = id === 'release' ? 1 : 0;
      cam.up.set(0, 1, 0).lerp(PORT ? up.set(-1, 0, 0) : up.set(0, 0, -1), top).normalize();
      cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    }
    if (id !== 'release') cam.up.set(0, 1, 0);
    Hr.face(cam, hflip); N.face(cam, false);
    const lampPose = !['idle0', 'idle1', 'blink'].includes(hf);
    Hr.frame(hf, lampPose ? fill : null, crk);
    N.frame(nf);
    // —— the lantern light: amber, tinted violet as it fills; flickers once cracked ——
    lampAt.copy(Hr.lanternPos(lampPose ? hf : 'hold', hflip)); palmAt.copy(Hr.palmPos(hflip));
    const toCam = cam.position.clone().sub(lampAt).setY(0).normalize();
    const crackFlick = t > T.crack && t < T.openDoor ? .75 + .25 * Math.sin(t * 23) * Math.sin(t * 7) : 1;
    const near = ['open', 'full', 'palm', 'resolve', 'dawn', 'home'].includes(id);   // close shots: the light must not burn the white night clothes out
    lamp.position.copy(lampAt).addScaledVector(toCam, near ? .7 : .45); lamp.intensity = (near ? 2.6 : 6) * flick(t, 3) * crackFlick * (1 - .25 * dawn);
    lamp.color.set('#ffb050').lerp(VIOLET, fill * .55);
    halo.position.copy(lampAt); halo.visible = true; halo.scale.setScalar(near ? .35 + .2 * fill : .9 + .5 * fill); halo.material.opacity = near ? .45 : .9; halo.material.color.set('#ffc070').lerp(new THREE.Color('#c890ff'), fill * .6);
    // —— the first firefly and its light (the flare at the transform makes the shadows swing) ——
    ffAt(t, ffPos);
    const flare = t > T.transform ? Math.exp(-(t - T.transform) / .35) : 0, ffOn = t > T.transform - .2 && t < 104;
    ffLight.position.copy(ffPos).addScaledVector(toCam, .2); ffLight.intensity = ffOn ? (1.6 + 4.5 * flare) * (.85 + .15 * Math.sin(t * 5)) * ss(seg(t, T.transform - .2, T.transform + .1)) : 0;
    ffGlow.position.copy(ffPos); ffGlow.visible = ffOn; ffGlow.scale.setScalar(.35 + .9 * flare); ffGlow.material.opacity = ffOn ? Math.min(.85, .55 + .5 * flare) : 0;
    fillL.position.copy(Hr.root.position).add(new THREE.Vector3(.6, 1.6, 2.2)); fillL.intensity = id === 'palm' ? .9 : 1.5;
    // —— swarms ——
    MS.userData.update(t); FF.userData.update(t); motes.userData.update(t);
    // —— post: focus on the subject; the band narrows at the end ——
    const subj = id === 'title' ? new THREE.Vector3(-21, 5, -8) : id === 'release' ? new THREE.Vector3(3, 0, -4) : id === 'palm' ? palmAt.clone() : id === 'home' ? ffPos.clone() : id === 'dawn' ? lampAt.clone() : Hr.root.position.clone().setY(.9);
    post.dof.focus = cam.position.distanceTo(subj);
    post.dof.aper = id === 'title' ? 800 : id === 'release' ? 380 : id === 'palm' ? 150 : id === 'dawn' ? lerp(170, 420, ss(seg(t, T.narrow[0], T.narrow[1]))) : 260;
    post.dof.maxCoc = 22;
    tiltW = id === 'dawn' ? lerp(.08, .02, ss(seg(t, T.narrow[0], T.narrow[1]))) : .08;
    focusObj = id === 'release' ? null : subj;
    post.bloom.strength = .6 + .18 * flare; post.bloom.threshold = .8; renderer.toneMappingExposure = 1.3 + .35 * dawn;
    post.vig.uniforms.warm.value = lerp(.02, .18, dawn); post.vig.uniforms.sat.value = 1.08;
  }
  // sound events for the mixer: every window turning gold (its dream came home)
  const events = [...H.map((h, i) => ({ t: h.goldAt, type: 'winGold', i, pan: Math.max(-1, Math.min(1, h.x / 30)) })), { t: cotGoldAt, type: 'winGold', i: 99, pan: 1 }];
  return { scene, update, focus: () => focusObj, events, tiltW: () => tiltW };
}
