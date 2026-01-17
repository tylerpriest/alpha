import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from './SaveSystem';
import { Building } from '../entities/Building';
import { TimeSystem } from './TimeSystem';
import { EconomySystem } from './EconomySystem';
import { ResourceSystem } from './ResourceSystem';
import { ResidentSystem } from './ResidentSystem';
import { SaveData } from '../utils/types';
import type { GameScene } from '../scenes/GameScene';
import Phaser from 'phaser';

// Mock GameScene
const createMockGameScene = (): GameScene => {
  const mockScene = {
    building: new Building({} as Phaser.Scene),
    timeSystem: new TimeSystem(),
    economySystem: new EconomySystem(10000),
    resourceSystem: new ResourceSystem(),
  } as Partial<GameScene>;

  // Create ResidentSystem with scene reference
  mockScene.residentSystem = new ResidentSystem(mockScene as GameScene);

  return mockScene as GameScene;
};

describe('SaveSystem', () => {
  let gameScene: GameScene;
  let saveSystem: SaveSystem;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    gameScene = createMockGameScene();
    saveSystem = new SaveSystem(gameScene);
  });

  describe('saveGame', () => {
    it('should save game to slot 0 (auto-save)', () => {
      const result = saveSystem.saveGame(0);
      expect(result.success).toBe(true);
      expect(localStorage.getItem('arcology_save_0')).toBeTruthy();
    });

    it('should save game to manual slots 1-3', () => {
      for (let slot = 1; slot <= 3; slot++) {
        const result = saveSystem.saveGame(slot);
        expect(result.success).toBe(true);
        expect(localStorage.getItem(`arcology_save_${slot}`)).toBeTruthy();
      }
    });

    it('should include checksum in save data', () => {
      saveSystem.saveGame(0);
      const json = localStorage.getItem('arcology_save_0');
      expect(json).toBeTruthy();
      if (json) {
        const data: SaveData = JSON.parse(json);
        expect(data.checksum).toBeTruthy();
        expect(typeof data.checksum).toBe('string');
      }
    });

    it('should include version in save data', () => {
      saveSystem.saveGame(0);
      const json = localStorage.getItem('arcology_save_0');
      expect(json).toBeTruthy();
      if (json) {
        const data: SaveData = JSON.parse(json);
        expect(data.version).toBe('1.0.0');
      }
    });
  });

  describe('loadGame', () => {
    it('should load game from slot 0', () => {
      // Save first
      saveSystem.saveGame(0);
      
      // Then load
      const result = saveSystem.loadGame(0);
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      if (result.data) {
        expect(result.data.version).toBe('1.0.0');
        expect(result.data.checksum).toBeTruthy();
      }
    });

    it('should return error for non-existent save', () => {
      const result = saveSystem.loadGame(1);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate checksum on load', () => {
      // Save first
      saveSystem.saveGame(0);
      
      // Corrupt the save
      const json = localStorage.getItem('arcology_save_0');
      if (json) {
        const data: SaveData = JSON.parse(json);
        data.economy.money = 999999; // Change data without updating checksum
        localStorage.setItem('arcology_save_0', JSON.stringify(data));
      }

      // Try to load
      const result = saveSystem.loadGame(0);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Checksum');
    });
  });

  describe('getSlotMetadata', () => {
    it('should return metadata for all slots', () => {
      const metadata = saveSystem.getSlotMetadata();
      expect(metadata).toHaveLength(4);
      expect(metadata[0].slot).toBe(0);
      expect(metadata[1].slot).toBe(1);
      expect(metadata[2].slot).toBe(2);
      expect(metadata[3].slot).toBe(3);
    });

    it('should mark empty slots as isEmpty', () => {
      const metadata = saveSystem.getSlotMetadata();
      expect(metadata[1].isEmpty).toBe(true);
    });

    it('should populate metadata for saved slots', () => {
      saveSystem.saveGame(1);
      const metadata = saveSystem.getSlotMetadata();
      expect(metadata[1].isEmpty).toBe(false);
      expect(metadata[1].timestamp).toBeGreaterThan(0);
    });
  });

  describe('deleteSave', () => {
    it('should delete a save slot', () => {
      saveSystem.saveGame(1);
      expect(localStorage.getItem('arcology_save_1')).toBeTruthy();
      
      const result = saveSystem.deleteSave(1);
      expect(result).toBe(true);
      expect(localStorage.getItem('arcology_save_1')).toBeNull();
    });
  });

  describe('shouldAutoSave', () => {
    it('should return false if not enough days have passed', () => {
      gameScene.timeSystem.setTime(1, 6); // Day 1
      const shouldSave = saveSystem.shouldAutoSave();
      expect(shouldSave).toBe(false);
    });

    it('should return true after 5 days', () => {
      gameScene.timeSystem.setTime(5, 6); // Day 5
      const shouldSave = saveSystem.shouldAutoSave();
      expect(shouldSave).toBe(true);
    });
  });
});
