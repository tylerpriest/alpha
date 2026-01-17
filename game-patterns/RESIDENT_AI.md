# Resident AI Patterns

## Progression Path

1. **FSM** (Finite State Machine) - Start here for MVP
2. **Utility AI** - Add when behavior needs to feel natural
3. **Behavior Trees** - Add for complex branching behavior

## Pattern 1: Finite State Machine (MVP)

Simple, predictable, easy to debug.

```typescript
export enum ResidentState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  WORKING = 'WORKING',
  EATING = 'EATING',
  SLEEPING = 'SLEEPING',
}

export class Resident {
  state: ResidentState = ResidentState.IDLE;
  hunger: number = 100;
  energy: number = 100;
  x: number;
  y: number;
  targetX: number | null = null;
  targetY: number | null = null;
  home: Room | null = null;
  job: Room | null = null;

  update(delta: number): void {
    // Decay needs
    this.hunger -= 0.01 * delta;
    this.energy -= 0.005 * delta;

    // State-specific behavior
    switch (this.state) {
      case ResidentState.IDLE:
        this.updateIdle();
        break;
      case ResidentState.WALKING:
        this.updateWalking(delta);
        break;
      case ResidentState.WORKING:
        this.updateWorking(delta);
        break;
      case ResidentState.EATING:
        this.updateEating(delta);
        break;
      case ResidentState.SLEEPING:
        this.updateSleeping(delta);
        break;
    }
  }

  private updateIdle(): void {
    // Check needs and decide what to do
    if (this.hunger < 30) {
      this.goEat();
    } else if (this.energy < 20) {
      this.goSleep();
    } else if (this.job && isWorkTime()) {
      this.goWork();
    }
  }

  private updateWalking(delta: number): void {
    if (this.targetX === null) {
      this.state = ResidentState.IDLE;
      return;
    }

    const speed = 100; // pixels per second
    const dx = this.targetX - this.x;
    const dist = Math.abs(dx);

    if (dist < 5) {
      this.x = this.targetX;
      this.onArrived();
    } else {
      this.x += Math.sign(dx) * speed * (delta / 1000);
    }
  }

  private updateWorking(delta: number): void {
    // Work generates money (handled by EconomySystem)
    // Stay working until end of work day
    if (!isWorkTime()) {
      this.state = ResidentState.IDLE;
    }
  }

  private updateEating(delta: number): void {
    // Eating takes time
    this.hunger = Math.min(100, this.hunger + 0.5 * delta);
    if (this.hunger >= 100) {
      this.state = ResidentState.IDLE;
    }
  }

  private updateSleeping(delta: number): void {
    this.energy = Math.min(100, this.energy + 0.2 * delta);
    if (this.energy >= 100) {
      this.state = ResidentState.IDLE;
    }
  }

  private goEat(): void {
    const kitchen = findNearestKitchen(this.x, this.y);
    if (kitchen) {
      this.targetX = kitchen.x;
      this.state = ResidentState.WALKING;
      // Set callback for arrival
      this.onArrived = () => {
        this.state = ResidentState.EATING;
      };
    }
  }

  private goSleep(): void {
    if (this.home) {
      this.targetX = this.home.x;
      this.state = ResidentState.WALKING;
      this.onArrived = () => {
        this.state = ResidentState.SLEEPING;
      };
    }
  }

  private goWork(): void {
    if (this.job) {
      this.targetX = this.job.x;
      this.state = ResidentState.WALKING;
      this.onArrived = () => {
        this.state = ResidentState.WORKING;
      };
    }
  }

  private onArrived: () => void = () => {
    this.state = ResidentState.IDLE;
  };
}
```

## Pattern 2: Utility AI (The Sims Style)

Actions scored by how well they satisfy needs. More natural-feeling.

