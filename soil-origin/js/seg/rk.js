/* seg/rk.js — chapter 2 「바위는 어떻게 알갱이가 되는가?」: the bedrock face — water, ice, roots, then the quiet acid.
   One world (the granite face), six places in it: the whole face · the crack · the ice inside it · the broken shelf ·
   the drop on a lip · the feldspar patch · the ledge where clay and sand come to rest. */
window.SEG = window.SEG || {};
window.SEG.rk = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas, rand } = ctx, { S, E, about, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="rk">
      <canvas class="world"></canvas>
      <h1 class="hero word w-water" style="color:#bfe6ff">물</h1>
      <h1 class="hero word w-acid" style="color:#e8f6ff">탄산</h1>
      <p class="sup s-acid" style="left:0;right:0;top:170px;text-align:center">빗물 + 공기 속 <b>이산화탄소</b> = 아주 약한 산</p>
      <h1 class="hero mid word w-feld" style="color:#f3cdbc">장석</h1>
      <p class="sup arrow a-feld"><b>→</b> 카올리나이트, 부드러운 <b>점토</b></p>
      <p class="note n-years" style="left:1240px;top:190px;transform:rotate(-4deg);font-size:64px">수백 년</p>
      <h1 class="hero mid word w-quartz" style="color:#f7f4ee">석영</h1>
      <p class="sup arrow a-quartz"><b>=</b> 모래</p>
      <p class="lbl l-clay" style="left:420px;top:560px;font-size:84px;text-align:center;width:560px;color:#efdccf">점토<i>녹아서 변한 것</i></p>
      <p class="lbl l-sand" style="left:1060px;top:560px;font-size:84px;text-align:center;width:560px;color:#f7f4ee">모래<i>버티고 남은 것</i></p>
      <p class="sup s-bro" style="left:0;right:0;top:150px;text-align:center;font-size:52px">같은 <b>바위</b>에서 나온 둘</p>
      <p class="lbl rc rc1" style="left:300px;top:150px;font-size:64px">물</p>
      <p class="lbl rc rc2" style="left:700px;top:150px;font-size:64px">얼음</p>
      <p class="lbl rc rc3" style="left:1100px;top:150px;font-size:64px">뿌리</p>
      <p class="lbl rc rc4" style="left:1480px;top:150px;font-size:64px">약한 산</p>
      ${H.card(2, '바위는 어떻게 알갱이가 되는가?', '알갱이')}
    </section>`);
  scene(el, win.a, win.b + 1.4);
  H.cut(el, win.a); H.cardIn(H.q(el, '.chcard'), win.a, S('rk01') + 1.5);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const Q = (s) => H.q(el, s);
  const txt = ['.w-water', '.w-acid', '.s-acid', '.w-feld', '.a-feld', '.n-years', '.w-quartz', '.a-quartz', '.l-clay', '.l-sand', '.s-bro', '.rc1', '.rc2', '.rc3', '.rc4'].map(Q);
  gsap.set(txt, { autoAlpha: 0 });
  gsap.set(Q('.w-water'), { left: 0, right: 0, top: 300, textAlign: 'center', fontSize: 320 });
  gsap.set(Q('.w-acid'), { left: 0, right: 0, top: 420, textAlign: 'center', fontSize: 200 });
  gsap.set(Q('.w-feld'), { left: 1100, top: 300 }); gsap.set(Q('.a-feld'), { left: 1100, top: 470, textAlign: 'left' });
  gsap.set(Q('.w-quartz'), { left: 1100, top: 300 }); gsap.set(Q('.a-quartz'), { left: 1100, top: 470, textAlign: 'left' });

  // ---- the face: granite, fractured around the drop's impact (technique: 37-fracture) ----
  const IMP = [1000, 380];
  const fr = WO.fracture([0, 0, 1920, 1080], IMP, 37, 4, 8);
  const cam = H.cam(); cam.z = 1; cam.x = 0; cam.y = 0;
  const T = {
    chip: about('rk01', '원래') - 0.2, drop: about('rk02', '물입니다') - 0.35, rain0: S('rk03'), rain1: E('rk03') + 0.3, night: about('rk04', '얼면') - 0.3, ice: about('rk04', '얼면'),
    wedge: about('rk04', '쐐기처럼'), cycles0: S('rk05'), split: about('rk05', '갈라지죠') - 0.2, root0: S('rk06') + 0.1, root1: E('rk06'), wide: S('rk07'),
    rain2: about('rk07', '빗물이') - 0.2, acid: S('rk08'), feld0: about('rk09', '수백 년') - 0.3, feld1: about('rk09', '카올리나이트') + 0.3, quartz: S('rk10'), sand: about('rk10', '이게 모래'),
    pair: S('rk11'), recap: S('rk12'), grey0: about('rk13', '달의 가루') - 0.3, life: about('rk13', '생명이 빠져') + 0.4,
  };
  const GR = mat.granite.canvas, gw = mat.granite.w, gh = mat.granite.h;
  const drawGranite = (ox = 0, oy = 0) => g.drawImage(GR, 0, 0, gw, gh, -40 + ox, -30 + oy, 2000, 1140);
  // the roots grow along the cracks (attractors sampled along reached edges)
  const pts = []; for (const e of fr.edges) { if (e.tmin > 620) continue; for (let i = 0; i < e.pts.length - 1; i++) { const a = e.pts[i], b = e.pts[i + 1]; const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24)); for (let j = 0; j <= n; j++) { const k = j / n; const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k; if (y > 20 && y < 1000 && x > 80 && x < 1840) pts.push([x, y]); } } }
  const roots = WO.roots({ origin: [IMP[0] + 20, -10], points: pts, box: [0, -20, 1920, 1100], step: 10, kill: 18, influence: 170, down: 0.5, seed: 3, iters: 260 });
  // the cell that drops out of the face at "갈라지죠": the top-most mid-sized cell near the impact
  const dropCell = fr.cells.filter((c) => c.dist > 90 && c.dist < 260 && c.c[1] < IMP[1]).sort((a, b) => a.c[1] - b.c[1])[0] || fr.cells[3];

  // rain streaks (closed form)
  const rr = rand(91), rain = Array.from({ length: 160 }, () => ({ x: rr() * 1920, ph: rr(), sp: 1500 + rr() * 900, len: 60 + rr() * 80 }));
  function drawRain(t, k) {
    g.strokeStyle = `rgba(190,225,255,${0.45 * k})`; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath();
    for (const d of rain) { const y = ((t * d.sp + d.ph * 2400) % 1400) - 200; g.moveTo(d.x, y); g.lineTo(d.x - 6, y + d.len); }
    g.stroke();
  }
  // the one drop (rk02)
  function drawDrop(t) {
    const u = t - T.drop; if (u < -0.9 || u > 3.5) return;
    if (u < 0) { const k = (u + 0.9) / 0.9; const y = -40 + (IMP[1] + 40) * k * k; g.drawImage(sp.drop, IMP[0] - 34, y - 70, 68, 88); }
    else { const k = WO.clamp(u / 1.6, 0, 1); const r = 20 + 140 * Math.sqrt(k); g.fillStyle = `rgba(10,8,12,${0.42 * (1 - 0.3 * k)})`; g.beginPath(); g.ellipse(IMP[0], IMP[1] + 8, r * 1.15, r * 0.75, 0, 0, 6.28); g.fill();
      if (u < 0.5) { const q = u / 0.5; g.strokeStyle = `rgba(200,230,255,${0.8 * (1 - q)})`; g.lineWidth = 3 * (1 - q) + 0.5; g.beginPath(); g.ellipse(IMP[0], IMP[1] + 6, 14 + 90 * q, 7 + 36 * q, 0, 0, 6.28); g.stroke(); } }
  }
  // feldspar: an irregular region of the face (a crystal in the granite) that turns to chalk from its edge inward
  const feld = { x: 620, y: 600, r: 170, ph: 3.3 };
  function feldPath(scale = 1) { g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.283; const rr2 = feld.r * scale * (0.76 + 0.24 * WO.noise(Math.cos(a) * 1.9 + feld.ph, Math.sin(a) * 1.9, 21)); g.lineTo(feld.x + Math.cos(a) * rr2, feld.y + Math.sin(a) * rr2 * 0.9); } g.closePath(); }
  const chalkTex = (() => { const c = WO.canvas(512, 512), q = WO.ctx(c); q.drawImage(mat.soilB.canvas, 0, 0, 512, 512, 0, 0, 512, 512); q.globalCompositeOperation = 'saturation'; q.fillStyle = '#808080'; q.fillRect(0, 0, 512, 512); q.globalCompositeOperation = 'screen'; q.fillStyle = '#7d766c'; q.fillRect(0, 0, 512, 512); return c; })();
  // quartz: an angular translucent crystal drawn with facets and a glint
  function drawCrystal(x, y, r, rot, alpha = 1, glint = 0) {
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = alpha;
    const P = []; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, rr2 = r * (0.72 + 0.28 * ((i * 53) % 7) / 7); P.push([Math.cos(a) * rr2, Math.sin(a) * rr2]); }
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(6, r * 0.95, r * 0.9, r * 0.22, 0, 0, 6.283); g.fill();
    for (let i = 0; i < 7; i++) { const a = P[i], b = P[(i + 1) % 7]; const light = 0.45 + 0.55 * Math.max(0, -(a[0] + b[0]) * 0.5 / r * 0.7 - (a[1] + b[1]) * 0.5 / r * 0.7); g.fillStyle = `rgba(${Math.round(200 + 55 * light)},${Math.round(196 + 55 * light)},${Math.round(190 + 55 * light)},0.92)`; g.beginPath(); g.moveTo(0, 0); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.5; g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
    if (glint > 0) { g.globalAlpha = alpha * glint; g.drawImage(sp.glowAmber, -r * 0.6 - 40, -r * 0.6 - 40, 80, 80); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-r * 0.6, -r * 0.6, 4, 14, 0.4, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(-r * 0.6, -r * 0.6, 14, 4, 0.4, 0, 6.283); g.fill(); }
    g.restore();
  }

  function drawFace(t) {
    H.view(g, cam, 1);
    const R = t < T.rain0 ? 0 : t < T.cycles0 ? 150 + 170 * WO.ease.out((t - T.rain0) / (T.night - T.rain0)) : 320 + 1500 * WO.ease.out((t - T.cycles0) / (T.split - T.cycles0));
    const ALL = t >= T.split;
    // how far the pieces have moved apart: the ice wedges the inner ones; the split and the roots open everything; the shelf stays open
    const iceW = t < T.wedge ? 0 : t < T.cycles0 ? WO.ease.out((t - T.wedge) / 1.6) : 1;
    const sep = t < T.split ? 0 : t < T.root0 ? 10 * WO.ease.out((t - T.split) / 0.9) : t < T.wide ? 10 + 16 * WO.ease.out((t - T.root0) / (T.root1 - T.root0)) : 26 + 14 * WO.ease.out((t - T.wide) / 1.4);
    if (sep === 0 && iceW === 0) drawGranite();   // one piece until the ice wedges it: no per-cell clipping needed
    else for (const c of fr.cells) {
      const dx = c.c[0] - IMP[0], dy = c.c[1] - IMP[1], L = Math.hypot(dx, dy) || 1;
      let push = sep * (0.5 + 0.5 * Math.min(1, 900 / Math.max(80, L))) * (0.7 + 0.6 * c.r);
      if (iceW > 0 && L < 460) push += 16 * iceW * (1 - L / 460);
      const ox = (dx / L) * push, oy = (dy / L) * push + sep * 0.6 * c.r;
      const rot = sep > 0 ? (c.r - 0.5) * 0.03 * Math.min(1, sep / 26) : 0;
      // the cell that falls out at "갈라지죠"
      let fall = 0; if (c === dropCell && t > T.split) { const u = t - T.split; fall = u; }
      g.save(); g.translate(c.c[0] + ox, c.c[1] + oy); g.rotate(rot + fall * 1.2); g.translate(-c.c[0], -c.c[1] + (fall ? 0.5 * 1600 * fall * fall : 0));
      WO.cellPath(g, c.poly); g.clip(); drawGranite();
      if (sep > 0 || push > 0) { g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.stroke(); g.save(); g.translate(-1.5, -1.5); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,236,210,0.35)'; g.stroke(); g.restore(); }
      g.restore();
    }
    if (sep > 0 || iceW > 0) {
      g.globalCompositeOperation = 'destination-over';
      if (iceW > 0 && t < T.split + 1.5) { // the ice body fills the gaps: bright near the impact, fading out
        const fade = t < T.split ? 1 : 1 - (t - T.split) / 1.5; const ig = g.createRadialGradient(IMP[0], IMP[1], 20, IMP[0], IMP[1], 460 + 100 * iceW);
        ig.addColorStop(0, `rgba(235,250,255,${0.95 * fade})`); ig.addColorStop(0.5, `rgba(160,210,240,${0.9 * fade})`); ig.addColorStop(1, `rgba(40,60,90,${0.6 * fade})`); g.fillStyle = ig; g.fillRect(-100, -100, 2200, 1300); }
      g.fillStyle = '#060302'; g.fillRect(-100, -100, 2200, 1300); g.globalCompositeOperation = 'source-over'; }
    // the cracks: a lit lip towards the light, a dark inside
    if (R > 0) {
      const wet = t < T.rain0 ? 0 : t < T.night ? WO.clamp((t - T.rain0) / 1.5, 0, 1) : 1;
      g.save(); g.translate(1.6, 1.6); WO.drawCracks(g, fr, R, 4.5 + 2 * wet, 'rgba(255,236,210,0.22)', ALL); g.restore();
      WO.drawCracks(g, fr, R, 5 + 3 * wet, `rgba(14,10,8,${0.5 + 0.3 * wet})`, ALL);
      WO.drawCracks(g, fr, R, 1.6 + 0.8 * wet, 'rgba(0,0,0,0.92)', ALL);
    }
    // wet darkening spreading down the face (rk03, rk07)
    const wetK = t < T.rain0 ? 0 : t < T.rain1 ? WO.clamp((t - T.rain0) / 2.5, 0, 1) : t < T.rain2 ? Math.max(0, 1 - (t - T.rain1) / 4) : WO.clamp((t - T.rain2) / 2.5, 0, 1);
    if (wetK > 0) { const grd = g.createLinearGradient(0, -100, 0, 1100 * wetK); grd.addColorStop(0, 'rgba(10,8,14,0.4)'); grd.addColorStop(1, 'rgba(10,8,14,0)'); g.fillStyle = grd; g.fillRect(-100, -100, 2200, 1300); }
    // ice: translucent fill in the cracks the water reached, a bright rim on top, frost bleeding into the rock, the only bloom in the frame
    const iceK = t < T.ice ? 0 : t < T.cycles0 ? WO.ease.out((t - T.ice) / 1.2) : t < T.split ? 1 : WO.clamp(1 - (t - T.split) / 1.5, 0, 1);
    if (iceK > 0) {
      const Ri = Math.min(R, 330 + 120 * iceW);
      WO.drawCracks(g, fr, Ri, (30 + 30 * iceW), `rgba(190,225,245,${0.12 * iceK})`, false);           // frost bleeding into the rock
      WO.drawCracks(g, fr, Ri, (6 + 10 * iceW), `rgba(170,215,245,${0.5 * iceK})`, false);           // the ice body in the hairline cracks
      g.save(); g.translate(-1.2, -1.6); WO.drawCracks(g, fr, Ri, (3 + 6 * iceW), `rgba(245,252,255,${0.85 * iceK})`, false); g.restore();   // rim towards the light
      g.save(); g.translate(1.5, 2); WO.drawCracks(g, fr, Ri, (2 + 4 * iceW), `rgba(20,50,90,${0.5 * iceK})`, false); g.restore();            // the shadowed side
      g.globalCompositeOperation = 'lighter'; WO.drawCracks(g, fr, Ri, (18 + 24 * iceW), `rgba(120,180,240,${0.16 * iceK})`, false); g.globalCompositeOperation = 'source-over';
    }
    // roots along the cracks
    if (t > T.root0) {
      const G = WO.ease.out((t - T.root0) / (T.root1 - T.root0));
      const back = t < T.wide ? 1 : t < T.recap ? 1 - 0.6 * WO.ease.inout((t - T.wide) / 1.4) : 0.4 + 0.6 * WO.ease.inout((t - T.recap) / 1.0); g.globalAlpha = back;
      g.save(); g.translate(0, 1.5); WO.drawRoots(g, roots, Math.min(1, G), { color: 'rgba(30,18,8,0.7)', base: 2.2, k: 0.75, pow: 0.55 }); g.restore();
      WO.drawRoots(g, roots, Math.min(1, G), { color: '#d9c3a0', tip: '#e9f2c0', base: 1.1, k: 0.62, pow: 0.55 });
      g.save(); g.translate(-0.8, -0.8); g.globalAlpha = 0.5 * back; WO.drawRoots(g, roots, Math.min(1, G), { color: '#fff3dc', base: 0.5, k: 0.25, pow: 0.55 }); g.restore(); g.globalAlpha = 1;
    }
    // the feldspar crystal in the face (rk09): pink while whole, turning to chalk from the rim inward, crumbs falling from its underside
    if (t > T.feld0 - 1.6 && t < T.pair) {
      const show = WO.ease.out(WO.clamp((t - (T.feld0 - 1.6)) / 0.8, 0, 1)), k = WO.clamp((t - T.feld0) / (T.feld1 - T.feld0), 0, 1);
      g.save(); feldPath(1); g.clip();
      g.globalAlpha = show * 0.92; const fg = g.createLinearGradient(feld.x - 170, feld.y - 170, feld.x + 170, feld.y + 170); fg.addColorStop(0, '#f2c2ac'); fg.addColorStop(0.5, '#d9937a'); fg.addColorStop(1, '#a86150'); g.fillStyle = fg; g.fillRect(feld.x - 200, feld.y - 200, 400, 400);
      // crystal cleavage lines
      g.globalAlpha = show * 0.35; g.strokeStyle = '#fff'; g.lineWidth = 1.2; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(feld.x - 200, feld.y + i * 36 - 100); g.lineTo(feld.x + 200, feld.y + i * 36 + 60); g.stroke(); }
      if (k > 0) { // chalk advances from the rim: a ring whose inner radius shrinks
        const grd = g.createRadialGradient(feld.x, feld.y, feld.r * (1 - k) * 0.9, feld.x, feld.y, feld.r * (1 - k) * 0.9 + 40); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,1)');
        g.globalAlpha = show; g.globalCompositeOperation = 'source-over';
        g.save(); g.fillStyle = grd; g.beginPath(); g.rect(feld.x - 200, feld.y - 200, 400, 400); g.fill(); g.globalCompositeOperation = 'source-atop';
        g.drawImage(chalkTex, feld.x - 200, feld.y - 200, 400, 400); g.restore();
      }
      g.restore(); g.globalAlpha = 1;
      // the acid sheen washing down the crystal while it changes
      if (k > 0 && k < 1) { const yy = feld.y - 160 + 320 * k; const gr2 = g.createLinearGradient(0, yy - 60, 0, yy + 30); gr2.addColorStop(0, 'rgba(160,215,255,0)'); gr2.addColorStop(0.5, 'rgba(180,225,255,0.35)'); gr2.addColorStop(1, 'rgba(160,215,255,0)'); g.save(); feldPath(1.02); g.clip(); g.fillStyle = gr2; g.fillRect(feld.x - 200, feld.y - 200, 400, 400); g.restore(); }
      // crumbs of chalk fall from its underside
      if (k > 0.1) { for (let i = 0; i < 40; i++) { const r = WO.rand(1200 + i)(); const u = ((t - T.feld0) * (0.35 + r * 0.3) + r) % 1; const x = feld.x - 120 + r * 240 + 30 * u, y = feld.y + feld.r * 0.8 + 260 * u * u; g.globalAlpha = (1 - u) * 0.9 * show; g.fillStyle = '#e9e2d6'; g.beginPath(); g.arc(x, y, 2 + 3 * r, 0, 6.283); g.fill(); } g.globalAlpha = 1; }
      g.lineWidth = 2; g.strokeStyle = `rgba(255,230,210,${0.6 * show * (1 - k)})`; feldPath(1); g.stroke();
    }
    // the quartz crystal (rk10): sits in the face to the right, glints, then drops out and rolls onto the ledge
    if (t > T.quartz - 0.6 && t < T.pair + 0.4) {
      const show = WO.ease.out(WO.clamp((t - (T.quartz - 0.6)) / 0.6, 0, 1));
      let qx = 1120, qy = 560, rot = 0.3; const glint = t > about('rk10', '석영은') - 0.1 && t < T.sand ? 0.5 + 0.5 * Math.sin((t - about('rk10', '석영은')) * 6) : 0;
      if (t > T.sand) { const u = t - T.sand; qy = Math.min(560 + 0.5 * 1700 * u * u, 900); qx += 220 * Math.min(u, 1.2); rot += u * 3; }
      drawCrystal(qx, qy, 92, rot, show, glint);
    }
    H.reset(g);
  }
  // rk08: ECU of a crack lip with a drop hanging on it; carbon dioxide enters; the word sits inside the water
  function drawBigDrop(t) {
    if (t < T.acid - 0.4 || t > E('rk08') + 0.3) return;
    const k = WO.ease.out(WO.clamp((t - T.acid + 0.4) / 0.9, 0, 1)) * (1 - WO.clamp((t - E('rk08')) / 0.3, 0, 1));
    H.reset(g);
    const cx = 960, cy = 560, R = 330 * k;
    g.save(); g.translate(cx, cy);
    // the drop refracts the face behind it (the granite drawn flipped and enlarged inside the drop)
    g.beginPath(); g.moveTo(0, -R * 1.2); g.bezierCurveTo(R, -R * 0.35, R, R * 0.5, 0, R * 0.9); g.bezierCurveTo(-R, R * 0.5, -R, -R * 0.35, 0, -R * 1.2); g.closePath();
    g.save(); g.clip(); g.translate(0, 0); g.scale(-1.25, -1.25); g.globalAlpha = 0.9; g.drawImage(GR, 0, 0, gw, gh, -960, -540, 1920, 1080); g.restore();
    const grd = g.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R); grd.addColorStop(0, 'rgba(235,248,255,0.45)'); grd.addColorStop(0.55, 'rgba(120,180,230,0.22)'); grd.addColorStop(1, 'rgba(20,50,100,0.55)');
    g.fillStyle = grd; g.fill();
    g.strokeStyle = 'rgba(230,245,255,0.8)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(-R * 0.38, -R * 0.45, R * 0.08, R * 0.22, -0.5, 0, 6.28); g.fill();
    // contact shadow under the drop
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(10, R * 0.98, R * 0.8, R * 0.12, 0, 0, 6.283); g.fill();
    // carbon dioxide: small bubbles drift in from the air and sink into the drop
    for (let i = 0; i < 18; i++) { const r = WO.rand(700 + i)(); const u = ((t - T.acid) * 0.35 + r) % 1; const ang = r * 6.283; const d = 560 * (1 - u) + 40; const x = Math.cos(ang) * d, y = Math.sin(ang) * d * 0.8 - 60; g.globalAlpha = Math.min(1, u * 3) * 0.8 * k; g.fillStyle = 'rgba(200,235,255,0.5)'; g.beginPath(); g.arc(x, y, 7 + 8 * (1 - u), 0, 6.28); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.stroke(); }
    g.restore(); g.globalAlpha = 1;
  }
  // rk11: the ledge at the bottom third — a lump of clay and grains of sand, each with its contact shadow
  function drawLedge(t) {
    if (t < T.pair - 0.3 || t > T.recap + 0.6) return;
    const k = WO.ease.out(WO.clamp((t - T.pair) / 0.9, 0, 1)), fade = 1 - WO.clamp((t - T.recap) / 0.6, 0, 1);
    H.reset(g); g.globalAlpha = k * fade;
    // the ledge: a band of granite with a lit top edge and a dark underside
    g.save(); g.beginPath(); g.moveTo(0, 760); for (let x = 0; x <= 1920; x += 40) g.lineTo(x, 760 + 10 * WO.noise(x / 120, 7, 31)); g.lineTo(1920, 1080); g.lineTo(0, 1080); g.closePath(); g.clip();
    g.drawImage(GR, 0, 300, gw, 400, 0, 740, 1920, 400); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 740, 1920, 400);
    const lip = g.createLinearGradient(0, 756, 0, 800); lip.addColorStop(0, 'rgba(255,230,190,0.5)'); lip.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = lip; g.fillRect(0, 756, 1920, 50); g.restore();
    const sh = (x, w) => { g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.ellipse(x, 770, w, 22, 0, 0, 6.283); g.fill(); };
    // clay: a soft matte lump
    sh(700, 250 * k);
    g.save(); g.translate(700, 760); g.scale(k, k);
    g.beginPath(); for (let i = 0; i <= 40; i++) { const a = 3.14159 + i / 40 * 3.14159; const r = 240 * (0.86 + 0.14 * WO.noise(i * 0.3, 5, 41)); g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.62); } g.closePath();
    g.save(); g.clip(); g.drawImage(chalkTex, -260, -180, 520, 200); g.fillStyle = 'rgba(236,222,206,0.45)'; g.fill();
    const shd = g.createRadialGradient(-80, -110, 20, 0, -40, 260); shd.addColorStop(0, 'rgba(255,248,240,0.4)'); shd.addColorStop(1, 'rgba(60,35,20,0.6)'); g.fillStyle = shd; g.fill(); g.restore(); g.restore();
    // sand: angular translucent grains in a loose heap
    sh(1340, 230 * k);
    const sr = WO.rand(1300); for (let i = 0; i < 14; i++) { const r1 = sr(), r2 = sr(), r3 = sr(); const x = 1340 + (r1 - 0.5) * 360 * k, y = 760 - 26 - r2 * 90 * k * (1 - Math.abs(r1 - 0.5)); drawCrystal(x, y, (28 + r3 * 26) * k, r1 * 6, 1, 0); }
    g.globalAlpha = 1;
  }
  // rk12 recap: the four forces each return for a breath, in their own place
  function drawGhosts(t) {
    if (t < T.recap || t > S('rk13')) return;
    H.reset(g);
    const beats = [[about('rk12', '물과'), 420, 400], [about('rk12', '얼음'), 820, 400], [about('rk12', '뿌리와'), 1220, 400], [about('rk12', '약한 산이'), 1600, 400]];
    beats.forEach(([tt, x, y], i) => { const u = t - tt + 0.1; if (u < 0 || u > 2.2) return; const a = Math.min(1, u * 4) * (1 - WO.clamp((u - 1.4) / 0.8, 0, 1)); g.globalAlpha = a;
      if (i === 0) { g.drawImage(sp.drop, x - 40, y - 60 + 120 * Math.min(u, 0.6), 80, 104); }
      if (i === 1) { g.strokeStyle = 'rgba(200,235,255,0.9)'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 90, y + 60); g.lineTo(x - 20, y - 10); g.lineTo(x + 40, y + 40); g.lineTo(x + 100, y - 60); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
      if (i === 2) { g.strokeStyle = '#e2cfa8'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - 80); g.quadraticCurveTo(x + 30, y, x - 10, y + 60 * Math.min(1, u)); g.stroke(); g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x - 50, y + 30 * Math.min(1, u)); g.stroke(); }
      if (i === 3) { for (let j = 0; j < 7; j++) { const r = WO.rand(1400 + j)(); g.fillStyle = 'rgba(200,235,255,0.6)'; g.beginPath(); g.arc(x + (r - 0.5) * 140, y + 60 - r * 120 - 40 * u, 8 + r * 10, 0, 6.283); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); } }
    });
    g.globalAlpha = 1;
  }
  // rk12–rk13: the pile of grains; it greys out like the moon's dust, then one green light
  const pr = rand(123), pile = Array.from({ length: 420 }, (_, i) => ({ x: 400 + pr() * 1120, y: 1000 - Math.abs(pr() + pr() - 1) * 330 * (1 - Math.abs((i % 40) / 20 - 1)) - pr() * 40, s: [sp.grainA[0], sp.grainA[1], sp.grainA[2], sp.grainG[0]][i % 4], d: pr(), r: pr() * 6.28 }));
  function drawPile(t) {
    if (t < T.recap) return;
    H.reset(g);
    // rk13: the face steps back; only the grains matter now ("이 알갱이만 모아 놓으면")
    if (t > S('rk13')) { g.fillStyle = `rgba(6,3,2,${0.8 * WO.ease.inout((t - S('rk13')) / 1.2)})`; g.fillRect(0, 0, 1920, 1080); }
    for (const p of pile) { const k = WO.ease.out(WO.clamp((t - T.recap - p.d * 1.6) / 0.6, 0, 1)); if (k <= 0) continue; g.save(); g.translate(p.x, p.y - 300 * (1 - k)); g.rotate(p.r); g.globalAlpha = k; g.drawImage(p.s, -p.s.width / 2, -p.s.height / 2); g.restore(); }
    g.globalAlpha = 1;
    if (t > T.grey0) { const k = WO.ease.inout((t - T.grey0) / 1.4); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${k})`; g.fillRect(0, 0, 1920, 1080); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(12,14,18,${0.35 * k})`; g.fillRect(0, 0, 1920, 1080); }
    if (t > T.life) { const k = WO.ease.out((t - T.life) / 0.9) * (0.75 + 0.25 * Math.sin(t * 3)); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.drawImage(sp.glowLife, 940 - 60, 760 - 60, 120, 120); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  // ---- camera (reasons in the storyboard; every move an explicit fromTo) ----
  const CAMS = [
    [{ z: 1.06, x: 0, y: 0 }, { z: 1.0, x: 0, y: 0 }, E('rk01') - S('rk01'), 'none', S('rk01')],                       // settle on the whole face
    [{ z: 1.0, x: 0, y: 0 }, { z: 1.45, x: 40, y: -160 }, E('rk03') - S('rk03'), 'power2.inOut', S('rk03')],          // push in: the water seeps into the crack
    [{ z: 1.45, x: 40, y: -160 }, { z: 2.0, x: 60, y: -120 }, 1.4, 'power3.inOut', S('rk04')],                         // ECU: the ice wedge
    [{ z: 2.0, x: 60, y: -120 }, { z: 1.3, x: 20, y: -60 }, 1.6, 'power3.inOut', S('rk05')],                           // the cracks run across the face
    [{ z: 1.3, x: 20, y: -60 }, { z: 0.86, x: 0, y: 20 }, 1.6, 'power3.inOut', S('rk07')],                             // pull out: the broken shelf
    [{ z: 0.86, x: 0, y: 20 }, { z: 1.0, x: 0, y: 0 }, 1.2, 'power3.inOut', S('rk08') - 0.3],                           // the drop beat is a screen-space ECU
    [{ z: 1.0, x: 0, y: 0 }, { z: 1.0, x: -300, y: 60 }, 1.4, 'power3.inOut', S('rk10') - 0.2],                        // pan right: the quartz next to it
    [{ z: 1.0, x: -300, y: 60 }, { z: 1.0, x: 0, y: 0 }, 1.2, 'power3.inOut', S('rk11') - 0.3],                        // back to centre for the ledge
  ];
  for (const [from, to, dur, ease, pos] of CAMS) tl.fromTo(cam, from, { ...to, duration: dur, ease, immediateRender: false }, pos);

  // ---- type ----
  H.inn(Q('.w-water'), T.drop + 0.1, { y: 50, scale: 0.9 }, 0.8); H.out(Q('.w-water'), S('rk03') - 0.2, { y: -40 }, 0.4);
  const wa = TX.split(Q('.w-water'), { by: 'chars' }); TX.jelly(wa, T.drop + 0.95, { amp: 0.18, freq: 2.6, decay: 4 });
  H.inn(Q('.w-acid'), about('rk08', '탄산이') - 0.2, { y: 30 }, 0.8); H.out(Q('.w-acid'), E('rk08') - 0.1, { y: -40 }, 0.4);
  const ac = TX.split(Q('.w-acid'), { by: 'chars' }); TX.wave(ac, about('rk08', '탄산이') + 0.4, E('rk08'), { amp: 6, length: 180, speed: 1.6 });
  H.inn(Q('.s-acid'), about('rk08', '이산화탄소를') - 0.2, { y: 24 }, 0.7); H.out(Q('.s-acid'), E('rk08') - 0.1, { y: -20 }, 0.35);
  H.inn(Q('.w-feld'), about('rk09', '장석이라는') - 0.2, { y: 50 }, 0.8); H.inn(Q('.n-years'), T.feld0, { x: 20 }, 0.6);
  H.inn(Q('.a-feld'), about('rk09', '카올리나이트') - 0.2, { x: -30 }, 0.7);
  [Q('.w-feld'), Q('.a-feld'), Q('.n-years')].forEach((e) => H.out(e, S('rk10') - 0.3, { y: -40 }, 0.4));
  H.inn(Q('.w-quartz'), about('rk10', '석영은') - 0.2, { y: 50 }, 0.8); H.inn(Q('.a-quartz'), T.sand - 0.1, { x: -30 }, 0.7);
  [Q('.w-quartz'), Q('.a-quartz')].forEach((e) => H.out(e, S('rk11') - 0.3, { y: -40 }, 0.4));
  H.inn(Q('.l-clay'), about('rk11', '점토와') - 0.2, { y: 30 }, 0.8); H.inn(Q('.l-sand'), about('rk11', '모래는') - 0.2, { y: 30 }, 0.8); H.inn(Q('.s-bro'), about('rk11', '형제인') - 0.2, { y: 24 }, 0.7);
  [Q('.l-clay'), Q('.l-sand'), Q('.s-bro')].forEach((e) => H.out(e, S('rk12') - 0.2, { y: -30 }, 0.4));
  ['물과', '얼음', '뿌리와', '약한 산이'].forEach((ph, i) => { H.inn(Q(`.rc${i + 1}`), about('rk12', ph) - 0.15, { y: 24 }, 0.5); H.out(Q(`.rc${i + 1}`), S('rk13') - 0.2, { y: -20 }, 0.4); });

  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.5) return;
    g.clearRect(0, 0, 1920, 1080);
    drawFace(t);
    H.view(g, cam, 1);
    drawDrop(t);
    // the chip (rk01): one grain breaks from the top edge and falls — "하나하나는 원래 단단한 바위의 일부"
    for (let i = 0; i < 7; i++) { const r = WO.rand(2100 + i)(); const t0 = T.chip + i * 0.45 + r * 0.2; const u = t - t0; const x0 = 300 + r * 1300, y0 = 90 + r * 120; if (t > t0 - 2) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(x0, y0, 10 + r * 8, 0, 6.283); g.fill(); }
      if (u > 0 && u < 2.4) { const x = x0 + 60 * u * (r - 0.5), y = y0 + 0.5 * 1400 * u * u; g.save(); g.translate(x, y); g.rotate(u * 5); const sz = 22 + r * 16; g.drawImage(r < 0.5 ? sp.grainG[0] : sp.grainG[1], -sz / 2, -sz / 2, sz, sz); g.restore(); } }
    if (t > T.rain0 - 0.3 && t < T.rain1) drawRain(t, WO.clamp((t - T.rain0 + 0.3) / 0.6, 0, 1) * (1 - WO.clamp((t - (T.rain1 - 0.6)) / 0.6, 0, 1)));
    if (t > T.rain2 && t < E('rk07') + 0.6) drawRain(t, 0.6 * WO.clamp((t - T.rain2) / 0.8, 0, 1) * (1 - WO.clamp((t - E('rk07')) / 0.6, 0, 1)));
    H.reset(g);
    // night: the face cools and darkens; rk05: day and night alternate faster and faster as the key light's colour swings
    if (t > T.night && t < T.split) {
      let k; if (t < T.cycles0) k = WO.ease.inout((t - T.night) / 1.2); else { const u = t - T.cycles0; const ph = u * (1.2 + u * 0.9); k = 0.5 + 0.5 * Math.cos(ph * 3.14159); }
      g.fillStyle = `rgba(8,14,34,${0.5 * k})`; g.fillRect(0, 0, 1920, 1080);
      if (t >= T.cycles0) { g.fillStyle = `rgba(255,190,110,${0.08 * (1 - k)})`; g.fillRect(0, 0, 1920, 1080); }
    }
    drawBigDrop(t);
    drawLedge(t);
    drawGhosts(t);
    drawPile(t);
    H.keyLight(g, t < T.recap ? 0.9 : 0.5);
  });
};
