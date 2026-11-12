/*
 * scenes.js — 「1차원부터 10차원까지」: a living graph-paper sketchbook (storyboard.md → 월드 바이블).
 * One three.js scene in toon shading with ink outlines. Shapes grow by being pushed at right angles: point → line →
 * square → cube → tesseract (a 4D cube rotated and projected), a Flatland plane cut by a ball, a garden hose with an
 * ant, curled knots at every grid point. Every state is a pure function of t; nothing is loaded.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data } = ctx;
  const SW = 1920, SH = 1080;
  scene('#world', 0, data.duration + 1);
  const s3d = Stage3D.create(document.getElementById('gl'), { W: SW, H: SH, fov: 30, environment: false, outline: true, outlineThickness: 0.0035, background: '#f7f1e3' });
  const T = s3d.THREE, scn = s3d.scene;
  s3d.renderer.toneMapping = T.NoToneMapping;
  Video.progress(0.3);

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), K = (t, a, b) => clamp((t - a) / (b - a), 0, 1), lerp = (a, b, k) => a + (b - a) * k;
  const io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2), out = (k) => 1 - Math.pow(1 - k, 3);
  const back = (k) => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const vis = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const rnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };

  // ---------- toon materials (3 tones) with ink outlines ----------
  const grad = new T.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, T.RedFormat); grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
  const toon = (hex, o = {}) => new T.MeshToonMaterial(Object.assign({ color: hex, gradientMap: grad }, o));
  const COL = { d0: 0xff5a4e, d1: 0xff9f1c, d2: 0xffd23f, d3: 0x3bceac, d4: 0x2e86de, dx: 0x8e5cf7, ink: 0x1d2033, hose: 0x4fbf6a, gray: 0xb7bccb };
  const M = { d0: toon(COL.d0), d1: toon(COL.d1), d2: toon(COL.d2), d3: toon(COL.d3), d4: toon(COL.d4), dx: toon(COL.dx), ink: toon(COL.ink), hose: toon(COL.hose), gray: toon(COL.gray), white: toon(0xffffff) };
  const noOutline = (m) => { m.userData.outlineParameters = { visible: false }; return m; };

  // ---------- lights ----------
  scn.add(new T.HemisphereLight(0xffffff, 0xe9e0cc, 0.9));
  const key = new T.DirectionalLight(0xffffff, 1.6); key.position.set(-10, 20, 12); scn.add(key);

  // ---------- the paper: cream with a blue grid ----------
  const pc = document.createElement('canvas'); pc.width = pc.height = 512; const pg = pc.getContext('2d');
  pg.fillStyle = '#f7f1e3'; pg.fillRect(0, 0, 512, 512);
  for (let i = 0; i <= 16; i++) { pg.strokeStyle = i % 4 === 0 ? 'rgba(120,160,215,0.55)' : 'rgba(150,185,230,0.3)'; pg.lineWidth = i % 4 === 0 ? 2.2 : 1.2; const v = i * 32; pg.beginPath(); pg.moveTo(v, 0); pg.lineTo(v, 512); pg.stroke(); pg.beginPath(); pg.moveTo(0, v); pg.lineTo(512, v); pg.stroke(); }
  const ptex = new T.CanvasTexture(pc); ptex.wrapS = ptex.wrapT = T.RepeatWrapping; ptex.repeat.set(50, 50); ptex.colorSpace = T.SRGBColorSpace; ptex.anisotropy = 8;
  const paper = new T.Mesh(new T.PlaneGeometry(400, 400), noOutline(new T.MeshBasicMaterial({ map: ptex }))); paper.rotation.x = -Math.PI / 2; scn.add(paper);
  scn.fog = new T.Fog(0xf7f1e3, 70, 160);
  // a soft contact shadow sprite (drawn flat under objects)
  const shc = document.createElement('canvas'); shc.width = shc.height = 128; const sg = shc.getContext('2d'); const sgr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); sgr.addColorStop(0, 'rgba(29,32,51,0.35)'); sgr.addColorStop(1, 'rgba(29,32,51,0)'); sg.fillStyle = sgr; sg.fillRect(0, 0, 128, 128);
  const shTex = new T.CanvasTexture(shc);
  const shadow = (w, d) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), noOutline(new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }))); m.rotation.x = -Math.PI / 2; m.position.y = 0.02; scn.add(m); return m; };

  // ---------- helpers: a rod between two points (edges), a sphere ----------
  const UP = new T.Vector3(0, 1, 0), tmpV = new T.Vector3(), tmpQ = new T.Quaternion();
  const rodGeo = new T.CylinderGeometry(1, 1, 1, 10);
  function rod(mat, r = 0.08) { const m = new T.Mesh(rodGeo, mat); m.userData.r = r; scn.add(m); return m; }
  function setRod(m, a, b) { tmpV.subVectors(b, a); const L = tmpV.length(); m.position.addVectors(a, b).multiplyScalar(0.5); tmpQ.setFromUnitVectors(UP, tmpV.normalize()); m.quaternion.copy(tmpQ); m.scale.set(m.userData.r, Math.max(1e-4, L), m.userData.r); }
  const sphGeo = new T.SphereGeometry(1, 28, 18);
  const ball = (mat, r = 0.5) => { const m = new T.Mesh(sphGeo, mat); m.scale.setScalar(r); scn.add(m); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z);

  // ---------- DOM texts and labels pinned to 3D points ----------
  const ui = document.getElementById('ui'), texts = [];
  function txt(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 't ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else if (o.r) { el.style.right = (1920 - x) + 'px'; el.style.textAlign = 'right'; } else el.style.left = x + 'px';
    el.style.top = y + 'px'; ui.appendChild(el); const X = { el, t0, t1, at: o.at }; texts.push(X); return X;
  }
  const pin = (html, at, t0, t1, cls = 'coord') => { const X = txt(html, 0, 0, t0, t1, { cls, at }); X.el.style.transform = 'translate(-50%,-100%)'; return X; };
  const card = (no, q, kw, c, id) => txt(`<div class="no">${no}</div><span class="q">${q.replace(kw, `<span class="${c}">${kw}</span>`)}</span>`, 'c', 0, S(id) - 0.2, S(id) + 3.6, { cls: 'card' });

  // ---------- the camera: eased keys ----------
  const keys = [];
  const cam = (t0, dur, pos, look) => keys.push({ t0, t1: t0 + dur, pos, look });
  function camAt(t) { let p = keys[0].pos.slice(), l = keys[0].look.slice(); for (const k of keys) { if (t < k.t0) break; const e = io(K(t, k.t0, k.t1)); for (let i = 0; i < 3; i++) { p[i] = lerp(p[i], k.pos[i], e); l[i] = lerp(l[i], k.look[i], e); } } return { p, l }; }

  // ===================== time table =====================
  const tL = { pt: S('lo01'), line: A('lo02', '쭉 밀면', -0.3), sq: A('lo03', '밀어 보겠', -0.3), sqNum: S('lo04') + 0.4, cube: A('lo05', '밀어 올리면', -0.6), cubeNum: S('lo06') + 0.4, rule: S('lo07'), q4: S('lo08') };
  const t4 = { time: S('d401'), mink: S('d402'), space4: S('d403'), noPic: S('d404'), tess: A('d405', '밀면', -0.4), hinton: A('d405', '1888', -0.3), shadow: S('d406'), flat: S('d407'), sphere: S('d408') + 1, ball4: S('d409'), why: S('d410') };
  const tX = { kal: S('ex01'), klein: S('ex02'), hose: S('ex03'), hoseIn: A('ex03', '가까이', -0.4), small: S('ex04'), str: S('ex05'), ten: S('ex06'), cy: S('ex07'), cyName: S('ex08'), m: S('ex09'), test: S('ex10'), lhc: S('ex11'), turn: S('ex12'), pop: S('pp01'), author: S('pp02'), same: S('pp03'), enjoy: S('pp04'), fin: S('fn01'), f2: S('fn02'), f3: S('fn03'), f4: S('fn04'), f5: S('fn05'), f6: S('fn06') };

  // ===================== op + lo: point → line → square → cube =====================
  const C0 = [-4, 0, 4];            // the corner where the point starts (bottom-left as seen from above)
  const pt = ball(M.d0, 0.55); pt.position.set(0, 0.55, 0);
  const lineM = new T.Mesh(new T.BoxGeometry(1, 0.3, 0.3), M.d1); scn.add(lineM);
  const sqM = new T.Mesh(new T.BoxGeometry(1, 0.16, 1), M.d2); scn.add(sqM);
  const cubeM = new T.Mesh(new T.BoxGeometry(1, 1, 1), M.d3); scn.add(cubeM);
  const marker = ball(M.ink, 0.22);
  const arrows = [[COL.d1, V(1, 0, 0)], [COL.d2, V(0, 0, -1)], [COL.d3, V(0, 1, 0)], [COL.d4, V(0.6, 0.55, 0.6).normalize()]].map(([c, dir]) => { const g = new T.Group(); const m = toon(c); const shaft = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 1, 10), m); shaft.position.y = 0.5; const head = new T.Mesh(new T.ConeGeometry(0.34, 0.8, 16), m); head.position.y = 1.045; head.scale.set(1, 1 / 9, 1); g.add(shaft, head); g.quaternion.setFromUnitVectors(UP, dir); scn.add(g); return g; });
  const shMain = shadow(12, 12);
  function updLo(t) {
    const on = t < t4.time + 1.2;
    // the point: centre during op, then to the corner
    const toCorner = io(K(t, tL.pt - 0.5, tL.pt + 1.5));
    const popIn = back(K(t, S('op03'), S('op03') + 0.8));
    pt.visible = on || t > tX.f2 - 1; pt.scale.setScalar(0.55 * popIn);
    pt.position.set(lerp(0, C0[0], toCorner), 0.55, lerp(0, C0[2], toCorner));
    // grow: line (x), square (−z), cube (+y); everything shrinks away when time arrives
    const away = 1 - io(K(t, t4.time, t4.time + 1.2));
    const kl = io(K(t, tL.line, tL.line + 2.2)), ks = io(K(t, tL.sq, tL.sq + 2.2)), kc = io(K(t, tL.cube, tL.cube + 2.4));
    lineM.visible = kl > 0.001 && away > 0.01 && ks < 0.999; lineM.scale.set(8 * kl, 1, 1); lineM.position.set(C0[0] + 4 * kl, 0.3, C0[2]);
    sqM.visible = ks > 0.001 && away > 0.01 && kc < 0.999; sqM.scale.set(8, 1, Math.max(0.3, 8 * ks)); sqM.position.set(0, 0.08, C0[2] - 4 * ks);
    cubeM.visible = kc > 0.001 && away > 0.01; cubeM.scale.set(8 * away, Math.max(0.16, 8 * kc) * away, 8 * away); cubeM.position.set(0, 4 * kc * away, 0);
    // the marker that a coordinate names
    const mk = vis(t, tL.line + 1.6, tL.q4, 0.4, 0.5); marker.visible = mk > 0.01; marker.scale.setScalar(0.25 * mk);
    let mp = V(C0[0] + 5.2, 0.4, C0[2]); if (t > tL.sqNum - 0.3) mp = V(C0[0] + 5.2, 0.3, C0[2] - 2.4); if (t > tL.cubeNum - 0.3) mp = V(C0[0] + 5.2, 3.2, C0[2] - 2.4); marker.position.copy(mp);
    // the axes (lo07–08)
    const ak = vis(t, tL.rule, t4.time + 0.6, 0.6, 0.6);
    arrows.forEach((g, i) => { const k = i < 3 ? back(K(t, tL.rule + i * 0.4, tL.rule + i * 0.4 + 0.7)) : back(K(t, tL.q4 + 0.6, tL.q4 + 1.4)); g.visible = ak > 0.01 && k > 0.01; g.scale.set(Math.max(0.001, k * ak), Math.max(0.001, 9 * k * ak), Math.max(0.001, k * ak)); g.position.set(C0[0], 0.2, C0[2]); if (i === 3) g.rotation.z = Math.sin(t * 2.4) * 0.25; });
    shMain.visible = on; shMain.scale.setScalar(Math.max(0.2, kc));
  }
  // op texts
  txt('<span class="hero h0"><span class="c1">1</span><span class="mut">D</span> … <span class="cx">10</span><span class="mut">D</span></span>', 'c', 330, S('op01') + 0.3, S('op02') + 2);
  txt('<span class="hero h2">차원이란 <span class="c4">무엇</span>이고,<br>10차원은 <span class="cx">어디서</span> 왔을까?</span>', 'c', 290, S('op02') + 2.3, S('op03'));
  txt('<span class="hero h3">점 하나에서 시작해,<br>한 단계씩</span>', 'c', 130, S('op03') + 0.4, S('op04'));
  txt('<span class="hero h2"><span class="c3">확실한 수학</span> <span class="mut">|</span> <span class="cx">아직 가설</span></span>', 'c', 130, S('op04') + 0.4, S('op05'));
  txt('<span class="kick">차원 =</span><br><span class="hero h3">위치를 말하는 데 필요한<br><span class="c0">숫자의 개수</span></span>', 'c', 120, S('op05') + 0.6, tL.pt + 0.2);
  // lo texts
  card('0 → 3', '0차원에서 3차원까지는 어떻게 쌓일까?', '0차원에서 3차원', 'c3', 'lo01');
  txt('<span class="hero h1 c0">0<span class="mut" style="font-size:.5em">차원</span></span><br><span class="sub">필요한 숫자 <b>0개</b> · 점</span>', 120, 140, tL.pt + 3.6, tL.line + 0.4);
  txt('<span class="hero h1 c1">1<span class="mut" style="font-size:.5em">차원</span></span><br><span class="sub">필요한 숫자 <b>1개</b> · 선</span>', 120, 140, tL.line + 1.6, tL.sq);
  pin('x = 5.2', () => V(C0[0] + 5.2, 1.2, C0[2]), tL.line + 2.2, tL.sq + 0.2);
  txt('<span class="hero h3">선과 <span class="c2">직각</span>으로 밀면</span>', 120, 160, tL.sq + 0.2, tL.sqNum);
  txt('<span class="hero h1 c2">2<span class="mut" style="font-size:.5em">차원</span></span><br><span class="sub">숫자 <b>2개</b> · 위도와 경도처럼</span>', 120, 140, tL.sqNum, tL.cube);
  pin('(5.2, 2.4)', () => V(C0[0] + 5.2, 1.2, C0[2] - 2.4), tL.sqNum + 0.3, tL.cube + 0.2);
  txt('<span class="hero h1 c3">3<span class="mut" style="font-size:.5em">차원</span></span><br><span class="sub">숫자 <b>3개</b> · 높이까지, 몇 층인지까지</span>', 120, 140, tL.cubeNum, tL.rule);
  pin('(5.2, 2.4, 3.2)', () => V(C0[0] + 5.2, 4.2, C0[2] - 2.4), tL.cubeNum + 0.3, tL.rule + 0.2);
  txt('<span class="kick">규칙</span><br><span class="hero h3">모든 방향과 <span class="c3">직각</span>인<br>새 방향으로 밀면 +1</span>', 120, 130, tL.rule + 0.4, tL.q4);
  txt('<span class="hero h1 c4">4<span class="mut" style="font-size:.5em">차원</span>?</span><br><span class="sub">대답은 <b>두 갈래</b></span>', 120, 140, tL.q4 + 0.4, t4.time + 0.3);

  // ===================== d4: time, the tesseract, Flatland, a 4D ball =====================
  // time: a ball bouncing along x, its past positions stacked along the time axis (−z)
  const ghosts = Array.from({ length: 14 }, () => { const m = ball(toon(COL.d4, { transparent: true, opacity: 0.35 }), 0.5); noOutline(m.material); return m; });
  const runner = ball(M.d4, 0.6);
  const timeAxis = new T.Group(); { const m = toon(COL.ink); const sh = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 15, 8), m); sh.position.y = 7.5; const hd = new T.Mesh(new T.ConeGeometry(0.3, 0.8, 12), m); hd.position.y = 15.4; timeAxis.add(sh, hd); timeAxis.quaternion.setFromUnitVectors(UP, V(0, 0, -1)); scn.add(timeAxis); }
  function updTime(t) {
    const v = vis(t, t4.time + 0.6, t4.space4 + 0.4, 0.6, 0.6); runner.visible = timeAxis.visible = v > 0.01;
    const bx = (tt) => -6 + ((tt * 2.2) % 12), by = (tt) => 0.6 + Math.abs(Math.sin(tt * 3)) * 2.4;
    runner.position.set(bx(t), by(t), 4); runner.scale.setScalar(0.6 * v);
    ghosts.forEach((g, i) => { const tt = t - (i + 1) * 0.35, k = K(t, t4.mink + i * 0.25, t4.mink + i * 0.25 + 0.4) * v; g.visible = k > 0.01; g.position.set(bx(tt), by(tt), 4 - (i + 1) * 1.1); g.scale.setScalar(0.5 * k); });
    timeAxis.position.set(-7, 0.1, 4.5); timeAxis.scale.set(1, Math.max(0.001, K(t, t4.mink - 0.2, t4.mink + 0.8) * v), 1);
  }
  txt('<span class="kick">첫 번째 대답</span><br><span class="hero h2 c4">시간</span><br><span class="sub">장소 3개 + 몇 시 = 숫자 <b>4개</b></span>', 120, 130, t4.time + 0.4, t4.mink);
  txt('<span class="kick">1908 · 헤르만 민코프스키</span><br><span class="hero h2"><span class="c4">4차원 시공간</span></span><br><span class="sub">상대성 이론의 무대</span>', 120, 130, t4.mink + 0.4, t4.space4);
  // the tesseract: 16 vertices, 32 edges, rotated in 4D and projected
  const verts4 = []; for (let i = 0; i < 16; i++) verts4.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  const edges4 = []; for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) edges4.push([i, j, b]); }
  const tessMat = [toon(COL.d4), toon(0x7fb8f0)];
  const tRods = edges4.map(([, , b]) => rod(b === 3 ? tessMat[1] : tessMat[0], 0.09));
  const tNodes = verts4.map(() => ball(M.ink, 0.16));
  const tp = verts4.map(() => new T.Vector3());
  function placeTess(t, cx, cy, cz, size, ext, ang) {
    const c1 = Math.cos(ang), s1 = Math.sin(ang), c2 = Math.cos(ang * 0.6), s2 = Math.sin(ang * 0.6);
    verts4.forEach((p, i) => {
      let [x, y, z, w] = p; w = w * ext; if (ext < 1e-3) w = -1 * 0;
      const x1 = x * c1 - w * s1, w1 = x * s1 + w * c1; const y1 = y * c2 - w1 * s2, w2 = y * s2 + w1 * c2;
      const d = 3.2, f = d / (d - w2 * 0.9 * ext);
      tp[i].set(cx + x1 * f * size, cy + y1 * f * size, cz + z * f * size);
    });
  }
  function updTess(t) {
    // visible from d405 to the end of d4, back in the lineup (fn)
    const inD4 = vis(t, t4.tess - 0.3, t4.flat + 0.6, 0.6, 0.8), inFn = vis(t, tX.f2 + 2, data.duration + 2, 0.8, 0.1);
    const vv = Math.max(inD4, inFn); const show = vv > 0.01;
    tRods.forEach((r) => (r.visible = show)); tNodes.forEach((n) => (n.visible = show)); if (!show) return;
    const ext = inFn > 0 ? 1 : io(K(t, t4.tess, t4.tess + 2.4)), ang = Math.max(0, t - (t4.tess + 2.2)) * 0.55;
    const P = inFn > 0 ? [4.3, 2.4, 0, 1.1] : t > t4.shadow - 0.2 ? [lerp(0, 5, io(K(t, t4.shadow - 0.2, t4.shadow + 1.2))), 4.5, 0, 1.9] : [0, 4.5, 0, 1.9];
    placeTess(t, P[0], P[1], P[2], P[3] * vv, ext, ang);
    edges4.forEach(([i, j], k) => { setRod(tRods[k], tp[i], tp[j]); tRods[k].scale.x = tRods[k].scale.z = 0.09 * vv; });
    tNodes.forEach((n, i) => { n.position.copy(tp[i]); n.scale.setScalar(0.16 * vv); });
  }
  txt('<span class="kick">두 번째 대답</span><br><span class="hero h3">가로, 세로, 높이 모두와<br><span class="c4">직각인 네 번째 방향</span></span>', 120, 130, t4.space4 + 0.4, t4.noPic);
  txt('<span class="hero h3">머릿속에 그릴 수는 없지만,<br><span class="c3">규칙</span>은 그대로</span>', 120, 140, t4.noPic + 0.3, t4.tess);
  txt('<span class="kick">1888 · 수학자 찰스 힌턴</span><br><span class="hero h2 c4">테서랙트</span><br><span class="sub">4차원의 정육면체</span>', 120, 130, t4.hinton, t4.shadow);
  // the shadow analogy: a wire cube and its square-in-a-square shadow on the paper
  const cubeEdges = []; for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) { const j = i ^ (1 << b); if (j > i) cubeEdges.push([i, j]); }
  const wRods = cubeEdges.map(() => rod(M.d3, 0.08)), sRods = cubeEdges.map(() => rod(toon(0x555a72), 0.05));
  function updShadow(t) {
    const v = vis(t, t4.shadow + 1.5, t4.flat + 0.3, 0.6, 0.8); const show = v > 0.01; wRods.forEach((r) => (r.visible = show)); sRods.forEach((r) => (r.visible = show)); if (!show) return;
    const cx = -6, cz = 0, a = t * 0.4, P = [], Q = [];
    for (let i = 0; i < 8; i++) { const x = (i & 1 ? 1 : -1), y = (i & 2 ? 1 : -1), z = (i & 4 ? 1 : -1); const xr = x * Math.cos(a) - z * Math.sin(a) * 0.15, zr = z; P.push(V(cx + xr * 1.6 * v, 6 + y * 1.6 * v, cz + zr * 1.6 * v)); const f = 10 / (10 - (y * 1.6 + 6) * 0.6); Q.push(V(cx + xr * 1.6 * f * 0.55 * v, 0.06, cz + zr * 1.6 * f * 0.55 * v)); }
    // shadow: perspective from a light straight above → near face bigger than far face (square inside a square)
    cubeEdges.forEach(([i, j], k) => { setRod(wRods[k], P[i], P[j]); wRods[k].scale.x = wRods[k].scale.z = 0.08 * v; const qi = Q[i].clone(), qj = Q[j].clone(); const si = (i & 2) ? 1.45 : 0.85, sj = (j & 2) ? 1.45 : 0.85; qi.set(cx + (qi.x - cx) * si, 0.06, cz + (qi.z - cz) * si); qj.set(cx + (qj.x - cx) * sj, 0.06, cz + (qj.z - cz) * sj); setRod(sRods[k], qi, qj); sRods[k].scale.x = sRods[k].scale.z = 0.05 * v; });
  }
  txt('<span class="hero h3">우리가 그리는 것은<br><span class="c4">3차원 그림자</span></span><br><span class="sub">정육면체 그림자 = 사각형 안의 사각형</span>', 'c', 110, t4.shadow + 0.4, t4.flat);
  // Flatland: a big plane, a flat square creature, a ball passing through; its cross-section
  const flatY = 3;
  const plane = new T.Mesh(new T.BoxGeometry(22, 0.06, 16), noOutline(toon(0x9ad7f0, { transparent: true, opacity: 0.55, depthWrite: false }))); scn.add(plane);
  const flatlander = new T.Group(); { const body = new T.Mesh(new T.BoxGeometry(1.4, 0.12, 1.4), M.d2); const eye = new T.Mesh(sphGeo, M.ink); eye.scale.setScalar(0.18); eye.position.set(0.45, 0.12, -0.3); flatlander.add(body, eye); scn.add(flatlander); }
  const fBall = ball(noOutline(toon(COL.d0, { transparent: true, opacity: 0.32, depthWrite: false })), 2.6);
  const disk = new T.Mesh(new T.CylinderGeometry(1, 1, 0.14, 48), toon(COL.d0, { transparent: true, opacity: 1 })); disk.renderOrder = 5; scn.add(disk);
  const R0 = 2.6;
  function updFlat(t) {
    const v = vis(t, t4.flat + 0.6, t4.ball4 + 0.4, 0.8, 0.6); const show = v > 0.01; plane.visible = flatlander.visible = show; plane.scale.setScalar(Math.max(0.001, v)); plane.position.set(0, flatY, 0); flatlander.position.set(-5.5, flatY + 0.06, 3); flatlander.rotation.y = Math.sin(t) * 0.3;
    const k = K(t, t4.sphere, E('d408') - 0.4), y = lerp(flatY + R0 + 3, flatY - R0 - 3, io(k));
    fBall.visible = show && k > 0 && k < 1; fBall.position.set(1.5, y, 0);
    const d = y - flatY, r = Math.abs(d) < R0 ? Math.sqrt(R0 * R0 - d * d) : 0; disk.visible = show && r > 0.02; disk.position.set(1.5, flatY + 0.12, 0); disk.scale.set(Math.max(0.001, r), 1, Math.max(0.001, r));
  }
  txt('<span class="kick">1884 · 소설 「플랫랜드」</span><br><span class="hero h3">평면에서만 사는<br><span class="c2">2차원 생물</span></span>', 120, 130, t4.flat + 0.4, t4.sphere);
  txt('<span class="hero h3">평면 생물에게는<br>점 → <span class="c0">원</span> → 점</span>', 120, 140, t4.sphere + 0.6, t4.ball4);
  // the 4D ball through our space
  const b4 = ball(M.d4, 1);
  function updBall4(t) { const v = vis(t, t4.ball4 + 0.4, t4.why + 0.6, 0.3, 0.4); const ph = K(t, t4.ball4 + 1, E('d409') - 0.3); const s = Math.sin(ph * Math.PI) * 3.2; b4.visible = v > 0.01 && s > 0.02; b4.position.set(0, 3.6, 0); b4.scale.setScalar(Math.max(0.001, s)); }
  txt('<span class="hero h3">4차원 공이 지나가면<br>공이 <span class="c4">생겼다 커졌다 사라진다</span></span>', 120, 130, t4.ball4 + 0.4, t4.why);
  txt('<span class="hero h2">여기까지는 <span class="c3">수학</span></span><br><span class="sub">그런데 왜 물리학은 <b>더 많은 차원</b>을?</span>', 'c', 120, t4.why + 0.4, tX.kal);

  // ===================== ex: Kaluza–Klein, the hose, strings, Calabi–Yau, M-theory, the collider =====================
  const hose = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 60, 40, 1, true), M.hose); hose.rotation.z = Math.PI / 2; scn.add(hose);
  const ant = new T.Group(); { const m = M.ink; for (const [x, r] of [[-0.22, 0.13], [0, 0.11], [0.2, 0.15]]) { const s = new T.Mesh(sphGeo, m); s.scale.setScalar(r); s.position.x = x; ant.add(s); } scn.add(ant); }
  function updHose(t) {
    const v = vis(t, tX.kal + 3.6, tX.str + 0.6, 0.8, 0.8); hose.visible = ant.visible = v > 0.01; hose.position.set(0, 2.4, 0); hose.scale.set(Math.max(0.001, v), 1, Math.max(0.001, v));
    const a = (t - tX.hose) * 2.4, along = Math.sin((t - tX.hose) * 0.35) * 4; ant.position.set(along, 2.4 + Math.cos(a) * 0.82, Math.sin(a) * 0.82); ant.rotation.set(a, 0, 0); ant.visible = v > 0.01 && t > tX.hoseIn;
  }
  // tiny strings (vibrating loops)
  const strings = Array.from({ length: 9 }, (_, i) => { const m = new T.Mesh(new T.TorusGeometry(0.7, 0.07, 8, 60), M.dx); scn.add(m); return m; });
  function updStrings(t) { const v = vis(t, tX.str + 0.4, tX.cy + 0.4, 0.6, 0.6); strings.forEach((m, i) => { m.visible = v > 0.01; const x = -6 + (i % 3) * 6, z = -3 + Math.floor(i / 3) * 3; m.position.set(x, 3 + Math.sin(t * 2 + i) * 0.3, z); m.rotation.set(t * 0.8 + i, t * 1.1 + i * 2, 0); const w = 1 + 0.25 * Math.sin(t * (9 + i)); m.scale.set(v * w, v / w, v); }); }
  // Calabi–Yau stand-ins: small knots at every grid point
  const knotGeo = new T.TorusKnotGeometry(0.42, 0.14, 80, 10, 2, 3);
  const knots = []; for (let j = 0; j < 6; j++) for (let i = 0; i < 10; i++) { const m = new T.Mesh(knotGeo, M.dx); m.userData.p = [-13.5 + i * 3, 0.9, -7.5 + j * 3]; scn.add(m); knots.push(m); }
  function updKnots(t) {
    const v = vis(t, tX.cy + 0.6, tX.test + 0.4, 0.8, 0.6), pulse = 1 + 0.15 * vis(t, tX.m + 0.4, tX.test, 0.4, 0.4) * Math.sin(t * 6);
    knots.forEach((m, i) => { const k = v * back(K(t, tX.cy + 0.6 + (i % 10) * 0.05 + Math.floor(i / 10) * 0.08, tX.cy + 1.4 + (i % 10) * 0.05 + Math.floor(i / 10) * 0.08)); m.visible = k > 0.01; m.scale.setScalar(Math.max(0.001, k * pulse)); m.position.set(...m.userData.p); m.rotation.set(t * 0.7 + i, t * 0.5 + i * 0.3, 0); });
  }
  // the collider ring
  const ring = new T.Mesh(new T.TorusGeometry(8, 0.55, 18, 120), M.gray); ring.rotation.x = Math.PI / 2; scn.add(ring);
  const beams = Array.from({ length: 6 }, (_, i) => ball(i % 2 ? M.d0 : M.d4, 0.3));
  function updRing(t) { const v = vis(t, tX.test + 0.2, tX.turn + 0.8, 0.8, 0.8); ring.visible = v > 0.01; ring.scale.setScalar(Math.max(0.001, v)); ring.position.set(0, 0.6, 0); beams.forEach((b, i) => { const a = t * (i % 2 ? 2.4 : -2.4) + i; b.visible = v > 0.01; b.position.set(Math.cos(a) * 8 * v, 0.6, Math.sin(a) * 8 * v); }); }
  card('5 → 10', '10차원은 어디에서 나왔을까?', '10차원', 'cx', 'ex01');
  txt('<span class="kick">1921 · 물리학자 테오도어 칼루차</span><br><span class="hero h2"><span class="cx">5차원</span>이면</span><br><span class="sub">중력 + 전자기력 = <b>한 식</b></span>', 120, 130, tX.kal + 3.6, tX.klein);
  txt('<span class="kick">1926 · 오스카 클라인</span><br><span class="hero h3">다섯 번째 방향은<br><span class="cx">아주 작게 말려 있다</span></span>', 120, 130, tX.klein + 0.4, tX.hose);
  txt('<span class="hero h3">멀리서는 <span class="mut">선</span>,<br>가까이서는 <span style="color:#2f9a4a">관</span></span>', 120, 140, tX.hoseIn + 0.4, tX.small);
  txt('<span class="hero h3">너무 작게 말리면<br><span class="cx">보이지 않는다</span></span>', 120, 140, tX.small + 0.3, tX.str);
  txt('<span class="kick">끈 이론</span><br><span class="hero h3">모든 입자 =<br>작은 <span class="cx">끈의 떨림</span></span>', 120, 130, tX.str + 0.4, tX.ten);
  txt('<span class="hero h0"><span class="c3">9</span><span class="mut">+</span><span class="c4">1</span><span class="mut">=</span><span class="cx">10</span></span><br><span class="sub">공간 9 + 시간 1 · 계산이 앞뒤가 맞는 유일한 차원 수</span>', 'c', 140, tX.ten + 0.4, tX.cy);
  txt('<span class="hero h3">남는 <span class="cx">여섯 차원</span>은<br>모든 지점마다 작게 말려 있다</span>', 120, 120, tX.cy + 0.4, tX.cyName);
  txt('<span class="kick">수학자 두 사람의 이름</span><br><span class="hero h2 cx">칼라비-야우 공간</span>', 120, 120, tX.cyName + 0.3, tX.m);
  txt('<span class="kick">1995 · 물리학자 에드워드 위튼</span><br><span class="hero h1">M 이론 · <span class="cx">11</span><span class="mut" style="font-size:.5em">차원</span></span><br><span class="sub">다섯 가지 끈 이론을 하나로</span>', 120, 110, tX.m + 0.4, tX.test);
  txt('<span class="hero h2">아직 <span class="c0">실험으로 확인되지 않음</span></span>', 'c', 120, tX.test + 0.3, tX.lhc);
  txt('<span class="kick">유럽의 거대한 입자 가속기</span><br><span class="hero h3">흔적 <span class="c0">발견 없음</span></span><br><span class="sub">다만 아주 작다면 안 보일 수도 · <b>없다는 결론도 아님</b></span>', 'c', 110, tX.lhc + 0.4, tX.turn);
  txt('<span class="hero h3">여기까지가 <span class="cx">물리학의 10차원</span></span><br><span class="sub">그런데 자주 만나는 <b>다른 설명</b>이 있습니다</span>', 'c', 120, tX.turn + 0.3, tX.pop);

  // ===================== pp: the popular meanings vs the same small knots =====================
  const popKnots = Array.from({ length: 6 }, (_, i) => { const m = new T.Mesh(knotGeo, M.dx); scn.add(m); return m; });
  function updPop(t) { const v = vis(t, tX.pop + 0.2, tX.fin + 0.4, 0.6, 0.6); const same = io(K(t, tX.same, tX.same + 1.5)); popKnots.forEach((m, i) => { const k = v * back(K(t, tX.pop + 0.4 + i * 0.15, tX.pop + 1.1 + i * 0.15)); m.visible = k > 0.01; m.position.set(-9 + i * 3.6, 2.2, 0); const s = lerp(1.3 + (i % 3) * 0.5, 1.1, same); m.scale.setScalar(Math.max(0.001, k * s)); m.rotation.set(t * (0.4 + i * 0.15 * (1 - same)) + i, t * 0.5, 0); }); }
  const popWords = ['가능한 미래?', '모든 가능성?', '다른 우주?', '…?', '…?', '모든 것?'];
  popWords.forEach((w, i) => { pin(`<span class="hero" style="font-size:52px">${i + 5}</span><br><span class="sub ${i < 2 ? '' : ''}" style="font-size:30px">${w}</span>`, () => V(-9 + i * 3.6, 5, 0), tX.pop + 0.6 + i * 0.15, tX.author + 0.2, 'hero'); });
  popWords.forEach((w, i) => { pin(`<span class="hero cx" style="font-size:52px">${i + 5}</span><br><span class="sub" style="font-size:30px">작게 말린 방향</span>`, () => V(-9 + i * 3.6, 5, 0), tX.same + 0.9, tX.fin, 'hero'); });
  card('?', '흔히 듣는 차원 이야기는 맞을까?', '맞을까', 'c0', 'pp01');
  txt('<span class="kick">2006 · 캐나다 작가 롭 브라이언턴의 책과 영상</span><br><span class="hero h3">작가 스스로도<br><span class="c0">물리학이 받아들이는 이론은 아니다</span></span>', 'c', 120, tX.author + 0.4, tX.same, {});
  txt('<span class="hero h3">상상을 돕는 <span class="c2">이야기</span>로</span>', 'c', 640, tX.enjoy + 0.2, tX.fin);

  // ===================== fn: the lineup =====================
  const fLine = new T.Mesh(new T.BoxGeometry(2.6, 0.3, 0.3), M.d1), fSq = new T.Mesh(new T.BoxGeometry(2.6, 0.16, 2.6), M.d2), fCube = new T.Mesh(new T.BoxGeometry(2.6, 2.6, 2.6), M.d3), fKnot = new T.Mesh(knotGeo, M.dx);
  [fLine, fSq, fCube, fKnot].forEach((m) => scn.add(m));
  function updFn(t) {
    const v = vis(t, tX.f2 - 0.6, data.duration + 2, 0.8, 0.1); const show = v > 0.01;
    const k = (i) => back(K(t, tX.f2 + 0.3 + i * 0.35, tX.f2 + 0.9 + i * 0.35));
    if (show) { pt.visible = true; pt.position.set(-11.6, 0.8, 0); pt.scale.setScalar(0.55 * Math.max(0.001, k(0))); }
    fLine.visible = fSq.visible = fCube.visible = fKnot.visible = show;
    fLine.position.set(-9, 0.6, 0); fLine.scale.setScalar(Math.max(0.001, k(1)));
    fSq.position.set(-5.2, 0.4, 0); fSq.scale.setScalar(Math.max(0.001, k(2)));
    fCube.position.set(-1.2, 1.5, 0); fCube.scale.setScalar(Math.max(0.001, k(3))); fCube.rotation.y = t * 0.3;
    fKnot.position.set(9.4, 2.2, 0); fKnot.scale.setScalar(Math.max(0.001, 1.8 * back(K(t, tX.f5 - 0.2, tX.f5 + 0.6)))); fKnot.rotation.set(t * 0.6, t * 0.4, 0);
  }
  card('정리', '그래서, 차원은 몇 개일까?', '몇 개', 'c4', 'fn01');
  txt('<span class="hero h3">차원 = 위치에 필요한 <span class="c0">숫자의 개수</span></span><br><span class="sub">직각인 방향을 하나씩 더하며 늘어난다</span>', 'c', 120, tX.f2 + 0.3, tX.f3);
  pin('<span class="hero c3" style="font-size:60px">0 · 1 · 2 · 3</span><br><span class="sub">보고 잴 수 있는 세계</span>', () => V(-6.8, 4.6, 0), tX.f3 + 0.2, data.duration + 5, 'hero');
  pin('<span class="hero c4" style="font-size:60px">4</span><br><span class="sub">시공간 · 수학</span>', () => V(4.3, 5.6, 0), tX.f4 + 0.3, data.duration + 5, 'hero');
  pin('<span class="hero cx" style="font-size:60px">10</span><br><span class="sub">끈 이론의 가설</span>', () => V(9.4, 5.4, 0), tX.f5 + 0.3, data.duration + 5, 'hero');
  txt('<span class="hero h3">계산은 원하지만,<br>자연이 그런지는 <span class="cx">아직 모른다</span></span>', 'c', 760, tX.f5 + 1.2, tX.f6);
  txt('<span class="hero h2">눈은 <span class="c3">셋</span>, 수학은 <span class="cx">그 너머</span></span>', 'c', 760, tX.f6 + 0.6, data.duration + 5);

  // ===================== camera path =====================
  cam(0, 0, [0, 30, 6], [0, 0, 0]);
  cam(tL.pt - 0.4, 2, [0, 22, 7], [0, 0, 0.5]);
  cam(tL.cube - 0.4, 3, [17, 16, 22], [0, 3, 0]);
  cam(tL.rule, 4, [24, 19, 26], [-1, 3, 0]);
  cam(t4.time, 2.4, [6, 10, 20], [-1, 2, -2]);
  cam(t4.space4 + 0.4, 2.6, [0, 9, 18], [0, 4.2, 0]);
  cam(t4.shadow + 0.6, 2.4, [-1, 10, 20], [-0.5, 3.6, 0]);
  cam(t4.flat + 0.4, 2.6, [10, 13, 17], [0, 2.4, 0]);
  cam(t4.ball4 + 0.2, 2, [0, 8, 17], [0, 3.6, 0]);
  cam(tX.kal + 0.4, 2.6, [0, 46, 30], [0, 1, 0]);
  cam(tX.hose - 0.4, 2, [0, 40, 26], [0, 2.4, 0]);
  cam(tX.hoseIn, 3, [3, 6.5, 8], [0, 2.4, 0]);
  cam(tX.str + 0.2, 2.5, [0, 14, 18], [0, 2.4, 0]);
  cam(tX.cy, 2.5, [0, 18, 20], [0, 0.6, -1]);
  cam(tX.cyName, 3, [2, 5.5, 6], [1.5, 0.9, 1.5]);
  cam(tX.m + 0.3, 3, [0, 20, 22], [0, 0.6, -1]);
  cam(tX.test + 0.2, 3, [0, 20, 17], [0, 0, 0]);
  cam(tX.pop, 2.6, [0, 8, 26], [0, 3, 0]);
  cam(tX.f2 - 0.6, 3, [-0.6, 7, 27], [-0.6, 2.4, 0]);
  cam(tX.f6, 6, [-0.6, 9, 31], [-0.6, 2.4, 0]);
  keys.sort((a, b) => a.t0 - b.t0);

  Video.progress(0.7);
  const proj = new T.Vector3();
  onFrame((t) => {
    updLo(t); updTime(t); updTess(t); updShadow(t); updFlat(t); updBall4(t); updHose(t); updStrings(t); updKnots(t); updRing(t); updPop(t); updFn(t);
    const { p, l } = camAt(t);
    s3d.camera.position.set(p[0] + Math.sin(t * 0.12) * 0.4, p[1], p[2] + Math.cos(t * 0.1) * 0.3); s3d.camera.lookAt(l[0], l[1], l[2]); s3d.camera.updateMatrixWorld();
    s3d.render();
    for (const x of texts) {
      const a = vis(t, x.t0, x.t1, 0.45, 0.4);
      if (a <= 0) { if (x.el.style.opacity !== '0') x.el.style.opacity = '0'; continue; }
      const kin = out(K(t, x.t0, x.t0 + 0.5));
      if (x.at) { proj.copy(x.at()).project(s3d.camera); x.el.style.transform = `translate(${((proj.x + 1) / 2 * SW).toFixed(1)}px, ${((1 - proj.y) / 2 * SH - (1 - kin) * 14).toFixed(1)}px) translate(-50%, -100%)`; x.el.style.left = '0'; x.el.style.top = '0'; x.el.style.textAlign = 'center'; }
      else x.el.style.transform = `translateY(${((1 - kin) * 24).toFixed(1)}px)`;
      x.el.style.opacity = a.toFixed(3);
    }
  });
});
