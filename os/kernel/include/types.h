/*
 * AlphaOS - Basic type definitions
 */

#ifndef _TYPES_H
#define _TYPES_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* Common type aliases */
typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;

typedef int8_t   i8;
typedef int16_t  i16;
typedef int32_t  i32;
typedef int64_t  i64;

typedef size_t   usize;

/* Compiler hints */
#define UNUSED(x)     ((void)(x))
#define PACKED        __attribute__((packed))
#define ALIGNED(n)    __attribute__((aligned(n)))
#define NORETURN      __attribute__((noreturn))
#define ALWAYS_INLINE __attribute__((always_inline)) inline

/* Memory barriers */
#define barrier() __asm__ volatile("" ::: "memory")

/* Port I/O */
static ALWAYS_INLINE void outb(u16 port, u8 value) {
    __asm__ volatile("outb %0, %1" : : "a"(value), "Nd"(port));
}

static ALWAYS_INLINE u8 inb(u16 port) {
    u8 value;
    __asm__ volatile("inb %1, %0" : "=a"(value) : "Nd"(port));
    return value;
}

static ALWAYS_INLINE void outw(u16 port, u16 value) {
    __asm__ volatile("outw %0, %1" : : "a"(value), "Nd"(port));
}

static ALWAYS_INLINE u16 inw(u16 port) {
    u16 value;
    __asm__ volatile("inw %1, %0" : "=a"(value) : "Nd"(port));
    return value;
}

static ALWAYS_INLINE void outl(u16 port, u32 value) {
    __asm__ volatile("outl %0, %1" : : "a"(value), "Nd"(port));
}

static ALWAYS_INLINE u32 inl(u16 port) {
    u32 value;
    __asm__ volatile("inl %1, %0" : "=a"(value) : "Nd"(port));
    return value;
}

/* CPU control */
static ALWAYS_INLINE void hlt(void) {
    __asm__ volatile("hlt");
}

static ALWAYS_INLINE void cli(void) {
    __asm__ volatile("cli");
}

static ALWAYS_INLINE void sti(void) {
    __asm__ volatile("sti");
}

static ALWAYS_INLINE void pause(void) {
    __asm__ volatile("pause");
}

#endif /* _TYPES_H */
