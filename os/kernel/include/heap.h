/*
 * AlphaOS - Simple Heap Allocator
 *
 * A basic bump allocator for early boot, with a simple free list
 * for better memory reuse once running.
 */

#ifndef _HEAP_H
#define _HEAP_H

#include "types.h"

/* Initialize heap with a memory region */
void heap_init(void* base, usize size);

/* Allocate memory */
void* kmalloc(usize size);

/* Allocate zeroed memory */
void* kzalloc(usize size);

/* Free memory */
void kfree(void* ptr);

/* Get heap statistics */
usize heap_used(void);
usize heap_free(void);

#endif /* _HEAP_H */
