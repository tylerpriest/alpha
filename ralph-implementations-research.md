# Ralph Implementations Research

## Overview

Ralph (named after Ralph Wiggum from The Simpsons) is an AI development methodology created by **Geoffrey Huntley**. In its purest form, it's just a loop:

```bash
while true; do
  claude -p "$(cat PROMPT.md)"
done
```

The philosophy: *"Keep feeding an AI agent a task until the job is done."* The prompt never changes, but the world does (via git commits, files on disk).

---

## Top Ralph Implementations Table

| # | Repository | Type | Stars | Forks | Key Features |
|---|-----------|------|-------|-------|--------------|
| 1 | [github/spec-kit](https://github.com/github/spec-kit) | Framework/Skill | 62.3k | 5.4k | Spec-driven dev, Greenfield+Brownfield, 16+ agent support |
| 2 | [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | Framework/Skill | 17.1k | 1.2k | Spec management, 20+ AI tools, change proposals |
| 3 | [automazeio/ccpm](https://github.com/automazeio/ccpm) | Framework/CLI | 6k | 633 | PRD→Epic→Task→Issue pipeline, parallel agents |
| 4 | [snarktank/ralph](https://github.com/snarktank/ralph) | CLI/Agent | 3.7k | 496 | PRD-driven, TypeScript, Amp CLI integration |
| 5 | [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) | CLI | 2.7k | 176 | Rate limiting, circuit breaker, 308 tests |
| 6 | [mikeyobrien/ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) | CLI/Orchestrator | 601 | 79 | Multi-agent (Claude/Kiro/Gemini), 920+ tests |
| 7 | [vercel-labs/ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent) | Agent Framework | 514 | 57 | AI SDK integration, streaming, cost limits |
| 8 | [muratcankoylan/ralph-wiggum-marketer](https://github.com/muratcankoylan/ralph-wiggum-marketer) | Plugin/Agent | 456 | 53 | Marketing-focused, multi-agent content creation |
| 9 | [ghuntley/how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) | Playbook/Guide | 417 | 75 | Original methodology documentation |
| 10 | [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | Framework/Skill | 351 | 28 | Project init, TDD-first, security hooks, audits |
| 11 | [iannuttall/ralph](https://github.com/iannuttall/ralph) | CLI | 338 | 32 | Minimal file-based loop, multi-agent support |
| 12 | [gmickel/gmickel-claude-marketplace](https://github.com/gmickel/gmickel-claude-marketplace) | Plugin Suite | 330 | 19 | Flow-next with Ralph mode, multi-model reviews |
| 13 | [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | Playbook/Guide | 274 | 75 | Comprehensive methodology guide |
| 14 | [anombyte93/prd-taskmaster](https://github.com/anombyte93/prd-taskmaster) | Skill | 44 | 8 | 12+ discovery questions, PRD generation |
| 15 | [serpro69/claude-starter-kit](https://github.com/serpro69/claude-starter-kit) | Starter Kit | 37 | 5 | Analysis-process skill, idea→PRD workflow |
| 16 | [syuya2036/ralph-loop](https://github.com/syuya2036/ralph-loop) | CLI | 4 | 2 | Agent-agnostic (Claude/Codex/Gemini/Ollama) |
| 17 | [pvelleleth/specprint](https://github.com/pvelleleth/specprint) | Desktop App | 3 | 1 | PRD→Kanban, Git integration, local storage |
| 18 | [dial481/ralph](https://github.com/dial481/ralph) | Plugin | 0 | 2 | Post-CVE-2025-54795 security fix |
| 19 | [thecgaigroup/ralph-cc-loop](https://github.com/thecgaigroup/ralph-cc-loop) | CLI | 0 | 0 | 12 embedded skills, dual execution modes |
| 20 | [anthropics/claude-code (ralph-wiggum plugin)](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) | Official Plugin | N/A | N/A | Stop hook implementation, /ralph-loop command |

---

## Categorization by Use Case

### Pure Loop Implementations (The Ralph Core)

These implement the basic autonomous iteration pattern:

| Tool | Description |
|------|-------------|
| [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) | Most mature CLI with rate limiting, circuit breaker, dual-exit gate |
| [mikeyobrien/ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) | Multi-agent orchestrator supporting Claude/Kiro/Gemini |
| [anthropics/ralph-wiggum plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) | Official stop-hook based implementation |
| [vercel-labs/ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent) | AI SDK integration with cost/token limits |
| [iannuttall/ralph](https://github.com/iannuttall/ralph) | Minimal file-based loop |
| [syuya2036/ralph-loop](https://github.com/syuya2036/ralph-loop) | Agent-agnostic bash orchestration |

### Greenfield / Martin Ideation (0→1, Spec Generation)

Tools that help go from idea to comprehensive PRD/spec through structured questioning:

| Tool | Key Features |
|------|--------------|
| [github/spec-kit](https://github.com/github/spec-kit) | `/speckit.specify` - Define requirements, `/speckit.constitution` - Project principles |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | `/openspec:proposal` - Draft change specs with structured tasks |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | `/pm:prd-new` - Guided brainstorming for requirements |
| [anombyte93/prd-taskmaster](https://github.com/anombyte93/prd-taskmaster) | **12+ targeted questions** to extract complete requirements |
| [serpro69/claude-starter-kit](https://github.com/serpro69/claude-starter-kit) | `analysis-process` skill - Idea→PRD/design/spec/plan |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | `/initialize-project` - Full spec generation workflow |
| [snarktank/ralph](https://github.com/snarktank/ralph) | Integrated PRD skills with structured user stories |
| [pvelleleth/specprint](https://github.com/pvelleleth/specprint) | Desktop app: PRD editor with AI-powered task generation |

### Brownfield / Nelson GAP Analysis (Audit, Code Analysis)

Tools for analyzing existing codebases and identifying gaps:

| Tool | Key Features |
|------|--------------|
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | **PLANNING mode** - Gap analysis (specs vs code), prioritized TODO generation |
| [github/spec-kit](https://github.com/github/spec-kit) | `/speckit.analyze` - Cross-artifact consistency validation |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | `/pm:prd-parse` - Convert PRD to technical epic with dependency mapping |
| [alinaqi/claude-bootstrap](https://github.com/alinaqi/claude-bootstrap) | `/code-review` - Severity-based blocking, duplicate detection, security scanning |
| [thecgaigroup/ralph-cc-loop](https://github.com/thecgaigroup/ralph-cc-loop) | `/qa-audit`, `/test-coverage`, `/a11y-audit`, `/perf-audit` skills |
| [gmickel/flow-next](https://github.com/gmickel/gmickel-claude-marketplace) | Re-anchoring per task - reads specs + git state to prevent drift |

### Full Pipeline (Greenfield + Brownfield + Loop)

Complete systems covering the entire workflow:

| Tool | Description |
|------|-------------|
| [github/spec-kit](https://github.com/github/spec-kit) | Most comprehensive: spec→plan→tasks→implement with validation |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | PRD→Epic→Task→Issue→Code→Commit pipeline |
| [ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook) | 3-phase methodology: Define→Plan→Build |
| [snarktank/ralph](https://github.com/snarktank/ralph) | PRD creation→JSON conversion→Loop execution→Validation |

---

## The Ralph Methodology (from the Playbook)

### Phase 1: Define Requirements (Greenfield/Martin)
- Discuss project ideas → identify Jobs to Be Done (JTBD)
- Break JTBD into topics of concern
- **Test:** "Can you describe it in one sentence without 'and'?"
- Subagents load context and generate specs per topic

### Phase 2: Planning Mode (Brownfield/Nelson)
- Gap analysis: compare specs against existing code
- **Critical:** "Don't assume not implemented" - search first
- Output: Prioritized implementation plan (regenerable artifact)
- No code generation, no commits

### Phase 3: Building Mode (The Loop)
- Pick highest priority task from plan
- Implement with fresh context isolation
- Run backpressure (tests, typecheck, lint)
- Commit changes, update plan
- Loop restarts immediately

### Key Principles
- **Context efficiency:** ~176K usable tokens from 200K budget
- **One task per loop:** 100% smart zone context utilization
- **Files as memory:** Git commits and progress files persist across iterations
- **Eventual consistency:** Self-correction through iteration
- **Sandboxing required:** "It's not if it gets popped, it's when"

---

## Sources

- [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) - Clayton Farr's comprehensive guide
- [How to Ralph Wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) - Geoff Huntley's original
- [Brief History of Ralph](https://www.humanlayer.dev/blog/brief-history-of-ralph) - HumanLayer
- [Paddo.dev Ralph Wiggum Guide](https://paddo.dev/blog/ralph-wiggum-autonomous-loops/)
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) - 20.3k stars


[https://github.com/snarktank/ralph](https://github.com/snarktank/ralph)
[https://github.com/mikeyobrien/ralph-orchestrator](https://github.com/mikeyobrien/ralph-orchestrator)

[https://github.com/subsy/ralph-tui](https://github.com/subsy/ralph-tui)
[https://github.com/frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code)
[https://github.com/ClaytonFarr/ralph-playbook](https://github.com/ClaytonFarr/ralph-playbook)

[https://github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)
[https://github.com/github/spec-kit](https://github.com/github/spec-kit)
[https://github.com/automazeio/ccpm](https://github.com/automazeio/ccpm)