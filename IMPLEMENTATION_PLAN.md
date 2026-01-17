# Implementation Plan - Graphics & UI Priority

> Prioritized task list for Arcology MVP. Graphics and UI/UX are now HIGHEST PRIORITY.

## Current Focus

**Visual Polish & UI Priority:** Make it look amazing with cyberpunk Venus colony aesthetic. All graphics and UI work should be completed first to establish the visual identity.

## Priority Summary

**Phase 0 - Graphics Foundation (HIGHEST PRIORITY):**
1. Complete Venus atmosphere background (amber-pink gradient, parallax clouds)
2. Day/night visual cycle overlay (dawn/day/dusk/night transitions)
3. Room neon accent lighting (cyberpunk aesthetic per room type)
4. Scanline overlay (CRT effect)
5. Grid pattern overlay (subtle dot grid)

**Phase 1 - UI/UX Complete Redesign (HIGHEST PRIORITY):**
1. Left sidebar navigation (collapsible, VENUS_OS branding)
2. Top bar redesign (Credits, Rations, Residents, Time, Star Rating)
3. Build Zone menu polish (neon accents, hover states, glitch effects)
4. Glass panel styling (backdrop blur, borders, shadows)
5. Typography system (Space Grotesk, Material Symbols)
6. Color system implementation (cyan primary, magenta secondary)
7. Ghost preview for room placement (cyan valid, magenta invalid)
8. Room selection highlight (electric yellow border)

**Phase 2 - Quick Wins (No Dependencies):**
1. Fix spec discrepancies (5 constants updates - 5 minutes)
2. Star rating calculation & display
3. Victory/Game Over overlays
4. Pause functionality (Space key + isPaused state)
5. Time speed controls (1x, 2x, 4x) in UI
6. Room demolition with refund (50%)
7. Keyboard shortcuts (1-7, Q, Delete, ESC, Space)
8. Room selection & info panel

**Phase 3 - Core Systems (Foundation):**
1. Time Events System (enables restaurants, schedules, day/night logic)
2. Day of week tracking (enables weekend behavior)
3. Restaurant System (Fast Food, Fine Dining room types)
4. Menu System (MainMenuScene, PauseMenuScene, SettingsScene)
5. Save/Load System (depends on menu system for UI)

**Phase 4 - Major Features (Dependencies Required):**
1. Elevator System (enables proper pathfinding)
2. Pathfinding System (depends on elevators)
3. Stress System (depends on pathfinding for elevator waits)
4. Satisfaction/Rent Tiers (depends on stress system)

**Phase 5 - Audio & Final Polish:**
1. UI sound effects (button clicks, placement sounds)
2. Money sounds (income chime, expense tone)
3. Alert sounds (low food, bankruptcy warning)
4. Ambient audio (optional)

## Code Analysis Summary

**Already Implemented:**
- Venus atmosphere background (`src/graphics/VenusAtmosphere.ts`)
- Day/night overlay (`src/graphics/DayNightOverlay.ts`)
- Basic UI structure (`src/ui/UIManager.ts`, `src/ui/components/TopBar.ts`)
- Building system with overlap detection
- Time system with day/hour tracking
- Economy system with bankruptcy at -$10,000
- Resident state machine: IDLE→WALKING→WORKING/EATING/SLEEPING
- Resource system: farms→raw food→kitchens→meals
- Room types: lobby, apartment, office, farm, kitchen

**Missing Critical Features:**
- Left sidebar navigation (completely missing)
- UI terminology updates (Money→Credits, Food→Rations, Population→Residents)
- Scanline overlay (CSS exists but not applied)
- Grid pattern overlay
- Glitch hover effects
- Room neon accent lighting (colors defined but not applied to rooms)
- Ghost preview for placement
- Room selection & info panel
- Star rating calculation & display
- Victory/Game Over screens
- Pause functionality
- Time speed controls UI
- Room demolition UI
- Keyboard shortcuts
- Menu system (BootScene goes directly to GameScene)
- Save/Load system
- Elevator system
- Pathfinding (Resident.goToRoom() teleports)
- Restaurant room types (Fast Food, Fine Dining not in ROOM_SPECS)
- Stress system
- Time events (TimeSystem has no EventEmitter)

