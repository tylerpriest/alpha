/*
 * AlphaOS - Claude Code Proxy Client
 *
 * Connects to a remote Claude Code instance via HTTP proxy.
 * The proxy runs Claude Code and relays input/output.
 */

#ifndef _CLAUDE_PROXY_H
#define _CLAUDE_PROXY_H

#include "types.h"

/* Default proxy settings */
#define CLAUDE_PROXY_PORT   3000

/* Proxy response callback */
typedef void (*ProxyOutputCallback)(const char* text, u32 len, void* ctx);

/* Initialize proxy client */
int claude_proxy_init(const char* proxy_host, u16 proxy_port);

/* Send input to Claude Code */
int claude_proxy_send(const char* input);

/* Receive output (blocking) */
int claude_proxy_recv(char* buffer, u32 max_len);

/* Send and receive with streaming callback */
int claude_proxy_chat(const char* input,
                      ProxyOutputCallback callback, void* ctx);

/* Check connection status */
bool claude_proxy_connected(void);

/* Disconnect */
void claude_proxy_disconnect(void);

#endif /* _CLAUDE_PROXY_H */
