# Residents

> The people who live and work in the arcology.

## Overview

Residents are autonomous agents who move in, work, eat, and potentially leave. Their satisfaction drives the simulation.

## Requirements

### Must Have (MVP)

- Residents spawn in apartments with available capacity
- Each resident has hunger that decreases over time
- Residents can be employed at offices
- Visual representation (colored rectangle + name)
- Color indicates hunger level (green → orange → red)
- Stress system (0-100 scale) alongside hunger
- Tenant types: Office Worker vs Residential Tenant
- Adjacency conflicts: Offices create noise → apartments get stressed
- Leaving conditions: Stress > 80 for 48 hours OR starvation
- Elevator congestion affects stress

### Should Have

- Residents follow daily schedule (work, eat, sleep)
- Unemployed residents seek jobs
- Residents leave when starving

### Nice to Have (Post-MVP)

- Resident relationships
- Life events (birth, death, marriage)
- Personal goals and desires
- Resident portraits

## Design

### Data Model

```typescript
interface Resident {
  id: string;
  name: string;
  hunger: number;      // 0-100
  stress: number;      // 0-100
  type: 'office_worker' | 'resident';
  traits: string[];    // visual variety, display only for MVP
  state: ResidentState;
  home: Room | null;
  job: Room | null;
}

enum ResidentState {
  IDLE,
  WALKING,
  WORKING,
  EATING,
  SLEEPING,
}
```

### Tenant Types

- **Office Worker**: Works in building, doesn't live here
  - Arrives in morning, leaves in evening
  - Only needs office space
  - Affected by elevator congestion during rush hours

- **Residential Tenant**: Lives in apartment, may work elsewhere or in building
  - Has a home in the building
  - May be employed at an office in the building or elsewhere
  - Affected by noise, hunger, and all stress factors

### Behavior

**Daily Cycle:**
- 6 AM: Wake up
- 9 AM - 5 PM: Work (if employed)
- 12 PM: Lunch break
- 5 PM - 10 PM: Free time
- 10 PM - 6 AM: Sleep

**Hunger Mechanics:**
- Decreases at 4 points per game hour
- Critical at 20 points
- Eating restores 30 points
- At 0 for 24 hours: resident leaves

### Stress System

Stress accumulates from various sources and is relieved through positive activities.

| Stress Factor | Impact |
|---------------|--------|
| Elevator wait > 30 sec | +5 stress |
| Elevator wait > 60 sec | +10 stress |
| Elevator wait > 120 sec | +20 stress |
| Adjacent to noisy room | +2 stress/hour |
| Unemployed | +3 stress/hour |
| Overcrowded apartment (>4 residents) | +5 stress/hour |
| Good meal | -10 stress |
| Sleep (full night) | -20 stress |

**Leaving Conditions:**
- Stress > 80 for 48 consecutive hours: resident leaves
- Starvation (hunger at 0 for 24 hours): resident leaves

### Adjacency Conflicts

- Offices generate noise
- Apartments adjacent to offices: +2 stress/hour for residents
- Solution: Buffer rooms (storage, utilities) or vertical/horizontal separation

### Visual Variety

- **Color variations**: 4-8 color palettes based on name hash
- **Size variation**: ±4px for diversity
- **Traits**: 1-2 traits per resident (display only for MVP)
  - Workaholic
  - Foodie
  - Night Owl
  - Early Bird
  - Social
  - Introvert

### Movement & Pathfinding

**Movement Speed:**
- Walking speed: 2 grid units per second (128px/sec)
- Vertical travel: Via elevator only (see ELEVATORS.md)

**Pathfinding (Simple):**
1. Resident needs to go from Room A to Room B
2. If same floor: Walk horizontally (direct path)
3. If different floor:
   - Walk to elevator on current floor
   - Wait for elevator (queue)
   - Ride elevator to destination floor
   - Walk horizontally to destination room
4. Sky lobby transfers: Exit elevator, walk to next elevator, continue

**Travel Time Calculation:**
```
HorizontalTime = |destinationX - currentX| / 2  (seconds)
VerticalTime = |destinationFloor - currentFloor| * 2 + ElevatorWait  (seconds)
TotalTime = HorizontalTime + VerticalTime
```

### State Machine

```
IDLE → Check needs → WALKING to destination
WALKING → Arrive → WORKING/EATING/SLEEPING
WORKING → End of work → WALKING home
EATING → Finished meal → IDLE
SLEEPING → Morning → IDLE
```

## Acceptance Criteria

- [x] Residents spawn in apartments
- [x] Hunger decreases over time
- [x] Visual color coding for hunger
- [x] Basic state machine (IDLE, WALKING)
- [x] Residents consume food from kitchens
- [x] Residents leave when starving too long
- [x] Residents find and take jobs
- [ ] Stress system implemented (0-100 scale)
- [ ] Tenant types differentiated (Office Worker vs Residential)
- [ ] Adjacency conflicts cause stress (offices → apartments)
- [ ] Stress-based leaving condition (> 80 for 48 hours)
- [ ] Elevator congestion affects stress
- [ ] Visual variety (color variations based on name hash)
- [ ] Size variation for residents
- [ ] Traits assigned to residents (display only)

## Dependencies

- Building System (apartments, offices)
- Food System (kitchens)
- Elevator System (congestion tracking)

## Open Questions

- How fast should residents move?
- Should residents have individual personalities?
- How should office worker arrival/departure be visualized?
- Should traits affect behavior in future updates?
