/*
 * room.js — the small room of 「삶에 지친 당신에게」 (storyboard.md → 월드 바이블): a paper-cut illustration of a desk by a
 * window. Every element is drawn from code; the drawing is a pure function of the state passed in (rain, morning,
 * lamp, plant growth, window opening, props). No Math.random, no Date.
 *
 * technique: cokacmotion 17-hangul-particles (MIT, github.com/kstost/cokacmotion) — particles as closed forms of t
 *            (raindrops sliding down the glass, steam, light motes), rebuilt for a quiet room.
 */
(function () {
  const R = (window.ROOM = {});
  const TAU = Math.PI * 2;
  R.rand = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
  R.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  R.k = (t, a, b) => R.clamp((t - a) / (b - a), 0, 1);
  R.lerp = (a, b, k) => a + (b - a) * k;
  R.io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  R.out = (k) => 1 - Math.pow(1 - k, 3);
  R.hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  R.mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  R.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const C = R.hex;

  // the window, the desk line
  R.WIN = { x: 1060, y: 120, w: 640, h: 560 };
  R.DESK = 770;

  R.bake = function () {
    const r = R.rand(3);
    // paper grain for the wall
    const g = document.createElement('canvas'); g.width = 960; g.height = 540; const x = g.getContext('2d'); const img = x.createImageData(960, 540), d = img.data;
    for (let j = 0; j < 540; j++) for (let i = 0; i < 960; i++) { const h = (((i * 73856093) ^ (j * 19349663)) >>> 0) % 1000 / 1000; const v = 128 + (h - 0.5) * 26 + Math.sin(i * 0.05 + j * 0.02) * 3; const o = (j * 960 + i) * 4; d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255; }
    x.putImageData(img, 0, 0); R.grain = g;
    R.drops = Array.from({ length: 140 }, () => ({ x: r(), y: r(), sp: 0.04 + r() * 0.14, s: 2 + r() * 4.5, ph: r() }));
    R.streaks = Array.from({ length: 70 }, () => ({ x: r(), sp: 0.9 + r() * 1.2, ph: r(), len: 30 + r() * 60 }));
    R.townRoofs = Array.from({ length: 16 }, (_, i) => ({ x: i / 16, w: 0.05 + r() * 0.05, h: 0.12 + r() * 0.22, lit: Array.from({ length: 4 }, () => r() < 0.45) }));
    R.glow = (s, c) => { const cv = document.createElement('canvas'); cv.width = cv.height = s; const q = cv.getContext('2d'); const gr = q.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, R.rgb(c, 0.9)); gr.addColorStop(0.35, R.rgb(c, 0.35)); gr.addColorStop(1, R.rgb(c, 0)); q.fillStyle = gr; q.fillRect(0, 0, s, s); return cv; };
    R.sp = { warm: R.glow(256, C('#ffd27a')), sun: R.glow(256, C('#fff1c8')), teal: R.glow(128, C('#9fe0d6')), leaf: R.glow(128, C('#b6f0a8')) };
  };

  // a soft paper-cut shape: fill + a darker under-edge (the shadow of the cut paper)
  function paper(g, path, fill, shade = 0.18, dy = 5) { g.save(); g.translate(0, dy); path(); g.fillStyle = `rgba(60,40,50,${shade})`; g.fill(); g.restore(); path(); g.fillStyle = fill; g.fill(); }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  /** draw the room. s: { t, rain 0..1, morning 0..1, lamp 0..1, grow 0..1, open 0..1, book 0..1, pool 0..1, lights 0..1, lights9 0..1, phone 0..1, water 0..1, rice 0..1, mug2 0..1, beam 0..1 } */
  R.draw = function (g, s) {
    const t = s.t, W = R.WIN, m = s.morning;
    // ---- wall: cream, warmer at night under the lamp, brighter in the morning
    const wall = R.mix(C('#efe3cf'), C('#fbf3e4'), m);
    g.fillStyle = R.rgb(wall); g.fillRect(0, 0, 1920, 1080);
    // a little dimness at night (never dark: the lamp keeps it warm)
    const night = (1 - m) * 0.22; if (night > 0) { g.fillStyle = `rgba(60,55,90,${night})`; g.fillRect(0, 0, 1920, R.DESK); }
    // ---- the window: sky outside, a town, rain on the glass
    const sky0 = R.mix(C('#3b4a7a'), C('#9fd3f0'), R.io(m)), sky1 = R.mix(C('#5d6d9e'), C('#ffe6c4'), R.io(m));
    g.save(); rr(g, W.x, W.y, W.w, W.h, 14); g.clip();
    const sg = g.createLinearGradient(0, W.y, 0, W.y + W.h); sg.addColorStop(0, R.rgb(sky0)); sg.addColorStop(1, R.rgb(sky1)); g.fillStyle = sg; g.fillRect(W.x, W.y, W.w, W.h);
    // the morning sun rising behind the town
    if (m > 0.05) { const sy = R.lerp(W.y + W.h + 60, W.y + 170, R.io(m)); g.globalCompositeOperation = 'lighter'; g.globalAlpha = m; g.drawImage(R.sp.sun, W.x + W.w * 0.62 - 260, sy - 260, 520, 520); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,248,225,${m})`; g.beginPath(); g.arc(W.x + W.w * 0.62, sy, 46, 0, TAU); g.fill(); }
    // town silhouettes with a few warm windows (fewer lit as morning comes)
    for (const b of R.townRoofs) { const bx = W.x + b.x * W.w, bw = b.w * W.w, bh = b.h * W.h, by = W.y + W.h - bh; g.fillStyle = R.rgb(R.mix(C('#2c3558'), C('#b9c9d6'), m)); g.fillRect(bx, by, bw + 2, bh); b.lit.forEach((l, i) => { if (!l) return; g.fillStyle = `rgba(255,214,140,${0.85 * (1 - m)})`; g.fillRect(bx + 6 + (i % 2) * (bw / 2 - 2), by + 12 + Math.floor(i / 2) * 22, 8, 10); }); }
    // rain: streaks outside + drops on the glass
    const rain = s.rain;
    if (rain > 0.01) {
      g.strokeStyle = `rgba(210,230,245,${0.35 * rain})`; g.lineWidth = 1.5;
      for (const q of R.streaks) { const yy = W.y + (((t * q.sp + q.ph) % 1) * (W.h + 120)) - 60; const xx = W.x + q.x * W.w; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - 6, yy + q.len); g.stroke(); }
      for (const q of R.drops) { const slide = ((t * q.sp * (0.4 + rain) + q.ph) % 1); const xx = W.x + q.x * W.w, yy = W.y + ((q.y + slide) % 1) * W.h; g.fillStyle = `rgba(230,242,250,${0.55 * rain})`; g.beginPath(); g.ellipse(xx, yy, q.s * 0.7, q.s, 0, 0, TAU); g.fill(); g.fillStyle = `rgba(255,255,255,${0.6 * rain})`; g.beginPath(); g.arc(xx - q.s * 0.25, yy - q.s * 0.3, q.s * 0.25, 0, TAU); g.fill(); }
    }
    g.restore();
    // the frame and the sash (the lower sash lifts when the window opens)
    const fr = '#f5ece0', frS = 'rgba(80,60,60,0.22)';
    g.lineWidth = 22; g.strokeStyle = frS; rr(g, W.x, W.y + 6, W.w, W.h, 14); g.stroke(); g.strokeStyle = fr; rr(g, W.x, W.y, W.w, W.h, 14); g.stroke();
    const mid = W.y + W.h / 2 - s.open * (W.h / 2 - 30);
    g.fillStyle = frS; g.fillRect(W.x, mid - 4, W.w, 18); g.fillStyle = fr; g.fillRect(W.x, mid - 9, W.w, 18);
    g.fillStyle = fr; g.fillRect(W.x + W.w / 2 - 8, W.y, 16, W.h);
    // sill
    paper(g, () => rr(g, W.x - 40, W.y + W.h + 6, W.w + 80, 26, 8), '#f8efe2', 0.2, 6);
    // ---- curtains (soft, peach)
    const cw = 90 + 30 * (1 - s.open);
    paper(g, () => { g.beginPath(); g.moveTo(W.x - 70, W.y - 50); g.lineTo(W.x - 70 + cw, W.y - 50); g.quadraticCurveTo(W.x - 70 + cw * 0.6, W.y + W.h / 2, W.x - 70 + cw * 0.9, W.y + W.h + 20); g.lineTo(W.x - 70, W.y + W.h + 20); g.closePath(); }, '#f3c7b3', 0.15, 4);
    paper(g, () => { g.beginPath(); g.moveTo(W.x + W.w + 70, W.y - 50); g.lineTo(W.x + W.w + 70 - cw, W.y - 50); g.quadraticCurveTo(W.x + W.w + 70 - cw * 0.6, W.y + W.h / 2, W.x + W.w + 70 - cw * 0.9, W.y + W.h + 20); g.lineTo(W.x + W.w + 70, W.y + W.h + 20); g.closePath(); }, '#f3c7b3', 0.15, 4);
    g.fillStyle = '#c9a98f'; g.fillRect(W.x - 100, W.y - 62, W.w + 200, 12);
    // ---- light on the wall: water ripples (the pool) and the morning beam
    if (s.pool > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const yy = 260 + i * 46; g.strokeStyle = `rgba(150,220,240,${0.13 * s.pool})`; g.lineWidth = 6; g.beginPath(); for (let xx = 80; xx <= 980; xx += 12) { const v = yy + Math.sin(xx * 0.018 + t * 1.6 + i) * 10 + Math.sin(xx * 0.041 - t * 1.1) * 5; xx === 80 ? g.moveTo(xx, v) : g.lineTo(xx, v); } g.stroke(); } g.restore(); }
    if (s.beam > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; const bg = g.createLinearGradient(W.x, W.y, 300, 1000); bg.addColorStop(0, `rgba(255,214,150,${0.2 * s.beam})`); bg.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = bg; g.beginPath(); g.moveTo(W.x + 10, W.y + 10); g.lineTo(W.x + W.w - 10, W.y + 10); g.lineTo(700, 1080); g.lineTo(-200, 1080); g.closePath(); g.fill();
      for (let i = 0; i < 26; i++) { const ph = (t * 0.05 + i * 0.37) % 1, xx = R.lerp(W.x + 60 + (i * 53) % 500, 200 + (i * 71) % 700, ph), yy = R.lerp(W.y + 80, 1000, ph) + Math.sin(t + i) * 12; g.fillStyle = `rgba(255,248,220,${0.6 * s.beam * Math.sin(ph * Math.PI)})`; g.beginPath(); g.arc(xx, yy, 2.4, 0, TAU); g.fill(); } g.restore(); }
    // ---- the desk
    const dg = g.createLinearGradient(0, R.DESK, 0, 1080); dg.addColorStop(0, '#e2b07e'); dg.addColorStop(1, '#c78f5e'); g.fillStyle = dg; g.fillRect(0, R.DESK, 1920, 1080 - R.DESK);
    g.fillStyle = '#f0c896'; g.fillRect(0, R.DESK, 1920, 8); g.fillStyle = 'rgba(120,70,40,0.18)'; for (let i = 0; i < 9; i++) { g.fillRect(0, R.DESK + 40 + i * 34 + Math.sin(i) * 6, 1920, 2); }
    // ---- the lamp (left) and its warm pool of light
    const L = s.lamp;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.85 * L; g.drawImage(R.sp.warm, 330 - 520, 640 - 420, 1040, 840); g.globalAlpha = 1; g.restore();
    paper(g, () => { g.beginPath(); g.ellipse(330, R.DESK + 18, 92, 20, 0, 0, TAU); }, '#6f6a8a', 0.2, 4);
    g.strokeStyle = '#6f6a8a'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(330, R.DESK + 10); g.lineTo(300, 660); g.lineTo(400, 560); g.stroke();
    paper(g, () => { g.beginPath(); g.moveTo(350, 520); g.lineTo(470, 520); g.lineTo(522, 620); g.lineTo(298, 620); g.closePath(); }, '#f1b45a', 0.18, 5);
    if (L > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; const cg = g.createLinearGradient(0, 620, 0, R.DESK + 40); cg.addColorStop(0, `rgba(255,214,140,${0.45 * L})`); cg.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = cg; g.beginPath(); g.moveTo(306, 620); g.lineTo(516, 620); g.lineTo(660, R.DESK + 40); g.lineTo(170, R.DESK + 40); g.closePath(); g.fill(); g.restore(); }
    // ---- the mug with steam (centre-left)
    paper(g, () => rr(g, 600, R.DESK - 96, 104, 112, 18), '#9fc7d6', 0.2, 5);
    g.strokeStyle = '#9fc7d6'; g.lineWidth = 14; g.beginPath(); g.arc(712, R.DESK - 44, 26, -1.2, 1.2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { const ph = (t * 0.25 + i / 3) % 1; g.globalAlpha = Math.sin(ph * Math.PI) * 0.8; g.beginPath(); for (let k = 0; k <= 10; k++) { const yy = R.DESK - 110 - k * 9 - ph * 60, xx = 630 + i * 22 + Math.sin(k * 0.8 + t * 2 + i) * 8; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } g.globalAlpha = 1;
    // ---- second mug facing the first (hp10)
    if (s.mug2 > 0.01) { g.globalAlpha = s.mug2; paper(g, () => rr(g, 790, R.DESK - 90 + (1 - s.mug2) * 20, 98, 104, 18), '#f3a98b', 0.2, 5); g.strokeStyle = '#f3a98b'; g.lineWidth = 14; g.beginPath(); g.arc(782, R.DESK - 40, 24, Math.PI - 1.2, Math.PI + 1.2); g.stroke(); g.globalAlpha = 1; }
    // ---- the book (pl01–05)
    if (s.book > 0.01) { g.globalAlpha = R.clamp(s.book * 2, 0, 1); const op = s.book; paper(g, () => { g.beginPath(); g.moveTo(860, R.DESK - 10); g.lineTo(1000, R.DESK - 10 - 30 * op); g.lineTo(1000, R.DESK + 18); g.lineTo(860, R.DESK + 30); g.closePath(); }, '#fffaf0', 0.2, 5); paper(g, () => { g.beginPath(); g.moveTo(860, R.DESK - 10); g.lineTo(720 + 0, R.DESK - 10 - 30 * op); g.lineTo(720, R.DESK + 18); g.lineTo(860, R.DESK + 30); g.closePath(); }, '#fff5e4', 0.2, 5); g.fillStyle = '#8a6fd6'; g.fillRect(856, R.DESK - 12, 8, 44);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * op; g.drawImage(R.sp.warm, 860 - 180, R.DESK - 160, 360, 240); g.restore(); g.globalAlpha = 1; }
    // ---- ten little lights on the sill (pl11): all lit, nine grow warm and steady
    if (s.lights > 0.01) { for (let i = 0; i < 10; i++) { const x = W.x + 30 + i * (W.w - 60) / 9, y = W.y + W.h + 4; const a = s.lights, warm = i < 9 ? s.lights9 : 0; g.fillStyle = '#efe2cf'; rr(g, x - 10, y - 18, 20, 20, 4); g.fill(); const f = 1 + 0.08 * Math.sin(t * 8 + i * 2); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (0.45 + 0.55 * warm); g.drawImage(R.sp.warm, x - 34, y - 70, 68, 68); g.fillStyle = 'rgba(255,220,150,0.95)'; g.beginPath(); g.ellipse(x, y - 30, 5 * f, 10 * f, 0, 0, TAU); g.fill(); g.restore(); } }
    // ---- the phone (hp02–04): lit screen
    if (s.phone > 0.01) { g.globalAlpha = s.phone; paper(g, () => rr(g, 1300, R.DESK - 6, 150, 70, 12), '#4c4866', 0.2, 4); g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(R.sp.warm, 1300 - 60, R.DESK - 110, 270, 220); g.restore(); g.fillStyle = '#ffe9b8'; rr(g, 1310, R.DESK + 2, 130, 54, 8); g.fill(); g.globalAlpha = 1; }
    // ---- water and rice (hp07)
    if (s.water > 0.01) { g.globalAlpha = s.water; paper(g, () => { g.beginPath(); g.moveTo(450, R.DESK - 110); g.lineTo(520, R.DESK - 110); g.lineTo(512, R.DESK + 10); g.lineTo(458, R.DESK + 10); g.closePath(); }, 'rgba(200,232,245,0.85)', 0.15, 4); g.fillStyle = 'rgba(120,190,220,0.6)'; g.fillRect(460, R.DESK - 60, 50, 66); g.globalAlpha = 1; }
    if (s.rice > 0.01) { g.globalAlpha = s.rice; paper(g, () => { g.beginPath(); g.arc(1010, R.DESK - 20, 64, 0, Math.PI); g.closePath(); }, '#f6f1e8', 0.2, 5); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(1010, R.DESK - 22, 60, 16, 0, Math.PI, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; for (let i = 0; i < 2; i++) { const ph = (t * 0.3 + i / 2) % 1; g.globalAlpha = s.rice * Math.sin(ph * Math.PI) * 0.7; g.beginPath(); g.moveTo(990 + i * 30, R.DESK - 50 - ph * 50); g.quadraticCurveTo(1000 + i * 30, R.DESK - 70 - ph * 50, 990 + i * 30, R.DESK - 90 - ph * 50); g.stroke(); } g.globalAlpha = 1; }
    // ---- the plant on the sill-side of the desk (always there; grows)
    const px = 1580, py = R.DESK;
    paper(g, () => { g.beginPath(); g.moveTo(px - 70, py - 110); g.lineTo(px + 70, py - 110); g.lineTo(px + 52, py + 6); g.lineTo(px - 52, py + 6); g.closePath(); }, '#d98b66', 0.2, 5);
    g.fillStyle = '#c87a56'; g.fillRect(px - 76, py - 124, 152, 20);
    const leaf = (x0, y0, ang, len, wdt, col) => { g.save(); g.translate(x0, y0); g.rotate(ang); paper(g, () => { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -wdt, len, 0); g.quadraticCurveTo(len * 0.5, wdt, 0, 0); g.closePath(); }, col, 0.14, 3); g.strokeStyle = 'rgba(40,90,50,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(4, 0); g.lineTo(len * 0.85, 0); g.stroke(); g.restore(); };
    const sway = Math.sin(t * 0.9) * 0.04;
    g.strokeStyle = '#5e9b5a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py - 118); g.quadraticCurveTo(px - 10, py - 220, px + 4, py - 270 - s.grow * 80); g.stroke();
    leaf(px - 2, py - 160, -2.6 + sway, 110, 34, '#7cc47f'); leaf(px + 2, py - 190, -0.5 + sway, 120, 36, '#6db872'); leaf(px - 2, py - 235, -2.3 + sway, 96, 30, '#88cf83');
    const g1 = R.k(s.grow, 0.15, 0.55), g2 = R.k(s.grow, 0.55, 0.9), fl = R.k(s.grow, 0.9, 1);
    if (g1 > 0) leaf(px + 3, py - 262 - s.grow * 60, -0.9 + sway, 90 * R.out(g1), 28 * R.out(g1), '#9fdc8e');
    if (g2 > 0) leaf(px + 2, py - 280 - s.grow * 70, -2.2 + sway, 80 * R.out(g2), 26 * R.out(g2), '#b2e69b');
    if (fl > 0) { const fx = px + 4, fy = py - 280 - s.grow * 80; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = fl * 0.7; g.drawImage(R.sp.warm, fx - 70, fy - 70, 140, 140); g.restore(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.1; g.fillStyle = '#ffd36e'; g.beginPath(); g.ellipse(fx + Math.cos(a) * 16 * fl, fy + Math.sin(a) * 16 * fl, 12 * fl, 7 * fl, a, 0, TAU); g.fill(); } g.fillStyle = '#f39a5a'; g.beginPath(); g.arc(fx, fy, 8 * fl, 0, TAU); g.fill(); }
    // ---- paper grain over everything
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.3; g.drawImage(R.grain, 0, 0, 1920, 1080); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
})();
