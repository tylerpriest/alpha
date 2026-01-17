# Graphics System

> The visual style that brings the arcology to life.

## Overview

The graphics system defines the visual identity of the game. It uses a side-view orthographic projection with a 64px grid, evolving SimTower's clean functionality into a **Venus cloud arcology aesthetic** - a floating megastructure suspended in terraforming atmosphere, blending liminal space emptiness with cyberpunk neon warmth.

**Art Direction:** SimTower's functional clarity meets Far Cry New Dawn's pastel post-apocalypse, Cyberpunk 2077's neon-drenched interiors, and the uncanny stillness of liminal spaces - all floating in Venus's amber-pink clouds.

## Requirements

### Must Have (MVP)

- 64px grid system (matches GRID_SIZE constant)
- Side-view orthographic projection
- Venus atmosphere background (amber-pink gradient clouds)
- Distinct room type colors with neon accent lighting
- Resident sprites (32x32px) with holographic tint
- Day/night cycle with dramatic atmospheric shifts
- Room placement ghost preview (cyan valid, magenta invalid)
- Selected room highlight (electric yellow border)
- Liminal emptiness in unoccupied spaces

### Should Have

- Parallax cloud layers in background
- Elevator car with glowing indicators
- Resident walking animations with subtle glow trails
- Room occupancy shown via interior lighting warmth
- Atmospheric particle effects (floating dust, cloud wisps)

### Nice to Have (Post-MVP)

- Weather events (acid rain, solar flares, cloud storms)
- Seasonal lighting shifts
- Building exterior detail showing floating supports
- Holographic signage on commercial rooms
- Resident portraits with cyberpunk styling

## Design

### Art Direction Pillars

1. **Liminal Emptiness:** Unoccupied spaces feel vast, quiet, transitional - long corridors, empty lobbies at 3 AM, the uncanny stillness between moments
2. **Venus Atmosphere:** Exterior is endless amber-pink clouds, the arcology floats in terraforming atmosphere, isolation from any ground
3. **Cyberpunk Warmth:** Interiors glow with neon accents - not harsh dystopia, but lived-in warmth; holographic displays, soft LED strips
4. **SimTower Clarity:** Despite the aesthetic, gameplay readability comes first - room types instantly recognizable, resident states clear

### Grid System

- Base unit: 64px x 64px
- Rooms snap to grid on both axes
- Floors are 1 grid unit tall
- Room widths vary by type (see BUILDING.md)

### Color Palette

**Background - Venus Atmosphere:**

| Time | Sky Gradient | Clouds | Hex Codes |
|------|--------------|--------|-----------|
| Dawn | Pale rose to amber | Soft pink | #f4d4c8 → #e8a87c |
| Day | Warm amber to coral | Golden wisps | #e8a87c → #d4726a |
| Dusk | Deep coral to violet | Purple-tinged | #d4726a → #8a6a8a |
| Night | Deep violet to black | Dark silhouettes | #4a3a5a → #1a1a2a |

**Room Colors (Cyberpunk-tinted, neon accents):**

| Room Type | Base Color | Neon Accent | Hex Codes |
|-----------|------------|-------------|-----------|
| Lobby | Deep slate | Cyan trim | #2a3a4a / #4ae4e4 |
| Apartment | Warm concrete | Soft orange | #4a4a4a / #e4a44a |
| Office | Cool gray | Blue glow | #3a3a4a / #4a8ae4 |
| Farm | Earthy brown | Green grow-lights | #4a3a2a / #4ae44a |
| Kitchen | Charcoal | Warm white | #3a3a3a / #e4e4d4 |
| Fast Food | Dark red | Hot pink neon | #4a2a2a / #e44a8a |
| Restaurant | Deep burgundy | Gold accent | #3a2a3a / #e4c44a |

**UI Colors:**

| Element | Color | Hex Code |
|---------|-------|----------|
| Valid placement | Cyan glow | #4ae4e4 |
| Invalid placement | Magenta warning | #e44a8a |
| Selection border | Electric yellow | #e4e44a |
| Text primary | Off-white | #e4e4e4 |
| Text secondary | Muted lavender | #a4a4c4 |

