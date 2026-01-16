/*
 * AlphaOS - Minimal Test Framework
 *
 * Simple assertion-based testing for kernel code.
 * Runs at boot time or in QEMU.
 */

#ifndef _TEST_FRAMEWORK_H
#define _TEST_FRAMEWORK_H

#include "../kernel/include/types.h"
#include "../kernel/include/console.h"

/* Test result tracking */
static int tests_run = 0;
static int tests_passed = 0;
static int tests_failed = 0;

/* Colors for output */
#define TEST_COLOR_PASS  0x0000FF00  /* Green */
#define TEST_COLOR_FAIL  0x00FF0000  /* Red */
#define TEST_COLOR_INFO  0x00FFFFFF  /* White */

/* Test macros */
#define TEST_ASSERT(condition, msg) do { \
    tests_run++; \
    if (condition) { \
        tests_passed++; \
    } else { \
        tests_failed++; \
        console_set_color(TEST_COLOR_FAIL, 0); \
        console_printf("  FAIL: %s\n", msg); \
        console_set_color(TEST_COLOR_INFO, 0); \
        console_printf("    at %s:%d\n", __FILE__, __LINE__); \
    } \
} while(0)

#define TEST_ASSERT_EQ(a, b, msg) TEST_ASSERT((a) == (b), msg)
#define TEST_ASSERT_NE(a, b, msg) TEST_ASSERT((a) != (b), msg)
#define TEST_ASSERT_GT(a, b, msg) TEST_ASSERT((a) > (b), msg)
#define TEST_ASSERT_LT(a, b, msg) TEST_ASSERT((a) < (b), msg)
#define TEST_ASSERT_NULL(ptr, msg) TEST_ASSERT((ptr) == NULL, msg)
#define TEST_ASSERT_NOT_NULL(ptr, msg) TEST_ASSERT((ptr) != NULL, msg)

/* Test suite functions */
#define TEST_SUITE(name) void test_suite_##name(void)
#define RUN_TEST_SUITE(name) do { \
    console_printf("\n[TEST] Running: %s\n", #name); \
    test_suite_##name(); \
} while(0)

/* Test summary */
static inline void test_print_summary(void) {
    console_printf("\n========================================\n");
    console_printf("Test Results: %d run, ", tests_run);

    console_set_color(TEST_COLOR_PASS, 0);
    console_printf("%d passed", tests_passed);
    console_set_color(TEST_COLOR_INFO, 0);
    console_printf(", ");

    if (tests_failed > 0) {
        console_set_color(TEST_COLOR_FAIL, 0);
    }
    console_printf("%d failed", tests_failed);
    console_set_color(TEST_COLOR_INFO, 0);

    console_printf("\n========================================\n");
}

#endif /* _TEST_FRAMEWORK_H */
