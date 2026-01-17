import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { SaveSlotMeta } from '../utils/types';
import type { GameScene } from './GameScene';

export class SaveGameScene extends Phaser.Scene {
  private overlayContainer!: HTMLDivElement;
  private saveSystem!: SaveSystem;

  constructor() {
    super({ key: 'SaveGameScene' });
  }

  create(): void {
    // Get reference to GameScene
    // Use scene.manager to get the scene if it exists
    const gameScene = this.scene.manager.getScene('GameScene') as GameScene | undefined;
    if (gameScene && gameScene.building && gameScene.saveSystem) {
      this.saveSystem = gameScene.saveSystem;
      this.createSaveGameUI();
    } else {
      // GameScene not available - show error
      this.createErrorUI();
    }
  }

  private createErrorUI(): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.cssText = `
      width: 500px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      text-align: center;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Cannot Save';
    title.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      color: var(--secondary);
      margin: 0;
    `;

    const message = document.createElement('p');
    message.textContent = 'No active game to save.';
    message.style.cssText = `
      color: var(--text-secondary);
      margin: 0;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.className = 'menu-button';
    backBtn.style.cssText = `
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
      margin-top: 10px;
    `;
    backBtn.addEventListener('click', () => {
      this.scene.start('PauseMenuScene');
    });

    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(backBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    this.overlayContainer = overlay;

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('PauseMenuScene');
    });
  }

  private createSaveGameUI(): void {
    // Create overlay background
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create menu container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'save-game-menu glass-panel';
    this.overlayContainer.style.cssText = `
      width: 600px;
      max-height: 80vh;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'SAVE GAME';
    title.style.cssText = `
      font-size: 32px;
      font-weight: 700;
      color: var(--primary);
      text-shadow: 0 0 15px rgba(0, 204, 170, 0.5);
      margin: 0 0 20px 0;
      letter-spacing: 2px;
      text-align: center;
    `;
    this.overlayContainer.appendChild(title);

    // Create save slots container
    const slotsContainer = document.createElement('div');
    slotsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Get save slot metadata
    const slots = this.saveSystem.getSlotMetadata();

    // Create slot buttons (skip auto-save slot 0)
    for (let slot = 1; slot <= 3; slot++) {
      const slotMeta = slots[slot];
      const slotButton = this.createSlotButton(slotMeta, () => {
        this.saveSlot(slot);
      });
      slotsContainer.appendChild(slotButton);
    }

    this.overlayContainer.appendChild(slotsContainer);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.className = 'menu-button';
    backBtn.style.cssText = `
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
      margin-top: 10px;
    `;
    backBtn.addEventListener('click', () => {
      this.scene.start('PauseMenuScene');
    });
    this.overlayContainer.appendChild(backBtn);

    overlay.appendChild(this.overlayContainer);
    document.body.appendChild(overlay);

    // ESC key to go back
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('PauseMenuScene');
    });
  }

  private createSlotButton(slot: SaveSlotMeta, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'save-slot-button';
    button.style.cssText = `
      width: 100%;
      padding: 20px;
      background: rgba(30, 40, 38, 0.8);
      border: 2px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    const slotLabel = `Slot ${slot.slot}`;

    if (slot.isEmpty) {
      button.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${slotLabel}</div>
        <div style="font-size: 14px; color: var(--text-secondary);">Empty - Click to save</div>
      `;
    } else {
      const date = new Date(slot.timestamp);
      const dateStr = date.toLocaleString();
      const moneyStr = slot.money.toLocaleString();

      button.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 18px; font-weight: 600;">${slotLabel}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${dateStr}</div>
        </div>
        <div style="display: flex; gap: 20px; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
          <div>Cycle: ${slot.dayCount}</div>
          <div>Residents: ${slot.population}</div>
          <div>Credits: ${moneyStr} CR</div>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">Click to overwrite</div>
      `;
    }

    button.addEventListener('click', () => {
      // Show confirmation if overwriting
      if (!slot.isEmpty) {
        if (confirm(`Overwrite save in ${slotLabel}?`)) {
          onClick();
        }
      } else {
        onClick();
      }
    });

    button.addEventListener('mouseenter', () => {
      button.style.borderColor = 'var(--primary)';
      button.style.background = 'rgba(0, 204, 170, 0.1)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.borderColor = 'var(--border-color)';
      button.style.background = 'rgba(30, 40, 38, 0.8)';
    });

    return button;
  }

  private saveSlot(slot: number): void {
    if (!this.saveSystem) {
      console.error('SaveSystem not available');
      return;
    }

    const result = this.saveSystem.saveGame(slot);
    if (result.success) {
      // Show success message
      const message = document.createElement('div');
      message.textContent = 'Game saved successfully!';
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 204, 170, 0.9);
        color: #000;
        padding: 20px 40px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 400;
        pointer-events: none;
      `;
      document.body.appendChild(message);

      setTimeout(() => {
        message.remove();
        // Refresh UI to show updated slot
        this.cleanup();
        this.create();
      }, 1500);
    } else {
      // Show error message
      alert(`Failed to save: ${result.error}`);
    }
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
