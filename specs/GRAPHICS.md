# Graphics System

> The visual style that brings the arcology to life.

## Reference Images

| Image | Priority | Use For |
|-------|----------|---------|
| `public/images/Simstower but one level of graphics quality better...jpg` | **PRIMARY** | Style, colors, atmosphere, room detail level |
| `public/images/SimsTower.png` | **PRIMARY** | Camera angle, UI layout, gameplay clarity |
| `public/images/stitch_cyberpunk_venus_colony_builder/*` | Low | Additional inspiration |

## Overview

The graphics system defines the visual identity of the game. It uses a **side-view orthographic projection** (like SimTower) with a 64px grid, but rendered at **one level of graphics quality better** - a detailed pixel art style showing a cyberpunk megastructure on terraforming Venus.

**Art Direction:** SimTower's camera angle and gameplay clarity + the visual richness of the priority reference - volcanic Venus landscape, industrial cyberpunk tower with detailed room interiors, neon corporate signage, and alien vegetation.

## Requirements

### Must Have (MVP)

- 64px grid system (matches GRID_SIZE constant)
- Side-view orthographic projection (SimTower camera)
- Volcanic Venus atmosphere (deep amber/orange sky gradient)
- Dark industrial building exterior with visible room interiors
- Distinct room interior lighting by type (cyan, amber, green, etc.)
- Resident sprites (32x32px) with status-based coloring
- Day/night cycle affecting sky color and room glow
- Room placement ghost preview (cyan valid, magenta invalid)
- Selected room highlight (electric yellow border)

### Should Have

- Volcanic terrain at building base (lava flows, rock)
- Alien vegetation and crystals in foreground
- Neon corporate signage on building ("TERRA-FORM", etc.)
- Detailed room interiors (furniture, equipment silhouettes)
- Resident walking animations
- Atmospheric haze/smoke particles

### Nice to Have (Post-MVP)

- Flying drones/vehicles in background
- Weather events (volcanic eruptions, ash storms)
- Distant terraforming structures in background
- Animated lava flows
- Holographic displays inside rooms

## Design

### Art Direction Pillars

1. **Volcanic Venus:** Deep amber/orange sky, volcanic terrain with lava flows visible at base, alien crystals and vegetation - a hostile but beautiful world being terraformed
2. **Industrial Cyberpunk:** Dark concrete/steel tower exterior, detailed room interiors visible through cutaway, corporate neon signage ("TERRA-FORM", "VENUS PRIME CORP")
3. **Lived-In Detail:** Each room has distinct interior details - furniture, equipment, lighting that tells a story; not sterile, but inhabited
4. **SimTower Clarity:** Clean side-view camera, readable room types, clear resident states - gameplay first, aesthetic second

### Grid System

- Base unit: 64px x 64px
- Rooms snap to grid on both axes
- Floors are 1 grid unit tall
- Room widths vary by type (see BUILDING.md)

### Color Palette

**Background - Volcanic Venus Atmosphere:**

| Time | Sky Gradient | Description | Hex Codes |
|------|--------------|-------------|-----------|
| Dawn | Amber to burnt orange | Volcanic sunrise, smoke haze | #d4823a → #a85020 |
| Day | Deep amber to rust | Hot, hazy terraforming sky | #c87030 → #8a4020 |
| Dusk | Rust to deep purple | Volcanic glow meets darkness | #8a4020 → #4a2040 |
| Night | Deep purple to black | Lava glow from below | #3a1a3a → #1a0a1a |

**Volcanic Terrain (visible at base):**
- Lava flows: `#e04010` with `#ff6020` glow
- Volcanic rock: `#2a1a1a` to `#4a2a2a`
- Alien crystals: `#e04080` (magenta), `#40e0e0` (cyan)
- Alien vegetation: `#8040a0` (purple), `#e060a0` (pink)

**Building Exterior:**
- Main structure: Dark industrial concrete `#1a2020` to `#2a3030`
- Floor dividers: Steel beams `#3a4040`
- Exterior trim: `#404848`
- Corporate signage: Neon glow (cyan, magenta, orange)

**Room Colors (Interior lighting defines room type):**

