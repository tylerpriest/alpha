/*
 * AlphaOS - Claude Code Client
 *
 * Connect to Claude Code via CLIProxyAPI or direct API.
 * Supports OpenAI-compatible endpoints.
 */

#ifndef _CLAUDE_H
#define _CLAUDE_H

#include "types.h"

/* Default settings (can be overridden) */
#define CLAUDE_DEFAULT_PORT     443
#define CLAUDE_DEFAULT_MODEL    "claude-sonnet-4-20250514"

/* Response callback (for streaming) */
typedef void (*ClaudeStreamCallback)(const char* text, u32 len, void* ctx);

/* Message role */
typedef enum {
    CLAUDE_ROLE_USER,
    CLAUDE_ROLE_ASSISTANT,
    CLAUDE_ROLE_SYSTEM
} ClaudeRole;

/* Message structure */
typedef struct {
    ClaudeRole role;
    const char* content;
} ClaudeMessage;

/* Endpoint configuration */
typedef struct {
    char host[128];         /* Proxy host (e.g., "192.168.1.100" or "localhost") */
    u16 port;               /* Port (default 443 for HTTPS, 3000 for proxy) */
    bool use_tls;           /* Use HTTPS (true) or HTTP (false) */
    char api_key[128];      /* API key (if required) */
    char model[64];         /* Model to use */
} ClaudeConfig;

/* Initialize with proxy configuration */
int claude_init_proxy(const ClaudeConfig* config);

/* Initialize with direct Anthropic API */
int claude_init(const char* api_key);

/* Send a simple message and get response */
int claude_chat(const char* user_message, char* response, u32 max_len);

/* Send message with streaming response */
int claude_chat_stream(const char* user_message,
                       ClaudeStreamCallback callback, void* ctx);

/* Send conversation (multiple messages) */
int claude_conversation(const ClaudeMessage* messages, u32 count,
                        char* response, u32 max_len);

/* Send with system prompt */
int claude_chat_with_system(const char* system_prompt,
                            const char* user_message,
                            char* response, u32 max_len);

/* Check if API is available */
bool claude_is_available(void);

/* Get last error message */
const char* claude_get_error(void);

/* Get current configuration */
const ClaudeConfig* claude_get_config(void);

#endif /* _CLAUDE_H */
