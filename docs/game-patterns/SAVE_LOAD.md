# Save/Load System Patterns

## MVP Approach: JSON + localStorage

Simple, works for most games, easy to debug.

```typescript
interface SaveData {
  version: number;
  timestamp: number;
  game: {
    money: number;
    day: number;
    hour: number;
  };
  building: {
    floors: FloorData[];
  };
  residents: ResidentData[];
}

interface FloorData {
  level: number;
  rooms: RoomData[];
}

interface RoomData {
  id: string;
  type: string;
  position: number;
  width: number;
}

interface ResidentData {
  id: string;
  name: string;
  hunger: number;
  energy: number;
  homeId: string | null;
  jobId: string | null;
}
```

## Save Implementation

```typescript
const SAVE_KEY = 'arcology-save';
const SAVE_VERSION = 1;

export function saveGame(game: Game): void {
  const data: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    game: {
      money: game.economy.money,
      day: game.time.day,
      hour: game.time.hour,
    },
    building: serializeBuilding(game.building),
    residents: game.residents.map(serializeResident),
  };

  try {
    const json = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY, json);
    console.log(`Saved game (${(json.length / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error('Failed to save:', error);
    // Handle quota exceeded, etc.
  }
}

function serializeBuilding(building: Building): SaveData['building'] {
  return {
    floors: building.floors.map((floor) => ({
      level: floor.level,
      rooms: floor.rooms.map((room) => ({
        id: room.id,
        type: room.type,
        position: room.position,
        width: room.width,
      })),
    })),
  };
}

function serializeResident(resident: Resident): ResidentData {
  return {
    id: resident.id,
    name: resident.name,
    hunger: resident.hunger,
    energy: resident.energy,
    homeId: resident.home?.id ?? null,
    jobId: resident.job?.id ?? null,
  };
}
```

## Load Implementation

```typescript
export function loadGame(): SaveData | null {
  try {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return null;

    const data: SaveData = JSON.parse(json);

    // Version migration
    if (data.version < SAVE_VERSION) {
      return migrateSave(data);
    }

    return data;
  } catch (error) {
    console.error('Failed to load:', error);
    return null;
  }
}

export function applySaveData(game: Game, data: SaveData): void {
  // Restore game state
  game.economy.money = data.game.money;
  game.time.day = data.game.day;
  game.time.hour = data.game.hour;

  // Restore building
  game.building.clear();
  for (const floorData of data.building.floors) {
    const floor = game.building.addFloor(floorData.level);
    for (const roomData of floorData.rooms) {
      floor.addRoom(createRoom(roomData));
    }
  }

  // Restore residents
  game.residents = [];
  for (const residentData of data.residents) {
    const resident = createResident(residentData);

    // Reconnect references
    if (residentData.homeId) {
      resident.home = game.building.getRoomById(residentData.homeId);
    }
    if (residentData.jobId) {
      resident.job = game.building.getRoomById(residentData.jobId);
    }

    game.residents.push(resident);
  }
}
```

## Version Migration

Handle save format changes between game versions.

```typescript
function migrateSave(data: SaveData): SaveData {
  let current = data;

  // Migration chain
  if (current.version === 0) {
    current = migrateV0toV1(current);
  }

  // Add more migrations as versions increase
  // if (current.version === 1) {
  //   current = migrateV1toV2(current);
  // }

  return current;
}

function migrateV0toV1(data: any): SaveData {
  // Example: In v1, we split "happiness" into "hunger" and "energy"
  return {
    ...data,
    version: 1,
    residents: data.residents.map((r: any) => ({
      ...r,
      hunger: r.happiness ?? 100,
      energy: r.happiness ?? 100,
    })),
  };
}
```

## Auto-Save

```typescript
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastSaveTime = 0;
let hasUnsavedChanges = false;

export function markDirty(): void {
  hasUnsavedChanges = true;
}

export function updateAutoSave(game: Game, currentTime: number): void {
  if (!hasUnsavedChanges) return;

  if (currentTime - lastSaveTime >= AUTO_SAVE_INTERVAL) {
    saveGame(game);
    lastSaveTime = currentTime;
    hasUnsavedChanges = false;
  }
}

// Call markDirty() when state changes
// resident.hunger -= 10;
// markDirty();
```

## Multiple Save Slots

```typescript
const MAX_SLOTS = 3;

function getSaveKey(slot: number): string {
  return `arcology-save-${slot}`;
}

export function saveToSlot(game: Game, slot: number): void {
  if (slot < 0 || slot >= MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }

  const data: SaveData = { /* ... */ };
  localStorage.setItem(getSaveKey(slot), JSON.stringify(data));
}

export function loadFromSlot(slot: number): SaveData | null {
  const json = localStorage.getItem(getSaveKey(slot));
  if (!json) return null;
  return JSON.parse(json);
}

export function listSaveSlots(): { slot: number; timestamp: number; name: string }[] {
  const slots = [];

  for (let i = 0; i < MAX_SLOTS; i++) {
    const json = localStorage.getItem(getSaveKey(i));
    if (json) {
      const data = JSON.parse(json) as SaveData;
      slots.push({
        slot: i,
        timestamp: data.timestamp,
        name: `Day ${data.game.day}`,
      });
    }
  }

  return slots;
}

export function deleteSlot(slot: number): void {
  localStorage.removeItem(getSaveKey(slot));
}
```

## Export/Import (File Download)

Allow players to download/upload saves.

```typescript
export function exportSave(game: Game): void {
  const data = createSaveData(game);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `arcology-save-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export function importSave(file: File): Promise<SaveData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        // Validate structure
        if (!data.version || !data.game || !data.building) {
          reject(new Error('Invalid save file'));
          return;
        }
        resolve(data);
      } catch (e) {
        reject(new Error('Failed to parse save file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Usage with file input
document.getElementById('import-btn')?.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) {
      try {
        const data = await importSave(file);
        applySaveData(game, data);
      } catch (e) {
        alert('Failed to import save');
      }
    }
  };

  input.click();
});
```

## Best Practices

### 1. Save Only What's Needed

```typescript
// ❌ Don't save computed values
interface BadResidentData {
  hunger: number;
  isHungry: boolean; // Computed from hunger < 30
}

// ✓ Compute on load
interface GoodResidentData {
  hunger: number;
}

// Computed on load:
// resident.isHungry = resident.hunger < 30;
```

### 2. Handle Missing Data

```typescript
function createResident(data: Partial<ResidentData>): Resident {
  return {
    id: data.id ?? generateId(),
    name: data.name ?? 'Unknown',
    hunger: data.hunger ?? 100,
    energy: data.energy ?? 100,
    // ... defaults for all fields
  };
}
```

### 3. Validate Before Loading

```typescript
function validateSaveData(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;
  if (typeof d.version !== 'number') return false;
  if (typeof d.timestamp !== 'number') return false;
  if (!d.game || typeof d.game !== 'object') return false;
  if (!d.building || typeof d.building !== 'object') return false;
  if (!Array.isArray(d.residents)) return false;

  return true;
}
```

### 4. Compress Large Saves

```typescript
// For large games, consider compression
import pako from 'pako';

function saveCompressed(data: SaveData): void {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json);
  const base64 = btoa(String.fromCharCode(...compressed));
  localStorage.setItem(SAVE_KEY, base64);
}

function loadCompressed(): SaveData | null {
  const base64 = localStorage.getItem(SAVE_KEY);
  if (!base64) return null;

  const compressed = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const json = pako.inflate(compressed, { to: 'string' });
  return JSON.parse(json);
}
```
