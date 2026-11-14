/*
 * scenes.js — the integrator for 「세상에서 가장 이해하기 쉬운 GPU 만드는 법」.
 * One world: the inside of a lit silicon chip (storyboard.md → 월드 바이블). Five chapters, one builder each (js/seg/*.js),
 * sharing the baked materials, the chapter card and the signature transition (the exposure sweep: a violet band of light
 * crosses the frame left to right and "prints" the next chapter where it has passed).
 * Every tween is on `tl`; every canvas frame is a pure function of t.
 */
Video.define(async (ctx) => {
  const { tl, cue, cues, scene, onFrame, rand, fitCanvas, data } = ctx;
  const K = FXKit.install(ctx, { accent: '242,193,78' });
  const TX = TypeFX.install(ctx);
  const WO = window.WORLD;
  const ids = cues.map((c) => c.id);

  // ---------- helpers shared by every chapter ----------
  const H = {
    S: (id) => cue(id).start, E: (id) => cue(id).end, D: (id) => cue(id).duration,
    about: (id, phrase, off = 0) => cue(id).about(phrase) + off,
    at: (id, f) => cue(id).at(f),
    segs: document.getElementById('segs'),
    mount(html) { const tpl = document.createElement('template'); tpl.innerHTML = html.trim(); const els = Array.from(tpl.content.children); els.forEach((e) => H.segs.appendChild(e)); return els; },
    q: (root, sel) => root.querySelector(sel), qa: (root, sel) => Array.from(root.querySelectorAll(sel)),
    rand, TX, K, WO, tl, cue, scene, onFrame, fitCanvas,
    /** entrance with explicit states */
    inn(target, pos, from = { y: 40 }, dur = 0.8, ease = 'expo.out') { tl.fromTo(target, { autoAlpha: 0, ...from }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: dur, ease, immediateRender: false }, pos); },
    /** exit from the entrance's end state, explicitly (seek-safe) */
    out(target, pos, to = { y: -30 }, dur = 0.45, ease = 'power2.in') { tl.fromTo(target, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, { autoAlpha: 0, ...to, duration: dur, ease, immediateRender: false }, pos); },
    /** show a text from t0 to t1 */
    show(target, t0, t1, from = { y: 40 }, to = { y: -30 }) { gsap.set(target, { autoAlpha: 0 }); H.inn(target, t0, from); if (t1 != null) H.out(target, t1, to); },
    /** a number counting from a to b over [t0, t1], written into el with fmt */
    count(el, a, b, t0, t1, fmt = (v) => Math.round(v).toLocaleString('en-US'), ease = 'power2.out') {
      const o = { v: a }; el.textContent = fmt(a);
      tl.fromTo(o, { v: a }, { v: b, duration: t1 - t0, ease, immediateRender: false, onUpdate: () => { el.textContent = fmt(o.v); } }, t0);
    },
    /** the key light: cool white from the upper left, falling off to the lower right. strength 0..1 */
    keyLight(g, k = 1, warm = 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      const grd = g.createRadialGradient(480, 200, 60, 480, 200, 1900);
      const c = warm ? '255,230,200' : '210,225,255';
      grd.addColorStop(0, `rgba(${c},${0.14 * k})`); grd.addColorStop(0.35, `rgba(${c},${0.035 * k})`); grd.addColorStop(0.7, `rgba(0,0,0,${0.16 * k})`); grd.addColorStop(1, `rgba(0,0,0,${0.5 * k})`);
      g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080);
    },
    /** the silicon ground, drifting slowly (parallax p), at zoom z around the frame centre */
    ground(g, t, z = 1, dx = 0, dy = 0, dim = 0) {
      const c = H.mat.si.canvas, s = z * 1.12, w = 1920 * s, h = 1080 * s;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(c, 960 - w / 2 + dx + 70 * Math.sin(t * 0.05), 540 - h / 2 + dy + 40 * Math.sin(t * 0.037 + 1), w, h);
      if (dim > 0) { g.fillStyle = `rgba(5,7,12,${dim})`; g.fillRect(0, 0, 1920, 1080); }
    },
  };

  // ---------- materials: baked once, shared ----------
  Video.progress(0.2);
  const M = (H.mat = {});
  M.si = WO.silicon(2200, 1240, 7);
  Video.progress(0.36);
  M.siQuiet = WO.silicon(900, 900, 13, { traces: 0.5, sheen: 1.4 });
  Video.progress(0.42);
  M.tile = WO.coreTile(96, 3);
  M.tileBig = WO.coreTile(256, 4);
  M.tileCpu = WO.coreTile(192, 5, WO.hex('#9fb4d8'));
  M.pic = WO.picture(192, 108, 9);
  Video.progress(0.5);
  H.sp = {
    glowGold: WO.glow(64, WO.C.core), glowOn: WO.glow(64, WO.C.on), glowEuv: WO.glow(96, WO.C.euv), glowWhite: WO.glow(64, [255, 255, 255]),
    grains: Array.from({ length: 8 }, (_, i) => WO.grain(64, 100 + i)),
  };

  // ---------- chapter card + the exposure sweep ----------
  const sw = document.getElementById('sweep'), band = sw.querySelector('.band'), coreLine = sw.querySelector('.core');
  gsap.set([band, coreLine], { opacity: 0, x: -400 });
  /** the exposure sweep: el is printed in from the left as the light band crosses, starting at t0 (lasting dur) */
  H.sweep = function (el, t0, dur = 1.2) {
    const pos = { p: 0 };
    gsap.set(el, { clipPath: 'inset(0px 1920px 0px 0px)' });
    tl.fromTo(el, { clipPath: 'inset(0px 1920px 0px 0px)' }, { clipPath: 'inset(0px 0px 0px 0px)', duration: dur, ease: 'power2.inOut', immediateRender: false }, t0);
    tl.fromTo([band, coreLine], { x: 0, opacity: 0 }, { x: 1920, duration: dur, ease: 'power2.inOut', immediateRender: false }, t0);
    tl.fromTo([band, coreLine], { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'none', immediateRender: false }, t0);
    tl.fromTo([band, coreLine], { opacity: 1 }, { opacity: 0, duration: 0.2, ease: 'none', immediateRender: false }, t0 + dur - 0.2);
    return pos;
  };
  H.card = function (no, title, kw) {
    const q = kw ? title.replace(kw, `<em>${kw}</em>`) : title;
    return `<div class="chcard"><div class="no">CHAPTER ${String(no).padStart(2, '0')}</div><div class="rule"></div><div class="q">${q}</div></div>`;
  };
  H.cardIn = function (el, t0, t1) {
    const no = el.querySelector('.no'), q = el.querySelector('.q'), rule = el.querySelector('.rule');
    gsap.set(el, { autoAlpha: 1 }); gsap.set([no, q], { autoAlpha: 0 });
    tl.fromTo(no, { autoAlpha: 0, y: 20, letterSpacing: '0.6em' }, { autoAlpha: 1, y: 0, letterSpacing: '0.3em', duration: 0.8, ease: 'expo.out', immediateRender: false }, t0 + 0.5);
    tl.fromTo(rule, { width: 0 }, { width: 520, duration: 0.9, ease: 'expo.inOut', immediateRender: false }, t0 + 0.55);
    tl.fromTo(q, { autoAlpha: 0, y: 40, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, t0 + 0.7);
    tl.fromTo(el, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 1.04, duration: 0.6, ease: 'power2.in', immediateRender: false }, t1);
  };

  // ---------- chapter windows ----------
  const ORDER = ['op', 'sw', 'cp', 'fb', 'ai'];
  const first = (seg) => ids.find((i) => i.startsWith(seg)), last = (seg) => [...ids].reverse().find((i) => i.startsWith(seg));
  const startOf = (k) => { const fk = first(ORDER[k]), pl = k > 0 && last(ORDER[k - 1]); return pl ? Math.max(H.S(fk) - 1.2, H.E(pl) - 0.25) : 0; };
  ORDER.forEach((seg, i) => {
    const a = i === 0 ? 0 : startOf(i), b = ORDER[i + 1] ? startOf(i + 1) : data.duration;
    try { window.SEG[seg](ctx, K, TX, H, { id: seg, first: first(seg), last: last(seg), a, b, no: i + 1 }); }
    catch (err) { console.error(`[${seg}] segment failed`, err); }
    Video.progress(0.55 + 0.08 * (i + 1));
  });
});
