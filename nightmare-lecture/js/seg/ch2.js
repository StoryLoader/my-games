/* ch2.js — b02–b24: how one sentence becomes a film — the seven layers.
 * Seven glass plates settle over the lantern, outermost on top. For each layer its plate is drawn up out of the stack,
 * turns to face us and its rule is engraved on it; then it sinks back and the next one rises. */
SEG.ch2 = (ctx, K) => {
  const { tl, scene, onFrame } = ctx;
  const { S, E, A } = K;
  const t0 = S('b02') - 0.4, end = S('c02') - 0.2;
  const sc = K.el('section', 'scene', K.$('world')); sc.id = 's-ch2';
  const top = K.el('section', 'scene', K.$('top')); top.id = 's-ch2-top';
  scene(sc, t0, end + 0.8); scene(top, t0, end + 0.8);

  K.card(top, { at: S('b02') - 0.3, out: S('b03') - 0.4, num: '제 2 장', q: '한 문장이 어떻게 영상이 될까?', key: '영상' });
  K.cam.key(S('b02') - 0.4, { x: 960, y: 540, s: 1, b: 0 });
  K.beam.key(S('b02'), { v: 0.8 }).key(S('b03') + 1, { v: 1 });

  // —— the stack of seven plates ——
  const NAMES = [['스킬 파일', 'SKILL.md'], ['설치 스크립트', 'setup.sh'], ['에이전트 안내문', 'AGENTS.md'], ['연출 지침서', 'DIRECTOR.md'],
    ['기술 지침서', 'TECHNIQUE.md'], ['스타일 지침서', 'STYLE.md'], ['예시 제작 노트', 'DEMO.md']];
  const stack = K.el('div', null, sc, { left: 0, top: 0, width: 1920, height: 1080 });
  const SY = (i) => 170 + i * 68;                          // plate i's centre line on screen
  const plates = NAMES.map(([nm, f], i) => {
    const p = K.plate(stack, { x: 470, y: SY(i) - 280, w: 980, h: 560 });
    gsap.set(p, { transformPerspective: 1500, rotationX: 70 });
    if (i === 1) p.style.background = 'linear-gradient(180deg, rgba(150,255,210,.10), rgba(90,170,140,.05))';   // the one program among the prompts
    const lb = K.el('div', 'lbl', stack, { left: 250, top: SY(i) - 18, fontSize: 26 }, `<b style="font-family:var(--serif);margin-right:10px">${i + 1}</b>${nm}`);
    return { p, lb };
  });
  const tIn = S('b03') - 0.2;
  plates.forEach(({ p, lb }, i) => {
    tl.fromTo(p, { autoAlpha: 0, y: -260 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', immediateRender: true }, tIn + (6 - i) * 0.22);
    K.sfx('clink', tIn + (6 - i) * 0.22 + 0.6, 0.55);
    K.inn(lb, A('b03', '일곱 겹을') + i * 0.12, 0.5, 6);
    K.warm(p, A('b03', '프롬프트') + 0.4, 0.8, 1.0);
  });
  const pr = K.etch(top, '사람의 말로 쓴 지시문 = 프롬프트', { x: 960, y: 80, size: 44, align: 'c' });
  K.inn(pr, A('b03', '사람의 말로'), 0.6, 10); K.lit(pr, A('b03', '프롬프트'), 0.6);
  const prog = K.el('div', 'lbl', stack, { left: 1480, top: SY(1) - 18, fontSize: 24, color: '#a8f5d2' }, '← 작은 프로그램');
  K.inn(prog, A('b03', '작은 프로그램'), 0.6, 6);
  const arrow = K.svg(stack);
  K.thread(arrow, `M 1500 ${SY(0)} L 1500 ${SY(6)}`, A('b03', '바깥에서 안쪽으로'), 1.2, { w: 3 });
  const outside = K.el('div', 'lbl', stack, { left: 1520, top: SY(0) - 52, fontSize: 22 }, '바깥');
  const inside = K.el('div', 'lbl', stack, { left: 1520, top: SY(6) + 20, fontSize: 22 }, '안쪽');
  K.inn(outside, A('b03', '바깥에서'), 0.5, 6); K.inn(inside, A('b03', '안쪽으로'), 0.5, 6);
  tl.fromTo([pr, prog, arrow, outside, inside], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b04') - 0.3);

  // —— one layer at a time: the reading plate rises out of the stack, faces us, is engraved, sinks back ——
  const LAYERS = [['b04', 'b05'], ['b06', 'b07'], ['b08', 'b11'], ['b12', 'b16'], ['b17', 'b19'], ['b20', 'b23'], ['b24', 'b24']];
  const RP = LAYERS.map(([a, b], i) => {
    const rp = K.plate(sc, { x: 210, y: 150, w: 1500, h: 660, num: i + 1, name: `${NAMES[i][0]} · ${NAMES[i][1]}` });
    gsap.set(rp, { transformPerspective: 1500 });
    const up = S(a) - 0.35, down = i < 6 ? S(LAYERS[i + 1][0]) - 0.45 : E('b24') + 0.25;
    tl.fromTo(rp, { autoAlpha: 0, y: SY(i) - 480, rotationX: 70, scale: 0.65 }, { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: 1.0, ease: 'power3.out', immediateRender: true }, up);
    tl.fromTo(rp, { autoAlpha: 1, y: 0, rotationX: 0, scale: 1 }, { autoAlpha: 0, y: SY(i) - 480, rotationX: 70, scale: 0.65, duration: 0.7, ease: 'power3.in', immediateRender: false }, down);
    K.warm(rp, up + 0.4, 1, 1.0);
    K.sfx('lift', up, 0.9); K.sfx('clink', down + 0.6, 0.5);
    // the stack waits, dimmed, with this layer's plate lit
    tl.fromTo(plates[i].p.querySelector('.warm'), { opacity: 0.8 }, { opacity: 1, duration: 0.4, immediateRender: false }, up);
    return { rp, up, down };
  });
  tl.fromTo(stack, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, immediateRender: false }, RP[0].up);
  tl.fromTo(stack, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, immediateRender: false }, RP[6].down + 0.4);
  const P = (i) => RP[i].rp;
  // each plate, as it rises, shows what it is at once (its number, name and what it does), until its own content begins
  const WHAT = ['클로드가 가장 먼저 읽는 파일', '라이브러리와 도구를 준비하는 작은 프로그램', '일의 순서를 정하는 안내문', '좋은 영상을 가르는 기준',
    '영상을 실제로 만드는 방법', '2.5D 픽셀 아트의 그림 규칙', '예시 영상을 만든 코드의 설명'];
  const FIRST = [A('b04', '가장 먼저'), A('b06', '두 번째 겹은') + 1.1, A('b08', '일의 순서'), A('b12', '무엇을 먼저 볼지'),
    A('b18', '웹 페이지로'), S('b21') - 0.2, A('b24', '예시 영상을 만든') - 0.3];
  RP.forEach(({ rp, up }, i) => {
    if (FIRST[i] - up < 2.6) return;
    const n = K.el('div', 'lbl c', rp, { left: 750, top: 150, fontSize: 30 }, `${i + 1} / 7`);
    const nm = K.etch(rp, NAMES[i][0], { x: 750, y: 220, size: 104, align: 'c' });
    const wd = K.etch(rp, WHAT[i], { x: 750, y: 380, size: 44, align: 'c', cls: 'sans' });
    K.inn(n, up + 0.5, 0.5, 6); K.write(nm, up + 0.55, 0.9); K.write(wd, up + 1.0, 0.8);
    tl.fromTo([n, nm, wd], { autoAlpha: 1 }, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.in', immediateRender: false }, FIRST[i] - 0.45);
  });

  // 1 · skill file: three steps on a thread of light
  {
    const p = P(0);
    const hd = K.etch(p, '가장 먼저 읽는, 아주 짧은 파일', { x: 750, y: 70, size: 44, align: 'c', cls: 'sans' });
    K.inn(hd, A('b04', '가장 먼저'), 0.6, 8); K.lit(hd, A('b04', '아주 짧고'), 0.6);
    const sv = K.svg(p);
    K.thread(sv, 'M 160 420 C 450 380, 620 460, 750 420 S 1100 380, 1340 420', A('b04', '세 가지뿐'), 1.4, { w: 4 });
    const STEPS = [['라이브러리 받기', 300, A('b05', '내려받고')], ['도구 설치', 750, A('b05', '설치하고')], ['안내문 따르기', 1200, A('b05', '안내문을 따르라')]];
    STEPS.forEach(([w, x, at], k) => {
      const dot = K.el('div', null, p, { left: x - 14, top: 406, width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle, #fff3d6, #ffb35a 50%, rgba(255,150,60,0) 72%)' });
      gsap.set(dot, { autoAlpha: 0 });
      const n = K.etch(p, '①②③'[k], { x, y: 456, size: 40, align: 'c' });
      const e = K.etch(p, w, { x, y: 300, size: 58, align: 'c' });
      tl.fromTo(dot, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1.6, duration: 0.5, ease: 'back.out(3)', immediateRender: true }, at - 0.2);
      K.inn(n, at - 0.2, 0.4, 6); K.lit(n, at, 0.4); K.write(e, at - 0.15, 0.8); K.sfx('chime', at, 0.55);
    });
  }

  // 2 · install script: its printout, engraved
  {
    const p = P(1);
    const rows = [
      ['$ sh setup.sh', A('b06', '두 번째 겹은') + 1.2, ''],
      ['→ ~/lemo-opuscar  (라이브러리를 이 폴더에)', A('b06', '한 폴더에'), ''],
      ['Node.js   ✓', A('b06', '필요한 프로그램들을'), ''],
      ['Python    ✓', A('b06', '필요한 프로그램들을') + 0.35, ''],
      ['ffmpeg    ✗  버전이 낮음', A('b07', '버전이 낮다는'), 'v'],
      ['↳ 클로드가 질문할 때 함께 알림', A('b07', '질문할 때'), ''],
      ['↳ 새 버전 설치 → 작업 시작', A('b07', '새 버전 설치를'), ''],
    ];
    rows.forEach(([txt, at, c], k) => {
      const e = K.etch(p, txt, { x: 110, y: 70 + k * 74, size: 40, cls: 'mono' + (c ? ' ' + c : '') });
      K.write(e, at - 0.1, 0.7); K.sfx('tick', at, 0.5);
    });
    const fl = K.el('div', 'lbl', p, { left: 1080, top: 90, fontSize: 24, color: '#a8f5d2' }, '프롬프트가 아닌, 작은 프로그램');
    K.inn(fl, A('b06', '작은 프로그램'), 0.6, 6);
  }

  // 3 · agent guide: the order of work, a light travelling the stations; then keep / build new; the sealed example
  {
    const p = P(2);
    const hd = K.etch(p, '일의 순서', { x: 750, y: 60, size: 52, align: 'c' });
    K.write(hd, A('b08', '일의 순서'), 0.8);
    const ST = [['질문은 한 번에', 200, A('b09', '한 번에 모아서')], ['트리트먼트', 475, A('b09', '트리트먼트를')], ['화면 시험', 750, A('b09', '화면의 모습을')],
      ['제작', 1025, A('b09', '제작한 뒤')], ['스스로 검사', 1300, A('b09', '스스로 검사')]];
    const sv = K.svg(p);
    K.thread(sv, 'M 200 330 L 1300 330', A('b09', '먼저 사용자에게'), 1.0, { w: 3, dash: '3 10' });
    const bead = K.el('div', null, p, { left: -18, top: 312, width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle, #fffbe8, #ffc06a 45%, rgba(255,150,60,0) 72%)' });
    gsap.set(bead, { autoAlpha: 0, x: 200 });
    tl.fromTo(bead, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: true }, ST[0][2] - 0.3);
    const stEls = [];
    ST.forEach(([w, x, at], k) => {
      if (k) tl.fromTo(bead, { x: ST[k - 1][1] }, { x, duration: 0.7, ease: 'power2.inOut', immediateRender: false }, at - 0.5);
      const e = K.etch(p, w, { x, y: k % 2 ? 384 : 220, size: 46, align: 'c' });
      K.write(e, at - 0.2, 0.7); K.sfx('chime', at, 0.45); stEls.push(e);
    });
    tl.fromTo([hd, sv, bead, ...stEls], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b10') + 0.2);
    const keep = K.etch(p, '지킨다', { x: 400, y: 150, size: 120, align: 'c' });
    const keepL = K.el('div', 'lbl c', p, { left: 400, top: 320 }, '그림의 규칙 · 스타일 지침서');
    const nw = K.etch(p, '새로 짓는다', { x: 1100, y: 150, size: 120, align: 'c', cls: 'v' });
    const nwL = K.el('div', 'lbl c', p, { left: 1100, top: 320 }, '이야기 · 장면 · 카메라의 움직임');
    const mid = K.el('div', null, p, { left: 749, top: 110, width: 2, height: 300, background: 'linear-gradient(180deg, rgba(220,230,255,0), rgba(220,230,255,.4), rgba(220,230,255,0))' });
    gsap.set(mid, { autoAlpha: 0 });
    K.inn(mid, A('b10', '스타일마다'), 0.6, 0);
    K.write(keep, A('b10', '그대로 지키되') - 0.3, 0.8); K.inn(keepL, A('b10', '그림의 규칙'), 0.5, 6);
    K.write(nw, A('b10', '전부 새로') - 0.3, 0.9); K.inn(nwL, A('b10', '이야기와 장면과'), 0.5, 6);
    K.sfx('etch', A('b10', '그대로 지키되')); K.sfx('etch', A('b10', '전부 새로'));
    tl.fromTo([keep, keepL, nw, nwL, mid], { autoAlpha: 1, y: 0 }, { autoAlpha: 0.0, y: -30, duration: 0.5, immediateRender: false }, S('b11') - 0.1);
    const fr = K.el('div', 'mini', p, { left: 560, top: 150, width: 380, height: 220 });
    const seal = K.el('div', 'seal', p, { left: 690, top: 200 });
    const frL = K.etch(p, '예시 영상', { x: 750, y: 70, size: 46, align: 'c' });
    const lk = K.etch(p, '트리트먼트를 다 쓴 뒤에만 연다', { x: 750, y: 420, size: 44, align: 'c', cls: 'sans' });
    const why = K.el('div', 'lbl c', p, { left: 750, top: 500 }, '예시의 줄거리를 따라 하지 않도록');
    gsap.set([fr, seal], { autoAlpha: 0 });
    K.inn(fr, S('b11'), 0.5, 10); K.write(frL, S('b11') + 0.1, 0.6);
    tl.fromTo(seal, { autoAlpha: 0, scale: 2.2, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'power4.in', immediateRender: true }, A('b11', '트리트먼트를') - 0.2);
    K.sfx('seal', A('b11', '트리트먼트를') + 0.25);
    K.write(lk, A('b11', '다 쓴 뒤에만') - 0.2, 0.9); K.inn(why, A('b11', '따라 하지 않게'), 0.6, 6);
  }

  // 4 · directing guide: the order of judging; the story rule; sound; camera; six things, four must differ
  {
    const p = P(3);
    const ORD = [['소리', 120, 210, 120], ['리듬', 96, 520, 170], ['카메라', 80, 830, 220], ['연출', 66, 1140, 262]];
    const oEls = [];
    ORD.forEach(([w, size, x, y], k) => {
      const at = k === 0 ? A('b12', '가장 먼저 소리') + 0.3 : A('b12', k === 1 ? '리듬' : k === 2 ? '카메라' : '감정의 흐름');
      const n = K.el('div', 'lbl', p, { left: x - 40, top: y - 6, fontSize: 30 }, String(k + 1));
      const e = K.etch(p, w, { x, y, size });
      K.inn(n, at - 0.1, 0.4, 6); K.write(e, at - 0.15, 0.6); K.sfx('chime', at, 0.5 - k * 0.08); oEls.push(n, e);
    });
    const jd = K.etch(p, '잘 만들어졌는지 따지는 순서', { x: 110, y: 56, size: 42, cls: 'sans' });
    K.write(jd, A('b12', '무엇을 먼저 볼지') - 0.2, 0.8); oEls.push(jd);
    const st = K.etch(p, '보기 좋은 그림은 출발점일 뿐', { x: 750, y: 470, size: 46, align: 'c', cls: 'sans' });
    K.inn(st, A('b12', '보기 좋은 그림은'), 0.6, 8); K.lit(st, A('b12', '출발점'), 0.6); oEls.push(st);
    tl.fromTo(oEls, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b13') + 0.3);
    // story
    const s3 = K.etch(p, '구조 후보 셋 → 하나', { x: 750, y: 70, size: 44, align: 'c', cls: 'sans' });
    K.inn(s3, A('b13', '구조 후보를'), 0.6, 8); K.lit(s3, A('b13', '하나를 골라서'), 0.5);
    const TRI = [['주인공 하나', 330], ['목표 하나', 750], ['꺾임 하나', 1170]];
    const tEls = [s3];
    TRI.forEach(([w, x], k) => { const e = K.etch(p, w, { x, y: 200, size: 64, align: 'c' }); K.write(e, A('b13', ['주인공 하나', '목표 하나', '꺾이는 지점'][k]) - 0.2, 0.7); tEls.push(e); });
    const h3 = K.etch(p, '처음 3초 — 눈길을 붙잡기', { x: 420, y: 380, size: 40, align: 'c', cls: 'sans' });
    const bk = K.etch(p, '끝 — 처음을 되비추기', { x: 1080, y: 380, size: 40, align: 'c', cls: 'sans' });
    K.inn(h3, A('b13', '처음 3초'), 0.5, 8); K.lit(h3, A('b13', '눈길을'), 0.5);
    K.inn(bk, A('b13', '끝에서는'), 0.5, 8); K.lit(bk, A('b13', '되비추라고'), 0.5); tEls.push(h3, bk);
    tl.fromTo(tEls, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b14') - 0.1);
    // sound: a waveform with two silences before the turn
    const sv = K.svg(p);
    let d = 'M 120 330';
    for (let x = 120; x <= 1380; x += 6) {
      const quiet = (x > 700 && x < 780) || (x > 1000 && x < 1090);
      const amp = quiet ? 1.5 : 40 + 34 * Math.sin(x * 0.031) * Math.sin(x * 0.007 + 1);
      d += ` L ${x} ${(330 + (((x / 6) % 2) ? -1 : 1) * Math.abs(amp)).toFixed(1)}`;
    }
    K.thread(sv, d, A('b14', '소리는'), 1.6, { w: 2.2 });
    const ac = K.etch(p, '보이는 동작마다 맞는 소리', { x: 750, y: 90, size: 46, align: 'c', cls: 'sans' });
    K.inn(ac, A('b14', '보이는 동작마다'), 0.5, 8); K.lit(ac, A('b14', '맞는 소리를'), 0.5);
    const g1 = K.el('div', 'lbl c', p, { left: 740, top: 420 }, '정적'), g2 = K.el('div', 'lbl c', p, { left: 1045, top: 420 }, '정적');
    const tn = K.etch(p, '→ 꺾이는 지점', { x: 1180, y: 250, size: 34, cls: 'sans v' });
    K.inn(g1, A('b14', '정적을') - 0.2, 0.5, 6); K.inn(g2, A('b14', '두 번') - 0.1, 0.5, 6); K.inn(tn, A('b14', '이야기가 꺾이는'), 0.5, 6); K.lit(tn, A('b14', '감정이'), 0.5);
    tl.fromTo([sv, ac, g1, g2, tn], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('b15') - 0.1);
    // camera: four moves
    const MV = [['밀기', '→', 300], ['따라가기', '↔', 600], ['올라가기', '↗', 900], ['내려앉기', '↘', 1200]];
    const mEls = [];
    MV.forEach(([w, g, x], k) => {
      const at = S('b15') + 0.3 + k * 0.45;
      const ge = K.etch(p, g, { x, y: 150, size: 110, align: 'c', cls: 'sans' }), we = K.etch(p, w, { x, y: 300, size: 44, align: 'c' });
      K.inn(ge, at, 0.4, 10); K.lit(ge, at + 0.1, 0.4); K.write(we, at, 0.5); K.sfx('whoosh', at, 0.25); mEls.push(ge, we);
    });
    const r4 = K.etch(p, '네 가지 이상 · 모든 샷에 이유', { x: 750, y: 450, size: 44, align: 'c', cls: 'sans' });
    K.inn(r4, A('b15', '모든 샷에'), 0.5, 8); K.lit(r4, A('b15', '이유가'), 0.5); mEls.push(r4);
    tl.fromTo(mEls, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('b16') - 0.1);
    // six things, at least four different from the example film
    const SIX = [['이야기 구조', '이야기 구조'], ['첫 장면', '첫 장면'], ['대표 장면', '대표 장면'], ['카메라 경로', '카메라가'], ['음악의 흐름', '음악의 흐름'], ['결말', '결말']];
    SIX.forEach(([w, ph], k) => {
      const x = 300 + (k % 3) * 450, y = k < 3 ? 120 : 270;
      const e = K.etch(p, w, { x, y, size: 54, align: 'c', cls: k < 4 ? 'v' : '' });
      K.write(e, A('b16', ph) - 0.15, 0.6, false);
      if (k < 4) K.lit(e, A('b16', '넷 이상') + k * 0.2, 0.5);
    });
    const f4 = K.etch(p, '여섯 가운데 넷 이상 — 예시 영상과 다르게', { x: 750, y: 450, size: 44, align: 'c', cls: 'sans v' });
    K.inn(f4, A('b16', '넷 이상'), 0.5, 8); K.lit(f4, A('b16', '예시 영상과'), 0.5);
  }

  // 5 · technique guide: the picture is a function of time; one timetable moves everything
  {
    const p = P(4);
    const web = K.etch(p, '영상 = 웹 페이지 · 브라우저가 코드로 그린다', { x: 110, y: 56, size: 42, cls: 'sans' });
    K.write(web, A('b18', '웹 페이지로') - 0.2, 0.8);
    const fx = K.etch(p, '화면 = f (시간)', { x: 110, y: 150, size: 96 });
    K.write(fx, A('b18', '시간의 함수') - 0.4, 1.0); K.sfx('etch', A('b18', '시간의 함수'));
    // the film itself, drawn at the same moment twice
    const at1 = A('b18', '몇 초 지점을'), at2 = A('b18', '몇 번을 다시');
    const WT = { x: 1040, y: 330, s: 0.28, o: 1, bz: 1, ov: 0 };
    K.film.key(at1 - 0.4, { ...WT, o: 0 }).key(at1, WT).key(A('b18', '한 장씩') - 0.3, WT).key(A('b18', '한 장씩') + 0.3, { ...WT, o: 0 });
    K.film.hold(at1 - 0.4, A('b18', '한 장씩') + 0.4, 47.6);
    const tl1 = K.etch(p, 't = 47.6초', { x: 120, y: 330, size: 56, cls: 'mono' });
    const same = K.etch(p, '다시 그려도 → 같은 그림', { x: 120, y: 420, size: 48, cls: 'sans' });
    K.write(tl1, at1, 0.6); K.write(same, at2, 0.9);
    tl.fromTo([fx, tl1, same, web], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, A('b18', '한 장씩'));
    const strip = K.el('div', null, p, { left: 160, top: 250, width: 1180, height: 170 });
    gsap.set(strip, { autoAlpha: 0 }); tl.fromTo(strip, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: true }, A('b18', '한 장씩') + 0.1);
    for (let k = 0; k < 7; k++) {
      const c = K.el('div', 'mini', strip, { left: k * 168, top: 0, width: 150, height: 92, background: '#0b0d18' });
      K.el('div', 'lbl', strip, { left: k * 168 + 8, top: 108, fontSize: 18 }, `${(47.6 + k / 30).toFixed(3)}초`);
      tl.fromTo(c, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, immediateRender: true }, A('b18', '한 장씩') + 0.2 + k * 0.18);
      K.sfx('tick', A('b18', '한 장씩') + 0.2 + k * 0.18, 0.35);
    }
    const mp4 = K.etch(p, '→ 영상 파일', { x: 750, y: 470, size: 48, align: 'c', cls: 'sans' });
    K.inn(mp4, A('b18', '영상 파일로'), 0.5, 8); K.lit(mp4, A('b18', '묶을 수'), 0.5);
    tl.fromTo([strip, mp4], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b19') - 0.1);
    // one timetable
    const tt = K.etch(p, '시간표 하나', { x: 120, y: 60, size: 58 });
    K.write(tt, A('b19', '시간표가 하나'), 0.8);
    const sv = K.svg(p);
    K.thread(sv, 'M 120 200 L 1380 200', A('b19', '시간표가 하나') + 0.4, 1.0, { w: 4 });
    const TR = [['그림', '그림과'], ['목소리', '목소리와'], ['음악', '음악과'], ['효과음', '효과음과'], ['자막', '자막을']];
    TR.forEach(([w, ph], k) => {
      const y = 260 + k * 58, at = A('b19', ph);
      const lab = K.etch(p, w, { x: 120, y: y - 22, size: 34, cls: 'sans' });
      K.thread(sv, `M 300 200 C 330 ${y}, 360 ${y}, 420 ${y} L ${1380 - k * 60} ${y}`, at - 0.1, 0.9, { w: 2.2, color: ['#ffcf8a', '#ffe9c4', '#c9b0ff', '#9fe6db', '#f2f2f2'][k] });
      K.write(lab, at - 0.15, 0.5);
    });
    const asr = K.etch(p, '음성 인식으로 대본과 대조 ✓', { x: 1380, y: 400, size: 34, align: 'r', cls: 'sans t' });
    const lu = K.etch(p, '기준 음량에 맞춤', { x: 1380, y: 460, size: 34, align: 'r', cls: 'sans' });
    K.inn(asr, A('b19', '음성 인식으로'), 0.5, 6); K.lit(asr, A('b19', '맞는지 확인'), 0.5);
    K.inn(lu, A('b19', '기준 음량'), 0.5, 6); K.lit(lu, A('b19', '기준 음량') + 0.3, 0.5);
  }

  // 6 · style guide: the opening description; the rules of the picture; the camera table (the film itself)
  {
    const p = P(5);
    const q1 = K.etch(p, '납작한 픽셀 인물이, 조명과 안개가 있는', { x: 750, y: 90, size: 50, align: 'c' });
    const q2 = K.etch(p, '입체 미니어처 세트 안에 종이 인형처럼 서 있다.', { x: 750, y: 160, size: 50, align: 'c' });
    const q3 = K.etch(p, '그 세계의 주인공은 빛이다.', { x: 750, y: 300, size: 92, align: 'c' });
    K.write(q1, S('b21') - 0.1, 1.6); K.write(q2, A('b21', '입체 미니어처') - 0.3, 1.6); K.write(q3, A('b21', '그 세계의') - 0.2, 1.3);
    K.sfx('etch', A('b21', '그 세계의'), 1.1);
    tl.fromTo([q1, q2, q3], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b22') - 0.1);
    // stepped figure vs gliding light
    const fig = K.el('div', null, p, { left: 160, top: 160, width: 28, height: 44, background: 'linear-gradient(180deg, #f1d2b4 0 30%, #3cc8b6 30% 100%)', imageRendering: 'pixelated', boxShadow: '0 0 0 3px #1a1426' });
    const glow = K.el('div', null, p, { left: 160, top: 290, width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle, #fff1cf, #ffb35a 45%, rgba(255,150,60,0) 72%)' });
    gsap.set([fig, glow], { autoAlpha: 0 });
    const fL = K.etch(p, '인물은 툭툭 끊기듯', { x: 660, y: 150, size: 42, cls: 'sans' });
    const gL = K.etch(p, '카메라와 빛은 부드럽게', { x: 660, y: 282, size: 42, cls: 'sans' });
    const a22 = A('b22', '툭툭'), b22 = A('b22', '부드럽게');
    K.inn(fig, a22 - 0.3, 0.3, 0); K.inn(glow, b22 - 0.3, 0.3, 0);
    K.write(fL, a22 - 0.2, 0.6); K.write(gL, b22 - 0.2, 0.6);
    onFrame((t) => {
      if (t < a22 - 0.5 || t > S('b23') + 1) return;
      const u = Math.max(0, t - a22), v = Math.max(0, t - b22);
      fig.style.transform = `translateX(${Math.floor(u * 6) * 22 % 440}px)`;                       // steps at 6 fps
      glow.style.transform = `translateX(${(Math.sin(v * 1.3) * 0.5 + 0.5) * 420}px)`;            // glides every frame
    });
    const cold = K.el('div', null, p, { left: 110, top: 400, width: 560, height: 180, borderRadius: 12, background: 'radial-gradient(80% 90% at 50% 50%, rgba(70,110,220,.45), rgba(40,70,160,.12) 70%, rgba(40,70,160,0))' });
    const dots = [0, 1, 2].map((k) => K.el('div', null, cold, { left: 120 + k * 150, top: 70, width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle, #fff1cf, #ffb35a 45%, rgba(255,150,60,0) 72%)' }));
    gsap.set([cold, ...dots], { autoAlpha: 0 });
    K.inn(cold, A('b22', '넓은 공간은'), 0.6, 0);
    dots.forEach((d2, k) => K.inn(d2, A('b22', '작은 불빛은') + k * 0.15, 0.4, 0));
    const tL = K.etch(p, '넓은 공간은 차갑게, 작은 불빛은 따뜻하게', { x: 700, y: 430, size: 38, cls: 'sans' });
    K.write(tL, A('b22', '넓은 공간은'), 0.9);
    const sw = K.el('div', null, p, { left: 700, top: 520, width: 54, height: 54, borderRadius: 8, background: '#3cc8b6', boxShadow: '0 0 24px rgba(60,200,182,.8)' });
    gsap.set(sw, { autoAlpha: 0 });
    const swL = K.etch(p, '주인공에게만, 어디에도 없는 색 하나', { x: 780, y: 520, size: 38, cls: 'sans t' });
    K.inn(sw, A('b22', '주인공에게는'), 0.5, 0); K.write(swL, A('b22', '색 한 가지') - 0.3, 0.8);
    tl.fromTo([fig, glow, fL, gL, cold, tL, sw, swL], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('b23') - 0.1);
    // the camera table, shown with the film's own shots
    const hd = K.etch(p, '언제나 위에서 내려다본다', { x: 110, y: 70, size: 48 });
    K.write(hd, A('b23', '위에서 내려다'), 0.9);
    const CAMS = [['멀리서 천천히 다가가기', 81.6, A('b23', '아주 먼 곳에서')], ['인물 옆을 따라가기', 22.6, A('b23', '인물 옆을')], ['무릎 꿇는 인물에게 낮게 내려앉기', 101.0, A('b23', '무릎 꿇는')]];
    const WC = { x: 900, y: 300, s: 0.36, o: 1, bz: 1, ov: 0 };
    K.film.key(CAMS[0][2] - 0.5, { ...WC, o: 0 }).key(CAMS[0][2], WC).key(E('b23') - 0.1, WC).key(E('b23') + 0.4, { ...WC, o: 0 });
    CAMS.forEach(([w, f0, at], k) => {
      const nxt = k < 2 ? CAMS[k + 1][2] - 0.05 : E('b23') + 0.5;
      K.film.play(at - 0.5, nxt, f0);
      const e = K.etch(p, w, { x: 110, y: 200 + k * 90, size: 34, cls: 'sans' });
      K.write(e, at - 0.2, 0.7);
      if (k < 2) K.dim(e, nxt, 0.4);
      K.sfx('whoosh', at - 0.1, 0.3);
    });
    const tb = K.el('div', 'lbl', p, { left: 110, top: 520, fontSize: 24 }, '움직임과 그 뜻이 표로 정리되어 있다');
    K.inn(tb, A('b23', '표로 정리'), 0.6, 6);
  }

  // 7 · the example film's notes: sealed until the treatment is written
  {
    const p = P(6);
    for (let r = 0; r < 7; r++) K.el('div', 'fauxline', p, { left: 300, top: 180 + r * 40, width: [900, 820, 860, 700, 880, 760, 600][r] });
    const seal = K.el('div', 'seal', p, { left: 690, top: 250 });
    const hd = K.etch(p, '예시 영상을 만든 코드의 설명', { x: 750, y: 70, size: 48, align: 'c' });
    K.write(hd, A('b24', '예시 영상을 만든') - 0.2, 0.9);
    const lk = K.etch(p, '트리트먼트를 다 쓴 뒤에야 열린다', { x: 750, y: 500, size: 42, align: 'c', cls: 'sans' });
    K.write(lk, A('b24', '트리트먼트를') - 0.2, 0.9);
    tl.fromTo(seal, { autoAlpha: 1, scale: 1, rotation: 0 }, { autoAlpha: 0, scale: 1.6, rotation: 25, duration: 0.5, ease: 'power2.out', immediateRender: false }, A('b24', '열어 볼 수') - 0.1);
    K.sfx('seal', A('b24', '열어 볼 수') - 0.1, 0.8);
    p.querySelectorAll('.fauxline').forEach((l, k) => { const li = K.el('div', 'lit', l); tl.fromTo(li, { opacity: 0 }, { opacity: 0.85, duration: 0.4, immediateRender: false }, A('b24', '열어 볼 수') + 0.2 + k * 0.08); });
  }

  // the stack again, all seven lit (closing the chapter, c01)
  plates.forEach(({ p }, i) => tl.fromTo(p.querySelector('.warm'), { opacity: 0.8 }, { opacity: 1, duration: 0.4, immediateRender: false }, S('c01') + 0.4 + (6 - i) * 0.12));
  K.beam.key(S('c01'), { v: 1 }).key(S('c01') + 2, { v: 1.25 });
  K.sfx('shimmer', S('c01') + 0.4, 0.8);
  tl.fromTo(stack, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, immediateRender: false }, end);
};
