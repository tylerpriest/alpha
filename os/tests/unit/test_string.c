/*
 * AlphaOS - String Function Unit Tests
 */

#include "../test_framework.h"
#include "../../kernel/include/string.h"

TEST_SUITE(string) {
    /* strlen tests */
    TEST_ASSERT_EQ(strlen(""), 0, "strlen empty string");
    TEST_ASSERT_EQ(strlen("hello"), 5, "strlen 'hello'");
    TEST_ASSERT_EQ(strlen("hello world"), 11, "strlen 'hello world'");

    /* strcmp tests */
    TEST_ASSERT_EQ(strcmp("abc", "abc"), 0, "strcmp equal strings");
    TEST_ASSERT_LT(strcmp("abc", "abd"), 0, "strcmp less than");
    TEST_ASSERT_GT(strcmp("abd", "abc"), 0, "strcmp greater than");
    TEST_ASSERT_LT(strcmp("ab", "abc"), 0, "strcmp shorter string");

    /* strncmp tests */
    TEST_ASSERT_EQ(strncmp("abc", "abd", 2), 0, "strncmp first 2 chars");
    TEST_ASSERT_NE(strncmp("abc", "abd", 3), 0, "strncmp all 3 chars");

    /* strchr tests */
    const char* test_str = "hello world";
    TEST_ASSERT_NOT_NULL(strchr(test_str, 'o'), "strchr find 'o'");
    TEST_ASSERT_NULL(strchr(test_str, 'z'), "strchr not found");
    TEST_ASSERT_EQ(strchr(test_str, 'w') - test_str, 6, "strchr position of 'w'");

    /* memset tests */
    char buf[16];
    memset(buf, 'A', 10);
    buf[10] = '\0';
    TEST_ASSERT_EQ(strlen(buf), 10, "memset filled 10 chars");
    TEST_ASSERT_EQ(buf[0], 'A', "memset first char");
    TEST_ASSERT_EQ(buf[9], 'A', "memset last char");

    /* memcpy tests */
    char src[] = "hello";
    char dst[16];
    memcpy(dst, src, 6);
    TEST_ASSERT_EQ(strcmp(dst, "hello"), 0, "memcpy copied string");

    /* memcmp tests */
    TEST_ASSERT_EQ(memcmp("abc", "abc", 3), 0, "memcmp equal");
    TEST_ASSERT_NE(memcmp("abc", "abd", 3), 0, "memcmp different");
    TEST_ASSERT_EQ(memcmp("abc", "abd", 2), 0, "memcmp first 2 bytes");
}
