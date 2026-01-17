import { describe, test, expect, beforeEach } from 'vitest';
import { EconomySystem } from './EconomySystem';
import { Building } from '../entities/Building';
import { ResidentSystem } from './ResidentSystem';
import { ResourceSystem } from './ResourceSystem';
import { Resident } from '../entities/Resident';
import Phaser from 'phaser';

// Mock GameScene for ResidentSystem
const createMockGameScene = (): any => {
  const mockPhaserScene = {
    add: {
      graphics: () => ({
        fillStyle: () => {},
        fillRect: () => {},
        clear: () => {},
        lineStyle: () => {},
        lineBetween: () => {},
        destroy: () => {},
        setDepth: () => {},
        setBlendMode: () => {},
      }),
      text: () => ({
        setDepth: () => {},
        setText: () => {},
        setPosition: () => {},
        setStyle: () => {},
        destroy: () => {},
      }),
    },
    registry: {
      get: () => 12,
      set: () => {},
    },
    on: () => {},
  } as unknown as Phaser.Scene;
  
  const building = new Building(mockPhaserScene);
  const mockScene = {
    building,
    timeSystem: {
      on: () => {},
      getHour: () => 12,
      getMinute: () => 0,
    },
  };
  return mockScene;
};

describe('EconomySystem', () => {
  let economy: EconomySystem;
  let building: Building;
  let residentSystem: ResidentSystem;
  let resourceSystem: ResourceSystem;
  let mockScene: Phaser.Scene;

  beforeEach(() => {
    economy = new EconomySystem(10000);
    const mockGameScene = createMockGameScene();
    mockScene = mockGameScene as unknown as Phaser.Scene;
    building = new Building(mockScene);
    residentSystem = new ResidentSystem(mockGameScene);
    resourceSystem = new ResourceSystem();
  });

  test('initializes with correct money', () => {
    expect(economy.getMoney()).toBe(10000);
  });

  test('canAfford returns true when enough money', () => {
    expect(economy.canAfford(5000)).toBe(true);
    expect(economy.canAfford(10000)).toBe(true);
    expect(economy.canAfford(10001)).toBe(false);
  });

  test('spend deducts money when affordable', () => {
    const success = economy.spend(3000);
    expect(success).toBe(true);
    expect(economy.getMoney()).toBe(7000);
  });

  test('spend fails when not enough money', () => {
    const success = economy.spend(15000);
    expect(success).toBe(false);
    expect(economy.getMoney()).toBe(10000);
  });

  test('earn adds money', () => {
    economy.earn(5000);
    expect(economy.getMoney()).toBe(15000);
  });

  test('isBankrupt returns true when deeply in debt', () => {
    economy.setMoney(-15000);
    expect(economy.isBankrupt()).toBe(true);
  });

  test('isBankrupt returns false when solvent or in minor debt', () => {
    expect(economy.isBankrupt()).toBe(false);
    economy.setMoney(-5000);
    expect(economy.isBankrupt()).toBe(false);
  });

  test('getSnapshot returns correct data', () => {
    const snapshot = economy.getSnapshot();
    expect(snapshot.money).toBe(10000);
    expect(snapshot.dailyIncome).toBe(0);
    expect(snapshot.dailyExpenses).toBe(0);
  });

  describe('Satisfaction-based rent tiers', () => {
    test('calculates Tier 1 rent ($50) for satisfaction < 40', () => {
      // Create apartment and resident with low satisfaction
      building.addRoom('apartment', 1, 0);
      const apartment = building.getRoomAt(1, 0)!;
      const resident = new Resident(mockScene, 'test_1', 0, 0);
      resident.hunger = 20; // Low hunger = high penalty
      resident.stress = 60; // High stress
      resident.setHome(apartment);
      residentSystem.addResident(resident);

      // No food available, no job
      resourceSystem.setFood(0, 0);
      const satisfaction = resident.calculateSatisfaction(false);
      expect(satisfaction).toBeLessThan(40);

      const initialMoney = economy.getMoney();
      economy.processDailyIncome(building, residentSystem, resourceSystem);
      
      // Should earn $50 (Tier 1)
      expect(economy.getMoney()).toBe(initialMoney + 50);
      expect(economy.getDailyIncome()).toBe(50);
    });

    test('calculates Tier 2 rent ($100) for satisfaction 40-60', () => {
      building.addRoom('apartment', 1, 0);
      const apartment = building.getRoomAt(1, 0)!;
      const resident = new Resident(mockScene, 'test_2', 0, 0);
      resident.hunger = 60; // Moderate hunger
      resident.stress = 40; // Moderate stress
      resident.setHome(apartment);
      residentSystem.addResident(resident);

      // Food available, no job
      resourceSystem.setFood(0, 10);
      const satisfaction = resident.calculateSatisfaction(true);
      expect(satisfaction).toBeGreaterThanOrEqual(40);
      expect(satisfaction).toBeLessThan(60);

      const initialMoney = economy.getMoney();
      economy.processDailyIncome(building, residentSystem, resourceSystem);
      
      // Should earn $100 (Tier 2)
      expect(economy.getMoney()).toBe(initialMoney + 100);
      expect(economy.getDailyIncome()).toBe(100);
    });

    test('calculates Tier 3 rent ($150) for satisfaction 60-80', () => {
      building.addRoom('apartment', 1, 0);
      const apartment = building.getRoomAt(1, 0)!;
      const resident = new Resident(mockScene, 'test_3', 0, 0);
      resident.hunger = 80; // Good hunger
      resident.stress = 20; // Low stress
      resident.setHome(apartment);
      residentSystem.addResident(resident);

      // Food available, no job
      resourceSystem.setFood(0, 10);
      const satisfaction = resident.calculateSatisfaction(true);
      expect(satisfaction).toBeGreaterThanOrEqual(60);
      expect(satisfaction).toBeLessThan(80);

      const initialMoney = economy.getMoney();
      economy.processDailyIncome(building, residentSystem, resourceSystem);
      
      // Should earn $150 (Tier 3)
      expect(economy.getMoney()).toBe(initialMoney + 150);
      expect(economy.getDailyIncome()).toBe(150);
    });

    test('calculates Tier 4 rent ($200) for satisfaction >= 80', () => {
      building.addRoom('apartment', 1, 0);
      const apartment = building.getRoomAt(1, 0)!;
      building.addRoom('office', 1, 5);
      const office = building.getRoomAt(1, 5)!;
      const resident = new Resident(mockScene, 'test_4', 0, 0);
      resident.hunger = 90; // Very good hunger
      resident.stress = 10; // Very low stress
      resident.setHome(apartment);
      resident.setJob(office); // Has job
      residentSystem.addResident(resident);

      // Food available, has job
      resourceSystem.setFood(0, 10);
      const satisfaction = resident.calculateSatisfaction(true);
      expect(satisfaction).toBeGreaterThanOrEqual(80);

      const initialMoney = economy.getMoney();
      economy.processDailyIncome(building, residentSystem, resourceSystem);
      
      // Should earn $200 (Tier 4)
      expect(economy.getMoney()).toBe(initialMoney + 200);
      expect(economy.getDailyIncome()).toBe(200);
    });

    test('calculates average satisfaction for multiple residents in apartment', () => {
      building.addRoom('apartment', 1, 0);
      const apartment = building.getRoomAt(1, 0)!;
      
      // Resident 1: Low satisfaction (stress 60, hunger 20, no food, no job)
      const resident1 = new Resident(mockScene, 'test_5a', 0, 0);
      resident1.hunger = 20;
      resident1.stress = 60;
      resident1.setHome(apartment);
      residentSystem.addResident(resident1);
      
      // Resident 2: High satisfaction (stress 10, hunger 90, food, job)
      building.addRoom('office', 1, 5);
      const office = building.getRoomAt(1, 5)!;
      const resident2 = new Resident(mockScene, 'test_5b', 0, 0);
      resident2.hunger = 90;
      resident2.stress = 10;
      resident2.setHome(apartment);
      resident2.setJob(office);
      residentSystem.addResident(resident2);

      resourceSystem.setFood(0, 10);
      
      const sat1 = resident1.calculateSatisfaction(true);
      const sat2 = resident2.calculateSatisfaction(true);
      const avgSatisfaction = (sat1 + sat2) / 2;

      const initialMoney = economy.getMoney();
      economy.processDailyIncome(building, residentSystem, resourceSystem);
      
      // Rent should be based on average satisfaction
      const expectedRent = avgSatisfaction < 40 ? 50 :
                          avgSatisfaction < 60 ? 100 :
                          avgSatisfaction < 80 ? 150 : 200;
      
      expect(economy.getMoney()).toBe(initialMoney + expectedRent);
      expect(economy.getDailyIncome()).toBe(expectedRent);
    });

    test('no rent for empty apartments', () => {
      building.addRoom('apartment', 1, 0);
      // No residents

      const initialMoney = economy.getMoney();
      economy.processDailyIncome(building, residentSystem, resourceSystem);
      
      expect(economy.getMoney()).toBe(initialMoney);
      expect(economy.getDailyIncome()).toBe(0);
    });
  });

  describe('Resident satisfaction calculation', () => {
    test('calculates satisfaction correctly with all bonuses', () => {
      const resident = new Resident(mockScene, 'test_sat_1', 0, 0);
      resident.hunger = 80; // Good hunger
      resident.stress = 20; // Low stress
      building.addRoom('office', 1, 0);
      const office = building.getRoomAt(1, 0)!;
      resident.setJob(office);

      // Food available, has job
      const satisfaction = resident.calculateSatisfaction(true);
      // 100 - 20 (stress) - 10 (hunger penalty) + 10 (food) + 15 (job) = 95
      expect(satisfaction).toBe(95);
    });

    test('calculates satisfaction with no bonuses', () => {
      const resident = new Resident(mockScene, 'test_sat_2', 0, 0);
      resident.hunger = 30; // Low hunger
      resident.stress = 60; // High stress
      // No job, no food

      const satisfaction = resident.calculateSatisfaction(false);
      // 100 - 60 (stress) - 35 (hunger penalty) + 0 + 0 = 5
      expect(satisfaction).toBe(5);
    });

    test('satisfaction is clamped to 0-100', () => {
      const resident = new Resident(mockScene, 'test_sat_3', 0, 0);
      resident.hunger = 0; // Starving
      resident.stress = 100; // Maximum stress
      // No job, no food

      const satisfaction = resident.calculateSatisfaction(false);
      // Should be clamped to 0 (would be negative otherwise)
      expect(satisfaction).toBe(0);
      expect(satisfaction).toBeGreaterThanOrEqual(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });
  });
});
