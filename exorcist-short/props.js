// 막차 — props and secondary figures drawn as cels: the shaman's bell (무당방울) in 서하's fist, the 1980s PA handset,
// 서준's phone, the 1984 driver (only from behind or backlit — his face is never drawn), and the shadow people.
import { W, H, TAU, rgba, mix, rng, hash, poly, path, cel, line, ribbon, flutter } from './cel.js';

const OBANG = ['#2f5bd8', '#e8332a', '#f2c230', '#f2efe6', '#22202a'];
const skinSt = P => ({ f: P.skin.f, s: P.skin.s, h: P.skin.h, l: P.skin.l, lw: 3 });

// 무당방울: a wooden handle, a cluster of seven small brass bells, five coloured ribbons. ring 0..1 shakes the bells.
export function bellHand(c, P, x, y, rot = 0, o = {}) {
  const ring = o.ring || 0, ph = o.ph || 0, s = o.s || 1;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  // ribbons (behind the hand), fluttering
  OBANG.forEach((col, k) => {
    const sp = flutter(-10 + k * 6, 60, Math.PI / 2 + .25 - k * .1, 300 + k * 18, 12, 10 + ring * 14, 1.2, ph * TAU + k, 30);
    cel(c, ribbon(sp, u => 16 * (1 - u * .3)), { f: col, s: mix(col, '#000000', .3), so: [-3, 0], l: mix(col, '#000000', .6), lw: 1.6 });
  });
  // sleeve
  if (o.sleeve !== false) cel(c, poly([[-120, 520], [-110, 150], [90, 140], [130, 500]]), { f: P.coat.f, s: P.coat.s, so: [-24, 0], h: P.coat.h, ho: [6, 0], l: P.coat.l, lw: 4 });
  // handle
  cel(c, poly([[-12, -40], [12, -40], [16, 130], [-16, 130]]), { f: '#8a5a2a', s: '#5a3414', so: [-6, 0], h: '#c08a50', ho: [3, 0], l: '#2a1606', lw: 2.4 });
  // the bells: seven brass domes in a cluster
  const B = [[0, -150], [-46, -122], [46, -122], [-30, -84], [30, -84], [0, -104], [0, -60]];
  B.forEach(([bx, by], k) => {
    const jx = Math.sin(ph * 31 + k * 2.1) * 6 * ring, jy = Math.cos(ph * 27 + k) * 4 * ring;
    const D = new Path2D(); D.ellipse(bx + jx, by + jy, 26, 24, 0, 0, TAU);
    cel(c, D, { f: P.brass.f, s: P.brass.s, so: [-8, 6], h: P.brass.h, hi: [[[bx + jx - 12, by + jy - 12], [bx + jx - 2, by + jy - 18], [bx + jx - 6, by + jy - 6]]], l: P.brass.l, lw: 2.2 });
    line(c, [[bx + jx - 10, by + jy + 10], [bx + jx + 10, by + jy + 10]], P.brass.l, 2);
  });
  // fist round the handle
  const S = skinSt(P);
  cel(c, [[-70, 40], [-60, -10], [-20, -30], [40, -26], [72, 6], [70, 90], [40, 130], [-40, 132], [-74, 96]], { ...S, so: [-14, -8] });
  for (let k = 0; k < 3; k++) line(c, [[-50, 10 + k * 34], [50, 4 + k * 34]], P.skin.l, 1.8);
  cel(c, [[-80, 20], [-40, -6], [20, 0], [30, 24], [-30, 34], [-78, 50]], { ...S, so: [-6, -6] });   // thumb over the fingers
  c.restore();
}

