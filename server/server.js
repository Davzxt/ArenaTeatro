import express from 'express';
import compression from 'compression';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { QUIZ, VF, DIRECOES, IMPROV, FALAS, BOT_NAMES, PACKS, CAT_LABEL } from './content.js';
import { padAt, zoneAt, ZONES, spawnPoint, clampPos } from '../public/js/shared.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(compression());
app.use('/vendor/three', express.static(path.join(ROOT, 'node_modules/three'), { maxAge: '7d' }));
app.use(express.static(path.join(ROOT, 'public'), { maxAge: '10m' }));
app.get('/health', (_req, res) => res.type('text').send('ok'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8192 });

// ------------------------------------------------------------------ utilidades
const rooms = new Map();
let nextId = 1;
const uid = () => (nextId++).toString(36);
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
const cast = (room, o) => { const s = JSON.stringify(o); for (const p of room.players.values()) if (p.ws && p.ws.readyState === 1) p.ws.send(s); };

const BAD = /\b(porra|caralho|merda|puta|putaria|foder|foda|fodase|buceta|viado|bosta|arrombado|cuzao|desgraca|otario|retardado)\b/;
function isBad(s) {
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[01345@$]/g, (c) => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', '@': 'a', $: 's' }[c]));
  return BAD.test(n);
}
const cleanName = (s) => { const n = String(s || '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16); return !n || isBad(n) ? 'Ator' : n; };
const cleanLine = (s) => { const n = String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 70); return isBad(n) ? '' : n; };

function genCode() {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do { c = ''; for (let i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)]; } while (rooms.has(c));
  return c;
}

const MASK_IDS = ['comedia', 'tragedia', 'arlequim', 'veneziana', 'no', 'palhaco'];
function mkPlayer(ws, d, bot = false) {
  return {
    id: uid(), ws, bot, connected: true,
    name: cleanName(d.name),
    color: /^#[0-9a-f]{6}$/i.test(d.color || '') ? d.color : '#e8b84a',
    mask: MASK_IDS.includes(d.mask) ? d.mask : 'comedia',
    role: d.role === 'screen' ? 'screen' : 'player',
    team: null, score: 0, x: 0, z: 2, ry: 0, pose: 0, dirty: true,
    pad: null, padSince: 0, streak: 0, best: 0, ok: 0, tot: 0, ms: 0, votes: 0,
    perf: null, voted: null, target: null, skill: 0.45 + Math.random() * 0.4,
  };
}

function newRoom() {
  const room = {
    code: genCode(), hostId: null, players: new Map(), state: 'lobby',
    settings: { rounds: 10, pack: 'all', teams: false, freeText: false },
    rounds: [], idx: 0, round: null, used: new Set(), timer: null, next: null, botTimers: [], snap: null, lastSeen: Date.now(),
  };
  rooms.set(room.code, room);
  return room;
}

const humans = (room) => [...room.players.values()].filter((p) => !p.bot);
const playersOnly = (room) => [...room.players.values()].filter((p) => p.role === 'player');

function lobbyMsg(room) {
  return {
    t: 'lobby', code: room.code, hostId: room.hostId, state: room.state, settings: room.settings,
    players: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, mask: p.mask, role: p.role, bot: p.bot, team: p.team, connected: p.connected })),
  };
}
const broadcastLobby = (room) => cast(room, lobbyMsg(room));

function assignTeams(room) {
  const ps = shuffle(playersOnly(room));
  ps.forEach((p, i) => { p.team = room.settings.teams ? i % 2 : null; });
  for (const p of room.players.values()) if (p.role !== 'player') p.team = null;
}

// ------------------------------------------------------------------ entrada / saída
function addToRoom(room, ws, d) {
  const name = cleanName(d.name);
  let p = [...room.players.values()].find((q) => !q.bot && !q.connected && q.name === name);
  if (p) { p.ws = ws; p.connected = true; if (d.role) p.role = d.role === 'screen' ? 'screen' : 'player'; }
  else {
    if (room.players.size >= 45) return send(ws, { t: 'err', m: 'Sala cheia (limite de 45).' });
    p = mkPlayer(ws, d);
    room.players.set(p.id, p);
    if (!room.hostId) room.hostId = p.id;
    if (room.settings.teams && p.role === 'player') {
      const c = [0, 0]; playersOnly(room).forEach((q) => { if (q.team !== null && q !== p) c[q.team]++; });
      p.team = c[0] <= c[1] ? 0 : 1;
    }
  }
  ws.pid = p.id; ws.room = room;
  room.lastSeen = Date.now();
  send(ws, { t: 'hello', id: p.id, code: room.code, state: room.state });
  broadcastLobby(room);
  if (room.state === 'playing' && room.snap) sendSnapTo(room, p);
}

