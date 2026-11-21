// 막차 — the cast: colour models (색지정) per character × lighting set, and each character's options for heads.js
// Lighting sets: day (model sheet), car (cool fluorescent), station (sodium amber of the stations that aren't there), tunnel (dark violet with orange bands), sil, backlit.
// Skin is set by hand per set, never multiplied (STYLE §3: multiplying turns faces pink under coloured light).
import { hex, cel, poly, path, line, mix, rgba, TAU, LWK } from './cel.js';

const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };
export const LIGHTS = {
  day: { lit: [1, 1, 1], shade: [1, 1, 1], line: [1, 1, 1] },
  car: { lit: [.9, 1.0, 1.04], shade: [.56, .66, .86], line: [.8, .86, 1.05] },
  station: { lit: [1.04, .84, .6], shade: [.42, .36, .58], line: [.8, .6, .75] },
  tunnel: { lit: [.66, .6, .86], shade: [.36, .32, .6], line: [.66, .56, .9] },
  sil: { lit: [.16, .13, .26], shade: [.11, .09, .2], line: [.26, .18, .44] },
  backlit: { lit: [.42, .3, .55], shade: [.24, .16, .36], line: [.4, .25, .5] },
};
const SKIN = {   // per character, per set: f (lit), s (shadow), h (highlight)
  seoha: { day: ['#f6d6c4', '#cf9c92', '#fff0e6'], car: ['#e8dad6', '#9aa0bc', '#fbf4f4'], station: ['#f0c8a0', '#8a6a86', '#ffe6c4'], tunnel: ['#c8b4c8', '#6c5c8c', '#e6d6e6'] },
  mujin: { day: ['#e6b99a', '#b07e6a', '#f8dcc4'], car: ['#d6c0b4', '#8a8aa2', '#eee0d8'], station: ['#e2b084', '#7a5a70', '#f8d2a6'], tunnel: ['#b8a0aa', '#5e4e78', '#d8c4cc'] },
  seojun: { day: ['#f4d4c0', '#cc9a8e', '#fff0e4'], car: ['#e2d6d4', '#949ab8', '#f8f2f2'], station: ['#eec6a0', '#866884', '#ffe4c2'], tunnel: ['#c4b2c6', '#685a8a', '#e2d4e4'] },
};
// base (daylight) models; lines are dark versions of their fills (iro-sen), never pure black
const COMMON = {
  white_eye: '#fbf8ff', mouth: '#9a3b4a', blush: '#ff9a9a',
  magenta: { f: '#ff4fa8', s: '#b8327a', l: '#5c1238' },
  phone: { f: '#2a2a34', s: '#16161d', h: '#5c5c70', l: '#08080c' },
  lens: { f: '#86e6ff', s: '#3a9fd0', h: '#ffffff', l: '#1d3a58' },
  chrome: { f: '#dfe7f3', s: '#646f90', h: '#ffffff', l: '#2b3350' },
  strap: { f: '#5a4c66', s: '#3a3044', l: '#16101c' },
  scarf: { f: '#ff6b6b', s: '#cf3d5b', h: '#ffb6a2', l: '#761b34' },
  jacket: { f: '#2f6fe2', s: '#1d45a2', h: '#86b6ff', l: '#112459' },
  stripe: { f: '#f4f6fb', s: '#b7c0d9', l: '#44506e' },
  talisman: { f: '#f2d24a', s: '#c89a28', h: '#fff2a0', l: '#5a3c10' }, ink: '#d8261c',
  brass: { f: '#d6a84a', s: '#8a6420', h: '#fff0b0', l: '#3e2a08' },
};
const BASE = {
  seoha: { ...COMMON, skin: { l: '#5a2e2e' },
    hair: { f: '#2b2640', s: '#16121f', h: '#6d6396', l: '#100c1c' }, lash: '#120c18',
    eye: { f: '#8a2f2a', s: '#3e1214', h: '#f08a66', l: '#1a0808' },
    coat: { f: '#27325e', s: '#161c3c', h: '#5a6aa8', l: '#0c1030' },
    shirt: { f: '#eef0f6', s: '#aab0c8', h: '#ffffff', l: '#3a4260' },
    accent: { f: '#ff4a2e', s: '#b82418', h: '#ffb08a', l: '#5a0c06' } },
  mujin: { ...COMMON, skin: { l: '#4a2620' }, stubble: '#5a6078', blush: '#d07a6a',
    hair: { f: '#3a3632', s: '#24211e', h: '#6a645c', l: '#14110e' }, lash: '#26201c',
    eye: { f: '#4a3428', s: '#22160e', h: '#a88a6a', l: '#120a06' },
    robe: { f: '#8e9196', s: '#5e6168', h: '#c4c7cc', l: '#2a2c32' },
    vest: { f: '#2a2a32', s: '#16161c', h: '#55556a', l: '#08080c' },
    beads: { f: '#6a3c1a', s: '#341a08', h: '#d09050', l: '#1a0c04' } },
  seojun: { ...COMMON, skin: { l: '#5a2e2e' },
    hair: { f: '#3e2e2a', s: '#221814', h: '#7a6058', l: '#160e0c' }, lash: '#140c0a',
    eye: { f: '#5a3a2a', s: '#2a160c', h: '#c09070', l: '#140a06' },
    hood: { f: '#5e7a6a', s: '#3a5244', h: '#9ab8a4', l: '#16241c' },
    bud: { f: '#f2f4f8', s: '#a8b0c0', l: '#3a4050' } },
};
export function pal(who, light = 'day') {
  const L = LIGHTS[light], out = {};
  const haloK = { seoha: .45, seojun: .4, mujin: .4 }[who];
  for (const [k, v] of Object.entries(BASE[who])) {
    if (typeof v === 'string') { out[k] = mul(v, L.lit); continue; }
    out[k] = {}; for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit);
  }
  const sk = SKIN[who][light];
  out.haloCol = mix(out.hair.h, out.hair.f, haloK);
  if (sk) Object.assign(out.skin, { f: sk[0], s: sk[1], h: sk[2] });
  else { const d = SKIN[who].day; Object.assign(out.skin, { f: mul(d[0], L.lit), s: mul(d[1], L.shade), h: mul(d[2], L.lit) }); }
  return out;
}

