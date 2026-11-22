// 2D overlay of 「악몽을 지키는 파수꾼」: title, place cards, dialogue box (typed), narration subtitles, fades between sets.
// Adapted from the library's 2.5D Pixel Art engine (ui.js): the metal is silver (a moonlit town), the type Korean
// (Gowun Batang for titles and cards, Nanum Myeongjo for subtitles and dialogue), no credit line of any kind.
import { VO, SHOTS, T, CARDS, clamp, seg, ss } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = cv.width = (window.FILM_SIZE || [innerWidth])[0], H = cv.height = (window.FILM_SIZE || [0, innerHeight])[1], PORT = H > W;   // PORT: the vertical cut (Shorts): keep text clear of the top bar, the bottom caption area and the right-hand buttons
let DURS = {};
const SILVER = '#cfd6e4', SILVER_L = '#eef2fa', SILVER_D = '#8e98ad', PAPER = '#f3f1ea';
const F_TITLE = "700 104px 'Gowun Batang'", F_LABEL = "700 34px 'Gowun Batang'", F_CARD = "700 70px 'Gowun Batang'";
const F_SUB = "700 48px 'Nanum Myeongjo'", F_DLG = "700 46px 'Nanum Myeongjo'", F_NAME = "700 34px 'Nanum Myeongjo'";

export async function overlayReady() {
  await Promise.all([F_TITLE, F_LABEL, F_SUB, F_NAME].map(f => document.fonts.load(f, '악몽을 지키는 파수꾼')));
  DURS = await (await fetch('voices/dur.json')).json();
}

function ornament(cx, y, w, a) {
  g.save(); g.globalAlpha = a; g.fillStyle = SILVER_L; g.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, 'rgba(220,228,242,1)'); gr.addColorStop(1, 'rgba(220,228,242,0)');
    g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 16, y); g.lineTo(cx + s * w, y); g.stroke();
    g.beginPath(); g.arc(cx + s * 26, y, 2.5, 0, 7); g.fill();
  }
  g.strokeStyle = SILVER; g.beginPath(); g.moveTo(cx, y - 8); g.lineTo(cx + 8, y); g.lineTo(cx, y + 8); g.lineTo(cx - 8, y); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cx, y - 3.5); g.lineTo(cx + 3.5, y); g.lineTo(cx, y + 3.5); g.lineTo(cx - 3.5, y); g.closePath(); g.fill();
  g.restore();
}
function spaced(text, x, y, sp) {
  const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; });
  return tot;
}
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }

