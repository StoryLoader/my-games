/* b_history.js — the three history chapters in clay, 1950 → 2023 (storyboard.md). Each milestone is a small set:
   a year block, the photograph in a clay frame (Wikimedia Commons — credit shown bottom left, provenance.json),
   and one clay model of the idea. The year rail in the hud follows along. */
window.SEG_history = function (G) {
  const { S, E, A, K, io, out, back, lerp, clamp, C, T, tex, set, item, show, cls, type, fx, count, credit, yearAt, railOn, live, rand, TAU, END } = G;
  const WH = '#fffdf8', CC = 'Wikimedia Commons';
  const B = (t, c, o) => C.block(t, c, o);
  const year = (s, y, p, at, c = 'sun') => s.add(B(String(y), c, { size: 1.1, d: 0.8, padX: 0.6, padY: 0.3, text: c === 'sun' ? '#25324f' : WH }), [Math.max(p[0], -3.7), p[1], p[2]], { at, r: [0, -0.12, 0.03], bob: 0.06, snd: 'hit' });
  const person = (c) => { const g = C.grp(C.ball(0.44, 'sand'), C.pill(0.46, 0.5, c)); g.children[0].position.y = 1.5; g.children[1].position.y = 0.7; return g; };
  railOn.push([S('ha02') + 1.5, S('ag01') - 0.3]);

  // ================= 생각하는 기계는 언제부터 꿈꿨을까? =================
  set(S('ha01'), { bg: '#fff2cf', cam: { d: 15.5, a: 0.3, el: 0.18, tx: -1.2, ty: 2.3 } }, (s) => {
    const bot = C.bot(); s.add(bot, [3.6, 1.6, 0], { s: 1.45, r: [0, -0.4, 0], at: S('ha01') + 0.15, bob: 0.05, out: S('ha02') + 0.3 }); s.live((t) => bot.userData.live(t, 0, 0));
    item('<span class="hd h1">어느 날 갑자기<br>나타난 게 <span class="chip sun">아니다</span></span>', 150, 270, S('ha01') + 0.3, S('ha02') - 0.1, { anim: 'left' });
    // ha02: the year counts back
    const FONT = C.FONT, pn = C.panel(5.6, 2.3, 'sun', (x, w, h, y) => { x.fillStyle = '#ffc845'; x.fillRect(0, 0, w, h); x.fillStyle = '#25324f'; x.font = "900 328px 'Pretendard', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(y), w / 2, h * 0.54); }, { d: 0.9, rim: 0.5, r: 0.4, state: 2026 });
    const t0 = S('ha02') + 0.8, t1 = A('ha02', '돌아가서', 0.6);
    s.add(pn, [0, 2.9, 0], { at: S('ha02') + 0.2, bob: 0.06, snd: 'hit' }); s.live((t) => pn.userData.state(Math.round(lerp(2026, 1950, io(K(t, t0, t1))))));
    for (let i = 0; i < 7; i++) fx('tick', t0 + 0.1 + i * 0.3);
    s.cam(S('ha02') + 0.6, { a: 0.5, tx: 0, d: 14 }); s.cam(t1 + 0.4, { a: -0.35, d: 15 });
    item('<span class="hd h2"><span class="chip sun">70여 년</span> 전으로</span>', 'c', 760, S('ha02') + 0.5);
    yearAt(S('ha02'), 2026); yearAt(t1, 1950);
  });

  // 1950 Turing
  set(S('ha03'), { bg: '#fff0c4', cam: { d: 16.5, a: -0.2, el: 0.18, tx: 0, ty: 2.6 } }, (s) => {
    s.add(C.photo(tex.turing, 2.7, 3.4), [-4.6, 2.2, 0], { r: [-0.06, 0.34, 0], at: S('ha03') + 0.15, snd: 'knock' });
    credit(`앨런 튜링 (1951년 촬영) · 사진: Elliott &amp; Fry · 퍼블릭 도메인 · ${CC}`, S('ha03') + 0.6);
    year(s, 1950, [-0.6, 5.0, 0], S('ha03') + 0.3); yearAt(S('ha03') + 0.6, 1950);
    s.add(B(['기계가 생각할 수', '있을까?'], 'white', { size: 0.66, d: 0.6 }), [2.4, 2.4, 0.4], { at: A('ha03', '기계가', -0.3), r: [0, -0.2, 0], bob: 0.06, out: S('ha04') - 0.1 });
    s.add(C.qmark('coral'), [5.3, 4.4, 0.2], { at: A('ha03', '기계가', 0.2), s: 1.2, bob: 0.1, sway: 0.1, out: S('ha04') - 0.1, snd: null });
    // the test: a questioner, a screen, and behind it a person and a machine
    const tT = S('ha04') + 0.2;
    s.add(person('sky'), [-0.9, 0, 1.4], { at: tT, r: [0, 0.6, 0], drop: 0.5 });
    s.add(C.rbox(0.36, 3.0, 3.2, 'lilac', 0.16), [1.5, 1.5, 0.8], { at: tT + 0.2, drop: 1.4, snd: 'knock' });
    s.add(person('mint'), [3.6, 0, 0.2], { at: tT + 0.45, r: [0, -0.5, 0], drop: 0.5 });
    const b2 = C.bot(); s.add(b2, [5.4, 0.86, 1.4], { at: tT + 0.6, s: 0.78, r: [0, -0.7, 0] }); s.live((t) => b2.userData.live(t, 0, 0));
    s.add(B('글로만 대화', 'white', { size: 0.4, d: 0.36 }), [0.4, 3.6, 1.2], { at: A('ha04', '글로만', -0.2), bob: 0.06, snd: 'tick' });
    s.add(C.qmark('sun'), [3.6, 2.9, 0.2], { at: A('ha04', '사람인지', -0.2), s: 0.8, bob: 0.1 }); s.add(C.qmark('sun'), [5.4, 2.7, 1.4], { at: A('ha04', '기계인지', -0.2), s: 0.8, bob: 0.1 });
    s.cam(S('ha04') + 0.7, { a: 0.14, tx: 1.4, ty: 2.2, d: 15.5 });
    item('<span class="hd h2">구별할 수 없다면 → <span class="chip sun">생각한다고 보자</span></span>', 'c', 770, A('ha04', '구별할', -0.2), S('ha05') - 0.05);
    item('<span class="hd h1">= <span class="chip">튜링 테스트</span></span>', 'c', 750, S('ha05') + 0.05, undefined, { anim: 'pop', snd: 'hit' });
  });

  // 1956 Dartmouth
  set(S('ha06'), { bg: '#ffecca', cam: { d: 16.5, a: 0.2, el: 0.18, tx: 0, ty: 2.6 } }, (s) => {
    s.add(C.photo(tex.dartmouth, 4.0, 2.67), [-3.8, 2.3, 0], { r: [-0.06, 0.3, 0], at: S('ha06') + 0.15, snd: 'knock' });
    credit(`다트머스 대학 (미국 뉴햄프셔주) · 사진: Daderot · CC0 · ${CC}`, S('ha06') + 0.6);
    year(s, 1956, [-3.6, 5.0, 0.2], S('ha06') + 0.3); yearAt(S('ha06') + 0.6, 1956);
    s.add(B('Artificial Intelligence', 'white', { size: 0.5, d: 0.5 }), [2.9, 4.4, 0], { at: A('ha06', '처음 쓴', -0.3), r: [0, -0.18, 0], bob: 0.05, snd: 'tick' });
    s.add(B('인공지능', 'sun', { size: 0.95, d: 0.7 }), [2.2, 2.75, 0.3], { at: A('ha06', '인공지능', -0.2), r: [0, -0.18, 0], bob: 0.05 });
    s.add(B('AI', 'coral', { size: 1.5, d: 0.9, text: WH, padX: 0.8, padY: 0.4 }), [4.6, 1.15, 0.9], { at: A('ha06', '줄여서', 0.2), r: [0, -0.3, 0.04], snd: 'hit' });
    s.cam(A('ha06', '인공지능', 0.3), { a: -0.1, tx: 1.2, d: 15 });
  });

  // 1958 perceptron
  set(S('ha07'), { bg: '#fff0c4', cam: { d: 16.5, a: -0.22, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    s.add(C.photo(tex.perceptron, 3.7, 2.9), [-4.2, 2.0, 0], { r: [-0.06, 0.34, 0], at: S('ha07') + 0.15, snd: 'knock' });
    credit(`글자를 알아보는 실험 기계, 퍼셉트론 · 사진: 미 해군 국립박물관 · 퍼블릭 도메인 · ${CC}`, S('ha07') + 0.6);
    year(s, 1958, [-4.4, 4.95, -0.4], A('ha07', '1958', -0.2)); yearAt(A('ha07', '1958', 0.2), 1958);
    s.add(B('퍼셉트론', 'coral', { size: 0.9, d: 0.7, text: WH }), [3.0, 4.7, 0], { at: A('ha07', '퍼셉트론', -0.3), r: [0, -0.2, 0], bob: 0.06, snd: 'hit' });
    // one clay neuron: three inputs, a dial on each wire, a body, an answer
    const g = C.grp(), IN = [[-2.2, 1.1], [-2.2, 0], [-2.2, -1.1]]; IN.forEach(([x, y], i) => { g.add(C.rod([x, y, 0], [0, 0, 0], 0.07, 'gray')); const b = C.ball(0.34, 'sky'); b.position.set(x, y, 0); g.add(b); const d = C.dial(['sun', 'mint', 'lilac'][i]); d.position.set(x * 0.5, y * 0.5, 0.12); d.scale.setScalar(0.72); g.add(d); g.userData['d' + i] = d; });
    g.add(C.rod([0, 0, 0], [2.0, 0, 0], 0.07, 'gray')); const body = C.ball(0.72, 'sun'); g.add(body); const ans = C.ball(0.36, 'mint'); ans.position.set(2.1, 0, 0); g.add(ans);
    s.add(g, [2.7, 2.2, 0.6], { at: S('ha08') + 0.2, r: [0, -0.25, 0], bob: 0.05 });
    const nud = [A('ha08', '스스로', 0.1), A('ha08', '고쳐', 0.2), A('ha08', '다이얼을', 0.1)]; nud.forEach((t) => fx('dial', t));
    s.live((t) => { let n = 0; for (const u of nud) n += io(K(t, u, u + 0.5)); for (let i = 0; i < 3; i++) g.userData['d' + i].rotation.z = 0.6 * (i - 1) + n * (0.7 + i * 0.3); });
    s.cam(S('ha08') + 0.7, { a: 0.1, tx: 0.8, d: 15.5 });
    item('<span class="hd h2"><span class="chip sun">뇌세포</span>를 흉내 낸 기계</span>', 'c', 770, A('ha07', '뇌세포', -0.2), S('ha08') - 0.1);
    item('<span class="hd h2">정답을 보고 <span class="chip sun">스스로 고친다</span></span>', 'c', 770, A('ha08', '스스로', -0.4), S('ha09') - 0.05);
    item('<span class="hd h1">= <span class="chip">인공 신경망</span></span>', 'c', 750, S('ha09') + 0.1, undefined, { anim: 'pop', snd: 'hit' });
  });

  // 1966 ELIZA
  set(S('ha10'), { bg: '#ffeed2', cam: { d: 17, a: 0.2, el: 0.18, tx: 0, ty: 2.7 } }, (s) => {
    s.add(C.photo(tex.eliza, 3.9, 2.53), [-4.3, 1.9, 0], { r: [-0.06, 0.3, 0], at: S('ha10') + 0.15, snd: 'knock' });
    s.add(C.photo(tex.weizenbaum, 1.8, 2.5, 'sun'), [-0.9, 1.75, 1.0], { r: [-0.06, 0.12, 0.03], at: S('ha10') + 0.5, snd: 'knock' });
    credit(`엘리자 대화 화면: 퍼블릭 도메인 · 만든 사람 요제프 바이첸바움 (1982년, 사진: RIT · 퍼블릭 도메인) · ${CC}`, S('ha10') + 0.7);
    year(s, 1966, [-4.4, 4.95, -0.4], S('ha10') + 0.3); yearAt(S('ha10') + 0.6, 1966);
    s.add(B('엘리자', 'coral', { size: 0.9, d: 0.7, text: WH }), [3.4, 5.25, 0], { at: A('ha10', '엘리자', -0.2), r: [0, -0.2, 0], bob: 0.06, snd: 'hit' });
    s.add(B('어머니가 저를 힘들게 해요', 'sky', { size: 0.44, d: 0.45, text: WH }), [3.3, 4.05, 0.3], { at: A('ha12', '어머니', -0.3), r: [0, -0.2, 0], bob: 0.05, snd: 'tick' });
    const gr = C.gear('sun', 0.55); s.add(gr, [3.3, 2.95, 0.6], { at: S('ha11') + 0.4 }); s.live((t) => { gr.rotation.z = t * 1.2; });
    s.add(B('가족 이야기를 더 해 주세요', 'white', { size: 0.44, d: 0.45 }), [3.4, 1.85, 0.9], { at: A('ha12', '가족', -0.3), r: [0, -0.2, 0], bob: 0.05 });
    s.cam(S('ha11') + 0.6, { a: -0.08, tx: 0.8, d: 16 });
    item('<span class="hd h2">상담사처럼 대답하는 프로그램</span>', 'c', 770, A('ha10', '상담사', -0.2), S('ha11') - 0.1);
    item('<span class="hd h2">이해한 게 아니라, <span class="chip sun">틀에 끼워 넣기</span></span>', 'c', 770, S('ha11') + 0.2);
  });

  // hopes, money, then the cuts
  set(S('ha13'), { bg: '#ffe7c4', cam: { d: 16, a: -0.24, el: 0.22, tx: 0, ty: 2.5 } }, (s) => {
    const bot = C.bot(); s.add(bot, [-4.9, 1.3, 0.4], { s: 1.2, r: [0, 0.5, 0], at: S('ha13') + 0.2, bob: 0.05 }); s.live((t) => bot.userData.live(t, 0, 0));
    s.add(B(['곧 사람처럼', '생각하는 기계가!'], 'white', { size: 0.5, d: 0.5 }), [-2.6, 3.7, 0.6], { at: A('ha13', '사람처럼', -0.3), r: [0, 0.2, 0.03], bob: 0.06, out: S('ha13b') + 0.5 });
    // government money: a pile of coins that grows, then is taken away
    const tUp = A('ha13', '미국과', -0.2), tDn = A('ha13b', '연구비', -0.4);
    for (let i = 0; i < 16; i++) { const cx = 2.0 + (i % 2) * 2.2, lv = Math.floor(i / 2), p = C.puck(0.95, 0.3, i % 3 ? 'sun' : 'sand');
      s.add(p, [cx + (lv % 2) * 0.12, 0.17 + lv * 0.32, 0.2], { at: tUp + i * 0.13, out: tDn + (15 - i) * 0.14, drop: 2.2, snd: i % 3 ? null : 'tick' }); }
    fx('buzz', tDn); s.cam(S('ha13b') + 0.5, { a: 0.12, tx: 1.2, d: 15 });
    item('<span class="hd h2">기대가 커지고, <span class="chip sun">큰돈</span>이 몰렸다</span>', 'c', 130, S('ha13') + 0.3, S('ha13b') - 0.1);
    item('<span class="note" style="font-size:34px">미국 · 영국 정부의 연구비</span>', 1130, 800, tUp + 0.4, S('ha13b') - 0.1);
    item('<span class="hd h2">느린 컴퓨터 · 부족한 자료 → <span class="chip">연구비 삭감</span></span>', 'c', 130, S('ha13b') + 0.2);
  });

  // the AI winter
  set(S('ha14'), { bg: '#dfe9ff', cam: { d: 16, a: 0.25, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    fx('wind', S('ha14') - 0.3); fx('wind', S('ha14') + 3.4); fx('wind', S('ha14') + 7.0);
    const w = B('AI의 겨울', 'ice', { size: 1.5, d: 1.1, padX: 0.9, padY: 0.5 }); s.add(w, [0, 2.6, 0], { at: S('ha14') + 0.3, r: [0, -0.14, 0], bob: 0.05, snd: 'hit' });
    for (let i = 0; i < 5; i++) { const c = C.ball(0.5 + (i % 2) * 0.16, 'white'); c.scale.y = 0.5; s.add(c, [-2.6 + i * 1.3, 3.72, 0.1], { at: S('ha14') + 0.7 + i * 0.08, drop: 1.6, snd: null }); }
    s.add(B('1970년대', 'white', { size: 0.62, d: 0.5 }), [-4.4, 0.75, 1.3], { at: S('ha14') + 0.5, r: [0, 0.3, 0], snd: 'tick' });
    s.add(B('1980년대 말', 'white', { size: 0.62, d: 0.5 }), [4.3, 0.75, 1.3], { at: S('ha14') + 2.4, r: [0, -0.3, 0], snd: 'tick' });
    // snow
    const rr = rand(23), N = 90, geo = new T.SphereGeometry(0.09, 8, 6), im = new T.InstancedMesh(geo, C.M('white'), N), fl = Array.from({ length: N }, () => ({ x: rr() * 18 - 9, y: rr() * 9, z: rr() * 7 - 3.5, v: 0.6 + rr() * 0.8, p: rr() * 6.28, s: 0.6 + rr() * 1.2 })), m4 = new T.Matrix4();
    s.g.add(im); s.live((t) => { const a = Math.max(0.001, K(t, S('ha14') - 0.2, S('ha14') + 0.8)); fl.forEach((f, i) => { const y = ((f.y - f.v * t) % 9 + 9) % 9; m4.makeScale(f.s * a, f.s * a, f.s * a); m4.setPosition(f.x + Math.sin(f.p + t * 0.7) * 0.4, y, f.z); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; });
    item('<span class="hd h2">두 차례의 <span class="chip sky">침체기</span></span>', 'c', 130, S('ha14') + 0.4);
    yearAt(S('ha14') + 0.8, 1975);
  });

  // ================= 무엇이 AI의 겨울을 끝냈을까? =================
  set(S('hb01'), { bg: '#ffe9dc', cam: { d: 17, a: -0.28, el: 0.2, tx: 0, ty: 2.3 } }, (s) => {
    [['더 나은\n학습 방법', 'mint', WH, '더 나은'], ['훨씬 많은\n자료', 'sky', WH, '훨씬 많은'], ['훨씬 빠른\n컴퓨터', 'sun', '#25324f', '훨씬 빠른']].forEach(([n, c, tc, ph], i) =>
      s.add(C.coin(n, c, 1.7, { text: tc, size: 0.5, d: 0.5 }), [-4.5 + i * 4.5, 2.2, 0], { at: A('hb02', ph, -0.2), r: [0, (1 - i) * 0.2, 0], bob: 0.08, snd: 'hit' }));
    s.cam(S('hb02') + 1.0, { a: 0.0 }); s.cam(E('hb02'), { a: 0.25 });
    item('<span class="hd h1">무엇이 이 겨울을<br><span class="chip">끝냈을까?</span></span>', 'c', 300, S('hb01') + 0.3, S('hb02') - 0.1);
    item('<span class="hd h2">겨울을 끝낸 <span class="chip ink">세 가지</span></span>', 'c', 130, S('hb02') + 0.2);
  });

  // 1986 backprop
  set(S('hb03'), { bg: '#ffe6d8', cam: { d: 16.5, a: 0.22, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    s.add(C.photo(tex.hinton, 2.9, 2.9), [-4.7, 2.1, 0.2], { r: [-0.06, 0.34, 0], at: S('hb03b') - 0.3, snd: 'knock' });
    credit(`제프리 힌턴 · 1986년 논문의 공저자 (2024년 촬영) · 사진: Arthur Petron · CC BY-SA 4.0 · ${CC}`, S('hb03b') + 0.2);
    year(s, 1986, [-4.5, 4.85, 0.3], A('hb03b', '1986', -0.2)); yearAt(A('hb03b', '1986', 0.2), 1986);
    // a network in layers
    const LX = [-2.4, -0.8, 0.8, 2.4], LY = [[0.7, -0.7], [1.3, 0, -1.3], [1.3, 0, -1.3], [0]], net = C.grp(), cols = ['sky', 'mint', 'lilac', 'sun'];
    for (let l = 0; l < 3; l++) for (const a of LY[l]) for (const b of LY[l + 1]) net.add(C.rod([LX[l], a, 0], [LX[l + 1], b, 0], 0.04, 'gray'));
    LX.forEach((x, l) => LY[l].forEach((y) => { const b = C.ball(l === 3 ? 0.42 : 0.3, cols[l]); b.position.set(x, y, 0); net.add(b); }));
    s.add(net, [2.4, 2.6, 0.3], { at: S('hb03') + 0.4, r: [0, -0.2, 0], bob: 0.05 });
    const arrow = C.tube([[4.9, 4.9, 0.3], [3.4, 5.5, 0.3], [1.4, 5.5, 0.3], [-0.1, 4.9, 0.3]], 0.11, 'coral'); s.add(arrow, [0, 0, 0], { at: A('hb04', '거슬러', -0.5), drop: 0, snd: 'dial' });
    fx('dial', A('hb04', '겹마다', 0.2));
    s.cam(S('hb04') + 0.6, { a: -0.06, tx: 0.7, d: 16 });
    item('<span class="kick">① 학습 방법</span>', 'c', 130, S('hb03') + 0.2);
    item('<span class="hd h2">겹이 많을수록 <span class="chip mint">어려운 문제</span>를 푼다</span>', 'c', 770, A('hb03', '여러 겹', 0.2), S('hb03b') - 0.1);
    item('<span class="hd h2">틀린 만큼, <span class="chip">마지막 겹 → 첫 겹</span>으로</span>', 'c', 770, S('hb04') + 0.2, A('hb04', '이름은', -0.2));
    item('<span class="hd h1">= <span class="chip">역전파</span></span>', 'c', 750, A('hb04', '이름은', -0.1), undefined, { anim: 'pop', snd: 'hit' });
  });

  // 1997 Deep Blue
  set(S('hb05'), { bg: '#ffe9dc', cam: { d: 16.5, a: -0.2, el: 0.24, tx: 0, ty: 2.5 } }, (s) => {
    s.add(C.photo(tex.deepblue_b, 2.3, 3.45), [-4.7, 2.3, 0], { r: [-0.06, 0.34, 0], at: A('hb05', '1997', -0.6), snd: 'knock' });
    credit(`IBM 딥 블루와 같은 기종의 컴퓨터 · 사진: James the photographer · CC BY 2.0 · ${CC}`, A('hb05', '1997', -0.2));
    year(s, 1997, [-1.0, 5.0, 0], A('hb05', '1997', -0.2)); yearAt(A('hb05', '1997', 0.2), 1997);
    // a clay chessboard with a few pieces
    const bt = C.canvasTex(256, 256, (x) => { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.fillStyle = (r + c) % 2 ? '#25324f' : '#fff6e6'; x.fillRect(c * 32, r * 32, 32, 32); } });
    const bd = C.grp(C.rbox(4.0, 0.36, 4.0, 'sand', 0.14), new T.Mesh(new T.PlaneGeometry(3.6, 3.6), new T.MeshStandardMaterial({ map: bt, roughness: 0.9 }))); bd.children[1].rotation.x = -Math.PI / 2; bd.children[1].position.y = 0.19; bd.children[1].receiveShadow = true;
    const pc = (c, x, z, k) => { const g = C.grp(C.puck(0.2, 0.12, c), C.cone(0.17, 0.5, c), C.ball(k ? 0.17 : 0.12, c)); g.children[0].position.y = 0.25; g.children[1].position.y = 0.52; g.children[2].position.y = 0.82; g.position.set(x, 0, z); bd.add(g); };
    [['navy', -1.1, -1.1, 1], ['navy', 0.2, -0.7, 0], ['navy', 1.1, -1.6, 0], ['white', -0.7, 0.7, 0], ['white', 0.7, 1.1, 1], ['white', 1.6, 0.2, 0]].forEach((p) => pc(...p));
    s.add(bd, [3.1, 1.9, 0.2], { at: A('hb05', '체스', -0.5), r: [0.62, 0.5, 0], bob: 0.06, snd: 'knock' });
    s.add(C.cross('coral'), [5.7, 4.4, 0.2], { at: A('hb06', '아니었습니다', -0.4), s: 1.6, bob: 0.06, snd: 'buzz' });
    s.cam(S('hb06') + 0.6, { a: 0.14, tx: 0.7, d: 16 });
    item('<span class="hd h2">딥 블루, <span class="chip">체스 챔피언</span>을 이기다</span>', 'c', 770, A('hb05', '딥 블루', -0.2), S('hb06') - 0.1);
    item('<span class="hd h3">배우는 기계가 아니라, <span class="chip sun">규칙 + 빠른 계산</span></span>', 'c', 760, S('hb06') + 0.3, A('hb06', '체스 말고', -0.2));
    item('<span class="hd h2">체스 말고는 <span class="chip">못 한다</span></span>', 'c', 770, A('hb06', '체스 말고', -0.1));
  });

  // the 2000s: data and GPUs
  set(S('hb07'), { bg: '#ffe6d8', cam: { d: 17, a: 0.22, el: 0.24, tx: 0, ty: 2.5 } }, (s) => {
    year(s, '2000년대', [0, 4.1, 0], S('hb07') + 0.3); yearAt(A('hb07', '2000년대', 0.2), 2005);
    const rr = rand(31); for (let i = 0; i < 18; i++) { const ph = i % 3 === 0, o = ph ? C.rbox(1.3, 0.95, 0.08, ['sky', 'mint', 'lilac'][(i / 3) % 3 | 0], 0.05) : C.sheet(1.3, 0.95, '', 3);
      s.add(o, [-5.6 + rr() * 3.6, 0.07 + i * 0.075, 0.2 + rr() * 2.0], { at: S('hb08') + 0.2 + i * 0.13, r: [-Math.PI / 2 + 0.02, 0, (rr() - 0.5) * 1.2], drop: 3.0, snd: i % 4 ? null : 'tick' }); }
    const gp = C.gpu(); s.add(gp, [3.3, 1.9, 0.4], { at: A('hb08', 'GPU', -0.5), s: 1.5, r: [0.1, -0.35, 0], bob: 0.07, snd: 'hit' });
    s.cam(S('hb08') + 0.6, { a: -0.1, d: 16 }); s.cam(A('hb08', 'GPU', 0.4), { a: 0.18, tx: 1.0 });
    item('<span class="hd h2">인터넷 → 넘쳐나는 <span class="chip sky">글과 사진</span></span>', 'c', 770, S('hb08') + 0.3, A('hb08', 'GPU', -0.3));
    item('<span class="hd h2">게임용 부품 <span class="chip sun">GPU</span> → 계산이 훨씬 빠르게</span>', 'c', 770, A('hb08', 'GPU', -0.2));
  });

  // 2012 AlexNet, deep learning
  set(S('hb09'), { bg: '#ffe9dc', cam: { d: 17, a: -0.24, el: 0.22, tx: 0, ty: 2.7 } }, (s) => {
    year(s, 2012, [-4.3, 4.7, 0], A('hb09', '2012', -0.3)); yearAt(A('hb09', '2012', 0.2), 2012);
    const cols = [];
    [['2등', 26.2, 'gray', 0.4, A('hb09', '2등', -0.6)], ['알렉스넷', 15.3, 'sun', 3.6, A('hb09', '따돌리고', -0.3)]].forEach(([n, v, c, x, t]) => { const bar = C.rbox(1.9, 1, 1.9, c, 0.22), pc = C.label([n, v + '%'], { size: 0.5 }), g = C.grp(bar, pc);
      s.add(g, [x, 0, 0], { at: t, drop: 0, out: S('hb10') + 0.3, snd: 'tick' }); cols.push({ bar, pc, h: v / 26.2 * 3.2, t }); });
    s.live((t) => { for (const q of cols) { const h = Math.max(0.05, q.h * out(K(t, q.t + 0.2, q.t + 1.3))); q.bar.scale.y = h; q.bar.position.y = h / 2; q.pc.position.set(0, h + 0.85, 0); } });
    // hb10: layers stacked deep
    const tD = S('hb10') + 0.5; for (let i = 0; i < 9; i++) s.add(C.rbox(3.4, 0.34, 2.2, ['sky', 'mint', 'lilac', 'sun', 'coral'][i % 5], 0.14), [2.2, 0.2 + i * 0.4, 0], { at: tD + i * 0.16, r: [0, 0.2 + i * 0.03, 0], drop: 2.0, snd: i % 2 ? null : 'tick' });
    s.add(B('딥러닝', 'coral', { size: 1.1, d: 0.8, text: WH }), [-3.6, 1.6, 0.8], { at: A('hb10', '딥러닝', -0.5), r: [0, 0.25, 0], bob: 0.06, snd: 'hit' });
    s.cam(S('hb10') + 0.6, { a: 0.16, d: 16 });
    item('<span class="hd h2"><span class="chip sun">알렉스넷</span>, 큰 차이로 우승</span>', 'c', 770, A('hb09', '알렉스넷', -0.2), S('hb10') - 0.1);
    credit('ImageNet 대회 · 상위 5개 오답률 (낮을수록 좋음)', A('hb09', '사진 속', -0.2), S('hb10') - 0.1);
    item('<span class="hd h2"><span class="chip mint">겹을 깊게</span> 쌓은 신경망으로 배운다</span>', 'c', 770, S('hb10') + 0.3);
  });

  // 2016 AlphaGo
  set(S('hb11'), { bg: '#ffe6d8', cam: { d: 17, a: 0.2, el: 0.22, tx: 0, ty: 2.6 } }, (s) => {
    s.add(C.photo(tex.leesedol, 2.5, 2.5), [-4.7, 2.5, 0.2], { r: [-0.06, 0.36, 0], at: S('hb11') + 0.2, snd: 'knock' });
    s.add(C.photo(tex.go_game4, 2.4, 2.64, 'sun'), [-1.6, 2.45, 0.9], { r: [-0.06, 0.14, 0.02], at: S('hb11') + 0.6, snd: 'knock' });
    credit(`이세돌 9단 (2016년, 사진: LG전자 · CC BY 2.0) · 제4국 기보, 이세돌이 이긴 판 (그림: Wesalius · CC BY-SA 4.0) · ${CC}`, S('hb11') + 0.8);
    year(s, 2016, [-3.2, 5.3, -0.4], A('hb11', '2016', -0.2)); yearAt(A('hb11', '2016', 0.2), 2016);
    s.add(B('알파고', 'sky', { size: 0.9, d: 0.7, text: WH }), [3.2, 4.4, 0], { at: A('hb11', '알파고가', -0.3), r: [0, -0.2, 0], bob: 0.06 });
    s.add(B('4 : 1', 'coral', { size: 1.7, d: 1.0, text: WH, padX: 0.9, padY: 0.4 }), [3.3, 2.3, 0.5], { at: A('hb11', '4대 1', -0.4), r: [0, -0.2, 0.03], bob: 0.06, snd: 'hit' });
    const rr = rand(7); for (let i = 0; i < 10; i++) s.add(C.puck(0.36, 0.16, i % 2 ? 'navy' : 'white'), [0.8 + rr() * 5.0, 0.1, 1.4 + rr() * 1.6], { at: S('hb11') + 1.0 + i * 0.1, drop: 1.6, snd: i % 3 ? null : 'tick' });
    s.cam(A('hb11', '4대 1', 0), { a: -0.08, tx: 0.5, d: 16.5 });
    item('<span class="hd h3">서울 · 2016년 3월 · <span class="dim">딥마인드(구글의 자회사)</span></span>', 'c', 770, A('hb11', '서울', -0.2), S('hb12') - 0.05);
    item('<span class="hd h2">AI의 힘을 <span class="chip">처음 실감</span>한 순간</span>', 'c', 770, S('hb12') + 0.1, undefined, { snd: 'pop' });
  });

  // ================= 챗GPT는 어떻게 나왔을까? =================
  set(S('hc01'), { bg: '#efe6ff', cam: { d: 16, a: -0.25, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    const bot = C.bot(); s.add(bot, [-4.3, 1.5, 0.3], { s: 1.35, r: [0, 0.5, 0], at: S('hc01') + 0.2, bob: 0.05, out: S('hc02') + 0.2 }); s.live((t) => bot.userData.live(t, 0, 0));
    s.add(C.sheet(2.0, 4.6, '', 14), [-0.6, 2.6, 0], { at: A('hc01', '긴 글', -0.5), r: [-0.1, 0.2, 0.03], out: S('hc02') + 0.2, snd: 'knock' });
    s.add(C.cross('coral'), [1.2, 4.3, 0.4], { at: A('hc01', '서툴렀습니다', -0.5), s: 1.5, out: S('hc02') + 0.2, snd: 'buzz' });
    item('<span class="hd h2">사진도 보고, 바둑도 두지만</span>', 890, 250, S('hc01') + 0.3, S('hc02') - 0.1);
    item('<span class="hd h1"><span class="chip">긴 글</span>에는 서툴렀다</span>', 890, 420, A('hc01', '그런데', -0.1), S('hc02') - 0.1);
    // 2017: the paper
    year(s, 2017, [-4.2, 4.9, 0], S('hc02') + 0.2, 'lilac'); yearAt(S('hc02') + 0.5, 2017);
    s.add(C.sheet(3.0, 3.9, 'Attention Is\nAll You Need', 6), [-3.3, 2.2, 0.6], { at: S('hc02') + 0.5, r: [-0.12, 0.3, -0.03], bob: 0.05, snd: 'knock' });
    for (let i = 0; i < 8; i++) s.add(person(['sky', 'mint', 'sun', 'coral', 'lilac', 'pink', 'sky', 'mint'][i]), [0.4 + (i % 4) * 1.4, 0, 0.2 + Math.floor(i / 4) * 1.3], { at: A('hc03', '여덟', -0.4) + i * 0.09, s: 0.62, drop: 0.6, snd: i % 2 ? null : 'tick', out: S('hc04') - 0.1 });
    s.add(B('트랜스포머', 'lilac', { size: 1.15, d: 0.9, text: WH, padX: 0.8, padY: 0.4 }), [3.0, 2.2, 0.4], { at: A('hc04', '트랜스포머', -0.3), r: [0, -0.2, 0.02], bob: 0.06, snd: 'hit' });
    s.cam(S('hc02') + 0.5, { a: 0.18, d: 16.5 }); s.cam(S('hc04') + 0.5, { a: -0.06, tx: 0.6 });
    item('<span class="hd h2">구글 연구자 <span class="chip lilac">8명</span>의 논문</span>', 'c', 770, A('hc03', '구글의', -0.1), A('hc03', '우리말로', 0.1));
    item('<span class="hd h2">“주목만 있으면 된다”</span>', 'c', 770, A('hc03', '우리말로', 0.2), S('hc04') - 0.1, { snd: 'pop' });
    item('<span class="hd h2">새로운 구조의 <span class="chip lilac">신경망</span></span>', 'c', 770, A('hc04', '새로운', -0.2));
  });

  // attention
  set(S('hc05'), { bg: '#ebe2ff', cam: { d: 17, a: 0.16, el: 0.22, tx: 0, ty: 2.8 } }, (s) => {
    const ws = ['철수가', '사과를', '먹었다.', '그것은', '달았다.'], bl = [], X = []; let x = -6.3;
    ws.forEach((w, i) => { const b = B(w, 'white', { size: 0.66, d: 0.6 }); x += b.userData.w / 2; X.push(x); bl.push(s.add(b, [x, 2.6, 0], { at: S('hc05') + 0.3 + i * 0.1, snd: i ? null : 'tick' })); x += b.userData.w / 2 + 0.34; });
    // hc05: one word at a time; the earlier ones shrink out of memory
    const t0 = A('hc05', '앞에서부터', -0.2), t1 = A('hc05', '잊어버리기', 0.4), tAll = A('hc06', '한꺼번에', -0.2);
    const ring = C.torus(1.15, 0.12, 'sun'); s.add(ring, [X[0], 2.6, 0.4], { at: t0, out: tAll, snd: null });
    s.live((t) => { const p = lerp(0, 4, io(K(t, t0, t1))); ring.position.x = lerp(X[Math.floor(p)], X[Math.min(4, Math.floor(p) + 1)], p - Math.floor(p));
      bl.forEach((e, i) => { let k = 1; if (t >= t0 && t < tAll) k = i > p + 0.5 ? 0.82 : clamp(1 - (p - i) * 0.2, 0.42, 1); else if (t >= tAll) k = 1 + 0.12 * Math.sin(Math.PI * K(t, tAll + i * 0.06, tAll + 0.5 + i * 0.06)); e.s = k; e.p[1] = 2.6 - (1 - Math.min(1, k)) * 1.4; }); });
    for (let i = 0; i < 5; i++) fx('tick', lerp(t0, t1, (i + 0.5) / 5.1)); fx('ok', tAll);
    // hc06–07: every word looks at the others
    [[0, 1, 1.5], [1, 2, 1.4], [0, 2, 2.3], [3, 4, 1.4], [2, 3, 1.5]].forEach(([a, b, h], i) => s.add(C.tube([[X[a], 3.35, 0], [(X[a] + X[b]) / 2, 3.35 + h, 0], [X[b], 3.35, 0]], 0.05, 'gray', false), [0, 0, 0], { at: A('hc06', '낱말마다', -0.2) + i * 0.16, drop: 0, snd: i % 2 ? null : 'tick' }));
    s.add(C.tube([[X[3], 3.4, 0.1], [(X[3] + X[1]) / 2, 6.1, 0.1], [X[1], 3.5, 0.1]], 0.13, 'coral'), [0, 0, 0], { at: A('hc07', '그것', 0.2), drop: 0, snd: 'ok' });
    // hc08: split across GPUs
    for (let i = 0; i < 4; i++) s.add(C.gpu(), [-4.4 + i * 2.95, 0.55, 1.4], { at: A('hc08', '여러 대', -0.3) + i * 0.12, s: 0.82, r: [0.1, 0, 0], snd: i ? null : 'pop' });
    s.cam(S('hc06') + 0.6, { a: -0.1, d: 17.5, ty: 3.2 }); s.cam(S('hc08') + 0.6, { a: 0.12, ty: 2.6, d: 17 });
    item('<span class="hd h2">그전 방식 · <span class="dim">한 낱말씩 차례로</span></span>', 'c', 130, S('hc05') + 0.2, S('hc06') - 0.1);
    item('<span class="hd h2">글이 길어지면 <span class="chip">앞부분을 잊는다</span></span>', 'c', 770, A('hc05', '글이 길어지면', -0.2), S('hc06') - 0.1, { snd: 'buzz' });
    item('<span class="hd h2">트랜스포머 · <span class="chip lilac">문장 전체를 한꺼번에</span></span>', 'c', 130, S('hc06') + 0.2, S('hc08') - 0.1);
    item('<span class="hd h2">서로 눈여겨보기 = <span class="chip lilac">어텐션</span></span>', 'c', 770, A('hc06', '이렇게', -0.2), S('hc07') - 0.1, { snd: 'pop' });
    item('<span class="hd h2">‘그것’ → <span class="chip">사과</span></span>', 'c', 770, A('hc07', '그것', 0.4), S('hc08') - 0.1, { anim: 'pop' });
    item('<span class="hd h2">여러 GPU에 <span class="chip sun">나눠 맡긴다</span></span>', 'c', 130, S('hc08') + 0.2);
    item('<span class="hd h3">훨씬 큰 모델을, 훨씬 많은 글로</span>', 'c', 780, A('hc08', '훨씬 큰', -0.2), undefined, { snd: 'tick' });
  });

  // 2018 GPT, growing
  set(S('hc09'), { bg: '#efe6ff', cam: { d: 16.5, a: -0.2, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    year(s, 2018, [-4.3, 4.9, 0], S('hc09') + 0.2, 'lilac'); yearAt(S('hc09') + 0.6, 2018);
    s.add(B('GPT', 'sun', { size: 1.9, d: 1.1, padX: 1.0, padY: 0.5 }), [0.6, 2.1, 0], { at: A('hc09', '이름은', -0.2), r: [0, -0.16, 0], bob: 0.06, out: S('hc11') - 0.1, snd: 'hit' });
    const bot = C.bot({ tag: 'GPT' }); s.add(bot, [4.9, 1.3, 0.8], { s: 1.15, r: [0, -0.5, 0], at: S('hc09') + 0.5, bob: 0.05, out: S('hc11') - 0.1 }); s.live((t) => bot.userData.live(t, 0, 0));
    item('<span class="hd h3">오픈AI · 트랜스포머에게 <span class="chip sun">다음 말 맞히기</span>를 학습</span>', 'c', 780, A('hc09', '오픈AI', -0.2), S('hc11') - 0.1);
    // hc11: 1억 → 1,750억 (volumes)
    s.add(C.ball(0.2, 'sun'), [-4.2, 0.2, 1.4], { at: A('hc11', '첫 GPT', -0.2), drop: 1.2, snd: 'tick' });
    s.add(B(['첫 GPT (2018)', '약 1억 개'], 'white', { size: 0.42, d: 0.4 }), [-4.2, 1.5, 1.4], { at: A('hc11', '약 1억', -0.3), bob: 0.05 });
    const big = C.ball(2.4, 'sun'), tB = A('hc11', '2020', -0.2); s.add(big, [1.9, 2.4, 0], { at: tB, kf: [[tB, { s: 0.1 }], [A('hc11', '1,750억', 0.3), { s: 1 }]], s: 0.1, drop: 0, snd: 'hit' });
    s.add(B(['GPT-3 (2020)', '1,750억 개'], 'white', { size: 0.5, d: 0.45 }), [5.2, 1.1, 1.6], { at: A('hc11', '1,750억', -0.2), r: [0, -0.2, 0], bob: 0.05 });
    s.cam(S('hc11') + 0.5, { a: 0.14, d: 17, ty: 2.8 }); yearAt(tB + 0.4, 2020);
    item('<span class="hd h2">모델은 <span class="chip sun">빠르게</span> 커진다</span>', 'c', 130, S('hc11') + 0.2);
    item('<span class="note" style="font-size:32px">공의 부피 = 파라미터(다이얼) 수</span>', 110, 800, A('hc11', '약 1억', 0.4));
  });

  // 2022 ChatGPT
  set(S('hc12'), { bg: '#eadfff', cam: { d: 16.5, a: 0.2, el: 0.2, tx: 0, ty: 2.6 } }, (s) => {
    s.add(B('2022. 11. 30.', 'lilac', { size: 0.8, d: 0.8, text: WH }), [-2.7, 5.25, 0], { at: S('hc12') + 0.3, r: [0, 0.14, 0.02], bob: 0.06, snd: 'hit' }); yearAt(S('hc12') + 0.6, 2022);
    const FONT = C.FONT, tHi = A('hc12', '챗GPT', -0.3), tTy = A('hc12', '누구나', -0.2);
    const ch = C.panel(4.6, 3.1, 'white', (x, w, h, st) => { x.fillStyle = '#f6f2e8'; x.fillRect(0, 0, w, h); x.fillStyle = '#25324f'; x.fillRect(0, 0, w, 130); x.fillStyle = '#fff'; x.font = `900 70px 'Pretendard', sans-serif`; x.textBaseline = 'middle'; x.fillText('ChatGPT', 44, 68);
      const t1 = '안녕?'.slice(0, st.n); x.font = `800 66px 'Pretendard', sans-serif`; if (st.n) { const tw = x.measureText(t1).width + 80; x.fillStyle = '#4aa6ff'; x.beginPath(); x.roundRect(w - tw - 40, 190, tw, 120, 46); x.fill(); x.fillStyle = '#fff'; x.fillText(t1, w - tw, 252); }
      if (st.r) { x.fillStyle = '#fff'; x.beginPath(); x.roundRect(40, 370, 800, 120, 46); x.fill(); x.fillStyle = '#25324f'; x.fillText('무엇을 도와드릴까요?', 80, 432); } }, { d: 0.3, rim: 0.3, r: 0.3, state: { n: 0, r: 0 } });
    s.add(ch, [-3.1, 2.75, 0.4], { at: A('hc12', '대화창', -0.4), r: [-0.05, 0.3, 0], bob: 0.05 }); s.live((t) => ch.userData.state({ n: Math.round(3 * K(t, tTy, tTy + 0.7)), r: t >= tHi ? 1 : 0 })); fx('pop', tHi); fx('tick', tTy);
    [['100만 명', A('hc13', '닷새', -0.2), 0.62, 'white'], ['1억 명', A('hc13', '두 달', -0.2), 0.86, 'sun'], ['9억 명', A('hc13b', '2026', -0.2), 1.25, 'coral']].forEach(([v, t, sz, c], i) =>
      s.add(B(v, c, { size: sz, d: 0.5 + i * 0.2, text: c === 'coral' ? WH : '#25324f' }), [2.4 + i * 0.5, 5.0 - i * 1.55, i * 0.3], { at: t + 0.2, r: [0, -0.22, 0], bob: 0.05, snd: 'hit' }));
    item('<span class="hd h3">닷새 만에 <span class="chip sun">100만 명</span> · 두 달 뒤 한 달 사용자 <span class="chip sun">1억 명</span>(추정)</span>', 'c', 780, A('hc13', '닷새', 0.3), A('hc13b', '2026', 0.3));
    item('<span class="hd h3">2026년 2월 · 매주 쓰는 사람 <span class="chip">9억 명</span> (오픈AI 발표)</span>', 'c', 780, A('hc13b', '2026', 0.4));
    s.cam(S('hc13') + 0.5, { a: -0.1, tx: 1.0, d: 16 }); yearAt(A('hc13b', '2026', 0.3), 2026);
  });

  // 2023 Claude; names
  set(S('hc14'), { bg: '#efe6ff', cam: { d: 16.5, a: -0.2, el: 0.22, tx: 0, ty: 2.5 } }, (s) => {
    year(s, 2023, [-4.6, 4.9, 0], A('hc14', '2023', -0.3), 'lilac'); yearAt(A('hc14', '2023', 0.2), 2023);
    const FONT = C.FONT, tOpen = A('hc15', '그 안에서', -0.3);
    const win = (name, co, col) => C.panel(3.2, 2.3, 'white', (x, w, h) => { x.fillStyle = '#f6f2e8'; x.fillRect(0, 0, w, h); x.fillStyle = col; x.fillRect(0, 0, w, 210); x.fillStyle = '#fff'; x.font = `900 120px 'Pretendard', sans-serif`; x.textBaseline = 'middle'; x.fillText(name, 50, 108); x.fillStyle = '#5b6785'; x.font = `800 74px 'Pretendard', sans-serif`; x.fillText(co, 50, 330); x.fillStyle = '#fff'; x.beginPath(); x.roundRect(50, 440, 760, 150, 60); x.fill(); x.fillStyle = '#25324f'; x.font = `800 80px 'Pretendard', sans-serif`; x.fillText('무엇을 도와드릴까요?', 90, 518); }, { d: 0.3, rim: 0.3, r: 0.3 });
    [['ChatGPT', 'OpenAI', '#25324f', -0.6, S('hc14') + 0.4, 'GPT 계열'], ['Claude', 'Anthropic', '#ff8370', 4.2, A('hc14', '클로드', -0.4), 'Claude 계열']].forEach(([n, co, col, x, t, tg], i) => {
      s.add(win(n, co, col), [x, 2.4, 0.6], { at: t, s: 1.25, r: [-0.04, -0.12, 0], kf: [[tOpen, { p: [x, 2.4, 0.6], r: [-0.04, -0.12, 0], s: 1.25 }], [tOpen + 0.8, { p: [x, 4.7, -0.2], r: [-0.3, -0.12, 0], s: 0.85 }]] });
      const b = C.bot({ tag: 'LLM' }); s.add(b, [x, 1.25, 0.6], { at: tOpen + 0.3, s: 1.15, r: [0, -0.15, 0], bob: 0.05, snd: i ? null : 'ok' }); s.live((tt) => b.userData.live(tt, 0, 0));
      s.add(B(tg, 'sun', { size: 0.36, d: 0.36 }), [x, 0.3, 2.1], { at: tOpen + 0.7, snd: null }); });
    s.cam(S('hc15') + 0.5, { a: 0.06, tx: 0.7, d: 16 });
    item('<span class="hd h3">구글을 비롯한 여러 회사도<br>잇달아 <span class="chip lilac">대화형 AI</span> 공개</span>', 110, 620, A('hc14', '구글을', -0.2), S('hc15') - 0.1);
    item('<span class="hd h2">서비스 이름 ≠ 그 안의 <span class="chip sun">LLM</span></span>', 'c', 780, A('hc15', '챗GPT와', -0.2), undefined, { snd: 'tick' });
  });
};
