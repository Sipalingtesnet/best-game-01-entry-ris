// NEON BASTION — game state orchestration: waves, spawning, combat resolution, economy hooks.
import { CONFIG } from './config.js';
import { RNG } from './random.js';
import { isBuildable, pointAlongPath, cellCenter, CORE_CELL } from './grid.js';
import { createEnemy, updateEnemy, damageEnemy } from './enemies.js';
import { WAVES, waveCount, waveReward, isBossWave } from './waves.js';
import { createEconomy, canAfford, spend, addKill, waveClearBonus, loseLife } from './economy.js';
import { createTower, towerStats, towerCost, upgradeCost, sellValue, isOccupied, placeTower, updateTowers } from './towers.js';
import { createFx, addParticles, explosion, addText, addShake, updateFx, resolveProjectiles } from './particles.js';
import { createAudio, shoot, explosion as explosionSfx, coin, leak, horn, victory as victorySfx, defeat as defeatSfx, click as clickSfx } from './audio.js';

function loadBest() {
  let best = 0;
  try {
    const v = localStorage.getItem('neon-bastion-best');
    if (v) best = parseInt(v, 10) || 0;
  } catch (e) {
    best = 0;
  }
  return best;
}

export function createWorld(seed = 1) {
  return {
    seed,
    rng: new RNG(seed),
    state: 'title',
    eco: createEconomy(),
    towers: [],
    enemies: [],
    spawnQueue: [],
    wave: 0,
    waveActive: false,
    betweenTimer: 0,
    spawnTimer: 0,
    banner: null,
    fx: createFx(),
    audio: createAudio(),
    input: null,
    selected: null,
    selectedType: 'pulse',
    time: 0,
    best: loadBest(),
    stats: { kills: 0 },
    ui: { upgradeRect: null, sellRect: null },
    invalidFlash: null,
    wantWave: false,
    titleTime: 0,
  };
}

export function startGame(world) {
  world.eco = createEconomy();
  world.towers = [];
  world.enemies = [];
  world.spawnQueue = [];
  world.wave = 0;
  world.waveActive = false;
  world.betweenTimer = 2.5;
  world.state = 'playing';
  world.banner = { text: 'GET READY', sub: 'Place towers — first wave incoming', until: world.time + 2.5 };
  world.selected = null;
  world.stats = { kills: 0 };
  world.fx = createFx();
}

export function startWave(world) {
  if (world.waveActive || world.wave >= CONFIG.MAX_WAVE) return;
  world.wave++;
  const groups = WAVES[world.wave - 1].groups;
  let cursor = 0;
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      world.spawnQueue.push({ type: g.type, at: cursor + g.delay + i * g.interval });
    }
    cursor += g.delay + (g.count - 1) * g.interval;
  }
  world.waveActive = true;
  world.spawnTimer = 0;
  world.banner = {
    text: isBossWave(world.wave) ? 'BOSS WAVE' : 'WAVE ' + world.wave,
    sub: waveCount(world.wave) + ' drones incoming',
    until: world.time + 2.2,
  };
  horn(world.audio);
}

