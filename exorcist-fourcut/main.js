// 네 컷 — 1-bit Dither. Page contract: window.READY, window.render(t), window.DUR, window.TEXTS(t), window.EV, window.PREWARM.
// render(t) depends only on t. Three sets (printer, alley, booth) are built once; the photographs are printed at load
// from the booth set. Transitions stay two-ink: hard cuts, inversion strikes, a fax-scan wipe, a coarse-cell resolve.
import * as THREE from 'three';
import { Pipe, Present, RW, RH } from './pipe.js';
import { V, screenBox } from './kit.js';
import { DUR, SHOTS, T, VO, shotAt, b, BEAT } from './story.js';
import { buildBooth, LENS } from './booth.js';
import { buildPrinter } from './printer.js';
import { buildAlley } from './alley.js';
import { makePrints, posterMats, FW, FH } from './prints.js';
import { clamp, lerp, seg, ss, eio, monotone, track, hash } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
window.DUR = DUR;
const INK = '#121416', PAPER = '#e3e7e1';
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(canvas.width, canvas.height, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const pipe = new Pipe(renderer), present = new Present(renderer, INK, PAPER);
const rtA = pipe.target(), rtB = pipe.target();
await Promise.all(['40px "Black Han Sans"', '700 40px D2Coding', '800 40px "Nanum Myeongjo"', '700 40px Pretendard'].map(f => document.fonts.load(f, '네컷사진관24찾습니다')));

// —— sets, prints ——
const booth = buildBooth(), printer = buildPrinter(), alley = buildAlley();
const P = makePrints(renderer, booth);
booth.setPhotos(P.wall);
const poster = posterMats(P); booth.setPoster(poster.paper);
const pPhoto = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2 * FH / FW), poster.photo); pPhoto.rotation.y = -Math.PI / 2; pPhoto.position.set(2.425, 1.37, -0.05); booth.scene.add(pPhoto);
alley.stripM.material = P.mina.mat;
const TRAP_I = 7 * 4 + 1;   // the wall slot where 서하 pins the trap strip (and where the camera falls in at the end)
const trapMesh = booth.photoMeshes[TRAP_I];
// the strip 서하 / 무진 hold in the booth room
const handStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.052, 0.162), P.trap.mat); handStrip.castShadow = true; booth.scene.add(handStrip); handStrip.visible = false;
// the preview screen's own little camera pass
const scrPipe = new Pipe(renderer, FW, FH), scrRT = scrPipe.target();
const scrBuf = new Uint8Array(FW * FH * 4), scrC = document.createElement('canvas'); scrC.width = FW; scrC.height = FH; const scrG = scrC.getContext('2d'), scrImg = scrG.createImageData(FW, FH);
function screenPass(t, count, frameNo, ghostOnScreenOnly) {
  const gv = booth.ghost.root.visible; booth.screen.visible = false;
  if (ghostOnScreenOnly) booth.ghost.root.visible = true;
  if (window.__NODRAW) { booth.screen.visible = true; booth.ghost.root.visible = gv; return; }
  scrPipe.render(booth.scene, booth.cams.frame, scrRT, { lo: 0.04, hi: 0.85 });
  renderer.readRenderTargetPixels(scrRT, 0, 0, FW, FH, scrBuf);
  let mean = 0; for (let i = 1; i < scrBuf.length; i += 4) mean += scrBuf[i]; mean /= FW * FH;   // a two-level preview: tone above the frame's mean is paper
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const s = ((FH - 1 - y) * FW + x) * 4, d = (y * FW + x) * 4; const v = scrBuf[s + 1] > mean * 1.15 + 6 ? 255 : 0; scrImg.data[d] = scrImg.data[d + 1] = scrImg.data[d + 2] = v; scrImg.data[d + 3] = 255; }
  scrG.putImageData(scrImg, 0, 0);
  booth.screen.visible = true; booth.ghost.root.visible = gv;
  booth.drawScreen(scrC, count, frameNo);
}
const look = (cam, p, l, fov) => { cam.position.set(...p); cam.lookAt(...l); if (fov) { cam.fov = fov; cam.updateProjectionMatrix(); } };
const path = keys => { const f = track(keys); return t => f(t); };

