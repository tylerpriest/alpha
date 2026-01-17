import { Building } from '../entities/Building';
import { ROOM_SPECS } from '../utils/constants';

export class ResourceSystem {
  private rawFood = 0;
  private processedFood = 0;

  update(delta: number, building: Building): void {
    const hourDelta = delta / 3600000; // Convert ms to hours

    // Farms produce raw food
    const farms = building.getFarms();
    for (const _farm of farms) {
      const spec = ROOM_SPECS.farm;
      // Produce food proportional to time passed
      this.rawFood += (spec.foodProduction / 24) * hourDelta * 10;
    }

    // Kitchens convert raw food to processed food
    const kitchens = building.getKitchens();
    for (const _kitchen of kitchens) {
      const spec = ROOM_SPECS.kitchen;
      // Convert raw food to processed food
      const conversionRate = (spec.foodProcessing / 24) * hourDelta * 10;
      const converted = Math.min(this.rawFood, conversionRate);
      this.rawFood -= converted;
      this.processedFood += converted;
    }
  }

  getFood(): number {
    return this.processedFood;
  }

  getRawFood(): number {
    return this.rawFood;
  }

  consumeFood(amount: number): boolean {
    if (this.processedFood >= amount) {
      this.processedFood -= amount;
      return true;
    }
    return false;
  }

  addRawFood(amount: number): void {
    this.rawFood += amount;
  }

  addProcessedFood(amount: number): void {
    this.processedFood += amount;
  }

  setFood(raw: number, processed: number): void {
    this.rawFood = raw;
    this.processedFood = processed;
  }
}
