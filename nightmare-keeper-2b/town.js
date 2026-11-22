// The town set of 「악몽을 지키는 파수꾼 2 — 열두 번째 등불」: the same diorama as the first film (the tower on its mound, three rows of
// half-timbered houses on a cobbled street, the cottage at the east edge). In this film it is only the wide under the title:
// the town asleep in amber windows, the tower's lantern room breathing violet (the nightmares on its shelf).
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, ground, billboard, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, ridge } from './kit.js';
import { sky, stars, particles, beamCard, flick } from './fx.js';
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

  // dust in the moonlight
  const motes = particles(160, (i, t, o) => { const R2 = h2(i, 1, 4), R3 = h2(i, 2, 4); o.x = -30 + R2 * 62 + Math.sin(t * .2 + i) * 1; o.y = .5 + h2(i, 3, 4) * 7 + Math.sin(t * .4 + i * 1.3) * .3; o.z = -20 + R3 * 34; o.a = .25; o.s = .06; o.r = .7; o.g = .75; o.b = 1; }, { soft: 1 }); scene.add(motes);
  // the alleys' warm light (not shadow-casting)
  [[-8, 2.6, 2], [6, 2.6, 2], [18, 2.6, 2]].forEach(([x, y, z]) => { const L = new THREE.PointLight(AMBER, 7, 12, 2); L.position.set(x, y, z); scene.add(L); });

  const CAM = { title: { p: track([[0, [-7, 16.5, 16]], [6.0, [-9, 14, 13.5]]]), l: track([[0, [-19, 6, -8]], [6.0, [-20, 5.5, -8]]]), fov: 32 } };
  let focusObj = null;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, C = CAM[shot.id] || CAM.title;
    cam.fov = C.fov * FOVK; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    H.forEach((h, i) => { h.m.emissive.copy(AMBER); h.m.emissiveIntensity = 2.0 + .25 * Math.sin(t * .7 + i); });
    cm.emissive.copy(AMBER);
    lroom.material.emissiveIntensity = 1.1 + .25 * Math.sin(t * 1.6); topLight.intensity = 16 + 3 * Math.sin(t * 1.6);
    doorLamp.intensity = 5 * flick(t, 3);
    motes.userData.update(t);
    const subj = new THREE.Vector3(-21, 5, -8); focusObj = subj;
    post.dof.focus = cam.position.distanceTo(subj); post.dof.aper = 800; post.dof.maxCoc = 22;
    post.bloom.strength = .6; renderer.toneMappingExposure = 1.2;
  }
  return { scene, update, focus: () => focusObj, events: [], tiltW: () => .08 };
}
