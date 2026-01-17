# Implementation Plan - Arcology MVP

> Prioritized task list for Arcology MVP. Updated after comprehensive code analysis.

**Last Updated:** Planning session - comprehensive codebase review against all specs

## Planning Session Findings

**Code Analysis Summary:**
- ✅ **Demolition system confirmed implemented** - 50% refund working (GameScene.ts:326-332, Building.removeRoom() exists)
- ✅ **Fast Food and Restaurant rooms confirmed** - Both in ROOM_SPECS (constants.ts:103-126) with correct specs
- ❌ **Sky lobbies missing** - Not in ROOM_SPECS, no elevator zone system, no pathfinding for zone transfers
- ❌ **Building height limit not enforced** - No MAX_FLOORS_MVP constant in constants.ts, no validation in Building.addRoom() or GameScene
- ❌ **Tenant types missing** - Resident class (Resident.ts:22-691) has no `type` field, all residents are residential tenants by default
- ❌ **Office worker lunch behavior missing** - No code in Resident.ts for office workers seeking Fast Food at 12 PM, no listener for `schedule:lunch-start` event
- ❌ **Audio system completely absent** - No AudioSystem class, no sound files, no audio asset loading in BootScene, only one comment in ElevatorSystem.ts about bell sound
- ⚠️ **Restaurant visual state unclear** - RestaurantSystem.isRestaurantOpen() tracks state (RestaurantSystem.ts:36-53) but Room.ts redraw() method does not check or display open/closed state visually
- ⚠️ **LLM review placeholder** - src/lib/llm-review.ts has TODO comment, 5 tests skipped in llm-review.test.ts

**Test Coverage Gaps:**
- Skipped tests in llm-review.test.ts (visual/subjective tests waiting for LLM implementation)
- Missing tests for Phase 0-2 features (will be added as features are implemented)

## Current Status Summary

**Major Systems Implemented:**
- ✅ Building system with room placement, overlap detection, demolition
- ✅ Time system with day/hour tracking, events, schedules, day-of-week
- ✅ Economy system with rent tiers, quarterly revenue, bankruptcy detection
- ✅ Resident system with hunger, stress, satisfaction, pathfinding via elevators
- ✅ Resource system (farms → kitchens → meals)
- ✅ Restaurant system (Fast Food, Fine Dining) with operating hours
- ✅ Elevator system with state machine, capacity, wait tracking
- ✅ Pathfinding system (residents use elevators for vertical travel)
- ✅ Save/Load system with auto-save, checksums, error handling
- ✅ Menu system (MainMenu, PauseMenu, Settings, LoadGame, SaveGame)
- ✅ UI components (Sidebar, TopBar, BuildMenu, RoomInfoPanel, EconomyBreakdown, Notifications)
- ✅ Graphics foundation (Venus atmosphere, day/night overlay, room visuals)
- ✅ Victory/Game Over overlays
- ✅ Notification system

**Critical Gaps Identified:**
- ❌ Sky lobbies not implemented (required every 15 floors per spec)
- ❌ Building height limit (20 floors MVP) not enforced
- ❌ Tenant type differentiation (Office Worker vs Residential Tenant)
- ❌ Office workers seeking Fast Food at lunch (12 PM)
- ❌ Audio system completely missing
- ❌ Resident visual variety (color palettes, size variation, traits display)
- ❌ Some spec acceptance criteria not fully met

## Priority Summary

**Phase 0 - Critical Missing Features (HIGHEST PRIORITY):**
1. Sky lobby system (required for floors 15+)
2. Building height limit enforcement (20 floors MVP)
3. Tenant type system (Office Worker vs Residential Tenant)
4. Office worker lunch behavior (seek Fast Food at 12 PM)

**Phase 1 - Audio System:**
1. UI sound effects
2. Money sounds
3. Alert sounds
4. Volume controls integration

**Phase 2 - Resident Polish:**
1. Visual variety (color palettes, size variation)
2. Traits system (display only)

**Phase 3 - Spec Compliance & Testing:**
1. Verify all acceptance criteria from specs
2. Add missing test coverage
3. Fix any remaining spec discrepancies

## Tasks

### Phase 0 - Critical Missing Features (HIGHEST PRIORITY)

**Sky Lobby System:**
- [ ] Add `skylobby` room type to ROOM_SPECS in `src/utils/constants.ts`
  - Cost: 2,000 CR
  - Width: 20 grid units
  - Valid floors: 15, 30, 45, 60, 75, 90 (every 15 floors)
  - Color: Match lobby styling (dark teal + cyan accent)
  - Add to ROOM_COLORS object
  - **Test:** Room can only be placed on valid sky lobby floors
  - **Test:** Room placement fails on invalid floors
