/*
 * world3d.js — the bright product-studio world of 「컴퓨터 하드웨어 한 번에 총정리」 (storyboard.md → 월드 바이블).
 * Every part is built here from three.js primitives (rounded extrusions, cylinders, instanced cubes) and a baked
 * canvas texture for the board — nothing is loaded. Deterministic: no Math.random (W.rand(seed)).
 *
 * Units: 1 = 1 cm. The motherboard lies on the XZ plane (y up), centred at the origin; +z is towards the viewer.
 * technique: cokacmotion 162-relight (MIT, github.com/kstost/cokacmotion) — one soft key from the upper left with a
 *            rim, rebuilt as a three.js directional key + RoomEnvironment for a white studio.
 */
(function () {
  const W = (window.HW = {});
  W.rand = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
  W.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  W.k = (t, a, b) => W.clamp((t - a) / (b - a), 0, 1);
  W.io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  W.out = (k) => 1 - Math.pow(1 - k, 3);
  W.back = (k) => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  W.lerp = (a, b, k) => a + (b - a) * k;

  // the palette: one job per colour
  W.COL = { cpu: 0xff6b4a, ram: 0x3d8bff, ssd: 0x19b48a, hdd: 0x8fa3a0, gpu: 0x7a5cff, vram: 0xb9a6ff, psu: 0xffb020, cool: 0x2bc0e4, board: 0xe9eee4, white: 0xf7f8fa, ink: 0x1b2130, metal: 0xd6dbe2 };

  W.build = function (T, scene) {
    const R = {};
    const std = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.0, envMapIntensity: 0.6 }, o));
    const phys = (color, o = {}) => new T.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.35, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.35, envMapIntensity: 0.65 }, o));
    const M = (R.mat = {
      white: phys(W.COL.white, { roughness: 0.5 }), whiteSoft: std(0xeef0f4, { roughness: 0.8 }),
      metal: std(W.COL.metal, { metalness: 0.85, roughness: 0.28 }), dark: std(0x2a2f3a, { roughness: 0.6 }), chip: std(0x23262e, { roughness: 0.4, metalness: 0.2 }),
      cpu: phys(W.COL.cpu), ram: phys(W.COL.ram), ssd: phys(W.COL.ssd), gpu: phys(W.COL.gpu), vram: phys(0x3a3550, { roughness: 0.4 }), psu: phys(W.COL.psu), cool: phys(W.COL.cool),
      gold: std(0xe6b450, { metalness: 0.9, roughness: 0.3 }),
    });

    // rounded box: w (x) × h (y) × d (z), origin at the bottom centre
    const rbox = (w, h, d, r = 0.4, bev = 0.12, mat = M.white) => {
      const s = new T.Shape(), x = -w / 2 + bev, y = -d / 2 + bev, ww = w - 2 * bev, dd = d - 2 * bev, rr = Math.min(r, ww / 2, dd / 2);
      s.moveTo(x + rr, y); s.lineTo(x + ww - rr, y); s.quadraticCurveTo(x + ww, y, x + ww, y + rr); s.lineTo(x + ww, y + dd - rr); s.quadraticCurveTo(x + ww, y + dd, x + ww - rr, y + dd);
      s.lineTo(x + rr, y + dd); s.quadraticCurveTo(x, y + dd, x, y + dd - rr); s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y);
      const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, h - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 5 });
      g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);
      const m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
    };
    const box = (w, h, d, mat) => { const g = new T.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); const m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
    const cyl = (r, h, mat, seg = 40) => { const g = new T.CylinderGeometry(r, r, h, seg); g.translate(0, h / 2, 0); const m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
    R.rbox = rbox; R.box = box; R.cyl = cyl;
    /** a fan: frame ring, hub and 7 blades, facing +y; returns { g, rotor } */
    const fan = (r, mat) => {
      const g = new T.Group();
      const frame = new T.Mesh(new T.TorusGeometry(r, r * 0.07, 10, 48), mat); frame.rotation.x = Math.PI / 2; frame.castShadow = true; g.add(frame);
      const rotor = new T.Group(); g.add(rotor);
      const hub = new T.Mesh(new T.CylinderGeometry(r * 0.28, r * 0.28, r * 0.12, 32), M.white); rotor.add(hub);
      for (let i = 0; i < 7; i++) { const b = new T.Mesh(new T.BoxGeometry(r * 0.66, r * 0.03, r * 0.3), M.whiteSoft); b.position.set(Math.cos(i / 7 * 6.283) * r * 0.58, 0, Math.sin(i / 7 * 6.283) * r * 0.58); b.rotation.y = -i / 7 * 6.283; b.rotation.x = 0.35; b.castShadow = true; rotor.add(b); }
      return { g, rotor };
    };
    R.fan = fan;

    // ---------- the studio floor ----------
    const floor = new T.Mesh(new T.PlaneGeometry(600, 600), std(0xe3e8ee, { roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; floor.receiveShadow = true; scene.add(floor);

    // ---------- the case: floor plate, four walls, a glass top ----------
    const caseG = (R.case = new T.Group()); scene.add(caseG);
    const CW = 40, CD = 46, CH = 13.5, cz = 4;
    const plate = rbox(CW, 1.2, CD, 1.2, 0.3, M.white); plate.position.set(0, -1.4, cz); caseG.add(plate);
    R.walls = [];
    const glassMat = new T.MeshPhysicalMaterial({ color: 0xdfe8f2, roughness: 0.08, transmission: 0.0, transparent: true, opacity: 0.32, metalness: 0, clearcoat: 1, envMapIntensity: 1.2 });
    const glass = (R.glass = rbox(CW, 0.5, CD, 1.2, 0.15, glassMat)); glass.position.set(0, CH - 0.6, cz); glass.castShadow = false; caseG.add(glass);
    for (const [w, d, x, z, gl] of [[CW, 0.8, 0, cz - CD / 2 + 0.4, 0], [CW, 0.8, 0, cz + CD / 2 - 0.4, 1], [0.8, CD, -CW / 2 + 0.4, cz, 0], [0.8, CD, CW / 2 - 0.4, cz, 0]]) {
      const wall = rbox(w, CH, d, 0.3, 0.15, gl ? glassMat : M.white); wall.position.set(x, -0.6, z); if (gl) wall.castShadow = false; caseG.add(wall); R.walls.push(wall);
    }
    R.caseDims = { CW, CD, CH, cz };

    // ---------- the motherboard: baked texture of traces and slots ----------
    const BW = 30.5, BD = 24.4;
    const tc = document.createElement('canvas'); tc.width = 1220; tc.height = 976; const g2 = tc.getContext('2d');
    g2.fillStyle = '#c4d6c9'; g2.fillRect(0, 0, 1220, 976);
    const rr = W.rand(17); g2.lineCap = 'round';
    for (let i = 0; i < 260; i++) { // traces: pale green-grey Manhattan runs
      const x0 = Math.round(rr() * 61) * 20, y0 = Math.round(rr() * 49) * 20, horiz = rr() < 0.5, L = (40 + rr() * 260) * (rr() < 0.5 ? -1 : 1), L2 = (20 + rr() * 120) * (rr() < 0.5 ? -1 : 1);
      g2.strokeStyle = rr() < 0.3 ? 'rgba(236,244,238,0.85)' : 'rgba(160,186,168,0.7)'; g2.lineWidth = rr() < 0.2 ? 3 : 1.6;
      g2.beginPath(); g2.moveTo(x0, y0); if (horiz) { g2.lineTo(x0 + L, y0); g2.lineTo(x0 + L, y0 + L2); } else { g2.lineTo(x0, y0 + L); g2.lineTo(x0 + L2, y0 + L); } g2.stroke();
    }
    for (let i = 0; i < 120; i++) { g2.fillStyle = 'rgba(200,170,110,0.6)'; g2.beginPath(); g2.arc(rr() * 1220, rr() * 976, 3, 0, 6.283); g2.fill(); }
    // mounting holes
    for (const [x, y] of [[30, 30], [1190, 30], [30, 946], [1190, 946], [610, 30], [610, 946]]) { g2.fillStyle = '#c9cec6'; g2.beginPath(); g2.arc(x, y, 16, 0, 6.283); g2.fill(); g2.fillStyle = '#9aa196'; g2.beginPath(); g2.arc(x, y, 8, 0, 6.283); g2.fill(); }
    const tex = new T.CanvasTexture(tc); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const boardMat = std(0xffffff, { map: tex, roughness: 0.7 });
    const board = (R.board = box(BW, 0.16, BD, boardMat)); board.position.y = 0; scene.add(board);
    R.boardTex = { canvas: tc, ctx: g2, tex };
    const B = (R.boardG = new T.Group()); B.position.y = 0.16; scene.add(B);   // everything on the board

    // ---------- CPU: socket, chip (lid + die + cores), cooler ----------
    const CPU = (R.cpu = { at: new T.Vector3(-3, 0.16, 2.5) });
    const sock = rbox(5.4, 0.35, 5.4, 0.3, 0.08, std(0xdcd6c8, { roughness: 0.7 })); sock.position.copy(CPU.at).setY(0.16); B.parent.add(sock);
    CPU.lever = box(0.25, 0.25, 5, M.metal); CPU.lever.position.set(CPU.at.x + 3, 0.3, CPU.at.z); B.parent.add(CPU.lever);
    // the chip group (lifts out in its chapter)
    const chip = (CPU.chip = new T.Group()); chip.position.set(CPU.at.x, 0.5, CPU.at.z); scene.add(chip);
    const substrate = box(4, 0.15, 4, std(0x3d7a52, { roughness: 0.6 })); chip.add(substrate);
    CPU.dieMat = std(0x34383f, { roughness: 0.35, metalness: 0.3 });
    const die = box(2.4, 0.12, 1.6, CPU.dieMat); die.position.y = 0.15; chip.add(die);
    // cores: up to 24 small coral blocks on the die (count set per frame)
    CPU.coreGeo = new T.BoxGeometry(0.34, 0.12, 0.3); CPU.coreGeo.translate(0, 0.06, 0);
    CPU.cores = new T.InstancedMesh(CPU.coreGeo, phys(W.COL.cpu, { emissive: W.COL.cpu, emissiveIntensity: 0.15 }), 24); CPU.cores.position.y = 0.27; CPU.cores.castShadow = true;
    const m4 = new T.Matrix4();
    for (let i = 0; i < 24; i++) { const c = i % 6, r = Math.floor(i / 6); m4.makeTranslation(-0.95 + c * 0.38, 0, -0.5 + r * 0.33); CPU.cores.setMatrixAt(i, m4); }
    chip.add(CPU.cores);
    CPU.lidMat = std(W.COL.metal, { metalness: 0.85, roughness: 0.25, transparent: true, opacity: 1 });
    CPU.lid = rbox(3.6, 0.42, 3.6, 0.35, 0.08, CPU.lidMat); CPU.lid.position.y = 0.15; chip.add(CPU.lid);
    // cooler: base, fin stack, fan on top
    const cool = (CPU.cooler = new T.Group()); cool.position.set(CPU.at.x, 0.95, CPU.at.z); scene.add(cool);
    const cbase = box(5, 0.6, 5, M.metal); cool.add(cbase);
    const finMat = std(0xe6eaef, { metalness: 0.7, roughness: 0.32 });
    for (let i = 0; i < 18; i++) { const f = box(9, 0.08, 9, finMat); f.position.y = 0.8 + i * 0.22; cool.add(f); }
    const heat = (CPU.heatPipes = []);
    for (const x of [-1.2, 0, 1.2]) { const p = cyl(0.22, 4.6, std(0xd99a6c, { metalness: 0.8, roughness: 0.3 }), 16); p.position.set(x, 0.3, 0); cool.add(p); heat.push(p); }
    const cf = fan(4.3, M.cpu); cf.g.position.y = 5.0; cool.add(cf.g); CPU.fan = cf;
    const shroud = rbox(9.4, 0.5, 9.4, 1.4, 0.15, M.white); shroud.position.y = 4.65; cool.add(shroud);

    // ---------- RAM: four slots, two sticks ----------
    const RAM = (R.ram = { sticks: [] });
    const slotMat = std(0x30343d, { roughness: 0.6 });
    for (let i = 0; i < 4; i++) { const s = box(0.7, 0.7, 13.6, slotMat); s.position.set(4.6 + i * 1.05, 0.16, 2.5); scene.add(s); }
    for (const i of [1, 3]) {
      const st = new T.Group(); st.position.set(4.6 + i * 1.05, 0.7, 2.5); scene.add(st);
      const pcb = box(0.12, 3.2, 13.3, std(0x2f6b4a, { roughness: 0.6 })); st.add(pcb);
      const spreader = rbox(0.5, 3.2, 13.3, 0.12, 0.06, M.ram); spreader.position.y = 0.15; st.add(spreader);
      const topbar = rbox(0.55, 0.35, 13.1, 0.12, 0.06, M.white); topbar.position.y = 3.3; st.add(topbar);
      RAM.sticks.push(st);
    }

    // ---------- M.2 SSD ----------
    const SSD = (R.ssd = {});
    const ssd = (SSD.g = new T.Group()); ssd.position.set(-10, 0.25, -4.2); scene.add(ssd);
    const spcb = rbox(8, 0.12, 2.2, 0.15, 0.03, std(0x1f2a2a, { roughness: 0.6 })); ssd.add(spcb);
    SSD.body = rbox(6.8, 0.32, 2.0, 0.25, 0.08, M.ssd); SSD.body.position.set(0.4, 0.1, 0); ssd.add(SSD.body);
    const gold = box(0.6, 0.06, 1.9, M.gold); gold.position.set(-3.75, 0.02, 0); ssd.add(gold);

    // ---------- HDD (appears in its beat, beside the case) ----------
    const HDD = (R.hdd = {});
    const hdd = (HDD.g = new T.Group()); hdd.position.set(-27, -1.4, 8); scene.add(hdd);
    const hbody = rbox(10.2, 2.6, 14.7, 0.6, 0.15, std(0xc9d1d6, { metalness: 0.6, roughness: 0.35 })); hdd.add(hbody);
    const well = cyl(4.6, 0.1, std(0x9aa6ad, { metalness: 0.7, roughness: 0.3 }), 48); well.position.set(0, 2.6, -2); hdd.add(well);
    HDD.platter = new T.Group(); HDD.platter.position.set(0, 2.72, -2); hdd.add(HDD.platter);
    const plat = cyl(4.4, 0.08, std(0xeef2f6, { metalness: 0.95, roughness: 0.12 }), 64); HDD.platter.add(plat);
    const spot = box(0.6, 0.12, 0.6, M.dark); HDD.platter.add(spot);
    const mark = box(1.6, 0.11, 0.2, std(W.COL.ssd)); mark.position.set(2.6, 0, 0); HDD.platter.add(mark);
    HDD.arm = new T.Group(); HDD.arm.position.set(3.6, 2.9, 4); hdd.add(HDD.arm);
    const armBar = box(0.6, 0.12, 6, M.metal); armBar.position.z = -3; HDD.arm.add(armBar);
    const piv = cyl(0.6, 0.4, M.dark); HDD.arm.add(piv);

    // ---------- GPU card: PCIe slot, card with shroud (lifts), PCB, GPU chip, 12 VRAM chips ----------
    const GPU = (R.gpu = {});
    const slot = box(8.9, 0.8, 0.8, slotMat); slot.position.set(-7.5, 0.16, -9.5); scene.add(slot);
    const card = (GPU.card = new T.Group()); card.position.set(0, 0.9, -9.5); scene.add(card);
    // the PCB stands up (x along the card, y up, z its thickness): face towards +z
    GPU.pcb = box(28, 11, 0.2, std(0xdfe2ec, { roughness: 0.6 })); GPU.pcb.position.z = 0; card.add(GPU.pcb);
    GPU.face = new T.Group(); GPU.face.position.set(0, 0, 0.12); card.add(GPU.face);    // components on the PCB face
    GPU.chip = box(4.2, 4.2, 0.35, std(0x2b2f3a, { roughness: 0.4, metalness: 0.3 })); GPU.chip.geometry.translate(0, -2.1, 0); GPU.chip.position.set(-1, 5.5, 0); GPU.face.add(GPU.chip);
    GPU.chipTop = box(3.2, 3.2, 0.1, phys(W.COL.gpu, { emissive: W.COL.gpu, emissiveIntensity: 0.2 })); GPU.chipTop.geometry.translate(0, -1.6, 0); GPU.chipTop.position.set(-1, 5.5, 0.36); GPU.face.add(GPU.chipTop);
    // thousands of cores on the GPU die: an instanced grid 48×48
    const N = 48; GPU.coreN = N * N;
    const cg = new T.BoxGeometry(3.0 / N * 0.8, 3.0 / N * 0.8, 0.08); cg.translate(0, 0, 0.04);
    GPU.cores = new T.InstancedMesh(cg, phys(0xd9ceff, { emissive: W.COL.vram, emissiveIntensity: 0.35 }), GPU.coreN); GPU.cores.position.set(-1, 5.5, 0.47);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { m4.makeTranslation(-1.5 + (i + 0.5) * 3 / N, -1.5 + (j + 0.5) * 3 / N, 0); GPU.cores.setMatrixAt(j * N + i, m4); }
    GPU.cores.count = 0; GPU.face.add(GPU.cores);
    GPU.vram = [];
    const vpos = [];
    for (let i = 0; i < 4; i++) { vpos.push([-1 - 3.6 + i * 2.4, 5.5 + 3.4]); vpos.push([-1 - 3.6 + i * 2.4, 5.5 - 3.4]); }
    for (const y of [-1.2, 1.2]) { vpos.push([-1 - 4.6, 5.5 + y]); vpos.push([-1 + 4.6, 5.5 + y]); }
    GPU.vramMat = phys(0x3a3550, { emissive: W.COL.vram, emissiveIntensity: 0.0, roughness: 0.4 });
    for (const [x, y] of vpos) { const v = box(1.5, 1.5, 0.2, GPU.vramMat); v.geometry.translate(0, -0.75, 0); v.position.set(x, y + 0.75, 0); GPU.face.add(v); GPU.vram.push(v); }
    GPU.vramPos = vpos;
    // the shroud with three fans, as one group that lifts off towards the viewer
    const sh = (GPU.shroud = new T.Group()); sh.position.z = 0.25; card.add(sh);
    const shell = rbox(28.6, 11.6, 3.2, 1.4, 0.3, M.white); shell.rotation.x = Math.PI / 2; shell.position.set(0, 11.3, 0); sh.add(shell);
    // (the rbox extrudes along y; rotated so its thickness runs along z, its 11.6 along y)
    const stripe = box(28.4, 0.5, 3.3, M.gpu); stripe.position.set(0, 0.2, 1.6); sh.add(stripe);
    GPU.fans = [];
    for (const x of [-8.8, 0, 8.8]) { const f = fan(4.0, M.gpu); f.g.rotation.x = Math.PI / 2; f.g.position.set(x, 5.6, 3.35); sh.add(f.g); GPU.fans.push(f); }

    // ---------- PSU ----------
    const PSU = (R.psu = {});
    const psu = (PSU.g = new T.Group()); psu.position.set(-9, -0.8, 19.5); scene.add(psu);
    PSU.body = rbox(15, 8.6, 9, 0.8, 0.2, M.white); psu.add(PSU.body);
    const pstripe = box(15.1, 0.6, 9.1, M.psu); pstripe.position.y = 7.2; psu.add(pstripe);
    const pf = fan(3.6, M.psu); pf.g.position.set(0, 8.75, 0); psu.add(pf.g); PSU.fan = pf;
    // the cable to the board's power connector (right edge)
    const pts = [new T.Vector3(7.6, 6.5, -3.5), new T.Vector3(16, 3.2, -5.5), new T.Vector3(24.2, 2.0, -9.5), new T.Vector3(25.6, 1.8, -15.0), new T.Vector3(23.6, 1.6, -17.5)];
    const curve = new T.CatmullRomCurve3(pts.map((p) => p.clone()));
    PSU.cable = new T.Mesh(new T.TubeGeometry(curve, 60, 0.45, 10, false), std(0x2a2f3a, { roughness: 0.7 })); PSU.cable.castShadow = true; psu.add(PSU.cable);
    PSU.curve = curve;
    const conn = box(1.4, 0.8, 5, std(0xf1f2f4)); conn.position.set(14.2, 0.16, 2); scene.add(conn); PSU.conn = conn;

    // ---------- data cubes (the recurring object): one instanced pool, placed per frame ----------
    const DC = (R.cubes = {});
    DC.max = 1400;
    const dg = new T.BoxGeometry(0.85, 0.85, 0.85);
    DC.mesh = new T.InstancedMesh(dg, phys(0xffffff, { roughness: 0.3, clearcoat: 1 }), DC.max); DC.mesh.castShadow = true; DC.mesh.count = 0;
    DC.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    for (let i = 0; i < DC.max; i++) DC.mesh.setColorAt(i, new T.Color(0xffffff));
    scene.add(DC.mesh);

    // ---------- lights ----------
    const hemi = new T.HemisphereLight(0xffffff, 0xd5dbe4, 0.55); scene.add(hemi);
    const key = (R.key = new T.DirectionalLight(0xfffaf2, 2.1)); key.position.set(-28, 52, 26); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = -38; sc.right = 38; sc.top = 38; sc.bottom = -38; sc.near = 10; sc.far = 140; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
    scene.add(key);
    const fill = new T.DirectionalLight(0xe8f0ff, 0.55); fill.position.set(30, 18, 30); scene.add(fill);
    R.lights = { hemi, key, fill };
    return R;
  };
})();