// the PA handset (1980s, black, a push-to-talk bar, a coiled cord running off-frame)
export function handset(c, x, y, rot = 0, s = 1, cord = [0, 600]) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  // coiled cord
  c.strokeStyle = '#1a1a22'; c.lineWidth = 7; c.beginPath();
  for (let k = 0; k <= 60; k++) { const u = k / 60, px = cord[0] * u + Math.sin(u * 40) * 16, py = 150 + cord[1] * u; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
  cel(c, [[-56, -150], [56, -150], [62, -110], [48, 150], [-48, 150], [-62, -110]], { f: '#2a2a34', s: '#14141c', so: [-14, 0], h: '#6a6a80', ho: [4, 0], l: '#06060a', lw: 3 });
  const G = new Path2D(); G.ellipse(0, -112, 44, 26, 0, 0, TAU); cel(G instanceof Path2D ? c : c, G, { f: '#3a3a48', l: '#06060a', lw: 2 });
  c.fillStyle = '#0c0c12'; for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) { c.beginPath(); c.arc(i * 10, -112 + j * 9, 2.6, 0, TAU); c.fill(); }
  cel(c, poly([[-58, -30], [-70, -30], [-70, 50], [-58, 50]]), { f: '#b8b8c4', s: '#6a6a78', l: '#06060a', lw: 2 });   // push-to-talk bar
  c.restore();
}

// 서준's phone: his last message to his sister (a generic chat screen, no app branding)
export function phone(c, e, x, y, rot, t, P) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const w = 520, h = 1040, r = 60;
  c.fillStyle = '#16161e'; c.beginPath(); c.roundRect(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36, r + 14); c.fill();
  c.strokeStyle = '#5a5a6e'; c.lineWidth = 4; c.stroke();
  c.save(); c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, r); c.clip();
  c.fillStyle = '#e9eef6'; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = '#c9d6e8'; c.fillRect(-w / 2, -h / 2, w, 150);
  c.fillStyle = '#2a3448'; c.font = '800 40px Pretendard'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('누나', 0, -h / 2 + 96);
  c.font = '600 28px Pretendard'; c.fillText('‹', -w / 2 + 44, -h / 2 + 96);
  const bub = (txt, yy, mine, tm) => {
    c.font = '600 36px Pretendard'; const tw = c.measureText(txt).width + 48, bx = mine ? w / 2 - 28 - tw : -w / 2 + 28;
    c.fillStyle = mine ? '#ffe36a' : '#ffffff'; c.beginPath(); c.roundRect(bx, yy, tw, 70, 26); c.fill();
    c.fillStyle = '#1e2230'; c.textAlign = 'left'; c.fillText(txt, bx + 24, yy + 36);
    if (tm) { c.font = '600 22px Pretendard'; c.fillStyle = '#7a8496'; c.textAlign = mine ? 'right' : 'left'; c.fillText(tm, mine ? bx - 10 : bx + tw + 10, yy + 52); }
  };
  bub('어디야? 늦었는데', -h / 2 + 220, false, '00:24');
  bub('막차 탐 ㅋㅋ', -h / 2 + 330, true);
  bub('종점까지 자 버릴 듯', -h / 2 + 416, true, '00:31');
  c.restore();
  c.restore();
  if (e) { e.save(); e.translate(x, y); e.rotate(rot); e.fillStyle = rgba('#d8e6ff', .28); e.beginPath(); e.roundRect(-w / 2, -h / 2, w, h, r); e.fill(); e.restore(); }
}