- [ ] Implement elevator zone system in `src/systems/ElevatorSystem.ts`
  - Elevator shafts serve floors within zones (0-14, 15-29, 30-44, etc.)
  - Sky lobbies act as transfer points between zones
  - Update ElevatorShaft to track minFloor/maxFloor based on zone
  - **Test:** Elevator only serves floors within its zone
  - **Test:** Residents transfer at sky lobbies when crossing zones
- [ ] Update pathfinding for sky lobby transfers in `src/entities/Resident.ts`
  - Resident pathfinding: Walk → elevator → ride to sky lobby → exit → walk to next elevator → ride → walk to destination
  - Update `goToRoom()` method (Resident.ts:425-471) to handle zone crossings
  - **Test:** Resident traveling from floor 5 to floor 20 uses sky lobby at floor 15
  - **Test:** Resident traveling within same zone (0-14) doesn't use sky lobby
- [ ] Enforce sky lobby requirement for building height in `src/entities/Building.ts`
  - Prevent building above floor 14 without sky lobby on floor 15
  - Prevent building above floor 29 without sky lobby on floor 30
  - Show validation error when attempting to build above zone without sky lobby
  - Update `addRoom()` validation logic (Building.ts:17-58)
  - **Test:** Cannot place room on floor 15+ without sky lobby on floor 15
  - **Test:** Cannot place room on floor 30+ without sky lobby on floor 30
- [ ] Visual representation of sky lobbies in `src/entities/Room.ts`
  - Distinct from ground lobby (maybe different accent color or icon)
  - Show elevator zone boundaries visually (optional, nice-to-have)

**Building Height Limit:**
- [ ] Enforce 20-floor MVP limit in `src/utils/constants.ts` and `src/entities/Building.ts`
  - Add `MAX_FLOORS_MVP = 20` constant to constants.ts
  - Validate room placement: `floor < MAX_FLOORS_MVP` in Building.addRoom() (Building.ts:17-58)
  - Show error message when attempting to build above limit
  - **Test:** Cannot place room on floor 20 or above
  - **Test:** Error message displays when limit reached
- [ ] Update UI to show height limit in `src/ui/components/BuildMenu.ts`
  - Display "Max Floors: 20" in build menu or info panel
  - Show warning when approaching limit (e.g., floor 18+)

**Tenant Type System:**
- [ ] Add tenant type to Resident entity in `src/entities/Resident.ts`
  - Property: `type: 'office_worker' | 'resident'` (add to Resident class, default 'resident')
  - Office workers: Don't live in building, arrive in morning, leave in evening
  - Residential tenants: Live in apartments, may work in building or elsewhere
  - Update `serialize()` method (Resident.ts:662-672) to include type
  - **Test:** New residents spawn as 'resident' type by default
  - **Test:** Office workers can be created separately (future: spawn at offices)
- [ ] Implement office worker behavior in `src/systems/ResidentSystem.ts`
  - Arrive at 9 AM (weekdays only)
  - Leave at 5 PM (weekdays only)
  - Only need office space (no apartment required)
  - Affected by elevator congestion during rush hours
  - Listen to `schedule:work-start` and `schedule:work-end` events from TimeSystem
  - **Test:** Office workers arrive at 9 AM on weekdays
  - **Test:** Office workers leave at 5 PM on weekdays
  - **Test:** Office workers don't arrive on weekends
- [ ] Visual differentiation in `src/entities/Resident.ts` and `src/ui/components/RoomInfoPanel.ts`
  - Office workers: Different color or icon (optional, nice-to-have)
  - Show type in resident info panel

**Office Worker Lunch Behavior:**
- [ ] Implement lunch-seeking behavior for office workers in `src/entities/Resident.ts`
  - At 12 PM, office workers seek Fast Food restaurants
  - Use pathfinding to reach Fast Food room
  - Consume food and reduce hunger
  - Return to office after lunch
  - Listen to `schedule:lunch-start` event from TimeSystem
  - Update `updateIdle()` method (Resident.ts:206-244) to check for lunch time if type is 'office_worker'
  - **Test:** Office workers seek Fast Food at 12 PM
  - **Test:** Office workers consume food at Fast Food restaurants
  - **Test:** Office workers return to office after lunch

### Phase 1 - Audio System

**Audio System Foundation:**
- [ ] Create AudioSystem in `src/systems/AudioSystem.ts`
  - Use Phaser Sound system (WebAudio)
  - Manage sound categories (UI, AMBIENT, RESIDENT, ALERT, ELEVATOR, MONEY)
  - Volume control per category
  - Integration with SettingsScene volume sliders

