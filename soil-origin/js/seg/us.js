/* seg/us.js — chapter 5 「그래서 흙은 왜 중요한가?」: the field at sunset, the rain that strips it, back to our feet, the moon. */
window.SEG = window.SEG || {};
window.SEG.us = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas, rand } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="us">
      <canvas class="world"></canvas>
      <p class="hero mat num pct">95<span style="font-size:0.55em">%</span><i>우리가 먹는 음식 · 흙에서</i></p>
      <p class="note n-fao" style="left:1340px;top:200px">유엔 식량농업기구</p>
      <p class="hero num tons">240<span style="font-size:0.5em">억 톤</span><i>해마다 사라지는 기름진 흙</i></p>
      <p class="note n-un" style="left:1300px;top:200px">유엔 사막화방지협약 2017년 보고서</p>
      <p class="lbl l-make" style="left:260px;top:140px;font-size:64px;text-align:center;width:600px">생기는 속도<i>1 cm에 1,000년</i></p>
      <p class="lbl l-lose" style="left:1060px;top:140px;font-size:64px;text-align:center;width:600px">사라지는 속도<i>같은 1 cm가</i></p>
      <h1 class="hero mat w-nonre">재생되지 않는 자원</h1>
      <h1 class="hero mat w-last">발밑에 천 년</h1>
      ${H.card(5, '그래서 흙은 왜 중요한가?', '왜 중요한가')}
    </section>`);
  scene(el, win.a, null);
  H.cut(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('us01') + 1.3);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const txt = ['.pct', '.n-fao', '.tons', '.n-un', '.l-make', '.l-lose', '.w-nonre', '.w-last'].map(Q);
  gsap.set(txt, { autoAlpha: 0 });
  Q('.pct').style.backgroundImage = H.tex.soil; Q('.pct').querySelector('i').style.cssText = '-webkit-text-fill-color:#b9a893';
  Q('.tons').style.color = '#e8d7c2';
  gsap.set(Q('.w-nonre'), { left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 150 }); Q('.w-nonre').style.backgroundImage = H.tex.soil; Q('.w-nonre').style.webkitTextStroke = '2px rgba(255,200,120,0.8)';
  Q('.w-last').style.backgroundImage = H.tex.soil; Q('.w-last').style.webkitTextStroke = '2px rgba(255,200,120,0.85)'; gsap.set(Q('.w-last'), { left: 0, right: 0, top: 120, textAlign: 'center', fontSize: 170 });

  const cam = H.cam(); cam.z = 1; cam.x = 0; cam.y = 0;
  const SURF = 560;
  const LAY = [[SURF, SURF + 70, mat.soilO.canvas], [SURF + 70, SURF + 300, mat.soilA.canvas], [SURF + 300, SURF + 620, mat.soilB.canvas], [SURF + 620, SURF + 900, mat.soilC.canvas]];
  const T = {
    crops: S('us01') + 0.2, pct: about('us01', '95퍼센트') - 0.2, rain: about('us02', '해마다') - 0.8, tons: about('us02', '240억') - 0.2, gauges: S('us03'),
    hole: S('us04'), nonre: about('us04', '재생되지') - 0.2, feet: S('us05'), replay: about('us06', '바위가') - 0.2, moon: about('us07', '달에는') - 0.3, drop: about('us08', '흙을 밟을') - 0.3, last: about('us08', '천 년이') - 0.2,
  };
  // crops: a row of plants with roots growing into the topsoil, fruits that appear
  const cr = rand(501);
  const plants = []; [[0.62, SURF - 150, 150, 0.5], [0.8, SURF - 70, 110, 0.75], [1.0, SURF, 230, 1.0]].forEach(([sc, base, step, al], row) => { for (let i = 0; i < Math.ceil(2000 / step); i++) plants.push({ x: -40 + i * step + (cr() - 0.5) * step * 0.6, base, sc: sc * (0.85 + cr() * 0.3), al, row, h: 150 + cr() * 90, d: cr(), lean: (cr() - 0.5) * 0.5, fruit: cr() < 0.65, ph: cr() * 6.28 }); });
  const rootsOf = plants.map((p, i) => p.row === 2 ? WO.roots({ origin: [p.x, SURF + 4], box: [p.x - 110, SURF, 220, 260], n: 90, step: 8, kill: 14, influence: 120, down: 0.8, seed: 50 + i, iters: 110 }) : null);
  // the topsoil that the rain strips: the A layer's top descends while grains stream off to the right
  const wr = rand(503), wash = Array.from({ length: 260 }, () => ({ x: wr() * 1920, y: SURF + 20 + wr() * 40, d: wr(), v: 240 + wr() * 320, s: sp.grainA[1] }));
  // the pinch of soil released at the end
  const pr = rand(505), pinch = Array.from({ length: 70 }, () => ({ dx: (pr() - 0.5) * 50, dy: (pr() - 0.5) * 30, d: pr(), vx: (pr() - 0.5) * 120, s: sp.grainA[Math.floor(pr() * 3)], k: 0.7 + pr() * 0.6 }));
  const sole = WO.canvas(420, 760); { const s = WO.ctx(sole); s.filter = 'blur(18px)'; s.fillStyle = 'rgba(6,3,1,0.78)'; s.beginPath(); s.ellipse(210, 240, 165, 220, 0, 0, Math.PI * 2); s.fill(); s.beginPath(); s.ellipse(210, 580, 130, 150, 0, 0, Math.PI * 2); s.fill(); s.fillRect(90, 240, 240, 580 - 240); s.filter = 'none'; }
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: WO.rand(i + 30)() * 1920, y: WO.rand(i + 60)() * 420, r: 0.6 + WO.rand(i + 9)() * 1.3 }));

  function skyColour(night) { // sunset → night
    const top = WO.mix(WO.mix([38, 30, 60], [255, 150, 70], 0.0), [6, 7, 14], night), hz = WO.mix([255, 170, 90], [26, 30, 48], night);
    const grd = g.createLinearGradient(0, -500, 0, SURF); grd.addColorStop(0, WO.rgb(top)); grd.addColorStop(1, WO.rgb(hz)); return grd;
  }
  function drawField(t) {
    H.view(g, cam, 1);
    const night = t < T.feet ? 0 : WO.ease.inout((t - T.feet) / 4);
    g.fillStyle = skyColour(night); g.fillRect(-100, -600, 2200, SURF + 600);
    if (night > 0) { g.globalAlpha = night; g.fillStyle = '#e6e9f0'; for (const s of stars) g.fillRect(s.x, s.y - 100, s.r, s.r); g.globalAlpha = 1; }
    // the sun low on the left (before night)
    if (night < 1) { const grd = g.createRadialGradient(260, SURF - 60, 10, 260, SURF - 60, 420); grd.addColorStop(0, `rgba(255,220,160,${0.9 * (1 - night)})`); grd.addColorStop(0.2, `rgba(255,170,90,${0.5 * (1 - night)})`); grd.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = grd; g.fillRect(-300, SURF - 600, 1200, 600); }
    // the moon rises (us07)
    if (t > T.moon) { const k = WO.ease.out((t - T.moon) / 2.5); const mx = 1480, my = 230 - 60 * k; g.save(); g.beginPath(); g.arc(mx, my, 110, 0, 6.283); g.clip(); g.drawImage(mat.regolith.canvas, 0, 0, mat.regolith.w, mat.regolith.h, mx - 110, my - 110, 220, 220); g.restore(); const sh = g.createRadialGradient(mx - 30, my - 30, 40, mx, my, 115); sh.addColorStop(0, 'rgba(255,255,255,0.15)'); sh.addColorStop(1, 'rgba(0,0,0,0.75)'); g.fillStyle = sh; g.beginPath(); g.arc(mx, my, 110, 0, 6.283); g.fill(); const halo = g.createRadialGradient(mx, my, 100, mx, my, 260); halo.addColorStop(0, `rgba(200,210,230,${0.25 * k})`); halo.addColorStop(1, 'rgba(200,210,230,0)'); g.fillStyle = halo; g.fillRect(mx - 260, my - 260, 520, 520); }
    // erosion: the topsoil surface drops on the field between us02 and us04
    const erode = t < T.rain ? 0 : WO.clamp((t - T.rain) / (T.hole - T.rain), 0, 1);
    const holeK = t < T.hole ? 0 : 1;
    const topAt = (x) => { const inField = x > 300 && x < 1600 ? WO.clamp(Math.min(x - 300, 1600 - x) / 200, 0, 1) : 0; return SURF + (erode * 60 + holeK * 0) * inField * (0.7 + 0.3 * WO.noise(x / 120, 2, 11)); };
    for (const [y0, y1, c] of LAY) {
      g.save(); g.beginPath(); g.moveTo(-100, y0 === SURF ? topAt(-100) : y0); for (let x = -100; x <= 2020; x += 24) g.lineTo(x, (y0 === SURF ? topAt(x) : y0 + 8 * WO.noise(x / 90, y0, 3))); g.lineTo(2020, y1 + 20); g.lineTo(-100, y1 + 20); g.closePath(); g.clip();
      let yy = y0 - 80; while (yy < y1 + 20) { const hh = Math.min(c.height, y1 + 20 - yy); g.drawImage(c, 0, 0, c.width, hh, -60, yy, 2040, hh); yy += hh; } g.restore();
    }
    // the plants (us01) — stems, leaves, fruit; roots in the topsoil
    const fadePlants = t < T.rain ? 1 : 1 - 0.6 * erode;
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i]; const k = WO.ease.out(WO.clamp((t - T.crops - p.d * 1.2 - p.row * 0.2) / 1.6, 0, 1)); if (k <= 0) continue;
      g.globalAlpha = fadePlants * p.al;
      if (rootsOf[i]) WO.drawRoots(g, rootsOf[i], k, { color: '#e2cfa8', tip: '#dff0a8', base: 1, k: 0.5 });
      const top = p.row === 2 ? topAt(p.x) : p.base, sc = p.sc, H2 = p.h * k * sc;
      // a long shadow on the ground from the low sun on the left
      if (p.row === 2) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(p.x + 90, top + 4, 110 * k, 7, 0, 0, 6.283); g.fill(); }
      g.strokeStyle = p.row === 2 ? '#4f7a2a' : '#3e6222'; g.lineWidth = 7 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, top + 2); g.quadraticCurveTo(p.x + p.lean * 60 * sc, top - H2 * 0.5, p.x + p.lean * 120 * sc + 10 * Math.sin(t * 0.9 + p.ph), top - H2); g.stroke();
      for (let j = 1; j <= 4; j++) { const q = j / 5; const y = top - H2 * q, x = p.x + p.lean * 120 * sc * q; const dir = j % 2 ? 1 : -1; const lit = dir < 0 ? 1 : 0.7; g.fillStyle = `rgba(${Math.round(110 * lit)},${Math.round(160 * lit)},${Math.round(58 * lit)},1)`; g.beginPath(); g.ellipse(x + dir * 34 * k * sc, y, 38 * k * sc, 13 * k * sc, dir * 0.4 + 0.05 * Math.sin(t + j), 0, 6.283); g.fill(); }
      if (p.fruit && t > about('us01', '음식의')) { const q = WO.ease.out((t - about('us01', '음식의') - p.d * 0.5) / 0.8); if (q > 0) { const y = top - H2 * 0.62, x = p.x + p.lean * 120 * sc * 0.62; const grd = g.createRadialGradient(x - 8 * sc, y - 8 * sc, 3, x, y, 24 * q * sc); grd.addColorStop(0, '#ffd27a'); grd.addColorStop(0.6, '#e2652e'); grd.addColorStop(1, '#7a2a12'); g.fillStyle = grd; g.beginPath(); g.arc(x, y, 24 * q * sc, 0, 6.283); g.fill(); } }
      g.globalAlpha = 1;
    }
    // the rain (us02) and the grains streaming off the field
    if (t > T.rain && t < T.hole + 0.5) { const kk = WO.clamp((t - T.rain) / 0.6, 0, 1) * (1 - WO.clamp((t - T.hole) / 0.5, 0, 1)); g.strokeStyle = `rgba(190,225,255,${0.45 * kk})`; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 170; i++) { const r = WO.rand(700 + i)(); const x = -100 + i * 13 + r * 10, y = ((t * (1500 + r * 700) + r * 2000) % 1600) - 400; g.moveTo(x, y); g.lineTo(x - 6, y + 80); } g.stroke();
      for (const w of wash) { const u = ((t - T.rain) * 0.28 + w.d) % 1; const x = w.x + 700 * u, y = topAt(w.x) + 10 + 90 * u * u; if (x > 2000) continue; g.globalAlpha = kk * (1 - u); g.drawImage(w.s, x, y, 13, 13); } g.globalAlpha = 1; }
    H.reset(g);
  }
  // us03: the same 1 cm ticks as in the time chapter, twice: on the left the grains settle a few in the whole beat;
  // on the right the same centimetre pours out in one rain. The same measure, two speeds.
  const tg = rand(507), tick = Array.from({ length: 160 }, (_, i) => ({ x: (tg() - 0.5) * 300, row: Math.floor(i / 16), d: tg(), s: sp.grainA[i % 3], k: 0.9 + tg() * 0.5 }));
  function drawGauges(t) {
    if (t < T.gauges || t > T.nonre + 0.5) return;
    const k = WO.ease.out(WO.clamp((t - T.gauges) / 0.8, 0, 1)), out = 1 - WO.clamp((t - T.nonre) / 0.5, 0, 1);
    H.reset(g); g.globalAlpha = k * out;
    g.fillStyle = 'rgba(8,5,3,0.6)'; g.fillRect(0, 0, 1920, 1080);
    const u = WO.clamp((t - T.gauges - 0.5) / 6, 0, 1), loss = WO.ease.out(WO.clamp((t - about('us03', '사라지고') + 0.4) / 1.6, 0, 1));
    const col = (cx, fill, falling) => {
      const yTop = 330, h = 420;   // 1 cm at this magnification
      // the ground this centimetre sits on
      g.save(); g.beginPath(); g.rect(cx - 260, yTop + h, 520, 400); g.clip(); g.drawImage(mat.soilB.canvas, 0, 0, 600, 400, cx - 260, yTop + h - 10, 520, 410); g.restore();
      g.strokeStyle = '#f3ebdf'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 200, yTop); g.lineTo(cx + 280, yTop); g.moveTo(cx + 200, yTop + h); g.lineTo(cx + 280, yTop + h); g.moveTo(cx + 240, yTop); g.lineTo(cx + 240, yTop + h); g.stroke();
      for (const s2 of tick) { const need = (s2.row + 1) / 10; let kk; let dy = 0;
        if (!falling) { if (fill < need - 0.1 * s2.d) continue; kk = WO.clamp((fill - need + 0.1 * s2.d) / 0.05, 0, 1); }
        else { kk = 1; const gone = WO.clamp((loss - (1 - need) * 0.6 - s2.d * 0.3) * 3, 0, 1); if (gone >= 1) continue; dy = 700 * gone * gone; g.globalAlpha = k * out * (1 - gone); }
        const y = yTop + h - 20 - s2.row * 40 - 30 * (1 - kk) + dy; g.save(); g.translate(cx + s2.x, y); g.scale(s2.k * 1.9, s2.k * 1.9); g.globalAlpha *= kk; g.drawImage(s2.s, -10, -10, 20, 20); g.restore(); g.globalAlpha = k * out; }
    };
    col(560, 0.3 + 0.05 * u, false);
    col(1360, 1, true);
    // rain over the right one only
    if (loss < 1) { g.strokeStyle = 'rgba(190,225,255,0.5)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 60; i++) { const r = WO.rand(1030 + i)(); const x = 1080 + i * 10 + r * 8, y = ((t * (1500 + r * 700) + r * 2000) % 900) - 200; g.moveTo(x, y); g.lineTo(x - 5, y + 70); } g.stroke(); }
    g.globalAlpha = 1;
  }
  // us05–us08: our feet again, the layers replayed under them, the pinch released
  function drawFeet(t) {
    if (t < T.feet) return;
    H.view(g, cam, 1);
    const k = WO.ease.out(WO.clamp((t - T.feet - 0.3) / 1.4, 0, 1));
    WO.shoe(g, 1300, SURF - 2 - 40 * (1 - k), 1.15, k);
    // replay (us06): the layers light up from the bottom (rock) to the top (humus) as the line sums it up
    if (t > T.replay && t < T.moon + 1) { const u = WO.clamp((t - T.replay) / (E('us06') - T.replay), 0, 1); const fade = 1 - WO.clamp((t - T.moon) / 1, 0, 1); const yl = SURF + 900 - 960 * u; const grd = g.createLinearGradient(0, yl - 60, 0, yl + 60); grd.addColorStop(0, 'rgba(255,200,120,0)'); grd.addColorStop(0.5, `rgba(255,200,120,${0.35 * fade})`); grd.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = grd; g.fillRect(-100, yl - 60, 2200, 120); }
    // the pinch released (us08): the fingertips open and the grains fall onto the surface
    if (t > T.drop - 1.2) { const kf = WO.ease.out(WO.clamp((t - T.drop + 1.2) / 0.9, 0, 1)); H.fingers(g, 760, SURF - 300 + 120 * (1 - kf), 0.62, t < T.drop ? 0 : WO.ease.out(WO.clamp((t - T.drop) / 0.6, 0, 1)), kf); }
    if (t > T.drop) { for (const p of pinch) { const u = t - T.drop - p.d * 0.5; if (u < 0) continue; const y = Math.min(SURF - 290 + p.dy + 1200 * u * u, SURF - 6 - Math.abs(p.dy) * 0.3); const x = 760 + p.dx + p.vx * Math.min(u, 0.6); g.save(); g.translate(x, y); g.scale(p.k, p.k); g.drawImage(p.s, -10, -10, 20, 20); g.restore(); } }
    H.reset(g);
  }

  // ---- camera ----
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.0, duration: 0.01, immediateRender: false }, win.a);
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.5, x: 200, y: -120, duration: 2.2, ease: 'power3.inOut', immediateRender: false }, T.feet - 0.3);   // back to the shoe: the first shot's framing
  tl.fromTo(cam, { z: 1.5, x: 200, y: -120 }, { z: 1.0, x: 0, y: 80, duration: 2.0, ease: 'power3.inOut', immediateRender: false }, T.replay - 0.2);     // the cut under our feet
  tl.fromTo(cam, { z: 1.0, x: 0, y: 80 }, { z: 1.25, x: -120, y: -150, duration: 2.2, ease: 'power3.inOut', immediateRender: false }, T.drop - 1.4);  // CU: the pinch let go

  // ---- type ----
  gsap.set(Q('.pct'), { left: 0, right: 0, top: 20, textAlign: 'center', fontSize: 280 });
  H.inn(Q('.pct'), T.pct, { scale: 1.2 }, 0.8, 'power4.out'); H.inn(Q('.n-fao'), S('us01') + 0.2, { x: 20 }, 0.6);
  H.out(Q('.pct'), S('us02') - 0.2, { y: -40 }, 0.45); H.out(Q('.n-fao'), S('us02') - 0.2, { y: -20 }, 0.4);
  gsap.set(Q('.tons'), { left: 0, right: 0, top: 40, textAlign: 'center' });
  H.inn(Q('.tons'), T.tons, { scale: 1.15 }, 0.8, 'power4.out'); H.inn(Q('.n-un'), about('us02', '유엔') - 0.1, { x: 20 }, 0.6);
  H.out(Q('.tons'), S('us03') - 0.2, { y: -40 }, 0.45); H.out(Q('.n-un'), S('us03') - 0.2, { y: -20 }, 0.4);
  H.inn(Q('.l-make'), T.gauges + 0.3, { y: 24 }, 0.7); H.inn(Q('.l-lose'), about('us03', '사라지고') - 0.4, { y: 24 }, 0.7);
  H.out(Q('.l-make'), T.nonre - 0.2, { y: -20 }, 0.4); H.out(Q('.l-lose'), T.nonre - 0.2, { y: -20 }, 0.4);
  H.inn(Q('.w-nonre'), T.nonre, { y: 50 }, 0.9); H.out(Q('.w-nonre'), T.feet - 0.2, { y: -40 }, 0.5);
  const nr = TX.split(Q('.w-nonre'), { by: 'chars' }); TX.tremble(nr, about('us04', '돌아오지') - 0.1, E('us04'), { amp: 1.6, rate: 7 });
  H.inn(Q('.w-last'), T.last, { y: 40 }, 1.1, 'power3.out');

  onFrame((t) => {
    if (t < win.a - 0.1) return;
    g.clearRect(0, 0, 1920, 1080);
    drawField(t);
    drawGauges(t);
    drawFeet(t);
    H.keyLight(g, 0.6, 300, 420);
  });
};
