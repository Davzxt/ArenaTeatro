import { Stage3D, POSES, PAD_COLORS, TEAM_COLORS } from './scene.js';
import { MASKS, maskDataURL } from './masks.js';
import { ENC, DICAS } from './enciclopedia.js';
import { ZONES, padLayout } from './shared.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = ['#d9534f', '#ee8a3a', '#e8b84a', '#3fae74', '#38b6c9', '#3d7edb', '#a56bd6', '#e26aa0'];
const THEME = { grecia: 'grecia', historia: 'historia', palco: 'default', generos: 'moderno', tecnicas: 'moderno', brasil: 'brasil', mundo: 'mundo', curiosidades: 'default' };
const PACK_NAME = { all: 'Tudo sobre teatro', historia: 'História e curiosidades', palco: 'Palco, gêneros e técnicas', brasil: 'Brasil e mundo' };

const stage = new Stage3D($('#c'));
if (matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');

const S = {
  me: { id: null, name: '', color: COLORS[2], mask: 'comedia', role: 'player' },
  code: null, hostId: null, isHost: false, players: new Map(), settings: {}, screen: 'home',
  kind: null, timerEnd: 0, timerDur: 0, lastSec: -1, board: [], perf: null, cur: null, vote: null, vr: false, poseT: 0,
};

// ------------------------------------------------------------------ utilidades de UI
function toast(m, ms = 3200) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => (t.style.display = 'none'), ms); }
function status(m) { $('#status').textContent = m || ''; }
function show(name) {
  S.screen = name;
  for (const id of ['home', 'lobby', 'fin']) $('#' + id).classList.toggle('show', id === name);
  $('#hud').classList.toggle('show', name === 'hud');
  $('#mute').classList.toggle('hide', name === 'home');
}
const meName = (id) => S.players.get(id)?.name || '?';
const kindEmoji = (i) => POSES[i]?.e || '🎭';
function banner(t, s, ms = 3000) { $('#bnT').textContent = t; $('#bnS').textContent = s || ''; const b = $('#banner'); b.classList.add('on'); clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('on'), ms); }

// ------------------------------------------------------------------ perfil (home)
try { Object.assign(S.me, JSON.parse(localStorage.getItem('teatro-perfil') || '{}')); } catch {}
const params = new URLSearchParams(location.search);
if (params.get('sala')) $('#code').value = params.get('sala').toUpperCase().slice(0, 4);
if (params.has('telao')) S.me.role = 'screen';
$('#name').value = S.me.name || '';
function renderPickers() {
  $('#colors').innerHTML = COLORS.map((c) => `<button class="sw ${c === S.me.color ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="Cor ${c}"></button>`).join('');
  $('#masks').innerHTML = MASKS.map(([id, n]) => `<button class="mk ${id === S.me.mask ? 'on' : ''}" data-m="${id}" aria-label="Máscara ${n}" title="${n}"><img alt="" src="${maskDataURL(id, 64)}"></button>`).join('');
  document.querySelectorAll('#role button').forEach((b) => b.classList.toggle('on', b.dataset.r === S.me.role));
}
renderPickers();
$('#colors').onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) { S.me.color = b.dataset.c; renderPickers(); } };
$('#masks').onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) { S.me.mask = b.dataset.m; renderPickers(); } };
$('#role').onclick = (e) => { const b = e.target.closest('[data-r]'); if (b) { S.me.role = b.dataset.r; renderPickers(); } };
function saveProfile() { S.me.name = $('#name').value.trim().slice(0, 16); try { localStorage.setItem('teatro-perfil', JSON.stringify({ name: S.me.name, color: S.me.color, mask: S.me.mask, role: S.me.role })); } catch {} }

// ------------------------------------------------------------------ rede
let ws = null, wsWait = null;
const send = (o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
function ensureWS() {
  if (ws && ws.readyState === 1) return Promise.resolve();
  if (wsWait) return wsWait;
  wsWait = new Promise((resolve, reject) => {
    let tries = 0;
    const attempt = () => {
      tries++;
      const sock = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      let opened = false;
      sock.onopen = () => { opened = true; ws = sock; wsWait = null; resolve(); };
      sock.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch (err) { console.error(err); } };
      sock.onclose = () => {
        if (!opened) { if (tries < 30) { status('Acordando o servidor... isso pode levar até 1 minuto.'); setTimeout(attempt, 2500); } else { wsWait = null; reject(new Error('timeout')); } }
        else if (sock === ws) { ws = null; onClose(); }
      };
      sock.onerror = () => {};
    };
    attempt();
  });
  return wsWait;
}
let reconnecting = false;
function onClose() {
  if (!S.code || reconnecting) return;
  reconnecting = true; toast('Conexão perdida. Reconectando...', 6000);
  const go = () => ensureWS().then(() => { reconnecting = false; send({ t: 'join', code: S.code, name: S.me.name, color: S.me.color, mask: S.me.mask, role: S.me.role }); }).catch(() => setTimeout(go, 3000));
  go();
}
setInterval(() => send({ t: 'ping' }), 20000);

