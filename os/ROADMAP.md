# AlphaOS Project Roadmap

This document outlines the detailed implementation roadmap for AlphaOS, a minimal operating system for MacBook Pro A1706.

---

## Overview

The roadmap is divided into **4 major phases**, each with specific milestones and deliverables. Each phase builds upon the previous one, gradually increasing system capabilities.

```
Phase 1          Phase 2          Phase 3          Phase 4
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ BOOT &  │ ──► │  CORE   │ ──► │HARDWARE │ ──► │ADVANCED │
│ DISPLAY │     │ SYSTEMS │     │ SUPPORT │     │FEATURES │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
 "It boots!"    "It responds!"  "Real hardware!" "It's useful!"
```

---

## Phase 1: Foundation - "It boots!"

### Milestone 1.1: Build System Setup

**Objective**: Establish reproducible build environment

**Tasks**:
- [ ] Create Makefile with cross-compiler support
- [ ] Set up directory structure
- [ ] Write linker script for kernel ELF
- [ ] Create image generation script
- [ ] Set up QEMU test environment

**Deliverables**:
- Working Makefile
- `linker.ld` script
- `create_image.sh` script
- `run_qemu.sh` script

**Acceptance Criteria**:
- `make` produces kernel.elf
- `make image` produces bootable image
- `make run` launches QEMU with OVMF

---

### Milestone 1.2: Bootloader Integration

**Objective**: Configure Limine to load our kernel

**Tasks**:
- [ ] Clone Limine bootloader
- [ ] Create limine.cfg configuration
- [ ] Set up ESP partition structure
- [ ] Verify boot handoff works

**Deliverables**:
- `boot/limine.cfg`
- Boot process documentation

**Acceptance Criteria**:
- QEMU shows Limine boot menu
- Kernel is loaded into memory
- Control transfers to kernel entry point

---

### Milestone 1.3: Kernel Entry Point

**Objective**: Minimal kernel that executes after bootloader

**Tasks**:
- [ ] Create kernel entry point in C
- [ ] Parse Limine boot info structure
- [ ] Set up initial stack
- [ ] Implement infinite loop (to prevent return)

**Files to Create**:
```
kernel/
├── src/
│   └── main.c           # Entry point: _start() or kmain()
├── arch/
│   └── x86_64/
│       └── boot.S       # Optional assembly stub
└── linker.ld
```

**Key Code**:
```c
// main.c
#include <limine.h>

__attribute__((section(".limine_requests")))
static volatile LIMINE_BASE_REVISION(2);

void kmain(void) {
    // Kernel starts here
    for (;;) {
        __asm__ volatile ("hlt");
    }
}
```

**Acceptance Criteria**:
- Kernel executes without triple fault
- Halt loop keeps system stable

---

### Milestone 1.4: Framebuffer Console

**Objective**: Display text on screen using GOP framebuffer

**Tasks**:
- [ ] Request framebuffer from Limine
- [ ] Implement pixel plotting function
- [ ] Implement bitmap font rendering (8x16 font)
- [ ] Implement character printing
- [ ] Implement string printing
- [ ] Implement newline and scrolling
- [ ] Create printf-like function

**Files to Create**:
```
kernel/
├── src/
│   ├── console.c        # Text console implementation
│   └── font.c           # Bitmap font data
├── include/
│   ├── console.h
│   └── font.h
└── lib/
    └── printf.c         # Mini printf implementation
```

**Data Structures**:
```c
typedef struct {
    uint32_t* framebuffer;
    uint32_t width;
    uint32_t height;
    uint32_t pitch;      // Bytes per row
    uint32_t cursor_x;
    uint32_t cursor_y;
    uint32_t fg_color;
    uint32_t bg_color;
} Console;
```

**Acceptance Criteria**:
- "Hello, AlphaOS!" displays on screen
- Multiple lines of text work
- Screen scrolls when full

---

### Milestone 1.5: Phase 1 Complete

**Final Deliverable**: Bootable ISO/image that displays welcome message

**Demo**:
```
================================================================================
                              AlphaOS v0.1
                    Minimal OS for MacBook Pro A1706
================================================================================

Framebuffer: 2560x1600 @ 32bpp
Memory: 512 MB available
CPU: x86_64

Welcome to AlphaOS!
_
```

---

## Phase 2: Core Systems - "It responds!"

### Milestone 2.1: Global Descriptor Table (GDT)

**Objective**: Set up proper segmentation for 64-bit mode

**Tasks**:
- [ ] Define GDT entries (null, kernel code, kernel data)
- [ ] Create GDT pointer structure
- [ ] Implement lgdt instruction wrapper
- [ ] Reload segment registers

