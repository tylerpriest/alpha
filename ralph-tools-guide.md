# Ralph Tools Guide

## What is Ralph?

A bash loop that feeds an AI agent the same prompt until done. The prompt never changes, but the world does (via git/files).

```bash
while true; do claude -p "$(cat PROMPT.md)"; done
```

---

## The 3 Phases

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | **Greenfield / Martin** | Idea → Spec (discovery questions) |
| 2 | **Brownfield / Nelson** | Gap analysis (spec vs code) |
| 3 | **Build Loop** | Execute tasks until done |

---

## Best Tools by Phase

### Phase 1: Greenfield (Idea → Spec)

| Tool | Stars | Install |
|------|-------|---------|
| [BMAD-Method](https://github.com/bmad-method/bmad-method) | 19.1k | Multi-agent discovery |
| [spec-kit](https://github.com/github/spec-kit) | 62.3k | `/speckit.specify` |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | `/openspec:proposal` |
| [prd-taskmaster](https://github.com/anombyte93/prd-taskmaster) | 44 | 12+ questions skill |

### Phase 2: Brownfield (Gap Analysis)

| Tool | Stars | Install |
|------|-------|---------|
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | `specs/` vs `changes/` |
| [spec-kit](https://github.com/github/spec-kit) | 62.3k | `/speckit.analyze` |
| [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | `/audit-duplicates` |
| [Playbook](https://github.com/ClaytonFarr/ralph-playbook) | 274 | `PROMPT_plan.md` |

### Phase 3: Build Loop

| Tool | Stars | Best For |
|------|-------|----------|
| [Ralph TUI](https://github.com/subsy/ralph-tui) | 768 | Visibility, pause/resume |
| [ralph-claude-code](https://github.com/frankbria/ralph-claude-code) | 2.7k | Claude-only, battle-tested |
| [ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) | 601 | Multi-agent support |
| [Official plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) | — | Simple, built-in |

---

## Spec-Kit vs OpenSpec

| Aspect | [spec-kit](https://github.com/github/spec-kit) | [OpenSpec](https://github.com/Fission-AI/OpenSpec) |
|--------|----------|----------|
| Best for | Greenfield (0→1) | Brownfield (1→n) |
| Output | ~800 lines | ~250 lines |
| Style | Structured, gated | Fast, flexible |
| Team | Junior-friendly | Senior devs |

---

## Codebase Audit (Messy/Alpha)

| Tool | Purpose |
|------|---------|
| [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | `/audit-duplicates`, `/update-code-index` |
| [code-review plugin](https://github.com/anthropics/claude-code/tree/main/plugins/code-review) | Bug scan, security audit |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Spec vs reality gaps |

---

## Recommended Stacks

### Simple (One Tool)
```
spec-kit → covers all 3 phases
```

### Best-in-Class
```
BMAD (Phase 1) → OpenSpec (Phase 2) → Ralph TUI (Phase 3)
```

### For Messy Codebases
```
claude-bootstrap (audit) → OpenSpec (gap analysis) → Ralph TUI (fix loop)
```

---

## Quick Start

### Ralph TUI (Phase 3 only)
```bash
bun install -g ralph-tui
ralph-tui setup
ralph-tui run --prd ./prd.json
```

### Full Playbook (All Phases)
```bash
# Get playbook files
curl -sL https://raw.githubusercontent.com/ClaytonFarr/ralph-playbook/main/loop.sh > loop.sh
curl -sL https://raw.githubusercontent.com/ClaytonFarr/ralph-playbook/main/PROMPT_plan.md > PROMPT_plan.md
curl -sL https://raw.githubusercontent.com/ClaytonFarr/ralph-playbook/main/PROMPT_build.md > PROMPT_build.md
mkdir specs && touch IMPLEMENTATION_PLAN.md AGENTS.md

# Run
MODE=plan ./loop.sh   # Gap analysis
MODE=build ./loop.sh  # Build loop
```

### Claude-Bootstrap (Audit)
```bash
/plugin install alinaqi/claude-bootstrap
/update-code-index
/audit-duplicates
```

---

## Key Links

- [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) — Full methodology
- [Huntley's Original](https://github.com/ghuntley/how-to-ralph-wiggum) — Creator's repo
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) — 20k+ stars, all tools
