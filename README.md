# NEON BASTION

[![Bounty](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![Rank](https://make.fun/badge/best-game-01/Sipalingtesnet/best-game-01-entry-ris/rank.svg)](https://make.fun/bounty/best-game-01)
[![Reward](https://make.fun/badge/best-game-01/Sipalingtesnet/best-game-01-entry-ris/reward.svg)](https://make.fun/bounty/best-game-01)

[make.fun bounty: best-game-01](https://make.fun/bounty/best-game-01)

NEON BASTION is a neon tower defense: drones swarm down a winding path toward your core, and you must place towers to stop them. Five tower types, each with a distinct role, let you chain slows, bursts, and raw damage into a living defense line. Survive all 11 waves — including the boss wave — and hold the bastion.

## How to play

Your goal is to defend the core: you start with 20 lives and lose one for every drone that slips through. Kills pay credits, which you spend on new towers or upgrades. When a tower has outlived its usefulness, sell it to reclaim a share of its cost and rebuild elsewhere.

## Controls

| Key / Input | Action |
| --- | --- |
| Mouse | Place, upgrade, or sell towers |
| 1–5 | Select tower type |
| Space | Start the next wave |
| Esc | Pause |
| R | Restart |
| M | Mute |

## Towers

| Tower | Cost |
| --- | --- |
| Pulse | 50 |
| Frost | 75 |
| Rail | 120 |
| Mortar | 150 |
| Tesla | 200 |

## Files

- `game/index.html` — page shell and bootstrapping
- `game/src/config.js` — global tuning constants
- `game/src/random.js` — seeded RNG helpers
- `game/src/input.js` — keyboard and mouse handling
- `game/src/grid.js` — placement grid and path math
- `game/src/towers.js` — tower behavior and upgrades
- `game/src/enemies.js` — drone types and movement
- `game/src/waves.js` — wave composition and boss
- `game/src/economy.js` — credits, lives, and costs
- `game/src/particles.js` — particle effects
- `game/src/audio.js` — sound and mute
- `game/src/render.js` — canvas drawing
- `game/src/shots.js` — screenshot hooks
- `game/src/main.js` — game loop and orchestration
- `game/src/world.js` — world state and waves

## Run locally

```bash
node serve.ts        # → http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build dossier
```