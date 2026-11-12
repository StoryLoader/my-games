/*
 * scenes.js — 「반도체 vs 우주선, 무엇이 더 어려울까?」 (storyboard.md). A dark duel stage: the chip world (cyan grid) on
 * the left, the rocket world (orange, stars) on the right. A slanted seam slides toward whoever is not speaking, so the
 * speaker's world fills the stage. A scoreboard keeps four rounds. Shapes are drawn on canvas (bg: the two worlds,
 * fx: diagrams); every word is DOM. Real photos are Wikimedia Commons files credited on each card.
 * Every frame is a pure function of t. Every circle radius goes through arc() (never negative).
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, fitCanvas, data } = ctx;
  scene('#world', 0, data.duration + 1);
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const END = data.duration, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const fract = (x) => x - Math.floor(x);
  const vis = (t, a, b, fi = 0.5, fo = 0.4) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  let seed = 11; const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const C = { chip: '#35e0d0', rocket: '#ff8a3c', gold: '#ffd34d', fg: '#eef2f8', muted: '#9aa6ba', bad: '#ff5a5a', ok: '#5fe08a' };

  // ---------------- times ----------------
  const V1 = A('pa08', '정밀함은', -0.1), V2 = A('ex07', '극한 환경은', -0.1), V3 = A('fa07', '무승부', -0.2), V4 = A('ra08', '희소성은', -0.1);
  // who fills the stage: +1 chip, −1 rocket, 0 even
  const FOCUS = [[0, 0], [S('op02'), -1], [S('op04'), 1], [S('op05'), 0],
    [S('pa01'), 0], [S('pa02'), 1], [S('pa07'), -1], [S('pa08'), 1],
    [S('ex01'), 0], [S('ex02'), -1], [S('ex06'), 1], [S('ex07'), -1],
    [S('fa01'), 0], [S('fa02'), -1], [S('fa04'), 1], [S('fa07'), 0],
    [S('ra01'), 0], [S('ra02'), -1], [S('ra04'), 1], [S('ra06'), -1], [S('ra07'), 1],
    [S('tw01'), 0], [S('tw02'), -1], [S('tw05'), 0],
    [S('fn01'), 0], [S('fn02'), 1], [S('fn03'), -1], [S('fn05'), 0]];
  const focusAt = (t) => { let f = FOCUS[0][1]; for (let i = 1; i < FOCUS.length; i++) { const [kt, kf] = FOCUS[i]; f = lerp(f, kf, io(K(t, kt - 0.35, kt + 0.55))); } return f; };

  // ---------------- canvases ----------------
  const bc = document.querySelector('#world canvas.bg'), bg = fitCanvas(bc, 1920, 1080, 1.5);
  const fc = document.querySelector('#world canvas.fx'), g = fitCanvas(fc, 1920, 1080, 2);
  const STARS = Array.from({ length: 170 }, () => [rnd() * 1920, rnd() * 1080, 0.6 + rnd() * 1.8, rnd() * TAU]);
  const arc = (c, x, y, r, a0 = 0, a1 = TAU) => c.arc(x, y, Math.max(0, r), a0, a1);
  const disc = (x, y, r, col, a = 1) => { g.globalAlpha = clamp(a, 0, 1); g.fillStyle = col; g.beginPath(); arc(g, x, y, r); g.fill(); };
  const ring = (x, y, r, col, a = 1, w = 3) => { g.globalAlpha = clamp(a, 0, 1); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); arc(g, x, y, r); g.stroke(); };
  const line = (x0, y0, x1, y1, col, a = 1, w = 3) => { g.globalAlpha = clamp(a, 0, 1); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const rect = (x, y, w, h, col, a = 1) => { g.globalAlpha = clamp(a, 0, 1); g.fillStyle = col; g.fillRect(x, y, Math.max(0, w), Math.max(0, h)); };
  const glow = (x, y, r, col, a = 1) => { if (r <= 0 || a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = clamp(a, 0, 1); g.fillStyle = gr; g.beginPath(); arc(g, x, y, r); g.fill(); };

  function drawBg(t) {
    const f = focusAt(t), seam = 960 + f * 850, sl = 70;
    bg.globalAlpha = 1; bg.globalCompositeOperation = 'source-over';
    // rocket world (whole stage), then the chip world clipped to the left of the seam
    const rg = bg.createLinearGradient(0, 0, 0, 1080); rg.addColorStop(0, '#140b12'); rg.addColorStop(1, '#0a0914'); bg.fillStyle = rg; bg.fillRect(0, 0, 1920, 1080);
    const hz = bg.createRadialGradient(1500, 1180, 60, 1500, 1180, 900); hz.addColorStop(0, 'rgba(255,138,60,0.20)'); hz.addColorStop(1, 'rgba(255,138,60,0)'); bg.fillStyle = hz; bg.fillRect(0, 0, 1920, 1080);
    for (const [x, y, r, ph] of STARS) { bg.globalAlpha = 0.35 + 0.35 * Math.sin(t * 0.9 + ph); bg.fillStyle = '#ffe9d6'; bg.beginPath(); arc(bg, x, y, r); bg.fill(); }
    bg.globalAlpha = 1;
    bg.save(); bg.beginPath(); bg.moveTo(0, 0); bg.lineTo(seam + sl, 0); bg.lineTo(seam - sl, 1080); bg.lineTo(0, 1080); bg.closePath(); bg.clip();
    const cg = bg.createLinearGradient(0, 0, 0, 1080); cg.addColorStop(0, '#06202a'); cg.addColorStop(1, '#07131f'); bg.fillStyle = cg; bg.fillRect(0, 0, 1920, 1080);
    const cz = bg.createRadialGradient(380, -80, 60, 380, -80, 1000); cz.addColorStop(0, 'rgba(53,224,208,0.16)'); cz.addColorStop(1, 'rgba(53,224,208,0)'); bg.fillStyle = cz; bg.fillRect(0, 0, 1920, 1080);
    bg.strokeStyle = 'rgba(53,224,208,0.075)'; bg.lineWidth = 1; bg.beginPath();
    for (let x = 0; x <= 1920; x += 48) { bg.moveTo(x, 0); bg.lineTo(x, 1080); } for (let y = 0; y <= 1080; y += 48) { bg.moveTo(0, y); bg.lineTo(1920, y); } bg.stroke();
    bg.strokeStyle = 'rgba(53,224,208,0.13)'; bg.beginPath(); for (let x = 0; x <= 1920; x += 240) { bg.moveTo(x, 0); bg.lineTo(x, 1080); } for (let y = 0; y <= 1080; y += 240) { bg.moveTo(0, y); bg.lineTo(1920, y); } bg.stroke();
    bg.restore();
    // the seam
    const sg = bg.createLinearGradient(seam + sl, 0, seam - sl, 1080); sg.addColorStop(0, 'rgba(53,224,208,0.9)'); sg.addColorStop(1, 'rgba(255,138,60,0.9)');
    bg.strokeStyle = sg; bg.lineWidth = 5; bg.beginPath(); bg.moveTo(seam + sl, 0); bg.lineTo(seam - sl, 1080); bg.stroke();
    bg.globalAlpha = 0.25; bg.lineWidth = 18; bg.stroke(); bg.globalAlpha = 1;
  }

  // ---------------- DOM items ----------------
  const X = 160;
  const ui = document.getElementById('ui'), items = [], cardsT = [], hitsT = [], bellsT = [];
  function item(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
    el.style.top = (x === X ? y + 60 : y) + 'px';
    if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
    ui.appendChild(el); const it = { el, t0, t1, anim: o.anim || 'rise', rot: o.rot || 0, fi: o.fi || 0.5, fo: o.fo || 0.4, last: '' };
    items.push(it); return it;
  }
  const CR = (who, lic) => `사진 ${who} · ${lic} · Wikimedia Commons`;
  const IMG = {
    shuttle: ['assets/user/shuttle.jpg', CR('NASA / Scott Andrews', '퍼블릭 도메인')],
    vikram: ['assets/user/vikram.jpg', CR('ISRO', 'GODL-India')],
    die: ['assets/user/die.jpg', CR('Fritzchens Fritz', 'CC0')],
    wafer: ['assets/user/wafer.jpg', CR('Peellden', 'CC BY-SA 3.0')],
    rs25: ['assets/user/rs25.jpg', CR('NASA · Aerojet Rocketdyne', '퍼블릭 도메인')],
    orion: ['assets/user/orion.jpg', CR('NASA / James Blair', '퍼블릭 도메인')],
    jwst: ['assets/user/jwst.jpg', CR('NASA / Chris Gunn', '퍼블릭 도메인')],
    percy: ['assets/user/perseverance.png', CR('NASA/JPL-Caltech/MSSS', '퍼블릭 도메인')],
    tiangong: ['assets/user/tiangong.jpg', CR('중국유인우주공정판공실', 'CC BY 4.0')],
  };
  const pic = (k, lab, x, y, t0, t1, o = {}) => { cardsT.push(t0); return item(`<div class="frame"><img src="${IMG[k][0]}" alt=""></div>${lab ? `<span class="lab">${lab}</span>` : ''}<span class="cap">${IMG[k][1]}</span>`, x, y, t0, t1, { cls: 'card', anim: 'card', rot: o.rot || 0, style: `--w:${o.w || 480}px;--h:${o.h || 320}px;--pos:${o.pos || '50% 50%'}` }); };
  const pop = (html, x, y, t0, t1, o = {}) => item(html, x, y, t0, t1, { anim: 'pop', ...o });
  const lab = (text, x, y, t0, t1, cls = '') => pop(`<span class="label ${cls}">${text}</span>`, x, y, t0, t1);
  const roundCard = (no, ti, q, id) => { bellsT.push(S(id)); return item(`<span class="no">ROUND ${no}</span><span class="ti">${ti}</span><span class="q">${q}</span>`, 0, 300, S(id) - 0.1, E(id) + 0.05, { cls: 'round', anim: 'pop', style: 'right:0' }); };
  const verdict = (html, cls, t0, t1) => { hitsT.push(t0); return item(`<span class="verdict ${cls}" style="display:inline-block">${html}</span>`, 'c', 740, t0, t1, { anim: 'stamp', rot: -3 }); };

  // scoreboard (from op05)
  const board = item(`<div class="side c-chip"><span class="nm">반도체</span><span class="sc" data-s="chip">0</span></div><span class="vs">VS</span><div class="pips"><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span></div><span class="vs">VS</span><div class="side c-rocket"><span class="sc" data-s="rocket">0</span><span class="nm">우주선</span></div>`,
    0, 34, A('op05', '네 가지', -0.3), S('fn06') + 0.2, { cls: 'board', anim: 'rise', style: 'right:0' });
  const scChip = board.el.querySelector('[data-s=chip]'), scRocket = board.el.querySelector('[data-s=rocket]'), pips = [...board.el.querySelectorAll('.pip')];
  let boardKey = '';

  // ================= op =================
  item('<span class="quote">“그건 <span class="c-rocket">로켓 과학</span>이<br>아니잖아.”</span><span class="en">“It’s not rocket science.”</span>', 'c', 330, A('op01', '그건', -0.3), S('op02') - 0.05);
  item('<span class="kick">어려운 일의 대명사</span><br><span class="hd h2">인류가 만든<br><span class="c-rocket">가장 어려운 기술</span>의<br>상징</span>', X, 280, S('op02') + 0.2, S('op03') - 0.05);
  pic('shuttle', '', 1060, 210, S('op02') + 0.3, S('op03') - 0.05, { w: 640, h: 560, rot: 1.5 });
  item('<span class="kick">2023 · 인도 · 찬드라얀 3호</span><br><span class="hd h2">달 남극 근처 착륙</span><br><span class="hd h1 num c-rocket">약 7,500만 달러</span>', X, 250, S('op03') + 0.2, S('op04') - 0.05);
  pic('vikram', '달 표면의 착륙선 ‘비크람’', 1280, 400, A('op03', '달 남극', -0.3), S('op04') - 0.05, { w: 500, h: 326, rot: -1.2 });
  item('<span class="kick">가장 앞선 반도체 장비 한 대</span><br><span class="hd h1 num c-chip">약 2억 달러</span><span class="src">EUV 노광 장비 · 자료에 따라 1억~4억 달러</span>', X, 230, S('op04') + 0.2, S('op05') - 0.05);
  lab('달 착륙 임무 · 약 7,500만 달러', 900, 560, A('op04', '달 착륙', -1.6), S('op05') - 0.05, 'c-rocket');
  lab('장비 한 대 · 약 2억 달러', 900, 760, A('op04', '한 대', -0.2), S('op05') - 0.05, 'c-chip');
  item('<span class="hd h1"><span class="c-chip">반도체</span> <span class="num" style="font-size:80px;color:#9aa6ba">VS</span> <span class="c-rocket">우주선</span></span><br><span class="hd h2">무엇이 더 어려울까?</span>', 'c', 330, S('op05') + 0.2, S('op06') - 0.05);
  const CRIT = [['정밀함', '정밀함'], ['극한 환경', '극한 환경'], ['실패의 무게', '실패의 무게'], ['해낼 수 있는 곳의 수', '해낼 수 있는']];
  CRIT.forEach(([txt, ph], i) => item(`<div class="crit"><span class="n">${i + 1}</span>${txt}</div>`, 600, 250 + i * 150, A('op06', ph, -0.25), S('pa01') - 0.1, { anim: 'pop' }));

  // ================= round 1: 정밀함 =================
  roundCard(1, '정밀함', '얼마나 작고 정확하게 만들어야 할까?', 'pa01');
  item('<span class="kick">최신 칩 하나</span><br><span class="hd h2">트랜지스터<br><span class="c-chip">수백억 개</span></span><br><span class="sub">Apple M4 · <b class="num">280억 개</b></span>', X, 250, S('pa02') + 0.2, S('pa03') - 0.05);
  pic('die', '칩 내부를 확대한 사진 (인텔 코어 i9-13900K)', 960, 250, S('pa02') + 0.4, S('pa03') - 0.05, { w: 760, h: 420, rot: 1 });
  item('<span class="kick">네덜란드 · ASML</span><br><span class="hd h2"><span class="c-chip">EUV</span> 노광 장비</span><br><span class="sub">극자외선으로 회로를 <b>새겨 넣는</b> 기계</span>', X, 260, S('pa03') + 0.2, S('pa04') - 0.05);
  pic('wafer', '회로가 새겨진 실리콘 웨이퍼 (지름 30 cm)', 1120, 220, S('pa03') + 0.5, S('pa04') - 0.05, { w: 560, h: 560, rot: -1.5 });
  item('<span class="kick">빛의 파장</span><br><span class="hd h1 num c-chip">13.5 nm</span><br><span class="sub">머리카락 굵기의 <b>수천 분의 1</b></span><span class="src">ASML · 나노미터(nm) = 10억 분의 1미터</span>', X, 250, S('pa04') + 0.2, S('pa05') - 0.05);
  lab('머리카락 단면 (약 0.08 mm)', 1260, 880, A('pa04', '머리카락', -0.3), S('pa05') - 0.05);
  lab('13.5 nm', 990, 300, S('pa04') + 0.9, S('pa05') - 0.05, 'c-chip');
  item('<span class="kick">빛을 만드는 법</span><br><span class="hd h2">주석 방울을<br><span class="c-chip num">1초에 5만 개</span></span><br><span class="sub">레이저로 <b>하나하나</b> 맞혀 터뜨린다</span><span class="src">ASML</span>', X, 250, S('pa05') + 0.2, S('pa06') - 0.05);
  lab('주석 방울', 1310, 230, S('pa05') + 0.8, S('pa06') - 0.05);
  lab('레이저', 900, 520, A('pa05', '레이저', -0.3), S('pa06') - 0.05, 'c-bad');
  lab('극자외선', 1640, 578, A('pa05', '터뜨리죠', -0.5), S('pa06') - 0.05, 'c-chip');
  item('<span class="kick">빛을 모으는 거울 · 독일 ZEISS</span><br><span class="hd h3">독일 땅만큼 키워도</span><br><span class="hd h2">가장 높은 요철<br><span class="c-chip num">0.1 mm</span></span><span class="src">Zeiss SMT</span>', X, 240, S('pa06') + 0.2, S('pa07') - 0.05);
  lab('독일 크기로 키운 거울', 1180, 900, A('pa06', '독일 땅', -0.3), S('pa07') - 0.05);
  lab('0.1 mm', 1290, 730, A('pa06', '머리카락', -0.2), S('pa07') - 0.05, 'c-chip');
  item('<span class="kick">우주선도 정밀하다 · 퍼서비어런스</span><br><span class="hd h2"><span class="c-rocket num">4억 7천만 km</span><br>날아가서</span><br><span class="sub">폭 <b>8 km쯤</b>의 목표 구역 안에 착륙</span><span class="src">NASA · 목표 타원 7.7 × 6.6 km</span>', X, 250, S('pa07') + 0.2, S('pa08') - 0.05);
  lab('지구', 900, 880, S('pa07') + 0.6, S('pa08') - 0.05); lab('화성', 1690, 250, S('pa07') + 2.2, S('pa08') - 0.05, 'c-rocket');
  lab('7.7 × 6.6 km', 1420, 860, A('pa07', '폭이', -0.2), S('pa08') - 0.05, 'c-rocket');
  item('<span class="kick">칩 속 회로의 폭</span><br><span class="hd h2">원자 <span class="c-chip">수십 개</span></span>', X, 260, S('pa08') + 0.2, E('pa08') + 0.05);
  verdict('<small>ROUND 1 · 정밀함</small><span class="c-chip">반도체 승</span>', 'c-chip', V1, E('pa08') + 0.05);

  // ================= round 2: 극한 환경 =================
  roundCard(2, '극한 환경', '얼마나 가혹한 조건을 견뎌야 할까?', 'ex01');
  item('<span class="kick">지구 궤도에 머무는 속도</span><br><span class="hd h1 num c-rocket">7.8 km/s</span><br><span class="sub">시속 약 <b class="num">28,000 km</b> · 총알보다 훨씬 빠르다</span>', X, 250, S('ex02') + 0.2, S('ex03') - 0.05);
  item('<span class="kick">그 속도를 내려면</span><br><span class="hd h2">몸의 대부분이<br><span class="c-rocket">연료</span></span><br><span class="sub">새턴 V · 발사 무게의 <b>열에 아홉쯤</b></span><span class="src">단별 질량에서 계산한 값</span>', X, 250, S('ex03') + 0.2, S('ex04') - 0.05);
  lab('연료·산화제 약 90%', 1470, 620, A('ex03', '열에 아홉', -0.3), S('ex04') - 0.05, 'c-rocket');
  lab('기체·탑재물', 1470, 300, A('ex03', '열에 아홉', 0.5), S('ex04') - 0.05);
  item('<span class="kick">우주왕복선 주 엔진 (RS-25)</span><br><span class="hd h2 num"><span style="color:#7fc4ff">−253 ℃</span><br><span class="c-bad">3,300 ℃</span></span><br><span class="sub">액체 수소와 연소실이 <b>바로 곁에</b></span>', X, 240, S('ex04') + 0.2, S('ex05') - 0.05);
  pic('rs25', 'RS-25 엔진 연소 시험', 900, 210, S('ex04') + 0.4, S('ex05') - 0.05, { w: 430, h: 560, rot: -1, pos: '50% 60%' });
  lab('연소실 3,300 ℃', 1540, 250, A('ex04', '연소실', -0.3), S('ex05') - 0.05, 'c-bad');
  lab('액체 수소 −253 ℃', 1540, 850, A('ex04', '영하', -0.3), S('ex05') - 0.05);
  item('<span class="kick">2026년 4월 · 아르테미스 2호</span><br><span class="hd h2">시속 <span class="c-rocket num">약 4만 km</span>로<br>대기에 진입</span><br><span class="sub">겉면 <b class="num">2,000 ℃</b> 넘게 가열</span><span class="src">NASA 발표와 언론 보도</span>', X, 240, S('ex05') + 0.2, S('ex06') - 0.05);
  pic('orion', '지구로 돌아온 오리온 우주선 (아르테미스 2호)', 1250, 200, A('ex05', '달을', -0.2), S('ex06') - 0.05, { w: 470, h: 600, rot: 1.2, pos: '50% 0%' });
  item('<span class="kick">반도체 공장의 극한</span><br><span class="hd h2">먼지 한 톨,<br>떨림 하나까지 막는<br><span class="c-chip">고요한 극한</span></span>', X, 250, S('ex06') + 0.2, S('ex07') - 0.05);
  pic('wafer', '', 1140, 230, S('ex06') + 0.5, S('ex07') - 0.05, { w: 540, h: 540, rot: 1 });
  item('<span class="kick">견뎌야 하는 에너지의 크기</span><br><span class="hd h2"><span class="c-rocket">우주선</span>이 앞선다</span>', X, 260, S('ex07') + 0.2, E('ex07') + 0.05);
  verdict('<small>ROUND 2 · 극한 환경</small><span class="c-rocket">우주선 승</span>', 'c-rocket', V2, E('ex07') + 0.05);

  // ================= round 3: 실패의 무게 =================
  roundCard(3, '실패의 무게', '실수하면 어떻게 될까?', 'fa01');
  item('<span class="kick">한번 떠나면 고칠 수 없다</span><br><span class="hd h2">부품 <span class="c-rocket num">250만 개</span> 중<br>고무 고리 <span class="c-bad">하나</span></span><br><span class="sub">1986년 챌린저호 · <b>7명</b> 희생</span><span class="src">NASA 컬럼비아 사고조사위원회 보고서(부품 수) · 로저스 위원회</span>', X, 240, S('fa02') + 0.2, S('fa03') - 0.05);
  item('<span class="kick">제임스 웹 우주망원경</span><br><span class="hd h1 num c-rocket">344곳</span><br><span class="sub">하나만 어긋나도 <b>임무 전체</b>를 잃는 지점</span><span class="src">NASA 브리핑 (2021)</span>', X, 250, S('fa03') + 0.2, S('fa04') - 0.05);
  pic('jwst', '', 900, 230, S('fa03') + 0.4, S('fa04') - 0.05, { w: 400, h: 520, rot: -1 });
  item('<span class="kick">칩 하나를 만들려면</span><br><span class="hd h2">공정 <span class="c-chip num">1,000번</span> 안팎<br>석 달</span><br><span class="sub">멀쩡한 칩의 비율 = <b>수율</b></span>', X, 250, S('fa04') + 0.2, S('fa05') - 0.05);
  item('<span class="kick">공정마다 99%만 성공한다면</span><br><span class="hd h2">10만 개 중<br><span class="c-bad num">4개</span></span><span class="src">0.99를 1,000번 곱하면 약 0.004%</span>', X, 250, S('fa05') + 0.2, S('fa06') - 0.05);
  lab('100%', 880, 270, S('fa05') + 0.5, S('fa06') - 0.05); lab('0.004%', 1640, 740, A('fa05', '거의', 0), S('fa06') - 0.05, 'c-bad');
  lab('공정 1,000번 →', 1260, 870, S('fa05') + 0.8, S('fa06') - 0.05);
  item('<span class="hd h2">거의 <span class="c-chip">완벽</span>하게,<br>날마다 <span class="c-chip">수없이</span></span>', X, 300, S('fa06') + 0.2, S('fa07') - 0.05);
  item('<span class="hd h3 c-rocket">단 한 번의 완벽</span>', 1150, 330, A('fa07', '단 한 번', -0.2), E('fa07') + 0.05, { anim: 'pop' });
  item('<span class="hd h3 c-chip">수없는 반복의 완벽</span>', 200, 330, A('fa07', '수없는', -0.2), E('fa07') + 0.05, { anim: 'pop' });
  verdict('<small>ROUND 3 · 실패의 무게</small><span class="c-gold">무승부</span>', 'c-gold', V3, E('fa07') + 0.05);

  // ================= round 4: 희소성 =================
  roundCard(4, '희소성', '해낼 수 있는 곳이 얼마나 적은가?', 'ra01');
  item('<span class="kick">우주에 간 나라들</span>', X, 230, S('ra02') + 0.1, S('ra04') - 0.05);
  const rows = [['스스로 위성 발사', '10여 개국', '위성을', 330], ['달 착륙', '5개국', '달에', 520], ['유인 우주비행', '3개국', '사람을', 710]];
  rows.forEach(([a, b, ph, y]) => item(`<span class="hd h4">${a}</span><br><span class="hd h3 num c-rocket">${b}</span>`, X, y, A('ra02', ph, -0.3), S('ra04') - 0.05, { anim: 'pop' }));
  pop('<span class="pill c-rocket">+ 민간 기업 (스페이스X 등)</span>', 1120, 880, A('ra03', '스페이스', -0.2), S('ra04') - 0.05);
  item('<span class="kick">가장 앞선 칩을 대량 생산</span><br><span class="hd h1 num c-chip">3곳</span>', X, 240, S('ra04') + 0.2, S('ra05') - 0.05);
  [['TSMC', '대만', '대만'], ['삼성전자', '한국', '한국'], ['인텔', '미국', '미국']].forEach(([n, c, ph], i) => item(`<span class="hd h4">${n}</span><br><span class="sub">${c}</span>`, 870 + i * 300, 700, A('ra04', ph, -0.2), S('ra05') - 0.05, { anim: 'pop', style: 'width:240px;text-align:center' }));
  item('<span class="kick">EUV 장비를 만드는 회사</span><br><span class="hd h1 num c-chip">1곳</span><br><span class="hd h2">ASML</span>', X, 240, S('ra05') + 0.2, S('ra06') - 0.05);
  item('<span class="kick">중국의 경우</span>', X, 230, S('ra06') + 0.1, E('ra08') + 0.05);
  item('<div class="check"><span class="m c-ok">✓</span>자체 우주정거장 운영</div>', X, 310, A('ra06', '우주정거장', -0.3), E('ra08') + 0.05, { anim: 'pop' });
  item('<div class="check"><span class="m c-ok">✓</span>달 뒷면 시료 회수 <span class="num" style="color:#9aa6ba">(2024 · 세계 최초)</span></div>', X, 410, A('ra06', '달 뒷면', -0.3), E('ra08') + 0.05, { anim: 'pop' });
  item('<div class="check"><span class="m c-gold">△</span>EUV 장비 — <span class="c-gold">아직 시제품 단계</span></div><span class="src" style="margin-left:70px">로이터(2025.12), TrendForce(2026.10) 등 · 양산까지 여러 해 전망</span>', X, 510, A('ra07', '시제품', -0.6), E('ra08') + 0.05, { anim: 'pop' });
  pic('tiangong', '중국 우주정거장 톈궁', 1180, 240, S('ra06') + 0.4, S('ra07') - 0.05, { w: 560, h: 420, rot: 1 });
  verdict('<small>ROUND 4 · 희소성</small><span class="c-chip">반도체 승</span>', 'c-chip', V4, E('ra08') + 0.05);

  // ================= twist =================
  item('<span class="hd h1 num"><span class="c-chip">2</span> : <span class="c-rocket">1</span></span><br><span class="hd h2">그런데, <span class="c-gold">반전</span></span>', 'c', 330, S('tw01') + 0.2, S('tw02') - 0.05);
  item('<span class="kick">우주선의 두뇌</span><br><span class="hd h2">결국 <span class="c-chip">반도체</span>.<br>그런데 최신 칩이<br>아니다</span>', X, 250, S('tw02') + 0.2, S('tw03') - 0.05);
  pic('percy', '화성의 퍼서비어런스 (셀카)', 1140, 230, S('tw02') + 0.4, S('tw05') - 0.05, { w: 600, h: 500, rot: 1 });
  item('<span class="kick">퍼서비어런스의 컴퓨터 · RAD750</span><br><span class="hd h2"><span class="c-rocket num">1998년</span> 아이맥과<br>같은 계열의 칩</span><span class="src">PowerPC 750의 내방사선 판 · 약 200 MHz</span>', X, 250, S('tw03') + 0.2, S('tw04') - 0.05);
  item('<span class="kick">우주에는 강한 방사선</span><br><span class="hd h2">빠른 칩보다<br><span class="c-rocket">고장 나지 않는 칩</span></span>', X, 260, S('tw04') + 0.2, S('tw05') - 0.05);
  item('<span class="hd h2">두 기술은<br><span class="c-gold">어려움의 종류</span>가 다르다</span>', 'c', 360, S('tw05') + 0.3, S('fn01') - 0.05);

  // ================= conclusion =================
  item('<span class="hd h1">그래서,<br>무엇이 더 어려울까?</span>', 'c', 330, S('fn01') + 0.1, S('fn02') - 0.05);
  item('<span class="kick">기준 ① 따라 하기 어려움</span><br><span class="hd h1 c-chip">반도체</span><br><span class="sub">수십 년 쌓인 기술 · 수많은 협력사<br><b>돈과 의지만으로는</b> 따라잡기 어렵다</span>', X, 250, S('fn02') + 0.2, S('fn03') - 0.05);
  item('<span class="kick">기준 ② 한 번의 실패가 치명적</span><br><span class="hd h1 c-rocket">우주선</span><br><span class="sub">연습은 땅에서,<br><b>본 무대는 단 한 번</b></span>', X, 250, S('fn03') + 0.2, S('fn04') - 0.05);
  item('<span class="kick">아직 아무도 해내지 못한 일</span><br><span class="hd h2">사람을 태우고<br><span class="c-rocket">화성 왕복</span></span>', X, 260, S('fn04') + 0.2, S('fn05') - 0.05);
  lab('지구', 870, 850, S('fn04') + 0.5, S('fn05') - 0.05); lab('화성', 1690, 270, S('fn04') + 0.9, S('fn05') - 0.05, 'c-rocket');
  item('<span class="sub">지금 더 적은 곳만 해낼 수 있는 것</span><br><span class="hd h1 c-chip">반도체</span>', 200, 300, A('fn05', '지금', -0.2), S('fn06') - 0.05, { anim: 'pop' });
  item('<span class="sub">아직 끝까지 가 본 사람이 없는 것</span><br><span class="hd h1 c-rocket">우주</span>', 1120, 300, A('fn05', '아직', -0.2), S('fn06') - 0.05, { anim: 'pop' });
  item('<span class="quote" style="font-size:84px;color:#9aa6ba">“그건 로켓 과학이 아니잖아.”</span>', 'c', 300, S('fn06') + 0.3, END - 5.6);
  item('<span class="quote">“<span class="c-chip">반도체</span>도 아니잖아.”</span>', 'c', 500, A('fn06', '반도체도', -0.2), END - 5.6, { anim: 'pop' });
  item(`<h4>실사 자료</h4><div class="grid">
    <div>우주왕복선 발사 — NASA / Scott Andrews · 퍼블릭 도메인<br>달 표면의 비크람 — ISRO · GODL-India<br>RS-25 엔진 시험 — NASA · Aerojet Rocketdyne · 퍼블릭 도메인<br>오리온 우주선 — NASA / James Blair · 퍼블릭 도메인<br>제임스 웹 우주망원경 — NASA / Chris Gunn · 퍼블릭 도메인</div>
    <div>퍼서비어런스 — NASA/JPL-Caltech/MSSS · 퍼블릭 도메인<br>톈궁 — 중국유인우주공정판공실 · CC BY 4.0<br>칩 내부 사진 — Fritzchens Fritz · CC0<br>실리콘 웨이퍼 — Peellden · CC BY-SA 3.0<br>사진 출처: 모두 Wikimedia Commons</div></div>
    <div style="margin-top:18px">‘더 어렵다’는 측정값이 아니라 기준에 따른 판단입니다. 수치의 출처는 영상 설명과 조사 노트에 있습니다. 효과음은 이 영상을 위해 코드로 합성했습니다.</div>`, 140, 250, END - 5.4, END + 2, { cls: 'credits' });

  // ---------------- sound: synthesized effects only (an explainer: the voice stays clear) ----------------
  const M = MEDIA.install(ctx), sfxBox = document.getElementById('sfx');
  const sfx = (key, t0, vol) => M.clip(sfxBox, key, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0), dur: M.SRC[key].dur, audio: true, vol });
  cardsT.forEach((t0) => sfx('swish', t0 - 0.05, 0.45));
  hitsT.forEach((t0) => sfx('hit', t0 - 0.02, 0.8));
  bellsT.forEach((t0) => sfx('bell', t0, 0.5));
  sfx('bell', S('op05') + 0.2, 0.4);

  await Promise.all(Array.from(ui.querySelectorAll('img')).map((im) => im.decode().catch(() => {})));

  // ---------------- diagrams ----------------
  const DOTS25 = []; { seed = 5; for (let j = 0; j < 26; j++) for (let i = 0; i < 58; i++) DOTS25.push([890 + i * 15.2 + rnd() * 3, 640 + j * 12 + rnd() * 3]); }
  const RAD = Array.from({ length: 26 }, (_, i) => { seed = 300 + i; return [rnd(), rnd(), 0.5 + rnd()]; });

  function drawFx(t) {
    let v;
    // op04: the two prices as bars
    if ((v = vis(t, S('op04') + 0.2, S('op05') - 0.05)) > 0) {
      const k1 = out(K(t, A('op04', '달 착륙', -1.6), A('op04', '달 착륙', -0.6))), k2 = out(K(t, A('op04', '한 대', -0.2), A('op04', '한 대', 1.2)));
      rect(900, 620, 300 * k1, 56, C.rocket, v); rect(900, 820, 800 * k2, 56, C.chip, v);
    }
    // pa04: a hair and the wave
    if ((v = vis(t, S('pa04') + 0.2, S('pa05') - 0.05)) > 0) {
      const hk = out(K(t, A('pa04', '머리카락', -0.4), A('pa04', '머리카락', 0.8)));
      g.globalAlpha = v * 0.9 * hk; const hg = g.createRadialGradient(1500, 640, 40, 1560, 660, 330); hg.addColorStop(0, '#c59a6a'); hg.addColorStop(1, '#6b4a2c'); g.fillStyle = hg; g.beginPath(); arc(g, 1560, 660, 300 * hk); g.fill();
      // the magnified wave in a lens
      const wk = out(K(t, S('pa04') + 0.5, S('pa04') + 1.6));
      ring(1060, 480, 150 * wk, C.chip, v, 4); disc(1060, 480, 146 * wk, '#07131f', v * 0.9);
      g.save(); g.beginPath(); arc(g, 1060, 480, 140 * wk); g.clip(); g.globalAlpha = v; g.strokeStyle = C.chip; g.lineWidth = 6; g.beginPath();
      for (let i = 0; i <= 80; i++) { const xx = 920 + i * 3.5, yy = 480 + Math.sin(i * 0.26 - t * 4) * 46; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); g.restore();
      line(1012, 400, 1108, 400, C.fg, v * wk, 3); line(1012, 390, 1012, 410, C.fg, v * wk, 3); line(1108, 390, 1108, 410, C.fg, v * wk, 3);
      // where the lens looks: a speck on the hair
      line(1168, 585, 1290, 640, C.chip, v * hk * 0.7, 2); disc(1296, 643, 5, C.chip, v * hk);
    }
    // pa05: tin droplets, laser, flash
    if ((v = vis(t, S('pa05') + 0.2, S('pa06') - 0.05)) > 0) {
      const lz = K(t, A('pa05', '레이저', -0.3), A('pa05', '레이저', 0.2));
      for (let i = 0; i < 7; i++) { const y = 280 + fract(i / 7 + t * 0.9) * 560; if (y > 600 && lz > 0) continue; disc(1280, y, 9, '#cfd6e2', v); }
      line(1270, 250, 1290, 250, C.muted, v, 6); line(1280, 250, 1280, 272, C.muted, v, 6);
      if (lz > 0) {
        const p = fract(t * 6.3), fl = Math.pow(1 - p, 2);
        line(900, 600, 1272, 600, C.bad, v * lz * (0.45 + 0.55 * fl), 5);
        glow(1280, 600, 70 + 110 * fl, 'rgba(190,150,255,0.95)', v * lz * (0.5 + 0.5 * fl)); disc(1280, 600, 8 + 12 * fl, '#ffffff', v * lz);
        for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.225; line(1280 + Math.cos(a) * 40, 600 + Math.sin(a) * 40, 1280 + Math.cos(a) * (90 + 190 * p), 600 + Math.sin(a) * (90 + 190 * p), C.chip, v * lz * (1 - p) * 0.9, 3); }
        g.globalAlpha = v * lz; g.strokeStyle = C.fg; g.lineWidth = 8; g.beginPath(); arc(g, 1280, 600, 330, -0.95, 0.95); g.stroke();
      }
    }
    // pa06: the mirror, then Germany-sized
    if ((v = vis(t, S('pa06') + 0.2, S('pa07') - 0.05)) > 0) {
      const mk = out(K(t, S('pa06') + 0.4, S('pa06') + 1.6));
      g.globalAlpha = v; g.strokeStyle = '#dfe6f2'; g.lineWidth = 12; g.beginPath(); arc(g, 1330, 80, 520, Math.PI * 0.5 - 0.62 * mk, Math.PI * 0.5 + 0.62 * mk); g.stroke();
      for (let i = -2; i <= 2; i++) { const x = 1330 + i * 120, yb = 80 + Math.sqrt(Math.max(0, 520 * 520 - (i * 120) * (i * 120))); line(x, 240, x, yb - 8, C.chip, v * mk * 0.8, 3); line(x, yb - 8, 1330, 330, C.chip, v * mk * 0.5, 2); }
      disc(1330, 330, 9, C.chip, v * mk);
      const gk = out(K(t, A('pa06', '독일 땅', -0.3), A('pa06', '독일 땅', 1.0)));
      line(900, 860, 900 + 860 * gk, 860, '#dfe6f2', v, 6);
      const bk = K(t, A('pa06', '머리카락', -0.3), A('pa06', '머리카락', 0.4));
      if (bk > 0) { g.globalAlpha = v * bk; g.fillStyle = C.chip; g.beginPath(); g.moveTo(1322, 857); g.lineTo(1330, 851); g.lineTo(1338, 857); g.closePath(); g.fill(); ring(1330, 854, 26 + 6 * Math.sin(t * 5), C.chip, v * bk, 3); line(1330, 828, 1330, 790, C.chip, v * bk, 2); }
    }
    // pa07: Earth → Mars, the landing ellipse
    if ((v = vis(t, S('pa07') + 0.2, S('pa08') - 0.05)) > 0) {
      const p0 = [960, 820], p1 = [1120, 220], p2 = [1700, 340], tk = io(K(t, S('pa07') + 0.8, A('pa07', '날아가서', 0.6)));
      const pt = (u) => [(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1]];
      g.globalAlpha = v; g.strokeStyle = C.rocket; g.lineWidth = 4; g.setLineDash([14, 12]); g.beginPath(); for (let i = 0; i <= 60; i++) { const [x, y] = pt(tk * i / 60); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
      disc(p0[0], p0[1], 30, '#4f9dff', v); disc(p2[0], p2[1], 22, '#e0623a', v * K(t, S('pa07') + 2.0, S('pa07') + 2.6));
      const [px, py] = pt(tk); disc(px, py, 9, '#ffffff', v);
      const ek = out(K(t, A('pa07', '폭이', -0.3), A('pa07', '폭이', 0.9)));
      if (ek > 0) { g.globalAlpha = v * ek; g.strokeStyle = C.rocket; g.lineWidth = 5; g.beginPath(); g.ellipse(1500, 720, Math.max(0, 170 * ek), Math.max(0, 146 * ek), 0, 0, TAU); g.stroke(); line(1690, 366, 1560, 590, C.rocket, v * ek * 0.6, 2);
        const lk = K(t, A('pa07', '내려앉', -0.4), A('pa07', '내려앉', 0.3)); disc(1528, 742, 10 * lk, '#ffffff', v); ring(1528, 742, 22 * lk, '#ffffff', v * lk * 0.7, 2); }
    }
    // pa08: a row of atoms
    if ((v = vis(t, S('pa08') + 0.2, E('pa08') + 0.05)) > 0) {
      for (let i = 0; i < 24; i++) { const ap = out(K(t, S('pa08') + 0.5 + i * 0.05, S('pa08') + 0.9 + i * 0.05)); disc(930 + i * 35, 480, 14 * ap, C.chip, v * 0.9); disc(926 + i * 35, 476, 5 * ap, '#d8fffa', v * 0.8); }
      const bk = K(t, S('pa08') + 1.8, S('pa08') + 2.4); line(916, 530, 916 + 833 * bk, 530, C.fg, v, 3); line(916, 520, 916, 540, C.fg, v * bk, 3); line(1749, 520, 1749, 540, C.fg, v * K(t, S('pa08') + 2.3, S('pa08') + 2.5), 3);
    }
    // ex02: orbit
    if ((v = vis(t, S('ex02') + 0.2, S('ex03') - 0.05)) > 0) {
      const eg = g.createRadialGradient(1330, 1560, 600, 1330, 1560, 860); eg.addColorStop(0, '#1b4f9a'); eg.addColorStop(1, '#0d2a5a'); g.globalAlpha = v; g.fillStyle = eg; g.beginPath(); arc(g, 1330, 1560, 860); g.fill();
      ring(1330, 1560, 866, '#7fc4ff', v * 0.7, 4);
      g.globalAlpha = v * 0.5; g.strokeStyle = C.rocket; g.lineWidth = 3; g.setLineDash([10, 12]); g.beginPath(); arc(g, 1330, 1560, 1010, -2.1, -1.04); g.stroke(); g.setLineDash([]);
      const a = -2.1 + fract(t * 0.42) * 1.06, sx = 1330 + Math.cos(a) * 1010, sy = 1560 + Math.sin(a) * 1010;
      for (let i = 1; i < 14; i++) { const aa = a - i * 0.012; if (aa < -2.1) break; disc(1330 + Math.cos(aa) * 1010, 1560 + Math.sin(aa) * 1010, 7 - i * 0.4, C.rocket, v * (1 - i / 14) * 0.7); }
      disc(sx, sy, 12, '#ffffff', v);
    }
    // ex03: a rocket that is mostly propellant
    if ((v = vis(t, S('ex03') + 0.2, S('ex04') - 0.05)) > 0) {
      const x0 = 1240, x1 = 1420, top = 290, bot = 880, fk = io(K(t, A('ex03', '열에 아홉', -1.2), A('ex03', '열에 아홉', 0.6)));
      const fy = bot - (bot - top) * 0.9 * fk;
      rect(x0, fy, x1 - x0, bot - fy, C.rocket, v * 0.85);
      g.globalAlpha = v; g.strokeStyle = C.fg; g.lineWidth = 6; g.beginPath(); g.moveTo(x0, bot); g.lineTo(x0, top); g.lineTo(1330, 190); g.lineTo(x1, top); g.lineTo(x1, bot); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(x0, 800); g.lineTo(x0 - 60, bot); g.lineTo(x0, bot); g.moveTo(x1, 800); g.lineTo(x1 + 60, bot); g.lineTo(x1, bot); g.stroke();
      const fl = 0.7 + 0.3 * Math.sin(t * 22); g.globalAlpha = v * 0.9; g.fillStyle = '#ffd08a'; g.beginPath(); g.moveTo(x0 + 30, bot + 6); g.lineTo(1330, bot + 60 + 50 * fl); g.lineTo(x1 - 30, bot + 6); g.closePath(); g.fill();
      line(x1 + 8, fy, x1 + 40, fy, C.rocket, v * fk, 3); line(x1 + 8, top + 20, x1 + 40, top + 20, C.fg, v * K(t, A('ex03', '열에 아홉', 0.5), A('ex03', '열에 아홉', 0.9)), 3);
    }
    // ex04: a thermometer from −253 to 3,300 ℃
    if ((v = vis(t, S('ex04') + 0.2, S('ex05') - 0.05)) > 0) {
      const k = out(K(t, S('ex04') + 0.6, S('ex04') + 1.8));
      const tg = g.createLinearGradient(0, 880, 0, 260); tg.addColorStop(0, '#7fc4ff'); tg.addColorStop(0.35, '#b9a0ff'); tg.addColorStop(0.7, '#ff8a3c'); tg.addColorStop(1, '#ff4a4a');
      g.globalAlpha = v; g.fillStyle = tg; g.fillRect(1440, 880 - 620 * k, 60, 620 * k); g.strokeStyle = C.fg; g.lineWidth = 3; g.strokeRect(1440, 260, 60, 620);
      disc(1470, 880, 16, '#7fc4ff', v * K(t, A('ex04', '영하', -0.3), A('ex04', '영하', 0.1))); disc(1470, 260, 16 + 4 * Math.sin(t * 9), '#ff4a4a', v * K(t, A('ex04', '연소실', -0.3), A('ex04', '연소실', 0.1)));
    }
    // ex05: re-entry
    if ((v = vis(t, S('ex05') + 0.2, S('ex06') - 0.05)) > 0) {
      const k = K(t, A('ex05', '시속', -0.4), A('ex05', '시속', 0.6)); if (k > 0) {
        const cx = 1060, cy = 640, sh = Math.sin(t * 30) * 2;
        for (let i = 0; i < 16; i++) { const u = i / 16, w = 60 * (1 - u) + 6; glow(cx - 20 - u * 190 + sh, cy - 20 - u * 250, w * (1.2 + 0.3 * Math.sin(t * 14 + i)), i < 5 ? 'rgba(255,240,200,0.9)' : 'rgba(255,120,50,0.8)', v * k * (1 - u) * 0.8); }
        g.save(); g.translate(cx + sh, cy); g.rotate(0.65); g.globalAlpha = v * k; g.fillStyle = '#d9dee8'; g.beginPath(); g.moveTo(-46, 28); g.lineTo(-22, -34); g.lineTo(22, -34); g.lineTo(46, 28); g.closePath(); g.fill();
        g.fillStyle = '#ffb060'; g.beginPath(); g.ellipse(0, 30, 50, 12, 0, 0, TAU); g.fill(); g.restore();
        glow(cx + 14, cy + 30, 90, 'rgba(255,170,80,0.9)', v * k * 0.8);
      }
    }
    // fa02: 2.5 million parts, one O-ring
    if ((v = vis(t, S('fa02') + 0.2, S('fa03') - 0.05)) > 0) {
      const k = K(t, A('fa02', '250만', -0.8), A('fa02', '250만', 0.6)), n = Math.floor(DOTS25.length * k);
      g.globalAlpha = v * 0.7; g.fillStyle = C.rocket; for (let i = 0; i < n; i++) g.fillRect(DOTS25[i][0], DOTS25[i][1], 4, 4);
      const ok = K(t, A('fa02', '고무 고리', -0.3), A('fa02', '고무 고리', 0.2)); if (ok > 0) { const [x, y] = DOTS25[777]; disc(x + 2, y + 2, 9, C.bad, v * ok); ring(x + 2, y + 2, 20 + 26 * fract(t * 0.9), C.bad, v * ok * (1 - fract(t * 0.9)), 4); }
    }
    // fa03: 344 single points of failure, all must pass
    if ((v = vis(t, S('fa03') + 0.2, S('fa04') - 0.05)) > 0) {
      const done = Math.floor(344 * K(t, A('fa03', '그 전부가', -0.2), E('fa03') - 0.6)), shown = Math.floor(344 * K(t, A('fa03', '344', -0.9), A('fa03', '344', 0.4)));
      for (let i = 0; i < shown; i++) { const x = 1350 + (i % 20) * 22, y = 300 + Math.floor(i / 20) * 30; disc(x, y, 7, i < done ? C.ok : C.rocket, v * (i < done ? 1 : 0.75)); }
    }
    // fa04: a thousand steps
    if ((v = vis(t, S('fa04') + 0.2, S('fa05') - 0.05)) > 0) {
      const k = K(t, A('fa04', '천 번', -0.5), E('fa04') - 0.8);
      g.globalAlpha = v; g.strokeStyle = C.muted; g.lineWidth = 3; g.strokeRect(900, 500, 860, 70); rect(900, 500, 860 * k, 70, C.chip, v * 0.85);
      for (let i = 1; i < 10; i++) line(900 + i * 86, 500, 900 + i * 86, 570, '#07131f', v * 0.9, 3);
      const wk = out(K(t, S('fa04') + 0.5, S('fa04') + 1.3)); ring(1330, 760, 110 * wk, C.chip, v, 5);
      g.save(); g.beginPath(); arc(g, 1330, 760, 104 * wk); g.clip(); for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) rect(1330 + i * 22 - 9, 760 + j * 22 - 9, 18, 18, C.chip, v * (0.25 + 0.55 * K(k * 121, (j + 5) * 11 + i + 5, (j + 5) * 11 + i + 6))); g.restore();
    }
    // fa05: 0.99^n
    if ((v = vis(t, S('fa05') + 0.2, S('fa06') - 0.05)) > 0) {
      const ax = 960, ay = 820, w = 760, h = 500, k = io(K(t, S('fa05') + 0.8, A('fa05', '거의', 0.4)));
      line(ax, ay, ax + w, ay, C.muted, v, 3); line(ax, ay, ax, ay - h, C.muted, v, 3);
      g.globalAlpha = v; g.strokeStyle = C.bad; g.lineWidth = 7; g.beginPath(); const N = Math.floor(200 * k);
      for (let i = 0; i <= N; i++) { const n = i * 5, x = ax + w * n / 1000, y = ay - h * Math.pow(0.99, n); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      const n = N * 5; disc(ax + w * n / 1000, ay - h * Math.pow(0.99, n), 11, '#ffffff', v);
    }
    // fa06: a wafer of good dies, again and again
    if ((v = vis(t, S('fa06') + 0.2, S('fa07') - 0.05)) > 0) {
      const R = 290, cx = 1330, cy = 590; ring(cx, cy, R, C.chip, v, 6);
      g.save(); g.beginPath(); arc(g, cx, cy, R - 6); g.clip(); const sweep = fract(t * 0.5) * 2 - 0.5;
      for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) { const u = (i + j + 18) / 36, sh = Math.exp(-Math.pow((u - sweep) * 7, 2)); rect(cx + i * 32 - 14, cy + j * 32 - 14, 28, 28, sh > 0.5 ? '#d8fffa' : C.chip, v * (0.45 + 0.5 * sh)); }
      g.restore();
    }
    // fa07: the two kinds of perfect
    if ((v = vis(t, S('fa07') + 0.2, V3)) > 0) {
      const a1 = K(t, A('fa07', '단 한 번', -0.2), A('fa07', '단 한 번', 0.4)), a2 = K(t, A('fa07', '수없는', -0.2), A('fa07', '수없는', 0.4));
      disc(1420, 560, 54 * out(a1), C.rocket, v); ring(1420, 560, 80, C.rocket, v * a1 * 0.6, 4);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) disc(240 + i * 46, 480 + j * 46, 12 * out(K(a2 * 60, j * 12 + i, j * 12 + i + 6)), C.chip, v * 0.9);
    }
    // ra02: who has reached space
    if ((v = vis(t, S('ra02') + 0.1, S('ra04') - 0.05)) > 0) {
      [[11, '위성을', 395], [5, '달에', 585], [3, '사람을', 775]].forEach(([n, ph, y]) => { for (let i = 0; i < n; i++) { const ap = out(K(t, A('ra02', ph, -0.3) + i * 0.06, A('ra02', ph, 0.1) + i * 0.06)); disc(900 + i * 74, y, 26 * ap, C.rocket, v * (i === 10 ? 0.45 : 1)); } });
    }
    // ra04–05: three makers, one machine maker
    if ((v = vis(t, S('ra04') + 0.2, S('ra05') - 0.05)) > 0) {
      ['대만', '한국', '미국'].forEach((ph, i) => { const ap = out(K(t, A('ra04', ph, -0.2), A('ra04', ph, 0.3))); const x = 990 + i * 300, s = 150 * ap; rect(x - s / 2, 560 - s / 2, s, s, C.chip, v); rect(x - s * 0.3, 560 - s * 0.3, s * 0.6, s * 0.6, '#07131f', v * 0.8); for (let p = -2; p <= 2; p++) { line(x + p * 26 * ap, 560 - s / 2 - 16 * ap, x + p * 26 * ap, 560 - s / 2, C.chip, v, 5); line(x + p * 26 * ap, 560 + s / 2, x + p * 26 * ap, 560 + s / 2 + 16 * ap, C.chip, v, 5); } });
    }
    if ((v = vis(t, S('ra05') + 0.2, S('ra06') - 0.05)) > 0) {
      const ap = out(K(t, A('ra05', '단 한 곳', -0.5), A('ra05', '단 한 곳', 0.1)));
      for (let i = 0; i < 12; i++) ring(1330, 590, 90, C.muted, v * 0.25 * (1 - ap), 2);
      glow(1330, 590, 330, 'rgba(53,224,208,0.5)', v * ap * (0.7 + 0.3 * Math.sin(t * 3))); disc(1330, 590, 90 * ap, C.chip, v); ring(1330, 590, 130 + 12 * Math.sin(t * 3), C.chip, v * ap * 0.7, 4);
    }
    // tw03–04: the old chip and the radiation
    if ((v = vis(t, S('tw03') + 0.2, S('tw05') - 0.05)) > 0) {
      const ap = out(K(t, S('tw03') + 0.3, S('tw03') + 1.0)), x = 950, y = 800, s = 130 * ap;
      rect(x - s / 2, y - s / 2, s, s, '#c9a24a', v); rect(x - s * 0.32, y - s * 0.32, s * 0.64, s * 0.64, '#2a2210', v);
      for (let p = -2; p <= 2; p++) { line(x + p * 22 * ap, y - s / 2 - 14 * ap, x + p * 22 * ap, y - s / 2, '#c9a24a', v, 5); line(x + p * 22 * ap, y + s / 2, x + p * 22 * ap, y + s / 2 + 14 * ap, '#c9a24a', v, 5); line(x - s / 2 - 14 * ap, y + p * 22 * ap, x - s / 2, y + p * 22 * ap, '#c9a24a', v, 5); line(x + s / 2, y + p * 22 * ap, x + s / 2 + 14 * ap, y + p * 22 * ap, '#c9a24a', v, 5); }
      const rk = K(t, S('tw04') + 0.2, S('tw04') + 0.8);
      if (rk > 0) { for (const [a, b, sp] of RAD) { const u = fract(a + t * 0.5 * sp), x0 = 760 + u * 420, y0 = 600 + b * 60 + u * 330; line(x0, y0, x0 + 34, y0 + 27, '#b9a0ff', v * rk * Math.sin(u * Math.PI) * 0.9, 3); } ring(x, y, 120 + 6 * Math.sin(t * 6), '#b9a0ff', v * rk * 0.6, 3); }
    }
    // fn02: a web of suppliers that has to mesh
    if ((v = vis(t, S('fn02') + 0.2, S('fn03') - 0.05)) > 0) {
      const gx = (i) => 960 + i * 150, gy = (j) => 340 + j * 130;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
        const ap = out(K(t, S('fn02') + 0.5 + (i + j) * 0.12, S('fn02') + 1.0 + (i + j) * 0.12)), x = gx(i) + (j % 2) * 40, y = gy(j);
        if (i < 5) line(x, y, gx(i + 1) + (j % 2) * 40, y, C.chip, v * ap * 0.35, 2);
        if (j < 3) line(x, y, gx(i) + ((j + 1) % 2) * 40, gy(j + 1), C.chip, v * ap * 0.35, 2);
        const pulse = Math.exp(-Math.pow((fract(t * 0.35) * 12 - (i + j)) * 0.9, 2));
        disc(x, y, (13 + 7 * pulse) * ap, pulse > 0.4 ? '#d8fffa' : C.chip, v * (0.6 + 0.4 * pulse));
      }
    }
    // fn03: one launch, one chance
    if ((v = vis(t, S('fn03') + 0.2, S('fn04') - 0.05)) > 0) {
      const k = io(K(t, A('fn03', '본 무대', -0.6), E('fn03') + 0.4)), cx = 1380, y = 820 - 470 * k * k;
      line(1180, 880, 1580, 880, C.muted, v, 4);
      for (let i = 0; i < 12; i++) { const u = i / 12; glow(cx + Math.sin(i * 2.4 + t * 9) * 10 * u, y + 110 + u * (120 + 300 * k), 34 + 30 * u, i < 4 ? 'rgba(255,230,170,0.9)' : 'rgba(255,138,60,0.7)', v * (k > 0 ? 1 : 0.0) * (1 - u) * 0.8); }
      g.globalAlpha = v; g.fillStyle = '#e8edf5'; g.beginPath(); g.moveTo(cx - 34, y + 100); g.lineTo(cx - 34, y - 60); g.lineTo(cx, y - 130); g.lineTo(cx + 34, y - 60); g.lineTo(cx + 34, y + 100); g.closePath(); g.fill();
      g.fillStyle = C.rocket; g.beginPath(); g.moveTo(cx - 34, y + 40); g.lineTo(cx - 64, y + 104); g.lineTo(cx - 34, y + 100); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx + 34, y + 40); g.lineTo(cx + 64, y + 104); g.lineTo(cx + 34, y + 100); g.closePath(); g.fill();
    }
    // fn04: there and back again — nobody yet
    if ((v = vis(t, S('fn04') + 0.2, S('fn05') - 0.05)) > 0) {
      const k1 = io(K(t, S('fn04') + 0.6, S('fn04') + 3.0)), k2 = io(K(t, S('fn04') + 3.0, E('fn04') - 0.2));
      const q = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
      const e = [980, 800], m = [1700, 360];
      g.globalAlpha = v; g.strokeStyle = C.rocket; g.lineWidth = 4; g.setLineDash([14, 12]);
      g.beginPath(); for (let i = 0; i <= 50; i++) { const [x, y] = q(e, [1150, 300], m, k1 * i / 50); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      if (k2 > 0) { g.strokeStyle = '#ffd34d'; g.beginPath(); for (let i = 0; i <= 50; i++) { const [x, y] = q(m, [1560, 900], e, k2 * i / 50); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.setLineDash([]);
      disc(e[0], e[1], 30, '#4f9dff', v); disc(m[0], m[1], 24, '#e0623a', v * K(t, S('fn04') + 0.9, S('fn04') + 1.4));
    }
  }

  onFrame((t) => {
    drawBg(t);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fc.width, fc.height); g.restore();
    g.globalAlpha = 0.02; g.fillStyle = '#0a0e18'; g.fillRect(0, 0, 2, 2);   // never a fully empty layer (stale-composite guard)
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineWidth = 1; g.lineCap = 'butt'; g.setLineDash([]);
    drawFx(t);
    g.globalAlpha = 1;

    // scoreboard state
    const sc = (t >= V1 ? 1 : 0) + (t >= V4 ? 1 : 0), sr = t >= V2 ? 1 : 0, key = sc + '|' + sr + '|' + (t >= V3 ? 1 : 0);
    if (key !== boardKey) { boardKey = key; scChip.textContent = String(sc); scRocket.textContent = String(sr);
      pips[0].className = 'pip' + (t >= V1 ? ' chip' : ''); pips[1].className = 'pip' + (t >= V2 ? ' rocket' : ''); pips[2].className = 'pip' + (t >= V3 ? ' draw' : ''); pips[3].className = 'pip' + (t >= V4 ? ' chip' : ''); }

    for (const it of items) {
      const a = vis(t, it.t0, it.t1, it.fi, it.fo);
      if (a <= 0) { if (it.last !== 'h') { it.el.style.opacity = '0'; it.el.style.visibility = 'hidden'; it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.6);
      let tr;
      if (it.anim === 'stamp') tr = `rotate(${it.rot}deg) scale(${lerp(2.2, 1, out(K(t, it.t0, it.t0 + 0.22))).toFixed(3)})`;
      else if (it.anim === 'pop') tr = `scale(${(0.82 + 0.18 * back(k)).toFixed(3)})`;
      else if (it.anim === 'card') tr = `translateY(${((1 - out(k)) * 30).toFixed(1)}px) rotate(${it.rot}deg)`;
      else tr = `translateY(${((1 - out(k)) * 20).toFixed(1)}px)`;
      const op = it.anim === 'stamp' ? Math.min(1, K(t, it.t0, it.t0 + 0.08)) * (1 - K(t, it.t1 - it.fo, it.t1)) : a;
      const key2 = op.toFixed(3) + tr;
      if (key2 === it.last) continue;
      it.el.style.visibility = 'inherit'; it.el.style.opacity = op.toFixed(3); it.el.style.transform = tr; it.last = key2;
    }
  });
});
