import { GameScene } from '../scenes/GameScene';
import { Resident } from '../entities/Resident';
import { Room } from '../entities/Room';

export class ResidentSystem {
  private scene: GameScene;
  private residents: Resident[] = [];
  private nextResidentId = 1;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(delta: number): void {
    const gameHour = this.scene.timeSystem.getHour();

    // Update all residents
    for (const resident of this.residents) {
      resident.update(delta, gameHour);
    }

    // Check for new move-ins (once per update cycle)
    this.checkMoveIns();

    // Check for move-outs (starving residents)
    this.checkMoveOuts();
  }

  private checkMoveIns(): void {
    const apartments = this.scene.building.getApartments();

    for (const apartment of apartments) {
      if (apartment.hasCapacity()) {
        // Spawn a new resident with some probability
        if (Math.random() < 0.001) {
          // ~0.1% chance per frame
          this.spawnResident(apartment);
        }
      }
    }
  }

  private checkMoveOuts(): void {
    const toRemove: Resident[] = [];

    for (const resident of this.residents) {
      // Residents leave after starving (hunger 0) for 24 game hours
      if (resident.hasStarvedTooLong()) {
        toRemove.push(resident);
      }
      // Residents leave after stress >80 for 48 consecutive hours
      else if (resident.hasHighStressTooLong()) {
        toRemove.push(resident);
      }
    }

    for (const resident of toRemove) {
      this.removeResident(resident);
    }
  }

  spawnResident(apartment: Room): Resident {
    const id = `resident_${this.nextResidentId++}`;
    const pos = apartment.getWorldPosition();

    const resident = new Resident(this.scene, id, pos.x, pos.y);
    resident.setHome(apartment);

    // Try to find a job
    const offices = this.scene.building.getOffices();
    for (const office of offices) {
      if (office.hasJobOpenings()) {
        resident.setJob(office);
        break;
      }
    }

    this.residents.push(resident);
    return resident;
  }

  removeResident(resident: Resident): void {
    const index = this.residents.indexOf(resident);
    if (index !== -1) {
      this.residents.splice(index, 1);
      resident.destroy();
    }
  }

  getPopulation(): number {
    return this.residents.length;
  }

  getResidents(): Resident[] {
    return this.residents;
  }

  getUnemployed(): Resident[] {
    return this.residents.filter((r) => r.job === null);
  }

  getEmployed(): Resident[] {
    return this.residents.filter((r) => r.job !== null);
  }

  getHungryResidents(): Resident[] {
    return this.residents.filter((r) => r.isHungry());
  }

  assignJobs(): void {
    const unemployed = this.getUnemployed();
    const offices = this.scene.building.getOffices();

    for (const resident of unemployed) {
      for (const office of offices) {
        if (office.hasJobOpenings()) {
          resident.setJob(office);
          break;
        }
      }
    }
  }

  /**
   * Add a resident directly (for save/load restoration)
   */
  addResident(resident: Resident): void {
    if (!this.residents.includes(resident)) {
      this.residents.push(resident);
    }
  }

  /**
   * Set the next resident ID (for save/load restoration)
   */
  setNextResidentId(id: number): void {
    this.nextResidentId = id;
  }

  /**
   * Get the next resident ID
   */
  getNextResidentId(): number {
    return this.nextResidentId;
  }

  /**
   * Calculate building-wide average satisfaction
   * Returns average of all resident satisfactions (0-100)
   */
  getAverageSatisfaction(foodAvailable: boolean): number {
    if (this.residents.length === 0) {
      return 0;
    }

    let totalSatisfaction = 0;
    for (const resident of this.residents) {
      totalSatisfaction += resident.calculateSatisfaction(foodAvailable);
    }

    return totalSatisfaction / this.residents.length;
  }
}