function enter(kind) {
  saveProfile(); sfx.unlock();
  if (!S.me.name) { status('Digite seu nome para entrar.'); $('#name').focus(); return; }
  const base = { name: S.me.name, color: S.me.color, mask: S.me.mask, role: S.me.role };
  const code = $('#code').value.trim().toUpperCase();
  if (kind === 'join' && code.length !== 4) { status('O código da sala tem 4 letras.'); $('#code').focus(); return; }
  status('Conectando...');
  ensureWS().then(() => {
    status('');
    if (kind === 'join') send({ t: 'join', code, ...base });
    else send({ t: 'create', ...base, solo: kind === 'solo' });
  }).catch(() => status('Não consegui conectar ao servidor. Tente de novo em instantes.'));
}
$('#bCreate').onclick = () => enter('create');
$('#bJoin').onclick = () => enter('join');
$('#bSolo').onclick = () => enter('solo');
$('#code').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter('join'); });
$('#name').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter($('#code').value.trim() ? 'join' : 'create'); });

// ------------------------------------------------------------------ mensagens
function onMsg(d) {
  switch (d.t) {
    case 'hello': return onHello(d);
    case 'lobby': return onLobby(d);
    case 's': for (const [id, x, z, ry, p] of d.p) if (id !== S.me.id) stage.updateRemote(id, x, z, ry, p); return;
    case 'intro': return onIntro(d);
    case 'play': return onPlay(d);
    case 'show': return onShow(d);
    case 'vote': return onVote(d);
    case 'voted': { S.vote = d.id; document.querySelectorAll('.cands button').forEach((b) => b.classList.toggle('on', b.dataset.id === d.id)); sfx.play('pop'); return; }
    case 'ack': { toast('Cena enviada! Você pode trocar até o fim do tempo.'); stage.say(S.me.id, d.line, 5); return; }
    case 'reveal': return onReveal(d);
    case 'final': return onFinal(d);
    case 'back': return onBack();
    case 'err': if (S.screen === 'home') status(d.m); else toast(d.m); if (/removido/.test(d.m)) leaveRoom(); return;
  }
}

function onHello(d) {
  S.me.id = d.id; S.code = d.code;
  stage.setLocal(S.me.role === 'player' ? d.id : null);
  document.body.classList.toggle('tv', S.me.role === 'screen');
  $('#lobCode').textContent = d.code;
  history.replaceState(null, '', `?sala=${d.code}${S.me.role === 'screen' ? '&telao' : ''}`);
  stage.setCurtain(true); stage.setMode(S.me.role === 'screen' ? 'tv' : 'follow');
  if (d.state === 'lobby') { show('lobby'); idleTelao(); } else if (d.state === 'playing') show('hud');
}
let vrInit = false;
if (!vrInit) { vrInit = true; stage.initVR((v) => { S.vr = v; if (v) hudVR('Teatro Arena', 'Mova com o direcional esquerdo, gire com o direito.'); }); }

function idleTelao() {
  stage.setTelao({ title: 'Teatro Arena', sub: `Sala ${S.code || ''}`, text: `Entre em ${location.host}\ne digite o código ${S.code || ''}`, bar: null, board: null, foot: 'Escolha uma máscara e prepare-se para entrar em cena' });
}

function onLobby(d) {
  S.players = new Map(d.players.map((p) => [p.id, p])); S.hostId = d.hostId; S.settings = d.settings; S.isHost = d.hostId === S.me.id;
  const ids = new Set(d.players.filter((p) => p.role === 'player').map((p) => p.id));
  for (const id of [...stage.avatars.keys()]) if (!ids.has(id)) stage.removePlayer(id);
  for (const p of d.players) if (p.role === 'player') stage.addPlayer(p, p.id === S.me.id);
  stage.setLocal(S.me.role === 'player' ? S.me.id : null);
  $('#bSkip').classList.toggle('hide', !(S.isHost && S.screen === 'hud'));
  if (S.screen === 'lobby') renderLobby();
}

