import { Resident } from '../entities/Resident';
import {
  SaveData,
  BuildingSaveData,
  FloorSaveData,
  RoomSaveData,
  ResidentSaveData,
  EconomySaveData,
  TimeSaveData,
  ResourceSaveData,
  SettingsSaveData,
  SaveSlotMeta,
} from '../utils/types';
import { GameSettings } from '../utils/types';
import type { GameScene } from '../scenes/GameScene';

const SAVE_VERSION = '1.0.0';
const AUTO_SAVE_INTERVAL_DAYS = 5;

// Storage keys
const STORAGE_KEYS = {
  AUTO_SAVE: 'arcology_save_0',
  MANUAL_1: 'arcology_save_1',
  MANUAL_2: 'arcology_save_2',
  MANUAL_3: 'arcology_save_3',
  META: 'arcology_meta',
  SETTINGS: 'arcology_settings',
};

/**
 * Simple checksum generation using a hash of the JSON string.
 * For MVP, we use a simple hash function. In production, consider SHA-256.
 */
function generateChecksum(data: Omit<SaveData, 'checksum'>): string {
  const json = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

function validateSave(data: SaveData): boolean {
  const { checksum, ...rest } = data;
  const calculatedChecksum = generateChecksum(rest);
  return calculatedChecksum === checksum;
}

export class SaveSystem {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /**
   * Get storage key for a save slot
   */
  private getStorageKey(slot: number): string {
    switch (slot) {
      case 0:
        return STORAGE_KEYS.AUTO_SAVE;
      case 1:
        return STORAGE_KEYS.MANUAL_1;
      case 2:
        return STORAGE_KEYS.MANUAL_2;
      case 3:
        return STORAGE_KEYS.MANUAL_3;
      default:
        throw new Error(`Invalid save slot: ${slot}`);
    }
  }

  /**
   * Serialize current game state to SaveData
   */
  private serializeGameState(): Omit<SaveData, 'checksum'> {
    const building = this.scene.building;
    const timeSystem = this.scene.timeSystem;
    const economySystem = this.scene.economySystem;
    const resourceSystem = this.scene.resourceSystem;
    const residentSystem = this.scene.residentSystem;

    // Serialize building
    const floors: FloorSaveData[] = [];
    const rooms: RoomSaveData[] = [];

    building.getFloors().forEach((floor) => {
      floors.push({ level: floor.level });
    });

    building.getAllRooms().forEach((room) => {
      const occupants = room.getResidents().map((r) => r.id);
      const workers = room.getWorkers().map((r) => r.id);

      rooms.push({
        id: room.id,
        type: room.type,
        floorLevel: room.floor,
        gridX: room.position,
        width: room.width,
        occupantIds: occupants,
        workerIds: workers,
        state: {}, // Room-specific state (for future use)
      });
    });

    // Get nextRoomId from building
    const nextRoomId = building.getNextRoomId();

    const buildingData: BuildingSaveData = {
      floors,
      rooms,
      nextRoomId,
    };

    // Serialize residents
    const residents: ResidentSaveData[] = residentSystem.getResidents().map((resident) => {
      const pos = resident.getPosition();
      return {
        id: resident.id,
        name: resident.name,
        type: resident.type,
        hunger: resident.hunger,
        stress: resident.stress,
        jobRoomId: resident.job?.id ?? null,
        homeRoomId: resident.home?.id ?? null,
        state: resident.state,
        position: { x: pos.x, y: pos.y },
      };
    });

    // Serialize economy
    const economyData: EconomySaveData = {
      money: economySystem.getMoney(),
      dailyIncome: economySystem.getDailyIncome(),
      dailyExpenses: economySystem.getDailyExpenses(),
      lastQuarterDay: economySystem.getLastQuarterDay(),
      quarterlyRevenue: economySystem.getQuarterlyRevenue(),
    };

    // Serialize time
    const timeData: TimeSaveData = {
      day: timeSystem.getDay(),
      hour: timeSystem.getHour(),
      minute: timeSystem.getMinute(),
      dayOfWeek: timeSystem.getDayOfWeek(),
      speed: timeSystem.getSpeed(),
      lastAutoSaveDay: timeSystem.getDay(), // Will be updated when auto-saving
    };

    // Serialize resources
    const resourceData: ResourceSaveData = {
      rawFood: resourceSystem.getRawFood(),
      processedFood: resourceSystem.getFood(),
    };

    // Serialize settings
    const settingsData = this.loadSettings();

    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      building: buildingData,
      residents,
      economy: economyData,
      time: timeData,
      resources: resourceData,
      settings: settingsData,
    };
  }

  /**
   * Save game to a specific slot
   */
  saveGame(slot: number): { success: boolean; error?: string } {
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        return { success: false, error: 'localStorage is not available' };
      }

      // Serialize game state
      const dataWithoutChecksum = this.serializeGameState();
      const checksum = generateChecksum(dataWithoutChecksum);
      const saveData: SaveData = {
        ...dataWithoutChecksum,
        checksum,
      };

      // Update lastAutoSaveDay if this is an auto-save
      if (slot === 0) {
        saveData.time.lastAutoSaveDay = saveData.time.day;
      }

      // Convert to JSON and save
      const json = JSON.stringify(saveData);
      const storageKey = this.getStorageKey(slot);

      try {
        localStorage.setItem(storageKey, json);
      } catch (error) {
        // Check if it's a quota exceeded error
        if (error instanceof DOMException && error.code === 22) {
          return { success: false, error: 'Storage quota exceeded. Please delete old saves.' };
        }
        throw error;
      }

      // Update metadata
      this.updateSlotMetadata(slot, saveData);

      return { success: true };
    } catch (error) {
      console.error('Save failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Load game from a specific slot
   */
  loadGame(slot: number): { success: boolean; data?: SaveData; error?: string } {
    try {
      const storageKey = this.getStorageKey(slot);
      const json = localStorage.getItem(storageKey);

      if (!json) {
        return { success: false, error: 'Save file not found' };
      }

      // Parse JSON
      let saveData: SaveData;
      try {
        saveData = JSON.parse(json);
      } catch {
        return { success: false, error: 'Corrupted save file: Invalid JSON' };
      }

      // Validate version
      if (saveData.version !== SAVE_VERSION) {
        return { success: false, error: `Version mismatch: Save is version ${saveData.version}, game expects ${SAVE_VERSION}` };
      }

      // Validate checksum
      if (!validateSave(saveData)) {
        return { success: false, error: 'Corrupted save file: Checksum mismatch' };
      }

      return { success: true, data: saveData };
    } catch (error) {
      console.error('Load failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Deserialize and restore game state from SaveData
   */
  restoreGameState(saveData: SaveData): void {
    // Pause game during restoration
    const wasPaused = this.scene.timeSystem.isPaused();
    this.scene.timeSystem.setSpeed(0);

    try {
      // Clear existing state
      this.scene.building.clear();
      this.scene.residentSystem.getResidents().forEach((r) => {
        this.scene.residentSystem.removeResident(r);
      });

      // Restore building (with specific IDs)
      saveData.building.rooms.forEach((roomData) => {
        this.scene.building.addRoom(roomData.type, roomData.floorLevel, roomData.gridX, roomData.id);
      });

      // Restore nextRoomId
      this.scene.building.setNextRoomId(saveData.building.nextRoomId);

      // Restore residents
      // First, we need to restore residents with their original IDs
      // Since spawnResident creates new IDs, we'll need to manually create residents
      const residentMap = new Map<string, Resident>();
      
      // Find max resident ID to set nextResidentId
      let maxResidentId = 0;
      saveData.residents.forEach((residentData) => {
        const match = residentData.id.match(/resident_(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          maxResidentId = Math.max(maxResidentId, num);
        }
      });
      this.scene.residentSystem.setNextResidentId(maxResidentId + 1);

      saveData.residents.forEach((residentData) => {
        const homeRoom = this.scene.building.getRoomById(residentData.homeRoomId ?? '');
        if (homeRoom) {
          // Create resident manually to preserve ID
          const pos = residentData.position;
          const resident = new Resident(this.scene, residentData.id, pos.x, pos.y);
          // Update name and label
          resident.name = residentData.name;
          (resident as any).nameLabel.setText(residentData.name);
          resident.type = residentData.type ?? 'resident'; // Restore type (default to 'resident' for old saves)
          resident.hunger = residentData.hunger;
          resident.stress = residentData.stress ?? 0; // Restore stress (default to 0 for old saves)
          resident.state = residentData.state;
          resident.setHome(homeRoom);

          // Restore job
          if (residentData.jobRoomId) {
            const jobRoom = this.scene.building.getRoomById(residentData.jobRoomId);
            if (jobRoom) {
              resident.setJob(jobRoom);
            }
          }

          // Add to resident system
          this.scene.residentSystem.addResident(resident);
          residentMap.set(residentData.id, resident);
        }
      });

      // Restore economy
      this.scene.economySystem.setMoney(saveData.economy.money);
      // Restore quarterly revenue tracking (with backward compatibility)
      if (saveData.economy.lastQuarterDay !== undefined) {
        this.scene.economySystem.setLastQuarterDay(saveData.economy.lastQuarterDay);
      }

      // Restore time
      this.scene.timeSystem.setTime(
        saveData.time.day,
        saveData.time.hour,
        saveData.time.dayOfWeek
      );
      this.scene.timeSystem.setSpeed(saveData.time.speed);

      // Restore resources
      this.scene.resourceSystem.setFood(saveData.resources.rawFood, saveData.resources.processedFood);

      // Restore settings (save to localStorage)
      this.saveSettings(saveData.settings);

      // Redraw all rooms
      this.scene.building.redrawAllRooms();

      // Restore pause state
      if (!wasPaused && saveData.time.speed > 0) {
        this.scene.timeSystem.setSpeed(saveData.time.speed);
      }
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * Get metadata for all save slots
   */
  getSlotMetadata(): SaveSlotMeta[] {
    const slots: SaveSlotMeta[] = [];

    for (let slot = 0; slot <= 3; slot++) {
      const storageKey = this.getStorageKey(slot);
      const json = localStorage.getItem(storageKey);

      if (!json) {
        slots.push({
          slot,
          isEmpty: true,
          timestamp: 0,
          dayCount: 0,
          population: 0,
          money: 0,
        });
      } else {
        try {
          const saveData: SaveData = JSON.parse(json);
          slots.push({
            slot,
            isEmpty: false,
            timestamp: saveData.timestamp,
            dayCount: saveData.time.day,
            population: saveData.residents.length,
            money: saveData.economy.money,
          });
        } catch {
          // Corrupted save
          slots.push({
            slot,
            isEmpty: true,
            timestamp: 0,
            dayCount: 0,
            population: 0,
            money: 0,
          });
        }
      }
    }

    return slots;
  }

  /**
   * Update metadata for a specific slot
   */
  private updateSlotMetadata(slot: number, saveData: SaveData): void {
    const meta = this.getSlotMetadata();
    meta[slot] = {
      slot,
      isEmpty: false,
      timestamp: saveData.timestamp,
      dayCount: saveData.time.day,
      population: saveData.residents.length,
      money: saveData.economy.money,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
    } catch (error) {
      console.warn('Failed to update metadata:', error);
    }
  }

  /**
   * Delete a save slot
   */
  deleteSave(slot: number): boolean {
    try {
      const storageKey = this.getStorageKey(slot);
      localStorage.removeItem(storageKey);
      this.updateSlotMetadata(slot, {
        version: SAVE_VERSION,
        timestamp: 0,
        checksum: '',
        building: { floors: [], rooms: [], nextRoomId: 1 },
        residents: [],
        economy: { money: 0, dailyIncome: 0, dailyExpenses: 0, lastQuarterDay: 0, quarterlyRevenue: 0 },
        time: { day: 0, hour: 0, minute: 0, dayOfWeek: 0, speed: 1, lastAutoSaveDay: 0 },
        resources: { rawFood: 0, processedFood: 0 },
        settings: { masterVolume: 80, uiVolume: 100, ambientVolume: 50, defaultGameSpeed: 1 },
      });
      return true;
    } catch (error) {
      console.error('Delete save failed:', error);
      return false;
    }
  }

  /**
   * Check if auto-save should trigger
   */
  shouldAutoSave(): boolean {
    const timeSystem = this.scene.timeSystem;
    const currentDay = timeSystem.getDay();

    // Load last auto-save day from time system or check save file
    const autoSaveData = this.loadGame(0);
    if (autoSaveData.success && autoSaveData.data) {
      const lastAutoSaveDay = autoSaveData.data.time.lastAutoSaveDay;
      return currentDay - lastAutoSaveDay >= AUTO_SAVE_INTERVAL_DAYS;
    }

    // First auto-save
    return currentDay >= AUTO_SAVE_INTERVAL_DAYS;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): SettingsSaveData {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const settings: GameSettings = JSON.parse(stored);
        return {
          masterVolume: settings.masterVolume,
          uiVolume: settings.uiVolume,
          ambientVolume: settings.ambientVolume,
          defaultGameSpeed: settings.defaultGameSpeed,
        };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }

    // Default settings
    return {
      masterVolume: 80,
      uiVolume: 100,
      ambientVolume: 50,
      defaultGameSpeed: 1,
    };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(settings: SettingsSaveData): void {
    try {
      const gameSettings: GameSettings = {
        masterVolume: settings.masterVolume,
        uiVolume: settings.uiVolume,
        ambientVolume: settings.ambientVolume,
        defaultGameSpeed: settings.defaultGameSpeed as 1 | 2 | 4,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(gameSettings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
}
