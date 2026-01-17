# Save/Load System

> Persistent game state via localStorage with manual and auto-save slots.

## Overview

The save/load system enables players to preserve their arcology progress between browser sessions. It uses localStorage for persistence, JSON serialization for data format, and provides both automatic and manual save options across multiple slots.

## Requirements

### Must Have (MVP)
- Save game state to localStorage in JSON format
- Load game state from localStorage
- 3 manual save slots for player-controlled saves
- 1 auto-save slot that triggers every 5 game days
- Persist all critical game data: building, residents, economy, time, settings
- Validate save file integrity on load
- Graceful error handling for corrupted or missing saves
- "New Game" option that clears all state and starts fresh
- Save slot selection UI with timestamps and basic info

### Should Have
- Save slot preview showing day count, population, and money
- Confirmation dialog before overwriting existing saves
- Confirmation dialog before starting new game (if saves exist)
- Visual feedback during save/load operations
- Error messages displayed to player on load failure

### Nice to Have (Post-MVP)
- Export save to downloadable JSON file
- Import save from JSON file
- Cloud save sync (requires backend)
- Save file compression for larger arcologies
- Multiple auto-save rotation (keep last 3 auto-saves)
- Save versioning for backwards compatibility

## Design

### Data Model

```typescript
interface SaveData {
  version: string;           // Save format version for migration
  timestamp: number;         // Unix timestamp of save
  checksum: string;          // Integrity hash

  building: BuildingSaveData;
  residents: ResidentSaveData[];
  economy: EconomySaveData;
  time: TimeSaveData;
  settings: SettingsSaveData;
}

interface BuildingSaveData {
  floors: FloorSaveData[];
  rooms: RoomSaveData[];
}

interface FloorSaveData {
  level: number;             // Floor index (0 = ground, negative = basement)
}

interface RoomSaveData {
  id: string;
  type: RoomType;
  floorLevel: number;
  gridX: number;
  width: number;
  occupantIds: string[];     // Resident IDs for residential rooms
  workerIds: string[];       // Resident IDs for commercial rooms
  // Room-specific state (e.g., food stock for restaurants)
  state: Record<string, unknown>;
}

interface ResidentSaveData {
  id: string;
  name: string;
  hunger: number;            // 0-100
  stress: number;            // 0-100
  jobRoomId: string | null;
  homeRoomId: string | null;
  state: ResidentState;      // 'idle' | 'working' | 'eating' | 'sleeping' | etc.
  position: { x: number; y: number };
}

interface EconomySaveData {
  money: number;
  dailyIncome: number;
  dailyExpenses: number;
  // Historical data for graphs (optional)
  history?: { day: number; income: number; expenses: number }[];
}

interface TimeSaveData {
  day: number;
  hour: number;              // 0-23
  speed: number;             // Current game speed multiplier
  lastAutoSaveDay: number;   // Track auto-save timing
}

interface SettingsSaveData {
  masterVolume: number;      // 0-1
  musicVolume: number;       // 0-1
  sfxVolume: number;         // 0-1
  defaultGameSpeed: number;  // Default speed on load
}

interface SaveSlotMeta {
  slot: number;              // 0 = auto, 1-3 = manual
  isEmpty: boolean;
  timestamp: number;
  dayCount: number;
  population: number;
  money: number;
}
```

### Storage Keys

```
arcology_save_0  // Auto-save slot
arcology_save_1  // Manual slot 1
arcology_save_2  // Manual slot 2
arcology_save_3  // Manual slot 3
arcology_meta    // Slot metadata for quick preview
```

### Save Process

1. Pause game during save operation
2. Serialize current game state to SaveData object
3. Generate checksum from serialized data (excluding checksum field)
4. Convert to JSON string
5. Write to localStorage with appropriate key
6. Update slot metadata
7. Resume game
8. Show success feedback

### Load Process

1. Read JSON from localStorage
2. Parse JSON to SaveData object
3. Validate checksum matches data
4. Validate version compatibility
5. If valid: hydrate game state from SaveData
6. If invalid: show error, offer to start new game
7. Resume game at saved time/speed

### Auto-Save Logic

- Track `lastAutoSaveDay` in time state
- On day change: check if `currentDay - lastAutoSaveDay >= 5`
- If true: trigger auto-save to slot 0, update `lastAutoSaveDay`
- Auto-save should not interrupt gameplay (async if possible)

### Integrity Validation

```typescript
function generateChecksum(data: Omit<SaveData, 'checksum'>): string {
  // Simple hash of JSON string (e.g., SHA-256 or simpler CRC32)
  const json = JSON.stringify(data);
  return hashFunction(json);
}

function validateSave(data: SaveData): boolean {
  const { checksum, ...rest } = data;
  return generateChecksum(rest) === checksum;
}
```

### Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| localStorage unavailable | "Cannot save: browser storage disabled" | Disable save features |
| Storage quota exceeded | "Cannot save: storage full" | Prompt to delete old saves |
| Corrupted save data | "Save file corrupted" | Offer new game or try other slot |
| Version mismatch | "Save from older version" | Attempt migration or warn |
| Parse error | "Cannot read save file" | Offer new game |

## Acceptance Criteria

- [ ] Player can save game to any of 3 manual slots
- [ ] Player can load game from any non-empty slot
- [ ] Auto-save triggers every 5 game days to slot 0
- [ ] Save includes complete building state (floors and rooms)
- [ ] Save includes all resident data (stats, jobs, homes, state)
- [ ] Save includes economy data (money, income, expenses)
- [ ] Save includes time data (day, hour, speed)
- [ ] Save includes settings (volume levels, default speed)
- [ ] Loading a save restores game to exact saved state
- [ ] Corrupted saves are detected and handled gracefully
- [ ] Player sees error message when load fails
- [ ] "New Game" clears current state and starts fresh
- [ ] Save slot UI shows timestamp and preview info
- [ ] Game pauses briefly during save/load operations
- [ ] Overwriting existing save requires confirmation

## Dependencies

- `Building` entity with serializable room data
- `ResidentSystem` with serializable resident data
- `EconomySystem` with money and income/expense tracking
- `TimeSystem` with day/hour tracking
- UI system for save/load menu
- Settings system for volume and speed preferences

## Open Questions

- Should we support save versioning and migration from older save formats?
- What's the maximum practical save size before localStorage limits become a concern?
- Should auto-save have a visual indicator or be completely silent?
- Do we need a "quick save" hotkey in addition to the menu?
- Should settings be saved globally or per-save-slot?