function renderLobby() {
  const s = S.settings, isH = S.isHost;
  $('#lobPlayers').innerHTML = [...S.players.values()].map((p) => {
    const t = p.team !== null && p.team !== undefined ? `<span class="dot" style="background:${TEAM_COLORS[p.team]}"></span>` : '';
    const tag = p.role === 'screen' ? '<i>telão</i>' : p.bot ? '<i>bot</i>' : p.id === S.hostId ? '<i>professor(a)</i>' : '';
    return `<div class="pl" style="${p.connected ? '' : 'opacity:.45'}"><img alt="" src="${maskDataURL(p.mask, 48)}">${t}<span>${esc(p.name)}</span>${tag}${isH && p.id !== S.me.id ? `<button class="x" data-k="${p.id}" aria-label="Remover ${esc(p.name)}">✕</button>` : ''}</div>`;
  }).join('');
  $('#lobCfg').classList.toggle('hide', !isH);
  $('#cfgRounds').value = s.rounds; $('#cfgPack').value = s.pack; $('#cfgTeams').checked = !!s.teams; $('#cfgFree').checked = !!s.freeText;
  const n = [...S.players.values()].filter((p) => p.role === 'player').length;
  $('#bStart').disabled = n < 1;
  $('#lobInfo').textContent = isH ? `${n} jogador${n === 1 ? '' : 'es'} na sala. Com bots, dá para treinar sozinho.` : `Aguardando ${meName(S.hostId)} abrir as cortinas. ${s.rounds} cenas · ${PACK_NAME[s.pack] || ''}${s.teams ? ' · em equipes' : ''}`;
  if (!renderLobby.tip) rotateTip();
}
function rotateTip() { renderLobby.tip = true; const f = () => { $('#lobTip').textContent = 'Você sabia? ' + DICAS[(Math.random() * DICAS.length) | 0]; }; f(); setInterval(() => { if (S.screen === 'lobby') f(); }, 14000); }
$('#lobPlayers').onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) send({ t: 'kick', id: b.dataset.k }); };
const cfg = () => send({ t: 'cfg', rounds: +$('#cfgRounds').value, pack: $('#cfgPack').value, teams: $('#cfgTeams').checked, freeText: $('#cfgFree').checked });
['#cfgRounds', '#cfgPack', '#cfgTeams', '#cfgFree'].forEach((s) => $(s).addEventListener('change', cfg));
$('#bBots').onclick = () => send({ t: 'bots', n: 3 });
$('#bBotsClear').onclick = () => send({ t: 'bots', n: 0 });
$('#bStart').onclick = () => { sfx.unlock(); send({ t: 'start' }); };
$('#lobCopy').onclick = () => { const url = `${location.origin}/?sala=${S.code}`; (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => toast('Link copiado!'), () => toast(url, 6000)); };
function leaveRoom() { send({ t: 'leave' }); S.code = null; S.me.id = null; S.players = new Map(); S.board = []; stage.clearPlayers(); stage.resetAll(); stage.hidePodium(); stage.setCurtain(false); stage.setMode('orbit'); stage.freeze(true); stage.setZones(null); stage.clearPads(); document.body.classList.remove('tv'); history.replaceState(null, '', '/'); show('home'); }
$('#bLeave').onclick = leaveRoom; $('#bExit').onclick = leaveRoom;
$('#bSkip').onclick = () => send({ t: 'skip' });

// ------------------------------------------------------------------ rodadas
function resetHud() {
  ['#hQ', '#hBar', '#hDir', '#hPanel', '#rev', '#hMult'].forEach((s) => $(s).classList.add('hide'));
  $('#hOpts').innerHTML = ''; S.timerEnd = 0; S.cur = null;
}
function onIntro(d) {
  show('hud'); resetHud(); S.kind = d.kind;
  $('#bSkip').classList.toggle('hide', !S.isHost);
  stage.resetAll(); stage.clearPads(); stage.setZones(null); stage.hideVRPanel(); stage.setPick(false); stage.setCurtain(true); stage.setTheme(THEME[d.cat] || 'default');
  stage.freeze(true); stage.yaw = 0; stage.pitch = 0.38; stage.dist = 8;
  for (const [id, x, z] of d.spawn) stage.teleport(id, x, z, 0);
  $('#hRound').textContent = `Cena ${d.n} de ${d.total}`; $('#hCat').textContent = d.catLabel; $('#hMult').classList.toggle('hide', d.mult < 2);
  updateMe();
  banner(d.title, d.mult > 1 ? 'Última cena: pontos em dobro!' : d.catLabel, 3200);
  stage.setTelao({ title: `Cena ${d.n} de ${d.total}`, sub: d.catLabel, text: d.title, bar: null, board: null, foot: d.mult > 1 ? 'Pontos em dobro!' : '' });
  hudVR(`Cena ${d.n} de ${d.total}`, d.title);
  sfx.play('intro');
}
function setTimer(sec) { S.timerDur = sec * 1000; S.timerEnd = performance.now() + sec * 1000; S.lastSec = -1; $('#hBar').classList.remove('hide'); }