**Resident Hunger Indicators (Holographic tint):**

| Hunger Level | Color | Hex Code |
|--------------|-------|----------|
| 70-100 (satisfied) | Cyan | #4ae4e4 |
| 40-69 (hungry) | Amber | #e4a44a |
| 20-39 (very hungry) | Orange | #e46a4a |
| 0-19 (critical) | Magenta pulse | #e44a8a |

### Resident Sprites

- Size: 32px x 32px
- Silhouette style with subtle glow outline
- Color tint based on hunger level (holographic effect)
- Name label above (small, clean sans-serif)
- Walking: 2-4 frame subtle animation

**Visual Variety:**
- 4-8 silhouette variations
- Color derived from name hash
- Size variation: +/-4px height
- Occasional holographic flicker effect

### Day/Night Cycle

The Venus atmosphere creates dramatic lighting shifts:

- **6 AM - 8 AM (Dawn):** Pale rose sky, rooms begin to light up, soft shadows
- **8 AM - 6 PM (Day):** Warm amber atmosphere, clouds visible, high visibility
- **6 PM - 8 PM (Dusk):** Deep coral fading to violet, neon accents become prominent
- **8 PM - 6 AM (Night):** Deep violet-black, rooms glow from within, liminal emptiness emphasized

**Transitions:**
- 1-hour gradual blend between states
- Room interiors maintain consistent lighting
- Windows emit warm glow at night
- Empty rooms darker, more liminal at night

### Room Visuals

**Base Room Structure:**
- Dark rectangular fill with room type color
- Thin neon accent border (room type color)
- Room type label (small, clean)
- Interior details suggest function (desks, beds, plants)

**Room States:**

| State | Visual Treatment |
|-------|------------------|
| Empty | Base color, dimmed 40%, liminal feel |
| Occupied | Full color, warm interior glow |
| Selected | Electric yellow border (3px), subtle pulse |
| Ghost (valid) | Cyan semi-transparent, soft glow |
| Ghost (invalid) | Magenta semi-transparent, warning pulse |

**Liminal Space Effect:**
- Empty lobbies have vast, quiet feeling
- Long corridors between rooms feel transitional
- Night-time unoccupied rooms are darker, more atmospheric
- Occasional flickering light in distant empty spaces

### Elevator Visuals

- Shaft: Vertical strip with subtle blue lighting
- Car: Glowing box (48x48px) with floor number display
- Doors: Horizontal slide with light spill when opening
- Waiting indicators: Holographic floor numbers

### Background Layers (Parallax)

1. **Far clouds:** Slow-moving, large amber forms
2. **Mid clouds:** Medium speed, pink-coral wisps
3. **Near clouds:** Faster, detailed cloud edges
4. **Building:** Main game layer
5. **Foreground particles:** Floating dust, atmospheric haze

### Z-Ordering (Depth)

1. Background (Venus atmosphere, parallax clouds)
2. Rooms (ordered by floor, back to front)
3. Room interiors and lighting
4. Elevator shafts and cars
5. Residents (with glow effects)
6. Atmospheric particles (foreground)
7. UI overlays (selection, ghost preview)
8. HUD (top bar, build menu)

## Acceptance Criteria

- [ ] 64px grid visible in build mode
- [ ] Each room type has distinct color + neon accent
- [ ] Venus atmosphere background renders
- [ ] Residents show hunger via holographic color
- [ ] Ghost preview shows cyan/magenta validity
- [ ] Day/night cycle transitions smoothly
- [ ] Selected rooms have electric yellow border
- [ ] Empty rooms feel appropriately liminal
- [ ] Parallax cloud layers create depth

## Dependencies

- Time System (day/night cycle)
- Building System (room types, placement)
- Residents (hunger levels)

## Open Questions

- How to balance liminal emptiness with gameplay clarity?
- Should the building visibly float/sway slightly?
- What happens during atmospheric events (storms, solar flares)?
