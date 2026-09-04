import Phaser from 'phaser'
import { INVENTORY_SLOTS, ITEMS, SKILLS, xpForLevel } from '../data/catalog'
import { store } from '../systems/StateStore'

export class UIScene extends Phaser.Scene {
  private toastText!: Phaser.GameObjects.Text
  private activityText!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private skillTexts: Phaser.GameObjects.Text[] = []
  private invSlots: Phaser.GameObjects.Container[] = []
  private panelBg!: Phaser.GameObjects.Rectangle
  private mode: 'hud' | 'skills' | 'bank' = 'hud'

  constructor() {
    super('UI')
  }

  create() {
    const w = this.scale.width
    const h = this.scale.height

    this.add
      .text(16, 14, 'Stillwood', {
        fontFamily: 'Fraunces, serif',
        fontSize: '28px',
        color: '#e8f2e8',
      })
      .setScrollFactor(0)
      .setDepth(20)
      .setShadow(0, 2, '#1a2a20', 4, true, true)

    this.activityText = this.add
      .text(16, 48, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '15px',
        color: '#b7cbb8',
      })
      .setScrollFactor(0)
      .setDepth(20)

    this.hpText = this.add
      .text(w - 16, 18, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '16px',
        color: '#e8cfcf',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20)

    this.toastText = this.add
      .text(w / 2, h * 0.28, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '18px',
        color: '#f4f7f2',
        backgroundColor: '#1e3329cc',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(30)

    this.buildBottomBar(w, h)
    this.buildInventory(w, h)
    this.buildSkillPanel(w, h)

    this.game.events.on('bank-opened', () => {
      this.mode = 'bank'
    })

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.hpText.setX(gameSize.width - 16)
      this.toastText.setPosition(gameSize.width / 2, gameSize.height * 0.28)
    })
  }

  private buildBottomBar(w: number, h: number) {
    this.panelBg = this.add
      .rectangle(w / 2, h - 52, w, 104, 0x1a2b22, 0.92)
      .setScrollFactor(0)
      .setDepth(15)

    const buttons: { label: string; x: number; action: () => void }[] = [
      { label: 'Bag', x: w * 0.12, action: () => this.game.events.emit('ui-deposit') },
      { label: 'Skills', x: w * 0.31, action: () => { this.mode = this.mode === 'skills' ? 'hud' : 'skills' } },
      { label: 'Smelt', x: w * 0.5, action: () => this.game.events.emit('ui-craft', 'furnace') },
      { label: 'Smith', x: w * 0.69, action: () => this.game.events.emit('ui-craft', 'anvil') },
      { label: 'Stop', x: w * 0.88, action: () => this.game.events.emit('ui-cancel') },
    ]

    for (const btn of buttons) {
      const container = this.add.container(btn.x, h - 52).setScrollFactor(0).setDepth(16)
      const bg = this.add.rectangle(0, 0, 70, 40, 0x2f4a3c, 1).setStrokeStyle(1, 0x7a9e78, 0.35)
      const text = this.add.text(0, 0, btn.label, { fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: '#e8f2e8' }).setOrigin(0.5)
      container.add([bg, text])
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', btn.action).on('pointerover', () => bg.setFillStyle(0x3a5a48)).on('pointerout', () => bg.setFillStyle(0x2f4a3c))
    }
  }

  private buildInventory(w: number, h: number) {
    const cols = 7
    const size = 36
    const startX = w / 2 - ((cols - 1) * (size + 6)) / 2
    const y = h - 96

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      if (row > 1) continue
      const x = startX + col * (size + 6)
      const yy = y - row * (size + 6)
      const box = this.add.rectangle(x, yy, size, size, 0x24362c, 0.95).setStrokeStyle(1, 0x4a6b50, 0.5)
      const label = this.add.text(x, yy, '', { fontFamily: 'Source Sans 3, sans-serif', fontSize: '10px', color: '#d7e4d8', align: 'center', wordWrap: { width: size - 4 } }).setOrigin(0.5)
      const container = this.add.container(0, 0, [box, label]).setScrollFactor(0).setDepth(17)
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => { store.equipFromInventory(i); store.save() })
      this.invSlots.push(container)
      ;(container as Phaser.GameObjects.Container & { slotIndex: number; label: Phaser.GameObjects.Text }).slotIndex = i
      ;(container as Phaser.GameObjects.Container & { label: Phaser.GameObjects.Text }).label = label
    }
  }

  private buildSkillPanel(w: number, _h: number) {
    const panel = this.add.container(w - 8, 70).setScrollFactor(0).setDepth(18).setAlpha(0)
    panel.setData('root', true)
    const bg = this.add.rectangle(0, 0, 168, 220, 0x1a2b22, 0.94).setOrigin(1, 0).setStrokeStyle(1, 0x4a6b50, 0.4)
    panel.add(bg)
    SKILLS.forEach((skill, index) => {
      const text = this.add.text(-12, 12 + index * 28, '', { fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px', color: skill.color }).setOrigin(1, 0)
      panel.add(text)
      this.skillTexts.push(text)
    })
    this.registry.set('skillPanel', panel)
  }

  update() {
    const s = store.state
    this.activityText.setText(s.activity ?? 'Tap the world to begin')
    this.hpText.setText(`HP ${s.hitpoints}/${s.maxHitpoints}`)
    if (s.toast && performance.now() < s.toastUntil) {
      this.toastText.setText(s.toast).setAlpha(1)
    } else {
      this.toastText.setAlpha(Phaser.Math.Linear(this.toastText.alpha, 0, 0.08))
    }
    for (const container of this.invSlots) {
      const indexed = container as Phaser.GameObjects.Container & { slotIndex: number; label: Phaser.GameObjects.Text }
      const slot = s.inventory[indexed.slotIndex]
      if (!slot) { indexed.label.setText(''); continue }
      const name = ITEMS[slot.itemId].name
      indexed.label.setText(slot.amount > 1 ? `${name}\n×${slot.amount}` : name)
    }
    const panel = this.registry.get('skillPanel') as Phaser.GameObjects.Container
    panel.setAlpha(this.mode === 'skills' ? 1 : 0)
    SKILLS.forEach((skill, i) => {
      const level = store.getLevel(skill.id)
      const xp = s.skills[skill.id].xp
      const next = xpForLevel(level + 1)
      const pct = level >= 99 ? 100 : Math.floor(((xp - xpForLevel(level)) / (next - xpForLevel(level))) * 100)
      this.skillTexts[i].setText(`${skill.name}  ${level}  (${pct}%)`)
    })
    this.panelBg.setPosition(this.scale.width / 2, this.scale.height - 52)
    this.panelBg.setSize(this.scale.width, 104)
  }
}