// —— the shots ——
const step12 = t => Math.floor(t * 12) / 12;
const S = {};
S.print = (t, strip = P.mina, a = T.printA[0], z = T.printA[1]) => {
  if (printer._strip !== strip) { printer.setStrip(strip); printer._strip = strip; }
  printer.strip.visible = true; printer.receipt.visible = false; printer.stampM.visible = false;
  const rows = Math.floor(seg(t, a, z) * 560); printer.emerge(rows / 560 * printer.STRIP_H);
  const u = ss(seg(t, a, z + 0.4));
  const lookY = lerp(0.03, printer.STRIP_H * 0.52, u), dist = lerp(0.2, 0.36, u);
  look(printer.cams.slot, [0.004, lookY + 0.012, dist], [0, lookY, 0], 30);
  return { scene: printer.scene, cam: printer.cams.slot, o: { lo: 0.05, hi: 0.8 } };
};
S.two = t => {
  const c = alley.cams.two, u = ss(seg(t, 8.75, 18.75));
  const J = alley.jieun, SE = alley.seoha;
  J.pose({ armR: [-1.15, -0.2, -0.35, -1.0], headY: -0.5, headX: 0.12, expr: t < 15 ? 'neutral' : 'stern' });
  SE.pose({ headX: 0.35, headY: 0.15, expr: 'stern', armL: [-0.4, 0, 0.2, -1.2] });
  alley.mujin.pose({ headX: 0.2 });
  // the strip in 지은's raised right hand
  J.armR.H.updateWorldMatrix(true, false); const hp = new THREE.Vector3(); J.armR.H.getWorldPosition(hp);
  alley.stripM.position.copy(hp).add(V(0.02, 0.07, 0.03)); alley.stripM.lookAt(c.position); alley.stripM.visible = true;
  look(c, [lerp(0.66, 0.5, u), 1.5, lerp(-5.05, -5.35, u)], [lerp(-0.36, -0.4, u), lerp(1.42, 1.5, u), -6.5], lerp(40, 30, u));
  return { scene: alley.scene, cam: c, o: { lo: 0.03, hi: 0.75 } };
};
S.title = t => {
  printer.strip.visible = false; printer.receipt.visible = false;
  const on = t >= T.stamp; printer.stampM.visible = on;
  const pop = on && t < T.stamp + 2 / 30 ? 1.18 : 1; printer.stampM.scale.set(pop, 1, pop);
  look(printer.cams.palm, [2.01, 0.31, 0.07], [2, 0, 0], 32);
  return { scene: printer.scene, cam: printer.cams.palm, o: { lo: 0.05, hi: 0.8 } };
};
S.glide = t => {
  const c = alley.cams.glide, u = seg(t, 22.5, 35);
  const p = monotone([[0, 5.0], [1, -2.6]]), y = monotone([[0, 0.2], [0.6, 0.35], [1, 0.75]]);
  alley.stripM.visible = false;
  alley.jieun.pose({ headY: 0.2 }); alley.seoha.pose({ expr: 'stern', headY: 0.3 });
  const talk = t > 23.8 && t < 33.2; alley.mujin.pose({ armR: talk ? [-0.6 - 0.15 * Math.sin(t * 2), 0, -0.2, -0.9] : undefined, headY: -0.3 });
  look(c, [0.15 - u * 0.1, y(u), p(eio(u))], [0, lerp(1.2, 1.5, u), -8], 38);
  return { scene: alley.scene, cam: c, o: { lo: 0.04, hi: 0.78 } };
};
function room(state) { booth.state(state); if (typeof fallBeads !== 'undefined') { fallBeads.forEach(m => m.visible = false); booth.mujin.beads.forEach(m => m.visible = true); } handStrip.visible = false; booth.lampL.intensity = 4.5; booth.ring.visible = true; rimLight.intensity = 0; booth.mina.root.visible = booth.boy.root.visible = false; booth.seoha.root.visible = true; }
S.wall = t => {
  room({ ghost: -1, mujin: false, entOpen: false });
  booth.seoha.root.position.set(1.55, 0, -1.6); booth.seoha.root.rotation.y = Math.PI / 2 - 0.3; booth.seoha.pose({ expr: 'stern', headY: 0.2 });
  trapMesh.material = P.wall[TRAP_I % P.wall.length].mat;
  // a face on the wall blinks: one strip shows closed eyes for three frames
  const bl = booth.photoMeshes[3 * 4 + 2]; bl.material = (t > T.blink && t < T.blink + 0.12) ? P.blank.mat : P.wall[(3 * 4 + 2) % P.wall.length].mat;
  const c = booth.cams.room;
  if (t < T.posterIn) { const u = ss(seg(t, 35, T.posterIn)); look(c, [1.95, 1.48, lerp(-2.9, -1.2, u)], [2.43, 1.35, lerp(-2.6, -0.9, u)], 40); }
  else { const u = ss(seg(t, T.posterIn, T.posterIn + 1.6)); look(c, [lerp(1.95, 1.5, u), 1.37, lerp(-1.2, -0.06, u)], [2.43, 1.36, lerp(-0.9, -0.05, u)], lerp(40, 34, u)); }
  return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8 } };
};
S.curtain = t => {
  const inn = t > T.enter;
  room({ ghost: -1, mujin: true, mujinPose: { headY: -0.3, expr: 'stern' }, entOpen: t < T.entClose });
  booth.mujin.root.position.set(1.3, 0, -2.98); booth.mujin.root.rotation.y = -Math.PI / 2 + 0.55;
  const sx = inn ? lerp(1.0, 0.45, seg(t, T.enter, T.entClose)) : 1.05;
  booth.seoha.root.position.set(sx, 0, -2.62); booth.seoha.root.rotation.y = -Math.PI / 2 + (inn ? 0 : 0.6); booth.seoha.root.visible = t < T.entClose;
  booth.seoha.pose({ expr: 'stern', headY: inn ? 0 : 0.5, walk: inn ? t * 1.6 : null });
  const c = booth.cams.room, u = ss(seg(t, 46.25, 52));
  look(c, [lerp(2.3, 2.2, u), 1.5, lerp(-0.3, -0.55, u)], [0.8, 1.32, lerp(-2.15, -2.3, u)], 42);
  return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8 } };
};
const flashAt = t => T.flash.findIndex(f => t >= f && t < f + 0.4);
S.lens1 = t => {
  const n = t < T.flash[0] ? 0 : 1;   // ghost step during the count
  const fl = flashAt(t) >= 0;
  room({ ghost: n, seohaExpr: 'stern', flash: fl, entOpen: false });
  booth.seoha.root.position.set(0, 0, -2.52); booth.seoha.root.rotation.y = 0; booth.seoha.root.visible = true;
  booth.seoha.pose({ expr: 'stern', headX: -0.05 });
  const c = booth.cams.lens, u = ss(seg(t, 55, 66.25));
  look(c, [0.03, 1.47, -1.72], [0.1, lerp(1.42, 1.48, u), -2.6], lerp(42, 36, u));
  return { scene: booth.scene, cam: c, o: { lo: 0.04, hi: 0.82, exp: fl ? 3.5 : 1 } };
};
S.outside = t => {
  room({ ghost: -1, mujin: true, entOpen: false });
  booth.mujin.root.position.set(1.08, 0, -2.62); booth.mujin.root.rotation.y = -1.25;
  booth.mujin.pose({ armR: [-1.45, 0.25, -0.2, -0.25 - 0.05 * Math.sin(t * 13)], armL: [-1.4, -0.25, 0.2, -0.3], expr: 'shout', lean: 0.18 + 0.03 * Math.sin(t * 9) });
  booth.seoha.root.visible = false;
  const c = booth.cams.room, u = ss(seg(t, 66.25, 71.25));
  look(c, [lerp(2.25, 2.15, u), 1.6, lerp(-1.35, -1.5, u)], [0.88, 1.45, -2.62], lerp(42, 36, u));
  return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8 } };
};
S.shoulder = t => {
  const hand = t > T.hand, fl = flashAt(t) >= 0;
  room({ ghost: 2, seohaExpr: 'stern', flash: fl, entOpen: false });
  booth.seoha.root.position.set(0, 0, -2.52); booth.seoha.root.rotation.y = 0; booth.seoha.root.visible = true;
  const count = T.count3.reduce((a, x, i) => t >= x ? ['3', '2', '1'][i] : a, '');
  // the girl is only on the screen: invisible in the room, visible to the lens
  const eyes = t >= 77.2 && t < 81.4;
  if (!eyes) { booth.ghost.root.visible = false; if (hand) screenPass(t, t < 83.55 ? count : '', 3, true); else { const gv = booth.ghost.root; gv.visible = false; booth.ghost.root.position.x = 0.9; screenPass(t, '', 3, false); } }
  booth.seoha.pose({ expr: 'stern', headY: t > 73.6 && t < 77 ? -0.08 : 0 });
  const c = booth.cams.shoulder;
  if (eyes) { const u = ss(seg(t, 77.2, 81.4)); look(c, [0.02, 1.6, -1.98], [0, 1.59, -2.4], lerp(30, 25, u)); }
  else { const u = ss(seg(t, 71.25, 77.2)); look(c, [-0.3, 1.56, lerp(-2.5, -2.4, u)], [0.0, 1.2, -1.66], lerp(40, 32, u)); }
  return { scene: booth.scene, cam: c, o: { lo: 0.04, hi: 0.82, exp: fl ? 3.5 : 1 } };
};
S.lens4 = t => {
  const fl = flashAt(t) >= 0, mir = t >= T.mirror[0];
  const st = seg(t, 85.4, 88.3);
  const gs = ss(st);
  room({ ghost: 2, seohaExpr: t > 88.9 ? 'shout' : 'stern', flash: fl, entOpen: false, mirror: mir, ghostPos: [lerp(0.3, 0.2, gs), 0, lerp(-2.78, -2.66, gs)] });
  booth.seoha.root.position.set(0, 0, -2.52); booth.seoha.root.rotation.y = 0; booth.seoha.root.visible = true;
  booth.ghost.pose({ armL: [-1.2, 0, lerp(-0.35, -0.55, gs), -0.4], headX: 0.1, headZ: lerp(0, -0.12, gs), expr: st >= 1 ? 'smile' : 'neutral' });
  const mu = ss(seg(t, T.mirror[0], T.mirror[1]));
  booth.seoha.pose({ expr: t > 88.9 ? 'shout' : 'stern', armR: [lerp(0, -0.7, mu), 0, lerp(-0.1, -0.8, mu), lerp(-0.1, -1.95, mu)] });
  if (mir) { booth.seoha.armR.H.updateWorldMatrix(true, false); const hp = new THREE.Vector3(); booth.seoha.armR.H.getWorldPosition(hp); booth.mirror.position.set(lerp(hp.x, 0.02, mu), lerp(hp.y + 0.12, 1.56, mu), lerp(hp.z + 0.03, -2.24, mu)); booth.mirror.rotation.set(0, 0, 0); }
  const c = booth.cams.lens, u = ss(seg(t, 85, 93.75));
  look(c, [0.03, 1.5, -1.72], [0.06, 1.5, -2.6], lerp(48, 42, u));
  return { scene: booth.scene, cam: c, o: { lo: 0.04, hi: 0.82, exp: fl ? 5 : 1 } };
};
S.release = t => {
  room({ ghost: -1, mujin: true, mujinPose: { headY: 0.4, expr: 'stern' }, entOpen: true, who: 'seoha' });
  booth.mujin.root.position.set(1.0, 0, -2.95); booth.mujin.root.rotation.y = Math.PI / 2;
  // the wall lets its people go: strips turn blank one after another; 민아 and her boyfriend on the floor
  booth.photoMeshes.forEach((m, i) => { const tt = T.freed[0] + hash(i * 3.1) * (T.freed[1] - T.freed[0]); m.material = t > tt ? P.blank.mat : P.wall[i % P.wall.length].mat; });
  const out = t > T.freed[0] + 0.6;
  booth.mina.root.visible = booth.boy.root.visible = out;
  booth.mina.root.position.set(2.17, -0.5, -2.35); booth.mina.root.rotation.set(0, -Math.PI / 2 + 0.2, 0); booth.mina.pose({ expr: 'closed', lean: 0.35, headZ: 0.3, armL: [-0.6, 0, 0.3, -1.0] });
  booth.boy.root.position.set(2.15, -0.55, -2.8); booth.boy.root.rotation.set(0, -Math.PI / 2 - 0.1, 0); booth.boy.pose({ expr: 'closed', lean: 0.4, headZ: -0.35 });
  // 서하 with the printed strip; at "끝." she pins it to the wall
  booth.seoha.root.visible = true; booth.seoha.root.position.set(2.0, 0, -1.42); booth.seoha.root.rotation.y = Math.PI / 2 + 0.25;
  const pinned = t > T.pin;
  booth.seoha.pose({ expr: 'stern', armR: pinned ? [-1.3, 0.3, -0.2, -0.3] : [-0.9, 0, -0.2, -1.3], headY: pinned ? 0.2 : -0.3 });
  if (pinned) trapMesh.material = P.trap.mat; else trapMesh.material = P.blank.mat;
  if (!pinned) { booth.seoha.armR.H.updateWorldMatrix(true, false); const hp = new THREE.Vector3(); booth.seoha.armR.H.getWorldPosition(hp); handStrip.material = P.trap.mat; handStrip.visible = true; handStrip.position.copy(hp).add(V(0.02, 0.08, 0)); handStrip.rotation.set(0, Math.PI / 2 + 0.5, 0); }
  booth.mina.root.visible = booth.boy.root.visible = out;
  const c = booth.cams.room, u = ss(seg(t, 93.75, 101.25));
  look(c, [lerp(1.12, 1.2, u), 1.42, lerp(0.3, 0.12, u)], [2.35, lerp(1.0, 1.2, u), lerp(-1.9, -1.7, u)], 46);
  return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8 } };
};
S.print2 = t => S.print(t, P.fifth, T.printB[0], T.printB[1]);
S.mujin = t => {   // an insert on the fifth sheet in his hand, then his face
  room({ ghost: -1, mujin: true, entOpen: false });
  booth.photoMeshes.forEach(m => m.material = P.blank.mat); trapMesh.material = P.trap.mat;
  booth.mujin.root.position.set(1.42, 0, -1.6); booth.mujin.root.rotation.y = Math.PI;
  const ins = t < 111.6, lower = ss(seg(t, 111.6, 112.4));
  booth.mujin.pose({ armR: [lerp(-1.0, -0.45, lower), 0, -0.55, lerp(-1.0, -0.9, lower)], expr: 'stern', headX: lerp(0.35, 0.05, lower), headY: 0.05 });
  booth.seoha.root.visible = false;
  booth.mujin.armR.H.updateWorldMatrix(true, false); const hp = new THREE.Vector3(); booth.mujin.armR.H.getWorldPosition(hp);
  handStrip.material = P.fifth.mat; handStrip.visible = true; handStrip.position.copy(hp).add(V(0, 0.09, -0.03)); handStrip.rotation.set(-0.15, Math.PI, 0);
  const c = booth.cams.room;
  if (ins) { const u = ss(seg(t, 108.75, 111.6)), p = handStrip.position; look(c, [p.x + 0.01, p.y + lerp(0.035, -0.035, u), p.z - 0.3], [p.x, p.y + lerp(0.035, -0.035, u), p.z], 26); }
  else { const u = ss(seg(t, 111.6, 115)); look(c, [lerp(1.38, 1.4, u), 1.62, lerp(-2.6, -2.45, u)], [1.42, 1.64, -1.6], lerp(32, 28, u)); }
  return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8, exp: ins ? 2.6 : 1 } };
};
// the beads that fall when the string snaps (world-space copies; the ones on his fist hide)
const fallBeads = Array.from({ length: 8 }, (_, i) => { const m = booth.mujin.beads[0].clone(); m.visible = false; booth.scene.add(m); return m; });
S.door = t => {
  room({ ghost: -1, mujin: true, entOpen: t > T.out - 0.4 });
  booth.photoMeshes.forEach(m => m.material = P.blank.mat); trapMesh.material = P.trap.mat;
  booth.mujin.root.position.set(1.64, 0, -2.06); booth.mujin.root.rotation.y = -2.21;
  const grip = ss(seg(t, 118.2, 118.9));
  booth.mujin.pose({ armR: [lerp(-0.4, -0.75, grip), 0, -0.15, lerp(-0.9, -1.5, grip)], expr: 'stern', headY: 0.1 });
  const w = ss(seg(t, T.out, T.out + 1.4));
  booth.seoha.root.visible = t > T.out - 0.3; booth.seoha.root.position.set(lerp(0.5, 1.0, w), 0, lerp(-2.62, -2.5, w)); booth.seoha.root.rotation.y = lerp(Math.PI / 2, 0.9, w);
  booth.seoha.pose({ expr: t > 116.2 ? 'smile' : 'neutral', walk: w > 0 && w < 1 ? t * 1.6 : null, headY: lerp(0, 0.35, w) });
  booth.mujin.armR.H.updateWorldMatrix(true, false); const hp = new THREE.Vector3(); booth.mujin.armR.H.getWorldPosition(hp);
  const snapped = t >= T.snap; booth.mujin.beads.forEach(m => m.visible = !snapped);
  fallBeads.forEach((m, i) => {
    m.visible = snapped; if (!snapped) return;
    const dt = t - T.snap, a = i / 8 * Math.PI * 2, vx = Math.cos(a) * 0.5, vz = Math.sin(a) * 0.4, vy = 0.3 + hash(i) * 0.5;
    const y = hp.y - 0.03 + vy * dt - 4.9 * dt * dt;
    m.position.set(hp.x + vx * dt, Math.max(0.018, y), hp.z + vz * dt);
  });
  const c = booth.cams.room;
  if (t < 118.85) { const u = ss(seg(t, 115, 118.85)); look(c, [lerp(1.85, 1.8, u), 1.6, lerp(-1.45, -1.55, u)], [0.9, 1.42, -2.58], lerp(36, 30, u)); }
  else look(c, [hp.x + 0.12, hp.y + 0.12, hp.z + 0.36], [hp.x - 0.02, hp.y - 0.08, hp.z], 40);
  return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8 } };
};
S.fall = t => {
  const c = booth.cams.room;
  if (t < T.resolve[0]) {   // push into the pinned strip's fourth frame (log distance), its print dots grow to fill the frame
    room({ ghost: -1, mujin: false, entOpen: false }); booth.seoha.root.visible = false;
    booth.photoMeshes.forEach(m => m.material = P.blank.mat); trapMesh.material = P.trap.mat;
    trapMesh.updateWorldMatrix(true, false); const tp = new THREE.Vector3(); trapMesh.getWorldPosition(tp);
    const fy = tp.y - 0.162 * (0.5 - (20 + 3 * 260 + 120) / 1120);   // frame 4 centre
    const u = seg(t, T.push[0], T.push[1]), d = Math.exp(lerp(Math.log(0.9), Math.log(0.012), ss(u)));
    look(c, [tp.x - d, fy, tp.z], [tp.x, fy, tp.z], 34);
    return { scene: booth.scene, cam: c, o: { lo: 0.05, hi: 0.8 } };
  }
  // inside the mirror: the real 서하, hands against the glass, shouting; then the light goes out but for one rim
  room({ ghost: -1, seohaExpr: 'shout', entOpen: false, mujin: false });
  booth.photoMeshes.forEach(m => m.material = P.blank.mat);
  booth.seoha.root.visible = true; booth.seoha.root.position.set(0, 0, -2.3); booth.seoha.root.rotation.y = 0;
  const bang = Math.sin(t * 9) > 0.7 ? 0.1 : 0;
  booth.seoha.pose({ expr: 'shout', armR: [-1.5 + bang, 0, 0.25, -1.5], armL: [-1.5 + bang, 0, -0.25, -1.5], headX: 0.05, lean: 0.08 });
  const dark = t > T.dark; booth.key.intensity = dark ? 0 : 1.1; booth.lampL.intensity = dark ? 0 : 4.5; booth.ring.visible = !dark;
  rimLight.intensity = dark ? 7 : 1.5;
  look(booth.cams.lens, [0, 1.56, -1.72], [0, 1.52, -2.4], 42);
  const cell = t < T.resolve[1] ? [32, 16, 8, 4, 2, 1][Math.min(5, Math.floor(seg(t, T.resolve[0], T.resolve[1]) * 6))] : 1;
  return { scene: booth.scene, cam: booth.cams.lens, o: { lo: dark ? 0.02 : 0.04, hi: 0.82, cell }, ring: true };
};
const rimLight = new THREE.SpotLight(0xffffff, 0, 4, 0.5, 0.3, 1.2); rimLight.position.set(0.15, 1.95, -3.0); rimLight.target.position.set(0, 1.45, -2.3); booth.scene.add(rimLight, rimLight.target);
// the mirror's rim in front of the lens for the inside shot
const rimRing = new THREE.Mesh(new THREE.RingGeometry(0.0128, 0.4, 64), new THREE.MeshBasicMaterial({ color: 0x050505 })); rimRing.visible = false; booth.cams.lens.add(rimRing); rimRing.position.set(0, 0, -0.06); booth.scene.add(booth.cams.lens);
S.end = t => {
  printer.strip.visible = false; printer.stampM.visible = false; printer.receipt.visible = true;
  const rows = Math.floor(seg(t, T.receipt[0], T.receipt[1]) * 160); printer.receiptOut(rows / 160 * printer.RH);
  const u = ss(seg(t, T.receipt[0], T.receipt[1] + 0.4));
  const ly = lerp(0.03, printer.RH * 0.5, u), d = lerp(0.22, 0.3, u);
  look(printer.cams.slot, [0, ly + 0.01, d], [0, ly, 0], 30);
  return { scene: printer.scene, cam: printer.cams.slot, o: { lo: 0.05, hi: 0.8 } };
};

