/*
 * scenes.js — 「아틀란티스 전설」, a documentary on Plato's Timaeus and Critias and the 2,400-year search that followed.
 * One sea world (js/atl.js, storyboard.md → 월드 바이블): the ring city on the sea (sun, storm, the sinking), the same city
 * under the water, and a stone hall where a black-figure amphora turns to show the people of the story. A shot table
 * picks the place, the light and the camera for every cue; the inscriptions, the real documents and the speakers' names
 * are in the DOM. Everything is a pure function of t.
 */
Video.define(async (ctx) => {
  const { tl, cue, onFrame, scene, data, rand } = ctx;
  scene('#world', 0, data.duration + 1);
  const END = data.duration, TAU = Math.PI * 2;
  const S = (id) => cue(id).start, E = (id) => cue(id).end;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x), lerp = (a, b, x) => a + (b - a) * x;
  const $ = (id) => document.getElementById(id);
  if (document.fonts && document.fonts.load) await Promise.all(["700 80px 'Hahmlet'", "80px 'GFS Didot'"].map((f) => document.fonts.load(f, 'ΑΤΛΑΝΤΙΣ 아틀란티스')));
  const prog = (p) => { if (typeof Video.progress === 'function') Video.progress(p); };

  // ================================= three.js =================================
  const s3d = Stage3D.create($('gl'), { W: 1920, H: 1080, fov: 38, environment: false });
  const T = s3d.THREE, R = s3d.renderer, sc = s3d.scene, cam = s3d.camera;
  R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; cam.near = 0.05; cam.far = 2000; cam.updateProjectionMatrix();
  const A = window.ATL.init(T, rand);
  sc.fog = new T.Fog(0x9fb6c2, 80, 700);
  const hemi = new T.HemisphereLight(0xcfe6ff, 0x2a3a40, 0.9); sc.add(hemi);
  const sun = new T.DirectionalLight(0xffe0b0, 2.6); sun.position.set(-60, 40, -120); sc.add(sun, sun.target);
  const sky = A.sky(); sc.add(sky);
  const sea = A.ocean(1800); sc.add(sea);
  prog(0.2);

  // ---------------- the world: the ring city at the origin; the pillars of Heracles to the east ----------------
  const CITY = A.city(); sc.add(CITY);
  const P = CITY.userData.parts, MATS = CITY.userData.mats;
  const pillarsG = new T.Group(); pillarsG.position.set(-260, 0, 0); sc.add(pillarsG);
  { const rock = new T.MeshStandardMaterial({ color: 0x8b7f6c, roughness: 1, flatShading: true }); for (const z of [-26, 26]) { const g = new T.Mesh(new T.CylinderGeometry(5, 11, 46, 9, 4), rock); const pos = g.geometry.attributes.position, r = rand(z + 99); for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) * (0.85 + 0.3 * r()), pos.getY(i), pos.getZ(i) * (0.85 + 0.3 * r())); g.geometry.computeVertexNormals(); g.position.set(0, 20, z); pillarsG.add(g); } }
  const fleet = A.ships(36, 5, (i, r) => [-6 + (i % 6) * 2.6 + r() * 0.8, 0.05, 33 + Math.floor(i / 6) * 3.4 + r(), -Math.PI / 2], 0.9);
  const THERA = A.thera(); THERA.position.set(500, 0, 300); sc.add(THERA); const TH = THERA.position; sc.add(fleet);
  const athens = A.ships(14, 9, (i, r) => [-170 + (i % 5) * 4, 0.05, -10 + Math.floor(i / 5) * 4 + r(), Math.PI / 2], 1.1); sc.add(athens);
  // concentric ripples on calm water (the ending)
  const rippleTex = A.tex(A.cv(512, 512, (x, w) => { x.strokeStyle = 'rgba(255,255,255,0.8)'; for (let k = 1; k <= 5; k++) { x.lineWidth = 6 - k * 0.6; x.beginPath(); x.arc(w / 2, w / 2, k * 48, 0, TAU); x.stroke(); } }));
  const ripple = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ map: rippleTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.4; sc.add(ripple);
  prog(0.4);

  // ---------------- the hall of Sais: a dark stone room, a shaft of light, the amphora on a plinth ----------------
  const HALL = new T.Group(); HALL.position.set(0, -400, 0); sc.add(HALL);
  const stone = new T.MeshStandardMaterial({ map: A.marbleTex, color: 0x8a8070, roughness: 0.9 });
  { const floor = new T.Mesh(new T.PlaneGeometry(40, 40), stone); floor.rotation.x = -Math.PI / 2; HALL.add(floor);
    const back = new T.Mesh(new T.PlaneGeometry(40, 16), new T.MeshStandardMaterial({ color: 0x3a342c, roughness: 1 })); back.position.set(0, 8, -8); HALL.add(back);
    for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.CylinderGeometry(0.55, 0.62, 9, 18), stone); c.position.set(-8.5 + i * 3.4, 4.5, -5.5 - (i % 2) * 1.2); HALL.add(c); const cap = new T.Mesh(new T.CylinderGeometry(1.0, 0.6, 0.9, 18), stone); cap.position.set(c.position.x, 9.2, c.position.z); HALL.add(cap); }
    const plinth = new T.Mesh(new T.BoxGeometry(1.8, 1.0, 1.8), stone); plinth.position.y = 0.5; HALL.add(plinth); }
  const hallLight = new T.SpotLight(0xffe2b8, 120, 30, 0.42, 0.6, 1.4); hallLight.position.set(1.2, 11, 8); hallLight.target.position.set(0, 2, 0); HALL.add(hallLight, hallLight.target);
  const shaft = new T.Mesh(new T.CylinderGeometry(0.3, 2.2, 14, 24, 1, true), new T.MeshBasicMaterial({ color: 0xffe0b0, transparent: true, opacity: 0.07, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false })); shaft.position.set(0.6, 6.5, 4); shaft.rotation.set(-0.5, 0, 0.08); HALL.add(shaft);
  const dust = new T.Points(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => { const r = rand(i + 7)(); return i % 3 === 0 ? -3 + r * 4 : i % 3 === 1 ? r * 10 : -1 + r * 4; }), 3)), new T.PointsMaterial({ color: 0xffe8c8, size: 0.03, transparent: true, opacity: 0.6, depthWrite: false })); HALL.add(dust);

  // the amphora: eight painted scenes around its belly
  const B = A.BF;
  const VASE = A.amphora([
    // 0 · Solon sails to Egypt
    (x, w, h, r) => { B.waves(x, w, h - 20); B.ship(x, w / 2, h - 40, 0.95); B.label(x, 'ΣΟΛΩΝ', w / 2, 40); },
    // 1 · Solon and the old priest of Sais
    (x, w, h, r) => { B.column(x, 40, h, 520); B.man(x, 170, h, 1.55, 'robe', { arm: 0.6 }); B.man(x, 360, h, 1.55, 'priest', { flip: true, arm: 0.2 }); B.label(x, 'ΙΕΡΕΥΣ · ΣΟΛΩΝ', w / 2, 40); },
    // 2 · the chain of the story: priest → Solon → Critias → Plato
    (x, w, h, r) => { B.man(x, 62, h, 1.05, 'priest', { arm: 0.4 }); B.man(x, 186, h, 1.05, 'robe', { arm: 0.4 }); B.man(x, 310, h, 1.05, 'robe', { arm: 0.4, young: true }); B.man(x, 436, h, 1.05, 'robe', { scroll: true }); B.label(x, 'ΠΛΑΤΩΝ', 436, 40); },
    // 3 · Poseidon, Cleito and the rings
    (x, w, h, r) => { B.man(x, 130, h, 1.55, 'god', { trident: true, arm: 0.5 }); B.woman(x, 370, h, 1.5, { flip: true }); B.rings(x, w / 2, 150, 0.9); B.label(x, 'ΠΟΣΕΙΔΩΝ · ΚΛΕΙΤΩ', w / 2, 40); },
    // 4 · the kings and the bull at the pillar of the law
    (x, w, h, r) => { B.man(x, 80, h, 1.25, 'king', { arm: 1 }); B.bull(x, 280, h, 1.2); B.column(x, 470, h, 380); B.label(x, 'ΒΑΣΙΛΕΙΣ', w / 2, 40); },
    // 5 · Athenian hoplites hold the line
    (x, w, h, r) => { B.man(x, 110, h, 1.35, 'hoplite', { device: true }); B.man(x, 250, h, 1.35, 'hoplite', { device: true }); B.man(x, 420, h, 1.35, 'hoplite', { flip: true }); B.label(x, 'ΑΘΗΝΑΙΟΙ', w / 2, 40); },
    // 6 · Zeus calls the gods together
    (x, w, h, r) => { B.man(x, 256, h, 1.7, 'god', { bolt: true, arm: 0.8 }); B.man(x, 70, h, 1.05, 'god', { flip: false }); B.woman(x, 450, h, 1.05, { flip: true }); B.label(x, 'ΖΕΥΣ', w / 2, 40); },
    // 7 · a small, measured city against a great sea empire
    (x, w, h, r) => { B.man(x, 90, h, 1.25, 'hoplite', { device: true }); B.waves(x, w, h - 10); B.ship(x, 340, h - 60, 0.75); B.ship(x, 420, h - 150, 0.5); B.label(x, 'ΑΘΗΝΑΙ · ΑΤΛΑΝΤΙΣ', w / 2, 40); },
  ]);
  VASE.scale.setScalar(1.6); VASE.position.y = 1.0; HALL.add(VASE);
  const vaseAngle = (i) => -((i + 0.5) / 8) * TAU;   // turn scene i to face the camera (+z)
  prog(0.6);

  // ---------------- under the water: the same city, sunk, in blue light ----------------
  const UNDER = A.city(); UNDER.position.set(2000, -9, 0); sc.add(UNDER);
  UNDER.traverse((o) => { if (o.material && o.material.isMeshStandardMaterial) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.55); o.material.color.lerp(new T.Color(0x2a6a70), 0.35); } });
  UNDER.rotation.set(0.04, 0.6, -0.03);
  const surf = A.ocean(600); surf.position.set(2000, 0, 0); surf.material = surf.material.clone(); surf.material.uniforms = T.UniformsUtils.clone(sea.material.uniforms); surf.material.uniforms.uUnder.value = 1; sc.add(surf); surf.visible = false;
  const rays = Array.from({ length: 10 }, (_, i) => { const m = new T.Mesh(new T.PlaneGeometry(2.5, 40), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.08, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false })); m.position.set(2000 - 20 + i * 4.5, -14, -10 + (i % 3) * 6); m.rotation.z = 0.25; sc.add(m); return m; });
  const motes = new T.Points(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(Array.from({ length: 3000 }, (_, i) => { const r = rand(i + 900)(); return i % 3 === 0 ? 1960 + r * 80 : i % 3 === 1 ? -14 + r * 14 : -30 + r * 60; }), 3)), new T.PointsMaterial({ color: 0xcfefff, size: 0.06, transparent: true, opacity: 0.5, depthWrite: false })); sc.add(motes);
  const lamps = [0, 1, 2].map((i) => { const l = new T.SpotLight(0xfff1d0, 60, 40, 0.28, 0.5, 1.2); sc.add(l, l.target); return l; });
  prog(0.75);

  // ================================= moods (light, sky, sea, fog) =================================
  const MOOD = {
    dusk: { top: 0x1c3550, hor: 0xe8956a, sunDir: [0, 0.06, -1], sunCol: 0xffc48a, sunI: 2.2, fog: 0xb08a7a, fn: 80, ff: 650, deep: 0x0d2a3a, shal: 0x2a6a78, skyR: 0xd08a6a, hemi: [0x9fb4d0, 0x30343a, 0.7], exp: 1.0, grade: 'linear-gradient(180deg, rgba(255,150,90,0.25), rgba(40,60,90,0.2))' },
    noon: { top: 0x2a6fb0, hor: 0xbfe0ee, sunDir: [-0.3, 0.75, -0.6], sunCol: 0xfff3dc, sunI: 3.0, fog: 0xbcd8e4, fn: 120, ff: 900, deep: 0x0d4a66, shal: 0x2f97a8, skyR: 0x9fd0e6, hemi: [0xdff0ff, 0x4a5a50, 1.0], exp: 1.0, grade: 'none' },
    storm: { top: 0x141c22, hor: 0x4a5864, sunDir: [0.2, 0.3, -1], sunCol: 0x9aaabb, sunI: 1.0, fog: 0x34404a, fn: 30, ff: 260, deep: 0x0c181e, shal: 0x34505a, skyR: 0x4a5a66, hemi: [0x8a9aa8, 0x1a2228, 1.3], exp: 1.15, grade: 'linear-gradient(180deg, rgba(20,30,40,0.35), rgba(0,0,0,0.4))' },
    mud: { top: 0x5a5a50, hor: 0x9a8a6a, sunDir: [0.2, 0.25, -1], sunCol: 0xd8c8a0, sunI: 1.2, fog: 0x8a7c62, fn: 40, ff: 500, deep: 0x4a3c28, shal: 0x7a6440, skyR: 0x9a8a6a, hemi: [0xb0a890, 0x403828, 0.7], exp: 1.0, grade: 'linear-gradient(180deg, rgba(120,100,60,0.25), rgba(60,40,20,0.3))' },
    under: { top: 0x0b3a4a, hor: 0x1e6a78, sunDir: [0.1, 1, 0.2], sunCol: 0x9fe0ff, sunI: 1.0, fog: 0x0f4552, fn: 2, ff: 55, deep: 0x0f4552, shal: 0x2f8aa0, skyR: 0x6fc0d0, hemi: [0x6fc8d8, 0x061a20, 0.9], exp: 1.05, grade: 'linear-gradient(180deg, rgba(60,170,200,0.2), rgba(0,20,30,0.45))' },
    dawn: { top: 0x3a5c88, hor: 0xf2c6a0, sunDir: [0.1, 0.08, -1], sunCol: 0xffe2b8, sunI: 2.0, fog: 0xd8c0b0, fn: 90, ff: 750, deep: 0x163e52, shal: 0x4a8a98, skyR: 0xe8c0a8, hemi: [0xd8e0f0, 0x404850, 0.8], exp: 1.0, grade: 'linear-gradient(180deg, rgba(255,210,170,0.18), rgba(40,70,100,0.12))' },
    ash: { top: 0x3a3634, hor: 0x9a6e50, sunDir: [0.3, 0.15, -1], sunCol: 0xffa060, sunI: 1.4, fog: 0x6e5c50, fn: 60, ff: 520, deep: 0x1e2a2c, shal: 0x3a4a48, skyR: 0x6a5e56, hemi: [0xa89a8e, 0x302a26, 0.9], exp: 1.0, grade: 'linear-gradient(180deg, rgba(120,70,40,0.25), rgba(30,20,15,0.3))' },
    hall: { top: 0x050403, hor: 0x0a0806, sunDir: [0, 1, 0], sunCol: 0x000000, sunI: 0.0, fog: 0x0a0806, fn: 10, ff: 60, deep: 0, shal: 0, skyR: 0, hemi: [0x5a4c3c, 0x0a0806, 0.25], exp: 1.1, grade: 'linear-gradient(180deg, rgba(255,200,140,0.08), rgba(0,0,0,0.25))' },
  };
  const gradeEl = $('grade');
  let curMood = null;
  function setMood(k) {
    if (curMood === k) return; curMood = k; const m = MOOD[k];
    const su = sky.userData.u; su.uTop.value.setHex(m.top); su.uHor.value.setHex(m.hor); su.uSun.value.set(...m.sunDir).normalize(); su.uSunCol.value.setHex(m.sunCol); su.uSunSize.value = k === 'noon' ? 0.0005 : 0.0014;
    for (const o of [sea, surf]) { const u = o.material.uniforms; u.uDeep.value.setHex(m.deep); u.uShal.value.setHex(m.shal); u.uSky.value.setHex(m.skyR); u.uSun.value.copy(su.uSun.value); u.uSunCol.value.setHex(m.sunCol); u.uFogC.value.setHex(m.fog); u.uFogN.value = m.fn; u.uFogF.value = m.ff; }
    sc.fog.color.setHex(m.fog); sc.fog.near = m.fn; sc.fog.far = m.ff;
    sun.color.setHex(m.sunCol); sun.intensity = m.sunI; sun.position.copy(su.uSun.value).multiplyScalar(300);
    hemi.color.setHex(m.hemi[0]); hemi.groundColor.setHex(m.hemi[1]); hemi.intensity = m.hemi[2]; R.toneMappingExposure = m.exp; gradeEl.style.background = m.grade;
    sky.visible = k !== 'hall'; sea.visible = k !== 'hall' && k !== 'under'; surf.visible = k === 'under';
  }

  // ================================= the writing (DOM) =================================
  const W$ = $('writing');
  const el = (cls, html, css) => { const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; Object.assign(d.style, css || {}); W$.appendChild(d); return d; };
  const show = (d, a, b, how = 'rise') => {
    tl.set(d, { opacity: 0, y: how === 'rise' ? 26 : 0, letterSpacing: how === 'carve' ? '0.6em' : null }, 0);
    tl.to(d, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', ...(how === 'carve' ? { letterSpacing: '0.32em' } : {}) }, a);
    tl.to(d, { opacity: 0, duration: 0.6, ease: 'power1.in' }, Math.max(a + 1, b - 0.6));
  };
  const gr = (a, b, o) => { const d = el('gr' + (o.dark ? ' dark' : ''), o.text, { left: o.x + 'px', top: o.y + 'px', fontSize: (o.size || 64) + 'px' }); if (o.center) d.style.transform = 'translateX(-50%)'; show(d, a, b, 'carve'); return d; };
  const kr = (a, b, o) => { const d = el('kr' + (o.sub ? ' sub' : '') + (o.dark ? ' dark' : ''), o.text, { left: o.x + 'px', top: o.y + 'px', fontSize: (o.size || 56) + 'px', textAlign: o.center ? 'center' : 'left' }); if (o.center) d.style.transform = 'translateX(-50%)'; show(d, a, b); return d; };
  const big = (a, b, o) => { const d = el('big', o.text, { left: o.x + 'px', top: o.y + 'px', fontSize: (o.size || 220) + 'px' }); if (o.center) d.style.transform = 'translateX(-50%)'; show(d, a, b); return d; };

  // the real documents (assets/user/img — provenance.json), laid on stone, with their source
  const REAL = {
    plato: ['plato.jpg', '플라톤', '실라니온 원작의 로마 시대 모작 · 카피톨리니 박물관 · 사진 Marie-Lan Nguyen, CC BY 2.5'],
    kircher: ['kircher.jpg', '키르허의 아틀란티스 지도', '『지하 세계』(1678년판) · 남쪽이 위'],
    donnelly: ['donnelly.jpg', '이그나티우스 도널리', '1898년 무렵'],
    donmap: ['donnelly_map.jpg', '도널리의 아틀란티스 지도', '『아틀란티스, 대홍수 이전의 세계』(1882)'],
    santorini: ['santorini.jpg', '산토리니 칼데라', '국제우주정거장에서 · NASA'],
    akrotiri: ['akrotiri.jpg', '아크로티리 벽화', '기원전 17세기 무렵 · 산토리니'],
    helike: ['helike.jpg', '헬리케 발굴 현장', '그리스 아하이아 · 헬리케 프로젝트 · 사진 Sappho50, CC0'],
    gibraltar: ['gibraltar.jpg', '지브롤터 해협', '인공위성 사진 · Axelspace, CC BY-SA 4.0'],
  };
  const HAVE = new Set(window.REAL_IMAGES || []);
  const imgWaits = [], imgEls = [];
  if (typeof ctx.busy === 'function') ctx.busy(() => imgEls.some((i) => !i.complete));
  const doc = (a, b, key, o) => { const r = REAL[key]; if (!r || !HAVE.has(r[0])) return null;
    const d = el('mount', null, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', transform: `rotate(${o.rot || 0}deg)` });
    const im = document.createElement('img'); im.src = 'assets/user/img/' + r[0]; im.alt = r[1]; d.appendChild(im); imgEls.push(im); imgWaits.push(im.decode().catch(() => {}));
    const cap = document.createElement('div'); cap.className = 'cap'; cap.innerHTML = r[1] + '<small>' + r[2] + '</small>'; d.appendChild(cap);
    tl.set(d, { opacity: 0, y: 40, scale: 0.97 }, 0); tl.to(d, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'power3.out' }, a); tl.to(d, { y: -12, duration: Math.max(0.5, b - a), ease: 'none' }, a); tl.to(d, { opacity: 0, duration: 0.6 }, Math.max(a + 1.2, b - 0.6)); return d; };
  // who is speaking (their own voice): name in Korean and Greek
  const SPK = { priest: ['사이스의 늙은 사제', 'ΙΕΡΕΥΣ'], critias: ['크리티아스', 'ΚΡΙΤΙΑΣ'], donnelly: ['이그나티우스 도널리', 'DONNELLY'] };
  const SPEAKERS = window.SPEAKERS || {};
  ctx.cues.forEach((c) => { const k = SPEAKERS[c.id]; if (!k || !SPK[k]) return; const d = el('speaker', `<i></i><div><span>${SPK[k][0]}</span><small>${SPK[k][1]}</small></div>`, {}); tl.set(d, { opacity: 0 }, 0); tl.to(d, { opacity: 1, duration: 0.3 }, c.start - 0.05); tl.to(d, { opacity: 0, duration: 0.3 }, c.end + 0.1); });

  // ================================= shots =================================
  const SHOTS = [];
  const shot = (from, mood, camf, upd) => SHOTS.push({ from, mood, camf, upd });
  const CP = (x, y, z, lx, ly, lz) => { cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); };
  const H = HALL.position;
  const hallCam = (scn, k, dist = 6.5, h = 2.6, swing = 0.25) => { const a = swing * (k - 0.5); CP(H.x + Math.sin(a) * dist, H.y + h, H.z + Math.cos(a) * dist, H.x, H.y + 2.6, H.z); };
  let vaseTarget = 0;
  const vaseAt = (t, i, a0) => { vaseTarget = i; };
  const U = UNDER.position;
  // which parts of the world each place needs
  const place = (k) => { HALL.visible = k === 'hall'; CITY.visible = k !== 'hall' && k !== 'under'; UNDER.visible = rays[0].visible = motes.visible = k === 'under'; lamps.forEach((l) => (l.visible = k === 'under')); };
  const resetCity = () => { CITY.position.set(0, 0, 0); CITY.rotation.set(0, 0, 0); P.lands.forEach((l) => { l.position.y = 0; l.rotation.set(0, 0, 0); }); MATS.ori.emissiveIntensity = 0.4; sea.material.uniforms.uAmp.value = 0.12; fleet.visible = athens.visible = false; ripple.material.opacity = 0; };
  const fleetSail = (t, a, b) => { fleet.visible = true; const k = K(t, a, b); fleet.userData.list.forEach((s, i) => { s.position.z = 33 + Math.floor(i / 6) * 3.4 + k * 40; s.position.y = 0.05 + 0.04 * Math.sin(t * 2 + s.userData.ph); s.rotation.z = 0.03 * Math.sin(t * 1.3 + s.userData.ph); }); };

  // —— prologue ——
  shot('op01', 'dusk', (k) => CP(0, lerp(1.6, 2.2, k), lerp(260, 200, k), 0, 1.5, 0), (t) => { resetCity(); CITY.visible = false; });
  shot('op02', 'dusk', (k) => CP(lerp(-8, 4, k), lerp(4, 7, k), lerp(70, 45, io(k)), 0, 0.6, 0), (t) => { resetCity(); MATS.ori.emissiveIntensity = 0.9; });
  shot('op03', 'dusk', (k) => CP(lerp(0, 30, k), lerp(20, 90, io(k)), lerp(60, 140, io(k)), 0, 0, -40), (t) => { resetCity(); });
  shot('op04', 'dusk', (k) => CP(lerp(-30, -10, k), 8, 90, 0, 2, 0), (t) => { resetCity(); });
  shot('op06', 'dusk', (k) => CP(lerp(20, 0, k), lerp(12, 6, k), lerp(70, 50, k), 0, 1, 0), (t) => { resetCity(); });
  // —— 1 · the one record ——
  shot('a01', 'hall', (k) => hallCam(0, k, 9, 3.2), (t) => { vaseTarget = 0; });
  shot('a02', 'hall', (k) => hallCam(0, k, 6.2, 2.4), (t) => { vaseTarget = 2; });
  shot('a04', 'hall', (k) => hallCam(0, k, 5.4, 2.6), (t) => { vaseTarget = 2; });
  shot('a06', 'hall', (k) => hallCam(0, k, 5.2, 2.4), (t) => { vaseTarget = 0; });
  shot('a07', 'hall', (k) => hallCam(0, k, 4.6, 2.7, 0.15), (t) => { vaseTarget = 1; });
  shot('a08', 'hall', (k) => hallCam(0, k, 10, 3.6), (t) => { vaseTarget = 1; });
  shot('a09', 'hall', (k) => hallCam(0, k, 6, 2.6), (t) => { vaseTarget = 0; });
  shot('a10', 'hall', (k) => hallCam(0, k, 5.0, 2.6), (t) => { vaseTarget = 2; });
  shot('a11', 'hall', (k) => hallCam(0, k, 11, 4), (t) => { vaseTarget = 2; });
  // —— 2 · the empire ——
  shot('b01', 'noon', (k) => CP(lerp(-60, -40, k), lerp(60, 40, k), lerp(160, 120, k), 0, 0, 0), (t) => { resetCity(); });
  shot('b02', 'noon', (k) => CP(-345 + 25 * k, 7, 0, 0, 3, 0), (t) => { resetCity(); });
  shot('b03', 'noon', (k) => CP(lerp(-10, 0, k), lerp(60, 85, io(k)), lerp(-75, -95, io(k)), 0, 0, 8), (t) => { resetCity(); });
  shot('b04', 'hall', (k) => hallCam(0, k, 5.0, 2.6), (t) => { vaseTarget = 3; });
  shot('b05', 'noon', (k) => CP(0.01, lerp(26, 34, io(k)), 0.02, 0, 0, 0), (t) => { resetCity(); });
  shot('b06', 'hall', (k) => hallCam(0, k, 5.2, 2.6), (t) => { vaseTarget = 3; });
  shot('b08', 'noon', (k) => CP(lerp(30, 10, k), lerp(16, 10, k), lerp(30, 34, k), 0, 0.5, 0), (t) => { resetCity(); });
  shot('b09', 'noon', (k) => CP(0, lerp(1.6, 1.4, k), lerp(46, 15, io(k)), 0, 0.9, 0), (t) => { resetCity(); });
  shot('b10', 'noon', (k) => { const a = lerp(0.2, 1.3, io(k)), r = lerp(14.6, 6.5, io(k)); CP(Math.sin(a) * r, lerp(1.6, 1.8, k), Math.cos(a) * r, 0, 0.8, 0); }, (t) => { resetCity(); MATS.ori.emissiveIntensity = 0.6 + 0.4 * K(t, cue('b10').about('오레이칼코스'), cue('b10').about('오레이칼코스') + 1); });
  shot('b11', 'noon', (k) => { const a = lerp(1.5, 2.0, k); CP(Math.sin(a) * 5.2, lerp(3.4, 2.8, k), Math.cos(a) * 5.2, 0, 0.9, 0); }, (t) => { resetCity(); MATS.ori.emissiveIntensity = 1.0; });
  shot('b12', 'noon', (k) => { const a = lerp(-0.6, 0.6, k); CP(Math.sin(a) * 2.4, 1.6, Math.cos(a) * 2.4, 0, 1.1, 0); }, (t) => { resetCity(); });
  shot('b13', 'hall', (k) => hallCam(0, k, 5.0, 2.6), (t) => { vaseTarget = 4; });
  shot('b15', 'noon', (k) => CP(lerp(-20, -6, k), lerp(12, 8, k), lerp(28, 24, k), 0, 0.5, 0), (t) => { resetCity(); });
  shot('b16', 'dusk', (k) => CP(lerp(-6, 6, k), lerp(8, 10, k), 24, 0, 0.5, 0), (t) => { resetCity(); MATS.ori.emissiveIntensity = 0.4 - 0.3 * K(t, S('b16'), E('b16')); });
  // —— 3 · the day and the night ——
  shot('c01', 'dusk', (k) => CP(lerp(14, 6, k), 4, lerp(56, 70, k), 0, 0.5, 40), (t) => { resetCity(); fleetSail(t, S('c01'), E('c02')); });
  shot('c02', 'dusk', (k) => CP(lerp(20, 30, k), 12, 90, 0, 0, 50), (t) => { resetCity(); fleetSail(t, S('c01'), E('c02')); });
  shot('c03', 'hall', (k) => hallCam(0, k, 5.0, 2.5), (t) => { vaseTarget = 5; });
  const quake = (t, a, b) => { const k = K(t, a, b); CITY.visible = true; sea.material.uniforms.uAmp.value = lerp(0.3, 1.2, k); CITY.position.y = -6 * io(k); P.lands.forEach((l, i) => { l.rotation.x = 0.06 * k * Math.sin(i * 1.7 + t * 3); l.rotation.z = 0.05 * k * Math.cos(i * 2.3 + t * 2.5); l.position.y = -i * 0.8 * k; }); CITY.position.x = 0.06 * Math.sin(t * 37) * (1 - k * 0.5) * K(t, a, a + 0.6); };
  shot('c04', 'storm', (k) => CP(lerp(-24, -20, k), 6, lerp(34, 30, k), 0, 1, 0), (t) => { resetCity(); sea.material.uniforms.uAmp.value = 0.3; });
  shot('c04q', 'storm', (k) => CP(lerp(-20, -26, k), lerp(6, 9, k), lerp(30, 40, k), 0, -1, 0), (t) => { resetCity(); quake(t, S('c04q'), E('c04q') + 1.5); });
  shot('c05', 'mud', (k) => CP(0, lerp(8, 14, k), lerp(40, 50, k), 0, 0, 0), (t) => { resetCity(); CITY.visible = false; sea.material.uniforms.uAmp.value = 0.05; });
  shot('c06', 'hall', (k) => hallCam(0, k, 6, 2.6), (t) => { vaseTarget = 6; });
  shot('c07', 'hall', (k) => hallCam(0, 0.5, lerp(5.0, 3.6, io(k)), 2.8, 0), (t) => { vaseTarget = 6; });
  shot('c08', 'hall', (k) => hallCam(0, k, lerp(3.6, 9, io(k)), 3.0, 0.1), (t) => { vaseTarget = 6; });
  shot('c09', 'hall', (k) => hallCam(0, k, 12, 4.4), (t) => { vaseTarget = 6; });
  // —— 4 · the search ——
  const underCam = (k, x0, x1, y0, y1, z0, z1, lx, ly, lz) => CP(U.x + lerp(x0, x1, k), lerp(y0, y1, k), lerp(z0, z1, k), U.x + lx, ly, lz);
  const lampsAt = (t, n) => lamps.forEach((l, i) => { l.visible = i < n; const a = t * 0.3 + i * 2.1; l.position.set(U.x + Math.cos(a) * 10, -2, Math.sin(a) * 10 + 8); l.target.position.set(U.x + Math.cos(a * 1.3) * 4, -9, Math.sin(a * 0.9) * 4); });
  shot('d01', 'under', (k) => underCam(io(k), 4, 0, 6, -3, 30, 22, 0, -7, 0), (t) => { lampsAt(t, 0); });
  shot('d02', 'under', (k) => underCam(k, -8, 6, -4, -5, 18, 14, 0, -8, 0), (t) => { lampsAt(t, 0); });
  shot('d03', 'under', (k) => underCam(k, 6, -2, -5, -6, 12, 9, 0, -8.5, 0), (t) => { lampsAt(t, 1); });
  shot('d09', 'under', (k) => underCam(k, -10, 10, -3, -4, 20, 20, 0, -8, 0), (t) => { lampsAt(t, 3); });
  // Thera: the whole volcano, the eruption, the collapse into a ring of cliffs
  const theraAt = (t) => { resetCity(); CITY.visible = false; const cone = THERA.userData.cone, ringG = THERA.userData.ring, c0 = S('d13');
    cone.position.y = 3.2 - 18 * io(K(t, c0 + 0.3, c0 + 4)); cone.visible = cone.position.y > -14; ringG.visible = t > c0 + 0.6;
    THERA.userData.erupt(K(t, S('d12') + 0.2, S('d12') + 5.5), t, K(t, c0 + 1.5, c0 + 5.5)); };
  const thCam = (a, r, h, ly) => CP(TH.x + Math.sin(a) * r, h, TH.z + Math.cos(a) * r, TH.x, ly, TH.z);
  shot('d10', 'noon', (k) => thCam(0.9 - 0.2 * k, lerp(200, 150, io(k)), 22, 4), theraAt);
  shot('d11', 'noon', (k) => thCam(0.7 - 0.5 * k, 52, 12, 5), theraAt);
  shot('d12', 'ash', (k) => thCam(0.3 - 0.2 * k, lerp(90, 120, io(k)), 14, lerp(14, 34, io(k))), theraAt);
  shot('d13', 'ash', (k) => thCam(0.1 - 0.3 * k, lerp(70, 26, io(k)), lerp(18, 58, io(k)), lerp(20, 0, io(k))), theraAt);
  shot('d14', 'noon', (k) => thCam(1.3 + 0.35 * k, lerp(36, 30, k), lerp(11, 9, k), 1.5), theraAt);
  shot('d15', 'noon', (k) => thCam(-0.6 + 0.6 * k, 42, 14, 2), theraAt);
  shot('d16', 'noon', (k) => thCam(0.4 + 0.3 * k, 30, lerp(9, 6, k), 3), theraAt);
  shot('d17', 'noon', (k) => CP(TH.x + 0.01, lerp(48, 58, io(k)), TH.z + 0.02, TH.x, 0, TH.z), theraAt);
  shot('d18', 'noon', (k) => thCam(-0.2 - 0.2 * k, lerp(40, 160, io(k)), lerp(16, 60, io(k)), 2), theraAt);
  shot('d19', 'storm', (k) => CP(lerp(10, -10, k), 6, 60, 0, 0, 0), (t) => { resetCity(); CITY.visible = false; sea.material.uniforms.uAmp.value = 0.6; });
  shot('d20', 'storm', (k) => CP(lerp(-24, -20, k), 6, 34, 0, 0, 0), (t) => { resetCity(); quake(t, S('d20') + 1, E('d20') + 3); });
  shot('d21', 'under', (k) => underCam(k, 4, -4, -4, -5, 16, 13, 0, -8, 0), (t) => { lampsAt(t, 2); });
  shot('d22', 'storm', (k) => CP(0, 10, 70 - 10 * k, 0, 0, 0), (t) => { resetCity(); CITY.visible = false; sea.material.uniforms.uAmp.value = 0.4; });
  // —— 5 · Plato's question ——
  shot('e01', 'dawn', (k) => CP(0, lerp(3, 5, k), lerp(160, 120, k), 0, 1, 0), (t) => { resetCity(); CITY.visible = false; });
  shot('e02', 'hall', (k) => hallCam(0, k, 7, 3.0), (t) => { vaseTarget = 7; });
  shot('e04', 'hall', (k) => hallCam(0, k, 5.0, 2.6), (t) => { vaseTarget = 7; });
  shot('e05', 'hall', (k) => hallCam(0, k, 5.0, 2.6), (t) => { vaseTarget = 5; });
  shot('e06', 'dawn', (k) => CP(-150 + 10 * k, 3, 18, -170, 1, -2), (t) => { resetCity(); CITY.visible = false; athens.visible = true; athens.userData.list.forEach((s, i) => { s.position.x = -170 + (i % 5) * 4 + (t - S('e06')) * 0.8; s.position.y = 0.05 + 0.04 * Math.sin(t * 2 + i); }); });
  shot('e08', 'hall', (k) => hallCam(0, k, 8, 3.2), (t) => { vaseTarget = 7; });
  shot('e09', 'dawn', (k) => CP(0, lerp(14, 40, io(k)), lerp(40, 60, io(k)), 0, 0, 0), (t) => { resetCity(); CITY.visible = false; ripple.material.opacity = 0.5 * K(t, S('e09'), S('e09') + 2); ripple.scale.setScalar(1 + 0.3 * K(t, S('e09'), END)); });

  SHOTS.forEach((s) => (s.a = S(s.from)));
  const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.a - 0.001) s = x; return s; };
  const shotEnd = (s) => { const i = SHOTS.indexOf(s); return i < SHOTS.length - 1 ? SHOTS[i + 1].a : END; };
  // the vase turns smoothly to the scene of the shot (eased between shots, slow drift within)
  const vaseTimes = SHOTS.filter((s) => s.mood === 'hall');
  const vaseRot = (t) => { let prevI = 0, prevT = -1e9, curI = 0, curT = 0; const seq = []; for (const s of SHOTS) { if (s.mood !== 'hall') continue; const tmp = vaseTarget; s.upd(s.a); seq.push([s.a, vaseTarget]); vaseTarget = tmp; }
    let rot = vaseAngle(seq[0][1]); for (let i = 0; i < seq.length; i++) { const [a, sc2] = seq[i]; if (t < a) break; const from = i ? vaseAngle(seq[i - 1][1]) : vaseAngle(sc2); let to = vaseAngle(sc2); rot = lerp(from, to, io(K(t, a, a + 1.6))); } return rot + 0.03 * Math.sin(t * 0.25); };

  // ================================= the writing, cue by cue =================================
  const b = (id) => S(id), be = (id) => E(id) + 0.2;
  gr(b('op02') + 1.2, be('op02'), { text: 'ΑΤΛΑΝΤΙΣ', x: 960, y: 170, size: 120, center: true });
  kr(b('op02') + 1.8, be('op02'), { text: '아틀란티스', x: 960, y: 320, size: 64, center: true, sub: true });
  ['대서양', '지중해', '남극', '사하라'].forEach((w, i) => kr(cue('op03').about(w) - 0.2, be('op03'), { text: w, x: 320 + i * 420, y: 820, size: 56, center: true }));
  gr(b('op05') - 0.2, be('op05'), { text: 'ΠΛΑΤΩΝ', x: 1380, y: 840, size: 84, center: true });
  ['출처', '제국', '멸망', '수색', '질문'].forEach((w, i) => { gr(cue('op07').at(0.12 + i * 0.16), be('op07'), { text: 'ΑΒΓΔΕ'[i], x: 360 + i * 300, y: 380, size: 110, center: true }); kr(cue('op07').at(0.14 + i * 0.16), be('op07'), { text: w, x: 360 + i * 300, y: 530, size: 50, center: true, sub: true }); });
  gr(cue('a03').about('티마이오스') - 0.3, be('a03'), { text: 'ΤΙΜΑΙΟΣ', x: 420, y: 200, size: 80, center: true });
  gr(cue('a03').about('크리티아스') - 0.3, be('a03'), { text: 'ΚΡΙΤΙΑΣ', x: 1500, y: 200, size: 80, center: true });
  big(cue('a03').about('360') - 0.2, be('a03'), { text: '기원전 360년 무렵', x: 960, y: 820, size: 72, center: true });
  kr(b('a06') + 0.6, be('a06'), { text: '사이스 · 이집트', x: 1500, y: 160, size: 56 });
  big(cue('a09').about('9천') - 0.2, be('a09'), { text: '9,000년 전', x: 1420, y: 220, size: 150, center: true });
  ['사제', '솔론', '크리티아스', '플라톤'].forEach((w, i) => kr(cue('a10').at(0.08 + i * 0.16), be('a10'), { text: w + (i < 3 ? '  →' : ''), x: 220 + i * 420, y: 900, size: 54 }));
  gr(b('b02') + 0.6, be('b02'), { text: 'ΗΡΑΚΛΕΟΥΣ ΣΤΗΛΑΙ', x: 960, y: 160, size: 64, center: true });
  kr(b('b02') + 1.2, be('b02'), { text: '헤라클레스의 기둥 · 지금의 지브롤터 해협', x: 960, y: 260, size: 48, center: true, sub: true });
  kr(b('b03') + 1.0, be('b03'), { text: '리비아 + 아시아 보다 큰 섬', x: 960, y: 170, size: 64, center: true });
  const RINGLAB = ['물', '땅', '물', '땅', '물'].map((w, i) => [kr(cue('b05').at(0.15 + i * 0.12), be('b05'), { text: w, x: 960, y: 520, size: 46, center: true }), [3.0, 4.5, 6.5, 9.0, 12.0][i]]);   // placed on their rings every frame
  gr(cue('b06').about('아틀라스') - 0.2, be('b07'), { text: 'ΑΤΛΑΣ', x: 420, y: 200, size: 100, center: true });
  gr(cue('b07').about('아틀란티코스') - 0.2, be('b07'), { text: 'ΑΤΛΑΝΤΙΚΟΣ', x: 1500, y: 200, size: 72, center: true });
  ['놋쇠', '주석', '오레이칼코스'].forEach((w, i) => kr(cue('b10').about(w) - 0.2, be('b10'), { text: w, x: 960, y: 160 + i * 90, size: i === 2 ? 72 : 56, center: true }));
  gr(cue('b11').about('오레이칼코스') - 0.2, be('b11'), { text: 'ΟΡΕΙΧΑΛΚΟΣ', x: 960, y: 170, size: 96, center: true });
  big(cue('c03').about('9천') - 0.2, be('c03'), { text: '9,000년 전 아테네', x: 1420, y: 180, size: 84, center: true });
  kr(cue('c04q').at(0.3), be('c04q') + 0.6, { text: '하루낮과 하룻밤', x: 960, y: 170, size: 96, center: true });
  kr(b('c07') + 0.4, E('c07') + 1.0, { text: '"그리고 신들이 모이자, 이렇게 말했다 —"', x: 960, y: 820, size: 54, center: true });
  gr(E('c07') + 0.2, be('c09'), { text: 'Ἀλλ’ ἐπειδὴ συνήγειρεν, εἶπεν —', x: 960, y: 200, size: 52, center: true });
  big(cue('d04').about('1665') - 0.2, be('d04'), { text: '1665', x: 300, y: 820, size: 120 });
  big(cue('d05').about('1882') - 0.2, be('d05'), { text: '1882', x: 300, y: 820, size: 120 });
  ['대서양', '남극', '사하라', '카리브해'].forEach((w, i) => kr(cue('d09').about(w) - 0.2, be('d09'), { text: w + ' ×', x: 320 + i * 420, y: 820, size: 54, center: true }));
  gr(b('d11') + 0.4, cue('d13').about('지금의') - 0.2, { text: 'ΘΗΡΑ', x: 1500, y: 160, size: 100, center: true });
  big(cue('d12').about('17') - 0.2, be('d12'), { text: '기원전 17~16세기', x: 960, y: 820, size: 90, center: true });
  big(cue('d15').about('1939') - 0.2, be('d16'), { text: '1939 · 1967', x: 300, y: 820, size: 100 });
  gr(b('d20') + 0.4, be('d20'), { text: 'ΕΛΙΚΗ', x: 960, y: 160, size: 110, center: true });
  big(cue('d20').about('373') - 0.2, be('d20'), { text: '기원전 373년', x: 960, y: 820, size: 96, center: true });
  kr(b('e04') + 0.3, be('e05'), { text: '절제하는 작은 나라  ·  오만한 바다의 제국', x: 960, y: 140, size: 54, center: true });
  big(cue('e07').about('시칠리아') - 0.2, be('e07'), { text: '시칠리아 원정 · 기원전 415–413', x: 960, y: 160, size: 60, center: true });
  kr(b('e11') - 0.2, END + 1, { text: '큰 힘을 가진 나라가 절제를 잃으면, 그 나라는 어떻게 되는가.', x: 960, y: 470, size: 60, center: true });
  gr(E('e11') + 0.4, END + 1, { text: 'ΑΤΛΑΝΤΙΣ', x: 960, y: 620, size: 70, center: true });
  // the real documents
  doc(b('op04') + 0.6, be('op05'), 'plato', { x: 1180, y: 120, w: 420, rot: -1.5 });
  doc(b('b02') + 2.4, be('b02'), 'gibraltar', { x: 1220, y: 340, w: 560, rot: 1 });
  doc(cue('d04').about('지도') - 0.4, be('d04'), 'kircher', { x: 760, y: 90, w: 820, rot: -1 });
  doc(b('d05') + 0.4, be('d06q'), 'donnelly', { x: 1360, y: 110, w: 360, rot: 1.5 });
  doc(b('d07') + 0.2, be('d08'), 'donmap', { x: 860, y: 110, w: 760, rot: -1 });
  doc(cue('d13').about('지금의') - 0.3, be('d14'), 'santorini', { x: 1380, y: 80, w: 420, rot: 1.2 });
  doc(cue('d16').about('벽에는') - 0.4, E('d16') + 0.8, 'akrotiri', { x: 580, y: 110, w: 760, rot: -0.8 });
  doc(cue('d21').about('2000년대') - 0.4, be('d21'), 'helike', { x: 1180, y: 290, w: 600, rot: 1 });

  // ================================= transitions: the sea ripples across the frame =================================
  const rt = new T.WebGLRenderTarget(1920, 1080, { samples: 0 });
  const postU = { tSrc: { value: rt.texture }, uAmt: { value: 0 }, uTime: { value: 0 }, uDark: { value: 0 } };
  const post = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ uniforms: postU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tSrc; uniform float uAmt, uTime, uDark; varying vec2 vUv;
      void main(){ vec2 c = vUv - 0.5; float r = length(c * vec2(1.78, 1.0)); float w = sin(r * 38.0 - uTime * 9.0) * uAmt * 0.018 * smoothstep(0.0, 0.2, r);
        vec2 uv = vUv + normalize(c + 1e-5) * w + vec2(sin(vUv.y * 24.0 + uTime * 5.0), cos(vUv.x * 20.0 - uTime * 4.0)) * uAmt * 0.006;
        vec3 col = texture2D(tSrc, uv).rgb; col = mix(col, col * vec3(0.55, 0.8, 0.9), uAmt * 0.6); col *= 1.0 - uDark; gl_FragColor = vec4(col, 1.0); }` }));
  const postScene = new T.Scene(); postScene.add(post); const postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const RIPPLES = ['op04', 'a01', 'b01', 'b04', 'b05', 'b06', 'b08', 'b13', 'b15', 'c01', 'c03', 'c04', 'c06', 'd01', 'd10', 'd12', 'd14', 'd19', 'd21', 'd22', 'e01', 'e02', 'e06', 'e08', 'e09'].map(S);
  const CHAP = ['a01', 'b01', 'c01', 'd01', 'e01'].map(S);

  // ================================= grain =================================
  const gctx = $('grain').getContext('2d'); const gimg = gctx.createImageData(480, 270);
  const grain = (t) => { const r = rand(Math.floor(t * 24) * 7 + 3); for (let i = 0; i < gimg.data.length; i += 4) { const v = 110 + r() * 60; gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v; gimg.data[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); };
  const flashEl = $('flash');
  const FLASHES = []; for (const [a, b2] of [[S('c04'), E('c04q') + 1], [S('d19'), E('d20') + 1]]) { let x = a + 0.6, k = 0; while (x < b2) { FLASHES.push(x); x += 2.3 + 1.1 * Math.sin(k * 2.3 + 1); k++; } }   // sfx/make_sound.py puts the thunder on the same times

  // ================================= sound =================================
  const M = MEDIA.install(ctx);
  if (M.SRC.sfx) M.clip($('sfxbox'), 'sfx', { x: 0, y: 0, w: 4, h: 4, start: 0, dur: Math.min(M.SRC.sfx.dur, END), audio: true, vol: 0.8 });
  await Promise.all(imgWaits);
  prog(0.95);

  onFrame((t) => {
    const s = shotAt(t), k = clamp((t - s.a) / Math.max(0.5, shotEnd(s) - s.a), 0, 1);
    setMood(s.mood); place(s.mood === 'hall' ? 'hall' : s.mood === 'under' ? 'under' : 'sea');
    for (const o of [sea, surf]) o.material.uniforms.uTime.value = t;
    THERA.visible = t >= S('d10') - 0.8 && t < S('d19'); pillarsG.visible = s.from === 'b02';
    if (s.upd) s.upd(t);
    s.camf(k);
    if (s.from === 'b05') { cam.updateMatrixWorld(); for (const [d, r] of RINGLAB) { const v = new T.Vector3(r, 1.0, 0).project(cam); d.style.left = ((v.x * 0.5 + 0.5) * 1920).toFixed(1) + 'px'; d.style.top = ((-v.y * 0.5 + 0.5) * 1080 - 36).toFixed(1) + 'px'; } }
    if (s.mood === 'hall') { VASE.rotation.y = vaseRot(t); dust.rotation.y = t * 0.02; }
    // lightning
    let fl = 0; for (const f of FLASHES) { const u = t - f; if (u >= 0 && u < 0.35) fl = Math.max(fl, (u < 0.06 ? 1 : 0.6) * (1 - u / 0.35)); }
    sky.userData.u.uFlash.value = s.mood === 'storm' ? fl * 0.6 : 0; if (s.mood === 'storm') hemi.intensity = MOOD.storm.hemi[2] + fl * 3; flashEl.style.opacity = s.mood === 'storm' ? (fl * 0.35).toFixed(3) : '0';
    // the under-water light
    if (s.mood === 'under') { rays.forEach((m, i) => { m.material.opacity = 0.05 + 0.04 * Math.sin(t * 0.7 + i); m.position.x = U.x - 20 + i * 4.5 + Math.sin(t * 0.2 + i) * 1.5; }); motes.position.y = Math.sin(t * 0.2) * 0.3; }
    // the ripple transition around each place change, darker at chapter starts
    let amt = 0, dark = 0; for (const a of RIPPLES) { const u = t - a; if (u > -0.7 && u < 0.9) amt = Math.max(amt, 1 - Math.abs(u - 0.05) / 0.8); }
    for (const a of CHAP) { const u = t - a; if (u > -0.9 && u < 0.7) dark = Math.max(dark, 0.85 * (1 - Math.abs(u + 0.1) / 0.8)); }
    dark = Math.max(dark, K(t, E('c07') + 0.05, E('c07') + 0.4) * (1 - K(t, S('c08'), S('c08') + 0.6)) * 0.95);   // the text stops: the picture goes dark for the held silence
    dark = Math.max(dark, K(t, END - 1.4, END));
    s3d.fit();
    if (amt > 0.01 || dark > 0.01) { postU.uAmt.value = amt; postU.uDark.value = clamp(dark, 0, 1); postU.uTime.value = t; R.setRenderTarget(rt); R.render(sc, cam); R.setRenderTarget(null); R.render(postScene, postCam); }
    else R.render(sc, cam);
    grain(t);
  });
  prog(1);
});
