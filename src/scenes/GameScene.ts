import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { TimeSystem } from '../systems/TimeSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { ResidentSystem } from '../systems/ResidentSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { RestaurantSystem } from '../systems/RestaurantSystem';
import { VenusAtmosphere } from '../graphics/VenusAtmosphere';
import { DayNightOverlay } from '../graphics/DayNightOverlay';
import { AtmosphericEffects } from '../graphics/AtmosphericEffects';
import { VolcanicGround } from '../graphics/VolcanicGround';
import { BuildingFrame } from '../graphics/BuildingFrame';
import { UIManager } from '../ui/UIManager';
import { INITIAL_MONEY, GRID_SIZE, ROOM_SPECS, RoomType, UI_COLORS, MAX_FLOORS_MVP } from '../utils/constants';
import { GameState, ElevatorState } from '../utils/types';
import { SaveSystem } from '../systems/SaveSystem';
import { ElevatorSystem } from '../systems/ElevatorSystem';

export class GameScene extends Phaser.Scene {
  public building!: Building;
  public timeSystem!: TimeSystem;
  public economySystem!: EconomySystem;
  public residentSystem!: ResidentSystem;
  public resourceSystem!: ResourceSystem;
  public restaurantSystem!: RestaurantSystem;
  public saveSystem!: SaveSystem;
  public elevatorSystem!: ElevatorSystem;

  private venusAtmosphere!: VenusAtmosphere;
  private dayNightOverlay!: DayNightOverlay;
  private atmosphericEffects!: AtmosphericEffects;
  private volcanicGround!: VolcanicGround;
  private buildingFrame!: BuildingFrame;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;
  private ghostPreview: Phaser.GameObjects.Graphics | null = null;
  private selectedRoomId: string | null = null;
  private uiManager!: UIManager;
  private elevatorGraphics: Phaser.GameObjects.Graphics | null = null;
  private maxPopulation = 0;
  private hasShownVictory = false;
  private hasShownGameOver = false;
  private lastRoomRedrawHour = -1;
  private lastAutoSaveDay = 0;
  
  // Notification tracking (to avoid spamming)
  private hasShownLowRationsWarning = false;
  private hasShownZeroRationsAlert = false;
  private hasShownBankruptcyWarning = false;
  private hasShownStarvationAlert = false;
  private lastNotificationCheckHour = -1;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Set game state
    this.registry.set('gameState', GameState.PLAYING);

    // Initialize systems
    this.timeSystem = new TimeSystem();
    this.economySystem = new EconomySystem(INITIAL_MONEY);
    this.resourceSystem = new ResourceSystem();
    this.building = new Building(this);
    this.elevatorSystem = new ElevatorSystem(this.building);
    this.residentSystem = new ResidentSystem(this);
    this.restaurantSystem = new RestaurantSystem(
      this.building,
      this.resourceSystem,
      this.timeSystem
    );
    this.saveSystem = new SaveSystem(this);

    // Check if we need to load a save
    const loadSaveSlot = this.registry.get('loadSaveSlot') as number | undefined;
    if (loadSaveSlot !== undefined) {
      this.loadGame(loadSaveSlot);
      this.registry.set('loadSaveSlot', undefined);
    }

    // Set up camera
    this.cameras.main.setBounds(-1000, -2000, 3280, 3720);
    this.cameras.main.scrollY = -500;

    // Create Venus atmosphere background (behind everything)
    this.venusAtmosphere = new VenusAtmosphere(this);

    // Create volcanic ground with lava and alien flora
    this.volcanicGround = new VolcanicGround(this);

    // Draw grid lines for reference
    this.drawGrid();

    // Create building structural frame
    this.buildingFrame = new BuildingFrame(this);
    this.buildingFrame.draw(0); // Initial draw with lobby only

    // Create initial lobby
    this.building.addRoom('lobby', 0, 0);
    
    // Create elevator shaft for lobby (centered in lobby, which is 20 units wide)
    // Zone 0: floors 0-14
    const lobbyCenter = 10; // Lobby is at position 0, width 20, so center is at 10
    this.elevatorSystem.createShaft('shaft_0', lobbyCenter, 0);

