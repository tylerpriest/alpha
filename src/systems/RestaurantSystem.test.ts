import { describe, test, expect, beforeEach } from 'vitest';
import { RestaurantSystem } from './RestaurantSystem';
import { Building } from '../entities/Building';
import { ResourceSystem } from './ResourceSystem';
import { TimeSystem } from './TimeSystem';
import Phaser from 'phaser';

describe('RestaurantSystem', () => {
  let building: Building;
  let resourceSystem: ResourceSystem;
  let timeSystem: TimeSystem;
  let restaurantSystem: RestaurantSystem;
  let mockScene: Phaser.Scene;

  beforeEach(() => {
    mockScene = {} as Phaser.Scene;
    building = new Building(mockScene);
    resourceSystem = new ResourceSystem();
    timeSystem = new TimeSystem();
    restaurantSystem = new RestaurantSystem(
      building,
      resourceSystem,
      timeSystem
    );
  });

  test('isRestaurantOpen returns true for Fast Food during lunch hours', () => {
    // Add a fast food restaurant
    building.addRoom('fastfood', 1, 0);

    // Set time to 12 PM (lunch time)
    timeSystem.setTime(1, 12);
    const fastFood = building.getFastFoods()[0];

    expect(restaurantSystem.isRestaurantOpen(fastFood)).toBe(true);
  });

  test('isRestaurantOpen returns true for Fast Food during dinner hours', () => {
    building.addRoom('fastfood', 1, 0);

    // Set time to 6 PM (dinner time)
    timeSystem.setTime(1, 18);
    const fastFood = building.getFastFoods()[0];

    expect(restaurantSystem.isRestaurantOpen(fastFood)).toBe(true);
  });

  test('isRestaurantOpen returns false for Fast Food outside operating hours', () => {
    building.addRoom('fastfood', 1, 0);

    // Set time to 3 PM (between lunch and dinner)
    timeSystem.setTime(1, 15);
    const fastFood = building.getFastFoods()[0];

    expect(restaurantSystem.isRestaurantOpen(fastFood)).toBe(false);
  });

  test('isRestaurantOpen returns true for Restaurant during evening hours', () => {
    building.addRoom('restaurant', 1, 0);

    // Set time to 8 PM (evening)
    timeSystem.setTime(1, 20);
    const restaurant = building.getRestaurants()[0];

    expect(restaurantSystem.isRestaurantOpen(restaurant)).toBe(true);
  });

  test('isRestaurantOpen returns false for Restaurant before 6 PM', () => {
    building.addRoom('restaurant', 1, 0);

    // Set time to 5 PM
    timeSystem.setTime(1, 17);
    const restaurant = building.getRestaurants()[0];

    expect(restaurantSystem.isRestaurantOpen(restaurant)).toBe(false);
  });

  test('calculateEvaluationScore returns 100 when fully stocked', () => {
    building.addRoom('fastfood', 1, 0);
    const fastFood = building.getFastFoods()[0];

    // Set food to more than needed (30 for fast food)
    resourceSystem.addProcessedFood(50);

    const score = restaurantSystem.calculateEvaluationScore(fastFood);
    expect(score).toBe(100);
  });

  test('calculateEvaluationScore returns partial score when partially stocked', () => {
    building.addRoom('fastfood', 1, 0);
    const fastFood = building.getFastFoods()[0];

    // Set food to half of needed (15 out of 30)
    resourceSystem.addProcessedFood(15);

    const score = restaurantSystem.calculateEvaluationScore(fastFood);
    // Base score (60) + partial food score (20) = 80
    expect(score).toBe(80);
  });

  test('calculateEvaluationScore returns 60 when no food available', () => {
    building.addRoom('fastfood', 1, 0);
    const fastFood = building.getFastFoods()[0];

    // No food available
    resourceSystem.setFood(0, 0);

    const score = restaurantSystem.calculateEvaluationScore(fastFood);
    // Base score (60) + no food score (0) = 60
    expect(score).toBe(60);
  });

  test('calculateIncome returns 0 when restaurant is closed', () => {
    building.addRoom('fastfood', 1, 0);
    const fastFood = building.getFastFoods()[0];

    // Set time to 3 PM (closed)
    timeSystem.setTime(1, 15);

    const income = restaurantSystem.calculateIncome(fastFood);
    expect(income).toBe(0);
  });

  test('calculateIncome scales with evaluation score', () => {
    building.addRoom('fastfood', 1, 0);
    const fastFood = building.getFastFoods()[0];

    // Set time to 12 PM (open)
    timeSystem.setTime(1, 12);

    // Fully stocked (100 score) = full income (500)
    resourceSystem.addProcessedFood(50);
    let income = restaurantSystem.calculateIncome(fastFood);
    expect(income).toBe(500);

    // Half stocked (80 score) = 80% income (400)
    resourceSystem.setFood(0, 15);
    income = restaurantSystem.calculateIncome(fastFood);
    expect(income).toBe(400);
  });

  test('processDailyOperations consumes food when restaurants are open', () => {
    building.addRoom('fastfood', 1, 0);

    // Set time to 12 PM (open) and add food
    timeSystem.setTime(1, 12);
    resourceSystem.addProcessedFood(50);

    restaurantSystem.processDailyOperations();

    // Should consume 30 food (fast food daily consumption)
    expect(resourceSystem.getFood()).toBe(20);
    expect(restaurantSystem.getDailyFoodConsumed()).toBe(30);
  });

  test('processDailyOperations does not consume food when restaurants are closed', () => {
    building.addRoom('fastfood', 1, 0);

    // Set time to 3 PM (closed) and add food
    timeSystem.setTime(1, 15);
    resourceSystem.addProcessedFood(50);

    restaurantSystem.processDailyOperations();

    // Should not consume food
    expect(resourceSystem.getFood()).toBe(50);
    expect(restaurantSystem.getDailyFoodConsumed()).toBe(0);
  });

  test('processDailyOperations calculates income for open restaurants', () => {
    building.addRoom('fastfood', 1, 0);

    // Set time to 12 PM (open) and add food
    timeSystem.setTime(1, 12);
    resourceSystem.addProcessedFood(50);

    restaurantSystem.processDailyOperations();

    // Should generate income (500 base * 100% evaluation = 500)
    expect(restaurantSystem.getDailyIncome()).toBe(500);
  });

  test('processDailyOperations handles multiple restaurants', () => {
    building.addRoom('fastfood', 1, 0);
    building.addRoom('restaurant', 2, 0);

    // Set time to 8 PM (both open)
    timeSystem.setTime(1, 20);
    resourceSystem.addProcessedFood(100);

    restaurantSystem.processDailyOperations();

    // Fast Food: 30 food, Restaurant: 20 food = 50 total
    expect(restaurantSystem.getDailyFoodConsumed()).toBe(50);
    // Fast Food: 500 income, Restaurant: 800 income = 1300 total
    expect(restaurantSystem.getDailyIncome()).toBeGreaterThan(0);
  });

  test('getTotalFoodDemand returns correct demand for open restaurants', () => {
    building.addRoom('fastfood', 1, 0);
    building.addRoom('restaurant', 2, 0);

    // Set time to 8 PM (both open)
    timeSystem.setTime(1, 20);

    const demand = restaurantSystem.getTotalFoodDemand();
    // Fast Food: 30, Restaurant: 20 = 50
    expect(demand).toBe(50);
  });

  test('getTotalFoodDemand returns 0 when restaurants are closed', () => {
    building.addRoom('fastfood', 1, 0);

    // Set time to 3 PM (closed)
    timeSystem.setTime(1, 15);

    const demand = restaurantSystem.getTotalFoodDemand();
    expect(demand).toBe(0);
  });

  test('getRestaurantData returns correct data', () => {
    building.addRoom('fastfood', 1, 0);
    const fastFood = building.getFastFoods()[0];

    // Set time to 12 PM (open) and add food
    timeSystem.setTime(1, 12);
    resourceSystem.addProcessedFood(50);

    const data = restaurantSystem.getRestaurantData(fastFood);
    expect(data.id).toBe(fastFood.id);
    expect(data.type).toBe('fastfood');
    expect(data.isOpen).toBe(true);
    expect(data.evaluationScore).toBe(100);
    expect(data.dailyIncome).toBe(500);
  });
});
