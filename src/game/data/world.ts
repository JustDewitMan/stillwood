import type { WorldObjectDef } from './types'

export const WORLD_OBJECTS: WorldObjectDef[] = [
  { id: 't1', kind: 'resource', refId: 'tree', x: 4, y: 4 },
  { id: 't2', kind: 'resource', refId: 'tree', x: 6, y: 3 },
  { id: 't3', kind: 'resource', refId: 'tree', x: 5, y: 6 },
  { id: 't4', kind: 'resource', refId: 'tree', x: 8, y: 5 },
  { id: 't5', kind: 'resource', refId: 'tree', x: 3, y: 8 },
  { id: 't6', kind: 'resource', refId: 'oak', x: 10, y: 3 },
  { id: 't7', kind: 'resource', refId: 'oak', x: 12, y: 5 },
  { id: 'r1', kind: 'resource', refId: 'copper_rock', x: 20, y: 4 },
  { id: 'r2', kind: 'resource', refId: 'copper_rock', x: 22, y: 5 },
  { id: 'r3', kind: 'resource', refId: 'tin_rock', x: 21, y: 7 },
  { id: 'r4', kind: 'resource', refId: 'tin_rock', x: 23, y: 3 },
  { id: 'bank', kind: 'bank', x: 14, y: 10, label: 'Bank' },
  { id: 'furnace', kind: 'station', refId: 'furnace', x: 16, y: 12, label: 'Furnace' },
  { id: 'anvil', kind: 'station', refId: 'anvil', x: 18, y: 12, label: 'Anvil' },
  { id: 'e1', kind: 'enemy', refId: 'rat', x: 7, y: 14 },
  { id: 'e2', kind: 'enemy', refId: 'rat', x: 9, y: 16 },
  { id: 'e3', kind: 'enemy', refId: 'goblin', x: 24, y: 14 },
  { id: 'e4', kind: 'enemy', refId: 'goblin', x: 22, y: 16 },
]

export function buildBlockedGrid(cols: number, rows: number): boolean[][] {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false))
  for (let x = 15; x < cols; x++) {
    grid[17][x] = true
    if (x > 18) grid[18][x] = true
  }
  for (let x = 0; x < 8; x++) {
    grid[0][x] = true
  }
  return grid
}
