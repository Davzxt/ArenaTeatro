import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { STAGE, floorY, padLayout, ZONES, clampPos } from './shared.js';
import { drawMask } from './masks.js';

const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * k;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

export const POSES = [
  { id: 'idle', e: '🙂', n: 'Neutro' }, { id: 'alegria', e: '😄', n: 'Alegria' }, { id: 'tristeza', e: '😢', n: 'Tristeza' },
  { id: 'raiva', e: '😡', n: 'Raiva' }, { id: 'medo', e: '😱', n: 'Medo' }, { id: 'surpresa', e: '😲', n: 'Surpresa' },
  { id: 'heroi', e: '🦸', n: 'Herói' }, { id: 'reverencia', e: '🙇', n: 'Reverência' }, { id: 'danca', e: '💃', n: 'Dança' },
];
export const PAD_COLORS = ['#d9534f', '#3d7edb', '#e8b84a', '#3fae74'];
export const TEAM_COLORS = ['#e0524d', '#4d8fe0'];

// [braçoE_x, braçoE_z, braçoD_x, braçoD_z, inclinação, cabeça]
const PP = [
  [0, 0.1, 0, -0.1, 0, 0],
  [0, 2.7, 0, -2.7, -0.1, -0.25],
  [0.15, 0.12, 0.15, -0.12, 0.45, 0.55],
  [-0.9, 0.45, -0.9, -0.45, 0.22, 0.1],
  [-2.2, 0.5, -2.2, -0.5, -0.3, -0.1],
  [0, 1.3, 0, -1.3, -0.18, -0.2],
  [0, 0.95, 0, -0.95, -0.08, -0.3],
  [0.4, 0.1, 0.4, -0.1, 1.25, 0.4],
  [0, 1.6, 0, -1.6, 0, 0],
];

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function wrapLines(ctx, text, maxW) {
  const words = String(text).split(' '); const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
function drawWrapped(ctx, text, cx, cy, maxW, lh) {
  const lines = wrapLines(ctx, text, maxW);
  const y0 = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, y0 + i * lh));
  return lines.length;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...o });
function box(parent, w, h, d, color, x, y, z, o) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, o)); m.position.set(x, y, z); parent.add(m); return m;
}

