// Efeitos sonoros sintetizados (sem arquivos de áudio).
let ctx = null, muted = false;
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
function tone(f, d, type = 'sine', v = 0.12, when = 0) {
  if (muted) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  } catch {}
}
function applause(d = 2.2) {
  if (muted) return;
  try {
    const c = ac(), n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const t = i / c.sampleRate;
      data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.02 ? 1 : 0.25) * Math.min(1, t * 6) * Math.max(0, 1 - t / d);
    }
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.5;
    const g = c.createGain(); g.gain.value = 0.35;
    s.connect(f).connect(g).connect(c.destination); s.start();
  } catch {}
}
export const sfx = {
  toggle() { muted = !muted; return muted; },
  unlock() { try { ac(); } catch {} },
  play(n) {
    if (n === 'ok') { tone(660, 0.14, 'triangle', 0.15); tone(990, 0.22, 'triangle', 0.15, 0.1); }
    else if (n === 'bad') { tone(180, 0.35, 'sawtooth', 0.1); tone(140, 0.4, 'sawtooth', 0.1, 0.12); }
    else if (n === 'tick') tone(1100, 0.04, 'square', 0.05);
    else if (n === 'intro') { tone(196, 0.9, 'sine', 0.16); tone(392, 0.7, 'sine', 0.08, 0.02); tone(587, 0.5, 'triangle', 0.06, 0.25); }
    else if (n === 'pop') tone(520, 0.08, 'sine', 0.1);
    else if (n === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.13, i * 0.14)); applause(); }
    else if (n === 'applause') applause(1.6);
  },
};
