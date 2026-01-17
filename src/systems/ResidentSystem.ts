import { GameScene } from '../scenes/GameScene';
import { Resident } from '../entities/Resident';
import { Room } from '../entities/Room';

export class ResidentSystem {
  private scene: GameScene;
  private residents: Resident[] = [];
  private nextResidentId = 1;
  private officeWorkers: Resident[] = []; // Track office workers separately

  constructor(scene: GameScene) {
    this.scene = scene;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for work start/end events to manage office workers
    this.scene.timeSystem.on('schedule:work-start', () => {
      this.spawnOfficeWorkers();
    });

    this.scene.timeSystem.on('schedule:work-end', () => {
      this.removeOfficeWorkers();
    });
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
    resident.type = 'resident'; // Explicitly set type
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

  /**
   * Spawn office workers at 9 AM on weekdays
   * Office workers don't live in the building, they arrive for work
   */
  private spawnOfficeWorkers(): void {
    // Only spawn on weekdays
    if (this.scene.timeSystem.isWeekend()) {
      return;
    }

    const offices = this.scene.building.getOffices();
    
    for (const office of offices) {
      // Spawn office workers for available job slots
      while (office.hasJobOpenings()) {
        const id = `resident_${this.nextResidentId++}`;
        const pos = office.getWorldPosition();
        
        const officeWorker = new Resident(this.scene, id, pos.x, pos.y);
        officeWorker.type = 'office_worker';
        officeWorker.setJob(office);
        // Office workers don't have homes
        officeWorker.home = null;
        
        this.residents.push(officeWorker);
        this.officeWorkers.push(officeWorker);
      }
    }
  }

  /**
   * Remove office workers at 5 PM on weekdays
   * Office workers leave the building at end of work day
   */
  private removeOfficeWorkers(): void {
    // Only remove on weekdays
    if (this.scene.timeSystem.isWeekend()) {
      return;
    }

    // Remove all office workers
    for (const worker of this.officeWorkers) {
      this.removeResident(worker);
    }
    
    // Clear the office workers array
    this.officeWorkers = [];
  }

  removeResident(resident: Resident): void {
    const index = this.residents.indexOf(resident);
    if (index !== -1) {
      this.residents.splice(index, 1);
      resident.destroy();
    }
    
    // Also remove from office workers if present
    const officeWorkerIndex = this.officeWorkers.indexOf(resident);
    if (officeWorkerIndex !== -1) {
      this.officeWorkers.splice(officeWorkerIndex, 1);
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

  getOfficeWorkers(): Resident[] {
    return this.officeWorkers;
  }

  getResidentialTenants(): Resident[] {
    return this.residents.filter((r) => r.type === 'resident');
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