// ------------------------------------------------------------------ AVATAR
class Avatar {
  constructor(info, isLocal) {
    this.id = info.id; this.info = info; this.local = isLocal;
    const g = (this.group = new THREE.Group());
    const root = (this.root = new THREE.Group()); g.add(root);
    const body = mat(info.color), dark = mat(0x2a2230), skin = mat(0xf1c9a5, { roughness: 0.6 });
    const legGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.8, 8); legGeo.translate(0, -0.4, 0);
    this.legL = new THREE.Mesh(legGeo, dark); this.legL.position.set(0.15, 0.85, 0);
    this.legR = new THREE.Mesh(legGeo, dark); this.legR.position.set(-0.15, 0.85, 0);
    root.add(this.legL, this.legR);
    const up = (this.upper = new THREE.Group()); up.position.y = 0.85; root.add(up);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.45, 4, 10), body); torso.position.y = 0.38; up.add(torso);
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.65, 8); armGeo.translate(0, -0.32, 0);
    const handGeo = new THREE.SphereGeometry(0.09, 8, 6);
    this.armL = new THREE.Mesh(armGeo, body); this.armL.position.set(0.37, 0.68, 0);
    this.armR = new THREE.Mesh(armGeo, body); this.armR.position.set(-0.37, 0.68, 0);
    [this.armL, this.armR].forEach((a) => { const h = new THREE.Mesh(handGeo, skin); h.position.y = -0.68; a.add(h); up.add(a); });
    const head = (this.head = new THREE.Group()); head.position.y = 1.12; up.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), skin));
    const mtex = canvasTex(128, 128, (c, w, h) => drawMask(c, w, h, info.mask));
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.285, 20, 14, Math.PI / 2 - 0.75, 1.5, 0.95, 1.25), new THREE.MeshStandardMaterial({ map: mtex, roughness: 0.5 }));
    head.add(patch);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 8, 0, TAU, 0, 0.95), body); head.add(cap);
    // sombra e anel de equipe
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; g.add(sh);
    this.ring = null; this.setTeam(info.team);
    if (isLocal) { const me = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.9, 32), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); me.rotation.x = -Math.PI / 2; me.position.y = 0.04; g.add(me); }
    // hit box (para clicar/apontar)
    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.2; this.hit.userData.avatarId = this.id; g.add(this.hit);
    // nome
    this.tag = this.makeTag(info.name, isLocal); g.add(this.tag);
    this.bubble = null; this.sayT = 0; this.pops = [];
    this.x = this.tx = 0; this.z = this.tz = 2; this.y = floorY(2); this.ry = this.try = 0; this.px = 0; this.pz = 2;
    this.pose = 0; this.walk = 0; this.phase = 0; this.fall = 0; this.yOverride = null;
    this.aLx = 0; this.aLz = 0.1; this.aRx = 0; this.aRz = -0.1; this.lean = 0; this.hx = 0;
  }
  setTeam(team) {
    if (this.ring) { this.group.remove(this.ring); this.ring = null; }
    if (team === null || team === undefined) return;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.72, 28), new THREE.MeshBasicMaterial({ color: TEAM_COLORS[team], side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.03; this.group.add(this.ring);
  }
  makeTag(name, me) {
    const t = canvasTex(256, 64, (c, w, h) => {
      c.fillStyle = me ? 'rgba(232,184,74,.95)' : 'rgba(20,10,16,.78)'; roundRect(c, 4, 8, w - 8, h - 16, 16); c.fill();
      c.fillStyle = me ? '#2a1208' : '#fdf3e1'; c.font = '700 30px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2 + 1, w - 24);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(1.7, 0.43, 1); s.position.y = 2.65; s.renderOrder = 20; return s;
  }
  say(text, sec = 4) {
    if (!this.bubble) { this.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); this.bubble.scale.set(3.4, 1.28, 1); this.bubble.position.y = 3.65; this.bubble.renderOrder = 21; this.group.add(this.bubble); }
    const t = canvasTex(512, 192, (c, w, h) => {
      c.fillStyle = 'rgba(253,243,225,.97)'; roundRect(c, 6, 6, w - 12, h - 30, 26); c.fill();
      c.beginPath(); c.moveTo(w / 2 - 16, h - 25); c.lineTo(w / 2, h - 4); c.lineTo(w / 2 + 16, h - 25); c.fill();
      c.fillStyle = '#2a1208'; c.font = '700 34px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; drawWrapped(c, text, w / 2, (h - 24) / 2 + 4, w - 60, 40);
    });
    if (this.bubble.material.map) this.bubble.material.map.dispose();
    this.bubble.material.map = t; this.bubble.material.needsUpdate = true; this.bubble.visible = true; this.sayT = sec;
  }
  hush() { this.sayT = 0; if (this.bubble) this.bubble.visible = false; }
  pop(text, color = '#ffd36a') {
    const t = canvasTex(256, 96, (c, w, h) => { c.font = '800 54px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(text, w / 2, h / 2); c.fillStyle = color; c.fillText(text, w / 2, h / 2); });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(2, 0.75, 1); s.position.y = 3; s.renderOrder = 22;
    this.group.add(s); this.pops.push({ s, age: 0 });
  }
  resetFall() { this.fall = 0; this.root.visible = true; this.root.scale.setScalar(1); this.root.rotation.z = 0; }
  update(dt, t) {
    if (!this.local) {
      const k = 1 - Math.exp(-dt * 12);
      this.x += (this.tx - this.x) * k; this.z += (this.tz - this.z) * k;
      this.ry += angDiff(this.ry, this.try) * k;
    } else this.ry += angDiff(this.ry, this.try) * (1 - Math.exp(-dt * 14));
    const sp = Math.hypot(this.x - this.px, this.z - this.pz) / Math.max(dt, 1e-3); this.px = this.x; this.pz = this.z;
    const kk = 1 - Math.exp(-dt * 10);
    this.walk = lerp(this.walk, Math.min(sp / 4.5, 1), kk);
    this.phase += dt * 10 * Math.max(this.walk, 0.0);
    const ty = this.yOverride !== null ? this.yOverride : floorY(this.z);
    this.y += (ty - this.y) * (1 - Math.exp(-dt * 14));
    this.group.position.set(this.x, this.y, this.z);
    this.root.rotation.y = this.ry;
    // pose
    const P = PP[this.pose] || PP[0], pw = 1 - this.walk, sw = Math.sin(this.phase) * 0.7 * this.walk;
    const dance = this.pose === 8 ? Math.sin(t * 8) : 0, shake = this.pose === 3 ? Math.sin(t * 32) * 0.04 : this.pose === 4 ? Math.sin(t * 40) * 0.03 : 0;
    const tLx = P[0] * pw + sw, tRx = P[2] * pw - sw, tLz = P[1] + dance * 0.6, tRz = P[3] - dance * 0.6;
    this.aLx = lerp(this.aLx, tLx, kk); this.aRx = lerp(this.aRx, tRx, kk); this.aLz = lerp(this.aLz, tLz, kk); this.aRz = lerp(this.aRz, tRz, kk);
    this.lean = lerp(this.lean, P[4], kk); this.hx = lerp(this.hx, P[5], kk);
    this.armL.rotation.set(this.aLx, 0, this.aLz); this.armR.rotation.set(this.aRx, 0, this.aRz);
    this.legL.rotation.x = Math.sin(this.phase) * 0.7 * this.walk; this.legR.rotation.x = -Math.sin(this.phase) * 0.7 * this.walk;
    this.upper.rotation.x = this.lean; this.upper.rotation.z = shake + dance * 0.12; this.head.rotation.x = this.hx;
    const bob = this.pose === 1 ? Math.abs(Math.sin(t * 6)) * 0.18 : this.pose === 8 ? Math.abs(Math.sin(t * 8)) * 0.1 : Math.abs(Math.sin(this.phase)) * 0.05 * this.walk;
    this.root.position.y = bob; this.upper.scale.y = 1 + Math.sin(t * 2 + this.x) * 0.012;
    // queda (resposta errada)
    if (this.fall > 0) {
      this.fall += dt; const s = Math.max(0.001, 1 - this.fall / 0.9);
      this.root.scale.setScalar(s); this.root.rotation.y += dt * 14; this.root.rotation.z = this.fall * 3;
      if (this.fall > 0.95) this.root.visible = false;
    }
    if (this.sayT > 0) { this.sayT -= dt; if (this.sayT <= 0 && this.bubble) this.bubble.visible = false; }
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]; p.age += dt; p.s.position.y = 3 + p.age * 1.1; p.s.material.opacity = Math.max(0, 1 - Math.max(0, p.age - 0.9) / 0.6);
      if (p.age > 1.5) { this.group.remove(p.s); p.s.material.map.dispose(); p.s.material.dispose(); this.pops.splice(i, 1); }
    }
  }
}

// ------------------------------------------------------------------ PAINEL VR (canvas em 3D com botões apontáveis)
class VRPanel {
  constructor(w, h, ww) {
    this.cv = document.createElement('canvas'); this.cv.width = w; this.cv.height = h;
    this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(ww, (ww * h) / w), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, side: THREE.DoubleSide, depthTest: false }));
    this.mesh.renderOrder = 30; this.mesh.userData.panel = this; this.buttons = [];
  }
  draw(fn, buttons = []) { this.buttons = buttons; fn(this.ctx, this.cv.width, this.cv.height); this.tex.needsUpdate = true; }
  hit(uv) { const x = uv.x * this.cv.width, y = (1 - uv.y) * this.cv.height; return this.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h); }
}

