/* seg/ai.js — chapter 5 「GPU는 왜 인공지능까지 맡게 됐나?」: multiply-and-add, the matrix, every cell at once, tensor cores, the recap, back to the dots. */
window.SEG = window.SEG || {};
window.SEG.ai = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="ai">
      <canvas class="world"></canvas>
      <p class="t hero l ctr ma" style="top:130px"><span class="au">곱하고</span><span class="ag"> · </span><span class="cu">더하고</span></p>
      <p class="t sub ctr s-ma" style="top:320px">인공지능 계산의 대부분 · <b>아주 많은 숫자</b></p>
      <p class="t hero m ctr mm" style="top:100px"><span class="au">행렬 곱셈</span></p>
      <p class="t sub ctr s-mm" style="top:240px">숫자를 <b>표처럼</b> 늘어놓고 한꺼번에 곱한다</p>
      <p class="t lbl ctr l-ind" style="top:110px;font-size:58px">칸마다 <span class="onc">따로따로</span><i>서로 기다리지 않는다</i></p>
      <p class="t lbl l-px" style="left:300px;top:200px;font-size:52px">화면의 점<i>색을 칠한다</i></p>
      <p class="t lbl l-nm" style="left:1180px;top:200px;font-size:52px">행렬의 칸<i>숫자를 곱한다</i></p>
      <p class="t hero m ctr l-same" style="top:860px;font-size:64px"><span class="ag">같은 모양의 일 → </span><span class="au">GPU에 딱 맞다</span></p>
      <p class="t lbl l-tc" style="left:1240px;top:260px;font-size:64px"><span class="euvc">텐서 코어</span><i>행렬 곱셈 전문 코어</i></p>
      <p class="t hero l ctr q" style="top:380px;font-size:120px"><span class="ag">GPU는 어떻게</span><br><span class="au">만들까요?</span></p>
      <div class="step r1" style="left:245px"><div class="n">1</div><span class="w">스위치로 계산기</span></div>
      <div class="step r2" style="left:725px"><div class="n">2</div><span class="w">수천 개 복사 + 메모리</span></div>
      <div class="step r3" style="left:1205px"><div class="n">3</div><span class="w">빛으로 모래 위에</span></div>
      <p class="t sub ctr fin" style="top:120px">지금 이 화면의 점들도</p>
      ${H.card(5, 'GPU는 왜 인공지능까지 맡게 됐나?', '인공지능')}
    </section>`);
  scene(el, win.a, win.b + 1.3);
  H.sweep(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('ai01') + 1.2);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  Q('.q').style.lineHeight = '1.15'; H.qa(el, '.step .w').forEach((w) => (w.style.fontSize = '46px'));
  const vis = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(WO.k(t, a, a + fi), 1 - WO.k(t, b - fo, b));
  const font = (w, s) => `${w} ${s}px Pretendard, sans-serif`;

  const T = {
    ma: S('ai01') + 1.3, mm: S('ai02'), mmW: about('ai02', '행렬 곱셈', -0.3), ind: S('ai03'), indGo: about('ai03', '따로따로', -0.4),
    same: S('ai04'), sameW: about('ai04', '딱 맞았던', -0.4), tc: S('ai05'), tcW: about('ai05', '텐서 코어', -0.3), q: S('ai06'), qW: about('ai06', 'GPU는', -0.3),
    rc: S('ai07'), rc1: about('ai07', '전기 스위치', -0.2), rc2: about('ai07', '수천 개', -0.3), rc3: about('ai07', '빛으로', -0.3), fin: S('ai08'), dive: about('ai08', '1초에', -0.3),
  };
  H.show(Q('.ma'), T.ma, T.mm - 0.1, { y: 30 }); H.show(Q('.s-ma'), T.ma + 0.5, T.mm - 0.1, { y: 20 });
  H.show(Q('.mm'), T.mmW, T.ind - 0.1, { y: 30 }); H.show(Q('.s-mm'), T.mm + 0.4, T.ind - 0.1, { y: 20 });
  H.show(Q('.l-ind'), T.ind + 0.3, T.same - 0.1, { y: 20 });
  H.show(Q('.l-px'), T.same + 0.3, T.tc - 0.1, { y: 20 }); H.show(Q('.l-nm'), T.same + 0.6, T.tc - 0.1, { y: 20 }); H.show(Q('.l-same'), T.sameW, T.tc - 0.1, { y: 20 });
  H.show(Q('.l-tc'), T.tcW, T.q - 0.1, { x: 30, y: 0 });
  H.show(Q('.q'), T.q + 0.3, T.rc - 0.1, { y: 30 });
  [['.r1', T.rc1], ['.r2', T.rc2], ['.r3', T.rc3]].forEach(([s, t0]) => H.show(Q(s), t0, T.fin, { y: 30 }, { y: 20 }));
  H.show(Q('.fin'), T.fin + 0.4, T.dive + 0.6, { y: 20 });

  // numbers for the matrices (deterministic)
  const R = WO.rand(901), A = Array.from({ length: 16 }, () => (1 + ((R() * 9) | 0))), B = Array.from({ length: 16 }, () => (1 + ((R() * 9) | 0)));
  const C = Array.from({ length: 16 }, (_, k) => { const i = (k / 4) | 0, j = k % 4; let s = 0; for (let n = 0; n < 4; n++) s += A[i * 4 + n] * B[n * 4 + j]; return s; });
  const flow = Array.from({ length: 46 }, () => ({ y: 440 + R() * 540, v: 80 + R() * 160, o: R() * 2000, n: (1 + R() * 9).toFixed(1), s: 26 + R() * 30, op: R() < 0.5 ? '×' : '+' }));
  function matrix(x, y, cell, vals, opt = {}) {
    const n = 4, w = n * cell;
    g.strokeStyle = 'rgba(220,228,245,0.85)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x + 14, y - 8); g.lineTo(x - 8, y - 8); g.lineTo(x - 8, y + w + 8); g.lineTo(x + 14, y + w + 8); g.stroke();
    g.beginPath(); g.moveTo(x + w - 14, y - 8); g.lineTo(x + w + 8, y - 8); g.lineTo(x + w + 8, y + w + 8); g.lineTo(x + w - 14, y + w + 8); g.stroke();
    for (let k = 0; k < 16; k++) {
      const i = (k / 4) | 0, j = k % 4, cx = x + j * cell + cell / 2, cy = y + i * cell + cell / 2, lit = opt.lit ? opt.lit(i, j) : 0, show = opt.show ? opt.show(i, j) : 1;
      if (lit > 0) { g.fillStyle = `rgba(95,227,192,${0.25 * lit})`; g.fillRect(x + j * cell + 3, y + i * cell + 3, cell - 6, cell - 6); }
      if (show <= 0) continue;
      g.globalAlpha *= 1; g.fillStyle = lit > 0.5 ? '#dffcf3' : (opt.color || '#eef2fa'); g.font = font(800, cell * 0.42); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(vals[k], cx, cy + 2);
    }
  }

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.4) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.lineCap = 'butt'; g.lineJoin = 'miter';
    H.ground(g, t, 1.2, 0, 0, 0.7);
    // 1 · numbers flowing (ai01)
    const vF = vis(t, win.a + 0.5, T.mm + 0.4, 0.8, 0.6);
    if (vF > 0) {
      for (const p of flow) { const x = ((p.o + (t - win.a) * p.v) % 2200) - 140; g.globalAlpha = vF * 0.4; g.fillStyle = p.op === '×' ? '#f2c14e' : '#e08a4a'; g.font = font(700, p.s); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`${p.n} ${p.op}`, x, p.y); }
      g.globalAlpha = 1;
    }
    // 2 · A × B = C (ai02–ai03)
    const vM = vis(t, T.mm, T.same + 0.4, 0.6, 0.6);
    if (vM > 0) {
      g.globalAlpha = vM;
      const cell = 82, y = 470;
      const shift = WO.ease.io(WO.k(t, T.ind - 0.2, T.ind + 0.8));
      g.globalAlpha = vM * (1 - shift * 0.75);
      matrix(170, y, cell, A); matrix(780, y, cell, B);
      g.fillStyle = '#9aa6bd'; g.font = font(700, 80); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('×', 650, y + 2 * cell); g.fillText('=', 1260, y + 2 * cell);
      g.globalAlpha = vM;
      const go = WO.k(t, T.indGo, T.indGo + 0.5);
      matrix(1380, y, cell, C, { show: (i, j) => (t > T.indGo ? 1 : 0), lit: (i, j) => go * (0.6 + 0.4 * Math.sin(t * 5 + i + j * 1.7)), color: '#f2c14e' });
      // before: each C cell has a thread to its row of A and column of B
      if (t < T.indGo + 0.6) { const k = Math.floor(((t - T.mm) * 3) % 16), i = (k / 4) | 0, j = k % 4; g.fillStyle = 'rgba(242,193,78,0.25)'; g.fillRect(170 - 4, y + i * cell, 4 * cell + 8, cell); g.fillRect(780 + j * cell, y - 4, cell, 4 * cell + 8); g.strokeStyle = '#f2c14e'; g.lineWidth = 4; g.strokeRect(1380 + j * cell + 3, y + i * cell + 3, cell - 6, cell - 6); }
      g.globalAlpha = 1;
    }
    // 3 · the screen dots and the matrix cells are the same kind of work (ai04)
    const vS = vis(t, T.same, T.tc + 0.4, 0.6, 0.6);
    if (vS > 0) {
      g.globalAlpha = vS;
      const P = mat.pic, cols = 8, rows = 8, cell = 60, y = 330, x0 = 300, x1 = 1180, pulse = (i, j) => 0.5 + 0.5 * Math.sin(t * 4 + (i + j) * 0.0); // same pulse for all: at once
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const c = P.px[Math.floor((j + 0.5) / rows * P.ch) * P.cw + Math.floor((0.35 + (i + 0.5) / cols * 0.5) * P.cw)], k = 0.75 + 0.25 * pulse(i, j);
        g.fillStyle = WO.rgb(WO.mix([10, 12, 20], c, k)); g.fillRect(x0 + i * cell + 3, y + j * cell + 3, cell - 6, cell - 6);
        g.fillStyle = `rgba(95,227,192,${0.12 + 0.18 * pulse(i, j)})`; g.fillRect(x1 + i * cell + 3, y + j * cell + 3, cell - 6, cell - 6);
        g.fillStyle = '#e8f0ff'; g.font = font(700, 24); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(C[(i + j * 3) % 16], x1 + i * cell + cell / 2, y + j * cell + cell / 2 + 1);
      }
      g.fillStyle = '#9aa6bd'; g.font = font(700, 80); g.textAlign = 'center'; g.fillText('=', 960, y + 4 * cell);
      g.globalAlpha = 1;
    }
    // 4 · the tensor core (ai05)
    const vT = vis(t, T.tc, T.q + 0.4, 0.6, 0.6);
    if (vT > 0) {
      g.globalAlpha = vT;
      const s = 560, cx = 700, cy = 590;
      WO.drawDie(g, cx, cy, s, 16, { tile: mat.tile, si: mat.siQuiet.canvas, lit: (i, j) => ((i + j) % 5 === 0 ? 0 : 0.2 * Math.max(0, Math.sin(t * 3 + i + j))) });
      // tensor tiles: violet glow on every fifth tile
      const area = s * 0.8, step = area / 16;
      g.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { if ((i + j) % 5 !== 0) continue; g.fillStyle = `rgba(155,123,255,${0.45 + 0.25 * Math.sin(t * 4 + i * 0.3)})`; g.fillRect(cx - area / 2 + i * step + 1, cy - area / 2 + j * step + 1, step - 2, step - 2); }
      g.globalCompositeOperation = 'source-over';
      // a 4×4 block of numbers flying into one tensor tile at once
      const k = WO.ease.io(((t - T.tc) % 2.2) / 2.2), tx = cx - area / 2 + 5 * step + step / 2, ty = cy - area / 2 + 5 * step + step / 2;
      const bx = WO.lerp(1500, tx, k), by = WO.lerp(700, ty, k), bs = WO.lerp(220, step, k);
      g.globalAlpha = vT * (1 - k * 0.6);
      g.strokeStyle = '#b9a6ff'; g.lineWidth = 3; g.strokeRect(bx - bs / 2, by - bs / 2, bs, bs);
      for (let q = 0; q < 16; q++) { const i = (q / 4) | 0, j = q % 4; g.fillStyle = '#e6deff'; g.font = font(800, bs * 0.16); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(A[q], bx - bs / 2 + (j + 0.5) * bs / 4, by - bs / 2 + (i + 0.5) * bs / 4); }
      g.globalAlpha = 1;
    }
    // 5 · recap icons (ai07)
    const vR = vis(t, T.rc, T.fin + 0.4, 0.6, 0.6);
    if (vR > 0) {
      const icon = (x, t0, draw) => { const k = WO.ease.back(WO.k(t, t0, t0 + 0.7)); if (k <= 0) return; g.save(); g.globalAlpha = vR * Math.min(1, k); g.translate(x, 500); g.scale(k, k); g.globalCompositeOperation = 'lighter'; g.drawImage(sp.glowGold, -170, 60, 340, 90); g.globalCompositeOperation = 'source-over'; draw(); g.restore(); };
      icon(480, T.rc1, () => { WO.transistor(g, -60, 0, 0.45, 1, t); g.drawImage(mat.tileBig, 20, -70, 140, 140); });
      icon(960, T.rc2, () => { for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) g.drawImage(mat.tile, -100 + i * 34, -100 + j * 34, 30, 30); for (const sx of [-1, 1]) { g.fillStyle = '#20242e'; g.fillRect(sx * 150 - 26, -90, 52, 180); g.strokeStyle = 'rgba(200,210,230,0.5)'; g.strokeRect(sx * 150 - 26, -90, 52, 180); } });
      icon(1440, T.rc3, () => { g.globalCompositeOperation = 'lighter'; const grd = g.createLinearGradient(0, -200, 0, 60); grd.addColorStop(0, 'rgba(155,123,255,0)'); grd.addColorStop(1, 'rgba(155,123,255,0.5)'); g.fillStyle = grd; g.beginPath(); g.moveTo(-40, -200); g.lineTo(40, -200); g.lineTo(110, 40); g.lineTo(-110, 40); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over'; WO.drawWafer(g, 0, 60, 130, { tilt: 0.35, t, dies: 8 }); });
      g.globalAlpha = 1;
    }
    // 6 · back to the screen, and into one dot (ai08 → end)
    const vE = WO.k(t, T.fin - 0.2, T.fin + 0.8);
    if (vE > 0) {
      g.globalAlpha = vE;
      const dive = WO.ease.io(WO.k(t, T.dive, E('ai08') + 1.6));
      const z = WO.lerp(0.82, 1, WO.ease.out(WO.k(t, T.fin, T.fin + 2))) * Math.pow(46, dive);
      const cam = { z, fx: WO.lerp(96, 130.5, dive), fy: WO.lerp(54, 54.5, dive) };
      WO.drawScreen(g, mat.pic, cam);
      if (z < 0.999) { const w = 1920 * z, h = 1080 * z, x = 960 - w / 2, y = 540 - h / 2; g.fillStyle = '#05060a'; g.fillRect(0, 0, 1920, y); g.fillRect(0, y + h, 1920, 1080 - y - h); g.fillRect(0, y, x, h); g.fillRect(x + w, y, 1920 - x - w, h); g.strokeStyle = '#1c2230'; g.lineWidth = 16; g.strokeRect(x - 8, y - 8, w + 16, h + 16); }
      g.globalAlpha = 1;
      return;
    }
    H.keyLight(g, 1);
  });
};
