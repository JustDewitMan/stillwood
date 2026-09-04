import Phaser from 'phaser'
import { BASE_MOVE_SPEED, ENEMIES, TILE, WORLD_COLS, WORLD_ROWS } from '../data/catalog'
import { WORLD_OBJECTS, buildBlockedGrid } from '../data/world'
import { actions } from '../systems/ActionSystem'
import { findPath } from '../systems/Pathfinding'
import { store } from '../systems/StateStore'

interface WorldEntity {
  id: string
  kind: string
  refId?: string
  tileX: number
  tileY: number
  sprite: Phaser.GameObjects.Sprite
  label?: Phaser.GameObjects.Text
  depletedUntil?: number
  alive: boolean
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite
  private marker!: Phaser.GameObjects.Sprite
  private blocked!: boolean[][]
  private entities: WorldEntity[] = []
  private path: { x: number; y: number }[] = []
  private moving = false
  private onArrive: (() => void) | null = null

  constructor() {
    super('World')
  }

  create() {
    this.blocked = buildBlockedGrid(WORLD_COLS, WORLD_ROWS)
    this.drawTerrain()
    this.spawnEntities()
    this.createPlayer()
    this.marker = this.add.sprite(0, 0, 'target').setAlpha(0).setDepth(5)
    this.cameras.main.setBounds(0, 0, WORLD_COLS * TILE, WORLD_ROWS * TILE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setZoom(1)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > this.scale.height - 110) return
      this.handleTap(pointer.worldX, pointer.worldY)
    })
    this.events.on('ui-deposit', () => this.depositIfNearBank())
    this.events.on('ui-craft', (station: 'furnace' | 'anvil') => this.craftIfNear(station))
    this.events.on('ui-cancel', () => {
      actions.cancel()
      this.path = []
      this.moving = false
      this.onArrive = null
      this.marker.setAlpha(0)
    })
    this.tweens.add({ targets: this.cameras.main, zoom: 1.02, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
  }

  private drawTerrain() {
    for (let y = 0; y < WORLD_ROWS; y++) {
      for (let x = 0; x < WORLD_COLS; x++) {
        const key = this.blocked[y][x] ? (y === 0 && x < 8 ? 'cliff' : 'water') : 'grass'
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, key).setDepth(0)
      }
    }
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, WORLD_COLS - 1)
      const y = Phaser.Math.Between(0, WORLD_ROWS - 1)
      if (this.blocked[y][x]) continue
      this.add.circle(x * TILE + TILE / 2, y * TILE + TILE / 2, Phaser.Math.Between(4, 10), 0x4d6e54, 0.18).setDepth(1)
    }
  }

  private spawnEntities() {
    for (const obj of WORLD_OBJECTS) {
      const texture = this.textureFor(obj.kind, obj.refId)
      const sprite = this.add.sprite(obj.x * TILE + TILE / 2, obj.y * TILE + TILE / 2, texture).setDepth(3).setInteractive({ useHandCursor: true })
      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => { pointer.event.stopPropagation?.(); this.interactWith(obj.id) })
      if (obj.kind === 'enemy' || obj.kind === 'resource') {
        this.tweens.add({ targets: sprite, y: sprite.y - 2, duration: 1800 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      }
      let label: Phaser.GameObjects.Text | undefined
      if (obj.label) {
        label = this.add.text(sprite.x, sprite.y - 28, obj.label, { fontFamily: 'Source Sans 3, sans-serif', fontSize: '12px', color: '#e8f0e8', stroke: '#1e3329', strokeThickness: 3 }).setOrigin(0.5).setDepth(4)
      }
      if (obj.kind !== 'enemy') this.blocked[obj.y][obj.x] = true
      this.entities.push({ id: obj.id, kind: obj.kind, refId: obj.refId, tileX: obj.x, tileY: obj.y, sprite, label, alive: true })
    }
  }

  private textureFor(kind: string, refId?: string): string {
    if (kind === 'bank') return 'bank'
    if (kind === 'station') return refId === 'furnace' ? 'furnace' : 'anvil'
    if (kind === 'enemy') return refId === 'goblin' ? 'goblin' : 'rat'
    if (refId === 'oak') return 'oak'
    if (refId === 'copper_rock') return 'rock'
    if (refId === 'tin_rock') return 'tinrock'
    return 'tree'
  }

  private createPlayer() {
    const startX = store.state.x * TILE + TILE / 2
    const startY = store.state.y * TILE + TILE / 2
    this.add.image(startX, startY + 8, 'shadow').setDepth(2)
    this.player = this.add.sprite(startX, startY, 'player').setDepth(6)
    this.tweens.add({ targets: this.player, scaleX: 1.04, scaleY: 0.96, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
  }

  private tileFromWorld(wx: number, wy: number) {
    return { x: Phaser.Math.Clamp(Math.floor(wx / TILE), 0, WORLD_COLS - 1), y: Phaser.Math.Clamp(Math.floor(wy / TILE), 0, WORLD_ROWS - 1) }
  }

  private playerTile() {
    return { x: Math.round((this.player.x - TILE / 2) / TILE), y: Math.round((this.player.y - TILE / 2) / TILE) }
  }

  private handleTap(wx: number, wy: number) {
    const tile = this.tileFromWorld(wx, wy)
    const entity = this.entities.find((e) => e.alive && e.tileX === tile.x && e.tileY === tile.y && e.sprite.visible)
    if (entity) { this.interactWith(entity.id); return }
    this.walkTo(tile.x, tile.y, false)
  }

  private interactWith(id: string) {
    const entity = this.entities.find((e) => e.id === id && e.alive)
    if (!entity) return
    this.marker.setPosition(entity.sprite.x, entity.sprite.y).setAlpha(1)
    this.tweens.add({ targets: this.marker, alpha: 0.35, duration: 400, yoyo: true, repeat: 1 })
    if (entity.kind === 'resource') {
      if (entity.depletedUntil && this.time.now < entity.depletedUntil) { store.setToast('Still growing back...'); return }
      this.walkTo(entity.tileX, entity.tileY, true, () => actions.startGather(entity.id, entity.refId!))
      return
    }
    if (entity.kind === 'bank') {
      this.walkTo(entity.tileX, entity.tileY, true, () => {
        actions.intent = { type: 'bank' }
        store.setActivity('At the bank')
        store.depositAll()
        store.save()
        this.game.events.emit('bank-opened')
      })
      return
    }
    if (entity.kind === 'station') {
      const station = entity.refId as 'furnace' | 'anvil'
      this.walkTo(entity.tileX, entity.tileY, true, () => {
        actions.intent = { type: 'station', station }
        store.setActivity(station === 'furnace' ? 'Smelting' : 'Smithing')
        actions.tryCraft(station)
        this.game.events.emit('station-opened', station)
      })
      return
    }
    if (entity.kind === 'enemy') {
      this.walkTo(entity.tileX, entity.tileY, true, () => actions.startCombat(entity.id, entity.refId!))
    }
  }

  private walkTo(tx: number, ty: number, adjacent: boolean, onArrive?: () => void) {
    actions.cancel()
    const start = this.playerTile()
    store.state.x = start.x
    store.state.y = start.y
    const dx = Math.abs(start.x - tx)
    const dy = Math.abs(start.y - ty)
    if (adjacent && dx <= 1 && dy <= 1) { onArrive?.(); return }
    if (!adjacent && dx === 0 && dy === 0) { onArrive?.(); return }
    if (!adjacent && this.blocked[ty]?.[tx]) { store.setToast('Cannot walk there'); return }
    const path = findPath(start, { x: tx, y: ty }, this.blocked, { adjacentGoal: adjacent })
    if (path.length === 0) { store.setToast('No path'); return }
    this.path = path
    this.moving = true
    this.onArrive = onArrive ?? null
    store.setActivity('Walking')
  }

  private depositIfNearBank() {
    const bank = this.entities.find((e) => e.kind === 'bank')
    if (!bank) return
    const p = this.playerTile()
    if (Math.abs(p.x - bank.tileX) <= 1 && Math.abs(p.y - bank.tileY) <= 1) { store.depositAll(); store.save() }
    else this.interactWith(bank.id)
  }

  private craftIfNear(station: 'furnace' | 'anvil') {
    const ent = this.entities.find((e) => e.kind === 'station' && e.refId === station)
    if (!ent) return
    const p = this.playerTile()
    if (Math.abs(p.x - ent.tileX) <= 1 && Math.abs(p.y - ent.tileY) <= 1) actions.tryCraft(station)
    else this.interactWith(ent.id)
  }

  update(_time: number, delta: number) {
    this.updateMovement(delta)
    this.updateActions(delta)
    this.respawnTick()
  }

  private updateMovement(delta: number) {
    if (!this.moving || this.path.length === 0) return
    const next = this.path[0]
    const targetX = next.x * TILE + TILE / 2
    const targetY = next.y * TILE + TILE / 2
    const dx = targetX - this.player.x
    const dy = targetY - this.player.y
    const dist = Math.hypot(dx, dy)
    const step = (BASE_MOVE_SPEED * delta) / 1000
    if (dist <= step) {
      this.player.setPosition(targetX, targetY)
      this.path.shift()
      store.state.x = next.x
      store.state.y = next.y
      if (this.path.length === 0) {
        this.moving = false
        const cb = this.onArrive
        this.onArrive = null
        cb?.()
        if (actions.intent.type === 'idle') store.setActivity(null)
      }
      return
    }
    this.player.x += (dx / dist) * step
    this.player.y += (dy / dist) * step
    this.player.setFlipX(dx < 0)
  }

  private updateActions(delta: number) {
    if (this.moving) return
    if (actions.intent.type === 'gather') {
      const result = actions.tickGather(delta)
      if (result?.depleted) {
        const ent = this.entities.find((e) => e.id === result.depleted)
        if (ent) this.tweens.add({ targets: ent.sprite, alpha: 0.55, duration: 120, yoyo: true })
      }
    }
    if (actions.intent.type === 'combat') {
      const objectId = actions.intent.objectId
      const result = actions.tickCombat(delta)
      if (result?.enemyDead) {
        const ent = this.entities.find((e) => e.id === objectId)
        if (ent) {
          ent.alive = false
          ent.sprite.setVisible(false)
          const enemy = ENEMIES[ent.refId!]
          this.time.delayedCall(10000, () => { ent.alive = true; ent.sprite.setVisible(true).setAlpha(1); store.setToast(`${enemy.name} returned`, 1000) })
        }
      }
      if (result?.playerDead) {
        const bank = this.entities.find((e) => e.kind === 'bank')
        if (bank) {
          this.player.setPosition(bank.tileX * TILE + TILE / 2, (bank.tileY + 1) * TILE + TILE / 2)
          store.state.x = bank.tileX
          store.state.y = bank.tileY + 1
        }
      }
    }
  }

  private respawnTick() {}
}
