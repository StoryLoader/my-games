/*
 * world.js — the material world of 「세상에서 가장 이해하기 쉬운 GPU 만드는 법」: a lit silicon surface, copper wiring,
 * gold core tiles, an iridescent wafer, sand grains. Baked once at build time; drawing helpers are pure functions of t.
 * No Math.random, no Date.
 *
 * technique: cokacmotion 162-relight (MIT, github.com/kstost/cokacmotion) — height field → Sobel normals → wrapped Lambert
 *            + rim, rebuilt in Canvas 2D for a silicon die with copper traces instead of a painted room.
 * technique: cokacmotion 39-thin-film — a thickness field mapped through an interference palette for the oxide sheen on
 *            silicon and the wafer's rainbow.
 */
(function () {
  const W = (window.WORLD = {});
  const TAU = Math.PI * 2;

  // ---------- deterministic noise ----------
  W.rand = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };
  function hash2(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  W.hash = hash2;
  const sm = (k) => k * k * (3 - 2 * k);
  W.noise = function (x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };
  W.fbm = function (x, y, s = 0, oct = 4) {
    let v = 0, a = 0.5, q = 1, n = 0;
    for (let i = 0; i < oct; i++) { v += a * W.noise(x * q, y * q, s + i * 31); n += a; a *= 0.5; q *= 2.02; }
    return v / n;
  };

  // ---------- small math ----------
  W.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  W.lerp = (a, b, k) => a + (b - a) * k;
  W.k = (t, a, b) => W.clamp((t - a) / (b - a), 0, 1);           // 0..1 progress of t through [a, b]
  W.ease = {
    out: (k) => 1 - Math.pow(1 - k, 3),
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    expo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    back: (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  };
  W.hex = function (h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  W.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  W.mix = (c1, c2, k) => [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k, c1[2] + (c2[2] - c1[2]) * k];
  W.canvas = function (w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  W.ctx = (c) => c.getContext('2d');

  // the palette (storyboard.md → 월드 바이블)
  W.C = { si: W.hex('#0d1424'), cu: W.hex('#e08a4a'), core: W.hex('#f2c14e'), on: W.hex('#5fe3c0'), euv: W.hex('#9b7bff'), fg: W.hex('#eef2fa') };

  /** thin-film interference colour for a film thickness d (0..1 ≈ 0..600 nm) — 39-thin-film's palette, in 0..1 rgb */
  W.film = function (d) {
    const r = 0.5 + 0.5 * Math.cos(TAU * (d * 2.1 + 0.0));
    const g = 0.5 + 0.5 * Math.cos(TAU * (d * 2.1 + 0.33));
    const b = 0.5 + 0.5 * Math.cos(TAU * (d * 2.1 + 0.67));
    return [r, g, b];
  };

  /**
   * relight: albedo (rgb 0..255 Float32Array ×3), height (Float32Array), size → ImageData lit from `L`.
   * Sobel normals of the height, wrapped Lambert, a rim on edges facing away, a specular glint.
   */
  W.relight = function (alb, hgt, w, h, L) {
    const img = new ImageData(w, h), o = img.data;
    const ln = Math.hypot(L.dx, L.dy, L.dz), lx = L.dx / ln, ly = L.dy / ln, lz = L.dz / ln;
    const hx = lx, hy = ly, hz = lz + 1, hn = Math.hypot(hx, hy, hz);
    for (let y = 0; y < h; y++) {
      const y0 = y > 0 ? y - 1 : y, y1 = y < h - 1 ? y + 1 : y;
      for (let x = 0; x < w; x++) {
        const x0 = x > 0 ? x - 1 : x, x1 = x < w - 1 ? x + 1 : x;
        const gx = (hgt[y0 * w + x1] + 2 * hgt[y * w + x1] + hgt[y1 * w + x1]) - (hgt[y0 * w + x0] + 2 * hgt[y * w + x0] + hgt[y1 * w + x0]);
        const gy = (hgt[y1 * w + x0] + 2 * hgt[y1 * w + x] + hgt[y1 * w + x1]) - (hgt[y0 * w + x0] + 2 * hgt[y0 * w + x] + hgt[y0 * w + x1]);
        let nx = -gx * L.relief, ny = -gy * L.relief, nz = 1; const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
        const ndl = nx * lx + ny * ly + nz * lz;
        const dif = Math.max(0, (ndl + L.wrap) / (1 + L.wrap));
        const spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hn), L.gloss) * L.spec;
        const rim = Math.pow(1 - nz, 1.5) * L.rim * Math.max(0, -(nx * lx + ny * ly));
        const i = (y * w + x), k = L.amb + dif * L.key;
        o[i * 4] = alb[i * 3] * k * L.col[0] + 255 * (spec + rim) * L.spc[0];
        o[i * 4 + 1] = alb[i * 3 + 1] * k * L.col[1] + 255 * (spec + rim) * L.spc[1];
        o[i * 4 + 2] = alb[i * 3 + 2] * k * L.col[2] + 255 * (spec + rim) * L.spc[2];
        o[i * 4 + 3] = 255;
      }
    }
    return img;
  };

  /**
   * The silicon surface: dark blue-black crystal with an oxide sheen, copper traces in a Manhattan routing, vias.
   * Returns { canvas } at w×h. seed varies the routing.
   */
  W.silicon = function (w, h, seed = 1, opt = {}) {
    const r = W.rand(seed), alb = new Float32Array(w * h * 3), hgt = new Float32Array(w * h);
    const base = W.C.si, cu = W.C.cu, density = opt.traces ?? 1;
    // crystal + film sheen
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const n = W.fbm(x / 260, y / 260, seed, 3), f = W.film(0.25 + n * 0.5 + x / w * 0.25), fine = hash2(x, y, seed) * 0.08;
      const m = 0.18 + 0.1 * n;
      alb[i * 3] = base[0] * (1 + fine) + f[0] * 255 * m * (opt.sheen ?? 1);
      alb[i * 3 + 1] = base[1] * (1 + fine) + f[1] * 255 * m * (opt.sheen ?? 1);
      alb[i * 3 + 2] = base[2] * (1 + fine) + f[2] * 255 * m * (opt.sheen ?? 1);
      hgt[i] = fine * 0.3;
    }
    // traces: horizontal and vertical runs on a 24 px pitch, jogging once; raised and copper
    const pitch = 24;
    const lay = (x0, y0, x1, y1, wd) => {
      const xa = Math.min(x0, x1) - wd, xb = Math.max(x0, x1) + wd, ya = Math.min(y0, y1) - wd, yb = Math.max(y0, y1) + wd;
      for (let y = Math.max(0, ya | 0); y < Math.min(h, yb); y++) for (let x = Math.max(0, xa | 0); x < Math.min(w, xb); x++) {
        const i = y * w + x;
        const d = Math.min(x - xa, xb - x, y - ya, yb - y), crown = Math.min(1, d / (wd * 0.9));
        hgt[i] = Math.max(hgt[i], 1.4 * Math.sqrt(crown));
        const sh = 0.75 + 0.25 * hash2(x >> 3, y >> 3, seed + 7);
        alb[i * 3] = cu[0] * sh; alb[i * 3 + 1] = cu[1] * sh * 0.92; alb[i * 3 + 2] = cu[2] * sh * 0.85;
      }
    };
    const N = Math.round((w * h) / 9000 * density);
    for (let k = 0; k < N; k++) {
      const x0 = Math.round(r() * w / pitch) * pitch, y0 = Math.round(r() * h / pitch) * pitch;
      const horiz = r() < 0.5, L1 = (40 + r() * 340) * (r() < 0.5 ? -1 : 1), L2 = (20 + r() * 160) * (r() < 0.5 ? -1 : 1);
      const wd = r() < 0.12 ? 5 : 2.5;
      if (horiz) { const x1 = x0 + L1, y1 = y0 + L2; lay(x0, y0, x1, y0, wd); lay(x1, y0, x1, y1, wd); }
      else { const y1 = y0 + L1, x1 = x0 + L2; lay(x0, y0, x0, y1, wd); lay(x0, y1, x1, y1, wd); }
    }
    // vias: little square pads
    for (let k = 0; k < N * 0.6; k++) { const x0 = Math.round(r() * w / pitch) * pitch, y0 = Math.round(r() * h / pitch) * pitch; lay(x0 - 1, y0 - 1, x0 + 1, y0 + 1, 5); }
    const L = { dx: -0.55, dy: -0.7, dz: 0.75, relief: 0.9, wrap: 0.35, key: 1.0, amb: 0.35, gloss: 40, spec: 0.55, rim: 0.4, col: [1, 1, 1.05], spc: [0.95, 0.98, 1.0] };
    const c = W.canvas(w, h); W.ctx(c).putImageData(W.relight(alb, hgt, w, h, L), 0, 0);
    return { canvas: c };
  };

  /** a gold core tile (brushed metal, bevelled, with a micro pattern of logic), size s px */
  W.coreTile = function (s, seed = 3, tint = W.C.core) {
    const alb = new Float32Array(s * s * 3), hgt = new Float32Array(s * s), bv = Math.max(2, s * 0.08);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const i = y * s + x, d = Math.min(x, y, s - 1 - x, s - 1 - y), crown = Math.min(1, d / bv);
      const brush = 0.85 + 0.15 * W.noise(x / 1.2, y / 18, seed);
      // the logic inside: a few rows of tiny cells
      const cell = (x > bv * 1.6 && x < s - bv * 1.6 && y > bv * 1.6 && y < s - bv * 1.6) && ((x >> 2) + (y >> 3)) % 3 === 0 && hash2(x >> 2, y >> 3, seed) > 0.4;
      const k = brush * (cell ? 0.7 : 1);
      alb[i * 3] = tint[0] * k; alb[i * 3 + 1] = tint[1] * k; alb[i * 3 + 2] = tint[2] * k;
      hgt[i] = crown * 2 + (cell ? -0.3 : 0);
    }
    const L = { dx: -0.6, dy: -0.75, dz: 0.8, relief: 0.8, wrap: 0.3, key: 1.0, amb: 0.4, gloss: 24, spec: 0.5, rim: 0.3, col: [1, 1, 1], spc: [1, 0.95, 0.85] };
    const c = W.canvas(s, s); W.ctx(c).putImageData(W.relight(alb, hgt, s, s, L), 0, 0);
    return c;
  };

  /** a soft round glow sprite in colour c */
  W.glow = function (s, c) {
    const cv = W.canvas(s, s), g = W.ctx(cv), grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, W.rgb(c, 1)); grd.addColorStop(0.25, W.rgb(c, 0.55)); grd.addColorStop(1, W.rgb(c, 0));
    g.fillStyle = grd; g.fillRect(0, 0, s, s); return cv;
  };

  /** a quartz sand grain: translucent, faceted, with a bright edge; s px */
  W.grain = function (s, seed) {
    const cv = W.canvas(s, s), g = W.ctx(cv), r = W.rand(seed), n = 7 + ((r() * 4) | 0), pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r() * 0.4, rd = s * (0.34 + r() * 0.12); pts.push([s / 2 + Math.cos(a) * rd, s / 2 + Math.sin(a) * rd * (0.8 + r() * 0.2)]); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    const tone = 200 + r() * 40, grd = g.createLinearGradient(0, 0, s, s);
    grd.addColorStop(0, `rgba(${tone + 20},${tone + 10},${tone - 10},0.95)`); grd.addColorStop(0.6, `rgba(${tone - 50},${tone - 60},${tone - 80},0.85)`); grd.addColorStop(1, `rgba(${tone - 120},${tone - 130},${tone - 140},0.9)`);
    g.fillStyle = grd; g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 3; i++) { const p = pts[(i * 2) % n], q = pts[(i * 2 + 3) % n]; g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
    const hl = g.createRadialGradient(s * 0.35, s * 0.3, 0, s * 0.35, s * 0.3, s * 0.3); hl.addColorStop(0, 'rgba(255,255,250,0.7)'); hl.addColorStop(1, 'rgba(255,255,250,0)');
    g.fillStyle = hl; g.fillRect(0, 0, s, s); g.restore();
    g.strokeStyle = 'rgba(255,245,230,0.55)'; g.lineWidth = 1.5; g.stroke();
    return cv;
  };

  /**
   * The picture on "the screen": a small procedural landscape at dusk, cw×ch cells. Returns { canvas, px } where
   * px[i] = [r,g,b] of each cell (for drawing sub-pixels close up).
   */
  W.picture = function (cw, ch, seed = 9) {
    const c = W.canvas(cw, ch), g = W.ctx(c), img = g.createImageData(cw, ch), d = img.data, px = new Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const u = x / cw, v = y / ch;
      // sky: violet to amber at the horizon
      let col = W.mix(W.hex('#241a52'), W.hex('#ff9a5a'), Math.pow(v / 0.62, 1.6));
      // sun
      const ds = Math.hypot((u - 0.68) * 1.78, v - 0.5); if (ds < 0.09) col = W.mix(W.hex('#fff2c8'), col, sm(W.clamp((ds - 0.06) / 0.03, 0, 1)));
      col = W.mix(col, W.hex('#ffd08a'), Math.max(0, 0.35 - ds) * 0.8);
      // mountains, two ranges
      const m1 = 0.56 + 0.08 * W.fbm(u * 3, 1, seed, 4) - 0.05 * Math.sin(u * 5.3);
      const m2 = 0.66 + 0.06 * W.fbm(u * 5, 4, seed + 3, 4);
      if (v > m1) col = W.mix(W.hex('#5a3e78'), W.hex('#2a2048'), W.clamp((v - m1) * 6, 0, 1));
      if (v > m2) col = W.mix(W.hex('#1d2a44'), W.hex('#0e1424'), W.clamp((v - m2) * 3, 0, 1));
      // a lake reflecting the sun
      if (v > 0.8) { const rf = Math.max(0, 0.14 - Math.abs(u - 0.68)) * 5 * (0.6 + 0.4 * W.noise(x * 0.6, y * 3, 2)); col = W.mix(W.hex('#132038'), W.hex('#ffb070'), rf); }
      const i = y * cw + x; px[i] = col; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { canvas: c, px, cw, ch };
  };

  /**
   * draw the picture as a screen at camera zoom z around (fx, fy) in picture cells. Close up (cells > 14 px) each cell
   * becomes three R/G/B stripes; further out the picture itself. on(i) 0..1 brightness per cell (the refresh sweep).
   */
  W.drawScreen = function (g, P, cam, opt = {}) {
    const cell = (1920 / P.cw) * cam.z, ox = 960 - (cam.fx * 1920 / P.cw) * cam.z, oy = 540 - (cam.fy * 1080 / P.ch) * cam.z;
    const blend = W.clamp((cell - 16) / 12, 0, 1);
    g.fillStyle = '#05060a'; g.fillRect(0, 0, 1920, 1080);
    if (blend < 1) { g.globalAlpha = 1; g.imageSmoothingEnabled = cell < 6; g.drawImage(P.canvas, ox, oy, P.cw * cell, P.ch * cell); g.imageSmoothingEnabled = true; }
    if (blend > 0) {
      const x0 = Math.max(0, Math.floor(-ox / cell)), x1 = Math.min(P.cw - 1, Math.ceil((1920 - ox) / cell));
      const y0 = Math.max(0, Math.floor(-oy / cell)), y1 = Math.min(P.ch - 1, Math.ceil((1080 - oy) / cell));
      g.globalAlpha = blend; g.fillStyle = '#05060a'; g.fillRect(0, 0, 1920, 1080);
      const sw = cell / 3, gap = Math.max(1, cell * 0.08);
      g.globalCompositeOperation = 'lighter';
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const c = P.px[y * P.cw + x], k = opt.on ? opt.on(x, y) : 1, X = ox + x * cell, Y = oy + y * cell;
        g.fillStyle = `rgb(${(c[0] * k) | 0},0,0)`; g.fillRect(X + gap / 2, Y + gap, sw - gap, cell - gap * 2);
        g.fillStyle = `rgb(0,${(c[1] * k) | 0},0)`; g.fillRect(X + sw + gap / 2, Y + gap, sw - gap, cell - gap * 2);
        g.fillStyle = `rgb(0,0,${(c[2] * k) | 0})`; g.fillRect(X + sw * 2 + gap / 2, Y + gap, sw - gap, cell - gap * 2);
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
  };

  /**
   * a die: a dark iridescent square of side s at (cx, cy), with n×n gold cores in its core area (fill 0..1 = how many
   * of them are present, filled row by row from the centre outwards), a border of copper pads. tile is a baked core tile.
   */
  W.drawDie = function (g, cx, cy, s, n, opt = {}) {
    const fill = opt.fill ?? 1, tile = opt.tile, alpha = opt.alpha ?? 1, glowK = opt.glow ?? 0;
    const ga = g.globalAlpha * alpha;
    g.save(); g.globalAlpha = ga;
    // the package shadow
    const so = s * 0.03; g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(cx - s / 2 - so * 0.5, cy - s / 2 + so * 0.4, s + so, s + so * 1.4); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(cx - s / 2, cy - s / 2 + so * 0.5, s, s + so * 0.6);
    // the die surface: iridescent oxide
    const grd = g.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
    grd.addColorStop(0, '#2a2f5e'); grd.addColorStop(0.35, '#132a40'); grd.addColorStop(0.6, '#2a1d4a'); grd.addColorStop(1, '#0f2a36');
    g.fillStyle = grd; g.fillRect(cx - s / 2, cy - s / 2, s, s);
    if (opt.si) { g.globalAlpha = ga * 0.55; g.drawImage(opt.si, 0, 0, 900, 900, cx - s / 2, cy - s / 2, s, s); g.globalAlpha = ga; }
    // pads around the edge
    const pad = s * 0.035; g.fillStyle = '#c98048';
    const np = Math.max(6, Math.round(s / 26));
    for (let i = 0; i < np; i++) { const u = (i + 0.5) / np; for (const [x, y] of [[u, 0], [u, 1], [0, u], [1, u]]) g.fillRect(cx - s / 2 + x * (s - pad) , cy - s / 2 + y * (s - pad), pad * 0.8, pad * 0.8); }
    // the core area
    const area = s * (opt.area ?? 0.8), a0x = cx - area / 2, a0y = cy - area / 2, step = area / n, gap = Math.max(0.6, step * (opt.gap ?? 0.12));
    const total = n * n, shown = Math.round(total * fill);
    if (shown > 0) {
      // order cells by distance from the centre so the fill grows outwards
      const key = `${n}`; W._ord = W._ord || {};
      if (!W._ord[key]) { const o = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) o.push([i, j, Math.hypot(i - (n - 1) / 2, j - (n - 1) / 2) + W.hash(i, j, 5) * 0.4]); o.sort((p, q) => p[2] - q[2]); W._ord[key] = o; }
      const ord = W._ord[key];
      if (step > 7 && tile) { for (let k = 0; k < shown; k++) { const [i, j] = ord[k]; g.drawImage(tile, a0x + i * step + gap / 2, a0y + j * step + gap / 2, step - gap, step - gap); } }
      else { g.fillStyle = opt.cellColor || '#d9a842'; for (let k = 0; k < shown; k++) { const [i, j] = ord[k]; g.fillRect(a0x + i * step + gap / 2, a0y + j * step + gap / 2, step - gap, step - gap); } }
      if (opt.lit) { g.globalCompositeOperation = 'lighter'; for (let k = 0; k < shown; k++) { const [i, j] = ord[k], v = opt.lit(i, j); if (v <= 0.01) continue; g.fillStyle = `rgba(255,220,120,${v * 0.75})`; g.fillRect(a0x + i * step + gap / 2, a0y + j * step + gap / 2, step - gap, step - gap); } g.globalCompositeOperation = 'source-over'; }
    }
    // a sheen sweeping across (film)
    const sh = g.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2), p = opt.sheen ?? 0.3;
    sh.addColorStop(W.clamp(p - 0.2, 0, 1), 'rgba(160,140,255,0)'); sh.addColorStop(W.clamp(p, 0, 1), 'rgba(180,200,255,0.16)'); sh.addColorStop(W.clamp(p + 0.2, 0, 1), 'rgba(120,255,220,0)');
    g.fillStyle = sh; g.fillRect(cx - s / 2, cy - s / 2, s, s);
    // edge highlight (key light upper left)
    g.strokeStyle = 'rgba(220,230,255,0.55)'; g.lineWidth = Math.max(1, s * 0.006);
    g.beginPath(); g.moveTo(cx - s / 2, cy + s / 2); g.lineTo(cx - s / 2, cy - s / 2); g.lineTo(cx + s / 2, cy - s / 2); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.moveTo(cx + s / 2, cy - s / 2); g.lineTo(cx + s / 2, cy + s / 2); g.lineTo(cx - s / 2, cy + s / 2); g.stroke();
    if (glowK > 0) { g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(cx, cy, 0, cx, cy, s * 0.8); gl.addColorStop(0, `rgba(255,200,100,${0.25 * glowK})`); gl.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gl; g.fillRect(cx - s, cy - s, s * 2, s * 2); g.globalCompositeOperation = 'source-over'; }
    g.restore();
  };

  /** a wafer: an iridescent disc of radius R at (cx, cy) with a die grid (dies across), notch at the bottom. tilt squashes y */
  W.drawWafer = function (g, cx, cy, R, opt = {}) {
    const tilt = opt.tilt ?? 1, dies = opt.dies ?? 0, t = opt.t ?? 0, grid = opt.grid ?? 1;
    g.save(); g.translate(cx, cy); g.scale(1, tilt);
    // edge thickness when tilted
    if (tilt < 0.95) { g.fillStyle = '#3a3f4e'; g.beginPath(); g.ellipse(0, 10 / tilt, R, R, 0, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.closePath(); g.save(); g.clip();
    // base: polished silicon mirror
    const base = g.createLinearGradient(-R, -R, R, R); base.addColorStop(0, '#8a93a8'); base.addColorStop(0.45, '#3a4256'); base.addColorStop(1, '#1a2032');
    g.fillStyle = base; g.fillRect(-R, -R, 2 * R, 2 * R);
    if (dies > 0) {
      const step = (2 * R) / dies;
      for (let j = 0; j < dies; j++) for (let i = 0; i < dies; i++) {
        const x = -R + i * step, y = -R + j * step, xc = x + step / 2, yc = y + step / 2;
        if (Math.hypot(Math.max(Math.abs(xc) + step / 2, 0), Math.max(Math.abs(yc) + step / 2, 0)) > R * 1.02) continue;
        if (opt.skip && opt.skip(i, j)) continue;
        // each die: thin-film colour that varies with position (the rainbow) plus the die's own pattern
        const f = W.film(0.3 + 0.35 * (xc + yc) / (2 * R) + 0.15 * Math.sin(t * 0.6 + i * 0.3));
        g.fillStyle = `rgba(${(50 + f[0] * 95) | 0},${(55 + f[1] * 90) | 0},${(80 + f[2] * 110) | 0},${0.8 * grid})`;
        g.fillRect(x + step * 0.04, y + step * 0.04, step * 0.92, step * 0.92);
        if (step > 18) { g.fillStyle = `rgba(242,193,78,${0.35 * grid})`; g.fillRect(x + step * 0.2, y + step * 0.2, step * 0.6, step * 0.6); }
      }
    }
    // the mirror sheen: a broad band of film colour
    const sh = g.createLinearGradient(-R, -R * 0.4, R, R * 0.4);
    const p = 0.5 + 0.3 * Math.sin(t * 0.4);
    sh.addColorStop(W.clamp(p - 0.3, 0, 1), 'rgba(155,123,255,0)'); sh.addColorStop(W.clamp(p - 0.12, 0, 1), 'rgba(155,123,255,0.22)'); sh.addColorStop(W.clamp(p, 0, 1), 'rgba(95,227,192,0.22)'); sh.addColorStop(W.clamp(p + 0.14, 0, 1), 'rgba(255,170,90,0.16)'); sh.addColorStop(W.clamp(p + 0.3, 0, 1), 'rgba(255,170,90,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = sh; g.fillRect(-R, -R, 2 * R, 2 * R); g.globalCompositeOperation = 'source-over';
    g.restore();
    // rim + notch
    g.strokeStyle = 'rgba(230,236,255,0.7)'; g.lineWidth = 2.5 / Math.max(0.3, tilt); g.beginPath(); g.arc(0, 0, R, Math.PI * 0.95, Math.PI * 1.75); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(0, 0, R, -Math.PI * 0.2, Math.PI * 0.85); g.stroke();
    g.fillStyle = '#05060a'; g.beginPath(); g.arc(0, R, R * 0.03, Math.PI, TAU); g.fill();
    g.restore();
  };

  /** a lamp (an output light) at (x, y), radius r, on 0..1, colour c */
  W.lamp = function (g, x, y, r, on, c = W.C.on) {
    g.save();
    g.fillStyle = '#10141c'; g.beginPath(); g.arc(x, y, r * 1.18, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(200,210,230,0.4)'; g.lineWidth = 2; g.stroke();
    const off = [40, 48, 60], col = W.mix(off, c, on);
    const grd = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    grd.addColorStop(0, W.rgb(W.mix(col, [255, 255, 255], 0.5 * on + 0.1))); grd.addColorStop(1, W.rgb(W.mix(col, [0, 0, 0], 0.35)));
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (on > 0.01) { g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(x, y, r * 0.5, x, y, r * 3.2); gl.addColorStop(0, W.rgb(c, 0.45 * on)); gl.addColorStop(1, W.rgb(c, 0)); g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3.2, 0, TAU); g.fill(); }
    g.restore();
  };

  /** a wire from a to b (polyline pts), lit 0..1 in colour c, with current flowing (t) when lit */
  W.wire = function (g, pts, lit, t, c = W.C.on, w = 10) {
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    const path = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
    path(); g.strokeStyle = '#3a2416'; g.lineWidth = w + 6; g.stroke();
    path(); g.strokeStyle = W.rgb(W.mix(W.hex('#9a5a30'), c, lit)); g.lineWidth = w; g.stroke();
    path(); g.strokeStyle = `rgba(255,230,200,${0.35 - 0.2 * lit})`; g.lineWidth = w * 0.25; g.stroke();
    if (lit > 0.02) {
      g.globalCompositeOperation = 'lighter';
      path(); g.strokeStyle = W.rgb(c, 0.25 * lit); g.lineWidth = w * 3; g.stroke();
      // electrons: dots marching along the path
      let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
      const sp = 34, off = (t * 220) % sp;
      for (let s = off; s < L; s += sp) {
        let rem = s, i = 0; while (i < seg.length && rem > seg[i]) { rem -= seg[i]; i++; } if (i >= seg.length) break;
        const k = rem / seg[i], x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
        g.fillStyle = `rgba(220,255,245,${0.9 * lit})`; g.beginPath(); g.arc(x, y, w * 0.32, 0, TAU); g.fill();
      }
    }
    g.restore();
  };

  /**
   * a transistor seen from above: a channel between two copper terminals, a gate bar across it. open 0..1: the gate lifts
   * and the channel lights. (x, y) centre, s scale.
   */
  W.transistor = function (g, x, y, s, open, t, opt = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    // silicon well
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(-150, -62, 300, 124);
    const well = g.createLinearGradient(0, -60, 0, 60); well.addColorStop(0, '#1b2440'); well.addColorStop(1, '#0c111e');
    g.fillStyle = well; g.fillRect(-146, -58, 292, 116);
    // channel
    const ch = W.mix(W.hex('#25304a'), W.C.on, open);
    g.fillStyle = W.rgb(ch, 0.35 + 0.5 * open); g.fillRect(-90, -26, 180, 52);
    if (open > 0.02) { g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 14; k++) { const u = ((k / 14 + t * 0.9) % 1); g.fillStyle = `rgba(200,255,240,${0.85 * open})`; g.beginPath(); g.arc(-90 + u * 180, -14 + (k % 3) * 14, 4.5, 0, TAU); g.fill(); } g.globalCompositeOperation = 'source-over'; }
    // terminals
    for (const sx of [-1, 1]) {
      const grd = g.createLinearGradient(sx * 120 - 30, -50, sx * 120 + 30, 50); grd.addColorStop(0, '#ffcf9a'); grd.addColorStop(0.5, '#d07a3e'); grd.addColorStop(1, '#6a3618');
      g.fillStyle = grd; g.fillRect(sx * 120 - 30, -50, 60, 100);
    }
    // gate bar: lifts and glows when open
    const lift = -open * 30;
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(-26, -84 + 8, 52, 168);
    const gg = g.createLinearGradient(-26, 0, 26, 0); gg.addColorStop(0, '#e9eef8'); gg.addColorStop(0.5, '#9aa6bd'); gg.addColorStop(1, '#4a5468');
    g.fillStyle = gg; g.fillRect(-26, -84 + lift, 52, 168);
    if (opt.gateGlow) { g.globalCompositeOperation = 'lighter'; g.fillStyle = W.rgb(W.C.on, 0.35 * open); g.fillRect(-30, -88 + lift, 60, 176); }
    g.restore();
  };
})();
