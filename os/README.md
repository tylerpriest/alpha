# AlphaOS

**An AI-Native Operating System for MacBook Pro A1706**

AlphaOS is a minimal operating system designed from first principles with AI at the center. It's not an OS with AI features bolted on—AI IS the system.

## Quick Start

```bash
# Install dependencies (Ubuntu/Debian)
sudo apt install build-essential nasm xorriso qemu-system-x86 ovmf

# Build and run
cd os
make iso
make run
```

## Project Status

- [x] **Phase 1**: Boot & Display (CURRENT)
  - [x] UEFI boot via Limine
  - [x] Framebuffer console
  - [x] Text rendering
  - [ ] Testing in QEMU

- [ ] **Phase 2**: Core Systems
  - [ ] GDT/IDT setup
  - [ ] Interrupt handling
  - [ ] USB keyboard driver
  - [ ] Basic shell

- [ ] **Phase 3**: AI Core
  - [ ] llama.cpp integration
  - [ ] Local LLM inference
  - [ ] Conversation loop

- [ ] **Phase 4**: Full System
  - [ ] Semantic memory (SQLite + vectors)
  - [ ] Tool system
  - [ ] Persistent context

## Building

### Requirements

- GCC or x86_64-elf cross-compiler
- NASM assembler
- xorriso (ISO creation)
- QEMU + OVMF (testing)

### Commands

```bash
make          # Build kernel
make iso      # Create bootable ISO
make run      # Run in QEMU (UEFI)
make run-bios # Run in QEMU (BIOS fallback)
make debug    # Run with GDB debugging
make clean    # Clean build artifacts
make help     # Show all targets
```

## Hardware Target

- **MacBook Pro A1706** (2016/2017 13" with Touch Bar)
- Intel Core i5/i7 (Skylake/Kaby Lake)
- 8-16 GB RAM
- USB-C/Thunderbolt 3 ports

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [AI_NATIVE_VISION.md](AI_NATIVE_VISION.md) - AI-first design philosophy
- [ROADMAP.md](ROADMAP.md) - Implementation plan
- [USB_BOOT_STRATEGY.md](USB_BOOT_STRATEGY.md) - Portable boot guide

## License

MIT License - See LICENSE for details.

---

*AI is not a feature. AI is the system.*
