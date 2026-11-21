// The town set of 「악몽을 지키는 파수꾼 2 — A 할머니의 첫 꿈」: the same diorama as the first film (the tower on its mound,
// three rows of half-timbered houses on a cobbled street, the cottage at the east edge). Tonight every window is dark
// (everyone asleep) and the brightest light in the town is the golden dream at the top of the tower — so every nightmare
// flies to it. The bell on the tower roof rings for the first time: the windows light amber one by one, lanterns pour out,
// and the moths scatter to the nearest lights. Characters: 하루, 노을 at dawn, the villagers in their night clothes.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, ground, billboard, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, ridge } from './kit.js';
import { sky, stars, particles, beamCard, flick } from './fx.js';
import { makeChar, moths, SPX } from './chars.js';
import { SHOTS } from './story.js';
import { T, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const FS = window.FILM_SIZE || [innerWidth, innerHeight], PORT = FS[1] > FS[0], FOVK = PORT ? 1.65 : 1;   // the vertical cut: a taller lens; the map shots turn so the town's long axis runs down the frame
const AMBER = new THREE.Color('#ffae55'), VIOLET = new THREE.Color('#b46cff'), GOLD = new THREE.Color('#ffc35a'), DARKWIN = new THREE.Color('#141826'), DAWN_SKY = new THREE.Color('#e0a07a');
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
    const gs = []; for (const sgn of [1, -1]) { const gl = glow('#ffae55', 3.2, .9); gl.userData.sgn = sgn; gl.position.set(0, 1.6, sgn * (o.d / 2 + .9)); hh.add(gl); gs.push(gl); pools.push(gl); }
    H.push({ g: hh, m, gs, grp, x: o.x, z: o.z, ry: o.ry || 0, w: o.w, d: o.d, h: o.h, door: o.door ?? 0 }); return hh; };
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
  const lroom = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.8, 18, 1, true).translate(-22, 12.5, -10), new THREE.MeshStandardMaterial({ color: '#1a1424', emissive: GOLD, emissiveIntensity: 1.2, roughness: .4, side: THREE.DoubleSide }));
  scene.add(lroom);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = box(.16, 1.8, .16, MM.beam); p.position.set(-22 + Math.cos(a) * 1.92, 11.6, -10 + Math.sin(a) * 1.92); scene.add(p); }
  const roofC = mesh(new THREE.ConeGeometry(2.8, 2.6, 18).translate(-22, 14.7, -10), MM.roof2); scene.add(roofC);
  const door = box(1.1, 2.0, .14, MM.plankDark); door.position.set(-22, 1.4, -7.62); scene.add(door);
  const doorLamp = new THREE.PointLight('#ffb050', 5, 7, 2); doorLamp.position.set(-21.1, 3.6, -7.0); scene.add(doorLamp);
  const doorGlow = glow('#ffc070', .9, 1.1); doorGlow.position.set(-21.1, 3.5, -7.4); scene.add(doorGlow);
  const topLight = new THREE.PointLight(GOLD, 18, 22, 2); topLight.position.set(-22, 12.6, -10); scene.add(topLight);
  const topGlow = glow('#ffd27a', 6, 1.2); topGlow.position.set(-22, 12.6, -10); topGlow.material.depthTest = false; topGlow.renderOrder = 5; scene.add(topGlow);

  // —— the cottage at the east edge ——
  const cottage = house({ x: 29.2, z: -3.4, w: 4.4, d: 4, h: 3.1, wall: 'wall3', roof: 'roof3', door: 1, windows: [[-1, 1.7]], rh: 1.9 }); scene.add(cottage);
  const cm = winMat(); cottage.userData.windows.forEach(q => q.material = cm);
  const cotLight = new THREE.PointLight(AMBER, 5, 8, 2); cotLight.position.set(28.2, 1.8, -.6); scene.add(cotLight);
  const fence = new THREE.Group(); for (let i = 0; i < 9; i++) { const p = box(.12, .8, .12, MM.beam); p.position.set(25.2 + i * .9, 0, 1.7); fence.add(p); } const rail = box(7.4, .1, .1, MM.beam); rail.position.set(28.8, .55, 1.7); fence.add(rail); scene.add(fence);

  // —— trees, background ridges ——
  [[-30, -20], [-27, -2], [-31, 6], [-6, -22], [4, -21], [24, -16], [30, -12], [33, 4], [27, 12], [-20, 14], [-28, 14], [8, 15], [33, -20], [-16, -21]].forEach(([x, z], i) => { const p = pine(i + 3, 3.4 + R() * 2.2); p.position.set(x, 0, z); scene.add(p); p.userData.pine = 1; });
  for (const [x, z, w, h, c, s] of [[0, -58, 160, 22, '#0b1226', 3], [-30, -72, 140, 30, '#0a0f20', 8], [40, -70, 140, 26, '#0a0f20', 5]]) { const r = ridge(w, h, c, s); r.position.set(x, -2, z); scene.add(r); }

  // —— the bell on the roof: a little frame on the cone's tip, a bronze bell that has never swung ——
  const BELL = new THREE.Vector3(-22, 16.75, -10);
  for (const s of [-1, 1]) { const p = box(.12, 1.3, .12, MM.beam); p.position.set(BELL.x + s * .5, 15.55, BELL.z); scene.add(p); }
  const cross = box(1.2, .12, .14, MM.beam); cross.position.set(BELL.x, 16.8, BELL.z); scene.add(cross);
  const capB = mesh(new THREE.ConeGeometry(.75, .45, 4).rotateY(Math.PI / 4).translate(BELL.x, 17.15, BELL.z), MM.roof2); scene.add(capB);
  const bellPiv = new THREE.Group(); bellPiv.position.copy(BELL); scene.add(bellPiv);
  const prof = [[0, 0], [.12, -.02], [.17, -.12], [.2, -.3], [.27, -.46], [.36, -.56], [.34, -.6], [0, -.6]].map(([x, y]) => new THREE.Vector2(x, y));
  const bronze = new THREE.MeshStandardMaterial({ color: '#9a7440', metalness: .65, roughness: .38, emissive: '#3a2208', emissiveIntensity: .3 });
  const bellM = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), bronze); bellM.castShadow = true; bellPiv.add(bellM);
  const clap = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), MM.beam); clap.position.y = -.5; bellPiv.add(clap);
  const bellFlash = glow('#fff0c8', 3, 1.2); bellFlash.position.copy(BELL).add(new THREE.Vector3(0, -.3, 0)); scene.add(bellFlash);
  const bellL = new THREE.PointLight('#ffd9a0', 0, 9, 2); bellL.position.copy(BELL).add(new THREE.Vector3(0, -.4, 1.2)); scene.add(bellL);
  // the ring of the bell spreading over the map (a pale wave; windows light as it passes)
  const ringM = new THREE.MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const wave = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 96), ringM); wave.rotation.x = -Math.PI / 2; wave.position.set(-22, .6, -10); scene.add(wave);

  const goldSpot = new THREE.SpotLight('#ffc35a', 0, 30, .55, .7, 1.2); goldSpot.position.set(-22, 12.5, -8.2); goldSpot.target.position.set(-21.2, 0, -4.5); scene.add(goldSpot, goldSpot.target);
  // —— characters ——
  const N = makeChar('noeul'), Hr = makeChar('haru'); scene.add(N.root, Hr.root);
  const lamp = new THREE.PointLight('#ffb050', 6, 11, 2); lamp.castShadow = true; lamp.shadow.bias = -.004; lamp.shadow.mapSize.set(512, 512); scene.add(lamp);
  const halo = glow('#ffc070', 1.1, 1.2); scene.add(halo);
  const fillL = new THREE.PointLight('#9fb2e8', 1.5, 7, 2); scene.add(fillL);

  // —— the plan: windows light from the tower outwards as the ring passes ——
  const TOWER = new THREE.Vector3(-22, 0, -10), RING0 = SHOTS.find(s => s.id === 'wake').a + .2, RING_V = 6.0;
  H.forEach(h => { const q = h.g.userData.windows[0]; h.g.updateMatrixWorld(true); h.win = q.getWorldPosition(new THREE.Vector3()); h.door3 = h.g.localToWorld(new THREE.Vector3(h.door, 0, h.d / 2 + .5));
    h.dist = Math.hypot(h.x - TOWER.x, h.z - TOWER.z); h.lightAt = RING0 + h.dist / RING_V + .15; });
  const COT_WIN = (() => { const q = cottage.userData.windows[0]; cottage.updateMatrixWorld(true); return q.getWorldPosition(new THREE.Vector3()); })();
  const cotLightAt = RING0 + Math.hypot(29.2 - TOWER.x, -3.4 - TOWER.z) / RING_V + .15;
  const SRC = [...H.map(h => ({ win: h.win, at: h.lightAt })), { win: COT_WIN, at: cotLightAt }];
  const GL = [[-8, 2.6, 2], [6, 2.6, 2], [18, 2.6, 2]].map(([x, y, z]) => { const L = new THREE.PointLight(AMBER, 0, 12, 2); L.position.set(x, y, z); scene.add(L); return L; });

  // —— the swarm ——
  const TOP = new THREE.Vector3(-22, 12.8, -10);
  const curl = (i, u, a, b, k = 1) => {   // a curving flight a → b, u 0..1
    const s = ss(u), wob = Math.sin(u * Math.PI) * (1.2 + (i % 5) * .3) * k, ph = i * 2.39;
    return [lerp(a.x, b.x, s) + Math.cos(ph + u * 7) * wob, lerp(a.y, b.y, s) + Math.sin(u * Math.PI) * 1.4 * k + Math.sin(ph + u * 9) * wob * .4, lerp(a.z, b.z, s) + Math.sin(ph + u * 7) * wob];
  };
  const cloudAt = (i, t, out) => {   // where moth i circles the tower top (the ring ripples out once at the bell)
    const r = 2.4 + h2(i, 4, 3) * 2.2 + (t > T.bell ? 2.2 * Math.exp(-(t - T.bell) / .7) * Math.sin(Math.min(1, (t - T.bell) * 3) * Math.PI) : 0), w = .55 + h2(i, 5, 3) * .5, ph = i * 2.39;
    return out.set(TOP.x + Math.cos(t * w + ph) * r, 6.5 + h2(i, 6, 3) * 8 + Math.sin(t * 1.3 + ph) * .3, TOP.z + Math.sin(t * w + ph) * r * .85);
  };
  const NM = 96, _c = new THREE.Vector3(), _d = new THREE.Vector3();
  const mothAt = (i, t, o) => {   // fills o.x/y/z, returns alpha
    const src = SRC[i % SRC.length], te = T.emerge[0] + h2(i, 1, 3) * (T.emerge[1] - T.emerge[0]), tt = T.turn + h2(i, 7, 3) * 1.4;
    if (t < te) return 0;
    const ph = i * 1.7, wander = _d.set(src.win.x + Math.sin(t * .9 + ph) * .9, src.win.y + .4 + Math.sin(t * 1.4 + ph) * .5 + Math.min(1.2, (t - te) * .4), src.win.z + .5 + Math.cos(t * 1.1 + ph) * .9);
    if (t < tt) { o.x = wander.x; o.y = wander.y; o.z = wander.z; return ss(seg(t, te, te + .6)); }
    const ta = tt + 2.6 + src.win.distanceTo(TOP) / 9;
    if (t < ta) { const from = _d.set(src.win.x + Math.sin(tt * .9 + ph) * .9, src.win.y + .4 + Math.sin(tt * 1.4 + ph) * .5 + Math.min(1.2, (tt - te) * .4), src.win.z + .5 + Math.cos(tt * 1.1 + ph) * .9);
      const p = curl(i, seg(t, tt, ta), from, cloudAt(i, ta, _c), 1.4); o.x = p[0]; o.y = p[1]; o.z = p[2]; return 1; }
    const tl = Math.max(T.scatter[0] + h2(i, 8, 3) * 2.5, src.at + .1);
    if (t < tl) { cloudAt(i, t, _c); o.x = _c.x; o.y = _c.y; o.z = _c.z; return 1; }
    const tw = tl + 2.0 + src.win.distanceTo(TOP) / 14;
    if (t < tw) { const p = curl(i + 3, seg(t, tl, tw), cloudAt(i, tl, _c), src.win.clone().add(new THREE.Vector3(0, .2, .6)), 1.0); o.x = p[0]; o.y = p[1]; o.z = p[2]; return 1; }
    o.x = src.win.x + Math.sin(t * 2 + ph) * .3; o.y = src.win.y + .2 + Math.sin(t * 2.6 + ph) * .2; o.z = src.win.z + .6; return 1 - ss(seg(t, tw, tw + 1.6));
  };
  let mapScale = 1;
  const MS = moths(NM + 48, (i, t, o) => {
    o.f = Math.floor(t * 9 + i * .37) % 2;
    if (i < NM) { o.a = mothAt(i, t, o); o.s = .32 * mapScale; return; }
    // the waves he pulls down from the cloud into his lantern
    const j = i - NM, k = Math.floor(j / 12), t0 = T.collect[k] - 1.6 + (j % 12) * .09, t1 = t0 + 2.4;
    o.a = 0; if (t < t0 || t > t1) return;
    const u = seg(t, t0, t1), p = curl(j, Math.min(1, u * 1.25), cloudAt(j * 3 + 1, t0, _c).clone(), lampAt, .9), sp = (1 - u) * 1.1, an = u * 14 + j;
    o.x = p[0] + Math.cos(an) * sp * u; o.y = p[1]; o.z = p[2] + Math.sin(an) * sp * u; o.a = 1 - ss(seg(t, t1 - .3, t1)); o.s = .34;
  });
  scene.add(MS);
  // the same moths as soft violet specks (they read from the map's height)
  const _o = { x: 0, y: 0, z: 0 };
  const MG = particles(NM, (i, t, o) => { const a = mothAt(i, t, _o); o.x = _o.x; o.y = _o.y; o.z = _o.z; o.a = a; o.s = 1.6 * mapScale; o.r = .8; o.g = .42; o.b = 1; }, { soft: 1 });
  scene.add(MG);

  // —— villagers: out of their doors as their windows light, along the street to the tower; asleep on its steps at dawn ——
  const VH = [0, 6, 1, 7, 2, 8, 3, 9, 11, 12];
  const SLEEP = [[-24.3, 1.4, -5.0], [-23.1, 1.4, -4.75], [-19.6, 1.4, -5.6], [-19.9, 1.4, -6.6], [-22.9, .5, -3.55], [-20.55, .5, -3.45], [-24.1, 0, -2.6], [-20.1, 0, -2.7], [-23.0, 0, -2.0], [-25.0, 0, -3.6]];
  const V = VH.map((hi, k) => { const c = makeChar('villager', k); scene.add(c.root); const g2 = glow('#ffc070', .9, 1.2); scene.add(g2);
    const h = H[hi], d = h.door3, back = h.z < -10, lane = h.x < 0 ? -8 : 6.5;
    const pts = back ? [d, new THREE.Vector3(lane, 0, d.z + .6), new THREE.Vector3(lane, 0, 2.0)] : [d, new THREE.Vector3(d.x, 0, 2.0)];
    pts.push(new THREE.Vector3(-18.5 + (k % 3) * .5, 0, 1.6 + (k % 2) * .6), new THREE.Vector3(-21.2 + (k % 4) * .4, 0, -2.4));
    const L = [0]; for (let j = 1; j < pts.length; j++) L.push(L[j - 1] + pts[j].distanceTo(pts[j - 1]));
    return { c, g: g2, pts, L, t0: h.lightAt + .7 + (k % 3) * .25, sp: 1.9 + (k % 4) * .15, sleep: new THREE.Vector3(...SLEEP[k]) }; });
  const along = (v, t, out) => { const d = Math.max(0, (t - v.t0) * v.sp); let j = 1; while (j < v.L.length - 1 && v.L[j] < d) j++;
    const u = clamp((d - v.L[j - 1]) / (v.L[j] - v.L[j - 1])); return out.copy(v.pts[j - 1]).lerp(v.pts[j], u); };

  const motes = particles(160, (i, t, o) => { const R2 = h2(i, 1, 4), R3 = h2(i, 2, 4); o.x = -30 + R2 * 62 + Math.sin(t * .2 + i) * 1; o.y = .5 + h2(i, 3, 4) * 7 + Math.sin(t * .4 + i * 1.3) * .3; o.z = -20 + R3 * 34; o.a = .25; o.s = .06; o.r = .7; o.g = .75; o.b = 1; }, { soft: 1 }); scene.add(motes);

  // —— shots: camera keys (shot-local time); the vertical cut uses these with a taller lens (FOVK) ——
  const CAM = {
    turn: { p: track([[0, [-3, 64, -4.0]], [9.4, [-3, 58, -4.0]]]), l: track([[0, [-2.99, 0, -4]], [9.4, [-2.99, 0, -4]]]), fov: 36, top: 1 },
    title: { p: track([[0, [-7, 16.5, 16]], [6, [-9, 14.5, 13.5]]]), l: track([[0, [-19, 8.5, -8]], [6, [-20, 8, -8]]]), fov: 32 },
    catch: { p: track([[0, [-18.6, 1.7, -.4]], [13, [-18.9, 1.5, -1.0]]]), l: track([[0, [-21.4, 2.9, -6.8]], [13, [-21.4, 3.2, -6.8]]]), fov: 32 },
    bell: { p: track([[0, [-17.2, 12.2, -3.4]], [4, [-17.6, 12.5, -3.9]]]), l: track([[0, [-22, 14.6, -10]], [4, [-22, 14.8, -10]]]), fov: 32 },
    wake: { p: track([[0, [-1, 58, -4.0]], [14.8, [2, 66, -4.0]]]), l: track([[0, [-.99, 0, -4]], [14.8, [2.01, 0, -4]]]), fov: 36, top: 1 },
    dawn: { p: track([[0, [-21.0, 3.0, -2.2]], [9.2, [-21.1, 2.95, -2.4]], [12.6, [-18.2, 4.9, 1.8]], [14.6, [-18.0, 5.0, 2.0]]]), l: track([[0, [-21.85, 2.35, -6.5]], [9.2, [-21.85, 2.35, -6.5]], [12.6, [-21.7, 1.1, -4.6]], [14.6, [-21.7, 1.0, -4.5]]]), fov: 30 },
  };
  const up = new THREE.Vector3(), lampAt = new THREE.Vector3(), _v = new THREE.Vector3();
  const BLINKS = [43.9, 47.8, 51.1, 54.2];
  const blinking = t => BLINKS.some(b => t > b && t < b + .12);
  const fillAt = t => t < T.collect[0] + .4 ? 0 : t < T.full ? T.fillSteps[T.collect.filter(c => t >= c + .4).length] : 1;

  let focusObj = null, tiltW = .08;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, isMap = id === 'turn' || id === 'wake';
    const dawn = ss(seg(t, T.doorOut[0] - .6, T.doorOut[0] + 8)), lit = H.map(h => ss(seg(t, h.lightAt, h.lightAt + .3)));
    scene.fog.color.set('#141c34').lerp(new THREE.Color('#6a5a6e'), dawn); scene.fog.density = lerp(isMap ? .009 : .016, .011, dawn);
    SK.u.top.value.set('#050818').lerp(new THREE.Color('#2c3e6a'), dawn); SK.u.mid.value.set('#101d3e').lerp(new THREE.Color('#7a6a8c'), dawn); SK.u.hor.value.set('#2c3a5e').lerp(DAWN_SKY, dawn); SK.u.moonI.value = 1 - dawn;
    ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = 1 - dawn;
    moon.color.set('#8fa8e0').lerp(new THREE.Color('#ffc49a'), dawn); moon.intensity = lerp(isMap ? 3.2 : 1.8, 2.8, dawn);
    moon.position.set(lerp(25, 60, dawn), lerp(45, 16, dawn), lerp(-40, -6, dawn));
    hemi.color.set('#46598c').lerp(new THREE.Color('#c8b4cc'), dawn); hemi.intensity = lerp(isMap ? 2.8 : 2.0, 2.6, dawn);
    // windows: dark (asleep) → amber with a pop when the ring passes
    H.forEach((h, i) => { const g = lit[i], pop = t > h.lightAt ? Math.exp(-(t - h.lightAt) / .3) : 0;
      h.m.emissive.copy(DARKWIN).lerp(AMBER, g); h.m.emissiveIntensity = (.35 + 2.1 * g + 2 * pop) * (1 - .55 * dawn);
      h.gs.forEach(gl => { gl.material.color.copy(AMBER).multiplyScalar(g * (.9 + pop) * (1 - dawn * .5)); gl.scale.setScalar(isMap ? 4.6 : 3.2); }); });
    const cl = ss(seg(t, cotLightAt, cotLightAt + .3)); cm.emissive.copy(DARKWIN).lerp(AMBER, cl); cm.emissiveIntensity = (.35 + 2.1 * cl) * (1 - .55 * dawn); cotLight.intensity = 5 * cl * (1 - dawn * .8);
    GL.forEach((L, g) => { const hs = H.map((h, i) => [h, i]).filter(([h]) => h.grp === g), v = hs.reduce((a, [, i]) => a + lit[i], 0) / hs.length; L.intensity = 7 * v * (1 - dawn * .7); });
    // the tower top: the golden dream (dimmed while the swarm presses; whole again after the bell)
    const taint = ss(seg(t, T.taint[0], T.taint[1])) * (1 - ss(seg(t, T.bell + 1, T.bell + 8))), tp = flick(t, 2);
    topLight.color.copy(GOLD).lerp(VIOLET, taint * .4); topLight.intensity = (isMap ? 26 : 18) * tp * (1 - .5 * taint) * (1 - dawn * .7);
    topGlow.material.color.set('#ffd27a').lerp(new THREE.Color('#c890ff'), taint * .5); topGlow.material.opacity = (1 - dawn * .6) * (1 - .4 * taint); topGlow.scale.setScalar(isMap ? 13 : 6);
    lroom.material.emissive.copy(GOLD).lerp(VIOLET, taint * .5); lroom.material.emissiveIntensity = 1.6 * tp * (1 - .5 * taint) * (1 - dawn * .5);
    doorLamp.intensity = 0; doorGlow.material.opacity = 0; goldSpot.intensity = 60 * tp * (1 - .5 * taint) * (1 - dawn);
    // the bell: still; swinging from the pull; the strike flashes and rings out over the map
    const sw = t < T.pull ? 0 : .5 * ss(seg(t, T.pull, T.pull + .6)) * Math.exp(-Math.max(0, t - T.bell - .8) / 2.6) * Math.sin((t - T.pull) * 2 * Math.PI / 1.5);
    bellPiv.rotation.x = sw; const fl = t > T.bell ? Math.exp(-(t - T.bell) / .35) : 0;
    bellFlash.material.opacity = fl; bellFlash.scale.setScalar(2 + 6 * fl); bellL.intensity = 14 * fl + (id === 'bell' ? 2.5 : 0);
    const rr = (t - RING0) * RING_V; wave.visible = isMap && t > RING0 && rr < 60; wave.scale.setScalar(Math.max(.1, rr)); ringM.opacity = .55 * (1 - ss(seg(rr, 20, 60))) * ss(seg(rr, 0, 3));

    // —— characters by shot ——
    N.root.visible = false; Hr.root.visible = id === 'catch' || id === 'dawn';
    let hf = 'hold', hx = -21.25, hy = 1.4, hz = -6.0, fill = fillAt(t), crk = t >= T.full ? 1 : 0;
    if (id === 'catch') { hf = t < T.collect[0] - 1.6 ? 'hold' : (blinking(t) ? 'hup' : Math.floor(t * 1.4) % 2 ? 'hup1' : 'hup'); }
    if (id === 'dawn') { hx = -22.0; hy = .5; hz = -3.62; hf = Math.floor(t * .5) % 2 ? 'lap1' : 'lap'; fill = .5; crk = 1;
      N.root.visible = true; const u = ss(seg(t, T.doorOut[0], T.doorOut[1]));
      N.root.position.set(lerp(-22.0, -21.85, u), 1.4, lerp(-7.45, -6.55, u));
      N.frame(t < T.doorOut[0] ? 'nidle' : t < T.doorOut[1] ? ['nw0', 'nw1', 'nw2', 'nw3'][Math.floor(t * 7) % 4] : t < T.stretch[0] ? 'nidle' : t < T.stretch[1] ? (Math.floor(t * 1.5) % 2 ? 'stretch' : 'stretch1') : 'nidle'); }
    Hr.root.position.set(hx, hy, hz);
    V.forEach((v, k) => { const c = v.c;
      if (id === 'dawn') { c.root.visible = true; c.root.position.copy(v.sleep); v.g.visible = true; v.g.position.copy(c.lanternPos('vsleep')); v.g.material.opacity = .35 * (1 - dawn * .5); v.g.scale.setScalar(.5); return; }
      const on = id === 'wake' && t > v.t0; c.root.visible = on; v.g.visible = on; if (!on) return;
      along(v, t, c.root.position); const moving = (t - v.t0) * v.sp < v.L[v.L.length - 1];
      v.g.position.copy(c.root.position).add(new THREE.Vector3(0, 1.1, 0)); v.g.material.opacity = .95; v.g.scale.setScalar(2.4); v.moving = moving; });

    // —— camera ——
    const C = CAM[id] || CAM.title; cam.fov = C.fov * FOVK; cam.updateProjectionMatrix();
    cam.up.set(0, 1, 0).lerp(PORT ? up.set(-1, 0, 0) : up.set(0, 0, -1), C.top ? 1 : 0).normalize();
    cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    if (id === 'bell' && t > T.bell) { const k = Math.exp(-(t - T.bell) / .25); cam.position.x += Math.sin(t * 70) * .12 * k; cam.position.y += Math.sin(t * 53) * .1 * k; }
    if (!C.top) cam.up.set(0, 1, 0);
    mapScale = isMap ? 3.2 : 1;
    Hr.face(cam); N.face(cam);
    V.forEach((v, k) => { if (!v.c.root.visible) return; v.c.face(cam, id !== 'dawn' && false);
      v.c.frame(id === 'dawn' ? (Math.floor(t * .45 + k * .3) % 2 ? 'vsleep1' : 'vsleep') : v.moving ? ['vw0', 'vw1', 'vw2', 'vw3'][Math.floor(t * 8 + k) % 4] : (Math.floor(t * 1.2 + k) % 2 ? 'vup1' : 'vup')); });
    Hr.frame(hf, fill, crk);
    // —— his lantern light: amber, violet as it fills ——
    lampAt.copy(Hr.lanternPos(hf));
    const toCam = cam.position.clone().sub(lampAt).setY(0).normalize();
    lamp.visible = halo.visible = Hr.root.visible;
    lamp.position.copy(lampAt).addScaledVector(toCam, .6); lamp.intensity = (id === 'dawn' ? 1.4 : 3.4) * flick(t, 3) * (t > T.full ? .8 + .2 * Math.sin(t * 19) : 1);
    lamp.color.set('#ffb050').lerp(VIOLET, fill * .6);
    halo.position.copy(lampAt); halo.scale.setScalar(.45 + .3 * fill); halo.material.opacity = .5; halo.material.color.set('#ffc070').lerp(new THREE.Color('#c890ff'), fill * .7);
    fillL.position.copy(Hr.root.position).add(new THREE.Vector3(.8, 1.8, 2.4)); fillL.intensity = id === 'dawn' ? .6 : 1.3;
    // —— swarms ——
    MS.userData.update(t); MG.userData.update(t); MG.visible = isMap || id === 'title' || id === 'bell'; motes.userData.update(t);
    // —— post ——
    const subj = isMap ? null : id === 'title' ? new THREE.Vector3(-21, 9, -8) : id === 'bell' ? BELL.clone() : id === 'catch' ? lampAt.clone() : id === 'dawn' ? (t < T.reveal[0] ? N.root.position.clone().setY(2.3) : Hr.root.position.clone().setY(.9)) : Hr.root.position.clone().setY(.9);
    post.dof.focus = subj ? cam.position.distanceTo(subj) : 60;
    post.dof.aper = id === 'title' ? 800 : isMap ? 380 : id === 'bell' ? 300 : id === 'dawn' ? lerp(170, 420, ss(seg(t, T.narrow[0], T.narrow[1]))) : 220;
    post.dof.maxCoc = 22;
    tiltW = id === 'dawn' ? lerp(.08, .02, ss(seg(t, T.narrow[0], T.narrow[1]))) : .08;
    focusObj = subj;
    post.bloom.strength = .6 + .5 * fl; post.bloom.threshold = .8; renderer.toneMappingExposure = 1.3 + .35 * dawn;
    post.vig.uniforms.warm.value = lerp(.04, .18, dawn); post.vig.uniforms.sat.value = 1.08;
  }
  // sound events for the mixer: each window lighting (a door opening and feet), the cottage last
  const events = [...H.map((h, i) => ({ t: h.lightAt, type: 'winLight', i, pan: Math.max(-1, Math.min(1, h.x / 30)) })), { t: cotLightAt, type: 'winLight', i: 99, pan: 1 },
    ...V.map((v, k) => ({ t: v.t0 - .3, type: 'doorOpen', i: k, pan: Math.max(-1, Math.min(1, v.pts[0].x / 30)) }))];
  return { scene, update, focus: () => focusObj, events, tiltW: () => tiltW };
}