**UI Sound Effects:**
- [ ] Button click sounds
  - Soft click sound on all button interactions
  - Integrate with UIManager button handlers
  - **Test:** Sound plays when clicking any UI button
  - **Test:** Sound respects master volume setting
- [ ] Room placement sounds
  - Success sound: Valid room placed
  - Error sound: Invalid placement attempt
  - Integrate with GameScene room placement logic
  - **Test:** Success sound plays on valid placement
  - **Test:** Error sound plays on invalid placement
- [ ] Menu open/close sounds
  - Whoosh/slide sound on menu open
  - Reverse whoosh on menu close
  - Integrate with menu scene transitions
  - **Test:** Sound plays when opening/closing menus

**Money Sounds:**
- [ ] Income chime
  - Cash register or coin sound on income received
  - Different sound for large income (>10k CR)
  - Integrate with EconomySystem daily processing
  - **Test:** Sound plays when daily income is processed
  - **Test:** Celebratory jingle plays for large income
- [ ] Expense tone
  - Softer descending tone on expenses
  - Integrate with EconomySystem daily processing
  - **Test:** Sound plays when expenses are processed

**Alert Sounds:**
- [ ] Low rations warning sound
  - Warning chime when rations < 100
  - Integrate with notification system
  - **Test:** Sound plays when low rations notification appears
- [ ] Starvation alert sound
  - Distress sound when resident at 0 hunger
  - Integrate with notification system
  - **Test:** Sound plays when starvation alert appears
- [ ] Bankruptcy warning sound
  - Urgent alarm when credits < -5,000 CR
  - Game over sting when credits < -10,000 CR
  - Integrate with EconomySystem and game over logic
  - **Test:** Warning sound plays at -5,000 CR
  - **Test:** Game over sting plays at bankruptcy

**Elevator Sounds:**
- [ ] Elevator bell on arrival (G4 pitch - 392 Hz)
  - Integrate with ElevatorSystem arrival events
  - **Test:** Bell plays when elevator arrives at floor

**Volume Controls Integration:**
- [ ] Connect SettingsScene volume sliders to AudioSystem
  - Master volume affects all sounds
  - UI volume affects button/placement sounds
  - Ambient volume affects background sounds (future)
  - Update `src/scenes/SettingsScene.ts` to control AudioSystem
  - **Test:** Volume sliders control sound levels
  - **Test:** Settings persist to localStorage
  - **Test:** Mute toggle silences all sounds

**Audio Asset Management:**
- [ ] Create audio asset loading system
  - Preload UI sounds during BootScene
  - Lazy-load other sounds as needed
  - Use Phaser Sound system (WebAudio)
  - **Test:** Sounds load without blocking game start
  - **Test:** Sounds play without performance issues

### Phase 2 - Resident Polish

**Visual Variety:**
- [ ] Color palette system in `src/entities/Resident.ts`
  - Generate 4-8 color palettes based on resident name hash
  - Apply palette to resident silhouette
  - Update `drawSilhouette()` method (Resident.ts:152-192) to use palette colors
  - **Test:** Residents have varied colors based on name
  - **Test:** Same name always produces same color
- [ ] Size variation in `src/entities/Resident.ts`
  - Random size variation: ±4px height
  - Store size in resident data
  - Update `drawSilhouette()` method to use size variation
  - **Test:** Residents have varied sizes
  - **Test:** Size is consistent for same resident

**Traits System (Display Only):**
- [ ] Add traits to Resident entity in `src/entities/Resident.ts`
  - Property: `traits: string[]`
  - Possible traits: Workaholic, Foodie, Night Owl, Early Bird, Social, Introvert
  - Assign 1-2 traits per resident based on name hash
  - Update `serialize()` method to include traits
  - **Test:** Residents have 1-2 traits assigned
  - **Test:** Traits are consistent for same resident
- [ ] Display traits in UI in `src/ui/components/RoomInfoPanel.ts`
  - Show traits in RoomInfoPanel when resident selected
  - Show traits in resident info tooltip (optional)
  - **Test:** Traits display in resident info panel

### Phase 3 - Spec Compliance & Testing

**Verify Acceptance Criteria:**
- [ ] Review BUILDING.md acceptance criteria
  - [x] Can place rooms on the grid (✅ implemented)
  - [x] Rooms cannot overlap (✅ implemented)
  - [x] Floor constraints are enforced (✅ implemented)
  - [x] Room costs are deducted from money (✅ implemented)
  - [x] Rooms can be demolished (refund partial cost) (✅ implemented - GameScene.ts:326-332, refunds 50%)
  - [ ] Sky lobbies can be placed on required floors (❌ missing - Phase 0)
  - [ ] Building height limited to 20 floors (MVP) (❌ missing - Phase 0)
  - [x] Fast Food rooms can be placed (✅ implemented in ROOM_SPECS)
  - [x] Restaurant rooms can be placed (✅ implemented in ROOM_SPECS)
  - [ ] Elevators only serve floors within lobby zones (pending sky lobby implementation)
