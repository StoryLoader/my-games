/*
 * models.js — the 3D models of 「반도체 vs 우주선」, built in code with three.js primitives (no downloaded assets).
 * CVR.init(THREE) returns the builders. Every model is a Group around its own origin, y up, sitting on y = 0.
 * Nothing here moves by itself: scenes.js poses the parts from the playhead t.
 */
(function () {
  'use strict';
  window.CVR = { init };

  function init(T) {
    let seed = 1;
    const srand = (s) => { seed = s | 0; };
    const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const UP = V(0, 1, 0);

    /** a standard material: r roughness, m metalness, e emissive colour, ei emissive intensity, op opacity */
    const M = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1,
      transparent: o.op != null, opacity: o.op ?? 1, depthWrite: o.op == null || o.dw === true, side: o.side ?? T.FrontSide });
    const glowM = (color, op = 1) => new T.MeshBasicMaterial({ color, transparent: op < 1, opacity: op, depthWrite: op >= 1 });
    function mesh(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }
    const box = (w, h, d) => new T.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, s = 32) => new T.CylinderGeometry(rt, rb, h, s);
    const sph = (r, s = 32) => new T.SphereGeometry(r, s, Math.max(8, s >> 1));
    /** a thin rod from a to b */
    function seg(parent, a, b, r, mat) { const d = V(0, 0, 0).subVectors(b, a), len = Math.max(1e-4, d.length()); const m = new T.Mesh(cyl(r, r, len, 10), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); if (parent) parent.add(m); return m; }
    /** dark edge lines on a box-like mesh, so white parts read on the white floor */
    function edge(m, color = 0x8796a8) { const l = new T.LineSegments(new T.EdgesGeometry(m.geometry, 30), new T.LineBasicMaterial({ color })); m.add(l); return m; }
    function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; return tx; }

    // ---------------- textures ----------------
    const waferTex = () => canvasTex(1024, 1024, (g, w) => {
      g.fillStyle = '#1b2433'; g.fillRect(0, 0, w, w);
      const n = 22, s = w / n; srand(41);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const hue = (i * 9 + j * 15 + 170) % 360; g.fillStyle = `hsl(${hue}, 70%, ${42 + rnd() * 16}%)`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(i * s + 8, j * s + 8, s - 16, (s - 16) * 0.3); g.fillStyle = 'rgba(10,20,30,0.35)'; g.fillRect(i * s + 8, j * s + s * 0.55, s - 16, s * 0.2);
      }
    });
    const gridTex = () => { const tx = canvasTex(256, 256, (g, w) => { g.fillStyle = '#eef2f6'; g.fillRect(0, 0, w, w); g.strokeStyle = 'rgba(8,154,140,0.38)'; g.lineWidth = 3; g.strokeRect(0, 0, w, w); g.strokeStyle = 'rgba(8,154,140,0.09)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, w); g.moveTo(0, w / 2); g.lineTo(w, w / 2); g.stroke(); }); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(60, 60); return tx; };
    const planetTex = (kind) => canvasTex(1024, 512, (g, w, h) => {
      srand(kind === 'earth' ? 7 : kind === 'moon' ? 19 : 33);
      const base = { earth: ['#1c5fb8', '#0f3f8a'], moon: ['#a9a9a6', '#84848a'], mars: ['#c56a3c', '#a04e2a'] }[kind];
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, base[1]); gr.addColorStop(0.5, base[0]); gr.addColorStop(1, base[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const blob = (x, y, rx, ry, col) => { g.fillStyle = col; for (const dx of [-w, 0, w]) { g.beginPath(); g.ellipse(x + dx, y, rx, ry, rnd() * 3, 0, 6.283); g.fill(); } };
      if (kind === 'earth') {
        for (let i = 0; i < 46; i++) blob(rnd() * w, 70 + rnd() * (h - 140), 30 + rnd() * 90, 18 + rnd() * 50, ['#3f8f4a', '#5a9c52', '#b8a26a', '#2f7a44'][i % 4]);
        g.fillStyle = '#f2f6fa'; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 30, w, 30);
        for (let i = 0; i < 70; i++) blob(rnd() * w, rnd() * h, 30 + rnd() * 80, 6 + rnd() * 16, 'rgba(255,255,255,0.5)');
      } else if (kind === 'moon') {
        for (let i = 0; i < 26; i++) blob(rnd() * w, rnd() * h, 40 + rnd() * 90, 30 + rnd() * 60, 'rgba(90,90,98,0.35)');
        for (let i = 0; i < 160; i++) { const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 16; g.fillStyle = 'rgba(60,60,66,0.5)'; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(225,225,220,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 3.6, 5.6); g.stroke(); }
      } else {
        for (let i = 0; i < 40; i++) blob(rnd() * w, rnd() * h, 40 + rnd() * 120, 20 + rnd() * 50, ['rgba(120,56,30,0.45)', 'rgba(226,150,96,0.35)'][i % 2]);
        g.fillStyle = '#f0e6de'; g.fillRect(0, 0, w, 14);
      }
    });

    // ---------------- chip-world models ----------------
    function wafer(parent, r = 1.6) {
      const g = new T.Group(); if (parent) parent.add(g);
      mesh(g, cyl(r, r, 0.05, 64), M(0x202a3a, { r: 0.25, m: 0.8 }));
      const top = mesh(g, new T.CircleGeometry(r * 0.985, 64), new T.MeshStandardMaterial({ map: waferTex(), roughness: 0.22, metalness: 0.55 }), 0, 0.027, 0); top.rotation.x = -Math.PI / 2;
      return g;
    }
    function chip(parent, s = 1, plate = 0x12b5a5) {
      const g = new T.Group(); if (parent) parent.add(g);
      mesh(g, box(1 * s, 0.16 * s, 1 * s), M(0x232d3b, { r: 0.45, m: 0.2 }), 0, 0.12 * s, 0);
      mesh(g, box(0.62 * s, 0.03 * s, 0.62 * s), M(plate, { r: 0.3, m: 0.5 }), 0, 0.215 * s, 0);
      const pin = M(0xd9b24a, { r: 0.3, m: 0.9 });
      for (let i = -3; i <= 3; i++) { for (const sd of [-1, 1]) { mesh(g, box(0.07 * s, 0.05 * s, 0.2 * s), pin, i * 0.13 * s, 0.05 * s, sd * 0.56 * s); mesh(g, box(0.2 * s, 0.05 * s, 0.07 * s), pin, sd * 0.56 * s, 0.05 * s, i * 0.13 * s); } }
      return g;
    }
    /** a stylised EUV scanner: housing, light-source unit, wafer port. wire: draw only the edges (a prototype) */
    function euvMachine(parent, wire = false) {
      const g = new T.Group(); if (parent) parent.add(g);
      const parts = [[4.2, 2.0, 2.0, 0, 1.0, 0, 0xdde4ec], [1.7, 0.8, 1.5, -0.9, 2.4, 0, 0xcfd8e2], [1.1, 1.3, 1.6, 2.65, 0.65, 0, 0xd5dde6], [4.3, 0.12, 2.06, 0, 1.55, 0, 0x12b5a5], [1.2, 0.7, 0.06, 0.7, 1.0, 1.01, 0x1c2638]];
      const out = { g, solid: [], wires: [] };
      for (const [w, h, d, x, y, z, c] of parts) {
        if (wire) { const l = new T.LineSegments(new T.EdgesGeometry(box(w, h, d)), new T.LineBasicMaterial({ color: 0x0b6f66 })); l.position.set(x, y, z); g.add(l); out.wires.push(l); const gh = new T.Mesh(box(w, h, d), M(0x12b5a5, { r: 0.6, op: 0.13 })); gh.position.set(x, y, z); g.add(gh); }
        else { const m = mesh(g, box(w, h, d), M(c, { r: 0.45, m: c === 0x12b5a5 ? 0.3 : 0.05 }), x, y, z); edge(m, 0x8796a8); out.solid.push(m); }
      }
      if (!wire) { const pipe = M(0xb9c4d0, { r: 0.3, m: 0.8 }); seg(g, V(-0.9, 2.8, 0.4), V(0.6, 2.8, 0.4), 0.07, pipe); seg(g, V(0.6, 2.8, 0.4), V(0.6, 2.0, 0.4), 0.07, pipe); const w = wafer(g, 0.42); w.position.set(2.65, 1.34, 0); out.wafer = w; }
      return out;
    }

    // ---------------- space-world models ----------------
    function planet(parent, kind, r) { const m = mesh(parent, sph(r, 64), new T.MeshStandardMaterial({ map: planetTex(kind), roughness: kind === 'earth' ? 0.65 : 0.95, metalness: 0 })); m.castShadow = false; m.receiveShadow = false; return m; }
    function stars(parent, n = 900, R = 90) {
      srand(77); const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, s = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * s * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = Math.sin(a) * s * R; }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const p = new T.Points(geo, new T.PointsMaterial({ color: 0xfff0e0, size: 0.42, sizeAttenuation: true, transparent: true, opacity: 0.9 })); parent.add(p); return p;
    }
    function rocket(parent, s = 1) {
      const g = new T.Group(); if (parent) parent.add(g);
      const white = M(0xf2f4f7, { r: 0.35, m: 0.1 }), orange = M(0xff8a3c, { r: 0.4 }), dark = M(0x2a2f3a, { r: 0.4, m: 0.6 });
      mesh(g, cyl(0.36 * s, 0.36 * s, 2.6 * s, 32), white, 0, 1.7 * s, 0);
      mesh(g, new T.ConeGeometry(0.36 * s, 0.9 * s, 32), white, 0, 3.45 * s, 0);
      mesh(g, cyl(0.365 * s, 0.365 * s, 0.14 * s, 32), orange, 0, 2.6 * s, 0); mesh(g, cyl(0.365 * s, 0.365 * s, 0.14 * s, 32), orange, 0, 0.9 * s, 0);
      for (let i = 0; i < 4; i++) { const f = mesh(g, box(0.05 * s, 0.7 * s, 0.5 * s), orange, 0, 0.72 * s, 0); f.position.set(Math.cos(i * 1.5708) * 0.55 * s, 0.72 * s, Math.sin(i * 1.5708) * 0.55 * s); f.rotation.y = -i * 1.5708 + 1.5708; }
      mesh(g, cyl(0.2 * s, 0.32 * s, 0.34 * s, 24), dark, 0, 0.24 * s, 0);
      const flame = new T.Group(); g.add(flame); flame.position.y = 0.08 * s;
      const f1 = new T.Mesh(new T.ConeGeometry(0.3 * s, 1.8 * s, 24), glowM(0xff8a3c, 0.75)); f1.rotation.x = Math.PI; f1.position.y = -0.9 * s; flame.add(f1);
      const f2 = new T.Mesh(new T.ConeGeometry(0.17 * s, 1.1 * s, 24), glowM(0xfff0b8, 0.95)); f2.rotation.x = Math.PI; f2.position.y = -0.55 * s; flame.add(f2);
      const light = new T.PointLight(0xffa860, 0, 12); light.position.y = -0.4 * s; flame.add(light);
      return { g, flame, light };
    }
    function lander(parent) {
      const g = new T.Group(); if (parent) parent.add(g);
      const foil = M(0xd8a93a, { r: 0.35, m: 0.85 }), grey = M(0xbfc5cf, { r: 0.4, m: 0.6 });
      mesh(g, box(0.9, 0.55, 0.9), foil, 0, 0.75, 0); mesh(g, box(0.5, 0.3, 0.5), grey, 0, 1.15, 0);
      for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.785, c = Math.cos(a), s = Math.sin(a); seg(g, V(c * 0.45, 0.6, s * 0.45), V(c * 0.95, 0.04, s * 0.95), 0.035, grey); mesh(g, cyl(0.12, 0.12, 0.04, 16), grey, c * 0.95, 0.03, s * 0.95); }
      const dish = mesh(g, new T.SphereGeometry(0.28, 24, 12, 0, 6.283, 0, 1.1), M(0xf2f4f7, { r: 0.4, side: T.DoubleSide }), 0.25, 1.5, 0); dish.rotation.x = Math.PI; dish.rotation.z = 0.4;
      const flame = new T.Mesh(new T.ConeGeometry(0.22, 0.9, 20), glowM(0xbfe0ff, 0.8)); flame.rotation.x = Math.PI; flame.position.y = 0.0; g.add(flame);
      return { g, flame };
    }
    function satellite(parent, s = 1) {
      const g = new T.Group(); if (parent) parent.add(g);
      mesh(g, box(0.3 * s, 0.3 * s, 0.4 * s), M(0xd8a93a, { r: 0.35, m: 0.85 }));
      const pm = M(0x2b5fd0, { r: 0.3, m: 0.6 }); mesh(g, box(0.7 * s, 0.02 * s, 0.3 * s), pm, 0.55 * s, 0, 0); mesh(g, box(0.7 * s, 0.02 * s, 0.3 * s), pm, -0.55 * s, 0, 0);
      return g;
    }
    function capsule(parent, s = 1) {
      const g = new T.Group(); if (parent) parent.add(g);
      mesh(g, cyl(0.28 * s, 0.85 * s, 0.85 * s, 40), M(0xdfe4ea, { r: 0.35, m: 0.5 }), 0, 0.5 * s, 0);
      mesh(g, cyl(0.2 * s, 0.28 * s, 0.14 * s, 32), M(0xb9c0cb, { r: 0.4, m: 0.6 }), 0, 0.99 * s, 0);
      const shieldMat = M(0x5a3a2a, { r: 0.8, e: 0xff5a1a, ei: 0 });
      const shield = mesh(g, new T.SphereGeometry(1.5 * s, 40, 12, 0, 6.283, Math.PI - 0.6, 0.6), shieldMat, 0, 1.32 * s, 0);
      return { g, shieldMat, shield };
    }
    function engine(parent) {
      const g = new T.Group(); if (parent) parent.add(g);
      const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(new T.Vector2(0.3 + 0.85 * Math.pow(u, 0.62), 1.9 - u * 1.9)); }
      const bell = mesh(g, new T.LatheGeometry(pts, 48), M(0x7d8794, { r: 0.35, m: 0.85, side: T.DoubleSide }), 0, 0.6, 0);
      const chamberMat = M(0x8a6a55, { r: 0.4, m: 0.6, e: 0xff3a10, ei: 0 });
      mesh(g, cyl(0.42, 0.34, 0.75, 32), chamberMat, 0, 2.85, 0);
      mesh(g, cyl(0.5, 0.5, 0.16, 32), M(0x9aa3ae, { r: 0.35, m: 0.85 }), 0, 3.3, 0);
      const pipe = M(0xb9c4d0, { r: 0.3, m: 0.85 });
      for (let i = 0; i < 3; i++) { const t = mesh(g, new T.TorusGeometry(0.55 + i * 0.16, 0.035, 10, 48), pipe, 0, 2.3 - i * 0.55, 0); t.rotation.x = Math.PI / 2; }
      const tankMat = M(0xdfeaf6, { r: 0.3, m: 0.3, e: 0x3f8fe0, ei: 0 });
      const tank = mesh(g, sph(0.75, 40), tankMat, -1.9, 3.5, 0); tank.scale.y = 1.25;
      seg(g, V(-1.3, 3.3, 0), V(-0.45, 3.2, 0), 0.07, pipe);
      const flame = new T.Group(); g.add(flame); flame.position.y = 0.6;
      const f1 = new T.Mesh(new T.ConeGeometry(1.05, 2.6, 32, 1, true), glowM(0x9fd0ff, 0.4)); f1.rotation.x = Math.PI; f1.position.y = -1.3; flame.add(f1);
      const f2 = new T.Mesh(new T.ConeGeometry(0.5, 1.8, 24), glowM(0xf2faff, 0.8)); f2.rotation.x = Math.PI; f2.position.y = -0.9; flame.add(f2);
      const hot = new T.PointLight(0xff5020, 0, 8); hot.position.set(0.6, 2.85, 1.2); g.add(hot);
      const cold = new T.PointLight(0x60a8ff, 0, 8); cold.position.set(-1.9, 3.5, 1.4); g.add(cold);
      return { g, chamberMat, tankMat, flame, hot, cold, chamberPos: V(0, 2.85, 0), tankPos: V(-1.9, 3.5, 0) };
    }
    function jwst(parent) {
      const g = new T.Group(); if (parent) parent.add(g);
      const gold = M(0xf0c040, { r: 0.25, m: 0.7, e: 0x8a6408, ei: 0.7 });
      const R = 0.36, dx = R * 1.5, dy = R * Math.sqrt(3);
      for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) { const s = -q - r; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > 2 || (q === 0 && r === 0)) continue; if (Math.abs(q) === 2 && Math.abs(r) === 2) continue; if (Math.abs(q) === 2 && Math.abs(s) === 2) continue; if (Math.abs(r) === 2 && Math.abs(s) === 2) continue;
        const m = mesh(g, cyl(R * 0.96, R * 0.96, 0.06, 6), gold, q * dx, 2.5 + (r + q / 2) * dy, 0); m.rotation.x = Math.PI / 2; m.rotation.y = Math.PI / 6; }
      const strut = M(0x2a2f3a, { r: 0.5, m: 0.5 }); for (const [x, y] of [[-0.9, 1.6], [0.9, 1.6], [0, 3.7]]) seg(g, V(x, y, 0.05), V(0, 2.5, 1.9), 0.022, strut);
      mesh(g, cyl(0.16, 0.16, 0.04, 6), gold, 0, 2.5, 1.9).rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++) { const sh = mesh(g, cyl(2.6 - i * 0.1, 2.6 - i * 0.1, 0.012, 4), M(i ? 0xd8c8e8 : 0xcdb7e0, { r: 0.25, m: 0.9, side: T.DoubleSide }), 0, 0.95 - i * 0.09, 0.2); sh.scale.z = 0.5; sh.rotation.y = Math.PI / 4; }
      mesh(g, box(0.5, 0.5, 0.5), M(0xd8a93a, { r: 0.35, m: 0.85 }), 0, 0.3, 0.2);
      return g;
    }
    function station(parent) {
      const g = new T.Group(); if (parent) parent.add(g);
      const hull = M(0xe9edf2, { r: 0.35, m: 0.4 }), panel = M(0x2b5fd0, { r: 0.3, m: 0.6 }), truss = M(0x8a93a0, { r: 0.4, m: 0.7 });
      const core = mesh(g, cyl(0.34, 0.34, 2.4, 32), hull); core.rotation.z = Math.PI / 2;
      mesh(g, sph(0.42, 24), hull, 1.2, 0, 0);
      const a = mesh(g, cyl(0.3, 0.3, 1.8, 32), hull, 1.2, 0, 1.1); a.rotation.x = Math.PI / 2;
      const b = mesh(g, cyl(0.3, 0.3, 1.8, 32), hull, 1.2, 0, -1.1); b.rotation.x = Math.PI / 2;
      for (const [x, z] of [[-1.0, 0], [1.2, 2.0], [1.2, -2.0]]) { seg(g, V(x, -1.3, z), V(x, 1.3, z), 0.03, truss); mesh(g, box(0.5, 1.0, 0.03), panel, x, 0.85, z); mesh(g, box(0.5, 1.0, 0.03), panel, x, -0.85, z); }
      mesh(g, cyl(0.2, 0.26, 0.4, 24), truss, -1.4, 0, 0).rotation.z = Math.PI / 2;
      return g;
    }
    function rover(parent) {
      const g = new T.Group(); if (parent) parent.add(g);
      const body = M(0xeef0f3, { r: 0.45, m: 0.2 }), dark = M(0x2a2f3a, { r: 0.6, m: 0.4 }), metal = M(0xb9c0cb, { r: 0.35, m: 0.8 });
      mesh(g, box(1.7, 0.45, 1.1), body, 0, 0.85, 0); mesh(g, box(1.72, 0.05, 1.12), dark, 0, 1.1, 0);
      for (const x of [-0.75, 0, 0.75]) for (const z of [-0.75, 0.75]) { const w = mesh(g, cyl(0.26, 0.26, 0.2, 20), dark, x, 0.26, z); w.rotation.x = Math.PI / 2; seg(g, V(x, 0.3, z * 0.85), V(x * 0.6, 0.75, z * 0.6), 0.03, metal); }
      seg(g, V(0.55, 1.1, 0.25), V(0.55, 2.0, 0.25), 0.045, metal); mesh(g, box(0.36, 0.2, 0.24), body, 0.55, 2.08, 0.25); mesh(g, cyl(0.05, 0.05, 0.06, 12), dark, 0.67, 2.08, 0.38).rotation.x = Math.PI / 2;
      seg(g, V(0.85, 0.9, -0.2), V(1.4, 1.2, -0.3), 0.04, metal); seg(g, V(1.4, 1.2, -0.3), V(1.6, 0.7, -0.3), 0.04, metal); mesh(g, box(0.18, 0.18, 0.18), dark, 1.6, 0.62, -0.3);
      const rtg = mesh(g, cyl(0.16, 0.16, 0.6, 16), dark, -0.95, 1.05, 0); rtg.rotation.z = 1.0;
      return g;
    }
    function marsGround(parent) {
      const g = new T.Group(); if (parent) parent.add(g);
      const gr = mesh(g, new T.CircleGeometry(16, 64), M(0xb5633a, { r: 1 })); gr.rotation.x = -Math.PI / 2; gr.castShadow = false;
      srand(88); const rock = M(0x8a4a2c, { r: 1 });
      for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, d = 2 + rnd() * 9, s = 0.12 + rnd() * 0.4; const r = mesh(g, new T.DodecahedronGeometry(s, 0), rock, Math.cos(a) * d, s * 0.5, Math.sin(a) * d); r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); }
      return g;
    }

    return { T, V, M, glowM, mesh, box, cyl, sph, seg, edge, canvasTex, srand, rnd, gridTex,
      wafer, chip, euvMachine, planet, stars, rocket, lander, satellite, capsule, engine, jwst, station, rover, marsGround };
  }
})();