    // Create day/night overlay (above rooms)
    this.dayNightOverlay = new DayNightOverlay(this);

    // Create atmospheric particle effects
    this.atmosphericEffects = new AtmosphericEffects(this);

    // Launch Phaser UI scene (for in-game overlays)
    this.scene.launch('UIScene');

    // Create DOM UI Manager
    this.uiManager = new UIManager(this.registry);
    
    // Create elevator graphics
    this.elevatorGraphics = this.add.graphics();
    this.elevatorGraphics.setDepth(15); // Above rooms, below UI
    
    // Wire up overlay callbacks
    this.uiManager.setVictoryCallbacks(
      () => {
        // Continue playing - just hide overlay and resume
        this.timeSystem.setSpeed(1);
        this.registry.set('gameSpeed', 1);
        this.registry.set('isPaused', false);
        const event = new CustomEvent('speed-change', { detail: { speed: 1 } });
        document.dispatchEvent(event);
      },
      () => {
        // Main menu - reload the scene for now (menu system not yet implemented)
        this.scene.restart();
      }
    );
    
    this.uiManager.setGameOverCallbacks(
      () => {
        // Restart - reload the scene
        this.scene.restart();
      },
      () => {
        // Main menu - reload the scene for now (menu system not yet implemented)
        this.scene.restart();
      }
    );

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

    // Listen for economy breakdown request
    document.addEventListener('show-economy-breakdown', () => {
      this.showEconomyBreakdown();
    });

    // Listen to speed change events from UI
    document.addEventListener('speed-change', ((e: CustomEvent<{ speed: number }>) => {
      this.timeSystem.setSpeed(e.detail.speed);
      this.registry.set('gameSpeed', e.detail.speed);
      this.registry.set('isPaused', e.detail.speed === 0);
    }) as EventListener);

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

    // Keyboard shortcuts
    if (this.input.keyboard) {
      // Space to toggle pause
      this.input.keyboard.on('keydown-SPACE', () => {
        // Toggle pause
        const currentSpeed = this.timeSystem.getSpeed();
        if (currentSpeed === 0) {
          // Resume at last speed (default to 1x)
          this.timeSystem.setSpeed(1);
        } else {
          // Pause
          this.timeSystem.setSpeed(0);
        }
        this.registry.set('gameSpeed', this.timeSystem.getSpeed());
        this.registry.set('isPaused', this.timeSystem.isPaused());
        // Update UI
        const event = new CustomEvent('speed-change', { detail: { speed: this.timeSystem.getSpeed() } });
        document.dispatchEvent(event);
      });

      // Room type selection (1-7)
      const roomTypes = Object.keys(ROOM_SPECS) as RoomType[];
      const keyCodes = [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO,
        Phaser.Input.Keyboard.KeyCodes.THREE, Phaser.Input.Keyboard.KeyCodes.FOUR,
        Phaser.Input.Keyboard.KeyCodes.FIVE, Phaser.Input.Keyboard.KeyCodes.SIX,
        Phaser.Input.Keyboard.KeyCodes.SEVEN];
      
      keyCodes.forEach((keyCode, index) => {
        const key = this.input.keyboard!.addKey(keyCode);
        key.on('down', () => {
          if (index < roomTypes.length) {
            this.registry.set('selectedRoom', roomTypes[index]);
          }
        });
      });

      // Q to cancel placement
      const qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      qKey.on('down', () => {
        this.registry.set('selectedRoom', undefined);
      });

      // ESC to open pause menu
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => {
        // Only open pause menu if we're playing (not already paused)
        const gameState = this.registry.get('gameState');
        if (gameState !== GameState.PAUSED && gameState !== GameState.GAME_OVER && gameState !== GameState.VICTORY) {
          this.scene.launch('PauseMenuScene');
        }
      });

