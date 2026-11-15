/*
 * kit.js — everything 「남은 길」 is made of (storyboard.md): painted textures drawn on canvases at load, a cel-shaded
 * (toon) material set, the dusk sky, the hills, the dry plain and its debris, the skeleton knight and the crow.
 * All built here from three.js primitives and canvas strokes — no downloaded models, textures or images.
 * KIT.init(THREE, rand) returns the builders. Models face +x, y is up, they stand on y = 0.
 */
window.KIT = {
  init(T, rand) {
    const R = rand(1977);
    const rr = (a, b) => a + (b - a) * R();

    // ---------------- cel shading ----------------
    const ramp = (() => { const d = new Uint8Array([105, 255]); const t = new T.DataTexture(d, d.length, 1, T.RedFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; })();
    const mats = new Map();
    /** a cel-shaded material; o: { map, side, alphaTest, emissive, ei, transparent, noOutline } */
    function toon(color, o = {}) {
      const key = o.map || o.alphaMap || o.noCache ? null : color + '|' + (o.side || 0) + '|' + (o.emissive || 0);
      if (key && mats.has(key)) return mats.get(key);
      const m = new T.MeshToonMaterial({ color, gradientMap: ramp, map: o.map || null, alphaMap: o.alphaMap || null, side: o.side || T.FrontSide, alphaTest: o.alphaTest || 0, transparent: !!o.transparent, emissive: o.emissive || 0x000000, emissiveIntensity: o.ei ?? 1 });
      m.userData.outlineParameters = o.noOutline ? { visible: false } : { thickness: o.thick || 0.0042, color: [0.17, 0.09, 0.07], alpha: 1 };
      if (key) mats.set(key, m);
      return m;
    }
    const noOutline = (m) => { m.userData.outlineParameters = { visible: false }; return m; };
    const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
    const grp = (...c) => { const g = new T.Group(); c.forEach((o) => o && g.add(o)); return g; };
    /** a capsule from a to b (local points) */
    function bone(a, b, r, m) { const A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B); const o = mesh(new T.CapsuleGeometry(r, Math.max(0.001, L - 2 * r), 4, 10), m); o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return o; }
    function rod(a, b, r, m, r2) { const A = new T.Vector3(...a), B = new T.Vector3(...b); const o = mesh(new T.CylinderGeometry(r2 ?? r, r, A.distanceTo(B), 10), m); o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return o; }

    // ---------------- painted canvases ----------------
    function cv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); return c; }
    const tex = (c, srgb = true, rep) => { const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
    /** a soft brush daub */
    function daub(x, cx, cy, w, h, ang, col, a) { x.save(); x.translate(cx, cy); x.rotate(ang); x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.ellipse(0, 0, Math.max(0.5, w), Math.max(0.5, h), 0, 0, Math.PI * 2); x.fill(); x.restore(); }
    const pick = (arr) => arr[Math.floor(R() * arr.length) % arr.length];
    /** a painted surface: a base colour broken by many daubs of nearby colours */
    function paintTex(w, h, base, cols, n, size, rep) {
      return tex(cv(w, h, (x) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const s = rr(size * 0.4, size); daub(x, rr(0, w), rr(0, h), s, s * rr(0.3, 0.8), rr(0, 3.14), pick(cols), rr(0.12, 0.42)); } }), true, rep);
    }

    // ---------------- sky ----------------
    function sky() {
      const W = 2048, H = 512;
      const cov = cv(W, H, (x) => {                                   // cloud coverage: horizontal painted streaks
        x.clearRect(0, 0, W, H);
        const banks = [[0.92, 26, 3, 7], [0.82, 18, 4, 10], [0.66, 14, 6, 16], [0.48, 9, 8, 22], [0.3, 6, 9, 24]];
        for (const [yy, nb, hmin, hmax] of banks) for (let b = 0; b < nb; b++) { const cx = rr(0, W), cy = yy * H + rr(-18, 18), len = rr(120, 420);
          for (let i = 0; i < 46; i++) { const px = cx + rr(-len / 2, len / 2), py = cy + rr(-hmax, hmax) * 0.7, w = rr(len * 0.08, len * 0.3), h = rr(hmin, hmax);
            for (const dx of [0, -W, W]) daub(x, px + dx, py, w, h, rr(-0.04, 0.04), '#fff', rr(0.05, 0.16)); } }
      });
      const lit = cv(W, H, (x) => {                                   // light on the cloud bellies facing the low sun
        x.clearRect(0, 0, W, H);
        for (let i = 0; i < 900; i++) { const px = rr(0, W), py = H * rr(0.28, 0.97), w = rr(20, 120), h = rr(2, 7); for (const dx of [0, -W, W]) daub(x, px + dx, py + 6, w, h, 0, '#fff', rr(0.05, 0.18)); }
      });
      const brush = cv(512, 256, (x) => { x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 256); for (let i = 0; i < 1400; i++) daub(x, rr(0, 512), rr(0, 256), rr(8, 40), rr(2, 7), rr(-0.15, 0.15), R() < 0.5 ? '#000' : '#fff', rr(0.03, 0.09)); });
      const tc = tex(cov, false), tl = tex(lit, false), tb = tex(brush, false);
      for (const t of [tc, tl, tb]) { t.wrapS = T.RepeatWrapping; }
      const u = { sunDir: { value: new T.Vector3(0.75, 0.12, -0.66).normalize() }, uCov: { value: tc }, uLit: { value: tl }, uBrush: { value: tb }, uDrift: { value: 0 }, uDusk: { value: 0 } };
      const m = new T.ShaderMaterial({ uniforms: u, side: T.BackSide, depthWrite: false, fog: false,
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `varying vec3 vDir; uniform vec3 sunDir; uniform sampler2D uCov, uLit, uBrush; uniform float uDrift, uDusk;
          vec3 S(float r,float g,float b){ return vec3(r,g,b)/255.; }
          void main(){
            vec3 d = normalize(vDir); float e = asin(clamp(d.y,-1.,1.)); float az = atan(d.z, d.x);
            vec3 hor = mix(S(255.,206.,140.), S(232.,146.,112.), uDusk), rose = mix(S(240.,150.,118.), S(196.,104.,110.), uDusk),
                 mauve = mix(S(150.,108.,160.), S(108.,80.,138.), uDusk), indigo = mix(S(58.,58.,112.), S(34.,32.,74.), uDusk);
            vec3 c = mix(hor, rose, smoothstep(0.0, 0.11, e)); c = mix(c, mauve, smoothstep(0.08, 0.34, e)); c = mix(c, indigo, smoothstep(0.30, 0.95, e));
            c = mix(c, hor * 0.82, smoothstep(0.0, -0.06, e));
            float sd = max(dot(d, sunDir), 0.);
            c += mix(S(255.,170.,90.), S(255.,120.,70.), uDusk) * (pow(sd, 9.) * 0.42 + pow(sd, 60.) * 0.5);
            vec2 uv = vec2(az / 6.2831853 + 0.5 + uDrift, clamp(e / 0.62, 0., 1.));
            float cv = texture2D(uCov, uv).a * smoothstep(-0.005, 0.02, e), lt = texture2D(uLit, uv).a;
            vec3 cloudShade = mix(S(146.,102.,142.), S(206.,128.,128.), smoothstep(0.32, 0.0, e)) * mix(1., 0.72, uDusk);
            vec3 cloudLit = mix(S(255.,206.,150.), S(255.,236.,196.), pow(sd, 6.));
            vec3 cc = mix(cloudShade, cloudLit, clamp(lt * (0.5 + 1.6 * pow(sd, 3.)), 0., 1.));
            c = mix(c, cc, clamp(cv * 1.15, 0., 0.96));
            float disc = smoothstep(0.99935, 0.99962, dot(d, sunDir));
            c = mix(c, mix(S(255.,244.,214.), S(255.,214.,160.), uDusk), disc * smoothstep(-0.004, 0.006, e));
            c *= 0.95 + 0.1 * texture2D(uBrush, vec2(az / 6.2831853 * 3., e * 2.)).r;
            gl_FragColor = vec4(c, 1.);
            #include <colorspace_fragment>
          }` });
      m.userData.outlineParameters = { visible: false };
      const o = new T.Mesh(new T.SphereGeometry(450, 48, 24), m); o.renderOrder = -10; o.frustumCulled = false; o.userData.u = u;
      return o;
    }

    // ---------------- hills: three painted rings of silhouettes ----------------
    function hills(cx) {
      const g = new T.Group();
      [[300, 30, '#d7a29e', '#f1c3a6', 0.55, 2], [220, 22, '#b0788a', '#dfa59c', 0.8, 3], [150, 14, '#845a72', '#c48f8e', 1.0, 4]].forEach(([rad, hh, col, rim, rough, seed], li) => {
        const W = 4096, H = 256, rnd = rand(seed * 101);
        const c = cv(W, H, (x) => {
          x.clearRect(0, 0, W, H);
          const pts = []; let y = 0.55, v = 0; for (let i = 0; i <= 256; i++) { v += (rnd() - 0.5) * 0.08 * rough; v *= 0.86; y = Math.min(0.92, Math.max(0.18, y + v + (rnd() - 0.5) * 0.03 * rough)); pts.push(y); }
          pts[256] = pts[0];
          x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= 256; i++) x.lineTo(i / 256 * W, H - pts[i] * H); x.lineTo(W, H); x.closePath(); x.fillStyle = col; x.fill();
          x.save(); x.clip(); for (let i = 0; i < 1600; i++) daub(x, rnd() * W, rnd() * H, 10 + rnd() * 50, 2 + rnd() * 6, (rnd() - 0.5) * 0.3, rnd() < 0.5 ? rim : '#3b2a3c', 0.04 + rnd() * 0.08);
          const gr = x.createLinearGradient(0, H * 0.35, 0, H); gr.addColorStop(0, 'rgba(255,190,150,0)'); gr.addColorStop(1, 'rgba(255,196,150,0.55)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); x.restore();
          x.lineWidth = 3; x.strokeStyle = rim; x.globalAlpha = 0.5; x.beginPath(); for (let i = 0; i <= 256; i++) { const px = i / 256 * W, py = H - pts[i] * H + 2; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke();
        });
        const t = tex(c); t.wrapS = T.RepeatWrapping;
        const m = new T.MeshBasicMaterial({ map: t, transparent: true, side: T.BackSide, depthWrite: false, fog: false });
        m.userData.outlineParameters = { visible: false };
        const o = new T.Mesh(new T.CylinderGeometry(rad, rad, hh, 160, 1, true), m); o.position.set(cx, hh / 2 - 2.5, 0); o.renderOrder = -9 + li; o.frustumCulled = false; g.add(o);
      });
      return g;
    }

    // ---------------- the plain ----------------
    function ground() {
      const base = cv(1024, 1024, (x, w, h) => {
        x.fillStyle = '#b4875c'; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 2600; i++) { const s = rr(10, 60); for (const dx of [0, -w, w]) for (const dy of [0, -h, h]) daub(x, rr(0, w) + dx, rr(0, h) + dy, s, s * rr(0.25, 0.6), rr(0, 3.14), pick(['#9a6f4c', '#c79868', '#a87b54', '#8e6748', '#cfa274', '#b98c66']), rr(0.12, 0.32)); }
        x.strokeStyle = '#6f4b33'; x.lineCap = 'round';
        for (let c = 0; c < 60; c++) { let px = rr(0, w), py = rr(0, h); x.globalAlpha = rr(0.25, 0.5); x.lineWidth = rr(1, 2.4); x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 7; k++) { px += rr(-28, 28); py += rr(-28, 28); x.lineTo(px, py); } x.stroke(); }
        x.globalAlpha = 1; for (let i = 0; i < 500; i++) daub(x, rr(0, w), rr(0, h), rr(1.5, 4), rr(1, 3), 0, pick(['#6e513f', '#d8b48a', '#8a6a52']), 0.7);
      });
      const t = tex(base, true, [60, 60]);
      const m = toon(0xffffff, { map: t, noOutline: true });
      const o = new T.Mesh(new T.PlaneGeometry(800, 800), m); o.rotation.x = -Math.PI / 2; o.position.set(60, 0, 0); o.receiveShadow = true;
      return o;
    }
    function road() {
      const c = cv(2048, 128, (x, w, h) => {
        const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(214,176,128,0)'); gr.addColorStop(0.22, 'rgba(214,176,128,0.9)'); gr.addColorStop(0.78, 'rgba(214,176,128,0.9)'); gr.addColorStop(1, 'rgba(214,176,128,0)');
        x.fillStyle = gr; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 1500; i++) daub(x, rr(0, w), rr(h * 0.2, h * 0.8), rr(8, 40), rr(2, 6), rr(-0.1, 0.1), pick(['#c09468', '#e2c094', '#b88c62']), rr(0.12, 0.3));
        for (const yy of [0.36, 0.64]) for (let i = 0; i < 260; i++) daub(x, rr(0, w), h * yy + rr(-3, 3), rr(14, 46), rr(1.2, 3), 0, '#8b6446', rr(0.15, 0.35));
      });
      const t = tex(c, true, [16, 1]);
      const m = toon(0xffffff, { map: t, transparent: true, noOutline: true }); m.depthWrite = false;
      const o = new T.Mesh(new T.PlaneGeometry(220, 2.6), m); o.rotation.x = -Math.PI / 2; o.position.set(70, 0.006, 0); o.receiveShadow = true; o.renderOrder = 1;
      return o;
    }
    /** dry grass tufts (instanced crossed cards) scattered over an area, avoiding the road */
    function grass(n, x0, x1, z0, z1, seed) {
      const rnd = rand(seed);
      const c = cv(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.lineCap = 'round';
        for (let i = 0; i < 46; i++) { const a = (rnd() - 0.5) * 1.5, L = h * (0.45 + rnd() * 0.5); x.strokeStyle = pick(['#e2c08a', '#d2ab72', '#efd4a0', '#c49a66', '#d9b47c']); x.lineWidth = 2 + rnd() * 3; x.globalAlpha = 0.95;
          x.beginPath(); x.moveTo(w / 2 + (rnd() - 0.5) * 20, h); x.quadraticCurveTo(w / 2 + Math.sin(a) * L * 0.4, h - L * 0.6, w / 2 + Math.sin(a) * L, h - L * Math.cos(a)); x.stroke(); } });
      const t = tex(c);
      const geo = new T.BufferGeometry(); const P = [], U = [], I = [];
      for (let q = 0; q < 2; q++) { const a = q * Math.PI / 2, ca = Math.cos(a) * 0.5, sa = Math.sin(a) * 0.5, b = P.length / 3;
        P.push(-ca, 0, -sa, ca, 0, sa, ca, 1, sa, -ca, 1, -sa); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); geo.setIndex(I); geo.computeVertexNormals();
      const m = new T.MeshLambertMaterial({ map: t, alphaTest: 0.45, side: T.DoubleSide, color: 0xfff0d8, emissive: 0x5a3e24 }); noOutline(m);
      const im = new T.InstancedMesh(geo, m, n); im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false;
      const data = []; for (let i = 0; i < n; i++) { let z; do { z = z0 + rnd() * (z1 - z0); } while (Math.abs(z) < 1.5); data.push({ x: x0 + rnd() * (x1 - x0), z, s: 0.22 + rnd() * 0.4, ry: rnd() * 3.14, ph: rnd() * 6.28 }); }
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(), ps = new T.Vector3();
      im.userData.update = (t) => { data.forEach((d, i) => { e.set(0, d.ry, Math.sin(t * 1.4 + d.ph + d.x * 0.2) * 0.12 + 0.05); q.setFromEuler(e); sc.set(d.s, d.s * 0.9, d.s); ps.set(d.x, 0, d.z); m4.compose(ps, q, sc); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
      im.userData.update(0);
      return im;
    }
    function rock(s, col = '#8b6b58') { const o = mesh(new T.IcosahedronGeometry(s, 0), toon(col)); o.scale.set(1, rr(0.45, 0.7), rr(0.8, 1.2)); o.rotation.y = rr(0, 3); return o; }
    /** a bare, twisted tree: tubes along curves, three levels of branches */
    function deadTree(h, seed) {
      const rnd = rand(seed), m = toon(0x4d3527), g = new T.Group();
      const branch = (p0, dir, len, r, lvl) => {
        const pts = [p0.clone()]; let p = p0.clone(), d = dir.clone();
        for (let i = 0; i < 4; i++) { d.add(new T.Vector3((rnd() - 0.5) * 0.5, 0.1, (rnd() - 0.5) * 0.5)).normalize(); p = p.clone().add(d.clone().multiplyScalar(len / 4)); pts.push(p); }
        const curve = new T.CatmullRomCurve3(pts); const tg = new T.TubeGeometry(curve, 10, r, 6, false);
        const pos = tg.attributes.position; // taper towards the tip
        for (let i = 0; i < pos.count; i++) { const k = Math.floor(i / 7) / 10, c = curve.getPointAt(Math.min(1, k)); const v = new T.Vector3().fromBufferAttribute(pos, i).sub(c).multiplyScalar(1 - 0.75 * k).add(c); pos.setXYZ(i, v.x, v.y, v.z); }
        tg.computeVertexNormals(); g.add(mesh(tg, m));
        if (lvl < 3) { const nb = lvl === 0 ? 4 : 3; for (let b = 0; b < nb; b++) { const u = 0.35 + rnd() * 0.6, at = curve.getPointAt(u), nd = curve.getTangentAt(u).add(new T.Vector3((rnd() - 0.5) * 2, 0.4 + rnd() * 0.6, (rnd() - 0.5) * 2)).normalize(); branch(at, nd, len * (0.45 + rnd() * 0.2), r * 0.5, lvl + 1); } }
      };
      branch(new T.Vector3(0, -0.1, 0), new T.Vector3(0.1, 1, 0), h, h * 0.045, 0);
      return g;
    }

    // ---------------- debris of a lost battle ----------------
    const bright = toon(0xb8c2d0, { thick: 0.0028 }), steel = toon(0x8a94a6), steelD = toon(0x5e6676), rust = toon(0x8c5a3c), leather = toon(0x4a3428), wood = toon(0x6b4a33), bone_ = toon(0xe9ddc2);
    function sword(len = 1.0, broken = false) {
      const g = new T.Group(), bl = broken ? len * 0.55 : len;
      g.add(mesh(new T.BoxGeometry(0.028, bl, 0.007), bright, 0, -bl / 2, 0));
      if (broken) { const tip = mesh(new T.ConeGeometry(0.028, 0.09, 3), steel, 0, -bl - 0.03, 0); tip.rotation.z = 0.5; tip.scale.set(1, 1, 0.4); g.add(tip); }
      else { const tip = mesh(new T.ConeGeometry(0.019, 0.1, 4), steel, 0, -bl - 0.05, 0); tip.rotation.x = Math.PI; tip.scale.set(1, 1, 0.35); g.add(tip); }
      g.add(mesh(new T.BoxGeometry(0.06, 0.03, 0.22), steelD, 0, 0.0, 0));
      g.add(mesh(new T.CylinderGeometry(0.018, 0.018, 0.17, 8), leather, 0, 0.1, 0));
      g.add(mesh(new T.SphereGeometry(0.032, 10, 8), steelD, 0, 0.2, 0));
      g.userData.len = bl + (broken ? 0.06 : 0.1); return g;
    }
    function spear(len = 2.2) { const g = new T.Group(); g.add(rod([0, 0, 0], [0, len, 0], 0.022, wood)); const h = mesh(new T.ConeGeometry(0.045, 0.24, 4), steel, 0, len + 0.12, 0); h.scale.set(1, 1, 0.4); g.add(h); return g; }
    /** a cloth with a torn edge (banner, cape, scarf): a plane whose vertices a function moves every frame */
    function cloth(w, h, sx, sy, color, tornSeed, pattern) {
      const rnd = rand(tornSeed);
      const c = cv(256, 384, (x, W, H) => {
        x.fillStyle = color; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 260; i++) daub(x, rnd() * W, rnd() * H, 8 + rnd() * 30, 3 + rnd() * 10, rnd() * 3, rnd() < 0.6 ? '#000' : '#fff', 0.04 + rnd() * 0.08);
        if (pattern) pattern(x, W, H);
        x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
        x.beginPath(); x.moveTo(0, H); let px = 0; while (px < W) { const nx = px + 10 + rnd() * 26; x.lineTo(nx, H - (14 + rnd() * 70)); px = nx; } x.lineTo(W, H); x.closePath(); x.fill();
        for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(W * (0.2 + rnd() * 0.6), H * (0.45 + rnd() * 0.35), 6 + rnd() * 14, 4 + rnd() * 10, rnd() * 3, 0, Math.PI * 2); x.fill(); }
        x.beginPath(); x.moveTo(W, 0); for (let yy = 0; yy < H; yy += 18) x.lineTo(W - rnd() * 10, yy); x.lineTo(W, H); x.fill();
      });
      const m = toon(0xffffff, { map: tex(c), side: T.DoubleSide, alphaTest: 0.5, noCache: true, noOutline: true });
      const geo = new T.PlaneGeometry(w, h, sx, sy); geo.translate(0, -h / 2, 0);
      const o = mesh(geo, m); o.castShadow = true;
      const rest = Float32Array.from(geo.attributes.position.array);
      /** fn(u, v, out) — u ∈ [-0.5, 0.5] across, v ∈ [0, 1] down from the top edge; writes local x, y, z */
      o.userData.drape = (fn) => { const p = geo.attributes.position, out = [0, 0, 0]; for (let i = 0; i < p.count; i++) { const u = rest[i * 3] / w, v = Math.min(1, Math.max(0, -rest[i * 3 + 1] / h)); fn(u, v, out); p.setXYZ(i, out[0], out[1], out[2]); } p.needsUpdate = true; geo.computeVertexNormals(); };
      return o;
    }
    function shield() { const g = new T.Group(); const d = mesh(new T.CylinderGeometry(0.34, 0.34, 0.05, 20, 1, false, 0, Math.PI * 1.55), toon(0x6d3b34)); g.add(d); g.add(mesh(new T.CylinderGeometry(0.08, 0.08, 0.08, 12), steelD, 0, 0.04, 0)); return g; }
    function helmetOnGround() { const g = new T.Group(); const h = mesh(new T.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), steelD); h.rotation.z = 1.9; g.add(h); return g; }

    // ---------------- the skeleton knight ----------------
    function knight() {
      const boneM = toon(0xf0e4c8, { map: paintTex(256, 256, '#f0e4c8', ['#ddcca8', '#f8f0dc', '#d2bf98'], 120, 24) });
      const armorM = toon(0xffffff, { map: paintTex(256, 256, '#8c97a8', ['#9aa5b6', '#7f8a9b', '#a3aebf', '#9a6a4a', '#86909f'], 140, 22) });
      const clothM = toon(0x5d4434), dark = toon(0x1a1013, { noOutline: true });
      const ember = new T.MeshBasicMaterial({ color: 0xffb060 }); ember.userData.outlineParameters = { visible: false };
      const sph = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = mesh(new T.SphereGeometry(r, 16, 12), m, x, y, z); o.scale.set(sx, sy, sz); return o; };

      const root = new T.Group(), hips = new T.Group(); hips.position.y = 0.98; root.add(hips);
      // pelvis, a rag of a loincloth, one surviving tasset
      hips.add(sph(0.13, boneM, 0, 0, 0, 0.75, 0.55, 1.3));
      const loin = mesh(new T.BoxGeometry(0.03, 0.3, 0.2), clothM, 0.1, -0.12, 0); loin.rotation.z = -0.12; hips.add(loin);
      const tas = mesh(new T.SphereGeometry(0.17, 12, 8, Math.PI * 1.05, Math.PI * 0.5, Math.PI * 0.35, Math.PI * 0.3), armorM, 0, -0.02, 0); tas.scale.set(1, 1.3, 1); hips.add(tas);
      // legs: bone thighs, knee cops, slim greaves over the shins, rounded sabatons
      const legs = [-1, 1].map((sd) => {
        const hipP = new T.Group(); hipP.position.set(0, -0.03, sd * 0.1); hips.add(hipP);
        hipP.add(sph(0.045, boneM, 0, 0, 0)); hipP.add(bone([0, 0, 0], [0, -0.43, 0], 0.028, boneM));
        const knee = new T.Group(); knee.position.y = -0.44; hipP.add(knee);
        knee.add(sph(0.06, armorM, 0.025, 0, 0, 1, 0.9, 1));
        knee.add(mesh(new T.CylinderGeometry(0.056, 0.042, 0.3, 12), armorM, 0, -0.2, 0));
        knee.add(bone([0, -0.02, 0], [0, -0.4, 0], 0.022, boneM));
        const foot = new T.Group(); foot.position.y = -0.41; knee.add(foot);
        foot.add(sph(0.065, armorM, 0.06, -0.012, 0, 1.75, 0.55, 0.85));
        return { hipP, knee, foot };
      });
      // torso: spine, a ribcage you can see, half a cuirass on the far side and a shoulder strap
      const torso = new T.Group(); torso.position.y = 0.06; hips.add(torso);
      for (let i = 0; i < 7; i++) torso.add(sph(0.026, boneM, -0.06, 0.05 + i * 0.075, 0));
      for (let i = 0; i < 5; i++) { const r = mesh(new T.TorusGeometry(1, 0.1, 6, 22, 5.0), boneM); const sc = 0.16 - Math.abs(i - 1.6) * 0.014; r.scale.set(sc * 0.9, sc * 1.25, sc); r.rotation.set(Math.PI / 2, 0, 0.64); r.position.set(-0.03, 0.2 + i * 0.062, 0); torso.add(r); }
      torso.add(bone([0.08, 0.22, 0], [0.1, 0.44, 0], 0.016, boneM));                    // sternum
      const bp = mesh(new T.SphereGeometry(0.23, 18, 12, Math.PI * 0.95, Math.PI * 0.62, Math.PI * 0.22, Math.PI * 0.42), armorM); bp.scale.set(0.85, 1.25, 1.0); bp.position.set(-0.02, 0.33, 0); torso.add(bp);
      const strap = mesh(new T.BoxGeometry(0.035, 0.42, 0.02), clothM, 0.0, 0.36, 0.06); strap.rotation.x = -0.45; torso.add(strap);
      for (const sd of [-1, 1]) torso.add(bone([-0.02, 0.5, sd * 0.03], [-0.02, 0.5, sd * 0.22], 0.016, boneM));   // collarbones
      // arms: bone, a pauldron on the near (sword) shoulder, a vambrace on the other forearm
      const arms = [-1, 1].map((sd) => {
        const sh = new T.Group(); sh.position.set(-0.02, 0.5, sd * 0.24); torso.add(sh);
        sh.add(sph(0.045, boneM, 0, 0, 0)); sh.add(bone([0, 0, 0], [0, -0.3, 0], 0.022, boneM));
        if (sd > 0) { const pa = mesh(new T.SphereGeometry(0.115, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), armorM); pa.scale.set(1.1, 0.75, 1.0); pa.position.set(0, 0.025, 0.015); pa.rotation.x = 0.35; sh.add(pa);
          const pa2 = mesh(new T.SphereGeometry(0.105, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), armorM); pa2.position.set(0, -0.05, 0.035); pa2.rotation.x = 0.55; sh.add(pa2); }
        const el = new T.Group(); el.position.y = -0.3; sh.add(el);
        el.add(sph(0.032, boneM, 0, 0, 0)); el.add(bone([0, 0, 0], [0, -0.26, 0], 0.019, boneM));
        if (sd < 0) el.add(mesh(new T.CylinderGeometry(0.044, 0.036, 0.17, 10), armorM, 0, -0.15, 0));
        const hand = new T.Group(); hand.position.y = -0.28; el.add(hand);
        hand.add(sph(0.034, boneM, 0, -0.02, 0, 1, 1.25, 0.8));
        for (let f = 0; f < 3; f++) hand.add(bone([0.01, -0.04, (f - 1) * 0.016], [0.02, -0.085, (f - 1) * 0.018], 0.008, boneM));
        return { sh, el, hand };
      });
      // neck and head: a skull with deep sockets and ember eyes, under a wide-brimmed, dented kettle hat
      const neck = new T.Group(); neck.position.set(0.0, 0.56, 0); torso.add(neck);
      for (let i = 0; i < 3; i++) neck.add(sph(0.024, boneM, 0.01 * i, 0.03 + i * 0.04, 0));
      const head = new T.Group(); head.position.set(0.03, 0.2, 0); neck.add(head);
      head.add(sph(0.13, boneM, 0, 0.02, 0, 1.08, 1.0, 0.92));
      head.add(sph(0.085, boneM, 0.055, -0.085, 0, 1.0, 0.7, 0.95));                     // cheek and jaw
      const jaw = mesh(new T.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), boneM); jaw.position.set(0.06, -0.1, 0); jaw.scale.set(1.1, 0.7, 0.95); head.add(jaw);
      const eyes = [];
      for (const sd of [-1, 1]) { const so = sph(0.046, dark, 0.1, 0.005, sd * 0.05, 0.55, 0.95, 0.95); so.castShadow = false; head.add(so);
        const em = new T.Mesh(new T.SphereGeometry(0.014, 8, 6), ember); em.position.set(0.122, 0.0, sd * 0.05); head.add(em); eyes.push(em); }
      const nose = sph(0.02, dark, 0.128, -0.05, 0, 0.5, 1.1, 0.75); nose.castShadow = false; head.add(nose);
      for (let i = -2; i <= 2; i++) head.add(mesh(new T.BoxGeometry(0.014, 0.024, 0.016), boneM, 0.125 - Math.abs(i) * 0.012, -0.09, i * 0.022));
      const hat = new T.Group(); hat.position.set(-0.02, 0.085, 0); hat.rotation.set(0.18, 0, 0.1); head.add(hat);
      hat.add(mesh(new T.SphereGeometry(0.15, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), armorM));
      const brim = mesh(new T.CylinderGeometry(0.255, 0.27, 0.025, 28), armorM, 0, 0.005, 0); brim.scale.set(1, 1, 0.92); hat.add(brim);
      const dent = sph(0.04, steelD, 0.06, 0.12, -0.06, 1, 0.4, 1); dent.castShadow = false; hat.add(dent);
      // the cloak, gathered at the shoulders
      const cape = cloth(0.6, 1.0, 8, 14, '#7d2f30', 77, (x, W, H) => { x.strokeStyle = 'rgba(230,190,120,0.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(8, H * 0.86); x.lineTo(W - 8, H * 0.86); x.stroke(); });
      cape.position.set(-0.12, 0.53, 0); cape.rotation.y = Math.PI / 2; torso.add(cape);
      // the broken sword, held by the right hand, its tip dragging on the ground (placed in root space every frame)
      const sw = sword(1.0, true); root.add(sw);
      return { root, hips, torso, legs, arms, neck, head, eyes, cape, sword: sw, ember };
    }

    // ---------------- the crow ----------------
    function crow() {
      const featherM = toon(0x2a2d44, { thick: 0.0032 }), beakM = toon(0x3a3a44, { thick: 0.0026 }), legM = toon(0x2c2c34, { noOutline: true });
      const root = new T.Group(), body = new T.Group(); body.position.y = 0.12; root.add(body);
      const b = mesh(new T.SphereGeometry(0.1, 18, 12), featherM); b.scale.set(1.55, 0.82, 0.8); body.add(b);
      const chest = mesh(new T.SphereGeometry(0.075, 14, 10), featherM, 0.07, 0.02, 0); chest.scale.set(1, 1.05, 0.95); body.add(chest);
      const head = new T.Group(); head.position.set(0.15, 0.075, 0); body.add(head);
      const hm = mesh(new T.SphereGeometry(0.052, 16, 12), featherM); hm.scale.set(1.15, 0.95, 0.9); head.add(hm);
      const up = new T.Group(); up.position.set(0.045, -0.002, 0); head.add(up);
      const ub = mesh(new T.ConeGeometry(0.022, 0.1, 8), beakM, 0.048, 0, 0); ub.rotation.z = -Math.PI / 2; ub.scale.set(1, 1, 0.7); up.add(ub);
      const lo = new T.Group(); lo.position.set(0.045, -0.014, 0); head.add(lo);
      const lb = mesh(new T.ConeGeometry(0.016, 0.085, 8), beakM, 0.04, 0, 0); lb.rotation.z = -Math.PI / 2; lb.scale.set(1, 1, 0.65); lo.add(lb);
      const eyeM = new T.MeshBasicMaterial({ color: 0xf6ecd8 }); eyeM.userData.outlineParameters = { visible: false };
      for (const sd of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.008, 8, 6), eyeM); e.position.set(0.03, 0.016, sd * 0.042); head.add(e); }
      const tail = new T.Group(); tail.position.set(-0.14, 0.005, 0); body.add(tail);
      for (let i = -2; i <= 2; i++) { const f = mesh(new T.BoxGeometry(0.17, 0.008, 0.032), featherM, -0.085, 0, i * 0.017); f.rotation.y = i * 0.1; tail.add(f); }
      // a wing seen from above: canvas x runs root→tip (span), canvas top is the leading edge; rounded secondaries, five splayed primaries
      const wingShape = cv(256, 128, (x, w, h) => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, h * 0.12); x.quadraticCurveTo(w * 0.35, 0, w * 0.66, h * 0.1); x.lineTo(w * 0.66, h * 0.62);
        for (let i = 0; i < 6; i++) { const x0 = w * (0.66 - i * 0.11), x1 = w * (0.66 - (i + 1) * 0.11); x.quadraticCurveTo((x0 + x1) / 2, h * 0.98, x1, h * 0.8); } x.lineTo(0, h * 0.8); x.closePath(); x.fill();
        for (let i = 0; i < 5; i++) { x.save(); x.translate(w * 0.58, h * (0.16 + i * 0.1)); x.rotate(-0.1 + i * 0.13); x.beginPath(); x.ellipse(w * 0.2, 0, w * (0.21 - i * 0.016), h * 0.055, 0, 0, Math.PI * 2); x.fill(); x.restore(); } });
      const wingM = toon(0x2a2d44, { alphaMap: tex(wingShape, false), alphaTest: 0.5, side: T.DoubleSide, noCache: true, noOutline: true });
      const wings = [-1, 1].map((sd) => {
        const pv = new T.Group(); pv.position.set(0.04, 0.045, sd * 0.06); body.add(pv);
        const geo = new T.PlaneGeometry(0.4, 0.16); geo.translate(0.2, 0, 0); geo.rotateX(-Math.PI / 2); geo.rotateY(-Math.PI / 2); geo.translate(-0.03, 0, 0); if (sd < 0) geo.scale(1, 1, -1);
        pv.add(mesh(geo, wingM)); return pv;
      });
      for (const sd of [-1, 1]) { root.add(rod([0.015, 0.05, sd * 0.025], [0.0, 0.0, sd * 0.025], 0.006, legM)); root.add(mesh(new T.BoxGeometry(0.055, 0.006, 0.02), legM, 0.015, 0.003, sd * 0.025)); }
      return { root, body, head, up, lo, wings, tail };
    }

    // ---------------- dust and motes ----------------
    const soft = tex(cv(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }), false);
    function puffs(n) { const arr = []; for (let i = 0; i < n; i++) { const m = new T.SpriteMaterial({ map: soft, color: 0xd2a47a, transparent: true, depthWrite: false, opacity: 0 }); m.userData.outlineParameters = { visible: false }; const s = new T.Sprite(m); s.visible = false; arr.push(s); } return arr; }
    function motes(n, seed) { const rnd = rand(seed), geo = new T.BufferGeometry(), p = new Float32Array(n * 3), base = []; for (let i = 0; i < n; i++) base.push([rnd() * 30 - 15, rnd() * 4, rnd() * 16 - 8, rnd() * 6.28]); geo.setAttribute('position', new T.BufferAttribute(p, 3));
      const m = new T.PointsMaterial({ map: soft, size: 0.045, color: 0xffd09a, transparent: true, opacity: 0.45, depthWrite: false, blending: T.AdditiveBlending }); m.userData.outlineParameters = { visible: false };
      const o = new T.Points(geo, m); o.frustumCulled = false;
      o.userData.update = (t, cx) => { base.forEach((b, i) => { p[i * 3] = cx + ((b[0] + t * 0.25 + Math.sin(t * 0.3 + b[3]) * 0.6) % 30 + 30) % 30 - 15; p[i * 3 + 1] = 0.2 + ((b[1] + t * 0.06) % 4); p[i * 3 + 2] = b[2] + Math.sin(t * 0.5 + b[3]) * 0.3; }); geo.attributes.position.needsUpdate = true; };
      return o; }
    const glowTex = soft;

    return { toon, mesh, grp, bone, rod, cv, tex, daub, paintTex, sky, hills, ground, road, grass, rock, deadTree, sword, spear, cloth, shield, helmetOnGround, knight, crow, puffs, motes, glowTex, steel, steelD, rust, leather, wood, bone_ };
  },
};