- [ ] Review RESIDENTS.md acceptance criteria
  - [x] Residents spawn in apartments (✅ implemented)
  - [x] Hunger decreases over time (✅ implemented)
  - [x] Visual color coding for hunger (✅ implemented)
  - [x] Basic state machine (IDLE, WALKING) (✅ implemented - full state machine)
  - [x] Residents consume food from kitchens (✅ implemented)
  - [x] Residents leave when starving too long (✅ implemented - 24h at hunger 0)
  - [x] Residents find and take jobs (✅ implemented)
  - [x] Stress system implemented (✅ implemented - 0-100 scale)
  - [ ] Tenant types differentiated (❌ missing - Phase 0, Resident class has no `type` field)
  - [x] Adjacency conflicts cause stress (✅ implemented - Resident.ts:579)
  - [x] Stress-based leaving condition (✅ implemented - >80 for 48h)
  - [x] Elevator congestion affects stress (✅ implemented)
  - [ ] Visual variety (❌ missing - Phase 2, no color palette system)
  - [ ] Size variation (❌ missing - Phase 2, no size variation)
  - [ ] Traits assigned (❌ missing - Phase 2, no traits property)
- [ ] Review FOOD_SYSTEM.md acceptance criteria
  - [ ] Fast Food restaurant can be built (✅ already implemented)
  - [ ] Fine Dining restaurant can be built (✅ already implemented)
  - [ ] Fast Food operates 11 AM - 2 PM and 5 PM - 7 PM (✅ already implemented)
  - [ ] Fine Dining operates 6 PM - 11 PM only (✅ already implemented)
  - [ ] Restaurants consume processed food from kitchens (✅ already implemented)
  - [ ] Office workers seek Fast Food at lunch time (❌ missing - Phase 0)
  - [ ] Evaluation system calculates restaurant score (✅ already implemented)
  - [ ] Restaurant income scales with evaluation score (✅ already implemented)
  - [ ] Restaurants show open/closed state visually (⚠️ RestaurantSystem tracks isOpen via isRestaurantOpen() but Room.ts redraw() does not check or display state - Phase 3)
- [ ] Review ELEVATORS.md acceptance criteria
  - [ ] Elevator shaft created when Lobby is built (✅ already implemented)
  - [ ] Residents can call elevator from any floor (✅ already implemented)
  - [ ] Elevator moves at 2 seconds per floor (✅ already implemented)
  - [ ] Door open/close animations play (✅ already implemented)
  - [ ] Bell sound plays on arrival (❌ missing - Phase 1 audio)
  - [ ] Multiple residents can share elevator (✅ already implemented)
  - [ ] Queue system handles multiple calls (✅ already implemented)
  - [ ] Wait times tracked and affect resident stress (✅ already implemented)
  - [ ] Visual indicator shows elevator position (✅ already implemented)
- [ ] Review ECONOMY.md acceptance criteria
  - [ ] Bankruptcy detection and game over (✅ already implemented)
  - [ ] Income/expense breakdown in UI (✅ already implemented)
  - [ ] Star rating system with population milestones (✅ already implemented)
  - [ ] 2-star MVP victory condition at 300 population (✅ already implemented)
  - [ ] Rent pricing tiers based on satisfaction (✅ already implemented)
  - [ ] Tenant satisfaction calculation (✅ already implemented)
  - [ ] Quarterly office revenue (✅ already implemented)
  - [ ] Fast Food and Restaurant income (✅ already implemented)
  - [ ] Fast Food and Restaurant maintenance costs (✅ already implemented)
- [ ] Review UI_UX.md acceptance criteria
  - [ ] Top bar shows credits, rations, residents, time, stars (✅ already implemented)
  - [ ] Left sidebar with navigation (✅ already implemented)
  - [ ] Build Zone menu with all room types (✅ already implemented)
  - [ ] Camera pan with right-click drag (✅ already implemented)
  - [ ] Camera zoom with scroll wheel (✅ already implemented)
  - [ ] Ghost preview during placement (✅ already implemented)
  - [ ] Cyan/magenta validity feedback (✅ already implemented)
  - [ ] Room selection with info display (✅ already implemented)
  - [ ] Time speed controls (✅ already implemented)
  - [ ] Keyboard shortcuts functional (✅ already implemented)
  - [ ] ESC opens pause menu (✅ already implemented)
  - [ ] Scanline overlay visible (✅ already implemented)
  - [ ] Glass panel styling on all UI elements (✅ already implemented)
  - [ ] Glitch hover effects on buttons (✅ already implemented)
