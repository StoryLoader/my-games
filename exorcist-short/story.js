// 막차 — the timeline (single source of truth for the picture, the score, the mix and the subtitles).
// ♩ = 96: one beat 0.625 s, one bar 2.5 s. Every cut lands on a bar.
export const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4;
export const bar = n => n * BAR;
export const DUR = bar(49);   // 122.5 s

// shots: [id, start, end]
export const SHOTS = [
  ['hook', 0, bar(3)],            // 0–7.5    없는 역: the sleeper's shadow steps off; PA; doors close
  ['title', bar(3), bar(5)],      // 7.5–12.5 rear view down the tunnel, title 「막차」
  ['two', bar(5), bar(12)],       // 12.5–30  the car: 서하 and 무진 on the far bench (the case, the rule, the plant)
  ['seoha', bar(12), bar(14)],    // 30–35    서하 close, light bands: "끝은, 제가 내요."
  ['track', bar(14), bar(16)],    // 35–40    side tracking through the cars → 서준 asleep
  ['phone', bar(16), bar(17)],    // 40–42.5  insert: his last message
  ['talisman', bar(17), bar(18)], // 42.5–45  the cab door: the talisman ignites
  ['speed', bar(18), bar(19)],    // 45–47.5  impact frame → speed lines on 서하; PA again
  ['mujin', bar(19), bar(21)],    // 47.5–52.5 무진 shouts the rule: fighting makes it faster
  ['door', bar(21), bar(23)],     // 52.5–57.5 the next 없는 역: shadows stream to the door; 무진 backlit in it
  ['punch', bar(23), bar(26)],    // 57.5–65  무진's fists (impact frames on the bars)
  ['peel', bar(26), bar(28)],     // 65–70    서준's shadow peels from his feet
  ['cab', bar(28), bar(32)],      // 70–80    the cab: the bell breaks the door; the 1984 driver murmurs stations
  ['raise', bar(32), bar(34)],    // 80–85    서하 raises the bell; 무진's shout from far: "끝을 알려 줘라!"
  ['decide', bar(34), bar(36)],   // 85–90    held bust, light bands, one beat of true silence, the eyes
  ['mic', bar(36), bar(39)],      // 90–97.5  the PA handset: "이번 역은, 종착역입니다…"
  ['arrive', bar(39), bar(41)],   // 97.5–102.5 white flash → a real, lit station; the shadows go home
  ['driver', bar(41), bar(43)],   // 102.5–107.5 the driver, backlit, takes off his cap and fades
  ['wake', bar(43), bar(46)],     // 107.5–115 서준 wakes: "몇 정거장이나 지났어?" "…한 바퀴."
  ['map', bar(46), bar(47)],      // 115–117.5 the route map: the nameless station is erased
  ['freeze', bar(47), bar(49)],   // 117.5–122.5 서하's half smile frozen + "다음 이야기"; the tape runs out
];
export const shotAt = t => SHOTS.find(s => t >= s[1] && t < s[2]) || SHOTS[SHOTS.length - 1];

// lines: start times (durations from voices/dur.json)
export const VO = [
  { id: 'pa1', who: 'pa', t: 1.4, text: '이번 역은… 없는 역입니다.' },
  { id: 's1', who: 'seoha', t: 12.9, text: '스님, 의뢰받은 열차가 이거죠? 막차에서 잠든 사람들이 안 깨어난다는.' },
  { id: 'm1', who: 'mujin', t: 18.4, text: '역을 하나 지날 때마다, 잠든 사람의 그림자가 하나씩 내린다. 한 바퀴를 다 돌면, 다시는 못 깨어나지.' },
  { id: 'm2', who: 'mujin', t: 27.9, text: '끝을 알려 줘야 끝나는 것들이 있다.' },
  { id: 's2', who: 'seoha', t: 31.0, text: '끝은, 제가 내요.' },
  { id: 's3', who: 'seoha', t: 38.9, text: '서준아?!' },
  { id: 's4', who: 'seoha', t: 40.4, text: '내 동생이… 왜 여기 있어.' },
  { id: 'pa2', who: 'pa', t: 45.5, text: '다음 역은… 없는 역입니다.' },
  { id: 'm3', who: 'mujin', t: 48.3, text: '멈춰라! 싸울수록 빨라진다!' },
  { id: 'm4', who: 'mujin', t: 53.6, text: '여긴 내가 막는다. 가라!' },
  { id: 's5', who: 'seoha', t: 66.2, text: '안 돼… 서준아!' },
  { id: 'd1', who: 'driver', t: 72.8, text: '시청… 을지로… 동대문… 다음 역은… 다음 역은…' },
  { id: 'm5', who: 'mujin', t: 79.4, text: '서하야! 저 사람은 마지막 운행을 아직 못 끝낸 거다. 끝을 알려 줘라!' },
  { id: 's6', who: 'seoha', t: 91.0, text: '이번 역은, 종착역입니다. 오늘도… 수고 많으셨습니다.' },
  { id: 'd2', who: 'driver', t: 104.2, text: '…고맙습니다.' },
  { id: 'j1', who: 'seojun', t: 108.4, text: '누나? 나 몇 정거장이나 지났어?' },
  { id: 's7', who: 'seoha', t: 111.8, text: '…한 바퀴.' },
];
// key moments
export const T = {
  shadowOff: [1.0, 3.6], doorsClose: 6.1, depart: 6.9,
  title: bar(3) + .5,
  slap: bar(17) + .7, ignite: bar(17) + 1.5, impact1: bar(18),
  doorsOpen2: bar(21) + .3, punches: [bar(23), bar(23) + 2 * BEAT, bar(24), bar(25), bar(25) + 2 * BEAT],
  peel: [bar(26) + .4, bar(28)],
  bellBreak: bar(28) + .5, raise: bar(32) + .3,
  silence: [bar(34) + 2.5 * BEAT, bar(34) + 3.5 * BEAT],   // one beat of true silence after 무진's shout
  lower: bar(35), grab: bar(36) + .6,
  flash: bar(39), brakes: bar(39) - .6, home: [bar(39) + 1, bar(40) + 2],
  capOff: bar(41) + 1.2, fade: [bar(42), bar(43) - .3],
  erase: bar(46) + .8, freeze: bar(47) + 1.0, tapeOut: DUR - .9,
};
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const q12 = t => Math.floor(t * 12 + 1e-6) / 12;
export const q8 = t => Math.floor(t * 8 + 1e-6) / 8;
