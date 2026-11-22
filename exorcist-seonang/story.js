// 서낭나무 — the timeline (single source of truth for the page, the score, the mix and the subtitles). TREATMENT.md has the why.
export const DUR = 137.0;
export const BEAT = .75;   // 80 bpm where the score has a pulse (the walk, the dig, the fight); elsewhere unmetred

// [id, t0, t1]
export const SHOTS = [
  ['open', 0, 9.6],        // high wide on the empty paper: the tree, the frozen excavator, the strips that move with no wind
  ['title', 9.6, 15.6],    // the title written in a column in the empty sky, the seal
  ['arrive', 15.6, 33.4],  // lateral tracking: 서하 and 무진 cross the lot toward the tree
  ['bell', 33.4, 41.0],    // the bell in her hand → the strips lift → an ink bloom opens under the ground
  ['vision', 41.0, 52.8],  // the hanging-scroll tilt down through the roots: the hungry mouths
  ['confront', 52.8, 63.6],// 서하 and the site manager, empty paper between them
  ['dig', 63.6, 74.4],     // low angle: the excavator towers, the bucket bites the roots, the ground cracks
  ['agwi', 74.4, 88.0],    // they rise out of the crack in ink blooms; 무진 strikes, one is split
  ['fail', 88.0, 95.9],    // the bell is dead; 무진: a body for the god
  ['eyes', 95.9, 100.6],   // hard cut: her eyes
  ['climb', 100.6, 113.0], // tilt up the excavator arm: she stands barefoot on the blade
  ['climax', 113.0, 121.0],// silence → one stroke of flying white → the god speaks through her → they sink back
  ['dawn', 121.0, 137.0],  // the opening framing again at dawn; the tree stays; the red thread drying
];
export const T = {
  stripsMove: 3.0, titleW: [10.2, 13.6], seal1: 13.9,
  walk: [16.0, 32.4],
  ring: [34.3, 36.6], lift: 35.0, bloom: [38.6, 41.4],
  tilt: [41.6, 51.6],
  engine: 64.0, bite: 67.8, tear: 70.2, crack: [71.4, 74.2],
  rise: [74.6, 79.0], strike1: 82.6, strike2: 85.4,
  dead: 88.6,
  climbTilt: [101.2, 108.0], stand: 108.4,
  hush: [112.4, 113.9], drip: 113.1, white: [113.9, 114.25], sink: [116.2, 120.4], close: 120.2,
  dawnWash: [121.0, 125.0], thread: [131.6, 136.2], seal2: 134.0, fade: [136.0, 137.0],
};
// voice lines: t = start (durations from voices/dur.json); text = what is said and shown
export const VO = [
  { id: 'k1', t: 2.0, who: 'boss', text: '벌써 세 명째예요. 저 나무에 손만 대면, 기사가 그대로 쓰러져요.' },
  { id: 's1', t: 16.6, who: 'seoha', text: '나무 귀신이라… 방울 몇 번 흔들고 끝내죠.' },
  { id: 'm1', t: 20.9, who: 'mujin', text: '이건 서낭나무야. 오백 년 동안 이 동네를 지켜 왔지. 함부로 쫓을 게 아니다.' },
  { id: 's2', t: 28.4, who: 'seoha', text: '전 신 안 받는 무당이에요. 쫓고, 돈 받고, 끝.' },
  { id: 'm2', t: 43.8, who: 'mujin', text: '오백 년 전 흉년에 굶어 죽은 넋들이다. 저 나무가 여태 누르고 있었던 게야.' },
  { id: 's3', t: 53.8, who: 'seoha', text: '소장님, 공사 멈춰요. 저 나무 뽑으면 안 돼요.' },
  { id: 'k2', t: 58.0, who: 'boss', text: '공사가 벌써 열흘이나 밀렸어요. 오늘 밤에 뽑습니다.' },
  { id: 'k3', t: 75.2, who: 'boss', text: '저… 저게, 다 뭐야.' },
  { id: 'm3', t: 78.3, who: 'mujin', text: '다들 물러나! 여긴 내가 막는다!' },
  { id: 's4', t: 88.6, who: 'seoha', text: '방울이… 안 들어.' },
  { id: 'm4', t: 91.0, who: 'mujin', text: '다시 누르려면, 나무 대신 신을 모실 몸이 있어야 한다.' },
  { id: 's5', t: 96.4, who: 'seoha', text: '신을 받으라고요? 평생 그것만은 피해 왔는데.' },
  { id: 'm5', t: 99.9, who: 'mujin', text: '신을 모시려면 작두를 타야 한다. 여기 날은… 저것뿐이다.' },
  { id: 's6', t: 110.0, who: 'seoha', text: '오세요. 제가 모실게요.' },
  { id: 'g1', t: 115.2, who: 'god', text: '물러가라. 배고픈 것들아, 이제 그만 잠들어라.' },
  { id: 'k4', t: 122.4, who: 'boss', text: '설계를 바꾸겠습니다. 저 나무는… 단지 한가운데 둡시다.' },
  { id: 's7', t: 128.0, who: 'seoha', text: '이제 진짜 무당이네, 나.' },
  { id: 'm6', t: 130.4, who: 'mujin', text: '어서 오시게.' },
];
export const shotAt = t => SHOTS.find(s => t >= s[1] && t < s[2]) || SHOTS[SHOTS.length - 1];
// subtitle spans: from the voice start until max(1.8 s, speech + .6 s), yielding to the next line
export function subSpans(durs) {
  const S = VO.map(v => { const d = durs[v.id] ?? v.text.length * .08; return { ...v, a: v.t - .05, b: v.t + Math.max(d + .6, 1.8) }; });
  S.forEach((s, i) => { if (S[i + 1]) s.b = Math.min(s.b, S[i + 1].a - .05); });
  return S;
}
