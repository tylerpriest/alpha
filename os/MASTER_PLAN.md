# AlphaOS Master Plan

> AI-Native Operating System for MacBook Pro A1706
> Goal: Usable out of the gate, self-bootstrapping, Claude Code integrated

**See also:** [PRINCIPLES.md](PRINCIPLES.md) - Development principles (DRY, TDD, etc.)

---

## Vision

An operating system where:
- **Claude Code is the primary interface** - Natural language commands, not shell syntax
- **Local LLM provides offline capability** - Works without internet
- **System can build itself** - Full toolchain included
- **Hardware works out of the gate** - Keyboard, trackpad, WiFi, Bluetooth
- **Ralph methodology built-in** - specs → plan → build loop for any task

---

## Phase 1: Foundation (Current State: 80% Complete)

### Completed
- [x] UEFI Boot via Limine
- [x] Framebuffer console (2560x1600)
- [x] Memory allocator (heap)
- [x] FPU/SSE support
- [x] Local LLM engine (llama2.c port)
- [x] Tokenizer loading
- [x] PCI enumeration
- [x] ACPI parsing
- [x] Demo AI interface

### Remaining
- [ ] **Interrupt Descriptor Table (IDT)** - Critical for real hardware
- [ ] **Timer interrupt** - For responsive input polling
- [ ] **xHCI device enumeration** - Complete USB keyboard support

---

## Phase 2: Input Hardware (Priority: HIGH)

### Keyboard (Internal - Apple SPI)
- [ ] Real GPIO MMIO mapping for CS pin control
- [ ] SPI controller initialization with correct timing
- [ ] Apple SPI protocol handshake
- [ ] Keyboard HID event parsing
- [ ] Key repeat and modifier handling

### Keyboard (External - USB Fallback)
- [ ] xHCI transfer ring polling
- [ ] USB HID interrupt endpoint
- [ ] Scancode to ASCII conversion (done)

### Trackpad (Apple SPI Multi-touch)
- [ ] Multi-touch protocol analysis (from Linux driver)
- [ ] Absolute positioning support
- [ ] Click detection
- [ ] Basic cursor rendering

### Status: Must have ONE working input method before Phase 3

---

## Phase 3: Networking (Priority: HIGH for Claude Code)

### WiFi (Broadcom BCM43xx)
- [ ] PCIe device initialization
- [ ] Firmware loading mechanism
- [ ] 802.11 association
- [ ] DHCP client
- [ ] TCP/IP stack (minimal)
- [ ] TLS 1.3 (for Claude API)

### Bluetooth (Broadcom)
- [ ] HCI transport over USB
- [ ] Device pairing
- [ ] HID profile (keyboard/mouse)
- [ ] Audio profile (optional)

### Fallback: USB Ethernet dongle
- [ ] CDC-ECM/NCM USB class driver
- [ ] Much simpler than WiFi
- [ ] Good for initial Claude Code testing

---

## Phase 4: Claude Code Integration (Priority: CRITICAL)

### Architecture
```
┌─────────────────────────────────────────────────┐
│                   AlphaOS                        │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────────────────┐ │
│  │ Local LLM   │    │     Claude Code         │ │
│  │ (Offline)   │    │  (Network Connected)    │ │
│  │             │    │                         │ │
│  │ - Basic     │    │  - Full reasoning       │ │
│  │   queries   │    │  - Tool use             │ │
│  │ - System    │    │  - Code generation      │ │
│  │   status    │    │  - Ralph methodology    │ │
│  └─────────────┘    └─────────────────────────┘ │
│         │                     │                 │
│         └──────────┬──────────┘                 │
│                    │                            │
│           ┌───────────────┐                     │
│           │  Unified AI   │                     │
│           │   Interface   │                     │
│           └───────────────┘                     │
│                    │                            │
│           ┌───────────────┐                     │
│           │   Terminal    │                     │
│           │   (Console)   │                     │
│           └───────────────┘                     │
└─────────────────────────────────────────────────┘
```

### Claude Code Features Required
- [ ] HTTPS client for api.anthropic.com
- [ ] Streaming response handling
- [ ] Tool definitions (file read/write, bash exec, etc.)
- [ ] Context management
- [ ] API key storage (secure)

