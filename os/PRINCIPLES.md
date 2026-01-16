# AlphaOS Development Principles

> Adapted from BYO methodology for OS development
> These principles guide all AlphaOS development

---

## Core Principles

### 1. Research First
**"Understand deeply before writing a single line of code."**

Before building ANY feature, complete this research checklist:

#### Step 1: Understand the Problem
- [ ] What exactly are we trying to achieve?
- [ ] What are the inputs and outputs?
- [ ] What are the constraints (memory, speed, hardware)?
- [ ] What could go wrong?

#### Step 2: Study Existing Solutions
- [ ] How does Linux handle this?
- [ ] How do other hobby OSes (ToaruOS, SerenityOS) do it?
- [ ] What does the official specification say?
- [ ] Are there reference implementations on GitHub?

#### Step 3: Understand the Hardware/Protocol
- [ ] Read the relevant specification (xHCI, NVMe, USB, etc.)
- [ ] Study datasheets for hardware-specific features
- [ ] Understand timing requirements and edge cases
- [ ] Document any reverse-engineered protocols

#### Step 4: Document Findings
Create `specs/{FEATURE}.md` with:
```markdown
# Feature: {NAME}

## Research Summary
- How Linux does it: ...
- How ToaruOS does it: ...
- Specification details: ...
- Key gotchas discovered: ...

## Requirements
...

## Implementation Approach
...
```

#### Research Sources (in order):
1. **Official specs** - Intel xHCI, NVMe spec, USB spec
2. **Linux kernel** - Production-quality reference (GPL - study only)
3. **OSDev Wiki** - Community knowledge base
4. **Hobby OS projects** - ToaruOS, SerenityOS, BareMetal
5. **GitHub search** - Portable implementations
6. **Blog posts/tutorials** - Explanations and gotchas

**The goal:** Never start coding while confused. If you can't explain how it works, you haven't researched enough.

---

### 2. DRY (Don't Repeat Yourself)
**"We never reinvent the wheel."**

#### Step 1: Search GitHub First
Before writing ANY complex component, search for existing implementations:
```
GitHub search: "{component} driver bare metal C"
GitHub search: "{component} minimal implementation"
GitHub search: "hobby OS {component}"
```

#### Step 2: Evaluate Existing Code
| Question | Action |
|----------|--------|
| Does working code exist? | Port it |
| Is it too complex? | Extract minimal subset |
| Is license compatible? | BSD/MIT/Apache = use, GPL = study only |
| Is it well-tested? | Prefer battle-tested code |

#### Step 3: Use Existing Implementations
See [docs/EXTERNAL_RESOURCES.md](docs/EXTERNAL_RESOURCES.md) for catalog of reusable code:

| Component | Don't Write | Use Instead |
|-----------|-------------|-------------|
| LLM inference | Custom transformer | llama2.c |
| Bootloader | Custom bootloader | Limine |
| TCP/IP stack | Custom networking | lwIP or picoTCP |
| TLS | Custom crypto | mbedTLS or BearSSL |
| USB xHCI | From scratch | Port SeaBIOS code |
| Apple SPI | Guess protocol | Port Linux applespi.c |
| NVMe | From scratch | Port nvme_uio |
| Compiler | Custom compiler | TinyCC |

#### Step 4: Within Our Code - No Duplication
```c
// BAD: Duplicated string functions
void console_strlen(...)
void llm_strlen(...)
void heap_strlen(...)

// GOOD: Single implementation
usize strlen(const char* s);  // in string.c, used everywhere
```

### 3. TDD-Ready (Test-Driven Development)
**Testing infrastructure exists; use it when valuable.**

- Unit tests for critical math/algorithms
- Integration tests for driver initialization
- Hardware tests on real MacBook
- QEMU tests for regression

**Test categories:**
```
tests/
├── unit/           # Pure function tests
│   ├── math_test.c
│   └── tokenizer_test.c
├── integration/    # Driver init tests
│   ├── pci_test.c
│   └── xhci_test.c
└── hardware/       # Real device tests
    └── macbook_test.c
```

### 4. Documentation as Code
**All docs live in `/docs` and `/specs`, version-controlled.**

- Specs written BEFORE implementation
- Update docs with code changes
- README reflects current state
- Comments explain WHY, not WHAT