function onPlay(d) {
  show('hud'); S.cur = d; S.kind = d.kind; $('#rev').classList.add('hide'); $('#hPanel').classList.add('hide');
  const player = S.me.role === 'player';
  if (d.kind === 'quiz' || d.kind === 'vf') {
    stage.setPads(d.opts.length, d.opts); stage.setZones(null);
    $('#hQ').textContent = d.q; $('#hQ').classList.remove('hide');
    const L = padLayout(d.opts.length), cols = d.opts.length === 2 ? ['#3fae74', '#d9534f'] : PAD_COLORS;
    $('#hOpts').innerHTML = d.opts.map((o, i) => `<button class="opt" data-i="${i}" style="background:${cols[i]}"><b>${d.opts.length === 2 ? (i ? '✖' : '✔') : 'ABCD'[i]}</b>${esc(o)}</button>`).join('');
    $('#hOpts').onclick = (e) => { const b = e.target.closest('.opt'); if (b && player && stage.controls) stage.walkTo(L[+b.dataset.i].x, L[+b.dataset.i].z); };
    stage.setTelao({ title: d.q.length > 0 ? 'Vá até a resposta certa' : '', sub: '', text: d.q, bar: 1, board: null, foot: '' });
    hudVR(d.kind === 'vf' ? 'Verdadeiro ou falso?' : 'Escolha a plataforma', d.q);
  } else if (d.kind === 'dir') {
    stage.setZones(d.zone);
    $('#hQ').textContent = d.q + ' (esquerda e direita do ponto de vista do ATOR)'; $('#hQ').classList.remove('hide');
    stage.setTelao({ title: 'Direção de Cena', sub: 'O diretor chama você!', text: d.q, bar: 1, board: null, foot: 'Direita e esquerda: sempre do ponto de vista do ator' });
    const rows = ZONES.filter((z) => z.stage), extra = ZONES.filter((z) => !z.stage);
    $('#hDir').innerHTML = `<div class="cap">Palco visto da plateia · Alta = fundo</div>` + rows.map((z) => `<button data-z="${z.id}" class="${z.id === d.zone ? 'hot' : ''}">${z.name}</button>`).join('') + extra.map((z) => `<button data-z="${z.id}" class="${z.id === d.zone ? 'hot' : ''}">${z.name.replace('Coxia ', 'Coxia ')}</button>`).join('');
    $('#hDir').classList.toggle('hide', !player); $('#hDir').onclick = (e) => { const b = e.target.closest('[data-z]'); if (!b || !player || !stage.controls) return; const z = ZONES.find((q) => q.id === b.dataset.z); stage.walkTo(z.cx, z.cz); };
    hudVR('Direção de Cena', d.q);
  } else if (d.kind === 'improv') { return onCompose(d); }
  setTimer(d.dur); stage.freeze(!player);
}

