/*
 * AlphaOS - FPU/SSE Support
 *
 * Enable floating point and SIMD operations for LLM inference
 */

#ifndef _FPU_H
#define _FPU_H

#include "types.h"

/* Initialize FPU and SSE */
int fpu_init(void);

/* Check if FPU is available */
bool fpu_available(void);

/* Check if SSE is available */
bool sse_available(void);

/* Check if AVX is available */
bool avx_available(void);

/* Save FPU state */
void fpu_save(void* state);

/* Restore FPU state */
void fpu_restore(void* state);

#endif /* _FPU_H */
