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

### Income Sources

| Source | Amount | Frequency |
|--------|--------|-----------|
| Apartment rent | $100 per occupied apartment | Daily |
| Office income | $200 per employed worker | Daily |

### Expenses

| Expense | Amount | Frequency |
|---------|--------|-----------|
| Apartment maintenance | $10 per apartment | Daily |
| Office maintenance | $20 per office | Daily |
| Farm maintenance | $50 per farm | Daily |
| Kitchen maintenance | $30 per kitchen | Daily |

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

## Dependencies

- Building System (rooms)
- Residents (occupancy, employment)

## Open Questions

- Should maintenance scale with room age?
- What happens at bankruptcy?
