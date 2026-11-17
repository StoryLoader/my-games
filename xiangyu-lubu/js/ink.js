/*
 * ink.js — the painted world of 「항우 vs 여포」 (storyboard.md → 월드 바이블): one ink-wash landscape on rice paper,
 * built as painted planes in depth (three.js), with two lit props in real 3D — the bronze cauldron (鼎) and the iron
 * halberd (戟). Everything here is drawn by code for this video. Deterministic: every random number comes from rand(seed).
 *
 *   const INK = window.INK.init(THREE, rand)
 *   INK.ridge({...}) → texture of a mountain range painted in ink (wet top edge, wash fading into mist, cun strokes, moss dots)
 *   INK.layer(tex, w, h) → a painted plane (fogs toward the paper colour with distance)
 *   INK.rider('xiang' | 'lu') → { mesh, draw(phase, gallop) } — horse and rider, repainted every frame
 *   INK.figure(kind) → a standing / seated / kneeling ink figure
 *   INK.crowd(...) → an army as instanced little figures
 *   INK.ding() / INK.ji() → the two real 3D props
 */
(function () {
  const INK = {};
  INK.init = function (T, rand) {
    const TAU = Math.PI * 2;
    const PAPER = '#efe6d4', INKC = '#151315';
    const api = { PAPER, INKC };
    const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); if (draw) draw(x, w, h); return c; };
    const tex = (c, repeat) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); } return t; };
    api.cv = cv; api.tex = tex;
    // smooth value noise (1D and 2D), deterministic per seed
    function noise1(seed) { const r = rand(seed), v = Array.from({ length: 1024 }, () => r()); return (x) => { const i = Math.floor(x), f = x - i, a = v[((i % 1024) + 1024) % 1024], b = v[(((i + 1) % 1024) + 1024) % 1024], s = f * f * (3 - 2 * f); return a + (b - a) * s; }; }
    function fbm1(seed) { const n = [noise1(seed), noise1(seed + 1), noise1(seed + 2), noise1(seed + 3)]; return (x) => n[0](x) * 0.55 + n[1](x * 2.1) * 0.25 + n[2](x * 4.3) * 0.13 + n[3](x * 9.1) * 0.07; }
    api.noise1 = noise1; api.fbm1 = fbm1;

    // ---------------- brush primitives (canvas 2D) ----------------
    /** a brush stroke along points: width tapers in and out, the edge breaks up a little (dry brush) */
    function stroke(x, pts, w0, w1, col, a = 1, r = Math.random) {
      const n = pts.length; x.save(); x.fillStyle = col;
      for (let pass = 0; pass < 3; pass++) {
        x.globalAlpha = a * (pass === 0 ? 0.55 : 0.28);
        x.beginPath();
        const L = [], R = [];
        for (let i = 0; i < n; i++) {
          const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
          const dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
          const u = i / (n - 1), taper = Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.04)) ** 0.6;
          const w = (w0 + (w1 - w0) * u) * taper * (0.85 + 0.3 * r()) * (1 - 0.18 * pass) / 2;
          L.push([p[0] + nx * w + (r() - 0.5) * pass, p[1] + ny * w + (r() - 0.5) * pass]); R.push([p[0] - nx * w, p[1] - ny * w]);
        }
        x.moveTo(L[0][0], L[0][1]); for (const p of L) x.lineTo(p[0], p[1]); for (let i = R.length - 1; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); x.fill();
      }
      x.restore();
    }
    /** points along a quadratic curve */
    function quad(a, c, b, n = 14) { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]); } return out; }
    /** a wet blot: several soft overlapping discs */
    function blot(x, cx, cy, rr, col, a, r) { x.save(); x.fillStyle = col; for (let i = 0; i < 5; i++) { x.globalAlpha = a * 0.3; x.beginPath(); x.ellipse(cx + (r() - 0.5) * rr * 0.4, cy + (r() - 0.5) * rr * 0.4, rr * (0.6 + 0.5 * r()), rr * (0.5 + 0.4 * r()), r() * 3, 0, TAU); x.fill(); } x.restore(); }
    api.stroke = stroke; api.quad = quad; api.blot = blot;
    /** ink granulation: speckles the alpha of what is already drawn so a flat fill reads as ink on paper */
    function granulate(x, w, h, seed, amt = 0.22) {
      const r = rand(seed), id = x.getImageData(0, 0, w, h), d = id.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { const g = 1 - amt * r() * r(); d[i + 3] *= g; }
      x.putImageData(id, 0, 0);
    }
    api.granulate = granulate;

    // ---------------- the paper ----------------
    api.paperCanvas = (w, h, seed = 7) => cv(w, h, (x) => {
      const r = rand(seed); x.fillStyle = PAPER; x.fillRect(0, 0, w, h);
      // mottling: large faint clouds of warmer / cooler paper
      for (let i = 0; i < 70; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); const c = r() < 0.5 ? 'rgba(170,140,95,' : 'rgba(255,252,240,'; g.addColorStop(0, c + (0.05 + 0.05 * r()) + ')'); g.addColorStop(1, c + '0)'); x.save(); x.translate(r() * w, r() * h); x.scale(80 + r() * 260, 60 + r() * 200); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.fill(); x.restore(); }
      // fibres
      x.lineCap = 'round';
      for (let i = 0; i < w * h / 900; i++) { const a = r() * TAU, L = 4 + r() * 22, px = r() * w, py = r() * h; x.strokeStyle = r() < 0.6 ? 'rgba(120,96,64,0.10)' : 'rgba(255,255,250,0.22)'; x.lineWidth = 0.6 + r() * 0.8; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.6) * L * 0.5, py + Math.sin(a + 0.6) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
    });

    // ---------------- mountains ----------------
    /**
     * a range of mountains painted in ink: o = { seed, w, h, peaks, rough, base (0..1 where the wash fades), dark (0..1), dots, steep }
     */
    api.ridgeCanvas = (o) => {
      const W = o.w || 2048, H = o.h || 768, r = rand(o.seed || 1), f = fbm1(o.seed || 1), f2 = fbm1((o.seed || 1) + 50);
      const peaks = o.peaks || 3, top = o.top || 0.12, base = o.base || 0.85, dark = o.dark == null ? 0.85 : o.dark;
      const yAt = (u) => { // ridge height: a few big peaks (bumps) + fbm roughness
        let y = 0; for (let k = 0; k < peaks; k++) { const c = (k + 0.5 + (f2(k * 3.1) - 0.5) * 0.8) / peaks, wd = (o.steep || 0.12) * (0.7 + f2(k * 7.7) * 0.8); y = Math.max(y, Math.exp(-(((u - c) / wd) ** 2)) * (0.55 + 0.45 * f2(k * 5.3))); }
        y = y * 0.75 + 0.25 * f(u * (o.rough || 6)) * (0.4 + y);
        return H * (top + (1 - y) * (base - top) * 0.9);
      };
      return cv(W, H, (x) => {
        const ys = []; for (let i = 0; i <= W; i += 4) ys.push(yAt(i / W));
        // the wash: dark along the ridge, fading downward into the paper (mist at the foot)
        for (let pass = 0; pass < 2; pass++) {
          x.save(); x.beginPath(); x.moveTo(0, H); ys.forEach((y, i) => x.lineTo(i * 4, y + pass * 6)); x.lineTo(W, H); x.closePath(); x.clip();
          const g = x.createLinearGradient(0, H * top, 0, H * base);
          g.addColorStop(0, `rgba(21,19,21,${(pass ? 0.35 : 0.55) * dark})`); g.addColorStop(0.35, `rgba(30,28,30,${0.32 * dark})`); g.addColorStop(1, 'rgba(30,28,30,0)');
          x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
        }
        // texture strokes (cun): short slanted strokes following the slope, thicker near the ridge
        x.save(); x.beginPath(); x.moveTo(0, H); ys.forEach((y, i) => x.lineTo(i * 4, y)); x.lineTo(W, H); x.closePath(); x.clip();
        for (let i = 0; i < (o.cun || 260); i++) {
          const u = r(), px = u * W, y0 = yAt(u), d = r() ** 1.6 * (H * base - y0) * 0.9, py = y0 + d, slope = (yAt(u + 0.004) - yAt(u - 0.004)) / (0.008 * W);
          const L = 18 + r() * 60, ang = Math.atan(slope) * 0.6 + Math.PI / 2 + (r() - 0.5) * 0.5, fade = 1 - d / (H * base - y0 + 1);
          stroke(x, quad([px, py], [px + Math.cos(ang) * L * 0.5 + 6, py + Math.sin(ang) * L * 0.5], [px + Math.cos(ang) * L, py + Math.sin(ang) * L], 5), 3 + r() * 6, 1, INKC, 0.25 * fade * dark, r);
        }
        x.restore();
        // the ridge line itself: a broken, dark brush line
        let seg = []; for (let i = 0; i < ys.length; i++) { seg.push([i * 4, ys[i] + 1]); if (seg.length > 18 + r() * 40 || i === ys.length - 1) { stroke(x, seg, 5 + r() * 5, 3, INKC, 0.55 * dark, r); seg = r() < 0.15 ? [] : [seg[seg.length - 1]]; } }
        // moss dots on the ridge
        for (let i = 0; i < (o.dots || 60); i++) { const u = r(), y = yAt(u); blot(x, u * W, y + 2 + r() * 10, 2 + r() * 4, INKC, 0.6 * dark, r); }
        // a few trees on top
        for (let i = 0; i < (o.trees || 0); i++) { const u = 0.05 + r() * 0.9, y = yAt(u), px = u * W; const th = 26 + r() * 30; stroke(x, [[px, y + 4], [px + 1, y - th * 0.5], [px - 1, y - th]], 3, 1.5, INKC, 0.7 * dark, r); for (let k = 0; k < 5; k++) blot(x, px + (r() - 0.5) * 18, y - th * (0.5 + 0.5 * r()), 5 + r() * 6, INKC, 0.5 * dark, r); }
        granulate(x, W, H, (o.seed || 1) + 9, 0.25);
      });
    };
    api.ridge = (o) => tex(api.ridgeCanvas(o));

    // ---------------- painted planes ----------------
    api.layer = (t, w, h, o = {}) => {
      const m = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: o.fog !== false, color: o.color || 0xffffff, opacity: o.opacity == null ? 1 : o.opacity, side: T.DoubleSide });
      const mesh = new T.Mesh(new T.PlaneGeometry(w, h), m); mesh.renderOrder = o.order || 0; return mesh;
    };
    /** a soft band of mist: white paper colour, feathered top and bottom */
    api.mistTex = tex(cv(512, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(239,230,212,0)'); g.addColorStop(0.45, 'rgba(242,235,220,0.95)'); g.addColorStop(0.62, 'rgba(242,235,220,0.9)'); g.addColorStop(1, 'rgba(239,230,212,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      const r = rand(31); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.1})`; x.beginPath(); x.ellipse(r() * w, h * (0.3 + r() * 0.4), 30 + r() * 90, 6 + r() * 16, 0, 0, TAU); x.fill(); }
      const fx = x.getImageData(0, 0, w, h), d = fx.data; for (let px = 0; px < w; px++) { const e = Math.min(1, Math.min(px, w - px) / (w * 0.18)); for (let py = 0; py < h; py++) d[(py * w + px) * 4 + 3] *= e; } x.putImageData(fx, 0, 0);
    }));
    api.mist = (w, h, a = 0.85) => api.layer(api.mistTex, w, h, { opacity: a, fog: false, order: 5 });
    /** a round glow (the sun / moon / a lamp) */
    api.glowTex = tex(cv(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.75)'); g.addColorStop(0.5, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }));
    api.glow = (color, s, a = 1, additive = false) => { const m = new T.SpriteMaterial({ map: api.glowTex, color, transparent: true, depthWrite: false, opacity: a, fog: false, blending: additive ? T.AdditiveBlending : T.NormalBlending }); const sp = new T.Sprite(m); sp.scale.setScalar(s); return sp; };
    /** a disc (sun) painted with a soft edge */
    api.discTex = tex(cv(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, w * 0.36, w / 2, w / 2, w * 0.5); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, TAU); x.fill(); }));

    // ---------------- the riders ----------------
    /**
     * Horse and rider in ink, side view facing +x (right). kind: 'xiang' — black horse 추, heavy armour, a long spear,
     * a plume and a cape; 'lu' — the red horse 적토 (the only red figure), slimmer armour, the halberd 극 and a bow.
     * draw(phase 0..1 of the stride, gallop 0..1, opts) repaints the canvas.
     */
    api.rider = (kind, seed = 3) => {
      const Wc = 700, Hc = 560, c = cv(Wc, Hc), x = c.getContext('2d'), t = tex(c);
      const horseCol = kind === 'lu' ? '#a3302a' : INKC, accent = kind === 'lu' ? '#a3302a' : '#b08a3e';
      const mesh = api.layer(t, 3.5, 2.8, { order: 3 }); mesh.geometry.translate(0, 1.4 - 0.25, 0);
      const draw = (ph, gal = 1, o = {}) => {
        const r = rand(seed * 1000 + Math.floor(ph * 8)); // the dry-brush breakup changes on twos
        x.clearRect(0, 0, Wc, Hc);
        const bob = gal * 9 * Math.sin(ph * TAU * 2), lean = gal * 0.04 * Math.sin(ph * TAU);
        x.save(); x.translate(330, 300 + bob); x.rotate(lean);
        // legs (gallop): angle of thigh, bend of the lower leg; a standing pose when gal = 0
        const leg = (hx, hy, off, front) => {
          const p = (ph + off) % 1, sw = Math.sin(p * TAU), bend = Math.max(0, Math.sin(p * TAU + (front ? 1.2 : -0.6)));
          const a1 = (front ? 0.08 : -0.06) + gal * (front ? 0.62 : 0.55) * sw, a2 = a1 + gal * (front ? -1.3 : 1.15) * bend * (front ? 1 : 1);
          const L1 = front ? 74 : 80, L2 = 78;
          const kx = hx + Math.sin(a1) * L1, ky = hy + Math.cos(a1) * L1, fx = kx + Math.sin(a2) * L2, fy = ky + Math.cos(a2) * L2;
          stroke(x, quad([hx, hy - 6], [(hx + kx) / 2, (hy + ky) / 2], [kx, ky], 6), 30, 17, horseCol, 0.95, r);
          stroke(x, quad([kx, ky], [(kx + fx) / 2, (ky + fy) / 2], [fx, fy], 6), 16, 11, horseCol, 0.95, r);
          blot(x, fx + 4, fy + 3, 7, INKC, 0.9, r);
        };
        // far legs lighter (behind the body)
        x.save(); x.globalAlpha = 0.55; leg(-95, 18, 0.1, false); leg(85, 12, 0.6, true); x.restore();
        // tail
        const tw = gal * 18 * Math.sin(ph * TAU + 1);
        for (let k = 0; k < 6; k++) stroke(x, quad([-140, -18], [-205, 10 + k * 6 + tw * 0.5], [-215 - k * 4, 70 + k * 12 + tw]), 10, 2, INKC, 0.6, r);
        // body
        x.save(); x.fillStyle = horseCol; for (let k = 0; k < 3; k++) { x.globalAlpha = k === 0 ? 0.9 : 0.25; x.beginPath(); x.ellipse(-6 + k, 0, 150 - k * 3, 58 - k * 2, -0.04, 0, TAU); x.fill(); } x.restore();
        // chest, neck and head
        const nk = gal * 0.08 * Math.sin(ph * TAU * 2 + 0.5);
        x.save(); x.translate(118, -26); x.rotate(-0.15 + nk);
        stroke(x, quad([-10, 26], [35, -10], [62, -92]), 78, 40, horseCol, 0.95, r);
        x.save(); x.translate(64, -100); x.rotate(0.95);
        x.fillStyle = horseCol; x.globalAlpha = 0.95; x.beginPath(); x.moveTo(-18, -20); x.quadraticCurveTo(30, -26, 82, -10); x.quadraticCurveTo(96, 4, 84, 16); x.quadraticCurveTo(40, 22, -16, 22); x.closePath(); x.fill();
        x.globalAlpha = 1; x.fillStyle = INKC; x.beginPath(); x.moveTo(-14, -18); x.lineTo(-6, -40); x.lineTo(4, -18); x.fill();
        x.restore();
        for (let k = 0; k < 7; k++) stroke(x, quad([30 - k * 7, -70 + k * 12], [8 - k * 9, -50 + k * 12 - gal * 6], [-6 - k * 10, -40 + k * 14]), 7, 1.5, INKC, 0.7, r);
        x.restore();
        // near legs
        leg(-80, 26, 0.0, false); leg(100, 18, 0.5, true);
        // saddle cloth
        stroke(x, [[-58, -46], [-20, -50], [30, -48]], 26, 22, accent, 0.85, r);
        // ---- the rider ----
        const rx = -6, ry = -66;
        // cape streaming back
        const cw = 10 + gal * 26;
        for (let k = 0; k < 5; k++) stroke(x, quad([rx - 4, ry - 90 + k * 4], [rx - 70 - cw, ry - 70 + k * 10 + gal * 8 * Math.sin(ph * TAU + k)], [rx - 120 - cw * 1.6 - k * 6, ry - 30 + k * 16 + gal * 10 * Math.sin(ph * TAU * 2 + k)]), 30 - k * 3, 8, kind === 'lu' ? '#3a2a2c' : INKC, 0.55, r);
        // leg along the flank
        stroke(x, quad([rx + 8, ry - 6], [rx + 40, ry + 20], [rx + 30, ry + 58]), 28, 16, INKC, 0.95, r);
        // torso in armour (scales as short strokes)
        x.save(); x.fillStyle = INKC; x.globalAlpha = 0.95; x.beginPath(); x.moveTo(rx - 26, ry - 2); x.quadraticCurveTo(rx - 32, ry - 60, rx - 16, ry - 100); x.lineTo(rx + 22, ry - 104); x.quadraticCurveTo(rx + 34, ry - 50, rx + 28, ry - 2); x.closePath(); x.fill(); x.restore();
        x.save(); x.strokeStyle = 'rgba(239,230,212,0.35)'; x.lineWidth = 2; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(rx - 22, ry - 18 - k * 14); x.quadraticCurveTo(rx, ry - 12 - k * 14, rx + 24, ry - 18 - k * 14); x.stroke(); } x.restore();
        // shoulder guard
        blot(x, rx + 6, ry - 96, 20, INKC, 1, r);
        // head and helmet
        x.save(); x.fillStyle = INKC; x.beginPath(); x.ellipse(rx + 4, ry - 122, 15, 19, 0, 0, TAU); x.fill();
        x.beginPath(); x.moveTo(rx - 22, ry - 128); x.quadraticCurveTo(rx + 4, ry - 168, rx + 30, ry - 128); x.closePath(); x.fill();
        x.fillRect(rx - 24, ry - 130, 56, 6); x.restore();
        // plume / tassel in the accent colour
        if (kind === 'xiang') { for (let k = 0; k < 4; k++) stroke(x, quad([rx + 4, ry - 160], [rx - 20 - gal * 10, ry - 190 - k * 3], [rx - 50 - gal * 30 - k * 6, ry - 176 + k * 8]), 12, 2, accent, 0.9, r); }
        else { stroke(x, quad([rx + 4, ry - 158], [rx - 6, ry - 176], [rx - 26 - gal * 18, ry - 150]), 10, 3, accent, 0.95, r); }
        // arms and weapon
        const wa = (o.weaponAngle != null ? o.weaponAngle : (kind === 'lu' ? -0.35 : -0.25)) + gal * 0.06 * Math.sin(ph * TAU);
        const hx = rx + 40, hy = ry - 64;
        stroke(x, quad([rx + 10, ry - 90], [rx + 34, ry - 80], [hx, hy]), 18, 13, INKC, 0.95, r);
        x.save(); x.translate(hx, hy); x.rotate(wa);
        stroke(x, [[-170, 0], [0, 0], [210, 0]], 7, 6, '#3a3330', 0.95, r);
        if (kind === 'lu') { // the halberd head: spear point + crescent side blade
          x.fillStyle = INKC; x.beginPath(); x.moveTo(210, -6); x.lineTo(262, 0); x.lineTo(210, 6); x.fill();
          x.beginPath(); x.moveTo(196, -4); x.quadraticCurveTo(206, -44, 232, -50); x.quadraticCurveTo(214, -30, 214, -4); x.fill();
          stroke(x, [[186, 2], [186, 18], [190, 30]], 4, 2, '#a3302a', 0.9, r);
        } else { x.fillStyle = INKC; x.beginPath(); x.moveTo(210, -8); x.lineTo(272, 0); x.lineTo(210, 8); x.fill(); stroke(x, [[204, 6], [200, 22], [206, 36]], 5, 2, '#b08a3e', 0.9, r); }
        x.restore();
        if (kind === 'lu' && !o.noBow) { x.save(); x.strokeStyle = INKC; x.lineWidth = 4; x.globalAlpha = 0.8; x.beginPath(); x.arc(rx - 24, ry - 52, 38, -1.2, 1.4); x.stroke(); x.restore(); }
        x.restore();
        t.needsUpdate = true;
      };
      draw(0, 0);
      return { mesh, draw, tex: t, canvas: c };
    };

    // ---------------- figures (standing, seated, kneeling, old man …) ----------------
    /** a single ink figure painted once; kind: 'soldier' | 'general' | 'lord' (seated, big) | 'kneel' | 'old' | 'youth' | 'robed' */
    api.figureCanvas = (kind, seed = 5, o = {}) => cv(256, 512, (x, w, h) => {
      const r = rand(seed), cx = 128, gy = 500, col = o.color || INKC;
      const S = kind === 'lord' ? 1.25 : kind === 'youth' ? 0.85 : 1;
      x.save(); x.translate(cx, gy); x.scale(S, S); x.translate(-cx, -gy);
      if (kind === 'lift') { // legs braced apart, both arms straight up holding something overhead
        x.fillStyle = col; x.globalAlpha = 0.95;
        stroke(x, [[cx - 14, gy - 200], [cx - 40, gy - 100], [cx - 58, gy]], 26, 16, col, 0.95, r); stroke(x, [[cx + 14, gy - 200], [cx + 40, gy - 100], [cx + 58, gy]], 26, 16, col, 0.95, r);
        x.beginPath(); x.moveTo(cx - 38, gy - 190); x.quadraticCurveTo(cx - 44, gy - 270, cx - 32, gy - 310); x.lineTo(cx + 32, gy - 310); x.quadraticCurveTo(cx + 44, gy - 270, cx + 38, gy - 190); x.closePath(); x.fill();
        x.beginPath(); x.ellipse(cx, gy - 334, 18, 21, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(cx - 24, gy - 340); x.quadraticCurveTo(cx, gy - 380, cx + 24, gy - 340); x.fill();
        stroke(x, [[cx - 30, gy - 300], [cx - 52, gy - 390], [cx - 46, gy - 470]], 18, 12, col, 0.95, r); stroke(x, [[cx + 30, gy - 300], [cx + 52, gy - 390], [cx + 46, gy - 470]], 18, 12, col, 0.95, r);
        for (let k = 0; k < 4; k++) stroke(x, quad([cx - 30, gy - 300], [cx - 70, gy - 230 + k * 12], [cx - 84 - k * 6, gy - 140 + k * 22]), 16, 4, col, 0.45, r);
        x.restore(); granulate(x, w, h, seed + 3, 0.18); return;
      }
      if (kind === 'kneel') {
        x.fillStyle = col; x.globalAlpha = 0.92; x.beginPath(); x.moveTo(cx - 50, gy); x.quadraticCurveTo(cx - 60, gy - 70, cx - 20, gy - 120); x.lineTo(cx + 20, gy - 130); x.quadraticCurveTo(cx + 48, gy - 70, cx + 56, gy); x.closePath(); x.fill();
        x.beginPath(); x.ellipse(cx + 26, gy - 136, 15, 16, 0, 0, TAU); x.fill(); x.restore(); return;
      }
      if (kind === 'lord') { // seated on a dais, wide robes, tall hat
        x.fillStyle = col; x.globalAlpha = 0.94; x.beginPath(); x.moveTo(cx - 92, gy); x.quadraticCurveTo(cx - 98, gy - 140, cx - 40, gy - 230); x.lineTo(cx + 40, gy - 230); x.quadraticCurveTo(cx + 100, gy - 140, cx + 96, gy); x.closePath(); x.fill();
        x.beginPath(); x.ellipse(cx, gy - 254, 26, 30, 0, 0, TAU); x.fill(); x.fillRect(cx - 14, gy - 310, 28, 40); x.fillRect(cx - 40, gy - 304, 80, 8);
        for (let k = 0; k < 9; k++) stroke(x, quad([cx - 70 + k * 16, gy - 180], [cx - 74 + k * 18, gy - 90], [cx - 84 + k * 20, gy - 4]), 4, 2, 'rgba(239,230,212,0.25)', 1, r);
        x.restore(); return;
      }
      const robe = kind === 'robed' || kind === 'old';
      // legs / robe
      if (robe) { x.fillStyle = col; x.globalAlpha = 0.9; x.beginPath(); x.moveTo(cx - 44, gy); x.quadraticCurveTo(cx - 36, gy - 150, cx - 26, gy - 250); x.lineTo(cx + 26, gy - 250); x.quadraticCurveTo(cx + 40, gy - 150, cx + 48, gy); x.closePath(); x.fill(); }
      else { stroke(x, [[cx - 12, gy - 190], [cx - 18, gy - 100], [cx - 22, gy]], 22, 14, col, 0.95, r); stroke(x, [[cx + 12, gy - 190], [cx + 18, gy - 100], [cx + 26, gy]], 22, 14, col, 0.95, r); }
      // torso
      x.fillStyle = col; x.globalAlpha = 0.95; x.beginPath(); x.moveTo(cx - 34, gy - 180); x.quadraticCurveTo(cx - 40, gy - 260, cx - 28, gy - 300); x.lineTo(cx + 28, gy - 300); x.quadraticCurveTo(cx + 40, gy - 260, cx + 34, gy - 180); x.closePath(); x.fill();
      // head (bent for the old man)
      const hb = kind === 'old' ? 18 : 0;
      x.beginPath(); x.ellipse(cx + hb, gy - 322 + hb * 0.5, 17, 20, 0, 0, TAU); x.fill();
      if (kind === 'general' || kind === 'soldier') { x.beginPath(); x.moveTo(cx - 22 + hb, gy - 328); x.quadraticCurveTo(cx + hb, gy - 366, cx + 22 + hb, gy - 328); x.fill(); }
      else { x.fillRect(cx - 8 + hb, gy - 352, 16, 16); }
      if (kind === 'old') { stroke(x, [[cx + 34, gy - 300], [cx + 50, gy - 150], [cx + 56, gy]], 6, 5, col, 0.9, r); for (let k = 0; k < 4; k++) stroke(x, [[cx + 10 + hb, gy - 306], [cx + 6 + hb + k * 2, gy - 270 + k * 4]], 3, 1, col, 0.6, r); }
      if (kind === 'soldier' || kind === 'general') { // a spear
        stroke(x, [[cx + 40, gy - 4], [cx + 44, gy - 260], [cx + 46, gy - 420]], 6, 5, '#2a2523', 0.95, r); x.beginPath(); x.moveTo(cx + 40, gy - 420); x.lineTo(cx + 46, gy - 460); x.lineTo(cx + 52, gy - 420); x.fill(); }
      if (kind === 'general') { for (let k = 0; k < 5; k++) stroke(x, quad([cx - 26, gy - 296], [cx - 60, gy - 220 + k * 10], [cx - 70 - k * 4, gy - 120 + k * 20]), 18, 4, col, 0.5, r); }
      x.restore();
      granulate(x, w, h, seed + 3, 0.18);
    });
    api.figure = (kind, seed, hgt = 1.8, o = {}) => { const m = api.layer(tex(api.figureCanvas(kind, seed, o)), hgt / 2, hgt, { order: 3 }); m.geometry.translate(0, hgt / 2, 0); return m; };

    /** an army: n little figures with spears, as one instanced mesh of camera-facing quads */
    const crowdTex = tex(cv(512, 128, (x) => {
      const r = rand(77);
      for (let i = 0; i < 4; i++) { x.save(); x.translate(i * 128 + 64, 124); const s = 0.8 + 0.1 * i;
        x.fillStyle = INKC; x.globalAlpha = 0.95; x.beginPath(); x.moveTo(-12 * s, 0); x.lineTo(-9 * s, -40 * s); x.lineTo(9 * s, -40 * s); x.lineTo(12 * s, 0); x.fill();
        x.beginPath(); x.ellipse(0, -48 * s, 6 * s, 7 * s, 0, 0, TAU); x.fill();
        if (i < 3) { x.fillRect(12 * s, -112 * s, 2.5, 110 * s); x.beginPath(); x.moveTo(11 * s, -112 * s); x.lineTo(13.5 * s, -122 * s); x.lineTo(16 * s, -112 * s); x.fill(); }
        else { x.fillStyle = '#7a1f1a'; x.fillRect(12 * s, -116 * s, 2, 114 * s); x.fillRect(14 * s, -116 * s, 18 * s, 14 * s); }
        x.restore(); }
    }));
    api.crowd = (n, place, o = {}) => {
      const g = new T.PlaneGeometry(0.35, 0.35 * 1.0); g.translate(0, 0.175, 0);
      const uv = g.attributes.uv; const ia = new Float32Array(n);
      const m = new T.MeshBasicMaterial({ map: crowdTex, transparent: true, depthWrite: false, fog: true, color: o.color || 0xffffff, side: T.DoubleSide, opacity: o.opacity == null ? 1 : o.opacity });
      m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv.x = (vMapUv.x + aVar) * 0.25;\n#endif').replace('void main() {', 'attribute float aVar;\nvoid main() {'); };
      const im = new T.InstancedMesh(g, m, n); im.renderOrder = o.order || 2;
      const r = rand(o.seed || 11), M = new T.Matrix4(), P = new T.Vector3(), Q = new T.Quaternion(), Sc = new T.Vector3();
      for (let i = 0; i < n; i++) { const p = place(i, r); P.set(p[0], p[1] || 0, p[2]); const s = (p[3] || 1) * (0.85 + 0.3 * r()); Sc.set(s * (r() < 0.5 ? -1 : 1), s, s); M.compose(P, Q, Sc); im.setMatrixAt(i, M); ia[i] = o.variant != null ? o.variant : Math.floor(r() * 3); }
      g.setAttribute('aVar', new T.InstancedBufferAttribute(ia, 1));
      im.frustumCulled = false; return im;
    };

    // ---------------- buildings, boats, fire, water (painted planes) ----------------
    /** a city wall with a gate tower, painted: w × h canvas; o.tower, o.gateOpen, o.burn */
    api.cityCanvas = (o = {}) => cv(2048, 768, (x, W, H) => {
      const r = rand(o.seed || 21), gy = H - 30, wallTop = H - (o.wallH || 230);
      x.fillStyle = INKC;
      // wall body with brick courses
      x.globalAlpha = 0.85; x.fillRect(0, wallTop, W, gy - wallTop);
      x.globalAlpha = 1; x.strokeStyle = 'rgba(239,230,212,0.16)'; x.lineWidth = 2;
      for (let yy = wallTop + 18; yy < gy; yy += 22) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); for (let xx = (yy / 22 % 2) * 30; xx < W; xx += 60) { x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 22); x.stroke(); } }
      // battlements
      x.fillStyle = INKC; for (let xx = 0; xx < W; xx += 46) x.fillRect(xx, wallTop - 24, 28, 26);
      // gate
      const gx = W / 2; x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(gx - 70, gy); x.lineTo(gx - 70, gy - 120); x.quadraticCurveTo(gx, gy - 190, gx + 70, gy - 120); x.lineTo(gx + 70, gy); x.fill(); x.globalCompositeOperation = 'source-over';
      if (!o.gateOpen) { x.fillStyle = '#2b2524'; x.beginPath(); x.moveTo(gx - 70, gy); x.lineTo(gx - 70, gy - 120); x.quadraticCurveTo(gx, gy - 190, gx + 70, gy - 120); x.lineTo(gx + 70, gy); x.fill(); x.strokeStyle = 'rgba(239,230,212,0.25)'; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx, gy - 160); x.stroke(); }
      // the tower: two tiers of curved roofs
      if (o.tower !== false) {
        const tw = 360, base = wallTop - 20;
        const roof = (y, w2, hh) => { x.fillStyle = INKC; x.beginPath(); x.moveTo(gx - w2 - 40, y + 6); x.quadraticCurveTo(gx - w2 * 0.6, y - 4, gx - w2 * 0.5, y - hh); x.lineTo(gx + w2 * 0.5, y - hh); x.quadraticCurveTo(gx + w2 * 0.6, y - 4, gx + w2 + 40, y + 6); x.quadraticCurveTo(gx, y - 10, gx - w2 - 40, y + 6); x.fill(); x.strokeStyle = 'rgba(239,230,212,0.2)'; for (let k = -6; k <= 6; k++) { x.beginPath(); x.moveTo(gx + k * w2 / 7, y - hh + 4); x.lineTo(gx + k * w2 / 6.2, y); x.stroke(); } };
        x.fillStyle = INKC; x.globalAlpha = 0.9; x.fillRect(gx - tw / 2 + 30, base - 120, tw - 60, 120); x.globalAlpha = 1;
        x.fillStyle = 'rgba(239,230,212,0.25)'; for (let k = 0; k < 7; k++) x.fillRect(gx - tw / 2 + 50 + k * 42, base - 100, 22, 70);
        roof(base - 116, tw / 2, 40);
        x.fillStyle = INKC; x.fillRect(gx - tw / 2 + 80, base - 230, tw - 160, 90);
        roof(base - 226, tw / 2 - 50, 50);
      }
      granulate(x, W, H, (o.seed || 21) + 1, 0.22);
    });
    /** a small boat seen from the side */
    api.boatCanvas = (seed = 4) => cv(512, 200, (x, W, H) => { const r = rand(seed); x.fillStyle = INKC; x.globalAlpha = 0.92; x.beginPath(); x.moveTo(20, 90); x.quadraticCurveTo(80, 170, 250, 172); x.quadraticCurveTo(420, 170, 492, 84); x.quadraticCurveTo(260, 116, 20, 90); x.fill(); stroke(x, [[250, 112], [252, 50], [254, 6]], 6, 4, INKC, 0.9, r); stroke(x, [[40, 96], [250, 118], [470, 92]], 4, 3, 'rgba(239,230,212,0.3)', 1, r); });
    /** a clay cooking pot (甑/釜), whole or broken */
    api.potCanvas = (broken, seed = 6) => cv(256, 256, (x, W, H) => { const r = rand(seed); x.fillStyle = '#2e2724'; x.globalAlpha = 0.95;
      if (!broken) { x.beginPath(); x.ellipse(128, 150, 92, 78, 0, 0, TAU); x.fill(); x.fillRect(70, 62, 116, 26); x.strokeStyle = 'rgba(239,230,212,0.3)'; x.lineWidth = 3; x.beginPath(); x.ellipse(128, 120, 80, 10, 0, 0, Math.PI); x.stroke(); }
      else { for (let k = 0; k < 5; k++) { x.save(); x.translate(60 + k * 34 + r() * 10, 200 - r() * 20); x.rotate(r() * 3); x.beginPath(); x.moveTo(-26, -6); x.lineTo(22, -18); x.lineTo(28, 16); x.lineTo(-18, 20); x.fill(); x.restore(); } } });
    /** flames: a few painted frames, picked by time (the fire accent colour, used only for 거록·함양·해하) */
    api.flameFrames = (seed = 9) => Array.from({ length: 6 }, (_, f) => tex(cv(256, 384, (x, W, H) => {
      const r = rand(seed * 10 + f);
      for (let k = 0; k < 9; k++) { const cx = 128 + (r() - 0.5) * 90, hgt = 160 + r() * 200, sw = (r() - 0.5) * 60; x.save(); const g = x.createLinearGradient(0, H, 0, H - hgt); g.addColorStop(0, 'rgba(200,70,30,0.9)'); g.addColorStop(0.5, 'rgba(232,135,58,0.75)'); g.addColorStop(1, 'rgba(250,210,140,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(cx - 30, H); x.quadraticCurveTo(cx - 40 + sw, H - hgt * 0.5, cx + sw * 1.4, H - hgt); x.quadraticCurveTo(cx + 30 + sw * 0.5, H - hgt * 0.5, cx + 34, H); x.fill(); x.restore(); }
    })));
    /** water: horizontal ink ripple strokes */
    api.waterTex = (seed = 12) => tex(cv(1024, 1024, (x, W, H) => { const r = rand(seed); for (let i = 0; i < 520; i++) { const px = r() * W, py = r() * H, L = 30 + r() * 140; stroke(x, quad([px, py], [px + L / 2, py - 3 - r() * 4], [px + L, py]), 3 + r() * 3, 1, INKC, 0.08 + r() * 0.16, r); } }), [3, 3]);

    // ---------------- the bronze cauldron 鼎 (real 3D) ----------------
    api.ding = () => {
      const g = new T.Group();
      const patina = tex(cv(512, 256, (x, W, H) => { const r = rand(88); x.fillStyle = '#9c7a38'; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 900; i++) { x.fillStyle = r() < 0.6 ? `rgba(70,118,100,${0.12 + 0.3 * r()})` : `rgba(60,40,20,${0.1 + 0.2 * r()})`; x.beginPath(); x.ellipse(r() * W, r() * H, 2 + r() * 14, 2 + r() * 8, r() * 3, 0, TAU); x.fill(); }
        // a band of cast pattern (taotie-like meander, drawn as square spirals)
        x.strokeStyle = 'rgba(40,28,14,0.55)'; x.lineWidth = 3; for (let k = 0; k < 16; k++) { const cx = k * 32 + 16, cy = 70; x.beginPath(); x.moveTo(cx - 12, cy - 12); x.lineTo(cx + 12, cy - 12); x.lineTo(cx + 12, cy + 12); x.lineTo(cx - 6, cy + 12); x.lineTo(cx - 6, cy - 4); x.lineTo(cx + 4, cy - 4); x.lineTo(cx + 4, cy + 4); x.stroke(); }
        x.fillStyle = 'rgba(40,28,14,0.4)'; x.fillRect(0, 40, W, 3); x.fillRect(0, 100, W, 3);
      }), [1, 1]);
      const mat = new T.MeshStandardMaterial({ color: 0xffffff, map: patina, metalness: 0.55, roughness: 0.42 });
      const prof = [[0, -0.55], [0.32, -0.56], [0.58, -0.44], [0.72, -0.2], [0.76, 0.05], [0.74, 0.28], [0.8, 0.33], [0.82, 0.38], [0.74, 0.38], [0.7, 0.32], [0.66, 0.05], [0, 0.05]].map(([a, b]) => new T.Vector2(a, b));
      const body = new T.Mesh(new T.LatheGeometry(prof, 64), mat); g.add(body);
      for (const s of [-1, 1]) { const h = new T.Mesh(new T.TorusGeometry(0.17, 0.045, 10, 24, Math.PI), mat); h.position.set(s * 0.6, 0.38, 0); h.rotation.y = Math.PI / 2; g.add(h); }
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5, leg = new T.Mesh(new T.CylinderGeometry(0.07, 0.11, 0.62, 16), mat); leg.position.set(Math.cos(a) * 0.42, -0.78, Math.sin(a) * 0.42); g.add(leg); }
      g.userData.mat = mat; return g;
    };
    // ---------------- the halberd 戟 (real 3D) ----------------
    api.ji = (len = 2.6) => {
      const g = new T.Group(), iron = new T.MeshStandardMaterial({ color: 0x3b3a3a, metalness: 0.6, roughness: 0.38 }), wood = new T.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8 });
      const shaft = new T.Mesh(new T.CylinderGeometry(0.022, 0.026, len, 10), wood); shaft.position.y = len / 2; g.add(shaft);
      const tip = new T.Mesh(new T.ConeGeometry(0.05, 0.36, 4), iron); tip.position.y = len + 0.18; tip.scale.z = 0.35; g.add(tip);
      const sh = new T.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.22, 0.02, 0.34, 0.2); sh.quadraticCurveTo(0.2, 0.1, 0.02, 0.12); sh.closePath();
      const blade = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }), iron); blade.position.set(0.02, len - 0.12, -0.006); g.add(blade);
      // the "small branch" (小支): a short spur below the blade — what Lü Bu's arrow hits
      const spur = new T.Mesh(new T.BoxGeometry(0.16, 0.022, 0.012), iron); spur.position.set(-0.09, len - 0.2, 0); spur.rotation.z = -0.35; g.add(spur);
      const tass = new T.Mesh(new T.ConeGeometry(0.05, 0.18, 8), new T.MeshStandardMaterial({ color: 0xa3302a, roughness: 0.9 })); tass.position.y = len - 0.36; tass.rotation.z = Math.PI; g.add(tass);
      g.userData.spur = spur; return g;
    };

    return api;
  };
  window.INK = INK;
})();
