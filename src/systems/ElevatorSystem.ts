import { Building } from '../entities/Building';
import { Resident } from '../entities/Resident';
import { ElevatorState, ElevatorCall, ElevatorShaftData, ElevatorCarData } from '../utils/types';
import { FLOOR_HEIGHT, getSkyLobbyZone, getZoneMinFloor, getZoneMaxFloor } from '../utils/constants';

// Constants
const ELEVATOR_TRAVEL_TIME_PER_FLOOR = 2000; // 2 seconds per floor in ms
const DOOR_ANIMATION_TIME = 500; // 0.5 seconds
const LOADING_TIME = 1000; // 1 second for passengers to enter/exit
const ELEVATOR_CAPACITY = 8;

export class ElevatorCar {
  public currentFloor: number;
  public targetFloor: number | null = null;
  public passengers: Resident[] = [];
  public capacity: number = ELEVATOR_CAPACITY;
  public state: ElevatorState = ElevatorState.IDLE;
  public direction: 'up' | 'down' | 'idle' = 'idle';
  
  public stateTimer = 0; // Made public for testing
  private targetY: number = 0; // Visual Y position

  constructor(startFloor: number) {
    this.currentFloor = startFloor;
  }

  update(delta: number, _topFloor: number): void { // topFloor unused but kept for API consistency
    this.stateTimer += delta;

    switch (this.state) {
      case ElevatorState.IDLE:
        // Wait for calls
        break;

      case ElevatorState.DOORS_OPENING:
        if (this.stateTimer >= DOOR_ANIMATION_TIME) {
          this.state = ElevatorState.LOADING;
          this.stateTimer = 0;
        }
        break;

      case ElevatorState.LOADING:
        if (this.stateTimer >= LOADING_TIME) {
          this.state = ElevatorState.DOORS_CLOSING;
          this.stateTimer = 0;
        }
        break;

      case ElevatorState.DOORS_CLOSING:
        if (this.stateTimer >= DOOR_ANIMATION_TIME) {
          // Determine next destination
          if (this.targetFloor !== null && this.targetFloor !== this.currentFloor) {
            this.state = ElevatorState.MOVING;
            this.direction = this.targetFloor > this.currentFloor ? 'up' : 'down';
          } else {
            // No destination - return to idle
            this.state = ElevatorState.IDLE;
            this.direction = 'idle';
            this.targetFloor = null;
          }
          this.stateTimer = 0;
        }
        break;

      case ElevatorState.MOVING:
        if (this.targetFloor === null) {
          this.state = ElevatorState.IDLE;
          this.direction = 'idle';
          break;
        }

        {
          const floorsToTravel = Math.abs(this.targetFloor - this.currentFloor);
          const travelTime = floorsToTravel * ELEVATOR_TRAVEL_TIME_PER_FLOOR;

          if (this.stateTimer >= travelTime) {
          // Arrived at destination
          this.currentFloor = this.targetFloor;
          this.targetFloor = null;
          this.state = ElevatorState.DOORS_OPENING;
          this.stateTimer = 0;
          // Emit arrival event (for bell sound, etc.)
        } else {
          // Calculate visual position during travel
          }
          // currentFloor is the starting floor, targetFloor is the destination
          const progress = this.stateTimer / travelTime;
          const startFloorY = this.getFloorY(this.currentFloor);
          const endFloorY = this.getFloorY(this.targetFloor!);
          this.targetY = startFloorY + (endFloorY - startFloorY) * progress;
        }
        break;
    }
  }

  private getFloorY(floor: number): number {
    // Floor 0 is at y=0 (ground level), each floor above is FLOOR_HEIGHT pixels higher
    // In Phaser coordinates, y increases downward, so we return negative values
    // Ground Y is 500, so floor 0 = 500, floor 1 = 500 - 64, etc.
    return -floor * FLOOR_HEIGHT;
  }

  getVisualY(): number {
    if (this.state === ElevatorState.MOVING && this.targetFloor !== null) {
      // During movement, interpolate between current and target floor
      return this.targetY;
    }
    return this.getFloorY(this.currentFloor);
  }

  canAcceptPassengers(): boolean {
    return this.state === ElevatorState.LOADING && this.passengers.length < this.capacity;
  }

  addPassenger(resident: Resident): boolean {
    if (this.canAcceptPassengers() && this.passengers.length < this.capacity) {
      this.passengers.push(resident);
      return true;
    }
    return false;
  }

  removePassenger(resident: Resident): void {
    const index = this.passengers.indexOf(resident);
    if (index >= 0) {
      this.passengers.splice(index, 1);
    }
  }

