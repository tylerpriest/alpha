# Object Pooling Pattern

## Why Pool?

Creating and destroying objects causes:
- Memory allocation overhead
- Garbage collection pauses
- Frame rate stutters

Object pooling reuses objects instead of creating new ones.

## Use Cases

- Residents/NPCs that come and go
- Bullets/projectiles
- Particles
- UI tooltips
- Pathfinding nodes
- Event objects

## Generic Pool Implementation

```typescript
export class ObjectPool<T> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    const obj = this.pool.pop() || this.factory();
    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.active.has(obj)) return;

    this.reset(obj);
    this.active.delete(obj);
    this.pool.push(obj);
  }

  releaseAll(): void {
    this.active.forEach((obj) => {
      this.reset(obj);
      this.pool.push(obj);
    });
    this.active.clear();
  }

  get activeCount(): number {
    return this.active.size;
  }

  get pooledCount(): number {
    return this.pool.length;
  }
}
```

## Example: Resident Pool

```typescript
interface Resident {
  id: string;
  x: number;
  y: number;
  hunger: number;
  home: Room | null;
  job: Room | null;
  sprite: Phaser.GameObjects.Sprite | null;
}

function createResident(): Resident {
  return {
    id: '',
    x: 0,
    y: 0,
    hunger: 100,
    home: null,
    job: null,
    sprite: null,
  };
}

function resetResident(resident: Resident): void {
  resident.id = '';
  resident.x = 0;
  resident.y = 0;
  resident.hunger = 100;
  resident.home = null;
  resident.job = null;

  if (resident.sprite) {
    resident.sprite.setVisible(false);
    resident.sprite.setActive(false);
  }
}

// Usage
const residentPool = new ObjectPool(createResident, resetResident, 50);

// Spawn a new resident
function spawnResident(apartment: Room): Resident {
  const resident = residentPool.acquire();
  resident.id = generateId();
  resident.x = apartment.x;
  resident.y = apartment.y;
  resident.home = apartment;

  if (resident.sprite) {
    resident.sprite.setPosition(resident.x, resident.y);
    resident.sprite.setVisible(true);
    resident.sprite.setActive(true);
  }

  return resident;
}

// Remove a resident
function despawnResident(resident: Resident): void {
  residentPool.release(resident);
}
```

## Phaser Group as Pool

Phaser has built-in pooling via Groups:

```typescript
export class GameScene extends Phaser.Scene {
  private bulletPool!: Phaser.GameObjects.Group;

  create(): void {
    // Create pool with max size
    this.bulletPool = this.add.group({
      classType: Bullet,
      maxSize: 100,
      runChildUpdate: true,
    });

    // Pre-create bullets
    this.bulletPool.createMultiple({
      key: 'bullet',
      quantity: 50,
      active: false,
      visible: false,
    });
  }

  fireBullet(x: number, y: number, direction: number): void {
    // Get inactive bullet from pool
    const bullet = this.bulletPool.get(x, y) as Bullet;

    if (bullet) {
      bullet.fire(direction);
    }
  }
}

class Bullet extends Phaser.GameObjects.Sprite {
  private speed = 400;
  private direction = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
  }

  fire(direction: number): void {
    this.direction = direction;
    this.setActive(true);
    this.setVisible(true);
  }

  update(time: number, delta: number): void {
    if (!this.active) return;

    this.x += Math.cos(this.direction) * this.speed * (delta / 1000);
    this.y += Math.sin(this.direction) * this.speed * (delta / 1000);

    // Return to pool when off screen
    if (this.isOffScreen()) {
      this.setActive(false);
      this.setVisible(false);
    }
  }

  private isOffScreen(): boolean {
    const bounds = this.scene.cameras.main.worldView;
    return (
      this.x < bounds.left - 50 ||
      this.x > bounds.right + 50 ||
      this.y < bounds.top - 50 ||
      this.y > bounds.bottom + 50
    );
  }
}
```

## Best Practices

### 1. Pre-allocate

```typescript
// Good: Pre-create expected objects
const pool = new ObjectPool(factory, reset, 100);

// Avoid: Growing pool during gameplay
```

### 2. Reset Completely

```typescript
function resetResident(resident: Resident): void {
  // Reset ALL properties, not just some
  resident.id = '';
  resident.x = 0;
  resident.y = 0;
  resident.hunger = 100;
  resident.home = null;
  resident.job = null;
  resident.state = ResidentState.IDLE;
  resident.target = null;
  resident.path = [];
}
```

### 3. Don't Over-Pool

Only pool objects that are:
- Created/destroyed frequently
- Numerous (dozens to thousands)
- Similar in structure

Don't pool:
- Singleton managers
- Scene-lifetime objects
- Rarely created objects

### 4. Track Pool Health

```typescript
// Monitor pool utilization
function logPoolStats(): void {
  console.log(`Residents - Active: ${residentPool.activeCount}, Pooled: ${residentPool.pooledCount}`);
}
```

## Performance Comparison

```typescript
// Without pooling: ~16ms for 1000 objects
for (let i = 0; i < 1000; i++) {
  const obj = new Resident();
  // use obj
  // obj gets garbage collected
}

// With pooling: ~2ms for 1000 objects
for (let i = 0; i < 1000; i++) {
  const obj = pool.acquire();
  // use obj
  pool.release(obj);
}
```

## Integration with ECS

If using Entity Component System:

```typescript
// Pool component data, not entities
const positionPool = new ObjectPool<Position>(
  () => ({ x: 0, y: 0 }),
  (p) => { p.x = 0; p.y = 0; }
);

// Entity is just an ID
function createEntity(): number {
  return nextEntityId++;
}

// Components are pooled separately
function addPosition(entity: number, x: number, y: number): void {
  const pos = positionPool.acquire();
  pos.x = x;
  pos.y = y;
  positions.set(entity, pos);
}

function removePosition(entity: number): void {
  const pos = positions.get(entity);
  if (pos) {
    positionPool.release(pos);
    positions.delete(entity);
  }
}
```
