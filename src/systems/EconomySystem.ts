import { Building } from '../entities/Building';
import { RestaurantSystem } from './RestaurantSystem';
import { ResidentSystem } from './ResidentSystem';
import { ResourceSystem } from './ResourceSystem';
import { ROOM_SPECS } from '../utils/constants';
import { EconomySnapshot } from '../utils/types';

/**
 * Calculate rent per day based on satisfaction tier
 * @param satisfaction Satisfaction score (0-100)
 * @returns Rent amount per day
 */
function getRentForSatisfaction(satisfaction: number): number {
  if (satisfaction < 40) {
    return 50; // Tier 1
  } else if (satisfaction < 60) {
    return 100; // Tier 2
  } else if (satisfaction < 80) {
    return 150; // Tier 3
  } else {
    return 200; // Tier 4
  }
}

export class EconomySystem {
  private money: number;
  private dailyIncome = 0;
  private dailyExpenses = 0;
  private lastQuarterDay = 0; // Track last day when quarterly revenue was processed
  private quarterlyRevenue = 0; // Last quarterly revenue amount

  constructor(initialMoney: number) {
    this.money = initialMoney;
  }

  getMoney(): number {
    return this.money;
  }

  canAfford(cost: number): boolean {
    return this.money >= cost;
  }

  spend(amount: number): boolean {
    if (amount > this.money) {
      return false;
    }
    this.money -= amount;
    return true;
  }

  earn(amount: number): void {
    this.money += amount;
  }

  processDailyIncome(
    building: Building,
    _residentSystem: ResidentSystem,
    resourceSystem: ResourceSystem,
    restaurantSystem?: RestaurantSystem
  ): void {
    this.dailyIncome = 0;

    // Check if food is available in the building
    const foodAvailable = resourceSystem.getFood() > 0;

    // Apartment rent (based on satisfaction tiers)
    for (const apartment of building.getApartments()) {
      const residents = apartment.getResidents();
      if (residents.length > 0) {
        // Calculate average satisfaction of all residents in this apartment
        let totalSatisfaction = 0;
        for (const resident of residents) {
          totalSatisfaction += resident.calculateSatisfaction(foodAvailable);
        }
        const avgSatisfaction = totalSatisfaction / residents.length;
        
        // Calculate rent based on satisfaction tier
        const rent = getRentForSatisfaction(avgSatisfaction);
        this.dailyIncome += rent;
        this.money += rent;
      }
    }

    // Office income (per employed resident)
    for (const office of building.getOffices()) {
      const spec = ROOM_SPECS.office;
      const workerCount = office.getWorkerCount();
      const income = workerCount * spec.income;
      this.dailyIncome += income;
      this.money += income;
    }

    // Restaurant income
    if (restaurantSystem) {
      const restaurantIncome = restaurantSystem.getDailyIncome();
      this.dailyIncome += restaurantIncome;
      this.money += restaurantIncome;
    }
  }

  processDailyExpenses(building: Building): void {
    this.dailyExpenses = 0;

    // Calculate maintenance for all rooms
    for (const room of building.getAllRooms()) {
      const spec = ROOM_SPECS[room.type];
      if (spec.expenses > 0) {
        this.dailyExpenses += spec.expenses;
        this.money -= spec.expenses;
      }
    }
  }

  /**
   * Process quarterly office revenue bonus
   * Called every 90 days (one quarter)
   * Bonus is based on total employees across all offices
   * @param building Building instance to get offices
   * @param currentDay Current game day
   * @returns true if quarterly revenue was processed, false otherwise
   */
  processQuarterlyRevenue(building: Building, currentDay: number): boolean {
    const DAYS_PER_QUARTER = 90;
    
    // Check if a new quarter has started
    if (currentDay - this.lastQuarterDay >= DAYS_PER_QUARTER) {
      // Calculate total employees across all offices
      let totalEmployees = 0;
      for (const office of building.getOffices()) {
        totalEmployees += office.getWorkerCount();
      }

      // Calculate quarterly bonus: 1000 CR per employee
      // This represents a performance bonus for productive offices
      const BONUS_PER_EMPLOYEE = 1000;
      this.quarterlyRevenue = totalEmployees * BONUS_PER_EMPLOYEE;
      
      if (this.quarterlyRevenue > 0) {
        this.money += this.quarterlyRevenue;
        this.lastQuarterDay = currentDay;
        return true;
      }
      
      this.lastQuarterDay = currentDay;
      return false;
    }
    
    return false;
  }

