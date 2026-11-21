// The tower set of 「악몽을 지키는 파수꾼 2 — 열두 번째 등불」: the same round stone room as the first two films, now the whole stage.
// A shelf of twelve lanterns (two rows of six; the twelfth — lower row, right end — has a scratched glass), a small low window to
// its right that is found ajar every morning, the table 하루 hides under, 노을 asleep in her chair. Three nights and their mornings
// are lit apart (moon and candle at night, a pink-gold slit at dawn). The shadow play — the huge wings, then the dog running —
// is drawn into a pixel canvas on the wall behind the shelf (the style's native move: a new light makes the shadows jump).
import * as THREE from 'three';
import { PX, ramp, h2, texOf, woodPlanks, rock, glow, blob } from './px.js';
import { mats, mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeChar, moths, dogPixels, SPX } from './chars.js';
import { T, SHOTS, clamp, seg, ss } from './story.js';
import { track, lerp } from '/core/lib.js';

const VIOLET = new THREE.Color('#b46cff'), AMBER = new THREE.Color('#ffb050');
const FOVK = (window.FILM_SIZE ? window.FILM_SIZE[1] > window.FILM_SIZE[0] : innerHeight > innerWidth) ? 1.6 : 1;   // the vertical cut: a taller lens
const inShot = (t, id) => { const s = SHOTS.find(x => x.id === id); return t >= s.a && t < s.b; };

// a canvas texture redrawn when its content changes (pixel look: low resolution, nearest filtering)
function liveCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const tex = texOf(c); return { c, g, tex, w, h }; }

