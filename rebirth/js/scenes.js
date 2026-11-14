/*
 * scenes.js — 「사람은 윤회하는가, 영영 사라지는가」: one dawn lake (js/world.js) whose day turns once over the film.
 * Each answer appears as a sign of light in the sky: the wheel (윤회), the path to a gate (한 번뿐인 삶), the lit
 * network (뇌), the ring of atoms (순환). A drop of light falling into the water and its ripple marks every chapter.
 * Everything is a pure function of t.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, fitCanvas, data } = ctx;
  const L = window.LAKE, { k: K, io, out, lerp, clamp, hex, rgb, mix } = L;
  const TAU = Math.PI * 2;
  L.bake();
  Video.progress(0.4);
  scene('#world', 0, data.duration + 1);
  const canvas = document.querySelector('#world canvas.world'), g = fitCanvas(canvas, 1920, 1080, 1.5);

  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const vis = (t, a, b, fi = 0.6, fo = 0.6) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  const COL = { gold: hex('#ffcf7a'), lav: hex('#c4b0ff'), mint: hex('#8fe6d8'), peach: hex('#ffb199'), white: [255, 252, 240], warm: hex('#ff9a5c') };

  // ---------- DOM texts ----------
  const ui = document.getElementById('ui'), texts = [];
  function txt(html, x, y, t0, t1, cls = 'ink', o = {}) {
    const el = document.createElement('div'); el.className = 't ' + cls; el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else if (o.cx) { el.style.left = (x - 300) + 'px'; el.style.width = '600px'; el.style.textAlign = 'center'; } else if (o.r) { el.style.right = (1920 - x) + 'px'; el.style.textAlign = 'right'; } else el.style.left = x + 'px';
    el.style.top = y + 'px'; ui.appendChild(el); texts.push({ el, t0, t1 }); return el;
  }
  const card = (no, q, kw, cls, ink) => txt(`<div class="no">${no}</div><span class="q">${q.replace(kw, `<em class="${cls}">${kw}</em>`)}</span>`, 'c', 0, S(ink[0]) - 0.3, S(ink[0]) + 3.8, 'card ' + ink[1]);

  // ---------- chapter starts and the day ----------
  const ch = { rb: S('rb01'), on: S('on01'), sc: S('sc01'), at: S('at01'), fn: S('fn01') };
  const dayKeys = [[0, 0], [S('op06'), 0.35], [ch.rb - 0.6, 0.9], [ch.rb + 2, 1], [ch.on - 0.4, 1.3], [ch.on + 2.6, 2], [ch.sc - 0.4, 2.2], [ch.sc + 2.6, 3], [ch.at - 0.4, 3.3], [ch.at + 3, 4], [ch.fn - 0.4, 4.2], [ch.fn + 4, 5]];
  const dayAt = (t) => { for (let i = 1; i < dayKeys.length; i++) if (t < dayKeys[i][0]) return lerp(dayKeys[i - 1][1], dayKeys[i][1], io(K(t, dayKeys[i - 1][0], dayKeys[i][0]))); return 5; };
  // the drop + ripple that marks each chapter: [time, x]
  const drops = [[ch.rb - 1.0, 960], [ch.on - 1.0, 960], [ch.sc - 1.0, 960], [ch.at - 1.0, 960], [ch.fn - 1.0, 960]];
  function drawDrops(t) {
    for (const [t0, x] of drops) {
      if (t < t0 - 1.2 || t > t0 + 4) continue;
      const fall = K(t, t0 - 1.2, t0); if (fall < 1) L.mote(g, x, lerp(260, L.HZ + 120, io(fall)), 9, 'white', 1, false);
      for (let i = 0; i < 3; i++) { const kk = K(t, t0 + i * 0.35, t0 + 3 + i * 0.35); if (kk <= 0 || kk >= 1) continue; const R = 40 + out(kk) * 900; g.strokeStyle = `rgba(255,250,235,${0.7 * (1 - kk)})`; g.lineWidth = 3 - i; g.beginPath(); g.ellipse(x, L.HZ + 120, R, R * 0.18, 0, 0, TAU); g.stroke(); }
    }
  }

  // ---------- op: a light rises; three answers branch from it ----------
  const O = { rise: S('op01'), wheel: A('op03', '다시 태어', -0.4), path: A('op04', '한 번뿐', -0.3), fade: A('op05', '영영', -0.3), calm: S('op06') + 0.4 };
  const P0 = [960, 440];
  const circ = (cx, cy, r, a0, n = 90) => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + i / n * TAU) * r, cy + Math.sin(a0 + i / n * TAU) * r]);
  const opWheel = [P0, ...Array.from({ length: 30 }, (_, i) => [lerp(960, 640, i / 30), 440 - Math.sin(i / 30 * Math.PI / 2) * 60]), ...circ(520, 330, 120, 0)];
  const opPath = Array.from({ length: 60 }, (_, i) => [960, lerp(440, 120, i / 59)]);
  const opFade = Array.from({ length: 40 }, (_, i) => [lerp(960, 1360, i / 39), 440 - Math.sin(i / 39 * Math.PI) * 50]);
  function drawOp(t) {
    const v = vis(t, 0, ch.rb - 1.2, 0.01, 1.2); if (v <= 0) return;
    const rise = io(K(t, O.rise + 0.4, O.rise + 4)), y = lerp(960, P0[1], rise);
    const dim = 1 - 0.55 * K(t, O.calm, O.calm + 1.5);
    L.trail(g, opWheel, K(t, O.wheel, O.wheel + 3.2), COL.lav, 4, v * dim);
    L.trail(g, opPath, K(t, O.path, O.path + 2.4), COL.gold, 4, v * dim);
    if (t > O.path + 1.6) { const a = v * dim * K(t, O.path + 1.6, O.path + 2.6); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.drawImage(L.sp.gold, 960 - 140, 120 - 140, 280, 280); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const fk = K(t, O.fade, O.fade + 2.4); L.trail(g, opFade, fk, COL.peach, 4, v * dim * (1 - K(t, O.fade + 2.6, O.fade + 4.5)));
    if (fk > 0.6) { const r = L.rand(5); for (let i = 0; i < 50; i++) { const a = r() * TAU, s = 20 + r() * 160, kk = K(t, O.fade + 1.8 + r() * 0.6, O.fade + 4.8); if (kk <= 0) continue; L.mote(g, 1360 + Math.cos(a) * s * kk, 330 + 110 * (1 - kk) - 60 * kk + Math.sin(a) * s * kk * 0.6, 3, 'peach', v * dim * (1 - kk), false); } }
    L.mote(g, 960, y, 10, 'gold', v * (t > ch.rb - 2.2 ? 1 - K(t, ch.rb - 2.2, ch.rb - 1.3) : 1));
  }
  txt('<span class="hero h2">죽고 나면,<br>나는 어떻게 될까?</span>', 'c', 150, S('op01') + 1.2, S('op02') + 2.2, 'lt');
  txt('<span class="hero h3 c-lav">윤회</span><br><span class="sub">다른 몸으로 다시 태어난다</span>', 250, 470, O.wheel + 1.2, O.calm + 0.2, 'lt');
  txt('<span class="hero h3 c-gold">다른 세상</span><br><span class="sub">한 번뿐인 삶, 그 뒤에 이어진다</span>', 'c', 470, O.path + 1, O.calm + 0.2, 'lt');
  txt('<span class="hero h3 c-peach">영영 사라짐</span><br><span class="sub">과학의 눈에 가까운 대답</span>', 1720, 470, O.fade + 1.2, O.calm + 0.2, 'lt', { r: true });
  txt('<span class="hero h2">정답 대신,<br><span class="c-gold">이야기</span>를 듣기</span>', 'c', 170, O.calm + 0.6, S('op07') + 0.2, 'lt');
  txt('<span class="hero h3">확실히 알 수 있는 것<br><span style="opacity:.6">그리고 알 수 없는 것</span></span>', 'c', 190, S('op07') + 0.4, S('op08') + 1.5, 'lt');

  // ---------- rb: the wheel, the shells, karma, moksha, the lamps ----------
  const R = { wheel: S('rb01') + 3, shells: S('rb02'), karma: S('rb03'), seeds: S('rb04'), spin: S('rb05'), free: S('rb06'), lampOn: S('rb07') + 1, lampGo: A('rb09', '한 등불', -0.3), same: S('rb10'), nirvana: S('rb11'), greek: S('rb12'), unroll: S('rb13') + 2 };
  const WC = [960, 330], WR = 230;
  const shellAng = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
  function drawRb(t) {
    const v = vis(t, ch.rb - 0.4, ch.on - 1.0, 0.8, 1.2); if (v <= 0) return;
    const wheelA = v * K(t, R.wheel - 1, R.wheel + 0.8) * (1 - 0.85 * vis(t, R.lampOn, R.greek + 0.6, 1, 1));
    // unroll (rb13): circle → vertical path down to the water
    const un = io(K(t, R.unroll, R.unroll + 3));
    if (wheelA > 0.01) {
      const pts = Array.from({ length: 121 }, (_, i) => { const a = -Math.PI / 2 + i / 120 * TAU; const c = [WC[0] + Math.cos(a) * WR, WC[1] + Math.sin(a) * WR]; const l = [960, lerp(WC[1] - WR, 1060, i / 120)]; return [lerp(c[0], l[0], un), lerp(c[1], l[1], un)]; });
      L.trail(g, pts, 1, COL.lav, 3.5, wheelA);
      // motes orbiting (speed up at rb05)
      const sp = 0.25 + 1.4 * K(t, R.spin, R.spin + 2) * (1 - K(t, R.free + 3, R.free + 6));
      const n = 8 + Math.round(10 * K(t, R.spin, R.spin + 2));
      const phase = t * sp;
      if (un < 0.05) for (let i = 0; i < n; i++) { const a = phase + i / n * TAU; L.mote(g, WC[0] + Math.cos(a) * WR, WC[1] + Math.sin(a) * WR, 4, 'lav', wheelA * 0.9, false); }
    }
    // shells: the self (gold core) moving from body to body (rb02), karma seeds (rb03–04)
    const sv = v * vis(t, R.shells - 0.2, R.spin + 1.2, 0.8, 1);
    if (sv > 0) {
      const step = (t - R.shells - 1.2) / 2.6, cur = clamp(Math.floor(step), 0, 99), kk = clamp(step - cur, 0, 1);
      shellAng.forEach((a, i) => { const x = WC[0] + Math.cos(a) * WR, y = WC[1] + Math.sin(a) * WR + 75; const here = (cur % 3) === i, prev = ((cur + 2) % 3) === i; const lit = here ? out(K(kk, 0.3, 0.7)) : prev ? 1 - K(kk, 0, 0.4) : 0; if (lit > 0.05) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = sv * lit * 0.8; g.drawImage(L.sp.gold, x - 110, y - 200, 220, 220); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
        L.figure(g, x, y, 190, lit > 0.3 ? hex('#d99a2b') : hex('#7d62d8'), sv * (0.6 + 0.4 * lit), 0.25 + 0.3 * lit); });
      // the core light travelling along the wheel between shells
      if (step > 0) { const a0 = shellAng[(cur + 2) % 3], a1 = shellAng[cur % 3]; let da = a1 - a0; while (da < 0) da += TAU; const a = a0 + da * io(K(kk, 0, 0.6)); L.mote(g, WC[0] + Math.cos(a) * WR, WC[1] + Math.sin(a) * WR + 10, 9, 'gold', sv); }
      // seeds: small dots that fall into the next shell
      const sk = vis(t, R.seeds - 0.4, R.spin + 0.6, 0.6, 0.6);
      if (sk > 0) { const r = L.rand(31); const nxt = shellAng[(cur + 1) % 3], nx = WC[0] + Math.cos(nxt) * WR, ny = WC[1] + Math.sin(nxt) * WR + 20; for (let i = 0; i < 26; i++) { const ph = ((t - R.seeds) * 0.6 + r()) % 1, sx = 960 + (r() - 0.5) * 700, sy = 620 + r() * 80; L.mote(g, lerp(sx, nx, io(ph)), lerp(sy, ny, io(ph)) - Math.sin(ph * Math.PI) * 120, 2.6, 'gold', sk * Math.sin(ph * Math.PI), false); } }
    }
    // moksha: one light leaves the wheel upward
    const fk = K(t, R.free + 0.8, R.free + 5);
    if (fk > 0 && t < R.lampOn + 1.5) { const a = -Math.PI / 2, x0 = WC[0] + Math.cos(a) * WR, y0 = WC[1] + Math.sin(a) * WR; const y = lerp(y0, -40, out(fk)); L.trail(g, [[x0, y0], [x0, y]], 1, COL.gold, 3, v * (1 - K(t, R.lampOn, R.lampOn + 1.5)) * 0.8); L.mote(g, x0, y, 11 + fk * 8, 'gold', v * (1 - K(t, R.lampOn, R.lampOn + 1.5)), false); }
    // the lamps on the near water (rb07–11)
    const lv = v * vis(t, R.lampOn - 0.2, R.greek + 0.8, 1, 1);
    if (lv > 0) {
      g.globalAlpha = lv; const N = 6;
      for (let i = 0; i < N; i++) {
        const x = 500 + i * 184, y = 860; const tOn = R.lampGo + i * 1.4;
        const f = i === 0 ? K(t, R.lampOn + 0.4, R.lampOn + 1.4) : K(t, tOn, tOn + 0.5);
        const calm = 1 - 0.55 * K(t, R.nirvana + 1, R.nirvana + 4);
        g.globalAlpha = lv; L.lamp(g, x, y, f * calm, t, i);
        // the flame passing to the next lamp
        if (i < N - 1) { const pk = K(t, tOn + 0.9, tOn + 1.4); if (pk > 0 && pk < 1) L.mote(g, lerp(x, x + 184, pk), y - 50 - Math.sin(pk * Math.PI) * 60, 6, 'gold', lv, false); }
      }
      g.globalAlpha = 1;
      // nirvana: a single still light gathers above the lamps
      const nk = K(t, R.nirvana + 0.8, R.nirvana + 4) * (1 - K(t, R.greek, R.greek + 1.2)); if (nk > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = nk * 0.8 * lv; g.drawImage(L.sp.white, 960 - 260, 360 - 260, 520, 520); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    }
  }
  card('윤회', '윤회는 어떤 생각인가?', '윤회', 'c-lav', ['rb01', 'ink']);
  txt('<span class="kick">인도 · 힌두교</span><br><span class="hero h3"><span class="c-gold">아트만</span></span><br><span class="sub">죽지 않는 참된 자아</span>', 120, 170, S('rb01') + 4.2, R.shells + 0.2);
  txt('<span class="kick">바가바드 기타</span><br><span class="hero h3">낡은 옷을 벗고<br><span class="c-gold">새 옷</span>을 입듯</span>', 120, 170, R.shells + 0.6, R.karma);
  txt('<span class="hero h2"><span class="c-gold">카르마</span> · 업</span><br><span class="sub">행동이 씨앗처럼 쌓여 다음 삶을 정한다</span>', 120, 160, R.karma + 0.4, R.spin);
  txt('<span class="hero h3">상이 아니라<br><span class="c-lav">벗어나야 할 굴레</span></span>', 120, 170, R.spin + 1, R.free);
  txt('<span class="hero h2"><span class="c-gold">해탈</span></span><br><span class="sub">모크샤 · 되풀이에서 완전히 풀려남</span>', 120, 160, R.free + 0.6, S('rb07'));
  txt('<span class="kick">불교</span><br><span class="hero h2">무아</span><br><span class="sub">영원히 변하지 않는 자아는 없다</span>', 'c', 140, S('rb07') + 0.4, S('rb09') - 0.2);
  txt('<span class="hero h3">그럼 무엇이<br>다시 태어날까?</span>', 'c', 170, S('rb08') + 0.2, S('rb09') + 0.4);
  txt('<span class="kick">밀린다왕문경 · 나가세나</span><br><span class="hero h3">등불에서 등불로,<br><span class="c-gold">건너가는 것은 없다</span></span>', 'c', 140, S('rb09') + 0.8, R.same);
  txt('<span class="hero h3">같은 불도 아니고,<br>다른 불도 아니다</span>', 'c', 160, R.same + 0.4, R.nirvana);
  txt('<span class="hero h2"><span class="c-gold">열반</span></span><br><span class="sub">되풀이에서 벗어난 고요</span>', 'c', 150, R.nirvana + 0.6, R.greek);
  txt('<span class="kick">고대 그리스</span><br><span class="hero h3">피타고라스 · 플라톤</span><br><span class="sub">영혼은 다른 몸으로 옮겨 간다</span>', 'c', 150, R.greek + 0.6, S('rb13') + 0.4);
  txt('<span class="hero h3"><span class="c-lav">바퀴</span>가 아니라,<br><span class="c-gold">한 줄기 길</span>로</span>', 'c', 150, R.unroll + 0.4, ch.on - 0.6);

  // ---------- on: one path across the water to a gate of light ----------
  const N1 = { walk: S('on01') + 0.4, gate: A('on02', '심판', -0.4), words: S('on03'), weight: S('on04'), both: S('on05'), turn: S('on06') };
  function drawOn(t) {
    const v = vis(t, ch.on - 0.6, ch.sc - 1.0, 1, 1.2); if (v <= 0) return;
    const pk = K(t, ch.on - 0.6, ch.on + 2.2), side = io(K(t, N1.both, N1.both + 2)), dim = 1 - 0.7 * K(t, N1.turn + 1, N1.turn + 4);
    const cx = lerp(960, 1300, side);
    // the path on the water: a perspective ribbon from the near water to the horizon, then a beam up to the gate
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) { const u = i / 40, y = lerp(1080, L.HZ, Math.pow(u, 0.7)), w = lerp(220, 8, u) * (1 - side * 0.5); if (u > pk) break; g.fillStyle = `rgba(255,214,140,${0.16 * v * dim})`; g.fillRect(cx - w / 2 + Math.sin(t * 2 + i) * 3, y, w, 6); }
    g.restore();
    L.trail(g, [[cx, L.HZ], [cx, 230]], K(t, ch.on + 1.2, ch.on + 3), COL.gold, 3, v * dim);
    const gk = K(t, ch.on + 2.6, ch.on + 4) * (0.7 + 0.3 * K(t, N1.gate, N1.gate + 1.5)) * dim;
    if (gk > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = gk * v; g.drawImage(L.sp.white, cx - 220, 200 - 260, 440, 440); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.strokeStyle = `rgba(255,236,190,${0.9 * gk * v})`; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 70, 260); g.lineTo(cx - 70, 150); g.arc(cx, 150, 70, Math.PI, 0); g.lineTo(cx + 70, 260); g.stroke(); }
    // the single light walks the path once
    const wk = K(t, N1.walk, N1.gate + 2.5);
    if (wk < 1) { const y = wk < 0.6 ? lerp(1000, L.HZ, io(wk / 0.6)) : lerp(L.HZ, 210, io((wk - 0.6) / 0.4)); L.mote(g, cx, y, 9, 'gold', v * dim, y < L.HZ); }
    // on05: the wheel beside the path
    if (side > 0) { L.trail(g, circ(620, 340, 160, 0, 100), side, COL.lav, 3.5, v * dim); for (let i = 0; i < 8; i++) { const a = t * 0.4 + i / 8 * TAU; L.mote(g, 620 + Math.cos(a) * 160, 340 + Math.sin(a) * 160, 4, 'lav', v * side * dim, false); } }
  }
  card('한 번뿐인 삶', '한 번뿐인 삶 뒤에는 무엇이 있나?', '한 번뿐인 삶', 'c-gold', ['on01', 'ink']);
  txt('<span class="kick">그리스도교 · 이슬람교</span><br><span class="hero h2">삶은 <span class="c-gold">단 한 번</span></span>', 120, 150, S('on01') + 3.6, N1.gate - 0.2);
  txt('<span class="hero h3">신의 <span class="c-gold">심판</span>을 거쳐<br>영원히 이어지는 세상으로</span>', 120, 160, N1.gate + 0.2, N1.words);
  txt('<span class="kick">그리스도교</span><br><span class="hero h3">부활과<br><span class="c-gold">영원한 생명</span></span>', 120, 160, N1.words + 0.3, N1.weight);
  txt('<span class="kick">이슬람교</span><br><span class="hero h3">심판의 날과<br><span class="c-gold">내세</span></span>', 1800, 160, A('on03', '이슬람교', -0.2), N1.weight, 'ink', { r: true });
  txt('<span class="hero h3">다시 돌아올<br>기회가 없기에, <span class="c-gold">무겁다</span></span>', 120, 160, N1.weight + 0.4, N1.both);
  txt('<span class="hero h3">두 대답 모두,<br>죽음 뒤에도 <span class="c-gold">무언가가 계속된다</span></span>', 'c', 120, N1.both + 1.2, N1.turn + 1);
  txt('<span class="hero h3">믿음을 잠시 내려놓고,<br><span class="c-mint">확인할 수 있는 것</span>만으로</span>', 'c', 140, N1.turn + 1.2, ch.sc - 1);

  // ---------- sc: the lit network, the heartbeat, the cases, the heat ----------
  const C2 = { net: S('sc01') + 2.5, stop: A('sc02', '끊기면', -0.3), eeg: S('sc03'), view: S('sc04'), cases: S('sc06'), crit: S('sc07'), notyet: S('sc08'), heat: S('sc09'), heatGo: S('sc10'), sum: S('sc11'), turn: S('sc12') };
  const rn = L.rand(91), nodes = []; while (nodes.length < 110) { const x = rn() * 2 - 1, y = rn() * 2 - 1; const lobe = Math.pow(x, 2) / 1 + Math.pow(y * 1.25, 2); if (lobe < 1 && !(Math.abs(x) < 0.03)) nodes.push([960 + x * 400, 320 + y * 210, rn()]); }
  const edges = []; nodes.forEach((a, i) => { const d = nodes.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]); for (const [j] of d.slice(0, 3)) if (j > i) edges.push([i, j]); });
  function drawSc(t) {
    const v = vis(t, ch.sc - 0.6, ch.at - 1.0, 1, 1.2); if (v <= 0) return;
    // the network: lit, then dimming from the stop (a ~10 s fade compressed into the line)
    const netA = v * K(t, C2.net - 1, C2.net + 1) * (1 - 0.8 * vis(t, C2.cases - 0.4, C2.sum, 1, 1));
    const life = 1 - K(t, C2.stop + 0.3, C2.eeg + 3);
    if (netA > 0.01) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [i, j] of edges) { const a = nodes[i], b = nodes[j]; g.strokeStyle = `rgba(143,230,216,${0.22 * netA * (0.3 + 0.7 * life)})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); const ph = (t * 0.8 + a[2] * 3) % 1; if (life > 0.05) { g.fillStyle = `rgba(220,255,248,${0.8 * netA * life})`; g.beginPath(); g.arc(lerp(a[0], b[0], ph), lerp(a[1], b[1], ph), 2.4, 0, TAU); g.fill(); } }
      g.restore();
      nodes.forEach((p, i) => { const off = K(t, C2.stop + 0.3 + p[2] * 4, C2.stop + 1.3 + p[2] * 6); const tw = 0.6 + 0.4 * Math.sin(t * 2 + i); L.mote(g, p[0], p[1], 3.4, 'mint', netA * (1 - off * 0.85) * tw, false); });
    }
    // the heartbeat → flat (sc02), the brain wave → flat (sc03)
    const lineA = v * vis(t, S('sc02') - 0.3, C2.view + 1.5, 0.6, 1);
    if (lineA > 0) {
      const flatH = K(t, C2.stop, C2.stop + 1.2), flatE = K(t, C2.eeg + 1, C2.eeg + 4);
      const pts = [], pts2 = [];
      for (let x = 120; x <= 1800; x += 4) { const ph = ((x - t * 260) % 420 + 420) % 420; const beat = ph < 18 ? -Math.sin(ph / 18 * Math.PI) * 70 : ph < 30 ? Math.sin((ph - 18) / 12 * Math.PI) * 26 : 0; const fade = clamp((x - 120 - (t - C2.stop) * 260 * 0) / 1680, 0, 1); pts.push([x, 560 + beat * (1 - flatH * (x > 1800 - (t - C2.stop) * 260 ? 0 : 1)) ]); pts2.push([x, 480 + Math.sin(x * 0.05 + t * 7) * 14 * (1 - flatE) + Math.sin(x * 0.13 - t * 11) * 9 * (1 - flatE)]); }
      L.trail(g, pts, 1, COL.warm, 2, lineA * 0.9);
      L.trail(g, pts2, K(t, C2.eeg - 0.3, C2.eeg + 0.8), COL.mint, 2, lineA * 0.9);
    }
    // the cases: dots gathering to 2,500 (sc06), a small child figure
    const ca = v * vis(t, C2.cases - 0.2, C2.sum, 0.8, 1);
    if (ca > 0) { const n = Math.floor(2500 * out(K(t, C2.cases + 0.5, C2.cases + 6))); const r = L.rand(77); const grey = K(t, C2.crit, C2.crit + 2) * 0.6;
      for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 230; g.fillStyle = `rgba(${lerp(255, 200, grey) | 0},${lerp(220, 205, grey) | 0},${lerp(150, 215, grey) | 0},${0.85 * ca})`; g.fillRect(1240 + Math.cos(a) * d * 1.3, 330 + Math.sin(a) * d * 0.8, 3, 3); }
      L.figure(g, 600, 600, 150, COL.gold, ca, 0.2); }
    // energy → heat that spreads out (sc09–10)
    const ha = v * vis(t, C2.heat, C2.sum + 0.5, 0.8, 1);
    if (ha > 0) { L.figure(g, 960, 610, 260, COL.warm, ha * (1 - 0.6 * K(t, C2.heatGo, C2.heatGo + 5)), 0.25); const r = L.rand(12); const spread = K(t, C2.heatGo, C2.heatGo + 7);
      for (let i = 0; i < 160; i++) { const a = r() * TAU, s = r(); const ph = (t * (0.15 + s * 0.2) + r()) % 1; const dist = (60 + 700 * spread * (0.4 + s)) * ph; L.mote(g, 960 + Math.cos(a) * dist, 470 + Math.sin(a) * dist * 0.55 - ph * 80, 2.4, 'warm', ha * (1 - ph) * 0.8, false); } }
  }
  card('과학', '과학은 죽음을 어떻게 보나?', '과학', 'c-mint', ['sc01', 'ink']);
  txt('<span class="hero h3">보고, 느끼고, 기억하는 일<br>= 뇌 속 <span class="c-mint">전기 신호</span></span>', 120, 120, S('sc01') + 4.2, C2.stop - 0.4);
  txt('<span class="hero h1">약 10<span class="unit">초</span></span><br><span class="sub">피가 끊기면 의식을 잃기까지</span>', 120, 120, C2.stop + 0.2, C2.eeg);
  txt('<span class="hero h3">수십 초 뒤,<br>뇌파도 <span class="c-mint">거의 평평</span></span>', 120, 140, C2.eeg + 0.4, C2.view);
  txt('<span class="kick">대부분의 과학자</span><br><span class="hero h3">뇌가 멈추면<br><span class="c-mint">의식도 멈춘다</span></span>', 120, 130, C2.view + 0.3, S('sc05') + 0.3);
  txt('<span class="hero h3">다시 태어났다는<br>증거는?</span>', 120, 150, S('sc05') + 0.5, C2.cases + 0.2);
  txt('<span class="kick">버지니아 대학교 · 이언 스티븐슨</span><br><span class="hero h1">2,500<span class="unit">건+</span></span><br><span class="sub">전생을 기억한다는 아이들의 사례</span>', 120, 110, C2.cases + 0.4, C2.crit);
  txt('<span class="kick">비판</span><br><span class="hero h3">윤회를 믿는 지역,<br>들은 이야기가 <span class="c-mint">기억처럼</span></span>', 120, 130, C2.crit + 0.3, C2.notyet);
  txt('<span class="hero h3">과학계는 아직<br><span class="c-mint">증거로 받아들이지 않음</span></span>', 120, 140, C2.notyet + 0.2, C2.heat);
  txt('<span class="hero h3">“에너지는 사라지지 않으니<br>영혼도 남는다?”</span>', 'c', 130, C2.heat + 0.4, C2.heatGo);
  txt('<span class="hero h3">에너지는 <span style="color:#e2733a">열</span>로 흩어지고,<br>열에는 <span class="c-mint">기억이 없다</span></span>', 'c', 120, C2.heatGo + 0.5, C2.sum);
  txt('<span class="hero h3">죽은 뒤 의식이 이어진다는 증거는 <span class="c-mint">아직 없음</span></span><br><span class="sub">다만, 과학이 확인할 수 있는 것은 <b>여기까지</b></span>', 'c', 140, C2.sum + 0.4, C2.turn + 0.6);
  txt('<span class="hero h2">정말 <span class="c-peach">영영</span><br>사라질까?</span>', 'c', 150, C2.turn + 1, ch.at - 0.8);

  // ---------- at: stars → atoms → a body → the earth → the ring → what stays ----------
  const T4 = { stars: S('at01') + 3, burst: A('at01', '별 속', -0.4), elem: S('at02'), death: S('at03'), grass: A('at03', '풀과', -0.4), ring: S('at04'), core: S('at05'), mem: S('at06'), mem2: S('at07'), turn: S('at08') };
  const ra = L.rand(404), atoms = Array.from({ length: 260 }, () => { const u = ra(), w = ra(); return { home: [960 + (ra() - 0.5) * 110 * (u < 0.15 ? 0.6 : 1.2), 600 - ra() * 250], src: [200 + ra() * 1520, 40 + ra() * 260], d: ra(), soil: [300 + ra() * 1320, 900 + ra() * 150], ring: ra() * TAU, key: w < 0.4 ? 'peach' : w < 0.75 ? 'gold' : 'white' }; });
  // keep the home points inside a human silhouette
  atoms.forEach((a) => { const y = a.home[1], h = 600 - y; let half = h > 205 ? 26 : h > 175 ? 52 : 70 - h * 0.05; a.home[0] = 960 + (a.home[0] - 960) / 66 * half; if (h > 200 && h < 230) a.home[0] = 960 + (a.home[0] - 960) * 0.5; });
  const bursts = [[420, 120], [1500, 90], [1180, 210]];
  const people = Array.from({ length: 9 }, (_, i) => [260 + i * 175, 640 - (i % 2) * 6]);
  function drawAt(t) {
    const v = vis(t, ch.at - 0.6, ch.fn - 1.0, 1, 1.2); if (v <= 0) return;
    // supernovae
    bursts.forEach(([x, y], i) => { const bk = K(t, T4.burst + i * 0.6, T4.burst + i * 0.6 + 2.5); if (bk <= 0 || bk >= 1) return; g.globalCompositeOperation = 'lighter'; g.globalAlpha = v * (1 - bk); const R0 = 60 + bk * 340; g.drawImage(L.sp.peach, x - R0, y - R0, R0 * 2, R0 * 2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(255,220,190,${0.6 * (1 - bk) * v})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, R0 * 0.6, 0, TAU); g.stroke(); });
    // the atoms: from the stars into a body (at01–02), out into the earth (at03), around a ring (at04)
    const gather = io(K(t, T4.burst + 1, T4.elem + 1.5)), scatter = io(K(t, T4.death + 0.5, T4.grass + 1.5)), ringK = io(K(t, T4.ring - 0.3, T4.ring + 2.6)), fadeAll = 1 - K(t, T4.mem - 0.5, T4.mem + 1.2);
    for (const a of atoms) {
      let x = lerp(a.src[0], a.home[0], gather), y = lerp(a.src[1], a.home[1], gather) - Math.sin(gather * Math.PI) * 60 * a.d;
      x = lerp(x, a.soil[0], scatter); y = lerp(y, a.soil[1], scatter);
      const rr = 290 + a.d * 30, ang = a.ring + t * 0.35; x = lerp(x, 960 + Math.cos(ang) * rr, ringK); y = lerp(y, 360 + Math.sin(ang) * rr * 0.62, ringK);
      L.mote(g, x, y, 2.6 + a.d * 1.6, a.key, v * fadeAll * (0.6 + 0.4 * Math.sin(t * 2 + a.d * 9)), false);
    }
    // the person's outline while they are whole
    const body = vis(t, T4.elem - 1, T4.death + 1.4, 1, 1.4); if (body > 0) L.figure(g, 960, 610, 290, COL.peach, v * body * 0.8, 0.12);
    // grass growing on the near shore where the atoms land
    const gk = out(K(t, T4.grass, T4.grass + 3)) * (1 - K(t, T4.mem, T4.mem + 2));
    if (gk > 0) { const r = L.rand(8); g.lineCap = 'round'; for (let i = 0; i < 180; i++) { const x = r() * 1920, h = (30 + r() * 90) * gk, lean = (r() - 0.5) * 40; g.strokeStyle = `rgba(${120 + r() * 60 | 0},${170 + r() * 50 | 0},${110 + r() * 40 | 0},${0.85 * v})`; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 1085); g.quadraticCurveTo(x + lean * 0.3, 1085 - h * 0.6, x + lean, 1085 - h); g.stroke(); } }
    // the core (the self) that does not travel with the atoms (at05)
    const ck = vis(t, T4.core - 0.2, T4.mem, 0.8, 0.8); if (ck > 0) { const fade = 1 - K(t, T4.core + 3, T4.core + 7.5); L.mote(g, 960, 360, 12, 'gold', v * ck * fade); }
    // what stays: lights passed between people along the far shore (at06–07)
    const mk = vis(t, T4.mem - 0.4, ch.fn - 1.2, 1, 1);
    if (mk > 0) { people.forEach(([x, y], i) => { L.figure(g, x, y, 90, COL.gold, v * mk * 0.85, 0.15); L.mote(g, x, y - 52, 4 + 2 * K(t, T4.mem + 0.5 + i * 0.5, T4.mem + 1.2 + i * 0.5), 'gold', v * mk, false); });
      for (let i = 0; i < people.length - 1; i++) { const pk = ((t - T4.mem) * 0.45 - i * 0.18) % 1; if (pk < 0 || t < T4.mem + 0.5) continue; const [x0, y0] = people[i], [x1, y1] = people[i + 1]; L.mote(g, lerp(x0, x1, pk), lerp(y0, y1, pk) - 52 - Math.sin(pk * Math.PI) * 50, 3, 'gold', v * mk * Math.sin(pk * Math.PI), false); } }
  }
  card('원자', '우리는 남김없이 사라질까?', '사라질까', 'c-peach', ['at01', 'lt']);
  txt('<span class="hero h3">수소를 뺀 거의 모든 원자는<br><span class="c-peach">별 속</span>에서 만들어졌다</span>', 'c', 140, S('at01') + 4.4, T4.elem);
  txt('<span class="hero h2"><span class="c-peach">산소</span> · <span class="c-gold">탄소</span></span><br><span class="sub">별이 타오르고 폭발하며 흩뿌린 것</span>', 'c', 140, T4.elem + 0.3, T4.death);
  txt('<span class="hero h3">흙과 물과 공기로,<br>다시 <span class="c-peach">풀과 나무</span>로</span>', 'c', 140, T4.death + 0.5, T4.ring);
  txt('<span class="hero h2">물질은 <span class="c-peach">돌고 돈다</span></span>', 'c', 120, T4.ring + 0.6, T4.core);
  txt('<span class="hero h3">하지만 원자가 돌아도,<br><span class="c-gold">기억과 마음</span>은 건너가지 않는다</span>', 'c', 760, T4.core + 0.4, T4.mem, 'lt');
  txt('<span class="hero h3">남는 것 하나 더:<br><span class="c-gold">기억</span>과 <span class="c-gold">흔적</span></span>', 'c', 140, T4.mem + 0.4, T4.mem2);
  txt('<span class="hero h3">그 사람이 없었다면<br>세상에 없었을 것들</span>', 'c', 140, T4.mem2 + 0.3, T4.turn + 0.4);
  txt('<span class="hero h3">세 가지 대답을<br><span class="c-gold">나란히</span></span>', 'c', 160, T4.turn + 2, ch.fn - 0.8);

  // ---------- fn: the three signs side by side; the numbers; a light becomes a star ----------
  const F = { wheel: S('fn01'), path: S('fn02'), ring: S('fn03'), poll: S('fn04'), kr: S('fn05'), sure: S('fn06'), unk: S('fn06b'), life: S('fn07'), life2: S('fn07b'), star: S('fn08'), last: S('fn09') };
  function drawFn(t) {
    const v = vis(t, ch.fn - 0.6, data.duration + 2, 1, 0.1); if (v <= 0) return;
    const dim = 1 - 0.85 * K(t, F.poll, F.poll + 1.2) - 0.15 * K(t, F.star, F.star + 2);
    const signs = [[480, F.wheel], [960, F.path], [1440, F.ring]];
    signs.forEach(([x, t0], i) => { const a = v * dim * K(t, t0 + 0.2, t0 + 1.4); if (a <= 0) return; const y = 330;
      if (i === 0) { L.trail(g, circ(x, y, 130, 0, 90), 1, COL.lav, 3.5, a); for (let j = 0; j < 8; j++) { const an = t * 0.5 + j / 8 * TAU; L.mote(g, x + Math.cos(an) * 130, y + Math.sin(an) * 130, 4, 'lav', a, false); } }
      if (i === 1) { L.trail(g, [[x, y + 150], [x, y - 80]], 1, COL.gold, 3, a); g.strokeStyle = `rgba(255,236,190,${0.85 * a})`; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 50, y - 60); g.lineTo(x - 50, y - 120); g.arc(x, y - 120, 50, Math.PI, 0); g.lineTo(x + 50, y - 60); g.stroke(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.6; g.drawImage(L.sp.white, x - 120, y - 220, 240, 240); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      if (i === 2) { for (let j = 0; j < 60; j++) { const an = t * 0.35 + j / 60 * TAU; L.mote(g, x + Math.cos(an) * 130, y + Math.sin(an) * 82, 2.6, j % 3 ? 'peach' : 'gold', a, false); } }
    });
    // the last light rises from the water and becomes a star
    const sk = K(t, F.last - 0.5, F.last + 6);
    if (t > F.star) { const y = lerp(1000, 150, io(sk)); L.mote(g, 960, y, 8 + 4 * sk, 'gold', v * K(t, F.star, F.star + 1), y < L.HZ); if (sk > 0.95) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = v * K(sk, 0.95, 1); g.drawImage(L.sp.white, 960 - 60, 150 - 60, 120, 120); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } }
  }
  card('그래서', '그래서, 사람은 윤회하는가?', '윤회', 'c-lav', ['fn01', 'lt']);
  txt('<span class="hero h3 c-lav">윤회</span><br><span class="sub" style="font-size:34px">돌고 도는 바퀴<br>벗어남이 목표</span>', 480, 500, F.wheel + 0.6, F.poll, 'lt', { cx: true });
  txt('<span class="hero h3 c-gold">한 번뿐인 삶</span><br><span class="sub" style="font-size:34px">그 뒤에<br>이어지는 세상</span>', 960, 500, F.path + 0.4, F.poll, 'lt', { cx: true });
  txt('<span class="hero h3 c-peach">과학</span><br><span class="sub" style="font-size:34px">의식은 멈추고<br>원자는 돈다</span>', 1440, 500, F.ring + 0.4, F.poll, 'lt', { cx: true });
  txt('<span class="kick">퓨 리서치 센터 · 2021 · 미국 성인</span><br><span class="hero h1">3명 중 <span class="c-lav">1명</span></span><br><span class="sub">윤회를 믿는다</span>', 'c', 140, F.poll + 0.6, F.kr, 'lt');
  txt('<span class="kick">2023 국제 조사 · 한국</span><br><span class="hero h1"><span class="c-gold">35</span><span class="unit">%</span></span><br><span class="sub">죽은 뒤의 세상이 있다고 믿는다</span>', 'c', 140, F.kr + 0.3, F.sure, 'lt');
  txt('<span class="kick">확실한 것</span><br><span class="hero h2">원자는 <span class="c-peach">돈다</span></span>', 'c', 150, F.sure + 1.5, F.unk, 'lt');
  txt('<span class="kick">알 수 없는 것</span><br><span class="hero h3">나라는 마음은 다시 태어날까,<br>다른 세상으로 갈까, <span style="opacity:.7">사라질까</span></span>', 'c', 140, F.unk + 0.3, F.life, 'lt');
  txt('<span class="hero h3">어느 대답을 고르든,<br>이야기는 <span class="c-gold">지금의 삶</span>으로 돌아온다</span>', 'c', 140, F.life + 0.4, F.life2, 'lt');
  txt('<span class="sub" style="font-size:44px;line-height:1.6">윤회 — <b>지금의 행동</b>이 다음 삶을 정하고<br>한 번뿐 — <b>지금의 삶</b>이 더 무거워지고<br>사라짐 — <b>남긴 기억과 흔적</b>이 남는다</span>', 'c', 130, F.life2 + 0.4, F.star, 'lt');
  txt('<span class="hero h3">우리 몸의 원자는<br>아주 오래전 <span class="c-peach">별 속</span>에서</span>', 'c', 150, F.star + 1.2, F.last + 0.4, 'lt');
  txt('<span class="hero h2">사람은 윤회하는가,<br>영영 사라지는가</span>', 'c', 620, F.last + 4, data.duration + 5, 'lt');

  Video.progress(0.7);
  onFrame((t) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 1; g.setLineDash([]);
    const d = dayAt(t);
    L.draw(g, t, d, { stars: Math.max(K(t, ch.at + 2, ch.at + 6) * 0.6, 0), sunX: lerp(1240, 760, K(t, ch.at - 1, ch.at + 3)) });
    drawOp(t); drawRb(t); drawOn(t); drawSc(t); drawAt(t); drawFn(t); drawDrops(t);
    for (const x of texts) { const a = vis(t, x.t0, x.t1, 0.7, 0.5); if (a <= 0) { if (x.el.style.opacity !== '0') x.el.style.opacity = '0'; continue; } const kin = out(K(t, x.t0, x.t0 + 0.9)); x.el.style.opacity = a.toFixed(3); x.el.style.transform = `translateY(${((1 - kin) * 22 - K(t, x.t1 - 0.5, x.t1) * 12).toFixed(1)}px)`; x.el.style.filter = kin < 1 ? `blur(${((1 - kin) * 6).toFixed(1)}px)` : ''; }
  });
});
