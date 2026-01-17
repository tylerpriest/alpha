# Food System

> The resource chain that keeps residents alive.

## Overview

Food is the primary resource in the MVP. Farms produce raw food, kitchens process it into meals, and residents consume meals.

## Requirements

### Must Have (MVP)

- Farms produce raw food over time
- Kitchens convert raw food to meals
- Residents consume meals when hungry
- Visual feedback for food levels

### Should Have

- Food storage limits
- Kitchen efficiency upgrades
- Multiple food types

### Nice to Have (Post-MVP)

- Restaurants as alternative to kitchens
- Food quality levels
- Resident food preferences

## Design

### Data Model

```typescript
interface ResourceSystem {
  rawFood: number;       // From farms
  processedFood: number; // From kitchens
}
```

### Production Chain

```
Farm (produces raw food)
    ↓ 10 units/day
Kitchen (processes raw food)
    ↓ 20 units/day (if raw food available)
Residents (consume processed food)
    ↓ ~3 meals/day per resident
```

### Room Specifications

| Room | Function | Rate |
|------|----------|------|
| Farm | Produces raw food | 10/day |
| Kitchen | Processes raw → meals | 20/day |

### Consumption

- Each resident eats ~3 times per day
- Each meal consumes 1 processed food
- If no food available, hunger doesn't recover

## Acceptance Criteria

- [x] Farms produce raw food over time
- [x] Kitchens convert raw food to processed food
- [ ] Residents consume food when eating
- [ ] Food counter displayed in UI
- [ ] Residents go hungry if no food available

## Dependencies

- Building System (farms, kitchens)
- Residents (consumers)

## Open Questions

- Should food spoil over time?
- How much food should one farm support?
