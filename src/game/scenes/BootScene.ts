import Phaser from 'phaser'
import { ISO_H, ISO_W } from '../iso'

function diamond(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  color: number,
  alpha = 1,
) {
  g.fillStyle(color, alpha)
  g.beginPath()
  g.moveTo(cx, cy - h / 2)
  g.lineTo(cx + w / 2, cy)
  g.lineTo(cx, cy + h / 2)
  g.lineTo(cx - w / 2, cy)
  g.closePath()
  g.fillPath()
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
    const mk = (key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) => {
      const g = this.make.graphics({ x: 0, y: 0 })
      draw(g)
      g.generateTexture(key, w, h)
      g.destroy()
    }

    // Isometric floor diamonds
    mk(
      'grass',
      (g) => {
        diamond(g, ISO_W / 2, ISO_H / 2, ISO_W - 2, ISO_H - 2, 0x4a6a4e)
        diamond(g, ISO_W / 2, ISO_H / 2 - 1, ISO_W - 8, ISO_H - 6, 0x5a7d5c, 0.55)
        g.fillStyle(0x6f8f6c, 0.35)
        g.fillCircle(ISO_W / 2 - 8, ISO_H / 2, 2)
        g.fillCircle(ISO_W / 2 + 10, ISO_H / 2 + 2, 1.5)
      },
      ISO_W,
      ISO_H,
    )

    mk(
      'water',
      (g) => {
        diamond(g, ISO_W / 2, ISO_H / 2, ISO_W - 2, ISO_H - 2, 0x3a5f74)
        diamond(g, ISO_W / 2, ISO_H / 2 - 1, ISO_W - 10, ISO_H - 8, 0x4d7388, 0.45)
      },
      ISO_W,
      ISO_H,
    )

    mk(
      'cliff',
      (g) => {
        diamond(g, ISO_W / 2, ISO_H / 2, ISO_W - 2, ISO_H - 2, 0x5a5348)
        diamond(g, ISO_W / 2, ISO_H / 2 - 2, ISO_W - 10, ISO_H - 8, 0x6b6458, 0.7)
      },
      ISO_W,
      ISO_H,
    )

    // Taller character for 45° view
    mk(
      'player',
      (g) => {
        g.fillStyle(0x1a241e, 0.28)
        g.fillEllipse(32, 70, 28, 12)
        // legs
        g.fillStyle(0x3a4a40)
        g.fillRoundedRect(24, 48, 7, 18, 3)
        g.fillRoundedRect(34, 48, 7, 18, 3)
        // body / tunic
        g.fillStyle(0x4f7a62)
        g.fillRoundedRect(22, 28, 20, 24, 6)
        g.fillStyle(0x6a9878)
        g.fillRoundedRect(24, 30, 16, 8, 3)
        // head
        g.fillStyle(0xd7c4a5)
        g.fillCircle(32, 22, 9)
        // hair
        g.fillStyle(0x5a4030)
        g.fillEllipse(32, 16, 16, 10)
        // eyes
        g.fillStyle(0x2a2420)
        g.fillCircle(29, 22, 1.4)
        g.fillCircle(35, 22, 1.4)
        // axe on back
        g.fillStyle(0x8b6914)
        g.fillRect(40, 32, 10, 3)
        g.fillStyle(0x8a8f96)
        g.fillTriangle(48, 28, 54, 33, 48, 38)
      },
      64,
      80,
    )

    mk(
      'tree',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(40, 88, 36, 14)
        g.fillStyle(0x7a5a2e)
        g.fillRoundedRect(36, 52, 8, 30, 3)
        g.fillStyle(0x4f7a4c)
        g.fillCircle(40, 42, 22)
        g.fillStyle(0x6a9a66)
        g.fillCircle(28, 38, 12)
        g.fillCircle(52, 36, 11)
        g.fillCircle(40, 28, 12)
      },
      80,
      96,
    )

    mk(
      'oak',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(44, 92, 42, 14)
        g.fillStyle(0x6a4a24)
        g.fillRoundedRect(39, 50, 10, 36, 3)
        g.fillStyle(0x3f6a40)
        g.fillCircle(44, 40, 26)
        g.fillStyle(0x5a8a56)
        g.fillCircle(28, 38, 14)
        g.fillCircle(60, 34, 13)
        g.fillCircle(44, 24, 14)
      },
      88,
      100,
    )

    mk(
      'rock',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(36, 52, 40, 14)
        g.fillStyle(0x8a8f96)
        g.fillRoundedRect(12, 18, 48, 30, 10)
        g.fillStyle(0x9aa0a8)
        g.fillEllipse(28, 28, 22, 12)
        g.fillStyle(0xb07a4a)
        g.fillCircle(26, 32, 5)
        g.fillCircle(40, 36, 4)
      },
      72,
      60,
    )

    mk(
      'tinrock',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(36, 52, 40, 14)
        g.fillStyle(0x8a8f96)
        g.fillRoundedRect(12, 18, 48, 30, 10)
        g.fillStyle(0xc5ced6)
        g.fillCircle(26, 32, 5)
        g.fillCircle(40, 36, 4)
      },
      72,
      60,
    )

    mk(
      'bank',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(40, 70, 44, 14)
        // building body
        g.fillStyle(0x6b5a3e)
        g.fillRoundedRect(16, 24, 48, 40, 4)
        // roof
        g.fillStyle(0x8b6914)
        g.fillTriangle(12, 28, 40, 8, 68, 28)
        g.fillStyle(0xc9b27a)
        g.fillRect(16, 24, 48, 6)
        // door
        g.fillStyle(0x3a3226)
        g.fillRoundedRect(34, 40, 12, 24, 2)
        // window
        g.fillStyle(0xd7e4d0, 0.7)
        g.fillRect(22, 36, 8, 8)
        g.fillRect(50, 36, 8, 8)
      },
      80,
      80,
    )

    mk(
      'furnace',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(32, 60, 36, 12)
        g.fillStyle(0x5a5a5a)
        g.fillRoundedRect(14, 20, 36, 34, 5)
        g.fillStyle(0xd47a3a)
        g.fillCircle(32, 38, 10)
        g.fillStyle(0xf0c26a, 0.85)
        g.fillCircle(32, 38, 4)
        g.fillStyle(0x8a8f96)
        g.fillRect(24, 14, 16, 8)
      },
      64,
      68,
    )

    mk(
      'anvil',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(32, 52, 36, 12)
        g.fillStyle(0x4a4f56)
        g.fillRoundedRect(14, 28, 36, 16, 3)
        g.fillRect(22, 18, 28, 12)
        g.fillRect(26, 42, 12, 8)
        g.fillStyle(0x6a7078)
        g.fillRect(18, 30, 28, 4)
      },
      64,
      60,
    )

    mk(
      'rat',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(30, 44, 28, 10)
        g.fillStyle(0x8a6a5a)
        g.fillEllipse(28, 30, 28, 16)
        g.fillCircle(42, 22, 9)
        g.fillStyle(0x6a4a3a)
        g.fillTriangle(48, 18, 56, 16, 48, 24)
        g.fillStyle(0x2a2420)
        g.fillCircle(44, 21, 2)
      },
      60,
      52,
    )

    mk(
      'goblin',
      (g) => {
        g.fillStyle(0x1a241e, 0.22)
        g.fillEllipse(28, 58, 26, 10)
        g.fillStyle(0x3a4a38)
        g.fillRoundedRect(20, 36, 8, 18, 2)
        g.fillRoundedRect(30, 36, 8, 18, 2)
        g.fillStyle(0x6d8a5a)
        g.fillRoundedRect(18, 22, 22, 20, 6)
        g.fillCircle(29, 14, 10)
        g.fillStyle(0x4a6a3a)
        g.fillTriangle(22, 10, 18, 2, 26, 8)
        g.fillTriangle(36, 10, 40, 2, 32, 8)
        g.fillStyle(0x2a3630)
        g.fillCircle(26, 14, 2)
        g.fillCircle(32, 14, 2)
      },
      56,
      64,
    )

    mk(
      'target',
      (g) => {
        g.lineStyle(2, 0xf0e6c8, 0.85)
        g.strokeEllipse(32, 16, 40, 20)
        g.strokeEllipse(32, 16, 14, 8)
      },
      64,
      32,
    )

    mk(
      'shadow',
      (g) => {
        g.fillStyle(0x1a241e, 0.28)
        g.fillEllipse(24, 12, 40, 16)
      },
      48,
      24,
    )
  }
}
