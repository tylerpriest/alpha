import Phaser from 'phaser';
import { Room } from './Room';
import {
  HUNGER_DECAY_RATE,
  HUNGER_CRITICAL,
  HUNGER_MAX,
  FOOD_PER_MEAL,
  MS_PER_GAME_HOUR,
  HUNGER_COLORS,
  GRID_SIZE,
  FLOOR_HEIGHT,
  getSkyLobbyZone,
  SKY_LOBBY_FLOORS,
} from '../utils/constants';
import { ResidentState, ResidentData, ElevatorState } from '../utils/types';
import type { GameScene } from '../scenes/GameScene';
import type { ElevatorShaft } from '../systems/ElevatorSystem';

const RESIDENT_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Parker', 'Sage', 'River', 'Skyler', 'Dakota', 'Reese', 'Finley', 'Rowan',
];

export class Resident {
  public readonly id: string;
  public name: string;
  public type: 'office_worker' | 'resident' = 'resident'; // Tenant type
  public hunger: number = HUNGER_MAX;
  public stress: number = 0; // 0-100 stress level
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
  private targetFastFood: Room | null = null; // Target Fast Food restaurant for lunch
  private isSeekingLunch = false; // Track if office worker is seeking lunch
  private starvationTime = 0; // Tracks time at hunger 0 (in game ms)
  private highStressTime = 0; // Tracks time at stress >80 (in game ms)
  private sleepStartHour: number | null = null; // Track when sleep started for stress relief
  private sleepStressReliefApplied = false; // Track if we've applied sleep stress relief for current sleep cycle

  // Pathfinding properties
  private targetRoom: Room | null = null;
  private elevatorShaft: ElevatorShaft | null = null;
  private elevatorWaitStartTime = 0; // Timestamp when waiting for elevator started
  private skyLobbyTransferFloor: number | null = null; // Sky lobby floor for zone transfer
  private pathfindingLeg: 'first' | 'transfer' | 'final' | null = null; // Which leg of multi-zone journey

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

