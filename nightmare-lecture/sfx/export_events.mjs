#!/usr/bin/env node
/** export_events.mjs — opens the page headless (no picture taken), lets js/scenes.js build, and writes the sound events
 *  the scenes registered with K.sfx(type, at) to sfx/events.json, for sfx/make_sound.py. Run after any timing change.
 *    node sfx/export_events.mjs [projectDir]                                                                   */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const dir = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href + '?stills');
let last = -1, stable = 0;
for (let i = 0; i < 240 && stable < 4; i++) {
  await page.waitForTimeout(500);
  const n = await page.evaluate(() => (window.SFX_EVENTS || []).length);
  stable = n > 0 && n === last ? stable + 1 : 0; last = n;
}
const ev = await page.evaluate(() => window.SFX_EVENTS.slice().sort((a, b) => a.t - b.t));
const film = await page.evaluate(() => ({ F0: null }));
fs.writeFileSync(path.join(dir, 'sfx', 'events.json'), JSON.stringify(ev, null, 0));
console.log(ev.length, 'events →', path.join(dir, 'sfx', 'events.json'));
const counts = {}; for (const e of ev) counts[e.type] = (counts[e.type] || 0) + 1; console.log(counts);
await browser.close();
