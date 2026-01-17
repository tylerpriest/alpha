# Implementation Plan

> Prioritized task list for Arcology MVP. Update after each iteration.

## Current Focus

Phase 1-3 foundation is complete. Focus on completing food system and economy integration.

## Tasks

### High Priority

- [ ] Connect food system to residents (residents should consume food when hungry)
- [ ] Implement food distribution from kitchens to apartments
- [ ] Add visual feedback for hungry residents (currently color-coded, but no actual food consumption)
- [ ] Implement resident departure when starving for too long

### Medium Priority

- [ ] Add save/load functionality (localStorage + JSON)
- [ ] Implement proper pathfinding between floors (currently residents teleport)
- [ ] Add elevator/stairs system for vertical transport
- [ ] Add sound effects (UI clicks, ambient sounds)
- [ ] Implement day/night visual cycle (darken building at night)

### Low Priority

- [ ] Add more room types (restaurant, gym, shop)
- [ ] Implement resident happiness beyond hunger
- [ ] Add tutorial hints for new players
- [ ] Add statistics panel (population graph, income graph)
- [ ] Implement star rating progression system

## Completed

- [x] Project setup (Vite + Phaser + TypeScript)
- [x] Basic scene structure (Boot, Game, UI)
- [x] Building entity with floor/room management
- [x] Room placement system with overlap detection
- [x] Camera controls (pan, zoom)
- [x] Grid rendering
- [x] Room types: lobby, apartment, office, farm, kitchen
- [x] UI: Top bar (money, food, population, time)
- [x] UI: Build menu with room buttons
- [x] Time system with day/night cycle
- [x] Economy system (money tracking, room costs)
- [x] Resident entity with hunger and states
- [x] Resident spawning in apartments
- [x] Basic resident AI (idle, walking states)
- [x] Resource system (farms produce, kitchens process)
- [x] Unit tests for EconomySystem and TimeSystem

## Discoveries

- Phaser Registry is good for cross-scene state sharing
- Vitest needs canvas mocks for any Phaser-related tests
- Room placement needs to account for grid alignment

## Blocked

(None currently)
