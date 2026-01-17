# Time Events System

> Manages game time progression, day/night cycles, and schedule-driven resident behaviors.

## Overview

The time system controls the flow of time in Arcology, converting real seconds to in-game hours and driving resident schedules, visual transitions, and building operations. Time progresses at configurable speeds and follows a 24-hour cycle with distinct day/night phases. Residents follow daily and weekly schedules that determine their activities, movements, and needs.

## Requirements

### Must Have (MVP)
- Game time runs at 1 game hour = 10 real seconds (base speed)
- Speed multipliers: 1x, 2x, 4x (configurable via UI)
- Pause functionality
- 24-hour clock tracking (hours and minutes)
- Day of week tracking (Monday through Sunday)
- Day/night visual transitions
- Resident wake/sleep schedule (6 AM wake, 10 PM sleep)
- Work schedule (9 AM - 5 PM, weekdays only)
- Lunch break (12 PM - 1 PM)
- Event emission on hour changes
- Event emission on day changes
- UI display of current time and day

### Should Have
- Smooth visual transitions between day phases
- Dawn (5 AM - 7 AM) and dusk (6 PM - 8 PM) transition periods
- Weekend detection for office closures
- Time-based event queue system
- Minute-level granularity for schedules

### Nice to Have (Post-MVP)
- Seasonal variations (longer/shorter days)
- Holidays and special events
- Custom schedules per resident type
- Time skip functionality (skip to next event)
- Historical time tracking (total days played)

## Design

### Data Model

```typescript
interface TimeState {
  hour: number;           // 0-23
  minute: number;         // 0-59
  dayOfWeek: DayOfWeek;   // 0-6 (Sunday-Saturday)
  week: number;           // Total weeks elapsed
  totalDays: number;      // Total days elapsed
  speed: TimeSpeed;       // Current speed multiplier
  isPaused: boolean;      // Pause state
}

enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6
}

enum TimeSpeed {
  Paused = 0,
  Normal = 1,    // 1 game hour = 10 real seconds
  Fast = 2,      // 1 game hour = 5 real seconds
  Faster = 4     // 1 game hour = 2.5 real seconds
}

enum DayPhase {
  Night,      // 10 PM - 5 AM
  Dawn,       // 5 AM - 7 AM
  Day,        // 7 AM - 6 PM
  Dusk,       // 6 PM - 8 PM
  Evening     // 8 PM - 10 PM
}

interface ScheduleEvent {
  hour: number;
  minute?: number;
  days?: DayOfWeek[];     // If undefined, applies to all days
  event: string;          // Event name to emit
  data?: unknown;         // Optional event payload
}
```

### Time Progression

Base conversion rate:
- 1 game hour = 10 real seconds (at 1x speed)
- 1 game minute = 10/60 = 0.167 real seconds
- 1 game day = 240 real seconds = 4 minutes
- 1 game week = 1680 real seconds = 28 minutes

Speed calculations:
| Speed | Real Seconds per Game Hour | Real Time per Game Day |
|-------|---------------------------|----------------------|
| 1x    | 10 seconds                | 4 minutes            |
| 2x    | 5 seconds                 | 2 minutes            |
| 4x    | 2.5 seconds               | 1 minute             |

### Daily Schedule

| Time | Event | Weekday | Weekend |
|------|-------|---------|---------|
| 6:00 AM | Wake up | Yes | Yes |
| 9:00 AM | Work start | Yes | No |
| 12:00 PM | Lunch break start | Yes | Yes |
| 1:00 PM | Lunch break end | Yes | Yes |
| 5:00 PM | Work end | Yes | No |
| 10:00 PM | Sleep | Yes | Yes |

### Day/Night Visuals

The game scene should apply visual effects based on current phase:

| Phase | Hours | Visual Treatment |
|-------|-------|------------------|
| Night | 10 PM - 5 AM | Dark blue overlay, interior lights on |
| Dawn | 5 AM - 7 AM | Gradient from dark to light, warm tones |
| Day | 7 AM - 6 PM | Full brightness, no overlay |
| Dusk | 6 PM - 8 PM | Gradient to dark, orange/purple tones |
| Evening | 8 PM - 10 PM | Dim overlay, interior lights on |

### Event System

The TimeSystem emits events that other systems subscribe to:

```typescript
// Events emitted by TimeSystem
'time:hour-changed'     // { hour, previousHour }
'time:day-changed'      // { dayOfWeek, totalDays }
'time:phase-changed'    // { phase, previousPhase }
'time:speed-changed'    // { speed, previousSpeed }

// Schedule-specific events
'schedule:wake-up'      // Residents should wake
'schedule:work-start'   // Work day begins
'schedule:lunch-start'  // Lunch break begins
'schedule:lunch-end'    // Lunch break ends
'schedule:work-end'     // Work day ends
'schedule:sleep'        // Residents should sleep
```

### Weekend Behavior

- `isWeekend()` returns true for Saturday (6) and Sunday (0)
- Offices emit no work events on weekends
- Residents follow leisure patterns instead of work schedules
- Commercial areas may have increased traffic

## Acceptance Criteria

- [ ] Time progresses at 1 game hour per 10 real seconds at 1x speed
- [ ] Speed can be changed to 1x, 2x, or 4x via UI controls
- [ ] Game can be paused and resumed
- [ ] Current time displays in 12-hour or 24-hour format
- [ ] Day of week displays and advances correctly
- [ ] Visual overlay changes based on time of day
- [ ] Dawn and dusk show gradual transitions
- [ ] `time:hour-changed` event fires every game hour
- [ ] `time:day-changed` event fires at midnight
- [ ] `schedule:wake-up` event fires at 6 AM
- [ ] `schedule:work-start` event fires at 9 AM on weekdays only
- [ ] `schedule:lunch-start` event fires at 12 PM
- [ ] `schedule:work-end` event fires at 5 PM on weekdays only
- [ ] `schedule:sleep` event fires at 10 PM
- [ ] Weekend correctly identified (Saturday and Sunday)
- [ ] Offices do not trigger work events on weekends

## Dependencies

- `TimeSystem.ts` - Core time management (exists, may need extension)
- `UIScene.ts` - Time display and speed controls
- `ResidentSystem.ts` - Subscribes to schedule events
- `GameScene.ts` - Day/night visual overlay rendering

## Open Questions

- Should time continue when the game tab is not focused?
- Should there be a maximum speed (8x, 16x) for late-game progression?
- How should time-sensitive events queue when paused?
- Should residents have individual schedule variations (early birds, night owls)?
- Do commercial buildings have different hours than offices?
