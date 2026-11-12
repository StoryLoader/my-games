/*
 * scenes.js — 「반도체 vs 우주선, 무엇이 더 어려울까?」 in three.js (storyboard.md).
 * Two 3D worlds on one stage: the chip world is LIGHT (a white cleanroom floor, soft shadows), the space world is DARK
 * (stars, a hard sun). One renderer draws both, each inside its side of a vertical seam (scissor); the seam slides so
 * the speaker's world fills the stage. Every beat has its own small 3D set (js/models.js); labels ride on the models.
 * Words live in the DOM twice (light theme / dark theme), each clipped to its side of the seam.
 * Everything is a pure function of t.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, data } = ctx;
  scene('#world', 0, data.duration + 1);
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const END = data.duration, TAU = Math.PI * 2, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const fract = (x) => x - Math.floor(x);
  const vis = (t, a, b, fi = 0.5, fo = 0.4) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));

  // ---------------- times ----------------
  const V1 = A('pa08', '정밀함은', -0.1), V2 = A('ex07', '극한 환경은', -0.1), V3 = A('fa07', '무승부', -0.2), V4 = A('ra08', '희소성은', -0.1);
  // who fills the stage: +1 chip (light), −1 rocket (dark), 0 split
  const FOCUS = [[0, 0], [S('op02'), -1], [S('op04'), 1], [S('op05'), 0],
    [S('pa01'), 0], [S('pa02'), 1], [S('pa07'), -1], [S('pa08'), 1],
    [S('ex01'), 0], [S('ex02'), -1], [S('ex06'), 1], [S('ex07'), -1],
    [S('fa01'), 0], [S('fa02'), -1], [S('fa04'), 1], [S('fa07'), 0],
    [S('ra01'), 0], [S('ra02'), -1], [S('ra04'), 1], [S('ra06'), -1], [S('ra07'), 1],
    [S('tw01'), 0], [S('tw02'), -1], [S('tw05'), 0],
    [S('fn01'), 0], [S('fn02'), 1], [S('fn03'), -1], [S('fn05'), 0]];
  const focusAt = (t) => { let f = FOCUS[0][1]; for (let i = 1; i < FOCUS.length; i++) { const [kt, kf] = FOCUS[i]; f = lerp(f, kf, io(K(t, kt - 0.35, kt + 0.55))); } return f; };

  // ---------------- three.js: one renderer, two scenes ----------------
  const s3d = Stage3D.create(document.getElementById('gl'), { W, H, fov: 30, environment: false });
  const T = s3d.THREE, R = s3d.renderer, B = window.CVR.init(T);
  const { V, M, glowM, mesh, box, cyl, sph, seg } = B;
  R.toneMapping = T.NoToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFShadowMap;
  const env = new T.PMREMGenerator(R).fromScene(new T.RoomEnvironment(), 0.04).texture;
  // the light world
  const LS = new T.Scene(); LS.background = new T.Color(0xedf1f5); LS.fog = new T.Fog(0xedf1f5, 22, 52); LS.environment = env; LS.environmentIntensity = 0.55;
  { const floor = new T.Mesh(new T.PlaneGeometry(160, 160), new T.MeshStandardMaterial({ map: B.gridTex(), roughness: 0.9, metalness: 0 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; LS.add(floor);
    LS.add(new T.HemisphereLight(0xffffff, 0xd5dde8, 0.5));
    const key = new T.DirectionalLight(0xffffff, 1.25); key.position.set(5, 11, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02; LS.add(key); }
  // the dark world
  const DS = new T.Scene(); DS.background = new T.Color(0x04050b); DS.environment = env; DS.environmentIntensity = 0.12;
  { B.stars(DS); DS.add(new T.AmbientLight(0x6f86b8, 0.5)); const sun = new T.DirectionalLight(0xfff0dc, 2.4); sun.position.set(-7, 6, 8); DS.add(sun); const rim = new T.DirectionalLight(0xff8a3c, 0.7); rim.position.set(6, -2, -6); DS.add(rim); }
  const LC = new T.PerspectiveCamera(30, W / H, 0.1, 400), DC = new T.PerspectiveCamera(30, W / H, 0.1, 400);
  const SC = { L: LS, D: DS }, CAM = { L: LC, D: DC }, CAMS = { L: [], D: [] }, SETS = [];
  Video.progress(0.3);

  /** a 3D set: shown over ranges [[t0, t1], …] in world key ('L' | 'D'), camera cam = { d, h, a, ty, tx }. build(g) → update(t) */
  function addSet(key, ranges, cam, build) {
    const g = new T.Group(); SC[key].add(g); g.visible = false;
    if (typeof ranges[0] === 'number') ranges = [ranges];
    const upd = build(g, ranges[0][0], ranges[0][1]) || (() => {});
    SETS.push({ key, ranges, g, upd });
    for (const [a] of ranges) CAMS[key].push({ t0: a, d: 12, h: 1.6, a: 0.25, ty: 1.8, tx: 0, ...cam });
  }
  function camAt(key, t) {
    const ks = CAMS[key]; const c = { ...ks[0] };
    for (let i = 1; i < ks.length; i++) { const k = ks[i]; const e = io(K(t, k.t0 - 0.45, k.t0 + 0.75)); if (e <= 0) break; for (const f of ['d', 'h', 'a', 'ty', 'tx']) c[f] = lerp(c[f], k[f], e); }
    return c;
  }

  // ---------------- DOM: every item in both themes ----------------
  const LAY = [document.getElementById('ui-light'), document.getElementById('ui-dark')], seamEl = document.getElementById('seam');
  const X = 160, items = [], tags = [], cardsT = [], hitsT = [], bellsT = [];
  function item(html, x, y, t0, t1, o = {}) {
    const els = LAY.map((lay) => { const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
      if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
      el.style.top = (x === X && !o.raw ? y + 60 : y) + 'px';
      if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
      lay.appendChild(el); return el; });
    const it = { els, t0, t1, anim: o.anim || 'rise', rot: o.rot || 0, fi: o.fi || 0.5, fo: o.fo || 0.4, last: '' };
    items.push(it); return it;
  }
  /** a label riding on a 3D point: key = world, at() → Vector3 (world space), dy px above the point */
  function tag(key, html, at, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'tag ' + (o.cls || ''); el.innerHTML = html; LAY[key === 'L' ? 0 : 1].appendChild(el);
    tags.push({ key, el, at, t0, t1, dx: o.dx || 0, dy: o.dy == null ? -46 : o.dy, last: '' });
  }
  const CR = (who, lic) => `사진 ${who} · ${lic} · Wikimedia Commons`;
  const IMG = {
    shuttle: ['assets/user/shuttle.jpg', CR('NASA / Scott Andrews', '퍼블릭 도메인')], vikram: ['assets/user/vikram.jpg', CR('ISRO', 'GODL-India')],
    die: ['assets/user/die.jpg', CR('Fritzchens Fritz', 'CC0')], wafer: ['assets/user/wafer.jpg', CR('Peellden', 'CC BY-SA 3.0')],
    rs25: ['assets/user/rs25.jpg', CR('NASA · Aerojet Rocketdyne', '퍼블릭 도메인')], orion: ['assets/user/orion.jpg', CR('NASA / James Blair', '퍼블릭 도메인')],
    jwst: ['assets/user/jwst.jpg', CR('NASA / Chris Gunn', '퍼블릭 도메인')], percy: ['assets/user/perseverance.png', CR('NASA/JPL-Caltech/MSSS', '퍼블릭 도메인')],
    tiangong: ['assets/user/tiangong.jpg', CR('중국유인우주공정판공실', 'CC BY 4.0')],
  };
  /** a real photo, small, under the text column */
  const pic = (k, lab, t0, t1, o = {}) => { cardsT.push(t0); return item(`<div class="frame"><img src="${IMG[k][0]}" alt=""></div><span class="lab">${lab}</span><span class="cap">${IMG[k][1]}</span>`, o.x || X, o.y || 670, t0, t1, { cls: 'card', anim: 'card', rot: o.rot || -1.2, raw: true, style: `--w:${o.w || 400}px;--h:${o.h || 190}px;--pos:${o.pos || '50% 50%'}` }); };
  const pop = (html, x, y, t0, t1, o = {}) => item(html, x, y, t0, t1, { anim: 'pop', ...o });
  const roundCard = (no, ti, q, id) => { bellsT.push(S(id)); return item(`<span class="plate"><span class="no">ROUND ${no}</span><span class="ti">${ti}</span><span class="q">${q}</span></span>`, 0, 270, S(id) - 0.1, E(id) + 0.05, { cls: 'round', anim: 'pop', style: 'right:0' }); };
  const verdict = (html, cls, t0, t1) => { hitsT.push(t0); return item(`<span class="verdict ${cls}" style="display:inline-block">${html}</span>`, 'c', 740, t0, t1, { anim: 'stamp', rot: -3 }); };

  const board = item(`<div class="side c-chip"><span class="nm">반도체</span><span class="sc" data-s="chip">0</span></div><div class="pips"><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span></div><div class="side c-rocket"><span class="sc" data-s="rocket">0</span><span class="nm">우주선</span></div>`,
    0, 30, A('op05', '네 가지', -0.3), S('fn06') + 0.2, { cls: 'board', anim: 'rise', style: 'right:0' });
  const scChip = board.els.map((e) => e.querySelector('[data-s=chip]')), scRocket = board.els.map((e) => e.querySelector('[data-s=rocket]')), pipsAll = board.els.map((e) => [...e.querySelectorAll('.pip')]);
  let boardKey = '';

  // ================= texts =================
  // op
  item('<span class="plate"><span class="quote">“그건 <span class="c-rocket">로켓 과학</span>이<br>아니잖아.”</span><span class="en">“It’s not rocket science.”</span></span>', 'c', 310, A('op01', '그건', -0.3), S('op02') - 0.05);
  item('<span class="kick">어려운 일의 대명사</span><br><span class="hd h2">인류가 만든<br><span class="c-rocket">가장 어려운 기술</span>의<br>상징</span>', X, 200, S('op02') + 0.2, S('op03') - 0.05);
  pic('shuttle', '실제 우주왕복선 발사', S('op02') + 0.6, S('op03') - 0.05);
  item('<span class="kick">2023 · 인도 · 찬드라얀 3호</span><br><span class="hd h2">달 남극 근처 착륙</span><br><span class="hd h2 num c-rocket">약 7,500만 달러</span>', X, 220, S('op03') + 0.2, S('op04') - 0.05);
  pic('vikram', '실제 달 표면의 착륙선', A('op03', '달 남극', -0.3), S('op04') - 0.05);
  item('<span class="kick">가장 앞선 반도체 장비 한 대</span><br><span class="hd h1 num c-chip">약 2억 달러</span><span class="src">EUV 노광 장비 · 자료에 따라 1억~4억 달러</span>', X, 250, S('op04') + 0.2, S('op05') - 0.05);
  item('<span class="plate"><span class="hd h1"><span class="c-chip">반도체</span> <span class="num c-muted" style="font-size:80px">VS</span> <span class="c-rocket">우주선</span></span><br><span class="hd h2">무엇이 더 어려울까?</span></span>', 'c', 330, S('op05') + 0.2, S('op06') - 0.05);
  const CRIT = [['정밀함', '정밀함'], ['극한 환경', '극한 환경'], ['실패의 무게', '실패의 무게'], ['해낼 수 있는 곳의 수', '해낼 수 있는']];
  CRIT.forEach(([txt, ph], i) => item(`<span class="plate" style="padding:14px 34px 14px 20px"><div class="crit"><span class="n">${i + 1}</span>${txt}</div></span>`, 600, 240 + i * 150, A('op06', ph, -0.25), S('pa01') - 0.1, { anim: 'pop' }));
  // round 1
  roundCard(1, '정밀함', '얼마나 작고 정확하게 만들어야 할까?', 'pa01');
  item('<span class="kick">최신 칩 하나</span><br><span class="hd h2">트랜지스터<br><span class="c-chip">수백억 개</span></span><br><span class="sub">Apple M4 · <b class="num">280억 개</b></span>', X, 200, S('pa02') + 0.2, S('pa03') - 0.05);
  pic('die', '실제 칩 내부 (인텔 i9-13900K)', S('pa02') + 0.8, S('pa03') - 0.05);
  item('<span class="kick">네덜란드 · ASML</span><br><span class="hd h2"><span class="c-chip">EUV</span> 노광 장비</span><br><span class="sub">극자외선으로 회로를 <b>새겨 넣는</b> 기계</span>', X, 220, S('pa03') + 0.2, S('pa04') - 0.05);
  pic('wafer', '실제 웨이퍼 (지름 30 cm)', S('pa03') + 0.8, S('pa04') - 0.05, { pos: '50% 45%' });
  item('<span class="kick">빛의 파장</span><br><span class="hd h1 num c-chip">13.5 nm</span><br><span class="sub">머리카락 굵기의 <b>수천 분의 1</b></span><span class="src">ASML · 나노미터(nm) = 10억 분의 1미터</span>', X, 250, S('pa04') + 0.2, S('pa05') - 0.05);
  item('<span class="kick">빛을 만드는 법</span><br><span class="hd h2">주석 방울을<br><span class="c-chip num">1초에 5만 개</span></span><br><span class="sub">레이저로 <b>하나하나</b> 맞혀 터뜨린다</span><span class="src">ASML</span>', X, 250, S('pa05') + 0.2, S('pa06') - 0.05);
  item('<span class="kick">빛을 모으는 거울 · 독일 ZEISS</span><br><span class="hd h3">독일 땅만큼 키워도</span><br><span class="hd h2">가장 높은 요철<br><span class="c-chip num">0.1 mm</span></span><span class="src">Zeiss SMT</span>', X, 240, S('pa06') + 0.2, S('pa07') - 0.05);
  item('<span class="kick">우주선도 정밀하다 · 퍼서비어런스</span><br><span class="hd h2"><span class="c-rocket num">4억 7천만 km</span><br>날아가서</span><br><span class="sub">폭 <b>8 km쯤</b>의 목표 구역 안에 착륙</span><span class="src">NASA · 목표 타원 7.7 × 6.6 km</span>', X, 250, S('pa07') + 0.2, S('pa08') - 0.05);
  item('<span class="kick">칩 속 회로의 폭</span><br><span class="hd h2">원자 <span class="c-chip">수십 개</span></span>', X, 260, S('pa08') + 0.2, E('pa08') + 0.05);
  verdict('<small>ROUND 1 · 정밀함</small><span class="c-chip">반도체 승</span>', 'c-chip', V1, E('pa08') + 0.05);
  // round 2
  roundCard(2, '극한 환경', '얼마나 가혹한 조건을 견뎌야 할까?', 'ex01');
  item('<span class="kick">지구 궤도에 머무는 속도</span><br><span class="hd h1 num c-rocket">7.8 km/s</span><br><span class="sub">시속 약 <b class="num">28,000 km</b> · 총알보다 훨씬 빠르다</span>', X, 250, S('ex02') + 0.2, S('ex03') - 0.05);
  item('<span class="kick">그 속도를 내려면</span><br><span class="hd h2">몸의 대부분이<br><span class="c-rocket">연료</span></span><br><span class="sub">새턴 V · 발사 무게의 <b>열에 아홉쯤</b></span><span class="src">단별 질량에서 계산한 값</span>', X, 250, S('ex03') + 0.2, S('ex04') - 0.05);
  item('<span class="kick">우주왕복선 주 엔진 (RS-25)</span><br><span class="hd h2 num"><span class="c-cold">−253 ℃</span><br><span class="c-bad">3,300 ℃</span></span><br><span class="sub">액체 수소와 연소실이 <b>바로 곁에</b></span>', X, 200, S('ex04') + 0.2, S('ex05') - 0.05);
  pic('rs25', '실제 RS-25 엔진 시험', S('ex04') + 0.8, S('ex05') - 0.05, { pos: '50% 62%' });
  item('<span class="kick">2026년 4월 · 아르테미스 2호</span><br><span class="hd h2">시속 <span class="c-rocket num">약 4만 km</span>로<br>대기에 진입</span><br><span class="sub">겉면 <b class="num">2,000 ℃</b> 넘게 가열</span>', X, 200, S('ex05') + 0.2, S('ex06') - 0.05);
  pic('orion', '실제 귀환 장면 (오리온)', A('ex05', '달을', -0.2), S('ex06') - 0.05, { pos: '50% 8%' });
  item('<span class="kick">반도체 공장의 극한</span><br><span class="hd h2">먼지 한 톨,<br>떨림 하나까지 막는<br><span class="c-chip">고요한 극한</span></span>', X, 250, S('ex06') + 0.2, S('ex07') - 0.05);
  item('<span class="kick">견뎌야 하는 에너지의 크기</span><br><span class="hd h2"><span class="c-rocket">우주선</span>이 앞선다</span>', X, 260, S('ex07') + 0.2, E('ex07') + 0.05);
  verdict('<small>ROUND 2 · 극한 환경</small><span class="c-rocket">우주선 승</span>', 'c-rocket', V2, E('ex07') + 0.05);
  // round 3
  roundCard(3, '실패의 무게', '실수하면 어떻게 될까?', 'fa01');
  item('<span class="kick">한번 떠나면 고칠 수 없다</span><br><span class="hd h2">부품 <span class="c-rocket num">250만 개</span> 중<br>고무 고리 <span class="c-bad">하나</span></span><br><span class="sub">1986년 챌린저호 · <b>7명</b> 희생</span><span class="src">NASA 컬럼비아 사고조사위원회 보고서(부품 수) · 로저스 위원회</span>', X, 240, S('fa02') + 0.2, S('fa03') - 0.05);
  item('<span class="kick">제임스 웹 우주망원경</span><br><span class="hd h1 num c-rocket">344곳</span><br><span class="sub">하나만 어긋나도 <b>임무 전체</b>를 잃는 지점</span><span class="src">NASA 브리핑 (2021)</span>', X, 200, S('fa03') + 0.2, S('fa04') - 0.05);
  pic('jwst', '실제 제임스 웹의 거울', S('fa03') + 0.8, S('fa04') - 0.05, { pos: '50% 35%' });
  item('<span class="kick">칩 하나를 만들려면</span><br><span class="hd h2">공정 <span class="c-chip num">1,000번</span> 안팎<br>석 달</span><br><span class="sub">멀쩡한 칩의 비율 = <b>수율</b></span>', X, 250, S('fa04') + 0.2, S('fa05') - 0.05);
  item('<span class="kick">공정마다 99%만 성공한다면</span><br><span class="hd h2">10만 개 중<br><span class="c-bad num">4개</span></span><span class="src">0.99를 1,000번 곱하면 약 0.004%</span>', X, 250, S('fa05') + 0.2, S('fa06') - 0.05);
  item('<span class="hd h2">거의 <span class="c-chip">완벽</span>하게,<br>날마다 <span class="c-chip">수없이</span></span>', X, 300, S('fa06') + 0.2, S('fa07') - 0.05);
  pop('<span class="plate"><span class="hd h3 c-chip">수없는 반복의 완벽</span></span>', 150, 240, A('fa07', '수없는', -0.2), E('fa07') + 0.05);
  pop('<span class="plate"><span class="hd h3 c-rocket">단 한 번의 완벽</span></span>', 1150, 240, A('fa07', '단 한 번', -0.2), E('fa07') + 0.05);
  verdict('<small>ROUND 3 · 실패의 무게</small><span class="c-gold">무승부</span>', 'c-gold', V3, E('fa07') + 0.05);
  // round 4
  roundCard(4, '희소성', '해낼 수 있는 곳이 얼마나 적은가?', 'ra01');
  item('<span class="kick">우주에 간 나라들</span>', X, 230, S('ra02') + 0.1, S('ra04') - 0.05);
  [['스스로 위성 발사', '10여 개국', '위성을', 330], ['달 착륙', '5개국', '달에', 520], ['유인 우주비행', '3개국', '사람을', 710]].forEach(([a, b, ph, y]) => item(`<span class="hd h4">${a}</span><br><span class="hd h3 num c-rocket">${b}</span>`, X, y, A('ra02', ph, -0.3), S('ra04') - 0.05, { anim: 'pop' }));
  item('<span class="kick">가장 앞선 칩을 대량 생산</span><br><span class="hd h1 num c-chip">3곳</span>', X, 240, S('ra04') + 0.2, S('ra05') - 0.05);
  item('<span class="kick">EUV 장비를 만드는 회사</span><br><span class="hd h1 num c-chip">1곳</span><br><span class="hd h2">ASML</span>', X, 240, S('ra05') + 0.2, S('ra06') - 0.05);
  item('<span class="kick">중국의 경우</span>', X, 180, S('ra06') + 0.1, E('ra08') + 0.05);
  item('<div class="check"><span class="m c-ok">✓</span>자체 우주정거장 운영</div>', X, 250, A('ra06', '우주정거장', -0.3), E('ra08') + 0.05, { anim: 'pop' });
  item('<div class="check"><span class="m c-ok">✓</span>달 뒷면 시료 회수 <span class="num c-muted">(2024)</span></div>', X, 340, A('ra06', '달 뒷면', -0.3), E('ra08') + 0.05, { anim: 'pop' });
  item('<div class="check"><span class="m c-gold">△</span>EUV 장비 — <span class="c-gold">시제품 단계</span></div><span class="src" style="margin-left:70px">로이터(2025.12), TrendForce(2026.10) 등<br>양산까지 여러 해 전망</span>', X, 430, A('ra07', '시제품', -0.6), E('ra08') + 0.05, { anim: 'pop' });
  pic('tiangong', '실제 톈궁 우주정거장', S('ra06') + 0.8, S('ra07') - 0.05, { y: 700 });
  verdict('<small>ROUND 4 · 희소성</small><span class="c-chip">반도체 승</span>', 'c-chip', V4, E('ra08') + 0.05);
  // twist
  item('<span class="plate"><span class="hd h1 num"><span class="c-chip">2</span> : <span class="c-rocket">1</span></span><br><span class="hd h2">그런데, <span class="c-gold">반전</span></span></span>', 'c', 320, S('tw01') + 0.2, S('tw02') - 0.05);
  item('<span class="kick">우주선의 두뇌</span><br><span class="hd h2">결국 <span class="c-chip">반도체</span>.<br>그런데 최신 칩이<br>아니다</span>', X, 180, S('tw02') + 0.2, S('tw03') - 0.05);
  pic('percy', '실제 퍼서비어런스 (셀카)', S('tw02') + 0.8, S('tw05') - 0.05, { y: 700 });
  item('<span class="kick">퍼서비어런스의 컴퓨터 · RAD750</span><br><span class="hd h2"><span class="c-rocket num">1998년</span> 아이맥과<br>같은 계열의 칩</span><span class="src">PowerPC 750의 내방사선 판 · 약 200 MHz</span>', X, 180, S('tw03') + 0.2, S('tw04') - 0.05);
  item('<span class="kick">우주에는 강한 방사선</span><br><span class="hd h2">빠른 칩보다<br><span class="c-rocket">고장 나지 않는 칩</span></span>', X, 200, S('tw04') + 0.2, S('tw05') - 0.05);
  item('<span class="plate"><span class="hd h2">두 기술은<br><span class="c-gold">어려움의 종류</span>가 다르다</span></span>', 'c', 340, S('tw05') + 0.3, S('fn01') - 0.05);
  // conclusion
  item('<span class="plate"><span class="hd h1">그래서,<br>무엇이 더 어려울까?</span></span>', 'c', 320, S('fn01') + 0.1, S('fn02') - 0.05);
  item('<span class="kick">기준 ① 따라 하기 어려움</span><br><span class="hd h1 c-chip">반도체</span><br><span class="sub">수십 년 쌓인 기술 · 수많은 협력사<br><b>돈과 의지만으로는</b> 따라잡기 어렵다</span>', X, 250, S('fn02') + 0.2, S('fn03') - 0.05);
  item('<span class="kick">기준 ② 한 번의 실패가 치명적</span><br><span class="hd h1 c-rocket">우주선</span><br><span class="sub">연습은 땅에서,<br><b>본 무대는 단 한 번</b></span>', X, 250, S('fn03') + 0.2, S('fn04') - 0.05);
  item('<span class="kick">아직 아무도 해내지 못한 일</span><br><span class="hd h2">사람을 태우고<br><span class="c-rocket">화성 왕복</span></span>', X, 260, S('fn04') + 0.2, S('fn05') - 0.05);
  pop('<span class="plate"><span class="sub">지금 더 적은 곳만 해낼 수 있는 것</span><br><span class="hd h1 c-chip">반도체</span></span>', 130, 620, A('fn05', '지금', -0.2), S('fn06') - 0.05);
  pop('<span class="plate"><span class="sub">아직 끝까지 가 본 사람이 없는 것</span><br><span class="hd h1 c-rocket">우주</span></span>', 1090, 620, A('fn05', '아직', -0.2), S('fn06') - 0.05);
  item('<span class="plate" style="padding:20px 40px"><span class="quote c-muted" style="font-size:72px">“그건 로켓 과학이 아니잖아.”</span></span>', 'c', 520, A('fn06', '그건', -0.3), END - 5.6, { anim: 'pop' });
  item('<span class="plate"><span class="quote">“<span class="c-chip">반도체</span>도 아니잖아.”</span></span>', 'c', 690, A('fn06', '반도체도', -0.2), END - 5.6, { anim: 'pop' });
  item(`<h4>실사 자료</h4><div class="grid">
    <div>우주왕복선 발사 — NASA / Scott Andrews · 퍼블릭 도메인<br>달 표면의 비크람 — ISRO · GODL-India<br>RS-25 엔진 시험 — NASA · Aerojet Rocketdyne · 퍼블릭 도메인<br>오리온 우주선 — NASA / James Blair · 퍼블릭 도메인<br>제임스 웹 우주망원경 — NASA / Chris Gunn · 퍼블릭 도메인</div>
    <div>퍼서비어런스 — NASA/JPL-Caltech/MSSS · 퍼블릭 도메인<br>톈궁 — 중국유인우주공정판공실 · CC BY 4.0<br>칩 내부 사진 — Fritzchens Fritz · CC0<br>실리콘 웨이퍼 — Peellden · CC BY-SA 3.0<br>사진 출처: 모두 Wikimedia Commons</div></div>
    <div style="margin-top:18px">3D 모형은 모두 이 영상을 위해 코드로 만든 도식입니다(실제 모양·비율과 다름). ‘더 어렵다’는 측정값이 아니라 기준에 따른 판단입니다. 효과음은 코드로 합성했습니다.</div>`, 140, 200, END - 5.4, END + 2, { cls: 'credits' });

  // ---------------- sound: synthesized effects only ----------------
  const MD = MEDIA.install(ctx), sfxBox = document.getElementById('sfx');
  const sfx = (key, t0, vol) => MD.clip(sfxBox, key, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0), dur: MD.SRC[key].dur, audio: true, vol });
  cardsT.forEach((t0) => sfx('swish', t0 - 0.05, 0.45)); hitsT.forEach((t0) => sfx('hit', t0 - 0.02, 0.8)); bellsT.forEach((t0) => sfx('bell', t0, 0.5)); sfx('bell', S('op05') + 0.2, 0.4);
  await Promise.all(LAY.flatMap((l) => Array.from(l.querySelectorAll('img'))).map((im) => im.decode().catch(() => {})));
  Video.progress(0.5);

  // ================= 3D sets =================
  const cChip = 0x12b5a5, cRocket = 0xff8a3c;
  const NEUTRAL = [[0, S('op02')], [S('op05'), S('pa02')], [S('ex01'), S('ex02')], [S('fa01'), S('fa02')], [S('ra01'), S('ra02')], [S('tw01'), S('tw02')], [S('tw05'), S('fn02')], [S('fn05'), END + 1]];
  const wp = (o, x = 0, y = 0, z = 0) => () => o.localToWorld(V(x, y, z));

  // ---- heroes (split beats): a wafer on a stand / a rocket over the Earth
  addSet('L', NEUTRAL, { d: 12.5, h: 2.0, a: 0.25, ty: 1.9 }, (g) => {
    mesh(g, cyl(1.3, 1.5, 0.3, 48), M(0xd5dde6, { r: 0.5 }), 0, 0.15, 0); mesh(g, cyl(0.12, 0.12, 1.5, 16), M(0xb9c4d0, { r: 0.3, m: 0.8 }), 0, 1.0, 0);
    const w = B.wafer(g, 1.7); w.position.y = 2.3; const c = B.chip(g, 1.1); c.position.set(1.9, 0.6, 1.4);
    return (t) => { w.rotation.set(1.05, t * 0.35, 0); c.rotation.y = -t * 0.3; c.position.y = 0.6 + 0.12 * Math.sin(t * 1.3); };
  });
  addSet('D', NEUTRAL, { d: 12.5, h: 0.6, a: -0.2, ty: 2.0 }, (g) => {
    const e = B.planet(g, 'earth', 5); e.position.set(1.5, -4.2, -5); const r = B.rocket(g, 1.15); r.g.position.set(0, 0.6, 0);
    return (t) => { e.rotation.y = t * 0.03; r.g.rotation.z = -0.35 + 0.04 * Math.sin(t * 0.8); r.g.rotation.y = t * 0.25; r.g.position.y = 0.4 + 0.2 * Math.sin(t * 0.6); const f = 0.8 + 0.2 * Math.sin(t * 23); r.flame.scale.set(1, f, 1); r.light.intensity = 6; };
  });

  // ---- a launch (op02, ex07, fn03)
  const launch = (tA, tB) => (g) => {
    mesh(g, cyl(2.0, 2.2, 0.25, 48), M(0x3a4150, { r: 0.8 }), 0, 0.12, 0);
    const tw = M(0x8a93a0, { r: 0.5, m: 0.6 }); for (const x of [-1.25, -0.85]) seg(g, V(x, 0.2, -0.3), V(x, 4.4, -0.3), 0.05, tw); for (let i = 0; i < 6; i++) seg(g, V(-1.25, 0.6 + i * 0.7, -0.3), V(-0.85, 1.0 + i * 0.7, -0.3), 0.03, tw);
    const r = B.rocket(g, 1.1); const smoke = []; B.srand(5);
    for (let i = 0; i < 14; i++) { const s = mesh(g, sph(0.5, 16), M(0xcfd3da, { r: 1 })); s.userData = { a: B.rnd() * TAU, d: 0.6 + B.rnd() * 1.6, s: 0.6 + B.rnd() * 0.9 }; smoke.push(s); }
    return (t) => { const k = K(t, tA, tB), up = k * k * 7.5; r.g.position.y = 0.25 + up; const on = K(t, tA - 0.6, tA + 0.2), f = (0.85 + 0.15 * Math.sin(t * 27)) * on; r.flame.scale.set(1, Math.max(0.001, f * (1 + k * 0.8)), 1); r.flame.visible = on > 0.01; r.light.intensity = 14 * on;
      for (const s of smoke) { const g2 = out(K(t, tA - 0.5, tA + 2.5)); s.position.set(Math.cos(s.userData.a) * s.userData.d * (0.4 + g2 * 1.6), 0.3 + g2 * s.userData.s * 0.9, Math.sin(s.userData.a) * s.userData.d * (0.4 + g2 * 1.6)); s.scale.setScalar(Math.max(0.001, g2 * s.userData.s * 1.5)); } };
  };
  addSet('D', [S('op02'), S('op03')], { d: 14, h: 0.8, a: 0.45, ty: 3.2 }, launch(S('op02') + 1.2, S('op03') + 0.5));
  // ---- op03: the Moon landing
  addSet('D', [S('op03'), S('op04')], { d: 9.5, h: 1.4, a: 0.35, ty: 1.3 }, (g) => {
    const moon = B.planet(g, 'moon', 9); moon.position.y = -9; const e = B.planet(g, 'earth', 0.9); e.position.set(-6, 5.2, -12);
    const L = B.lander(g); const t0 = S('op03') + 0.4, t1 = A('op03', '착륙선', 0.6);
    tag('D', '찬드라얀 3호 착륙선<small>모형</small>', wp(L.g, 0, 1.9, 0), A('op03', '달 남극', 0.2), S('op04') - 0.05);
    return (t) => { const k = out(K(t, t0, t1)); L.g.position.y = lerp(3.4, 0.02, k); L.flame.visible = k < 0.98; L.flame.scale.y = 0.7 + 0.3 * Math.sin(t * 25); moon.rotation.y = 0.3; };
  });
  // ---- op04: two prices as columns
  addSet('L', [S('op04'), S('op05')], { d: 13.5, h: 1.8, a: 0.3, ty: 1.7 }, (g) => {
    const a = mesh(g, box(1.2, 1, 1.2), M(cRocket, { r: 0.45 }), -1.4, 0.5, 0), b = mesh(g, box(1.2, 1, 1.2), M(cChip, { r: 0.45 }), 1.4, 0.5, 0);
    const moon = B.planet(g, 'moon', 0.42); const ch = B.chip(g, 0.9);
    const tA = A('op04', '달 착륙', -1.6), tB = A('op04', '한 대', -0.2);
    tag('L', '달 착륙 임무<small>약 7,500만 달러</small>', wp(moon, 0, 0.5, 0), tA + 0.4, S('op05') - 0.05); tag('L', 'EUV 장비 한 대<small>약 2억 달러</small>', wp(ch, 0, 0.4, 0), tB + 0.5, S('op05') - 0.05);
    return (t) => { const ka = Math.max(0.001, out(K(t, tA, tA + 1.0))), kb = Math.max(0.001, out(K(t, tB, tB + 1.4))); const ha = 1.0 * ka, hb = 2.67 * kb; a.scale.y = ha; a.position.y = ha / 2; b.scale.y = hb; b.position.y = hb / 2;
      moon.position.set(-1.4, ha + 0.45, 0); moon.rotation.y = t * 0.4; moon.scale.setScalar(ka); ch.position.set(1.4, hb + 0.05, 0); ch.rotation.y = t * 0.5; ch.scale.setScalar(kb); };
  });
  // ---- pa02: a die full of transistors (dive in)
  addSet('L', [S('pa02'), S('pa03')], { d: 11, h: 4.2, a: 0.3, ty: 0.9 }, (g) => {
    const inner = new T.Group(); g.add(inner); mesh(inner, box(4.6, 0.25, 4.6), M(0x1f2a38, { r: 0.4, m: 0.3 }), 0, 0.125, 0);
    const n = 60, im = new T.InstancedMesh(box(0.05, 1, 0.05), M(0xffffff, { r: 0.35, m: 0.4 }), n * n), d = new T.Object3D(), col = new T.Color(); B.srand(12);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const h = 0.04 + B.rnd() * 0.12; d.position.set(-2.1 + i * 0.0712, 0.25 + h / 2, -2.1 + j * 0.0712); d.scale.set(1, h, 1); d.updateMatrix(); im.setMatrixAt(j * n + i, d.matrix); const r = B.rnd(); im.setColorAt(j * n + i, col.set(r < 0.5 ? 0x12b5a5 : r < 0.8 ? 0xd9b24a : 0x6fd8cf)); }
    im.castShadow = true; inner.add(im);
    tag('L', '트랜지스터<small>아주 작은 스위치</small>', () => inner.localToWorld(V(0.6, 0.5, 0.6)), A('pa02', '트랜지스터', 0.2), S('pa03') - 0.05);
    return (t) => { const k = io(K(t, S('pa02') + 0.6, E('pa02') - 0.4)); inner.scale.setScalar(lerp(1, 2.3, k)); inner.rotation.y = 0.3 + t * 0.07; };
  });
  // ---- pa03: the EUV scanner
  addSet('L', [S('pa03'), S('pa04')], { d: 13.5, h: 2.6, a: 0.45, ty: 1.5 }, (g) => {
    const m = B.euvMachine(g); tag('L', 'EUV 노광 장비<small>모형 · 실제는 버스만 한 크기</small>', wp(m.g, 0, 3.2, 0), S('pa03') + 0.8, S('pa04') - 0.05);
    return (t) => { m.g.rotation.y = -0.2 + 0.25 * Math.sin(t * 0.4); m.wafer.rotation.y = t; };
  });
  // ---- pa04: a hair and the wave
  addSet('L', [S('pa04'), S('pa05')], { d: 12, h: 2.2, a: 0.2, ty: 2.0 }, (g) => {
    const hair = mesh(g, cyl(1.5, 1.5, 9, 48), M(0xb98a5a, { r: 0.7 }), 0.6, 2.2, -1.6); hair.rotation.z = Math.PI / 2 - 0.12;
    const lens = new T.Group(); g.add(lens); lens.position.set(-0.6, 2.0, 2.4);
    mesh(lens, new T.TorusGeometry(0.85, 0.06, 12, 64), M(0x2a3545, { r: 0.3, m: 0.8 })); seg(lens, V(0.62, -0.62, 0), V(1.3, -1.3, 0), 0.07, M(0x2a3545, { r: 0.3, m: 0.8 }));
    const disc = new T.Mesh(new T.CircleGeometry(0.8, 48), M(0xffffff, { r: 0.1, op: 0.55 })); lens.add(disc);
    const pts = []; for (let i = 0; i <= 80; i++) pts.push(V(-0.66 + i * 0.0165, Math.sin(i * 0.3) * 0.2, 0.05));
    const wave = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.028, 8), glowM(0x089a8c)); lens.add(wave);
    tag('L', '머리카락<small>굵기 약 0.08 mm</small>', () => g.localToWorld(V(2.6, 3.9, -1.6)), A('pa04', '머리카락', -0.2), S('pa05') - 0.05);
    tag('L', '빛의 한 파장 13.5 nm<small>크게 확대한 모습</small>', wp(lens, 0, 1.15, 0), S('pa04') + 0.9, S('pa05') - 0.05);
    return (t) => { hair.scale.setScalar(Math.max(0.001, out(K(t, A('pa04', '머리카락', -0.5), A('pa04', '머리카락', 0.5))))); wave.rotation.x = t * 2.2; lens.position.y = 2.0 + 0.06 * Math.sin(t * 1.4); };
  });
  // ---- pa05: tin droplets, the laser, the flash
  addSet('L', [S('pa05'), S('pa06')], { d: 12, h: 1.6, a: 0.25, ty: 2.2 }, (g) => {
    mesh(g, cyl(0.22, 0.12, 0.5, 24), M(0x8a93a0, { r: 0.35, m: 0.8 }), 0, 4.2, 0); B.edge(mesh(g, box(1.2, 0.3, 0.9), M(0xd5dde6, { r: 0.5 }), 0, 4.6, 0));
    const drops = []; for (let i = 0; i < 7; i++) drops.push(mesh(g, sph(0.075, 16), M(0xd5dbe4, { r: 0.15, m: 1 })));
    const laser = mesh(g, cyl(0.035, 0.035, 2.6, 12), glowM(0xff3030, 0.9), -1.3, 2.0, 0); laser.rotation.z = Math.PI / 2; laser.castShadow = false;
    mesh(g, box(0.8, 0.7, 0.7), M(0x2a3545, { r: 0.4, m: 0.5 }), -3.0, 2.0, 0); mesh(g, box(0.5, 1.65, 0.5), M(0xd5dde6, { r: 0.5 }), -3.0, 0.82, 0);
    const flash = new T.Mesh(sph(0.2, 24), glowM(0xc9a8ff, 0.95)); flash.position.set(0, 2.0, 0); g.add(flash); const halo = new T.Mesh(sph(0.5, 24), glowM(0xb090ff, 0.25)); halo.position.set(0, 2.0, 0); g.add(halo);
    const light = new T.PointLight(0xb090ff, 0, 9); light.position.set(0, 2.0, 0.6); g.add(light);
    const dpts = []; for (let i = 0; i <= 16; i++) { const r = i / 16 * 1.25; dpts.push(new T.Vector2(r, r * r * 0.34)); }
    const mirror = mesh(g, new T.LatheGeometry(dpts, 48), M(0xb9c6d4, { r: 0.18, m: 0.9, side: T.DoubleSide }), 2.2, 2.0, 0); mirror.rotation.z = Math.PI / 2; B.edge(mesh(g, box(0.4, 1.4, 0.4), M(0xd5dde6, { r: 0.5 }), 2.3, 0.7, 0));
    const rays = []; for (let i = -2; i <= 2; i++) { const r = seg(g, V(0, 2.0, 0), V(2.15 - i * i * 0.1, 2.0 + i * 0.5, 0), 0.02, glowM(0x089a8c, 0.8)); r.castShadow = false; rays.push(r); }
    const tL = A('pa05', '레이저', -0.3);
    tag('L', '주석 방울', () => g.localToWorld(V(0.1, 3.5, 0)), S('pa05') + 0.9, S('pa06') - 0.05, { dx: 110, dy: 0 }); tag('L', '레이저', () => g.localToWorld(V(-1.6, 2.0, 0)), tL, S('pa06') - 0.05);
    tag('L', '극자외선<small>거울이 모은다</small>', () => g.localToWorld(V(1.9, 3.7, 0)), A('pa05', '터뜨리죠', -0.6), S('pa06') - 0.05);
    return (t) => { const on = K(t, tL, tL + 0.3), p = fract(t * 6.3), fl = Math.pow(1 - p, 2);
      drops.forEach((d, i) => { const u = fract(i / 7 + t * 0.9); d.position.set(0, 3.9 - u * 1.9, 0); d.visible = !(on > 0 && u > 0.97); });
      laser.visible = on > 0; laser.material.opacity = 0.35 + 0.6 * fl; flash.visible = halo.visible = on > 0; flash.scale.setScalar(0.6 + 1.2 * fl); halo.scale.setScalar(0.8 + 2.2 * fl); light.intensity = on * (4 + 26 * fl);
      rays.forEach((r) => { r.visible = on > 0; r.material.opacity = 0.2 + 0.7 * fl; }); };
  });
  // ---- pa06: the mirror; then Germany-sized
  addSet('L', [S('pa06'), S('pa07')], { d: 12.5, h: 2.4, a: 0.3, ty: 1.9 }, (g) => {
    const pts = []; for (let i = 0; i <= 20; i++) { const r = i / 20 * 1.7; pts.push(new T.Vector2(r, r * r * 0.16)); }
    const dish = mesh(g, new T.LatheGeometry(pts, 64), M(0xe6edf4, { r: 0.05, m: 1, side: T.DoubleSide }), 0, 2.5, 0); dish.rotation.x = 0.35;
    mesh(g, cyl(0.12, 0.3, 1.2, 20), M(0x8a93a0, { r: 0.35, m: 0.8 }), 0, 1.75, -0.25);
    const rays = []; for (let i = -2; i <= 2; i++) { const x = i * 0.6, a = seg(g, V(x, 5.0, 0.6), V(x, 2.62 + x * x * 0.14, 0.2), 0.02, glowM(0x089a8c, 0.8)), b = seg(g, V(x, 2.62 + x * x * 0.14, 0.2), V(0, 4.0, 1.0), 0.016, glowM(0x089a8c, 0.5)); a.castShadow = b.castShadow = false; rays.push(a, b); }
    const slab = mesh(g, box(6.0, 0.1, 2.6), M(0xc9d4df, { r: 0.1, m: 0.9 }), 0, 0.55, 1.2); B.edge(slab, 0x6f7f92); mesh(g, box(5.6, 0.5, 2.2), M(0xb9c4d0, { r: 0.6 }), 0, 0.25, 1.2);
    const bump = mesh(g, new T.ConeGeometry(0.05, 0.035, 16), M(cChip, { r: 0.3 }), 0.9, 0.62, 1.6); const ringM = new T.Mesh(new T.TorusGeometry(0.22, 0.02, 8, 40), glowM(0x089a8c)); ringM.rotation.x = Math.PI / 2; ringM.position.set(0.9, 0.63, 1.6); g.add(ringM);
    const tG = A('pa06', '독일 땅', -0.3), tB = A('pa06', '머리카락', -0.3);
    tag('L', 'EUV 거울<small>모형</small>', () => g.localToWorld(V(1.9, 3.6, 0)), S('pa06') + 0.8, S('pa07') - 0.05); tag('L', '독일 크기로 키운다면', () => g.localToWorld(V(-1.9, 0.75, 1.2)), tG + 0.3, S('pa07') - 0.05);
    tag('L', '가장 높은 곳 0.1 mm', wp(bump, 0, 0.2, 0), tB + 0.2, S('pa07') - 0.05, { cls: 'c-chip' });
    return (t) => { const kg = Math.max(0.001, out(K(t, tG, tG + 0.9))); slab.scale.x = kg; slab.visible = kg > 0.01; const kb = K(t, tB, tB + 0.3); bump.visible = ringM.visible = kb > 0; ringM.scale.setScalar(1 + 0.25 * Math.sin(t * 5)); rays.forEach((r) => { r.material.opacity = 0.45 + 0.3 * Math.sin(t * 3); }); };
  });
  // ---- Earth → Mars (pa07), and back (fn04)
  const marsTrip = (g, ret) => {
    const e = B.planet(g, 'earth', 0.75); e.position.set(-3.4, 0.6, 0); const m = B.planet(g, 'mars', 1.4); m.position.set(2.3, 2.9, -1);
    const c1 = new T.CatmullRomCurve3([V(-3.4, 0.6, 0), V(-2.3, 3.6, 0.6), V(0.0, 4.6, 0.3), V(1.7, 3.9, 0.3)]);
    const tube = new T.Mesh(new T.TubeGeometry(c1, 120, 0.035, 8), glowM(0xff8a3c)); g.add(tube); const probe = new T.Mesh(sph(0.11, 16), glowM(0xffffff)); g.add(probe);
    const n = V(-0.35, 0.25, 1).normalize(), spot = V(2.3, 2.9, -1).addScaledVector(n, 1.4);
    const ring = new T.Mesh(new T.TorusGeometry(0.34, 0.03, 8, 48), glowM(0xffd34d)); ring.position.copy(spot); ring.lookAt(spot.clone().add(n)); g.add(ring); const dot = new T.Mesh(sph(0.06, 12), glowM(0xffffff)); dot.position.copy(spot); g.add(dot);
    let tube2 = null; if (ret) { const c2 = new T.CatmullRomCurve3([V(1.7, 1.9, 0.3), V(0.4, 0.2, 0.9), V(-1.6, -0.4, 0.6), V(-3.2, 0.1, 0.2)]); tube2 = new T.Mesh(new T.TubeGeometry(c2, 120, 0.035, 8), glowM(0xffd34d)); g.add(tube2); }
    return { e, m, c1, tube, probe, ring, dot, tube2 };
  };
  addSet('D', [S('pa07'), S('pa08')], { d: 14, h: 1.0, a: 0.05, ty: 2.4 }, (g) => {
    const o = marsTrip(g, false); const tF = A('pa07', '날아가서', 0.6), tR = A('pa07', '폭이', -0.3), tD = A('pa07', '내려앉', -0.3);
    tag('D', '지구', wp(o.e, 0, 0.9, 0), S('pa07') + 0.6, S('pa08') - 0.05); tag('D', '화성', wp(o.m, 0.6, 1.6, 0), S('pa07') + 1.6, S('pa08') - 0.05);
    tag('D', '목표 구역<small>7.7 × 6.6 km</small>', () => o.ring.getWorldPosition(V(0, 0, 0)), tR + 0.3, S('pa08') - 0.05, { dy: 70 });
    return (t) => { const k = io(K(t, S('pa07') + 0.8, tF)); o.tube.geometry.setDrawRange(0, Math.floor(120 * k) * 48); o.probe.position.copy(o.c1.getPoint(k)); o.e.rotation.y = t * 0.2; o.m.rotation.y = 0.6;
      const kr = Math.max(0.001, out(K(t, tR, tR + 0.8))); o.ring.visible = kr > 0.01; o.ring.scale.set(kr, kr * 0.86, kr); o.dot.visible = t >= tD; };
  });
  // ---- pa08: a row of atoms
  addSet('L', [S('pa08'), E('pa08') + 0.1], { d: 12, h: 1.2, a: 0.15, ty: 1.9 }, (g) => {
    const at = []; for (let i = 0; i < 18; i++) at.push(mesh(g, sph(0.16, 24), M(cChip, { r: 0.18, m: 0.3 }), -2.55 + i * 0.3, 2.3, 0));
    const bar = mesh(g, box(5.4, 0.04, 0.04), M(0x2a3545), 0, 1.85, 0), c1 = mesh(g, box(0.04, 0.3, 0.04), M(0x2a3545), -2.7, 1.85, 0), c2 = mesh(g, box(0.04, 0.3, 0.04), M(0x2a3545), 2.7, 1.85, 0);
    B.edge(mesh(g, box(6, 0.25, 1.6), M(0xdde4ec, { r: 0.5 }), 0, 0.125, 0));
    tag('L', '회로의 폭 = 원자 수십 개', () => g.localToWorld(V(0, 1.6, 0)), S('pa08') + 1.8, V1 - 0.1, { dy: 50 });
    return (t) => { at.forEach((a, i) => { a.scale.setScalar(Math.max(0.001, back(K(t, S('pa08') + 0.4 + i * 0.06, S('pa08') + 0.8 + i * 0.06)))); a.position.y = 2.3 + 0.04 * Math.sin(t * 2 + i); }); const kb = K(t, S('pa08') + 1.6, S('pa08') + 2.2); bar.scale.x = Math.max(0.001, kb); c1.visible = c2.visible = kb > 0.9; };
  });
  // ---- ex02: orbit
  addSet('D', [S('ex02'), S('ex03')], { d: 14, h: 1.6, a: 0.2, ty: 1.9 }, (g) => {
    const e = B.planet(g, 'earth', 2.7); e.position.y = 1.8; const atm = new T.Mesh(sph(2.82, 48), glowM(0x6fb4ff, 0.14)); atm.position.y = 1.8; g.add(atm);
    const orb = new T.Group(); g.add(orb); orb.position.y = 1.8; orb.rotation.set(0.35, 0, 0.25);
    const ring = new T.Mesh(new T.TorusGeometry(3.5, 0.012, 6, 120), glowM(0xff8a3c, 0.5)); ring.rotation.x = Math.PI / 2; orb.add(ring);
    const sat = B.satellite(orb, 1.1); const trail = []; for (let i = 0; i < 16; i++) { const s = new T.Mesh(sph(0.07, 8), glowM(0xff8a3c, 0.8 * (1 - i / 16))); orb.add(s); trail.push(s); }
    tag('D', '초속 7.8 km', () => sat.getWorldPosition(V(0, 0, 0)), S('ex02') + 0.8, S('ex03') - 0.05, { dy: -56 });
    return (t) => { e.rotation.y = t * 0.12; const a = t * 1.5; sat.position.set(Math.cos(a) * 3.5, 0, Math.sin(a) * 3.5); sat.rotation.y = -a; trail.forEach((s, i) => { const b = a - (i + 1) * 0.07; s.position.set(Math.cos(b) * 3.5, 0, Math.sin(b) * 3.5); }); };
  });
  // ---- ex03: a rocket that is mostly propellant
  addSet('D', [S('ex03'), S('ex04')], { d: 13, h: 0.8, a: 0.35, ty: 2.5 }, (g) => {
    const shell = M(0xeef2f8, { r: 0.2, m: 0.1, op: 0.2, side: T.DoubleSide });
    const body = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 4.6, 48, 1, true), shell); body.position.y = 2.9; g.add(body); const nose = new T.Mesh(new T.ConeGeometry(0.9, 1.3, 48, 1, true), shell); nose.position.y = 5.85; g.add(nose);
    const edges = M(0xeef2f8, { r: 0.4 }); for (const y of [0.6, 5.2]) { const r = mesh(g, new T.TorusGeometry(0.9, 0.03, 8, 64), edges, 0, y, 0); r.rotation.x = Math.PI / 2; }
    const fuel = mesh(g, cyl(0.8, 0.8, 1, 48), M(0xff8a3c, { r: 0.5, e: 0xff6a1c, ei: 0.5 }), 0, 0.6, 0);
    const pay = mesh(g, cyl(0.62, 0.62, 0.42, 32), M(0xf2f4f7, { r: 0.35, m: 0.3 }), 0, 4.96, 0);
    for (let i = 0; i < 3; i++) mesh(g, cyl(0.16, 0.3, 0.4, 20), M(0x2a2f3a, { r: 0.4, m: 0.6 }), Math.cos(i * 2.094) * 0.42, 0.4, Math.sin(i * 2.094) * 0.42);
    const tF = A('ex03', '열에 아홉', -1.2); g.userData.k = 0.74;
    tag('D', '연료·산화제<small>약 90%</small>', () => g.localToWorld(V(0.9, 2.6, 0)), tF + 0.8, S('ex04') - 0.05, { dx: 150, dy: 0, cls: 'c-rocket' }); tag('D', '기체·탑재물', wp(pay, 0.7, 0, 0), tF + 1.6, S('ex04') - 0.05, { dx: 120, dy: 0 });
    return (t) => { const k = Math.max(0.001, io(K(t, tF, tF + 1.8))), h = 4.14 * k; fuel.scale.y = h; fuel.position.y = 0.6 + h / 2; g.rotation.y = 0.2 * Math.sin(t * 0.5); };
  });
  // ---- ex04: the engine, cold next to hot
  addSet('D', [S('ex04'), S('ex05')], { d: 12.5, h: 0.8, a: 0.3, ty: 2.5, tx: -0.4 }, (g) => {
    const en = B.engine(g); en.g.scale.setScalar(0.72); en.g.position.y = 1.25; const tC = A('ex04', '영하', -0.3), tH = A('ex04', '연소실', -0.3);
    tag('D', '액체 수소<small>−253 ℃</small>', () => en.g.localToWorld(en.tankPos.clone().add(V(-0.9, 0, 0))), tC, S('ex05') - 0.05, { cls: 'c-cold', dx: -120, dy: 0 }); tag('D', '연소실<small>3,300 ℃</small>', () => en.g.localToWorld(en.chamberPos.clone().add(V(0.5, 0, 0))), tH, S('ex05') - 0.05, { dx: 130, dy: 0, cls: 'c-bad' });
    return (t) => { const kc = K(t, tC, tC + 0.6), kh = K(t, tH, tH + 0.6), fl = 0.85 + 0.15 * Math.sin(t * 31); en.tankMat.emissiveIntensity = 0.5 * kc; en.cold.intensity = 10 * kc; en.chamberMat.emissiveIntensity = 2.2 * kh * fl; en.hot.intensity = 14 * kh * fl; en.flame.scale.set(1, fl, 1); en.g.rotation.y = 0.15 * Math.sin(t * 0.5); };
  });
  // ---- ex05: re-entry
  addSet('D', [S('ex05'), S('ex06')], { d: 11, h: 0.6, a: 0.25, ty: 2.6 }, (g) => {
    const e = B.planet(g, 'earth', 16); e.position.set(0, -15.2, -6); const atm = new T.Mesh(sph(16.25, 64), glowM(0x6fb4ff, 0.12)); atm.position.copy(e.position); g.add(atm);
    const cp = B.capsule(g, 1); cp.g.rotation.z = Math.PI - 0.7; const trail = [];
    for (let i = 0; i < 14; i++) { const s = new T.Mesh(sph(0.5, 16), glowM(i < 4 ? 0xfff0c0 : 0xff7a2a, 0.5 * (1 - i / 14))); g.add(s); trail.push(s); }
    const light = new T.PointLight(0xff8a3c, 0, 14); g.add(light); const tK = A('ex05', '시속', -0.4);
    tag('D', '방열판<small>2,000 ℃ 넘게</small>', () => cp.g.localToWorld(V(0, 1.5, 0)), A('ex05', '겉면', -0.3), S('ex06') - 0.05, { dx: -150, dy: 40, cls: 'c-bad' });
    return (t) => { const k = K(t, tK, tK + 0.8), sh = 0.03 * Math.sin(t * 40); cp.g.position.set(0.4 + sh, 2.9, 0); cp.shieldMat.emissiveIntensity = 2.6 * k; light.position.set(-0.2, 2.3, 1); light.intensity = 18 * k; e.rotation.y = t * 0.05;
      trail.forEach((s, i) => { const u = (i + 1) / 14; s.visible = k > 0; s.position.set(0.4 + u * 3.2 + 0.08 * Math.sin(t * 17 + i), 2.9 + u * 3.8, -u * 0.6); s.scale.setScalar(Math.max(0.001, (1.3 - u * 0.9) * k * (0.9 + 0.2 * Math.sin(t * 21 + i * 2)))); }); };
  });
  // ---- ex06: the quiet extreme (a cleanroom)
  addSet('L', [S('ex06'), S('ex07')], { d: 12, h: 2.0, a: 0.3, ty: 2.0 }, (g) => {
    mesh(g, cyl(1.5, 1.7, 0.3, 48), M(0xd5dde6, { r: 0.5 }), 0, 0.15, 0); const w = B.wafer(g, 1.6); w.position.y = 1.5;
    for (const x of [-1.6, 0, 1.6]) B.edge(mesh(g, box(1.4, 0.2, 2.2), M(0xdde4ec, { r: 0.5 }), x, 4.15, 0));
    const air = []; B.srand(9); for (let i = 0; i < 18; i++) { const a = new T.Mesh(cyl(0.012, 0.012, 0.6, 6), glowM(0x089a8c, 0.45)); a.userData = { x: -2.4 + B.rnd() * 4.8, z: -0.9 + B.rnd() * 1.8, p: B.rnd() }; g.add(a); air.push(a); }
    tag('L', '클린룸<small>위에서 아래로 흐르는 깨끗한 공기</small>', () => g.localToWorld(V(0, 3.3, 0)), S('ex06') + 0.9, S('ex07') - 0.05);
    return (t) => { w.rotation.y = t * 0.25; w.position.y = 1.5 + 0.05 * Math.sin(t); air.forEach((a) => { const u = fract(a.userData.p + t * 0.22); a.position.set(a.userData.x, 3.9 - u * 3.5, a.userData.z); a.material.opacity = 0.5 * Math.sin(u * Math.PI); }); };
  });
  // ---- ex07: the rocket fires
  addSet('D', [S('ex07'), E('ex07') + 0.1], { d: 14, h: 0.8, a: 0.45, ty: 3.2 }, launch(S('ex07') + 0.3, E('ex07') + 1.5));
  // ---- fa02: 2.5 million parts, one O-ring
  addSet('D', [S('fa02'), S('fa03')], { d: 12.5, h: 1.2, a: 0.3, ty: 2.6 }, (g) => {
    const inner = new T.Group(); g.add(inner); inner.scale.setScalar(0.76); const P = []; B.srand(21);
    for (let j = 0; j < 40; j++) for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + (j % 2) * 0.08; P.push([Math.cos(a) * 0.78, 0.5 + j * 0.1, Math.sin(a) * 0.78]); }
    for (let j = 0; j < 14; j++) { const r = 0.78 * (1 - j / 14), n = Math.max(6, Math.round(40 * (1 - j / 14))); for (let i = 0; i < n; i++) { const a = i / n * TAU; P.push([Math.cos(a) * r, 4.5 + j * 0.1, Math.sin(a) * r]); } }
    const im = new T.InstancedMesh(box(0.085, 0.085, 0.085), M(0xffffff, { r: 0.4, m: 0.3 }), P.length), d = new T.Object3D(), col = new T.Color();
    P.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.rotation.y = -Math.atan2(p[2], p[0]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); const r = B.rnd(); im.setColorAt(i, col.set(r < 0.6 ? 0xe9edf2 : r < 0.85 ? 0xb9c0cb : 0xff8a3c)); }); inner.add(im);
    const oring = new T.Mesh(new T.TorusGeometry(0.84, 0.045, 10, 64), glowM(0xff3b3b)); oring.rotation.x = Math.PI / 2; oring.position.y = 1.6; inner.add(oring);
    const tP = A('fa02', '250만', -0.8), tO = A('fa02', '고무 고리', -0.3);
    tag('D', '부품 250만 개 이상', () => inner.localToWorld(V(0, 6.0, 0)), tP + 0.6, S('fa03') - 0.05); tag('D', '고무 고리(O링) 하나', () => inner.localToWorld(V(0.84, 1.6, 0)), tO, S('fa03') - 0.05, { dx: 190, dy: 0, cls: 'c-bad' });
    return (t) => { im.count = Math.floor(P.length * K(t, tP, tP + 1.6)); im.visible = im.count > 0; inner.rotation.y = t * 0.3; const ko = K(t, tO, tO + 0.2); oring.visible = ko > 0; oring.scale.setScalar(1 + 0.08 * Math.sin(t * 7)); };
  });
  // ---- fa03: Webb and its 344 single points of failure
  addSet('D', [S('fa03'), S('fa04')], { d: 13.5, h: 1.2, a: 0.1, ty: 2.5 }, (g) => {
    const j = B.jwst(g); j.position.set(-2.3, 0.2, 0); j.rotation.y = 0.5;
    const n = 344, im = new T.InstancedMesh(sph(0.058, 10), new T.MeshBasicMaterial({ color: 0xffffff }), n), d = new T.Object3D(), cA = new T.Color(0xff8a3c), cB = new T.Color(0x5fe08a);
    for (let i = 0; i < n; i++) { d.position.set(0.1 + (i % 20) * 0.15, 4.5 - Math.floor(i / 20) * 0.19, 0.4); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, cA); } g.add(im);
    const tS = A('fa03', '344', -0.9), tG = A('fa03', '그 전부가', -0.2); let lastDone = -1;
    tag('D', '하나라도 실패하면 임무 실패', () => g.localToWorld(V(1.5, 1.0, 0.4)), tS + 1.0, S('fa04') - 0.05, { dy: 20 });
    return (t) => { j.rotation.y = 0.5 + 0.2 * Math.sin(t * 0.4); im.count = Math.floor(n * K(t, tS, tS + 1.3)); im.visible = im.count > 0; const done = Math.floor(n * K(t, tG, E('fa03') - 0.6)); if (done !== lastDone) { lastDone = done; for (let i = 0; i < n; i++) im.setColorAt(i, i < done ? cB : cA); im.instanceColor.needsUpdate = true; } };
  });
  // ---- fa04: a thousand steps on a line
  addSet('L', [S('fa04'), S('fa05')], { d: 13, h: 2.6, a: 0.25, ty: 1.0 }, (g) => {
    g.userData.k = 0.68;
    mesh(g, box(9.2, 0.18, 1.0), M(0x2a3545, { r: 0.6 }), 0, 0.55, 0.9); mesh(g, box(9.4, 0.46, 1.2), M(0xdfe5ec, { r: 0.6 }), 0, 0.23, 0.9);
    const st = []; for (let i = 0; i < 10; i++) { const m = M(0xdde4ec, { r: 0.5, e: 0x12b5a5, ei: 0 }); B.edge(mesh(g, box(0.72, 1.5, 0.9), m, -4.05 + i * 0.9, 0.75, -0.5)); mesh(g, box(0.5, 0.12, 0.06), M(0x12b5a5, { r: 0.3 }), -4.05 + i * 0.9, 1.2, -0.03); st.push(m); }
    const w = B.wafer(g, 0.42); const tA = A('fa04', '천 번', -0.5), tB = E('fa04') - 0.8;
    tag('L', '공정 약 1,000번 · 석 달', () => w.getWorldPosition(V(0, 0, 0)), tA + 0.2, S('fa05') - 0.05, { dy: -70 });
    return (t) => { const k = K(t, tA, tB); w.position.set(-4.3 + 8.6 * k, 0.68, 0.9); w.rotation.y = t * 2; st.forEach((m, i) => { m.emissiveIntensity = 0.9 * K(k * 10, i, i + 0.6); }); };
  });
  // ---- fa05: 0.99ⁿ
  addSet('L', [S('fa05'), S('fa06')], { d: 13, h: 1.6, a: 0.18, ty: 2.2 }, (g) => {
    const ax = M(0x2a3545, { r: 0.5 }); mesh(g, box(6.6, 0.06, 0.06), ax, 0, 0.4, 0); mesh(g, box(0.06, 3.9, 0.06), ax, -3.3, 2.3, 0);
    const pts = []; for (let n = 0; n <= 1000; n += 10) pts.push(V(-3.3 + 6.6 * n / 1000, 0.4 + 3.6 * Math.pow(0.99, n), 0)); const cv = new T.CatmullRomCurve3(pts);
    const tube = mesh(g, new T.TubeGeometry(cv, 200, 0.07, 10), M(0xd63333, { r: 0.4, e: 0xd63333, ei: 0.3 })); const ball = mesh(g, sph(0.16, 20), M(0xffffff, { r: 0.2 }));
    for (let i = 0; i <= 10; i++) mesh(g, box(0.03, 0.14, 0.03), ax, -3.3 + i * 0.66, 0.4, 0);
    const tA = S('fa05') + 0.8, tB = A('fa05', '거의', 0.4);
    tag('L', '100%', () => g.localToWorld(V(-3.3, 4.2, 0)), S('fa05') + 0.5, S('fa06') - 0.05); tag('L', '0.004%', () => g.localToWorld(V(3.3, 0.5, 0)), tB, S('fa06') - 0.05, { cls: 'c-bad', dy: -56 }); tag('L', '공정 1,000번 →', () => g.localToWorld(V(0, 0.4, 0)), S('fa05') + 1.0, S('fa06') - 0.05, { dy: 46 });
    return (t) => { const k = io(K(t, tA, tB)); tube.geometry.setDrawRange(0, Math.floor(200 * k) * 60); ball.position.copy(cv.getPoint(k)); };
  });
  // ---- fa06: a wafer of good dies, again and again
  addSet('L', [S('fa06'), S('fa07')], { d: 12, h: 1.8, a: 0.2, ty: 2.3 }, (g) => {
    const inner = new T.Group(); g.add(inner); inner.position.y = 2.4; inner.rotation.x = 1.0; mesh(inner, cyl(2.3, 2.3, 0.08, 64), M(0x202a3a, { r: 0.25, m: 0.8 }));
    const P = []; for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) if (Math.hypot(i, j) * 0.21 < 2.12) P.push([i * 0.21, j * 0.21, i + j]);
    const im = new T.InstancedMesh(box(0.18, 0.05, 0.18), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.4 }), P.length), d = new T.Object3D(), c = new T.Color(), c0 = new T.Color(0x12b5a5), c1 = new T.Color(0xeafffb);
    P.forEach((p, i) => { d.position.set(p[0], 0.06, p[1]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c0); }); inner.add(im);
    return (t) => { inner.rotation.y = t * 0.2; const sw = fract(t * 0.5) * 2 - 0.5; P.forEach((p, i) => { const u = (p[2] + 20) / 40, s = Math.exp(-Math.pow((u - sw) * 7, 2)); im.setColorAt(i, c.copy(c0).lerp(c1, s)); }); im.instanceColor.needsUpdate = true; };
  });
  // ---- fa07: many, again and again / only once
  addSet('L', [S('fa07'), S('ra01')], { d: 12.5, h: 1.6, a: 0.2, ty: 2.2 }, (g) => {
    const b = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) b.push(mesh(g, sph(0.2, 20), M(cChip, { r: 0.2, m: 0.3 }), -1.75 + i * 0.5, 1.0 + j * 0.5, 0));
    const tA = A('fa07', '수없는', -0.2); return (t) => { b.forEach((m, i) => m.scale.setScalar(Math.max(0.001, back(K(t, tA + i * 0.02, tA + 0.4 + i * 0.02))))); g.rotation.y = 0.2 * Math.sin(t * 0.6); };
  });
  addSet('D', [S('fa07'), S('ra01')], { d: 12.5, h: 1.0, a: -0.1, ty: 2.2 }, (g) => {
    const s = new T.Mesh(sph(0.75, 40), M(cRocket, { r: 0.3, e: 0xff6a1c, ei: 0.8 })); s.position.y = 2.1; g.add(s); const r = new T.Mesh(new T.TorusGeometry(1.2, 0.03, 8, 64), glowM(0xff8a3c, 0.7)); r.position.y = 2.1; g.add(r);
    const tA = A('fa07', '단 한 번', -0.2); return (t) => { s.scale.setScalar(Math.max(0.001, back(K(t, tA, tA + 0.5)))); r.rotation.set(t * 0.7, t * 0.5, 0); r.visible = t > tA; };
  });
  // ---- ra02–03: who has reached space
  addSet('D', [S('ra02'), S('ra04')], { d: 13.5, h: 0.8, a: 0.0, ty: 2.2 }, (g) => {
    const rows = [[11, '위성을', 3.5], [5, '달에', 2.2], [3, '사람을', 0.9]], dots = [];
    rows.forEach(([n, ph, y]) => { for (let i = 0; i < n; i++) { const m = mesh(g, sph(0.2, 20), M(cRocket, { r: 0.3, e: 0xff6a1c, ei: i === 10 ? 0.05 : 0.5, op: i === 10 ? 0.4 : null }), -2.1 + i * 0.47, y, 0); dots.push([m, A('ra02', ph, -0.3) + i * 0.06]); } });
    const sat = B.satellite(g, 0.8); sat.position.set(-3.0, 3.5, 0); const moon = B.planet(g, 'moon', 0.3); moon.position.set(-3.0, 2.2, 0); const cap = B.capsule(g, 0.36); cap.g.position.set(-3.0, 0.7, 0);
    const rk = B.rocket(g, 0.5); const tR = A('ra03', '스페이스', -0.4);
    tag('D', '민간 기업도<small>스페이스X 등</small>', wp(rk.g, 0, 2.3, 0), tR + 0.3, S('ra04') - 0.05);
    return (t) => { dots.forEach(([m, t0]) => m.scale.setScalar(Math.max(0.001, back(K(t, t0, t0 + 0.4))))); sat.rotation.y = t; sat.visible = t > A('ra02', '위성을', -0.4); moon.visible = t > A('ra02', '달에', -0.4); cap.g.visible = t > A('ra02', '사람을', -0.4);
      const k = K(t, tR, S('ra04')); rk.g.visible = k > 0; rk.g.position.set(3.4, -0.6 + k * k * 2.0, 1.2); rk.flame.scale.y = 0.8 + 0.2 * Math.sin(t * 25); rk.light.intensity = 5; };
  });
  // ---- ra04: three makers
  addSet('L', [S('ra04'), S('ra05')], { d: 13, h: 2.2, a: 0.2, ty: 1.5 }, (g) => {
    const cs = [['TSMC', '대만', -2.7], ['삼성전자', '한국', 0], ['인텔', '미국', 2.7]].map(([nm, co, x]) => { mesh(g, cyl(0.9, 1.0, 0.3, 40), M(0xd5dde6, { r: 0.5 }), x, 0.15, 0); const c = B.chip(g, 1.5); c.position.set(x, 1.3, 0); const t0 = A('ra04', co, -0.2); tag('L', `${nm}<small>${co}</small>`, wp(c, 0, 0.9, 0), t0 + 0.2, S('ra05') - 0.05); return [c, t0]; });
    return (t) => cs.forEach(([c, t0], i) => { c.scale.setScalar(Math.max(0.001, back(K(t, t0, t0 + 0.5)))); c.rotation.set(0.5, t * 0.5 + i, 0); });
  });
  // ---- ra05: one machine maker
  addSet('L', [S('ra05'), S('ra06')], { d: 14, h: 2.6, a: 0.4, ty: 1.6 }, (g) => {
    const m = B.euvMachine(g); const ring = new T.Mesh(new T.TorusGeometry(3.4, 0.05, 10, 96), glowM(0x089a8c, 0.8)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    tag('L', 'ASML<small>전 세계에 단 한 곳</small>', wp(m.g, 0, 3.2, 0), A('ra05', '단 한 곳', -0.4), S('ra06') - 0.05, { cls: 'c-chip' });
    return (t) => { m.g.rotation.y = -0.2 + 0.2 * Math.sin(t * 0.4); ring.scale.setScalar(1 + 0.05 * Math.sin(t * 3)); m.wafer.rotation.y = t; };
  });
  // ---- ra06: the station and the far side of the Moon
  addSet('D', [S('ra06'), S('ra07')], { d: 12.5, h: 1.2, a: 0.3, ty: 2.3 }, (g) => {
    const st = B.station(g); st.position.set(-0.6, 2.2, 0); st.scale.setScalar(0.9); const moon = B.planet(g, 'moon', 1.3); moon.position.set(2.3, 3.7, -3); const e = B.planet(g, 'earth', 9); e.position.set(0, -9.6, -4);
    tag('D', '톈궁 우주정거장<small>모형</small>', wp(st, 0, 1.8, 0), A('ra06', '우주정거장', -0.2), S('ra07') - 0.05); tag('D', '달 뒷면 시료<small>창어 6호 · 2024</small>', wp(moon, 0, 1.5, 0), A('ra06', '달 뒷면', -0.2), S('ra07') - 0.05);
    return (t) => { st.rotation.set(0.25, t * 0.25, 0.1); moon.rotation.y = t * 0.1; e.rotation.y = t * 0.03; };
  });
  // ---- ra07–08: a prototype, not finished
  addSet('L', [S('ra07'), E('ra08') + 0.1], { d: 14, h: 2.6, a: 0.4, ty: 1.6 }, (g) => {
    B.euvMachine(g, true); B.edge(mesh(g, box(1.7, 0.8, 1.5), M(0xcfd8e2, { r: 0.5 }), -0.9, 2.4, 0));
    const parts = [[1.0, 0.5, 0.8, 1.2, 3.4], [0.6, 0.6, 0.6, 2.9, 2.6], [0.8, 0.3, 1.0, -2.6, 3.0]].map(([w, h, d, x, y], i) => [B.edge(mesh(g, box(w, h, d), M(0xdde4ec, { r: 0.5 }), x, y, 0.3)), y, i]);
    tag('L', '시제품 단계<small>아직 완성되지 않음</small>', () => g.localToWorld(V(0, 3.9, 0)), A('ra07', '시제품', -0.4), V4 - 0.1, { cls: 'c-gold' });
    return (t) => { g.rotation.y = -0.2 + 0.2 * Math.sin(t * 0.4); parts.forEach(([p, y, i]) => { p.position.y = y + 0.14 * Math.sin(t * 1.3 + i * 2); p.rotation.y = t * 0.3 + i; }); };
  });
  // ---- tw02–04: the rover and its old chip
  addSet('D', [S('tw02'), S('tw05')], { d: 10.5, h: 2.0, a: 0.55, ty: 1.5 }, (g) => {
    B.marsGround(g); B.rover(g); const ch = B.chip(g, 0.9, 0xd9b24a); ch.position.set(0, 2.6, 0);
    const link = seg(g, V(0, 1.15, 0), V(0, 2.55, 0), 0.015, glowM(0xffd34d, 0.8)); const sh = new T.Mesh(new T.TorusGeometry(0.95, 0.03, 8, 64), glowM(0xb9a0ff, 0.9)); sh.position.set(0, 2.72, 0); g.add(sh);
    const rad = []; B.srand(31); for (let i = 0; i < 26; i++) { const r = new T.Mesh(cyl(0.012, 0.012, 0.8, 6), glowM(0xb9a0ff, 0.8)); r.rotation.z = 0.7; r.userData = { x: -3 + B.rnd() * 6, z: -1.5 + B.rnd() * 3, p: B.rnd(), s: 0.5 + B.rnd() }; g.add(r); rad.push(r); }
    const sunL = new T.PointLight(0xffc890, 12, 20); sunL.position.set(-4, 5, 4); g.add(sunL);
    tag('D', 'RAD750<small>1998년 아이맥과 같은 계열</small>', wp(ch, 0, 0.5, 0), S('tw03') + 0.3, S('tw05') - 0.05); tag('D', '방사선', () => g.localToWorld(V(-2.2, 3.4, 0)), S('tw04') + 0.4, S('tw05') - 0.05);
    return (t) => { const kc = Math.max(0.001, back(K(t, S('tw03') + 0.1, S('tw03') + 0.7))); ch.scale.setScalar(kc); ch.rotation.y = t * 0.6; ch.visible = link.visible = t > S('tw03') + 0.1; const kr = K(t, S('tw04') + 0.2, S('tw04') + 0.8); sh.visible = kr > 0; sh.rotation.set(Math.PI / 2 + 0.2 * Math.sin(t * 2), 0, t); sh.scale.setScalar(1 + 0.06 * Math.sin(t * 6));
      rad.forEach((r) => { const u = fract(r.userData.p + t * 0.45 * r.userData.s); r.visible = kr > 0; r.position.set(r.userData.x - 2 + u * 4, 6 - u * 5.5, r.userData.z); r.material.opacity = 0.8 * Math.sin(u * Math.PI) * kr; }); };
  });
  // ---- fn02: a web of suppliers
  addSet('L', [S('fn02'), S('fn03')], { d: 13, h: 2.0, a: 0.3, ty: 2.2 }, (g) => {
    const inner = new T.Group(); g.add(inner); inner.position.y = 2.3; const nodes = [], lm = M(0x8fb8c4, { r: 0.5 });
    const P = (i, j, k) => V(-2.5 + i * 1.25, -1.2 + j * 1.2, -0.7 + k * 1.4);
    for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) { const n = mesh(inner, sph(0.17, 20), M(cChip, { r: 0.25, m: 0.3, e: 0x12b5a5, ei: 0 })); n.position.copy(P(i, j, k)); nodes.push([n, i + j + k]); if (i < 4) seg(inner, P(i, j, k), P(i + 1, j, k), 0.02, lm); if (j < 2) seg(inner, P(i, j, k), P(i, j + 1, k), 0.02, lm); if (k < 1) seg(inner, P(i, j, k), P(i, j, k + 1), 0.02, lm); }
    return (t) => { inner.rotation.y = t * 0.25; nodes.forEach(([n, s]) => { const p = Math.exp(-Math.pow((fract(t * 0.35) * 10 - s) * 0.9, 2)); n.scale.setScalar(1 + 0.6 * p); n.material.emissiveIntensity = 1.2 * p; }); };
  });
  // ---- fn03: one launch, one chance
  addSet('D', [S('fn03'), S('fn04')], { d: 14, h: 0.8, a: 0.45, ty: 3.2 }, launch(A('fn03', '본 무대', -0.6), E('fn03') + 1.2));
  // ---- fn04: there and back — nobody yet
  addSet('D', [S('fn04'), S('fn05')], { d: 14, h: 1.0, a: 0.05, ty: 2.4 }, (g) => {
    const o = marsTrip(g, true); o.ring.visible = false; o.dot.visible = false;
    tag('D', '지구', wp(o.e, 0, 0.9, 0), S('fn04') + 0.5, S('fn05') - 0.05); tag('D', '화성', wp(o.m, 0.6, 1.6, 0), S('fn04') + 0.9, S('fn05') - 0.05); tag('D', '돌아오는 길 — 아직 아무도', () => g.localToWorld(V(-0.5, 0.0, 0.8)), S('fn04') + 3.2, S('fn05') - 0.05, { cls: 'c-gold', dy: 50 });
    return (t) => { const k1 = io(K(t, S('fn04') + 0.6, S('fn04') + 3.0)), k2 = io(K(t, S('fn04') + 3.0, E('fn04') - 0.2)); o.tube.geometry.setDrawRange(0, Math.floor(120 * k1) * 48); o.tube2.geometry.setDrawRange(0, Math.floor(120 * k2) * 48); o.probe.position.copy(o.c1.getPoint(k1)); o.probe.visible = k2 <= 0; o.e.rotation.y = t * 0.2; };
  });

  for (const k of ['L', 'D']) CAMS[k].sort((a, b) => a.t0 - b.t0);
  Video.progress(0.9);

  // ---------------- per frame ----------------
  const tmp = V(0, 0, 0);
  onFrame((t) => {
    const f = focusAt(t), seam = Math.round(clamp(960 + f * 960, 0, W));
    // sets
    for (const s of SETS) { let v = 0; for (const [a, b] of s.ranges) v = Math.max(v, Math.min(out(K(t, a - 0.1, a + 0.6)), 1 - io(K(t, b - 0.35, b)))); if (v <= 0.001) { if (s.g.visible) s.g.visible = false; continue; } s.g.visible = true; s.g.scale.setScalar(v * (s.g.userData.k || 1)); s.upd(t); }
    // cameras: the subject sits right of the text when its world has the stage, in the middle of its half when split
    const oxL = lerp(-480, 400, io(clamp(f, 0, 1))), oxD = lerp(480, 400, io(clamp(-f, 0, 1)));
    for (const [key, ox] of [['L', oxL], ['D', oxD]]) { const c = camAt(key, t), cam = CAM[key], a = c.a + 0.16 * Math.sin(t * 0.21 + (key === 'L' ? 0 : 1.3));
      cam.position.set(c.tx + Math.sin(a) * c.d, c.ty + c.h, Math.cos(a) * c.d); cam.lookAt(c.tx, c.ty, 0); cam.setViewOffset(W, H, -ox, 0, W, H); cam.updateMatrixWorld(); }
    LS.updateMatrixWorld(); DS.updateMatrixWorld();
    s3d.fit(); R.setScissorTest(true);
    if (seam > 0) { R.setScissor(0, 0, seam, H); R.setViewport(0, 0, W, H); R.render(LS, LC); }
    if (seam < W) { R.setScissor(seam, 0, W - seam, H); R.setViewport(0, 0, W, H); R.render(DS, DC); }
    // themes, seam
    LAY[0].style.clipPath = `inset(0px ${W - seam}px 0px 0px)`; LAY[1].style.clipPath = `inset(0px 0px 0px ${seam}px)`;
    seamEl.style.left = seam + 'px'; seamEl.style.opacity = seam > 4 && seam < W - 4 ? '1' : '0';
    // tags
    for (const g of tags) { const a = vis(t, g.t0, g.t1, 0.35, 0.3); if (a <= 0) { if (g.last !== 'h') { g.el.style.opacity = '0'; g.el.style.visibility = 'hidden'; g.last = 'h'; } continue; }
      tmp.copy(g.at()).project(CAM[g.key]); if (tmp.z > 1) { g.el.style.opacity = '0'; g.last = ''; continue; }
      const x = clamp((tmp.x + 1) / 2 * W + g.dx, 130, W - 130), y = clamp((1 - tmp.y) / 2 * H + g.dy, 185, 930), key = a.toFixed(2) + '|' + x.toFixed(0) + '|' + y.toFixed(0); if (key === g.last) continue;
      g.el.style.visibility = 'inherit'; g.el.style.opacity = a.toFixed(3); g.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${(0.85 + 0.15 * out(K(t, g.t0, g.t0 + 0.35))).toFixed(3)})`; g.last = key; }
    // scoreboard
    const sc = (t >= V1 ? 1 : 0) + (t >= V4 ? 1 : 0), sr = t >= V2 ? 1 : 0, bk = sc + '|' + sr + '|' + (t >= V3 ? 1 : 0);
    if (bk !== boardKey) { boardKey = bk; for (let i = 0; i < 2; i++) { scChip[i].textContent = String(sc); scRocket[i].textContent = String(sr); const p = pipsAll[i];
      p[0].className = 'pip' + (t >= V1 ? ' chip' : ''); p[1].className = 'pip' + (t >= V2 ? ' rocket' : ''); p[2].className = 'pip' + (t >= V3 ? ' draw' : ''); p[3].className = 'pip' + (t >= V4 ? ' chip' : ''); } }
    // items
    for (const it of items) {
      const a = vis(t, it.t0, it.t1, it.fi, it.fo);
      if (a <= 0) { if (it.last !== 'h') { for (const el of it.els) { el.style.opacity = '0'; el.style.visibility = 'hidden'; } it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.6); let tr;
      if (it.anim === 'stamp') tr = `rotate(${it.rot}deg) scale(${lerp(2.2, 1, out(K(t, it.t0, it.t0 + 0.22))).toFixed(3)})`;
      else if (it.anim === 'pop') tr = `scale(${(0.82 + 0.18 * back(k)).toFixed(3)})`;
      else if (it.anim === 'card') tr = `translateY(${((1 - out(k)) * 30).toFixed(1)}px) rotate(${it.rot}deg)`;
      else tr = `translateY(${((1 - out(k)) * 20).toFixed(1)}px)`;
      const op = it.anim === 'stamp' ? Math.min(1, K(t, it.t0, it.t0 + 0.08)) * (1 - K(t, it.t1 - it.fo, it.t1)) : a, key2 = op.toFixed(3) + tr;
      if (key2 === it.last) continue;
      for (const el of it.els) { el.style.visibility = 'inherit'; el.style.opacity = op.toFixed(3); el.style.transform = tr; } it.last = key2;
    }
  });
});