  setTargetFloor(floor: number): void {
    if (floor !== this.currentFloor) {
      this.targetFloor = floor;
    }
  }

  serialize(): ElevatorCarData {
    return {
      currentFloor: this.currentFloor,
      targetFloor: this.targetFloor,
      passengerIds: this.passengers.map(r => r.id),
      capacity: this.capacity,
      state: this.state,
      direction: this.direction,
    };
  }
}

export class ElevatorShaft {
  public readonly id: string;
  public readonly position: number; // X position in grid units
  public readonly zone: number; // Zone this elevator serves (0 = floors 0-14, 1 = floors 15-29, etc.)
  public minFloor: number;
  public maxFloor: number;
  public car: ElevatorCar;
  public callQueue: ElevatorCall[] = []; // Made public for testing
  private waitingResidents: Map<number, Resident[]> = new Map(); // floor -> residents waiting

  constructor(id: string, position: number, zone: number) {
    this.id = id;
    this.position = position;
    this.zone = zone;
    this.minFloor = getZoneMinFloor(zone);
    this.maxFloor = getZoneMaxFloor(zone);
    this.car = new ElevatorCar(this.minFloor);
  }

  update(delta: number, topFloor: number): void {
    // Update max floor if building grew within this zone
    const zoneMaxFloor = getZoneMaxFloor(this.zone);
    this.maxFloor = Math.min(Math.max(this.maxFloor, topFloor), zoneMaxFloor);

    // Update car
    this.car.update(delta, topFloor);

    // Process calls and update car target
    this.processCalls();

    // Update waiting residents
    this.updateWaitingResidents(delta);
  }

  private processCalls(): void {
    // If car is idle or doors are opening, check for next call
    if (this.car.state === ElevatorState.IDLE || 
        (this.car.state === ElevatorState.DOORS_OPENING && this.car.targetFloor === null)) {
      
      // Find next call in direction of travel, or any call if idle
      const nextCall = this.findNextCall();
      if (nextCall) {
        this.car.setTargetFloor(nextCall.floor);
        if (this.car.state === ElevatorState.IDLE) {
          this.car.state = ElevatorState.DOORS_OPENING;
          this.car.stateTimer = 0;
        }
      }
    }

    // When car arrives at a floor with waiting residents, load them
    if (this.car.state === ElevatorState.LOADING) {
      const waitingAtFloor = this.waitingResidents.get(this.car.currentFloor) || [];
      for (const resident of waitingAtFloor) {
        if (this.car.addPassenger(resident)) {
          // Remove from waiting list
          const index = waitingAtFloor.indexOf(resident);
          if (index >= 0) {
            waitingAtFloor.splice(index, 1);
          }
        }
      }
      if (waitingAtFloor.length === 0) {
        this.waitingResidents.delete(this.car.currentFloor);
      }
    }
  }

  private findNextCall(): ElevatorCall | null {
    if (this.callQueue.length === 0) return null;

    // If car is idle, take first call
    if (this.car.direction === 'idle') {
      return this.callQueue.shift() || null;
    }

    // Find calls in current direction
    const callsInDirection = this.callQueue.filter(call => {
      if (this.car.direction === 'up') {
        return call.floor > this.car.currentFloor && call.direction === 'up';
      } else {
        return call.floor < this.car.currentFloor && call.direction === 'down';
      }
    });

    if (callsInDirection.length > 0) {
      // Take closest call in direction
      callsInDirection.sort((a, b) => {
        const distA = Math.abs(a.floor - this.car.currentFloor);
        const distB = Math.abs(b.floor - this.car.currentFloor);
        return distA - distB;
      });
      const nextCall = callsInDirection[0];
      const index = this.callQueue.indexOf(nextCall);
      if (index >= 0) {
        this.callQueue.splice(index, 1);
      }
      return nextCall;
    }

    // No calls in current direction - reverse and take first call
    if (this.callQueue.length > 0) {
      return this.callQueue.shift() || null;
    }

    return null;
  }

  callElevator(floor: number, direction: 'up' | 'down', resident: Resident): void {
    // Validate floor is within this zone
    if (floor < this.minFloor || floor > this.maxFloor) {
      console.warn(`Cannot call elevator on floor ${floor} - outside zone ${this.zone} (floors ${this.minFloor}-${this.maxFloor})`);
      return;
    }

    // Check if call already exists for this floor/direction
    const existingCall = this.callQueue.find(c => c.floor === floor && c.direction === direction);
    
    if (existingCall) {
      // Add resident to existing call
      if (!existingCall.residentIds.includes(resident.id)) {
        existingCall.residentIds.push(resident.id);
      }
    } else {
      // Create new call
      const call: ElevatorCall = {
        floor,
        direction,
        timestamp: Date.now(),
        residentIds: [resident.id],
      };
      this.callQueue.push(call);
    }

    // Add resident to waiting list
    if (!this.waitingResidents.has(floor)) {
      this.waitingResidents.set(floor, []);
    }
    const waiting = this.waitingResidents.get(floor)!;
    if (!waiting.includes(resident)) {
      waiting.push(resident);
    }
  }

