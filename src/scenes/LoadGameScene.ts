import Phaser from 'phaser';
import { SaveSlotMeta } from '../utils/types';

export class LoadGameScene extends Phaser.Scene {
  private overlayContainer!: HTMLDivElement;

  constructor() {
    super({ key: 'LoadGameScene' });
  }

  create(): void {
    // Create a temporary GameScene reference to initialize SaveSystem
    // In practice, SaveSystem will be created in GameScene
    this.createLoadGameUI();
  }

  private createLoadGameUI(): void {
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
    this.overlayContainer.className = 'load-game-menu glass-panel';
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
    title.textContent = 'LOAD GAME';
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
    const slots = this.getSaveSlotMetadata();

    // Create slot buttons
    slots.forEach((slot) => {
      const slotButton = this.createSlotButton(slot, () => {
        this.loadSlot(slot.slot);
      });
      slotsContainer.appendChild(slotButton);
    });

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
      this.scene.start('MainMenuScene');
    });
    this.overlayContainer.appendChild(backBtn);

    overlay.appendChild(this.overlayContainer);
    document.body.appendChild(overlay);

    // ESC key to go back
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private getSaveSlotMetadata(): SaveSlotMeta[] {
    // We need to get metadata from localStorage directly since SaveSystem needs GameScene
    const slots: SaveSlotMeta[] = [];
    const storageKeys = ['arcology_save_0', 'arcology_save_1', 'arcology_save_2', 'arcology_save_3'];

    for (let slot = 0; slot <= 3; slot++) {
      const json = localStorage.getItem(storageKeys[slot]);
      if (!json) {
        slots.push({
          slot,
          isEmpty: true,
          timestamp: 0,
          dayCount: 0,
          population: 0,
          money: 0,
        });
      } else {
        try {
          const saveData = JSON.parse(json);
          slots.push({
            slot,
            isEmpty: false,
            timestamp: saveData.timestamp,
            dayCount: saveData.time.day,
            population: saveData.residents.length,
            money: saveData.economy.money,
          });
        } catch {
          slots.push({
            slot,
            isEmpty: true,
            timestamp: 0,
            dayCount: 0,
            population: 0,
            money: 0,
          });
        }
      }
    }

    return slots;
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
      cursor: ${slot.isEmpty ? 'default' : 'pointer'};
      transition: all 0.2s ease;
      opacity: ${slot.isEmpty ? 0.5 : 1};
    `;

    if (slot.isEmpty) {
      const slotLabel = slot.slot === 0 ? 'Auto-Save' : `Slot ${slot.slot}`;
      button.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${slotLabel}</div>
        <div style="font-size: 14px; color: var(--text-secondary);">Empty</div>
      `;
    } else {
      const slotLabel = slot.slot === 0 ? 'Auto-Save' : `Slot ${slot.slot}`;
      const date = new Date(slot.timestamp);
      const dateStr = date.toLocaleString();
      const moneyStr = slot.money.toLocaleString();

      button.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 18px; font-weight: 600;">${slotLabel}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${dateStr}</div>
        </div>
        <div style="display: flex; gap: 20px; font-size: 14px; color: var(--text-secondary);">
          <div>Cycle: ${slot.dayCount}</div>
          <div>Residents: ${slot.population}</div>
          <div>Credits: ${moneyStr} CR</div>
        </div>
      `;

      button.addEventListener('click', onClick);
      button.addEventListener('mouseenter', () => {
        if (!slot.isEmpty) {
          button.style.borderColor = 'var(--primary)';
          button.style.background = 'rgba(0, 204, 170, 0.1)';
        }
      });
      button.addEventListener('mouseleave', () => {
        if (!slot.isEmpty) {
          button.style.borderColor = 'var(--border-color)';
          button.style.background = 'rgba(30, 40, 38, 0.8)';
        }
      });
    }

    return button;
  }

  private loadSlot(slot: number): void {
    // Store the slot to load in registry
    this.registry.set('loadSaveSlot', slot);
    // Start GameScene - it will check for loadSaveSlot and load the save
    this.scene.start('GameScene');
  }

  shutdown(): void {
    const overlay = this.overlayContainer?.parentNode;
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}
