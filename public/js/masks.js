// Máscaras desenhadas em canvas (usadas no avatar 3D e nos seletores).
export const MASKS = [
  ['comedia', 'Comédia'], ['tragedia', 'Tragédia'], ['arlequim', 'Arlequim'],
  ['veneziana', 'Veneziana'], ['no', 'Nô'], ['palhaco', 'Palhaço'],
];

export function drawMask(ctx, w, h, style) {
  const base = { comedia: '#f3c94b', tragedia: '#8fa8cc', arlequim: '#1d1b22', veneziana: '#f7f0e4', no: '#f5f2ea', palhaco: '#fffaf0' }[style] || '#f3c94b';
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const ex = [w * 0.3, w * 0.7], ey = h * 0.4;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const dark = '#1a1218';
  const arc = (x, y, r, a0, a1, lw, col) => { ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); };
  const dot = (x, y, r, col) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); };
  if (style === 'comedia') {
    ex.forEach((x) => arc(x, ey + 6, w * 0.09, Math.PI, 0, w * 0.045, dark));
    arc(w / 2, h * 0.58, w * 0.26, 0.15, Math.PI - 0.15, w * 0.05, dark);
    dot(w * 0.18, h * 0.6, w * 0.06, 'rgba(230,90,70,.55)'); dot(w * 0.82, h * 0.6, w * 0.06, 'rgba(230,90,70,.55)');
  } else if (style === 'tragedia') {
    ex.forEach((x, i) => {
      arc(x, ey + 10, w * 0.08, 0, Math.PI, w * 0.04, dark);
      const s = i ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(x - w * 0.1 * s, ey - h * 0.1); ctx.lineTo(x + w * 0.1 * s, ey - h * 0.04);
      ctx.lineWidth = w * 0.035; ctx.strokeStyle = dark; ctx.stroke();
    });
    arc(w / 2, h * 0.82, w * 0.22, Math.PI + 0.25, -0.25, w * 0.05, dark);
    dot(w * 0.3, h * 0.62, w * 0.02, '#4f6fa3');
  } else if (style === 'arlequim') {
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, w, h);
    for (let i = -2; i < 8; i++) for (let j = -2; j < 8; j++) {
      if ((i + j) % 2) continue;
      ctx.fillStyle = '#1d1b22'; ctx.beginPath();
      const x = (i * w) / 5, y = (j * h) / 5;
      ctx.moveTo(x, y + h / 10); ctx.lineTo(x + w / 10, y); ctx.lineTo(x + w / 5, y + h / 10); ctx.lineTo(x + w / 10, y + h / 5); ctx.fill();
    }
    ex.forEach((x) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, ey, w * 0.12, h * 0.055, 0, 0, 7); ctx.fill(); dot(x, ey, w * 0.03, dark); });
    arc(w / 2, h * 0.66, w * 0.14, 0.2, Math.PI - 0.2, w * 0.04, '#ffe08a');
  } else if (style === 'veneziana') {
    ex.forEach((x) => { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(x, ey, w * 0.11, h * 0.07, x < w / 2 ? -0.25 : 0.25, 0, 7); ctx.fill(); });
    for (let k = 0; k < 3; k++) arc(w * 0.5, h * 0.2, w * (0.12 + k * 0.07), Math.PI * 1.1, Math.PI * 1.9, 3, '#d4a017');
    arc(w * 0.5, h * 0.72, w * 0.1, 0.1, Math.PI - 0.1, w * 0.05, '#c0392b');
    dot(w * 0.5, h * 0.52, w * 0.025, '#d4a017');
  } else if (style === 'no') {
    ex.forEach((x) => {
      ctx.beginPath(); ctx.moveTo(x - w * 0.1, ey + 2); ctx.quadraticCurveTo(x, ey - h * 0.05, x + w * 0.1, ey + 2);
      ctx.lineWidth = w * 0.03; ctx.strokeStyle = dark; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w * 0.11, ey - h * 0.12); ctx.quadraticCurveTo(x, ey - h * 0.17, x + w * 0.11, ey - h * 0.1);
      ctx.lineWidth = w * 0.025; ctx.stroke();
    });
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(w / 2, h * 0.72, w * 0.07, h * 0.025, 0, 0, 7); ctx.fill();
    dot(w * 0.2, h * 0.58, w * 0.05, 'rgba(230,120,120,.35)'); dot(w * 0.8, h * 0.58, w * 0.05, 'rgba(230,120,120,.35)');
  } else if (style === 'palhaco') {
    ex.forEach((x) => { dot(x, ey, w * 0.06, dark); arc(x, ey - h * 0.12, w * 0.1, Math.PI * 1.1, Math.PI * 1.9, w * 0.035, '#2e6fd8'); });
    dot(w / 2, h * 0.55, w * 0.1, '#e0312b');
    arc(w / 2, h * 0.62, w * 0.25, 0.25, Math.PI - 0.25, w * 0.05, '#e0312b');
  }
}

export function maskDataURL(style, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); drawMask(x, size, size, style);
  return c.toDataURL();
}
