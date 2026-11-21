// The town set of C 「칠십 년 치 꿈」: the same diorama (the tower on its mound, three rows of half-timbered houses, the cottage).
// A chimney now pokes out of the tower's roof. 노을's dreams spout from it and fly to every house: each window takes a dream
// colour (some show the dream itself: a fish in a hat, in shadow); then the last dream puts the same small keeper with her
// lantern in every window. In the morning the villagers come to the tower door; 노을 comes out, puzzled.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, ground, billboard, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, ridge } from './kit.js';
import { sky, stars, particles, flick } from './fx.js';
import { makeChar, makeVillager, colorMoths } from './chars.js';
import { T, DREAMS, BLUE, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const FS = window.FILM_SIZE || [innerWidth, innerHeight], PORT = FS[1] > FS[0], FOVK = PORT ? 1.65 : 1;
const AMBER = new THREE.Color('#ffae55'), VIOLET = new THREE.Color('#b46cff'), KEEP = new THREE.Color('#6f8cff'), DAWN_SKY = new THREE.Color('#f0b080');
const rgb = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };

// window panes (24×32): plain glass, or glass with a dream in shadow — the fish in a hat (two frames), the keeper with her lantern
function winTexs() {
  const F = ramp(['#1a0f0b', '#33200f', '#4d3219']), G = ramp(['#1c1c2a', '#2a2a3c', '#3a3a50']), L = ramp(['#5a5a5a', '#9a9a9a', '#d8d8d8', '#ffffff']);
  const fishM = f => (x, y) => { const cx = 12 + (f ? 1 : 0), cy = 20 - (f ? 1 : 0); const dx = (x - cx) / 6.5, dy = (y - cy) / 4; if (dx * dx + dy * dy < 1) return 1;
    if (x >= cx - 10 && x <= cx - 6 && Math.abs(y - cy) <= (cx - 6 - x) * (f ? .7 : 1) + 1) return 1;                 // tail
    if (x >= cx + 1 && x <= cx + 6 && y >= cy - 8 && y <= cy - 4) return y === cy - 6 ? 0 : 1;                      // top hat (band)
    if (x >= cx - 1 && x <= cx + 8 && y === cy - 4) return 1; return 0; };
  const keepM = (x, y) => { if (y >= 27) return 1; if (y >= 25 && (x % 5) < 3) return 1;                         // the parapet
    if (x >= 9 && x <= 13 && y >= 17 && y < 25) return 1; if (x >= 10 && x <= 12 && y >= 13 && y < 17) return 1;  // body
    if ((x - 11.5) ** 2 + (y - 11) ** 2 < 5) return 1; if (x >= 13 && x <= 15 && y >= 9 && y <= 14 && x - 13 >= (14 - y) * .4) return 1;   // head, arm
    if (x >= 15 && x <= 17 && y >= 5 && y <= 8) return 2; return 0; };                                              // the lantern: bright
  const mk = mask => { const P = new PX(24, 32), E = new PX(24, 32);
    P.fill((x, y) => { const fr = x === 0 || x === 23 || y === 0 || y === 31 || x === 11 || x === 12 || y === 15; if (fr) return F(y === 0 || x === 0 ? .9 : .4, x, y);
      const v = .55 + (1 - y / 32) * .25 + (h2(x, y, 3) - .5) * .25 - (x > 12 && y > 17 ? .25 : 0), mm = mask ? mask(x, y) : 0;
      E.set(x, y, mm === 1 ? [18, 14, 22] : mm === 2 ? [255, 255, 255] : L(v, x, y)); return G(v, x, y); });
    return [texOf(P.done()), texOf(E.done())]; };
  return { plain: mk(null), fish0: mk(fishM(0)), fish1: mk(fishM(1)), keep: mk(keepM) };
}

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
  const scene = new THREE.Scene(), MM = mats(), R = mulberry(7), WT = winTexs();
  scene.fog = new THREE.FogExp2('#141c34', .016);
  const SK = sky({ moonDir: new THREE.Vector3(.35, .32, -1), top: '#050818', mid: '#101d3e', hor: '#2c3a5e' }); scene.add(SK.mesh);
  const ST = stars(900, 11); scene.add(ST);
  const moon = new THREE.DirectionalLight('#8fa8e0', 1.0); moon.position.set(25, 45, -40); moon.target.position.set(0, 0, -4);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -45, right: 45, top: 40, bottom: -40, near: 1, far: 160 }); moon.shadow.bias = -.0006; moon.shadow.normalBias = .02;
  scene.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight('#3a4c7a', '#0a0a12', .9); scene.add(hemi);

  const grass = mat(ground(96, 96, { seed: 21, grass: ['#0b1512', '#132219', '#1d3322', '#2a4730', '#3b5e3c'], dirt: ['#17120f', '#2a2119', '#3f3123', '#56442f'], mask: (u, v) => .62 + .3 * Math.sin(u * 9) * Math.sin(v * 7) }));
  scene.add(mesh(new THREE.BoxGeometry(76, .4, 52).translate(1, -.2, -6), grass));
  const cob = mat(cobbles(96, 96, { seed: 4 }));
  const street = (x0, x1, z0, z1) => scene.add(mesh(new THREE.BoxGeometry(x1 - x0, .08, z1 - z0).translate((x0 + x1) / 2, .04, (z0 + z1) / 2), cob));
  street(-24, 31, -.2, 4.2); street(-9.5, -6.5, -17, -.2); street(5, 8, -17, -.2); street(-26, -18.5, -6, -.2);
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(77, 3, 53).translate(1, -1.9, -6), new THREE.MeshStandardMaterial({ color: '#0c0a10', roughness: 1 })));

  // —— houses ——
  const H = [];
  const add = o => { const hh = house(o); scene.add(hh); const m = new THREE.MeshStandardMaterial({ map: WT.plain[0], emissiveMap: WT.plain[1], emissive: AMBER.clone(), emissiveIntensity: 2.2, roughness: .6 }); hh.userData.windows.forEach(q => q.material = m);
    hh.userData.windows.slice().forEach(q => { if (Math.abs(q.rotation.y) > .1) return; const b = q.clone(); b.position.z = -q.position.z; b.rotation.y = Math.PI; hh.add(b); });
    const gs = []; for (const sgn of [1, -1]) { const gl = glow('#ffae55', 3.2, .9); gl.position.set(0, 1.6, sgn * (o.d / 2 + .9)); hh.add(gl); gs.push(gl); }
    H.push({ g: hh, m, gs, x: o.x, z: o.z }); return hh; };
  add({ x: -14, z: -5.5, w: 5.6, d: 4.6, h: 4.2, wall: 'wall', roof: 'roof', door: 1.3, windows: [[-1.5, 2]], upper: [[-1.2, 3.4], [1.3, 3.4]] });
  add({ x: -3, z: -5.8, w: 5.2, d: 4.4, h: 4.8, wall: 'wall3', roof: 'roof3', door: -1.2, windows: [[1.1, 2]], upper: [[-1.1, 3.8], [1.2, 3.8]] });
  add({ x: 2.4, z: -5.2, w: 4.2, d: 4, h: 3.6, wall: 'wall2', roof: 'roof', chimney: false, windows: [[-.8, 2], [.9, 2]] });
  add({ x: 11.6, z: -5.6, w: 5.6, d: 4.6, h: 4.4, wall: 'wall', roof: 'roof2', door: -1.4, windows: [[1.2, 2.1]], upper: [[-1.2, 3.6], [1.2, 3.6]] });
  add({ x: 17.6, z: -5.4, w: 4.6, d: 4.4, h: 4, wall: 'wall3', roof: 'roof', windows: [[-1, 2], [1, 2]] });
  add({ x: 22.8, z: -5.6, w: 4.4, d: 4.4, h: 4.6, wall: 'wall2', roof: 'roof3', door: 1, windows: [[-1, 2.2]], upper: [[0, 3.8]] });
  add({ x: -12.5, z: 9.4, w: 5.4, d: 4.4, h: 4.2, wall: 'wall3', roof: 'roof2', ry: Math.PI, windows: [[-1.3, 2], [1.3, 2]], upper: [[0, 3.5]] });
  add({ x: -3.5, z: 9.2, w: 5, d: 4.2, h: 3.8, wall: 'wall', roof: 'roof', ry: Math.PI, door: 1.2, windows: [[-1.2, 2]] });
  add({ x: 3.4, z: 9.6, w: 5.4, d: 4.6, h: 4.6, wall: 'wall2', roof: 'roof3', ry: Math.PI, windows: [[-1.3, 2.2], [1.3, 2.2]], upper: [[0, 3.8]] });
  add({ x: 12.4, z: 9.2, w: 5.2, d: 4.2, h: 4, wall: 'wall', roof: 'roof2', ry: Math.PI, door: -1, windows: [[1.2, 2]] });
  add({ x: 18.8, z: 9.6, w: 5, d: 4.6, h: 4.4, wall: 'wall3', roof: 'roof', ry: Math.PI, windows: [[-1.1, 2.1], [1.1, 2.1]] });
  add({ x: -1, z: -14, w: 6, d: 5, h: 5.6, wall: 'wall3', roof: 'roof2', windows: [[-1.5, 2.8], [1.5, 2.8]], upper: [[0, 4.5]] });
  add({ x: 11, z: -13.8, w: 5.4, d: 4.8, h: 5, wall: 'wall', roof: 'roof', windows: [[0, 2.6]], upper: [[-1.2, 4], [1.2, 4]] });
  add({ x: 17.5, z: -14.4, w: 5, d: 4.6, h: 4.4, wall: 'wall2', roof: 'roof3', windows: [[-1, 2.2], [1, 2.2]] });
  const cottage = house({ x: 29.2, z: -3.4, w: 4.4, d: 4, h: 3.1, wall: 'wall3', roof: 'roof3', door: 1, windows: [[-1, 1.7]], rh: 1.9 }); scene.add(cottage);
  { const m = new THREE.MeshStandardMaterial({ map: WT.plain[0], emissiveMap: WT.plain[1], emissive: AMBER.clone(), emissiveIntensity: 2.2, roughness: .6 }); cottage.userData.windows.forEach(q => q.material = m); H.push({ g: cottage, m, gs: [], x: 29.2, z: -3.4 }); }
  const fence = new THREE.Group(); for (let i = 0; i < 9; i++) { const p = box(.12, .8, .12, MM.beam); p.position.set(25.2 + i * .9, 0, 1.7); fence.add(p); } const rail = box(7.4, .1, .1, MM.beam); rail.position.set(28.8, .55, 1.7); fence.add(rail); scene.add(fence);

  // —— the tower, with a chimney through its roof ——
  const stone = mat(rock(96, 96, { seed: 7, cols: ['#17161d', '#28272f', '#3a3843', '#4f4c57', '#67636d'] }));
  scene.add(mesh(new THREE.CylinderGeometry(5.6, 6.6, 1.4, 20).translate(-22, .7, -10), stone));
  const steps = box(2.4, .5, 1.6, stone); steps.position.set(-22, 0, -3.7); scene.add(steps);
  scene.add(mesh(new THREE.CylinderGeometry(2.1, 2.4, 10, 18).translate(-22, 6.4, -10), stone));
  scene.add(mesh(new THREE.CylinderGeometry(2.5, 2.5, .4, 18).translate(-22, 11.4, -10), stone));
  const lroom = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.8, 18, 1, true).translate(-22, 12.5, -10), new THREE.MeshStandardMaterial({ color: '#1a1424', emissive: VIOLET.clone(), emissiveIntensity: 1.2, roughness: .4, side: THREE.DoubleSide }));
  scene.add(lroom);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = box(.16, 1.8, .16, MM.beam); p.position.set(-22 + Math.cos(a) * 1.92, 11.6, -10 + Math.sin(a) * 1.92); scene.add(p); }
  scene.add(mesh(new THREE.ConeGeometry(2.8, 2.6, 18).translate(-22, 14.7, -10), MM.roof2));
  const CH = new THREE.Vector3(-21.05, 16.55, -9.15);   // the chimney's mouth
  const iron = new THREE.MeshStandardMaterial({ color: '#1c1b22', roughness: .5, metalness: .4 });
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 2.4, 10).translate(CH.x, CH.y - 1.2, CH.z), iron); chim.castShadow = true; scene.add(chim);
  scene.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .12, 10).translate(CH.x, CH.y - .02, CH.z), iron));
  const doorPivot = new THREE.Group(); doorPivot.position.set(-22.55, 1.4, -7.62); scene.add(doorPivot);
  const door = box(1.1, 2.0, .14, MM.plankDark); door.position.set(.55, 0, 0); doorPivot.add(door);
  const doorHole = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), new THREE.MeshBasicMaterial({ color: '#2a1a10' })); doorHole.position.set(-22, 2.4, -7.7); scene.add(doorHole);
  const doorLamp = new THREE.PointLight('#ffb050', 5, 7, 2); doorLamp.position.set(-21.1, 3.6, -7.0); scene.add(doorLamp);
  const doorGlow = glow('#ffc070', .9, 1.1); doorGlow.position.set(-21.1, 3.5, -7.4); scene.add(doorGlow);
  const topLight = new THREE.PointLight(VIOLET, 18, 22, 2); topLight.position.set(-22, 12.6, -10); scene.add(topLight);
  const topGlow = glow('#c890ff', 6, 1.2); topGlow.position.set(-22, 12.6, -10); topGlow.material.depthTest = false; topGlow.renderOrder = 5; scene.add(topGlow);
  const chimL = new THREE.PointLight('#ffffff', 0, 12, 2); chimL.position.copy(CH).add(new THREE.Vector3(0, .6, 0)); scene.add(chimL);
  const chimG = glow('#ffffff', 2, 1); chimG.position.copy(CH).add(new THREE.Vector3(0, .4, 0)); scene.add(chimG);

  [[-30, -20], [-27, -2], [-31, 6], [-6, -22], [4, -21], [24, -16], [30, -12], [33, 4], [27, 12], [-20, 14], [-28, 14], [8, 15], [33, -20], [-16, -21]].forEach(([x, z], i) => { const p = pine(i + 3, 3.4 + R() * 2.2); p.position.set(x, 0, z); scene.add(p); });
  for (const [x, z, w, h, c, s] of [[0, -58, 160, 22, '#0b1226', 3], [-30, -72, 140, 30, '#0a0f20', 8], [40, -70, 140, 26, '#0a0f20', 5]]) { const r = ridge(w, h, c, s); r.position.set(x, -2, z); scene.add(r); }

  // —— characters ——
  const N = makeChar('noeul'), Hr = makeChar('haru'); scene.add(N.root, Hr.root);
  const VK = ['woman', 'man', 'baker', 'flower', 'girl', 'oldman'];
  const SPOTS = [[-23.2, -1.1], [-20.8, -1.1], [-24.3, -2.2], [-19.7, -2.2], [-24.0, .2], [-20.0, .3]];
  const VL = VK.map((k, i) => { const v = makeVillager(k); scene.add(v.root); v.spot = SPOTS[i]; v.from = [-13.5 - i * .9, 1.2 + (i % 3) * .8]; v.t0 = T.walkIn[0] + i * .35; v.t1 = v.t0 + 2.6; return v; });
  const lamp = new THREE.PointLight('#ffb050', 6, 11, 2); lamp.castShadow = true; lamp.shadow.bias = -.004; lamp.shadow.mapSize.set(512, 512); scene.add(lamp);
  const halo = glow('#ffc070', 1.1, 1.2); scene.add(halo);
  const fillL = new THREE.PointLight('#9fb2e8', 1.5, 7, 2); scene.add(fillL);

  // —— the night's plan: each house's window position, the order the dreams reach them, its colour ——
  H.forEach(h => { const q = h.g.userData.windows[0]; h.g.updateMatrixWorld(true); h.win = q.getWorldPosition(new THREE.Vector3()); h.nrm = new THREE.Vector3(0, 0, 1).applyQuaternion(q.getWorldQuaternion(new THREE.Quaternion())); });
  const order = H.map((h, i) => [i, Math.hypot(h.x + 22, h.z + 10)]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  H.forEach((h, i) => { const o = order.indexOf(i); h.colAt = T.winStart + o * T.winStep; h.col = new THREE.Color(DREAMS[(i * 2 + 1) % DREAMS.length]); h.keepAt = T.keeperWin + o * .14; h.fish = [1, 3, 2, 7, 9].includes(i); });
  H[1].col = new THREE.Color(DREAMS[0]); H[1].colAt = Math.min(H[1].colAt, 73.6);   // the alley window the boy's quarry dives into: pink, the fish

  // —— the dream moths over the town: three per house from the chimney; the alley trio; the blue keeper dreams ——
  const NT = H.length * 3, NA = 3, NBL = H.length * 2, NTOT = NT + NA + NBL;
  const curl = (i, u, a, b, k, out) => { const s = ss(u), wob = Math.sin(u * Math.PI) * (1.2 + (i % 5) * .3) * k, ph = i * 2.39;
    return out.set(lerp(a.x, b.x, s) + Math.cos(ph + u * 7) * wob, lerp(a.y, b.y, s) + Math.sin(u * Math.PI) * 3.0 * k + Math.sin(ph + u * 9) * wob * .4, lerp(a.z, b.z, s) + Math.sin(ph + u * 7) * wob); };
  const TM = new THREE.Vector3(), hrPos = new THREE.Vector3();
  let mothScale = 1;
  const MS = colorMoths(NTOT, (i, t, o) => {
    o.a = 0; o.f = Math.floor(t * 9 + i * .37) % 2; o.s = .42 * mothScale;
    if (i < NT) { const h = H[(i / 3) | 0], j = i % 3, t0 = T.spout[0] + .2 + ((order.indexOf((i / 3) | 0) * 3 + j) * .09), t1 = h.colAt;
      if (t < t0 || t > T.keeperWin + 4) return; [o.r, o.g, o.b] = [h.col.r, h.col.g, h.col.b];
      const dst = TM.copy(h.win).addScaledVector(h.nrm, .5);
      if (t < t1) curl(i, seg(t, t0, t1), CH, dst, 1.3, TM); else { const ph = i * 1.7; TM.set(dst.x + Math.sin(t * 1.4 + ph) * .5, dst.y + .35 + Math.sin(t * 2 + ph) * .3, dst.z + Math.cos(t * 1.1 + ph) * .4); }
      o.x = TM.x; o.y = TM.y; o.z = TM.z; o.a = ss(seg(t, t0, t0 + .3)) * (1 - ss(seg(t, T.keeperWin + 2, T.keeperWin + 4))); return; }
    if (i < NT + NA) { const j = i - NT; if (t < T.run[0] - .5 || t > 74.2) return; [o.r, o.g, o.b] = rgb(DREAMS[[0, 2, 3][j]]);   // the trio he chases
      const ahead = 1.3 + j * .45 + Math.sin(t * 3 + j) * .2, v = ss(seg(t, 72.9 + j * .2, 73.6 + j * .2));
      TM.set(hrPos.x + ahead, 1.3 + j * .25 + Math.sin(t * 4 + j * 2) * .25, hrPos.z + .3 * Math.sin(t * 2 + j)); TM.lerp(H[1].win.clone().addScaledVector(H[1].nrm, .1), v);
      o.x = TM.x; o.y = TM.y; o.z = TM.z; o.a = 1 - ss(seg(v, .85, 1)); o.s = .34; return; }
    const k = i - NT - NA, h = H[order[(k >> 1) % H.length]], t0 = T.keeperWin - 2.2 + (k >> 1) * .1 + (k & 1) * .25, t1 = h.keepAt;   // the blue ones
    if (t < t0 || t > 98) return; [o.r, o.g, o.b] = [KEEP.r, KEEP.g, KEEP.b];
    const dst = TM.copy(h.win).addScaledVector(h.nrm, .4);
    if (t < t1) curl(k + 3, seg(t, t0, t1), CH, dst, 1.1, TM); else TM.set(dst.x + Math.sin(t * 1.1 + k) * .35, dst.y + .3 + Math.sin(t * 1.6 + k) * .2, dst.z + Math.cos(t * 1.3 + k) * .3);
    o.x = TM.x; o.y = TM.y; o.z = TM.z; o.a = ss(seg(t, t0, t0 + .3)) * (1 - ss(seg(t, T.dawn + 2, T.dawn + 5)));
  });
  scene.add(MS);
  const halos = particles(NTOT, (i, t, o) => { const A = MS.geometry.attributes; o.x = A.position.array[i * 3]; o.y = A.position.array[i * 3 + 1]; o.z = A.position.array[i * 3 + 2]; o.a = A.a.array[i] * .5; o.r = A.col.array[i * 3]; o.g = A.col.array[i * 3 + 1]; o.b = A.col.array[i * 3 + 2]; o.s = .9 * mothScale; }, { soft: 1 });
  scene.add(halos);
  const motes = particles(160, (i, t, o) => { const R2 = h2(i, 1, 4), R3 = h2(i, 2, 4); o.x = -30 + R2 * 62 + Math.sin(t * .2 + i) * 1; o.y = .5 + h2(i, 3, 4) * 7 + Math.sin(t * .4 + i * 1.3) * .3; o.z = -20 + R3 * 34; o.a = .22; o.s = .06; o.r = .7; o.g = .75; o.b = 1; }, { soft: 1 }); scene.add(motes);

  // —— shots ——
  const CAM = {
    title: { p: track([[0, [-7, 16.5, 16]], [6.2, [-9, 14, 13.5]]]), l: track([[0, [-19, 6, -8]], [6.2, [-20, 5.5, -8]]]), fov: 32 },
    chimney: { p: track([[0, [-15.6, 17.6, -1.8]], [4.6, [-14.4, 18.4, -.4]]]), l: track([[0, [-20.9, 17.0, -8.9]], [2.4, [-19.0, 18.6, -7.4]], [4.6, [-14.5, 16.5, -4.5]]]), fov: 34 },
    map: { p: track([[0, [3, 62, -4.0]], [8, [3, 57, -4.0]]]), l: track([[0, [3.01, 0, -4]], [8, [3.01, 0, -4]]]), fov: 36 },
    alley: { fov: 30 },
    allWindows: { p: track([[0, [17, 6.0, 5.0]], [5, [15.6, 5.8, 4.6]]]), l: track([[0, [-14, 4.0, -5.0]], [5, [-14, 4.0, -5.0]]]), fov: 34 },
    morning: { p: track([[0, [-22.0, 2.1, 6.2]], [11.6, [-22.0, 2.0, 5.2]]]), l: track([[0, [-22.0, 1.3, -1.6]], [11.6, [-22.0, 1.3, -1.6]]]), fov: 32 },
    door: { p: track([[0, [-21.7, 3.7, 3.0]], [6.6, [-21.8, 3.5, 1.8]], [14.6, [-21.9, 3.2, .2]]]), l: track([[0, [-22.0, 1.4, -4.6]], [14.6, [-22.0, 1.9, -5.6]]]), fov: 32 },
  };
  const up = new THREE.Vector3();
  const walkH = (t, rate = 10) => ['hw0', 'hw1', 'hw2', 'hw3'][Math.floor(t * rate) % 4];
  const walkN = (t, rate = 7) => ['nw0', 'nw1', 'nw2', 'nw3'][Math.floor(t * rate) % 4];
  const walkV = (t, rate = 7, k = 0) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * rate + k) % 4];

  let focusObj = null, tiltW = .08;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id;
    const dawn = ss(seg(t, T.dawn, T.dawn + 6)), morn = ss(seg(t, 95.4, 99));
    scene.fog.color.set('#141c34').lerp(new THREE.Color('#6a5a6e'), dawn).lerp(new THREE.Color('#9aa0b4'), morn);
    scene.fog.density = lerp(.016, .009, dawn);
    SK.u.top.value.set('#050818').lerp(new THREE.Color('#2c3e6a'), dawn).lerp(new THREE.Color('#5a86c8'), morn); SK.u.mid.value.set('#101d3e').lerp(new THREE.Color('#7a6a8c'), dawn).lerp(new THREE.Color('#a8c4e8'), morn);
    SK.u.hor.value.set('#2c3a5e').lerp(DAWN_SKY, dawn).lerp(new THREE.Color('#f4dcc0'), morn); SK.u.moonI.value = 1 - dawn;
    ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = 1 - dawn;
    moon.color.set('#8fa8e0').lerp(new THREE.Color('#ffc49a'), dawn).lerp(new THREE.Color('#fff0d8'), morn); moon.intensity = lerp(1.7, 2.8, dawn) + morn * .8;
    moon.position.set(lerp(25, 60, dawn), lerp(45, 16, dawn) + morn * 14, lerp(-40, -6, dawn) + morn * 20);
    hemi.color.set('#46598c').lerp(new THREE.Color('#c8b4cc'), dawn).lerp(new THREE.Color('#d8e0f0'), morn); hemi.intensity = lerp(2.0, 2.6, dawn) + morn * .6;
    // —— windows: amber → the dream colour (with a pop); the fish in some; then the keeper in every one; daylight dims them ——
    H.forEach(h => {
      const g = ss(seg(t, h.colAt, h.colAt + .35)), pop = t > h.colAt ? Math.exp(-(t - h.colAt) / .25) : 0, kp = ss(seg(t, h.keepAt, h.keepAt + .3));
      h.m.emissive.copy(AMBER).lerp(h.col, g).lerp(KEEP, kp);
      const which = t > h.keepAt ? 'keep' : (h.fish && t > h.colAt + .3) ? (Math.floor(t * 2.2) % 2 ? 'fish1' : 'fish0') : 'plain';
      if (h.m.emissiveMap !== WT[which][1]) { h.m.emissiveMap = WT[which][1]; h.m.map = WT[which][0]; }
      h.m.emissiveIntensity = (2.3 + 1.8 * pop + .6 * kp) * (1 - .8 * dawn);
      h.gs.forEach(gl => { gl.material.color.copy(h.m.emissive).multiplyScalar(.9 * (1 + pop) * (1 - dawn * .85)); gl.scale.setScalar(id === 'map' ? 4.6 : id === 'alley' ? 1.7 : 3.2); if (id === 'alley') gl.material.color.multiplyScalar(.5); });
    });
    // the tower top: violet, flashing dream colours through the title and the spout, blue for the last dream
    const tp = flick(t, 2), cyc = new THREE.Color(DREAMS[Math.floor(t * 2.5) % DREAMS.length]);
    const colTop = (id === 'title' || id === 'chimney') ? VIOLET.clone().lerp(cyc, .6) : id === 'allWindows' ? KEEP : VIOLET;
    const nearTop = id === 'chimney' ? .3 : 1;
    topLight.color.copy(colTop); topLight.intensity = 16 * tp * (1 - dawn * .7) * (id === 'chimney' ? .5 : 1);
    topGlow.material.depthTest = !(id === 'title' || id === 'map'); topGlow.material.color.copy(colTop).multiplyScalar(1.1); topGlow.material.opacity = (1 - dawn * .7) * nearTop;
    lroom.material.emissive.copy(colTop); lroom.material.emissiveIntensity = 1.3 * tp * (1 - dawn * .6) * (id === 'chimney' ? .45 : 1);
    doorLamp.intensity = 5 * flick(t, 5) * (1 - dawn); doorGlow.material.opacity = 1 - dawn;
    const spout = t > T.spout[0] && t < T.spout[1] + 1.5 ? 1 : (t > T.keeperWin - 2.2 && t < T.keeperWin + 1) ? .8 : 0;
    chimL.color.copy(t > 80 ? KEEP : cyc); chimL.intensity = spout * 10 * (.8 + .2 * Math.sin(t * 9)); chimG.visible = spout > 0; chimG.material.color.copy(chimL.color); chimG.scale.setScalar(2.2 + .4 * Math.sin(t * 7));
    // —— characters by shot ——
    N.root.visible = false; Hr.root.visible = false; VL.forEach(v => v.root.visible = false);
    let hf = 'hold', hx = 0, hy = 0, hz = 2.2, hflip = false;
    if (id === 'alley') { Hr.root.visible = true; const u = seg(t, T.run[0], T.run[1]); hx = lerp(-10.5, 1.5, u - .12 * Math.max(0, u - .8) / .2); hz = 2.0;
      hf = t < T.run[1] ? walkH(t) : 'hold'; if (t > T.turn) hflip = true; }
    if (id === 'morning' || id === 'door') {
      Hr.root.visible = true; hx = -21.25; hy = .5; hz = -3.45; hf = Math.floor(t * 1.1) % 2 ? 'hold1' : 'hold';
      VL.forEach((v, i) => { v.root.visible = true; const u = seg(t, v.t0, v.t1), x = lerp(v.from[0], v.spot[0], ss(u)), z = lerp(v.from[1], v.spot[1], ss(u));
        v.root.position.set(x, 0, z); const walking = u > 0 && u < 1; const talk = (i === 1 && t > 96.8 && t < 100.6) || (i === 0 && t > 101.2 && t < 106.6);
        v.frame(walking ? walkV(t, 7, i) : talk ? (Math.floor(t * 4) % 2 ? 'idle1' : 'idle0') : (Math.floor(t * .7 + i) % 5 === 0 ? 'blink' : 'idle0'));
        v.flip = walking ? true : v.spot[0] > -22; });
      N.root.visible = t > T.doorOpen + .2; const u = ss(seg(t, T.noeulOut[0], T.noeulOut[1]));
      N.root.position.set(-22.0, 1.4, lerp(-7.9, -6.35, u));
      N.frame(t < T.noeulOut[1] ? walkN(t) : (Math.floor(t * .8) % 4 === 0 ? 'puzzledB' : 'puzzled'));
    }
    doorPivot.rotation.y = -1.5 * ss(seg(t, T.doorOpen, T.doorOpen + .9));
    Hr.root.position.set(hx, hy, hz); hrPos.copy(Hr.root.position);

    // —— camera ——
    const C = CAM[id] || CAM.title; cam.fov = C.fov * FOVK; cam.updateProjectionMatrix();
    if (id === 'alley') { const x = Hr.root.position.x; cam.up.set(0, 1, 0); cam.position.set(x - .2, 1.75, 5.6); cam.lookAt(x + .55, 1.95, -3.0); }
    else { const top = id === 'map' ? 1 : 0;
      cam.up.set(0, 1, 0).lerp(PORT ? up.set(-1, 0, 0) : up.set(0, 0, -1), top).normalize();
      cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); }
    if (id !== 'map') cam.up.set(0, 1, 0);
    Hr.face(cam, hflip); N.face(cam, false); VL.forEach(v => v.face(cam, v.flip));
    Hr.frame(hf);
    // —— the lantern light ——
    const lampAt = Hr.lanternPos(hf, hflip), toCam = cam.position.clone().sub(lampAt).setY(0).normalize();
    lamp.position.copy(lampAt).addScaledVector(toCam, .6); lamp.intensity = Hr.root.visible ? (id === 'alley' ? 4.5 : 2.2) * flick(t, 3) * (1 - .7 * morn) : 0;
    halo.position.copy(lampAt); halo.visible = Hr.root.visible; halo.scale.setScalar(id === 'alley' ? .7 : .35); halo.material.opacity = (id === 'alley' ? .8 : .45) * (1 - .6 * morn);
    fillL.position.copy(Hr.root.position).add(new THREE.Vector3(.6, 1.6, 2.2)); fillL.intensity = 1.5;
    // —— swarms ——
    mothScale = id === 'map' ? 7 : id === 'allWindows' ? 2.2 : id === 'chimney' ? 1.6 : 1;
    MS.userData.update(t); halos.userData.update(t); motes.userData.update(t);
    // —— focus ——
    const subj = id === 'title' ? new THREE.Vector3(-21, 5, -8) : id === 'map' ? new THREE.Vector3(3, 0, -4) : id === 'chimney' ? CH.clone() : id === 'allWindows' ? new THREE.Vector3(-4, 2.5, -5.5)
      : id === 'morning' ? new THREE.Vector3(-22, 1.0, -1.2) : id === 'door' ? (t < T.doorOpen ? new THREE.Vector3(-21.5, 1.0, -2.6) : N.root.position.clone().setY(2.3)) : Hr.root.position.clone().setY(.9);
    post.dof.focus = cam.position.distanceTo(subj);
    post.dof.aper = id === 'title' ? 800 : id === 'map' ? 380 : id === 'chimney' ? 420 : id === 'allWindows' ? 520 : 240;
    post.dof.maxCoc = 22; tiltW = .08;
    focusObj = id === 'map' ? null : subj;
    post.bloom.strength = .62 + .2 * spout; post.bloom.threshold = .8; renderer.toneMappingExposure = 1.3 + .3 * dawn + .1 * morn;
    post.vig.uniforms.warm.value = lerp(.02, .16, dawn); post.vig.uniforms.sat.value = 1.08;
  }
  const events = [
    ...H.map((h, i) => ({ t: h.colAt, type: 'winColor', i, pan: Math.max(-1, Math.min(1, h.x / 30)) })),
    ...H.map((h, i) => ({ t: h.keepAt, type: 'winKeep', i, pan: Math.max(-1, Math.min(1, h.x / 30)) })),
    { t: T.spout[0], type: 'spout' }, { t: T.doorOpen, type: 'doorOpen' },
    ...VL.map((v, i) => ({ t: v.t0, t1: v.t1, type: 'villagerWalk', i })),
  ];
  return { scene, update, focus: () => focusObj, events, tiltW: () => tiltW };
}
