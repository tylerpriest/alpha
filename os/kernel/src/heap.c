/*
 * AlphaOS - Simple Heap Allocator
 *
 * A basic bump allocator for early boot, with a simple free list
 * for better memory reuse once running.
 */

#include "heap.h"
#include "console.h"

/* Free list node */
typedef struct FreeBlock {
    usize size;
    struct FreeBlock* next;
} FreeBlock;

/* Heap state */
static struct {
    u8* base;
    u8* current;
    u8* end;
    usize total_size;
    usize used;
    FreeBlock* free_list;
    bool initialized;
} heap;

/* Minimum allocation size (includes header) */
#define MIN_ALLOC_SIZE  32
#define ALIGNMENT       16

/* Allocation header */
typedef struct {
    usize size;
    u32 magic;
} AllocHeader;

#define ALLOC_MAGIC 0xA110CA7E

/* Align up to ALIGNMENT */
static inline usize align_up(usize value) {
    return (value + ALIGNMENT - 1) & ~(ALIGNMENT - 1);
}

/* Initialize heap with a memory region */
void heap_init(void* base, usize size) {
    if (size < 4096) {
        console_printf("HEAP: Size too small (%lu bytes)\n", size);
        return;
    }

    heap.base = (u8*)base;
    heap.current = heap.base;
    heap.end = heap.base + size;
    heap.total_size = size;
    heap.used = 0;
    heap.free_list = NULL;
    heap.initialized = true;

    console_printf("  HEAP: Initialized at %p, size %lu KB\n",
        base, size / 1024);
}

/* Try to allocate from free list */
static void* alloc_from_free_list(usize size) {
    FreeBlock** prev = &heap.free_list;
    FreeBlock* block = heap.free_list;

    while (block) {
        if (block->size >= size) {
            /* Found a suitable block */
            *prev = block->next;

            /* If block is much larger, split it */
            if (block->size >= size + MIN_ALLOC_SIZE + sizeof(FreeBlock)) {
                FreeBlock* new_block = (FreeBlock*)((u8*)block + size);
                new_block->size = block->size - size;
                new_block->next = heap.free_list;
                heap.free_list = new_block;
                block->size = size;
            }

            return block;
        }
        prev = &block->next;
        block = block->next;
    }

    return NULL;
}

/* Allocate memory */
void* kmalloc(usize size) {
    if (!heap.initialized || size == 0) {
        return NULL;
    }

    /* Calculate total size with header */
    usize total = align_up(size + sizeof(AllocHeader));
    if (total < MIN_ALLOC_SIZE) {
        total = MIN_ALLOC_SIZE;
    }

    /* Try free list first */
    void* block = alloc_from_free_list(total);
    if (!block) {
        /* Bump allocate */
        if (heap.current + total > heap.end) {
            console_printf("HEAP: Out of memory (need %lu, have %lu)\n",
                total, (usize)(heap.end - heap.current));
            return NULL;
        }
        block = heap.current;
        heap.current += total;
    }

    /* Set up header */
    AllocHeader* header = (AllocHeader*)block;
    header->size = total;
    header->magic = ALLOC_MAGIC;

    heap.used += total;

    return (u8*)block + sizeof(AllocHeader);
}

/* Allocate zeroed memory */
void* kzalloc(usize size) {
    void* ptr = kmalloc(size);
    if (ptr) {
        u8* p = (u8*)ptr;
        for (usize i = 0; i < size; i++) {
            p[i] = 0;
        }
    }
    return ptr;
}

/* Free memory */
void kfree(void* ptr) {
    if (!ptr || !heap.initialized) {
        return;
    }

    AllocHeader* header = (AllocHeader*)((u8*)ptr - sizeof(AllocHeader));

    /* Validate magic */
    if (header->magic != ALLOC_MAGIC) {
        console_printf("HEAP: Invalid free at %p (bad magic)\n", ptr);
        return;
    }

    usize size = header->size;
    heap.used -= size;

    /* Add to free list */
    FreeBlock* block = (FreeBlock*)header;
    block->size = size;
    block->next = heap.free_list;
    heap.free_list = block;
}

/* Get heap statistics */
usize heap_used(void) {
    return heap.used;
}

usize heap_free(void) {
    if (!heap.initialized) return 0;
    return heap.total_size - heap.used;
}
