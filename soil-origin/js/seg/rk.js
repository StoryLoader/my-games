/* seg/rk.js — chapter 2 「바위는 어떻게 알갱이가 되는가?」: the bedrock face — water, ice, roots, then the quiet acid. */
window.SEG = window.SEG || {};
window.SEG.rk = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas, rand } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="rk">
      <canvas class="world"></canvas>
      <h1 class="hero word w-water" style="color:#8fd7ff">물</h1>
      <h1 class="hero word w-acid" style="color:#bfe6ff">탄산</h1>
      <p class="sup s-acid" style="left:0;right:0;top:700px;text-align:center">빗물 + 공기 속 <b>이산화탄소</b> = 아주 약한 산</p>
      <h1 class="hero mid word w-feld" style="color:#f0c4b0">장석</h1>
      <p class="sup arrow a-feld"><b>→</b> 카올리나이트 <b>점토</b></p>
      <p class="note n-years" style="left:1240px;top:300px;transform:rotate(-4deg)">수백 년</p>
      <h1 class="hero mid word w-quartz" style="color:#f2efe9">석영</h1>
      <p class="sup arrow a-quartz"><b>=</b> 모래</p>
      <p class="hero mid two-grains"><span style="color:#e9cfc2">점토</span><span class="dot">·</span><span style="color:#f2efe9">모래</span></p>
      <p class="sup s-bro" style="left:0;right:0;top:720px;text-align:center">같은 <b>바위</b>에서 나온 둘</p>
      <p class="lbl s-recap" style="left:0;right:0;top:150px;text-align:center;font-size:72px"><b>물</b> &nbsp;·&nbsp; <b>얼음</b> &nbsp;·&nbsp; <b>뿌리</b> &nbsp;·&nbsp; <b>약한 산</b></p>
      ${H.card(2, '바위는 어떻게 알갱이가 되는가?', '알갱이')}
    </section>`);
  scene(el, win.a, win.b + 1.4);
  H.cut(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('rk01') + 1.3);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const txt = ['.w-water', '.w-acid', '.s-acid', '.w-feld', '.a-feld', '.n-years', '.w-quartz', '.a-quartz', '.two-grains', '.s-bro', '.s-recap'].map(Q);
  gsap.set(txt, { autoAlpha: 0 });
  gsap.set(Q('.w-water'), { left: 0, right: 0, top: 330, textAlign: 'center', fontSize: 300 });
  gsap.set(Q('.w-acid'), { left: 0, right: 0, top: 380, textAlign: 'center', fontSize: 260 });
  gsap.set(Q('.w-feld'), { left: 150, top: 240 }); gsap.set(Q('.a-feld'), { left: 150, top: 420, textAlign: 'left' });
  gsap.set(Q('.w-quartz'), { left: 1180, top: 240 }); gsap.set(Q('.a-quartz'), { left: 1180, top: 420, textAlign: 'left' });
  gsap.set(Q('.two-grains'), { left: 0, right: 0, top: 150, textAlign: 'center' });
  Q('.two-grains .dot').style.cssText = 'color:#b9a893;margin:0 40px;font-family:var(--font);font-weight:300';

  // ---- the face: granite, fractured around the drop's impact (technique: 37-fracture) ----
  const IMP = [1000, 380];
  const fr = WO.fracture([0, 0, 1920, 1080], IMP, 37, 5, 9);
  const cam = H.cam(); cam.z = 1; cam.x = 0; cam.y = 0;
  const T = {
    drop: about('rk02', '물입니다') - 0.35, rain0: S('rk03'), rain1: E('rk03') + 0.3, night: about('rk04', '얼면') - 0.3, ice: about('rk04', '얼면'),
    wedge: about('rk04', '쐐기처럼'), cycles0: S('rk05'), split: about('rk05', '갈라지죠') - 0.2, root0: S('rk06') + 0.1, root1: E('rk06'), wide: S('rk07'),
    rain2: about('rk07', '빗물이') - 0.2, acid: S('rk08'), feld0: about('rk09', '수백 년') - 0.3, feld1: about('rk09', '카올리나이트') + 0.3, quartz: S('rk10'), sand: about('rk10', '이게 모래'),
    pair: S('rk11'), recap: S('rk12'), grey0: about('rk13', '달의 가루') - 0.3, life: about('rk13', '생명이 빠져') + 0.4,
  };
  // the roots grow along the cracks (attractors sampled along reached edges)
  const pts = []; for (const e of fr.edges) { if (e.tmin > 620) continue; for (let i = 0; i < e.pts.length - 1; i++) { const a = e.pts[i], b = e.pts[i + 1]; const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24)); for (let j = 0; j <= n; j++) { const k = j / n; const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k; if (y > 20 && y < 1000 && x > 80 && x < 1840) pts.push([x, y]); } } }
  const roots = WO.roots({ origin: [IMP[0] + 20, -10], points: pts, box: [0, -20, 1920, 1100], step: 10, kill: 18, influence: 170, down: 0.5, seed: 3, iters: 260 });

  // rain streaks (closed form)
  const rainN = 160, rr = rand(91), rain = Array.from({ length: rainN }, () => ({ x: rr() * 1920, ph: rr(), sp: 1500 + rr() * 900, len: 60 + rr() * 80 }));
  function drawRain(t, k) {
    g.strokeStyle = `rgba(190,225,255,${0.45 * k})`; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath();
    for (const d of rain) { const y = ((t * d.sp + d.ph * 2400) % 1400) - 200; g.moveTo(d.x, y); g.lineTo(d.x - 6, y + d.len); }
    g.stroke();
  }
  // the one drop (rk02): falls from the top, lands at the impact, spreads as a dark wet spot
  function drawDrop(t) {
    const u = t - T.drop; if (u < -0.9 || u > 3.5) return;
    if (u < 0) { const k = (u + 0.9) / 0.9; const y = -40 + (IMP[1] + 40) * k * k; g.drawImage(sp.drop, IMP[0] - 28, y - 60, 56, 73); }
    else { const k = WO.clamp(u / 1.6, 0, 1); const r = 20 + 140 * Math.sqrt(k); g.fillStyle = `rgba(10,8,12,${0.42 * (1 - 0.3 * k)})`; g.beginPath(); g.ellipse(IMP[0], IMP[1] + 8, r * 1.15, r * 0.75, 0, 0, 6.28); g.fill();
      if (u < 0.5) { const q = u / 0.5; g.strokeStyle = `rgba(200,230,255,${0.8 * (1 - q)})`; g.lineWidth = 3 * (1 - q) + 0.5; g.beginPath(); g.ellipse(IMP[0], IMP[1] + 6, 14 + 90 * q, 7 + 36 * q, 0, 0, 6.28); g.stroke(); } }
  }
  // feldspar patch (rk09): a polygon on the face that turns from pink crystal to pale clay
  const feld = { poly: [[300, 520], [470, 470], [600, 560], [560, 760], [400, 800], [280, 690]], c: [440, 640] };
  const quartz = { x: 1310, y: 640, r: 62 };
  const clayTex = mat.soilB.canvas;

  function drawFace(t) {
    H.view(g, cam, 1);
    const R = t < T.rain0 ? 0 : t < T.cycles0 ? 150 + 170 * WO.ease.out((t - T.rain0) / (T.night - T.rain0)) : 320 + 1500 * WO.ease.out((t - T.cycles0) / (T.split - T.cycles0));
    const ALL = t >= T.split;
    const sep = t < T.split ? 0 : t < T.root0 ? 10 * WO.ease.out((t - T.split) / 0.9) : t < T.wide ? 10 + 16 * WO.ease.out((t - T.root0) / (T.root1 - T.root0)) : t < T.rain2 ? 26 : 26 - 10 * WO.ease.inout((t - T.rain2) / 2);
    // pieces: each cell is the granite texture clipped and pushed away from the impact
    for (const c of fr.cells) {
      const dx = c.c[0] - IMP[0], dy = c.c[1] - IMP[1], L = Math.hypot(dx, dy) || 1;
      const push = sep * (0.5 + 0.5 * Math.min(1, 900 / Math.max(80, L))) * (0.7 + 0.6 * c.r);
      const ox = (dx / L) * push, oy = (dy / L) * push + sep * 0.6 * c.r;
      g.save(); g.translate(ox, oy); WO.cellPath(g, c.poly); g.clip();
      g.drawImage(mat.granite.canvas, 0, 0, mat.granite.w, mat.granite.h, -40, -30, 2000, 1140);
      if (sep > 0) { // a shaded lip on the side facing away from the light, a lit one towards it
        g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.stroke(); }
      g.restore();
    }
    if (sep > 0) { g.fillStyle = 'rgba(6,3,2,1)'; g.globalCompositeOperation = 'destination-over'; g.fillRect(-100, -100, 2200, 1300); g.globalCompositeOperation = 'source-over'; }
    // wet darkening along the cracks, then ice in them
    if (R > 0) {
      const wet = t < T.rain0 ? 0 : t < T.night ? WO.clamp((t - T.rain0) / 1.5, 0, 1) : 1;
      // a crack has a lit lip on the side facing the key light and a dark shadowed inside
      g.save(); g.translate(1.6, 1.6); WO.drawCracks(g, fr, R, 4.5 + 2 * wet, 'rgba(255,236,210,0.22)', ALL); g.restore();
      WO.drawCracks(g, fr, R, 5 + 3 * wet, `rgba(14,10,8,${0.5 + 0.3 * wet})`, ALL);
      WO.drawCracks(g, fr, R, 1.6 + 0.8 * wet, 'rgba(0,0,0,0.92)', ALL);
    }
    const iceK = t < T.ice ? 0 : t < T.cycles0 ? WO.ease.out((t - T.ice) / 1.2) : t < T.split ? 1 : WO.clamp(1 - (t - T.split) / 1.5, 0, 1);
    if (iceK > 0) {
      const wedge = t < T.wedge ? 0 : WO.ease.out((t - T.wedge) / 1.6);
      const Ri = Math.min(R, 330 + 120 * wedge);   // the ice sits in the cracks the water reached
      WO.drawCracks(g, fr, Ri, (3 + 9 * wedge), `rgba(150,205,240,${0.9 * iceK})`, false);
      g.globalCompositeOperation = 'lighter';
      WO.drawCracks(g, fr, Ri, (6 + 14 * wedge), `rgba(90,160,220,${0.18 * iceK})`, false);
      WO.drawCracks(g, fr, Ri, (1 + 2.5 * wedge), `rgba(235,248,255,${0.75 * iceK})`, false);
      g.globalCompositeOperation = 'source-over';
    }
    // roots along the cracks
    if (t > T.root0) {
      const G = WO.ease.out((t - T.root0) / (T.root1 - T.root0));
      g.save(); g.translate(0, 1.5); WO.drawRoots(g, roots, Math.min(1, G), { color: 'rgba(30,18,8,0.7)', base: 2.2, k: 0.75, pow: 0.55 }); g.restore();
      WO.drawRoots(g, roots, Math.min(1, G), { color: '#d9c3a0', tip: '#e9f2c0', base: 1.1, k: 0.62, pow: 0.55 });
      g.save(); g.translate(-0.8, -0.8); g.globalAlpha = 0.5; WO.drawRoots(g, roots, Math.min(1, G), { color: '#fff3dc', base: 0.5, k: 0.25, pow: 0.55 }); g.restore(); g.globalAlpha = 1;
    }
    // feldspar → clay (rk09)
    if (t > T.feld0 - 1.2 && t < T.recap) {
      const show = WO.ease.out(WO.clamp((t - (T.feld0 - 1.2)) / 0.6, 0, 1)), k = WO.clamp((t - T.feld0) / (T.feld1 - T.feld0), 0, 1);
      g.save(); WO.cellPath(g, feld.poly); g.clip();
      g.globalAlpha = show * (0.9 - 0.3 * k); g.fillStyle = '#e8b4a0'; g.fill();
      g.globalAlpha = show * k; g.drawImage(clayTex, 0, 0, clayTex.width, clayTex.height, 200, 400, 600, 480);
      g.globalAlpha = show * k * 0.6; g.fillStyle = '#efe4d4'; g.fill();
      g.restore(); g.globalAlpha = 1;
      g.lineWidth = 2; g.strokeStyle = `rgba(255,230,210,${0.7 * show * (1 - k)})`; WO.cellPath(g, feld.poly); g.stroke();
      // the acid: a soft bluish sheen washing down the patch while it changes
      if (k > 0 && k < 1) { const gr = g.createLinearGradient(0, 460 + 320 * k - 80, 0, 460 + 320 * k + 40); gr.addColorStop(0, 'rgba(150,210,255,0)'); gr.addColorStop(0.5, 'rgba(170,220,255,0.35)'); gr.addColorStop(1, 'rgba(150,210,255,0)'); g.save(); WO.cellPath(g, feld.poly); g.clip(); g.fillStyle = gr; g.fillRect(200, 380, 600, 500); g.restore(); }
    }
    // quartz grain (rk10): glassy, stays; at "이게 모래" it drops out and rolls to the bottom
    if (t > T.quartz - 0.6 && t < T.recap) {
      const show = WO.ease.out(WO.clamp((t - (T.quartz - 0.6)) / 0.6, 0, 1));
      let qx = quartz.x, qy = quartz.y, rot = 0;
      if (t > T.sand) { const u = t - T.sand; qy = Math.min(quartz.y + 0.5 * 1900 * u * u, 980); qx += 120 * u; rot = u * 4; }
      g.save(); g.translate(qx, qy); g.rotate(rot); g.globalAlpha = show;
      const grd = g.createRadialGradient(-20, -24, 6, 0, 0, quartz.r); grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.45, 'rgba(236,232,226,0.9)'); grd.addColorStop(1, 'rgba(150,146,140,0.95)');
      g.fillStyle = grd; g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, r2 = quartz.r * (0.75 + 0.25 * ((i * 53) % 7) / 7); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); } g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
      g.restore(); g.globalAlpha = 1;
    }
    H.reset(g);
  }
  // rk11: the two grains side by side, large — clay (soft lump) and sand (glassy)
  function drawPair(t) {
    if (t < T.pair - 0.2 || t > T.recap + 0.5) return;
    const k = WO.ease.out(WO.clamp((t - T.pair) / 0.9, 0, 1)), fade = 1 - WO.clamp((t - T.recap) / 0.5, 0, 1);
    H.reset(g); g.globalAlpha = k * fade;
    // clay lump
    g.save(); g.translate(700, 620); g.scale(k, k);
    g.beginPath(); for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283, r = 150 * (0.8 + 0.2 * WO.noise(i * 0.7, 3)); g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.86); } g.closePath();
    g.clip(); g.drawImage(clayTex, 0, 0, clayTex.width, clayTex.height, -200, -170, 400, 340); g.fillStyle = 'rgba(240,228,214,0.55)'; g.fill();
    const sh = g.createRadialGradient(-50, -60, 20, 0, 0, 170); sh.addColorStop(0, 'rgba(255,245,235,0.35)'); sh.addColorStop(1, 'rgba(40,20,10,0.55)'); g.fillStyle = sh; g.fill(); g.restore();
    // sand grain
    g.save(); g.translate(1220, 620); g.scale(k, k);
    const grd = g.createRadialGradient(-50, -60, 10, 0, 0, 150); grd.addColorStop(0, 'rgba(255,255,255,0.98)'); grd.addColorStop(0.5, 'rgba(236,232,226,0.92)'); grd.addColorStop(1, 'rgba(140,136,130,0.98)');
    g.fillStyle = grd; g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, r = 150 * (0.75 + 0.25 * ((i * 53) % 7) / 7); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.stroke(); g.restore();
    // contact shadows
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(700, 770, 170 * k, 28 * k, 0, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(1220, 770, 150 * k, 26 * k, 0, 0, 6.28); g.fill();
    g.globalAlpha = 1;
  }
  // rk12–rk13: the pile of grains; it greys out like the moon's dust, then one green light
  const pr = rand(123), pile = Array.from({ length: 420 }, (_, i) => ({ x: 400 + pr() * 1120, y: 1000 - Math.abs(pr() + pr() - 1) * 330 * (1 - Math.abs((i % 40) / 20 - 1)) - pr() * 40, s: [sp.grainA[0], sp.grainA[1], sp.grainA[2], sp.grainG[0]][i % 4], d: pr(), r: pr() * 6.28 }));
  function drawPile(t) {
    if (t < T.recap) return;
    H.reset(g);
    for (const p of pile) { const k = WO.ease.out(WO.clamp((t - T.recap - p.d * 1.6) / 0.6, 0, 1)); if (k <= 0) continue; g.save(); g.translate(p.x, p.y - 300 * (1 - k)); g.rotate(p.r); g.globalAlpha = k; g.drawImage(p.s, -p.s.width / 2, -p.s.height / 2); g.restore(); }
    g.globalAlpha = 1;
    if (t > T.grey0) { const k = WO.ease.inout((t - T.grey0) / 1.4); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${k})`; g.fillRect(0, 0, 1920, 1080); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(12,14,18,${0.35 * k})`; g.fillRect(0, 0, 1920, 1080); }
    if (t > T.life) { const k = WO.ease.out((t - T.life) / 0.9) * (0.75 + 0.25 * Math.sin(t * 3)); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.drawImage(sp.glowLife, 940 - 60, 760 - 60, 120, 120); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  // ---- camera (reasons) ----
  tl.fromTo(cam, { z: 1.06, x: 0, y: 0 }, { z: 1.0, duration: E('rk01') - S('rk01'), ease: 'none', immediateRender: false }, S('rk01'));
  tl.fromTo(cam, { z: 1.0, x: 0, y: 0 }, { z: 1.45, x: 40, y: -160, duration: E('rk03') - S('rk03'), ease: 'power2.inOut', immediateRender: false }, S('rk03'));   // push in: "틈으로 스며듭니다"
  tl.fromTo(cam, { z: 1.45, x: 40, y: -160 }, { z: 1.9, x: 60, y: -120, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, S('rk04'));                   // ECU: the ice wedge
  tl.fromTo(cam, { z: 1.9, x: 60, y: -120 }, { z: 1.25, x: 20, y: -60, duration: 1.6, ease: 'power3.inOut', immediateRender: false }, S('rk05'));                     // the cracks run across the face
  tl.fromTo(cam, { z: 1.25, x: 20, y: -60 }, { z: 1.0, x: 0, y: 0, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, S('rk07'));                         // wide: the pieces

  // ---- type ----
  H.inn(Q('.w-water'), T.drop + 0.1, { y: 50, scale: 0.9 }, 0.8); H.out(Q('.w-water'), S('rk03') - 0.2, { y: -40 }, 0.4);
  const wa = TX.split(Q('.w-water'), { by: 'chars' }); TX.jelly(wa, T.drop + 0.95, { amp: 0.18, freq: 2.6, decay: 4 });
  // rk08: 탄산 inside a big drop (the drop is drawn by the frame; the word is water-coloured type)
  H.inn(Q('.w-acid'), about('rk08', '탄산이') - 0.2, { y: 50 }, 0.8); H.out(Q('.w-acid'), E('rk08') - 0.1, { y: -40 }, 0.4);
  const ac = TX.split(Q('.w-acid'), { by: 'chars' }); TX.wave(ac, about('rk08', '탄산이') + 0.4, E('rk08'), { amp: 6, length: 180, speed: 1.6 });
  H.inn(Q('.s-acid'), about('rk08', '이산화탄소를') - 0.2, { y: 24 }, 0.7); H.out(Q('.s-acid'), E('rk08') - 0.1, { y: -20 }, 0.35);
  // rk09
  H.inn(Q('.w-feld'), about('rk09', '장석이라는') - 0.2, { y: 50 }, 0.8); H.inn(Q('.n-years'), T.feld0, { x: 20 }, 0.6);
  H.inn(Q('.a-feld'), about('rk09', '카올리나이트') - 0.2, { x: -30 }, 0.7);
  // rk10
  H.inn(Q('.w-quartz'), about('rk10', '석영은') - 0.2, { y: 50 }, 0.8); H.inn(Q('.a-quartz'), T.sand - 0.1, { x: -30 }, 0.7);
  [Q('.w-feld'), Q('.a-feld'), Q('.n-years'), Q('.w-quartz'), Q('.a-quartz')].forEach((e) => H.out(e, S('rk11') - 0.3, { y: -40 }, 0.4));
  // rk11
  H.inn(Q('.two-grains'), about('rk11', '점토와') - 0.2, { y: 50 }, 0.8); H.inn(Q('.s-bro'), about('rk11', '형제인') - 0.2, { y: 24 }, 0.7);
  H.out(Q('.two-grains'), S('rk12') - 0.2, { y: -40 }, 0.4); H.out(Q('.s-bro'), S('rk12') - 0.2, { y: -20 }, 0.4);
  // rk12 recap words land one by one as they are said
  const rc = Q('.s-recap'), rcb = H.qa(rc, 'b'); gsap.set(rcb, { autoAlpha: 0, y: 20 }); tl.set(rc, { autoAlpha: 1 }, about('rk12', '물과') - 0.3);
  ['물과', '얼음', '뿌리와', '약한 산이'].forEach((ph, i) => tl.to(rcb[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, about('rk12', ph) - 0.15));
  H.out(rc, S('rk13') - 0.2, { y: -20 }, 0.4);

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.5) return;
    g.clearRect(0, 0, 1920, 1080);
    drawFace(t);
    H.view(g, cam, 1);
    drawDrop(t);
    // rain: rk03 and the quiet return in rk07
    if (t > T.rain0 - 0.3 && t < T.rain1) drawRain(t, WO.clamp((t - T.rain0 + 0.3) / 0.6, 0, 1) * (1 - WO.clamp((t - (T.rain1 - 0.6)) / 0.6, 0, 1)));
    if (t > T.rain2 && t < E('rk08') + 0.4) drawRain(t, 0.55 * WO.clamp((t - T.rain2) / 0.8, 0, 1) * (1 - WO.clamp((t - E('rk08')) / 0.4, 0, 1)));
    H.reset(g);
    // night: the face cools and darkens, the ice glows; rk05: day and night alternate faster and faster
    if (t > T.night && t < T.split) {
      let k;
      if (t < T.cycles0) k = WO.ease.inout((t - T.night) / 1.2);
      else { const u = t - T.cycles0; const ph = u * (1.2 + u * 0.9); k = 0.5 + 0.5 * Math.cos(ph * 3.14159); }
      g.fillStyle = `rgba(8,14,34,${0.55 * k})`; g.fillRect(0, 0, 1920, 1080);
    }
    // rk08: the big drop with carbon dioxide bubbles entering it
    if (t > T.acid - 0.4 && t < E('rk08') + 0.3) {
      const k = WO.ease.out(WO.clamp((t - T.acid + 0.4) / 0.8, 0, 1)) * (1 - WO.clamp((t - E('rk08')) / 0.3, 0, 1));
      g.save(); g.translate(960, 520); g.scale(k, k);
      const grd = g.createRadialGradient(-90, -120, 30, 0, 0, 330); grd.addColorStop(0, 'rgba(230,245,255,0.55)'); grd.addColorStop(0.55, 'rgba(120,180,230,0.35)'); grd.addColorStop(1, 'rgba(30,60,110,0.6)');
      g.fillStyle = grd; g.beginPath(); g.moveTo(0, -400); g.bezierCurveTo(330, -120, 330, 160, 0, 300); g.bezierCurveTo(-330, 160, -330, -120, 0, -400); g.fill();
      g.strokeStyle = 'rgba(220,240,255,0.7)'; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(-120, -140, 26, 70, -0.5, 0, 6.28); g.fill();
      // CO2 bubbles drift in from the air and sink into the drop
      for (let i = 0; i < 18; i++) { const r = WO.rand(700 + i)(); const u = ((t - T.acid) * 0.35 + r) % 1; const ang = r * 6.283; const d = 520 * (1 - u) + 40; const x = Math.cos(ang) * d, y = Math.sin(ang) * d * 0.8 - 60; g.globalAlpha = Math.min(1, u * 3) * 0.8; g.fillStyle = 'rgba(200,235,255,0.5)'; g.beginPath(); g.arc(x, y, 7 + 8 * (1 - u), 0, 6.28); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.stroke(); }
      g.restore(); g.globalAlpha = 1;
    }
    drawPair(t);
    drawPile(t);
  });
};
