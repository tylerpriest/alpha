# Spatial Partitioning Patterns

## Why Partition?

Without partitioning, checking if entities overlap requires O(n²) comparisons.
With partitioning, we only check entities in nearby cells: O(n) average case.

## When to Use

- Collision detection
- Finding nearest entities
- Visibility culling
- Range queries ("all enemies within 100 pixels")

## Pattern 1: Simple Grid

Best for: Uniform entity distribution, fixed world size.

```typescript
export class SpatialGrid<T extends { x: number; y: number }> {
  private grid: Map<string, T[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private key(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(entity: T): void {
    const k = this.key(entity.x, entity.y);
    if (!this.grid.has(k)) {
      this.grid.set(k, []);
    }
    this.grid.get(k)!.push(entity);
  }

  remove(entity: T): void {
    const k = this.key(entity.x, entity.y);
    const cell = this.grid.get(k);
    if (cell) {
      const index = cell.indexOf(entity);
      if (index !== -1) {
        cell.splice(index, 1);
      }
    }
  }

  update(entity: T, oldX: number, oldY: number): void {
    const oldKey = this.key(oldX, oldY);
    const newKey = this.key(entity.x, entity.y);

    if (oldKey !== newKey) {
      // Remove from old cell
      const oldCell = this.grid.get(oldKey);
      if (oldCell) {
        const index = oldCell.indexOf(entity);
        if (index !== -1) {
          oldCell.splice(index, 1);
        }
      }

      // Add to new cell
      if (!this.grid.has(newKey)) {
        this.grid.set(newKey, []);
      }
      this.grid.get(newKey)!.push(entity);
    }
  }

  query(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);

    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const k = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.grid.get(k);
        if (cell) {
          for (const entity of cell) {
            const dist = Math.hypot(entity.x - x, entity.y - y);
            if (dist <= radius) {
              results.push(entity);
            }
          }
        }
      }
    }

    return results;
  }

  queryCell(x: number, y: number): T[] {
    return this.grid.get(this.key(x, y)) || [];
  }

  clear(): void {
    this.grid.clear();
  }
}
```

### Usage Example

```typescript
// Cell size should be roughly the size of your largest entity
const grid = new SpatialGrid<Resident>(64);

// Insert all residents
residents.forEach((r) => grid.insert(r));

// Find residents near a point
const nearby = grid.query(mouseX, mouseY, 100);

// When a resident moves
function moveResident(resident: Resident, newX: number, newY: number): void {
  const oldX = resident.x;
  const oldY = resident.y;
  resident.x = newX;
  resident.y = newY;
  grid.update(resident, oldX, oldY);
}
```

## Pattern 2: Quadtree

Best for: Non-uniform distribution, large worlds, dynamic entity counts.

```typescript
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export class Quadtree<T extends Point> {
  private bounds: Bounds;
  private capacity: number;
  private entities: T[] = [];
  private divided = false;
  private northwest?: Quadtree<T>;
  private northeast?: Quadtree<T>;
  private southwest?: Quadtree<T>;
  private southeast?: Quadtree<T>;

  constructor(bounds: Bounds, capacity = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  private contains(point: Point): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x < this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y < this.bounds.y + this.bounds.height
    );
  }

  private intersects(range: Bounds): boolean {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const halfW = width / 2;
    const halfH = height / 2;

    this.northwest = new Quadtree({ x, y, width: halfW, height: halfH }, this.capacity);
    this.northeast = new Quadtree({ x: x + halfW, y, width: halfW, height: halfH }, this.capacity);
    this.southwest = new Quadtree({ x, y: y + halfH, width: halfW, height: halfH }, this.capacity);
    this.southeast = new Quadtree({ x: x + halfW, y: y + halfH, width: halfW, height: halfH }, this.capacity);

    this.divided = true;

    // Re-insert entities into children
    for (const entity of this.entities) {
      this.insertIntoChildren(entity);
    }
    this.entities = [];
  }

  private insertIntoChildren(entity: T): boolean {
    if (this.northwest!.insert(entity)) return true;
    if (this.northeast!.insert(entity)) return true;
    if (this.southwest!.insert(entity)) return true;
    if (this.southeast!.insert(entity)) return true;
    return false;
  }

  insert(entity: T): boolean {
    if (!this.contains(entity)) {
      return false;
    }

    if (!this.divided && this.entities.length < this.capacity) {
      this.entities.push(entity);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return this.insertIntoChildren(entity);
  }

  query(range: Bounds, found: T[] = []): T[] {
    if (!this.intersects(range)) {
      return found;
    }

    for (const entity of this.entities) {
      if (
        entity.x >= range.x &&
        entity.x < range.x + range.width &&
        entity.y >= range.y &&
        entity.y < range.y + range.height
      ) {
        found.push(entity);
      }
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  clear(): void {
    this.entities = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }
}
```

