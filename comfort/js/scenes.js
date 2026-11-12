/*
 * scenes.js — 「삶에 지친 당신에게」: one room by the window (js/room.js); only time passes. The rain eases, the sprout
 * grows a little in every chapter, and morning comes through the window at the end. Words sit on the wall in a soft,
 * rounded hand; real sources, quotes and help-line numbers are set as they are.
 * Safe messaging (자살보도 권고기준 3.0, WHO): no methods, places or means; help lines at the start, middle and end.
 */
Video.define(async (ctx) => {
  const { cue, onFrame, scene, fitCanvas, data } = ctx;
  const RM = window.ROOM, { k: K, io, out, lerp, clamp } = RM;
  RM.bake();
  scene('#room', 0, data.duration + 1);
  const canvas = document.querySelector('#room canvas.world'), g = fitCanvas(canvas, 1920, 1080, 1.5);
  Video.progress(0.5);
  const S = (id) => cue(id).start, E = (id) => cue(id).end, A = (id, p, o = 0) => cue(id).about(p) + o;
  const vis = (t, a, b, fi = 0.8, fo = 0.7) => Math.min(K(t, a, a + fi), 1 - K(t, b - fo, b));

  // ---------- words on the wall ----------
  const ui = document.getElementById('ui'), texts = [];
  function txt(html, x, y, t0, t1, o = {}) {
    const el = document.createElement('div'); el.className = 't ' + (o.cls || ''); el.innerHTML = html;
    if (x === 'c') { el.style.left = '0'; el.style.right = '0'; el.style.textAlign = 'center'; } else el.style.left = x + 'px';
    el.style.top = y + 'px'; ui.appendChild(el); texts.push({ el, t0, t1 }); return el;
  }
  const mark = (no, q, id) => txt(`<div class="no">${no}</div><span class="q">${q}</span>`, 120, 96, S(id) - 0.3, S(id) + 4.2, { cls: 'mark' });
  const X = 120;

  // ---------- times ----------
  const T = {
    op1: S('op01'), op2: S('op02'), op4: S('op04'), help: S('op05'), op6: S('op06'),
    md: S('md01'), md2: S('md02'), who: S('md03'), kr: S('md04'), notYou: S('md05'), lie: S('md06'), sym: S('md07'), bridge: S('md08'),
    jk: S('pl01'), jk2: S('pl02'), jk3: S('pl03'), dem: S('pl04'), harv: S('pl05'), mp: S('pl06'), mp2: S('pl07'), mp3: S('pl08'), both: S('pl09'), notOnly: S('pl10'), nine: S('pl11'), pass: S('pl12'), q: S('pl13'),
    hp: S('hp01'), talk: S('hp02'), call: S('hp03'), teen: S('hp04'), pro: S('hp05'), treat: S('hp06'), body: S('hp07'), wait: S('hp08'), care: S('hp09'), ask: S('hp10'),
    fn: S('fn01'), real: S('fn02'), tunnel: S('fn03'), thanks: S('fn04'), last: S('fn05'), END: data.duration,
  };

  // op
  txt('<span class="hero h2">그동안 정말<br><span class="honey">애쓰셨습니다</span></span>', X, 170, T.op2 + 0.3, S('op03') + 0.1);
  txt('<span class="hero h3">아무것도 나아지지<br>않을 것 같은 날들</span>', X, 180, S('op03') + 0.7, A('op04', '혼자', -0.5));
  txt('<span class="hero h3">혼자 견디지<br>않으셨으면 해요</span>', X, 180, A('op04', '혼자', -0.3), T.help);
  txt('<span class="kick">자살예방 상담전화 · 24시간</span><br><span class="hero h1 honey num">109</span><br><span class="sub">지금 당장 위험하다면 <b>119 · 112</b></span>', X, 150, T.help + 0.3, T.op6 + 0.4);
  txt('<span class="hero h3">다그치지 않고,<br><span class="teal">조용히</span> 들려드릴게요</span>', X, 180, T.op6 + 0.6, S('op07') - 0.1);
  txt('<span class="hero h3">왜 이렇게까지<br><span class="teal">힘든지</span>부터</span>', X, 190, S('op07') + 0.2, T.md - 0.3);
  // md
  mark('하나', '왜 이렇게까지 힘들까?', 'md01');
  txt('<span class="hero h2">의지가 아니라,<br><span class="teal">병</span>입니다</span>', X, 200, T.md + 4.3, T.who - 0.3);
  txt('<span class="sub">잠 · 식욕 · 집중력 · 기운까지<br><b>몸과 뇌가 함께 겪는 병</b></span>', X, 445, T.md2 + 0.3, T.who - 0.3);
  txt('<span class="hero h1 num teal">약 2억 8천만</span><br><span class="sub">전 세계에서 우울증을 겪는 사람들</span><span class="src">출처: 세계보건기구(WHO) 우울증 자료, 2019년 추정</span>', X, 170, T.who + 0.3, T.kr);
  txt('<span class="hero h2">성인 <span class="teal">4명 중 1명</span> 이상</span><br><span class="sub">살면서 한 번은 마음의 병을 겪습니다</span><span class="src">출처: 보건복지부 · 국립정신건강센터, 2021년 국가 정신건강실태조사 (평생 유병률 27.8%)</span>', X, 180, T.kr + 0.3, T.notYou);
  txt('<span class="hero h2">당신만 이상해서가<br><span class="honey">아니에요</span></span>', X, 180, T.notYou + 0.3, T.lie);
  txt('<span class="hero h3">“앞으로도 절대<br>나아지지 않을 거야”</span>', X, 190, A('md06', '우울한', -0.2), T.sym + 0.2);
  txt('<span class="hero h2">그건 사실이 아니라,<br><span class="teal">증상</span>이에요</span>', X, 180, T.sym + 0.4, T.bridge);
  txt('<span class="hero h3">같은 어둠을<br>지나온 사람들</span>', X, 190, T.bridge + 1.2, T.jk - 0.3);
  // pl
  mark('둘', '같은 어둠을 지나온 사람들', 'pl01');
  txt('<span class="kick">작가 · 「해리 포터」</span><br><span class="hero h2">J.K. 롤링</span><br><span class="sub">1990년대 초, 홀로 딸을 키우며 겪은 깊은 우울증</span>', X, 150, T.jk + 4, T.jk2);
  txt('<span class="hero h3">“더는 살고 싶지 않다는<br>생각까지 했다”</span><span class="src">2008년 인터뷰 · 영국 선데이 타임스 보도</span>', X, 170, T.jk2 + 0.3, T.jk3);
  txt('<span class="hero h3">도움을 청했습니다</span><br><span class="sub">의사를 찾아가 <b>아홉 달</b> 동안 상담 치료</span>', X, 180, T.jk3 + 0.3, T.dem);
  txt('<span class="hero h3">소설 속 <span class="teal">디멘터</span>는<br>그때의 우울증에서 왔다</span><span class="src">롤링 본인의 인터뷰 (빅이슈 등)</span>', X, 170, T.dem + 0.4, T.harv);
  txt('<span class="en">“Rock bottom became the solid foundation<br>on which I rebuilt my life.”</span><span class="quote">“가장 밑바닥은, 내가 삶을 다시 세운<br><span class="honey">단단한 바닥</span>이 되었습니다.”</span><span class="src">J.K. 롤링, 2008년 하버드 대학교 졸업식 연설</span>', X, 150, T.harv + 0.4, T.mp);
  txt('<span class="kick">수영 선수 · 올림픽 금메달 23개</span><br><span class="hero h2">마이클 펠프스</span>', X, 170, T.mp + 0.4, T.mp2);
  txt('<span class="hero h3">2014년, 며칠 동안<br>방 밖으로 나오지 못했던 시간</span><span class="src">본인 인터뷰 · CBS, NBC 등 2017~2018년 보도</span>', X, 170, T.mp2 + 0.4, T.mp3);
  txt('<span class="hero h3">그는 <span class="honey">치료</span>를 선택했고,<br>지금은 그 이야기를 나눕니다</span>', X, 180, T.mp3 + 0.3, T.both);
  txt('<span class="hero h2">손을 내밀었다는 것,<br><span class="honey">그것 하나</span></span>', X, 180, T.both + 1.6, T.notOnly + 0.6);
  txt('<span class="hero h1 num honey">10명 중 9명</span><br><span class="sub">가장 위험한 순간을 넘긴 뒤, <b>삶을 계속 이어 갑니다</b></span><span class="src">출처: 하버드 대학교 보건대학원 Means Matter</span>', X, 150, T.nine + 0.4, T.pass + 0.3);
  txt('<span class="hero h2">그 순간의 마음은<br><span class="teal">영원하지 않아요</span></span>', X, 180, T.pass + 0.5, T.q);
  txt('<span class="hero h3">무엇부터<br>해 볼 수 있을까요?</span>', X, 190, T.q + 0.4, T.hp - 0.3);
  // hp
  mark('셋', '오늘 할 수 있는 작은 일', 'hp01');
  txt('<span class="hero h3"><span class="honey">하나,</span> 말하기</span><br><span class="sub">믿을 수 있는 한 사람에게 “요즘 많이 힘들어”</span>', X, 180, T.talk + 0.3, T.call);
  txt('<span class="lines"><b>109</b> 자살예방 상담전화 · 24시간<br><b>1577-0199</b> 정신건강 위기상담 · 24시간<br><b class="teal">1388</b> 청소년 상담</span><span class="src">보건복지부 · 2024년 1월부터 자살예방 상담전화는 109로 통합</span>', X, 160, T.call + 0.3, T.pro);
  txt('<span class="hero h3"><span class="honey">둘,</span> 전문가 만나기</span><br><span class="sub">정신건강의학과 · 동네 정신건강복지센터</span>', X, 180, T.pro + 0.3, T.treat);
  txt('<span class="hero h2">우울증은<br><span class="leaf">나아질 수 있는 병</span></span><br><span class="sub">상담과 약물 치료 · 세계보건기구: 효과적인 치료법이 있다</span>', X, 160, T.treat + 0.3, T.body);
  txt('<span class="hero h3"><span class="honey">셋,</span> 몸 돌보기</span><br><span class="sub">물 한 잔 · 따뜻한 밥 한 끼 · 창문 열고 햇빛</span>', X, 180, T.body + 0.3, T.wait);
  txt('<span class="hero h3">가장 어두운 날엔,<br><span class="teal">큰 결정은 미뤄 두기</span></span><br><span class="sub">오늘을 넘긴 것만으로도, <b>해낸 거예요</b></span>', X, 170, T.wait + 0.3, T.care);
  txt('<span class="hero h3">소중한 사람이<br>걱정된다면</span>', X, 190, T.care + 0.3, T.ask);
  txt('<span class="quote">“요즘 많이 힘들지,<br><span class="honey">내가 들어 줄게</span>”</span>', X, 190, T.ask + 0.6, T.fn - 0.3);
  // fn
  txt('<span class="hero h2">당신의 아픔은 <span class="peach">진짜</span>예요</span><br><span class="sub">하지만 그 아픔이, <b>당신의 전부는 아닙니다</b></span>', X, 180, T.real + 0.3, T.tunnel);
  txt('<span class="hero h2">터널에는 <span class="honey">끝</span>이 있어요</span>', X, 200, T.tunnel + 0.4, T.thanks);
  txt('<span class="hero h1">고마워요</span><br><span class="sub">오늘 하루를 버텨 준 당신에게</span>', X, 170, T.thanks + 0.3, T.last);
  txt('<span class="kick">혼자 견디지 말고</span><br><span class="hero h1 honey num">109</span><br><span class="sub">자살예방 상담전화 · 24시간 · 위급할 땐 <b>119 · 112</b></span><br><span class="sub" style="font-size:30px">정신건강 위기상담 1577-0199 · 청소년 1388</span>', X, 140, T.last + 0.3, T.END + 5);

  // ---------- real photos (freely licensed, credited) standing on the desk ----------
  const photo = (src, cap, t0, t1) => txt(`<div class="frame"><img src="${src}" alt=""></div><span class="cap">${cap}</span>`, 744, 372, t0, t1, { cls: 'photo' });
  photo('assets/user/rowling-2010.jpg', 'J.K. 롤링, 2010년<br>사진 Daniel Ogren · CC BY 2.0 · Wikimedia Commons', T.jk + 1.2, T.mp - 0.2);
  photo('assets/user/phelps-2016.jpg', '마이클 펠프스, 2016년 리우 올림픽<br>사진 Agência Brasil · CC BY 2.0 · Wikimedia Commons', T.mp + 0.4, T.both + 1.2);
  await Promise.all(Array.from(ui.querySelectorAll('img')).map((im) => im.decode().catch(() => {})));

  // ---------- room state over time ----------
  const rainAt = (t) => lerp(1, 0.7, K(t, T.jk, T.jk + 8)) * lerp(1, 0.55, K(t, T.hp, T.hp + 8)) * (1 - K(t, T.body - 1, T.body + 4));
  const mornAt = (t) => 0.12 * K(t, T.jk, T.hp) + 0.48 * io(K(t, T.body, T.body + 8)) + 0.4 * io(K(t, T.tunnel, T.thanks + 2));
  const growAt = (t) => 0.15 * K(t, T.bridge, T.jk + 4) + 0.35 * K(t, T.both, T.q) + 0.3 * K(t, T.treat, T.wait) + 0.2 * io(K(t, T.tunnel, T.thanks));
  onFrame((t) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineWidth = 1; g.lineCap = 'butt';
    const st = {
      t, rain: rainAt(t), morning: mornAt(t), lamp: 1 - 0.75 * io(K(t, T.tunnel, T.thanks + 2)), grow: growAt(t),
      open: io(K(t, A('hp07', '창문', -0.6), A('hp07', '창문', 1.8))), beam: K(t, A('hp07', '햇빛', -0.5), A('hp07', '햇빛', 2)) * 0.6 + 0.4 * io(K(t, T.tunnel, T.thanks)),
      book: 0, pool: vis(t, T.mp, T.both + 1.2, 1.5, 1.5),
      lights: vis(t, T.nine - 0.2, T.q, 1, 1), lights9: K(t, T.nine + 2, T.nine + 4),
      phone: vis(t, T.talk, T.pro + 0.6, 1, 1), water: vis(t, A('hp07', '물 한 잔', -0.3), T.END + 5, 0.6, 0.1), rice: vis(t, A('hp07', '밥', -0.3), T.END + 5, 0.6, 0.1),
      mug2: vis(t, T.ask, T.END + 5, 1.2, 0.1),
    };
    RM.draw(g, st);
    for (const x of texts) {
      const a = vis(t, x.t0, x.t1, 0.9, 0.7);
      if (a <= 0) { if (x.el.style.opacity !== '0') x.el.style.opacity = '0'; continue; }
      const kin = out(K(t, x.t0, x.t0 + 1.2));
      x.el.style.opacity = a.toFixed(3); x.el.style.transform = `translateY(${((1 - kin) * 16).toFixed(1)}px)`;
    }
  });
});