function sendSnapTo(room, p) {
  const r = room.round;
  if (r && r.kind === 'improv' && r.stage === 'compose' && p.role === 'player') send(p.ws, composeMsg(room, r));
  else if (room.snap) send(p.ws, room.snap);
}

function leave(ws) {
  const room = ws.room; if (!room) return;
  const p = room.players.get(ws.pid); ws.room = null; if (!p || p.ws !== ws) return;
  p.ws = null; p.connected = false;
  if (room.state === 'lobby') room.players.delete(p.id);
  if (room.hostId === p.id) {
    const nh = humans(room).find((q) => q.connected);
    room.hostId = nh ? nh.id : p.id;
  }
  room.lastSeen = Date.now();
  broadcastLobby(room);
}

// ------------------------------------------------------------------ fluxo do jogo
function after(room, ms, fn) { clearTimeout(room.timer); room.next = fn; room.timer = setTimeout(() => { room.next = null; fn(); }, ms); }
function skip(room) { if (room.next) { clearTimeout(room.timer); const f = room.next; room.next = null; f(); } }
function clearBots(room) { room.botTimers.forEach(clearTimeout); room.botTimers = []; for (const p of room.players.values()) p.target = null; }
const botAfter = (room, ms, fn) => { room.botTimers.push(setTimeout(fn, ms)); };

function board(room) {
  return playersOnly(room).sort((a, b) => b.score - a.score).map((p) => [p.id, p.score, p.team]);
}
function teamScores(room) {
  if (!room.settings.teams) return null;
  const t = [0, 0]; playersOnly(room).forEach((p) => { if (p.team !== null) t[p.team] += p.score; });
  return t;
}

function pickFrom(room, pool) {
  let avail = pool.filter((q) => !room.used.has(q));
  if (!avail.length) { pool.forEach((q) => room.used.delete(q)); avail = pool.slice(); }
  const q = rnd(avail); room.used.add(q); return q;
}

function startGame(room) {
  if (playersOnly(room).length < 1) return;
  const s = room.settings, N = s.rounds;
  for (const p of room.players.values()) { p.score = 0; p.streak = 0; p.best = 0; p.ok = 0; p.tot = 0; p.ms = 0; p.votes = 0; }
  assignTeams(room);
  const nImp = N >= 16 ? 2 : N >= 10 ? 1 : 0;
  const nDir = Math.max(1, Math.round(N / 6));
  const nVF = Math.max(1, Math.round(N / 5));
  let kinds = shuffle([...Array(N - nImp - nDir - nVF).fill('quiz'), ...Array(nDir).fill('dir'), ...Array(nVF).fill('vf'), ...Array(nImp).fill('improv')]);
  if (kinds[0] !== 'quiz') { const i = kinds.indexOf('quiz'); [kinds[0], kinds[i]] = [kinds[i], kinds[0]]; }
  if (kinds[N - 1] === 'improv') { const i = kinds.findIndex((k, j) => j < N - 1 && k === 'quiz'); if (i > 0) [kinds[i], kinds[N - 1]] = [kinds[N - 1], kinds[i]]; }
  room.rounds = kinds.map((kind, i) => ({ kind, mult: i === N - 1 ? 2 : 1 }));
  room.idx = 0; room.used = new Set(); room.state = 'playing';
  broadcastLobby(room);
  runRound(room);
}

const TITLES = { quiz: 'Quiz Cênico', vf: 'Verdadeiro ou Falso', dir: 'Direção de Cena', improv: 'Cena Relâmpago' };

