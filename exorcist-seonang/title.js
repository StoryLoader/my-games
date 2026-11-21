// The title 「서낭나무」 written in one vertical column, as the style asks: an OFL brush font (Nanum Brush Script) is only the
// skeleton. Broad brush passes in stroke order (left to right, top to bottom inside each syllable) reveal the glyph through its
// outline, so the letters are painted into existence; a few dry strokes add flying white inside the letterforms.
import { mk, draw, TONE } from './ink.js';
import { clamp } from '/core/lib.js';
const TXT = ['서', '낭', '나', '무'];
// stroke passes per syllable, in a 100×100 cell (rough stroke order: initial, vowel, final)
const PASS = {
  '서': [[[22, 22], [40, 46], [18, 78]], [[38, 46], [52, 74]], [[50, 44], [70, 46]], [[72, 12], [74, 50], [72, 92]]],
  '낭': [[[22, 12], [22, 44], [50, 48]], [[70, 6], [70, 50]], [[70, 28], [90, 28]], [[50, 66], [30, 76], [50, 94], [70, 76], [50, 66]]],
  '나': [[[20, 18], [20, 70], [56, 74]], [[70, 8], [70, 92]], [[70, 48], [92, 48]]],
  '무': [[[20, 14], [20, 48]], [[20, 14], [78, 14], [78, 48]], [[20, 48], [80, 48]], [[10, 64], [90, 62]], [[50, 62], [50, 96]]],
};
const masks = {};
function glyphMask(ch, x, y, S, W, H) {
  const key = ch + [x, y, S].join(',');
  if (masks[key]) return masks[key];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.font = `${S}px NanumBrush`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#000'; c.fillText(ch, x + S / 2, y + S / 2 + S * .04);
  c.strokeStyle = '#000'; c.lineWidth = S * .04; c.lineJoin = 'round'; c.strokeText(ch, x + S / 2, y + S / 2 + S * .04);
  return (masks[key] = cv);
}
// write the column: p ∈ [0,1] overall progress; x, y top-left of the column; S = cell size.
// Work is confined to each syllable's cell (clip + sub-rect blits), and a finished syllable is kept and re-used.
const done = {};
export function writeTitle(dst, T, x, y, S, p, am = 1) {
  const W = T.wet.width, H = T.wet.height, n = TXT.length;
  for (let i = 0; i < n; i++) {
    const pi = clamp(p * n - i); if (pi <= 0) continue;
    const ch = TXT[i], cy = y + i * S * 1.02, k = S / 100;
    const rx = Math.max(0, Math.floor(x - S * .25)), ry = Math.max(0, Math.floor(cy - S * .25)), rw = Math.min(W - rx, Math.ceil(S * 1.5)), rh = Math.min(H - ry, Math.ceil(S * 1.5));
    const key = [ch, x, cy, S].join(',');
    if (pi >= 1 && am === 1 && done[key]) {
      for (const kk of ['wet', 'dry']) { const d = dst[kk]; d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.drawImage(done[key][kk], rx, ry); d.restore(); }
      continue;
    }
    for (const c of [T.ink.wet, T.ink.dry]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(rx, ry, rw, rh); }
    const passes = PASS[ch], m = passes.length;
    passes.forEach((ps, j) => {
      const pj = clamp(pi * m - j); if (pj <= 0) return;
      const pts = ps.map(q => [x + q[0] * k, cy + q[1] * k, 1]);
      draw(T.ink, mk(pts, { w: 34 * k, tone: TONE.jiao, dry: .08, wet: .45, prof: 'even', rough: .06, nb: 40, solid: true, seed: 900 + i * 17 + j }), pj, am);
      draw(T.ink, mk(pts, { w: 22 * k, tone: TONE.jiao, dry: .7, wet: 0, prof: 'even', rough: .2, nb: 30, seed: 500 + i * 17 + j }), pj, am);
    });
    const mask = glyphMask(ch, x, cy, S, W, H), keep = pi >= 1 && am === 1 ? {} : null;
    for (const kk of ['wet', 'dry']) {
      const c = T.ink[kk]; c.save(); c.beginPath(); c.rect(rx, ry, rw, rh); c.clip();
      c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, rx, ry, rw, rh, rx, ry, rw, rh); c.restore();
      const d = dst[kk]; d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.drawImage(T[kk], rx, ry, rw, rh, rx, ry, rw, rh); d.restore();
      if (keep) { const cv = document.createElement('canvas'); cv.width = rw; cv.height = rh; cv.getContext('2d').drawImage(T[kk], rx, ry, rw, rh, 0, 0, rw, rh); keep[kk] = cv; }
    }
    if (keep) done[key] = keep;
  }
}
