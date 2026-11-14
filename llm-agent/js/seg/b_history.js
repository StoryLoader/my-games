/* b_history.js — the three history chapters, 1950 → 2023 (storyboard.md): framed photographs from Wikimedia Commons
   with their credit on a brass plaque (provenance.json, research.md), brass years on the wall, and one drawn exhibit
   per idea. The year rail in the hud follows along. */
window.SEG_history = function (G) {
  const { S, E, A, K, io, out, lerp, clamp, station, item, pop, show, cls, type, fx, count, drawOn, frame, year, yearAt, railOn, live, rand, END } = G;
  const tiles = (arr, c = '') => arr.map((w) => `<span class="tile ${c}">${w}</span>`).join('');
  const CC = 'Wikimedia Commons';
  railOn.push([S('ha02') + 1.5, S('ag01') - 0.3]);

  // ================= 생각하는 기계는 언제부터 꿈꿨을까? =================
  station(S('ha01'));
  item('<span class="hd h1">어느 날 갑자기<br>나타난 것이 <span class="brass">아니다</span></span>', 'c', 230, S('ha01') + 0.3, S('ha02') - 0.1);
  { const y = item('<span class="metal yr n" style="font-size:330px">2026</span>', 'c', 190, S('ha02') + 0.2, undefined, { anim: 'pop', snd: 'hit' });
    count(y.el.querySelector('.n'), 2026, 1950, S('ha02') + 0.8, A('ha02', '돌아가서', 0.6), (v) => String(Math.round(v)));
    for (let i = 0; i < 7; i++) fx('tick', S('ha02') + 0.9 + i * 0.28);
    item('<span class="hd h2">70여 년 전으로</span>', 'c', 590, S('ha02') + 0.5); yearAt(S('ha02'), 2026); yearAt(A('ha02', '돌아가서', 0.6), 1950); }

  // 1950 Turing
  station(S('ha03'));
  frame('turing.jpg', 140, 150, 370, 450, S('ha03') + 0.1, undefined, '앨런 튜링 (1951년 촬영)', `사진: Elliott &amp; Fry · 퍼블릭 도메인 · ${CC}`, { pos: '50% 20%' });
  year('1950', 690, 105, S('ha03') + 0.3, undefined, 175);
  item('<span class="hd h2">“기계가 생각할 수<br>있을까?”</span>', 700, 330, A('ha03', '기계가', -0.3), S('ha04') - 0.1, { snd: 'pop' });
  item('<span class="sub">영국의 수학자 앨런 튜링의 논문</span>', 704, 600, A('ha03', '영국의', -0.1), S('ha04') - 0.1);
  // the test: a judge, two hidden partners, text only
  { const sv = item(`<svg width="1080" height="330" viewBox="0 0 1080 330">
      <g fill="#f4ead3"><circle cx="90" cy="110" r="46"/><path d="M20 290 C20 190 160 190 160 290 Z"/></g>
      <g id="tw" fill="none" stroke="#e9cd84" stroke-width="6" stroke-linecap="round" stroke-dasharray="3 16"><path d="M190 150 H520"/><path d="M190 220 H520"/></g>
      <rect x="540" y="30" width="16" height="290" rx="6" fill="#d8b563"/>
      <g font-family="Pretendard" font-weight="900" font-size="64" text-anchor="middle"><rect x="620" y="60" width="190" height="110" rx="18" fill="#12342b" stroke="#d8b563" stroke-width="5"/><text x="715" y="138" fill="#f6e2a4">?</text>
      <rect x="850" y="60" width="190" height="110" rx="18" fill="#12342b" stroke="#d8b563" stroke-width="5"/><text x="945" y="138" fill="#f6e2a4">?</text></g>
      <g font-family="Pretendard" font-weight="800" font-size="34" text-anchor="middle" fill="#f4ead3"><text x="90" y="42">묻는 사람</text><text x="715" y="222">사람</text><text x="945" y="222">기계</text><text x="830" y="290" fill="#cfc3a6" font-size="30">누가 어느 쪽인지는 가려 둔다</text></g></svg>`, 690, 410, S('ha04') + 0.3, undefined, { anim: 'fade', snd: 'tick' });
    item('<span class="note">글로만 대화</span>', 930, 500, A('ha04', '글로만', -0.2));
  }
  item('<span class="hd h3">구별할 수 없다면 → <span class="brass">생각한다고 보자</span></span>', 700, 300, A('ha04', '구별할', -0.2), S('ha05') - 0.05);
  item('<span class="hd h2 brass">= 튜링 테스트</span>', 700, 285, S('ha05') + 0.05, undefined, { anim: 'pop', snd: 'hit' });
  yearAt(S('ha03') + 0.6, 1950);

  // 1956 Dartmouth
  station(S('ha06'));
  frame('dartmouth.jpg', 130, 170, 560, 373, S('ha06') + 0.1, undefined, '다트머스 대학 (미국 뉴햄프셔주)', `사진: Daderot · CC0 · ${CC}`);
  year('1956', 880, 120, S('ha06') + 0.3); yearAt(S('ha06') + 0.6, 1956);
  item('<span class="metal" style="font-size:92px;line-height:1.1">Artificial Intelligence</span>', 880, 410, A('ha06', '처음 쓴', -0.3), undefined, { anim: 'right', snd: 'tick' });
  item('<span class="hd h1">인공지능</span>', 880, 530, A('ha06', '인공지능', -0.2), undefined, { anim: 'pop', snd: 'pop' });
  item('<span class="metal" style="font-size:150px;line-height:1">= AI</span>', 1420, 525, A('ha06', '줄여서', 0.2), undefined, { anim: 'pop', snd: 'hit' });

  // 1958 perceptron
  station(S('ha07'));
  frame('perceptron.jpg', 130, 160, 540, 422, S('ha07') + 0.1, undefined, '글자를 알아보는 실험 기계, 퍼셉트론', `사진: 미 해군 국립박물관 · 퍼블릭 도메인 · ${CC}`);
  year('1958', 860, 120, A('ha07', '1958', -0.2)); yearAt(A('ha07', '1958', 0.2), 1958);
  item('<span class="hd h2">퍼셉트론</span>', 870, 410, A('ha07', '퍼셉트론', -0.3), S('ha08') - 0.1, { anim: 'pop', snd: 'pop' });
  item('<span class="sub" style="display:block;width:880px"><b>뇌세포</b>를 흉내 낸 기계 · 프랭크 로젠블랫</span>', 874, 560, A('ha07', '뇌세포', -0.2), S('ha08') - 0.1);
  { const sv = item(`<svg width="900" height="350" viewBox="0 0 900 350"><g stroke="#e9cd84" stroke-width="6" fill="none" stroke-linecap="round">
      <path class="w" pathLength="1" d="M90 60 L520 175"/><path class="w" pathLength="1" d="M90 175 L520 175"/><path class="w" pathLength="1" d="M90 290 L520 175"/><path class="w" pathLength="1" d="M600 175 H800"/></g>
      <g fill="#f4ead3"><circle cx="70" cy="60" r="30"/><circle cx="70" cy="175" r="30"/><circle cx="70" cy="290" r="30"/></g>
      <circle cx="560" cy="175" r="62" fill="#d8b563" stroke="#fff3c4" stroke-width="5"/><circle cx="830" cy="175" r="30" fill="#7fd6a8"/>
      <g fill="#d8b563" stroke="#2a1c08" stroke-width="3"><circle cx="290" cy="113" r="20"/><circle cx="290" cy="175" r="20"/><circle cx="290" cy="237" r="20"/></g>
      <g font-family="Pretendard" font-weight="800" font-size="30" fill="#f4ead3" text-anchor="middle"><text x="70" y="344">입력</text><text x="290" y="290" fill="#f6e2a4">다이얼</text><text x="830" y="240">답</text></g></svg>`, 870, 400, S('ha08') + 0.2, undefined, { anim: 'fade', snd: 'tick' });
    [...sv.el.querySelectorAll('.w')].forEach((p, i) => drawOn(p, S('ha08') + 0.4 + i * 0.15, 0.8));
  }
  item('<span class="hd h2 brass">인공 신경망</span>', 1340, 395, S('ha09') + 0.2, undefined, { anim: 'pop', snd: 'hit' });

  // 1966 ELIZA
  station(S('ha10'));
  frame('eliza.png', 110, 160, 540, 350, S('ha10') + 0.1, undefined, '엘리자와 나눈 대화 화면', `퍼블릭 도메인 · ${CC}`);
  frame('weizenbaum.jpg', 790, 160, 230, 300, S('ha10') + 0.5, undefined, '만든 사람 요제프 바이첸바움', `사진: RIT · 퍼블릭 도메인 · ${CC}`, { pos: '50% 15%' });
  year('1966', 1180, 120, S('ha10') + 0.3, undefined, 230); yearAt(S('ha10') + 0.6, 1966);
  item('<span class="hd h3">엘리자 · 상담사처럼 대답</span>', 1190, 400, A('ha10', '엘리자', -0.2), S('ha11') - 0.1, { snd: 'pop' });
  item('<span class="hd h3">이해한 게 아니라<br><span class="brass">틀에 끼워 넣기</span></span>', 1190, 390, S('ha11') + 0.2);
  item('<span class="bub me" style="font-size:38px;white-space:nowrap;max-width:none"><b style="color:#ffe58a">어머니</b>가 저를 힘들게 해요</span>', 1230, 570, A('ha12', '어머니', -0.3), undefined, { anim: 'right', snd: 'tick' });
  item('<span class="bub ai" style="font-size:38px;white-space:nowrap;max-width:none"><b style="color:#b3541e">가족</b> 이야기를 더 해 주세요</span>', 1190, 668, A('ha12', '가족', -0.3), undefined, { anim: 'left', snd: 'pop' });

  // the AI winter
  station(S('ha13'), { light: 0.72 });
  item('<span class="hd h2">“곧 사람처럼 생각하는 기계가!”</span>', 'c', 150, S('ha13') + 0.2, S('ha14') - 0.1);
  { const sv = item(`<svg width="1300" height="430" viewBox="0 0 1300 430"><path d="M30 400 H1270" stroke="rgba(233,205,132,0.5)" stroke-width="4"/>
      <path class="up" pathLength="1" d="M40 380 C260 360 420 250 640 80" fill="none" stroke="#e9cd84" stroke-width="12" stroke-linecap="round"/>
      <path class="dn" pathLength="1" d="M640 80 C760 150 880 330 1260 380" fill="none" stroke="#8ec5ff" stroke-width="12" stroke-linecap="round"/>
      <g font-family="Pretendard" font-weight="800" font-size="36"><text x="60" y="330" fill="#f6e2a4">기대 · 연구비</text></g></svg>`, 310, 340, S('ha13') + 0.4, S('ha14') + 0.5, { anim: 'fade' });
    drawOn(sv.el.querySelector('.up'), A('ha13', '기대가', -0.6), 2.4); drawOn(sv.el.querySelector('.dn'), A('ha13b', '약속한', -0.2), 2.6); fx('buzz', A('ha13b', '줄입니다', -0.6)); }
  item('<span class="hd h3">미국 · 영국 정부도 큰돈을 댔다</span>', 330, 290, A('ha13', '미국과', -0.2), S('ha13b') - 0.1, { snd: 'pop' });
  item('<span class="hd h3">너무 느린 컴퓨터 · 부족한 자료</span>', 1040, 290, A('ha13b', '당시의', -0.2), S('ha14') - 0.1, { snd: 'tick' });
  item('<span class="hd h3 sky">→ 연구비 삭감</span>', 1330, 390, A('ha13b', '연구비', -0.3), S('ha14') - 0.1, { snd: 'tick' });
  // ha14: the lamp goes down, snow
  station(S('ha14'), { light: 0.3, snow: 1 });
  fx('wind', S('ha14') - 0.4); fx('wind', S('ha14') + 3.4);
  item('<span class="hd h0 sky" style="font-size:230px">AI의 겨울</span>', 'c', 230, A('ha14', 'AI의', -0.6), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="hd h2">1970년대 <span class="dim">·</span> 1980년대 말</span>', 'c', 560, S('ha14') + 0.5, undefined, { snd: 'tick' });
  item('<span class="sub" style="display:block;width:1920px;text-align:center">두 차례의 침체기</span>', 0, 700, A('ha14', '두 시기', -0.3));
  yearAt(S('ha14') + 0.8, 1975);

  // ================= 무엇이 AI의 겨울을 끝냈을까? =================
  station(S('hb01'), { light: 0.6, snow: 0.5 });
  item('<span class="hd h1">무엇이 이 겨울을<br><span class="brass">끝냈을까?</span></span>', 'c', 230, S('hb01') + 0.3, S('hb02') - 0.1);
  item('<span class="hd h2">겨울을 끝낸 세 가지</span>', 'c', 150, S('hb02') + 0.2);
  [['더 나은<br>학습 방법', '더 나은'], ['훨씬 많은<br>자료', '훨씬 많은'], ['훨씬 빠른<br>컴퓨터', '훨씬 빠른']].forEach(([n, ph], i) => pop(`<div class="medal" style="width:330px;height:330px;font-size:50px">${n}</div>`, 250 + i * 545, 330, A('hb02', ph, -0.2), undefined, { snd: 'hit' }));
  item('<span class="sub" style="display:block;width:1920px;text-align:center">이 세 가지가 <b>차례로</b> 갖춰졌다</span>', 0, 700, A('hb02', '이 세', -0.2));

  // 1986 backprop
  station(S('hb03'), { light: 0.85, snow: 0.15 });
  item('<span class="kick">① 학습 방법</span>', 660, 150, S('hb03') + 0.2);
  frame('hinton.jpg', 120, 170, 400, 400, S('hb03b') - 0.3, undefined, '제프리 힌턴 · 1986년 논문의 공저자', `2024년 촬영 · 사진: Arthur Petron · CC BY-SA 4.0 · ${CC}`, { pos: '50% 20%' });
  year('1986', 1400, 95, A('hb03b', '1986', -0.2), undefined, 160); yearAt(A('hb03b', '1986', 0.2), 1986);
  { const NX = [70, 290, 510, 730], NY = [[110, 220], [60, 165, 270], [60, 165, 270], [165]]; let ln = '', nd = '';
    for (let l = 0; l < 3; l++) for (const a of NY[l]) for (const b of NY[l + 1]) ln += `<path d="M${NX[l]} ${a} L${NX[l + 1]} ${b}"/>`;
    NX.forEach((x, l) => NY[l].forEach((y) => { nd += `<circle cx="${x}" cy="${y}" r="26"/>`; }));
    const sv = item(`<svg width="820" height="400" viewBox="0 0 820 400"><g stroke="rgba(233,205,132,0.55)" stroke-width="4">${ln}</g><g fill="#f4ead3">${nd}</g>
      <g font-family="Pretendard" font-weight="800" font-size="30" fill="#f4ead3" text-anchor="middle"><text x="70" y="330">첫 겹</text><text x="400" y="350">겹 · 겹 · 겹</text><text x="730" y="250">마지막 겹 (답)</text></g>
      <path class="bk" pathLength="1" d="M760 30 C560 -20 260 -20 60 30" fill="none" stroke="#e2725b" stroke-width="10" stroke-linecap="round"/><path class="hd2" d="M92 6 L56 32 L96 52" fill="none" stroke="#e2725b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" style="display:none"/></svg>`, 640, 372, A('hb03', '여러 겹', -0.4), undefined, { anim: 'fade', snd: 'tick' });
    drawOn(sv.el.querySelector('.bk'), A('hb04', '거슬러', -0.6), 1.6); show(sv.el.querySelector('.hd2'), A('hb04', '거슬러', 0.9), 'inline'); fx('dial', A('hb04', '거슬러', 0.2)); fx('dial', A('hb04', '겹마다', 0.2)); }
  item('<span class="hd h3">겹이 많을수록 어려운 문제를 푼다<br><span class="dim">하지만 가르치기 어려웠다</span></span>', 640, 200, A('hb03', '여러 겹', 0.2), S('hb03b') - 0.1);
  item('<span class="hd h3">틀린 만큼, <span class="rose">마지막 겹 → 첫 겹</span>으로</span>', 640, 262, S('hb04') + 0.2, A('hb04', '이름은', -0.2));
  item('<span class="hd h2 brass">역전파</span>', 640, 235, A('hb04', '이름은', -0.1), undefined, { anim: 'pop', snd: 'hit' });

  // 1997 Deep Blue
  station(S('hb05'));
  frame('deepblue_b.jpg', 130, 150, 310, 465, A('hb05', '1997', -0.6), undefined, 'IBM 딥 블루와 같은 기종', `사진: James the photographer · CC BY 2.0 · ${CC}`);
  year('1997', 640, 110, A('hb05', '1997', -0.2), undefined, 230); yearAt(A('hb05', '1997', 0.2), 1997);
  item('<span class="kick">전혀 다른 방식의 인공지능</span>', 650, 150, S('hb05') + 0.3, A('hb05', '1997', -0.3), { style: 'top:110px' });
  item('<span class="hd h2">딥 블루, 체스 세계 챔피언을<br>이기다</span>', 650, 400, A('hb05', '딥 블루', -0.2), S('hb06') - 0.1, { snd: 'pop' });
  [['스스로 배우는 기계 <span class="rose">×</span>', '스스로', 'buzz'], ['사람이 넣어 준 <span class="brass">규칙</span> + 빠른 <span class="brass">계산</span>', '사람이', 'tick'], ['체스 말고는 <span class="rose">못 한다</span>', '체스 말고', 'tick']].forEach(([w, ph, s], i) => item(`<span class="hd h3">${w}</span>`, 650, 410 + i * 104, A('hb06', ph, -0.2), undefined, { anim: 'left', snd: s }));

  // 2000s: data and GPUs
  station(S('hb07'));
  item('<span class="kick">② 자료 · ③ 빠른 컴퓨터</span>', 'c', 150, S('hb07') + 0.2);
  item('<span class="metal" style="font-size:210px;line-height:1">2000s</span>', 'c', 190, A('hb07', '2000년대', -0.3), S('hb08') - 0.1, { anim: 'pop', snd: 'hit' }); yearAt(A('hb07', '2000년대', 0.2), 2005);
  item('<span class="hd h2">신경망 이야기로 돌아와서</span>', 'c', 500, S('hb07') + 0.4, S('hb08') - 0.1);
  { const rr = rand(31); for (let i = 0; i < 20; i++) { const x = 150 + rr() * 560, y = 230 + rr() * 300, ro = (rr() - 0.5) * 24, ph = rr() > 0.5;
      item(ph ? `<div style="width:150px;height:110px;border:8px solid #f4ead3;background:linear-gradient(160deg,#7fb3d9,#3d6a53 60%,#2c4a3a);box-shadow:0 12px 18px rgba(0,0,0,0.5);transform:rotate(${ro.toFixed(1)}deg)"></div>` : `<div class="paper" style="width:150px;height:110px;padding:14px 16px;transform:rotate(${ro.toFixed(1)}deg)"><div class="ln" style="margin-top:0"></div><div class="ln"></div><div class="ln" style="width:60%"></div></div>`, x, y, S('hb08') + 0.2 + i * 0.13, undefined, { anim: 'drop', snd: i % 4 ? null : 'tick' }); }
    item('<span class="hd h3">인터넷 → 넘쳐나는 <span class="brass">글과 사진</span></span>', 150, 690, S('hb08') + 0.3); }
  item(`<svg width="640" height="330" viewBox="0 0 640 330"><rect x="20" y="60" width="600" height="210" rx="18" fill="#1c2a25" stroke="#d8b563" stroke-width="6"/><rect x="50" y="270" width="380" height="30" fill="#d8b563"/>
      <g fill="#0c1512" stroke="#e9cd84" stroke-width="5"><circle cx="170" cy="165" r="78"/><circle cx="430" cy="165" r="78"/></g><g stroke="#e9cd84" stroke-width="7" stroke-linecap="round"><path d="M170 100 V230 M105 165 H235 M124 119 L216 211 M216 119 L124 211"/><path d="M430 100 V230 M365 165 H495 M384 119 L476 211 M476 119 L384 211"/></g>
      <text x="320" y="42" font-family="Pretendard" font-weight="900" font-size="38" fill="#f6e2a4" text-anchor="middle">GPU</text></svg>`, 1090, 220, A('hb08', 'GPU', -0.5), undefined, { anim: 'right', snd: 'pop' });
  item('<span class="hd h3">게임 화면용 부품 <span class="brass">GPU</span><br>→ 신경망 계산도 훨씬 빠르게</span>', 1010, 580, A('hb08', '신경망 계산', -0.4), undefined, { snd: 'tick' });

  // 2012 AlexNet, deep learning
  station(S('hb09'));
  year('2012', 150, 120, A('hb09', '2012', -0.3)); yearAt(A('hb09', '2012', 0.2), 2012);
  item('<span class="hd h2">알렉스넷, 큰 차이로 우승</span>', 160, 410, A('hb09', '알렉스넷', -0.2), S('hb10') - 0.1, { snd: 'pop' });
  item('<span class="sub" style="display:block;width:760px">사진 속 물체를 알아맞히는 대회<br><span class="dim">ImageNet 대회 · 상위 5개 오답률 (낮을수록 좋음)</span></span>', 164, 560, A('hb09', '사진 속', -0.2), S('hb10') - 0.1);
  { const col = (lab, v, h, x, c, t) => { const it = item(`<div style="width:230px;text-align:center"><div class="hd h2" style="color:${c}"><span class="n">0</span>%</div><div class="b" style="width:170px;height:0;margin:10px auto 0;border-radius:10px 10px 0 0;background:linear-gradient(180deg,${c},rgba(0,0,0,0.25))"></div><div class="hd h4" style="margin-top:14px">${lab}</div></div>`, x, 0, t, undefined, { anim: 'fade', snd: 'tick' });
      const b = it.el.querySelector('.b'); count(it.el.querySelector('.n'), 0, v, t + 0.2, t + 1.4, (q) => q.toFixed(1)); let last = -1;
      live.push((tt) => { const hh = Math.round(h * out(K(tt, t + 0.2, t + 1.4))); if (hh !== last) { last = hh; b.style.height = hh + 'px'; it.el.style.top = (650 - hh - 130) + 'px'; } }); };
    col('2등', 26.2, 330, 1040, '#cfc3a6', A('hb09', '2등', -0.6)); col('알렉스넷', 15.3, 193, 1380, '#e9cd84', A('hb09', '따돌리고', -0.3)); }
  item('<span class="hd h1 brass">딥러닝</span>', 160, 400, A('hb10', '딥러닝', -0.5), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="sub" style="display:block;width:760px"><b>겹을 깊게 쌓은</b> 신경망으로 배우게 하는 방식</span>', 164, 590, S('hb10') + 0.3);

  // 2016 AlphaGo
  station(S('hb11'));
  frame('leesedol.jpg', 120, 160, 330, 330, S('hb11') + 0.2, undefined, '이세돌 9단', `2016년 촬영 · 사진: LG전자 · CC BY 2.0 · ${CC}`, { pos: '50% 30%' });
  frame('go_game4.jpg', 560, 160, 330, 362, S('hb11') + 0.6, undefined, '제4국 기보 · 이세돌이 이긴 판', `그림: Wesalius · CC BY-SA 4.0 · ${CC}`);
  year('2016', 1080, 110, A('hb11', '2016', -0.2), undefined, 230); yearAt(A('hb11', '2016', 0.2), 2016);
  item('<span class="hd h3">서울 · 2016년 3월</span>', 1090, 390, A('hb11', '서울', -0.2), undefined, { snd: 'tick' });
  item('<span class="hd h2">알파고 <span class="brass" style="font-size:150px;vertical-align:-18px">4 : 1</span></span>', 1090, 470, A('hb11', '4대 1', -0.4), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="sub" style="display:block;width:740px"><b>딥러닝</b>으로 바둑을 배운 프로그램<br><span class="dim">딥마인드 · 구글의 자회사</span></span>', 1094, 640, A('hb11', '딥마인드', -0.2), S('hb12') - 0.05);
  item('<span class="hd h4">많은 사람이 AI의 힘을<br><span class="brass">처음으로 실감한 순간</span></span>', 1090, 640, S('hb12') + 0.1, undefined, { snd: 'pop' });

  // ================= 챗GPT는 어떻게 나왔을까? =================
  station(S('hc01'));
  item('<span class="hd h2">사진도 보고, 바둑도 두지만</span>', 'c', 200, S('hc01') + 0.3, S('hc02') - 0.1);
  item('<span class="hd h1"><span class="rose">긴 글</span>에는 서툴렀다</span>', 'c', 400, A('hc01', '그런데', -0.1), S('hc02') - 0.1, { snd: 'buzz' });
  year('2017', 1090, 110, S('hc02') + 0.1, undefined, 240); yearAt(S('hc02') + 0.5, 2017);
  item(`<div class="paper" style="width:520px;height:600px;transform:rotate(-2deg)"><h5>Attention Is<br>All You Need</h5><div style="margin:22px 0 10px;display:flex;gap:12px">${Array.from({ length: 8 }, () => '<span style="width:34px;height:34px;border-radius:50%;background:#12342b;display:inline-block"></span>').join('')}</div>${Array.from({ length: 9 }, (_, i) => `<div class="ln" style="width:${[100, 96, 88, 100, 70, 100, 92, 97, 55][i]}%"></div>`).join('')}</div>`, 250, 150, S('hc02') + 0.3, undefined, { anim: 'drop', snd: 'knock' });
  item('<span class="hd h3">구글 연구자 <span class="brass">8명</span>의 논문</span>', 1100, 400, A('hc03', '여덟', -0.3), S('hc04') - 0.1, { snd: 'tick' });
  item('<span class="hd h2">“주목만 있으면 된다”</span>', 1000, 520, A('hc03', '우리말로', 0.2), S('hc04') - 0.1, { snd: 'pop' });
  item('<span class="hd h1 brass">트랜스포머</span>', 1010, 400, A('hc04', '트랜스포머', -0.3), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="sub">새로운 구조의 신경망</span>', 1018, 580, A('hc04', '새로운', -0.2));

  // attention
  station(S('hc05'));
  { const ws = ['철수가', '사과를', '먹었다.', '그것은', '달았다.'], X = [190, 500, 810, 1150, 1460];
    const its = ws.map((w, i) => item(`<span class="tile">${w}</span>`, X[i], 420, S('hc05') + 0.3 + i * 0.1, undefined, { snd: i ? null : 'tick' }));
    // hc05: one word at a time, the earlier ones fade from memory
    const t0 = A('hc05', '앞에서부터', -0.2), t1 = A('hc05', '잊어버리기', 0.4), tAll = A('hc06', '한꺼번에', -0.2);
    live.push((t) => { const p = lerp(-0.5, 4.6, K(t, t0, t1)); its.forEach((it, i) => { let o = 1; if (t >= t0 && t < tAll) o = i > p + 0.5 ? 0.18 : clamp(1 - (p - i) * 0.34, 0.12, 1); const s = o.toFixed(2); if (it.dim !== s) { it.dim = s; it.el.firstChild.style.opacity = s; } }); });
    for (let i = 0; i < 5; i++) fx('tick', lerp(t0, t1, (i + 0.5) / 5.1));
    item('<span class="hd h2">그전 방식 · <span class="dim">한 낱말씩 차례로</span></span>', 'c', 170, S('hc05') + 0.2, S('hc06') - 0.1);
    item('<span class="hd h3 rose">글이 길어지면 앞부분을 잊는다</span>', 'c', 620, A('hc05', '글이 길어지면', -0.2), S('hc06') - 0.1, { snd: 'buzz' });
    item('<span class="hd h2">트랜스포머 · <span class="brass">문장 전체를 한꺼번에</span></span>', 'c', 170, S('hc06') + 0.2, S('hc08') - 0.1);
    fx('ok', tAll);
    const cx = X.map((x, i) => x + [118, 118, 124, 118, 124][i]);
    let arcs = ''; [[0, 1], [1, 2], [0, 2], [3, 4], [2, 3], [1, 4]].forEach(([a, b]) => { const m = (cx[a] + cx[b]) / 2 - 150, h = 60 + Math.abs(b - a) * 34; arcs += `<path class="ar" pathLength="1" d="M${cx[a] - 150} 200 C${cx[a] - 150} ${200 - h} ${cx[b] - 150} ${200 - h} ${cx[b] - 150} 200"/>`; });
    const sv = item(`<svg width="1620" height="210" viewBox="0 0 1620 210"><g fill="none" stroke="rgba(233,205,132,0.6)" stroke-width="5" stroke-linecap="round">${arcs}</g><path class="key" pathLength="1" d="M${cx[3] - 150} 200 C${cx[3] - 150} 30 ${cx[1] - 150} 30 ${cx[1] - 150} 200" fill="none" stroke="#fff3c4" stroke-width="12" stroke-linecap="round"/></svg>`, 150, 215, A('hc06', '낱말마다', -0.3), S('hc08') - 0.1, { anim: 'fade' });
    [...sv.el.querySelectorAll('.ar')].forEach((p, i) => drawOn(p, A('hc06', '낱말마다', -0.2) + i * 0.18, 0.7));
    drawOn(sv.el.querySelector('.key'), A('hc07', '그것', 0.2), 1.0); fx('ok', A('hc07', '가리킨다는', -0.2));
    item('<span class="hd h2">이렇게 눈여겨보기 = <span class="brass">어텐션</span> <span class="dim">(주목)</span></span>', 'c', 600, A('hc06', '이렇게', -0.2), S('hc07') - 0.1, { snd: 'pop' });
    item('<span class="hd h2">‘그것’ → <span class="brass">사과</span></span>', 'c', 600, A('hc07', '그것', 0.4), S('hc08') - 0.1, { anim: 'pop', snd: 'pop' });
    // hc08: split across GPUs
    item('<span class="hd h2">한꺼번에 처리 → <span class="brass">여러 GPU에 나눠 맡긴다</span></span>', 'c', 170, S('hc08') + 0.2);
    for (let i = 0; i < 5; i++) pop(`<div style="width:210px;height:92px;border-radius:12px;background:#1c2a25;border:5px solid #d8b563;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:40px;color:#f6e2a4">GPU</div>`, X[i] + 14, 580, A('hc08', '여러 대', -0.3) + i * 0.12);
    item('<span class="hd h3">훨씬 큰 모델을, 훨씬 많은 글로</span>', 'c', 700, A('hc08', '훨씬 큰', -0.2), undefined, { snd: 'tick' }); }

  // 2018 GPT
  station(S('hc09'));
  year('2018', 150, 110, S('hc09') + 0.2, S('hc11') - 0.1, 230); yearAt(S('hc09') + 0.6, 2018);
  item('<span class="metal" style="font-size:330px;line-height:1">GPT</span>', 170, 380, A('hc09', '이름은', -0.2), S('hc11') - 0.1, { anim: 'pop', snd: 'hit' });
  item('<span class="sub" style="display:block;width:820px">오픈AI · 트랜스포머에게<br><b>다음 말 맞히기</b>를 학습시킨 모델</span>', 990, 220, A('hc09', '오픈AI', -0.2), S('hc10') - 0.1);
  [['G', 'enerative', '글을 만들어 내는', '글을 만들어'], ['P', 're-trained', '미리 학습해 둔', '미리'], ['T', 'ransformer', '트랜스포머', '마지막 글자']].forEach(([a, b, k, ph], i) =>
    item(`<span class="metal" style="font-size:96px;line-height:1.1">${a}</span><span class="metal" style="font-size:70px;opacity:0.8">${b}</span><span class="hd h4" style="margin-left:28px">${k}</span>`, 980, 190 + i * 170, i === 2 ? A('hc10', '마지막 글자', -0.2) : A('hc10', ph, -0.2), S('hc11') - 0.1, { anim: 'right', snd: 'tick' }));
  // hc11: 1억 → 1,750억
  item('<span class="hd h2">모델은 빠르게 커진다</span>', 'c', 150, S('hc11') + 0.2);
  item('<div style="width:14px;height:14px;border-radius:50%;background:#f6e2a4;box-shadow:0 0 16px #f6e2a4"></div>', 430, 520, A('hc11', '첫 GPT', -0.2), undefined, { anim: 'pop', snd: 'tick' });
  item('<span class="hd h3">첫 GPT (2018)<br><span class="brass">약 1억 개</span></span>', 260, 590, A('hc11', '약 1억', -0.3));
  { const big = item('<div style="width:540px;height:540px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff3c4,#d8b563 45%,#7d5d20 100%);box-shadow:0 30px 50px rgba(0,0,0,0.6)"></div>', 1050, 240, A('hc11', '2020', -0.2), undefined, { anim: 'pop', snd: 'hit', kf: [[A('hc11', '2020', -0.2), { s: 0.05 }], [A('hc11', '1,750억', 0.4), { s: 1 }]] });
    item('<span class="hd h3" style="color:#1d1508;text-shadow:none;display:block;width:540px;text-align:center">GPT-3 (2020)<br><span style="font-size:96px">1,750억 개</span></span>', 1050, 400, A('hc11', '1,750억', -0.2));
    item('<span class="note">원의 넓이 = 파라미터(다이얼) 수</span>', 260, 722, A('hc11', '약 1억', 0.4)); yearAt(A('hc11', '2020', 0.2), 2020); }

  // 2022 ChatGPT
  station(S('hc12'));
  item('<span class="metal" style="font-size:118px;line-height:1">2022. 11. 30.</span>', 150, 150, S('hc12') + 0.3, undefined, { anim: 'pop', snd: 'hit' }); yearAt(S('hc12') + 0.6, 2022);
  { const ch = item(`<div class="chat" style="width:700px"><div class="top">ChatGPT</div><div class="body" style="min-height:260px"><div class="row r" style="display:block"><span class="bub me"><span class="ty"></span><span style="opacity:0.5">|</span></span></div><div class="row"><span class="bub ai">안녕하세요! 무엇을 도와드릴까요?</span></div></div></div>`, 150, 340, A('hc12', '대화창', -0.4), undefined, { anim: 'left', snd: 'pop' });
    type(ch.el.querySelector('.ty'), '안녕?', A('hc12', '누구나', -0.2), 0.7); const r = ch.el.querySelectorAll('.row')[1]; show(r, A('hc12', '챗GPT', -0.3)); fx('pop', A('hc12', '챗GPT', -0.3)); }
  [['닷새 만에', '100만 명', '닷새', 0], ['두 달 뒤 · 한 달 사용자 (추정)', '1억 명', '두 달', 1], ['2026년 2월 · 매주 쓰는 사람', '9억 명', null, 2]].forEach(([k, v, ph, i]) => {
    const t = i === 2 ? A('hc13b', '2026', -0.2) : A('hc13', ph, -0.2);
    item(`<span class="hd h4 dim">${k}</span>`, 1010, 170 + i * 200, t, undefined, { anim: 'right' });
    item(`<span class="hd h1 brass" style="font-size:124px">${v}</span>`, 1010, 222 + i * 200, t + 0.25, undefined, { anim: 'pop', snd: 'hit' }); });
  yearAt(A('hc13b', '2026', 0.3), 2026);

  // 2023 Claude; the names
  station(S('hc14'));
  year('2023', 150, 110, A('hc14', '2023', -0.3), S('hc15') - 0.1, 230); yearAt(A('hc14', '2023', 0.2), 2023);
  { const win = (name, co, x, t, core) => { const it = item(`<div class="chat" style="width:520px"><div class="top">${name}<span style="margin-left:auto;font-weight:600;font-size:24px;opacity:0.8">${co}</span></div><div class="body" style="min-height:250px;text-align:center;padding-top:34px"><div class="in" style="display:none"><div class="medal" style="width:200px;height:200px;font-size:34px;margin:0 auto">${core}</div></div><div class="ou"><span class="bub ai">무엇을 도와드릴까요?</span></div></div></div>`, x, 390, t, undefined, { anim: 'pop', snd: 'pop' });
      const a = it.el.querySelector('.in'), b = it.el.querySelector('.ou'); show(a, A('hc15', '그 안에서', -0.2)); show(b, 0, 'block', A('hc15', '그 안에서', -0.2)); return it; };
    win('ChatGPT', 'OpenAI', 720, S('hc14') + 0.4, 'GPT 계열<br>LLM'); win('Claude', 'Anthropic', 1290, A('hc14', '클로드', -0.4), 'Claude 계열<br>LLM'); fx('ok', A('hc15', '그 안에서', -0.2)); }
  item('<span class="sub" style="display:block;width:560px">구글을 비롯한 여러 회사도<br>잇달아 <b>대화형 AI</b>를 공개</span>', 160, 480, A('hc14', '구글을', -0.2), S('hc15') - 0.1);
  item('<span class="hd h3">챗GPT · 클로드<br>= <span class="brass">서비스의 이름</span></span>', 160, 170, A('hc15', '챗GPT와', -0.2), undefined, { snd: 'tick' });
  item('<span class="hd h3">그 안에서 글을<br>만드는 것 = <span class="brass">LLM</span></span>', 160, 480, A('hc15', '그 안에서', -0.2), undefined, { snd: 'pop' });
};
