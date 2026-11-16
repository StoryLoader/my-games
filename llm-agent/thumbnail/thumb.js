/* thumb.js — the thumbnails of 「LLM과 AI 에이전트, 처음부터 오늘까지」, built with the video's own clay kit (../js/clay.js).
   body[data-v="a"]: the LLM picking the next word  ·  body[data-v="b"]: the agent with arms and tools.
   node <skill>/scripts/thumbnail.mjs thumbnail/thumbnail_a.html --project .   (and _b) */
(async function () {
  await document.fonts.load("900 150px 'Pretendard'"); await document.fonts.load("800 150px 'Pretendard'");
  const T = window.THREE, v = document.body.dataset.v, cv = document.getElementById('gl');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(1280, 720, false);
  R.toneMapping = T.NoToneMapping; R.outputColorSpace = T.SRGBColorSpace; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFShadowMap;
  const C = window.CLAY.init(T), sc = new T.Scene(), cam = new T.PerspectiveCamera(30, 1280 / 720, 0.1, 100);
  sc.environment = new T.PMREMGenerator(R).fromScene(new T.RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.42;
  sc.background = new T.Color(v === 'b' ? 0xdff5ee : 0xfff3df);
  sc.add(new T.HemisphereLight(0xffffff, 0xffe9d6, 0.62));
  const key = new T.DirectionalLight(0xfff6ea, 1.5); key.position.set(-6, 12, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 6; sc.add(key, key.target);
  const fill = new T.DirectionalLight(0xdfe9ff, 0.35); fill.position.set(8, 5, -4); sc.add(fill);
  const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: 0.2, color: 0x4a3a66 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
  const put = (o, x, y, z, ry = 0, s = 1, rz = 0) => { o.position.set(x, y, z); o.rotation.set(0, ry, rz); o.scale.setScalar(s); sc.add(o); return o; };

  if (v === 'a') {
    const bot = C.bot({ tag: 'LLM' }); bot.userData.live(0.2, 0); put(bot, 3.0, 1.45, -0.6, -0.3, 1.3);
    // the sentence so far and the blank it has to fill
    const w1 = put(C.block('오늘 날씨가 참', 'white', { size: 0.42 }), 3.55, 0.34, 2.5, -0.06);
    put(C.block('?', 'coral', { size: 0.46, text: '#fff6e6' }), 3.55 + w1.userData.w / 2 + 0.5, 0.36, 2.5, -0.06);
    // the candidates for the next word, each with its score
    const cands = [['좋다', 'mint', 2.3, 62], ['덥다', 'sun', 1.15, 21], ['춥다', 'sky', 0.6, 9]];
    cands.forEach(([w, c, h, p], i) => {
      const x = 5.15 + i * 1.0, z = -1.6 - i * 0.1;
      put(C.rbox(0.62, h, 0.62, c, 0.2), x, h / 2, z);
      put(C.block(w, i ? 'white' : 'mint', { size: 0.34, text: i ? '#25324f' : '#ffffff' }), x, h + 0.4, z + 0.05);
      put(C.label(p + '%', { size: 0.26, color: '#25324f' }), x, 0.3, z + 0.33);
    });
    put(C.qmark('sun'), 4.0, 3.45, -1.8, -0.3, 0.6, -0.2);
    cam.position.set(-0.4, 3.0, 13.2); cam.lookAt(1.3, 1.55, 0);
  } else {
    const bot = C.bot({ tag: 'AI 에이전트', color: 'white', accent: 'mint', arms: true }); bot.userData.live(0.2, 1, 1); put(bot, 3.6, 1.45, -0.4, -0.3, 1.3);
    put(C.magnifier(), 5.45, 3.05, -0.1, -0.2, 0.95, 0.3);
    put(C.calendar(), 5.0, 0.62, 2.3, -0.25, 0.9);
    put(C.gear('sun', 0.5), 6.6, 0.7, 0.4, -0.5, 1.0);
    put(C.notebook(), 6.9, 2.7, -2.6, -0.35, 0.95, -0.12);
    cam.position.set(-0.4, 3.0, 13.2); cam.lookAt(1.3, 1.55, 0);
  }
  R.render(sc, cam);
  document.body.dataset.ready = '1';
})();
