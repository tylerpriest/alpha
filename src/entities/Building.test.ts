import { describe, test, expect, beforeEach } from 'vitest';
import { Building } from './Building';
import { MAX_FLOORS_MVP, SKY_LOBBY_FLOORS, getSkyLobbyZone } from '../utils/constants';
import Phaser from 'phaser';

// Mock Phaser Scene
const createMockScene = (): Phaser.Scene => {
  const mockGraphics = {
    fillStyle: () => {},
    fillRect: () => {},
    clear: () => {},
    lineStyle: () => {},
    lineBetween: () => {},
    destroy: () => {},
    setDepth: () => {},
    setBlendMode: () => {},
  };

  const mockText = {
    setDepth: () => {},
    setText: () => {},
    setPosition: () => {},
    setStyle: () => {},
    destroy: () => {},
  };

  return {
    add: {
      graphics: () => mockGraphics,
      text: () => mockText,
    },
    registry: {
      get: () => 12, // Default hour
    },
  } as unknown as Phaser.Scene;
};

describe('Building', () => {
  let building: Building;
  let mockScene: Phaser.Scene;

  beforeEach(() => {
    mockScene = createMockScene();
    building = new Building(mockScene);
  });

  describe('Height Limit Enforcement', () => {
    test('allows room placement on valid floors (0-19)', () => {
      // Floor 0 (ground floor)
      expect(building.addRoom('lobby', 0, 0)).toBe(true);
      
      // Floor 1
      expect(building.addRoom('apartment', 1, 0)).toBe(true);
      
      // Floor 19 (last valid floor)
      expect(building.addRoom('apartment', 19, 0)).toBe(true);
    });

    test('prevents room placement on floor 20 (exceeds MVP limit)', () => {
      const result = building.addRoom('apartment', 20, 0);
      expect(result).toBe(false);
    });

    test('prevents room placement on floors above MVP limit', () => {
      expect(building.addRoom('apartment', 21, 0)).toBe(false);
      expect(building.addRoom('apartment', 30, 0)).toBe(false);
      expect(building.addRoom('apartment', 50, 0)).toBe(false);
      expect(building.addRoom('apartment', 100, 0)).toBe(false);
    });

    test('height limit check happens before overlap check', () => {
      // Even if position is valid, height limit should prevent placement
      expect(building.addRoom('apartment', MAX_FLOORS_MVP, 0)).toBe(false);
      expect(building.addRoom('apartment', MAX_FLOORS_MVP + 1, 0)).toBe(false);
    });

    test('height limit applies to all room types', () => {
      const roomTypes = ['apartment', 'office', 'farm', 'kitchen', 'fastfood', 'restaurant'];
      
      roomTypes.forEach((type) => {
        expect(building.addRoom(type, MAX_FLOORS_MVP, 0)).toBe(false);
        expect(building.addRoom(type, MAX_FLOORS_MVP + 5, 0)).toBe(false);
      });
    });

    test('can place rooms up to floor 19 (last valid floor)', () => {
      // Place rooms on all valid floors
      for (let floor = 0; floor < MAX_FLOORS_MVP; floor++) {
        if (floor === 0) {
          // Lobby can only be on floor 0
          expect(building.addRoom('lobby', floor, 0)).toBe(true);
        } else {
          // Other rooms can be on floors 1-19
          expect(building.addRoom('apartment', floor, 0)).toBe(true);
        }
      }
      
      // Verify we can't place on floor 20
      expect(building.addRoom('apartment', MAX_FLOORS_MVP, 0)).toBe(false);
    });

    test('height limit check happens after floor constraint check', () => {
      // Lobby can only be on floor 0, but height limit should still apply
      expect(building.addRoom('lobby', 0, 0)).toBe(true); // Valid
      expect(building.addRoom('lobby', 1, 0)).toBe(false); // Invalid floor constraint
      expect(building.addRoom('lobby', MAX_FLOORS_MVP, 0)).toBe(false); // Invalid height limit
    });
  });

  describe('Room Placement (General)', () => {
    test('can place room on valid floor with valid position', () => {
      expect(building.addRoom('apartment', 1, 0)).toBe(true);
      expect(building.getRoomAt(1, 0)).toBeDefined();
    });

    test('prevents overlapping rooms on same floor', () => {
      building.addRoom('apartment', 1, 0);
      expect(building.addRoom('apartment', 1, 0)).toBe(false); // Overlaps
      expect(building.addRoom('apartment', 1, 1)).toBe(false); // Overlaps
      expect(building.addRoom('apartment', 1, 2)).toBe(true); // No overlap
    });

    test('allows same position on different floors', () => {
      building.addRoom('apartment', 1, 0);
      expect(building.addRoom('apartment', 2, 0)).toBe(true); // Different floor
    });
  });

  describe('Sky Lobby System', () => {
    test('can place sky lobby on valid floors (15, 30, 45, etc.)', () => {
      for (const floor of SKY_LOBBY_FLOORS) {
        if (floor < MAX_FLOORS_MVP) {
          expect(building.addRoom('skylobby', floor, 0)).toBe(true);
          expect(building.hasSkyLobbyOnFloor(floor)).toBe(true);
        }
      }
    });

    test('prevents sky lobby placement on invalid floors', () => {
      // Sky lobby can only be on specific floors: 15, 30, 45, 60, 75, 90
      const invalidFloors = [1, 2, 14, 16, 20, 25, 29, 31, 35, 40];
      for (const floor of invalidFloors) {
        if (floor < MAX_FLOORS_MVP) {
          expect(building.addRoom('skylobby', floor, 0)).toBe(false);
        }
      }
    });

    test('prevents building above floor 14 without sky lobby on floor 15', () => {
      // Can build on floors 0-14 without sky lobby
      expect(building.addRoom('apartment', 14, 0)).toBe(true);
      
      // Cannot build on floor 15+ without sky lobby on floor 15
      expect(building.addRoom('apartment', 15, 0)).toBe(false);
      
      // After placing sky lobby on floor 15, can build on floor 15+
      expect(building.addRoom('skylobby', 15, 0)).toBe(true);
      expect(building.addRoom('apartment', 15, 5)).toBe(true); // Different position
      expect(building.addRoom('apartment', 16, 0)).toBe(true);
    });

    test('prevents building above floor 29 without sky lobby on floor 30', () => {
      // Place sky lobby on floor 15 first
      expect(building.addRoom('skylobby', 15, 0)).toBe(true);
      
      // Can build on floors 15-29
      expect(building.addRoom('apartment', 29, 0)).toBe(true);
      
      // Cannot build on floor 30+ without sky lobby on floor 30
      expect(building.addRoom('apartment', 30, 0)).toBe(false);
      
      // After placing sky lobby on floor 30, can build on floor 30+
      expect(building.addRoom('skylobby', 30, 0)).toBe(true);
      expect(building.addRoom('apartment', 30, 5)).toBe(true);
    });

    test('getSkyLobbies returns all sky lobbies', () => {
      expect(building.getSkyLobbies().length).toBe(0);
      
      building.addRoom('skylobby', 15, 0);
      expect(building.getSkyLobbies().length).toBe(1);
      
      building.addRoom('skylobby', 30, 0);
      expect(building.getSkyLobbies().length).toBe(2);
    });

    test('hasSkyLobbyOnFloor correctly identifies sky lobbies', () => {
      expect(building.hasSkyLobbyOnFloor(15)).toBe(false);
      
      building.addRoom('skylobby', 15, 0);
      expect(building.hasSkyLobbyOnFloor(15)).toBe(true);
      expect(building.hasSkyLobbyOnFloor(30)).toBe(false);
    });

    test('getSkyLobbyForZone returns correct sky lobby', () => {
      // Zone 0 doesn't need sky lobby
      expect(building.getSkyLobbyForZone(0)).toBeUndefined();
      
      // Zone 1 needs sky lobby on floor 15
      expect(building.getSkyLobbyForZone(1)).toBeUndefined();
      building.addRoom('skylobby', 15, 0);
      const zone1Lobby = building.getSkyLobbyForZone(1);
      expect(zone1Lobby).toBeDefined();
      expect(zone1Lobby?.floor).toBe(15);
    });

    test('sky lobby requirement check happens after floor constraint check', () => {
      // Sky lobby can only be on floor 15, 30, etc. (floor constraint)
      expect(building.addRoom('skylobby', 14, 0)).toBe(false); // Invalid floor constraint
      expect(building.addRoom('skylobby', 15, 0)).toBe(true); // Valid
    });
  });
});
