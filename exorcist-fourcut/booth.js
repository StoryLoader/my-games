// 네 컷 — the photo booth shop (사진관 24): the shooting booth (lens + ring light + preview screen facing the subject,
// the dark backdrop curtain behind her where the girl stands one step closer each frame) and the waiting room (the wall
// of customer strips, the printed rules beside the entrance curtain, the 2003 missing poster in a halftone screen).
// Coordinates: metres; the booth's lens wall at z=-1.6 faces -z; the subject sits at z≈-2.35 facing +z.
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, canvasTex, printMat, halftoneMat, paperCanvas } from './kit.js';
import { L_FLAT, L_SCREEN } from './pipe.js';
import { figure, MATS } from './people.js';
import { clamp, lerp, seg, ss, mulberry } from '/core/lib.js';

export const LENS = V(0, 1.42, -1.64);
export const GHOST_Z = [-3.18, -2.95, -2.78, -2.08];   // the four steps toward the lens
export function buildBooth() {
  const scene = new THREE.Scene();
  const R = mulberry(24);
  const texts = [];
  const WALL = grey(0.55), DARKW = grey(0.2), FLOOR = grey(0.32, { r: 0.7 }), MET = grey(0.18, { r: 0.4 }), CURT = grey(0.11, { r: 0.95 });
  // —— floor, ceiling, shop walls ——
  add(scene, new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2), FLOOR, { screen: true }).position.set(0.8, 0, -1);
  add(scene, new THREE.PlaneGeometry(8, 8).rotateX(Math.PI / 2), grey(0.4), { screen: true, cast: false }).position.set(0.8, 2.45, -1);
  const back = add(scene, new THREE.PlaneGeometry(4, 2.5), grey(0.03), { screen: true }); back.position.set(0.8, 1.25, -3.25);   // behind the backdrop: dark
  const right = add(scene, new THREE.PlaneGeometry(5, 2.5).rotateY(-Math.PI / 2), WALL, { screen: true }); right.position.set(2.45, 1.25, -1);
  const left = add(scene, new THREE.PlaneGeometry(5, 2.5).rotateY(Math.PI / 2), DARKW, { screen: true }); left.position.set(-0.75, 1.25, -1);
  // —— the shooting booth: walls (x ±0.72, z -3.2 .. -1.58) ——
  const BW = grey(0.62, { r: 0.8 });
  box(scene, 1.46, 2.2, 0.05, 0, 1.1, -1.58, BW);                       // lens wall
  box(scene, 0.05, 2.2, 1.62, 0.72, 1.1, -2.39, BW).visible = true;      // outer side wall (the waiting room sees this side)
  const opening = box(scene, 0.06, 2.2, 0.6, 0.72, 1.1, -2.65, DARKW); opening.visible = false;
  box(scene, 1.46, 0.06, 1.62, 0, 2.2, -2.39, BW);                       // booth ceiling
  // the backdrop: two dark curtain halves with a gap (x≈0.32) where the girl first shows
  const BACKDROP = grey(0.72, { r: 0.95 });
  const curtain = (w, x, seed) => { const g = new THREE.PlaneGeometry(w, 2.15, 48, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x0 = p.getX(i); p.setZ(i, Math.sin(x0 * 30 + seed) * 0.03 + Math.sin(x0 * 11 + seed * 2) * 0.02); } g.computeVertexNormals(); const m = add(scene, g, BACKDROP); m.position.set(x, 1.08, -3.12); return m; };
  curtain(0.9, -0.23, 1); curtain(0.32, 0.56, 4);   // a gap at x≈0.36: the dark behind
  // the entrance curtain on the outer side wall (opened → closed)
  const entG = new THREE.PlaneGeometry(0.62, 2.0, 40, 1); { const p = entG.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 34) * 0.025); entG.computeVertexNormals(); }
  const ent = add(scene, entG, CURT); ent.rotation.y = Math.PI / 2; ent.position.set(0.76, 1.02, -2.62);
  // —— lens wall details: camera module, lens, ring light, preview screen ——
  box(scene, 0.42, 0.52, 0.08, 0, 1.42, -1.62, MET);
  const lens = cyl(scene, 0.06, 0.06, 0.05, 0, 1.46, -1.66, grey(0.03, { r: 0.2 }), 24); lens.rotation.x = Math.PI / 2;
  const ring = add(scene, new THREE.TorusGeometry(0.16, 0.018, 8, 40), glow(1), { flat: true, cast: false, recv: false }); ring.position.set(0, 1.46, -1.665);
  const scrC = document.createElement('canvas'); scrC.width = 432; scrC.height = 324;
  const scrTex = canvasTex(scrC, { mip: false, nearest: true });
  const screen = add(scene, new THREE.PlaneGeometry(0.32, 0.24), new THREE.MeshBasicMaterial({ map: scrTex }), { flat: true, cast: false, recv: false });
  screen.rotation.y = Math.PI; screen.position.set(0, 1.12, -1.665);
  const scrRim = box(scene, 0.36, 0.28, 0.02, 0, 1.12, -1.655, grey(0.05));
  // rules on the booth's outer wall, beside the entrance (printed cards: the picture, not captions)
  const rules = paperCanvas(560, 760, (g, put) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 560, 96); put('', '안내', 280, 70, 'stamp', 60, { color: '#fff', align: 'center' });
    put('r1', '촬영이 시작되면', 280, 250, 'stamp', 64, { align: 'center' }); put('r1b', '멈출 수 없습니다', 280, 340, 'stamp', 64, { align: 'center' });
    g.fillRect(40, 400, 480, 8);
    put('r2', '촬영 중', 280, 520, 'stamp', 64, { align: 'center' }); put('r2b', '뒤를 돌아보지 마세요', 280, 610, 'stamp', 58, { align: 'center' });
    put('', '사진관 24', 280, 720, 'mono', 40, { align: 'center', weight: 700 });
  });
  const rulesM = add(scene, new THREE.PlaneGeometry(0.42, 0.57), printMat(canvasTex(rules.canvas), { bias: 0.55, text: true, key: 'rules' }), { cast: false });
  rulesM.rotation.y = Math.PI / 2; rulesM.position.set(0.752, 1.42, -1.98);
  rules.lines.forEach(l => texts.push({ ...l, mesh: rulesM, cw: 560, ch: 760, pw: 0.42, ph: 0.57 }));
  // the print slot beside the rules (the strip drops out here)
  box(scene, 0.06, 0.16, 0.3, 0.76, 0.98, -1.95, MET);
  // —— the waiting room: the wall of strips (filled in by setPhotos), the missing poster, a ceiling lamp ——
  const photoMeshes = [];
  for (let c = 0; c < 15; c++) for (let r = 0; r < 4; r++) {
    const m = add(scene, new THREE.PlaneGeometry(0.052, 0.16), grey(0.9), { cast: false }); m.rotation.y = -Math.PI / 2;
    m.position.set(2.43, 1.0 + r * 0.24 + (R() - .5) * 0.03, -2.9 + c * 0.17 + (R() - .5) * 0.03); m.rotation.x = (R() - .5) * 0.08; photoMeshes.push(m);
  }
  const posterM = add(scene, new THREE.PlaneGeometry(0.3, 0.42), grey(0.9), { cast: false }); posterM.rotation.y = -Math.PI / 2; posterM.position.set(2.43, 1.35, -0.05);
  const lampL = new THREE.SpotLight(0xffffff, 4.5, 6, 0.95, 0.6, 1.2); lampL.position.set(1.7, 2.4, -1.2); lampL.target.position.set(2.2, 0.8, -1.4); scene.add(lampL, lampL.target);
  lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); lampL.shadow.bias = -0.0006;
  add(scene, new THREE.BoxGeometry(0.9, 0.04, 0.18), glow(1), { flat: true, cast: false, recv: false }).position.set(1.7, 2.42, -1.2);
  // —— inside light: the key from the lens (the ring light), very little fill ——
  const key = new THREE.SpotLight(0xffffff, 1.5, 5, 0.75, 0.35, 1.2); key.position.set(0, 1.5, -1.75); key.target.position.set(0, 1.25, -2.6); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
  const fill = new THREE.HemisphereLight(0xffffff, 0x222222, 0.12); scene.add(fill);
  // —— people ——
  const seoha = figure('seoha'); seoha.root.position.set(0.0, 0, -2.52); scene.add(seoha.root);
  const ghost = figure('ghost'); scene.add(ghost.root);
  const mujin = figure('mujin'); mujin.root.position.set(1.25, 0, -2.4); mujin.root.rotation.y = -Math.PI / 2; scene.add(mujin.root);
  const mina = figure('mina'), boy = figure('boy'); scene.add(mina.root, boy.root);
  // the hand mirror (round, a bright face)
  const mirror = new THREE.Group(); scene.add(mirror);
  add(mirror, new THREE.CylinderGeometry(0.075, 0.075, 0.012, 28).rotateX(Math.PI / 2), grey(0.12, { r: 0.4 }));
  add(mirror, new THREE.CircleGeometry(0.066, 28), glow(0.95), { flat: true, cast: false }).position.z = 0.007;
  add(mirror, new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), grey(0.12)).position.y = -0.12;
  mirror.visible = false;
  // —— cameras ——
  const cams = {
    lens: new THREE.PerspectiveCamera(36, 540 / 960, 0.05, 30),
    frame: new THREE.PerspectiveCamera(50, 4 / 3, 0.05, 30),       // what the booth's camera records (a 4:3 frame, a wide lens a metre away)
    shoulder: new THREE.PerspectiveCamera(34, 540 / 960, 0.03, 30),
    room: new THREE.PerspectiveCamera(42, 540 / 960, 0.05, 30),
  };
  cams.frame.position.copy(LENS).add(V(0, 0.04, -0.03)); cams.frame.lookAt(0, 1.42, -2.7);
  // —— states for a shot or for a print ——
  const placeGhost = (step, o = {}) => {
    ghost.root.visible = step >= 0; if (step < 0) return;
    const z = GHOST_Z[Math.min(3, Math.floor(step))], x = [0.31, 0.52, 0.2, 0.0][Math.min(3, Math.floor(step))];
    ghost.root.position.set(x, step >= 3 ? -0.12 : 0, z); ghost.root.rotation.y = 0;
    ghost.pose({ armR: step === 2 ? [-1.25, 0, 0.6, -0.4] : [0, 0, -0.06, -0.1], armL: [0, 0, 0.06, -0.1], headX: step >= 3 ? -0.12 : 0.18, headZ: step === 0 ? 0.12 : 0, expr: step >= 3 ? 'smile' : 'neutral' });
    ghost.veil.visible = !o.unveil && step >= 1;   // in the gap (step 0) her face shows, pale in the dark
  };
  function state(s = {}) {
    // s: { who: 'seoha'|'couple'|'none', ghost: -1..3, seohaExpr, mujin: bool, mirror, unveil, entOpen }
    const who = s.who ?? 'seoha';
    seoha.root.visible = who === 'seoha'; mina.root.visible = boy.root.visible = who === 'couple';
    if (who === 'couple') { mina.root.position.set(-0.19, 0, -2.5); boy.root.position.set(0.2, 0, -2.58); mina.pose({ armR: [-0.6, 0, -0.9, -2.2], headZ: 0.12, expr: 'smile' }); boy.pose({ armL: [-0.3, 0, 0.5, -0.8], headZ: -0.06, expr: 'smile' }); }
    seoha.pose({ expr: s.seohaExpr || 'stern', armR: s.mirror ? [-1.35, 0, -0.25, -0.35] : s.seohaArmR, armL: s.seohaArmL, headY: s.seohaHeadY || 0, headX: s.seohaHeadX || 0 });
    placeGhost(s.ghost ?? -1, s);
    mujin.root.visible = !!s.mujin;
    if (s.mujin) mujin.pose(s.mujinPose || { armR: [-1.6, 0.2, -0.3, -0.2], armL: [-1.5, -0.2, 0.3, -0.2], expr: 'shout', lean: 0.12 });
    mirror.visible = !!s.mirror; if (s.mirror) { mirror.position.set(0.04, 1.46, -1.82); mirror.rotation.set(0, Math.PI, 0); }
    ent.visible = !s.entOpen; key.intensity = s.flash ? 14 : 1.5;
  }
  // the preview screen: what the lens sees, small, plus the count and the frame number (a canvas)
  function drawScreen(img, count, frameNo) {
    const g = scrC.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 432, 324);
    if (img) { g.save(); g.translate(432, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, 432, 324); g.restore(); }   // mirrored, like a selfie preview
    g.fillStyle = '#000'; g.fillRect(0, 0, 432, 46); g.fillStyle = '#fff'; g.font = '700 32px D2Coding'; g.textBaseline = 'middle';
    if (frameNo) { g.textAlign = 'left'; g.fillText(`${frameNo}/4`, 14, 24); }
    g.textAlign = 'right'; g.fillText('사진관 24', 418, 24);
    if (count) { g.font = '220px "Black Han Sans"'; g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#000'; g.strokeText(count, 216, 200); g.fillStyle = '#fff'; g.fillText(count, 216, 200); }
    scrTex.needsUpdate = true;
  }
  return {
    scene, cams, state, drawScreen, seoha, ghost, mujin, mina, boy, mirror, screen, ent, key, lampL, ring, photoMeshes, posterM, rulesM, texts,
    setPhotos(list) { photoMeshes.forEach((m, i) => { m.material = list[i % list.length].mat; }); },
    setPoster(mat) { posterM.material = mat; },
  };
}
