import {
  INVENTORY_SLOTS,
  ITEMS,
  SKILLS,
  levelFromXp,
  xpForLevel,
} from '../data/catalog'
import type { ItemId, SkillId, ToolSlot } from '../data/types'

export interface InventorySlot {
  itemId: ItemId
  amount: number
}

export interface SkillState {
  xp: number
}

export interface GameState {
  x: number
  y: number
  hitpoints: number
  maxHitpoints: number
  inventory: (InventorySlot | null)[]
  bank: InventorySlot[]
  skills: Record<SkillId, SkillState>
  equipped: Partial<Record<ToolSlot, ItemId>>
  toast: string | null
  toastUntil: number
  activity: string | null
}

const SAVE_KEY = 'stillwood-save-v2'

function emptySkills(): Record<SkillId, SkillState> {
  const skills = {} as Record<SkillId, SkillState>
  for (const skill of SKILLS) {
    skills[skill.id] = { xp: skill.id === 'hitpoints' ? xpForLevel(10) : 0 }
  }
  return skills
}

export function createInitialState(): GameState {
  const inventory: (InventorySlot | null)[] = Array(INVENTORY_SLOTS).fill(null)
  inventory[0] = { itemId: 'bronze_axe', amount: 1 }
  inventory[1] = { itemId: 'bronze_pickaxe', amount: 1 }
  inventory[2] = { itemId: 'bronze_sword', amount: 1 }

  return {
    x: 14,
    y: 9,
    hitpoints: 10,
    maxHitpoints: 10,
    inventory,
    bank: [],
    skills: emptySkills(),
    equipped: {
      axe: 'bronze_axe',
      pickaxe: 'bronze_pickaxe',
      weapon: 'bronze_sword',
    },
    toast: null,
    toastUntil: 0,
    activity: null,
  }
}

export class StateStore {
  state: GameState

  constructor() {
    this.state = this.load() ?? createInitialState()
    this.syncHitpointsFromSkill()
  }

  syncHitpointsFromSkill() {
    const level = this.getLevel('hitpoints')
    this.state.maxHitpoints = level
    this.state.hitpoints = Math.min(this.state.hitpoints, level)
  }

  getLevel(skill: SkillId): number {
    return levelFromXp(this.state.skills[skill].xp)
  }

  addXp(skill: SkillId, amount: number): { leveled: boolean; level: number } {
    const before = this.getLevel(skill)
    this.state.skills[skill].xp += amount
    const after = this.getLevel(skill)
    if (skill === 'hitpoints') this.syncHitpointsFromSkill()
    if (after > before) {
      this.setToast(`${SKILLS.find((s) => s.id === skill)?.name} level ${after}!`)
      return { leveled: true, level: after }
    }
    return { leveled: false, level: after }
  }

  inventoryCount(): number {
    return this.state.inventory.filter(Boolean).length
  }

  isInventoryFull(): boolean {
    return this.inventoryCount() >= INVENTORY_SLOTS
  }

  countItem(itemId: ItemId, where: 'inventory' | 'bank' = 'inventory'): number {
    const bag = where === 'inventory' ? this.state.inventory : this.state.bank
    return bag.reduce((sum, slot) => {
      if (!slot || slot.itemId !== itemId) return sum
      return sum + slot.amount
    }, 0)
  }

  addItem(itemId: ItemId, amount = 1, where: 'inventory' | 'bank' = 'inventory'): boolean {
    const def = ITEMS[itemId]
    const bag = where === 'inventory' ? this.state.inventory : this.state.bank

    if (def.stackable) {
      const existing = bag.find((s) => s && s.itemId === itemId)
      if (existing) {
        existing.amount += amount
        return true
      }
    }

    if (where === 'inventory') {
      const empty = this.state.inventory.findIndex((s) => !s)
      if (empty === -1) return false
      this.state.inventory[empty] = { itemId, amount }
      return true
    }

    this.state.bank.push({ itemId, amount })
    return true
  }

  removeItem(itemId: ItemId, amount = 1, where: 'inventory' | 'bank' = 'inventory'): boolean {
    if (this.countItem(itemId, where) < amount) return false
    const bag = where === 'inventory' ? this.state.inventory : this.state.bank
    let remaining = amount

    for (let i = 0; i < bag.length && remaining > 0; i++) {
      const slot = bag[i]
      if (!slot || slot.itemId !== itemId) continue
      const take = Math.min(slot.amount, remaining)
      slot.amount -= take
      remaining -= take
      if (slot.amount <= 0) {
        if (where === 'inventory') this.state.inventory[i] = null
        else bag.splice(i, 1)
        i--
      }
    }
    return remaining === 0
  }

  depositAll() {
    for (let i = 0; i < this.state.inventory.length; i++) {
      const slot = this.state.inventory[i]
      if (!slot) continue
      this.addItem(slot.itemId, slot.amount, 'bank')
      this.state.inventory[i] = null
    }
    this.setToast('Deposited inventory into the bank')
  }

  withdrawItem(itemId: ItemId, amount = 1): boolean {
    if (!this.removeItem(itemId, amount, 'bank')) return false
    if (!this.addItem(itemId, amount, 'inventory')) {
      this.addItem(itemId, amount, 'bank')
      this.setToast('Inventory is full')
      return false
    }
    this.setToast(`Withdrew ${ITEMS[itemId].name}`)
    return true
  }

  equipFromInventory(index: number) {
    const slot = this.state.inventory[index]
    if (!slot) return
    const def = ITEMS[slot.itemId]
    if (!def.slot) {
      this.setToast(`${def.name} cannot be equipped`)
      return
    }
    this.state.equipped[def.slot] = slot.itemId
    this.setToast(`Equipped ${def.name}`)
  }

  getGatherSpeed(skill: 'woodcutting' | 'mining'): number {
    const slot = skill === 'woodcutting' ? 'axe' : 'pickaxe'
    const itemId = this.state.equipped[slot]
    if (!itemId) return 0
    return ITEMS[itemId].gatherBonus?.[skill] ?? 1
  }

  getAttackBonus(): number {
    const weapon = this.state.equipped.weapon
    return weapon ? (ITEMS[weapon].attackBonus ?? 0) : 0
  }

  setToast(message: string, ms = 2200) {
    this.state.toast = message
    this.state.toastUntil = performance.now() + ms
  }

  setActivity(activity: string | null) {
    this.state.activity = activity
  }

  save() {
    const payload = {
      ...this.state,
      toast: null,
      toastUntil: 0,
      activity: null,
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  }

  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem('stillwood-save-v1')
      if (!raw) return null
      const parsed = JSON.parse(raw) as GameState
      return { ...createInitialState(), ...parsed, toast: null, activity: null }
    } catch {
      return null
    }
  }

  reset() {
    localStorage.removeItem(SAVE_KEY)
    this.state = createInitialState()
  }
}

export const store = new StateStore()
