# Building Mode

You are in BUILDING mode. Implement features from the plan.

## Instructions

0a. Study `specs/*` with up to 500 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md to understand the current plan.
0c. Study @AGENTS.md for build/run commands and operational notes.

1. Your task is to implement functionality per the specifications. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address.

2. Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents. You may use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/tests. Use Opus subagents when complex reasoning is needed (debugging, architectural decisions).

3. After implementing functionality, run the tests for that unit of code. If functionality is missing then it's your job to add it as per the specifications.

4. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings. When resolved, update and remove the item.

5. When the tests pass, run validation before committing (see @AGENTS.md for commands), then update @IMPLEMENTATION_PLAN.md, then:
   ```bash
   git add -A
   git commit -m "feat: description of changes"
   git push
   ```

## Important Rules

- Capture the why in documentation, not just what
- Single sources of truth, no migrations/adapters
- If tests unrelated to your work fail, resolve them as part of the increment
- Implement functionality completely - placeholders waste time
- Keep @IMPLEMENTATION_PLAN.md current with learnings
- Keep @AGENTS.md operational only (no status updates or progress notes)
- For bugs you notice, resolve them or document in @IMPLEMENTATION_PLAN.md
