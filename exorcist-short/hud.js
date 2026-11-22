// 막차 — subtitles on the tape (composited inside the CRT pass): cream-yellow semi-bold Korean with a thick dark outline;
// each speaker keeps a colour; the PA and the driver carry a small role tag. Long lines wrap to two or three rows.
import { W, H, rgba } from './cel.js';
import { VO } from './story.js';
const STYLE = { seoha: { col: '#fff0a0' }, mujin: { col: '#bfe4ff' }, seojun: { col: '#c8ffc8' }, pa: { col: '#bff6ff', tag: '안내 방송', tagc: '#8ff4ff' }, driver: { col: '#d4efe4', tag: '기관사', tagc: '#9fe8c8' } };
export function subSpans(durs) {
  const S = VO.map(v => { const d = durs[v.id] ?? v.text.length * .1; return { ...v, a: v.t - .05, b: v.t + Math.max(d + .6, 1.9) }; });
  S.forEach((s, i) => { if (S[i + 1]) s.b = Math.min(s.b, S[i + 1].a); });
  return S;
}
function wrap(c, text, maxW) {
  const words = text.split(' '), rows = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (c.measureText(nx).width > maxW && cur) { rows.push(cur); cur = w; } else cur = nx; }
  if (cur) rows.push(cur); return rows;
}
export function hud(c, t, spans, hide = false) {
  c.clearRect(0, 0, W, H);
  if (hide) return;
  const v = spans.find(s => t >= s.a && t < s.b); if (!v) return;
  const st = STYLE[v.who] || STYLE.seoha, F = '700 52px Pretendard';
  c.save(); c.font = F; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.textAlign = 'center';
  const rows = wrap(c, v.text, 930), lh = 70, y0 = 1540 - (rows.length - 1) * lh;
  if (st.tag) {
    c.font = '800 26px Pretendard'; const tw = c.measureText(st.tag).width + 36, tx = W / 2 - tw / 2, ty = y0 - 84;
    c.fillStyle = rgba('#07121a', .8); c.beginPath(); c.roundRect(tx, ty, tw, 46, 8); c.fill(); c.strokeStyle = st.tagc; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = st.tagc; c.fillText(st.tag, W / 2, ty + 24); c.font = F;
  }
  rows.forEach((r, i) => {
    const y = y0 + i * lh;
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.strokeStyle = '#120a1e'; c.lineWidth = 10; c.strokeText(r, W / 2, y);
    c.shadowColor = 'transparent'; c.fillStyle = st.col; c.fillText(r, W / 2, y);
  });
  c.restore();
}
