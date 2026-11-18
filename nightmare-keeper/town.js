// The town set: the tower on its mound (west), three rows of half-timbered houses on a cobbled main street, the cottage
// at the east edge. Every house has its own window material, so each window can be amber (asleep, safe), violet (a
// nightmare got in) or dark (morning). Characters: 노을, 하루; the moths; the big moth on the cottage roof.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, ground, billboard, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, ridge } from './kit.js';
import { sky, stars, particles, beamCard, flick } from './fx.js';
import { makeChar, moths, bigMoth, SPX } from './chars.js';
import { T, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const AMBER = new THREE.Color('#ffae55'), VIOLET = new THREE.Color('#b46cff'), DAWN_SKY = new THREE.Color('#e0a07a');
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
  // infection order: from the tower outward (nearest first)
  const TOWER = new THREE.Vector3(-22, 0, -10);
  const order = H.map((h, i) => [i, Math.hypot(h.x - TOWER.x, h.z - TOWER.z)]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  H.forEach((h, i) => { h.infectAt = T.infectStart + order.indexOf(i) * T.infectStep; h.saveAt = T.chaseStops[h.grp] + 1.6; });
  // the dawn: windows go dark one by one, east to west (the sun comes from the east)
  const dawnOrder = H.map((h, i) => [i, -h.x]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  H.forEach((h, i) => { h.offAt = T.winOff0 + dawnOrder.indexOf(i) * T.winOffStep; });
  // window centre in world space (for moths and lights)
  H.forEach(h => { const q = h.g.userData.windows[0]; h.g.updateMatrixWorld(true); h.win = q.getWorldPosition(new THREE.Vector3()); });

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
  const fill = new THREE.PointLight('#9fb2e8', 1.5, 7, 2); scene.add(fill);
  const BM = bigMoth(); scene.add(BM.mesh); const bmLight = new THREE.PointLight(VIOLET, 6, 9, 2); scene.add(bmLight); const bmGlow = glow('#b070ff', 4, .8); scene.add(bmGlow);

  // —— window lights per alley (not shadow-casting): amber ↔ violet ——
  const GL = [[-8, 2.6, 2], [6, 2.6, 2], [18, 2.6, 2]].map(([x, y, z]) => { const L = new THREE.PointLight(AMBER, 7, 12, 2); L.position.set(x, y, z); scene.add(L); return L; });

  // —— moths ——
  const lampAt = new THREE.Vector3();          // where her lantern is this frame (set in update before the moths)
  const lampLevel = t => {
    if (t < T.chaseStops[0] + 1.6) return T.lampSteps[0];
    if (t < T.nearlyOut) { const k = T.chaseStops.filter(s => t >= s + 1.6).length; return T.lampSteps[k]; }
    if (t < T.relight) return lerp(.46, .05, ss(seg(t, T.nearlyOut - .6, T.nearlyOut))) + .09 * ss(seg(t, T.heartbeat + .4, T.relight));
    return .14;
  };
  const curl = (i, u, a, b, k = 1) => {   // a curving flight a → b, u 0..1
    const s = ss(u), wob = Math.sin(u * Math.PI) * (1.2 + (i % 5) * .3) * k, ph = i * 2.39;
    return [lerp(a.x, b.x, s) + Math.cos(ph + u * 7) * wob, lerp(a.y, b.y, s) + Math.sin(u * Math.PI) * 1.4 * k + Math.sin(ph + u * 9) * wob * .4, lerp(a.z, b.z, s) + Math.sin(ph + u * 7) * wob];
  };
  const PATROL_SRC = [H[0], H[6], H[1]];
  const MS = moths(260, (i, t, o) => {
    o.a = 0; o.f = Math.floor(t * 9 + i * .37) % 2;
    // 1) the round: moths leave windows and swirl into her lantern (patrol)
    if (i < 36) { const k = Math.floor(i / 12), t0 = T.collect[k] - 1.2 + (i % 12) * .09, u = seg(t, t0, t0 + 1.5);
      if (t > t0 && u < 1 && t < 32) { const p = curl(i, u, PATROL_SRC[k].win, lampAt, .6); o.x = p[0]; o.y = p[1]; o.z = p[2]; o.a = 1; o.s = .32; } return; }
    // 2) the scattering: from the tower top to every house window, arriving when the window turns violet
    if (i < 36 + 14 * 6) { const j = i - 36, h = H[j % 14], t1 = h.infectAt, t0 = t1 - 3.2 - (j / 14 | 0) * .25, u = seg(t, t0, t1);
      if (t > t0 && t < t1 + .4 && t < 61) { const p = curl(j, u, new THREE.Vector3(-22, 12.6, -10), h.win, 1.8); o.x = p[0]; o.y = p[1]; o.z = p[2]; o.a = 1 - seg(t, t1, t1 + .4); o.s = .7; } return; }
    // 3) the chase: each alley's moths come out of their windows and into the lifted lamp
    if (i < 36 + 84 + 90) { const j = i - 120, grp = Math.floor(j / 30), hs = H.filter(h => h.grp === grp), h = hs[j % hs.length], t0 = T.chaseStops[grp] + .2 + (j % 30) * .045, u = seg(t, t0, t0 + 1.4);
      if (t > t0 && u < 1 && t < 81) { const p = curl(j, u, h.win, lampAt, .8); o.x = p[0]; o.y = p[1]; o.z = p[2]; o.a = 1; o.s = .3; } return; }
    // 4) a few moths flutter at violet windows until they are fetched
    { const j = i - 210, h = H[j % 14]; if (t > h.infectAt && t < Math.min(h.saveAt - .2, 81)) { const ph = j * 1.7; o.x = h.win.x + Math.sin(t * 1.3 + ph) * .7; o.y = h.win.y + .3 + Math.sin(t * 2.1 + ph) * .4; o.z = h.win.z + .5 + Math.cos(t * 1.1 + ph) * .4; o.a = .9; o.s = .26; } }
  });
  scene.add(MS);

  // —— the rest: a lone moth on the boy's lantern at dawn ——
  const rest = moths(1, (i, t, o) => { o.a = t > T.shrink[1] ? 1 : 0; o.x = lampAt.x; o.y = lampAt.y + .2; o.z = lampAt.z + .02; o.s = .26; o.f = Math.floor(t * 1.2) % 2; }); scene.add(rest);
  const motes = particles(160, (i, t, o) => { const R2 = h2(i, 1, 4), R3 = h2(i, 2, 4); o.x = -30 + R2 * 62 + Math.sin(t * .2 + i) * 1; o.y = .5 + h2(i, 3, 4) * 7 + Math.sin(t * .4 + i * 1.3) * .3; o.z = -20 + R3 * 34; o.a = .25; o.s = .06; o.r = .7; o.g = .75; o.b = 1; }, { soft: 1 }); scene.add(motes);

  // —— shots: camera keys (shot-local time) ——
  const CAM = {
    mapOpen: { p: track([[0, [0, 74, -4.02]], [2.4, [0, 70, -4.01]], [7.5, [-8, 20, 18]]]), l: track([[0, [0, 0, -4]], [2.4, [-2, 0, -5]], [7.5, [-21, 6, -10]]]), fov: 34 },
    title: { p: track([[0, [-6, 15, 15]], [4.8, [-7, 14, 13]]]), l: track([[0, [-21, 7, -10]], [4.8, [-21, 7, -10]]]), fov: 30 },
    patrol: { fov: 30 }, door: { p: track([[0, [-17.6, 5.6, 1.4]], [5.5, [-18.2, 5.2, .6]]]), l: track([[0, [-21.2, 2.4, -6.4]], [5.5, [-21.2, 2.4, -6.4]]]), fov: 30 },
    infect: { p: track([[0, [-2, 62, 10]], [8, [-1, 54, 8]]]), l: track([[0, [-2, 0, -5]], [8, [-1, 0, -5]]]), fov: 36 },
    chase: { fov: 30 },
    cottageWide: { p: track([[0, [10, 26, 26]], [10, [19, 12, 14]]]), l: track([[0, [26, 2, -3]], [10, [27, 2.4, -1.5]]]), fov: 34 },
    talk: { p: track([[0, [23.4, 6.2, 11.4]], [10, [24.0, 6.0, 10.8]]]), l: track([[0, [27.2, 3.0, -1.2]], [10, [27.2, 3.0, -1.2]]]), fov: 34 },
    kneel: { p: track([[0, [24.0, 6.0, 10.8]], [1.8, [24.7, 3.1, 4.2]], [7.5, [24.6, 3.0, 3.9]]]), l: track([[0, [27.2, 3.0, -1.2]], [1.8, [25.2, .55, .6]], [7.5, [25.2, .55, .6]]]), fov: 32 },
    handover: { p: track([[0, [25.6, 2.4, 5.6]], [7, [26.4, 2.8, 6.4]]]), l: track([[0, [26.4, .9, .5]], [7, [26.8, 1.0, .4]]]), fov: 32 },
    dawn: { p: track([[0, [26.6, 3.2, 7.2]], [11.5, [8, 34, 38]]]), l: track([[0, [26.6, 1.0, .4]], [11.5, [14, 1, -4]]]), fov: 34 },
  };
  const up = new THREE.Vector3();
  const walk = (t, rate = 9) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * rate) % 4];
  const idle = t => (Math.floor(t * 1.4) % 2 ? 'idle1' : 'idle0');
  const BLINKS = [2.1, 6.3, 9.8, 14.2, 19.6, 26.4, 33.4, 41.0, 66.2, 73.4, 88.6, 93.6, 99.2, 117.3, 120.9];
  const blinking = t => BLINKS.some(b => t > b && t < b + .12);

  let focusObj = null;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id;
    // —— mood: night → (violet after the scattering) → dawn ——
    const top3 = id === 'mapOpen' || id === 'infect' || id === 'title';
    const dawn = ss(seg(t, T.dawn + 1, T.dawn + 9)), vio = ss(seg(t, T.infectStart, T.infectStart + 6)) * (1 - ss(seg(t, T.chaseStops[2] + 1, T.chaseStops[2] + 5)));
    scene.fog.color.set('#141c34').lerp(new THREE.Color('#1c1434'), vio * .7).lerp(new THREE.Color('#6a5a6e'), dawn);
    scene.fog.density = lerp(.016, .011, dawn);
    SK.u.top.value.set('#050818').lerp(new THREE.Color('#2c3e6a'), dawn); SK.u.mid.value.set('#101d3e').lerp(new THREE.Color('#7a6a8c'), dawn); SK.u.hor.value.set('#2c3a5e').lerp(DAWN_SKY, dawn); SK.u.moonI.value = 1 - dawn;
    ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = 1 - dawn;
    moon.color.set('#8fa8e0').lerp(new THREE.Color('#ffc49a'), dawn); moon.intensity = lerp(1.7, 2.8, dawn);
    moon.position.set(lerp(25, 60, dawn), lerp(45, 16, dawn), lerp(-40, -6, dawn));
    hemi.color.set('#46598c').lerp(new THREE.Color('#c8b4cc'), dawn); hemi.intensity = lerp(2.0, 2.6, dawn);
    // —— windows ——
    H.forEach(h => {
      const v = t >= h.infectAt && t < h.saveAt ? ss(seg(t, h.infectAt, h.infectAt + .3)) * (1 - ss(seg(t, h.saveAt, h.saveAt + .35))) : 0;
      const on = 1 - ss(seg(t, h.offAt, h.offAt + .25));
      h.m.emissive.copy(AMBER).lerp(VIOLET, v); h.m.emissiveIntensity = (2.2 + v * .6 + (v > 0 ? .3 * Math.sin(t * 6 + h.x) : 0)) * on;
      h.gs.forEach(gl => { gl.material.color.copy(AMBER).lerp(VIOLET, v).multiplyScalar(.9 * on * (1 - dawn * .5)); gl.scale.setScalar(top3 ? 4.2 : 3.2); });
    });
    cm.emissiveIntensity = 2.2 * (1 - ss(seg(t, T.winOff0 + 5, T.winOff0 + 5.3)));
    GL.forEach((L, g) => { const hs = H.filter(h => h.grp === g), v = hs.reduce((a, h) => a + (h.m.emissive.b > .8 ? 1 : 0), 0) / hs.length; L.color.copy(AMBER).lerp(VIOLET, v); L.intensity = 7 * (1 - dawn); });
    const tp = flick(t, 2) * (1 + .5 * vio);
    topLight.intensity = (t < T.burst ? 18 : t < 61 ? 26 : 10) * tp * (1 - dawn); topGlow.material.opacity = (1 - dawn); lroom.material.emissiveIntensity = (t > T.burst && t < 81 ? 2.2 : 1.2) * (1 - dawn) * tp;
    doorLamp.intensity = 5 * flick(t, 5) * (1 - dawn); doorGlow.material.opacity = 1 - dawn;
    cotLight.intensity = 5 * (1 - dawn * .8);

    // —— characters by shot ——
    N.root.visible = Hr.root.visible = true; BM.mesh.visible = bmGlow.visible = t >= 70; bmLight.intensity = 0;
    let nf = 'idle0', nx = -12, nz = 2.2, nflip = false, lit = lampLevel(t), hasMoths = t > T.collect[0] - .3 && t < T.nearlyOut;
    let hf = 'idle0', hx = 29.6, hz = -.7, hflip = true, hLit = null;
    let ny = 0;
    if (id === 'mapOpen' || id === 'title' || id === 'door') { nx = -21.1; nz = -6.3; ny = 1.4; nf = idle(t); Hr.root.visible = false; }
    if (id === 'mapOpen' || id === 'title') { N.root.visible = false; }
    if (id === 'patrol') { const w0 = T.patrolWalk[0], w1 = T.patrolWalk[1], u = seg(t, w0, w1); nx = lerp(-13, 0, u); Hr.root.visible = false;
      const lifting = T.collect.some(c => t > c - .9 && t < c + .7); nf = lifting ? (Math.floor(t * 1.4) % 2 ? 'up1' : 'up') : t > w0 && t < w1 ? walk(t) : idle(t);
      if (lifting) nx = lerp(-13, 0, seg(T.collect.find(c => t > c - .9 && t < c + .7) - .9, w0, w1)); }
    if (id === 'infect') { nx = -21.1; nz = -6.3; ny = 1.4; nf = 'look'; Hr.root.visible = false; }
    if (id === 'chase') { Hr.root.visible = false;
      // walk between stops, lift the lamp at each stop
      const keys = [[61.6, -14], [T.chaseStops[0] - .4, -6.5], [T.chaseStops[0] + 2.4, -6.5], [T.chaseStops[1] - .4, 5.8], [T.chaseStops[1] + 2.4, 5.8], [T.chaseStops[2] - .4, 15.6], [T.chaseStops[2] + 2.4, 15.6], [80.8, 21]];
      let k = 0; while (k < keys.length - 2 && t > keys[k + 1][0]) k++;
      const [ta, xa] = keys[k], [tb, xb] = keys[k + 1], u = seg(t, ta, tb); nx = lerp(xa, xb, ss(u));
      const stopped = xa === xb, stopT = T.chaseStops.find(s => t > s - .4 && t < s + 2.4);
      nf = stopped && stopT != null ? (t > stopT && t < stopT + 2.1 ? (Math.floor(t * 1.4) % 2 ? 'up1' : 'up') : idle(t)) : t < 61.6 || t > 80.8 ? idle(t) : walk(t); }
    if (id === 'cottageWide') { const u = seg(t, 82.6, 89.2); nx = lerp(20.5, 25.4, u); nz = lerp(2.2, .6, u); nf = t > 82.6 && t < 89.2 ? walk(t) : idle(t); hf = (Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0'); }
    if (id === 'talk') { nx = 25.4; nz = .6; nf = t > T.liftLamp && t < T.liftLamp + 4.2 ? (Math.floor(t * 1.4) % 2 ? 'up1' : 'up') : idle(t); hf = t > 96.6 && t < 100.4 ? 'point' : idle(t); }
    if (id === 'kneel') { nx = 25.4; nz = .6; nf = t > T.kneel ? (t > T.nearlyOut && t < T.relight + 1 ? 'kneelShut' : 'kneel') : idle(t); hf = idle(t); }
    if (id === 'handover') { nx = 25.4; nz = .6; const wk = t > 108.9 && t < 110.2;
      hx = lerp(29.6, 26.7, ss(seg(t, 108.9, 110.2))); hz = lerp(-.7, .55, ss(seg(t, 108.9, 110.2)));
      hf = wk ? walk(t, 8) : t < T.handover - .4 ? idle(t) : t < T.handover ? 'reach' : (Math.floor(t * 1.2) % 2 ? 'hold1' : 'hold');
      if (t >= T.handover) { hLit = lerp(.14, .64, ss(seg(t, T.shrink[0], T.shrink[1]))); }
      nf = t < T.handover ? 'kneel' : t < T.sleep ? 'kneelEmpty' : 'sleep'; if (t >= T.sleep) { nx = 25.0; } }
    if (id === 'dawn') { nx = 25.0; nz = .6; nf = 'sleep'; hx = 26.7; hz = .55; hf = Math.floor(t * 1.2) % 2 ? 'hold1' : 'hold'; hLit = lerp(.64, 1, ss(seg(t, T.dawn, T.dawn + 4))); }
    if (blinking(t) && /^idle/.test(nf)) nf = 'blink';
    if (blinking(t + .7) && /^idle/.test(hf)) hf = 'blink';
    N.root.position.set(nx, ny, nz); Hr.root.position.set(hx, 0, hz);

    // —— camera ——
    const C = CAM[id] || CAM.title; cam.fov = C.fov; cam.updateProjectionMatrix();
    if (id === 'patrol') { const x = N.root.position.x; cam.position.set(x + 1.6, 5.4, 7.6); cam.lookAt(x + 1.0, .9, 1.6); }
    else if (id === 'chase') { const x = N.root.position.x; cam.position.set(x + 1.8, 5.2, 7.4); cam.lookAt(x + .9, .9, 1.4); }
    else {
      const top = id === 'mapOpen' ? 1 - ss(seg(lt, 2.4, 6.8)) : id === 'infect' ? 1 : 0;
      cam.up.set(0, 1, 0).lerp(up.set(0, 0, -1), top).normalize();
      cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
      if (id === 'kneel' && t > T.kneel && t < T.kneel + .25) { }
    }
    if (id !== 'mapOpen' && id !== 'infect') cam.up.set(0, 1, 0);
    N.face(cam, nflip); Hr.face(cam, hflip);
    N.frame(nf, ['empty', 'kneelEmpty', 'sleep', 'sitWake', 'blink'].includes(nf) ? null : lit, hasMoths);
    Hr.frame(hf, hLit == null || !/^hold/.test(hf) ? null : hLit, false);
    // the lantern light: hers, or the boy's after the handover
    const holder = hLit != null && /^hold/.test(hf) ? Hr : N, hn = holder === Hr ? hf : nf, lv = holder === Hr ? hLit : lit;
    const showLamp = holder.root.visible && !['empty', 'kneelEmpty', 'sleep', 'blink', 'reach'].includes(hn);
    lampAt.copy(holder.lanternPos(hn === 'blink' ? 'idle0' : hn, holder === Hr ? hflip : nflip));
    const toCam = cam.position.clone().sub(lampAt).setY(0).normalize();
    lamp.position.copy(lampAt).addScaledVector(toCam, .45); lamp.intensity = showLamp ? 6 * Math.pow(lv, 1.3) * flick(t, 3) : 0; lamp.color.set('#ffb050');
    halo.position.copy(lampAt); halo.visible = showLamp; halo.scale.setScalar(.6 + 1.1 * lv); halo.material.opacity = Math.min(1, lv * 1.3);
    const focusOn = id === 'talk' || id === 'kneel' ? N : (id === 'handover' && t > T.handover) || id === 'dawn' ? Hr : N;
    fill.position.copy(focusOn.root.position).add(new THREE.Vector3(.6, 1.6, 2.2)); fill.intensity = 1.5;
    // —— the big moth on the cottage roof: flaps slowly; at the turn it shrinks onto the boy's lantern ——
    const sh = ss(seg(t, T.shrink[0], T.shrink[1])), roof = new THREE.Vector3(29.2, 5.6, -3.4);
    BM.mesh.position.copy(roof).lerp(lampAt.clone().add(new THREE.Vector3(0, .25, 0)), sh); BM.mesh.position.y += Math.sin(t * 1.1) * .08 * (1 - sh);
    const sc = lerp(1, .07, sh); BM.mesh.scale.setScalar(sc); BM.frame(Math.floor(t * (t > T.liftLamp && t < 100 ? .6 : 1.3)) % 2);
    BM.mesh.rotation.y = Math.atan2(cam.position.x - BM.mesh.position.x, cam.position.z - BM.mesh.position.z);
    BM.mesh.visible = bmGlow.visible = t >= 70 && t < T.shrink[1] + .05;
    bmGlow.position.copy(BM.mesh.position); bmGlow.scale.setScalar(4 * sc); bmLight.position.copy(BM.mesh.position).add(new THREE.Vector3(0, 0, 1.2)); bmLight.intensity = BM.mesh.visible ? 6 * sc * (1 - dawn) : 0;
    // —— moths ——
    MS.userData.update(t); rest.userData.update(t); motes.userData.update(t);
    // —— post: focus on the subject; tilt band per shot ——
    const subj = id === 'mapOpen' ? new THREE.Vector3(-22, 6, -10) : id === 'title' ? new THREE.Vector3(-22, 7, -10) : id === 'infect' ? new THREE.Vector3(-2, 0, -4) : id === 'cottageWide' ? new THREE.Vector3(27, 2.4, -2) : focusOn.root.position.clone().setY(.8);
    if (id === 'handover') subj.lerp(lampAt, ss(seg(t, T.handover - .4, T.handover + 1)));
    post.dof.focus = cam.position.distanceTo(subj);
    post.dof.aper = id === 'title' ? 900 : id === 'mapOpen' || id === 'infect' ? 380 : id === 'kneel' || id === 'handover' ? 160 : 300;
    post.dof.maxCoc = 22;
    focusObj = id === 'mapOpen' && lt < 3 ? null : id === 'infect' ? null : subj;
    post.bloom.strength = .6; post.bloom.threshold = .8; renderer.toneMappingExposure = 1.3 + .35 * dawn;
    post.vig.uniforms.warm.value = lerp(.02, .18, dawn); post.vig.uniforms.sat.value = 1.08;
  }
  // sound events for the mixer: each window's violet, its rescue (per alley), and its going dark at dawn
  const events = [...H.map((h, i) => ({ t: h.infectAt, type: 'winViolet', i, pan: Math.max(-1, Math.min(1, h.x / 30)) })),
    ...H.map((h, i) => ({ t: h.offAt, type: 'winOff', i, pan: Math.max(-1, Math.min(1, h.x / 30)) }))];
  return { scene, update, focus: () => focusObj, events };
}
