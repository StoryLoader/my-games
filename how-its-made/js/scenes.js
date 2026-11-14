/*
 * scenes.js — 「이 영상은 이렇게 만들었습니다」 (storyboard.md): a follow-along tutorial for making the narrated video
 * 「반도체 vs 우주선」 with the Claude Code CLI in a terminal and the script-to-motion skill.
 * The finished video (excerpts rendered from ../chip-vs-rocket by render.py) plays in a monitor at the start and the end.
 * Terminal and search screens are reconstructions: real commands, summarized output, no logos, no secrets.
 * Everything on screen is a pure function of t (typed text = a substring whose length depends on t).
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data } = ctx;
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

  const ui = document.getElementById('ui'), items = [], reveals = [], typed = [], classAt = [], live = [], keysT = [], stepsT = [], popsT = [];
  function item(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
    el.style.top = y + 'px'; if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
    ui.appendChild(el); const it = { el, t0, t1, anim: o.anim || 'rise', last: '' }; items.push(it); return it;
  }
  const pop = (html, x, y, t0, t1, o = {}) => item(html, x, y, t0, t1, { anim: 'pop', ...o });
  const X = 110;
  /** left column: a step badge, a headline, a line or two */
  const left = (badge, head, sub, t0, t1, y = 230) => item(`${badge ? `<span class="step">${badge}</span><br>` : ''}<span class="hd" style="display:inline-block;margin-top:18px;white-space:normal;max-width:680px;font-size:70px;line-height:1.18">${head}</span>${sub ? `<br><span class="sub" style="display:inline-block;margin-top:14px">${sub}</span>` : ''}`, X, y, t0, t1);
  const show = (el, at, disp = 'block', until = 1e9) => reveals.push({ el, at, disp, until, last: null });
  const type = (el, text, at, dur) => { typed.push({ el, text, at, dur: dur || Math.min(2.6, 0.35 + text.length * 0.035), last: -1 }); keysT.push(at); };

  /** a terminal window. lines: [at, cls, text, typedDur?] — cls: cmd | ask | out | ok | note | big; typedDur 0 = appears whole */
  function term(x, y, w, h, title, t0, t1, lines) {
    const it = item(`<div class="top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="ttl">${title}</span><span class="re">재현 화면</span></div><div class="body"></div>`, x, y, t0, t1, { cls: 'win term', anim: 'win', style: `width:${w}px;height:${h}px` });
    const body = it.el.querySelector('.body');
    for (const [at, cls, text, dur, until] of lines) { const ln = document.createElement('div'); ln.className = 'ln ' + cls; const tx = document.createElement('span'); ln.appendChild(tx); body.appendChild(ln); show(ln, at, 'block', until);
      if (cls === 'cmd' || cls === 'ask') type(tx, text, at, dur); else tx.textContent = text; }
    return it;
  }
  /** a light window (browser, editor, panel): html goes in the body */
  function paper(x, y, w, h, title, addr, t0, t1, html) {
    return item(`<div class="top"><span class="dot"></span><span class="dot"></span><span class="dot"></span>${addr ? `<span class="addr">${addr}</span>` : `<span class="ttl">${title}</span>`}<span class="re">재현 화면</span></div><div class="body">${html}</div>`, x, y, t0, t1, { cls: 'win paper', anim: 'win', style: `width:${w}px;height:${h}px` });
  }
  /** the finished video in a monitor: clips = [[key, start, dur, showUntil]] */
  function monitor(x, y, w, t0, t1, clips) {
    const h = Math.round(w * 9 / 16); const it = item(`<div class="screen" style="width:${w}px;height:${h}px"></div>`, x, y, t0, t1, { cls: 'monitor', anim: 'win' });
    const scr = it.el.querySelector('.screen'); for (const [key, start, dur, until] of clips) M.clip(scr, key, { x: 0, y: 0, w, h, start, dur, show: [start, until] }); return it;
  }
  const WX = 800, WY = 190, WW = 1040, WH = 720;

  // ================= step bar =================
  const PILLS = [['준비', 'pr01'], ['① 찾기', 'gh01'], ['② 설치', 'in01'], ['스킬 소개', 'sk01'], ['③ 주문', 'rq01'], ['원리', 'pp01'], ['④ 내보내기', 'ex01']];
  const bar = item(PILLS.map(([n]) => `<span class="p">${n}</span>`).join(''), 0, 34, S('pr01') - 0.3, S('ed01') + 0.2, { cls: 'bar', style: 'right:0' });
  const pills = [...bar.el.querySelectorAll('.p')]; let barKey = -1;
  PILLS.forEach(([, id]) => stepsT.push(S(id)));

  // ================= opening: the finished video =================
  const tA = S('op01') - 0.4, dA = Math.min(6.0, S('op02') - tA), dB = Math.min(7.0, S('op03') - S('op02')), dC = Math.min(7.0, S('op04') - S('op03'));
  monitor(264, 132, 1360, 0, S('op04') - 0.05, [['demo_a', tA, dA, S('op02')], ['demo_b', S('op02'), dB, S('op03')], ['demo_c', S('op03'), dC, S('op04') + 0.5]]);
  item('<span class="tagline">완성된 영상 · 「반도체 vs 우주선, 무엇이 더 어려울까?」 · 6분 23초</span>', 'c', 56, 0.4, S('op04') - 0.05);
  left('', '편집 프로그램은<br><span class="c-red">한 번도</span> 열지 않았다', '한 일은 <b>터미널</b>에 글 몇 줄을 입력한 것', S('op04') + 0.1, S('op05') - 0.05, 300);
  term(WX, 260, WW, 420, '터미널 — 글자로 명령을 내리는 창', S('op04') + 0.2, S('op05') - 0.05, [[A('op04', '글 몇 줄', -0.6), 'ask', '주제 : 반도체 기술 vs 우주선 기술, 무엇이 더 어려운가?', 2.2]]);
  item('<span class="hd h2">오늘의 순서</span>', 'c', 170, S('op05') + 0.1, S('pr01') - 0.1);
  const ROAD = [['1', '스킬 찾기', '깃허브에서 고르기', '찾고'], ['2', '설치', '폴더에 내려받기', '설치'], ['3', '영상 주문', '평소 말하듯 적기', '주문'], ['4', '내보내기', '확인하고 MP4로', '주문'], ['＋', '원리', '왜 이게 될까?', '원리']];
  ROAD.forEach(([n, t, d, ph], i) => pop(`<div class="rc"><span class="n">${n}</span><span class="t">${t}</span><span class="d">${d}</span></div>`, 95 + i * 350, 400, i === 3 ? A('op06', '주문', 0.9) : A('op06', ph, -0.25), S('pr01') - 0.1));

  // ================= 준비물 =================
  left('준비물', 'Claude Code', '터미널에서 돌아가는 <b>AI 도구</b>', S('pr01') + 0.1, S('pr03') - 0.05);
  term(WX, WY, WW, WH, '터미널', S('pr01') + 0.3, S('pr05') - 0.05, [
    [S('pr01') + 1.0, 'out', '# 터미널 = 글자로 명령을 내리는 창'],
    [A('pr02', '화면의 명령', -0.4), 'cmd', 'curl -fsSL https://claude.ai/install.sh | bash', 2.2],
    [E('pr02') - 0.6, 'out', '→ Claude Code 설치 (맥 · 리눅스 · WSL)'],
    [A('pr03', '윈도우라면', -0.2), 'out', '# 윈도우: 먼저 PowerShell에서 WSL 켜기'],
    [A('pr03', 'WSL', -0.2), 'out', '#   wsl --install  → 그 안에서 위 명령'],
    [A('pr04', 'claude라고', -0.5), 'cmd', 'claude', 0.6],
    [A('pr04', '로그인', -0.3), 'out', '→ 처음 실행하면 로그인 안내'],
  ]);
  left('준비물', '맥 · 리눅스는 그대로<br>윈도우는 <span class="c-blue">WSL</span> 안에서', 'WSL = 윈도우 안에서 리눅스를 쓰는 기능<span class="src">script-to-motion은 macOS · Linux 기준 (스킬 README)</span>', S('pr03') + 0.1, S('pr04') - 0.05);
  left('준비물', '<span class="mono">claude</span> 실행 → 로그인', 'Claude <b>유료 요금제</b> 또는 <b>API 요금</b>이 필요', S('pr04') + 0.1, S('pr05') - 0.05);
  left('준비물', '함께 필요한<br>프로그램 네 가지', '영상을 그리고 파일로 굽는 데 쓴다<span class="src">없으면 Claude에게 “설치를 도와줘”</span>', S('pr05') + 0.1, S('gh01') - 0.05);
  term(WX, WY, WW, WH, '터미널 — 깔려 있는지 확인', S('pr05') + 0.2, S('gh01') - 0.05, [
    [A('pr05', 'Node.js', -0.3), 'cmd', 'node -v', 0.5], [A('pr05', 'Python', -0.3), 'cmd', 'python3 --version', 0.6], [A('pr05', 'ffmpeg', -0.3), 'cmd', 'ffmpeg -version', 0.6],
    [A('pr05', 'Chrome', 0.2), 'out', '→ 버전 번호가 나오면 준비 완료'], [A('pr05', 'Chrome', 0.5), 'out', '→ Chrome 브라우저도 필요'],
  ]);

  // ================= STEP 1: 깃허브에서 스킬 찾기 =================
  left('STEP 1', '깃허브에서<br>스킬 찾기', '스킬 = AI에게 주는 <b>작업 설명서</b>', S('gh01') + 0.1, S('gh03') - 0.05);
  const tree1 = paper(WX, WY, WW, WH, '스킬 폴더의 모습', '', S('gh01') + 0.4, S('gh03') - 0.05, `<div class="tree"><div class="f"><b>script-to-motion/</b></div><div class="f">├ <b>SKILL.md</b><span>무엇을 · 어떤 순서로 · 어떤 도구로</span></div><div class="f">├ <b>README.md</b><span>사람이 읽는 설명서</span></div><div class="f">├ <b>scripts/</b><span>녹음 · 검사 · 굽기 도구</span></div><div class="f">├ <b>references/</b><span>세부 지침 문서</span></div><div class="f">└ <b>assets/</b><span>글꼴 · 기본 틀</span></div></div>`);
  { const f = [...tree1.el.querySelectorAll('.f')]; f.forEach((el, i) => show(el, S('gh01') + 1.0 + i * 0.35)); classAt.push({ el: f[1], name: 'hl', at: A('gh02', 'SKILL.md', -0.3) }); }
  left('STEP 1', '검색어는<br><span class="mono c-blue">claude skill</span><br>＋ 하고 싶은 일', '영어로 적는다<span class="src">깃허브 = 프로그램과 자료를 올려 나누는 사이트</span>', S('gh03') + 0.1, S('gh05') - 0.05, 200);
  const br = paper(WX, 170, WW, 760, '', 'github.com/search?q=claude+skill+motion+graphics+video', S('gh03') + 0.3, S('in01') - 0.05,
    `<div class="search"><span class="q"></span></div><div class="count" style="visibility:hidden">저장소 170개 · 2026-11-14 기준 · 아래는 그중 일부</div>
     <div class="repo"><div><span class="nm">bangtutorial/bang-motion</span><span class="ds">Agent skill for browser motion graphics</span></div><span class="st">★ 2,124</span></div>
     <div class="repo"><div><span class="nm">haidrrrry/claude-remotion-skill</span><span class="ds">Claude agent skill to create and edit videos</span></div><span class="st">★ 992</span></div>
     <div class="repo"><div><span class="nm">charlie947/motion-graphics-skills</span><span class="ds">Claude Code skills for motion graphics</span></div><span class="st">★ 668</span></div>
     <div class="repo"><div><span class="nm">kstost/script-to-motion</span><span class="ds">대본·주제 → 내레이션이 입혀진 모션그래픽 영상 · MIT · 최근 수정 2026-11-10</span></div><span class="st">★ 42</span></div>`);
  { const el = br.el; type(el.querySelector('.q'), 'claude skill motion graphics video', A('gh03', '검색창', 0.2), 1.8);
    const cnt = el.querySelector('.count'); live.push((t) => { const v = t >= S('gh04') + 0.2 ? 'visible' : 'hidden'; if (cnt.style.visibility !== v) cnt.style.visibility = v; });
    [...el.querySelectorAll('.repo')].forEach((r, i) => { show(r, S('gh04') + 0.5 + i * 0.3, 'flex'); if (i === 3) classAt.push({ el: r, name: 'pick', at: A('gh06', 'script-to-motion', -0.3) }); }); }
  item('<span class="src" style="margin:0">터미널에서 검색하려면</span><span class="code" style="margin-top:10px">gh search repos "claude skill motion graphics video"</span>', X, 730, A('gh04', '터미널', -0.3), S('gh05') - 0.05);
  left('STEP 1', '고르는 기준 네 가지', '', S('gh05') + 0.1, S('gh06') - 0.05, 200);
  [['설명서(README)가 충실한가', '설명서'], ['최근에 고쳐졌는가', '최근'], ['라이선스가 무엇인가', '라이선스'], ['내 목적에 맞는가', '목적']].forEach(([tx, ph], i) => item(`<div class="check" style="font-size:38px"><span class="m">✓</span>${tx}</div>`, X, 440 + i * 76, A('gh05', ph, -0.25), S('gh06') - 0.05, { anim: 'pop' }));
  left('STEP 1', '고른 스킬<br><span class="c-green mono" style="font-size:52px">script-to-motion</span>', '한국어 <b>내레이션</b> · 말과 화면을 <b>맞춤</b><span class="src">주소: github.com/kstost/script-to-motion</span>', S('gh06') + 0.1, S('gh07') - 0.05, 200);
  left('STEP 1', '별이 가장 많지는<br>않았다', '<b>인기보다 내 목적</b>이 먼저', S('gh07') + 0.1, S('in01') - 0.05, 200);

  // ================= STEP 2: 설치 =================
  left('STEP 2', '스킬 설치', '폴더를 <b>정해진 자리</b>에 내려받는 것이 전부', S('in01') + 0.1, S('in03') - 0.05);
  term(WX, WY, WW, WH, '터미널', S('in01') + 0.3, S('in04') - 0.05, [
    [S('in01') + 1.2, 'out', '# Claude Code가 스킬을 찾는 자리', 0, A('in03', 'git clone', -0.4)],
    [A('in02', '홈 폴더', -0.4), 'big', '~/.claude/skills/'],
    [A('in02', '경로', -0.3), 'out', '   └ script-to-motion/ └ SKILL.md', 0, A('in03', 'git clone', -0.4)],
    [A('in03', 'git clone', -0.3), 'cmd', 'git clone https://github.com/kstost/script-to-motion.git ~/.claude/skills/script-to-motion', 2.6],
    [A('in03', 'npm install', -0.5), 'cmd', 'cd ~/.claude/skills/script-to-motion/scripts && npm install', 2.0],
    [A('in03', '어렵다면', -0.2), 'note', '# 또는 Claude에게 “이 스킬 설치해 줘”'],
  ]);
  left('STEP 2', '명령 두 줄', '<b>git clone</b> = 내려받기<br><b>npm install</b> = 도구 준비<span class="src">출처: 스킬 README의 설치 방법</span>', S('in03') + 0.1, S('in04') - 0.05);
  left('STEP 2', '목소리를 넣으려면<br><span class="c-amber">Fish Audio</span> 키', '키 = 서비스를 쓰게 해 주는 <b>긴 비밀 문자열</b> · 유료', S('in04') + 0.1, S('in05') - 0.05);
  const envp = paper(WX, 250, WW, 480, '~/.claude/skills/script-to-motion/.env', '', S('in04') + 0.4, S('sk01') - 0.05, `<div class="tree"><div class="f"><b>FISH_API_KEY</b>=••••••••••••••••••••••••</div><div class="f"><b>FISH_VOICE</b>=••••••••••••</div><div class="f" style="font-family:var(--font);font-weight:700;font-size:30px;color:var(--red);margin-top:26px">실제 키는 절대 화면·대화창에 드러내지 않기</div><div class="f" style="font-family:var(--font);font-weight:700;font-size:30px;color:var(--green);margin-top:6px">키가 없으면 → 내레이션 없는 영상</div></div>`);
  { const f = [...envp.el.querySelectorAll('.f')]; show(f[0], S('in04') + 1.0); show(f[1], S('in04') + 1.6); show(f[2], A('in05', '비밀번호', -0.3)); show(f[3], S('in06') + 0.3); }
  left('STEP 2', '키는 <span class="mono">.env</span> 파일에<br>한 줄로', '<b>비밀번호처럼</b> 다룬다', S('in05') + 0.1, S('in06') - 0.05);
  left('STEP 2', '키가 없어도<br>괜찮다', '<b>화면만으로 된 영상</b>을 만들 수 있다', S('in06') + 0.1, S('sk01') - 0.05);

  // ================= 스킬 소개 =================
  item('<span class="step">스킬 소개</span><br><span class="hd h2" style="display:inline-block;margin-top:16px"><span class="mono c-green">script-to-motion</span>이 하는 일</span>', 'c', 150, S('sk01') + 0.1, S('sk05') - 0.05);
  const NODES = [['조사', '자료를 찾고<br>출처를 적는다', 'sk02', '조사'], ['대본', '말로 풀어 쓴다', 'sk02', '대본'], ['녹음', '목소리 내레이션', 'sk02', '목소리'], ['디자인', '장면을 그린다', 'sk03', '디자인'], ['움직임', '말하는 순간에<br>화면이 맞물리게', 'sk03', '움직임'], ['검사', '화면 · 글꼴 · 오류', 'sk04', '검사']];
  NODES.forEach(([n, d, id, ph], i) => { const it = pop(`<div class="node">${n}<small>${d}</small></div>`, 100 + i * 290, 470, S('sk01') + 0.6 + i * 0.12, S('sk05') - 0.05); classAt.push({ el: it.el.firstChild, name: 'on', at: A(id, ph, -0.2) }); });
  item('<span class="sub" style="max-width:1500px">주제만 건네면 → <b>영상 폴더</b>가 나온다</span>', 'c', 740, A('sk04', '스스로', -0.2), S('sk05') - 0.05);
  left('스킬 소개', '입체가 필요하면<br><span class="mono c-blue">three.js</span>', '웹에서 <b>3D</b>를 그리는 도구<br>로켓과 지구도 <b>코드로</b> 만들었다', S('sk05') + 0.1, S('rq01') - 0.05);
  { const t0 = S('sk05') + 0.4; monitor(820, 250, 960, S('sk05') + 0.2, S('rq01') - 0.05, [['demo_a', t0, Math.min(6.0, S('rq01') - 0.1 - t0), S('rq01')]]); }

  // ================= STEP 3: 영상 주문하기 =================
  left('STEP 3', '영상 주문하기', '작업할 <b>폴더</b>를 만들고<br>그 안에서 <span class="mono">claude</span> 실행', S('rq01') + 0.1, S('rq02') - 0.05);
  term(WX, 170, WW, 770, 'Claude Code — my-video', S('rq01') + 0.3, S('rq05') - 0.05, [
    [S('rq01') + 1.6, 'cmd', 'mkdir my-video && cd my-video', 1.0, S('rq03')], [A('rq01', 'claude를', -0.4), 'cmd', 'claude', 0.5, S('rq03')],
    [A('rq02', '주제', -0.4), 'ask', '주제 : 반도체 기술 vs 우주선 기술, 무엇이 더 어려운가?', 2.6],
    [A('rq03', '스킬을', -0.3), 'out', '● 스킬 읽기 — script-to-motion', 0, S('rq04')], [A('rq03', '조사', -0.2), 'out', '● 자료 조사 · 대본 47줄', 0, S('rq04')], [A('rq03', '녹음', -0.2), 'out', '● 내레이션 녹음 — 6분 15초', 0, S('rq04')],
    [A('rq03', '장면', -0.2), 'out', '● 장면 제작 — js/scenes.js', 0, S('rq04')], [A('rq03', '검사', -0.2), 'ok', '● 검사 통과 → 첫 결과(평면 그림)'],
    [A('rq04', 'three.js', -0.4), 'ask', 'three.js로 입체적이고 멋지게 만들어라. 반도체쪽은 라이트한 테마로 우주쪽은 다크한 테마로 잘 이해되게', 3.6],
    [E('rq04') - 0.4, 'ok', '● 3D 모형 제작 · 11,545장면 검사, 오류 0'],
  ]);
  left('STEP 3', '평소 말하듯<br>적는다', '실제로 입력한 것은 <b>이 한 줄</b>', S('rq02') + 0.1, S('rq03') - 0.05);
  left('STEP 3', 'Claude가<br>일을 시작한다', '조사 → 대본 → 녹음 → 장면 → 검사', S('rq03') + 0.1, S('rq04') - 0.05);
  left('STEP 3', '결과를 보고<br><span class="c-amber">한 줄 더</span>', '첫 결과는 평면 → <b>“입체적으로”</b>', S('rq04') + 0.1, S('rq05') - 0.05);
  item('<span class="step">STEP 3 · 가장 중요한 요령</span><br><span class="hd h2" style="display:inline-block;margin-top:18px">한 번에 완벽하게 <span class="c-red">×</span><br>보고 → 말하고 → 고치기 <span class="c-green">○</span></span>', 'c', 200, S('rq05') + 0.1, S('rq06') - 0.05);
  ['결과 보기', '고칠 점 말하기', '다시 만들기'].forEach((n, i) => pop(`<span class="chip c-blue">${n}</span>${i < 2 ? '<span class="hd h4 c-muted" style="margin-left:26px">→</span>' : '<span class="hd h4 c-muted" style="margin-left:26px">↺</span>'}`, 300 + i * 470, 620, A('rq05', '결과를 보고', -0.3) + i * 0.3, S('rq06') - 0.05));
  left('STEP 3', '문제가 생기면<br>본 대로 말한다', '“<b>몇 초</b>에서 <b>무엇이</b> 이상한지”', S('rq06') + 0.1, S('pp01') - 0.05);
  term(WX, 260, WW, 480, 'Claude Code', S('rq06') + 0.3, S('pp01') - 0.05, [
    [A('rq06', '몇 초', -0.6), 'ask', '0:49부터 화면이 멈추고 나레이션만 나와', 1.8],
    [A('rq06', '원인', -0.2), 'out', '● 원인: 반지름이 음수 → 그리기 멈춤'], [E('rq06') - 0.5, 'ok', '● 수정 완료 — 전체 검사 통과'],
  ]);

  // ================= 원리 =================
  item('<span class="step">원리</span><br><span class="hd h1" style="display:inline-block;margin-top:18px">왜 이게 될까?</span><br><span class="sub" style="max-width:1200px">핵심은 <b>세 가지</b></span>', 'c', 280, S('pp01') + 0.1, S('pp02') - 0.05);
  left('원리 ①', '영상이 아니라<br><span class="c-blue">웹페이지</span>다', '글자 · 그림 · 3D 모형이 전부 <b>코드</b>', S('pp02') + 0.1, S('pp03') - 0.05);
  const tree2 = paper(WX, WY, WW, WH, '완성된 영상 폴더', '', S('pp02') + 0.3, S('pp03') - 0.05, `<div class="tree"><div class="f"><b>chip-vs-rocket/</b></div><div class="f">├ <b>index.html</b><span>무대 (브라우저로 연다)</span></div><div class="f">├ <b>css/style.css</b><span>색 · 글자 모양</span></div><div class="f">├ <b>js/scenes.js</b><span>장면과 움직임</span></div><div class="f">├ <b>js/models.js</b><span>3D 모형 (로켓 · 지구 …)</span></div><div class="f">├ <b>js/cues.js</b><span>시간표</span></div><div class="f">└ <b>audio/narration.mp3</b><span>목소리</span></div></div>`);
  [...tree2.el.querySelectorAll('.f')].forEach((el, i) => show(el, S('pp02') + 0.8 + i * 0.4));
  left('원리 ②', '대본이<br><span class="c-amber">시간표</span>가 된다', '한 줄씩 녹음 → 줄마다 <b>시작 · 끝 시각</b>', S('pp03') + 0.1, S('pp05') - 0.05);
  const tb = paper(WX, WY, WW, WH, 'js/cues.js — 대본의 시간표', '', S('pp03') + 0.3, S('pp06') - 0.05, `<table class="tbl"><tr><td>pa04</td><td>1:04.2 → 1:11.6</td><td class="tx">이 장비가 쓰는 빛의 파장은 13.5나노미터…</td></tr><tr><td>pa05</td><td>1:11.8 → 1:21.1</td><td class="tx">이 빛을 만들려고, … 작은 주석 방울을…</td></tr><tr><td>pa06</td><td>1:21.2 → 1:33.3</td><td class="tx">그 빛을 모으는 거울은 독일의 자이스가…</td></tr></table>
    <div class="tree" style="margin-top:30px"><div class="f" style="font-size:30px">방울이 떨어지기 시작하는 때 = <b>S('pa05')</b><span>→ 71.8초</span></div><div class="f" style="font-family:var(--font);font-weight:700;font-size:30px;color:var(--green)">대본 수정 → 다시 녹음 → 시간표가 바뀜 → 화면이 따라옴</div></div>`);
  { const rows = [...tb.el.querySelectorAll('tr')], f = [...tb.el.querySelectorAll('.f')]; classAt.push({ el: rows[1], name: 'hl', at: A('pp04', '주석 방울', -0.4) }); show(f[0], A('pp04', '장면 코드', -0.3)); show(f[1], S('pp05') + 0.3); }
  left('원리 ②', '다시 녹음해도<br>화면이 <span class="c-green">따라온다</span>', '시각을 숫자로 적지 않고 <b>시간표에서 받기</b> 때문', S('pp05') + 0.1, S('pp06') - 0.05);
  left('원리 ③', '화면은 <span class="c-blue">시간 t</span>로<br>정해진다', '몇 초인지만 알면 그 순간이 <b>통째로</b> 그려진다', S('pp06') + 0.1, S('pp08') - 0.05);
  const fbox = item('<div class="fbox">t = <span class="tv c-blue">64.0</span>초 &nbsp;→&nbsp; 그 순간의 화면</div>', 880, 220, S('pp06') + 0.3, S('pp08') - 0.05, { anim: 'pop' });
  const mini = item('<div class="mini" style="position:relative"><div class="dr" style="position:absolute;left:200px;width:22px;height:22px;border-radius:50%;background:#6b7686"></div><div class="lz" style="position:absolute;left:20px;top:211px;width:190px;height:6px;background:#d23f3f"></div><div class="fl" style="position:absolute;left:181px;top:184px;width:60px;height:60px;border-radius:50%;background:#b090ff"></div></div>', 1110, 370, S('pp06') + 0.5, S('pp08') - 0.05, { anim: 'pop' });
  const trk = item('<div class="track" style="position:relative"><div class="knob" style="position:absolute;top:-15px"></div></div>', 870, 760, S('pp06') + 0.5, S('pp08') - 0.05);
  item('<span class="sub" style="max-width:900px"><b>재생</b> = t가 흐른다 &nbsp;·&nbsp; <b>되감기</b> = t를 거꾸로</span>', 880, 810, S('pp07') + 0.2, S('pp08') - 0.05);
  { const tv = fbox.el.querySelector('.tv'), dr = mini.el.querySelector('.dr'), lz = mini.el.querySelector('.lz'), fl = mini.el.querySelector('.fl'), kn = trk.el.querySelector('.knob'); let last = -1;
    const tRew = A('pp07', '되감기', -0.2);
    live.push((t) => { let u = io(K(t, S('pp06') + 1.0, E('pp06') + 0.4)); if (t > tRew) u = lerp(1, 0.15, io(K(t, tRew, tRew + 2.2))); const q = Math.round(u * 400); if (q === last) return; last = q;
      tv.textContent = (64 + u * 14).toFixed(1); kn.style.left = (u * 856) + 'px'; dr.style.top = (20 + Math.min(u / 0.6, 1) * 183) + 'px'; lz.style.opacity = u > 0.45 ? '1' : '0'; const f = clamp((u - 0.6) / 0.4, 0, 1); fl.style.opacity = u > 0.6 ? '1' : '0'; fl.style.transform = `scale(${(0.4 + 1.6 * f).toFixed(3)})`; }); }
  left('원리 ③', '굽기 = 한 장씩<br><span class="c-red">찍기</span>', '1초에 <b>60장</b>', S('pp08') + 0.1, S('pp10') - 0.05);
  const strip = item('<div style="position:relative;width:1040px;height:110px;overflow:hidden">' + Array.from({ length: 9 }, (_, i) => `<div class="frame fr" style="position:absolute;top:4px;left:${i * 174}px"></div>`).join('') + '</div>', WX, 250, S('pp08') + 0.3, S('pp10') - 0.05);
  const cnt = item('<span class="big"><span class="nn">0</span>장</span><br><span class="sub" style="max-width:900px">6분 23초 × 60장</span>', WX, 420, A('pp08', '1초에', -0.3), S('pp09') + 0.3, { anim: 'pop' });
  { const frs = [...strip.el.querySelectorAll('.fr')], nn = cnt.el.querySelector('.nn'); let lastN = -1, lastX = -1; const t0 = A('pp08', '1초에', 0), t1 = E('pp08');
    live.push((t) => { const x = Math.round(((t * 200) % 174)); if (x !== lastX) { lastX = x; frs.forEach((f, i) => { f.style.left = (i * 174 - x) + 'px'; }); }
      const n = Math.round(23006 * out(K(t, t0, t1))); if (n !== lastN) { lastN = n; nn.textContent = n.toLocaleString('en-US'); } }); }
  ['사진 23,006장', '＋ 소리', '→ MP4 파일'].forEach((n, i) => pop(`<span class="chip ${i === 2 ? 'c-green' : 'c-blue'}">${n}</span>`, WX + i * 350, 480, S('pp09') + 0.4 + i * 0.5, S('pp10') - 0.05));
  item('<span class="sub" style="max-width:1000px">한 장씩 찍으니 컴퓨터가 느려도 <b>끊기지 않는다</b></span>', WX, 620, A('pp09', '한 장씩', -0.2), S('pp10') - 0.05);
  item('<span class="step">원리 · 그래서</span><br><span class="hd h2" style="display:inline-block;margin-top:18px">전부 코드라서,<br>고치는 것도 <span class="c-green">말 한마디</span></span>', 'c', 200, S('pp10') + 0.1, S('ex01') - 0.05);
  [['“색을 바꿔 줘”', '색을'], ['“이 장면을 더 길게”', '이 장면'], ['“글자를 키워 줘”', '이런 식']].forEach(([n, ph], i) => pop(`<span class="chip c-blue">${n}</span>`, 250 + i * 490, 620, A('pp10', ph, -0.2), S('ex01') - 0.05));

  // ================= STEP 4: 확인하고 내보내기 =================
  left('STEP 4', '확인하고<br>내보내기', '', S('ex01') + 0.1, S('ex02') - 0.05);
  term(WX, WY, WW, WH, '터미널 — my-video', S('ex01') + 0.3, S('ex04') - 0.05, [
    [S('ex01') + 1.0, 'out', '# 완성된 폴더: index.html이 들어 있다'],
    [A('ex02', 'Chrome으로', -0.5), 'note', '# index.html을 Chrome으로 열면 재생'], [E('ex02') - 0.5, 'out', '#   F = 전체 화면 · R = 처음부터'],
    [A('ex03', '렌더', -0.4), 'cmd', 'python3 render.py', 0.9], [E('ex03') - 1.2, 'out', '→ 한 장씩 찍는 중… (시간이 걸립니다)'], [E('ex03') - 0.4, 'ok', '✔ movie_20261114-103000_1080p.mp4'],
  ]);
  left('STEP 4', '브라우저로<br>바로 본다', '<span class="mono">index.html</span> → Chrome', S('ex02') + 0.1, S('ex03') - 0.05);
  left('STEP 4', '영상 파일로<br>굽는다', '<span class="mono">python3 render.py</span><span class="src">Claude에게 “MP4로 내보내 줘”라고 해도 된다</span>', S('ex03') + 0.1, S('ex04') - 0.05);
  item('<div class="warn"><span class="hd h3 c-amber">꼭 기억할 것</span><br><span class="hd h3" style="display:inline-block;margin-top:10px">숫자 · 사실 · 화면의 글자는<br>사람이 다시 확인</span><br><span class="sub" style="max-width:780px;display:inline-block;margin-top:12px">AI가 조사해도 <b>틀릴 수 있다</b></span></div>', 530, 290, S('ex04') + 0.1, S('ed01') - 0.05, { anim: 'pop' });

  // ================= ending =================
  item('<span class="hd h2">정리</span>', 'c', 150, S('ed01') + 0.1, S('ed02') - 0.05);
  [['1', '스킬 찾기', '찾고'], ['2', '설치', '설치'], ['3', '말로 주문', '주문'], ['4', '보며 고치기', '고친다']].forEach(([n, t, ph], i) => pop(`<div class="rc" style="width:330px"><span class="n">${n}</span><span class="t">${t}</span></div>`, 215 + i * 380, 360, A('ed01', ph, -0.25), S('ed02') - 0.05));
  monitor(264, 132, 1360, S('ed02') - 0.1, END + 2, [['demo_d', S('ed02'), Math.min(7.0, S('ed03') - S('ed02') + 2.4), S('ed02') + Math.min(7.0, S('ed03') - S('ed02') + 2.4)], ['demo_e', S('ed02') + Math.min(7.0, S('ed03') - S('ed02') + 2.4), 8.2, END + 2]]);
  item('<span class="tagline">편집 프로그램 없이 · 터미널에서 글로 만든 영상</span>', 'c', 56, S('ed02') + 0.3, END + 2);
  item('<div class="foot">터미널 · 검색 화면은 실제 명령을 바탕으로 한 <b>재현</b>입니다 · 검색 결과는 2026-11-14 기준 · 완성 영상은 같은 폴더의 프로젝트를 render.py로 구운 것 · 효과음은 코드로 합성</div>', 210, 870, END - 4.6, END + 2);

  // ---------------- sound: synthesized effects only ----------------
  const sfxBox = document.getElementById('sfx');
  const sfx = (key, t0, vol) => M.clip(sfxBox, key, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0), dur: M.SRC[key].dur, audio: true, vol });
  keysT.forEach((t0) => sfx('keys', t0, 0.5)); stepsT.forEach((t0) => sfx('step', t0, 0.5));

  onFrame((t) => {
    // step bar
    let cur = -1; for (let i = 0; i < PILLS.length; i++) if (t >= S(PILLS[i][1]) - 0.1) cur = i;
    if (cur !== barKey) { barKey = cur; pills.forEach((p, i) => { p.className = 'p' + (i === cur ? ' on' : i < cur ? ' done' : ''); }); }
    for (const r of reveals) { const on = t >= r.at && t < r.until; if (on !== r.last) { r.last = on; r.el.style.display = on ? r.disp : 'none'; } }
    for (const c of classAt) { const on = t >= c.at; if (on !== c.last) { c.last = on; c.el.classList.toggle(c.name, on); } }
    for (const y of typed) { const n = Math.floor(y.text.length * K(t, y.at, y.at + y.dur) + 1e-6); if (n !== y.last) { y.last = n; y.el.textContent = y.text.slice(0, n); } }
    for (const f of live) f(t);
    for (const it of items) {
      const a = vis(t, it.t0, it.t1);
      if (a <= 0) { if (it.last !== 'h') { it.el.style.opacity = '0'; it.el.style.visibility = 'hidden'; it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.55); let tr;
      if (it.anim === 'pop') tr = `scale(${(0.84 + 0.16 * back(k)).toFixed(3)})`;
      else if (it.anim === 'win') tr = `translateY(${((1 - out(k)) * 36).toFixed(1)}px) scale(${(0.97 + 0.03 * out(k)).toFixed(3)})`;
      else tr = `translateY(${((1 - out(k)) * 20).toFixed(1)}px)`;
      const key = a.toFixed(3) + tr; if (key === it.last) continue;
      it.el.style.visibility = 'inherit'; it.el.style.opacity = a.toFixed(3); it.el.style.transform = tr; it.last = key;
    }
  });
});