| Room Type | Interior Base | Accent Lighting | Hex Codes |
|-----------|---------------|-----------------|-----------|
| Lobby | Dark slate | Cyan neon | #1a2a2a / #00e0e0 |
| Apartment | Warm gray | Amber warm | #2a2420 / #e0a040 |
| Office | Cool gray | Blue screens | #202428 / #4080e0 |
| Farm | Dark earth | Green grow-lights | #1a2018 / #40e040 |
| Kitchen | Charcoal | Warm white | #201a1a / #e0d0c0 |
| Fast Food | Dark | Hot pink neon | #201818 / #e04080 |
| Restaurant | Deep brown | Gold accent | #1a1818 / #e0b040 |

**Neon Signage Colors:**
- "TERRA-FORM": Cyan `#00e0e0`
- "VENUS PRIME CORP": Orange `#e08020`
- Commercial: Magenta `#e04080`

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

The volcanic Venus atmosphere creates dramatic lighting shifts:

- **6 AM - 8 AM (Dawn):** Amber sky emerges through smoke, volcanic glow fades
- **8 AM - 6 PM (Day):** Deep amber/orange terraforming sky, hazy visibility, hot atmosphere
- **6 PM - 8 PM (Dusk):** Rust fading to purple, neon signage becomes prominent
- **8 PM - 6 AM (Night):** Dark purple sky, lava glow from below, rooms illuminate interior

**Transitions:**
- 1-hour gradual blend between states
- Lava glow constant but more visible at night
- Room interior lighting constant, more prominent against dark exterior at night
- Neon signage brightest at night

### Room Visuals

**Base Room Structure:**
- Dark interior base color (matches building exterior darkness)
- Accent lighting defines room type (glowing strips, screens, equipment)
- Interior details drawn as silhouettes with accent-colored highlights
- Building shell visible around rooms (concrete/steel frame)

**Interior Details by Room Type:**
- **Lobby:** Reception desk, seating, cyan accent strips
- **Apartment:** Bed, desk, warm amber window glow
- **Office:** Desks with blue screen glow, chairs
- **Farm:** Grow-bed rows with green light strips
- **Kitchen:** Counters, warm white overhead lights
- **Fast Food:** Counter, neon signage, pink glow
- **Restaurant:** Tables, gold accent lighting

**Room States:**

| State | Visual Treatment |
|-------|------------------|
| Empty | Dark interior, accent lighting at 40% |
| Occupied | Full accent lighting, warm glow |
| Selected | Electric yellow border (3px), highlight pulse |
| Ghost (valid) | Cyan semi-transparent, soft glow |
| Ghost (invalid) | Magenta semi-transparent, warning pulse |

### Elevator Visuals

- Shaft: Vertical strip with subtle blue lighting
- Car: Glowing box (48x48px) with floor number display
- Doors: Horizontal slide with light spill when opening
- Waiting indicators: Holographic floor numbers

### Background Layers (Parallax)

1. **Far sky:** Venus atmosphere gradient, distant smoke/haze
2. **Distant terrain:** Silhouetted volcanic mountains, terraforming structures
3. **Mid terrain:** Volcanic rock formations, lava pools
4. **Building:** Main game layer (the arcology)
5. **Foreground terrain:** Alien crystals, vegetation, lava at base
6. **Atmospheric particles:** Floating ash, smoke wisps, heat distortion

### Z-Ordering (Depth)

1. Far background (sky gradient, distant terrain)
2. Mid background (volcanic formations, distant structures)
3. Building exterior (structural frame)
4. Room interiors and lighting
5. Elevator shafts and cars
6. Residents
7. Foreground terrain (crystals, vegetation at base)
8. Atmospheric particles (ash, smoke)
9. UI overlays (selection, ghost preview)
10. HUD (top bar, build menu)

## Acceptance Criteria

- [ ] 64px grid visible in build mode
- [ ] Side-view orthographic camera (SimTower style)
- [ ] Volcanic Venus atmosphere (deep amber/orange sky)
- [ ] Dark industrial building exterior visible
- [ ] Each room type has distinct interior accent lighting
- [ ] Room interiors show detail silhouettes
- [ ] Residents show status via color
- [ ] Ghost preview shows cyan/magenta validity
- [ ] Day/night cycle transitions sky color
- [ ] Selected rooms have electric yellow border
- [ ] Visual style matches priority reference image

## Dependencies

- Time System (day/night cycle)
- Building System (room types, placement)
- Residents (hunger levels)

## Open Questions

- How much detail in room interiors? Silhouettes vs pixel art furniture?
- Animated lava flows or static glow?
- Flying drones/vehicles - gameplay element or decoration?
- Neon signage - player-customizable or fixed?