```typescript
interface Need {
  name: string;
  value: number; // 0-100
  decayRate: number; // per second
  weight: number; // importance
}

interface Action {
  name: string;
  // Returns score 0-1 based on how good this action is right now
  evaluate(resident: Resident): number;
  execute(resident: Resident): void;
}

export class UtilityResident {
  needs: Map<string, Need> = new Map([
    ['hunger', { name: 'hunger', value: 100, decayRate: 0.01, weight: 1.5 }],
    ['energy', { name: 'energy', value: 100, decayRate: 0.005, weight: 1.0 }],
    ['social', { name: 'social', value: 100, decayRate: 0.002, weight: 0.8 }],
    ['fun', { name: 'fun', value: 100, decayRate: 0.003, weight: 0.7 }],
  ]);

  actions: Action[] = [];
  currentAction: Action | null = null;

  constructor() {
    this.registerActions();
  }

  private registerActions(): void {
    this.actions = [
      {
        name: 'eat',
        evaluate: (r) => this.evaluateNeed(r, 'hunger', 0.3),
        execute: (r) => this.startEating(r),
      },
      {
        name: 'sleep',
        evaluate: (r) => this.evaluateNeed(r, 'energy', 0.2),
        execute: (r) => this.startSleeping(r),
      },
      {
        name: 'work',
        evaluate: (r) => (isWorkTime() && r.job ? 0.5 : 0),
        execute: (r) => this.startWorking(r),
      },
      {
        name: 'socialize',
        evaluate: (r) => this.evaluateNeed(r, 'social', 0.15),
        execute: (r) => this.startSocializing(r),
      },
      {
        name: 'idle',
        evaluate: () => 0.1, // Always available, low priority
        execute: () => {},
      },
    ];
  }

  // Utility curve: higher score when need is lower
  private evaluateNeed(resident: Resident, needName: string, threshold: number): number {
    const need = this.needs.get(needName);
    if (!need) return 0;

    // Score increases as need value decreases
    // Threshold determines when this becomes high priority
    const urgency = 1 - need.value / 100;
    const weight = need.weight;

    // Returns 0 when satisfied, approaches 1 when critical
    return Math.max(0, (urgency - threshold) / (1 - threshold)) * weight;
  }

  update(delta: number): void {
    // Decay all needs
    this.needs.forEach((need) => {
      need.value = Math.max(0, need.value - need.decayRate * delta);
    });

    // Select best action
    const scores = this.actions.map((action) => ({
      action,
      score: action.evaluate(this as any),
    }));

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    // Switch action if significantly better option exists
    if (!this.currentAction || best.score > 0.3) {
      if (this.currentAction !== best.action) {
        this.currentAction = best.action;
        best.action.execute(this as any);
      }
    }
  }

  private startEating(resident: Resident): void {
    // Find food source and eat
  }

  private startSleeping(resident: Resident): void {
    // Go home and sleep
  }

  private startWorking(resident: Resident): void {
    // Go to job
  }

  private startSocializing(resident: Resident): void {
    // Find another resident to talk to
  }
}
```

## Pattern 3: Behavior Trees (Complex Behavior)

Best for: Complex AI with many conditions and fallbacks.

```typescript
// Node types
type NodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';

interface BehaviorNode {
  tick(resident: Resident, delta: number): NodeStatus;
}

// Composite: Try children in order until one succeeds
class Selector implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  tick(resident: Resident, delta: number): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(resident, delta);
      if (status !== 'FAILURE') {
        return status;
      }
    }
    return 'FAILURE';
  }
}

// Composite: Run children in order, fail if any fails
class Sequence implements BehaviorNode {
  private currentIndex = 0;

  constructor(private children: BehaviorNode[]) {}

  tick(resident: Resident, delta: number): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].tick(resident, delta);

      if (status === 'RUNNING') {
        return 'RUNNING';
      }

      if (status === 'FAILURE') {
        this.currentIndex = 0;
        return 'FAILURE';
      }

      this.currentIndex++;
    }

    this.currentIndex = 0;
    return 'SUCCESS';
  }
}

// Leaf: Condition check
class Condition implements BehaviorNode {
  constructor(private check: (r: Resident) => boolean) {}

  tick(resident: Resident): NodeStatus {
    return this.check(resident) ? 'SUCCESS' : 'FAILURE';
  }
}

// Leaf: Action
class Action implements BehaviorNode {
  constructor(private action: (r: Resident, delta: number) => NodeStatus) {}

  tick(resident: Resident, delta: number): NodeStatus {
    return this.action(resident, delta);
  }
}

// Example tree
function createResidentBehaviorTree(): BehaviorNode {
  return new Selector([
    // Priority 1: Handle critical hunger
    new Sequence([
      new Condition((r) => r.hunger < 20),
      new Action((r) => findAndEat(r)),
    ]),

    // Priority 2: Handle critical energy
    new Sequence([
      new Condition((r) => r.energy < 15),
      new Action((r) => goHomeAndSleep(r)),
    ]),

    // Priority 3: Work during work hours
    new Sequence([
      new Condition(() => isWorkTime()),
      new Condition((r) => r.job !== null),
      new Action((r) => goToWork(r)),
    ]),

    // Priority 4: Eat when hungry
    new Sequence([
      new Condition((r) => r.hunger < 50),
      new Action((r) => findAndEat(r)),
    ]),

    // Default: Idle
    new Action(() => 'SUCCESS'),
  ]);
}

// Usage
class BehaviorTreeResident {
  private tree: BehaviorNode;

  constructor() {
    this.tree = createResidentBehaviorTree();
  }

  update(delta: number): void {
    this.tree.tick(this as any, delta);
  }
}
```

