/* seg/op.js — chapter 1 「GPU는 무슨 일을 하는가?」: the dots of this screen, 830만 × 60, the chip, the three steps. */
window.SEG = window.SEG || {};
window.SEG.op = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="op">
      <canvas class="world"></canvas>
      <p class="t tag res" style="left:0;right:0;text-align:center;top:118px">3840 × 2160</p>
      <p class="t hero l ag n830" style="left:150px;top:300px">830만<span class="unit">개</span></p>
      <p class="t sub s830" style="left:156px;top:490px">화면 하나의 <b>점</b></p>
      <p class="t hero l au x60" style="left:1180px;top:300px">× 60</p>
      <p class="t sub s60" style="left:1190px;top:490px"><b>1초</b>마다 전부 새로</p>
      <p class="t hero xl ag ctr big5" style="top:330px"><span class="v">0</span></p>
      <p class="t sub ctr s5" style="top:620px"><b>1초</b> 동안 정해야 하는 색</p>
      <p class="t hero l au ctr gpu" style="top:70px">GPU</p>
      <p class="t sub ctr sgpu" style="top:900px">그래픽 처리 장치 · <b>G</b>raphics <b>P</b>rocessing <b>U</b>nit</p>
      <p class="t hero m ctr ttl" style="top:110px;font-size:92px;letter-spacing:-0.03em">세상에서 가장 이해하기 쉬운<br><span class="au" style="font-size:132px">GPU 만드는 법</span></p>
      <div class="step st1" style="left:245px"><div class="n">STEP 1</div><span class="w">계산기 하나</span></div>
      <div class="step st2" style="left:725px"><div class="n">STEP 2</div><span class="w">수천 개로 복사</span></div>
      <div class="step st3" style="left:1205px"><div class="n">STEP 3</div><span class="w">모래에서 칩으로</span></div>
    </section>`);
  scene(el, win.a, win.b + 1.3);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  Q('.ttl').style.lineHeight = '1.12';

  const T = {
    zoom0: S('op01'), zoom1: S('op02') + 2.6, n830: about('op02', '830만', -0.15), x60: about('op02', '1초에', -0.15),
    big5: S('op03') + 0.1, chip0: S('op04') - 0.1, gpu: about('op04', 'GPU', -0.15),
    take0: S('op05') + 0.4, build0: about('op05', '쌓아', -0.6), steps: S('op06') + 0.3,
    st1: about('op06', '계산기 하나', -0.25), st2: about('op06', '수천', -0.25), st3: about('op06', '모래', -0.25), push: S('op07') + 0.6,
  };
  // texts
  H.show(Q('.res'), T.n830 - 0.3, T.big5 - 0.4, { y: 10 });
  H.show(Q('.n830'), T.n830, T.big5 - 0.4, { y: 40 }, { y: -20 });
  H.show(Q('.s830'), T.n830 + 0.25, T.big5 - 0.4, { y: 20 });
  H.show(Q('.x60'), T.x60, T.big5 - 0.4, { x: -40 }, { y: -20 });
  H.show(Q('.s60'), T.x60 + 0.25, T.big5 - 0.4, { y: 20 });
  H.show(Q('.big5'), T.big5, T.chip0 + 0.2, { scale: 0.9, y: 0 }, { y: -40 });
  H.count(Q('.big5 .v'), 0, 497664000, T.big5, T.big5 + 2.2, (v) => Math.round(v).toLocaleString('en-US'), 'expo.out');
  H.show(Q('.s5'), T.big5 + 0.5, T.chip0 + 0.2, { y: 20 });
  H.show(Q('.gpu'), T.gpu, T.take0, { y: 60, scale: 0.94 }, { y: -40 });
  H.show(Q('.sgpu'), T.gpu + 0.5, T.take0, { y: 20 });
  H.show(Q('.ttl'), T.take0 + 0.3, T.steps - 0.3, { y: 30 });
  [['.st1', T.st1], ['.st2', T.st2], ['.st3', T.st3]].forEach(([s, t0]) => H.show(Q(s), t0, T.push + 0.9, { y: 30 }, { y: 20 }));
  // op07: steps 2 and 3 dim, step 1 lifts
  tl.fromTo([Q('.st2'), Q('.st3')], { opacity: 1 }, { opacity: 0.3, duration: 0.5, immediateRender: false }, S('op07'));

  // camera state on the screen (fx, fy in picture cells)
  const P = mat.pic;
  const zoomAt = (t) => { const k = WO.ease.io(WO.k(t, T.zoom0, T.zoom1)); return Math.pow(46, 1 - k) * WO.lerp(1, 0.82, WO.k(t, T.zoom1, T.n830 + 2)); };
  const drawScreenAt = (t, alpha = 1, lift = 0, scale = 1) => {
    const z = zoomAt(t), k = WO.ease.io(WO.k(t, T.zoom0, T.zoom1));
    const cam = { z: z * scale, fx: WO.lerp(130.5, 96, k), fy: WO.lerp(54.5, 54, k) };
    // the refresh: a band sweeping down the screen 1.2 times a second from op02 (slowed down to be seen)
    const sweepOn = t > T.x60 - 0.2 && t < T.big5 + 2.5;
    const sy = ((t - T.x60) * 0.9) % 1;
    g.save(); g.globalAlpha = alpha; g.translate(0, lift);
    WO.drawScreen(g, P, cam, { on: z > 2 ? null : null });
    if (z * scale < 0.999) {
      // the bezel of the monitor around the picture
      const w = 1920 * z * scale, h = 1080 * z * scale, x = 960 - w / 2, y = 540 - h / 2;
      g.fillStyle = '#05060a'; g.fillRect(0, 0, 1920, y); g.fillRect(0, y + h, 1920, 1080 - y - h); g.fillRect(0, y, x, h); g.fillRect(x + w, y, 1920 - x - w, h);
      g.strokeStyle = '#1c2230'; g.lineWidth = 16; g.strokeRect(x - 8, y - 8, w + 16, h + 16);
      g.strokeStyle = 'rgba(200,215,255,0.22)'; g.lineWidth = 2; g.strokeRect(x - 16, y - 16, w + 32, h + 32);
      if (sweepOn) {
        const yy = y + sy * h, grd = g.createLinearGradient(0, yy - 120, 0, yy + 8);
        grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.9, 'rgba(255,255,255,0.22)'); grd.addColorStop(1, 'rgba(255,255,255,0.6)');
        g.globalCompositeOperation = 'lighter'; g.fillStyle = grd; g.fillRect(x, Math.max(y, yy - 120), w, Math.min(128, yy + 8 - y)); g.globalCompositeOperation = 'source-over';
      }
      // dim the picture behind the numbers
      const dim = 0.55 * WO.k(t, T.n830 - 0.3, T.n830 + 0.4);
      if (dim > 0) { g.fillStyle = `rgba(4,6,12,${dim})`; g.fillRect(x, y, w, h); }
    }
    g.restore();
  };

  // the steps' icons (op06)
  const sandR = WO.rand(61), sand = Array.from({ length: 70 }, () => ({ x: (sandR() - 0.5) * 220 * (1 - sandR() * 0.4), y: 0, s: 10 + sandR() * 16, i: (sandR() * 8) | 0, h: sandR() }));
  sand.forEach((p) => { p.y = 60 - Math.abs(p.x) * 0.25 - p.h * 70 * (1 - Math.abs(p.x) / 140); });
  function drawSteps(t) {
    const push = WO.ease.io(WO.k(t, T.push, T.push + 2.4)), z = 1 + push * 3.2, fx = 480, fy = 520;
    g.setTransform(z, 0, 0, z, fx - fx * z, fy - fy * z);
    const icons = [[480, T.st1], [960, T.st2], [1440, T.st3]];
    icons.forEach(([x, t0], i) => {
      const k = WO.ease.back(WO.k(t, t0, t0 + 0.7)), dimK = i > 0 ? 1 - 0.65 * WO.k(t, S('op07'), S('op07') + 0.5) : 1;
      if (k <= 0) return;
      g.save(); g.globalAlpha = Math.min(1, k) * dimK; g.translate(x, 500); g.scale(k, k);
      // a pedestal of light
      g.globalCompositeOperation = 'lighter'; g.drawImage(sp.glowGold, -170, 60, 340, 90); g.globalCompositeOperation = 'source-over';
      if (i === 0) { g.drawImage(mat.tileBig, -95, -95, 190, 190); }
      if (i === 1) { const n = 7, s = 260 / n, grow = WO.k(t, t0, t0 + 1.6); let c = 0; for (let jj = 0; jj < n; jj++) for (let ii = 0; ii < n; ii++) { if (c++ > grow * n * n) continue; g.drawImage(mat.tile, -130 + ii * s + 2, -130 + jj * s + 2, s - 4, s - 4); } }
      if (i === 2) {
        for (const p of sand) g.drawImage(sp.grains[p.i], p.x - p.s / 2 - 50, p.y - p.s / 2 + 40, p.s, p.s);
        g.fillStyle = 'rgba(200,210,230,0.7)'; g.font = '700 46px Pretendard'; g.fillText('→', 40, 40);
        WO.drawDie(g, 135, 20, 110, 6, { tile: mat.tile, si: mat.siQuiet.canvas });
      }
      g.restore();
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.4) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.lineCap = 'butt'; g.lineJoin = 'miter';
    g.fillStyle = '#05060a'; g.fillRect(0, 0, 1920, 1080);
    // screen: up to the chip, then it slides up and away
    const away = WO.ease.io(WO.k(t, T.chip0, T.chip0 + 1.6));
    if (away < 1) drawScreenAt(t, 1 - away * 0.9, -away * 700, 1 - away * 0.3);
    // the silicon world fades in under the chip
    const siK = WO.k(t, T.chip0 + 0.4, T.chip0 + 2.0);
    if (siK > 0) { g.globalAlpha = siK * 0.55; H.ground(g, t, 1, 0, 0, 0.35); g.globalAlpha = 1; }
    // the chip rises, comes apart (op05) and is rebuilt from its smallest part
    const rise = WO.ease.out(WO.k(t, T.chip0 + 0.3, T.chip0 + 2.0)), gone = WO.ease.io(WO.k(t, T.steps - 0.2, T.steps + 0.8));
    if (rise > 0 && gone < 1) {
      const take = WO.k(t, T.take0, T.take0 + 1.6), build = WO.k(t, T.build0, T.build0 + 2.6);
      const fill = t < T.build0 ? 1 - take : build;
      const y = WO.lerp(1300, 600, rise) + (t > T.take0 ? WO.ease.io(WO.k(t, T.take0, T.take0 + 1)) * 70 : 0);
      const s = 520 * (1 - gone * 0.6);
      WO.drawDie(g, 960, y - gone * 200, s, 16, { fill, tile: mat.tile, si: mat.siQuiet.canvas, alpha: (1 - gone), sheen: 0.2 + (t - T.chip0) * 0.08, glow: rise * 0.6, lit: (i, j) => Math.max(0, Math.sin(t * 3 + i * 0.7 + j * 0.4)) * 0.35 });
    }
    if (t > T.steps - 0.3) drawSteps(t);
    H.keyLight(g, Math.min(1, siK + 0.3));
  });
};
