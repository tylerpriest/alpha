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
- Sky lobbies required every 15 floors (floor 1, 15, 30, 45, 60, 75, 90)
- Demolition system: Free to demolish, 50% cost refund
- Max 20 floors for MVP (scalable to 100 post-MVP)

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

| Type | Width | Cost | Capacity | Min Floor | Max Floor |
|------|-------|------|----------|-----------|-----------|
| Lobby | 20 | Pre-built | - | 0 | 0 |
| Sky Lobby | 20 | $2,000 | - | 15, 30, 45... | 15, 30, 45... |
| Apartment | 3 | $2,000 | 4 residents | 1 | 100 |
| Office | 4 | $8,000 | 6 workers | 1 | 100 |
| Farm | 4 | $3,000 | - | 1 | 100 |
| Kitchen | 3 | $2,500 | - | 1 | 100 |
| Fast Food | 4 | $5,000 | 20 diners | 1 | 100 |
| Restaurant | 5 | $10,000 | 15 diners | 1 | 100 |

**Notes:**
- Ground floor Lobby is pre-built at game start (free)
- Sky Lobbies cost $2,000 and are required every 15 floors for elevator access
- Capacity = max simultaneous occupants
- With $20,000 starting money, player can build ~10 apartments or mix of rooms

### Placement Rules

1. Rooms cannot overlap on the same floor
2. Lobby can only be on floor 0
3. Other rooms cannot be on floor 0
4. Player must have enough money to build
5. Sky lobbies needed every 15 floors for elevators to work efficiently
6. Elevators only serve floors between lobbies

### Initial Game State

When a new game starts:
- Ground floor Lobby (20 units wide) is pre-built at position 0
- Elevator shaft is included in Lobby (centered)
- Player has $20,000 starting money
- Building is empty except for Lobby

### Building Dimensions

| Constraint | Value | Notes |
|------------|-------|-------|
| Grid unit | 64px | Base measurement |
| Building width | 40 units | 2560px total |
| MVP height | 20 floors | Floors 0-19 |
| Post-MVP height | 100 floors | Floors 0-99 |

### Building Height Constraints

The building has height limits that affect gameplay:

- **MVP Limit**: Maximum 20 floors (floor 0-19)
- **Post-MVP Limit**: Scalable to 100 floors
- **Sky Lobby Requirement**: Sky lobbies must be placed every 15 floors (floors 15, 30, 45, 60, 75, 90)
- Elevators only service floors within the same sky lobby zone (e.g., floors 0-14, 15-29, etc.)
- Residents must transfer at sky lobbies to reach higher floors

### Demolition

Demolition allows players to remove rooms and reconfigure their building:

- **Cost**: Free to demolish any room
- **Refund**: 50% of the original room cost is refunded
- **Restrictions**:
  - Ground floor lobby cannot be demolished
  - Sky lobbies cannot be demolished if residents depend on them for access
- **Process**:
  1. Select demolition mode
  2. Click on room to demolish
  3. Confirmation prompt shows refund amount
  4. Room is removed and refund is credited

## Acceptance Criteria

- [x] Can place rooms on the grid
- [x] Rooms cannot overlap
- [x] Floor constraints are enforced
- [x] Room costs are deducted from money
- [ ] Rooms can be demolished (refund partial cost)
- [ ] Sky lobbies can be placed on required floors
- [ ] Building height limited to 20 floors (MVP)
- [ ] Fast Food rooms can be placed
- [ ] Restaurant rooms can be placed
- [ ] Demolition refunds 50% of room cost
- [ ] Elevators only serve floors within lobby zones

## Dependencies

- None

## Open Questions

- Should there be a maximum building width?
- ~~How many floors before performance degrades?~~ Resolved: MVP limited to 20 floors, post-MVP scalable to 100