// ---- improviso
function onCompose(d) {
  stage.setTelao({ title: 'Cena Relâmpago', sub: 'Monte sua cena', text: `${cap(d.prompt.quem)}, ${d.prompt.onde}, e o conflito: ${d.prompt.conflito}.`, bar: 1, board: null, foot: '' });
  $('#hQ').textContent = `Você é ${d.prompt.quem}, ${d.prompt.onde}. Conflito: ${d.prompt.conflito}.`; $('#hQ').classList.remove('hide');
  setTimer(d.dur); const player = S.me.role === 'player'; stage.freeze(!player);
  if (!player) return;
  S.perf = { pose: 1, idx: 0, free: '', cards: d.cards, sent: false };
  stage.setPose(S.me.id, 1);
  if (stage.inVR) return vrCompose(d);
  const p = $('#hPanel'); p.classList.remove('hide');
  p.innerHTML = `<h4>Escolha sua pose e sua fala</h4><div class="pg" id="pg">${POSES.slice(1).map((o, i) => `<button data-p="${i + 1}" class="${i === 0 ? 'on' : ''}"><span>${o.e}</span>${o.n}</button>`).join('')}</div>
    <div class="cards" id="cards">${d.cards.map((c, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
    ${d.free ? '<input id="freeLine" maxlength="70" placeholder="...ou escreva sua própria fala (até 70 letras)">' : ''}
    <button class="btn gold" id="sendPerf" style="width:100%">Subir ao palco</button>`;
  $('#pg').onclick = (e) => { const b = e.target.closest('[data-p]'); if (!b) return; S.perf.pose = +b.dataset.p; stage.setPose(S.me.id, S.perf.pose); document.querySelectorAll('#pg button').forEach((x) => x.classList.toggle('on', x === b)); };
  $('#cards').onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; S.perf.idx = +b.dataset.i; if ($('#freeLine')) $('#freeLine').value = ''; document.querySelectorAll('#cards button').forEach((x) => x.classList.toggle('on', x === b)); };
  if ($('#freeLine')) $('#freeLine').oninput = (e) => { document.querySelectorAll('#cards button').forEach((x) => x.classList.remove('on')); S.perf.free = e.target.value; };
  $('#sendPerf').onclick = () => { const line = ($('#freeLine')?.value.trim()) || d.cards[S.perf.idx]; send({ t: 'perf', pose: S.perf.pose, line }); $('#sendPerf').textContent = 'Enviado! Toque de novo para trocar'; };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function vrCompose(d) {
  const P = S.perf, draw = () => {
    const btns = [];
    const fn = (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(20,8,16,.94)'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffc857'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffc857'; c.font = '700 34px system-ui'; c.fillText('Cena Relâmpago', w / 2, 36);
      c.fillStyle = '#fdf3e1'; c.font = '600 28px system-ui'; c.fillText(`${cap(d.prompt.quem)}, ${d.prompt.onde}. Conflito: ${d.prompt.conflito}.`, w / 2, 84, w - 40);
      POSES.slice(1).forEach((o, i) => { const x = 20 + (i % 4) * 250, y = 120 + Math.floor(i / 4) * 78; btns.push({ id: 'p' + (i + 1), x, y, w: 235, h: 68 }); c.fillStyle = P.pose === i + 1 ? '#ffc857' : 'rgba(255,255,255,.12)'; c.fillRect(x, y, 235, 68); c.fillStyle = P.pose === i + 1 ? '#3a1604' : '#fdf3e1'; c.font = '700 28px system-ui'; c.fillText(`${o.e} ${o.n}`, x + 117, y + 36); });
      d.cards.forEach((t, i) => { const x = 20, y = 285 + i * 62; btns.push({ id: 'c' + i, x, y, w: w - 40, h: 54 }); c.fillStyle = P.idx === i ? '#ffc857' : 'rgba(255,255,255,.12)'; c.fillRect(x, y, w - 40, 54); c.fillStyle = P.idx === i ? '#3a1604' : '#fdf3e1'; c.font = '600 26px system-ui'; c.fillText(t, w / 2, y + 28, w - 70); });
      btns.push({ id: 'send', x: 20, y: 540, w: w - 40, h: 80 }); c.fillStyle = P.sent ? '#3fae74' : '#e0524d'; c.fillRect(20, 540, w - 40, 80); c.fillStyle = '#fff'; c.font = '800 34px system-ui'; c.fillText(P.sent ? 'Enviado! (toque para trocar)' : 'Subir ao palco', w / 2, 582);
    };
    return [fn, btns];
  };
  const render = (first) => { const [fn, btns] = draw(); first ? stage.showVRPanel(fn, btns) : stage.redrawVRPanel(fn, btns); };
  render(true);
  stage.onVRButton = (id) => {
    if (id === 'send') { send({ t: 'perf', pose: P.pose, line: d.cards[P.idx] }); P.sent = true; }
    else if (id[0] === 'p') { P.pose = +id.slice(1); stage.setPose(S.me.id, P.pose); P.sent = false; }
    else if (id[0] === 'c') { P.idx = +id.slice(1); P.sent = false; }
    render(false);
  };
}

