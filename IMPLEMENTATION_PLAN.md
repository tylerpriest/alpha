# Implementation Plan

> Prioritized task list for Arcology MVP. Update after each iteration.

## Current Focus

**Visual Polish Priority:** Make it look great even with limited functionality. Graphics & UI/UX are now HIGH PRIORITY.

Core food system complete. Next: Visual polish (Venus atmosphere, day/night, neon lighting, UI enhancements) alongside quick wins.

**Quick Wins Available:** Star rating, victory/game over overlays, pause, speed controls, ghost preview, room demolition, keyboard shortcuts, and fixing spec discrepancies can all be implemented immediately with no dependencies.

## Code Analysis Summary

**Implemented:**
- Basic building system (rooms, floors, placement, overlap detection)
- Basic time system (day/hour tracking, but no events or day-of-week)
- Basic economy system (money, income/expenses, bankruptcy detection exists)
- Basic resident system (hunger, states, job assignment, starvation departure)
- Basic resource system (farms produce, kitchens process)
- Basic UI (top bar, build menu, camera controls)
- Room types: lobby, apartment, office, farm, kitchen
- Building.removeRoom() exists but no demolition UI/refund logic
- Resident.goToRoom() exists but uses direct Y coordinate (teleports between floors)

**Missing Critical Features:**
- Menu system (BootScene → GameScene direct transition, no MainMenuScene)
- Save/Load (SaveData interface in types.ts but no SaveSystem.ts implementation)
- Elevator system (completely missing - no ElevatorSystem.ts, no elevator entities)
- Pathfinding (Resident.goToRoom() sets targetY directly, bypassing floor-based movement)
- Restaurant room types (Fast Food, Fine Dining not in ROOM_SPECS)
- Stress system (Resident class has no stress property)
- Time events (TimeSystem has no EventEmitter, no schedule event emission)
- Star rating system (no calculation or display)
- Game speed controls (GAME_SPEED is constant, no UI controls)
- Day of week tracking (TimeSystem only tracks day number, not dayOfWeek)
- Sky lobby room type (not in ROOM_SPECS)
- Room selection/info panel (no click-to-select functionality)
- Ghost preview (no visual feedback during placement)
- Keyboard shortcuts (no input handlers for 1-7, Q, Delete, ESC, Space)
- Victory/Game Over screens (no scene or overlay implementation)
- Pause functionality (no isPaused in TimeSystem)

**Spec Discrepancies Found (Quick Fix):**
- Apartment capacity: Code=2, Spec=4 (update ROOM_SPECS.apartment.capacity)
- Apartment cost: Code=$5,000, Spec=$2,000 (update ROOM_SPECS.apartment.cost)
- Office cost: Code=$8,000, Spec=$8,000 ✓ (matches)
- Farm cost: Code=$15,000, Spec=$3,000 (update ROOM_SPECS.farm.cost)
- Kitchen cost: Code=$10,000, Spec=$2,500 (update ROOM_SPECS.kitchen.cost)

**Note:** These discrepancies should be fixed to align with specs before MVP release. This is a simple constants update with no dependencies.

## Tasks

### Immediate Quick Wins (No Dependencies)

**Spec Alignment Fixes:**
- [ ] Fix apartment capacity (2 → 4) in ROOM_SPECS (constants.ts:38)
- [ ] Fix apartment cost ($5,000 → $2,000) in ROOM_SPECS (constants.ts:32)
- [ ] Fix farm cost ($15,000 → $3,000) in ROOM_SPECS (constants.ts:52)
- [ ] Fix kitchen cost ($10,000 → $2,500) in ROOM_SPECS (constants.ts:62)
- [ ] Verify office jobs (Code=4, Spec=6) - update if spec is correct (constants.ts:48)

**Game Flow Quick Wins:**
- [ ] Star rating calculation and display (1 star: 100 pop, 2 star: 300 pop)
  - Add getStarRating() function: Math.floor(population / 100) capped at 2 for MVP
  - Display stars in UIScene top bar
  - Check for victory condition (2 stars = 300 pop) in GameScene update
- [ ] Victory overlay (population >= 300)
  - Check population in GameScene.update()
  - Show modal overlay with stats and continue/main menu buttons
  - Pause game time when shown
