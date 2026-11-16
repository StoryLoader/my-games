/* timeline.js — the beats of 「남은 길」 (90 s: 1편 해질녘 0–30, 2편 「남은 불」 밤 30–60, 3편 「남은 꿈」 꿈과 새벽 60–90) in seconds, shared by js/scenes.js (picture) and sfx/make_sound.py (sound),
   so every footstep, wingbeat and caw you hear lands on the frame that shows it. Plain JSON inside. */
window.TLINE = {
 "shots": [
  0,
  4.5,
  8.0,
  12.5,
  17.0,
  21.0,
  25.0,
  30.0,
  34.0,
  38.5,
  43.0,
  47.5,
  51.5,
  56.0,
  60.0,
  63.0,
  68.0,
  72.0,
  76.0,
  79.0,
  84.0,
  90.0
 ],
 "speed": [
  [
   0,
   0.85
  ],
  [
   21.4,
   0.85
  ],
  [
   22.5,
   0
  ],
  [
   24.4,
   0
  ],
  [
   25.2,
   0.85
  ],
  [
   30,
   0.85
  ]
 ],
 "stride": 1.15,
 "grave": [
  19.5,
  -1.15
 ],
 "crow": {
  "takeoff": 17.3,
  "land": 21.35,
  "hop": [
   24.35,
   24.95
  ],
  "lookKnight": 13.6,
  "nuzzle": 16.1,
  "caws": [
   [
    2.6,
    0.22
   ],
   [
    14.2,
    1.0
   ],
   [
    24.0,
    0.55
   ],
   [
    28.6,
    0.16
   ]
  ]
 },
 "knight": {
  "turnToCrow": 14.9,
  "ember": 15.3,
  "faceGrave": 22.6,
  "bow": 23.1,
  "rise": 24.1
 },
 "gust": 23.2,
 "fade": [
  28.3,
  29.8
 ],
 "title": [
  27.6,
  30.0
 ],
 "act2": {
  "walk": [
   30.0,
   34.2
  ],
  "walkFrom": 40.6,
  "camp": [
   44.0,
   -1.55
  ],
  "tower": [
   44.0,
   -3.6
  ],
  "fire": [
   44.0,
   -0.78
  ],
  "swordDown": [
   34.3,
   35.0
  ],
  "sit": [
   35.0,
   35.9
  ],
  "crowDown": [
   35.9,
   36.7
  ],
  "trips": [
   [
    38.8,
    40.7
   ],
   [
    41.0,
    42.9
   ]
  ],
  "lean": [
   43.6,
   44.6
  ],
  "ember": [
   44.6,
   45.3
  ],
  "ignite": 45.3,
  "blaze": [
   45.3,
   46.6
  ],
  "unlean": [
   46.4,
   47.3
  ],
  "nod": [
   52.0,
   53.6
  ],
  "nestle": [
   53.6,
   54.8
  ],
  "cover": [
   54.6,
   55.6
  ],
  "caws": [
   [
    36.9,
    0.3
   ],
   [
    42.95,
    0.45
   ]
  ],
  "title": [
   57.6,
   60.0
  ],
  "fade": [
   58.3,
   59.8
  ]
 },
 "act3": {
  "fadeIn": [
   60.0,
   60.8
  ],
  "flare": [
   62.0,
   62.6
  ],
  "red": [
   62.4,
   63.1
  ],
  "dream": [
   63.0,
   79.0
  ],
  "clash": [
   64.4,
   65.6,
   66.6,
   68.5
  ],
  "pushed": [
   69.3,
   70.4
  ],
  "bannerFall": [
   70.7,
   71.8
  ],
  "blow": 73.2,
  "fall": [
   73.8,
   75.2
  ],
  "crowLand": [
   76.6,
   78.0
  ],
  "wake": 79.15,
  "startle": [
   79.15,
   79.9
  ],
  "tear": [
   80.6,
   82.5
  ],
  "drop": 82.55,
  "nuzzle": [
   83.0,
   84.0
  ],
  "plant": [
   85.0,
   85.8
  ],
  "hilt": [
   86.0,
   86.5
  ],
  "shoulder": [
   87.1,
   87.6
  ],
  "walk": [
   87.4,
   90.0
  ],
  "caws": [
   [
    86.7,
    0.35
   ],
   [
    89.2,
    0.2
   ]
  ],
  "title": [
   87.8,
   90.0
  ],
  "fade": [
   88.9,
   89.9
  ]
 }
};
