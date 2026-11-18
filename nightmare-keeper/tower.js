// The tower set: a round stone room. Shelves of small lanterns, each holding violet moths; in the middle, on a pedestal,
// the biggest lantern (its moth carries teal eyespots — the keeper's own colour, the film's hidden clue); a desk with a
// candle and her chair; a window slit with moonlight. It swells, cracks and bursts; the shelf follows in a chain.
import * as THREE from 'three';
import { PX, ramp, h2, texOf, woodPlanks, rock, glow, blob } from './px.js';
import { mats, mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeChar, moths, bigMoth } from './chars.js';
import { T, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const VIOLET = new THREE.Color('#b46cff');

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
  // chain order: from the centre of the shelf outwards
  SH.sort((p, q) => Math.abs(p.k - 4) - Math.abs(q.k - 4) || p.tier - q.tier).forEach((s, i) => { s.breakAt = T.chain[Math.min(T.chain.length - 1, Math.floor(i / 3.4))] + (i % 3) * .07; });
  const shelfLights = [-1, 0, 1].map(i => { const L = new THREE.PointLight(VIOLET, 5, 7, 2); const a = Math.PI * 1.5 + i * .55; L.position.set(Math.cos(a) * 2.8, 2.6, Math.sin(a) * 2.8); scene.add(L); return L; });

  // the big lantern on a stone pedestal
  const ped = mesh(new THREE.CylinderGeometry(.55, .7, 1.0, 12).translate(0, .5, -.6), stone); scene.add(ped);
  const BIG = new THREE.Group(); BIG.position.set(0, 1.0, -.6); scene.add(BIG);
  const bigGlass = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, 1.4, 16, 1, true).translate(0, .7, 0), new THREE.MeshStandardMaterial({ color: '#2a1c3a', emissive: VIOLET, emissiveIntensity: 1.2, roughness: .2, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
  BIG.add(bigGlass);
  const ironM = new THREE.MeshStandardMaterial({ color: '#2a2a32', roughness: .5, metalness: .3 });
  const bigTop = new THREE.Mesh(new THREE.ConeGeometry(.8, .45, 16).translate(0, 1.62, 0), ironM); BIG.add(bigTop);
  const bigRing = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .1, 16).translate(0, .05, 0), ironM); BIG.add(bigRing);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, s = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.4, .05).translate(Math.cos(a) * .63, .7, Math.sin(a) * .63), ironM); BIG.add(s); }
  const inner = bigMoth(); inner.mesh.scale.setScalar(.36); inner.mesh.position.set(0, .7, 0); BIG.add(inner.mesh);
  const cracks = (() => { const pts = [], Rn = (i) => h2(i, 7, 9); for (let i = 0; i < 9; i++) { let a = Rn(i) * 6.28, y = .2 + Rn(i + 20) * 1.0; for (let s = 0; s < 4; s++) { const a2 = a + (Rn(i * 9 + s) - .5) * .4, y2 = y + (Rn(i * 7 + s) - .5) * .35; pts.push(Math.cos(a) * .64, y, Math.sin(a) * .64, Math.cos(a2) * .64, y2, Math.sin(a2) * .64); a = a2; y = y2; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#f0e0ff', transparent: true, opacity: 0 })); })();
  BIG.add(cracks);
  const bigLight = new THREE.PointLight(VIOLET, 14, 12, 2); bigLight.position.set(0, 1.8, .2); bigLight.castShadow = true; bigLight.shadow.bias = -.004; bigLight.shadow.mapSize.set(512, 512); scene.add(bigLight);
  const bigGlow = glow('#c890ff', 3.2, 1.1); bigGlow.position.set(0, 1.7, -.6); scene.add(bigGlow);

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

  // shards and moths of the burst
  const shards = particles(140, (i, t, o) => { const u = t - T.burst; o.a = 0; if (u < 0 || u > 3) return; const a = h2(i, 1, 5) * 6.28, up = .5 + h2(i, 2, 5) * 4, sp = 2 + h2(i, 3, 5) * 5; o.x = Math.cos(a) * sp * u; o.z = -.6 + Math.sin(a) * sp * u; o.y = Math.max(.02, 1.7 + up * u - 4.9 * u * u); o.a = (1 - u / 3) * (o.y > .03 ? 1 : .6); o.s = .05; o.r = .9; o.g = .85; o.b = 1; });
  scene.add(shards);
  const winOut = winP.clone().multiplyScalar(1.3);
  const swarm = moths(150, (i, t, o) => {
    o.a = 0; o.f = Math.floor(t * 10 + i * .41) % 2;
    // inside the lanterns before the burst: a few flutter in the big one
    if (i < 8) { if (t < T.burst) { const ph = i * 1.9; o.x = Math.sin(t * 2.1 + ph) * .38; o.y = 1.6 + Math.sin(t * 3.1 + ph) * .45; o.z = -.6 + Math.cos(t * 1.7 + ph) * .38; o.a = 1; o.s = .14 * (1 + .25 * ss(seg(t, T.swellStart, T.burst))); } return; }
    // the burst: out of the big lantern and the shelf, round the room, out of the window slit
    const t0 = T.burst + (i % 40) * .05 + (i / 40 | 0) * .4, u = seg(t, t0, t0 + 3.2);
    if (t < t0 || u >= 1) return;
    const src = i % 3 ? new THREE.Vector3(0, 1.7, -.6) : SH[i % SH.length].L.position, ph = i * 2.39, r = 1.6 + (i % 7) * .25;
    const sw = Math.sin(u * Math.PI);
    o.x = lerp(src.x, winOut.x, ss(u)) + Math.cos(ph + u * 9) * r * sw; o.y = lerp(src.y, winOut.y, ss(u)) + Math.sin(u * 3.1) * 1.5 * sw; o.z = lerp(src.z, winOut.z, ss(u)) + Math.sin(ph + u * 9) * r * sw;
    o.a = 1; o.s = .2;
  });
  scene.add(swarm);

  const CAM = {
    shelf: { p: track([[0, [-3.0, 3.4, 3.2]], [7.7, [2.6, 3.2, 3.6]]]), l: track([[0, [-2.0, 2.2, -2.6]], [7.7, [.6, 1.6, -1.2]]]), fov: 34 },
    swell: { p: track([[0, [1.6, 3.2, 4.6]], [9.5, [.5, 2.4, 2.4]]]), l: track([[0, [0, 1.5, -.6]], [9.5, [0, 1.6, -.6]]]), fov: 34 },
    shatter: { p: track([[0, [.5, 2.4, 2.4]], [.6, [.6, 2.6, 2.8]], [6, [1.4, 5.6, 4.1]]]), l: track([[0, [0, 1.6, -.6]], [.6, [0, 1.8, -.6]], [6, [-.6, 2.8, -2]]]), fov: 36 },
  };
  let focusObj = null;
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    const sw = ss(seg(t, T.swellStart, T.burst)), pulseF = 1.2 + sw * 5, pulse = .5 + .5 * Math.sin(t * pulseF * 2 * Math.PI * .5 + Math.sin(t * 1.3));
    const burst = t >= T.burst, dark = ss(seg(t, T.towerDark, T.towerDark + 1.4));
    // the big lantern: breathes, swells, cracks, bursts
    BIG.scale.set(1 + .14 * sw + .04 * sw * pulse, 1 + .06 * sw, 1 + .14 * sw + .04 * sw * pulse);
    bigGlass.visible = bigTop.visible = !burst; inner.mesh.visible = !burst; bigRing.visible = true;
    bigGlass.material.emissiveIntensity = (.6 + .4 * pulse * (.4 + sw)) * (burst ? 0 : 1);
    cracks.material.opacity = burst ? 0 : ss(seg(t, T.crack, T.crack + .2)) * (.7 + .3 * Math.sin(t * 40));
    inner.frame(Math.floor(t * (1 + sw * 4)) % 2);
    const flash = burst ? Math.exp(-(t - T.burst) / .18) : 0;
    bigLight.intensity = burst ? 40 * flash : (10 + 8 * pulse * (.3 + sw)) * flick(t, 1);
    bigGlow.material.opacity = burst ? flash : .7 + .3 * pulse; bigGlow.scale.setScalar(burst ? 3 + 9 * flash : 2.6 + sw * 1.4 + .3 * pulse);
    // the shelf: each lantern breathes; then breaks in a chain
    let lit = 0;
    SH.forEach(s => { const broken = t >= s.breakAt, f = broken ? Math.exp(-(t - s.breakAt) / .12) : 0;
      s.g.visible = !broken; s.g.material.emissiveIntensity = .75 + .35 * Math.sin(t * (1.6 + sw * 4) + s.ph) * (.3 + sw); if (!broken) lit++;
      s.L.scale.setScalar(broken ? 1 : 1 + sw * .05 * Math.sin(t * 9 + s.ph)); if (f > .05) s.L.children[0].material = s.L.children[0].material; });
    shelfLights.forEach(L => L.intensity = 5 * (lit / SH.length) * (1 + .3 * sw));
    // candle, moon
    candleL.intensity = 3.2 * flick(t, 4) * (1 - .8 * dark); candleG.material.opacity = 1 - .8 * dark;
    const bk = beam.userData.aim(winP, new THREE.Vector3(.6, -4.6, 1.2).sub(winP).normalize().add(new THREE.Vector3(0, 0, 0)), cam); beam.material.uniforms.k.value = .3 * (1 + dark * .6);
    beam.material.uniforms.t.value = t;
    // 노을: awake in her chair; standing by the big lantern when it swells; startled
    let nf = 'sitWake'; N.root.position.set(1.85, 0, 1.75);
    if (id === 'swell' || id === 'shatter') { N.root.position.set(-1.35, 0, -.1); nf = t > T.knock + .6 ? (t > T.burst ? 'look' : 'look') : 'idle0'; }
    if (id === 'shelf' && (lt % 4.1) < .12) nf = 'sitWake';
    N.face(cam); N.frame(nf, nf === 'sitWake' ? null : 1, true);
    fill.position.copy(N.root.position).add(new THREE.Vector3(.4, 1.5, 2)); fill.intensity = 1.2;
    // camera (one impact shake at the burst)
    cam.fov = C.fov; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    if (burst && t < T.burst + .5) { const k = Math.exp(-(t - T.burst) / .12); cam.position.x += Math.sin(t * 90) * .06 * k; cam.position.y += Math.cos(t * 77) * .05 * k; }
    shards.userData.update(t); swarm.userData.update(t);
    const subj = id === 'shelf' ? new THREE.Vector3(lerp(-1.8, .2, ss(lt / 7.7)), 2.2, -2.4) : new THREE.Vector3(0, 1.7, -.6);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.aper = id === 'shelf' ? 120 : 110; post.dof.maxCoc = 18;
    focusObj = subj;
    post.bloom.strength = .5 + flash * .6; post.bloom.threshold = .85;
    renderer.toneMappingExposure = 1.1 + flash * 1.6 - dark * .15;
    post.vig.uniforms.warm.value = .12; post.vig.uniforms.amt.value = .7;
  }
  return { scene, update, focus: () => focusObj };
}