// —— title card (over a soft wide of the tower) ——
function titleCard(t, c) {
  const a = ss(seg(t, c.a, c.a + 1.2)) * (1 - ss(seg(t, c.b - .8, c.b)));
  if (a <= 0) return;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a * .45; const bg = g.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 900); bg.addColorStop(0, 'rgba(4,6,14,.85)'); bg.addColorStop(1, 'rgba(4,6,14,.2)'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = a; g.font = F_TITLE;
  const gr = g.createLinearGradient(0, 470, 0, 560); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, SILVER); gr.addColorStop(1, SILVER_D);
  if (PORT) { const ws = c.text.split(' '), l1 = ws.slice(0, -1).join(' '), l2 = ws[ws.length - 1], y0 = H * .40;
    g.font = "700 112px 'Gowun Batang'"; const gr2 = g.createLinearGradient(0, y0 - 60, 0, y0 + 200); gr2.addColorStop(0, '#ffffff'); gr2.addColorStop(.55, SILVER); gr2.addColorStop(1, SILVER_D); g.fillStyle = gr2;
    glowText(() => { spaced(l1, W / 2, y0, 14); g.font = "700 150px 'Gowun Batang'"; spaced(l2, W / 2, y0 + 170, 30); g.font = "700 112px 'Gowun Batang'"; }, 'rgba(170,140,255,.55)', 36);
    ornament(W / 2, y0 + 290, 260 * (.3 + .7 * a), a); g.restore(); return; }
  g.fillStyle = gr; glowText(() => spaced(c.text, W / 2, 500, 18), 'rgba(170,140,255,.55)', 36);
  ornament(W / 2, 590, 300 * (.3 + .7 * a), a);
  g.restore();
}
// —— place card (top left, RPG location label) ——
function placeCard(t, c) {
  const a = ss(seg(t, c.a, c.a + .6)) * (1 - ss(seg(t, c.b - .6, c.b)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'left'; g.textBaseline = 'middle';
  const x = PORT ? 70 : 120, y = (PORT ? 300 : 130) - (1 - a) * 8;
  const pl = g.createLinearGradient(x - 40, 0, x + 620, 0); pl.addColorStop(0, 'rgba(6,8,18,.75)'); pl.addColorStop(1, 'rgba(6,8,18,0)');
  g.fillStyle = pl; g.fillRect(x - 40, y - 62, 660, 150);
  g.fillStyle = SILVER; g.font = F_LABEL; g.fillText(c.label, x, y - 22);
  g.strokeStyle = 'rgba(220,228,242,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 360, y + 4); g.stroke();
  g.fillStyle = PAPER; g.font = F_CARD; glowText(() => g.fillText(c.text, x, y + 52), 'rgba(170,140,255,.4)', 18);
  g.restore();
}

// —— dialogue box: dark plate, thin silver frame, diamond corners, name plate, typed over 92 % of the voice ——
function wrapKo(text, maxW) { const lines = []; let cur = ''; for (const w of text.split(' ')) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function dlgWindow(v) { const d = DURS[v.id] || 3; return [v.t - .35, Math.min(v.t + d + 1.1, nextStart(v))]; }
function dialog(t, v) {
  const [a0, a1] = dlgWindow(v), a = ss(seg(t, a0, a0 + .35)) * (1 - ss(seg(t, a1 - .35, a1)));
  if (a <= 0) return;
  const bw = PORT ? W - 90 : 1180, bh = PORT ? 250 : 200, x = (W - bw) / 2, y = (PORT ? H * .735 : H - bh - 62) + (1 - a) * 14;
  g.save(); g.globalAlpha = a;
  const bgr = g.createLinearGradient(0, y, 0, y + bh); bgr.addColorStop(0, 'rgba(12,14,30,.88)'); bgr.addColorStop(1, 'rgba(5,6,16,.92)');
  g.fillStyle = bgr; g.fillRect(x, y, bw, bh);
  g.strokeStyle = 'rgba(214,222,238,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.strokeStyle = 'rgba(214,222,238,.3)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, bw - 15, bh - 15);
  for (const [cx, cy] of [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]]) { g.fillStyle = SILVER_L; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
  g.font = F_NAME; const nw = g.measureText(v.who).width + 64;
  g.fillStyle = 'rgba(8,10,22,.96)'; g.fillRect(x + 36, y - 26, nw, 50); g.strokeStyle = 'rgba(214,222,238,.9)'; g.lineWidth = 1.5; g.strokeRect(x + 36.5, y - 25.5, nw - 1, 49);
  g.fillStyle = v.who === '노을' ? '#9fe0d0' : '#e6e9f4'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(v.who, x + 68, y);
  g.font = F_DLG; g.fillStyle = PAPER;
  const d = DURS[v.id] || 3, chars = [...v.sub], n = chars.length, shown = Math.floor(n * clamp((t - v.t + .05) / (d * .92)));
  const lines = wrapKo(v.sub, bw - (PORT ? 120 : 160)); let k = shown;
  lines.forEach((L, i) => { const s = [...L].slice(0, Math.max(0, k)).join(''); k -= [...L].length + 1; g.fillText(s, x + (PORT ? 56 : 72), y + 84 + i * 62); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = SILVER_L; const tx = x + bw - 56, ty = y + bh - 38; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
}

// —— narration subtitles: in 0.35 s before the voice, one line per clip ——
// a line stays until .95 s after its voice, but never into the next line (subtitle or dialogue box: same screen area)
const nextStart = v => { const n = VO.filter(w => w.t > v.t).sort((a, b) => a.t - b.t)[0]; return n ? n.t - .4 : 1e9; };
function subWindow(v) { const d = DURS[v.id] || 3; return [v.t - .35, Math.min(v.t + d + .95, nextStart(v))]; }
function subtitle(t, v) {
  const [a0, a1] = subWindow(v), a = ss(seg(t, a0, a0 + .3)) * (1 - ss(seg(t, a1 - .35, a1)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = F_SUB;
  if (PORT) g.font = "700 52px 'Nanum Myeongjo'";
  const lines = PORT ? wrapKo(v.sub, W - 220) : [v.sub], lh = 70, cx = PORT ? W / 2 - 20 : W / 2;
  const y = PORT ? H * .775 : H - 92, tw = Math.max(...lines.map(L => g.measureText(L).width));
  const top = y - 74, hgt = 114 + (lines.length - 1) * lh;
  const sh = g.createLinearGradient(0, top, 0, top + hgt); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(cx - tw / 2 - (PORT ? 80 : 160), top, tw + (PORT ? 160 : 320), hgt);
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = PAPER; lines.forEach((L, i) => g.fillText(L, cx, y + i * lh));
  g.restore();
}

// —— black between sets, and the film's head and tail ——
const FADES = [[7.5, .45, .55], [15.2, .4, .6], [37.5, .35, .45], [53.0, .2, .5], [61.0, .3, .45], [81.0, .4, .6]];
function blackout(t) {
  let a = 1 - ss(seg(t, .2, 1.4));
  for (const [c, o, i] of FADES) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, T.fadeOut[0], T.fadeOut[1])));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  for (const c of CARDS) (c.kind === 'title' ? titleCard : placeCard)(t, c);
  for (const v of VO) (v.dlg ? dialog : subtitle)(t, v);
  blackout(t);
}

// readcheck: every text on screen at t with its box (full text from its first frame)
export function texts(t) {
  const out = [];
  for (const c of CARDS) { const vis = t >= c.a + .3 && t <= c.b - .3; if (!vis) continue;
    if (c.kind === 'title') out.push(PORT ? { id: 'title', text: c.text, x0: 60, y0: H * .40 - 90, x1: W - 60, y1: H * .40 + 320 } : { id: 'title', text: c.text, x0: 360, y0: 430, x1: 1560, y1: 600 });
    else out.push(PORT ? { id: 'place' + c.a, text: c.label + ' ' + c.text, x0: 40, y0: 230, x1: 720, y1: 400 } : { id: 'place' + c.a, text: c.label + ' ' + c.text, x0: 80, y0: 60, x1: 760, y1: 230 }); }
  for (const v of VO) { const [a0, a1] = v.dlg ? dlgWindow(v) : subWindow(v); if (t < a0 + .3 || t > a1 - .3) continue;
    out.push(PORT ? { id: v.id, text: v.sub, x0: 45, y0: v.dlg ? H * .735 - 30 : H * .775 - 80, x1: W - 45, y1: v.dlg ? H * .735 + 250 : H * .775 + 180, pass: true } : { id: v.id, text: v.sub, x0: v.dlg ? 370 : 160, y0: v.dlg ? 790 : 900, x1: v.dlg ? 1550 : 1760, y1: v.dlg ? 1020 : 1010, pass: true }); }
  return out;
}
