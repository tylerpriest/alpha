# Development Principles

> Synthesized from AlphaOS, Ralph Playbook, and BYO methodologies

## 1. Research First

**"Understand deeply before writing a single line of code."**

Before building ANY feature:
- [ ] What exactly are we trying to achieve?
- [ ] How do similar games/apps handle this?
- [ ] What are the edge cases?
- [ ] Document findings in `specs/{FEATURE}.md`

### The Topic of Concern Test

**Good spec scope: Can you describe it in one sentence without "and"?**

- ✓ "The resident system handles movement between rooms"
- ✗ "The resident system handles hunger, jobs, relationships, and housing" → 4 topics

Each topic gets its own spec file.

## 2. DRY (Don't Repeat Yourself)

**"Never reinvent the wheel."**

| Don't Write | Use Instead |
|-------------|-------------|
| Custom physics | Engine built-in physics |
| UI framework | Existing UI library |
| State management | Simple patterns (Context, Zustand) |
| Save system | JSON + localStorage |
| Form validation | Zod + react-hook-form |

### Questions Before Writing Code

1. Does this already exist in the codebase?
2. Is there a library that does this?
3. Does the framework provide this?

## 3. Context Is Everything (Ralph)

**"One task per iteration = maximum smart zone."**

LLM context windows have a "smart zone" (40-60% utilization). Beyond that, quality degrades.

### Maximize Smart Zone

- Keep tasks small and focused
- Fresh context each iteration
- Use subagents for expensive searches
- Main agent schedules, subagents execute

### File-Based Memory

State persists across iterations via files:

| File | Purpose |
|------|---------|
| `specs/*` | Requirements (one per topic) |
| `IMPLEMENTATION_PLAN.md` | Prioritized task list |
| `AGENTS.md` | Operational learnings |
| `PROMPT.md` | Instructions per iteration |

## 4. Backpressure Beats Direction

**"Engineer an environment where wrong outputs get rejected automatically."**

Instead of telling the AI exactly what to do, create systems that reject incorrect outputs:

| Backpressure | How |
|--------------|-----|
| TypeScript | Compiler catches type errors |
| Tests | Test runner fails on broken code |
| Lint | Linter enforces style |
| Build | Must compile to proceed |
| Browser | Visual verification |

### The Loop

```
Write code → Run validation → Fix errors → Repeat until clean
```

This works because:
- Errors are specific and actionable
- No ambiguity about what "correct" means
- Each iteration makes progress

## 5. Planning vs Building Modes

**Never mix planning and implementation.**

| Mode | Output | Rule |
|------|--------|------|
| **Planning** | `IMPLEMENTATION_PLAN.md` only | NO implementation, NO commits |
| **Building** | Code + tests + commits | One task at a time from plan |

### When to Re-Plan

- Ralph implementing wrong things
- Duplicated efforts appearing
- Plan is stale or mismatched
- Significant spec changes
- Confusion about completion status

Re-planning is cheap. Do it often.

## Coding Standards

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | PascalCase for classes | `Resident.ts` |
| Functions | camelCase | `spawnResident()` |
| Types/Interfaces | PascalCase | `ResidentState` |
| Constants | UPPER_SNAKE | `MAX_FLOORS` |
| Private fields | underscore prefix | `_hunger` |

### Code Style

```typescript
// Early returns for error handling
function feedResident(resident: Resident, food: Food): boolean {
  if (!resident) return false;
  if (!food) return false;
  if (food.amount <= 0) return false;

  resident.hunger += food.nutrition;
  return true;
}

// Explicit types
interface Room {
  type: RoomType;
  floor: number;
  position: number;
  width: number;
}

// Comments explain WHY, not WHAT
// Hunger decreases faster during work to incentivize
// players to build kitchens near offices
const WORK_HUNGER_MULTIPLIER = 1.5;
```

### Anti-Patterns to Avoid

```typescript
// ❌ Magic numbers
if (hunger < 20) ...

// ✅ Named constants
const HUNGER_CRITICAL = 20;
if (hunger < HUNGER_CRITICAL) ...
```

```typescript
// ❌ Deep nesting
if (room) {
  if (room.type === 'apartment') {
    if (room.residents.length > 0) {
      doThing();
    }
  }
}

// ✅ Early returns
if (!room) return;
if (room.type !== 'apartment') return;
if (room.residents.length === 0) return;
doThing();
```

```typescript
// ❌ Over-abstraction
const provider = RoomFactoryBuilderProvider.getInstance();

// ✅ Direct, simple code
const room = new Apartment(floor, position);
```

## Error Recovery

When things go wrong:

1. **Don't assume not implemented** - Search first
2. **Update the plan** - Document findings for next iteration
3. **Small fixes** - One problem at a time
4. **Fresh start** - Re-plan if deeply confused

## Verification

Before considering anything "done":

- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Visual verification in browser
- [ ] Edge cases tested manually

## Sources

- [BYO (Build Your Own)](https://github.com/tylerpriest/byo/) - AI development methodology
- AlphaOS - Local branch `claude/minimal-os-macbook-hCCbL` in this repo
- [Geoffrey Huntley's Ralph](https://ghuntley.com/ralph/) - Original technique
- [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) - Original Ralph methodology
- [Ralph Claude Code Plugin](https://github.com/frankbria/ralph-claude-code) - External Ralph orchestrator
- [Official Ralph Wiggum Plugin](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md) - Built-in Claude Code plugin
