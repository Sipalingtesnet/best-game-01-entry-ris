// NEON BASTION — enemy data and movement along the path. Rendering lives elsewhere.
// Time convention: dt and now are in seconds.
import { CONFIG } from './config.js';
import { pointAlongPath, pathTotalLength } from './grid.js';

export const ENEMY_TYPES = CONFIG.ENEMIES;

const TOTAL = pathTotalLength();

export function createEnemy(type, wave, rng) {
  const def = ENEMY_TYPES[type];
  const hp = Math.round(def.hp * Math.pow(CONFIG.WAVE_HP_MULT, wave - 1));
  return {
    type,
    hp,
    maxHp: hp,
    speed: def.speed,
    baseSpeed: def.speed,
    reward: def.reward,
    score: def.score,
    radius: def.radius,
    color: def.color,
    dist: 0,
    slowUntil: 0,
    slowFactor: 1,
    alive: true,
    hitFlash: 0,
    wobble: rng.range(0, Math.PI * 2),
  };
}

export function updateEnemy(e, dt, now) {
  if (now >= e.slowUntil) e.slowFactor = 1;
  e.dist += e.speed * e.slowFactor * dt;
  if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
  const pos = pointAlongPath(e.dist);
  e.x = pos.x;
  e.y = pos.y;
  e.angle = pos.angle;
  return e.dist >= TOTAL ? 'reached' : 'alive';
}

export function applySlow(e, factor, secs, now) {
  e.slowFactor = factor;
  e.slowUntil = now + secs;
}

export function damageEnemy(e, dmg) {
  e.hp -= dmg;
  e.hitFlash = 0.08;
  if (e.hp <= 0) {
    e.alive = false;
    return true;
  }
  return false;
}