function runRound(room) {
  const r = room.rounds[room.idx];
  room.round = r; r.phase = 'intro'; r.stage = null; clearBots(room);
  const packCats = PACKS[room.settings.pack] || PACKS.all;
  if (r.kind === 'quiz') {
    const q = pickFrom(room, QUIZ.filter((x) => packCats.includes(x[0])));
    const opts = shuffle(q.slice(2, 6));
    r.cat = q[0]; r.data = { q: q[1], opts, correct: opts.indexOf(q[2]), expl: q[6], dur: q[1].length > 85 ? 22 : 18 };
  } else if (r.kind === 'vf') {
    const q = pickFrom(room, VF.filter((x) => packCats.includes(x[0])).length ? VF.filter((x) => packCats.includes(x[0])) : VF);
    r.cat = q[0]; r.data = { q: q[1], opts: ['Verdadeiro', 'Falso'], correct: q[2] ? 0 : 1, expl: q[3], dur: 12 };
  } else if (r.kind === 'dir') {
    const d = pickFrom(room, DIRECOES), z = ZONES.find((x) => x.id === d[0]);
    r.cat = 'palco'; r.data = { q: `Vá para: ${z.name}`, zone: z.id, correct: z.id, expl: d[1], dur: 14 };
  } else {
    r.cat = 'generos';
    r.data = { prompt: { quem: rnd(IMPROV.quem), onde: rnd(IMPROV.onde), conflito: rnd(IMPROV.conflito) }, dur: 35, expl: rnd(IMPROV.dicas) };
  }
  const ps = [...room.players.values()].filter((p) => p.role === 'player');
  const spawn = ps.map((p, i) => { const [x, z] = spawnPoint(i); p.x = x; p.z = z; p.pose = 0; p.pad = null; p.perf = null; p.voted = null; p.dirty = true; return [p.id, +x.toFixed(2), +z.toFixed(2)]; });
  const msg = { t: 'intro', n: room.idx + 1, total: room.rounds.length, kind: r.kind, title: TITLES[r.kind], cat: r.cat, catLabel: CAT_LABEL[r.cat], mult: r.mult, spawn };
  room.snap = msg; cast(room, msg);
  after(room, 3600, () => startPlay(room));
}

function composeMsg(room, r) {
  return { t: 'play', kind: 'improv', stage: 'compose', prompt: r.data.prompt, cards: shuffle(FALAS).slice(0, 4), free: room.settings.freeText, dur: Math.max(5, Math.round((r.start + r.data.dur * 1000 - Date.now()) / 1000)) };
}

function startPlay(room) {
  const r = room.round; r.phase = 'play'; r.start = Date.now();
  const d = r.data;
  if (r.kind === 'improv') {
    r.stage = 'compose';
    for (const p of playersOnly(room)) send(p.ws, { ...composeMsg(room, r), dur: d.dur });
    for (const p of room.players.values()) if (p.role === 'screen') send(p.ws, { t: 'play', kind: 'improv', stage: 'compose', prompt: d.prompt, cards: [], free: false, dur: d.dur });
    room.snap = null;
    for (const b of playersOnly(room).filter((p) => p.bot)) botAfter(room, 3000 + Math.random() * 20000, () => { b.perf = { pose: 1 + Math.floor(Math.random() * 8), line: rnd(FALAS) }; });
    after(room, d.dur * 1000 + 500, () => endCompose(room));
    return;
  }
  const msg = { t: 'play', kind: r.kind, q: d.q, opts: d.opts || null, zone: d.zone || null, dur: d.dur, cat: r.cat };
  room.snap = msg; cast(room, msg);
  // bots
  const nOpts = d.opts ? d.opts.length : 0;
  for (const b of playersOnly(room).filter((p) => p.bot)) {
    const right = Math.random() < b.skill;
    let tx, tz;
    if (r.kind === 'dir') {
      const wantId = right ? d.correct : rnd(ZONES).id, z = ZONES.find((x) => x.id === wantId);
      tx = z.cx + (Math.random() - 0.5) * 2; tz = z.cz + (Math.random() - 0.5) * 1.2;
    } else {
      const wrong = [...Array(nOpts).keys()].filter((i) => i !== d.correct);
      const idx = right ? d.correct : rnd(wrong);
      const L = nOpts === 2 ? [-5, 5] : [-7.5, -2.5, 2.5, 7.5];
      tx = L[idx] + (Math.random() - 0.5) * 2; tz = -6 + (Math.random() - 0.5) * 3;
    }
    botAfter(room, 1500 + Math.random() * d.dur * 600, () => { b.target = [tx, tz]; });
  }
  after(room, d.dur * 1000 + 400, () => endPlay(room));
}