**Documentation structure:**
```
os/
├── MASTER_PLAN.md          # Overall vision
├── IMPLEMENTATION_PLAN.md  # Current tasks
├── ARCHITECTURE.md         # System design
├── specs/                  # Feature specs
│   ├── INTERRUPTS.md
│   ├── NETWORKING.md
│   └── ...
└── docs/                   # Reference docs
    ├── hardware/
    └── protocols/
```

### 5. Feature-Based Organization
**Code organized by feature, not file type.**

```
# BAD: By file type
src/
├── drivers/
├── headers/
└── tests/

# GOOD: By feature
kernel/
├── memory/          # Heap, paging, etc.
├── input/           # Keyboard, trackpad
├── display/         # Console, GUI
├── ai/              # LLM, Claude integration
└── network/         # TCP/IP, TLS
```

---

## Architectural Standards

### Progressive Enhancement
**Start minimal, add complexity only when needed.**

1. **Phase 1:** Boot + display + basic input
2. **Phase 2:** Local LLM (offline capability)
3. **Phase 3:** Network + Claude Code
4. **Phase 4:** Storage + filesystem
5. **Phase 5:** Self-bootstrapping
6. **Phase 6:** GUI polish

**Never over-engineer early:**
```c
// BAD: Full feature from day 1
typedef struct {
    Window* windows[1024];
    CompositorEffect effects[256];
    AnimationQueue animations;
    ThemeEngine themes;
    // ... 50 more fields
} GuiSystem;

// GOOD: MVP first, extend later
typedef struct {
    u32* framebuffer;
    int width, height;
    // Add fields as needed
} Display;
```

### Hardware-First Security
**Enforce at lowest level possible.**

- Memory protection via page tables
- Interrupt isolation
- No user/kernel mixing until necessary
- Validate all external input (USB, network)

### Single Responsibility
**Each module does one thing well.**

| Module | Responsibility |
|--------|---------------|
| `heap.c` | Memory allocation only |
| `console.c` | Text output only |
| `llm.c` | Transformer inference only |
| `xhci.c` | USB host controller only |

---

## Coding Standards

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | lowercase with underscore | `apple_spi.c` |
| Functions | module_action | `console_printf()` |
| Types | PascalCase | `LlmTransformer` |
| Constants | UPPER_SNAKE | `MAX_TOKENS` |
| Globals | g_ prefix | `g_heap_base` |
| Statics | s_ prefix or module prefix | `s_cursor_x` |

### Code Style

```c
// Use explicit types from types.h
u8, u16, u32, u64    // Unsigned
i8, i16, i32, i64    // Signed
usize, isize         // Size types
bool                 // Boolean

// Early returns for error handling
int do_something(void* ptr) {
    if (!ptr) return -1;
    if (!validate(ptr)) return -2;

    // Main logic here
    return 0;
}

// Struct initialization
LlmConfig config = {
    .dim = 288,
    .hidden_dim = 768,
    .n_layers = 6,
    .n_heads = 6,
};

// Comments explain WHY
// Scale by head_size to normalize attention scores
// (prevents softmax saturation with large dimensions)
score /= sqrtf((float)head_size);
```

### Error Handling

```c
// Three tiers:
// 1. Return codes for recoverable errors
int result = driver_init();
if (result < 0) {
    console_printf("Driver init failed: %d\n", result);
    return result;
}

// 2. Assertions for programming errors
ASSERT(ptr != NULL, "Null pointer in critical path");

// 3. Panic for unrecoverable errors
if (!idt_loaded) {
    panic("IDT not loaded - cannot continue");
}
```

---

## Git Workflow

### Conventional Commits
```
feat: Add USB keyboard support
fix: Correct SPI timing for trackpad
docs: Update IMPLEMENTATION_PLAN.md
refactor: Extract common string functions
test: Add heap allocation tests
```

### Branch Strategy
```
main                    # Stable, tested
├── claude/feature-*    # Feature branches
└── release/v0.x        # Release branches
```

### PR Requirements
1. Passes CI (build + tests)
2. Updates relevant docs/specs
3. No regressions
4. Clear commit messages

---

## Ralph Methodology Integration

Every feature follows this loop:

```
1. SPEC    → Create specs/{FEATURE}.md
2. PLAN    → Update IMPLEMENTATION_PLAN.md
3. BUILD   → Implement incrementally
4. TEST    → Verify on QEMU + hardware
5. DOCS    → Update documentation
6. ITERATE → Repeat as needed
```