// —— bodies (local head coordinates: shoulders at y≈140–210, frame bottom y≈330) ——
function coatBody(g, P, view) {   // 서하: navy long coat, stand collar open over a white shirt
  const dx = view === 'front' ? 0 : view === 'q' ? -14 : -34;
  cel(g, [[-186 + dx, 340], [-178 + dx, 208], [-136 + dx, 160], [-58 + dx, 140], [48 + dx, 140], [120 + dx, 158], [162 + dx, 206], [172 + dx, 340]],
    { f: P.coat.f, s: P.coat.s, so: [-30, -10], h: P.coat.h, ho: [8, 6], l: P.coat.l, lw: 1.65 });
  cel(g, poly([[-34 + dx, 134], [30 + dx, 134], [12 + dx, 236], [-6 + dx, 250]]), { f: P.shirt.f, s: P.shirt.s, sh: [[[-34 + dx, 134], [-10 + dx, 134], [-6 + dx, 250]]], l: P.shirt.l, lw: 1.3 });
  cel(g, poly([[-64 + dx, 132], [-36 + dx, 126], [-8 + dx, 252], [-58 + dx, 340], [-92 + dx, 340], [-74 + dx, 230]]), { f: P.coat.f, s: P.coat.s, so: [-10, -4], h: P.coat.h, ho: [4, 0], l: P.coat.l, lw: 1.5 });
  cel(g, poly([[34 + dx, 126], [60 + dx, 132], [70 + dx, 228], [54 + dx, 340], [22 + dx, 340], [10 + dx, 250]]), { f: P.coat.f, s: P.coat.s, so: [-10, -4], h: P.coat.h, ho: [4, 0], l: P.coat.l, lw: 1.5 });
  line(g, [[-20 + dx, 136], [-14 + dx, 150]], P.shirt.l, 1); line(g, [[18 + dx, 136], [12 + dx, 150]], P.shirt.l, 1);
}
function robeBody(g, P, view) {   // 무진: grey 승복 with a crossed collar, black padded vest, 108 beads round the neck
  const dx = view === 'front' ? 0 : view === 'q' ? -16 : -36;
  cel(g, [[-214 + dx, 340], [-206 + dx, 200], [-156 + dx, 150], [-62 + dx, 136], [54 + dx, 136], [140 + dx, 148], [194 + dx, 198], [204 + dx, 340]],
    { f: P.robe.f, s: P.robe.s, so: [-34, -10], h: P.robe.h, ho: [8, 6], l: P.robe.l, lw: 1.7 });
  // crossed collar: the right panel over the left, a darker band
  cel(g, poly([[-44 + dx, 134], [-26 + dx, 128], [12 + dx, 244], [0 + dx, 262]]), { f: mix(P.robe.f, P.robe.l, .3), s: P.robe.s, l: P.robe.l, lw: 1.3 });   // a V collar meeting low on the chest, right over left
  cel(g, poly([[28 + dx, 128], [46 + dx, 134], [6 + dx, 266], [-8 + dx, 252]]), { f: mix(P.robe.f, P.robe.l, .3), s: P.robe.s, so: [-4, -4], l: P.robe.l, lw: 1.3 });
  // vest panels (padded: diagonal quilting)
  for (const side of [-1, 1]) {
    const pts = side < 0 ? [[-170 + dx, 168], [-90 + dx, 142], [-66 + dx, 190], [-80 + dx, 340], [-176 + dx, 340]] : [[80 + dx, 142], [158 + dx, 166], [168 + dx, 340], [72 + dx, 340], [58 + dx, 190]];
    cel(g, poly(pts), { f: P.vest.f, s: P.vest.s, so: [-14, -6], h: P.vest.h, ho: [4, 3], l: P.vest.l, lw: 1.5,
      clipFn: gg => { gg.strokeStyle = rgba(P.vest.h, .35); gg.lineWidth = 1.2 * LWK.k; for (let k = -6; k < 8; k++) { gg.beginPath(); gg.moveTo(-220 + dx, 150 + k * 34); gg.lineTo(220 + dx, 290 + k * 34); gg.stroke(); } } });
  }
  // 108 beads: a U loop over the chest (big beads, a hard highlight each)
  const n = 24;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), a = Math.PI - .12 - u * (Math.PI - .24), x = dx - 4 + Math.cos(a) * 98, y = 138 + Math.sin(a) * 128;   // a U hanging over the chest
    const B = new Path2D(); B.arc(x, y, 9, 0, TAU);
    cel(g, B, { f: P.beads.f, s: P.beads.s, so: [-3, -3], h: P.beads.h, hi: [[[x - 4, y - 5], [x, y - 7], [x - 2, y - 2]]], l: P.beads.l, lw: 1.1 });
  }
}
function hoodBody(g, P, view) {   // 서준: hoodie, the hood bunched round the neck, drawstrings, earbuds
  const dx = view === 'front' ? 0 : view === 'q' ? -14 : -34;
  cel(g, [[-176 + dx, 340], [-168 + dx, 214], [-128 + dx, 166], [-56 + dx, 146], [46 + dx, 146], [112 + dx, 164], [152 + dx, 212], [162 + dx, 340]],
    { f: P.hood.f, s: P.hood.s, so: [-30, -10], h: P.hood.h, ho: [8, 6], l: P.hood.l, lw: 1.6 });
  cel(g, [[-96 + dx, 160], [-70 + dx, 118], [-20 + dx, 104], [40 + dx, 112], [76 + dx, 150], [40 + dx, 170], [-20 + dx, 176], [-70 + dx, 176]],
    { f: P.hood.f, s: P.hood.s, so: [-10, -14], h: P.hood.h, ho: [4, 4], l: P.hood.l, lw: 1.5 });
  line(g, [[-18 + dx, 172], [-22 + dx, 250]], P.bud.s, 2.2); line(g, [[16 + dx, 170], [20 + dx, 244]], P.bud.s, 2.2);
}
// 오방색 hair tie: five small bands (blue, red, yellow, white, black) wound round a low tail
function obangTie(g, P, px, py, SO) {
  const C = ['#2f5bd8', '#e8332a', '#f2c230', '#f2efe6', '#22202a'];
  for (let k = 0; k < 5; k++) cel(g, poly([[px - 13, py - 10 + k * 5], [px + 11, py - 12 + k * 5], [px + 12, py - 7 + k * 5], [px - 12, py - 5 + k * 5]]), { f: C[k], l: mix(C[k], '#000000', .55), lw: .9 });
}

