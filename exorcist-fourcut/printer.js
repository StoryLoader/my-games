// 네 컷 — the print slot (macro): a strip rises out of the booth's slot line by line (the newest printed line always at
// the slot); the back of a strip on 지은's palm where the title is stamped; the receipt that prints the last words.
import * as THREE from 'three';
import { V, grey, glow, add, box, canvasTex, printMat, paperCanvas } from './kit.js';
import { SW, SH } from './prints.js';

const STRIP_W = 0.052, STRIP_H = STRIP_W * SH / SW;
export function buildPrinter() {
  const scene = new THREE.Scene();
  const MET = grey(0.14, { r: 0.45 }), DARK = grey(0.03, { r: 0.6 });
  // the machine's top: a dark metal deck with a slot, a lip, screws; the wall behind in shadow
  box(scene, 0.42, 0.03, 0.2, 0, -0.015, 0, MET);
  box(scene, 0.42, 0.5, 0.03, 0, -0.27, 0.1, grey(0.2, { r: 0.6 }));
  box(scene, 0.09, 0.006, 0.012, 0, 0.002, 0, DARK);
  box(scene, 0.1, 0.012, 0.004, 0, 0.004, 0.012, grey(0.35, { r: 0.35, m: 0.5 }));
  [-0.15, 0.15].forEach(x => add(scene, new THREE.CylinderGeometry(0.007, 0.007, 0.004, 12), grey(0.45, { r: 0.3, m: 0.6 })).position.set(x, 0.002, 0.06));
  add(scene, new THREE.PlaneGeometry(2, 2), grey(0.1), { screen: true }).position.set(0, 0.3, -0.25);
  // the strip (its texture is set per print); the visible part grows from the slot upward
  const stripGeo = new THREE.PlaneGeometry(1, 1);
  const strip = add(scene, stripGeo, grey(0.9), { cast: false }); strip.position.set(0, 0, 0.001);
  let stripTex = null;
  const stripMats = new Map();   // one texture + material per print, made once (switching prints never re-uploads or re-compiles)
  function setStrip(P) {
    if (!stripMats.has(P)) { const tx = P.tex.clone(); tx.needsUpdate = true; stripMats.set(P, { tx, m: printMat(tx, { bias: 0.5, key: 'slot' }) }); }
    const e = stripMats.get(P); stripTex = e.tx; strip.material = e.m;
  }
  function emerge(L) {   // L: length out of the slot (m)
    L = Math.max(0.0005, Math.min(STRIP_H, L));
    strip.scale.set(STRIP_W, L, 1); strip.position.y = L / 2 + 0.003;
    if (stripTex) { stripTex.repeat.set(1, L / STRIP_H); stripTex.offset.set(0, 1 - L / STRIP_H); }
  }
  // the lamp above (the booth's light leaking over the deck): hard light, long shadow of the paper on the wall
  const lamp = new THREE.SpotLight(0xffffff, 2.6, 2, 0.5, 0.4, 1.2); lamp.position.set(0.12, 0.5, 0.35); lamp.target.position.set(0, 0.05, 0); scene.add(lamp, lamp.target);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004;
  // —— the palm with the strip's back for the title stamp (a separate little stage at x = 2) ——
  const palm = new THREE.Group(); palm.position.set(2, 0, 0); scene.add(palm);
  const hand = add(palm, new THREE.SphereGeometry(0.05, 16, 12), grey(0.78)); hand.scale.set(1.4, 0.35, 1.9); hand.position.set(0, -0.01, 0);
  const back = add(palm, new THREE.PlaneGeometry(STRIP_W, STRIP_H).rotateX(-Math.PI / 2), grey(0.92), { cast: false }); back.position.set(0, 0.012, 0); back.rotation.y = 0.06;
  const stampC = paperCanvas(360, 1120, (g, put) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 360, 1120);
    g.save(); g.translate(180, 560); g.rotate(-0.04);
    g.strokeStyle = '#000'; g.lineWidth = 16; g.strokeRect(-140, -330, 280, 660);
    g.fillStyle = '#000'; g.font = '230px "Black Han Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('네', 0, -150); g.fillText('컷', 0, 170); g.restore();
    put('stampA', '네', 180, 410, 'stamp', 230, { align: 'center', color: 'rgba(0,0,0,0)' }); put('stampB', '컷', 180, 730, 'stamp', 230, { align: 'center', color: 'rgba(0,0,0,0)' });
  });
  const stampM = add(palm, new THREE.PlaneGeometry(STRIP_W, STRIP_H).rotateX(-Math.PI / 2), printMat(canvasTex(stampC.canvas), { bias: 0.5, key: 'stamp' }), { cast: false });
  stampM.position.set(0, 0.0125, 0); stampM.rotation.y = 0.06; stampM.visible = false;
  const pl = new THREE.SpotLight(0xffffff, 2.4, 2, 0.6, 0.5, 1.2); pl.position.set(2.15, 0.45, 0.2); pl.target.position.set(2, 0, 0); scene.add(pl, pl.target); pl.castShadow = true;
  // —— the receipt for the last words (prints from the same slot as a wide paper) ——
  const rc = paperCanvas(480, 640, (g, put) => {
    put('e0', '사진관 24', 240, 80, 'mono', 44, { align: 'center', weight: 700 });
    g.fillStyle = '#000'; for (let x = 30; x < 450; x += 16) g.fillRect(x, 112, 8, 4);
    put('e1', '네 컷', 240, 260, 'stamp', 120, { align: 'center' });
    put('e2', '다음 이야기', 240, 400, 'stamp', 70, { align: 'center' });
    put('e3', '2026.11.21  02:23', 240, 540, 'mono', 34, { align: 'center', weight: 700 });
  });
  const RW_ = 0.08, RH_ = RW_ * 640 / 480;
  const receiptTex = canvasTex(rc.canvas);
  const receipt = add(scene, new THREE.PlaneGeometry(1, 1), printMat(receiptTex, { bias: 0.55, text: true, key: 'receipt' }), { cast: false }); receipt.position.set(0, 0, 0.0012); receipt.visible = false;
  function receiptOut(L) { L = Math.max(0.0005, Math.min(RH_, L)); receipt.scale.set(RW_, L, 1); receipt.position.y = L / 2 + 0.003; receiptTex.repeat.set(1, L / RH_); receiptTex.offset.set(0, 1 - L / RH_); }
  const cams = { slot: new THREE.PerspectiveCamera(30, 540 / 960, 0.02, 10), palm: new THREE.PerspectiveCamera(30, 540 / 960, 0.02, 10) };
  return { scene, cams, setStrip, emerge, strip, stampM, receipt, receiptOut, STRIP_H, RH: RH_, lamp, rcLines: rc.lines, stampLines: stampC.lines };
}
