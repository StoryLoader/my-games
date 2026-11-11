/* seg/fb.js — chapter 4 「설계도는 어떻게 진짜 칩이 되나?」: sand → 9N silicon → ingot → wafer → light through a mask → EUV → layers → saw → 800억 → package. */
window.SEG = window.SEG || {};
window.SEG.fb = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="fb">
      <canvas class="world"></canvas>
      <p class="t lbl l-q" style="left:150px;top:150px;font-size:60px">석영 모래<i>모래 속 석영(이산화 규소)</i></p>
      <p class="t lbl l-si" style="left:1250px;top:150px;font-size:60px"><span class="ag">실리콘</span><i>칩의 재료</i></p>
      <p class="t hero l ag ctr pure" style="top:300px"><span class="v">99.</span><span class="unit">%</span></p>
      <p class="t sub ctr s-pure" style="top:500px">9가 <b>아홉 개</b> · 거의 완벽하게 깨끗하게</p>
      <p class="t lbl l-ing" style="left:1180px;top:240px;font-size:56px">결정 기둥<i>녹인 실리콘에서 천천히 뽑아 올림</i></p>
      <p class="t lbl l-waf" style="left:1260px;top:300px;font-size:64px"><span class="ag">웨이퍼</span><i>지름 30 cm의 둥근 판</i></p>
      <p class="t lbl ctr l-photo" style="top:100px;font-size:60px">사진을 찍듯이<i>빛으로 설계도를 새긴다</i></p>
      <p class="t lbl l-resist" style="left:120px;top:300px;font-size:46px"><span class="cu">감광 약품</span><i>빛을 받으면 성질이 바뀜</i></p>
      <p class="t lbl l-mask" style="left:1380px;top:300px;font-size:46px">설계도 무늬<i>마스크</i></p>
      <p class="t hero l ctr euv" style="top:180px"><span class="euvc">13.5</span><span class="unit euvc">nm</span></p>
      <p class="t sub ctr s-euv" style="top:380px"><b>극자외선(EUV)</b> · 눈에 보이는 빛보다 훨씬 짧은 물결</p>
      <p class="t sub ctr s-nm" style="top:870px">1나노미터 = <b>10억 분의 1미터</b></p>
      <p class="t lbl l-tin" style="left:1280px;top:160px;font-size:52px">주석 방울<i>진공 속을 날아간다</i></p>
      <p class="t hero m au tin-n" style="left:150px;top:160px;font-size:110px">1초에 5만 번</p>
      <p class="t sub tin-s" style="left:156px;top:290px"><b>레이저</b>로 때려 빛을 만든다</p>
      <p class="t hero m ag ctr steps" style="top:120px;font-size:110px">수천 단계 · 석 달+</p>
      <p class="t sub ctr s-steps" style="top:250px">찍고 · 깎고 · 쌓고 — <b>수십 겹</b></p>
      <p class="t lbl l-saw" style="left:1300px;top:180px;font-size:56px">다이아몬드 톱<i>우표만 한 칩으로</i></p>
      <p class="t hero xl au ctr n800" style="top:130px"><span class="v">0</span><span class="unit">개</span></p>
      <p class="t sub ctr s800" style="top:390px"><b>H100</b> 칩 하나에 든 트랜지스터</p>
      <p class="t lbl one1" style="left:250px;top:720px;font-size:56px">스위치 1개</p>
      <p class="t lbl one2" style="left:1250px;top:720px;font-size:56px"><span class="au">800억 개</span></p>
      <p class="t hero m au ctr done" style="top:60px">GPU 완성</p>
      <p class="t sub ctr s-done" style="top:190px">칩 + 메모리 + 기판</p>
      <p class="t hero xl ctr aiw" style="top:380px"><span class="au">인공지능</span></p>
      ${H.card(4, '설계도는 어떻게 진짜 칩이 되나?', '진짜 칩')}
    </section>`);
  scene(el, win.a, win.b + 1.3);
  H.sweep(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('fb01') + 1.2);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const vis = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(WO.k(t, a, a + fi), 1 - WO.k(t, b - fo, b));
  const font = (w, s) => `${w} ${s}px Pretendard, sans-serif`;

  const T = {
    sand: S('fb01'), si: about('fb01', '실리콘은', -0.3), pure: S('fb02'), ing: S('fb03'), pull: S('fb03') + 0.6, cut: about('fb03', '얇게', -0.2), waf: about('fb03', '웨이퍼', -0.3),
    photo: S('fb04') + 0.2, resist: about('fb05', '약품', -0.6), mask: about('fb05', '설계도', -0.4), light: about('fb05', '비추면', -0.4), print: about('fb05', '찍힙니다', -0.6),
    euv: S('fb06'), nm: about('fb06', '1나노미터는', -0.3), tin: S('fb07'), n5: about('fb07', '5만', -0.3), lay: S('fb08'), steps: about('fb08', '수천', -0.3),
    saw: S('fb09'), sawGo: about('fb09', '다이아몬드', -0.3), lift: about('fb09', '우표', -0.4), h100: S('fb10'), n800: about('fb10', '800억', -0.3),
    one: S('fb11'), pkg: S('fb12'), wrap: about('fb12', '감싸면', -0.4), ai: S('fb13'), aiw: about('fb13', '인공지능', -0.3),
  };
  H.show(Q('.l-q'), T.sand + 1.2, T.pure - 0.1, { y: 20 }); H.show(Q('.l-si'), T.si, T.pure - 0.1, { y: 20 });
  H.show(Q('.pure'), T.pure + 0.2, T.ing - 0.1, { scale: 0.92, y: 0 }); H.show(Q('.s-pure'), about('fb02', '9가', -0.2), T.ing - 0.1, { y: 20 });
  { const v = Q('.pure .v'), o = { v: 0 }; tl.fromTo(o, { v: 0 }, { v: 7, duration: 2.2, ease: 'none', immediateRender: false, onUpdate: () => { v.textContent = '99.' + '9'.repeat(Math.floor(o.v)); } }, T.pure + 0.6); }
  H.show(Q('.l-ing'), T.pull + 0.3, T.cut, { x: 30, y: 0 }); H.show(Q('.l-waf'), T.waf, T.photo, { x: 30, y: 0 });
  H.show(Q('.l-photo'), T.photo + 0.3, T.resist, { y: 20 });
  H.show(Q('.l-resist'), T.resist + 0.3, T.euv - 0.2, { x: -30, y: 0 }); H.show(Q('.l-mask'), T.mask + 0.3, T.euv - 0.2, { x: 30, y: 0 });
  H.show(Q('.euv'), T.euv + 0.2, T.tin - 0.1, { scale: 0.9, y: 0 }); H.show(Q('.s-euv'), T.euv + 0.7, T.tin - 0.1, { y: 20 }); H.show(Q('.s-nm'), T.nm, T.tin - 0.1, { y: 20 });
  H.show(Q('.l-tin'), T.tin + 0.4, T.lay - 0.1, { x: 30, y: 0 }); H.show(Q('.tin-n'), T.n5, T.lay - 0.1, { y: 30 }); H.show(Q('.tin-s'), T.n5 + 0.4, T.lay - 0.1, { y: 20 });
  H.show(Q('.steps'), T.steps, T.saw - 0.1, { y: 30 }); H.show(Q('.s-steps'), T.lay + 0.6, T.saw - 0.1, { y: 20 });
  H.show(Q('.l-saw'), T.sawGo, T.h100 - 0.1, { x: 30, y: 0 });
  H.show(Q('.n800'), T.n800, T.one - 0.1, { scale: 0.9, y: 0 }); H.show(Q('.s800'), T.n800 + 0.4, T.one - 0.1, { y: 20 });
  H.count(Q('.n800 .v'), 0, 800, T.n800, T.n800 + 1.6, (v) => `${Math.round(v)}억`, 'expo.out');
  H.show(Q('.one1'), T.one + 0.2, T.pkg - 0.1, { y: 20 }); H.show(Q('.one2'), T.one + 1.2, T.pkg - 0.1, { y: 20 });
  H.show(Q('.done'), T.wrap + 0.4, T.aiw - 0.2, { y: 30 }); H.show(Q('.s-done'), T.wrap + 0.8, T.aiw - 0.2, { y: 20 });
  H.show(Q('.aiw'), T.aiw, win.b + 0.4, { scale: 0.9, y: 0 });

  const GR = WO.rand(501), bigGrains = Array.from({ length: 34 }, () => ({ x: GR() * 2100 - 90, y: GR() * 1200 - 60, s: 90 + GR() * 220, i: (GR() * 8) | 0, r: GR() * 6.28, d: 0.4 + GR() * 0.8 }));
  const pts = Array.from({ length: 260 }, () => ({ a: GR() * 6.283, r: 300 + GR() * 700, d: GR() }));

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.4) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.lineCap = 'butt'; g.lineJoin = 'miter';
    g.fillStyle = '#06080e'; g.fillRect(0, 0, 1920, 1080);
    // 1 · sand, close (fb01) → purified (fb02)
    const vS = vis(t, win.a, T.ing + 0.5, 0.3, 0.8);
    if (vS > 0) {
      const pur = WO.ease.io(WO.k(t, T.pure + 0.2, T.pure + 3.2));
      g.globalAlpha = vS;
      const bg = g.createRadialGradient(700, 300, 50, 960, 540, 1300); bg.addColorStop(0, '#3a2e22'); bg.addColorStop(1, '#0a0806'); g.fillStyle = bg; g.globalAlpha = vS * (1 - pur); g.fillRect(0, 0, 1920, 1080);
      for (const p of bigGrains) {
        const x = WO.lerp(p.x + Math.sin(t * 0.3 * p.d) * 20, 960, pur), y = WO.lerp(p.y - (t - win.a) * 6 * p.d, 560, pur), s = p.s * (1 - pur * 0.9);
        g.save(); g.globalAlpha = vS * (1 - pur * 0.8); g.translate(x, y); g.rotate(p.r + t * 0.05 * p.d); g.drawImage(sp.grains[p.i], -s / 2, -s / 2, s, s); g.restore();
      }
      // a bright pure crystal forming in the centre
      if (pur > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = vS * pur; g.drawImage(sp.glowWhite, 960 - 260, 560 - 260, 520, 520);
        g.save(); g.translate(960, 640); g.rotate(Math.PI / 4); g.fillStyle = `rgba(190,205,235,${0.8 * pur})`; g.fillRect(-90, -90, 180, 180); g.restore(); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1;
    }
    // 2 · ingot pulled from the melt (fb03), sliced into a wafer
    const vI = vis(t, T.ing - 0.2, T.photo + 0.8, 0.7, 0.8);
    if (vI > 0) {
      g.globalAlpha = vI;
      H.keyLight(g, 0.3, 1);
      const pull = WO.ease.io(WO.k(t, T.pull, T.cut)), cut = WO.ease.io(WO.k(t, T.cut, T.waf + 0.6)), out = WO.ease.io(WO.k(t, T.waf - 0.6, T.waf + 0.6));
      const cx = WO.lerp(820, 520, out);
      // crucible + glowing melt
      g.save(); g.globalAlpha = vI * (1 - out);
      g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(cx, 900, 20, cx, 900, 420); gl.addColorStop(0, 'rgba(255,150,60,0.6)'); gl.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gl; g.fillRect(cx - 450, 500, 900, 580); g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#ffb35a'; g.beginPath(); g.ellipse(cx, 880, 300, 50, 0, 0, 6.283); g.fill();
      g.fillStyle = '#3a3f4e'; g.beginPath(); g.moveTo(cx - 320, 880); g.lineTo(cx - 280, 1060); g.lineTo(cx + 280, 1060); g.lineTo(cx + 320, 880); g.closePath(); g.fill();
      g.restore();
      // the ingot
      const top = WO.lerp(860, 140, pull), bot = 880 - 10, w = 260;
      if (pull > 0) {
        g.save(); g.globalAlpha = vI * (1 - out * 0.85);
        const grd = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); grd.addColorStop(0, '#2a2f3e'); grd.addColorStop(0.25, '#c9d2e6'); grd.addColorStop(0.45, '#6e7890'); grd.addColorStop(1, '#1a1e2a');
        g.fillStyle = grd; g.fillRect(cx - w / 2, top, w, bot - top);
        g.fillStyle = '#8f9ab3'; g.beginPath(); g.ellipse(cx, top, w / 2, 22, 0, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'lighter'; const hot = g.createLinearGradient(0, bot - 160, 0, bot); hot.addColorStop(0, 'rgba(255,120,40,0)'); hot.addColorStop(1, 'rgba(255,140,50,0.7)'); g.fillStyle = hot; g.fillRect(cx - w / 2, bot - 160, w, 160); g.globalCompositeOperation = 'source-over';
        // the slice line
        if (cut > 0 && cut < 1) { g.strokeStyle = `rgba(255,255,255,${0.9 * (1 - cut)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, 520, w / 2, 22, 0, 0, 6.283); g.stroke(); }
        g.restore();
      }
      // the wafer separating and turning to face us
      if (cut > 0) { const R = WO.lerp(130, 380, out), y = WO.lerp(520, 560, out); WO.drawWafer(g, WO.lerp(cx, 960, out), y, R, { tilt: WO.lerp(0.17, 1, out), t }); }
      g.globalAlpha = 1;
    }
    // 3 · printing with light (fb04–fb05)
    const vL = vis(t, T.photo - 0.4, T.euv + 0.4, 0.6, 0.6);
    if (vL > 0) {
      g.globalAlpha = vL;
      const persp = WO.ease.io(WO.k(t, T.resist - 0.4, T.resist + 0.8)), cy = WO.lerp(560, 760, persp), tilt = WO.lerp(1, 0.38, persp), R = WO.lerp(380, 480, persp);
      const coat = WO.k(t, T.resist, T.resist + 1.4), maskK = WO.ease.out(WO.k(t, T.mask, T.mask + 1)), lightK = WO.k(t, T.light, T.light + 0.6), printK = WO.k(t, T.print, T.print + 1.2);
      WO.drawWafer(g, 960, cy, R, { tilt, t, dies: printK > 0 ? 12 : 0, grid: printK });
      // the photoresist: an amber film spreading from the centre
      if (coat > 0) { g.save(); g.translate(960, cy); g.scale(1, tilt); g.globalAlpha = vL * 0.45 * (1 - printK * 0.5); g.fillStyle = '#e8a040'; g.beginPath(); g.arc(0, 0, R * WO.ease.out(coat), 0, 6.283); g.fill(); g.restore(); }
      // the mask above: a plate with the pattern
      if (maskK > 0) {
        const my = WO.lerp(-200, 420, maskK);
        g.save(); g.translate(960, my); g.scale(1, 0.38); g.globalAlpha = vL * maskK;
        g.fillStyle = 'rgba(20,24,40,0.92)'; g.fillRect(-420, -420, 840, 840); g.strokeStyle = 'rgba(200,215,255,0.6)'; g.lineWidth = 6; g.strokeRect(-420, -420, 840, 840);
        g.fillStyle = 'rgba(190,210,255,0.55)'; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { if (Math.hypot(i - 5.5, j - 5.5) > 6.2) continue; g.fillRect(-360 + i * 60 + 6, -360 + j * 60 + 6, 48, 48); }
        g.restore();
      }
      // the light: violet columns from the top through the mask down to the wafer
      if (lightK > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = vL * lightK * (0.7 + 0.3 * Math.sin(t * 9));
        const grd = g.createLinearGradient(0, 0, 0, cy); grd.addColorStop(0, 'rgba(155,123,255,0.0)'); grd.addColorStop(0.4, 'rgba(155,123,255,0.35)'); grd.addColorStop(1, 'rgba(200,180,255,0.5)');
        g.fillStyle = grd; g.beginPath(); g.moveTo(760, 0); g.lineTo(1160, 0); g.lineTo(960 + R, cy); g.lineTo(960 - R, cy); g.closePath(); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
    }
    // 4 · EUV wavelength (fb06)
    const vE = vis(t, T.euv, T.tin + 0.4, 0.6, 0.6);
    if (vE > 0) {
      g.globalAlpha = vE;
      const draw = (y, lam, col, lab, amp) => { const k = WO.k(t, T.euv + 0.4, T.euv + 1.6); g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); for (let x = 200; x <= 200 + 1520 * k; x += 2) { const yy = y + Math.sin((x - t * 140) / lam * 6.283) * amp; x === 200 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); g.fillStyle = 'rgba(200,210,230,0.85)'; g.font = font(700, 34); g.textAlign = 'left'; g.fillText(lab, 200, y - amp - 24); };
      draw(560, 300, 'rgba(255,170,90,0.85)', '눈에 보이는 빛', 50);
      g.save(); g.globalCompositeOperation = 'lighter'; draw(740, 26, 'rgba(180,150,255,0.95)', '극자외선', 40); g.restore();
      g.globalAlpha = 1;
    }
    // 5 · tin droplets and laser (fb07)
    const vT = vis(t, T.tin, T.lay + 0.4, 0.6, 0.6);
    if (vT > 0) {
      g.globalAlpha = vT;
      g.fillStyle = '#04050a'; g.fillRect(0, 0, 1920, 1080);
      // vacuum chamber: a mirror bowl
      g.strokeStyle = 'rgba(160,170,200,0.35)'; g.lineWidth = 10; g.beginPath(); g.arc(1000, 560, 380, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
      const period = 0.55, ph = ((t - T.tin) % period) / period;
      for (let k = 0; k < 7; k++) { const y = 120 + ((k / 7 + (t - T.tin) / period / 7) % 1) * 840; if (Math.abs(y - 560) < 30 && ph < 0.25) continue; g.fillStyle = '#c9cdd8'; g.beginPath(); g.arc(1000, y, 9, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(997, y - 3, 3, 0, 6.283); g.fill(); }
      // the laser and the flash
      const flash = Math.max(0, 1 - ph * 4);
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = `rgba(255,70,60,${0.25 + 0.7 * flash})`; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 560); g.lineTo(1000, 560); g.stroke();
      g.globalAlpha = vT * flash; g.drawImage(sp.glowEuv, 1000 - 280, 560 - 280, 560, 560); g.drawImage(sp.glowWhite, 1000 - 70, 560 - 70, 140, 140);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = vT;
      g.fillStyle = 'rgba(255,140,130,0.9)'; g.font = font(700, 34); g.textAlign = 'left'; g.fillText('레이저', 160, 530);
      g.globalAlpha = 1;
    }
    // 6 · layers stacking (fb08): a cross-section
    const vY = vis(t, T.lay, T.saw + 0.4, 0.6, 0.6);
    if (vY > 0) {
      g.globalAlpha = vY;
      H.ground(g, t, 1.2, 0, 0, 0.75);
      const base = 940, n = Math.floor(WO.k(t, T.lay + 0.3, T.saw - 0.6) * 16) + 1;
      g.fillStyle = '#4a5268'; g.fillRect(260, base, 1400, 80);
      const cols = ['#5a6b9a', '#e08a4a', '#2c3a5e', '#9b7bff', '#e08a4a', '#3a6b6a', '#c9d2e6', '#e08a4a'];
      for (let i = 0; i < n; i++) {
        const y = base - (i + 1) * 34, k = i === n - 1 ? WO.k(t, T.lay + 0.3 + (n - 1) * (T.saw - 0.9 - T.lay) / 16, T.lay + 0.6 + (n - 1) * (T.saw - 0.9 - T.lay) / 16) : 1;
        g.fillStyle = cols[i % cols.length]; g.globalAlpha = vY * (0.6 + 0.4 * k);
        // patterned: gaps cut in each layer
        for (let x = 260; x < 1660; x += 70) { if (WO.hash(x, i, 3) < 0.3) continue; g.fillRect(x, y + (1 - k) * -40, 64 - (i % 3) * 10, 30); }
      }
      g.globalAlpha = 1;
    }
    // 7 · the saw, one chip lifted, 800억, 1 → 800억 (fb09–fb11)
    const vD = vis(t, T.saw, T.pkg + 0.6, 0.6, 0.6);
    if (vD > 0) {
      g.globalAlpha = vD;
      H.ground(g, t, 1.2, 0, 0, 0.75);
      const lift = WO.ease.io(WO.k(t, T.lift, T.lift + 1.4)), big = WO.ease.io(WO.k(t, T.h100 - 0.2, T.h100 + 1.2)), side = WO.ease.io(WO.k(t, T.one, T.one + 1));
      g.globalAlpha = vD * (1 - big);
      WO.drawWafer(g, 900, 560, 440, { t, dies: 12, skip: (i, j) => lift > 0.05 && i === 6 && j === 5 });
      // saw lines sweeping across the grid
      const sawK = WO.k(t, T.sawGo, T.lift);
      if (sawK > 0) { g.save(); g.beginPath(); g.arc(900, 560, 440, 0, 6.283); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2; const step = 880 / 12;
        for (let i = 1; i < 12; i++) { const L = WO.clamp(sawK * 2 - i / 12, 0, 1) * 880; g.beginPath(); g.moveTo(460 + i * step, 120); g.lineTo(460 + i * step, 120 + L); g.stroke(); g.beginPath(); g.moveTo(460, 120 + i * step); g.lineTo(460 + L, 120 + i * step); g.stroke(); }
        const hx = 460 + WO.clamp(sawK, 0, 1) * 880; g.globalCompositeOperation = 'lighter'; g.drawImage(sp.glowWhite, hx - 30, 120 + sawK * 880 - 30, 60, 60); g.restore(); }
      // the chip lifted: grows to fill the frame (fb10), then moves aside (fb11)
      if (lift > 0) {
        g.globalAlpha = vD;
        const s0 = 880 / 12, x0 = 460 + 6 * s0 + s0 / 2, y0 = 120 + 5 * s0 + s0 / 2;
        const s = WO.lerp(s0, 180, lift) * WO.lerp(1, 3.0, big) * WO.lerp(1, 0.75, side);
        const x = WO.lerp(WO.lerp(x0, x0 + 140, lift), 960, big), y = WO.lerp(WO.lerp(y0, y0 - 120, lift), 730, big);
        WO.drawDie(g, WO.lerp(x, 1440, side), WO.lerp(y, 520, side), s, 128, { tile: mat.tile, si: mat.siQuiet.canvas, cellColor: '#d9a842', gap: 0.25, glow: big, sheen: 0.3 + 0.1 * Math.sin(t) });
      }
      if (side > 0) { g.globalAlpha = vD * side; WO.transistor(g, 480, 520, 0.9, 0.5 + 0.5 * Math.sin(t * 3), t); g.fillStyle = '#9aa6bd'; g.font = font(700, 80); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('→', 960, 520); }
      g.globalAlpha = 1;
    }
    // 8 · the package (fb12) → the finished GPU (fb13)
    const vP = vis(t, T.pkg, win.b + 1.3, 0.6, 0.3);
    if (vP > 0) {
      g.globalAlpha = vP;
      H.ground(g, t, 1.2, 0, 0, 0.7);
      const sub = WO.ease.out(WO.k(t, T.pkg + 0.2, T.pkg + 1.2)), memK = WO.ease.out(WO.k(t, about('fb12', '메모리', -0.3), about('fb12', '메모리', 0.7))), wrap = WO.ease.io(WO.k(t, T.wrap, T.wrap + 1.2));
      const recede = WO.ease.io(WO.k(t, T.aiw - 0.3, T.aiw + 1.2)), s = WO.lerp(1, 0.55, recede), cy = WO.lerp(640, 640, recede);
      g.save(); g.translate(960, cy); g.scale(s, s);
      // the substrate: dark green board with gold contacts
      g.globalAlpha = vP * sub; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(-430, -330, 880, 680);
      const sg = g.createLinearGradient(-440, -340, 440, 340); sg.addColorStop(0, '#1f4a3a'); sg.addColorStop(1, '#0c2018'); g.fillStyle = sg; g.fillRect(-440, -340, 880, 680);
      g.fillStyle = '#c9a050'; for (let i = 0; i < 40; i++) { g.fillRect(-420 + i * 21, -330, 10, 8); g.fillRect(-420 + i * 21, 322, 10, 8); }
      // memory stacks beside the chip
      for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const mx = sx * 300, my = (k - 0.5) * 260; g.globalAlpha = vP * memK; g.fillStyle = '#20242e'; g.fillRect(mx - 60, my - 100, 120, 200); g.strokeStyle = 'rgba(200,210,230,0.5)'; g.lineWidth = 2; g.strokeRect(mx - 60, my - 100, 120, 200); for (let l = 0; l < 6; l++) { g.fillStyle = 'rgba(160,170,190,0.25)'; g.fillRect(mx - 56, my - 92 + l * 32, 112, 3); } }
      g.globalAlpha = vP;
      WO.drawDie(g, 0, 0, 380, 128, { tile: mat.tile, si: mat.siQuiet.canvas, cellColor: '#d9a842', gap: 0.25, glow: 0.5 + 0.5 * wrap, sheen: 0.3 + t * 0.03 % 1 });
      // the frame around it, closing in
      if (wrap > 0) { g.strokeStyle = `rgba(210,220,240,${0.8 * wrap})`; g.lineWidth = 14; g.strokeRect(-440 - (1 - wrap) * 120, -340 - (1 - wrap) * 120, 880 + (1 - wrap) * 240, 680 + (1 - wrap) * 240); }
      g.restore();
      if (recede > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = vP * recede * 0.6; g.drawImage(sp.glowEuv, 960 - 700, 560 - 500, 1400, 1000); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1;
    }
    H.keyLight(g, 1);
  });
};