      // Delete to demolish selected room
      const deleteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
      deleteKey.on('down', () => {
      if (this.selectedRoomId) {
        const room = this.building.getRoomById(this.selectedRoomId);
        if (room) {
          // Evict residents and workers
          const residents = [...room.getResidents()];
          const workers = [...room.getWorkers()];
          residents.forEach((r) => {
            room.removeResident(r);
            this.residentSystem.removeResident(r);
          });
          workers.forEach((w) => {
            room.removeWorker(w);
            // Workers are also residents, so they're already handled above
          });

          // Refund 50% of cost
          const spec = ROOM_SPECS[room.type];
          const refund = Math.floor(spec.cost * 0.5);
          this.economySystem.earn(refund);

          // Remove room
          this.building.removeRoom(this.selectedRoomId);
          this.selectRoom(null);
          this.updateRegistry();
        }
      }
      });
    }
  }

  private handleClick(worldX: number, worldY: number): void {
    // Get selected room type from registry
    const selectedRoom = this.registry.get('selectedRoom') as string | undefined;
    
    // Convert world coordinates to grid position
    const groundY = 500;
    const floor = Math.floor((groundY - worldY) / GRID_SIZE);
    const position = Math.floor(worldX / GRID_SIZE);

    if (selectedRoom) {
      // Check building height limit before attempting placement
      if (floor >= MAX_FLOORS_MVP) {
        this.uiManager.showError(
          `Building height limit reached! Maximum ${MAX_FLOORS_MVP} floors (floors 0-${MAX_FLOORS_MVP - 1}) for MVP.`
        );
        return;
      }

      // Try to place room
      const success = this.building.addRoom(selectedRoom, floor, position);
      if (success) {
        const cost = this.building.getRoomCost(selectedRoom);
        this.economySystem.spend(cost);
        
        // If lobby or sky lobby is placed, create elevator shaft for that zone
        if (selectedRoom === 'lobby' || selectedRoom === 'skylobby') {
          const lobbyCenter = position + (ROOM_SPECS[selectedRoom].width / 2);
          const shaftId = `shaft_${this.elevatorSystem.getAllShafts().length}`;
          // Determine zone: lobby on floor 0 = zone 0, sky lobby on floor 15 = zone 1, etc.
          const zone = selectedRoom === 'lobby' ? 0 : Math.floor(floor / 15);
          this.elevatorSystem.createShaft(shaftId, lobbyCenter, zone);
        }
        
        this.updateRegistry();
      } else {
        // Room placement failed - show error notification
        // (Building.addRoom already logs the specific reason)
        if (floor >= MAX_FLOORS_MVP) {
          this.uiManager.showError(
            `Cannot place room: Building height limit is ${MAX_FLOORS_MVP} floors (floors 0-${MAX_FLOORS_MVP - 1})`
          );
        } else {
          this.uiManager.showError('Cannot place room here. Check floor constraints and overlaps.');
        }
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
        
        // Calculate room income/expenses
        const spec = ROOM_SPECS[room.type];
        let income = 0;
        const expenses = spec.expenses || 0;

        // Calculate income based on room type
        if ('income' in spec) {
          income = spec.income;
          // For apartments, income is per resident
          if (room.type === 'apartment') {
            income = income * room.getResidentCount();
          }
          // For offices, income is per worker
          if (room.type === 'office') {
            income = spec.income * room.getWorkerCount();
          }
        }

        // Update registry with room info
        this.registry.set('roomInfo', {
          id: room.id,
          type: room.type,
          residents: room.getResidentCount(),
          workers: room.getWorkerCount(),
          income,
          expenses,
        });
      }
    } else {
      // Clear room info
      this.registry.set('roomInfo', null);
    }

    // Update registry
    this.registry.set('selectedRoomId', roomId);
  }

  update(_time: number, delta: number): void {
    // Check for game over conditions first (before updating)
    if (!this.hasShownGameOver && this.economySystem.isBankrupt()) {
      this.hasShownGameOver = true;
      const cycles = this.timeSystem.getDay();
      const credits = this.economySystem.getMoney();
      this.timeSystem.setSpeed(0); // Pause game
      this.registry.set('gameSpeed', 0);
      this.registry.set('isPaused', true);
      const event = new CustomEvent('speed-change', { detail: { speed: 0 } });
      document.dispatchEvent(event);
      this.uiManager.showGameOver(cycles, this.maxPopulation, credits);
      return; // Don't update anything else when game over
    }

    // Check for victory condition
    const population = this.residentSystem.getPopulation();
    if (!this.hasShownVictory && population >= 300) {
      this.hasShownVictory = true;
      const cycles = this.timeSystem.getDay();
      const credits = this.economySystem.getMoney();
      const rooms = this.building.getAllRooms().length;
      this.timeSystem.setSpeed(0); // Pause game
      this.registry.set('gameSpeed', 0);
      this.registry.set('isPaused', true);
      const event = new CustomEvent('speed-change', { detail: { speed: 0 } });
      document.dispatchEvent(event);
      this.uiManager.showVictory(cycles, population, credits, rooms);
      // Don't return - allow game to continue updating (but paused)
    }

    // Skip updates if paused
    if (this.timeSystem.isPaused()) {
      return;
    }

    // Update time
    this.timeSystem.update(delta);
    
    // Update elevator system
    this.elevatorSystem.update(delta);

    // Track max population
    if (population > this.maxPopulation) {
      this.maxPopulation = population;
    }

    // Track max population
    if (population > this.maxPopulation) {
      this.maxPopulation = population;
    }

    // Update atmosphere and lighting based on time of day
    const hour = this.timeSystem.getHour();
    this.venusAtmosphere.update(hour, this.cameras.main.scrollX);
    this.dayNightOverlay.update(hour);

    // Redraw rooms when hour changes significantly (for night glow effects)
    // Redraw every 0.25 hours (15 minutes) for smooth day/night transitions
    const currentHourQuarter = Math.floor(hour * 4) / 4;
    if (currentHourQuarter !== this.lastRoomRedrawHour) {
      this.building.redrawAllRooms();
      this.lastRoomRedrawHour = currentHourQuarter;
    }

    // Update atmospheric particles
    this.atmosphericEffects.update(delta);

    // Update volcanic ground (lava animation)
    this.volcanicGround.update(_time);

    // Update building frame to reflect current height
    const topFloor = this.building.getTopFloor();
    this.buildingFrame.draw(topFloor);

    // Draw elevators
    this.drawElevators();

    // Update residents
    this.residentSystem.update(delta);

    // Update resources
    this.resourceSystem.update(delta, this.building);

      // Daily economy update
      if (this.timeSystem.isNewDay()) {
        const currentDay = this.timeSystem.getDay();
        
        // Process restaurant operations (consumes food, calculates income)
        this.restaurantSystem.processDailyOperations();
        this.economySystem.processDailyIncome(
          this.building,
          this.residentSystem,
          this.resourceSystem,
          this.restaurantSystem
        );
        this.economySystem.processDailyExpenses(this.building);

        // Process quarterly office revenue (every 90 days)
        const quarterlyProcessed = this.economySystem.processQuarterlyRevenue(this.building, currentDay);
        if (quarterlyProcessed) {
          const quarterlyAmount = this.economySystem.getQuarterlyRevenue();
          console.log(`Quarterly office revenue: ${quarterlyAmount.toLocaleString()} CR`);
          
          // Show notification to player
          this.uiManager.showSuccess(
            `Quarterly Office Revenue: +${quarterlyAmount.toLocaleString()} CR`,
            7000 // Show for 7 seconds
          );
        }

        // Check for auto-save (every 5 days)
        if (currentDay - this.lastAutoSaveDay >= 5) {
          const result = this.saveSystem.saveGame(0); // Auto-save to slot 0
          if (result.success) {
            this.lastAutoSaveDay = currentDay;
            console.log('Auto-saved game');
          } else {
            console.warn('Auto-save failed:', result.error);
          }
        }
      }

    // Check for important notifications (check every hour to avoid spamming)
    const currentHour = Math.floor(this.timeSystem.getHour());
    if (currentHour !== this.lastNotificationCheckHour) {
      this.checkNotifications();
      this.lastNotificationCheckHour = currentHour;
    }

    // Update registry for UI
    this.updateRegistry();
  }

  /**
   * Check for important game events and show notifications
   */
  private checkNotifications(): void {
    const credits = this.economySystem.getMoney();
    const rations = this.resourceSystem.getFood();
    const population = this.residentSystem.getPopulation();
    
    // Bankruptcy warning: Show when credits drop below -$5,000 (halfway to bankruptcy)
    const BANKRUPTCY_THRESHOLD = -10000;
    const BANKRUPTCY_WARNING_THRESHOLD = -5000;
    if (credits < BANKRUPTCY_WARNING_THRESHOLD && credits >= BANKRUPTCY_THRESHOLD) {
      if (!this.hasShownBankruptcyWarning) {
        this.uiManager.showWarning(
          `Warning: Credits critically low (${credits.toLocaleString()} CR). Bankruptcy at ${BANKRUPTCY_THRESHOLD.toLocaleString()} CR.`,
          8000 // Show for 8 seconds
        );
        this.hasShownBankruptcyWarning = true;
      }
    } else if (credits >= BANKRUPTCY_WARNING_THRESHOLD) {
      // Reset warning flag if credits recover
      this.hasShownBankruptcyWarning = false;
    }

    // Low rations warning: Show when processed food is below 1 day's consumption
    // Estimate: ~3 meals per resident per day, plus restaurant consumption
    const mealsPerResidentPerDay = 3;
    const estimatedDailyConsumption = population * mealsPerResidentPerDay;
    // Also account for restaurant consumption (rough estimate: 30 per fast food, 20 per restaurant)
    const fastFoods = this.building.getFastFoods();
    const restaurants = this.building.getRestaurants();
    const restaurantConsumption = (fastFoods.length * 30) + (restaurants.length * 20);
    const totalDailyConsumption = estimatedDailyConsumption + restaurantConsumption;
    
    // Warn when rations are below 1 day's consumption
    if (rations === 0) {
      // Show critical warning if rations hit zero
      if (!this.hasShownZeroRationsAlert) {
        this.uiManager.showError(
          'Critical: No rations remaining! Residents will starve!',
          10000 // Show for 10 seconds
        );
        this.hasShownZeroRationsAlert = true;
        // Reset low warning flag so it can show again if rations recover then drop
        this.hasShownLowRationsWarning = false;
      }
    } else if (rations < totalDailyConsumption) {
      if (!this.hasShownLowRationsWarning) {
        this.uiManager.showWarning(
          `Low Rations: ${Math.floor(rations)} remaining. Build more farms and kitchens!`,
          7000 // Show for 7 seconds
        );
        this.hasShownLowRationsWarning = true;
      }
      // Reset zero alert flag if rations recover above zero
      this.hasShownZeroRationsAlert = false;
    } else if (rations >= totalDailyConsumption) {
      // Reset warning flags if rations recover to safe levels
      this.hasShownLowRationsWarning = false;
      this.hasShownZeroRationsAlert = false;
    }

    // Starvation alert: Check if any residents have hunger at 0
    const residents = this.residentSystem.getResidents();
    const starvingResidents = residents.filter(r => r.hunger === 0);
    if (starvingResidents.length > 0) {
      if (!this.hasShownStarvationAlert) {
        this.uiManager.showError(
          `Alert: ${starvingResidents.length} resident${starvingResidents.length > 1 ? 's' : ''} starving! Build farms and kitchens immediately!`,
          10000 // Show for 10 seconds
        );
        this.hasShownStarvationAlert = true;
      }
    } else {
      // Reset alert flag if no residents are starving
      this.hasShownStarvationAlert = false;
    }
  }

  private showEconomyBreakdown(): void {
    const incomeBreakdown = this.economySystem.getIncomeBreakdown(
      this.building,
      this.residentSystem,
      this.resourceSystem,
      this.restaurantSystem
    );
    const expenseBreakdown = this.economySystem.getExpenseBreakdown(this.building);
    const currentMoney = this.economySystem.getMoney();
    const quarterlyRevenue = this.economySystem.getQuarterlyRevenue();
    const lastQuarterDay = this.economySystem.getLastQuarterDay();
    const currentDay = this.timeSystem.getDay();
    const foodAvailable = this.resourceSystem.getFood() > 0;
    const averageSatisfaction = this.residentSystem.getAverageSatisfaction(foodAvailable);

    this.uiManager.showEconomyBreakdown(
      incomeBreakdown,
      expenseBreakdown,
      currentMoney,
      quarterlyRevenue,
      lastQuarterDay,
      currentDay,
      averageSatisfaction
    );
  }

  private loadGame(slot: number): void {
    const result = this.saveSystem.loadGame(slot);
    if (result.success && result.data) {
      try {
        this.saveSystem.restoreGameState(result.data);
        this.lastAutoSaveDay = result.data.time.lastAutoSaveDay;
        console.log('Game loaded successfully');
      } catch (error) {
        console.error('Failed to restore game state:', error);
        alert('Failed to load game. Starting new game.');
      }
    } else {
      console.error('Failed to load game:', result.error);
      alert(`Failed to load game: ${result.error}. Starting new game.`);
    }
  }

  private drawElevators(): void {
    if (!this.elevatorGraphics) return;

    this.elevatorGraphics.clear();

    const groundY = 500;
    const shafts = this.elevatorSystem.getAllShafts();
    const shaftColor = 0x2a2a3a;
    const carColor = 0x4a8ae4;
    const accentColor = 0x4ae4e4;

    for (const shaft of shafts) {
      const shaftX = shaft.position * GRID_SIZE;
      const topFloor = this.building.getTopFloor();
      const minFloor = Math.max(0, shaft.minFloor);
      const maxFloor = Math.min(topFloor, shaft.maxFloor);

      // Draw shaft (vertical column)
      const topY = groundY - (maxFloor + 1) * GRID_SIZE;
      const bottomY = groundY - minFloor * GRID_SIZE;
      const shaftWidth = GRID_SIZE; // 1 grid unit wide

      // Shaft background
      this.elevatorGraphics.fillStyle(shaftColor, 0.8);
      this.elevatorGraphics.fillRect(shaftX, topY, shaftWidth, bottomY - topY);

      // Shaft border
      this.elevatorGraphics.lineStyle(2, accentColor, 0.5);
      this.elevatorGraphics.strokeRect(shaftX, topY, shaftWidth, bottomY - topY);

      // Draw elevator car
      const car = shaft.car;
      const carFloorY = car.getVisualY(); // Returns negative offset from ground
      const carY = groundY + carFloorY; // Add to ground Y (groundY is 500)
      const carHeight = GRID_SIZE * 0.8;
      const carWidth = GRID_SIZE * 0.7;
      const carX = shaftX + (shaftWidth - carWidth) / 2;

      // Car body
      this.elevatorGraphics.fillStyle(carColor, 0.9);
      this.elevatorGraphics.fillRect(carX, carY - carHeight, carWidth, carHeight);

      // Car border
      this.elevatorGraphics.lineStyle(2, accentColor, 1);
      this.elevatorGraphics.strokeRect(carX, carY - carHeight, carWidth, carHeight);

      // Floor number display
      const textX = carX + carWidth / 2;
      const textY = carY - carHeight / 2;
      this.elevatorGraphics.fillStyle(0xffffff, 1);
      this.elevatorGraphics.fillRect(textX - 8, textY - 6, 16, 12);
      this.elevatorGraphics.fillStyle(0x000000, 1);
      this.elevatorGraphics.fillRect(textX - 6, textY - 4, 12, 8);

      // Draw floor number text (using Phaser text)
      // Note: We'll need to manage text objects separately or use a different approach
      // For now, just draw a simple indicator
      this.elevatorGraphics.fillStyle(accentColor, 1);
      this.elevatorGraphics.fillRect(textX - 4, textY - 2, 8, 4);

      // Door indicators (if doors are opening/closing)
      if (car.state === ElevatorState.DOORS_OPENING || car.state === ElevatorState.LOADING || car.state === ElevatorState.DOORS_CLOSING) {
        const doorAlpha = car.state === ElevatorState.LOADING ? 0.8 : 0.4;
        this.elevatorGraphics.lineStyle(3, accentColor, doorAlpha);
        this.elevatorGraphics.strokeRect(carX + 2, carY - carHeight + 2, carWidth - 4, carHeight - 4);
      }
    }
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
    
    // Calculate building-wide satisfaction
    const foodAvailable = this.resourceSystem.getFood() > 0;
    const avgSatisfaction = this.residentSystem.getAverageSatisfaction(foodAvailable);
    this.registry.set('averageSatisfaction', Math.round(avgSatisfaction));
  }
}
