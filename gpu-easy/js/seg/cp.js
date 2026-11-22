/* seg/cp.js — chapter 3 「왜 계산기를 수천 개나 복사하나?」: CPU vs GPU, 16,384 cores, painting all dots at once, memory, blueprint. */
window.SEG = window.SEG || {};
window.SEG.cp = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="cp">
      <canvas class="world"></canvas>
      <p class="t lbl n-cpu" style="left:300px;top:110px;font-size:66px"><span class="ag">CPU</span><i>중앙 처리 장치</i></p>
      <p class="t lbl n-gpu" style="left:1260px;top:110px;font-size:66px"><span class="au">GPU</span><i>그래픽 처리 장치</i></p>
      <p class="t sub s-cpu" style="left:270px;top:880px">크고 똑똑한 코어 <b>16~24개</b></p>
      <p class="t sub s-gpu" style="left:1200px;top:880px">단순한 작은 코어 <b>아주 많이</b></p>
      <p class="t hero l au ctr n16k" style="top:330px"><span class="v">0</span><span class="unit">개</span></p>
      <p class="t sub ctr s16k" style="top:540px"><b>RTX 4090</b> 한 개에 든 코어</p>
      <p class="t lbl l-seq" style="left:250px;top:110px;font-size:50px">하나씩 차례로<i>한 명의 천재</i></p>
      <p class="t lbl l-par" style="left:1150px;top:110px;font-size:50px"><span class="au">한꺼번에</span><i>수천 명이 한 칸씩</i></p>
      <p class="t lbl l-wait" style="left:0;right:0;text-align:center;top:120px;font-size:60px">숫자가 늦게 오면<i>코어들은 그냥 기다린다</i></p>
      <p class="t lbl l-mem" style="left:120px;top:150px;font-size:56px">메모리<i>숫자를 담아 두는 곳</i></p>
      <p class="t lbl l-bus" style="left:1340px;top:150px;font-size:56px"><span class="au">아주 넓은 길</span><i>한 번에 많은 숫자를</i></p>
      <p class="t hero m ctr l-done" style="top:110px"><span class="ag">설계 완료</span></p>
      <p class="t sub ctr s-done" style="top:250px">작은 코어 <b>수천 개</b> + 옆에 붙은 <b>메모리</b></p>
      <p class="t lbl ctr l-paper" style="top:120px;font-size:60px">아직은 종이 위의 설계도<i>진짜 칩은 …</i></p>
      <p class="t hero l ctr l-sand" style="top:330px"><span class="ag">모래</span><span class="unit" style="color:#9aa6bd">에서</span></p>
      ${H.card(3, '왜 계산기를 수천 개나 복사하나?', '수천 개')}
    </section>`);
  scene(el, win.a, win.b + 1.3);
  H.sweep(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('cp01') + 1.2);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const vis = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(WO.k(t, a, a + fi), 1 - WO.k(t, b - fo, b));
  const font = (w, s) => `${w} ${s}px Pretendard, sans-serif`;

  const T = {
    vs: about('cp01', 'CPU', -0.3), cpu: S('cp02'), c16: about('cp02', '16개', -0.3), gpu: S('cp03'), gpuN: about('cp03', '작은 코어', -0.3),
    n16: about('cp04', '1만', -0.3), par: S('cp05'), split: about('cp05', '나눠', -0.3), paint: about('cp05', '동시에', -0.3),
    ana: S('cp06'), seq: about('cp06', '천재', -0.3), many: about('cp06', '수천 명', -0.3), wait: S('cp07'), mem: about('cp08', '메모리', -0.3), bus: about('cp08', '넓은 길', -0.3),
    done: S('cp09'), paper: S('cp10'), bp: S('cp10') + 0.2, sand: about('cp10', '모래', -0.6),
  };
  H.show(Q('.n-cpu'), T.vs, T.par - 0.2, { y: 30 }); H.show(Q('.n-gpu'), T.vs + 0.5, T.par - 0.2, { y: 30 });
  H.show(Q('.s-cpu'), T.c16, T.n16 - 0.2, { y: 20 }); H.show(Q('.s-gpu'), T.gpuN, T.n16 - 0.2, { y: 20 });
  H.show(Q('.n16k'), T.n16, T.par - 0.2, { scale: 0.9, y: 0 }); H.show(Q('.s16k'), T.n16 + 0.4, T.par - 0.2, { y: 20 });
  H.count(Q('.n16k .v'), 0, 16384, T.n16, T.n16 + 1.8, (v) => Math.round(v).toLocaleString('en-US'), 'expo.out');
  H.show(Q('.l-seq'), T.seq, T.wait - 0.2, { y: 20 }); H.show(Q('.l-par'), T.many, T.wait - 0.2, { y: 20 });
  H.show(Q('.l-wait'), T.wait + 0.4, T.mem - 0.2, { y: 20 });
  H.show(Q('.l-mem'), T.mem, T.done - 0.2, { x: -30, y: 0 }); H.show(Q('.l-bus'), T.bus, T.done - 0.2, { x: 30, y: 0 });
  H.show(Q('.l-done'), T.done + 0.3, T.paper, { y: 30 }); H.show(Q('.s-done'), T.done + 0.7, T.paper, { y: 20 });
  H.show(Q('.l-paper'), T.paper + 0.3, T.sand - 0.1, { y: 20 }); H.show(Q('.l-sand'), T.sand + 0.2, win.b + 0.2, { scale: 0.92, y: 0 });

  // memory chip at (x, y), w×h, vertical
  function memChip(x, y, w, h, a = 1) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x - w / 2 + 6, y - h / 2 + 10, w, h);
    const grd = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); grd.addColorStop(0, '#2c3242'); grd.addColorStop(1, '#10131c');
    g.fillStyle = grd; g.fillRect(x - w / 2, y - h / 2, w, h);
    g.strokeStyle = 'rgba(220,230,255,0.35)'; g.lineWidth = 2; g.strokeRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle = '#c9a050'; for (let i = 0; i < 8; i++) { const yy = y - h / 2 + (i + 0.5) * h / 8; g.fillRect(x - w / 2 - 8, yy - 3, 8, 6); g.fillRect(x + w / 2, yy - 3, 8, 6); }
    g.fillStyle = 'rgba(200,210,230,0.5)'; g.font = font(700, Math.max(12, w * 0.22)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MEM', x, y);
    g.restore();
  }
  // a screen grid: cols×rows cells of the picture at (x, y) w×h, painted by p(i, j) 0..1
  function screenGrid(x, y, w, h, cols, rows, p, gap = 2) {
    const P = mat.pic, cw = w / cols, ch = h / rows;
    g.fillStyle = '#05060a'; g.fillRect(x - 8, y - 8, w + 16, h + 16); g.strokeStyle = '#2a3346'; g.lineWidth = 5; g.strokeRect(x - 8, y - 8, w + 16, h + 16);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = p(i, j); const c = P.px[Math.floor((j + 0.5) / rows * P.ch) * P.cw + Math.floor((i + 0.5) / cols * P.cw)];
      g.fillStyle = k > 0 ? WO.rgb(WO.mix([22, 26, 38], c, k)) : '#161a26'; g.fillRect(x + i * cw + gap / 2, y + j * ch + gap / 2, cw - gap, ch - gap);
    }
  }

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.4) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.lineCap = 'butt'; g.lineJoin = 'miter';
    H.ground(g, t, 1.2, 0, 0, 0.6);
    // 1 · CPU vs GPU dies (cp01–cp04)
    const vD = vis(t, T.vs - 0.2, T.par + 0.6, 0.6, 0.8);
    if (vD > 0) {
      const dimForNum = 1 - 0.88 * vis(t, T.n16 - 0.2, T.par + 0.3, 0.4, 0.4);
      g.globalAlpha = vD * dimForNum;
      const cpuFill = WO.k(t, T.cpu + 0.4, T.c16 + 0.6);
      WO.drawDie(g, 520, 560, 520, 4, { fill: cpuFill, tile: mat.tileCpu, si: mat.siQuiet.canvas, gap: 0.1 });
      const k = WO.k(t, T.gpu + 0.2, T.n16 + 1.2), n = Math.pow(2, 2 + Math.min(5, Math.floor(k * 6))), fill = k > 0 ? 1 : 0;
      WO.drawDie(g, 1400, 560, 520, n, { fill, tile: mat.tile, si: mat.siQuiet.canvas, gap: n > 64 ? 0.22 : 0.12, cellColor: '#e0b048' });
      g.globalAlpha = 1;
    }
    // 2 · painting the screen: one at a time vs all at once (cp05–cp06)
    const vP = vis(t, T.par, T.wait + 0.3, 0.6, 0.6);
    if (vP > 0) {
      g.globalAlpha = vP;
      const cols = 32, rows = 18, x0 = 150, x1 = 1050, y = 300, w = 720, h = 405;
      // left: one big core paints them in order
      const seqDone = (t - T.par - 0.6) * 22;
      screenGrid(x0, y, w, h, cols, rows, (i, j) => WO.clamp(seqDone - (j * cols + i), 0, 1));
      // right: every cell has its own core; split (lines) then all at once
      const allK = WO.ease.out(WO.k(t, T.paint, T.paint + 0.5));
      const splitK = WO.k(t, T.split, T.split + 0.8);
      screenGrid(x1, y, w, h, cols, rows, (i, j) => allK * (0.85 + 0.15 * WO.hash(i, j, 3)));
      // CPU chip under the left screen, GPU chip under the right
      WO.drawDie(g, x0 + w / 2, 870, 170, 4, { tile: mat.tileCpu, si: mat.siQuiet.canvas });
      WO.drawDie(g, x1 + w / 2, 870, 170, 32, { tile: mat.tile, si: mat.siQuiet.canvas, cellColor: '#e0b048', gap: 0.2, lit: allK > 0 ? (i, j) => 0.6 * (1 - allK) + 0.3 : null });
      // the single brush on the left: a bright dot moving cell to cell
      const cur = Math.floor(WO.clamp(seqDone, 0, cols * rows - 1)), ci = cur % cols, cj = (cur / cols) | 0;
      g.globalCompositeOperation = 'lighter'; g.drawImage(sp.glowWhite, x0 + (ci + 0.5) * w / cols - 40, y + (cj + 0.5) * h / rows - 40, 80, 80);
      // the threads from the GPU cores up to the cells (split)
      if (splitK > 0 && allK < 1) { g.strokeStyle = `rgba(242,193,78,${0.18 * splitK * (1 - allK)})`; g.lineWidth = 1; for (let k = 0; k < 120; k++) { const i = (k * 7) % cols, j = (k * 11) % rows; g.beginPath(); g.moveTo(x1 + w / 2 + ((k % 12) - 6) * 10, 800); g.lineTo(x1 + (i + 0.5) * w / cols, y + (j + 0.5) * h / rows); g.stroke(); } }
      // thousands of small lights on the right once the analogy is told
      const many = WO.k(t, T.many, T.many + 0.4);
      if (many > 0) for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const f = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.3 + j * 2.1); g.globalAlpha = vP * many * 0.35 * f; g.drawImage(sp.glowGold, x1 + (i + 0.5) * w / cols - 10, y + (j + 0.5) * h / rows - 10, 20, 20); }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    // 3 · waiting cores, then memory and the wide road (cp07–cp09)
    const vM = vis(t, T.wait, T.paper + 0.8, 0.6, 0.8);
    if (vM > 0) {
      const memK = WO.ease.out(WO.k(t, T.mem, T.mem + 0.9)), busK = WO.k(t, T.bus, T.bus + 0.6), doneK = WO.ease.io(WO.k(t, T.done, T.done + 1.4));
      const s = WO.lerp(560, 460, doneK), cx = 960, cy = WO.lerp(600, 620, doneK);
      g.globalAlpha = vM;
      // data: a trickle from far away (cp07), then a flood along the bus (cp08)
      const slow = 1 - busK;
      // memory chips on both sides
      if (memK > 0) for (const side of [-1, 1]) for (let k = 0; k < 3; k++) { const mx = cx + side * (s / 2 + WO.lerp(380, 150, memK)), my = cy + (k - 1) * s * 0.33; memChip(mx, my, 110, s * 0.28, memK); }
      // the bus: many parallel lines between memory and die
      if (busK > 0) {
        for (const side of [-1, 1]) for (let i = 0; i < 22; i++) {
          const yy = cy - s * 0.45 + i * s * 0.9 / 21, xa = cx + side * (s / 2 + 95), xb = cx + side * (s / 2);
          g.strokeStyle = `rgba(224,138,74,${0.75 * busK})`; g.lineWidth = 3; g.beginPath(); g.moveTo(xa, yy); g.lineTo(xb, yy); g.stroke();
          g.globalCompositeOperation = 'lighter'; const u = ((t * 2.2 + i * 0.37) % 1); g.fillStyle = `rgba(255,230,160,${busK})`; g.beginPath(); g.arc(WO.lerp(xa, xb, u), yy, 4, 0, 6.283); g.fill(); g.globalCompositeOperation = 'source-over';
        }
      }
      if (slow > 0.02) { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const u = ((t * 0.25 + i / 3) % 1); g.globalAlpha = vM * slow; g.drawImage(sp.glowWhite, WO.lerp(-40, cx - s / 2, u) - 20, cy - 60 + i * 60 - 20, 40, 40); } g.globalCompositeOperation = 'source-over'; g.globalAlpha = vM; }
      // the die: cores waiting (mostly dark) until the data flows
      const wake = busK;
      WO.drawDie(g, cx, cy, s, 32, { tile: mat.tile, si: mat.siQuiet.canvas, cellColor: '#e0b048', gap: 0.2, alpha: 1, glow: wake,
        lit: (i, j) => wake * (0.5 + 0.5 * Math.sin(t * 5 + i * 0.9 + j * 0.6)) * 0.6 });
      if (wake < 1) { g.fillStyle = `rgba(6,8,16,${0.55 * (1 - wake)})`; g.fillRect(cx - s * 0.4, cy - s * 0.4, s * 0.8, s * 0.8); for (let k = 0; k < 40; k++) { const i = (k * 13) % 32, j = (k * 7) % 32, on = Math.sin(t * 2 + k) > 0.9; if (!on) continue; g.fillStyle = 'rgba(242,193,78,0.7)'; g.fillRect(cx - s * 0.4 + i * s * 0.8 / 32, cy - s * 0.4 + j * s * 0.8 / 32, s * 0.8 / 32 - 2, s * 0.8 / 32 - 2); } }
      g.globalAlpha = 1;
    }
    // 4 · blueprint, then sand (cp10)
    const vB = vis(t, T.bp, win.b + 1.3, 0.9, 0.3);
    if (vB > 0) {
      g.globalAlpha = vB;
      g.fillStyle = '#0d2a5a'; g.fillRect(0, 0, 1920, 1080);
      g.strokeStyle = 'rgba(160,200,255,0.12)'; g.lineWidth = 1; for (let x = 0; x < 1920; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1080); g.stroke(); } for (let y = 0; y < 1080; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1920, y); g.stroke(); }
      const s = 460, cx = 960, cy = 620;
      g.strokeStyle = 'rgba(210,230,255,0.9)'; g.lineWidth = 3; g.strokeRect(cx - s / 2, cy - s / 2, s, s);
      g.lineWidth = 1.2; for (let i = 0; i <= 16; i++) { const u = cx - s * 0.4 + i * s * 0.8 / 16; g.beginPath(); g.moveTo(u, cy - s * 0.4); g.lineTo(u, cy + s * 0.4); g.stroke(); const v = cy - s * 0.4 + i * s * 0.8 / 16; g.beginPath(); g.moveTo(cx - s * 0.4, v); g.lineTo(cx + s * 0.4, v); g.stroke(); }
      for (const side of [-1, 1]) for (let k = 0; k < 3; k++) { g.lineWidth = 2; g.strokeRect(cx + side * (s / 2 + 150) - 55, cy + (k - 1) * s * 0.33 - s * 0.14, 110, s * 0.28); }
      g.setLineDash([12, 8]); g.beginPath(); g.moveTo(cx - s / 2 - 40, cy + s / 2 + 50); g.lineTo(cx + s / 2 + 40, cy + s / 2 + 50); g.stroke(); g.setLineDash([]);
      // sand pours up from the bottom and covers the paper
      const sk = WO.k(t, T.sand, T.sand + 2.2);
      if (sk > 0) { const r = WO.rand(301); for (let i = 0; i < 520; i++) { const x = r() * 1920, d = r(), top = 1080 - sk * (360 + 420 * WO.noise(x / 300, 1, 4)) ; const y = WO.lerp(1120, top + d * (1100 - top), WO.ease.out(WO.clamp(sk * 1.6 - d * 0.5, 0, 1))); const z = 16 + d * 26; g.drawImage(sp.grains[i % 8], x - z / 2, y - z / 2, z, z); } }
      g.globalAlpha = 1;
    }
    H.keyLight(g, 1);
  });
};
