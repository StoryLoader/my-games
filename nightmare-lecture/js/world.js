/* world.js — this video's kit, shared by the chapter builders in js/seg/*.js.
 *   const K = KIT(ctx)
 *   K.el(tag, cls, parent, css, html)          an element (absolute by default)
 *   K.etch(parent, text, { x, y, size, align, cls, w, lh, font })   etched type: dim groove + the same letters full of light
 *   K.write(el, at, dur) (focus-in, then lit) / K.lit(el, at, dur) / K.dim(el, at, dur) / K.inn(el, at, dur, dy) / K.out(el, at, dur)
 *   K.plate(parent, { x, y, w, h, num, name })  an etched glass plate in brass clips
 *   K.cam.key(t, { x, y, s, b })               the camera over #world: world point (x, y) at the centre, scale s, blur b
 *   K.film.key(t, { x, y, s, o, bz, ov })      where the live film sits on screen (top-left x, y; scale s of 1920×1080;
 *                                              opacity o; bezel bz; the film's own subtitles ov) — pure keyframes
 *   K.film.play(a, b, f0, rate=1) / K.film.hold(a, b, f0)   film time f0 at video time a, running at rate until b (outside: the last one holds)
 *   K.lamp.key(t, v) / K.beam.key(t, v) / K.dust.key(t, v)   lantern, light cone and dust levels 0..1
 *   K.sfx(type, at)                            a sound event for sfx/make_sound.py (window.SFX_EVENTS)
 * Every value on screen is a pure function of t: keyframes are read in onFrame, tweens are explicit fromTo.
 */
