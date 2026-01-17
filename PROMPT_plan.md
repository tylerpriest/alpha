# Planning Mode

You are in PLANNING mode. Generate or update the implementation plan only.

## Instructions

0a. Study `specs/*` with up to 250 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `src/` with up to 250 parallel Sonnet subagents to understand existing code patterns.

1. Use up to 500 Sonnet subagents to study existing source code in `src/*` and compare it against `specs/*`. Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted by priority of items yet to be implemented.

2. Consider searching for:
   - TODO comments
   - Minimal implementations
   - Placeholders
   - Skipped/flaky tests
   - Inconsistent patterns

**IMPORTANT**: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first.

## Output

Update @IMPLEMENTATION_PLAN.md with:
- Clear task descriptions
- Priority ordering
- Dependencies noted
- Completion status

## Ultimate Goal

Build a SimTower-inspired vertical city simulation (Arcology) where residents live, work, and have needs. MVP includes: room placement, residents with hunger, food production chain, and basic economy.

Consider missing elements and plan accordingly. If an element is missing, search first to confirm it doesn't exist, then if needed author the specification at `specs/FILENAME.md`.
