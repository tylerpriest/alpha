# AlphaOS - Minimal Operating System for MacBook Pro A1706

## Executive Summary

AlphaOS is a minimal, educational operating system designed specifically for the MacBook Pro A1706 (2016/2017 13-inch with Touch Bar). This document outlines the architecture, hardware requirements, driver specifications, and implementation roadmap.

---

## 1. Target Hardware Specifications

### MacBook Pro A1706 Overview

The A1706 model number covers two generations:

#### Late 2016 Models (MacBookPro13,2)
| Component | Specification |
|-----------|---------------|
| **CPU** | Intel Core i5-6287U (Skylake), 3.1 GHz, Dual-core, 14nm |
| **Cache** | 4 MB shared L3 cache |
| **GPU** | Intel Iris Graphics 550 (integrated), 1.5 GB shared memory |
| **RAM** | 8/16 GB LPDDR3 2133 MHz (soldered) |
| **Storage** | 256/512 GB PCIe NVMe SSD (removable) |
| **Display** | 13.3" Retina, 2560x1600, IPS LED-backlit |
| **Touch Bar** | 2180x60 OLED strip, controlled by T1 chip |

#### Mid-2017 Models (MacBookPro14,2)
| Component | Specification |
|-----------|---------------|
| **CPU** | Intel Core i5-7267U/7287U (Kaby Lake), 3.1-3.3 GHz, Dual-core, 14nm |
| **Cache** | 4 MB shared L3 cache |
| **GPU** | Intel Iris Plus Graphics 650 (integrated) |
| **RAM** | 8/16 GB LPDDR3 2133 MHz (soldered) |
| **Storage** | 256/512 GB PCIe NVMe SSD |
| **Display** | 13.3" Retina, 2560x1600, IPS LED-backlit |
| **Touch Bar** | 2180x60 OLED strip, controlled by T1 chip |

### Key Hardware Identifiers
- **ACPI ID for Keyboard/Trackpad**: `APP000D`
- **USB Vendor ID**: `0x05ac` (Apple)
- **USB Product ID (SPI devices)**: `0x027b`
- **Touch Bar Resolution**: 60x2170 pixels (extreme aspect ratio)

---

## 2. Boot Process Analysis

### Intel Mac UEFI Boot Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     POWER ON / RESET                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EFI FIRMWARE (ROM)                           │
│  - POST (Power-On Self Test)                                    │
│  - Hardware initialization                                      │
│  - Memory detection                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EFI BOOT MANAGER                                   │
│  - Reads NVRAM boot entries                                     │
│  - Locates EFI System Partition (ESP)                          │
│  - Loads boot loader from ESP                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            UEFI BOOT LOADER (AlphaOS)                          │
│  - BOOTX64.EFI on ESP                                          │
│  - Initialize GOP for display                                   │
│  - Get memory map from firmware                                │
│  - Load kernel into memory                                      │
│  - ExitBootServices()                                          │
│  - Jump to kernel entry point                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AlphaOS KERNEL                               │
│  - Set up GDT, IDT                                             │
│  - Initialize memory management                                │
│  - Initialize APIC/interrupts                                  │
│  - Initialize drivers                                          │
│  - Start shell                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Apple EFI Peculiarities

1. **Non-standard EFI**: Apple uses EFI 1.10 with 64-bit extensions (not standard UEFI 2.0)
2. **No CSM by default**: Legacy BIOS boot requires special handling
3. **Boot ROM location**: `/System/Library/CoreServices/boot.efi` on HFS+ or Preboot volume on APFS
4. **GOP available**: Graphics Output Protocol is supported for framebuffer access

### Boot Loader Strategy

We will use the **Limine bootloader** for its advantages:
- Native 64-bit long mode support
- Handles mode switching automatically
- Well-documented boot protocol
- Active development community
- ESP (FAT32) file system support

---

## 3. Kernel Architecture

### Design Philosophy: Exokernel-inspired Minimal Design

Following the BareMetal OS philosophy:
- **Minimal footprint**: Target < 64 KiB kernel binary
- **Single address space**: Simplify memory management
- **Ring 0 execution**: Application runs in kernel mode (for simplicity)
- **Mono-tasking initially**: No context switch overhead
- **Direct hardware access**: Thin abstraction layer