export function buildTower() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#1a1210', .03);
  scene.background = new THREE.Color('#05040a');
  const stone = mat(rock(96, 96, { seed: 31, cols: ['#141218', '#221f27', '#332f38', '#47424c', '#5d5862'] }));
  const R0 = 4.4;
  const wallG = new THREE.CylinderGeometry(R0, R0, 8, 28, 1, true).translate(0, 4, 0);
  const wall = mesh(wallG, stone); wall.material = stone.clone(); wall.material.side = THREE.BackSide; scene.add(wall);
  const floor = mesh(new THREE.CylinderGeometry(R0, R0, .2, 28).translate(0, -.1, 0), mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 12 }))); scene.add(floor);
  for (let i = -2; i <= 2; i++) { const b = box(9, .3, .3, MM.beam, { cast: false }); b.position.set(0, 7.4, i * 1.6); scene.add(b); }
  const toC = a => Math.atan2(-Math.cos(a), -Math.sin(a));   // rotation.y that turns local +z toward the room's centre from angle a

  // —— the shelf: two rows of six; counted top row left→right (1–6), then the lower row (7–12) ——
  const SH = [], arc = [Math.PI * 1.22, Math.PI * 1.78], TIERS = [1.6, .55];
  TIERS.forEach((y, row) => {
    for (let k = 0; k < 6; k++) {
      const a = arc[0] + (arc[1] - arc[0]) * (k + .5) / 6, r = R0 - .45;
      const p = box(1.25, .1, .55, MM.plank); p.position.set(Math.cos(a) * r, y, Math.sin(a) * r); p.rotation.y = toC(a); scene.add(p);
      const L = new THREE.Group(); L.position.set(Math.cos(a) * (r - .05), y + .1, Math.sin(a) * (r - .05)); L.rotation.y = toC(a);
      L.add(box(.34, .06, .34, MM.beam, { cast: false }));
      const g = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .4, 8).translate(0, .26, 0), new THREE.MeshStandardMaterial({ color: '#241a30', emissive: VIOLET, emissiveIntensity: 1.6, roughness: .3 })); L.add(g);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(.21, .16, 8).translate(0, .54, 0), new THREE.MeshStandardMaterial({ color: '#26262e', roughness: .6 })); L.add(cap);
      scene.add(L); SH.push({ L, g, cap, a, y, k, row, n: row * 6 + k + 1, ph: h2(k, row, 3) * 6 });
    }
  });
  const L12 = SH.find(s => s.n === 12);
  // the scratch on the twelfth glass: three pale diagonal strokes (a clue the camera comes back to)
  { const P = new PX(16, 20), W = '#d8c8f0'; for (let i = 0; i < 3; i++) for (let j = 0; j < 7; j++) P.set(4 + i * 3 + (j >> 1), 6 + j, W, 210 - j * 12);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(.22, .28), new THREE.MeshBasicMaterial({ map: texOf(P.done()), transparent: true, opacity: .8, depthWrite: false, fog: false }));
    sc.position.set(0, .27, .158); L12.L.add(sc); L12.scratch = sc; }
  const L12home = L12.L.position.clone(), L12glassC = L12home.clone().add(new THREE.Vector3(0, .26, 0));
  const shelfLights = [-.5, .5].map(i => { const L = new THREE.PointLight(VIOLET, 4, 6, 2); const a = Math.PI * 1.5 + i * .5; L.position.set(Math.cos(a) * 2.7, 1.4, Math.sin(a) * 2.7); scene.add(L); return L; });
  // nightmares asleep in the lanterns: two violet specks behind each closed glass
  const kept = moths(SH.length * 2, (i, t, o) => { const s = SH[i >> 1]; o.a = s.closed ? 1 : 0; const ph = i * 1.9, c = s.L.position;
    o.x = c.x + Math.sin(t * 2.2 + ph) * .06; o.y = c.y + .27 + Math.sin(t * 3.1 + ph) * .07; o.z = c.z + Math.cos(t * 1.7 + ph) * .06; o.s = .09; o.f = Math.floor(t * 6 + i) % 2; });
  scene.add(kept);

  // —— the small low window right of the shelf (her way in), its pane on a hinge ——
  const aw = Math.PI * 1.93, WP = new THREE.Vector3(Math.cos(aw) * (R0 - .03), .95, Math.sin(aw) * (R0 - .03));
  const winG = new THREE.Group(); winG.position.copy(WP); winG.rotation.y = toC(aw); scene.add(winG);
  const night = new THREE.Mesh(new THREE.PlaneGeometry(.62, .56), new THREE.MeshBasicMaterial({ color: '#41609c', fog: false })); night.position.z = .012; winG.add(night);   // in front of the wall (the wall has no hole): reads as the night outside
  for (const [w, h, x, y] of [[.74, .07, 0, .31], [.74, .07, 0, -.31], [.07, .66, -.34, 0], [.07, .66, .34, 0]]) { const f = box(w, h, .12, MM.beam, { cast: false }); f.position.set(x, y - h / 2, .06); winG.add(f); }
  const hinge = new THREE.Group(); hinge.position.set(-.3, 0, .05); winG.add(hinge);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(.6, .54), new THREE.MeshStandardMaterial({ color: '#3a4766', emissive: '#22305a', emissiveIntensity: .6, roughness: .2, transparent: true, opacity: .85, side: THREE.DoubleSide })); pane.position.x = .3; hinge.add(pane);
  const sill = box(.8, .05, .3, MM.plank, { cast: false }); sill.position.set(0, -.36, .15); winG.add(sill);
  const winGlow = glow('#a8c0ff', 1.3, 1.0); winGlow.position.copy(WP).multiplyScalar(.95); scene.add(winGlow);
  const winSpot = new THREE.SpotLight('#8fa8e0', 0, 7, .6, .7, 1.4); winSpot.position.copy(WP).multiplyScalar(.98); winSpot.target.position.set(2.6, 0, -1.6); scene.add(winSpot, winSpot.target);

  // —— 노을's chair (left), the table (right, by the window: 하루 hides under it), the candle ——
  const chair = new THREE.Group(); chair.add(box(.6, .5, .6, MM.plank)); const back = box(.6, .9, .1, MM.plank); back.position.set(0, .5, -.25); chair.add(back); chair.position.set(-2.0, 0, 1.15); chair.rotation.y = .75; scene.add(chair);
  const TB = new THREE.Vector3(1.95, 0, .45), table = new THREE.Group(); table.position.copy(TB); table.rotation.y = -.55; scene.add(table);
  const top = box(1.35, .06, .78, MM.plankDark); top.position.y = .74; table.add(top);
  for (const [x, z] of [[-.6, -.33], [.6, -.33], [-.6, .33], [.6, .33]]) { const l = box(.07, .74, .07, MM.beam); l.position.set(x, 0, z); table.add(l); }
  const book = box(.36, .07, .28, MM.beam, { cast: false }); book.position.set(-.3, .8, .05); table.add(book);
  const candleBase = new THREE.Vector3(2.2, .8, .3);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1, 6).translate(0, .5, 0), new THREE.MeshStandardMaterial({ color: '#efe6d0', emissive: '#ffcf8a', emissiveIntensity: .3 })); candle.position.copy(candleBase); scene.add(candle);
  const candleL = new THREE.PointLight('#ffb050', 3.2, 6, 2); scene.add(candleL);
  const candleG = glow('#ffc070', .5, 1.4); scene.add(candleG);
  // the high slit and its beam: moonlight at night, a pink-gold dawn in the mornings
  const winA = Math.PI * .92, winP = new THREE.Vector3(Math.cos(winA) * (R0 - .02), 4.6, Math.sin(winA) * (R0 - .02));
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.6), new THREE.MeshBasicMaterial({ color: '#9fb8ff' })); slit.position.copy(winP); slit.lookAt(0, 4.6, 0); scene.add(slit);
  const beam = beamCard(6.5, .6, 2.2, '#8fa8e0', { k: .32, fall: 1.1 }); scene.add(beam);
  const sky = new THREE.SpotLight('#8fa8e0', 22, 14, .45, .6, 1.5); sky.position.copy(winP); sky.target.position.set(.9, 0, -.8); scene.add(sky, sky.target);
  const hemi = new THREE.HemisphereLight('#3a3050', '#0a0808', .55); scene.add(hemi);

  // —— characters ——
  const N = makeChar('noeul'), Hr = makeChar('haru'), Bm = makeChar('bomi'); scene.add(N.root, Hr.root, Bm.root);
  const fill = new THREE.PointLight('#9fb2e8', 1.2, 6, 2); scene.add(fill);
  // 하루's lantern light: the only shadow-casting light here — when he uncovers it the shadows jump
  const hl = new THREE.PointLight(AMBER, 0, 9, 2); hl.castShadow = true; hl.shadow.bias = -.004; hl.shadow.mapSize.set(512, 512); scene.add(hl);
  const hlG = glow('#ffc070', .8, 1.1); scene.add(hlG);
  // his lantern standing on the floor (the first night; at the end beside the two children)
  const floorLan = new THREE.Group(); floorLan.add(box(.26, .05, .26, MM.beam, { cast: false }));
  const flGlass = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .28, 8).translate(0, .19, 0), new THREE.MeshStandardMaterial({ color: '#3a2a14', emissive: AMBER, emissiveIntensity: 2.2 })); floorLan.add(flGlass);
  const flCap = new THREE.Mesh(new THREE.ConeGeometry(.16, .12, 8).translate(0, .39, 0), new THREE.MeshStandardMaterial({ color: '#26262e' })); floorLan.add(flCap); scene.add(floorLan);
  // her nightmare out of the open lantern: one violet moth hovering above it
  const herMoth = moths(1, (i, t, o) => { o.a = 0; if (!(t > T.open3 + .3 && t < 110.5)) return; const p = held.lan; o.x = p.x + Math.sin(t * 2.3) * .05; o.y = p.y + .3 + Math.sin(t * 3.1) * .05; o.z = p.z + Math.cos(t * 1.9) * .05; o.a = ss(seg(t, T.open3 + .3, T.open3 + .9)); o.s = .16; o.f = Math.floor(t * 7) % 2; });
  scene.add(herMoth);
  const held = { lan: new THREE.Vector3() };

  // —— flour on the floor (from the second night) with tiny footprints from the window to the shelf (from the second morning) ——
  const FL = liveCanvas(160, 112), flourM = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshStandardMaterial({ map: FL.tex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  const fA = new THREE.Vector3(WP.x - .35, 0, WP.z - .1), fB = new THREE.Vector3(L12home.x - .45, 0, L12home.z + .45), fMid = fA.clone().add(fB).multiplyScalar(.5);
  flourM.rotation.x = -Math.PI / 2; flourM.rotation.z = Math.atan2(-(fB.z - fA.z), fB.x - fA.x); flourM.position.set(fMid.x, .012, fMid.z); flourM.renderOrder = 2; scene.add(flourM);
  let flourKey = '';
  function drawFlour(cov, prints) {
    const key = cov.toFixed(2) + '/' + prints; if (key === flourKey) return; flourKey = key;
    const { g, w, h } = FL; g.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x - w / 2) / (w * .48), v = (y - h / 2) / (h * .42), r = u * u + v * v + (h2(x >> 2, y >> 2, 5) - .5) * .5;
      const reach = (x / w) <= cov * 1.15;   // he sprinkles from the window end toward the shelf
      if (r < 1 && reach) { const k = h2(x, y, 9); if (k > .18) { g.fillStyle = `rgba(242,238,230,${(.5 + .45 * k) * (1 - r * .5)})`; g.fillRect(x, y, 1, 1); } }
    }
    if (prints) for (let i = 0; i < 8; i++) {   // a child's steps, left/right, from the window (x≈12) to the shelf (x≈146)
      const px = 12 + i * 18, py = h / 2 + (i % 2 ? -8 : 8) + Math.sin(i * .7) * 2, c = 'rgba(46,34,40,.95)';
      g.fillStyle = c; g.fillRect(px, py - 2, 4, 4); g.fillRect(px + 5, py - 3, 5, 6); g.fillRect(px + 4, py - 1, 1, 2);
      g.fillRect(px + 11, py - 3, 1, 1); g.fillRect(px + 11, py - 1, 1, 1); g.fillRect(px + 11, py + 1, 1, 1);
    }
    FL.tex.needsUpdate = true;
  }
  const dust = particles(90, (i, t, o) => { o.a = 0; if (t < T.flour[0] || t > T.flour[1] + .8) return; const u = ((t - T.flour[0]) * 1.4 + i / 90 * 1.2) % 1.2; if (u > 1) return;
    const sx = held.hand.x + (h2(i, 1, 2) - .5) * .25, sz = held.hand.z + (h2(i, 2, 2) - .5) * .25;
    o.x = sx + (h2(i, 3, 2) - .5) * u * .6; o.y = held.hand.y - u * held.hand.y; o.z = sz + (h2(i, 4, 2) - .5) * u * .6; o.a = .6 * (1 - u); o.s = .035; o.r = 1; o.g = .97; o.b = .92; }, { blend: THREE.NormalBlending });
  scene.add(dust); held.hand = new THREE.Vector3();

  // —— the thread across the lower shelf, a little bell by the twelfth ——
  const thA = SH.find(s => s.n === 7).L.position.clone(), thB = L12home.clone();
  [thA, thB].forEach(p => { const d = new THREE.Vector3(-p.x, 0, -p.z).normalize().multiplyScalar(.32); p.add(d); p.y = .86; });
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1, 4), new THREE.MeshBasicMaterial({ color: '#e8e0d0' })); scene.add(thread);
  const bell = new THREE.Group(); const bb = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6, 0, Math.PI * 2, 0, Math.PI * .6).translate(0, -.07, 0), new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: .8, roughness: .3, emissive: '#3a2a08' }));
  bell.add(bb); const clap = new THREE.Mesh(new THREE.SphereGeometry(.016, 6, 4).translate(0, -.12, 0), bb.material); bell.add(clap);
  bell.position.copy(thB).lerp(thA, .12); scene.add(bell);

  // —— the shadow play on the wall behind the shelf: a warm pool from 하루's lantern; the huge wings; the girl; the dog running ——
  const SW = liveCanvas(200, 120), aS = Math.PI * 1.69, swM = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.64), new THREE.MeshBasicMaterial({ map: SW.tex, transparent: true, depthWrite: false, fog: false }));
  swM.position.set(Math.cos(aS) * (R0 - .34), 2.75, Math.sin(aS) * (R0 - .34)); swM.rotation.y = toC(aS); swM.renderOrder = 1; scene.add(swM);
  function drawWall(t, pool, mode, k, alpha) {
    const { g, w, h } = SW; g.clearRect(0, 0, w, h); if (alpha <= .01) { swM.visible = false; return; } swM.visible = true;
    g.globalAlpha = alpha;
    const cx = w * .5, cy = h * .58;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {   // a pixelated warm pool (dithered edge)
      const r = Math.hypot((x - cx) / (w * .44), (y - cy) / (h * .62)); const v = pool * (1 - r); if (v <= 0) continue;
      if (v < .18 && h2(x, y, 4) > v / .18) continue; g.fillStyle = `rgba(255,190,110,${Math.min(.55, v * .75)})`; g.fillRect(x, y, 2, 2);
    }
    g.fillStyle = 'rgba(8,4,12,.92)';
    if (mode === 'wings') {   // k: 1 = huge (the light right at the moth), 0 = small (he has stood up and come closer)
      const s = lerp(.22, 1, k), fy = cy + 18 * (1 - k), wing = (dx, dy, rx, ry) => { g.beginPath(); g.ellipse(cx + dx * s, fy + dy * s, rx * s, ry * s, 0, 0, 7); g.fill(); };
      const flap = .85 + .15 * Math.sin(t * 11);
      wing(-38, -18, 40 * flap, 30); wing(38, -18, 40 * flap, 30); wing(-24, 14, 24 * flap, 20); wing(24, 14, 24 * flap, 20);
      g.fillRect(cx - 4 * s, fy - 34 * s, 8 * s, 56 * s);
      if (k < .7) {   // the girl under it: a small round head, a bob, the A-line coat; the lantern in her arms
        const gA = ss((.7 - k) / .5); g.globalAlpha = alpha * gA; const bx = cx + 2, by = h - 6;
        g.beginPath(); g.arc(bx, by - 46, 8, 0, 7); g.fill(); g.fillRect(bx - 9, by - 50, 18, 6);
        g.beginPath(); g.moveTo(bx - 8, by - 37); g.lineTo(bx + 8, by - 37); g.lineTo(bx + 13, by - 8); g.lineTo(bx - 13, by - 8); g.fill();
        g.fillRect(bx - 7, by - 8, 4, 8); g.fillRect(bx + 3, by - 8, 4, 8); g.fillRect(bx - 5, by - 30, 10, 12);
      }
    }
    if (mode === 'dog') {   // k: run phase; it runs across and turns around, snow drifting through the light
      const span = w * .5, u = (k * .18) % 2, dir = u < 1 ? 1 : -1, x = cx - span / 2 + span * (u < 1 ? u : 2 - u), f = Math.floor(t * 9) % 4;
      g.save(); if (dir < 0) { g.translate(2 * x + 16 * 4, 0); g.scale(-1, 1); } dogPixels(g, x, cy + 18, 4, f, 'rgba(8,4,12,.92)'); g.restore();
      for (let i = 0; i < 26; i++) { const sx = (h2(i, 1, 6) * w + t * 6 * (1 + h2(i, 2, 6))) % w, sy = (h2(i, 3, 6) * h + t * 14 * (.6 + h2(i, 4, 6))) % h; g.fillRect(sx | 0, sy | 0, 2, 2); }
    }
    g.globalAlpha = 1; SW.tex.needsUpdate = true;
  }
  // the vision inside the violet: her dog running in the snow, above the open lantern
  const VS = liveCanvas(48, 48), vis = new THREE.Sprite(new THREE.SpriteMaterial({ map: VS.tex, transparent: true, depthWrite: false, fog: false })); vis.scale.set(.5, .5, 1); vis.material.color.setScalar(.62); scene.add(vis);
  function drawVision(t, a) {
    vis.visible = a > .01; if (!vis.visible) return; const { g, w, h } = VS; g.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const r = Math.hypot(x - w / 2 + .5, y - h / 2 + .5) / (w / 2); if (r > 1) continue; const v = 1 - r; if (v < .2 && h2(x, y, 8) > v / .2) continue; g.fillStyle = `rgba(${150 + 60 * v | 0},${90 + 50 * v | 0},${230},${(.25 + .6 * v) * a})`; g.fillRect(x, y, 1, 1); }
    g.globalAlpha = a; g.fillStyle = 'rgba(245,240,255,.95)'; for (let i = 0; i < 14; i++) { const sx = (h2(i, 1, 3) * w + t * 3) % w, sy = (h2(i, 2, 3) * h + t * 7 * (.6 + h2(i, 3, 3))) % h; if (Math.hypot(sx - w / 2, sy - h / 2) < w * .42) g.fillRect(sx | 0, sy | 0, 1, 1); }
    const f = Math.floor(t * 8) % 4, x = 8 + ((t * 9) % 30); g.fillStyle = 'rgba(30,14,48,.85)'; g.fillRect(6, 34, 36, 1);
    dogPixels(g, x, 34, 1.5, f, 'rgba(250,244,255,1)'); g.globalAlpha = 1; VS.tex.needsUpdate = true;
  }

  // —— shots: camera keys (shot-local time) ——
  const CAM = {
    count: { p: track([[0, [.05, 1.6, 1.95]], [10.6, [.55, 1.42, 1.0]]]), l: track([[0, [1.15, .45, -3.0]], [10.6, [2.15, .5, -2.85]]]), fov: 34 },
    resolve: { p: track([[0, [1.65, 1.6, 3.4]], [6, [1.45, 1.5, 3.1]]]), l: track([[0, [-1.4, .25, .7]], [6, [-1.4, .25, .72]]]), fov: 32 },
    night1: { p: track([[0, [-1.75, 1.7, 1.95]], [10.8, [-1.15, 1.5, 1.25]], [16.4, [-1.05, 1.45, 1.1]]]), l: track([[0, [1.5, .35, -1.9]], [10.8, [1.8, .3, -2.0]], [11.2, [1.8, .1, -2.0]], [16.4, [1.85, .1, -2.05]]]), fov: 34 },
    night2: { p: track([[0, [1.1, 1.95, 1.45]], [6, [1.35, 1.8, 1.1]]]), l: track([[0, [3.25, .05, -1.55]], [6, [3.3, .05, -1.6]]]), fov: 34 },
    morning2: { p: track([[0, [2.0, 3.0, .55]], [3.4, [1.95, 2.7, .3]], [5.0, [1.6, 1.2, -.5]], [10, [1.7, 1.1, -.75]]]), l: track([[0, [3.3, -.2, -1.9]], [3.4, [3.15, -.2, -2.05]], [5.0, [2.85, .35, -2.4]], [10, [2.85, .4, -2.45]]]), fov: 34 },
    night3: { p: track([[0, [.2, 1.55, .8]], [5.4, [.4, 1.42, .5]], [5.6, [.15, .85, 2.65]], [13.2, [.35, .85, 2.35]], [14.6, [.2, 1.5, 2.3]], [16.0, [.15, 1.5, 2.35]], [17.6, [2.75, 1.15, -.55]], [19.5, [2.95, 1.1, -.75]]]),
      l: track([[0, [2.0, .35, -2.4]], [5.4, [2.1, .35, -2.4]], [5.6, [3.05, .35, -1.7]], [13.2, [3.0, .4, -1.75]], [14.6, [2.6, 1.55, -2.6]], [16.0, [2.6, 1.5, -2.6]], [17.6, [2.2, .45, -2.3]], [19.5, [2.2, .5, -2.3]]]), fov: 34 },
    reveal: { p: track([[0, [3.1, 1.05, -.85]], [13.5, [3.0, .95, -1.1]]]), l: track([[0, [2.15, .62, -2.35]], [13.5, [2.2, .62, -2.35]]]), fov: 30 },
    decide: { p: track([[0, [-.3, 1.5, .55]], [13, [-.05, 1.4, .2]]]), l: track([[0, [1.85, 1.35, -2.6]], [13, [1.85, 1.3, -2.6]]]), fov: 34 },
    dawn: { p: track([[0, [.15, 1.25, -.1]], [10.5, [.45, 1.1, -.5]]]), l: track([[0, [2.0, .3, -2.3]], [10.5, [2.0, .3, -2.3]]]), fov: 32 },
    wink: { p: track([[0, [-.95, 1.15, 2.75]], [4.4, [-1.0, 1.12, 2.6]], [6.2, [-2.75, 1.4, 2.55]], [8.5, [-2.85, 1.4, 2.6]]]), l: track([[0, [-1.95, .5, 1.2]], [4.4, [-1.95, .5, 1.2]], [6.2, [2.25, .45, -1.4]], [8.5, [2.3, .45, -1.4]]]), fov: 32 },
  };
  const BL = [3.1, 8.2, 19.4, 27.2, 30.6, 46.6, 52.9, 77.4, 83.1, 89.6, 96.2];
  const blink = t => BL.some(b => t > b && t < b + .13);
  const lit = (t, a, b) => ss(seg(t, a, b));
  const walkF = (t, rate = 7) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * rate) % 4];
  let focusObj = null;

  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, C = CAM[id] || CAM.count;
    const nightNow = ['night1', 'night2', 'night3', 'reveal', 'decide'].includes(id);
    // —— the twelfth lantern: open & empty in the mornings, refilled each night until it is opened again ——
    const open12 = id === 'count' || id === 'resolve' || (id === 'night1' && t >= T.click1) || id === 'morning2' || (id === 'night3' && t >= T.open3) || ['reveal', 'decide', 'dawn', 'wink'].includes(id);
    const inArms = (id === 'night3' && t >= T.open3 + .7) || ['reveal', 'decide', 'dawn', 'wink'].includes(id);
    SH.forEach(s => { const op = s === L12 && open12; s.closed = !op && !(s === L12 && inArms);
      s.g.material.emissive.copy(VIOLET); s.g.material.emissiveIntensity = op ? .06 : .75 + .35 * Math.sin(t * 1.6 + s.ph);
      s.cap.position.y = op ? .1 : 0; s.cap.rotation.z = op ? .55 : 0; s.L.visible = !(s === L12 && inArms); });
    shelfLights.forEach(L => { L.intensity = nightNow ? 4 : 2.2; });
    // —— the small window: ajar in the mornings, shut at night until she opens it ——
    const ajar = id === 'count' || id === 'resolve' || id === 'morning2' || id === 'dawn' || id === 'wink' || (id === 'night1' && t >= T.click1);
    hinge.rotation.y = id === 'night3' ? -1.25 * ss(seg(t, T.winOpen, T.winOpen + .7)) : ['reveal', 'decide'].includes(id) ? -1.25 : ajar ? -.38 : 0;
    night.material.color.set(nightNow ? '#41609c' : '#e8c8d0');
    const wo = Math.abs(hinge.rotation.y) / 1.25; winGlow.visible = wo > .05; winGlow.material.opacity = (nightNow ? .9 : .5) * wo;
    winSpot.intensity = id === 'night3' ? 16 * ss(seg(t, T.winOpen, T.winOpen + .8)) : ['reveal', 'decide'].includes(id) ? 8 : 0;
    // —— light per night / morning ——
    const dawnish = !nightNow;
    hemi.color.set(dawnish ? '#8a7894' : '#2e2846'); hemi.intensity = dawnish ? .95 : .5;
    sky.color.set(dawnish ? '#ffc8a8' : '#8fa8e0'); sky.intensity = dawnish ? 26 : (id === 'night1' ? lerp(22, 14, seg(t, 22.6, 39)) : 18);
    slit.material.color.set(dawnish ? '#ffe0c8' : '#9fb8ff');
    const cand = (id === 'night1' || id === 'night2' || (id === 'night3' && t < T.candleOut)) ? 1 : 0;
    const ch = id === 'night1' ? lerp(.3, .12, seg(t, 22.6, 39)) : id === 'night2' ? .22 : .18;
    candle.scale.y = ch; candleL.position.copy(candleBase).add(new THREE.Vector3(-.15, ch + .2, .25)); candleG.position.copy(candleBase).add(new THREE.Vector3(0, ch + .05, 0));
    candleL.intensity = 3.2 * cand * flick(t, 4); candleG.visible = cand > 0;
    beam.userData.aim(winP, new THREE.Vector3(.9, -4.6, -.8).sub(winP).normalize(), cam); beam.material.uniforms.k.value = dawnish ? .36 : .26; beam.material.uniforms.col.value.set(dawnish ? '#ffc8a0' : '#8fa8e0'); beam.material.uniforms.t.value = t;
    // camera first: the sprites turn to where it is this frame
    cam.fov = C.fov * FOVK; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt));
    let followHer = id === 'night3' && t > 64.0 && t < T.uncover;

    // —— 노을: asleep in her chair the whole time; at the very end one eye opens ——
    N.root.position.set(-1.95, 0, 1.2);
    N.face(cam); N.frame(id === 'wink' && t > T.eyeOpen && t < T.eyeClose ? 'wink' : 'sleep');

    // —— 하루 ——
    let hp = [1.1, 0, -1.85], hf = 'idle0', hfl = false, lanH = 0, hlOn = 0, coverK = 0;
    floorLan.visible = false;
    if (id === 'count') { hp = [1.05, 0, -1.8]; const tap = T.count.findIndex(c => t > c && t < c + .5); hf = t < 4.6 ? (tap >= 0 ? 'point' : 'reach') : blink(t) ? 'blink' : 'idle0'; }
    if (id === 'resolve') { hp = [-.85, 0, .25]; hfl = true; hf = blink(t) ? 'blink' : 'idle0'; }
    if (id === 'night1') { hp = [.25, 0, -.55];
      hf = t < T.blink ? (t > 30.5 && t < T.blink ? (Math.floor(t * 1.1) % 2 ? 'sitDoze' : 'sitSideB') : blink(t) ? 'sitSideB' : 'sitSide') : 'shock';
      floorLan.visible = true; floorLan.position.set(.62, 0, -.4); hlOn = 2.6; }
    if (id === 'night2') { hp = [3.05, 0, -.95]; hf = t > T.flour[0] && t < T.flour[1] ? 'reach' : 'hold'; lanH = 1; hlOn = 3; }
    if (id === 'morning2') { const u = ss(seg(t, 45.2, 46.8)); hp = [lerp(3.7, 3.0, u), 0, lerp(-1.0, -2.05, u)]; hf = t < 46.8 ? walkF(t) : t < T.scratch ? 'crouchLook' : 'crouchPoint'; hfl = true; }
    if (id === 'night3') {
      if (t < 60.4) { hp = [1.55, 0, -2.0]; hf = t > T.thread[0] && t < T.thread[1] ? 'reach' : 'hold'; lanH = 1; hlOn = 3; }
      else if (t < T.uncover) { const u = ss(seg(t, 60.4, 61.2)); hp = [lerp(1.55, 1.95, u), 0, lerp(-2.0, .45, u)]; hf = t < 61.2 ? 'w' + (Math.floor(t * 7) % 4) : blink(t) ? 'hideB' : 'hide'; hlOn = t < 61.2 ? 3 : .35; coverK = 1; }
      else if (t < T.standUp) { hp = [1.95, 0, .45]; hf = 'uncover'; lanH = 1; hlOn = 6; }
      else { const u = ss(seg(t, T.standUp, T.reveal)); hp = [lerp(1.95, 1.55, u), 0, lerp(.45, -1.45, u)]; hf = t < T.reveal ? 'w' + (Math.floor(t * 6) % 4) : 'hold'; lanH = 1; hlOn = 5; hfl = true; }
      if (hf.startsWith('w') && hf.length === 2) hf = 'hw' + hf[1];
    }
    if (id === 'reveal') { hp = [1.55, 0, -1.45]; hf = blink(t) ? 'hold' : 'hold1'; lanH = 1; hlOn = 4.5; hfl = true; }
    if (id === 'decide') { hp = [1.6, 0, -2.5]; hf = t < T.setDown ? 'hold' : t < T.sit ? 'idle0' : blink(t) ? 'sitSideB' : 'sitSide'; lanH = t < T.setDown ? 1 : 0; hlOn = 4.5; hfl = true;
      if (t >= T.setDown) { floorLan.visible = true; floorLan.position.set(1.95, 0, -2.3); } }
    if (id === 'dawn' || id === 'wink') { hp = [1.6, 0, -2.5]; hf = 'sitSleep'; floorLan.visible = true; floorLan.position.set(1.95, 0, -2.3); hlOn = 1.2; hfl = true; }
    Hr.root.position.set(...hp); Hr.face(cam, hfl);
    if (lanH) Hr.frame(hf, 0, 0); else Hr.frame(hf);
    // where his light is
    const lp = lanH ? Hr.lanternPos(hf in Hr.table ? hf : 'hold', hfl) : floorLan.visible ? floorLan.position.clone().add(new THREE.Vector3(0, .2, 0)) : Hr.root.position.clone().add(new THREE.Vector3(.25, .5, 0));
    if (coverK) lp.copy(Hr.root.position).add(new THREE.Vector3(.2, .25, 0));
    hl.position.copy(lp); hl.intensity = hlOn * flick(t, 5); hlG.position.copy(lp); hlG.visible = hlOn > 1; hlG.material.opacity = Math.min(1, hlOn / 5);
    flGlass.material.emissiveIntensity = floorLan.visible ? 2.2 : 0;
    held.hand.copy(Hr.root.position).add(new THREE.Vector3(.3, .85, 0));

    // —— 봄이 ——
    let bp = null, bf = 'stand', bfl = true;
    if (id === 'night3' && t >= T.bomiIn[0]) {
      const u = ss(seg(t, T.bomiIn[0], T.bomiIn[1])), from = new THREE.Vector3(WP.x - .35, 0, WP.z - .1), to = new THREE.Vector3(2.3, 0, -2.25);
      bp = from.lerp(to, u); bf = t < T.bomiIn[1] ? walkF(t, 6) : t < T.open3 + .7 ? (Math.floor(t * 2) % 2 ? 'up1' : 'up') : 'hug';
      if (t > T.bell && t < T.reveal) bf = 'hug1';
    }
    if (id === 'reveal') { bp = new THREE.Vector3(2.3, 0, -2.2); bf = blink(t) ? 'hugB' : 'hug'; }
    if (id === 'decide') { bp = new THREE.Vector3(2.3, 0, -1.95); bf = t < T.sit ? 'hug' : blink(t) ? 'sitHugB' : 'sitHug'; }
    if (id === 'dawn' || id === 'wink') { bp = new THREE.Vector3(2.3, 0, -1.95); bf = Math.floor(t * .7) % 2 ? 'sleep1' : 'sleep'; }
    Bm.root.visible = !!bp;
    if (followHer) {   // 하루's eye line from under the table, turning with her
      const tgt = (bp || new THREE.Vector3(WP.x - .35, 0, WP.z - .1)).clone().setY(.55), base = new THREE.Vector3(...C.l(lt)), k = ss(seg(t, 64.0, 64.6)) * (1 - ss(seg(t, T.bell + .2, T.uncover)));
      cam.position.lerp(new THREE.Vector3(1.55, .78, .25), ss(seg(t, 64.0, 64.6)) * (1 - ss(seg(t, T.bell + .2, T.uncover)))); cam.lookAt(base.lerp(tgt, k));
    }
    if (bp) { Bm.root.position.copy(bp); Bm.face(cam, bfl); Bm.frame(bf); }
    Bm.mesh.material.color.setScalar(id === 'night3' && t < T.uncover + .15 ? .22 : 1);   // a dark shape until his light finds her
    // the lantern she holds (sprite pixels → world), or the twelfth on its shelf
    if (bp && inArms) { const sit = bf.startsWith('sit') || bf.startsWith('sleep'); const v = new THREE.Vector3((20.5 - 17) * SPX * (bfl ? -1 : 1), (50 - (sit ? 44.5 : 36.5)) * SPX, .1); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), Bm.root.rotation.y); held.lan.copy(Bm.root.position).add(v); }
    else held.lan.copy(L12glassC);
    herMoth.userData.update(t);
    drawVision(t, (id === 'reveal' ? ss(seg(t, T.vision, T.vision + 1.2)) : id === 'decide' ? 1 - .5 * ss(seg(t, T.dogShadow[0], T.dogShadow[0] + 2)) : 0));
    { const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0); vis.position.copy(held.lan).add(new THREE.Vector3(0, .6, 0)).addScaledVector(right, -.3); }

    // —— flour & footprints; thread & bell; the wall ——
    const cov = id === 'night2' ? seg(t, T.flour[0], T.flour[1]) : ['morning2', 'night3', 'reveal', 'decide', 'dawn', 'wink'].includes(id) ? 1 : 0;
    flourM.visible = cov > 0; if (cov > 0) drawFlour(cov, id !== 'night2');
    flourM.material.opacity = id === 'morning2' ? 1 : .55;
    const thK = id === 'night3' ? seg(t, T.thread[0], T.thread[1]) : ['reveal', 'decide', 'dawn', 'wink'].includes(id) ? 1 : 0;
    thread.visible = bell.visible = thK > 0;
    if (thK > 0) { const e = thA.clone().lerp(thB, thK), m = thA.clone().add(e).multiplyScalar(.5), d = e.clone().sub(thA); thread.position.copy(m); thread.scale.set(1, Math.max(.01, d.length()), 1); thread.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); }
    const rk = t > T.bell && id === 'night3' ? Math.exp(-(t - T.bell) * 1.6) : 0; bell.rotation.z = .5 * rk * Math.sin((t - T.bell) * 26); bell.rotation.x = .25 * rk * Math.cos((t - T.bell) * 21);
    let wallA = 0, mode = 'wings', k = 1;
    if (id === 'night3' && t >= T.uncover) { wallA = ss(seg(t, T.uncover, T.uncover + .25)); k = 1 - ss(seg(t, T.standUp, T.reveal)); }
    if (id === 'decide') { wallA = ss(seg(t, T.dogShadow[0], T.dogShadow[0] + 1.4)); mode = 'dog'; k = (t - T.dogShadow[0]) * 1.0; }
    if (id === 'dawn') { wallA = .45; mode = 'dog'; k = (t - 92) * .5; }
    drawWall(t, 1, mode, k, wallA);

    // —— fill, focus, look ——
    const subj = { count: L12glassC.clone(), resolve: N.root.position.clone().setY(.8), night1: new THREE.Vector3(1.2, .8, -1.4), night2: new THREE.Vector3(3.3, .4, -1.5),
      morning2: lt < 4 ? new THREE.Vector3(3.2, 0, -1.9) : L12glassC.clone(), night3: t < T.uncover ? new THREE.Vector3(2.4, .8, -2.2) : t < T.standUp ? swM.position.clone() : bp ? bp.clone().setY(.6) : L12glassC.clone(),
      reveal: (bp || L12glassC).clone().setY(.75), decide: new THREE.Vector3(2.1, 1.0, -2.1), dawn: new THREE.Vector3(2.0, .5, -1.9), wink: lt < 5 ? N.root.position.clone().setY(.85) : new THREE.Vector3(2.0, .6, -1.9) }[id] || L12glassC.clone();
    fill.position.copy(subj).add(new THREE.Vector3(-.6, 1.2, 1.6)); fill.intensity = id === 'wink' && lt < 5.5 ? 3.2 : dawnish ? 1.4 : 1.0;
    post.dof.focus = cam.position.distanceTo(subj); post.dof.aper = id === 'reveal' ? 150 : id === 'wink' ? 140 : 120; post.dof.maxCoc = 18;
    focusObj = subj;
    post.bloom.strength = .55; post.bloom.threshold = .82;
    renderer.toneMappingExposure = dawnish ? 1.25 : 1.15;
    post.vig.uniforms.warm.value = dawnish ? .16 : .1; post.vig.uniforms.amt.value = .7;
  }
  return { scene, update, focus: () => focusObj, events: [], tiltW: () => .08 };
}
