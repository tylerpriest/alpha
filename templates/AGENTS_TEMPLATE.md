# AGENTS.md

> Operational guide for build, run, and validation. Keep brief (~60 lines).
> Status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`.

## Build & Run

```bash
# Install dependencies
npm install

# Development server
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
├── main.ts           # Entry point
├── scenes/           # Game scenes
├── entities/         # Game objects
├── systems/          # Cross-cutting logic
├── ui/               # UI components
└── utils/            # Utilities and types
```

## Operational Notes

<!-- Add learnings about how to run the project here -->

## Codebase Patterns

<!-- Add patterns discovered during development here -->