### Memory Layout

```
Virtual Address Space (Identity Mapped Initially)
┌────────────────────────────────────────┐ 0xFFFF_FFFF_FFFF_FFFF
│           Kernel Space                 │
│  - Kernel code & data                  │
│  - Kernel stack                        │
│  - Driver memory                       │
├────────────────────────────────────────┤ 0xFFFF_8000_0000_0000
│                                        │
│           Higher Half                  │
│      (Reserved for future use)         │
│                                        │
├────────────────────────────────────────┤ 0x0000_8000_0000_0000
│                                        │
│           User Space                   │
│      (Future: applications)            │
│                                        │
├────────────────────────────────────────┤ 0x0000_0000_0010_0000 (1 MiB)
│       Low Memory (Legacy)              │
│  - BIOS data area (if needed)          │
│  - Interrupt vectors (unused in PM)    │
├────────────────────────────────────────┤ 0x0000_0000_0000_0000
```

### Core Kernel Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        AlphaOS Kernel                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Memory    │  │   Interrupt  │  │    Timer     │          │
│  │   Manager    │  │   Handler    │  │   Manager    │          │
│  │              │  │   (IDT/APIC) │  │   (LAPIC)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Driver Framework                     │          │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│          │
│  │  │Framebuf.│ │Keyboard │ │ Storage │ │  USB    ││          │
│  │  │ (GOP)   │ │ (SPI)   │ │ (NVMe)  │ │ (xHCI)  ││          │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘│          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │                System Calls                       │          │
│  │  - Console I/O                                    │          │
│  │  - Memory allocation                              │          │
│  │  - Hardware access                                │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │                   Shell                           │          │
│  │  - Command interpreter                            │          │
│  │  - Built-in utilities                             │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Driver Requirements

### 4.1 Display Driver (Priority: HIGH)

**Technology**: UEFI GOP (Graphics Output Protocol)

The framebuffer provided by GOP persists after `ExitBootServices()`, making it the simplest option for display output.

**Capabilities**:
- 2560x1600 resolution (Retina)
- 32-bit color depth (BGRA8888)
- Linear framebuffer access
- No mode switching required

**Implementation**:
```c
// GOP provides:
typedef struct {
    UINT32 HorizontalResolution;  // 2560
    UINT32 VerticalResolution;    // 1600
    EFI_PHYSICAL_ADDRESS FrameBufferBase;
    UINTN FrameBufferSize;
    UINT32 PixelsPerScanLine;
} FramebufferInfo;
```

**Tasks**:
1. Query GOP during boot for framebuffer info
2. Pass framebuffer address to kernel via boot info
3. Implement putpixel, line, rect primitives
4. Implement bitmap font rendering (8x16 or PSF fonts)
5. Implement scrolling text console

### 4.2 Keyboard Driver (Priority: HIGH)

**Challenge**: The A1706 uses an Apple SPI (Serial Peripheral Interface) keyboard, NOT USB HID.

**Hardware Details**:
- ACPI Hardware ID: `APP000D`
- Connected via Intel LPSS (Low Power Subsystem) SPI controller
- USB Product ID: `0x027b` with MI (Multiple Interface) `01` for keyboard, `02` for trackpad

**Required Kernel Support**:
1. **Intel LPSS PCI driver** (`intel_lpss_pci`)
2. **SPI PXA2XX platform driver** (`spi_pxa2xx_platform`)
3. **Apple SPI driver** (`applespi`)

**SPI Communication Protocol**:
- SPI Mode: Likely Mode 0 (CPOL=0, CPHA=0)
- Clock speed: TBD from ACPI tables
- Packet format: Proprietary Apple protocol

**Alternative Strategy**: Use USB keyboard for initial development, then implement SPI later.

**Fallback: USB HID Keyboard**:
- Requires xHCI driver (USB 3.0)
- USB HID boot protocol is simpler
- External keyboard via USB-C adapter

### 4.3 Storage Driver (Priority: MEDIUM)

**Technology**: NVMe (Non-Volatile Memory Express) over PCIe

The MacBook Pro A1706 uses a proprietary Apple NVMe SSD with custom connector.

