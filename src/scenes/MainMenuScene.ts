import Phaser from 'phaser';
import { VenusAtmosphere } from '../graphics/VenusAtmosphere';
import { GameState } from '../utils/types';

export class MainMenuScene extends Phaser.Scene {
  private venusAtmosphere!: VenusAtmosphere;
  private menuContainer!: HTMLDivElement;
  private continueButton!: HTMLButtonElement;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // Create Venus atmosphere background
    this.venusAtmosphere = new VenusAtmosphere(this);
    // @ts-expect-error - updateSkyGradient is private but needed for initialization
    this.venusAtmosphere.updateSkyGradient(6); // Dawn time

    // Create menu UI overlay
    this.createMenuUI();

    // Check if auto-save exists for Continue button
    this.updateContinueButton();
  }

  private createMenuUI(): void {
    // Create container
    this.menuContainer = document.createElement('div');
    this.menuContainer.className = 'main-menu glass-panel';
    this.menuContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      padding: 40px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'ARCOLOGY';
    title.style.cssText = `
      font-size: 48px;
      font-weight: 700;
      color: var(--primary);
      text-shadow: 0 0 20px rgba(0, 204, 170, 0.5);
      margin: 0 0 20px 0;
      letter-spacing: 4px;
    `;
    this.menuContainer.appendChild(title);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    `;

    // New Game button
    const newGameBtn = this.createMenuButton('New Game', () => {
      this.startNewGame();
    });
    buttonsContainer.appendChild(newGameBtn);

    // Continue button
    this.continueButton = this.createMenuButton('Continue', () => {
      this.loadAutoSave();
    });
    buttonsContainer.appendChild(this.continueButton);

    // Load Game button
    const loadGameBtn = this.createMenuButton('Load Game', () => {
      this.scene.start('LoadGameScene');
    });
    buttonsContainer.appendChild(loadGameBtn);

    // Settings button
    const settingsBtn = this.createMenuButton('Settings', () => {
      this.scene.start('SettingsScene');
    });
    buttonsContainer.appendChild(settingsBtn);

    this.menuContainer.appendChild(buttonsContainer);

    // Version badge
    const version = document.createElement('div');
    version.textContent = 'v0.1.0';
    version.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 12px;
      color: var(--text-muted);
      font-family: monospace;
    `;
    this.menuContainer.appendChild(version);

    document.body.appendChild(this.menuContainer);
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

  private updateContinueButton(): void {
    // Check if auto-save exists (slot 0)
    const autoSave = localStorage.getItem('arcology_save_0');
    if (autoSave) {
      this.continueButton.disabled = false;
      this.continueButton.style.opacity = '1';
      this.continueButton.style.cursor = 'pointer';
    } else {
      this.continueButton.disabled = true;
      this.continueButton.style.opacity = '0.5';
      this.continueButton.style.cursor = 'not-allowed';
    }
  }

  private startNewGame(): void {
    // Clear any existing game state
    this.registry.set('gameState', GameState.PLAYING);
    this.cleanup();
    this.scene.start('GameScene');
  }

  private loadAutoSave(): void {
    const autoSave = localStorage.getItem('arcology_save_0');
    if (!autoSave) return;

    // Set flag to load save on GameScene create
    this.registry.set('loadSaveSlot', 0);
    this.registry.set('gameState', GameState.PLAYING);
    this.cleanup();
    this.scene.start('GameScene');
  }

  private cleanup(): void {
    if (this.menuContainer && this.menuContainer.parentNode) {
      this.menuContainer.parentNode.removeChild(this.menuContainer);
    }
  }

  shutdown(): void {
    this.cleanup();
  }
}
