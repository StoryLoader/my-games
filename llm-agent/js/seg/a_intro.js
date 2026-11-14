/* a_intro.js — the first three chapters: the opening, "LLM이란 무엇일까?", "LLM은 어떻게 배울까?" (storyboard.md).
   Exhibits: two chat windows, the two words in brass, type tiles on a rail (the next-word machine), a wall of dials. */
window.SEG_intro = function (G) {
  const { S, E, A, K, io, out, lerp, clamp, station, item, pop, show, cls, type, fx, count, live, rand } = G;
  const tiles = (arr, c = '') => arr.map((w) => `<span class="tile ${c}">${w}</span>`).join('');

  // ================= opening =================
  station(0);
  { const ch = item(`<div class="chat"><div class="top">AI에게 말로 시키기</div><div class="body">
      <div class="row r"><span class="bub me">자기소개서 초안 써 줘</span></div><div class="row"><span class="bub ai">네, 초안입니다. “저는 꾸준함이 강점인 …”</span></div>
      <div class="row r"><span class="bub me">3박 4일 제주 여행 계획 짜 줘</span></div><div class="row"><span class="bub ai">1일차 · 공항 → 애월 해안도로 → …</span></div></div></div>`, 150, 200, 0.2, S('op03') - 0.1, { anim: 'left' });
    const rows = [...ch.el.querySelectorAll('.row')];
    [[A('op01', '글을', -0.3)], [A('op01', '써 주고', -0.2)], [A('op01', '여행', -0.3)], [A('op01', '짜 줍니다', -0.3)]].forEach(([t], i) => { show(rows[i], t); fx(i % 2 ? 'pop' : 'tick', t); }); }
  item('<span class="hd h1">말로 시키면<br><span class="brass">해 주는</span> AI</span>', 1010, 250, 0.5, S('op02') - 0.1);
  item('<span class="metal" style="font-size:330px;line-height:0.9">?</span>', 1090, 150, S('op02') + 0.1, S('op03') - 0.1, { anim: 'pop', snd: 'pop' });
  item('<span class="hd h2">그런데 이게<br>대체 무엇일까?</span>', 1010, 480, S('op02') + 0.4, S('op03') - 0.1);

  station(S('op03'));
  item('<span class="kick">오늘 알아 갈 두 가지 말</span>', 'c', 150, S('op03') + 0.2);
  item('<span class="metal" style="font-size:300px;line-height:1">LLM</span>', 170, 200, A('op03', 'LLM', -0.2), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="hd h0" style="font-size:170px">AI 에이전트</span>', 900, 262, A('op03', 'AI 에이전트', -0.2), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="sub" style="display:block;width:660px">챗GPT · 클로드 같은 서비스 안에서<br><b>글을 만들어 내는 프로그램</b></span>', 180, 560, S('op04') + 0.4);
  item('<span class="sub" style="display:block;width:820px">대답에서 그치지 않고<br><b>직접 일을 해 주도록</b> 만든 것</span>', 910, 560, S('op05') + 0.4);

  station(S('op06'));
  item('<span class="hd h2">세 걸음으로 알아봅니다</span>', 'c', 160, S('op06') + 0.2);
  [['① LLM이란?', '쉬운 비유로', '먼저'], ['② 70여 년의<br>역사', '튜링 → 챗GPT · 클로드', '그다음'], ['③ 에이전트란?', '말하는 AI → 일하는 AI', '마지막으로']].forEach(([n, d, ph], i) => {
    const t = A('op06', ph, -0.2);
    pop(`<div class="medal" style="width:300px;height:300px;font-size:46px">${n}</div>`, 240 + i * 570, 330, t);
    item(`<span class="sub" style="display:block;width:520px;text-align:center">${d}</span>`, 130 + i * 570, 660, t + 0.4);
  });
  item('<svg width="1440" height="20"><path d="M0 10 H1440" stroke="rgba(233,205,132,0.5)" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round"/></svg>', 240, 470, S('op06') + 0.8, undefined, { anim: 'fade' });

  // ================= LLM이란 무엇일까? =================
  station(S('lm01'));
  item('<span class="kick">첫 번째 말</span>', 200, 160, S('lm01') + 0.2, S('lm03') - 0.1);
  item('<span class="metal" style="font-size:340px;line-height:1">LLM</span>', 180, 190, S('lm01') + 0.3, S('lm03') - 0.1, { anim: 'pop', snd: 'hit' });
  item('<span class="metal" style="font-size:104px;line-height:1.15"><u style="text-decoration-color:#f6e2a4">L</u>arge<br><u style="text-decoration-color:#f6e2a4">L</u>anguage<br><u style="text-decoration-color:#f6e2a4">M</u>odel</span>', 1010, 180, A('lm02', 'Large', -0.2), S('lm03') - 0.1, { anim: 'right', snd: 'tick' });
  item('<span class="hd h2">대규모 언어 모델</span>', 1010, 590, A('lm02', '우리말로', -0.1), S('lm03') - 0.1, { snd: 'pop' });
  item('<span class="hd h2">하는 일은 하나</span>', 'c', 170, S('lm03') + 0.2);
  item(`<div style="display:flex;align-items:center;justify-content:center">${tiles(['앞에', '놓인', '글'])}<span class="tile q">?</span></div>`, 'c', 350, A('lm03', '앞에', -0.2), undefined, { snd: 'tick' });
  item('<span class="hd h1"><span class="brass">다음에 올 말</span> 맞히기</span>', 'c', 540, A('lm03', '다음에', -0.2), undefined, { anim: 'pop', snd: 'hit' });

  station(S('lm04'));
  { const ph = item(`<div class="phone"><div class="scr"><div style="padding:60px 22px 0;text-align:right"><span class="bub me" style="font-size:36px"><span class="ty"></span><span style="opacity:0.55">|</span></span></div>
      <div class="sg" style="position:absolute;left:0;right:0;bottom:200px;display:none;justify-content:space-around;padding:14px 8px;background:#d5d0c4;font-weight:800;font-size:31px"><span>좋네요</span><span style="color:#8a8578">|</span><span>맑아요</span><span style="color:#8a8578">|</span><span>추워요</span></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:repeating-linear-gradient(90deg,#c9c4b8 0 34px,#d5d0c4 34px 39px),#c9c4b8;opacity:0.9"></div></div></div>`, 250, 110, S('lm04') + 0.2, undefined, { anim: 'left', style: 'transform-origin:50% 60%', kf: [[S('lm05') - 0.2, { s: 0.96 }], [S('lm05') + 1.0, { s: 0.6, x: -70, y: 60 }]] });
    type(ph.el.querySelector('.ty'), '오늘 날씨가', A('lm04', '오늘', -0.2), 1.2);
    const sg = ph.el.querySelector('.sg'); show(sg, A('lm04', '다음 단어', -0.3), 'flex'); fx('pop', A('lm04', '다음 단어', -0.3)); }
  item('<span class="hd h2">문자 쓸 때의<br><span class="brass">다음 단어 추천</span></span>', 800, 230, S('lm04') + 0.6, S('lm05') - 0.1);
  item('<span class="hd h2">이 기능을<br><span class="brass">엄청나게 크고 똑똑하게</span><br>키운 것</span>', 780, 190, S('lm05') + 0.2);
  item('<span class="metal" style="font-size:200px;line-height:1">= LLM</span>', 790, 560, A('lm05', '키운', -0.2), undefined, { anim: 'pop', snd: 'hit' });

  // the next-word machine: tiles on a brass rail
  station(S('lm06'));
  item('<span class="kick">다음 말 맞히기 · 예시 (점수는 설명용)</span>', 170, 150, S('lm06') + 0.2);
  { const row = item(`<div style="display:flex;align-items:flex-end;flex-wrap:wrap;width:1600px;row-gap:22px">${tiles(['오늘', '날씨가', '참'])}<span class="tile new" style="display:none">좋네요</span><span class="tile q">?</span></div>`, 170, 215, S('lm06') + 0.3, S('lm09') - 0.05, { snd: 'tick' });
    const tl = [...row.el.querySelectorAll('.tile')]; const tPick = A('lm08', '골라', 0.1);
    show(tl[3], tPick, 'inline-block'); fx('ok', tPick);
    item('<div class="rail" style="width:1580px"></div>', 160, 322, S('lm06') + 0.3, S('lm09') - 0.05, { anim: 'fade' });
    const cands = [['좋네요', 62], ['덥네요', 21], ['춥네요', 9], ['흐리네요', 5]], tSc = A('lm06', '점수', -0.4);
    cands.forEach(([w, p], i) => {
      const it = item(`<span class="cand"><span class="w" style="display:inline-block;width:250px">${w}</span><span class="bar" style="width:0"></span><span class="pc">${p}%</span></span>`, 560, 400 + i * 88, tSc + i * 0.14, tPick + (i ? 0.2 : 0.9), { anim: 'left', snd: 'tick', kf: i ? null : [[tPick - 0.2, {}], [tPick + 0.5, { x: 60, y: -160, s: 0.8, o: 0 }]] });
      if (i < 3) { const th = A('lm07', w, -0.15); cls(it.el.querySelector('.w'), 'brass', th, th + 1.6); fx('tick', th); }
      const bar = it.el.querySelector('.bar'); let last = -1; live.push((t) => { const wv = Math.round(p * 9 * out(K(t, tSc + 0.3 + i * 0.14, tSc + 1.2 + i * 0.14))); if (wv !== last) { last = wv; bar.style.width = wv + 'px'; } });
    });
    item('<span class="hd h3">붙인 말까지 포함해서 → <span class="brass">그다음 말을 또</span></span>', 170, 440, A('lm08', '방금', -0.2), S('lm09') - 0.05); }
  // lm09: piece by piece, a whole answer
  { const words = '오늘 날씨가 참 좋네요 . 산책하기 딱 좋은 날이에요 . 가까운 공원에 나가서 가볍게 걸어 보는 건 어떨까요 ? 햇볕이 따뜻하니 겉옷은 얇게 입으셔도 됩니다 .'.split(' ');
    const row = item(`<div style="display:flex;flex-wrap:wrap;width:1600px;row-gap:20px">${words.map((w) => `<span class="tile sm" style="display:none">${w}</span>`).join('')}</div>`, 170, 200, S('lm09'), undefined, { anim: 'fade' });
    const tl = [...row.el.querySelectorAll('.tile')], t0 = S('lm09') + 0.1, t1 = A('lm09', '한 편의', 0.6);
    tl.forEach((el, i) => { const t = i < 4 ? t0 : lerp(t0 + 0.3, t1, (i - 4) / (tl.length - 4)); show(el, t, 'inline-block'); if (i >= 4 && i % 2 === 0) fx('tick', t); });
    const cn = item('<span class="hd h3">조각 <span class="brass n">4</span>개 … <span class="dim">실제로는 수백 번</span></span>', 170, 640, S('lm09') + 0.3);
    const nn = cn.el.querySelector('.n'); let last = -1; live.push((t) => { let n = 0; for (const r of tl) if (r.style.display !== 'none') n++; if (n !== last) { last = n; nn.textContent = n; } }); }

  station(S('lm10'));
  item('<span class="hd h2">질문에 답하는 것도 <span class="brass">같은 원리</span></span>', 'c', 160, S('lm10') + 0.2, S('lm11') - 0.1);
  { const row = item(`<div style="display:flex;flex-wrap:wrap;justify-content:center;row-gap:22px"><span class="tile q">질문: 한국의 수도는 어디야?</span>${['한국의', '수도는', '서울입니다', '.'].map((w) => `<span class="tile new" style="display:none">${w}</span>`).join('')}</div>`, 'c', 340, S('lm10') + 0.6, S('lm11') - 0.1, { snd: 'tick' });
    [...row.el.querySelectorAll('.new')].forEach((el, i) => { const t = A('lm10', '이어질', -0.2) + i * 0.45; show(el, t, 'inline-block'); fx('tick', t); }); }
  item('<span class="sub" style="display:block;width:1920px;text-align:center">질문 뒤에 이어질 <b>가장 그럴듯한 글</b>을 만든다</span>', 0, 560, A('lm10', '이 질문', -0.2), S('lm11') - 0.1);
  item('<span class="hd h2">이어 붙이는 조각 = <span class="brass">토큰</span></span>', 'c', 160, S('lm11') + 0.2);
  { const big = item('<span class="tile" style="font-size:110px;padding:20px 40px">먹었습니다</span>', 'c', 330, S('lm11') + 0.5, A('lm11', '낱말보다', 0.2), { snd: 'tick' });
    ['먹', '었', '습니다'].forEach((w, i) => pop(`<span class="tile new" style="font-size:110px;padding:20px 40px">${w}</span>`, 520 + [0, 250, 500][i], 330, A('lm11', '낱말보다', 0.2) + i * 0.12, undefined, { kf: [[A('lm11', '낱말보다', 0.3), { x: 0 }], [A('lm11', '낱말보다', 1.1), { x: (i - 1) * 46 }]] })); }
  item('<span class="sub" style="display:block;width:1920px;text-align:center">낱말보다 조금 작은 <b>글자 묶음</b> <span class="dim">· 나뉘는 모양은 예시</span></span>', 0, 590, A('lm11', '글자 묶음', -0.2));

  // ================= LLM은 어떻게 배울까? =================
  station(S('tr01'));
  item('<span class="hd h1">이 실력은<br><span class="brass">어디서</span> 왔을까?</span>', 'c', 230, S('tr01') + 0.2, S('tr02') - 0.1);
  item('<span class="hd h2">엄청난 양의 글로 <span class="brass">맞히기 연습</span></span>', 'c', 150, S('tr02') + 0.2);
  // a pile of pages
  { const rr = rand(5); for (let i = 0; i < 9; i++) { const x = 190 + rr() * 230, y = 350 + rr() * 50 + i * 20, ro = (rr() - 0.5) * 16;
      item(`<div class="paper" style="width:270px;height:150px;padding:20px 24px;transform:rotate(${ro.toFixed(1)}deg)"><div class="ln" style="margin-top:0"></div><div class="ln"></div><div class="ln" style="width:70%"></div><div class="ln" style="width:85%"></div></div>`, x, y, A('tr02', '책과', -0.3) + i * 0.09, undefined, { anim: 'drop', snd: i % 3 ? null : 'tick' }); }
    item('<span class="hd h4" style="display:block;width:520px;text-align:center">책 · 인터넷의 글</span>', 150, 262, A('tr02', '책과', 0.3)); }
  { const row = item(`<div style="display:flex;align-items:center">${tiles(['해는', '동쪽에서'])}<span class="tile cv" style="min-width:230px;text-align:center">뜹니다</span></div>`, 800, 330, A('tr02', '가져와서', -0.2), undefined, { snd: 'tick' });
    const cv = row.el.querySelector('.cv'); cls(cv, 'q', A('tr02', '가리고', -0.2)); fx('pop', A('tr02', '가리고', -0.2));
    live.push((t) => { const hid = t >= A('tr02', '가리고', -0.2); const v = hid ? '?' : '뜹니다'; if (cv.textContent !== v) cv.textContent = v; }); }
  item('<span class="hd h3">뒷부분을 가리고 → <span class="brass">맞혀 보기</span></span>', 800, 500, A('tr02', '가리고', 0.2));
  item('<span class="cand">기계의 답: <span class="rose">“집니다”</span> <span class="rose">×</span></span>', 800, 620, A('tr02', '맞혀', 0.3), undefined, { anim: 'left', snd: 'buzz' });

  // the wall of dials
  station(S('tr03'));
  { const rr = rand(8), dials = []; const box = item('<div style="position:relative;width:900px;height:430px"></div>', 900, 170, S('tr03') + 0.3, undefined, { anim: 'fade' });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const d = document.createElement('div'); d.className = 'dial'; d.style.left = (c * 100) + 'px'; d.style.top = (r * 108) + 'px'; box.el.appendChild(d); dials.push({ d, a0: rr() * 300, k: (rr() - 0.5) * 2, last: '' }); }
    // every "wrong, adjust" beat nudges the dials a little
    const nudges = [A('tr03', '틀릴', 0.3), A('tr03', '고칩니다', -0.4), A('tr05', '맞혀', 0.2), A('tr05', '틀리고', 0.2), A('tr05', '다이얼', 0.3), A('tr05', '되풀이', -0.2), A('tr05', '되풀이', 0.5), A('tr05', '학습', -0.3)];
    nudges.forEach((t) => fx('dial', t));
    live.push((t) => { let n = 0; for (const u of nudges) n += io(K(t, u, u + 0.5)); for (const q of dials) { const a = (q.a0 + q.k * 26 * n).toFixed(1); if (a !== q.last) { q.last = a; q.d.style.transform = `rotate(${a}deg)`; } } });
    item('<span class="hd h2">LLM의 속 =<br>수없이 많은 <span class="brass">숫자</span></span>', 140, 190, S('tr03') + 0.3, S('tr04') - 0.1);
    item('<span class="sub" style="display:block;width:700px">틀릴 때마다, 정답에 가까워지도록<br><b>아주 조금씩</b> 고친다</span>', 140, 480, A('tr03', '틀릴', -0.2), S('tr04') - 0.1);
    item('<span class="hd h1 brass">파라미터</span>', 140, 180, S('tr04') + 0.2, S('tr05') - 0.1, { anim: 'pop', snd: 'hit' });
    item('<span class="sub" style="display:block;width:700px">숫자 하나 = <b>라디오 다이얼</b> 하나</span>', 140, 370, A('tr04', '숫자 하나하나', -0.2), S('tr05') - 0.1);
    item('<span class="hd h2">다이얼이<br><span class="brass">수천억 개</span></span>', 140, 480, A('tr04', '수천억', -0.3), S('tr05') - 0.1, { anim: 'pop', snd: 'hit' });
    item('<span class="note" style="display:block;width:900px;text-align:center">그림은 36개 · 실제로는 수천억 개</span>', 900, 620, A('tr04', '수천억', 0.2), S('tr08') - 0.1);
    // tr05: the loop, then the two names
    ['맞혀 보기', '틀림', '다이얼 조금 돌리기'].forEach((w, i) => item(`<span class="hd h3">${i ? '<span class="dim">→ </span>' : ''}${w}</span>`, 140, 180 + i * 96, A('tr05', ['맞혀', '틀리고', '다이얼'][i], -0.2), S('tr08') - 0.1, { anim: 'left', snd: 'tick' }));
    item('<span class="hd h3 dim">↻ 셀 수 없이 되풀이</span>', 140, 470, A('tr05', '셀 수', -0.2), S('tr08') - 0.1);
    item('<span class="hd h3">이 과정 = <span class="brass">학습</span></span>', 140, 580, A('tr05', '학습이라고', -0.4), S('tr08') - 0.1, { anim: 'pop', snd: 'pop' });
    item('<span class="hd h3">학습을 마친 프로그램 = <span class="brass">모델</span></span>', 140, 672, A('tr05', '모델', -0.5), S('tr08') - 0.1, { anim: 'pop', snd: 'pop' });
    // tr08: "Large"
    item('<span class="metal" style="font-size:150px;line-height:1"><u style="text-decoration-color:#f6e2a4">L</u>arge</span>', 140, 170, S('tr08') + 0.2, undefined, { anim: 'pop', snd: 'hit' });
    item('<span class="hd h2">대규모 =</span>', 140, 370, A('tr08', '대규모', -0.2));
    item('<span class="hd h3">읽은 글도 <span class="brass">엄청나게 많고</span></span>', 140, 520, A('tr08', '읽은', -0.2), undefined, { anim: 'left', snd: 'tick' });
    item('<span class="hd h3">다이얼도 <span class="brass">엄청나게 많다</span></span>', 140, 620, A('tr08', '다이얼도', -0.2), undefined, { anim: 'left', snd: 'tick' }); }

  // tr06–07: what seeps into the dials
  station(S('tr06'));
  item('<span class="hd h2">맞히기 연습만 시켰는데</span>', 'c', 150, S('tr06') + 0.2);
  { const rr = rand(9); const box = item('<div style="position:relative;width:560px;height:330px"></div>', 1180, 330, S('tr06') + 0.3, undefined, { anim: 'fade' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const d = document.createElement('div'); d.className = 'dial'; d.style.left = (c * 112) + 'px'; d.style.top = (r * 112) + 'px'; d.style.transform = `rotate(${(rr() * 300).toFixed(0)}deg)`; box.el.appendChild(d); }
    [['문법', '문법'], ['상식', '상식'], ['글의 흐름', '글의']].forEach(([w, ph], i) => { const t = i ? A('tr06', ph, -0.2) : S('tr06') + 6.85, t2 = A('tr07', '다이얼 속', -0.4) + i * 0.3;
      item(`<span class="tile" style="font-size:70px">${w}</span>`, 200 + i * 60, 280 + i * 118, t, t2 + 1.0, { anim: 'left', snd: 'pop', kf: [[t2, { x: 0, y: 0, s: 1, o: 1 }], [t2 + 0.9, { x: 1090 - i * 60, y: 170 - i * 118, s: 0.3, o: 0 }]] }); fx('ok', t2 + 0.8); }); }
  item('<span class="hd h2">가르친 적 없는데 <span class="brass">저절로 스며든다</span></span>', 'c', 672, A('tr07', '누가', -0.2));

  // tr09–11: the weak spot
  station(S('tr09'));
  item('<span class="hd h2">그래서 생기는 <span class="rose">약점</span></span>', 'c', 150, S('tr09') + 0.2, S('tr11') - 0.1);
  item(`<div style="position:relative;width:330px;height:400px;border-radius:8px 18px 18px 8px;background:linear-gradient(90deg,#3a1d16 0 34px,#6b2f25 34px);box-shadow:0 30px 44px rgba(0,0,0,0.6), inset -10px 0 0 #e9dfc5"><span style="position:absolute;left:70px;top:120px;font-weight:900;font-size:86px;color:#f1d992">사전</span><span style="position:absolute;left:96px;top:240px;font-weight:700;font-size:28px;color:#f1d992">찾아서 꺼내 옴</span></div>`, 260, 300, A('tr09', '사실을', -0.3), S('tr10') - 0.1, { anim: 'left', snd: 'pop' });
  item('<span class="hd rose" style="font-size:300px;line-height:1">×</span>', 330, 330, A('tr09', '아니라', -0.3), S('tr10') - 0.1, { anim: 'pop', snd: 'buzz' });
  item(`<div>${tiles(['그럴듯한', '말을', '이어 가는', '기계'], 'sm')}</div><div class="rail" style="width:780px;margin-top:6px"></div>`, 900, 400, A('tr09', '그럴듯한', -0.3), S('tr10') - 0.1, { anim: 'right', snd: 'tick' });
  item('<span class="hd mint" style="font-size:130px;line-height:1">○</span>', 1200, 520, A('tr09', '기계입니다', -0.3), S('tr10') - 0.1, { anim: 'pop', snd: 'ok' });
  { const ws = ['세종대왕은', '1887년에', '스마트폰을', '발명했습니다', '.'];
    const row = item(`<div style="display:flex;justify-content:center">${ws.map((w) => `<span class="tile" style="display:none">${w}</span>`).join('')}</div>`, 'c', 360, S('tr10'), S('tr11') - 0.1, { anim: 'fade' });
    [...row.el.querySelectorAll('.tile')].forEach((el, i) => { const t = S('tr10') + 0.3 + i * 0.5; show(el, t, 'inline-block'); fx('tick', t); });
    item('<span class="stampmk">환각</span>', 1240, 470, A('tr10', '환각', -0.3), S('tr11') - 0.1, { anim: 'pop', snd: 'stamp' });
    item('<span class="sub" style="display:block;width:1920px;text-align:center">모르는 것도 <b>아는 것처럼 매끄럽게</b> 지어낼 때가 있다 <span class="dim">· 위 문장은 일부러 지어낸 틀린 예</span></span>', 0, 660, A('tr10', '매끄럽게', -0.3), S('tr11') - 0.1); }
  item('<span class="kick">정리</span>', 'c', 160, S('tr11') + 0.2);
  item('<span class="hd h2"><span class="metal" style="font-size:120px">LLM</span> = 엄청난 양의 글로<br><span class="brass">다음 말 맞히기</span>를 연습한 프로그램</span>', 'c', 230, S('tr11') + 0.4);
  item('<span class="hd h3">말은 놀랍도록 잘하지만, <span class="rose">틀릴 수도 있다</span></span>', 'c', 620, A('tr11', '말은', -0.2), undefined, { snd: 'pop' });
};