**GDT Structure**:
```c
struct gdt_entry {
    uint16_t limit_low;
    uint16_t base_low;
    uint8_t  base_middle;
    uint8_t  access;
    uint8_t  granularity;
    uint8_t  base_high;
} __attribute__((packed));

// Entries needed:
// 0x00: Null descriptor
// 0x08: Kernel code (DPL 0)
// 0x10: Kernel data (DPL 0)
// 0x18: User code (DPL 3) - future
// 0x20: User data (DPL 3) - future
// 0x28: TSS descriptor - for interrupts
```

**Acceptance Criteria**:
- GDT loaded without fault
- Segment registers set correctly
- System continues to operate

---

### Milestone 2.2: Interrupt Descriptor Table (IDT)

**Objective**: Handle CPU exceptions and hardware interrupts

**Tasks**:
- [ ] Define IDT entry structure (16 bytes for x86_64)
- [ ] Create exception handlers (ISR 0-31)
- [ ] Create IRQ handlers (ISR 32-47)
- [ ] Implement ISR assembly stubs
- [ ] Create generic interrupt dispatcher
- [ ] Implement exception handlers with error messages

**Files to Create**:
```
kernel/
├── src/
│   ├── idt.c            # IDT setup and management
│   └── isr.c            # Interrupt service routines
└── arch/
    └── x86_64/
        └── interrupts.S # Assembly ISR stubs
```

**Exception Handlers**:
```c
void exception_handler(InterruptFrame* frame) {
    const char* exceptions[] = {
        "Division Error",
        "Debug",
        "NMI",
        "Breakpoint",
        "Overflow",
        "Bound Range Exceeded",
        "Invalid Opcode",
        "Device Not Available",
        "Double Fault",
        ...
    };

    kprintf("EXCEPTION: %s\n", exceptions[frame->vector]);
    kprintf("  RIP: 0x%016lx\n", frame->rip);
    kprintf("  RSP: 0x%016lx\n", frame->rsp);

    // Halt on unrecoverable exceptions
    for(;;) __asm__("hlt");
}
```

**Acceptance Criteria**:
- Division by zero triggers handler (not triple fault)
- Invalid opcode triggers handler
- System displays exception info

---

### Milestone 2.3: APIC and Timer

**Objective**: Set up local APIC for timer interrupts

**Tasks**:
- [ ] Disable legacy PIC (8259)
- [ ] Enable and configure LAPIC
- [ ] Set up LAPIC timer
- [ ] Implement timer interrupt handler
- [ ] Create delay function (ms/us)

**LAPIC Registers** (memory-mapped at 0xFEE00000):
```c
#define LAPIC_ID        0x020
#define LAPIC_VERSION   0x030
#define LAPIC_TPR       0x080  // Task Priority
#define LAPIC_EOI       0x0B0  // End of Interrupt
#define LAPIC_SVR       0x0F0  // Spurious Vector
#define LAPIC_ICR_LOW   0x300  // Interrupt Command
#define LAPIC_ICR_HIGH  0x310
#define LAPIC_TIMER_LVT 0x320  // Timer Local Vector
#define LAPIC_TIMER_ICR 0x380  // Timer Initial Count
#define LAPIC_TIMER_CCR 0x390  // Timer Current Count
#define LAPIC_TIMER_DCR 0x3E0  // Timer Divide Config
```

**Acceptance Criteria**:
- Timer interrupts fire regularly
- Delay function works accurately
- No spurious interrupts

---

### Milestone 2.4: Physical Memory Manager

**Objective**: Track and allocate physical memory pages

**Tasks**:
- [ ] Parse memory map from bootloader
- [ ] Implement bitmap-based page allocator
- [ ] Create alloc_page() function
- [ ] Create free_page() function
- [ ] Track total/used/free memory

**Memory Map Parsing**:
```c
void pmm_init(struct limine_memmap_response* memmap) {
    for (size_t i = 0; i < memmap->entry_count; i++) {
        struct limine_memmap_entry* entry = memmap->entries[i];

        if (entry->type == LIMINE_MEMMAP_USABLE) {
            // Mark pages as free
            mark_region_free(entry->base, entry->length);
        }
    }
}
```

**Acceptance Criteria**:
- Memory map correctly parsed
- Can allocate pages
- Can free pages
- No double allocation

---

### Milestone 2.5: Kernel Heap

**Objective**: Dynamic memory allocation (malloc/free)

**Tasks**:
- [ ] Design simple heap allocator
- [ ] Implement kmalloc()
- [ ] Implement kfree()
- [ ] Implement krealloc()
- [ ] Add heap debugging

**Simple Free List Allocator**:
```c
typedef struct block_header {
    size_t size;
    bool free;
    struct block_header* next;
} BlockHeader;

void* kmalloc(size_t size) {
    // Find first fit in free list
    // Split block if too large
    // Return pointer after header
}

void kfree(void* ptr) {
    // Mark block as free
    // Coalesce with neighbors
}
```