**NVMe Basics**:
- PCIe-based protocol
- Command queues: Admin Queue + I/O Queues
- Commands submitted via TRBs (Transfer Request Blocks)
- Memory page size: 4 KiB minimum

**Reference Implementation**: BareMetal OS NVMe driver (x86-64 Assembly)

**Implementation Phases**:
1. **Phase 1**: Read-only access (identify, read sectors)
2. **Phase 2**: Write support
3. **Phase 3**: Basic file system (FAT32 for simplicity)

### 4.4 USB Driver - xHCI (Priority: MEDIUM)

**Purpose**: External keyboard/mouse support, USB storage

**xHCI (eXtensible Host Controller Interface)**:
- Supports USB 1.x, 2.0, and 3.0
- Complex initialization with MMIO registers
- Device slots and endpoint contexts
- Transfer Request Blocks (TRBs) for data transfer

**Reference Implementation**: Haiku OS xHCI driver (well-documented)

**Implementation Phases**:
1. **Phase 1**: Controller initialization
2. **Phase 2**: Device enumeration
3. **Phase 3**: HID keyboard/mouse support
4. **Phase 4**: Mass storage (future)

### 4.5 Touch Bar Driver (Priority: LOW)

**Challenge**: Highly complex, proprietary T1 chip communication

**Architecture**:
- T1 chip runs "eOS" (variant of watchOS)
- Connected via internal USB bus
- Display: 2180x60 OLED (60x2170 pixels after rotation)
- USB protocol for pixel buffer transfer
- No dedicated storage (boots from 25MB ramdisk)

**Recommendation**: Defer to future development. Focus on core functionality first.

---

## 5. System Initialization Sequence

### Boot Loader Phase (Limine)

```
1. UEFI loads BOOTX64.EFI from ESP
2. Limine initializes:
   - GOP for display
   - Memory map from GetMemoryMap()
   - Loads kernel ELF from ESP
3. Limine sets up environment:
   - GDT with 64-bit code/data segments
   - Identity-mapped paging (or higher-half)
   - Stack pointer
4. Limine passes boot info struct to kernel
5. Jump to kernel entry point
```

### Kernel Initialization Phase

```
1. Entry point (kmain):
   - Save boot info pointer
   - Set up kernel stack

2. Memory initialization:
   - Parse memory map
   - Initialize physical page allocator
   - Set up kernel heap

3. CPU initialization:
   - Load GDT (if needed)
   - Load IDT
   - Initialize LAPIC
   - Enable interrupts

4. Driver initialization:
   - Framebuffer console
   - Keyboard (USB or SPI)
   - Timer (LAPIC or PIT fallback)

5. Shell:
   - Display welcome message
   - Enter command loop
```

---

## 6. Interrupt Handling

### Interrupt Descriptor Table (IDT)

**Structure** (x86_64, 16 bytes per entry):
```
Offset 0-1:   Target offset bits 0-15
Offset 2-3:   Target selector (code segment)
Offset 4:     IST (Interrupt Stack Table) offset
Offset 5:     Type and attributes
Offset 6-7:   Target offset bits 16-31
Offset 8-11:  Target offset bits 32-63
Offset 12-15: Reserved (zero)
```

### Exception Handlers (ISR 0-31)

| Vector | Exception | Description |
|--------|-----------|-------------|
| 0 | #DE | Divide Error |
| 6 | #UD | Invalid Opcode |
| 8 | #DF | Double Fault |
| 13 | #GP | General Protection Fault |
| 14 | #PF | Page Fault |

### Hardware Interrupts (IRQ 32+)

| Vector | IRQ | Source |
|--------|-----|--------|
| 32 | 0 | Timer (PIT or LAPIC) |
| 33 | 1 | Keyboard |
| 44 | 12 | Mouse |

### APIC Configuration

Modern systems use APIC instead of legacy 8259 PIC:
- **LAPIC**: Local APIC per CPU core (timer, IPI)
- **I/O APIC**: Distributes external IRQs to CPUs
- **EOI**: Must send End-of-Interrupt after handling

---

## 7. Development Environment

