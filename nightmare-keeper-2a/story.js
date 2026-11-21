// 악몽을 지키는 파수꾼 2 — A 「할머니의 첫 꿈」: the timeline (single source of truth: the page, the mixer and the subtitles
// read these numbers; tools/export.mjs writes them to timeline.json for Python). TREATMENT.md has the why of every shot.
export const DUR = 121.0;

// shot → set (town | tower). a/b in seconds.
export const SHOTS = [
  { id: 'dream', set: 'tower', a: 0.0, b: 9.0 },          // 노을 asleep; a golden light blooms over her (a new light: the shadows jump)
  { id: 'turn', set: 'town', a: 9.0, b: 18.4 },           // the map from above: moths leave the dark windows… and all turn toward the tower's gold
  { id: 'title', set: 'town', a: 18.4, b: 24.4 },         // the tower, the swarm streaming in; the title
  { id: 'window', set: 'tower', a: 24.4, b: 34.0 },       // 하루 at the window, the swarm outside; he turns to his sleeping grandmother
  { id: 'rope', set: 'tower', a: 34.0, b: 42.0 },         // the bell rope, knotted to the pedestal; up to the ceiling (plant)
  { id: 'catch', set: 'town', a: 42.0, b: 55.0 },         // on the mound: he raises the lantern; wave after wave swirls in; it fills (the meter)
  { id: 'keyhole', set: 'tower', a: 55.0, b: 66.0 },      // shutters shut, glass hammered; one moth through the keyhole; he dives and catches it
  { id: 'crisis', set: 'tower', a: 66.0, b: 78.0 },       // the window bulges violet, the gold fades; his hand on her shoulder; silence; he looks up
  { id: 'pull', set: 'tower', a: 78.0, b: 80.2 },         // he unties the knot and pulls
  { id: 'bell', set: 'town', a: 80.2, b: 84.2 },          // the bell swings for the first time in seventy years (one shake)
  { id: 'wake', set: 'town', a: 84.2, b: 99.0 },          // the map again: windows light amber one by one, lanterns pour out, the moths scatter (signature)
  { id: 'snore', set: 'tower', a: 99.0, b: 106.4 },       // quiet again; the gold is whole; she snores
  { id: 'dawn', set: 'town', a: 106.4, b: 121.0 },        // dawn: 노을 at the door; the steps full of sleeping villagers and 하루
];

export const T = {
  bloom: 0.9,                        // the golden dream opens over her head
  emerge: [9.3, 14.6],               // moths slip out of the dark windows and drift
  turn: 15.0,                        // every moth turns toward the tower's gold
  arrive: [16.0, 30.0],              // the swarm streams to the tower
  collect: [43.2, 46.4, 49.6, 52.6], // he raises the lantern: a wave swirls in each time
  fillSteps: [0, .25, .5, .75, 1],
  full: 53.4,                        // the lantern is full; its glass cracks
  shut: 55.6,                        // the shutters close
  rattle: [56.2, 77.8],              // moths beat on the glass, faster
  keyhole: 58.4, dive: 60.3, catch: 61.0,
  taint: [62.0, 74.0],               // the gold's edge turns violet as the swarm presses in
  touch: 67.0, release: 72.6, lookUp: 74.0, walk: [75.6, 77.6],
  untie: 78.5, pull: 79.4,
  bell: 80.45,                       // DONG
  light0: 84.8, lightStep: .42,      // windows light amber one by one, nearest the tower first
  scatter: [85.6, 95.0],
  snores: [99.7, 104.1],
  doorOut: [107.0, 108.4], stretch: [108.6, 110.6],
  reveal: [115.6, 119.0],
  narrow: [116.4, 120.0],
  fadeOut: [119.9, 121.0],
};

// voice lines: t = start; duration from voices/dur.json. dlg: shown in the dialogue box (on-screen speaker), else subtitle
export const VO = [
  { id: 'n1', t: 1.4, sub: '평생 한 번도 잠들지 못한 파수꾼, 노을 할머니가 처음으로 좋은 꿈을 꾸던 밤이었습니다.' },
  { id: 'n2', t: 9.6, sub: '그 꿈은 마을에서 가장 밝은 빛이 되었습니다.' },
  { id: 'n3', t: 13.6, sub: '그런데 악몽은, 가장 밝은 빛으로 날아듭니다.' },
  { id: 'h1', t: 25.4, dlg: true, who: '하루', sub: '할머니는… 절대 못 깨워.' },
  { id: 'n4', t: 29.2, sub: '칠십 년 만에 처음 든 잠이었습니다.' },
  { id: 'n5', t: 34.6, sub: '탑 꼭대기의 종은 한 번도 울린 적이 없었습니다. 할머니는 언제나, 혼자 지켰으니까요.' },
  { id: 'h2', t: 42.7, dlg: true, who: '하루', sub: '이쪽이야! 이리 와!' },
  { id: 'h3', t: 60.2, dlg: true, who: '하루', sub: '안 돼…!' },
  { id: 'h4', t: 68.2, dlg: true, who: '하루', sub: '할머니…' },
  { id: 'n6', t: 84.9, sub: '칠십 년 만의 종소리에, 마을 사람들은 불이 난 줄 알고 등불을 들고 뛰쳐나왔습니다.' },
  { id: 'n7', t: 92.6, sub: '악몽들은 저마다 가장 가까운 불빛으로 흩어졌습니다.' },
  { id: 'h5', t: 101.4, dlg: true, who: '하루', sub: '…이걸 듣고도 주무시네.' },
  { id: 'k1', t: 108.9, dlg: true, who: '노을', sub: '참 좋은 꿈을 꿨다. 온 마을이 등불을 들고, 나를 지켜 주는 꿈이었지.' },
];

// cards drawn by the overlay (Korean only: the film's language)
export const CARDS = [
  { kind: 'title', a: 18.9, b: 24.1, text: '악몽을 지키는 파수꾼 2', sub: '할머니의 첫 꿈' },
];

// black dips between sets: [cut, out, in] (the bell is a hard cut both ways)
export const FADES = [[9.0, .3, .4], [18.4, .3, .4], [24.4, .3, .4], [42.0, .25, .35], [55.0, .25, .35], [99.0, .35, .45], [106.4, .5, .7]];

export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
