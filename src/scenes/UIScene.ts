import Phaser from 'phaser';
import { ROOM_SPECS } from '../utils/constants';

export class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private foodText!: Phaser.GameObjects.Text;
  private populationText!: Phaser.GameObjects.Text;
  private selectedRoomText!: Phaser.GameObjects.Text;
  private roomButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Top bar background
    const topBar = this.add.rectangle(640, 25, 1280, 50, 0x1a1a2e, 0.9);
    topBar.setOrigin(0.5, 0.5);

    // Resource display
    this.moneyText = this.add.text(20, 15, '$10,000', {
      fontSize: '20px',
      color: '#4aff4a',
    });

    this.foodText = this.add.text(150, 15, 'Food: 0', {
      fontSize: '20px',
      color: '#ffa64a',
    });

    this.populationText = this.add.text(280, 15, 'Pop: 0', {
      fontSize: '20px',
      color: '#4a9eff',
    });

    // Time display
    this.dayText = this.add.text(1100, 10, 'Day 1', {
      fontSize: '16px',
      color: '#ffffff',
    });

    this.timeText = this.add.text(1100, 30, '6:00 AM', {
      fontSize: '14px',
      color: '#aaaaaa',
    });

    // Build menu (bottom)
    this.createBuildMenu();

    // Selected room indicator
    this.selectedRoomText = this.add.text(640, 680, 'Select a room to build', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Listen to registry changes
    this.registry.events.on('changedata-money', this.updateMoney, this);
    this.registry.events.on('changedata-day', this.updateDay, this);
    this.registry.events.on('changedata-hour', this.updateTime, this);
    this.registry.events.on('changedata-food', this.updateFood, this);
    this.registry.events.on('changedata-population', this.updatePopulation, this);
  }

  private createBuildMenu(): void {
    const menuY = 650;
    const startX = 100;
    const spacing = 120;

    const roomTypes = Object.keys(ROOM_SPECS) as Array<keyof typeof ROOM_SPECS>;

    roomTypes.forEach((roomType, index) => {
      const x = startX + index * spacing;
      const button = this.createRoomButton(x, menuY, roomType);
      this.roomButtons.push(button);
    });
  }

  private createRoomButton(x: number, y: number, roomType: string): Phaser.GameObjects.Container {
    const spec = ROOM_SPECS[roomType as keyof typeof ROOM_SPECS];
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 100, 60, 0x333344, 1);
    bg.setStrokeStyle(2, 0x4a4a5a);
    bg.setInteractive({ useHandCursor: true });

    // Room name
    const name = this.add.text(0, -15, roomType.charAt(0).toUpperCase() + roomType.slice(1), {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Cost
    const cost = this.add.text(0, 10, `$${spec.cost.toLocaleString()}`, {
      fontSize: '12px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    container.add([bg, name, cost]);

    // Click handler
    bg.on('pointerdown', () => {
      this.selectRoom(roomType);
    });

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x444455);
    });

    bg.on('pointerout', () => {
      const selected = this.registry.get('selectedRoom');
      if (selected !== roomType) {
        bg.setFillStyle(0x333344);
      }
    });

    return container;
  }

  private selectRoom(roomType: string): void {
    this.registry.set('selectedRoom', roomType);

    const spec = ROOM_SPECS[roomType as keyof typeof ROOM_SPECS];
    this.selectedRoomText.setText(
      `Building: ${roomType.charAt(0).toUpperCase() + roomType.slice(1)} ($${spec.cost.toLocaleString()})`
    );
    this.selectedRoomText.setColor('#4a9eff');

    // Update button visuals
    this.roomButtons.forEach((container, index) => {
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      const roomTypes = Object.keys(ROOM_SPECS);
      if (roomTypes[index] === roomType) {
        bg.setFillStyle(0x4a9eff);
        bg.setStrokeStyle(2, 0x6abeff);
      } else {
        bg.setFillStyle(0x333344);
        bg.setStrokeStyle(2, 0x4a4a5a);
      }
    });
  }

  private updateMoney(_parent: Phaser.Game, value: number): void {
    this.moneyText.setText(`$${value.toLocaleString()}`);
    this.moneyText.setColor(value >= 0 ? '#4aff4a' : '#ff4a4a');
  }

  private updateDay(_parent: Phaser.Game, value: number): void {
    this.dayText.setText(`Day ${value}`);
  }

  private updateTime(_parent: Phaser.Game, value: number): void {
    const hour = Math.floor(value);
    const minute = Math.floor((value - hour) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    this.timeText.setText(`${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`);
  }

  private updateFood(_parent: Phaser.Game, value: number): void {
    this.foodText.setText(`Food: ${Math.floor(value)}`);
  }

  private updatePopulation(_parent: Phaser.Game, value: number): void {
    this.populationText.setText(`Pop: ${value}`);
  }
}
