# AGENTS.md

> Operational guide for Arcology development.

## Quick Start

```bash
npm install && npm run dev  # localhost:5173
```

## Validation

```bash
npm run validate  # typecheck + lint + test
```

## How to Work (Fresh Context)

This project uses the **Ralph methodology**.

1. **Check mode** - Planning or building?
   - Planning: Read `PROMPT_plan.md`
   - Building: Read `PROMPT_build.md`

2. **Check state** - Read `IMPLEMENTATION_PLAN.md`

3. **Check specs** - Read `specs/*` for requirements

### Key Files

| File | Purpose |
|------|---------|
| IMPLEMENTATION_PLAN.md | Current tasks, blockers |
| PROMPT_build.md | Building mode instructions |
| PROMPT_plan.md | Planning mode instructions |
| specs/*.md | Feature requirements |
| docs/PRINCIPLES.md | Coding standards |

### Methodology Docs

- `docs/QUICKSTART_RALPH.md` - Full journey guide
- `docs/RALPH_PLAYBOOK.md` - Deep methodology
- `docs/PRINCIPLES.md` - Coding standards

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
