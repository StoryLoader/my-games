/*
 * clay.js — the clay kit of 「LLM과 AI 에이전트, 처음부터 오늘까지」 (storyboard.md): soft, rounded, matte objects in
 * pastel colours, all built here from three.js primitives (no downloaded models or textures).
 * CLAY.init(THREE) returns the builders. Every object is a Group around its own origin; y is up.
 * Text on objects is drawn on a canvas with the project's installed font (Pretendard) and used as a texture.
 */
window.CLAY = {
  init(T) {
    const PAL = { cream: 0xfff6e6, white: 0xfffdf8, navy: 0x25324f, coral: 0xff8370, sun: 0xffc845, mint: 0x5fd3a8, sky: 0x62b6ff, lilac: 0xb39bff, pink: 0xff9ec4, sand: 0xf3d9a8, gray: 0xc9d2e0, ice: 0xdcecff, leaf: 0x8fd96a, ink: 0x25324f };
    const col = (c) => (typeof c === 'string' ? PAL[c] : c);
    const mats = new Map();
    /** matte clay */
    const M = (c, o = {}) => { const k = col(c) + '|' + (o.r ?? 0.86) + '|' + (o.e ?? 0); if (!mats.has(k)) mats.set(k, new T.MeshStandardMaterial({ color: col(c), roughness: o.r ?? 0.86, metalness: 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 })); return mats.get(k); };
    const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
    const grp = (...ch) => { const g = new T.Group(); ch.forEach((c) => c && g.add(c)); return g; };

    // ---------- geometry ----------
    const geoCache = new Map();
    /** a box with every edge rounded (an extruded rounded rectangle with a bevel) */
    function rboxGeo(w, h, d, r) {
      const k = [w, h, d, r].map((v) => v.toFixed(3)).join(','); if (geoCache.has(k)) return geoCache.get(k);
      const b = Math.min(r, d * 0.48, w * 0.48, h * 0.48), W2 = w / 2 - b, H2 = h / 2 - b, rr = Math.max(0.001, Math.min(r - b * 0.2, W2, H2));
      const s = new T.Shape();
      s.moveTo(-W2 + rr, -H2); s.lineTo(W2 - rr, -H2); s.quadraticCurveTo(W2, -H2, W2, -H2 + rr); s.lineTo(W2, H2 - rr); s.quadraticCurveTo(W2, H2, W2 - rr, H2);
      s.lineTo(-W2 + rr, H2); s.quadraticCurveTo(-W2, H2, -W2, H2 - rr); s.lineTo(-W2, -H2 + rr); s.quadraticCurveTo(-W2, -H2, -W2 + rr, -H2);
      const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 5 });
      g.translate(0, 0, -(d - 2 * b) / 2); g.computeVertexNormals(); geoCache.set(k, g); return g;
    }
    const rbox = (w, h, d, c, r = 0.14) => mesh(rboxGeo(w, h, d, r), M(c));
    const ball = (r, c, o) => mesh(new T.SphereGeometry(r, 28, 20), M(c, o));
    const pill = (r, len, c) => mesh(new T.CapsuleGeometry(r, len, 6, 16), M(c));
    const cyl = (r, h, c, seg = 28) => mesh(new T.CylinderGeometry(r, r, h, seg), M(c));
    const torus = (R, r, c, arc = Math.PI * 2) => mesh(new T.TorusGeometry(R, r, 12, 40, arc), M(c));
    const cone = (r, h, c) => mesh(new T.ConeGeometry(r, h, 24), M(c));
    /** a round puck with soft edges (a lathe) */
    function puck(r, h, c) { const p = [], e = Math.min(h / 2, 0.12); for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; p.push(new T.Vector2(r - e + Math.cos(a) * e, -h / 2 + e + Math.sin(a) * e)); } for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; p.push(new T.Vector2(r - e + Math.cos(a) * e, h / 2 - e + Math.sin(a) * e)); } p.unshift(new T.Vector2(0, -h / 2)); p.push(new T.Vector2(0, h / 2)); return mesh(new T.LatheGeometry(p, 36), M(c)); }
    /** a rod between two points */
    function rod(a, b, r, c) { const A = new T.Vector3(...a), B = new T.Vector3(...b), m = cyl(r, A.distanceTo(B), c, 10); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m; }
    /** a tube along points, with an arrow head at the end */
    function tube(pts, r, c, head = true) { const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))), g = grp(mesh(new T.TubeGeometry(curve, 48, r, 10), M(c)));
      if (head) { const e = curve.getPoint(1), d = curve.getTangent(1), h = cone(r * 2.6, r * 6, c); h.position.copy(e).add(d.clone().multiplyScalar(r * 2)); h.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); g.add(h); }
      g.userData.curve = curve; g.userData.tube = g.children[0]; return g; }

    // ---------- text and pictures on canvas ----------
    const FONT = "'Pretendard', sans-serif";
    function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.font = `800 40px 'Pretendard', sans-serif`; draw(x, w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
    /** flat text (a transparent plane). lines: string or array; hgt = world height of one line */
    function label(lines, o = {}) {
      if (!Array.isArray(lines)) lines = String(lines).split('\n');
      const px = 150, lh = px * 1.22, wt = o.weight || 900, c = document.createElement('canvas'), x = c.getContext('2d'); x.font = wt >= 900 ? "900 150px 'Pretendard', sans-serif" : "800 150px 'Pretendard', sans-serif";
      const tw = Math.max(...lines.map((l) => x.measureText(l).width)), W = Math.ceil(tw + 40), H = Math.ceil(lh * lines.length + 30);
      c.width = W; c.height = H; x.font = wt >= 900 ? "900 150px 'Pretendard', sans-serif" : "800 150px 'Pretendard', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = o.color || '#25324f';
      lines.forEach((l, i) => x.fillText(l, W / 2, 15 + lh * (i + 0.5)));
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
      const hgt = (o.size || 0.5) * 1.22 * lines.length + (o.size || 0.5) * 0.2, wid = hgt * W / H;
      const m = new T.Mesh(new T.PlaneGeometry(wid, hgt), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false })); m.userData.w = wid; m.userData.h = hgt; m.renderOrder = 2; return m;
    }
    /** a rounded clay block with words on its face. o: {size, text:'#hex', d, padX, padY, r, minW} */
    function block(text, c, o = {}) {
      const lb = label(text, { size: o.size || 0.5, color: o.text || '#25324f', weight: o.weight }), w = Math.max(o.minW || 0, lb.userData.w + (o.padX ?? 0.5)), h = lb.userData.h + (o.padY ?? 0.22), d = o.d ?? 0.5;
      const g = grp(rbox(w, h, d, c, o.r ?? Math.min(0.24, h * 0.3))); lb.position.z = d / 2 + 0.012; g.add(lb); g.userData = { w, h, d, label: lb, body: g.children[0] }; return g;
    }
    /** a coin / medal with words */
    function coin(text, c, r = 1, o = {}) { const p = puck(r, o.d ?? 0.34, c); p.rotation.x = Math.PI / 2; const lb = label(text, { size: o.size || r * 0.36, color: o.text || '#25324f' }); lb.position.z = (o.d ?? 0.34) / 2 + 0.012; const g = grp(p, lb); g.userData = { r, label: lb }; return g; }
    /** a flat panel that shows a canvas drawing (a phone screen, a chat window, a sheet): draw(ctx, w, h, state) */
    function panel(w, h, c, draw, o = {}) {
      const pw = 1024, ph = Math.round(pw * h / w), cv = document.createElement('canvas'); cv.width = pw; cv.height = ph; const x = cv.getContext('2d');
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
      const d = o.d ?? 0.22, body = rbox(w + (o.rim ?? 0.24), h + (o.rim ?? 0.24), d, c, o.r ?? 0.2), face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
      face.position.z = d / 2 + 0.01; const g = grp(body, face); let last = null;
      g.userData.state = (s) => { if (s === last) return; last = s; x.font = `800 40px 'Pretendard', sans-serif`; x.clearRect(0, 0, pw, ph); draw(x, pw, ph, s); tex.needsUpdate = true; };
      g.userData.state(o.state ?? 0); g.userData.w = w; g.userData.h = h; return g;
    }
    /** a photograph in a clay frame, leaning on a little stand */
    function photo(tex, w, h, c = 'white') {
      const fr = rbox(w + 0.44, h + 0.44, 0.26, c, 0.2), pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); pic.position.z = 0.141;
      const leg = rbox(0.5, h * 0.7, 0.16, c, 0.07); leg.position.set(0, -h * 0.16, -0.36); leg.rotation.x = 0.42;
      const g = grp(fr, pic, leg); g.userData = { w: w + 0.44, h: h + 0.44 }; return g;
    }

    // ---------- the mascot: a small clay robot that stands for the LLM ----------
    function bot(o = {}) {
      const body = ball(1, o.color || 'white'); body.scale.set(1, 1.08, 0.94);
      const face = rbox(1.36, 0.86, 0.34, 'navy', 0.3); face.position.set(0, 0.2, 0.87);
      const eyeM = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9fe8ff, emissiveIntensity: 0.9, roughness: 0.4 });
      const eL = new T.Mesh(new T.SphereGeometry(0.13, 16, 12), eyeM), eR = eL.clone(); eL.position.set(-0.3, 0.3, 1.03); eR.position.set(0.3, 0.3, 1.03);
      const mouth = new T.Mesh(new T.CapsuleGeometry(0.035, 0.17, 4, 10), eyeM); mouth.rotation.z = Math.PI / 2; mouth.position.set(0, 0.02, 1.035);
      const ant = grp(cyl(0.045, 0.42, 'gray', 10), ball(0.14, o.accent || 'coral')); ant.children[0].position.y = 1.24; ant.children[1].position.y = 1.5;
      const earL = puck(0.2, 0.16, o.accent || 'coral'), earR = puck(0.2, 0.16, o.accent || 'coral'); earL.rotation.z = Math.PI / 2; earR.rotation.z = Math.PI / 2; earL.position.set(-0.99, 0.2, 0); earR.position.set(0.99, 0.2, 0);
      const fL = ball(0.3, o.accent || 'coral'), fR = ball(0.3, o.accent || 'coral'); fL.scale.set(1, 0.55, 1.2); fR.scale.set(1, 0.55, 1.2); fL.position.set(-0.42, -1.0, 0.1); fR.position.set(0.42, -1.0, 0.1);
      const tag = label(o.tag || 'LLM', { size: 0.26, color: '#25324f' }); tag.position.set(0, -0.5, 0.9); tag.rotation.x = 0.28;
      const mk = (s) => { const a = grp(pill(0.13, 0.5, o.color || 'white'), ball(0.2, o.accent || 'coral')); a.children[0].position.y = -0.36; a.children[1].position.y = -0.74; a.position.set(s * 0.98, -0.12, 0.1); a.rotation.z = s * 0.5; return a; };
      const aL = mk(-1), aR = mk(1); aL.visible = aR.visible = !!o.arms;
      const g = grp(body, face, eL, eR, mouth, ant, earL, earR, fL, fR, tag, aL, aR);
      g.userData = { eyes: [eL, eR], mouth, arms: [aL, aR], tag, ant };
      /** life: blinking, a little breathing; arms(k) 0..1 shows the arms, wave lifts the right one */
      g.userData.live = (t, arms = o.arms ? 1 : 0, wave = 0) => { const b = (t * 0.31) % 1, bl = b > 0.955 ? 0.15 : 1; eL.scale.y = eR.scale.y = bl; body.scale.y = 1.08 + 0.012 * Math.sin(t * 2.1);
        aL.visible = aR.visible = arms > 0.02; aL.scale.setScalar(Math.max(0.001, arms)); aR.scale.setScalar(Math.max(0.001, arms)); aR.rotation.z = 0.5 + wave * (1.9 + 0.25 * Math.sin(t * 9)); };
      return g;
    }

    // ---------- small things ----------
    function dial(c = 'sun') { const g = grp(puck(0.36, 0.26, c), rbox(0.09, 0.3, 0.1, 'navy', 0.04)); g.children[0].rotation.x = Math.PI / 2; g.children[1].position.set(0, 0.15, 0.14); return g; }
    function magnifier() { const g = grp(torus(0.42, 0.11, 'sky'), cyl(0.36, 0.04, 'ice'), rod([0.3, -0.3, 0], [0.78, -0.78, 0], 0.11, 'navy')); g.children[1].rotation.x = Math.PI / 2; return g; }
    function calculator() { const g = grp(rbox(0.9, 1.15, 0.26, 'lilac', 0.14), rbox(0.66, 0.26, 0.06, 'navy', 0.05)); g.children[1].position.set(0, 0.32, 0.14); for (let i = 0; i < 6; i++) { const b = rbox(0.17, 0.17, 0.1, i === 5 ? 'coral' : 'white', 0.05); b.position.set(-0.24 + (i % 3) * 0.24, -0.06 - Math.floor(i / 3) * 0.26, 0.14); g.add(b); } return g; }
    function folder() { const g = grp(rbox(1.1, 0.8, 0.22, 'sun', 0.12), rbox(0.5, 0.24, 0.2, 'sun', 0.08), rbox(0.96, 0.5, 0.06, 'white', 0.05)); g.children[1].position.set(-0.27, 0.44, 0); g.children[2].position.set(0, 0.2, -0.02); return g; }
    function calendar() { const g = grp(rbox(1.0, 1.0, 0.22, 'white', 0.14), rbox(1.0, 0.3, 0.24, 'coral', 0.12)); g.children[1].position.set(0, 0.37, 0); for (let i = 0; i < 6; i++) { const b = rbox(0.18, 0.18, 0.06, i === 3 ? 'mint' : 'gray', 0.04); b.position.set(-0.28 + (i % 3) * 0.28, 0.04 - Math.floor(i / 3) * 0.28, 0.13); g.add(b); } return g; }
    function gear(c = 'sun', r = 0.5) { const g = grp(puck(r, 0.22, c)); g.children[0].rotation.x = Math.PI / 2; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, tb = rbox(r * 0.34, r * 0.4, 0.2, c, 0.05); tb.position.set(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, 0); tb.rotation.z = a - Math.PI / 2; g.add(tb); } const hub = puck(r * 0.32, 0.26, 'navy'); hub.rotation.x = Math.PI / 2; g.add(hub); return g; }
    function notebook() { const g = grp(rbox(1.3, 1.6, 0.2, 'sky', 0.12), rbox(1.14, 1.44, 0.06, 'white', 0.06)); g.children[1].position.z = 0.1; for (let i = 0; i < 5; i++) { const r = torus(0.09, 0.03, 'navy'); r.position.set(-0.3 + i * 0.15, 0.82, 0.02); r.rotation.y = Math.PI / 2; g.add(r); } return g; }
    function book(title, c = 'coral') { const g = grp(rbox(1.5, 2.0, 0.44, c, 0.1), rbox(1.36, 1.86, 0.36, 'white', 0.04)); g.children[1].position.set(0.08, 0, 0); const lb = label(title, { size: 0.42, color: '#fff6e6' }); lb.position.z = 0.235; g.add(lb); return g; }
    function gpu() { const g = grp(rbox(2.6, 1.1, 0.34, 'navy', 0.14), rbox(1.9, 0.14, 0.3, 'sun', 0.05)); g.children[1].position.set(-0.2, -0.62, 0); for (const x of [-0.62, 0.62]) { const f = puck(0.42, 0.1, 'sky'); f.rotation.x = Math.PI / 2; f.position.set(x, 0, 0.2); g.add(f); const h = puck(0.13, 0.14, 'white'); h.rotation.x = Math.PI / 2; h.position.set(x, 0, 0.24); g.add(h); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, bl = rbox(0.1, 0.28, 0.05, 'ice', 0.03); bl.position.set(x + Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0.26); bl.rotation.z = a + 0.5; g.add(bl); } } return g; }
    function clock() { const g = grp(puck(1.0, 0.3, 'white'), torus(1.0, 0.12, 'coral')); g.children[0].rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, tk = rbox(0.07, 0.2, 0.06, 'navy', 0.03); tk.position.set(Math.sin(a) * 0.76, Math.cos(a) * 0.76, 0.17); tk.rotation.z = -a; g.add(tk); }
      const hh = grp(rbox(0.1, 0.5, 0.07, 'navy', 0.04)), mh = grp(rbox(0.07, 0.72, 0.07, 'coral', 0.03)); hh.children[0].position.y = 0.22; mh.children[0].position.y = 0.33; hh.position.z = 0.19; mh.position.z = 0.22; g.add(hh, mh, ball(0.09, 'navy')); g.children[g.children.length - 1].position.z = 0.24; g.userData = { hh, mh }; return g; }
    function plug(c = 'mint') { const g = grp(rbox(0.7, 0.5, 0.4, c, 0.14), cyl(0.05, 0.3, 'gray', 10), cyl(0.05, 0.3, 'gray', 10)); g.children[1].rotation.z = Math.PI / 2; g.children[2].rotation.z = Math.PI / 2; g.children[1].position.set(0.48, 0.1, 0); g.children[2].position.set(0.48, -0.1, 0); return g; }
    /** a sheet of paper with grey lines; title optional */
    function sheet(w = 1.5, h = 1.9, title = '', lines = 6) { const tex = canvasTex(512, Math.round(512 * h / w), (x, W, H) => { x.fillStyle = '#fffdf8'; x.fillRect(0, 0, W, H); let y = 70; if (title) { x.fillStyle = '#25324f'; x.font = `900 58px 'Pretendard', sans-serif`; title.split('\n').forEach((l) => { x.fillText(l, 44, y); y += 70; }); y += 10; } x.fillStyle = '#d5dbe6'; for (let i = 0; i < lines; i++) { x.fillRect(44, y, (W - 88) * [1, 0.9, 0.96, 0.7, 1, 0.82, 0.93, 0.6][i % 8], 20); y += 46; } });
      const g = grp(rbox(w, h, 0.07, 'white', 0.03), new T.Mesh(new T.PlaneGeometry(w * 0.96, h * 0.96), new T.MeshBasicMaterial({ map: tex, toneMapped: false }))); g.children[1].position.z = 0.04; return g; }
    function check(c = 'mint') { return grp(rod([-0.3, 0, 0], [-0.08, -0.24, 0], 0.08, c), rod([-0.08, -0.24, 0], [0.36, 0.3, 0], 0.08, c)); }
    function cross(c = 'coral') { return grp(rod([-0.28, -0.28, 0], [0.28, 0.28, 0], 0.08, c), rod([-0.28, 0.28, 0], [0.28, -0.28, 0], 0.08, c)); }
    function qmark(c = 'sun') { const g = grp(torus(0.34, 0.12, c, Math.PI * 1.3), rod([0, -0.36, 0], [0, -0.62, 0], 0.12, c), ball(0.15, c)); g.children[0].position.y = 0.3; g.children[0].rotation.z = -Math.PI * 0.15; g.children[2].position.y = -0.98; return g; }

    return { T, PAL, col, M, mesh, grp, rbox, ball, pill, cyl, torus, cone, puck, rod, tube, canvasTex, label, block, coin, panel, photo, bot, dial, magnifier, calculator, folder, calendar, gear, notebook, book, gpu, clock, plug, sheet, check, cross, qmark, FONT };
  },
};
