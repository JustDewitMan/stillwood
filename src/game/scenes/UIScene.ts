import Phaser from 'phaser'
import { INVENTORY_SLOTS, ITEMS, SKILLS, xpForLevel } from '../data/catalog'
import type { ItemId } from '../data/types'
import { audio } from '../systems/Audio'
import { store } from '../systems/StateStore'

type UiMode = 'hud' | 'skills' | 'bank'

export class UIScene extends Phaser.Scene {
  private toastText!: Phaser.GameObjects.Text
  private activityText!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private skillTexts: Phaser.GameObjects.Text[] = []
  private invLabels: Phaser.GameObjects.Text[] = []
  private panelBg!: Phaser.GameObjects.Rectangle
  private skillPanel!: Phaser.GameObjects.Container
  private bankPanel!: Phaser.GameObjects.Container
  private bankSlots: Phaser.GameObjects.Container[] = []
  private mode: UiMode = 'hud'

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
      .setDepth(40)
      .setShadow(0, 2, '#1a2a20', 4, true, true)

    this.activityText = this.add
      .text(16, 48, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '15px',
        color: '#b7cbb8',
      })
      .setScrollFactor(0)
      .setDepth(40)

    this.hpText = this.add
      .text(w - 16, 18, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '16px',
        color: '#e8cfcf',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(40)

    this.toastText = this.add
      .text(w / 2, h * 0.26, '', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '18px',
        color: '#f4f7f2',
        backgroundColor: '#1e3329cc',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(60)

    this.buildBottomBar(w, h)
    this.buildInventory(w, h)
    this.buildSkillPanel(w)
    this.buildBankPanel(w, h)

    this.game.events.on('bank-opened', () => this.openBank())

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.hpText.setX(gameSize.width - 16)
      this.toastText.setPosition(gameSize.width / 2, gameSize.height * 0.26)
    })
  }

  private buildBottomBar(w: number, h: number) {
    this.panelBg = this.add
      .rectangle(w / 2, h - 52, w, 104, 0x1a2b22, 0.92)
      .setScrollFactor(0)
      .setDepth(30)

    const buttons: { label: string; x: number; action: () => void }[] = [
      {
        label: 'Bank',
        x: w * 0.12,
        action: () => {
          audio.click()
          this.game.events.emit('ui-deposit')
        },
      },
      {
        label: 'Skills',
        x: w * 0.31,
        action: () => {
          audio.click()
          if (this.mode === 'bank') this.closeBank()
          this.mode = this.mode === 'skills' ? 'hud' : 'skills'
        },
      },
      {
        label: 'Smelt',
        x: w * 0.5,
        action: () => {
          audio.click()
          this.game.events.emit('ui-craft', 'furnace')
        },
      },
      {
        label: 'Smith',
        x: w * 0.69,
        action: () => {
          audio.click()
          this.game.events.emit('ui-craft', 'anvil')
        },
      },
      {
        label: 'Stop',
        x: w * 0.88,
        action: () => {
          audio.click()
          this.game.events.emit('ui-cancel')
        },
      },
    ]

    for (const btn of buttons) {
      const container = this.add.container(btn.x, h - 52).setScrollFactor(0).setDepth(31)
      const bg = this.add.rectangle(0, 0, 70, 40, 0x2f4a3c, 1).setStrokeStyle(1, 0x7a9e78, 0.35)
      const text = this.add
        .text(0, 0, btn.label, {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '14px',
          color: '#e8f2e8',
        })
        .setOrigin(0.5)
      container.add([bg, text])
      bg.setInteractive({ useHandCursor: true })
        .on('pointerdown', btn.action)
        .on('pointerover', () => bg.setFillStyle(0x3a5a48))
        .on('pointerout', () => bg.setFillStyle(0x2f4a3c))
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
      const box = this.add
        .rectangle(x, yy, size, size, 0x24362c, 0.95)
        .setStrokeStyle(1, 0x4a6b50, 0.5)
        .setScrollFactor(0)
        .setDepth(32)
      const label = this.add
        .text(x, yy, '', {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '10px',
          color: '#d7e4d8',
          align: 'center',
          wordWrap: { width: size - 4 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(33)

      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        audio.click()
        store.equipFromInventory(i)
        store.save()
      })
      this.invLabels[i] = label
    }
  }

  private buildSkillPanel(w: number) {
    this.skillPanel = this.add.container(w - 8, 70).setScrollFactor(0).setDepth(45).setAlpha(0)
    const bg = this.add
      .rectangle(0, 0, 176, 230, 0x1a2b22, 0.94)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0x4a6b50, 0.4)
    this.skillPanel.add(bg)

    SKILLS.forEach((skill, index) => {
      const text = this.add
        .text(-12, 12 + index * 28, '', {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '14px',
          color: skill.color,
        })
        .setOrigin(1, 0)
      this.skillPanel.add(text)
      this.skillTexts.push(text)
    })
  }

  private buildBankPanel(w: number, h: number) {
    this.bankPanel = this.add.container(w / 2, h / 2 - 30).setScrollFactor(0).setDepth(50).setAlpha(0)
    this.bankPanel.setVisible(false)

    const bg = this.add
      .rectangle(0, 0, Math.min(360, w - 24), 320, 0x16241d, 0.96)
      .setStrokeStyle(2, 0x7a9e78, 0.45)
    const title = this.add
      .text(0, -138, 'Bank', {
        fontFamily: 'Fraunces, serif',
        fontSize: '24px',
        color: '#e8f2e8',
      })
      .setOrigin(0.5)
    const hint = this.add
      .text(0, -112, 'Tap an item to withdraw · Deposit puts your bag away', {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '13px',
        color: '#a7bba8',
      })
      .setOrigin(0.5)

    this.bankPanel.add([bg, title, hint])

    // Bank grid
    const cols = 5
    const size = 52
    const startX = -((cols - 1) * (size + 8)) / 2
    const startY = -70
    for (let i = 0; i < 20; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (size + 8)
      const y = startY + row * (size + 8)
      const slotBg = this.add.rectangle(x, y, size, size, 0x24362c, 1).setStrokeStyle(1, 0x4a6b50, 0.55)
      const label = this.add
        .text(x, y, '', {
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '11px',
          color: '#d7e4d8',
          align: 'center',
          wordWrap: { width: size - 6 },
        })
        .setOrigin(0.5)
      const slot = this.add.container(0, 0, [slotBg, label])
      slotBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        const bankItem = store.state.bank[i]
        if (!bankItem) return
        audio.bank()
        const amount = bankItem.amount > 1 && ITEMS[bankItem.itemId].stackable ? Math.min(bankItem.amount, 5) : 1
        if (store.withdrawItem(bankItem.itemId as ItemId, amount)) {
          store.save()
          this.refreshBankSlots()
        }
      })
      this.bankPanel.add(slot)
      this.bankSlots.push(slot)
      ;(slot as Phaser.GameObjects.Container & { label: Phaser.GameObjects.Text }).label = label
    }

    // Deposit / Close buttons
    const depositBtn = this.makePanelButton(-70, 130, 'Deposit all', () => {
      audio.bank()
      store.depositAll()
      store.save()
      this.refreshBankSlots()
    })
    const closeBtn = this.makePanelButton(70, 130, 'Close', () => this.closeBank())
    this.bankPanel.add([depositBtn, closeBtn])
  }

  private makePanelButton(x: number, y: number, label: string, action: () => void) {
    const container = this.add.container(x, y)
    const bg = this.add.rectangle(0, 0, 120, 40, 0x2f4a3c, 1).setStrokeStyle(1, 0x7a9e78, 0.4)
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: '15px',
        color: '#e8f2e8',
      })
      .setOrigin(0.5)
    container.add([bg, text])
    bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', action)
      .on('pointerover', () => bg.setFillStyle(0x3a5a48))
      .on('pointerout', () => bg.setFillStyle(0x2f4a3c))
    return container
  }

  private openBank() {
    this.mode = 'bank'
    this.game.registry.set('bankOpen', true)
    this.bankPanel.setVisible(true).setAlpha(1)
    this.skillPanel.setAlpha(0)
    this.refreshBankSlots()
  }

  private closeBank() {
    this.mode = 'hud'
    this.game.registry.set('bankOpen', false)
    this.bankPanel.setVisible(false).setAlpha(0)
    audio.click()
    if (store.state.activity === 'At the bank') store.setActivity(null)
  }

  private refreshBankSlots() {
    for (let i = 0; i < this.bankSlots.length; i++) {
      const slot = this.bankSlots[i] as Phaser.GameObjects.Container & { label: Phaser.GameObjects.Text }
      const item = store.state.bank[i]
      if (!item) {
        slot.label.setText('')
        continue
      }
      const name = ITEMS[item.itemId]?.name ?? item.itemId
      slot.label.setText(item.amount > 1 ? `${name}\n×${item.amount}` : name)
    }
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

    for (let i = 0; i < this.invLabels.length; i++) {
      const label = this.invLabels[i]
      if (!label) continue
      const slot = s.inventory[i]
      if (!slot) {
        label.setText('')
        continue
      }
      const name = ITEMS[slot.itemId]?.name ?? slot.itemId
      label.setText(slot.amount > 1 ? `${name}\n×${slot.amount}` : name)
    }

    this.skillPanel.setAlpha(this.mode === 'skills' ? 1 : 0)
    SKILLS.forEach((skill, i) => {
      const level = store.getLevel(skill.id)
      const xp = s.skills[skill.id].xp
      const next = xpForLevel(level + 1)
      const pct =
        level >= 99 ? 100 : Math.floor(((xp - xpForLevel(level)) / Math.max(1, next - xpForLevel(level))) * 100)
      this.skillTexts[i].setText(`${skill.name}  ${level}  (${pct}%)`)
    })

    if (this.mode === 'bank') this.refreshBankSlots()

    this.panelBg.setPosition(this.scale.width / 2, this.scale.height - 52)
    this.panelBg.setSize(this.scale.width, 104)
  }
}