// inversion strikes: the four flashes (the last one three frames), the stamp, the beads
const INV = [[T.flash[0], 2], [T.flash[1], 2], [T.flash[2], 2], [T.flash[3], 3], [T.stamp, 2], [T.snap, 2]];
const inverted = t => INV.some(([x, n]) => t >= x && t < x + n / 30 + 1e-4);
const WIPE = [b(206) - 0.35, b(206)];   // fax-scan wipe from the dark into the receipt
function draw(id, t, out) { const r = S[id](t); rimRing.visible = !!r.ring; if (!window.__NODRAW) pipe.render(r.scene, r.cam, out, r.o); return r; }
let lastShot = null;
window.render = function (t) {
  t = Math.max(0, Math.min(DUR - 1e-4, +t || 0));
  if (t >= WIPE[0] && t < WIPE[1]) { draw('fall', t, rtA); draw('end', T.receipt[0], rtB); if (!window.__NODRAW) present.draw(rtA, rtB, seg(t, WIPE[0], WIPE[1]), false, 2, 0); lastShot = 'end'; return; }
  const s = shotAt(t); draw(s[0], t, rtA); if (!window.__NODRAW) present.draw(rtA, null, 0, inverted(t)); lastShot = s[0];
};
// readable text on screen at t (1080p px): the rules, the poster, the sign, the stamp, the receipt
window.TEXTS = t => { window.render(t); return []; };
// sound events
const EV = [];
const rowsEv = (a, z, n, tag) => { for (let i = 0; i < n; i++) EV.push({ t: +(a + (z - a) * i / n).toFixed(3), type: 'row', tag }); };
rowsEv(T.printA[0], T.printA[1], 56, 'A'); rowsEv(T.printB[0], T.printB[1], 56, 'B'); rowsEv(T.receipt[0], T.receipt[1], 20, 'R');
T.flash.forEach((x, i) => EV.push({ t: x, type: 'flash', i }));
EV.push({ t: T.stamp, type: 'stamp' }, { t: T.blink, type: 'blink' }, { t: T.entClose, type: 'curtain' }, { t: T.hand, type: 'hand' }, { t: T.mirror[0], type: 'mirror' },
  { t: T.freed[0], type: 'freed' }, { t: T.pin, type: 'pin' }, { t: T.out, type: 'curtainOpen' }, { t: T.snap, type: 'snap' }, { t: T.push[0], type: 'push' }, { t: T.resolve[0], type: 'through' },
  { t: T.dark, type: 'dark' }, { t: WIPE[0], type: 'wipe' });
