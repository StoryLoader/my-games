// The tower set of 「악몽을 지키는 파수꾼 2」: the same round stone room. Shelves of new lanterns hold last night's
// nightmares (violet); the big lantern's pedestal stands empty since it burst; 노을 sleeps in her chair by the desk.
// In the second chapter 하루 opens the shelf lantern by lantern: each nightmare leaves as a firefly and the room turns gold.
import * as THREE from 'three';
import { PX, ramp, h2, texOf, woodPlanks, rock, glow, blob } from './px.js';
import { mats, mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeChar, moths } from './chars.js';
import { T, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const VIOLET = new THREE.Color('#b46cff');
const FOVK = (window.FILM_SIZE ? window.FILM_SIZE[1] > window.FILM_SIZE[0] : innerHeight > innerWidth) ? 1.6 : 1;   // the vertical cut: a taller lens

export function buildTower() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#1a1210', .03);
  scene.background = new THREE.Color('#05040a');
  const stone = mat(rock(96, 96, { seed: 31, cols: ['#141218', '#221f27', '#332f38', '#47424c', '#5d5862'] }));
  const R0 = 4.4;
  // walls (inside of a cylinder), floor, a beam ceiling
  const wallG = new THREE.CylinderGeometry(R0, R0, 8, 28, 1, true).translate(0, 4, 0);
  const wall = mesh(wallG, stone); wall.material = stone.clone(); wall.material.side = THREE.BackSide; scene.add(wall);
  const floor = mesh(new THREE.CylinderGeometry(R0, R0, .2, 28).translate(0, -.1, 0), mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 12 }))); scene.add(floor);
  for (let i = -2; i <= 2; i++) { const b = box(9, .3, .3, MM.beam, { cast: false }); b.position.set(0, 7.4, i * 1.6); scene.add(b); }

  // shelves along the back wall: three tiers, each a run of planks on an arc
  const SH = [], arc = [Math.PI * 1.08, Math.PI * 1.92];
  for (let tier = 0; tier < 3; tier++) {
    const y = 1.1 + tier * 1.25;
    for (let k = 0; k < 9; k++) { const a = arc[0] + (arc[1] - arc[0]) * (k + .5) / 9, r = R0 - .45; const p = box(1.2, .1, .55, MM.plank); p.position.set(Math.cos(a) * r, y, Math.sin(a) * r); p.rotation.y = -a + Math.PI / 2; scene.add(p);
      // a small lantern on each plank: iron cap and base, violet glass
      const L = new THREE.Group(); L.position.set(Math.cos(a) * (r - .05), y + .1, Math.sin(a) * (r - .05));
      const base = box(.34, .06, .34, MM.beam, { cast: false }); L.add(base);
      const g = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .4, 8).translate(0, .26, 0), new THREE.MeshStandardMaterial({ color: '#241a30', emissive: VIOLET, emissiveIntensity: 1.6, roughness: .3 })); L.add(g);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(.21, .16, 8).translate(0, .54, 0), new THREE.MeshStandardMaterial({ color: '#26262e', roughness: .6 })); L.add(cap);
      scene.add(L); SH.push({ L, g, a, y, k, tier, ph: h2(k, tier, 3) * 6 });
    }
  }

  // opening order: from the centre of the shelf outwards
  SH.sort((p, q) => Math.abs(p.k - 4) - Math.abs(q.k - 4) || p.tier - q.tier).forEach((s, i) => { s.openAt = T.shelfOpen0 + i * T.shelfStep; s.idx = i; });
  const shelfLights = [-1, 0, 1].map(i => { const L = new THREE.PointLight(VIOLET, 5, 7, 2); const a = Math.PI * 1.5 + i * .55; L.position.set(Math.cos(a) * 2.8, 2.6, Math.sin(a) * 2.8); scene.add(L); return L; });
  const GOLD = new THREE.Color('#ffd27a'), FIRE = new THREE.Color('#d8ff7a');
  const roomGold = new THREE.PointLight(GOLD, 0, 10, 2); roomGold.position.set(0, 4.2, .4); scene.add(roomGold);
  // the big lantern's pedestal, empty since last night
  const ped = mesh(new THREE.CylinderGeometry(.55, .7, 1.0, 12).translate(0, .5, -.6), stone); scene.add(ped);
  // her desk, candle, chair; the window slit and its moonlight
  const desk = box(1.4, .8, .7, MM.plankDark); desk.position.set(2.5, 0, .8); desk.rotation.y = -.5; scene.add(desk);
  const book = box(.4, .08, .3, MM.beam, { cast: false }); book.position.set(2.4, .8, .8); book.rotation.y = -.3; scene.add(book);
  const candleP = new THREE.Vector3(2.85, 1.02, .55);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .2, 6).translate(candleP.x, .9, candleP.z), new THREE.MeshStandardMaterial({ color: '#efe6d0', emissive: '#ffcf8a', emissiveIntensity: .3 })); scene.add(candle);
  const candleL = new THREE.PointLight('#ffb050', 3.2, 6, 2); candleL.position.copy(candleP).add(new THREE.Vector3(-.3, .25, .4)); scene.add(candleL);
  const candleG = glow('#ffc070', .5, 1.4); candleG.position.copy(candleP).add(new THREE.Vector3(0, .1, 0)); scene.add(candleG);
  const chair = new THREE.Group(); chair.add(box(.6, .5, .6, MM.plank)); const back = box(.6, .9, .1, MM.plank); back.position.set(0, .5, -.25); chair.add(back); chair.position.set(1.8, 0, 1.6); chair.rotation.y = -.9; scene.add(chair);
  const winA = Math.PI * .92, winP = new THREE.Vector3(Math.cos(winA) * (R0 - .02), 4.6, Math.sin(winA) * (R0 - .02));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.6), new THREE.MeshBasicMaterial({ color: '#9fb8ff' })); pane.position.copy(winP); pane.lookAt(0, 4.6, 0); scene.add(pane);
  const beam = beamCard(6.5, .6, 2.2, '#8fa8e0', { k: .32, fall: 1.1 }); scene.add(beam);
  const moonSpot = new THREE.SpotLight('#8fa8e0', 22, 14, .45, .6, 1.5); moonSpot.position.copy(winP); moonSpot.target.position.set(.6, 0, 1.2); scene.add(moonSpot, moonSpot.target);
  scene.add(new THREE.HemisphereLight('#3a3050', '#0a0808', .55));

  // 노을
  const N = makeChar('noeul'); scene.add(N.root);
  const fill = new THREE.PointLight('#9fb2e8', 1.2, 6, 2); scene.add(fill);

  // 하루 (the second chapter: he opens the shelf)
  const Hr = makeChar('haru'); scene.add(Hr.root);

  // nightmares asleep in the lanterns (two violet specks each) until their lantern opens
  const kept = moths(SH.length * 2, (i, t, o) => { const s = SH[i >> 1]; o.a = 0; if (t > s.openAt + .5) return;
    const ph = i * 1.9; o.x = s.L.position.x + Math.sin(t * 2.2 + ph) * .06; o.y = s.L.position.y + .27 + Math.sin(t * 3.1 + ph) * .07; o.z = s.L.position.z + Math.cos(t * 1.7 + ph) * .06;
    o.a = 1 - ss(seg(t, s.openAt, s.openAt + .5)); o.s = .09; o.f = Math.floor(t * 6 + i) % 2; });
  scene.add(kept);
  // fireflies: five out of every lantern, up into the beams, some out through the window slit; they stay through her waking
  const winOut = winP.clone().multiplyScalar(1.25);
  const ffs = particles(SH.length * 5, (i, t, o) => {
    const s = SH[i % SH.length], k = (i / SH.length) | 0, t0 = s.openAt + k * .12; o.a = 0; o.r = .85; o.g = 1; o.b = .5;
    if (t < t0) return;
    const u = t - t0, ph = i * 2.39, rr = 1.2 + (i % 7) * .35, outw = i % 4 === 0;
    const rise = Math.min(1, u / 2.4), sw = ss(rise);
    let x = lerp(s.L.position.x, Math.cos(ph + t * .25) * rr, sw), y = lerp(s.L.position.y + .3, 3.4 + (i % 9) * .45 + Math.sin(t * .8 + ph) * .3, sw), z = lerp(s.L.position.z, Math.sin(ph + t * .25) * rr * .8, sw);
    if (outw && u > 3) { const v = ss(seg(u, 3, 7)); x = lerp(x, winOut.x, v); y = lerp(y, winOut.y, v); z = lerp(z, winOut.z, v); }
    o.x = x; o.y = y; o.z = z; o.a = (.75 + .25 * Math.sin(t * (2.4 + (i % 5) * .5) + ph)) * ss(seg(u, 0, .3)) * (outw ? 1 - ss(seg(u, 6, 7.5)) : 1); o.s = .24; o.r = 1; o.g = 1; o.b = .55;
  }, { soft: 1 });
  scene.add(ffs);

  const CAM = {
    shelf: { p: track([[0, [-3.0, 3.4, 3.2]], [5.0, [.9, 3.0, 4.3]], [9.2, [3.3, 2.3, 4.5]]]), l: track([[0, [-2.0, 2.2, -2.6]], [5.0, [.2, 2.0, -2.2]], [9.2, [1.85, .95, 1.75]]]), fov: 34 },
    towerRelease: { p: track([[0, [.9, 2.3, 3.8]], [5.5, [.6, 1.9, 3.1]], [11, [.3, 1.3, 2.4]]]), l: track([[0, [-.3, 2.1, -2.6]], [5.5, [-.2, 2.7, -2.4]], [11, [0, 5.6, -1.2]]]), fov: 34 },
    wake: { p: track([[0, [3.6, 2.0, 4.3]], [7, [3.15, 1.75, 3.7]]]), l: track([[0, [1.85, 1.0, 1.75]], [7, [1.85, 1.05, 1.75]]]), fov: 32 },
  };
  let focusObj = null;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    const tg = ss(seg(t, T.towerGold[0], T.towerGold[1]));
    // the shelf: each lantern breathes violet; opened, it flashes and settles warm and empty, its cap lifted
    let closed = 0;
    SH.forEach(s => { const op = t >= s.openAt, f = op ? Math.exp(-(t - s.openAt) / .25) : 0;
      s.g.material.emissive.copy(op ? GOLD : VIOLET).lerp(FIRE, f); s.g.material.emissiveIntensity = op ? .45 + 1.6 * f : .75 + .35 * Math.sin(t * 1.6 + s.ph);
      const cap = s.L.children[2]; cap.position.y = op ? .12 * ss(seg(t, s.openAt, s.openAt + .2)) : 0; cap.rotation.z = op ? .5 * ss(seg(t, s.openAt, s.openAt + .2)) : 0;
      if (!op) closed++; });
    shelfLights.forEach(L => { L.color.copy(VIOLET).lerp(GOLD, tg); L.intensity = 5 * (.5 + .5 * closed / SH.length) + 2 * tg; });
    roomGold.intensity = 9 * tg * flick(t, 6);
    candleL.intensity = 3.2 * flick(t, 4); candleG.material.opacity = 1;
    beam.userData.aim(winP, new THREE.Vector3(.6, -4.6, 1.2).sub(winP).normalize(), cam); beam.material.uniforms.k.value = .3; beam.material.uniforms.t.value = t;
    // camera first: the sprites turn to where it is this frame (a still or a seek has no previous frame)
    cam.fov = C.fov * FOVK; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    // 노을: asleep in her chair; wakes among the fireflies
    N.root.position.set(1.85, 0, 1.75);
    const nf = t < T.wake ? 'sleep' : (t > T.wake + 2.6 && t < T.wake + 2.72) ? 'sleep' : 'sitWake';
    N.face(cam); N.frame(nf);
    // 하루: at the shelf in the second chapter, the empty lantern raised
    Hr.root.visible = id !== 'shelf'; Hr.root.position.set(id === 'wake' ? -.5 : -.15, 0, id === 'wake' ? -.3 : .35);
    const hf = id === 'wake' ? (Math.floor(t * 1.2) % 2 ? 'hold1' : 'hold') : (Math.floor(t * 1.3) % 2 ? 'hup1' : 'hup');
    Hr.face(cam); Hr.frame(hf, 0, 1);
    fill.position.copy(id === 'towerRelease' ? Hr.root.position : N.root.position).add(new THREE.Vector3(.4, 1.5, 2)); fill.intensity = 1.2;
    kept.userData.update(t); ffs.userData.update(t);
    const subj = id === 'shelf' ? (lt < 6 ? new THREE.Vector3(lerp(-1.8, .2, ss(lt / 6)), 2.2, -2.4) : N.root.position.clone().setY(.9)) : id === 'wake' ? N.root.position.clone().setY(1.0) : new THREE.Vector3(0, lerp(2.2, 4.6, ss(seg(lt, 5, 11))), -2.0);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.aper = id === 'wake' ? 130 : 120; post.dof.maxCoc = 18;
    focusObj = subj;
    post.bloom.strength = .55 + .25 * tg; post.bloom.threshold = .82;
    renderer.toneMappingExposure = 1.15 + .25 * tg;
    post.vig.uniforms.warm.value = .12 + .1 * tg; post.vig.uniforms.amt.value = .7;
  }
  const events = SH.map(s => ({ t: s.openAt, type: 'shelfOpen', pan: Math.max(-1, Math.min(1, s.L.position.x / 4)) }));
  return { scene, update, focus: () => focusObj, events };
}
