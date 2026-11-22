// 마지막 한 프레임 — the shots, drawn with the library's scratch-film engine (base.js: scratch, dye, hatch, glow; kit.js: cut-in text).
// Dyes, one per kind of thing for the whole film: YEL stars and the sun · BLUE water · GREEN life · RED heat and extinction · TEAL humans (only).
'use strict';
const TITLE = { f: 'TITLE' }, MONOF = { f: 'MONO' }, SUBF = { f: 'SUBF' };
const RX = 78, RY0 = 150, RY1 = 1440, ry = u => lerp(RY0, RY1, u);   // the ruler stops above the subtitles
const CX = 590;                                         // the picture's centre line (right of the ruler)
const SXC = 420;                                        // the film strip's centre line (labels go to its right)
const LASTD = (Math.floor(CLOCK * 15) - 1) / 15;        // the last drawing before the freeze (the film steps on twos)

// ——— helpers ———
function ring(cx, cy, r, n = 40, sy = 1){ const P = []; for (let i = 0; i <= n; i++){ const a = i / n * Math.PI * 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy]); } return P; }
function rectPts(x0, y0, x1, y1, n = 14){ const P = [], C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]; for (let i = 0; i < 4; i++) for (let k = 0; k < n; k++) P.push([lerp(C[i][0], C[i + 1][0], k / n), lerp(C[i][1], C[i + 1][1], k / n)]); P.push([x0, y0]); return P; }
const gaussR = q => { let s = 0; for (let i = 0; i < 4; i++) s += q(); return (s - 2) / 1.15; };
// fixed star/dust positions (the same every drawing; only the marks boil)
const FIELD = (() => { const q = rng(2026), A = []; for (let i = 0; i < 2600; i++) A.push({ x: 150 + q() * 940, y: q() * H, b: q(), tw: q() * 6.28, born: Math.pow(q(), 2.2) }); return A; })();
function starField(t, n, o = {}){
  const a = o.a ?? 1;
  for (let i = 0; i < n && i < FIELD.length; i++){
    const s = FIELD[i], tw = .7 + .3 * Math.sin(t * 2 + s.tw), sz = (o.size ?? 2.2) * (.5 + s.b * s.b * 2.4);
    G.globalAlpha = a * (.25 + .75 * s.b) * tw; G.fillStyle = s.b > .93 ? YEL : CREAM; G.fillRect(s.x - sz / 2 + (o.dx ?? 0), s.y - sz / 2 + (o.dy ?? 0), sz, sz);
    if (s.b > .985){ G.globalAlpha = a * .6; scratch([[s.x - 7, s.y], [s.x + 7, s.y]], { w: .9, tail: false }); scratch([[s.x, s.y - 7], [s.x, s.y + 7]], { w: .9, tail: false }); }
  }
  G.globalAlpha = 1;
}
function pts(seed, n, cx, cy, sx, sy, o = {}){         // a soft Gaussian cluster of points (dust, a galaxy's core)
  const q = rng(seed);
  for (let i = 0; i < n; i++){
    let x = gaussR(q) * sx, y = gaussR(q) * sy;
    if (o.rot){ const c = Math.cos(o.rot), s = Math.sin(o.rot); [x, y] = [x * c - y * s, x * s + y * c]; }
    const sz = (o.size ?? 1.8) * (.4 + q() * q() * 2.2);
    G.globalAlpha = (o.a ?? .8) * (.3 + q() * .7); G.fillStyle = q() < (o.yel ?? 0) ? YEL : (o.col || CREAM); G.fillRect(cx + x - sz / 2, cy + y - sz / 2, sz, sz);
  }
  G.globalAlpha = 1;
}
function spiral(seed, cx, cy, R, n, o = {}){            // a spiral galaxy made of points: two arms + a core
  const q = rng(seed), rot = o.rot ?? 0, tilt = o.tilt ?? .45, spin = o.spin ?? 0;
  for (let i = 0; i < n; i++){
    const arm = i % 2, u = .08 + .92 * q(), ang = arm * Math.PI + u * 5.4 + spin + gaussR(q) * .16;
    const r = u * R + gaussR(q) * R * .035;
    let x = Math.cos(ang) * r, y = Math.sin(ang) * r * tilt; const c = Math.cos(rot), s = Math.sin(rot); [x, y] = [x * c - y * s, x * s + y * c];
    const sz = (o.size ?? 1.6) * (.4 + q() * q() * 2); G.globalAlpha = (o.a ?? .85) * (.35 + q() * .65) * (1 - u * .5);
    G.fillStyle = q() < .08 ? YEL : CREAM; G.fillRect(cx + x - sz / 2, cy + y - sz / 2, sz, sz);
  }
  G.globalAlpha = 1; pts(seed + 1, Math.floor(n * .25), cx, cy, R * .12, R * .12 * tilt, { a: o.a ?? .85, yel: .25, size: o.size ?? 1.6, rot });
  glow(cx, cy, R * .35, 'rgba(255,244,220,1)', .22 * (o.a ?? 1));
}

