/* seg/lf.js — chapter 3 「생명은 어떻게 흙이 되는가?」: the surface boundary — lichen, leaves, decomposers, humus, a pinch of soil, the worm. */
window.SEG = window.SEG || {};
window.SEG.lf = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas, rand } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="lf">
      <canvas class="world"></canvas>
      <h1 class="hero word w-lichen" style="color:#d9c48a">지의류</h1>
      <p class="sup s-lichen" style="left:0;right:0;top:300px;text-align:center">균류 + 조류가 한 몸처럼 사는 생물</p>
      <h1 class="hero mat word w-humus">부식토</h1>
      <p class="sup s-humus" style="left:0;right:0;top:380px;text-align:center">양분 · 물 · 알갱이를 붙이는 풀</p>
      <p class="hero num gram" style="left:140px;top:130px;text-align:left;font-size:240px">1<i>g · 손가락 끝 한 꼬집</i></p>
      <p class="lbl l-city" style="left:1120px;top:180px;text-align:left;font-size:64px">수백만 마리<i style="font-size:40px">수천 종의 세균</i></p>
      <p class="sup s-fao" style="left:1120px;top:330px;text-align:left">유엔 식량농업기구(FAO)</p>
      <p class="lbl l-city2" style="left:0;right:0;top:160px;text-align:center;font-size:64px">큰 도시 하나의 사람 수보다 많다</p>
      <p class="note n-darwin" style="left:1180px;top:200px;font-size:120px;transform:rotate(-5deg)">1881</p>
      <p class="sup s-darwin" style="left:1180px;top:340px;text-align:left">찰스 다윈 · 지렁이에 관한 책</p>
      <p class="hero two-mat"><span class="mat g1">알갱이</span><span class="plus">+</span><span class="mat g2">부식토</span></p>
      <p class="lbl l-45" style="font-size:76px"><span class="num">45</span>% <i>광물 알갱이</i></p>
      <p class="lbl l-5" style="font-size:76px"><span class="num">5</span>% <i>유기물</i></p>
      <p class="lbl l-50" style="font-size:76px"><span class="num">50</span>% <i>틈 · 물과 공기</i></p>
      <p class="note n-avg" style="left:1320px;top:880px">평균값 · 미국 농무부</p>
      ${H.card(3, '생명은 어떻게 흙이 되는가?', '생명')}
    </section>`);
  scene(el, win.a, win.b + 0.3);
  H.cut(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('lf01') + 1.3);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const txt = ['.w-lichen', '.s-lichen', '.w-humus', '.s-humus', '.gram', '.l-city', '.s-fao', '.l-city2', '.n-darwin', '.s-darwin', '.two-mat', '.l-45', '.l-5', '.l-50', '.n-avg'].map(Q);
  gsap.set(txt, { autoAlpha: 0 });
  gsap.set(Q('.w-lichen'), { left: 0, right: 0, top: 120, textAlign: 'center', fontSize: 150 });
  gsap.set(Q('.w-humus'), { left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 240 }); Q('.w-humus').style.backgroundImage = H.tex.humus; Q('.w-humus').style.webkitTextStroke = '2px rgba(255,225,180,0.75)';
  gsap.set(Q('.two-mat'), { left: 0, right: 0, top: 150, textAlign: 'center', fontSize: 150 });
  Q('.two-mat .g1').style.backgroundImage = H.tex.rock; Q('.two-mat .g2').style.backgroundImage = H.tex.humus;
  Q('.two-mat .plus').style.cssText = 'font-family:var(--font);font-weight:300;font-size:120px;color:#b9a893;margin:0 40px;vertical-align:14px';
  gsap.set(Q('.l-45'), { left: 200, top: 200 }); gsap.set(Q('.l-5'), { left: 800, top: 200 }); gsap.set(Q('.l-50'), { left: 1180, top: 200 });

  // ---- world: the surface boundary. rock below at the start (lf01–lf02), then soil forms on it ----
  const cam = H.cam(); cam.z = 1; cam.x = 0; cam.y = 0;
  const T = {
    lichen0: S('lf01') + 0.4, lichen1: E('lf01'), acid: about('lf02', '녹이고'), die: about('lf02', '죽으면') , moss: S('lf03'), fall0: about('lf03', '계절이'), fall1: E('lf03') + 0.6,
    hyph: S('lf04'), bugs: about('lf04', '벌레들이'), humus0: S('lf05') + 0.2, humus1: about('lf05', '부식토라고'), bind: about('lf06', '붙여'), dark: about('lf06', '검은'),
    push: about('lf07', '얼마나') - 0.4, pinch: S('lf08') - 0.4, lights: about('lf08', '수백만'), city: about('lf09', '큰 도시'), worm0: S('lf10') - 0.2, worm1: E('lf12'),
    mix: S('lf13'), lump: about('lf14', '45퍼센트') - 0.9, lump45: about('lf14', '45퍼센트'), lump5: about('lf14', '5퍼센트'), lump50: about('lf14', '나머지 절반'), sand: about('lf15', '시간이'),
  };
  const rockY = 560;   // the rock surface in world coords
  // lichen patches: blobs that grow (noise-edged discs), three colours
  const lr = rand(301);
  const lichens = Array.from({ length: 26 }, (_, i) => ({ x: 160 + lr() * 1600, y: 140 + lr() * 800, r: 34 + lr() * 90, d: lr(), c: ['#c9973a', '#9aa85e', '#b9b39a', '#6f8a44', '#d9b45a'][i % 5], ph: lr() * 10, sp: lr() * 100 }));
  const speck = WO.canvas(64, 64); { const q = WO.ctx(speck); for (let i = 0; i < 160; i++) { const r = WO.rand(3000 + i); q.fillStyle = i % 2 ? 'rgba(255,245,220,0.35)' : 'rgba(40,30,15,0.35)'; q.beginPath(); q.arc(r() * 64, r() * 64, 1 + r() * 2, 0, 6.283); q.fill(); } }
  const speckPat = g.createPattern(speck, 'repeat');
  function lichenPath(L, k) { g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.283; const rr = L.r * k * (0.72 + 0.28 * WO.noise(Math.cos(a) * 1.7 + L.ph, Math.sin(a) * 1.7, 5)); g.lineTo(L.x + Math.cos(a) * rr, L.y + Math.sin(a) * rr * 0.8); } g.closePath(); }
  // moss + grass roots (space colonization downwards into the rock cracks region)
  const roots = WO.roots({ origin: [980, rockY - 10], box: [500, rockY, 960, 420], region: (x, y) => y > rockY + 10, n: 260, step: 9, kill: 16, influence: 150, down: 0.7, seed: 31, iters: 180 });
  // leaves falling (closed form): spawn times spread across lf03, land on the pile
  const lv = rand(303);
  const leaves = Array.from({ length: 70 }, (_, i) => ({ t0: T.fall0 - 0.4 + lv() * (T.fall1 - T.fall0), x: 120 + lv() * 1680, sway: 40 + lv() * 60, ph: lv() * 6.28, s: sp.leaf[i % 3], land: rockY - 36 - lv() * 30, k: 0.7 + lv() * 0.6, spin: (lv() - 0.5) * 3 }));
  // decomposers: hyphae (threads) spreading through the pile, bugs crawling
  const hy = rand(305);
  const hyphae = Array.from({ length: 30 }, () => ({ x: 200 + hy() * 1500, y: rockY - 20 - hy() * 60, d: hy(), ang: hy() * 6.28, len: 90 + hy() * 140, bend: (hy() - 0.5) * 2 }));
  const bugs = Array.from({ length: 16 }, () => ({ x: 200 + hy() * 1500, y: rockY - 30 - hy() * 50, d: hy(), v: 30 + hy() * 50, ph: hy() * 6.28, dir: hy() < 0.5 ? 1 : -1 }));
  // the pinch: thousands of microbe lights (lf08), re-arranged into a city grid (lf09)
  const pm = rand(307), N = 1800;
  const microbes = Array.from({ length: N }, (_, i) => { const a = pm() * 6.283, r = Math.sqrt(pm()) * 330; const col = i % 7 === 0 ? sp.glowAmber : sp.glowLife; const gx = 180 + (i % 60) * 26 + (pm() - 0.5) * 6, gy = 300 + Math.floor(i / 60) * 22 + (pm() - 0.5) * 6; return { x: 960 + Math.cos(a) * r * 1.3, y: 560 + Math.sin(a) * r * 0.75, d: pm(), s: 10 + pm() * 14, ph: pm() * 6.28, sp: col, gx, gy }; });
  // worm path (lf10–lf12): a sine burrow across the topsoil
  const wormPath = (u) => [-300 + 2500 * u, rockY - 200 + 70 * Math.sin(u * 7) + 40 * Math.sin(u * 3.1)];
  // soil lump (lf14) wedges: angles for 45 / 5 / 50
  const lumpC = [700, 600], lumpR = 300;

  function drawWorld(t) {
    H.view(g, cam, 1);
    if (t < T.moss) {   // lf01–lf02: looking down at a bare rock face; the lichen crusts spread over it
      g.drawImage(mat.granite.canvas, 0, 0, mat.granite.w, mat.granite.h, -60, -40, 2040, 1160);
      for (const L of lichens) {
        const k = WO.ease.out(WO.clamp((t - T.lichen0 - L.d * 2.4) / 2.6, 0, 1)); if (k <= 0) continue;
        const dead = t < T.die ? 0 : WO.clamp((t - T.die - L.d * 0.6) / 1.4, 0, 1);
        if (t > T.acid) { const q = WO.clamp((t - T.acid) / 1.2, 0, 1); lichenPath(L, k * 1.12); g.fillStyle = `rgba(20,14,10,${0.5 * q})`; g.fill(); }
        lichenPath(L, k); g.fillStyle = dead ? WO.rgb(WO.mix(WO.hex(L.c), [28, 20, 12], dead * 0.85)) : L.c; g.fill();
        g.save(); g.clip(); g.globalAlpha = 0.9 - 0.5 * dead; g.fillStyle = speckPat; g.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); g.restore();
        g.lineWidth = 2.5; g.strokeStyle = `rgba(255,245,220,${0.4 * (1 - dead)})`; g.stroke();
      }
      H.reset(g); return;
    }
    // sky: filtered green-gold light from above
    const sky = g.createLinearGradient(0, -400, 0, rockY); sky.addColorStop(0, '#1d2412'); sky.addColorStop(0.6, '#3a4a22'); sky.addColorStop(1, '#6b6a3a'); g.fillStyle = sky; g.fillRect(-100, -500, 2200, rockY + 500);
    // light shafts through the leaves
    for (let i = 0; i < 6; i++) { const x = 200 + i * 300 + 40 * Math.sin(t * 0.2 + i); const gr = g.createLinearGradient(x, -400, x + 500, rockY); gr.addColorStop(0, 'rgba(255,230,150,0.0)'); gr.addColorStop(0.3, 'rgba(255,230,150,0.08)'); gr.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 80, -400); g.lineTo(x + 80, -400); g.lineTo(x + 560, rockY); g.lineTo(x + 320, rockY); g.closePath(); g.fill(); }
    // the rock below the surface
    g.drawImage(mat.granite.canvas, 0, 0, mat.granite.w, mat.granite.h, -60, rockY, 2040, 1148);
    // the soil that forms over the rock through the chapter: a growing dark band
    const soilH = t < T.moss ? 0 : t < T.humus1 ? 30 + 110 * WO.ease.out((t - T.moss) / (T.humus1 - T.moss)) : 140 + 120 * WO.ease.out((t - T.humus1) / (E('lf06') - T.humus1));
    if (soilH > 0) {
      const dark = t < T.dark ? 0 : WO.ease.out((t - T.dark) / 1.6);
      g.save(); g.beginPath(); g.moveTo(-100, rockY + 20); for (let x = -100; x <= 2020; x += 30) g.lineTo(x, rockY - soilH + 14 * WO.noise(x / 80, 2, 9)); g.lineTo(2020, rockY + 20); g.closePath(); g.clip();
      g.drawImage(mat.soilA.canvas, 0, 0, mat.soilA.w, mat.soilA.h, -60, rockY - 300, 2040, 420);
      g.globalAlpha = dark * 0.85; g.drawImage(mat.soilO.canvas, 0, 0, mat.soilO.w, mat.soilO.h, -60, rockY - 300, 2040, 360); g.globalAlpha = 1;
      g.restore();
    }
    // moss and the roots of grass (lf03)
    if (t > T.moss) {
      const G = WO.ease.out(WO.clamp((t - T.moss) / 4.5, 0, 1));
      WO.drawRoots(g, roots, G, { color: '#e2cfa8', tip: '#dff0a8', base: 1, k: 0.5 });
      // moss tufts along the surface
      for (let i = 0; i < 48; i++) { const r = WO.rand(400 + i)(); const x = 160 + i * 34 + r * 20, h = (26 + r * 30) * G; g.fillStyle = i % 2 ? '#6c8d35' : '#8aa848'; g.beginPath(); g.ellipse(x, rockY - soilH + 4, 22, h, 0, 3.14, 6.283); g.fill(); }
    }
    // falling leaves (lf03): each a closed-form fall with sway, then lying on the pile
    for (const l of leaves) {
      const u = t - l.t0; if (u < 0) continue;
      const fallT = 2.6, y0 = -200; let x = l.x, y, rot;
      if (u < fallT) { const k = u / fallT; y = y0 + (l.land - y0) * k; x = l.x + Math.sin(u * 2.4 + l.ph) * l.sway; rot = l.spin * u + Math.sin(u * 2.4 + l.ph) * 0.6; }
      else { y = l.land; x = l.x + Math.sin(fallT * 2.4 + l.ph) * l.sway; rot = l.spin * fallT + Math.sin(fallT * 2.4 + l.ph) * 0.6; }
      // leaves on the pile darken and sink as they rot (lf04–lf05)
      const rot2 = t < T.hyph ? 0 : WO.clamp((t - T.hyph - l.k * 0.5) / 5, 0, 1);
      const sink = rot2 * 40, flat = 1 - 0.6 * rot2;
      g.save(); g.translate(x, y + sink); g.rotate(rot); g.scale(l.k, l.k * (u >= fallT ? 0.55 * flat : 1)); g.globalAlpha = 1 - rot2 * 0.85; g.drawImage(l.s, -45, -45); g.restore();
      if (rot2 > 0 && u >= fallT) { g.globalAlpha = rot2 * 0.9; g.fillStyle = '#1b120b'; g.beginPath(); g.ellipse(x, y + sink + 10, 44 * l.k, 12 * l.k, rot * 0.2, 0, 6.283); g.fill(); g.globalAlpha = 1; }
    }
    // hyphae and bugs (lf04): threads spread; bugs crawl among the leaves
    if (t > T.hyph) {
      g.strokeStyle = 'rgba(240,236,220,0.75)'; g.lineWidth = 1.6; g.lineCap = 'round';
      for (const h of hyphae) { const k = WO.ease.out(WO.clamp((t - T.hyph - h.d * 1.5) / 2.2, 0, 1)); if (k <= 0) continue; for (let b = 0; b < 3; b++) { const a = h.ang + (b - 1) * 0.6 + h.bend * 0.3; g.beginPath(); g.moveTo(h.x, h.y); const L = h.len * k * (0.7 + 0.3 * b / 2); g.quadraticCurveTo(h.x + Math.cos(a + 0.5) * L * 0.5, h.y + Math.sin(a + 0.5) * L * 0.5 * 0.4, h.x + Math.cos(a) * L, h.y + Math.sin(a) * L * 0.4); g.stroke(); } }
      for (const b of bugs) { const k = WO.clamp((t - T.bugs - b.d * 0.6) / 0.5, 0, 1); if (k <= 0) continue; const x = b.x + b.dir * ((t - T.bugs) * b.v % 400) - (b.dir > 0 ? 0 : 0); const y = b.y + 6 * Math.sin((t - T.bugs) * 9 + b.ph); g.globalAlpha = k; g.fillStyle = '#2b1d12'; g.beginPath(); g.ellipse(x, y, 11, 7, 0, 0, 6.283); g.fill(); g.strokeStyle = '#2b1d12'; g.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { const lg = Math.sin((t - T.bugs) * 18 + i * 2) * 4; g.beginPath(); g.moveTo(x + i * 6, y); g.lineTo(x + i * 6 + lg, y + 10); g.stroke(); } g.globalAlpha = 1; }
    }
    // humus binding (lf06): little bridges between grains, a drop held
    if (t > T.bind && t < T.push + 1) {
      const k = WO.ease.out(WO.clamp((t - T.bind) / 1.2, 0, 1));
      g.strokeStyle = `rgba(255,214,150,${0.55 * k})`; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const r = WO.rand(600 + i); const x = 200 + r() * 1500, y = rockY - 40 - r() * 120; g.beginPath(); g.arc(x, y, 14 + r() * 10, 0, 6.283 * k); g.stroke(); }
      if (t > about('lf06', '물을')) { const q = WO.ease.out(WO.clamp((t - about('lf06', '물을')) / 0.8, 0, 1)); g.globalAlpha = q; g.drawImage(sp.drop, 1120, rockY - 180, 44, 57); g.drawImage(sp.drop, 640, rockY - 150, 36, 47); g.globalAlpha = 1; }
    }
    H.reset(g);
  }
  // lf08–lf09: the pinch — a dark close-up with thousands of lights; then they order into a city grid
  function drawPinch(t) {
    if (t < T.pinch || t > T.worm0 + 0.3) return;
    const inK = WO.ease.out(WO.clamp((t - T.pinch) / 0.8, 0, 1)), outK = 1 - WO.clamp((t - T.worm0) / 0.3, 0, 1);
    H.reset(g);
    g.globalAlpha = inK * outK; g.fillStyle = '#0b0805'; g.fillRect(0, 0, 1920, 1080);
    // the pinch itself: a dark soil crumb, lit from the upper left
    g.save(); g.translate(960, 560); g.scale(inK, inK);
    g.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * 6.283; const rr = 420 * (0.82 + 0.18 * WO.noise(Math.cos(a) * 2 + 3, Math.sin(a) * 2, 8)); g.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.75); } g.closePath();
    g.save(); g.clip(); g.drawImage(mat.soilO.canvas, 0, 0, mat.soilO.w, mat.soilO.h, -620, -360, 1240, 720); g.restore();
    g.restore();
    const cityK = t < T.city ? 0 : WO.ease.inout((t - T.city) / 1.6);
    g.globalCompositeOperation = 'lighter';
    for (const m of microbes) {
      const k = WO.ease.out(WO.clamp((t - T.lights - m.d * 1.8) / 0.5, 0, 1)); if (k <= 0) continue;
      const x = m.x + (m.gx - m.x) * cityK, y = m.y + (m.gy - m.y) * cityK;
      const tw = 0.6 + 0.4 * Math.sin(t * 3 + m.ph);
      g.globalAlpha = inK * outK * k * tw; g.drawImage(m.sp, x - m.s / 2, y - m.s / 2, m.s, m.s);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  // lf10–lf12: the worm burrows through the topsoil; behind it the soil is loosened (lighter, crumbly); roots follow
  const wormRoots = WO.roots({ origin: [1400, rockY - 300], box: [1000, rockY - 290, 800, 260], n: 160, step: 9, kill: 15, influence: 130, down: 0.8, seed: 33, iters: 140 });
  function drawWorm(t) {
    if (t < T.worm0 || t > T.mix + 0.6) return;
    H.view(g, cam, 1);
    const u = WO.clamp((t - T.worm0) / (E('lf11') - T.worm0), 0, 1);
    // the burrow: a soft dark tube behind the worm, and loosened lighter soil around it
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); for (let i = 0; i <= 80; i++) { const q = i / 80 * u; const [x, y] = wormPath(q); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.strokeStyle = 'rgba(120,88,60,0.55)'; g.lineWidth = 120; g.stroke();
    g.strokeStyle = 'rgba(18,10,6,0.8)'; g.lineWidth = 52; g.stroke();
    // castings: little crumbs along the burrow
    for (let i = 0; i < 60; i++) { const q = (i / 60) * u; if (q > u - 0.02) continue; const [x, y] = wormPath(q); const r = WO.rand(700 + i)(); g.fillStyle = i % 2 ? '#7a5a3a' : '#5a3d26'; g.beginPath(); g.arc(x + (r - 0.5) * 90, y + 30 + r * 30, 6 + r * 6, 0, 6.283); g.fill(); }
    // the worm: segments along the path near its head
    const head = u; const segs = 16;
    for (let i = segs - 1; i >= 0; i--) { const q = head - i * 0.012; if (q < 0) continue; const [x, y] = wormPath(q); const [x2, y2] = wormPath(q + 0.002); const ang = Math.atan2(y2 - y, x2 - x); const rr = 20 * (i === 0 ? 0.8 : i > segs - 3 ? 0.85 : 1) * (1 + 0.08 * Math.sin(t * 8 - i * 0.7));
      const grd = g.createRadialGradient(x - 6, y - 8, 2, x, y, rr * 1.2); grd.addColorStop(0, '#f0c2b0'); grd.addColorStop(0.6, '#c98a7a'); grd.addColorStop(1, '#6b3a34'); g.fillStyle = grd; g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.ellipse(0, 0, 18, rr, 0, 0, 6.283); g.fill(); g.restore(); }
    if (t > S('lf12')) { const G = WO.ease.out((t - S('lf12')) / 5); WO.drawRoots(g, wormRoots, G, { color: '#e2cfa8', tip: '#dff0a8', base: 1, k: 0.5 }); }
    H.reset(g);
  }
  // lf13–lf15: the two ingredients mix; the lump cut open shows 45 / 5 / 50; then grains of time start to fall
  const mr = rand(309), mixG = Array.from({ length: 260 }, (_, i) => ({ x0: i % 2 ? -100 - mr() * 500 : 2020 + mr() * 500, y0: 300 + mr() * 500, x1: 760 + mr() * 400, y1: 460 + mr() * 300, d: mr(), s: i % 2 ? sp.grainG[0] : sp.grainA[1], k: 0.8 + mr() * 0.8 }));
  function drawMix(t) {
    if (t < T.mix - 0.3) return;
    H.reset(g);
    const fadeWorld = WO.ease.out(WO.clamp((t - T.mix) / 0.8, 0, 1));
    g.fillStyle = `rgba(14,9,5,${0.86 * fadeWorld})`; g.fillRect(0, 0, 1920, 1080);
    const lumpK = t < T.lump ? 0 : WO.ease.out(WO.clamp((t - T.lump) / 1, 0, 1));
    if (lumpK < 1) {
      g.globalAlpha = 1 - lumpK;
      for (const p of mixG) { const k = WO.ease.inout(WO.clamp((t - T.mix - p.d * 1.2) / 1.4, 0, 1)); const x = p.x0 + (p.x1 - p.x0) * k, y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * 3.14) * 160; g.save(); g.translate(x, y); g.scale(p.k, p.k); g.rotate(k * 6 * (p.d - 0.5)); g.drawImage(p.s, -12, -12); g.restore(); }
      g.globalAlpha = 1;
    }
    if (lumpK > 0) {
      // the mixed soil sorted into what it is made of: a heap of mineral grains, a small heap of humus, and the empty
      // space between them — water and air — as droplets and bubbles. Heap areas are 45 : 5 : 50 of the same soil.
      const base = 860, reveal = (tt) => WO.ease.out(WO.clamp((t - tt) / 0.8, 0, 1));
      const k45 = reveal(T.lump45 - 0.3), k5 = reveal(T.lump5 - 0.3), k50 = reveal(T.lump50 - 0.3);
      const heap = (cx, w, kk, tex, tint) => { if (kk <= 0) return; const ww = w * kk, hh = w * 0.56 * kk; g.save(); g.beginPath(); g.moveTo(cx - ww / 2, base); for (let i = 0; i <= 30; i++) { const a = 3.14159 + i / 30 * 3.14159; g.lineTo(cx + Math.cos(a) * ww / 2, base + Math.sin(a) * hh * (0.92 + 0.08 * WO.noise(i * 0.4, cx))); } g.closePath(); g.clip();
        g.drawImage(tex, 0, 0, tex.width, tex.height, cx - ww / 2 - 10, base - hh - 10, ww + 20, hh + 20); if (tint) { g.fillStyle = tint; g.fillRect(cx - ww / 2, base - hh, ww, hh); } g.restore();
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(cx, base + 10, ww / 2 * 1.04, 18, 0, 0, 6.283); g.fill(); };
      g.globalAlpha = lumpK;
      heap(430, 540, k45, mat.soilC.canvas, 'rgba(236,232,226,0.08)');
      heap(900, 180, k5, mat.soilO.canvas, null);
      // pores: a cloud of droplets and bubbles over the space where the heaps were
      if (k50 > 0) { for (let i = 0; i < 110; i++) { const r = WO.rand(800 + i); const x = 1180 + r() * 560, y = base - 20 - Math.sqrt(r()) * 300 - 6 * Math.sin(t * 1.5 + i); const rr = 7 + r() * 16; const kk = WO.clamp((k50 - r() * 0.5) * 2, 0, 1); if (kk <= 0) continue; g.globalAlpha = lumpK * kk; if (i % 3) { g.fillStyle = 'rgba(143,215,255,0.55)'; g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.25, 0, 6.283); g.fill(); } else { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.stroke(); } } }
      g.globalAlpha = 1;
    }
    // lf15: grains of time begin to fall onto the lump
    if (t > T.sand) { const n = 120; for (let i = 0; i < n; i++) { const r = WO.rand(900 + i); const u = ((t - T.sand) * (0.5 + r() * 0.5) + r()) % 1.2; if (u > 1) continue; const x = 430 + (r() - 0.5) * 160, y = -40 + 600 * u * u; g.globalAlpha = 0.9; g.drawImage(sp.grainA[i % 3], x - 8, y - 8, 16, 16); } g.globalAlpha = 1; }
  }

  // ---- camera ----
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.0, duration: 0.01, immediateRender: false }, win.a);
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.7, x: 60, y: 20, duration: 1.3, ease: 'power3.inOut', immediateRender: false }, S('lf02') - 0.2);           // ECU: the rock pits under the lichen
  tl.fromTo(cam, { z: 1.7, x: 60, y: 20 }, { z: 1.0, x: 0, y: 0, duration: 0.01, immediateRender: false }, S('lf03') - 0.02);             // cut to the side view: the surface boundary
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.45, x: 0, y: 30, duration: 1.3, ease: 'power3.inOut', immediateRender: false }, S('lf04') - 0.1);           // CU: threads and bugs in the litter
  tl.fromTo(cam, { z: 1.45, x: 0, y: 30 }, { z: 1.0, x: 0, y: 0, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, S('lf06') - 0.2);             // the dark band of topsoil
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 2.6, x: 100, y: 60, duration: 1.4, ease: 'power3.in', immediateRender: false }, T.push);                        // push in to the pinch (lf07 cushion)
  tl.fromTo(cam, { z: 2.6, x: 100, y: 60 }, { z: 1.0, x: 0, y: 0, duration: 0.01, immediateRender: false }, T.worm0 - 0.05);
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.0, x: 0, y: -120, duration: 2, ease: 'power2.inOut', immediateRender: false }, S('lf10'));                   // tilt down to the burrow

  // ---- type ----
  H.inn(Q('.w-lichen'), about('lf01', '지의류입니다') - 0.3, { y: 50 }, 0.8); H.inn(Q('.s-lichen'), about('lf01', '균류와') - 0.2, { y: 24 }, 0.7);
  H.out(Q('.w-lichen'), S('lf02') + 0.6, { y: -40 }, 0.4); H.out(Q('.s-lichen'), S('lf02') + 0.6, { y: -20 }, 0.4);
  H.inn(Q('.w-humus'), T.humus1 - 0.25, { y: 60, scale: 0.9 }, 0.9); H.inn(Q('.s-humus'), about('lf06', '양분이') - 0.2, { y: 24 }, 0.7);
  H.out(Q('.w-humus'), S('lf07') - 0.2, { y: -50 }, 0.45); H.out(Q('.s-humus'), S('lf07') - 0.2, { y: -20 }, 0.4);
  H.inn(Q('.gram'), about('lf08', '흙 1그램에') - 0.2, { scale: 1.25 }, 0.7, 'power4.out'); H.out(Q('.gram'), T.city - 0.1, { y: -40 }, 0.4);
  H.inn(Q('.l-city'), T.lights + 0.2, { y: 24 }, 0.7); H.inn(Q('.s-fao'), S('lf08') + 0.2, { y: 16 }, 0.6);
  H.out(Q('.l-city'), T.city - 0.1, { y: -20 }, 0.4); H.out(Q('.s-fao'), T.city - 0.1, { y: -16 }, 0.4);
  H.inn(Q('.l-city2'), T.city + 0.8, { y: 24 }, 0.7); H.out(Q('.l-city2'), T.worm0 - 0.1, { y: -20 }, 0.35);
  H.inn(Q('.n-darwin'), about('lf11', '1881년에') - 0.2, { x: 30, scale: 1.1 }, 0.7); H.inn(Q('.s-darwin'), about('lf11', '지렁이에 관한') - 0.2, { x: 20 }, 0.6);
  H.out(Q('.n-darwin'), S('lf12') - 0.1, { y: -30 }, 0.4); H.out(Q('.s-darwin'), S('lf12') - 0.1, { y: -20 }, 0.4);
  const tm = Q('.two-mat'); gsap.set(H.qa(tm, 'span'), { autoAlpha: 0 }); tl.set(tm, { autoAlpha: 1 }, T.mix);
  tl.fromTo(Q('.two-mat .g1'), { autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out', immediateRender: false }, about('lf13', '바위에서') - 0.2);
  tl.fromTo(Q('.two-mat .plus'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, about('lf13', '생명에서') - 0.4);
  tl.fromTo(Q('.two-mat .g2'), { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out', immediateRender: false }, about('lf13', '생명에서') - 0.2);
  H.out(tm, T.lump - 0.1, { y: -40 }, 0.45);
  H.inn(Q('.l-45'), T.lump45 - 0.15, { x: -30 }, 0.7); H.inn(Q('.l-5'), T.lump5 - 0.15, { x: -30 }, 0.7); H.inn(Q('.l-50'), T.lump50 - 0.15, { x: -30 }, 0.7);
  H.inn(Q('.n-avg'), T.lump + 0.6, { x: 20 }, 0.6);
  [Q('.l-45'), Q('.l-5'), Q('.l-50'), Q('.n-avg')].forEach((e) => H.out(e, S('lf15') + 0.3, { y: -24 }, 0.4));

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 0.4) return;
    g.clearRect(0, 0, 1920, 1080);
    drawWorld(t);
    drawWorm(t);
    drawPinch(t);
    drawMix(t);
    H.reset(g);
  });
};
