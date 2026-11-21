/*
 * world.js — the material world of 「흙은 어디에서 왔는가?」: baked textures, lit relief, cracks, roots, grains.
 * Everything here runs once at build time (inside Video.define) or as a pure function of t. No Math.random, no Date.
 *
 * technique: cokacmotion 162-relight (MIT, github.com/kstost/cokacmotion) — height field → Sobel normals → wrapped Lambert
 *            + rim + contact AO, rebuilt here in Canvas 2D for a cut soil face instead of a painted room.
 * technique: cokacmotion 37-fracture — impact-centred Voronoi cells, crack arrival times from the impact (rebuilt without physics).
 * technique: cokacmotion 03-coral-growth — space-colonization growth baked once, drawn by birth order with pipe-model thickness.
 * technique: cokacmotion 17-hangul-particles — glyph pixels sampled once; particle positions are closed forms of t.
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
  const sm = (k) => k * k * (3 - 2 * k);
  W.noise = function (x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };
  W.fbm = function (x, y, s = 0, oct = 4, gain = 0.5, lac = 2.02) {
    let v = 0, a = 0.5, q = 1, n = 0;
    for (let i = 0; i < oct; i++) { v += a * W.noise(x * q, y * q, s + i * 31); n += a; a *= gain; q *= lac; }
    return v / n;
  };
  // ridged noise for rock: sharp creases
  W.ridged = function (x, y, s = 0, oct = 4) {
    let v = 0, a = 0.5, q = 1, n = 0;
    for (let i = 0; i < oct; i++) { const r = 1 - Math.abs(W.noise(x * q, y * q, s + i * 53) * 2 - 1); v += a * r * r; n += a; a *= 0.5; q *= 2.1; }
    return v / n;
  };

  // ---------- canvas helpers ----------
  W.canvas = function (w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  W.ctx = (c) => c.getContext('2d');
  W.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  W.lerp = (a, b, k) => a + (b - a) * k;
  W.mix = function (c1, c2, k) { return [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k, c1[2] + (c2[2] - c1[2]) * k]; };
  W.hex = function (h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  W.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  /**
   * relight(albedo Uint8ClampedArray rgb, height Float32Array, w, h, light) → ImageData
   * light: { dx, dy, dz } direction towards the light (screen x right, y down, z out of screen), col [r,g,b] 0..1 multipliers,
   *        amb ambient, rim rim strength, ao strength (contact occlusion from a low-pass of the height), spec gloss.
   */
  W.relight = function (alb, hgt, w, h, L) {
    const out = new ImageData(w, h), o = out.data;
    const len = Math.hypot(L.dx, L.dy, L.dz) || 1, lx = L.dx / len, ly = L.dy / len, lz = L.dz / len;
    const col = L.col || [1, 1, 1], amb = L.amb ?? 0.22, wrap = L.wrap ?? 0.3, rimK = L.rim ?? 0.35, aoK = L.ao ?? 0.55, spec = L.spec ?? 0;
    // low-pass height for AO (box 2 passes)
    let lp = null;
    if (aoK > 0) {
      lp = new Float32Array(w * h); const r = L.aoRadius || 6;
      const tmp = new Float32Array(w * h);
      for (let y = 0; y < h; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += hgt[y * w + W.clamp(x, 0, w - 1)];
        for (let x = 0; x < w; x++) { tmp[y * w + x] = acc / (2 * r + 1); acc += hgt[y * w + W.clamp(x + r + 1, 0, w - 1)] - hgt[y * w + W.clamp(x - r, 0, w - 1)]; } }
      for (let x = 0; x < w; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[W.clamp(y, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) { lp[y * w + x] = acc / (2 * r + 1); acc += tmp[W.clamp(y + r + 1, 0, h - 1) * w + x] - tmp[W.clamp(y - r, 0, h - 1) * w + x]; } }
    }
    const hs = L.heightScale ?? 1;
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - 1) * w, y1 = y * w, y2 = Math.min(h - 1, y + 1) * w;
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - 1), x2 = Math.min(w - 1, x + 1);
        const gx = ((hgt[y0 + x2] + 2 * hgt[y1 + x2] + hgt[y2 + x2]) - (hgt[y0 + x0] + 2 * hgt[y1 + x0] + hgt[y2 + x0])) / 8 * hs;
        const gy = ((hgt[y2 + x0] + 2 * hgt[y2 + x] + hgt[y2 + x2]) - (hgt[y0 + x0] + 2 * hgt[y0 + x] + hgt[y0 + x2])) / 8 * hs;
        let nx = -gx, ny = -gy, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const ndl = nx * lx + ny * ly + nz * lz;
        let diff = (ndl + wrap) / (1 + wrap); if (diff < 0) diff = 0;
        // rim: edges facing the light
        const nxy = Math.hypot(nx, ny); const rim = nxy > 0.001 ? rimK * (1 - nz) * (1 - nz) * Math.max(0, (nx * lx + ny * ly) / nxy) : 0;
        let ao = 1; if (lp) { const occ = W.clamp((lp[y1 + x] - hgt[y1 + x]) / (L.aoDepth || 10), 0, 1); ao = 1 - aoK * occ; }
        let sp = 0; if (spec > 0) { const hx = lx, hy = ly, hz = lz + 1; const hl = Math.hypot(hx, hy, hz); const ndh = (nx * hx + ny * hy + nz * hz) / hl; sp = spec * Math.pow(Math.max(0, ndh), 24); }
        const i = (y1 + x) * 4, j = (y1 + x) * 3;
        const k = (amb + (1 - amb) * diff) * ao;
        o[i] = W.clamp(alb[j] * k * col[0] + (rim + sp) * 255 * col[0], 0, 255);
        o[i + 1] = W.clamp(alb[j + 1] * k * col[1] + (rim + sp) * 255 * col[1], 0, 255);
        o[i + 2] = W.clamp(alb[j + 2] * k * col[2] + (rim + sp) * 255 * col[2], 0, 255);
        o[i + 3] = 255;
      }
    }
    return out;
  };

  /** bake a material: fill(x, y, rnd) → { c: [r,g,b], h } per pixel; returns { canvas, height, w, h } lit by L */
  W.bake = function (w, h, fill, L, seed = 1) {
    const alb = new Uint8ClampedArray(w * h * 3), hgt = new Float32Array(w * h);
    const px = { c: [0, 0, 0], h: 0 };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      fill(x, y, px, seed);
      const j = (y * w + x) * 3; alb[j] = px.c[0]; alb[j + 1] = px.c[1]; alb[j + 2] = px.c[2]; hgt[y * w + x] = px.h;
    }
    const img = W.relight(alb, hgt, w, h, L);
    const c = W.canvas(w, h); W.ctx(c).putImageData(img, 0, 0);
    return { canvas: c, height: hgt, w, h };
  };

  // ---------- materials ----------
  // light: a low sun from the upper left, slightly towards the viewer (the cut face is lit obliquely)
  W.KEY = { dx: -0.55, dy: -0.6, dz: 0.45, col: [1.05, 0.95, 0.83], amb: 0.15, wrap: 0.2, rim: 0.42, ao: 0.85, heightScale: 2.4, aoRadius: 7, aoDepth: 8 };
  W.HARD = { dx: 0.6, dy: -0.7, dz: 0.35, col: [1, 1, 1.02], amb: 0.08, wrap: 0.05, rim: 0.2, ao: 0.8 };   // the moon: hard sun, no sky light

  // granite: grey base, pink feldspar, pale quartz, black mica flecks; sharp creased height
  W.granite = function (w, h, seed = 11, L = W.KEY, opt = {}) {
    const sc = opt.scale || 1;
    const F = W.hex('#d6a58e'), Q = W.hex('#e4e0da'), M = W.hex('#2a2521'), G = W.hex('#8a827a');
    return W.bake(w, h, (x, y, p, s) => {
      const u = x * sc, v = y * sc;
      const n1 = W.ridged(u / 90, v / 90, s, 4), n2 = W.fbm(u / 7, v / 7, s + 7, 3);
      const spec = W.noise(u / 4.5, v / 4.5, s + 3), cr = W.fbm(u / 18, v / 18, s + 11, 2);
      let c = G;
      if (spec > 0.78) c = F; else if (spec > 0.66) c = Q; else if (spec < 0.1) c = M;
      c = W.mix(c, G, 0.25 * cr);
      const tone = 0.85 + 0.3 * n2;
      p.c[0] = c[0] * tone; p.c[1] = c[1] * tone; p.c[2] = c[2] * tone;
      p.h = n1 * 18 + n2 * 4 + (spec > 0.78 ? 1.5 : 0) - (spec < 0.1 ? 1.2 : 0);
    }, L, seed);
  };

  // soil: crumbly grains; base and tones per layer
  W.soil = function (w, h, opt, L = W.KEY) {
    const base = W.hex(opt.base), dark = W.hex(opt.dark || opt.base), light = W.hex(opt.light || opt.base);
    const grain = opt.grain || 3.2, relief = opt.relief || 7, mottle = opt.mottle || 0, seed = opt.seed || 5, sc = opt.scale || 1;
    const mot = opt.mottleColor ? W.hex(opt.mottleColor) : light;
    return W.bake(w, h, (x, y, p, s) => {
      const u = x * sc, v = y * sc;
      const g = W.noise(u / grain, v / grain, s), g2 = W.noise(u / (grain * 2.7), v / (grain * 2.7), s + 2);
      const big = W.fbm(u / 60, v / 60, s + 9, 3);
      let c = W.mix(dark, light, W.clamp(0.25 + 0.9 * (g - 0.5) + 0.5 * (g2 - 0.5), 0, 1));
      c = W.mix(c, base, 0.45);
      if (mottle) { const m = W.fbm(u / 34, v / 34, s + 21, 3); c = W.mix(c, mot, mottle * W.clamp((m - 0.5) * 3, 0, 1)); }
      const tone = 0.9 + 0.2 * (big - 0.5);
      p.c[0] = c[0] * tone; p.c[1] = c[1] * tone; p.c[2] = c[2] * tone;
      // grains stand up on a freshly cut face: pointed bumps
      const bump = Math.pow(g, 2.2) * relief + g2 * relief * 0.5 + big * relief * 0.6;
      p.h = bump;
    }, L, seed);
  };

  // regolith: fine grey dust, hard light
  W.regolith = function (w, h, seed = 23, L = W.HARD, foot) {
    const G = W.hex('#9fa3a8'), D = W.hex('#5f6368'), Li = W.hex('#c9ccd0');
    return W.bake(w, h, (x, y, p, s) => {
      const g = W.noise(x / 2.4, y / 2.4, s), g2 = W.noise(x / 9, y / 9, s + 2), big = W.fbm(x / 140, y / 140, s + 3, 3);
      let c = W.mix(D, Li, W.clamp(0.3 + 0.8 * (g - 0.5) + 0.4 * (g2 - 0.5), 0, 1)); c = W.mix(c, G, 0.5);
      const tone = 0.88 + 0.24 * (big - 0.5);
      let hgt = g * 3 + g2 * 2.5 + big * 14;
      if (foot) { const d = foot(x, y); if (d > 0) hgt -= d; }
      p.c[0] = c[0] * tone; p.c[1] = c[1] * tone; p.c[2] = c[2] * tone; p.h = hgt;
    }, L, seed);
  };

  // a boot sole print as a height carve: returns fn(x,y) → depth in px (0 outside)
  W.bootprint = function (cx, cy, sx = 1, sy = 1, rot = 0) {
    const cs = Math.cos(rot), sn = Math.sin(rot);
    return function (x, y) {
      let dx = x - cx, dy = y - cy; const u = (dx * cs + dy * sn) / sx, v = (-dx * sn + dy * cs) / sy;
      // sole: rounded rectangle 120 × 300 with a heel; tread bars
      const half = Math.abs(u) <= 62 && Math.abs(v) <= 150;
      if (!half) return 0;
      const edge = Math.min(62 - Math.abs(u), 150 - Math.abs(v));
      let d = 17 * W.clamp(edge / 9, 0, 1);
      const bar = Math.abs(((v + 150) % 34) - 17) < 6 && Math.abs(u) < 50 && (v < -12 || v > 40);
      if (!bar && Math.abs(v) > 12) d *= 0.35;
      return d;
    };
  };

  // soft blurred copy for an out-of-focus plane (blur applied once at bake)
  W.blurred = function (src, px, scale = 0.5) {
    const c = W.canvas(Math.max(2, Math.round(src.width * scale)), Math.max(2, Math.round(src.height * scale)));
    const g = W.ctx(c); g.filter = `blur(${px}px)`; g.drawImage(src, 0, 0, c.width, c.height); g.filter = 'none';
    return c;
  };

  // a texture as a CSS background (for hero type made of the world's material): a data URL built at run time, never in source
  W.cssTexture = function (canvas) { return `url("${canvas.toDataURL('image/jpeg', 0.9)}")`; };

  // ---------- Voronoi fracture ----------
  // seeds on a jittered polar grid around the impact (dense near it), cells by half-plane clipping of the bounding rect;
  // then every shared edge is bent the same way on both sides (jag), so the pieces stay gap-free but no longer look like a web.
  W.fracture = function (rect, impact, seed = 37, rings = 4, sectors = 8) {
    const rnd = W.rand(seed), seeds = [];
    const [x0, y0, rw, rh] = rect, maxR = Math.hypot(rw, rh);
    let r = 42;
    const secs = [7, 9, 8, 11, 13, 15];
    for (let k = 0; k < rings && r < maxR; k++) {
      const n = secs[k % secs.length] + Math.round(sectors - 8), off = rnd() * TAU;
      for (let i = 0; i < n; i++) {
        if (k > 0 && rnd() < 0.22) continue;   // a missing seed here and there: uneven cells
        const a = off + (i + (rnd() - 0.5) * 0.9) * TAU / n, rr = r * (0.7 + rnd() * 0.6);
        seeds.push([impact[0] + Math.cos(a) * rr, impact[1] + Math.sin(a) * rr * (0.8 + rnd() * 0.4)]);
      }
      r *= 2.05;
    }
    for (let i = 0; i < 16; i++) seeds.push([x0 + rnd() * rw, y0 + rnd() * rh]);
    const jagOf = (a, b) => {   // shared, direction-independent bend points for the edge a–b
      const ka = `${Math.round(a[0])},${Math.round(a[1])}`, kb = `${Math.round(b[0])},${Math.round(b[1])}`;
      const flip = ka > kb; const p = flip ? b : a, q = flip ? a : b;
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 18) return [];
      const n = L > 120 ? 3 : L > 50 ? 2 : 1, nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L, out = [];
      const h0 = hash2(Math.round(p[0]), Math.round(p[1]), seed + Math.round(q[0]));
      for (let i = 1; i <= n; i++) { const k = i / (n + 1), off = (hash2(Math.round(q[0]) + i, Math.round(q[1]), seed + 3) - 0.5) * L * 0.22 * (0.5 + h0); out.push([p[0] + (q[0] - p[0]) * k + nx * off, p[1] + (q[1] - p[1]) * k + ny * off]); }
      return flip ? out.reverse() : out;
    };
    const cells = seeds.map((s, i) => {
      let poly = [[x0, y0], [x0 + rw, y0], [x0 + rw, y0 + rh], [x0, y0 + rh]];
      for (let j = 0; j < seeds.length && poly.length; j++) {
        if (j === i) continue;
        const o = seeds[j], mx = (s[0] + o[0]) / 2, my = (s[1] + o[1]) / 2, nx = o[0] - s[0], ny = o[1] - s[1];
        const out = [];
        for (let k = 0; k < poly.length; k++) {
          const a = poly[k], b = poly[(k + 1) % poly.length];
          const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
          if (da <= 0) out.push(a);
          if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
        }
        poly = out;
      }
      if (poly.length < 3) return null;
      const straight = poly; poly = [];
      for (let k = 0; k < straight.length; k++) { const a = straight[k], b = straight[(k + 1) % straight.length]; poly.push(a); for (const j of jagOf(a, b)) poly.push(j); }
      const cx = straight.reduce((a, p) => a + p[0], 0) / straight.length, cy = straight.reduce((a, p) => a + p[1], 0) / straight.length;
      const dist = Math.hypot(cx - impact[0], cy - impact[1]);
      return { poly, straight, c: [cx, cy], dist, seed: s, r: rnd() };
    }).filter(Boolean);
    // crack polylines with arrival times (radial distance from the impact ≈ time); some edges never open until the split
    const edges = [], seen = new Set();
    for (const c of cells) for (let k = 0; k < c.straight.length; k++) {
      const a = c.straight[k], b = c.straight[(k + 1) % c.straight.length];
      const key = [a, b].map((p) => `${Math.round(p[0])},${Math.round(p[1])}`).sort().join('|'); if (seen.has(key)) continue; seen.add(key);
      if (a[0] < x0 - 1 && b[0] < x0 - 1) continue;
      const pts = [a, ...jagOf(a, b), b].map((p) => [p[0], p[1], Math.hypot(p[0] - impact[0], p[1] - impact[1])]);
      const tmin = Math.min(...pts.map((p) => p[2]));
      edges.push({ pts, tmin, open: tmin < 140 || hash2(Math.round(a[0] * 3), Math.round(b[1] * 3), seed + 9) < 0.66 });
    }
    return { cells, edges, impact };
  };
  // draw the crack network reached by radius R (px from the impact); all = every edge, else only the open ones
  W.drawCracks = function (g, fr, R, width, color, all = false) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color; g.lineWidth = width;
    g.beginPath();
    for (const e of fr.edges) {
      if (e.tmin > R || (!all && !e.open)) continue;
      const P = e.pts; let started = false;
      for (let i = 0; i < P.length - 1; i++) {
        let a = P[i], b = P[i + 1];
        if (a[2] > R && b[2] > R) { started = false; continue; }
        if (a[2] > b[2]) { [a, b] = [b, a]; }
        const s = b[2] <= R ? 1 : W.clamp((R - a[2]) / Math.max(1e-3, b[2] - a[2]), 0, 1);
        g.moveTo(a[0], a[1]); g.lineTo(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s);
      }
    }
    g.stroke();
  };
  W.cellPath = function (g, poly) { g.beginPath(); g.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) g.lineTo(poly[i][0], poly[i][1]); g.closePath(); };

  // ---------- roots: space colonization ----------
  /** opts: { origin [x,y], region (x,y) → bool, box [x0,y0,w,h], n attractors, step, kill, influence, down bias } */
  W.roots = function (opts) {
    const rnd = W.rand(opts.seed || 3), box = opts.box, n = opts.n || 600, step = opts.step || 9;
    const kill = opts.kill || 14, infl = opts.influence || 140, down = opts.down ?? 0.35;
    const att = opts.points ? opts.points.map((p) => [p[0], p[1]]) : [];
    let guard = 0;
    while (!opts.points && att.length < n && guard++ < n * 40) { const x = box[0] + rnd() * box[2], y = box[1] + rnd() * box[3]; if (!opts.region || opts.region(x, y)) att.push([x, y]); }
    const nodes = [{ x: opts.origin[0], y: opts.origin[1], p: -1, k: 0, dx: 0, dy: 1 }];
    let fresh = [0], alive = att.map(() => true);
    for (let it = 1; it < (opts.iters || 400) && fresh.length; it++) {
      const pull = new Map();
      for (let ai = 0; ai < att.length; ai++) {
        if (!alive[ai]) continue; const a = att[ai];
        let best = -1, bd = infl * infl;
        for (let ni = 0; ni < nodes.length; ni++) { const nd = nodes[ni]; const d = (nd.x - a[0]) ** 2 + (nd.y - a[1]) ** 2; if (d < bd) { bd = d; best = ni; } }
        if (best < 0) continue;
        if (bd < kill * kill) { alive[ai] = false; continue; }
        const arr = pull.get(best) || [0, 0, 0]; const nd = nodes[best]; const dx = a[0] - nd.x, dy = a[1] - nd.y, l = Math.hypot(dx, dy) || 1;
        arr[0] += dx / l; arr[1] += dy / l; arr[2]++; pull.set(best, arr);
      }
      fresh = [];
      if (!pull.size) {
        // nothing in reach: extend the tips downwards
        const tips = nodes.filter((nd, i) => !nodes.some((o) => o.p === i));
        for (const tip of tips.slice(0, 4)) { const i = nodes.indexOf(tip); const ang = Math.atan2(tip.dy, tip.dx) + (rnd() - 0.5) * 0.5; const nx = tip.x + Math.cos(ang) * step, ny = tip.y + Math.sin(ang) * step; if (ny > box[1] + box[3]) continue; nodes.push({ x: nx, y: ny, p: i, k: it, dx: Math.cos(ang), dy: Math.sin(ang) }); fresh.push(nodes.length - 1); }
        if (!fresh.length) break; continue;
      }
      for (const [ni, arr] of pull) {
        const nd = nodes[ni]; let dx = arr[0] / arr[2] + nd.dx * 0.45, dy = arr[1] / arr[2] + nd.dy * 0.45 + down; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        dx += (rnd() - 0.5) * 0.25; dy += (rnd() - 0.5) * 0.25; const l2 = Math.hypot(dx, dy) || 1; dx /= l2; dy /= l2;
        const nx = nd.x + dx * step, ny = nd.y + dy * step;
        if (nodes.some((o) => o.p === ni && Math.abs(o.x - nx) < step * 0.5 && Math.abs(o.y - ny) < step * 0.5)) continue;
        nodes.push({ x: nx, y: ny, p: ni, k: it, dx, dy }); fresh.push(nodes.length - 1);
      }
    }
    const kmax = nodes[nodes.length - 1].k || 1;
    // descendant counts (pipe model) in reverse order
    const desc = new Float32Array(nodes.length);
    for (let i = nodes.length - 1; i > 0; i--) { desc[i] += 1; desc[nodes[i].p] += desc[i]; }
    return { nodes, kmax, desc };
  };
  /** draw roots grown to G (0..1 of kmax); radius = base + k·desc^0.5 */
  W.drawRoots = function (g, R, G, style) {
    const kk = G * R.kmax, base = style.base || 1.2, k = style.k || 0.55, pow = style.pow || 0.52;
    const tipCol = style.tip, col = style.color;
    for (let i = 1; i < R.nodes.length; i++) {
      const nd = R.nodes[i]; if (nd.k > kk + 1) continue;
      const p = R.nodes[nd.p]; const f = W.clamp(kk - nd.k + 1, 0, 1);
      const x = p.x + (nd.x - p.x) * f, y = p.y + (nd.y - p.y) * f;
      // descendants born so far ≈ desc scaled by progress of the subtree (approximation: all or nothing after birth)
      const d = R.desc[i] * W.clamp((kk - nd.k) / Math.max(1, R.kmax - nd.k), 0, 1);
      g.lineWidth = base + k * Math.pow(d, pow);
      g.strokeStyle = tipCol && f < 1 ? tipCol : col; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(x, y); g.stroke();
    }
  };

  // ---------- glyph sampling → grains ----------
  /** sample n points inside text drawn with font; returns [{x,y}] relative to (0,0) centre */
  W.sampleText = function (text, font, n, seed = 17, size = 320) {
    const c = W.canvas(Math.ceil(size * text.length * 1.1) + 40, Math.ceil(size * 1.3)), g = W.ctx(c);
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(text, c.width / 2, c.height / 2);
    const img = g.getImageData(0, 0, c.width, c.height).data, pts = [], rnd = W.rand(seed);
    const edge = [], inner = [];
    for (let y = 1; y < c.height - 1; y += 2) for (let x = 1; x < c.width - 1; x += 2) {
      const i = (y * c.width + x) * 4; if (img[i + 3] < 128) continue;
      const out = img[((y - 2) * c.width + x) * 4 + 3] < 128 || img[((y + 2) * c.width + x) * 4 + 3] < 128 || img[(y * c.width + x - 2) * 4 + 3] < 128 || img[(y * c.width + x + 2) * 4 + 3] < 128;
      (out ? edge : inner).push([x - c.width / 2, y - c.height / 2]);
    }
    const nE = Math.min(edge.length, Math.round(n * 0.3)), nI = Math.min(inner.length, n - nE);
    for (let i = 0; i < nE; i++) pts.push(edge[Math.floor(rnd() * edge.length)]);
    for (let i = 0; i < nI; i++) pts.push(inner[Math.floor(rnd() * inner.length)]);
    return pts;
  };

  // ---------- sprites ----------
  W.grainSprite = function (size, col, seed = 1) {
    const c = W.canvas(size, size), g = W.ctx(c), r = size / 2, rnd = W.rand(seed);
    g.translate(r, r); g.beginPath();
    const n = 7; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (0.62 + rnd() * 0.3); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath();
    const grd = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); grd.addColorStop(0, W.rgb(W.mix(col, [255, 240, 220], 0.45))); grd.addColorStop(0.7, W.rgb(col)); grd.addColorStop(1, W.rgb(W.mix(col, [0, 0, 0], 0.55)));
    g.fillStyle = grd; g.fill();
    return c;
  };
  W.glowSprite = function (size, col) {
    const c = W.canvas(size, size), g = W.ctx(c), r = size / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r); grd.addColorStop(0, W.rgb(col, 1)); grd.addColorStop(0.25, W.rgb(col, 0.55)); grd.addColorStop(1, W.rgb(col, 0));
    g.fillStyle = grd; g.fillRect(0, 0, size, size); return c;
  };
  W.leafSprite = function (len, col, vein, seed = 1) {
    const c = W.canvas(len, len), g = W.ctx(c), r = len / 2; g.translate(r, r);
    g.beginPath(); g.moveTo(0, -r * 0.92); g.bezierCurveTo(r * 0.55, -r * 0.5, r * 0.5, r * 0.5, 0, r * 0.92); g.bezierCurveTo(-r * 0.5, r * 0.5, -r * 0.55, -r * 0.5, 0, -r * 0.92); g.closePath();
    const grd = g.createLinearGradient(-r * 0.5, -r, r * 0.5, r); grd.addColorStop(0, W.rgb(W.mix(col, [255, 230, 180], 0.3))); grd.addColorStop(1, W.rgb(W.mix(col, [40, 20, 10], 0.4)));
    g.fillStyle = grd; g.fill();
    g.strokeStyle = W.rgb(vein, 0.7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -r * 0.85); g.lineTo(0, r * 0.85); g.stroke();
    g.lineWidth = 0.9; for (let i = -3; i <= 3; i++) { if (!i) continue; const y = i * r * 0.22; g.beginPath(); g.moveTo(0, y); g.lineTo(Math.sign(i) * 0 + (i < 0 ? -1 : 1) * r * 0.42, y + r * 0.22); g.stroke(); }
    return c;
  };
  W.dropSprite = function (size, col) {
    const c = W.canvas(size, size * 1.3), g = W.ctx(c), r = size / 2; g.translate(r, size * 0.72);
    g.beginPath(); g.moveTo(0, -size * 0.7); g.bezierCurveTo(r * 0.9, -r * 0.1, r, r * 0.3, 0, r * 0.55); g.bezierCurveTo(-r, r * 0.3, -r * 0.9, -r * 0.1, 0, -size * 0.7); g.closePath();
    const grd = g.createRadialGradient(-r * 0.3, 0, r * 0.1, 0, 0, r); grd.addColorStop(0, W.rgb(W.mix(col, [255, 255, 255], 0.75), 0.95)); grd.addColorStop(0.6, W.rgb(col, 0.75)); grd.addColorStop(1, W.rgb(W.mix(col, [0, 30, 60], 0.5), 0.9));
    g.fillStyle = grd; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(-r * 0.32, -r * 0.1, r * 0.14, r * 0.26, -0.4, 0, TAU); g.fill();
    return c;
  };
  W.wormSprite = function (len, h, col) {
    const c = W.canvas(len, h * 2), g = W.ctx(c); g.translate(0, h);
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const x = (i + 0.5) * len / segs, rr = h * 0.5 * (i < 2 ? 0.75 : i > segs - 3 ? 0.8 : 1);
      const grd = g.createRadialGradient(x - rr * 0.3, -rr * 0.35, rr * 0.1, x, 0, rr * 1.1);
      grd.addColorStop(0, W.rgb(W.mix(col, [255, 220, 200], 0.5))); grd.addColorStop(0.7, W.rgb(col)); grd.addColorStop(1, W.rgb(W.mix(col, [60, 20, 20], 0.5)));
      g.fillStyle = grd; g.beginPath(); g.ellipse(x, 0, len / segs * 0.62, rr, 0, 0, TAU); g.fill();
    }
    return c;
  };

  /** a sneaker seen from the side, standing on the ground at (x, groundY); toe points left. Lit from the upper left. */
  W.shoe = function (g, x, gy, k = 1, alpha = 1) {
    g.save(); g.translate(x, gy); g.scale(k, k); g.globalAlpha = alpha;
    // contact shadow
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(-20, 6, 250, 16, 0, 0, Math.PI * 2); g.fill();
    // midsole + outsole: pale rubber with a dark tread
    g.fillStyle = '#2a211a'; g.beginPath(); g.moveTo(-250, 0); g.lineTo(190, 0); g.quadraticCurveTo(205, 0, 205, -14); g.lineTo(-240, -14); g.quadraticCurveTo(-256, -14, -250, 0); g.closePath(); g.fill();
    const mid = g.createLinearGradient(0, -46, 0, -14); mid.addColorStop(0, '#e8e0d2'); mid.addColorStop(1, '#b9ad9c');
    g.fillStyle = mid; g.beginPath(); g.moveTo(-246, -14); g.quadraticCurveTo(-262, -30, -236, -46); g.lineTo(186, -40); g.quadraticCurveTo(208, -38, 206, -14); g.closePath(); g.fill();
    // upper: a low sneaker profile
    const up = g.createLinearGradient(-100, -230, 60, -40); up.addColorStop(0, '#5a4636'); up.addColorStop(0.5, '#33271d'); up.addColorStop(1, '#17110c');
    g.fillStyle = up; g.beginPath();
    g.moveTo(-236, -46); g.quadraticCurveTo(-250, -80, -205, -104);           // toe cap
    g.quadraticCurveTo(-130, -124, -70, -150); g.quadraticCurveTo(-30, -168, 10, -176); // vamp up to the tongue
    g.quadraticCurveTo(60, -186, 110, -214); g.quadraticCurveTo(160, -236, 186, -206); // collar
    g.lineTo(186, -40); g.closePath(); g.fill();
    // toe cap seam and rim light along the top (the key light from the upper left)
    g.strokeStyle = 'rgba(255,224,180,0.5)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-204, -102); g.quadraticCurveTo(-130, -122, -70, -148); g.quadraticCurveTo(-30, -166, 10, -174); g.quadraticCurveTo(60, -184, 110, -212); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-150, -60); g.quadraticCurveTo(-150, -95, -120, -118); g.stroke();
    // eyelets and laces
    g.strokeStyle = '#d8ccb8'; g.lineWidth = 4; for (let i = 0; i < 4; i++) { const xx = -40 + i * 40, yy = -150 + i * 14; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 30, yy - 22); g.stroke(); }
    g.fillStyle = '#17110c'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-44 + i * 40, -148 + i * 14 - 12, 3, 0, 6.283); g.fill(); }
    // heel tab
    g.fillStyle = '#c9b89c'; g.beginPath(); g.moveTo(160, -206); g.lineTo(186, -210); g.lineTo(186, -160); g.lineTo(166, -160); g.closePath(); g.fill();
    g.restore();
  };

  // closed-form helpers
  W.ease = { out: (k) => 1 - Math.pow(1 - W.clamp(k, 0, 1), 3), inout: (k) => { k = W.clamp(k, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }, smooth: (k) => { k = W.clamp(k, 0, 1); return k * k * (3 - 2 * k); } };
})();
