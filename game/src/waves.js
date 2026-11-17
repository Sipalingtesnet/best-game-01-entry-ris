// NEON BASTION — wave compositions for waves 1..11 (WAVES[wave - 1]).
import { CONFIG } from './config.js';

const WAVES = [
  // wave 1
  { groups: [{ type: 'scout', count: 8, interval: 0.7, delay: 0 }] },
  // wave 2
  { groups: [
    { type: 'scout', count: 10, interval: 0.7, delay: 0 },
    { type: 'runner', count: 4, interval: 0.5, delay: 3 },
  ] },
  // wave 3
  { groups: [
    { type: 'scout', count: 8, interval: 0.7, delay: 0 },
    { type: 'runner', count: 6, interval: 0.5, delay: 2.5 },
    { type: 'tank', count: 2, interval: 1.4, delay: 5 },
  ] },
  // wave 4
  { groups: [
    { type: 'scout', count: 12, interval: 0.7, delay: 0 },
    { type: 'runner', count: 8, interval: 0.5, delay: 3 },
    { type: 'tank', count: 3, interval: 1.4, delay: 6 },
  ] },
  // wave 5
  { groups: [
    { type: 'runner', count: 10, interval: 0.5, delay: 0 },
    { type: 'tank', count: 4, interval: 1.4, delay: 3 },
    { type: 'swarm', count: 8, interval: 0.35, delay: 6 },
  ] },
  // wave 6
  { groups: [
    { type: 'scout', count: 14, interval: 0.7, delay: 0 },
    { type: 'runner', count: 10, interval: 0.5, delay: 3 },
    { type: 'tank', count: 5, interval: 1.4, delay: 6 },
  ] },
  // wave 7
  { groups: [
    { type: 'swarm', count: 12, interval: 0.35, delay: 0 },
    { type: 'runner', count: 8, interval: 0.5, delay: 2 },
    { type: 'tank', count: 6, interval: 1.4, delay: 5 },
  ] },
  // wave 8
  { groups: [
    { type: 'scout', count: 16, interval: 0.7, delay: 0 },
    { type: 'swarm', count: 12, interval: 0.35, delay: 3 },
    { type: 'tank', count: 6, interval: 1.4, delay: 5.5 },
  ] },
  // wave 9
  { groups: [
    { type: 'tank', count: 10, interval: 1.4, delay: 0 },
    { type: 'runner', count: 14, interval: 0.5, delay: 5 },
    { type: 'swarm', count: 10, interval: 0.35, delay: 8 },
  ] },
  // wave 10
  { groups: [
    { type: 'scout', count: 20, interval: 0.7, delay: 0 },
    { type: 'swarm', count: 16, interval: 0.35, delay: 3 },
    { type: 'tank', count: 8, interval: 1.4, delay: 5 },
    { type: 'runner', count: 10, interval: 0.5, delay: 8 },
  ] },
  // wave 11 — boss + escort
  { groups: [
    { type: 'boss', count: 1, interval: 1, delay: 2 },
    { type: 'scout', count: 6, interval: 0.7, delay: 4 },
    { type: 'runner', count: 4, interval: 0.5, delay: 4.5 },
  ] },
];

export function waveCount(wave) {
  const w = WAVES[wave - 1];
  return w ? w.groups.reduce((n, g) => n + g.count, 0) : 0;
}

export function waveReward(wave) {
  return 60 + 25 * wave;
}

export function isBossWave(wave) {
  return wave === CONFIG.BOSS_WAVE;
}

export { WAVES };