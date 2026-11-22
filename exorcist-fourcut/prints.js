// 네 컷 — every photograph in the film is rendered at load from the booth set itself (its own 4:3 camera), read back as
// continuous tone and printed: four-frame strips by error diffusion (Atkinson) at a fixed dot pitch; the 2003 school
// portrait for the missing poster stays continuous tone for the halftone screen. One world, many media.
import * as THREE from 'three';
import { Pipe } from './pipe.js';
import { atkinson, grayOf, bitsCanvas, canvasTex, printMat, halftoneMat, paperCanvas } from './kit.js';

export const FW = 320, FH = 240, SW = 360, SH = 1120;   // frame and strip canvas (px)
const DOTS = [180, 560];                                 // the strip's dot grid (one dot = 2 canvas px)
function readGray(renderer, rt, w, h) {
  const buf = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((h - 1 - y) * w + x) * 4, d = (y * w + x) * 4; const v = buf[s + 1]; id.data[d] = id.data[d + 1] = id.data[d + 2] = v; id.data[d + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
// strip layout: four frames on white, a footer (date stamp) — then dithered as one sheet of paper
function stripCanvas(frames, footer) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, SW, SH);
  frames.forEach((f, i) => { g.drawImage(f, 20, 20 + i * 260, FW, FH); });
  g.fillStyle = '#000'; g.font = '700 26px D2Coding'; g.textAlign = 'center'; g.fillText(footer, SW / 2, SH - 34);
  return c;
}
function printStrip(c, lift = 0.1) {
  const gr = grayOf(c, ...DOTS); for (let i = 0; i < gr.length; i++) gr[i] = Math.min(1, gr[i] * (1 + lift));
  const bits = bitsCanvas(atkinson(gr, ...DOTS), ...DOTS); const tex = canvasTex(bits);
  return { canvas: bits, tone: c, tex, mat: printMat(tex, { bias: 0.5, key: 'strip' }) };
}
export function makePrints(renderer, booth) {
  const pp = new Pipe(renderer, FW, FH); const rt = pp.target();
  const shoot = (s, o = {}) => { booth.state(s); booth.cams.frame.updateMatrixWorld(); pp.render(booth.scene, booth.cams.frame, rt, { lo: 0.04, hi: 0.85, ...o }); return readGray(renderer, rt, FW, FH); };
  const hideFor = [booth.mujin.root];   // nobody outside the booth shows in its frames
  const strip = (states, footer, o) => printStrip(stripCanvas(states.map(s => shoot({ mujin: false, ...s }, o)), footer));
  const P = {};
  // the prologue: 민아 and her boyfriend; the girl a step closer each frame; in the fourth, only her face at the lens
  P.mina = strip([{ who: 'couple', ghost: 0 }, { who: 'couple', ghost: 1 }, { who: 'couple', ghost: 2 }, { who: 'none', ghost: 3 }], '사진관 24  2026.11.19  02:14');
  // 서하's session, printed after the mirror: the girl alone in the last frame, caught by her own reflection
  // 서하's session, printed after the mirror: frames 1–3 with the girl closing in; frame 4 is the round mirror held to the
  // lens — and inside it, 서하's own face (the trick that caught the wrong one)
  const f4 = (() => {
    booth.state({ ghost: -1, seohaExpr: 'shout' }); const cam = booth.cams.frame, keep = [cam.position.clone(), cam.quaternion.clone(), cam.fov];
    cam.position.set(0, 1.62, -1.9); cam.lookAt(0, 1.6, -2.52); cam.fov = 34; cam.updateProjectionMatrix();
    pp.render(booth.scene, cam, rt, { lo: 0.04, hi: 0.85 }); const face = readGray(renderer, rt, FW, FH);
    cam.position.copy(keep[0]); cam.quaternion.copy(keep[1]); cam.fov = keep[2]; cam.updateProjectionMatrix();
    const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, FW, FH);
    g.save(); g.beginPath(); g.arc(FW / 2, FH / 2, 108, 0, Math.PI * 2); g.clip(); g.translate(FW, 0); g.scale(-1, 1); g.drawImage(face, 0, 0, FW, FH); g.restore();
    g.strokeStyle = '#ddd'; g.lineWidth = 8; g.beginPath(); g.arc(FW / 2, FH / 2, 112, 0, Math.PI * 2); g.stroke();
    return c;
  })();
  P.trap = printStrip(stripCanvas([shoot({ ghost: 0, mujin: false }), shoot({ ghost: 1, mujin: false }), shoot({ ghost: 2, mujin: false }), f4], '사진관 24  2026.11.21  02:21'));
  // the fifth sheet: 서하 alone, stern three times, and in the fourth frame she smiles
  P.fifth = strip([{ ghost: -1 }, { ghost: -1 }, { ghost: -1 }, { ghost: -1, seohaExpr: 'smile' }], '사진관 24  2026.11.21  02:22');
  // the wall: other customers (and empty versions for when they come back out)
  const wallStates = [
    [{ who: 'couple' }, { who: 'couple' }, { who: 'couple' }, { who: 'couple' }],
    [{ who: 'seoha', seohaExpr: 'smile' }, { who: 'seoha' }, { who: 'seoha', seohaExpr: 'smile' }, { who: 'seoha' }],
    [{ who: 'couple', ghost: 0 }, { who: 'couple' }, { who: 'couple' }, { who: 'couple' }],
  ];
  P.wall = wallStates.map((st, i) => strip(st, `사진관 24  ${['2024.03.02', '2025.07.14', '2019.12.24'][i]}`));
  P.blank = strip([{ who: 'none' }, { who: 'none' }, { who: 'none' }, { who: 'none' }], '사진관 24');
  // the poster portrait: the girl in 2003, face uncovered, for the halftone screen
  const portrait = shoot({ who: 'none', ghost: 1, unveil: true });
  P.portrait = { canvas: portrait, tex: canvasTex(portrait) };
  booth.state({});
  return P;
}
// the missing poster: text on paper (sharp print) + the portrait under a 45° halftone screen
export function posterMats(P) {
  const page = paperCanvas(600, 840, (g, put) => {
    put('p1', '찾습니다', 300, 120, 'serif', 110, { align: 'center', weight: 800 });
    g.fillStyle = '#000'; g.fillRect(60, 160, 480, 6);
    put('p2', '2003년 11월 21일 새벽', 300, 700, 'serif', 46, { align: 'center', weight: 800 });
    put('p3', '이 사진관 앞에서', 300, 770, 'serif', 46, { align: 'center', weight: 800 });
  });
  return { page, paper: printMat(canvasTex(page.canvas), { bias: 0.55, text: true, key: 'poster' }), photo: halftoneMat(P.portrait.tex, 40) };
}
