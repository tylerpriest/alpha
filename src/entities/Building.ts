import Phaser from 'phaser';
import { Room } from './Room';
import { Floor } from './Floor';
import { ROOM_SPECS, RoomType } from '../utils/constants';
import { RoomData } from '../utils/types';

export class Building {
  private scene: Phaser.Scene;
  private floors: Map<number, Floor> = new Map();
  private rooms: Map<string, Room> = new Map();
  private nextRoomId = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addRoom(type: string, floor: number, position: number): boolean {
    const roomType = type as RoomType;
    const spec = ROOM_SPECS[roomType];

    if (!spec) {
      console.warn(`Unknown room type: ${type}`);
      return false;
    }

    // Validate floor constraints
    if (floor < spec.minFloor || floor > spec.maxFloor) {
      console.warn(`Cannot place ${type} on floor ${floor}`);
      return false;
    }

    // Check for overlaps
    const width = spec.width;
    if (this.hasOverlap(floor, position, width)) {
      console.warn(`Room overlaps with existing room`);
      return false;
    }

    // Create floor if needed
    if (!this.floors.has(floor)) {
      this.floors.set(floor, new Floor(floor));
    }

    // Create room
    const id = `room_${this.nextRoomId++}`;
    const room = new Room(this.scene, {
      id,
      type: roomType,
      floor,
      position,
      width,
    });

    this.rooms.set(id, room);
    this.floors.get(floor)!.addRoom(room);

    return true;
  }

  removeRoom(id: string): boolean {
    const room = this.rooms.get(id);
    if (!room) return false;

    const floor = this.floors.get(room.floor);
    if (floor) {
      floor.removeRoom(room);
    }

    room.destroy();
    this.rooms.delete(id);
    return true;
  }

  hasOverlap(floor: number, position: number, width: number): boolean {
    const floorObj = this.floors.get(floor);
    if (!floorObj) return false;

    const endPosition = position + width;

    for (const room of floorObj.getRooms()) {
      const roomEnd = room.position + room.width;
      if (position < roomEnd && endPosition > room.position) {
        return true;
      }
    }

    return false;
  }

  getRoomCost(type: string): number {
    const spec = ROOM_SPECS[type as RoomType];
    return spec?.cost ?? 0;
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getRoomAt(floor: number, position: number): Room | undefined {
    const floorObj = this.floors.get(floor);
    if (!floorObj) return undefined;

    for (const room of floorObj.getRooms()) {
      if (position >= room.position && position < room.position + room.width) {
        return room;
      }
    }

    return undefined;
  }

  getRoomsByType(type: RoomType): Room[] {
    return Array.from(this.rooms.values()).filter((room) => room.type === type);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getFloors(): Floor[] {
    return Array.from(this.floors.values());
  }

  getApartments(): Room[] {
    return this.getRoomsByType('apartment');
  }

  getOffices(): Room[] {
    return this.getRoomsByType('office');
  }

  getFarms(): Room[] {
    return this.getRoomsByType('farm');
  }

  getKitchens(): Room[] {
    return this.getRoomsByType('kitchen');
  }

  getTotalCapacity(): number {
    return this.getApartments().reduce((sum, apt) => {
      const spec = ROOM_SPECS[apt.type];
      return sum + ('capacity' in spec ? spec.capacity : 0);
    }, 0);
  }

  getTotalJobs(): number {
    return this.getOffices().reduce((sum, office) => {
      const spec = ROOM_SPECS[office.type];
      return sum + ('jobs' in spec ? spec.jobs : 0);
    }, 0);
  }

  serialize(): RoomData[] {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      type: room.type,
      floor: room.floor,
      position: room.position,
      width: room.width,
    }));
  }

  clear(): void {
    this.rooms.forEach((room) => room.destroy());
    this.rooms.clear();
    this.floors.clear();
  }
}
