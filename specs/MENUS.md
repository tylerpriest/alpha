# Menus & Game States

> Menu system and game state management for the arcology simulation.

## Overview

The menu system handles game flow from launch to gameplay, including the main menu, pause menu, settings, and end-game states (victory/game over). All menus share a consistent visual style and support keyboard navigation.

## Requirements

### Must Have (MVP)

- Main menu with New Game, Continue, Load Game, Settings options
- Pause menu accessible via ESC key
- Settings menu with volume controls and game speed preference
- Game Over screen triggered by bankruptcy (money < -$10,000)
- Victory screen triggered by reaching 2-star rating (300 population)
- Auto-save system for Continue functionality
- Multiple save slots for Load Game

### Should Have

- Credits screen accessible from main menu
- Confirmation dialogs for destructive actions (quit without saving)
- Settings persistence across sessions
- Visual feedback for menu interactions
- Smooth transitions between game states

### Nice to Have (Post-MVP)

- Animated menu backgrounds (arcology silhouette)
- Achievement display on victory screen
- Statistics comparison across playthroughs
- Cloud save integration
- Custom key binding options

## Design

### Data Model

```typescript
enum GameState {
  MAIN_MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  VICTORY,
}

interface GameSettings {
  masterVolume: number;      // 0-100
  uiVolume: number;          // 0-100
  ambientVolume: number;     // 0-100
  defaultGameSpeed: 1 | 2 | 4;
}

interface SaveSlot {
  id: number;                // 1-5
  name: string;              // Player-defined or auto-generated
  timestamp: Date;
  daysSurvived: number;
  population: number;
  money: number;
  starRating: number;
  isAutoSave: boolean;
}

interface GameOverStats {
  daysSurvived: number;
  maxPopulation: number;
  roomsBuilt: number;
  peakMoney: number;
  finalDebt: number;
}

interface VictoryStats {
  daysSurvived: number;
  population: number;
  starRating: number;
  roomsBuilt: number;
  totalIncome: number;
}
```

### Main Menu

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    ARCOLOGY                         │
│                                                     │
│                   [ New Game ]                      │
│                   [ Continue ]                      │
│                   [ Load Game ]                     │
│                   [ Settings ]                      │
│                   [ Credits ]                       │
│                                                     │
│                                    v0.1.0           │
└─────────────────────────────────────────────────────┘
```

| Button | Action | Notes |
|--------|--------|-------|
| New Game | Start fresh game | Creates auto-save slot |
| Continue | Load auto-save | Disabled if no auto-save exists |
| Load Game | Open save slot selection | Shows up to 5 slots |
| Settings | Open settings menu | Shared with pause menu |
| Credits | Show credits screen | Optional for MVP |

### Pause Menu

Triggered by pressing ESC during gameplay. Game time freezes.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                     PAUSED                          │
│                                                     │
│                   [ Resume ]                        │
│                   [ Save Game ]                     │
│                   [ Settings ]                      │
│                   [ Quit to Main Menu ]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Button | Action | Notes |
|--------|--------|-------|
| Resume | Close menu, resume play | Also triggered by ESC |
| Save Game | Open save slot selection | Overwrites or creates new |
| Settings | Open settings menu | Same as main menu settings |
| Quit to Main Menu | Return to main menu | Prompts "Save before quitting?" |

### Settings Menu

```
┌─────────────────────────────────────────────────────┐
│                     SETTINGS                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Master Volume      [━━━━━━━━░░]  80%               │
│                                                     │
│  UI Volume          [━━━━━━━━━━]  100%              │
│                                                     │
│  Ambient Volume     [━━━━━░░░░░]  50%               │
│                                                     │
│  Default Game Speed    (1x)  2x   4x                │
│                                                     │
│              [ Reset to Defaults ]                  │
│                                                     │
│                    [ Back ]                         │
└─────────────────────────────────────────────────────┘
```

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Master Volume | 0-100 | 80 | Overall volume multiplier |
| UI Volume | 0-100 | 100 | Button clicks, notifications |
| Ambient Volume | 0-100 | 50 | Background music, atmosphere |
| Default Game Speed | 1x/2x/4x | 1x | Speed when starting new game |

**Default Values:**
- Master Volume: 80%
- UI Volume: 100%
- Ambient Volume: 50%
- Default Game Speed: 1x

### Game States

```
┌──────────────┐
│  MAIN_MENU   │
└──────┬───────┘
       │ New Game / Continue / Load
       ▼