### Tools Claude Code Needs
```c
// File operations
tool_read_file(path)
tool_write_file(path, content)
tool_list_directory(path)
tool_glob(pattern)
tool_grep(pattern, path)

// System operations
tool_bash(command)
tool_process_status()
tool_memory_info()

// Build operations
tool_compile(source, output)
tool_link(objects, output)
tool_make(target)
```

---

## Phase 5: Self-Bootstrapping (Priority: HIGH)

### Toolchain Components Needed

#### C Compiler (TinyCC or subset of GCC)
- [ ] Preprocessor
- [ ] Lexer/Parser
- [ ] Code generator (x86_64)
- [ ] Assembler
- [ ] Linker

#### Build System
- [ ] Make or equivalent
- [ ] Dependency tracking
- [ ] Incremental compilation

#### Source Control
- [ ] Git client (minimal)
- [ ] Diff/patch utilities

### Bootstrap Sequence
```
1. Boot AlphaOS from USB
2. Mount internal NVMe
3. Clone AlphaOS source (git)
4. Build toolchain (TinyCC)
5. Build AlphaOS kernel
6. Build AlphaOS userspace
7. Install to NVMe
8. Reboot into self-built system
```

### Storage Required
- [ ] NVMe driver (PCIe)
- [ ] Partition table parsing (GPT)
- [ ] Filesystem (ext4 or FAT32)
- [ ] File I/O syscalls

---

## Phase 6: GUI Foundation (Priority: MEDIUM)

### Minimal GUI Requirements
- [ ] Window compositor (simple)
- [ ] Mouse cursor rendering
- [ ] Basic window manager
- [ ] Text rendering (TrueType or bitmap)
- [ ] Terminal emulator window

### GUI Architecture
```
┌────────────────────────────────────────┐
│           Framebuffer (GOP)            │
├────────────────────────────────────────┤
│         Window Compositor              │
│  ┌──────────┐  ┌──────────┐           │
│  │ Terminal │  │  Status  │           │
│  │  Window  │  │   Bar    │           │
│  │          │  │          │           │
│  │ Claude>  │  │ CPU: 5%  │           │
│  │ _        │  │ MEM: 45% │           │
│  └──────────┘  └──────────┘           │
└────────────────────────────────────────┘
```

### Stretch: Touch Bar Integration
- [ ] T1 chip USB protocol
- [ ] Function key rendering
- [ ] Dynamic buttons

---

## Development Principles

> See [PRINCIPLES.md](PRINCIPLES.md) for full details

| Principle | Application |
|-----------|-------------|
| **DRY** | Use llama2.c, Limine, BearSSL - never reinvent |
| **TDD-Ready** | Tests for math, drivers, hardware |
| **Docs as Code** | Specs before implementation |
| **Feature-Based** | Organize by subsystem, not file type |
| **Progressive** | MVP first, extend incrementally |
| **Single Responsibility** | One job per module |

---

## Phase 7: Ralph Methodology Integration

### Built-in Workflow
When user says "build X" or "implement Y":

```
1. RESEARCH
   - Search codebase for related code
   - Check existing specs
   - Identify gaps

2. SPEC
   - Create specs/FEATURE_NAME.md
   - Define requirements
   - Define acceptance criteria

3. PLAN
   - Update IMPLEMENTATION_PLAN.md
   - Break into tasks
   - Identify dependencies

4. BUILD
   - Implement task by task
   - Test each component
   - Iterate on failures

5. VERIFY
   - Run tests
   - Check acceptance criteria
   - Update documentation
```

### Spec Template (Auto-generated)
```markdown
# Feature: {NAME}

## Job To Be Done
{What problem does this solve?}

## Requirements
1. {Requirement 1}
2. {Requirement 2}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Technical Notes
{Implementation hints}
```

---

## Hardware Support Matrix

