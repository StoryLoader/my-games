// 악몽을 지키는 파수꾼 — the timeline: shots, voice lines, event times (single source of truth: the page, the mixer and the
// subtitles read these numbers; tools/export.mjs writes them to timeline.json for Python)
export const DUR = 127.0;

// shot → set (town | tower). a/b in seconds.
export const SHOTS = [
  { id: 'mapOpen', set: 'town', a: 0.0, b: 7.5 },       // straight overhead map → tilt down to the tower on the hill
  { id: 'shelf', set: 'tower', a: 7.5, b: 15.2 },       // inside the tower: the lanterns full of moths
  { id: 'title', set: 'town', a: 15.2, b: 21.0 },       // title over a soft wide of the tower
  { id: 'patrol', set: 'town', a: 21.0, b: 32.0 },      // the nightly round: lateral tracking, moths drawn into her lantern
  { id: 'door', set: 'town', a: 32.0, b: 37.5 },        // at the tower door: "오늘 밤도, 무사히."
  { id: 'swell', set: 'tower', a: 37.5, b: 47.0 },      // the biggest lantern swells
  { id: 'shatter', set: 'tower', a: 47.0, b: 53.0 },    // it bursts; the shelf follows
  { id: 'infect', set: 'town', a: 53.0, b: 61.0 },      // top-down map: amber windows turn violet one by one (signature)
  { id: 'chase', set: 'town', a: 61.0, b: 81.0 },       // three alleys: lift the lamp, the moths come home, the window turns amber
  { id: 'cottageWide', set: 'town', a: 81.0, b: 91.0 }, // the last one, on the cottage roof at the edge of town
  { id: 'talk', set: 'town', a: 91.0, b: 101.0 },       // two figures; the moth will not come
  { id: 'kneel', set: 'town', a: 101.0, b: 108.5 },     // dive low and close; the lamp nearly dies
  { id: 'handover', set: 'town', a: 108.5, b: 115.5 },  // the boy takes the lamp; the moth shrinks; she sleeps
  { id: 'dawn', set: 'town', a: 115.5, b: 127.0 },      // rising pull-back at dawn; windows go out one by one
];

export const T = {
  shelfDrift: 7.5,
  patrolWalk: [21.4, 31.2],      // she walks the alley
  collect: [24.2, 26.6, 29.0],   // moths stream into her lantern
  door: 32.0,
  swellStart: 37.5, knock: 40.0, rumble: 43.2, crack: 45.6, burst: 47.6, chain: [48.0, 48.35, 48.62, 48.95, 49.3, 49.62, 50.0, 50.4],
  towerDark: 48.2,
  infectStart: 54.0, infectStep: 0.48,
  chaseStops: [65.6, 71.4, 77.0],   // she lifts the lamp in each alley
  lampSteps: [1.0, .82, .64, .46],  // her lamp's level before the chase, then after each alley
  bigMoth: 81.0,
  liftLamp: 95.0, refuse: 95.4,     // she raises the lamp; the moth does not come
  kneel: 101.4, nearlyOut: 102.0, heartbeat: 102.5, relight: 103.6,
  handover: 110.6, shrink: [111.4, 113.6], sleep: 114.2,
  dawn: 115.5, winOff0: 118.0, winOffStep: 0.42,
  fadeOut: [125.8, 127.0],
};

// voice lines: t = start; duration from voices/dur.json. dlg: shown in the dialogue box (on-screen speaker), else subtitle
export const VO = [
  { id: 'n1', t: 1.2, sub: '이 마을 사람들은, 악몽을 꾸지 않습니다.' },
  { id: 'n2', t: 5.75, sub: '언덕 위 등불탑에서, 한 사람이 대신 지키고 있기 때문이죠.' },
  { id: 'n3', t: 11.55, sub: '잠든 사람에게서 새어 나온 나쁜 꿈은, 빛을 찾아 날아드는 나방이 됩니다.' },
  { id: 'n4', t: 22.2, sub: '파수꾼 노을은 밤마다 등불을 들고 골목을 돌며, 그 나방들을 거둬들입니다.' },
  { id: 'k1', t: 33.0, dlg: true, who: '노을', sub: '오늘 밤도, 무사히.' },
  { id: 'n5', t: 38.8, sub: '그런데 그날 밤은, 악몽이 너무 많았습니다.' },
  { id: 'n6', t: 54.6, sub: '흩어진 악몽들이, 잠든 집집마다 스며들었습니다.' },
  { id: 'k2', t: 62.8, dlg: true, who: '노을', sub: '하나도, 놓치지 않을 게다.' },
  { id: 'n7', t: 82.2, sub: '마지막 하나는, 마을 끝 오두막 지붕 위에 앉아 있었습니다.' },
  { id: 'k3', t: 92.0, dlg: true, who: '노을', sub: '이리 오너라. 무서울 것 없다.' },
  { id: 'h1', t: 97.2, dlg: true, who: '하루', sub: '그건… 할머니 꿈이에요.' },
  { id: 'n8', t: 103.6, sub: '평생 남의 악몽을 지키느라, 파수꾼은 한 번도 잠든 적이 없었습니다.' },
  { id: 'h2', t: 109.6, dlg: true, who: '하루', sub: '이번엔 제가 들고 있을게요.' },
  { id: 'n9', t: 116.4, sub: '그날 밤, 파수꾼은 처음으로 꿈을 꾸었습니다. 아주 좋은 꿈을.' },
  { id: 'h3', t: 123.2, dlg: true, who: '하루', sub: '오늘 밤은, 제가 지킬게요.' },
];

// cards drawn by the overlay (Korean only: the film's language)
export const CARDS = [
  { kind: 'title', a: 16.8, b: 21.0, text: '악몽을 지키는 파수꾼' },
  { kind: 'place', a: 21.3, b: 25.4, label: '등불탑 마을', text: '자정' },
  { kind: 'place', a: 61.2, b: 65.6, label: '둘째 장', text: '되찾는 밤' },
];

export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
