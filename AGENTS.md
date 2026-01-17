# AGENTS.md

> Operational guide for Arcology development. Keep brief (~60 lines).
> Status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`.

## Build & Run

```bash
# Install dependencies
npm install

# Development server (localhost:5173)
npm run dev

# Production build
npm run build
```

## Validation

Run these after implementing to get immediate feedback:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm test

# All checks
npm run validate
```

## Project Structure

```
src/
├── main.ts           # Phaser game initialization
├── scenes/
│   ├── BootScene.ts  # Asset loading
│   ├── GameScene.ts  # Main gameplay
│   └── UIScene.ts    # HUD overlay
├── entities/
│   ├── Building.ts   # Tower structure
│   ├── Floor.ts      # Individual floor
│   ├── Room.ts       # Base room class
│   └── Resident.ts   # Individual person
├── systems/
│   ├── TimeSystem.ts      # Day/night cycle
│   ├── EconomySystem.ts   # Money management
│   ├── ResidentSystem.ts  # Population
│   └── ResourceSystem.ts  # Food production
├── utils/
│   ├── constants.ts  # Game constants
│   └── types.ts      # TypeScript types
└── test/
    └── setup.ts      # Vitest setup
```

## Operational Notes

- Camera: Right-click drag to pan, scroll wheel to zoom
- Build: Click room type in bottom menu, then click on grid to place
- Room placement validates floor constraints and overlap

## Codebase Patterns

- Systems communicate via scene references (e.g., `this.scene.building`)
- UI updates via Phaser Registry events
- Rooms stored in `Building.rooms` Map by ID
- Residents stored in `ResidentSystem.residents` array