- [ ] Review MENUS.md acceptance criteria
  - [ ] Main menu displays on game launch (✅ already implemented)
  - [ ] New Game starts fresh gameplay (✅ already implemented)
  - [ ] Continue loads auto-save (✅ already implemented)
  - [ ] Load Game shows save slot selection (✅ already implemented)
  - [ ] ESC key opens pause menu (✅ already implemented)
  - [ ] Resume returns to gameplay (✅ already implemented)
  - [ ] Save Game allows selecting save slot (✅ already implemented)
  - [ ] Settings menu has volume sliders (✅ already implemented)
  - [ ] Settings menu has game speed toggle (✅ already implemented)
  - [ ] Settings persist between sessions (✅ already implemented)
  - [ ] Game Over triggers at money < -$10,000 (✅ already implemented)
  - [ ] Victory triggers at population >= 300 (✅ already implemented)
- [ ] Review SAVE_LOAD.md acceptance criteria
  - [ ] Player can save game to any of 3 manual slots (✅ already implemented)
  - [ ] Player can load game from any non-empty slot (✅ already implemented)
  - [ ] Auto-save triggers every 5 game days (✅ already implemented)
  - [ ] Save includes complete building state (✅ already implemented)
  - [ ] Save includes all resident data (✅ already implemented)
  - [ ] Save includes economy data (✅ already implemented)
  - [ ] Save includes time data (✅ already implemented)
  - [ ] Save includes settings (✅ already implemented)
  - [ ] Loading a save restores game to exact saved state (✅ already implemented)
  - [ ] Corrupted saves are detected and handled gracefully (✅ already implemented)
  - [ ] Player sees error message when load fails (✅ already implemented)
  - [ ] "New Game" clears current state (✅ already implemented)
  - [ ] Save slot UI shows timestamp and preview info (✅ already implemented)
  - [ ] Game pauses briefly during save/load operations (✅ already implemented)
  - [ ] Overwriting existing save requires confirmation (✅ already implemented)
- [ ] Review AUDIO.md acceptance criteria
  - [ ] UI click sounds on all buttons (❌ missing - Phase 1)
  - [ ] Placement success/error audio feedback (❌ missing - Phase 1)
  - [ ] Money gain/loss sounds trigger correctly (❌ missing - Phase 1)
  - [ ] Master volume control functional (❌ missing - Phase 1)
  - [ ] Mute toggle works (❌ missing - Phase 1)
  - [ ] Volume settings persist between sessions (❌ missing - Phase 1)
  - [ ] At least one ambient sound per room type (deferred to post-MVP)
  - [ ] Elevator bell plays at G4 pitch (❌ missing - Phase 1)
  - [ ] Alert sounds play for low food and bankruptcy warnings (❌ missing - Phase 1)
  - [ ] Audio does not cause performance issues (❌ missing - Phase 1)

**Fix TypeScript Errors (BLOCKING):**
- [ ] Fix unused parameters in `src/entities/Resident.ts` (6 errors)
  - Remove or prefix with `_` unused `delta` and `waitTime` parameters
- [ ] Fix unused parameters in `src/lib/llm-review.ts` (2 errors)
  - Remove or use `criteria` and `intelligence` parameters
- [ ] Fix variable redeclarations in `src/scenes/GameScene.ts` (2 errors)
  - Rename duplicate `loadSaveSlot` variables
- [ ] Fix unused imports/variables in scene files
  - LoadGameScene.ts, MainMenuScene.ts, SaveGameScene.ts
- [ ] Fix type errors in `src/systems/EconomySystem.test.ts`
  - Fix mock GameScene type issues
  - Fix Room parameter type errors
- [ ] Fix private property access in `src/systems/ElevatorSystem.test.ts`
  - Make properties public for testing or add test helpers
- [ ] Fix unused imports in `src/systems/ElevatorSystem.ts`

**Add Missing Test Coverage:**

**High Priority (Core Systems):**
- [ ] Test ResidentSystem (`src/systems/ResidentSystem.test.ts`)
  - Test resident spawning in apartments
  - Test move-out conditions (starvation, stress)
  - Test job assignment
  - Test resident updates
- [ ] Test ResourceSystem (`src/systems/ResourceSystem.test.ts`)
  - Test farm food production
  - Test kitchen food processing
  - Test food consumption
  - Test food chain (farm → kitchen → processed)
