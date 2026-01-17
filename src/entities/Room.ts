import Phaser from 'phaser';
import { ROOM_SPECS, GRID_SIZE, RoomType, UI_COLORS } from '../utils/constants';
import { RoomData } from '../utils/types';
import { Resident } from './Resident';

export class Room {
  public readonly id: string;
  public readonly type: RoomType;
  public readonly floor: number;
  public readonly position: number;
  public readonly width: number;

  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private interiorGraphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private residents: Resident[] = [];
  private workers: Resident[] = [];
  private isSelected = false;

  constructor(scene: Phaser.Scene, data: RoomData) {
    this.id = data.id;
    this.type = data.type;
    this.floor = data.floor;
    this.position = data.position;
    this.width = data.width;

    // Create graphics layers
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);

    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setDepth(9);
    this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);

    this.interiorGraphics = scene.add.graphics();
    this.interiorGraphics.setDepth(11);

    this.label = scene.add.text(0, 0, '', {
      fontSize: '11px',
      color: '#e4e4e4',
      fontFamily: 'Space Grotesk, sans-serif',
    });
    this.label.setDepth(12);

    this.draw();
  }

  private draw(): void {
    const spec = ROOM_SPECS[this.type];
    const groundY = 500;

    const x = this.position * GRID_SIZE;
    const y = groundY - (this.floor + 1) * GRID_SIZE;
    const w = this.width * GRID_SIZE;
    const h = GRID_SIZE;

    this.graphics.clear();
    this.glowGraphics.clear();
    this.interiorGraphics.clear();

    // Calculate occupancy for brightness
    const isOccupied = this.residents.length > 0 || this.workers.length > 0;
    const brightness = isOccupied ? 1 : 0.6;

    // Room background with dark fill
    const baseColor = this.adjustBrightness(spec.color, brightness);
    this.graphics.fillStyle(baseColor, 1);
    this.graphics.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Neon accent border (inner glow effect)
    const accentColor = spec.accentColor;
    this.graphics.lineStyle(2, accentColor, 0.9);
    this.graphics.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Outer glow for accent (additive blend)
    this.glowGraphics.lineStyle(4, accentColor, 0.3);
    this.glowGraphics.strokeRect(x, y, w, h);

    // Draw interior details based on room type
    this.drawInteriorDetails(x, y, w, h, accentColor, isOccupied);

    // Selection border (if selected)
    if (this.isSelected) {
      this.graphics.lineStyle(3, UI_COLORS.selection, 1);
      this.graphics.strokeRect(x - 1, y - 1, w + 2, h + 2);
    }

    // Room label
    const displayName = this.type.charAt(0).toUpperCase() + this.type.slice(1);
    this.label.setText(displayName);
    this.label.setPosition(x + 6, y + 4);
    this.label.setAlpha(0.9);
  }

  private drawInteriorDetails(x: number, y: number, w: number, h: number, accent: number, occupied: boolean): void {
    const alpha = occupied ? 0.7 : 0.4;

    switch (this.type) {
      case 'lobby':
        // Floor pattern lines
        this.interiorGraphics.lineStyle(1, accent, alpha * 0.3);
        for (let i = 0; i < w; i += 20) {
          this.interiorGraphics.lineBetween(x + i, y + h - 4, x + i + 10, y + h - 4);
        }
        break;

      case 'apartment':
        // Bed shape
        this.interiorGraphics.fillStyle(accent, alpha * 0.4);
        this.interiorGraphics.fillRect(x + 10, y + h - 20, 30, 14);
        // Window glow
        this.interiorGraphics.fillStyle(0x4a6a8a, alpha * 0.5);
        this.interiorGraphics.fillRect(x + w - 25, y + 10, 15, 20);
        break;

      case 'office':
        // Desk shapes
        this.interiorGraphics.fillStyle(0x5a5a6a, alpha);
        for (let i = 0; i < 3; i++) {
          this.interiorGraphics.fillRect(x + 15 + i * 60, y + h - 25, 40, 18);
        }
        // Computer screens (glowing)
        this.interiorGraphics.fillStyle(accent, alpha * 0.6);
        for (let i = 0; i < 3; i++) {
          this.interiorGraphics.fillRect(x + 25 + i * 60, y + h - 40, 20, 12);
        }
        break;

      case 'farm':
        // Grow lights
        this.interiorGraphics.fillStyle(accent, alpha * 0.7);
        for (let i = 0; i < 4; i++) {
          this.interiorGraphics.fillRect(x + 20 + i * 55, y + 8, 30, 4);
        }
        // Plant rows
        this.interiorGraphics.fillStyle(0x2a4a2a, alpha);
        for (let i = 0; i < 3; i++) {
          this.interiorGraphics.fillRect(x + 15 + i * 70, y + h - 30, 50, 24);
        }
        break;

      case 'kitchen':
        // Counter
        this.interiorGraphics.fillStyle(0x5a5a5a, alpha);
        this.interiorGraphics.fillRect(x + 10, y + h - 25, w - 20, 18);
        // Warm light strips
        this.interiorGraphics.fillStyle(accent, alpha * 0.5);
        this.interiorGraphics.fillRect(x + 15, y + 15, w - 30, 3);
        break;
    }
  }

  private adjustBrightness(color: number, factor: number): number {
    const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
    const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
    const b = Math.min(255, Math.round((color & 0xff) * factor));
    return (r << 16) | (g << 8) | b;
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.draw();
  }

  redraw(): void {
    this.draw();
  }

  getWorldPosition(): { x: number; y: number } {
    const groundY = 500;
    return {
      x: this.position * GRID_SIZE + (this.width * GRID_SIZE) / 2,
      y: groundY - (this.floor + 0.5) * GRID_SIZE,
    };
  }

  addResident(resident: Resident): void {
    if (!this.residents.includes(resident)) {
      this.residents.push(resident);
    }
  }

  removeResident(resident: Resident): void {
    const index = this.residents.indexOf(resident);
    if (index !== -1) {
      this.residents.splice(index, 1);
    }
  }

  getResidents(): Resident[] {
    return this.residents;
  }

  getResidentCount(): number {
    return this.residents.length;
  }

  addWorker(resident: Resident): void {
    if (!this.workers.includes(resident)) {
      this.workers.push(resident);
    }
  }

  removeWorker(resident: Resident): void {
    const index = this.workers.indexOf(resident);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
  }

  getWorkers(): Resident[] {
    return this.workers;
  }

  getWorkerCount(): number {
    return this.workers.length;
  }

  hasCapacity(): boolean {
    const spec = ROOM_SPECS[this.type];
    if ('capacity' in spec) {
      return this.residents.length < spec.capacity;
    }
    return false;
  }

  hasJobOpenings(): boolean {
    const spec = ROOM_SPECS[this.type];
    if ('jobs' in spec) {
      return this.workers.length < spec.jobs;
    }
    return false;
  }

  destroy(): void {
    this.graphics.destroy();
    this.glowGraphics.destroy();
    this.interiorGraphics.destroy();
    this.label.destroy();
  }
}