for (const s of SHOTS) EV.push({ t: s[2], type: 'cut', id: s[0] });
for (const [id, at] of VO) EV.push({ t: at, type: 'voice', id });
EV.sort((a, z) => a.t - z.t);
window.EV = EV;
window.PREWARM = SHOTS.map(s => (s[2] + s[3]) / 2);
window.render(Q.get('t') ? +Q.get('t') : 11);
if (Q.get('show')) {   // debug: printed sheets side by side at their true aspect (k = dots, k.tone = continuous tone)
  const names = Q.get('show').split(','), c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const g = c.getContext('2d');
  g.fillStyle = '#777'; g.fillRect(0, 0, 1920, 1080); g.imageSmoothingEnabled = false; let x = 10;
  for (const n of names) { const [k, kind] = n.split('.'); const src = k === 'scr' ? scrC : kind === 'tone' ? (P[k].tone || P[k].canvas) : P[k].canvas; const h = 1060, w = Math.round(src.width / src.height * h); g.drawImage(src, x, 10, w, h); x += w + 12; }
  c.style.cssText = 'position:absolute;left:0;top:0;width:100vw;height:100vh;z-index:9'; document.body.appendChild(c);
}
if (Q.get('cast')) {
  const { figure } = await import('./people.js');
  const cs = new THREE.Scene(), kinds = [['seoha', 'stern'], ['mujin', 'stern'], ['ghost', 'smile'], ['ghost', 'neutral'], ['jieun', 'neutral']];
  const figs = kinds.map(([k]) => { const f = figure(k); cs.add(f.root); return f; });
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 1 })); bd.position.set(0, 1.5, -0.6); bd.receiveShadow = true; cs.add(bd);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(6, 4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 })); fl.receiveShadow = true; cs.add(fl);
  const kl = new THREE.SpotLight(0xffffff, 6, 8, 0.6, 0.5, 1.2); kl.position.set(1.2, 2.6, 2.4); kl.target.position.set(0, 1, 0); kl.castShadow = true; cs.add(kl, kl.target, new THREE.HemisphereLight(0xffffff, 0x222222, 0.25));
  const cc = new THREE.PerspectiveCamera(30, 540 / 960, 0.05, 30);
  window.render = t => {
    const i = Math.min(4, Math.floor(t)); figs.forEach((f, j) => f.root.visible = j === i);
    const f = figs[i]; f.root.rotation.y = 0.45 * Math.sin(t * Math.PI); f.pose({ expr: kinds[i][1] }); if (f.veil) f.veil.visible = i !== 3;
    const zoom = t % 1 > 0.5; look(cc, zoom ? [0, 1.5, 0.9] : [0, 0.95, 3.6], zoom ? [0, 1.5, 0] : [0, 0.88, 0], 30);
    pipe.render(cs, cc, rtA, { lo: 0.05, hi: 0.82 }); present.draw(rtA, null, 0, false);
  };
}
window.READY = true;
