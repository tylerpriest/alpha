# All Ralph & Spec-Driven Development Tools

> Last updated: Jan 20, 2026

## Master Table

### 🔄 Ralph Loop Implementations (Phase 3: Build)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [snarktank/ralph](https://github.com/snarktank/ralph) | 3.7k | 496 | CLI | PRD-driven, Amp CLI |
| [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) | 2.7k | 176 | CLI | Circuit breaker, 308 tests |
| [subsy/ralph-tui](https://github.com/subsy/ralph-tui) | 768 | 80 | TUI | Pause/resume, crash recovery |
| [mikeyobrien/ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) | 601 | 79 | CLI | Multi-agent, 920+ tests |
| [vercel-labs/ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent) | 514 | 57 | Framework | AI SDK, streaming |
| [muratcankoylan/ralph-wiggum-marketer](https://github.com/muratcankoylan/ralph-wiggum-marketer) | 456 | 53 | Plugin | Marketing content loops |
| [ghuntley/how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) | 417 | 75 | Guide | Original methodology |
| [iannuttall/ralph](https://github.com/iannuttall/ralph) | 338 | 32 | CLI | Minimal, multi-agent |
| [gmickel/flow-next](https://github.com/gmickel/gmickel-claude-marketplace) | 330 | 19 | Plugin | Multi-model reviews |
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | 274 | 75 | Guide | Full 3-phase methodology |
| [factory-ben/ralph](https://github.com/factory-ben/ralph) | 47 | 8 | CLI | Factory Droid |
| [syuya2036/ralph-loop](https://github.com/syuya2036/ralph-loop) | 4 | 2 | CLI | Agent-agnostic |
| [dial481/ralph](https://github.com/dial481/ralph) | 0 | 2 | Plugin | CVE-2025 security fix |
| [anthropic/ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) | — | — | Plugin | Official, stop-hook |

---

### 📝 Speccing Out a Project (Phase 1: Greenfield)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [github/spec-kit](https://github.com/github/spec-kit) | 62.3k | 5.4k | Framework | 4-stage gated workflow |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 30.7k | 4.1k | Framework | 21 agents, multi-phase |
| [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | 24.9k | 2.4k | MCP/CLI | PRD→Tasks, multi-IDE |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | 1.2k | Framework | Lightweight, fast |
| [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) | 12.5k | 1.5k | Framework | 54+ agents, swarm orchestration |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | 6k | 633 | Framework | PRD→Epic→Task→Issue |
| [clawdbot/clawdbot](https://github.com/clawdbot/clawdbot) | 5.3k | 830 | Assistant | Multi-channel, voice, A2UI |
| [asklokesh/loki-mode](https://github.com/asklokesh/claudeskill-loki-mode) | 515 | 103 | Skill | 37 agents, full startup |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | 28 | Framework | TDD-first, security |
| [anombyte93/prd-taskmaster](https://github.com/anombyte93/prd-taskmaster) | 44 | 8 | Skill | 12+ discovery questions |
| [serpro69/claude-starter-kit](https://github.com/serpro69/claude-starter-kit) | 37 | 5 | Starter | analysis-process skill |
| [pvelleleth/specprint](https://github.com/pvelleleth/specprint) | 3 | 1 | Desktop | PRD→Kanban GUI |

---

### 🔍 Checking Project Status (Phase 2: Brownfield/Audit)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [github/spec-kit](https://github.com/github/spec-kit) | 62.3k | 5.4k | Framework | `/speckit.analyze` |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | 1.2k | Framework | specs/ vs changes/ |
| [yusufkaraaslan/Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | 7.2k | 718 | Tool | Docs vs code conflicts |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | 6k | 633 | Framework | Full audit trail |
| [anthropic/security-review](https://github.com/anthropics/claude-code-security-review) | 2.9k | 209 | Action | Security vulnerabilities |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | 28 | Framework | `/audit-duplicates` |
| [kamilstanuch/codebase-digest](https://github.com/kamilstanuch/codebase-digest) | 347 | 28 | Tool | 60+ analysis prompts |
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | 274 | 75 | Guide | `PROMPT_plan.md` gap analysis |
| [anthropic/code-review](https://github.com/anthropics/claude-code/tree/main/plugins/code-review) | — | — | Plugin | Multi-agent PR review |

---

## Quick Reference

### By Use Case

| I want to... | Best Tool |
|--------------|-----------|
| Start from scratch (0→1) | [spec-kit](https://github.com/github/spec-kit) or [task-master](https://github.com/eyaltoledano/claude-task-master) |
| Add features to existing code (1→n) | [OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| Run autonomous build loop | [Ralph TUI](https://github.com/subsy/ralph-tui) |
| Find duplicates/dead code | [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) |
| Security audit | [claude-code-security-review](https://github.com/anthropics/claude-code-security-review) |
| Docs vs code gaps | [Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) |
| Full PRD→Deploy autonomy | [loki-mode](https://github.com/asklokesh/claudeskill-loki-mode) |

### By Team Size

| Team | Recommended Stack |
|------|-------------------|
| Solo dev | OpenSpec + Ralph TUI |
| Small team | spec-kit (all-in-one) |
| Enterprise | BMAD + spec-kit + ralph-orchestrator |

---

## All Links

**Playbooks & Guides**
- [ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) — Clayton Farr's comprehensive guide
- [how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) — Geoff Huntley's original
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — 20k+ stars, curated list

**Spec Frameworks**
- [spec-kit](https://github.com/github/spec-kit) — GitHub's official
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) — 21 agents, multi-phase
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) — Brownfield-first
- [claude-task-master](https://github.com/eyaltoledano/claude-task-master) — PRD→Tasks
- [claude-flow](https://github.com/ruvnet/claude-flow) — Swarm orchestration
- [clawdbot](https://github.com/clawdbot/clawdbot) — Multi-channel assistant

**Loop Implementations**
- [ralph-tui](https://github.com/subsy/ralph-tui) — Best visibility
- [ralph-claude-code](https://github.com/frankbria/ralph-claude-code) — Most tested
- [ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) — Multi-agent

**Audit Tools**
- [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) — Duplicates, index
- [claude-code-security-review](https://github.com/anthropics/claude-code-security-review) — Security
- [Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) — Doc/code conflicts
- [codebase-digest](https://github.com/kamilstanuch/codebase-digest) — Analysis prompts
