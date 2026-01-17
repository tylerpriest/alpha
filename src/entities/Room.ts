import Phaser from 'phaser';
import { ROOM_SPECS, GRID_SIZE, RoomType } from '../utils/constants';
import { RoomData } from '../utils/types';
import { Resident } from './Resident';

export class Room {
  public readonly id: string;
  public readonly type: RoomType;
  public readonly floor: number;
  public readonly position: number;
  public readonly width: number;

  private graphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private residents: Resident[] = [];
  private workers: Resident[] = [];

  constructor(scene: Phaser.Scene, data: RoomData) {
    this.id = data.id;
    this.type = data.type;
    this.floor = data.floor;
    this.position = data.position;
    this.width = data.width;

    this.graphics = scene.add.graphics();
    this.label = scene.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#ffffff',
    });

    this.draw();
  }

  private draw(): void {
    const spec = ROOM_SPECS[this.type];
    const groundY = 500;

    const x = this.position * GRID_SIZE;
    const y = groundY - (this.floor + 1) * GRID_SIZE;
    const w = this.width * GRID_SIZE;
    const h = GRID_SIZE;

    // Room background
    this.graphics.fillStyle(spec.color, 1);
    this.graphics.fillRect(x, y, w, h);

    // Room border
    this.graphics.lineStyle(2, 0xffffff, 0.3);
    this.graphics.strokeRect(x, y, w, h);

    // Room label
    const displayName = this.type.charAt(0).toUpperCase() + this.type.slice(1);
    this.label.setText(displayName);
    this.label.setPosition(x + 5, y + 5);
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
    this.label.destroy();
  }
}
