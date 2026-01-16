# AlphaOS Implementation Plan

> Comprehensive gap analysis and task tracking
> Following Ralph methodology: specs → plan → build → iterate

## Status Legend
- `[x]` Complete
- `[~]` Partial (needs work)
- `[ ]` Pending

---

## Phase 1: Foundation (v0.1-0.5) ✅ COMPLETE

### Boot & Display
- [x] UEFI boot via Limine
- [x] GOP framebuffer initialization
- [x] Console text rendering
- [x] 2560x1600 Retina support

### Memory & CPU
- [x] Heap allocator (kmalloc/kfree)
- [x] FPU/SSE initialization
- [x] Math library (exp, sqrt, sin, cos)

### Device Discovery
- [x] PCI enumeration
- [x] ACPI table parsing
- [x] Apple SPI device detection (ACPI)

### AI Engine
- [x] LLM transformer inference (llama2.c port)
- [x] Tokenizer loading from binary
- [x] Model loading from Limine modules
- [x] Demo mode fallback
- [x] stories260K + tok512 working

---

## Phase 2: Input Hardware (v0.6) 🔄 IN PROGRESS

### Critical: Interrupt Handling
- [x] **Interrupt Descriptor Table (IDT)** - Complete
- [x] Exception handlers (div0, page fault, GPF) - Complete
- [x] Timer interrupt (PIT 100Hz) - Complete
- [x] Hardware IRQ routing - Complete
- **Spec:** `specs/INTERRUPTS.md`

### Keyboard - USB (Fallback)
- [x] xHCI controller init
- [x] xHCI device enumeration
- [x] USB device slot allocation
- [~] USB interrupt endpoint polling (using control transfers)
- [x] USB HID scancode parsing
- **Spec:** `specs/MODEL_LOADING.md` (USB section)

### Keyboard - Internal (Apple SPI)
- [x] Protocol analysis from Linux driver
- [x] SPI packet structures defined
- [x] GPIO control framework with pin scanning
- [x] GPIO MMIO mapping (Sunrise Point-LP)
- [x] SPI controller timing (~8MHz)
- [x] Auto-scan known GPIO CS pins on boot
- [ ] **End-to-end keyboard test on real MacBook**
- **Spec:** `specs/TOKENIZER.md` (input section)
- **Note:** Needs testing on real A1706 hardware

### Trackpad
- [x] Protocol documented (from Linux)
- [x] Finger position parsing
- [x] Coordinate scaling to screen
- [x] Click detection (physical + Force Touch)
- [x] Cursor movement integration
- [x] 16x16 arrow cursor rendering
- [ ] **End-to-end test on real MacBook**
- **Spec:** `specs/TRACKPAD.md`
- **Note:** Needs testing on real A1706 hardware

---

## Phase 3: Networking (v0.7)

### USB Ethernet (Recommended First)
- [ ] CDC-ECM/NCM class driver
- [ ] Ethernet frame handling
- [ ] MAC address configuration
- **Spec:** `specs/NETWORKING.md`

### TCP/IP Stack
- [ ] IPv4 implementation
- [ ] ARP for address resolution
- [ ] DHCP client
- [ ] TCP client (connect, send, recv)
- [ ] DNS resolver
- **Spec:** `specs/NETWORKING.md`

### TLS & HTTPS
- [ ] TLS 1.3 client (BearSSL or mbedTLS)
- [ ] Certificate validation (or skip for now)
- [ ] HTTPS client
- **Spec:** `specs/NETWORKING.md`

### WiFi (Optional - Complex)
- [ ] BCM43xx PCIe driver
- [ ] Firmware loading
- [ ] 802.11 association
- [ ] WPA2 authentication
- **Spec:** `specs/NETWORKING.md`

### Bluetooth (Optional)
- [ ] HCI over USB
- [ ] Device pairing
- [ ] HID profile
- **Spec:** Not yet created

---

## Phase 4: Claude Code Integration (v0.8)

### API Client
- [ ] HTTPS connection to api.anthropic.com
- [ ] Streaming SSE response parsing
- [ ] JSON request/response handling
- [ ] API key storage
- **Spec:** `specs/CLAUDE_CODE.md`

### Tool System
- [ ] File read/write tools
- [ ] Bash execution tool
- [ ] Directory listing tool
- [ ] Grep/glob search tools
- [ ] Build tools (compile, link, make)
- **Spec:** `specs/CLAUDE_CODE.md`

### Integration
- [ ] System prompt with AlphaOS context
- [ ] Conversation history
- [ ] Tool result handling
- [ ] Offline fallback to local LLM
- **Spec:** `specs/CLAUDE_CODE.md`

---

## Phase 5: Storage & Filesystem (v0.9)

### NVMe Driver
- [ ] PCIe MMIO mapping
- [ ] Admin queue setup
- [ ] I/O queue setup
- [ ] Identify command
- [ ] Read/write commands
- **Spec:** `specs/STORAGE.md`

