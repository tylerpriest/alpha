# Ralph Playbook

> Condensed methodology for AI-assisted autonomous development

## Core Concept

**"Three Phases, Two Prompts, One Loop"**

Ralph is a methodology for AI-assisted development that maximizes LLM effectiveness through:
- Fresh context each iteration
- File-based state persistence
- Backpressure-driven validation

## The Three Phases

### Phase 1: Define Requirements

Human + LLM conversation to:
1. Identify Jobs to Be Done (JTBD)
2. Break JTBDs into topics of concern
3. Create `specs/FILENAME.md` for each topic

### Phase 2: Planning Mode

Run `./loop.sh plan` to:
- Study specs and existing code
- Compare implementation against requirements
- Generate/update `IMPLEMENTATION_PLAN.md`
- **NO implementation, NO commits**

### Phase 3: Building Mode

Run `./loop.sh build` to:
- Select most important task from plan
- Implement one task
- Validate (tests, types, lint)
- Update plan with learnings
- Commit and push

## The Loop

```bash
while :; do cat PROMPT.md | claude ; done
```

Each iteration:
```
1. ORIENT    → Study specs using subagents
2. READ PLAN → Review IMPLEMENTATION_PLAN.md
3. SELECT    → Pick most important unfinished task
4. INVESTIGATE → Search code ("don't assume not implemented")
5. IMPLEMENT → Make changes
6. VALIDATE  → Run tests (single point of backpressure)
7. UPDATE    → Mark done, capture learnings
8. COMMIT    → git add -A && git commit && git push
```

Context clears after commit; next iteration starts fresh.

## Key Files

| File | Purpose | Updates |
|------|---------|---------|
| `specs/*` | Requirements | Rarely (human-driven) |
| `IMPLEMENTATION_PLAN.md` | Task list | Every iteration |
| `AGENTS.md` | Operational guide | When learnings emerge |
| `PROMPT_plan.md` | Planning instructions | Rarely |
| `PROMPT_build.md` | Building instructions | Rarely |

## Context Management

### The Smart Zone

- 200K tokens advertised ≈ 176K usable
- **Smart zone**: 40-60% utilization
- Beyond this, quality degrades

### Staying in Smart Zone

- **One task per iteration** = 100% smart zone
- **Fresh context** each loop prevents degradation
- **Subagents** for expensive operations (garbage collected)
- **File-based state** persists between iterations

## Subagent Patterns

### Parallel Reads
```
Study specs/* with up to 250 parallel Sonnet subagents
```

### Complex Reasoning
```
Use an Opus subagent to analyze findings and prioritize
```

### Single Validation
```
Only 1 subagent for build/tests (creates backpressure)
```

## Critical Mantras

### "Don't Assume Not Implemented"

The most common failure mode. Always search first:
```
Before making changes, search the codebase using Sonnet subagents
```

### "Capture the Why"

Documentation explains reasoning, not just what:
```
When authoring documentation, capture the why
```

### "Keep AGENTS.md Operational"

~60 lines max. Only build/run procedures:
```
Status, progress, and planning belong in IMPLEMENTATION_PLAN.md, not here
```

## When to Re-Plan

Switch to planning mode when:
- Implementing wrong things
- Duplicating efforts
- Plan is stale
- Specs changed significantly
- Confusion about what's done

Re-planning costs one iteration. Do it freely.

## Steering Ralph

### Upstream (Deterministic Setup)
- Consistent file loading order
- Existing code patterns shape generation
- Utilities demonstrate preferred approaches

### Downstream (Backpressure)
- Tests reject incorrect implementations
- Type checker catches errors
- Linter enforces style
- Build must succeed

### Signs and Guardrails

When Ralph fails a specific way, add corrective signals:
1. **Prompt guardrails** - Explicit instructions
2. **AGENTS.md** - Operational learnings
3. **Codebase patterns** - Example code

## Error Recovery

### Plan Regeneration
- "The plan is disposable"
- Regenerate when confused
- Costs one Planning iteration

### Manual Override
- `Ctrl+C` stops loop
- `git reset --hard` reverts changes
- Edit plan manually if needed

## Loop Script Usage

```bash
./loop.sh              # Build mode, unlimited
./loop.sh 20           # Build mode, max 20 iterations
./loop.sh plan         # Planning mode, unlimited
./loop.sh plan 5       # Planning mode, max 5 iterations
```

## Verification

Each task must pass before commit:
- [ ] Tests pass
- [ ] Types check
- [ ] Lint passes
- [ ] Build succeeds

If any fail, fix before committing.

## Philosophy

### "Let Ralph Ralph"

Trust the LLM's ability to:
- Self-identify issues
- Self-correct mistakes
- Self-improve approach

Achieve eventual consistency through iteration, not upfront perfection.

### "Move Outside the Loop"

Your job is to:
- Engineer the setup
- Observe and tune
- React to patterns

Not to direct each task.
