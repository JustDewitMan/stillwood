import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { UIScene } from './scenes/UIScene'
import { WorldScene } from './scenes/WorldScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#1e3329',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    activePointers: 3,
  },
  render: {
    antialias: true,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  scene: [BootScene, WorldScene, UIScene],
  banner: false,
}

const game = new Phaser.Game(config)

game.events.on('ui-deposit', () => {
  const world = game.scene.getScene('World') as WorldScene
  world.events.emit('ui-deposit')
})
game.events.on('ui-craft', (station: 'furnace' | 'anvil') => {
  const world = game.scene.getScene('World') as WorldScene
  world.events.emit('ui-craft', station)
})
game.events.on('ui-cancel', () => {
  const world = game.scene.getScene('World') as WorldScene
  world.events.emit('ui-cancel')
})

export default game
