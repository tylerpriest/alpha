# Dev Principles

A reusable collection of development principles, patterns, and templates for game development projects. Synthesized from AlphaOS, Ralph Playbook, and BYO methodologies.

## Overview

This branch contains:

- **PRINCIPLES.md** - Core development principles (Research First, DRY, Context Management, Backpressure)
- **RALPH_PLAYBOOK.md** - Condensed Ralph methodology for AI-assisted development
- **templates/** - Ready-to-use templates for project files
- **game-patterns/** - Game-specific implementation patterns
- **scripts/** - Automation scripts including Ralph loop

## Quick Start

### For a New Game Project

1. Create your project branch:
   ```bash
   git checkout main
   git checkout -b my-game
   ```

2. Copy the templates you need:
   ```bash
   # Copy Ralph workflow files
   git show dev-principles:templates/AGENTS_TEMPLATE.md > AGENTS.md
   git show dev-principles:templates/IMPLEMENTATION_PLAN_TEMPLATE.md > IMPLEMENTATION_PLAN.md
   git show dev-principles:templates/PROMPT_plan.md > PROMPT_plan.md
   git show dev-principles:templates/PROMPT_build.md > PROMPT_build.md
   git show dev-principles:scripts/loop.sh > loop.sh
   chmod +x loop.sh
   ```

3. Create your specs directory:
   ```bash
   mkdir specs
   git show dev-principles:templates/SPEC_TEMPLATE.md > specs/FEATURE_NAME.md
   ```

4. Start Ralph loop:
   ```bash
   ./loop.sh plan    # Generate implementation plan
   ./loop.sh build   # Begin implementing
   ```

### Reference Patterns

View patterns directly from this branch:
```bash
git show dev-principles:game-patterns/PHASER_SETUP.md
git show dev-principles:game-patterns/OBJECT_POOLING.md
git show dev-principles:game-patterns/RESIDENT_AI.md
```

## Contents

### Templates

| File | Purpose |
|------|---------|
| `AGENTS_TEMPLATE.md` | Operational guide for build/run procedures |
| `IMPLEMENTATION_PLAN_TEMPLATE.md` | Task tracking for Ralph loops |
| `SPEC_TEMPLATE.md` | Feature specification template |
| `PROMPT_plan.md` | Ralph planning mode instructions |
| `PROMPT_build.md` | Ralph building mode instructions |

### Game Patterns

| File | Purpose |
|------|---------|
| `PHASER_SETUP.md` | Phaser 3 + Vite + TypeScript setup |
| `OBJECT_POOLING.md` | Object pool implementation |
| `SPATIAL_PARTITIONING.md` | Grid/quadtree patterns |
| `RESIDENT_AI.md` | FSM → Utility AI → Behavior Trees |
| `SAVE_LOAD.md` | JSON serialization with versioning |
| `TESTING_GAMES.md` | Vitest setup for Phaser |

### Scripts

| File | Purpose |
|------|---------|
| `loop.sh` | Ralph loop orchestration script |

## Core Principles

See `PRINCIPLES.md` for detailed explanations:

1. **Research First** - Understand deeply before coding
2. **DRY** - Use existing tools, don't reinvent
3. **Context Is Everything** - One task per iteration
4. **Backpressure Beats Direction** - Let tools reject bad output
5. **File-Based Memory** - State persists via files

## Ralph Workflow

See `RALPH_PLAYBOOK.md` for the full methodology:

```
ORIENT → READ PLAN → SELECT → INVESTIGATE → IMPLEMENT → VALIDATE → UPDATE → COMMIT
```

Each iteration:
- Fresh context prevents degradation
- One task keeps focus sharp
- File-based state enables coordination
- Backpressure ensures quality

## License

MIT - Use freely in your projects.
