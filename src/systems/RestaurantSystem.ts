import { Building } from '../entities/Building';
import { ResourceSystem } from './ResourceSystem';
import { TimeSystem } from './TimeSystem';
import { ROOM_SPECS } from '../utils/constants';
import { Room } from '../entities/Room';

export interface RestaurantData {
  id: string;
  type: 'fastfood' | 'restaurant';
  isOpen: boolean;
  evaluationScore: number; // 0-100
  dailyFoodConsumed: number;
  dailyIncome: number;
}

export class RestaurantSystem {
  private building: Building;
  private resourceSystem: ResourceSystem;
  private timeSystem: TimeSystem;
  private dailyFoodConsumed = 0;
  private dailyIncome = 0;

  constructor(
    building: Building,
    resourceSystem: ResourceSystem,
    timeSystem: TimeSystem
  ) {
    this.building = building;
    this.resourceSystem = resourceSystem;
    this.timeSystem = timeSystem;
  }

  /**
   * Check if a restaurant is open based on its type and current time
   */
  isRestaurantOpen(room: Room): boolean {
    const hour = this.timeSystem.getHour();
    const minute = this.timeSystem.getMinute();
    const currentTime = hour + minute / 60;

    if (room.type === 'fastfood') {
      // Fast Food: 11 AM - 2 PM and 5 PM - 7 PM
      return (
        (currentTime >= 11 && currentTime < 14) ||
        (currentTime >= 17 && currentTime < 19)
      );
    } else if (room.type === 'restaurant') {
      // Restaurant: 6 PM - 11 PM
      return currentTime >= 18 && currentTime < 23;
    }

    return false;
  }

  /**
   * Calculate evaluation score (0-100) for a restaurant
   * Based on food availability (40 points if stocked, 0 if empty)
   * Future: wait time and cleanliness factors
   */
  calculateEvaluationScore(room: Room): number {
    const spec = ROOM_SPECS[room.type];
    const foodNeeded = 'foodConsumption' in spec ? spec.foodConsumption : 0;
    const availableFood = this.resourceSystem.getFood();

    // Food availability: 40 points if stocked, 0 if empty
    // Partial credit if partially stocked
    let foodScore = 0;
    if (availableFood >= foodNeeded) {
      foodScore = 40; // Fully stocked
    } else if (availableFood > 0) {
      foodScore = (availableFood / foodNeeded) * 40; // Partially stocked
    }

    // Base score: 60 points (for being operational)
    // Future: subtract wait time penalties, add cleanliness bonuses
    const baseScore = 60;

    return Math.min(100, Math.max(0, baseScore + foodScore));
  }

  /**
   * Calculate daily income for a restaurant based on evaluation score
   */
  calculateIncome(room: Room): number {
    if (!this.isRestaurantOpen(room)) {
      return 0;
    }

    const spec = ROOM_SPECS[room.type];
    const baseIncome = spec.income || 0;
    const evaluationScore = this.calculateEvaluationScore(room);

    // Income = base_income * (evaluation_score / 100)
    return (baseIncome * evaluationScore) / 100;
  }

  /**
   * Process restaurant operations for the current day
   * Consumes food and calculates income
   * Note: This is called once per day. Restaurants generate income based on
   * their evaluation score. Operating hours determine when they consume food
   * and when residents can visit, but income is calculated daily.
   */
  processDailyOperations(): void {
    this.dailyFoodConsumed = 0;
    this.dailyIncome = 0;

    const fastFoods = this.building.getFastFoods();
    const restaurants = this.building.getRestaurants();

    // Process Fast Food restaurants
    // Fast Food operates 11 AM - 2 PM and 5 PM - 7 PM
    for (const restaurant of fastFoods) {
      const spec = ROOM_SPECS.fastfood;
      const foodNeeded = spec.foodConsumption || 0;

      // Consume food if available (restaurants consume food during operating hours)
      // For daily processing, we consume the daily amount
      const foodConsumed = Math.min(
        foodNeeded,
        this.resourceSystem.getFood()
      );
      if (foodConsumed > 0) {
        this.resourceSystem.consumeFood(foodConsumed);
        this.dailyFoodConsumed += foodConsumed;
      }

      // Calculate income based on evaluation score
      // Income is generated daily, scaled by evaluation
      const evaluationScore = this.calculateEvaluationScore(restaurant);
      const baseIncome = spec.income || 0;
      const income = (baseIncome * evaluationScore) / 100;
      this.dailyIncome += income;
    }

    // Process Fine Dining restaurants
    // Restaurant operates 6 PM - 11 PM
    for (const restaurant of restaurants) {
      const spec = ROOM_SPECS.restaurant;
      const foodNeeded = spec.foodConsumption || 0;

      // Consume food if available
      const foodConsumed = Math.min(
        foodNeeded,
        this.resourceSystem.getFood()
      );
      if (foodConsumed > 0) {
        this.resourceSystem.consumeFood(foodConsumed);
        this.dailyFoodConsumed += foodConsumed;
      }

      // Calculate income based on evaluation score
      const evaluationScore = this.calculateEvaluationScore(restaurant);
      const baseIncome = spec.income || 0;
      const income = (baseIncome * evaluationScore) / 100;
      this.dailyIncome += income;
    }
  }

  /**
   * Get total food demand from all restaurants
   */
  getTotalFoodDemand(): number {
    let total = 0;

    const fastFoods = this.building.getFastFoods();
    const restaurants = this.building.getRestaurants();

    for (const restaurant of fastFoods) {
      if (this.isRestaurantOpen(restaurant)) {
        const spec = ROOM_SPECS.fastfood;
        total += spec.foodConsumption || 0;
      }
    }

    for (const restaurant of restaurants) {
      if (this.isRestaurantOpen(restaurant)) {
        const spec = ROOM_SPECS.restaurant;
        total += spec.foodConsumption || 0;
      }
    }

    return total;
  }

  /**
   * Get daily food consumed
   */
  getDailyFoodConsumed(): number {
    return this.dailyFoodConsumed;
  }

  /**
   * Get daily income from restaurants
   */
  getDailyIncome(): number {
    return this.dailyIncome;
  }

  /**
   * Get restaurant data for a specific room
   */
  getRestaurantData(room: Room): RestaurantData {
    return {
      id: room.id,
      type: room.type as 'fastfood' | 'restaurant',
      isOpen: this.isRestaurantOpen(room),
      evaluationScore: this.calculateEvaluationScore(room),
      dailyFoodConsumed: 0, // Tracked per restaurant in future
      dailyIncome: this.calculateIncome(room),
    };
  }
}
