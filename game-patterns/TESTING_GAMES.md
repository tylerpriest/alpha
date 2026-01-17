# Testing Games with Vitest

## Philosophy

Test **logic**, not **rendering**. Game logic should be pure functions that don't depend on Phaser.

## Setup

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['src/test/**', 'src/scenes/**'],
    },
  },
});
```

### src/test/setup.ts

```typescript
// Mock browser APIs Phaser needs
class MockCanvas {
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      drawImage: () => {},
      // Add more as needed
    };
  }
}

global.HTMLCanvasElement = MockCanvas as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16) as any;
global.cancelAnimationFrame = clearTimeout;
```

## Pattern 1: Separate Logic from Rendering

```typescript
// ❌ Hard to test - mixed with Phaser
class BadResident extends Phaser.GameObjects.Sprite {
  hunger = 100;

  update() {
    this.hunger -= 0.1;
    if (this.hunger < 30) {
      this.setTint(0xff0000);
    }
  }
}

// ✓ Easy to test - pure logic
interface ResidentState {
  hunger: number;
  energy: number;
}

function updateResident(state: ResidentState, delta: number): ResidentState {
  return {
    ...state,
    hunger: Math.max(0, state.hunger - 0.1 * delta),
    energy: Math.max(0, state.energy - 0.05 * delta),
  };
}

function isHungry(state: ResidentState): boolean {
  return state.hunger < 30;
}

// Test
test('resident hunger decreases over time', () => {
  const initial: ResidentState = { hunger: 100, energy: 100 };
  const result = updateResident(initial, 100);

  expect(result.hunger).toBe(90);
  expect(result.energy).toBe(95);
});

test('resident is hungry when hunger below 30', () => {
  expect(isHungry({ hunger: 29, energy: 100 })).toBe(true);
  expect(isHungry({ hunger: 31, energy: 100 })).toBe(false);
});
```

## Pattern 2: Test Systems in Isolation

```typescript
// src/systems/EconomySystem.ts
export interface EconomyState {
  money: number;
  income: number;
  expenses: number;
}

export function calculateDailyBalance(state: EconomyState): number {
  return state.income - state.expenses;
}

export function applyDailyBalance(state: EconomyState): EconomyState {
  const balance = calculateDailyBalance(state);
  return {
    ...state,
    money: state.money + balance,
  };
}

export function canAfford(state: EconomyState, cost: number): boolean {
  return state.money >= cost;
}

export function purchase(state: EconomyState, cost: number): EconomyState | null {
  if (!canAfford(state, cost)) return null;
  return {
    ...state,
    money: state.money - cost,
  };
}

// src/systems/EconomySystem.test.ts
import { describe, test, expect } from 'vitest';
import {
  calculateDailyBalance,
  applyDailyBalance,
  canAfford,
  purchase,
} from './EconomySystem';

describe('EconomySystem', () => {
  test('calculates daily balance correctly', () => {
    const state = { money: 1000, income: 500, expenses: 200 };
    expect(calculateDailyBalance(state)).toBe(300);
  });

  test('applies daily balance to money', () => {
    const state = { money: 1000, income: 500, expenses: 200 };
    const result = applyDailyBalance(state);
    expect(result.money).toBe(1300);
  });

  test('canAfford returns true when enough money', () => {
    expect(canAfford({ money: 100, income: 0, expenses: 0 }, 100)).toBe(true);
    expect(canAfford({ money: 100, income: 0, expenses: 0 }, 101)).toBe(false);
  });

  test('purchase deducts cost', () => {
    const state = { money: 1000, income: 0, expenses: 0 };
    const result = purchase(state, 500);
    expect(result?.money).toBe(500);
  });

  test('purchase returns null when cannot afford', () => {
    const state = { money: 100, income: 0, expenses: 0 };
    expect(purchase(state, 500)).toBeNull();
  });
});
```

## Pattern 3: Test Game Rules

```typescript
// src/rules/rooms.ts
export interface Room {
  type: string;
  floor: number;
  position: number;
  width: number;
}