  getQuarterlyRevenue(): number {
    return this.quarterlyRevenue;
  }

  getLastQuarterDay(): number {
    return this.lastQuarterDay;
  }

  getDailyIncome(): number {
    return this.dailyIncome;
  }

  getDailyExpenses(): number {
    return this.dailyExpenses;
  }

  getDailyBalance(): number {
    return this.dailyIncome - this.dailyExpenses;
  }

  isBankrupt(): boolean {
    return this.money < -10000; // Allow some debt
  }

  getSnapshot(): EconomySnapshot {
    return {
      money: this.money,
      dailyIncome: this.dailyIncome,
      dailyExpenses: this.dailyExpenses,
    };
  }

  setMoney(amount: number): void {
    this.money = amount;
  }

  setLastQuarterDay(day: number): void {
    this.lastQuarterDay = day;
  }

  /**
   * Get detailed income breakdown for UI display
   * Calculates current income sources without modifying money
   */
  getIncomeBreakdown(
    building: Building,
    _residentSystem: ResidentSystem,
    resourceSystem: ResourceSystem,
    restaurantSystem?: RestaurantSystem
  ): {
    apartmentRent: number;
    officeIncome: number;
    restaurantIncome: number;
    quarterlyRevenue: number;
    total: number;
  } {
    const foodAvailable = resourceSystem.getFood() > 0;
    let apartmentRent = 0;
    let officeIncome = 0;
    let restaurantIncome = 0;

    // Calculate apartment rent
    for (const apartment of building.getApartments()) {
      const residents = apartment.getResidents();
      if (residents.length > 0) {
        let totalSatisfaction = 0;
        for (const resident of residents) {
          totalSatisfaction += resident.calculateSatisfaction(foodAvailable);
        }
        const avgSatisfaction = totalSatisfaction / residents.length;
        apartmentRent += getRentForSatisfaction(avgSatisfaction);
      }
    }

    // Calculate office income
    for (const office of building.getOffices()) {
      const spec = ROOM_SPECS.office;
      const workerCount = office.getWorkerCount();
      officeIncome += workerCount * spec.income;
    }

    // Calculate restaurant income
    if (restaurantSystem) {
      restaurantIncome = restaurantSystem.getDailyIncome();
    }

    // Quarterly revenue is already calculated and stored
    const quarterlyRevenue = this.quarterlyRevenue;

    return {
      apartmentRent,
      officeIncome,
      restaurantIncome,
      quarterlyRevenue,
      total: apartmentRent + officeIncome + restaurantIncome + (quarterlyRevenue > 0 ? quarterlyRevenue / 90 : 0), // Average quarterly revenue per day
    };
  }

  /**
   * Get detailed expense breakdown for UI display
   * Calculates current expenses by room type
   */
  getExpenseBreakdown(building: Building): {
    apartment: number;
    office: number;
    farm: number;
    kitchen: number;
    fastfood: number;
    restaurant: number;
    total: number;
  } {
    let apartment = 0;
    let office = 0;
    let farm = 0;
    let kitchen = 0;
    let fastfood = 0;
    let restaurant = 0;

    for (const room of building.getAllRooms()) {
      const spec = ROOM_SPECS[room.type];
      if (spec.expenses > 0) {
        switch (room.type) {
          case 'apartment':
            apartment += spec.expenses;
            break;
          case 'office':
            office += spec.expenses;
            break;
          case 'farm':
            farm += spec.expenses;
            break;
          case 'kitchen':
            kitchen += spec.expenses;
            break;
          case 'fastfood':
            fastfood += spec.expenses;
            break;
          case 'restaurant':
            restaurant += spec.expenses;
            break;
        }
      }
    }

    return {
      apartment,
      office,
      farm,
      kitchen,
      fastfood,
      restaurant,
      total: apartment + office + farm + kitchen + fastfood + restaurant,
    };
  }
}
