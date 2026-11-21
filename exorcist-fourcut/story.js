// 네 컷 — the timeline (single source for the picture, the score and the mix). ♩ = 96: one beat 0.625 s; cuts on beats.
export const BPM = 96, BEAT = 60 / BPM;
export const b = n => +(n * BEAT).toFixed(4);
export const DUR = b(214);   // 133.75 s

// shots: [id, set, start, end]
export const SHOTS = [
  ['print', 'printer', 0, b(14)],          // 0–8.75     a strip rises out of the slot line by line: 민아's last photo
  ['two', 'alley', b(14), b(30)],          // 8.75–18.75 지은 holds it out to 서하 under the shop light
  ['title', 'printer', b(30), b(36)],      // 18.75–22.5 the back of the strip: the title stamped
  ['glide', 'alley', b(36), b(56)],        // 22.5–35    low glide down the lane to the white shop; 무진 tells the rule
  ['wall', 'booth', b(56), b(74)],         // 35–46.25   the wall of strips; a face blinks; the 2003 poster
  ['curtain', 'booth', b(74), b(88)],      // 46.25–55   the printed rules by the curtain; 서하 goes in
  ['lens1', 'booth', b(88), b(106)],       // 55–66.25   from the lens: count, flash, count, flash
  ['outside', 'booth', b(106), b(114)],    // 66.25–71.25 무진 pulls the curtain: it is a wall
  ['shoulder', 'booth', b(114), b(136)],   // 71.25–85   the preview screen: a hand on her shoulder; her eyes; flash
  ['lens4', 'booth', b(136), b(150)],      // 85–93.75   the last count: the mirror to the lens; the biggest flash
  ['release', 'booth', b(150), b(162)],    // 93.75–101.25 the wall lets its people go; "끝."; the strip pinned up
  ['print2', 'printer', b(162), b(174)],   // 101.25–108.75 the slot prints again: a fifth sheet
  ['mujin', 'booth', b(174), b(184)],      // 108.75–115 무진 reads it
  ['door', 'booth', b(184), b(192)],       // 115–120    서하 steps out, smiling; the beads snap
  ['fall', 'booth', b(192), b(206)],       // 120–128.75 into the pinned strip, through the dots: the real 서하 inside the mirror
  ['end', 'printer', b(206), b(214)],      // 128.75–133.75 the receipt: 네 컷 · 다음 이야기
];
export const T = {
  b7a: 0.6, printA: [1.7, 8.2],
  stamp: 19.4,
  blink: 37.6, posterIn: 40.6,
  enter: 53.4, entClose: 54.4,
  flash: [60.6, 65.4, 83.5, 92.2],
  hand: 73.2, count3: [81.6, 82.25, 82.9],
  mirror: [86.9, 88.5],
  freed: [94.2, 96.0], pin: 100.2,
  printB: [102.7, 108.2],
  out: 115.3, snap: 119.0,
  push: [120.0, 122.5], resolve: [122.5, 123.3], dark: 126.8,
  receipt: [129.0, 131.6],
};
// voice lines: [id, start]; who/text come from lines.json, durations from voices/dur.json
export const VO = [
  ['b7', T.b7a], ['j1', 9.3], ['s1', 15.4], ['m1', 23.8], ['s2', 35.8], ['s3', 46.6], ['m2', 48.2],
  ['b1', 55.6], ['b2', 62.2], ['m3', 66.8], ['b3', 71.6], ['g1', 74.4], ['s4', 77.4], ['b4', 81.6],
  ['b5', 85.4], ['s5', 88.9], ['b6', 91.2], ['s6', 99.4], ['b7', 101.6], ['m4', 109.4], ['s7', 116.6], ['s8', 124.0],
];
export const shotAt = t => SHOTS.find(s => t >= s[2] && t < s[3]) || SHOTS[SHOTS.length - 1];
