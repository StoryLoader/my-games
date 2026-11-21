/*
 * atl.js — the world of 「아틀란티스 전설」 (storyboard.md → 월드 바이블 「청동의 바다」): a sea that moves, the ring city
 * of Plato's Critias in real 3D (three rings of water, two of land, walls of brass, tin and orichalcum, the temple of
 * Poseidon), triremes, and a black-figure amphora whose painted band carries the people of the story. All drawn here in
 * code; deterministic (rand(seed) only).
 */
(function () {
  const ATL = {};
  ATL.init = function (T, rand) {
    const TAU = Math.PI * 2, api = {};
    const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); if (draw) draw(x, w, h); return c; };
    const tex = (c, rep) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
    api.cv = cv; api.tex = tex;

    // ---------------- the sky: a gradient dome with a sun, toned by mood ----------------
    api.sky = () => {
      const u = { uTop: { value: new T.Color(0x0e2b45) }, uHor: { value: new T.Color(0xe9a36a) }, uSun: { value: new T.Vector3(0, 0.08, -1).normalize() }, uSunCol: { value: new T.Color(0xffd29a) }, uSunSize: { value: 0.02 }, uFlash: { value: 0 } };
      const m = new T.ShaderMaterial({ uniforms: u, side: T.BackSide, depthWrite: false, fog: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol; uniform float uSunSize, uFlash; varying vec3 vD;
          void main(){ float h = clamp(vD.y, -0.2, 1.0); vec3 c = mix(uHor, uTop, pow(max(h, 0.0), 0.55));
            if (vD.y < 0.0) c = mix(uHor, uHor * 0.6, clamp(-vD.y * 5.0, 0.0, 1.0));
            float s = max(dot(normalize(vD), uSun), 0.0); c += uSunCol * (smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.6, s) * 1.2 + pow(s, 60.0) * 0.5 + pow(s, 8.0) * 0.12);
            c = mix(c, vec3(0.85, 0.9, 1.0), uFlash); gl_FragColor = vec4(c, 1.0); }` });
      const s = new T.Mesh(new T.SphereGeometry(900, 32, 16), m); s.renderOrder = -10; s.userData.u = u; return s;
    };

    // ---------------- the sea: analytic waves, fresnel, a sun glint ----------------
    api.ocean = (size = 1600) => {
      const u = { uTime: { value: 0 }, uAmp: { value: 0.12 }, uDeep: { value: new T.Color(0x0b2a3c) }, uShal: { value: new T.Color(0x2e7c8c) }, uSky: { value: new T.Color(0xd99a6a) }, uSun: { value: new T.Vector3(0, 0.1, -1).normalize() }, uSunCol: { value: new T.Color(0xffd7a0) }, uFogC: { value: new T.Color(0x9fb6c2) }, uFogN: { value: 60 }, uFogF: { value: 600 }, uUnder: { value: 0 } };
      const g = new T.PlaneGeometry(size, size, 220, 220); g.rotateX(-Math.PI / 2);
      const m = new T.ShaderMaterial({ uniforms: u, transparent: false, side: T.DoubleSide,
        vertexShader: `uniform float uTime, uAmp; varying vec3 vW; varying vec3 vN;
          vec3 wave(vec2 p){ float h = 0.0; vec2 d = vec2(0.0);
            vec2 D[4]; D[0]=normalize(vec2(1.0,0.3)); D[1]=normalize(vec2(-0.4,1.0)); D[2]=normalize(vec2(0.7,-0.8)); D[3]=normalize(vec2(-1.0,-0.2));
            float F[4]; F[0]=0.18; F[1]=0.31; F[2]=0.52; F[3]=0.9; float A[4]; A[0]=1.0; A[1]=0.6; A[2]=0.35; A[3]=0.18;
            for(int i=0;i<4;i++){ float ph = dot(D[i], p) * F[i] + uTime * (0.8 + F[i]); h += A[i] * sin(ph); d += A[i] * F[i] * cos(ph) * D[i]; }
            return vec3(h, d); }
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec3 wv = wave(w.xz); w.y += wv.x * uAmp; vW = w.xyz; vN = normalize(vec3(-wv.y * uAmp, 1.0, -wv.z * uAmp)); gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform vec3 uDeep, uShal, uSky, uSun, uSunCol, uFogC; uniform float uFogN, uFogF, uTime, uUnder; varying vec3 vW; varying vec3 vN;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
          void main(){ vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN + vec3(0.04*sin(vW.x*1.7+uTime*1.3), 0.0, 0.04*cos(vW.z*1.9-uTime*1.1)));
            float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
            vec3 c = mix(uDeep, uShal, 0.25 + 0.35 * max(N.y - 0.9, 0.0) * 10.0);
            c = mix(c, uSky, clamp(fr * 0.85, 0.0, 1.0));
            vec3 R = reflect(-V, N); float sp = pow(max(dot(R, uSun), 0.0), 220.0) * 2.5 + pow(max(dot(R, uSun), 0.0), 20.0) * 0.18; c += uSunCol * sp;
            if (uUnder > 0.5) { c = mix(uShal * 1.6, vec3(0.75, 0.95, 1.0), pow(max(dot(-V, vec3(0.0,1.0,0.0)), 0.0), 3.0) * 0.6 + 0.2 * sin(vW.x * 0.8 + uTime) * sin(vW.z * 0.7 - uTime)); }
            float d = length(cameraPosition - vW); float f = smoothstep(uFogN, uFogF, d); c = mix(c, uFogC, f);
            gl_FragColor = vec4(c, 1.0); }` });
      const mesh = new T.Mesh(g, m); mesh.userData.u = u; return mesh;
    };

    // ---------------- textures: marble, ground, caustics ----------------
    const noiseTex = (w, h, base, cols, n, seed, rep) => tex(cv(w, h, (x) => { const r = rand(seed); x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.globalAlpha = 0.05 + r() * 0.12; x.beginPath(); x.ellipse(r() * w, r() * h, 2 + r() * 30, 2 + r() * 14, r() * 3, 0, TAU); x.fill(); } }), rep);
    api.marbleTex = noiseTex(512, 512, '#e9e4da', ['#cfc6b6', '#f7f4ee', '#b9ad99'], 1400, 3, [4, 4]);
    api.groundTex = noiseTex(512, 512, '#a99a74', ['#8c8a5a', '#c2b28a', '#6f7a48', '#d9c9a0'], 1800, 5, [10, 10]);
    api.causticTex = tex(cv(512, 512, (x, w, h) => { const r = rand(9); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 3; for (let i = 0; i < 90; i++) { x.beginPath(); const cx = r() * w, cy = r() * h, rr = 14 + r() * 40; for (let k = 0; k <= 12; k++) { const a = k / 12 * TAU, q = rr * (0.7 + 0.5 * r()); k ? x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : x.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.stroke(); } }), [6, 6]);
    api.glowTex = tex(cv(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }));

    // ---------------- the ring city (Critias 113c–117e; 1 unit = 1 stade) ----------------
    // island 5 stades across; water rings 1, 2, 3 stades; land rings 2, 3 stades — from the centre outward:
    // island r 2.5 · water 2.5–3.5 · land 3.5–5.5 · water 5.5–7.5 · land 7.5–10.5 · water 10.5–13.5 · the plain beyond
    const R = { isl: 2.5, w1: [2.5, 3.5], l1: [3.5, 5.5], w2: [5.5, 7.5], l2: [7.5, 10.5], w3: [10.5, 13.5], plain: 13.5 };
    api.R = R;
    api.city = () => {
      const g = new T.Group(), r0 = rand(77);
      const landMat = new T.MeshStandardMaterial({ map: api.groundTex, roughness: 0.95, color: 0xffffff });
      const marble = new T.MeshStandardMaterial({ map: api.marbleTex, roughness: 0.55, color: 0xffffff });
      const roof = new T.MeshStandardMaterial({ color: 0xb4623e, roughness: 0.8 });
      const brass = new T.MeshStandardMaterial({ color: 0xc9a04a, metalness: 0.35, roughness: 0.4, emissive: 0x2a1c06, emissiveIntensity: 0.5 });
      const tin = new T.MeshStandardMaterial({ color: 0xc8cdd2, metalness: 0.35, roughness: 0.35, emissive: 0x1c2024, emissiveIntensity: 0.5 });
      const ori = new T.MeshStandardMaterial({ color: 0xe0703e, metalness: 0.4, roughness: 0.3, emissive: 0x7a2208, emissiveIntensity: 0.4 });
      g.userData.mats = { landMat, marble, roof, brass, tin, ori };
      const ring = (a, b, h, mat, segs = 128) => { const s = new T.Shape(); s.absarc(0, 0, b, 0, TAU, false); const hole = new T.Path(); hole.absarc(0, 0, a, 0, TAU, true); s.holes.push(hole); const geo = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: segs }); geo.rotateX(-Math.PI / 2); const m = new T.Mesh(geo, mat); return m; };
      const disc = (r, h, mat) => { const geo = new T.CylinderGeometry(r, r * 1.02, h, 96); geo.translate(0, h / 2, 0); return new T.Mesh(geo, mat); };
      const lands = [];
      const isl = disc(R.isl, 0.55, landMat); g.add(isl); lands.push(isl);
      const l1 = ring(R.l1[0], R.l1[1], 0.42, landMat); g.add(l1); lands.push(l1);
      const l2 = ring(R.l2[0], R.l2[1], 0.36, landMat); g.add(l2); lands.push(l2);
      const farm = new T.MeshStandardMaterial({ map: api.groundTex, roughness: 1, color: 0x8f9a62 });   // the plain was farmland (Critias 118a–e)
      const plain = ring(R.plain, 30, 0.3, farm, 160); g.add(plain); lands.push(plain);
      // the canal from the open sea to the outer ring (to the south, +z), cut as a gap: draw it as water over the plain
      const canal = new T.Mesh(new T.PlaneGeometry(1.0, 16.6), new T.MeshStandardMaterial({ color: 0x1a4c5a, roughness: 0.7, metalness: 0.0 })); canal.rotation.x = -Math.PI / 2; canal.position.set(0, 0.31, R.plain + 8.25); g.add(canal);
      // the walls: brass round the outermost ring, tin round the next, orichalcum round the citadel
      const wall = (r, h, mat) => { const geo = new T.CylinderGeometry(r, r, h, 160, 1, true); geo.translate(0, h / 2, 0); const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: mat.color, metalness: mat.metalness, roughness: mat.roughness, emissive: mat.emissive, emissiveIntensity: mat.emissiveIntensity, side: T.DoubleSide })); return m; };
      const walls = { brass: wall(R.plain + 0.05, 0.6, brass), tin: wall(R.l2[1] - 0.05, 0.75, tin), ori: wall(R.isl - 0.05, 0.9, ori) };
      walls.brass.position.y = 0.3; walls.tin.position.y = 0.36; walls.ori.position.y = 0.55; Object.values(walls).forEach((w) => g.add(w));
      // battlements: small instanced blocks on top of each wall
      const crenel = (r, y, mat, n) => { const im = new T.InstancedMesh(new T.BoxGeometry(0.12, 0.14, 0.08), mat, n); const M = new T.Matrix4(); for (let i = 0; i < n; i++) { const a = i / n * TAU; M.makeRotationY(-a); M.setPosition(Math.cos(a) * r, y, Math.sin(a) * r); im.setMatrixAt(i, M); } return im; };
      g.add(crenel(R.plain + 0.05, 0.97, brass, 420), crenel(R.l2[1] - 0.05, 1.18, tin, 300), crenel(R.isl - 0.05, 1.52, ori, 90));
      // bridges over the water rings (one north, one south), towers and gates at the bridges
      [[R.w1, 0.5], [R.w2, 0.45], [R.w3, 0.4]].forEach(([w, y]) => [0, Math.PI].forEach((a) => { const len = w[1] - w[0] + 0.3, b = new T.Mesh(new T.BoxGeometry(0.5, 0.12, len), marble); b.position.set(Math.sin(a) * (w[0] + w[1]) / 2, y, Math.cos(a) * (w[0] + w[1]) / 2); b.rotation.y = a; g.add(b); }));
      // buildings: houses and halls on the land rings and the island
      const houses = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), marble, 900), roofs = new T.InstancedMesh(new T.ConeGeometry(0.75, 0.5, 4), roof, 900);
      let n = 0; const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3();
      const put = (r, a, base, w, d, h) => { if (n >= 900) return; Q.setFromAxisAngle(new T.Vector3(0, 1, 0), -a + (r0() - 0.5) * 0.2); P.set(Math.cos(a) * r, base + h / 2, Math.sin(a) * r); S.set(w, h, d); M.compose(P, Q, S); houses.setMatrixAt(n, M); P.y = base + h + 0.12; S.set(w * 0.95, 0.5, d * 0.95); Q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 4)); M.compose(P, Q, S); roofs.setMatrixAt(n, M); n++; };
      for (let i = 0; i < 220; i++) { const a = r0() * TAU; if (Math.abs(Math.sin(a)) < 0.06) continue; put(R.l1[0] + 0.35 + r0() * 1.3, a, 0.42, 0.25 + r0() * 0.3, 0.2 + r0() * 0.25, 0.18 + r0() * 0.3); }
      for (let i = 0; i < 360; i++) { const a = r0() * TAU; if (Math.abs(Math.sin(a)) < 0.05) continue; put(R.l2[0] + 0.35 + r0() * 2.4, a, 0.36, 0.25 + r0() * 0.35, 0.2 + r0() * 0.3, 0.15 + r0() * 0.28); }
      for (let i = 0; i < 260; i++) { const a = r0() * TAU, rr = R.plain + 0.6 + r0() * 6; if (Math.abs(Math.cos(a)) < 0.04 && Math.sin(a) > 0) continue; put(rr, a, 0.3, 0.22 + r0() * 0.25, 0.2 + r0() * 0.25, 0.12 + r0() * 0.2); }
      houses.count = roofs.count = n; g.add(houses, roofs);
      // the temple of Poseidon on the island: a platform, a ring of columns, an orichalcum roof
      const temple = new T.Group(); temple.position.y = 0.55; g.add(temple);
      const plat = new T.Mesh(new T.BoxGeometry(1.6, 0.18, 1.0), marble); plat.position.y = 0.09; temple.add(plat);
      const colG = new T.CylinderGeometry(0.035, 0.04, 0.55, 10); const cols = new T.InstancedMesh(colG, marble, 26); let ci = 0;
      for (let i = 0; i < 9; i++) for (const zz of [-0.4, 0.4]) { M.makeTranslation(-0.7 + i * 0.175, 0.45, zz); cols.setMatrixAt(ci++, M); }
      for (let i = 1; i < 5; i++) for (const xx of [-0.7, 0.7]) { M.makeTranslation(xx, 0.45, -0.4 + i * 0.16); cols.setMatrixAt(ci++, M); }
      cols.count = ci; temple.add(cols);
      const cella = new T.Mesh(new T.BoxGeometry(1.1, 0.5, 0.5), marble); cella.position.y = 0.43; temple.add(cella);
      const rf = new T.Mesh(new T.CylinderGeometry(0.02, 0.62, 0.3, 4, 1), ori); rf.rotation.y = Math.PI / 4; rf.scale.set(1.45, 1, 0.85); rf.position.y = 0.88; temple.add(rf);
      const sacred = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 0.6, 12), ori); sacred.position.set(0, 0.48, 0.7); temple.add(sacred);   // the pillar of the law
      // mountains to the north of the plain (Critias: sheltered from the north by mountains)
      const mtn = new T.MeshStandardMaterial({ color: 0x5f6b56, roughness: 1, flatShading: true });
      for (let i = 0; i < 16; i++) {   // low, weathered ridges along the northern edge of the plain
        const a = -Math.PI / 2 + (i / 15 - 0.5) * 2.4, rr = 30 + r0() * 8, h = 2.5 + r0() * 4.5, geo = new T.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), pos = geo.attributes.position, rn = rand(300 + i);
        for (let k = 0; k < pos.count; k++) { const f = 1 + 0.18 * (rn() - 0.5); pos.setXYZ(k, pos.getX(k) * f, pos.getY(k) * (0.8 + 0.4 * rn()), pos.getZ(k) * f); } geo.computeVertexNormals();
        const c = new T.Mesh(geo, mtn); c.scale.set(6 + r0() * 6, h, 4 + r0() * 4); c.rotation.y = a; c.position.set(Math.cos(a) * rr, 0.1, Math.sin(a) * rr); g.add(c); }
      g.userData.parts = { lands, walls, temple, houses, roofs, canal, sacred }; return g;
    };

    // ---------------- triremes ----------------
    api.ships = (n, seed, place, scale = 1) => {
      const hull = new T.Shape(); hull.moveTo(-1, 0.05); hull.quadraticCurveTo(0, -0.22, 1.05, 0.12); hull.lineTo(1.2, 0.3); hull.lineTo(0.95, 0.16); hull.quadraticCurveTo(0, 0.04, -1.05, 0.2); hull.closePath();
      const hg = new T.ExtrudeGeometry(hull, { depth: 0.22, bevelEnabled: false }); hg.translate(0, 0, -0.11);
      const g = new T.Group(), r = rand(seed);
      const hm = new T.MeshStandardMaterial({ color: 0x2a1e18, roughness: 0.7 }), sm = new T.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.9, side: T.DoubleSide });
      const list = [];
      for (let i = 0; i < n; i++) { const s = new T.Group(); const h = new T.Mesh(hg, hm); s.add(h); const mast = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.8, 5), hm); mast.position.y = 0.5; s.add(mast); const sail = new T.Mesh(new T.PlaneGeometry(0.6, 0.45), sm); sail.position.set(0, 0.55, 0); sail.rotation.y = Math.PI / 2; s.add(sail);
        const oars = new T.InstancedMesh(new T.BoxGeometry(0.01, 0.01, 0.5), hm, 16); const M = new T.Matrix4(); for (let k = 0; k < 16; k++) { M.makeTranslation(-0.7 + (k >> 1) * 0.18, 0.02, (k % 2 ? 1 : -1) * 0.3); oars.setMatrixAt(k, M); } s.add(oars);
        const p = place(i, r); s.position.set(p[0], p[1] || 0, p[2]); s.rotation.y = p[3] || 0; s.scale.setScalar(scale * (0.85 + 0.3 * r())); s.userData.ph = r() * TAU; g.add(s); list.push(s); }
      g.userData.list = list; return g;
    };

    // ---------------- Thera (Santorini): the whole volcano, its caldera ring after the collapse, and an ash column ----------------
    api.thera = () => {
      const g = new T.Group(), r0 = rand(404);
      const rock = new T.MeshStandardMaterial({ color: 0x6e4a3a, roughness: 1, flatShading: true });
      const dark = new T.MeshStandardMaterial({ color: 0x2c2624, roughness: 1, flatShading: true });
      // the ring: a crescent of cliffs (Thera) open to the west, a smaller piece across the gap (Therasia)
      const hf = (ang, rr, r1, r2) => 0.8 + 0.18 * Math.sin(ang * 5 + 1) + 0.1 * Math.sin(ang * 13 + 2) - 0.25 * (rr - r1) / (r2 - r1);   // rim highest at the caldera edge, sloping outward
      const cliff = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: T.DoubleSide });
      // a crescent of land as a height grid: a sheer cliff on the bay side (dark lava below, red tuff, pale pumice on top),
      // a long slope down to the sea outside, the ends dipping under the water
      const prof = (u) => u < 0 ? -1.5 : u < 0.04 ? -1.5 + 2.5 * u / 0.04 : 1 - 0.95 * Math.pow((u - 0.04) / 0.96, 0.8);
      const height = (ang, rr, r1, r2, a0, a1, H) => { const e = Math.min(1, (ang - a0) / 0.18, (a1 - ang) / 0.18); return H * hf(ang, rr, r1, r2) * prof((rr - r1) / (r2 - r1)) * (e < 1 ? 0.3 + 0.7 * e * e * (3 - 2 * e) : 1) - (e < 1 ? (1 - e) * 1.5 : 0); };
      const arc = (r1, r2, a0, a1, H) => { const NA = 220, NR = 16, pos = [], col = [], idx = []; const cLow = new T.Color(0x2e2422), cMid = new T.Color(0x8a4a34), cTop = new T.Color(0xc2a888), c = new T.Color();
        for (let i = 0; i <= NA; i++) { const ang = a0 + (a1 - a0) * i / NA; for (let j = 0; j <= NR; j++) { const u = j === 0 ? -0.02 : j === 1 ? 0.0 : j === 2 ? 0.04 : (j - 2) / (NR - 2) * 1.25; const rr = r1 + u * (r2 - r1);
          const y = height(ang, rr, r1, r2, a0, a1, H); pos.push(Math.cos(ang) * rr, y, Math.sin(ang) * rr);
          if (y < 0.8) c.copy(cLow).lerp(cMid, Math.max(0, y + 0.5) / 1.3); else if (y < H * 0.7) c.copy(cMid).lerp(cTop, (y - 0.8) / (H * 0.7 - 0.8)); else c.copy(cTop); col.push(c.r, c.g, c.b); } }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        const m = new T.Mesh(geo, cliff); m.userData.h = (ang, rr) => height(ang, rr, r1, r2, a0, a1, H); return m; };
      const ringG = new T.Group(); g.add(ringG);
      const main = arc(9, 14, -2.6, 2.3, 4.2), isl2 = arc(9.4, 12.5, 2.62, 3.25, 2.8);
      ringG.add(main, isl2);
      // the white villages on the rim
      const vil = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.7 }), 260); const M = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), S = new T.Vector3();
      for (let i = 0; i < 260; i++) { const a = -2.2 + r0() * 4.0, rr = 9.35 + r0() * 0.9; Q.setFromAxisAngle(new T.Vector3(0, 1, 0), -a); P.set(Math.cos(a) * rr, main.userData.h(a, rr) + 0.08, Math.sin(a) * rr); const w = 0.25 + r0() * 0.3; S.set(w, 0.22 + r0() * 0.2, w); M.compose(P, Q, S); vil.setMatrixAt(i, M); }
      ringG.add(vil);
      // the young cone in the middle of the bay (Nea Kameni)
      const kam = new T.Mesh(new T.ConeGeometry(2.6, 1.4, 11, 2), dark); kam.position.y = 0.4; ringG.add(kam);
      // before the collapse: one round volcano covering the whole ring
      const cone = new T.Mesh(new T.ConeGeometry(15, 11, 40, 6), rock); { const pos = cone.geometry.attributes.position, rn = rand(9); for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 5.4) { const f = 1 + 0.06 * (rn() - 0.5); pos.setX(i, pos.getX(i) * f); pos.setZ(i, pos.getZ(i) * f); } if (y > 4) pos.setY(i, 4 + (y - 4) * 0.55); } cone.geometry.computeVertexNormals(); }
      cone.position.y = 3.2; g.add(cone);
      // the ash column: puffs that climb and spread into an umbrella
      const puffs = []; const ash = new T.MeshStandardMaterial({ color: 0x6a625c, roughness: 1, flatShading: true, transparent: true, opacity: 0.96 });
      for (let i = 0; i < 90; i++) { const m = new T.Mesh(new T.IcosahedronGeometry(1, 1), ash); m.userData = { f: i / 90, a: r0() * TAU, w: r0(), sp: 0.6 + r0() * 0.8 }; g.add(m); puffs.push(m); }
      const fire = new T.PointLight(0xff6a2a, 0, 80, 1.5); fire.position.y = 9; g.add(fire);
      /** k: 0 = no eruption … 1 = the full column; fade: 1 = gone */
      g.userData.erupt = (k, t, fade = 0) => { fire.intensity = 400 * k * (1 - fade) * (0.8 + 0.2 * Math.sin(t * 13)); puffs.forEach((m) => { const u = m.userData, H = 70 * k, y = 7 + u.f * H, spread = y > 50 ? (y - 50) * 1.2 : 0, rr = (1.5 + y * 0.12 + spread) * u.w;
        m.visible = k > 0.01 && fade < 0.99; m.position.set(Math.cos(u.a + t * 0.1 * u.sp) * rr, y + Math.sin(t * u.sp + u.a) * 0.6, Math.sin(u.a + t * 0.1 * u.sp) * rr); m.scale.setScalar((2 + y * 0.12 + spread * 0.3) * (1 - 0.3 * fade)); }); ash.opacity = 0.96 * (1 - fade); };
      g.userData.ring = ringG; g.userData.cone = cone; return g;
    };

    // ---------------- the black-figure amphora ----------------
    /** profile (radius, height) of an amphora, from foot to lip */
    const AMP = [[0.34, 0], [0.36, 0.05], [0.22, 0.12], [0.24, 0.2], [0.55, 0.5], [0.72, 0.9], [0.74, 1.15], [0.68, 1.45], [0.5, 1.75], [0.3, 1.92], [0.24, 2.05], [0.24, 2.3], [0.34, 2.42], [0.36, 2.48], [0.3, 2.5]];
    /** the painted band: scenes drawn in black on terracotta, with incised lines and touches of white (women's skin) */
    api.amphora = (scenes) => {
      const W = 4096, H = 1024;
      const band = cv(W, H, (x) => {
        x.fillStyle = '#c8733a'; x.fillRect(0, 0, W, H);
        // grain of fired clay
        const r = rand(21); for (let i = 0; i < 6000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,60,30,0.08)' : 'rgba(240,170,110,0.08)'; x.fillRect(r() * W, r() * H, 2 + r() * 4, 1 + r() * 2); }
        // meander bands top and bottom, a ray band at the base
        const meander = (y) => { x.fillStyle = '#1a1412'; x.fillRect(0, y, W, 6); x.fillRect(0, y + 56, W, 6); x.strokeStyle = '#1a1412'; x.lineWidth = 7; for (let k = 0; k < W; k += 48) { x.beginPath(); x.moveTo(k + 6, y + 50); x.lineTo(k + 6, y + 14); x.lineTo(k + 38, y + 14); x.lineTo(k + 38, y + 40); x.lineTo(k + 18, y + 40); x.lineTo(k + 18, y + 26); x.lineTo(k + 28, y + 26); x.stroke(); } };
        meander(30); meander(H - 100);
        const sw = W / scenes.length;
        scenes.forEach((sc, i) => { x.save(); x.translate(i * sw, 120); sc(x, sw, H - 260, rand(100 + i)); x.restore(); });
      });
      const t = tex(band); t.wrapS = T.RepeatWrapping;
      const pts = AMP.map(([a, b]) => new T.Vector2(a, b));
      const geo = new T.LatheGeometry(pts, 128);
      // remap v so the band covers only the belly (between heights 0.5 and 1.75)
      const pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); uv.setY(i, (y - 0.42) / (1.83 - 0.42)); }
      const glaze = new T.MeshStandardMaterial({ map: t, roughness: 0.42, metalness: 0.05 });
      const black = new T.MeshStandardMaterial({ color: 0x1a1412, roughness: 0.35 });
      glaze.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float vv = vMapUv.y; if (vv < 0.0 || vv > 1.0) diffuseColor.rgb = vec3(0.10, 0.08, 0.07);'); };
      const g = new T.Group(); const body = new T.Mesh(geo, glaze); g.add(body);
      for (const s of [-1, 1]) { const h = new T.Mesh(new T.TorusGeometry(0.28, 0.045, 10, 30, Math.PI * 1.15), black); h.position.set(s * 0.52, 1.95, 0); h.rotation.set(0, Math.PI / 2 * 0, s > 0 ? -1.1 : 1.1 + Math.PI); g.add(h); }
      g.userData.n = scenes.length; g.userData.body = body; return g;
    };

    // ---------------- black-figure painting helpers (canvas) ----------------
    const BF = '#1a1412', INC = 'rgba(200,115,58,0.95)', WHITE = '#efe6d6';
    /** a man in profile facing right: kind 'robe' | 'hoplite' | 'priest' | 'god' | 'king'; x at the feet */
    function man(x, cx, gy, s, kind, o = {}) {
      x.save(); x.translate(cx, gy); x.scale(o.flip ? -s : s, s);
      x.fillStyle = BF; x.strokeStyle = INC; x.lineWidth = 2.2 / s;
      // legs (striding)
      x.beginPath(); x.moveTo(-6, -150); x.lineTo(-34, -4); x.lineTo(-18, 0); x.lineTo(2, -120); x.lineTo(26, -2); x.lineTo(44, -2); x.lineTo(14, -150); x.closePath(); x.fill();
      // torso
      x.beginPath(); x.moveTo(-22, -150); x.quadraticCurveTo(-30, -230, -16, -268); x.lineTo(18, -270); x.quadraticCurveTo(30, -220, 20, -150); x.closePath(); x.fill();
      // head in profile with a long beard
      x.beginPath(); x.ellipse(2, -292, 20, 24, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(18, -296); x.lineTo(28, -286); x.lineTo(18, -282); x.fill();
      if (!o.young) { x.beginPath(); x.moveTo(6, -278); x.quadraticCurveTo(16, -246, 2, -236); x.quadraticCurveTo(-4, -258, 0, -276); x.fill(); }
      // eye (incised) and garment lines
      x.beginPath(); x.arc(10, -298, 3, 0, Math.PI * 2); x.stroke();
      if (kind === 'robe' || kind === 'priest' || kind === 'king' || kind === 'god') { x.beginPath(); x.moveTo(-28, -250); x.quadraticCurveTo(-46, -150, -40, -40); x.lineTo(30, -40); x.quadraticCurveTo(36, -140, 22, -250); x.closePath(); x.fill(); for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(-30 + k * 10, -230); x.quadraticCurveTo(-34 + k * 11, -140, -36 + k * 12, -48); x.stroke(); } }
      if (kind === 'priest') { x.fillStyle = WHITE; x.beginPath(); x.ellipse(2, -298, 21, 18, 0, Math.PI, 0); x.fill(); x.fillStyle = BF; }
      if (kind === 'king' || kind === 'god') { x.beginPath(); x.moveTo(-18, -312); x.lineTo(-12, -330); x.lineTo(-4, -316); x.lineTo(4, -334); x.lineTo(12, -316); x.lineTo(20, -328); x.lineTo(22, -310); x.fill(); }
      // arms: one forward (holding something), one back
      x.lineWidth = 16; x.strokeStyle = BF; x.lineCap = 'round';
      const ax = o.arm || 0; x.beginPath(); x.moveTo(8, -250); x.lineTo(40 + ax * 10, -220 - ax * 30); x.lineTo(64, -236 - ax * 40); x.stroke();
      x.beginPath(); x.moveTo(-8, -250); x.lineTo(-30, -200); x.lineTo(-24, -166); x.stroke();
      x.lineWidth = 2.2 / s; x.strokeStyle = INC;
      if (kind === 'hoplite') {
        // crested helmet, round shield with a device, a spear
        x.fillStyle = BF; x.beginPath(); x.moveTo(-22, -300); x.quadraticCurveTo(-14, -340, 22, -312); x.lineTo(24, -284); x.lineTo(-20, -286); x.fill();
        x.beginPath(); x.moveTo(-30, -318); x.quadraticCurveTo(0, -372, 34, -328); x.quadraticCurveTo(4, -346, -30, -318); x.fill();
        x.beginPath(); x.arc(46, -186, 62, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(46, -186, 54, 0, Math.PI * 2); x.stroke();
        if (o.device) { x.fillStyle = WHITE; x.beginPath(); x.arc(46, -186, 18, 0, Math.PI * 2); x.fill(); x.fillStyle = BF; }
        x.lineWidth = 5; x.strokeStyle = BF; x.beginPath(); x.moveTo(-60, -60); x.lineTo(150, -330); x.stroke(); x.lineWidth = 2.2 / s;
      }
      if (kind === 'god' && o.trident) { x.lineWidth = 6; x.strokeStyle = BF; x.beginPath(); x.moveTo(70, -40); x.lineTo(70, -380); x.stroke(); x.beginPath(); x.moveTo(52, -380); x.lineTo(52, -350); x.quadraticCurveTo(70, -336, 88, -350); x.lineTo(88, -380); x.moveTo(70, -400); x.lineTo(70, -350); x.stroke(); x.lineWidth = 2.2 / s; }
      if (kind === 'god' && o.bolt) { x.fillStyle = BF; x.beginPath(); x.moveTo(60, -250); x.lineTo(84, -300); x.lineTo(74, -296); x.lineTo(96, -350); x.lineTo(66, -292); x.lineTo(76, -296); x.closePath(); x.fill(); }
      if (o.scroll) { x.fillStyle = WHITE; x.fillRect(58, -260, 34, 22); x.fillStyle = BF; }
      x.restore();
    }
    /** a woman in profile: long chiton, white skin (the black-figure convention) */
    function woman(x, cx, gy, s, o = {}) {
      x.save(); x.translate(cx, gy); x.scale(o.flip ? -s : s, s); x.fillStyle = BF; x.strokeStyle = INC; x.lineWidth = 2.2 / s;
      x.beginPath(); x.moveTo(-30, -250); x.quadraticCurveTo(-46, -120, -44, 0); x.lineTo(40, 0); x.quadraticCurveTo(34, -130, 22, -250); x.closePath(); x.fill();
      for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(-26 + k * 8, -230); x.lineTo(-38 + k * 11, -8); x.stroke(); }
      x.fillStyle = WHITE; x.beginPath(); x.ellipse(2, -282, 18, 22, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(18, -286); x.lineTo(26, -278); x.lineTo(18, -274); x.fill();
      x.lineWidth = 13; x.strokeStyle = WHITE; x.lineCap = 'round'; x.beginPath(); x.moveTo(8, -236); x.lineTo(36, -214); x.lineTo(56, -230); x.stroke();
      x.fillStyle = BF; x.beginPath(); x.ellipse(-8, -296, 18, 14, -0.4, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(10, -286, 2.6, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    function bull(x, cx, gy, s) { x.save(); x.translate(cx, gy); x.scale(s, s); x.fillStyle = BF; x.strokeStyle = INC; x.lineWidth = 2.4 / s;
      x.beginPath(); x.ellipse(0, -110, 110, 52, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(90, -140); x.quadraticCurveTo(150, -150, 160, -110); x.quadraticCurveTo(162, -80, 130, -84); x.quadraticCurveTo(110, -110, 90, -100); x.fill();
      x.lineWidth = 8; x.strokeStyle = BF; x.beginPath(); x.moveTo(140, -138); x.quadraticCurveTo(150, -176, 128, -184); x.moveTo(126, -136); x.quadraticCurveTo(118, -170, 98, -170); x.stroke();
      x.lineWidth = 16; for (const lx of [-80, -50, 60, 86]) { x.beginPath(); x.moveTo(lx, -80); x.lineTo(lx + 4, 0); x.stroke(); }
      x.lineWidth = 5; x.beginPath(); x.moveTo(-108, -120); x.quadraticCurveTo(-134, -60, -122, -20); x.stroke();
      x.lineWidth = 2.4 / s; x.strokeStyle = INC; x.beginPath(); x.moveTo(-60, -140); x.quadraticCurveTo(0, -150, 60, -138); x.stroke(); x.beginPath(); x.arc(142, -122, 3, 0, Math.PI * 2); x.stroke(); x.restore(); }
    function ship(x, cx, gy, s) { x.save(); x.translate(cx, gy); x.scale(s, s); x.fillStyle = BF; x.strokeStyle = INC; x.lineWidth = 2.4 / s;
      x.beginPath(); x.moveTo(-220, -40); x.quadraticCurveTo(-60, 10, 200, -20); x.lineTo(240, -6); x.lineTo(200, -50); x.lineTo(-210, -64); x.quadraticCurveTo(-250, -100, -236, -130); x.quadraticCurveTo(-226, -80, -220, -40); x.fill();
      x.lineWidth = 6; x.strokeStyle = BF; x.beginPath(); x.moveTo(0, -60); x.lineTo(0, -280); x.stroke(); x.fillRect(-120, -270, 240, 10);
      x.fillStyle = WHITE; x.globalAlpha = 0.85; x.fillRect(-110, -260, 220, 150); x.globalAlpha = 1; x.strokeStyle = INC; x.lineWidth = 3; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(-110 + k * 44, -260); x.lineTo(-110 + k * 44, -110); x.stroke(); }
      x.strokeStyle = BF; x.lineWidth = 4; for (let k = 0; k < 14; k++) { x.beginPath(); x.moveTo(-180 + k * 26, -36); x.lineTo(-196 + k * 26, 20); x.stroke(); }
      x.fillStyle = WHITE; x.beginPath(); x.arc(196, -36, 6, 0, Math.PI * 2); x.fill(); x.restore(); }
    function waves(x, w, gy) { x.strokeStyle = '#1a1412'; x.lineWidth = 5; for (let k = 0; k < w; k += 46) { x.beginPath(); x.moveTo(k, gy); x.quadraticCurveTo(k + 12, gy - 22, k + 26, gy - 10); x.quadraticCurveTo(k + 34, gy - 4, k + 30, gy + 4); x.stroke(); } }
    function rings(x, cx, cy, s) { x.save(); x.translate(cx, cy); x.scale(s, s); x.fillStyle = BF; x.beginPath(); x.arc(0, 0, 100, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c8733a'; x.beginPath(); x.arc(0, 0, 84, 0, Math.PI * 2); x.fill(); x.fillStyle = BF; x.beginPath(); x.arc(0, 0, 64, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c8733a'; x.beginPath(); x.arc(0, 0, 46, 0, Math.PI * 2); x.fill(); x.fillStyle = BF; x.beginPath(); x.arc(0, 0, 30, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c8733a'; x.beginPath(); x.arc(0, 0, 18, 0, Math.PI * 2); x.fill(); x.fillStyle = BF; x.beginPath(); x.arc(0, 0, 9, 0, Math.PI * 2); x.fill(); x.restore(); }
    function column(x, cx, gy, h) { x.fillStyle = BF; x.fillRect(cx - 14, gy - h, 28, h); x.fillRect(cx - 26, gy - h - 14, 52, 14); x.fillRect(cx - 22, gy - 10, 44, 10); x.strokeStyle = INC; x.lineWidth = 2; for (let k = -8; k <= 8; k += 8) { x.beginPath(); x.moveTo(cx + k, gy - h + 6); x.lineTo(cx + k, gy - 14); x.stroke(); } }
    function label(x, text, cx, y) { x.fillStyle = '#1a1412'; x.font = "700 30px 'GFS Didot', serif"; x.textAlign = 'center'; x.fillText(text, cx, y); }
    api.BF = { man, woman, bull, ship, waves, rings, column, label };
    return api;
  };
  window.ATL = ATL;
})();
