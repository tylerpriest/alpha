/*
 * AlphaOS - String Utilities
 *
 * Single implementation of common string/memory functions.
 * DRY: All modules use these instead of local copies.
 */

#ifndef _STRING_H
#define _STRING_H

#include "types.h"

/* String functions */
usize strlen(const char* s);
char* strcpy(char* dst, const char* src);
char* strncpy(char* dst, const char* src, usize n);
int strcmp(const char* s1, const char* s2);
int strncmp(const char* s1, const char* s2, usize n);
char* strcat(char* dst, const char* src);
char* strchr(const char* s, int c);
char* strstr(const char* haystack, const char* needle);

/* Memory functions */
void* memcpy(void* dst, const void* src, usize n);
void* memmove(void* dst, const void* src, usize n);
void* memset(void* s, int c, usize n);
int memcmp(const void* s1, const void* s2, usize n);
void* memchr(const void* s, int c, usize n);

/* Formatted output */
int snprintf(char* buf, usize size, const char* fmt, ...);

/* Zero memory (common pattern) */
static inline void memzero(void* s, usize n) {
    memset(s, 0, n);
}

#endif /* _STRING_H */
