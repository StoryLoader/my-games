// 악몽을 지키는 파수꾼 2 — A 할머니의 첫 꿈 — page contract: window.DUR, window.render(t), window.READY, window.EV, window.TEXTS
// (the library's 2.5D Pixel Art engine; this film is the tilt-shift cut: the band follows the subject's screen height)
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, SHOTS, T, VO, shotAt } from './story.js';
import { buildTown } from './town.js';
import { buildTower } from './tower.js';
import { drawOverlay, overlayReady, texts } from './ui.js';

const [W, H] = window.FILM_SIZE || [innerWidth, innerHeight], Q = new URLSearchParams(location.search);   // 1920×1080, or 1080×1920 for the vertical cut (--size 1080x1920)
const SS = +(Q.get('ss') ?? 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(32, W / H, .3, 2000);
const ONLY = Q.get('only');
const sets = {};
if (!ONLY || ONLY === 'town') sets.town = buildTown();
if (!ONLY || ONLY === 'tower') sets.tower = buildTower();
const post = makePost(renderer, Object.values(sets)[0].scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms; V.amt.value = .62; V.warm.value = .08; V.contrast.value = .2; V.sat.value = 1.05;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
await overlayReady();

const TILT = !Q.has('notilt'), _v = new THREE.Vector3();
const TILT_FIXED = { turn: .5, wake: .5, title: .55 };
function tiltCenter(S, shot) {
  if (TILT_FIXED[shot.id] != null) return TILT_FIXED[shot.id];
  const f = S.focus && S.focus(); if (!f) return .45;
  camera.updateMatrixWorld(); _v.copy(f).project(camera);
  return Math.min(.8, Math.max(.2, _v.y * .5 + .5));
}

window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t), S = sets[shot.set];
  if (S) {
    post.dof.scene = S.scene;
    post.vig.uniforms.fade.value = 1; post.bloom.strength = .6; post.bloom.threshold = .82; renderer.toneMappingExposure = 1.2;
    V.warm.value = .08; V.sat.value = 1.05; V.amt.value = .62; V.contrast.value = .2;
    S.update(t, shot, camera, post, renderer);
    if (TILT) { post.dof.tiltAmt = 16; post.dof.tiltC = tiltCenter(S, shot); post.dof.tiltW = S.tiltW ? S.tiltW() : .08; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 22); V.sat.value *= 1.14; V.contrast.value = .26; }
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t);
};
window.TEXTS = texts;
// sound events for the mixer (tools/export.mjs → timeline.json): the same times the picture uses
window.EV = [
  ...VO.map(v => ({ t: v.t, type: 'voice', id: v.id, dlg: !!v.dlg })),
  { t: T.bloom, type: 'bloom' }, { t: T.turn, type: 'turn' },
  ...T.collect.map(t => ({ t, type: 'collect' })), { t: T.full, type: 'crack' },
  { t: T.shut, type: 'shutters' }, { t: T.rattle[0], type: 'rattle' }, { t: T.keyhole, type: 'keyhole' }, { t: T.dive, type: 'dive' }, { t: T.catch, type: 'catch' },
  { t: T.touch, type: 'touch' }, { t: T.walk[0], type: 'walk' }, { t: T.untie, type: 'untie' }, { t: T.pull, type: 'pull' }, { t: T.bell, type: 'bell' },
  ...T.snores.map(t => ({ t, type: 'snore' })), { t: T.doorOut[0], type: 'doorTower' }, { t: T.stretch[0], type: 'stretch' },
  ...(sets.town ? sets.town.events : []), ...(sets.tower ? sets.tower.events : []),
].sort((a, b) => a.t - b.t);
window.READY = true;
