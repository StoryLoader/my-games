// 악몽을 지키는 파수꾼 2 — B 「열두 번째 등불」: the timeline (single source of truth: the page, the mixer and the subtitles read
// these numbers; tools/export.mjs writes them to timeline.json for Python). TREATMENT.md has the why of every shot.
export const DUR = 120.0;

// shot → set (town | tower). a/b in seconds.
export const SHOTS = [
  { id: 'count', set: 'tower', a: 0.0, b: 10.6 },       // dawn: 하루 counts the lanterns; the 12th stands open and empty; the small window ajar
  { id: 'title', set: 'town', a: 10.6, b: 16.6 },       // the tower on its hill: the title
  { id: 'resolve', set: 'tower', a: 16.6, b: 22.6 },    // he looks at 노을 asleep: he will catch the thief himself
  { id: 'night1', set: 'tower', a: 22.6, b: 39.0 },     // the first night: he watches the shelf; a blink — click — the 12th is open again
  { id: 'night2', set: 'tower', a: 39.0, b: 45.0 },     // the second night: flour on the floor
  { id: 'morning2', set: 'tower', a: 45.0, b: 55.0 },   // morning: tiny footprints from the window to the shelf; the same scratched lantern
  { id: 'night3', set: 'tower', a: 55.0, b: 74.5 },     // the third night: thread and bell, hiding under the table; the bell; the huge winged shadow; a small girl
  { id: 'reveal', set: 'tower', a: 74.5, b: 88.0 },     // 봄이 with the open lantern: inside the violet, her dog running in the snow
  { id: 'decide', set: 'tower', a: 88.0, b: 101.0 },    // he sets his lantern down beside her: the dog's shadow runs across the wall
  { id: 'dawn', set: 'tower', a: 101.0, b: 111.5 },     // dawn: two children asleep by the twelfth lantern
  { id: 'wink', set: 'tower', a: 111.5, b: 120.0 },     // 노을 opens one eye: the small window, ajar
];

export const T = {
  count: [0.75, 1.7, 2.65],        // 아홉, 열, 열하나 — his finger taps along the lower shelf
  night1: [22.6, 39.0], blink: 33.4, click1: 33.75,
  flour: [40.4, 44.2],
  morning2: 45.0, scratch: 49.4,
  thread: [56.2, 59.6], hide: 60.4, candleOut: 61.2,
  winOpen: 63.6, bomiIn: [64.1, 66.0], open3: 66.15, bell: 68.3, uncover: 68.9, standUp: 71.0, reveal: 72.6,
  vision: 75.0,
  setDown: 90.6, sit: 91.4, dogShadow: [92.0, 101.0],
  dawn: 101.0, eyeOpen: 112.6, eyeClose: 117.2,
  narrow: [112.0, 118.4],
  fadeOut: [118.8, 120.0],
};

// voice lines: t = start; duration from voices/dur.json. dlg: shown in the dialogue box (on-screen speaker), else subtitle
export const VO = [
  { id: 'h1', t: 0.6, dlg: true, who: '하루', sub: '아홉, 열, 열하나… 또 하나 비었어.' },
  { id: 'n1', t: 4.9, sub: '하루가 파수꾼이 된 뒤로, 새벽마다 등불 하나가 비어 있었습니다.' },
  { id: 'h2', t: 17.4, dlg: true, who: '하루', sub: '할머니한테 들키기 전에, 내가 잡을 거야.' },
  { id: 'n2', t: 23.6, sub: '첫째 밤, 하루는 한숨도 자지 않고 선반을 지켰습니다.' },
  { id: 'h3', t: 34.5, dlg: true, who: '하루', sub: '…어? 또야?!' },
  { id: 'n3', t: 39.8, sub: '둘째 날 밤에는, 바닥에 밀가루를 뿌렸습니다.' },
  { id: 'h4', t: 48.3, dlg: true, who: '하루', sub: '아이 발자국…? 또 열두 번째 등불이야.' },
  { id: 'n4', t: 55.8, sub: '셋째 밤, 하루는 등불에 방울을 달고 숨었습니다.' },
  { id: 'b1', t: 66.5, dlg: true, who: '???', sub: '…뭉치야?' },
  { id: 'h5', t: 69.9, dlg: true, who: '하루', sub: '너… 누구야?' },
  { id: 'b2', t: 75.6, dlg: true, who: '봄이', sub: '꿈에서는… 아직 있어요. 뭉치가.' },
  { id: 'n5', t: 79.8, sub: '지난겨울 눈 속에서 잃어버린 강아지는, 봄이의 악몽 속에서만 아직 살아 있었습니다.' },
  { id: 'h6', t: 93.6, dlg: true, who: '하루', sub: '…밤마다 와도 돼. 대신 여기서, 같이 보자.' },
  { id: 'n6', t: 102.2, sub: '그날부터 열두 번째 등불은 밤마다 열렸습니다. 이번에는, 둘이 함께.' },
  { id: 'k1', t: 113.4, dlg: true, who: '노을', sub: '…창문은, 내가 열어 뒀단다.' },
];

// cards drawn by the overlay (Korean only: the film's language)
export const CARDS = [
  { kind: 'title', a: 11.0, b: 16.3, text: '악몽을 지키는 파수꾼 2', sub: '열두 번째 등불' },
  { kind: 'place', a: 22.9, b: 26.9, label: '등불탑', text: '첫째 밤' },
  { kind: 'place', a: 39.3, b: 43.2, label: '등불탑', text: '둘째 날 밤' },
  { kind: 'place', a: 55.3, b: 59.3, label: '등불탑', text: '셋째 밤' },
];

// black dips between scenes: [cut, out, in]; the blink is a short one
export const FADES = [[10.6, .35, .45], [16.6, .35, .45], [22.6, .35, .5], [T.blink + .2, .18, .2], [39.0, .3, .4], [45.0, .3, .45], [55.0, .3, .45], [74.5, .2, .3], [101.0, .45, .6], [111.5, .3, .4]];

export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
