// 마지막 한 프레임 — the timeline (single source for the page, the mixer and the subtitles).
// The cosmic clock: playback 0 s = the Big Bang, 120 s = now (13.8 billion years / 120 s ≈ 115 million years per second).
// Every event sits at its true second (research.md §3): t = 120 × (1 − age / 13.8 billion).
'use strict';
const AGE = 13.8e9, CLOCK = 120;
const tOf = age => CLOCK * (1 - age / AGE);
const T = {
  bang: 0, firstStars: tOf(13.65e9),            // ~1.3 s
  half: 60, sun: tOf(4.6e9), earth: tOf(4.54e9), // 80.0 / 80.5
  life: tOf(3.5e9), oxygen: tOf(2.4e9),          // 89.6 / 99.1
  cambrian: tOf(539e6), dinoIn: tOf(230e6), dinoOut: tOf(66e6),   // 115.3 / 118.0 / 119.43
  lastFrame: CLOCK - 1 / 24, freeze: CLOCK,      // 119.958 / 120
  pullStrip: 121.6, band: 130.7, push: 136.6, pull: 149.0, end: 162.5,
};
const DUR = T.end;
// shots: [id, a, b]
const SHOTS = [
  ['bang', 0, 8.9], ['premise', 8.9, 27.5], ['galaxies', 27.5, 35.5], ['dust', 35.5, 66], ['collapse', 66, 80],
  ['sun', 80, 84.2], ['earth', 84.2, 103], ['parade', 103, 120], ['freeze', 120, 136.6], ['inside', 136.6, 149], ['pull', 149, DUR],
];
const shotAt = t => SHOTS.find(s => t >= s[1] && t < s[2]) || SHOTS[SHOTS.length - 1];
// narration: start times (duration from voices/dur.json); n1 is the on-screen promise itself, so it has no subtitle
const VO = [
  ['n1', .4], ['n2', 6.0], ['n3', 9.4], ['n4', 15.4], ['n5', 20.2], ['n6', 28.0], ['n7', 36.0], ['n8', 41.2], ['n9', 59.2], ['n10', 67.0],
  ['n11', 79.3], ['n12', 84.2], ['n13', 88.6], ['n14', 93.8], ['n15', 99.2], ['n17', 113.6], ['n18', 116.8],
  ['n19', 121.9], ['n20', 124.1], ['n21', 130.7], ['n22', 138.0], ['n23', 149.3], ['n24', 152.4],
];
// the history inside the last 1/16 (n22 word times: hand +0, seed +1.86, pyramid +3.54, Moon +5.3, "모두 이 조각" +7.66)
const HIST = [
  [137.4, '30만 년 전', '호모 사피엔스', 'fig'], [138.0, '4만 년 전', '동굴 벽의 손바닥', 'hand'], [139.86, '1만 2천 년 전', '처음 심은 씨앗', 'seed'],
  [141.54, '4,500년 전', '피라미드', 'pyr'], [143.3, '1969년', '달에 찍힌 발자국', 'moon'], [145.66, '지금', '이 영상을 보는 당신', 'phone'],
];
// marks on the time ruler, cut in as the clock passes them
const MARKS = [
  [0, '빅뱅·첫 별'], [60, '절반'], [T.sun, '태양·지구'], [T.life, '첫 생명'], [T.oxygen, '산소'], [T.cambrian, '동물'], [T.dinoIn, '공룡'],
];
function yearsAgo(t){
  const y = AGE * (1 - Math.min(CLOCK, t) / CLOCK);
  if (y >= 1e9) return Math.round(y / 1e8) + '억 년 전';
  if (y >= 1e8) return (y / 1e8).toFixed(1).replace('.0', '') + '억 년 전';
  if (y >= 1e4) return Math.round(y / 1e4).toLocaleString('en') + '만 년 전';
  return '지금';
}
const clockStr = t => { t = Math.min(CLOCK, t); const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); };
// subtitles: the narration as said, broken at its pauses (n1 is on screen as the promise itself). [offset from the line's start, text]
const SUBS = {
  n2: [[0, '눈을 한 번 깜빡이면, 놓칩니다.']],
  n3: [[0, '이 2분짜리 영상을,\n우주의 나이 138억 년이라고\n해 보겠습니다.']],
  n4: [[0, '그러면 영상의 1초는,\n약 1억 1500만 년입니다.']],
  n5: [[0, '빅뱅은 영상이 시작된\n바로 그 순간이었고,\n첫 별들은 2초도 지나기 전에\n켜졌습니다.']],
  n6: [[0, '별들이 모여 은하가 되고,\n우주에는 수천억 개의 은하가\n생겨났습니다.']],
  n7: [[0, '별은 타다가 죽고,\n죽으면서 먼지를 남깁니다.']],
  n8: [[0, '그 먼지가 모여 다시 별이 되고,\n또 죽고.\n그렇게 1분이 흘러갑니다.']],
  n9: [[0, '영상의 절반이 지났지만,\n아직 태양도 지구도 없습니다.']],
  n10: [[0, '그러다 오래된 별들이 남긴\n먼지 구름 하나가,\n천천히 뭉치기 시작합니다.']],
  n11: [[0, '1분 20초.\n태양과 지구가 생깁니다.']],
  n12: [[0, '펄펄 끓던 지구가 식으면서,\n바다가 생기고,']],
  n13: [[0, '1분 30초 무렵,\n바다에 첫 생명의 흔적이\n나타납니다.']],
  n14: [[0, '그 뒤로도 오랫동안, 생명은\n눈에 보이지 않을 만큼\n작았습니다.']],
  n15: [[0, '1분 39초,\n공기에 산소가 차오르고,']],
  n17: [[0, '1분 55초,\n동물들이 쏟아져 나옵니다.']],
  n18: [[0, '1분 58초,\n공룡이 나타납니다.']],
  n19: [[0, '여기서 멈추겠습니다.']],
  n20: [[0, '이 영상의 마지막 한 칸입니다.\n24분의 1초, 약 480만 년.']],
  n21: [[0, '인간은,\n이 마지막 칸의 16분의 1,\n그 작은 조각 속에만 있습니다.']],
  n22: [[0, '동굴 벽에 손바닥을 찍고,\n씨앗을 심고, 피라미드를 쌓고,\n달에 발자국을 남긴 것까지.'], [7.66, '모두 이 조각 속에\n들어 있습니다.']],
  n23: [[0, '먼지만도 못한 시간입니다.']],
  n24: [[0, '그런데 이 2분을\n처음부터 끝까지 본 건,\n그 16분의 1 속에 사는\n존재뿐입니다.']],
};
// where each line's last word ends (s from the line's start; voices/words.json, ASR word times)
const VOEND = {'n1': 5.12, 'n2': 2.6, 'n3': 4.98, 'n4': 3.84, 'n5': 6.06, 'n6': 5.24, 'n7': 4.0, 'n8': 6.0, 'n9': 4.14, 'n10': 5.02, 'n11': 3.64, 'n12': 3.58, 'n13': 4.38, 'n14': 4.76, 'n15': 3.18, 'n17': 2.96, 'n18': 3.14, 'n19': 1.24, 'n20': 6.06, 'n21': 5.44, 'n22': 10.42, 'n23': 2.08, 'n24': 6.86};
