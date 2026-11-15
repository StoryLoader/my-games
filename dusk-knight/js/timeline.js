/* timeline.js — the beats of 「남은 길」 in seconds, shared by js/scenes.js (picture) and sfx/make_sound.py (sound),
   so every footstep, wingbeat and caw you hear lands on the frame that shows it. Plain JSON inside. */
window.TLINE = {
  "shots": [0, 4.5, 8.0, 12.5, 17.0, 21.0, 25.0, 30.0],
  "speed": [[0, 0.85], [21.4, 0.85], [22.5, 0], [24.4, 0], [25.2, 0.85], [30, 0.85]],
  "stride": 1.15,
  "grave": [19.5, -1.15],
  "crow": { "takeoff": 17.3, "land": 21.35, "hop": [24.35, 24.95], "lookKnight": 13.6, "nuzzle": 16.1,
            "caws": [[2.6, 0.22], [14.2, 1.0], [24.0, 0.55], [28.6, 0.16]] },
  "knight": { "turnToCrow": 14.9, "ember": 15.3, "faceGrave": 22.6, "bow": 23.1, "rise": 24.1 },
  "gust": 23.2,
  "fade": [28.3, 29.8],
  "title": [27.6, 30.0]
};