**Spec template:**
```markdown
# Feature: {NAME}

## Job To Be Done
{Problem being solved}

## Requirements
1. {Requirement}

## Acceptance Criteria
- [ ] {Criterion}

## Technical Notes
{Implementation hints}
```

---

## Anti-Patterns to Avoid

### Don't Do This

```c
// ❌ Magic numbers
if (status == 0x80) ...

// ✅ Named constants
#define USB_STATUS_READY 0x80
if (status == USB_STATUS_READY) ...
```

```c
// ❌ Deep nesting
if (a) {
    if (b) {
        if (c) {
            do_thing();
        }
    }
}

// ✅ Early returns
if (!a) return;
if (!b) return;
if (!c) return;
do_thing();
```

```c
// ❌ Commented-out code
// old_function();
// another_old_thing();
new_function();

// ✅ Delete unused code (git has history)
new_function();
```

```c
// ❌ Over-abstraction
AbstractFactoryBuilderProvider* provider =
    create_abstract_factory_builder_provider_instance();

// ✅ Direct, simple code
Heap* heap = heap_create(size);
```

---

## Ralph Playbook Principles

> From Geoffrey Huntley's autonomous AI coding methodology
> See: [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/)

### Context Is Everything
- Keep tasks small - one task per iteration
- Fresh context each loop keeps AI in "smart zone"
- Use subagents for expensive work, main agent as scheduler
- Prefer Markdown over JSON for token efficiency

### Backpressure Beats Direction
**Instead of telling the agent what to do, engineer an environment where wrong outputs get rejected automatically.**

| Backpressure Type | How |
|-------------------|-----|
| Tests | Run tests after each change |
| Type checks | Compiler catches errors |
| Lints | Style/format enforcement |
| Builds | Must compile |
| Hardware | Real device validation |

### File-Based Memory
State persists across iterations via files:

| File | Purpose |
|------|---------|
| `specs/*` | Requirements (one per topic of concern) |
| `IMPLEMENTATION_PLAN.md` | Prioritized task list with status |
| `AGENTS.md` | Operational learnings |
| `PROMPT.md` | Instructions loaded each iteration |

### Planning vs Building
Two distinct modes:

| Mode | Output | Rule |
|------|--------|------|
| **Planning** | `IMPLEMENTATION_PLAN.md` only | NO implementation, NO commits |
| **Building** | Code + tests + commits | One task at a time from plan |

### Loop Discipline
Each building iteration:
1. **Orient** - Study specs and source code
2. **Read plan** - Review `IMPLEMENTATION_PLAN.md`
3. **Select** - Pick most important unfinished task
4. **Investigate** - Search code ("don't assume not implemented")
5. **Implement** - Make changes
6. **Validate** - Run tests (backpressure)
7. **Update plan** - Mark done, capture learnings
8. **Commit & push** - Fresh context next iteration

### Key Language Patterns
- "study" (not "read") - implies deep understanding
- "don't assume not implemented" - always search first
- "capture the why" - document reasoning in commits/plan
- "if functionality is missing then it's your job to add it"

### Topic of Concern Test
Good spec scope: **Can you describe it in one sentence without "and"?**
- ✓ "The kernel handles interrupt routing"
- ✗ "The kernel handles interrupts, USB, and networking" → 3 topics

### Sit on the Loop, Not in It
Human role:
- Engineer conditions where good outcomes emerge
- Tune via prompt guardrails and code patterns
- Plan is disposable - regenerate when wrong
- Observe patterns, course-correct reactively

---

## Summary

### Core Development Principles
| Principle | Key Point |
|-----------|-----------|
| **Research First** | Understand deeply before coding |
| **DRY** | Search GitHub, never reinvent the wheel |
| **TDD-Ready** | Tests exist, use when valuable |
| **Docs as Code** | Specs before code |
| **Feature-Based** | Organize by feature |
| **Progressive** | Start simple, extend later |
| **Single Responsibility** | One job per module |

### Ralph Playbook Principles
| Principle | Key Point |
|-----------|-----------|
| **Context Is Everything** | One task per iteration, fresh context |
| **Backpressure Beats Direction** | Tests/builds reject bad outputs automatically |
| **File-Based Memory** | specs/, IMPLEMENTATION_PLAN.md persist state |
| **Planning vs Building** | Distinct modes, no mixing |
| **Topic of Concern Test** | One sentence without "and" |

*These principles ensure AlphaOS remains maintainable, testable, and focused on shipping a working AI-native OS.*
