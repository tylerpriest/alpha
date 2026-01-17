# Implementation Plan

> Prioritized task list for Arcology MVP. Update after each iteration.
>
> **Last Updated:** Planning cycle analysis complete. All code vs spec discrepancies verified.

## Current Focus

**Visual Polish Priority:** Make it look great even with limited functionality. Graphics & UI/UX are HIGH PRIORITY - can run in parallel with other work.

Core food system is complete. Next priorities:
1. **Quick wins** - Spec alignment + immediate gameplay improvements
2. **Visual polish** - Venus atmosphere, day/night cycle, neon lighting
3. **Core systems** - Time events, restaurants, menus

**Quick Wins Ready Now:** All 9 items have zero dependencies and can be parallelized.

## Priority Summary

**Phase 1A - Visual Polish (HIGH PRIORITY - Start Immediately):**
1. Venus atmosphere background (amber-pink gradient clouds)
2. Day/night visual cycle overlay (dawn/day/dusk/night)
3. Room neon accent lighting (cyberpunk aesthetic)
4. Polished build menu (icons, hover states, tooltips)
5. Improved top bar design (cleaner layout)

**Phase 1B - Quick Wins (Parallel with 1A):**
1. Fix spec discrepancies (5 constants updates - 5 minutes)
2. Star rating calculation & display
3. Victory/Game Over overlays
4. Pause functionality (Space key + isPaused state)
5. Game speed controls (1x, 2x, 4x)
6. Ghost preview for room placement
7. Room demolition with refund (50%)
8. Keyboard shortcuts (1-7, Q, Delete, ESC, Space)
9. Room selection & info panel

**Phase 2 - Core Systems (Foundation):**
1. Time Events System (enables restaurants, schedules, day/night logic)
2. Day of week tracking (enables weekend behavior)
3. Restaurant System (Fast Food, Fine Dining room types)
4. Menu System (MainMenuScene, PauseMenuScene, SettingsScene)
5. Save/Load System (depends on menu system for UI)

**Phase 3 - Major Features (Dependencies Required):**
1. Elevator System (enables proper pathfinding)
2. Pathfinding System (depends on elevators)
3. Stress System (depends on pathfinding for elevator waits)
4. Satisfaction/Rent Tiers (depends on stress system)

**Phase 4 - Audio & Final Polish:**
1. UI sound effects (button clicks, placement sounds)
2. Money sounds (income chime, expense tone)
3. Alert sounds (low food, bankruptcy warning)
4. Ambient audio (optional)

## Code Analysis Summary (Verified)

**Implemented (Confirmed with File References):**
- Building system with overlap detection (`src/entities/Building.ts:20-42`)
- Floor management with sorted room storage (`src/entities/Floor.ts`)
- Room entity with capacity tracking (`src/entities/Room.ts`)
- Time system with day/hour tracking (`src/systems/TimeSystem.ts`)
- Economy system with bankruptcy at -$10,000 (`src/systems/EconomySystem.ts:38`)
- Resident state machine: IDLE→WALKING→WORKING/EATING/SLEEPING (`src/entities/Resident.ts:100-200`)
- Resource system: farms→raw food→kitchens→meals (`src/systems/ResourceSystem.ts`)
- UI top bar: money, food, population, time (`src/scenes/UIScene.ts:20-80`)
- Build menu with room buttons (`src/scenes/UIScene.ts:90-150`)
- Camera controls: right-click pan, scroll zoom (`src/scenes/GameScene.ts:81-121`)
- Room types: lobby, apartment, office, farm, kitchen (`src/utils/constants.ts:20-70`)
- Resident hunger visual: green→orange→red color coding (`src/entities/Resident.ts:199-210`)
- Daily income/expense processing (`src/systems/EconomySystem.ts:28-50`)
- Unit tests for EconomySystem (7 cases) and TimeSystem (6 cases)

