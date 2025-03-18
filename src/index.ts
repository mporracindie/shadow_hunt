import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [TitleScene, GameScene]
};

// Create the game with the configuration
const game = new Phaser.Game(config); 