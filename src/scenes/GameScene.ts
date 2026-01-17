import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { TimeSystem } from '../systems/TimeSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { ResidentSystem } from '../systems/ResidentSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { VenusAtmosphere } from '../graphics/VenusAtmosphere';
import { DayNightOverlay } from '../graphics/DayNightOverlay';
import { AtmosphericEffects } from '../graphics/AtmosphericEffects';
import { VolcanicGround } from '../graphics/VolcanicGround';
import { UIManager } from '../ui/UIManager';
import { INITIAL_MONEY, GRID_SIZE, ROOM_SPECS, RoomType, UI_COLORS } from '../utils/constants';

export class GameScene extends Phaser.Scene {
  public building!: Building;
  public timeSystem!: TimeSystem;
  public economySystem!: EconomySystem;
  public residentSystem!: ResidentSystem;
  public resourceSystem!: ResourceSystem;

  private venusAtmosphere!: VenusAtmosphere;
  private dayNightOverlay!: DayNightOverlay;
  private atmosphericEffects!: AtmosphericEffects;
  private volcanicGround!: VolcanicGround;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;
  private ghostPreview: Phaser.GameObjects.Graphics | null = null;
  private selectedRoomId: string | null = null;

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

    // Create volcanic ground with lava and alien flora
    this.volcanicGround = new VolcanicGround(this);

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
    new UIManager(this.registry);

    // Set up input handlers
    this.setupInput();

    // Listen to registry changes for room selection
    this.registry.events.on('changedata-selectedRoom', (_: Phaser.Game, value: string | undefined) => {
      // Clear ghost preview when selection changes
      if (this.ghostPreview) {
        this.ghostPreview.clear();
      }
      // Clear room selection when placing a new room type
      if (value && this.selectedRoomId) {
        this.selectRoom(null);
      }
    });

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
      } else {
        // Update ghost preview
        this.updateGhostPreview(pointer);
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
    
    // Convert world coordinates to grid position
    const groundY = 500;
    const floor = Math.floor((groundY - worldY) / GRID_SIZE);
    const position = Math.floor(worldX / GRID_SIZE);

    if (selectedRoom) {
      // Try to place room
      const success = this.building.addRoom(selectedRoom, floor, position);
      if (success) {
        const cost = this.building.getRoomCost(selectedRoom);
        this.economySystem.spend(cost);
        this.updateRegistry();
      }
    } else {
      // No room selected - try to select a room
      const clickedRoom = this.building.getRoomAt(floor, position);
      if (clickedRoom) {
        this.selectRoom(clickedRoom.id);
      } else {
        this.selectRoom(null);
      }
    }
  }

  private updateGhostPreview(pointer: Phaser.Input.Pointer): void {
    const selectedRoom = this.registry.get('selectedRoom') as string | undefined;
    
    if (!selectedRoom) {
      // Clear ghost preview if no room selected
      if (this.ghostPreview) {
        this.ghostPreview.clear();
      }
      return;
    }

    // Get world position
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const groundY = 500;
    const floor = Math.floor((groundY - worldPoint.y) / GRID_SIZE);
    const position = Math.floor(worldPoint.x / GRID_SIZE);

    const spec = ROOM_SPECS[selectedRoom as RoomType];
    if (!spec) return;

    // Check if placement is valid
    const hasOverlap = this.building.hasOverlap(floor, position, spec.width);
    const validFloor = floor >= spec.minFloor && floor <= spec.maxFloor;
    const hasEnoughMoney = this.economySystem.getMoney() >= spec.cost;
    const isValid = !hasOverlap && validFloor && hasEnoughMoney;

    // Create or update ghost preview
    if (!this.ghostPreview) {
      this.ghostPreview = this.add.graphics();
      this.ghostPreview.setDepth(100); // Above everything
    }

    this.ghostPreview.clear();

    const x = position * GRID_SIZE;
    const y = groundY - (floor + 1) * GRID_SIZE;
    const w = spec.width * GRID_SIZE;
    const h = GRID_SIZE;

    // Draw ghost preview
    const color = isValid ? UI_COLORS.validPlacement : UI_COLORS.invalidPlacement;
    const alpha = isValid ? 0.4 : 0.3;

    this.ghostPreview.fillStyle(color, alpha);
    this.ghostPreview.fillRect(x + 2, y + 2, w - 4, h - 4);

    this.ghostPreview.lineStyle(2, color, 0.8);
    this.ghostPreview.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Add pulse effect for invalid
    if (!isValid) {
      this.ghostPreview.lineStyle(1, color, 0.5);
      this.ghostPreview.strokeRect(x, y, w, h);
    }
  }

  private selectRoom(roomId: string | null): void {
    // Deselect previous room
    if (this.selectedRoomId) {
      const prevRoom = this.building.getRoomById(this.selectedRoomId);
      if (prevRoom) {
        prevRoom.setSelected(false);
      }
    }

    // Select new room
    this.selectedRoomId = roomId;
    if (roomId) {
      const room = this.building.getRoomById(roomId);
      if (room) {
        room.setSelected(true);
      }
    }

    // Update registry
    this.registry.set('selectedRoomId', roomId);
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

    // Update volcanic ground (lava animation)
    this.volcanicGround.update(_time);

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
    
    // Calculate star rating (1 star at 100 pop, 2 stars at 300 pop)
    const population = this.residentSystem.getPopulation();
    const starRating = population >= 300 ? 2 : population >= 100 ? 1 : 0;
    this.registry.set('starRating', starRating);
  }
}
