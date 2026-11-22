// The film's seal: a vermilion square in 백문 (white letters carved out) reading 서낭, two Korean syllables knocked out of a
// slightly irregular square with uneven ink paste. (Korean, not a Chinese seal; drawn by code.)
import { vnoise, clamp } from '/core/lib.js';
export const VERM = [176, 46, 34];
export function seal(c, x, y, size, am = 1, seed = 3, text = '서낭') {
  if (am <= 0) return;
  c.save(); c.translate(x, y);
  const S = size, jit = S * .02;
  c.beginPath();
  for (let i = 0; i < 28; i++) {
    const t = i / 28 * 4, side = Math.floor(t), u = t - side;
    let px, py; if (side === 0) { px = u * S; py = 0; } else if (side === 1) { px = S; py = u * S; } else if (side === 2) { px = S - u * S; py = S; } else { px = 0; py = S - u * S; }
    px += (vnoise(seed + i * 1.3) - .5) * jit * 2; py += (vnoise(seed + 40 + i * 1.3) - .5) * jit * 2;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = `rgba(${VERM.join(',')},${clamp(am)})`; c.fill();
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
  // two syllables stacked, carved out (a seal reads top to bottom)
  c.font = `${S * .44}px SongMyung`; c.textAlign = 'center'; c.textBaseline = 'middle';
  [...text].forEach((ch, i) => { c.save(); c.translate(S / 2 + (vnoise(seed + i) - .5) * S * .03, S * (.29 + i * .43)); c.scale(1.05, .98); c.fillText(ch, 0, 0); c.restore(); });
  for (let i = 0; i < 80; i++) { const a = vnoise(seed + i * 3.7), b = vnoise(seed + 91 + i * 2.9); c.globalAlpha = .5 + .5 * vnoise(i * 1.1); c.beginPath(); c.arc(a * S, b * S, S * (.004 + .012 * vnoise(i * 5.3)), 0, 7); c.fill(); }
  c.restore();
}
