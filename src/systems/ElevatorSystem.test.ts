import { describe, it, expect, beforeEach } from 'vitest';
import { ElevatorSystem, ElevatorShaft, ElevatorCar } from './ElevatorSystem';
import { Building } from '../entities/Building';
import { ElevatorState } from '../utils/types';
import Phaser from 'phaser';

// Mock Phaser Scene
class MockScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MockScene' });
  }
}

describe('ElevatorSystem', () => {
  let building: Building;
  let elevatorSystem: ElevatorSystem;
  let scene: Phaser.Scene;

  beforeEach(() => {
    scene = new MockScene();
    building = new Building(scene);
    elevatorSystem = new ElevatorSystem(building);
  });

  describe('ElevatorCar', () => {
    it('should initialize at specified floor', () => {
      const car = new ElevatorCar(0);
      expect(car.currentFloor).toBe(0);
      expect(car.state).toBe(ElevatorState.IDLE);
      expect(car.direction).toBe('idle');
    });

    it('should transition through door opening state', () => {
      const car = new ElevatorCar(0);
      car.setTargetFloor(1);
      car.state = ElevatorState.DOORS_OPENING;
      car.stateTimer = 0;

      // Update for less than door animation time
      car.update(250, 10);
      expect(car.state).toBe(ElevatorState.DOORS_OPENING);

      // Update past door animation time
      car.update(300, 10);
      expect(car.state).toBe(ElevatorState.LOADING);
    });

    it('should transition through loading state', () => {
      const car = new ElevatorCar(0);
      car.setTargetFloor(1);
      car.state = ElevatorState.LOADING;
      car.stateTimer = 0;

      // Update for less than loading time
      car.update(500, 10);
      expect(car.state).toBe(ElevatorState.LOADING);

      // Update past loading time
      car.update(600, 10);
      expect(car.state).toBe(ElevatorState.DOORS_CLOSING);
    });

    it('should move between floors', () => {
      const car = new ElevatorCar(0);
      car.setTargetFloor(2);
      car.state = ElevatorState.MOVING;
      car.direction = 'up';
      car.stateTimer = 0;

      // Update for 2 seconds (1 floor travel time)
      car.update(2000, 10);
      expect(car.currentFloor).toBe(0); // Still at start
      expect(car.state).toBe(ElevatorState.MOVING);

      // Update for another 2 seconds (total 4 seconds = 2 floors)
      car.update(2000, 10);
      expect(car.currentFloor).toBe(2);
      expect(car.state).toBe(ElevatorState.DOORS_OPENING);
    });

    it('should calculate visual position during movement', () => {
      const car = new ElevatorCar(0);
      car.setTargetFloor(1);
      car.state = ElevatorState.MOVING;
      car.direction = 'up';
      car.stateTimer = 1000; // Halfway through 2-second journey

      car.update(0, 10); // Update to calculate position
      const visualY = car.getVisualY();
      expect(visualY).toBeLessThan(0); // Should be negative (above ground)
    });

    it('should accept passengers when loading', () => {
      const car = new ElevatorCar(0);
      car.state = ElevatorState.LOADING;

      // Mock resident
      const mockResident = {
        id: 'resident_1',
      } as any;

      expect(car.canAcceptPassengers()).toBe(true);
      expect(car.addPassenger(mockResident)).toBe(true);
      expect(car.passengers.length).toBe(1);
    });

    it('should respect capacity limit', () => {
      const car = new ElevatorCar(0);
      car.state = ElevatorState.LOADING;
      car.capacity = 2;

      const mockResident1 = { id: 'resident_1' } as any;
      const mockResident2 = { id: 'resident_2' } as any;
      const mockResident3 = { id: 'resident_3' } as any;

      expect(car.addPassenger(mockResident1)).toBe(true);
      expect(car.addPassenger(mockResident2)).toBe(true);
      expect(car.addPassenger(mockResident3)).toBe(false);
      expect(car.passengers.length).toBe(2);
    });
  });

  describe('ElevatorShaft', () => {
    it('should initialize with correct parameters', () => {
      const shaft = new ElevatorShaft('shaft_1', 10, 0); // Zone 0: floors 0-14
      expect(shaft.id).toBe('shaft_1');
      expect(shaft.position).toBe(10);
      expect(shaft.zone).toBe(0);
      expect(shaft.minFloor).toBe(0);
      expect(shaft.maxFloor).toBe(14);
      expect(shaft.car.currentFloor).toBe(0);
    });

    it('should queue elevator calls', () => {
      const shaft = new ElevatorShaft('shaft_1', 10, 0); // Zone 0
      const mockResident = { id: 'resident_1' } as any;

      shaft.callElevator(2, 'up', mockResident);
      expect(shaft.callQueue.length).toBe(1);
      expect(shaft.callQueue[0].floor).toBe(2);
      expect(shaft.callQueue[0].direction).toBe('up');
    });

    it('should update max floor when building grows within zone', () => {
      const shaft = new ElevatorShaft('shaft_1', 10, 0); // Zone 0: floors 0-14
      shaft.update(0, 10); // Building now has 10 floors
      expect(shaft.maxFloor).toBe(10); // Updated but still within zone
      shaft.update(0, 20); // Building has 20 floors, but zone max is 14
      expect(shaft.maxFloor).toBe(14); // Capped at zone max
    });

    it('should reject calls outside zone', () => {
      const shaft = new ElevatorShaft('shaft_1', 10, 0); // Zone 0: floors 0-14
      const mockResident = { id: 'resident_1' } as any;

      // Valid call within zone
      shaft.callElevator(5, 'up', mockResident);
      expect(shaft.callQueue.length).toBe(1);

      // Invalid call outside zone
      shaft.callElevator(20, 'up', mockResident);
      expect(shaft.callQueue.length).toBe(1); // No new call added
    });
  });

  describe('ElevatorSystem', () => {
    it('should create elevator shafts', () => {
      const shaft = elevatorSystem.createShaft('shaft_1', 10, 0);
      expect(shaft).toBeDefined();
      expect(shaft.id).toBe('shaft_1');
      expect(elevatorSystem.getShaft('shaft_1')).toBe(shaft);
    });

    it('should find shaft at position', () => {
      elevatorSystem.createShaft('shaft_1', 10, 0);
      const found = elevatorSystem.getShaftAtPosition(10);
      expect(found).toBeDefined();
      expect(found?.id).toBe('shaft_1');
    });

    it('should update all shafts', () => {
      const shaft1 = elevatorSystem.createShaft('shaft_1', 10, 0);
      const shaft2 = elevatorSystem.createShaft('shaft_2', 20, 0);

      // Update system
      elevatorSystem.update(1000);

      // Both shafts should be updated
      expect(shaft1.maxFloor).toBeGreaterThanOrEqual(0);
      expect(shaft2.maxFloor).toBeGreaterThanOrEqual(0);
    });

    it('should clear all shafts', () => {
      elevatorSystem.createShaft('shaft_1', 10, 0);
      elevatorSystem.createShaft('shaft_2', 20, 0);

      expect(elevatorSystem.getAllShafts().length).toBe(2);
      elevatorSystem.clear();
      expect(elevatorSystem.getAllShafts().length).toBe(0);
    });
  });
});
