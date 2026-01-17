import Phaser from 'phaser';
import { Room } from './Room';
import { Floor } from './Floor';
import { ROOM_SPECS, RoomType, MAX_FLOORS_MVP, getRequiredSkyLobbyFloor, SKY_LOBBY_FLOORS } from '../utils/constants';
import { RoomData } from '../utils/types';

export class Building {
  private scene: Phaser.Scene;
  private floors: Map<number, Floor> = new Map();
  private rooms: Map<string, Room> = new Map();
  private nextRoomId = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addRoom(type: string, floor: number, position: number, id?: string): boolean {
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

    // Special validation for sky lobbies: must be on specific floors (15, 30, 45, etc.)
    if (roomType === 'skylobby') {
      const validFloors = 'validFloors' in spec ? spec.validFloors : undefined;
      if (!validFloors || !(validFloors as readonly number[]).includes(floor)) {
        console.warn(`Sky lobby can only be placed on floors: ${validFloors?.join(', ')}`);
        return false;
      }
    }

    // Validate building height limit (MVP: 20 floors, floors 0-19)
    if (floor >= MAX_FLOORS_MVP) {
      console.warn(`Cannot place room on floor ${floor}: Building height limit is ${MAX_FLOORS_MVP} floors (floors 0-${MAX_FLOORS_MVP - 1})`);
      return false;
    }

    // Enforce sky lobby requirement: cannot build above floor 14 without sky lobby on floor 15
    // Cannot build above floor 29 without sky lobby on floor 30, etc.
    if (roomType !== 'skylobby') {
      const requiredSkyLobbyFloor = getRequiredSkyLobbyFloor(floor);
      if (requiredSkyLobbyFloor !== null) {
        // Check if required sky lobby exists
        if (!this.hasSkyLobbyOnFloor(requiredSkyLobbyFloor)) {
          console.warn(`Cannot place room on floor ${floor}: Sky lobby required on floor ${requiredSkyLobbyFloor}`);
          return false;
        }
      }
    }

    // Check for overlaps (skip during restore)
    const width = spec.width;
    if (!id && this.hasOverlap(floor, position, width)) {
      console.warn(`Room overlaps with existing room`);
      return false;
    }

    // Create floor if needed
    if (!this.floors.has(floor)) {
      this.floors.set(floor, new Floor(floor));
    }

    // Create room with specified ID or generate new one
    const roomId = id || `room_${this.nextRoomId++}`;
    const room = new Room(this.scene, {
      id: roomId,
      type: roomType,
      floor,
      position,
      width,
    });

    this.rooms.set(roomId, room);
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

  getTopFloor(): number {
    if (this.floors.size === 0) return 0;
    return Math.max(...Array.from(this.floors.keys()));
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

  getFastFoods(): Room[] {
    return this.getRoomsByType('fastfood');
  }

  getRestaurants(): Room[] {
    return this.getRoomsByType('restaurant');
  }

  getSkyLobbies(): Room[] {
    return this.getRoomsByType('skylobby');
  }

  hasSkyLobbyOnFloor(floor: number): boolean {
    const skyLobbies = this.getSkyLobbies();
    return skyLobbies.some(lobby => lobby.floor === floor);
  }

  getSkyLobbyForZone(zone: number): Room | undefined {
    // Zone 0: floors 0-14 (no sky lobby needed)
    // Zone 1: floors 15-29 (sky lobby on floor 15)
    // Zone 2: floors 30-44 (sky lobby on floor 30), etc.
    if (zone === 0) return undefined; // Ground zone doesn't need sky lobby
    
    const skyLobbyFloor = SKY_LOBBY_FLOORS[zone - 1];
    if (skyLobbyFloor === undefined) return undefined;
    
    return this.getSkyLobbies().find(lobby => lobby.floor === skyLobbyFloor);
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

  getNextRoomId(): number {
    return this.nextRoomId;
  }

  setNextRoomId(id: number): void {
    this.nextRoomId = id;
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

  redrawAllRooms(): void {
    this.rooms.forEach((room) => room.redraw());
  }
}