// ------------------------------------------------------------------ PALCO
export class Stage3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.mobile = matchMedia('(pointer:coarse)').matches;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.mobile, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio, this.mobile ? 1.5 : 2));
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x07060c); this.scene.fog = new THREE.Fog(0x07060c, 32, 85);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 140);
    this.dolly = new THREE.Group(); this.dolly.add(this.camera); this.scene.add(this.dolly);
    this.avatars = new Map(); this.local = null; this.mode = 'orbit';
    this.yaw = 0; this.pitch = 0.38; this.dist = 8; this.keys = new Set(); this.joy = { x: 0, y: 0 };
    this.controls = false; this.walkTarget = null; this.curtainT = 0; this.curtainV = 0; this.cheerLevel = 0;
    this.pickEnabled = false; this.onPick = null; this.onLocalMove = null;
    this.inVR = false; this.vrPanel = null; this.vrTargets = []; this.onVRButton = null; this.ray = new THREE.Raycaster(); this.snapLock = false;
    this.camPos = new THREE.Vector3(0, 7, 18); this.last = 0; this.telDirty = true; this.telState = {}; this.telLastBar = -1; this.telAcc = 0;
    this.podiumIds = null;
    this.build(); this.bindInput(); this.resize();
    addEventListener('resize', () => this.resize());
    r.setAnimationLoop((t) => this.tick(t));
  }

  // ---------------- construção do teatro
  build() {
    const S = this.scene;
    S.add(new THREE.HemisphereLight(0xc9d2ff, 0x3a1a24, 1.5));
    this.key = new THREE.DirectionalLight(0xfff0d8, 2.3); this.key.position.set(0, 14, 10); this.key.target.position.set(0, 0, -5); S.add(this.key, this.key.target);
    const rim = new THREE.DirectionalLight(0x7aa2ff, 0.9); rim.position.set(-8, 8, -14); S.add(rim);

    // piso do palco
    const wood = canvasTex(512, 512, (c) => {
      for (let i = 0; i < 8; i++) {
        c.fillStyle = `hsl(${28 + Math.random() * 6},${45 + Math.random() * 10}%,${30 + Math.random() * 9}%)`; c.fillRect(0, i * 64, 512, 64);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, i * 64, 512, 2);
        for (let k = 0; k < 5; k++) c.fillRect(Math.random() * 512, i * 64, 2, 64);
      }
    });
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(5, 3);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 13), mat(0xffffff, { map: wood, roughness: 0.55 })); floor.position.set(0, 0.3, -5.5); S.add(floor);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), mat(0x3a0f1c, { roughness: 0.95 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0, 8); S.add(carpet);
    // paredes/teto
    box(S, 0.5, 14, 40, 0x120c18, -15.5, 7, 4); box(S, 0.5, 14, 40, 0x120c18, 15.5, 7, 4);
    box(S, 32, 0.4, 44, 0x0c0912, 0, 14.2, 4); box(S, 32, 14, 0.5, 0x0e0a14, 0, 7, 25);
    box(S, 0.5, 12, 13, 0x0f0b15, -14.4, 6.6, -5.5); box(S, 0.5, 12, 13, 0x0f0b15, 14.4, 6.6, -5.5);
    // balcões
    for (const sx of [-1, 1]) { box(S, 1.6, 0.4, 14, 0xb8892b, sx * 14.4, 5.2, 14, { metalness: 0.6, roughness: 0.4 }); box(S, 1.6, 2.2, 0.4, 0x4a0f22, sx * 14.4, 6.4, 7.2); }
    // lustres
    this.lamps = [];
    for (const z of [9, 15, 21]) for (const x of [-8, 0, 8]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); l.position.set(x, 12.2, z); S.add(l); }

    // poltronas e plateia
    const rows = 10, per = 22, seatGeo = new THREE.BoxGeometry(0.85, 0.7, 0.85);
    this.seats = new THREE.InstancedMesh(seatGeo, mat(0x6b1428, { roughness: 0.8 }), rows * per);
    const backs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.85, 0.9, 0.14), mat(0x7d1830, { roughness: 0.8 }), rows * per);
    const heads = (this.heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0xffffff), rows * per));
    const bodies = (this.bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), mat(0xffffff), rows * per));
    const m4 = new THREE.Matrix4(), col = new THREE.Color(); this.aud = []; let n = 0;
    const skins = [0xf1c9a5, 0xd9a577, 0x9a6a45, 0x6b4630, 0xffdbb5], cloth = [0x3d7edb, 0xd9534f, 0x3fae74, 0xe8b84a, 0xa56bd6, 0xeeeeee, 0x38b6c9];
    for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) {
      let x = -11.5 + i * 1.05; if (Math.abs(x) < 0.9) x += x < 0 ? -0.8 : 0.8;
      const z = 8 + r * 1.4, y = r * 0.32 + 0.35;
      m4.makeTranslation(x, y, z); this.seats.setMatrixAt(n, m4);
      m4.makeTranslation(x, y + 0.45, z + 0.45); backs.setMatrixAt(n, m4);
      const occ = Math.random() < 0.72;
      this.aud.push({ x, y, z, occ, ph: Math.random() * 6, sp: 4 + Math.random() * 4 });
      heads.setColorAt(n, col.setHex(skins[(Math.random() * skins.length) | 0])); bodies.setColorAt(n, col.setHex(cloth[(Math.random() * cloth.length) | 0]));
      n++;
    }
    S.add(this.seats, backs, heads, bodies); this.updateAudience(0, 0);

    // proscênio
    const gold = { metalness: 0.65, roughness: 0.35 };
    box(S, 1.3, 10.6, 1.3, 0xb8892b, -10.7, 5.6, 0.6, gold); box(S, 1.3, 10.6, 1.3, 0xb8892b, 10.7, 5.6, 0.6, gold);
    box(S, 23.5, 1.6, 1.3, 0xb8892b, 0, 10.9, 0.6, gold);
    box(S, 22, 1.2, 0.5, 0x5a0f22, 0, 9.8, 0.9);
    for (const [sx, style] of [[-1, 'comedia'], [1, 'tragedia']]) {
      const t = canvasTex(256, 256, (c, w, h) => { drawMask(c, w, h, style); c.strokeStyle = '#b8892b'; c.lineWidth = 14; c.strokeRect(0, 0, w, h); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: t })); m.position.set(sx * 3.2, 10.9, 1.27); S.add(m);
    }
    // cortinas
    const ctex = canvasTex(256, 64, (c, w, h) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#7d1230' : '#5a0f22'; c.fillRect(i * 16, 0, 16, h); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(i * 16, 0, 3, h); } });
    const cg = new THREE.BoxGeometry(10.8, 9.6, 0.45);
    this.curL = new THREE.Mesh(cg.clone().translate(5.4, 0, 0), mat(0xffffff, { map: ctex, roughness: 0.9 })); this.curL.position.set(-10.7, 5.4, 0.55);
    this.curR = new THREE.Mesh(cg.clone().translate(-5.4, 0, 0), mat(0xffffff, { map: ctex, roughness: 0.9 })); this.curR.position.set(10.7, 5.4, 0.55);
    S.add(this.curL, this.curR);

    // fundo (rotunda) e telão
    this.rotunda = new THREE.Mesh(new THREE.PlaneGeometry(29, 12), new THREE.MeshStandardMaterial({ color: 0x1a1730, roughness: 1 })); this.rotunda.position.set(0, 6.6, -12.3); S.add(this.rotunda);
    this.tel = document.createElement('canvas'); this.tel.width = 1280; this.tel.height = 640; this.telCtx = this.tel.getContext('2d');
    this.telTex = new THREE.CanvasTexture(this.tel); this.telTex.colorSpace = THREE.SRGBColorSpace;
    box(S, 11.9, 6.1, 0.2, 0xb8892b, 0, 6.5, -12.05, gold);
    const telm = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 5.75), new THREE.MeshBasicMaterial({ map: this.telTex })); telm.position.set(0, 6.5, -11.93); S.add(telm);
    // varas de luz + feixes
    for (const z of [-3, -9]) { box(S, 26, 0.18, 0.18, 0x222, 0, 10.6, z); for (let x = -10; x <= 10; x += 4) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a8 })); c.position.set(x, 10.3, z); S.add(c); } }
    this.beams = [];
    for (let i = 0; i < 3; i++) {
      const pivot = new THREE.Group(); pivot.position.set((i - 1) * 6, 10.3, -3);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 10, 24, 1, true), new THREE.MeshBasicMaterial({ color: [0xffe6b0, 0xb8d4ff, 0xffc9d6][i], transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      cone.position.y = -5; cone.rotation.x = Math.PI; pivot.add(cone); this.beams.push(pivot); S.add(pivot);
    }
    this.buildThemes();

    // plataformas e sobreposições de zona
    this.padGroup = new THREE.Group(); S.add(this.padGroup); this.pads = [];
    this.zoneCv = document.createElement('canvas'); this.zoneCv.width = 1400; this.zoneCv.height = 650;
    this.zoneTex = new THREE.CanvasTexture(this.zoneCv); this.zoneTex.colorSpace = THREE.SRGBColorSpace;
    this.zoneMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 13), new THREE.MeshBasicMaterial({ map: this.zoneTex, transparent: true, depthWrite: false }));
    this.zoneMesh.rotation.x = -Math.PI / 2; this.zoneMesh.position.set(0, 0.62, -5.5); this.zoneMesh.visible = false; S.add(this.zoneMesh);
    this.plCv = document.createElement('canvas'); this.plCv.width = 1400; this.plCv.height = 150;
    this.plTex = new THREE.CanvasTexture(this.plCv); this.plTex.colorSpace = THREE.SRGBColorSpace;
    this.plMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 3), new THREE.MeshBasicMaterial({ map: this.plTex, transparent: true, depthWrite: false }));
    this.plMesh.rotation.x = -Math.PI / 2; this.plMesh.position.set(0, 0.03, 4); this.plMesh.visible = false; S.add(this.plMesh);

    // confete
    const N = 260, pos = new Float32Array(N * 3), cols = new Float32Array(N * 3), cc = new THREE.Color();
    for (let i = 0; i < N; i++) { cc.setHSL(Math.random(), 0.9, 0.6); cols.set([cc.r, cc.g, cc.b], i * 3); }
    const cg2 = new THREE.BufferGeometry(); cg2.setAttribute('position', new THREE.BufferAttribute(pos, 3)); cg2.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    this.conf = { pts: new THREE.Points(cg2, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, depthWrite: false })), vel: new Float32Array(N * 3), t: 0, N };
    this.conf.pts.visible = false; this.conf.pts.frustumCulled = false; S.add(this.conf.pts);

    // pódio
    this.podium = new THREE.Group(); this.podium.visible = false; S.add(this.podium);
    [[0, 1.6], [-2.8, 1.1], [2.8, 0.7]].forEach(([x, h], i) => { const b = box(this.podium, 2.4, h, 2.2, [0xe8b84a, 0xc4c9d1, 0xc98a52][i], x, 0.6 + h / 2, -4, { metalness: 0.5, roughness: 0.35 }); b.userData.h = h; });
  }

  buildThemes() {
    const S = this.scene; this.themes = {};
    const mk = (name) => { const g = new THREE.Group(); g.visible = false; S.add(g); this.themes[name] = g; return g; };
    // padrão: cortinas de veludo
    let g = mk('default');
    for (let x = -12; x <= 12; x += 3) box(g, 1.6, 11, 0.3, x % 6 ? 0x4a0f22 : 0x5e1229, x, 6.1, -11.9 + (x % 6 ? 0.1 : 0));
    // Grécia
    g = mk('grecia');
    for (let x = -10; x <= 10; x += 4) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 9, 14), mat(0xece4d2, { roughness: 0.6 })); c.position.set(x, 5.1, -11.2); g.add(c); box(g, 1.5, 0.4, 1.5, 0xddd3bd, x, 9.8, -11.2); box(g, 1.5, 0.4, 1.5, 0xddd3bd, x, 0.8, -11.2); }
    box(g, 23, 0.7, 1, 0xece4d2, 0, 10.2, -11.2);
    const sh = new THREE.Shape(); sh.moveTo(-11.5, 0); sh.lineTo(11.5, 0); sh.lineTo(0, 2.2);
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }), mat(0xece4d2)); ped.position.set(0, 10.55, -11.5); g.add(ped);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ color: 0xffd36a })); sun.position.set(-8, 8, -12.2); g.add(sun);
    // História (medieval/renascimento)
    g = mk('historia');
    for (const x of [-8, 0, 8]) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.45, 8, 20, Math.PI), mat(0x8a8178, { roughness: 1 })); arc.position.set(x, 5.2, -11.2); g.add(arc);
      for (const dx of [-2.6, 2.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 5.2, 10), mat(0x8a8178, { roughness: 1 })); p.position.set(x + dx, 2.9, -11.2); g.add(p); }
    }
    for (const x of [-12, -4, 4, 12]) { box(g, 1.6, 4, 0.1, x % 8 ? 0x8d1f2f : 0xc9a227, x, 7.5, -11.6); const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa44a })); f.position.set(x + 2, 4, -11.5); g.add(f); }
    // Brasil: bandeirinhas, sol e palmeiras
    g = mk('brasil');
    const flagCols = [0xe0524d, 0xffd23f, 0x3d7edb, 0x3fae74, 0xf08a3a];
    for (let line = 0; line < 3; line++) for (let i = 0; i < 26; i++) {
      const x = -12.5 + i, y = 9.6 - line * 1.2 - Math.sin((i / 25) * Math.PI) * 0.9 * -1 * 0 - Math.abs(Math.sin((i / 25) * Math.PI * 2)) * 0.4;
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.7, 3), new THREE.MeshBasicMaterial({ color: flagCols[(i + line) % 5] })); f.position.set(x, y, -11.3 + line * 0.4); f.rotation.z = Math.PI; g.add(f);
    }
    const bsun = new THREE.Mesh(new THREE.CircleGeometry(2.2, 28), new THREE.MeshBasicMaterial({ color: 0xffc83d })); bsun.position.set(0, 4.5, -12.2); g.add(bsun);
    for (const x of [-10, 10]) { const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 5, 8), mat(0x6b4a2b)); trunk.position.set(x, 2.8, -11); g.add(trunk); for (let k = 0; k < 6; k++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.8, 5), mat(0x2f9d57)); leaf.position.set(x + Math.cos(k) * 1.1, 5.7, -11 + Math.sin(k) * 1.1); leaf.rotation.z = Math.cos(k) * 1.1; leaf.rotation.x = Math.sin(k) * 1.1; g.add(leaf); } }
    // Mundo: pórtico torii e lanternas
    g = mk('mundo');
    for (const x of [-5.5, 5.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 8.5, 12), mat(0xc8321f, { roughness: 0.5 })); p.position.set(x, 4.9, -11); g.add(p); }
    box(g, 15, 0.7, 0.8, 0xc8321f, 0, 8.6, -11, { roughness: 0.5 }); box(g, 13, 0.5, 0.6, 0x1a1a1a, 0, 7.3, -11);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(1.5, 28), new THREE.MeshBasicMaterial({ color: 0xfff4e0 })); moon.position.set(8, 8.5, -12.2); g.add(moon);
    for (const x of [-9, -7, 7, 9]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff5a3d })); l.position.set(x, 6.2 + (Math.abs(x) % 4) * 0.3, -10.8); g.add(l); }
    // Moderno: formas geométricas e cartazes
    g = mk('moderno');
    const shapes = [[-9, 7.5, 0xe0524d], [-3, 3.8, 0x3d7edb], [3.5, 7.2, 0xe8b84a], [9, 4, 0x3fae74]];
    shapes.forEach(([x, y, c], i) => { const m = i % 2 ? new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), mat(c)) : new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 24).rotateX(Math.PI / 2), mat(c)); m.position.set(x, y, -11.4); m.rotation.z = i * 0.4; g.add(m); });
    box(g, 22, 0.2, 0.2, 0xdddddd, 0, 9.4, -11.3);
    this.setTheme('default');
  }

  setTheme(name) {
    const th = { default: 0x1a1730, grecia: 0x5aa6d9, historia: 0x5d5650, brasil: 0xe9893a, mundo: 0x24141f, moderno: 0xe9e4da }[name] ?? 0x1a1730;
    for (const [k, g] of Object.entries(this.themes)) g.visible = k === name;
    this.rotunda.material.color.setHex(th);
    this.curTheme = name;
  }

  // ---------------- plataformas, zonas e telão
  clearPads() { this.padGroup.clear(); this.pads = []; }
  setPads(n, labels) {
    this.clearPads(); const L = padLayout(n);
    const colors = n === 2 ? ['#3fae74', '#d9534f'] : PAD_COLORS;
    L.forEach((p, i) => {
      const g = new THREE.Group(); g.position.set(p.x, STAGE.height + 0.04, p.z);
      const w = p.hx * 2 - 0.3, d = p.hz * 2 - 0.3;
      const bx = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), mat(colors[i], { emissive: colors[i], emissiveIntensity: 0.25, roughness: 0.5 })); g.add(bx);
      const tex = canvasTex(Math.round(w * 100), Math.round(d * 100), (c, cw, ch) => {
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 0, cw, ch); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 8; c.strokeRect(6, 6, cw - 12, ch - 12);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        if (n === 2) { c.font = '800 100px system-ui,sans-serif'; c.fillText(labels[i].toUpperCase(), cw / 2, ch / 2, cw - 40); }
        else { c.font = '800 170px system-ui,sans-serif'; c.fillText('ABCD'[i], cw / 2, ch * 0.22); c.font = '700 40px system-ui,sans-serif'; drawWrapped(c, labels[i], cw / 2, ch * 0.62, cw - 50, 46); }
      });
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); lab.rotation.x = -Math.PI / 2; lab.position.y = 0.05; g.add(lab);
      g.userData = { bx, lab, color: colors[i] }; this.padGroup.add(g); this.pads.push(g);
    });
    this.padReveal = null;
  }
  revealPads(correct) { this.padReveal = correct; this.pads.forEach((g, i) => { if (i !== correct) { g.userData.bx.material.color.set('#2b2530'); g.userData.bx.material.emissiveIntensity = 0; g.userData.lab.material.opacity = 0.35; } }); }
  setZones(targetId) {
    this.zoneMesh.visible = this.plMesh.visible = !!targetId || targetId === '';
    if (!targetId) { this.zoneMesh.visible = this.plMesh.visible = false; return; }
    const draw = (cv, tex, list, ox, oz) => {
      const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
      for (const q of list) {
        const x = (q.x0 - ox) * 50, y = (q.z0 - oz) * 50, w = (q.x1 - q.x0) * 50, h = (q.z1 - q.z0) * 50, hot = q.id === targetId;
        c.fillStyle = hot ? 'rgba(255,200,60,.55)' : 'rgba(255,255,255,.06)'; c.fillRect(x, y, w, h);
        c.strokeStyle = hot ? '#ffd36a' : 'rgba(255,255,255,.4)'; c.lineWidth = hot ? 8 : 3; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
        c.fillStyle = hot ? '#fff' : 'rgba(255,255,255,.75)'; c.font = '700 ' + (hot ? 34 : 28) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(q.name, x + w / 2, y + h / 2, w - 16);
      }
      tex.needsUpdate = true;
    };
    draw(this.zoneCv, this.zoneTex, ZONES.filter((q) => q.id !== 'PL'), -14, -12);
    draw(this.plCv, this.plTex, ZONES.filter((q) => q.id === 'PL'), -14, 2.5);
  }
  setTelao(s) {
    Object.assign(this.telState, s);
    const keys = Object.keys(s);
    if (!(keys.length === 1 && keys[0] === 'bar')) this.telDirty = true; // só a barra: redesenha no ritmo do laço
  }
  drawTelao() {
    const c = this.telCtx, W = 1280, H = 640, s = this.telState;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b0a18'); g.addColorStop(1, '#0b0610'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(232,184,74,.55)'; c.lineWidth = 6; c.strokeRect(14, 14, W - 28, H - 28);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (s.title) { c.fillStyle = '#e8b84a'; c.font = '400 54px "Abril Fatface",Georgia,serif'; c.fillText(s.title, W / 2, 78, W - 120); }
    if (s.sub) { c.fillStyle = '#cdbfa8'; c.font = '600 32px system-ui,sans-serif'; c.fillText(s.sub, W / 2, 132, W - 120); }
    if (s.board && s.board.length) {
      c.font = '700 54px system-ui,sans-serif';
      s.board.slice(0, 5).forEach((b, i) => { c.fillStyle = ['#ffd36a', '#d6dae2', '#d9a066', '#fdf3e1', '#fdf3e1'][i]; c.textAlign = 'left'; c.fillText(`${i + 1}. ${b[0]}`, 260, 230 + i * 70, 560); c.textAlign = 'right'; c.fillText(String(b[1]), W - 260, 230 + i * 70); });
      c.textAlign = 'center';
    } else if (s.text) {
      c.fillStyle = '#fdf3e1'; const len = s.text.length; c.font = `700 ${len > 110 ? 48 : len > 70 ? 58 : 70}px system-ui,sans-serif`;
      drawWrapped(c, s.text, W / 2, 330, W - 160, len > 110 ? 58 : len > 70 ? 70 : 84);
    }
    if (s.foot) { c.fillStyle = '#e8b84a'; c.font = '700 36px system-ui,sans-serif'; c.fillText(s.foot, W / 2, H - 78, W - 120); }
    if (s.bar !== undefined && s.bar !== null) {
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(70, H - 46, W - 140, 16);
      c.fillStyle = s.bar > 0.25 ? '#e8b84a' : '#e0524d'; c.fillRect(70, H - 46, (W - 140) * Math.max(0, s.bar), 16);
    }
    this.telTex.needsUpdate = true; this.telDirty = false;
  }

  // ---------------- jogadores
  addPlayer(info, isLocal) {
    if (this.avatars.has(info.id)) { const a = this.avatars.get(info.id); a.setTeam(info.team); return a; }
    const a = new Avatar(info, isLocal); this.avatars.set(info.id, a); this.scene.add(a.group);
    this.hitList = null; return a;
  }
  removePlayer(id) { const a = this.avatars.get(id); if (!a) return; this.scene.remove(a.group); this.avatars.delete(id); this.hitList = null; }
  clearPlayers() { for (const id of [...this.avatars.keys()]) this.removePlayer(id); this.local = null; }
  setLocal(id) { this.local = id; }
  updateRemote(id, x, z, ry, pose) { const a = this.avatars.get(id); if (!a || a.local) return; a.tx = x; a.tz = z; a.try = ry; a.pose = pose; }
  teleport(id, x, z, ry = 0) { const a = this.avatars.get(id); if (!a) return; a.x = a.tx = a.px = x; a.z = a.tz = a.pz = z; a.try = ry; a.ry = ry; a.y = a.yOverride !== null ? a.yOverride : floorY(z); if (id === this.local) this.walkTarget = null; }
  setPose(id, p) { const a = this.avatars.get(id); if (a) a.pose = p; }
  say(id, text, sec) { this.avatars.get(id)?.say(text, sec); }
  pop(id, text, color) { this.avatars.get(id)?.pop(text, color); }
  fall(id) { const a = this.avatars.get(id); if (a && a.fall === 0) a.fall = 0.001; }
  resetAll() { for (const a of this.avatars.values()) { a.resetFall(); a.yOverride = null; a.hush(); a.pose = 0; } }
  localState() { const a = this.avatars.get(this.local); return a ? { x: a.x, z: a.z, ry: a.try } : null; }
  ensemble(ids) {
    const n = ids.length, cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n * 1.8)))), rows = Math.ceil(n / cols);
    ids.forEach((id, i) => { const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols); const x = (c - (inRow - 1) / 2) * Math.min(2.6, 18 / cols), z = -3 - r * (7 / Math.max(rows, 1)) * 1.1; this.teleport(id, x, Math.max(-10, z), 0); });
  }
  walkTo(x, z) { this.walkTarget = [x, z]; }
  freeze(f) { this.controls = !f; if (f) this.walkTarget = null; }
  setCurtain(open) { this.curtainT = open ? 1 : 0; }
  setMode(m) { this.mode = m; }
  cheer(v) { this.cheerLevel = Math.max(this.cheerLevel, v); }
  confetti() {
    const { vel, pts, N } = this.conf, p = pts.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - 0.5) * 20; p[i * 3 + 1] = 11 + Math.random() * 2; p[i * 3 + 2] = -9 + Math.random() * 10; vel[i * 3] = (Math.random() - 0.5) * 2; vel[i * 3 + 1] = -1 - Math.random() * 2; vel[i * 3 + 2] = (Math.random() - 0.5) * 2; }
    pts.geometry.attributes.position.needsUpdate = true; pts.visible = true; this.conf.t = 6;
  }
  showPodium(ids) {
    this.podium.visible = true; const xs = [0, -2.8, 2.8], hs = [1.6, 1.1, 0.7];
    ids.slice(0, 3).forEach((id, i) => { const a = this.avatars.get(id); if (!a) return; a.yOverride = STAGE.height + hs[i]; this.teleport(id, xs[i], -4, 0); a.pose = i === 0 ? 1 : 6; });
    this.podiumIds = ids.slice(0, 3);
  }
  hidePodium() { this.podium.visible = false; this.podiumIds = null; for (const a of this.avatars.values()) a.yOverride = null; }
  setPick(on) { this.pickEnabled = on; }

  // ---------------- entrada (teclado, mouse, toque)
  bindInput() {
    const cv = this.canvas;
    addEventListener('keydown', (e) => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; this.keys.add(e.key.toLowerCase()); if (e.key.startsWith('Arrow')) e.preventDefault(); });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());
    let drag = null;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), ok: e.pointerType !== 'touch' || e.clientX > innerWidth * 0.38 }; cv.setPointerCapture?.(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!drag || !drag.ok) return; this.yaw -= (e.clientX - drag.x) * 0.006; this.pitch = Math.max(0.05, Math.min(1.2, this.pitch + (e.clientY - drag.y) * 0.005)); drag.x = e.clientX; drag.y = e.clientY; });
    cv.addEventListener('pointerup', (e) => {
      if (!drag) return; const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy), quick = performance.now() - drag.t < 400; drag = null;
      if (moved < 7 && quick && this.pickEnabled) this.pickAt(e.clientX, e.clientY);
    });
    cv.addEventListener('wheel', (e) => { this.dist = Math.max(4, Math.min(16, this.dist + e.deltaY * 0.01)); e.preventDefault(); }, { passive: false });
  }
  getHits() { if (!this.hitList) this.hitList = [...this.avatars.values()].map((a) => a.hit); return this.hitList; }
  pickAt(cx, cy) {
    const v = new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    this.ray.setFromCamera(v, this.camera);
    const h = this.ray.intersectObjects(this.getHits(), false)[0];
    if (h && this.onPick) this.onPick(h.object.userData.avatarId);
  }

  // ---------------- realidade virtual
  initVR(onChange) {
    if (!navigator.xr) return Promise.resolve(false);
    return navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
      if (!ok) return false;
      const r = this.renderer; r.xr.enabled = true;
      this.vrBtn = VRButton.createButton(r); this.vrBtn.classList.add('vrbtn'); document.body.appendChild(this.vrBtn);
      for (let i = 0; i < 2; i++) {
        const c = r.xr.getController(i); this.dolly.add(c);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -4)]), new THREE.LineBasicMaterial({ color: 0xffd36a }));
        c.add(line); const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd36a })); c.add(tip);
        c.addEventListener('selectstart', () => this.vrSelect(c));
      }
      this.vrHud = new VRPanel(512, 200, 0.5); this.vrHud.mesh.position.set(0, -0.3, -0.9); this.vrHud.mesh.visible = false; this.camera.add(this.vrHud.mesh);
      r.xr.addEventListener('sessionstart', () => {
        this.inVR = true; const a = this.avatars.get(this.local); this.camera.position.set(0, 0, 0); this.camera.rotation.set(0, 0, 0);
        if (a) { this.dolly.position.set(a.x, a.y, a.z); a.root.visible = false; } this.vrHud.mesh.visible = true; onChange?.(true);
      });
      r.xr.addEventListener('sessionend', () => {
        this.inVR = false; this.dolly.position.set(0, 0, 0); this.dolly.rotation.set(0, 0, 0); const a = this.avatars.get(this.local); if (a) a.root.visible = true;
        this.hideVRPanel(); this.vrHud.mesh.visible = false; onChange?.(false);
      });
      return true;
    }).catch(() => false);
  }
  setVrHud(lines) {
    if (!this.vrHud) return;
    this.vrHud.draw((c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(20,8,16,.82)'; roundRect(c, 4, 4, w - 8, h - 8, 28); c.fill();
      c.fillStyle = '#e8b84a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 40px system-ui,sans-serif'; c.fillText(lines[0] || '', w / 2, 50, w - 40);
      c.fillStyle = '#fdf3e1'; c.font = '600 32px system-ui,sans-serif'; drawWrapped(c, lines[1] || '', w / 2, 118, w - 50, 38);
    });
  }
  showVRPanel(panelDraw, buttons, w = 1.9, h = 1.2) {
    if (!this.inVR) return;
    if (!this.vrPanel) this.vrPanel = new VRPanel(1024, Math.round(1024 * (h / w)), w);
    const p = this.vrPanel, pos = new THREE.Vector3(), dir = new THREE.Vector3();
    this.camera.getWorldPosition(pos); this.camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
    p.draw(panelDraw, buttons); p.mesh.position.set(pos.x + dir.x * 1.5, pos.y - 0.05, pos.z + dir.z * 1.5); p.mesh.lookAt(pos.x, p.mesh.position.y, pos.z);
    if (!p.mesh.parent) this.scene.add(p.mesh); p.mesh.visible = true;
  }
  redrawVRPanel(fn, buttons) { if (this.vrPanel) this.vrPanel.draw(fn, buttons); }
  hideVRPanel() { if (this.vrPanel) this.vrPanel.mesh.visible = false; }
  vrSelect(ctrl) {
    const m = new THREE.Matrix4().extractRotation(ctrl.matrixWorld);
    this.ray.ray.origin.setFromMatrixPosition(ctrl.matrixWorld); this.ray.ray.direction.set(0, 0, -1).applyMatrix4(m);
    const objs = [];
    if (this.vrPanel && this.vrPanel.mesh.visible) objs.push(this.vrPanel.mesh);
    if (this.pickEnabled) objs.push(...this.getHits());
    const h = this.ray.intersectObjects(objs, false)[0]; if (!h) return;
    if (h.object.userData.panel) { const b = h.object.userData.panel.hit(h.uv); if (b && this.onVRButton) this.onVRButton(b.id); }
    else if (h.object.userData.avatarId && this.onPick) this.onPick(h.object.userData.avatarId);
  }

  // ---------------- laço principal
  resize() {
    const w = innerWidth, h = innerHeight; this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 74 : 62; this.camera.updateProjectionMatrix();
  }
  updateAudience(t, cheer) {
    const m4 = new THREE.Matrix4();
    this.aud.forEach((s, i) => {
      const b = s.occ ? Math.abs(Math.sin(t * s.sp + s.ph)) * 0.35 * cheer : 0;
      if (s.occ) { m4.makeTranslation(s.x, s.y + 0.95 + b, s.z + 0.05); this.heads.setMatrixAt(i, m4); m4.makeTranslation(s.x, s.y + 0.55 + b * 0.6, s.z + 0.05); this.bodies.setMatrixAt(i, m4); }
      else { m4.makeScale(0, 0, 0); this.heads.setMatrixAt(i, m4); this.bodies.setMatrixAt(i, m4); }
    });
    this.heads.instanceMatrix.needsUpdate = true; this.bodies.instanceMatrix.needsUpdate = true;
    if (this.heads.instanceColor) { this.heads.instanceColor.needsUpdate = true; this.bodies.instanceColor.needsUpdate = true; }
  }
  updateLocal(dt) {
    const a = this.avatars.get(this.local); if (!a || !this.controls) return;
    let ix = 0, iy = 0, yaw = this.yaw;
    if (this.inVR) {
      const s = this.renderer.xr.getSession(); const d = new THREE.Vector3(); this.camera.getWorldDirection(d); yaw = Math.atan2(-d.x, -d.z);
      if (s) for (const src of s.inputSources) {
        const gp = src.gamepad; if (!gp) continue; const ax = gp.axes, x = ax[2] ?? ax[0] ?? 0, y = ax[3] ?? ax[1] ?? 0;
        if (src.handedness === 'left') { ix = Math.abs(x) > 0.15 ? x : 0; iy = Math.abs(y) > 0.15 ? -y : 0; }
        else if (src.handedness === 'right') { if (Math.abs(x) > 0.7 && !this.snapLock) { this.dolly.rotation.y -= Math.sign(x) * (Math.PI / 6); this.snapLock = true; } else if (Math.abs(x) < 0.3) this.snapLock = false; }
      }
    } else {
      const k = this.keys;
      ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + this.joy.x;
      iy = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0) - this.joy.y;
    }
    let wx = 0, wz = 0; const m = Math.min(1, Math.hypot(ix, iy)), speed = 6.2;
    if (m > 0.1) {
      this.walkTarget = null;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      let dx = fx * iy + rx * ix, dz = fz * iy + rz * ix; const l = Math.hypot(dx, dz) || 1; wx = (dx / l) * m * speed; wz = (dz / l) * m * speed;
    } else if (this.walkTarget) {
      const dx = this.walkTarget[0] - a.x, dz = this.walkTarget[1] - a.z, d = Math.hypot(dx, dz);
      if (d < 0.2) this.walkTarget = null; else { wx = (dx / d) * speed; wz = (dz / d) * speed; }
    }
    if (wx || wz) {
      const [nx, nz] = clampPos(a.x + wx * dt, a.z + wz * dt); a.x = a.tx = nx; a.z = a.tz = nz; a.try = Math.atan2(wx, wz);
    } else if (this.inVR) a.try = yaw + Math.PI;
    if (this.inVR) { this.dolly.position.set(a.x, a.y, a.z); }
  }
  updateCamera(dt, t) {
    if (this.inVR) return;
    const cam = this.camera, a = this.avatars.get(this.local);
    let mode = this.mode; if (mode === 'follow' && !a) mode = 'tv';
    if (mode === 'orbit') {
      const ang = t * 0.12; cam.position.set(Math.sin(ang) * 14, 6.5 + Math.sin(t * 0.2), 17 + Math.cos(ang) * 3); cam.lookAt(0, 3.4, -5); this.camPos.copy(cam.position);
    } else if (mode === 'tv') {
      cam.position.set(Math.sin(t * 0.15) * 2.5, 6.4, 19); cam.lookAt(0, 3.4, -6);
    } else if (mode === 'podium') {
      cam.position.set(Math.sin(t * 0.3) * 3, 3.6, 9.5); cam.lookAt(0, 2.4, -4);
    } else {
      const k = 1 - Math.exp(-dt * 7), tgt = new THREE.Vector3(a.x, a.y + 1.7, a.z), cp = Math.cos(this.pitch);
      const des = new THREE.Vector3(tgt.x + Math.sin(this.yaw) * cp * this.dist, tgt.y + Math.sin(this.pitch) * this.dist, tgt.z + Math.cos(this.yaw) * cp * this.dist);
      des.x = Math.max(-14, Math.min(14, des.x)); des.z = Math.min(22, des.z); des.y = Math.max(0.8, des.y);
      this.camPos.lerp(des, k); cam.position.copy(this.camPos); cam.lookAt(tgt);
    }
  }
  tick(time) {
    const t = time / 1000, dt = Math.min(0.05, this.last ? t - this.last : 0.016); this.last = t;
    this.updateLocal(dt);
    for (const a of this.avatars.values()) a.update(dt, t);
    this.updateCamera(dt, t);
    // cortinas
    this.curtainV += (this.curtainT - this.curtainV) * (1 - Math.exp(-dt * 2.2));
    const sx = 1 - this.curtainV * 0.9; this.curL.scale.x = this.curR.scale.x = Math.max(0.1, sx);
    // plateia e feixes
    this.cheerLevel = Math.max(0, this.cheerLevel - dt * 0.35);
    if (this.cheerLevel > 0.01 || this.lastCheer) { this.updateAudience(t, this.cheerLevel); this.lastCheer = this.cheerLevel > 0.01; }
    this.beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.5 + i * 2) * 0.18; b.rotation.x = Math.cos(t * 0.4 + i) * 0.1; });
    // plataformas
    if (this.padReveal !== null && this.padReveal !== undefined && this.pads[this.padReveal]) { const g = this.pads[this.padReveal]; g.userData.bx.material.emissiveIntensity = 0.6 + Math.sin(t * 8) * 0.3; }
    // confete
    if (this.conf.t > 0) {
      this.conf.t -= dt; const p = this.conf.pts.geometry.attributes.position.array, v = this.conf.vel;
      for (let i = 0; i < this.conf.N; i++) { p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt; if (p[i * 3 + 1] < 0.7) { p[i * 3 + 1] = 0.7; v[i * 3 + 1] = 0; v[i * 3] = 0; v[i * 3 + 2] = 0; } }
      this.conf.pts.geometry.attributes.position.needsUpdate = true; if (this.conf.t <= 0) this.conf.pts.visible = false;
    }
    // telão (no máximo ~8 vezes por segundo)
    this.telAcc += dt;
    if (this.telDirty || (this.telState.bar !== undefined && this.telState.bar !== null && this.telAcc > 0.12)) { this.telAcc = 0; this.drawTelao(); }
    this.renderer.render(this.scene, this.camera);
  }
}
