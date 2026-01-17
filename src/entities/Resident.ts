import Phaser from 'phaser';
import { Room } from './Room';
import {
  HUNGER_DECAY_RATE,
  HUNGER_CRITICAL,
  HUNGER_MAX,
  FOOD_PER_MEAL,
  MS_PER_GAME_HOUR,
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
  private sprite: Phaser.GameObjects.Rectangle;
  private nameLabel: Phaser.GameObjects.Text;

  public home: Room | null = null;
  public job: Room | null = null;

  private targetX: number | null = null;
  private targetY: number | null = null;
  private onArrival: (() => void) | null = null;

  private stateTimer = 0;
  private targetKitchen: Room | null = null;
  private starvationTime = 0; // Tracks time at hunger 0 (in game ms)

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.scene = scene;
    this.id = id;
    this.name = RESIDENT_NAMES[Math.floor(Math.random() * RESIDENT_NAMES.length)];

    // Simple rectangle sprite for now
    this.sprite = scene.add.rectangle(x, y, 16, 28, 0x4aff4a);
    this.sprite.setOrigin(0.5, 1);

    this.nameLabel = scene.add.text(x, y - 35, this.name, {
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0.5);
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

    // Update sprite color based on hunger
    this.updateSpriteColor();

    // Update name label position
    this.nameLabel.setPosition(this.sprite.x, this.sprite.y - 35);
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
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.sprite.setPosition(this.targetX, this.targetY);
      this.targetX = null;
      this.targetY = null;

      if (this.onArrival) {
        this.onArrival();
        this.onArrival = null;
      } else {
        this.state = ResidentState.IDLE;
      }
    } else {
      const moveX = (dx / dist) * speed * (delta / 1000);
      const moveY = (dy / dist) * speed * (delta / 1000);
      this.sprite.setPosition(this.sprite.x + moveX, this.sprite.y + moveY);
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

  private updateSpriteColor(): void {
    if (this.hunger < HUNGER_CRITICAL) {
      this.sprite.setFillStyle(0xff4a4a); // Red - critical
    } else if (this.hunger < 50) {
      this.sprite.setFillStyle(0xffaa4a); // Orange - hungry
    } else {
      this.sprite.setFillStyle(0x4aff4a); // Green - satisfied
    }
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
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.nameLabel.setPosition(x, y - 35);
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
    this.sprite.destroy();
    this.nameLabel.destroy();
  }
}
