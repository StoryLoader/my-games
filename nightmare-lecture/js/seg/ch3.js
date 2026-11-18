/* ch3.js — c02–c20: which scene did each rule become?
 * The projection window holds the film again, silent, at the moments the narration names; the rules are engraved
 * beside it. Story choices on glass slides, the example's overlap struck through, the hand lantern as a gauge,
 * the palette as glowing chips, the four camera moves, the film's real sound as a waveform, the voice check. */
SEG.ch3 = (ctx, K) => {
  const { tl, scene, onFrame } = ctx;
  const { S, E, A } = K;
  const t0 = S('c02') - 0.4, end = S('d01');
  const sc = K.el('section', 'scene', K.$('world')); sc.id = 's-ch3';
  const top = K.el('section', 'scene', K.$('top')); top.id = 's-ch3-top';
  scene(sc, t0, end + 0.6); scene(top, t0, end + 0.6);
  K.card(top, { at: S('c02') - 0.3, out: S('c03') - 0.4, num: '제 3 장', q: '규칙은 어느 장면이 되었을까?', key: '장면' });
  K.beam.key(S('c03'), { v: 1.0 });
  const fade = (els, at, d = 0.5) => tl.fromTo(els, { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, at);

  // c03–c04 — one round of questions; three story candidates, the third chosen
  const qhd = K.el('div', 'lbl c', sc, { left: 960, top: 170 }, '클로드의 질문 · 한 번에 모아서');
  K.inn(qhd, A('c03', '한 번에 모아서'), 0.6, 6);
  const QS = [['어떤 이야기로?', 520, '어떤 이야기로'], ['목소리는?', 960, '목소리와'], ['음악은?', 1400, '음악은']];
  const qEls = QS.map(([w, x, ph]) => { const e = K.etch(sc, w, { x, y: 240, size: 58, align: 'c' }); K.write(e, A('c03', ph) - 0.2, 0.7); K.sfx('chime', A('c03', ph), 0.4); return e; });
  const STORIES = ['악몽에서 깨어나기', '악몽을 가져오는 존재', '악몽을 지키는 파수꾼'];
  const sEls = STORIES.map((w, k) => {
    const p = K.plate(sc, { x: 230 + k * 500, y: 450, w: 460, h: 190 });
    const e = K.etch(p, w, { x: 230, y: 64, size: 40, align: 'c' });
    K.inn(p, A('c04', '세 가지 후보를') + k * 0.25, 0.6, 30); K.write(e, A('c04', '세 가지 후보를') + 0.2 + k * 0.25, 0.7, false);
    K.sfx('clink', A('c04', '세 가지 후보를') + k * 0.25, 0.6);
    if (k === 2) { K.lit(e, A('c04', '악몽을 지키는'), 0.5); K.warm(p, A('c04', '악몽을 지키는'), 1, 0.6); }
    else tl.fromTo(p, { autoAlpha: 1 }, { autoAlpha: 0.35, duration: 0.5, immediateRender: false }, A('c04', '악몽을 지키는'));
    return p;
  });
  const mine = K.el('div', 'lbl c', sc, { left: 1460, top: 668 }, '저의 선택');
  K.inn(mine, A('c04', '골랐습니다') - 0.3, 0.5, 6);
  fade([qhd, ...qEls, ...sEls, mine], S('c05') - 0.1);

  // c05–c06 — the treatment: three structures, one chosen; the story rule mapped onto it
  const thd = K.etch(sc, '트리트먼트 · 구조 후보 셋', { x: 960, y: 150, size: 46, align: 'c', cls: 'sans' });
  K.inn(thd, A('c05', '트리트먼트를'), 0.6, 8); K.lit(thd, A('c05', '구조 후보를'), 0.5);
  const STR = [['하룻밤 순찰', '한 번의 여정'], ['깨진 등불, 그 전과 후', '사건과 수습'], ['마지막 악몽은 파수꾼의 것', '반전 하나']];
  const stEls = STR.map(([w, sub], k) => {
    const p = K.plate(sc, { x: 230 + k * 500, y: 260, w: 460, h: 190 });
    const e = K.etch(p, w, { x: 230, y: 46, size: k === 2 ? 36 : 40, align: 'c', cls: k === 2 ? 'v' : '' });
    const s2 = K.el('div', 'lbl c', p, { left: 230, top: 120, fontSize: 22 }, sub);
    K.inn(p, A('c05', '세 가지 써 보고') + k * 0.3, 0.6, 30); K.write(e, A('c05', '세 가지 써 보고') + 0.2 + k * 0.3, 0.7, false);
    if (k === 2) { K.lit(e, A('c05', '그중 하나를'), 0.5); K.warm(p, A('c05', '그중 하나를'), 1, 0.6); }
    else tl.fromTo(p, { autoAlpha: 1 }, { autoAlpha: 0.3, duration: 0.5, immediateRender: false }, A('c05', '그중 하나를'));
    return p;
  });
  const MAP = [['주인공 하나', '노을', '주인공 하나'], ['목표 하나', '흩어진 악몽을 되찾기', '목표 하나'], ['꺾임 하나', '마지막 악몽은 자기 것', '꺾이는 지점']];
  const mEls = [];
  MAP.forEach(([r, v, ph], k) => {
    const y = 560 + k * 80;
    const re = K.el('div', 'lbl', sc, { left: 520, top: y + 10 }, r);
    const ve = K.etch(sc, v, { x: 820, y, size: 46 });
    K.inn(re, A('c06', ph) - 0.2, 0.4, 6); K.write(ve, A('c06', ph), 0.7); mEls.push(re, ve);
  });
  const rv = K.etch(sc, '반전', { x: 1460, y: 480, size: 40, align: 'c', cls: 'v' });
  K.inn(rv, A('c06', '반전 하나를'), 0.5, 8); K.lit(rv, A('c06', '반전 하나를') + 0.2, 0.5); mEls.push(rv);
  fade([thd, ...stEls, ...mEls], S('c07') - 0.1);

  // c07–c08 — the example film overlapped: struck, then changed
  const pd = K.plate(sc, { x: 170, y: 190, w: 700, h: 600, name: '예시 영상' });
  const po = K.plate(sc, { x: 1050, y: 190, w: 700, h: 600, name: '이번 영상' });
  K.inn(pd, A('c07', '예시 영상의 노트') - 0.2, 0.7, 30); K.inn(po, A('c07', '예시 영상의 노트'), 0.7, 30);
  K.sfx('lift', A('c07', '예시 영상의 노트'));
  const ROWS = [
    ['늙은 등대지기', '늙은 파수꾼', '늙은 등대지기', null, null],
    ['어린 손녀', '아이 → 소년', '어린 손녀', A('c08', '소년으로'), null],
    ['폭풍 속 위기', '맑은 달밤, 안에서 깨지는 등불', '폭풍 속에서', A('c08', '맑은 달밤에'), null],
    ['등불을 옮긴다', '등불이 악몽을 거둔다', '등불을 옮기는', A('c08', '안에서부터'), null],
    ['첫 장면 · 항구', '첫 장면 · 내려다본 지도', '이야기였거든요', A('c08', '첫 장면도'), null],
  ];
  ROWS.forEach(([d, o, ph, changeAt], k) => {
    const y = 70 + k * 104;
    const de = K.etch(pd, d, { x: 350, y, size: 40, align: 'c' });
    K.write(de, A('c07', ph) - 0.3 + (k > 3 ? 0.6 : 0), 0.6, false);
    const oe = K.etch(po, o, { x: 350, y, size: k === 2 ? 34 : 40, align: 'c', cls: changeAt ? 'v' : '' });
    K.write(oe, A('c07', '겹치는 데가') + k * 0.25, 0.6, false);
    if (k < 4) { K.lit(de, A('c07', '이번 이야기와') + k * 0.15, 0.4); if (!changeAt) K.lit(oe, A('c07', '이번 이야기와') + k * 0.15, 0.4); }
    if (changeAt) {
      K.lit(oe, changeAt, 0.6);
      const strike = K.el('div', null, pd, { left: 120, top: y + 26, width: 460, height: 3, background: '#ff9a7a', boxShadow: '0 0 8px rgba(255,120,90,.8)', transformOrigin: '0 50%' });
      tl.fromTo(strike, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out', immediateRender: true }, changeAt - 0.2);
      K.sfx('scratch', changeAt - 0.2, 0.5);
    }
  });
  const rule = K.el('div', 'lbl c', sc, { left: 960, top: 840 }, '여섯 가지 중 넷 이상 다르게');
  K.inn(rule, A('c08', '넷 이상'), 0.6, 6);
  fade([pd, po, rule], S('c09') - 0.1);

  // c09 — where did this story's own scenes come from? the style guide's suggestions
  const q9 = K.etch(sc, '이 이야기만의 장면은 어디서 왔을까', { x: 960, y: 330, size: 64, align: 'c' });
  K.write(q9, S('c09') + 0.1, 1.2);
  const s9 = K.el('div', 'lbl c', sc, { left: 960, top: 450 }, '스타일 지침서 · 이 스타일만 할 수 있는 연출 제안');
  K.inn(s9, A('c09', '스타일 지침서에는'), 0.6, 6);
  const two = K.etch(sc, '그중 둘 → 이야기의 뼈대', { x: 960, y: 530, size: 48, align: 'c', cls: 'sans' });
  K.inn(two, A('c09', '그중 둘이'), 0.5, 8); K.lit(two, A('c09', '뼈대가'), 0.5);
  fade([q9, s9, two], S('c10') - 0.1);

  // the window, on the right, for the film's own scenes
  const WR = { x: 770, y: 150, s: 0.55, o: 1, bz: 1, ov: 0 };    // 1056 × 594
  K.film.key(S('c10') - 0.3, { ...WR, o: 0 }).key(S('c10') + 0.4, WR).key(E('c13') + 0.2, WR);
  K.sfx('hum', S('c10'), 0.5);
  // c10 — the hand lantern as a gauge
  const fA = S('c10') + 0.2, f0 = 63.6, kneelAt = A('c10', '무릎을 꿇는') - 0.3;
  K.film.play(fA, kneelAt, f0);
  K.film.play(kneelAt, S('c11') - 0.1, 101.2);
  const g1 = K.etch(top, '들고 다니는 불빛 = 게이지', { x: 110, y: 170, size: 44 });
  K.write(g1, S('c10') + 0.1, 0.9);
  const tube = K.el('div', null, top, { left: 300, top: 300, width: 90, height: 380, borderRadius: 45, background: 'rgba(180,200,255,.06)', boxShadow: 'inset 0 0 0 2px rgba(214,228,255,.3)' });
  const fill = K.el('div', null, tube, { left: 10, bottom: 10, width: 70, height: 360, borderRadius: 35, background: 'linear-gradient(0deg, #c96a1c, #ffb35a 60%, #ffe2ad)', boxShadow: '0 0 30px rgba(255,170,80,.7)', transformOrigin: '50% 100%' });
  fill.style.top = 'auto';
  const lvl = K.el('div', 'lbl', top, { left: 420, top: 470, fontSize: 26 }, '손등불');
  gsap.set([tube, lvl], { autoAlpha: 0 });
  K.inn(tube, A('c10', '작은 손등불은') - 0.3, 0.5, 0); K.inn(lvl, A('c10', '작은 손등불은'), 0.5, 6);
  const STOPS = [65.6, 71.4, 77.0].map((f) => fA + (f - f0)), LV = [1, 0.82, 0.64, 0.46];
  onFrame((t) => {
    if (t < S('c10') - 0.5 || t > S('c11') + 0.5) return;
    let v = LV[0];
    STOPS.forEach((st, k) => { if (t > st) v = LV[k + 1]; });
    if (t > kneelAt) v = Math.max(0.08, 0.46 - (t - kneelAt) * 0.35);
    fill.style.transform = `scaleY(${v.toFixed(3)})`;
    fill.style.opacity = 0.4 + 0.6 * v;
  });
  STOPS.forEach((st) => K.sfx('gutter', st, 0.4));
  const dimL = K.el('div', 'lbl', top, { left: 420, top: 330, fontSize: 24 }, '악몽을 거둘 때마다 흐려짐');
  const outL = K.el('div', 'lbl', top, { left: 420, top: 620, fontSize: 24 }, '무릎 꿇는 순간 · 거의 꺼짐');
  K.inn(dimL, A('c10', '조금씩 흐려지고'), 0.5, 6); K.inn(outL, A('c10', '거의 꺼집니다') - 0.3, 0.5, 6);
  fade([g1, tube, lvl, dimL, outL], S('c11') - 0.1);
  // c11 — lights one by one, turned around: amber windows going violet on the map
  K.film.play(S('c11') - 0.1, S('c12') - 0.1, 53.6);
  const g2 = K.etch(top, '하나씩 켜지는 불빛,', { x: 110, y: 170, size: 44 });
  const g3 = K.etch(top, '뒤집어서', { x: 110, y: 236, size: 44, cls: 'v' });
  K.write(g2, S('c11') + 0.1, 0.8); K.write(g3, A('c11', '뒤집어서') - 0.2, 0.6);
  const am = K.el('div', null, top, { left: 130, top: 380, width: 110, height: 110, borderRadius: 14, background: '#ffb35a', boxShadow: '0 0 40px rgba(255,170,80,.8)' });
  const vi = K.el('div', null, top, { left: 400, top: 380, width: 110, height: 110, borderRadius: 14, background: '#a77bff', boxShadow: '0 0 40px rgba(167,123,255,.85)' });
  const ar = K.etch(top, '→', { x: 320, y: 384, size: 80, align: 'c', cls: 'sans' });
  gsap.set([am, vi], { autoAlpha: 0 });
  K.inn(am, A('c11', '호박색 창문이'), 0.5, 0); K.inn(ar, A('c11', '보랏빛으로') - 0.3, 0.4, 0); K.lit(ar, A('c11', '보랏빛으로'), 0.4); K.inn(vi, A('c11', '보랏빛으로'), 0.5, 0);
  K.sfx('bell', A('c11', '보랏빛으로'), 0.5);
  fade([g2, g3, am, vi, ar], S('c12') - 0.1);
  // c12 — the palette, as glowing chips; the film holds the patrol (cold street, amber windows, the teal cloak)
  K.film.hold(S('c12') - 0.1, S('c13') - 0.1, 26.2);
  const PAL = [['남청', '마을의 밤', '#1f2c58', '남청색 마을'], ['호박', '창문의 불빛', '#ffb35a', '호박색 창문'], ['보라', '악몽', '#a77bff', '악몽은 보랏빛'], ['청록', '노을의 망토', '#3cc8b6', '청록색이고요']];
  const pEls = [];
  PAL.forEach(([n, m, col, ph], k) => {
    const y = 190 + k * 120, at = A('c12', ph) - 0.2;
    const chip = K.el('div', null, top, { left: 130, top: y, width: 90, height: 90, borderRadius: '50%', background: col, boxShadow: `0 0 34px ${col}, inset 0 3px 8px rgba(255,255,255,.35)` });
    gsap.set(chip, { autoAlpha: 0 });
    const ne = K.etch(top, n, { x: 250, y: y + 2, size: 46, cls: k === 2 ? 'v' : k === 3 ? 't' : '' });
    const me = K.el('div', 'lbl', top, { left: 400, top: y + 22, fontSize: 24 }, m);
    tl.fromTo(chip, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: true }, at);
    K.write(ne, at + 0.1, 0.5); K.inn(me, at + 0.3, 0.5, 6); K.sfx('clink', at, 0.45); pEls.push(chip, ne, me);
  });
  const nowhere = K.el('div', 'lbl', top, { left: 130, top: 690, fontSize: 24, color: '#a6f2e7' }, '어느 장소에도 없는 색');
  K.inn(nowhere, A('c12', '어느 장소에도'), 0.5, 6); pEls.push(nowhere);
  fade(pEls, S('c13') - 0.1);
  // c13 — the clue: the moth's eye-spots in the cloak's teal
  K.film.hold(S('c13') - 0.1, S('c14') - 0.1, 88.6);
  const c1 = K.etch(top, '반전의 단서', { x: 110, y: 200, size: 56, cls: 't' });
  const c2 = K.etch(top, '거대한 나방의 눈 무늬', { x: 110, y: 320, size: 40, cls: 'sans' });
  const c3 = K.etch(top, '= 노을의 망토와 같은 청록', { x: 110, y: 380, size: 40, cls: 'sans t' });
  K.write(c1, S('c13') + 0.1, 0.7); K.write(c2, A('c13', '거대한 나방') - 0.2, 0.7); K.write(c3, A('c13', '노을의 망토와') - 0.2, 0.8);
  const tc = K.el('div', null, top, { left: 130, top: 470, width: 70, height: 70, borderRadius: '50%', background: '#3cc8b6' });
  gsap.set(tc, { autoAlpha: 0 });
  tl.fromTo(tc, { autoAlpha: 0, boxShadow: '0 0 0px rgba(60,200,182,0)' }, { autoAlpha: 1, boxShadow: '0 0 60px rgba(60,200,182,1)', duration: 0.8, immediateRender: true }, A('c13', '청록색입니다') - 0.3);
  K.sfx('bell', A('c13', '청록색입니다') - 0.2, 0.5);
  fade([c1, c2, c3, tc], S('c14') - 0.1);

  // c14–c15 — the camera follows the story: four moves, the film's own shots
  const WR2 = { x: 770, y: 200, s: 0.55, o: 1, bz: 1, ov: 0 };
  K.film.key(S('c14') - 0.2, WR).key(S('c14') + 0.6, WR2).key(E('c15') + 0.1, WR2).key(E('c15') + 0.6, { ...WR2, o: 0 });
  const k14 = K.etch(top, '카메라는 이야기의 순서를 따라', { x: 110, y: 120, size: 44 });
  K.write(k14, S('c14') + 0.2, 0.9);
  const tb = K.el('div', 'lbl', top, { left: 110, top: 196, fontSize: 24 }, '스타일 지침서의 카메라 표에서');
  K.inn(tb, A('c14', '표로 정리된'), 0.5, 6);
  const MOVES = [['똑바로 내려다보는 지도', 0.8, A('c15', '첫 장면은'), S('c14') + 0.3], ['골목을 옆으로 따라가기', 22.2, A('c15', '노을이 골목을'), null], ['무릎 꿇을 때 낮게 내려앉기', 100.9, A('c15', '반전이 밝혀진'), null], ['새벽, 높이 올라가며 멀어지기', 116.0, A('c15', '새벽의 마지막'), null]];
  const mvEls = [];
  MOVES.forEach(([w, f, at, from], k) => {
    const a = from != null ? from : at - 0.4, b = k < 3 ? MOVES[k + 1][2] - 0.4 : E('c15') + 0.6;
    K.film.play(a, b, f);
    const e = K.etch(top, w, { x: 110, y: 290 + k * 92, size: 38, cls: 'sans' });
    K.write(e, at - 0.2, 0.7); if (k < 3) K.dim(e, b, 0.4); mvEls.push(e);
    K.sfx('whoosh', at - 0.3, 0.3);
  });
  fade([k14, tb, ...mvEls], E('c15') + 0.1);

  // c16–c17 — sound: the film's real soundtrack as a waveform, the three moments where the music stops
  const wv = K.plate(sc, { x: 110, y: 560, w: 1700, h: 340, name: '영화의 소리 · 2분 7초' });
  K.inn(wv, S('c16') + 0.2, 0.8, 40);
  // the film's real loudness (js/film/env.js), drawn once into a canvas and revealed left to right
  const ENV = window.FILM_ENV || [], X = (f) => 40 + (f / 127) * 1620;
  const wc = K.el('canvas', null, wv, { left: 0, top: 0, width: 1700, height: 340 }); wc.width = 1700; wc.height = 340;
  const wg = wc.getContext('2d'), grad = wg.createLinearGradient(0, 40, 0, 300);
  grad.addColorStop(0, 'rgba(255,226,173,.25)'); grad.addColorStop(0.5, 'rgba(255,214,160,.95)'); grad.addColorStop(1, 'rgba(255,226,173,.25)');
  wg.fillStyle = grad; wg.shadowColor = 'rgba(255,170,80,.7)'; wg.shadowBlur = 8;
  ENV.forEach((v, i) => { const x = X(i / 10), h = 6 + v * 120; wg.fillRect(x - 0.6, 170 - h, 1.2, 2 * h); });
  tl.fromTo(wc, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.2, ease: 'power1.inOut', immediateRender: true }, S('c16') + 0.6);
  K.sfx('shimmer', S('c16') + 0.6, 0.4);
  const so = K.etch(top, '연출 지침서 · 소리를 가장 먼저', { x: 110, y: 160, size: 46 });
  K.write(so, A('c16', '소리를 가장 먼저') - 0.3, 0.9);
  const q3 = K.etch(top, '음악이 멈추는 순간 × 3', { x: 110, y: 250, size: 46, cls: 'v' });
  K.write(q3, A('c16', '세 번') - 0.4, 0.8);
  const WS = { x: 1260, y: 110, s: 0.3, o: 1, bz: 1, ov: 0 };
  const MOM = [[47.6, '① 등불이 깨지는 순간', A('c17', '첫째'), 46.4], [95.4, '② 나방이 오지 않을 때', A('c17', '둘째'), 93.8], [102.3, '③ 심장 소리 하나', A('c17', '셋째'), 101.2]];
  K.film.key(MOM[0][2] - 0.4, { ...WS, o: 0 }).key(MOM[0][2], WS).key(E('c17'), WS).key(E('c17') + 0.5, { ...WS, o: 0 });
  MOM.forEach(([f, w, at, ff], k) => {
    const nb = k < 2 ? MOM[k + 1][2] - 0.1 : E('c17') + 0.5;
    K.film.play(at - 0.4, nb, ff);
    const mk = K.el('div', null, wv, { left: X(f) - 2, top: 20, width: 4, height: 300, background: 'linear-gradient(180deg, rgba(200,170,255,0), #c9b0ff, rgba(200,170,255,0))', boxShadow: '0 0 14px rgba(167,123,255,.9)' });
    gsap.set(mk, { autoAlpha: 0 });
    tl.fromTo(mk, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, duration: 0.5, ease: 'power3.out', immediateRender: true }, at);
    const lab = K.etch(wv, w, { x: X(f), y: k === 1 ? -100 : -54, size: 30, align: 'c', cls: 'sans v' });
    K.write(lab, at + 0.1, 0.6); K.sfx('stop', at + 0.05, 0.5);
  });
  fade([so, q3], S('c18') - 0.1); fade(wv, S('c18') - 0.1, 0.6);

  // c18–c19 — fifteen lines checked by speech recognition; the two with 파수꾼
  const vh = K.etch(top, '내레이션과 대사 15줄 · 음성 인식으로 대조', { x: 960, y: 170, size: 46, align: 'c' });
  K.write(vh, A('c18', '열다섯 줄을') - 0.3, 1.0);
  const IDS = ['n1', 'n2', 'n3', 'n4', 'k1', 'n5', 'n6', 'k2', 'n7', 'k3', 'h1', 'n8', 'h2', 'n9', 'h3'];
  const bars = IDS.map((id, k) => {
    const x = 180 + k * 106;
    const b = K.el('div', 'slide', top, { left: x, top: 300, width: 80, height: 150 });
    const ck = K.etch(top, '✓', { x: x + 40, y: 470, size: 44, align: 'c', cls: 'sans' + (k === 3 || k === 13 ? ' v' : ' t') });
    gsap.set(b, { autoAlpha: 0 });
    const at = A('c18', '한 줄씩') - 0.6 + k * 0.12;
    K.inn(b, A('c18', '열다섯 줄을') + k * 0.05, 0.4, 20); K.inn(ck, at, 0.3, 6); K.lit(ck, at + 0.05, 0.3); K.sfx('tick', at, 0.3);
    if (k === 3 || k === 13) tl.fromTo(b, { boxShadow: '0 0 0 rgba(0,0,0,0)' }, { boxShadow: '0 0 0 3px #a77bff, 0 0 30px rgba(167,123,255,.8)', duration: 0.5, immediateRender: false }, A('c19', '내레이션 두 줄'));
    return [b, ck];
  }).flat();
  const w1 = K.etch(top, '파수꾼', { x: 700, y: 600, size: 96, align: 'c' });
  const w2 = K.etch(top, '파<i>숙</i>군', { x: 1220, y: 600, size: 96, align: 'c', cls: 'v' });
  const neq = K.etch(top, '≠', { x: 960, y: 600, size: 96, align: 'c', cls: 'sans' });
  const eqs = K.etch(top, '글자는 달라도, 소리는 같다 ✓', { x: 960, y: 760, size: 42, align: 'c', cls: 'sans t' });
  K.write(w1, A('c19', '파수꾼이라는') - 0.2, 0.6); K.write(neq, A('c19', '받침을'), 0.4); K.write(w2, A('c19', '기역 받침을') - 0.2, 0.7);
  K.write(eqs, A('c19', '대본과 같은 말') - 0.3, 0.9); K.sfx('chime', A('c19', '통과시켰습니다'), 0.5);
  fade([vh, ...bars, w1, w2, neq, eqs], S('c20') - 0.1);

  // c20 — 60 per second recommended, 30 made (no graphics card)
  const s60 = K.etch(sc, '1초에 60장', { x: 620, y: 330, size: 110, align: 'c' });
  const s30 = K.etch(sc, '30장', { x: 1360, y: 330, size: 110, align: 'c', cls: 'v' });
  const arr = K.etch(sc, '→', { x: 1060, y: 330, size: 110, align: 'c', cls: 'sans' });
  const why = K.etch(sc, '그래픽 카드 없음 · 한 장을 그리는 데 몇 초씩', { x: 960, y: 560, size: 44, align: 'c', cls: 'sans' });
  const rec = K.el('div', 'lbl c', sc, { left: 960, top: 480 }, '스타일 지침서의 권장');
  K.write(s60, A('c20', '1초에 60장') - 0.3, 0.8); K.inn(rec, A('c20', '권합니다') - 0.3, 0.5, 6);
  K.dim(s60, A('c20', '하지만'), 0.6);
  K.inn(why, A('c20', '그래픽 카드가'), 0.5, 8); K.lit(why, A('c20', '몇 초씩'), 0.5);
  K.inn(arr, A('c20', '1초에 30장') - 0.5, 0.4, 0); K.lit(arr, A('c20', '1초에 30장') - 0.4, 0.4); K.write(s30, A('c20', '1초에 30장') - 0.3, 0.7);
  fade([s60, s30, arr, why, rec], end - 0.3);
};
