import Phaser from 'phaser';
import { ROOM_SPECS, GRID_SIZE, UI_COLORS, RoomType } from '../utils/constants';

export class UIScene extends Phaser.Scene {
  private ghostPreview: Phaser.GameObjects.Graphics | null = null;
  private ghostGlow: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Create ghost preview graphics
    this.ghostPreview = this.add.graphics();
    this.ghostPreview.setDepth(100);

    this.ghostGlow = this.add.graphics();
    this.ghostGlow.setDepth(99);
    this.ghostGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Listen for mouse move to update ghost preview
    const gameScene = this.scene.get('GameScene');
    gameScene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updateGhostPreview(pointer, gameScene);
    });

    // Hide ghost when no room selected
    this.registry.events.on('changedata-selectedRoom', () => {
      // Ghost will be redrawn on next mouse move
    });
  }

  private updateGhostPreview(pointer: Phaser.Input.Pointer, gameScene: Phaser.Scene): void {
    if (!this.ghostPreview || !this.ghostGlow) return;

    this.ghostPreview.clear();
    this.ghostGlow.clear();

    const selectedRoom = this.registry.get('selectedRoom') as RoomType | undefined;
    if (!selectedRoom) return;

    const spec = ROOM_SPECS[selectedRoom];
    const camera = gameScene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);

    const groundY = 500;
    const floor = Math.floor((groundY - worldPoint.y) / GRID_SIZE);
    const position = Math.floor(worldPoint.x / GRID_SIZE);

    // Calculate ghost position
    const x = position * GRID_SIZE;
    const y = groundY - (floor + 1) * GRID_SIZE;
    const w = spec.width * GRID_SIZE;
    const h = GRID_SIZE;

    // Check if placement is valid (simple check - floor range)
    const isValid = floor >= spec.minFloor && floor <= spec.maxFloor && position >= 0;

    const color = isValid ? UI_COLORS.validPlacement : UI_COLORS.invalidPlacement;

    // Draw ghost glow
    this.ghostGlow.fillStyle(color, 0.15);
    this.ghostGlow.fillRect(x - camera.scrollX, y - camera.scrollY, w, h);

    // Draw ghost border
    this.ghostPreview.lineStyle(2, color, 0.8);
    this.ghostPreview.strokeRect(x - camera.scrollX, y - camera.scrollY, w, h);

    // Draw room type indicator
    this.ghostPreview.fillStyle(color, 0.3);
    this.ghostPreview.fillRect(x - camera.scrollX + 2, y - camera.scrollY + 2, w - 4, h - 4);
  }
}