**Acceptance Criteria**:
- Can allocate variable sizes
- Memory freed correctly
- No memory corruption

---

### Milestone 2.6: USB xHCI Controller (Basic)

**Objective**: Initialize xHCI for USB keyboard support

**Tasks**:
- [ ] Enumerate PCI for xHCI controller
- [ ] Map MMIO registers
- [ ] Reset controller
- [ ] Initialize memory structures (DCBAA, Command Ring, Event Ring)
- [ ] Enable interrupts

**xHCI Initialization Steps**:
1. Find xHCI controller via PCI
2. Map BAR0 (MMIO region)
3. Wait for CNR (Controller Not Ready) = 0
4. Reset controller (HCRST)
5. Program DCBAAP (Device Context Base Address)
6. Set Max Slots Enabled
7. Create Command Ring
8. Create Event Ring
9. Set Run/Stop = 1

**Acceptance Criteria**:
- xHCI controller detected
- No errors during initialization
- Ready for device enumeration

---

### Milestone 2.7: USB HID Keyboard Driver

**Objective**: Accept keyboard input via USB

**Tasks**:
- [ ] Enumerate USB devices
- [ ] Identify keyboard device
- [ ] Configure endpoint
- [ ] Set up interrupt transfer
- [ ] Parse HID reports
- [ ] Convert scan codes to characters

**HID Boot Protocol**:
```c
typedef struct {
    uint8_t modifiers;    // Ctrl, Shift, Alt, GUI
    uint8_t reserved;
    uint8_t keys[6];      // Up to 6 keys pressed
} HIDKeyboardReport;
```

**Acceptance Criteria**:
- Keyboard input detected
- Characters printed to console
- Modifier keys work (Shift for uppercase)

---

### Milestone 2.8: Command Shell

**Objective**: Interactive command-line interface

**Tasks**:
- [ ] Implement line input with editing
- [ ] Parse commands and arguments
- [ ] Implement built-in commands:
  - `help` - Show available commands
  - `clear` - Clear screen
  - `echo` - Echo arguments
  - `info` - Show system info
  - `mem` - Show memory stats
  - `reboot` - Restart system

**Shell Implementation**:
```c
void shell_run(void) {
    char line[256];

    while (1) {
        kprintf("alpha> ");
        readline(line, sizeof(line));
        execute_command(line);
    }
}
```

**Acceptance Criteria**:
- Prompt displayed
- Commands execute correctly
- Backspace works
- Command history (optional)

---

### Milestone 2.9: Phase 2 Complete

**Final Deliverable**: Interactive OS with keyboard input

**Demo**:
```
================================================================================
                              AlphaOS v0.2
================================================================================

Initializing GDT... OK
Initializing IDT... OK
Initializing APIC... OK
Initializing USB... OK
  Found xHCI controller at PCI 0:14.0
  USB keyboard detected

Type 'help' for available commands.

alpha> help
Available commands:
  help   - Show this message
  clear  - Clear the screen
  echo   - Echo arguments
  info   - Show system information
  mem    - Show memory statistics
  reboot - Restart the system

alpha> info
AlphaOS v0.2
CPU: x86_64
Memory: 512 MB total, 480 MB free
Uptime: 42 seconds

alpha> _
```

---

## Phase 3: Hardware Support - "Real hardware!"

### Milestone 3.1: Apple SPI Driver Framework

**Objective**: Foundation for SPI communication

**Tasks**:
- [ ] Parse ACPI tables for SPI controller
- [ ] Initialize Intel LPSS SPI controller
- [ ] Implement SPI transfer functions
- [ ] Test with logic analyzer (optional)

**SPI Controller Registers**:
```c
#define SSCR0   0x00  // Control Register 0
#define SSCR1   0x04  // Control Register 1
#define SSSR    0x08  // Status Register
#define SSDR    0x10  // Data Register
```

---

### Milestone 3.2: Apple SPI Keyboard Driver

**Objective**: Internal keyboard support

**Tasks**:
- [ ] Analyze applespi Linux driver
- [ ] Implement Apple SPI protocol
- [ ] Handle keyboard events
- [ ] Integrate with input system

