// NEON BASTION — deterministic screenshot scenes. No input, no audio, no DOM.
import { createWorld, startGame } from './world.js';
import { createTower, updateTowers } from './towers.js';
import { createEnemy, updateEnemy } from './enemies.js';
import { explosion, addText } from './particles.js';

const TOWER_DEFS = [
  ['pulse', 5, 2, 2],
  ['frost', 10, 3, 1],
  ['rail', 14, 2, 2],
  ['mortar', 8, 6, 1],
  ['tesla', 12, 5, 1],
];

const SPAWN_DEFS = [
  ['scout', 300],
  ['scout', 520],
  ['runner', 700],
  ['runner', 900],
  ['tank', 150],
  ['swarm', 1100],
  ['swarm', 1250],
];

function playShot(world) {
  startGame(world);
  for (const [type, col, row, level] of TOWER_DEFS) {
    const t = createTower(type, col, row);
    t.level = level;
    t.invested = 0;
    world.towers.push(t);
  }
  world.eco.credits = 230;
  world.eco.score = 1250;
  world.eco.lives = 17;
  world.stats.kills = 41;
  world.wave = 4;
  world.waveActive = true;
  world.betweenTimer = 0;
  world.spawnQueue = [];
  let scout = null;
  for (const [type, dist] of SPAWN_DEFS) {
    const e = createEnemy(type, 4, world.rng);
    e.dist = dist;
    updateEnemy(e, 0, 2.0);
    world.enemies.push(e);
    if (!scout && type === 'scout') scout = e;
  }
  const railTower = world.towers.find(t => t.type === 'rail');
  if (scout) {
    explosion(world.fx, scout.x, scout.y, scout.color, 12);
    addText(world.fx, scout.x, scout.y - 16, '+8', '#ffd23d');
  }
  if (railTower) addText(world.fx, railTower.x, railTower.y - 40, '55', '#ffffff');
  for (const t of world.towers) t.cooldown = 0;
  updateTowers(world.towers, world.enemies, 0.05, 2.0, world.fx);
  world.state = 'playing';
  world.time = 2.0;
  world.banner = null;
  return world;
}

function endShot(world) {
  startGame(world);
  world.state = 'gameover';
  world.banner = null;
  world.eco.score = 1840;
  world.eco.lives = 0;
  world.stats.kills = 73;
  world.wave = 6;
  world.best = Math.max(world.best, 1840);
  return world;
}

function victoryShot(world) {
  startGame(world);
  world.state = 'victory';
  world.banner = null;
  world.eco.score = 5200;
  world.wave = 11;
  world.stats.kills = 210;
  world.eco.lives = 12;
  return world;
}

export function applyShot(world, shot, seed) {
  if (!world) world = createWorld(seed);
  if (shot === 'play') return playShot(world);
  if (shot === 'end') return endShot(world);
  if (shot === 'victory') return victoryShot(world);
  world.state = 'title';
  world.titleTime = 2.0;
  world.time = 2.0;
  return world;
}