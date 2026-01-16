/*
 * AlphaOS - Claude API Client
 *
 * Connect to api.anthropic.com for AI assistance.
 */

#ifndef _CLAUDE_H
#define _CLAUDE_H

#include "types.h"

/* Claude API configuration */
#define CLAUDE_API_HOST     "api.anthropic.com"
#define CLAUDE_API_PORT     443
#define CLAUDE_API_VERSION  "2023-06-01"
#define CLAUDE_MODEL        "claude-sonnet-4-20250514"

/* Response callback (for streaming) */
typedef void (*ClaudeStreamCallback)(const char* text, u32 len, void* ctx);

/* Message role */
typedef enum {
    CLAUDE_ROLE_USER,
    CLAUDE_ROLE_ASSISTANT
} ClaudeRole;

/* Message structure */
typedef struct {
    ClaudeRole role;
    const char* content;
} ClaudeMessage;

/* Initialize Claude client */
int claude_init(const char* api_key);

/* Send a simple message and get response */
int claude_chat(const char* user_message, char* response, u32 max_len);

/* Send message with streaming response */
int claude_chat_stream(const char* user_message,
                       ClaudeStreamCallback callback, void* ctx);

/* Send conversation (multiple messages) */
int claude_conversation(const ClaudeMessage* messages, u32 count,
                        char* response, u32 max_len);

/* Check if API is available */
bool claude_is_available(void);

/* Get last error message */
const char* claude_get_error(void);

#endif /* _CLAUDE_H */
