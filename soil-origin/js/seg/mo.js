/* seg/mo.js — chapter 1 「흙이 되려면 무엇이 필요한가?」: the surface under our feet, the moon's regolith, back to the soil, then down. */
window.SEG = window.SEG || {};
window.SEG.mo = (ctx, K, TX, H, win) => {
  const { tl, scene, onFrame, fitCanvas, rand } = ctx, { S, E, w, about, at, WO, mat, sp } = H;
  const [el] = H.mount(`
    <section class="scene" id="mo">
      <canvas class="world"></canvas>
      <h1 class="hero moonq"></h1>
      <p class="hero num zero">0<i>살았던 생명</i></p>
      <p class="hero two"><span class="mat rockw">바위</span><span class="plus">+</span><span class="lifew" style="color:#9fd36a">생명</span></p>
      <p class="sup" style="left:0;right:0;top:860px;text-align:center">달 표면의 가루 <b>레골리스</b> · 미세 운석이 수십억 년 두드려 부순 바위</p>
      <p class="note" id="mo-moonnote" style="left:1250px;top:220px">생명의 색이 없다</p>
    </section>`);
  scene(el, win.a, win.b + 1.4);
  const canvas = H.q(el, 'canvas.world'), g = fitCanvas(canvas, 1920, 1080, 2);
  const zero = H.q(el, '.zero'), two = H.q(el, '.two'), sup = H.q(el, '.sup'), note = H.q(el, '#mo-moonnote');
  H.q(el, '.rockw').style.backgroundImage = H.tex.rock;
  gsap.set([zero, two, sup, note], { autoAlpha: 0 });

  // ---- the earth column (world coords; the camera travels it) ----
  const LAY = [ // [y0, y1, material canvas]
    [-60, 110, mat.soilO.canvas], [110, 560, mat.soilA.canvas], [560, 1110, mat.soilB.canvas], [1110, 1700, mat.soilC.canvas], [1700, 3200, mat.granite.canvas],
  ];
  const cam = H.cam(); cam.x = 0; cam.y = -120; cam.z = 1.25;
  const fog = WO.canvas(16, 1080); { const fg = WO.ctx(fog); const gr = fg.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,4,2,0.55)'); fg.fillStyle = gr; fg.fillRect(0, 0, 16, 1080); }
  const pr = WO.rand(41);
  const pebbles = Array.from({ length: 90 }, () => ({ x: -40 + pr() * 2000, y: 600 + pr() * 1100, s: [sp.grainA[0], sp.grainA[1], sp.grainG[1], sp.grainA[2]][Math.floor(pr() * 4)], k: 1.2 + pr() * 2.6, r: pr() * 6.28 }));
  const threads = Array.from({ length: 28 }, () => ({ x: pr() * 1920, y0: -60, len: 120 + pr() * 300, ph: pr() * 6.28, w: 1 + pr() * 1.5 }));
  const litter = Array.from({ length: 14 }, (_, i) => ({ x: pr() * 1920, y: -86 + pr() * 22, s: sp.leaf[i % 3], r: pr() * 6.28, k: 0.6 + pr() * 0.5 }));
  const blades = Array.from({ length: 140 }, () => ({ x: -40 + pr() * 2000, h: 40 + pr() * 110, lean: (pr() - 0.5) * 0.9, w: 3 + pr() * 4, c: pr() }));
  function drawEarth(t) {
    H.view(g, cam, 1);
    // the dusk above the surface
    const sky = g.createLinearGradient(0, -700, 0, -60); sky.addColorStop(0, '#1a1410'); sky.addColorStop(1, '#4a3322'); g.fillStyle = sky; g.fillRect(-40, -800, 2000, 740);
    for (const [y0, y1, c] of LAY) {
      // tile the texture over the layer band; the seam between layers is a soft irregular edge
      const h = y1 - y0; let yy = y0;
      while (yy < y1) { const hh = Math.min(c.height, y1 - yy); g.drawImage(c, 0, 0, c.width, hh, -40, yy, 2000, hh); yy += hh; }
    }
    // the surface: grass blades (swaying a little), leaves lying on the litter
    for (const b of blades) { const sway = Math.sin(t * 1.3 + b.x * 0.01) * 0.06; g.strokeStyle = b.c < 0.5 ? '#5f7a2e' : '#8aa348'; g.lineWidth = b.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(b.x, -56); g.quadraticCurveTo(b.x + b.lean * b.h * 0.6, -56 - b.h * 0.6, b.x + (b.lean + sway) * b.h, -56 - b.h); g.stroke(); }
    for (const l of litter) { g.save(); g.translate(l.x, l.y); g.rotate(l.r); g.scale(l.k, l.k * 0.45); g.drawImage(l.s, -45, -45); g.restore(); }
    // root threads hanging into the topsoil, pebbles in the subsoil
    g.strokeStyle = 'rgba(222,200,160,0.8)'; g.lineCap = 'round';
    for (const th of threads) { g.lineWidth = th.w; g.beginPath(); g.moveTo(th.x, th.y0); for (let y = 0; y <= th.len; y += 30) g.lineTo(th.x + 18 * Math.sin(y / 60 + th.ph), th.y0 + y); g.stroke(); }
    for (const p of pebbles) { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(p.k, p.k); g.drawImage(p.s, -p.s.width / 2, -p.s.height / 2); g.restore(); }
    // layer seams: a darker crumbly line with a lit lip
    g.lineWidth = 6; g.strokeStyle = 'rgba(10,5,2,0.55)';
    for (const [y0] of LAY.slice(1)) { g.beginPath(); for (let x = -40; x <= 1960; x += 40) g.lineTo(x, y0 + 6 * Math.sin(x / 90 + y0) + 4 * WO.noise(x / 60, y0)); g.stroke(); }
    H.reset(g);
    g.drawImage(fog, 0, 0, 1920, 1080);
  }
  // the shoe's shadow falling on the surface (mo01): a soft sole silhouette
  const sole = WO.canvas(420, 760); { const s = WO.ctx(sole); s.filter = 'blur(18px)'; s.fillStyle = 'rgba(6,3,1,0.78)';
    s.beginPath(); s.ellipse(210, 240, 165, 220, 0, 0, Math.PI * 2); s.fill(); s.beginPath(); s.ellipse(210, 580, 130, 150, 0, 0, Math.PI * 2); s.fill();
    s.fillRect(90, 240, 240, 340); s.filter = 'none'; }

  // ---- the title made of soil grains (technique: cokacmotion 17-hangul-particles, rebuilt in Canvas 2D) ----
  const title = '흙은 어디에서 왔는가?';
  const pts = WO.sampleText(title, "700 150px 'Gowun Batang'", 3400, 17, 150);
  const rnd = rand(71);
  const grains = pts.map((p) => ({ tx: 960 + p[0], ty: 430 + p[1], sx: 1290 + (rnd() - 0.5) * 90, sy: 300 + (rnd() - 0.5) * 60, d: rnd(), s: sp.grainA[Math.floor(rnd() * 3)], r: rnd() * 6.28, up: 0.6 + rnd() * 0.8, vx: (rnd() - 0.5) * 160 }));
  const T_gather = S('mo02') + 0.1, T_hold = E('mo02'), T_scatter = about('mo03', '달에') - 0.1, T_moon = S('mo04') - 0.15, T_earth = S('mo07') - 0.1;
  function drawGrains(t) {
    if (t < T_gather - 0.1 || t > T_moon) return;
    H.reset(g);
    for (const p of grains) {
      let x, y, a = 1;
      if (t < T_scatter) { const k = WO.ease.out(WO.clamp((t - T_gather - p.d * 0.9) / 1.4, 0, 1)); if (k <= 0) continue; x = p.sx + (p.tx - p.sx) * k; y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 120 * p.up; a = Math.min(1, k * 3); }
      else { const u = t - T_scatter - p.d * 0.35; if (u < 0) { x = p.tx; y = p.ty; } else { x = p.tx + p.vx * u; y = p.ty - 420 * p.up * u - 60 * u * u; a = WO.clamp(1 - u / 1.6, 0, 1); } }
      if (a <= 0) continue;
      g.globalAlpha = a; g.translate(x, y); g.rotate(p.r + (t - T_gather) * 0.4 * (p.d - 0.5)); g.drawImage(p.s, -p.s.width / 2, -p.s.height / 2); g.setTransform(1, 0, 0, 1, 0, 0);
    }
    g.globalAlpha = 1;
  }

  // ---- the moon: black sky, hard-lit regolith, a bootprint ----
  const stars = Array.from({ length: 140 }, (_, i) => ({ x: WO.rand(i + 300)() * 1920, y: WO.rand(i + 900)() * 420, r: 0.6 + WO.rand(i + 7)() * 1.4, a: 0.3 + WO.rand(i + 1200)() * 0.7 }));
  const mcam = H.cam(); mcam.x = 0; mcam.y = 0; mcam.z = 0.92;
  // micrometeorite strikes (mo06): hashed times, each a streak + a grey dust puff
  const strikes = Array.from({ length: 22 }, (_, i) => { const r = WO.rand(500 + i); return { t: S('mo06') + 0.2 + i * ((E('mo06') - S('mo06') - 1.2) / 22) + r() * 0.3, x: 560 + r() * 900, y: 560 + r() * 400, a: 0.9 + r() * 0.8 }; });
  function drawMoon(t) {
    H.reset(g);
    g.fillStyle = '#050608'; g.fillRect(0, 0, 1920, 1080);
    for (const s of stars) { g.globalAlpha = s.a; g.fillStyle = '#dfe3ea'; g.fillRect(s.x, s.y, s.r, s.r); }
    g.globalAlpha = 1;
    H.view(g, mcam, 1);
    // the regolith face: a cut like the earth's, the horizon a hard line of light
    const sky = 400;
    // the ground: an uneven horizon of low dust rises (no straight line across the frame), then the cut face
    g.save(); g.beginPath(); g.moveTo(-200, 1400);
    for (let x = -200; x <= 2120; x += 24) g.lineTo(x, sky + 46 * WO.fbm(x / 420, 0.3, 77, 3) - 20 + 18 * WO.noise(x / 60, 1, 78));
    g.lineTo(2120, 1400); g.closePath(); g.clip();
    g.drawImage(mat.regolith.canvas, 0, 0, mat.regolith.w, mat.regolith.h, -200, sky - 60, 2320, 1365);
    const gr = g.createLinearGradient(0, sky - 40, 0, sky + 110); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-200, sky - 60, 2320, 200);
    g.restore();
    // a few half-buried rocks on the horizon, lit hard from the upper right
    for (const [rx, ry, rr] of [[300, 392, 46], [1500, 384, 70], [1640, 408, 30], [760, 398, 26]]) { const grd = g.createRadialGradient(rx + rr * 0.4, ry - rr * 0.5, rr * 0.1, rx, ry, rr); grd.addColorStop(0, '#c7cacf'); grd.addColorStop(0.6, '#7a7e84'); grd.addColorStop(1, '#2a2c30'); g.fillStyle = grd; g.beginPath(); g.ellipse(rx, ry, rr, rr * 0.62, 0, 3.14, 6.283); g.fill(); g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.ellipse(rx - rr * 0.9, ry + 6, rr * 1.1, rr * 0.22, 0, 0, 6.283); g.fill(); }
    // strikes
    for (const s of strikes) {
      const u = t - s.t; if (u < -0.25 || u > 1.6) continue;
      if (u < 0) { const k = (u + 0.25) / 0.25; g.strokeStyle = `rgba(255,250,240,${0.85 * k})`; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x + 300 * (1 - k), s.y - 520 * (1 - k)); g.lineTo(s.x + 240 * (1 - k) + 20, s.y - 420 * (1 - k) - 40); g.stroke(); }
      else { const k = WO.clamp(u / 1.4, 0, 1); const rr = 10 + 90 * Math.sqrt(k);
        // the little crater it leaves: a dark pit with a lit far rim (the hard sun from the upper right)
        g.globalAlpha = Math.min(1, u * 4); g.fillStyle = 'rgba(30,32,36,0.8)'; g.beginPath(); g.ellipse(s.x, s.y, 16, 9, 0, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(230,234,240,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(s.x - 2, s.y + 2, 17, 10, 0, 3.4, 6.1); g.stroke();
        g.globalAlpha = (1 - k) * 0.55; g.fillStyle = '#b9bcc2'; for (let i = 0; i < 9; i++) { const a = i * 0.7 + s.a, d = rr * (0.5 + 0.5 * ((i * 37) % 10) / 10); g.beginPath(); g.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d * 0.5 - 40 * k * (1 - k) * 4 * ((i % 3) + 1) / 3, 2 + 4 * (1 - k), 0, 6.28); g.fill(); } g.globalAlpha = 1; }
    }
    H.reset(g);
  }

  // ---- life lights in the earth face (mo07) ----
  const life = Array.from({ length: 46 }, (_, i) => { const r = WO.rand(800 + i); return { x: 120 + r() * 1680, y: -40 + r() * 620, d: r(), ph: r() * 6.28, s: 0.7 + r() * 0.9 }; });
  const T_life = about('mo07', '생명이');
  function drawLife(t) {
    if (t < T_life) return;
    H.view(g, cam, 1);
    g.globalCompositeOperation = 'lighter';
    for (const p of life) { const u = t - T_life - p.d * 1.2; if (u < 0) continue; const k = WO.ease.out(WO.clamp(u / 0.8, 0, 1)) * (0.6 + 0.4 * Math.sin(t * 2.2 + p.ph)); g.globalAlpha = k * 0.9; const sz = 44 * p.s; g.drawImage(sp.glowLife, p.x - sz / 2, p.y - sz / 2, sz, sz); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    H.reset(g);
  }

  // ---- camera moves (reasons in the storyboard) ----
  tl.fromTo(cam, { z: 1.32, y: -560 }, { z: 1.12, y: -470, duration: E('mo02') - win.a, ease: 'none', immediateRender: false }, win.a);       // settle: looking down at our feet
  tl.fromTo(mcam, { z: 0.92, x: 0, y: 0 }, { z: 1.6, x: -37, y: 65, duration: E('mo04') - about('mo04', '우주인이'), ease: 'power2.inOut', immediateRender: false }, about('mo04', '우주인이'));   // push in: "발자국이 선명"
  tl.fromTo(mcam, { z: 1.6, x: -37, y: 65 }, { z: 2.3, x: 120, y: 200, duration: 1.2, ease: 'power3.inOut', immediateRender: false }, S('mo05') - 0.1);   // ECU: the grains, "흙?"
  tl.fromTo(mcam, { z: 2.3, x: 120, y: 200 }, { z: 1.7, x: 40, y: 150, duration: 1.3, ease: 'power3.inOut', immediateRender: false }, S('mo06') - 0.2);   // back out: the strikes over the whole face
  tl.fromTo(cam, { z: 1.0, y: -300 }, { z: 1.0, y: -300, duration: 0.01, immediateRender: false }, T_earth);
  tl.fromTo(cam, { y: -300, z: 1.0 }, { y: 1950, z: 0.96, duration: E('mo08') - about('mo08', '바위가') + 0.6, ease: 'power2.inOut', immediateRender: false }, about('mo08', '바위가') - 0.4);  // crane down: "바위가 부서지는 쪽부터"

  // ---- type ----
  const moonq = H.q(el, '.moonq'); moonq.textContent = '흙?'; gsap.set(moonq, { autoAlpha: 0 });
  const mq = TX.split(moonq, { by: 'chars' });
  tl.fromTo(mq.outer, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.18, immediateRender: false }, about('mo05', '흙이라고') - 0.2);
  tl.set(moonq, { autoAlpha: 1 }, about('mo05', '흙이라고') - 0.21);
  TX.tremble(mq, about('mo05', '꺼립니다') - 0.1, E('mo05') + 0.4, { amp: 2.2, rate: 9 });
  H.out(moonq, S('mo06') - 0.3, { y: -40 }, 0.4);
  H.inn(sup, S('mo04') + 0.6, { y: 24 }, 0.8); H.out(sup, E('mo04') - 0.2, { y: -20 }, 0.4);
  H.inn(note, about('mo06', '생명이') - 0.2, { x: 30 }, 0.6); H.out(note, E('mo06') - 0.1, { x: 20 }, 0.35);
  // "0 살았던 생명" — the number lands on the word
  H.inn(zero, about('mo06', '생명이') - 0.5, { scale: 1.3, y: 0 }, 0.6, 'power4.out'); H.out(zero, E('mo06') - 0.1, { y: -40 }, 0.35);
  // "바위 + 생명"
  const rw = H.q(el, '.rockw'), pl = H.q(el, '.plus'), lw = H.q(el, '.lifew');
  gsap.set([rw, pl, lw], { autoAlpha: 0 });
  tl.set(two, { autoAlpha: 1 }, about('mo07', '바위가') - 0.2);
  tl.fromTo(rw, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, about('mo07', '바위가') - 0.15);
  tl.fromTo(pl, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, about('mo07', '생명이') - 0.3);
  tl.fromTo(lw, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, about('mo07', '생명이') - 0.15);
  const lg = TX.split(lw, { by: 'chars' }); TX.breathe(lg, about('mo07', '생명이') + 0.5, E('mo07') + 0.5, { min: 600, max: 780, rest: 700, speed: 1.2 });
  H.out(two, about('mo08', '바위가') - 0.3, { y: -60 }, 0.5);

  // the frame
  onFrame((t) => {
    if (t < win.a - 0.1 || t > win.b + 1.5) return;
    g.clearRect(0, 0, 1920, 1080);
    const moon = t >= T_moon && t < T_earth;
    if (moon) { drawMoon(t); return; }
    drawEarth(t);
    // the shoe's shadow drops onto the face as the first line opens
    if (t < S('mo02') + 0.6) { const k = WO.ease.out(WO.clamp((t - win.a - 0.3) / 1.2, 0, 1)); const fade = 1 - WO.clamp((t - S('mo02')) / 0.6, 0, 1); H.view(g, cam, 1); WO.shoe(g, 1300, -58, 1.15, k * fade); if (k < 1) { g.globalAlpha = k * fade; } H.reset(g); g.globalAlpha = 1; }
    // the opening: light comes up
    if (t < win.a + 1.2) { H.reset(g); g.fillStyle = `rgba(0,0,0,${1 - WO.ease.out((t - win.a) / 1.2)})`; g.fillRect(0, 0, 1920, 1080); }
    // mo02: two fingertips come down to the surface, lift a pinch, and the title gathers out of it
    if (t > S('mo02') - 0.6 && t < T_moon) { const u = t - (S('mo02') - 0.6); const down = WO.ease.out(WO.clamp(u / 0.9, 0, 1)); const lift = WO.ease.inout(WO.clamp((u - 1.0) / 1.2, 0, 1)); const gone = WO.clamp((t - T_scatter) / 0.8, 0, 1);
      H.view(g, cam, 1); H.fingers(g, 1290, -40 - 500 * (1 - down) - 320 * lift, 0.9, 0.3 * (1 - lift), 1 - gone); H.reset(g); }
    drawGrains(t);
    drawLife(t);
    H.keyLight(g, 0.7);
  });
};
