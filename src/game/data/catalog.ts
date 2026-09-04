import type { EnemyDef, ItemDef, RecipeDef, ResourceDef, SkillDef } from './types'

export const TILE = 48
export const WORLD_COLS = 28
export const WORLD_ROWS = 20
export const INVENTORY_SLOTS = 14
export const BASE_MOVE_SPEED = 140

export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let i = 1; i < level; i++) {
    total += Math.floor(i + 300 * Math.pow(2, i / 7))
  }
  return Math.floor(total / 4)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (level < 99 && xp >= xpForLevel(level + 1)) level++
  return level
}

export const SKILLS: SkillDef[] = [
  { id: 'woodcutting', name: 'Woodcutting', color: '#7a9e78' },
  { id: 'mining', name: 'Mining', color: '#8a9bb0' },
  { id: 'smithing', name: 'Smithing', color: '#c48a4a' },
  { id: 'attack', name: 'Attack', color: '#c46b5a' },
  { id: 'strength', name: 'Strength', color: '#b35d4a' },
  { id: 'defence', name: 'Defence', color: '#6a8cae' },
  { id: 'hitpoints', name: 'Hitpoints', color: '#d07a7a' },
]

export const ITEMS: Record<string, ItemDef> = {
  logs: { id: 'logs', name: 'Logs', stackable: true, value: 5 },
  oak_logs: { id: 'oak_logs', name: 'Oak logs', stackable: true, value: 12 },
  copper_ore: { id: 'copper_ore', name: 'Copper ore', stackable: true, value: 8 },
  tin_ore: { id: 'tin_ore', name: 'Tin ore', stackable: true, value: 8 },
  bronze_bar: { id: 'bronze_bar', name: 'Bronze bar', stackable: true, value: 25 },
  bronze_axe: { id: 'bronze_axe', name: 'Bronze axe', stackable: false, slot: 'axe', gatherBonus: { woodcutting: 1 }, value: 40 },
  iron_axe: { id: 'iron_axe', name: 'Iron axe', stackable: false, slot: 'axe', gatherBonus: { woodcutting: 1.25 }, value: 90 },
  steel_axe: { id: 'steel_axe', name: 'Steel axe', stackable: false, slot: 'axe', gatherBonus: { woodcutting: 1.5 }, value: 180 },
  bronze_pickaxe: { id: 'bronze_pickaxe', name: 'Bronze pickaxe', stackable: false, slot: 'pickaxe', gatherBonus: { mining: 1 }, value: 40 },
  iron_pickaxe: { id: 'iron_pickaxe', name: 'Iron pickaxe', stackable: false, slot: 'pickaxe', gatherBonus: { mining: 1.25 }, value: 90 },
  bronze_sword: { id: 'bronze_sword', name: 'Bronze sword', stackable: false, slot: 'weapon', attackBonus: 4, value: 60 },
  coins: { id: 'coins', name: 'Coins', stackable: true, value: 1 },
}

export const RESOURCES: Record<string, ResourceDef> = {
  tree: { id: 'tree', name: 'Tree', skill: 'woodcutting', requiredLevel: 1, xp: 25, yields: { itemId: 'logs', amount: 1 }, gatherMs: 2200, toolSlot: 'axe', respawnMs: 8000, tint: 0x6f9a6c },
  oak: { id: 'oak', name: 'Oak tree', skill: 'woodcutting', requiredLevel: 15, xp: 45, yields: { itemId: 'oak_logs', amount: 1 }, gatherMs: 2800, toolSlot: 'axe', respawnMs: 12000, tint: 0x557a52 },
  copper_rock: { id: 'copper_rock', name: 'Copper rock', skill: 'mining', requiredLevel: 1, xp: 18, yields: { itemId: 'copper_ore', amount: 1 }, gatherMs: 2400, toolSlot: 'pickaxe', respawnMs: 7000, tint: 0xb07a4a },
  tin_rock: { id: 'tin_rock', name: 'Tin rock', skill: 'mining', requiredLevel: 1, xp: 18, yields: { itemId: 'tin_ore', amount: 1 }, gatherMs: 2400, toolSlot: 'pickaxe', respawnMs: 7000, tint: 0x9aa3ad },
}

export const ENEMIES: Record<string, EnemyDef> = {
  rat: { id: 'rat', name: 'Giant rat', level: 1, hitpoints: 8, attackMs: 1800, maxHit: 1, xp: 12, loot: [{ itemId: 'coins', amount: 5, chance: 0.8 }, { itemId: 'logs', amount: 1, chance: 0.15 }], tint: 0x8a6a5a },
  goblin: { id: 'goblin', name: 'Goblin', level: 3, hitpoints: 16, attackMs: 1600, maxHit: 2, xp: 28, loot: [{ itemId: 'coins', amount: 12, chance: 0.9 }, { itemId: 'bronze_sword', amount: 1, chance: 0.05 }], tint: 0x6d8a5a },
}

export const RECIPES: RecipeDef[] = [
  { id: 'bronze_bar', name: 'Smelt bronze bar', skill: 'smithing', requiredLevel: 1, xp: 15, inputs: [{ itemId: 'copper_ore', amount: 1 }, { itemId: 'tin_ore', amount: 1 }], output: { itemId: 'bronze_bar', amount: 1 }, station: 'furnace' },
  { id: 'bronze_axe', name: 'Forge bronze axe', skill: 'smithing', requiredLevel: 1, xp: 25, inputs: [{ itemId: 'bronze_bar', amount: 1 }], output: { itemId: 'bronze_axe', amount: 1 }, station: 'anvil' },
  { id: 'bronze_pickaxe', name: 'Forge bronze pickaxe', skill: 'smithing', requiredLevel: 1, xp: 25, inputs: [{ itemId: 'bronze_bar', amount: 1 }], output: { itemId: 'bronze_pickaxe', amount: 1 }, station: 'anvil' },
  { id: 'bronze_sword', name: 'Forge bronze sword', skill: 'smithing', requiredLevel: 4, xp: 30, inputs: [{ itemId: 'bronze_bar', amount: 1 }], output: { itemId: 'bronze_sword', amount: 1 }, station: 'anvil' },
]