**Spec Discrepancies (Verified - All in `src/utils/constants.ts`):**
- Apartment capacity: 2 → 4 (line 66)
- Apartment cost: $5,000 → $2,000 (line 59)
- Farm cost: $15,000 → $3,000 (line 81)
- Kitchen cost: $10,000 → $2,500 (line 92)
- Office jobs: 4 → 6 (line 77)

## Tasks

### Phase 0 - Graphics Foundation (HIGHEST PRIORITY)

**Venus Atmosphere & Day/Night:**
- [ ] Enhance Venus atmosphere background
  - Verify amber-pink gradient matches spec: #e8a87c → #d4726a (day), #4a3a5a → #1a1a2a (night)
  - Add parallax cloud layers for depth (already implemented, verify)
  - Position behind building at z-depth 0
- [ ] Enhance day/night overlay system
  - Night (10 PM-5 AM): Dark blue overlay with room interior lights
  - Dawn (5-7 AM): Gradient from dark to warm
  - Day (7 AM-6 PM): No overlay, full brightness
  - Dusk (6-8 PM): Orange/purple gradient
  - Use Phaser.GameObjects.Rectangle with blend mode (already implemented, verify)
- [x] Add scanline overlay
  - Create scanline CSS class (already in ui.css)
  - Apply to UI overlay container
  - Opacity: 20-30%
- [x] Add grid pattern overlay
  - Subtle dot grid: rgba(0, 204, 170, 0.05)
  - Size: 24px × 24px
  - Optional line grid for build mode

**Room Visual Polish:**
- [ ] Add neon accent lighting to rooms
  - Room colors from GRAPHICS.md spec
  - Glow effects during night hours
  - Accent borders on each room type
  - Interior detail silhouettes (furniture, equipment)

### Phase 1 - UI/UX Complete Redesign (HIGHEST PRIORITY)

**Left Sidebar Navigation:**
- [x] Create Sidebar component (`src/ui/components/Sidebar.ts`)
  - Collapsible (72px expanded, 20px collapsed)
  - Brand header: "VENUS_OS" with version badge "TOWER_04 // ALPHA"
  - Section header: "COMMAND" or "TOWER OPS"
  - Navigation buttons: Sector View, Build Zone, Energy Grid, Economy, Heat Map, Alerts
  - Active state: Primary cyan glow with border
  - Hover: Glitch animation effect
  - Collapse toggle button
  - Overseer profile at bottom
- [x] Integrate sidebar into UIManager
  - Add to UI overlay
  - Handle collapse/expand state
  - Wire up navigation actions

**Top Bar Redesign:**
- [x] Update TopBar component terminology
  - Money → Credits (display as "12,500 CR")
  - Food → Rations (display as "Rations: 450")
  - Population → Residents (display as "Residents: 45")
  - Day → Cycle or Sol (display as "Cycle 5" or "Sol 5")
- [x] Add VENUS_OS branding
  - Brand text: "VENUS_OS v4.2" or "TOWER_04 // ALPHA"
  - Version badge styling
- [ ] Add additional top bar elements
  - Ext-Temp display (optional): "Ext-Temp: 462°C"
  - System Override button
  - Settings icon button
  - Alerts icon with badge count
- [x] Update styling to match glass panel spec
  - Backdrop blur: 12px
  - Border: rgba(39, 58, 55, 0.8)
  - Box shadow: 0 4px 30px rgba(0, 0, 0, 0.5)

