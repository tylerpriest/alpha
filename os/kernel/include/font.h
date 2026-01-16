/*
 * AlphaOS - Bitmap Font (8x16)
 */

#ifndef _FONT_H
#define _FONT_H

#include "types.h"

#define FONT_WIDTH  8
#define FONT_HEIGHT 16

/* Get font bitmap data for a character */
const u8* font_get_glyph(char c);

#endif /* _FONT_H */
