# External Resources - DRY Reference

> "We never reinvent the wheel."
> This document catalogs existing implementations to leverage for AlphaOS.

---

## Apple SPI Keyboard/Trackpad

### Primary Source: Linux Kernel Driver
- **Repo:** [torvalds/linux - applespi.c](https://github.com/torvalds/linux/blob/master/drivers/input/keyboard/applespi.c)
- **Standalone:** [cb22/macbook12-spi-driver](https://github.com/cb22/macbook12-spi-driver)
- **Fork with Touch Bar:** [roadrunner2/macbook12-spi-driver](https://github.com/roadrunner2/macbook12-spi-driver)

### What we can reuse:
- SPI packet format definitions
- HID scancode tables
- Multi-touch protocol parsing
- GPIO pin configurations for various MacBook models

### Key files to study:
```
applespi.c          - Main driver (~2000 lines)
applespi.h          - Protocol structures
apple-ib-tb.c       - Touch Bar driver
```

---

## TCP/IP Stack

### Best Options for Bare Metal:

| Library | Size | Features | License | URL |
|---------|------|----------|---------|-----|
| **lwIP** | ~100KB | Full stack, proven | BSD | [BareMetal-lwIP](https://github.com/ReturnInfinity/BareMetal-lwIP) |
| **picoTCP** | ~50KB | Modular, embedded | GPL2 | [tass-belgium/picotcp](https://github.com/tass-belgium/picotcp) |
| **Mongoose** | ~100KB | TCP + HTTP + TLS | GPLv2/Commercial | [cesanta/mongoose](https://github.com/cesanta/mongoose) |
| **FNET** | ~80KB | IPv4/IPv6, bare metal | Apache 2.0 | [butog/FNET](https://github.com/butog/FNET) |
| **Minimal-TCP-IP** | ~4KB | Very minimal | MIT | [adimalla/Minimal-TCP-IP-Stack](https://github.com/adimalla/Minimal-TCP-IP-Stack) |

### Recommended: lwIP via BareMetal port
- Already ported to x86_64 bare metal
- Well-documented, battle-tested
- BSD license (permissive)

---

## TLS Library

### Options:

| Library | Code Size | RAM | TLS 1.3 | License | Notes |
|---------|-----------|-----|---------|---------|-------|
| **BearSSL** | ~100KB | ~25KB | No | MIT | Smallest, constant-time |
| **mbedTLS** | ~200KB | ~50KB | Yes | Apache 2.0 | More features, LTS |
| **wolfSSL** | ~200KB | ~30KB | Yes | GPLv2/Commercial | FIPS support |

### Recommended: mbedTLS
- **Repo:** [Mbed-TLS/mbedtls](https://github.com/Mbed-TLS/mbedtls)
- TLS 1.3 support (required for modern APIs)
- Well-maintained with LTS releases
- Good documentation

### Fallback: BearSSL
- Smaller footprint
- True bare-metal (no malloc required)
- TLS 1.2 only (may work for Claude API)

---

## xHCI USB Driver

### Reference Implementations:

| Source | Type | Notes |
|--------|------|-------|
| **SeaBIOS** | Production | Clean, well-commented C |
| **ToaruOS** | Hobby OS | Full USB stack |
| **xhci_uio** | Userspace | Good for understanding |

### Key resources:
- [SeaBIOS xHCI](https://github.com/coreboot/seabios/blob/master/src/hw/usb-xhci.c) - Best reference
- [liva/xhci_uio](https://github.com/liva/xhci_uio) - Simple userspace driver
- [Bloodmoon OS](https://github.com/TretornESP/bloodmoon) - Standalone driver library project

### Critical structures to copy:
```c
// From SeaBIOS - slot context, endpoint context, TRB formats
struct xhci_slotctx { ... };
struct xhci_epctx { ... };
struct xhci_trb { ... };
```

---

## NVMe Driver

### Reference Implementations:

| Source | Type | Complexity |
|--------|------|------------|
| **Linux kernel** | Production | Complex |
| **hikalium/nvme_uio** | Userspace | Simple |
| **hgst/libnvme** | Library | Medium |

### Recommended: nvme_uio
- **Repo:** [hikalium/nvme_uio](https://github.com/hikalium/nvme_uio)
- Simple, educational implementation
- Easy to understand command submission/completion

### Key NVMe structures:
```c
// Admin/IO queue entries
struct nvme_sqe { ... };   // Submission Queue Entry
struct nvme_cqe { ... };   // Completion Queue Entry

// Commands: Identify, Read, Write
```

---

## WiFi (BCM43xx)

### Reality Check: Very Complex
WiFi drivers are thousands of lines and need:
- Firmware blobs
- 802.11 state machine
- WPA supplicant

### Sources:
- [Linux b43 driver](https://github.com/torvalds/linux/blob/master/drivers/net/wireless/broadcom/b43/main.c)
- [pld-linux/bcm43xx-firmware](https://github.com/pld-linux/bcm43xx-firmware)

### Recommendation: USB Ethernet first
Much simpler to get networking working via USB CDC-ECM adapter.

---

## Complete OS References

### ToaruOS (Best Reference)
- **Repo:** [klange/toaruos](https://github.com/klange/toaruos)
- Written from scratch in C
- Has: kernel, drivers, libc, GUI, network stack
- Well-documented and educational

### SerenityOS
- **Repo:** [SerenityOS/serenity](https://github.com/SerenityOS/serenity)
- Full Unix-like OS with GUI
- Excellent code quality
- C++ but patterns are reusable

### BareMetal OS
- **Repo:** [ReturnInfinity/BareMetal](https://github.com/ReturnInfinity/BareMetal)
- Minimal exokernel
- x86_64, assembly
- Has lwIP port for networking

---

## Compiler/Toolchain

### TinyCC
- **Repo:** [TinyCC](https://github.com/AerialX/tinycc)
- Self-hosting C compiler
- ~100KB binary
- x86_64 support

### Alternatives:
- [cproc](https://github.com/michaelforney/cproc) - Simple C11 compiler
- Subset of GCC (complex but complete)

---

## What to Port vs Write

### Port Existing Code:
| Component | Source | Effort |
|-----------|--------|--------|
| TCP/IP | lwIP or picoTCP | Medium |
| TLS | mbedTLS or BearSSL | Medium |
| Apple SPI protocol | Linux applespi.c | Low |
| NVMe basics | nvme_uio | Low |
| USB HID parsing | SeaBIOS | Low |

### Write Custom (no good portable option):
| Component | Why Custom | Notes |
|-----------|-----------|-------|
| Memory allocator | OS-specific | Already done |
| Console/display | Hardware-specific | Already done |
| IDT/interrupts | x86_64 specific | Must write |
| LLM inference | Already ported | llama2.c |

### Skip/Defer:
| Component | Reason |
|-----------|--------|
| WiFi | Too complex, use USB Ethernet |
| Touch Bar | Low priority, complex T1 chip |
| Audio | Not needed for MVP |

---

## Integration Strategy

### Phase 1: Study and Extract
1. Read reference implementations
2. Identify minimal required code
3. Extract structures and constants

### Phase 2: Adapt
1. Remove OS-specific dependencies
2. Replace with AlphaOS equivalents:
   - `malloc` → `kmalloc`
   - `printk` → `console_printf`
   - Linux spinlocks → simple disable interrupts

### Phase 3: Test
1. QEMU first
2. Real hardware validation
3. Iterate

---

## License Compliance

| Library | License | Can Use? | Notes |
|---------|---------|----------|-------|
| Linux drivers | GPL | Study only | Can't copy directly |
| lwIP | BSD | Yes | Keep attribution |
| mbedTLS | Apache 2.0 | Yes | Keep attribution |
| BearSSL | MIT | Yes | Very permissive |
| picoTCP | GPL | Careful | Must open source |
| ToaruOS | NCSA | Yes | BSD-like |
| SerenityOS | BSD | Yes | Keep attribution |

**Strategy:** Prefer BSD/MIT/Apache licensed code. Study GPL code for algorithms, reimplement cleanly.

---

## Quick Links

### Essential Reading:
- [OSDev Wiki - xHCI](https://wiki.osdev.org/XHCI)
- [OSDev Wiki - NVMe](https://wiki.osdev.org/NVMe)
- [OSDev Wiki - Networking](https://wiki.osdev.org/Network_Stack)
- [xHCI Specification](https://www.intel.com/content/www/us/en/products/docs/io/universal-serial-bus/extensible-host-controler-interface-usb-xhci.html)
- [NVMe Specification](https://nvmexpress.org/specifications/)

### GitHub Topics:
- [bare-metal](https://github.com/topics/bare-metal?l=c)
- [hobby-os](https://github.com/topics/hobby-os)
- [osdev](https://github.com/topics/osdev)
