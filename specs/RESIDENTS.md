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
- [ ] Residents consume food from kitchens
- [ ] Residents leave when starving too long
- [ ] Residents find and take jobs

## Dependencies

- Building System (apartments, offices)
- Food System (kitchens)

## Open Questions

- How fast should residents move?
- Should residents have individual personalities?