### Usage Example

```typescript
// Create quadtree covering world bounds
const quadtree = new Quadtree<Resident>({
  x: 0,
  y: 0,
  width: worldWidth,
  height: worldHeight,
});

// Rebuild each frame (simple approach)
function updateSpatialIndex(): void {
  quadtree.clear();
  residents.forEach((r) => quadtree.insert(r));
}

// Query a rectangular area
const visibleResidents = quadtree.query({
  x: camera.scrollX,
  y: camera.scrollY,
  width: camera.width,
  height: camera.height,
});
```

## Pattern 3: Room-Based (For Building Games)

For tower/building games, rooms are natural spatial divisions.

```typescript
interface Room {
  id: string;
  floor: number;
  position: number; // X position on floor
  width: number;
  residents: Resident[];
}

export class BuildingSpatialIndex {
  private floors: Map<number, Room[]> = new Map();
  private roomById: Map<string, Room> = new Map();

  addRoom(room: Room): void {
    if (!this.floors.has(room.floor)) {
      this.floors.set(room.floor, []);
    }
    this.floors.get(room.floor)!.push(room);
    this.roomById.set(room.id, room);
  }

  removeRoom(roomId: string): void {
    const room = this.roomById.get(roomId);
    if (!room) return;

    const floorRooms = this.floors.get(room.floor);
    if (floorRooms) {
      const index = floorRooms.indexOf(room);
      if (index !== -1) {
        floorRooms.splice(index, 1);
      }
    }
    this.roomById.delete(roomId);
  }

  getRoomsOnFloor(floor: number): Room[] {
    return this.floors.get(floor) || [];
  }

  getRoomAt(floor: number, x: number): Room | undefined {
    const floorRooms = this.floors.get(floor);
    if (!floorRooms) return undefined;

    return floorRooms.find(
      (room) => x >= room.position && x < room.position + room.width
    );
  }

  getResidentsOnFloor(floor: number): Resident[] {
    const rooms = this.getRoomsOnFloor(floor);
    return rooms.flatMap((room) => room.residents);
  }

  findNearestRoom(
    floor: number,
    x: number,
    filter?: (room: Room) => boolean
  ): Room | undefined {
    const floorRooms = this.floors.get(floor);
    if (!floorRooms) return undefined;

    let nearest: Room | undefined;
    let nearestDist = Infinity;

    for (const room of floorRooms) {
      if (filter && !filter(room)) continue;

      const roomCenterX = room.position + room.width / 2;
      const dist = Math.abs(x - roomCenterX);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = room;
      }
    }

    return nearest;
  }
}
```

## Choosing the Right Pattern

| Scenario | Best Pattern |
|----------|--------------|
| Grid-based game (tiles) | Simple Grid |
| Large open world | Quadtree |
| Building/tower game | Room-Based |
| Many moving entities | Simple Grid (fastest updates) |
| Sparse entities | Quadtree (saves memory) |
| Fixed room layout | Room-Based |

## Performance Tips

### 1. Cell Size Matters

```typescript
// Too small: Many cells to check
const grid = new SpatialGrid(8); // ❌

// Too large: Many entities per cell
const grid = new SpatialGrid(1000); // ❌

// Just right: ~10-50 entities per cell
const grid = new SpatialGrid(64); // ✓
```

### 2. Lazy Updates

```typescript
// Update spatial index once per frame, not per entity movement
function update(): void {
  // Move all entities
  entities.forEach((e) => e.move());

  // Rebuild index once
  spatialIndex.clear();
  entities.forEach((e) => spatialIndex.insert(e));

  // Do collision checks
  // ...
}
```

### 3. Combine with Viewport Culling

```typescript
// Only process entities in view
const visibleEntities = spatialIndex.query(camera.worldView);
visibleEntities.forEach((e) => e.render());
```