### Partition Support
- [ ] GPT header parsing
- [ ] Partition enumeration
- [ ] Boot partition detection
- **Spec:** `specs/STORAGE.md`

### Filesystem
- [ ] FAT32 implementation
- [ ] File open/read/write/close
- [ ] Directory operations
- [ ] Path resolution
- **Spec:** `specs/STORAGE.md`

---

## Phase 6: Self-Bootstrapping (v1.0)

### Toolchain
- [ ] Port TinyCC compiler
- [ ] x86_64 code generation
- [ ] ELF64 output
- [ ] Preprocessor support
- **Spec:** `specs/BOOTSTRAP.md`

### Build System
- [ ] Make-compatible tool
- [ ] Dependency tracking
- [ ] Incremental builds
- **Spec:** `specs/BOOTSTRAP.md`

### Version Control
- [ ] Minimal git client
- [ ] Clone/pull/commit/push
- [ ] HTTP(S) smart protocol
- **Spec:** `specs/BOOTSTRAP.md`

### Self-Compilation Test
- [ ] Build TinyCC with TinyCC
- [ ] Build AlphaOS kernel
- [ ] Boot self-compiled system
- **Spec:** `specs/BOOTSTRAP.md`

---

## Phase 7: GUI (v1.1+)

### Window System
- [ ] Double-buffered compositor
- [ ] Window management
- [ ] Z-ordering
- [ ] Window dragging
- **Spec:** `specs/GUI.md`

### Cursor
- [ ] Cursor rendering
- [ ] Trackpad/mouse integration
- [ ] Cursor themes
- **Spec:** `specs/GUI.md`

### Terminal Window
- [ ] GUI terminal widget
- [ ] Scrollback buffer
- [ ] ANSI color support
- **Spec:** `specs/GUI.md`

### Status Bar
- [ ] System info display
- [ ] Network status
- [ ] AI status
- **Spec:** `specs/GUI.md`

---

## Spec Documents

| Spec | Status | Priority |
|------|--------|----------|
| `specs/INTERRUPTS.md` | New | CRITICAL |
| `specs/NETWORKING.md` | New | HIGH |
| `specs/STORAGE.md` | New | HIGH |
| `specs/CLAUDE_CODE.md` | New | HIGH |
| `specs/BOOTSTRAP.md` | New | HIGH |
| `specs/TRACKPAD.md` | New | MEDIUM |
| `specs/GUI.md` | New | MEDIUM |
| `specs/LLM_INFERENCE.md` | Complete | - |
| `specs/MODEL_LOADING.md` | Complete | - |
| `specs/TOKENIZER.md` | Complete | - |
| `specs/AI_INTERFACE.md` | Complete | - |

---

## Immediate Next Actions

### Real Hardware Testing (PRIORITY)
1. [x] Implement IDT (exception handlers) ✓
2. [x] Add timer interrupt (PIT 100Hz) ✓
3. [x] Complete xHCI device enumeration ✓
4. [ ] **Test USB keyboard on real MacBook**
5. [ ] **Debug Apple SPI on real hardware**
6. [ ] Verify GPIO pin scanning finds keyboard

### Week 3-4: Get Online
1. [ ] USB Ethernet driver (CDC-ECM)
2. [ ] Minimal TCP/IP stack
3. [ ] DHCP for IP configuration
4. [ ] Test network connectivity

### Week 5-6: Claude Code Working
1. [ ] TLS client integration
2. [ ] Claude API client
3. [ ] Tool implementations
4. [ ] Test Claude Code interaction

### Week 7-8: Storage & Files
1. [ ] NVMe driver
2. [ ] FAT32 filesystem
3. [ ] File operations for tools

---

## Known Issues

1. ~~**No IDT** - System will crash on exceptions~~ ✓ FIXED
2. ~~**xHCI incomplete** - Can't poll USB devices~~ ✓ Working (control transfers)
3. **GPIO untested on hardware** - Apple SPI needs real MacBook testing
4. ~~**No timer** - Can't do timeouts or delays~~ ✓ FIXED (PIT 100Hz)
5. **No filesystem** - Can't persist data

---

## Success Metrics

### MVP (Minimum Viable Product)
- [ ] Boots on MacBook Pro A1706
- [ ] ONE input method works (USB or internal keyboard)
- [ ] Can communicate with Claude Code API
- [ ] Local LLM works offline
- [ ] Can read/write files

### Full Product
- [ ] All input (keyboard + trackpad)
- [ ] WiFi networking
- [ ] Self-bootstrapping toolchain
- [ ] Basic GUI
- [ ] Bluetooth peripherals

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bootloader | Limine | Simple, module support |
| Compiler | TinyCC | Small, self-hosting |
| TLS | BearSSL | Small footprint |
| Filesystem | FAT32 | Simple, USB compatible |
| Network first | USB Ethernet | Much simpler than WiFi |

---

*Last Updated: Phase 2 (Input Hardware)*
*Following: Ralph playbook - specs → plan → build*
