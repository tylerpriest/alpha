# Interrupt Handling Specification

> **Topic:** CPU exception and hardware interrupt handling via IDT

## Job To Be Done

Enable the kernel to handle CPU exceptions (page faults, divide by zero, etc.) and hardware interrupts (timer, keyboard) so the system doesn't crash on real hardware.

## Requirements

### Interrupt Descriptor Table (IDT)
1. **256-entry IDT** covering all x86_64 interrupt vectors
2. **Exception handlers (0-31)** for CPU exceptions
3. **Hardware IRQ handlers (32-47)** for PIC/APIC interrupts
4. **Software interrupt handler (128)** for future syscalls

### Exception Handlers Required
| Vector | Name | Action |
|--------|------|--------|
| 0 | Divide Error | Log and halt |
| 6 | Invalid Opcode | Log and halt |
| 8 | Double Fault | Panic |
| 13 | General Protection | Log and halt |
| 14 | Page Fault | Log CR2 and halt |

### Hardware Interrupts Required
| IRQ | Vector | Device | Action |
|-----|--------|--------|--------|
| 0 | 32 | Timer (PIT/APIC) | Increment tick counter |
| 1 | 33 | Keyboard (PS/2) | Read scancode |
| - | - | xHCI MSI | USB event processing |

### APIC Support
1. **Local APIC initialization** for timer
2. **I/O APIC configuration** for device interrupts
3. **MSI/MSI-X support** for PCIe devices (xHCI)

## Implementation

### IDT Entry Structure (64-bit)
```c
typedef struct {
    u16 offset_low;      // Bits 0-15 of handler address
    u16 selector;        // Code segment selector (0x08)
    u8  ist;             // Interrupt Stack Table index
    u8  type_attr;       // Type and attributes
    u16 offset_mid;      // Bits 16-31
    u32 offset_high;     // Bits 32-63
    u32 reserved;
} __attribute__((packed)) IdtEntry;
```

### Handler Stub (Assembly)
```asm
; Common interrupt stub
isr_common:
    push rax
    push rbx
    push rcx
    push rdx
    push rsi
    push rdi
    push rbp
    push r8-r15

    mov rdi, rsp        ; Pass stack frame to C handler
    call interrupt_handler

    pop r15-r8
    pop rbp
    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rbx
    pop rax

    add rsp, 16         ; Remove error code and vector
    iretq
```

## Acceptance Criteria

- [ ] IDT loaded with `lidt` instruction
- [ ] Division by zero triggers handler (not triple fault)
- [ ] Timer interrupt fires at 100Hz
- [ ] Keyboard interrupt reads scancodes
- [ ] System survives running on real MacBook hardware

## Dependencies

- GDT must be set up (done by Limine)
- Stack must be valid (done)
- Kernel must be in 64-bit long mode (done)

## Files to Create/Modify

- `kernel/src/idt.c` - IDT setup and handlers
- `kernel/include/idt.h` - IDT structures
- `kernel/arch/x86_64/isr.S` - Assembly stubs
- `kernel/src/main.c` - Call idt_init()
