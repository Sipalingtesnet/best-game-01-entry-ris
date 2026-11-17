// NEON BASTION — playfield grid, winding path, and pixel<->cell mapping.
import { CONFIG } from './config.js';

const { CELL, FIELD_X, FIELD_Y, COLS, ROWS } = CONFIG;

export const PATH_CELLS = [
  [-1, 1], [16, 1], [16, 4], [3, 4], [3, 7], [16, 7], [16, 8], [19, 8],
];

export const CORE_CELL = { col: 19, row: 8 };

export function pathPixelPoints() {
  return PATH_CELLS.map(([col, row]) => ({
    x: FIELD_X + col * CELL + CELL / 2,
    y: FIELD_Y + row * CELL + CELL / 2,
  }));
}

function buildSegments() {
  const pts = pathPixelPoints();
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const { x: x1, y: y1 } = pts[i];
    const { x: x2, y: y2 } = pts[i + 1];
    segs.push({ x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) });
  }
  return segs;
}

const SEGS = buildSegments();
const TOTAL = SEGS.reduce((sum, s) => sum + s.len, 0);

export function pathSegments() {
  return SEGS;
}

export function pathTotalLength() {
  return TOTAL;
}

export function pointAlongPath(dist) {
  let d = Math.min(Math.max(dist, 0), TOTAL);
  for (const seg of SEGS) {
    if (d <= seg.len) {
      const t = seg.len === 0 ? 0 : d / seg.len;
      return {
        x: seg.x1 + (seg.x2 - seg.x1) * t,
        y: seg.y1 + (seg.y2 - seg.y1) * t,
        angle: Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1),
      };
    }
    d -= seg.len;
  }
  const last = SEGS[SEGS.length - 1];
  return {
    x: last.x2,
    y: last.y2,
    angle: Math.atan2(last.y2 - last.y1, last.x2 - last.x1),
  };
}

const PATH_SET = new Set();
for (let i = 0; i < PATH_CELLS.length - 1; i++) {
  const [c1, r1] = PATH_CELLS[i];
  const [c2, r2] = PATH_CELLS[i + 1];
  const dc = Math.sign(c2 - c1);
  const dr = Math.sign(r2 - r1);
  let c = c1;
  let r = r1;
  while (c !== c2 || r !== r2) {
    PATH_SET.add(c + ',' + r);
    c += dc;
    r += dr;
  }
  PATH_SET.add(c2 + ',' + r2);
}

export function isPathCell(col, row) {
  return PATH_SET.has(col + ',' + row);
}

export function isBuildable(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  if (col === CORE_CELL.col && row === CORE_CELL.row) return false;
  return !isPathCell(col, row);
}

export function cellCenter(col, row) {
  return {
    x: FIELD_X + col * CELL + CELL / 2,
    y: FIELD_Y + row * CELL + CELL / 2,
  };
}

export function pixelToCell(x, y) {
  if (x < FIELD_X || x >= FIELD_X + COLS * CELL) return null;
  if (y < FIELD_Y || y >= FIELD_Y + ROWS * CELL) return null;
  return {
    col: Math.floor((x - FIELD_X) / CELL),
    row: Math.floor((y - FIELD_Y) / CELL),
  };
}