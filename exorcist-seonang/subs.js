// Subtitles = 제발 (inscriptions on the painting): Korean serif (Song Myung) in burnt ink, no box, in the shot's empty paper,
// a small vermilion square before each line; they appear wet (bleeding) and dry in a fraction of a second.
import { clamp } from '/core/lib.js';
import { VERM } from './seal.js';
export function wrapKo(text, size, maxW, ctx) {
  ctx.font = `${size}px SongMyung`;
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
export function subtitle(A, text, x, y, a = 1, o = {}) {
  if (a <= 0) return;
  const size = o.size || 48, c = A.cd, w = A.cw;
  const lines = wrapKo(text, size, o.maxW || 860, c);
  const wetK = clamp(1 - a) * .8;
  for (const [ctx, k] of [[w, wetK], [c, 1 - wetK * .6]]) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a * k * .92); ctx.fillStyle = '#000';
    ctx.font = `${size}px SongMyung`; ctx.textBaseline = 'alphabetic';
    lines.forEach((ln, i) => ctx.fillText(ln, x + size * .7, y + i * size * 1.32));
    ctx.restore();
  }
  const s = size * .3, cc = A.cc;
  cc.save(); cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalAlpha = clamp(a * .92); cc.fillStyle = `rgb(${VERM.join(',')})`;
  cc.fillRect(x, y - size * .36 - s / 2, s, s); cc.restore();
  return lines.length;
}
