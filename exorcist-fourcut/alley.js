// 네 컷 — the alley at 2 a.m.: a dead-end lane, dark walls, wet ground, and at its end the only bright thing — the
// photo booth's white shop front and its light box. People in front of it are silhouettes with a rim (rim in the dark);
// a street lamp behind the camera gives faces a little light for the dialogue.
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, rod, canvasTex, printMat, paperCanvas } from './kit.js';
import { figure } from './people.js';
import { mulberry } from '/core/lib.js';

export function buildAlley() {
  const scene = new THREE.Scene(); const R = mulberry(7);
  const WALL = grey(0.3, { r: 0.95 }), WALL2 = grey(0.22, { r: 0.95 }), GROUND = grey(0.28, { r: 0.35 }), DARK = grey(0.05);
  add(scene, new THREE.PlaneGeometry(6, 30).rotateX(-Math.PI / 2), GROUND, { screen: true }).position.set(0, 0, -2);
  // facades on both sides: blocks of different depth, dark windows, a few pipes and meters
  for (const side of [-1, 1]) for (let z = 8; z > -8; ) {
    const d = 2 + R() * 2.6, h = 5 + R() * 5;
    const f = box(scene, 0.4, h, d, side * (2.3 + R() * 0.2), h / 2, z - d / 2, side < 0 ? WALL : WALL2, { screen: true });
    for (let y = 2.4; y < h - 0.6; y += 1.6) for (let k = 0; k < Math.floor(d / 1.1); k++) if (R() < 0.75) box(scene, 0.06, 0.7, 0.55, side * 2.08, y, z - 0.5 - k * 1.1, DARK);
    if (R() < 0.5) rod(scene, V(side * 2.05, 0, z - 0.3), V(side * 2.05, h, z - 0.3), 0.04, grey(0.4));
    z -= d;
  }
  // a power pole with two thick cables, a parked scooter (silhouettes)
  cyl(scene, 0.12, 0.14, 8, -1.7, 4, -3.5, grey(0.35), 12);
  rod(scene, V(-1.7, 7, -3.5), V(2.2, 6.4, -6.5), 0.025, DARK, 6); rod(scene, V(-1.7, 6.6, -3.5), V(2.2, 5.9, 1), 0.025, DARK, 6);
  const sc = new THREE.Group(); sc.position.set(1.55, 0, -4.4); sc.rotation.y = 0.4; scene.add(sc);
  box(sc, 0.32, 0.45, 1.3, 0, 0.42, 0, grey(0.25, { r: 0.4 })); cyl(sc, 0.25, 0.25, 0.12, 0, 0.25, 0.55, DARK, 16).rotation.z = Math.PI / 2; cyl(sc, 0.25, 0.25, 0.12, 0, 0.25, -0.55, DARK, 16).rotation.z = Math.PI / 2; rod(sc, V(0, 0.6, 0.6), V(0, 1.05, 0.5), 0.03, DARK);
  // the shop front at the end of the lane: white glass (the brightest thing), dark frame, a door, the light box
  const SHOP_Z = -8;
  box(scene, 4.6, 4, 0.3, 0, 2, SHOP_Z - 0.2, WALL2, { screen: true });
  const glass = add(scene, new THREE.PlaneGeometry(3.0, 2.3), glow(1), { flat: true, cast: false, recv: false }); glass.position.set(0, 1.25, SHOP_Z - 0.04);
  [-1.5, -0.5, 0.5, 1.5].forEach(x => box(scene, 0.07, 2.4, 0.08, x, 1.25, SHOP_Z, DARK)); box(scene, 3.1, 0.08, 0.08, 0, 2.42, SHOP_Z, DARK); box(scene, 3.1, 0.12, 0.08, 0, 0.06, SHOP_Z, DARK);
  box(scene, 0.04, 2.2, 0.04, 0.12, 1.15, SHOP_Z + 0.02, DARK);   // door handle bar
  const signC = paperCanvas(900, 220, (g, put) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 220); put('sign', '사진관 24', 450, 160, 'stamp', 150, { align: 'center' }); g.lineWidth = 14; g.strokeRect(14, 14, 872, 192); });
  const sign = add(scene, new THREE.PlaneGeometry(2.4, 0.59), new THREE.MeshBasicMaterial({ map: canvasTex(signC.canvas) }), { flat: true, cast: false, recv: false }); sign.position.set(0, 2.95, SHOP_Z + 0.02);
  box(scene, 2.5, 0.68, 0.1, 0, 2.95, SHOP_Z - 0.04, DARK);
  // light: the shop's white light pours down the lane (long shadows toward the camera); a weak street lamp behind us
  const shop = new THREE.SpotLight(0xffffff, 40, 30, 0.75, 0.5, 1.2); shop.position.set(0, 1.6, SHOP_Z - 0.6); shop.target.position.set(0, 0, 0); scene.add(shop, shop.target);
  shop.castShadow = true; shop.shadow.mapSize.set(2048, 2048); shop.shadow.bias = -0.0005; shop.shadow.normalBias = 0.02;
  const street = new THREE.SpotLight(0xffffff, 6, 14, 0.8, 0.6, 1.2); street.position.set(0.8, 4.2, 1.5); street.target.position.set(-0.2, 1, -6); scene.add(street, street.target); street.castShadow = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 0.06));
  // people
  const jieun = figure('jieun'), seoha = figure('seoha'), mujin = figure('mujin');
  jieun.root.position.set(-0.55, 0, -6.6); jieun.root.rotation.y = 0.5;
  seoha.root.position.set(0.25, 0, -5.9); seoha.root.rotation.y = -0.6;
  mujin.root.position.set(0.95, 0, -6.4); mujin.root.rotation.y = -0.4;
  scene.add(jieun.root, seoha.root, mujin.root);
  // the strip in 지은's hand (texture set later)
  const stripM = add(scene, new THREE.PlaneGeometry(0.052, 0.162), grey(0.9), { cast: false });
  const cams = { glide: new THREE.PerspectiveCamera(38, 540 / 960, 0.05, 60), two: new THREE.PerspectiveCamera(30, 540 / 960, 0.05, 60) };
  return { scene, cams, jieun, seoha, mujin, stripM, shop, street, SHOP_Z, signLines: signC.lines, sign };
}
