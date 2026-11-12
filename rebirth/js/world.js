/*
 * world.js — the dawn lake of 「사람은 윤회하는가, 영영 사라지는가」 (storyboard.md → 월드 바이블).
 * A watercolour sky that moves through one whole day over the film, two misty ridges, a lake that mirrors the sky with
 * a rippling reflection, and glowing motes. Baked once; drawing is a pure function of t. No Math.random, no Date.
 *
 * technique: cokacmotion 17-hangul-particles (MIT, github.com/kstost/cokacmotion) — particle positions as closed forms
 *            of t (motes, atoms, stars), rebuilt for light over water.
 */
(function () {
  const W = (window.LAKE = {});
  const TAU = Math.PI * 2;
  W.rand = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = (k) => k * k * (3 - 2 * k);
  W.noise = (x, y, s = 0) => { const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi); const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; };
  W.fbm = (x, y, s = 0, o = 4) => { let v = 0, a = 0.5, q = 1, n = 0; for (let i = 0; i < o; i++) { v += a * W.noise(x * q, y * q, s + i * 31); n += a; a *= 0.5; q *= 2.03; } return v / n; };
  W.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  W.k = (t, a, b) => W.clamp((t - a) / (b - a), 0, 1);
  W.lerp = (a, b, k) => a + (b - a) * k;
  W.io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  W.out = (k) => 1 - Math.pow(1 - k, 3);
  W.hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  W.mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  W.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  W.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  W.HZ = 640;               // the horizon line (stage px)

  // ---------- the day: six skies, each [zenith, middle, horizon, sun colour, sun height (0 = horizon, 1 = high), sun glow] ----------
  const P = (z, m, h, s) => ({ z: W.hex(z), m: W.hex(m), h: W.hex(h), s: W.hex(s) });
  W.SKIES = [
    Object.assign(P('#3d4a8f', '#8b7ec8', '#f4b8b0', '#ffd7b0'), { sun: -0.08, glow: 0.55 }),   // 0 before dawn: indigo → lilac → rose
    Object.assign(P('#7b8fd6', '#c9b3ea', '#ffc9a8', '#fff0c8'), { sun: 0.06, glow: 0.9 }),    // 1 dawn: periwinkle → lavender → peach
    Object.assign(P('#8ec5f0', '#cfe6f6', '#fff1d8', '#fffbe8'), { sun: 0.42, glow: 0.7 }),    // 2 morning: sky blue → cream
    Object.assign(P('#76c3e6', '#c6ecef', '#e9fbf4', '#ffffff'), { sun: 0.7, glow: 0.45 }),    // 3 clear day: blue → mint white
    Object.assign(P('#5b5fae', '#e58fa2', '#ffc27a', '#ffe0a0'), { sun: 0.05, glow: 1.0 }),    // 4 sunset: violet → coral → gold
    Object.assign(P('#1f2a63', '#3d3f8f', '#9a6fb0', '#ffd7a8'), { sun: -0.15, glow: 0.35 }),  // 5 evening stars: deep blue → violet glow (never black)
  ];
  W.skyAt = function (d) {
    const i = W.clamp(Math.floor(d), 0, W.SKIES.length - 2), k = W.io(W.clamp(d - i, 0, 1)), A = W.SKIES[i], B = W.SKIES[i + 1];
    return { z: W.mix(A.z, B.z, k), m: W.mix(A.m, B.m, k), h: W.mix(A.h, B.h, k), s: W.mix(A.s, B.s, k), sun: W.lerp(A.sun, B.sun, k), glow: W.lerp(A.glow, B.glow, k), night: W.clamp((d - 4.2) / 0.8, 0, 1) };
  };

  // ---------- baked: ridges, paper grain, stars, sprites ----------
  W.bake = function () {
    const r = W.rand(7);
    const ridge = (base, amp, freq, seed) => { const pts = []; for (let x = -20; x <= 1940; x += 12) pts.push([x, base - amp * (0.55 * W.fbm(x / freq, 0.3, seed, 5) + 0.45 * Math.pow(Math.sin(x / (freq * 1.7) + seed) * 0.5 + 0.5, 1.5))]); return pts; };
    W.ridges = [ridge(W.HZ, 170, 520, 3), ridge(W.HZ, 95, 300, 9)];
    // paper grain: soft watercolour blotches
    const g = W.canvas(960, 540), x = g.getContext('2d'), img = x.createImageData(960, 540), dd = img.data;
    for (let j = 0; j < 540; j++) for (let i = 0; i < 960; i++) { const n = W.fbm(i / 90, j / 90, 4, 4) * 0.7 + hash(i, j, 2) * 0.3; const v = 128 + (n - 0.5) * 60; const o = (j * 960 + i) * 4; dd[o] = dd[o + 1] = dd[o + 2] = v; dd[o + 3] = 255; }
    x.putImageData(img, 0, 0); W.grain = g;
    W.stars = Array.from({ length: 260 }, () => ({ x: r() * 1920, y: r() * (W.HZ - 80), s: 0.6 + r() * r() * 2.6, tw: r() * TAU, sp: 0.5 + r() * 2 }));
    W.glow = (s, c) => { const cv = W.canvas(s, s), q = cv.getContext('2d'), gr = q.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, W.rgb(c, 1)); gr.addColorStop(0.18, W.rgb(c, 0.7)); gr.addColorStop(0.45, W.rgb(c, 0.18)); gr.addColorStop(1, W.rgb(c, 0)); q.fillStyle = gr; q.fillRect(0, 0, s, s); return cv; };
    W.sp = { gold: W.glow(128, W.hex('#ffcf7a')), white: W.glow(128, [255, 252, 240]), lav: W.glow(128, W.hex('#c4b0ff')), mint: W.glow(128, W.hex('#8fe6d8')), peach: W.glow(128, W.hex('#ffb199')), warm: W.glow(128, W.hex('#ff9a5c')) };
    W.sky = W.canvas(480, 160);   // the low-res sky for the reflection
  };

  /** draw the whole world for day d: sky, sun, stars, ridges, lake with rippled reflection, grain */
  W.draw = function (g, t, d, opt = {}) {
    const S = W.skyAt(d), H = W.HZ;
    // sky
    const sg = g.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, W.rgb(S.z)); sg.addColorStop(0.55, W.rgb(S.m)); sg.addColorStop(1, W.rgb(S.h));
    g.fillStyle = sg; g.fillRect(0, 0, 1920, H + 2);
    // stars (fade in at night, and wherever opt.stars asks)
    const sa = Math.max(S.night, opt.stars || 0);
    if (sa > 0.01) { for (const s of W.stars) { const a = sa * (0.55 + 0.45 * Math.sin(t * s.sp + s.tw)); g.fillStyle = `rgba(255,250,235,${a * 0.9})`; g.beginPath(); g.arc(s.x, s.y, s.s, 0, TAU); g.fill(); } }
    // sun + glow
    const sx = opt.sunX ?? 1240, sy = H - 30 - S.sun * 520;
    g.globalCompositeOperation = 'lighter';
    const R = 520 * S.glow; g.globalAlpha = 0.55; g.drawImage(W.sp.white, sx - R, sy - R, R * 2, R * 2); g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    if (S.sun > -0.12) { g.fillStyle = W.rgb(W.mix(S.s, [255, 255, 255], 0.4), 0.95); g.beginPath(); g.arc(sx, sy, 46, 0, TAU); g.fill(); }
    // ridges: far (hazy, close to the sky) and near (deeper, tinted)
    const ridgeCol = [W.mix(S.h, S.z, 0.32), W.mix(S.m, S.z, 0.62)];
    W.ridges.forEach((pts, i) => { g.fillStyle = W.rgb(ridgeCol[i], 0.92); g.beginPath(); g.moveTo(-20, H + 2); pts.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(1940, H + 2); g.closePath(); g.fill();
      const hz = g.createLinearGradient(0, H - 120, 0, H); hz.addColorStop(0, W.rgb(S.h, 0)); hz.addColorStop(1, W.rgb(S.h, 0.35 - i * 0.12)); g.fillStyle = hz; g.fillRect(0, H - 120, 1920, 122); });
    // lake: the reflection of what is above, flipped and rippled, deepening towards the viewer
    const sc = W.sky, q = sc.getContext('2d'); q.setTransform(0.25, 0, 0, 0.25, 0, 0); q.drawImage(g.canvas, 0, 0, g.canvas.width, g.canvas.height * (H / 1080), 0, 0, 1920, H); q.setTransform(1, 0, 0, 1, 0, 0);
    const LH = 1080 - H, strips = 72;
    for (let i = 0; i < strips; i++) {
      const y0 = H + (i / strips) * LH, h = LH / strips + 1, depth = i / strips;
      const off = Math.sin(t * 1.3 + i * 0.55) * (2 + depth * 14) + Math.sin(t * 0.7 + i * 1.7) * depth * 6;
      const srcY = (1 - Math.pow(depth, 0.85)) * 160;   // mirror: near the horizon reflects the low sky
      g.drawImage(sc, 0, Math.max(0, srcY - 2.2), 480, 2.2, off - 20, y0, 1960, h);
    }
    const wv = g.createLinearGradient(0, H, 0, 1080); wv.addColorStop(0, W.rgb(S.h, 0.25)); wv.addColorStop(0.3, W.rgb(S.m, 0.12)); wv.addColorStop(1, W.rgb(W.mix(S.z, [20, 30, 60], 0.3), 0.45));
    g.fillStyle = wv; g.fillRect(0, H, 1920, LH);
    // sun path glitter on the water
    if (S.sun > -0.12) { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 70; i++) { const yy = H + 6 + Math.pow(i / 70, 1.6) * LH; const w = 14 + (i / 70) * 150; const a = (0.35 + 0.35 * Math.sin(t * 3 + i * 1.9)) * S.glow * (1 - i / 90); g.fillStyle = W.rgb(S.s, a * 0.55); g.fillRect(sx - w / 2 + Math.sin(i * 2.1 + t) * w * 0.4, yy, w * (0.3 + 0.4 * hash(i, 1, 3)), 2 + i / 25); } g.globalCompositeOperation = 'source-over'; }
    // a bright hairline at the horizon
    g.fillStyle = W.rgb(W.mix(S.h, [255, 255, 255], 0.5), 0.5); g.fillRect(0, H, 1920, 1.5);
    // paper grain (soft-light)
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.35; g.drawImage(W.grain, 0, 0, 1920, 1080); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };

  /** a glowing mote at (x, y), radius r, sprite key, alpha; plus its reflection on the water when above the horizon */
  W.mote = function (g, x, y, r, key = 'gold', a = 1, refl = true) {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
    g.drawImage(W.sp[key], x - r * 4, y - r * 4, r * 8, r * 8); g.drawImage(W.sp.white, x - r, y - r, r * 2, r * 2);
    if (refl && y < W.HZ) { const ry = 2 * W.HZ - y; g.globalAlpha = a * 0.35; g.drawImage(W.sp[key], x - r * 3, ry - r * 2, r * 6, r * 4); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  /** a soft light trail through points [[x,y]…] up to fraction k */
  W.trail = function (g, pts, k, col, w = 4, a = 1) {
    if (k <= 0) return; const n = Math.max(2, Math.floor(pts.length * k));
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, la] of [[w * 5, 0.12], [w * 2, 0.3], [w, 0.9]]) { g.strokeStyle = W.rgb(col, la * a); g.lineWidth = lw; g.beginPath(); for (let i = 0; i < n; i++) i ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[i][0], pts[i][1]); g.stroke(); }
    g.restore();
  };
  /** a human silhouette of light (head + shoulders + body), centred at (x, y = feet), height h */
  W.figure = function (g, x, y, h, col, a = 1, fill = 0.18) {
    g.save(); g.globalAlpha = a; const u = h / 10;
    g.beginPath(); g.arc(x, y - u * 8.6, u * 1.25, 0, TAU);
    g.moveTo(x - u * 2.2, y); g.bezierCurveTo(x - u * 2.4, y - u * 4, x - u * 2.6, y - u * 6.6, x - u * 1.1, y - u * 7.1); g.lineTo(x + u * 1.1, y - u * 7.1); g.bezierCurveTo(x + u * 2.6, y - u * 6.6, x + u * 2.4, y - u * 4, x + u * 2.2, y); g.closePath();
    g.fillStyle = W.rgb(col, fill); g.fill(); g.strokeStyle = W.rgb(col, 0.85); g.lineWidth = 2.2; g.stroke();
    g.restore();
  };
  /** an oil lamp on the shore: a small bowl and a flame of size f (0 = unlit) */
  W.lamp = function (g, x, y, f, t, seed) {
    g.fillStyle = 'rgba(120,80,60,0.9)'; g.beginPath(); g.ellipse(x, y, 30, 11, 0, 0, Math.PI); g.fill();
    g.fillStyle = 'rgba(170,120,90,0.95)'; g.beginPath(); g.ellipse(x, y, 30, 6, 0, 0, TAU); g.fill();
    if (f <= 0.01) return;
    const fl = 1 + 0.08 * Math.sin(t * 9 + seed) + 0.05 * Math.sin(t * 13 + seed * 2);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = f; g.drawImage(W.sp.gold, x - 70, y - 110, 140, 140);
    g.fillStyle = 'rgba(255,214,140,0.95)'; g.beginPath(); g.moveTo(x, y - 46 * f * fl); g.quadraticCurveTo(x + 11 * f, y - 14 * f, x, y - 3); g.quadraticCurveTo(x - 11 * f, y - 14 * f, x, y - 46 * f * fl); g.fill();
    g.fillStyle = 'rgba(255,255,235,0.95)'; g.beginPath(); g.ellipse(x, y - 13 * f, 3.5 * f, 9 * f, 0, 0, TAU); g.fill();
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
})();