- [ ] Test Building entity (`src/entities/Building.test.ts`)
  - Test room placement with overlap detection
  - Test floor constraints
  - Test room removal/demolition
  - Test room queries (getApartments, getOffices, etc.)
- [ ] Test Resident entity (`src/entities/Resident.test.ts`)
  - Test state machine transitions
  - Test hunger decay
  - Test stress accumulation
  - Test pathfinding (goToRoom)
  - Test satisfaction calculation
  - Test leaving conditions

**Medium Priority (UI & Scenes):**
- [ ] Test Room entity (`src/entities/Room.test.ts`)
  - Test visual rendering
  - Test capacity management
  - Test resident/worker tracking
- [ ] Test UI components (unit tests)
  - TopBar, Sidebar, BuildMenu, RoomInfoPanel, etc.
- [ ] Test Scenes (integration tests)
  - GameScene room placement flow
  - Menu navigation
  - Settings persistence
- [ ] Visual/UI acceptance criteria tests (browser/screenshot)
  - Top bar visual appearance
  - Sidebar collapsible behavior
  - Ghost preview (cyan/magenta feedback)
  - Room selection visual feedback
  - Scanline overlay visibility
  - Glass panel styling
  - Glitch hover effects
  - Camera controls
  - Day/night visual transitions
  - **Note:** Requires browser testing setup (Playwright/Puppeteer) and LLM review pattern implementation

**Future Features (When Implemented):**
- [ ] Test sky lobby system (when implemented)
  - Test room placement on valid/invalid floors
  - Test elevator zone boundaries
  - Test pathfinding with sky lobby transfers
  - Test sky lobby requirement enforcement
- [ ] Test building height limit enforcement (when implemented)
  - Test room placement fails at floor 20+
  - Test error message displays correctly
  - Test UI warning when approaching limit
- [ ] Test tenant type system (when implemented)
  - Test default type assignment
  - Test office worker arrival/departure schedules
  - Test office worker behavior differences
- [ ] Test office worker lunch behavior (when implemented)
  - Test Fast Food seeking at 12 PM
  - Test food consumption at restaurants
  - Test return to office after lunch
- [ ] Test audio system (when implemented)
  - Test sound playback for all categories
  - Test volume controls
  - Test mute toggle
  - Test performance (concurrent sound limits)
- [ ] Test resident visual variety (when implemented)
  - Test color palette generation from name hash
  - Test size variation
  - Test consistency (same name = same appearance)
- [ ] Test traits system (when implemented)
  - Test trait assignment (1-2 per resident)
  - Test trait consistency
  - Test trait display in UI
- [ ] Test restaurant open/closed visual state
  - Test visual indicator updates
  - Test state changes with operating hours
- [ ] Integration tests for complex scenarios
  - Resident pathfinding with sky lobbies
  - Office worker daily cycle (arrive → work → lunch → work → leave)
  - Multi-zone elevator transfers
  - Restaurant evaluation with multiple factors

**Fix Remaining Spec Discrepancies:**
- [x] All spec discrepancies in constants.ts have been fixed
- [ ] Verify no remaining terminology issues (Money vs Credits, Food vs Rations)
  - Codebase uses "Credits" (CR) and "Rations" consistently
  - **Test:** Verify UI text matches spec terminology
- [ ] Restaurant open/closed visual state
  - RestaurantSystem tracks `isOpen` via `isRestaurantOpen()` method (✅ implemented in RestaurantSystem.ts:36-53)
  - Room rendering does NOT visually indicate open/closed state (❌ Room.ts:51-107 draw() method does not check RestaurantSystem)
  - Update Room.ts `redraw()` method to check RestaurantSystem for open/closed state
  - Room needs reference to RestaurantSystem (pass via constructor or scene reference)
  - Apply visual styling based on `restaurantSystem.isRestaurantOpen(room)` (e.g., dimmed appearance when closed, "OPEN"/"CLOSED" label, or accent color variation)
  - **Test:** Restaurant rooms show visual indicator when open vs closed
  - **Test:** Visual state updates when operating hours change
  - **Test:** Fast Food shows open during 11-2 PM and 5-7 PM, closed otherwise
  - **Test:** Restaurant shows open during 6-11 PM, closed otherwise

## Completed Features

**Infrastructure:**
- [x] Project setup (Vite + Phaser + TypeScript)
- [x] Scene structure (BootScene, GameScene, UIScene)
- [x] Unit tests for core systems (EconomySystem, TimeSystem, ElevatorSystem, RestaurantSystem, SaveSystem)

