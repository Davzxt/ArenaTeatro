// Geometria do palco, compartilhada entre cliente e servidor.
// Convenção: a plateia fica em +z olhando para -z. O ator, voltado para a plateia, olha para +z.
// Logo, a DIREITA do ator é o lado -x e a ESQUERDA do ator é o lado +x.
export const STAGE = { xMin: -14, xMax: 14, zMin: -12, zMax: 5.4, front: 1, height: 0.6 };

export const floorY = (z) => (z < STAGE.front ? STAGE.height : 0);

export function clampPos(x, z) {
  return [Math.max(STAGE.xMin, Math.min(STAGE.xMax, x)), Math.max(STAGE.zMin, Math.min(STAGE.zMax, z))];
}

// Ponto de nascimento no corredor em frente ao palco (fora de qualquer zona).
export function spawnPoint(i) {
  return [((i * 1.73) % 18) - 9, 1.35 + (i % 3) * 0.35];
}

// Plataformas de resposta (A-D, ou Verdadeiro/Falso)
export function padLayout(n) {
  if (n === 2) return [{ x: -5, z: -6, hx: 4.6, hz: 3 }, { x: 5, z: -6, hx: 4.6, hz: 3 }];
  return [-7.5, -2.5, 2.5, 7.5].map((x) => ({ x, z: -6, hx: 2.4, hz: 3 }));
}
export function padAt(n, x, z) {
  const L = padLayout(n);
  for (let i = 0; i < L.length; i++) {
    if (Math.abs(x - L[i].x) <= L[i].hx && Math.abs(z - L[i].z) <= L[i].hz) return i;
  }
  return null;
}

// Zonas do palco (visão do ATOR). "Alta" = fundo (upstage), "Baixa" = frente (downstage).
const COLS = [
  { id: 'D', name: 'Direita', x0: -10, x1: -3.33 },
  { id: 'C', name: 'Centro', x0: -3.33, x1: 3.33 },
  { id: 'E', name: 'Esquerda', x0: 3.33, x1: 10 },
];
const ROWS = [
  { id: 'A', name: 'Alta', z0: -12, z1: -7.7 },
  { id: 'M', name: 'Média', z0: -7.7, z1: -3.3 },
  { id: 'B', name: 'Baixa', z0: -3.3, z1: 1 },
];
export const ZONES = [];
for (const r of ROWS) {
  for (const c of COLS) {
    const name = c.id === 'C' && r.id === 'M' ? 'Centro' : `${c.name} ${r.name}`;
    ZONES.push({ id: c.id + r.id, name, x0: c.x0, x1: c.x1, z0: r.z0, z1: r.z1, cx: (c.x0 + c.x1) / 2, cz: (r.z0 + r.z1) / 2, stage: true });
  }
}
ZONES.push({ id: 'XD', name: 'Coxia Direita', x0: -14, x1: -10, z0: -12, z1: 1, cx: -12, cz: -5 });
ZONES.push({ id: 'XE', name: 'Coxia Esquerda', x0: 10, x1: 14, z0: -12, z1: 1, cx: 12, cz: -5 });
ZONES.push({ id: 'PL', name: 'Plateia', x0: -14, x1: 14, z0: 2.5, z1: 5.5, cx: 0, cz: 4.2 });

export function zoneAt(x, z) {
  for (const q of ZONES) if (x >= q.x0 && x < q.x1 && z >= q.z0 && z < q.z1) return q;
  return null;
}