// —— character options for heads.js ——
export const CH = {
  seoha: { goggles: false, headset: false, body: coatBody, tie: obangTie, tieX: -66, tieY: 34,
    hair: { q: { side: [[-78, -44, -58, -58, -80, 132, -12], [52, -40, 60, -30, 58, 112, 10]], halo: [-14, -20, 66, 54, Math.PI * 1.22, Math.PI * 1.72, 4.5, 7] }, front: { side: [[-76, -40, -58, -54, -74, 130, -8], [76, -40, 58, -54, 74, 130, 8]], halo: [0, -18, 68, 54, Math.PI * 1.2, Math.PI * 1.8, 4.5, 8] }, side: { halo: [0, -20, 60, 54, Math.PI * 1.18, Math.PI * 1.72, 4.5, 7] } } },
  mujin: { autoShade: [-1, -.55], male: true, iris: .82, goggles: false, headset: false, bald: true, ponytail: false, body: robeBody, age: true, eyeK: .76, eyeH: .7, eyeDy: 2, browW: 2.6,
    views: {
      q: { face: [[4, 116], [30, 112], [46, 98], [54, 82], [56, 64], [58, 48], [61, 32], [55, 18], [58, 2], [57, -36], [44, -70], [18, -92], [-14, -100], [-48, -94], [-74, -70], [-90, -34], [-92, 4], [-86, 38], [-74, 66], [-58, 92], [-30, 110]],
        neck: [[-48, 62], [20, 92], [26, 142], [-56, 142]] },
      side: { face: [[60, -50], [72, -24], [75, -2], [70, 14], [75, 30], [84, 46, 1], [77, 53], [78, 60], [80, 65], [75, 70], [78, 76], [72, 88], [74, 104, 1], [58, 114], [24, 108], [-6, 92], [-30, 70], [-50, 36], [-56, -6], [-44, -54], [-10, -84], [30, -86]] },
      front: { face: [[-70, -36], [-72, 6], [-70, 40], [-62, 70], [-46, 94], [-24, 110], [0, 118], [24, 110], [46, 94], [62, 70], [70, 40], [72, 6], [70, -36], [52, -74], [20, -92], [-20, -92], [-52, -74]] } } },
  seojun: { male: true, goggles: false, headset: false, ponytail: false, body: hoodBody,
    hair: { q: { side: [[-78, -44, -58, -58, -76, 40, -8], [52, -40, 60, -30, 56, 30, 6]] } } },
};
