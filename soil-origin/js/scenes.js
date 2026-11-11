/*
 * scenes.js — the integrator for 「흙은 어디에서 왔는가?」.
 * One world: a cut face of the ground (storyboard.md → 월드 바이블). Five chapters, one builder each (js/seg/*.js),
 * sharing the baked materials, the camera helper, the chapter card and the signature transition (the spade cut).
 * Every tween is on `tl`; every canvas frame is a pure function of t.
 */
Video.define(async (ctx) => {
  const { tl, cue, cues, scene, onFrame, rand, fitCanvas, stage, W: SW, H: SH, data } = ctx;
  const K = FXKit.install(ctx, { accent: '255,184,77' });
  const TX = TypeFX.install(ctx);
  const WO = window.WORLD;
  const ids = cues.map((c) => c.id);

  // ---------- helpers shared by every chapter ----------
  const H = {
    S: (id) => cue(id).start, E: (id) => cue(id).end, D: (id) => cue(id).duration,
    w: (id, phrase, off = 0) => cue(id).when(phrase) + off,
    about: (id, phrase, off = 0) => cue(id).about(phrase) + off,
    at: (id, f) => cue(id).at(f),
    segs: document.getElementById('segs'),
    mount(html) { const tpl = document.createElement('template'); tpl.innerHTML = html.trim(); const els = Array.from(tpl.content.children); els.forEach((e) => H.segs.appendChild(e)); return els; },
    q: (root, sel) => root.querySelector(sel), qa: (root, sel) => Array.from(root.querySelectorAll(sel)),
    cam() { return { x: 0, y: 0, z: 1 }; },
    // multiplane: a layer with parallax p (0.3 far … 1 hero … 1.6 near) seen by cam {x, y, z}
    view(g, cam, p = 1) { const s = Math.pow(cam.z, p); g.setTransform(s, 0, 0, s, 960 - (960 + cam.x * p) * s, 540 - (540 + cam.y * p) * s); },
    reset(g) { g.setTransform(1, 0, 0, 1, 0, 0); },
    // fromTo entrance / exit on tl with explicit states (no immediateRender surprises)
    inn(target, pos, from = { y: 40 }, dur = 0.8, ease = 'expo.out') { tl.fromTo(target, { autoAlpha: 0, ...from }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: dur, ease, overwrite: 'auto' }, pos); },
    out(target, pos, to = { y: -30 }, dur = 0.45, ease = 'power2.in') { tl.to(target, { autoAlpha: 0, ...to, duration: dur, ease, overwrite: 'auto' }, pos); },
    rand, TX, K, WO, tl, cue, scene, onFrame, fitCanvas,
    // the key light as a pool over the frame: brighter where the low sun from the upper left strikes, falling off to the lower right.
    // Drawn in screen space at the end of a chapter's frame; strength 0..1
    keyLight(g, k = 1, cx = 520, cy = 240) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      const grd = g.createRadialGradient(cx, cy, 80, cx, cy, 1900);
      grd.addColorStop(0, `rgba(255,232,190,${0.16 * k})`); grd.addColorStop(0.35, `rgba(255,220,170,${0.04 * k})`); grd.addColorStop(0.7, `rgba(0,0,0,${0.18 * k})`); grd.addColorStop(1, `rgba(0,0,0,${0.5 * k})`);
      g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080);
    },
    // two fingertips (thumb and index) pinching at (x, y), seen against the light: dark skin with a rim on the upper right. open 0..1 spreads them
    fingers(g, x, y, k = 1, open = 0, alpha = 1) {
      g.save(); g.translate(x, y); g.scale(k, k); g.globalAlpha = alpha;
      // each finger: a rounded, tapering pad coming down from above; skin in shadow, a rim light on the upper right, a nail
      const finger = (sx, rot) => { g.save(); g.scale(sx, 1); g.translate(34, 0); g.rotate(rot);
        const grd = g.createLinearGradient(-60, -600, 70, -40); grd.addColorStop(0, '#3a2a22'); grd.addColorStop(0.6, '#5c4034'); grd.addColorStop(1, '#8a6250');
        g.fillStyle = grd; g.beginPath(); g.moveTo(-62, -760); g.lineTo(62, -760); g.bezierCurveTo(70, -420, 62, -200, 48, -90); g.bezierCurveTo(40, -20, 14, 4, 0, 4); g.bezierCurveTo(-14, 4, -40, -20, -48, -90); g.bezierCurveTo(-62, -200, -70, -420, -62, -760); g.closePath(); g.fill();
        // knuckle creases
        g.strokeStyle = 'rgba(20,10,6,0.35)'; g.lineWidth = 3; for (const yy of [-300, -170]) { g.beginPath(); g.moveTo(-40, yy); g.quadraticCurveTo(0, yy + 14, 40, yy); g.stroke(); }
        // nail on the outer side near the tip
        g.fillStyle = 'rgba(230,200,180,0.55)'; g.beginPath(); g.ellipse(22, -62, 18, 34, 0.15, 0, 6.283); g.fill();
        // rim light
        g.strokeStyle = 'rgba(255,214,170,0.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(60, -740); g.bezierCurveTo(68, -420, 60, -200, 46, -92); g.stroke();
        g.restore(); };
      finger(1, 0.1 + 0.3 * open); finger(-1, 0.1 + 0.3 * open);
      g.restore();
    },
  };

  // ---------- materials: baked once, shared ----------
  Video.progress(0.22);
  const TW = 1920, TH = 1080;
  const M = (H.mat = {});
  M.granite = WO.granite(TW, TH, 11);
  Video.progress(0.3);
  M.soilO = WO.soil(TW, 420, { base: '#2a1a10', dark: '#140b06', light: '#5a3a24', grain: 2.6, relief: 6, seed: 5 });
  M.soilA = WO.soil(TW, 560, { base: '#4a3020', dark: '#2a180d', light: '#7a5536', grain: 3.0, relief: 7, seed: 6 });
  Video.progress(0.38);
  M.soilB = WO.soil(TW, 640, { base: '#a9622c', dark: '#6d3a18', light: '#d08a48', grain: 4.5, relief: 5, mottle: 0.5, mottleColor: '#c99a5a', seed: 7 });
  M.soilC = WO.soil(TW, 640, { base: '#6b5340', dark: '#3d2d22', light: '#9a8470', grain: 5.5, relief: 9, mottle: 0.6, mottleColor: '#8f877f', seed: 8 });
  Video.progress(0.46);
  M.regolith = WO.regolith(TW, TH, 23, WO.HARD, WO.bootprint(930, 230, 2.4, 2.4, -0.35));
  Video.progress(0.54);
  // CSS textures for hero type (built at run time from the baked canvases)
  const small = (c) => { const s = WO.canvas(512, 288); WO.ctx(s).drawImage(c, 0, 0, 512, 288); return s; };
  H.tex = { soil: WO.cssTexture(small(M.soilA.canvas)), humus: WO.cssTexture(small(M.soilO.canvas)), rock: WO.cssTexture(small(M.granite.canvas)), moon: WO.cssTexture(small(M.regolith.canvas)), clay: WO.cssTexture(small(M.soilB.canvas)) };
  // sprites
  H.sp = {
    grainA: [WO.grainSprite(26, WO.hex('#6a4a30'), 1), WO.grainSprite(22, WO.hex('#4a3020'), 2), WO.grainSprite(18, WO.hex('#8a6a46'), 3)],
    grainG: [WO.grainSprite(24, WO.hex('#9a9ea3'), 4), WO.grainSprite(20, WO.hex('#6e7278'), 5)],
    glowLife: WO.glowSprite(48, WO.hex('#9fd36a')), glowAmber: WO.glowSprite(64, WO.hex('#ffb84d')), glowWater: WO.glowSprite(40, WO.hex('#8fd7ff')),
    leaf: [WO.leafSprite(90, WO.hex('#c8702a'), WO.hex('#7a3d12'), 1), WO.leafSprite(76, WO.hex('#d9a030'), WO.hex('#8a5a14'), 2), WO.leafSprite(84, WO.hex('#8a4a22'), WO.hex('#4a2410'), 3)],
    drop: WO.dropSprite(28, WO.hex('#8fd7ff')),
    worm: WO.wormSprite(360, 44, WO.hex('#c98a7a')),
  };

  // ---------- chapter card + the spade cut ----------
  const cutEl = document.getElementById('cut'), blade = cutEl.querySelector('.blade'), edgeL = cutEl.querySelector('.edge.l'), edgeR = cutEl.querySelector('.edge.r');
  gsap.set(blade, { scaleY: 0, opacity: 0 }); gsap.set([edgeL, edgeR], { opacity: 0 }); gsap.set(edgeL, { x: 960 - 34 }); gsap.set(edgeR, { x: 960 });
  const gap = { v: 0 };   // half width of the opened cut, px
  let cutActive = [];      // [from, to] windows where the cut is drawn
  /** the spade cut: the new scene `el` opens from a vertical seam at t0 (lasting dur). Call scene(el, t0, …) yourself. */
  H.cut = function (el, t0, dur = 1.15) {
    gsap.set(el, { clipPath: 'inset(0px 960px 0px 960px)' });
    tl.fromTo(blade, { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.32, ease: 'power3.in', immediateRender: false }, t0 - 0.34);
    tl.to(blade, { opacity: 0, duration: 0.25, ease: 'power2.out' }, t0 + 0.05);
    tl.fromTo(el, { clipPath: 'inset(0px 960px 0px 960px)' }, { clipPath: 'inset(0px 0px 0px 0px)', duration: dur, ease: 'expo.inOut', immediateRender: false }, t0);
    tl.fromTo(gap, { v: 0 }, { v: 1000, duration: dur, ease: 'expo.inOut', immediateRender: false }, t0);
    tl.set([edgeL, edgeR], { opacity: 1 }, t0 - 0.02);
    tl.fromTo([edgeL, edgeR], { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, t0 + dur - 0.2);
    cutActive.push([t0 - 0.4, t0 + dur + 0.1]);
  };
  onFrame((t) => {
    const on = cutActive.some(([a, b]) => t >= a && t <= b);
    if (!on) return;
    gsap.set(edgeL, { x: 960 - gap.v - 34 }); gsap.set(edgeR, { x: 960 + gap.v });
  });
  /** chapter card markup inside a scene: a handwritten number and the question with its keyword in amber */
  H.card = function (no, title, kw) {
    const q = kw ? title.replace(kw, `<em>${kw}</em>`) : title;
    return `<div class="chcard"><div class="no">${no}</div><div class="q">${q}</div></div>`;
  };
  /** show the card from t0, let it recede at t1 */
  H.cardIn = function (el, t0, t1) {
    const no = el.querySelector('.no'), q = el.querySelector('.q');
    gsap.set(el, { autoAlpha: 1 });
    tl.fromTo(no, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, t0 + 0.6);
    tl.fromTo(q, { autoAlpha: 0, y: 40, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, t0 + 0.7);
    tl.to(el, { autoAlpha: 0, scale: 0.92, duration: 0.7, ease: 'power2.in' }, t1);
  };

  // ---------- chapter windows (references/long-form.md §4) ----------
  const ORDER = ['mo', 'rk', 'lf', 'tm', 'us'];
  const first = (seg) => ids.find((i) => i.startsWith(seg)), last = (seg) => [...ids].reverse().find((i) => i.startsWith(seg));
  const startOf = (k) => { const fk = first(ORDER[k]), pl = k > 0 && last(ORDER[k - 1]); return pl ? Math.max(H.S(fk) - 1.05, H.E(pl) - 0.25) : H.S(fk) - 1.05; };
  ORDER.forEach((seg, i) => {
    const a = i === 0 ? 0 : startOf(i), b = ORDER[i + 1] ? startOf(i + 1) : data.duration;
    try { window.SEG[seg](ctx, K, TX, H, { id: seg, first: first(seg), last: last(seg), a, b, no: i + 1 }); }
    catch (err) { console.error(`[${seg}] segment failed`, err); }
    Video.progress(0.56 + 0.08 * (i + 1));
  });

  // the finish: one wandering light for look.css sets (none used), kept for parity; nothing else per frame here
});
