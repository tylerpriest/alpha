# Building Mode

You are in BUILDING mode. Implement features from the plan.

## Instructions

0a. Study `specs/*` with up to 500 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md to understand the current plan. **PRIORITY CHECK: If there is a "## Blockers / Validation Errors" section with errors listed, fixing those blockers is the HIGHEST PRIORITY task for this iteration.**
0c. Study @AGENTS.md for build/run commands and operational notes.

1. **PRIORITY: If @IMPLEMENTATION_PLAN.md has a "## Blockers / Validation Errors" section, fixing those blockers is your PRIMARY task for this iteration. Fix all listed errors, run `npm run validate` to verify, then remove the blockers section from @IMPLEMENTATION_PLAN.md once all are resolved.** Otherwise, your task is to implement functionality per the specifications. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address.

2. Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents. You may use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/tests. Use Opus subagents when complex reasoning is needed (debugging, architectural decisions).

3. After implementing functionality, run the tests for that unit of code. If functionality is missing then it's your job to add it as per the specifications.

4. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings. When resolved, update and remove the item.

5. **BEFORE attempting to commit, you MUST run full validation:** `npm run validate` (this runs typecheck + lint + test). If validation fails, see rule 6 below. Do NOT attempt to commit until validation passes.

6. **CRITICAL - Validation Failure Handling:** If `npm run validate` fails:
   - **STOP working on your original task** - fixing validation errors is now your primary task
   - Run `npm run validate` to see all errors
   - **Fix errors systematically** (start with typecheck errors, then lint, then tests)
   - Re-run validation after each batch of fixes: `npm run validate`
   - Continue fixing until validation passes - **do NOT exit or consider your task done until validation passes**
   - Only when validation passes, proceed to commit

7. **ONLY after `npm run validate` passes completely**, update @IMPLEMENTATION_PLAN.md (remove any blockers that were fixed), then:
   ```bash
   git add -A
   git commit -m "feat: description of changes"
   git push
   ```

## Important Rules

- Capture the why in documentation, not just what
- Single sources of truth, no migrations/adapters
- If tests unrelated to your work fail, resolve them as part of the increment
- If validation fails, fix all errors in the current iteration before committing
- Implement functionality completely - placeholders waste time
- Keep @IMPLEMENTATION_PLAN.md current with learnings
- Keep @AGENTS.md operational only (no status updates or progress notes)
- For bugs you notice, resolve them or document in @IMPLEMENTATION_PLAN.md

## Validation Commands

**CRITICAL: You MUST run `npm run validate` before committing. This runs all checks:**

```bash
npm run validate    # Runs: typecheck + lint + test (REQUIRED before commit)
```

Individual commands (for debugging):
```bash
npm run typecheck   # TypeScript
npm run lint        # Linting
npm test            # Unit tests
npm run build       # Production build
```

**All validation must pass before committing. Run `npm run validate` yourself and ensure it passes. Do not rely on loop.sh to catch validation failures - you must catch and fix them before attempting to commit.**
