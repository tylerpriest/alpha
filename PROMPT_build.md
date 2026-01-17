# Building Mode

You are in BUILDING mode. Implement features from the plan.

## Instructions

0a. Study `specs/*` with up to 500 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md to understand the current plan.
0c. Study @AGENTS.md for build/run commands and operational notes.
0d. Study `src/lib/*` (if present) with up to 250 parallel Sonnet subagents to understand shared utilities & components. For reference, the application source code is in `src/*`.

1. Your task is to implement functionality per the specifications using parallel subagents. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address. Tasks include required tests - implement tests as part of task scope. Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents. You may use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/tests. Use Opus subagents when complex reasoning is needed (debugging, architectural decisions).

2. After implementing functionality or resolving problems, run all required tests specified in the task definition. All required tests must exist and pass before the task is considered complete. Tests verify WHAT works (behavior, performance, edge cases) according to acceptance criteria in specs, not HOW it's implemented. If functionality is missing then it's your job to add it as per the application specifications. Ultrathink.

3. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings using a subagent. When resolved, update and remove the item.

4. When the tests pass, update @IMPLEMENTATION_PLAN.md using a subagent, then `git add -A` then `git commit` with a message describing the changes. After the commit, `git push`.

## Important Rules

999. Required tests derived from acceptance criteria must exist and pass before committing. Tests are part of implementation scope, not optional. Test-driven development approach: tests can be written first or alongside implementation.

9999. Create tests to verify implementation meets acceptance criteria. Include both conventional tests (behavior, performance, correctness) and perceptual quality tests (for subjective criteria like UI/UX, visual design, tone - see src/lib patterns if available). For UI/visual acceptance criteria, use browser testing with screenshots when needed. Take screenshots and verify visual requirements match acceptance criteria.

99999. Important: When authoring documentation, capture the why — tests and implementation importance.

999999. Important: Single sources of truth, no migrations/adapters. If tests unrelated to your work fail, resolve them as part of the increment.

9999999. As soon as there are no build or test errors create a git tag. If there are no git tags start at 0.0.0 and increment patch by 1 for example 0.0.1 if 0.0.0 does not exist.

99999999. You may add extra logging if required to debug issues.

999999999. Keep @IMPLEMENTATION_PLAN.md current with learnings using a subagent — future work depends on this to avoid duplicating efforts. Update especially after finishing your turn.

9999999999. When you learn something new about how to run the application, update @AGENTS.md using a subagent but keep it brief. For example if you run commands multiple times before learning the correct command then that file should be updated.

99999999999. For any bugs you notice, resolve them or document them in @IMPLEMENTATION_PLAN.md using a subagent even if it is unrelated to the current piece of work.

999999999999. IMPORTANT: Keep @AGENTS.md operational only — status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`. A bloated AGENTS.md pollutes every future loop's context.

9999999999999. When @IMPLEMENTATION_PLAN.md becomes large periodically clean out the items that are completed from the file using a subagent.

99999999999999. If you find inconsistencies in the specs/* then use an Opus subagent with 'ultrathink' requested to update the specs.

## Validation Commands

```bash
npm run typecheck   # TypeScript
npm run lint        # Linting
npm test            # Unit tests
npm run build       # Production build
```

All must pass before committing.
