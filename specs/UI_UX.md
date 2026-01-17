# UI/UX System

> The player interface for building and managing the arcology.

## Overview

The UI provides all controls for building construction, resident management, and game state monitoring. It follows a clean, minimal design that keeps focus on the building itself.

## Requirements

### Must Have (MVP)

- Top bar: Credits, Rations, Residents, Time, Star Rating
- Left sidebar: Navigation (Dashboard, Construct, Utilities, Economy, Settings)
- Build menu: Room type buttons at bottom
- Camera controls: Right-click drag to pan, scroll wheel to zoom
- Ghost preview for room placement
- Valid/invalid placement visual feedback
- Time speed controls (pause, 1x, 2x, 4x)
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

### Screen Layout (Inspired by Stitch Colony Builder)

```
┌─────┬─────────────────────────────────────────────────────┐
│     │  VENUS_OS v4.2 │ 12,500 CR │ Rations: 450 │ Residents: 45 │ ⭐⭐ │  ← Top Bar
│  S  ├─────────────────────────────────────────────────────┤
│  I  │                                                     │
│  D  │                   Sector View                       │
│  E  │              (Arcology Building Area)               │
│  B  │                                                     │
│  A  │                                                     │
│  R  ├─────────────────────────────────────────────────────┤
│     │ [Lobby][Apt][Office][Farm][Kitchen][FF][Rest] │ ⏸1x2x4x │  ← Build Zone
└─────┴─────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- Left sidebar (collapsible to icon-only, 72px expanded, 20px collapsed)
- Top bar with branding, stats, and controls
- Bottom build menu with room buttons and speed controls
- Scanline overlay for retro CRT effect
- Glass panel styling with backdrop blur
- Neon accent colors (cyan primary #00ccaa, magenta secondary #ff00aa)
- Grid pattern overlay on background
- Glitch hover effects on interactive elements

### Left Sidebar (Collapsible)

**Expanded (72px width):**
- Brand header: "VENUS_OS" with version badge (e.g., "TOWER_04 // ALPHA")
- Section header: "COMMAND" or "TOWER OPS"
- Navigation buttons with icons + labels:
  - Sector View (Dashboard) - active
  - Build Zone (Construct)
  - Energy Grid (Utilities)
  - Economy
  - Heat Map (optional)
  - Alerts (with notification count badge)
- Collapse toggle button
- Overseer profile at bottom

**Collapsed (20px width):**
- Icon-only buttons
- Tooltips on hover
- Brand icon at top

**Styling:**
- Dark background: `rgba(16, 24, 22, 0.95)`
- Border: `#273a37`
- Active button: Primary cyan glow with border
- Hover: Glitch animation effect

### Top Bar Elements

| Element | Display | Click Action |
|---------|---------|--------------|
| Brand | "VENUS_OS v4.2" or "TOWER_04 // ALPHA" | None |
| Credits | "12,500 CR" | Show economy details |
| Rations | "Rations: 450" | Show food breakdown |
| Residents | "Residents: 45" | Show resident list |
| Time | "Cycle 5 12:00" or "Sol 5 12:00" | None |
| Star Rating | "⭐⭐" | Show requirements |
| Ext-Temp | "Ext-Temp: 462°C" (optional) | Show environment stats |
| System Override | Button | Emergency controls |
| Settings | ⚙️ icon | Open settings |
| Alerts | 🔔 icon with badge | Show alerts (count) |

### Build Zone (Bottom Menu)

**Room Buttons:**

| Button | Room | Shortcut | Cost |
|--------|------|----------|------|
| Lobby | Lobby | 1 | 5,000 CR |
| Apt | Apartment | 2 | 8,000 CR |
| Office | Office | 3 | 40,000 CR |
| Farm | Farm | 4 | 15,000 CR |
| Kitchen | Kitchen | 5 | 10,000 CR |
| FF | Fast Food | 6 | 12,000 CR |
| Rest | Restaurant | 7 | 20,000 CR |

**Time Speed Controls:**

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
- Check budget (enough credits)
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
| Low Rations | Rations < 100 | Yellow warning icon |
| No Rations | Rations = 0 | Red warning + flash |
| Low Credits | Credits < 1,000 CR | Yellow warning icon |
| Bankruptcy | Credits < -10,000 CR | System Override required |
| Starving | Any resident at 0 hunger | Red resident icon |
| Ext-Temp Critical | External temp > 500°C | Hazard glow |

### Visual Effects

**Glass Panel Styling:**
- Background: `rgba(24, 36, 34, 0.85)` with backdrop blur (12px)
- Border: `1px solid rgba(39, 58, 55, 0.8)`
- Box shadow: `0 4px 30px rgba(0, 0, 0, 0.5)`
- Subtle inner highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.05)`

**Scanline Overlay:**
- CRT-style horizontal scanlines
- Opacity: 20-30%
- Pattern: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`
- Fixed position, pointer-events: none

**Neon Glow Effects:**
- Primary cyan: `#00ccaa` with `0 0 15px rgba(0, 204, 170, 0.3)`
- Secondary magenta: `#ff00aa` with `0 0 15px rgba(255, 0, 170, 0.3)`
- Text glow: `text-shadow: 0 0 10px currentColor`

**Glitch Hover Animation:**
- Applied to interactive buttons
- Subtle transform glitch on hover
- Color shift: cyan → magenta → yellow
- Duration: 0.3s cubic-bezier

**Grid Pattern:**
- Subtle dot grid overlay on background
- Color: `rgba(0, 204, 170, 0.05)`
- Size: 24px × 24px
- Optional: Line grid variant for build mode

### Typography

- **Display Font:** Space Grotesk (weights: 300, 400, 500, 600, 700)
- **Body Font:** Noto Sans (weights: 400, 500, 700)
- **Icons:** Material Symbols Outlined
- **Monospace:** For technical displays (version numbers, codes)

### Color Palette

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary | Cyan | #00ccaa |
| Secondary | Magenta | #ff00aa |
| Venus Orange | Amber | #dba618 |
| Background Dark | Deep teal | #0f2320 |
| Surface Dark | Teal panel | #182422 |
| Border | Muted teal | #273a37 |
| Text Primary | Off-white | #e4e4e4 |
| Text Secondary | Muted teal | #9abcb6 |
| Text Muted | Dark teal | #5c706b |

### Responsive Design

- Minimum resolution: 1280 × 720
- UI scales proportionally
- Sidebar collapses to icons on narrow screens (< 1024px)
- Build menu collapses to icons on narrow screens
- Fullscreen toggle (F key)

## Acceptance Criteria

- [ ] Top bar shows credits, rations, residents, time, stars
- [ ] Left sidebar with navigation (collapsible)
- [ ] Build Zone menu with all room types
- [ ] Camera pan with right-click drag
- [ ] Camera zoom with scroll wheel
- [ ] Ghost preview during placement
- [ ] Cyan/magenta validity feedback
- [ ] Room selection with info display
- [ ] Time speed controls (pause, 1x, 2x, 4x)
- [ ] Keyboard shortcuts functional
- [ ] ESC opens pause menu
- [ ] Scanline overlay visible
- [ ] Glass panel styling on all UI elements
- [ ] Glitch hover effects on buttons

## Dependencies

- Graphics System (colors, sprites, scanlines)
- Building System (room placement)
- Economy System (credits display)
- Time System (cycle/time display)

## Open Questions

- Should there be a tutorial overlay for first-time players?
- How to handle touch input for mobile/tablet?
