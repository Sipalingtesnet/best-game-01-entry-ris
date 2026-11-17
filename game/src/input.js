// NEON BASTION — raw keyboard + mouse input state and callbacks. No game logic.
import { pixelToCell } from './grid.js';
import { CONFIG } from './config.js';

const ACTION_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export function createInput(canvas) {
  const input = {
    mouseX: 0,
    mouseY: 0,
    mouseCell: null,
    clicked: false,
    selectedType: 'pulse',
    keys: new Set(),
    onKey: null,
    onClick: null,
    onMove: null,
  };

  function updateMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width > 0 ? CONFIG.W / rect.width : 1;
    const sy = rect.height > 0 ? CONFIG.H / rect.height : 1;
    input.mouseX = (e.clientX - rect.left) * sx;
    input.mouseY = (e.clientY - rect.top) * sy;
    input.mouseCell = pixelToCell(input.mouseX, input.mouseY);
  }

  canvas.addEventListener('mousemove', (e) => {
    updateMouse(e);
    if (input.onMove) input.onMove(e);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    updateMouse(e);
    input.clicked = true;
    if (input.onClick) input.onClick(e);
  });

  window.addEventListener('keydown', (e) => {
    input.keys.add(e.code);
    if (ACTION_KEYS.includes(e.code)) e.preventDefault();
    if (input.onKey) input.onKey(e.code);
  });

  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
  });

  return input;
}

export function consumeClick(input) {
  if (input.clicked) {
    input.clicked = false;
    return true;
  }
  return false;
}

export function isDown(input, code) {
  return input.keys.has(code);
}