function onShow(d) {
  stage.hideVRPanel(); $('#hPanel').classList.add('hide'); S.timerEnd = 0; $('#hBar').classList.add('hide');
  $('#hQ').textContent = 'Os atores estão em cena. Assista!'; stage.setTelao({ title: 'Cena Relâmpago', sub: 'Atenção ao palco!', text: 'Os atores estão em cena...', bar: null, board: null, foot: '' });
  stage.ensemble(d.perfs.map((x) => x.id)); stage.dist = 12; stage.pitch = 0.3;
  for (const x of d.perfs) { stage.setPose(x.id, x.pose); stage.say(x.id, x.line, d.dur + 19); }
  stage.freeze(true); stage.cheer(0.5); sfx.play('intro'); hudVR('Em cena!', 'Assista às apresentações.');
}
function onVote(d) {
  S.vote = null; setTimer(d.dur); $('#hQ').textContent = 'Vote na melhor cena! Toque no ator ou na fala.';
  stage.setTelao({ title: 'Hora do voto', sub: 'Qual foi a melhor cena?', text: 'Vote na cena mais criativa', bar: 1, board: null, foot: '' });
  const player = S.me.role === 'player'; if (!player) return;
  stage.setPick(true); stage.onPick = (id) => { if (id !== S.me.id && d.cands.some((c) => c.id === id)) send({ t: 'vote', id }); else if (id === S.me.id) toast('Não vale votar em si mesmo!'); };
  hudVR('Vote!', 'Aponte para o ator e aperte o gatilho.');
  if (stage.inVR) return;
  const p = $('#hPanel'); p.classList.remove('hide');
  p.innerHTML = `<h4>Vote na melhor cena</h4><div class="cands">${d.cands.map((c) => `<button data-id="${c.id}" ${c.id === S.me.id ? 'disabled' : ''}>${kindEmoji(c.pose)} ${esc(c.line)}${c.id === S.me.id ? ' (você)' : ''}</button>`).join('')}</div>`;
  p.querySelector('.cands').onclick = (e) => { const b = e.target.closest('[data-id]'); if (b && !b.disabled) send({ t: 'vote', id: b.dataset.id }); };
}

// ---- revelação
function onReveal(d) {
  S.timerEnd = 0; $('#hBar').classList.add('hide'); $('#hQ').classList.add('hide'); $('#hDir').classList.add('hide'); $('#hPanel').classList.add('hide'); stage.hideVRPanel(); stage.setPick(false); stage.freeze(true); stage.setZones(null);
  stage.dist = 8; stage.pitch = 0.38;
  const mine = d.res.filter((r) => r[0] === S.me.id).reduce((a, r) => a + r[1], 0), meRes = d.res.find((r) => r[0] === S.me.id);
  const okCount = d.res.filter((r) => r[2]).length, tot = Math.max(1, S.players.size);
  if (d.kind === 'quiz' || d.kind === 'vf') {
    stage.revealPads(d.correct);
    document.querySelectorAll('#hOpts .opt').forEach((b) => { const r = +b.dataset.i === d.correct; b.classList.toggle('dim', !r); b.classList.toggle('right', r); });
  }
  for (const [id, gain, ok, choice] of d.res) {
    if (d.kind === 'improv') { if (gain > 0) stage.pop(id, `+${gain}`); continue; }
    if (gain > 0) stage.pop(id, `+${gain}`, '#7be0a0');
    else if (choice !== null && choice !== undefined) { stage.fall(id); stage.pop(id, '✖', '#ff8a80'); }
  }
  stage.cheer(0.35 + (okCount / tot) * 1.1);
  const ok = !!(meRes && meRes[2]);
  if (S.me.role === 'player' && d.kind !== 'improv') sfx.play(ok ? 'ok' : 'bad'); else if (d.kind === 'improv') sfx.play('applause');
  S.board = d.board; renderBoard(d.teams); updateMe();
  const r = $('#rev'); r.classList.remove('hide');
  let head, gainHtml = '';
  if (d.kind === 'improv') { head = 'Resultado da cena'; gainHtml = S.me.role === 'player' ? `<div class="gain ok">+${mine}</div>` : ''; }
  else if (S.me.role !== 'player') head = 'Resposta';
  else { head = ok ? 'Acertou!' : meRes && meRes[3] !== null && meRes[3] !== undefined ? 'Não foi dessa vez' : 'Tempo esgotado'; gainHtml = `<div class="gain ${ok ? 'ok' : 'bad'}">${ok ? '+' + mine : '+0'}</div>`; }
  r.innerHTML = `<h3>${head}</h3>${gainHtml}<p><b>${d.kind === 'improv' ? '' : 'Resposta certa: '}${esc(d.text || '')}</b></p><div class="did"><b>Você sabia?</b> ${esc(d.expl || '')}</div>`;
  stage.setTelao({ title: d.kind === 'improv' ? 'Resultado da cena' : 'Resposta certa', sub: d.text || '', text: '', bar: null, board: d.board.slice(0, 5).map((b) => [meName(b[0]), b[1]]), foot: '' });
  hudVR(ok ? `Acertou! +${mine}` : head, d.expl || '');
}
function renderBoard(teams) {
  const b = S.board || [], top = b.slice(0, 5);
  let html = top.map((r, i) => `<div class="${r[0] === S.me.id ? 'me' : ''}"><span>${i + 1}. ${esc(meName(r[0]))}</span><span>${r[1]}</span></div>`).join('');
  const my = b.findIndex((r) => r[0] === S.me.id);
  if (my >= 5) html += `<div class="me"><span>${my + 1}. Você</span><span>${b[my][1]}</span></div>`;
  if (teams) html += `<div style="margin-top:4px"><span style="color:${TEAM_COLORS[0]}">Vermelha ${teams[0]}</span><span style="color:${TEAM_COLORS[1]}">Azul ${teams[1]}</span></div>`;
  const el = $('#hBoard'); el.innerHTML = html; el.classList.toggle('hide', !b.length);
}
function updateMe() {
  const my = (S.board || []).findIndex((r) => r[0] === S.me.id);
  $('#hMe').textContent = S.me.role === 'player' && my >= 0 ? `${my + 1}º · ${S.board[my][1]} pts` : '';
  $('#hMe').classList.toggle('hide', !$('#hMe').textContent);
}

