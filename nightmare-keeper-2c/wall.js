// C 「칠십 년 치 꿈」: the shadow theatre on the tower's curved wall. A dream moth between the lantern and the wall throws its
// dream there as a shadow play: a pool of coloured light with flat pixel silhouettes in it (shadows = holes in the light).
// A low-res canvas (200×152) is redrawn per frame: silhouettes are drawn as paths on a mask, thresholded to hard pixels; the
// pool is dithered into a few steps of the dream colour. The card is a slice of a cylinder just inside the wall, added
// (additive blending) so the pool reads as light on the stone and every silhouette pixel leaves the stone dark.
import * as THREE from 'three';
import { bayer } from './px.js';

const CW = 200, CH = 152;
const hexRGB = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

export function wallTheatre(R, thC, arcM, y0, hM) {
  const thL = arcM / R;
  const geo = new THREE.CylinderGeometry(R, R, hM, 32, 1, true, thC - thL / 2, thL).translate(0, y0 + hM / 2, 0);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const g = cv.getContext('2d');
  const mk = document.createElement('canvas'); mk.width = CW; mk.height = CH; const m = mk.getContext('2d', { willReadFrequently: true });
  const hi = document.createElement('canvas'); hi.width = CW; hi.height = CH; const h = hi.getContext('2d', { willReadFrequently: true });
  const img = g.createImageData(CW, CH);
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; tex.offset.x = 1;   // seen from inside the cylinder: un-mirror
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 2; mesh.frustumCulled = false;
  const centre = new THREE.Vector3(Math.sin(thC) * R, y0 + hM / 2, Math.cos(thC) * R);
  const light = new THREE.PointLight('#ffffff', 0, 9, 2); light.position.copy(centre).multiplyScalar(1).setY(y0 + hM / 2); light.position.x *= .72; light.position.z *= .72;

  // —— silhouettes (canvas paths in a 200×152 frame, y down) ——
  const S = {
    fish(cx, cy, s, rot, opts = {}) {   // a big fish in a top hat, side view, facing right; fins as little arms
      m.save(); m.translate(cx, cy); m.rotate(rot); m.scale(s, s);
      m.beginPath(); m.ellipse(0, 0, 30, 17, 0, 0, 7); m.fill();                                          // body
      m.beginPath(); m.moveTo(-26, 0); m.lineTo(-46, -15); m.lineTo(-41, 0); m.lineTo(-46, 15); m.closePath(); m.fill();   // tail
      m.beginPath(); m.moveTo(-4, -15); m.quadraticCurveTo(4, -27, 14, -14); m.fill();                       // dorsal fin
      m.beginPath(); m.moveTo(2, 8); m.quadraticCurveTo(opts.wave ? 16 : 10, opts.wave ? 22 : 24, -2, 14); m.fill();   // the "arm" fin
      m.save(); m.translate(16, -14); m.rotate(-.18);                                                     // top hat
      m.fillRect(-10, -2, 20, 4); m.fillRect(-6.5, -20, 13, 19); m.restore();
      m.restore();
      // the eye and the hat band: holes the light comes through
      m.save(); m.globalCompositeOperation = 'destination-out'; m.translate(cx, cy); m.rotate(rot); m.scale(s, s);
      m.beginPath(); m.arc(17, -3, 3, 0, 7); m.fill(); m.translate(16, -14); m.rotate(-.18); m.fillRect(-6.5, -7, 13, 2.5); m.restore();
    },
    teapot(cx, cy, s, rot) {
      m.save(); m.translate(cx, cy); m.rotate(rot); m.scale(s, s);
      m.beginPath(); m.ellipse(0, 0, 16, 12, 0, 0, 7); m.fill();
      m.fillRect(-11, 9, 22, 5);                                                                            // foot
      m.beginPath(); m.moveTo(13, -2); m.lineTo(27, -14); m.lineTo(29, -12); m.lineTo(16, 5); m.fill();      // spout
      m.lineWidth = 4; m.beginPath(); m.arc(-16, 0, 7, Math.PI * .5, Math.PI * 1.5); m.stroke();           // handle
      m.beginPath(); m.ellipse(0, -12, 9, 3.5, 0, 0, 7); m.fill(); m.beginPath(); m.arc(0, -17, 3, 0, 7); m.fill();   // lid + knob
      m.restore();
    },
    keeper(cx, gy, s, age, lantern) {   // a figure standing (young 노을 → old): age 0..1 bends her and shortens her hair
      m.save(); m.translate(cx, gy); m.scale(s, s);
      const bend = age * .35, H = 52 - age * 6;
      m.save(); m.rotate(bend * .5);
      m.beginPath(); m.moveTo(-9, 0); m.lineTo(9, 0); m.lineTo(6, -H * .62); m.lineTo(-6, -H * .62); m.closePath(); m.fill();   // skirt/cloak
      m.fillRect(-5, -H * .82, 10, H * .22);                                                                 // body
      m.beginPath(); m.arc(1 + bend * 6, -H * .9, 6, 0, 7); m.fill();                                     // head
      if (age < .5) { m.beginPath(); m.moveTo(-3, -H * .95); m.quadraticCurveTo(-12 - (1 - age) * 6, -H * .7, -8, -H * .5); m.lineTo(-4, -H * .78); m.fill(); }   // long hair blowing
      else { m.beginPath(); m.arc(-5 + bend * 4, -H * .97, 4, 0, 7); m.fill(); }                          // a bun
      // the arm raised with the lantern
      m.lineWidth = 3.5; m.beginPath(); m.moveTo(3, -H * .78); m.lineTo(12, -H * .98); m.stroke();
      m.fillRect(9, -H * 1.0 - 12, 9, 11);
      m.restore(); m.restore();
      if (lantern) { h.save(); h.translate(cx, gy); h.scale(s, s); h.rotate(bend * .5); h.fillStyle = '#fff'; h.fillRect(10.5, -(52 - age * 6) * 1.0 - 10.5, 6, 8); h.restore(); }
    },
    tower(cx, gy, s) {   // the tower top she stands on: parapet, then rooftops of the sleeping town below
      m.save(); m.translate(cx, gy); m.scale(s, s);
      m.fillRect(-40, 0, 80, 60); for (let i = -40; i < 40; i += 12) m.fillRect(i, -7, 7, 8);
      m.restore();
    },
    roofs(gy, off) {
      const xs = [[-10, 30, 18], [22, 26, 24], [50, 34, 14], [86, 22, 22], [110, 30, 16], [142, 28, 26], [172, 34, 18], [206, 28, 22]];
      for (const [x0, w, hh] of xs) { const x = ((x0 - off) % 236 + 236) % 236 - 20; m.beginPath(); m.moveTo(x, gy); m.lineTo(x + w / 2, gy - hh); m.lineTo(x + w, gy); m.fill(); m.fillRect(x + 2, gy, w - 4, 40); m.fillRect(x + w * .7, gy - hh * .8, 4, 8); }
    },
    boy(cx, gy, s, hat, wob) {   // 하루's own shadow; with the fish lying on his head as a hat
      m.save(); m.translate(cx, gy); m.scale(s, s);
      m.fillRect(-4, -14, 3.5, 14); m.fillRect(1, -14, 3.5, 14);                                         // legs
      m.beginPath(); m.moveTo(-8, -14); m.lineTo(8, -14); m.lineTo(7, -36); m.lineTo(-7, -36); m.closePath(); m.fill();   // shirt
      m.beginPath(); m.arc(0, -44, 9.5, 0, 7); m.fill();                                                   // big head
      for (let i = -8; i <= 6; i += 4) { m.beginPath(); m.moveTo(i, -50); m.lineTo(i + 2, -56); m.lineTo(i + 4, -50); m.fill(); }   // messy hair
      m.lineWidth = 3.5; m.beginPath(); m.moveTo(6, -33); m.lineTo(15, -42); m.stroke();                   // arm up (holding the light)
      if (hat) { m.save(); m.translate(0, -58); m.rotate(Math.sin(wob) * .12); m.scale(.55, .55); m.beginPath(); m.ellipse(0, 0, 30, 14, 0, 0, 7); m.fill();
        m.beginPath(); m.moveTo(-26, 0); m.lineTo(-42, -12); m.lineTo(-38, 0); m.lineTo(-42, 12); m.closePath(); m.fill(); m.restore();
        m.save(); m.globalCompositeOperation = 'destination-out'; m.translate(0, -58); m.rotate(Math.sin(wob) * .12); m.scale(.55, .55); m.beginPath(); m.arc(17, -2, 3, 0, 7); m.fill(); m.restore(); }
      m.restore();
    },
    flyer(cx, cy, s, t) {   // young 노을 flying over the roofs, arms out, hair streaming
      m.save(); m.translate(cx, cy); m.scale(s, s); m.rotate(-.15 + Math.sin(t * 2) * .06);
      m.beginPath(); m.ellipse(0, 0, 20, 5, 0, 0, 7); m.fill(); m.beginPath(); m.arc(20, -2, 6, 0, 7); m.fill();
      m.beginPath(); m.moveTo(16, -4); m.quadraticCurveTo(2, -14 + Math.sin(t * 6) * 3, -12, -8); m.lineTo(14, 0); m.fill();   // hair
      m.lineWidth = 3; m.beginPath(); m.moveTo(10, 0); m.lineTo(30, 6 + Math.sin(t * 4) * 3); m.stroke(); m.beginPath(); m.moveTo(4, 2); m.lineTo(-6, 12); m.stroke();
      m.beginPath(); m.moveTo(-18, 0); m.lineTo(-32, 6 + Math.sin(t * 5 + 1) * 4); m.lineTo(-30, -4); m.fill();   // skirt trailing
      m.restore();
    },
  };

  // —— one frame: kind of play, its colour, strength, and play time ——
  const P = { cx: CW / 2, cy: CH * .5, rx: CW * .44, ry: CH * .46 };
  function draw(t, st) {
    // st: { on 0..1, col '#rrggbb', play: 'fish'|'teapots'|'flyer'|'hat'|'seasons'|'spin', u (local time), cx, cy, rx, ry }
    m.clearRect(0, 0, CW, CH); h.clearRect(0, 0, CW, CH); m.fillStyle = '#000'; m.strokeStyle = '#000';
    const u = st.u || 0, pl = st.play;
    if (pl === 'fish' || pl === 'spin') {
      const beat = (u * 1.25) % 3, dip = beat < 1 ? Math.sin(beat * Math.PI) : 0;   // waltz: one-two-three, a dip on one
      const ang = pl === 'spin' ? st.spin * Math.PI * 2 : u * .9;
      const cx = CW / 2 + (pl === 'spin' ? 0 : Math.cos(ang) * 34), cy = CH * .5 + (pl === 'spin' ? 0 : Math.sin(ang) * 12) + dip * 6;
      S.fish(cx, cy, pl === 'spin' ? 1.25 : 1.15, pl === 'spin' ? st.spin * Math.PI * 2 : Math.sin(u * 2.6) * .22 - dip * .12, { wave: Math.floor(u * 2.5) % 2 });
    }
    if (pl === 'teapots') for (let k = 0; k < 3; k++) { const ph = u * 3.2 - k * 1.05, hop = Math.max(0, Math.sin(ph)) * 18; S.teapot(52 + k * 48, CH * .62 - hop, .95, Math.sin(ph) * .35 * (k === 1 ? -1 : 1)); }
    if (pl === 'flyer') { S.roofs(CH * .9, u * 34); S.flyer(CW * .5 + Math.sin(u * .7) * 20, CH * .42 + Math.sin(u * 1.3) * 10, 1.25, u); }
    if (pl === 'hat') S.boy(CW * .5 + (st.bx || 0), CH * .97, 1.75, st.hat, u * 4);
    if (pl === 'seasons') {
      const age = st.age || 0;
      S.roofs(CH * 1.02, 0); S.tower(CW * .5, CH * .86, 1); S.keeper(CW * .5 - 4, CH * .86, 1.2, age, true);
      // the season: snow (dots drifting down), rain (slanted strokes), leaves (tumbling)
      const sea = st.season, rng = k => (Math.sin(k * 127.1) * 43758.5453) % 1;
      if (sea === 'snow') for (let k = 0; k < 46; k++) { const x = (Math.abs(rng(k)) * CW + Math.sin(u * 1.4 + k) * 6) % CW, y = (Math.abs(rng(k + 9)) * CH + u * (16 + (k % 5) * 3)) % CH; m.fillRect(x | 0, y | 0, 2, 2); }
      if (sea === 'rain') { m.lineWidth = 2; for (let k = 0; k < 64; k++) { const x = (Math.abs(rng(k)) * (CW + 40) - u * 30) % (CW + 40), y = (Math.abs(rng(k + 5)) * CH + u * 120) % (CH + 20) - 10; m.beginPath(); m.moveTo(x, y); m.lineTo(x - 4, y + 10); m.stroke(); } }
      if (sea === 'leaves') for (let k = 0; k < 18; k++) { const x = (Math.abs(rng(k)) * CW + u * 22 + Math.sin(u * 2 + k) * 10) % CW, y = (Math.abs(rng(k + 3)) * CH + u * 14) % CH; m.save(); m.translate(x, y); m.rotate(u * 3 + k); m.beginPath(); m.ellipse(0, 0, 4, 2, 0, 0, 7); m.fill(); m.restore(); }
      // the moon: a hole of brighter light
      h.fillStyle = '#fff'; h.beginPath(); h.arc(CW * .78, CH * .2, 9, 0, 7); h.fill();
    }
    // —— compose: the pool, dithered; silhouettes black; holes bright ——
    const md = m.getImageData(0, 0, CW, CH).data, hd = h.getImageData(0, 0, CW, CH).data, D = img.data, [cr, cg, cb] = hexRGB(st.col || '#ffffff');
    const pcx = st.pcx ?? P.cx, pcy = st.pcy ?? P.cy, rx = st.rx ?? P.rx, ry = st.ry ?? P.ry, on = st.on ?? 1, fl = st.flick ?? 1;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = (y * CW + x) * 4, dx = (x + .5 - pcx) / rx, dy = (y + .5 - pcy) / ry, r = Math.sqrt(dx * dx + dy * dy);
      let I = r < 1 ? (1 - r * r) : 0; I = Math.pow(I, .6) * on * fl;
      if (I <= 0) { D[i] = D[i + 1] = D[i + 2] = 0; D[i + 3] = 0; continue; }
      const q = Math.min(4, Math.floor(I * 4 + bayer(x, y)));   // four steps, ordered dither
      let L = q / 4;
      if (md[i + 3] > 110) L = 0;                                // shadow
      if (hd[i + 3] > 110 && md[i + 3] <= 110) L = Math.min(1.4, L + .6);
      D[i] = Math.min(255, cr * L); D[i + 1] = Math.min(255, cg * L); D[i + 2] = Math.min(255, cb * L); D[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); tex.needsUpdate = true;
    light.color.set(st.col || '#ffffff'); light.intensity = 3.2 * on * fl;
  }
  return { mesh, light, centre, draw };
}
