# Food System

> The resource chain that keeps residents alive.

## Overview

Food is the primary resource in the MVP. Farms produce raw food, kitchens process it into meals, and residents consume meals. Restaurants provide commercial dining options that consume kitchen output and generate income.

## Requirements

### Must Have (MVP)

- Farms produce raw food over time
- Kitchens convert raw food to meals
- Residents consume meals when hungry
- Visual feedback for food levels
- Fast Food Restaurant: Commercial food vendor for quick meals
- Fine Dining Restaurant: Premium food service
- Fast Food operating hours: 11 AM - 2 PM and 5 PM - 7 PM
- Restaurant operating hours: 6 PM - 11 PM only
- Restaurants consume kitchen food output (don't produce their own)
- Resident dining behavior: Office workers seek Fast Food at lunch

### Should Have

- Food storage limits
- Kitchen efficiency upgrades
- Multiple food types

### Nice to Have (Post-MVP)

- Food quality levels
- Resident food preferences

## Design

### Data Model

```typescript
interface ResourceSystem {
  rawFood: number;       // From farms
  processedFood: number; // From kitchens
}

interface Restaurant {
  id: string;
  type: 'fastfood' | 'finedining';
  isOpen: boolean;
  currentCustomers: number;
  dailyFoodConsumed: number;
  evaluationScore: number;  // 0-100
}

interface RestaurantSystem {
  restaurants: Map<string, Restaurant>;
  getTotalFoodDemand(): number;
  calculateIncome(restaurant: Restaurant): number;
}
```

### Production Chain

```
Farm (produces raw food)
    ↓ 10 units/day
Kitchen (processes raw food)
    ↓ 20 units/day (if raw food available)
    ├── Residents (consume processed food)
    │       ↓ ~3 meals/day per resident
    └── Restaurants (consume processed food)
            ↓ 30/day (Fast Food) or 20/day (Fine Dining)
```

### Room Specifications

| Room | Function | Rate |
|------|----------|------|
| Farm | Produces raw food | 10/day |
| Kitchen | Processes raw → meals | 20/day |

### Restaurant Types

| Type | Cost | Income | Hours | Capacity | Food Consumed |
|------|------|--------|-------|----------|---------------|
| Fast Food | $5,000 | $500/day | 11-2, 5-7 | 20 | 30/day |
| Restaurant | $10,000 | $800/day | 6-11 PM | 15 | 20/day |

**Note:** Income is per operating day when evaluation score is 100. See Evaluation System below.

### Evaluation System

Restaurants are scored on a 0-100 scale that affects their income:

| Factor | Points | Description |
|--------|--------|-------------|
| Food availability | +40 | Full points if stocked, 0 if empty |
| Wait time | -5/min | Penalty for each minute over 5 min wait |
| Cleanliness | Variable | Based on staff (future feature) |

**Income calculation:** `actual_income = max_income * (evaluation_score / 100)`

Example: A Fast Food with 80 evaluation score earns $400/day instead of $500/day.

### Dining Behavior

- Office workers seek Fast Food during lunch (12 PM)
- Residents prefer cheaper/closer options when multiple available
- Restaurants attract outside visitors (bonus income beyond residents)
- Fine Dining has higher prestige, attracting wealthier residents

### Consumption

- Each resident eats ~3 times per day
- Each meal consumes 1 processed food
- If no food available, hunger doesn't recover

## Acceptance Criteria

- [x] Farms produce raw food over time
- [x] Kitchens convert raw food to processed food
- [x] Residents consume food when eating
- [x] Food counter displayed in UI
- [x] Residents go hungry if no food available
- [ ] Fast Food restaurant can be built
- [ ] Fine Dining restaurant can be built
- [ ] Fast Food operates 11 AM - 2 PM and 5 PM - 7 PM
- [ ] Fine Dining operates 6 PM - 11 PM only
- [ ] Restaurants consume processed food from kitchens
- [ ] Office workers seek Fast Food at lunch time
- [ ] Evaluation system calculates restaurant score (0-100)
- [ ] Restaurant income scales with evaluation score
- [ ] Restaurants show open/closed state visually

## Dependencies

- Building System (farms, kitchens, restaurants)
- Residents (consumers)
- TimeSystem (operating hours)
- EconomySystem (income tracking)

## Open Questions

- Should food spoil over time?
- How much food should one farm support?
- Should restaurants have staff requirements?
- How do outside visitors interact with building capacity?
