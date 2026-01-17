import Phaser from 'phaser';
import { TopBar } from './components/TopBar';
import { BuildMenu } from './components/BuildMenu';
import { Sidebar } from './components/Sidebar';
import { RoomInfoPanel } from './components/RoomInfoPanel';
import { VictoryOverlay } from './components/VictoryOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { EconomyBreakdownPanel } from './components/EconomyBreakdownPanel';
import { Notification, NotificationType } from './components/Notification';

export class UIManager {
  private registry: Phaser.Data.DataManager;
  private overlay: HTMLDivElement;
  private sidebar: Sidebar;
  private topBar: TopBar;
  private buildMenu: BuildMenu;
  private roomInfoPanel: RoomInfoPanel;
  private victoryOverlay: VictoryOverlay;
  private gameOverOverlay: GameOverOverlay;
  private economyBreakdownPanel: EconomyBreakdownPanel;
  private notification: Notification;

  constructor(registry: Phaser.Data.DataManager) {
    this.registry = registry;

    // Create or get overlay container
    this.overlay = document.getElementById('ui-overlay') as HTMLDivElement;
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'ui-overlay';
      document.body.appendChild(this.overlay);
    }

    // Add scanline overlay
    const scanlines = document.createElement('div');
    scanlines.className = 'scanlines';
    document.body.appendChild(scanlines);

    // Add grid pattern overlay
    const gridPattern = document.createElement('div');
    gridPattern.className = 'grid-pattern';
    document.body.appendChild(gridPattern);

    // Create UI components
    this.sidebar = new Sidebar(this.overlay);
    this.topBar = new TopBar(this.overlay);
    this.buildMenu = new BuildMenu(this.overlay, (roomType) => {
      this.registry.set('selectedRoom', roomType);
    });
    
    // Set up Credits click handler (will be called from GameScene)
    this.topBar.setOnCreditsClick(() => {
      // Emit event that GameScene can listen to
      const event = new CustomEvent('show-economy-breakdown');
      document.dispatchEvent(event);
    });
    this.roomInfoPanel = new RoomInfoPanel(this.overlay);
    this.victoryOverlay = new VictoryOverlay(this.overlay);
    this.gameOverOverlay = new GameOverOverlay(this.overlay);
    this.economyBreakdownPanel = new EconomyBreakdownPanel(this.overlay);
    this.notification = new Notification(this.overlay);

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
    this.registry.events.on('changedata-starRating', (_: Phaser.Game, value: number) => {
      this.topBar.updateStars(value);
    });
    this.registry.events.on('changedata-averageSatisfaction', (_: Phaser.Game, value: number | undefined) => {
      this.topBar.updateSatisfaction(value);
    });
    this.registry.events.on('changedata-selectedRoom', (_: Phaser.Game, value: string) => {
      this.buildMenu.setSelected(value);
    });
    this.registry.events.on('changedata-selectedRoomId', (_: Phaser.Game, value: string | null) => {
      // Room info panel will be updated by GameScene via registry
      if (!value) {
        this.roomInfoPanel.hide();
      }
    });
    this.registry.events.on('changedata-roomInfo', (_: Phaser.Game, data: any) => {
      if (data) {
        this.roomInfoPanel.show(
          data.id,
          data.type,
          data.residents || 0,
          data.workers || 0,
          data.income || 0,
          data.expenses || 0
        );
      } else {
        this.roomInfoPanel.hide();
      }
    });
  }

  showVictory(cycles: number, population: number, credits: number, rooms: number): void {
    this.victoryOverlay.show(cycles, population, credits, rooms);
  }

  hideVictory(): void {
    this.victoryOverlay.hide();
  }

  showGameOver(cycles: number, maxPopulation: number, credits: number): void {
    this.gameOverOverlay.show(cycles, maxPopulation, credits);
  }

  hideGameOver(): void {
    this.gameOverOverlay.hide();
  }

  setVictoryCallbacks(onContinue?: () => void, onMainMenu?: () => void): void {
    this.victoryOverlay.setCallbacks(onContinue, onMainMenu);
  }

  setGameOverCallbacks(onRestart?: () => void, onMainMenu?: () => void): void {
    this.gameOverOverlay.setCallbacks(onRestart, onMainMenu);
  }

  showEconomyBreakdown(
    incomeBreakdown: any,
    expenseBreakdown: any,
    currentMoney: number,
    quarterlyRevenue: number,
    lastQuarterDay: number,
    currentDay: number,
    averageSatisfaction?: number
  ): void {
    this.economyBreakdownPanel.show(
      incomeBreakdown,
      expenseBreakdown,
      currentMoney,
      quarterlyRevenue,
      lastQuarterDay,
      currentDay,
      averageSatisfaction
    );
  }

  hideEconomyBreakdown(): void {
    this.economyBreakdownPanel.hide();
  }

  /**
   * Show a notification toast
   * @param message The message to display
   * @param type Notification type (success, info, warning, error)
   * @param duration Duration in milliseconds (default: 5000)
   */
  showNotification(message: string, type: NotificationType = 'info', duration?: number): string {
    return this.notification.show(message, type, duration);
  }

  /**
   * Show a success notification
   */
  showSuccess(message: string, duration?: number): string {
    return this.notification.showSuccess(message, duration);
  }

  /**
   * Show an info notification
   */
  showInfo(message: string, duration?: number): string {
    return this.notification.showInfo(message, duration);
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string, duration?: number): string {
    return this.notification.showWarning(message, duration);
  }

  /**
   * Show an error notification
   */
  showError(message: string, duration?: number): string {
    return this.notification.showError(message, duration);
  }

  destroy(): void {
    this.sidebar.destroy();
    this.topBar.destroy();
    this.buildMenu.destroy();
    this.roomInfoPanel.destroy();
    this.victoryOverlay.destroy();
    this.gameOverOverlay.destroy();
    this.economyBreakdownPanel.destroy();
    this.notification.destroy();
  }
}
