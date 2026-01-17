import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { TimeSystem } from '../systems/TimeSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { ResidentSystem } from '../systems/ResidentSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { VenusAtmosphere } from '../graphics/VenusAtmosphere';
import { DayNightOverlay } from '../graphics/DayNightOverlay';
import { AtmosphericEffects } from '../graphics/AtmosphericEffects';
import { UIManager } from '../ui/UIManager';
import { INITIAL_MONEY, GRID_SIZE } from '../utils/constants';

export class GameScene extends Phaser.Scene {
  public building!: Building;
  public timeSystem!: TimeSystem;
  public economySystem!: EconomySystem;
  public residentSystem!: ResidentSystem;
  public resourceSystem!: ResourceSystem;

  private venusAtmosphere!: VenusAtmosphere;
  private dayNightOverlay!: DayNightOverlay;
  private atmosphericEffects!: AtmosphericEffects;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize systems
    this.timeSystem = new TimeSystem();
    this.economySystem = new EconomySystem(INITIAL_MONEY);
    this.resourceSystem = new ResourceSystem();
    this.building = new Building(this);
    this.residentSystem = new ResidentSystem(this);

    // Set up camera
    this.cameras.main.setBounds(-1000, -2000, 3280, 3720);
    this.cameras.main.scrollY = -500;

    // Create Venus atmosphere background (behind everything)
    this.venusAtmosphere = new VenusAtmosphere(this);

    // Draw ground with dark gradient
    const groundY = 500;
    const groundLine = this.add.graphics();
    groundLine.setDepth(5);
    groundLine.lineStyle(4, 0x3a3a4a, 1);
    groundLine.lineBetween(-1000, groundY, 2280, groundY);
    // Ground gradient
    groundLine.fillStyle(0x1a1a2e, 1);
    groundLine.fillRect(-1000, groundY, 3280, 200);
    groundLine.fillStyle(0x0a0a1e, 1);
    groundLine.fillRect(-1000, groundY + 200, 3280, 800);

    // Draw grid lines for reference
    this.drawGrid();

    // Create initial lobby
    this.building.addRoom('lobby', 0, 0);

    // Create day/night overlay (above rooms)
    this.dayNightOverlay = new DayNightOverlay(this);

    // Create atmospheric particle effects
    this.atmosphericEffects = new AtmosphericEffects(this);

    // Launch Phaser UI scene (for in-game overlays)
    this.scene.launch('UIScene');

    // Create DOM UI Manager
    this._uiManager = new UIManager(this.registry);

    // Set up input handlers
    this.setupInput();

    // Share data with UI
    this.updateRegistry();
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(1);
    graphics.lineStyle(1, 0x4a4a5a, 0.2);

    const groundY = 500;
    const buildingLeft = 0;
    const buildingRight = 1280;

    // Vertical lines
    for (let x = buildingLeft; x <= buildingRight; x += GRID_SIZE) {
      graphics.lineBetween(x, groundY - 2000, x, groundY);
    }

    // Horizontal lines (floors)
    for (let y = groundY; y >= groundY - 2000; y -= GRID_SIZE) {
      graphics.lineBetween(buildingLeft, y, buildingRight, y);
    }
  }

  private setupInput(): void {
    // Camera drag
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = pointer.x - this.dragStartX;
        const dy = pointer.y - this.dragStartY;
        this.cameras.main.scrollX = this.cameraStartX - dx;
        this.cameras.main.scrollY = this.cameraStartY - dy;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Zoom with scroll wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, _dy: number, dz: number) => {
      const zoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(zoom - dz * 0.001, 0.5, 2);
      this.cameras.main.setZoom(newZoom);
    });

    // Click to place room
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonReleased()) return;
      if (this.isDragging) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.handleClick(worldPoint.x, worldPoint.y);
    });
  }

  private handleClick(worldX: number, worldY: number): void {
    // Get selected room type from registry
    const selectedRoom = this.registry.get('selectedRoom') as string | undefined;
    if (!selectedRoom) return;

    // Convert world coordinates to grid position
    const groundY = 500;
    const floor = Math.floor((groundY - worldY) / GRID_SIZE);
    const position = Math.floor(worldX / GRID_SIZE);

    // Try to place room
    const success = this.building.addRoom(selectedRoom, floor, position);
    if (success) {
      const cost = this.building.getRoomCost(selectedRoom);
      this.economySystem.spend(cost);
      this.updateRegistry();
    }
  }

  update(_time: number, delta: number): void {
    // Update time
    this.timeSystem.update(delta);

    // Update atmosphere and lighting based on time of day
    const hour = this.timeSystem.getHour();
    this.venusAtmosphere.update(hour, this.cameras.main.scrollX);
    this.dayNightOverlay.update(hour);

    // Update atmospheric particles
    this.atmosphericEffects.update(delta);

    // Update residents
    this.residentSystem.update(delta);

    // Update resources
    this.resourceSystem.update(delta, this.building);

    // Daily economy update
    if (this.timeSystem.isNewDay()) {
      this.economySystem.processDailyIncome(this.building);
      this.economySystem.processDailyExpenses(this.building);
    }

    // Update registry for UI
    this.updateRegistry();
  }

  private updateRegistry(): void {
    this.registry.set('money', this.economySystem.getMoney());
    this.registry.set('day', this.timeSystem.getDay());
    this.registry.set('hour', this.timeSystem.getHour());
    this.registry.set('food', this.resourceSystem.getFood());
    this.registry.set('population', this.residentSystem.getPopulation());
  }
}
