/*
 * scenes.js — 「LLM과 AI 에이전트, 처음부터 오늘까지」, the clay 3D version (storyboard.md).
 * A clean pastel studio in three.js: soft, rounded clay objects (js/clay.js) on a seamless floor, one soft key light.
 * Every stretch of the talk is a small 3D "set" at the origin; when the topic turns, the old set pops away, the camera
 * whips round and the next set plops in. Inside a set the camera keeps moving (orbit, push-in on the spoken word).
 * Sentences are clean DOM type over the picture; key words and years are clay blocks inside it.
 * This file is the engine; the sets are built by js/seg/a_intro.js, b_history.js, c_agent.js.
 * Everything is a pure function of t.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data, rand } = ctx;
  scene('#world', 0, data.duration + 1);
  const W = 1920, H = 1080, END = data.duration, TAU = Math.PI * 2;
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const back = (x) => { const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const vis = (t, a, b, fi = 0.4, fo = 0.3) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  const M = MEDIA.install(ctx);
  const $ = (id) => document.getElementById(id);
  if (document.fonts && document.fonts.load) { await document.fonts.load("900 100px 'Pretendard'"); await document.fonts.load("800 40px 'Pretendard'"); }

  // ---------------- three.js ----------------
  const s3d = Stage3D.create($('gl'), { W, H, fov: 30, environment: false });
  const T = s3d.THREE, R = s3d.renderer, C = window.CLAY.init(T), sc = s3d.scene, camera = s3d.camera;
  R.toneMapping = T.NoToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFShadowMap;
  sc.environment = new T.PMREMGenerator(R).fromScene(new T.RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.42;
  const bgCol = new T.Color(0xfff3df); sc.background = bgCol; sc.fog = new T.Fog(0xfff3df, 26, 60);
  sc.add(new T.HemisphereLight(0xffffff, 0xffe9d6, 0.62));
  const key = new T.DirectionalLight(0xfff6ea, 1.5); key.position.set(-6, 12, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 6; sc.add(key, key.target);
  const fill = new T.DirectionalLight(0xdfe9ff, 0.35); fill.position.set(8, 5, -4); sc.add(fill);
  const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: 0.2, color: 0x4a3a66 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
  const loader = new T.TextureLoader(), tex = {};
  if (typeof Video.progress === 'function') Video.progress(0.3);
  await Promise.all(['turing.jpg', 'dartmouth.jpg', 'perceptron.jpg', 'eliza.png', 'weizenbaum.jpg', 'hinton.jpg', 'deepblue_b.jpg', 'leesedol.jpg', 'go_game4.jpg'].map((f) =>
    Promise.resolve().then(() => loader.loadAsync('assets/user/img/' + f)).then((t) => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; tex[f.split('.')[0]] = t; }).catch(() => { tex[f.split('.')[0]] = new T.Texture(); })));

  // ---------------- sets and objects ----------------
  const sets = [], items = [], reveals = [], typed = [], classAt = [], live = [], snd = [], keysT = [];
  const CAM0 = { d: 15, a: 0, el: 0.2, tx: 0, ty: 1.7 };
  let cur = null;
  /** a 3D set that starts at t0 (it ends when the next one starts). o: { bg:'#hex', cam:{d,a,el,tx,ty}, drift:1 } */
  function set(t0, o, build) {
    const g = new T.Group(); g.visible = false; sc.add(g);
    cur = { t0, t1: END + 3, g, objs: [], lives: [], bg: new T.Color(o.bg || '#fff3df'), cam_: [[t0, { ...CAM0, ...(o.cam || {}) }]], drift: o.drift ?? 1, on: null, n: 0 };
    if (sets.length) { sets[sets.length - 1].t1 = t0; fx('slide', t0 - 0.4); }
    sets.push(cur); const s = cur;
    /** put an object in the set. p [x,y,z]; o: { at, out, r:[rx,ry,rz], s, bob, spin, sway, kf:[[t,{p,r,s}],…], snd, drop } */
    s.add = (obj, p = [0, 0, 0], q = {}) => { const e = { obj, p, r: q.r || [0, 0, 0], s: q.s ?? 1, at: q.at ?? (t0 + 0.12 + s.n * 0.07), out: q.out ?? null, bob: q.bob || 0, spin: q.spin || 0, sway: q.sway || 0, kf: q.kf || null, ph: s.n * 1.7, drop: q.drop ?? 0.7 };
      s.n++; obj.visible = false; g.add(obj); s.objs.push(e); if (q.snd !== null) fx(q.snd || 'pop', e.at); return e; };
    /** move the camera inside the set: it arrives at these values at t */
    s.cam = (t, c) => { s.cam_.push([t, { ...s.cam_[s.cam_.length - 1][1], ...c }]); };
    s.live = (fn) => s.lives.push(fn);
    build(s);
    return s;
  }
  const ui = $('ui'), hud = $('hud');
  /** DOM type over the picture, in stage pixels. x 'c' centres. o.anim: rise | pop | left | right | fade */
  function item(html, x, y, t0, t1, o = {}) {
    if (y >= 740 && !o.plain) html = `<span class="band">${html}</span>`;       // sentences in the lower band sit on a soft white pill
    const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.width = '1920px'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
    el.style.top = y + 'px'; if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
    (o.fixed ? hud : ui).appendChild(el);
    const it = { el, t0, t1, set: cur, anim: o.anim || 'rise', last: '' }; items.push(it);
    if (o.snd) fx(o.snd, t0);
    return it;
  }
  const show = (el, at, disp = 'block', until = 1e9) => reveals.push({ el, at, disp, until, last: null });
  const cls = (el, name, at, until = 1e9) => classAt.push({ el, name, at, until, last: null });
  const type = (el, text, at, dur) => { const d = dur || Math.min(2.6, 0.35 + text.length * 0.05); typed.push({ el, text, at, dur: d, last: -1 }); keysT.push([at, d]); };
  function fx(kind, t) { snd.push([kind, t]); }
  const count = (el, a, b, t0, t1, fmt = (v) => Math.round(v).toLocaleString('en-US')) => { let last = null; live.push((t) => { const s = fmt(lerp(a, b, out(K(t, t0, t1)))); if (s !== last) { last = s; el.textContent = s; } }); };

  // ---------------- hud ----------------
  const CH = [['op01', '말로 시키면 일하는 AI, 어떻게 여기까지 왔을까?'], ['lm01', 'LLM이란 무엇일까?'], ['tr01', 'LLM은 어떻게 배울까?'], ['ha01', '생각하는 기계는 언제부터 꿈꿨을까?'], ['hb01', '무엇이 AI의 겨울을 끝냈을까?'], ['hc01', '챗GPT는 어떻게 나왔을까?'], ['ag01', 'AI 에이전트란 무엇일까?'], ['ah01', '에이전트는 어떻게 발전했을까?'], ['ed01', '그래서 어떻게 써야 할까?']];
  const chapEl = document.createElement('div'); chapEl.className = 'chap'; hud.appendChild(chapEl); let chapKey = -1;
  CH.forEach(([id], i) => { if (i) fx('bell', S(id) - 0.15); });
  const Y0 = 1950, Y1 = 2026, yx = (y) => (y - Y0) / (Y1 - Y0) * 620;
  const rail = document.createElement('div'); rail.className = 'yrail';
  rail.innerHTML = '<div class="ln"></div>' + [1950, 1970, 1990, 2010, 2026].map((y) => `<span class="tk" style="left:${yx(y)}px">${y}</span>`).join('') + '<div class="mk"></div>'; hud.appendChild(rail);
  const railMk = rail.querySelector('.mk'), yearKeys = [], railOn = [];
  const yearAt = (t, y) => yearKeys.push([t, y]);
  /** the credit of a photograph, bottom left, while it is on screen */
  const credit = (txt, t0, t1) => item(`<span class="credit">${txt}</span>`, 56, 926, t0, t1, { anim: 'fade', plain: true });

  const G = { ctx, cue, S, E, A, END, K, io, out, back, lerp, clamp, vis, TAU, T, C, tex, set, item, show, cls, type, fx, count, credit, yearAt, railOn, live, rand };
  window.SEG_intro(G); window.SEG_history(G); window.SEG_agent(G);

  // ---------------- finish ----------------
  for (const it of items) if (it.t1 == null) it.t1 = it.set ? it.set.t1 - 0.05 : END + 3;
  for (const s of sets) for (const e of s.objs) if (e.out == null) e.out = s.t1 - 0.02;
  yearKeys.sort((a, b) => a[0] - b[0]);
  const sfxBox = $('sfx'), LEAD = 0.03;
  const sfx = (k, t0, vol, dur) => M.clip(sfxBox, k, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0 - LEAD), dur: Math.min(M.SRC[k].dur, (dur || 9) + LEAD), audio: true, vol });
  keysT.forEach(([at, dur], j) => { const n = Math.max(1, Math.ceil((dur - 0.1) / 0.66)); for (let i = 0; i < n; i++) sfx((i + j) % 2 ? 'keys_b' : 'keys_a', at + i * 0.66, 0.9, Math.max(0.2, at + dur - (at + i * 0.66) + 0.04)); });
  const VOL = { bell: 0.55, hit: 0.5, stamp: 0.7, ok: 0.5, buzz: 0.3, wind: 0.6, slide: 0.85, knock: 0.7, pop: 0.5, dial: 0.8, tick: 0.55 }, RANK = Object.keys(VOL), placed = [];
  snd.filter(([, t]) => t >= 0 && t < END + 1).sort((a, b) => RANK.indexOf(a[0]) - RANK.indexOf(b[0]) || a[1] - b[1]).forEach(([kind, t]) => {
    if (placed.some(([k, u]) => Math.abs(u - t) < (k === kind ? 0.1 : (k === 'slide' || kind === 'slide' || k === 'wind' || kind === 'wind') ? 0 : 0.2))) return;
    placed.push([kind, t]); sfx(kind, t, VOL[kind]);
  });

  // ---------------- camera ----------------
  const TA = 0.42, TB = 0.6;
  const camOf = (s, t) => {                       // the set's own camera at t: keys eased, plus a slow orbit and push
    const ks = s.cam_; let c = ks[0][1];
    for (let i = 1; i < ks.length; i++) { const [kt, kc] = ks[i], k = io(K(t, kt - 1.0, kt)); if (k <= 0) break; const p = c; c = {}; for (const n in kc) c[n] = lerp(p[n], kc[n], k); }
    const p = K(t, s.t0, s.t1) - 0.5;
    return { d: c.d * (1 - 0.05 * p * s.drift), a: c.a + 0.16 * p * s.drift, el: c.el + 0.02 * p * s.drift, tx: c.tx, ty: c.ty };
  };
  function camAt(t) {
    let i = 0; while (i + 1 < sets.length && t >= sets[i + 1].t0 - TA) i++;
    const s = sets[i]; let c = camOf(s, Math.max(t, s.t0)), mv = 0;
    if (i > 0 && t < s.t0 + TB) { const p = camOf(sets[i - 1], Math.min(t, sets[i - 1].t1)), k = io(K(t, s.t0 - TA, s.t0 + TB)), w = Math.sin(Math.PI * k), dir = i % 2 ? 1 : -1;
      c = { d: lerp(p.d, c.d, k) + 2.2 * w, a: lerp(p.a, c.a, k) + 0.75 * w * dir, el: lerp(p.el, c.el, k) + 0.07 * w, tx: lerp(p.tx, c.tx, k), ty: lerp(p.ty, c.ty, k) }; mv = w; }
    return { c, i, mv };
  }

  const v3 = new T.Vector3(), tmpCol = new T.Color();
  onFrame((t) => {
    const { c, i } = camAt(t), s = sets[i], prev = sets[i - 1];
    // colour of the studio
    tmpCol.copy(s.bg); if (prev && t < s.t0 + TB) tmpCol.copy(prev.bg).lerp(s.bg, io(K(t, s.t0 - TA, s.t0 + TB)));
    bgCol.copy(tmpCol); sc.fog.color.copy(tmpCol);
    // camera
    const ce = Math.cos(c.el);
    camera.position.set(c.tx + c.d * Math.sin(c.a) * ce, c.ty + c.d * Math.sin(c.el), c.d * Math.cos(c.a) * ce); camera.lookAt(c.tx, c.ty, 0);
    key.position.set(c.tx - 6, 12, 8); key.target.position.set(c.tx, 0, 0); key.target.updateMatrixWorld();
    // sets
    for (const q of sets) {
      const on = t >= q.t0 - 0.05 && t < q.t1 + 0.02;
      if (on !== q.on) { q.on = on; q.g.visible = on; }
      if (!on) continue;
      const leave = 1 - K(t, q.t1 - 0.42, q.t1 - 0.06);                          // the whole set pops away before the whip
      for (const e of q.objs) {
        const kin = K(t, e.at, e.at + 0.5), kout = 1 - K(t, e.out - 0.3, e.out);
        const sIn = kin <= 0 ? 0 : 0.2 + 0.8 * back(kin), sv = Math.max(0, sIn * Math.min(kout, leave) * (kout < 1 || leave < 1 ? 1 : 1));
        if (sv <= 0.001) { if (e.obj.visible) e.obj.visible = false; continue; }
        if (!e.obj.visible) e.obj.visible = true;
        let px = e.p[0], py = e.p[1], pz = e.p[2], rx = e.r[0], ry = e.r[1], rz = e.r[2], ss = e.s;
        if (e.kf) { const kf = e.kf; let a0 = kf[0], a1 = kf[0]; for (let n = 0; n < kf.length; n++) if (t >= kf[n][0]) { a0 = kf[n]; a1 = kf[n + 1] || kf[n]; }
          if (t >= kf[0][0]) { const u = a1 === a0 ? 0 : io(K(t, a0[0], a1[0])), P = a0[1].p || e.p, Q = a1[1].p || P, Ra = a0[1].r || e.r, Rb = a1[1].r || Ra, Sa = a0[1].s ?? e.s, Sb = a1[1].s ?? Sa;
            px = lerp(P[0], Q[0], u); py = lerp(P[1], Q[1], u); pz = lerp(P[2], Q[2], u); rx = lerp(Ra[0], Rb[0], u); ry = lerp(Ra[1], Rb[1], u); rz = lerp(Ra[2], Rb[2], u); ss = lerp(Sa, Sb, u); } }
        py += (1 - out(kin)) * e.drop + (e.bob ? Math.sin(t * 1.6 + e.ph) * e.bob : 0);
        if (e.sway) rz += Math.sin(t * 1.3 + e.ph) * e.sway;
        if (e.spin) ry += t * e.spin;
        e.obj.position.set(px, py, pz); e.obj.rotation.set(rx, ry, rz); e.obj.scale.setScalar(ss * sv);
      }
      for (const f of q.lives) f(t);
    }
    s3d.render();

    // hud
    let ci = 0; for (let n = 0; n < CH.length; n++) if (t >= S(CH[n][0]) - 0.2) ci = n;
    if (ci !== chapKey) { chapKey = ci; chapEl.innerHTML = `<i>${ci + 1}</i>${CH[ci][1]}`; }
    const c0 = S(CH[ci][0]) - 0.2, c1 = ci + 1 < CH.length ? S(CH[ci + 1][0]) - 0.2 : END + 3;
    chapEl.style.opacity = vis(t, Math.max(0.3, c0), c1, 0.6, 0.4).toFixed(3);
    let ro = 0; for (const [a, b] of railOn) ro = Math.max(ro, vis(t, a, b, 0.6, 0.5));
    rail.style.opacity = ro.toFixed(3);
    if (ro > 0 && yearKeys.length) { let y = yearKeys[0][1]; for (let n = 0; n < yearKeys.length; n++) { const [kt, ky] = yearKeys[n], p = n ? yearKeys[n - 1][1] : ky; if (t >= kt - 1.2) y = lerp(p, ky, io(K(t, kt - 1.2, kt))); else break; } railMk.style.left = yx(y).toFixed(1) + 'px'; }

    for (const r of reveals) { const on = t >= r.at && t < r.until; if (on !== r.last) { r.last = on; r.el.style.display = on ? r.disp : 'none'; } }
    for (const k of classAt) { const on = t >= k.at && t < k.until; if (on !== k.last) { k.last = on; k.el.classList.toggle(k.name, on); } }
    for (const y of typed) { const n = Math.floor(y.text.length * K(t, y.at, y.at + y.dur) + 1e-6); if (n !== y.last) { y.last = n; y.el.textContent = y.text.slice(0, n); } }
    for (const f of live) f(t);
    for (const it of items) {
      const a = vis(t, it.t0, it.t1);
      if (a <= 0) { if (it.last !== 'h') { it.el.style.opacity = '0'; it.el.style.visibility = 'hidden'; it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.55); let x = 0, y = 0, sv = 1;
      if (it.anim === 'pop') sv = 0.7 + 0.3 * back(k);
      else if (it.anim === 'left') x = -(1 - out(k)) * 80;
      else if (it.anim === 'right') x = (1 - out(k)) * 80;
      else if (it.anim === 'rise') y = (1 - out(k)) * 34;
      const tr = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sv.toFixed(3)})`, keyS = a.toFixed(3) + tr;
      if (keyS === it.last) continue;
      it.el.style.visibility = 'inherit'; it.el.style.opacity = a.toFixed(3); it.el.style.transform = tr; it.last = keyS;
    }
  });
});
