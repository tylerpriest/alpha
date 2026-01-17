# Economy System

> The money flow that enables building and sustains operations.

## Overview

Money is earned from rents and employed residents. It's spent on construction and maintenance.

## Requirements

### Must Have (MVP)

- Track current money balance
- Construction costs (one-time)
- Daily rent income from occupied apartments
- Daily maintenance costs for all rooms
- UI display of money
- Star rating system: Population milestones unlock stars
  - 1 star: 100 population
  - 2 star: 300 population (MVP victory condition)
  - 3 star: 1000 population (post-MVP)
  - 4 star: 5000 population (post-MVP)
  - 5 star: 15000 population (post-MVP)
- Rent pricing tiers based on tenant satisfaction
- Quarterly revenue for offices (not just daily)

### Should Have

- Daily income/expense breakdown
- Bankruptcy detection
- Income projections

### Nice to Have (Post-MVP)

- Loans and interest
- Variable rent pricing
- Economic events (recession, boom)

## Design

### Data Model

```typescript
interface EconomySystem {
  money: number;
  dailyIncome: number;
  dailyExpenses: number;
}
```

### Star Rating

Population milestones unlock building stars, representing prestige and progress.

| Stars | Population | Notes |
|-------|------------|-------|
| 1 | 100 | First milestone |
| 2 | 300 | MVP victory condition |
| 3 | 1,000 | Post-MVP |
| 4 | 5,000 | Post-MVP |
| 5 | 15,000 | Post-MVP |

### Rent Tiers

Apartment rent scales with tenant satisfaction levels.

| Tier | Rent/Day | Satisfaction Range |
|------|----------|-------------------|
| 1 | $50 | < 40 |
| 2 | $100 | 40-60 |
| 3 | $150 | 60-80 |
| 4 | $200 | > 80 |

### Tenant Satisfaction

Satisfaction (0-100) determines rent tier and is calculated per resident:

```
Satisfaction = 100 - Stress - HungerPenalty + FoodBonus + EmploymentBonus

Where:
- Stress: Current stress level (0-100)
- HungerPenalty: (100 - Hunger) / 2  (max 50 penalty when starving)
- FoodBonus: +10 if food available in building
- EmploymentBonus: +15 if employed
```

**Example calculations:**
| Stress | Hunger | Food? | Job? | Satisfaction | Rent Tier |
|--------|--------|-------|------|--------------|-----------|
| 20 | 80 | Yes | Yes | 100-20-10+10+15 = 95 | Tier 4 ($200) |
| 40 | 60 | Yes | No | 100-40-20+10+0 = 50 | Tier 2 ($100) |
| 60 | 30 | No | No | 100-60-35+0+0 = 5 | Tier 1 ($50) |

**Building-wide satisfaction** = Average of all resident satisfactions (used for star rating display)

### Income Sources

| Source | Amount | Frequency |
|--------|--------|-----------|
| Apartment rent | $50-200 per occupied apartment (based on satisfaction tier) | Daily |
| Office income | $200 per employed worker | Daily |
| Office revenue | Quarterly bonus based on employees | Quarterly |
| Fast Food income | $500 during open hours | Daily |
| Restaurant income | $800 during open hours | Daily |

### Expenses

| Expense | Amount | Frequency |
|---------|--------|-----------|
| Apartment maintenance | $20 per apartment | Daily |
| Office maintenance | $80 per office | Daily |
| Farm maintenance | $30 per farm | Daily |
| Kitchen maintenance | $25 per kitchen | Daily |
| Fast Food maintenance | $50 per fast food | Daily |
| Restaurant maintenance | $100 per restaurant | Daily |

**Maintenance is ~1% of build cost per day** - rooms pay for themselves in ~100 days if generating income.

### Initial Balance

- Player starts with $20,000
- Can afford ~4 apartments initially

### Bankruptcy

- Player is bankrupt at -$10,000
- Some debt is allowed to recover from bad decisions

## Acceptance Criteria

- [x] Starting money: $20,000
- [x] Construction deducts cost
- [x] Daily income from apartments/offices
- [x] Daily expenses for maintenance
- [ ] Bankruptcy detection and game over
- [ ] Income/expense breakdown in UI
- [ ] Star rating system with population milestones
- [ ] 2-star MVP victory condition at 300 population
- [ ] Rent pricing tiers based on satisfaction
- [ ] Tenant satisfaction calculation
- [ ] Quarterly office revenue
- [ ] Fast Food and Restaurant income
- [ ] Fast Food and Restaurant maintenance costs

## Dependencies

- Building System (rooms)
- Residents (occupancy, employment)

## Open Questions

- Should maintenance scale with room age?
- What happens at bankruptcy?
