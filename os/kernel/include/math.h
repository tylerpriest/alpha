/*
 * AlphaOS - Math Library
 *
 * Software floating-point math functions for LLM inference.
 * Uses Taylor series and bit manipulation for efficiency.
 */

#ifndef MATH_H
#define MATH_H

#include "types.h"

/* Constants */
#define M_PI        3.14159265358979323846f
#define M_E         2.71828182845904523536f
#define M_LN2       0.69314718055994530942f
#define M_LOG2E     1.44269504088896340736f
#define INFINITY    __builtin_inff()
#define NAN         __builtin_nanf("")

/* Basic math functions */
float fabsf(float x);
float sqrtf(float x);
float rsqrtf(float x);  /* 1/sqrt(x) - faster for normalization */

/* Exponential and logarithmic */
float expf(float x);
float logf(float x);
float powf(float base, float exp);

/* Trigonometric (needed for RoPE positional encoding) */
float sinf(float x);
float cosf(float x);

/* Hyperbolic (for activations) */
float tanhf(float x);

/* Rounding */
float floorf(float x);
float ceilf(float x);

/* Min/max */
static inline float fminf(float a, float b) { return a < b ? a : b; }
static inline float fmaxf(float a, float b) { return a > b ? a : b; }

/* Utility */
int isnanf(float x);
int isinff(float x);

#endif /* MATH_H */