**Missing Critical Features (Confirmed by Code Search):**
- Menu system (BootScene.create() line 43 directly starts GameScene, no MainMenuScene)
- Save/Load system (SaveData interface exists in types.ts:38-52, but no SaveSystem.ts file)
- Elevator system (completely missing - no ElevatorSystem.ts, no elevator entities)
- Pathfinding (Resident.goToRoom() line 208-214 sets targetY directly, bypassing floor-based movement)
- Restaurant room types (Fast Food, Fine Dining not in ROOM_SPECS constants.ts:20-70)
- Stress system (Resident class has no stress property, spec requires 0-100 tracking)
- Time events (TimeSystem has no EventEmitter, no schedule event emission)
- Star rating system (no calculation function, no display in UIScene)
- Game speed controls (GAME_SPEED constant in constants.ts:10, no UI controls, no mutability)
- Day of week tracking (TimeSystem only tracks day number, not dayOfWeek enum)
- Sky lobby room type (not in ROOM_SPECS, required every 15 floors per BUILDING.md)
- Room selection/info panel (GameScene.handleClick() only handles placement, no selection logic)
- Ghost preview (no visual feedback during placement in GameScene)
- Keyboard shortcuts (GameScene.setupInput() only handles mouse/pointer, no keyboard handlers)
- Victory/Game Over screens (no scene or overlay implementation, no checks in GameScene.update())
- Pause functionality (TimeSystem has no isPaused property, no pause logic)
- Room demolition UI (Building.removeRoom() exists but no Delete key handler, no refund logic)

**Spec Discrepancies (Verified - All in `src/utils/constants.ts`):**

| Property | Code Value | Spec Value | Line | Action |
|----------|------------|------------|------|--------|
| Apartment capacity | 2 | 4 | 38 | UPDATE |
| Apartment cost | $5,000 | $2,000 | 32 | UPDATE |
| Office cost | $8,000 | $8,000 | 42 | ✓ OK |
| Office jobs | 4 | 6 | 48 | UPDATE |
| Farm cost | $15,000 | $3,000 | 52 | UPDATE |
| Kitchen cost | $10,000 | $2,500 | 62 | UPDATE |

**Missing Room Types (Need to add to ROOM_SPECS):**

| Room Type | Cost | Width | Spec Reference |
|-----------|------|-------|----------------|
| Fast Food | $5,000 | 4 | BUILDING.md, FOOD_SYSTEM.md |
| Restaurant | $10,000 | 5 | BUILDING.md, FOOD_SYSTEM.md |
| Sky Lobby | $2,000 | 20 | BUILDING.md (every 15 floors) |

**Note:** Fixing spec discrepancies is a 5-minute task with no dependencies.

**Missing Tests (Code Quality):**
- ResidentSystem.ts - No test file exists
- ResourceSystem.ts - No test file exists
- Resident entity - Complex state machine needs tests

**Incomplete Implementation Details:**
- `Resident.updateWorking()` (line 179-182) - Only comment, no productivity logic
- `Resident.updateSleeping()` (line 193-196) - Comment says "restores hunger resistance" but no code
- `BootScene.ts` (lines 38-39) - Asset loading commented out (no actual assets)

## Tasks

### Phase 1A - Visual Polish (HIGH PRIORITY)

**Venus Atmosphere & Day/Night:**
- [ ] Create Venus atmosphere background in GameScene
  - Amber-pink gradient: #e8a87c → #d4726a (day), #4a3a5a → #1a1a2a (night)
  - Add parallax cloud layers for depth
  - Position behind building at z-depth 0
- [ ] Implement day/night overlay system
  - Night (10 PM-5 AM): Dark blue overlay with room interior lights
  - Dawn (5-7 AM): Gradient from dark to warm
  - Day (7 AM-6 PM): No overlay, full brightness
  - Dusk (6-8 PM): Orange/purple gradient
  - Use Phaser.GameObjects.Rectangle with blend mode
- [ ] Add neon accent lighting to rooms
  - Room colors from GRAPHICS.md spec
  - Glow effects during night hours
  - Accent borders on each room type

