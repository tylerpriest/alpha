import Phaser from 'phaser';
import { Room } from './Room';
import {
  HUNGER_DECAY_RATE,
  HUNGER_CRITICAL,
  HUNGER_MAX,
  FOOD_PER_MEAL,
  MS_PER_GAME_HOUR,
  HUNGER_COLORS,
} from '../utils/constants';
import { ResidentState, ResidentData } from '../utils/types';
import type { GameScene } from '../scenes/GameScene';

const RESIDENT_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Parker', 'Sage', 'River', 'Skyler', 'Dakota', 'Reese', 'Finley', 'Rowan',
];

export class Resident {
  public readonly id: string;
  public name: string;
  public hunger: number = HUNGER_MAX;
  public state: ResidentState = ResidentState.IDLE;

  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private nameLabel: Phaser.GameObjects.Text;

  public home: Room | null = null;
  public job: Room | null = null;

  private targetX: number | null = null;
  private targetY: number | null = null;
  private onArrival: (() => void) | null = null;

  private stateTimer = 0;
  private targetKitchen: Room | null = null;
  private starvationTime = 0; // Tracks time at hunger 0 (in game ms)

  private x: number;
  private y: number;
  private walkBob = 0;
  private pulsePhase = 0;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.scene = scene;
    this.id = id;
    this.name = RESIDENT_NAMES[Math.floor(Math.random() * RESIDENT_NAMES.length)];
    this.x = x;
    this.y = y;

    // Create graphics for silhouette
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(30);