// ---- final
function onFinal(d) {
  show('fin'); S.board = d.board; S.timerEnd = 0; stage.freeze(true); stage.setZones(null); stage.clearPads(); stage.hideVRPanel();
  const top = d.board.slice(0, 3).map((b) => b[0]);
  stage.resetAll(); stage.showPodium(top); stage.setMode(S.me.role === 'screen' ? 'podium' : 'podium'); stage.confetti(); stage.cheer(1.5); sfx.play('win');
  const order = [1, 0, 2], cls = ['p2', 'p1', 'p3'];
  $('#finPod').innerHTML = order.map((i, k) => d.board[i] ? `<div class="${cls[k]}"><b>${i + 1}º</b>${esc(meName(d.board[i][0]))}<br>${d.board[i][1]} pts</div>` : '').join('');
  const tb = $('#finTeams');
  if (d.teams) { tb.classList.remove('hide'); const w = d.teams[0] === d.teams[1] ? -1 : d.teams[0] > d.teams[1] ? 0 : 1; tb.innerHTML = [0, 1].map((t) => `<div style="background:${TEAM_COLORS[t]};${w === t ? 'outline:4px solid #fff' : ''}">Equipe ${t ? 'Azul' : 'Vermelha'}: ${d.teams[t]} pts${w === t ? ' (vencedora)' : ''}</div>`).join(''); } else tb.classList.add('hide');
  $('#finRank').innerHTML = d.board.map((b, i) => `<div class="${b[0] === S.me.id ? 'me' : ''}"><span>${i + 1}. ${esc(meName(b[0]))}</span><span>${b[1]} pts</span></div>`).join('');
  $('#finAwards').innerHTML = d.awards.map((a) => `<div class="award"><b>${esc(a.t)}</b>${esc(meName(a.id))}<br>${esc(a.d)}</div>`).join('');
  $('#bAgain').classList.toggle('hide', !S.isHost); $('#finInfo').textContent = S.isHost ? '' : 'Aguardando o professor(a) iniciar uma nova sessão.';
  hudVR('Fim de espetáculo', `${meName(top[0])} é a Estrela do Palco!`);
  stage.setTelao({ title: 'Fim de espetáculo', sub: 'Pódio', text: '', bar: null, board: d.board.slice(0, 5).map((b) => [meName(b[0]), b[1]]), foot: '' });
}
function onBack() {
  stage.hidePodium(); stage.resetAll(); stage.setMode(S.me.role === 'screen' ? 'tv' : 'follow'); stage.setTheme('default'); stage.setCurtain(true); stage.freeze(S.me.role !== 'player'); stage.dist = 8;
  S.board = []; resetHud(); show('lobby'); renderLobby(); idleTelao();
}
$('#bAgain').onclick = () => send({ t: 'again' });

// ------------------------------------------------------------------ temporizador e HUD em tempo real
function tickTimer() {
  if (S.timerEnd) {
    const left = Math.max(0, S.timerEnd - performance.now()), f = left / S.timerDur;
    $('#hBarFill').style.width = f * 100 + '%'; $('#hBarFill').style.background = f > 0.25 ? '' : '#e0524d';
    stage.setTelao({ bar: f });
    const sec = Math.ceil(left / 1000);
    if (sec !== S.lastSec && sec <= 5 && sec > 0) { S.lastSec = sec; sfx.play('tick'); }
  }
  requestAnimationFrame(tickTimer);
}
tickTimer();
function hudVR(a, b) { stage.setVrHud?.([a, b]); }

