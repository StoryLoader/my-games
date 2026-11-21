/* seg/sw.js — chapter 2 「계산기 하나는 무엇으로 만드나?」: transistor → 1/0 → AND, XOR → 1+1=10 → adder row → core. */
window.SEG = window.SEG || {};
window.SEG.sw = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="sw">
      <canvas class="world"></canvas>
      <p class="t lbl ctr l-tr" style="top:800px;font-size:64px">트랜지스터<i>전기로 켜고 끄는 스위치</i></p>
      <p class="t hero m onc v-on" style="left:1390px;top:190px">켜짐</p>
      <p class="t hero m v-off" style="left:1390px;top:190px;color:#6b7590">꺼짐</p>
      <p class="t hero xl onc b-1" style="left:1560px;top:560px">1</p>
      <p class="t hero xl b-0" style="left:1560px;top:560px;color:#7c879f">0</p>
      <p class="t hero xl ag ctr dec" style="top:180px"><span class="v">0</span></p>
      <p class="t sub ctr dec-s" style="top:780px">우리가 쓰는 숫자 ↔ <b>1과 0</b>만으로</p>
      <p class="t lbl ctr l-gate" style="top:150px;font-size:72px">논리 게이트<i>스위치 몇 개를 묶어 신호를 판단</i></p>
      <p class="t lbl l-and" style="left:1300px;top:150px;font-size:60px"><span class="au">AND</span><i>둘 다 1일 때만 1</i></p>
      <p class="t lbl l-xor" style="left:1300px;top:590px;font-size:60px"><span class="cu">XOR</span><i>딱 하나만 1일 때 1</i></p>
      <p class="t hero l ctr eq" style="top:110px"><span class="ag">1 + 1 = </span><span class="au">10</span></p>
      <p class="t sub ctr eq-s" style="top:310px">1과 0만 쓰는 세계(2진법)</p>
      <p class="t hero m ctr eq2" style="top:380px"><span class="ag">우리 숫자로</span> <span class="au">2</span></p>
      <p class="t sub carry" style="left:1395px;top:760px;font-size:36px"><b>올림수</b></p>
      <p class="t lbl ctr l-add" style="top:150px;font-size:60px">한 자리 덧셈 묶음<i>XOR + AND</i></p>
      <p class="t hero m ctr mul" style="top:760px;font-size:96px"><span class="au">3 × 4</span><span class="ag"> = 4 + 4 + 4</span></p>
      <p class="t hero xl au ctr core" style="top:120px">코어</p>
      <p class="t sub ctr core-s" style="top:850px">덧셈과 곱셈을 해내는 <b>작은 계산 장치</b></p>
      <p class="t lbl rc1" style="left:260px;top:700px;font-size:50px">스위치</p>
      <p class="t lbl rc2" style="left:860px;top:700px;font-size:50px">게이트</p>
      <p class="t lbl rc3" style="left:1500px;top:700px;font-size:50px">코어</p>
      <p class="t hero m ag sc-n" style="left:150px;top:170px;font-size:88px">830만 × 60</p>
      <p class="t sub sc-s" style="left:156px;top:285px">코어 하나로는 <b>한참 모자람</b></p>
      ${H.card(2, '계산기 하나는 무엇으로 만드나?', '계산기 하나')}
    </section>`);
  scene(el, win.a, win.b + 1.3);
  H.sweep(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('sw01') + 1.2);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const vis = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(WO.k(t, a, a + fi), 1 - WO.k(t, b - fo, b));

  const T = {
    tr: S('sw01') + 1.3, on1: about('sw02', '통하면', -0.1), off1: about('sw02', '막히면', 0), one: about('sw03', '켜진', 0), zero: about('sw03', '꺼진', 0),
    num: about('sw03', '모든 숫자', -0.3), gate: S('sw04') + 0.2, gateL: about('sw04', '논리 게이트', -0.3), and: S('sw05'), xor: S('sw06'), both: S('sw07'),
    eq: about('sw08', '1 더하기', -0.3), eq2: about('sw08', '2죠', -0.3), add: S('sw09'), xorO: about('sw09', '오른쪽', -0.2), andO: about('sw09', '왼쪽', -0.2), carry: about('sw09', '올림수', -0.2),
    pack: S('sw10') + 0.2, row: about('sw10', '여러 개', -0.3), mul: about('sw10', '곱셈', -0.6), core: S('sw11'), coreW: about('sw11', '코어', -0.3),
    rc: S('sw12'), rc1: about('sw12', '스위치', -0.2), rc2: about('sw12', '게이트를', -0.2), rc3: about('sw12', '코어를', -0.2),
    one1: S('sw13'), copy: about('sw13', '엄청나게', -0.3),
  };
  T.endTr = T.num;            // the transistor scene gives way to the binary count
  // texts
  H.show(Q('.l-tr'), T.tr + 0.4, T.num - 0.2, { y: 30 });
  // on/off words and digits toggle with the gate
  gsap.set([Q('.v-on'), Q('.v-off'), Q('.b-1'), Q('.b-0')], { autoAlpha: 0 });
  tl.fromTo(Q('.v-on'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, T.on1);
  tl.fromTo(Q('.v-on'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, T.off1);
  tl.fromTo(Q('.v-off'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, T.off1);
  tl.fromTo(Q('.v-off'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, T.one - 0.3);
  H.show(Q('.b-1'), T.one, T.zero, { scale: 0.7, y: 0 }, { y: -20 });
  H.show(Q('.b-0'), T.zero, T.num - 0.2, { scale: 0.7, y: 0 }, { y: -20 });
  // the binary count (sw03 end)
  H.show(Q('.dec'), T.num + 0.3, T.gate, { y: 30 });
  H.show(Q('.dec-s'), T.num + 0.6, T.gate, { y: 20 });
  const countDur = Math.max(1.5, T.gate - T.num - 1.2);
  const decV = Q('.dec .v'), cnt = { v: 0 };
  tl.fromTo(cnt, { v: 0 }, { v: 13, duration: countDur, ease: 'none', immediateRender: false, onUpdate: () => { decV.textContent = Math.floor(cnt.v); } }, T.num + 0.5);
  H.show(Q('.l-gate'), T.gateL, T.and - 0.2, { y: 30 });
  H.show(Q('.l-and'), T.and + 0.2, T.eq - 0.3, { x: 40, y: 0 });
  H.show(Q('.l-xor'), T.xor + 0.2, T.eq - 0.3, { x: 40, y: 0 });
  H.show(Q('.eq'), T.eq, T.add, { y: 30 }); H.show(Q('.eq-s'), T.eq + 0.4, T.add, { y: 20 }); H.show(Q('.eq2'), T.eq2, T.add, { y: 30 });
  H.show(Q('.carry'), T.carry, T.pack, { y: 20 });
  H.show(Q('.l-add'), T.pack + 0.3, T.core, { y: 30 });
  H.show(Q('.mul'), T.mul, T.coreW - 0.1, { y: 30 });
  H.show(Q('.core'), T.coreW, T.rc, { y: 40, scale: 0.94 }); H.show(Q('.core-s'), T.coreW + 0.4, T.rc, { y: 20 });
  H.show(Q('.rc1'), T.rc1, T.one1, { y: 20 }); H.show(Q('.rc2'), T.rc2, T.one1, { y: 20 }); H.show(Q('.rc3'), T.rc3, T.one1, { y: 20 });
  H.show(Q('.sc-n'), T.one1 + 0.6, win.b, { y: 30 }); H.show(Q('.sc-s'), T.one1 + 1.0, win.b, { y: 20 });

  // ---------- drawing ----------
  const font = (w, s) => `${w} ${s}px Pretendard, sans-serif`;
  /** a gate box at (x, y) scale s: inputs a, b (0..1), output o, named; dim 0..1 */
  function gate(t, x, y, s, name, a, b, o, opt = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= opt.alpha ?? 1;
    if (!opt.noInputs) {
      WO.wire(g, [[-420, -60], [-150, -60]], a, t, WO.C.on, 12); WO.wire(g, [[-420, 60], [-150, 60]], b, t, WO.C.on, 12);
      WO.lamp(g, -440, -60, 26, a); WO.lamp(g, -440, 60, 26, b);
      g.fillStyle = 'rgba(200,210,230,0.75)'; g.font = font(700, 30); g.textAlign = 'center'; g.fillText(a > 0.5 ? '1' : '0', -500, -50); g.fillText(b > 0.5 ? '1' : '0', -500, 70);
    }
    if (!opt.noOut) { WO.wire(g, [[150, 0], [opt.outTo ?? 380, 0]], o, t, WO.C.on, 12); if (!opt.noLamp) { WO.lamp(g, 400, 0, 34, o); g.fillStyle = 'rgba(220,230,245,0.9)'; g.font = font(800, 40); g.textAlign = 'center'; g.fillText(o > 0.5 ? '1' : '0', 400, 90); } }
    // the box: a dark die with a copper rim, label engraved
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-150, -112, 300, 236);
    const bg = g.createLinearGradient(-150, -120, 150, 120); bg.addColorStop(0, '#1f2850'); bg.addColorStop(1, '#0c1222'); g.fillStyle = bg; g.fillRect(-150, -120, 300, 240);
    g.strokeStyle = opt.rim || '#d08a50'; g.lineWidth = 5; g.strokeRect(-150, -120, 300, 240);
    g.strokeStyle = 'rgba(255,240,220,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-148, 118); g.lineTo(-148, -118); g.lineTo(148, -118); g.stroke();
    // inside: two little switches (the switches it is made of)
    for (const sx of [-60, 60]) { g.fillStyle = '#2a3452'; g.fillRect(sx - 34, 30, 68, 50); g.fillStyle = '#9aa6bd'; g.fillRect(sx - 7, 20, 14, 70); }
    g.fillStyle = opt.color || '#f2c14e'; g.font = font(800, 64); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 0, -30);
    if (opt.glow) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(242,193,78,${0.18 * opt.glow})`; g.fillRect(-160, -130, 320, 260); g.globalCompositeOperation = 'source-over'; }
    g.restore();
  }
  // AND/XOR truth-table playthrough: four combos in a cue's window
  const COMBOS = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const combo = (t, a, b) => { const k = WO.clamp((t - a) / (b - a), 0, 0.999); return COMBOS[Math.floor(k * 4)]; };

  const rowR = WO.rand(77);
  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.4) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.lineCap = 'butt'; g.lineJoin = 'miter';
    H.ground(g, t, 1.25, 0, 0, 0.58);

    // 1 · the transistor (sw01–sw03)
    const vTr = vis(t, T.tr - 0.4, T.num + 0.3, 0.8, 0.5);
    if (vTr > 0) {
      const open = Math.max(WO.k(t, T.on1, T.on1 + 0.35) * (1 - WO.k(t, T.off1, T.off1 + 0.3)), WO.k(t, T.one - 0.3, T.one) * (1 - WO.k(t, T.zero - 0.1, T.zero + 0.2)));
      g.globalAlpha = vTr;
      WO.wire(g, [[150, 520], [520, 520]], open > 0 ? 1 : 0.15, t, WO.C.on, 14);
      WO.wire(g, [[1200, 520], [1400, 520], [1400, 700]], open, t, WO.C.on, 14);
      // a source of power on the left
      g.fillStyle = '#1a2032'; g.fillRect(70, 450, 90, 140); g.strokeStyle = '#d08a50'; g.lineWidth = 4; g.strokeRect(70, 450, 90, 140);
      g.fillStyle = '#d08a50'; g.font = font(800, 54); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', 115, 520);
      WO.transistor(g, 860, 520, 2.3 * (0.92 + 0.08 * WO.ease.out(WO.k(t, T.tr - 0.4, T.tr + 0.6))), open, t, { gateGlow: true });
      WO.lamp(g, 1400, 760, 50, open);
      g.globalAlpha = 1;
    }
    // 1b · the binary count: eight lamps showing the number in 1s and 0s
    const vNum = vis(t, T.num + 0.3, T.gate + 0.2, 0.5, 0.5);
    if (vNum > 0) {
      const n = Math.floor(WO.clamp((t - T.num - 0.5) / countDur * 13, 0, 13));
      g.globalAlpha = vNum;
      for (let i = 0; i < 8; i++) { const bit = (n >> (7 - i)) & 1, x = 960 - 3.5 * 150 + i * 150; WO.lamp(g, x, 620, 46, bit); g.fillStyle = bit ? '#bff5e6' : '#5b6680'; g.font = font(800, 54); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(bit, x, 720); }
      g.globalAlpha = 1;
    }
    // 2 · gates (sw04–sw09)
    const vG = vis(t, T.gate, T.pack + 0.6, 0.6, 0.6);
    if (vG > 0) {
      g.globalAlpha = vG * (1 - 0.9 * vis(t, T.eq - 0.2, T.add + 0.1, 0.4, 0.4));
      // positions: one gate in the middle (sw04–05), then AND above + XOR below
      const split = WO.ease.io(WO.k(t, T.xor - 0.5, T.xor + 0.4));
      const ax = WO.lerp(960, 760, split), ay = WO.lerp(560, 330, split), s = WO.lerp(1.1, 0.85, split);
      let A = 0, B = 0, oA = 0, oX = 0;
      if (t < T.and) { A = 0; B = 0; }
      else if (t < T.xor) { [A, B] = combo(t, T.and + 0.8, T.xor - 0.1); }
      else if (t < T.both) { [A, B] = combo(t, T.xor + 0.4, T.both - 0.1); }
      else { A = 1; B = 1; }
      oA = A && B ? 1 : 0; oX = A !== B ? 1 : 0;
      const nameA = t < T.and - 0.1 ? '?' : 'AND';
      const add = t > T.add - 0.1;
      gate(t, ax, ay, s, nameA, A, B, oA, { glow: t > T.and && t < T.xor ? 1 : 0, outTo: add ? 420 : 380, noLamp: add });
      if (split > 0) gate(t, 760, WO.lerp(900, 760, split), 0.85, 'XOR', A, B, oX, { alpha: split, rim: '#e08a4a', color: '#ffb27a', glow: t > T.xor && t < T.both ? 1 : 0, noLamp: add });
      // sw09: the two outputs land in the two digit slots
      if (add) {
        const va = WO.k(t, T.add, T.add + 0.5);
        const slot = (x, y, d, on, lab) => { g.save(); g.globalAlpha = g.globalAlpha * va; g.fillStyle = '#0c1222'; g.fillRect(x - 90, y - 110, 180, 220); g.strokeStyle = on ? '#f2c14e' : '#3a4664'; g.lineWidth = 5; g.strokeRect(x - 90, y - 110, 180, 220);
          if (d !== null) { g.fillStyle = d ? '#f2c14e' : '#cfd8ea'; g.font = font(800, 170); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d, x, y + 8); } g.restore(); };
        const xo = WO.k(t, T.xorO, T.xorO + 0.5), an = WO.k(t, T.andO, T.andO + 0.5);
        slot(1480, 545, an > 0.5 ? 1 : null, an > 0.5, 'L'); slot(1700, 545, xo > 0.5 ? 0 : null, xo > 0.5, 'R');
        // the flows into the slots
        WO.wire(g, [[ax + 0.85 * 420, 330], [1480, 330], [1480, 435]], an, t, WO.C.core, 10);
        WO.wire(g, [[760 + 0.85 * 420, 760], [1700, 760], [1700, 655]], 0.15 + 0.2 * xo, t, WO.C.on, 10);
      }
      g.globalAlpha = 1;
    }
    // 3 · the adder pack → row → core (sw10–sw11)
    const vP = vis(t, T.pack, T.rc + 0.4, 0.6, 0.6);
    if (vP > 0) {
      g.globalAlpha = vP;
      const rowK = WO.ease.io(WO.k(t, T.row, T.row + 1.6)), fold = WO.ease.io(WO.k(t, T.core - 0.2, T.core + 1.2));
      const n = 8, gapX = 190, w0 = 1.0;
      for (let i = 0; i < n; i++) {
        const show = i === 0 ? 1 : WO.k(t, T.row + i * 0.12, T.row + i * 0.12 + 0.5);
        if (show <= 0) continue;
        let x = WO.lerp(960, 960 + (i - (n - 1) / 2) * gapX, rowK), y = 520, s = WO.lerp(1.6, 0.7, rowK) * w0;
        x = WO.lerp(x, 960, fold); y = WO.lerp(y, 540, fold); s = WO.lerp(s, 0.6, fold);
        g.save(); g.globalAlpha = vP * show * (1 - fold * (i > 0 ? 1 : 0.0)); g.translate(x, y); g.scale(s, s);
        // the pack: XOR + AND in one box
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(-82, -92, 164, 196);
        const bg = g.createLinearGradient(-80, -100, 80, 100); bg.addColorStop(0, '#2a2a4a'); bg.addColorStop(1, '#141a2c'); g.fillStyle = bg; g.fillRect(-80, -100, 160, 200);
        g.strokeStyle = '#f2c14e'; g.lineWidth = 4; g.strokeRect(-80, -100, 160, 200);
        g.fillStyle = '#ffb27a'; g.font = font(800, 34); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('XOR', 0, -40); g.fillStyle = '#f2c14e'; g.fillText('AND', 0, 30);
        g.restore();
        // carry arrows between neighbours
        if (i > 0 && rowK > 0.9 && fold < 0.2) { const xa = 960 + (i - (n - 1) / 2) * gapX - gapX + 60, k = (t * 1.5 + i * 0.2) % 1; g.strokeStyle = `rgba(242,193,78,${0.7 * vP})`; g.lineWidth = 4; g.beginPath(); g.moveTo(xa, 600); g.lineTo(xa + 70, 600); g.stroke(); g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(xa + k * 70, 600, 6, 0, 6.283); g.fill(); }
      }
      // the core tile emerges from the fold
      if (fold > 0) { const s = 300 * WO.ease.back(WO.k(t, T.core + 0.3, T.core + 1.4)); if (s > 1) { g.globalAlpha = vP * WO.k(t, T.core + 0.3, T.core + 0.8); g.globalCompositeOperation = 'lighter'; g.drawImage(sp.glowGold, 960 - s, 560 - s * 0.6, s * 2, s * 1.4); g.globalCompositeOperation = 'source-over'; g.drawImage(mat.tileBig, 960 - s / 2, 560 - s / 2, s, s); } }
      g.globalAlpha = 1;
    }
    // 4 · recap: switch → gate → core (sw12)
    const vR = vis(t, T.rc, T.one1 + 0.3, 0.5, 0.5);
    if (vR > 0) {
      const ic = (x, t0, draw) => { const k = WO.ease.back(WO.k(t, t0, t0 + 0.6)); if (k <= 0) return; g.save(); g.globalAlpha = vR * Math.min(1, k); g.translate(x, 520); g.scale(k, k); draw(); g.restore(); };
      ic(340, T.rc1, () => WO.transistor(g, 0, 0, 0.8, 0.5 + 0.5 * Math.sin(t * 4), t));
      ic(960, T.rc2, () => gate(t, 0, 0, 0.8, 'AND', 1, 1, 1, { noInputs: true, noOut: true }));
      ic(1580, T.rc3, () => { g.drawImage(mat.tileBig, -110, -110, 220, 220); });
      g.globalAlpha = vR; g.fillStyle = '#9aa6bd'; g.font = font(700, 70); g.textAlign = 'center'; g.textBaseline = 'middle';
      if (t > T.rc2) g.fillText('→', 650, 520); if (t > T.rc3) g.fillText('→', 1270, 520);
      g.globalAlpha = 1;
    }
    // 5 · one core is not enough → copies (sw13)
    const vC = vis(t, T.one1, win.b + 1.3, 0.6, 0.3);
    if (vC > 0) {
      g.globalAlpha = vC;
      // the screen being painted by one core, slowly, one dot at a time
      const sx = 160, sy = 360, sw = 640, sh = 360, P = mat.pic;
      g.fillStyle = '#05060a'; g.fillRect(sx - 10, sy - 10, sw + 20, sh + 20); g.strokeStyle = '#2a3346'; g.lineWidth = 6; g.strokeRect(sx - 10, sy - 10, sw + 20, sh + 20);
      const cols = 64, rows = 36, cw = sw / cols, done = Math.floor((t - T.one1) * 70);
      for (let k = 0; k < Math.min(done, cols * rows); k++) { const i = k % cols, j = (k / cols) | 0, c = P.px[Math.floor(j * 3) * P.cw + Math.floor(i * 3)]; g.fillStyle = WO.rgb(c); g.fillRect(sx + i * cw, sy + j * cw, cw - 0.5, cw - 0.5); }
      const ci = done % cols, cj = (done / cols) | 0; g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(sx + ci * cw - 1, sy + cj * cw - 1, cw + 2, cw + 2);
      // the core(s)
      const copies = t < T.copy ? 1 : Math.pow(2, Math.min(6, Math.floor((t - T.copy) / 0.5) + 1));
      const side = Math.ceil(Math.sqrt(copies)), cell = Math.min(260, 460 / side), ox = 1380 - (side * cell) / 2, oy = 560 - (side * cell) / 2;
      for (let k = 0; k < copies; k++) { const i = k % side, j = (k / side) | 0, bornK = t < T.copy ? 1 : WO.k(t, T.copy + Math.log2(Math.max(1, k + 1)) * 0.5 - 0.5, T.copy + Math.log2(Math.max(1, k + 1)) * 0.5); g.globalAlpha = vC * Math.max(0.15, bornK); g.drawImage(mat.tileBig, ox + i * cell + cell * 0.06, oy + j * cell + cell * 0.06, cell * 0.88, cell * 0.88); }
      g.globalAlpha = vC; g.fillStyle = '#f2c14e'; g.font = font(800, 54); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(t < T.copy ? '코어 1개' : `코어 ${copies}개`, 1380, 900);
      g.globalAlpha = 1;
    }
    H.keyLight(g, 1);
  });
};
