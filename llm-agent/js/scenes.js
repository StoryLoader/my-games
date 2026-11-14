/*
 * scenes.js — 「LLM과 AI 에이전트, 처음부터 오늘까지」 (storyboard.md).
 * A night museum: one long gallery the camera walks from left to right. Every stretch of the talk is a "station" on
 * the wall, 2300 px after the one before; the camera dollies to it while the narration turns to it. Real photographs
 * hang in frames with brass plaques (source + licence, provenance.json); ideas are brass-and-ivory exhibits.
 * This file is the engine (camera, items, sound); the stations are built by js/seg/a_intro.js, b_history.js, c_agent.js.
 * Everything on screen is a pure function of t.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data, fitCanvas, rand, W, H } = ctx;
  scene('#world', 0, data.duration + 1);
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const END = data.duration;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const vis = (t, a, b, fi = 0.45, fo = 0.35) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  const M = MEDIA.install(ctx);
  const $ = (id) => document.getElementById(id);
  const world = $('world'), hud = $('hud'), wall = $('wall'), floor = $('floor'), rope = $('rope'), light = $('light');

  // ---------------- stations and items ----------------
  const STEP = 2300, stations = [], items = [], reveals = [], typed = [], classAt = [], live = [], snd = [], keysT = [];
  let cur = null;
  /** a new station: the camera arrives at t0. o.light 0..1 (how bright the gallery lamp is there), o.snow 0..1 */
  function station(t0, o = {}) {
    const el = document.createElement('div'); el.className = 'stn'; el.style.left = (stations.length * STEP) + 'px'; world.appendChild(el);
    cur = { el, x: stations.length * STEP, t0, light: o.light == null ? 1 : o.light, snow: o.snow || 0, on: null }; stations.push(cur);
    if (stations.length > 1) fx('slide', t0 - 0.75);
    return cur;
  }
  /** an element of the current station (or of the hud with o.fixed). x 'c' centres it on the stage. t1 omitted: it stays
   *  until the camera has left the station. o.anim: rise | pop | drop | left | right | fade. o.kf: [[t, {x,y,s,r,o}], …] */
  function item(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.width = '1920px'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
    el.style.top = y + 'px'; if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
    (o.fixed ? hud : cur.el).appendChild(el);
    const it = { el, t0, t1, stn: o.fixed ? null : cur, anim: o.anim || 'rise', kf: o.kf || null, last: '' }; items.push(it);
    if (o.snd) fx(o.snd, t0);
    return it;
  }
  const pop = (html, x, y, t0, t1, o = {}) => item(html, x, y, t0, t1, { anim: 'pop', snd: 'pop', ...o });
  const show = (el, at, disp = 'block', until = 1e9) => reveals.push({ el, at, disp, until, last: null });
  const cls = (el, name, at, until = 1e9) => classAt.push({ el, name, at, until, last: null });
  const type = (el, text, at, dur) => { const d = dur || Math.min(2.6, 0.35 + text.length * 0.05); typed.push({ el, text, at, dur: d, last: -1 }); keysT.push([at, d]); };
  /** a sound effect at t (placed after thinning, at the end) */
  function fx(kind, t) { snd.push([kind, t]); }
  /** a number that counts from a to b between t0 and t1 */
  const count = (el, a, b, t0, t1, fmt = (v) => Math.round(v).toLocaleString('en-US')) => { let last = null; live.push((t) => { const s = fmt(lerp(a, b, out(K(t, t0, t1)))); if (s !== last) { last = s; el.textContent = s; } }); };
  /** an SVG stroke that draws itself (the path needs pathLength="1") */
  const drawOn = (el, t0, dur) => { el.style.strokeDasharray = '1'; let last = -1; live.push((t) => { const v = (1 - io(K(t, t0, t0 + dur))).toFixed(3); if (v !== last) { last = v; el.style.strokeDashoffset = v; } }); };
  /** a framed photograph with its brass plaque: name, then the credit line (author · licence · Wikimedia Commons) */
  function frame(img, x, y, w, h, t0, t1, cap, src, o = {}) {
    fx('knock', t0 + 0.3);
    return item(`<div class="frame" style="position:relative;width:${w + 68}px"><div class="mat"><div class="ph" style="width:${w}px;height:${h}px"><img src="assets/user/img/${img}" alt="" style="${o.pos ? 'object-position:' + o.pos : ''}"></div></div></div><div style="width:${w + 68}px;text-align:center;margin-top:18px"><span class="plq" style="max-width:${Math.max(w + 40, 380)}px">${cap}<small>${src}</small></span></div>`, x, y, t0, t1, { anim: 'drop' });
  }
  /** brass year on the wall */
  const year = (txt, x, y, t0, t1, size = 250) => item(`<span class="metal yr" style="font-size:${size}px">${txt}</span>`, x, y, t0, t1, { anim: 'pop', snd: 'hit' });

  // ---------------- hud: the chapter's question, the year rail ----------------
  const CH = [['op01', '말로 시키면 일하는 AI, 어떻게 여기까지 왔을까?'], ['lm01', 'LLM이란 무엇일까?'], ['tr01', 'LLM은 어떻게 배울까?'], ['ha01', '생각하는 기계는 언제부터 꿈꿨을까?'], ['hb01', '무엇이 AI의 겨울을 끝냈을까?'], ['hc01', '챗GPT는 어떻게 나왔을까?'], ['ag01', 'AI 에이전트란 무엇일까?'], ['ah01', '에이전트는 어떻게 발전했을까?'], ['ed01', '그래서 어떻게 써야 할까?']];
  const chapEl = document.createElement('div'); chapEl.className = 'chap'; hud.appendChild(chapEl); let chapKey = -1;
  CH.forEach(([id], i) => { if (i) fx('bell', S(id) - 0.15); });
  const Y0 = 1950, Y1 = 2026, yx = (y) => (y - Y0) / (Y1 - Y0) * 760;
  const rail = document.createElement('div'); rail.className = 'yrail';
  rail.innerHTML = '<div class="ln"></div>' + [1950, 1970, 1990, 2010, 2026].map((y) => `<span class="tk" style="left:${yx(y)}px">${y}</span>`).join('') + '<div class="mk"></div>'; hud.appendChild(rail);
  const railMk = rail.querySelector('.mk'), yearKeys = [], railOn = [];
  /** the rail's marker reaches this year at t */
  const yearAt = (t, y) => yearKeys.push([t, y]);

  const G = { ctx, cue, S, E, A, END, K, io, out, back, lerp, clamp, vis, M, station, item, pop, show, cls, type, fx, count, drawOn, frame, year, yearAt, railOn, live, rand };
  window.SEG_intro(G); window.SEG_history(G); window.SEG_agent(G);

  // ---------------- finish: default ends, sound ----------------
  stations.forEach((s, i) => { s.t1 = i + 1 < stations.length ? stations[i + 1].t0 : END + 3; });
  for (const it of items) if (it.t1 == null) it.t1 = it.stn ? it.stn.t1 + 0.6 : END + 3;
  yearKeys.sort((a, b) => a[0] - b[0]);

  const sfxBox = $('sfx'), LEAD = 0.03;   // every effect file starts with 30 ms of silence (sfx/make_sfx.py)
  const sfx = (key, t0, vol, dur) => M.clip(sfxBox, key, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0 - LEAD), dur: Math.min(M.SRC[key].dur, (dur || 9) + LEAD), audio: true, vol });
  keysT.forEach(([at, dur], j) => { const n = Math.max(1, Math.ceil((dur - 0.1) / 0.66)); for (let i = 0; i < n; i++) sfx((i + j) % 2 ? 'keys_b' : 'keys_a', at + i * 0.66, 0.9, Math.max(0.2, at + dur - (at + i * 0.66) + 0.04)); });
  // louder kinds win when two fall on the same moment
  const VOL = { bell: 0.55, hit: 0.5, stamp: 0.7, ok: 0.5, buzz: 0.3, wind: 0.6, slide: 0.8, knock: 0.7, pop: 0.5, dial: 0.8, tick: 0.55 }, RANK = Object.keys(VOL);
  const placed = [];
  snd.filter(([, t]) => t >= 0 && t < END + 1).sort((a, b) => RANK.indexOf(a[0]) - RANK.indexOf(b[0]) || a[1] - b[1]).forEach(([kind, t]) => {
    if (placed.some(([k, u]) => Math.abs(u - t) < (k === kind ? 0.1 : (k === 'slide' || kind === 'slide' || k === 'wind' || kind === 'wind') ? 0 : 0.2))) return;
    placed.push([kind, t]); sfx(kind, t, VOL[kind]);
  });
  await Promise.all([...world.querySelectorAll('img')].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));

  // ---------------- canvas: dust in the lamp light, snow in the AI winter ----------------
  const g = fitCanvas($('fx'), W, H, 1.5);
  const r1 = rand(11), motes = Array.from({ length: 46 }, () => ({ x: r1() * 1500 + 210, y: r1() * 700 + 60, vx: (r1() - 0.5) * 9, vy: -3 - r1() * 7, r: 1 + r1() * 2.2, p: r1() * 6.28 }));
  const r2 = rand(23), flakes = Array.from({ length: 170 }, () => ({ x: r2() * 2100 - 90, y: r2() * 1200, v: 60 + r2() * 110, r: 1.6 + r2() * 3.4, p: r2() * 6.28, d: 0.35 + r2() * 0.65 }));

  // ---------------- camera ----------------
  const TRAVEL_A = 0.8, TRAVEL_B = 0.65;
  function cam(t) {
    let i = 0; while (i + 1 < stations.length && t >= stations[i + 1].t0 - TRAVEL_A) i++;
    const s = stations[i], n = stations[i + 1];
    const rest = K(t, s.t0 + TRAVEL_B, (n ? n.t0 - TRAVEL_A : END));          // slow push while the station holds
    let x = s.x + 34 * rest, z = 1 + 0.03 * rest, lgt = s.light, snow = s.snow, mv = 0;
    if (i > 0 && t < s.t0 + TRAVEL_B) {                                        // arriving from the station before
      const p = stations[i - 1], k = io(K(t, s.t0 - TRAVEL_A, s.t0 + TRAVEL_B));
      x = lerp(p.x + 34, s.x, k); z = lerp(1.03, 1, k); lgt = lerp(p.light, s.light, k); snow = lerp(p.snow, s.snow, k); mv = Math.sin(Math.PI * k);
    }
    return { x, z, lgt, snow, mv, i };
  }

  let lastCam = '', lastLight = '';
  onFrame((t, redraw) => {
    const c = cam(t);
    const ck = c.x.toFixed(1) + '|' + c.z.toFixed(4);
    if (ck !== lastCam) {
      lastCam = ck;
      world.style.transformOrigin = `${(c.x + 960).toFixed(1)}px 470px`;
      world.style.transform = `translate3d(${(-c.x).toFixed(1)}px,0,0) scale(${c.z.toFixed(4)})`;
      const bx = (-c.x).toFixed(1);
      wall.style.backgroundPosition = `0 0, 0 0, 0 0, ${bx}px 0, ${bx}px 0, 0 0`;
      floor.style.backgroundPosition = `0 0, ${(-c.x * 1.14).toFixed(1)}px 0, 0 0`;
      rope.style.backgroundPositionX = (-c.x * 1.55).toFixed(1) + 'px';
      for (const s of stations) { const on = Math.abs(s.x - c.x) < STEP * 1.05; if (on !== s.on) { s.on = on; s.el.style.display = on ? 'block' : 'none'; } }
    }
    const lk = (c.lgt * (1 - 0.45 * c.mv)).toFixed(3);
    if (lk !== lastLight) { lastLight = lk; light.style.opacity = lk; }

    // hud
    let ci = 0; for (let i = 0; i < CH.length; i++) if (t >= S(CH[i][0]) - 0.2) ci = i;
    if (ci !== chapKey) { chapKey = ci; chapEl.innerHTML = `<i>${ci + 1}</i>${CH[ci][1]}`; }
    const c0 = S(CH[ci][0]) - 0.2, c1 = ci + 1 < CH.length ? S(CH[ci + 1][0]) - 0.2 : END + 3;
    chapEl.style.opacity = (0.92 * vis(t, Math.max(0.3, c0), c1, 0.6, 0.4)).toFixed(3);
    let ro = 0; for (const [a, b] of railOn) ro = Math.max(ro, vis(t, a, b, 0.6, 0.5));
    rail.style.opacity = ro.toFixed(3);
    if (ro > 0 && yearKeys.length) {
      let y = yearKeys[0][1];
      for (let i = 0; i < yearKeys.length; i++) { const [kt, ky] = yearKeys[i], p = i ? yearKeys[i - 1][1] : ky; if (t >= kt - 1.2) y = lerp(p, ky, io(K(t, kt - 1.2, kt))); else break; }
      railMk.style.left = yx(y).toFixed(1) + 'px';
    }

    for (const r of reveals) { const on = t >= r.at && t < r.until; if (on !== r.last) { r.last = on; r.el.style.display = on ? r.disp : 'none'; } }
    for (const k of classAt) { const on = t >= k.at && t < k.until; if (on !== k.last) { k.last = on; k.el.classList.toggle(k.name, on); } }
    for (const y of typed) { const n = Math.floor(y.text.length * K(t, y.at, y.at + y.dur) + 1e-6); if (n !== y.last) { y.last = n; y.el.textContent = y.text.slice(0, n); } }
    for (const f of live) f(t);
    for (const it of items) {
      if (it.stn && !it.stn.on) continue;
      const a = vis(t, it.t0, it.t1);
      if (a <= 0) { if (it.last !== 'h') { it.el.style.opacity = '0'; it.el.style.visibility = 'hidden'; it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.6); let x = 0, y = 0, s = 1, r = 0, o = 1;
      if (it.anim === 'pop') s = 0.8 + 0.2 * back(k);
      else if (it.anim === 'drop') { y = -(1 - out(k)) * 60; r = (1 - out(k)) * -2.2; }
      else if (it.anim === 'left') x = -(1 - out(k)) * 70;
      else if (it.anim === 'right') x = (1 - out(k)) * 70;
      else if (it.anim === 'rise') y = (1 - out(k)) * 26;
      if (it.kf) {
        const kf = it.kf; let a0 = kf[0], a1 = kf[0];
        for (let i = 0; i < kf.length; i++) { if (t >= kf[i][0]) { a0 = kf[i]; a1 = kf[i + 1] || kf[i]; } }
        const u = a1 === a0 ? 0 : io(K(t, a0[0], a1[0])), P = (n, d) => lerp(a0[1][n] == null ? d : a0[1][n], a1[1][n] == null ? d : a1[1][n], u);
        x += P('x', 0); y += P('y', 0); s *= P('s', 1); r += P('r', 0); o = P('o', 1);
      }
      const tr = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`, key = (a * o).toFixed(3) + tr;
      if (key === it.last) continue;
      it.el.style.visibility = 'inherit'; it.el.style.opacity = (a * o).toFixed(3); it.el.style.transform = tr; it.last = key;
    }

    // dust and snow
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,236,190,0.02)'; g.fillRect(0, 0, 2, 2);        // never leave the canvas empty
    const da = 0.5 * c.lgt * (1 - c.mv);
    if (da > 0.01) for (const m of motes) {
      const x = ((m.x + m.vx * t) % 1500 + 1500) % 1500 + 210, y = ((m.y + m.vy * t) % 700 + 700) % 700 + 60;
      const a = da * (0.25 + 0.2 * Math.sin(m.p + t * 0.7)) * (1 - Math.abs(x - 960) / 800);
      if (a > 0.01) { g.fillStyle = `rgba(255,236,190,${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, m.r, 0, 6.2832); g.fill(); }
    }
    if (c.snow > 0.01) for (const f of flakes) {
      const y = (f.y + f.v * t) % 1200 - 60, x = ((f.x + Math.sin(f.p + t * 0.6) * 34 * f.d - c.x * 0.2) % 2100 + 2100) % 2100 - 90;
      g.fillStyle = `rgba(225,238,255,${(0.75 * c.snow * f.d).toFixed(3)})`; g.beginPath(); g.arc(x, y, Math.max(0.1, f.r * f.d), 0, 6.2832); g.fill();
    }
    if (c.snow > 0.01) { g.fillStyle = `rgba(120,160,210,${(0.13 * c.snow).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  });
});