**Build Zone Menu Polish:**
- [x] Update BuildMenu component
  - Rename to "Build Zone" in UI
  - Update room button styling with neon accents
  - Add glitch hover effects
  - Improve hover states with brightness increase
  - Selection highlight (electric yellow #e4e44a)
  - Update cost display to use "CR" instead of "$"
- [ ] Enhance speed controls
  - Better visual styling
  - Active state highlighting
  - Tooltips on hover

**UI Visual Effects:**
- [x] Apply glass panel styling to all UI elements
  - Background: rgba(24, 36, 34, 0.85)
  - Backdrop filter: blur(12px)
  - Border: 1px solid rgba(39, 58, 55, 0.8)
  - Box shadow: 0 4px 30px rgba(0, 0, 0, 0.5)
- [x] Implement glitch hover effects
  - CSS animation for button hovers
  - Color shift: cyan → magenta → yellow
  - Duration: 0.3s cubic-bezier
- [x] Add neon glow effects
  - Primary cyan: 0 0 15px rgba(0, 204, 170, 0.3)
  - Secondary magenta: 0 0 15px rgba(255, 0, 170, 0.3)
  - Text glow: text-shadow: 0 0 10px currentColor
- [x] Update typography
  - Ensure Space Grotesk is loaded
  - Material Symbols for icons
  - Monospace for technical displays

**Ghost Preview & Selection:**
- [x] Implement ghost preview for placement
  - Add `pointermove` handler in GameScene
  - Draw semi-transparent rectangle at grid-snapped cursor position
  - Cyan (#4ae4e4) = valid, Magenta (#e44a8a) = invalid
  - Use `Building.hasOverlap()` for validation
  - Hide when no room type selected
- [x] Room selection & info panel
  - Click on room when no placement active → select room
  - Store `selectedRoomId` in registry
  - Draw yellow border on selected room
  - Show info panel: type, residents/workers, income/expenses (basic selection implemented, info panel pending)

### Phase 2 - Quick Wins (No Dependencies)

**Spec Alignment (5 minutes):**
- [ ] Fix apartment capacity: 2 → 4 (constants.ts:66)
- [ ] Fix apartment cost: $5,000 → $2,000 (constants.ts:59)
- [ ] Fix farm cost: $15,000 → $3,000 (constants.ts:81)
- [ ] Fix kitchen cost: $10,000 → $2,500 (constants.ts:92)
- [ ] Fix office jobs: 4 → 6 (constants.ts:77)

**Game State Quick Wins:**
- [ ] Star rating system
  - Add `getStarRating()`: 1 star at 100 pop, 2 stars at 300 pop (MVP cap)
  - Display star icons in TopBar
  - Add to registry: `starRating` value
- [ ] Victory overlay (population >= 300)
  - Check in GameScene.update() each frame
  - Show overlay: cycles played, population, credits, rooms built
  - Buttons: Continue Playing, Main Menu
  - Pause TimeSystem when shown
- [ ] Game Over overlay (credits < -10,000 CR)
  - Check `economySystem.isBankrupt()` in GameScene.update()
  - Show overlay: cycles survived, max population reached
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
- [ ] Room demolition
  - Add Delete key handler in GameScene.setupInput()
  - Select room first (click to select), then Delete to demolish
  - Refund = `ROOM_SPECS[type].cost * 0.5`
  - Call `economySystem.earn(refund)` then `building.removeRoom(id)`
  - Evict residents/workers before destroying room
- [ ] Keyboard shortcuts
  - 1-7: Select room types (lobby, apartment, office, farm, kitchen, fastfood, restaurant)
  - Q: Cancel selection
  - Delete: Demolish selected room
  - ESC: Toggle pause (or open pause menu later)
  - Space: Toggle pause

### Phase 3 - Core Systems

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
  - Show slot previews: cycle, population, credits
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
  - `fastfood`: cost 5,000 CR, width 4, capacity 20, expenses 50 CR, color 0x4a2a2a
  - `restaurant`: cost 10,000 CR, width 5, capacity 15, expenses 100 CR, color 0x3a2a3a
- [ ] Create RestaurantSystem.ts
  - Track operating hours (Fast Food: 11-2, 5-7; Restaurant: 6-11 PM)
  - Food consumption: 30/day (FF), 20/day (restaurant)
  - Evaluation score: 0-100 based on food availability
- [ ] Income integration
  - Base: 500 CR/day (FF), 800 CR/day (restaurant)
  - Actual = base × (evaluation_score / 100)
  - Add to EconomySystem.processDailyIncome()

**Note:** Restaurant system depends on Time Events for operating hours.

### Phase 4 - Major Features

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
  - Add `skylobby` room type (cost 2,000 CR, width 20)
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
  - <40: 50 CR/day
  - 40-60: 100 CR/day
  - 60-80: 150 CR/day
  - >80: 200 CR/day
- [ ] Update EconomySystem to use satisfaction-based rent

### Phase 5 - Audio & Polish

**Audio System:**
- [ ] UI sounds
  - Button click
  - Room placement success/error
  - Menu open/close
- [ ] Money sounds
  - Income chime (cash register)
  - Expense tone
- [ ] Alert sounds
  - Low rations warning
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

**Graphics Foundation:**
- [x] Venus atmosphere background (`src/graphics/VenusAtmosphere.ts`)
- [x] Day/night overlay (`src/graphics/DayNightOverlay.ts`)

**UI System:**
- [x] Basic top bar (money, food, population, time display)
- [x] Basic build menu with room buttons
- [x] Camera controls (right-click pan, scroll zoom)
- [x] Glass panel CSS styling (needs application)

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
- HTML/CSS UI overlay (UIManager) separate from Phaser scenes

**Known Technical Debt:**
- Resident.goToRoom() teleports (sets targetY directly) - needs elevator integration
- TimeSystem lacks event emission for schedule-driven behaviors
- GAME_SPEED is constant, should be mutable property
- BootScene skips menu, goes directly to GameScene
- No keyboard input handlers in GameScene
- UI terminology still uses "Money" instead of "Credits" in code

## Dependency Graph

```
Phase 0 (Graphics) ─────────────────┐
                                    ├──→ Visual Identity Established
Phase 1 (UI/UX) ───────────────────┘
         │
         ↓
Phase 2 (Quick Wins)
         │
         ↓
Phase 3 (Core Systems)
├── Time Events ──→ Restaurant System
├── Menu System ──→ Save/Load System
         │
         ↓
Phase 4 (Major Features)
├── Elevator System ──→ Pathfinding
└── Pathfinding ──→ Stress System ──→ Satisfaction/Rent
         │
         ↓
Phase 5 (Audio & Polish)
```

**Parallel Work Possible:**
- Phase 0 (Graphics) + Phase 1 (UI/UX) = FULL PARALLEL
- Phase 2 (Quick Wins) = FULLY INDEPENDENT
- Time Events + Menu System = PARALLEL
- Elevator + Restaurant = PARALLEL (after time events)
- Audio = FULLY INDEPENDENT

## MVP Goals

| Goal | Metric | Current Status |
|------|--------|----------------|
| Victory | 300 population (2 stars) | No victory check |
| Game Over | -10,000 CR bankruptcy | isBankrupt() exists, no trigger |
| Building Height | 20 floors max | No limit enforced |
| Playable | Menu → Game → Save | No menu, no save |
| Visual Polish | Graphics & UI complete | Partial (atmosphere done, UI needs work) |

## Next Actions

**Immediate (Start Now - Graphics & UI Priority):**
1. Complete Venus atmosphere polish
2. Add scanline overlay
3. Add grid pattern overlay
4. Create left sidebar navigation component
5. Redesign top bar with new terminology (Credits, Rations, Residents)
6. Polish build zone menu with neon accents and glitch effects
7. Implement ghost preview for placement
8. Add room selection highlight
9. Apply glass panel styling to all UI elements
10. Add glitch hover effects

**After Graphics/UI Complete:**
1. Fix 5 spec discrepancies in constants.ts (5 min)
2. Add star rating calculation + display
3. Add victory/game over overlays
4. Add pause functionality to TimeSystem
5. Add speed controls to UI
6. Implement keyboard shortcuts
7. Add room demolition UI
