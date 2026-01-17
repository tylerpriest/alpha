import { Room } from './Room';

export class Floor {
  public readonly level: number;
  private rooms: Room[] = [];

  constructor(level: number) {
    this.level = level;
  }

  addRoom(room: Room): void {
    this.rooms.push(room);
    // Sort rooms by position for efficient lookup
    this.rooms.sort((a, b) => a.position - b.position);
  }

  removeRoom(room: Room): void {
    const index = this.rooms.indexOf(room);
    if (index !== -1) {
      this.rooms.splice(index, 1);
    }
  }

  getRooms(): Room[] {
    return this.rooms;
  }

  getRoomAt(position: number): Room | undefined {
    for (const room of this.rooms) {
      if (position >= room.position && position < room.position + room.width) {
        return room;
      }
    }
    return undefined;
  }

  isEmpty(): boolean {
    return this.rooms.length === 0;
  }
}
