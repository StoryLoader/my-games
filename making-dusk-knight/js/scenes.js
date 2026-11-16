/*
 * scenes.js — 「「남은 길」은 이렇게 만들었습니다」 (storyboard.md): how the 30-second wordless 3D short 「남은 길」 was
 * ordered in writing from Claude Code with the script-to-motion skill, and why each part of the order is written that way.
 *
 * The world is one big paper desk (#desk, 4400×2200 desk px) under dusk light; a camera glides over it. On it:
 *   the projection screen (the film's real footage, rendered from ../dusk-knight with render.py),
 *   the terminal (commands type themselves), the order sheet (주문서) with six coloured parts,
 *   the cork board (before/after frames cut from the film's own review sheets), and the work area under the screen.
 * Every visual is a pure function of t; times come from the cues (S/E/A), so re-recording re-times everything.
 * Terminal screens are reconstructions of real commands (README of the skill); the order text is the user's request
 * (without the reference work's name, at the user's wish) and the decisions taken while the film was made.
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
  const rnd = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
  const M = MEDIA.install(ctx);
  const $ = (id) => document.getElementById(id);
  const desk = $('desk'), layer = $('layer'), scr = $('scr'), sheet = $('sheet'), board = $('board');

  // ---------------- small machinery: items that fade/rise/pop, typed text, reveals, live functions, sounds ----------------
  const items = [], typed = [], reveals = [], live = [], keysT = [], stepsT = [], snd = [];
  const fx = (kind, t) => snd.push([kind, t]);
  function put(parent, html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
    el.style.left = x + 'px'; el.style.top = y + 'px'; if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
    parent.appendChild(el); const it = { el, t0, t1, anim: o.anim || 'rise', rot: o.rot || 0, last: '' }; items.push(it);
    if (o.sound !== false) fx(o.sound || (o.anim === 'pin' ? 'shutter' : o.anim === 'pop' || o.anim === 'stamp' ? 'pop' : o.anim === 'hand' ? 'tick' : 'tick'), t0);
    return it;
  }
  const show = (el, at, disp = 'block', until = 1e9) => reveals.push({ el, at, disp, until, last: null });
  const type = (el, text, at, dur) => { const d = dur || Math.min(2.6, 0.3 + text.length * 0.032); typed.push({ el, text, at, dur: d, last: -1 }); keysT.push([at, d]); };
  /** handwriting note (desk coords or inside another parent) */
  const note = (parent, text, x, y, t0, t1, cls = '', rot = 0) => put(parent, `<span class="note ${cls}">${text}</span>`, x, y, t0, t1, { anim: 'hand', rot });
  /** a hand-drawn arrow: d in its own box coords (0..w, 0..h) */
  function arrow(parent, d, x, y, w, h, t0, t1, cls = '') {
    const it = put(parent, `<svg class="arrow ${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path pathLength="1" d="${d}"/></svg>`, x, y, t0, t1, { anim: 'fade', sound: false });
    const p = it.el.querySelector('path'); p.style.strokeDasharray = '1 1'; let last = -1;
    live.push((t) => { const k = Math.round(1000 * (1 - out(K(t, t0, t0 + 0.6)))) / 1000; if (k !== last) { last = k; p.style.strokeDashoffset = k; } });
    return it;
  }
  /** a terminal window. lines: [at, cls, text, typedDur?] — cls: cmd | ask | ask first | out | ok | note | big */
  function term(x, y, w, h, title, t0, t1, lines) {
    const it = put(layer, `<div class="top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="ttl">${title}</span><span class="re">재현 화면</span></div><div class="body"></div>`, x, y, t0, t1, { cls: 'win term', anim: 'win', style: `width:${w}px;height:${h}px;white-space:normal`, sound: false });
    const body = it.el.querySelector('.body');
    for (const [at, cls, text, dur] of lines) {
      const ln = document.createElement('div'); ln.className = 'ln ' + cls; const tx = document.createElement('span'); ln.appendChild(tx); body.appendChild(ln); show(ln, at);
      if (cls.startsWith('cmd') || cls.startsWith('ask')) type(tx, text, at, dur); else { tx.textContent = text; fx(cls === 'ok' ? 'ok' : 'tick', at); }
    }
    return it;
  }
  /** a highlighter stroke over an element, drawn at t0 */
  const hl = (el, t0, until = 1e9) => { let last = ''; live.push((t) => { const k = t < until ? out(K(t, t0, t0 + 0.7)) : 0; const v = (k * 100).toFixed(1) + '% 100%'; if (v !== last) { last = v; el.style.backgroundSize = v; } }); fx('tick', t0); };
  const strike = (el, t0) => { let last = -1; live.push((t) => { const k = Math.round(out(K(t, t0, t0 + 0.5)) * 1000) / 1000; if (k !== last) { last = k; el.style.setProperty('--k', k); } }); fx('tick', t0); };

  // ---------------- footage on the screen ----------------
  const SHOTS = [[0, 4.5], [4.5, 8], [8, 12.5], [12.5, 17], [17, 21], [21, 25], [25, 30]];
  /** play [inn, inn+len) of a clip on the screen from t0 to t1, repeating it; phase aligns the repeats across layers */
  function tiled(key, inn, len, t0, t1, o = {}) {
    const boxes = []; const ph = o.phase ?? t0;
    let s = ph + Math.floor((t0 - ph) / len) * len;
    for (; s < t1; s += len) {
      const a = Math.max(s, t0), b = Math.min(s + len, t1); if (b - a < 0.05) continue;
      boxes.push(M.clip(o.parent || scr, key, { x: o.x || 0, y: o.y || 0, w: o.w || 1600, h: o.h || 900, start: a, dur: b - a, in: inn + (a - s), show: [a, b], crop: o.crop, ...(o.audio ? { audio: true, vol: o.vol } : {}) }));
    }
    return boxes;
  }
  /** a still picture on the screen */
  const still = (src, t0, t1) => put(scr, `<img class="still" src="${src}">`, 0, 0, t0, t1, { anim: 'fade', sound: false, style: 'width:1600px;height:900px' });

  // ---------------- the desk: paper, light, grain ----------------
  { const c = $('deskpaper').getContext('2d'), r = rnd(11); c.fillStyle = '#efe4d0'; c.fillRect(0, 0, 1100, 550);
    for (let i = 0; i < 900; i++) { c.globalAlpha = 0.03 + r() * 0.06; c.fillStyle = r() < 0.55 ? '#c9b08c' : '#fff7e8'; c.beginPath(); c.ellipse(r() * 1100, r() * 550, 6 + r() * 40, 1 + r() * 3, r() * 3.14, 0, 6.283); c.fill(); }
    for (let i = 0; i < 26; i++) { c.globalAlpha = 0.035; c.fillStyle = '#b48b5e'; c.beginPath(); c.arc(r() * 1100, r() * 550, 20 + r() * 70, 0, 6.283); c.fill(); }
    c.globalAlpha = 1; }
  const grain = $('grain').getContext('2d'), gimg = grain.createImageData(480, 270); let lastG = -1;
  const light = $('light'), black = $('black');

  // ---------------- the camera ----------------
  const V = { full: [2360, 570, 1.2], screen: [2360, 600, 0.98], over: [2250, 1100, 0.47], term: [770, 1590, 1.12], board: [770, 570, 1.2], sheet: [3700, 1120, 0.52],
    splitT: [2900, 640, 0.72], splitB: [2900, 1450, 0.72], sw: [2360, 690, 0.86], work: [2360, 1560, 1.02], scrWork: [2360, 860, 0.8], wave: [2360, 700, 0.9], deskL: [1520, 1250, 0.6],
    sec: (i) => [3700, 250 + i * 300 + 150, 1.18] };
  const CAM = [];   // [t, view, moveDur]
  const cam = (t, v, d = 1.3) => { CAM.push([t, v, d]); if (CAM.length > 1 && d > 0.3) fx('whoosh', t); };
  function camAt(t) {
    let i = 0; while (i + 1 < CAM.length && t >= CAM[i + 1][0]) i++;
    const [t0, v, d] = CAM[i]; if (i === 0 || t >= t0 + d) return v;
    const p = CAM[i - 1][1], k = io(K(t, t0, t0 + d));
    return [lerp(p[0], v[0], k), lerp(p[1], v[1], k), Math.exp(lerp(Math.log(p[2]), Math.log(v[2]), k))];
  }

  // ---------------- the order sheet (주문서) ----------------
  sheet.innerHTML = '<div class="hd">주문서<small>「남은 길」 · 말 없는 30초 3D 단편</small></div><div class="rule"></div>';
  const PARTS = [
    ['이야기', 'var(--c1)', [
      '<b>주인공</b> 패배한 해골기사',
      '<span class="hl" data-k="drag">부러진 칼을 끌며 한쪽 다리를 전다</span>',
      '<b>친구</b> 어깨 위 까마귀 · <b>빛</b> 해질녘',
      '<b>감정</b> <span class="hl" data-k="lonely">외로움 = 넓은 땅, 작은 둘</span>']],
    ['화면 스타일', 'var(--c2)', [
      '<b>느낌 대신 재료로</b> · <span class="hl" data-k="tone">두 단계 명암</span> · <span class="hl" data-k="line">가는 외곽선</span>',
      '<span class="hl" data-k="step">화면 1초 24장 · 인물 1초 12장</span>',
      '<span class="hl" data-k="fin">종이 결 · 필름 입자 · 가장자리 그늘 · 검은 띠</span>',
      '<span class="hl" data-k="brush">붓 자국 질감</span> · <span class="hl" data-k="body">둥근 두개골, 드러난 갈비뼈</span>']],
    ['컷 구성', 'var(--c3)', [
      '<b>일곱 컷</b> 먼 풍경 → 발치 → 나란히 → 얼굴 → 날아오름 → 무덤 → 엔딩',
      '<span class="hl" data-k="cov1">얼굴 컷: 까마귀가 가려지지 않는 쪽에서</span>',
      '<span class="hl" data-k="cov2">무덤 컷: 칼이 기사를 가리지 않는 각도로</span>']],
    ['시간표', 'var(--c4)', [
      '<b>내레이션 없음</b> → <span class="hl" data-k="rest">컷마다 빈 대사 하나</span>',
      '<span class="hl" data-k="len">빈 대사의 길이 = 컷 길이 → 정확히 30.00초</span>']],
    ['소리', 'var(--c5)', [
      '<b>음악 없이 코드로 합성</b> 바람 · 발소리 · 칼 끌림 · 까마귀 · 날갯짓',
      '<span class="hl" data-k="one">박자는 한 파일에만 → 화면과 소리가 함께 읽는다</span>']],
    ['일하는 방식', 'var(--c6)', [
      '<span class="hl" data-k="plan">먼저 설계도: 색과 빛, 생김새, 컷 표</span>',
      '<span class="hl" data-k="look">화면을 찍어 보고 최소 두 번 고치기</span>',
      '<span class="hl" data-k="done">검사 통과 → 웹에 게시 → 깃허브에 보관</span>']],
  ];
  const secs = PARTS.map(([name, col, lines], i) => {
    const el = document.createElement('div'); el.className = 'sec'; el.style.top = (250 + i * 300) + 'px';
    el.innerHTML = `<div class="tab" style="background:${col}">${i + 1}</div><div class="body"><div class="h"><span class="n" style="background:${col}">${i + 1}</span>${name}</div>${lines.map((l) => `<div class="ln">${l}</div>`).join('')}</div><div class="dimmer"></div>`;
    sheet.appendChild(el);
    return { el, body: el.querySelector('.body'), tab: el.querySelector('.tab'), dim: el.querySelector('.dimmer'), lines: [...el.querySelectorAll('.ln')] };
  });
  const HL = {}; sheet.querySelectorAll('.hl').forEach((s) => { HL[s.dataset.k] = s; });
  const secOn = [], tabOn = [];      // [t] when each part's body / tab appears
  const FOCUS = [[0, -1]];           // [t, part index or -1]
  const focus = (t, i) => FOCUS.push([t, i]);

  // ================= opening: 8 seconds of the film, full screen, with its own sound =================
  cam(0, V.full, 0);
  tiled('film', 0, 30.0, 0, 30.0, { audio: true, vol: 1 });
  // the film again, silent, while the narration introduces it
  tiled('film', 0.4, 4.0, 30.0, S('op03'));
  tiled('film', 8.0, 4.4, S('op03'), S('op05') + 0.6);
  cam(S('op01') + 0.4, V.screen, 2.2);
  note(layer, '「남은 길」 · 30초 · 일곱 컷 · 대사 없음', 1600, 1110, S('op01') + 1.6, S('op03'), 'sm');
  note(scr, '싸움에서 진 해골기사 + 까마귀 한 마리', 60, 60, A('op02', '싸움에서', 0), S('op03'), 'w');
  cam(S('op03'), V.scrWork, 1.4);
  [['3D 프로그램', 1600], ['편집 프로그램', 2150], ['녹음', 2780]].forEach(([w, x], i) => {
    const it = note(layer, `<span class="st">${w}</span>`, x, 1170, A('op03', i === 0 ? '3D' : i === 1 ? '편집' : '열지', -0.2), S('op05'), 'huge', -2 + i * 2);
    strike(it.el.querySelector('.st'), A('op03', i === 0 ? '3D' : i === 1 ? '편집' : '열지', 0.5));
  });
  note(layer, '대신 → 터미널에 글로 주문', 1600, 1400, S('op04') + 0.2, S('op05'), 'huge o');
  cam(S('op04') + 0.1, V.deskL, 1.4);
  term(100, 1220, 1340, 780, '터미널 — 글자로 명령을 내리는 창', S('op04') + 0.4, S('pr01') - 0.05, [
    [A('op04', 'Claude Code', -0.1), 'out', '$ claude    # 인공지능 도구 Claude Code 실행'],
    [A('op04', '글로', -0.2), 'ask first', '손그림 애니메이션 느낌의 3D 단편을 만들어 줘. 내레이션 없음, 30초 …', 2.2],
  ]);
  cam(S('op05'), V.sheet, 1.5);
  secOn.push(-1);   // (the header is there from the start; parts fill in later)
  note(layer, '무엇을 적었고,<br>왜 그렇게 적을까?', 2000, 1150, A('op05', '왜', -0.3), S('pr01') - 0.05, 'huge', -2);
  arrow(layer, 'M 20 200 C 300 160, 700 90, 1100 10', 2150, 940, 1120, 220, A('op05', '왜', 0.2), S('pr01') - 0.05);
  note(layer, '→ 이유를 알면, 내 이야기로 바꿔 쓴다', 2000, 1520, S('op06') + 0.3, S('pr01') - 0.05, 'huge o');

  // ================= 준비 =================
  stepsT.push(S('pr01')); cam(S('pr01'), V.term, 1.4);
  term(100, 1220, 1340, 780, '터미널', S('pr01') + 0.2, S('in01') - 0.05, [
    [S('pr01') + 0.8, 'out', '# 미리 준비되어 있어야 하는 것 (설치법은 지난 영상)'],
    [A('pr02', 'Claude Code', -0.1), 'ok', '준비됨  Claude Code   인공지능 도구'],
    [A('pr02', 'git', -0.1), 'ok', '준비됨  git           파일 내려받기'],
    [A('pr02', 'Node.js', -0.1), 'ok', '준비됨  Node.js       자바스크립트 프로그램 실행'],
    [A('pr04', 'script-to-motion', -0.3), 'big', '+ script-to-motion'],
    [S('pr05') + 0.2, 'out', '  └ SKILL.md    ← 인공지능에게 건네는 작업 설명서'],
    [A('pr06', '순서', -0.2), 'out', '                  순서 · 도구 · 다 만든 뒤의 검사'],
    [A('pr06', '도구', 0.2), 'out', '  └ scripts/    ← 스킬이 쓰는 도구'],
  ]);
  note(layer, '지난 영상에서 설치했으니, 오늘은 넘어가요', 140, 1100, S('pr03') + 0.2, S('pr04') + 0.4, 'sm');
  note(layer, '오늘 새로 설치할 것은 하나', 140, 1100, S('pr04') + 0.5, S('in01') - 0.05, 'sm o');

  // ================= 스킬 설치 =================
  term(100, 1220, 1340, 780, '터미널 — 스킬 설치 (README의 두 줄)', S('in01') + 0.2, S('rq01') - 0.05, [
    [A('in02', '첫째', -0.1), 'out', '# 첫째 줄: 깃허브에서 스킬 폴더를 통째로 내려받기'],
    [A('in02', 'git clone', 0), 'cmd', 'git clone https://github.com/kstost/script-to-motion.git ~/.claude/skills/script-to-motion', 2.6],
    [A('in03', '화면에', -0.2), 'note', '# ~ = 홈 폴더 · ~/.claude/skills = 스킬을 모아 두는 폴더'],
    [A('in04', '둘째', -0.1), 'out', '# 둘째 줄: 스킬이 쓰는 도구 준비 (npm = Node.js와 함께 오는 도구)'],
    [A('in04', 'npm install', -0.2), 'cmd', 'cd ~/.claude/skills/script-to-motion/scripts && npm install', 2.0],
    [S('in05') + 0.6, 'note', '# 대사 없는 단편 → 음성 서비스 키 없이도 된다'],
    [A('in06', '하나 만들고', -0.4), 'cmd', 'mkdir my-film && cd my-film', 1.1],
    [A('in06', 'claude', -0.2), 'cmd', 'claude', 0.4],
    [E('in06') - 0.4, 'ok', '→ Claude Code 실행 · 주문할 준비 끝'],
  ]);
  note(layer, '스킬을 찾아 읽는 자리', 760, 1110, A('in03', '스킬만', 0), S('in04'), 'o');
  arrow(layer, 'M 10 10 C 40 60, 60 90, 70 140', 1180, 1150, 120, 160, A('in03', '스킬만', 0.2), S('in04'), 'o');

  // ================= 주문 =================
  stepsT.push(S('rq01'));
  term(100, 1220, 1340, 780, '터미널 — 처음 보낸 주문', S('rq01') + 0.2, S('rq06'), [
    [A('rq02', '손그림', -0.4), 'ask first', '손그림 애니메이션 느낌의 3D 단편을 만들어 줘.', 1.4],
    [A('rq02', '내레이션 없이', -0.2), 'ask', '- 내레이션 없음, 길이 30초', 0.8],
    [A('rq03', '주인공', -0.2), 'ask', '- 주인공: 해골기사 · 배경: 남루하고 메마른 땅 · 시간과 빛: 해질녘', 1.6],
    [A('rq03', '줄거리', -0.2), 'ask', '- 줄거리: 패배한 해골기사가 까마귀 친구와 함께 길을 걸어간다', 1.4],
    [A('rq03', '분위기', -0.2), 'ask', '- 분위기: 고요하고 뭉클하게 · 소리: 코드로 합성한 자연음과 효과음', 1.4],
  ]);
  note(layer, '적지 않은 부분은 → 인공지능이 대신 정한다', 140, 1100, S('rq04') + 0.3, S('rq05') + 0.2, 'sm o');
  cam(S('rq05'), V.board, 1.4);
  put(board, `<div class="pol" style="width:780px"><span class="pin"></span><img src="assets/user/img/knight_before.jpg"><div class="cap">첫 결과 — 상자 로봇?</div></div>`, 280, 70, A('rq05', '로봇', -0.4), S('rq06') + 0.2, { anim: 'pin', rot: -2 });
  note(layer, 'Claude Code가 스스로 찍어 보고 → 고침', 230, 770, A('rq05', '그래서', 0), S('rq06') + 0.2, 'big w', -1);
  cam(S('rq06'), V.sheet, 1.4);
  note(layer, '고치면서 정한 것까지<br>→ 주문서 한 장', 2000, 1150, S('rq06') + 0.4, S('rq08'), 'huge', -1);
  PARTS.forEach(([name], i) => { const tt = i === 0 ? A('rq07', '이야기', -0.2) : A('rq07', name, -0.2); secOn[i] = tt; tabOn[i] = tt; fx('pop', tt); });
  note(layer, '무엇을? 왜?', 2100, 1250, S('rq08') + 0.2, S('st01'), 'huge o', -3);

  // ================= ① 이야기 =================
  stepsT.push(S('st01')); focus(S('st01'), 0); cam(S('st01'), V.splitT, 1.4);
  note(layer, '꾸미는 말보다 → 눈에 보이는 모습', 1620, 1080, A('st02', '꾸미는', 0), S('st03') + 0.2, 'big o', -2);
  hl(HL.drag, A('st03', '부러진', -0.2));
  tiled('film', 4.6, 3.3, A('st03', '부러진', -0.4), S('st05') + 0.2);
  tiled('film', 0.4, 4.0, S('st05') + 0.2, S('st06'));
  note(scr, '끌리는 칼 · 저는 다리 = 패배', 70, 70, A('st04', '끌리는', -0.2), S('st05'), 'w');
  note(layer, '적힌 것만 → 화면으로', 1620, 1080, S('st05') + 0.4, S('st06'), 'big o', -2);
  hl(HL.lonely, A('st06', '외롭다', -0.2));
  tiled('film', 0.3, 4.2, S('st06'), S('sy01') + 0.3);
  note(scr, '외롭다 → 넓은 땅, 작은 둘', 70, 70, A('st06', '넓은', -0.2), S('sy01'), 'w');
  arrow(scr, 'M 20 20 C 120 120, 200 200, 250 300', 380, 170, 280, 330, A('st07', '작은', -0.4), S('sy01'), 'w');

  // ================= ② 화면 스타일 =================
  stepsT.push(S('sy01')); focus(S('sy01'), 1); cam(S('sy01'), V.splitT, 0.8);
  note(layer, '"손그림 느낌으로" → 고르는 건 인공지능', 1620, 1080, S('sy02') + 0.3, S('sy03') + 0.3, 'o');
  note(layer, '느낌 대신 → 재료', 1620, 1200, S('sy03') + 0.2, S('sy04'), 'big');
  // the ladder: the same shot built up one ingredient at a time (rendered from the film with ingredients switched off)
  const L0 = S('sy04') - 0.2, LP = 4.45, tON = [A('sy05', '명암', -0.3), A('sy06', '외곽선', -0.3), A('sy07', '끊는', -0.3), A('sy09', '마감', -0.3), A('sy10', '붓', -0.3)];
  const lay = {
    v0: tiled('ladder_v0', 0, LP, L0, tON[0] + 1.0, { phase: L0 }),
    v1: tiled('ladder_v1', 0, LP, tON[0], tON[1] + 1.0, { phase: L0 }),
    v2: tiled('ladder_v2', 0, LP, tON[1], tON[3] + 1.0, { phase: L0 }),
    v3: tiled('ladder_v3', 0, LP, tON[2], tON[3] + 1.0, { phase: L0 }),
    fin: tiled('film', 8.0, LP, tON[3], S('sy12') + 0.4, { phase: L0 }),
  };
  // brush close-up: the face shot, cropped in
  const brushT0 = tON[4], brushT1 = S('sy11') + 0.2;
  tiled('film', 12.7, 4.2, brushT0, brushT1, { crop: [860, 200, 880, 495] });
  const wipeLine = put(scr, '<div class="wipe" style="position:absolute;left:0;top:0;height:920px"></div>', 0, 0, tON[0], tON[3] + 1.0, { anim: 'fade', sound: false });
  /** reveal widths for each layer at t (fraction of the screen from the left; v3 is revealed from the right) */
  const WIPE = 0.9;
  live.push((t) => {
    const k1 = io(K(t, tON[0], tON[0] + WIPE)), k2 = io(K(t, tON[1], tON[1] + WIPE)), k3 = io(K(t, tON[2], tON[2] + WIPE)), k4 = io(K(t, tON[3], tON[3] + WIPE));
    const set = (boxes, css) => boxes.forEach((b) => { if (b && b.style && b.style.clipPath !== css) b.style.clipPath = css; });
    set(lay.v1, `inset(0 ${((1 - k1) * 100).toFixed(2)}% 0 0)`); set(lay.v2, `inset(0 ${((1 - k2) * 100).toFixed(2)}% 0 0)`);
    set(lay.v3, `inset(0 0 0 ${(100 - 50 * k3).toFixed(2)}%)`); set(lay.fin, `inset(0 ${((1 - k4) * 100).toFixed(2)}% 0 0)`);
    let x = -100; if (t < tON[0] + WIPE) x = 1600 * k1; else if (t < tON[1] + WIPE) x = 1600 * k2; else if (t < tON[2] + WIPE + 0.05) x = 1600 - 800 * k3; else if (t < tON[3]) x = 800; else x = 1600 * k4;
    const ln = wipeLine.el.firstChild; const v = Math.round(x) + 'px'; if (ln.style.left !== v) ln.style.left = v;
  });
  cam(S('sy04'), V.sw, 1.3);
  const SW = ['두 단계 명암', '가는 외곽선', '끊어 움직이기', '화면 마감', '붓 자국'];
  const swEls = SW.map((nm, i) => { const it = put(layer, `<div class="sw"><div class="tr"><div class="kn"></div></div><span class="lb2">${nm}</span></div>`, 1610 + i * 310, 1080, S('sy04') + 0.1 + i * 0.12, S('sy12'), { anim: 'pop', sound: i ? false : 'pop' }); return it.el.querySelector('.sw'); });
  live.push((t) => swEls.forEach((el, i) => { const on = t >= tON[i]; if (el.classList.contains('on') !== on) el.classList.toggle('on', on); const kn = el.querySelector('.kn'); const v = (66 * io(K(t, tON[i], tON[i] + 0.25))).toFixed(1) + 'px'; if (kn.style.transform !== `translateX(${v})`) kn.style.transform = `translateX(${v})`; }));
  tON.forEach((tt) => fx('ok', tt));
  note(scr, '재료 없음: 흔히 보는 매끈한 3D', 60, 60, S('sy04') + 0.4, tON[0], 'w');
  hl(HL.tone, tON[0]); hl(HL.line, tON[1]); hl(HL.step, tON[2]); hl(HL.fin, tON[3]); hl(HL.brush, tON[4]);
  note(scr, '밝은 면과 그늘, 딱 두 가지', 60, 60, tON[0] + 0.6, tON[1], 'w');
  note(scr, '펜으로 그은 테두리', 60, 60, tON[1] + 0.6, tON[2], 'w');
  note(scr, '끊기 전', 60, 60, tON[2] + 0.8, tON[3], 'w');
  note(scr, '끊은 뒤: 인물은 1초에 12장', 860, 60, tON[2] + 1.0, tON[3], 'w');
  note(layer, '같은 그림을 두 번씩 → 손으로 그린 애니메이션의 박자', 1620, 1330, S('sy08') + 0.3, S('sy09'), 'sm o');
  note(scr, '종이 결 · 필름 입자 · 가장자리 그늘 · 검은 띠', 60, 70, tON[3] + 0.8, brushT0, 'w');
  note(scr, '붓 자국이 보이는 질감', 60, 60, brushT0 + 0.5, brushT1, 'w');
  note(layer, '재료는 → 적힌 대로 만들어진다', 1620, 1330, S('sy11') + 0.3, S('sy12'), 'sm o');
  cam(S('sy12'), V.board, 1.4);
  hl(HL.body, A('sy12', '둥근', -0.2));
  put(board, `<div class="pol" style="width:600px"><span class="pin"></span><img src="assets/user/img/knight_before.jpg"><div class="cap">첫 결과 — 상자 로봇</div></div>`, 40, 150, S('sy12') + 0.4, S('ct01') + 0.2, { anim: 'pin', rot: -3 });
  put(board, `<div class="pol" style="width:600px"><span class="pin"></span><img src="assets/user/img/knight_after.jpg"><div class="cap after">고친 뒤 — 해골기사</div></div>`, 690, 120, A('sy13', '고친 뒤', -0.3), S('ct01') + 0.2, { anim: 'pin', rot: 2 });
  note(board, '둥근 두개골 · 드러난 갈비뼈 · 갑옷 조각', 120, 640, A('sy12', '둥근', 0), S('ct01') + 0.2, 'w');

  // ================= ③ 컷 구성 =================
  stepsT.push(S('ct01')); focus(S('ct01'), 2); cam(S('ct01'), V.splitT, 1.4);
  tiled('film', 0.3, 4.0, S('ct01'), S('ct02') + 0.4);
  cam(S('ct02'), V.work, 1.4);
  const STRIP_X = 1570, STRIP_Y = 1180, FW = 200, FH = 112.5, FG = 22;
  put(layer, '', STRIP_X, STRIP_Y, S('ct02') + 0.1, S('ct05') + 0.3, { cls: 'strip', style: 'width:1580px;height:220px', anim: 'fade' });
  const LAB = ['멀리서 넓게', '발치', '옆에서 나란히', '얼굴과 까마귀', '날아오름', '무덤 앞', '멀어짐'];
  const PH = ['멀리서', '발치를', '옆에서', '얼굴과', '날아오르는', '무덤', '멀어지는'];
  const DIST = [1, 0.12, 0.5, 0.15, 0.6, 0.45, 0.85];
  const fxs = [];
  LAB.forEach((lb, i) => {
    const x = STRIP_X + 20 + i * (FW + FG), at = i === 0 ? A('ct02', '일곱', -0.2) : A('ct03', PH[i], -0.2); fxs.push(x + FW / 2);
    put(layer, `<div class="fr" style="width:${FW}px;height:${FH}px"><img src="assets/user/img/shot${i + 1}.jpg" style="width:100%;height:100%;object-fit:cover"></div>`, x, STRIP_Y + 54, at, S('ct05') + 0.3, { anim: 'pop' });
    put(layer, `<div class="frlab">${lb}</div>`, x - 5, STRIP_Y + 236, at + 0.1, S('ct05') + 0.3, { anim: 'fade', sound: false });
  });
  // the camera distance across the seven cuts
  const pts = fxs.map((x, i) => [x - STRIP_X, 30 + (1 - DIST[i]) * 200]);
  const d = 'M ' + pts.map(([x, y]) => `${x} ${y.toFixed(0)}`).join(' L ');
  arrow(layer, d, STRIP_X, 1580, 1600, 280, A('ct04', '이유', 0), S('ct05') + 0.3, 'o');
  note(layer, '멀리', STRIP_X - 120, 1580, A('ct04', '이유', 0.3), S('ct05') + 0.3, 'sm o');
  note(layer, '가까이', STRIP_X - 150, 1780, A('ct04', '이유', 0.5), S('ct05') + 0.3, 'sm o');
  note(layer, '넓게 → 외로움', 1680, 1890, A('ct04', '넓은', -0.2), S('ct05') + 0.3, '');
  note(layer, '가까이 → 무게와 온기', 2400, 1890, A('ct04', '가까운', -0.2), S('ct05') + 0.3, '');
  cam(S('ct05'), V.splitT, 1.4);
  tiled('film', 12.6, 4.3, S('ct05'), S('ct07') + 0.3);
  hl(HL.cov1, A('ct06', '얼굴', -0.2)); hl(HL.cov2, A('ct06', '무덤', -0.2));
  cam(S('ct07'), V.board, 1.4);
  [['crow_before', '처음 — 까마귀가 숨었다', 60, 30, -2, A('ct07', '까마귀가', -0.3)], ['crow_after', '고친 뒤', 700, 40, 2, A('ct07', '숨었고', 0)],
   ['sword_before', '처음 — 칼이 기사를 가렸다', 60, 470, 1.5, A('ct07', '무덤의', -0.2)], ['sword_after', '고친 뒤', 700, 480, -2, A('ct07', '가렸거든요', -0.3)]].forEach(([img, cap, x, y, r, at]) =>
    put(board, `<div class="pol" style="width:560px"><span class="pin"></span><img src="assets/user/img/${img}.jpg"><div class="cap${img.endsWith('after') ? ' after' : ''}">${cap}</div></div>`, x, y, at, S('tm01') + 0.2, { anim: 'pin', rot: r }));
  note(layer, '미리 막는 문장 → 고치는 횟수가 준다', 140, 1060, S('ct08') + 0.2, S('tm01') + 0.2, 'big o', -1);

  // ================= ④ 시간표 =================
  stepsT.push(S('tm01')); focus(S('tm01'), 3); cam(S('tm01'), V.splitB, 1.4); cam(S('tm02'), V.work, 1.3);
  const RX = 1600, RW = 1500, RY = 1330;
  put(layer, '', RX - 30, RY - 140, S('tm02') - 0.2, S('sd01') + 0.2, { cls: 'tape', style: `width:${RW + 60}px;height:300px`, anim: 'fade', sound: false });
  // A — a narrated video: sentences become a timetable
  const SAY = [[0, 3.2], [3.4, 6.9], [7.1, 9.6], [9.8, 14.3], [14.5, 18.0]];
  const pxA = RW / 20;
  SAY.forEach(([a, b], i) => {
    const at = S('tm03') + i * 0.25;
    put(layer, `<div class="blk say" style="width:${((b - a) * pxA - 6).toFixed(0)}px;height:86px">문장 ${i + 1}</div>`, RX + a * pxA, RY - 110, at, S('tm04') + 0.4, { anim: 'pop' });
    put(layer, `<span class="tlab" style="position:static;transform:none">${a.toFixed(1)}초</span>`, RX + a * pxA - 10, RY + 40, at + 0.3, S('tm04') + 0.4, { anim: 'fade', sound: false });
    put(layer, '<div class="mark"></div>', RX + a * pxA, RY - 10, A('tm03', '화면은', 0) + i * 0.12, S('tm04') + 0.4, { anim: 'pop', sound: false });
  });
  note(layer, '녹음한 문장 → 시작과 끝 시각 → 화면이 그 시각에 맞춰 움직인다', RX, RY + 110, A('tm03', '화면은', 0.3), S('tm04') + 0.4, 'sm');
  put(layer, '<span class="stamp" style="position:static;opacity:1">대사 없음</span>', RX + 560, RY - 120, S('tm04') + 0.3, S('tm05') + 0.2, { anim: 'stamp', rot: -6 });
  // B — the wordless film: one silent line per cut, as long as the cut
  const pxB = RW / 30;
  SHOTS.forEach(([a, b], i) => {
    const at = S('tm05') + 0.3 + i * 0.22;
    put(layer, `<div class="blk rest" style="width:${((b - a) * pxB - 8).toFixed(0)}px;height:86px">쉼</div>`, RX + a * pxB, RY - 110, at, S('sd01') + 0.2, { anim: 'pop' });
    put(layer, `<img src="assets/user/img/shot${i + 1}.jpg" style="width:${((b - a) * pxB - 8).toFixed(0)}px;height:${(((b - a) * pxB - 8) * 9 / 16).toFixed(0)}px;object-fit:cover;border-radius:6px;display:block">`, RX + a * pxB, RY - 120 - ((b - a) * pxB - 8) * 9 / 16 - 12, at + 0.1, S('sd01') + 0.2, { anim: 'fade', sound: false });
    put(layer, `<span class="tlab" style="position:static;transform:none">${(b - a).toFixed(1)}초</span>`, RX + a * pxB + 20, RY + 40, A('tm06', '길이를', 0) + i * 0.1, S('sd01') + 0.2, { anim: 'fade', sound: false });
  });
  put(layer, '<span class="big3">= 30.00초</span>', RX + RW - 330, RY + 110, A('tm06', '정확히', -0.2), S('sd01') + 0.2, { anim: 'pop' });
  hl(HL.rest, A('tm05', '빈 대사', -0.2)); hl(HL.len, A('tm06', '길이를', 0));
  put(layer, `<div class="doc code" style="width:1060px"><div class="l"><span class="k">"narration"</span>: <span class="v">false</span>,</div><div class="l">{ <span class="k">"id"</span>: <span class="v">"s01"</span>, <span class="k">"say"</span>: <span class="v">"[long-break]"</span>, <span class="k">"gapAfter"</span>: <span class="v">3.45</span> }</div><div class="l" style="color:var(--term-dim)">   … 컷 일곱 개, 같은 모양으로</div></div>`, RX, 1540, A('tm06', '컷 길이에', 0), S('sd01') + 0.2, { anim: 'win' });
  note(layer, '실제 설정: 빈 대사 + 쉬는 시간 = 컷 길이', RX, 1880, A('tm06', '컷 길이에', 0.6), S('tm07'), '', -1);
  note(layer, '도구가 알아듣는 방식으로', RX, 1880, S('tm07') + 0.2, S('sd01') + 0.2, 'big o');

  // ================= ⑤ 소리 =================
  stepsT.push(S('sd01')); focus(S('sd01'), 4); cam(S('sd01'), V.splitB, 0.8);
  ['바람', '발소리', '칼 끌림', '까마귀 울음', '날갯짓'].forEach((w, i) => note(layer, w, 1640 + i * 300, 1200 + (i % 2) * 70, A('sd02', w === '칼 끌림' ? '칼' : w === '까마귀 울음' ? '까마귀' : w, -0.2), S('sd03'), 'big', -3 + i * 1.5));
  hl(HL.one, A('sd03', '한', -0.1)); cam(S('sd03'), V.work, 1.3);
  const beat = (x, y, speed, t0, t1, bad) => put(layer, `<div class="doc" style="width:700px"><div class="t">박자 파일</div><div class="l"><b>걸음 속도</b> ${bad ? '<span style="color:#c0392b;font-weight:800">0.80</span>' : '0.85'} · <b>보폭</b> 1.15</div><div class="l"><b>까마귀 울음</b> 2.6초 · 14.2초 · 24.0초 · 28.6초</div></div>`, x, y, t0, t1, { anim: 'win' });
  beat(1620, 1240, 0.85, S('sd03') + 0.3, S('sd06') + 0.2, false);
  const tgt = [['화면', '발을 움직인다', 1290], ['소리', '발소리를 낸다', 1640]];
  tgt.forEach(([a, b, y], i) => {
    put(layer, `<div class="doc" style="width:560px"><div class="t">${a}</div><div class="l">같은 숫자로 ${b}</div></div>`, 2560, y - 40, A('sd04', i ? '소리는' : '화면은', -0.2), S('sd06') + 0.2, { anim: 'pop' });
    arrow(layer, i ? 'M 10 20 C 120 60, 250 240, 380 330' : 'M 10 60 C 140 40, 260 30, 380 20', 2170, 1290 + (i ? 0 : -10), 400, 360, A('sd04', i ? '소리는' : '화면은', 0), S('sd05') + 0.2);
  });
  beat(1620, 1650, 0.80, A('sd05', '두 곳에', -0.2), A('sd05', '한 곳에', 0), true);
  note(layer, '한쪽만 고치면 → 어긋난다', 2420, 1880, A('sd05', '어긋납니다', -0.4), A('sd05', '한 곳에', 0), 'o');
  note(layer, '한 곳에 두면 → 함께 움직인다', 2420, 1880, A('sd05', '한 곳에', 0.1), S('sd06'), '');
  // hear it: the film's own sound under the feet shot, with its waveform and the footfalls it was made from
  cam(S('sd06'), V.wave, 1.4);
  const sdIn = 4.5, sdT0 = S('sd06') + 0.1, sdDur = Math.min(8.6, (S('wk01') - 0.05) - sdT0), sdSay = E('sd06') - sdT0;
  tiled('film', sdIn, sdDur, sdT0, sdT0 + sdDur, { audio: true, vol: [[0, 0.35], [Math.max(0.1, sdSay), 0.35], [Math.max(0.2, sdSay + 0.3), 1]] });
  note(scr, '발이 땅에 닿을 때마다 → 발소리', 60, 60, sdT0 + 0.3, sdT0 + sdDur, 'w');
  const SND = window.SOUND_DATA || { peaks: [], peaksFps: 60, steps: [] };
  const wave = $('wave'), wg = wave.getContext('2d'); let lastW = -1;
  live.push((t) => {
    const on = t >= sdT0 - 0.4 && t <= sdT0 + sdDur + 0.3; wave.style.opacity = on ? Math.min(K(t, sdT0 - 0.4, sdT0), 1 - K(t, sdT0 + sdDur, sdT0 + sdDur + 0.3)).toFixed(3) : '0';
    if (!on) return; const fr = Math.floor(t * 30); if (fr === lastW) return; lastW = fr;
    const pos = clamp(t - sdT0, 0, sdDur), a0 = sdIn, a1 = sdIn + sdDur;
    wg.clearRect(0, 0, 1600, 96); wg.fillStyle = 'rgba(42,34,48,0.10)'; wg.fillRect(0, 0, 1600, 96);
    for (let x = 0; x < 1600; x += 4) { const tt = a0 + (x / 1600) * (a1 - a0), v = SND.peaks[Math.floor(tt * SND.peaksFps)] || 0, h = Math.max(2, v * 110);
      wg.fillStyle = tt <= sdIn + pos ? '#e07a45' : 'rgba(42,34,48,0.45)'; wg.fillRect(x, 48 - h / 2, 3, h); }
    for (const s of SND.steps) { if (s < a0 || s > a1) continue; const x = ((s - a0) / (a1 - a0)) * 1600, hit = sdIn + pos >= s, fresh = hit && sdIn + pos - s < 0.25;
      wg.fillStyle = hit ? (fresh ? '#ffe2a8' : '#6b3f6e') : 'rgba(107,63,110,0.4)'; wg.beginPath(); wg.moveTo(x - 10, 0); wg.lineTo(x + 10, 0); wg.lineTo(x, 16); wg.fill(); }
    const px = (pos / (a1 - a0)) * 1600; wg.fillStyle = '#2a2230'; wg.fillRect(px - 2, 0, 4, 96);
  });

  // ================= ⑥ 일하는 방식 =================
  stepsT.push(S('wk01')); focus(S('wk01'), 5); cam(S('wk01'), V.splitB, 1.4); cam(S('wk02'), V.work, 1.3);
  hl(HL.plan, A('wk02', '설계도', -0.2));
  put(layer, `<div class="doc" style="width:1300px"><div class="t">설계도 — 「남은 길」</div>
    <div class="l"><b>세계</b> 끝없이 마른 흙 평원, 마른 풀과 돌, 땅에 꽂힌 칼과 창, 찢긴 깃발</div>
    <div class="l"><b>빛</b> 해질녘. 해가 30초 동안 지평선으로 내려간다. 그림자가 길다</div>
    <div class="l"><b>해골기사</b> 뼈가 드러난 몸, 남은 갑옷 조각, 찌그러진 철모, 찢긴 붉은 망토</div>
    <div class="l"><b>컷 표</b> 1 먼 풍경 · 2 발치 · 3 나란히 · 4 얼굴 · 5 날아오름 · 6 무덤 · 7 엔딩</div></div>`, 1620, 1200, A('wk02', '설계도', 0.2), S('wk03') + 0.2, { anim: 'win' });
  hl(HL.look, A('wk03', '찍어', -0.2));
  cam(S('wk03') + 0.3, V.board, 1.4);
  put(board, `<div class="pol" style="width:600px"><span class="pin"></span><img src="assets/user/img/wing_before.jpg"><div class="cap">처음 — 빗살 날개</div></div>`, 40, 150, A('wk04', '빗살', -0.3), S('wk05') + 0.3, { anim: 'pin', rot: -3 });
  put(board, `<div class="pol" style="width:600px"><span class="pin"></span><img src="assets/user/img/wing_after.jpg"><div class="cap after">확인하고 고친 뒤</div></div>`, 690, 120, A('wk04', '깃털이', -0.3), S('wk05') + 0.3, { anim: 'pin', rot: 2 });
  note(board, '스스로 찍어 보고 → 고친다', 160, 650, A('wk04', '스스로', -0.2), S('wk05') + 0.3, 'w');
  cam(S('wk05'), V.sec(5), 1.4);
  hl(HL.done, A('wk05', '검사', -0.2));
  [['검사 통과', '검사', 40], ['웹에 게시', '웹 페이지', 300], ['깃허브 보관', '깃허브', 540]].forEach(([w, ph, x], i) => put(sheet, `<span class="stamp" style="position:static;opacity:1;font-size:40px">${w}</span>`, x, 1750 + 262, A('wk05', ph, 0), S('fx01') + 0.2, { anim: 'stamp', rot: -8 + i * 5 }));

  // ================= 고칠 점 말하기 =================
  stepsT.push(S('fx01')); focus(S('fx01'), -1); cam(S('fx01'), V.screen, 1.4);
  tiled('film', 12.6, 4.3, S('fx01'), S('fx02'));
  still('assets/user/img/crow_before.jpg', S('fx02') - 0.1, S('my01') + 0.2);
  put(scr, '<div class="pbar" style="position:static;width:1600px"><span class="tri"></span><span>0:15.80 / 0:30.00</span><span class="track"><i style="width:52.7%"></i></span></div>', 0, 790, S('fx02'), S('my01') + 0.2, { anim: 'fade', sound: false });
  note(scr, '0:15 · 네 번째 컷 · 까마귀가 머리에 가려진다', 60, 60, A('fx02', '15초', -0.2), S('my01') + 0.2, 'w');
  arrow(scr, 'M 30 10 C 60 120, 120 200, 230 260', 560, 170, 260, 280, A('fx02', '까마귀가', 0), S('my01') + 0.2, 'w');
  note(layer, '어디를 고칠지 정확하게 → 고치는 것도 정확하게', 1620, 1100, S('fx03') + 0.2, S('my01'), 'big o', -1);

  // ================= 나만의 단편으로 =================
  stepsT.push(S('my01')); focus(S('my01'), -1); cam(S('my01'), V.sheet, 1.4);
  cam(S('my02'), V.sec(0), 1.3);
  secs[0].lines.forEach((ln, i) => { ln.classList.add('st'); strike(ln, A('my02', '이야기만', 0.3) + i * 0.2); });
  put(sheet, '<div class="sticky"><span class="note">비 오는 밤 골목,<br>늙은 우체부 고양이</span></div>', 300, 250 + 70, A('my02', '비 오는', -0.4), S('ed01'), { anim: 'pin', rot: 3 });
  cam(S('my03'), V.sec(1), 1.3);
  put(sheet, '<div class="sticky" style="background:#cfe6f5"><span class="note">명암 3단계 · 굵은 외곽선<br>푸른 새벽빛</span></div>', 240, 550 + 70, A('my03', '명암을', -0.4), S('ed01'), { anim: 'pin', rot: -2.5 });
  cam(S('my04'), V.sheet, 1.4);
  [2, 3, 4, 5].forEach((i, j) => put(sheet, '<span class="stamp" style="position:static;opacity:1">그대로</span>', 470, 250 + i * 300 + 16, A('my04', ['컷 구성', '시간표', '소리', '일하는'][j], -0.1), S('ed01') + 0.3, { anim: 'stamp', rot: -10 + j * 4 }));
  note(layer, '원리는 이야기가<br>바뀌어도 그대로', 2000, 1300, S('my04') + 1.0, S('ed01'), 'huge o', -2);

  // ================= 정리 =================
  stepsT.push(S('ed01')); cam(S('ed01'), V.work, 1.4);
  [['느낌 대신 재료', '재료를'], ['꾸미는 말 대신 보이는 모습', '모습을'], ['박자는 한 곳에', '한 곳에만']].forEach(([w, ph], i) =>
    put(layer, `<span class="big3">${i + 1}. ${w}</span>`, 1640, 1200 + i * 150, A('ed01', ph, -0.3), S('ed04'), { anim: 'rise', sound: 'pop' }));
  put(layer, '<span class="note big o">+ 몇 초, 몇 번째 컷으로 고칠 점 말하기</span>', 1640, 1660, A('ed02', '몇 초', -0.2), S('ed04'), { anim: 'hand' });
  note(layer, '주문서 전문 → 영상 설명란', 2350, 1880, S('ed03') + 0.2, S('ed04'), 'big', -2);
  cam(S('ed04') - 0.2, V.full, 2.6);
  const endT0 = S('ed04') - 0.6, endDur = Math.min(10.0, END + 0.2 - endT0);
  tiled('film', Math.max(0, 30 - endDur - 0.2), endDur, endT0, endT0 + endDur, { audio: true, vol: [[0, 0.25], [Math.max(0.2, E('ed04') - endT0), 0.25], [Math.max(0.4, E('ed04') - endT0 + 0.8), 0.9]] });

  // the sheet: a part is dim unless it is the one being explained
  live.push((t) => {
    let f = -1; for (const [ft, i] of FOCUS) if (t >= ft) f = i;
    secs.forEach((s, i) => {
      const on = t >= secOn[i]; const o = on ? Math.min(1, K(t, secOn[i], secOn[i] + 0.4)) : 0; const ov = o.toFixed(2); if (s.body.style.opacity !== ov) s.body.style.opacity = ov;
      const tb = t >= tabOn[i] ? 'scale(' + (0.6 + 0.4 * back(K(t, tabOn[i], tabOn[i] + 0.4))).toFixed(3) + ')' : 'scale(0)'; if (s.tab.style.transform !== tb) s.tab.style.transform = tb;
      const dm = f >= 0 && f !== i ? '0.62' : '0'; if (s.dim.style.opacity !== dm) s.dim.style.opacity = dm;
    });
  });

  // ---------------- sound: synthesized effects only (sfx/make_sfx.py) — no music in a tutorial ----------------
  const sfxBox = $('sfx');
  const LEAD = 0.03;
  const sfx = (key, t0, vol, dur) => M.clip(sfxBox, key, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0 - LEAD), dur: Math.min(M.SRC[key].dur, (dur || 9) + LEAD), audio: true, vol });
  const quiet = (t) => t < 30.3 || (t > sdT0 - 0.2 && t < sdT0 + sdDur);   // never over the film's own sound
  keysT.forEach(([at, dur], j) => { if (quiet(at)) return; const n = Math.max(1, Math.ceil((dur - 0.1) / 0.66)); for (let i = 0; i < n; i++) sfx((i + j) % 2 ? 'keys_b' : 'keys_a', at + i * 0.66, 0.8, Math.max(0.2, at + dur - (at + i * 0.66) + 0.04)); sfx('enter', at + dur + 0.05, 0.6); });
  stepsT.forEach((t0) => { if (!quiet(t0)) sfx('step', t0, 0.55); });
  const VOL = { ok: 0.5, pop: 0.5, whoosh: 0.55, shutter: 0.9, tick: 0.45 }, RANK = ['ok', 'shutter', 'pop', 'whoosh', 'tick'];
  const placed = [];
  snd.filter(([k, t]) => t >= 0 && t < END + 1 && !quiet(t) && VOL[k]).sort((a, b) => RANK.indexOf(a[0]) - RANK.indexOf(b[0]) || a[1] - b[1]).forEach(([kind, t]) => {
    if (stepsT.some((s0) => t > s0 - 0.25 && t < s0 + 0.7)) return;
    if (placed.some(([k, u]) => Math.abs(u - t) < (k === kind ? 0.12 : 0.22))) return;
    placed.push([kind, t]); sfx(kind, t, VOL[kind]);
  });

  // ---------------- every frame ----------------
  const deskEl = desk;
  onFrame((t) => {
    const [cx, cy, s] = camAt(t);
    const tr = `translate(${(960 - cx * s).toFixed(2)}px, ${(540 - cy * s).toFixed(2)}px) scale(${s.toFixed(4)})`;
    if (deskEl.style.transform !== tr) deskEl.style.transform = tr;
    light.style.transform = `rotate(${(24 + 3 * Math.sin(t * 0.03)).toFixed(3)}deg) translateX(${(Math.sin(t * 0.021) * 160).toFixed(1)}px)`;
    for (const r of reveals) { const on = t >= r.at && t < r.until; if (on !== r.last) { r.last = on; r.el.classList.toggle('on', on); } }
    for (const y of typed) { const n = Math.floor(y.text.length * K(t, y.at, y.at + y.dur) + 1e-6); if (n !== y.last) { y.last = n; y.el.textContent = y.text.slice(0, n); } }
    for (const f of live) f(t);
    for (const it of items) {
      const a = vis(t, it.t0, it.t1);
      if (a <= 0) { if (it.last !== 'h') { it.el.style.opacity = '0'; it.el.style.visibility = 'hidden'; it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.55); let tr2, cl = '';
      if (it.anim === 'pop') tr2 = `scale(${(0.84 + 0.16 * back(k)).toFixed(3)})`;
      else if (it.anim === 'win') tr2 = `translateY(${((1 - out(k)) * 36).toFixed(1)}px) scale(${(0.97 + 0.03 * out(k)).toFixed(3)})`;
      else if (it.anim === 'pin') tr2 = `translateY(${((1 - out(k)) * -60).toFixed(1)}px) scale(${(1.08 - 0.08 * out(k)).toFixed(3)})`;
      else if (it.anim === 'stamp') tr2 = `scale(${(1.6 - 0.6 * out(K(t, it.t0, it.t0 + 0.25))).toFixed(3)})`;
      else if (it.anim === 'hand') { tr2 = ''; cl = `inset(-30px ${((1 - out(K(t, it.t0, it.t0 + 0.7))) * 100).toFixed(1)}% -30px -30px)`; }
      else if (it.anim === 'fade') tr2 = '';
      else tr2 = `translateY(${((1 - out(k)) * 20).toFixed(1)}px)`;
      if (it.rot) tr2 += ` rotate(${it.rot}deg)`;
      const key = a.toFixed(3) + tr2 + cl; if (key === it.last) continue;
      it.el.style.visibility = 'inherit'; it.el.style.opacity = a.toFixed(3); it.el.style.transform = tr2; if (it.anim === 'hand') it.el.style.clipPath = cl; it.last = key;
    }
    // film grain at 24 fps, and the fade at the very end
    const g = Math.floor(t * 24);
    if (g !== lastG) { lastG = g; const r = rnd(g * 7 + 3), dd = gimg.data; for (let n = 0; n < dd.length; n += 4) { const v = 128 + (r() - 0.5) * 230; dd[n] = dd[n + 1] = dd[n + 2] = v; dd[n + 3] = 255; } grain.putImageData(gimg, 0, 0); }
    const bk = K(t, END - 1.6, END - 0.1).toFixed(3); if (black.style.opacity !== bk) black.style.opacity = bk;
  });
});
