// text cut in behind the needle (from the library scratch-film demo shots.js: txtImg, cutText, tipSpark)
const TXT = {};
function txtImg(str, font, px, col = CREAM, o = {}){
  const key = [str, font, px, col, o.hatch ? 1 : 0].join('|'); if (TXT[key]) return TXT[key];
  const gl = (window.GLYPHS = window.GLYPHS || {}); gl[font.f] = gl[font.f] || ''; for (const ch of str) if (!gl[font.f].includes(ch)) gl[font.f] += ch; (window.STRS = window.STRS || {})[str] = font.f;   // which characters each font really draws (checked against the subsets)
  const c0 = mk(10, 10).getContext('2d'); c0.font = `${font.w || ''} ${px}px ${font.f}`;
  const tw = Math.ceil(c0.measureText(str).width) + 24, th = Math.ceil(px * 1.4);
  const c = mk(tw, th), g = c.getContext('2d');
  g.font = c0.font; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.fillText(str, 12, px * 1.08);
  const q = rng(str.length * 31 + px);
  g.globalCompositeOperation = 'destination-out';           // the needle skipped: thin gaps through the cut
  for (let i = 0; i < (o.hatch ? 0 : 14); i++){ g.globalAlpha = .25 + q() * .35; g.lineWidth = .6 + q() * 1.2; const y = q() * th; g.beginPath(); g.moveTo(0, y); g.lineTo(tw, y + (q() - .5) * 18); g.stroke(); }
  if (o.hatch){                                             // heavy title: the letters are filled by diagonal cuts
    g.globalAlpha = 1;
    for (let x = -th; x < tw + th; x += 7 + q() * 3){ g.lineWidth = 2 + q() * 1.6; g.beginPath(); g.moveTo(x, th + 4); g.lineTo(x + th * .55, -4); g.stroke(); }
  }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  return (TXT[key] = c);
}
const MONO = { f: 'MONO' }, MARK = { f: 'MARK' }, JOST = { f: 'JOST', w: 600 }, JOSTB = { f: 'JOST', w: 800 };
// draw a text image cut in from the left (prog 0..1); returns its screen box
function cutText(img, x, y, prog, dn, o = {}){
  if (prog <= 0) return null;
  const sc = o.sc ?? 1, w = img.width * sc, h = img.height * sc;
  const jx = (h1(dn * 1.3 + x) - .5) * .8, jy = (h1(dn * 2.1 + y) - .5) * .8;   // a small boil only: text must stay readable
  G.save(); G.globalAlpha = o.a ?? 1;
  G.beginPath(); G.rect(x - 4, y - 4, (w + 8) * clamp(prog, 0, 1), h + 8); G.clip();
  G.drawImage(img, x + jx, y + jy, w, h); G.restore();
  if (prog < 1 && o.tip !== false) tipSpark(x + w * prog, y + h * .62, dn, o.tipR ?? 40);
  return { x0: x, y0: y + h * .12, x1: x + w, y1: y + h * .95 };
}
// the hot point of a fresh cut: glow and chips thrown off (no tool shown, only the cut)
function tipSpark(x, y, dn, r = 50){
  glow(x, y, r * 2.2, 'rgba(255,240,200,1)', .8);
  disc(x, y, r * .12, '#ffffff', .95);
  const q = rng(dn * 13 + 5);
  for (let i = 0; i < 12; i++){ const a = -Math.PI * q() - .2, d = r * (.3 + q() * 1.6), s = 2 + q() * r * .12; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .8; G.globalAlpha = .85; G.fillStyle = q() < .7 ? CREAM : '#3a2a1c'; G.beginPath(); G.moveTo(px, py); G.lineTo(px + s, py + s * .3); G.lineTo(px + s * .2, py + s); G.closePath(); G.fill(); }
  G.globalAlpha = 1;
}
