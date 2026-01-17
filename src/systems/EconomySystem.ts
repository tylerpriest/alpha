import { Building } from '../entities/Building';
import { ROOM_SPECS } from '../utils/constants';
import { EconomySnapshot } from '../utils/types';

export class EconomySystem {
  private money: number;
  private dailyIncome = 0;
  private dailyExpenses = 0;

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

  processDailyIncome(building: Building): void {
    this.dailyIncome = 0;

    // Apartment rent
    for (const apartment of building.getApartments()) {
      const spec = ROOM_SPECS.apartment;
      const residentCount = apartment.getResidentCount();
      if (residentCount > 0) {
        const rent = spec.income;
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
}
