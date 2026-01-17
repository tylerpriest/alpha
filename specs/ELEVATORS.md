# Elevator System

> Vertical transport that moves residents between floors efficiently.

## Overview

Elevators are the primary means of vertical transport in the building. Residents use elevators to travel between their apartments, offices, and food facilities. Wait times and congestion directly affect resident stress levels.

## Requirements

### Must Have (MVP)

- Elevator shaft placed as part of Lobby construction
- Single elevator car per shaft (MVP simplification)
- Capacity: 8 passengers per elevator
- Speed: 2 seconds per floor travel time
- Call button queue system (FIFO order)
- Visual elevator car with floor number display
- Door open/close animations
- Wait time tracking per floor
- Bell sound on arrival (G4 pitch)

### Should Have

- Multiple elevator shafts (up to 6)
- Express elevators (skip floors)
- Wait time display at each floor
- Elevator car capacity indicator

### Nice to Have (Post-MVP)

- Service elevators (larger capacity, slower)
- Elevator scheduling algorithms (minimize wait)
- VIP elevators for high floors
- Elevator breakdown events

## Design

### Data Model

```typescript
interface ElevatorShaft {
  id: string;
  position: number;     // X position in grid units
  minFloor: number;     // Lowest floor served
  maxFloor: number;     // Highest floor served
  car: ElevatorCar;
}

interface ElevatorCar {
  currentFloor: number;
  targetFloor: number | null;
  passengers: Resident[];
  capacity: number;     // Default 8
  state: ElevatorState;
  direction: 'up' | 'down' | 'idle';
}

enum ElevatorState {
  IDLE,           // Waiting at floor, doors closed
  DOORS_OPENING,  // 0.5 sec animation
  LOADING,        // Passengers entering/exiting
  DOORS_CLOSING,  // 0.5 sec animation
  MOVING,         // Traveling between floors
}

interface ElevatorCall {
  floor: number;
  direction: 'up' | 'down';
  timestamp: number;
  residents: Resident[];
}
```

### Elevator Mechanics

**Travel Time:**
- 2 seconds per floor
- 0.5 seconds door open animation
- 1 second loading/unloading time
- 0.5 seconds door close animation
- Total stop time: 2 seconds per floor stop

**Queue System:**
- Residents call elevator from their current floor
- Calls are queued in FIFO order
- Elevator serves calls in direction of travel first
- When no calls in current direction, reverses

**State Machine:**
```
IDLE → Call received → DOORS_OPENING
DOORS_OPENING → Animation complete → LOADING
LOADING → Passengers settled → DOORS_CLOSING
DOORS_CLOSING → Animation complete → MOVING (or IDLE if no destination)
MOVING → Arrived at floor → DOORS_OPENING (if stop needed) or continue MOVING
```

### Stress Impact

| Wait Time | Stress Impact |
|-----------|---------------|
| 0-30 sec  | +0 stress     |
| 30-60 sec | +5 stress     |
| 60-120 sec| +10 stress    |
| 120+ sec  | +20 stress    |

### Visual Design

- Shaft: 1 grid unit wide vertical column
- Car: Colored box with current floor number
- Doors: Slide open/close animation
- Waiting residents: Queue visualization at each floor
- Bell icon appears briefly on arrival

### Placement Rules

1. Elevator shaft must connect to Lobby on ground floor
2. Shaft extends from Lobby to highest built floor
3. One shaft per Lobby (MVP) - multiple lobbies = multiple shafts
4. Standard elevator serves max 15 floors efficiently
5. Sky lobbies required every 15 floors (floor 1, 15, 30, etc.)

## Acceptance Criteria

- [ ] Elevator shaft created when Lobby is built
- [ ] Residents can call elevator from any floor
- [ ] Elevator moves at 2 seconds per floor
- [ ] Door open/close animations play
- [ ] Bell sound plays on arrival
- [ ] Multiple residents can share elevator (up to capacity)
- [ ] Queue system handles multiple calls
- [ ] Wait times tracked and affect resident stress
- [ ] Visual indicator shows elevator position

## Dependencies

- Building System (Lobby placement, floor structure)
- Residents (passengers, stress system)
- Time System (wait time calculations)
- Audio System (bell sound)

## Open Questions

- Should elevators have a "home floor" they return to when idle?
- How to handle peak hours (morning rush, lunch)?
