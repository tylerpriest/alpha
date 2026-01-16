/*
 * AlphaOS - ACPI Subsystem
 *
 * Wrapper for uACPI integration
 */

#ifndef _ACPI_H
#define _ACPI_H

#include "types.h"

/* ACPI table signatures */
#define ACPI_SIG_RSDP "RSD PTR "
#define ACPI_SIG_RSDT "RSDT"
#define ACPI_SIG_XSDT "XSDT"
#define ACPI_SIG_DSDT "DSDT"
#define ACPI_SIG_FADT "FACP"
#define ACPI_SIG_MADT "APIC"

/* RSDP structure (ACPI 2.0+) */
typedef struct {
    char signature[8];
    u8 checksum;
    char oem_id[6];
    u8 revision;
    u32 rsdt_address;
    /* ACPI 2.0+ fields */
    u32 length;
    u64 xsdt_address;
    u8 extended_checksum;
    u8 reserved[3];
} __attribute__((packed)) AcpiRsdp;

/* Standard ACPI table header */
typedef struct {
    char signature[4];
    u32 length;
    u8 revision;
    u8 checksum;
    char oem_id[6];
    char oem_table_id[8];
    u32 oem_revision;
    u32 creator_id;
    u32 creator_revision;
} __attribute__((packed)) AcpiTableHeader;

/* Initialize ACPI subsystem */
int acpi_init(void);

/* Get RSDP address (provided by bootloader) */
void* acpi_get_rsdp(void);

/* Find ACPI table by signature */
void* acpi_find_table(const char* signature);

/* Parse and dump ACPI tables (for debugging) */
void acpi_dump_tables(void);

/* Find Apple SPI device in ACPI namespace */
int acpi_find_apple_spi(u64* spi_base, u32* gpio_pin);

#endif /* _ACPI_H */
