# Ralph Loop Quick Start

From one-sentence idea to working software.

## Prerequisites

- Claude Code CLI installed
- Git repository initialized

---

## Phase 0: From Idea to Specs

Start with your idea. Claude helps you break it into specifications.

### Step 1: Describe Your Idea

Open Claude Code and describe what you want to build:

```
claude

> I want to build a SimTower-like vertical city simulation game
```

### Step 2: Identify Jobs To Be Done (JTBD)

Ask Claude to break it down:

```
> Help me identify the Jobs To Be Done for this project
```

Claude will suggest things like:
- Player places rooms in a tower
- Residents move in and have needs
- Economy flows through the building
- etc.

### Step 3: Create Specs for Each Topic

For each major topic, create a spec file:

```
mkdir -p specs
```

Ask Claude to draft each spec:

```
> Create a spec for the Resident system. Save it to specs/RESIDENTS.md
```

A good spec includes:
- Overview (one sentence, no "and")
- Must Have / Should Have / Nice to Have requirements
- Data model (TypeScript interfaces)
- Behavior description
- Acceptance criteria (checkboxes)
- Dependencies and open questions

See specs/RESIDENTS.md for an example.

### Step 4: Review and Refine

Read through each spec. Ask Claude to clarify or expand sections:

```
> The hunger mechanics aren't clear. Can you add more detail?
```

When specs feel complete, move to planning.

---

## Phase 1: Planning

Generate an implementation plan from your specs.

### Using loop.sh (External)

```
./loop.sh plan
```

Claude will:
1. Study all specs in specs/*
2. Examine existing code in src/*
3. Create/update IMPLEMENTATION_PLAN.md
4. NOT write any code

Press Ctrl+C when the plan looks complete.

Review the result:

```
cat IMPLEMENTATION_PLAN.md
```

### Using Claude Code Plugin

```
/ralph-loop "Study specs/* and create IMPLEMENTATION_PLAN.md. Do not implement. Output <promise>PLAN COMPLETE</promise> when done." --completion-promise "PLAN COMPLETE"
```

---

## Phase 2: Building

Implement the plan, one task at a time.

### Using loop.sh (External)

```
./loop.sh build
```

Each iteration:
1. Reads IMPLEMENTATION_PLAN.md
2. Picks top unfinished task
3. Implements it
4. Runs tests/lint/build
5. Commits and pushes
6. Loops back

Press Ctrl+C to stop.

### Using Claude Code Plugin

```
/ralph-loop "Implement tasks from IMPLEMENTATION_PLAN.md one at a time. Run tests after each. Update the plan. Output <promise>ALL TASKS COMPLETE</promise> when done."
```

Between major phases, manage context:

```
/clear    # Full reset
/compact  # Summarize and compress
```

To cancel:

```
/cancel-ralph
```

---

## Quick Reference

| Phase | loop.sh | Plugin |
|-------|---------|--------|
| Specs | Interactive Claude session | Interactive Claude session |
| Plan | ./loop.sh plan | /ralph-loop "create plan..." |
| Build | ./loop.sh build | /ralph-loop "implement..." |
| Stop | Ctrl+C | /cancel-ralph |

---

## Key Files

| File | Purpose | Who Updates |
|------|---------|-------------|
| specs/*.md | Requirements | You + Claude (Phase 0) |
| IMPLEMENTATION_PLAN.md | Task list | Claude (each iteration) |
| AGENTS.md | Operational learnings | Claude (when needed) |
| PROMPT_plan.md | Planning instructions | Rarely |
| PROMPT_build.md | Build instructions | Rarely |
| loop.sh | External loop script | Never |

---

## Spec Template

```markdown
# Feature Name

> One sentence description

## Overview
What this feature does.

## Requirements

### Must Have (MVP)
- ...

### Should Have
- ...

### Nice to Have (Post-MVP)
- ...

## Design

### Data Model
\`\`\`typescript
interface Example { ... }
\`\`\`

### Behavior
How it works...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies
- Other features this depends on

## Open Questions
- Unresolved decisions
```

---

## Troubleshooting

**Specs are too vague:**
- One topic per file. No "and" in the overview.
- Add concrete acceptance criteria.

**Plan is wrong:**
- Run ./loop.sh plan again. Re-planning is cheap.

**Claude implements wrong thing:**
- Stop, re-plan, add clarity to specs.

**Tests keep failing:**
- Usually self-corrects in 2-3 iterations.

**Stuck in a loop:**
- Ctrl+C or /cancel-ralph
- Check AGENTS.md for learnings
- Add hints if needed

---

## Next Steps

- Read RALPH_PLAYBOOK.md for deep methodology
- Read PRINCIPLES.md for coding standards
- Check game-patterns/ for implementation examples

---

## Sources

- [BYO (Build Your Own)](https://github.com/tylerpriest/byo/) - AI development methodology
- AlphaOS - Local branch `claude/minimal-os-macbook-hCCbL` in this repo
- [Geoffrey Huntley's Ralph](https://ghuntley.com/ralph/) - Original technique
- [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) - Original Ralph methodology
- [Ralph Claude Code Plugin](https://github.com/frankbria/ralph-claude-code) - External Ralph orchestrator
- [Official Ralph Wiggum Plugin](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md) - Built-in Claude Code plugin
