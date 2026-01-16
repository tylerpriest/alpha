/*
 * AlphaOS - String Utilities
 *
 * Single implementation of common string/memory functions.
 * DRY: All modules use these instead of local copies.
 */

#include "string.h"

/* ============ String Functions ============ */

usize strlen(const char* s) {
    usize len = 0;
    while (*s++) len++;
    return len;
}

char* strcpy(char* dst, const char* src) {
    char* d = dst;
    while ((*d++ = *src++));
    return dst;
}

char* strncpy(char* dst, const char* src, usize n) {
    char* d = dst;
    while (n && (*d++ = *src++)) n--;
    while (n--) *d++ = '\0';
    return dst;
}

int strcmp(const char* s1, const char* s2) {
    while (*s1 && *s1 == *s2) {
        s1++;
        s2++;
    }
    return (int)(u8)*s1 - (int)(u8)*s2;
}

int strncmp(const char* s1, const char* s2, usize n) {
    while (n && *s1 && *s1 == *s2) {
        s1++;
        s2++;
        n--;
    }
    if (n == 0) return 0;
    return (int)(u8)*s1 - (int)(u8)*s2;
}

char* strcat(char* dst, const char* src) {
    char* d = dst;
    while (*d) d++;
    while ((*d++ = *src++));
    return dst;
}

char* strchr(const char* s, int c) {
    while (*s) {
        if (*s == (char)c) return (char*)s;
        s++;
    }
    return (c == '\0') ? (char*)s : NULL;
}

char* strstr(const char* haystack, const char* needle) {
    if (!*needle) return (char*)haystack;

    for (; *haystack; haystack++) {
        const char* h = haystack;
        const char* n = needle;

        while (*h && *n && *h == *n) {
            h++;
            n++;
        }

        if (!*n) return (char*)haystack;
    }

    return NULL;
}

/* ============ Memory Functions ============ */

void* memcpy(void* dst, const void* src, usize n) {
    u8* d = (u8*)dst;
    const u8* s = (const u8*)src;
    while (n--) *d++ = *s++;
    return dst;
}

void* memmove(void* dst, const void* src, usize n) {
    u8* d = (u8*)dst;
    const u8* s = (const u8*)src;

    if (d < s) {
        while (n--) *d++ = *s++;
    } else {
        d += n;
        s += n;
        while (n--) *--d = *--s;
    }

    return dst;
}

void* memset(void* s, int c, usize n) {
    u8* p = (u8*)s;
    while (n--) *p++ = (u8)c;
    return s;
}

int memcmp(const void* s1, const void* s2, usize n) {
    const u8* p1 = (const u8*)s1;
    const u8* p2 = (const u8*)s2;

    while (n--) {
        if (*p1 != *p2) {
            return (int)*p1 - (int)*p2;
        }
        p1++;
        p2++;
    }

    return 0;
}

void* memchr(const void* s, int c, usize n) {
    const u8* p = (const u8*)s;
    while (n--) {
        if (*p == (u8)c) return (void*)p;
        p++;
    }
    return NULL;
}
