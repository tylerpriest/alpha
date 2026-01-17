import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PauseMenuScene } from './scenes/PauseMenuScene';
import { SettingsScene } from './scenes/SettingsScene';
import { LoadGameScene } from './scenes/LoadGameScene';
import { SaveGameScene } from './scenes/SaveGameScene';
import './styles/ui.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene, PauseMenuScene, SettingsScene, LoadGameScene, SaveGameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
