/*
 * acts.js — 2편 「남은 불」 (30–60 s) and 3편 「남은 꿈」 (60–90 s) of 「남은 길」, in the same painted world as 1편
 * (js/scenes.js builds the world and 1편; it calls ACTS.install(env) once and ACTS frame(t) for every t ≥ 30).
 *
 * 2편 — night: they reach a ruined watchtower; the knight leans his sword on the wall and sits down; the crow brings
 *        twigs twice; the knight leans close and the ember of his eye lights a small fire; on the wall, the firelight
 *        throws the shadow of the whole knight he once was; the crow nods off and nestles against him, and he covers
 *        it with his cape; a small fire under the stars, title 「남은 불」.
 * 3편 — the fire is dying; his eyes flare red and we fall into a dream: a battle in silhouette against a blood-red
 *        sky, clashes, being pushed back, the banner falling, a great blow that snaps his sword (the broken sword of
 *        1편), the fall, and a crow coming down through the smoke onto his chest — their first meeting. He wakes; a
 *        glowing tear runs down his cheekbone and hisses in the ash; the crow leans against his cheek. Dawn: he plants
 *        the broken sword in the ground and they walk toward the rising sun. Title 「남은 길」.
 * Every beat is in js/timeline.js (act2 / act3), shared with sfx/make_sound.py. Everything is a pure function of t.
 */
