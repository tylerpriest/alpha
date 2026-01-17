import Phaser from 'phaser';
import { GRID_SIZE } from '../utils/constants';

export class BuildingFrame {
  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;

  private groundY = 500;
  private buildingRight = 1280;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);

    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setDepth(1);
    this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);
  }

  draw(topFloor: number): void {
    this.graphics.clear();
    this.glowGraphics.clear();

    const topY = this.groundY - (topFloor + 2) * GRID_SIZE;
    const frameColor = 0x2a2a3a;
    const accentColor = 0x4a8ae4;

    // Left structural column
    this.drawColumn(-40, topY, this.groundY, frameColor, accentColor);

    // Right structural column
    this.drawColumn(this.buildingRight + 8, topY, this.groundY, frameColor, accentColor);

    // Horizontal floor beams on the exterior
    for (let floor = 0; floor <= topFloor + 1; floor++) {
      const beamY = this.groundY - floor * GRID_SIZE;

      // Left beam extension
      this.graphics.fillStyle(frameColor, 1);
      this.graphics.fillRect(-40, beamY - 4, 44, 8);

      // Right beam extension
      this.graphics.fillRect(this.buildingRight - 4, beamY - 4, 44, 8);

      // Floor number on right side (every 5 floors or if it's the lobby)
      if (floor % 5 === 0 || floor === 0) {
        this.drawFloorNumber(this.buildingRight + 20, beamY, floor);
      }
    }

    // Diagonal support beams (industrial look)
    this.drawDiagonalSupports(topY, frameColor);

    // Roof structure
    this.drawRoof(topY - GRID_SIZE, frameColor, accentColor);
  }

  private drawColumn(x: number, topY: number, bottomY: number, color: number, accent: number): void {
    const width = 32;
    const height = bottomY - topY;

    // Main column
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRect(x, topY, width, height);

    // Column segments (industrial detailing)
    this.graphics.fillStyle(0x1a1a2a, 1);
    for (let y = topY; y < bottomY; y += GRID_SIZE) {
      this.graphics.fillRect(x + 4, y + 2, width - 8, 4);
      this.graphics.fillRect(x + 4, y + GRID_SIZE - 6, width - 8, 4);
    }

    // Accent lighting strip
    this.glowGraphics.fillStyle(accent, 0.3);
    this.glowGraphics.fillRect(x + width / 2 - 2, topY, 4, height);

    this.graphics.fillStyle(accent, 0.8);
    this.graphics.fillRect(x + width / 2 - 1, topY, 2, height);
  }

  private drawDiagonalSupports(topY: number, color: number): void {
    const height = this.groundY - topY;
    const segmentHeight = Math.min(height, GRID_SIZE * 4);

    // Left side diagonals
    for (let y = topY; y < this.groundY; y += segmentHeight) {
      const endY = Math.min(y + segmentHeight, this.groundY);
      this.graphics.lineStyle(3, color, 0.7);
      this.graphics.lineBetween(-8, y, -40, endY);
    }

    // Right side diagonals
    for (let y = topY; y < this.groundY; y += segmentHeight) {
      const endY = Math.min(y + segmentHeight, this.groundY);
      this.graphics.lineStyle(3, color, 0.7);
      this.graphics.lineBetween(this.buildingRight + 8, y, this.buildingRight + 40, endY);
    }
  }

  private drawRoof(y: number, color: number, accent: number): void {
    // Roof platform
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRect(-50, y, this.buildingRight + 100, 20);

    // Roof edge detail
    this.graphics.fillStyle(0x1a1a2a, 1);
    this.graphics.fillRect(-50, y, this.buildingRight + 100, 4);

    // Antenna/equipment
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRect(this.buildingRight / 2 - 4, y - 40, 8, 40);

    // Antenna light
    this.glowGraphics.fillStyle(0xe44a4a, 0.6);
    this.glowGraphics.fillCircle(this.buildingRight / 2, y - 44, 6);
    this.graphics.fillStyle(0xe44a4a, 1);
    this.graphics.fillCircle(this.buildingRight / 2, y - 44, 3);

    // Solar panels or equipment
    for (let i = 0; i < 4; i++) {
      const px = 100 + i * 250;
      this.graphics.fillStyle(0x2a3a4a, 1);
      this.graphics.fillRect(px, y - 15, 80, 12);
      // Panel glow
      this.glowGraphics.fillStyle(accent, 0.2);
      this.glowGraphics.fillRect(px + 2, y - 13, 76, 8);
    }
  }

  private drawFloorNumber(x: number, y: number, _floor: number): void {
    // Floor indicator background
    this.graphics.fillStyle(0x1a1a2a, 0.9);
    this.graphics.fillRoundedRect(x - 2, y - 12, 24, 18, 3);

    // Floor indicator glow
    this.glowGraphics.lineStyle(1, 0x4ae4e4, 0.3);
    this.glowGraphics.strokeRoundedRect(x - 2, y - 12, 24, 18, 3);
  }

  destroy(): void {
    this.graphics.destroy();
    this.glowGraphics.destroy();
  }
}
