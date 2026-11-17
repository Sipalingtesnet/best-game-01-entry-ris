// NEON BASTION — credits/score/lives economy. Pure logic, no DOM, no canvas.
import { CONFIG } from './config.js';
import { waveReward } from './waves.js';

export function createEconomy() {
  return {
    credits: CONFIG.START_CREDITS,
    score: 0,
    lives: CONFIG.START_LIVES,
    kills: 0,
    wave: 1,
    earned: 0,
  };
}

export function canAfford(eco, cost) {
  return eco.credits >= cost;
}

export function spend(eco, cost) {
  if (!canAfford(eco, cost)) return false;
  eco.credits -= cost;
  return true;
}

export function addKill(eco, enemy) {
  eco.kills += 1;
  eco.credits += enemy.reward;
  eco.score += enemy.score;
  eco.earned += enemy.reward;
  return { credits: eco.credits, score: eco.score };
}

export function waveClearBonus(eco, wave) {
  const bonus = waveReward(wave);
  eco.credits += bonus;
  eco.earned += bonus;
  return { credits: eco.credits, score: eco.score };
}

export function loseLife(eco, n) {
  eco.lives -= n;
  return eco.lives;
}