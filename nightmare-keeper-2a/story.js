// 악몽을 지키는 파수꾼 2 — 반딧불의 밤: the timeline (single source of truth: the page, the mixer and the subtitles read
// these numbers; tools/export.mjs writes them to timeline.json for Python). TREATMENT.md has the why of every shot.
export const DUR = 120.0;

// shot → set (town | tower). a/b in seconds.
export const SHOTS = [
  { id: 'open', set: 'town', a: 0.0, b: 7.5 },            // at the tower door: the boy with the lantern, the dialogue box already typing
  { id: 'title', set: 'town', a: 7.5, b: 13.8 },          // a soft wide of the town and the tower: the title
  { id: 'shelf', set: 'tower', a: 13.8, b: 23.0 },        // inside: last night's nightmares in new lanterns; 노을 asleep in her chair
  { id: 'patrol', set: 'town', a: 23.0, b: 34.0 },        // the round: lateral tracking; moths stream into his lantern, it fills (meter)
  { id: 'full', set: 'town', a: 34.0, b: 42.5 },          // the lantern is full; the glass cracks
  { id: 'palm', set: 'town', a: 42.5, b: 55.0 },          // low and close: a moth on his palm; silence; it turns into a firefly (shadows jump)
  { id: 'home', set: 'town', a: 55.0, b: 62.5 },          // crane up after the firefly: back to its window, which turns gold
  { id: 'resolve', set: 'town', a: 62.5, b: 68.5 },       // he opens the lantern
  { id: 'release', set: 'town', a: 68.5, b: 86.0 },       // straight overhead: fireflies to every house, windows turn gold one by one (signature)
  { id: 'towerRelease', set: 'tower', a: 86.0, b: 97.0 }, // the shelf opens lantern by lantern; the tower fills with fireflies
  { id: 'wake', set: 'tower', a: 97.0, b: 104.0 },        // 노을 wakes among them
  { id: 'dawn', set: 'town', a: 104.0, b: 120.0 },        // dawn on the tower steps: he sleeps, she sits beside him; the band narrows
];

export const T = {
  patrolWalk: [23.4, 33.2],      // he walks the alley
  collect: [25.6, 28.4, 31.2],   // he lifts the lantern; moths stream in
  fillSteps: [0, .25, .5, .75, 1],  // the lantern before the round, after each lift, and full
  full: 34.0,
  rattle: [35.4, 37.6],          // the moths beat against the glass, faster
  crack: 41.3, escape: 41.45,    // the glass cracks; one moth slips out
  crouch: 43.0, land: 44.6,      // he sets the lantern down and holds out his palm; the moth lands
  heart: [46.2, 47.6],           // two slow wingbeats in the silence
  transform: 52.3, flyOff: 54.0, // violet → a firefly (a new light: the shadows jump); it lifts off
  homeArrive: 60.4,              // it reaches its window, which turns gold
  openDoor: 66.0,                // he opens the lantern door
  releaseStart: 68.9, releaseStep: .55,
  shelfOpen0: 87.6, shelfStep: .17,
  towerGold: [88.0, 94.0],
  wake: 98.2,
  dawn: 103.2,
  noeulOut: [105.6, 108.6], sitBy: 109.0,
  narrow: [113.4, 118.4],
  fadeOut: [118.8, 120.0],
};

// voice lines: t = start; duration from voices/dur.json. dlg: shown in the dialogue box (on-screen speaker), else subtitle
export const VO = [
  { id: 'h1', t: 0.9, dlg: true, who: '하루', sub: '오늘 밤은, 제가 지킬게요.' },
  { id: 'n1', t: 4.3, sub: '등불을 넘겨받은 첫 밤이었습니다.' },
  { id: 'n2', t: 14.2, sub: '탑에는 어젯밤 되찾은 악몽들이 새 등불 속에 잠들어 있었고, 노을 할머니는 평생 처음으로 깊이 자고 있었습니다.',
    parts: [[0, '탑에는 어젯밤 되찾은 악몽들이 새 등불 속에 잠들어 있었고,'], [4.8, '노을 할머니는 평생 처음으로 깊이 자고 있었습니다.']] },
  { id: 'n3', t: 24.0, sub: '하루는 할머니가 하던 대로, 골목을 돌며 나방들을 불러 모았습니다.' },
  { id: 'h2', t: 34.6, dlg: true, who: '하루', sub: '더는… 못 담겠어.' },
  { id: 'n4', t: 37.3, sub: '작은 등불은 금세 가득 찼고, 유리에 금이 갔습니다.' },
  { id: 'h3', t: 45.6, dlg: true, who: '하루', sub: '너도… 무서웠구나.' },
  { id: 'n5', t: 49.2, sub: '하루가 따뜻한 불빛에 비춰 주자, 나방은 반딧불이 되었습니다.' },
  { id: 'n6', t: 55.6, sub: '그리고 자기가 나온 창문으로 날아 돌아갔습니다.' },
  { id: 'h4', t: 62.9, dlg: true, who: '하루', sub: '가두지 않아도 돼. 돌려보내면 되는 거야.' },
  { id: 'n7', t: 70.2, sub: '그 밤, 마을의 악몽들은 하나씩 반딧불이 되어 집으로 돌아갔습니다.' },
  { id: 'n8', t: 88.2, sub: '탑에 갇혀 있던 오래된 악몽들까지도.' },
  { id: 'k1', t: 99.5, dlg: true, who: '노을', sub: '…이런 방법이, 있었구나.' },
  { id: 'n9', t: 104.5, sub: '새벽, 첫 밤을 지킨 파수꾼은 탑 계단에서 잠이 들었습니다.' },
  { id: 'k2', t: 111.6, dlg: true, who: '노을', sub: '푹 자거라. 이번엔, 내가 지키마.' },
];

// cards drawn by the overlay (Korean only: the film's language)
export const CARDS = [
  { kind: 'title', a: 8.1, b: 13.6, text: '악몽을 지키는 파수꾼 2' },
  { kind: 'place', a: 23.3, b: 27.6, label: '등불탑 마을', text: '다음 날 밤' },
  { kind: 'place', a: 66.6, b: 70.0, label: '둘째 장', text: '돌려보내는 밤' },
];

// black dips between sets: [cut, out, in]
export const FADES = [[7.5, .35, .45], [13.8, .4, .5], [23.0, .35, .45], [68.5, .25, .4], [86.0, .4, .5], [104.0, .45, .7]];

export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
