/*
 * scenes.js — 「컴퓨터 하드웨어 한 번에 총정리」: one three.js world (js/world3d.js), one camera that travels the board,
 * labels that ride on the parts, data cubes that carry the story (storyboard.md).
 * Everything is a pure function of t: camera keys are eased between fixed times, part states are ramps of t,
 * cubes are placed in closed form. No tween keeps state between frames.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data } = ctx;
  const HW = window.HW, { k: K, io, out, back, lerp, clamp } = HW;
  const SW = 1920, SH = 1080;
  const s3d = Stage3D.create(document.getElementById('gl'), { W: SW, H: SH, fov: 28, exposure: 0.88 });
  const T = s3d.THREE;
  s3d.renderer.shadowMap.enabled = true; s3d.renderer.shadowMap.type = T.PCFShadowMap;
  s3d.scene.fog = new T.Fog(0xeef1f5, 130, 280);
  const R = HW.build(T, s3d.scene);
  Video.progress(0.4);
  scene('#world', 0, data.duration + 1);

  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const vis = (t, a, b, fi = 0.45, fo = 0.45) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  const V = (x, y, z) => new T.Vector3(x, y, z);

  // ---------- the camera: keys eased from the pose the previous key left ----------
  const keys = [];
  const cam = (t0, dur, pos, look, ease = io) => keys.push({ t0, t1: t0 + dur, pos, look, ease });
  function camAt(t) {
    let p = keys[0].pos.slice(), l = keys[0].look.slice();
    for (const k of keys) { if (t < k.t0) break; const e = k.ease(K(t, k.t0, k.t1)); for (let i = 0; i < 3; i++) { p[i] = lerp(p[i], k.pos[i], e); l[i] = lerp(l[i], k.look[i], e); } }
    return { p, l };
  }

  // ---------- DOM: texts on the studio air, and labels riding on parts ----------
  const ui = document.getElementById('ui'), labels = document.getElementById('labels');
  const texts = [];
  /** a text block at (x, y) shown over [t0, t1] (enters from below, leaves upwards) */
  function txt(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 't ' + (o.cls || ''); el.innerHTML = html;
    el.style.left = (x === 'c' ? 0 : x) + 'px'; el.style.top = y + 'px'; if (x === 'c') { el.style.right = '0'; el.style.textAlign = 'center'; }
    if (o.align === 'r') { el.style.left = 'auto'; el.style.right = (1920 - x) + 'px'; el.style.textAlign = 'right'; }
    ui.appendChild(el); texts.push({ el, t0, t1, dy: o.dy ?? 26 }); return el;
  }
  const labs = [];
  /** a label riding on a 3D point (fn of t → Vector3): dot, hairline, name in the part's colour, the kitchen role */
  function lab(name, role, color, at, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'lab' + (o.big ? ' big' : ''); el.style.color = color;
    el.innerHTML = `<i class="dot"></i><i class="stem"></i><span class="txt">${o.pct ? '<span class="pct">0%</span>' : ''}<span class="nm">${name}</span>${role ? `<span class="rl">${role}</span>` : ''}</span>`;
    if (o.off) { const tx = el.querySelector('.txt'); tx.style.transform = `translate(calc(-50% + ${o.off[0]}px), ${o.off[1]}px)`; el.querySelector('.stem').style.opacity = '0'; }
    labels.appendChild(el); const L = { el, at, t0, t1, pct: o.pct, pctEl: el.querySelector('.pct'), last: '' }; labs.push(L); return L;
  }
  const C = { cpu: '#ff6b4a', ram: '#3d8bff', ssd: '#19b48a', gpu: '#7a5cff', vram: '#8f78ff', psu: '#f0a000', cool: '#1fb3d6', board: '#6f8f66', hdd: '#7f9491' };

  // ---------- part anchors (world) ----------
  const P = {
    cpu: () => V(-3, coolerY(tNow) > 3 ? 1.2 + chipLift(tNow) * 4.5 : 7.2, 2.5), ram: () => V(6.7, 4.6 + ramLift(tNow), 2.5), ssd: () => V(-9.6, 1.0, -4.2),
    gpu: () => V(-1, 12.5, -9.0), gpuChip: () => V(-1, 8.6, -8.9), vram: () => V(3.8, 9.6, -8.8), board: () => V(10.5, 0.4, 9.5), psu: () => V(-9, 8.6, 19.5), hdd: () => V(hddX(tNow), 1.6, 8), cool: () => V(-3, 7.2, 2.5), case: () => V(17, 13, 20),
  };
  let tNow = 0;

  // ---------- time table ----------
  const t = {
    lid: A('op04', '본체를', -0.1), calc: A('op05', '계산하는', -0.2), mem: A('op05', '기억하는', -0.2), link: A('op05', '연결해', -0.2),
    chef: A('op07', '요리사', -0.2), counter: A('op07', '조리대와', -0.2), fridge: A('op07', '냉장고', -0.2), floor: A('op07', '주방 바닥', -0.2), elec: A('op07', '전기 설비', -0.2),
    toCpu: A('op08', '컴퓨터에서', -0.4), coolUp: A('cpu02', '냉각 장치', -0.4), chipUp: S('cpu03') + 0.2, cores: S('cpu04'), multi: S('cpu05'), clock: S('cpu06'), clockN: A('cpu07', '50억', -0.3), wait: S('cpu08'), back: S('cpu09'),
    mem: S('mem01'), ramW: A('mem01', 'RAM', -0.3), ssdW: A('mem01', '저장장치', -0.3), ramC: S('mem02'), ssdC: S('mem03'), flow: S('mem04'), flowCpu: A('mem04', 'CPU가', -0.3), why: S('mem05'), fast: S('mem06'), slow: S('mem07'),
    cap: S('mem08'), tb: S('mem09'), off: A('mem10', '꺼지면', -0.3), gone: A('mem10', '모두 사라', -0.3), on: S('mem11') + 0.8, hdd: S('mem12'), race: S('mem13'), load: S('mem14'), sum: S('mem15'), gfx: S('mem16'), card: A('mem17', '그래픽카드', -0.4),
    shroud: S('gpu01') + 0.2, gcores: A('gpu02', '작은 코어', -0.3), n16k: A('gpu03', '1만', -0.3), vram: A('gpu04', 'VRAM', -0.3), vramRole: S('gpu05'), bw: S('gpu06'), bwRam: S('gpu07'), full: S('gpu08'), stut: S('gpu09'), gback: S('gpu10'), link2: S('gpu11'),
    mb: S('base01'), wires: A('base01', '그 기판을', -0.3), slots: S('base02'), mbRole: S('base03'), elec2: S('base04'), psu: S('base04b'), ac: S('base05'), dcNeed: S('base06'), dc: S('base07'), watt: S('base08'),
    heat: S('base09'), coolW: S('base09b'), fans: S('base10'), throttle: S('base11'), caseW: S('base12'), allDone: S('base13'),
    fin: S('fin01'), tm: S('fin02'), fCpu: S('fin03'), fRam: S('fin04'), fVram: S('fin05'), fGpu: S('fin06'), fSsd: S('fin07'), r1: S('fin08'), r2: S('fin09'), r3: S('fin10'), end: S('fin11'), END: data.duration,
  };

  // ---------- part states (pure functions of t) ----------
  const lidUp = (tt) => io(K(tt, t.lid, t.lid + 2.4)) * (1 - io(K(tt, t.caseW, t.caseW + 2.2))) + io(K(tt, t.end + 0.5, t.end + 2.6)) * 0;
  const coolerY = (tt) => io(K(tt, t.coolUp, t.coolUp + 2.2)) * (1 - io(K(tt, t.back + 1.6, t.back + 3.8))) * 16;
  const chipLift = (tt) => io(K(tt, t.chipUp, t.chipUp + 1.8)) * (1 - io(K(tt, t.back, t.back + 2.2)));
  const ramLift = (tt) => out(K(tt, t.ramC, t.ramC + 1)) * (1 - io(K(tt, t.ssdC, t.ssdC + 1))) * 1.4;
  const hddX = (tt) => lerp(-60, -27, io(K(tt, t.hdd, t.hdd + 2.2))) - 40 * io(K(tt, t.sum, t.sum + 2));
  const shroudUp = (tt) => io(K(tt, t.shroud, t.shroud + 2.2)) * (1 - io(K(tt, t.gback, t.gback + 2.4)));
  const dimPower = (tt) => K(tt, t.off, t.off + 0.5) * (1 - K(tt, t.on, t.on + 0.8));
  const wallsDown = (tt) => io(K(tt, t.lid + 1.2, t.lid + 3.4)) * (1 - io(K(tt, t.caseW, t.caseW + 2.2)));
  const heatK = (tt) => K(tt, t.heat + 0.3, t.heat + 2.5) * (1 - K(tt, t.fans + 1, t.fans + 4.5));
  const fanFast = (tt) => K(tt, t.fans, t.fans + 1.2) * (1 - K(tt, t.caseW, t.caseW + 2));

  // ---------- camera path ----------
  const OV = [0, 52, 58], OVL = [0, 1, 0.5];
  cam(0, 0, [0, 80, 94], [0, 2, 4]);
  cam(0.4, 16, [0, 62, 72], [0, 2, 4], (k) => k);
  cam(t.lid + 0.6, 4, [2, 54, 60], [0, 1, 1.5]);
  cam(t.toCpu, 3.6, [7, 22, 22], [-3, 3, 2.5]);
  cam(t.coolUp, 2.6, [6, 16, 18], [0.5, 2.5, 2.5]);
  cam(t.chipUp, 2.2, [5, 15, 18], [0.8, 4.2, 2.5]);
  cam(t.back + 0.6, 3.2, [3, 30, 30], [1.5, 1, 0]);
  cam(t.ramC, 2.4, [19, 20, 22], [4.5, 2.6, 2.5]);
  cam(t.ssdC, 2.2, [-2, 19, 15], [-7.5, 0.8, -4.2]);
  cam(t.flow, 2, [0, 36, 34], [-1, 2, -1.5]);
  cam(t.cap, 2, [0, 38, 37], [-1, 3, -1.5]);
  cam(t.hdd, 2.6, [-18, 30, 38], [-18, 2, 0]);
  cam(t.sum, 2.6, [0, 44, 46], [0, 1, -1]);
  cam(t.card, 3, [0, 15, 13], [0, 6, -9]);
  cam(t.shroud + 0.5, 2.5, [-1, 9.5, 6], [-1, 6.3, -9.2]);
  cam(t.gcores, 2.5, [-1, 8, 0.5], [-1, 6.4, -9.0]);
  cam(t.vram, 2.4, [-1, 9.5, 5], [-1, 6.4, -9.0]);
  cam(t.bwRam, 2.6, [6, 23, 21], [2.5, 3.5, -4]);
  cam(t.gback, 3, OV, OVL);
  cam(t.elec2 + 1, 3, [-2, 24, 44], [-8, 3, 15]);
  cam(t.watt + 0.4, 2.6, [0, 50, 58], [0, 1, 3]);
  cam(t.heat, 2.6, [0, 25, 26], [-1.5, 3, -3]);
  cam(t.caseW, 2.6, [0, 56, 64], [0, 2, 4]);
  cam(t.fin, 2.6, [0, 50, 56], [0, 1.5, 1]);
  cam(t.r1, 6, [10, 48, 54], [0, 1.5, 1]);
  cam(t.r3, 5, [-4, 50, 58], [0, 1.5, 1.5]);
  cam(t.end, 5, [0, 66, 78], [0, 2, 4]);
  keys.sort((a, b) => a.t0 - b.t0);

  // ---------- data cubes: flows and stacks ----------
  const flows = [];
  const curve = (pts) => new T.CatmullRomCurve3(pts.map((p) => V(...p)));
  /** cubes emitted from a0 to a1 at `rate`/s, travelling the path at `speed` units/s */
  const flow = (a0, a1, pts, rate, speed, color, size = 1) => { const c = curve(pts); flows.push({ a0, a1, c, L: c.getLength(), rate, speed, col: new T.Color(color), size }); };
  const stacks = [];
  const stack = (pts, color, appear, vanish, size = 0.9) => stacks.push({ pts, col: new T.Color(color), appear, vanish, size });
  const SSD0 = [-9.6, 1.4, -4.2], RAM0 = [6.7, 5, 2.5], CPU0 = [-0.6, 2.2, 2.5];
  const ssdToRam = [SSD0, [-2, 9, -3], [3.5, 8, 0], RAM0], ramToCpu = [RAM0, [2.5, 6.5, 3.5], CPU0];
  // op05: the three jobs, a little traffic everywhere
  flow(t.mem, t.mem + 0.01, ssdToRam, 1, 1, 0x19b48a);
  // mem04: storage → RAM → CPU
  flow(t.flow + 0.6, t.why + 2, ssdToRam, 5, 8, 0x19b48a);
  flow(t.flowCpu, t.why + 2, ramToCpu, 5, 8, 0x3d8bff);
  // mem06: RAM → CPU fast; mem07: SSD → RAM slow
  flow(t.fast + 0.3, E('mem06'), ramToCpu, 16, 34, 0x3d8bff);
  flow(t.slow + 0.3, E('mem07'), ssdToRam, 2.2, 2.4, 0x19b48a);
  // mem08–09: capacity — 32 cubes over the RAM, 10×10×10 over the storage
  { const pts = []; for (let i = 0; i < 32; i++) pts.push([5.2 + (i % 4) * 1.0, 6.4 + Math.floor(i / 16) * 1.0, -1.0 + (Math.floor(i / 4) % 4) * 1.0 + 0.5]); stack(pts, 0x3d8bff, (i) => t.cap + 0.6 + i * 0.04, () => t.gone, 0.95); }
  { const pts = []; for (let y = 0; y < 10; y++) for (let z = 0; z < 10; z++) for (let x = 0; x < 10; x++) pts.push([-10 - 2.7 + x * 0.6, 1.6 + y * 0.6, -4.2 - 2.7 + z * 0.6]); stack(pts, 0x19b48a, (i) => t.tb + 0.3 + Math.floor(i / 100) * 0.28 + (i % 100) * 0.002, () => t.hdd + 0.4, 0.62); }
  // mem13: HDD vs SSD reading
  flow(t.race + 0.3, t.sum, [[-27, 4, 6], [-27, 12, 6], [-27, 20, 6]], 2.2, 3.2, 0x8fa3a0);
  flow(t.race + 0.3, t.sum, [[-9.6, 1.2, -4.2], [-9.6, 10, -4.2], [-9.6, 20, -4.2]], 30, 16, 0x19b48a);
  // gpu06: VRAM ↔ GPU, wide and fast
  const gc = [-1, 6.4, -8.85];
  for (const [vx, vy] of R.gpu.vramPos) { const w = [vx, 0.9 + vy, -8.75]; flow(t.bw + 0.2, t.full, [w, [(w[0] + gc[0]) / 2, (w[1] + gc[1]) / 2, -8.2], gc], 5, 9, 0xb9a6ff, 0.55); }
  // gpu07–08: the narrow road to RAM
  const ramToGpu = [RAM0, [5, 9.5, -2], [1, 9, -6.5], gc];
  flow(t.bwRam + 0.6, t.gback, ramToGpu, 1.6, 3.2, 0x3d8bff);
  flow(t.full + 0.6, t.gback, [...ramToGpu].reverse(), 1.4, 3.0, 0xb9a6ff);
  // base07: electricity along the PSU cable (amber)
  const cableWorld = R.psu.curve.points.map((p) => [p.x - 9, p.y - 0.8, p.z + 19.5]);
  flow(t.psu, t.heat, cableWorld, 6, 9, 0xffb020, 0.7);

  const DC = R.cubes, m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3(), tmpC = new T.Color();
  function placeCubes(tt) {
    let n = 0;
    for (const f of flows) {
      const travel = f.L / f.speed;
      if (tt < f.a0 || tt > f.a1 + travel) continue;
      const i0 = Math.max(0, Math.floor((tt - f.a0 - travel) * f.rate)), i1 = Math.floor((Math.min(tt, f.a1) - f.a0) * f.rate);
      for (let i = i0; i <= i1 && n < DC.max; i++) {
        const te = f.a0 + i / f.rate, s = (tt - te) * f.speed; if (s < 0 || s > f.L) continue;
        const u = s / f.L; f.c.getPointAt(u, pos);
        const k = Math.min(1, u * 8, (1 - u) * 8) * f.size; sc.set(k, k, k); q.setFromAxisAngle(V(0, 1, 0), i * 0.7 + u * 3);
        m4.compose(pos, q, sc); DC.mesh.setMatrixAt(n, m4); DC.mesh.setColorAt(n, f.col); n++;
      }
    }
    for (const st of stacks) {
      const v = st.vanish();
      if (tt > v + 1.2) continue;
      for (let i = 0; i < st.pts.length && n < DC.max; i++) {
        const a = st.appear(i); if (tt < a) continue;
        const k = back(K(tt, a, a + 0.35)) * (1 - io(K(tt, v + (i % 7) * 0.05, v + 0.6 + (i % 7) * 0.05))) * st.size; if (k <= 0.001) continue;
        pos.set(...st.pts[i]); sc.set(k, k, k); q.identity(); m4.compose(pos, q, sc); DC.mesh.setMatrixAt(n, m4); DC.mesh.setColorAt(n, st.col); n++;
      }
    }
    DC.mesh.count = n; DC.mesh.instanceMatrix.needsUpdate = true; if (DC.mesh.instanceColor) DC.mesh.instanceColor.needsUpdate = true;
  }

  // ---------- extra objects: clock rings, board wiring, airflow, heat lights ----------
  const rings = [];
  for (let i = 0; i < 4; i++) { const r = new T.Mesh(new T.TorusGeometry(3, 0.05, 8, 80), new T.MeshBasicMaterial({ color: 0xff6b4a, transparent: true, opacity: 0 })); r.rotation.x = Math.PI / 2; s3d.scene.add(r); rings.push(r); }
  const wireMat = new T.MeshStandardMaterial({ color: 0x3ccf7a, emissive: 0x2fd174, emissiveIntensity: 0.9, roughness: 0.4 });
  const wires = [[[-3, 0.35, 2.5], [1.5, 0.35, 2.5], [4.6, 0.35, 2.5]], [[-3, 0.35, 2.5], [-6, 0.35, -1], [-9.6, 0.35, -4.2]], [[-3, 0.35, 2.5], [-7.5, 0.35, 0], [-7.5, 0.35, -9.5]], [[14.2, 0.35, 2], [9, 0.35, 6], [-1, 0.35, 6], [-3, 0.35, 2.5]], [[8, 0.35, 2.5], [8, 0.35, -6], [-6, 0.35, -6], [-9.6, 0.35, -4.2]]]
    .map((pts) => { const g = new T.TubeGeometry(curve(pts), 60, 0.32, 8, false); const m = new T.Mesh(g, wireMat); m.visible = false; s3d.scene.add(m); return { m, n: g.index.count }; });
  const airN = 40, air = new T.InstancedMesh(new T.BoxGeometry(0.06, 0.06, 2.2), new T.MeshBasicMaterial({ color: 0x9fdcf0, transparent: true, opacity: 0.75 }), airN); air.count = 0; s3d.scene.add(air);
  const heatCpu = new T.PointLight(0xff7a3a, 0, 24, 1.6); heatCpu.position.set(-3, 7, 2.5); s3d.scene.add(heatCpu);
  const heatGpu = new T.PointLight(0xff7a3a, 0, 30, 1.6); heatGpu.position.set(-1, 8, -4); s3d.scene.add(heatGpu);
  const rr = HW.rand(55), airSeed = Array.from({ length: airN }, () => [rr(), rr(), rr()]);

  // ---------- glow (emissive) windows per part ----------
  const glowWin = { cpu: [[t.calc, t.mem], [t.chef, t.counter + 0.6], [t.fCpu, t.fRam]], ram: [[t.mem, t.link], [t.counter, t.fridge + 0.6], [t.ramW, t.ssdW + 1], [t.ramC, t.ssdC], [t.fRam, t.fVram]], ssd: [[t.mem, t.link], [t.fridge, t.floor + 0.6], [t.ssdW, t.ramC], [t.ssdC, t.flow], [t.fSsd, t.r1]], gpu: [[t.calc, t.mem], [t.card, t.shroud + 1.5], [t.fGpu, t.fSsd]], psu: [[t.link, t.chef], [t.elec, t.toCpu], [t.psu, t.heat]], cool: [[t.coolW, t.throttle + 2]] };
  const glowAt = (part, tt) => Math.max(0, ...glowWin[part].map(([a, b]) => vis(tt, a, b, 0.5, 0.7)));
  const M = R.mat;
  const setGlow = (mat, color, g) => { mat.emissive.setHex(color); mat.emissiveIntensity = g * 0.55; };

  // ---------- texts ----------
  const card = (no, q, kw, cls, t0) => txt(`<div class="no">CHAPTER ${String(no).padStart(2, '0')}</div><span class="q">${q.replace(kw, `<em class="${cls}">${kw}</em>`)}</span>`, 'c', 0, t0, t0 + 3.6, { cls: 'card' });
  // op
  txt('<span class="hero h3">RAM을 늘릴까?</span>', 150, 170, A('op02', 'RAM', -0.2), t.lid);
  txt('<span class="hero h3">그래픽카드를 바꿀까?</span>', 150, 270, A('op02', '그래픽카드', -0.2), t.lid);
  txt('<span class="hero h3">CPU가 문제일까?</span>', 150, 370, A('op02', 'CPU', -0.2), t.lid);
  txt('<span class="hero h2"><span class="c-cpu">계산</span><span class="vs">·</span><span class="c-ram">기억</span><span class="vs">·</span><span class="c-psu">연결과 전기</span></span>', 'c', 110, t.calc, S('op06') + 0.1);
  txt('<span class="hero h2">게임 화면이<br><span class="c-mut">뚝뚝 끊긴다면?</span></span>', 150, 170, S('op01') + 0.3, S('op02') - 0.1);
  txt('<span class="hero h3">어떤 부품이 있고<br><span class="c-cpu">무슨 일</span>을 하는지</span>', 1800, 170, S('op03') + 0.3, t.lid, { align: 'r' });
  txt('<span class="hero h2">식당 <span class="c-psu">주방</span>에 빗대면</span>', 'c', 110, S('op06') + 0.1, t.chef + 0.6);
  txt('<span class="hero h3">CPU가 <span class="c-ram">바로</span> 꺼내 씀</span>', 120, 160, S('mem02b') + 0.2, t.ssdC);
  // cpu
  card(2, 'CPU는 무슨 일을 하나?', 'CPU', 'c-cpu', S('cpu01') - 0.2);
  txt('<span class="kick">CENTRAL PROCESSING UNIT</span><br><span class="hero h2"><span class="c-cpu">CPU</span> 중앙 처리 장치</span>', 140, 760, S('cpu01') + 2.8, t.coolUp + 0.2);
  txt('<span class="hero h1"><span class="c-cpu">6~24</span><span class="unit">개</span></span><br><span class="sub">요즘 가정용 CPU의 <b>코어</b> 수</span>', 1180, 170, t.cores + 0.2, t.multi + 0.2);
  txt('<span class="hero h2">코어 = <span class="c-cpu">요리사</span></span><br><span class="sub">많을수록 여러 일을 <b>동시에</b></span>', 1180, 190, t.multi + 0.3, t.clock);
  txt('<span class="hero h1">5<span class="unit">GHz</span></span><br><span class="sub">1초에 맞추는 <b>박자</b> 수</span>', 1240, 170, t.clock + 0.4, t.clockN - 0.1);
  txt('<span class="hero h1"><span class="c-cpu">50억</span><span class="unit">번</span></span><br><span class="sub"><b>1초</b>에</span>', 1240, 170, t.clockN, t.wait);
  txt('<span class="hero h2">재료가 없으면<br><span class="c-mut">기다린다</span></span>', 1180, 180, t.wait + 0.4, t.back + 0.6);
  // mem
  card(3, 'RAM과 저장장치는 무엇이 다른가?', 'RAM과 저장장치', 'c-ram', S('mem01') - 0.2);
  txt('<span class="hero h2">왜 두 단계일까?</span><br><span class="sub"><b>속도</b>와 <b>크기</b>가 다르다</span>', 'c', 110, t.why + 0.2, t.fast);
  txt('<span class="kick">RAM</span><br><span class="hero h2 c-ram">수십 나노초</span><br><span class="sub">1나노초 = <b>10억 분의 1초</b></span>', 120, 150, t.fast + 0.2, t.cap);
  txt('<span class="kick">SSD</span><br><span class="hero h2 c-ssd">수십 마이크로초</span><br><span class="sub">RAM보다 <b>천 배쯤</b> 느림</span>', 1800, 150, t.slow + 0.2, t.cap, { align: 'r' });
  txt('<span class="kick">RAM</span><br><span class="hero h1 c-ram">16~32<span class="unit">GB</span></span>', 120, 150, t.cap + 0.3, t.off - 0.2);
  txt('<span class="kick">저장장치</span><br><span class="hero h1 c-ssd">1<span class="unit">TB</span></span><br><span class="sub">= <b>1000GB</b></span>', 1800, 150, t.tb + 0.2, t.off - 0.2, { align: 'r' });
  txt('<span class="hero h2">전원 <span class="c-mut">OFF</span></span><br><span class="sub">RAM의 데이터는 <b>모두 사라짐</b></span>', 'c', 120, t.off + 0.2, t.on + 1.2);
  txt('<span class="kick">하드디스크</span><br><span class="hero h1" style="color:#7f9491">200<span class="unit">MB/s</span></span>', 120, 140, t.race + 0.3, t.sum - 0.2);
  txt('<span class="kick">SSD</span><br><span class="hero h1 c-ssd">7000<span class="unit">MB/s</span></span><br><span class="sub"><b>서른 배</b> 넘게 빠름</span>', 1800, 140, t.race + 1.0, t.sum - 0.2, { align: 'r' });
  // gpu
  card(4, '그래픽카드에는 왜 VRAM이 따로 있나?', 'VRAM', 'c-gpu', S('gpu01') - 0.2);
  txt('<span class="hero h1"><span class="c-gpu">수천</span><span class="unit">개</span></span><br><span class="sub">단순한 계산만 하는 <b>작은 코어</b></span>', 1220, 170, t.gcores + 0.3, t.n16k);
  txt('<span class="kick">RTX 4090</span><br><span class="hero h1 c-gpu">16,384<span class="unit">개</span></span>', 1220, 170, t.n16k, t.vram);
  txt('<span class="hero h1 c-gpu">≈ 1000<span class="unit">GB/s</span></span><br><span class="sub">VRAM ↔ GPU</span>', 1180, 160, t.bw + 0.4, t.full);
  txt('<span class="hero h2 c-ram">100<span class="unit">GB/s</span> 미만</span><br><span class="sub">일반 RAM · <b>열 배쯤</b> 느림</span>', 120, 160, t.bwRam + 0.8, t.full);
  txt('<span class="hero h2">VRAM <span class="c-gpu">가득</span> →<br>느린 길로</span>', 120, 160, t.full + 0.3, t.stut + 0.2);
  txt('<span class="hero h2">뚝, 뚝 <span class="c-mut">끊기는 화면</span></span><br><span class="sub">그림이 <b>늦게</b> 선명해짐</span>', 120, 160, t.stut + 0.2, t.gback + 0.4);
  // base
  card(5, '부품들은 어떻게 연결되고 전기를 받나?', '연결', 'c-board', S('base01') - 0.2);
  const acSvg = '<svg width="420" height="120" viewBox="0 0 420 120"><path d="' + Array.from({ length: 85 }, (_, i) => `${i ? 'L' : 'M'}${i * 5},${60 - 46 * Math.sin(i * 5 / 420 * 6.283 * 3)}`).join(' ') + '" fill="none" stroke="#f0a000" stroke-width="6" stroke-linecap="round"/></svg>';
  const dcSvg = '<svg width="420" height="150" viewBox="0 0 420 150"><path d="M0,22 L420,22" stroke="#f0a000" stroke-width="6"/><path d="M0,75 L420,75" stroke="#f0a000" stroke-width="6" opacity="0.75"/><path d="M0,128 L420,128" stroke="#f0a000" stroke-width="6" opacity="0.5"/></svg>';
  txt(`<span class="kick">벽 콘센트</span><br><span class="hero h2">220<span class="unit">V</span> <span class="c-psu">교류</span></span><div class="wave">${acSvg}</div><span class="sub">1초에 <b>60번</b> 방향이 바뀜</span>`, 120, 130, t.ac + 0.2, t.watt);
  txt('<span class="hero h3">방향이 바뀌지 않는<br><span class="c-psu">낮은 전압의 직류</span>가 필요</span>', 1800, 160, t.dcNeed + 0.2, t.dc, { align: 'r' });
  txt(`<span class="kick">파워가 바꿔 줌</span><br><span class="hero h2 c-psu">직류</span><div class="wave">${dcSvg}</div><span class="sub"><b>12V · 5V · 3.3V</b></span>`, 1800, 130, t.dc + 0.2, t.watt, { align: 'r' });
  txt('<span class="hero h1 c-psu">W<span class="unit">와트</span></span><br><span class="sub">한꺼번에 내줄 수 있는 <b>전기의 양</b></span>', 'c', 110, t.watt + 0.3, t.heat);
  txt('<span class="hero h2">계산하면 <span style="color:#ff7a3a">뜨거워진다</span></span>', 'c', 110, t.heat + 0.4, t.fans);
  txt('<span class="hero h2">방열판이 퍼뜨리고<br><span class="c-cool">팬</span>이 내보낸다</span>', 1180, 150, t.fans + 0.3, t.throttle);
  txt('<span class="hero h2">못 식히면<br><span class="c-mut">스스로 속도를 낮춤</span></span>', 1180, 150, t.throttle + 0.2, t.caseW);
  // fin
  card(6, '컴퓨터가 버벅일 때는 무엇을 봐야 할까?', '무엇을 봐야', 'c-cpu', S('fin01') - 0.2);
  txt('<span class="kick">작업 관리자</span><br><span class="hero h3">부품마다 <b>얼마나 바쁜지</b></span>', 1800, 770, t.tm + 0.6, t.fCpu, { align: 'r' });
  txt('<span class="hero h3"><span class="c-cpu">CPU</span> 100%</span><br><span class="sub">요리사의 손이 모자람 → <b>CPU</b></span>', 1800, 770, t.fCpu + 0.3, t.fRam, { align: 'r' });
  txt('<span class="hero h3"><span class="c-ram">RAM</span> 가득</span><br><span class="sub">조리대가 좁음 → <b>RAM 늘리기</b></span>', 1800, 770, t.fRam + 0.3, t.fVram, { align: 'r' });
  txt('<span class="hero h3"><span class="c-gpu">VRAM</span> 가득</span><br><span class="sub"><b>설정 낮추기</b> · VRAM 더 큰 그래픽카드</span>', 1800, 770, t.fVram + 0.3, t.fGpu, { align: 'r' });
  txt('<span class="hero h3"><span class="c-gpu">GPU</span> 100%</span><br><span class="sub">그림 그리는 힘이 모자람</span>', 1800, 770, t.fGpu + 0.3, t.fSsd, { align: 'r' });
  txt('<span class="hero h3">불러올 때만 <span class="c-ssd">느림</span></span><br><span class="sub">저장장치를 → <b>SSD로</b></span>', 1800, 770, t.fSsd + 0.3, t.r1, { align: 'r' });
  txt('<span class="hero h2">컴퓨터 하드웨어<br>한 번에 총정리</span>', 'c', 120, t.end + 1.5, t.END + 5);

  // ---------- labels on parts ----------
  lab('CPU', '', C.cpu, P.cpu, t.calc, t.mem + 0.2); lab('GPU', '', C.gpu, P.gpu, t.calc + 0.3, t.mem + 0.2);
  lab('RAM', '', C.ram, P.ram, t.mem, t.link + 0.2, { off: [110, -20] }); lab('저장장치', '', C.ssd, P.ssd, t.mem + 0.3, t.link + 0.2, { off: [-150, -10] });
  lab('메인보드', '', C.board, P.board, t.link, t.chef); lab('파워', '', C.psu, P.psu, t.link + 0.3, t.chef);
  lab('CPU', '요리사', C.cpu, P.cpu, t.chef, t.toCpu + 0.4, { big: true }); lab('RAM', '조리대', C.ram, P.ram, t.counter, t.toCpu + 0.4, { big: true, off: [110, -20] }); lab('저장장치', '냉장고', C.ssd, P.ssd, t.fridge, t.toCpu + 0.4, { big: true, off: [-150, -10] });
  lab('메인보드', '주방 바닥', C.board, P.board, t.floor, t.toCpu + 0.4, { big: true }); lab('파워', '전기 설비', C.psu, P.psu, t.elec, t.toCpu + 0.4, { big: true });
  lab('냉각 장치', '', C.cool, P.cool, t.coolUp - 0.2, t.coolUp + 1.2);
  lab('코어', '실제로 계산하는 일꾼', C.cpu, () => V(-3, 7.4, 2.5), A('cpu03', '코어', -0.3), t.cores);
  lab('RAM', '조리대 · 지금 쓰는 데이터', C.ram, P.ram, t.ramW, t.ssdC); lab('저장장치', '냉장고 · 오래 보관', C.ssd, P.ssd, t.ssdW, t.flow + 0.3);
  lab('하드디스크', '둥근 원판이 돎', C.hdd, P.hdd, A('mem12', '하드디스크', -0.2), t.race); lab('SSD', '반도체 칩', C.ssd, P.ssd, A('mem12', 'SSD', -0.2), t.race);
  lab('CPU', '요리사', C.cpu, P.cpu, t.sum + 0.6, t.gfx + 0.3, { big: true }); lab('RAM', '조리대', C.ram, P.ram, t.sum + 1.0, t.gfx + 0.3, { big: true, off: [110, -20] }); lab('저장장치', '냉장고', C.ssd, P.ssd, t.sum + 1.4, t.gfx + 0.3, { big: true, off: [-150, -10] });
  lab('그래픽카드', '그림 전용 주방', C.gpu, P.gpu, t.card, t.shroud + 1.4, { big: true });
  lab('GPU', '그래픽 처리 장치', C.gpu, P.gpuChip, S('gpu01') + 2.2, t.gcores);
  lab('VRAM', '그림 주방의 조리대', C.vram, P.vram, t.vram + 0.6, t.bw + 0.2);
  lab('RAM', '', C.ram, P.ram, t.bwRam + 1, t.gback);
  lab('메인보드', '주방 바닥', C.board, P.board, t.mbRole - 0.2, t.elec2, { big: true });
  lab('CPU 자리', '', C.cpu, () => V(-3, 7.2, 2.5), t.slots + 0.2, t.mbRole); lab('RAM 자리', '', C.ram, P.ram, t.slots + 0.8, t.mbRole); lab('그래픽카드 자리', '', C.gpu, P.gpu, A('base02', '그래픽카드', -0.2), t.mbRole); lab('SSD 자리', '', C.ssd, P.ssd, A('base02', 'SSD', -0.2), t.mbRole);
  lab('파워', '전원 공급 장치', C.psu, P.psu, t.psu + 0.6, t.ac + 0.2, { big: true });
  lab('냉각 장치', '방열판 + 팬', C.cool, P.cool, t.coolW, t.throttle);
  lab('케이스', '부품을 담고 바람길을 만듦', '#6b7486', P.case, t.caseW + 1.4, t.allDone + 1);
  // fin: usage percentages riding on the parts
  const pctOf = { cpu: [[t.tm, 38], [t.fCpu, 100], [t.fRam, 45]], ram: [[t.tm, 52], [t.fRam, 97], [t.fVram, 55]], vram: [[t.tm, 41], [t.fVram, 100], [t.fGpu, 60]], gpu: [[t.tm, 47], [t.fGpu, 100], [t.fSsd, 50]], ssd: [[t.tm, 3], [t.fSsd, 96], [t.r1, 4]] };
  const pctAt = (part, tt) => { const a = pctOf[part]; let v = a[0][1]; for (let i = 1; i < a.length; i++) v = lerp(v, a[i][1], io(K(tt, a[i][0] + 0.2, a[i][0] + 1.4))); return Math.round(v); };
  const finLab = (part, name, color, at, off) => { const L = lab(name, '', color, at, t.tm + 0.4, t.r1 - 0.2, { pct: true, off }); L.part = part; return L; };
  finLab('cpu', 'CPU', C.cpu, () => V(-3, 7.2, 2.5)); finLab('ram', 'RAM', C.ram, P.ram, [150, 10]); finLab('gpu', 'GPU', C.gpu, () => V(-9, 12.5, -9), [-60, 190]); finLab('vram', 'VRAM', C.vram, () => V(8, 12.5, -9), [60, 190]); finLab('ssd', '저장장치', C.ssd, P.ssd, [-190, 10]);
  // fin: the recap roles
  lab('CPU', '계산하는 요리사', C.cpu, P.cpu, A('fin08', 'CPU', -0.2), t.end + 1); lab('RAM', '재료를 펼치는 조리대', C.ram, P.ram, A('fin08', 'RAM', -0.2), t.end + 1, { off: [130, -10] }); lab('저장장치', '보관하는 냉장고', C.ssd, P.ssd, A('fin08', '저장장치', -0.2), t.end + 1, { off: [-170, 0] });
  lab('그래픽카드', '그림 전용 주방', C.gpu, () => V(-9, 12.5, -9), A('fin09', '그래픽카드', -0.2), t.end + 1, { off: [-80, 150] }); lab('VRAM', '그 주방의 조리대', C.vram, () => V(8, 12.5, -9), A('fin09', 'VRAM', -0.2), t.end + 1, { off: [80, 150] });
  lab('메인보드', '잇는 바닥', C.board, P.board, A('fin10', '메인보드', -0.2), t.end + 1); lab('파워', '전기', C.psu, P.psu, A('fin10', '파워', -0.2), t.end + 1); lab('냉각 장치', '식히는 바람', C.cool, P.cool, A('fin10', '냉각', -0.2), t.end + 1);

  Video.progress(0.6);
  const proj = new T.Vector3(), m4b = new T.Matrix4();

  // ---------- the frame ----------
  onFrame((tt) => {
    tNow = tt;
    // camera (+ a slow breathing drift)
    const { p, l } = camAt(tt);
    s3d.camera.position.set(p[0] + Math.sin(tt * 0.11) * 0.5, p[1] + Math.sin(tt * 0.083) * 0.3, p[2]);
    s3d.camera.lookAt(l[0], l[1], l[2]); s3d.camera.updateMatrixWorld();

    // case lid
    const lu = lidUp(tt); R.glass.position.y = R.caseDims.CH - 0.6 + lu * 70; R.glass.visible = lu < 0.45;
    const wd = wallsDown(tt); R.walls.forEach((w) => { w.position.y = -0.6 - wd * 15; w.visible = wd < 0.99; });
    // cooler + chip
    const cy = coolerY(tt); R.cpu.cooler.position.y = 0.95 + cy; R.cpu.cooler.visible = cy < 15.5;
    const cl = chipLift(tt), chip = R.cpu.chip;
    chip.position.set(-3, 0.5 + cl * 3.6, 2.5); chip.scale.setScalar(1 + cl * 0.9); chip.rotation.x = cl * 0.5;
    R.cpu.lidMat.opacity = 1 - 0.88 * io(K(tt, t.chipUp + 0.8, t.chipUp + 2)) * (1 - K(tt, t.back, t.back + 1)); R.cpu.lidMat.depthWrite = R.cpu.lidMat.opacity > 0.9;
    let nCores = 8; if (tt > t.cores) nCores = Math.round(lerp(6, 24, K(tt, t.cores + 0.6, E('cpu04') - 0.4))); if (tt > t.multi) nCores = 24;
    R.cpu.cores.count = nCores;
    // multi-chefs pulse / waiting dim
    const wait = K(tt, t.wait, t.wait + 0.6) * (1 - K(tt, t.back, t.back + 0.6));
    R.cpu.cores.material.emissiveIntensity = 0.15 + 0.6 * vis(tt, t.multi, t.clock + 0.4) * (0.5 + 0.5 * Math.sin(tt * 6)) - 0.12 * wait;
    // clock rings
    const ringOn = vis(tt, t.clock + 0.2, t.wait, 0.5, 0.5);
    rings.forEach((r, i) => { const ph = (tt * (tt > t.clockN ? 1.6 : 0.7) + i / 4) % 1; r.position.set(-3, chip.position.y + 0.8, 2.5); r.scale.setScalar(0.6 + ph * 2.6); r.material.opacity = ringOn * (1 - ph) * 0.8; r.visible = ringOn > 0.01; });
    // RAM lift
    R.ram.sticks.forEach((s) => (s.position.y = 0.7 + ramLift(tt)));
    // HDD
    R.hdd.g.position.x = hddX(tt); R.hdd.g.visible = R.hdd.g.position.x > -58; R.hdd.platter.rotation.y = -tt * 9; R.hdd.arm.rotation.y = 0.25 + 0.2 * Math.sin(tt * 2.3);
    // GPU shroud + cores + VRAM
    const su = shroudUp(tt); R.gpu.shroud.position.set(0, su * 26, 0.25 + su * 6); R.gpu.shroud.visible = su < 0.99;
    R.gpu.cores.count = Math.round(R.gpu.coreN * out(K(tt, t.gcores, t.gcores + 2.6)) * (1 - K(tt, t.gback + 1.6, t.gback + 1.8)));
    const vOn = (i) => K(tt, t.vram + 0.1 + i * 0.1, t.vram + 0.5 + i * 0.1);
    const full = K(tt, t.full, t.full + 1.4) * (1 - K(tt, t.gback, t.gback + 1));
    R.gpu.vramMat.emissive.setRGB(lerp(0.72, 1.0, full), lerp(0.65, 0.35, full), lerp(1.0, 0.45, full));
    R.gpu.vramMat.emissiveIntensity = vOn(11) * (0.35 + 0.25 * vis(tt, t.bw, t.gback, 0.5, 0.5) + 0.4 * full) * (1 - K(tt, t.gback, t.gback + 1.5)) + 0.8 * vis(tt, t.fVram, t.fGpu, 0.5, 0.6);
    // fans
    const fspd = 2 + 22 * fanFast(tt);
    R.cpu.fan.rotor.rotation.y = -tt * fspd; R.gpu.fans.forEach((f, i) => (f.rotor.rotation.y = tt * fspd * (i % 2 ? 1 : -1))); R.psu.fan.rotor.rotation.y = -tt * 3;
    // heat + airflow
    const hk = heatK(tt); heatCpu.intensity = hk * 160; heatGpu.intensity = hk * 220;
    const ak = fanFast(tt) * vis(tt, t.fans, t.caseW, 0.6, 0.6);
    if (ak > 0.01) { air.count = airN; for (let i = 0; i < airN; i++) { const [a, b, c] = airSeed[i], ph = (tt * (0.6 + a * 0.5) + b) % 1, fromGpu = i % 2; const x = fromGpu ? -13 + a * 26 : -7 + c * 8, y = fromGpu ? 7 + b * 4 : 7.5 + a * 2, z = fromGpu ? lerp(-5, 10, ph) : lerp(2.5, -18, ph); m4b.makeTranslation(x, y, z); if (fromGpu) m4b.multiply(new T.Matrix4().makeRotationX(0)); air.setMatrixAt(i, m4b); } air.instanceMatrix.needsUpdate = true; air.material.opacity = 0.7 * ak; } else air.count = 0;
    // board wiring
    const wk = K(tt, t.wires, t.wires + 3.5) * (1 - K(tt, t.elec2 + 1, t.elec2 + 2.5));
    wires.forEach((w, i) => { const kk = K(wk, i * 0.12, i * 0.12 + 0.5); w.m.visible = kk > 0.001; w.m.geometry.setDrawRange(0, Math.floor(w.n * kk / 6) * 6); });
    wireMat.emissiveIntensity = 0.6 + 0.3 * Math.sin(tt * 3);
    // power off
    const dp = dimPower(tt); R.lights.key.intensity = 2.3 * (1 - 0.72 * dp); R.lights.hemi.intensity = 0.75 * (1 - 0.6 * dp); R.lights.fill.intensity = 0.55 * (1 - 0.6 * dp);
    // glow
    setGlow(M.cpu, 0xff6b4a, glowAt('cpu', tt)); setGlow(M.ram, 0x3d8bff, glowAt('ram', tt)); setGlow(M.ssd, 0x19b48a, glowAt('ssd', tt));
    setGlow(M.gpu, 0x7a5cff, glowAt('gpu', tt)); setGlow(M.psu, 0xffb020, glowAt('psu', tt)); setGlow(M.cool, 0x2bc0e4, glowAt('cool', tt));
    // cubes
    placeCubes(tt);

    s3d.render();

    // DOM texts
    for (const x of texts) {
      const a = vis(tt, x.t0, x.t1, 0.5, 0.4);
      if (a <= 0) { if (x.el.style.opacity !== '0') x.el.style.opacity = '0'; continue; }
      const kin = out(K(tt, x.t0, x.t0 + 0.6)), kout = K(tt, x.t1 - 0.4, x.t1);
      x.el.style.opacity = a.toFixed(3); x.el.style.transform = `translateY(${((1 - kin) * x.dy - kout * 16).toFixed(1)}px)`;
    }
    // labels
    for (const L of labs) {
      const a = vis(tt, L.t0, L.t1, 0.4, 0.4);
      if (a <= 0) { if (L.el.style.opacity !== '0') L.el.style.opacity = '0'; continue; }
      proj.copy(L.at()).project(s3d.camera);
      const x = (proj.x + 1) / 2 * SW, y = (1 - proj.y) / 2 * SH, rise = (1 - out(K(tt, L.t0, L.t0 + 0.5))) * 14;
      L.el.style.opacity = (proj.z < 1 ? a : 0).toFixed(3); L.el.style.transform = `translate(${x.toFixed(1)}px, ${(y + rise).toFixed(1)}px)`;
      if (L.pct) { const v = pctAt(L.part, tt) + '%'; if (v !== L.last) { L.pctEl.textContent = v; L.last = v; } }
    }
  });
  Video.progress(0.8);
});
