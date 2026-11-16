#!/usr/bin/env node
/**
 * google_tts_takes.mjs — records this video's narration with Google Cloud Text-to-Speech (the user chose it on 2026-11-16:
 * voice ko-KR-Chirp3-HD-Sadaltager, sample 3) and puts each take where the skill's tts.mjs keeps its takes
 * (.tts-cache/<key>.pcm, 16-bit mono PCM at 44.1 kHz). The key is computed exactly as tts.mjs does from script.json
 * (voice, model, say, temperature, top_p, sample rate), so tts.mjs then uses these takes as cached ones and every later
 * step of the skill (cuts, wave.mjs, sync.mjs, check.mjs) works unchanged.
 *
 *   NODE_USE_ENV_PROXY=1 node sfx/google_tts_takes.mjs [projectDir] [--only id,id]   then:   node <skill>/scripts/tts.mjs <dir> --record-cache
 *
 * script.json "voice" is "google:<voice name>" and "model" is "google-tts" (so these keys never collide with Fish takes).
 * The API key is never in this file: the session's network proxy adds X-Goog-Api-Key for texttospeech.googleapis.com,
 * or GOOGLE_TTS_API_KEY from the environment is sent in that header (never printed). Speed stays 1 (the skill's rule).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const oi = args.indexOf('--only'); const only = oi >= 0 ? new Set(args[oi + 1].split(',')) : null;
const dir = path.resolve(args.find((a, i) => !a.startsWith('--') && i !== oi + 1) || '.');
const SR = 44100;
const DEFAULTS = { voice: '', model: 'drama-3', temperature: 0.7, top_p: 0.7 };
const script = JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8'));
const cfg = { ...DEFAULTS }; for (const k of Object.keys(DEFAULTS)) if (script[k] != null) cfg[k] = script[k];
if (!String(cfg.voice).startsWith('google:')) { console.error('script.json "voice" must be "google:<voice name>"'); process.exit(2); }
const voiceName = cfg.voice.slice('google:'.length), lang = voiceName.split('-').slice(0, 2).join('-');
// the same key as tts.mjs cacheKey(c, 2)
const cacheKey = (c) => crypto.createHash('sha256').update(JSON.stringify({ v: 2, model: cfg.model, voice: cfg.voice, say: c.say, speed: 1, temperature: cfg.temperature, top_p: cfg.top_p, sr: SR })).digest('hex').slice(0, 24);
const cacheDir = path.join(dir, '.tts-cache'); fs.mkdirSync(cacheDir, { recursive: true });
const headers = { 'Content-Type': 'application/json', ...(process.env.GOOGLE_TTS_API_KEY ? { 'X-Goog-Api-Key': process.env.GOOGLE_TTS_API_KEY } : {}) };

/** the PCM samples inside a WAV (LINEAR16 comes back as a WAV file) */
function pcmOf(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return buf;
  let p = 12;
  while (p + 8 <= buf.length) { const id = buf.toString('ascii', p, p + 4), n = buf.readUInt32LE(p + 4); if (id === 'data') return buf.subarray(p + 8, p + 8 + n); p += 8 + n + (n & 1); }
  throw new Error('no data chunk');
}
async function synth(text) {
  const body = { input: { text }, voice: { languageCode: lang, name: voiceName }, audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: SR, speakingRate: 1.0 } };
  for (let a = 1; ; a++) {
    const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
    if (r.ok) return pcmOf(Buffer.from((await r.json()).audioContent, 'base64'));
    const detail = (await r.text()).slice(0, 200);
    if ([0, 429, 500, 502, 503, 504].includes(r.status) && a < 4) { await new Promise((s) => setTimeout(s, 1500 * 2 ** a)); continue; }
    throw new Error(`HTTP ${r.status} ${detail}`);
  }
}
let made = 0, kept = 0, chars = 0;
for (const c of script.cues) {
  if (only && !only.has(c.id)) continue;
  const f = path.join(cacheDir, cacheKey(c) + '.pcm');
  if (fs.existsSync(f) && !only) { kept++; continue; }
  const pcm = await synth(c.say); fs.writeFileSync(f, pcm); made++; chars += c.say.length;
  console.log(`  ✓ ${c.id} (${(pcm.length / 2 / SR).toFixed(2)}s)`);
}
console.log(`google tts: ${made} new take(s), ${kept} already cached · ${chars} characters sent · voice ${voiceName}`);
