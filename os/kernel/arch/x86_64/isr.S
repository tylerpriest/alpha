; AlphaOS - Interrupt Service Routine Stubs
;
; x86_64 ISR entry points that:
; 1. Save all registers
; 2. Push vector number
; 3. Call C handler
; 4. Restore registers
; 5. IRETQ back to interrupted code
;
; Exceptions 8, 10-14, 17, 21, 29, 30 push error codes
; All others need a dummy error code pushed

bits 64

; Mark stack as non-executable (security)
section .note.GNU-stack noalloc noexec nowrite progbits

section .text

; External C handlers
extern exception_handler
extern irq_handler

; Macro for ISR that doesn't push error code
%macro ISR_NOERR 1
global isr_stub_%1
isr_stub_%1:
    push qword 0            ; Dummy error code
    push qword %1           ; Vector number
    jmp isr_common_stub
%endmacro

; Macro for ISR that pushes error code
%macro ISR_ERR 1
global isr_stub_%1
isr_stub_%1:
    ; Error code already pushed by CPU
    push qword %1           ; Vector number
    jmp isr_common_stub
%endmacro

; Macro for IRQ handlers
%macro IRQ_STUB 1
global isr_stub_%1
isr_stub_%1:
    push qword 0            ; Dummy error code
    push qword %1           ; Vector number
    jmp irq_common_stub
%endmacro

; Exception handlers (0-31)
; Some push error codes, some don't

ISR_NOERR 0     ; Divide Error
ISR_NOERR 1     ; Debug
ISR_NOERR 2     ; NMI
ISR_NOERR 3     ; Breakpoint
ISR_NOERR 4     ; Overflow
ISR_NOERR 5     ; Bound Range
ISR_NOERR 6     ; Invalid Opcode
ISR_NOERR 7     ; Device Not Available
ISR_ERR   8     ; Double Fault (has error code)
ISR_NOERR 9     ; Coprocessor Segment Overrun
ISR_ERR   10    ; Invalid TSS (has error code)
ISR_ERR   11    ; Segment Not Present (has error code)
ISR_ERR   12    ; Stack-Segment Fault (has error code)
ISR_ERR   13    ; General Protection Fault (has error code)
ISR_ERR   14    ; Page Fault (has error code)
ISR_NOERR 15    ; Reserved
ISR_NOERR 16    ; x87 FPU Error
ISR_ERR   17    ; Alignment Check (has error code)
ISR_NOERR 18    ; Machine Check
ISR_NOERR 19    ; SIMD Exception
ISR_NOERR 20    ; Virtualization Exception
ISR_ERR   21    ; Control Protection (has error code)
ISR_NOERR 22    ; Reserved
ISR_NOERR 23    ; Reserved
ISR_NOERR 24    ; Reserved
ISR_NOERR 25    ; Reserved
ISR_NOERR 26    ; Reserved
ISR_NOERR 27    ; Reserved
ISR_NOERR 28    ; Hypervisor Injection
ISR_ERR   29    ; VMM Communication (has error code)
ISR_ERR   30    ; Security Exception (has error code)
ISR_NOERR 31    ; Reserved

; IRQ handlers (32-47)
IRQ_STUB 32     ; Timer
IRQ_STUB 33     ; Keyboard
IRQ_STUB 34     ; Cascade
IRQ_STUB 35     ; COM2
IRQ_STUB 36     ; COM1
IRQ_STUB 37     ; LPT2
IRQ_STUB 38     ; Floppy
IRQ_STUB 39     ; LPT1
IRQ_STUB 40     ; RTC
IRQ_STUB 41     ; Free
IRQ_STUB 42     ; Free
IRQ_STUB 43     ; Free
IRQ_STUB 44     ; Mouse
IRQ_STUB 45     ; FPU
IRQ_STUB 46     ; ATA Primary
IRQ_STUB 47     ; ATA Secondary

; Common stub for exception handlers
isr_common_stub:
    ; Save all general-purpose registers
    ; Must match InterruptFrame layout in idt.h
    push rax
    push rcx
    push rdx
    push rbx
    push rbp
    push rsi
    push rdi
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15

    ; Pass pointer to InterruptFrame as first argument
    mov rdi, rsp

    ; Align stack to 16 bytes (ABI requirement)
    ; RSP should be 16-byte aligned before call
    and rsp, ~0xF

    ; Call C exception handler
    call exception_handler

    ; Restore stack pointer to frame
    mov rsp, rdi

    ; Restore registers (reverse order)
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rdi
    pop rsi
    pop rbp
    pop rbx
    pop rdx
    pop rcx
    pop rax

    ; Remove vector and error code
    add rsp, 16

    ; Return from interrupt
    iretq

; Common stub for IRQ handlers
irq_common_stub:
    ; Save all general-purpose registers
    push rax
    push rcx
    push rdx
    push rbx
    push rbp
    push rsi
    push rdi
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15

    ; Pass pointer to InterruptFrame as first argument
    mov rdi, rsp

    ; Save original stack pointer
    mov rbx, rsp

    ; Align stack to 16 bytes (ABI requirement)
    and rsp, ~0xF

    ; Call C IRQ handler
    call irq_handler

    ; Restore stack pointer
    mov rsp, rbx

    ; Restore registers (reverse order)
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rdi
    pop rsi
    pop rbp
    pop rbx
    pop rdx
    pop rcx
    pop rax

    ; Remove vector and error code
    add rsp, 16

    ; Return from interrupt
    iretq
