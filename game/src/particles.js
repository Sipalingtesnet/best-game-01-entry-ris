// NEON BASTION — particle effects, floating text, beams, projectiles, and screen shake.
export function createFx() {
  return {
    particles: [],
    texts: [],
    beams: [],
    projectiles: [],
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    onKill: null,
  };
}

export function addParticles(fx, x, y, opts) {
  const o = opts || {};
  const count = o.count || 8;
  const color = o.color || '#ffffff';
  const speed = o.speed || 120;
  const size = o.size || 3;
  const life = o.life || 0.6;
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = speed * (0.4 + Math.random() * 0.8);
    fx.particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life,
      maxLife: life,
      size,
      color,
    });
  }
}

export function explosion(fx, x, y, color, n = 16) {
  addParticles(fx, x, y, { count: n, color, speed: 160, size: 3, life: 0.5 });
  fx.particles.push({ x, y, ring: true, life: 0.35, maxLife: 0.35, size: 6, color });
}

export function addText(fx, x, y, str, color = '#ffffff') {
  fx.texts.push({ x, y, str, color, life: 1.1, maxLife: 1.1 });
}

export function addBeam(fx, x1, y1, x2, y2, color, life = 0.12) {
  fx.beams.push({ x1, y1, x2, y2, color, life, maxLife: life });
}

export function addShake(fx, amount) {
  fx.shake = Math.min(fx.shake + amount, 14);
}

export function updateFx(fx, dt) {
  for (let i = fx.particles.length - 1; i >= 0; i--) {
    const p = fx.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.12, dt);
    p.vy *= Math.pow(0.12, dt);
    p.life -= dt;
    if (p.ring) p.size += 90 * dt;
    if (p.life <= 0) fx.particles.splice(i, 1);
  }
  for (let i = fx.texts.length - 1; i >= 0; i--) {
    const tx = fx.texts[i];
    tx.y -= 42 * dt;
    tx.life -= dt;
    if (tx.life <= 0) fx.texts.splice(i, 1);
  }
  for (let i = fx.beams.length - 1; i >= 0; i--) {
    fx.beams[i].life -= dt;
    if (fx.beams[i].life <= 0) fx.beams.splice(i, 1);
  }
  for (let i = fx.projectiles.length - 1; i >= 0; i--) {
    const p = fx.projectiles[i];
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d <= 6) {
      p.arrived = true;
      p.hitX = p.x;
      p.hitY = p.y;
    } else {
      const step = p.speed * dt;
      if (step >= d) {
        p.x = p.tx;
        p.y = p.ty;
        p.arrived = true;
        p.hitX = p.x;
        p.hitY = p.y;
      } else {
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
      }
    }
  }
  fx.shake *= Math.pow(0.002, dt);
  fx.shakeX = (Math.random() * 2 - 1) * fx.shake;
  fx.shakeY = (Math.random() * 2 - 1) * fx.shake;
}

export function resolveProjectiles(fx, enemies) {
  const hits = [];
  const alive = enemies.filter(e => e.alive);
  for (let i = fx.projectiles.length - 1; i >= 0; i--) {
    const p = fx.projectiles[i];
    if (!p.arrived) continue;
    let hitEnemies = [];
    if (p.kind === 'mortar' || p.splash > 0) {
      const r = p.splash || 70;
      for (const e of alive) {
        if (Math.hypot(e.x - p.hitX, e.y - p.hitY) <= r) hitEnemies.push(e);
      }
    } else {
      let best = null;
      let bestD = 16 * 16;
      for (const e of alive) {
        const dx = e.x - p.hitX;
        const dy = e.y - p.hitY;
        const d2 = dx * dx + dy * dy;
        if (d2 <= bestD) {
          bestD = d2;
          best = e;
        }
      }
      if (best) hitEnemies = [best];
    }
    hits.push({ proj: p, hitEnemies });
    fx.projectiles.splice(i, 1);
  }
  return hits;
}