/*
 * AlphaOS - FPU/SSE Support
 *
 * Enable x87 FPU, SSE, and optionally AVX for floating point operations.
 * Required for LLM inference.
 */

#include "fpu.h"
#include "console.h"

/* CPU feature flags */
static bool has_fpu = false;
static bool has_sse = false;
static bool has_sse2 = false;
static bool has_avx = false;
static bool fpu_initialized = false;

/* CPUID feature bits */
#define CPUID_FEAT_EDX_FPU   (1 << 0)
#define CPUID_FEAT_EDX_SSE   (1 << 25)
#define CPUID_FEAT_EDX_SSE2  (1 << 26)
#define CPUID_FEAT_ECX_AVX   (1 << 28)

/* CR0 bits */
#define CR0_EM  (1 << 2)   /* Emulation - must be 0 for FPU */
#define CR0_TS  (1 << 3)   /* Task Switched */
#define CR0_MP  (1 << 1)   /* Monitor co-processor */
#define CR0_NE  (1 << 5)   /* Numeric Error */

/* CR4 bits */
#define CR4_OSFXSR    (1 << 9)   /* OS support for FXSAVE/FXRSTOR */
#define CR4_OSXMMEXCPT (1 << 10) /* OS support for unmasked SIMD exceptions */
#define CR4_OSXSAVE   (1 << 18)  /* XSAVE and processor extended states */

/* CPUID instruction */
static void cpuid(u32 func, u32* eax, u32* ebx, u32* ecx, u32* edx) {
    __asm__ volatile(
        "cpuid"
        : "=a"(*eax), "=b"(*ebx), "=c"(*ecx), "=d"(*edx)
        : "a"(func), "c"(0)
    );
}

/* Read CR0 */
static u64 read_cr0(void) {
    u64 val;
    __asm__ volatile("mov %%cr0, %0" : "=r"(val));
    return val;
}

/* Write CR0 */
static void write_cr0(u64 val) {
    __asm__ volatile("mov %0, %%cr0" :: "r"(val));
}

/* Read CR4 */
static u64 read_cr4(void) {
    u64 val;
    __asm__ volatile("mov %%cr4, %0" : "=r"(val));
    return val;
}

/* Write CR4 */
static void write_cr4(u64 val) {
    __asm__ volatile("mov %0, %%cr4" :: "r"(val));
}

/* Initialize FPU */
static void init_fpu_hw(void) {
    __asm__ volatile("fninit");
}

/* Detect CPU features */
static void detect_features(void) {
    u32 eax, ebx, ecx, edx;

    /* Check CPUID availability (should always be available on x86-64) */
    cpuid(1, &eax, &ebx, &ecx, &edx);

    has_fpu = (edx & CPUID_FEAT_EDX_FPU) != 0;
    has_sse = (edx & CPUID_FEAT_EDX_SSE) != 0;
    has_sse2 = (edx & CPUID_FEAT_EDX_SSE2) != 0;
    has_avx = (ecx & CPUID_FEAT_ECX_AVX) != 0;

    console_printf("  FPU: Features - FPU:%s SSE:%s SSE2:%s AVX:%s\n",
        has_fpu ? "yes" : "no",
        has_sse ? "yes" : "no",
        has_sse2 ? "yes" : "no",
        has_avx ? "yes" : "no");
}

/* Initialize FPU and SSE */
int fpu_init(void) {
    console_printf("  FPU: Initializing floating point support...\n");

    /* Detect CPU features */
    detect_features();

    if (!has_fpu) {
        console_printf("  FPU: No FPU detected!\n");
        return -1;
    }

    /* Configure CR0:
     * - Clear EM (no emulation)
     * - Set MP (monitor coprocessor)
     * - Clear TS (no task switch trap)
     * - Set NE (native exception handling)
     */
    u64 cr0 = read_cr0();
    cr0 &= ~CR0_EM;    /* Disable emulation */
    cr0 &= ~CR0_TS;    /* Clear task switched flag */
    cr0 |= CR0_MP;     /* Enable monitor coprocessor */
    cr0 |= CR0_NE;     /* Enable native exceptions */
    write_cr0(cr0);

    /* Initialize x87 FPU */
    init_fpu_hw();

    if (has_sse) {
        /* Configure CR4 for SSE:
         * - Set OSFXSR (enable FXSAVE/FXRSTOR)
         * - Set OSXMMEXCPT (enable SSE exceptions)
         */
        u64 cr4 = read_cr4();
        cr4 |= CR4_OSFXSR;
        cr4 |= CR4_OSXMMEXCPT;
        write_cr4(cr4);

        console_printf("  FPU: SSE enabled\n");
    }

    /* TODO: AVX support requires XSAVE and additional setup */
    if (has_avx) {
        console_printf("  FPU: AVX detected (not enabled yet)\n");
    }

    fpu_initialized = true;
    console_printf("  FPU: Floating point ready\n");

    return 0;
}

/* Check if FPU is available */
bool fpu_available(void) {
    return has_fpu && fpu_initialized;
}

/* Check if SSE is available */
bool sse_available(void) {
    return has_sse && fpu_initialized;
}

/* Check if AVX is available */
bool avx_available(void) {
    return has_avx && fpu_initialized;
}

/* Save FPU state (512 bytes, 16-byte aligned) */
void fpu_save(void* state) {
    if (!fpu_initialized) return;

    if (has_sse) {
        __asm__ volatile("fxsave (%0)" :: "r"(state) : "memory");
    } else {
        __asm__ volatile("fnsave (%0)" :: "r"(state) : "memory");
    }
}

/* Restore FPU state */
void fpu_restore(void* state) {
    if (!fpu_initialized) return;

    if (has_sse) {
        __asm__ volatile("fxrstor (%0)" :: "r"(state) : "memory");
    } else {
        __asm__ volatile("frstor (%0)" :: "r"(state) : "memory");
    }
}