    // Set up event listeners for office workers
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for lunch start event (office workers seek Fast Food at 12 PM)
    const gameScene = this.scene as GameScene;
    if (gameScene && gameScene.timeSystem) {
      gameScene.timeSystem.on('schedule:lunch-start', () => {
        this.handleLunchStart();
      });
    }
  }

  private handleLunchStart(): void {
    // Only office workers seek Fast Food at lunch
    if (this.type === 'office_worker' && this.job && !this.isSeekingLunch) {
      const gameScene = this.scene as GameScene;
      const fastFoods = gameScene.building.getFastFoods();
      const restaurantSystem = gameScene.restaurantSystem;

      // Find an open Fast Food restaurant
      const openFastFoods = fastFoods.filter((ff) => 
        restaurantSystem.isRestaurantOpen(ff)
      );

      if (openFastFoods.length > 0) {
        // Pick a random open Fast Food restaurant
        this.targetFastFood = openFastFoods[Math.floor(Math.random() * openFastFoods.length)];
        this.isSeekingLunch = true;
        // Track lunch start (no longer needed, but keeping for potential future use)

        // Go to the Fast Food restaurant
        this.goToRoom(this.targetFastFood, () => {
          // Try to eat when arriving at restaurant
          this.tryToEatAtRestaurant();
        });
      }
    }
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

    // Update stress from elevator wait times
    this.updateElevatorWaitStress(delta);

    // Update stress from hourly factors
    this.updateHourlyStress(delta, gameHour);

    // Track high stress time (stress >80)
    if (this.stress > 80) {
      this.highStressTime += delta;
    } else {
      this.highStressTime = 0;
    }

    // Clamp stress to 0-100
    this.stress = Math.max(0, Math.min(100, this.stress));

    // Update state timer
    this.stateTimer += delta;

    // Update based on state
    switch (this.state) {
      case ResidentState.WALKING:
        this.updateWalking(delta);
        break;
      case ResidentState.WALKING_TO_ELEVATOR:
        this.updateWalkingToElevator(delta);
        break;
      case ResidentState.WAITING_FOR_ELEVATOR:
        this.updateWaitingForElevator(delta);
        break;
      case ResidentState.RIDING_ELEVATOR:
        this.updateRidingElevator(delta);
        break;
      case ResidentState.WORKING:
        this.updateWorking(delta);
        break;
      case ResidentState.EATING:
        this.updateEating(delta);
        break;
      case ResidentState.SLEEPING:
        this.updateSleeping(delta, gameHour);
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
    const bobOffset = (this.state === ResidentState.WALKING || 
                       this.state === ResidentState.WALKING_TO_ELEVATOR) 
                      ? Math.sin(this.walkBob) * 2 : 0;
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
    // Office workers: Check if returning from lunch (after eating at restaurant)
    if (this.type === 'office_worker' && this.isSeekingLunch && this.targetFastFood === null) {
      // Lunch is complete, return to office
      if (this.job) {
        this.goToRoom(this.job, () => {
          this.state = ResidentState.WORKING;
          this.stateTimer = 0;
          this.isSeekingLunch = false;
          // Lunch completed
        });
        return;
      }
    }

    // Check if hungry - find a kitchen and go eat (residential tenants only)
    // Office workers eat at Fast Food during lunch, not at kitchens
    if (this.type === 'resident' && this.hunger < 50 && !this.targetKitchen) {
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
    // Office workers: only if not seeking lunch
    if (this.job && gameHour >= 9 && gameHour < 17 && !this.isSeekingLunch) {
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
          this.sleepStartHour = gameHour;
          this.sleepStressReliefApplied = false;
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

  /**
   * Try to eat at a restaurant (Fast Food)
   * Office workers use this during lunch break
   */
  private tryToEatAtRestaurant(): void {
    const gameScene = this.scene as GameScene;

    // Check if restaurant is still open
    if (this.targetFastFood && gameScene.restaurantSystem.isRestaurantOpen(this.targetFastFood)) {
      // Try to consume 1 unit of processed food (same as kitchen)
      if (gameScene.resourceSystem.consumeFood(1)) {
        // Food consumed - start eating
        this.state = ResidentState.EATING;
        this.stateTimer = 0;
      } else {
        // No food available - return to office
        this.targetFastFood = null;
        this.isSeekingLunch = false;
        if (this.job) {
          this.goToRoom(this.job, () => {
            this.state = ResidentState.WORKING;
            this.stateTimer = 0;
          });
        } else {
          this.state = ResidentState.IDLE;
        }
      }
    } else {
      // Restaurant closed - return to office
      this.targetFastFood = null;
      this.isSeekingLunch = false;
      if (this.job) {
        this.goToRoom(this.job, () => {
          this.state = ResidentState.WORKING;
          this.stateTimer = 0;
        });
      } else {
        this.state = ResidentState.IDLE;
      }
    }
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

  private updateWalkingToElevator(delta: number): void {
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
      // Arrived at elevator - start waiting
      this.x = this.targetX;
      this.y = this.targetY;
      this.targetX = null;
      this.targetY = null;
      this.walkBob = 0;
      this.state = ResidentState.WAITING_FOR_ELEVATOR;
      this.elevatorWaitStartTime = Date.now(); // Track when waiting started
    } else {
      const moveX = (dx / dist) * speed * (delta / 1000);
      const moveY = (dy / dist) * speed * (delta / 1000);
      this.x += moveX;
      this.y += moveY;
    }
  }

  private updateWaitingForElevator(_delta: number): void {
    if (!this.elevatorShaft || !this.targetRoom) {
      this.state = ResidentState.IDLE;
      this.elevatorWaitStartTime = 0;
      return;
    }

    const currentFloor = this.getCurrentFloor();
    const targetFloor = this.targetRoom.floor;

    // Check if elevator is at our floor and loading
    if (this.elevatorShaft.isAtFloor(currentFloor) && 
        this.elevatorShaft.car.canAcceptPassengers()) {
      // Board the elevator - check wait time before clearing
      const waitTime = Date.now() - this.elevatorWaitStartTime;
      this.applyElevatorWaitStress(waitTime);
      
      this.elevatorWaitStartTime = 0;
      if (this.elevatorShaft.car.addPassenger(this)) {
        this.state = ResidentState.RIDING_ELEVATOR;
        this.elevatorShaft.car.setTargetFloor(targetFloor);
      }
    }
  }

  private updateRidingElevator(_delta: number): void {
    if (!this.elevatorShaft || !this.targetRoom) {
      this.state = ResidentState.IDLE;
      return;
    }

    const targetFloor = this.targetRoom.floor;
    const car = this.elevatorShaft.car;

    // Update resident position to match elevator car position
    const elevatorX = this.elevatorShaft.position * GRID_SIZE;
    // getVisualY() returns negative values (floor 0 = 0, floor 1 = -64, etc.)
    // Ground Y is 500, so we need: 500 + getVisualY() to get the actual Y position
    const elevatorY = 500 + car.getVisualY();
    this.setPosition(elevatorX, elevatorY);

    // Check if we're doing a multi-zone transfer
    if (this.pathfindingLeg === 'first' && this.skyLobbyTransferFloor !== null) {
      // First leg: check if we've arrived at sky lobby
      if (car.currentFloor === this.skyLobbyTransferFloor && 
          (car.state === ElevatorState.LOADING || car.state === ElevatorState.DOORS_OPENING)) {
        // Exit first elevator at sky lobby
        this.elevatorShaft.car.removePassenger(this);
        this.elevatorShaft = null;
        
        // Start transfer leg: walk to elevator in next zone
        this.pathfindingLeg = 'transfer';
        this.continueToNextZone();
        return;
      }
    } else {
      // Final leg: check if we've arrived at destination floor
      if (car.currentFloor === targetFloor && 
          (car.state === ElevatorState.LOADING || car.state === ElevatorState.DOORS_OPENING)) {
        // Exit elevator at destination
        this.elevatorShaft.car.removePassenger(this);
        this.elevatorShaft = null;
        this.skyLobbyTransferFloor = null;
        this.pathfindingLeg = null;

        // Walk to final destination
        const pos = this.targetRoom.getWorldPosition();
        this.targetX = pos.x;
        this.targetY = pos.y;
        this.state = ResidentState.WALKING;
      }
    }
  }

  private continueToNextZone(): void {
    // Called when resident arrives at sky lobby - continue to next zone
    if (!this.targetRoom || this.skyLobbyTransferFloor === null) {
      this.state = ResidentState.IDLE;
      return;
    }

    const gameScene = this.scene as GameScene;
    const elevatorSystem = gameScene.elevatorSystem;
    const targetFloor = this.targetRoom.floor;
    const targetZone = getSkyLobbyZone(targetFloor);

    // Find elevator in target zone
    const targetZoneShaft = elevatorSystem.getShaftForZone(targetZone);
    if (!targetZoneShaft) {
      // No elevator in target zone - fallback to walking (shouldn't happen)
      const pos = this.targetRoom.getWorldPosition();
      this.targetX = pos.x;
      this.targetY = pos.y;
      this.state = ResidentState.WALKING;
      this.skyLobbyTransferFloor = null;
      this.pathfindingLeg = null;
      return;
    }

    // Walk to elevator in target zone (at sky lobby floor)
    this.elevatorShaft = targetZoneShaft;
    this.pathfindingLeg = 'final'; // Final leg: to destination

    const direction = targetFloor > this.skyLobbyTransferFloor ? 'up' : 'down';
    elevatorSystem.callElevator(this.skyLobbyTransferFloor, direction, this);

    const elevatorX = this.elevatorShaft.position * GRID_SIZE;
    const elevatorY = this.getFloorY(this.skyLobbyTransferFloor);
    this.targetX = elevatorX;
    this.targetY = elevatorY;
    this.state = ResidentState.WALKING_TO_ELEVATOR;
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
      // Good meal reduces stress by 10
      this.stress = Math.max(0, this.stress - 10);
      
      // If office worker was eating at restaurant, clear lunch state
      if (this.type === 'office_worker' && this.isSeekingLunch && this.targetFastFood) {
        this.targetFastFood = null;
        // Will return to office in updateIdle()
      }
      
      this.state = ResidentState.IDLE;
    }
  }

  private updateSleeping(_delta: number, gameHour: number): void {
    // Sleeping restores a small amount of hunger resistance
    // (actually handled by reduced decay during sleep)
    
    // Apply sleep stress relief when waking up (6 AM or later)
    // If it's 6 AM or later and we haven't applied relief yet, apply it
    if (gameHour >= 6 && this.sleepStartHour !== null && !this.sleepStressReliefApplied) {
      // Check if we slept for at least 6 hours (full night)
      let sleepDuration = 0;
      if (this.sleepStartHour >= 22) {
        // Started before midnight
        sleepDuration = (24 - this.sleepStartHour) + gameHour;
      } else {
        // Started after midnight
        sleepDuration = gameHour - this.sleepStartHour;
      }
      
      // Full night sleep (6+ hours) reduces stress by 20
      if (sleepDuration >= 6) {
        this.stress = Math.max(0, this.stress - 20);
        this.sleepStressReliefApplied = true;
      }
    }
  }

  goToRoom(room: Room, onArrival?: () => void): void {
    this.targetRoom = room;
    this.onArrival = onArrival ?? null;
    this.skyLobbyTransferFloor = null;
    this.pathfindingLeg = null;

    const currentFloor = this.getCurrentFloor();
    const targetFloor = room.floor;

    // Same floor - direct walk
    if (currentFloor === targetFloor) {
      const pos = room.getWorldPosition();
      this.targetX = pos.x;
      this.targetY = pos.y;
      this.state = ResidentState.WALKING;
      return;
    }

    // Check if we need a zone transfer (different zones)
    const currentZone = getSkyLobbyZone(currentFloor);
    const targetZone = getSkyLobbyZone(targetFloor);

    const gameScene = this.scene as GameScene;
    const elevatorSystem = gameScene.elevatorSystem;

    // Same zone - use single elevator (existing logic)
    if (currentZone === targetZone) {
      const shaft = elevatorSystem.getShaftForZone(currentZone);
      if (!shaft) {
        // No elevator for this zone - fallback to teleport
        const pos = room.getWorldPosition();
        this.targetX = pos.x;
        this.targetY = pos.y;
        this.state = ResidentState.WALKING;
        return;
      }

      this.elevatorShaft = shaft;
      const direction = targetFloor > currentFloor ? 'up' : 'down';
      elevatorSystem.callElevator(currentFloor, direction, this);

      const elevatorX = this.elevatorShaft.position * GRID_SIZE;
      const elevatorY = this.getFloorY(currentFloor);
      this.targetX = elevatorX;
      this.targetY = elevatorY;
      this.state = ResidentState.WALKING_TO_ELEVATOR;
      return;
    }

    // Different zones - need sky lobby transfer
    // Find the sky lobby floor between current and target zones
    let transferFloor: number | null = null;
    if (targetZone > currentZone) {
      // Going up - use sky lobby at the start of target zone
      transferFloor = SKY_LOBBY_FLOORS[targetZone - 1] ?? null;
    } else {
      // Going down - use sky lobby at the start of current zone (if we're above it)
      // Or use the sky lobby between zones
      if (currentZone > 0) {
        transferFloor = SKY_LOBBY_FLOORS[currentZone - 1] ?? null;
      }
    }

    if (!transferFloor) {
      // No sky lobby found - fallback to direct path (shouldn't happen)
      const shaft = elevatorSystem.getShaftForZone(currentZone);
      if (shaft) {
        this.elevatorShaft = shaft;
        const direction = targetFloor > currentFloor ? 'up' : 'down';
        elevatorSystem.callElevator(currentFloor, direction, this);
        const elevatorX = this.elevatorShaft.position * GRID_SIZE;
        const elevatorY = this.getFloorY(currentFloor);
        this.targetX = elevatorX;
        this.targetY = elevatorY;
        this.state = ResidentState.WALKING_TO_ELEVATOR;
      }
      return;
    }

    // Plan multi-leg journey: current floor → sky lobby → target floor
    this.skyLobbyTransferFloor = transferFloor;
    this.pathfindingLeg = 'first'; // First leg: to sky lobby

    // Start first leg: walk to elevator in current zone
    const currentZoneShaft = elevatorSystem.getShaftForZone(currentZone);
    if (!currentZoneShaft) {
      // No elevator - fallback
      const pos = room.getWorldPosition();
      this.targetX = pos.x;
      this.targetY = pos.y;
      this.state = ResidentState.WALKING;
      return;
    }

    this.elevatorShaft = currentZoneShaft;
    const direction = transferFloor > currentFloor ? 'up' : 'down';
    elevatorSystem.callElevator(currentFloor, direction, this);

    const elevatorX = this.elevatorShaft.position * GRID_SIZE;
    const elevatorY = this.getFloorY(currentFloor);
    this.targetX = elevatorX;
    this.targetY = elevatorY;
    this.state = ResidentState.WALKING_TO_ELEVATOR;
  }

  /**
   * Get the current floor based on Y position
   */
  private getCurrentFloor(): number {
    // Ground Y is 500, each floor is FLOOR_HEIGHT pixels up (negative Y)
    // Formula: floor = (500 - y) / FLOOR_HEIGHT
    const groundY = 500;
    const floor = Math.round((groundY - this.y) / FLOOR_HEIGHT);
    return Math.max(0, floor); // Ensure non-negative
  }

  /**
   * Get the Y position for a given floor
   */
  private getFloorY(floor: number): number {
    const groundY = 500;
    return groundY - floor * FLOOR_HEIGHT;
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

  hasHighStressTooLong(): boolean {
    // 48 game hours at stress >80 means resident should leave
    const maxHighStressTime = 48 * MS_PER_GAME_HOUR;
    return this.highStressTime >= maxHighStressTime;
  }

  /**
   * Update stress from elevator wait times
   */
  private updateElevatorWaitStress(_delta: number): void {
    if (this.state === ResidentState.WAITING_FOR_ELEVATOR && this.elevatorWaitStartTime > 0) {
      // Wait time stress is applied when boarding, not continuously
      // Check thresholds and apply stress (only once per threshold)
      // We'll apply stress when boarding, not continuously
    }
  }

  /**
   * Apply stress based on elevator wait time (called when boarding)
   */
  private applyElevatorWaitStress(waitTimeMs: number): void {
    const waitTimeSeconds = waitTimeMs / 1000;
    
    if (waitTimeSeconds > 120) {
      this.stress += 20;
    } else if (waitTimeSeconds > 60) {
      this.stress += 10;
    } else if (waitTimeSeconds > 30) {
      this.stress += 5;
    }
  }

  /**
   * Update stress from hourly factors
   */
  private updateHourlyStress(delta: number, _gameHour: number): void {
    const hourDelta = delta / 3600000; // Convert ms to hours

    // Unemployed: +3 stress/hour
    if (!this.job) {
      this.stress += 3 * hourDelta;
    }

    // Overcrowded apartment (>4 residents): +5 stress/hour
    if (this.home) {
      const residentCount = this.home.getResidentCount();
      if (residentCount > 4) {
        this.stress += 5 * hourDelta;
      }

      // Adjacent to office: +2 stress/hour
      if (this.isAdjacentToOffice()) {
        this.stress += 2 * hourDelta;
      }
    }
    // Note: Sleep stress relief is handled in updateSleeping()
  }

  /**
   * Check if resident's home apartment is adjacent to an office
   */
  private isAdjacentToOffice(): boolean {
    if (!this.home || this.home.type !== 'apartment') {
      return false;
    }

    const gameScene = this.scene as GameScene;
    const building = gameScene.building;
    const floor = this.home.floor;
    const homeStart = this.home.position;
    const homeEnd = this.home.position + this.home.width;

    // Check all offices on the same floor
    const offices = building.getOffices();
    for (const office of offices) {
      if (office.floor === floor) {
        const officeStart = office.position;
        const officeEnd = office.position + office.width;
        
        // Adjacent means touching (no gap) or overlapping
        // For simplicity, we'll check if they're within 1 grid unit
        const gap = Math.min(
          Math.abs(homeEnd - officeStart),
          Math.abs(officeEnd - homeStart)
        );
        
        if (gap <= 1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate satisfaction (0-100) based on stress, hunger, food availability, and employment
   * Formula: 100 - Stress - HungerPenalty + FoodBonus + EmploymentBonus
   * 
   * @param foodAvailable Whether processed food is available in the building
   * @returns Satisfaction score from 0-100
   */
  calculateSatisfaction(foodAvailable: boolean): number {
    // Stress penalty (0-100)
    const stressPenalty = this.stress;
    
    // Hunger penalty: (100 - Hunger) / 2 (max 50 penalty when starving)
    const hungerPenalty = (100 - this.hunger) / 2;
    
    // Food bonus: +10 if food available
    const foodBonus = foodAvailable ? 10 : 0;
    
    // Employment bonus: +15 if employed
    const employmentBonus = this.job !== null ? 15 : 0;
    
    // Calculate satisfaction
    const satisfaction = 100 - stressPenalty - hungerPenalty + foodBonus + employmentBonus;
    
    // Clamp to 0-100
    return Math.max(0, Math.min(100, satisfaction));
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
      type: this.type,
      hunger: this.hunger,
      stress: this.stress,
      homeId: this.home?.id ?? null,
      jobId: this.job?.id ?? null,
      state: this.state,
    };
  }

  destroy(): void {
    // Remove from elevator if riding
    if (this.elevatorShaft) {
      this.elevatorShaft.removeResident(this);
      this.elevatorShaft = null;
    }

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
