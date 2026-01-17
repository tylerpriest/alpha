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
  private scene: Phaser.Scene;
  private residents: Resident[] = [];
  private workers: Resident[] = [];
  private isSelected = false;

  constructor(scene: Phaser.Scene, data: RoomData) {
    this.id = data.id;
    this.type = data.type;
    this.floor = data.floor;
    this.position = data.position;
    this.width = data.width;
    this.scene = scene;

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

    // Get current hour from registry for night glow effects
    const hour = (this.scene.registry.get('hour') as number) ?? 12;
    const nightIntensity = this.getNightIntensity(hour);

    // Room background with dark fill
    const baseColor = this.adjustBrightness(spec.color, brightness);
    this.graphics.fillStyle(baseColor, 1);
    this.graphics.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Neon accent border (inner glow effect)
    // Enhanced during night hours
    const accentColor = spec.accentColor;
    const borderAlpha = 0.9 + nightIntensity * 0.1; // 0.9 to 1.0
    this.graphics.lineStyle(2, accentColor, borderAlpha);
    this.graphics.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Outer glow for accent (additive blend)
    // Empty rooms: 40% base glow (0.4), Occupied: 60% base (0.6)
    // Enhanced during night: +0.2 to +0.4 intensity
    const baseGlowAlpha = isOccupied ? 0.6 : 0.4; // Spec: empty = 40%, occupied = full
    const nightGlowBoost = nightIntensity * 0.3; // Up to 30% additional glow at night
    const glowAlpha = Math.min(1.0, baseGlowAlpha + nightGlowBoost);
    this.glowGraphics.lineStyle(4, accentColor, glowAlpha);
    this.glowGraphics.strokeRect(x, y, w, h);

    // Draw interior details based on room type
    this.drawInteriorDetails(x, y, w, h, accentColor, isOccupied, nightIntensity);

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

  /**
   * Calculate night intensity (0-1) based on hour.
   * Returns 1.0 during full night (8 PM - 6 AM), with transitions at dawn/dusk.
   */
  private getNightIntensity(hour: number): number {
    // Night hours: 8 PM (20) to 6 AM (6)
    if (hour >= 20 || hour < 6) {
      return 1.0;
    } else if (hour >= 6 && hour < 8) {
      // Dawn - fading from night to day
      return 1.0 - (hour - 6) / 2;
    } else if (hour >= 18 && hour < 20) {
      // Dusk - fading from day to night
      return (hour - 18) / 2;
    }
    return 0.0;
  }

  private drawInteriorDetails(x: number, y: number, w: number, h: number, accent: number, occupied: boolean, nightIntensity: number): void {
    const alpha = occupied ? 0.9 : 0.5;
    // Base glow: empty = 40% (0.4), occupied = 60% (0.6)
    // Enhanced during night
    const baseGlowAlpha = occupied ? 0.6 : 0.4;
    const nightGlowBoost = nightIntensity * 0.2;
    const glowAlpha = Math.min(1.0, baseGlowAlpha + nightGlowBoost);

    switch (this.type) {
      case 'lobby':
        // Floor tiles
        this.interiorGraphics.fillStyle(0x1a1a1a, 0.5);
        for (let i = 0; i < w - 8; i += 24) {
          this.interiorGraphics.fillRect(x + 4 + i, y + h - 16, 20, 10);
        }
        // Neon floor strips
        this.interiorGraphics.fillStyle(accent, glowAlpha);
        this.interiorGraphics.fillRect(x + 4, y + h - 6, w - 8, 2);
        // Reception desk
        this.interiorGraphics.fillStyle(0x2a2a2a, alpha);
        this.interiorGraphics.fillRect(x + w / 2 - 30, y + h - 30, 60, 24);
        // Desk screen
        this.interiorGraphics.fillStyle(accent, glowAlpha);
        this.interiorGraphics.fillRect(x + w / 2 - 10, y + h - 45, 20, 12);
        break;

      case 'apartment':
        // Bed frame
        this.interiorGraphics.fillStyle(0x2a2020, alpha);
        this.interiorGraphics.fillRect(x + 8, y + h - 24, 45, 18);
        // Bed glow accent
        this.interiorGraphics.fillStyle(accent, glowAlpha * 0.4);
        this.interiorGraphics.fillRect(x + 8, y + h - 24, 45, 2);
        // Nightstand
        this.interiorGraphics.fillStyle(0x2a2020, alpha);
        this.interiorGraphics.fillRect(x + 56, y + h - 20, 12, 14);
        // Lamp glow
        this.interiorGraphics.fillStyle(accent, glowAlpha);
        this.interiorGraphics.fillCircle(x + 62, y + h - 28, 4);
        // Wall screen/window
        this.interiorGraphics.fillStyle(0x1a3a4a, alpha);
        this.interiorGraphics.fillRect(x + w - 35, y + 8, 25, 30);
        // Screen glow
        this.interiorGraphics.fillStyle(0x4a8aca, glowAlpha * 0.5);
        this.interiorGraphics.fillRect(x + w - 33, y + 10, 21, 26);
        // Ceiling light strip
        this.interiorGraphics.fillStyle(accent, glowAlpha * 0.3);
        this.interiorGraphics.fillRect(x + 10, y + 4, w - 20, 2);
        break;

      case 'office': {
        // Multiple workstations
        const deskCount = Math.floor((w - 20) / 70);
        for (let i = 0; i < deskCount; i++) {
          const dx = x + 15 + i * 70;
          // Desk
          this.interiorGraphics.fillStyle(0x2a2a30, alpha);
          this.interiorGraphics.fillRect(dx, y + h - 26, 55, 20);
          // Monitor
          this.interiorGraphics.fillStyle(0x1a1a20, alpha);
          this.interiorGraphics.fillRect(dx + 10, y + h - 44, 30, 18);
          // Screen glow
          this.interiorGraphics.fillStyle(accent, glowAlpha);
          this.interiorGraphics.fillRect(dx + 12, y + h - 42, 26, 14);
          // Keyboard
          this.interiorGraphics.fillStyle(0x3a3a3a, alpha * 0.7);
          this.interiorGraphics.fillRect(dx + 8, y + h - 22, 24, 6);
          // Chair
          this.interiorGraphics.fillStyle(0x2a2a3a, alpha);
          this.interiorGraphics.fillRect(dx + 15, y + h - 14, 20, 8);
        }
        // Ceiling lights
        this.interiorGraphics.fillStyle(accent, glowAlpha * 0.4);
        for (let i = 0; i < deskCount; i++) {
          this.interiorGraphics.fillRect(x + 25 + i * 70, y + 4, 35, 3);
        }
        break;
      }

      case 'farm': {
        // Hydroponic racks
        const rackCount = Math.floor((w - 16) / 60);
        for (let i = 0; i < rackCount; i++) {
          const fx = x + 8 + i * 60;
          // Rack frame
          this.interiorGraphics.fillStyle(0x2a2a2a, alpha);
          this.interiorGraphics.fillRect(fx, y + 10, 50, h - 16);
          // Grow light (bright!)
          this.interiorGraphics.fillStyle(accent, glowAlpha);
          this.interiorGraphics.fillRect(fx + 2, y + 12, 46, 4);
          // Plant trays (multiple levels)
          for (let level = 0; level < 3; level++) {
            const ly = y + 22 + level * 14;
            // Tray
            this.interiorGraphics.fillStyle(0x1a2a1a, alpha);
            this.interiorGraphics.fillRect(fx + 4, ly, 42, 10);
            // Plants (small green shapes)
            this.interiorGraphics.fillStyle(0x2a5a2a, alpha);
            for (let p = 0; p < 5; p++) {
              this.interiorGraphics.fillRect(fx + 6 + p * 8, ly + 2, 6, 6);
            }
          }
        }
        // Side glow
        this.interiorGraphics.fillStyle(accent, glowAlpha * 0.3);
        this.interiorGraphics.fillRect(x + 2, y + 10, 2, h - 16);
        this.interiorGraphics.fillRect(x + w - 4, y + 10, 2, h - 16);
        break;
      }

      case 'kitchen':
        // Counter/prep area
        this.interiorGraphics.fillStyle(0x3a3a3a, alpha);
        this.interiorGraphics.fillRect(x + 6, y + h - 28, w - 12, 22);
        // Counter top
        this.interiorGraphics.fillStyle(0x4a4a4a, alpha);
        this.interiorGraphics.fillRect(x + 6, y + h - 28, w - 12, 4);
        // Stove/cooking elements
        this.interiorGraphics.fillStyle(accent, glowAlpha * 0.7);
        this.interiorGraphics.fillRect(x + 15, y + h - 24, 25, 3);
        this.interiorGraphics.fillRect(x + 50, y + h - 24, 25, 3);
        // Hood/vent
        this.interiorGraphics.fillStyle(0x2a2a2a, alpha);
        this.interiorGraphics.fillRect(x + 10, y + 8, 60, 12);
        // Hood light
        this.interiorGraphics.fillStyle(accent, glowAlpha * 0.5);
        this.interiorGraphics.fillRect(x + 15, y + 18, 50, 2);
        // Fridge
        this.interiorGraphics.fillStyle(0x2a2a30, alpha);
        this.interiorGraphics.fillRect(x + w - 35, y + 8, 25, h - 14);
        // Fridge light strip
        this.interiorGraphics.fillStyle(0x4ae4e4, glowAlpha * 0.4);
        this.interiorGraphics.fillRect(x + w - 34, y + 10, 2, h - 18);
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