// the time ruler (the cosmic part only): needle line, ticks every 10 s, marks as the clock passes them, the cursor and readout
function timeRuler(t, dn, a = 1){
  if (a <= 0) return;
  G.save(); G.globalAlpha = a;
  rs(dn * 7 + 3);
  scratch([[RX, RY0 - 20], [RX + 1, (RY0 + RY1) / 2], [RX, RY1 + 20]], { w: 2.6, tail: false, a });
  for (let k = 0; k <= 12; k++){ const y = ry(k / 12), L = k % 3 === 0 ? 30 : 16; scratch([[RX - 4, y], [RX + L, y + 1]], { w: k % 3 === 0 ? 2.2 : 1.4, tail: false, a }); }
  const u = Math.min(1, t / CLOCK), y = ry(u);
  for (const [mt, lab] of MARKS){ if (t < mt) continue; const my = ry(mt / CLOCK); dye([[RX - 10, my], [RX + 26, my]], { col: mt >= T.dinoIn ? GREEN : mt >= T.life ? GREEN : YEL, w: 7, a: .7 * a, n: 3 }); if (Math.abs(my - y) > 70) cutText(txtImg(lab, MONOF, 22, '#e6d8b8'), RX + 30, my - 15, 1, dn, { tip: false, a: .7 * a }); }
  if (RY1 - y > 80) cutText(txtImg('2:00', MONOF, 28), RX + 20, RY1 + 6, 1, dn, { tip: false, a: .7 * a });
  scratch([[RX + 50, y - 16], [RX + 18, y], [RX + 50, y + 16]], { w: 3.4, tail: false, a });
  glow(RX, y, 34, 'rgba(255,244,220,1)', .5 * a);
  const tq = Math.floor(t * 2) / 2;                     // the readout steps every half second (text is never re-lettered per drawing)
  cutText(txtImg(clockStr(tq), MONOF, 34), RX + 60, y - 30, 1, dn, { tip: false, a });
  cutText(txtImg(yearsAgo(tq), MONOF, 26, '#e6d8b8'), RX + 62, y + 14, 1, dn, { tip: false, a: .9 * a });
  G.restore();
}
function bigText(str, font, px, x, y, p, dn, o = {}){ const img = txtImg(str, font, px, o.col || CREAM, { hatch: !!o.hatch }); const sc = Math.min(1, (o.maxW ?? 880) / img.width); return cutText(img, x, y, p, dn, { sc, tipR: o.tipR ?? 40, a: o.a, tip: o.tip }); }
function label(str, x, y, dn, o = {}){ return cutText(txtImg(str, o.font || MONOF, o.px ?? 28, o.col || '#e6d8b8'), x, y, o.p ?? 1, dn, { tip: false, a: o.a ?? 1 }); }

