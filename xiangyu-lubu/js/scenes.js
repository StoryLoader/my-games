/*
 * scenes.js — 「항우 vs 여포」, a documentary in four steps (기승전결) on the record of 『사기』, 『삼국지』, 『후한서』.
 * One ink-wash world (js/ink.js, storyboard.md → 월드 바이블): sets painted in depth along the x axis of one three.js
 * scene, a shot table that picks the set and the camera for every cue, the writing on the painting in the DOM (vertical
 * inscriptions with seals, brushed words, numbers), the paper over everything and the ink-drop transitions on top.
 * Everything is a pure function of t.
 */
Video.define(async (ctx) => {
  const { tl, cue, onFrame, scene, data, rand } = ctx;
  scene('#world', 0, data.duration + 1);
  const END = data.duration, TAU = Math.PI * 2;
  const S = (id) => cue(id).start, E = (id) => cue(id).end;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x), eo = (x) => 1 - (1 - x) ** 3, lerp = (a, b, x) => a + (b - a) * x;
  const $ = (id) => document.getElementById(id);
  const IDS = ctx.cues.map((c) => c.id);
  const next = (id) => IDS[IDS.indexOf(id) + 1];
  if (document.fonts && document.fonts.load) await Promise.all(["700 80px 'LXGW WenKai TC'", "80px 'Song Myung'", "80px 'Nanum Brush Script'"].map((f) => document.fonts.load(f, '項羽 항우')));
  const prog = (p) => { if (typeof Video.progress === 'function') Video.progress(p); };

  // ================================= three.js =================================
  const s3d = Stage3D.create($('gl'), { W: 1920, H: 1080, fov: 30, environment: false });
  const T = s3d.THREE, R = s3d.renderer, sc = s3d.scene, cam = s3d.camera;
  R.toneMapping = T.NoToneMapping; cam.near = 0.1; cam.far = 1200; cam.updateProjectionMatrix();
  const INK = window.INK.init(T, rand);
  sc.fog = new T.Fog(0xefe6d4, 30, 260);
  const hemi = new T.HemisphereLight(0xfff4e0, 0x6a5a48, 1.1); sc.add(hemi);
  const key = new T.DirectionalLight(0xffe2b0, 2.2); key.position.set(-6, 10, 8); sc.add(key, key.target);

  // ---------------- skies (the paper behind everything, toned per mood) ----------------
  const skyOf = (top, mid, bot, glow) => INK.tex(INK.cv(512, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (glow) { const r = x.createRadialGradient(glow[0] * w, glow[1] * h, 0, glow[0] * w, glow[1] * h, glow[2] * w); r.addColorStop(0, glow[3]); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h); }
  }));
  const SKY = {
    day: { tex: skyOf('#e6dcc6', '#efe6d4', '#f1e9d8', [0.3, 0.45, 0.6, 'rgba(255,236,190,0.55)']), fog: 0xefe6d4 },
    bronze: { tex: skyOf('#ddc9a2', '#ecdcbc', '#f1e6d2', [0.25, 0.5, 0.7, 'rgba(240,196,120,0.6)']), fog: 0xeadcc0 },
    cool: { tex: skyOf('#d5d6d0', '#e4e3db', '#ece8de', [0.75, 0.35, 0.5, 'rgba(255,255,255,0.6)']), fog: 0xe6e4dc },
    night: { tex: skyOf('#2c2b33', '#4a4850', '#6b6866', [0.7, 0.25, 0.25, 'rgba(230,226,210,0.55)']), fog: 0x55535a },
    fire: { tex: skyOf('#2a2224', '#5a3a30', '#b0603a', [0.5, 1.0, 0.8, 'rgba(240,140,60,0.6)']), fog: 0x6a4a3c },
    dawn: { tex: skyOf('#c9c4bc', '#e4d2b8', '#efdcc0', [0.5, 0.72, 0.6, 'rgba(255,220,170,0.7)']), fog: 0xe8dac4 },
    winter: { tex: skyOf('#bfbfbd', '#d4d3cf', '#e0ddd6', null), fog: 0xd6d4ce },
    dream: { tex: skyOf('#efe6d4', '#efe6d4', '#efe6d4', null), fog: 0xefe6d4 },
  };
  prog(0.15);

  // ---------------- painted pieces made once ----------------
  const RIDGES = [
    INK.ridge({ seed: 11, peaks: 3, steep: 0.1, rough: 7, cun: 300, trees: 6 }),
    INK.ridge({ seed: 23, peaks: 5, steep: 0.07, rough: 9, cun: 280, trees: 4 }),
    INK.ridge({ seed: 37, peaks: 2, steep: 0.16, rough: 5, cun: 220 }),
    INK.ridge({ seed: 41, peaks: 4, steep: 0.09, rough: 8, cun: 260, dark: 0.7 }),
    INK.ridge({ seed: 53, peaks: 1, steep: 0.22, rough: 6, cun: 200, top: 0.08 }),
    INK.ridge({ seed: 67, peaks: 6, steep: 0.05, rough: 11, cun: 240, base: 0.7 }),
  ];
  prog(0.3);
  const BANK = [INK.ridge({ seed: 71, peaks: 2, steep: 0.35, rough: 10, cun: 160, top: 0.45, base: 0.95, trees: 3 }), INK.ridge({ seed: 79, peaks: 3, steep: 0.3, rough: 12, cun: 160, top: 0.5, base: 0.95, trees: 2 })];
  const DARKRIDGE = [INK.ridge({ seed: 91, peaks: 4, steep: 0.08, rough: 9, cun: 420, dark: 1.0, base: 0.98, top: 0.06 }), INK.ridge({ seed: 97, peaks: 3, steep: 0.12, rough: 7, cun: 380, dark: 1.0, base: 0.98 })];
  const PLAIN = INK.ridge({ seed: 101, peaks: 8, steep: 0.06, rough: 14, cun: 120, top: 0.6, base: 0.98, dots: 120 });
  const WATER = INK.waterTex(12);
  prog(0.45);

  const sets = {};
  const SET = (name, x0) => { const g = new T.Group(); g.position.x = x0; g.visible = false; sc.add(g); sets[name] = g; return g; };
  const add = (g, o, x, y, z, s = 1) => { o.position.set(x, y, z); if (s !== 1) o.scale.multiplyScalar(s); g.add(o); return o; };
  /** a vista: ridges going back into the mist, mist bands between them */
  function vista(g, o = {}) {
    const seed = o.seed || 0, dark = o.dark || 1, R0 = o.ridges || RIDGES;
    const L = o.layers || [[-16, 70, 18, -1.5], [-34, 130, 34, -3], [-64, 230, 60, -6], [-115, 400, 104, -10], [-200, 680, 170, -16]];
    L.forEach(([z, w, h, y], i) => { const m = INK.layer(R0[(seed + i) % R0.length], w, h, { opacity: (o.op || 1) * (i === 0 ? 1 : i >= 3 ? 0.62 : 0.92), color: o.tint || 0xffffff }); m.position.set((o.dx || 0) + ((seed * 13 + i * 29) % 17 - 8) * (i + 1) * 0.6, y + h * 0.5 * (o.lift || 0.55), z); g.add(m);
      if (i < L.length - 1 && o.mist !== false) { const mm = INK.mist(w * 1.4, h * 0.45, 0.8); mm.renderOrder = 0; mm.position.set(0, y + h * 0.05, z + 2); g.add(mm); } });
  }
  /** a near bank (dark foreground earth with a few trees) */
  const bank = (g, x, y, z, w, h, k = 0, flip = false) => { const m = INK.layer(BANK[k % 2], w, h); m.position.set(x, y + h / 2, z); if (flip) m.scale.x = -1; g.add(m); return m; };
  const waterPlane = (g, x, z, w, d, y = 0, tint = 0xffffff, op = 0.85) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: WATER, transparent: true, depthWrite: false, opacity: op, color: tint })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  const sun = (g, x, y, z, s, col = 0xfff2d8, a = 0.9) => { const d = new T.Sprite(new T.SpriteMaterial({ map: INK.discTex, color: col, transparent: true, depthWrite: false, fog: false, opacity: a })); d.scale.setScalar(s); d.position.set(x, y, z); g.add(d); const gl = INK.glow(col, s * 4.5, 0.5); gl.position.set(x, y, z - 1); g.add(gl); return d; };
  const flag = (g, x, z, ch, h = 3.2, col = '#151315', lean = 0) => {
    const c = INK.cv(256, 320, (x2, w) => { const r = rand(ch.charCodeAt(0)); INK.stroke(x2, [[18, 10], [20, 160], [22, 316]], 8, 7, '#151315', 1, r); x2.fillStyle = col; x2.globalAlpha = 0.9; x2.beginPath(); x2.moveTo(26, 14); x2.lineTo(236, 22); x2.quadraticCurveTo(222, 90, 240, 158); x2.lineTo(26, 150); x2.fill(); x2.globalAlpha = 1; x2.fillStyle = '#efe6d4'; x2.font = "700 104px 'LXGW WenKai TC', serif"; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(ch, 132, 88); });
    const m = INK.layer(INK.tex(c), h * 0.8, h); m.geometry.translate(h * 0.4 - 0.15, h / 2, 0); m.position.set(x, 0, z); m.rotation.z = lean; g.add(m); return m;
  };
  /** the riders */
  const XR = INK.rider('xiang', 3), LR = INK.rider('lu', 5);
  const XR2 = INK.rider('xiang', 7), LR2 = INK.rider('lu', 9);   // second copies for sets where both are seen
  const riders = [XR, LR, XR2, LR2];
  const fig = (kind, seed, h, o) => INK.figure(kind, seed, h, o);
  prog(0.55);

  // =========================== the sets ===========================
  // 1 · PRO — two ridges with the mist river of 400 years between them
  const PRO = SET('pro', 0);
  vista(PRO, { seed: 0 });
  sun(PRO, 0, 22, -230, 12, 0xfff6e6, 0.85);
  const proL = bank(PRO, -13, -1.2, 2, 22, 7, 0), proR = bank(PRO, 13, -1.2, 2, 22, 7, 1, true);
  const proMist = []; for (let i = 0; i < 4; i++) { const m = INK.mist(14, 5, 0.9); m.position.set(0, -0.5 + i * 0.5, -2 - i * 3); PRO.add(m); proMist.push(m); }
  // 2 · BOOKS — hanging silk scrolls in the mist
  const BOOKS = SET('books', 200);
  vista(BOOKS, { seed: 3, op: 0.55 });
  const scroll = (title, author, seed, red) => INK.tex(INK.cv(360, 1080, (x, w, h) => {
    const r = rand(seed); x.fillStyle = '#3a2f2a'; x.fillRect(0, 0, w, 40); x.fillRect(0, h - 50, w, 50);
    x.fillStyle = red ? '#e9dcc4' : '#efe4cd'; x.fillRect(16, 40, w - 32, h - 90); x.fillStyle = 'rgba(120,96,64,0.12)'; for (let i = 0; i < 400; i++) x.fillRect(16 + r() * (w - 40), 40 + r() * (h - 100), 1 + r() * 3, 1);
    x.fillStyle = '#151315'; x.font = "700 120px 'LXGW WenKai TC', serif"; x.textAlign = 'center'; x.textBaseline = 'top';
    [...title].forEach((ch, i) => x.fillText(ch, w / 2, 110 + i * 140));
    x.font = "700 52px 'LXGW WenKai TC', serif"; [...author].forEach((ch, i) => x.fillText(ch, w / 2 + 92, 610 + i * 62));
    x.fillStyle = '#c0392b'; x.fillRect(w / 2 - 34, h - 190, 68, 68); x.fillStyle = '#efe6d4'; x.font = "700 30px 'LXGW WenKai TC', serif"; x.fillText(red ? '小說' : '史', w / 2, h - 176);
  }));
  const SCR = [['史記', '司馬遷', 1], ['三國志', '陳壽', 2], ['後漢書', '范曄', 3], ['三國演義', '羅貫中', 4, true]].map(([a, b, s, red], i) => { const m = INK.layer(scroll(a, b, s, red), 2.4, 7.2, { order: 2 }); m.geometry.translate(0, -3.6, 0); m.position.set(-5.4 + i * 3.6, 7.0, -2 - (i % 2) * 0.6); BOOKS.add(m); return m; });
  const rods = SCR.map((m) => { const r = INK.layer(INK.tex(INK.cv(256, 32, (x) => { x.fillStyle = '#3a2f2a'; x.fillRect(0, 6, 256, 20); x.fillStyle = '#151315'; x.fillRect(0, 0, 18, 32); x.fillRect(238, 0, 18, 32); })), 2.7, 0.34, { order: 3 }); r.position.copy(m.position); r.position.z += 0.02; BOOKS.add(r); return r; });
  const unroll = (t, i, at) => { const u = io(K(t, at, at + 1.4)); SCR[i].scale.y = Math.max(0.02, u); rods[i].position.y = 7.0 - 7.2 * Math.max(0.02, u); };
  const unrollAll = (t, times) => SCR.forEach((m, i) => unroll(t, i, times[i]));
  // 3 · XIANG — the valley of 항우: a river (강동), willows, a warm low sun
  const XI = SET('xiang', 400);
  vista(XI, { seed: 1 });
  sun(XI, -40, 26, -240, 16, 0xf6d9a0, 0.95);
  waterPlane(XI, 0, -20, 260, 60, -0.6, 0xffffff, 0.7);
  bank(XI, -12, -1.4, 4, 24, 8, 0); bank(XI, 16, -1.6, 6, 26, 8, 1, true);
  const chuFlag = flag(XI, -3, -1, '楚', 3.6, '#2a2523', 0.9);
  const spears = []; for (let i = 0; i < 9; i++) { const m = INK.layer(INK.tex(INK.cv(32, 256, (x) => { x.fillStyle = '#151315'; x.fillRect(14, 20, 4, 236); x.beginPath(); x.moveTo(12, 22); x.lineTo(16, 0); x.lineTo(20, 22); x.fill(); })), 0.12, 2.4); m.geometry.translate(0, 1.0, 0); m.position.set(-8 + i * 1.9 + (i % 3) * 0.3, 0, -2 - (i % 4)); m.rotation.z = (i % 2 ? 1 : -1) * (0.15 + 0.08 * (i % 3)); XI.add(m); spears.push(m); }
  const grand = fig('general', 41, 3.0); add(XI, grand, 2.5, 0, -3); grand.material.opacity = 0;
  const uncle = fig('general', 43, 2.2), youth = fig('youth', 45, 2.0); add(XI, uncle, 3.6, 0, 1); add(XI, youth, 5.0, 0, 1.4);
  const lifter = fig('lift', 47, 3.2); add(XI, lifter, 0, 0, 2);
  // the cauldron — real 3D bronze, lit by the warm key
  const DING = INK.ding(); DING.scale.setScalar(1.0); add(XI, DING, 0, 3.5, 2.6);
  const legion = INK.crowd(2600, (i, r) => [-60 + r() * 120, 0, -6 - r() * 40, 1.6], { seed: 5 }); XI.add(legion); legion.visible = false;
  const carriages = new T.Group(); XI.add(carriages);
  for (let i = 0; i < 9; i++) { const c = INK.layer(INK.tex(INK.cv(256, 160, (x) => { const r = rand(i + 300); x.fillStyle = '#151315'; x.globalAlpha = 0.92; x.fillRect(40, 30, 160, 70); x.beginPath(); x.moveTo(20, 34); x.quadraticCurveTo(120, -8, 230, 34); x.fill(); x.lineWidth = 6; x.strokeStyle = '#151315'; x.beginPath(); x.arc(80, 118, 32, 0, TAU); x.stroke(); x.beginPath(); x.arc(170, 118, 32, 0, TAU); x.stroke(); if (i % 3 === 0) { x.fillRect(118, -40, 4, 70); x.fillStyle = '#2a2523'; x.fillRect(122, -40, 50, 34); } })), 3.2, 2.0); c.geometry.translate(0, 1.0, 0); c.position.set(-40 + i * 7, 0, -18); carriages.add(c); }
  carriages.visible = false;
  const youthHill = fig('youth', 49, 2.2); add(XI, youthHill, -6, 0, 3); youthHill.visible = false;
  const eightK = INK.crowd(900, (i, r) => [-30 + r() * 60, 0, -4 - r() * 14, 1.3], { seed: 8 }); XI.add(eightK); eightK.visible = false;
  // 4 · LU — the northern steppe: flat land, cold white sun, grass in the wind
  const LU = SET('lu', 600);
  vista(LU, { seed: 4, layers: [[-40, 200, 22, -2], [-90, 360, 40, -4], [-160, 620, 70, -8]] });
  sun(LU, 60, 30, -230, 11, 0xffffff, 0.95);
  const grassTex = INK.tex(INK.cv(1024, 256, (x, w, h) => { const r = rand(222); for (let i = 0; i < 700; i++) { const px = r() * w, L = 30 + r() * 110, lean = 0.2 + r() * 0.5; INK.stroke(x, INK.quad([px, h], [px + L * lean * 0.5, h - L * 0.6], [px + L * lean, h - L]), 3, 0.5, '#151315', 0.35 + 0.4 * r(), r); } }));
  const grassL = []; for (let i = 0; i < 3; i++) { const m = INK.layer(grassTex, 60 + i * 30, 3 + i, { opacity: 0.9 }); m.position.set(0, (3 + i) / 2 - 0.3, 3 - i * 8); LU.add(m); grassL.push(m); }
  const dingYuan = fig('lord', 51, 3.0), luStand = fig('general', 53, 2.6); add(LU, dingYuan, -2.2, 0, -1); add(LU, luStand, 1.6, 0, -0.6);
  const luoyang = INK.layer(INK.tex(INK.cityCanvas({ seed: 61 })), 30, 11.25); luoyang.position.set(10, 11.25 / 2 - 0.5, -40); LU.add(luoyang);
  const dongArmy = INK.crowd(1800, (i, r) => [-50 + r() * 60, 0, -14 - r() * 24, 1.7], { seed: 13 }); LU.add(dongArmy);
  const dingFlag = flag(LU, -4.2, -1.2, '丁', 3.4);
  const arrow = INK.layer(INK.tex(INK.cv(256, 16, (x) => { x.fillStyle = '#151315'; x.fillRect(0, 7, 220, 2); x.beginPath(); x.moveTo(220, 2); x.lineTo(256, 8); x.lineTo(220, 14); x.fill(); x.fillRect(0, 2, 26, 12); })), 1.6, 0.1); LU.add(arrow);
  // 5 · JULU — the walled city under siege, the river with the boats and the pots
  const JU = SET('julu', 800);
  vista(JU, { seed: 2 });
  sun(JU, -50, 20, -240, 14, 0xf6d9a0, 0.9);
  const juluCity = INK.layer(INK.tex(INK.cityCanvas({ seed: 71 })), 40, 15); juluCity.position.set(0, 15 / 2 - 1, -60); JU.add(juluCity);
  const qinRing = INK.crowd(3000, (i, r) => { const a = r() * TAU, rr = 24 + r() * 10; return [Math.cos(a) * rr * 1.6, 0, -60 + Math.sin(a) * rr * 0.5 + 8, 2.4]; }, { seed: 17 }); JU.add(qinRing);
  waterPlane(JU, 0, -8, 200, 24, -0.2, 0xffffff, 0.8);
  const boats = []; for (let i = 0; i < 6; i++) { const b = INK.layer(INK.tex(INK.boatCanvas(i + 1)), 4.2, 1.64); b.geometry.translate(0, 0.5, 0); b.position.set(-11 + i * 4.4, 0, -6 - (i % 2) * 2.5); JU.add(b); boats.push(b); }
  const potW = INK.tex(INK.potCanvas(false, 1)), potB = INK.tex(INK.potCanvas(true, 2));
  const pots = []; for (let i = 0; i < 5; i++) { const p = INK.layer(potW, 1.4, 1.4); p.position.set(-6 + i * 3, 0.7, 3 + (i % 2) * 0.6); JU.add(p); pots.push(p); }
  const huts = []; for (let i = 0; i < 4; i++) { const h = INK.layer(INK.tex(INK.cv(256, 200, (x) => { x.fillStyle = '#151315'; x.globalAlpha = 0.9; x.beginPath(); x.moveTo(10, 120); x.lineTo(128, 10); x.lineTo(246, 120); x.fill(); x.fillRect(40, 118, 176, 80); })), 3.2, 2.5); h.position.set(-14 + i * 9, 1.25, -2.5); JU.add(h); huts.push(h); }
  const FLAMES = INK.flameFrames(9);
  const flameSprites = (g, n, place, s = 1) => Array.from({ length: n }, (_, i) => { const m = new T.Sprite(new T.SpriteMaterial({ map: FLAMES[0], transparent: true, depthWrite: false, fog: false, opacity: 0 })); const p = place(i); m.position.set(p[0], p[1], p[2]); m.scale.set(1.6 * s * (p[3] || 1), 2.4 * s * (p[3] || 1), 1); m.center.set(0.5, 0); g.add(m); m.userData.ph = i * 0.37; return m; });
  const hutFire = flameSprites(JU, 8, (i) => [-14 + (i >> 1) * 9 + (i % 2) * 0.8 - 0.4, 0.2, -2.0, 1.4]);
  const kneelers = []; for (let i = 0; i < 7; i++) { const k = fig('kneel', 60 + i, 2.0); k.position.set(-6 + i * 2, 0, 0); JU.add(k); kneelers.push(k); }
  const watchers = INK.crowd(300, (i, r) => [-30 + r() * 60, 3 + (r() < 0.5 ? 0 : 0.0), -20 - r() * 4, 1.2], { seed: 19 }); JU.add(watchers); watchers.visible = false;
  const palisade = INK.layer(INK.tex(INK.cv(1024, 128, (x) => { x.fillStyle = '#151315'; for (let i = 0; i < 128; i++) { x.globalAlpha = 0.8; x.fillRect(i * 8, 20 + (i % 3) * 4, 6, 108); } })), 60, 3.0); palisade.position.set(0, 1.5, -20.5); JU.add(palisade); palisade.visible = false;
  const throne = fig('lord', 65, 3.4); add(JU, throne, 0, 1.2, 0); throne.visible = false;
  // 6 · PENG — 팽성: the plain at dawn → noon, the city, the two armies, the river
  const PE = SET('peng', 1000);
  vista(PE, { seed: 5, op: 0.85 });
  const pengSun = sun(PE, -40, 8, -220, 14, 0xf3cf90, 0.9);
  const pengCity = INK.layer(INK.tex(INK.cityCanvas({ seed: 81 })), 34, 12.75); pengCity.position.set(16, 12.75 / 2 - 0.6, -46); PE.add(pengCity);
  const hanFlags = [flag(PE, 8, -38, '漢', 4), flag(PE, 20, -38, '漢', 4), flag(PE, 26, -40, '漢', 4)];
  const hanArmy = new T.Group(); PE.add(hanArmy);
  const hanParts = Array.from({ length: 6 }, (_, k) => { const c = INK.crowd(900, (i, r) => [-12 + r() * 24, 0, -12 + r() * 16, 1.5], { seed: 30 + k }); c.position.set(-6 + (k % 3) * 18, 0, -26 - (k >> 1) * 4); hanArmy.add(c); return c; });
  const chuWedge = INK.crowd(260, (i, r) => { const a = r(), b = (r() - 0.5) * a; return [-a * 10, 0, b * 10, 1.5]; }, { seed: 33, color: 0xc89a4a }); PE.add(chuWedge);
  const pengRiver = waterPlane(PE, 0, 4, 220, 14, -0.3, 0xffffff, 0.8);
  const choke = INK.crowd(1400, (i, r) => [-50 + r() * 100, -0.25, 0 + r() * 8, 1.2], { seed: 37, opacity: 0.85 }); PE.add(choke); choke.visible = false;
  const fleeing = [INK.rider('xiang', 21)]; fleeing[0].mesh.scale.setScalar(0.5); PE.add(fleeing[0].mesh);
  // 7 · HALL — 동탁's hall in 장안 (pillars, dais), the thrown 수극, the maid
  const HA = SET('hall', 1200);
  vista(HA, { seed: 2, op: 0.45 }); sun(HA, 30, 20, -200, 10, 0xffffff, 0.8);
  const nearPillar = INK.layer(INK.tex(INK.cv(128, 1024, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(21,19,21,0)'); g.addColorStop(0.3, 'rgba(21,19,21,0.85)'); g.addColorStop(0.7, 'rgba(21,19,21,0.85)'); g.addColorStop(1, 'rgba(21,19,21,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); })), 2.4, 14); nearPillar.position.set(-5.5, 6, 6); HA.add(nearPillar);
  const pillarTex = INK.tex(INK.cv(128, 1024, (x, w, h) => { const r = rand(5); x.fillStyle = '#1a1718'; x.globalAlpha = 0.92; x.fillRect(20, 0, 88, h); x.globalAlpha = 1; x.strokeStyle = 'rgba(239,230,212,0.2)'; for (let i = 0; i < 30; i++) { x.beginPath(); x.moveTo(24 + r() * 80, r() * h); x.lineTo(24 + r() * 80, r() * h); x.stroke(); } }));
  const pillars = []; for (let i = 0; i < 10; i++) { const p = INK.layer(pillarTex, 1.0, 11); p.position.set(-18 + i * 4, 5.5, -13 - (i % 2) * 5); HA.add(p); pillars.push(p); }
  const beam = INK.layer(INK.tex(INK.cv(1024, 64, (x) => { x.fillStyle = '#151315'; x.fillRect(0, 10, 1024, 44); })), 60, 1.4); beam.position.set(0, 10.4, -13); HA.add(beam);
  const dong = fig('lord', 71, 5.2); add(HA, dong, -2.5, 0.6, -10);
  const dais = INK.layer(INK.tex(INK.cv(512, 64, (x) => { x.fillStyle = '#151315'; x.globalAlpha = 0.85; x.fillRect(0, 0, 512, 64); })), 10, 0.8); dais.position.set(-2.5, 0.3, -10.2); HA.add(dais);
  const luHall = fig('general', 73, 2.7); add(HA, luHall, 4, 0, -2);
  const maid = fig('robed', 75, 2.3); add(HA, maid, 8, 0, -5);
  const wangYun = fig('robed', 77, 2.6); add(HA, wangYun, -2, 0, -1); wangYun.visible = false;
  const shouJi = INK.ji(1.4); shouJi.scale.setScalar(0.8); HA.add(shouJi);
  const changan = INK.layer(INK.tex(INK.cityCanvas({ seed: 91, gateOpen: true })), 30, 11.25); changan.position.set(0, 11.25 / 2 - 0.5, -40); HA.add(changan); changan.visible = false;
  // 8 · HEISHAN — the black mountains of 흑산, the bandit host, the red horse cutting through
  const HE = SET('heishan', 1400);
  vista(HE, { seed: 0, ridges: DARKRIDGE.concat(RIDGES.slice(0, 2)), dark: 1.2 });
  sun(HE, 50, 28, -230, 10, 0xffffff, 0.9);
  const zhangYan = INK.crowd(3200, (i, r) => [-40 + r() * 80, 0, -2 - r() * 26, 1.5], { seed: 41 }); HE.add(zhangYan);
  const zhangNear = INK.crowd(500, (i, r) => { const x = -36 + r() * 72; return [x, 0, 6.5 + r() * 4 + (Math.abs(x) < 3 ? 6 : 0), 1.7]; }, { seed: 43 }); HE.add(zhangNear);
  const heFlags = [flag(HE, -10, -10, '黑', 4), flag(HE, 6, -14, '黑', 4), flag(HE, 18, -12, '張', 4)];
  // 9 · GATE — 원문사극: the camp gate with the halberd standing in it, two armies
  const GA = SET('gate', 1600);
  vista(GA, { seed: 4, op: 0.9 });
  sun(GA, 40, 24, -230, 10, 0xffffff, 0.9);
  const gateTex = INK.tex(INK.cv(1024, 600, (x) => { const r = rand(7); INK.stroke(x, [[120, 600], [124, 300], [128, 30]], 34, 30, '#151315', 0.95, r); INK.stroke(x, [[900, 600], [902, 300], [906, 30]], 34, 30, '#151315', 0.95, r); INK.stroke(x, [[60, 70], [500, 56], [960, 70]], 30, 26, '#151315', 0.95, r); INK.stroke(x, [[80, 130], [500, 122], [940, 130]], 14, 12, '#151315', 0.9, r); }));
  const gate = INK.layer(gateTex, 12, 7.0); gate.position.set(0, 3.5, -24); GA.add(gate);
  const gateJi = INK.ji(3.4); gateJi.position.set(0.2, 0, -24.2); GA.add(gateJi);
  const armyA = INK.crowd(900, (i, r) => [-40 + r() * 28, 0, -16 - r() * 18, 1.5], { seed: 51 }), armyB = INK.crowd(700, (i, r) => [12 + r() * 28, 0, -16 - r() * 18, 1.5], { seed: 53 }); GA.add(armyA, armyB);
  const shaft = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.1, 6), new T.MeshBasicMaterial({ color: 0x151315 })); shaft.rotation.z = Math.PI / 2; GA.add(shaft);
  const shotRider = INK.rider('lu', 23); GA.add(shotRider.mesh);
  prog(0.7);

  // 10 · SINAN — night, the pits
  const SI = SET('sinan', 1800);
  vista(SI, { seed: 2, dark: 1.3, op: 0.9 });
  const moon = (g, x, y, z, s) => sun(g, x, y, z, s, 0xf2efe2, 0.95);
  moon(SI, 40, 26, -230, 8);
  const pitTex = INK.tex(INK.cv(512, 128, (x) => { const g = x.createRadialGradient(256, 64, 10, 256, 64, 250); g.addColorStop(0, 'rgba(10,9,10,0.95)'); g.addColorStop(0.7, 'rgba(10,9,10,0.6)'); g.addColorStop(1, 'rgba(10,9,10,0)'); x.fillStyle = g; x.scale(1, 0.5); x.fillRect(0, 0, 512, 256); }));
  for (let i = 0; i < 5; i++) { const p = new T.Mesh(new T.PlaneGeometry(14, 5), new T.MeshBasicMaterial({ map: pitTex, transparent: true, depthWrite: false })); p.rotation.x = -Math.PI / 2; p.position.set(-24 + i * 12, 0.02, -8 - (i % 2) * 6); SI.add(p); }
  const qinPOW = INK.crowd(2400, (i, r) => [-36 + r() * 72, 0, -4 - r() * 18, 1.4], { seed: 61, opacity: 0.9 }); SI.add(qinPOW);
  // 11 · HONGMEN — the banquet tent
  const HO = SET('hongmen', 2000);
  vista(HO, { seed: 3, op: 0.6 });
  const tent = INK.layer(INK.tex(INK.cv(1024, 640, (x, w, h) => { const r = rand(3); x.fillStyle = '#efe6d4'; x.globalAlpha = 0; x.fillRect(0, 0, w, h); x.globalAlpha = 1; INK.stroke(x, INK.quad([20, 200], [512, -40], [1004, 200], 30), 22, 18, '#151315', 0.95, r); for (let k = 0; k < 6; k++) INK.stroke(x, [[100 + k * 165, 150], [100 + k * 165, 640]], 12, 10, '#151315', 0.85, r); x.fillStyle = 'rgba(21,19,21,0.12)'; x.beginPath(); x.moveTo(20, 200); x.quadraticCurveTo(512, -40, 1004, 200); x.lineTo(1004, 640); x.lineTo(20, 640); x.fill(); })), 26, 16.25); tent.position.set(0, 8, -8); HO.add(tent);
  const hxLord = fig('lord', 81, 3.4), lbGuest = fig('lord', 83, 3.0), fanZeng = fig('old', 85, 2.6), dancer = fig('soldier', 87, 2.6);
  add(HO, hxLord, -5, 0.2, -4); add(HO, lbGuest, 5, 0.2, -4); add(HO, fanZeng, -9, 0, -3); add(HO, dancer, 0, 0, -2);
  const jade = [0, 1, 2].map(() => { const g = INK.glow(0xbfe0c8, 1.0, 0); HO.add(g); return g; });
  const cupShards = INK.crowd(40, (i, r) => [-8 + (r() - 0.5) * 2, 0.4 + r() * 1.4, -1.5 + r(), 0.3], { seed: 89, color: 0x7aa58a }); HO.add(cupShards); cupShards.visible = false;
  // 12 · XIANYANG — the palace burning for three months
  const XY = SET('xianyang', 2200);
  vista(XY, { seed: 1, dark: 1.2, op: 0.8 });
  const palace = INK.layer(INK.tex(INK.cityCanvas({ seed: 99, wallH: 200 })), 44, 16.5); palace.position.set(0, 16.5 / 2 - 1, -40); XY.add(palace);
  const palaceFire = flameSprites(XY, 22, (i) => [-20 + i * 1.9, 3 + (i % 3) * 2.2, -38.5, 3.0 + (i % 4) * 0.6]);
  // 13 · ROAD — the night road (비단옷 밤길), the monkey in a hat, the cauldron boiling, the men who leave
  const RO = SET('road', 2400);
  vista(RO, { seed: 4, dark: 1.1 });
  const robed = fig('robed', 101, 2.6, { color: '#2a2523' }); add(RO, robed, 0, 0, 0);
  const monkeyTex = INK.tex(INK.cv(512, 512, (x, w, h) => { const r = rand(13);
    // a monkey sitting, in a scholar's hat — drawn here, in ink
    x.fillStyle = '#151315'; x.globalAlpha = 0.92; x.beginPath(); x.ellipse(256, 340, 100, 120, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(256, 190, 62, 58, 0, 0, TAU); x.fill();
    x.globalAlpha = 1; x.fillStyle = '#efe6d4'; x.beginPath(); x.ellipse(256, 204, 40, 34, 0, 0, TAU); x.fill();
    x.fillStyle = '#151315'; x.beginPath(); x.arc(240, 196, 6, 0, TAU); x.arc(272, 196, 6, 0, TAU); x.fill(); x.fillRect(244, 220, 24, 4);
    x.beginPath(); x.ellipse(194, 186, 16, 20, 0, 0, TAU); x.ellipse(318, 186, 16, 20, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(256, 126, 118, 16, 0, 0, TAU); x.fill(); x.globalAlpha = 0.85; x.beginPath(); x.moveTo(228, 124); x.lineTo(234, 78); x.quadraticCurveTo(256, 70, 278, 78); x.lineTo(284, 124); x.fill(); x.globalAlpha = 1; INK.stroke(x, [[150, 130], [196, 238], [210, 300]], 3, 2, '#151315', 0.8, r); INK.stroke(x, [[362, 130], [316, 238], [302, 300]], 3, 2, '#151315', 0.8, r);   // the hat: a Korean-style 갓, broad brim, strings
    INK.stroke(x, INK.quad([346, 420], [460, 420], [430, 300]), 16, 6, '#151315', 0.9, r);
    INK.stroke(x, [[200, 420], [180, 480]], 30, 20, '#151315', 0.9, r); INK.stroke(x, [[310, 420], [330, 480]], 30, 20, '#151315', 0.9, r);
  }));
  const monkey = INK.layer(monkeyTex, 3.2, 3.2); monkey.position.set(0, 1.6, 0); RO.add(monkey); monkey.visible = false;
  const DING2 = INK.ding(); add(RO, DING2, 0, 1.15, 0); DING2.visible = false;
  const boilFire = flameSprites(RO, 5, (i) => [-0.6 + i * 0.3, 0.0, 0.2, 0.7]);
  const steamTex = INK.glowTex; const steam = Array.from({ length: 8 }, (_, i) => { const m = new T.Sprite(new T.SpriteMaterial({ map: steamTex, color: 0xf4efe6, transparent: true, depthWrite: false, opacity: 0, fog: false })); RO.add(m); return m; });
  const hanxin = fig('general', 103, 2.4), fanzengRoad = fig('old', 105, 2.4); add(RO, hanxin, 0, 0, 0); add(RO, fanzengRoad, 0, 0, 0); hanxin.visible = fanzengRoad.visible = false;
  // 14 · GATES — 여포 going from gate to gate; 연주; 하비 flooded
  const GT = SET('gates', 2600);
  vista(GT, { seed: 5, op: 0.85 });
  const gCity = [61, 63, 65].map((s, i) => { const open = INK.layer(INK.tex(INK.cityCanvas({ seed: s, gateOpen: true, tower: i !== 1 })), 24, 9), shut = INK.layer(INK.tex(INK.cityCanvas({ seed: s, gateOpen: false, tower: i !== 1 })), 24, 9); [open, shut].forEach((m) => { m.position.set(-28 + i * 28, 4.0, -26 - i * 6); GT.add(m); }); return { open, shut }; });
  const gFlags = [flag(GT, -32, -24, '袁', 3.6), flag(GT, -2, -30, '張', 3.6), flag(GT, 24, -36, '袁', 3.6)];
  const XP = SET('xiapi', 2800);
  vista(XP, { seed: 0, op: 0.8 });
  const xpCity = INK.layer(INK.tex(INK.cityCanvas({ seed: 111 })), 40, 15); xpCity.position.set(0, 15 / 2 - 1.2, -30); XP.add(xpCity);
  const flood = waterPlane(XP, 0, -10, 300, 80, -1, 0xd8d2c6, 0.92);
  const waterline = INK.layer(INK.tex(INK.cv(1024, 256, (x, w, h) => { const r = rand(4); const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(200,196,186,0.97)'); g.addColorStop(1, 'rgba(214,210,200,0.97)'); x.fillStyle = g; x.fillRect(0, 10, w, h); INK.stroke(x, [[0, 12], [w * 0.25, 8], [w * 0.5, 14], [w * 0.75, 9], [w, 12]], 6, 5, '#151315', 0.7, r); for (let i = 0; i < 120; i++) { const px = r() * w, py = 30 + r() * (h - 40); INK.stroke(x, [[px, py], [px + 40 + r() * 60, py - 2]], 2, 1, '#151315', 0.15, r); } })), 60, 1); waterline.geometry.translate(0, 0.5, 0); waterline.position.set(0, -1.2, -28.8); XP.add(waterline);
  const caoRing = INK.crowd(1600, (i, r) => [-70 + r() * 140, 0, -48 - r() * 14, 1.5], { seed: 71 }); XP.add(caoRing);
  const seizers = [fig('soldier', 113, 2.3), fig('soldier', 115, 2.3), fig('soldier', 117, 2.3)], chenGong = fig('robed', 119, 2.4);
  seizers.forEach((m, i) => add(XP, m, -2.4 + i * 2.4, 0, 2)); add(XP, chenGong, 0.2, 0, 1.6);
  // 15 · GAIXIA — the night camp ringed by torches
  const GX = SET('gaixia', 3000);
  vista(GX, { seed: 1, dark: 1.2, op: 0.8 });
  moon(GX, -30, 24, -230, 9);
  const camp = INK.layer(INK.tex(INK.cv(1024, 600, (x, w, h) => { const r = rand(31);
    // a commander's tent: a sloped canopy on poles, the front flaps tied back, lamplight inside, two banners
    x.fillStyle = '#151315'; x.globalAlpha = 0.92; x.beginPath(); x.moveTo(60, 330); x.quadraticCurveTo(300, 250, 512, 120); x.quadraticCurveTo(724, 250, 964, 330); x.lineTo(900, 350); x.lineTo(124, 350); x.closePath(); x.fill();
    x.globalAlpha = 0.85; x.fillRect(150, 340, 724, 230);
    const g = x.createRadialGradient(512, 470, 10, 512, 470, 240); g.addColorStop(0, 'rgba(250,190,110,1)'); g.addColorStop(0.5, 'rgba(232,140,60,0.85)'); g.addColorStop(1, 'rgba(120,60,30,0.2)'); x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.moveTo(400, 570); x.lineTo(440, 350); x.lineTo(584, 350); x.lineTo(624, 570); x.fill();
    x.fillStyle = '#151315'; x.beginPath(); x.moveTo(400, 350); x.quadraticCurveTo(380, 470, 330, 570); x.lineTo(400, 570); x.lineTo(450, 350); x.fill(); x.beginPath(); x.moveTo(624, 350); x.quadraticCurveTo(644, 470, 694, 570); x.lineTo(624, 570); x.lineTo(574, 350); x.fill();
    x.fillStyle = '#151315'; x.beginPath(); x.ellipse(500, 520, 22, 40, 0, 0, TAU); x.fill();   // a figure seated inside, against the lamp
    for (const bx of [110, 914]) { INK.stroke(x, [[bx, 600], [bx + 2, 300], [bx + 4, 20]], 8, 6, '#151315', 0.95, r); x.fillStyle = '#2a2523'; x.beginPath(); x.moveTo(bx + 6, 30); x.lineTo(bx + 120, 44); x.quadraticCurveTo(bx + 100, 90, bx + 124, 140); x.lineTo(bx + 6, 128); x.fill(); x.fillStyle = '#efe6d4'; x.font = "700 64px 'LXGW WenKai TC', serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('楚', bx + 62, 86); }
    for (let k = 0; k < 9; k++) INK.stroke(x, INK.quad([170 + k * 80, 330], [170 + k * 80 + 6, 450], [168 + k * 80, 568]), 3, 2, 'rgba(239,230,212,0.18)', 1, r);
  })), 9, 5.27); camp.position.set(0, 2.6, -6); GX.add(camp);
  const lamp = INK.glow(0xf0a050, 6, 0.0); lamp.position.set(0, 1.2, -5.5); GX.add(lamp);
  const torches = Array.from({ length: 70 }, (_, i) => { const a = i / 70 * TAU, rr = 38 + (i % 5) * 3; const m = INK.glow(0xf08a3a, 3.6, 0.0, true); m.position.set(Math.cos(a) * rr * 1.4, 0.8 + (i % 3) * 0.4, -6 + Math.sin(a) * rr * 0.7); GX.add(m); return m; });
  const zhui = INK.rider('xiang', 25), yu = fig('robed', 121, 2.1); add(GX, zhui.mesh, 4.5, 0, -2); add(GX, yu, -3.4, 0, -3.5);
  const swamp = waterPlane(GX, 0, 0, 200, 60, -0.2, 0x8a8a90, 0.0);
  const nightRiders = Array.from({ length: 12 }, (_, i) => { const r = INK.rider('xiang', 30 + i); r.mesh.scale.setScalar(0.45); GX.add(r.mesh); r.mesh.visible = false; return r; });
  const hanHost = INK.crowd(2000, (i, r) => [-40 + r() * 80, 0, -10 - r() * 20, 1.5], { seed: 81 }); GX.add(hanHost); hanHost.visible = false;
  // 16 · WUJIANG — the river crossing at dawn
  const WU = SET('wujiang', 3200);
  vista(WU, { seed: 2, op: 0.75, layers: [[-60, 260, 30, -3], [-120, 460, 60, -6], [-200, 700, 110, -10]] });
  sun(WU, 10, 6, -220, 16, 0xffe4b8, 0.95);
  waterPlane(WU, 0, -30, 400, 80, -0.3, 0xffffff, 0.85);
  const ferry = INK.layer(INK.tex(INK.boatCanvas(9)), 5, 1.95); ferry.geometry.translate(0, 0.6, 0); ferry.position.set(3, -0.2, -6); WU.add(ferry);
  const boatman = fig('robed', 131, 2.0); add(WU, boatman, 4, 0.3, -6.2);
  const xyFoot = fig('general', 133, 2.6); add(WU, xyFoot, -2.4, 0, -2);
  const zhui2 = INK.rider('xiang', 27); WU.add(zhui2.mesh);
  const ghosts = Array.from({ length: 80 }, (_, i) => { const m = INK.glow(0xfff0d0, 0.5, 0); m.position.set(-40 + (i * 37 % 80), 0.2 + (i % 4) * 0.05, -30 - (i * 13 % 40)); WU.add(m); return m; });
  const pursuers = INK.crowd(600, (i, r) => [-30 + r() * 30, 0, -2 - r() * 10, 1.5], { seed: 91 }); WU.add(pursuers); pursuers.visible = false;
  // 17 · BAIMEN — winter, the flooded city, the tower; the binding
  const BM = SET('baimen', 3400);
  vista(BM, { seed: 3, op: 0.7 });
  const bmCity = INK.layer(INK.tex(INK.cityCanvas({ seed: 141 })), 40, 15); bmCity.position.set(0, 15 / 2 - 1.6, -24); BM.add(bmCity);
  waterPlane(BM, 0, -8, 300, 60, -0.8, 0xd0ccc2, 0.9);
  const snow = INK.crowd(500, (i, r) => [-30 + r() * 60, r() * 14, -4 - r() * 30, 0.12], { seed: 151, color: 0xf6f3ea, variant: 3 }); BM.add(snow);
  const caoSeat = fig('lord', 153, 3.4), luBound = fig('bound', 155, 2.4), liuBei = fig('robed', 157, 2.6);
  add(BM, caoSeat, -4, 0.7, -2); const bmDais = INK.layer(INK.tex(INK.cv(512, 64, (x) => { x.fillStyle = '#151315'; x.globalAlpha = 0.85; x.fillRect(0, 0, 512, 64); })), 5, 0.75); bmDais.position.set(-4, 0.37, -2.05); BM.add(bmDais); add(BM, luBound, 2.2, 0, -1); add(BM, liuBei, -7.2, 0, -2.6);
  const ropeTex = INK.tex(INK.cv(256, 256, (x) => { const r = rand(17); for (let k = 0; k < 5; k++) INK.stroke(x, [[20, 60 + k * 30], [128, 70 + k * 30 + (k % 2) * 8], [236, 60 + k * 30]], 6, 5, '#5a4a3a', 0.95, r); }));
  const ropes = INK.layer(ropeTex, 1.2, 1.2); ropes.position.set(2.2, 1.15, -0.85); BM.add(ropes);
  const redHorse = INK.rider('lu', 29); BM.add(redHorse.mesh);
  // 18 · FINALE — the cauldron lifted by many
  const FI = SET('finale', 3600);
  vista(FI, { seed: 5, op: 0.6 });
  const DING3 = INK.ding(); add(FI, DING3, 0, 1.4, 0);
  const lifters = INK.crowd(160, (i, r) => { const a = i / 160 * TAU; return [Math.cos(a) * (2.6 + r() * 2.2), 0, Math.sin(a) * (2.0 + r() * 1.8), 1.5]; }, { seed: 161 }); FI.add(lifters);
  const liftRing = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU + 0.3, m = fig('lift', 170 + i, 1.9); m.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 0.9); FI.add(m); return m; });
  const finShadow = new T.Mesh(new T.CircleGeometry(1.6, 32), new T.MeshBasicMaterial({ color: 0x151315, transparent: true, opacity: 0.25, depthWrite: false })); finShadow.rotation.x = -Math.PI / 2; finShadow.position.y = 0.01; FI.add(finShadow);
  const beamLight = INK.glow(0xfff2d0, 9, 0.5); beamLight.position.set(0, 5, -1.5); FI.add(beamLight);
  prog(0.85);

  // ============================ the writing (DOM) ============================
  const W$ = $('writing');
  const sealCanvas = (chars, size = 64, round = false) => INK.cv(size * 2, size * 2, (x, w) => { const r = rand(chars.charCodeAt(0) * 7 + chars.length);
    x.fillStyle = '#c0392b'; if (round) { x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 4, 0, TAU); x.fill(); } else { x.beginPath(); x.moveTo(6 + r() * 4, 6 + r() * 4); x.lineTo(w - 6 - r() * 4, 6 + r() * 3); x.lineTo(w - 5 - r() * 3, w - 6 - r() * 4); x.lineTo(7 + r() * 3, w - 6 - r() * 3); x.fill(); }
    x.fillStyle = '#efe6d4'; x.textAlign = 'center'; x.textBaseline = 'middle'; const n = [...chars].length;
    if (n === 1) { x.font = '700 ' + Math.round(w * 0.66) + "px 'LXGW WenKai TC', serif"; x.fillText(chars, w / 2, w / 2 + w * 0.03); }
    else if (n === 2) { x.font = '700 ' + Math.round(w * 0.42) + "px 'LXGW WenKai TC', serif"; x.fillText([...chars][0], w / 2, w * 0.3); x.fillText([...chars][1], w / 2, w * 0.72); }
    else { x.font = '700 ' + Math.round(w * 0.36) + "px 'LXGW WenKai TC', serif"; const cs = [...chars]; [[0.7, 0.29], [0.7, 0.71], [0.3, 0.29], [0.3, 0.71]].forEach(([u, v], i) => { if (cs[i]) x.fillText(cs[i], u * w, v * w + 2); }); }
    // the carved edge: speckle the red away a little
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.6})`; x.fillRect(r() * w, r() * w, 1 + r() * 3, 1 + r() * 2); } x.globalCompositeOperation = 'source-over';
  });
  const el = (cls, html, css) => { const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; Object.assign(d.style, css || {}); W$.appendChild(d); return d; };
  const vis = (d, a, b, how = 'down', dur = 1.1) => {
    // reveal like a brush going down a column (or across), hold, then fade
    const from = how === 'down' ? 'inset(0 0 100% 0)' : how === 'left' ? 'inset(0 100% 0 0)' : how === 'right' ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0)';
    tl.set(d, { opacity: 0, clipPath: from }, 0);
    tl.to(d, { opacity: 1, duration: 0.25, ease: 'power1.out' }, a);
    tl.fromTo(d, { clipPath: from }, { clipPath: 'inset(0 0 0 0)', duration: dur, ease: 'power2.inOut' }, a);
    tl.to(d, { opacity: 0, duration: 0.5, ease: 'power1.in' }, Math.max(a + dur, b - 0.5));
  };
  /** a vertical inscription (Hanja column(s) + a Korean gloss + a seal), like the writing on an ink painting */
  const insc = (a, b, o) => {
    const d = el('insc' + (o.light ? ' light-text' : ''), null, { left: o.x + 'px', top: o.y + 'px' });
    const cols = Array.isArray(o.han) ? o.han : [o.han];
    cols.forEach((c) => { const s = document.createElement('div'); s.className = 'col'; s.style.fontSize = (o.size || 84) + 'px'; s.textContent = c; d.appendChild(s); });
    if (o.ko) (Array.isArray(o.ko) ? o.ko : [o.ko]).forEach((c) => { const s = document.createElement('div'); s.className = 'col ko'; s.style.fontSize = (o.koSize || 34) + 'px'; s.textContent = c; d.appendChild(s); });
    if (o.seal) { const c = sealCanvas(o.seal, 64); c.className = 'seal'; c.style.width = c.style.height = (o.sealSize || 60) + 'px'; d.appendChild(c); }
    vis(d, a, b, 'down', o.dur || 1.3); return d;
  };
  const brush = (a, b, o) => { const d = el(o.cls || 'brush', null, { left: o.x + 'px', top: o.y + 'px', fontSize: (o.size || 120) + 'px', color: o.color || '', textAlign: o.align || 'left' }); d.textContent = o.text; if (o.align === 'center') d.style.transform = 'translateX(-50%)'; vis(d, a, b, o.how || 'left', o.dur || 0.9); return d; };
  const stamp = (a, b, o) => { const c = sealCanvas(o.chars, 96, o.round); c.className = 'stamp'; Object.assign(c.style, { left: o.x + 'px', top: o.y + 'px', width: (o.size || 120) + 'px', height: (o.size || 120) + 'px' }); W$.appendChild(c);
    tl.set(c, { opacity: 0, scale: 1.5, rotation: o.rot || -4 }, 0); tl.to(c, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.in' }, a); if (b < END) tl.to(c, { opacity: 0, duration: 0.5 }, b - 0.5); return c; };

  // ============================ shots (camera per cue) ============================
  // each shot: from cue → the next shot's cue. cam(k, t) sets the camera (k = 0..1 through the shot).
  const SHOTS = [];
  const shot = (from, set, sky, camf, upd, fog) => SHOTS.push({ from, set, sky, camf, upd, fog });
  const CP = (x, y, z, lx, ly, lz) => { cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); };
  const sx = (n) => sets[n].position.x;

  // —— prologue ——
  const proRiders = (t, gal = 0) => { XR.mesh.position.set(sx('pro') - 9.5, 3.2, 2.2); XR.mesh.scale.set(1, 1, 1); LR.mesh.position.set(sx('pro') + 9.5, 3.2, 2.2); LR.mesh.scale.set(-1, 1, 1); XR.draw((t * 0.6) % 1, gal); LR.draw((t * 0.6 + 0.5) % 1, gal); };
  const inPro = (t) => { PRO.add(XR.mesh); PRO.add(LR.mesh); XR.mesh.position.set(-9.5, 3.2, 2.2); LR.mesh.position.set(9.5, 3.2, 2.2); LR.mesh.scale.set(-1, 1, 1); XR.mesh.scale.set(1, 1, 1); XR.draw(0.1, 0); LR.draw(0.6, 0); proMist.forEach((m, i) => { m.position.x = Math.sin(t * 0.07 + i) * 3; }); };
  shot('op01', 'pro', 'day', (k) => CP(0, 4.2, 30 - 4 * k, 0, 3.4, 0), inPro);
  shot('op02', 'pro', 'bronze', (k) => CP(lerp(-2, -7.5, io(k)), 4.0, lerp(22, 12, io(k)), -9.5, 4.0, 2), inPro);
  shot('op03', 'pro', 'cool', (k) => CP(lerp(2, 7.5, io(k)), 4.0, lerp(14, 12, io(k)), 9.5, 4.0, 2), inPro);
  shot('op04', 'pro', 'day', (k) => CP(0, lerp(5, 14, io(k)), lerp(26, 36, io(k)), 0, lerp(3, 0, io(k)), -4), inPro);
  shot('op05', 'pro', 'day', (k) => CP(0, 9, 34 - 2 * k, 0, 3, -4), inPro);
  shot('op06', 'books', 'day', (k) => CP(lerp(-3, 0, k), 4.6, 15, lerp(-3, 0, k), 4.4, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r) => (r.visible = true)); SCR[3].visible = false; unrollAll(t, [S('op06') + 0.3, S('op06') + 0.9, S('op06') + 1.5, 1e9]); });
  shot('op07', 'books', 'day', (k) => CP(lerp(-6.4, -5.6, k), 3.6, 8.5, -5.4, 3.6, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r) => (r.visible = true)); SCR[3].visible = false; unrollAll(t, [0, 0, 0, 1e9]); });
  shot('op08', 'books', 'day', (k) => CP(lerp(-1.6, 0.4, k), 3.6, 9.4, lerp(-1.6, 0.4, k), 3.6, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r) => (r.visible = true)); SCR[3].visible = false; unrollAll(t, [0, 0, 0, 1e9]); });
  shot('op09', 'books', 'day', (k) => CP(lerp(2.5, 4.4, k), 3.6, 10.5, lerp(3.2, 4.8, k), 3.6, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r) => (r.visible = true)); SCR[3].visible = true; SCR[3].material.opacity = 1; unrollAll(t, [0, 0, 0, cue('op09').about('소설') - 0.6]); });
  shot('op10', 'books', 'day', (k) => CP(0, 3.8, 14, 0, 3.4, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r) => (r.visible = true)); unrollAll(t, [0, 0, 0, 0]); const f = K(t, S('op10') + 0.5, S('op10') + 3.5); SCR[3].visible = f < 1; SCR[3].material.opacity = 1 - f; SCR[3].position.y = 7.0 + f * 1.2; rods[3].visible = f < 1; });
  shot('op11', 'books', 'day', (k) => CP(0, 4.2, 18, 0, 3.4, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r) => (r.visible = true)); unrollAll(t, [0, 0, 0, 0]); SCR.forEach((m) => { m.material.opacity = 0.25; }); SCR[3].visible = false; });

  // —— 기 · 항우 ——
  const xiangReset = () => { grand.material.opacity = 0; uncle.visible = youth.visible = false; lifter.visible = false; DING.visible = false; legion.visible = false; carriages.visible = false; youthHill.visible = false; eightK.visible = false; chuFlag.visible = true; spears.forEach((s) => (s.visible = true)); XI.remove(XR.mesh); };
  shot('ki01', 'xiang', 'bronze', (k) => CP(lerp(-6, -3, k), lerp(14, 3, io(k)), lerp(30, 14, io(k)), -2, lerp(6, 2.2, io(k)), -2), (t) => { xiangReset(); });
  shot('ki03', 'xiang', 'bronze', (k) => CP(lerp(-6, -3, k), 2.2, 10, -1, 2.2, -2), (t) => { xiangReset(); });
  shot('ki04', 'xiang', 'bronze', (k) => CP(lerp(-1, 1, k), 2.4, 11, 1.5, 2.4, -2), (t) => { xiangReset(); grand.material.opacity = 0.75 * K(t, S('ki04'), S('ki04') + 1.5); });
  shot('ki05', 'xiang', 'bronze', (k) => CP(lerp(3, 4.6, k), 2.0, 9, 4.4, 1.6, 0), (t) => { xiangReset(); uncle.visible = youth.visible = true; chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); });
  const dingLift = (t, a) => { lifter.visible = true; DING.visible = true; const up = io(K(t, a, a + 2.2)); lifter.position.set(0, 0, 2); DING.scale.setScalar(0.8); DING.position.set(0, lerp(0.9, 3.95, up), 2.3); DING.rotation.y = 0.3 + t * 0.12; };
  shot('ki06', 'xiang', 'bronze', (k) => CP(lerp(1.0, 0.4, k), lerp(0.8, 1.2, k), lerp(9.5, 7.6, io(k)), 0, 2.7, 2), (t) => { xiangReset(); chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); dingLift(t, S('ki06') + 2.4); });
  shot('ki07', 'xiang', 'bronze', (k) => CP(Math.sin(k * 1.2) * 2.4, 3.7, 7.6 - 0.8 * k, 0, 3.3, 2.4), (t) => { xiangReset(); chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); lifter.visible = false; DING.visible = true; DING.scale.setScalar(1.0); DING.position.set(0, 3.2, 2.4); DING.rotation.y = 0.3 + t * 0.12; });
  shot('ki08', 'xiang', 'bronze', (k) => CP(lerp(4, 6, k), 2.0, 9, 5, 1.4, 1), (t) => { xiangReset(); youth.visible = true; uncle.visible = true; chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); });
  shot('ki09', 'xiang', 'bronze', (k) => CP(lerp(5, 2, io(k)), lerp(2, 9, io(k)), lerp(9, 30, io(k)), lerp(5, 0, io(k)), lerp(1.6, 1, io(k)), -10), (t) => { xiangReset(); youth.visible = uncle.visible = true; chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); legion.visible = t > cue('ki09').about('만 명') - 0.2; legion.material.opacity = K(t, cue('ki09').about('만 명') - 0.2, cue('ki09').about('만 명') + 1.2); });
  shot('ki10', 'xiang', 'bronze', (k) => CP(lerp(3, 5, k), 2.0, 9, 4.4, 1.6, 1), (t) => { xiangReset(); youth.visible = uncle.visible = true; chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); });
  shot('ki11', 'xiang', 'bronze', (k) => CP(lerp(-12, -8, k), 3.0, 12, lerp(-2, 4, k), 2.0, -14), (t) => { xiangReset(); chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); carriages.visible = true; carriages.position.x = (t - S('ki11')) * 1.2 - 4; youthHill.visible = true; });
  shot('ki12', 'xiang', 'bronze', (k) => CP(0, lerp(8, 5, k), 26, 0, 1.5, -10), (t) => { xiangReset(); chuFlag.visible = true; chuFlag.position.set(-2, 0, -3); spears.forEach((s) => (s.visible = false)); eightK.visible = t > S('ki13'); eightK.material.opacity = K(t, S('ki13'), S('ki13') + 2); });
  shot('ki14', 'xiang', 'bronze', (k) => { const x = lerp(-9, 3, K(ctx.__t || 0, 0, 1)); CP(lerp(-6, 1, k), 2.0, 11, lerp(-4, 2.5, k), 2.0, 0); }, (t) => { xiangReset(); chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); XI.add(XR.mesh); XR.mesh.position.set(lerp(-8, 3, K(t, S('ki14'), E('ki14'))), 0, 2); XR.mesh.scale.set(1, 1, 1); XR.draw((t * 1.6) % 1, 1); });
  // —— 기 · 여포 ——
  const luReset = () => { dingYuan.visible = luStand.visible = false; dongArmy.visible = false; dingFlag.visible = false; arrow.visible = false; luoyang.visible = false; LU.remove(LR.mesh); };
  const grassWind = (t) => grassL.forEach((m, i) => { m.position.x = Math.sin(t * 0.5 + i) * 0.6; });
  shot('ki15', 'lu', 'cool', (k) => CP(lerp(-10, 0, io(k)), 3, 24, 0, 2.4, -10), (t) => { luReset(); grassWind(t); LU.add(LR.mesh); LR.mesh.position.set(lerp(-22, 10, K(t, S('ki15'), E('ki16'))), 0, 6); LR.mesh.scale.set(1, 1, 1); LR.draw((t * 1.7) % 1, 1); });
  shot('ki16', 'lu', 'cool', (k) => CP(lerp(-4, 4, k), 2.2, 18, lerp(-4, 4, k), 2.6, -20), (t) => { luReset(); grassWind(t); });
  shot('ki17', 'lu', 'cool', (k) => CP(lerp(-6, 6, k), 2.0, 13, lerp(-4, 8, k), 1.8, 0), (t) => { luReset(); grassWind(t); LU.add(LR.mesh); const x0 = lerp(-12, 10, K(t, S('ki17'), E('ki17'))); LR.mesh.position.set(x0, 0, 0); LR.mesh.scale.set(1, 1, 1); LR.draw((t * 1.7) % 1, 1, { weaponAngle: -0.5 }); const sh = cue('ki17').about('비장'); arrow.visible = t > sh - 2 && t < sh + 1.6; const a = K(t, sh - 2, sh + 1.6); arrow.position.set(x0 + 2 + a * 30, 2.6 + Math.sin(a * Math.PI) * 2, 0.2); arrow.rotation.z = 0.35 - a * 0.7; });
  shot('ki18', 'lu', 'cool', (k) => CP(lerp(-1, 0, k), 2.2, lerp(10, 8.5, k), -0.2, 1.8, -1), (t) => { luReset(); grassWind(t); dingYuan.visible = luStand.visible = true; dingFlag.visible = true; });
  shot('ki19', 'lu', 'cool', (k) => CP(lerp(-6, -2, k), 4, 24, 4, 3, -30), (t) => { luReset(); grassWind(t); luoyang.visible = true; dongArmy.visible = true; dongArmy.position.x = lerp(-20, 6, K(t, S('ki19'), E('ki19'))); });
  shot('ki20', 'lu', 'cool', (k) => CP(lerp(-2.6, -1.4, k), 2.2, 9, -1, 2.0, -1), (t) => { luReset(); grassWind(t); dingFlag.visible = true; luStand.visible = true; dingFlag.rotation.z = -1.4 * io(K(t, S('ki20') + 0.8, S('ki20') + 2.2)); });
  shot('ki21', 'lu', 'cool', (k) => CP(lerp(2, 1.2, k), 2.2, 7, 1.6, 2.0, -0.6), (t) => { luReset(); grassWind(t); luStand.visible = true; dingFlag.visible = true; dingFlag.rotation.z = -1.4; });
  shot('ki22', 'pro', 'day', (k) => CP(0, lerp(9, 6, k), lerp(36, 30, k), 0, 3, 0), inPro);

  // —— 승 · 항우 ——
  const juReset = () => { boats.forEach((b, i) => { b.position.y = 0; b.rotation.z = 0; b.visible = true; }); pots.forEach((p) => { p.material.map = potW; p.visible = true; }); huts.forEach((h) => (h.visible = true)); hutFire.forEach((f) => (f.material.opacity = 0)); kneelers.forEach((k) => (k.visible = false)); watchers.visible = palisade.visible = false; throne.visible = false; qinRing.visible = true; };
  const fireFrame = (arr, t, op) => arr.forEach((f) => { const i = Math.floor(t * 12 + f.userData.ph * 10) % FLAMES.length; f.material.map = FLAMES[i]; f.material.opacity = op; });
  shot('sg01', 'pro', 'day', (k) => CP(lerp(-4, 4, k), lerp(16, 20, k), 22, 0, 0, -6), inPro);   // crane high over the mist river
  shot('sg03', 'julu', 'bronze', (k) => CP(lerp(-6, 0, k), lerp(14, 11, k), 18, 0, 3, -60), (t) => { juReset(); });
  shot('sg04', 'julu', 'bronze', (k) => CP(lerp(-16, -10, k), 2.4, 6, -14, 1.8, -2.5), (t) => { juReset(); });
  shot('sg05', 'julu', 'bronze', (k) => CP(lerp(-15, -14, k), 2.0, lerp(9, 7.5, k), -14, 1.4, -2.5), (t) => { juReset(); pots.forEach((p) => (p.visible = false)); boats.forEach((b) => (b.visible = false)); });
  shot('sg06', 'julu', 'fire', (k) => CP(lerp(-9, 5, k), 0.55, 10, lerp(-7, 5, k), 0.6, -6), (t) => { juReset(); const a = S('sg06'); boats.forEach((b, i) => { const s = io(K(t, a + 0.4 + i * 0.35, a + 2.6 + i * 0.35)); b.position.y = -1.5 * s; b.rotation.z = (i % 2 ? 1 : -1) * 0.5 * s; }); const pt = cue('sg06').about('솥을'); pots.forEach((p, i) => { p.material.map = t > pt + i * 0.18 ? potB : potW; }); const ft = cue('sg06').about('막사를'); fireFrame(hutFire, t, K(t, ft, ft + 1)); });
  shot('sg07', 'julu', 'fire', (k) => CP(lerp(6, 2, k), 1.4, 9, 0, 1.2, -2), (t) => { juReset(); boats.forEach((b) => (b.visible = false)); pots.forEach((p) => (p.material.map = potB)); fireFrame(hutFire, t, 1); });
  shot('sg08', 'julu', 'fire', (k) => CP(0, lerp(3, 5, k), lerp(16, 22, k), 0, 2, -4), (t) => { juReset(); boats.forEach((b) => (b.visible = false)); pots.forEach((p) => (p.material.map = potB)); fireFrame(hutFire, t, 1); });
  shot('sg09', 'julu', 'bronze', (k) => CP(lerp(-8, 8, k), 6, 22, 0, 2.5, -30), (t) => { juReset(); watchers.visible = palisade.visible = true; });
  shot('sg10', 'julu', 'bronze', (k) => CP(lerp(-2, 1, k), 0.7, 6.5, 0, 0.9, 0), (t) => { juReset(); qinRing.visible = false; boats.forEach((b) => (b.visible = false)); pots.forEach((p) => (p.visible = false)); huts.forEach((h) => (h.visible = false)); kneelers.forEach((m, i) => { m.visible = true; m.position.x = -10 + i * 2.2 + (t - S('sg10')) * 0.4; }); });
  shot('sg11', 'julu', 'bronze', (k) => CP(0, lerp(1, 2.2, k), lerp(12, 9, io(k)), 0, 3.0, 0), (t) => { juReset(); qinRing.visible = false; boats.forEach((b) => (b.visible = false)); pots.forEach((p) => (p.visible = false)); huts.forEach((h) => (h.visible = false)); throne.visible = true; });
  const peReset = (t) => { choke.visible = false; hanArmy.visible = true; hanParts.forEach((c, k) => { c.position.set(-6 + (k % 3) * 18, 0, -26 - (k >> 1) * 4); }); chuWedge.visible = false; fleeing[0].mesh.visible = false; hanFlags.forEach((f) => (f.visible = true)); };
  shot('sg12', 'peng', 'day', (k) => CP(lerp(-4, 4, k), 5, 26, 8, 3, -40), (t) => { peReset(t); hanArmy.visible = false; hanFlags.forEach((f) => (f.visible = false)); });
  shot('sg13', 'peng', 'day', (k) => CP(lerp(-4, 6, k), 7, 30, 10, 2, -36), (t) => { peReset(t); hanArmy.position.x = lerp(-30, 0, K(t, S('sg13'), E('sg13'))); });
  shot('sg14', 'peng', 'day', (k) => CP(0, lerp(9, 16, k), 34, 6, 0, -30), (t) => { peReset(t); hanArmy.position.x = 0; });
  shot('sg15', 'peng', 'dawn', (k) => CP(-20, 5, 22, -24, 1.5, -12), (t) => { peReset(t); chuWedge.visible = true; chuWedge.position.set(-30 + K(t, S('sg15'), E('sg15')) * 4, 0, -14); });
  shot('sg16', 'peng', 'dawn', (k) => CP(lerp(-12, 4, k), 9, 32, 0, 1, -24), (t) => { peReset(t); chuWedge.visible = true; const a = K(t, S('sg16'), E('sg16') + 1); chuWedge.position.set(lerp(-26, 14, a), 0, -22); hanParts.forEach((c, k) => { const d = io(K(t, S('sg16') + 1 + k * 0.2, E('sg16') + 1)); c.position.x = -6 + (k % 3) * 18 + (k % 3 - 1) * 10 * d; c.position.z = -26 - (k >> 1) * 4 + 14 * d; }); pengSun.position.y = lerp(8, 22, K(t, S('sg15'), E('sg16'))); });
  shot('sg17', 'peng', 'dawn', (k) => CP(lerp(-6, 6, k), 1.0, 13, lerp(-4, 4, k), 0.2, 2), (t) => { peReset(t); hanArmy.visible = false; choke.visible = true; });
  shot('sg18', 'peng', 'day', (k) => CP(0, 16, 38, 0, 0, -20), (t) => { peReset(t); chuWedge.visible = true; chuWedge.position.set(-18, 0, -18); });
  shot('sg19', 'peng', 'day', (k) => CP(lerp(0, 8, k), 3, 18, lerp(4, 16, k), 1.5, -20), (t) => { peReset(t); hanArmy.visible = false; const f = fleeing[0]; f.mesh.visible = true; f.mesh.position.set(lerp(2, 30, K(t, S('sg19'), E('sg19'))), 0, -18); f.draw((t * 1.8) % 1, 1); });
  shot('sg20', 'xiang', 'bronze', (k) => CP(lerp(-4, 2, k), 2.4, 12, lerp(-2, 4, k), 2.6, 0), (t) => { xiangReset(); chuFlag.visible = false; spears.forEach((s) => (s.visible = false)); XI.add(XR.mesh); XR.mesh.position.set(lerp(-8, 6, K(t, S('sg20'), E('sg20'))), 0, 1); XR.mesh.scale.set(1, 1, 1); XR.draw((t * 1.6) % 1, 1); });
  // —— 승 · 여포 ——
  const haReset = () => { pillars.forEach((p) => (p.visible = true)); beam.visible = dais.visible = true; changan.visible = false; wangYun.visible = false; maid.visible = true; maid.material.opacity = 1; shouJi.visible = false; dong.visible = true; luHall.visible = true; luHall.position.set(4, 0, -2); };
  shot('sg21', 'hall', 'cool', (k) => CP(lerp(-8, 0, io(k)), 4, 22, 0, 4, -10), (t) => { haReset(); });
  shot('sg22', 'hall', 'cool', (k) => CP(lerp(-2, 2, k), 3.0, 14, 0, 3.2, -6), (t) => { haReset(); });
  shot('sg23', 'hall', 'cool', (k) => CP(lerp(3, 1, k), 2.2, 6, 2, 2.0, -4), (t) => { haReset(); const th = cue('sg23').about('수극'); shouJi.visible = t > th - 0.5; const a = K(t, th - 0.5, th + 1.2); shouJi.position.set(lerp(-2.5, 4.6, a), 3.6 + Math.sin(a * Math.PI) * 0.6, lerp(-9, -1.6, a)); shouJi.rotation.set(0, 0, -t * 9); });
  shot('sg24', 'hall', 'cool', (k) => CP(5.5, 1.8, 4.5, 4, 1.6, -2), (t) => { haReset(); const a = io(K(t, S('sg24'), S('sg24') + 0.6)); luHall.position.x = 4 + 0.7 * a; shouJi.visible = true; shouJi.position.set(6.4, 0.3, -1.8); shouJi.rotation.set(0, 0, -1.2); });
  shot('sg25', 'hall', 'cool', (k) => CP(lerp(10, 8, k), 2.2, 6, 8, 1.6, -5), (t) => { haReset(); });
  shot('sg26', 'hall', 'cool', (k) => CP(8, 2.2, 5.5, 8, 1.6, -5), (t) => { haReset(); maid.material.opacity = 1 - K(t, S('sg26') + 0.6, E('sg26')); });
  shot('sg27', 'hall', 'cool', (k) => CP(0, lerp(6, 4, k), 24, 0, 4, -40), (t) => { haReset(); changan.visible = true; dong.visible = luHall.visible = false; maid.visible = false; pillars.forEach((p) => (p.visible = false)); beam.visible = dais.visible = false; });
  shot('sg27b', 'hall', 'cool', (k) => CP(lerp(0, 1, k), 2.2, 9, 1, 2.0, -1.5), (t) => { haReset(); maid.visible = false; wangYun.visible = true; luHall.position.set(3.4, 0, -1.6); });
  shot('sg30', 'hall', 'cool', (k) => CP(0, 4, lerp(26, 20, k), 0, 4, -40), (t) => { haReset(); changan.visible = true; dong.visible = luHall.visible = maid.visible = false; pillars.forEach((p) => (p.visible = false)); beam.visible = dais.visible = false; });
  shot('sg31', 'lu', 'cool', (k) => CP(lerp(-6, 6, k), 2.4, 16, lerp(-2, 10, k), 2.4, -10), (t) => { luReset(); grassWind(t); luoyang.visible = true; LU.add(LR.mesh); LR.mesh.position.set(lerp(-4, 18, K(t, S('sg31'), E('sg31'))), 0, -2); LR.mesh.scale.set(1, 1, 1); LR.draw((t * 1.7) % 1, 1); });
  const heX = (t, a, b, dir) => lerp(-22, 22, K(t, a, b)) * dir;
  const heRider = (t, a, b, dir = 1) => { HE.add(LR.mesh); const k = K(t, a, b); LR.mesh.position.set(heX(t, a, b, dir), 0, 5); LR.mesh.scale.set(dir, 1, 1); LR.draw((t * 1.9) % 1, 1, { weaponAngle: -0.15 }); };
  shot('sg32', 'heishan', 'cool', (k) => CP(lerp(-10, 0, k), 8, 34, 0, 3, -20), (t) => { heFlags.forEach((f) => (f.visible = true)); HE.remove(LR.mesh); zhangYan.visible = true; });
  shot('sg33', 'heishan', 'cool', (k) => CP(lerp(-4, 4, k), 4, 26, 0, 2, -14), (t) => { heFlags.forEach((f) => (f.visible = true)); HE.remove(LR.mesh); });
  shot('sg34', 'heishan', 'cool', (k) => { const t = ctx.__t, a = S('sg34'), L = E('sg34') - a, p = Math.floor((t - a) / (L / 3)), x = heX(t, a + p * L / 3, a + (p + 1) * L / 3, p % 2 ? -1 : 1); CP(x - (p % 2 ? -3 : 3), 1.5, 16, x, 1.5, 4); }, (t) => { heFlags.forEach((f) => (f.visible = true)); const a = S('sg34'), L = E('sg34') - a; const p = Math.floor((t - a) / (L / 3)); heRider(t, a + p * L / 3, a + (p + 1) * L / 3, p % 2 ? -1 : 1); });
  shot('sg35', 'heishan', 'cool', (k) => { const x = heX(ctx.__t, S('sg35') - 1, E('sg36') + 1, 1); CP(x - 4, 1.8, 17, x, 1.8, 4); }, (t) => { heFlags.forEach((f) => (f.visible = true)); heRider(t, S('sg35') - 1, E('sg36') + 1, 1); });
  shot('sg36', 'heishan', 'cool', (k) => { const x = heX(ctx.__t, S('sg35') - 1, E('sg36') + 1, 1); CP(x + 2, 1.0, 13, x, 2.2, 4); }, (t) => { heFlags.forEach((f) => (f.visible = false)); heRider(t, S('sg35') - 1, E('sg36') + 1, 1); });
  const gateShot = (t) => { shotRider.mesh.position.set(-5.2, 0, 4); shotRider.mesh.scale.set(1, 1, 1); shotRider.draw(0.3, 0, { weaponAngle: -1.2, noBow: true }); };
  shot('sg37', 'gate', 'cool', (k) => CP(lerp(-10, 0, k), 5, 30, 0, 3, -24), (t) => { gateShot(t); shaft.visible = false; });
  shot('sg38', 'gate', 'cool', (k) => CP(lerp(-2, 2, k), 3, 22, 0, 3, -24), (t) => { gateShot(t); shaft.visible = false; });
  shot('sg39', 'gate', 'cool', (k) => CP(lerp(-7.5, -6.5, k), 2.6, lerp(14, 12, k), 0, 1.5, -24), (t) => { gateShot(t); shaft.visible = false; });
  shot('sg40', 'gate', 'cool', (k) => CP(lerp(2.8, 2.2, k), 3.3, lerp(-19.2, -20.2, k), -0.6, 3.2, -24.1), (t) => { gateShot(t); const a0 = S('sg40') + 0.5, a = K(t, a0, a0 + 0.45); shaft.visible = t > a0; shaft.position.set(lerp(-9, -0.45, a), lerp(3.35, 3.2, a), -24.1); shaft.rotation.set(0, 0, Math.PI / 2 - 0.02); });
  shot('sg41', 'pro', 'day', (k) => CP(0, 3.4, lerp(27, 24, k), 0, 3.6, 2), inPro);

  // —— 전 ——
  shot('jn01', 'pro', 'day', (k) => CP(lerp(-3, -5, k), 1.4, 13, -9.5, 3.6, 2), inPro);   // up from the mist at 항우
  shot('jn03', 'sinan', 'night', (k) => CP(lerp(-10, -2, k), 4, 24, 0, 1, -8), (t) => { qinPOW.position.y = 0; qinPOW.visible = true; });
  shot('jn04', 'sinan', 'night', (k) => CP(0, lerp(5, 8, k), 22, 0, 0, -8), (t) => { qinPOW.position.y = -2.2 * io(K(t, S('jn04') + 2, E('jn04'))); });
  shot('jn05', 'sinan', 'night', (k) => CP(lerp(0, 8, k), 10, 34, 0, 2, -40), (t) => { qinPOW.visible = false; });
  const hoReset = () => { jade.forEach((j) => (j.material.opacity = 0)); cupShards.visible = false; lbGuest.visible = true; lbGuest.material.opacity = 1; };
  shot('jn06', 'hongmen', 'cool', (k) => CP(lerp(-4, 4, k), 4, 22, 0, 3, -6), (t) => { hoReset(); });
  shot('jn07', 'hongmen', 'cool', (k) => CP(lerp(-10, -8, k), 2.6, 8, -8, 2.2, -3), (t) => { hoReset(); [0, 1, 2].forEach((i) => { const tt = cue('jn07').at(0.35 + i * 0.12); const o = Math.max(0, 1 - Math.abs(t - tt) / 0.4); jade[i].material.opacity = o; jade[i].position.set(-8.4, 1.7, -2.6); }); });
  shot('jn08', 'hongmen', 'cool', (k) => CP(lerp(0, 2, k), 3, 16, 0, 2.4, -4), (t) => { hoReset(); lbGuest.material.opacity = 1 - K(t, S('jn08'), S('jn08') + 1.2); const sh = cue('jn08').about('깨뜨리며'); cupShards.visible = t > sh; cupShards.position.y = -K(t, sh, sh + 0.6) * 0.3; });
  shot('jn09', 'xianyang', 'fire', (k) => CP(lerp(-8, 8, k), 5, 30, 0, 6, -40), (t) => { fireFrame(palaceFire, t, K(t, S('jn09') + 1, S('jn09') + 3)); });
  const roReset = () => { robed.visible = false; monkey.visible = false; DING2.visible = false; boilFire.forEach((f) => (f.material.opacity = 0)); steam.forEach((s) => (s.material.opacity = 0)); hanxin.visible = fanzengRoad.visible = false; };
  shot('jn10', 'road', 'night', (k) => CP(lerp(-4, 4, k), 2.2, 10, lerp(-2, 2, k), 1.8, 0), (t) => { roReset(); robed.visible = true; robed.position.set(lerp(-6, 6, K(t, S('jn10'), E('jn10'))), 0, 0); });
  shot('jn11', 'road', 'night', (k) => CP(0, 2, lerp(9, 7, k), 0, 1.7, 0), (t) => { roReset(); monkey.visible = true; });
  shot('jn12', 'road', 'fire', (k) => CP(lerp(-1.6, 1.6, k), 2.4, 4.4, 0, 1.4, 0), (t) => { roReset(); DING2.visible = true; DING2.rotation.y = t * 0.1; fireFrame(boilFire, t, 1); steam.forEach((s, i) => { const ph = ((t * 0.4 + i / steam.length) % 1); s.position.set(Math.sin(i * 2.1) * 0.4, 2.0 + ph * 2.2, 0); s.scale.setScalar(0.8 + ph * 1.6); s.material.opacity = 0.5 * Math.sin(Math.PI * ph); }); });
  shot('jn13', 'road', 'day', (k) => CP(0, 2.2, 12, 0, 1.8, -4), (t) => { roReset(); hanxin.visible = true; hanxin.position.set(lerp(0, 9, K(t, S('jn14'), E('jn14'))), 0, lerp(0, -16, K(t, S('jn14'), E('jn14')))); });
  shot('jn15', 'road', 'day', (k) => CP(lerp(-3, 3, k), 2.0, 10, 0, 1.4, -2), (t) => { roReset(); fanzengRoad.visible = true; const a = K(t, S('jn15'), E('jn15')); fanzengRoad.position.set(lerp(-5, 3, a), 0, -1); fanzengRoad.rotation.z = -1.4 * io(K(t, E('jn15') - 1.4, E('jn15'))); });
  shot('jn16', 'pro', 'day', (k) => CP(lerp(-6, -9, k), 3.6, 12, -9.5, 3.8, 2), inPro);
  const gtReset = () => { gCity.forEach((g) => { g.open.visible = true; g.shut.visible = false; }); GT.remove(LR.mesh); };
  shot('jn17', 'gates', 'cool', (k) => CP(lerp(-30, -20, k), 5, 14, -20, 3, -26), (t) => { gtReset(); });
  shot('jn18', 'gates', 'cool', (k) => CP(lerp(-30, 26, k), 4, 16, lerp(-30, 26, k), 3, -28), (t) => { gtReset(); GT.add(LR.mesh); const a = K(t, S('jn18'), E('jn19')); LR.mesh.position.set(lerp(-36, 30, a), 0, -12); LR.mesh.scale.set(1, 1, 1); LR.draw((t * 1.4) % 1, 0.8); gCity.forEach((g, i) => { const shutAt = lerp(S('jn18'), E('jn19'), (i + 0.7) / 3.2); g.shut.visible = t > shutAt; g.open.visible = !g.shut.visible; }); });
  shot('jn20', 'lu', 'cool', (k) => CP(lerp(-8, 0, k), 3, 22, 4, 3, -30), (t) => { luReset(); grassWind(t); luoyang.visible = true; });
  shot('jn22', 'lu', 'cool', (k) => CP(lerp(0, -6, k), 3, 18, -4, 2, -10), (t) => { luReset(); grassWind(t); LU.add(LR.mesh); LR.mesh.position.set(lerp(2, -14, K(t, S('jn22'), E('jn22'))), 0, 5.5); LR.mesh.scale.set(-1, 1, 1); LR.draw((t * 1.5) % 1, 0.9); });
  shot('jn23', 'gates', 'cool', (k) => CP(lerp(18, 26, k), 4, 14, 24, 3, -36), (t) => { gtReset(); });
  shot('jn24', 'xiapi', 'winter', (k) => CP(lerp(-12, 0, k), 9, 40, 0, 3, -30), (t) => { waterline.scale.y = 0.6; flood.position.y = -1.2; seizers.forEach((m) => (m.visible = false)); chenGong.visible = false; });
  shot('jn25', 'xiapi', 'winter', (k) => CP(0, 6, 30, 0, 4, -30), (t) => { waterline.scale.y = 0.6; flood.position.y = -1.2; seizers.forEach((m) => (m.visible = false)); chenGong.visible = false; });
  shot('jn26', 'xiapi', 'winter', (k) => CP(lerp(-3, 3, k), lerp(1.2, 2.2, k), 20, 0, 3.2, -30), (t) => { const f = io(K(t, S('jn26'), E('jn26'))); waterline.scale.y = lerp(0.6, 5.8, f); flood.position.y = -1.2 + 0.3 * f; seizers.forEach((m) => (m.visible = false)); chenGong.visible = false; });
  shot('jn27', 'xiapi', 'winter', (k) => CP(lerp(-2, 2, k), 2.0, 10, 0, 1.6, 1.8), (t) => { waterline.scale.y = 5.8; flood.position.y = 2.4; seizers.forEach((m) => (m.visible = true)); chenGong.visible = true; flood.visible = false; });
  shot('jn28', 'pro', 'day', (k) => CP(lerp(6, 9, k), 3.6, 12, 9.5, 3.8, 2), inPro);

  // —— 결 ——
  shot('gy01', 'pro', 'day', (k) => CP(0, lerp(10, 6, io(k)), lerp(26, 20, io(k)), 0, 3.2, 0), inPro);
  const gxReset = (t) => { zhui.mesh.visible = true; yu.visible = true; lamp.material.opacity = 0.7; torches.forEach((m, i) => (m.material.opacity = 0.55 + 0.2 * Math.sin(t * 3 + i))); nightRiders.forEach((r) => (r.mesh.visible = false)); hanHost.visible = false; swamp.material.opacity = 0; camp.visible = true; zhui.draw(0.3, 0); };
  shot('gy03', 'gaixia', 'night', (k) => CP(0, lerp(18, 10, io(k)), 44, 0, 0, -10), gxReset);
  shot('gy04', 'gaixia', 'night', (k) => CP(lerp(-6, 6, k), 4, 26, 0, 2, -12), gxReset);
  shot('gy07', 'gaixia', 'night', (k) => CP(lerp(-2, 2, k), 2.4, 12, 0, 2, -4), gxReset);
  shot('gy10', 'gaixia', 'night', (k) => CP(0, 3, 16 + 2 * k, 0, 2, -6), gxReset);
  const ride = (t, n, a, b, dz = 0) => { nightRiders.forEach((r, i) => { r.mesh.visible = i < n; const s = 0.45; r.mesh.scale.set(s, s, s); r.mesh.position.set(lerp(-30, 30, K(t, a, b)) - (i % 4) * 2.2 - (i >> 2) * 1.0, 0, -8 - (i >> 2) * 1.6 + dz - (i % 4) * 0.6); r.draw((t * 1.8 + i * 0.13) % 1, 1); }); };
  shot('gy11', 'gaixia', 'night', (k) => CP(lerp(-12, 12, k), 3, 22, lerp(-10, 10, k), 1, -8), (t) => { gxReset(t); camp.visible = false; zhui.mesh.visible = yu.visible = false; lamp.material.opacity = 0; ride(t, 12, S('gy11'), E('gy11')); });
  shot('gy12', 'gaixia', 'night', (k) => CP(lerp(-8, 8, k), 3, 20, lerp(-6, 6, k), 0.6, -8), (t) => { gxReset(t); camp.visible = false; zhui.mesh.visible = yu.visible = false; lamp.material.opacity = 0; torches.forEach((m) => (m.material.opacity = 0)); swamp.material.opacity = 0.8 * K(t, cue('gy12').about('늪'), cue('gy12').about('늪') + 1); ride(t, 6, S('gy12'), E('gy12')); });
  shot('gy13', 'gaixia', 'dawn', (k) => CP(0, 6, 30, 0, 1, -10), (t) => { gxReset(t); camp.visible = false; zhui.mesh.visible = yu.visible = false; lamp.material.opacity = 0; torches.forEach((m) => (m.material.opacity = 0)); hanHost.visible = true; ride(t, 3, S('gy13') - 3, E('gy13') + 8); });
  shot('gy14', 'gaixia', 'dawn', (k) => CP(lerp(-4, -2, k), 2.4, 12, -2, 1.6, -8), (t) => { gxReset(t); camp.visible = false; zhui.mesh.visible = yu.visible = false; lamp.material.opacity = 0; torches.forEach((m) => (m.material.opacity = 0)); hanHost.visible = true; ride(t, 3, S('gy14') + 20, S('gy14') + 21); });
  shot('gy16', 'gaixia', 'dawn', (k) => CP(lerp(-10, 10, k), 5, 26, 0, 1, -12), (t) => { gxReset(t); camp.visible = false; zhui.mesh.visible = yu.visible = false; lamp.material.opacity = 0; torches.forEach((m) => (m.material.opacity = 0)); hanHost.visible = true; const a = S('gy16'), L = E('gy16') - a, p = Math.floor((t - a) / (L / 3)); ride(t, 3, a + p * L / 3, a + (p + 1) * L / 3, 0); });
  const wuReset = (t) => { zhui2.mesh.visible = true; zhui2.mesh.position.set(-5.4, 0, -2.4); zhui2.mesh.scale.set(1, 1, 1); zhui2.draw(0.25, 0); ghosts.forEach((g) => (g.material.opacity = 0)); pursuers.visible = false; xyFoot.visible = true; };
  shot('gy17', 'wujiang', 'dawn', (k) => CP(lerp(-10, -2, k), 3, 24, 0, 1.5, -10), wuReset);
  shot('gy18', 'wujiang', 'dawn', (k) => CP(lerp(-3, -1, k), 2.4, 12, -2, 2, -6), (t) => { wuReset(t); const a = cue('gy18').about('한 사람도'); ghosts.forEach((g, i) => { g.material.opacity = 0.7 * (1 - K(t, a + (i % 10) * 0.12, a + 1.4 + (i % 10) * 0.12)) * K(t, S('gy18'), S('gy18') + 1); }); });
  shot('gy19', 'wujiang', 'dawn', (k) => CP(-2.4, 2.1, lerp(7, 5.6, k), -2.4, 2.1, -2), wuReset);
  shot('gy20', 'wujiang', 'dawn', (k) => CP(lerp(-8, 0, k), 3, 22, 0, 1.4, -6), (t) => { wuReset(t); const a = K(t, S('gy20'), S('gy20') + 3); zhui2.mesh.position.set(lerp(-5.4, 2, a), 0, lerp(-2.4, -5, a)); zhui2.draw((t * 0.8) % 1, 0.3 * (a < 1 ? 1 : 0)); pursuers.visible = t > cue('gy20').about('걸어서'); });
  shot('gy21', 'wujiang', 'dawn', (k) => CP(-1.6, 2.2, lerp(8, 6.5, k), -2.4, 2.0, -2), (t) => { wuReset(t); zhui2.mesh.visible = false; pursuers.visible = true; });
  shot('gy22', 'wujiang', 'dawn', (k) => CP(0, lerp(3, 12, io(k)), lerp(16, 40, io(k)), 0, 1, -20), (t) => { wuReset(t); zhui2.mesh.visible = false; xyFoot.visible = t < S('gy22') + 1.2; });
  const bmReset = (t) => { bmDais.visible = true; caoSeat.visible = luBound.visible = liuBei.visible = true; ropes.visible = true; redHorse.mesh.visible = false; snow.position.y = -((t * 0.6) % 14); };
  shot('gy23', 'baimen', 'winter', (k) => CP(lerp(-10, 0, k), 6, 34, 0, 5, -24), (t) => { bmReset(t); caoSeat.visible = luBound.visible = liuBei.visible = ropes.visible = bmDais.visible = false; });
  shot('gy24', 'baimen', 'winter', (k) => CP(lerp(-1, 1, k), 0.3, lerp(14, 11, io(k)), 0, lerp(6, 9, io(k)), -24), (t) => { bmReset(t); caoSeat.visible = luBound.visible = liuBei.visible = ropes.visible = bmDais.visible = false; });
  shot('gy26', 'baimen', 'winter', (k) => CP(lerp(1, 0, k), 1.0, 13, 0.5, 2.6, -8), bmReset);   // wide: the bound man small under the tower
  shot('gy27', 'baimen', 'winter', (k) => CP(lerp(2.6, 2.2, k), 0.8, lerp(1.6, 1.2, k), -4, 2.9, -2), bmReset);   // from behind the bound man, up at 조조
  shot('gy28', 'baimen', 'winter', (k) => CP(lerp(2.6, 2.3, k), 1.2, lerp(2.2, 1.9, k), 2.2, 1.15, -0.85), bmReset);   // the ropes, very close
  shot('gy29', 'baimen', 'winter', (k) => CP(lerp(3.6, 3.2, k), 0.7, 1.4, -4, 3.2, -2), bmReset);   // over the bound man's shoulder, up at 조조
  shot('gy30', 'baimen', 'winter', (k) => CP(lerp(-4, -2, k), 2.4, 12, -4, 1.8, -2), bmReset);
  shot('gy31', 'baimen', 'winter', (k) => CP(lerp(-5.4, -5.8, k), 2.2, lerp(1.6, 1.0, k), -7.2, 2.3, -2.6), bmReset);
  shot('gy32', 'baimen', 'winter', (k) => CP(lerp(0, -2, k), 2.0, 11, -2, 1.6, -2), bmReset);
  shot('gy33', 'baimen', 'winter', (k) => CP(lerp(3.2, 2.4, k), 1.3, lerp(4.6, 3.6, k), 2.2, 1.0, -1), (t) => { bmReset(t); ropes.scale.setScalar(1 - 0.12 * io(K(t, S('gy33') + 1, S('gy33') + 3))); });
  shot('gy34', 'baimen', 'winter', (k) => CP(0, 2.6, 16, 0, 1.6, -4), (t) => { bmReset(t); caoSeat.visible = luBound.visible = liuBei.visible = ropes.visible = bmDais.visible = false; redHorse.mesh.visible = true; redHorse.mesh.position.set(0, 0, -3); redHorse.draw(0.2, 0); redHorse.mesh.material.opacity = 1 - 0.6 * K(t, S('gy34'), E('gy34') + 1); });

  // —— 판정 ——
  shot('ep01', 'pro', 'day', (k) => CP(0, 5, 30, 0, 3, 0), inPro);
  shot('ep03', 'pro', 'day', (k) => CP(0, lerp(9, 18, io(k)), lerp(26, 20, io(k)), 0, 0, -4), inPro);
  shot('ep05', 'pro', 'bronze', (k) => CP(lerp(-2, -7.5, io(k)), 4.0, lerp(22, 14, io(k)), -9.5, 4.0, 2), inPro);
  shot('ep06', 'pro', 'cool', (k) => CP(lerp(2, 7.5, io(k)), 4.0, lerp(22, 14, io(k)), 9.5, 4.0, 2), inPro);
  shot('ep07', 'pro', 'day', (k) => CP(lerp(-1, 1, k), 4.6, 25, 0, 3.4, 2), inPro);
  shot('ep08', 'books', 'day', (k) => CP(0, 3.8, 14 - k * 2, 0, 3.4, -2), (t) => { SCR.forEach((m) => (m.visible = true)); rods.forEach((r, i) => (r.visible = i < 3)); unrollAll(t, [0, 0, 0, 0]); rods[3].visible = false; SCR[3].visible = false; SCR.forEach((m) => (m.material.opacity = 1)); });
  shot('ep09', 'books', 'day', (k) => CP(lerp(-3.6999999999999997, -3.1, k), 4.0, 12, -3.4, 4.0, -2), (t) => { unrollAll(t, [0, 0, 0, 0]); rods[3].visible = false; SCR[3].visible = false; SCR.forEach((m, i) => { m.visible = i === 0; m.material.opacity = 1; }); rods.forEach((r, i) => (r.visible = i === 0)); });
  shot('ep12', 'books', 'day', (k) => CP(lerp(-0.09999999999999998, 0.5, k), 4.0, 12, 0.2, 4.0, -2), (t) => { unrollAll(t, [0, 0, 0, 0]); rods[3].visible = false; SCR[3].visible = false; SCR.forEach((m, i) => { m.visible = i === 1; m.material.opacity = 1; }); rods.forEach((r, i) => (r.visible = i === 1)); });
  shot('ep13', 'pro', 'day', (k) => CP(0, 5, 30 + 6 * k, 0, 3, 0), (t) => { inPro(t); const f = K(t, S('ep13'), E('ep13')); XR.mesh.material.opacity = LR.mesh.material.opacity = 1 - K(t, lerp(S('ep13'), E('ep13'), 0.55), E('ep13') + 0.4); });
  shot('ep14', 'finale', 'bronze', (k) => CP(Math.sin(k) * 2, lerp(2.4, 3.0, k), lerp(5.5, 4.4, k), 0, 1.5, 0), (t) => { liftRing.forEach((m) => (m.visible = false)); lifters.visible = false; DING3.position.y = 1.4; DING3.rotation.y = t * 0.1; });
  shot('ep15', 'finale', 'bronze', (k) => CP(lerp(-2, 2, k), 3, 8, 0, 1.6, 0), (t) => { liftRing.forEach((m) => (m.visible = false)); lifters.visible = false; DING3.position.y = 1.4; DING3.rotation.y = t * 0.1; });
  shot('ep16', 'finale', 'bronze', (k) => CP(lerp(1.5, 0.5, k), lerp(0.5, 0.9, io(k)), lerp(6.5, 7.5, io(k)), 0, 1.6, 0), (t) => { lifters.visible = true; liftRing.forEach((m) => (m.visible = true)); const f = K(t, S('ep16'), S('ep16') + 1.2); lifters.material.opacity = f; liftRing.forEach((m) => (m.material.opacity = f)); DING3.position.y = lerp(1.4, 2.95, io(K(t, cue('ep16').about('함께') - 0.6, cue('ep16').about('함께') + 1.2))); DING3.rotation.y = t * 0.1; beamLight.material.opacity = 0.5 + 0.4 * K(t, cue('ep16').about('함께'), E('ep16')); });
  shot('ep17', 'finale', 'bronze', (k) => CP(0, lerp(1.2, 6, io(k)), lerp(8, 16, io(k)), 0, 2.2, 0), (t) => { lifters.visible = true; lifters.material.opacity = 1; liftRing.forEach((m) => { m.visible = true; m.material.opacity = 1; }); DING3.position.y = 2.95; DING3.rotation.y = t * 0.1; beamLight.material.opacity = 0.9; });

  SHOTS.forEach((s, i) => { s.a = S(s.from); });
  const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.a - 0.001) s = x; return s; };
  const shotEnd = (s) => { const i = SHOTS.indexOf(s); return i < SHOTS.length - 1 ? SHOTS[i + 1].a : END; };

  // ============================ the writing, cue by cue ============================
  const B = (id) => S(id), Bend = (id) => E(id) + 0.2;
  // prologue
  insc(B('op02') + 0.4, Bend('op02'), { x: 1450, y: 150, han: '項羽', ko: '항우 · 기원전 3세기', size: 120, seal: '楚' });
  insc(B('op03') + 0.4, Bend('op03'), { x: 300, y: 150, han: '呂布', ko: '여포 · 서기 2세기 말', size: 120, seal: '漢' });
  brush(B('op04') + 1.2, Bend('op04'), { x: 960, y: 640, text: '사백 년', size: 150, align: 'center', how: 'left' });
  brush(B('op05') + 0.6, Bend('op05') + 0.4, { x: 960, y: 200, text: '누가 이겼을까', size: 170, align: 'center' });
  brush(B('op09') + 1.0, Bend('op10'), { x: 1640, y: 120, text: '소설', size: 110, color: '#c0392b', how: 'down' });
  ['起', '承', '轉', '結'].forEach((c, i) => stamp(cue('op11').at(0.18 + i * 0.2), E('op11') + 0.6, { chars: c, x: 450 + i * 280, y: 430, size: 170, rot: -3 + i * 2 }));
  // 기
  stamp(B('ki01') + 0.1, B('ki01') + 2.6, { chars: '起', x: 860, y: 380, size: 200 });
  insc(B('ki03') + 0.3, Bend('ki03'), { x: 1500, y: 140, han: '項籍 字羽', ko: '본명 항적, 자는 우', size: 96 });
  insc(B('ki04') + 0.5, Bend('ki04'), { x: 300, y: 140, han: '楚將 項燕', ko: '초나라 장수 항연', size: 96 });
  insc(B('ki06') + 0.4, Bend('ki06'), { x: 1520, y: 120, han: ['力能扛鼎'], ko: '힘은 솥을 들 만했다', size: 104, seal: '史記' });
  brush(B('ki07') + 0.2, Bend('ki07'), { x: 1500, y: 300, text: '정 · 鼎', size: 140 });
  insc(cue('ki09').about('만 명') - 0.3, Bend('ki09'), { x: 1460, y: 130, han: ['學萬人敵'], ko: '만 명을 상대하는 법', size: 110, seal: '項' });
  insc(B('ki11') + 1.6, Bend('ki11'), { x: 1500, y: 120, han: ['彼可取而代也'], ko: '저 자리는 내가 대신할 수 있다', size: 92 });
  brush(B('ki13') + 1.8, Bend('ki13'), { x: 960, y: 170, text: '8,000', size: 160, align: 'center' });
  brush(B('ki16') + 1.2, Bend('ki16'), { x: 960, y: 140, text: '오원군 구원현', size: 110, align: 'center' });
  insc(cue('ki17').about('비장') - 0.4, Bend('ki17'), { x: 1560, y: 140, han: '飛將', ko: '날아다니는 장수', size: 140, seal: '呂' });
  insc(B('ki20') + 2.4, Bend('ki20'), { x: 300, y: 130, han: ['誓為父子'], ko: '아버지와 아들이 되기로 맹세하다', size: 100 });
  // 승
  stamp(B('sg01') + 0.1, B('sg01') + 2.6, { chars: '承', x: 860, y: 380, size: 200 });
  brush(B('sg03') + 1.0, Bend('sg03'), { x: 960, y: 120, text: '거록 · 기원전 207년', size: 96, align: 'center' });
  brush(cue('sg04').about('46') - 0.2, Bend('sg04'), { x: 1500, y: 160, text: '46일', size: 150 });
  brush(B('sg08') + 0.1, Bend('sg08') + 0.3, { x: 960, y: 150, text: '破釜沈舟', size: 200, align: 'center', cls: 'han', how: 'left' });
  brush(B('sg08') + 1.0, Bend('sg08') + 0.3, { x: 960, y: 390, text: '파부침주', size: 72, align: 'center', cls: 'ko' });
  insc(B('sg10') + 2.0, Bend('sg10'), { x: 1560, y: 120, han: ['莫敢仰視'], ko: '감히 올려다보지 못했다', size: 100, seal: '史記' });
  insc(B('sg11') + 2.0, Bend('sg11'), { x: 1480, y: 110, han: ['西楚霸王'], ko: '서초패왕', size: 124, seal: '項羽' });
  brush(B('sg14') + 3.0, Bend('sg14'), { x: 960, y: 120, text: '560,000', size: 200, align: 'center', cls: 'num' });
  brush(B('sg15') + 2.0, Bend('sg15'), { x: 360, y: 140, text: '30,000', size: 170, cls: 'num', color: '#7a5a20' });
  insc(B('sg17') + 2.0, Bend('sg17'), { x: 1540, y: 110, han: ['睢水為之不流'], ko: '수수가 흐르지 못했다', size: 92 });
  brush(B('sg18') + 0.2, Bend('sg18'), { x: 520, y: 170, text: '30,000', size: 120, cls: 'num', color: '#7a5a20', align: 'center' });
  brush(B('sg18') + 0.9, Bend('sg18'), { x: 1400, y: 150, text: '560,000', size: 150, cls: 'num', align: 'center' });
  brush(B('sg18') + 0.6, Bend('sg18'), { x: 960, y: 190, text: '대', size: 90, cls: 'ko', align: 'center' });
  // 승 · 여포
  insc(cue('sg23').about('수극') - 0.2, Bend('sg24'), { x: 300, y: 140, han: '手戟', ko: '손에 들고 쓰는 짧은 창', size: 120 });
  brush(B('sg26') + 0.4, Bend('sg26'), { x: 1500, y: 160, text: '소설', size: 120, color: '#c0392b' });
  brush(B('sg27') + 1.5, Bend('sg27'), { x: 960, y: 130, text: '낙양 → 장안', size: 110, align: 'center' });
  insc(B('sg28') + 0.3, Bend('sg28'), { x: 1560, y: 120, han: ['柰如父子何'], ko: '아버지와 아들 사이인데', size: 92, seal: '呂' });
  insc(B('sg29') + 0.6, Bend('sg29'), { x: 300, y: 110, han: ['擲戟之時', '豈有父子情也'], ko: '창을 던질 때, 부자의 정이 있었는가', size: 84, seal: '王' });
  brush(B('sg32') + 2.0, Bend('sg33'), { x: 960, y: 120, text: '흑산적 장연', size: 104, align: 'center' });
  brush(cue('sg34').about('하루에') - 0.2, Bend('sg34'), { x: 960, y: 120, text: '하루 서너 번 · 열흘', size: 96, align: 'center' });
  insc(B('sg36') - 0.2, Bend('sg36') + 0.4, { x: 140, y: 90, han: ['人中有呂布', '馬中有赤兔'], ko: ['사람 중에는 여포', '말 중에는 적토'], size: 104, seal: '赤兔' });
  insc(cue('sg39').about('작은 가지') - 0.4, Bend('sg39'), { x: 1560, y: 110, han: ['射戟小支'], ko: '창의 작은 가지를 쏘다', size: 100 });
  insc(B('sg40') + 2.4, Bend('sg40'), { x: 300, y: 120, han: ['將軍天威也'], ko: '장군의 하늘 같은 위엄', size: 96, seal: '呂' });
  // 전
  stamp(B('jn01') + 0.1, B('jn01') + 2.6, { chars: '轉', x: 860, y: 380, size: 200 });
  insc(B('jn04') + 1.6, Bend('jn04'), { x: 1560, y: 120, han: ['坑秦卒二十餘萬'], ko: '진나라 병사 이십여만을 묻다', size: 84, light: true });
  insc(B('jn08') + 3.5, Bend('jn08'), { x: 1540, y: 110, han: ['奪項王天下者', '必沛公也'], ko: '천하를 빼앗을 자는 유방', size: 82, seal: '范增' });
  insc(B('jn09') + 3.6, Bend('jn09'), { x: 1580, y: 110, han: ['火三月不滅'], ko: '불이 석 달 꺼지지 않았다', size: 100, light: true });
  insc(B('jn10') + 3.0, Bend('jn10'), { x: 1560, y: 120, han: ['衣繡夜行'], ko: '비단옷 입고 밤길 걷기', size: 104, light: true });
  insc(B('jn11') + 0.6, Bend('jn11'), { x: 300, y: 110, han: ['沐猴而冠'], ko: '갓 쓴 원숭이', size: 110, light: true });
  brush(B('jn12') + 1.2, Bend('jn12'), { x: 960, y: 120, text: '烹', size: 220, cls: 'han', align: 'center', color: '#efe6d4' });
  insc(B('jn14') + 0.4, Bend('jn14'), { x: 1560, y: 120, han: ['韓信'], ko: '계책을 올려도 쓰이지 않다', size: 120 });
  insc(B('jn15') + 1.0, Bend('jn15'), { x: 300, y: 120, han: ['范增'], ko: '돌아가는 길에 죽다', size: 120 });
  brush(B('jn18') + 0.6, Bend('jn19'), { x: 960, y: 120, text: '원술 · 장양 · 원소', size: 96, align: 'center' });
  brush(B('jn21') + 1.0, Bend('jn21'), { x: 960, y: 130, text: '연주', size: 140, align: 'center' });
  brush(B('jn23') + 2.0, Bend('jn23'), { x: 960, y: 130, text: '하비', size: 140, align: 'center' });
  brush(B('jn26') + 2.6, Bend('jn26'), { x: 1460, y: 130, text: '석 달', size: 190 });
  insc(B('jn27') + 0.8, Bend('jn27'), { x: 1580, y: 110, han: ['侯成', '宋憲', '魏續'], ko: '후성 · 송헌 · 위속', size: 90 });
  // 결
  stamp(B('gy01') + 0.1, B('gy01') + 2.6, { chars: '結', x: 860, y: 380, size: 200 });
  brush(B('gy03') + 1.2, Bend('gy03'), { x: 960, y: 120, text: '해하 · 기원전 202년', size: 96, align: 'center', color: '#efe6d4' });
  const chuChars = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * TAU, d = el('han', '楚', { left: (960 + Math.cos(a) * 820) + 'px', top: (520 + Math.sin(a) * 420) + 'px', fontSize: (60 + (i % 3) * 20) + 'px', color: 'rgba(239,230,212,0.85)' }); tl.set(d, { opacity: 0 }, 0); tl.to(d, { opacity: 0.85, duration: 1.2 }, B('gy04') + 0.3 + i * 0.25); tl.to(d, { left: (960 + Math.cos(a) * 520) + 'px', top: (520 + Math.sin(a) * 280) + 'px', duration: 8, ease: 'none' }, B('gy04') + 0.3 + i * 0.25); tl.to(d, { opacity: 0, duration: 0.8 }, E('gy06') - 0.4); return d; });
  insc(B('gy06') + 0.3, Bend('gy06'), { x: 1560, y: 120, han: ['四面楚歌'], ko: '사방에서 초나라 노래', size: 110, light: true, seal: '楚' });
  insc(B('gy08') - 0.2, Bend('gy09'), { x: 60, y: 70, han: ['力拔山兮氣蓋世', '時不利兮騅不逝', '騅不逝兮可奈何', '虞兮虞兮奈若何'], ko: ['힘은 산을 뽑고 기개는 세상을 덮었건만', '때가 불리하니 추마저 나아가지 않네'], size: 66, koSize: 28, light: true, seal: '項羽', dur: 3.2 });
  const countEl = brush(B('gy11') + 0.6, Bend('gy13'), { x: 1500, y: 160, text: '800', size: 170, cls: 'num', color: '#efe6d4' });
  tl.set(countEl, { textContent: '100' }, cue('gy12').about('백여')); tl.set(countEl, { textContent: '28' }, cue('gy13').about('스물여덟')); tl.set(countEl, { color: '#151315' }, B('gy13'));
  insc(B('gy15') + 0.2, Bend('gy15'), { x: 1540, y: 110, han: ['此天之亡我', '非戰之罪也'], ko: '하늘이 나를 망하게 하는 것', size: 92, seal: '項羽' });
  brush(B('gy17') + 2.0, Bend('gy17'), { x: 960, y: 110, text: '오강', size: 140, align: 'center' });
  insc(B('gy19') + 0.4, Bend('gy19'), { x: 1560, y: 100, han: ['我何面目見之'], ko: '무슨 얼굴로 그들을 보겠는가', size: 96, seal: '項羽' });
  brush(cue('gy22').about('서른한') - 0.1, Bend('gy22') + 0.6, { x: 960, y: 380, text: '31', size: 240, cls: 'num', align: 'center' });
  brush(B('gy24') + 3.0, Bend('gy24'), { x: 960, y: 110, text: '백문루 · 서기 198년 겨울', size: 92, align: 'center' });
  insc(B('gy27') + 0.2, Bend('gy27'), { x: 1500, y: 70, han: ['縛虎不得不急'], ko: '호랑이는 꽉 묶을 수밖에', size: 120, seal: '曹' });
  insc(B('gy29') + 0.2, Bend('gy29'), { x: 1560, y: 100, han: ['明公將步', '令布將騎'], ko: '공은 보병, 나는 기병', size: 90, seal: '呂' });
  insc(B('gy31') + 0.2, Bend('gy31'), { x: 300, y: 110, han: ['丁建陽', '董太師'], ko: '정원과 동탁', size: 100, seal: '劉' });
  insc(B('gy32') + 2.4, Bend('gy32'), { x: 1560, y: 110, han: ['大耳兒最叵信'], ko: '귀 큰 놈이 가장 못 믿을 놈', size: 92, seal: '呂' });
  brush(B('gy34') + 0.2, Bend('gy34') + 0.4, { x: 960, y: 760, text: '나이 · 기록 없음', size: 96, align: 'center', cls: 'ko' });
  // 판정
  brush(B('ep03') + 1.4, Bend('ep03'), { x: 960, y: 140, text: '판정할 기록 없음', size: 120, align: 'center' });
  brush(B('ep05') + 0.8, Bend('ep05'), { x: 1500, y: 150, text: '70여 전', size: 130 });
  brush(cue('ep05').about('3만') - 0.1, Bend('ep05'), { x: 1080, y: 330, text: '30,000 › 560,000', size: 104, cls: 'num' });
  brush(B('ep06') + 2.4, Bend('ep06'), { x: 300, y: 150, text: '이각·곽사, 조조에게 패', size: 72, cls: 'ko' });
  insc(B('ep10') - 0.2, Bend('ep11'), { x: 1400, y: 100, han: ['自矜功伐', '欲以力征經營天下', '五年卒亡其國'], ko: '자기 공만 자랑하고 힘으로만 다스리려 했다', size: 76, seal: '司馬遷' });
  insc(B('ep12') + 0.4, Bend('ep12'), { x: 1400, y: 100, han: ['有虓虎之勇', '而無英奇之略', '唯利是視'], ko: '호랑이의 용맹, 계략은 없고 이익만 보았다', size: 76, seal: '陳壽' });
  brush(B('ep14') + 2.8, Bend('ep14'), { x: 960, y: 130, text: '鼎', size: 220, cls: 'han', align: 'center' });
  brush(B('ep17') + 0.6, END + 1, { x: 960, y: 150, text: '강함만으로는 천하를 얻을 수 없다', size: 92, align: 'center' });
  const fin = el('han', '項羽 · 呂布', { left: '960px', top: '820px', fontSize: '70px', transform: 'translateX(-50%)', color: '#151315' }); tl.set(fin, { opacity: 0 }, 0); tl.to(fin, { opacity: 1, duration: 1.2 }, E('ep17') + 0.3);

  // ============================ ink drops and cracks (canvas) ============================
  const fx = $('inkfx'), fc = fx.getContext('2d'), FW = 960, FH = 540;
  const DROPS = [['ki01', 'ink'], ['sg01', 'ink'], ['jn01', 'ink'], ['gy01', 'ink'], ['ep01', 'ink'], ['op06', 'mist'], ['ki15', 'mist'], ['sg21', 'mist'], ['jn17', 'mist'], ['gy23', 'mist'], ['ep08', 'mist'], ['ep14', 'mist'], ['sg03', 'mist'], ['sg12', 'mist'], ['jn09', 'mist'], ['gy03', 'mist']].map(([id, kind]) => ({ t: S(id), kind, seed: id.charCodeAt(0) + id.charCodeAt(1) * 7 + (id.charCodeAt(3) || 0) }));
  const blobsOf = (seed) => { const r = rand(seed); return Array.from({ length: 22 }, () => [r() * FW, r() * FH, 0.4 + r() * 0.9, r() * TAU]); };
  DROPS.forEach((d) => (d.blobs = blobsOf(d.seed)));
  // the four losses of 항우 tear the paper of the painting: jagged rips across the sky (never across the figures)
  const CRACKS = ['jn03', 'jn06', 'jn09', 'jn13'].map((id, i) => { const r = rand(500 + i), y0 = FH * (0.05 + i * 0.06), fromL = i % 2 === 0; const pts = []; let x0 = fromL ? -10 : FW + 10, y = y0;
    let wd = 1.2; while (fromL ? x0 < FW + 10 : x0 > -10) { wd = clamp(wd + (r() - 0.5) * 0.9, 0.5, 2.2); pts.push([x0, y, wd]); x0 += (fromL ? 1 : -1) * (14 + r() * 26); y = clamp(y + (r() - 0.5) * 18, FH * 0.02, FH * 0.3); }
    const fib = Array.from({ length: 24 }, () => [Math.floor(r() * pts.length), (r() - 0.5) * 2, r()]); return { t: S(id), pts, fib }; });
  function drawFx(t) {
    fc.clearRect(0, 0, FW, FH);
    // a near-invisible dot every frame keeps the layer repainting (an untouched cleared canvas can show its last frame)
    fc.fillStyle = 'rgba(0,0,0,0.01)'; fc.fillRect((Math.floor(t * 60) % 2), 0, 1, 1);
    for (const d of DROPS) {
      const u = t - d.t + (d.kind === 'ink' ? 0.9 : 0.6);   // the bloom peaks right at the cue (the cut happens under it)
      if (u < 0 || u > 1.9) continue;
      const grow = eo(clamp(u / 0.9, 0, 1)), clear = io(clamp((u - 1.0) / 0.9, 0, 1));
      fc.save(); fc.fillStyle = d.kind === 'ink' ? 'rgba(21,19,21,0.96)' : 'rgba(239,230,212,0.97)';
      if (d.kind === 'ink' && u < 0.35) { fc.beginPath(); fc.arc(FW / 2, lerp(-20, FH * 0.45, u / 0.35), 6, 0, TAU); fc.fill(); }
      for (const [bx, by, s, a] of d.blobs) { const rr = grow * s * 520 * (1 - clear) * (d.kind === 'ink' ? 1 : 1.1); if (rr <= 1) continue; const cx = lerp(FW / 2, bx, 0.6 * grow), cy = lerp(FH * 0.45, by, 0.6 * grow); fc.beginPath(); for (let k = 0; k <= 24; k++) { const th = k / 24 * TAU, w = rr * (0.82 + 0.18 * Math.sin(th * 5 + a) + 0.08 * Math.sin(th * 11 + a * 2)); k ? fc.lineTo(cx + Math.cos(th) * w, cy + Math.sin(th) * w * 0.85) : fc.moveTo(cx + Math.cos(th) * w, cy + Math.sin(th) * w * 0.85); } fc.fill(); }
      fc.restore();
    }
    // the cracks of 전 (항우's four losses), from their cue until the turn to 여포
    if (t > S('jn03') - 0.1 && t < S('jn17') + 0.6) {
      const fade = 1 - K(t, S('jn17') - 0.4, S('jn17') + 0.6);
      fc.save(); fc.strokeStyle = `rgba(21,19,21,${0.8 * fade})`; fc.lineCap = 'round';
      for (const c of CRACKS) { const g = clamp((t - c.t) / 1.4, 0, 1); if (g <= 0) continue; const n = Math.max(2, Math.floor(c.pts.length * eo(g)));
        // the rip: a dark gap with torn, slightly lighter fibre edges
        fc.fillStyle = `rgba(21,19,21,${0.7 * fade})`; fc.beginPath(); for (let q = 0; q < n; q++) { const p = c.pts[q]; q ? fc.lineTo(p[0], p[1] - p[2]) : fc.moveTo(p[0], p[1] - p[2]); } for (let q = n - 1; q >= 0; q--) { const p = c.pts[q]; fc.lineTo(p[0], p[1] + p[2]); } fc.closePath(); fc.fill();
        fc.strokeStyle = `rgba(250,244,230,${0.75 * fade})`; fc.lineWidth = 0.8;
        for (const [q, side, l] of c.fib) { if (q >= n) continue; const p = c.pts[q]; const yy = p[1] + side * (p[2] + 0.5); fc.beginPath(); fc.moveTo(p[0], yy); fc.lineTo(p[0] + (l - 0.5) * 6, yy + Math.sign(side) * (1.5 + l * 3)); fc.stroke(); } }
      fc.restore();
    }
    // the slash at 송의's tent (sg05) and at the palace gate (sg30, the only red stroke on 여포's side)
    for (const [id, col, f] of [['sg05', 'rgba(21,19,21,0.92)', 0.55], ['sg30', 'rgba(163,48,42,0.9)', 0.4]]) { const a = cue(id).at(f), u = t - a; if (u < 0 || u > 2.6) continue; const g = eo(clamp(u / 0.25, 0, 1)), o = 1 - K(u, 1.6, 2.6); fc.save(); fc.globalAlpha = o; const r = rand(id.length * 31); INK.stroke(fc, INK.quad([FW * 0.18, FH * 0.24], [FW * 0.5, FH * 0.4], [lerp(FW * 0.18, FW * 0.84, g), lerp(FH * 0.24, FH * 0.7, g)], 18), 22, 6, col, 1, r); fc.restore(); }
  }

  // ============================ sound: the synthesized effects track, on the master clock ============================
  const M = MEDIA.install(ctx);
  M.clip($('sfxbox'), 'sfx', { x: 0, y: 0, w: 4, h: 4, start: 0, dur: Math.min(M.SRC.sfx.dur, END), audio: true, vol: 0.9 });

  // ============================ paper & light ============================
  { const pc = $('paper').getContext('2d'); pc.drawImage(INK.paperCanvas(1920, 1080, 7), 0, 0); }
  const lightEl = $('light');
  const LIGHT = { day: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,246,226,0.7), rgba(0,0,0,0) 70%)', bronze: 'radial-gradient(ellipse 60% 55% at 25% 35%, rgba(240,190,110,0.8), rgba(0,0,0,0) 70%)', cool: 'radial-gradient(ellipse 60% 55% at 75% 30%, rgba(225,232,240,0.8), rgba(0,0,0,0) 70%)', night: 'radial-gradient(ellipse 50% 45% at 70% 25%, rgba(220,220,230,0.5), rgba(0,0,0,0) 70%)', fire: 'radial-gradient(ellipse 70% 50% at 50% 90%, rgba(240,140,60,0.8), rgba(0,0,0,0) 70%)', dawn: 'radial-gradient(ellipse 70% 50% at 50% 70%, rgba(255,214,160,0.8), rgba(0,0,0,0) 70%)', winter: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(240,240,240,0.5), rgba(0,0,0,0) 70%)', dream: 'none' };
  let curSet = null, curSky = null;
  prog(0.95);

  onFrame((t) => {
    const s = shotAt(t), k = clamp((t - s.a) / Math.max(0.5, shotEnd(s) - s.a), 0, 1);
    if (curSet !== s.set) { Object.values(sets).forEach((g) => (g.visible = false)); sets[s.set].visible = true; curSet = s.set; }
    if (curSky !== s.sky) { const sk = SKY[s.sky]; sc.background = sk.tex; sc.fog.color.setHex(sk.fog); lightEl.style.background = LIGHT[s.sky]; curSky = s.sky; }
    // riders' opacity back to full unless a shot fades them
    XR.mesh.material.opacity = LR.mesh.material.opacity = 1;
    if (s.upd) s.upd(t);
    const ox = sets[s.set].position.x; ctx.__t = t; s.camf(k); cam.position.x += ox; const look = new T.Vector3(); cam.getWorldDirection(look);
    // camf set the camera in set-local x; recompute lookAt with the set offset
    const tgt = cam.position.clone().add(look); cam.lookAt(tgt);
    key.position.set(cam.position.x - 6, 10, 8); key.target.position.set(ox, 0, 0);
    s3d.fit(); R.render(sc, cam);
    drawFx(t);
  });
  prog(1);
});
