// 막차 — look-dev page (the page contract: window.DUR, window.render(t), window.READY). t picks the frame:
// 0 model sheet · 1 없는 역 (signature) · 2 held bust with light bands · 3 무진's fist · 4 its impact frame
import { canvas, W, H, rgba } from './cel.js';
import { makePost } from './post.js';
import { sheet, platform, bust, impact } from './frames.js';

const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
await document.fonts.load('80px "Black Han Sans"', '막차 모델 시트');
for (const w of [600, 700, 800]) await document.fonts.load(`${w} 50px Pretendard`, '이번 역은 없는 역입니다 끝은 내가 내요 안내 방송 서하 무진 서준 낮 객차 터널');
const RAW = { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 };

// subtitles live on the tape (composited inside the CRT pass): cream-yellow, thick dark outline; a speaker tag box for the PA
function sub(text, o = {}) {
  ov.clearRect(0, 0, W, H); if (!text) return;
  const y = 1500;
  ov.save(); ov.font = '700 54px Pretendard'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = ov.measureText(text).width, tagW = o.tag ? 170 : 0, x = (W - tw - tagW) / 2 + tagW;
  if (o.tag) {
    const tx = x - tagW, ty = y - 26;
    ov.fillStyle = rgba('#07121a', .8); ov.beginPath(); ov.roundRect(tx, ty, 150, 52, 8); ov.fill(); ov.strokeStyle = '#8ff4ff'; ov.lineWidth = 2.5; ov.stroke();
    ov.font = '800 26px Pretendard'; ov.fillStyle = '#8ff4ff'; ov.textAlign = 'center'; ov.fillText(o.tag, tx + 75, y + 1); ov.textAlign = 'left'; ov.font = '700 54px Pretendard';
  }
  ov.shadowColor = 'rgba(0,0,0,.55)'; ov.shadowBlur = 10; ov.shadowOffsetY = 3;
  ov.strokeStyle = '#120a1e'; ov.lineWidth = 10; ov.strokeText(text, x, y);
  ov.shadowColor = 'transparent'; ov.fillStyle = o.col || '#fff0a0'; ov.fillText(text, x, y);
  ov.restore();
}

function render(t) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const k = Math.floor(t + 1e-6), S = { g, e, t, lt: t - k };
  let over = {};
  if (k === 0) { sheet(S); sub(''); over = RAW; }
  else if (k === 1) { platform(S); sub('이번 역은… 없는 역입니다.', { tag: '안내 방송', col: '#bff6ff' }); }
  else if (k === 2) { bust(S); sub('끝은 내가 내요.'); }
  else if (k === 3) { impact(S, false); sub(''); }
  else { impact(S, true); sub(''); over = { bloom: .2, halo: 0 }; }
  post.render(sc, gc, Math.round(t * 24), ovc, over);
}
window.render = render; window.DUR = 5; window.POST = post;
render(1.5);
window.READY = true;
