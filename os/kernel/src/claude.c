/*
 * AlphaOS - Claude Code Client
 *
 * Connects to CLIProxyAPI which runs Claude Code.
 * Uses OpenAI-compatible chat completions format.
 *
 * https://github.com/router-for-me/CLIProxyAPI
 */

#include "claude.h"
#include "tls.h"
#include "tcp.h"
#include "dns.h"
#include "ip.h"
#include "console.h"
#include "string.h"
#include "heap.h"

/* Client state */
static ClaudeConfig config;
static bool initialized = false;
static char last_error[256];

/* Response buffer */
static char response_buffer[16384];

static void set_error(const char* msg) {
    u32 i = 0;
    while (msg[i] && i < sizeof(last_error) - 1) {
        last_error[i] = msg[i];
        i++;
    }
    last_error[i] = '\0';
}

static void safe_strcpy(char* dst, const char* src, u32 max_len) {
    u32 i = 0;
    while (src[i] && i < max_len - 1) {
        dst[i] = src[i];
        i++;
    }
    dst[i] = '\0';
}

/* JSON string escape */
static int json_escape(const char* src, char* dst, u32 max_len) {
    u32 j = 0;
    for (u32 i = 0; src[i] && j < max_len - 2; i++) {
        char c = src[i];
        if (c == '"' || c == '\\') {
            dst[j++] = '\\';
            dst[j++] = c;
        } else if (c == '\n') {
            dst[j++] = '\\';
            dst[j++] = 'n';
        } else if (c == '\r') {
            dst[j++] = '\\';
            dst[j++] = 'r';
        } else if (c == '\t') {
            dst[j++] = '\\';
            dst[j++] = 't';
        } else {
            dst[j++] = c;
        }
    }
    dst[j] = '\0';
    return j;
}

/* Build OpenAI-compatible request body */
static int build_request(const char* message, char* body, u32 max_len) {
    char escaped[4096];
    json_escape(message, escaped, sizeof(escaped));

    /* OpenAI chat completions format */
    return snprintf(body, max_len,
        "{"
        "\"model\":\"%s\","
        "\"messages\":[{\"role\":\"user\",\"content\":\"%s\"}]"
        "}",
        config.model, escaped);
}

/* Extract content from OpenAI response */
static int parse_response(const char* json, char* out, u32 max_len) {
    /* Find "content":" in choices[0].message.content */
    const char* p = strstr(json, "\"content\":");
    if (!p) return -1;

    p += 10;  /* skip "content": */
    while (*p == ' ') p++;

    if (*p != '"') return -1;
    p++;  /* skip opening quote */

    u32 j = 0;
    while (*p && j < max_len - 1) {
        if (*p == '\\' && p[1]) {
            p++;
            if (*p == 'n') out[j++] = '\n';
            else if (*p == 'r') out[j++] = '\r';
            else if (*p == 't') out[j++] = '\t';
            else if (*p == '"') out[j++] = '"';
            else if (*p == '\\') out[j++] = '\\';
            else out[j++] = *p;
            p++;
        } else if (*p == '"') {
            break;
        } else {
            out[j++] = *p++;
        }
    }
    out[j] = '\0';
    return j;
}

/* Parse IP address */
static u32 parse_ip(const char* str) {
    u32 p[4] = {0};
    int n = 0;
    for (int i = 0; str[i] && n < 4; i++) {
        if (str[i] >= '0' && str[i] <= '9')
            p[n] = p[n] * 10 + (str[i] - '0');
        else if (str[i] == '.')
            n++;
    }
    return (p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3];
}

static bool is_ip(const char* s) {
    int dots = 0;
    for (int i = 0; s[i]; i++) {
        if (s[i] == '.') dots++;
        else if (s[i] < '0' || s[i] > '9') return false;
    }
    return dots == 3;
}

/* Initialize with CLIProxyAPI endpoint */
int claude_init_proxy(const ClaudeConfig* cfg) {
    if (!cfg || !cfg->host[0]) {
        set_error("Host required");
        return -1;
    }

    memcpy(&config, cfg, sizeof(ClaudeConfig));

    if (config.port == 0)
        config.port = config.use_tls ? 443 : 3000;
    if (config.model[0] == '\0')
        safe_strcpy(config.model, CLAUDE_DEFAULT_MODEL, sizeof(config.model));

    initialized = true;
    console_printf("  Claude: CLIProxyAPI at %s:%d\n", config.host, config.port);
    return 0;
}

