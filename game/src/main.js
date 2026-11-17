import { CONFIG } from './config.js';
import { createWorld, startGame, startWave, updateWorld, placeSelected, upgradeSelected, sellSelected } from './world.js';
import { applyShot } from './shots.js';
import { drawGame, drawTitle, drawPaused, drawVictory, drawGameOver } from './render.js';
import { createInput } from './input.js';
import { ensureAudio, toggleMuted } from './audio.js';
import { TOWER_ORDER } from './towers.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.W;
canvas.height = CONFIG.H     ;
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;
const world = createWorld(seed);
world.input = createInput(canvas);
if (shot) {
  applyShot(world, shot, seed);
  if (shot === 'play') {
    updateWorld(world, 1 / 60);
    updateWorld(world, 1 / 60);
    updateWorld(world, 1 / 60);
  }
}

function insideRect(mx, my, r) {
  return !!r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

world.input.onKey = (code) => {
  ensureAudio(world.audio);
  if (code === 'Space') {
    if (world.state === 'title' || world.state === 'victory' || world.state === 'gameover') startGame(world);
    else if (world.state === 'playing' && !world.waveActive) startWave(world);
    else if (world.state === 'paused') world.state = 'playing';
  } else if (code === 'Escape' || code === 'KeyP') {
    if (world.state === 'playing') world.state = 'paused';
    else if (world.state === 'paused') world.state = 'playing';
  } else if (code === 'KeyR') {
    startGame(world);
  } else if (code === 'KeyM') {
    toggleMuted(world.audio);
  } else if (code.startsWith('Digit')) {
    const n = Number(code.slice(5));
    if (n >= 1 && n <= 5) {
      world.selectedType = TOWER_ORDER[n - 1];
      world.selected = null;
    }
  }
};

world.input.onClick = () => {
  ensureAudio(world.audio);
  if (world.state === 'title' || world.state === 'victory' || world.state === 'gameover') {
    startGame(world);
    return;
  }
  if (world.state === 'paused') {
    world.state = 'playing';
    return;
  }
  if (world.state !== 'playing') return;
  const cell = world.input.mouseCell;
  if (!cell) return;
  const mx = world.input.mouseX;
  const my = world.input.mouseY;
  if (world.selected && insideRect(mx, my, world.ui.upgradeRect)) {
    upgradeSelected(world);
    return;
  }
  if (world.selected && insideRect(mx, my, world.ui.sellRect)) {
    sellSelected(world);
    return;
  }
  const towerAt = world.towers.find((t) => t.col === cell.col && t.row === cell.row);
  if (towerAt) {
    world.selected = towerAt;
  } else {
    world.selected = null;
    placeSelected(world);
  }
};

function fit() {
  const s = Math.min(window.innerWidth / CONFIG.W, window.innerHeight / CONFIG.H);
  canvas.style.width = CONFIG.W * s + 'px';
  canvas.style.height = CONFIG.H * s + 'px';
  canvas.style.left = (window.innerWidth - CONFIG.W * s) / 2 + 'px';
  canvas.style.top = (window.innerHeight - CONFIG.H * s) / 2 + 'px';
}
window.addEventListener('resize', fit);
fit();

function statusText(w) {
  if (w.state === 'title') return 'Neon Bastion. Press Space to start.';
  if (w.state === 'playing') return 'Wave ' + w.wave + ' of 11. Score ' + w.eco.score + '. Lives ' + w.eco.lives + '. Credits ' + w.eco.credits + '.';
  if (w.state === 'paused') return 'Paused.';
  if (w.state === 'victory') return 'Victory! Final score ' + w.eco.score + '.';
  return 'Game over. Final score ' + w.eco.score + '. Press R to try again.';
}

let lastStatus = '';
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!shot) {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      updateWorld(world, STEP);
      acc -= STEP;
      n++;
    }
    if (n === 5) acc = 0;
  }
  ctx.save();
  ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  if (world.state === 'title') drawTitle(ctx, world, world.titleTime);
  else if (world.state === 'paused') {
    drawGame(ctx, world);
    drawPaused(ctx, world);
  } else if (world.state === 'victory') {
    drawGame(ctx, world);
    drawVictory(ctx, world);
  } else if (world.state === 'gameover') {
    drawGame(ctx, world);
    drawGameOver(ctx, world);
  } else drawGame(ctx, world);
  ctx.restore();
  const status = document.getElementById('status');
  const text = statusText(world);
  if (text !== lastStatus) {
    status.textContent = text;
    lastStatus = text;
  }
}
requestAnimationFrame(frame);

window.__neonBastion = { world };