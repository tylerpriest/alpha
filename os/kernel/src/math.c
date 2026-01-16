/*
 * AlphaOS - Math Library Implementation
 *
 * Software floating-point math for LLM inference.
 * Optimized for x86-64 with SSE support.
 */

#include "math.h"

/* IEEE 754 float bit manipulation */
typedef union {
    float f;
    u32 i;
} float_bits;

/* Absolute value - clear sign bit */
float fabsf(float x) {
    float_bits fb;
    fb.f = x;
    fb.i &= 0x7FFFFFFF;
    return fb.f;
}

/* Check for NaN */
int isnanf(float x) {
    float_bits fb;
    fb.f = x;
    return ((fb.i & 0x7F800000) == 0x7F800000) && (fb.i & 0x007FFFFF);
}

/* Check for infinity */
int isinff(float x) {
    float_bits fb;
    fb.f = x;
    return ((fb.i & 0x7FFFFFFF) == 0x7F800000);
}

/* Fast inverse square root (Quake III algorithm, refined) */
float rsqrtf(float x) {
    float_bits fb;
    fb.f = x;
    fb.i = 0x5F375A86 - (fb.i >> 1);  /* Magic constant */
    /* Two Newton-Raphson iterations for accuracy */
    fb.f = fb.f * (1.5f - 0.5f * x * fb.f * fb.f);
    fb.f = fb.f * (1.5f - 0.5f * x * fb.f * fb.f);
    return fb.f;
}

/* Square root using inverse sqrt */
float sqrtf(float x) {
    if (x <= 0.0f) return x < 0.0f ? NAN : 0.0f;
    return x * rsqrtf(x);
}

/* Exponential function using range reduction and polynomial */
float expf(float x) {
    /* Handle edge cases */
    if (x > 88.0f) return INFINITY;
    if (x < -88.0f) return 0.0f;

    /* Range reduction: e^x = 2^(x * log2(e)) = 2^n * 2^f where n=int, f=frac */
    float t = x * M_LOG2E;
    int n = (int)(t >= 0 ? t + 0.5f : t - 0.5f);
    float f = t - (float)n;

    /* 2^f approximation using polynomial (Remez minimax) */
    /* Valid for f in [-0.5, 0.5] */
    float f2 = f * f;
    float p = 1.0f + f * (M_LN2 + f2 * (0.2402265f * M_LN2 * M_LN2 * M_LN2 +
                          f2 * 0.0554953f * M_LN2 * M_LN2 * M_LN2 * M_LN2));

    /* Simpler polynomial that works well enough */
    p = 1.0f + f * 0.6931472f;           /* ln(2) */
    p = p + f * f * 0.2402265f;           /* ln(2)^2/2 */
    p = p + f * f * f * 0.0555041f;       /* ln(2)^3/6 */
    p = p + f * f * f * f * 0.0096139f;   /* ln(2)^4/24 */

    /* Multiply by 2^n using bit manipulation */
    float_bits fb;
    fb.f = p;
    fb.i += (u32)n << 23;

    return fb.f;
}

/* Natural logarithm using range reduction */
float logf(float x) {
    if (x <= 0.0f) return x < 0.0f ? NAN : -INFINITY;

    float_bits fb;
    fb.f = x;

    /* Extract exponent */
    int e = ((fb.i >> 23) & 0xFF) - 127;

    /* Extract mantissa, set exponent to 0 (value in [1, 2)) */
    fb.i = (fb.i & 0x007FFFFF) | 0x3F800000;
    float m = fb.f;

    /* Adjust to range [sqrt(2)/2, sqrt(2)] for better convergence */
    if (m > 1.41421356f) {
        m *= 0.5f;
        e++;
    }

    /* log(m) using polynomial approximation for m near 1 */
    float y = (m - 1.0f) / (m + 1.0f);
    float y2 = y * y;

    /* Taylor series: log((1+y)/(1-y)) = 2(y + y^3/3 + y^5/5 + ...) */
    float log_m = 2.0f * y * (1.0f + y2 * (0.33333333f + y2 * (0.2f + y2 * 0.14285714f)));

    /* log(x) = log(m * 2^e) = log(m) + e * log(2) */
    return log_m + (float)e * M_LN2;
}

/* Power function */
float powf(float base, float exp) {
    if (base == 0.0f) return exp > 0.0f ? 0.0f : INFINITY;
    if (exp == 0.0f) return 1.0f;
    if (exp == 1.0f) return base;
    if (exp == 2.0f) return base * base;

    /* x^y = e^(y * ln(x)) */
    return expf(exp * logf(fabsf(base)));
}

/* Sine using Taylor series with range reduction */
float sinf(float x) {
    /* Reduce to [-pi, pi] */
    while (x > M_PI) x -= 2.0f * M_PI;
    while (x < -M_PI) x += 2.0f * M_PI;

    /* Taylor series: sin(x) = x - x^3/3! + x^5/5! - x^7/7! + ... */
    float x2 = x * x;
    float result = x;
    float term = x;

    term *= -x2 / 6.0f;          /* -x^3/3! */
    result += term;
    term *= -x2 / 20.0f;         /* x^5/5! */
    result += term;
    term *= -x2 / 42.0f;         /* -x^7/7! */
    result += term;
    term *= -x2 / 72.0f;         /* x^9/9! */
    result += term;

    return result;
}

/* Cosine using Taylor series */
float cosf(float x) {
    /* Reduce to [-pi, pi] */
    while (x > M_PI) x -= 2.0f * M_PI;
    while (x < -M_PI) x += 2.0f * M_PI;

    /* Taylor series: cos(x) = 1 - x^2/2! + x^4/4! - x^6/6! + ... */
    float x2 = x * x;
    float result = 1.0f;
    float term = 1.0f;

    term *= -x2 / 2.0f;          /* -x^2/2! */
    result += term;
    term *= -x2 / 12.0f;         /* x^4/4! */
    result += term;
    term *= -x2 / 30.0f;         /* -x^6/6! */
    result += term;
    term *= -x2 / 56.0f;         /* x^8/8! */
    result += term;

    return result;
}

/* Hyperbolic tangent - used for some activations */
float tanhf(float x) {
    /* tanh(x) = (e^2x - 1) / (e^2x + 1) */
    if (x > 10.0f) return 1.0f;
    if (x < -10.0f) return -1.0f;

    float e2x = expf(2.0f * x);
    return (e2x - 1.0f) / (e2x + 1.0f);
}

/* Floor - largest integer not greater than x */
float floorf(float x) {
    int i = (int)x;
    return (float)(x < (float)i ? i - 1 : i);
}

/* Ceiling - smallest integer not less than x */
float ceilf(float x) {
    int i = (int)x;
    return (float)(x > (float)i ? i + 1 : i);
}
