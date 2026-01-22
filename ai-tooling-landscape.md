# AI Development Tooling Landscape

> Last updated: Jan 20, 2026

---

## 🔄 Ralph / Ralph Playbook (Autonomous Loops)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [snarktank/ralph](https://github.com/snarktank/ralph) | 3.7k | 496 | CLI | PRD-driven, Amp CLI |
| [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) | 2.7k | 176 | CLI | Circuit breaker, 308 tests |
| [subsy/ralph-tui](https://github.com/subsy/ralph-tui) | 768 | 80 | TUI | Pause/resume, crash recovery |
| [mikeyobrien/ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) | 601 | 79 | CLI | Multi-agent, 920+ tests |
| [vercel-labs/ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent) | 514 | 57 | Framework | AI SDK, streaming |
| [ghuntley/how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) | 417 | 75 | Guide | Original by Geoff Huntley |
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | 274 | 75 | Guide | Full 3-phase methodology |
| [anthropic/ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) | — | — | Plugin | Official stop-hook |

---

## 📝 Speccing Out a Project (PRD/Discovery)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [github/spec-kit](https://github.com/github/spec-kit) | 62.3k | 5.4k | Framework | 4-stage gated workflow |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 30.7k | 4.1k | Framework | 21 agents, multi-phase |
| [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | 24.9k | 2.4k | MCP/CLI | PRD→Tasks, multi-IDE |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | 1.2k | Framework | Brownfield-first, lightweight |
| [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) | 12.5k | 1.5k | Framework | 54+ agents, swarm orchestration |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | 6k | 633 | Framework | PRD→Epic→Task→Issue |
| [clawdbot/clawdbot](https://github.com/clawdbot/clawdbot) | 5.3k | 830 | Assistant | Multi-channel, voice, A2UI |
| [asklokesh/loki-mode](https://github.com/asklokesh/claudeskill-loki-mode) | 515 | 103 | Skill | 37 agents, full startup |
| [anombyte93/prd-taskmaster](https://github.com/anombyte93/prd-taskmaster) | 44 | 8 | Skill | 12+ discovery questions |

---

## 🔍 Project Status / Gap Analysis (Brownfield/Audit)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [github/spec-kit](https://github.com/github/spec-kit) | 62.3k | 5.4k | Framework | `/speckit.analyze` |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | 1.2k | Framework | specs/ vs changes/ |
| [yusufkaraaslan/Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | 7.2k | 718 | Tool | Docs vs code conflicts |
| [anthropic/security-review](https://github.com/anthropics/claude-code-security-review) | 2.9k | 209 | Action | Security vulnerabilities |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | 28 | Framework | `/audit-duplicates`, code index |
| [kamilstanuch/codebase-digest](https://github.com/kamilstanuch/codebase-digest) | 347 | 28 | Tool | 60+ analysis prompts |
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | 274 | 75 | Guide | `PROMPT_plan.md` gap analysis |

---

## 🧠 Backpressure / Self-Learning / Custom Linting

*AI teaching itself, learning from mistakes, running its own validation*

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 30.7k | 4.1k | Framework | Quality gates, iterative refinement |
| [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) | 12.5k | 1.5k | Framework | `implement, test, fix, optimize` loop |
| [steveyegge/beads](https://github.com/steveyegge/beads) | 11.4k | 691 | Task Mgmt | Dependency-aware task graph |
| [steveyegge/gastown](https://github.com/steveyegge/gastown) | 4.7k | 400 | Orchestrator | GUPP: "If there's work on hook, RUN IT" |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | 28 | Framework | TDD-first, test gap analysis |
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | 274 | 75 | Guide | Tests as backpressure gates |

**Concept:** The playbook uses *backpressure* — tests/lints/typechecks that fail loop iterations until code passes. AI learns from failures, regenerates, retries.

---

## 🧪 AI Writing & Running Tests

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | 25.8k | 2.1k | MCP Server | Browser automation for LLMs |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | 8.2k | 423 | CLI | 93% less context, snapshot refs |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | 28 | Framework | TDD enforcement, test coverage |
| [autonomous-testing/testing-autonomy](https://github.com/autonomous-testing/testing-autonomy) | — | — | List | Curated autonomous testing tools |
| [Lindy Build](https://www.lindy.ai/blog/lindy-build) | — | — | SaaS | Self-testing app builder |

---

## 🌐 UI Testing / Browser Automation

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | 25.8k | 2.1k | MCP Server | Official, accessibility snapshots |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | 21.6k | 1.3k | MCP Server | Full DevTools access |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | 8.2k | 423 | CLI | Headless, Rust+Node |
| [executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright) | — | — | MCP Server | Claude Desktop/Cursor |
| [cloudflare/playwright-mcp](https://github.com/cloudflare/playwright-mcp) | — | — | MCP Server | Cloudflare Workers |
| **Claude Chrome Extension** | — | — | Extension | Built into Claude Code |

---

## 📋 Beads (Task Management)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [steveyegge/beads](https://github.com/steveyegge/beads) | 11.4k | 691 | CLI/MCP | Git-backed issue tracker |
| [Dicklesworthstone/beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) | — | — | TUI | Browse beads visually |

**What is Beads?**
- Distributed, git-backed graph issue tracker for AI agents
- Hash-based IDs (`bd-a1b2`) prevent merge conflicts
- Dependency-aware task selection
- Created by Steve Yegge

**Install:**
```bash
brew tap steveyegge/beads && brew install beads
pip install beads-mcp
```

---

## 🏭 Gas Town (Agent Orchestration)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [steveyegge/gastown](https://github.com/steveyegge/gastown) | 4.7k | 400 | Orchestrator | Multi-agent workspace manager |

**Key Concepts:**
- **Mayor** — Primary coordinator agent
- **Rigs** — Project containers (git repos)
- **Polecats** — Ephemeral worker agents
- **Hooks** — Git worktree-based persistent storage
- **GUPP** — "If there is work on your hook, YOU MUST RUN IT"

**Warning:** ~$100/hour in Claude tokens. Alpha quality.

**Install:**
```bash
go install github.com/steveyegge/gastown/cmd/gt@latest
```

---

## 🦞 Clawdbot (Multi-Channel Assistant)

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [clawdbot/clawdbot](https://github.com/clawdbot/clawdbot) | 5.3k | 830 | Assistant | WhatsApp, Telegram, Slack, Discord, iMessage |

**Features:**
- Voice wake + talk mode
- Canvas + A2UI (agent-driven visual workspace)
- Works on macOS, Linux, Windows (WSL2)
- Created by Peter Steinberger

---

## 🧹 Tech Debt Cleanup

*For: old specs vs new specs, multiple devs, changing direction, double-built features, components that should be shared*

### Dead Code / Unused Dependencies

| Tool | Stars | Forks | Language | Key Feature |
|------|-------|-------|----------|-------------|
| [webpro-nl/knip](https://github.com/webpro-nl/knip) | 10k | 343 | JS/TS | Unused deps, exports, files, duplicates |
| [jendrikseipp/vulture](https://github.com/jendrikseipp/vulture) | 4.3k | 177 | Python | 60-100% confidence scoring |
| [naver/scavenger](https://github.com/naver/scavenger) | 458 | 50 | Java | Runtime dead code analysis |
| [albertas/deadcode](https://github.com/albertas/deadcode) | — | — | Python | CLI, auto-fix |
| [line/tsr](https://github.com/line/tsr) | — | — | TS | Tree-shaking for source files |

### Duplicate / Conflicting Code

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | 351 | 28 | Framework | `/audit-duplicates`, CODE_INDEX.md |
| [yusufkaraaslan/Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | 7.2k | 718 | Tool | Docs vs code conflict detection |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 17.1k | 1.2k | Framework | Spec vs reality tracking |
| [CodeScene](https://codescene.com) | — | — | SaaS | 6x more accurate than SonarQube |
| [SonarQube](https://www.sonarsource.com/products/sonarqube/) | — | — | SaaS | 30+ languages, code smells |

### Refactoring / Consolidation

| Tool | Stars | Forks | Type | Key Feature |
|------|-------|-------|------|-------------|
| [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) | 12.5k | 1.5k | Framework | `implement, test, fix, optimize` |
| [github/spec-kit](https://github.com/github/spec-kit) | 62.3k | 5.4k | Framework | `/speckit.plan` for refactor roadmap |
| [kamilstanuch/codebase-digest](https://github.com/kamilstanuch/codebase-digest) | 347 | 28 | Tool | 60+ analysis prompts |

### Common Tech Debt Scenarios

| Problem | Tool | Approach |
|---------|------|----------|
| Old specs + new specs conflict | [OpenSpec](https://github.com/Fission-AI/OpenSpec) | `specs/` = truth, `changes/` = proposals |
| 3 devs built same thing | [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | `/audit-duplicates` finds semantic dupes |
| Dead code from pivots | [Knip](https://github.com/webpro-nl/knip) (JS/TS) or [Vulture](https://github.com/jendrikseipp/vulture) (Python) | Static analysis with confidence % |
| Shared components not extracted | [Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | Detects duplicate purpose across files |
| No single source of truth | [Beads](https://github.com/steveyegge/beads) | Git-backed task graph |

### Workflow for Messy Codebase

```bash
# 1. Index what exists
/update-code-index                    # claude-bootstrap

# 2. Find duplicates & dead code
/audit-duplicates                     # claude-bootstrap
npx knip                              # JS/TS projects
vulture .                             # Python projects

# 3. Reconcile specs vs reality
openspec init                         # Set up spec tracking
/openspec:proposal "consolidation"    # Document what should change

# 4. Create cleanup plan
/speckit.plan                         # Generate refactor roadmap

# 5. Execute with Ralph loop
ralph-tui run --prd ./cleanup.json    # Autonomous cleanup
```

---

## Quick Reference

| I want to... | Best Tool |
|--------------|-----------|
| Autonomous build loop | [Ralph TUI](https://github.com/subsy/ralph-tui) |
| Spec a greenfield project | [spec-kit](https://github.com/github/spec-kit) or [BMAD](https://github.com/bmad-code-org/BMAD-METHOD) |
| Audit existing codebase | [OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| Task management for agents | [Beads](https://github.com/steveyegge/beads) |
| Multi-agent orchestration | [Gas Town](https://github.com/steveyegge/gastown) or [claude-flow](https://github.com/ruvnet/claude-flow) |
| Browser testing | [Playwright MCP](https://github.com/microsoft/playwright-mcp) |
| DevTools debugging | [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) |
| Find duplicates | [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) |
| Dead code (JS/TS) | [Knip](https://github.com/webpro-nl/knip) |
| Dead code (Python) | [Vulture](https://github.com/jendrikseipp/vulture) |
| Specs vs code conflicts | [Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) |
| Multi-channel assistant | [clawdbot](https://github.com/clawdbot/clawdbot) |

---

## All Links

**Loop/Orchestration**
- [ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook)
- [ralph-tui](https://github.com/subsy/ralph-tui)
- [gastown](https://github.com/steveyegge/gastown)
- [claude-flow](https://github.com/ruvnet/claude-flow)

**Spec/PRD**
- [spec-kit](https://github.com/github/spec-kit)
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- [OpenSpec](https://github.com/Fission-AI/OpenSpec)
- [claude-task-master](https://github.com/eyaltoledano/claude-task-master)

**Task Management**
- [beads](https://github.com/steveyegge/beads)
- [ccpm](https://github.com/automazeio/ccpm)

**Browser/UI Testing**
- [playwright-mcp](https://github.com/microsoft/playwright-mcp)
- [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [agent-browser](https://github.com/vercel-labs/agent-browser)

**Audit/Analysis**
- [claude-bootstrap](https://github.com/alinaqi/claude-bootstrap)
- [Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers)
- [codebase-digest](https://github.com/kamilstanuch/codebase-digest)

**Tech Debt / Dead Code**
- [knip](https://github.com/webpro-nl/knip) — JS/TS unused deps/exports/files
- [vulture](https://github.com/jendrikseipp/vulture) — Python dead code
- [scavenger](https://github.com/naver/scavenger) — Java runtime analysis
- [CodeScene](https://codescene.com) — AI refactoring, code health
- [SonarQube](https://www.sonarsource.com/products/sonarqube/) — 30+ languages
