# Implementation Plan

> Prioritized task list for Arcology MVP. Update after each iteration.

## Current Focus

Food system integration complete. Residents now walk to kitchens to eat and consume actual food. Focus on save/load and pathfinding.

## Tasks

### High Priority

(None - all high priority food system tasks complete)

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
- [x] Food system integration (residents walk to kitchens and consume food)
- [x] Resident hunger drives behavior (find kitchen when hungry < 50)
- [x] Food consumption from ResourceSystem (1 processed food per meal)
- [x] Resident departure mechanics (leave after 24 game hours at hunger 0)
- [x] Visual feedback for hunger (color-coded green/orange/red)

## Discoveries

- Phaser Registry is good for cross-scene state sharing
- Vitest needs canvas mocks for any Phaser-related tests
- Room placement needs to account for grid alignment

## Blocked

(None currently)