function updatePad(room, p) {
  const r = room.round;
  if (room.state !== 'playing' || !r || r.phase !== 'play' || r.kind === 'improv') return;
  let v = null;
  if (r.kind === 'dir') { const z = zoneAt(p.x, p.z); v = z ? z.id : null; }
  else v = padAt(r.data.opts.length, p.x, p.z);
  if (v !== p.pad) { p.pad = v; p.padSince = Date.now(); }
}

function endPlay(room) {
  const r = room.round, d = r.data; r.phase = 'reveal';
  const res = [];
  for (const p of playersOnly(room)) {
    const ok = p.pad !== null && p.pad === d.correct;
    p.tot++;
    let gain = 0;
    if (ok) {
      const t = clamp01(1 - (p.padSince - r.start) / (d.dur * 1000));
      p.streak++; p.best = Math.max(p.best, p.streak); p.ok++; p.ms += Math.max(0, p.padSince - r.start);
      gain = Math.round((100 + Math.round(100 * t) + 25 * Math.min(p.streak - 1, 4)) * r.mult);
      p.score += gain;
    } else p.streak = 0;
    res.push([p.id, gain, ok ? 1 : 0, p.pad]);
  }
  const msg = { t: 'reveal', kind: r.kind, correct: d.correct, text: r.kind === 'dir' ? ZONES.find((z) => z.id === d.correct).name : d.opts[d.correct], expl: d.expl, res, board: board(room), teams: teamScores(room), n: room.idx + 1, total: room.rounds.length };
  room.snap = msg; cast(room, msg);
  after(room, 8500, () => nextRound(room));
}

// ---- improvisação
function endCompose(room) {
  const r = room.round, d = r.data;
  const perfs = playersOnly(room).filter((p) => p.perf);
  if (perfs.length < 2) {
    perfs.forEach((p) => { p.score += 80 * r.mult; });
    const msg = { t: 'reveal', kind: 'improv', correct: null, text: perfs.length ? 'Poucos atores subiram ao palco — todos ganham pontos de coragem!' : 'Ninguém subiu ao palco desta vez.', expl: d.expl, res: perfs.map((p) => [p.id, 80 * r.mult, 1, 0]), board: board(room), teams: teamScores(room), n: room.idx + 1, total: room.rounds.length };
    r.phase = 'reveal'; room.snap = msg; cast(room, msg);
    return after(room, 7000, () => nextRound(room));
  }
  r.stage = 'show';
  perfs.forEach((p) => { p.pose = p.perf.pose; });
  r.perfs = perfs.map((p) => ({ id: p.id, pose: p.perf.pose, line: p.perf.line }));
  const msg = { t: 'show', perfs: r.perfs, dur: 8 };
  room.snap = msg; cast(room, msg);
  after(room, 8000, () => startVote(room));
}
function startVote(room) {
  const r = room.round; r.stage = 'vote';
  const msg = { t: 'vote', cands: r.perfs, dur: 16 };
  room.snap = msg; cast(room, msg);
  for (const b of playersOnly(room).filter((p) => p.bot)) botAfter(room, 2000 + Math.random() * 10000, () => { const c = rnd(r.perfs.filter((x) => x.id !== b.id)); if (c) b.voted = c.id; });
  after(room, 16000, () => endVote(room));
}
function endVote(room) {
  const r = room.round, d = r.data; r.phase = 'reveal'; r.stage = null;
  const votes = new Map(r.perfs.map((x) => [x.id, 0]));
  const res = [];
  for (const p of playersOnly(room)) if (p.voted && votes.has(p.voted)) { votes.set(p.voted, votes.get(p.voted) + 1); p.score += 25; res.push([p.id, 25, 0, 0]); }
  let win = null, wv = -1;
  for (const [id, v] of votes) { const p = room.players.get(id); if (!p) continue; const gain = (v * 100 + 60) * r.mult; p.score += gain; p.votes += v; res.push([id, gain, 0, v]); if (v > wv) { wv = v; win = id; } }
  const wn = room.players.get(win);
  const msg = { t: 'reveal', kind: 'improv', correct: win, text: wn ? `Melhor cena: ${wn.name} (${wv} voto${wv === 1 ? '' : 's'})` : '', expl: d.expl, res, board: board(room), teams: teamScores(room), n: room.idx + 1, total: room.rounds.length };
  room.snap = msg; cast(room, msg);
  after(room, 8000, () => nextRound(room));
}

