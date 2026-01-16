# AlphaOS Tests

Following TDD-Ready principle: testing infrastructure exists, use it when valuable.

## Directory Structure

```
tests/
├── test_framework.h    # Assertion macros and test runner
├── unit/               # Pure function tests (no hardware)
│   ├── test_string.c   # String/memory functions
│   ├── test_math.c     # Math functions
│   └── test_tokenizer.c # (future)
├── integration/        # Driver initialization tests
│   ├── test_pci.c      # PCI enumeration
│   ├── test_xhci.c     # USB controller
│   └── test_heap.c     # Memory allocation
└── hardware/           # Real device tests
    └── test_macbook.c  # MacBook-specific tests
```

## Running Tests

### In QEMU (automated)
```bash
make test          # Build and run all tests
make test-unit     # Unit tests only
make test-qemu     # Integration tests in QEMU
```

### On Real Hardware
Boot the test ISO and tests run automatically at startup.

## Writing Tests

```c
#include "../test_framework.h"

TEST_SUITE(my_feature) {
    // Basic assertions
    TEST_ASSERT(condition, "description");
    TEST_ASSERT_EQ(a, b, "a equals b");
    TEST_ASSERT_NE(a, b, "a not equals b");
    TEST_ASSERT_GT(a, b, "a greater than b");
    TEST_ASSERT_LT(a, b, "a less than b");
    TEST_ASSERT_NULL(ptr, "ptr is null");
    TEST_ASSERT_NOT_NULL(ptr, "ptr not null");
}
```

## Backpressure

Tests provide backpressure in the Ralph loop:
1. Build must compile
2. Tests must pass
3. If tests fail, fix before committing

This ensures bad outputs get rejected automatically.