  private updateWaitingResidents(_delta: number): void {
    // Track wait times for stress system (future implementation)
    // For now, just maintain the waiting lists
  }

  getWaitTime(floor: number): number {
    // Calculate estimated wait time for a floor
    // This is a simplified calculation
    const call = this.callQueue.find(c => c.floor === floor);
    if (!call) return 0;

    const floorsToTravel = Math.abs(this.car.currentFloor - floor);
    const travelTime = floorsToTravel * ELEVATOR_TRAVEL_TIME_PER_FLOOR;
    const queuePosition = this.callQueue.indexOf(call);
    const queueWaitTime = queuePosition * (ELEVATOR_TRAVEL_TIME_PER_FLOOR * 2); // Rough estimate

    return travelTime + queueWaitTime;
  }

  isAtFloor(floor: number): boolean {
    return this.car.currentFloor === floor && 
           (this.car.state === ElevatorState.LOADING || this.car.state === ElevatorState.DOORS_OPENING);
  }

  removeResident(resident: Resident): void {
    // Remove from passengers
    this.car.removePassenger(resident);

    // Remove from waiting lists
    for (const [floor, residents] of this.waitingResidents.entries()) {
      const index = residents.indexOf(resident);
      if (index >= 0) {
        residents.splice(index, 1);
        if (residents.length === 0) {
          this.waitingResidents.delete(floor);
        }
      }
    }

    // Remove from call queue
    this.callQueue = this.callQueue.filter(call => {
      const index = call.residentIds.indexOf(resident.id);
      if (index >= 0) {
        call.residentIds.splice(index, 1);
        return call.residentIds.length > 0; // Keep call if other residents are waiting
      }
      return true;
    });
  }

  serialize(): ElevatorShaftData {
    return {
      id: this.id,
      position: this.position,
      minFloor: this.minFloor,
      maxFloor: this.maxFloor,
      zone: this.zone,
    };
  }
}

export class ElevatorSystem {
  private shafts: Map<string, ElevatorShaft> = new Map();
  private building: Building;

  constructor(building: Building) {
    this.building = building;
  }

  createShaft(id: string, position: number, zone: number = 0): ElevatorShaft {
    const shaft = new ElevatorShaft(id, position, zone);
    this.shafts.set(id, shaft);
    return shaft;
  }

  getShaftForZone(zone: number): ElevatorShaft | undefined {
    // Find shaft serving the specified zone
    for (const shaft of this.shafts.values()) {
      if (shaft.zone === zone) {
        return shaft;
      }
    }
    return undefined;
  }

  getShaftForFloor(floor: number): ElevatorShaft | undefined {
    // Find shaft serving the zone that contains this floor
    const zone = getSkyLobbyZone(floor);
    return this.getShaftForZone(zone);
  }

  getShaft(id: string): ElevatorShaft | undefined {
    return this.shafts.get(id);
  }

  getAllShafts(): ElevatorShaft[] {
    return Array.from(this.shafts.values());
  }

  getShaftAtPosition(position: number): ElevatorShaft | undefined {
    // Find shaft closest to this position (within 1 grid unit)
    for (const shaft of this.shafts.values()) {
      if (Math.abs(shaft.position - position) <= 1) {
        return shaft;
      }
    }
    return undefined;
  }

  update(delta: number): void {
    const topFloor = this.building.getTopFloor();
    
    for (const shaft of this.shafts.values()) {
      shaft.update(delta, topFloor);
    }
  }

  callElevator(floor: number, direction: 'up' | 'down', resident: Resident): ElevatorShaft | null {
    // Find shaft serving the zone that contains this floor
    const shaft = this.getShaftForFloor(floor);
    if (!shaft) {
      console.warn(`No elevator shaft found for floor ${floor} (zone ${getSkyLobbyZone(floor)})`);
      return null;
    }

    shaft.callElevator(floor, direction, resident);
    return shaft;
  }

  removeResident(resident: Resident): void {
    for (const shaft of this.shafts.values()) {
      shaft.removeResident(resident);
    }
  }

  clear(): void {
    this.shafts.clear();
  }
}
