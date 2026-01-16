/*
 * AlphaOS - Math Function Unit Tests
 */

#include "../test_framework.h"
#include "../../kernel/include/math.h"

/* Helper: float approximately equal */
static bool float_eq(float a, float b, float epsilon) {
    float diff = a - b;
    if (diff < 0) diff = -diff;
    return diff < epsilon;
}

#define TEST_FLOAT_EQ(a, b, eps, msg) TEST_ASSERT(float_eq(a, b, eps), msg)

TEST_SUITE(math) {
    float epsilon = 0.0001f;

    /* sqrtf tests */
    TEST_FLOAT_EQ(sqrtf(4.0f), 2.0f, epsilon, "sqrtf(4) = 2");
    TEST_FLOAT_EQ(sqrtf(9.0f), 3.0f, epsilon, "sqrtf(9) = 3");
    TEST_FLOAT_EQ(sqrtf(2.0f), 1.4142f, 0.001f, "sqrtf(2) ≈ 1.414");
    TEST_FLOAT_EQ(sqrtf(1.0f), 1.0f, epsilon, "sqrtf(1) = 1");
    TEST_FLOAT_EQ(sqrtf(0.0f), 0.0f, epsilon, "sqrtf(0) = 0");

    /* expf tests */
    TEST_FLOAT_EQ(expf(0.0f), 1.0f, epsilon, "expf(0) = 1");
    TEST_FLOAT_EQ(expf(1.0f), 2.7182f, 0.01f, "expf(1) ≈ e");

    /* logf tests */
    TEST_FLOAT_EQ(logf(1.0f), 0.0f, epsilon, "logf(1) = 0");
    TEST_FLOAT_EQ(logf(2.7182818f), 1.0f, 0.001f, "logf(e) ≈ 1");

    /* sinf/cosf tests */
    TEST_FLOAT_EQ(sinf(0.0f), 0.0f, epsilon, "sinf(0) = 0");
    TEST_FLOAT_EQ(cosf(0.0f), 1.0f, epsilon, "cosf(0) = 1");

    /* powf tests */
    TEST_FLOAT_EQ(powf(2.0f, 3.0f), 8.0f, epsilon, "powf(2,3) = 8");
    TEST_FLOAT_EQ(powf(2.0f, 0.0f), 1.0f, epsilon, "powf(2,0) = 1");
    TEST_FLOAT_EQ(powf(2.0f, 0.5f), 1.4142f, 0.001f, "powf(2,0.5) ≈ √2");

    /* fmaxf/fminf tests */
    TEST_FLOAT_EQ(fmaxf(1.0f, 2.0f), 2.0f, epsilon, "fmaxf(1,2) = 2");
    TEST_FLOAT_EQ(fminf(1.0f, 2.0f), 1.0f, epsilon, "fminf(1,2) = 1");
    TEST_FLOAT_EQ(fmaxf(-1.0f, -2.0f), -1.0f, epsilon, "fmaxf(-1,-2) = -1");

    /* fabsf tests */
    TEST_FLOAT_EQ(fabsf(-5.0f), 5.0f, epsilon, "fabsf(-5) = 5");
    TEST_FLOAT_EQ(fabsf(5.0f), 5.0f, epsilon, "fabsf(5) = 5");
}
