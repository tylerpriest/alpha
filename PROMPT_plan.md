# Planning Mode

You are in PLANNING mode. Generate or update the implementation plan only.

## Instructions

0a. Study `specs/*` with up to 250 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `src/lib/*` (if present) with up to 250 parallel Sonnet subagents to understand shared utilities & components.
0d. For reference, the application source code is in `src/*`.

1. Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use up to 500 Sonnet subagents to study existing source code in `src/*` and compare it against `specs/*`. Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented. Ultrathink. Consider searching for TODO, minimal implementations, placeholders, skipped/flaky tests, and inconsistent patterns. Study @IMPLEMENTATION_PLAN.md to determine starting point for research and keep it up to date with items considered complete/incomplete using subagents.

2. For each task in the plan, derive required tests from acceptance criteria in specs - what specific outcomes need verification (behavior, performance, edge cases). Tests verify WHAT works, not HOW it's implemented. Include as part of task definition. When deriving test requirements, identify whether verification requires programmatic validation (measurable, inspectable) or human-like judgment (perceptual quality, tone, aesthetics, UI/UX). Both types are equally valid backpressure mechanisms. For subjective criteria that resist programmatic validation, explore src/lib for non-deterministic evaluation patterns if available.

3. Consider searching for:
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

ULTIMATE GOAL: Build a SimTower-inspired vertical city simulation (Arcology) where residents live, work, and have needs. MVP includes: room placement, residents with hunger, food production chain, and basic economy.

Consider missing elements and plan accordingly. If an element is missing, search first to confirm it doesn't exist, then if needed author the specification at `specs/FILENAME.md`. If you create a new element then document the plan to implement it in @IMPLEMENTATION_PLAN.md using a subagent.
