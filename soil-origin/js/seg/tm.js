/* seg/tm.js — chapter 4 「흙은 얼마나 오래 걸려 만들어지는가?」: 1 cm in a thousand years, the five layers, the Devonian roots. */
window.SEG = window.SEG || {};
window.SEG.tm = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas, rand } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="tm">
      <canvas class="world"></canvas>
      <p class="hero num years"><span class="v">0</span><i>년 · 흙 1 cm</i></p>
      <p class="note n-fao" style="left:1300px;top:230px">유엔 식량농업기구 기준</p>
      <p class="lbl l-life" style="left:1180px;top:560px;font-size:48px">사람의 한평생<i>약 80년</i></p>
      <p class="lbl l-o">낙엽층<i>아직 썩지 않은 잎</i></p>
      <p class="lbl l-a">겉흙<i>부식토가 섞인 검은 층</i></p>
      <p class="lbl l-b">속흙<i>씻겨 내려온 점토와 철분</i></p>
      <p class="lbl l-c">바위 조각<i>아직 다 부서지지 않은</i></p>
      <p class="lbl l-r">기반암<i>모든 흙의 출발점</i></p>
      <p class="lbl l-order" style="left:1280px;top:400px;font-size:64px">생명<i style="font-size:40px">↓</i>바위</p>
      <p class="note n-dev" style="left:160px;top:160px;font-size:76px">4억 1천만 년 전</p>
      <p class="sup s-dev" style="left:160px;top:270px;text-align:left">데본기 초 · 중국 윈난 · 2016년 발견</p>
      <p class="lbl l-m" style="left:1500px;top:560px;font-size:52px">1 m</p>
      <p class="hero w-cm">1 cm<i>1,000년</i></p>
      <p class="hero w-eon">수억 년<i>깊어지기까지</i></p>
      ${H.card(4, '흙은 얼마나 오래 걸려 만들어지는가?', '얼마나 오래')}
    </section>`);
  scene(el, win.a, win.b + 0.3);
  H.cut(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('tm01') + 1.3);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const txt = ['.years', '.n-fao', '.l-life', '.l-o', '.l-a', '.l-b', '.l-c', '.l-r', '.l-order', '.n-dev', '.s-dev', '.l-m', '.w-cm', '.w-eon'].map(Q);
  gsap.set(txt, { autoAlpha: 0 });
  gsap.set(Q('.years'), { left: 1120, top: 300, fontSize: 200, textAlign: 'left' });
  Q('.w-cm').style.cssText += ';left:120px;top:330px;font-size:230px;font-family:var(--font);font-weight:800;letter-spacing:-0.04em;color:#f3ebdf';
  Q('.w-cm').querySelector('i').style.cssText = 'display:block;font-style:normal;font-family:var(--serif);font-weight:700;font-size:70px;color:#ffb84d;margin-top:16px';
  Q('.w-eon').style.cssText += ';left:1100px;top:330px;font-size:200px;color:#d9d3ca';
  Q('.w-eon').querySelector('i').style.cssText = 'display:block;font-style:normal;font-family:var(--font);font-weight:500;font-size:48px;color:#b9a893;margin-top:16px';
  // layer labels sit on the layers (world y → screen at cam z 1)
  const LAY = [['o', 60, 150, mat.soilO.canvas], ['a', 150, 380, mat.soilA.canvas], ['b', 380, 690, mat.soilB.canvas], ['c', 690, 910, mat.soilC.canvas], ['r', 910, 1300, mat.granite.canvas]];
  const labelY = { o: 62, a: 220, b: 480, c: 760, r: 940 };
  for (const [id, y0, y1] of LAY) gsap.set(Q(`.l-${id}`), { left: 160, top: labelY[id] });

  const cam = H.cam(); cam.z = 1; cam.x = 0; cam.y = 0;
  const T = {
    count0: about('tm01', '1센티미터') - 0.3, count1: E('tm01') + 0.4, life: about('tm02', '한평생') - 0.2, wide: S('tm03') + 0.2, sweep: about('tm07', '위에서') - 0.2,
    past0: S('tm08'), dev: S('tm09'), roots0: about('tm09', '뿌리가') - 0.2, rain: about('tm10', '비에') - 0.6, numbers: S('tm11'),
  };
  const years = { v: 0 }; tl.fromTo(years, { v: 0 }, { v: 1000, duration: T.count1 - T.count0, ease: 'power1.inOut', immediateRender: false }, T.count0);
  const yv = Q('.years .v'); let lastY = -1;
  // grains stacking between the two tick marks of 1 cm (as the years count up)
  const gr = rand(401), stack = Array.from({ length: 160 }, (_, i) => ({ x: (gr() - 0.5) * 300, row: Math.floor(i / 16), d: gr(), s: sp.grainA[i % 3], k: 0.9 + gr() * 0.5 }));
  // Devonian roots (tm09): from the thin riverside sediment down 1 m
  const devRoots = WO.roots({ origin: [720, 300], box: [380, 300, 700, 520], n: 420, step: 10, kill: 16, influence: 170, down: 0.9, seed: 41, iters: 260 });
  const devRoots2 = WO.roots({ origin: [900, 300], box: [600, 300, 600, 520], n: 300, step: 10, kill: 16, influence: 170, down: 0.9, seed: 43, iters: 220 });
  // eroding grains (tm10): on the bare right side the sediment washes away
  const er = rand(403), wash = Array.from({ length: 220 }, () => ({ x: 1150 + er() * 700, y: 300 + er() * 60, d: er(), v: 200 + er() * 300, s: sp.grainA[1] }));

  function drawProfile(t, age) {
    // age 0 = today; 1 = the deep past: layers thin to nothing, colour drains
    H.view(g, cam, 1);
    const sky = g.createLinearGradient(0, -400, 0, 60); sky.addColorStop(0, '#2a3346'); sky.addColorStop(1, '#8a8e86'); g.fillStyle = sky; g.fillRect(-100, -500, 2200, 560);
    for (const [id, y0, y1, c] of LAY) {
      let a = y0, b = y1;
      if (age > 0 && id !== 'r') { const h = (y1 - y0) * (1 - age); a = 910 - (910 - y0) * (1 - age); b = a + h; if (h < 1) continue; }
      g.save(); g.beginPath(); g.moveTo(-100, a); for (let x = -100; x <= 2020; x += 30) g.lineTo(x, a + 10 * WO.noise(x / 90, y0, 3)); g.lineTo(2020, b + 20); g.lineTo(-100, b + 20); g.closePath(); g.clip();
      let yy = a; while (yy < b + 20) { const hh = Math.min(c.height, b + 20 - yy); g.drawImage(c, 0, 0, c.width, hh, -60, yy, 2040, hh); yy += hh; }
      g.restore();
    }
    // grass on top
    if (age < 1) for (let i = 0; i < 120; i++) { const r = WO.rand(500 + i)(); const x = -40 + i * 17 + r * 10, top = age > 0 ? 910 - (910 - 60) * (1 - age) : 60; const h = (30 + r * 60) * (1 - age); g.strokeStyle = r < 0.5 ? '#5f7a2e' : '#8aa348'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, top + 4); g.quadraticCurveTo(x + (r - 0.5) * 30, top - h * 0.6, x + (r - 0.5) * 50, top - h); g.stroke(); }
    if (age > 0) { g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${age * 0.9})`; g.fillRect(-100, -500, 2200, 1900); g.globalCompositeOperation = 'source-over'; }
    H.reset(g);
  }
  function drawTicks(t) {
    if (t > T.wide + 0.6) return;
    H.view(g, cam, 1);
    const k = WO.ease.out(WO.clamp((t - S('tm01') - 0.3) / 0.8, 0, 1)), fade = 1 - WO.clamp((t - T.wide) / 0.6, 0, 1);
    g.globalAlpha = k * fade;
    const cx = 760, yTop = 62, h = 140;   // 1 cm at this magnification
    g.strokeStyle = '#f3ebdf'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + 190, yTop); g.lineTo(cx + 260, yTop); g.moveTo(cx + 190, yTop + h); g.lineTo(cx + 260, yTop + h); g.moveTo(cx + 225, yTop); g.lineTo(cx + 225, yTop + h); g.stroke();
    // the grains stack up between the ticks
    const p = WO.clamp((years.v) / 1000, 0, 1);
    for (const s of stack) { const need = (s.row + 1) / 10; if (p < need - 0.1 * s.d) continue; const kk = WO.clamp((p - need + 0.1 * s.d) / 0.05, 0, 1); const y = yTop + h - 14 - s.row * 14 - 20 * (1 - kk); g.save(); g.translate(cx + s.x, y); g.scale(s.k, s.k); g.globalAlpha = k * fade * kk; g.drawImage(s.s, -10, -10, 20, 20); g.restore(); }
    // a human lifetime: an 80-year sliver of the centimetre
    if (t > T.life) { const q = WO.ease.out((t - T.life) / 0.7); g.globalAlpha = k * fade * q; g.fillStyle = '#ffb84d'; g.fillRect(cx + 200, yTop + h - h * 0.08 * q, 50, h * 0.08 * q); g.strokeStyle = '#ffb84d'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 250, yTop + h - 6); g.lineTo(cx + 420, yTop + h + 40); g.stroke(); }
    g.globalAlpha = 1; H.reset(g);
  }
  function drawFocus(t) {
    // tm04–tm06: the band being spoken is lit, the rest sinks; tm07: a sweep from top to bottom
    const focus = t < S('tm04') ? null : t < about('tm04', '그 아래에') ? 'o' : t < S('tm05') ? 'a' : t < S('tm06') ? 'b' : t < about('tm06', '맨 밑에는') ? 'c' : t < S('tm07') ? 'r' : null;
    H.view(g, cam, 1);
    if (focus) { g.fillStyle = 'rgba(0,0,0,0.42)'; for (const [id, y0, y1] of LAY) { if (id === focus) continue; g.fillRect(-100, y0 + 6, 2200, y1 - y0); } }
    if (t > T.sweep && t < E('tm07')) { const u = (t - T.sweep) / (E('tm07') - T.sweep); const y = 40 + 1000 * u; const grd = g.createLinearGradient(0, y - 120, 0, y + 40); grd.addColorStop(0, 'rgba(255,230,180,0)'); grd.addColorStop(0.8, 'rgba(255,230,180,0.28)'); grd.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = grd; g.fillRect(-100, y - 120, 2200, 160); }
    H.reset(g);
  }
  function drawDevonian(t) {
    if (t < T.dev) return;
    H.view(g, cam, 1);
    const k = WO.ease.out(WO.clamp((t - T.dev) / 1, 0, 1));
    // a thin band of riverside sediment on grey rock; a river at the left edge
    g.globalAlpha = k;
    g.fillStyle = '#7d7a72'; g.fillRect(-100, 300, 2200, 900);
    g.drawImage(mat.granite.canvas, 0, 0, mat.granite.w, mat.granite.h, -60, 320, 2040, 1148);
    g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,0.8)'; g.fillRect(-100, 300, 2200, 900); g.globalCompositeOperation = 'source-over';
    // sediment: left (rooted) stays; right (bare) washes away during tm10
    const erode = t < T.rain ? 0 : WO.clamp((t - T.rain) / 3.5, 0, 1);
    const sed = (x) => (x < 1100 ? 70 : 70 * (1 - erode * WO.clamp((x - 1100) / 300, 0, 1)));
    g.save(); g.beginPath(); g.moveTo(-100, 330); for (let x = -100; x <= 2020; x += 20) g.lineTo(x, 300 - sed(x) + 60 + 6 * WO.noise(x / 50, 1, 4)); g.lineTo(2020, 330); g.closePath(); g.clip();
    g.drawImage(mat.soilC.canvas, 0, 0, mat.soilC.w, mat.soilC.h, -60, 240, 2040, 200); g.restore();
    // water on the left: a river edge
    { const wg = g.createLinearGradient(0, 296, 0, 1200); wg.addColorStop(0, 'rgba(120,160,185,0.85)'); wg.addColorStop(0.3, 'rgba(60,95,125,0.85)'); wg.addColorStop(1, 'rgba(20,35,55,0.95)'); g.fillStyle = wg;
      g.beginPath(); g.moveTo(-100, 296); for (let x = -100; x <= 300; x += 10) g.lineTo(x, 296 + 3 * Math.sin(x / 30 + t * 2)); g.quadraticCurveTo(330, 700, 240, 1200); g.lineTo(-100, 1200); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(220,235,245,0.35)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { const y = 330 + i * 70 + 10 * Math.sin(t * 1.3 + i); g.beginPath(); g.moveTo(-60 + 20 * Math.sin(t + i), y); g.lineTo(60 + 80 * ((i * 7) % 3) / 3 + 20 * Math.sin(t * 0.8 + i), y + 2); g.stroke(); } }
    // roots, 1 m deep, and the scale bar
    if (t > T.roots0) { const G = WO.ease.out((t - T.roots0) / (E('tm09') - T.roots0 + 0.5)); WO.drawRoots(g, devRoots, G, { color: '#c9b58f', tip: '#e9f2c0', base: 1.2, k: 0.7 }); WO.drawRoots(g, devRoots2, G, { color: '#bfa985', tip: '#e9f2c0', base: 1, k: 0.6 }); }
    if (t > about('tm09', '1미터')) { const q = WO.ease.out((t - about('tm09', '1미터')) / 0.7); g.strokeStyle = `rgba(243,235,223,${q})`; g.lineWidth = 3; g.beginPath(); g.moveTo(1460, 300); g.lineTo(1460, 300 + 520 * q); g.moveTo(1440, 300); g.lineTo(1480, 300); g.moveTo(1440, 300 + 520 * q); g.lineTo(1480, 300 + 520 * q); g.stroke(); }
    // the rain (tm10) and the washed grains on the bare side
    if (t > T.rain) { const kk = WO.clamp((t - T.rain) / 0.6, 0, 1) * (1 - WO.clamp((t - E('tm10')) / 0.5, 0, 1)); g.strokeStyle = `rgba(190,225,255,${0.4 * kk})`; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 140; i++) { const r = WO.rand(600 + i)(); const x = -100 + i * 15 + r * 10, y = ((t * (1400 + r * 600) + r * 2000) % 1500) - 300; g.moveTo(x, y); g.lineTo(x - 5, y + 70); } g.stroke();
      for (const w of wash) { const u = ((t - T.rain) * 0.3 + w.d) % 1; const x = w.x + 500 * u, y = w.y + 40 + 700 * u * u; g.globalAlpha = k * (1 - u) * erode; g.drawImage(w.s, x, y, 14, 14); } g.globalAlpha = k; }
    g.globalAlpha = 1; H.reset(g);
  }

  // ---- camera ----
  tl.fromTo(cam, { z: 2.3, x: -180, y: -380 }, { z: 2.3, x: -180, y: -380, duration: 0.01, immediateRender: false }, win.a);   // CU on the surface ticks
  tl.fromTo(cam, { z: 2.3, x: -180, y: -380 }, { z: 1.0, x: 0, y: 0, duration: 1.8, ease: 'power3.inOut', immediateRender: false }, S('tm03') + 0.2);   // pull out: the whole cut

  // ---- type ----
  H.inn(Q('.years'), T.count0 - 0.1, { y: 30 }, 0.7); H.inn(Q('.n-fao'), about('tm01', '유엔') - 0.1, { x: 20 }, 0.6);
  H.inn(Q('.l-life'), T.life, { x: -30 }, 0.7);
  [Q('.years'), Q('.n-fao'), Q('.l-life')].forEach((e) => H.out(e, T.wide, { y: -30 }, 0.45));
  const lbl = [['o', about('tm04', '낙엽이')], ['a', about('tm04', '겉흙이')], ['b', about('tm05', '속흙이')], ['c', about('tm06', '바위 조각')], ['r', about('tm06', '기반암')]];
  for (const [id, tt] of lbl) H.inn(Q(`.l-${id}`), tt - 0.3, { x: -40 }, 0.8);
  H.inn(Q('.l-order'), about('tm07', '생명에서') - 0.2, { y: 30 }, 0.7);
  for (const [id] of lbl) H.out(Q(`.l-${id}`), T.past0 - 0.2, { x: -30 }, 0.45);
  H.out(Q('.l-order'), T.past0 - 0.2, { y: -20 }, 0.45);
  H.inn(Q('.n-dev'), about('tm09', '4억') - 0.2, { x: 30, scale: 1.1 }, 0.8); H.inn(Q('.s-dev'), about('tm09', '데본기') - 0.2, { x: 20 }, 0.6);
  H.inn(Q('.l-m'), about('tm09', '1미터') - 0.1, { x: -20 }, 0.6);
  [Q('.n-dev'), Q('.s-dev'), Q('.l-m')].forEach((e) => H.out(e, T.numbers - 0.3, { y: -30 }, 0.45));
  H.inn(Q('.w-cm'), about('tm11', '천 년에') - 0.2, { y: 50 }, 0.8); H.inn(Q('.w-eon'), about('tm11', '수억 년') - 0.2, { y: 50 }, 0.8);
  const eon = TX.split(Q('.w-eon'), { by: 'chars' }); TX.breathe(eon, about('tm11', '수억 년') + 0.5, E('tm11'), { min: 600, max: 760, rest: 700, speed: 0.8 });

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 0.4) return;
    g.clearRect(0, 0, 1920, 1080);
    const age = t < T.past0 ? 0 : t < T.dev ? WO.ease.inout((t - T.past0) / (T.dev - T.past0)) * 0.9 : 0.9;
    const devK = t < T.dev ? 0 : WO.ease.out(WO.clamp((t - T.dev) / 1, 0, 1));
    const back = t < T.numbers ? 0 : WO.ease.inout((t - T.numbers) / 1.2);
    if (devK < 1 || back > 0) { drawProfile(t, back > 0 ? 0.9 * (1 - back) : age); }
    drawTicks(t);
    drawFocus(t);
    if (back < 1) { g.globalAlpha = 1 - back; drawDevonian(t); g.globalAlpha = 1; }
    if (t > T.numbers) { H.reset(g); g.fillStyle = `rgba(10,7,4,${0.5 * back})`; g.fillRect(0, 0, 1920, 1080); }
    if (yv) { const n = Math.round(years.v); if (n !== lastY) { lastY = n; yv.textContent = n.toLocaleString('ko-KR'); } }
    H.reset(g);
  });
};