| Component | Status | Driver | Priority |
|-----------|--------|--------|----------|
| CPU (Skylake/Kaby Lake) | Working | - | - |
| Display (Retina 2560x1600) | Working | GOP | - |
| Internal Keyboard (SPI) | Partial | applespi.c | HIGH |
| Internal Trackpad (SPI) | Not Started | - | HIGH |
| USB-C/Thunderbolt | Partial | xhci.c | MEDIUM |
| NVMe SSD | Not Started | - | HIGH |
| WiFi (BCM43xx) | Not Started | - | HIGH |
| Bluetooth | Not Started | - | MEDIUM |
| Touch Bar | Not Started | - | LOW |
| Touch ID | Not Possible | T1 locked | - |
| Audio | Not Started | - | LOW |
| Webcam | Not Started | - | LOW |

---

## Implementation Order

### Week 1-2: Get Input Working
1. Implement IDT + exception handlers
2. Complete xHCI device enumeration
3. Get USB keyboard working end-to-end
4. Test on real MacBook hardware

### Week 3-4: Get Network Working
1. USB Ethernet driver (simplest path)
2. Minimal TCP/IP stack
3. HTTPS client
4. Claude API integration

### Week 5-6: Storage & Filesystem
1. NVMe driver
2. GPT partition parsing
3. FAT32 or ext4 filesystem
4. File I/O operations

### Week 7-8: Self-Bootstrap
1. Port TinyCC or write minimal compiler
2. Build system (make equivalent)
3. Git client (minimal)
4. Self-compilation test

### Week 9-10: Polish
1. Trackpad support
2. WiFi driver (if time)
3. Basic GUI
4. Documentation

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Boots on MacBook Pro A1706
- [ ] Keyboard works (USB or internal)
- [ ] Can talk to Claude Code (via network)
- [ ] Local LLM works offline
- [ ] Can read/write files to storage

### Full Product
- [ ] All input devices work (keyboard, trackpad)
- [ ] WiFi networking
- [ ] Self-bootstrapping (can build itself)
- [ ] Basic GUI with terminal
- [ ] Ralph methodology integrated
- [ ] Bluetooth peripherals

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Apple SPI too complex | Can't use internal keyboard | USB keyboard fallback |
| WiFi driver too hard | Can't reach Claude API | USB Ethernet adapter |
| NVMe driver issues | Can't use internal storage | USB storage fallback |
| Not enough RAM for LLM | Poor local AI | Use smaller model (260K) |
| T1 chip blocks features | No Touch Bar/Touch ID | Accept limitation |

---

## File Structure (Target)

```
/home/user/alpha/os/
├── kernel/
│   ├── src/           # Kernel source
│   ├── include/       # Headers
│   └── arch/x86_64/   # Architecture-specific
├── drivers/
│   ├── input/         # Keyboard, trackpad
│   ├── storage/       # NVMe, filesystem
│   ├── network/       # WiFi, Ethernet, TCP/IP
│   └── usb/           # USB stack
├── ai/
│   ├── local/         # Local LLM
│   └── claude/        # Claude Code integration
├── userspace/
│   ├── shell/         # Terminal/shell
│   ├── gui/           # Window system
│   └── tools/         # Built-in utilities
├── toolchain/
│   ├── tcc/           # TinyCC compiler
│   ├── as/            # Assembler
│   └── ld/            # Linker
├── specs/             # Ralph methodology specs
├── boot/              # Bootloader config
├── scripts/           # Build scripts
└── docs/              # Documentation
```

---

## Quick Reference Commands

```bash
# Build kernel
make

# Build ISO (no AI)
make iso

# Build ISO with AI model
make download-model && make iso-with-model

# Run in QEMU
make run

# Clean build
make clean
```

---

## Version History

| Version | Milestone |
|---------|-----------|
| 0.1.0 | Initial boot |
| 0.2.0 | Console + display |
| 0.3.0 | PCI + ACPI |
| 0.4.0 | FPU/SSE + Math |
| 0.5.0 | AI framework + LLM |
| 0.6.0 | Input devices (next) |
| 0.7.0 | Networking |
| 0.8.0 | Storage + FS |
| 0.9.0 | Claude Code integration |
| 1.0.0 | Self-bootstrapping |

---

*This plan follows the Ralph playbook: comprehensive specs, clear implementation order, continuous iteration.*