// ——— S1: the Big Bang and the promise (0 – 8.9) ———
function sBang(t, lt, dn){
  rs(dn * 11 + 1);
  const bx = CX, by = 1120;
  if (t < 1.25){                                        // the flash: hatched light filling the frame, then gone
    const p = t / 1.25, r = 40 + 1700 * eo(p), a = 1 - ss(p);
    for (let k = 0; k < 3; k++) hatch(ring(bx, by, r * (1 - k * .3), 36), CREAM, { gap: 10 + k * 6, a: .55 * a, ang: .5 + k * 1.1, lw: [1, 3], passes: 1 });
    glow(bx, by, r * .45, 'rgba(255,250,235,1)', .4 * a); disc(bx, by, 10 * (1 - p), '#ffffff', a);
  }
  const nStars = t < T.firstStars ? 0 : Math.floor(Math.min(900, 6 * Math.pow((t - T.firstStars) * 4, 1.5)));
  starField(t, nStars);
  const L = [['이 영상에서', .4, 1.3], ['인간은', 1.3, 2.0], ['마지막 0.003초에만', 2.0, 3.6], ['나옵니다.', 3.6, 4.6]];
  const fade = 1 - ss(seg(t, 8.4, 8.9));
  L.forEach(([s, a, b], i) => {
    const p = eo(seg(t, a, b)), y = 300 + i * 150;
    if (i === 1 && p > .9){ rs(dn * 3 + 9); dye([[190, y + 132], [440, y + 136]], { col: TEAL, w: 26, a: .85 * fade }); }
    bigText(s, TITLE, 112, 180, y, p, dn, { hatch: true, a: fade, tipR: 46 });
  });
}
// ——— S2: the premise — the whole video is the universe's age (8.9 – 27.5) ———
function sPremise(t, lt, dn){
  rs(dn * 13 + 2);
  starField(t, 900 + Math.floor((t - 8.9) * 60));
  if (t >= 9.4 && t < 20.0){
    const a = 1 - ss(seg(t, 19.2, 20.0));
    bigText('이 영상의 2분', TITLE, 96, 180, 520, eo(seg(t, 9.6, 10.8)), dn, { hatch: true, a });
    bigText('= 우주의 138억 년', TITLE, 96, 180, 650, eo(seg(t, 11.0, 12.8)), dn, { hatch: true, a });
    bigText('1초 ≈ 1억 1500만 년', MONOF, 70, 180, 860, eo(seg(t, 15.8, 17.6)), dn, { a, col: '#fff4dc' });
  }
  if (t >= 20.2){                                       // n5: point at the ruler's top — the Big Bang and the first stars both at the very start
    const a = ss(seg(t, 20.2, 21)) * (1 - ss(seg(t, 26.6, 27.4)));
    const y0 = ry(0), y1 = ry(T.firstStars / CLOCK);
    rs(dn * 5 + 4); dye([[RX + 30, y0 - 18], [RX + 30, y1 + 30]], { col: YEL, w: 18, a: .7 * a, n: 5 });
    scratch([[RX + 240, y1 + 260], [RX + 140, y1 + 130], [RX + 60, y1 + 30]], { w: 3, a });
    label('빅뱅도, 첫 별도', RX + 180, y1 + 280, dn, { px: 40, font: SUBF, a, col: CREAM });
    label('맨 처음 2초 안', RX + 180, y1 + 336, dn, { px: 40, font: SUBF, a, col: CREAM });
  }
}
// ——— S3: stars gather into galaxies; pull back to many (27.5 – 35.5) ———
function sGalaxies(t, lt, dn){
  rs(dn * 17 + 3);
  const u = seg(t, 27.5, 35.5), gather = ss(seg(t, 27.6, 30.0));
  // the field's points fly into one spiral, then the camera pulls back: it becomes one among many
  const zoom = elog(1, .18, ss(seg(t, 30.0, 35.0)));
  starField(t, Math.floor(1400 * (1 - gather)), { a: 1 - gather * .8 });
  const R = 360 * zoom, spin = t * .12;
  spiral(7, CX, 960, R, Math.floor(2600 * (.2 + .8 * gather)), { rot: -.4, tilt: .5, spin, a: .3 + .7 * gather, size: 1.4 + 1.2 * zoom });
  if (zoom < .9){
    const q = rng(55), n = Math.floor(70 * (1 - zoom));
    for (let i = 0; i < n; i++){ const x = 160 + q() * 900, y = q() * H, s = (20 + q() * 70) * (1.2 - zoom), al = (1 - zoom) * (.4 + q() * .5);
      if (Math.hypot(x - CX, y - 960) < R * 1.3) continue;
      spiral(100 + i, x, y, s, 60 + Math.floor(q() * 140), { rot: q() * 3, tilt: .25 + q() * .6, spin: spin * .5, a: al, size: 1.2 }); }
  }
}
// ——— S4: stars live and die and leave dust (35.5 – 66) ———
function sDust(t, lt, dn){
  rs(dn * 19 + 4);
  starField(t, 1200, { a: .7 });
  // the hero star: swells yellow → red, bursts at 40.0 into dust; the dust makes new small stars
  const sx = CX + 40, sy = 860;
  if (t < 40.0){
    const sw = ss(seg(t, 36, 39.8)), r = 70 + 120 * sw;
    const col = sw < .5 ? YEL : RED;
    for (let k = 0; k < 3; k++) hatch(ring(sx, sy, r * (1 - k * .28), 36), k === 0 ? col : (k === 1 ? YEL : CREAM), { gap: 7 - k, a: .5 + k * .12, ang: .6 + k, lw: [1.2, 3.2] });
    scratch(ring(sx, sy, r, 48), { w: 3.2, tail: false });
    glow(sx, sy, r * 2.4, sw < .5 ? 'rgba(255,200,28,1)' : 'rgba(255,50,32,1)', .25);
  } else {
    const p = seg(t, 40.0, 47.0), q = rng(77);
    for (let i = 0; i < 1600; i++){ const a = q() * 6.28, d = (40 + q() * 520) * eo(p) * (.5 + q() * .7), x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d * .8;
      G.globalAlpha = (.3 + q() * .6) * (1 - p * .3); G.fillStyle = q() < .2 ? RED : CREAM; const s = 1 + q() * 2.4; G.fillRect(x, y, s, s); }
    G.globalAlpha = 1;
    if (t < 40.6){ const f = 1 - seg(t, 40.0, 40.6); for (let k = 0; k < 18; k++){ const a = k / 18 * 6.28; dye([[sx + Math.cos(a) * 40, sy + Math.sin(a) * 30], [sx + Math.cos(a) * 420, sy + Math.sin(a) * 340]], { col: RED, w: 16, a: .7 * f, n: 4 }); } }
    // new stars light up in the dust, one by one
    const born = Math.floor(seg(t, 43, 47.5) * 9);
    for (let i = 0; i < born; i++){ const a = i * 2.3 + 1, d = 160 + (i % 3) * 120, x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d * .8; glow(x, y, 34, 'rgba(255,200,28,1)', .6); disc(x, y, 4, CREAM, 1); }
  }
  // the cycle repeating faster everywhere (48 – 66): small bursts at fixed places
  if (t > 48){ const q = rng(91); for (let i = 0; i < 14; i++){ const t0 = 48 + i * 1.3 + q() * .6, x = 180 + q() * 860, y = 160 + q() * 1500; const p = seg(t, t0, t0 + 1.2); if (p <= 0 || p >= 1) continue; const r = 14 + 90 * eo(p); scratch(ring(x, y, r, 24), { w: 1.6, a: 1 - p, col: p < .3 ? YEL : RED, tail: false }); } }
  // halfway: a cut across the frame at the ruler's middle, left to right
  if (t > 59.4){ const p = eo(seg(t, 59.4, 60.4)), y = ry(.5); rs(dn * 2 + 5); const P = []; for (let x = RX + 300; x <= RX + 300 + (W - RX - 300) * p; x += 30) P.push([x, y + 1.5 * Math.sin(x * .02 + dn)]); if (P.length > 1) scratch(P, { w: 3, tail: false }); if (p < 1) tipSpark(...P[P.length - 1], dn, 40);
    if (t > 60.4) label('절반 · 69억 년 전', 700, y - 60, dn, { px: 32, a: 1 - seg(t, 64, 66) }); }
}
// ——— S5: an old stars' dust cloud collapses into a disk (66 – 80) ———
function sCollapse(t, lt, dn){
  rs(dn * 23 + 5);
  starField(t, 1000, { a: .55 });
  const p = ss(seg(t, 67, 79)), cx = CX, cy = 1000, q = rng(311);
  for (let i = 0; i < 4200; i++){
    const a0 = q() * 6.28, r0 = 80 + q() * 620, ang = a0 + p * (2.2 + 3 * (1 - r0 / 700)), r = lerp(r0, 60 + r0 * .55, p);
    const flat = lerp(.9, .22, p), x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * flat;
    G.globalAlpha = .25 + q() * .55; G.fillStyle = q() < .06 ? YEL : CREAM; const s = 1 + q() * 2; G.fillRect(x, y, s, s);
  }
  G.globalAlpha = 1;
  glow(cx, cy, 120 + 160 * p, 'rgba(255,200,28,1)', .15 + .5 * p);
  if (p > .4){ rs(dn * 2 + 7); for (let k = 0; k < 3; k++) scratch(ring(cx, cy, 160 + k * 110, 50, .22 + (1 - p) * .3), { w: 1.2, a: .4 * p, tail: false }); }
}
// ——— S6: the Sun ignites (80.0) and the Earth forms (80.5) ———
function sSun(t, lt, dn){
  rs(dn * 13 + 4);
  starField(t, 700, { a: .5 });
  const on = ss(seg(t, T.sun, T.sun + .5)), sx = 860, sy = 380, sr = 300;
  // the sun: sparse stacked yellow hatching (lighter in the middle, never a flat fill), a cut rim, dye rays
  hatch(ring(sx, sy, sr, 48), YEL, { gap: 13, a: .42 * on, ang: .5, lw: [1.2, 3.2] });
  hatch(ring(sx, sy, sr, 48).concat(ring(sx, sy, sr * .62, 40).reverse()), YEL, { gap: 12, a: .32 * on, ang: 1.6, lw: [1.2, 3] });   // the limb darker than the middle
  hatch(ring(sx - 30, sy - 20, sr * .45, 30), CREAM, { gap: 16, a: .3 * on, ang: -.3, lw: [1, 2.2], passes: 1 });
  scratch(ring(sx, sy, sr, 64), { w: 4, tail: false, a: on });
  for (let k = 0; k < 14; k++){ const a = Math.PI * .5 + k * .19, r0 = sr + 20, r1 = sr + 120 + (k % 3) * 60; dye([[sx + Math.cos(a) * r0, sy + Math.sin(a) * r0], [sx + Math.cos(a) * r1, sy + Math.sin(a) * r1]], { col: YEL, w: 14, a: .55 * on, n: 5 }); }
  if (t < T.sun + .4) { glow(sx, sy, 600, 'rgba(255,240,200,1)', .6 * (1 - seg(t, T.sun, T.sun + .4))); }
  const cx = CX - 40, cy = 1060;
  pts(41, 4200, cx, cy, 420, 100, { rot: -.22, size: 1.7, a: .6, yel: .05 });
  const e = ss(seg(t, T.earth, T.earth + .6)), ex = 720, ey = 1010, er = 92 * e;
  if (e > 0){ hatch(ring(ex, ey, er, 32), RED, { gap: 6, a: .85, ang: .7, lw: [1.4, 3.4] }); hatch(ring(ex - 20, ey - 22, er * .55, 24), YEL, { gap: 6, a: .5, ang: -.5 }); scratch(ring(ex, ey, er, 40), { w: 3.2, tail: false }); glow(ex, ey, 220, 'rgba(255,50,32,1)', .18 * e); }
  if (t > T.earth + .3) label('지구', ex + 110, ey - 20, dn, { px: 34, col: CREAM });
  label('46억 년 전 · 태양과 지구', 190, 1360, dn, { px: 32, a: ss(seg(t, T.sun + .2, T.sun + .7)) });
}
// ——— S7: the Earth cools, oceans, first life (89.6), oxygen (99.1) ———
function sEarth(t, lt, dn){
  rs(dn * 29 + 6);
  starField(t, 500, { a: .4 });
  const cx = 600, cy = 900, R = 340;
  const cool = ss(seg(t, 84.4, 88.0)), sea = ss(seg(t, 85.5, 88.5));
  hatch(ring(cx, cy, R, 60), RED, { gap: 7, a: .8 * (1 - cool), ang: .7, lw: [1.4, 3.6] });
  hatch(ring(cx, cy, R, 60), BLUE, { gap: 7, a: .75 * sea, ang: -.6, lw: [1.4, 3.6] });
  hatch(ring(cx - 70, cy - 80, R * .5, 36), CREAM, { gap: 13, a: .18 + .1 * sea, ang: .3 });   // light on the near side
  // land: a few dark scratched patches; cooling cracks
  for (let k = 0; k < 4; k++){ const a = k * 1.6 + .5, r = R * (.3 + (k % 2) * .32), ox = cx + Math.cos(a) * r, oy = cy + Math.sin(a) * r * .9, q = rng(70 + k);
    const P = []; for (let j = 0; j <= 18; j++){ const b = j / 18 * 6.283, rr2 = (44 + k * 12) * (.6 + .5 * q()) * (j === 18 ? 1 : 1); P.push([ox + Math.cos(b) * rr2 * 1.3, oy + Math.sin(b) * rr2 * .8]); } P[18] = P[0];
    fillPoly(P, '#120c08', .5 * cool); scratch(P, { w: 1.6, a: .7 * cool, tail: false }); }   // land: ragged patches
  if (cool < 1) for (let k = 0; k < 9; k++){ const a = k * .7; scratch([[cx + Math.cos(a) * 40, cy + Math.sin(a) * 40], [cx + Math.cos(a + .3) * 200, cy + Math.sin(a + .3) * 200], [cx + Math.cos(a + .1) * 320, cy + Math.sin(a + .1) * 320]], { w: 1.6, a: .8 * (1 - cool), tail: false }); }
  scratch(ring(cx, cy, R, 72), { w: 4, tail: false });
  // first life: green specks gathering at the shores, one by one, from 89.6
  if (t >= T.life){ const n = Math.floor(Math.min(70, (t - T.life) * 14)), q = rng(808);
    for (let i = 0; i < n; i++){ const a = q() * 6.28, r = R * (.25 + q() * .65), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .9; glow(x, y, 26, 'rgba(70,214,90,1)', .55); disc(x, y, 3.6, GREEN, 1); }
    label('첫 생명의 흔적 · 35억 년 전', 190, 1340, dn, { px: 32, col: '#c8f5c0', a: ss(seg(t, T.life, T.life + .5)) * (1 - seg(t, 98, 99)) }); }
  // oxygen: a pale hatched sky ring and rising bubbles, from 99.1
  if (t >= T.oxygen){ const o = ss(seg(t, T.oxygen, T.oxygen + 1.5));
    hatch(ring(cx, cy, R + 50, 72).concat(ring(cx, cy, R + 6, 72).reverse()), CREAM, { gap: 16, a: .22 * o, ang: 1.1, lw: [.8, 1.8], passes: 1 });
    const q = rng(909); for (let i = 0; i < 40; i++){ const a = q() * 6.28, r0 = R * q(), sp = (t - T.oxygen) * (40 + q() * 60); const x = cx + Math.cos(a) * r0, y = cy + Math.sin(a) * r0 * .9 - sp; if (Math.hypot(x - cx, y - cy) > R + 50) continue; scratch(ring(x, y, 4 + q() * 6, 10), { w: 1.2, a: .8 * o, tail: false }); }
    label('산소 · 24억 년 전', 190, 1340, dn, { px: 32, a: o }); }
}
// ——— S8: the accelerating parade (103 – 120): cells, the Cambrian (115.3), dinosaurs (118.0), extinction (119.43) ———
function creature(kind, x, y, s, a = 1){
  const L = (P, w = 2.4, c = CREAM) => scratch(P.map(p => [x + p[0] * s, y + p[1] * s]), { w: w * Math.max(.6, s), a, col: c, tail: false });
  if (kind === 'cell'){ scratch(ring(x, y, 10 * s, 14), { w: 1.6, a, tail: false }); disc(x, y, 3 * s, GREEN, a); }
  if (kind === 'trilo'){ const P = ring(0, 0, 1, 20, .6).map(p => [p[0] * 34, p[1] * 34]); L(P, 2.2); for (let k = -2; k <= 2; k++) L([[k * 9, -16], [k * 9, 16]], 1.4); dye([[x - 30 * s, y], [x + 30 * s, y]], { col: GREEN, w: 22 * s, a: .5 * a, n: 4 }); }
  if (kind === 'jelly'){ L([[-24, 0], [-20, -18], [0, -26], [20, -18], [24, 0]], 2.2); for (let k = -2; k <= 2; k++) L([[k * 9, 0], [k * 9 + 4, 22], [k * 9 - 2, 40]], 1.2); dye([[x - 20 * s, y - 10 * s], [x + 20 * s, y - 10 * s]], { col: GREEN, w: 18 * s, a: .45 * a, n: 4 }); }
  if (kind === 'fish'){ L([[-40, 0], [-10, -14], [24, -6], [40, 0], [24, 6], [-10, 14], [-40, 0]], 2.2); L([[-40, 0], [-56, -14], [-56, 14], [-40, 0]], 1.6); dye([[x - 30 * s, y], [x + 30 * s, y]], { col: GREEN, w: 16 * s, a: .45 * a, n: 4 }); }
  if (kind === 'sauro'){ L([[-90, 0], [-60, -36], [0, -44], [50, -36], [80, -70], [96, -130], [112, -136]], 3); L([[-90, 0], [-150, 14]], 2.6); for (const lx of [-50, -20, 20, 44]) L([[lx, -30], [lx + 2, 26]], 3.4); dye([[x - 60 * s, y - 30 * s], [x + 50 * s, y - 34 * s]], { col: GREEN, w: 40 * s, a: .5 * a, n: 6 }); }
  if (kind === 'theropod'){ L([[-60, -20], [-20, -40], [20, -46], [44, -60], [60, -56], [56, -48], [30, -40]], 2.6); L([[-60, -20], [-100, -6]], 2.2); L([[0, -36], [-6, 0], [4, 26]], 3); L([[16, -38], [24, -4], [34, 26]], 3); dye([[x - 40 * s, y - 34 * s], [x + 40 * s, y - 44 * s]], { col: GREEN, w: 26 * s, a: .5 * a, n: 5 }); }
  if (kind === 'mammal'){ L([[-16, 0], [-6, -10], [10, -10], [18, -4], [16, 2]], 2); L([[-10, 0], [-10, 8]], 1.6); L([[10, 0], [10, 8]], 1.6); }
  if (kind === 'hominin'){ L([[0, -30], [1, -64]], 2.6); disc(x + 1 * s, y - 72 * s, 6 * s, CREAM, a); L([[-8, 0], [0, -30], [8, 0]], 2); L([[-10, -46], [0, -58], [10, -42]], 1.8); }
}
function sParade(t, lt, dn){
  rs(dn * 31 + 7);
  const gy = 1300;                                     // the ground / sea line
  const P = []; for (let x = 330; x <= W + 20; x += 30) P.push([x, gy + 2 * Math.sin(x * .02 + dn)]); scratch(P, { w: 3, tail: false });
  if (t < T.cambrian - .2){                            // tiny cells drifting and clumping
    const q = rng(1234), n = 40 + Math.floor((t - 103) * 6);
    for (let i = 0; i < n; i++){ const x = 180 + ((q() * 900 + (t - 103) * (20 + q() * 40)) % 880), y = 400 + q() * 820; creature('cell', x, y, .8 + q() * .6, .7); }
  }
  if (t >= T.cambrian - .1 && t < T.dinoIn){           // the Cambrian: animals pouring out
    const q = rng(2222), u = t - T.cambrian, kinds = ['trilo', 'jelly', 'fish'];
    for (let i = 0; i < 26; i++){ const t0 = q() * 1.2; if (u < t0) { q(); q(); continue; } const k = kinds[i % 3], y = 380 + q() * 860, x = 1180 - ((u - t0) * (260 + q() * 300) + q() * 760) % 1000; creature(k, x, y, .9 + q() * .5); }
    if (t > T.cambrian) label('5억 3900만 년 전 · 동물', 190, 300, dn, { px: 32, col: '#c8f5c0' });
  }
  if (t >= T.dinoIn && t < T.dinoOut){                 // dinosaurs walking along the ground
    const u = t - T.dinoIn; creature('sauro', 940 - u * 120, gy, 1.5); creature('theropod', 560 - u * 90, gy, 1.3); creature('sauro', 300 - u * 60, gy, .9, .7);
    label('2억 3천만 년 전 · 공룡', 190, 300, dn, { px: 32, col: '#c8f5c0' });
  }
  if (t >= T.dinoOut - .25 && t < T.dinoOut){ const p = seg(t, T.dinoOut - .25, T.dinoOut); dye([[1100, -40], [lerp(1100, 640, p), lerp(-40, gy, p)]], { col: RED, w: 20, a: .9, n: 5 }); }
  if (t >= T.dinoOut && t < T.dinoOut + .2){ hatch([[0, 0], [W, 0], [W, H], [0, H]], RED, { gap: 8, a: .7 * (1 - seg(t, T.dinoOut, T.dinoOut + .2)), ang: .8 }); glow(640, gy, 900, 'rgba(255,50,32,1)', .7); }
  if (t >= T.dinoOut){                                  // after: small mammals, and in the last 1/24 s, upright figures
    label('6600만 년 전 · 공룡 멸종', 190, 300, dn, { px: 32, col: '#ffb4a8' });
    const q = rng(3131); for (let i = 0; i < 6; i++) creature('mammal', 220 + q() * 820, gy - 6, 1 + q() * .5, .8);
    if (t >= LASTD - 1e-6) for (let j = 0; j < 3; j++){ const hx = 520 + j * 120; dye([[hx, gy - 4], [hx + 2, gy - 112]], { col: TEAL, w: 26, a: .7, n: 5 }); creature('hominin', hx, gy, 1.6, .9); }   // upright figures: only in the last drawing
  }
}
// ——— S9: the freeze (120 →): the film stops; the screen becomes the last frame in its strip; its last 1/16 is teal ———
const FW = 400, FH = FW * 16 / 9, FY = 560;             // the last frame's place in the strip
function stripFrames(dn, a = 1, y3 = FY, sc = 1){
  const fx = SXC - FW * sc / 2, fw = FW * sc, fh = FH * sc, gap = 26 * sc;
  const top = y3 - 3 * (fh + gap), bot = y3 + fh + 60 * sc;
  for (const x of [fx - 54 * sc, fx + fw + 54 * sc]) scratch([[x, Math.max(-40, top)], [x, bot]], { w: 2.4, tail: false, a });
  for (let y = top + 10; y < bot - 20; y += 46 * sc){ if (y < -60 || y > H + 60) continue; for (const x of [fx - 34 * sc, fx + fw + 22 * sc]) scratch(rectPts(x, y, x + 14 * sc, y + 22 * sc, 4), { w: 1.6, tail: false, a: .8 * a }); }
  for (let k = 1; k <= 3; k++){ const y0 = y3 - k * (fh + gap); if (y0 + fh < -40) continue; scratch(rectPts(fx, y0, fx + fw, y0 + fh), { w: 2.4, tail: false, a: .7 * a });
    rs(k * 31); scratch([[fx + 10 * sc, y0 + fh * .7], [fx + fw * .5, y0 + fh * .68], [fx + fw - 10 * sc, y0 + fh * .71]], { w: 1.8, a: .5 * a, tail: false });
    for (let j = 0; j < 4; j++) creature('mammal', fx + (70 + j * 80 + k * 14) * sc, y0 + fh * .7 - 4 * sc, .9 * sc, .55 * a); }
  return { fx, fw, fh };
}
function sFreeze(t, lt, dn){
  // 120 – 121.6: the projector has stopped: the last picture held still (drawing dn frozen at the freeze)
  const k = ss(seg(t, T.pullStrip, T.pullStrip + 2.2));             // the screen shrinks into the strip
  const fdn = Math.floor(T.freeze * 15) - 1;
  const sc = lerp(W / FW, 1, k), y3 = lerp(0, FY, k), x3 = lerp(0, SXC - FW / 2, k);
  // the frozen picture — exactly the last drawing, ruler and all — scaled into the frame
  G.save(); G.translate(x3, y3); G.scale(FW * sc / W, FW * sc / W); G.beginPath(); G.rect(0, 0, W, H); G.clip();
  sParade(LASTD, 0, fdn); timeRuler(LASTD, fdn, 1); G.restore();
  if (k > 0){ rs(dn * 3 + 1); const { fx, fw, fh } = stripFrames(dn, k, y3, sc); scratch(rectPts(fx, y3, fx + fw, y3 + fh), { w: 4.2, tail: false, a: k }); }
  if (t >= 124.4){ const a = ss(seg(t, 124.4, 125)), fx = SXC - FW / 2;
    label('정지 · 2:00', fx + FW + 70, FY - 150, dn, { px: 32, col: CREAM, a });
    scratch([[fx + FW + 66, FY + 40], [fx + FW + 110, FY + 40]], { w: 2, tail: false, a });
    label('마지막 한 칸', fx + FW + 118, FY + 16, dn, { px: 32, col: CREAM, a });
    label('24분의 1초', fx + FW + 118, FY + 58, dn, { px: 28, a: ss(seg(t, 126.4, 127)) });
    label('≈ 480만 년', fx + FW + 118, FY + 96, dn, { px: 28, a: ss(seg(t, 128, 128.6)) }); }
  if (t >= T.band){ const b = ss(seg(t, T.band, T.band + .8)), fx = SXC - FW / 2, bh = FH / 16, by = FY + FH - bh;
    hatch([[fx + 4, by], [fx + FW - 4, by], [fx + FW - 4, by + bh - 4], [fx + 4, by + bh - 4]], TEAL, { gap: 4.5, a: .95 * b, ang: .9, lw: [1.4, 3], passes: 2 });
    hatch([[fx + 4, by], [fx + FW - 4, by], [fx + FW - 4, by + bh - 4], [fx + 4, by + bh - 4]], CREAM, { gap: 11, a: .4 * b, ang: -.4, lw: [1, 2] });
    glow(fx + FW / 2, by + bh / 2, 220, 'rgba(31,179,154,1)', .35 * b); scratch([[fx - 4, by], [fx + FW + 4, by]], { w: 2.4, tail: false, a: b });
    scratch([[fx + FW + 8, by + bh / 2], [fx + FW + 110, by + bh / 2 - 40]], { w: 2, tail: false, a: b });
    label('인류 30만 년', fx + FW + 118, by - 70, dn, { px: 32, col: '#9ff0de', a: b });
    label('= 이 칸의 16분의 1', fx + FW + 118, by - 30, dn, { px: 26, col: '#9ff0de', a: ss(seg(t, 133, 133.6)) }); }
}
// ——— S10: inside the last 1/16 — the whole of human history (136.6 – 149) ———
function icon(kind, x, y, a = 1){
  G.save(); G.globalAlpha = a;
  if (kind === 'fig'){ scratch([[x, y - 58], [x + 2, y + 30]], { w: 4, a }); disc(x, y - 72, 14, CREAM, .9 * a); scratch([[x - 34, y - 20], [x, y - 40], [x + 36, y - 16]], { w: 3, a }); scratch([[x - 22, y + 82], [x + 1, y + 30], [x + 24, y + 82]], { w: 3.4, a }); }
  if (kind === 'hand'){   // a stencilled hand: red pigment blown round an uncut palm and five fingers
    dye([[x - 60, y + 40], [x + 60, y - 50]], { col: TEAL, w: 130, a: .5 * a, n: 10 });   // the pigment blown round it (teal: humans' dye)
    const palm = [[x - 30, y + 60], [x - 34, y + 10], [x - 20, y - 6], [x + 22, y - 6], [x + 34, y + 10], [x + 30, y + 60]];
    fillPoly(palm, '#0a0705', .9 * a); scratch(palm.concat([palm[0]]), { w: 2.2, a, tail: false });
    for (const [dx, len, ang] of [[-26, 44, -.35], [-12, 58, -.12], [3, 62, 0], [18, 54, .12], [36, 36, .7]]){ const bx = x + dx, by = y - 4; const ex = bx + Math.sin(ang) * len, ey = by - Math.cos(ang) * len;
      scratch([[bx, by], [ex, ey]], { w: 14, a, col: '#0a0705', tail: false }); scratch([[bx - 7, by], [ex - 7, ey]], { w: 1.6, a, tail: false }); scratch([[bx + 7, by], [ex + 7, ey]], { w: 1.6, a, tail: false }); }
  }
  if (kind === 'seed'){ scratch([[x, y + 70], [x, y - 40]], { w: 3, a }); for (let k = 0; k < 4; k++){ const yy = y - 30 + k * 24; dye([[x, yy], [x - 38, yy - 22]], { col: GREEN, w: 14, a: .8 * a, n: 4 }); dye([[x, yy], [x + 38, yy - 22]], { col: GREEN, w: 14, a: .8 * a, n: 4 }); } }
  if (kind === 'pyr'){ const P = [[x - 80, y + 60], [x, y - 70], [x + 80, y + 60]]; hatch(P, CREAM, { gap: 9, a: .45 * a, ang: .6 }); scratch(P.concat([P[0]]), { w: 3.2, tail: false, a }); }
  if (kind === 'moon'){ hatch(ring(x, y, 70, 32), CREAM, { gap: 8, a: .45 * a }); scratch(ring(x, y, 70, 40), { w: 3, tail: false, a }); const fp = [[x - 16, y - 20], [x + 4, y - 26], [x + 14, y + 10], [x - 6, y + 22], [x - 20, y + 4]]; fillPoly(fp, INK, .85 * a); }
  if (kind === 'phone'){ scratch(rectPts(x - 44, y - 78, x + 44, y + 78, 6), { w: 3.4, tail: false, a }); hatch([[x - 36, y + 54], [x + 36, y + 54], [x + 36, y + 66], [x - 36, y + 66]], TEAL, { gap: 3, a: .95 * a }); scratch([[x - 30, y - 66], [x - 30, y + 46]], { w: 1.6, a: .8 * a, tail: false });
    scratch([[x + 30, y + 120], [x + 10, y + 82], [x + 50, y + 80]], { w: 3, a, tail: false }); }   // the thumb holding it
  G.restore();
}
function sInside(t, lt, dn){
  rs(dn * 19 + 6);
  const z = ss(seg(t, T.push, T.push + 1.4));           // the teal band grows to fill the frame
  const fx = SXC - FW / 2, bh = FH / 16, by = FY + FH - bh;
  const x0 = lerp(fx, 0, z), x1 = lerp(fx + FW, W, z), y0 = lerp(by, 0, z), y1 = lerp(by + bh, H, z);
  if (z < 1){ rs(dn * 3 + 1); stripFrames(dn, Math.pow(1 - z, 2), FY, 1); scratch(rectPts(fx, FY, fx + FW, FY + FH), { w: 4.2, tail: false, a: Math.pow(1 - z, 2) }); }
  for (let k = 0; k < 2; k++) hatch([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], TEAL, { gap: 40 - k * 12, a: .12 + k * .06, ang: .9 + k * .6, lw: [1, 2] });
  scratch(rectPts(x0, y0, x1, y1), { w: 2.4, tail: false, a: 1 - z * .7 });
  if (z < .99) return;
  HIST.forEach(([t0, when, what, ic], i) => {
    if (t < t0) return;
    const a = ss(seg(t, t0, t0 + .35)), y = 200 + i * 230, x = 260;
    rs(dn * 7 + i * 13); icon(ic, x, y + 60, a);
    label(when, 430, y + 10, dn, { px: 34, col: '#9ff0de', a });
    cutText(txtImg(what, SUBF, 46), 430, y + 58, eo(seg(t, t0, t0 + .5)), dn, { tipR: 30 });
    if (i < 5 && t > (HIST[i + 1] ? HIST[i + 1][0] : 1e9)) scratch([[x, y + 150], [x + 1, y + 210]], { w: 1.4, a: .6, tail: false });
  });
}
// ——— S11: pull back to all 2,880 frames as points; everything goes dark but the last 1/16 (149 – end) ———
function sPull(t, lt, dn){
  rs(dn * 37 + 9);
  const cols = 40, rows = 72, gx = 16, gy = 16, ox = CX - (cols - 1) * gx / 2, oy = 240;
  const k = ss(seg(t, T.pull, T.pull + 3));              // zoom out from the last point
  const lx = ox + (cols - 1) * gx, ly = oy + (rows - 1) * gy, zs = elog(60, 1, k);
  const dark = ss(seg(t, 153.5, 159));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
    const x = lx + (ox + c * gx - lx) * zs, y = ly + (oy + r * gy - ly) * zs; if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
    const last = r === rows - 1 && c === cols - 1; if (last) continue;
    const s = 3.2 * Math.min(zs, 6); G.globalAlpha = (.55 + .35 * h1(r * 41 + c)) * (1 - dark * .97); G.fillStyle = CREAM; G.fillRect(x - s / 2, y - s / 2, s, s);
  }
  G.globalAlpha = 1;
  // the last frame: its own point, the bottom 1/16 teal
  const s = 4.2 * Math.min(zs, 60) * 1.6, bh = Math.max(2, s / 16 * 2.2);
  scratch(rectPts(lx - s / 2, ly - s * .9, lx + s / 2, ly + s * .9, 4), { w: Math.max(1.2, s * .05), tail: false, a: 1 - dark * .6 });
  hatch([[lx - s / 2, ly + s * .9 - bh], [lx + s / 2, ly + s * .9 - bh], [lx + s / 2, ly + s * .9], [lx - s / 2, ly + s * .9]], TEAL, { gap: 2, a: 1, ang: .9, lw: [1, 2] });
  glow(lx, ly + s * .9, 90 + 120 * dark, 'rgba(31,179,154,1)', .45 + .3 * dark);
  if (k > .9){ const a = 1 - dark; label('이 영상의 2,880칸', ox, oy - 90, dn, { px: 34, col: CREAM, a });
    label('인류 = 마지막 칸의 16분의 1', lx - 520, ly + 60, dn, { px: 30, col: '#9ff0de', a: ss(seg(t, 152, 153)) * (1 - dark * .5) }); }
  if (t >= 159.7) bigText('마지막 한 프레임', TITLE, 92, 200, 700, eo(seg(t, 159.7, 161.0)), dn, { hatch: true });
}
const SHOT_FN = { bang: sBang, premise: sPremise, galaxies: sGalaxies, dust: sDust, collapse: sCollapse, sun: sSun, earth: sEarth, parade: (t, lt, dn) => sParade(t, lt, dn), freeze: sFreeze, inside: sInside, pull: sPull };
