# UI/UX System

> The player interface for building and managing the arcology.

## Overview

The UI provides all controls for building construction, resident management, and game state monitoring. It follows a clean, minimal design that keeps focus on the building itself.

## Requirements

### Must Have (MVP)

- Top bar: Money, Food, Population, Time, Star Rating
- Build menu: Room type buttons at bottom
- Camera controls: Right-click drag to pan, scroll wheel to zoom
- Ghost preview for room placement
- Valid/invalid placement visual feedback
- Game speed controls (pause, 1x, 2x, 4x)
- Room selection and info display
- Keyboard shortcuts for common actions

### Should Have

- Keyboard-only navigation (accessibility)
- Colorblind mode options
- Text scaling options
- Tooltips on hover
- Status alerts (low food, bankruptcy warning)

### Nice to Have (Post-MVP)

- Minimap for large buildings
- Statistics dashboards
- Resident search/filter
- Undo/redo for placements

## Design

### Screen Layout

```
┌─────────────────────────────────────────────────────┐
│  $12,500 │ 🍎 450 │ 👤 45/100 │ Day 5 12:00 │ ⭐⭐  │  ← Top Bar
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                   Game Canvas                       │
│              (Building View Area)                   │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Lobby][Apt][Office][Farm][Kitchen][FF][Rest] │ ⏸1x2x4x │  ← Bottom Bar
└─────────────────────────────────────────────────────┘
```

### Top Bar Elements

| Element | Display | Click Action |
|---------|---------|--------------|
| Money | "$12,500" | Show economy details |
| Food | "🍎 450" | Show food breakdown |
| Population | "👤 45/100" | Show resident list |
| Time | "Day 5 12:00" | None |
| Star Rating | "⭐⭐" | Show requirements |

### Build Menu (Bottom)

**Room Buttons:**

| Button | Room | Shortcut | Cost |
|--------|------|----------|------|
| Lobby | Lobby | 1 | $5,000 |
| Apt | Apartment | 2 | $8,000 |
| Office | Office | 3 | $40,000 |
| Farm | Farm | 4 | $15,000 |
| Kitchen | Kitchen | 5 | $10,000 |
| FF | Fast Food | 6 | $12,000 |
| Rest | Restaurant | 7 | $20,000 |

**Speed Controls:**

| Button | Action | Shortcut |
|--------|--------|----------|
| ⏸ | Pause | Space |
| 1x | Normal speed | - |
| 2x | Double speed | - |
| 4x | Quad speed | - |

### Keyboard Shortcuts

**Camera Controls:**
| Key | Action |
|-----|--------|
| W / ↑ | Pan up |
| A / ← | Pan left |
| S / ↓ | Pan down |
| D / → | Pan right |
| + / = | Zoom in |
| - | Zoom out |
| Home | Center on building |

**Building Controls:**
| Key | Action |
|-----|--------|
| 1-7 | Select room type |
| Q | Cancel placement |
| Delete | Demolish selected |
| Escape | Open pause menu |

**Game Controls:**
| Key | Action |
|-----|--------|
| Space | Toggle pause |
| F5 | Quick save |
| F9 | Quick load |
| F | Toggle fullscreen |

### Camera System

- **Pan:** Right-click + drag, or WASD/Arrow keys
- **Zoom:** Mouse scroll wheel, or +/- keys
- **Zoom Range:** 0.5x to 2x (default 1x)
- **Bounds:** Camera constrained to building area ± margin

### Room Placement Flow

1. Click room button (or press 1-7)
2. Ghost preview follows cursor
3. Ghost shows green (valid) or red (invalid)
4. Left-click to place
5. Right-click or Q to cancel

**Placement Validation:**
- Check floor constraints (Lobby on ground floor)
- Check overlap with existing rooms
- Check budget (enough money)
- Check building boundaries

### Room Selection

- Left-click room to select
- Yellow border indicates selection
- Info panel shows room details:
  - Room type and ID
  - Occupants (residents/workers)
  - Income/expenses
  - Status (active, empty, etc.)
- Click elsewhere to deselect

### Accessibility Features

**Colorblind Modes:**
| Mode | Description |
|------|-------------|
| Protanopia | Red-blind adjustments |
| Deuteranopia | Green-blind adjustments |
| Tritanopia | Blue-blind adjustments |
| Monochromatic | Grayscale + patterns |

**Text Scaling:**
- Options: 75%, 100%, 125%, 150%
- Affects all UI text and labels

**Other Options:**
- High contrast mode (stronger borders)
- Reduced motion (disable animations)
- Keyboard-only navigation (Tab, Enter, Arrows)

### Status Alerts

| Alert | Trigger | Display |
|-------|---------|---------|
| Low Food | Food < 100 | Yellow warning icon |
| No Food | Food = 0 | Red warning + flash |
| Low Money | Money < $1,000 | Yellow warning icon |
| Bankruptcy | Money < -$10,000 | Game Over trigger |
| Starving | Any resident at 0 hunger | Red resident icon |

### Responsive Design

- Minimum resolution: 1280 × 720
- UI scales proportionally
- Build menu collapses to icons on narrow screens
- Fullscreen toggle (F key)

## Acceptance Criteria

- [ ] Top bar shows money, food, population, time, stars
- [ ] Build menu with all room types
- [ ] Camera pan with right-click drag
- [ ] Camera zoom with scroll wheel
- [ ] Ghost preview during placement
- [ ] Green/red validity feedback
- [ ] Room selection with info display
- [ ] Speed controls (pause, 1x, 2x, 4x)
- [ ] Keyboard shortcuts functional
- [ ] ESC opens pause menu

## Dependencies

- Graphics System (colors, sprites)
- Building System (room placement)
- Economy System (money display)
- Time System (day/time display)

## Open Questions

- Should there be a tutorial overlay for first-time players?
- How to handle touch input for mobile/tablet?
