// The tower set of C 「칠십 년 치 꿈」: the same round stone room (shelves of kept nightmares, desk, candle, the window slit),
// now with an iron stove whose pipe runs up through the ceiling. 노을 snores in her chair; every snore pops a coloured dream
// moth that ignores 하루's lantern. Where the lantern light passes through one, its dream plays on the wall as a shadow play
// (wall.js). The biggest snore sends them all up the stove pipe; the last, deep-blue dream is the keeper's own seventy years.
import * as THREE from 'three';
import { PX, ramp, h2, texOf, woodPlanks, rock, glow, blob } from './px.js';
import { mats, mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeChar, colorMoths } from './chars.js';
import { wallTheatre } from './wall.js';
import { T, DREAMS, BLUE, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const VIOLET = new THREE.Color('#b46cff');
const FOVK = (window.FILM_SIZE ? window.FILM_SIZE[1] > window.FILM_SIZE[0] : innerHeight > innerWidth) ? 1.6 : 1;   // the vertical cut: a taller lens
const rgb = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
const POPC = ['#ff8fc8', '#ffd36a', '#5fe0c8', '#8fd0ff', '#ff8fc8', '#c9a0ff', '#ffd36a', '#5fe0c8', '#ff8fc8', '#8fd0ff'];   // the colour of each popped dream
const NB = 40;   // the big snore's dreams

export function buildTower() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#1a1210', .03);
  scene.background = new THREE.Color('#05040a');
  const stone = mat(rock(96, 96, { seed: 31, cols: ['#141218', '#221f27', '#332f38', '#47424c', '#5d5862'] }));
  const R0 = 4.4;
  const wallG = new THREE.CylinderGeometry(R0, R0, 8, 28, 1, true).translate(0, 4, 0);
  const wall = mesh(wallG, stone); wall.material = stone.clone(); wall.material.side = THREE.BackSide; scene.add(wall);
  const floor = mesh(new THREE.CylinderGeometry(R0, R0, .2, 28).translate(0, -.1, 0), mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 12 }))); scene.add(floor);
  for (let i = -2; i <= 2; i++) { const b = box(9, .3, .3, MM.beam, { cast: false }); b.position.set(0, 7.4, i * 1.6); scene.add(b); }
  const ceil = mesh(new THREE.CylinderGeometry(R0, R0, .2, 28).translate(0, 7.75, 0), MM.beam || stone); scene.add(ceil);

  // shelves of kept nightmares along the back wall (the keeper's work: dim violet)
  const SH = [], arc = [Math.PI * 1.08, Math.PI * 1.92];
  for (let tier = 0; tier < 3; tier++) {
    const y = 1.1 + tier * 1.25;
    for (let k = 0; k < 9; k++) { const a = arc[0] + (arc[1] - arc[0]) * (k + .5) / 9, r = R0 - .45; const p = box(1.2, .1, .55, MM.plank); p.position.set(Math.cos(a) * r, y, Math.sin(a) * r); p.rotation.y = -a + Math.PI / 2; scene.add(p);
      const L = new THREE.Group(); L.position.set(Math.cos(a) * (r - .05), y + .1, Math.sin(a) * (r - .05));
      L.add(box(.34, .06, .34, MM.beam, { cast: false }));
      const g = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .4, 8).translate(0, .26, 0), new THREE.MeshStandardMaterial({ color: '#241a30', emissive: VIOLET, emissiveIntensity: 1.2, roughness: .3 })); L.add(g);
      L.add(new THREE.Mesh(new THREE.ConeGeometry(.21, .16, 8).translate(0, .54, 0), new THREE.MeshStandardMaterial({ color: '#26262e', roughness: .6 })));
      scene.add(L); SH.push({ g, ph: h2(k, tier, 3) * 6 });
    }
  }
  const shelfL = new THREE.PointLight(VIOLET, 3, 7, 2); shelfL.position.set(0, 2.6, -2.8); scene.add(shelfL);
  // her desk, candle, chair; the stove and its pipe; the window slit and its moonlight
  const desk = box(1.4, .8, .7, MM.plankDark); desk.position.set(2.4, 0, .6); desk.rotation.y = -.5; scene.add(desk);
  const book = box(.4, .08, .3, MM.beam, { cast: false }); book.position.set(2.3, .8, .6); book.rotation.y = -.3; scene.add(book);
  const candleP = new THREE.Vector3(2.75, 1.02, .35);
  scene.add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .2, 6).translate(candleP.x, .9, candleP.z), new THREE.MeshStandardMaterial({ color: '#efe6d0', emissive: '#ffcf8a', emissiveIntensity: .3 })));
  const candleL = new THREE.PointLight('#ffb050', 3.0, 6, 2); candleL.position.copy(candleP).add(new THREE.Vector3(-.3, .25, .4)); scene.add(candleL);
  const candleG = glow('#ffc070', .5, 1.4); candleG.position.copy(candleP).add(new THREE.Vector3(0, .1, 0)); scene.add(candleG);
  const chair = new THREE.Group(); chair.add(box(.6, .5, .6, MM.plank)); const back = box(.6, .9, .1, MM.plank); back.position.set(0, .5, -.25); chair.add(back); chair.position.set(1.8, 0, 1.6); chair.rotation.y = -.9; scene.add(chair);
  const iron = new THREE.MeshStandardMaterial({ color: '#1c1b22', roughness: .5, metalness: .4 });
  const SP = new THREE.Vector3(3.55, 0, 1.75);   // the stove
  const stove = new THREE.Mesh(new THREE.BoxGeometry(.75, .85, .65).translate(SP.x, .45, SP.z), iron); stove.castShadow = true; scene.add(stove);
  for (const [dx, dz] of [[-.3, -.25], [.3, -.25], [-.3, .25], [.3, .25]]) scene.add(new THREE.Mesh(new THREE.BoxGeometry(.08, .1, .08).translate(SP.x + dx, .05, SP.z + dz), iron));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 7, 10).translate(SP.x, 4.3, SP.z), iron); pipe.castShadow = true; scene.add(pipe);
  const fireMouth = new THREE.Mesh(new THREE.PlaneGeometry(.32, .2), new THREE.MeshBasicMaterial({ color: '#ff7a2a' })); fireMouth.position.set(SP.x - .38, .42, SP.z); fireMouth.rotation.y = -Math.PI / 2; scene.add(fireMouth);
  const stoveL = new THREE.PointLight('#ff8a3a', 1.6, 4, 2); stoveL.position.set(SP.x - .7, .5, SP.z); scene.add(stoveL);
  const winA = Math.PI * .92, winP = new THREE.Vector3(Math.cos(winA) * (R0 - .02), 4.6, Math.sin(winA) * (R0 - .02));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.6), new THREE.MeshBasicMaterial({ color: '#9fb8ff' })); pane.position.copy(winP); pane.lookAt(0, 4.6, 0); scene.add(pane);
  const beam = beamCard(6.5, .6, 2.2, '#8fa8e0', { k: .32, fall: 1.1 }); scene.add(beam);
  const moonSpot = new THREE.SpotLight('#8fa8e0', 18, 14, .45, .6, 1.5); moonSpot.position.copy(winP); moonSpot.target.position.set(.6, 0, 1.2); scene.add(moonSpot, moonSpot.target);
  const hemi = new THREE.HemisphereLight('#3a3050', '#0a0808', .6); scene.add(hemi);

  // the shadow theatre: a slice of the wall in front of the chair
  const WT = wallTheatre(R0 - .03, .62, 4.0, 1.5, 3.1); scene.add(WT.mesh, WT.light);
  const wallDir = new THREE.Vector3(Math.sin(.62), 0, Math.cos(.62));

  // characters
  const N = makeChar('noeul'); scene.add(N.root); N.root.position.set(1.85, 0, 1.75);
  const Hr = makeChar('haru'); scene.add(Hr.root);
  const fill = new THREE.PointLight('#9fb2e8', 1.2, 6, 2); scene.add(fill);
  const lamp = new THREE.PointLight('#ffb050', 2.4, 7, 2); scene.add(lamp);
  const halo = glow('#ffc070', .4, 1.0); scene.add(halo);
  const popL = new THREE.PointLight('#ffffff', 0, 5, 2); scene.add(popL);
  const popG = glow('#ffffff', 1, 1); scene.add(popG);
  const mothL = new THREE.PointLight('#ffffff', 0, 4, 2); scene.add(mothL);

  // —— the dream moths ——
  const O = new THREE.Vector3(1.92, 1.05, 1.8);   // just above her head (sitting)
  const PIPE_TOP = new THREE.Vector3(SP.x, 7.5, SP.z);
  const born = k => k < 10 ? T.pops[k] : k < 10 + NB ? T.big + (k - 10) * .018 : k === 50 ? T.blueRise : T.fishSpin[0] - .8;
  const colOf = k => k < 10 ? POPC[k] : k < 10 + NB ? DREAMS[(k - 10) % DREAMS.length] : k === 50 ? BLUE : '#ff9ad0';
  const COLS = [...Array(52)].map((_, k) => rgb(colOf(k)));
  const free = (k, t, out) => {   // a dream moth's own flight (deterministic): out of her head, then loops of its own
    const tb = born(k), u = t - tb, ph = k * 2.399, r = .55 + (k % 4) * .38, w = (k % 2 ? 1 : -1) * (.55 + (k % 3) * .2), yb = 2.0 + (k % 5) * .38;
    const big = k >= 10 && k < 10 + NB, dir = new THREE.Vector3(Math.cos(ph), .35 + (k % 3) * .25, Math.sin(ph)).normalize();
    const pop = new THREE.Vector3().copy(O).addScaledVector(dir, (1 - Math.exp(-u * 3)) * (big ? 1.7 : .7)).add(new THREE.Vector3(0, u * (big ? .5 : .45), 0));
    const ch = ss(seg(t, 34, 35.2)) * (1 - ss(seg(t, 47.4, 48.8)));   // through the chase they circle his head, just out of reach
    const loop = new THREE.Vector3(lerp(1.05, .75, ch) + Math.cos(w * t + ph) * r * lerp(1, .8, ch), yb - ch * .75 + Math.sin(t * (.9 + (k % 4) * .15) + ph) * .35, lerp(1.45, .7, ch) + Math.sin(w * t + ph) * r * .75);
    out.copy(pop).lerp(loop, ss(seg(u, .5, big ? 2.2 : 1.8)));
    return out;
  };
  const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), lampAt = new THREE.Vector3(), headAt = new THREE.Vector3();
  const curlTo = (i, u, a, b, k = 1, out) => { const s = ss(u), wob = Math.sin(u * Math.PI) * (.4 + (i % 5) * .1) * k, ph = i * 2.39;
    return out.set(lerp(a.x, b.x, s) + Math.cos(ph + u * 7) * wob, lerp(a.y, b.y, s) + Math.sin(u * Math.PI) * .5 * k, lerp(a.z, b.z, s) + Math.sin(ph + u * 7) * wob); };
  const featHover = (t, out) => out.copy(lampAt).addScaledVector(wallDir, .55).add(new THREE.Vector3(Math.sin(t * 2.1) * .06, .32 + Math.sin(t * 2.9) * .05, Math.cos(t * 1.7) * .05));
  const streamAt = (k, t, out) => {   // up the stove pipe: to the pipe, a spiral up round it, gone through the ceiling
    const td = T.stream[0] + (k % 50) * .11, u1 = seg(t, td, td + 1.3), u2 = seg(t, td + 1.3, td + 2.6);
    free(k, td, V1); const mouth = V2.set(SP.x - .25, 2.6 + (k % 6) * .15, SP.z);
    curlTo(k, u1, V1, mouth, .8, out);
    if (u2 > 0) { const a = u2 * 9 + k, rr = .32 - u2 * .14; out.set(SP.x + Math.cos(a) * rr, lerp(mouth.y, 7.5, ss(u2)), SP.z + Math.sin(a) * rr); }
    return out;
  };
  const DM = colorMoths(52, (k, t, o) => {
    o.a = 0; const tb = born(k); if (t < tb) return;
    const u = t - tb; let a = ss(seg(u, 0, .15)); o.s = k === 50 ? .7 : k < 10 ? .34 : .3; o.f = Math.floor(t * (k === 50 ? 4 : 9) + k * .37) % 2;
    [o.r, o.g, o.b] = COLS[k];
    if (k === 50) {   // the last dream: slow, big, deep blue; it hangs before the wall, then goes up the pipe
      const B = V2.copy(lampAt).add(new THREE.Vector3(0, .5, 0)).addScaledVector(wallDir, .25), from = O;
      if (t < T.blueOut[0]) { o.x = lerp(from.x, B.x, ss(seg(u, 0, 1.4))) + Math.sin(t * 1.1) * .08; o.y = lerp(from.y, B.y, ss(seg(u, 0, 1.4))) + Math.sin(t * 1.7) * .06; o.z = lerp(from.z, B.z, ss(seg(u, 0, 1.4))); }
      else { const v = seg(t, T.blueOut[0], T.blueOut[1]); o.x = lerp(B.x, SP.x, ss(v)); o.y = lerp(B.y, 7.4, ss(v) * ss(v)); o.z = lerp(B.z, SP.z, ss(v)); a *= 1 - ss(seg(v, .7, 1)); }
      if (t > T.blueOut[1] + .5) a = 0;
      o.a = a; return;
    }
    if (k === 51) { o.x = 1.95 + Math.sin(t * 1.3) * .2; o.y = 2.4 + Math.sin(t * 2.1) * .12; o.z = 2.2 + Math.cos(t * 1.1) * .15; o.a = a; return; }
    if (t > T.stream[0] && k < 50 && t > T.stream[0] + (k % 50) * .11) { streamAt(k, t, V1); o.x = V1.x; o.y = V1.y; o.z = V1.z; const td = T.stream[0] + (k % 50) * .11; o.a = a * (1 - ss(seg(t, td + 2.2, td + 2.6))); return; }
    free(k, t, V1);
    // the featured ones: the fish (pink, k0), the teapots (gold, k6), the flyer (sky, k3) hover before his lantern; k8 lands on his head
    const feat = (k === 0 && t > T.fishOn - 1.2 && t < T.fishOff + .4) || (k === 6 && t > T.teapotOn - .6 && t < 31.6) || (k === 3 && t > 31.0 && t < T.teapotOff + .2);
    if (feat) { const t0 = k === 0 ? T.fishOn - 1.2 : k === 6 ? T.teapotOn - .6 : 31.0, t1 = k === 0 ? T.fishOff + .4 : k === 6 ? 31.6 : T.teapotOff + .2;
      featHover(t, V2); const e = ss(seg(t, t0, t0 + .8)) * (1 - ss(seg(t, t1 - .6, t1))); V1.lerp(V2, e); }
    if (k === 8 && t > T.hatLand - 1.4) { headAt.copy(Hr.root.position).add(new THREE.Vector3(0, 1.38, .05)); const v = seg(t, T.hatLand - 1.4, T.hatLand); free(k, T.hatLand - 1.4, V2); curlTo(k, v, V2, headAt, .5, V1); if (v >= 1) { V1.copy(headAt); o.f = Math.floor(t * 2) % 2; } }
    o.x = V1.x; o.y = V1.y; o.z = V1.z; o.a = a;
  });
  scene.add(DM);
  const halos = particles(52, (k, t, o) => { o.a = 0; const tb = born(k); if (t < tb) return; o.x = DM.geometry.attributes.position.array[k * 3]; o.y = DM.geometry.attributes.position.array[k * 3 + 1]; o.z = DM.geometry.attributes.position.array[k * 3 + 2];
    o.a = DM.geometry.attributes.a.array[k] * .55; [o.r, o.g, o.b] = COLS[k]; o.s = k === 50 ? 1.5 : .62; }, { soft: 1 });
  scene.add(halos);

  const CAM = {
    snore: { p: track([[0, [-.35, 1.75, -1.15]], [13.4, [-.1, 1.65, -.75]]]), l: track([[0, [1.55, 1.25, 1.75]], [13.4, [1.55, 1.2, 1.75]]]), fov: 32 },
    shadow: { p: track([[0, [-1.55, 1.6, -2.15]], [14.4, [-1.3, 1.6, -1.8]]]), l: track([[0, [2.54, 1.3, 3.56]], [14.4, [2.54, 1.32, 3.56]]]), fov: 34 },
    chase: { p: track([[0, [-.75, 2.65, -1.25]], [9.4, [-.85, 2.6, -1.35]], [10.4, [-1.55, 1.6, -2.15]], [14.4, [-1.45, 1.6, -2.0]]]), l: track([[0, [.75, .2, .85]], [9.4, [.85, .2, .85]], [10.4, [2.54, 1.3, 3.56]], [14.4, [2.54, 1.32, 3.56]]]), fov: 34 },
    burst: { p: track([[0, [-.75, 1.35, 2.05]], [1.4, [-.75, 1.35, 2.05]], [3.6, [-1.1, 1.4, 2.1]], [9.6, [-1.3, 1.5, 2.15]]]), l: track([[0, [2.6, 1.55, 1.75]], [1.4, [2.6, 1.6, 1.75]], [4.2, [3.2, 3.6, 1.75]], [9.6, [3.4, 6.4, 1.75]]]), fov: 34 },
    lastDream: { p: track([[0, [-1.6, 1.6, -2.2]], [14.2, [-1.3, 1.6, -1.8]]]), l: track([[0, [2.54, 1.3, 3.56]], [14.2, [2.54, 1.36, 3.56]]]), fov: 34 },
    coda: { p: track([[0, [-1.4, 1.6, -2.0]], [4, [-1.2, 1.6, -1.7]]]), l: track([[0, [2.54, 1.35, 3.56]], [4, [2.54, 1.35, 3.56]]]), fov: 33 },
  };
  let focusObj = null;
  const snoreAt = t => T.snores.concat([T.big]).find(s => t > s - .9 && t < s + .7);
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, C = CAM[id] || CAM.snore;
    const morning = id === 'coda' ? 1 : 0;
    SH.forEach(s => { s.g.material.emissiveIntensity = .9 + .3 * Math.sin(t * 1.6 + s.ph); });
    candleL.intensity = 3.0 * flick(t, 4) * (1 - .6 * morning); candleG.visible = !morning;
    stoveL.intensity = 1.6 * flick(t, 7);
    beam.userData.aim(winP, new THREE.Vector3(.6, -4.6, 1.2).sub(winP).normalize(), cam); beam.material.uniforms.k.value = morning ? .55 : .3; beam.material.uniforms.t.value = t;
    beam.material.uniforms.col.value.set(morning ? '#ffd9a0' : '#8fa8e0');
    moonSpot.color.set(morning ? '#ffd2a0' : '#8fa8e0'); moonSpot.intensity = morning ? 34 : 18; pane.material.color.set(morning ? '#fff0d0' : '#9fb8ff');
    hemi.color.set(morning ? '#8a7060' : '#3a3050'); hemi.intensity = morning ? 1.1 : .6;
    // camera first: the sprites turn to where it is this frame
    cam.fov = C.fov * FOVK; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(...C.p(lt)); const look = new THREE.Vector3(...C.l(lt));
    if (id === 'burst') { const sh = Math.exp(-Math.max(0, t - T.big - .25) / .3) * (t > T.big + .25 ? 1 : 0); cam.position.x += Math.sin(t * 61) * .025 * sh; cam.position.y += Math.sin(t * 47) * .02 * sh; }
    cam.lookAt(look);
    // 노을: asleep (breathing in, the snore with the mouth open), not here in the morning coda
    N.root.visible = !morning;
    const sn = snoreAt(t); let nf = 'sleep';
    if (sn != null) nf = t < sn - .05 ? 'sleepIn' : 'snore';
    N.face(cam); N.frame(nf);
    // 하루 by shot
    let hx = 1.05, hz = 1.2, hy = 0, hf = 'hold', rot = 0, show = true, flip = false;
    const blink = [2.2, 5.6, 8.1, 11.9, 25.1, 29.5, 33.0, 80.9, 85.7].some(b => t > b && t < b + .12);
    if (id === 'snore') { hx = 1.2; hz = 2.4; hf = Math.floor(t * .8) % 3 ? 'hold' : 'hold1'; }
    if (id === 'shadow') { hx = 1.55; hz = 3.15; hf = Math.floor(t * 1.1) % 2 ? 'hup1' : 'hup'; }
    if (id === 'chase') {
      hx = .35; hz = .55;
      if (t < T.jump - .9) hf = Math.floor(t * 5) % 2 ? 'hup1' : 'hup';                       // calling, waving the lantern
      else if (t < T.jump) { const v = seg(t, T.jump - .9, T.jump); hx = lerp(.35, .75, v); hf = ['hw0', 'hw1', 'hw2', 'hw3'][Math.floor(t * 10) % 4]; }
      else if (t < T.fall) { const v = seg(t, T.jump, T.jump + .6); hx = .75 + v * .25; hy = Math.sin(Math.min(1, v) * Math.PI) * .55; hf = 'jump'; }
      else if (t < T.sitUp) { const v = seg(t, T.fall, T.fall + .35); hx = 1.0; hf = 'hold'; rot = ss(v) * 1.3; hy = .02; }   // over he goes
      else if (t < T.hatLand - 1.0) { hx = 1.0; hf = Math.floor(t * 1.2) % 2 ? 'sitL' : 'sitLB'; }
      else { hx = 1.0; hf = 'hold'; }
    }
    if (id === 'burst') { hx = .9; hz = 1.35; hf = t < T.stream[0] + 1 ? 'hold' : Math.floor(t * 4) % 2 ? 'hup1' : 'hup'; flip = false; }
    if (id === 'lastDream') { hx = 1.55; hz = 3.15; hf = t < T.blueRise + .6 ? 'hold' : Math.floor(t * .9) % 2 ? 'hup1' : 'hup'; }
    if (id === 'coda') show = false;
    Hr.root.visible = show; Hr.root.position.set(hx, hy, hz); Hr.face(cam, flip); Hr.frame(hf); Hr.mesh.rotation.z = flip ? rot : -rot; Hr.mesh.position.x = rot ? -rot * .45 : 0;
    lampAt.copy(Hr.lanternPos(hf, flip));
    lamp.position.copy(lampAt).add(new THREE.Vector3(0, .05, 0)).addScaledVector(cam.position.clone().sub(lampAt).normalize(), .5); lamp.intensity = show ? 2.4 * flick(t, 3) : 0;
    halo.position.copy(lampAt); halo.visible = show; halo.material.opacity = .5;
    fill.position.copy(N.root.position).add(new THREE.Vector3(-.6, 1.6, -1.2)); fill.intensity = 1.3;
    // pops: a flash of the dream's colour at her head (a new light: the shadows jump)
    const pk = T.pops.map((p, k) => [p, k]).filter(([p]) => t >= p && t < p + .8).pop();
    const bigPop = t >= T.big && t < T.big + 1.2;
    if (pk || bigPop) { const p = bigPop ? T.big : pk[0], f = Math.exp(-(t - p) / (bigPop ? .4 : .22)); popL.position.copy(O).add(new THREE.Vector3(0, .25, 0)); popL.color.set(bigPop ? '#ffffff' : POPC[pk[1]]); popL.intensity = (bigPop ? 14 : 7) * f;
      popG.position.copy(O).add(new THREE.Vector3(0, .2, 0)); popG.visible = true; popG.material.color.set(bigPop ? '#ffffff' : POPC[pk[1]]); popG.scale.setScalar((bigPop ? 2.6 : 1.1) * (.4 + f)); popG.material.opacity = f; }
    else { popL.intensity = 0; popG.visible = false; }
    DM.userData.update(t); halos.userData.update(t);
    // the light of the featured moth (or the blue one)
    const fk = id === 'lastDream' ? 50 : (t > T.fishOn - 1 && t < T.fishOff) ? 0 : (t > T.teapotOn - .5 && t < 31.4) ? 6 : (t > 31.2 && t < T.teapotOff) ? 3 : (t > T.hatLand - 1.4 && t < T.hatShadow[1]) ? 8 : -1;
    if (t > T.stream[0] + .3 && t < T.stream[1] + 1) { const v = seg(t, T.stream[0] + .3, T.stream[1]); mothL.position.set(SP.x - .45, lerp(2.4, 6.8, v), SP.z + .1); mothL.color.set(DREAMS[Math.floor(t * 4) % DREAMS.length]); mothL.intensity = 7 * (1 - ss(seg(t, T.stream[1], T.stream[1] + 1))); }
    else if (fk >= 0) { const A = DM.geometry.attributes; mothL.position.set(A.position.array[fk * 3], A.position.array[fk * 3 + 1], A.position.array[fk * 3 + 2]); mothL.color.setRGB(...COLS[fk]); mothL.intensity = 3.5 * A.a.array[fk]; } else mothL.intensity = 0;
    // —— the wall plays ——
    let st = null;
    const env = (a, b, ia = .7, ob = .5) => ss(seg(t, a, a + ia)) * (1 - ss(seg(t, b - ob, b)));
    if (t > T.fishOn && t < T.fishOff) st = { play: 'fish', col: POPC[0], on: env(T.fishOn, T.fishOff), u: t - T.fishOn };
    else if (t > T.teapotOn && t < 31.4) st = { play: 'teapots', col: POPC[6], on: env(T.teapotOn, 31.4, .6, .4), u: t - T.teapotOn };
    else if (t > 31.4 && t < T.teapotOff) st = { play: 'flyer', col: POPC[3], on: env(31.4, T.teapotOff, .4, .5), u: t - 31.4 };
    else if (t > T.hatShadow[0] && t < T.hatShadow[1]) st = { play: 'hat', col: POPC[8], on: env(T.hatShadow[0], T.hatShadow[1], .6, .4), u: t - T.hatShadow[0], hat: true };
    else if (t > T.playOn && t < T.blueOut[0] + 1.2) { const s = t < T.snow[1] ? 'snow' : t < T.rain[1] ? 'rain' : 'leaves';
      st = { play: 'seasons', col: '#7f9cff', on: env(T.playOn, T.blueOut[0] + 1.2, 1.0, .9) * (1 - .55 * Math.exp(-Math.abs(t - T.snow[1]) / .18) - .55 * Math.exp(-Math.abs(t - T.rain[1]) / .18)), u: t - T.playOn, season: s, age: ss(seg(t, T.snow[0], T.leaves[1] - .6)) }; }
    else if (id === 'coda') st = { play: 'spin', col: '#ffc8b0', on: env(shot.a + .3, T.fadeOut[1] + 1, .8, .4), u: lt, spin: ss(seg(t, T.fishSpin[0], T.fishSpin[1])) };
    WT.mesh.visible = !!st; if (st) { st.flick = .9 + .1 * Math.sin(t * 9) * Math.sin(t * 5.3); WT.draw(t, st); } else WT.light.intensity = 0;
    // focus
    const subj = id === 'snore' ? new THREE.Vector3(1.6, 1.0, 1.65) : (id === 'chase' && lt < 9.8) ? Hr.root.position.clone().setY(.8) : id === 'burst' ? (t < T.stream[0] + .6 ? O.clone() : new THREE.Vector3(SP.x, lerp(2.5, 6, ss(seg(t, T.stream[0] + .6, T.stream[1]))), SP.z)) : WT.centre.clone().lerp(Hr.root.position.clone().setY(1.2), .25);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.aper = id === 'snore' ? 140 : 110; post.dof.maxCoc = 16;
    focusObj = subj;
    post.bloom.strength = .62; post.bloom.threshold = .8;
    renderer.toneMappingExposure = morning ? 1.3 : 1.18;
    post.vig.uniforms.warm.value = morning ? .22 : .1; post.vig.uniforms.amt.value = .68;
  }
  // sound events for the mixer
  const events = [
    ...T.snores.map(s => ({ t: s, type: 'snore' })), { t: T.big, type: 'bigSnore' },
    ...T.pops.map((p, k) => ({ t: p, type: 'pop', i: k })), ...[...Array(NB)].map((_, j) => ({ t: T.big + .1 + j * .018 * 6, type: 'popSmall', i: j })).filter((e, j) => j % 6 === 0),
    { t: T.fishOn, type: 'play' }, { t: T.teapotOn, type: 'play' }, { t: 31.4, type: 'play' }, { t: T.hatShadow[0], type: 'play' }, { t: T.playOn, type: 'play' },
    { t: T.jump, type: 'jump' }, { t: T.fall + .3, type: 'thud' }, { t: T.hatLand, type: 'hatLand' },
    { t: T.stream[0], type: 'stream' }, { t: T.blueRise, type: 'blueRise' }, { t: T.blueOut[0], type: 'blueOut' }, { t: T.fishSpin[0], type: 'spin' },
  ];
  return { scene, update, focus: () => focusObj, events };
}
