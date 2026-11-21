// 네 컷 — the cast as 3D figures built from a few thick primitives (the 1-bit medium reads silhouettes and hard light,
// not fine detail). Units: metres, feet at y=0, facing +z. Each figure has a pose (arms, head turn) and a face (expr).
import * as THREE from 'three';
import { V, grey, add } from './kit.js';

const SKIN = 0.78;
const M = {
  skin: grey(SKIN, { r: 0.75 }), skinD: grey(0.6, { r: 0.8 }),
  hair: grey(0.06, { r: 0.55 }), hairSoft: grey(0.1, { r: 0.6 }),
  coat: grey(0.16, { r: 0.85 }), shirt: grey(0.9, { r: 0.8 }),
  robe: grey(0.55, { r: 0.9 }), vest: grey(0.1, { r: 0.7 }), bead: grey(0.18, { r: 0.35 }),
  hood: grey(0.42, { r: 0.9 }), jeans: grey(0.25, { r: 0.9 }),
  blazer: grey(0.12, { r: 0.85 }), skirt: grey(0.2, { r: 0.9 }), sock: grey(0.92, { r: 0.9 }), shoe: grey(0.05, { r: 0.4 }),
  feat: grey(0.04, { r: 0.6 }), lip: grey(0.3, { r: 0.7 }), white: grey(0.95, { r: 0.7 }), brass: grey(0.7, { r: 0.3, m: 0.6 }),
};
export { M as MATS };

function cap(parent, r, len, mat, o) { const m = add(parent, new THREE.CapsuleGeometry(r, len, 4, 10), mat, o); return m; }
function limbGroup(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }

// a jointed arm: shoulder group (rotation) → upper arm → elbow group → forearm → hand
function arm(root, side, sh, len1, len2, sleeve, o = {}) {
  const S = limbGroup(root, side * sh.x, sh.y, sh.z);
  const up = cap(S, o.r1 ?? 0.05, len1 - 0.1, sleeve); up.position.y = -len1 / 2;
  const E = limbGroup(S, 0, -len1, 0);
  const fo = cap(E, o.r2 ?? 0.045, len2 - 0.1, o.cuffMat || sleeve); fo.position.y = -len2 / 2;
  const H = limbGroup(E, 0, -len2, 0);
  const hand = add(H, new THREE.SphereGeometry(0.045, 10, 8), M.skin); hand.scale.set(0.9, 1.25, 0.6); hand.position.y = -0.04;
  return { S, E, H };
}

// face features on a head of radius r at local origin; returns handles to change expression
function face(head, r, o = {}) {
  const F = new THREE.Group(); head.add(F);
  const z = r * 0.93, ey = r * 0.12, ex = r * 0.36;
  const eyes = [-1, 1].map(s => { const e = add(F, new THREE.BoxGeometry(r * 0.34, r * (o.eyeH ?? 0.07), r * 0.1), M.feat, { cast: false }); e.position.set(s * ex, ey, z - r * 0.05); e.rotation.y = s * 0.32; return e; });
  const brows = [-1, 1].map(s => { const b = add(F, new THREE.BoxGeometry(r * 0.42, r * (o.browH ?? 0.06), r * 0.1), M.feat, { cast: false }); b.position.set(s * ex, ey + r * 0.24, z - r * 0.06); b.rotation.y = s * 0.32; b.rotation.z = s * (o.browTilt ?? 0.08); return b; });
  const nose = add(F, new THREE.ConeGeometry(r * 0.11, r * 0.34, 4), o.skinMat || M.skin); nose.rotation.x = Math.PI / 2; nose.rotation.z = Math.PI / 4; nose.position.set(0, -r * 0.12, r * 1.0);
  const mouth = add(F, new THREE.BoxGeometry(r * 0.42, r * 0.05, r * 0.08), M.lip, { cast: false }); mouth.position.set(0, -r * 0.44, z - r * 0.08);
  // the smile: a short arc that replaces the straight mouth
  const smile = add(F, new THREE.TorusGeometry(r * 0.26, r * 0.035, 6, 14, Math.PI * 0.75), M.feat, { cast: false }); smile.rotation.z = Math.PI + Math.PI * 0.125; smile.position.set(0, -r * 0.3, z - r * 0.06); smile.visible = false;
  return {
    F, set(expr) {
      const closed = expr === 'closed', stern = expr === 'stern', sm = expr === 'smile', shout = expr === 'shout';
      eyes.forEach(e => { e.scale.y = closed ? 0.35 : stern ? 0.8 : 1; });
      brows.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.z = s * (stern || shout ? -0.22 : sm ? 0.16 : (o.browTilt ?? 0.08)); b.position.y = ey + r * (stern || shout ? 0.2 : 0.25); });
      mouth.visible = !sm; smile.visible = sm; mouth.scale.set(shout ? 0.8 : 1, shout ? 4 : 1, 1);
    }
  };
}

