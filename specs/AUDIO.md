# Audio System

> Sound design and audio management for the arcology simulation.

## Overview

The audio system provides immersive soundscapes that respond to player actions, building activity, and resident behaviors. It includes UI feedback sounds, ambient environmental audio, and alert notifications to enhance gameplay clarity and atmosphere.

## Requirements

### Must Have (MVP)

- UI sound effects: button clicks, placement success/error, menu open/close
- Money sounds: income chime, expense tone
- Basic ambient layer for active rooms
- Volume controls: Master volume slider
- Mute toggle
- Audio enabled/disabled persistence in settings

### Should Have

- Room-specific ambient sounds (office buzz, kitchen sizzle, farm machinery)
- Elevator sounds: bell, doors open/close, movement hum
- Resident sounds: footsteps, eating
- Alert sounds: low food warning, starvation, bankruptcy
- Separate volume sliders: Master, UI, Ambient, Residents
- Smooth audio transitions when changing scenes or game speed

### Nice to Have (Post-MVP)

- Dynamic ambient mixing based on camera position/zoom
- Day/night ambient variation
- Resident arrival/departure musical tones
- Seasonal or weather ambience
- Accessibility: Visual indicators for all audio cues
- Spatial audio (stereo panning based on room position)

## Design

### Data Model

```typescript
interface AudioConfig {
  masterVolume: number;    // 0.0 - 1.0
  uiVolume: number;        // 0.0 - 1.0
  ambientVolume: number;   // 0.0 - 1.0
  residentVolume: number;  // 0.0 - 1.0
  muted: boolean;
}

interface SoundDefinition {
  id: string;
  path: string;
  category: SoundCategory;
  volume: number;          // Base volume 0.0 - 1.0
  loop: boolean;
  maxInstances?: number;   // Limit simultaneous plays
}

enum SoundCategory {
  UI,
  AMBIENT,
  RESIDENT,
  ALERT,
  ELEVATOR,
  MONEY,
}

interface AmbientLayer {
  roomType: RoomType;
  sounds: SoundDefinition[];
  fadeTime: number;        // ms to fade in/out
}
```

### Sound Catalog

**UI Sounds:**

| Sound ID | Trigger | Description |
|----------|---------|-------------|
| ui_click | Button press | Soft click |
| ui_hover | Button hover | Subtle tick (optional) |
| ui_open | Menu open | Whoosh/slide |
| ui_close | Menu close | Reverse whoosh |
| place_success | Valid room placed | Positive confirmation |
| place_error | Invalid placement | Negative buzz |
| demolish | Room demolished | Crumble/collapse |

**Money Sounds:**

| Sound ID | Trigger | Description |
|----------|---------|-------------|
| money_gain | Income received | Coin/cash register chime |
| money_loss | Expense paid | Softer descending tone |
| money_big_gain | Large income (>$10k) | Celebratory jingle |

**Ambient Sounds (by Room Type):**

| Room Type | Sounds | Notes |
|-----------|--------|-------|
| Office | Keyboard typing, phone rings, quiet chatter | Subdued corporate hum |
| Kitchen | Sizzling, pot clanks, chopping | Active cooking sounds |
| Farm | Machinery hum, irrigation drips, wind | Agricultural ambience |
| Restaurant | Dining chatter, utensils, soft music | Upscale dining |
| Fast Food | Fryer sizzle, order beeps, crowd noise | Busy quick-service |
| Apartment | Quiet, occasional TV, muffled voices | Residential calm |
| Lobby | Footsteps, doors, echo | Entrance hall ambience |

**Elevator Sounds:**

| Sound ID | Trigger | Description |
|----------|---------|-------------|
| elevator_bell | Arrival at floor | G4 pitch (392 Hz) bell ding |
| elevator_doors_open | Doors opening | Mechanical slide |
| elevator_doors_close | Doors closing | Reverse slide + clunk |
| elevator_move | Elevator in motion | Low mechanical hum |
| elevator_stop | Arrival deceleration | Hum pitch down + stop |

**Resident Sounds:**

| Sound ID | Trigger | Description |
|----------|---------|-------------|
| footstep | Resident walking | Soft footfall (randomized) |
| eating | Resident at food venue | Utensil/chewing sounds |
| resident_arrive | New resident moves in | Welcoming tone |
| resident_depart | Resident leaves | Melancholy tone |

**Alert Sounds:**

| Sound ID | Trigger | Priority | Description |
|----------|---------|----------|-------------|
| alert_low_food | Food < 100 | Medium | Warning chime |
| alert_no_food | Food = 0 | High | Urgent alarm |
| alert_starvation | Resident at 0 hunger | High | Distress sound |
| alert_low_money | Money < $1,000 | Medium | Concern tone |
| alert_bankruptcy | Money < -$10,000 | Critical | Game over sting |

### Volume Control System

```
Master Volume ─┬─> UI Volume ────────> UI Sounds
               ├─> Ambient Volume ───> Room Ambience
               ├─> Resident Volume ──> Footsteps, Eating
               └─> (Alerts always at Master × 1.0)
```

**Slider Behavior:**
- Range: 0% - 100% (stored as 0.0 - 1.0)
- Default: Master 80%, UI 100%, Ambient 70%, Residents 60%
- Changes apply immediately (no confirmation needed)
- Settings persist to localStorage

### Audio Mixing Rules

- Maximum 8 ambient sound instances at once
- Footsteps limited to 4 concurrent instances
- UI sounds always play immediately (high priority)
- Alerts override other sounds but don't stop them
- Paused game: Fade ambient to 20%, UI sounds still play

### Audio Loading

- Preload all UI and alert sounds during boot
- Lazy-load ambient sounds when room type first placed
- Use Web Audio API via Phaser's sound system
- Supported formats: MP3 (primary), OGG (fallback)

## Audio Asset Sources

Recommended CC0/royalty-free sources:

| Source | URL | Best For |
|--------|-----|----------|
| Freesound | freesound.org | All categories |
| Pixabay Audio | pixabay.com/sound-effects | UI, ambient |
| Mixkit | mixkit.co/free-sound-effects | UI, alerts |
| Sonniss GDC Bundle | sonniss.com | Professional SFX |
| OpenGameArt | opengameart.org | Game-specific |

**Licensing Notes:**
- All audio must be CC0, CC-BY, or purchased royalty-free
- Maintain `AUDIO_CREDITS.md` with attribution
- Prefer CC0 to simplify licensing

## Acceptance Criteria

- [ ] UI click sounds on all buttons
- [ ] Placement success/error audio feedback
- [ ] Money gain/loss sounds trigger correctly
- [ ] Master volume control functional
- [ ] Mute toggle works
- [ ] Volume settings persist between sessions
- [ ] At least one ambient sound per room type
- [ ] Elevator bell plays at G4 pitch
- [ ] Alert sounds play for low food and bankruptcy warnings
- [ ] Audio does not cause performance issues (< 8 concurrent sounds)

## Dependencies

- Phaser Sound System (WebAudio)
- UI System (volume controls in settings menu)
- Building System (room ambient triggers)
- Economy System (money sound triggers)
- Resident System (footstep/eating triggers)
- Time System (game pause affects audio)

## Open Questions

- Should there be background music, or ambience-only?
- How to handle audio when game is in background tab?
- Should alert sounds have visual accessibility alternatives (vibration pattern, screen flash)?
- What is the audio budget (total MB for all sounds)?