// ------------------------------------------------------------------ expressões, joystick, som
$('#hEmotes').innerHTML = POSES.map((p, i) => `<button data-p="${i}" title="${p.n} (${i + 1})" aria-label="${p.n}">${p.e}</button>`).join('');
function doPose(i) {
  if (S.me.role !== 'player' || !S.me.id) return;
  stage.setPose(S.me.id, i); send({ t: 'pose', p: i }); sfx.play('pop'); clearTimeout(S.poseT);
  if (i) S.poseT = setTimeout(() => { stage.setPose(S.me.id, 0); send({ t: 'pose', p: 0 }); }, 3500);
}
$('#hEmotes').onclick = (e) => { const b = e.target.closest('[data-p]'); if (b) doPose(+b.dataset.p); };
addEventListener('keydown', (e) => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (S.screen !== 'hud' && S.screen !== 'lobby') return; if (/^[1-9]$/.test(e.key)) doPose(+e.key - 1); });

const joy = $('#joy'), knob = joy.querySelector('i'); let jid = null;
const jmove = (e) => { const r = joy.getBoundingClientRect(); let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } stage.joy.x = dx; stage.joy.y = dy; knob.style.transform = `translate(${dx * 30}px,${dy * 30}px)`; };
joy.addEventListener('pointerdown', (e) => { jid = e.pointerId; joy.setPointerCapture(jid); jmove(e); e.preventDefault(); });
joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) jmove(e); });
const jend = (e) => { if (e.pointerId !== jid) return; jid = null; stage.joy.x = stage.joy.y = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);

$('#mute').onclick = () => { const m = sfx.toggle(); $('#mute').textContent = m ? 'Som: desligado' : 'Som: ligado'; };
addEventListener('pointerdown', () => sfx.unlock(), { once: true });

// posição do jogador local -> servidor (10 vezes por segundo, só se mudou)
let lastSent = { x: 1e9, z: 1e9, ry: 0 };
setInterval(() => {
  if (!S.code || S.me.role !== 'player') return;
  const s = stage.localState(); if (!s) return;
  if (Math.abs(s.x - lastSent.x) > 0.02 || Math.abs(s.z - lastSent.z) > 0.02 || Math.abs(s.ry - lastSent.ry) > 0.05) { lastSent = s; send({ t: 'm', x: +s.x.toFixed(2), z: +s.z.toFixed(2), ry: +s.ry.toFixed(2) }); }
}, 100);

// ------------------------------------------------------------------ enciclopédia e ajuda
let encTab = ENC[0].id;
function renderEnc() {
  const q = $('#encSearch').value.trim().toLowerCase();
  $('#encTabs').innerHTML = ENC.map((s) => `<button data-t="${s.id}" class="${!q && s.id === encTab ? 'on' : ''}">${s.nome}</button>`).join('');
  const cards = q ? ENC.flatMap((s) => s.cards.filter((c) => (c[0] + ' ' + c[1]).toLowerCase().includes(q)).map((c) => [...c, s.nome])) : ENC.find((s) => s.id === encTab).cards;
  $('#encBody').innerHTML = cards.length ? cards.map((c) => `<div class="card"><b>${esc(c[0])}</b><p>${esc(c[1])}</p>${c[2] ? `<p style="opacity:.6;margin-top:4px;font-size:12px">${esc(c[2])}</p>` : ''}</div>`).join('') : '<p>Nada encontrado. Tente outra palavra.</p>';
}
const openEnc = () => { $('#enc').classList.add('show'); renderEnc(); };
$('#encTabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { encTab = b.dataset.t; $('#encSearch').value = ''; renderEnc(); } };
$('#encSearch').oninput = renderEnc;
$('#encClose').onclick = () => $('#enc').classList.remove('show');
['#bEnc', '#bLobEnc', '#bFinEnc'].forEach((s) => ($(s).onclick = openEnc));
$('#bHow').onclick = () => $('#how').classList.add('show'); $('#howClose').onclick = () => $('#how').classList.remove('show');
addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#enc').classList.remove('show'); $('#how').classList.remove('show'); } });

stage.setMode('orbit'); stage.setCurtain(false);
stage.setTelao({ title: 'Teatro Arena', sub: 'O jogo da cena', text: 'Aprenda teatro em cena, com a turma toda.', bar: null, foot: '' });