export const ROOM_SPECS = {
  apartment: { width: 3, cost: 5000, minFloor: 1 },
  office: { width: 4, cost: 8000, minFloor: 1 },
  lobby: { width: 10, cost: 0, minFloor: 0, maxFloor: 0 },
  farm: { width: 4, cost: 15000, minFloor: 1 },
} as const;

export function canPlaceRoom(
  type: keyof typeof ROOM_SPECS,
  floor: number,
  position: number,
  existingRooms: Room[]
): { valid: boolean; reason?: string } {
  const spec = ROOM_SPECS[type];

  // Check floor constraints
  if (spec.minFloor !== undefined && floor < spec.minFloor) {
    return { valid: false, reason: `${type} cannot be placed below floor ${spec.minFloor}` };
  }

  if ('maxFloor' in spec && spec.maxFloor !== undefined && floor > spec.maxFloor) {
    return { valid: false, reason: `${type} cannot be placed above floor ${spec.maxFloor}` };
  }

  // Check for overlaps
  const newRoomEnd = position + spec.width;
  const overlapping = existingRooms.find(
    (room) =>
      room.floor === floor &&
      position < room.position + room.width &&
      newRoomEnd > room.position
  );

  if (overlapping) {
    return { valid: false, reason: 'Overlaps with existing room' };
  }

  return { valid: true };
}

// src/rules/rooms.test.ts
import { describe, test, expect } from 'vitest';
import { canPlaceRoom, Room } from './rooms';

describe('Room Placement', () => {
  test('lobby can only be placed on floor 0', () => {
    expect(canPlaceRoom('lobby', 0, 0, []).valid).toBe(true);
    expect(canPlaceRoom('lobby', 1, 0, []).valid).toBe(false);
    expect(canPlaceRoom('lobby', 1, 0, []).reason).toContain('above floor 0');
  });

  test('apartment cannot be placed on floor 0', () => {
    expect(canPlaceRoom('apartment', 0, 0, []).valid).toBe(false);
    expect(canPlaceRoom('apartment', 1, 0, []).valid).toBe(true);
  });

  test('detects overlapping rooms', () => {
    const existing: Room[] = [
      { type: 'apartment', floor: 1, position: 5, width: 3 },
    ];

    // Overlaps at position 7
    expect(canPlaceRoom('apartment', 1, 6, existing).valid).toBe(false);

    // Adjacent, no overlap
    expect(canPlaceRoom('apartment', 1, 8, existing).valid).toBe(true);

    // Different floor, no overlap
    expect(canPlaceRoom('apartment', 2, 5, existing).valid).toBe(true);
  });
});
```

## Pattern 4: Test AI Behavior

```typescript
// src/ai/utility.ts
export interface Need {
  name: string;
  value: number;
  weight: number;
}

export interface Action {
  name: string;
  satisfies: string;
  amount: number;
}

export function calculateUtility(need: Need): number {
  // Higher utility when need is lower
  const urgency = 1 - need.value / 100;
  return urgency * need.weight;
}

