export type SkillId =
  | 'woodcutting'
  | 'mining'
  | 'smithing'
  | 'attack'
  | 'strength'
  | 'defence'
  | 'hitpoints'

export type ItemId =
  | 'logs'
  | 'oak_logs'
  | 'copper_ore'
  | 'tin_ore'
  | 'bronze_bar'
  | 'bronze_axe'
  | 'iron_axe'
  | 'steel_axe'
  | 'bronze_pickaxe'
  | 'iron_pickaxe'
  | 'bronze_sword'
  | 'coins'

export type ToolSlot = 'axe' | 'pickaxe' | 'weapon'

export interface SkillDef {
  id: SkillId
  name: string
  color: string
}

export interface ItemDef {
  id: ItemId
  name: string
  stackable: boolean
  slot?: ToolSlot
  gatherBonus?: Partial<Record<'woodcutting' | 'mining', number>>
  attackBonus?: number
  value: number
}

export interface ResourceDef {
  id: string
  name: string
  skill: 'woodcutting' | 'mining'
  requiredLevel: number
  xp: number
  yields: { itemId: ItemId; amount: number }
  gatherMs: number
  toolSlot: ToolSlot
  respawnMs: number
  tint: number
}

export interface EnemyDef {
  id: string
  name: string
  level: number
  hitpoints: number
  attackMs: number
  maxHit: number
  xp: number
  loot: { itemId: ItemId; amount: number; chance: number }[]
  tint: number
}

export interface RecipeDef {
  id: string
  name: string
  skill: 'smithing'
  requiredLevel: number
  xp: number
  inputs: { itemId: ItemId; amount: number }[]
  output: { itemId: ItemId; amount: number }
  station: 'anvil' | 'furnace'
}

export type InteractableKind = 'resource' | 'bank' | 'enemy' | 'station' | 'ground'

export interface WorldObjectDef {
  id: string
  kind: InteractableKind
  x: number
  y: number
  refId?: string
  label?: string
}
