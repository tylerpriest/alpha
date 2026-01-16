/*
 * AlphaOS - Claude API Client Implementation
 *
 * HTTPS client for Claude API.
 */

#include "claude.h"
#include "tls.h"
#include "tcp.h"
#include "dns.h"
#include "ip.h"
#include "ethernet.h"
#include "console.h"
#include "string.h"
#include "heap.h"

/* API key storage */
static char api_key[128];
static bool initialized = false;
static char last_error[256];

/* Response buffer */
static char response_buffer[16384];

/* Set error message */
static void set_error(const char* msg) {
    u32 i = 0;
    while (msg[i] && i < sizeof(last_error) - 1) {
        last_error[i] = msg[i];
        i++;
    }
    last_error[i] = '\0';
}

/* Simple JSON string escape */
static int json_escape_string(const char* src, char* dst, u32 max_len) {
    u32 j = 0;
    for (u32 i = 0; src[i] && j < max_len - 1; i++) {
        char c = src[i];
        if (c == '"' || c == '\\') {
            if (j + 2 >= max_len) break;
            dst[j++] = '\\';
            dst[j++] = c;
        } else if (c == '\n') {
            if (j + 2 >= max_len) break;
            dst[j++] = '\\';
            dst[j++] = 'n';
        } else if (c == '\r') {
            if (j + 2 >= max_len) break;
            dst[j++] = '\\';
            dst[j++] = 'r';
        } else if (c == '\t') {
            if (j + 2 >= max_len) break;
            dst[j++] = '\\';
            dst[j++] = 't';
        } else {
            dst[j++] = c;
        }
    }
    dst[j] = '\0';
    return j;
}

/* Build API request body */
static int build_request_body(const char* user_message, char* body, u32 max_len) {
    char escaped[4096];
    json_escape_string(user_message, escaped, sizeof(escaped));

    /* Build JSON request */
    int len = 0;
    len += snprintf(body + len, max_len - len,
        "{"
        "\"model\":\"%s\","
        "\"max_tokens\":4096,"
        "\"messages\":[{\"role\":\"user\",\"content\":\"%s\"}]"
        "}",
        CLAUDE_MODEL, escaped);

    return len;
}

/* Parse content from JSON response */
static int parse_response_content(const char* json, char* content, u32 max_len) {
    /* Find "content":[{"type":"text","text":" */
    const char* marker = "\"text\":\"";
    const char* p = json;

    while ((p = strstr(p, marker)) != NULL) {
        p += strlen(marker);

        /* Extract text until closing quote */
        u32 j = 0;
        while (*p && j < max_len - 1) {
            if (*p == '\\' && p[1]) {
                p++;
                if (*p == 'n') content[j++] = '\n';
                else if (*p == 'r') content[j++] = '\r';
                else if (*p == 't') content[j++] = '\t';
                else if (*p == '"') content[j++] = '"';
                else if (*p == '\\') content[j++] = '\\';
                else content[j++] = *p;
                p++;
            } else if (*p == '"') {
                break;
            } else {
                content[j++] = *p++;
            }
        }
        content[j] = '\0';
        return j;
    }

    return -1;  /* Not found */
}

/* Initialize Claude client */
int claude_init(const char* key) {
    if (!key || key[0] == '\0') {
        set_error("API key required");
        return -1;
    }

    /* Copy API key */
    u32 i = 0;
    while (key[i] && i < sizeof(api_key) - 1) {
        api_key[i] = key[i];
        i++;
    }
    api_key[i] = '\0';

    initialized = true;
    console_printf("  Claude: API client initialized\n");

    return 0;
}

/* Check if API is available */
bool claude_is_available(void) {
    if (!initialized) return false;

    /* Check if we have network */
    IpConfig* cfg = ip_get_config();
    return cfg->configured;
}

/* Send chat message and get response */
int claude_chat(const char* user_message, char* response, u32 max_len) {
    if (!initialized) {
        set_error("Not initialized");
        return -1;
    }

    if (!claude_is_available()) {
        set_error("Network not available");
        return -2;
    }

    /* Resolve API hostname */
    u32 api_ip;
    if (dns_resolve(CLAUDE_API_HOST, &api_ip) != 0) {
        set_error("DNS resolution failed");
        return -3;
    }

    /* Connect TCP */
    console_printf("  Claude: Connecting to API...\n");
    TcpConnection* tcp = tcp_connect(api_ip, CLAUDE_API_PORT);
    if (!tcp) {
        set_error("TCP connection failed");
        return -4;
    }

    /* TLS handshake */
    TlsConnection* tls = tls_connect(tcp);
    if (!tls) {
        tcp_close(tcp);
        set_error("TLS connection failed");
        return -5;
    }

    if (tls_handshake(tls) != 0) {
        tls_close(tls);
        tcp_close(tcp);
        set_error("TLS handshake failed");
        return -6;
    }

    /* Build request body */
    char body[8192];
    int body_len = build_request_body(user_message, body, sizeof(body));

    /* Build HTTP request */
    char request[16384];
    int req_len = snprintf(request, sizeof(request),
        "POST /v1/messages HTTP/1.1\r\n"
        "Host: %s\r\n"
        "Content-Type: application/json\r\n"
        "X-API-Key: %s\r\n"
        "Anthropic-Version: %s\r\n"
        "Content-Length: %d\r\n"
        "\r\n"
        "%s",
        CLAUDE_API_HOST, api_key, CLAUDE_API_VERSION, body_len, body);

    /* Send request */
    if (tls_send(tls, request, req_len) < 0) {
        tls_close(tls);
        tcp_close(tcp);
        set_error("Failed to send request");
        return -7;
    }

    /* Receive response */
    int resp_len = tls_recv(tls, response_buffer, sizeof(response_buffer) - 1);
    if (resp_len < 0) {
        tls_close(tls);
        tcp_close(tcp);
        set_error("Failed to receive response");
        return -8;
    }
    response_buffer[resp_len] = '\0';

    /* Close connection */
    tls_close(tls);
    tcp_close(tcp);

    /* Find body in HTTP response (after \r\n\r\n) */
    char* body_start = strstr(response_buffer, "\r\n\r\n");
    if (!body_start) {
        set_error("Invalid HTTP response");
        return -9;
    }
    body_start += 4;

    /* Parse JSON response */
    if (parse_response_content(body_start, response, max_len) < 0) {
        set_error("Failed to parse response");
        return -10;
    }

    return 0;
}

/* Streaming chat (callback for each chunk) */
int claude_chat_stream(const char* user_message,
                       ClaudeStreamCallback callback, void* ctx) {
    /* For now, use non-streaming and call callback once */
    char response[8192];
    int ret = claude_chat(user_message, response, sizeof(response));
    if (ret == 0 && callback) {
        u32 len = 0;
        while (response[len]) len++;
        callback(response, len, ctx);
    }
    return ret;
}

/* Conversation with multiple messages */
int claude_conversation(const ClaudeMessage* messages, u32 count,
                        char* response, u32 max_len) {
    /* Build multi-message request (simplified - just use last user message) */
    for (int i = count - 1; i >= 0; i--) {
        if (messages[i].role == CLAUDE_ROLE_USER) {
            return claude_chat(messages[i].content, response, max_len);
        }
    }

    set_error("No user message in conversation");
    return -1;
}

/* Get last error */
const char* claude_get_error(void) {
    return last_error;
}