### Required Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **Cross-compiler** | x86_64-elf-gcc | GCC 12+ |
| **Assembler** | NASM | 2.15+ |
| **Linker** | x86_64-elf-ld | GNU binutils |
| **UEFI Development** | gnu-efi or EDK2 | Latest |
| **Emulator** | QEMU | 8.0+ |
| **Firmware** | OVMF (UEFI) | Latest |
| **Debugger** | GDB | 13+ |
| **Image tools** | mtools, xorriso | Latest |

### Cross-Compiler Setup

```bash
# Install dependencies (Ubuntu/Debian)
sudo apt install build-essential bison flex libgmp-dev \
    libmpc-dev libmpfr-dev texinfo nasm qemu-system-x86 \
    mtools xorriso ovmf

# Build cross-compiler (if not available)
export PREFIX="$HOME/opt/cross"
export TARGET=x86_64-elf
export PATH="$PREFIX/bin:$PATH"

# Build binutils
cd binutils-2.41
./configure --target=$TARGET --prefix="$PREFIX" --with-sysroot --disable-nls --disable-werror
make && make install

# Build GCC
cd gcc-13.2.0
./configure --target=$TARGET --prefix="$PREFIX" --disable-nls --enable-languages=c,c++ --without-headers
make all-gcc && make install-gcc
```

### Project Structure

```
os/
├── boot/
│   ├── limine.cfg          # Limine configuration
│   └── limine/             # Limine bootloader files
├── kernel/
│   ├── src/
│   │   ├── main.c          # Kernel entry point
│   │   ├── gdt.c           # Global Descriptor Table
│   │   ├── idt.c           # Interrupt Descriptor Table
│   │   ├── memory.c        # Memory management
│   │   ├── console.c       # Framebuffer console
│   │   └── shell.c         # Command shell
│   ├── arch/
│   │   └── x86_64/
│   │       ├── boot.S      # Assembly entry point
│   │       ├── interrupts.S # Interrupt stubs
│   │       └── cpu.c       # CPU-specific code
│   ├── drivers/
│   │   ├── framebuffer.c   # GOP framebuffer
│   │   ├── keyboard/
│   │   │   ├── usb_hid.c   # USB HID keyboard
│   │   │   └── apple_spi.c # Apple SPI keyboard
│   │   ├── nvme.c          # NVMe storage
│   │   └── xhci.c          # USB 3.0 controller
│   └── include/
│       ├── kernel.h
│       ├── types.h
│       └── ...
├── lib/
│   ├── string.c            # String functions
│   ├── printf.c            # Printf implementation
│   └── memory.c            # memcpy, memset, etc.
├── tools/
│   ├── create_image.sh     # Build bootable image
│   └── run_qemu.sh         # QEMU test script
├── Makefile
└── linker.ld               # Kernel linker script
```

---

## 8. Testing Strategy

### QEMU Emulation

```bash
# Basic UEFI boot test
qemu-system-x86_64 \
    -machine q35 \
    -cpu host \
    -enable-kvm \
    -m 4G \
    -bios /usr/share/OVMF/OVMF_CODE.fd \
    -drive file=alphaos.img,format=raw \
    -serial stdio

# With debugging
qemu-system-x86_64 \
    ... \
    -s -S  # GDB server on port 1234, wait for connection
```

### GDB Debugging

```bash
# Connect to QEMU
gdb kernel.elf
(gdb) target remote :1234
(gdb) break kmain
(gdb) continue
```

### Hardware Testing

**Preparation**:
1. Create bootable USB drive with ESP partition
2. Copy BOOTX64.EFI and kernel to USB
3. Boot MacBook while holding Option key
4. Select USB drive from boot menu

**Caution**: Test thoroughly in QEMU before hardware testing.

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Milestone: "It boots!")

**Goal**: Bootable kernel that displays "Hello, AlphaOS!"

**Tasks**:
- [ ] Set up build system with cross-compiler
- [ ] Configure Limine bootloader
- [ ] Create minimal kernel entry point
- [ ] Initialize framebuffer console
- [ ] Print welcome message
- [ ] Test in QEMU with OVMF

**Deliverable**: Bootable ISO that displays text

### Phase 2: Core Systems (Milestone: "It responds!")