**Building System:**
- [x] Building entity with floor/room management
- [x] Room placement with overlap detection
- [x] Grid rendering (64px units)
- [x] Room types: lobby, apartment, office, farm, kitchen, fastfood, restaurant
- [x] Room demolition with 50% refund
- [x] Building.removeRoom() method

**Graphics Foundation:**
- [x] Venus atmosphere background (`src/graphics/VenusAtmosphere.ts`)
- [x] Day/night overlay (`src/graphics/DayNightOverlay.ts`)
- [x] Room neon accent lighting with night glow
- [x] Scanline overlay (CSS)
- [x] Grid pattern overlay

**UI System:**
- [x] Top bar (Credits, Rations, Residents, Time, Star Rating, Satisfaction)
- [x] Left sidebar navigation (collapsible, VENUS_OS branding)
- [x] Build Zone menu with all room types
- [x] Camera controls (right-click pan, scroll zoom)
- [x] Glass panel CSS styling
- [x] Ghost preview for room placement
- [x] Room selection & info panel
- [x] Economy breakdown panel
- [x] Notification system
- [x] Glitch hover effects
- [x] Typography system (Space Grotesk, Material Symbols)

**Menu System:**
- [x] MainMenuScene with New Game, Continue, Load Game, Settings
- [x] PauseMenuScene triggered by ESC key
- [x] SettingsScene with volume sliders and game speed preference
- [x] LoadGameScene and SaveGameScene with full UI
- [x] GameState enum for state management
- [x] BootScene now starts MainMenuScene instead of GameScene

**Time & Economy:**
- [x] Time system (day/hour/minute tracking, formatted display)
- [x] Day of week tracking with weekend detection
- [x] Time events system (hour-changed, day-changed, phase-changed, schedule events)
- [x] Day phase detection (Night, Dawn, Day, Dusk, Evening)
- [x] Economy system (money, daily income/expenses, bankruptcy detection)
- [x] Daily economy processing (income from apartments/offices/restaurants, maintenance)
- [x] Quarterly office revenue (1000 CR per employee every 90 days)
- [x] Satisfaction-based rent tiers
- [x] Building-wide satisfaction calculation

**Residents:**
- [x] Resident entity with state machine (IDLE→WALKING→WORKING/EATING/SLEEPING)
- [x] Resident spawning in apartments with capacity check
- [x] Hunger system (decay over time, color-coded visual feedback)
- [x] Stress system (0-100 scale with accumulation and relief)
- [x] Satisfaction calculation (100 - stress - hungerPenalty + bonuses)
- [x] Food-seeking behavior (find kitchen when hungry < 50)
- [x] Starvation departure (leave after 24h at hunger 0)
- [x] Stress-based departure (leave after 48h at stress >80)
- [x] Job assignment system (residents work at offices)
- [x] Adjacency stress (apartments adjacent to offices: +2 stress/hour)
- [x] Pathfinding system (walk → elevator → ride → walk sequence)

**Resources:**
- [x] Resource system (farms produce raw food, kitchens process to meals)
- [x] Food consumption from ResourceSystem (1 meal per eating action)

**Restaurant System:**
- [x] Fast Food and Fine Dining room types
- [x] Operating hours (Fast Food: 11-2, 5-7; Restaurant: 6-11 PM)
- [x] Food consumption tracking
- [x] Evaluation score system (0-100 based on food availability)
- [x] Income calculation (base × evaluation_score / 100)
- [x] Integration with EconomySystem

**Elevator System:**
- [x] ElevatorShaft and ElevatorCar classes
- [x] State machine (IDLE → DOORS_OPENING → LOADING → DOORS_CLOSING → MOVING)
- [x] FIFO call queue
- [x] Capacity: 8 passengers
- [x] Speed: 2 seconds per floor
- [x] Visual representation with floor number display
- [x] Door open/close animations
- [x] Wait time tracking for stress system

**Save/Load System:**
- [x] SaveSystem with JSON serialization
- [x] Auto-save every 5 game days
- [x] Manual save slots (3 slots)
- [x] Checksum validation
- [x] Error handling (corrupted saves, storage quota)
- [x] Save slot UI with previews
- [x] Complete state persistence (building, residents, economy, time, resources, settings)

**Game State:**
- [x] Star rating system (1 star at 100 pop, 2 stars at 300 pop)
- [x] Victory overlay (population >= 300)
- [x] Game Over overlay (credits < -10,000 CR)
- [x] Pause system with speed controls (1x, 2x, 4x)
- [x] Keyboard shortcuts (1-7, Q, Delete, Space, ESC)

## Architecture Notes