/* Initialize for direct API (still goes through proxy typically) */
int claude_init(const char* api_key) {
    memset(&config, 0, sizeof(config));
    safe_strcpy(config.host, "localhost", sizeof(config.host));
    config.port = 3000;
    config.use_tls = false;
    if (api_key)
        safe_strcpy(config.api_key, api_key, sizeof(config.api_key));
    safe_strcpy(config.model, CLAUDE_DEFAULT_MODEL, sizeof(config.model));

    initialized = true;
    console_printf("  Claude: Using local CLIProxyAPI\n");
    return 0;
}

bool claude_is_available(void) {
    if (!initialized) return false;
    IpConfig* cfg = ip_get_config();
    return cfg->configured;
}

/* Send message to Claude Code via CLIProxyAPI */
int claude_chat(const char* message, char* response, u32 max_len) {
    if (!initialized) {
        set_error("Not initialized");
        return -1;
    }

    if (!claude_is_available()) {
        set_error("No network");
        return -2;
    }

    /* Resolve host */
    u32 ip;
    if (is_ip(config.host)) {
        ip = parse_ip(config.host);
    } else {
        if (dns_resolve(config.host, &ip) != 0) {
            set_error("DNS failed");
            return -3;
        }
    }

    /* Connect */
    console_printf("  Claude: Connecting...\n");
    TcpConnection* tcp = tcp_connect(ip, config.port);
    if (!tcp) {
        set_error("TCP failed");
        return -4;
    }

    /* Build request */
    char body[8192];
    int body_len = build_request(message, body, sizeof(body));

    char request[16384];
    int req_len;

    if (config.api_key[0]) {
        req_len = snprintf(request, sizeof(request),
            "POST /v1/chat/completions HTTP/1.1\r\n"
            "Host: %s:%d\r\n"
            "Content-Type: application/json\r\n"
            "Authorization: Bearer %s\r\n"
            "Content-Length: %d\r\n"
            "\r\n%s",
            config.host, config.port, config.api_key, body_len, body);
    } else {
        req_len = snprintf(request, sizeof(request),
            "POST /v1/chat/completions HTTP/1.1\r\n"
            "Host: %s:%d\r\n"
            "Content-Type: application/json\r\n"
            "Content-Length: %d\r\n"
            "\r\n%s",
            config.host, config.port, body_len, body);
    }

    int resp_len;

    if (config.use_tls) {
        TlsConnection* tls = tls_connect(tcp);
        if (!tls || tls_handshake(tls) != 0) {
            if (tls) tls_close(tls);
            tcp_close(tcp);
            set_error("TLS failed");
            return -5;
        }

        if (tls_send(tls, request, req_len) < 0) {
            tls_close(tls);
            tcp_close(tcp);
            set_error("Send failed");
            return -6;
        }

        resp_len = tls_recv(tls, response_buffer, sizeof(response_buffer) - 1);
        tls_close(tls);
    } else {
        if (tcp_send(tcp, request, req_len) < 0) {
            tcp_close(tcp);
            set_error("Send failed");
            return -6;
        }

        resp_len = tcp_recv(tcp, response_buffer, sizeof(response_buffer) - 1);
    }

    tcp_close(tcp);

    if (resp_len < 0) {
        set_error("Recv failed");
        return -7;
    }
    response_buffer[resp_len] = '\0';

    /* Find JSON body */
    char* json = strstr(response_buffer, "\r\n\r\n");
    if (!json) {
        set_error("Bad response");
        return -8;
    }
    json += 4;

    /* Parse response */
    if (parse_response(json, response, max_len) < 0) {
        set_error("Parse failed");
        return -9;
    }

    return 0;
}

int claude_chat_stream(const char* message, ClaudeStreamCallback cb, void* ctx) {
    char response[8192];
    int ret = claude_chat(message, response, sizeof(response));
    if (ret == 0 && cb) {
        u32 len = strlen(response);
        cb(response, len, ctx);
    }
    return ret;
}

int claude_conversation(const ClaudeMessage* msgs, u32 count,
                        char* response, u32 max_len) {
    for (int i = count - 1; i >= 0; i--) {
        if (msgs[i].role == CLAUDE_ROLE_USER)
            return claude_chat(msgs[i].content, response, max_len);
    }
    set_error("No user message");
    return -1;
}

int claude_chat_with_system(const char* system, const char* message,
                            char* response, u32 max_len) {
    char combined[8192];
    snprintf(combined, sizeof(combined), "[System: %s]\n\n%s", system, message);
    return claude_chat(combined, response, max_len);
}

const char* claude_get_error(void) {
    return last_error;
}

const ClaudeConfig* claude_get_config(void) {
    return initialized ? &config : NULL;
}
