// export.mjs — writes timeline.json from story.js (DUR, SHOTS, T, VO) for the Python mix
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const here = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const m = await import(pathToFileURL(path.join(here, 'story.js')).href);
fs.writeFileSync(path.join(here, 'timeline.json'), JSON.stringify({ DUR: m.DUR, BEAT: m.BEAT, SHOTS: m.SHOTS, T: m.T, VO: m.VO }, null, 1));
console.log('timeline.json');