- [ ] Game Over overlay (money < -$10,000)
  - Check economySystem.isBankrupt() in GameScene.update()
  - Show modal overlay with stats and restart/main menu buttons
  - Pause game time when shown
- [ ] Pause functionality (Space key toggle)
  - Add isPaused: boolean to TimeSystem
  - Skip time accumulation when paused
  - Add Space key handler in GameScene
  - Show "PAUSED" indicator in UI
- [ ] Game speed controls (1x, 2x, 4x buttons in UI)
  - Make GAME_SPEED mutable (currently constant)
  - Add speed property to TimeSystem (1, 2, 4)
  - Add speed control buttons to UIScene
  - Update TimeSystem.update() to use speed multiplier

**Building Quick Wins:**
- [ ] Ghost preview for room placement
  - Track mouse position in GameScene (add pointermove handler)
  - Draw semi-transparent preview rectangle at cursor using Phaser Graphics
  - Cyan (#4ae4e4) if valid placement, magenta (#e44a8a) if invalid
  - Show preview only when room type selected (check registry for selectedRoom)
  - Update preview position on mouse move, hide when no room selected
- [ ] Room demolition (Delete key)
  - Add Delete key handler in GameScene.setupInput()
  - Get room at click position using Building.getRoomAt()
  - Calculate refund: room cost * 0.5 from ROOM_SPECS
  - Call EconomySystem.earn(refund) then Building.removeRoom()
  - Handle resident/worker eviction (remove from rooms before destroying)
- [ ] Room selection (click to select, show info)
  - Modify GameScene.handleClick() to detect room clicks when no room type selected
  - Store selectedRoomId in registry
  - Draw selection highlight (yellow border) on selected room in Room.draw()
  - Create room info panel in UIScene showing: type, occupants, income/expenses
- [ ] Keyboard shortcuts
  - Add keyboard input handlers in GameScene.setupInput()
  - 1-7 keys: Select room types (map to ROOM_SPECS keys: lobby=1, apartment=2, etc.)
  - Q key: Cancel room selection (clear registry selectedRoom)
  - Delete key: Demolish selected room (if room selected)
  - ESC key: Open pause menu (or toggle pause for now)
  - Space key: Toggle pause

### Critical Priority (MVP Blockers)

**Game Flow & Menus**
- [ ] Main menu scene (New Game, Continue, Load Game, Settings)
  - Create MainMenuScene.ts
  - Replace BootScene → GameScene direct transition
  - Implement menu buttons and navigation
- [ ] Pause menu (ESC key, Resume, Save, Settings, Quit)
  - Add ESC key handler in GameScene
  - Create PauseMenuScene.ts or overlay
  - Freeze game time when paused
- [ ] Settings menu (volume sliders, game speed preference, persistence)
  - Create SettingsScene.ts
  - Implement volume sliders (master, UI, ambient)
  - Persist to localStorage
- [ ] Game Over screen (bankruptcy trigger at -$10,000)
  - Check economySystem.isBankrupt() in GameScene update
  - Create GameOverScene.ts with stats display
  - Show restart/main menu options
- [ ] Victory screen (2-star rating at 300 population)
  - Check population >= 300 in GameScene update
  - Create VictoryScene.ts with stats display
  - Show continue/main menu options
- [ ] Game state management (menu → playing → paused → game over/victory)
  - Implement GameState enum
  - Manage scene transitions properly

**Save/Load System**
- [ ] SaveData serialization (building, residents, economy, time, resources)
  - Extend existing SaveData interface in types.ts
  - Implement serialize() methods on Building, ResidentSystem, etc.
  - Include all game state (money, day, hour, food, rooms, residents)
- [ ] Save to localStorage (3 manual slots + 1 auto-save slot)
  - Create SaveSystem.ts
  - Implement saveGame(slot: number) function
  - Store as JSON in localStorage keys: arcology_save_0 through arcology_save_3
- [ ] Load from localStorage with validation
  - Implement loadGame(slot: number) function
  - Validate SaveData structure
  - Restore all game systems from saved data
- [ ] Auto-save every 5 game days
  - Track lastAutoSaveDay in TimeSystem
  - Check on day change, trigger save to slot 0
- [ ] Save slot UI with previews (day, population, money)
  - Create SaveSlotSelectionScene.ts
  - Display slot metadata (timestamp, day, pop, money)
  - Show empty slots appropriately
- [ ] Error handling for corrupted/missing saves
  - Try/catch around JSON.parse
  - Validate required fields exist
  - Show user-friendly error messages
- [ ] Checksum validation for save integrity
  - Generate hash of save data (excluding checksum)
  - Verify on load

**Pathfinding & Elevators**
- [ ] Elevator system (shaft, car, queue, state machine)
  - Create ElevatorSystem.ts
  - Implement ElevatorShaft and ElevatorCar classes
  - State machine: IDLE → DOORS_OPENING → LOADING → DOORS_CLOSING → MOVING
  - Queue system for elevator calls (FIFO)
- [ ] Elevator visual representation (car, doors, floor indicator)
  - Draw elevator shaft in Building
  - Draw elevator car with current floor number
  - Animate door open/close
- [ ] Resident pathfinding between floors (use elevator, not teleport)
  - Replace direct Y coordinate movement in Resident.goToRoom()
  - Implement pathfinding: walk to elevator → wait → ride → walk to destination
  - Handle sky lobby transfers (every 15 floors)
- [ ] Elevator wait time tracking
  - Track when resident calls elevator
  - Calculate wait time when elevator arrives
  - Store wait time for stress system
- [ ] Sky lobby system (required every 15 floors)
  - Add 'skylobby' room type to ROOM_SPECS (cost: $2,000, width: 20, minFloor/maxFloor: 15/15, 30/30, etc.)
  - Validate sky lobby placement (floors 15, 30, 45, etc.)
  - Elevators only serve floors within same sky lobby zone (0-14, 15-29, 30-44, etc.)
  - Prevent building above floor 15 without sky lobby on floor 15
- [ ] Building height limit enforcement (20 floors for MVP)
  - Add MAX_FLOORS = 20 constant
  - Validate room placement doesn't exceed max floor
  - Show UI feedback when limit reached

**Restaurant System**
- [ ] Fast Food room type (add to ROOM_SPECS, $5,000 cost, 4 width)
  - Add 'fastfood' to ROOM_SPECS in constants.ts
  - Set cost: 5000, width: 4, capacity: 20, expenses: 50
- [ ] Fine Dining restaurant room type (add to ROOM_SPECS, $10,000 cost, 5 width)
  - Add 'restaurant' to ROOM_SPECS in constants.ts
  - Set cost: 10000, width: 5, capacity: 15, expenses: 100
- [ ] Restaurant operating hours (Fast Food: 11-2, 5-7; Restaurant: 6-11 PM)
  - Create RestaurantSystem.ts
  - Check time of day to determine if open
  - Update isOpen state based on hours
- [ ] Restaurant food consumption (Fast Food: 30/day, Restaurant: 20/day)
  - Consume processed food from ResourceSystem during operating hours
  - Track daily consumption per restaurant
- [ ] Restaurant evaluation system (0-100 score based on food availability, wait time)
  - Calculate score: +40 if food available, -5 per minute wait over 5 min
  - Update evaluation score each day
- [ ] Restaurant income calculation (scaled by evaluation score)
  - Base income: Fast Food $500/day, Restaurant $800/day
  - Actual income = base * (evaluation_score / 100)
  - Integrate into EconomySystem.processDailyIncome()
- [ ] Restaurant maintenance costs ($50 Fast Food, $100 Restaurant)
  - Already in ROOM_SPECS expenses (verify values match)
  - Integrate into EconomySystem.processDailyExpenses()
- [ ] Office workers seek Fast Food at lunch (12 PM)
  - Subscribe to 'schedule:lunch-start' event
  - Route office workers to Fast Food restaurants

### High Priority (Core MVP Features)

**Graphics & Visuals (Prioritized - Look Great First)**
- [ ] Venus atmosphere background (amber-pink gradient clouds)
- [ ] Day/night visual transitions (dawn, day, dusk, night overlays)
- [ ] Room neon accent lighting (cyberpunk aesthetic)
- [ ] Resident holographic tint effects
- [ ] Parallax cloud layers (background depth)

**UI/UX Enhancements (Prioritized)**
- [ ] Room info panel (type, occupants, income/expenses, status)
  - Show panel when room is selected
  - Display: room type, current occupants, daily income/expenses, status
  - Position panel near selected room or in sidebar
- [ ] Status alerts (low food, bankruptcy warning)
  - Low food alert: Show warning icon when processedFood < 100
  - Bankruptcy warning: Show warning when money < $1,000
  - Display alerts in top bar or as floating notifications
- [ ] Polished build menu (icons, hover states, selection feedback)
- [ ] Improved top bar design (cleaner layout, better typography)
- [ ] Toast notifications for events (room built, resident moved in, etc.)

**Resident Stress & Satisfaction**
- [ ] Stress system (0-100 scale, tracked per resident)
  - Add stress: number property to Resident class (default 0)
  - Clamp stress between 0-100
  - Update stress in Resident.update()
- [ ] Stress accumulation (elevator wait, adjacency conflicts, unemployment, overcrowding)
  - Elevator wait: +5 (>30s), +10 (>60s), +20 (>120s)
  - Adjacency: +2/hour if apartment adjacent to office
  - Unemployment: +3/hour if no job
  - Overcrowding: +5/hour if >4 residents in apartment
- [ ] Stress relief (good meals, sleep)
  - Good meal: -10 stress when eating
  - Sleep: -20 stress after full night's sleep
- [ ] Stress-based leaving condition (> 80 for 48 hours)
  - Track consecutive hours at stress > 80
  - Remove resident if stress > 80 for 48 consecutive game hours
  - Add to ResidentSystem.checkMoveOuts()
- [ ] Tenant satisfaction calculation (100 - stress - hunger penalty + bonuses)
  - Formula: 100 - stress - ((100 - hunger) / 2) + foodBonus + employmentBonus
  - Food bonus: +10 if food available
  - Employment bonus: +15 if employed
  - Clamp satisfaction 0-100
- [ ] Rent pricing tiers based on satisfaction ($50-200/day)
  - Tier 1: <40 satisfaction → $50/day
  - Tier 2: 40-60 → $100/day
  - Tier 3: 60-80 → $150/day
  - Tier 4: >80 → $200/day
  - Update EconomySystem.processDailyIncome() to use satisfaction-based rent
- [ ] Tenant types (Office Worker vs Residential) - differentiate behavior
  - Add type: 'office_worker' | 'resident' to Resident
  - Office workers: arrive morning, leave evening, don't live in building
  - Residential: live in apartments, may work in building
  - Different stress factors apply to each type

**Economy Enhancements**
- [ ] Quarterly office revenue (bonus income)
  - Track quarters (every 90 days)
  - Calculate bonus: $500 per employed worker
  - Add to daily income on quarter rollover
- [ ] Restaurant income integration into daily economy
  - Already covered in Restaurant System section above
- [ ] Income/expense breakdown UI
  - Show detailed breakdown when clicking money in top bar
  - Display: apartment rent, office income, restaurant income, maintenance costs
  - Show daily balance projection

**Building System Enhancements**
- [ ] Demolition system (free to demolish, 50% cost refund)
  - Building.removeRoom() already exists - add UI integration
  - Calculate refund: room cost * 0.5 from ROOM_SPECS
  - Refund to EconomySystem.earn(refund)
  - Remove room from building (Building.removeRoom() handles this)
  - Handle residents/workers in demolished room (evict before destroying room)
- [ ] Room selection (click to select, show info panel)
  - Add room click detection in GameScene.handleClick() (when no room type selected)
  - Store selectedRoomId in registry
  - Draw selection highlight (yellow border) on selected room in Room.draw()
  - Create room info panel in UIScene showing: type, occupants, income/expenses, status
  - Update panel when selection changes
- [ ] Ghost preview for room placement (cyan valid, magenta invalid)
  - Show semi-transparent room preview at cursor position during placement
  - Use Phaser.GameObjects.Graphics with alpha blending
  - Cyan (#4ae4e4) if placement valid, magenta (#e44a8a) if invalid
  - Update preview position on mouse move (pointermove handler)
  - Hide preview when no room selected
- [ ] Building height limit UI feedback (max 20 floors)
  - Add MAX_FLOORS = 20 constant to constants.ts
  - Check floor <= MAX_FLOORS in Building.addRoom()
  - Show error message if trying to place above max floor
  - Display current/max floors in UI (show highest floor + 1 / MAX_FLOORS)
- [ ] Sky lobby placement validation (required every 15 floors)
  - Add 'skylobby' room type to ROOM_SPECS first
  - Validate sky lobby on floors 15, 30, 45, 60, 75, 90 (every 15 floors)
  - Prevent building above floor 15 without sky lobby on floor 15
  - Show warning if missing required sky lobby (check before allowing placement)

**Time & Events System**
- [ ] Time event emission (hour-changed, day-changed, phase-changed)
  - Extend TimeSystem with Phaser.Events.EventEmitter (or use scene.events)
  - Track previousHour in TimeSystem.update()
  - Emit 'time:hour-changed' when hour changes (include { hour, previousHour })
  - Emit 'time:day-changed' when day rolls over (include { day, dayOfWeek })
  - Emit 'time:phase-changed' when day phase changes (dawn/day/dusk/night)
- [ ] Schedule events (wake-up 6 AM, work-start 9 AM, lunch 12 PM, work-end 5 PM, sleep 10 PM)
  - Track previous hour in TimeSystem (add private previousHour property)
  - Check hour transitions in TimeSystem.update()
  - Emit 'schedule:wake-up' at 6 AM (all days)
  - Emit 'schedule:work-start' at 9 AM (weekdays only, check isWeekend())
  - Emit 'schedule:lunch-start' at 12 PM (all days)
  - Emit 'schedule:lunch-end' at 1 PM (all days)
  - Emit 'schedule:work-end' at 5 PM (weekdays only)
  - Emit 'schedule:sleep' at 10 PM (all days)
- [ ] Day of week tracking (Monday-Sunday)
  - Add dayOfWeek property to TimeSystem (0=Sunday, 1=Monday, etc.)
  - Initialize to Monday (1) on game start
  - Increment on day change (wrap around: 6 → 0)
  - Add getDayOfWeek() method returning DayOfWeek enum
- [ ] Weekend detection (offices closed on weekends)
  - Add isWeekend() method to TimeSystem (returns dayOfWeek === 0 || dayOfWeek === 6)
  - Skip work events on weekends in schedule event emission
  - Update ResidentSystem to handle weekend behavior (no work on weekends)
- [ ] Day/night visual cycle (overlay based on time of day)
  - Add day/night overlay graphics in GameScene (Phaser.GameObjects.Rectangle with blend mode)
  - Update overlay opacity/color based on time of day in GameScene.update()
  - Phases: Night (10 PM-5 AM, dark blue), Dawn (5-7 AM, gradient), Day (7 AM-6 PM, no overlay), Dusk (6-8 PM, orange/purple), Evening (8-10 PM, dim)
- [ ] Game speed controls (pause, 1x, 2x, 4x) in UI
  - Add speed property to TimeSystem (1, 2, 4, or 0 for pause) - replace GAME_SPEED constant
  - Add isPaused property to TimeSystem
  - Add speed control buttons to UIScene (pause, 1x, 2x, 4x)
  - Update TimeSystem.update() to use speed multiplier (skip if paused)
  - Add setSpeed() and togglePause() methods to TimeSystem

### Medium Priority (Polish & Features)

**Resident Enhancements**
- [ ] Visual variety (color variations based on name hash, size variation ±4px)
- [ ] Resident traits (display only: Workaholic, Foodie, Night Owl, etc.)
- [ ] Adjacency conflict detection (offices → apartments stress)
- [ ] Overcrowding detection (>4 residents in apartment)

**Audio System**
- [ ] UI sound effects (button clicks, placement success/error)
- [ ] Money sounds (income chime, expense tone)
- [ ] Master volume control
- [ ] Mute toggle
- [ ] Audio settings persistence
- [ ] Elevator sounds (bell G4 pitch, doors, movement)
- [ ] Alert sounds (low food, bankruptcy)

**Time System Enhancements**
- [ ] Minute-level granularity (currently hour-only)
- [ ] Smooth visual transitions between day phases
- [ ] Dawn/dusk transition periods (5-7 AM, 6-8 PM)

### Low Priority (Post-MVP)

- [ ] Multiple elevator shafts (up to 6)
- [ ] Express elevators (skip floors)
- [ ] Room upgrades
- [ ] Statistics panel (population graph, income graph)
- [ ] Tutorial hints for new players
- [ ] Resident relationships
- [ ] Life events (birth, death, marriage)
- [ ] Export/import save files
- [ ] Save versioning and migration
- [ ] Colorblind mode options
- [ ] Text scaling options
- [ ] Minimap for large buildings
- [ ] Undo/redo for placements

## Completed

- [x] Project setup (Vite + Phaser + TypeScript)
- [x] Basic scene structure (Boot, Game, UI)
- [x] Building entity with floor/room management
- [x] Room placement system with overlap detection
- [x] Camera controls (pan, zoom)
- [x] Grid rendering
- [x] Room types: lobby, apartment, office, farm, kitchen
- [x] UI: Top bar (money, food, population, time)
- [x] UI: Build menu with room buttons
- [x] Time system (basic day/hour tracking)
- [x] Economy system (money tracking, room costs, daily income/expenses)
- [x] Resident entity with hunger and states
- [x] Resident spawning in apartments
- [x] Basic resident AI (idle, walking, working, eating, sleeping states)
- [x] Resource system (farms produce, kitchens process)
- [x] Food system integration (residents walk to kitchens and consume food)
- [x] Resident hunger drives behavior (find kitchen when hungry < 50)
- [x] Food consumption from ResourceSystem (1 processed food per meal)
- [x] Resident departure mechanics (leave after 24 game hours at hunger 0)
- [x] Visual feedback for hunger (color-coded green/orange/red)
- [x] Unit tests for EconomySystem and TimeSystem
- [x] Job assignment system (residents find jobs at offices)

## Discoveries

**Architecture:**
- Phaser Registry is good for cross-scene state sharing
- Vitest needs canvas mocks for any Phaser-related tests
- Room placement needs to account for grid alignment
- Residents currently teleport between floors (no pathfinding) - goToRoom() uses direct Y coordinate
- Time system lacks event emission for schedule-driven behaviors
- No menu system exists - game starts directly in GameScene from BootScene

**Code Issues:**
- Resident.goToRoom() directly sets targetY, bypassing floor-based pathfinding (line 208-214 in Resident.ts)
- TimeSystem has no event emitter - needs Phaser.Events.EventEmitter for schedule events
- No day-of-week tracking in TimeSystem (only tracks day number)
- EconomySystem.isBankrupt() exists but no game over trigger in GameScene.update()
- SaveData interface exists in types.ts but no SaveSystem.ts implementation
- ROOM_SPECS missing Fast Food and Restaurant types (only has lobby, apartment, office, farm, kitchen)
- Resident class missing stress property (spec requires 0-100 stress tracking)
- No elevator system files exist (ElevatorSystem.ts, ElevatorShaft, ElevatorCar classes missing)
- BootScene.create() directly starts GameScene (line 43) - no menu system
- GAME_SPEED constant in constants.ts (line 10) - should be mutable in TimeSystem
- No pause state in TimeSystem (isPaused property missing)
- Resident.updateWalking() uses direct Y movement (line 150-177) - no elevator integration
- No room click detection in GameScene.handleClick() (only handles placement)
- No ghost preview rendering in GameScene
- No keyboard input handlers in GameScene.setupInput() (only mouse/pointer)

**Spec vs Code Discrepancies:**
- Apartment capacity: Code=2 (constants.ts:38), Spec=4 (BUILDING.md:64) - need to align
- Apartment cost: Code=$5,000 (constants.ts:32), Spec=$2,000 (BUILDING.md:64) - need to align
- Farm cost: Code=$15,000 (constants.ts:52), Spec=$3,000 (BUILDING.md:66) - need to align
- Kitchen cost: Code=$10,000 (constants.ts:62), Spec=$2,500 (BUILDING.md:67) - need to align
- Office cost: Code=$8,000 (constants.ts:42), Spec=$8,000 (BUILDING.md:65) ✓ matches
- Office jobs: Code=4 (constants.ts:48), Spec=6 (BUILDING.md:65) - need to verify spec (spec says "6 workers" capacity)

## Blocked

(None fully blocked - all items have partial paths forward)

## Implementation Strategy

**Phase 1: Quick Wins (Immediate, No Dependencies)**
1. Fix spec discrepancies (room costs/capacities) - 5 minutes
2. Star rating calculation and display - 30 minutes
3. Victory/game over overlays - 1 hour
4. Pause functionality - 30 minutes
5. Speed controls - 1 hour
6. Ghost preview - 1 hour
7. Room demolition - 30 minutes
8. Keyboard shortcuts - 30 minutes

**Total Phase 1 Time: ~5 hours** - These can all be done in parallel or sequentially.

**Phase 2: Core Systems (Dependencies Identified)**
1. Time Events System (foundation for restaurants, schedules)
2. Restaurant System (depends on time events)
3. Menu System (entry point, pause menu, save/load UI)
4. Save/Load System (depends on menu system for UI)
5. Elevator/Pathfinding System (enables stress system)
6. Stress System (enables satisfaction/rent tiers)

**Phase 2b: Visual Polish (High Priority - Can Run in Parallel)**
- Graphics & Visuals (Venus atmosphere, day/night, neon lighting, parallax)
- UI/UX Enhancements (build menu polish, top bar, toast notifications)

**Phase 3: Audio & Minor Polish**
- Audio system
- Resident visual enhancements

## Dependencies

**Can Start Immediately (Parallel Tracks):**

Track A - Game Flow:
- Victory/Game Over overlays ← no deps
- Pause functionality ← TimeSystem only
- Speed controls ← TimeSystem + UIScene
- Star rating ← population count

Track B - Building:
- Ghost preview ← GameScene input
- Room demolition ← Building already has removeRoom
- Keyboard shortcuts ← input handling

Track C - Save/Load:
- Serialization ← most systems already have serialize()
- localStorage persistence ← SaveSystem.ts
- Save slot overlay ← no menu scene required, can use overlay

**Requires Prior Work:**

1. Elevator System (major):
   - Create ElevatorSystem.ts
   - Modify Resident.goToRoom() to use elevator
   - Then enables: elevator wait times → stress from waits

2. Restaurant Rooms (simpler):
   - Add room types to ROOM_SPECS ← no deps
   - Operating hours check ← TimeSystem.getHour() exists
   - Food consumption ← ResourceSystem exists
   - Income integration ← EconomySystem exists

3. Stress System:
   - Add stress property to Resident ← no deps
   - Basic stress (unemployment, hunger) ← no deps
   - Elevator wait stress ← needs elevator system

4. Satisfaction/Rent Tiers:
   - Needs stress system first

**Parallel Work Streams (High Priority):**
- Graphics/visuals - fully independent, HIGH PRIORITY
- UI/UX polish - mostly independent, HIGH PRIORITY
- Audio system - fully independent, lower priority

## Notes

**MVP Goals:**
- Victory condition: 2-star rating (300 population)
- Game over condition: Bankruptcy (-$10,000)
- Max building height: 20 floors for MVP

**Implementation Status:**
- Current implementation has basic systems but missing critical game flow
- Residents need proper pathfinding before stress system can track elevator waits
- Restaurant system is specified but not implemented in codebase
- Save/load has interface defined but no implementation
- Menu system completely missing - game has no entry point

**Priority Ordering Rationale:**
1. **Quick Wins** - Immediate value, no dependencies, improves playability
2. **Graphics & Visuals** - HIGH PRIORITY - Make it look great even with limited functionality
3. **UI/UX Polish** - HIGH PRIORITY - Polished interface improves perceived quality
4. **Time Events** - Foundation for restaurant hours, resident schedules, day/night cycle
5. **Restaurant System** - Core MVP feature, depends on time events
6. **Menu System** - Required for game to be playable (entry point, pause, save/load UI)
7. **Save/Load** - Depends on menu system for UI
8. **Elevator/Pathfinding** - Required for stress system and proper resident movement
9. **Stress System** - Required for satisfaction and rent tiers
10. **Audio** - Lower priority polish

**Note:** Quick wins should be completed first as they provide immediate value and require no dependencies. They can be done in any order or in parallel.

**Dependency Chain:**
- Menu System → Save/Load UI
- Time Events → Restaurant Hours → Restaurant System
- Elevator System → Pathfinding → Stress System (elevator waits)
- Stress System → Satisfaction → Rent Tiers → Economy Enhancements
