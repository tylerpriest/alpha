/*
 * AlphaOS - Kernel Linker Script
 * For x86_64 with Limine bootloader
 */

OUTPUT_FORMAT(elf64-x86-64)
OUTPUT_ARCH(i386:x86-64)
ENTRY(_start)

/* Limine loads kernel at a high address */
KERNEL_OFFSET = 0xffffffff80000000;

PHDRS {
    requests PT_LOAD;
    text     PT_LOAD;
    rodata   PT_LOAD;
    data     PT_LOAD;
}

SECTIONS {
    /* Start at 2MB physical address */
    . = KERNEL_OFFSET + 0x200000;

    /* Limine requests section - must be in its own segment */
    .requests : {
        KEEP(*(.requests))
    } :requests

    /* Code section */
    . = ALIGN(4096);
    .text : {
        *(.text .text.*)
    } :text

    /* Read-only data */
    . = ALIGN(4096);
    .rodata : {
        *(.rodata .rodata.*)
    } :rodata

    /* Read-write data */
    . = ALIGN(4096);
    .data : {
        *(.data .data.*)
    } :data

    /* BSS (uninitialized data) */
    . = ALIGN(4096);
    .bss : {
        __bss_start = .;
        *(.bss .bss.*)
        *(COMMON)
        __bss_end = .;
    } :data

    /* Discard unnecessary sections */
    /DISCARD/ : {
        *(.comment)
        *(.note*)
        *(.eh_frame*)
    }
}
