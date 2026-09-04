import Phaser from 'phaser'

function roundedRect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: number,
  alpha = 1,
) {
  g.fillStyle(color, alpha)
  g.fillRoundedRect(x, y, w, h, r)
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create() {
    this.makeTextures()
    this.scene.start('World')
    this.scene.launch('UI')
  }

  private makeTextures() {
    const mk = (key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w = 48, h = 48) => {
      const g = this.make.graphics({ x: 0, y: 0 })
      draw(g)
      g.generateTexture(key, w, h)
      g.destroy()
    }

    mk('grass', (g) => {
      roundedRect(g, 0, 0, 48, 48, 0, 0x3f5c45)
      g.fillStyle(0x4a6b50, 0.45)
      g.fillCircle(12, 18, 3)
      g.fillCircle(34, 28, 2)
      g.fillCircle(22, 36, 2)
    })

    mk('water', (g) => {
      roundedRect(g, 0, 0, 48, 48, 0, 0x3a5f74)
      g.fillStyle(0x4d7388, 0.5)
      g.fillEllipse(24, 24, 30, 10)
    })

    mk('cliff', (g) => {
      roundedRect(g, 0, 0, 48, 48, 0, 0x5a5348)
      g.fillStyle(0x6b6458, 1)
      g.fillRect(0, 18, 48, 8)
    })

    mk('player', (g) => {
      g.fillStyle(0x2a3630, 0.25)
      g.fillEllipse(24, 40, 22, 10)
      g.fillStyle(0xd7c4a5)
      g.fillCircle(24, 16, 8)
      g.fillStyle(0x4f7a62)
      g.fillRoundedRect(16, 22, 16, 18, 5)
      g.fillStyle(0x8b6914)
      g.fillRect(30, 26, 8, 3)
    })

    mk('tree', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 42, 26, 10)
      g.fillStyle(0x8b6914)
      g.fillRoundedRect(21, 28, 6, 14, 2)
      g.fillStyle(0x6f9a6c)
      g.fillCircle(24, 22, 14)
      g.fillStyle(0x86b07f)
      g.fillCircle(18, 18, 8)
      g.fillCircle(30, 16, 7)
    }, 48, 56)

    mk('oak', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 42, 28, 10)
      g.fillStyle(0x7a5a2e)
      g.fillRoundedRect(21, 26, 6, 16, 2)
      g.fillStyle(0x557a52)
      g.fillCircle(24, 18, 16)
      g.fillStyle(0x6a8f66)
      g.fillCircle(14, 16, 9)
      g.fillCircle(34, 14, 8)
    }, 48, 56)

    mk('rock', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 40, 28, 10)
      g.fillStyle(0x8a8f96)
      g.fillRoundedRect(8, 18, 32, 22, 8)
      g.fillStyle(0xb07a4a)
      g.fillCircle(18, 26, 4)
      g.fillCircle(28, 30, 3)
    })

    mk('tinrock', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 40, 28, 10)
      g.fillStyle(0x8a8f96)
      g.fillRoundedRect(8, 18, 32, 22, 8)
      g.fillStyle(0xc5ced6)
      g.fillCircle(18, 26, 4)
      g.fillCircle(28, 30, 3)
    })

    mk('bank', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 42, 30, 10)
      roundedRect(g, 8, 12, 32, 28, 4, 0x6b5a3e)
      g.fillStyle(0xc9b27a)
      g.fillRect(8, 12, 32, 6)
      g.fillStyle(0x3a3226)
      g.fillRect(20, 26, 8, 14)
    })

    mk('furnace', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 42, 28, 10)
      roundedRect(g, 10, 14, 28, 26, 4, 0x5a5a5a)
      g.fillStyle(0xd47a3a)
      g.fillCircle(24, 28, 7)
      g.fillStyle(0xf0c26a, 0.8)
      g.fillCircle(24, 28, 3)
    })

    mk('anvil', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 42, 28, 10)
      g.fillStyle(0x4a4f56)
      g.fillRoundedRect(12, 22, 24, 14, 3)
      g.fillRect(18, 16, 18, 8)
      g.fillRect(20, 34, 8, 6)
    })

    mk('rat', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 40, 22, 8)
      g.fillStyle(0x8a6a5a)
      g.fillEllipse(24, 28, 22, 14)
      g.fillCircle(34, 22, 7)
      g.fillStyle(0x2a2420)
      g.fillCircle(36, 21, 2)
    })

    mk('goblin', (g) => {
      g.fillStyle(0x2a3630, 0.2)
      g.fillEllipse(24, 42, 20, 8)
      g.fillStyle(0x6d8a5a)
      g.fillRoundedRect(16, 20, 16, 18, 5)
      g.fillCircle(24, 14, 8)
      g.fillStyle(0x2a3630)
      g.fillCircle(21, 13, 2)
      g.fillCircle(27, 13, 2)
    })

    mk('target', (g) => {
      g.lineStyle(2, 0xf0e6c8, 0.85)
      g.strokeCircle(24, 24, 16)
      g.strokeCircle(24, 24, 6)
    })

    mk('shadow', (g) => {
      g.fillStyle(0x1a241e, 0.25)
      g.fillEllipse(24, 24, 28, 12)
    })
  }
}