function nextRound(room) {
  room.idx++;
  if (room.idx >= room.rounds.length) return finish(room);
  runRound(room);
}

function finish(room) {
  clearBots(room); clearTimeout(room.timer); room.next = null;
  room.state = 'final'; room.round = null;
  const ps = playersOnly(room).sort((a, b) => b.score - a.score);
  const awards = [];
  if (ps[0]) awards.push({ id: ps[0].id, t: 'Estrela do Palco', d: `${ps[0].score} pontos` });
  const fast = ps.filter((p) => p.ok >= 2).sort((a, b) => a.ms / a.ok - b.ms / b.ok)[0];
  if (fast) awards.push({ id: fast.id, t: 'Relâmpago', d: `${(fast.ms / fast.ok / 1000).toFixed(1)}s por resposta certa` });
  const mostOk = ps.slice().sort((a, b) => b.ok - a.ok)[0];
  if (mostOk && mostOk.ok > 0) awards.push({ id: mostOk.id, t: 'Mestre do Texto', d: `${mostOk.ok} acertos` });
  const streak = ps.slice().sort((a, b) => b.best - a.best)[0];
  if (streak && streak.best >= 3) awards.push({ id: streak.id, t: 'Sequência de Ouro', d: `${streak.best} acertos seguidos` });
  const fav = ps.slice().sort((a, b) => b.votes - a.votes)[0];
  if (fav && fav.votes > 0) awards.push({ id: fav.id, t: 'Queridinho da Plateia', d: `${fav.votes} voto${fav.votes === 1 ? '' : 's'} nas cenas` });
  const msg = { t: 'final', board: board(room), teams: teamScores(room), awards };
  room.snap = msg; cast(room, msg); broadcastLobby(room);
}

function backToLobby(room) {
  clearBots(room); clearTimeout(room.timer); room.next = null; room.state = 'lobby'; room.round = null; room.snap = null;
  for (const [id, p] of room.players) if (!p.connected && !p.bot) room.players.delete(id);
  for (const p of room.players.values()) { p.score = 0; p.x = 0; p.z = 2; p.dirty = true; }
  broadcastLobby(room);
  cast(room, { t: 'back' });
}

// ------------------------------------------------------------------ mensagens do cliente
const isHost = (room, ws) => room.hostId === ws.pid;
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

