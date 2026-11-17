// NEON BASTION — tower creation, stats, placement, and firing logic.
import { CONFIG } from './config.js';
import { cellCenter, isBuildable } from './grid.js';
import { damageEnemy, applySlow } from './enemies.js';

export const TOWER_ORDER = CONFIG.TOWER_ORDER;

export function createTower(type, col, row) {
  const { x, y } = cellCenter(col, row);
  return {
    type,
    col,
    row,
    x,
    y,
    level: 1,
    invested: CONFIG.TOWERS[type].cost,
    cooldown: 0,
    angle: 0,
    kills: 0,
    flash: 0,
    recoil: 0,
  };
}

export function towerStats(t) {
  const def = CONFIG.TOWERS[t.type];
  const dmgMult = Math.pow(CONFIG.UPGRADE_DMG_MULT, t.level - 1);
  const rangeMult = Math.pow(CONFIG.UPGRADE_RANGE_MULT, t.level - 1);
  return {
    damage: def.damage * dmgMult,
    range: def.range * rangeMult,
    rate: def.rate,
    slow: def.slow || 0,
    slowSecs: def.slowSecs || 0,
    splash: def.splash || 0,
    chains: def.chains || 0,
    color: def.color,
    name: def.name,
  };
}

export function towerCost(type) {
  return CONFIG.TOWERS[type].cost;
}

export function upgradeCost(t) {
  return Math.round(CONFIG.TOWERS[t.type].cost * CONFIG.UPGRADE_COST_MULT * t.level);
}

export function sellValue(t) {
  return Math.floor(t.invested * CONFIG.SELL_RATE);
}

export function isOccupied(towers, col, row) {
  return towers.some(t => t.col === col && t.row === row);
}

export function placeTower(towers, type, col, row) {
  if (!isBuildable(col, row)) return null;
  if (isOccupied(towers, col, row)) return null;
  const t = createTower(type, col, row);
  towers.push(t);
  return t;
}

function onKill(enemy, t, fx) {
  t.kills++;
  if (!fx) return;
  if (fx.explosion) fx.explosion(enemy.x, enemy.y, enemy.color, 14);
  if (fx.addText) fx.addText(enemy.x, enemy.y - 14, '+' + enemy.reward, '#ffd23d');
  if (typeof fx.onKill === 'function') fx.onKill(enemy);
}

function fireTower(t, stats, target, enemies, now, fx) {
  if (t.type === 'pulse') {
    if (fx && fx.projectiles) {
      fx.projectiles.push({
        x: t.x,
        y: t.y,
        tx: target.x,
        ty: target.y,
        speed: 520,
        damage: stats.damage,
        color: stats.color,
        radius: 4,
        splash: 0,
        kind: 'pulse',
      });
    }
  } else if (t.type === 'frost') {
    const killed = damageEnemy(target, stats.damage);
    applySlow(target, stats.slow, stats.slowSecs, now);
    if (fx && fx.addParticles) {
      fx.addParticles(target.x, target.y, { count: 6, color: '#6fb7ff', speed: 60, size: 3, life: 0.4 });
    }
    if (killed) onKill(target, t, fx);
  } else if (t.type === 'rail') {
    const killed = damageEnemy(target, stats.damage);
    if (fx) {
      if (fx.addBeam) fx.addBeam(t.x, t.y, target.x, target.y, stats.color, 0.12);
      if (fx.addParticles) fx.addParticles(target.x, target.y, { count: 8, color: stats.color, speed: 120, size: 3, life: 0.5 });
      if (fx.addShake) fx.addShake(2);
    }
    if (killed) onKill(target, t, fx);
  } else if (t.type === 'mortar') {
    if (fx && fx.projectiles) {
      fx.projectiles.push({
        x: t.x,
        y: t.y,
        tx: target.x,
        ty: target.y,
        speed: 300,
        damage: stats.damage,
        splash: stats.splash,
        color: stats.color,
        radius: 6,
        kind: 'mortar',
        lobbed: true,
      });
    }
  } else if (t.type === 'tesla') {
    const hitList = [target];
    let prev = target;
    for (let i = 0; i < stats.chains - 1; i++) {
      let next = null;
      let bestD = 90 * 90;
      for (const e of enemies) {
        if (!e.alive || hitList.includes(e)) continue;
        const dx = e.x - prev.x;
        const dy = e.y - prev.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= bestD) {
          bestD = d2;
          next = e;
        }
      }
      if (!next) break;
      hitList.push(next);
      prev = next;
    }
    for (let i = 0; i < hitList.length; i++) {
      const e = hitList[i];
      const killed = damageEnemy(e, stats.damage);
      if (fx) {
        const from = i === 0 ? t : hitList[i - 1];
        if (fx.addBeam) fx.addBeam(from.x, from.y, e.x, e.y, stats.color, 0.12);
        if (fx.addParticles) fx.addParticles(e.x, e.y, { count: 4, color: stats.color, speed: 80, size: 3, life: 0.35 });
      }
      if (killed) onKill(e, t, fx);
    }
  }
}

export function updateTowers(towers, enemies, dt, now, fx) {
  const alive = enemies.filter(e => e.alive);
  for (const t of towers) {
    const stats = towerStats(t);
    let target = null;
    let best = -1;
    for (const e of alive) {
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= stats.range * stats.range && e.dist > best) {
        best = e.dist;
        target = e;
      }
    }
    t.cooldown -= dt;
    if (target && t.cooldown <= 0) {
      t.cooldown = 1 / stats.rate;
      t.flash = 0.06;
      t.recoil = 4;
      t.angle = Math.atan2(target.y - t.y, target.x - t.x);
      fireTower(t, stats, target, alive, now, fx);
    }
    if (t.flash > 0) t.flash = Math.max(0, t.flash - dt);
    if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt);
  }
}