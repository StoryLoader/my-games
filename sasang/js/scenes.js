/*
 * scenes.js — 「내 체질에 맞지 않는 음식」 (storyboard.md). One sheet of hanji the whole way through: ink, the four
 * constitution colours, real photos (Wikimedia Commons, credited on each card) and seal stamps — 맞음 (round, pine) and
 * 피함 (square, vermilion). Drawn things live on two canvases: the paper (baked once) and fx (per frame: steam, the
 * four-image wheel, organ circles, people, the 10,000 dots, the scale, the experts' triangle, the papers).
 * Every frame is a pure function of t.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, fitCanvas, data } = ctx;
  scene('#world', 0, data.duration + 1);
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const END = data.duration;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const K = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);
  const io = (x) => x * x * (3 - 2 * x);
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const vis = (t, a, b, fi = 0.6, fo = 0.5) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));
  let seed = 7; const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };

  const COL = { ty: '#cf4a2c', sy: '#d98a1e', te: '#2d7a58', se: '#33568f', ink: '#2b2620', no: '#c23a2a', ok: '#2d7a58' };

  // ---------------- the paper (baked once) ----------------
  const pc = document.querySelector('#world canvas.paper'), pgc = fitCanvas(pc, 1920, 1080, 2);
  const paperOff = document.createElement('canvas'); paperOff.width = 3840; paperOff.height = 2160;
  const pg = paperOff.getContext('2d'); pg.scale(2, 2);
  let paperDrawn = false;
  {
    pg.fillStyle = '#f5eedf'; pg.fillRect(0, 0, 1920, 1080);
    const vg = pg.createRadialGradient(960, 520, 300, 960, 540, 1150);
    vg.addColorStop(0, 'rgba(255,252,240,0.55)'); vg.addColorStop(1, 'rgba(176,150,110,0.22)');
    pg.fillStyle = vg; pg.fillRect(0, 0, 1920, 1080);
    // hanji fibres: short curved strokes, light and dark
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * 1920, y = rnd() * 1080, l = 8 + rnd() * 34, a = rnd() * Math.PI;
      pg.strokeStyle = rnd() < 0.55 ? `rgba(150,125,90,${0.05 + rnd() * 0.07})` : `rgba(255,255,250,${0.25 + rnd() * 0.3})`;
      pg.lineWidth = 0.6 + rnd() * 1.1; pg.beginPath(); pg.moveTo(x, y);
      pg.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (rnd() - 0.5) * 8, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 8, x + Math.cos(a) * l, y + Math.sin(a) * l); pg.stroke();
    }
    for (let i = 0; i < 900; i++) { pg.fillStyle = `rgba(120,95,60,${0.04 + rnd() * 0.06})`; pg.beginPath(); pg.arc(rnd() * 1920, rnd() * 1080, 0.6 + rnd() * 1.6, 0, 7); pg.fill(); }
    // a faint ink border, like a mounted sheet
    pg.strokeStyle = 'rgba(80,60,40,0.18)'; pg.lineWidth = 2; pg.strokeRect(36, 36, 1848, 1008);
  }
  const fc = document.querySelector('#world canvas.fx'), g = fitCanvas(fc, 1920, 1080, 1.5);

  // ---------------- DOM items ----------------
  const ui = document.getElementById('ui'), items = [];
  function item(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 'it ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (o.style) el.setAttribute('style', el.getAttribute('style') + ';' + o.style);
    ui.appendChild(el); const it = { el, t0, t1, anim: o.anim || 'rise', rot: o.rot || 0, fi: o.fi || 0.6, fo: o.fo || 0.5, last: '' };
    items.push(it); return it;
  }
  const card = (src, lab, cap, x, y, t0, t1, o = {}) => item(`<div class="frame"><img src="${src}" alt=""></div>${lab ? `<span class="lab">${lab}</span>` : ''}<span class="cap">${cap}</span>`, x, y, t0, t1,
    { cls: 'card ' + (o.cls || ''), anim: o.anim || 'card', rot: o.rot != null ? o.rot : 0, style: `--w:${o.w || 380}px;--h:${o.h || 280}px` });
  const seal = (kind, text, x, y, t0, t1, o = {}) => { const it = item(`<span class="seal ${kind} ${o.sm ? 'sm' : ''}${o.big ? ' big' : ''}">${text}</span>`, x, y, t0, t1, { anim: 'stamp', rot: o.rot != null ? o.rot : (kind === 'no' ? -8 : 6) }); stamps.push(t0); return it; };
  const chip = (kind, text, x, y, t0, t1) => item(`<span class="chip ${kind}">${text}</span>`, x, y, t0, t1, { anim: 'pop' });
  const drawers = [];
  const drawer = (no, q, t0, t1) => { drawers.push(t0); return item(`<span class="knob"></span><span class="no">${no}</span><span class="q">${q}</span>`, 96, 64, t0, t1, { cls: 'drawer', anim: 'slide' }); };
  const stamps = [];
  const X = 120;
  const CR = (who, lic) => `사진 ${who} · ${lic} · Wikimedia Commons`;
  const IMG = {
    gyetang: ['assets/user/samgyetang.jpg', CR('wizdata', 'CC0')],
    book: ['assets/user/donguisusebowon-book.jpg', CR('이강철', 'CC BY-SA 4.0')],
    lee: ['assets/user/leejema-portrait.jpg', '이제마 초상 · 1920년경 기억에 의존해 그린 그림 · 퍼블릭 도메인 · Wikimedia Commons'],
    chili: ['assets/user/chillies.jpg', CR('yoopilsun', 'CC0')],
    pork: ['assets/user/pork-belly.jpg', CR('idkjm123', 'CC0')],
    noodle: ['assets/user/naengmyeon.jpg', CR('ProjectManhattan', 'CC0')],
    melon: ['assets/user/watermelon.jpg', CR('Nesnad', 'CC BY 4.0')],
    ginseng: ['assets/user/ginseng.jpg', CR('국립국어원', 'CC BY-SA 2.0 KR')],
    honey: ['assets/user/honey.jpg', CR('Shixart1985', 'CC BY 2.0')],
    hanu: ['assets/user/hanu.jpg', CR('Charlie Yoon', 'CC0')],
  };
  const cardsT = [];
  const pic = (k, lab, x, y, t0, t1, o) => (cardsT.push(t0), card(IMG[k][0], lab, IMG[k][1], x, y, t0, t1, o));

  // ================= op — 같은 음식, 다른 몸 =================
  pic('gyetang', '', 980, 170, S('op01') - 0.4, S('op03') + 0.2, { w: 760, h: 560, rot: 1.5 });
  item('<span class="kick">여름 보양식</span><br><span class="brush h1">삼계탕</span>', X, 300, S('op01') + 0.2, S('op02') + 0.4);
  item('<span class="hand">한의원에서 이런 말을…</span>', X, 250, S('op02') + 0.2, S('op03') - 0.2);
  item('<span class="quote">“당신 체질에는<br>삼계탕이 <span class="c-no">맞지 않아요</span>.”</span>', X - 10, 360, A('op02', '당신', -0.2), S('op03') - 0.2, { cls: 'bubble' });
  item('<span class="brush h2">몸에 좋다는 음식이,<br>누군가에게는<br><span class="c-no">맞지 않는다?</span></span>', X, 220, S('op03') + 0.2, S('op04') - 0.1);
  pic('book', '', 1060, 230, S('op04') + 0.1, S('op05') + 0.2, { w: 640, h: 470, rot: -1.5 });
  item('<span class="hand">130여 년 전, 한 한의사가 쓴 책</span>', X, 300, S('op04') + 0.3, S('op05') + 0.1);
  item('<span class="kick">사상체질로 본</span><br><span class="brush h1">내 체질에<br>맞지 않는 음식</span><br><span class="sub">그리고 그 말을 <b>얼마나 믿어도 될까</b></span>', 'c', 250, S('op05') + 0.3, S('lj01') - 0.15);

  // ================= lj — 이제마와 네 가지 체질 =================
  drawer('壹', '이제마와 네 가지 체질', S('lj01') - 0.2, S('fd01') - 0.3);
  pic('lee', '', 1200, 160, S('lj01') + 0.1, S('lj03') + 0.3, { w: 470, h: 600, cls: 'tall', rot: -1 });
  item('<span class="kick">조선 말기 한의사</span><br><span class="brush h1">동무 이제마</span><br><span class="hanja h4" style="color:#6f655a">東武 李濟馬 · 1837–1900</span>', X, 260, S('lj01') + 0.3, S('lj02') - 0.05);
  item('<span class="brush h2">같은 약을 먹어도<br><span class="c-ty">사람마다 반응이 다르다</span></span>', X, 300, S('lj02') + 0.1, S('lj03') - 0.05);
  pic('book', '', 1080, 230, S('lj03') + 0.2, S('lj04') - 0.1, { w: 640, h: 470, rot: 1.2 });
  item('<span class="kick">1894년</span><br><span class="brush h1">동의수세보원</span><br><span class="hanja h3" style="color:#6f655a">東醫壽世保元</span><br><span class="sub">사람을 <b>네 가지 체질</b>로 나눈 이론</span>', X, 250, S('lj03') + 0.3, S('lj04') - 0.1);
  // the four-image wheel (fx) + its labels
  const WC = { x: 1260, y: 560, r: 330 };
  const lj4 = S('lj04'), lj5 = S('lj05');
  const wl = (h, k, cls, dx, dy, t0) => item(`<span class="hanja h2 ${cls}">${h}</span><br><span class="brush h4">${k}</span>`, WC.x + dx - 130, WC.y + dy - 95, t0, lj5 - 0.1, { anim: 'pop', style: 'width:260px;text-align:center' });
  wl('太陽', '태양인', 'c-ty', -165, -150, A('lj04', '태양인', -0.1));
  wl('少陽', '소양인', 'c-sy', 165, -150, A('lj04', '소양인', -0.1));
  wl('太陰', '태음인', 'c-te', -165, 160, A('lj04', '태음인', -0.1));
  wl('少陰', '소음인', 'c-se', 165, 160, A('lj04', '소음인', -0.1));
  item('<span class="hanja h1">四象</span><br><span class="brush h3">사상체질</span><br><span class="sub">‘네 가지 모습’이라는 뜻</span>', X, 300, A('lj04', '네 가지', -0.3), lj5 - 0.1);
  // organs
  item('<span class="brush h2">기준은<br><span class="c-ty">타고난 장기의</span><br><span class="c-ty">크고 작음</span></span>', X, 260, lj5 + 0.1, S('lj06') - 0.05);
  const OX = [880, 1140, 1400, 1660];
  const ORG = [['肺', '폐'], ['脾', '비위'], ['肝', '간'], ['腎', '신장']];
  const lj6 = S('lj06');
  ORG.forEach(([h, k], i) => item(`<span class="hanja h3">${h}</span> <span class="brush h4">${k}</span>`, OX[i] - 110, 200, lj5 + 1.2 + i * 0.35, S('lj09') - 0.2, { anim: 'pop', style: 'width:220px;text-align:center' }));
  item('<span class="sub"><b>비위</b> = 소화를 맡는<br>위와 비장</span>', X, 300, A('lj06', '비위는', -0.2), S('lj07') - 0.05);
  // pair rows (lj07: 소양/소음, lj08: 태양/태음)
  const lj7 = S('lj07'), lj8 = S('lj08');
  item('<span class="brush h3 c-sy">소양인</span><br><span class="sub">비위 <b class="hanja">大</b> · 신장 <b class="hanja">小</b></span>', X, 330, lj7 + 0.2, lj8 - 0.05);
  item('<span class="brush h3 c-se">소음인</span><br><span class="sub">비위 <b class="hanja">小</b> · 신장 <b class="hanja">大</b></span>', X, 680, A('lj07', '소음인', -0.1), lj8 - 0.05);
  item('<span class="brush h3 c-ty">태양인</span><br><span class="sub">폐 <b class="hanja">大</b> · 간 <b class="hanja">小</b></span>', X, 330, lj8 + 0.2, S('lj09') - 0.2);
  item('<span class="brush h3 c-te">태음인</span><br><span class="sub">폐 <b class="hanja">小</b> · 간 <b class="hanja">大</b></span>', X, 680, A('lj08', '태음인', -0.1), S('lj09') - 0.2);
  item('<span class="hand" style="color:#cf4a2c">두 쌍의 거울</span>', 1380, 525, A('lj08', '거울', -0.4), S('lj09') - 0.2, { anim: 'pop' });
  // proportions
  const lj9 = S('lj09'), lj10 = S('lj10');
  item('<span class="kick">이제마의 기록 · 사상인변증론</span><br><span class="brush h2">열 명 중</span>', X, 200, lj9 + 0.1, lj10 - 0.05);
  item('<span class="brush h3 c-te">태음인 5</span>', 560, 760, A('lj09', '다섯', -0.2), lj10 - 0.05, { anim: 'pop' });
  item('<span class="brush h3 c-sy">소양인 3</span>', 1200, 760, A('lj09', '셋', -0.2), lj10 - 0.05, { anim: 'pop' });
  item('<span class="brush h3 c-se">소음인 2</span>', 1540, 760, A('lj09', '둘', -0.2), lj10 - 0.05, { anim: 'pop' });
  item('<span class="kick">만 명 가운데</span><br><span class="brush h2"><span class="c-ty">태양인</span>은 열 명 남짓</span>', X, 180, lj10 + 0.1, S('fd01') - 0.2);
  item('<span class="src">출처: 이제마, 『동의수세보원』 사상인변증론 (원문은 “한 고을 만 명 중 태양인은 3~4명에서 10여 명”)</span>', X, 900, lj10 + 0.6, S('fd01') - 0.2);

  // ================= fd — 체질별로 맞지 않는 음식 =================
  drawer('貳', '체질별로 맞지 않는 음식', S('fd01') - 0.2, S('ck01') - 0.3);
  item('<span class="brush h2">체질별로<br><span class="c-no">‘맞지 않는다’</span>고<br>하는 음식</span><br><span class="hand">전통 이론의 설명이에요</span>', X, 230, S('fd01') + 0.2, S('fd02') - 0.05);
  const fd2 = S('fd02');
  item('<span class="kick">이 이론의 원리</span><br><span class="brush h2">균형</span>', X, 250, fd2 + 0.1, S('fd03') - 0.15);
  item('<span class="brush h4">넘치는 쪽은</span><br><span class="head no">더 부추기지 않고</span>', 720, 640, A('fd02', '넘치는', -0.2), S('fd03') - 0.15, { anim: 'pop', style: 'text-align:center;width:420px' });
  item('<span class="brush h4">모자란 쪽은</span><br><span class="head ok">채워 준다</span>', 1380, 640, A('fd02', '모자란', -0.2), S('fd03') - 0.15, { anim: 'pop', style: 'text-align:center;width:420px' });

  // a constitution column on the left
  const colm = (h, k, d, cls, t0, t1) => item(`<span class="v ${cls}">${h}</span><span class="k">${k}</span><span class="d">${d}</span>`, 90, 170, t0, t1, { cls: 'col', anim: 'slide' });
  const RX = 520; // right area starts here
  // ---- 소양인
  const sy0 = S('fd03'), sy1 = S('fd07');
  colm('少陽人', '소양인', '몸에 열이 많은<br>체질로 봄', 'c-sy', sy0 - 0.1, sy1 - 0.15);
  item('<span class="head no">맞지 않다고 하는 음식</span>', RX + 40, 150, S('fd04') - 0.1, S('fd06') - 0.1);
  pic('chili', '고추', RX + 40, 210, A('fd04', '고추', -0.3), S('fd06') - 0.1, { w: 360, h: 250, rot: -1.5 });
  chip('no', '후추', RX + 470, 250, A('fd04', '후추', -0.2), S('fd05') - 0.05);
  chip('no', '생강', RX + 640, 250, A('fd04', '생강', -0.2), S('fd05') - 0.05);
  chip('no', '마늘', RX + 810, 250, A('fd04', '마늘', -0.2), S('fd05') - 0.05);
  item('<span class="sub">맵고 뜨거운 양념</span>', RX + 475, 360, A('fd04', '양념', -0.3), S('fd05') - 0.05);
  seal('no', '피함', RX + 330, 190, A('fd04', '맞지', 0), S('fd06') - 0.1);
  chip('no', '닭고기', RX + 470, 260, A('fd05', '닭고기', -0.2), S('fd06') - 0.1);
  pic('ginseng', '인삼', RX + 720, 200, A('fd05', '인삼', -0.3), S('fd06') - 0.1, { w: 300, h: 250, rot: 1.2 });
  pic('honey', '꿀', RX + 1070, 200, A('fd05', '꿀', -0.3), S('fd06') - 0.1, { w: 260, h: 250, rot: -1, cls: 'tall' });
  item('<span class="head ok">대신, 맞는다고 보는 음식</span>', RX + 40, 610, S('fd06') - 0.1, sy1 - 0.15);
  pic('pork', '돼지고기', RX + 40, 670, A('fd06', '돼지고기', -0.3), sy1 - 0.15, { w: 340, h: 200, rot: 1 });
  chip('ok', '보리', RX + 440, 720, A('fd06', '보리', -0.2), sy1 - 0.15);
  chip('ok', '오이', RX + 610, 720, A('fd06', '오이', -0.2), sy1 - 0.15);
  pic('melon', '수박', RX + 800, 670, A('fd06', '수박', -0.3), sy1 - 0.15, { w: 340, h: 200, rot: -1.2 });
  seal('ok', '맞음', RX + 1170, 690, A('fd06', '서늘한', -0.1), sy1 - 0.15);
  // ---- 소음인
  const se0 = S('fd07'), se1 = S('fd12');
  colm('少陰人', '소음인', '몸이 차고 소화 기능이<br>약한 체질로 봄', 'c-se', se0 - 0.1, se1 - 0.15);
  item('<span class="hand c-sy">소양인과 거울처럼 반대</span>', RX + 40, 200, se0 + 0.3, S('fd08') - 0.05);
  item('<span class="head no">맞지 않다고 하는 음식</span>', RX + 40, 150, S('fd08') - 0.1, S('fd10') - 0.1);
  pic('melon', '찬 과일', RX + 40, 210, A('fd08', '찬 과일', -0.4), S('fd10') - 0.1, { w: 360, h: 250, rot: 1.4 });
  chip('no', '날음식', RX + 470, 220, A('fd08', '날것', -0.3), S('fd09') - 0.05);
  chip('no', '찬 음료', RX + 470, 320, A('fd08', '찬 음료', -0.2), S('fd09') - 0.05);
  chip('no', '찬 맥주', RX + 700, 320, A('fd08', '맥주', -0.3), S('fd09') - 0.05);
  seal('no', '피함', RX + 330, 190, A('fd08', '맞지', 0), S('fd10') - 0.1);
  pic('pork', '돼지고기', RX + 470, 210, A('fd09', '돼지고기', -0.3), S('fd10') - 0.1, { w: 360, h: 250, rot: -1 });
  chip('no', '밀가루 음식', RX + 900, 260, A('fd09', '밀가루', -0.2), S('fd10') - 0.1);
  item('<span class="hand c-sy">← 소양인에겐 ‘맞는다’던 바로 그 음식</span>', RX + 860, 380, A('fd09', '소양인', -0.2), S('fd10') - 0.1);
  item('<span class="brush h3 c-ty">여기서 반전</span>', RX + 40, 500, S('fd10') + 0.1, S('fd11') - 0.1);
  item('<span class="head ok">소음인에게는 오히려 맞는다고 보는 음식</span>', RX + 40, 600, A('fd10', '닭고기', -0.6), S('fd11') - 0.1);
  chip('ok', '닭고기', RX + 40, 720, A('fd10', '닭고기', -0.2), S('fd11') - 0.1);
  pic('ginseng', '인삼', RX + 300, 670, A('fd10', '인삼', -0.3), S('fd11') - 0.1, { w: 300, h: 190, rot: -1 });
  chip('ok', '생강', RX + 680, 720, A('fd10', '생강', -0.2), S('fd11') - 0.1);
  seal('ok', '맞음', RX + 880, 690, A('fd10', '오히려', 0), S('fd11') - 0.1);
  // the bowl again: split verdict
  const f11 = S('fd11');
  pic('gyetang', '처음에 본 그 삼계탕', 900, 170, f11 - 0.1, se1 - 0.15, { w: 640, h: 440, rot: 0 });
  item('<span class="brush h3 c-se">소음인</span><br><span class="sub">맞는다고 봄</span>', 620, 760, A('fd11', '소음인', -0.3), se1 - 0.15, { style: 'text-align:right;width:240px' });
  seal('ok', '맞음', 880, 760, A('fd11', '맞고', -0.1), se1 - 0.15);
  seal('no', '피함', 1410, 760, A('fd11', '맞지 않는다고', -0.1), se1 - 0.15);
  item('<span class="brush h3 c-sy">소양인</span><br><span class="sub">맞지 않는다고 봄</span>', 1560, 760, A('fd11', '소양인', -0.3), se1 - 0.15);
  // ---- 태음인
  const te0 = S('fd12'), te1 = S('fd15');
  colm('太陰人', '태음인', '체격이 크고 식욕이<br>좋은 체질로 봄 · 가장 많음', 'c-te', te0 - 0.1, te1 - 0.15);
  item('<span class="head no">조심하라고 하는 것</span>', RX + 40, 190, S('fd13') - 0.1, te1 - 0.15);
  item('<span class="brush h1 c-no">과식</span>', RX + 40, 250, A('fd13', '과식', -0.3), te1 - 0.15, { anim: 'pop' });
  item('<span class="brush h2 c-no">기름진 음식</span>', RX + 380, 270, A('fd13', '기름진', -0.3), te1 - 0.15, { anim: 'pop' });
  seal('no', '조심', RX + 900, 250, A('fd13', '조심', -0.1), te1 - 0.15);
  item('<span class="head ok">맞는다고 보는 음식</span>', RX + 40, 560, S('fd14') - 0.1, te1 - 0.15);
  pic('hanu', '쇠고기 (한우)', RX + 40, 620, A('fd14', '쇠고기', -0.4), te1 - 0.15, { w: 380, h: 230, rot: 1 });
  chip('ok', '콩', RX + 490, 700, A('fd14', '콩', -0.2), te1 - 0.15);
  chip('ok', '무', RX + 620, 700, A('fd14', '무', -0.2), te1 - 0.15);
  chip('ok', '도라지', RX + 750, 700, A('fd14', '도라지', -0.2), te1 - 0.15);
  seal('ok', '맞음', RX + 1030, 680, A('fd14', '잘 맞는다', -0.2), te1 - 0.15);
  // ---- 태양인
  const ty0 = S('fd15'), ty1 = S('fd18');
  colm('太陽人', '태양인', '가장 드문 체질', 'c-ty', ty0 - 0.1, ty1 - 0.15);
  item('<span class="head no">피하라고 하는 음식</span>', RX + 40, 190, A('fd15', '맵고', -0.3), ty1 - 0.15);
  chip('no', '맵고 뜨거운 음식', RX + 40, 260, A('fd15', '맵고', -0.1), ty1 - 0.15);
  chip('no', '기름진 고기', RX + 480, 260, A('fd15', '기름진', -0.2), ty1 - 0.15);
  pic('hanu', '쇠고기', RX + 40, 380, A('fd16', '쇠고기', -0.4), S('fd17') - 0.1, { w: 380, h: 230, rot: -1.2 });
  seal('no', '피함', RX + 340, 360, A('fd16', '쇠고기', 0.3), S('fd17') - 0.1);
  item('<span class="hand c-te">← 태음인에겐 ‘맞는다’던 그 고기</span>', RX + 470, 470, A('fd16', '태음인', -0.2), S('fd17') - 0.1);
  item('<span class="head ok">대신, 맞는다고 보는 음식</span>', RX + 40, 380, S('fd17') - 0.05, ty1 - 0.15);
  pic('noodle', '메밀 · 냉면', RX + 40, 440, A('fd17', '메밀', -0.4), ty1 - 0.15, { w: 400, h: 260, rot: 1 });
  chip('ok', '새우 · 조개', RX + 500, 500, A('fd17', '새우', -0.2), ty1 - 0.15);
  chip('ok', '포도', RX + 820, 500, A('fd17', '포도', -0.2), ty1 - 0.15);
  seal('ok', '맞음', RX + 1030, 470, A('fd17', '담백', -0.1), ty1 - 0.15);
  // ---- summary matrix
  const f18 = S('fd18');
  const o = '<span class="seal ok sm">맞음</span>', x = '<span class="seal no sm">피함</span>', dash = '·';
  item(`<span class="brush h2">같은 음식, <span class="c-no">정반대</span>의 평가</span>`, X, 170, f18 + 0.1, S('ck01') - 0.2);
  item(`<table class="mx"><tr><th></th><th class="c-sy">소양인</th><th class="c-se">소음인</th><th class="c-te">태음인</th><th class="c-ty">태양인</th></tr>
    <tr><td class="rowh">닭고기 · 인삼</td><td>${x}</td><td>${o}</td><td>${dash}</td><td>${dash}</td></tr>
    <tr><td class="rowh">돼지고기</td><td>${o}</td><td>${x}</td><td>${dash}</td><td>${dash}</td></tr>
    <tr><td class="rowh">쇠고기</td><td>${dash}</td><td>${dash}</td><td>${o}</td><td>${x}</td></tr></table>
    <span class="src">사상체질 음식론에서 흔히 소개되는 분류 · 자료마다 조금씩 다름 · ‘·’는 이 영상에서 다루지 않음</span>`, X - 10, 320, f18 + 0.4, S('ck01') - 0.2);

  // ================= ck — 얼마나 믿어도 될까? =================
  drawer('參', '얼마나 믿어도 될까?', S('ck01') - 0.2, S('fn01') - 0.3);
  item('<span class="brush h1">이 음식표,<br><span class="c-ty">얼마나</span><br>믿어도 될까?</span>', X, 230, S('ck01') + 0.1, S('ck02') - 0.05);
  item('<span class="brush h1 c-ty">하나</span><br><span class="brush h3">음식표는 이제마의 책에<br><span class="c-no">그대로 있지 않다</span></span>', X, 230, S('ck02') + 0.1, S('ck04') - 0.1);
  pic('book', '『동의수세보원』', 1180, 160, S('ck02') + 0.3, S('ck03') + 0.2, { w: 560, h: 400, rot: 1.5 });
  item('<span class="sub">원문에는 음식 이야기가 <b>많지 않음</b><br>오늘날의 표는 <b>후대 문헌</b>이 모아 정리</span><span class="src">사상체질의학회지 논문들(1998 · 2009 · 2018)의 문헌 고찰</span>', X, 640, S('ck03') + 0.2, S('ck04') - 0.1);
  item(`<span class="j">사상체질의학회지 · 1997</span><span class="ti">콩과 팥에 대한 사상의학적 고찰</span><span class="qt">“그 분류기준이 모호하여<br>각 임상가마다 다소<br>논란의 여지가 있음이 사실이다”</span><span class="src">체질별 식품 분류에 대해</span>`, 1020, 220, S('ck04') - 0.1, S('ck05') - 0.05, { cls: 'paper', anim: 'card', rot: -1 });
  item('<span class="brush h3">기준이 <span class="c-no">모호</span>해서<br>임상가마다 <span class="c-no">논란</span></span>', X, 330, S('ck04') + 0.3, S('ck05') - 0.05);
  // experts
  const c5 = S('ck05'), c6 = S('ck06'), c7 = S('ck07');
  item('<span class="brush h1 c-ty">둘</span><br><span class="brush h3">체질을 가려내는 것부터<br><span class="c-no">쉽지 않다</span></span>', X, 230, c5 + 0.1, c6 - 0.05);
  item('<span class="kick">2014 · 한국한의학연구원</span><br><span class="brush h3">전문가 3명이<br>같은 <span class="c-ty">81명</span>을<br>각자 진단</span>', X, 230, c6 + 0.1, S('ck08') - 0.2);
  const TRI = [[1340, 240], [1730, 790], [950, 790]];
  ['A', 'B', 'C'].forEach((n, i) => item(`<span class="brush h4">전문가 ${n}</span>`, TRI[i][0] - 110, TRI[i][1] + (i === 0 ? -150 : 70), A('ck06', '세 명', -0.2) + i * 0.25, S('ck08') - 0.2, { anim: 'pop', style: 'width:220px;text-align:center' }));
  const pairLab = (txt, x, y, t0, cls) => item(`<span class="num h4 ${cls}">${txt}</span>`, x, y, t0, S('ck08') - 0.2, { anim: 'pop' });
  pairLab('66.7%', 1580, 470, c7 + 0.6, '');
  pairLab('68.4%', 1280, 810, c7 + 1.0, '');
  pairLab('52.5%', 950, 470, A('ck07', '절반', -0.3), 'c-no');
  item('<span class="sub">두 사람씩 진단이 같았던 비율<br>가장 낮은 짝 <b class="c-no">52.5%</b><br>가장 높은 짝 <b>68.4%</b></span><span class="src">백화 외, 「사상체질 전문가의 체질진단<br>일치도 및 타당도 평가」, 사상체질의학회지 26(3), 2014</span>', X, 600, c7 + 0.4, S('ck08') - 0.2);
  // studies
  const c8 = S('ck08'), c9 = S('ck09');
  item('<span class="brush h1 c-ty">셋</span><br><span class="brush h3">체질대로 먹으면 더 건강할까?<br><span class="c-no">확인한 연구가 많지 않다</span></span>', X, 230, c8 + 0.1, c9 - 0.05);
  item('<span class="kick">2020 · 체질 식이 연구 10편 점검</span><br><span class="brush h3">무작위 대조 1편 · 비무작위 9편</span>', X, 200, c9 + 0.1, S('fn01') - 0.2);
  seal('no', '보고의 질<br>낮음', 1440, 640, A('ck09', '낮다고', -0.2), S('fn01') - 0.2, { rot: -10, big: true });
  item('<span class="src">김지환 · 이주아, 「사상체질 식이 중재연구 보고에 대한 질 평가」, 사상체질의학회지 32(4), 2020</span>', X, 900, c9 + 0.8, S('fn01') - 0.2);

  // ================= fn — 내 몸에 맞게 먹는 법 =================
  drawer('肆', '내 몸에 맞게 먹는 법', S('fn01') - 0.2, S('fn06') - 0.3);
  item('<span class="brush h1">그렇다면<br>어떻게 먹을까?</span>', X, 300, S('fn01') + 0.1, S('fn02') - 0.05);
  const LY = 200;
  item('<div class="list"><span class="n">壹</span>먹은 뒤 <span class="c-ty">내 몸의 신호</span> 살피기</div>', X, LY, S('fn02') + 0.1, S('fn06') - 0.2);
  chip('no', '속쓰림', X + 110, LY + 140, A('fn03', '속이', -0.2), S('fn04') - 0.1);
  chip('no', '열감', X + 370, LY + 140, A('fn03', '열이', -0.2), S('fn04') - 0.1);
  chip('no', '배탈', X + 580, LY + 140, A('fn03', '배탈', -0.2), S('fn04') - 0.1);
  item('<span class="hand">반복되면 진료도 받아 보세요</span>', X + 800, LY + 150, A('fn03', '반복', -0.2), S('fn04') - 0.1);
  item('<div class="list"><span class="n">貳</span>골고루 · 적당히 · <span class="c-se">너무 차거나 자극적이지 않게</span></div>', X, LY + 300, S('fn04') + 0.2, S('fn06') - 0.2);
  item('<div class="list"><span class="n">參</span>지병 · 복약 중이면 <span class="c-te">의사 · 한의사와 상의</span></div>', X, LY + 480, S('fn05') + 0.2, S('fn06') - 0.2);
  pic('lee', '', 1300, 170, S('fn06') + 0.1, S('fn07') + 0.2, { w: 400, h: 510, cls: 'tall', rot: 1.2 });
  item('<span class="hand">130여 년 전의 메시지</span><br><span class="brush h1">사람은<br><span class="c-ty">저마다</span> 다르다</span>', X, 280, A('fn06', '메시지', -0.4), S('fn07') + 0.1);
  pic('gyetang', '', 1080, 210, S('fn07') + 0.1, END - 5.4, { w: 640, h: 440, rot: -1 });
  item('<span class="brush h2">오늘 저녁,<br>내 몸에 맞는<br><span class="c-ty">한 그릇</span>은?</span>', X, 280, S('fn07') + 0.3, END - 5.4);
  // credits (tail)
  item(`<h4>실사 자료</h4><div class="grid">
    <div>이제마 초상(1920년경) — 퍼블릭 도메인<br>『동의수세보원』 사진 — 이강철 · CC BY-SA 4.0<br>삼계탕 — wizdata · CC0<br>고추 — yoopilsun · CC0<br>삼겹살 — idkjm123 · CC0<br>냉면 — ProjectManhattan · CC0</div>
    <div>수박 — Nesnad · CC BY 4.0<br>인삼 — 국립국어원 · CC BY-SA 2.0 KR<br>꿀 — Shixart1985 · CC BY 2.0<br>한우 — Charlie Yoon · CC0<br>사진 출처: 모두 Wikimedia Commons</div></div>
    <div style="margin-top:18px">이 영상은 전통 이론을 소개하며 진단·치료를 대신하지 않습니다. 배경음악과 효과음은 이 영상을 위해 코드로 작곡·합성했습니다.</div>`, 210, 220, END - 5.2, END + 2, { cls: 'credits' });

  // ---------------- sound: music under the voice, synthesized effects on the beats ----------------
  const M = MEDIA.install(ctx), sfxBox = document.getElementById('sfx');
  const sfx = (key, t0, vol) => M.clip(sfxBox, key, { x: 0, y: 0, w: 4, h: 4, start: Math.max(0, t0), dur: M.SRC[key].dur, audio: true, vol });
  cardsT.forEach((t0) => sfx('swish', t0 - 0.05, 0.5));
  stamps.forEach((t0) => sfx('stamp', t0 - 0.02, 0.75));
  drawers.forEach((t0) => sfx('chime', t0, 0.45));
  sfx('chime', S('op05') + 0.25, 0.4);
  if (M.SRC.bgm) M.clip(sfxBox, 'bgm', { x: 0, y: 0, w: 4, h: 4, start: 0, dur: END, audio: true, vol: M.duck(0, END, 0.55, 0.22, 0.25) });

  await Promise.all(Array.from(ui.querySelectorAll('img')).map((im) => im.decode().catch(() => {})));

  // ---------------- fx drawing ----------------
  const ring = (x, y, r, col, a, w = 3) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
  const disc = (x, y, r, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fill(); };
  function inkCircle(x, y, r, col, a) { // a brushed ring with a soft wash inside
    if (a <= 0 || r <= 0) return;
    const wash = g.createRadialGradient(x, y, r * 0.1, x, y, r);
    wash.addColorStop(0, col + '33'); wash.addColorStop(1, col + '14');
    g.globalAlpha = a; g.fillStyle = wash; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 3; k++) { g.globalAlpha = a * (0.75 - k * 0.2); g.strokeStyle = col; g.lineWidth = 6 - k * 1.6; g.beginPath(); g.arc(x + k * 1.2, y - k, r - k * 2, -0.3 + k * 0.4, Math.PI * 2 - 0.5 + k * 0.3); g.stroke(); }
  }
  // steam over a bowl (card rectangle)
  function steam(t, cx, top, w, a) {
    if (a <= 0) return;
    g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x0 = cx + (i - 2) * w * 0.16, ph = t * 0.9 + i * 1.7;
      g.globalAlpha = a * 0.5; g.strokeStyle = '#ffffff'; g.lineWidth = 9 - i * 0.6; g.beginPath();
      for (let s = 0; s <= 20; s++) { const u = s / 20, yy = top - u * 170, xx = x0 + Math.sin(ph + u * 4.2) * 16 * (0.3 + u); s ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke();
    }
    g.lineCap = 'butt';
  }
  function person(x, y, s, col, a) {
    if (a <= 0) return;
    disc(x, y - 62 * s, 22 * s, col, a);
    g.globalAlpha = a; g.fillStyle = col; g.beginPath();
    g.moveTo(x - 34 * s, y + 40 * s); g.quadraticCurveTo(x - 36 * s, y - 32 * s, x, y - 32 * s); g.quadraticCurveTo(x + 36 * s, y - 32 * s, x + 34 * s, y + 40 * s); g.closePath(); g.fill();
  }
  // organ configurations: [폐, 비위, 간, 신] radii for each row
  const R0 = [66, 66, 66, 66];
  const CFG = { sy: [66, 92, 66, 40], se: [66, 40, 66, 92], ty: [92, 66, 40, 66], te: [40, 66, 92, 66] };
  // 10,000 dots: 200 × 50, ten of them 태양인
  const DOT = { x0: 210, y0: 420, dx: 7.5, dy: 7.5, cols: 200, rows: 50 };
  const RED = []; { seed = 99; for (let i = 0; i < 10; i++) RED.push([Math.floor(rnd() * 200), Math.floor(rnd() * 50)]); }

  onFrame((t, redraw) => {
    if (!paperDrawn || redraw) { pgc.drawImage(paperOff, 0, 0, 1920, 1080); paperDrawn = true; }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fc.width, fc.height); g.restore();
    // never leave the layer fully empty: an all-clear canvas was sometimes composited stale after a long seek
    g.globalAlpha = 0.02; g.fillStyle = '#f5eedf'; g.fillRect(0, 0, 2, 2); g.globalAlpha = 1;
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineWidth = 1; g.lineCap = 'butt'; g.setLineDash([]);

    // steam over the bowls
    steam(t, 1360, 210, 760, vis(t, S('op01') - 0.2, S('op03') + 0.2, 1, 0.6));
    steam(t, 1220, 210, 640, vis(t, S('fd11'), S('fd12') - 0.15, 1, 0.5));
    steam(t, 1400, 250, 640, vis(t, S('fn07') + 0.1, END - 5.4, 1, 0.6));

    // the four-image wheel (lj04)
    const wa = vis(t, lj4 - 0.1, lj5 - 0.1, 0.8, 0.5);
    if (wa > 0) {
      const quads = [[COL.ty, Math.PI, 1.5 * Math.PI, '태양인'], [COL.sy, 1.5 * Math.PI, 2 * Math.PI, '소양인'], [COL.se, 0, 0.5 * Math.PI, '소음인'], [COL.te, 0.5 * Math.PI, Math.PI, '태음인']];
      quads.forEach(([c, a0, a1, w], i) => {
        const appear = out(K(t, A('lj04', w, -0.2), A('lj04', w, 0.5)));
        if (appear <= 0) return;
        g.globalAlpha = wa * 0.2 * appear; g.fillStyle = c; g.beginPath(); g.moveTo(WC.x, WC.y); g.arc(WC.x, WC.y, WC.r * (0.8 + 0.2 * appear), a0 + 0.03, a1 - 0.03); g.closePath(); g.fill();
        g.globalAlpha = wa * appear; g.strokeStyle = c; g.lineWidth = 9; g.beginPath(); g.arc(WC.x, WC.y, WC.r * (0.8 + 0.2 * appear), a0 + 0.05, a1 - 0.05); g.stroke();
      });
      g.globalAlpha = wa * 0.5; g.strokeStyle = COL.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(WC.x - WC.r - 20, WC.y); g.lineTo(WC.x + WC.r + 20, WC.y); g.moveTo(WC.x, WC.y - WC.r - 20); g.lineTo(WC.x, WC.y + WC.r + 20); g.stroke();
    }
    // organs (lj05 → lj08)
    const oa = vis(t, lj5 + 1.0, lj9 - 0.2, 0.8, 0.5);
    if (oa > 0) {
      const pair = K(t, lj7 - 0.2, lj7 + 0.6);       // one row → two rows
      const swap = io(K(t, lj8 - 0.3, lj8 + 0.9));    // 소양/소음 → 태양/태음
      const rows = [
        { y: lerp(560, 420, pair), cfgA: CFG.sy, cfgB: CFG.ty, colA: COL.sy, colB: COL.ty, a: 1 },
        { y: 770, cfgA: CFG.se, cfgB: CFG.te, colA: COL.se, colB: COL.te, a: K(t, A('lj07', '소음인', -0.3), A('lj07', '소음인', 0.4)) },
      ];
      rows.forEach((row, ri) => {
        if (row.a <= 0) return;
        for (let i = 0; i < 4; i++) {
          const grow = io(K(t, (ri ? A('lj07', '소음인', 0) : lj7 + 0.3), (ri ? A('lj07', '소음인', 1.2) : lj7 + 1.5)));
          const rA = lerp(R0[i], row.cfgA[i], grow), r = lerp(rA, row.cfgB[i], swap);
          const col = pair > 0 ? (swap < 0.5 ? row.colA : row.colB) : COL.ink;
          const pop = out(K(t, lj5 + 1.2 + i * 0.35, lj5 + 1.8 + i * 0.35));
          inkCircle(OX[i], row.y, r * (ri === 0 ? pop : 1), col, oa * row.a * (swap > 0.35 && swap < 0.65 ? 0.4 : 1));
        }
      });
      // mirror line between the rows
      const ma = vis(t, A('lj08', '거울', -0.5), lj9 - 0.2, 0.6, 0.4) * oa;
      if (ma > 0) { g.globalAlpha = ma; g.strokeStyle = COL.ty; g.lineWidth = 3; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(760, 600); g.lineTo(1800, 600); g.stroke(); g.setLineDash([]); }
    }
    // ten people (lj09)
    const pa = vis(t, lj9, lj10 - 0.05, 0.5, 0.4);
    if (pa > 0) {
      const cols = [COL.te, COL.te, COL.te, COL.te, COL.te, COL.sy, COL.sy, COL.sy, COL.se, COL.se];
      const when = [A('lj09', '다섯', -0.3), A('lj09', '셋', -0.3), A('lj09', '둘', -0.3)];
      cols.forEach((c, i) => {
        const grp = i < 5 ? 0 : i < 8 ? 1 : 2;
        const ap = out(K(t, when[grp] + (i % 5) * 0.08, when[grp] + 0.5 + (i % 5) * 0.08));
        const xx = 580 + i * 118 + (grp ? 40 * grp : 0);
        person(xx, 590 + (1 - ap) * 30, 1.25, c, pa * ap);
      });
    }
    // 10,000 dots (lj10)
    const da = vis(t, lj10, S('fd01') - 0.2, 0.6, 0.4);
    if (da > 0) {
      const fill = K(t, lj10 + 0.1, lj10 + 1.6);
      const nShow = Math.floor(fill * DOT.rows);
      g.globalAlpha = da * 0.55; g.fillStyle = '#8c7e6c';
      for (let r = 0; r < nShow; r++) for (let c = 0; c < DOT.cols; c++) g.fillRect(DOT.x0 + c * DOT.dx - 1.3, DOT.y0 + r * DOT.dy - 1.3, 2.6, 2.6);
      const ra = K(t, A('lj10', '열 명', -0.4), A('lj10', '열 명', 0.4));
      RED.forEach(([c, r], i) => {
        const x = DOT.x0 + c * DOT.dx, y = DOT.y0 + r * DOT.dy;
        disc(x, y, 6 * ra, COL.ty, da);
        ring(x, y, 10 + 14 * ((t * 0.8 + i * 0.13) % 1), COL.ty, da * ra * (1 - ((t * 0.8 + i * 0.13) % 1)), 2);
      });
    }
    // the balance (fd02)
    const ba = vis(t, fd2 + 0.2, S('fd03') - 0.15, 0.6, 0.4);
    if (ba > 0) {
      const px = 1290, py = 330, L = 330;
      const tilt = lerp(0.16, 0.16, 0) * (1 - io(K(t, A('fd02', '모자란', 0.2), A('fd02', '모자란', 1.6))));
      g.globalAlpha = ba; g.strokeStyle = COL.ink; g.fillStyle = COL.ink; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.lineTo(px, 820); g.stroke();
      g.beginPath(); g.moveTo(px - 120, 830); g.lineTo(px + 120, 830); g.stroke();
      const lx = px - L * Math.cos(tilt), ly = py + L * Math.sin(tilt), rx = px + L * Math.cos(tilt), ry = py - L * Math.sin(tilt);
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); g.stroke();
      disc(px, py, 14, '#a07c38', ba);
      [[lx, ly, COL.no, 1], [rx, ry, COL.ok, K(t, A('fd02', '채워', -0.3), A('fd02', '채워', 0.5))]].forEach(([x0, y0, c, fillA]) => {
        g.globalAlpha = ba; g.strokeStyle = COL.ink; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 - 80, y0 + 150); g.moveTo(x0, y0); g.lineTo(x0 + 80, y0 + 150); g.stroke();
        g.lineWidth = 7; g.beginPath(); g.moveTo(x0 - 110, y0 + 150); g.quadraticCurveTo(x0, y0 + 205, x0 + 110, y0 + 150); g.stroke();
        disc(x0 - 26, y0 + 140, 26, c, ba * (c === COL.no ? 0.85 : 0.85 * fillA)); disc(x0 + 22, y0 + 138, 22, c, ba * (c === COL.no ? 0.7 : 0.7 * fillA)); disc(x0 - 2, y0 + 118, 20, c, ba * (c === COL.no ? 0.6 : 0.6 * fillA));
      });
      g.lineCap = 'butt';
    }
    // constitution wash behind the column (fd)
    [[S('fd03'), S('fd07'), COL.sy], [S('fd07'), S('fd12'), COL.se], [S('fd12'), S('fd15'), COL.te], [S('fd15'), S('fd18'), COL.ty]].forEach(([a, b, c]) => {
      const wa2 = vis(t, a - 0.1, b - 0.15, 0.6, 0.4);
      if (wa2 <= 0) return;
      const gr = g.createRadialGradient(240, 520, 20, 240, 520, 420); gr.addColorStop(0, c + '30'); gr.addColorStop(1, c + '00');
      g.globalAlpha = wa2; g.fillStyle = gr; g.fillRect(0, 60, 560, 960);
      g.globalAlpha = wa2 * 0.5; g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(470, 170); g.lineTo(470, 940); g.stroke();
    });
    // the experts' triangle (ck06–07)
    const ta = vis(t, A('ck06', '세 명', -0.3), S('ck08') - 0.2, 0.6, 0.4);
    if (ta > 0) {
      const edges = [[0, 1, c7 + 0.4, 66.7, COL.ink], [1, 2, c7 + 0.8, 68.4, COL.ink], [0, 2, A('ck07', '절반', -0.5), 52.5, COL.no]];
      edges.forEach(([i, j, t0, p, c]) => {
        const e = out(K(t, t0, t0 + 0.8)); if (e <= 0) return;
        const [x0, y0] = TRI[i], [x1, y1] = TRI[j];
        g.globalAlpha = ta; g.strokeStyle = c; g.lineWidth = (p - 40) / 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, e), lerp(y0, y1, e)); g.stroke(); g.lineCap = 'butt';
      });
      TRI.forEach(([x, y], i) => { const ap = out(K(t, A('ck06', '세 명', -0.2) + i * 0.25, A('ck06', '세 명', 0.4) + i * 0.25)); disc(x, y, 46 * ap, '#fffaf0', ta); ring(x, y, 46 * ap, COL.ink, ta * ap, 5); person(x, y + 12, 0.42 * ap, COL.ink, ta * ap); });
      // 81 people in the middle
      const n81 = Math.floor(81 * K(t, A('ck06', '81명', -0.3), A('ck06', '81명', 1.0)));
      for (let i = 0; i < n81; i++) disc(1340 - 60 + (i % 9) * 15, 580 - 60 + Math.floor(i / 9) * 15, 4.2, COL.ty, ta * 0.8);
    }
    // ten studies (ck09)
    const sa = vis(t, c9, S('fn01') - 0.2, 0.5, 0.4);
    if (sa > 0) {
      for (let i = 0; i < 10; i++) {
        const ap = out(K(t, c9 + 0.3 + i * 0.12, c9 + 0.8 + i * 0.12)); if (ap <= 0) continue;
        const x = 560 + (i % 5) * 230, y = 400 + Math.floor(i / 5) * 250 + (1 - ap) * 20;
        g.globalAlpha = sa * ap; g.fillStyle = '#fffdf8'; g.shadowColor = 'rgba(70,50,30,0.2)'; g.shadowBlur = 12; g.fillRect(x, y, 150, 200); g.shadowBlur = 0;
        g.fillStyle = i === 0 ? COL.se : '#8c7a5c'; g.fillRect(x, y, 150, 14);
        g.fillStyle = 'rgba(80,65,50,0.35)'; for (let l = 0; l < 7; l++) g.fillRect(x + 18, y + 40 + l * 20, l === 6 ? 60 : 114, 6);
      }
    }

    // DOM items
    for (const it of items) {
      const a = vis(t, it.t0, it.t1, it.fi, it.fo);
      if (a <= 0) { if (it.last !== 'h') { it.el.style.opacity = '0'; it.el.style.visibility = 'hidden'; it.last = 'h'; } continue; }
      const k = K(t, it.t0, it.t0 + 0.7);
      let tr;
      if (it.anim === 'stamp') { const s = lerp(1.9, 1, out(K(t, it.t0, it.t0 + 0.22))); tr = `rotate(${it.rot}deg) scale(${s.toFixed(3)})`; }
      else if (it.anim === 'pop') tr = `scale(${(0.8 + 0.2 * back(k)).toFixed(3)})`;
      else if (it.anim === 'card') tr = `translateY(${((1 - out(k)) * 26).toFixed(1)}px) rotate(${it.rot}deg)`;
      else if (it.anim === 'slide') tr = `translateX(${((1 - out(k)) * -30).toFixed(1)}px)`;
      else tr = `translateY(${((1 - out(k)) * 18).toFixed(1)}px)`;
      const op = it.anim === 'stamp' ? Math.min(1, K(t, it.t0, it.t0 + 0.08)) * (1 - K(t, it.t1 - it.fo, it.t1)) : a;
      const key = op.toFixed(3) + tr;
      if (key === it.last) continue;
      it.el.style.visibility = 'inherit'; it.el.style.opacity = op.toFixed(3); it.el.style.transform = tr; it.last = key;
    }
  });
});
