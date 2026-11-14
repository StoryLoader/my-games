/* a_intro.js — the first three chapters in clay: the opening, "LLM이란 무엇일까?", "LLM은 어떻게 배울까?" (storyboard.md).
   The mascot robot stands for the LLM; words are clay blocks it adds one by one; parameters are clay dials. */
window.SEG_intro = function (G) {
  const { S, E, A, K, io, out, back, lerp, clamp, C, T, set, item, show, cls, type, fx, count, live, rand, TAU } = G;
  const WH = '#fffdf8';
  const B = (t, c, o) => C.block(t, c, o);
  const standY = (b) => b.userData.h / 2 + 0.02;

  // ================= opening =================
  set(0, { bg: '#fff1dc', cam: { d: 17, a: -0.22, el: 0.2, tx: 0, ty: 2.1 } }, (s) => {
    const bot = C.bot({ tag: 'AI' }); s.add(bot, [3.6, 1.6, 0.3], { s: 1.45, at: 0.15, r: [0, -0.3, 0], bob: 0.06 }); s.live((t) => bot.userData.live(t, 0, 0));
    [['자기소개서 써 줘', 'sky', WH, [-4.6, 5.5, 0], '글을', 0.2], ['네, 초안입니다!', 'white', null, [-2.2, 4.5, 0.3], '써 주고', -0.2], ['제주 여행 계획 짜 줘', 'sky', WH, [-4.3, 3.5, 0.5], '여행', 0.2], ['1일차: 공항 → 애월 …', 'white', null, [-1.9, 2.5, 0.8], '짜 줍니다', -0.2]].forEach(([tx, c, tc, p, ph, ry], i) =>
      s.add(B(tx, c, { size: 0.5, text: tc || '#25324f', d: 0.5 }), p, { at: A('op01', ph, -0.3), r: [0, ry, 0], bob: 0.05, snd: i % 2 ? 'pop' : 'tick', out: S('op02') + 0.2 }));
    [[1.9, 4.6, 0, 1.0], [4.9, 4.9, -0.4, 1.3], [6.1, 3.3, 0.2, 0.9]].forEach(([x, y, z, sc], i) => s.add(C.qmark(i === 1 ? 'coral' : 'sun'), [x, y, z], { at: S('op02') + 0.25 + i * 0.18, s: sc, bob: 0.12, sway: 0.12, snd: i ? null : 'pop' }));
    s.cam(S('op02') + 0.6, { d: 13.5, a: 0.12, tx: 1.6, ty: 2.5 });
    item('<span class="hd h2">말만 하면 <span class="chip">해 주는</span> AI</span>', 150, 690, 0.5, S('op02') - 0.1);
    item('<span class="hd h1">이 AI, 대체<br><span class="chip sun">무엇</span>일까?</span>', 150, 300, S('op02') + 0.3, undefined, { anim: 'left' });
  });

  set(S('op03'), { bg: '#ffe9d4', cam: { d: 17, a: 0, el: 0.17, tx: 0, ty: 2.0 } }, (s) => {
    const l1 = B('LLM', 'sun', { size: 1.5, d: 1.0, padX: 0.9, padY: 0.5 }), l2 = B('AI 에이전트', 'coral', { size: 1.05, d: 1.0, text: WH, padX: 0.8, padY: 0.6 });
    s.add(l1, [-3.7, standY(l1) + 0.5, 0], { at: A('op03', 'LLM', -0.25), r: [0, 0.22, 0], bob: 0.07, snd: 'hit' });
    s.add(l2, [3.3, standY(l2) + 0.6, 0], { at: A('op03', 'AI 에이전트', -0.25), r: [0, -0.2, 0], bob: 0.07, snd: 'hit' });
    s.cam(S('op04') + 0.5, { a: -0.14, tx: -0.9, d: 15.5 }); s.cam(S('op05') + 0.5, { a: 0.14, tx: 0.9, d: 15.5 });
    item('<span class="kick">오늘 알아 갈 두 가지 말</span>', 'c', 130, S('op03') + 0.2);
    item('<span class="sub" style="display:block;width:760px;text-align:center">챗GPT · 클로드 안에서<br><b>글을 만들어 내는 프로그램</b></span>', 110, 790, S('op04') + 0.4, S('op05') + 0.2);
    item('<span class="sub" style="display:block;width:820px;text-align:center">대답에서 그치지 않고<br><b>직접 일까지 해 주는 것</b></span>', 1000, 790, S('op05') + 0.5);
  });

  set(S('op06'), { bg: '#ffeccb', cam: { d: 17.5, a: -0.3, el: 0.2, tx: -2.4, ty: 2.0 } }, (s) => {
    [['1  LLM이란?', 'sun', '#25324f', '먼저', -4.6], ['2  70여 년의 역사', 'mint', WH, '그다음', 0], ['3  에이전트란?', 'coral', WH, '마지막으로', 4.6]].forEach(([tx, c, tc, ph, x], i) => {
      const cn = C.coin(tx.replace('  ', '\n'), c, 1.75, { text: tc, size: 0.52, d: 0.5 }); const t = A('op06', ph, -0.25);
      s.add(cn, [x, 2.2, 0], { at: t, r: [0, (1 - i) * 0.25, 0], bob: 0.08, snd: 'hit' }); if (i) s.cam(t + 0.8, { a: -0.3 + i * 0.3, tx: -2.4 + i * 2.4 }); });
    item('<span class="hd h2"><span class="chip ink">세 걸음</span>으로 알아봅니다</span>', 'c', 130, S('op06') + 0.2);
  });

  // ================= LLM이란 무엇일까? =================
  set(S('lm01'), { bg: '#dff0ff', cam: { d: 16.5, a: 0.18, el: 0.18, tx: 0, ty: 2.2 } }, (s) => {
    const bot = C.bot(); s.add(bot, [-4.1, 1.6, 0], { s: 1.45, r: [0, 0.35, 0], bob: 0.05, at: S('lm01') + 0.15 }); s.live((t) => bot.userData.live(t, 0, 0));
    [['Large', 'sun', 4.5], ['Language', 'mint', 3.05], ['Model', 'sky', 1.6]].forEach(([w, c, y], i) => s.add(B(w, c, { size: 0.82, d: 0.7, text: i ? WH : '#25324f', minW: 4.4 }), [2.6, y, 0], { at: A('lm02', 'Large', -0.2) + i * 0.16, r: [0, -0.22, 0], out: S('lm03') - 0.1, snd: 'tick' }));
    item('<span class="kick">첫 번째 말</span>', 150, 130, S('lm01') + 0.2, S('lm03') - 0.1);
    item('<span class="hd h2">= 대규모 언어 모델</span>', 990, 770, A('lm02', '우리말로', -0.1), S('lm03') - 0.1, { snd: 'pop' });
    // lm03: the one job
    const ws = [['앞에', 'white'], ['놓인', 'white'], ['글', 'white'], ['?', 'coral']]; let x = -0.4;
    ws.forEach(([w, c], i) => { const b = B(w, c, { size: 0.8, d: 0.7, text: i === 3 ? WH : '#25324f', minW: i === 3 ? 1.5 : 0 }); x += b.userData.w / 2;
      s.add(b, [x, 2.3, 0], { at: (i === 3 ? A('lm03', '다음에', -0.25) : A('lm03', '앞에', -0.2) + i * 0.12), r: [0, -0.15, 0], bob: i === 3 ? 0.12 : 0.04, snd: i === 3 ? 'hit' : 'tick' }); x += b.userData.w / 2 + 0.22; });
    s.cam(S('lm03') + 0.6, { a: -0.04, tx: 0.7, d: 15.5 });
    item('<span class="hd h2">하는 일은 딱 하나</span>', 'c', 130, S('lm03') + 0.2);
    item('<span class="hd h1"><span class="chip">다음에 올 말</span> 맞히기</span>', 760, 760, A('lm03', '다음에', -0.2), undefined, { anim: 'pop', style: 'top:742px' });
  });

  set(S('lm04'), { bg: '#e4f3ff', cam: { d: 15, a: -0.2, el: 0.16, tx: -0.6, ty: 2.5 } }, (s) => {
    const FONT = C.FONT;
    const ph = C.panel(2.5, 4.4, 'navy', (x, w, h, st) => { x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#4aa6ff'; const txt = '오늘 날씨가'.slice(0, st.n); x.font = `800 96px 'Pretendard', sans-serif`; const tw = x.measureText(txt + '|').width + 90; x.beginPath(); x.roundRect(w - tw - 50, 150, tw, 170, 60); x.fill(); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(txt + '|', w - tw - 5, 238);
      x.fillStyle = '#d8d3c7'; x.fillRect(0, h - 520, w, 520);
      if (st.sg) { x.fillStyle = '#fffdf8'; x.fillRect(0, h - 700, w, 180); x.fillStyle = '#25324f'; x.font = `900 88px 'Pretendard', sans-serif`; x.textAlign = 'center'; ['좋네요', '맑아요', '추워요'].forEach((wd, i) => x.fillText(wd, w * (0.18 + i * 0.32), h - 610)); x.textAlign = 'left'; }
      x.fillStyle = '#c4beb1'; for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 9; c2++) { x.beginPath(); x.roundRect(30 + c2 * 108, h - 470 + r * 150, 92, 120, 22); x.fill(); } }, { d: 0.34, rim: 0.36, r: 0.36, state: { n: 0, sg: 0 } });
    s.add(ph, [-3.3, 2.75, 0], { r: [0, 0.3, 0], at: S('lm04') + 0.15, kf: [[S('lm05') - 0.1, {}], [S('lm05') + 0.9, { p: [-4.7, 1.9, 0], s: 0.6 }]] });
    const t0 = A('lm04', '오늘', -0.2), tS = A('lm04', '다음 단어', -0.3); fx('pop', tS);
    for (let i = 0; i < 4; i++) fx('tick', t0 + i * 0.3);
    s.live((t) => ph.userData.state({ n: Math.round(6 * K(t, t0, t0 + 1.2)), sg: t >= tS ? 1 : 0 }));
    const bot = C.bot(); s.add(bot, [2.9, 1.6, 0], { at: S('lm05') + 0.3, r: [0, -0.3, 0], s: 0.6, kf: [[S('lm05') + 0.4, { s: 0.6, p: [2.9, 0.75, 0] }], [A('lm05', '키운', 0.3), { s: 1.9, p: [2.9, 2.05, 0] }]], snd: 'hit' }); s.live((t) => bot.userData.live(t, 0, 0));
    s.cam(S('lm05') + 0.8, { a: 0.14, tx: 0.6, d: 16.5, ty: 2.5 });
    item('<span class="hd h2">문자 쓸 때의<br><span class="chip sky">다음 단어 추천</span></span>', 900, 240, S('lm04') + 0.5, S('lm05') - 0.1);
    item('<span class="hd h2">이 기능을 <span class="chip sky">엄청나게</span> 키운 것</span>', 'c', 130, S('lm05') + 0.2);
  });

  // the next-word machine
  set(S('lm06'), { bg: '#dcefff', cam: { d: 18, a: 0.1, el: 0.24, tx: 0, ty: 2.6 } }, (s) => {
    const row = [['오늘', 0], ['날씨가', 0], ['참', 0]], ROWY = 4.9; let x = -6.2; const tPick = A('lm08', '골라', 0.1);
    row.forEach(([w], i) => { const b = B(w, 'white', { size: 0.66, d: 0.6 }); x += b.userData.w / 2; s.add(b, [x, ROWY, 0], { at: S('lm06') + 0.2 + i * 0.12, out: S('lm09') - 0.05, snd: 'tick' }); x += b.userData.w / 2 + 0.2; });
    const good = B('좋네요', 'sun', { size: 0.66, d: 0.6 }), gx = x + good.userData.w / 2, q = B('?', 'coral', { size: 0.66, d: 0.6, text: WH, minW: 1.3 });
    s.add(q, [gx, ROWY, 0], { at: A('lm06', '다음에', -0.3), out: S('lm09') - 0.05, bob: 0.1, kf: [[tPick - 0.1, { p: [gx, ROWY, 0] }], [tPick + 0.5, { p: [gx + good.userData.w / 2 + 0.95, ROWY, 0] }]], snd: 'pop' });
    // candidates: clay columns as tall as their score
    const cands = [['좋네요', 62, 'sun'], ['덥네요', 21, 'mint'], ['춥네요', 9, 'sky'], ['흐리네요', 5, 'lilac']], tSc = A('lm06', '점수', -0.4), bars = [];
    cands.forEach(([w, p, c], i) => { const cx = -3.6 + i * 2.6, hh = p / 62 * 2.9, bar = C.rbox(1.4, 1, 1.4, c, 0.2), g = C.grp(bar), pc = C.label(p + '%', { size: 0.5 }); g.add(pc);
      s.add(g, [cx, 0, 0], { at: tSc + i * 0.14, out: tPick + (i ? 0.2 : 0.6), drop: 0, snd: 'tick' }); bars.push({ bar, pc, hh, t: tSc + 0.2 + i * 0.14, th: i < 3 ? A('lm07', w, -0.15) : 1e9 });
      const lb = i === 0 ? good : B(w, 'white', { size: 0.5, d: 0.4 });
      if (i === 0) s.add(lb, [cx, 0.42, 1.25], { at: tSc, out: S('lm09') - 0.05, kf: [[tPick - 0.15, { p: [cx, 0.42, 1.25], s: 0.78 }], [tPick + 0.55, { p: [gx, ROWY, 0], s: 1 }]], s: 0.78, snd: null });
      else s.add(lb, [cx, 0.36, 1.25], { at: tSc + i * 0.14, out: tPick + 0.2, snd: null }); });
    fx('ok', tPick + 0.5); for (const b of bars) if (b.th < 1e8) fx('tick', b.th);
    s.live((t) => { for (const b of bars) { const k = out(K(t, b.t, b.t + 0.9)), pu = 1 + 0.14 * Math.sin(Math.PI * K(t, b.th, b.th + 0.5)), h = Math.max(0.05, b.hh * k) * pu; b.bar.scale.set(pu, h, pu); b.bar.position.y = h / 2; b.pc.position.set(0, h + 0.5, 0); } });
    s.cam(S('lm08') + 0.2, { d: 16.5, a: -0.12, ty: 2.8, el: 0.2 });
    item('<span class="kick">다음 말 맞히기 · 예시 (점수는 설명용)</span>', 150, 130, S('lm06') + 0.2, S('lm09') - 0.1);
    item('<span class="hd h3">붙인 말까지 포함해서 → <span class="chip sky">또 다음 말</span></span>', 'c', 720, A('lm08', '방금', -0.2), S('lm09') - 0.1);
    // lm09: piece by piece, a whole answer
    const words = '오늘 날씨가 참 좋네요 . 산책하기 딱 좋은 날이에요 . 가까운 공원에 나가서 가볍게 걸어 보는 건 어떨까요 ?'.split(' '), t0 = S('lm09') + 0.1, t1 = A('lm09', '한 편의', 0.7), cnt = [];
    let wx = -6.0, wy = 5.2;
    words.forEach((w, i) => { const b = B(w, i < 4 ? (i === 3 ? 'sun' : 'white') : ['white', 'ice'][i % 2], { size: 0.5, d: 0.5 }); if (wx + b.userData.w > 6.2) { wx = -6.0; wy -= 1.28; } const tt = i < 4 ? t0 : lerp(t0 + 0.3, t1, (i - 4) / (words.length - 4));
      s.add(b, [wx + b.userData.w / 2, wy, 0], { at: tt, r: [0, 0, (i % 3 - 1) * 0.03], snd: i >= 4 && i % 2 === 0 ? 'tick' : null }); cnt.push(tt); wx += b.userData.w + 0.2; });
    s.cam(S('lm09') + 0.9, { d: 18, a: 0.14, ty: 3.2, el: 0.22 });
    const cn = item('<span class="hd h3">조각 <span class="chip sky n">4</span>개 … <span class="dim">실제로는 수백 번</span></span>', 'c', 720, S('lm09') + 0.3);
    const nn = cn.el.querySelector('.n'); let last = -1; live.push((t) => { let n = 0; for (const u of cnt) if (t >= u) n++; if (n !== last) { last = n; nn.textContent = n; } });
  });

  set(S('lm10'), { bg: '#e6f4ff', cam: { d: 16, a: -0.14, el: 0.18, tx: 0, ty: 2.4 } }, (s) => {
    const qb = B('Q. 한국의 수도는 어디야?', 'navy', { size: 0.62, d: 0.6, text: WH }); s.add(qb, [-2.2, 3.6, 0], { at: S('lm10') + 0.5, r: [0, 0.12, 0], bob: 0.05, snd: 'tick' });
    let x = -3.9; ['한국의', '수도는', '서울입니다', '.'].forEach((w, i) => { const b = B(w, 'sun', { size: 0.66, d: 0.6 }); x += b.userData.w / 2; s.add(b, [x, 1.5, 0.4], { at: A('lm10', '이어질', -0.2) + i * 0.4, snd: 'tick' }); x += b.userData.w / 2 + 0.2; });
    const bot = C.bot(); s.add(bot, [4.9, 1.3, 0], { s: 1.15, r: [0, -0.5, 0], at: S('lm10') + 0.2, bob: 0.05 }); s.live((t) => bot.userData.live(t, 0, 0));
    item('<span class="hd h2">질문에 답하는 것도 <span class="chip sky">같은 원리</span></span>', 'c', 130, S('lm10') + 0.2);
    item('<span class="sub">질문 뒤에 이어질 <b>가장 그럴듯한 글</b>을 만든다</span>', 'c', 770, A('lm10', '이 질문', -0.2));
  });

  // ================= LLM은 어떻게 배울까? =================
  set(S('tr01'), { bg: '#dff6ea', cam: { d: 15.5, a: 0.2, el: 0.18, tx: 0.4, ty: 2.3 } }, (s) => {
    const bot = C.bot(); s.add(bot, [3.7, 1.6, 0], { s: 1.45, r: [0, -0.35, 0], at: S('tr01') + 0.15, bob: 0.05 }); s.live((t) => bot.userData.live(t, 0, 0));
    s.add(C.qmark('coral'), [3.7, 4.55, 0], { at: S('tr01') + 0.5, s: 1.2, bob: 0.12, sway: 0.1, out: S('tr02') - 0.1 });
    item('<span class="hd h1">이 실력,<br><span class="chip mint">어디서</span> 왔을까?</span>', 150, 290, S('tr01') + 0.3, S('tr02') - 0.1, { anim: 'left' });
    // tr02: a pile of pages, a sentence with its end covered
    const rr = rand(5); for (let i = 0; i < 9; i++) s.add(C.sheet(1.5, 1.05, '', 4), [-5.4 + rr() * 2.4, 0.06 + i * 0.09, 0.6 + rr() * 1.2], { at: A('tr02', '책과', -0.3) + i * 0.1, r: [-Math.PI / 2 + 0.02, 0, (rr() - 0.5) * 0.9], drop: 2.2, snd: i % 3 ? null : 'tick' });
    const tCov = A('tr02', '가리고', -0.2); let x = -5.6;
    [['해는', 'white'], ['동쪽에서', 'white']].forEach(([w, c], i) => { const b = B(w, c, { size: 0.66, d: 0.6 }); x += b.userData.w / 2; s.add(b, [x, 3.9, 0], { at: A('tr02', '가져와서', -0.2) + i * 0.12, snd: 'tick' }); x += b.userData.w / 2 + 0.2; });
    const ans = B('뜹니다', 'white', { size: 0.66, d: 0.6 }), cov = B('?', 'navy', { size: 0.66, d: 0.7, text: WH, minW: ans.userData.w + 0.1 });
    s.add(ans, [x + ans.userData.w / 2, 3.9, 0], { at: A('tr02', '가져와서', 0.1), out: tCov + 0.25, snd: 'tick' });
    s.add(cov, [x + ans.userData.w / 2, 3.9, 0.05], { at: tCov, drop: 1.6, snd: 'hit' });
    const guess = B('“집니다”', 'coral', { size: 0.56, d: 0.5, text: WH }); s.add(guess, [1.2, 2.5, 0.6], { at: A('tr02', '맞혀', 0.25), r: [0, -0.2, 0.05], bob: 0.06, snd: 'buzz' });
    s.add(C.cross('navy'), [2.75, 3.15, 0.9], { at: A('tr02', '맞혀', 0.75), s: 1.1, snd: null });
    s.cam(S('tr02') + 0.6, { d: 17, a: 0.02, tx: -0.4, ty: 2.5 });
    item('<span class="hd h2">엄청난 양의 글로 <span class="chip mint">맞히기 연습</span></span>', 'c', 130, S('tr02') + 0.2);
    item('<span class="note" style="font-size:34px">책 · 인터넷의 글</span>', 250, 790, A('tr02', '책과', 0.5));
  });

  // the wall of dials
  set(S('tr03'), { bg: '#d9f4e6', cam: { d: 17, a: -0.26, el: 0.2, tx: 0.2, ty: 3.1 } }, (s) => {
    const board = C.rbox(8.2, 4.6, 0.5, 'white', 0.3), g = C.grp(board), dials = [], rr = rand(8), cols = ['sun', 'coral', 'sky', 'lilac', 'mint'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const d = C.dial(cols[(r * 2 + c) % 5]); d.position.set(-3.1 + c * 1.24, 1.35 - r * 1.35, 0.3); d.scale.setScalar(1.25); g.add(d); dials.push({ d, a0: rr() * 5, k: (rr() - 0.5) * 2 }); }
    s.add(g, [2.5, 2.9, -0.2], { r: [-0.08, -0.22, 0], at: S('tr03') + 0.15, snd: 'hit' });
    const nudges = [A('tr03', '틀릴', 0.3), A('tr03', '고칩니다', -0.4), A('tr05', '맞혀', 0.2), A('tr05', '틀리고', 0.2), A('tr05', '다이얼', 0.3), A('tr05', '되풀이', -0.2), A('tr05', '되풀이', 0.5), A('tr05', '학습', -0.3)];
    nudges.forEach((t) => fx('dial', t));
    s.live((t) => { let n = 0; for (const u of nudges) n += io(K(t, u, u + 0.5)); for (const q of dials) q.d.rotation.z = q.a0 + q.k * 0.5 * n; });
    const bot = C.bot(); s.add(bot, [-5.4, 1.15, 0.8], { s: 1.05, r: [0, 0.6, 0], at: S('tr03') + 0.3, bob: 0.05 }); s.live((t) => bot.userData.live(t, 0, 0));
    s.cam(S('tr04') + 0.7, { d: 15.5, a: -0.1, tx: 0.8, ty: 3.2 }); s.cam(S('tr05') + 0.6, { d: 17, a: -0.3, tx: 0.2, ty: 3.1 });
    item('<span class="hd h2">LLM의 속 = 수없이 많은 <span class="chip mint">숫자</span></span>', 'c', 130, S('tr03') + 0.3, S('tr04') - 0.1);
    item('<span class="sub">틀릴 때마다, 정답에 가까워지도록 <b>아주 조금씩</b> 고친다</span>', 'c', 780, A('tr03', '틀릴', -0.2), S('tr04') - 0.1);
    item('<span class="hd h2">이 숫자 = <span class="chip mint">파라미터</span></span>', 'c', 130, S('tr04') + 0.2, S('tr05') - 0.1, { snd: 'hit' });
    item('<span class="hd h2">다이얼이 <span class="chip sun">수천억 개</span></span>', 'c', 760, A('tr04', '수천억', -0.3), S('tr05') - 0.1, { anim: 'pop', snd: 'hit' });
    item('<span class="hd h3">맞혀 보기 → 틀림 → <span class="chip sun">다이얼 조금 돌리기</span></span>', 'c', 130, S('tr05') + 0.2);
    item('<span class="hd h3">이 과정 = <span class="chip mint">학습</span></span>', 300, 770, A('tr05', '학습이라고', -0.4), undefined, { anim: 'pop', snd: 'pop' });
    item('<span class="hd h3">마친 프로그램 = <span class="chip mint">모델</span></span>', 980, 770, A('tr05', '모델', -0.5), undefined, { anim: 'pop', snd: 'pop' });
  });

  // tr06: what it picks up by itself
  set(S('tr06'), { bg: '#e2f7ec', cam: { d: 15.5, a: 0.24, el: 0.18, tx: 0, ty: 2.3 } }, (s) => {
    const bot = C.bot(); s.add(bot, [2.6, 1.75, 0], { s: 1.6, r: [0, -0.3, 0], at: S('tr06') + 0.15, bob: 0.05 }); s.live((t) => bot.userData.live(t, 0, 0));
    [['문법', 'sun', '문법'], ['상식', 'sky', '상식'], ['글의 흐름', 'coral', '글의']].forEach(([w, c, ph], i) => { const t = i ? A('tr06', ph, -0.2) : S('tr06') + 6.85, t2 = E('tr06') - 1.9 + i * 0.45, p = [-4.6 + i * 0.5, 4.3 - i * 1.5, 0.3];
      s.add(B(w, c, { size: 0.72, d: 0.6, text: i === 0 ? '#25324f' : WH }), p, { at: t, bob: 0.07, kf: [[t2, { p, s: 1 }], [t2 + 0.8, { p: [2.4, 2.0, 0.7], s: 0.15 }]], out: t2 + 0.85, snd: 'pop' }); fx('ok', t2 + 0.75); });
    item('<span class="hd h2">맞히기 연습만 시켰는데</span>', 'c', 130, S('tr06') + 0.2);
    item('<span class="hd h2">가르친 적 없는 것까지 <span class="chip mint">저절로</span></span>', 'c', 760, A('tr06', '익히게', -0.6), undefined, { anim: 'pop' });
  });

  // tr09–10: the weak spot
  set(S('tr09'), { bg: '#fdeede', cam: { d: 16.5, a: -0.16, el: 0.18, tx: 0, ty: 2.5 } }, (s) => {
    const bk = C.book('사전', 'coral'); s.add(bk, [-4.4, 1.25, 0], { r: [0, 0.4, 0], at: A('tr09', '사실을', -0.3), out: S('tr10') - 0.1, snd: 'pop' });
    s.add(C.cross('navy'), [-4.4, 1.5, 0.9], { at: A('tr09', '아니라', -0.3), s: 2.6, out: S('tr10') - 0.1, snd: 'buzz' });
    const bot = C.bot(); s.add(bot, [3.9, 1.5, 0], { s: 1.35, r: [0, -0.4, 0], at: S('tr09') + 0.2, bob: 0.05, kf: [[S('tr10') - 0.2, { p: [3.9, 1.5, 0] }], [S('tr10') + 0.6, { p: [5.3, 1.3, 0], s: 1.1 }]] }); s.live((t) => bot.userData.live(t, 0, 0));
    let x = -0.6; ['그럴듯한', '말을', '잇는다'].forEach((w, i) => { const b = B(w, 'white', { size: 0.56, d: 0.5 }); x += b.userData.w / 2; s.add(b, [x, 4.2, 0], { at: A('tr09', '그럴듯한', -0.3) + i * 0.15, out: S('tr10') - 0.1, snd: 'tick' }); x += b.userData.w / 2 + 0.18; });
    x = -5.9; ['세종대왕은', '1887년에', '스마트폰을', '발명했습니다', '.'].forEach((w, i) => { if (i === 2) x = -5.9; const b = B(w, 'white', { size: 0.62, d: 0.55 }); x += b.userData.w / 2; s.add(b, [x, i < 2 ? 4.5 : 3.25, 0], { at: S('tr10') + 0.3 + i * 0.5, snd: 'tick' }); x += b.userData.w / 2 + 0.2; });
    const tSt = A('tr10', '환각', -0.35), st = B('환각', 'coral', { size: 1.1, d: 0.6, text: WH, padX: 0.8, padY: 0.4 });
    s.add(st, [1.9, 1.7, 1.4], { at: tSt, drop: 4.5, r: [0, 0, -0.16], snd: 'stamp' });
    s.cam(S('tr10') + 0.5, { d: 17, a: 0.08, ty: 2.6 }); s.cam(tSt + 0.5, { d: 14.5, a: 0.0, ty: 2.4 });
    item('<span class="hd h2">배운 방식 탓에 생기는 <span class="chip">약점</span></span>', 'c', 130, S('tr09') + 0.2, S('tr10') - 0.1);
    item('<span class="hd h3">사전이 아니라, <span class="chip sun">그럴듯한 말</span>을 잇는 기계</span>', 'c', 770, A('tr09', '그럴듯한', -0.2), S('tr10') - 0.1);
    item('<span class="hd h2">모르는 것도 <span class="chip">아는 것처럼</span></span>', 'c', 130, S('tr10') + 0.2);
    item('<span class="note" style="font-size:32px">위 문장은 일부러 지어낸 틀린 예입니다</span>', 'c', 800, S('tr10') + 1.4);
  });

  set(S('tr11'), { bg: '#e9f8ee', cam: { d: 15.5, a: 0.2, el: 0.17, tx: -1.4, ty: 2.2 } }, (s) => {
    const bot = C.bot(); s.add(bot, [3.4, 1.75, 0], { s: 1.6, r: [0, -0.35, 0], at: S('tr11') + 0.15, bob: 0.06 }); s.live((t) => bot.userData.live(t, 0, 0));
    item('<span class="kick">정리</span>', 150, 150, S('tr11') + 0.2);
    item('<span class="hd h2">LLM = 엄청난 양의 글로<br><span class="chip mint">다음 말 맞히기</span>를<br>연습한 프로그램</span>', 150, 250, S('tr11') + 0.4, undefined, { anim: 'left' });
    item('<span class="hd h3">말은 잘하지만, <span class="coral">틀릴 수도 있다</span></span>', 150, 660, A('tr11', '말은', -0.2), undefined, { snd: 'pop' });
  });
};
