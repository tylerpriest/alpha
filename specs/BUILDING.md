# Building System

> The core structure that contains all rooms and floors.

## Overview

The Building is a vertical tower where residents live and work. It's organized as a grid of floors and rooms.

## Requirements

### Must Have (MVP)

- Grid-based room placement (64px per unit)
- Multiple floors (0 = ground, 1+ = above ground)
- Room overlap detection
- Room types with different sizes and constraints
- Visual representation of rooms with labels

### Should Have

- Elevator shafts for vertical transport
- Stairs as backup transport
- Room upgrades

### Nice to Have (Post-MVP)

- Multiple buildings
- Underground floors (basements)
- Roof gardens

## Design

### Data Model

```typescript
interface Building {
  floors: Map<number, Floor>;
  rooms: Map<string, Room>;
}

interface Floor {
  level: number;
  rooms: Room[];
}

interface Room {
  id: string;
  type: RoomType;
  floor: number;
  position: number; // X position in grid units
  width: number;    // Width in grid units
}
```

### Room Types

| Type | Width | Cost | Min Floor | Max Floor |
|------|-------|------|-----------|-----------|
| Lobby | 20 | $0 | 0 | 0 |
| Apartment | 3 | $5,000 | 1 | 100 |
| Office | 4 | $8,000 | 1 | 100 |
| Farm | 4 | $15,000 | 1 | 100 |
| Kitchen | 3 | $10,000 | 1 | 100 |

### Placement Rules

1. Rooms cannot overlap on the same floor
2. Lobby can only be on floor 0
3. Other rooms cannot be on floor 0
4. Player must have enough money to build

## Acceptance Criteria

- [x] Can place rooms on the grid
- [x] Rooms cannot overlap
- [x] Floor constraints are enforced
- [x] Room costs are deducted from money
- [ ] Rooms can be demolished (refund partial cost)

## Dependencies

- None

## Open Questions

- Should there be a maximum building width?
- How many floors before performance degrades?
