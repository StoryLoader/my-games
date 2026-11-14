/* c_agent.js — "AI 에이전트란 무엇일까?", "에이전트는 어떻게 발전했을까?", and the closing (storyboard.md).
   Exhibits: two chat windows side by side, the LLM as a brass core with its tools, the loop ring, the notebook. */
window.SEG_agent = function (G) {
  const { S, E, A, K, io, out, lerp, clamp, station, item, pop, show, cls, type, fx, count, drawOn, year, yearAt, railOn, live, rand, END } = G;
  const core = (label = 'LLM', size = 260) => `<div class="medal" style="width:${size}px;height:${size}px;font-family:var(--serif);font-size:${Math.round(size * 0.3)}px">${label}</div>`;
  // tool tokens: ivory discs with a drawn icon
  const ICON = {
    search: '<circle cx="42" cy="42" r="24" fill="none" stroke="#1d1508" stroke-width="9"/><path d="M60 60 L84 84" stroke="#1d1508" stroke-width="11" stroke-linecap="round"/>',
    calc: '<rect x="22" y="12" width="56" height="76" rx="8" fill="none" stroke="#1d1508" stroke-width="8"/><rect x="32" y="22" width="36" height="16" fill="#1d1508"/><g fill="#1d1508"><circle cx="38" cy="54" r="5"/><circle cx="62" cy="54" r="5"/><circle cx="38" cy="72" r="5"/><circle cx="62" cy="72" r="5"/></g>',
    file: '<path d="M14 28 H42 L50 38 H86 V82 H14 Z" fill="none" stroke="#1d1508" stroke-width="8" stroke-linejoin="round"/>',
    cal: '<rect x="14" y="20" width="72" height="66" rx="8" fill="none" stroke="#1d1508" stroke-width="8"/><path d="M14 42 H86 M34 10 V28 M66 10 V28" stroke="#1d1508" stroke-width="8" stroke-linecap="round"/>',
  };
  const tool = (ic, name) => `<div style="width:170px;text-align:center"><div style="width:150px;height:150px;margin:0 auto;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fffaf0,#e4d7b6 60%,#b9a67a);box-shadow:0 18px 26px rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center"><svg width="100" height="100" viewBox="0 0 100 100">${ICON[ic]}</svg></div><div class="hd h4" style="margin-top:12px">${name}</div></div>`;

  // ================= AI 에이전트란 무엇일까? =================
  station(S('ag01'));
  item(core(), 250, 300, S('ag01') + 0.3, S('ag02') + 2.0, { anim: 'pop', snd: 'pop' });
  { const rr = rand(41); for (let i = 0; i < 7; i++) { const t = A('ag01', '분명한', -0.6) + i * 0.4; item(`<span class="bub ai" style="font-size:${30 + Math.round(rr() * 12)}px">${['말', '설명', '대답', '말', '글', '조언', '말'][i]}</span>`, 560 + rr() * 380, 250 + rr() * 380, t, S('ag02') + 2.0, { anim: 'left', snd: i % 2 ? null : 'tick' }); } }
  item('<span class="hd h2">말은 잘하지만<br>할 수 있는 건 <span class="rose">말뿐</span></span>', 1010, 300, S('ag02') + 0.1, A('ag02', '이 한계를', 0.2), { snd: 'buzz' });
  item('<span class="kick">오늘의 두 번째 말</span>', 'c', 170, A('ag02', '오늘의', -0.3));
  item('<span class="hd h0" style="font-size:210px">AI <span class="brass">에이전트</span></span>', 'c', 240, A('ag02', 'AI 에이전트', -0.3), undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="metal" style="font-size:110px;line-height:1">agent</span><span class="hd h2" style="margin-left:36px">= 대리인</span>', 'c', 530, S('ag03') + 0.3, undefined, { snd: 'pop' });
  item('<span class="sub" style="display:block;width:1920px;text-align:center">누군가를 <b>대신해서 일해 주는</b> 사람</span>', 0, 690, A('ag03', '누군가를', -0.2));

  // two chat windows: talks about it vs. does it
  station(S('ag04'));
  { const L = item(`<div class="chat" style="width:780px"><div class="top">대화만 하는 LLM</div><div class="body" style="min-height:400px">
      <div class="row r"><span class="bub me">다음 주 부산 출장 기차표 좀 알아봐 줘</span></div>
      <div class="row"><span class="bub ai">기차표는 이렇게 알아보시면 됩니다.<br>① 예매 사이트에 접속하고<br>② 날짜와 출발역을 고른 뒤<br>③ 시간표를 확인하세요</span></div></div></div>`, 130, 150, S('ag04') + 0.3, undefined, { anim: 'left', snd: 'pop' });
    const r = [...L.el.querySelectorAll('.row')]; show(r[0], A('ag04', '다음 주', -0.3)); fx('tick', A('ag04', '다음 주', -0.3)); show(r[1], A('ag04', '표를 알아보는 방법', -0.3)); fx('pop', A('ag04', '표를 알아보는 방법', -0.3));
    item('<span class="hd h3 rose">실제로 알아보는 건 내 몫</span>', 160, 690, A('ag04', '실제로', -0.2), undefined, { snd: 'buzz' });
    const R = item(`<div class="chat" style="width:780px"><div class="top">AI 에이전트</div><div class="body" style="min-height:400px">
      <div class="row r" style="display:block"><span class="bub me">다음 주 부산 출장 기차표 좀 알아봐 줘</span></div>
      <div class="ok">✓ 열차 시간 검색</div><div class="ok">✓ 내 일정표 확인</div><div class="ok">✓ 맞는 표 고르기</div>
      <div class="row"><span class="bub ai">화요일 오전 9시 표가 일정에 맞습니다.<br><b>이 표로 예매할까요?</b></span></div></div></div>`, 1010, 150, S('ag05') + 0.2, undefined, { anim: 'right', snd: 'pop' });
    const ok = [...R.el.querySelectorAll('.ok')]; [['열차', -0.2], ['일정표', -0.2], ['맞는 표', -0.2]].forEach(([ph, o], i) => { show(ok[i], A('ag05', ph, o)); fx('ok', A('ag05', ph, o)); });
    const rr = R.el.querySelectorAll('.row')[1]; show(rr, A('ag05', '이 표로', -0.3)); fx('pop', A('ag05', '이 표로', -0.3));
    item('<span class="hd h3 mint">직접 알아보고, 묻는다</span>', 1040, 690, A('ag05', '이 표로', 0.5)); }

  // ① tools
  station(S('ag06'));
  item('<span class="hd h2">LLM에 더하는 세 가지 · <span class="brass">① 도구</span></span>', 'c', 150, S('ag06') + 0.2, S('ag07') - 0.1);
  item(core(), 200, 330, S('ag06') + 0.3, undefined, { anim: 'pop', snd: 'pop' });
  const TX = [1010, 1240, 1470, 1700], TY = 330;
  [['search', '검색', '검색'], ['calc', '계산', '계산'], ['file', '파일', '파일'], ['cal', '일정표', '불러 쓸']].forEach(([ic, n, ph], i) => item(tool(ic, n), TX[i] - 85, TY, A('ag06', ph, -0.2), undefined, { anim: 'pop', snd: 'pop' }));
  // the helper program between the LLM and the tools
  item('<span class="hd h2">LLM은 <span class="brass">글만</span> 만들 수 있다</span>', 'c', 150, S('ag07') + 0.2, S('ag07b') - 0.1);
  item(`<div style="width:190px;text-align:center"><svg width="170" height="170" viewBox="-85 -85 170 170"><g fill="#d8b563" stroke="#fff3c4" stroke-width="3">${Array.from({ length: 8 }, (_, i) => `<rect x="-14" y="-82" width="28" height="34" rx="5" transform="rotate(${i * 45})"/>`).join('')}<circle r="56"/></g><circle r="22" fill="#12342b"/></svg><div class="hd h4" style="margin-top:6px">심부름<br>프로그램</div></div>`, 600, 330, A('ag07', '곁에서', -0.3), undefined, { anim: 'pop', snd: 'hit' });
  item('<svg width="1300" height="20"><path d="M0 10 H1300" stroke="rgba(233,205,132,0.45)" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/></svg>', 470, 405, A('ag07', '곁에서', 0.3), undefined, { anim: 'fade' });
  item('<span class="hd h2">도구가 필요하면 → <span class="brass">정해진 형식의 글</span>로</span>', 'c', 150, S('ag07b') + 0.2, S('ag08') - 0.1);
  { const t0 = A('ag07b', '검색 도구로', -0.2), t1 = A('ag08', '알아보고', -0.1), t2 = A('ag08', '실제로', 0.4), t3 = A('ag08', '결과를', 0.2), t4 = E('ag08') - 0.6;
    item('<span class="slip">검색("부산행 열차 시간")</span>', 230, 650, t0, t3 - 0.2, { anim: 'pop', snd: 'tick', kf: [[t1 - 0.9, { x: 0, y: 0 }], [t1, { x: 300, y: 0 }], [t2 - 0.5, { x: 300, y: 0 }], [t2, { x: 640, y: 0, o: 1 }], [t2 + 0.4, { x: 640, y: 0, o: 0 }]] });
    fx('ok', t2);
    item('<span class="slip" style="background:#e3f6ea">결과: 화 09:00 · 11:30 · 14:00</span>', 880, 650, t3 - 0.1, undefined, { anim: 'pop', snd: 'pop', kf: [[t3 + 0.3, { x: 0, y: 0 }], [t4, { x: -700, y: 0 }]] });
    item('<span class="hd h2">대신 실행하고, 결과를 <span class="brass">글로 돌려준다</span></span>', 'c', 150, S('ag08') + 0.2);
    fx('ok', t4); }

  // ② loop ③ memory
  station(S('ag09'));
  item('<span class="hd h2"><span class="brass">② 반복</span> · 한 번 답하고 끝이 아니다</span>', 'c', 150, S('ag09') + 0.2, S('ag10') - 0.1);
  { const R = 172, cx = 480, cy = 520, P = [-90, 30, 150].map((d) => [cx + R * Math.cos(d * Math.PI / 180), cy + R * Math.sin(d * Math.PI / 180)]);
    item(`<svg width="700" height="560" viewBox="130 210 700 560"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(233,205,132,0.5)" stroke-width="8" stroke-dasharray="6 20" stroke-linecap="round"/></svg>`, 130, 210, S('ag09') + 0.3, undefined, { anim: 'fade' });
    [['생각', '생각하고'], ['도구 쓰기', '도구를 쓰고'], ['결과 살피기', '결과를']].forEach(([n, ph], i) => pop(`<div class="medal" style="width:170px;height:170px;font-size:33px">${n}</div>`, P[i][0] - 85, P[i][1] - 85, A('ag09', ph, -0.2), undefined, { style: 'z-index:2' }));
    const mk = item('<div style="width:44px;height:44px;border-radius:50%;background:#fff3c4;box-shadow:0 0 26px 8px rgba(255,226,160,0.85)"></div>', cx - 22, cy - 22, A('ag09', '생각하고', 0.2), undefined, { anim: 'fade' });
    const tA = A('ag09', '생각하고', 0.2), tB = S('ag11') - 0.3; let last = '';
    live.push((t) => { const a = (-90 + 360 * 4.5 * K(t, tA, tB)) * Math.PI / 180, v = `${(R * Math.cos(a)).toFixed(1)}px,${(R * Math.sin(a)).toFixed(1)}px`; if (v !== last) { last = v; mk.el.firstChild.style.transform = `translate(${v})`; } });
    item('<span class="hd h3">목표를 이룰 때까지<br><span class="brass">이 고리를 계속 돈다</span></span>', 800, 430, A('ag09', '목표를', -0.2), S('ag10') - 0.7, { snd: 'tick' }); }
  item('<span class="hd h2"><span class="brass">③ 기억</span> · 적어 두고 다시 읽는다</span>', 'c', 150, S('ag10') + 0.2);
  { const nb = item(`<div class="paper" style="width:620px;height:400px;padding:34px 40px;transform:rotate(1.5deg);background:repeating-linear-gradient(180deg,#fbf7ec 0 63px,#c9d6e6 63px 66px)"><div style="font-weight:900;font-size:40px;line-height:66px;color:#7d5d20">수첩</div>${['· 부산행 열차 시간 검색함', '· 화 09:00 / 11:30 / 14:00', '· 일정표: 화 오후에 회의', '→ 09:00 표가 맞음'].map((w) => `<div class="nl" style="display:none;font-weight:700;font-size:36px;line-height:66px">${w}</div>`).join('')}</div>`, 1080, 300, S('ag10') - 0.6, undefined, { anim: 'right', snd: 'knock' });
    [...nb.el.querySelectorAll('.nl')].forEach((el, i) => { const t = A('ag10', '무엇을 했고', -0.2) + i * 0.9; show(el, t); fx('tick', t); }); }

  // the whole agent
  station(S('ag11'));
  item('<span class="kick">정리</span>', 'c', 150, S('ag11') + 0.2);
  item(core('LLM', 280), 200, 290, S('ag11') + 0.3, undefined, { anim: 'pop', snd: 'pop' });
  item('<span class="hd h4" style="display:block;width:280px;text-align:center">두뇌</span>', 200, 600, A('ag11', '두뇌라면', -0.3));
  item('<span class="hd h1 dim">+</span>', 540, 350, A('ag11', '손발과', -0.4));
  [['search', '검색'], ['file', '파일']].forEach(([ic, n], i) => item(tool(ic, n), 680 + i * 200, 300, A('ag11', '손발과', -0.3) + i * 0.15, undefined, { anim: 'pop', snd: 'pop' }));
  item('<span class="hd h4" style="display:block;width:370px;text-align:center">손발 <span class="dim">(도구)</span></span>', 680, 600, A('ag11', '손발과', 0.1));
  item('<div class="paper" style="width:200px;height:230px;padding:22px 24px;transform:rotate(3deg)"><div class="ln" style="margin-top:0"></div><div class="ln"></div><div class="ln" style="width:70%"></div><div class="ln"></div><div class="ln" style="width:50%"></div></div>', 1130, 300, A('ag11', '수첩을', -0.3), undefined, { anim: 'pop', snd: 'pop' });
  item('<span class="hd h4" style="display:block;width:300px;text-align:center">수첩 <span class="dim">(기억)</span></span>', 1080, 600, A('ag11', '수첩을', 0.1));
  item('<svg width="230" height="230" viewBox="0 0 230 230"><path d="M190 115 A75 75 0 1 1 150 49" fill="none" stroke="#e9cd84" stroke-width="16" stroke-linecap="round"/><path d="M128 20 L158 50 L122 76" fill="none" stroke="#e9cd84" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 1500, 300, A('ag11', '일이 끝날', -0.3), undefined, { anim: 'pop', snd: 'pop' });
  item('<span class="hd h4" style="display:block;width:420px;text-align:center">반복 <span class="dim">(끝날 때까지)</span></span>', 1405, 600, A('ag11', '일이 끝날', 0.1));
  item('<span class="hd h2">= <span class="brass">AI 에이전트</span></span>', 'c', 672, A('ag11', '스스로', -0.2), undefined, { anim: 'pop', snd: 'hit' });

  // ================= 에이전트는 어떻게 발전했을까? =================
  railOn.push([S('ah02') - 0.3, S('ed01') - 0.3]);
  station(S('ah01'));
  item('<span class="hd h1">챗GPT 이후,<br>불과 <span class="brass">몇 해</span> 사이</span>', 'c', 230, S('ah01') + 0.3, S('ah02') - 0.1);
  year('2023', 150, 110, S('ah02') + 0.1, undefined, 230); yearAt(S('ah02') + 0.4, 2023);
  item(core('LLM', 220), 170, 440, S('ah02') + 0.4, S('ah03') - 0.1, { anim: 'pop', snd: 'pop' });
  { const sv = item('<svg width="420" height="60"><path class="p" pathLength="1" d="M0 30 H400" fill="none" stroke="#fff3c4" stroke-width="10" stroke-linecap="round"/></svg>', 400, 520, A('ah02', '불러 쓸', -0.3), S('ah03') - 0.1, { anim: 'fade' }); drawOn(sv.el.querySelector('.p'), A('ah02', '불러 쓸', -0.2), 0.9); fx('ok', A('ah02', '불러 쓸', 0.7)); }
  item(`<div style="width:300px;height:220px;border-radius:18px;background:#1c2a25;border:6px solid #d8b563;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:40px;color:#f6e2a4;line-height:1.3">바깥 프로그램의<br>기능</div>`, 820, 440, A('ah02', '바깥', -0.3), S('ah03') - 0.1, { anim: 'pop', snd: 'pop' });
  item('<span class="hd h2"><span class="brass">도구 연결</span>의 시작</span>', 1180, 250, A('ah02', '도구 연결', -0.3), S('ah03') - 0.1, { snd: 'tick' });
  item('<span class="sub">오픈AI · 2023년 6월</span>', 1186, 400, A('ah02', '도구 연결', 0.1), S('ah03') - 0.1);
  item('<span class="hd h2">목표만 주면 <span class="brass">스스로</span> 쪼개서 실행</span>', 760, 170, S('ah03') + 0.2, undefined, { snd: 'pop' });
  { const sv = item('<svg width="1080" height="330" viewBox="0 0 1080 330"><path class="p" pathLength="1" d="M30 280 C200 280 230 110 380 110 C520 110 520 250 420 250 C320 250 330 120 470 110 C620 100 640 250 540 250 C450 250 460 130 600 120 C760 110 800 240 700 250" fill="none" stroke="#e2725b" stroke-width="10" stroke-linecap="round"/><circle cx="1010" cy="70" r="34" fill="none" stroke="#7fd6a8" stroke-width="10"/><text x="1010" y="150" font-family="Pretendard" font-weight="800" font-size="32" fill="#7fd6a8" text-anchor="middle">목표</text></svg>', 760, 380, A('ah03', '스스로', -0.2), undefined, { anim: 'fade' });
    drawOn(sv.el.querySelector('.p'), A('ah03', '금방', -0.4), 4.2); fx('buzz', A('ah03', '되풀이', 0.2)); }
  item('<span class="hd h3 rose">길을 잃고, 같은 일을 되풀이</span>', 760, 700, A('ah03', '금방', -0.2));

  // 2024: computer use, the common standard
  station(S('ah04'));
  year('2024', 150, 110, S('ah04') + 0.2, undefined, 230); yearAt(S('ah04') + 0.5, 2024);
  { const mon = item(`<div style="width:700px;height:370px;border-radius:18px;background:#0f141b;border:10px solid #2b3038;box-shadow:0 30px 50px rgba(0,0,0,0.6);position:relative;overflow:hidden">
      <div style="position:absolute;left:30px;top:30px;width:640px;height:46px;border-radius:8px;background:#1f2731"></div><div style="position:absolute;left:30px;top:100px;width:400px;height:22px;border-radius:6px;background:#2a3542"></div><div style="position:absolute;left:30px;top:140px;width:520px;height:22px;border-radius:6px;background:#2a3542"></div>
      <div class="btn" style="position:absolute;left:420px;top:240px;width:220px;height:86px;border-radius:14px;background:#2f6fed;color:#fff;font-weight:800;font-size:36px;display:flex;align-items:center;justify-content:center">예매하기</div>
      <svg class="cur" width="54" height="64" viewBox="0 0 54 64" style="position:absolute;left:90px;top:120px"><path d="M4 4 L4 52 L18 40 L28 60 L38 55 L28 36 L46 36 Z" fill="#fff" stroke="#000" stroke-width="4" stroke-linejoin="round"/></svg></div>`, 150, 385, S('ah04') + 0.4, S('ah05') - 0.1, { anim: 'left', snd: 'pop' });
    const cur = mon.el.querySelector('.cur'), btn = mon.el.querySelector('.btn'), t0 = A('ah04', '마우스와', -0.6), t1 = A('ah04', '직접 다루는', 0.2); let last = '';
    live.push((t) => { const k = io(K(t, t0, t1)), v = `translate(${(420 * k).toFixed(1)}px,${(160 * k).toFixed(1)}px)`; if (v !== last) { last = v; cur.style.transform = v; } const p = t >= t1 + 0.1 && t < t1 + 0.5 ? '0.7' : '1'; if (btn.style.opacity !== p) btn.style.opacity = p; }); fx('tick', t1 + 0.1); }
  item('<span class="hd h2">화면을 보면서<br><span class="brass">마우스 · 키보드</span>를 직접</span>', 960, 400, A('ah04', '화면을', -0.2), S('ah05') - 0.1, { snd: 'tick' });
  item('<span class="sub">앤트로픽 · 클로드 · 2024년 10월</span>', 966, 660, A('ah04', '화면을', 0.3), S('ah05') - 0.1);
  item('<span class="hd h2">도구를 연결하는 <span class="brass">공통 규격</span></span>', 760, 150, S('ah05') + 0.2, undefined, { snd: 'pop' });
  item('<span class="metal" style="font-size:150px;line-height:1">MCP</span>', 1150, 285, S('ah05') + 0.6, undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="note" style="display:block;width:420px">Model Context Protocol<br>앤트로픽 · 2024년 11월</span>', 1156, 440, S('ah05') + 0.9);
  // one tool, many AIs
  { const X0 = 400, Y0 = 620; item(`<div style="width:210px;height:120px;border-radius:14px;background:radial-gradient(circle at 34% 28%,#fffaf0,#e4d7b6 60%,#b9a67a);color:#1d1508;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:38px;box-shadow:0 18px 26px rgba(0,0,0,0.55)">도구 하나</div>`, 150, Y0 - 60 - 90, A('ah05', '도구를 한 번', -0.3), undefined, { anim: 'pop', snd: 'pop', style: 'top:520px' });
    const sv = item(`<svg width="900" height="330" viewBox="0 0 900 330"><g fill="none" stroke="#fff3c4" stroke-width="8" stroke-linecap="round"><path class="p" pathLength="1" d="M0 165 C200 165 300 50 520 50"/><path class="p" pathLength="1" d="M0 165 H520"/><path class="p" pathLength="1" d="M0 165 C200 165 300 280 520 280"/></g></svg>`, 370, 415, A('ah05', '여러 AI', -0.5), undefined, { anim: 'fade' });
    [...sv.el.querySelectorAll('.p')].forEach((p, i) => drawOn(p, A('ah05', '여러 AI', -0.4) + i * 0.15, 0.8));
    ['AI A', 'AI B', 'AI C'].forEach((n, i) => pop(`<div class="medal" style="width:104px;height:104px;font-size:28px">${n}</div>`, 900, 413 + i * 115, A('ah05', '여러 AI', 0.1) + i * 0.15));
    item('<span class="hd h3">한 번 만들면<br>여러 AI에 연결</span>', 1150, 560, A('ah05', '여러 AI', 0.3)); }

  // 2025: products
  station(S('ah06'));
  year('2025', 150, 110, S('ah06') + 0.2, undefined, 230); yearAt(S('ah06') + 0.5, 2025);
  item('<span class="hd h2">에이전트가 <span class="brass">본격적인 제품</span>으로</span>', 760, 170, S('ah06') + 0.4, undefined, { snd: 'pop' });
  { const tm = item(`<div class="term" style="width:780px"><div class="top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span style="margin-left:10px">Claude Code — 개발자의 컴퓨터</span></div><div class="body" style="min-height:250px;font-size:29px">
      <div class="ln am" style="display:block">&gt; <span class="ty"></span></div><div class="ln cm">● 파일 읽기 · login.js</div><div class="ln cm">● 코드 고치기</div><div class="ln cm">● 프로그램 실행 · 테스트</div><div class="ln ok">✔ 통과했습니다</div></div></div>`, 150, 385, A('ah06', '클로드 코드', -0.4), S('ah07') - 0.1, { anim: 'left', snd: 'pop' });
    type(tm.el.querySelector('.ty'), '로그인이 안 되는 문제 고쳐 줘', A('ah06', '클로드 코드', 0.1), 1.6);
    const ln = [...tm.el.querySelectorAll('.ln')].slice(1); [A('ah06', '파일을', -0.2), A('ah06', '고치고', -0.3), A('ah06', '프로그램을', -0.2), A('ah06', '코드를 짜', -0.2)].forEach((t, i) => { show(ln[i], t); fx(i === 3 ? 'ok' : 'tick', t); }); }
  item('<span class="hd h3">앤트로픽 ·<br><span class="brass">클로드 코드</span></span><br><span class="sub" style="display:block;width:800px;margin-top:14px">파일을 고치고, 프로그램을 실행하고,<br>코드를 짠다</span>', 1010, 400, A('ah06', '앤트로픽의', -0.2), S('ah07') - 0.1);
  { const w = item(`<div style="width:780px;height:360px;border-radius:18px;background:#f4f1ea;box-shadow:0 30px 56px rgba(0,0,0,0.65),0 0 0 3px rgba(233,205,132,0.45);overflow:hidden;position:relative">
      <div style="height:58px;background:#d9d4c8;display:flex;align-items:center;gap:10px;padding:0 18px"><span style="width:14px;height:14px;border-radius:50%;background:#9a958a"></span><span style="width:14px;height:14px;border-radius:50%;background:#9a958a"></span><span style="flex:1;height:32px;border-radius:16px;background:#fff;margin-left:10px"></span></div>
      ${['#7fb3d9', '#e2a35b', '#8fcf9d'].map((c, i) => `<div class="pg" style="position:absolute;left:0;right:0;top:58px;bottom:0;background:linear-gradient(160deg,${c},#f4f1ea 70%);display:none"><div style="margin:36px 40px;font-weight:900;font-size:44px;color:#1b1f27">${['열차 시간표', '숙소 예약', '일정 정리'][i]}</div><div style="margin:0 40px;height:20px;width:60%;border-radius:8px;background:rgba(27,31,39,0.2)"></div><div style="margin:18px 40px;height:20px;width:80%;border-radius:8px;background:rgba(27,31,39,0.2)"></div></div>`).join('')}</div>`, 150, 385, S('ah07') + 0.2, undefined, { anim: 'left', snd: 'pop' });
    const pg = [...w.el.querySelectorAll('.pg')]; const t0 = A('ah07', '웹사이트를', -0.3); pg.forEach((el, i) => { show(el, t0 + i * 1.3, 'block', i < 2 ? t0 + (i + 1) * 1.3 : 1e9); fx('tick', t0 + i * 1.3); }); show(pg[0], S('ah07') + 0.2, 'block', t0 + 1.3); }
  item('<span class="hd h3">오픈AI ·<br><span class="brass">챗GPT 에이전트</span></span><br><span class="sub" style="display:block;width:800px;margin-top:14px">오픈AI 쪽에 마련된 컴퓨터에서<br>웹사이트를 다니며 일을 처리</span>', 1010, 400, S('ah07') + 0.4);

  // 2026: now
  station(S('ah08'));
  year('2026', 150, 110, S('ah08') + 0.2, undefined, 230); yearAt(S('ah08') + 0.5, 2026);
  { const ck = item(`<svg width="330" height="330" viewBox="-165 -165 330 330"><circle r="150" fill="#f4ead3" stroke="#d8b563" stroke-width="14"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-5" y="-136" width="10" height="26" fill="#1d1508" transform="rotate(${i * 30})"/>`).join('')}<rect class="h" x="-8" y="-84" width="16" height="92" rx="8" fill="#1d1508"/><rect class="m" x="-5" y="-122" width="10" height="130" rx="5" fill="#b3541e"/><circle r="12" fill="#1d1508"/></svg>`, 200, 400, S('ah08') + 0.4, S('ah09') - 0.1, { anim: 'pop', snd: 'pop' });
    const h = ck.el.querySelector('.h'), m = ck.el.querySelector('.m'), t0 = S('ah08') + 0.6, t1 = E('ah08'); let last = -1;
    live.push((t) => { const k = Math.round(K(t, t0, t1) * 1440); if (k !== last) { last = k; m.setAttribute('transform', `rotate(${k})`); h.setAttribute('transform', `rotate(${(k / 12).toFixed(1)})`); } }); for (let i = 0; i < 4; i++) fx('tick', t0 + 0.4 + i * 1.1); }
  item('<span class="hd h2">사람이 <span class="brass">몇 시간</span>을 들여야<br>하는 일도 맡는다</span>', 760, 420, A('ah08', '사람이', -0.2), S('ah09') - 0.1);
  item('<span class="hd h2">이 영상도<br><span class="brass">AI 에이전트</span>가 만들었다</span>', 760, 130, S('ah09') + 0.2, undefined, { snd: 'pop' });
  [['자료 조사', '자료 조사'], ['대본', '대본과'], ['화면', '화면까지']].forEach(([n, ph], i) => { const t = A('ah09', ph, -0.2);
    item(`<div class="paper" style="width:330px;height:280px;padding:26px 34px;transform:rotate(${[-3, 1.5, -1][i]}deg)"><div style="font-weight:900;font-size:46px">${n}</div><div class="ln"></div><div class="ln" style="width:80%"></div><div class="ln"></div><div class="ln" style="width:60%"></div><div style="margin-top:18px;font-weight:900;font-size:56px;color:#1c7a4a">✓</div></div>`, 260 + i * 480, 420, t, undefined, { anim: 'drop', snd: 'ok' }); });

  // ================= 그래서 어떻게 써야 할까? =================
  station(S('ed01'));
  item('<span class="hd h2">LLM과 에이전트를 쓸 때<br><span class="brass">기억해 둘 세 가지</span></span>', 'c', 240, S('ed01') + 0.3, S('ed02') - 0.1);
  [['1', '중요한 숫자와 사실은<br><span class="brass">다시 확인</span>', 'LLM은 그럴듯한 말을 만드는 기계', 'ed02'], ['2', '되돌리기 어려운 일은<br><span class="brass">실행 전에 사람이 확인</span>', '돈 쓰기 · 메시지 보내기 · 파일 지우기', 'ed03'], ['3', '구체적으로 시키기<br><span class="brass">무엇을 · 왜 · 어떤 결과</span>', '잘 시키는 것이 실력', 'ed04']].forEach(([n, h, d, id], i) => {
    const y = 160 + i * 205, t = S(id) + 0.2;
    item(`<span class="metal" style="font-size:190px;line-height:0.9">${n}</span>`, 210, y, t, undefined, { anim: 'pop', snd: 'hit' });
    item(`<span class="hd h3">${h}</span>`, 400, y + 2, t + 0.3);
    item(`<span class="note" style="font-size:36px">${d}</span>`, 1220, y + 58, t + 0.8, undefined, { anim: 'right' }); });

  station(S('ed05'));
  item('<span class="metal" style="font-size:210px;line-height:1">LLM</span>', 170, 150, A('ed05', 'LLM은', -0.3), S('ed06') - 0.1, { anim: 'pop', snd: 'hit' });
  item('<span class="hd h3">다음 말을 맞히면서<br><span class="brass">글을 만드는 프로그램</span></span>', 760, 190, A('ed05', '다음 말을', -0.2), S('ed06') - 0.1);
  item('<span class="hd h0" style="font-size:130px">AI 에이전트</span>', 170, 470, A('ed05', 'AI 에이전트는', -0.3), S('ed06') - 0.1, { anim: 'pop', snd: 'hit' });
  item('<span class="hd h3">그 LLM에 <span class="brass">도구 · 반복 · 기억</span>을 더해<br>일을 맡길 수 있게 한 것</span>', 880, 480, A('ed05', '도구와', -0.3), S('ed06') - 0.1);
  item('<span class="metal" style="font-size:230px;line-height:1">1950 <span style="font-size:150px">→</span> 2026</span>', 'c', 190, S('ed06') + 0.2, undefined, { anim: 'pop', snd: 'hit' });
  item('<span class="hd h2">튜링의 질문에서, <span class="brass">누구나 쓰는 일상</span>으로</span>', 'c', 480, A('ed06', '이제', -0.3));
  fx('bell', E('ed06') + 0.7);
  item('<div class="foot" style="margin:0 auto">사진: Wikimedia Commons (각 장면의 명판에 저작자 · 라이선스 표기) · 수치와 연도의 출처는 영상 설명 참조 · 점수 · 예시 문장은 설명용<br>로고는 쓰지 않았습니다 · 효과음은 코드로 합성 · 이 영상은 AI 에이전트(Claude Code)로 제작했습니다</div>', 'c', 660, END - 6.5, undefined, { anim: 'fade' });
};