window.SEG = window.SEG || {};   // the chapter builders (js/seg/*.js) register here
(function () {
  'use strict';
  const EASE = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);   // cubic in-out
  function track(def) {
    const keys = [];
    return {
      keys,
      key(t, v, ease) { keys.push({ t, v: { ...v }, ease: ease || EASE }); keys.sort((a, b) => a.t - b.t); return this; },
      at(t) {
        if (!keys.length) return { ...def };
        if (t <= keys[0].t) return { ...def, ...keys[0].v };
        for (let i = 1; i < keys.length; i++) {
          const k1 = keys[i];
          if (t < k1.t) {
            const k0 = keys[i - 1], a = { ...def, ...k0.v }, b = { ...def, ...k0.v, ...k1.v };
            const f = k1.ease((t - k0.t) / (k1.t - k0.t)), o = {};
            for (const n in b) o[n] = typeof b[n] === 'number' ? a[n] + (b[n] - a[n]) * f : b[n];
            return o;
          }
        }
        let o = { ...def }; for (const k of keys) o = { ...o, ...k.v }; return o;
      },
    };
  }
  function noise(t, s) { return Math.sin(t * 7.3 + s) * 0.5 + Math.sin(t * 13.1 + s * 2.1) * 0.3 + Math.sin(t * 23.7 + s * 0.7) * 0.2; }

  window.KIT = function (ctx) {
    const { tl, onFrame, rand, fitCanvas } = ctx;
    const $ = (id) => document.getElementById(id);
    const K = { $ };
    window.SFX_EVENTS = window.SFX_EVENTS || [];
    K.sfx = (type, at, gain = 1) => { window.SFX_EVENTS.push({ type, t: +at.toFixed(3), gain }); };

    K.el = (tag, cls, parent, css, html) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (css) for (const k in css) e.style[k] = typeof css[k] === 'number' && !/opacity|zIndex|fontWeight/.test(k) ? css[k] + 'px' : css[k];
      if (html != null) e.innerHTML = html;
      if (parent) parent.appendChild(e);
      if (!e.style.position && !(cls || '').match(/\b(etch|plate|lbl|slide|mini|rackwood)\b/)) e.style.position = 'absolute';
      if (/\blbl\b/.test(cls || '') && /\bc\b/.test(cls || '')) gsap.set(e, { xPercent: -50 });
      return e;
    };
    K.etch = (parent, text, o = {}) => {
      const e = K.el('div', 'etch' + (o.cls ? ' ' + o.cls : ''), parent, { left: o.x || 0, top: o.y || 0, fontSize: o.size || 64, lineHeight: o.lh || 1.18 });
      if (o.w) { e.style.width = o.w + 'px'; e.style.whiteSpace = 'normal'; }
      if (o.font) e.style.fontFamily = o.font;
      if (o.weight) e.style.fontWeight = o.weight;
      if (o.ls != null) e.style.letterSpacing = o.ls;
      e.style.textAlign = o.align === 'c' ? 'center' : o.align === 'r' ? 'right' : 'left';
      // centring by xPercent (never a CSS transform): GSAP keeps it as a percentage of the live width, so a tween on y
      // can't freeze an offset measured before the web font arrived
      if (o.align === 'c') gsap.set(e, { xPercent: -50 });
      if (o.align === 'r') gsap.set(e, { xPercent: -100 });
      const g = K.el('span', 'g', e, null, text), l = K.el('span', 'l', e, null, text);
      g.style.position = 'relative'; l.style.position = 'absolute';
      gsap.set(e, { autoAlpha: 0 });
      return e;
    };
    // engrave: the letters are cut left to right (a clip), then fill with light
    K.write = (el, at, dur = 0.9, litToo = true) => {
      const d = Math.max(0.35, dur * 0.8);
      tl.fromTo(el, { autoAlpha: 0, y: 12, filter: 'blur(9px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: d, ease: 'power2.out', immediateRender: true }, at);
      tl.set(el, { filter: 'none' }, at + d + 0.02);
      if (litToo) K.lit(el, at + d * 0.35, dur * 0.9);
      return el;
    };
    K.lit = (el, at, dur = 0.6) => { tl.fromTo(el.querySelector('.l'), { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power2.out', immediateRender: false }, at); return el; };
    K.dim = (el, at, dur = 0.6) => { tl.fromTo(el.querySelector('.l'), { opacity: 1 }, { opacity: 0, duration: dur, ease: 'power2.in', immediateRender: false }, at); return el; };
    K.inn = (el, at, dur = 0.7, dy = 24) => { tl.fromTo(el, { autoAlpha: 0, y: dy }, { autoAlpha: 1, y: 0, duration: dur, ease: 'power3.out', immediateRender: true }, at); return el; };
    K.out = (el, at, dur = 0.5) => { tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: dur, ease: 'power2.in', immediateRender: false }, at); return el; };
    K.set = (el, at, vars) => { tl.set(el, vars, at); return el; };

    K.plate = (parent, o) => {
      const p = K.el('div', 'plate', parent, { left: o.x, top: o.y, width: o.w, height: o.h });
      K.el('div', 'warm', p); K.el('div', 'edge', p);
      for (const c of ['tl', 'tr', 'bl', 'br']) K.el('div', 'clip ' + c, p);
      if (o.num != null || o.name) K.el('div', 'tab', p, null, (o.num != null ? `<b>${o.num}</b>` : '') + (o.name || ''));
      p.warm = p.querySelector('.warm');
      return p;
    };
    K.warm = (p, at, to = 1, dur = 0.8) => { tl.fromTo(p.warm || p.querySelector('.warm'), { opacity: to ? 0 : 1 }, { opacity: to, duration: dur, ease: 'sine.inOut', immediateRender: false }, at); return p; };

    // —— chapter card: a plate drawn up out of the stack, the chapter's question engraved on it ——
    K.card = (parent, o) => {
      const box = K.el('div', null, parent, { left: 0, top: 0, width: 1920, height: 1080 });
      const p = K.plate(box, { x: 290, y: 330, w: 1340, h: 380 });
      gsap.set(p, { transformPerspective: 1400 });
      const n = K.etch(box, o.num, { x: 960, y: 230, size: 40, align: 'c', cls: 'sans', ls: '.32em' });
      const q = K.etch(p, o.q, { x: 670, y: 120, size: 80, align: 'c', cls: 'q' });
      q.querySelector('.l').innerHTML = o.q.replace(o.key, `<em>${o.key}</em>`);
      tl.fromTo(p, { autoAlpha: 0, y: 110, rotationX: 18, transformPerspective: 1400 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'power3.out', immediateRender: true }, o.at);
      K.warm(p, o.at + 0.5, 1, 1.0);
      K.inn(n, o.at + 0.4, 0.6); K.lit(n, o.at + 0.6, 0.6);
      K.write(q, o.at + 0.7, 1.2);
      tl.fromTo([p, n], { autoAlpha: 1 }, { autoAlpha: 0, y: -60, duration: 0.7, ease: 'power2.in', immediateRender: false }, o.out);
      K.sfx('lift', o.at); K.sfx('etch', o.at + 0.8);
      return box;
    };
    // a hand-cut line of light (SVG path drawn on), in a full-stage svg layer of `parent`
    K.svg = (parent) => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('width', 1920); s.setAttribute('height', 1080); s.setAttribute('viewBox', '0 0 1920 1080');
      s.style.position = 'absolute'; s.style.left = '0'; s.style.top = '0'; s.style.overflow = 'visible'; parent.appendChild(s); return s;
    };
    K.thread = (svg, d, at, dur = 1, o = {}) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', o.color || '#ffcf8a');
      p.setAttribute('stroke-width', o.w || 3); p.setAttribute('stroke-linecap', 'round');
      p.style.filter = `drop-shadow(0 0 6px ${o.glow || 'rgba(255,170,80,.9)'})`;
      if (o.dash) p.setAttribute('stroke-dasharray', o.dash);
      svg.appendChild(p);
      if (o.dash) tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: dur, immediateRender: true }, at);
      else tl.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'power1.inOut', immediateRender: true }, at);
      return p;
    };
    // a number counted up by onFrame (formatted), from a → b over [at, at + dur]
    K.count = (el, a, b, at, dur, fmt = (v) => Math.round(v)) => {
      const tgt = el.querySelectorAll('.g, .l');
      onFrame((t) => { const f = Math.max(0, Math.min(1, (t - at) / dur)), v = a + (b - a) * (1 - Math.pow(1 - f, 3)); const s = String(fmt(v)); for (const x of tgt) if (x.textContent !== s) x.textContent = s; });
    };

    // —— camera over #world ——
    const world = $('world');
    K.cam = track({ x: 960, y: 540, s: 1, b: 0 });
    // —— the live film on screen ——
    const fw = $('filmwrap'), bez = fw.querySelector('.bezel'), ov = $('nk-ov'), sheen = fw.querySelector('.sheen');
    K.film = track({ x: 0, y: 0, s: 1, o: 0, bz: 0, ov: 1, r: 0 });
    const segs = [];
    K.film.play = (a, b, f0, rate = 1) => { segs.push({ a, b, f0, rate }); return K.film; };
    K.film.hold = (a, b, f0) => K.film.play(a, b, f0, 0);
    K.film.time = (t) => {
      let best = null;
      for (const s of segs) { if (t >= s.a && t < s.b) return s.f0 + (t - s.a) * s.rate; if (t >= s.b && (!best || s.b > best.b)) best = s; }
      if (best) return best.f0 + (best.b - best.a) * best.rate;
      return segs.length ? segs.reduce((m, s) => (s.a < m.a ? s : m)).f0 : 0;
    };
    // —— lantern / beam / dust levels ——
    K.lamp = track({ v: 0 }); K.beam = track({ v: 0 }); K.dust = track({ v: 0 }); K.room = track({ v: 1 });
    const flame = document.querySelector('#lantern .flame'), halo = document.querySelector('#lantern .halo'), glass = document.querySelector('#lantern .glass');
    const pool = document.querySelector('#room .pool'), cone = document.querySelector('#beam .cone'), room = $('room'), lantern = $('lantern');
    const dustC = $('dust'), dg = fitCanvas(dustC, 1920, 1080, 1.5);
    const R = rand(31), MOTES = Array.from({ length: 150 }, () => ({ x: R(), y: R(), s: 0.6 + R() * 2.2, v: 0.012 + R() * 0.03, ph: R() * 6.28, w: 0.4 + R() }));

    let lastFT = -1, lastKey = '';
    // the review tools that measure but never film (errscan, check_fonts, snapshot, smoke) skip the film's WebGL frames,
    // which take seconds each on a CPU renderer; render.py (?render) and every normal browser draw them.
    const QP = new URLSearchParams(location.search);
    const SKIPFILM = navigator.webdriver === true && !QP.has('render') && !QP.has('film');
    onFrame((t, redraw) => {
      // camera
      const c = K.cam.at(t);
      world.style.transform = `translate(960px, 540px) scale(${c.s}) translate(${-c.x}px, ${-c.y}px)`;
      world.style.filter = c.b > 0.05 ? `blur(${c.b.toFixed(2)}px)` : '';
      // lantern + room
      const lv = K.lamp.at(t).v, fl = 1 + noise(t, 1) * 0.06, rv = K.room.at(t).v;
      room.style.opacity = rv;
      flame.style.transform = `scale(${(0.15 + 0.85 * lv) * (1 + noise(t, 4) * 0.03)}, ${(0.1 + 0.9 * lv) * fl})`;
      flame.style.opacity = Math.min(1, lv * 3);
      halo.style.opacity = lv * (0.85 + noise(t, 2) * 0.08);
      glass.style.opacity = 0.35 + 0.65 * lv;
      pool.style.opacity = lv * (0.9 + noise(t, 3) * 0.06);
      const bv = K.beam.at(t).v; cone.style.opacity = bv * (0.9 + noise(t, 5) * 0.05);
      lantern.style.visibility = rv > 0.01 ? 'visible' : 'hidden';
      // dust in the beam
      const dv = K.dust.at(t).v * rv;
      dg.clearRect(0, 0, 1920, 1080);
      if (dv > 0.01) {
        for (const m of MOTES) {
          const yy = ((m.y - t * m.v) % 1 + 1) % 1, py = 80 + yy * 860;
          const spread = 90 + (1 - yy) * 0 + (900 - py) * 0.0 + (py < 900 ? (900 - py) * 0.78 : 0);
          const px = 960 + (m.x - 0.5) * 2 * spread + Math.sin(t * 0.4 * m.w + m.ph) * 22;
          const a = dv * (0.25 + 0.75 * Math.max(0, Math.sin(t * 0.9 * m.w + m.ph))) * (0.35 + 0.65 * (1 - Math.abs(m.x - 0.5) * 2)) * Math.min(1, yy * 4);
          dg.fillStyle = `rgba(255,214,160,${(a * 0.7).toFixed(3)})`;
          dg.beginPath(); dg.arc(px, py, m.s, 0, 6.283); dg.fill();
        }
      }
      // the film
      const f = K.film.at(t);
      const vis = f.o > 0.002;
      fw.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) {
        fw.style.opacity = f.o;
        fw.style.transform = `translate(${f.x}px, ${f.y}px) scale(${f.s})${f.r ? ` rotate(${f.r}deg)` : ''}`;
        bez.style.opacity = f.bz; sheen.style.opacity = f.bz; ov.style.opacity = f.ov;
        const ft = Math.max(0, Math.min(window.NK.DUR - 0.001, K.film.time(t)));
        if (window.NK.READY && !SKIPFILM && (redraw || Math.abs(ft - lastFT) > 1e-4)) { window.NK.render(ft); lastFT = ft; }
      }
    });
    return K;
  };
})();