// —— the cast ——
export function figure(kind, o = {}) {
  const root = new THREE.Group(); const P = { root, kind };
  const tall = { seoha: 1.66, mujin: 1.76, jieun: 1.6, ghost: 1.58, mina: 1.62, boy: 1.76 }[kind] || 1.65;
  const k = tall / 1.66; root.scale.setScalar(k);
  const body = new THREE.Group(); root.add(body); P.body = body;
  const hipY = 0.92, shY = 1.4, headY = 1.58;
  const wide = kind === 'mujin' ? 1.18 : kind === 'boy' ? 1.1 : 1;
  // legs (hidden under long coats/robes but they keep the silhouette when sitting or walking)
  const legMat = kind === 'ghost' ? M.sock : kind === 'mujin' ? M.robe : kind === 'seoha' ? M.coat : M.jeans;
  P.legs = [-1, 1].map(s => { const L = limbGroup(body, s * 0.09 * wide, hipY, 0); const l = cap(L, 0.065, 0.74, legMat); l.position.y = -0.44; const f = add(L, new THREE.BoxGeometry(0.1, 0.07, 0.24), M.shoe); f.position.set(0, -0.88, 0.05); return L; });
  // torso + clothes
  const torsoMat = { seoha: M.coat, mujin: M.robe, jieun: M.hood, ghost: M.blazer, mina: M.hood, boy: M.jeans }[kind] || M.coat;
  const torso = add(body, new THREE.CylinderGeometry(0.17 * wide, 0.14 * wide, shY - hipY + 0.06, 14), torsoMat); torso.position.y = (shY + hipY) / 2; torso.scale.z = 0.72;
  [-1, 1].forEach(s => { const sh = add(body, new THREE.SphereGeometry(0.075 * wide, 12, 10), torsoMat); sh.position.set(s * 0.17 * wide, shY - 0.03, 0); });
  if (kind === 'seoha') {   // long coat skirt, open collar over a white shirt, the brass bell at the hip
    const skirt = add(body, new THREE.CylinderGeometry(0.17, 0.27, 0.62, 16, 1, true), M.coat); skirt.position.y = hipY - 0.27; skirt.scale.z = 0.8;
    const shirt = add(body, new THREE.BoxGeometry(0.1, 0.22, 0.02), M.shirt); shirt.position.set(0, shY - 0.1, 0.12);
    [-1, 1].forEach(s => { const lap = add(body, new THREE.BoxGeometry(0.07, 0.3, 0.025), M.coat); lap.position.set(s * 0.065, shY - 0.13, 0.125); lap.rotation.z = s * 0.25; });
    const bell = add(body, new THREE.SphereGeometry(0.035, 10, 8), M.brass); bell.position.set(0.17, hipY - 0.02, 0.06);
  }
  if (kind === 'mujin') {   // long robe to the ankles, black padded vest, a loop of big beads on the chest
    const skirt = add(body, new THREE.CylinderGeometry(0.19 * wide, 0.32, 0.86, 16, 1, true), M.robe); skirt.position.y = hipY - 0.38; skirt.scale.z = 0.8;
    [-1, 1].forEach(s => { const v = add(body, new THREE.BoxGeometry(0.15, 0.5, 0.26), M.vest); v.position.set(s * 0.12 * wide, shY - 0.24, 0.0); });
    const n = 18; for (let i = 0; i < n; i++) { const a = Math.PI * (0.12 + 0.76 * i / (n - 1)); const b = add(body, new THREE.SphereGeometry(0.022, 8, 6), M.bead, { cast: false }); b.position.set(Math.cos(a) * 0.12, shY - 0.04 - Math.sin(a) * 0.2, 0.13 + Math.sin(a) * 0.02); }
  }
  if (kind === 'ghost') {   // 2003 school blazer, a ribbon, a pleated skirt (flat-shaded segments read as pleats), white socks
    const skirt = add(body, new THREE.CylinderGeometry(0.16, 0.25, 0.4, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, flatShading: true, side: THREE.DoubleSide })); skirt.position.y = hipY - 0.16;
    const rib = add(body, new THREE.BoxGeometry(0.1, 0.05, 0.03), M.white); rib.position.set(0, shY - 0.06, 0.125);
    const shirt = add(body, new THREE.BoxGeometry(0.08, 0.12, 0.02), M.shirt); shirt.position.set(0, shY - 0.1, 0.12);
  }
  if (kind === 'jieun' || kind === 'mina') { const hood = add(body, new THREE.TorusGeometry(0.11, 0.05, 8, 16), M.hood); hood.position.set(0, shY + 0.03, -0.03); hood.rotation.x = Math.PI / 2 + 0.3; }
  // arms
  const sleeve = torsoMat, sh = { x: 0.2 * wide, y: shY - 0.02, z: 0 };
  P.armL = arm(body, -1, sh, 0.3, 0.27, sleeve, { cuffMat: kind === 'seoha' ? M.coat : sleeve });
  P.armR = arm(body, 1, sh, 0.3, 0.27, sleeve, { cuffMat: kind === 'seoha' ? M.coat : sleeve });
  if (kind === 'mujin') {   // the beads wound round his right fist
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = add(P.armR.H, new THREE.SphereGeometry(0.018, 8, 6), M.bead, { cast: false }); b.position.set(Math.cos(a) * 0.05, -0.03 + Math.sin(a * 2) * 0.01, Math.sin(a) * 0.035); }
    P.beads = [];
  }
  // neck + head
  const neck = add(body, new THREE.CylinderGeometry(0.045 * wide, 0.05 * wide, 0.12, 10), kind === 'mujin' ? M.skin : M.skin); neck.position.y = shY + 0.06;
  const headG = limbGroup(body, 0, headY, 0.01); P.head = headG;
  const r = 0.105;
  const head = add(headG, new THREE.SphereGeometry(r, 20, 16), M.skin); head.scale.set(kind === 'mujin' ? 1.04 : 0.92, 1.14, 1.0);
  const jaw = add(headG, new THREE.SphereGeometry(r * 0.78, 16, 12), M.skin); jaw.position.set(0, -r * 0.42, r * 0.12); jaw.scale.set(kind === 'mujin' ? 1.1 : 0.9, 0.8, 0.85);
  [-1, 1].forEach(s => { const ear = add(headG, new THREE.SphereGeometry(r * 0.2, 8, 6), M.skin); ear.position.set(s * r * 0.94, 0, -r * 0.05); ear.scale.set(0.5, 1, 0.8); });
  P.face = face(headG, r, kind === 'mujin' ? { eyeH: 0.06, browH: 0.11, browTilt: 0.12 } : {});
  // hair
  const hair = new THREE.Group(); headG.add(hair); P.hair = hair;
  // hair = a crown cap (to the hairline) + a back half-shell (behind the ears, down to the nape); the face stays open
  const shell = (phi, theta, s = 1.07) => {
    const capM = add(hair, new THREE.SphereGeometry(r * s, 20, 10, 0, Math.PI * 2, 0, 0.95 + phi * 0.4), M.hair); capM.scale.set(0.96, 1.16, 1.06);
    const backM = add(hair, new THREE.SphereGeometry(r * (s + 0.01), 20, 14, Math.PI, Math.PI, 0, theta), M.hair); backM.scale.set(0.97, 1.17, 1.08);
    return capM; };
  if (kind === 'seoha') {
    shell(-0.35, 1.9);
    const tail = add(hair, new THREE.CylinderGeometry(0.04, 0.03, 0.42, 10), M.hair); tail.position.set(0, -0.26, -0.1); tail.rotation.x = 0.12;   // the low tail down her back
    const tie = add(hair, new THREE.TorusGeometry(0.045, 0.012, 6, 12), M.white); tie.position.set(0, -0.06, -0.1); tie.rotation.x = Math.PI / 2 + 0.12;
    [-1, 1].forEach(s => { const lk = add(hair, new THREE.BoxGeometry(0.04, 0.2, 0.05), M.hair); lk.position.set(s * 0.085, -0.04, 0.05); });   // side locks framing the face
    const bang = add(hair, new THREE.BoxGeometry(0.17, 0.05, 0.05), M.hair); bang.position.set(0, 0.075, 0.085); bang.rotation.x = 0.3;
  } else if (kind === 'jieun' || kind === 'mina') {
    shell(-0.25, 2.1, 1.1);
    const bang = add(hair, new THREE.BoxGeometry(0.19, 0.06, 0.05), M.hair); bang.position.set(0, 0.07, 0.09); bang.rotation.x = 0.25;
  } else if (kind === 'ghost') {   // long straight hair over the face: you see the chin and a sliver of mouth at most
    shell(-0.2, 2.3, 1.08);
    const back = add(hair, new THREE.BoxGeometry(0.22, 0.6, 0.06), M.hair); back.position.set(0, -0.28, -0.08);
    const front = add(hair, new THREE.BoxGeometry(0.2, 0.17, 0.03), M.hair); front.position.set(0, 0.04, 0.112); P.veil = front;   // to the nose: the mouth shows
    [-1, 1].forEach(s => { const side = add(hair, new THREE.BoxGeometry(0.05, 0.55, 0.12), M.hair); side.position.set(s * 0.1, -0.2, 0.02); });
  } else if (kind === 'boy') {
    shell(-0.3, 1.4, 1.08);
  }
  // pose / expression
  P.pose = (p = {}) => {
    const a = (A, v) => { A.S.rotation.set(v[0] || 0, v[1] || 0, v[2] || 0); A.E.rotation.set(v[3] || 0, 0, 0); };
    a(P.armL, p.armL || [0.05, 0, 0.12, -0.15]); a(P.armR, p.armR || [0.05, 0, -0.12, -0.15]);
    headG.rotation.set(p.headX || 0, p.headY || 0, p.headZ || 0);
    body.rotation.set(p.lean || 0, 0, 0);
    if (p.walk != null) { const w = Math.sin(p.walk * Math.PI * 2) * 0.35; P.legs[0].rotation.x = w; P.legs[1].rotation.x = -w; } else P.legs.forEach(L => L.rotation.x = 0);
    P.face.set(p.expr || 'neutral');
  };
  P.pose({});
  return P;
}
