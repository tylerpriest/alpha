/*
 * AlphaOS - ACPI Subsystem
 *
 * Basic ACPI table parsing for device discovery.
 * For full AML execution, uACPI will be integrated later.
 */

#include "acpi.h"
#include "console.h"
#include "limine.h"

/* Limine RSDP request */
__attribute__((used, section(".requests")))
static volatile struct limine_rsdp_request rsdp_request = {
    .id = LIMINE_RSDP_REQUEST,
    .revision = 0
};

/* Cached RSDP pointer */
static AcpiRsdp* rsdp = NULL;
static AcpiTableHeader* xsdt = NULL;
static AcpiTableHeader* rsdt = NULL;
static bool acpi_initialized = false;

/* Memory comparison */
static int acpi_memcmp(const void* a, const void* b, usize n) {
    const u8* p1 = (const u8*)a;
    const u8* p2 = (const u8*)b;
    for (usize i = 0; i < n; i++) {
        if (p1[i] != p2[i]) return p1[i] - p2[i];
    }
    return 0;
}

/* Validate checksum */
static bool acpi_validate_checksum(void* table, usize length) {
    u8 sum = 0;
    u8* ptr = (u8*)table;
    for (usize i = 0; i < length; i++) {
        sum += ptr[i];
    }
    return sum == 0;
}

/* Get RSDP address */
void* acpi_get_rsdp(void) {
    return (void*)rsdp;
}

/* Initialize ACPI subsystem */
int acpi_init(void) {
    console_printf("  ACPI: Initializing...\n");

    /* Get RSDP from Limine */
    if (rsdp_request.response == NULL || rsdp_request.response->address == NULL) {
        console_printf("  ACPI: No RSDP from bootloader\n");
        return -1;
    }

    rsdp = (AcpiRsdp*)rsdp_request.response->address;

    /* Validate RSDP signature */
    if (acpi_memcmp(rsdp->signature, ACPI_SIG_RSDP, 8) != 0) {
        console_printf("  ACPI: Invalid RSDP signature\n");
        return -1;
    }

    /* Validate RSDP checksum (first 20 bytes for ACPI 1.0) */
    if (!acpi_validate_checksum(rsdp, 20)) {
        console_printf("  ACPI: RSDP checksum failed\n");
        return -1;
    }

    console_printf("  ACPI: RSDP at %p, revision %d\n", rsdp, rsdp->revision);
    console_printf("  ACPI: OEM: %.6s\n", rsdp->oem_id);

    /* Use XSDT if available (ACPI 2.0+), otherwise RSDT */
    if (rsdp->revision >= 2 && rsdp->xsdt_address != 0) {
        xsdt = (AcpiTableHeader*)(uintptr_t)rsdp->xsdt_address;
        console_printf("  ACPI: XSDT at %p\n", xsdt);
    } else if (rsdp->rsdt_address != 0) {
        rsdt = (AcpiTableHeader*)(uintptr_t)rsdp->rsdt_address;
        console_printf("  ACPI: RSDT at %p\n", rsdt);
    } else {
        console_printf("  ACPI: No XSDT or RSDT found\n");
        return -1;
    }

    acpi_initialized = true;
    console_printf("  ACPI: Initialization complete\n");

    return 0;
}

/* Find ACPI table by signature */
void* acpi_find_table(const char* signature) {
    if (!acpi_initialized) return NULL;

    AcpiTableHeader* sdt = xsdt ? xsdt : rsdt;
    if (!sdt) return NULL;

    /* Calculate number of entries */
    usize header_size = sizeof(AcpiTableHeader);
    usize entry_size = xsdt ? sizeof(u64) : sizeof(u32);
    usize entry_count = (sdt->length - header_size) / entry_size;

    u8* entries = (u8*)sdt + header_size;

    for (usize i = 0; i < entry_count; i++) {
        AcpiTableHeader* table;

        if (xsdt) {
            u64 addr = *(u64*)(entries + i * entry_size);
            table = (AcpiTableHeader*)(uintptr_t)addr;
        } else {
            u32 addr = *(u32*)(entries + i * entry_size);
            table = (AcpiTableHeader*)(uintptr_t)addr;
        }

        if (table && acpi_memcmp(table->signature, signature, 4) == 0) {
            return table;
        }
    }

    return NULL;
}

/* Dump ACPI tables for debugging */
void acpi_dump_tables(void) {
    if (!acpi_initialized) {
        console_printf("  ACPI: Not initialized\n");
        return;
    }

    console_printf("\n  ACPI Tables:\n");

    AcpiTableHeader* sdt = xsdt ? xsdt : rsdt;
    if (!sdt) return;

    usize header_size = sizeof(AcpiTableHeader);
    usize entry_size = xsdt ? sizeof(u64) : sizeof(u32);
    usize entry_count = (sdt->length - header_size) / entry_size;

    u8* entries = (u8*)sdt + header_size;

    for (usize i = 0; i < entry_count; i++) {
        AcpiTableHeader* table;

        if (xsdt) {
            u64 addr = *(u64*)(entries + i * entry_size);
            table = (AcpiTableHeader*)(uintptr_t)addr;
        } else {
            u32 addr = *(u32*)(entries + i * entry_size);
            table = (AcpiTableHeader*)(uintptr_t)addr;
        }

        if (table) {
            console_printf("    %.4s at %p (len=%u, rev=%d)\n",
                table->signature, table, table->length, table->revision);
        }
    }
    console_printf("\n");
}

