// The tower room of 「악몽을 지키는 파수꾼 2 — A 할머니의 첫 꿈」: the same round stone room, rearranged for this night.
// 노을 sleeps in her chair under the back window; over her head her first good dream opens as a golden light (the brightest
// light in the town — so every nightmare comes for it). The door with its keyhole stands beside the window; the old bell
// rope hangs from the ceiling, knotted to the empty pedestal (seventy years unrung). Kept nightmares glow on the shelves.
import * as THREE from 'three';
import { PX, ramp, h2, texOf, woodPlanks, rock, glow, blob } from './px.js';
import { mats, mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeChar, moths } from './chars.js';
import { T, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const VIOLET = new THREE.Color('#b46cff'), GOLD = new THREE.Color('#ffc35a'), GOLD_L = new THREE.Color('#ffe2a0');
const FOVK = (window.FILM_SIZE ? window.FILM_SIZE[1] > window.FILM_SIZE[0] : innerHeight > innerWidth) ? 1.6 : 1;   // the vertical cut: a taller lens
const polar = (a, r, y = 0) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);

export function buildTower() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#1a1210', .03);
  scene.background = new THREE.Color('#05040a');
  const stone = mat(rock(96, 96, { seed: 31, cols: ['#141218', '#221f27', '#332f38', '#47424c', '#5d5862'] }));
  const R0 = 4.4;
  const wall = mesh(new THREE.CylinderGeometry(R0, R0, 8, 28, 1, true).translate(0, 4, 0), stone); wall.material = stone.clone(); wall.material.side = THREE.BackSide; scene.add(wall);
  const floor = mesh(new THREE.CylinderGeometry(R0, R0, .2, 28).translate(0, -.1, 0), mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 12 }))); scene.add(floor);
  for (let i = -2; i <= 2; i++) { const b = box(9, .3, .3, MM.beam, { cast: false }); b.position.set(0, 7.4, i * 1.6); scene.add(b); }

  // shelves of kept nightmares (back left): dim violet lanterns
  const SH = [], arc = [Math.PI * 1.04, Math.PI * 1.40];
  for (let tier = 0; tier < 3; tier++) {
    const y = 1.1 + tier * 1.25;
    for (let k = 0; k < 6; k++) { const a = arc[0] + (arc[1] - arc[0]) * (k + .5) / 6, r = R0 - .45; const p = box(1.2, .1, .55, MM.plank); p.position.set(Math.cos(a) * r, y, Math.sin(a) * r); p.rotation.y = -a + Math.PI / 2; scene.add(p);
      const L = new THREE.Group(); L.position.set(Math.cos(a) * (r - .05), y + .1, Math.sin(a) * (r - .05));
      L.add(box(.34, .06, .34, MM.beam, { cast: false }));
      const g = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .4, 8).translate(0, .26, 0), new THREE.MeshStandardMaterial({ color: '#241a30', emissive: VIOLET, emissiveIntensity: .9, roughness: .3 })); L.add(g);
      L.add(new THREE.Mesh(new THREE.ConeGeometry(.21, .16, 8).translate(0, .54, 0), new THREE.MeshStandardMaterial({ color: '#26262e', roughness: .6 })));
      scene.add(L); SH.push({ L, g, ph: h2(k, tier, 3) * 6 });
    }
  }
  const shelfLight = new THREE.PointLight(VIOLET, 3, 6, 2); shelfLight.position.copy(polar(Math.PI * 1.22, 2.6, 2.6)); scene.add(shelfLight);

  // the empty pedestal, an iron ring, and the bell rope knotted to it (rising through a hole in the ceiling)
  const PED = new THREE.Vector3(-.7, 0, -1.2);
  const ped = mesh(new THREE.CylinderGeometry(.5, .64, 1.0, 12).translate(PED.x, .5, PED.z), stone); scene.add(ped);
  const ROPE = new THREE.Vector3(PED.x + .05, 0, PED.z + .55);
  const ringI = new THREE.Mesh(new THREE.TorusGeometry(.09, .022, 6, 12), new THREE.MeshStandardMaterial({ color: '#3a3a44', roughness: .5, metalness: .6 })); ringI.position.set(ROPE.x, .86, PED.z + .5); scene.add(ringI);
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#8a6a44', roughness: .9 });
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, 1, 6).translate(0, .5, 0), ropeMat); scene.add(rope);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), ropeMat); knot.scale.set(1.3, .9, 1); scene.add(knot);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.024, .02, .34, 5).translate(0, -.17, 0), ropeMat); tail.rotation.z = .5; scene.add(tail);
  const hole = new THREE.Mesh(new THREE.TorusGeometry(.14, .04, 6, 14), new THREE.MeshStandardMaterial({ color: '#1a1414', roughness: .9 })); hole.rotation.x = Math.PI / 2; hole.position.set(ROPE.x, 7.25, ROPE.z); scene.add(hole);
  const holeBoard = box(1.2, .08, 1.2, MM.plankDark, { cast: false }); holeBoard.position.set(ROPE.x, 7.27, ROPE.z); scene.add(holeBoard);
  const holeG = glow('#9fb8ff', .7, 1.2); holeG.position.set(ROPE.x, 7.2, ROPE.z); scene.add(holeG);
  const shaftB = beamCard(6.2, .18, .9, '#8fa8e0', { k: .3, fall: 1.0 }); scene.add(shaftB);
  const holeL = new THREE.PointLight('#9fb2e8', 4.5, 7, 2); holeL.position.set(ROPE.x + .5, 3.4, ROPE.z + .9); scene.add(holeL);

  // the back window (behind her chair): frame, glass, night sky beyond, two shutters
  const WA = Math.PI * 1.54, WIN = polar(WA, R0 - .04, 1.75), N_IN = WIN.clone().setY(0).multiplyScalar(-1).normalize();
  const winG = new THREE.Group(); winG.position.copy(WIN); winG.lookAt(0, WIN.y, 0); scene.add(winG);
  const frameM = MM.plankDark;
  for (const [w, h, x, y] of [[1.2, .12, 0, .66], [1.2, .12, 0, -.66], [.12, 1.44, -.56, 0], [.12, 1.44, .56, 0], [1.0, .06, 0, 0]]) { const f = box(w, h, .14, frameM, { cast: false }); f.position.set(x, y - h / 2, .02); winG.add(f); }
  const glassM = new THREE.MeshBasicMaterial({ color: '#2a3a68', transparent: true, opacity: .35, depthWrite: false, fog: false });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), glassM); glass.position.z = -.024; winG.add(glass);
  const skyM = new THREE.MeshBasicMaterial({ color: '#30467c', fog: false });
  const skyP = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), skyM); skyP.position.set(0, 0, -.034); winG.add(skyP);   // the night beyond (the wall has no hole: the sky is painted just behind the glass)
  const moonD = new THREE.Mesh(new THREE.CircleGeometry(.11, 16), new THREE.MeshBasicMaterial({ color: '#e8eeff', fog: false })); moonD.position.set(.26, .32, -.03); winG.add(moonD);
  const shutters = [-1, 1].map(s => { const piv = new THREE.Group(); piv.position.set(s * .5, 0, .1); winG.add(piv);
    for (let k = 0; k < 3; k++) { const pl = box(.15, 1.3, .05, MM.plank, { cast: false }); pl.position.set(-s * (.09 + k * .165), -.65, 0); piv.add(pl); }
    return { piv, s }; });
  const leak = new THREE.PointLight(VIOLET, 0, 5, 2); leak.position.copy(WIN).addScaledVector(N_IN, .5); scene.add(leak);
  const leakG = glow('#c890ff', 1.6, 1.1); leakG.position.copy(WIN).addScaledVector(N_IN, .2); scene.add(leakG);
  const beam = beamCard(5.2, .7, 2.0, '#8fa8e0', { k: .26, fall: 1.1 }); scene.add(beam);
  const moonSpot = new THREE.SpotLight('#8fa8e0', 12, 12, .5, .6, 1.5); moonSpot.position.copy(WIN).addScaledVector(N_IN, -.6).setY(3.2); moonSpot.target.position.copy(WIN).addScaledVector(N_IN, 3.2).setY(0); scene.add(moonSpot, moonSpot.target);

  // the door with its keyhole (right of the window)
  const DA = Math.PI * 1.71, DOOR = polar(DA, R0 - .05, 0);
  const doorG = new THREE.Group(); doorG.position.copy(DOOR); doorG.lookAt(0, 0, 0); scene.add(doorG);
  const doorP = box(1.15, 2.1, .12, MM.plankDark, { cast: false }); doorP.position.set(0, 0, .02); doorG.add(doorP);
  for (const y of [.45, 1.6]) { const st = box(1.2, .08, .04, MM.beam, { cast: false }); st.position.set(0, y, .1); doorG.add(st); }
  const KEY = new THREE.Mesh(new THREE.PlaneGeometry(.06, .12), new THREE.MeshBasicMaterial({ color: '#120a18' })); KEY.position.set(.36, 1.0, .095); doorG.add(KEY);
  const keyG = glow('#c890ff', .3, 1.2); keyG.position.set(.36, 1.0, .14); doorG.add(keyG);
  const keyW = new THREE.Vector3(); doorG.updateMatrixWorld(true); KEY.getWorldPosition(keyW);

  // her chair under the window, the desk and candle beside it
  const CH = WIN.clone().addScaledVector(N_IN, 1.35).setY(0);
  const chair = new THREE.Group(); chair.add(box(.6, .5, .6, MM.plank)); const back = box(.6, .9, .1, MM.plank); back.position.set(0, .5, -.25); chair.add(back); chair.position.copy(CH).addScaledVector(N_IN, -.12); chair.lookAt(0, 0, 0); scene.add(chair);
  const DESK = polar(WA - .42, R0 - 1.2, 0);
  const desk = box(1.2, .8, .6, MM.plankDark); desk.position.copy(DESK); desk.lookAt(0, 0, 0); scene.add(desk);
  const candleP = DESK.clone().setY(1.02).addScaledVector(N_IN, .05);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .2, 6).translate(candleP.x, .9, candleP.z), new THREE.MeshStandardMaterial({ color: '#efe6d0', emissive: '#ffcf8a', emissiveIntensity: .3 })); scene.add(candle);
  const candleL = new THREE.PointLight('#ffb050', 1.6, 5, 2); candleL.position.copy(candleP).add(new THREE.Vector3(0, .25, .4)); scene.add(candleL);
  const candleG = glow('#ffc070', .45, 1.3); candleG.position.copy(candleP).add(new THREE.Vector3(0, .1, 0)); scene.add(candleG);
  scene.add(new THREE.HemisphereLight('#3a3050', '#0a0808', .5));

  // 노을 in the chair, and her dream: a golden light over her head (it lights the room and throws the shadows)
  const N = makeChar('noeul'); scene.add(N.root); N.root.position.copy(CH);
  const DREAM = CH.clone().setY(1.62).addScaledVector(N_IN, .05);
  const dreamL = new THREE.PointLight(GOLD, 0, 9, 1.6); dreamL.castShadow = true; dreamL.shadow.mapSize.set(512, 512); dreamL.shadow.bias = -.004; dreamL.position.copy(DREAM).addScaledVector(N_IN, .25); scene.add(dreamL);
  const dreamG = glow('#ffd27a', 1.2, 1.3); dreamG.position.copy(DREAM); scene.add(dreamG);
  const dreamCore = glow('#fff2c8', .38, 1.4); dreamCore.position.copy(DREAM); scene.add(dreamCore);
  const taintG = glow('#b070ff', 1.9, 1.0); taintG.position.copy(DREAM); scene.add(taintG);
  const motes = particles(60, (i, t, o) => {   // the dream's slow gold motes
    const on = ss(seg(t, T.bloom, T.bloom + 1.2)), ph = i * 2.39, r = .25 + (i % 7) * .07, tt = t * (.4 + (i % 5) * .08) + ph;
    o.x = DREAM.x + Math.cos(tt) * r; o.y = DREAM.y + Math.sin(tt * 1.3 + ph) * .18 + (i % 3) * .05; o.z = DREAM.z + Math.sin(tt) * r;
    const taint = ss(seg(t, T.taint[0], T.taint[1])) * (1 - ss(seg(t, T.bell, T.bell + 4)));
    const vio = (i % 4) < taint * 4;
    o.r = vio ? .75 : 1; o.g = vio ? .45 : .82; o.b = vio ? 1 : .42; o.a = on * (.55 + .45 * Math.sin(t * 3 + ph)) * (1 - .4 * taint); o.s = .07;
  }, { soft: 1 });
  scene.add(motes);
  const fill = new THREE.PointLight('#9fb2e8', .9, 6, 2); scene.add(fill);
  const hLamp = new THREE.PointLight('#ffb050', 0, 4, 2); scene.add(hLamp);

  // 하루, and his lantern once it is full (set down by the window, glass cracked)
  const Hr = makeChar('haru'); scene.add(Hr.root);
  const LANT = WIN.clone().addScaledVector(N_IN, .9).setY(0).add(polar(WA + Math.PI / 2, .75));
  const lantG = new THREE.Group(); lantG.position.copy(LANT); scene.add(lantG);
  lantG.add(box(.26, .05, .26, MM.beam, { cast: false }));
  const lantGl = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .3, 8).translate(0, .2, 0), new THREE.MeshStandardMaterial({ color: '#241a30', emissive: VIOLET, emissiveIntensity: 2.2, roughness: .3 })); lantG.add(lantGl);
  lantG.add(new THREE.Mesh(new THREE.ConeGeometry(.16, .12, 8).translate(0, .41, 0), new THREE.MeshStandardMaterial({ color: '#26262e', roughness: .6 })));
  const lantL = new THREE.PointLight(VIOLET, 1.4, 3, 2); lantL.position.copy(LANT).setY(.4); scene.add(lantL);

  // moths: the keyhole one; the swarm pressing at the window (seen through the glass, then a shadow behind the shutters)
  const KM_END = CH.clone().setY(1.5);
  const MS = moths(70, (i, t, o) => {
    o.a = 0; o.f = Math.floor(t * 10 + i * .37) % 2;
    if (i === 0) { if (t < T.keyhole || t > T.catch + .05) return;
      const u = seg(t, T.keyhole, T.catch), from = keyW.clone().addScaledVector(N_IN, .05), to = catchAt;
      const s = ss(u); o.x = lerp(from.x, to.x, s) + Math.sin(u * 9) * .25; o.y = lerp(from.y, to.y, s) + Math.sin(u * Math.PI) * .5; o.z = lerp(from.z, to.z, s) + Math.cos(u * 7) * .2;
      o.a = 1; o.s = .32; o.f = Math.floor(t * 14) % 2; return; }
    // outside the glass: more and more, pressing; hidden by the shutters once they shut (their light still leaks)
    const press = ss(seg(t, 16, T.shut)) * (t < T.bell ? 1 : 1 - ss(seg(t, T.bell + 4, T.bell + 10)));
    if (i / 70 > press || t > T.shut + .4) return;
    const ph = i * 2.17, px = (h2(i, 1, 5) - .5) * .9, py = (h2(i, 2, 5) - .5) * 1.1, d = .005 + h2(i, 3, 5) * .03;
    const wv = new THREE.Vector3(px + Math.sin(t * 3 + ph) * .04, py + Math.cos(t * 2.4 + ph) * .04, d);
    winG.localToWorld(wv); o.x = wv.x; o.y = wv.y; o.z = wv.z; o.a = 1; o.s = .17;
  });
  scene.add(MS);
  const catchAt = new THREE.Vector3();

  const CAM = {
    dream: { p: track([[0, [1.45, 1.42, -.35]], [9, [1.2, 1.5, -.95]]]), l: track([[0, [CH.x, 1.25, CH.z]], [9, [CH.x, 1.35, CH.z]]]), fov: 34 },
    window: { p: track([[0, [1.6, 1.85, .2]], [3.2, [1.55, 1.85, .1]], [6.0, [1.1, 1.75, -.05]], [9.6, [1.0, 1.7, .1]]]), l: track([[0, [1.1, 1.45, -3.7]], [3.2, [1.1, 1.45, -3.7]], [6.0, [CH.x + .1, 1.15, CH.z]], [9.6, [CH.x, 1.15, CH.z]]]), fov: 34 },
    rope: { p: track([[0, [ROPE.x + .8, 1.1, ROPE.z + 1.4]], [2.0, [ROPE.x + .8, 1.2, ROPE.z + 1.4]], [8, [ROPE.x + 1.6, 2.2, ROPE.z + 2.6]]]), l: track([[0, [ROPE.x, .95, ROPE.z]], [2.0, [ROPE.x, 1.05, ROPE.z]], [8, [ROPE.x, 5.6, ROPE.z]]]), fov: 34 },
    keyhole: { p: track([[0, [-.3, 2.7, 1.9]], [11, [-.1, 2.5, 1.5]]]), l: track([[0, [1.0, 1.0, -2.8]], [11, [1.0, 1.0, -2.8]]]), fov: 34 },
    crisis: { p: track([[0, [-1.0, 1.75, -.1]], [9.6, [-.8, 1.65, -.6]]]), l: track([[0, [CH.x - .55, 1.15, CH.z]], [9.6, [CH.x - .5, 1.25, CH.z]]]), fov: 32 },
    pull: { p: track([[0, [ROPE.x + 2.4, 1.9, ROPE.z + 3.7]], [4.6, [ROPE.x + 2.0, 1.8, ROPE.z + 3.1]]]), l: track([[0, [ROPE.x + .45, 1.3, ROPE.z - .4]], [4.6, [ROPE.x + .2, 1.55, ROPE.z]]]), fov: 34 },
    snore: { p: track([[0, [.2, 1.9, .9]], [7.4, [.35, 1.75, .45]]]), l: track([[0, [CH.x - .3, 1.0, CH.z]], [7.4, [CH.x - .3, 1.0, CH.z]]]), fov: 32 },
  };
  let focusObj = null;
  const hPos = new THREE.Vector3(), shake = new THREE.Vector3();
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    const bloom = ss(seg(t, T.bloom, T.bloom + 1.0)), flare = t > T.bloom ? Math.exp(-(t - T.bloom) / .45) : 0;
    const taint = ss(seg(t, T.taint[0], T.taint[1])) * (1 - ss(seg(t, T.bell + 1, T.bell + 8)));
    const press = ss(seg(t, T.shut, T.rattle[1])) * (1 - ss(seg(t, T.bell, T.bell + 6)));
    const rate = 3 + 9 * press;
    // the shelf breathes violet
    SH.forEach(s => { s.g.material.emissiveIntensity = .55 + .25 * Math.sin(t * 1.6 + s.ph); });
    shelfLight.intensity = 2.2;
    // the dream
    const gI = bloom * (1 - .55 * taint);
    dreamL.intensity = (5.5 + 16 * flare) * gI * (.9 + .1 * Math.sin(t * 2.1)); dreamL.color.copy(GOLD).lerp(VIOLET, taint * .35);
    dreamG.material.opacity = Math.min(1, gI * (.85 + .6 * flare)); dreamG.scale.setScalar(1.0 + .9 * flare + .1 * Math.sin(t * 1.7));
    dreamCore.material.opacity = gI; taintG.material.opacity = taint * (.55 + .2 * Math.sin(t * 5)); taintG.scale.setScalar(1.6 + .4 * Math.sin(t * 2.3));
    // the window: night sky, then the swarm; shutters shut at T.shut; violet leaks and bulges while they press
    const shut = ss(seg(t, T.shut, T.shut + .7)) * (1 - ss(seg(t, 97.5, 98.5)));
    shutters.forEach(({ piv, s }) => { piv.rotation.y = s * lerp(1.45, 0, shut) + (shut > .9 ? s * .03 * press * Math.sin(t * rate * 2 + s) : 0); });
    const outV = ss(seg(t, 16, 40)) * (1 - ss(seg(t, T.bell + 2, T.bell + 12)));
    skyM.color.set('#30467c').lerp(new THREE.Color('#3a1a5a'), outV * .8); glassM.color.set('#2a3a68').lerp(new THREE.Color('#7a3ab8'), outV * .7);
    leak.intensity = (shut > .5 ? 1.5 + 6 * press : .8 * outV) * (.85 + .15 * Math.sin(t * rate)); leakG.material.opacity = shut > .5 ? .25 + .6 * press : .3 * outV;
    winG.position.copy(WIN).addScaledVector(N_IN, shut > .9 ? .012 * press * Math.sin(t * rate * 1.7) : 0);
    keyG.material.opacity = t > T.keyhole - 2 ? (.4 + .5 * press) * (1 - ss(seg(t, T.bell, T.bell + 5))) : .15;
    shaftB.userData.aim(new THREE.Vector3(ROPE.x, 7.2, ROPE.z), new THREE.Vector3(0, -1, 0), cam); shaftB.material.uniforms.k.value = .22; shaftB.material.uniforms.t.value = t;
    beam.userData.aim(WIN.clone().addScaledVector(N_IN, -.3).setY(2.4), new THREE.Vector3().copy(N_IN).setY(-.75).normalize(), cam); beam.material.uniforms.k.value = .26 * (1 - shut); beam.material.uniforms.t.value = t;
    moonSpot.intensity = 12 * (1 - shut) + 2;
    candleL.intensity = 1.6 * flick(t, 4);
    // the bell rope: knotted; untied; pulled (it runs down and back up)
    const untied = t > T.untie, pull = t > T.pull ? Math.sin(Math.min(1, (t - T.pull) / .9) * Math.PI) * .55 : 0;
    const ropeBot = untied ? 1.45 - pull : 1.0;
    rope.position.set(ROPE.x, ropeBot, ROPE.z); rope.scale.y = 7.25 - ropeBot;
    knot.visible = !untied; knot.position.set(ROPE.x, .95, ROPE.z - .02); tail.visible = !untied; tail.position.set(ROPE.x + .04, .93, ROPE.z);
    // camera first: the sprites turn to where it is this frame
    cam.fov = C.fov * FOVK; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    if (id === 'pull' && t > T.pull) { const k = Math.exp(-(t - T.pull) / .3); shake.set(Math.sin(t * 61) * .015 * k, Math.sin(t * 47) * .012 * k, 0); cam.position.add(shake); }
    // 노을: asleep; frowning while the swarm presses; snoring after
    let nf = Math.floor(t * .7) % 2 ? 'sleep1' : 'sleep';
    if (taint > .25) nf = Math.floor(t * 1.4) % 2 ? 'frown1' : 'frown';
    if (id === 'snore' || id === 'pull') nf = T.snores.some(s => t > s && t < s + 1.1) ? 'snore' : 'sleep';
    N.face(cam); N.frame(nf);
    // 하루 by shot
    let hf = 'idle0', flip = false; Hr.root.visible = true;
    if (id === 'dream') Hr.root.visible = false;
    if (id === 'window') { hPos.copy(WIN).addScaledVector(N_IN, .75).setY(0).add(polar(WA + Math.PI / 2, 1.15)); flip = lt < 3.2; hf = Math.floor(t * 1.2) % 2 ? 'hold1' : 'hold'; }
    if (id === 'rope') Hr.root.visible = false;
    if (id === 'keyhole') {
      const atWin = WIN.clone().addScaledVector(N_IN, .7).setY(0).add(polar(WA + Math.PI / 2, .62)), intercept = CH.clone().addScaledVector(N_IN, .2).add(polar(WA + Math.PI / 2, .95)).setY(0);
      const go = ss(seg(t, T.dive - .5, T.catch));
      hPos.copy(atWin).lerp(intercept, go);
      hf = t < T.shut + .8 ? 'reach' : t < T.dive ? (Math.floor(t * 2) % 2 ? 'idle1' : 'look') : t < T.catch ? 'dive' : (Math.floor(t * 1.6) % 2 ? 'cup1' : 'cup');
      catchAt.copy(intercept).setY(.62).add(polar(Math.atan2(cam.position.z - CH.z, cam.position.x - CH.x) + Math.PI / 2, .25));
    }
    if (id === 'crisis') {
      const side = CH.clone().add(polar(WA + Math.PI / 2, -.75)).addScaledVector(N_IN, .25);
      const toRope = ROPE.clone().add(new THREE.Vector3(.35, 0, .2));
      hPos.copy(side).lerp(toRope, ss(seg(t, T.walk[0], T.walk[1])));
      hf = t < T.touch ? 'idle0' : t < T.release ? 'reachL' : t < T.lookUp ? 'idle1' : t < T.walk[0] ? 'point' : ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4];
      if (t > T.walk[1]) hf = 'point';
    }
    if (id === 'pull') { const side = CH.clone().add(polar(WA + Math.PI / 2, -.75)).addScaledVector(N_IN, .25), at = ROPE.clone().add(new THREE.Vector3(.3, 0, .18));
      hPos.copy(side).lerp(at, ss(seg(t, T.walk[0], T.walk[1])));
      hf = t < T.walk[1] ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4] : t < T.untie ? 'reach' : t < T.pull ? 'point' : (t < T.pull + .45 ? 'point1' : 'idle1'); }
    if (id === 'snore') { hPos.copy(CH).add(polar(WA + Math.PI / 2, -.62)).addScaledVector(N_IN, .6); hf = t > 101.2 && t < 103.6 ? 'sitUpL' : (Math.floor(t * .8) % 2 ? 'sitUp' : 'sitUpB'); }
    Hr.root.position.copy(hPos);
    Hr.face(cam, flip); Hr.frame(hf, ['hold', 'hold1'].includes(hf) ? 0 : null, 0);
    hLamp.intensity = ['hold', 'hold1'].includes(hf) ? 2.4 * flick(t, 3) : 0; if (hLamp.intensity) { hLamp.position.copy(Hr.lanternPos(hf)).add(cam.position.clone().sub(Hr.root.position).setY(0).normalize().multiplyScalar(.5)); }
    // his full lantern, set down by the window from the keyhole shot on
    lantG.visible = lantL.visible = t > T.shut - .2; lantGl.material.emissiveIntensity = 2.2 * (.8 + .2 * Math.sin(t * 9));
    fill.position.copy(id === 'rope' || id === 'pull' ? ROPE : CH).add(new THREE.Vector3(.6, 1.6, 1.6)); fill.intensity = id === 'rope' || id === 'pull' ? 1.8 : .9;
    MS.userData.update(t); motes.userData.update(t);
    // focus
    const subj = id === 'dream' ? DREAM.clone().setY(1.2) : id === 'rope' ? new THREE.Vector3(ROPE.x, lerp(.95, 4.2, ss(seg(lt, 2, 8))), ROPE.z) : id === 'pull' ? ROPE.clone().setY(1.3)
      : id === 'keyhole' ? (t > T.keyhole && t < T.catch + .5 ? catchAt.clone() : Hr.root.position.clone().setY(.8)) : id === 'window' ? (lt < 3.2 ? Hr.root.position.clone().setY(.9) : CH.clone().setY(1.0)) : CH.clone().setY(1.0);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.aper = id === 'keyhole' ? 90 : 130; post.dof.maxCoc = 18;
    focusObj = subj;
    post.bloom.strength = .55 + .35 * flare; post.bloom.threshold = .8;
    renderer.toneMappingExposure = 1.15;
    post.vig.uniforms.warm.value = .14 - .1 * taint; post.vig.uniforms.amt.value = .7;
    scene.fog.color.set('#1a1210').lerp(new THREE.Color('#1c1028'), press * .8);
  }
  const events = [];
  return { scene, update, focus: () => focusObj, events };
}