    // Create glow graphics (additive blend)
    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setDepth(29);
    this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);

    this.nameLabel = scene.add.text(x, y - 40, this.name, {
      fontSize: '10px',
      color: '#e4e4e4',
      fontFamily: 'Space Grotesk, sans-serif',
    }).setOrigin(0.5);
    this.nameLabel.setDepth(31);

    this.drawSilhouette();
  }

  update(delta: number, gameHour: number): void {
    const hourDelta = delta / 3600000; // Convert ms to hours

    // Decay hunger
    this.hunger = Math.max(0, this.hunger - HUNGER_DECAY_RATE * hourDelta * 10);

    // Track starvation time (time spent at hunger 0)
    if (this.hunger === 0) {
      this.starvationTime += delta;
    } else {
      this.starvationTime = 0;
    }

    // Update state timer
    this.stateTimer += delta;

    // Update based on state
    switch (this.state) {
      case ResidentState.WALKING:
        this.updateWalking(delta);
        break;
      case ResidentState.WORKING:
        this.updateWorking(delta);
        break;
      case ResidentState.EATING:
        this.updateEating(delta);
        break;
      case ResidentState.SLEEPING:
        this.updateSleeping(delta);
        break;
      case ResidentState.IDLE:
        this.updateIdle(gameHour);
        break;
    }

    // Update visuals
    this.pulsePhase += delta * 0.005;
    this.drawSilhouette();

    // Update name label position
    this.nameLabel.setPosition(this.x, this.y - 40);
  }

  private drawSilhouette(): void {
    this.graphics.clear();
    this.glowGraphics.clear();

    const color = this.getHungerColor();
    const bobOffset = this.state === ResidentState.WALKING ? Math.sin(this.walkBob) * 2 : 0;
    const baseY = this.y + bobOffset;

    // Silhouette body (24x32px)
    const w = 12;
    const h = 32;

    // Draw holographic glow outline
    const glowAlpha = this.hunger < HUNGER_CRITICAL
      ? 0.3 + Math.sin(this.pulsePhase) * 0.2 // Pulsing for critical
      : 0.25;

    this.glowGraphics.lineStyle(4, color, glowAlpha);
    this.glowGraphics.strokeRoundedRect(this.x - w, baseY - h, w * 2, h, 4);

    // Head glow
    this.glowGraphics.strokeCircle(this.x, baseY - h - 6, 8);

    // Draw silhouette body
    this.graphics.fillStyle(0x1a1a2a, 0.9);
    this.graphics.fillRoundedRect(this.x - w, baseY - h, w * 2, h, 4);

    // Draw head
    this.graphics.fillCircle(this.x, baseY - h - 6, 7);

    // Draw holographic accent border
    this.graphics.lineStyle(1.5, color, 0.8);
    this.graphics.strokeRoundedRect(this.x - w, baseY - h, w * 2, h, 4);
    this.graphics.strokeCircle(this.x, baseY - h - 6, 7);

    // Inner detail line (suggests clothing)
    this.graphics.lineStyle(1, color, 0.3);
    this.graphics.lineBetween(this.x - w + 3, baseY - h + 10, this.x + w - 3, baseY - h + 10);
  }

  private getHungerColor(): number {
    if (this.hunger >= 70) {
      return HUNGER_COLORS.satisfied; // Cyan
    } else if (this.hunger >= 40) {
      return HUNGER_COLORS.hungry; // Amber
    } else if (this.hunger >= 20) {
      return HUNGER_COLORS.veryHungry; // Orange
    } else {
      return HUNGER_COLORS.critical; // Magenta
    }
  }

  private updateIdle(gameHour: number): void {
    // Check if hungry - find a kitchen and go eat
    if (this.hunger < 50 && !this.targetKitchen) {
      const gameScene = this.scene as GameScene;
      const kitchens = gameScene.building.getKitchens();

      if (kitchens.length > 0) {
        // Pick nearest kitchen (or random one for simplicity)
        this.targetKitchen = kitchens[Math.floor(Math.random() * kitchens.length)];
        this.goToRoom(this.targetKitchen, () => {
          // Try to eat when arriving at kitchen
          this.tryToEat();
        });
        return;
      }
      // No kitchens available - hunger stays unsatisfied
    }

    // Check if should go to work (9 AM - 5 PM)
    if (this.job && gameHour >= 9 && gameHour < 17) {
      this.goToRoom(this.job, () => {
        this.state = ResidentState.WORKING;
        this.stateTimer = 0;
      });
      return;
    }

    // Check if should sleep (10 PM - 6 AM)
    if (gameHour >= 22 || gameHour < 6) {
      if (this.home) {
        this.goToRoom(this.home, () => {
          this.state = ResidentState.SLEEPING;
          this.stateTimer = 0;
        });
      }
    }
  }

  private tryToEat(): void {
    const gameScene = this.scene as GameScene;

    // Try to consume 1 unit of processed food
    if (gameScene.resourceSystem.consumeFood(1)) {
      // Food consumed - start eating
      this.state = ResidentState.EATING;
      this.stateTimer = 0;
    } else {
      // No food available - stay hungry
      this.state = ResidentState.IDLE;
    }

    this.targetKitchen = null;
  }

  private updateWalking(delta: number): void {
    if (this.targetX === null || this.targetY === null) {
      this.state = ResidentState.IDLE;
      return;
    }

    const speed = 100; // Pixels per second
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Update walk bob animation
    this.walkBob += delta * 0.015;

    if (dist < 5) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.targetX = null;
      this.targetY = null;
      this.walkBob = 0;

      if (this.onArrival) {
        this.onArrival();
        this.onArrival = null;
      } else {
        this.state = ResidentState.IDLE;
      }
    } else {
      const moveX = (dx / dist) * speed * (delta / 1000);
      const moveY = (dy / dist) * speed * (delta / 1000);
      this.x += moveX;
      this.y += moveY;
    }
  }

  private updateWorking(_delta: number): void {
    // Work until 5 PM (handled by idle check)
    // Just stay in working state
  }

  private updateEating(_delta: number): void {
    // Eating takes about 30 minutes (in-game)
    if (this.stateTimer > 1800000 / 10) {
      // 30 minutes scaled
      this.hunger = Math.min(HUNGER_MAX, this.hunger + FOOD_PER_MEAL);
      this.state = ResidentState.IDLE;
    }
  }

  private updateSleeping(_delta: number): void {
    // Sleeping restores a small amount of hunger resistance
    // (actually handled by reduced decay during sleep)
  }

  goToRoom(room: Room, onArrival?: () => void): void {
    const pos = room.getWorldPosition();
    this.targetX = pos.x;
    this.targetY = pos.y;
    this.state = ResidentState.WALKING;
    this.onArrival = onArrival ?? null;
  }

  setHome(room: Room): void {
    if (this.home) {
      this.home.removeResident(this);
    }
    this.home = room;
    room.addResident(this);
  }

  setJob(room: Room | null): void {
    if (this.job) {
      this.job.removeWorker(this);
    }
    this.job = room;
    if (room) {
      room.addWorker(this);
    }
  }

  isHungry(): boolean {
    return this.hunger < 50;
  }

  isStarving(): boolean {
    return this.hunger < HUNGER_CRITICAL;
  }

  getStarvationTime(): number {
    return this.starvationTime;
  }

  hasStarvedTooLong(): boolean {
    // 24 game hours at hunger 0 means resident should leave
    // Using MS_PER_GAME_HOUR (10000ms = 1 game hour)
    const maxStarvationTime = 24 * MS_PER_GAME_HOUR;
    return this.starvationTime >= maxStarvationTime;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.nameLabel.setPosition(x, y - 40);
    this.drawSilhouette();
  }

  serialize(): ResidentData {
    return {
      id: this.id,
      name: this.name,
      hunger: this.hunger,
      homeId: this.home?.id ?? null,
      jobId: this.job?.id ?? null,
      state: this.state,
    };
  }

  destroy(): void {
    if (this.home) {
      this.home.removeResident(this);
    }
    if (this.job) {
      this.job.removeWorker(this);
    }
    this.graphics.destroy();
    this.glowGraphics.destroy();
    this.nameLabel.destroy();
  }
}