window.ACTS = {
  install(env) {
    const { T, KIT, sc, cam, look, sun, hemi, sky, hills, kn, cr, perch, eyeGlow, groove, puffs, motes, grass, rand, TL, R, outline } = env;
    const A2 = TL.act2, A3 = TL.act3, TAU = Math.PI * 2;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
    const io = (x) => x * x * (3 - 2 * x), lerp = (a, b, x) => a + (b - a) * x, out = (x) => 1 - Math.pow(1 - x, 3);
    const v3 = (x, y, z) => new T.Vector3(x, y, z), tmp = new T.Vector3(), tmp2 = new T.Vector3(), q = new T.Quaternion();
    const bump = (t, a, b) => Math.sin(Math.PI * K(t, a, b));           // 0 → 1 → 0 over [a, b]
    const noise = (t, s) => Math.sin(t * 7.3 + s) * 0.5 + Math.sin(t * 13.1 + s * 2.3) * 0.3 + Math.sin(t * 23.7 + s * 5.1) * 0.2;
    const noOut = (m) => { m.userData.outlineParameters = { visible: false }; return m; };
    const [CX, CZ] = A2.camp, [TX, TZ] = A2.tower, [FX, FZ] = A2.fire;
    const DX = 80;                    // where the dream is staged (far down the plain, out of sight of the camp)
    const DWX = 48.5;                 // where he plants the sword at dawn

    // =============================== the camp: tower, fire, wall shadow ===============================
    const camp = new T.Group(); sc.add(camp);
    const stone = KIT.tex(KIT.cv(512, 512, (x, w, h) => {
      x.fillStyle = '#5e5049'; x.fillRect(0, 0, w, h); const r = rand(71);
      let y = 0; while (y < h) { const rh = 18 + r() * 22; let xx = -r() * 40; while (xx < w) { const bw = 28 + r() * 46;
        x.fillStyle = ['#8a7668', '#78665a', '#93806f', '#6c5c52', '#857162'][Math.floor(r() * 5)];
        x.beginPath(); const j = () => (r() - 0.5) * 4; x.moveTo(xx + 2 + j(), y + 2 + j()); x.lineTo(xx + bw - 2 + j(), y + 2 + j()); x.lineTo(xx + bw - 2 + j(), y + rh - 2 + j()); x.lineTo(xx + 2 + j(), y + rh - 2 + j()); x.closePath(); x.fill();
        for (let k = 0; k < 3; k++) KIT.daub(x, xx + 4 + r() * (bw - 8), y + 3 + r() * (rh - 6), 5 + r() * 10, 1.5 + r() * 3, r() * 3, r() < 0.5 ? '#a8957f' : '#4a3d38', 0.3);
        xx += bw; } y += rh; }
      for (let i = 0; i < 260; i++) KIT.daub(x, r() * w, r() * h, 8 + r() * 30, 2 + r() * 6, r() * 3, r() < 0.5 ? '#3e322e' : '#9c8a78', 0.08);
    }), true, [9, 3]);
    const stoneM = KIT.toon(0xffffff, { map: stone, side: T.DoubleSide, noCache: true });
    // a round watchtower with a ragged, broken top: tall on the side that faces the camp, fallen at the back
    const tg = new T.CylinderGeometry(1.75, 1.95, 6.4, 44, 20, true);
    { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x);
        const front = 0.5 + 0.5 * Math.cos(a - Math.PI / 2), jag = 0.35 * Math.sin(a * 9.3) + 0.25 * Math.sin(a * 23.1 + 1.3) + 0.18 * Math.sign(Math.sin(a * 31.0));
        const top = -3.2 + 1.1 + 2.7 * Math.pow(front, 1.3) + jag; if (y > top) p.setY(i, top); } tg.computeVertexNormals(); }
    const tower = KIT.mesh(tg, stoneM); tower.position.set(TX, 3.2, TZ); camp.add(tower);
    const r3 = rand(73);
    for (let i = 0; i < 11; i++) { const a = 3.5 + r3() * 2.6, d = 2.1 + r3() * 1.4, b = KIT.mesh(new T.BoxGeometry(0.42, 0.26, 0.3), stoneM);
      b.position.set(TX + Math.cos(a) * d, 0.12, TZ + Math.sin(a) * d * 0.8); b.rotation.set(r3() * 0.4, r3() * 3, r3() * 0.3); camp.add(b); }
    // the fire: a ring of stones, ash, twigs, flames, embers, coals and its light
    const fire = new T.Group(); fire.position.set(FX, 0, FZ); camp.add(fire);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, s = KIT.rock(0.07 + (i % 3) * 0.02, '#7d6c62'); s.position.set(Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3); fire.add(s); }
    const ash = new T.Mesh(new T.CircleGeometry(0.34, 24), noOut(new T.MeshBasicMaterial({ color: 0x3c3434, transparent: true, opacity: 0.85, depthWrite: false })));
    ash.rotation.x = -Math.PI / 2; ash.position.y = 0.008; fire.add(ash);
    const twigM = KIT.toon(0x6b4a33);
    const TW = [[[-0.18, 0.03, -0.05], [0.16, 0.06, 0.07]], [[-0.1, 0.03, 0.15], [0.12, 0.07, -0.13]], [[0.15, 0.03, 0.12], [-0.08, 0.08, -0.12]], [[-0.17, 0.04, -0.12], [0.1, 0.09, 0.14]]];
    const twigs = TW.map(([a, b]) => { const o = KIT.rod(a, b, 0.012, twigM); fire.add(o); return o; });
    const flameTex = KIT.tex(KIT.cv(128, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.72, 4, w / 2, h * 0.62, h * 0.55);
      g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.25, 'rgba(255,214,120,0.95)'); g.addColorStop(0.55, 'rgba(255,120,40,0.6)'); g.addColorStop(1, 'rgba(255,60,20,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, 4); x.bezierCurveTo(w * 0.95, h * 0.45, w * 0.92, h * 0.98, w / 2, h * 0.98); x.bezierCurveTo(w * 0.08, h * 0.98, w * 0.05, h * 0.45, w / 2, 4); x.fill(); }), false);
    const flames = [0, 1, 2, 3, 4].map((i) => { const m = noOut(new T.SpriteMaterial({ map: flameTex, color: 0xffffff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
      const s = new T.Sprite(m); s.userData.ph = i * 1.7; s.userData.dx = [0, -0.07, 0.07, -0.03, 0.04][i]; fire.add(s); return s; });
    const coal = new T.Sprite(noOut(new T.SpriteMaterial({ map: KIT.glowTex, color: 0xff5a20, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }))); coal.position.y = 0.05; coal.scale.set(0.7, 0.3, 1); fire.add(coal);
    const EMB = 36, embGeo = new T.BufferGeometry(), embP = new Float32Array(EMB * 3); embGeo.setAttribute('position', new T.BufferAttribute(embP, 3));
    const embers = new T.Points(embGeo, noOut(new T.PointsMaterial({ map: KIT.glowTex, size: 0.035, color: 0xffa040, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })));
    embers.frustumCulled = false; fire.add(embers);
    const fireLight = new T.PointLight(0xff8a3c, 0, 9, 1.4); fireLight.position.set(FX, 0.45, FZ); camp.add(fireLight);
    // the spark of the eye that lights it
    const spark = new T.Sprite(noOut(new T.SpriteMaterial({ map: KIT.glowTex, color: 0xffb060, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }))); spark.scale.setScalar(0.09); sc.add(spark);
    // the shadow on the wall: not the knight that sits there now, but the whole knight he was
    const shadowCv = KIT.cv(512, 704, (x, w, h) => {
      x.filter = 'blur(5px)'; x.fillStyle = '#fff'; x.translate(w / 2, 0);
      x.beginPath(); x.ellipse(0, 128, 50, 58, 0, 0, TAU); x.fill();                                   // helmet
      x.beginPath(); x.moveTo(-20, 78); x.quadraticCurveTo(10, -8, 92, 40); x.quadraticCurveTo(40, 40, 18, 86); x.fill();   // plume
      x.fillRect(-58, 118, 116, 16);                                                                  // visor brim
      x.beginPath(); x.moveTo(-108, 214); x.quadraticCurveTo(-120, 180, -66, 172); x.lineTo(66, 172); x.quadraticCurveTo(120, 180, 108, 214);   // pauldrons
      x.lineTo(84, 400); x.lineTo(-84, 400); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-84, 380); x.lineTo(84, 380); x.lineTo(70, 470); x.lineTo(-70, 470); x.fill();                 // tassets
      x.fillRect(-64, 460, 46, 220); x.fillRect(18, 460, 46, 220);                                    // legs
      x.beginPath(); x.moveTo(-104, 214); x.quadraticCurveTo(-190, 420, -150, 650); x.lineTo(-96, 640); x.quadraticCurveTo(-120, 420, -70, 240); x.fill();   // cape
      x.save(); x.translate(104, 300); x.rotate(-0.42); x.fillRect(-14, -16, 28, 40); x.fillRect(-44, -26, 88, 14); x.fillRect(-9, -300, 18, 284); x.beginPath(); x.moveTo(-9, -300); x.lineTo(0, -330); x.lineTo(9, -300); x.fill(); x.restore();   // a whole sword, raised
      x.fillRect(64, 220, 40, 100);                                                                   // the arm that holds it
    });
    const shadowM = noOut(new T.MeshBasicMaterial({ map: KIT.tex(shadowCv, false), color: 0x05020a, transparent: true, depthWrite: false, opacity: 0 }));
    const sg = new T.PlaneGeometry(2.1, 2.9, 18, 12);
    { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); const r = 1.95 - 0.2 * (1.52 + p.getY(i)) / 6.4; p.setZ(i, Math.sqrt(Math.max(0, r * r - x * x)) + 0.035); } }   // follows the curve (and taper) of the wall
    const wallShadow = new T.Mesh(sg, shadowM); wallShadow.position.set(TX, 1.52, TZ); wallShadow.renderOrder = 3; camp.add(wallShadow);
    // a twig in the crow's beak
    const beakTwig = KIT.rod([0.05, -0.012, -0.07], [0.16, -0.01, 0.08], 0.008, twigM); cr.head.add(beakTwig); beakTwig.visible = false;
    // the tear
    const tearM = noOut(new T.MeshBasicMaterial({ color: 0xffe2b0 }));
    const tear = new T.Mesh(new T.SphereGeometry(0.016, 12, 10), tearM); tear.scale.set(1, 1.35, 1); sc.add(tear); tear.visible = false;
    const tearGlow = new T.Sprite(noOut(new T.SpriteMaterial({ map: KIT.glowTex, color: 0xffb070, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }))); tearGlow.scale.setScalar(0.085); sc.add(tearGlow);
    const steam = [0, 1, 2, 3, 4].map(() => { const s = new T.Sprite(noOut(new T.SpriteMaterial({ map: KIT.glowTex, color: 0xd8d0d0, transparent: true, depthWrite: false, opacity: 0 }))); sc.add(s); return s; });

    // =============================== the dream: a battle in silhouette ===============================
    const dream = new T.Group(); sc.add(dream);
    const darkM = KIT.toon(0x2a2024);
    function soldier(s, weapon, crest) {
      const g = new T.Group(), b = new T.Group(); g.add(b);
      b.add(KIT.bone([0, 0.0, 0], [0, 0.95, 0], 0.08, darkM));                                          // legs
      b.add(KIT.bone([0, 0.0, 0.12], [0, 0.95, 0.12], 0.08, darkM));
      const body = KIT.mesh(new T.CapsuleGeometry(0.2, 0.42, 4, 10), darkM); body.position.set(0, 1.28, 0.06); b.add(body);
      const head = KIT.mesh(new T.SphereGeometry(0.16, 12, 10), darkM); head.position.set(0, 1.78, 0.06); b.add(head);
      if (crest === 'horns') for (const sd of [-1, 1]) { const h = KIT.mesh(new T.ConeGeometry(0.045, 0.32, 8), darkM); h.position.set(0, 1.92, 0.06 + sd * 0.14); h.rotation.x = sd * 0.7; b.add(h); }
      else { const sp = KIT.mesh(new T.ConeGeometry(0.06, 0.26, 8), darkM); sp.position.set(0, 2.0, 0.06); b.add(sp); }
      const arm = new T.Group(); arm.position.set(0, 1.5, -0.2); b.add(arm); arm.add(KIT.bone([0, 0, 0], [0, -0.55, 0], 0.06, darkM));
      if (weapon === 'axe') { arm.add(KIT.rod([0, -0.5, 0], [0, 0.9, 0], 0.035, darkM)); const head2 = KIT.mesh(new T.BoxGeometry(0.42, 0.34, 0.05), darkM); head2.position.set(0.16, 0.78, 0); arm.add(head2); }
      else { arm.add(KIT.rod([0, -0.55, 0], [0, 1.6, 0], 0.025, darkM)); const tip = KIT.mesh(new T.ConeGeometry(0.05, 0.22, 6), darkM); tip.position.set(0, 1.7, 0); arm.add(tip); }
      const shield = KIT.mesh(new T.CylinderGeometry(0.2, 0.2, 0.04, 16), darkM); shield.rotation.x = Math.PI / 2; shield.position.set(0.1, 1.2, 0.3); b.add(shield);
      g.scale.setScalar(s); g.userData = { arm, b }; return g;
    }
    const enemies = [];
    const ER = rand(81);
    [[2.2, -1.6, 1.0, 'spear', 'spike'], [3.4, 1.4, 1.05, 'spear', 'horns'], [5.2, -2.8, 0.95, 'spear', 'spike'], [6.1, 0.6, 1.1, 'spear', 'horns'], [4.4, -0.2, 1.0, 'spear', 'spike'],
     [7.8, -1.4, 1.0, 'spear', 'horns'], [9.0, 2.0, 0.95, 'spear', 'spike'], [8.4, 3.6, 1.0, 'spear', 'spike'], [11.0, -0.8, 1.05, 'spear', 'horns']].forEach(([x, z, s, w, c]) => {
      const e = soldier(s, w, c); e.position.set(DX + x, 0, z); e.rotation.y = Math.PI + (ER() - 0.5) * 0.5; dream.add(e); enemies.push(e); });
    const foe = soldier(1.05, 'spear', 'horns'); dream.add(foe);               // the one he fights
    const brute = soldier(1.38, 'axe', 'horns'); dream.add(brute);             // the one who breaks his sword
    const allies = [];
    [[-2.6, 1.8], [-3.6, -1.8], [-5.4, 0.6]].forEach(([x, z]) => { const e = soldier(1.0, 'spear', 'spike'); e.position.set(DX + x, 0, z); e.rotation.y = (ER() - 0.5) * 0.4; dream.add(e); allies.push(e); });
    const banner = new T.Group(); banner.position.set(DX - 1.1, 0, -0.9); dream.add(banner);
    banner.add(KIT.rod([0, 0, 0], [0, 2.9, 0], 0.03, darkM));
    const bannerCloth = KIT.cloth(0.7, 1.05, 7, 10, '#4b5f80', 919); bannerCloth.position.set(0.03, 2.85, 0); bannerCloth.rotation.y = Math.PI / 2; banner.add(bannerCloth);
    for (let i = 0; i < 14; i++) { const x = DX - 8 + ER() * 22, z = (ER() < 0.5 ? -1 : 1) * (2 + ER() * 8); const sp = KIT.spear(1.4 + ER()); sp.position.set(x, -0.2, z); sp.rotation.set(0, ER() * 3, (ER() - 0.5) * 0.8); dream.add(sp); }
    // the whole sword he had then: the broken sword of 1편 plus the tip that the blow sends flying
    const dSword = new T.Group(); kn.root.add(dSword); dSword.visible = false;
    const dBase = KIT.sword(1.0, true); dSword.add(dBase);
    const BL = dBase.userData.len || 0.62;
    const dTip = KIT.mesh(new T.BoxGeometry(0.028, 0.42, 0.007), KIT.steel); dTip.position.y = -(BL + 0.21); dSword.add(dTip);
    const flyTip = KIT.mesh(new T.BoxGeometry(0.028, 0.42, 0.007), KIT.steel); sc.add(flyTip); flyTip.visible = false;
    // sparks of the clashes and the smoke of the battlefield
    const sparks = [...Array(16)].map(() => { const s = new T.Sprite(noOut(new T.SpriteMaterial({ map: KIT.glowTex, color: 0xffd080, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }))); s.userData.keep = true; sc.add(s); return s; });
    const smoke = [...Array(10)].map(() => { const s = new T.Sprite(noOut(new T.SpriteMaterial({ map: KIT.glowTex, color: 0x2a0c0c, transparent: true, depthWrite: false, opacity: 0 }))); s.userData.keep = true; dream.add(s); return s; });
    const dreamSky = KIT.tex(KIT.cv(64, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#16040a'); g.addColorStop(0.42, '#5a0f14'); g.addColorStop(0.62, '#b23a22'); g.addColorStop(0.7, '#e2703a'); g.addColorStop(0.78, '#7a1c18'); g.addColorStop(1, '#1a0508');
      x.fillStyle = g; x.fillRect(0, 0, w, h); }));
    // dream look: every surface becomes a dark silhouette against the red sky (alpha cut-outs kept), fog in deep red
    const silMats = new Map(), swapped = [];
    const silOf = (m) => { if (silMats.has(m)) return silMats.get(m);
      const keepMap = (m.transparent || m.alphaTest) && m.map && !m.alphaMap;
      const s = noOut(new T.MeshBasicMaterial({ color: 0x170507, map: keepMap ? m.map : null, alphaMap: m.alphaMap || null, alphaTest: m.alphaTest || 0, transparent: !!m.transparent, side: m.side, fog: true, depthWrite: m.depthWrite }));
      silMats.set(m, s); return s; };
    let swappedOn = null;
    function dreamLook(on) {
      if (on === swappedOn) return; swappedOn = on;
      if (!swapped.length) sc.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && o !== sky && !o.userData.keep && !(o.material && o.material.blending === T.AdditiveBlending)) swapped.push([o, o.material]); });
      hills.children.forEach((h, i) => { if (!h.userData.orig) h.userData.orig = h.material; });
      for (const [o, m] of swapped) o.material = on ? silOf(m) : m;
      hills.children.forEach((h, i) => { h.material = on ? (h.userData.dm || (h.userData.dm = noOut(new T.MeshBasicMaterial({ map: h.userData.orig.map, color: [0xc44a3a, 0x7a2224, 0x3a0c12][i], transparent: true, side: T.BackSide, depthWrite: false, fog: false })))) : h.userData.orig; });
      sky.visible = !on; sc.background = on ? dreamSky : null;
    }

    // =============================== the knight's poses ===============================
    const [L, Rg] = kn.legs, [aL, aR] = kn.arms;
    function stand() {
      kn.hips.position.set(0, 0.98, 0); kn.hips.rotation.set(0, 0, 0);
      for (const lg of kn.legs) { lg.hipP.rotation.set(0, 0, 0); lg.knee.rotation.set(0, 0, 0); lg.foot.rotation.set(0, 0, 0); }
      kn.torso.rotation.set(0, 0, -0.28); aL.sh.rotation.set(0.1, 0, 0.05); aL.el.rotation.set(0, 0, 0.25); aR.sh.rotation.set(-0.16, 0, 0.12); aR.el.rotation.set(0, 0, 0.12);
      kn.neck.rotation.set(0, 0, -0.22); kn.head.rotation.set(0, 0, -0.05); kn.root.rotation.set(0, 0, 0);
    }
    function gait(p, a) {
      const w = TAU * p;
      kn.hips.position.y = 0.98 - a * 0.045 * Math.abs(Math.sin(w)) - a * 0.02 * Math.max(0, Math.sin(w + Math.PI));
      kn.hips.rotation.set(a * 0.035 * Math.sin(w), a * 0.06 * Math.sin(w), 0);
      L.hipP.rotation.z = a * 0.42 * Math.sin(w); L.knee.rotation.z = -a * 0.75 * Math.pow(Math.max(0, Math.cos(w)), 1.5);
      Rg.hipP.rotation.z = a * 0.32 * Math.sin(w + Math.PI); Rg.knee.rotation.z = -a * 0.45 * Math.pow(Math.max(0, Math.cos(w + Math.PI)), 1.5);
      L.foot.rotation.z = -L.knee.rotation.z * 0.3 - L.hipP.rotation.z * 0.6; Rg.foot.rotation.z = -Rg.knee.rotation.z * 0.3 - Rg.hipP.rotation.z * 0.6;
      kn.torso.rotation.z = -0.3 + a * 0.025 * Math.sin(2 * w); aL.sh.rotation.z = -a * 0.28 * Math.sin(w) + 0.05; aR.sh.rotation.z = 0.12 + a * 0.05 * Math.sin(w + Math.PI);
      kn.head.rotation.z = -0.05 + a * 0.03 * Math.sin(2 * w + 0.6);
    }
    /** sitting on the ground against the wall: s 0..1, with a heavy drop ("털썩") on the way down */
    function sit(s) {
      const drop = s < 1 ? 0.05 * Math.sin(Math.PI * clamp((s - 0.75) / 0.25, 0, 1)) : 0;
      kn.hips.position.y = lerp(0.98, 0.21, s) - drop;
      for (const [lg, sd] of [[L, 1], [Rg, -1]]) { lg.hipP.rotation.set(sd * 0.16 * s, 0, lerp(lg.hipP.rotation.z, 1.75, s)); lg.knee.rotation.z = lerp(lg.knee.rotation.z, -2.15, s); lg.foot.rotation.z = lerp(lg.foot.rotation.z, 0.42, s); }
      kn.torso.rotation.z = lerp(kn.torso.rotation.z, 0.06, s);
      aL.sh.rotation.set(0.1, 0, lerp(aL.sh.rotation.z, 0.95, s)); aL.el.rotation.z = lerp(0.25, -0.95, s);
      aR.sh.rotation.set(-0.16, 0, lerp(aR.sh.rotation.z, 0.95, s)); aR.el.rotation.z = lerp(0.12, -0.95, s);
    }
    function ember(g, warm = 0) { kn.ember.color.setRGB(1, 0.5 + 0.25 * g + 0.15 * warm, 0.22 + 0.18 * g); kn.root.userData.glow = g; }
    function cape(fn) { kn.cape.userData.drape(fn); }
    const capeHang = (t, wind = 1) => (u, v, o) => { o[0] = u * 0.6 * (0.62 + 0.38 * Math.sqrt(v)); o[1] = -v; o[2] = 0.16 * (1 - v) * Math.pow(u * 2, 2) - (0.03 + 0.07 * v) + wind * (0.05 * v * Math.sin(5.5 * v - 3.1 * t + u * 3)); o[0] += wind * 0.04 * v * Math.sin(4 * v - 2.3 * t + u * 5); };
    /** sitting: the cape lies on the ground behind; cover 0..1 brings its lower part forward over the lap */
    const capeSit = (t, cover) => (u, v, o) => { const lie = clamp((v - 0.45) / 0.55, 0, 1);
      o[0] = u * 0.6 * (0.62 + 0.38 * Math.sqrt(v)); o[1] = -Math.min(v, 0.5) - 0.12 * lie; o[2] = 0.16 * (1 - v) * Math.pow(u * 2, 2) - 0.05 - 0.4 * lie;
      const c = cover * io(clamp((v - 0.35) / 0.65, 0, 1)) * (0.4 + 0.6 * u);
      o[1] = lerp(o[1], -0.38 + 0.06 * Math.sin(v * 3), c); o[2] = lerp(o[2], 0.18 + 0.42 * v, c); o[0] = lerp(o[0], o[0] + 0.12, c);
      o[2] += 0.006 * Math.sin(t * 1.3 + u * 4); };
    // the sword: in the hand (root space, like 1편), leaning on the wall, planted in the ground (world space)
    function swordInHand(theta, sw = kn.sword) {
      if (sw.parent !== kn.root) kn.root.add(sw);
      kn.root.updateMatrixWorld(true); const hand = aR.hand.getWorldPosition(tmp); kn.root.worldToLocal(hand);
      sw.position.set(hand.x + Math.sin(theta) * 0.0, hand.y, hand.z + 0.02); sw.rotation.set(-0.05, 0, theta);
    }
    function swordDrag() {
      if (kn.sword.parent !== kn.root) kn.root.add(kn.sword);
      kn.root.updateMatrixWorld(true); const hand = aR.hand.getWorldPosition(tmp); kn.root.worldToLocal(hand);
      const len = kn.sword.userData.len + 0.09, phi = Math.acos(clamp((hand.y - 0.015) / len, -1, 1));
      kn.sword.position.set(hand.x - Math.sin(phi) * 0.09, hand.y - Math.cos(phi) * 0.09, hand.z + 0.02); kn.sword.rotation.set(-0.05, 0, -phi);
    }
    function swordWorld(pos, rx, ry, rz) { if (kn.sword.parent !== sc) sc.add(kn.sword); kn.sword.position.copy(pos); kn.sword.rotation.set(rx, ry, rz); }
    const WALL_SWORD = v3(CX - 0.95, 1.0, TZ + 1.7);   // leaning against the wall, hilt up, to his right
    const PLANTED = v3(DWX + 0.55, 0.62, 0.18);

    // =============================== the crow's poses ===============================
    const [cL, cRw] = cr.wings;
    function crowWings(spread, flap) {
      cRw.rotation.set(-0.95 * flap * spread - (1 - spread) * 1.4, lerp(-1.42, 0, spread), 0); cL.rotation.set(0.95 * flap * spread + (1 - spread) * 1.4, lerp(1.42, 0, spread), 0);
      const fs = lerp(0.6, 1, spread); cRw.scale.setScalar(fs); cL.scale.setScalar(fs);
    }
    function crowReset() { cr.body.position.set(0, 0.12, 0); cr.body.rotation.set(0, 0, 0); cr.head.rotation.set(0, 0, 0); cr.up.rotation.z = 0; cr.lo.rotation.z = 0; cr.tail.rotation.z = 0; cr.root.rotation.set(0, 0, 0); cr.root.visible = true; }
    function onShoulder() { kn.root.updateMatrixWorld(true); const p = perch.getWorldPosition(tmp2); perch.getWorldQuaternion(q); cr.root.position.copy(p); cr.root.quaternion.copy(q); cr.root.rotateZ(0.3); }
    function caw(t, list) { let k = 0; for (const [ct, lv] of list) k = Math.max(k, K(t, ct - 0.12, ct) * (1 - K(t, ct + 0.32, ct + 0.5)) * (0.6 + 0.4 * lv)); cr.head.rotation.z += 0.3 * k; cr.up.rotation.z = 0.12 * k; cr.lo.rotation.z = -0.5 * k; }
    function flyTo(a, b, k, lift, yawExtra = 0) { const p = new T.Vector3().lerpVectors(a, b, k); p.y += lift * Math.sin(Math.PI * k); cr.root.position.copy(p);
      tmp.copy(b).sub(a); cr.root.rotation.set(0, Math.atan2(-tmp.z, tmp.x) + yawExtra, 0); }
    const CROW_SPOT = v3(CX + 0.62, 0, CZ + 0.55), PILE = v3(FX + 0.34, 0, FZ - 0.08), LAP = v3(CX + 0.2, 0.33, CZ + 0.28), OUT = v3(CX + 4.6, 2.6, CZ + 3.0);

    // =============================== the cameras ===============================
    const SH = TL.shots;
    const shotAt = (t) => { let i = 7; while (i + 1 < SH.length - 1 && t >= SH[i + 1]) i++; return i; };
    function shake(t, amp) { cam.position.x += amp * noise(t * 1.3, 1); cam.position.y += amp * noise(t * 1.1, 4); look.x += amp * 0.6 * noise(t, 7); }
    function camAct(t, i) {
      const e = io(K(t, SH[i], SH[i + 1]));
      switch (i) {
        case 7: cam.position.set(36.6 + 0.6 * e, 1.0, 6.6 - 0.4 * e); look.set(44.0, 2.0, -3.2); return [42, -1, 12];
        case 8: cam.position.set(CX + 0.75, 1.25, CZ + 3.9 - 0.3 * e); look.set(CX - 0.1, 0.8, CZ - 0.1); return [CX, CZ, 5];
        case 9: cam.position.set(CX + 3.3, 1.55, CZ + 3.9); look.set(CX + 0.7, 0.55, CZ + 0.6); return [CX + 1, CZ + 0.6, 6];
        case 10: cam.position.set(CX + 1.7 - 0.15 * e, 0.7, CZ + 2.1 - 0.1 * e); look.set(CX + 0.05, 0.6, CZ + 0.42); return [CX, CZ, 4];
        case 11: cam.position.set(CX + 0.2, 1.0 + 0.1 * e, CZ + 4.9 - 0.7 * e); look.set(CX, 1.45, CZ - 0.3); return [CX, CZ, 6];
        case 12: cam.position.set(CX + 2.05 - 0.15 * e, 0.95, CZ + 1.55 - 0.1 * e); look.set(CX + 0.1, 0.7, CZ + 0.2); return [CX, CZ, 4];
        case 13: cam.position.set(33.5 - 1.2 * e, 2.6 + 0.6 * e, 12.5 + 1.0 * e); look.set(44.0, 2.4 + 0.8 * e, -3.0); return [42, -1, 14];
        case 14: cam.position.set(CX + 0.95, 0.78, CZ + 1.6 - 0.25 * e); look.set(CX + 0.02, 0.62, CZ + 0.05); return [CX, CZ, 4];
        case 15: { cam.position.set(DX - 0.6 + 0.6 * e, 0.55, 5.2); look.set(DX + 1.4, 1.35, -0.2); shake(t, 0.03); return [DX + 1, 0, 9]; }
        case 16: { if (t < 69.3) { cam.position.set(DX + 2.2, 1.25, 1.9); look.set(DX + 0.6, 1.45, 0); shake(t, 0.05); }
                   else if (t < 70.6) { cam.position.set(DX - 3.6, 0.75, 4.6); look.set(DX + 1.0, 1.3, 0); shake(t, 0.04); }
                   else { cam.position.set(DX - 2.6, 0.38, 2.4); look.set(DX - 1.2, 1.8, -0.9); shake(t, 0.03); } return [DX, 0, 8]; }
        case 17: { cam.position.set(DX + 2.0 - 0.3 * e, 0.85, 3.2); look.set(DX + 0.4, 1.35 - 0.3 * K(t, 73.8, 75.2), 0); shake(t, t < 74 ? 0.06 : 0.02); return [DX, 0, 8]; }
        case 18: cam.position.set(DX - 2.3 + 0.1 * e, 0.28, 2.55 - 0.15 * e); look.set(DX - 2.45, 0.5, 0); return [DX - 1, 0, 6];
        case 19: { const push = io(K(t, 80.2, 82.0)); kn.root.updateMatrixWorld(true); const hp = kn.head.getWorldPosition(new T.Vector3());
          cam.position.set(hp.x + lerp(0.8, 0.52, push), hp.y - 0.2, hp.z + lerp(1.75, 1.2, push)); look.set(hp.x + 0.03, hp.y - 0.08, hp.z); return [CX, CZ, 4]; }
        default: { cam.position.set(DWX - 3.8 + 0.6 * e, 1.25 + 0.3 * e, 2.6); look.set(DWX + 6, 1.4 + 0.3 * e, -2.2); return [DWX + 2, 0, 12]; }
      }
    }

    // =============================== light and colour of each part ===============================
    const gradeEl = env.grade, tintEl = env.tint, grainEl = env.grainEl;
    const fogC = new T.Color(), c1 = new T.Color(), c2 = new T.Color();
    const hillsBase = hills.children.map((h) => h.material.color.clone());
    function light(mode, t, night, dawn) {
      const u = sky.userData.u; u.uNight.value = night; u.uDawn.value = dawn; u.uDusk.value = 0.8; u.uDrift.value = t * 0.0012;
      if (mode === 'dream') return;
      // the moon (night) or the low sun of the dawn; the sky light; fog; the hills darken; the grass stops glowing
      const moon = v3(-0.35, 0.78, 0.52).normalize(), dawnSun = v3(0.88, 0.07, -0.47).normalize(), duskSun = v3(0.45, 0.04, -0.89).normalize();
      const sd = dawn > 0 ? new T.Vector3().lerpVectors(moon, dawnSun, dawn).normalize() : new T.Vector3().lerpVectors(duskSun, moon, night).normalize();
      u.sunDir.value.copy(dawn > 0 ? dawnSun : duskSun);
      sun.position.copy(sun.target.position).addScaledVector(sd, 60);
      sun.color.setRGB(lerp(lerp(1, 0.55, night), 1, dawn), lerp(lerp(0.6, 0.64, night), 0.84, dawn), lerp(lerp(0.36, 0.95, night), 0.66, dawn));
      sun.intensity = lerp(lerp(1.3, 0.42, night), 2.3, dawn);
      hemi.color.setRGB(lerp(lerp(0.6, 0.18, night), 0.62, dawn), lerp(lerp(0.5, 0.22, night), 0.68, dawn), lerp(lerp(0.8, 0.42, night), 0.84, dawn));
      hemi.groundColor.setRGB(lerp(lerp(0.43, 0.08, night), 0.42, dawn), lerp(lerp(0.3, 0.06, night), 0.34, dawn), lerp(lerp(0.25, 0.08, night), 0.3, dawn));
      hemi.intensity = lerp(lerp(0.7, 0.62, night), 0.95, dawn);
      fogC.setRGB(lerp(lerp(0.9, 0.11, night), 0.9, dawn), lerp(lerp(0.64, 0.105, night), 0.78, dawn), lerp(lerp(0.49, 0.2, night), 0.72, dawn)); sc.fog.color.copy(fogC); sc.fog.near = lerp(34, 16, night); sc.fog.far = lerp(210, 120, night);
      hills.children.forEach((h, i) => { h.material.color.copy(hillsBase[i]).multiplyScalar(lerp(1, 0.3, night * (1 - dawn))).lerp(c1.setRGB(0.75, 0.8, 0.95), dawn * 0.25); });
      for (const g of grass) g.material.emissive.setRGB(lerp(0.35, 0.03, night), lerp(0.24, 0.025, night), lerp(0.14, 0.03, night));
    }
    const GRADE = { dusk: '', night: 'linear-gradient(180deg, rgba(90,110,190,0.55) 0%, rgba(70,60,140,0.25) 45%, rgba(20,20,60,0.55) 100%)',
      dream: 'linear-gradient(180deg, rgba(120,10,20,0.5) 0%, rgba(255,80,40,0.25) 55%, rgba(60,0,10,0.6) 100%)',
      dawn: 'linear-gradient(180deg, rgba(150,180,240,0.4) 0%, rgba(255,220,170,0.25) 55%, rgba(255,190,140,0.45) 100%)' };
    let gradeKey = '';
    function grade(key) { if (key === gradeKey) return; gradeKey = key; gradeEl.style.background = GRADE[key] || ''; grainEl.style.opacity = key === 'dream' ? '0.2' : ''; }

    // =============================== one frame of 2편 / 3편 ===============================
    let shown = null;
    function frame(t, tq, tc) {
      const i = shotAt(tq), inDream = tq >= A3.dream[0] && tq < A3.dream[1], act2 = tq < 60;
      if (shown !== true) { shown = true; groove.visible = false; motes.visible = false; puffs.forEach((p) => { p.visible = false; }); }
      camp.visible = !inDream; dream.visible = inDream; dreamLook(inDream);
      for (const s of sparks) s.material.opacity = 0;
      dSword.visible = false; flyTip.visible = false; kn.sword.visible = true; beakTwig.visible = false; tear.visible = false; tearGlow.material.opacity = 0; spark.material.opacity = 0;
      steam.forEach((s) => { s.material.opacity = 0; });
      crowReset(); stand(); kn.ember.visible = true;

      // ---------------------------------------------------------------- 2편 「남은 불」
      if (act2) {
        light('night', tq, io(K(tq, 30, 33.5)), 0); grade('night');
        const walkEnd = A2.walk[1], vx = 0.85, x0 = A2.walkFrom;
        if (tc < walkEnd) {                                                    // walking to the tower, the crow on his shoulder
          const d = Math.min(CX - x0, vx * (tc - 30)); kn.root.position.set(x0 + d, 0, 0); gait(d / TL.stride, 1); swordDrag(); ember(0.45);
          cape(capeHang(tc)); onShoulder();
        } else {
          const k = io(K(tc, walkEnd, A2.swordDown[1])), s = io(K(tc, A2.sit[0], A2.sit[1]));
          kn.root.position.set(CX, 0, lerp(0, CZ, k)); kn.root.rotation.y = -Math.PI / 2 * k;
          sit(s);
          // lean close to the twigs and breathe the ember into them
          const lean = io(K(tc, A2.lean[0], A2.lean[1])) * (1 - io(K(tc, A2.unlean[0], A2.unlean[1])));
          kn.torso.rotation.z += -0.55 * lean; kn.neck.rotation.z += -0.35 * lean - 0.15 * s;
          // nodding off with the crow, then the arm comes over it
          const cover = io(K(tc, A2.cover[0], A2.cover[1]));
          aL.sh.rotation.z = lerp(aL.sh.rotation.z, 1.25, cover); aL.sh.rotation.x = lerp(0.1, -0.45, cover); aL.el.rotation.z = lerp(aL.el.rotation.z, -1.35, cover);
          kn.head.rotation.y = 0.35 * io(K(tc, 52.0, 53.0)) * (1 - cover * 0.4); kn.neck.rotation.z += -0.12 * cover;
          cape(capeSit(tc, cover));
          // the sword: from the hand to the wall
          const sk = io(K(tc, A2.swordDown[0], A2.swordDown[1]));
          if (sk <= 0) swordDrag(); else { swordDrag(); kn.sword.updateMatrixWorld(true); const from = kn.sword.getWorldPosition(new T.Vector3()); swordWorld(new T.Vector3().lerpVectors(from, WALL_SWORD, sk), 0.0, -Math.PI / 2 * sk, lerp(kn.sword.rotation.z, 0.18, sk)); }
          ember(0.4 + 0.6 * bump(tc, A2.ember[0] - 0.4, A2.ember[1] + 0.3) + 0.05 * Math.sin(tc * 3));
          // the crow: down from the shoulder, two trips for twigs, watching the fire, nodding off, nestling in
          if (tc < A2.crowDown[0]) onShoulder();
          else if (tc < A2.crowDown[1]) { kn.root.updateMatrixWorld(true); const from = perch.getWorldPosition(new T.Vector3()); const k2 = io(K(tc, A2.crowDown[0], A2.crowDown[1])); flyTo(from, CROW_SPOT, k2, 0.35); crowWings(1, Math.sin(tc * TAU * 4)); }
          else {
            let placed = false;
            for (const [a, b] of A2.trips) {
              if (tc >= a && tc < b) { placed = true;
                if (tc < a + 0.6) { flyTo(CROW_SPOT, OUT, io(K(tc, a, a + 0.6)), 0.4); crowWings(1, Math.sin(tc * TAU * 3.6)); }
                else if (tc < b - 0.95) { cr.root.position.copy(OUT); cr.root.visible = false; }
                else if (tc < b - 0.4) { flyTo(OUT, PILE, io(K(tc, b - 0.95, b - 0.4)), 0.3, Math.PI * 0); crowWings(1, Math.sin(tc * TAU * 3.2)); beakTwig.visible = true; }
                else { flyTo(PILE, CROW_SPOT, io(K(tc, b - 0.25, b)), 0.12); crowWings(K(tc, b - 0.4, b - 0.1) < 1 ? 0.6 : 0, Math.sin(tc * TAU * 4)); beakTwig.visible = tc < b - 0.3; }
              }
            }
            if (!placed) {
              if (tc < A2.nestle[0]) { cr.root.position.copy(CROW_SPOT); cr.root.rotation.y = 2.4; cr.head.rotation.y = 0.5 * Math.sin(tc * 0.6);
                const nod = K(tc, A2.nod[0], A2.nod[1]); cr.head.rotation.z = -0.55 * nod * (0.5 + 0.5 * Math.sin(tc * 5)) * (tc > A2.nod[0] ? 1 : 0); }
              else { const k3 = io(K(tc, A2.nestle[0], A2.nestle[1])); const p = new T.Vector3().lerpVectors(CROW_SPOT, LAP, k3); p.y += 0.18 * Math.sin(Math.PI * k3); cr.root.position.copy(p); cr.root.rotation.y = lerp(2.4, 3.3, k3);
                cr.body.rotation.x = 0; cr.head.rotation.z = -0.5 * k3; cr.body.position.y = 0.12 - 0.03 * k3; crowWings(k3 < 1 && k3 > 0 ? 0.5 : 0, Math.sin(tc * TAU * 4)); }
            }
          }
          caw(tc, A2.caws);
        }
        // the fire: twigs (two more each time the crow comes back), the eye's spark, the blaze, the flicker
        const nTw = 2 + (tc >= A2.trips[0][1] - 0.4 ? 1 : 0) + (tc >= A2.trips[1][1] - 0.4 ? 1 : 0); twigs.forEach((o, n) => { o.visible = n < nTw; });
        if (tq >= A2.ember[0] && tq < A2.ignite) { kn.root.updateMatrixWorld(true); const eye = kn.eyes[0].getWorldPosition(new T.Vector3()); const kk = io(K(tq, A2.ember[0], A2.ignite)); spark.position.lerpVectors(eye, v3(FX, 0.08, FZ), kk); spark.material.opacity = 0.9; spark.scale.setScalar(0.06 + 0.05 * Math.sin(tq * 30)); }
        const blaze = io(K(tq, A2.blaze[0], A2.blaze[1])) * (1 - 0.15 * K(tq, 56, 60));
        fireFrame(tq, blaze);
        wallShadow.material.opacity = 0.88 * blaze * (0.85 + 0.15 * noise(tq * 0.8, 3)); wallShadow.scale.set(1 + 0.03 * noise(tq, 9), 1 + 0.04 * noise(tq, 5), 1);
      }
      // ---------------------------------------------------------------- 3편 「남은 꿈」
      else if (!inDream) {
        const waking = tq >= A3.wake;
        const dawnK = tq >= SH[20] ? 1 : waking ? 0.3 * K(tq, A3.wake, SH[20]) : 0;
        light('night', tq, tq >= SH[20] ? 0 : waking ? lerp(1, 0.55, K(tq, A3.wake, SH[20])) : 1, dawnK); grade(tq >= SH[20] ? 'dawn' : 'night');
        if (tq < SH[20]) {
          // at the camp: asleep by the dying fire / waking from the dream
          kn.root.position.set(CX, 0, CZ); kn.root.rotation.y = -Math.PI / 2; sit(1); cape(capeSit(tc, 1 - io(K(tc, A3.wake, A3.wake + 0.6))));
          swordWorld(WALL_SWORD, 0, -Math.PI / 2, 0.18);
          if (!waking) { kn.neck.rotation.z += -0.45; kn.head.rotation.z = -0.15; aL.sh.rotation.z = 1.25; aL.sh.rotation.x = -0.45; aL.el.rotation.z = -1.35;
            const fl = io(K(tq, A3.flare[0], A3.flare[1])); ember(0.3 + 0.25 * Math.abs(Math.sin(tq * 2.3)) + 0.9 * fl, -fl);
            cr.root.position.copy(LAP); cr.root.rotation.y = 3.3; cr.head.rotation.z = -0.5; cr.body.position.y = 0.09;
          } else {
            const jerk = K(tc, A3.wake, A3.wake + 0.35), settle = io(K(tc, A3.wake + 0.6, A3.tear[0])), lean = io(K(tc, A3.tear[0] - 0.6, A3.tear[0] + 0.4));
            kn.neck.rotation.z += lerp(-0.45, 0.1, out(jerk)) - 0.15 * settle - 0.18 * lean; kn.torso.rotation.z += -0.12 * jerk - 0.25 * lean;
            kn.head.rotation.z = 0.05 * Math.sin(Math.PI * jerk); ember(1.2 - 0.6 * K(tq, A3.wake, A3.wake + 1.5));
            // the crow startles from his lap to his shoulder, then leans its head on his cheek
            const sk = io(K(tc, A3.startle[0], A3.startle[1]));
            if (sk < 1) { kn.root.updateMatrixWorld(true); const to = perch.getWorldPosition(new T.Vector3()); flyTo(LAP, to, sk, 0.45); crowWings(1, Math.sin(tc * TAU * 5)); }
            else { onShoulder(); const nz = io(K(tc, A3.nuzzle[0], A3.nuzzle[0] + 0.5)); cr.head.rotation.y = 1.15 * nz; cr.root.rotateY(0.25 * nz); cr.body.position.z = -0.05 * nz; cr.body.rotation.x = 0.25 * nz; }
            // the tear: it gathers in the eye, runs down the cheekbone, falls into the ash and hisses
            kn.root.updateMatrixWorld(true);
            const tk = K(tq, A3.tear[0], A3.tear[1]);
            if (tq >= A3.tear[0] && tq < A3.drop + 0.6) {
              const H = kn.head; let p;
              if (tq < A3.tear[1]) { const a = io(Math.min(1, tk * 1.6)), b = io(clamp((tk - 0.35) / 0.65, 0, 1));
                p = H.localToWorld(v3(0.128 + 0.008 * a, lerp(0.0, -0.05, a) + lerp(0, -0.065, b), lerp(-0.05, -0.062, a) + lerp(0, -0.01, b))); }
              else { const p0 = H.localToWorld(v3(0.136, -0.115, -0.072)), f = K(tq, A3.tear[1], A3.drop); p = p0.clone(); p.y = lerp(p0.y, 0.02, f * f); }
              if (tq < A3.drop) { tear.visible = true; tear.position.copy(p); tear.scale.setScalar(lerp(0.4, 1, Math.min(1, tk * 3))); tearGlow.position.copy(p).lerp(cam.position, 0.02); tearGlow.material.opacity = 0.85; }
              else { // the hiss: a little steam where it fell
                const age = tq - A3.drop; steam.forEach((s, n) => { s.position.set(p.x + (n - 2) * 0.02, 0.04 + age * (0.25 + 0.05 * n), p.z + 0.01 * n); s.scale.setScalar(0.04 + age * 0.18); s.material.opacity = 0.5 * (1 - age / 0.6); }); }
            }
          }
          const fireLeft = waking ? 0 : 0.18 * (1 - K(tq, 60, 63));
          fireFrame(tq, fireLeft, true); twigs.forEach((o) => { o.visible = true; o.scale.setScalar(0.9); });
          wallShadow.material.opacity = 0;
        } else {
          // dawn: he stands on the rise, plants the broken sword in the ground, and they walk toward the sun
          fireFrame(tq, 0, true); wallShadow.material.opacity = 0;
          const wk = K(tc, A3.walk[0], 90), d = 0.85 * (tc - A3.walk[0]) * wk;
          kn.root.position.set(DWX + Math.max(0, d), 0, 0);
          if (tc >= A3.walk[0]) gait(Math.max(0, d) / TL.stride, Math.min(1, wk * 4)); else kn.torso.rotation.z = -0.25;
          ember(0.6 + 0.05 * Math.sin(tc * 3)); cape(capeHang(tc, 1.2));
          const pl = K(tc, A3.plant[0], A3.plant[1]);
          if (pl <= 0) { aR.sh.rotation.z = 0.25; swordDrag(); }
          else if (pl < 1) { const up = io(clamp(pl / 0.45, 0, 1)), down = io(clamp((pl - 0.45) / 0.55, 0, 1));
            aR.sh.rotation.z = lerp(0.25, 1.35, up) - 0.6 * down; aR.el.rotation.z = -0.3 * up; kn.torso.rotation.z = -0.25 - 0.25 * down;
            kn.root.updateMatrixWorld(true); const hand = aR.hand.getWorldPosition(new T.Vector3());
            swordWorld(new T.Vector3(lerp(hand.x, PLANTED.x, down), lerp(hand.y - 0.05, PLANTED.y, down), lerp(hand.z, PLANTED.z, down)), 0, 0, lerp(0.8, 0.02, up)); }
          else swordWorld(PLANTED, 0, 0, 0.02);
          // the crow: on his shoulder, onto the hilt for a moment, back to his shoulder as he walks on
          const HILT = v3(PLANTED.x + 0.01, PLANTED.y + 0.2, PLANTED.z);
          if (tc < A3.hilt[0]) onShoulder();
          else if (tc < A3.hilt[1]) { kn.root.updateMatrixWorld(true); const from = perch.getWorldPosition(new T.Vector3()); flyTo(from, HILT, io(K(tc, A3.hilt[0], A3.hilt[1])), 0.25); crowWings(1, Math.sin(tc * TAU * 4.5)); }
          else if (tc < A3.shoulder[0]) { cr.root.position.copy(HILT); cr.root.rotation.y = 0.4; cr.head.rotation.y = -0.6; }
          else if (tc < A3.shoulder[1]) { kn.root.updateMatrixWorld(true); const to = perch.getWorldPosition(new T.Vector3()); flyTo(HILT, to, io(K(tc, A3.shoulder[0], A3.shoulder[1])), 0.3); crowWings(1, Math.sin(tc * TAU * 4.5)); }
          else onShoulder();
          caw(tc, A3.caws);
        }
      }
      // ---------------------------------------------------------------- 3편: the dream
      else {
        light('dream', tq, 0, 0); grade('dream');
        sc.fog.color.setRGB(0.36, 0.07, 0.07); sc.fog.near = 6; sc.fog.far = 70;
        kn.sword.visible = false; dSword.visible = true; kn.ember.visible = false; ember(0);
        // he stands his ground facing the enemy line, is pushed back, and falls under the great blow
        const pushed = io(K(tc, A3.pushed[0], A3.pushed[1])), fall = io(K(tc, A3.fall[0], A3.fall[1]));
        kn.root.position.set(DX - 0.8 * pushed - 0.35 * fall, 0.13 * fall, 0); kn.root.rotation.set(0, 0, 1.42 * fall);
        // a wide stance
        L.hipP.rotation.z = 0.35; L.knee.rotation.z = -0.35; Rg.hipP.rotation.z = -0.32; Rg.knee.rotation.z = -0.15; L.foot.rotation.z = -0.1; Rg.foot.rotation.z = 0.35;
        kn.hips.position.y = 0.93; kn.torso.rotation.z = -0.12; kn.neck.rotation.z = -0.05; cape(capeHang(tc, 1.6));
        // the sword: raised, swung down at each clash; blocking; then the blow that breaks it
        let th = 2.3; const C = A3.clash;
        for (const c of C) { const up = K(tc, c - 0.55, c - 0.15), dn = K(tc, c - 0.15, c); if (tc >= c - 0.55 && tc < c + 0.35) th = dn > 0 ? lerp(3.4, 1.05, out(dn)) : lerp(2.3, 3.4, io(up)); else if (tc >= c + 0.35 && tc < c + 0.8) th = lerp(1.05, 2.3, io(K(tc, c + 0.35, c + 0.8))); }
        if (tc >= A3.blow - 0.6 && tc < A3.fall[0]) th = lerp(2.3, 2.75, io(K(tc, A3.blow - 0.6, A3.blow)));            // guard up against the axe
        aR.sh.rotation.z = lerp(0.9, 2.5, clamp((th - 1.0) / 2.4, 0, 1)); aR.el.rotation.z = -0.2;
        aL.sh.rotation.z = 0.6 + 0.3 * Math.sin(tc * 2); aL.el.rotation.z = 0.5;
        swordInHand(th, dSword); dTip.visible = tc < A3.blow;
        // the enemy he fights, the brute, the line behind them, his own side and the banner
        const fx = DX + 1.15 - 0.8 * pushed; foe.position.set(fx, 0, 0.1); foe.rotation.y = Math.PI; foe.visible = tc < A3.blow - 1.0;
        let fArm = 0.3; for (const c of C) fArm += 1.1 * bump(tc, c - 0.4, c + 0.4); foe.userData.arm.rotation.z = -fArm;
        brute.visible = tc >= SH[17] - 0.2; brute.position.set(DX + 1.35 - 0.8 * pushed, 0, -0.05); brute.rotation.y = Math.PI;
        const sw2 = io(K(tc, A3.blow - 0.7, A3.blow)); brute.userData.arm.rotation.z = lerp(-0.3, -2.6, K(tc, A3.blow - 1.6, A3.blow - 0.7)) * (1 - sw2) + lerp(-2.6, 0.6, sw2) * (tc >= A3.blow - 0.7 ? 1 : 0) + (tc < A3.blow - 0.7 ? 0 : 0);
        enemies.forEach((e, n) => { e.userData.b.position.y = 0.04 * Math.abs(Math.sin(tc * 3 + n)); e.userData.arm.rotation.z = -0.3 - 0.4 * Math.max(0, Math.sin(tc * 2.2 + n * 1.7)); e.position.x = DX + [2.2, 3.4, 5.2, 6.1, 4.4, 7.8, 9.0, 8.4, 11.0][n] - 0.6 * pushed - 0.3 * K(tc, 64, 79); });
        allies.forEach((e, n) => { e.visible = tc < SH[18]; e.userData.arm.rotation.z = -0.3 - 0.5 * Math.max(0, Math.sin(tc * 2.4 + n)); });
        const bf = io(K(tc, A3.bannerFall[0], A3.bannerFall[1])); banner.rotation.set(0, 0, 1.45 * bf * bf); banner.position.x = DX - 1.1 - 0.8 * pushed;
        bannerCloth.userData.drape((u, v, o) => { o[0] = u * 0.7 + 0.04 * v * Math.sin(6 * v - 5 * tc); o[1] = -v * 1.05; o[2] = -0.25 * v + 0.07 * v * Math.sin(5 * v - 6 * tc + u * 3); });
        // sparks at the clashes and at the blow
        let si = 0;
        for (const c of [...C, A3.blow]) { const age = tc - c; if (age < 0 || age > 0.5) continue; kn.root.updateMatrixWorld(true); const at = dBase.localToWorld(v3(0, -BL * 0.9, 0));
          for (let n = 0; n < 8 && si < sparks.length; n++, si++) { const s = sparks[si], a = n / 8 * TAU + c; s.position.set(at.x + Math.cos(a) * age * 1.6, at.y + Math.sin(a) * age * 1.2 + 0.2 * age, at.z + Math.sin(a * 1.7) * age * 0.6); s.scale.setScalar(0.08); s.material.opacity = 1 - age / 0.5; } }
        // the broken tip flies, slow, turning
        if (tc >= A3.blow) { kn.root.updateMatrixWorld(true); const age = tc - A3.blow, p0 = dBase.localToWorld(v3(0, -(BL + 0.21), 0)); flyTip.visible = true;
          flyTip.position.set(p0.x - 0.6 * Math.min(age, 2.2) * 0.9, Math.max(0.05, 1.6 + 1.1 * age - 0.85 * age * age), p0.z + 0.35 * age); flyTip.rotation.set(age * 2.1, age * 0.7, age * 5.3); if (age > 2.2) flyTip.rotation.set(0, 0.7, Math.PI / 2); }
        // the smoke drifting over the fallen
        smoke.forEach((s, n) => { const ph = (tc * 0.18 + n / smoke.length) % 1; s.position.set(DX - 3 + ((n * 1.7) % 7) + ph * 1.5, 0.3 + ph * 2.2, -1.5 + ((n * 2.3) % 3)); s.scale.setScalar(1.2 + ph * 2.0); s.material.opacity = 0.55 * Math.sin(Math.PI * ph) * K(tc, 74, 76); });
        // the crow comes down through the smoke onto his chest: their first meeting
        if (tc >= A3.crowLand[0]) { kn.root.updateMatrixWorld(true); const chest = kn.torso.localToWorld(v3(0.02, 0.42, 0.0)); chest.y += 0.12; const from = v3(DX - 0.2, 3.4, 1.4);
          const k = io(K(tc, A3.crowLand[0], A3.crowLand[1])); flyTo(from, chest, k, 0.0); cr.root.position.y += 0.0; crowWings(k < 1 ? 1 : 0, Math.sin(tc * TAU * (k < 0.8 ? 2.6 : 4.5)) * (1 - 0.7 * K(tc, A3.crowLand[1] - 0.6, A3.crowLand[1]))); if (k >= 1) cr.root.rotation.y = 2.2; }
        else { cr.root.visible = false; }
      }

      const sh = camAct(tq, i); cam.lookAt(look);
      // the ember-eye glow sprites (after the camera is placed, so they lean toward this frame's lens)
      kn.root.updateMatrixWorld(true);
      const glow = kn.root.userData.glow || 0; kn.eyes.forEach((e, n) => { e.getWorldPosition(eyeGlow[n].position); eyeGlow[n].position.lerp(cam.position, 0.012); eyeGlow[n].material.opacity = inDream ? 0 : ([10, 12, 14, 19].includes(i) ? 0.9 : 0.5) * glow; });
      sun.target.position.set(sh[0], 0, sh[1]); if (!inDream) sun.position.copy(sun.target.position).addScaledVector(sun.position.clone().sub(sun.target.position).normalize(), 60);
      const shc = sun.shadow.camera, half = sh[2]; if (shc.right !== half) { shc.left = -half; shc.right = half; shc.top = half; shc.bottom = -half; shc.updateProjectionMatrix(); }
      for (const g of grass) g.userData.update(tq);
      return { i, inDream };
    }
    function fireFrame(t, k, dying) {
      const f = k * (0.88 + 0.12 * noise(t * 1.6, 2));
      fireLight.intensity = (dying ? 1.4 : 3.4) * f; fireLight.color.setRGB(1, 0.52 + 0.08 * noise(t, 5), 0.22);
      flames.forEach((s, n) => { const fl = f * (0.75 + 0.25 * noise(t * 2.2, s.userData.ph)); s.position.set(s.userData.dx + 0.02 * noise(t * 3, n), 0.03 + 0.17 * fl * (n ? 0.8 : 1), 0.02 * noise(t * 2.5, n + 3));
        s.scale.set(0.2 * fl * (n ? 0.7 : 1), 0.44 * fl * (n ? 0.75 : 1), 1); s.material.opacity = Math.min(1, fl * 1.4); });
      coal.material.opacity = Math.min(1, (dying ? 0.6 : 0.35) + 0.6 * f) * (k > 0 || dying ? 1 : 0) * (dying && k <= 0 ? 0.25 : 1);
      embers.material.opacity = Math.min(1, f * 1.6);
      for (let n = 0; n < EMB; n++) { const ph = ((t * (0.35 + (n % 5) * 0.08)) + n / EMB) % 1; embP[n * 3] = 0.12 * Math.sin(n * 7.1 + ph * 6); embP[n * 3 + 1] = 0.1 + ph * (0.9 + 0.4 * ((n * 13) % 7) / 7); embP[n * 3 + 2] = 0.12 * Math.cos(n * 3.3 + ph * 5); }
      embGeo.attributes.position.needsUpdate = true;
    }
    // back to 1편: everything this file changes goes back to how js/scenes.js set it up (seeking backwards included)
    const base = { hemiC: hemi.color.clone(), hemiG: hemi.groundColor.clone(), fogC: sc.fog.color.clone(), fogN: sc.fog.near, fogF: sc.fog.far, grassE: grass.map((g) => g.material.emissive.clone()) };
    function reset() {
      if (shown === false) return; shown = false;
      dreamLook(false); camp.visible = false; dream.visible = false; groove.visible = true; motes.visible = true;
      const u = sky.userData.u; u.uNight.value = 0; u.uDawn.value = 0;
      hemi.color.copy(base.hemiC); hemi.groundColor.copy(base.hemiG); sc.fog.color.copy(base.fogC); sc.fog.near = base.fogN; sc.fog.far = base.fogF;
      hills.children.forEach((h, i) => h.material.color.copy(hillsBase[i])); grass.forEach((g, i) => g.material.emissive.copy(base.grassE[i]));
      grade('dusk'); if (kn.sword.parent !== kn.root) kn.root.add(kn.sword); kn.sword.visible = true; dSword.visible = false; flyTip.visible = false; kn.ember.visible = true;
      kn.root.rotation.set(0, 0, 0); for (const lg of kn.legs) lg.hipP.rotation.x = 0; aL.sh.rotation.x = 0.1; kn.head.rotation.y = 0;
      cr.root.visible = true; crowReset(); beakTwig.visible = false; tear.visible = false; tearGlow.material.opacity = 0; spark.material.opacity = 0;
      sparks.forEach((x) => { x.material.opacity = 0; }); steam.forEach((x) => { x.material.opacity = 0; });
    }
    camp.visible = false; dream.visible = false;
    return { frame, reset, tint: tintEl };
  },
};
