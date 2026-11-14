/* c_agent.js — "AI 에이전트란 무엇일까?", "에이전트는 어떻게 발전했을까?", and the closing, in clay (storyboard.md).
   The mascot (the LLM) gets arms, tools, a notebook and a loop: that is the agent. */
window.SEG_agent = function (G) {
  const { S, E, A, K, io, out, back, lerp, clamp, C, T, set, item, show, cls, type, fx, count, yearAt, railOn, live, rand, TAU, END } = G;
  const WH = '#fffdf8', FONT = C.FONT;
  const B = (t, c, o) => C.block(t, c, o);
  const year = (s, y, p, at, c = 'pink') => s.add(B(String(y), c, { size: 1.1, d: 0.8, padX: 0.6, padY: 0.3, text: '#25324f' }), [Math.max(p[0], -3.7), p[1], p[2]], { at, r: [0, -0.12, 0.03], bob: 0.06, snd: 'hit' });
  const armed = (s, bot, t0, wave = () => 0) => s.live((t) => bot.userData.live(t, out(K(t, t0, t0 + 0.6)), wave(t)));

  // ================= AI 에이전트란 무엇일까? =================
  set(S('ag01'), { bg: '#d9f4ee', cam: { d: 16, a: 0.24, el: 0.2, tx: 0, ty: 2.5 } }, (s) => {
    const bot = C.bot(), tArm = A('ag02', 'AI 에이전트', -0.2); s.add(bot, [-3.4, 1.6, 0], { s: 1.45, r: [0, 0.4, 0], at: S('ag01') + 0.15, bob: 0.05, kf: [[tArm - 0.3, { p: [-3.4, 1.6, 0], s: 1.45 }], [tArm + 0.5, { p: [-3.6, 1.9, 0], s: 1.7 }]] });
    armed(s, bot, tArm, (t) => K(t, tArm + 0.5, tArm + 0.9) * (1 - K(t, S('ag03') + 2.5, S('ag03') + 3.0)));
    const rr = rand(41); ['말', '설명', '대답', '조언', '글', '말'].forEach((w, i) => s.add(B(w, i % 2 ? 'white' : 'ice', { size: 0.5 + rr() * 0.2, d: 0.45 }), [-0.4 + rr() * 5.4, 1.0 + rr() * 4.0, rr() * 1.2], { at: A('ag01', '분명한', -0.6) + i * 0.4, bob: 0.08, out: tArm - 0.2 + i * 0.05, snd: i % 2 ? null : 'tick' }));
    s.add(B('AI 에이전트', 'coral', { size: 1.15, d: 0.9, text: WH, padX: 0.8, padY: 0.4 }), [2.8, 3.4, 0.2], { at: tArm, r: [0, -0.2, 0.02], bob: 0.06, snd: 'hit' });
    s.cam(tArm + 0.6, { a: -0.06, d: 15 });
    item('<span class="hd h2">말은 잘하지만, 할 수 있는 건 <span class="chip">말뿐</span></span>', 'c', 770, A('ag01', '분명한', 0.4), A('ag02', '이 한계를', 0.2), { snd: 'buzz' });
    item('<span class="kick">오늘의 두 번째 말</span>', 'c', 130, A('ag02', '오늘의', -0.3));
    item('<span class="hd h2">agent = <span class="chip mint">대리인</span> · 대신해서 일해 주는 사람</span>', 'c', 770, S('ag03') + 0.3, undefined, { snd: 'pop' });
  });

  // talks about it vs. does it
  set(S('ag04'), { bg: '#dff6f0', cam: { d: 18, a: -0.14, el: 0.2, tx: 0, ty: 2.4 } }, (s) => {
    s.add(B('다음 주 부산 출장 기차표 좀 알아봐 줘', 'sky', { size: 0.5, d: 0.5, text: WH }), [0, 5.6, 0], { at: A('ag04', '다음 주', -0.3), bob: 0.05, snd: 'tick' });
    // left: the LLM that only talks
    const b1 = C.bot(); s.add(b1, [-6.1, 1.5, 0.6], { s: 1.25, r: [0, 0.5, 0], at: S('ag04') + 0.2, bob: 0.05 }); s.live((t) => b1.userData.live(t, 0, 0));
    const ans = C.panel(3.6, 2.5, 'white', (x, w, h) => { x.fillStyle = '#fffdf8'; x.fillRect(0, 0, w, h); x.fillStyle = '#25324f'; x.font = "900 76px 'Pretendard', sans-serif"; x.textBaseline = 'middle'; x.fillText('이렇게 알아보세요', 60, 100); x.font = "800 68px 'Pretendard', sans-serif"; ['① 예매 사이트에 접속', '② 날짜와 출발역 선택', '③ 시간표 확인'].forEach((l, i) => x.fillText(l, 60, 250 + i * 150)); }, { d: 0.3, rim: 0.3, r: 0.3 });
    s.add(ans, [-3.0, 2.9, 0.3], { at: A('ag04', '표를 알아보는 방법', -0.3), r: [-0.04, 0.2, 0], bob: 0.05 });
    // right: the agent
    const b2 = C.bot({ arms: true, accent: 'mint' }), tR = S('ag05') + 0.2; s.add(b2, [1.3, 1.5, 0.6], { s: 1.25, r: [0, 0.3, 0], at: tR, bob: 0.05 }); armed(s, b2, tR + 0.2);
    [[C.magnifier(), [3.7, 4.2, 0], '열차', 1.3], [C.calendar(), [5.6, 3.3, 0.2], '일정표', 1.0], [B('화 09:00 표', 'sun', { size: 0.46, d: 0.4 }), [4.1, 2.2, 0.6], '맞는 표', 1]].forEach(([o, p, ph, sc], i) => { const t = A('ag05', ph, -0.2);
      s.add(o, p, { at: t, s: sc, bob: 0.07, r: [0, -0.2, 0], snd: 'ok' }); s.add(C.check('mint'), [p[0] + 1.3, p[1] + 0.25, p[2] + 0.3], { at: t + 0.45, s: 1.1, snd: null }); });
    s.add(B('이 표로 예매할까요?', 'white', { size: 0.5, d: 0.45 }), [4.6, 1.0, 1.4], { at: A('ag05', '이 표로', -0.3), r: [0, -0.15, 0] });
    s.cam(S('ag05') + 0.7, { a: 0.14 });
    item('<span class="hd h2">대화만 하는 LLM · <span class="dim">알아보는 건</span> <span class="chip">내 몫</span></span>', 'c', 790, A('ag04', '실제로', -0.2), S('ag05') - 0.1, { snd: 'buzz' });
    item('<span class="hd h2">AI 에이전트 · <span class="chip mint">직접 알아보고</span> 묻는다</span>', 'c', 790, S('ag05') + 0.5);
  });

  // ① tools, and the helper program
  set(S('ag06'), { bg: '#d9f4ee', cam: { d: 17, a: 0.2, el: 0.22, tx: 0, ty: 2.6 } }, (s) => {
    const bot = C.bot({ arms: true }); s.add(bot, [-5.0, 1.5, 0.3], { s: 1.35, r: [0, 0.45, 0], at: S('ag06') + 0.15, bob: 0.05 }); armed(s, bot, S('ag06') + 0.3);
    const TX = [1.3, 3.0, 4.7, 6.3];
    [[C.magnifier(), '검색', '검색'], [C.calculator(), '계산', '계산'], [C.folder(), '파일', '파일'], [C.calendar(), '일정표', '불러 쓸']].forEach(([o, n, ph], i) => { const t = A('ag06', ph, -0.2);
      s.add(o, [TX[i], 3.0, 0], { at: t, s: 1.15, bob: 0.08, r: [0, -0.15, 0] }); s.add(B(n, 'white', { size: 0.38, d: 0.36 }), [TX[i], 1.55, 0.3], { at: t + 0.1, snd: null }); });
    const gr = C.gear('sun', 0.7), tG = A('ag07', '곁에서', -0.3); s.add(gr, [-1.6, 2.9, 0.2], { at: tG, snd: 'hit' }); s.live((t) => { gr.rotation.z = t * 0.9; });
    s.add(B('심부름 프로그램', 'white', { size: 0.38, d: 0.36 }), [-1.6, 1.5, 0.4], { at: tG + 0.2, snd: null });
    const t0 = A('ag07b', '검색 도구로', -0.2), t1 = A('ag08', '알아보고', -0.1), t2 = A('ag08', '실제로', 0.4), t3 = A('ag08', '결과를', 0.2), t4 = E('ag08') - 0.6;
    s.add(B('검색("부산행 열차 시간")', 'sun', { size: 0.36, d: 0.3 }), [-4.4, 4.6, 0.6], { at: t0, bob: 0.04, out: t2 + 0.4, kf: [[t1 - 0.9, { p: [-4.4, 4.6, 0.6] }], [t1, { p: [-1.6, 4.4, 0.6] }], [t2 - 0.5, { p: [-1.6, 4.4, 0.6] }], [t2, { p: [1.3, 4.4, 0.4], s: 0.6 }]], snd: 'tick' }); fx('ok', t2);
    s.add(B('결과: 화 09:00 · 11:30 · 14:00', 'mint', { size: 0.36, d: 0.3, text: WH }), [1.3, 4.6, 0.5], { at: t3 - 0.1, bob: 0.04, kf: [[t3 + 0.3, { p: [1.3, 4.6, 0.5] }], [t4, { p: [-4.6, 4.5, 0.7] }]] }); fx('ok', t4);
    s.cam(S('ag07') + 0.6, { a: -0.1, d: 17.5 }); s.cam(S('ag08') + 0.5, { a: 0.1 });
    item('<span class="hd h2">LLM에 더하는 세 가지 · <span class="chip mint">① 도구</span></span>', 'c', 130, S('ag06') + 0.2, S('ag07') - 0.1);
    item('<span class="hd h2">LLM은 <span class="chip sun">글만</span> 만들 수 있다</span>', 'c', 130, S('ag07') + 0.2, S('ag07b') - 0.1);
    item('<span class="hd h2">도구가 필요하면 → <span class="chip sun">정해진 형식의 글</span></span>', 'c', 130, S('ag07b') + 0.2, S('ag08') - 0.1);
    item('<span class="hd h2">대신 실행하고, <span class="chip mint">결과를 글로</span> 돌려준다</span>', 'c', 130, S('ag08') + 0.2);
  });

  // ② loop ③ memory
  set(S('ag09'), { bg: '#dff6f0', cam: { d: 17, a: -0.2, el: 0.42, tx: 0, ty: 1.9 } }, (s) => {
    const R = 3.0, cx = -2.6, ring = C.torus(R, 0.12, 'gray'); s.add(ring, [cx, 0.14, 0.4], { r: [-Math.PI / 2, 0, 0], at: S('ag09') + 0.2, drop: 0, snd: null });
    const P = [90, 210, 330].map((d) => [cx + R * Math.cos(d * Math.PI / 180), 0.4 - R * Math.sin(d * Math.PI / 180) + 0.0]);
    [['생각', 'sun', '#25324f', '생각하고'], ['도구 쓰기', 'mint', WH, '도구를 쓰고'], ['결과 살피기', 'sky', WH, '결과를']].forEach(([n, c, tc, ph], i) => s.add(C.coin(n, c, 1.05, { text: tc, size: 0.36, d: 0.4 }), [P[i][0], 1.15, P[i][1]], { at: A('ag09', ph, -0.2), r: [-0.5, 0, 0], bob: 0.05 }));
    const bot = C.bot({ arms: true }), tA = A('ag09', '생각하고', 0.2), tB = S('ag11') - 0.4; s.add(bot, [cx, 0.9, 0.4], { s: 0.78, at: tA, snd: null }); armed(s, bot, tA);
    s.live((t) => { const a = (90 - 360 * 4.5 * K(t, tA, tB)) * Math.PI / 180; bot.position.x = cx + R * Math.cos(a); bot.position.z = 0.4 - R * Math.sin(a); bot.rotation.y = -a + Math.PI; });
    const nb = C.panel(3.2, 3.6, 'sky', (x, w, h, n) => { x.fillStyle = '#fffdf8'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9d6e6'; for (let i = 0; i < 7; i++) x.fillRect(50, 260 + i * 130, w - 100, 6); x.fillStyle = '#b3541e'; x.font = `900 96px 'Pretendard', sans-serif`; x.textBaseline = 'middle'; x.fillText('수첩', 60, 110); x.fillStyle = '#25324f'; x.font = `800 72px 'Pretendard', sans-serif`; ['· 부산행 열차 시간 검색함', '· 화 09:00 / 11:30 / 14:00', '· 일정표: 화 오후에 회의', '→ 09:00 표가 맞음'].slice(0, n).forEach((l, i) => x.fillText(l, 60, 320 + i * 130)); }, { d: 0.3, rim: 0.3, r: 0.24, state: 0 });
    const tN = S('ag10') - 0.5, tL = A('ag10', '무엇을 했고', -0.2); s.add(nb, [4.4, 2.3, 0.3], { at: tN, r: [-0.35, -0.3, 0.03], snd: 'knock' }); s.live((t) => nb.userData.state(t < tL ? 0 : Math.min(4, 1 + Math.floor((t - tL) / 0.9)))); for (let i = 0; i < 4; i++) fx('tick', tL + i * 0.9);
    s.cam(S('ag10') + 0.5, { a: 0.12, tx: 1.2, el: 0.36 });
    item('<span class="hd h2"><span class="chip mint">② 반복</span> · 한 번 답하고 끝이 아니다</span>', 'c', 130, S('ag09') + 0.2, S('ag10') - 0.1);
    item('<span class="hd h3">목표를 이룰 때까지 <span class="chip sun">고리를 계속 돈다</span></span>', 'c', 780, A('ag09', '목표를', -0.2), S('ag10') - 0.1, { snd: 'tick' });
    item('<span class="hd h2"><span class="chip mint">③ 기억</span> · 적어 두고 다시 읽는다</span>', 'c', 130, S('ag10') + 0.2);
  });

  // the whole agent
  set(S('ag11'), { bg: '#d9f4ee', cam: { d: 16.5, a: 0.22, el: 0.24, tx: 0, ty: 2.5 } }, (s) => {
    const bot = C.bot({ arms: true }), t0 = S('ag11') + 0.2; s.add(bot, [0, 1.9, 0], { s: 1.7, at: t0, bob: 0.06 }); armed(s, bot, t0, (t) => K(t, A('ag11', '스스로', 0), A('ag11', '스스로', 0.4)));
    const tH = A('ag11', '손발과', -0.3), tN = A('ag11', '수첩을', -0.3), tL = A('ag11', '일이 끝날', -0.3);
    s.add(C.magnifier(), [-4.4, 3.7, 0.2], { at: tH, s: 1.3, bob: 0.08 }); s.add(C.folder(), [-5.0, 1.5, 0.8], { at: tH + 0.15, s: 1.2, bob: 0.08, r: [0, 0.3, 0] });
    s.add(C.notebook(), [4.6, 2.9, 0.2], { at: tN, s: 1.2, bob: 0.07, r: [0, -0.3, 0.05] });
    const ring = C.torus(3.3, 0.1, 'sun'); s.add(ring, [0, 0.12, 0], { at: tL, r: [-Math.PI / 2, 0, 0], drop: 0 }); const dot = C.ball(0.26, 'coral'); s.add(dot, [3.3, 0.3, 0], { at: tL + 0.2, snd: null }); s.live((t) => { const a = t * 1.6; dot.position.x = 3.3 * Math.cos(a); dot.position.z = 3.3 * Math.sin(a); });
    s.cam(tL + 0.5, { a: -0.12, el: 0.3, d: 17.5 });
    item('<span class="kick">정리</span>', 'c', 130, S('ag11') + 0.2);
    item('<span class="hd h2">두뇌 + <span class="chip mint">손발</span> + <span class="chip sky">수첩</span> + <span class="chip sun">반복</span> = <span class="chip">AI 에이전트</span></span>', 'c', 780, tH - 0.1, undefined, { snd: 'pop' });
  });

  // ================= 에이전트는 어떻게 발전했을까? =================
  railOn.push([S('ah02') - 0.3, S('ed01') - 0.3]);
  set(S('ah01'), { bg: '#ffe6ef', cam: { d: 16.5, a: -0.22, el: 0.2, tx: 0, ty: 2.5 } }, (s) => {
    item('<span class="hd h1">챗GPT 이후,<br>불과 <span class="chip">몇 해</span> 사이</span>', 150, 280, S('ah01') + 0.3, S('ah02') - 0.1, { anim: 'left' });
    const b0 = C.bot({ arms: true }); s.add(b0, [3.9, 1.7, 0.3], { s: 1.5, r: [0, -0.4, 0], at: S('ah01') + 0.2, bob: 0.06, out: S('ah02') - 0.05 }); armed(s, b0, S('ah01') + 0.3, (t) => K(t, S('ah01') + 1.0, S('ah01') + 1.4));
    year(s, 2023, [-4.3, 4.9, 0], S('ah02') + 0.1); yearAt(S('ah02') + 0.4, 2023);
    const bot = C.bot({ arms: true }); s.add(bot, [-3.9, 1.5, 0.4], { s: 1.35, r: [0, 0.45, 0], at: S('ah02') + 0.3, bob: 0.05 }); armed(s, bot, S('ah02') + 0.4);
    s.add(B(['바깥 프로그램의', '기능'], 'sky', { size: 0.52, d: 0.7, text: WH }), [3.9, 2.0, 0.2], { at: A('ah02', '바깥', -0.3), r: [0, -0.3, 0], bob: 0.05 });
    s.add(C.tube([[-2.4, 1.6, 0.6], [-0.8, 2.6, 0.8], [0.8, 2.4, 0.6], [2.2, 2.0, 0.4]], 0.12, 'sun'), [0, 0, 0], { at: A('ah02', '불러 쓸', -0.3), drop: 0, snd: 'ok' });
    s.cam(A('ah02', '도구 연결', -0.2), { a: 0.1, d: 15.5 });
    item('<span class="hd h2">오픈AI · <span class="chip sun">도구 연결</span>의 시작</span>', 'c', 780, A('ah02', '도구 연결', -0.3), undefined, { snd: 'tick' });
  });

  // 2024: using a screen, one standard for tools
  set(S('ah04'), { bg: '#ffe1ec', cam: { d: 16.5, a: 0.2, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    year(s, 2024, [-4.4, 4.9, 0], S('ah04') + 0.2); yearAt(S('ah04') + 0.5, 2024);
    const t0 = A('ah04', '마우스와', -0.6), t1 = A('ah04', '직접 다루는', 0.2);
    const mon = C.panel(4.6, 2.9, 'navy', (x, w, h, st) => { x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#d9d4c8'; x.fillRect(0, 0, w, 110); x.fillStyle = '#c9c4b8'; x.fillRect(60, 190, 560, 44); x.fillRect(60, 270, 720, 44);
      x.fillStyle = st.c ? '#1f8f5f' : '#2f6fed'; x.beginPath(); x.roundRect(600, 410, 340, 150, 40); x.fill(); x.fillStyle = '#fff'; x.font = `900 74px 'Pretendard', sans-serif`; x.textBaseline = 'middle'; x.fillText(st.c ? '완료!' : '예매하기', st.c ? 690 : 640, 488);
      const cx = lerp(160, 760, st.k), cy = lerp(200, 500, st.k); x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 8; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy + 90); x.lineTo(cx + 26, cy + 68); x.lineTo(cx + 46, cy + 108); x.lineTo(cx + 66, cy + 98); x.lineTo(cx + 46, cy + 60); x.lineTo(cx + 78, cy + 60); x.closePath(); x.fill(); x.stroke(); }, { d: 0.34, rim: 0.34, r: 0.3, state: { k: 0, c: 0 } });
    s.add(mon, [0.6, 2.5, 0], { at: S('ah04') + 0.4, r: [-0.04, -0.2, 0], out: S('ah05') - 0.1 }); s.live((t) => mon.userData.state({ k: Math.round(io(K(t, t0, t1)) * 24) / 24, c: t >= t1 + 0.2 ? 1 : 0 })); fx('tick', t1 + 0.2);
    const bot = C.bot({ arms: true, tag: 'Claude' }); s.add(bot, [-4.2, 1.4, 0.8], { s: 1.25, r: [0, 0.6, 0], at: S('ah04') + 0.3, bob: 0.05, out: S('ah05') - 0.1 }); armed(s, bot, S('ah04') + 0.4);
    item('<span class="hd h2">화면을 보면서 <span class="chip">마우스 · 키보드</span>를 직접</span>', 'c', 780, A('ah04', '화면을', -0.2), S('ah05') - 0.1, { snd: 'tick' });
    // ah05: one tool, many AIs
    const tool = C.magnifier(), tM = S('ah05') + 0.5; s.add(tool, [-4.6, 2.0, 0.4], { at: tM, s: 1.4, bob: 0.07 });
    s.add(B('MCP', 'coral', { size: 1.1, d: 0.9, text: WH, padX: 0.7, padY: 0.36 }), [-0.9, 2.1, 0.2], { at: tM + 0.3, bob: 0.05, snd: 'hit' });
    [[4.6, 4.3, 'A', 'sun'], [5.6, 2.3, 'B', 'mint'], [4.6, 0.9, 'C', 'sky']].forEach(([x, y, n, c], i) => { const t = A('ah05', '여러 AI', -0.3) + i * 0.15, b = C.bot({ tag: 'AI ' + n, accent: c }); s.add(b, [x, y, 0.3], { at: t, s: 0.72, r: [0, -0.5, 0], bob: 0.05 }); s.live((tt) => b.userData.live(tt, 0, 0));
      s.add(C.tube([[0.5, 2.1, 0.3], [2.2, (2.1 + y) / 2 + 0.2, 0.3], [x - 1.0, y, 0.3]], 0.07, 'gray', false), [0, 0, 0], { at: t - 0.1, drop: 0, snd: null }); });
    s.add(C.tube([[-3.6, 2.0, 0.4], [-2.2, 2.1, 0.4]], 0.07, 'gray', false), [0, 0, 0], { at: tM + 0.5, drop: 0, snd: null });
    s.cam(S('ah05') + 0.6, { a: -0.12, d: 17 });
    item('<span class="hd h2">도구를 연결하는 <span class="chip">공통 규격</span></span>', 690, 130, S('ah05') + 0.2);
    item('<span class="hd h3">도구를 한 번 만들면 → <span class="chip mint">여러 AI에 연결</span></span>', 'c', 780, A('ah05', '도구를 한 번', -0.2));
    item('<span class="note" style="font-size:30px">MCP = Model Context Protocol · 앤트로픽 · 2024년 11월</span>', 110, 250, tM + 0.8, undefined, { style: 'top:858px;left:60px' });
  });

  // 2025: products
  set(S('ah06'), { bg: '#ffe6ef', cam: { d: 16.5, a: -0.2, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    year(s, 2025, [-4.5, 4.9, 0], S('ah06') + 0.2); yearAt(S('ah06') + 0.5, 2025);
    const LN = ['● 파일 읽기 · login.js', '● 코드 고치기', '● 프로그램 실행 · 테스트', '● 테스트 통과!'], tt = [A('ah06', '파일을', -0.2), A('ah06', '고치고', -0.3), A('ah06', '프로그램을', -0.2), A('ah06', '코드를 짜', -0.2)], tTy = A('ah06', '클로드 코드', 0.1);
    const term = C.panel(5.2, 3.0, 'navy', (x, w, h, st) => { x.fillStyle = '#10151c'; x.fillRect(0, 0, w, h); x.fillStyle = '#080b10'; x.fillRect(0, 0, w, 90); x.fillStyle = '#8b97a8'; x.font = `700 44px 'Pretendard', sans-serif`; x.textBaseline = 'middle'; x.fillText('Claude Code — 개발자의 컴퓨터', 40, 46);
      x.font = `800 54px 'Pretendard', sans-serif`; x.fillStyle = '#ffc24d'; x.fillText('> ' + '로그인이 안 되는 문제 고쳐 줘'.slice(0, st.n), 40, 160); LN.slice(0, st.l).forEach((l, i) => { x.fillStyle = i === 3 ? '#5fe08a' : '#c9d2e0'; x.fillText(l, 40, 250 + i * 86); }); }, { d: 0.34, rim: 0.34, r: 0.3, state: { n: 0, l: 0 } });
    s.add(term, [1.2, 2.5, 0], { at: A('ah06', '클로드 코드', -0.4), r: [-0.04, -0.2, 0], out: S('ah07') - 0.1 });
    s.live((t) => { let l = 0; for (const u of tt) if (t >= u) l++; term.userData.state({ n: Math.round(16 * K(t, tTy, tTy + 1.6)), l }); }); tt.forEach((u, i) => fx(i === 3 ? 'ok' : 'tick', u)); for (let i = 0; i < 4; i++) fx('tick', tTy + i * 0.4);
    const bot = C.bot({ arms: true, tag: 'Claude' }); s.add(bot, [-4.4, 1.4, 0.8], { s: 1.25, r: [0, 0.6, 0], at: S('ah06') + 0.3, bob: 0.05, out: S('ah07') - 0.1 }); armed(s, bot, S('ah06') + 0.4);
    item('<span class="hd h2">에이전트가 <span class="chip">본격적인 제품</span>으로</span>', 690, 130, S('ah06') + 0.4);
    item('<span class="hd h3">앤트로픽 <span class="chip sun">클로드 코드</span> · 파일을 고치고, 실행하고, 코드를 짠다</span>', 'c', 780, A('ah06', '앤트로픽의', -0.2), S('ah07') - 0.1);
    // ah07: a browser on OpenAI's side
    const PG = [['열차 시간표', '#7fb3d9'], ['숙소 예약', '#e2a35b'], ['일정 정리', '#8fcf9d']], tP = A('ah07', '웹사이트를', -0.3);
    const br = C.panel(5.2, 3.0, 'white', (x, w, h, n) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, PG[n][1]); g.addColorStop(0.7, '#f4f1ea'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#d9d4c8'; x.fillRect(0, 0, w, 100); x.fillStyle = '#fff'; x.beginPath(); x.roundRect(120, 22, w - 160, 56, 28); x.fill();
      x.fillStyle = '#25324f'; x.font = `900 84px 'Pretendard', sans-serif`; x.textBaseline = 'middle'; x.fillText(PG[n][0], 60, 200); x.fillStyle = 'rgba(37,50,79,0.2)'; x.fillRect(60, 290, w * 0.6, 34); x.fillRect(60, 360, w * 0.8, 34); x.fillRect(60, 430, w * 0.5, 34); }, { d: 0.34, rim: 0.34, r: 0.3, state: 0 });
    s.add(br, [1.2, 2.5, 0], { at: S('ah07') + 0.2, r: [-0.04, -0.2, 0] }); s.live((t) => br.userData.state(clamp(Math.floor((t - tP) / 1.3), 0, 2))); for (let i = 0; i < 3; i++) fx('tick', tP + i * 1.3);
    const b2 = C.bot({ arms: true, tag: 'GPT', accent: 'mint' }); s.add(b2, [-4.4, 1.4, 0.8], { s: 1.25, r: [0, 0.6, 0], at: S('ah07') + 0.3, bob: 0.05 }); armed(s, b2, S('ah07') + 0.4);
    s.cam(S('ah07') + 0.5, { a: 0.14 });
    item('<span class="hd h3">오픈AI <span class="chip sun">챗GPT 에이전트</span> · 오픈AI 쪽 컴퓨터에서 웹사이트를 다니며</span>', 'c', 780, S('ah07') + 0.4);
  });

  // 2026: now
  set(S('ah08'), { bg: '#ffe1ec', cam: { d: 16, a: 0.22, el: 0.2, tx: 0, ty: 2.5 } }, (s) => {
    year(s, 2026, [-4.4, 4.9, 0], S('ah08') + 0.2); yearAt(S('ah08') + 0.5, 2026);
    const ck = C.clock(), t0 = S('ah08') + 0.6, t1 = E('ah08'); s.add(ck, [3.2, 2.5, 0], { at: S('ah08') + 0.4, s: 1.7, r: [0, -0.25, 0], bob: 0.05, out: S('ah09') - 0.1 });
    s.live((t) => { const k = K(t, t0, t1) * TAU * 4; ck.userData.mh.rotation.z = -k; ck.userData.hh.rotation.z = -k / 12; }); for (let i = 0; i < 4; i++) fx('tick', t0 + 0.4 + i * 1.1);
    const bot = C.bot({ arms: true }); s.add(bot, [-3.3, 1.5, 0.5], { s: 1.35, r: [0, 0.5, 0], at: S('ah08') + 0.3, bob: 0.05 }); armed(s, bot, S('ah08') + 0.4, (t) => K(t, S('ah09') + 0.3, S('ah09') + 0.7));
    [['자료 조사', '자료 조사'], ['대본', '대본과'], ['화면', '화면까지']].forEach(([n, ph], i) => { const t = A('ah09', ph, -0.2);
      s.add(C.sheet(1.9, 2.4, n, 4), [0.9 + i * 2.3, 2.3, 0.2 + i * 0.2], { at: t, r: [-0.08, -0.2, (i - 1) * 0.05], bob: 0.05, snd: 'ok' }); s.add(C.check('mint'), [1.3 + i * 2.3, 1.5, 0.5 + i * 0.2], { at: t + 0.4, s: 1.4, snd: null }); });
    item('<span class="hd h2">사람이 <span class="chip">몇 시간</span> 들일 일도 맡는다</span>', 'c', 780, A('ah08', '사람이', -0.2), S('ah09') - 0.1);
    item('<span class="hd h2">이 영상도 <span class="chip">AI 에이전트</span>가 만들었다</span>', 'c', 780, S('ah09') + 0.2, undefined, { snd: 'pop' });
  });

  // ================= 그래서 어떻게 써야 할까? =================
  set(S('ed01'), { bg: '#fff1dc', cam: { d: 17, a: -0.2, el: 0.2, tx: 2.6, ty: 2.7 } }, (s) => {
    item('<span class="hd h2">쓸 때 기억할 <span class="chip ink">세 가지</span></span>', 'c', 130, S('ed01') + 0.3);
    [['1', 'sun', '#25324f', '중요한 숫자와 사실은 <span class="chip sun">다시 확인</span>', 'LLM은 그럴듯한 말을 만드는 기계', 'ed02'], ['2', 'mint', WH, '되돌리기 어려운 일은 <span class="chip mint">실행 전에 확인</span>', '돈 쓰기 · 메시지 보내기 · 파일 지우기', 'ed03'], ['3', 'coral', WH, '<span class="chip">구체적으로</span> 시키기', '무엇을 · 왜 · 어떤 결과를 원하는지', 'ed04']].forEach(([n, c, tc, h, d, id], i) => {
      const t = S(id) + 0.2; s.add(B(n, c, { size: 1.1, d: 0.9, text: tc, padX: 0.8, padY: 0.3, minW: 1.7 }), [-2.9, 4.5 - i * 1.75, i * 0.2], { at: t, r: [0, 0.3, 0], bob: 0.05, snd: 'hit' });
      item(`<span class="hd h3">${h}</span>`, 760, 262 + i * 196, t + 0.3, undefined, { anim: 'left' }); item(`<span class="note" style="font-size:36px">${d}</span>`, 764, 352 + i * 196, t + 0.8, undefined, { anim: 'left', plain: true }); });
  });

  set(S('ed05'), { bg: '#ffecd2', cam: { d: 17, a: 0.2, el: 0.2, tx: 0, ty: 2.5 } }, (s) => {
    const l1 = B('LLM', 'sun', { size: 1.3, d: 0.9, padX: 0.8, padY: 0.4 }), l2 = B('AI 에이전트', 'coral', { size: 0.95, d: 0.9, text: WH, padX: 0.7, padY: 0.45 });
    s.add(l1, [-4.4, 3.9, 0], { at: A('ed05', 'LLM은', -0.3), r: [0, 0.25, 0], bob: 0.06, out: S('ed06') - 0.1, snd: 'hit' }); s.add(l2, [-3.6, 1.4, 0.4], { at: A('ed05', 'AI 에이전트는', -0.3), r: [0, 0.25, 0], bob: 0.06, out: S('ed06') - 0.1, snd: 'hit' });
    item('<span class="hd h3">다음 말을 맞히면서<br><span class="chip sun">글을 만드는 프로그램</span></span>', 960, 250, A('ed05', '다음 말을', -0.2), S('ed06') - 0.1, { anim: 'left' });
    item('<span class="hd h3">그 LLM에 <span class="chip mint">도구 · 반복 · 기억</span>을 더해<br>일을 맡길 수 있게 한 것</span>', 960, 530, A('ed05', '도구와', -0.3), S('ed06') - 0.1, { anim: 'left' });
    // ed06: 1950 → 2026
    const t6 = S('ed06') + 0.2; s.add(B('1950', 'sun', { size: 1.3, d: 0.9, padX: 0.7, padY: 0.36 }), [-4.4, 2.6, 0], { at: t6, r: [0, 0.2, 0], bob: 0.06, snd: 'hit' });
    s.add(C.tube([[-2.3, 2.7, 0.2], [-0.9, 3.3, 0.2], [0.4, 2.9, 0.2]], 0.13, 'navy'), [0, 0, 0], { at: t6 + 0.3, drop: 0, snd: null });
    s.add(B('2026', 'coral', { size: 1.3, d: 0.9, padX: 0.7, padY: 0.36, text: WH }), [3.0, 2.6, 0], { at: t6 + 0.5, r: [0, -0.2, 0], bob: 0.06, snd: 'hit' });
    const bot = C.bot({ arms: true }); s.add(bot, [5.9, 3.3, -0.6], { s: 1.0, r: [0, -0.5, 0], at: t6 + 0.8, bob: 0.08 }); armed(s, bot, t6 + 0.9, (t) => K(t, t6 + 1.6, t6 + 2.0));
    s.cam(S('ed06') + 0.6, { a: -0.1, d: 16 });
    item('<span class="hd h2">튜링의 질문에서, <span class="chip">누구나 쓰는 일상</span>으로</span>', 'c', 130, A('ed06', '이제', -0.3));
    fx('bell', E('ed06') + 0.7);
    item('<div class="foot" style="margin:0 auto">사진: Wikimedia Commons (화면 왼쪽 아래에 저작자 · 라이선스 표기) · 수치와 연도의 출처는 영상 설명 참조 · 점수와 예시 문장은 설명용<br>로고는 쓰지 않았습니다 · 효과음은 코드로 합성 · 이 영상은 AI 에이전트(Claude Code)로 제작했습니다</div>', 'c', 770, END - 6.5, undefined, { anim: 'fade' });
  });
};