// the 1984 driver from behind (seated at the console): cap, collar, navy shoulders, an arm band
export function driverBack(c, x, y, s, k = 1) {
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = k;
  const N = { f: '#2a3258', s: '#161c38', h: '#4a5688', l: '#0a0e22', lw: 3 };
  cel(c, [[-230, 400], [-220, 140], [-150, 60], [-60, 30], [60, 30], [150, 60], [220, 140], [230, 400]], { ...N, so: [-30, -10] });   // shoulders
  cel(c, poly([[-46, 30], [46, 30], [40, -30], [-40, -30]]), { f: '#bba49a', s: '#8a7068', so: [-8, 0], l: '#3a2420', lw: 2.5 });       // neck
  const Hd = new Path2D(); Hd.ellipse(0, -100, 82, 92, 0, 0, TAU); cel(c, Hd, { f: '#2a2420', s: '#141010', so: [-14, -6], l: '#0a0806', lw: 2.5 });   // grey-black hair
  cel(c, [[-100, -128], [-92, -190], [-40, -226], [40, -226], [92, -190], [100, -128], [70, -140], [-70, -140]], { ...N, so: [-14, -6] });   // cap crown
  cel(c, poly([[-104, -136], [104, -136], [108, -112], [-108, -112]]), { f: '#0e1024', l: '#05060e', lw: 2 });   // cap band
  c.fillStyle = '#c8a04a'; c.beginPath(); c.arc(0, -180, 14, 0, TAU); c.fill();   // badge
  cel(c, poly([[-200, 180], [-140, 170], [-140, 230], [-200, 236]]), { f: '#b8b8c0', l: '#0a0e22', lw: 2 });      // arm band
  c.globalAlpha = 1; c.restore();
}
// the driver standing, backlit (a silhouette with a warm rim): cap on, or cap off in his hand; bow 0..1
export function driverBacklit(c, x, y, s, o = {}) {
  const capOff = o.capOff, bow = o.bow || 0, k = o.alpha ?? 1;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = k;
  const SIL = { f: '#0e0c18', rim: { c: '#ffd9a0', d: [-4, -2] }, l: '#2a1a30', lw: 2 };
  cel(c, [[-150, 700], [-160, 260], [-120, 120], [-40, 90], [40, 90], [120, 120], [160, 260], [150, 700]], SIL);   // body
  c.save(); c.translate(0, 80); c.rotate(-bow * .35); c.translate(0, -80);
  const Hd = new Path2D(); Hd.ellipse(10, -10, 62, 72, 0, 0, TAU); cel(c, Hd, SIL);
  cel(c, poly([[-12, 40], [36, 40], [30, 92], [-8, 92]]), SIL);
  if (!capOff) { cel(c, [[-70, -40], [-60, -104], [10, -122], [80, -100], [92, -40], [130, -30], [126, -14], [-74, -22]], SIL); }
  c.restore();
  if (capOff) {   // the cap held to his chest
    cel(c, [[-40, 220], [-30, 170], [40, 160], [80, 180], [90, 230], [-30, 238]], { ...SIL, rim: { c: '#ffd9a0', d: [-3, -2] } });
    cel(c, poly([[-140, 200], [-60, 210], [-40, 250], [-150, 270]]), SIL);
  }
  c.globalAlpha = 1; c.restore();
}

// a shadow person (a hooded silhouette with a violet rim). k: 0..1 opacity; v: variant (posture)
const SHADOW = [[-6, -476], [26, -470], [48, -448], [56, -414], [50, -380], [40, -366], [66, -356], [96, -340], [110, -312], [116, -250], [120, -170], [114, -112], [102, -110], [98, -170], [90, -236], [84, -190], [80, -120], [78, -40], [72, 0], [46, 0], [40, -60], [26, -150], [12, -60], [8, 0], [-18, 0], [-22, -60], [-26, -150], [-30, -236], [-42, -170], [-48, -112], [-60, -110], [-62, -170], [-60, -250], [-56, -312], [-40, -340], [-20, -356], [-38, -372], [-50, -400], [-50, -436], [-34, -464]];
export function shadowPerson(c, x, y, s, o = {}) {
  const k = o.k ?? 1, v = o.v || 0, smoke = o.smoke ?? 1, fr = o.fr || 0;
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); c.globalAlpha = k;
  const pts = SHADOW.map(([px, py]) => [px * (1 + v * .08) + (py < -300 ? v * 8 : 0), py * (1 - v * .04)]);
  cel(c, path(pts), { f: '#07060d', rim: { c: '#b066ff', d: [3, 2] }, l: '#1a0f30', lw: 1.5 });
  if (smoke) { const R = rng(31 + (fr % 3) + v * 7); c.fillStyle = 'rgba(40,18,70,.55)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(-50 + R() * 140, -6 - R() * 40, 16 + R() * 22, 6 + R() * 8, 0, 0, TAU); c.fill(); } }
  c.globalAlpha = 1; c.restore();
}
export const SHADOW_PTS = SHADOW;