**Reference**: [roadrunner2/macbook12-spi-driver](https://github.com/roadrunner2/macbook12-spi-driver)

---

### Milestone 3.3: Apple SPI Trackpad Driver

**Objective**: Internal trackpad support

**Tasks**:
- [ ] Implement trackpad SPI communication
- [ ] Parse multi-touch data
- [ ] Implement cursor movement
- [ ] Click detection

---

### Milestone 3.4: NVMe Storage Driver

**Objective**: Read from internal SSD

**Tasks**:
- [ ] Enumerate PCIe for NVMe controller
- [ ] Initialize Admin Queue
- [ ] Send Identify Controller command
- [ ] Send Identify Namespace command
- [ ] Create I/O queues
- [ ] Implement read sector function

**NVMe Commands**:
```c
// Admin commands
#define NVME_ADMIN_IDENTIFY     0x06
#define NVME_ADMIN_CREATE_SQ    0x01
#define NVME_ADMIN_CREATE_CQ    0x05

// I/O commands
#define NVME_IO_READ            0x02
#define NVME_IO_WRITE           0x01
```

---

### Milestone 3.5: Hardware Testing

**Objective**: Verify on actual MacBook Pro A1706

**Tasks**:
- [ ] Create bootable USB drive
- [ ] Test boot process
- [ ] Verify display output
- [ ] Test keyboard input
- [ ] Debug any hardware-specific issues

**Testing Procedure**:
1. Copy OS image to USB drive
2. Boot MacBook holding Option key
3. Select USB drive
4. Document any issues
5. Fix and iterate

---

### Milestone 3.6: Phase 3 Complete

**Final Deliverable**: OS running on MacBook Pro A1706 hardware

---

## Phase 4: Advanced Features - "It's useful!"

### Milestone 4.1: FAT32 File System

**Objective**: Read files from storage

**Tasks**:
- [ ] Parse FAT32 boot sector
- [ ] Read FAT table
- [ ] Navigate directory entries
- [ ] Read file contents
- [ ] Implement file commands (ls, cat, etc.)

---

### Milestone 4.2: Program Loading

**Objective**: Load and execute programs

**Tasks**:
- [ ] Parse ELF format
- [ ] Load program into memory
- [ ] Set up execution environment
- [ ] Implement basic syscalls

---

### Milestone 4.3: Basic Multitasking (Optional)

**Objective**: Run multiple programs

**Tasks**:
- [ ] Implement task structure
- [ ] Implement context switching
- [ ] Implement scheduler (round-robin)
- [ ] Implement task creation/termination

---

### Milestone 4.4: Touch Bar Support (Stretch Goal)

**Objective**: Display content on Touch Bar

**Tasks**:
- [ ] Reverse engineer T1 USB protocol
- [ ] Implement USB device communication
- [ ] Send pixel buffers to Touch Bar
- [ ] Create simple Touch Bar interface

---

### Milestone 4.5: Phase 4 Complete

**Final Deliverable**: Practical OS with file system and program execution

---

## Summary Timeline

| Phase | Milestone | Description |
|-------|-----------|-------------|
| **1** | 1.1-1.5 | Foundation: Build system → Display output |
| **2** | 2.1-2.9 | Core: GDT → IDT → Timer → Memory → USB → Shell |
| **3** | 3.1-3.6 | Hardware: SPI → Keyboard → Trackpad → NVMe |
| **4** | 4.1-4.5 | Advanced: FS → Programs → Tasks → Touch Bar |

---

## Dependencies Graph

```
                          ┌─────────────┐
                          │ Build System│
                          │    (1.1)    │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │  Bootloader │
                          │    (1.2)    │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │   Kernel    │
                          │   Entry     │
                          │    (1.3)    │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │ Framebuffer │
                          │  Console    │
                          │    (1.4)    │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
       ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
       │    GDT      │    │    IDT      │    │   Memory    │
       │   (2.1)     │    │   (2.2)     │    │   Manager   │
       └──────┬──────┘    └──────┬──────┘    │   (2.4)     │
              │                  │           └──────┬──────┘
              │           ┌──────▼──────┐          │
              │           │    APIC     │    ┌──────▼──────┐
              │           │   Timer     │    │   Heap      │
              │           │   (2.3)     │    │   (2.5)     │
              │           └──────┬──────┘    └──────┬──────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                          ┌──────▼──────┐
                          │    USB      │
                          │   xHCI      │
                          │   (2.6)     │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │  Keyboard   │
                          │   HID       │
                          │   (2.7)     │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │   Shell     │
                          │   (2.8)     │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
       ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
       │  Apple SPI  │    │  Apple SPI  │    │   NVMe      │
       │  Keyboard   │    │  Trackpad   │    │  Storage    │
       │   (3.2)     │    │   (3.3)     │    │   (3.4)     │
       └─────────────┘    └─────────────┘    └──────┬──────┘
                                                    │
                                             ┌──────▼──────┐
                                             │   FAT32     │
                                             │    FS       │
                                             │   (4.1)     │
                                             └──────┬──────┘
                                                    │
                                             ┌──────▼──────┐
                                             │  Program    │
                                             │  Loading    │
                                             │   (4.2)     │
                                             └─────────────┘
```

---

## Getting Started

To begin development, start with Phase 1, Milestone 1.1:

```bash
# Create initial project structure
mkdir -p os/{boot,kernel/src,kernel/include,kernel/arch/x86_64,lib,tools}

# Set up build system
# See TOOLCHAIN.md for details

# Build and test
make
make run
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