export function selectBestAction(needs: Need[], actions: Action[]): Action | null {
  if (actions.length === 0) return null;

  let bestAction: Action | null = null;
  let bestScore = -Infinity;

  for (const action of actions) {
    const need = needs.find((n) => n.name === action.satisfies);
    if (!need) continue;

    const currentUtility = calculateUtility(need);
    const score = currentUtility * action.amount;

    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}

// src/ai/utility.test.ts
import { describe, test, expect } from 'vitest';
import { calculateUtility, selectBestAction, Need, Action } from './utility';

describe('Utility AI', () => {
  test('utility increases as need decreases', () => {
    const high: Need = { name: 'hunger', value: 90, weight: 1 };
    const low: Need = { name: 'hunger', value: 10, weight: 1 };

    expect(calculateUtility(low)).toBeGreaterThan(calculateUtility(high));
  });

  test('weight multiplies utility', () => {
    const normal: Need = { name: 'hunger', value: 50, weight: 1 };
    const weighted: Need = { name: 'hunger', value: 50, weight: 2 };

    expect(calculateUtility(weighted)).toBe(calculateUtility(normal) * 2);
  });

  test('selects action that best satisfies urgent need', () => {
    const needs: Need[] = [
      { name: 'hunger', value: 10, weight: 1 }, // Very hungry
      { name: 'energy', value: 80, weight: 1 }, // Not tired
    ];

    const actions: Action[] = [
      { name: 'eat', satisfies: 'hunger', amount: 50 },
      { name: 'sleep', satisfies: 'energy', amount: 50 },
    ];

    const best = selectBestAction(needs, actions);
    expect(best?.name).toBe('eat');
  });
});
```

## Pattern 5: Simulation Testing (Balance)

```typescript
// src/balance/simulation.ts
export interface SimulationConfig {
  initialMoney: number;
  apartmentRent: number;
  apartmentCost: number;
  foodCostPerResident: number;
  daysToSimulate: number;
}

export interface SimulationResult {
  finalMoney: number;
  peakMoney: number;
  bankruptDay: number | null;
  averageResidents: number;
}

export function simulateEconomy(config: SimulationConfig): SimulationResult {
  let money = config.initialMoney;
  let peakMoney = money;
  let bankruptDay: number | null = null;
  let totalResidents = 0;
  let residents = 0;

  for (let day = 0; day < config.daysToSimulate; day++) {
    // Players typically buy apartments early
    if (day < 5 && money >= config.apartmentCost) {
      money -= config.apartmentCost;
      residents += 2; // Each apartment holds 2 residents
    }

    // Daily income/expenses
    const income = residents * config.apartmentRent;
    const expenses = residents * config.foodCostPerResident;
    money += income - expenses;

    peakMoney = Math.max(peakMoney, money);
    totalResidents += residents;

    if (money < 0 && bankruptDay === null) {
      bankruptDay = day;
    }
  }

  return {
    finalMoney: money,
    peakMoney,
    bankruptDay,
    averageResidents: totalResidents / config.daysToSimulate,
  };
}

// src/balance/simulation.test.ts
import { describe, test, expect } from 'vitest';
import { simulateEconomy } from './simulation';

describe('Economy Balance', () => {
  const baseConfig = {
    initialMoney: 20000,
    apartmentRent: 100,
    apartmentCost: 5000,
    foodCostPerResident: 20,
    daysToSimulate: 30,
  };

  test('player should not go bankrupt with default settings in 30 days', () => {
    const result = simulateEconomy(baseConfig);
    expect(result.bankruptDay).toBeNull();
    expect(result.finalMoney).toBeGreaterThan(0);
  });

  test('rent should be profitable (rent > food cost)', () => {
    expect(baseConfig.apartmentRent).toBeGreaterThan(baseConfig.foodCostPerResident);
  });

  test('player can afford at least 3 apartments initially', () => {
    const affordableApartments = Math.floor(
      baseConfig.initialMoney / baseConfig.apartmentCost
    );
    expect(affordableApartments).toBeGreaterThanOrEqual(3);
  });

  test('economy grows over time', () => {
    const result = simulateEconomy(baseConfig);
    expect(result.finalMoney).toBeGreaterThan(baseConfig.initialMoney);
  });
});
```

## Running Tests

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Commands

```bash
# Run all tests once
npm test

# Run with UI
npm run test:ui

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Best Practices

1. **Keep game logic pure** - Functions that take state and return new state
2. **Test edge cases** - Empty arrays, zero values, negative numbers
3. **Test balance** - Simulate economy, verify player experience
4. **Don't test Phaser** - Mock it or skip rendering tests
5. **Fast feedback** - Tests should run in < 1 second
