import Phaser from 'phaser'
import { BASE_MOVE_SPEED, ENEMIES, WORLD_COLS, WORLD_ROWS } from '../data/catalog'
import { WORLD_OBJECTS, buildBlockedGrid } from '../data/world'
import { depthForTile, screenToTile, tileToScreen } from '../iso'
import { actions } from '../systems/ActionSystem'
import { audio } from '../systems/Audio'
import { findPath } from '../systems/Pathfinding'
import { store } from '../systems/StateStore'

interface WorldEntity {
  id: string
  kind: string
  refId?: string
  tileX: number
  tileY: number
  sprite: Phaser.GameObjects.Image
  shadow?: Phaser.GameObjects.Image
  label?: Phaser.GameObjects.Text
  depletedUntil?: number
  alive: boolean
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private playerShadow!: Phaser.GameObjects.Image
  private marker!: Phaser.GameObjects.Image
  private blocked!: boolean[][]
  private entities: WorldEntity[] = []
  private path: { x: number; y: number }[] = []
  private moving = false
  private onArrive: (() => void) | null = null
  private mapOffsetX = 0
  private mapOffsetY = 0

  constructor() {
    super('World')
  }

  create() {
    audio.unlock()
    this.blocked = buildBlockedGrid(WORLD_COLS, WORLD_ROWS)
    this.mapOffsetX = this.scale.width / 2
    this.mapOffsetY = 140

    this.drawTerrain()
    this.spawnEntities()
    this.createPlayer()

    this.marker = this.add.image(0, 0, 'target').setAlpha(0)

    const bounds = this.computeBounds()
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.w, bounds.h)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.05)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > this.scale.height - 120) return
      if (this.game.registry.get('bankOpen')) return
      audio.unlock()
      audio.click()
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      this.handleTap(worldPoint.x, worldPoint.y)
    })

    this.events.on('ui-deposit', () => this.openBankFromUi())
    this.events.on('ui-craft', (station: 'furnace' | 'anvil') => this.craftIfNear(station))
    this.events.on('ui-cancel', () => {
      actions.cancel()
      this.path = []
      this.moving = false
      this.onArrive = null
      this.marker.setAlpha(0)
      audio.click()
    })

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.08,
      duration: 7000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  private computeBounds() {
    const pts = [
      tileToScreen(0, 0),
      tileToScreen(WORLD_COLS, 0),
      tileToScreen(0, WORLD_ROWS),
      tileToScreen(WORLD_COLS, WORLD_ROWS),
    ].map((p) => ({ x: p.x + this.mapOffsetX, y: p.y + this.mapOffsetY }))
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs) - 100
    const maxX = Math.max(...xs) + 100
    const minY = Math.min(...ys) - 100
    const maxY = Math.max(...ys) + 180
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
  }

  private screenPos(tx: number, ty: number) {
    const p = tileToScreen(tx, ty)
    return { x: p.x + this.mapOffsetX, y: p.y + this.mapOffsetY }
  }

  private drawTerrain() {
    for (let y = 0; y < WORLD_ROWS; y++) {
      for (let x = 0; x < WORLD_COLS; x++) {
        const key = this.blocked[y][x] ? (y === 0 && x < 8 ? 'cliff' : 'water') : 'grass'
        const pos = this.screenPos(x, y)
        this.add.image(pos.x, pos.y, key).setDepth(depthForTile(x, y))
      }
    }
  }

  private spawnEntities() {
    for (const obj of WORLD_OBJECTS) {
      const texture = this.textureFor(obj.kind, obj.refId)
      const pos = this.screenPos(obj.x, obj.y)
      const shadow = this.add.image(pos.x, pos.y + 8, 'shadow').setDepth(depthForTile(obj.x, obj.y, 0.2))
      const sprite = this.add
        .image(pos.x, pos.y - 8, texture)
        .setOrigin(0.5, 0.85)
        .setDepth(depthForTile(obj.x, obj.y, 1))
        .setInteractive({ useHandCursor: true })

      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.()
        if (this.game.registry.get('bankOpen')) return
        audio.unlock()
        audio.click()
        this.interactWith(obj.id)
      })

      if (obj.kind === 'enemy' || obj.kind === 'resource') {
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 2,
          duration: 1800 + Math.random() * 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        })
      }

      let label: Phaser.GameObjects.Text | undefined
      if (obj.label) {
        label = this.add
          .text(pos.x, pos.y - 54, obj.label, {
            fontFamily: 'Source Sans 3, sans-serif',
            fontSize: '13px',
            color: '#e8f0e8',
            stroke: '#1e3329',
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(depthForTile(obj.x, obj.y, 2))
      }

      if (obj.kind !== 'enemy') this.blocked[obj.y][obj.x] = true

      this.entities.push({
        id: obj.id,
        kind: obj.kind,
        refId: obj.refId,
        tileX: obj.x,
        tileY: obj.y,
        sprite,
        shadow,
        label,
        alive: true,
      })
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
    const pos = this.screenPos(store.state.x, store.state.y)
    this.playerShadow = this.add.image(pos.x, pos.y + 10, 'shadow').setDepth(depthForTile(store.state.x, store.state.y, 0.3))
    this.player = this.add
      .image(pos.x, pos.y - 8, 'player')
      .setOrigin(0.5, 0.9)
      .setDepth(depthForTile(store.state.x, store.state.y, 1.5))
    this.tweens.add({
      targets: this.player,
      scaleX: 1.03,
      scaleY: 0.97,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  private syncPlayerDepth() {
    const tile = this.playerTile()
    this.player.setDepth(depthForTile(tile.x, tile.y, 1.5))
    this.playerShadow.setDepth(depthForTile(tile.x, tile.y, 0.3))
    this.playerShadow.setPosition(this.player.x, this.player.y + 18)
  }

  private tileFromWorld(wx: number, wy: number) {
    const tile = screenToTile(wx - this.mapOffsetX, wy - this.mapOffsetY)
    return {
      x: Phaser.Math.Clamp(tile.x, 0, WORLD_COLS - 1),
      y: Phaser.Math.Clamp(tile.y, 0, WORLD_ROWS - 1),
    }
  }

  private playerTile() {
    return { x: store.state.x, y: store.state.y }
  }

  private handleTap(wx: number, wy: number) {
    const tile = this.tileFromWorld(wx, wy)
    const entity = this.entities.find(
      (e) => e.alive && e.tileX === tile.x && e.tileY === tile.y && e.sprite.visible,
    )
    if (entity) {
      this.interactWith(entity.id)
      return
    }
    this.walkTo(tile.x, tile.y, false)
  }

  private interactWith(id: string) {
    const entity = this.entities.find((e) => e.id === id && e.alive)
    if (!entity) return

    const pos = this.screenPos(entity.tileX, entity.tileY)
    this.marker
      .setPosition(pos.x, pos.y + 4)
      .setAlpha(1)
      .setDepth(depthForTile(entity.tileX, entity.tileY, 1.2))
    this.tweens.add({ targets: this.marker, alpha: 0.35, duration: 400, yoyo: true, repeat: 1 })

    if (entity.kind === 'resource') {
      this.walkTo(entity.tileX, entity.tileY, true, () => {
        actions.startGather(entity.id, entity.refId!)
      })
      return
    }

    if (entity.kind === 'bank') {
      this.walkTo(entity.tileX, entity.tileY, true, () => {
        actions.intent = { type: 'bank' }
        store.setActivity('At the bank')
        // Open bank panel — player can deposit or withdraw
        this.game.events.emit('bank-opened')
        audio.bank()
      })
      return
    }

    if (entity.kind === 'station') {
      const station = entity.refId as 'furnace' | 'anvil'
      this.walkTo(entity.tileX, entity.tileY, true, () => {
        actions.intent = { type: 'station', station }
        store.setActivity(station === 'furnace' ? 'Smelting' : 'Smithing')
        actions.tryCraft(station)
      })
      return
    }

    if (entity.kind === 'enemy') {
      this.walkTo(entity.tileX, entity.tileY, true, () => {
        actions.startCombat(entity.id, entity.refId!)
      })
    }
  }

  private walkTo(tx: number, ty: number, adjacent: boolean, onArrive?: () => void) {
    actions.cancel()
    const start = this.playerTile()
    const dx = Math.abs(start.x - tx)
    const dy = Math.abs(start.y - ty)

    if (adjacent && dx <= 1 && dy <= 1) {
      onArrive?.()
      return
    }
    if (!adjacent && dx === 0 && dy === 0) {
      onArrive?.()
      return
    }
    if (!adjacent && this.blocked[ty]?.[tx]) {
      store.setToast('Cannot walk there')
      return
    }

    const path = findPath(start, { x: tx, y: ty }, this.blocked, { adjacentGoal: adjacent })
    if (path.length === 0) {
      store.setToast('No path')
      return
    }

    this.path = path
    this.moving = true
    this.onArrive = onArrive ?? null
    store.setActivity('Walking')
    audio.step()
  }

  private openBankFromUi() {
    audio.click()
    const bank = this.entities.find((e) => e.kind === 'bank')
    if (!bank) return
    const p = this.playerTile()
    if (Math.abs(p.x - bank.tileX) <= 1 && Math.abs(p.y - bank.tileY) <= 1) {
      actions.intent = { type: 'bank' }
      store.setActivity('At the bank')
      this.game.events.emit('bank-opened')
      audio.bank()
    } else {
      this.interactWith(bank.id)
    }
  }

  private craftIfNear(station: 'furnace' | 'anvil') {
    audio.click()
    const ent = this.entities.find((e) => e.kind === 'station' && e.refId === station)
    if (!ent) return
    const p = this.playerTile()
    if (Math.abs(p.x - ent.tileX) <= 1 && Math.abs(p.y - ent.tileY) <= 1) {
      actions.tryCraft(station)
    } else {
      this.interactWith(ent.id)
    }
  }

  update(_time: number, delta: number) {
    this.updateMovement(delta)
    this.updateActions(delta)
  }

  private updateMovement(delta: number) {
    if (!this.moving || this.path.length === 0) return

    const next = this.path[0]
    const target = this.screenPos(next.x, next.y)
    const dx = target.x - this.player.x
    const dy = target.y - 8 - this.player.y
    const dist = Math.hypot(dx, dy)
    const step = (BASE_MOVE_SPEED * delta) / 1000

    if (dist <= step) {
      this.player.setPosition(target.x, target.y - 8)
      this.path.shift()
      store.state.x = next.x
      store.state.y = next.y
      this.syncPlayerDepth()
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
    this.syncPlayerDepth()
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
          ent.shadow?.setVisible(false)
          const enemy = ENEMIES[ent.refId!]
          this.time.delayedCall(10000, () => {
            ent.alive = true
            ent.sprite.setVisible(true).setAlpha(1)
            ent.shadow?.setVisible(true)
            store.setToast(`${enemy.name} returned`, 1000)
          })
        }
      }
      if (result?.playerDead) {
        const bank = this.entities.find((e) => e.kind === 'bank')
        if (bank) {
          const pos = this.screenPos(bank.tileX, bank.tileY + 1)
          this.player.setPosition(pos.x, pos.y - 8)
          store.state.x = bank.tileX
          store.state.y = bank.tileY + 1
          this.syncPlayerDepth()
        }
      }
    }
  }
}