**Goal**: Interactive system with keyboard input

**Tasks**:
- [ ] Implement GDT setup
- [ ] Implement IDT with exception handlers
- [ ] Initialize LAPIC timer
- [ ] Implement USB xHCI driver (basic)
- [ ] Implement USB HID keyboard driver
- [ ] Create basic shell with echo command

**Deliverable**: Interactive prompt accepting keyboard input

### Phase 3: Hardware Support (Milestone: "It runs on real hardware!")

**Goal**: Boot on actual MacBook Pro A1706

**Tasks**:
- [ ] Test with USB keyboard on real hardware
- [ ] Implement Apple SPI keyboard driver
- [ ] Implement Apple SPI trackpad driver
- [ ] Implement NVMe driver (read-only)
- [ ] Add more shell commands

**Deliverable**: Fully functional on A1706 hardware

### Phase 4: Enhancements (Milestone: "It's useful!")

**Goal**: Practical functionality

**Tasks**:
- [ ] File system support (FAT32)
- [ ] Program loading
- [ ] Basic multitasking
- [ ] Touch Bar support (stretch goal)
- [ ] Network support (stretch goal)

**Deliverable**: Self-contained OS with basic utilities

---

## 10. References and Resources

### Official Specifications
- [Intel 64 and IA-32 Architectures Software Developer Manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [UEFI Specification](https://uefi.org/specifications)
- [ACPI Specification](https://uefi.org/specifications)
- [NVMe Specification](https://nvmexpress.org/specifications/)
- [xHCI Specification](https://www.intel.com/content/www/us/en/products/docs/io/universal-serial-bus/extensible-host-controler-interface-usb-xhci.html)

### OS Development Resources
- [OSDev Wiki](https://wiki.osdev.org/)
- [OSDev Wiki - UEFI](https://wiki.osdev.org/UEFI)
- [OSDev Wiki - Limine Bare Bones](https://wiki.osdev.org/Limine_Bare_Bones)
- [Writing an OS in Rust](https://os.phil-opp.com/)

### MacBook-Specific Resources
- [Dunedan/mbp-2016-linux](https://github.com/Dunedan/mbp-2016-linux) - Linux support status
- [roadrunner2/macbook12-spi-driver](https://github.com/roadrunner2/macbook12-spi-driver) - Apple SPI driver
- [Linux on MacBook Pro Late 2016 and Mid 2017](https://gist.github.com/roadrunner2/1289542a748d9a104e7baec6a92f9cd7)

### Reference Implementations
- [ReturnInfinity/BareMetal](https://github.com/ReturnInfinity/BareMetal) - Minimal exokernel
- [limine-bootloader/limine](https://github.com/limine-bootloader/limine) - Modern bootloader
- [Haiku OS xHCI Driver](https://git.haiku-os.org/haiku/tree/src/add-ons/kernel/busses/usb/xhci.cpp)

### Touch Bar Research
- [imbushuo - A deep dive into Apple Touch Bar](https://www.imbushuo.net/blog/archives/684)
- [hack-different/apple-knowledge](https://github.com/hack-different/apple-knowledge)

---

## 11. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| SPI keyboard driver complexity | HIGH | HIGH | Use USB keyboard initially |
| NVMe driver complexity | MEDIUM | MEDIUM | Use RAM disk initially |
| Touch Bar inaccessible | LOW | HIGH | Defer to future phase |
| UEFI quirks on Apple hardware | MEDIUM | MEDIUM | Test extensively in QEMU first |
| Display initialization fails | HIGH | LOW | GOP is well-documented |

---

## 12. Success Criteria

### Minimum Viable Product (MVP)
1. ✓ Boots on QEMU with OVMF
2. ✓ Displays text on framebuffer
3. ✓ Accepts keyboard input (USB)
4. ✓ Basic shell with commands

### Full Success
1. ✓ Boots on MacBook Pro A1706
2. ✓ Internal keyboard works (SPI)
3. ✓ Internal trackpad works (SPI)
4. ✓ Can read files from NVMe SSD

### Stretch Goals
1. Touch Bar display support
2. Wi-Fi networking
3. Multitasking
4. GUI environment

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: AlphaOS Development Team*
