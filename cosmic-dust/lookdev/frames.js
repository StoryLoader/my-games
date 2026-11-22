// 마지막 한 프레임 — look-dev frames (vertical 1080×1920), drawn with the library's scratch-film engine (base.js)
// Dyes, one per kind of thing for the whole film: YEL stars and the sun · BLUE water · GREEN life · RED heat and extinction · TEAL humans (only).
'use strict';
const TITLE = { f: 'TITLE' }, MONOF = { f: 'MONO' }, SUBF = { f: 'SUBF' };
const RX = 78, RY0 = 150, RY1 = 1760;                    // the time ruler: the whole 2 minutes, top to bottom
const ry = u => lerp(RY0, RY1, u);

// the time ruler: a needle line with ticks every 10 s of video, a cursor at "now", the mono readout beside it
function timeRuler(dn, u, label, o = {}){
  rs(dn * 7 + 3);
  scratch([[RX, RY0 - 20], [RX + 1, (RY0 + RY1) / 2], [RX, RY1 + 20]], { w: 2.6, tail: false });
  for (let k = 0; k <= 12; k++){ const y = ry(k / 12), L = k % 3 === 0 ? 34 : 18; scratch([[RX - 4, y], [RX + L, y + 1]], { w: k % 3 === 0 ? 2.2 : 1.4, tail: false }); }
  if (u > .05) cutText(txtImg('0:00', MONOF, 30), RX + 22, RY0 - 58, 1, dn, { tip: false, a: .75 });
  cutText(txtImg('2:00', MONOF, 30), RX + 22, RY1 + 6, 1, dn, { tip: false, a: .75 });
  const y = ry(u);
  // cursor: a small cut arrow, the readout beside it
  scratch([[RX + 50, y - 16], [RX + 18, y], [RX + 50, y + 16]], { w: 3.4, tail: false });
  glow(RX, y, 34, 'rgba(255,244,220,1)', .5);
  const img = txtImg(label, MONOF, 34);
  cutText(img, RX + 60, y - 26, 1, dn, { tip: false });
  if (o.sub2) cutText(txtImg(o.sub2, MONOF, 26, '#e6d8b8'), RX + 62, y + 18, 1, dn, { tip: false, a: .85 });
}
// narration subtitle: low left, cream, revealed left to right (no box, no outline)
function subtitle(text, p, dn){
  if (!text) return;
  const lines = text.split('\n');
  lines.forEach((ln, i) => cutText(txtImg(ln, SUBF, 46), 150, 1520 + i * 64, p, dn, { tip: false }));
}
// a field of points (stars / dust), soft Gaussian clusters, never boxes
function points(seed, n, cx, cy, sx, sy, o = {}){
  const q = rng(seed);
  const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += q(); return (s - 2) / 1.15; };
  for (let i = 0; i < n; i++){
    let x = cx + gauss() * sx, y = cy + gauss() * sy;
    if (o.rot){ const dx = x - cx, dy = y - cy; x = cx + dx * Math.cos(o.rot) - dy * Math.sin(o.rot); y = cy + dx * Math.sin(o.rot) + dy * Math.cos(o.rot); }
    const s = (o.size ?? 1.6) * (.4 + q() * q() * 2.2), a = (o.a ?? .8) * (.3 + q() * .7);
    G.globalAlpha = a; G.fillStyle = q() < (o.yel ?? 0) ? YEL : CREAM; G.fillRect(x - s / 2, y - s / 2, s, s);
  }
  G.globalAlpha = 1;
}
// a straight-edged rectangle for the needle (dense points keep the spline from rounding the corners)
function rectPts(x0, y0, x1, y1, n = 14){ const P = [], C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]; for (let i = 0; i < 4; i++) for (let k = 0; k < n; k++) P.push([lerp(C[i][0], C[i + 1][0], k / n), lerp(C[i][1], C[i + 1][1], k / n)]); P.push([x0, y0]); return P; }
function ring(cx, cy, r, n = 40){ const P = []; for (let i = 0; i <= n; i++){ const a = i / n * Math.PI * 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return P; }

// ——— F1: the promise (0:00) ———
function fHook(t, dn){
  rs(dn * 11 + 1);
  const L = [['이 영상에서', 1], ['인간은', 1], ['마지막 0.003초에만', 1], ['나옵니다.', .62]];
  L.forEach(([s, p], i) => {
    const img = txtImg(s, TITLE, 112, CREAM, { hatch: true }), sc = Math.min(1, 860 / img.width);
    const y = 330 + i * 150;
    if (i === 1) { rs(dn * 3 + 9); dye([[180, y + 132], [420, y + 136]], { col: TEAL, w: 26, a: .8 }); }   // "인간" gets the one dye humans own
    cutText(img, 170, y, p, dn, { sc, tipR: 46 });
  });
  // the single point of light the universe will come from
  const x = 560, y = 1150; glow(x, y, 150, 'rgba(255,244,220,1)', .5); glow(x, y, 46, 'rgba(255,255,255,1)', .9); disc(x, y, 7, '#ffffff', 1);
  rs(dn * 5 + 2); for (let i = 0; i < 8; i++){ const a = R() * 6.28, d = 20 + R() * 46; scratch([[x + Math.cos(a) * d * .4, y + Math.sin(a) * d * .4], [x + Math.cos(a) * d, y + Math.sin(a) * d]], { w: 1.2, tail: false, a: .7 }); }
  timeRuler(dn, 0, '0:00 · 138억 년 전', { sub2: '빅뱅' });
}

// ——— F2: 1:20 — the sun, a disk of dust, a molten Earth ———
function fEarth(t, dn){
  rs(dn * 13 + 4);
  // the sun: stacked sparse yellow hatching, a cut rim, dye rays (never a flat fill)
  const sx = 900, sy = 330, sr = 300;
  for (let k = 0; k < 4; k++) hatch(ring(sx, sy, sr - k * 50, 48), YEL, { gap: 10 - k * 1.5, a: .35 + k * .12, ang: .5 + k * .7, lw: [1.4, 3.6] });
  hatch(ring(sx, sy, sr * .5, 32), CREAM, { gap: 5, a: .55, ang: -.3, lw: [1.2, 3] });
  scratch(ring(sx, sy, sr, 64), { w: 4, tail: false });
  for (let k = 0; k < 14; k++){ const a = Math.PI * .5 + k * .19, r0 = sr + 20, r1 = sr + 140 + (k % 3) * 60; dye([[sx + Math.cos(a) * r0, sy + Math.sin(a) * r0], [sx + Math.cos(a) * r1, sy + Math.sin(a) * r1]], { col: YEL, w: 14, a: .55, n: 5 }); }
  // the dust disk: thousands of points in a tilted ellipse, lanes cut through it
  const cx = 560, cy = 1060;
  points(41 + dn % 3, 5200, cx, cy, 420, 110, { rot: -.22, size: 1.8, a: .7, yel: .06 });
  rs(dn * 2 + 7);
  for (let k = 0; k < 4; k++){ const P = []; for (let i = 0; i <= 50; i++){ const a = i / 50 * Math.PI * 2, rx = 160 + k * 90, rr_ = 42 + k * 24; const x = rx * Math.cos(a), y = rr_ * Math.sin(a); P.push([cx + x * Math.cos(-.22) - y * Math.sin(-.22), cy + x * Math.sin(-.22) + y * Math.cos(-.22)]); } scratch(P, { w: 1.2, a: .45, tail: false }); }
  // the molten Earth: red dye hatched, a cut rim, a few cooling cracks in cream
  const ex = 730, ey = 1010, er = 92;
  hatch(ring(ex, ey, er, 32), RED, { gap: 6, a: .85, ang: .7, lw: [1.4, 3.4] });
  hatch(ring(ex - 20, ey - 22, er * .55, 24), YEL, { gap: 6, a: .55, ang: -.5, lw: [1, 2.6] });
  scratch(ring(ex, ey, er, 40), { w: 3.2, tail: false });
  for (let k = 0; k < 6; k++){ const a = k * 1.1; scratch([[ex + Math.cos(a) * 20, ey + Math.sin(a) * 18], [ex + Math.cos(a + .4) * 60, ey + Math.sin(a + .4) * 54], [ex + Math.cos(a + .2) * 84, ey + Math.sin(a + .2) * 80]], { w: 1.4, a: .8, tail: false }); }
  glow(ex, ey, 220, 'rgba(255,50,32,1)', .18);
  timeRuler(dn, 80 / 120, '1:20 · 46억 년 전', { sub2: '태양과 지구' });
  subtitle('1분 20초가 지나서야,\n태양과 지구가 생깁니다.', 1, dn);
}

// ——— F3: the freeze — this video's last frame in its strip, its bottom 1/16 lit teal ———
function fFreeze(t, dn){
  rs(dn * 17 + 5);
  const fx = 210, fw = 400, fh = fw * 16 / 9, gap = 26, y3 = 600;      // the last frame's top
  const strip = (y0, y1) => { scratch([[fx - 54, y0], [fx - 54, y1]], { w: 2.4, tail: false }); scratch([[fx + fw + 54, y0], [fx + fw + 54, y1]], { w: 2.4, tail: false });
    for (let y = y0 + 10; y < y1 - 20; y += 46){ for (const x of [fx - 34, fx + fw + 22]) scratch(rectPts(x, y, x + 14, y + 22, 4), { w: 1.6, tail: false, a: .8 }); } };
  strip(-40, y3 + fh + 60);
  // earlier frames above (the last few million years: the plains, a few upright figures), drawn dim
  for (let k = 1; k <= 2; k++){
    const y0 = y3 - k * (fh + gap);
    scratch(rectPts(fx, y0, fx + fw, y0 + fh), { w: 2.4, tail: false, a: .7 });
    rs(dn + k * 31);
    scratch([[fx + 10, y0 + fh * .7], [fx + fw * .5, y0 + fh * .68], [fx + fw - 10, y0 + fh * .71]], { w: 1.8, a: .5, tail: false });
    for (let j = 0; j < 3; j++){ const x = fx + 90 + j * 110 + k * 12, y = y0 + fh * .7; scratch([[x, y - 18], [x + 1, y - 52]], { w: 2.6, a: .55, tail: false }); disc(x + 1, y - 60, 6, CREAM, .55); scratch([[x - 8, y], [x, y - 18], [x + 8, y]], { w: 2, a: .55, tail: false }); scratch([[x - 10, y - 34], [x, y - 46], [x + 10, y - 30]], { w: 1.8, a: .5, tail: false }); }
  }
  // the last frame: a held breath; its last 1/16 is all of us
  const P = [[fx, y3], [fx + fw, y3], [fx + fw, y3 + fh], [fx, y3 + fh]];
  rs(dn * 3 + 1); scratch(rectPts(fx, y3, fx + fw, y3 + fh), { w: 4.2, tail: false });
  glow(fx + fw / 2, y3 + fh / 2, 520, 'rgba(255,244,220,1)', .06);
  const bh = fh / 16, by = y3 + fh - bh;
  hatch([[fx + 4, by], [fx + fw - 4, by], [fx + fw - 4, by + bh - 4], [fx + 4, by + bh - 4]], TEAL, { gap: 3.5, a: .95, ang: .9, lw: [1.4, 3.2], passes: 3 });
  hatch([[fx + 4, by], [fx + fw - 4, by], [fx + fw - 4, by + bh - 4], [fx + 4, by + bh - 4]], CREAM, { gap: 9, a: .45, ang: -.4, lw: [1, 2.2] });
  glow(fx + fw / 2, by + bh / 2, 200, 'rgba(31,179,154,1)', .35);
  scratch([[fx - 4, by], [fx + fw + 4, by]], { w: 2.4, tail: false });
  // labels with cut leader lines
  rs(dn * 5 + 8);
  scratch([[fx + fw + 70, y3 + 40], [fx + fw + 110, y3 + 40]], { w: 2, tail: false });
  cutText(txtImg('마지막 한 칸', MONOF, 32), fx + fw + 118, y3 + 16, 1, dn, { tip: false });
  cutText(txtImg('1/24초', MONOF, 28, '#e6d8b8'), fx + fw + 118, y3 + 58, 1, dn, { tip: false });
  cutText(txtImg('≈ 480만 년', MONOF, 28, '#e6d8b8'), fx + fw + 118, y3 + 96, 1, dn, { tip: false });
  scratch([[fx + fw + 8, by + bh / 2], [fx + fw + 110, by + bh / 2 - 40]], { w: 2, tail: false });
  cutText(txtImg('인류 30만 년', MONOF, 32, '#9ff0de'), fx + fw + 118, by - 70, 1, dn, { tip: false });
  cutText(txtImg('= 이 칸의 1/16', MONOF, 28, '#9ff0de'), fx + fw + 118, by - 30, 1, dn, { tip: false });
  // the stopped clock
  cutText(txtImg('▮▮ 정지', MONOF, 34), fx + fw + 70, y3 - 150, 1, dn, { tip: false });
  cutText(txtImg('1:59.96', MONOF, 30, '#e6d8b8'), fx + fw + 70, y3 - 108, 1, dn, { tip: false });
  subtitle('여기서 멈추겠습니다.\n이 영상의 마지막 한 칸입니다.', 1, dn);
}

// ——— F4: inside the sliver — all of human history, time flowing down ———
function fInside(t, dn){
  rs(dn * 19 + 6);
  // the whole frame is the teal sliver now: sparse teal hatching as the ground light
  for (let k = 0; k < 3; k++) hatch([[0, 0], [W, 0], [W, H], [0, H]], TEAL, { gap: 26 - k * 6, a: .1 + k * .05, ang: .9 + k * .5, lw: [1, 2.4] });
  const items = [
    ['30만 년 전', '호모 사피엔스', 'fig'], ['4만 년 전', '동굴 벽의 손바닥', 'hand'], ['1만 2천 년 전', '처음 심은 씨앗', 'seed'],
    ['4,500년 전', '피라미드', 'pyr'], ['1969년', '달에 찍힌 발자국', 'moon'], ['지금', '이 영상을 보는 당신', 'phone']];
  items.forEach(([when, what, ic], i) => {
    const y = 190 + i * 230, x = 250;
    rs(dn * 7 + i * 13);
    icon(ic, x, y + 60);
    cutText(txtImg(when, MONOF, 34, '#9ff0de'), 420, y + 10, 1, dn, { tip: false });
    cutText(txtImg(what, SUBF, 44), 420, y + 58, i === 5 ? .7 : 1, dn, { tipR: 30 });
    if (i < 5) scratch([[x, y + 140], [x + 1, y + 210]], { w: 1.4, a: .6, tail: false });
  });
}
function icon(kind, x, y){
  if (kind === 'fig'){ scratch([[x, y - 58], [x + 2, y + 30]], { w: 4 }); disc(x, y - 72, 14, CREAM, .9); scratch([[x - 34, y - 20], [x, y - 40], [x + 36, y - 16]], { w: 3 }); scratch([[x - 22, y + 82], [x + 1, y + 30], [x + 24, y + 82]], { w: 3.4 }); }
  if (kind === 'hand'){ dye([[x - 50, y + 40], [x + 50, y - 40]], { col: RED, w: 90, a: .5, n: 9 }); for (let k = 0; k < 5; k++){ const a = -2.4 + k * .42; scratch([[x, y + 30], [x + Math.cos(a) * 62, y + Math.sin(a) * 62]], { w: 9, a: .9 }); } hatch(ring(x, y + 30, 34, 20), CREAM, { gap: 5, a: .8 }); }
  if (kind === 'seed'){ scratch([[x, y + 70], [x, y - 40]], { w: 3 }); for (let k = 0; k < 4; k++){ const yy = y - 30 + k * 24; dye([[x, yy], [x - 38, yy - 22]], { col: GREEN, w: 14, a: .8, n: 4 }); dye([[x, yy], [x + 38, yy - 22]], { col: GREEN, w: 14, a: .8, n: 4 }); } }
  if (kind === 'pyr'){ const P = [[x - 80, y + 60], [x, y - 70], [x + 80, y + 60]]; hatch(P, YEL, { gap: 6, a: .7, ang: .6 }); scratch(P.concat([P[0]]), { w: 3.2, tail: false }); }
  if (kind === 'moon'){ hatch(ring(x, y, 70, 32), CREAM, { gap: 6, a: .55 }); scratch(ring(x, y, 70, 40), { w: 3, tail: false }); const fp = [[x - 16, y - 20], [x + 4, y - 26], [x + 14, y + 10], [x - 6, y + 22], [x - 20, y + 4]]; fillPoly(fp, INK, .85); }
  if (kind === 'phone'){ const P = [[x - 44, y - 78], [x + 44, y - 78], [x + 44, y + 78], [x - 44, y + 78]]; scratch(P.concat([P[0]]), { w: 3.4, tail: false }); hatch([[x - 36, y + 54], [x + 36, y + 54], [x + 36, y + 66], [x - 36, y + 66]], TEAL, { gap: 3, a: .95 }); scratch([[x - 30, y - 66], [x - 30, y + 46]], { w: 1.6, a: .8, tail: false }); }
}
const FRAMES = [fHook, fEarth, fFreeze, fInside];