export function updateWorld(world, dt) {
  world.time += dt;
  updateFx(world.fx, dt);
  if (world.state === 'title') {
    world.titleTime += dt;
    world._emberT = (world._emberT || 0) + dt;
    if (world._emberT >= 0.15) {
      world._emberT -= 0.15;
      const pt = pointAlongPath(world.rng.range(0, 4800));
      addParticles(world.fx, pt.x, pt.y, { count: 1, color: '#37ffd0', speed: 14, size: 2, life: 2 });
    }
    return;
  }
  if (world.state !== 'playing') return;
  if (world.banner && world.time > world.banner.until) world.banner = null;
  if (!world.waveActive) {
    world.betweenTimer -= dt;
    if (world.betweenTimer <= 0) startWave(world);
    return;
  }
  world.spawnTimer += dt;
  while (world.spawnQueue.length && world.spawnQueue[0].at <= world.spawnTimer) {
    const entry = world.spawnQueue.shift();
    world.enemies.push(createEnemy(entry.type, world.wave, world.rng));
  }
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const e = world.enemies[i];
    const status = updateEnemy(e, dt, world.time);
    if (status === 'reached') {
      world.enemies.splice(i, 1);
      const n = e.type === 'boss' ? 5 : 1;
      loseLife(world.eco, n);
      const core = cellCenter(CORE_CELL.col, CORE_CELL.row);
      addText(world.fx, core.x, core.y, '-' + n + ' LIFE', '#ff5d5d');
      addShake(world.fx, 8);
      leak(world.audio);
      if (world.eco.lives <= 0) {
        gameOver(world);
        return;
      }
    }
  }
  world.fx.onKill = (enemy) => {
    addKill(world.eco, enemy);
    world.stats.kills++;
    coin(world.audio);
  };
  updateTowers(world.towers, world.enemies, dt, world.time, world.fx);
  const hits = resolveProjectiles(world.fx, world.enemies);
  for (const h of hits) {
    for (const enemy of h.hitEnemies) {
      if (damageEnemy(enemy, h.proj.damage)) {
        world.fx.onKill(enemy);
      }
    }
    if (h.proj.kind === 'mortar') {
      explosion(world.fx, h.proj.hitX, h.proj.hitY, h.proj.color, 10);
      explosionSfx(world.audio, false);
    }
  }
  world.enemies = world.enemies.filter(e => e.alive);
  if (world.waveActive && world.spawnQueue.length === 0 && world.enemies.length === 0) {
    world.waveActive = false;
    const bonus = waveClearBonus(world.eco, world.wave);
    world.eco.score += 50 * world.wave;
    if (world.wave >= CONFIG.MAX_WAVE) {
      victory(world);
    } else {
      world.betweenTimer = 4;
      world.banner = { text: 'WAVE CLEARED', sub: '+' + bonus.credits + ' credits bonus', until: world.time + 2.2 };
    }
  }
}

function saveBest(world) {
  if (world.eco.score > world.best) {
    world.best = world.eco.score;
    try {
      localStorage.setItem('neon-bastion-best', String(world.best));
    } catch (e) {
      /* no-op */
    }
  }
}

export function victory(world) {
  world.state = 'victory';
  saveBest(world);
  victorySfx(world.audio);
}

export function gameOver(world) {
  world.state = 'gameover';
  saveBest(world);
  defeatSfx(world.audio);
}

export function placeSelected(world) {
  const cell = world.input ? world.input.mouseCell : null;
  if (!cell) return false;
  if (!isBuildable(cell.col, cell.row) || isOccupied(world.towers, cell.col, cell.row)) {
    world.invalidFlash = { col: cell.col, row: cell.row, until: world.time + 0.35 };
    return false;
  }
  const cost = towerCost(world.selectedType);
  if (!canAfford(world.eco, cost)) {
    world.invalidFlash = { col: cell.col, row: cell.row, until: world.time + 0.35 };
    return false;
  }
  spend(world.eco, cost);
  const t = placeTower(world.towers, world.selectedType, cell.col, cell.row);
  if (!t) return false;
  clickSfx(world.audio);
  explosion(world.fx, t.x, t.y, CONFIG.TOWERS[world.selectedType].color, 8);
  return true;
}

export function selectTowerAt(world, cell) {
  if (!cell) {
    world.selected = null;
    return null;
  }
  const t = world.towers.find(tw => tw.col === cell.col && tw.row === cell.row);
  world.selected = t || null;
  return world.selected;
}

export function upgradeSelected(world) {
  if (!world.selected) return false;
  if (world.selected.level >= CONFIG.MAX_LEVEL) return false;
  const cost = upgradeCost(world.selected);
  if (!canAfford(world.eco, cost)) return false;
  spend(world.eco, cost);
  world.selected.level++;
  world.selected.invested += cost;
  clickSfx(world.audio);
  explosion(world.fx, world.selected.x, world.selected.y, '#ffd23d', 10);
  return true;
}

export function sellSelected(world) {
  if (!world.selected) return false;
  const v = sellValue(world.selected);
  world.eco.credits += v;
  const idx = world.towers.indexOf(world.selected);
  if (idx >= 0) world.towers.splice(idx, 1);
  addText(world.fx, world.selected.x, world.selected.y, '+' + v, '#ffd23d');
  coin(world.audio);
  world.selected = null;
  return true;
}