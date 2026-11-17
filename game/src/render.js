import { CONFIG } from './config.js';
import { pathPixelPoints, pointAlongPath, cellCenter, CORE_CELL, isBuildable } from './grid.js';
import { TOWER_ORDER, towerStats, upgradeCost, sellValue } from './towers.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0.25);
  ctx.bezierCurveTo(0, -0.1, -0.5, -0.4, -1.0, -0.05);
  ctx.bezierCurveTo(-1.15, 0.05, -1.05, 0.35, 0, 1.0);
  ctx.bezierCurveTo(1.05, 0.35, 1.15, 0.05, 1.0, -0.05);
  ctx.bezierCurveTo(0.5, -0.4, 0, -0.1, 0, 0.25);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawField(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
  g.addColorStop(0, '#05060f');
  g.addColorStop(1, '#0a0f24');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

  const glow = ctx.createRadialGradient(CONFIG.W / 2, CONFIG.H / 2, 0, CONFIG.W / 2, CONFIG.H / 2, 420);
  glow.addColorStop(0, 'rgba(40,90,220,0.12)');
  glow.addColorStop(1, 'rgba(40,90,220,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

  ctx.strokeStyle = CONFIG.COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= CONFIG.W; x += CONFIG.CELL) {
    ctx.moveTo(x, CONFIG.FIELD_Y);
    ctx.lineTo(x, CONFIG.FIELD_Y + CONFIG.ROWS * CONFIG.CELL);
  }
  for (let y = CONFIG.FIELD_Y; y <= CONFIG.FIELD_Y + CONFIG.ROWS * CONFIG.CELL; y += CONFIG.CELL) {
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.W, y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(120,180,255,0.25)';
  ctx.strokeRect(0, CONFIG.FIELD_Y, CONFIG.W, CONFIG.ROWS * CONFIG.CELL);

  const pts = pathPixelPoints();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.lineWidth = 44;
  ctx.strokeStyle = CONFIG.COLORS.path;
  ctx.stroke();
  ctx.lineWidth = 40;
  ctx.strokeStyle = 'rgba(40,90,200,0.35)';
  ctx.stroke();
  ctx.setLineDash([14, 22]);
  ctx.lineDashOffset = -world.time * 40;
  ctx.lineWidth = 2;
  ctx.strokeStyle = CONFIG.COLORS.pathGlow;
  ctx.stroke();
  ctx.setLineDash([]);

  const core = cellCenter(CORE_CELL.col, CORE_CELL.row);
  ctx.beginPath();
  ctx.arc(core.x, core.y, 26 + 4 * Math.sin(world.time * 3), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(55,255,208,0.15)';
  ctx.fill();
  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = CONFIG.COLORS.core;
  ctx.shadowColor = CONFIG.COLORS.core;
  ctx.shadowBlur = 18;
  ctx.fillRect(-16, -16, 32, 32);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(core.x, core.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a = world.time * 2 + i * 2.1;
    ctx.beginPath();
    ctx.arc(core.x + Math.cos(a) * 34, core.y + Math.sin(a) * 34, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#aaffee';
    ctx.fill();
  }
}

export function drawGame(ctx, world) {
  ctx.save();
  if (world.state === 'playing') ctx.translate(world.fx.shakeX, world.fx.shakeY);
  drawField(ctx, world);

  if (world.state === 'playing' && world.input && world.input.mouseCell) {
    const c = world.input.mouseCell;
    const occupied = world.towers.some(t => t.col === c.col && t.row === c.row);
    if (isBuildable(c.col, c.row) && !occupied) {
      const p = cellCenter(c.col, c.row);
      const st = towerStats({ type: world.selectedType, level: 1 });
      ctx.beginPath();
      ctx.arc(p.x, p.y, st.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120,220,255,0.10)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,220,255,0.5)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = CONFIG.TOWERS[world.selectedType].color;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (!isBuildable(c.col, c.row)) {
      const p = cellCenter(c.col, c.row);
      ctx.fillStyle = 'rgba(255,60,60,0.25)';
      ctx.fillRect(p.x - 32, p.y - 32, 64, 64);
    }
  }
  if (world.invalidFlash && world.time < world.invalidFlash.until) {
    const p = cellCenter(world.invalidFlash.col, world.invalidFlash.row);
    ctx.fillStyle = 'rgba(255,60,60,0.4)';
    ctx.fillRect(p.x - 32, p.y - 32, 64, 64);
  }

  for (const t of world.towers) {
    const color = CONFIG.TOWERS[t.type].color;
    rr(ctx, t.x - 26, t.y - 26, 52, 52, 8);
    ctx.fillStyle = '#0a1230';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.translate(-(t.recoil || 0), 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, -4, 26, 8);
    if (t.flash > 0) {
      ctx.beginPath();
      ctx.arc(28, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,200,0.9)';
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 17, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    if (t.type === 'pulse') {
      ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.type === 'frost') {
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        ctx.moveTo(t.x - 10 * Math.cos(a), t.y - 10 * Math.sin(a));
        ctx.lineTo(t.x + 10 * Math.cos(a), t.y + 10 * Math.sin(a));
      }
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (t.type === 'rail') {
      ctx.fillRect(t.x - 11, t.y - 2.5, 22, 5);
    } else if (t.type === 'mortar') {
      ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (t.type === 'tesla') {
      ctx.moveTo(t.x - 8, t.y + 8);
      ctx.lineTo(t.x - 2, t.y);
      ctx.lineTo(t.x + 2, t.y + 2);
      ctx.lineTo(t.x + 8, t.y - 8);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    for (let i = 0; i < t.level; i++) {
      ctx.beginPath();
      ctx.arc(t.x - 10 + i * 10, t.y - 34, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
    }
    if (world.selected === t) {
      const st = towerStats(t);
      ctx.beginPath();
      ctx.arc(t.x, t.y, st.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120,220,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,220,255,0.45)';
      ctx.stroke();
    }
  }

  for (const e of world.enemies) {
    ctx.save();
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = e.color;
    ctx.strokeStyle = e.color;
    if (e.type === 'scout') {
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, 9);
      ctx.lineTo(-10, -9);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'runner') {
      ctx.beginPath();
      ctx.moveTo(e.x - 8, e.y - 8);
      ctx.lineTo(e.x + 4, e.y);
      ctx.lineTo(e.x - 8, e.y + 8);
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (e.type === 'tank') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        const px = e.x + e.radius * Math.cos(a);
        const py = e.y + e.radius * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'swarm') {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'boss') {
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const r = i % 2 === 0 ? 34 : 26;
        const a = i * Math.PI / 6;
        const px = e.x + r * Math.cos(a);
        const py = e.y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x, e.y, 42, world.time, world.time + Math.PI * 2);
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    if (e.hitFlash > 0) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    }
    if (e.slowFactor < 1) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#6fb7ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (e.hp < e.maxHp) {
      const w = e.type === 'boss' ? 90 : 26;
      const x = e.x - w / 2;
      const y = e.y - e.radius - 10;
      ctx.fillStyle = '#111';
      ctx.fillRect(x, y, w, 4);
      const fraction = e.hp / e.maxHp;
      ctx.fillStyle = fraction > 0.5 ? '#37ff7d' : (fraction > 0.25 ? '#ffd23d' : '#ff5d5d');
      ctx.fillRect(x, y, w * fraction, 4);
    }
  }

  const boss = world.enemies.find(en => en.type === 'boss');
  if (boss) {
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2d78';
    ctx.fillText('BOSS', 640, 68);
    ctx.fillStyle = '#111';
    ctx.fillRect(440, 76, 400, 10);
    ctx.fillStyle = '#ff2d78';
    ctx.fillRect(440, 76, 400 * (boss.hp / boss.maxHp), 10);
  }

  for (const p of world.fx.projectiles) {
    ctx.beginPath();
    ctx.moveTo(p.x - (p.tx - p.x) * 0.02, p.y - (p.ty - p.y) * 0.02);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius || 4, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const b of world.fx.beams) {
    const alpha = Math.max(0, b.life / b.maxLife);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.globalCompositeOperation = 'lighter';
  for (const pt of world.fx.particles) {
    const alpha = pt.life / pt.maxLife;
    if (pt.ring) {
      const radius = pt.size + (1 - alpha) * 26;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      const radius = pt.size * (0.5 + 0.5 * alpha);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  for (const ft of world.fx.texts) {
    ctx.globalAlpha = Math.min(1, ft.life / 0.5);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = ft.color;
    ctx.textAlign = 'center';
    ctx.fillText(ft.str, ft.x, ft.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  ctx.fillStyle = 'rgba(5,8,20,0.85)';
  ctx.fillRect(0, 0, 1280, 56);
  ctx.strokeStyle = 'rgba(34,230,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 56);
  ctx.lineTo(1280, 56);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText('SCORE ' + world.eco.score, 16, 36);
  ctx.fillText('WAVE ' + (world.wave || 1) + '/11', 260, 36);
  heart(ctx, 428, 28, 9, world.eco.lives <= 5 ? '#ff5d5d' : '#ff8ab0');
  ctx.fillText(String(world.eco.lives), 444, 36);
  ctx.beginPath();
  ctx.arc(560, 28, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd23d';
  ctx.fill();
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText(String(world.eco.credits), 576, 36);
  if (world.waveActive) ctx.fillText('DRONES ' + (world.enemies.length + world.spawnQueue.length), 900, 36);
  ctx.textAlign = 'right';
  ctx.fillText('BEST ' + world.best, 1264, 36);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(5,8,20,0.85)';
  ctx.fillRect(0, 632, 1280, 88);
  ctx.strokeStyle = 'rgba(34,230,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 632);
  ctx.lineTo(1280, 632);
  ctx.stroke();
  for (let i = 0; i < TOWER_ORDER.length; i++) {
    const type = TOWER_ORDER[i];
    const x = 16 + i * 162;
    rr(ctx, x, 644, 150, 64, 8);
    ctx.fillStyle = '#0a1230';
    ctx.fill();
    if (world.selectedType === type) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = CONFIG.TOWERS[type].color;
      ctx.shadowBlur = 12;
    } else {
      ctx.strokeStyle = 'rgba(120,180,255,0.35)';
      ctx.lineWidth = 1;
    }
    ctx.stroke();
    const def = CONFIG.TOWERS[type];
    const afford = world.eco.credits >= def.cost;
    if (!afford) ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x + 16, 662, 8, 0, Math.PI * 2);
    ctx.fillStyle = def.color;
    ctx.fill();
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(def.name, x + 30, 667);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = afford ? '#ffd23d' : '#ff5d5d';
    ctx.fillText(String(def.cost), x + 30, 686);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = CONFIG.COLORS.dim;
    ctx.fillText(def.desc.length > 18 ? def.desc.slice(0, 18) + '…' : def.desc, x + 8, 702);
    ctx.fillStyle = '#1c2f66';
    ctx.fillRect(x + 122, 650, 20, 20);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x + 132, 665);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  ctx.font = '12px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.dim;
  ctx.fillText('SPACE start wave · ESC pause · R restart · M mute', 860, 700);

  if (world.selected) {
    const t = world.selected;
    const st = towerStats(t);
    const px = Math.min(t.x + 40, 1280 - 230);
    const py = Math.max(60, t.y - 70);
    rr(ctx, px, py, 220, 96, 8);
    ctx.fillStyle = 'rgba(5,10,26,0.95)';
    ctx.fill();
    ctx.strokeStyle = '#22e6ff';
    ctx.stroke();
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(CONFIG.TOWERS[t.type].name + '  Lv ' + t.level, px + 12, py + 22);
    for (let i = 0; i < t.level; i++) {
      ctx.beginPath();
      ctx.arc(px + 150 + i * 12, py + 18, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23d';
      ctx.fill();
    }
    ctx.font = '13px sans-serif';
    ctx.fillStyle = CONFIG.COLORS.dim;
    ctx.fillText('DMG ' + Math.round(st.damage) + ' · RNG ' + Math.round(st.range), px + 12, py + 42);
    const uc = upgradeCost(t);
    const canUp = t.level < CONFIG.MAX_LEVEL && world.eco.credits >= uc;
    world.ui.upgradeRect = { x: px + 12, y: py + 52, w: 100, h: 30 };
    rr(ctx, px + 12, py + 52, 100, 30, 6);
    ctx.fillStyle = canUp ? '#123a5c' : '#222';
    ctx.fill();
    ctx.strokeStyle = canUp ? '#22e6ff' : '#555';
    ctx.stroke();
    ctx.fillStyle = canUp ? '#d8f6ff' : '#777';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(t.level >= CONFIG.MAX_LEVEL ? 'MAX LEVEL' : ('UPGRADE ' + uc), px + 18, py + 71);
    const sv = sellValue(t);
    world.ui.sellRect = { x: px + 120, y: py + 52, w: 88, h: 30 };
    rr(ctx, px + 120, py + 52, 88, 30, 6);
    ctx.fillStyle = '#3a2a10';
    ctx.fill();
    ctx.strokeStyle = '#ffd23d';
    ctx.stroke();
    ctx.fillStyle = '#ffd23d';
    ctx.fillText('SELL +' + sv, px + 128, py + 71);
  } else {
    world.ui.upgradeRect = null;
    world.ui.sellRect = null;
  }

  if (world.banner && world.time < world.banner.until) {
    const a = Math.min(1, (world.banner.until - world.time) / 0.5);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#22e6ff';
    ctx.shadowBlur = 18;
    ctx.fillText(world.banner.text, 640, 300);
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif';
    ctx.fillStyle = CONFIG.COLORS.dim;
    ctx.fillText(world.banner.sub, 640, 340);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  if (!world.waveActive && world.state === 'playing' && !world.banner) {
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    ctx.fillStyle = CONFIG.COLORS.text;
    ctx.fillText('Next wave in ' + Math.ceil(world.betweenTimer) + ' — press SPACE', 640, 300);
    ctx.textAlign = 'left';
  }
}

export function drawTitle(ctx, world, t) {
  drawField(ctx, world);
  for (let i = 0; i < 24; i++) {
    const f = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const d = (t * 20 + i * 97) % 4800;
    const p = pointAlongPath(d);
    ctx.globalAlpha = 0.25 + 0.45 * f;
    ctx.fillStyle = i % 3 === 0 ? '#ff4fd8' : '#22e6ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = 'bold 84px sans-serif';
  ctx.shadowColor = '#22e6ff';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#22e6ff';
  ctx.fillText('NEON', 640, 210);
  ctx.shadowColor = '#ff4fd8';
  ctx.fillStyle = '#ff4fd8';
  ctx.fillText('BASTION', 640, 300);
  ctx.shadowBlur = 0;
  ctx.font = '20px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText('DEFEND THE CORE — 11 WAVES. ONE BASTION.', 640, 360);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.dim;
  ctx.fillText('Place towers on the grid to stop the drone swarm.', 640, 410);
  ctx.fillText('Earn credits for every kill — upgrade and sell to adapt.', 640, 436);
  ctx.fillText('Lose a life when a drone reaches the core. 20 lives. Boss on wave 11.', 640, 462);
  ctx.font = '15px sans-serif';
  ctx.fillText('1-5 select tower · Click to place · Space start wave · Esc pause · R restart', 640, 510);
  if (world.best > 0) {
    ctx.fillStyle = '#ffd23d';
    ctx.fillText('BEST SCORE ' + world.best, 640, 545);
  }
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CLICK OR PRESS SPACE TO START', 640, 610);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(3,5,12,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PAUSED', 640, 320);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.dim;
  ctx.fillText('ESC resume · R restart · M mute', 640, 370);
  ctx.textAlign = 'left';
}

export function drawVictory(ctx, world) {
  ctx.fillStyle = 'rgba(3,12,8,0.78)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.font = 'bold 60px sans-serif';
  ctx.fillStyle = '#37ffd0';
  ctx.shadowColor = '#37ffd0';
  ctx.shadowBlur = 20;
  ctx.fillText('BASTION HELD', 640, 250);
  ctx.shadowBlur = 0;
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('VICTORY — ALL 11 WAVES CLEARED', 640, 310);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText('FINAL SCORE ' + world.eco.score, 640, 370);
  ctx.fillText('DRONES DESTROYED ' + world.stats.kills, 640, 405);
  ctx.fillText('CREDITS EARNED ' + world.eco.earned, 640, 440);
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PLAY AGAIN — press R or click', 640, 540);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(12,3,8,0.78)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.font = 'bold 60px sans-serif';
  ctx.fillStyle = '#ff5d5d';
  ctx.shadowColor = '#ff5d5d';
  ctx.shadowBlur = 20;
  ctx.fillText('CORE BREACHED', 640, 250);
  ctx.shadowBlur = 0;
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('THE BASTION HAS FALLEN', 640, 310);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText('FINAL SCORE ' + world.eco.score, 640, 370);
  ctx.fillText('WAVE REACHED ' + world.wave + '/11', 640, 405);
  ctx.fillText('DRONES DESTROYED ' + world.stats.kills, 640, 440);
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('TRY AGAIN — press R or click', 640, 540);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}