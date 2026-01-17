import Phaser from 'phaser';
import { GameState } from '../utils/types';

export class PauseMenuScene extends Phaser.Scene {
  private overlayContainer!: HTMLDivElement;
  private gameScene!: Phaser.Scene;

  constructor() {
    super({ key: 'PauseMenuScene' });
  }

  create(): void {
    // Get reference to GameScene
    this.gameScene = this.scene.get('GameScene');

    // Pause the game
    if (this.gameScene && this.gameScene.scene.isActive()) {
      const timeSystem = (this.gameScene as any).timeSystem;
      if (timeSystem) {
        timeSystem.setSpeed(0); // Pause
      }
    }

    this.registry.set('gameState', GameState.PAUSED);

    // Create pause menu overlay
    this.createPauseMenu();
  }

  private createPauseMenu(): void {
    // Create overlay background
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create menu container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'pause-menu glass-panel';
    this.overlayContainer.style.cssText = `
      width: 400px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'PAUSED';
    title.style.cssText = `
      font-size: 36px;
      font-weight: 700;
      color: var(--primary);
      text-shadow: 0 0 15px rgba(0, 204, 170, 0.5);
      margin: 0 0 20px 0;
      letter-spacing: 2px;
    `;
    this.overlayContainer.appendChild(title);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    `;

    // Resume button
    const resumeBtn = this.createMenuButton('Resume', () => {
      this.resume();
    });
    buttonsContainer.appendChild(resumeBtn);

    // Save Game button
    const saveGameBtn = this.createMenuButton('Save Game', () => {
      this.scene.start('SaveGameScene');
    });
    buttonsContainer.appendChild(saveGameBtn);

    // Settings button
    const settingsBtn = this.createMenuButton('Settings', () => {
      this.scene.start('SettingsScene');
    });
    buttonsContainer.appendChild(settingsBtn);

    // Quit to Main Menu button
    const quitBtn = this.createMenuButton('Quit to Main Menu', () => {
      this.quitToMainMenu();
    });
    buttonsContainer.appendChild(quitBtn);

    this.overlayContainer.appendChild(buttonsContainer);
    overlay.appendChild(this.overlayContainer);
    document.body.appendChild(overlay);

    // ESC key to resume
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resume();
    });
  }

  private createMenuButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'menu-button';
    button.style.cssText = `
      width: 100%;
      padding: 16px 24px;
      background: rgba(30, 40, 38, 0.8);
      border: 2px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Space Grotesk', sans-serif;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(40, 55, 50, 0.9)';
      button.style.borderColor = 'var(--primary)';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 15px rgba(0, 204, 170, 0.3)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(30, 40, 38, 0.8)';
      button.style.borderColor = 'var(--border-color)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', onClick);

    return button;
  }

  private resume(): void {
    // Resume game
    if (this.gameScene && this.gameScene.scene.isActive()) {
      const timeSystem = (this.gameScene as any).timeSystem;
      if (timeSystem) {
        timeSystem.setSpeed(1); // Resume at 1x
      }
    }

    this.registry.set('gameState', GameState.PLAYING);
    this.cleanup();
    this.scene.stop();
  }

  private quitToMainMenu(): void {
    // Stop GameScene
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');

    // Clean up
    this.cleanup();

    // Return to main menu
    this.scene.start('MainMenuScene');
  }

  private cleanup(): void {
    const overlay = this.overlayContainer?.parentNode;
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  shutdown(): void {
    this.cleanup();
  }
}
