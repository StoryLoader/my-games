/* open.js — op01–op03 and the whole film.
 * The lantern lights; above it the projection window wakes with the film's first seconds (silent, a teaser);
 * the one-sentence request is engraved on a glass plate in the beam, the three answers beside it; then what was made by
 * code is lit, the title is cut, and the camera dives into the window: the film fills the screen and plays whole. */
SEG.open = (ctx, K) => {
  const { tl, scene } = ctx;
  const { S, E, A } = K;
  const sc = K.el('section', 'scene', K.$('world')); sc.id = 's-open';
  const top = K.el('section', 'scene', K.$('top')); top.id = 's-open-top';
  scene(sc, 0, K.F0 + 0.2); scene(top, 0, K.F0 + 0.2);
  const t1 = S('op01'), t2 = S('op02'), t3 = S('op03');

  // the room wakes: the lantern is struck before the first word
  K.lamp.key(0, { v: 0 }).key(0.25, { v: 0 }).key(1.4, { v: 1 });
  K.beam.key(0.5, { v: 0 }).key(2.6, { v: 0.85 });
  K.dust.key(0.8, { v: 0 }).key(3.0, { v: 1 });
  K.sfx('ignite', 0.22);
  K.cam.key(0, { x: 960, y: 560, s: 1.0 }).key(t2, { x: 960, y: 540, s: 1.03 }).key(E('op03') - 1.0, { x: 960, y: 540, s: 1.05 });

  // op01 — the projection window lights with the film's opening (silent teaser)
  const WIN = { x: 552, y: 64, s: 0.425, o: 1, bz: 1, ov: 0 };   // 816 × 459
  K.film.key(0.6, { ...WIN, o: 0 }).key(1.9, WIN);
  K.film.play(0.6, t2 + 1.2, 0.6);
  K.sfx('hum', 0.9, 0.6);
  const cap = K.etch(top, '악몽을 지키는 파수꾼', { x: 960, y: 560, size: 46, align: 'c' });
  K.inn(cap, A('op01', '2분짜리') - 0.2, 0.8, 12); K.lit(cap, A('op01', '2분짜리'), 0.8);
  const len = K.el('div', 'lbl c', top, { left: 960, top: 628 }, '2분 7초 · 2.5D 픽셀 아트 단편');
  K.inn(len, A('op01', '픽셀 아트'), 0.7, 10);
  const no = K.etch(top, '한 장면도 사람이 그리지 않았다', { x: 960, y: 690, size: 40, align: 'c', cls: 'sans' });
  K.inn(no, A('op01', '아닙니다') - 0.3, 0.6, 10); K.lit(no, A('op01', '아닙니다'), 0.6);
  K.out(no, t2 - 0.1, 0.4); K.out(len, t2 - 0.1, 0.4); K.out(cap, t2 + 0.4, 0.5);

  // op02 — the window rises out of the way; the request is engraved on a plate in the beam
  const WIN2 = { x: 712, y: 36, s: 0.26, o: 0.92, bz: 1, ov: 0 };  // 499 × 281
  K.film.key(t2 + 0.2, WIN).key(t2 + 1.4, WIN2);
  const plate = K.plate(sc, { x: 250, y: 430, w: 1420, h: 300, name: '한 문장' });
  gsap.set(plate, { transformPerspective: 1400 });
  tl.fromTo(plate, { autoAlpha: 0, y: 260, rotationX: 55 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.2, ease: 'power3.out', immediateRender: false }, t2 + 0.2);
  K.warm(plate, t2 + 0.8, 1, 1.2); K.sfx('lift', t2 + 0.2);
  const who = K.el('div', 'lbl', plate, { left: 60, top: 34 }, '나 → 클로드 코드');
  K.inn(who, A('op02', '클로드 코드에게') - 0.2, 0.6, 8);
  const r1 = K.etch(plate, '“2.5D 픽셀 아트 스타일로,', { x: 60, y: 92, size: 60 });
  const r2 = K.etch(plate, '나이트메어를 주제로, 2분짜리 영상 만들어 줘.”', { x: 60, y: 176, size: 60 });
  K.write(r1, A('op02', '2.5D') - 0.1, 1.3); K.write(r2, A('op02', '나이트메어') - 0.1, 1.6);
  K.sfx('etch', A('op02', '2.5D')); K.sfx('etch', A('op02', '나이트메어'));
  // the three answers, engraved under the plate on the table edge, one by one
  const ans = [['이야기', '악몽을 지키는 파수꾼'], ['목소리', '내레이션 + 인물 대사'], ['음악', '코드로 작곡']];
  ans.forEach(([k, v], i) => {
    const x = [420, 960, 1500][i];
    const kk = K.el('div', 'lbl c', sc, { left: x, top: 772 }, k);
    const vv = K.etch(sc, v, { x, y: 812, size: 38, align: 'c', cls: 'sans' });
    const at = A('op02', '몇 가지 질문') + i * 0.55;
    K.inn(kk, at, 0.5, 10); K.inn(vv, at + 0.1, 0.6, 10); K.lit(vv, at + 0.3, 0.6); K.sfx('tick', at + 0.1, 0.7);
    K.out(kk, t3 - 0.2, 0.4); K.out(vv, t3 - 0.2, 0.4);
  });

  // op03 — what was synthesized, what was coded; the title; the dive
  tl.fromTo(plate, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.6, ease: 'power2.in', immediateRender: false }, t3 - 0.1);
  const v1 = K.etch(sc, '목소리 — 음성 합성', { x: 960, y: 420, size: 46, align: 'c', cls: 'sans' });
  K.inn(v1, A('op03', '목소리는') - 0.1, 0.6, 12); K.lit(v1, A('op03', '음성 합성'), 0.6);
  const words = ['그림', '음악', '효과음'];
  words.forEach((w, i) => {
    const e = K.etch(sc, w, { x: 700 + i * 260, y: 500, size: 74, align: 'c' });
    const at = A('op03', w === '그림' ? '그림도' : w === '음악' ? '음악도' : '효과음도');
    K.inn(e, at - 0.15, 0.5, 14); K.lit(e, at, 0.5); K.sfx('etch', at, 0.6);
    K.out(e, A('op03', '제목은') - 0.2, 0.4);
  });
  const code = K.etch(sc, '전부 코드', { x: 960, y: 610, size: 46, align: 'c', cls: 'sans' });
  K.inn(code, A('op03', '전부 코드로') - 0.1, 0.5, 10); K.lit(code, A('op03', '코드로'), 0.5);
  K.out(v1, A('op03', '제목은') - 0.2, 0.4); K.out(code, A('op03', '제목은') - 0.2, 0.4);
  const title = K.etch(sc, '악몽을 지키는 파수꾼', { x: 960, y: 450, size: 120, align: 'c' });
  K.write(title, A('op03', '제목은') + 0.2, 1.5); K.sfx('etch', A('op03', '제목은') + 0.25, 1.2);
  // the dive: the camera falls toward the window, which opens to the whole screen
  const d0 = Math.max(A('op03', '끝까지') - 0.2, E('op03') - 1.4);
  K.cam.key(d0, { x: 960, y: 540, s: 1.05, b: 0 }).key(K.F0, { x: 960, y: 200, s: 2.6, b: 8 }, (x) => x * x * x);
  tl.fromTo(title, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, immediateRender: false }, d0 + 0.2);
  K.film.key(d0, WIN2).key(K.F0, K.FULL, (x) => 1 - Math.pow(1 - x, 3));
  K.film.hold(t2 + 1.2, K.F0, t2 + 1.2);                 // the teaser's last frame holds while the window opens
  K.room.key(d0 + 0.3, { v: 1 }).key(K.F0, { v: 0 });
  K.sfx('dive', d0);
  tl.fromTo('#flash', { opacity: 0 }, { opacity: 0.55, duration: 0.25, ease: 'power2.in', immediateRender: false }, K.F0 - 0.25);
  tl.fromTo('#flash', { opacity: 0.55 }, { opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, K.F0);

  // the whole film, its own sound and subtitles
  K.film.key(K.F0 + 0.01, K.FULL).key(K.F0 + K.FILM, K.FULL);
  K.film.play(K.F0, K.F0 + K.FILM, 0.0);
  K.cam.key(K.F0 + 0.05, { x: 960, y: 540, s: 1, b: 0 });
  K.lamp.key(K.F0, { v: 1 }); K.beam.key(K.F0, { v: 0.85 }); K.dust.key(K.F0, { v: 1 });
};