## Choosing Your Pattern

| Scenario | Best Pattern |
|----------|--------------|
| MVP / Prototype | FSM |
| 2-4 states | FSM |
| Natural feeling choices | Utility AI |
| Complex priority/fallback | Behavior Trees |
| Mixing strategies | FSM for high-level, Utility for choices |

## Common Patterns

### Daily Schedule

```typescript
interface TimeSlot {
  startHour: number;
  endHour: number;
  activity: ResidentState;
}

const DEFAULT_SCHEDULE: TimeSlot[] = [
  { startHour: 6, endHour: 8, activity: ResidentState.EATING },
  { startHour: 8, endHour: 17, activity: ResidentState.WORKING },
  { startHour: 17, endHour: 18, activity: ResidentState.EATING },
  { startHour: 18, endHour: 22, activity: ResidentState.IDLE },
  { startHour: 22, endHour: 6, activity: ResidentState.SLEEPING },
];

function getScheduledActivity(hour: number): ResidentState {
  for (const slot of DEFAULT_SCHEDULE) {
    if (slot.startHour <= slot.endHour) {
      if (hour >= slot.startHour && hour < slot.endHour) {
        return slot.activity;
      }
    } else {
      // Wraps around midnight
      if (hour >= slot.startHour || hour < slot.endHour) {
        return slot.activity;
      }
    }
  }
  return ResidentState.IDLE;
}
```

### Stress/Happiness

```typescript
interface StressFactor {
  name: string;
  calculate(resident: Resident): number; // -1 to 1
}

const STRESS_FACTORS: StressFactor[] = [
  {
    name: 'hunger',
    calculate: (r) => (r.hunger < 30 ? -0.5 : 0),
  },
  {
    name: 'longCommute',
    calculate: (r) => (r.commuteTime > 10 ? -0.3 : 0),
  },
  {
    name: 'niceBedroom',
    calculate: (r) => (r.home?.quality > 5 ? 0.2 : 0),
  },
];

function calculateHappiness(resident: Resident): number {
  let happiness = 0.5; // baseline

  for (const factor of STRESS_FACTORS) {
    happiness += factor.calculate(resident);
  }

  return Math.max(0, Math.min(1, happiness));
}
```

### Pathfinding Between Rooms

```typescript
interface PathNode {
  floor: number;
  x: number;
}

function findPath(from: Room, to: Room, building: Building): PathNode[] {
  const path: PathNode[] = [];

  // Same floor - direct path
  if (from.floor === to.floor) {
    path.push({ floor: from.floor, x: to.x });
    return path;
  }

  // Different floors - need elevator/stairs
  const transport = findNearestTransport(from.floor, from.x);
  if (!transport) return []; // No path

  // Walk to transport
  path.push({ floor: from.floor, x: transport.x });

  // Take transport to destination floor
  path.push({ floor: to.floor, x: transport.x });

  // Walk to destination
  path.push({ floor: to.floor, x: to.x });

  return path;
}
```