┌──────────────┐ ESC  ┌──────────────┐
│   PLAYING    │◄────►│   PAUSED     │
└──────┬───────┘      └──────┬───────┘
       │                     │ Quit to Main Menu
       │                     ▼
       │              ┌──────────────┐
       │              │  MAIN_MENU   │
       │              └──────────────┘
       │
       ├─── money < -$10,000 ───┐
       │                        ▼
       │                 ┌──────────────┐
       │                 │  GAME_OVER   │
       │                 └──────┬───────┘
       │                        │ Main Menu / Restart
       │                        ▼
       │                 ┌──────────────┐
       │                 │  MAIN_MENU   │
       │                 └──────────────┘
       │
       └─── population >= 300 ──┐
                                ▼
                         ┌──────────────┐
                         │   VICTORY    │
                         └──────┬───────┘
                                │ Continue / Main Menu
                                ▼
                         ┌──────────────┐
                         │ PLAYING or   │
                         │ MAIN_MENU    │
                         └──────────────┘
```

### Game Over Screen

Triggered when money drops below -$10,000 (bankruptcy).

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    BANKRUPTCY                       │
│                                                     │
│          Your arcology has gone bankrupt.           │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Days Survived:        47                     │  │
│  │  Max Population:       156                    │  │
│  │  Rooms Built:          34                     │  │
│  │  Peak Money:           $125,000               │  │
│  │  Final Debt:           -$12,450               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│              [ Restart ]    [ Main Menu ]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Button | Action |
|--------|--------|
| Restart | Start new game immediately |
| Main Menu | Return to main menu |

### Victory Screen

Triggered when population reaches 300 (2-star rating achieved).

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                 CONGRATULATIONS!                    │
│                                                     │
│         Your arcology has achieved 2 stars!         │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Days to Victory:      62                     │  │
│  │  Population:           312                    │  │
│  │  Star Rating:          ★★                     │  │
│  │  Rooms Built:          48                     │  │
│  │  Total Income:         $450,000               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│         [ Continue Playing ]    [ Main Menu ]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Button | Action |
|--------|--------|
| Continue Playing | Resume gameplay, aim for higher stars |
| Main Menu | Return to main menu |

### Save/Load System

**Save Slots:**
- 5 manual save slots + 1 auto-save slot
- Auto-save triggers every 5 game days
- Manual save accessible from pause menu

```
┌─────────────────────────────────────────────────────┐
│                    LOAD GAME                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [AUTO] Day 47 - Pop: 156 - $45,000      12:34 PM  │
│  [1]    Day 23 - Pop: 89  - $28,000      Yesterday │
│  [2]    Day 12 - Pop: 45  - $15,000      Jan 15    │
│  [3]    Empty                                       │
│  [4]    Empty                                       │
│  [5]    Empty                                       │
│                                                     │
│                    [ Back ]                         │
└─────────────────────────────────────────────────────┘
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| ESC | Open/close pause menu, back in menus |
| Enter | Select highlighted option |
| Up/Down | Navigate menu options |
| Left/Right | Adjust sliders, toggle options |
| Tab | Next element |
| Shift+Tab | Previous element |

## Acceptance Criteria

- [ ] Main menu displays on game launch
- [ ] New Game starts fresh gameplay
- [ ] Continue loads auto-save (disabled if none exists)
- [ ] Load Game shows save slot selection
- [ ] ESC key opens pause menu during gameplay
- [ ] Resume returns to gameplay with ESC or button
- [ ] Save Game allows selecting save slot
- [ ] Settings menu has volume sliders (master, UI, ambient)
- [ ] Settings menu has game speed toggle (1x/2x/4x)
- [ ] Reset to Defaults restores all settings
- [ ] Settings persist between sessions (localStorage)
- [ ] Game Over triggers at money < -$10,000
- [ ] Game Over shows final stats (days, population, rooms)
- [ ] Victory triggers at population >= 300
- [ ] Victory shows Continue Playing option
- [ ] Quit to Main Menu prompts save confirmation
- [ ] All menus support keyboard navigation

## Dependencies

- Time System (day tracking for stats)
- Economy System (money tracking, bankruptcy trigger)
- Resident System (population tracking, victory trigger)
- Building System (room count for stats)
- Save/Load System (data persistence)

## Open Questions

- Should there be multiple victory tiers (3-star, 4-star, 5-star)?
- How long between auto-saves (currently 5 game days)?
- Should save files include screenshots/thumbnails?
- Should there be a "Hard Mode" with stricter bankruptcy threshold?
