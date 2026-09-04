import { ENEMIES, ITEMS, RECIPES, RESOURCES } from '../data/catalog'
import type { ItemId } from '../data/types'
import { store } from './StateStore'

export type Intent =
  | { type: 'idle' }
  | { type: 'walk'; path: { x: number; y: number }[]; onArrive?: () => void }
  | { type: 'gather'; objectId: string; resourceId: string; elapsed: number }
  | { type: 'combat'; objectId: string; enemyId: string; enemyHp: number; playerSwing: number; enemySwing: number }
  | { type: 'bank' }
  | { type: 'station'; station: 'furnace' | 'anvil' }

export class ActionSystem {
  intent: Intent = { type: 'idle' }

  cancel() {
    this.intent = { type: 'idle' }
    store.setActivity(null)
  }

  startGather(objectId: string, resourceId: string) {
    const resource = RESOURCES[resourceId]
    const level = store.getLevel(resource.skill)
    if (level < resource.requiredLevel) {
      store.setToast(`Need ${resource.skill} level ${resource.requiredLevel}`)
      this.cancel()
      return
    }
    const speed = store.getGatherSpeed(resource.skill)
    if (speed <= 0) {
      store.setToast(`Equip a ${resource.toolSlot} first`)
      this.cancel()
      return
    }
    this.intent = { type: 'gather', objectId, resourceId, elapsed: 0 }
    store.setActivity(`${resource.skill === 'woodcutting' ? 'Chopping' : 'Mining'} ${resource.name}`)
  }

  tickGather(dt: number): { depleted?: string; gained?: string } | null {
    if (this.intent.type !== 'gather') return null
    if (store.isInventoryFull()) {
      store.setToast('Your bag is full - visit the bank')
      this.cancel()
      return null
    }

    const resource = RESOURCES[this.intent.resourceId]
    const speed = store.getGatherSpeed(resource.skill)
    this.intent.elapsed += dt * speed

    if (this.intent.elapsed < resource.gatherMs) return null

    this.intent.elapsed = 0
    if (!store.addItem(resource.yields.itemId, resource.yields.amount)) {
      store.setToast('Your bag is full - visit the bank')
      this.cancel()
      return null
    }

    store.addXp(resource.skill, resource.xp)
    const itemName = ITEMS[resource.yields.itemId].name
    store.setToast(`Got ${itemName}`, 1200)
    store.save()
    return { depleted: this.intent.objectId, gained: itemName }
  }

  startCombat(objectId: string, enemyId: string) {
    const enemy = ENEMIES[enemyId]
    this.intent = {
      type: 'combat',
      objectId,
      enemyId,
      enemyHp: enemy.hitpoints,
      playerSwing: 0,
      enemySwing: 0,
    }
    store.setActivity(`Fighting ${enemy.name}`)
  }

  tickCombat(dt: number): { enemyDead?: boolean; playerDead?: boolean; loot?: string } | null {
    if (this.intent.type !== 'combat') return null
    const enemy = ENEMIES[this.intent.enemyId]
    const strengthLevel = store.getLevel('strength')

    this.intent.playerSwing += dt
    this.intent.enemySwing += dt

    if (this.intent.playerSwing >= 1400) {
      this.intent.playerSwing = 0
      const hit = Math.max(
        0,
        Math.floor(Math.random() * (2 + Math.floor(strengthLevel / 4) + store.getAttackBonus() / 2)),
      )
      this.intent.enemyHp -= hit
      if (hit > 0) {
        store.addXp('attack', Math.max(1, hit * 2))
        store.addXp('strength', Math.max(1, hit * 2))
        store.addXp('hitpoints', Math.max(1, Math.floor(hit * 1.2)))
      }
    }

    if (this.intent.enemyHp <= 0) {
      let lootText = ''
      for (const drop of enemy.loot) {
        if (Math.random() <= drop.chance) {
          store.addItem(drop.itemId, drop.amount)
          lootText = ITEMS[drop.itemId].name
        }
      }
      store.addXp('attack', enemy.xp)
      store.setToast(lootText ? `${enemy.name} defeated - ${lootText}` : `${enemy.name} defeated`)
      store.save()
      this.cancel()
      return { enemyDead: true, loot: lootText }
    }

    if (this.intent.enemySwing >= enemy.attackMs) {
      this.intent.enemySwing = 0
      const defence = store.getLevel('defence')
      const hit = Math.max(0, Math.floor(Math.random() * (enemy.maxHit + 1)) - Math.floor(defence / 8))
      if (hit > 0) {
        store.state.hitpoints = Math.max(0, store.state.hitpoints - hit)
        store.addXp('defence', hit)
      }
      if (store.state.hitpoints <= 0) {
        store.state.hitpoints = store.state.maxHitpoints
        store.setToast('You were defeated and wake at the bank')
        this.cancel()
        store.save()
        return { playerDead: true }
      }
    }

    return null
  }

  tryCraft(station: 'furnace' | 'anvil'): boolean {
    const recipe = RECIPES.find((r) => {
      if (r.station !== station) return false
      if (store.getLevel(r.skill) < r.requiredLevel) return false
      return r.inputs.every((input) => store.countItem(input.itemId) >= input.amount)
    })

    if (!recipe) {
      store.setToast(station === 'furnace' ? 'Need copper + tin ore' : 'Need bars to smith')
      return false
    }

    for (const input of recipe.inputs) {
      store.removeItem(input.itemId, input.amount)
    }
    store.addItem(recipe.output.itemId, recipe.output.amount)
    store.addXp('smithing', recipe.xp)
    store.setToast(`Made ${ITEMS[recipe.output.itemId as ItemId].name}`)
    store.save()
    return true
  }
}

export const actions = new ActionSystem()
