/*
 * scenes.js — 「남은 길」, a 30-second wordless short (storyboard.md): a defeated skeleton knight walks a dry plain at
 * dusk with his crow. One painted world in three.js (js/kit.js), seven shots cut on the cues s01–s07, every beat from
 * js/timeline.js (shared with the synthesized sound). Cel shading with outlines, a painted sky and hills, then the film
 * finish in the DOM (grade, paper, grain, vignette, letterbox). The picture steps at 24 fps and the characters move on
 * twos (12 poses a second), like hand-drawn animation. Everything is a pure function of t.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data, rand } = ctx;
  scene('#world', 0, data.duration + 1);
  const W = 1920, H = 1080, END = data.duration, TL = window.TLINE, TAU = Math.PI * 2;
  const S = (id) => cue(id).start;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x);
  const lerp = (a, b, x) => a + (b - a) * x;
  const $ = (id) => document.getElementById(id);
  if (document.fonts && document.fonts.load) await document.fonts.load("700 74px 'Gowun Batang'");

  // ---------------- the knight's road: speed, distance, gait ----------------
  const SP = TL.speed;
  const speedAt = (t) => { if (t <= SP[0][0]) return SP[0][1]; for (let i = 1; i < SP.length; i++) if (t <= SP[i][0]) return lerp(SP[i - 1][1], SP[i][1], (t - SP[i - 1][0]) / (SP[i][0] - SP[i - 1][0])); return SP[SP.length - 1][1]; };
  const distAt = (t) => { let d = 0; for (let i = 1; i < SP.length; i++) { const [a, va] = SP[i - 1], [b, vb] = SP[i]; if (t <= a) break; const e = Math.min(t, b), ve = lerp(va, vb, (e - a) / (b - a)); d += (va + ve) / 2 * (e - a); } if (t > SP[SP.length - 1][0]) d += SP[SP.length - 1][1] * (t - SP[SP.length - 1][0]); return d; };
  const VMAX = 0.85, phaseAt = (t) => distAt(t) / TL.stride, ampAt = (t) => clamp(speedAt(t) / VMAX, 0, 1);
  const [GX, GZ] = TL.grave;
  // footfalls: the left foot lands when the gait phase passes .25, the right (the lame one) at .75
  const steps = [];
  for (let t = 0, prev = phaseAt(0); t < END; t += 1 / 240) { const p = phaseAt(t + 1 / 240); for (const [f, side] of [[0.25, -1], [0.75, 1]]) { const k = Math.floor(prev - f), k2 = Math.floor(p - f); if (k2 > k && ampAt(t) > 0.35) steps.push({ t, side, x: distAt(t) + 0.18 }); } prev = p; }

  // ---------------- three.js ----------------
  const s3d = Stage3D.create($('gl'), { W, H, fov: 30, environment: false });
  const T = s3d.THREE, R = s3d.renderer, KIT = window.KIT.init(T, rand), sc = s3d.scene, cam = s3d.camera;
  cam.far = 900; cam.updateProjectionMatrix(); 
  R.toneMapping = T.NoToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFShadowMap;
  const outline = new T.OutlineEffect(R, { defaultThickness: 0.0034, defaultColor: [0.17, 0.09, 0.07], defaultAlpha: 1 });
  sc.fog = new T.Fog(0xe7a37c, 34, 210);
  const hemi = new T.HemisphereLight(0x9a82cc, 0x6e4e40, 0.9); sc.add(hemi);
  const sun = new T.DirectionalLight(0xffb574, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.025; sc.add(sun, sun.target);
  const sky = KIT.sky(); sc.add(sky); sc.add(KIT.hills(14)); sc.add(KIT.ground()); sc.add(KIT.road());
  if (typeof Video.progress === 'function') Video.progress(0.35);

  // the plain: grass, rocks, dead trees, what the battle left behind
  const grassA = KIT.grass(460, -8, 40, -14, 13, 11), grassB = KIT.grass(110, -4, 18, 13, 25, 12); sc.add(grassA, grassB);
  const props = new T.Group(); sc.add(props);
  const r0 = rand(404);
  const put = (o, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.multiplyScalar(s); props.add(o); return o; };
  for (let i = 0; i < 46; i++) { const x = -8 + r0() * 46, z = (r0() < 0.5 ? -1 : 1) * (2.4 + r0() * 9); put(KIT.rock(0.15 + r0() * 0.45), x, 0.05, z); }
  // swords and spears stuck in the ground, some with rags
  const flags = [];
  const stuck = (x, z, kind, tilt, yaw, flag) => { const o = kind === 'spear' ? KIT.spear(1.6 + r0() * 0.9) : KIT.sword(0.9 + r0() * 0.2, r0() < 0.4);
    const g = new T.Group(); g.add(o); if (kind !== 'spear') { o.rotation.z = Math.PI; o.position.y = 0.55; } else o.position.y = -0.25;
    if (flag && kind === 'spear') { const f = KIT.cloth(0.42, 0.62, 6, 8, flag, Math.floor(r0() * 1000)); f.position.set(0.02, 1.7, 0); f.rotation.y = Math.PI / 2; g.add(f); flags.push({ f, ph: r0() * 6 }); }
    put(g, x, 0, z, 0, yaw, tilt); return g; };
  for (let i = 0; i < 34; i++) { const x = -6 + r0() * 44, z = (r0() < 0.5 ? -1 : 1) * (3 + r0() * 10); stuck(x, z, r0() < 0.45 ? 'spear' : 'sword', (r0() - 0.5) * 0.7, r0() * 3, r0() < 0.35 ? ['#4a5d7a', '#8a6a3a', '#6d2f2f'][Math.floor(r0() * 3)] : null); }
  // the near foreground of the opening shot
  [[1.2, 17.5, 'sword', 0.25], [12.4, 18.2, 'spear', 0.3, '#4a5d7a'], [14.6, 19.6, 'sword', 0.15]].forEach(([x, z, k, tl, fl]) => stuck(x, z, k, tl, r0() * 3, fl || null));
  put(KIT.shield(), 3.6, 0.12, 19.4, 0.5, 0.3, 0.9); put(KIT.helmetOnGround(), 10.6, 0.08, 19.0); put(KIT.shield(), 3.0, 0.1, 6.4, 0.4, 1.2, 1.1); put(KIT.helmetOnGround(), 12.4, 0.08, -3.6);
  put(KIT.deadTree(5.2, 31), 16.5, 0, 10.5); put(KIT.deadTree(4.0, 32), 28.5, 0, -7.5); put(KIT.deadTree(3.4, 33), 4.0, 0, -9.0); put(KIT.deadTree(4.6, 34), 34.0, 0, 6.0);
  // the grave by the road: a mound, a sword driven in, a scarf on its hilt, a leaning banner, a ring of stones
  const grave = new T.Group(); grave.position.set(GX, 0, GZ); sc.add(grave);
  { const mound = KIT.mesh(new T.SphereGeometry(0.75, 18, 10, 0, TAU, 0, Math.PI / 2), KIT.toon(0x8a6446)); mound.scale.set(1.2, 0.36, 0.8); grave.add(mound);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, st = KIT.rock(0.11 + (i % 3) * 0.03, '#9c8574'); st.position.set(Math.cos(a) * 0.95, 0.04, Math.sin(a) * 0.68); grave.add(st); }
    const gs = KIT.sword(1.0, false); gs.rotation.z = Math.PI; gs.position.y = 0.95; grave.add(gs);
    const banner = new T.Group(); banner.position.set(-0.55, 0, -0.35); banner.rotation.set(0.12, 0.4, 0.22); banner.add(KIT.rod([0, 0, 0], [0, 2.3, 0], 0.025, KIT.wood));
    const bf = KIT.cloth(0.62, 0.95, 7, 10, '#4b5f80', 909, (x, w, h) => { x.fillStyle = 'rgba(230,200,140,0.55)'; x.beginPath(); x.arc(w / 2, h * 0.32, 38, 0, Math.PI * 2); x.fill(); }); bf.position.set(0.03, 2.25, 0); bf.rotation.y = Math.PI / 2; banner.add(bf); grave.add(banner); flags.push({ f: bf, ph: 1.3, grave: true });
    const scarf = KIT.cloth(0.09, 0.55, 2, 8, '#a8413b', 515); scarf.position.set(0, 1.05, 0.02); scarf.rotation.y = Math.PI / 2; grave.add(scarf); flags.push({ f: scarf, ph: 0.4, scarf: true });
    const gh = KIT.helmetOnGround(); gh.position.set(0.55, 0.18, 0.3); gh.rotation.y = 2.2; grave.add(gh); }
  const POMMEL = new T.Vector3(GX, 0.95 + 0.2 + 0.03, GZ);

  // the knight and the crow
  const kn = KIT.knight(); sc.add(kn.root);
  const cr = KIT.crow(); sc.add(cr.root);
  const perch = new T.Object3D(); perch.position.set(-0.01, 0.55, 0.3); kn.torso.add(perch);
  // dust: a trail scratched by the sword tip, puffs at the footfalls, motes in the light
  const groove = new T.Mesh(new T.PlaneGeometry(1, 0.035), new T.MeshBasicMaterial({ color: 0x5e3f2b, transparent: true, opacity: 0.6, depthWrite: false }));
  groove.material.userData.outlineParameters = { visible: false }; groove.rotation.x = -Math.PI / 2; groove.renderOrder = 2; sc.add(groove);
  const puffs = KIT.puffs(14); puffs.forEach((p) => sc.add(p));
  const motes = KIT.motes(140, 77); sc.add(motes);
  const eyeGlow = [0, 1].map(() => { const m = new T.SpriteMaterial({ map: KIT.glowTex, color: 0xff9a40, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }); m.userData.outlineParameters = { visible: false }; const s = new T.Sprite(m); s.scale.setScalar(0.09); sc.add(s); return s; });
  if (typeof Video.progress === 'function') Video.progress(0.6);

  // ---------------- the crow's flight (s05) and the hop back (s06) ----------------
  const C = TL.crow;
  const v3 = (x, y, z) => new T.Vector3(x, y, z), tmp = new T.Vector3(), tmp2 = new T.Vector3(), q = new T.Quaternion();
  const perchAt = (t) => { poseKnight(t); kn.root.updateMatrixWorld(true); return perch.getWorldPosition(new T.Vector3()); };
  let flight = null, hop = null;
  const buildPaths = () => {
    const p0 = perchAt(C.takeoff), x0 = p0.x;
    flight = new T.CatmullRomCurve3([p0, v3(x0 + 1.2, 2.6, 0.2), v3(x0 + 3.4, 4.6, -1.4), v3(x0 + 6.0, 5.4, -3.2), v3(GX + 1.4, 4.2, GZ - 2.6), v3(GX + 0.9, 2.2, GZ - 0.6), POMMEL.clone()]);
    const p1 = perchAt(C.hop[1]);
    hop = new T.CatmullRomCurve3([POMMEL.clone(), v3((POMMEL.x + p1.x) / 2, POMMEL.y + 0.6, (POMMEL.z + p1.z) / 2), p1]);
  };

  // ---------------- poses ----------------
  const ev = TL.knight;
  function poseKnight(t) {
    const p = phaseAt(t), a = ampAt(t), w = TAU * p, x = distAt(t);
    kn.root.position.set(x, 0, 0);
    const face = io(K(t, ev.faceGrave, ev.faceGrave + 0.8)) * (1 - io(K(t, TL.speed[3][0], TL.speed[3][0] + 0.8)));
    kn.root.rotation.y = 0.5 * face;
    kn.hips.position.y = 0.98 - a * 0.045 * Math.abs(Math.sin(w)) - a * 0.02 * Math.max(0, Math.sin(w + Math.PI));
    kn.hips.rotation.set(a * 0.035 * Math.sin(w), a * 0.06 * Math.sin(w), 0);
    const [L, Rg] = kn.legs;
    L.hipP.rotation.z = a * 0.42 * Math.sin(w); L.knee.rotation.z = -a * 0.75 * Math.pow(Math.max(0, Math.cos(w)), 1.5);
    Rg.hipP.rotation.z = a * 0.32 * Math.sin(w + Math.PI); Rg.knee.rotation.z = -a * 0.45 * Math.pow(Math.max(0, Math.cos(w + Math.PI)), 1.5);
    L.foot.rotation.z = -L.knee.rotation.z * 0.3 - L.hipP.rotation.z * 0.6; Rg.foot.rotation.z = -Rg.knee.rotation.z * 0.3 - Rg.hipP.rotation.z * 0.6;
    const bow = io(K(t, ev.bow, ev.bow + 0.9)) * (1 - io(K(t, ev.rise, ev.rise + 0.8)));
    kn.torso.rotation.set(0, 0, -0.3 - 0.3 * bow + a * 0.025 * Math.sin(2 * w));
    const [aL, aR] = kn.arms;
    aL.sh.rotation.set(0.1, 0, -a * 0.28 * Math.sin(w) + 0.05); aL.el.rotation.z = 0.25 + 0.1 * a;
    aR.sh.rotation.set(-0.16, 0, 0.12 + a * 0.05 * Math.sin(w + Math.PI)); aR.el.rotation.z = 0.12;
    // the head hangs; it turns to the crow (s04) and to the grave (s06)
    const toCrow = io(K(t, ev.turnToCrow, ev.turnToCrow + 1.0)) * (1 - io(K(t, C.takeoff - 0.2, C.takeoff + 0.6)));
    kn.neck.rotation.set(0, 0, -0.22 + 0.1 * toCrow - 0.4 * bow);
    kn.head.rotation.set(0.06 * toCrow, -0.62 * toCrow + 0.35 * face, -0.05 + a * 0.03 * Math.sin(2 * w + 0.6));
    // ember eyes: always a faint glow, warmer when he looks at the crow
    const glow = 0.45 + 0.55 * io(K(t, ev.ember, ev.ember + 1.2)) * (1 - io(K(t, C.takeoff + 0.5, C.takeoff + 2.0))) + 0.05 * Math.sin(t * 3.1);
    kn.ember.color.setRGB(1, 0.55 + 0.2 * glow, 0.25 + 0.15 * glow); kn.root.userData.glow = glow;
    // the cape, trailing and lifting in the wind; a gust at the grave
    const gust = Math.exp(-Math.pow((t - TL.gust - 0.6) / 0.7, 2));
    kn.cape.userData.drape((u, v, o) => { o[0] = u * 0.6 * (0.62 + 0.38 * Math.sqrt(v)); o[1] = -v * 1.0 * (1 - 0.06 * gust * v);
      o[2] = 0.16 * (1 - v) * Math.pow(u * 2, 2) - (0.03 + 0.07 * v) - a * 0.1 * Math.pow(v, 1.4) - gust * 0.35 * Math.pow(v, 1.2) + 0.05 * v * Math.sin(5.5 * v - 3.1 * t + u * 3) + 0.035 * v * Math.sin(w + v * 2);
      o[0] += 0.04 * v * Math.sin(4 * v - 2.3 * t + u * 5) + gust * 0.12 * v * Math.sin(7 * v - 9 * t); });
    // the sword: from the hand, its broken tip on the ground behind
    kn.root.updateMatrixWorld(true);
    const hand = kn.arms[1].hand.getWorldPosition(tmp); kn.root.worldToLocal(hand);
    const len = kn.sword.userData.len + 0.09, cphi = clamp((hand.y - 0.015) / len, -1, 1), phi = Math.acos(cphi);
    kn.sword.position.set(hand.x - Math.sin(phi) * 0.09, hand.y - Math.cos(phi) * 0.09, hand.z + 0.02);
    kn.sword.rotation.set(-0.05, 0, -phi);
    return { x, tipX: x + hand.x - Math.sin(phi) * len, tipZ: hand.z + 0.02 };
  }
  function poseCrow(t) {
    const r = cr.root; let fly = 0, flap = 0, spread = 0;
    const [L, Rw] = [cr.wings[0], cr.wings[1]];
    let lookYaw = 0.5 * Math.sin(t * 0.7) * Math.sin(t * 0.23 + 1) , headUp = 0, beak = 0, lean = 0;
    // caws: head up, beak open
    for (const [ct, lv] of C.caws) { const k = K(t, ct - 0.12, ct) * (1 - K(t, ct + 0.32, ct + 0.5)); headUp += 0.32 * k * Math.min(1, lv + 0.4); beak += k * (0.45 + 0.25 * lv); lean += 0.12 * k; }
    if (t < C.takeoff) {
      // on the knight's shoulder: it looks at him, then leans its head on his helmet
      const p = perchAt(t); kn.root.updateMatrixWorld(true); perch.getWorldQuaternion(q);
      r.position.copy(p); r.quaternion.copy(q); r.rotateZ(0.3);
      const look = io(K(t, C.lookKnight, C.lookKnight + 0.5)), nuz = io(K(t, C.nuzzle, C.nuzzle + 0.5)) * (1 - io(K(t, C.nuzzle + 0.9, C.nuzzle + 1.3)));
      lookYaw = lerp(lookYaw, 1.15, look); r.rotateY(0.25 * look); cr.body.position.z = -0.05 * nuz; cr.body.rotation.x = 0.25 * nuz;
      const crouch = io(K(t, C.takeoff - 0.35, C.takeoff)); cr.body.position.y = 0.13 - 0.04 * crouch; spread = 0.4 * crouch;
    } else if (t < C.land) {
      // the flight: up and ahead into the light, a wide turn, a glide down to the grave
      const k = K(t, C.takeoff, C.land), u = io(k) * 0.82 + k * 0.18, pos = flight.getPointAt(Math.min(1, u)), ahead = flight.getPointAt(Math.min(1, u + 0.02));
      r.position.copy(pos); tmp2.copy(ahead).sub(pos); const yaw = Math.atan2(-tmp2.z, tmp2.x), pitch = Math.atan2(tmp2.y, Math.hypot(tmp2.x, tmp2.z));
      r.rotation.set(0, yaw, clamp(pitch, -0.6, 0.6)); fly = 1; spread = 1;
      const glide = K(t, C.land - 1.6, C.land - 0.55) * (1 - K(t, C.land - 0.45, C.land - 0.1));
      flap = Math.sin(t * TAU * (t < C.takeoff + 1 ? 3.4 : 2.6)) * (1 - 0.8 * glide); lookYaw = 0; cr.body.position.set(0, 0.13, 0); cr.body.rotation.set(0, 0, 0);
    } else if (t < C.hop[0]) {
      r.position.copy(POMMEL); r.rotation.set(0, -2.2, 0); const settle = 1 - K(t, C.land, C.land + 0.4); spread = settle; flap = Math.sin(t * TAU * 4) * settle;
      lookYaw = lerp(lookYaw, 0.0, io(K(t, ev.faceGrave + 0.4, ev.faceGrave + 1.0)));
    } else if (t < C.hop[1]) {
      const k = io(K(t, C.hop[0], C.hop[1])); r.position.copy(hop.getPointAt(k)); r.rotation.set(0, lerp(-2.2, 0, k), 0); spread = 1; flap = Math.sin(t * TAU * 4.2); lookYaw = 0;
    } else {
      const p = perchAt(t); kn.root.updateMatrixWorld(true); perch.getWorldQuaternion(q); r.position.copy(p); r.quaternion.copy(q); r.rotateZ(0.3); cr.body.position.set(0, 0.13, 0); cr.body.rotation.set(0, 0, 0);
      spread = 1 - K(t, C.hop[1], C.hop[1] + 0.35);
    }
    Rw.rotation.set(-0.95 * flap * spread - (1 - spread) * 1.4, lerp(-1.42, 0, spread), 0); L.rotation.set(0.95 * flap * spread + (1 - spread) * 1.4, lerp(1.42, 0, spread), 0); { const fs = lerp(0.6, 1, spread); Rw.scale.setScalar(fs); L.scale.setScalar(fs); }
    cr.head.rotation.set(0, lookYaw * (1 - fly), headUp); cr.body.rotation.z = (cr.body.rotation.z || 0) * 0 + lean;
    cr.up.rotation.z = 0.12 * beak; cr.lo.rotation.z = -0.55 * beak; cr.tail.rotation.z = 0.15 * Math.sin(t * 2.3) * (1 - fly) - 0.2 * fly;
  }

  // ---------------- the camera, shot by shot ----------------
  // the cuts come from the cues in script.json; js/timeline.js keeps the same numbers for the sound generator
  const CUE_AT = Object.fromEntries(window.VIDEO_DATA.cues.map((c) => [c.id, c.start]));
  const SH = ['s01', 's02', 's03', 's04', 's05', 's06', 's07'].map((id) => CUE_AT[id]).concat(window.VIDEO_DATA.duration);
  if (SH.some((v, n) => Math.abs(v - TL.shots[n]) > 1e-3)) console.warn('dusk-knight: cue starts and js/timeline.js shots disagree — re-run sfx/make_sound.py after editing either');
  const shotAt = (t) => { let i = 0; while (i + 1 < SH.length - 1 && t >= SH[i + 1]) i++; return i; };
  const look = new T.Vector3();
  const sunAt = (t) => { const el = lerp(8.5, 2.2, t / 30) * Math.PI / 180 - 0.012 * K(t, 25, 30); return new T.Vector3(0.45 * Math.cos(el), Math.sin(el), -0.89 * Math.cos(el)).normalize(); };
  function camAt(t, i) {
    const x = distAt(t), k = K(t, SH[i], SH[i + 1]), e = io(k);
    switch (i) {
      // s01: far and low, the two small against the hills; a slow push
      case 0: cam.position.set(6.4 + 0.8 * e, 1.05 + 0.15 * e, 27.5 - 2.4 * e); look.set(7.2, 1.85, -6); return [7, 6, 30];
      // s02: down at the feet, the broken blade dragging
      case 1: cam.position.set(x + 0.45, 0.42, 2.7); look.set(x - 0.15, 0.4, 0); return [x, 0, 5];
      // s03: alongside, the low sun behind them
      case 2: cam.position.set(x + 0.5 - 0.2 * e, 1.18, 6.3 - 0.4 * e); look.set(x + 1.7, 1.28, 0); return [x, 0, 9];
      // s04: the face and the crow together, from the crow's side, a slow drift in
      case 3: cam.position.set(x + 1.6 - 0.2 * e, 1.58, 1.8 - 0.12 * e); look.set(x + 0.0, 1.74, 0.16); return [x, 0, 4];
      // s05: beside the crow as it climbs into the light, then wide on the road ahead and the grave
      case 4: { const c = cr.root.position, side = v3(c.x - 0.9, c.y - 0.45, c.z + 3.7), wide = v3(GX - 4.2, 1.35, 3.6), k2 = io(K(t, SH[5] - 1.7, SH[5] - 0.2));
        cam.position.lerpVectors(side, wide, k2); look.lerpVectors(v3(c.x + 0.7, c.y + 0.1, c.z), v3(GX - 0.3, 1.0, GZ), k2); return [x + 3, 0, 14]; }
      // s06: from beyond the grave, the knight facing it, the crow on the sword between them
      case 5: cam.position.set(GX + 3.0 - 0.2 * e, 1.0, GZ - 0.5 + 0.05 * e); look.set(GX - 0.45, 1.05, GZ * 0.5); return [GX - 0.5, -0.5, 6];
      // s07: behind them and to the side, toward the setting sun; they walk away
      default: { const x0 = distAt(SH[6]); cam.position.set(x0 - 5.0, 1.15 + 0.7 * e, 4.0); look.set(x + 6, 1.7 + 0.2 * e, -9.5); return [x0 + 2, -1, 14]; }
    }
  }

  // ---------------- the film finish (DOM) ----------------
  const paper = $('paper').getContext('2d'); { const r = rand(5); paper.fillStyle = '#ffffff'; paper.fillRect(0, 0, 960, 540); for (let i = 0; i < 2600; i++) { paper.globalAlpha = 0.04 + r() * 0.08; paper.fillStyle = r() < 0.5 ? '#b89878' : '#8f7a90'; paper.beginPath(); paper.ellipse(r() * 960, r() * 540, 4 + r() * 26, 1 + r() * 4, r() * 3, 0, TAU); paper.fill(); } }
  const grain = $('grain').getContext('2d'), gimg = grain.createImageData(480, 270);
  const black = $('black'), title = $('title');
  let lastFrame = -1;

  // ---------------- sound: one synthesized soundtrack (sfx/make_sound.py), on the master clock ----------------
  const M = MEDIA.install(ctx);
  M.clip($('sfx'), 'soundtrack', { x: 0, y: 0, w: 4, h: 4, start: 0, dur: M.SRC.soundtrack.dur, audio: true, vol: 1 });

  buildPaths();
  onFrame((t) => {
    const f24 = Math.floor(t * 24 + 1e-6), tq = f24 / 24, tc = Math.floor(t * 12 + 1e-6) / 12;
    // characters on twos, the world on ones
    const kp = poseKnight(tc); poseCrow(tc);
    const i = shotAt(tq), sh = camAt(tq, i); cam.lookAt(look);
    // sun and sky sink with the clock
    const sd = sunAt(tq); sky.userData.u.sunDir.value.copy(sd); sky.userData.u.uDrift.value = tq * 0.0012; sky.userData.u.uDusk.value = K(tq, 6, 30) * 0.8;
    sun.target.position.set(sh[0], 0, sh[1]); sun.position.copy(sun.target.position).addScaledVector(sd, 60);
    sun.intensity = 2.6 * (0.55 + 0.45 * (1 - K(tq, 18, 30))); sun.color.setRGB(1, 0.71 - 0.12 * K(tq, 10, 30), 0.45 - 0.12 * K(tq, 10, 30));
    hemi.intensity = 0.9 - 0.25 * K(tq, 20, 30);
    const shc = sun.shadow.camera, half = sh[2]; if (shc.right !== half) { shc.left = -half; shc.right = half; shc.top = half; shc.bottom = -half; shc.near = 1; shc.far = 140; shc.updateProjectionMatrix(); }
    // wind in the grass and the rags
    grassA.userData.update(tq); grassB.userData.update(tq);
    const gust = Math.exp(-Math.pow((tq - TL.gust - 0.5) / 0.8, 2));
    for (const fl of flags) { const st = fl.grave ? 0.6 + 1.8 * gust : 0.6, sp = fl.scarf ? 0.6 : 1;
      fl.f.userData.drape((u, v, o) => { o[0] = u * (fl.scarf ? 0.09 : 0.62) + 0.03 * v * Math.sin(6 * v - 4 * tq + fl.ph) * st; o[1] = -v * (fl.scarf ? 0.5 : 0.92) * (1 - 0.25 * Math.min(1, st - 0.6) * v * sp);
        o[2] = -(0.08 + 0.2 * st) * v * (fl.scarf ? 1.6 : 1) + 0.06 * v * Math.sin(5 * v - 5.2 * tq + fl.ph + u * 3) * st; }); }
    // the groove behind the sword tip
    const g0 = -3; groove.position.set((g0 + kp.tipX) / 2, 0.009, kp.tipZ); groove.scale.set(Math.max(0.01, kp.tipX - g0), 1, 1);
    // dust at the footfalls
    let pi = 0; for (const s of steps) { const age = tq - s.t; if (age < 0 || age > 1.2) continue;
      for (let j = 0; j < 3 && pi < puffs.length; j++, pi++) { const p = puffs[pi], r = rand(Math.round(s.t * 1000) + j)(); p.visible = true; p.position.set(s.x + (j - 1) * 0.07 + age * 0.12, 0.05 + age * (0.18 + 0.1 * r), s.side * 0.1 + (r - 0.5) * 0.1); p.scale.setScalar(0.12 + age * (0.35 + 0.2 * r)); p.material.opacity = 0.42 * (1 - age / 1.2) * Math.min(1, age * 8); } }
    for (; pi < puffs.length; pi++) puffs[pi].visible = false;
    motes.userData.update(tq, sh[0]);
    // ember glow sprites (they read in the close shots)
    const glow = kn.root.userData.glow || 0; kn.eyes.forEach((e, n) => { e.getWorldPosition(eyeGlow[n].position); eyeGlow[n].position.lerp(cam.position, 0.012); eyeGlow[n].material.opacity = (i === 3 || i === 5 ? 0.8 : 0.35) * glow; });
    s3d.fit(); outline.render(sc, cam);

    // finish: fade to dusk-black, the title, grain
    black.style.opacity = (0.92 * io(K(t, TL.fade[0], TL.fade[1]))).toFixed(3);
    title.style.opacity = (io(K(t, TL.title[0], TL.title[0] + 1.2))).toFixed(3);
    title.style.transform = `translateY(${(8 * (1 - K(t, TL.title[0], TL.title[1]))).toFixed(1)}px)`;
    if (f24 !== lastFrame) { lastFrame = f24; const r = rand(f24 * 7 + 3), d = gimg.data; for (let n = 0; n < d.length; n += 4) { const v = 128 + (r() - 0.5) * 230; d[n] = d[n + 1] = d[n + 2] = v; d[n + 3] = 255; } grain.putImageData(gimg, 0, 0); }
  });
});
