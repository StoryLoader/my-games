#!/usr/bin/env node
/**
 * google_tts_takes.mjs — records this video's narration with Google Cloud Text-to-Speech (the user chose it on 2026-11-16:
 * voice ko-KR-Chirp3-HD-Sadaltager, sample 3) and puts each take where the skill's tts.mjs keeps its takes
 * (.tts-cache/<key>.pcm, 16-bit mono PCM at 44.1 kHz). The key is computed exactly as tts.mjs does from script.json
 * (voice, model, say, temperature, top_p, sample rate), so tts.mjs then uses these takes as cached ones and every later
 * step of the skill (cuts, wave.mjs, check.mjs) works unchanged.
 *
 *   NODE_USE_ENV_PROXY=1 node sfx/google_tts_takes.mjs [projectDir] [--only id,id] [--audit]
 *   then:   node <skill>/scripts/tts.mjs <dir> --record-cache
 *
 * Phrasing (user's note 2026-11-16: plain text ran through commas and paused where there was none):
 *   - each sentence of a cue is synthesized on its own and the sentences are joined with SENT_GAP of silence,
 *     after trimming each sentence's own leading/trailing silence to EDGE;
 *   - inside a sentence every comma gets a "[pause short]" tag (Chirp 3: HD "markup" input), so it pauses there.
 * --audit prints, per sentence, the pauses heard in the take (≥ 0.15 s under −45 dBFS) next to where the commas are
 * (by character position), for the agent to read and judge — nothing is changed by it.
 *
 * script.json "voice" is "google:<voice name>", "model" is "google-tts-markup" (keys never collide with other takes).
 * The API key is never in this file: the session's network proxy adds X-Goog-Api-Key for texttospeech.googleapis.com,
 * or GOOGLE_TTS_API_KEY from the environment is sent in that header (never printed). Speed stays 1 (the skill's rule).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const args = process.argv.slice(2);
const oi = args.indexOf('--only'); const only = oi >= 0 ? new Set(args[oi + 1].split(',')) : null;
const audit = args.includes('--audit');
const dir = path.resolve(args.find((a, i) => !a.startsWith('--') && i !== oi + 1) || '.');
const SR = 44100, SENT_GAP = 0.28, EDGE = 0.04;
const DEFAULTS = { voice: '', model: 'drama-3', temperature: 0.7, top_p: 0.7 };
const script = JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8'));
const cfg = { ...DEFAULTS }; for (const k of Object.keys(DEFAULTS)) if (script[k] != null) cfg[k] = script[k];
if (!String(cfg.voice).startsWith('google:')) { console.error('script.json "voice" must be "google:<voice name>"'); process.exit(2); }
const voiceName = cfg.voice.slice('google:'.length), lang = voiceName.split('-').slice(0, 2).join('-');
// the same key as tts.mjs cacheKey(c, 2)
const cacheKey = (c) => crypto.createHash('sha256').update(JSON.stringify({ v: 2, model: cfg.model, voice: cfg.voice, say: c.say, speed: 1, temperature: cfg.temperature, top_p: cfg.top_p, sr: SR })).digest('hex').slice(0, 24);
const cacheDir = path.join(dir, '.tts-cache'); fs.mkdirSync(cacheDir, { recursive: true });
// the per-sentence synthesis cache lives outside the project (only the joined takes belong in .tts-cache)
const sentDir = path.join(os.homedir(), '.cache', 'google-tts-sentences', path.basename(dir)); fs.mkdirSync(sentDir, { recursive: true });
const headers = { 'Content-Type': 'application/json', ...(process.env.GOOGLE_TTS_API_KEY ? { 'X-Goog-Api-Key': process.env.GOOGLE_TTS_API_KEY } : {}) };

/** the PCM samples inside a WAV (LINEAR16 comes back as a WAV file) */
function pcmOf(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  let p = 12;
  while (p + 8 <= buf.length) { const id = buf.toString('ascii', p, p + 4), n = buf.readUInt32LE(p + 4); if (id === 'data') { const d = buf.subarray(p + 8, p + 8 + n); return new Int16Array(d.buffer.slice(d.byteOffset, d.byteOffset + d.length)); } p += 8 + n + (n & 1); }
  throw new Error('no data chunk');
}
async function synth(markup) {
  const body = { input: { markup }, voice: { languageCode: lang, name: voiceName }, audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: SR, speakingRate: 1.0 } };
  for (let a = 1; ; a++) {
    const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
    if (r.ok) return pcmOf(Buffer.from((await r.json()).audioContent, 'base64'));
    const detail = (await r.text()).slice(0, 200);
    if ([0, 429, 500, 502, 503, 504].includes(r.status) && a < 4) { await new Promise((s) => setTimeout(s, 1500 * 2 ** a)); continue; }
    throw new Error(`HTTP ${r.status} ${detail}`);
  }
}
const sentences = (say) => say.match(/[^.?!]+[.?!]+["」』]?\s*|[^.?!]+$/g).map((s) => s.trim()).filter(Boolean);
const markupOf = (s) => s.replace(/,\s*/g, ', [pause short] ');
/** 20 ms levels (dBFS) */
const levels = (x) => { const w = Math.round(0.02 * SR), out = []; for (let i = 0; i + w <= x.length; i += w) { let s = 0; for (let k = i; k < i + w; k++) s += (x[k] / 32768) ** 2; out.push(10 * Math.log10(s / w + 1e-12)); } return out; };
/** the sentence's speech with its own edges trimmed to EDGE */
function trim(x) {
  // speech starts at the first run of ≥ 0.1 s above −45 dBFS (a lone click or breath before it is not speech), and ends
  // at the last such run
  const lv = levels(x), on = lv.map((v) => v > -45), run = (i) => on.slice(i, i + 5).every(Boolean);
  let a = on.findIndex((v, i) => v && run(i)), b = -1;
  for (let i = on.length - 1; i >= 0; i--) if (on[i] && on.slice(Math.max(0, i - 4), i + 1).every(Boolean)) { b = i; break; }
  if (a < 0 || b < 0) return x;
  const s0 = Math.max(0, Math.round((a * 0.02 - EDGE) * SR)), s1 = Math.min(x.length, Math.round(((b + 1) * 0.02 + EDGE) * SR));
  return x.subarray(s0, s1);
}
/** pauses inside speech: [start s, length s] */
function pausesOf(x) {
  const lv = levels(x), out = []; let i = 0; const n = lv.length;
  while (i < n) { if (lv[i] <= -45) { let j = i; while (j < n && lv[j] <= -45) j++; if (i > 0 && j < n && (j - i) * 0.02 >= 0.15) out.push([i * 0.02, (j - i) * 0.02]); i = j; } else i++; }
  return out;
}

let made = 0, kept = 0, chars = 0;
const report = [];
for (const c of script.cues) {
  if (only && !only.has(c.id)) continue;
  const f = path.join(cacheDir, cacheKey(c) + '.pcm');
  if (fs.existsSync(f) && !only && !audit) { kept++; continue; }
  const parts = [];
  for (const s of sentences(c.say)) {
    const pf = path.join(sentDir, 'sent-' + crypto.createHash('sha256').update(voiceName + '|' + markupOf(s)).digest('hex').slice(0, 20) + '.pcm');
    let x;
    if (fs.existsSync(pf)) { const b = fs.readFileSync(pf); x = trim(new Int16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length))); }
    else { x = trim(await synth(markupOf(s))); fs.writeFileSync(pf, Buffer.from(x.buffer, x.byteOffset, x.byteLength)); chars += s.length; }
    parts.push({ s, x });
    if (audit) {
      const dur = x.length / SR, ps = pausesOf(x), commas = [];
      // where each comma falls, as a fraction of the sentence's spoken characters (spaces and punctuation ignored)
      const bare = s.replace(/[\s.,?!「」]/g, ''); let k = 0;
      for (const ch of s) { if (ch === ',') commas.push((k / bare.length * dur).toFixed(2)); else if (!/[\s.,?!「」]/.test(ch)) k++; }
      report.push(`${c.id} · ${dur.toFixed(2)}s · commas≈[${commas.join(', ')}] · pauses=[${ps.map(([a, l]) => `${a.toFixed(2)}+${l.toFixed(2)}`).join(', ')}] · ${s}`);
    }
  }
  if (!fs.existsSync(f) || only) {
    const gap = new Int16Array(Math.round(SENT_GAP * SR)), total = parts.reduce((n, p) => n + p.x.length, 0) + gap.length * (parts.length - 1);
    const out = new Int16Array(total); let o = 0;
    parts.forEach((p, i) => { out.set(p.x, o); o += p.x.length; if (i < parts.length - 1) o += gap.length; });
    fs.writeFileSync(f, Buffer.from(out.buffer)); made++;
    console.log(`  ✓ ${c.id} (${(out.length / SR).toFixed(2)}s, ${parts.length} sentence${parts.length > 1 ? 's' : ''})`);
  } else kept++;
}
if (audit) console.log(report.join('\n'));
console.log(`google tts: ${made} new take(s), ${kept} already cached · ${chars} characters sent · voice ${voiceName}`);