**Patterns Used:**
- Phaser Registry for cross-scene state sharing (GameScene ↔ UIScene)
- Systems pattern: TimeSystem, EconomySystem, ResidentSystem, ResourceSystem, RestaurantSystem, ElevatorSystem, SaveSystem
- Entity hierarchy: Building → Floor → Room, Residents reference Rooms
- Vitest with canvas mocks for Phaser testing
- HTML/CSS UI overlay (UIManager) separate from Phaser scenes

**Known Technical Debt:**
- GAME_SPEED constant exists but TimeSystem.speed is mutable (minor inconsistency)
- Sky lobby system not implemented (pathfinding works for floors 0-14, sky lobbies needed for floors 15+)
- Building height limit not enforced (no MAX_FLOORS_MVP constant, no validation in Building.addRoom or GameScene)
- Audio system completely missing (Phase 1 priority - no AudioSystem class, no sound files, no audio asset loading)
- Tenant type differentiation missing (Phase 0 priority - Resident class has no `type` field, all residents are residential tenants)
- Office worker lunch behavior missing (Phase 0 priority - no code for office workers seeking fast food at 12 PM)
- Resident visual variety missing (Phase 2 - no color palette or size variation system, all residents look identical except hunger color)
- Restaurant open/closed visual state may not be displayed (RestaurantSystem tracks `isOpen` via `isRestaurantOpen()` but Room.ts rendering may not visually indicate state)
- LLM review system placeholder (src/lib/llm-review.ts has TODO for actual LLM integration)
- Skipped tests in llm-review.test.ts (5 visual/subjective tests skipped - waiting for LLM review implementation)

## Dependency Graph

```
Phase 0 (Critical Missing Features)
├── Sky Lobby System ──→ Elevator Zones ──→ Pathfinding Updates
├── Building Height Limit (independent)
├── Tenant Type System ──→ Office Worker Behavior
└── Office Worker Lunch Behavior (depends on Tenant Type System)
         │
         ↓
Phase 1 (Audio System) - Independent
         │
         ↓
Phase 2 (Resident Polish) - Independent
         │
         ↓
Phase 3 (Spec Compliance & Testing)
```

**Parallel Work Possible:**
- Phase 0 tasks can be worked on in parallel (sky lobbies, height limit, tenant types)
- Phase 1 (Audio) is fully independent
- Phase 2 (Resident Polish) is fully independent
- Phase 3 (Testing) depends on Phase 0 completion

## MVP Goals Status

| Goal | Metric | Current Status |
|------|--------|----------------|
| Victory | 300 population (2 stars) | ✅ Implemented |
| Game Over | -10,000 CR bankruptcy | ✅ Implemented |
| Building Height | 20 floors max | ❌ Not enforced (Phase 0) |
| Playable | Menu → Game → Save | ✅ Implemented |
| Visual Polish | Graphics & UI complete | ✅ Mostly complete |
| Sky Lobbies | Required every 15 floors | ❌ Not implemented (Phase 0) |
| Audio | Sound effects and alerts | ❌ Not implemented (Phase 1) |

## Validation Status

**Current Status:** ❌ **VALIDATION FAILS**

**TypeScript Errors:** ~40 errors blocking validation
- Unused parameters in Resident.ts, llm-review.ts
- Variable redeclarations in GameScene.ts
- Type errors in test mocks (EconomySystem.test.ts, ElevatorSystem.test.ts)
- Private property access in tests

**Test Coverage Gaps:**
- ❌ ResidentSystem - No tests (HIGH priority)
- ❌ ResourceSystem - No tests (HIGH priority)
- ❌ Building/Room/Resident entities - No tests (MEDIUM priority)
- ❌ All UI components - No tests (MEDIUM priority)
- ❌ All Scenes - No tests (MEDIUM priority)
- ❌ Visual/UI acceptance criteria - No browser/screenshot tests (HIGH priority per PROMPT_build.md)

## Next Actions

**Immediate Priority (Blocking):**
1. Fix TypeScript errors to unblock validation
2. Add tests for ResidentSystem (core gameplay system)
3. Add tests for ResourceSystem (food chain)
4. Add tests for Building/Room (placement logic)

**Phase 0 - Critical Missing Features:**
1. Implement sky lobby system (room type, elevator zones, pathfinding updates)
2. Enforce building height limit (20 floors MVP)
3. Implement tenant type system (Office Worker vs Residential Tenant)
4. Implement office worker lunch behavior (seek Fast Food at 12 PM)

**After Phase 0:**
1. Implement audio system (Phase 1)
2. Add resident visual variety (Phase 2)
3. Complete spec compliance verification and testing (Phase 3)
4. Add visual/browser tests for UI acceptance criteria (per PROMPT_build.md requirement)
