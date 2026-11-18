/* ch1.js — a01–a12: what the skill is.
 * The film's last image shrinks back into the projection window (recap) → the request and the name → a skill as a bundle
 * of glass instruction sheets → the library as a wooden slide box of 99 glass slides → one slide = guide + example film
 * → 15 groups, a few named as the camera tracks along the box → the Games group: the window grows out of a slide →
 * how to ask in one sentence → the three styles marked ✦. */
SEG.ch1 = (ctx, K) => {
  const { tl, scene } = ctx;
  const { S, E, A } = K;
  const end = S('b02');
  const sc = K.el('section', 'scene', K.$('world')); sc.id = 's-ch1';
  const top = K.el('section', 'scene', K.$('top')); top.id = 's-ch1-top';
  const t0 = K.F0 + K.FILM;
  scene(sc, t0, end + 0.6); scene(top, t0, end + 0.6);

  // back from the film: the room returns, the window holds the film's last night (노을 asleep, 하루 with the lantern)
  K.room.key(t0, { v: 0 }).key(S('a01') + 0.4, { v: 1 });
  K.lamp.key(t0, { v: 0.9 }); K.beam.key(t0, { v: 0.6 }).key(S('a01') + 1, { v: 0.8 });
  K.cam.key(t0, { x: 960, y: 540, s: 1, b: 0 });
  const WIN = { x: 594, y: 70, s: 0.38, o: 1, bz: 1, ov: 0 };     // 730 × 410
  K.film.key(t0, { ...K.FULL, o: 0 }).key(t0 + 0.05, { ...WIN, o: 0 }).key(S('a01') + 0.3, WIN);
  K.film.hold(t0, S('a02') + 2, 114.8);
  const rc = K.etch(top, '늙은 파수꾼 노을, 처음으로 잠들다', { x: 960, y: 520, size: 44, align: 'c' });
  K.inn(rc, A('a01', '늙은 파수꾼'), 0.7, 12); K.lit(rc, A('a01', '처음으로 잠드는'), 0.8);
  K.out(rc, S('a02') + 0.2, 0.5);

  // a02 — the request returns on the left, a thread of light runs to the window; then the name
  const WIN2 = { x: 1130, y: 240, s: 0.3, o: 1, bz: 1, ov: 0 };
  K.film.key(S('a02'), WIN).key(S('a02') + 1.0, WIN2).key(A('a02', '그 출발점은') - 0.4, WIN2).key(A('a02', '그 출발점은') + 0.4, { ...WIN2, o: 0 });
  const rq1 = K.etch(top, '“2.5D 픽셀 아트 스타일로,', { x: 170, y: 330, size: 42, cls: 'sans' });
  const rq2 = K.etch(top, '나이트메어를 주제로, 2분짜리…”', { x: 170, y: 392, size: 42, cls: 'sans' });
  K.write(rq1, S('a02') + 0.3, 0.8); K.write(rq2, S('a02') + 0.6, 0.9);
  const sv = K.svg(top);
  K.thread(sv, 'M 760 420 C 880 470, 980 420, 1110 400', A('a02', '어떻게 이런') - 0.2, 1.2, { dash: '2 12', w: 4 });
  const qm = K.etch(top, '?', { x: 940, y: 300, size: 110, align: 'c' });
  K.inn(qm, A('a02', '어떻게 이런'), 0.6, 10); K.lit(qm, A('a02', '어떻게 이런') + 0.2, 0.5);
  tl.fromTo([rq1, rq2, qm, sv], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, A('a02', '그 출발점은') - 0.2);
  const name = K.etch(sc, '레모 오퍼스카', { x: 960, y: 330, size: 136, align: 'c' });
  const nameL = K.el('div', 'lbl c', sc, { left: 960, top: 520, fontSize: 30 }, 'LEMO-OPUSCAR · 클로드 코드 스킬');
  K.write(name, A('a02', '레모 오퍼스카') - 0.2, 1.3); K.inn(nameL, A('a02', '스킬입니다') - 0.3, 0.6, 10);
  K.sfx('etch', A('a02', '레모 오퍼스카'));
  tl.fromTo([name, nameL], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -50, duration: 0.6, ease: 'power2.in', immediateRender: false }, S('a03') - 0.1);

  // a03 — a skill: a bundle of instruction sheets; a request arrives, the bundle lights
  const bundle = K.el('div', null, sc, { left: 760, top: 300, width: 400, height: 300 });
  const sheets = [];
  for (let i = 0; i < 5; i++) {
    const p = K.plate(bundle, { x: i * 14, y: -i * 14, w: 360, h: 250 });
    p.style.transform = `rotate(${(i - 2) * 1.6}deg)`; sheets.push(p);
    for (let r = 0; r < 5; r++) K.el('div', 'fauxline', p, { left: 34, top: 60 + r * 34, width: [250, 210, 280, 180, 240][r] });
  }
  const skT = K.etch(bundle, '스킬', { x: 236, y: 30, size: 62, align: 'c' });
  K.inn(bundle, S('a03') - 0.1, 0.9, 40); K.sfx('lift', S('a03'));
  K.write(skT, S('a03') + 0.5, 0.8);
  const def = K.etch(sc, '특정한 일을 할 때 꺼내 읽는 작업 설명서 묶음', { x: 960, y: 690, size: 44, align: 'c', cls: 'sans' });
  K.inn(def, A('a03', '특정한 일을'), 0.6, 10); K.lit(def, A('a03', '작업 설명서'), 0.7);
  const ask = K.etch(sc, '부탁', { x: 330, y: 420, size: 56, align: 'c' });
  tl.fromTo(ask, { autoAlpha: 0, x: -120 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }, A('a03', '설치해 두면'));
  K.lit(ask, A('a03', '부탁이'), 0.5);
  const sv3 = K.svg(sc); K.thread(sv3, 'M 400 450 C 520 460, 640 470, 760 450', A('a03', '해당할 때'), 0.8, { w: 4 });
  sheets.forEach((p, i) => K.warm(p, A('a03', '알아서') + i * 0.08, 1, 0.8));
  K.sfx('chime', A('a03', '알아서'), 0.6);
  tl.fromTo(def, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('a04') - 0.1);
  tl.fromTo(ask, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('a04') - 0.1);
  tl.fromTo(sv3, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('a04') - 0.1);
  // the bundle steps aside: it is the bridge to the library
  tl.fromTo(bundle, { x: 0, y: 0, scale: 1 }, { x: -560, y: -60, scale: 0.55, duration: 1.0, ease: 'power3.inOut', immediateRender: false }, S('a04'));

  // a04 — the library: a wooden slide box with 99 glass slides
  const GROUPS = [
    ['그림', 5, '수채화 · 유화', '#f2b880'], ['인쇄물', 8, '판화 · 포스터', '#e86a5a'], ['전통 공예', 7, '스테인드글라스 · 그림자 인형극', '#d9a441'],
    ['필름과 테이프', 5, '무성영화 · 브라운관', '#b8b8b8'], ['장비의 화면', 8, '위성 사진 · 열화상', '#62d0c8'], ['데이터와 지도', 6, '', '#7aa7ff'],
    ['게임', 4, '', '#a77bff'], ['', 8, '', '#ffd27a'], ['', 8, '', '#9fd6ff'], ['', 8, '', '#f59fb5'], ['', 8, '', '#c9c2a8'],
    ['', 6, '', '#ff9a5a'], ['', 7, '', '#e8e0cf'], ['', 5, '', '#8ef0b0'], ['', 6, '', '#7f8cff'],
  ];
  const rack = K.el('div', null, sc, { left: 0, top: 0, width: 1920, height: 1080 });
  K.el('div', 'rackwood', rack, { left: 70, top: 790, width: 1780, height: 84 });
  const slides = []; let gi = 0;
  const X0 = 112, STEP = 16.2, GAP = 27;
  GROUPS.forEach(([, n, , col], g) => { for (let i = 0; i < n; i++) slides.push({ g, i, col, idx: slides.length }); });
  slides.forEach((s) => {
    s.ux = 135 + s.idx * 16.6;                                 // even, before the groups part
    s.gx = X0 + s.idx * STEP + s.g * GAP;                     // parted into 15 groups
    s.el = K.el('div', 'slide', rack, { left: 0, top: 640, width: 12, height: 170 });
    const tint = K.el('div', 'tint', s.el); tint.style.background = s.col; tint.style.opacity = 0.18; s.tint = tint;
    gsap.set(s.el, { x: s.ux });
  });
  K.el('div', 'rackwood', rack, { left: 70, top: 770, width: 1780, height: 40, opacity: 0.96 });
  tl.fromTo(rack, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power3.out', immediateRender: false }, A('a04', '라이브러리의 이름') - 0.3);
  slides.forEach((s) => tl.fromTo(s.el, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, A('a04', '라이브러리의 이름') + s.idx * 0.012));
  K.sfx('rattle', A('a04', '라이브러리의 이름'));
  const libL = K.el('div', 'lbl', sc, { left: 110, top: 590 }, '레모 오퍼스카 라이브러리');
  K.inn(libL, A('a04', '라이브러리의 이름'), 0.6, 8);
  const sv4 = K.svg(sc); K.thread(sv4, 'M 420 520 C 470 560, 520 590, 560 640', A('a04', '이어 주는'), 0.9, { w: 4 });
  const skL = K.el('div', 'lbl', sc, { left: 290, top: 470 }, '스킬 → 라이브러리');
  K.inn(skL, A('a04', '이어 주는'), 0.6, 8);
  const gh = K.el('div', 'lbl c', sc, { left: 1180, top: 440, fontSize: 26 }, 'github.com/lemomo-ai/lemo-opuscar');
  K.inn(gh, A('a04', '깃허브'), 0.6, 8);
  const n99 = K.etch(sc, '0', { x: 1180, y: 180, size: 220, align: 'c' });
  const n99L = K.el('div', 'lbl c', sc, { left: 1180, top: 400 }, '가지 스타일');
  K.inn(n99, A('a04', '아흔아홉') - 0.4, 0.4, 0); K.lit(n99, A('a04', '아흔아홉') - 0.2, 0.4);
  K.count(n99, 0, 99, A('a04', '아흔아홉') - 0.4, 1.4); K.inn(n99L, A('a04', '아흔아홉') + 0.6, 0.5, 8);
  K.sfx('count', A('a04', '아흔아홉') - 0.4);
  tl.fromTo([gh, libL, skL, bundle, sv4], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('a05') - 0.1);
  tl.fromTo([n99, n99L], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('a05'));

  // a05 — one slide lifted out: a guide and an example film
  const one = K.plate(sc, { x: 520, y: 150, w: 880, h: 440 });
  gsap.set(one, { transformPerspective: 1400 });
  tl.fromTo(one, { autoAlpha: 0, scale: 0.12, x: 300, y: 330, rotationX: 40 }, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotationX: 0, duration: 1.1, ease: 'power3.out', immediateRender: false }, S('a05'));
  K.sfx('lift', S('a05'));
  const lines = [];
  for (let r = 0; r < 8; r++) { const l = K.el('div', 'fauxline', one, { left: 54, top: 120 + r * 34, width: [330, 290, 350, 260, 320, 300, 340, 220][r] }); lines.push(K.el('div', 'lit', l)); }
  const gT = K.etch(one, '지침서 한 편', { x: 54, y: 40, size: 44 });
  const fr = K.el('div', 'mini', one, { left: 470, top: 120, width: 360, height: 220 });
  K.el('div', null, fr, { left: 160, top: 80, width: 0, height: 0, borderLeft: '50px solid rgba(255,220,170,.85)', borderTop: '30px solid transparent', borderBottom: '30px solid transparent' });
  const eT = K.etch(one, '예시 영상 한 편', { x: 470, y: 40, size: 44 });
  gsap.set(fr, { autoAlpha: 0 });
  K.write(gT, A('a05', '지침서 한 편') - 0.3, 0.8);
  lines.forEach((l, i) => tl.fromTo(l, { opacity: 0 }, { opacity: 0.9, duration: 0.4, immediateRender: false }, A('a05', '어떤 모습이어야') + i * 0.12));
  K.write(eT, A('a05', '예시 영상') - 0.3, 0.8); K.inn(fr, A('a05', '예시 영상'), 0.6, 10);
  tl.fromTo(one, { autoAlpha: 1, scale: 1, x: 0, y: 0 }, { autoAlpha: 0, scale: 0.1, x: 300, y: 330, duration: 0.8, ease: 'power3.in', immediateRender: false }, S('a06') - 0.2);

  // a06 — the 99 part into 15 groups
  slides.forEach((s) => tl.fromTo(s.el, { x: s.ux }, { x: s.gx, duration: 1.1, ease: 'power3.inOut', immediateRender: false }, S('a06') + 0.1));
  slides.forEach((s) => tl.fromTo(s.tint, { opacity: 0.18 }, { opacity: 0.6, duration: 0.8, immediateRender: false }, S('a06') + 0.5 + s.g * 0.04));
  K.sfx('rattle', S('a06') + 0.1, 0.7);
  const n15 = K.etch(sc, '15', { x: 960, y: 200, size: 220, align: 'c' });
  const n15L = K.el('div', 'lbl c', sc, { left: 960, top: 420 }, '갈래 · 화면이 어떻게 생겼는지에 따라');
  K.inn(n15, A('a06', '열다섯') - 0.2, 0.5, 0); K.lit(n15, A('a06', '열다섯'), 0.4); K.inn(n15L, A('a06', '열다섯') + 0.4, 0.5, 8);
  tl.fromTo([n15, n15L], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, S('a07'));

  // a07–a08 — the camera tracks along the box; each named group rises and its name is cut above it
  const gx = (g) => { const m = slides.filter((s) => s.g === g); return (m[0].gx + m[m.length - 1].gx + 12) / 2; };
  const NAMED = [
    [0, A('a07', '수채화와 유화')], [1, A('a07', '판화와 포스터')], [2, A('a07', '스테인드글라스')],
    [3, A('a08', '흑백 무성영화')], [4, A('a08', '위성 사진')], [5, A('a08', '데이터와 지도')],
  ];
  K.cam.key(S('a07'), { x: 960, y: 540, s: 1 }).key(NAMED[0][1], { x: gx(0) + 280, y: 660, s: 1.7 });
  NAMED.forEach(([g, at], i) => {
    if (i > 0) K.cam.key(at - 0.2, { x: gx(g) + (g >= 3 ? 0 : 280), y: 660, s: 1.7 });
    const m = slides.filter((s) => s.g === g);
    m.forEach((s, j) => tl.fromTo(s.el, { y: 0 }, { y: -36, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, at + j * 0.03));
    m.forEach((s) => tl.fromTo(s.tint, { opacity: 0.6 }, { opacity: 1, duration: 0.4, immediateRender: false }, at));
    const [nm, , ex] = GROUPS[g];
    const ne = K.etch(sc, nm, { x: gx(g), y: 548, size: 30, align: 'c', cls: 'sans' });
    const xe = ex ? K.etch(sc, ex, { x: gx(g), y: 506, size: 22, align: 'c', cls: 'sans' }) : null;
    K.inn(ne, at, 0.5, 8); K.lit(ne, at + 0.15, 0.5); if (xe) { K.inn(xe, at + 0.25, 0.5, 8); K.lit(xe, at + 0.4, 0.5); }
    const nxt = i + 1 < NAMED.length ? NAMED[i + 1][1] - 0.1 : A('a09', '게임 갈래') - 0.1;
    tl.fromTo(xe ? [ne, xe] : [ne], { autoAlpha: 1 }, { autoAlpha: 0.0, duration: 0.35, immediateRender: false }, nxt);
    K.sfx('clink', at, 0.7);
  });
  // a09 — the Games group: one slide becomes the window, the film plays in it (silent)
  const gG = 6, slideG = slides.filter((s) => s.g === gG)[1];
  const atG = A('a09', '게임 갈래');
  K.cam.key(atG - 0.3, { x: gx(gG), y: 660, s: 1.7 }).key(atG + 1.6, { x: 960, y: 540, s: 1 });
  slides.filter((s) => s.g === gG).forEach((s, j) => tl.fromTo(s.el, { y: 0 }, { y: -36, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, atG + j * 0.03));
  const gName = K.etch(sc, '게임', { x: gx(gG), y: 548, size: 30, align: 'c', cls: 'sans v' });
  K.inn(gName, atG, 0.5, 8); K.lit(gName, atG + 0.2, 0.5);
  tl.fromTo(slideG.el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, atG + 1.0);
  const WING = { x: 560, y: 70, s: 0.4, o: 1, bz: 1, ov: 0 };    // 768 × 432
  const sx = gx(gG) - 8;                                             // the slide's screen x once the camera is back at 1×
  K.film.key(atG + 1.0, { x: sx, y: 640, s: 0.008, o: 0, bz: 1, ov: 0 }).key(atG + 1.1, { x: sx, y: 640, s: 0.008, o: 1, bz: 1, ov: 0 }).key(atG + 2.2, WING);
  K.film.play(atG + 1.0, S('a10') + 0.5, 21.6);
  K.sfx('whoosh', atG + 1.0, 0.7);
  const gl = K.etch(top, '2.5D 픽셀 아트', { x: 960, y: 520, size: 52, align: 'c' });
  K.write(gl, atG + 1.9, 0.9);
  const g2 = K.el('div', 'lbl c', top, { left: 960, top: 588 }, '납작한 픽셀 인물 · 입체 미니어처 세트');
  K.inn(g2, A('a09', '납작한 인물') - 0.3, 0.6, 8);
  K.film.key(S('a10') - 0.2, WING).key(S('a10') + 0.5, { ...WING, o: 0 });
  tl.fromTo([gl, g2], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('a10') - 0.1);
  tl.fromTo(rack, { autoAlpha: 1 }, { autoAlpha: 0.25, duration: 0.8, immediateRender: false }, S('a10'));
  tl.fromTo(gName, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('a10'));

  // a10–a11 — how to ask: the pattern, then the example filled in
  const pl = K.plate(sc, { x: 250, y: 220, w: 1420, h: 340, name: '쓰는 법' });
  gsap.set(pl, { transformPerspective: 1400 });
  tl.fromTo(pl, { autoAlpha: 0, y: 200, rotationX: 50 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.0, ease: 'power3.out', immediateRender: false }, S('a10') + 0.2);
  K.warm(pl, S('a10') + 0.6, 1, 1); K.sfx('lift', S('a10') + 0.2);
  const pat = K.etch(pl, '“<i>스타일 이름</i>으로, <em>주제</em>를 만들어 줘.”', { x: 710, y: 60, size: 56, align: 'c' });
  K.write(pat, A('a10', '스타일 이름과'), 1.2);
  const ex1 = K.etch(pl, '“<i>수채화 스타일</i>로, <em>우리 동네 이야기</em>를', { x: 710, y: 160, size: 56, align: 'c' });
  const ex2 = K.etch(pl, '<em>45초짜리</em>로 만들어 줘.”', { x: 710, y: 236, size: 56, align: 'c' });
  K.dim(pat, A('a11', '예를 들면'), 0.6);
  K.write(ex1, A('a11', '수채화 스타일로') - 0.2, 1.3); K.write(ex2, A('a11', '45초짜리로') - 0.2, 0.9);
  K.sfx('etch', A('a11', '수채화 스타일로'));
  tl.fromTo(pl, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.6, ease: 'power2.in', immediateRender: false }, S('a12') - 0.1);

  // a12 — the three styles marked ✦
  const STAR = [['만화 컷', 'Manga Panels'], ['텍스트 플래시 컷', 'Text Flash Cuts'], ['역사 만화', 'Comic History Cartoon']];
  STAR.forEach(([ko, en], i) => {
    const x = 330 + i * 470, at = A('a12', '세 가지') + i * 0.35;
    const p = K.plate(sc, { x, y: 300, w: 380, h: 230 });
    const st = K.el('div', 'star abs', sc, { left: x + 190, top: 236, fontSize: 64, transform: 'translateX(-50%)', fontFamily: 'var(--serif)' }, `<svg viewBox='0 0 100 100' width='1em' height='1em' style='vertical-align:-0.1em'><path d='M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0 Z' fill='currentColor'/></svg>`);
    const k = K.etch(p, ko, { x: 190, y: 66, size: 44, align: 'c' });
    const e = K.el('div', 'lbl c', p, { left: 190, top: 140, fontSize: 22 }, en);
    K.inn(p, at, 0.6, 30); K.write(k, at + 0.3, 0.7); K.inn(e, at + 0.5, 0.5, 6); K.sfx('clink', at, 0.8);
    tl.fromTo(st, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)', immediateRender: false }, A('a12', '별 모양') + i * 0.15);
    K.warm(p, A('a12', '이미지 생성 도구'), 1, 0.8);
    tl.fromTo([p, st], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, immediateRender: false }, S('b01') + 0.2);
  });
  const need = K.etch(sc, '그림을 그려 줄 이미지 생성 도구가 따로 필요', { x: 960, y: 620, size: 40, align: 'c', cls: 'sans' });
  K.inn(need, A('a12', '이미지 생성 도구'), 0.6, 10); K.lit(need, A('a12', '이미지 생성 도구') + 0.3, 0.6);
  K.out(need, S('b01') + 0.2, 0.5);

  // b01 — closing the chapter: the whole box glows once and settles
  tl.fromTo(rack, { autoAlpha: 0.25 }, { autoAlpha: 1, duration: 0.9, immediateRender: false }, S('b01') + 0.4);
  slides.forEach((s) => tl.fromTo(s.tint, { opacity: 0.6 }, { opacity: 1, duration: 0.35, yoyo: true, repeat: 1, immediateRender: false }, S('b01') + 1.0 + s.idx * 0.02));
  K.sfx('shimmer', S('b01') + 1.0, 0.7);
  tl.fromTo(rack, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 60, duration: 0.8, ease: 'power2.in', immediateRender: false }, end - 0.2);
};