function handle(ws, d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'create') {
    const room = newRoom(); addToRoom(room, ws, d);
    if (d.solo) addBots(room, 4);
    return;
  }
  if (d.t === 'join') {
    const room = rooms.get(String(d.code || '').toUpperCase().trim());
    if (!room) return send(ws, { t: 'err', m: 'Sala não encontrada. Confira o código.' });
    return addToRoom(room, ws, d);
  }
  const room = ws.room; if (!room) return;
  const p = room.players.get(ws.pid); if (!p) return;
  switch (d.t) {
    case 'm': {
      const [x, z] = clampPos(num(d.x), num(d.z));
      p.x = x; p.z = z; p.ry = num(d.ry); p.dirty = true; updatePad(room, p);
      break;
    }
    case 'pose': p.pose = Math.max(0, Math.min(8, num(d.p) | 0)); p.dirty = true; break;
    case 'cfg': {
      if (!isHost(room, ws) || room.state === 'playing') break;
      const s = room.settings;
      if ([6, 8, 10, 12, 16, 20].includes(+d.rounds)) s.rounds = +d.rounds;
      if (PACKS[d.pack]) s.pack = d.pack;
      if (typeof d.teams === 'boolean') { s.teams = d.teams; assignTeams(room); }
      if (typeof d.freeText === 'boolean') s.freeText = d.freeText;
      broadcastLobby(room);
      break;
    }
    case 'bots': {
      if (!isHost(room, ws) || room.state === 'playing') break;
      if (d.n === 0) { for (const [id, q] of room.players) if (q.bot) room.players.delete(id); broadcastLobby(room); }
      else addBots(room, Math.min(6, Math.max(1, num(d.n, 1) | 0)));
      break;
    }
    case 'kick': {
      if (!isHost(room, ws)) break;
      const q = room.players.get(String(d.id));
      if (q && q.id !== p.id) { if (q.ws) { send(q.ws, { t: 'err', m: 'Você foi removido da sala.' }); q.ws.room = null; } room.players.delete(q.id); broadcastLobby(room); }
      break;
    }
    case 'start': if (isHost(room, ws) && room.state !== 'playing') startGame(room); break;
    case 'skip': if (isHost(room, ws) && room.state === 'playing') skip(room); break;
    case 'again': if (isHost(room, ws) && room.state === 'final') backToLobby(room); break;
    case 'perf': {
      const r = room.round;
      if (!r || r.kind !== 'improv' || r.stage !== 'compose' || p.role !== 'player') break;
      const line = cleanLine(d.line) || rnd(FALAS);
      p.perf = { pose: Math.max(1, Math.min(8, num(d.pose, 1) | 0)), line };
      send(ws, { t: 'ack', line });
      break;
    }
    case 'vote': {
      const r = room.round;
      if (!r || r.stage !== 'vote' || p.role !== 'player') break;
      if (d.id !== p.id && r.perfs.some((x) => x.id === d.id)) { p.voted = d.id; send(ws, { t: 'voted', id: d.id }); }
      break;
    }
    case 'leave': leave(ws); break;
    default:
  }
}

function addBots(room, n) {
  const used = new Set([...room.players.values()].map((q) => q.name));
  const names = shuffle(BOT_NAMES).filter((x) => !used.has(x));
  const colors = ['#d9534f', '#3d7edb', '#e8b84a', '#3fae74', '#a56bd6', '#ee8a3a', '#38b6c9', '#e26aa0'];
  for (let i = 0; i < n && names[i]; i++) {
    const b = mkPlayer(null, { name: names[i], color: rnd(colors), mask: rnd(MASK_IDS) }, true);
    b.connected = true; room.players.set(b.id, b);
    if (room.settings.teams) b.team = playersOnly(room).filter((q) => q.team === 0).length <= playersOnly(room).filter((q) => q.team === 1).length ? 0 : 1;
  }
  broadcastLobby(room);
}

// ------------------------------------------------------------------ laço de simulação (bots + estado)
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(0.25, (now - lastTick) / 1000); lastTick = now;
  for (const room of rooms.values()) {
    for (const b of room.players.values()) {
      if (!b.bot || !b.target) continue;
      const dx = b.target[0] - b.x, dz = b.target[1] - b.z, dist = Math.hypot(dx, dz);
      if (dist < 0.15) { b.target = null; continue; }
      const step = Math.min(dist, 5.5 * dt);
      b.x += (dx / dist) * step; b.z += (dz / dist) * step; b.ry = Math.atan2(dx, dz); b.dirty = true; updatePad(room, b);
    }
    const list = [];
    for (const p of room.players.values()) {
      if (p.dirty && p.role === 'player') { p.dirty = false; list.push([p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.pose]); }
    }
    if (list.length) cast(room, { t: 's', p: list });
  }
}, 120);

// batimento + limpeza de salas abandonadas
setInterval(() => {
  for (const ws of wss.clients) { if (ws.isAlive === false) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch {} }
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (humans(room).some((p) => p.connected)) room.lastSeen = now;
    else if (now - room.lastSeen > 10 * 60 * 1000) { clearTimeout(room.timer); clearBots(room); rooms.delete(code); }
  }
}, 25000);

wss.on('connection', (ws) => {
  ws.isAlive = true; ws.rate = { t: 0, n: 0 };
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    const t = Date.now();
    if (t - ws.rate.t > 1000) ws.rate = { t, n: 0 };
    if (++ws.rate.n > 45) return;
    let d; try { d = JSON.parse(raw); } catch { return; }
    try { handle(ws, d); } catch (e) { console.error('erro handle', e); }
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => {});
});

server.listen(PORT, () => console.log(`Teatro Arena 3D rodando na porta ${PORT}`));