/*
 * Search for Apple SPI device (APP000D) in ACPI namespace.
 *
 * This is a simplified search that looks for the APP000D hardware ID
 * in the DSDT table. Full AML parsing would require uACPI.
 *
 * The Apple SPI keyboard device typically has:
 * - _HID: APP000D (topcase device)
 * - _CRS: Contains SPI controller info, GPIO pins
 *
 * For now, we use known hardcoded values from MacBook Pro A1706:
 * - SPI controller at PCI 0:1e.0 (8086:9D24)
 * - GPIO for keyboard interrupt
 */
int acpi_find_apple_spi(u64* spi_base, u32* gpio_pin) {
    if (!acpi_initialized) return -1;

    /* Find DSDT */
    AcpiTableHeader* fadt = acpi_find_table("FACP");
    if (!fadt) {
        console_printf("  ACPI: FADT not found\n");
        return -1;
    }

    /* FADT contains DSDT pointer at offset 40 (32-bit) or 140 (64-bit X_DSDT) */
    u8* fadt_data = (u8*)fadt;
    u64 dsdt_addr = 0;

    /* Check for X_DSDT (64-bit, ACPI 2.0+) at offset 140 */
    if (fadt->length >= 148) {
        dsdt_addr = *(u64*)(fadt_data + 140);
    }
    /* Fall back to 32-bit DSDT at offset 40 */
    if (dsdt_addr == 0) {
        dsdt_addr = *(u32*)(fadt_data + 40);
    }

    if (dsdt_addr == 0) {
        console_printf("  ACPI: DSDT not found in FADT\n");
        return -1;
    }

    AcpiTableHeader* dsdt = (AcpiTableHeader*)(uintptr_t)dsdt_addr;
    console_printf("  ACPI: DSDT at %p (len=%u)\n", dsdt, dsdt->length);

    /*
     * Search DSDT for APP000D string (Apple topcase HID).
     * This is a byte search - proper parsing requires AML interpreter.
     */
    u8* dsdt_data = (u8*)dsdt;
    usize dsdt_len = dsdt->length;
    const char* hid = "APP000D";
    usize hid_len = 7;

    bool found = false;
    for (usize i = sizeof(AcpiTableHeader); i < dsdt_len - hid_len; i++) {
        if (acpi_memcmp(&dsdt_data[i], hid, hid_len) == 0) {
            console_printf("  ACPI: Found %s at DSDT offset 0x%lx\n", hid, i);
            found = true;
            break;
        }
    }

    if (!found) {
        /* Also search SSDTs */
        console_printf("  ACPI: APP000D not in DSDT, checking SSDTs...\n");

        /* Search all tables for SSDT */
        AcpiTableHeader* sdt = xsdt ? xsdt : rsdt;
        usize header_size = sizeof(AcpiTableHeader);
        usize entry_size = xsdt ? sizeof(u64) : sizeof(u32);
        usize entry_count = (sdt->length - header_size) / entry_size;
        u8* entries = (u8*)sdt + header_size;

        for (usize t = 0; t < entry_count && !found; t++) {
            AcpiTableHeader* table;
            if (xsdt) {
                u64 addr = *(u64*)(entries + t * entry_size);
                table = (AcpiTableHeader*)(uintptr_t)addr;
            } else {
                u32 addr = *(u32*)(entries + t * entry_size);
                table = (AcpiTableHeader*)(uintptr_t)addr;
            }

            if (table && acpi_memcmp(table->signature, "SSDT", 4) == 0) {
                u8* ssdt_data = (u8*)table;
                usize ssdt_len = table->length;

                for (usize i = sizeof(AcpiTableHeader); i < ssdt_len - hid_len; i++) {
                    if (acpi_memcmp(&ssdt_data[i], hid, hid_len) == 0) {
                        console_printf("  ACPI: Found %s in SSDT at offset 0x%lx\n", hid, i);
                        found = true;
                        break;
                    }
                }
            }
        }
    }

    if (found) {
        /*
         * MacBook Pro A1706 known configuration:
         * The SPI controller is Intel LPSS SPI at PCI 00:1e.0
         * We need to get the actual BAR from PCI config space.
         *
         * For now, return success - the caller should use PCI
         * enumeration to find the Intel LPSS SPI controller.
         */
        *spi_base = 0;  /* Will be determined from PCI */
        *gpio_pin = 0;  /* GPIO for interrupt - needs GPIO driver */

        console_printf("  ACPI: Apple SPI keyboard device found\n");
        return 0;
    }

    console_printf("  ACPI: Apple SPI keyboard device not found\n");
    return -1;
}
