import Phaser from 'phaser';
import { TopBar } from './components/TopBar';
import { BuildMenu } from './components/BuildMenu';

export class UIManager {
  private registry: Phaser.Data.DataManager;
  private overlay: HTMLDivElement;
  private topBar: TopBar;
  private buildMenu: BuildMenu;

  constructor(registry: Phaser.Data.DataManager) {
    this.registry = registry;

    // Create or get overlay container
    this.overlay = document.getElementById('ui-overlay') as HTMLDivElement;
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'ui-overlay';
      document.body.appendChild(this.overlay);
    }

    // Create UI components
    this.topBar = new TopBar(this.overlay);
    this.buildMenu = new BuildMenu(this.overlay, (roomType) => {
      this.registry.set('selectedRoom', roomType);
    });

    // Listen to registry changes
    this.registry.events.on('changedata-money', (_: Phaser.Game, value: number) => {
      this.topBar.updateMoney(value);
    });
    this.registry.events.on('changedata-day', (_: Phaser.Game, value: number) => {
      this.topBar.updateDay(value);
    });
    this.registry.events.on('changedata-hour', (_: Phaser.Game, value: number) => {
      this.topBar.updateTime(value);
    });
    this.registry.events.on('changedata-food', (_: Phaser.Game, value: number) => {
      this.topBar.updateFood(value);
    });
    this.registry.events.on('changedata-population', (_: Phaser.Game, value: number) => {
      this.topBar.updatePopulation(value);
    });
    this.registry.events.on('changedata-selectedRoom', (_: Phaser.Game, value: string) => {
      this.buildMenu.setSelected(value);
    });
  }

  destroy(): void {
    this.topBar.destroy();
    this.buildMenu.destroy();
  }
}