**UI Polish:**
- [ ] Redesign build menu with spec colors
  - Dark background (0x1a1a2a)
  - Room buttons with neon accents
  - Hover states with brightness increase
  - Selection highlight (electric yellow #e4e44a)
- [ ] Polish top bar layout
  - Cleaner typography (off-white #e4e4e4)
  - Icon-based indicators
  - Star rating display (empty/filled stars)
- [ ] Add toast notification system
  - Room built confirmation
  - Resident moved in/out alerts
  - Low food/money warnings
  - Position: bottom-right, auto-dismiss

### Phase 1B - Quick Wins (No Dependencies)

**Spec Alignment (5 minutes):**
- [ ] Fix apartment capacity: 2 → 4 (constants.ts:38)
- [ ] Fix apartment cost: $5,000 → $2,000 (constants.ts:32)
- [ ] Fix farm cost: $15,000 → $3,000 (constants.ts:52)
- [ ] Fix kitchen cost: $10,000 → $2,500 (constants.ts:62)
- [ ] Fix office jobs: 4 → 6 (constants.ts:48)

**Game State Quick Wins:**
- [ ] Star rating system
  - Add `getStarRating()`: 1 star at 100 pop, 2 stars at 300 pop (MVP cap)
  - Display star icons in UIScene top bar
  - Add to registry: `starRating` value
- [ ] Victory overlay (population >= 300)
  - Check in GameScene.update() each frame
  - Show overlay: days played, population, money, rooms built
  - Buttons: Continue Playing, Main Menu
  - Pause TimeSystem when shown
- [ ] Game Over overlay (money < -$10,000)
  - Check `economySystem.isBankrupt()` in GameScene.update()
  - Show overlay: days survived, max population reached
  - Buttons: Restart, Main Menu
  - Pause TimeSystem when shown
- [ ] Pause system
  - Add `isPaused: boolean` to TimeSystem
  - Add `speed: number` property (1, 2, 4)
  - Skip time accumulation when paused
  - Show "PAUSED" indicator when active
- [ ] Speed controls in UI
  - Add buttons: ⏸ | 1x | 2x | 4x
  - Highlight active speed
  - Update TimeSystem.speed on click

**Building Quick Wins:**
- [ ] Ghost preview for placement
  - Add `pointermove` handler in GameScene
  - Draw semi-transparent rectangle at grid-snapped cursor position
  - Cyan (#4ae4e4) = valid, Magenta (#e44a8a) = invalid
  - Use `Building.hasOverlap()` for validation
  - Hide when no room type selected
- [ ] Room demolition
  - Add Delete key handler in GameScene.setupInput()
  - Select room first (click to select), then Delete to demolish
  - Refund = `ROOM_SPECS[type].cost * 0.5`
  - Call `economySystem.earn(refund)` then `building.removeRoom(id)`
  - Evict residents/workers before destroying room
- [ ] Room selection & info panel
  - Click on room when no placement active → select room
  - Store `selectedRoomId` in registry
  - Draw yellow border on selected room
  - Show info panel: type, residents/workers, income/expenses
- [ ] Keyboard shortcuts
  - 1-7: Select room types (lobby, apartment, office, farm, kitchen, fastfood, restaurant)
  - Q: Cancel selection
  - Delete: Demolish selected room
  - ESC: Toggle pause (or open pause menu later)
  - Space: Toggle pause

### Phase 2 - Core Systems

**Menu System:**
- [ ] MainMenuScene.ts
  - Buttons: New Game, Continue (if auto-save exists), Load Game, Settings
  - Update BootScene to start MainMenuScene instead of GameScene
  - Venus atmosphere background
- [ ] PauseMenuScene.ts (or overlay)
  - ESC key triggers from GameScene
  - Buttons: Resume, Save Game, Settings, Quit to Main Menu
  - Confirmation dialog for quit without saving
- [ ] SettingsScene.ts
  - Volume sliders: Master, UI, Ambient
  - Default game speed preference
  - Persist to localStorage as `arcology_settings`
- [ ] Game state enum: MAIN_MENU → PLAYING ↔ PAUSED → GAME_OVER | VICTORY

**Save/Load System:**
- [ ] Create SaveSystem.ts
  - `saveGame(slot: number)`: Serialize all systems to JSON
  - `loadGame(slot: number)`: Restore all systems from JSON
  - Storage keys: `arcology_save_0` (auto), `arcology_save_1-3` (manual)
- [ ] Extend SaveData interface in types.ts
  - Add: version, timestamp, checksum
  - Include: building rooms, residents, economy, time, resources
- [ ] Auto-save every 5 game days
  - Track `lastAutoSaveDay` in TimeSystem
  - Trigger on day rollover
- [ ] Save slot UI (overlay or scene)
  - Show slot previews: day, population, money
  - Empty slot indicator
  - Delete slot option
- [ ] Error handling
  - JSON parse errors → offer new game
  - Corrupted data → checksum mismatch warning
  - Storage full → prompt to delete old saves

**Time Events System:**
- [ ] Add EventEmitter to TimeSystem
  - Emit `time:hour-changed` on hour rollover
  - Emit `time:day-changed` on day rollover
  - Emit `time:phase-changed` (dawn/day/dusk/night)
- [ ] Add day of week tracking
  - Property: `dayOfWeek: 0-6` (0=Sunday)
  - Method: `isWeekend()` → true for Sat/Sun
- [ ] Schedule events
  - `schedule:wake-up` at 6 AM
  - `schedule:work-start` at 9 AM (weekdays only)
  - `schedule:lunch-start` at 12 PM
  - `schedule:work-end` at 5 PM (weekdays only)
  - `schedule:sleep` at 10 PM

**Restaurant System:**
- [ ] Add room types to ROOM_SPECS
  - `fastfood`: cost $5,000, width 4, capacity 20, expenses $50, color 0x4a2a2a
  - `restaurant`: cost $10,000, width 5, capacity 15, expenses $100, color 0x3a2a3a
- [ ] Create RestaurantSystem.ts
  - Track operating hours (Fast Food: 11-2, 5-7; Restaurant: 6-11 PM)
  - Food consumption: 30/day (FF), 20/day (restaurant)
  - Evaluation score: 0-100 based on food availability
- [ ] Income integration
  - Base: $500/day (FF), $800/day (restaurant)
  - Actual = base × (evaluation_score / 100)
  - Add to EconomySystem.processDailyIncome()

**Note:** Restaurant system depends on Time Events for operating hours.

### Phase 3 - Major Features

**Elevator System:**
- [ ] Create ElevatorSystem.ts
  - ElevatorShaft and ElevatorCar classes
  - States: IDLE → DOORS_OPENING → LOADING → DOORS_CLOSING → MOVING
  - FIFO call queue
  - Capacity: 8 passengers
  - Speed: 2 seconds per floor
- [ ] Visual representation
  - Shaft extends from lobby to highest built floor
  - Car with floor number display
  - Door open/close animation (0.5s each)
- [ ] Integrate with Building
  - Shaft placed automatically with Lobby
  - One shaft per lobby (MVP)

**Pathfinding System:**
- [ ] Replace Resident.goToRoom() teleportation
  - Current: Sets targetY directly (Resident.ts:208-214)
  - New: Walk → elevator → ride → walk sequence
- [ ] Implement path calculation
  - Same floor: Direct walk
  - Different floor: Walk to elevator → queue → ride → walk to destination
- [ ] Sky lobby transfers
  - Add `skylobby` room type (cost $2,000, width 20)
  - Valid floors: 15, 30, 45, 60, 75, 90
  - Elevator zones: 0-14, 15-29, 30-44, etc.
  - Prevent building above floor 15 without sky lobby

**Stress System:**
- [ ] Add stress property to Resident
  - Range: 0-100
  - Default: 0
- [ ] Stress accumulation factors
  - Elevator wait >30s: +5
  - Elevator wait >60s: +10
  - Elevator wait >120s: +20
  - Adjacent to office: +2/hour
  - Unemployed: +3/hour
  - Overcrowded (>4 in apartment): +5/hour
- [ ] Stress relief
  - Good meal: -10
  - Full night sleep: -20
- [ ] Stress-based departure
  - Track consecutive hours at stress >80
  - Leave after 48 consecutive hours

**Satisfaction & Rent Tiers:**
- [ ] Calculate satisfaction
  - Formula: 100 - stress - hungerPenalty + bonuses
  - Hunger penalty: (100 - hunger) / 2
  - Food bonus: +10 if food available
  - Employment bonus: +15 if employed
- [ ] Rent tiers based on satisfaction
  - <40: $50/day
  - 40-60: $100/day
  - 60-80: $150/day
  - >80: $200/day
- [ ] Update EconomySystem to use satisfaction-based rent

### Phase 4 - Audio & Polish

**Audio System:**
- [ ] UI sounds
  - Button click
  - Room placement success/error
  - Menu open/close
- [ ] Money sounds
  - Income chime (cash register)
  - Expense tone
- [ ] Alert sounds
  - Low food warning
  - Starvation alert
  - Bankruptcy warning
- [ ] Volume controls
  - Master, UI, Ambient sliders
  - Mute toggle
  - Persist to localStorage

**Resident Polish:**
- [ ] Visual variety
  - 4-8 color palettes based on name hash
  - Size variation: ±4px
- [ ] Traits (display only)
  - Workaholic, Foodie, Night Owl, Early Bird, Social, Introvert
  - Show in resident info panel

### Low Priority (Post-MVP)

- [ ] Multiple elevator shafts (up to 6)
- [ ] Express elevators (skip floors)
- [ ] Room upgrades
- [ ] Statistics panel (population/income graphs)
- [ ] Tutorial hints for new players
- [ ] Resident relationships and life events
- [ ] Export/import save files
- [ ] Save versioning and migration
- [ ] Accessibility: colorblind modes, text scaling
- [ ] Minimap for large buildings
- [ ] Undo/redo for placements
- [ ] Minute-level time granularity

## Completed

**Infrastructure:**
- [x] Project setup (Vite + Phaser + TypeScript)
- [x] Scene structure (BootScene, GameScene, UIScene)
- [x] Unit tests for EconomySystem (7 cases) and TimeSystem (6 cases)

**Building System:**
- [x] Building entity with floor/room management
- [x] Room placement with overlap detection
- [x] Grid rendering (64px units)
- [x] Room types: lobby, apartment, office, farm, kitchen
- [x] Building.removeRoom() method (needs UI integration)

**UI System:**
- [x] Top bar (money, food, population, time display)
- [x] Build menu with room buttons
- [x] Camera controls (right-click pan, scroll zoom)

**Time & Economy:**
- [x] Time system (day/hour tracking, formatted display)
- [x] Economy system (money, daily income/expenses, bankruptcy detection)
- [x] Daily economy processing (income from apartments/offices, maintenance)

**Residents:**
- [x] Resident entity with state machine (IDLE→WALKING→WORKING/EATING/SLEEPING)
- [x] Resident spawning in apartments with capacity check
- [x] Hunger system (decay over time, color-coded visual feedback)
- [x] Food-seeking behavior (find kitchen when hungry < 50)
- [x] Starvation departure (leave after 24h at hunger 0)
- [x] Job assignment system (residents work at offices)

**Resources:**
- [x] Resource system (farms produce raw food, kitchens process to meals)
- [x] Food consumption from ResourceSystem (1 meal per eating action)

## Architecture Notes

**Patterns Used:**
- Phaser Registry for cross-scene state sharing (GameScene ↔ UIScene)
- Systems pattern: TimeSystem, EconomySystem, ResidentSystem, ResourceSystem
- Entity hierarchy: Building → Floor → Room, Residents reference Rooms
- Vitest with canvas mocks for Phaser testing

**Known Technical Debt:**
- Resident.goToRoom() teleports (sets targetY directly) - needs elevator integration
- TimeSystem lacks event emission for schedule-driven behaviors
- GAME_SPEED is constant, should be mutable property
- BootScene skips menu, goes directly to GameScene
- No keyboard input handlers in GameScene

## Dependency Graph

```
Phase 1A (Visual) ─────────────────┐
                                   ├──→ MVP Playable
Phase 1B (Quick Wins) ─────────────┘
         │
         ↓
Phase 2 (Core Systems)
├── Time Events ──→ Restaurant System
├── Menu System ──→ Save/Load System
         │
         ↓
Phase 3 (Major Features)
├── Elevator System ──→ Pathfinding
└── Pathfinding ──→ Stress System ──→ Satisfaction/Rent
         │
         ↓
Phase 4 (Audio & Polish)
```

**Parallel Work Possible:**
- Phase 1A (Visual) + Phase 1B (Quick Wins) = FULL PARALLEL
- Time Events + Menu System = PARALLEL
- Elevator + Restaurant = PARALLEL (after time events)
- Audio = FULLY INDEPENDENT

## MVP Goals

| Goal | Metric | Current Status |
|------|--------|----------------|
| Victory | 300 population (2 stars) | No victory check |
| Game Over | -$10,000 bankruptcy | isBankrupt() exists, no trigger |
| Building Height | 20 floors max | No limit enforced |
| Playable | Menu → Game → Save | No menu, no save |

## Next Actions

**Immediate (Start Now):**
1. Fix 5 spec discrepancies in constants.ts (5 min)
2. Add Venus atmosphere background to GameScene
3. Implement day/night overlay system
4. Add star rating calculation + display
5. Add victory/game over overlays
6. Add pause functionality to TimeSystem
7. Add speed controls to UIScene
8. Implement ghost preview for placement
9. Add keyboard shortcuts

**After Phase 1:**
1. Time Events system (enables restaurants)
2. Restaurant room types + system
3. Menu system (MainMenuScene, PauseMenuScene)
4. Save/Load system
5. Elevator/Pathfinding
6. Stress system
