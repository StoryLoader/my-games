/* close.js — d01–d05: the seven plates again, three of them named for what they did, the agent guide's order;
 * then the dive into the window for the highlight (film 109.4–122.4 s with its own sound), and the lantern going out. */
SEG.close = (ctx, K) => {
  const { tl, scene } = ctx;
  const { S, E, A } = K;
  const t0 = S('d01') - 0.4, endT = window.VIDEO_DATA.duration;
  const sc = K.el('section', 'scene', K.$('world')); sc.id = 's-close';
  const top = K.el('section', 'scene', K.$('top')); top.id = 's-close-top';
  scene(sc, t0, K.H0 + 0.2); scene(top, t0, null);
  K.cam.key(t0, { x: 960, y: 540, s: 1, b: 0 });

  // the stack, rebuilt for the summary
  const NAMES = ['스킬 파일', '설치 스크립트', '에이전트 안내문', '연출 지침서', '기술 지침서', '스타일 지침서', '예시 제작 노트'];
  const SY = (i) => 170 + i * 68;
  const stack = K.el('div', null, sc, { left: 0, top: 0, width: 1920, height: 1080 });
  const pl = NAMES.map((nm, i) => {
    const p = K.plate(stack, { x: 470, y: SY(i) - 280, w: 980, h: 560 });
    gsap.set(p, { transformPerspective: 1500, rotationX: 70 });
    const lb = K.el('div', 'lbl', stack, { left: 250, top: SY(i) - 18, fontSize: 26 }, `<b style="font-family:var(--serif);margin-right:10px">${i + 1}</b>${nm}`);
    return { p, lb };
  });
  tl.fromTo(stack, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power3.out', immediateRender: true }, t0 + 0.2);
  const q = K.etch(top, '한 문장은 어떻게 영상이 되었나', { x: 960, y: 60, size: 46, align: 'c' });
  const d1 = K.etch(top, '문서의 규칙 → 실제 장면', { x: 960, y: 60, size: 46, align: 'c' });
  K.write(d1, S('d01') + 0.3, 0.8); tl.fromTo(d1, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, A('d01', '처음 물음으로') - 0.5);
  K.inn(q, A('d01', '처음 물음으로'), 0.6, 8); K.lit(q, A('d01', '한 문장의 부탁이'), 0.6);
  // d02 — three guides, three jobs
  const JOBS = [[5, '그림의 규칙을 지키게', A('d02', '스타일 지침서는')], [3, '이야기 · 카메라 · 소리를 설계하게', A('d02', '연출 지침서는')], [4, '틀림없이 만들고 검사하게', A('d02', '기술 지침서는')]];
  JOBS.forEach(([i, w, at]) => {
    K.warm(pl[i].p, at - 0.1, 1, 0.6);
    const e = K.etch(stack, w, { x: 960, y: SY(i) - 30, size: 40, align: 'c' });
    K.write(e, at, 0.7); K.sfx('chime', at, 0.45);
  });
  const div = K.el('div', 'lbl c', top, { left: 960, top: 130, fontSize: 26 }, '일곱 겹이 역할을 나눠 맡았다');
  K.inn(div, A('d02', '역할을 나눠'), 0.6, 6);
  // d03 — the agent guide ties it in order
  K.warm(pl[2].p, A('d03', '에이전트 안내문은') - 0.1, 1, 0.6);
  tl.fromTo(div, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, S('d03') - 0.2);
  const ord = K.etch(top, '계획 먼저 → 예시는 나중에 → 검사는 마지막', { x: 960, y: 118, size: 44, align: 'c' });
  K.write(ord, A('d03', '계획을 먼저') - 0.2, 1.8); K.sfx('etch', A('d03', '계획을 먼저'));
  tl.fromTo([q, ord], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, S('d04') - 0.1);
  tl.fromTo(stack, { autoAlpha: 1 }, { autoAlpha: 0.15, duration: 0.8, immediateRender: false }, S('d04'));

  // d04 — the window wakes above the lantern; the dive into it; the highlight with the film's own sound
  const WIN = { x: 552, y: 120, s: 0.425, o: 1, bz: 1, ov: 0 };
  K.film.key(S('d04') + 0.2, { ...WIN, o: 0 }).key(S('d04') + 1.2, WIN);
  K.film.hold(S('d04') + 0.2, K.H0, K.HIN);
  const hd4 = K.etch(top, '가장 인상 깊은 장면', { x: 960, y: 612, size: 42, align: 'c' }); K.write(hd4, S('d04') + 0.5, 0.8);
  tl.fromTo(hd4, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.35, immediateRender: false }, A('d04', '소년 하루가') - 0.45);
  const lt = K.etch(top, '소년 하루가 노을의 손등불을 받아 드는 순간', { x: 960, y: 612, size: 42, align: 'c' });
  K.inn(lt, A('d04', '소년 하루가') - 0.2, 0.6, 8); K.lit(lt, A('d04', '받아 드는'), 0.6);
  const d0 = Math.max(E('d04') - 0.9, A('d04', '순간입니다'));
  tl.fromTo(lt, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, d0);
  K.film.key(d0, WIN).key(K.H0, K.FULL, (x) => 1 - Math.pow(1 - x, 3));
  K.cam.key(d0, { x: 960, y: 540, s: 1, b: 0 }).key(K.H0, { x: 960, y: 300, s: 2.4, b: 8 }, (x) => x * x * x);
  K.room.key(d0, { v: 1 }).key(K.H0, { v: 0 });
  K.sfx('dive', d0);
  tl.fromTo('#flash', { opacity: 0 }, { opacity: 0.5, duration: 0.25, ease: 'power2.in', immediateRender: false }, K.H0 - 0.25);
  tl.fromTo('#flash', { opacity: 0.5 }, { opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.H0);
  K.film.play(K.H0, K.H0 + K.HDUR, K.HIN);
  const hEnd = K.H0 + K.HDUR;
  K.film.key(K.H0 + 0.01, K.FULL).key(hEnd - 0.7, K.FULL).key(hEnd, { ...K.FULL, o: 0 });

  // d05 — back at the table; thanks; the lantern goes out
  K.cam.key(hEnd - 0.7, { x: 960, y: 540, s: 1, b: 0 });
  K.room.key(hEnd - 0.7, { v: 0 }).key(hEnd + 0.2, { v: 1 });
  K.lamp.key(hEnd, { v: 1 }).key(endT - 1.6, { v: 0.85 }).key(endT - 0.2, { v: 0 });
  K.beam.key(hEnd, { v: 0.8 }).key(endT - 0.2, { v: 0 });
  K.dust.key(hEnd, { v: 1 }).key(endT - 0.2, { v: 0 });
  const th = K.etch(top, '시청해 주셔서 감사합니다', { x: 960, y: 420, size: 84, align: 'c' });
  K.write(th, S('d05') - 0.3, 1.2);
  const sub = K.el('div', 'lbl c', top, { left: 960, top: 560 }, '악몽을 지키는 파수꾼 · 코드로 만든 단편 시네마');
  K.inn(sub, S('d05') + 0.6, 0.8, 8);
  K.sfx('snuff', endT - 1.2, 0.8);
};
