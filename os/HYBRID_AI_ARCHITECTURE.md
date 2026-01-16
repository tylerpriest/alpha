# Hybrid AI Architecture: Local-First, Cloud-Enhanced

## The Best of Both Worlds

AlphaOS is **local-first** by design—your AI runs on your hardware, your data stays private. But when you need more capability, you can **optionally** connect to cloud AI services.

This is inspired by projects like [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) and [VibeProxy](https://github.com/automazeio/vibeproxy), which demonstrate how to unify access to multiple AI providers.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                              │
│                    "Explain quantum computing"                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTENT ROUTER                              │
│                                                                 │
│  Analyzes request complexity:                                   │
│  - Simple query? → Local model                                  │
│  - Complex reasoning? → Cloud (if enabled)                      │
│  - Private data? → Local only                                   │
│  - User preference? → Respect settings                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      LOCAL ENGINE       │     │      CLOUD ENGINE       │
│                         │     │                         │
│  llama.cpp              │     │  Unified API Layer      │
│  Llama 3.2 3B           │     │  ├── Claude API         │
│  ~20 tok/s              │     │  ├── OpenAI API         │
│                         │     │  ├── Gemini API         │
│  ✓ Always available     │     │  └── Custom endpoints   │
│  ✓ 100% private         │     │                         │
│  ✓ No internet needed   │     │  ✓ More capable         │
│                         │     │  ✓ Faster (sometimes)   │
│                         │     │  ✗ Requires connection  │
│                         │     │  ✗ Data leaves device   │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RESPONSE                                  │
│              "Quantum computing is a type of..."                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Local by Default

```
┌────────────────────────────────────────────────────────────────┐
│ PRIVACY MODE: LOCAL ONLY (Default)                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  All processing happens on your device.                        │
│  Network disabled for AI operations.                           │
│  Your conversations never leave your machine.                  │
│                                                                │
│  Capability: Llama 3.2 3B (~GPT-3.5 level)                    │
│  Speed: 15-25 tokens/second                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2. Explicit Cloud Opt-In

The user must explicitly enable cloud AI. It's never automatic.

```
> /settings ai-mode

Current: LOCAL ONLY

Options:
1. Local Only (default) - All AI runs on device
2. Local Preferred     - Use cloud for complex tasks only
3. Cloud Preferred     - Use cloud when available
4. Cloud Only          - Always use cloud (requires internet)

Select [1-4]: _
```

### 3. Smart Routing

When cloud is enabled, the system intelligently routes requests:

| Request Type | Route To | Reason |
|--------------|----------|--------|
| Simple chat | Local | Fast enough, private |
| File operations | Local | Involves local data |
| Complex reasoning | Cloud | Better capability |
| Code generation | Cloud | Higher quality |
| Private/sensitive | Local | User data protection |
| Offline | Local | No choice |

### 4. Transparent Operation

The user always knows which engine is being used:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  > Explain the theory of relativity in simple terms           │
│                                                                │
│  [🏠 Local] Einstein's theory of relativity actually has      │
│  two parts: special relativity and general relativity...      │
│                                                                │
│  > Write a complex recursive algorithm to solve the           │
│    traveling salesman problem with dynamic programming        │
│                                                                │
│  [☁️ Cloud: Claude] Here's an optimized solution using        │
│  dynamic programming with bitmask representation...           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Cloud Provider Integration

### Unified API Layer

All cloud providers are accessed through a unified interface:

```c
typedef struct {
    const char* name;
    const char* api_base;
    const char* model;
    AuthMethod auth;
    bool supports_streaming;
    bool supports_tools;
} CloudProvider;

CloudProvider providers[] = {
    {
        .name = "Claude",
        .api_base = "https://api.anthropic.com/v1",
        .model = "claude-sonnet-4-20250514",
        .auth = AUTH_API_KEY,
        .supports_streaming = true,
        .supports_tools = true
    },
    {
        .name = "OpenAI",
        .api_base = "https://api.openai.com/v1",
        .model = "gpt-4o",
        .auth = AUTH_API_KEY,
        .supports_streaming = true,
        .supports_tools = true
    },
    {
        .name = "Gemini",
        .api_base = "https://generativelanguage.googleapis.com/v1beta",
        .model = "gemini-1.5-pro",
        .auth = AUTH_API_KEY,
        .supports_streaming = true,
        .supports_tools = true
    },
    {
        .name = "Local Proxy",
        .api_base = "http://localhost:8080/v1",
        .model = "auto",
        .auth = AUTH_NONE,  // Proxy handles auth
        .supports_streaming = true,
        .supports_tools = true
    }
};
```

### Authentication Options

**Option A: Direct API Keys**
```
> /settings cloud add-provider

Provider: Claude
API Key: sk-ant-xxxxx
✓ Saved securely to /config/providers.enc

Testing connection... ✓ Connected to Claude API
```

**Option B: OAuth via Proxy (like CLIProxyAPI)**
```
> /settings cloud oauth-login

Starting OAuth flow for Claude...
Opening browser: https://console.anthropic.com/oauth/...

Waiting for authentication...
✓ Authenticated as user@email.com

Token saved. You can now use Claude without API key.
```

**Option C: Local Proxy Server**
```
> /settings cloud set-proxy http://192.168.1.100:8080

Testing proxy... ✓ Connected
Available models via proxy:
- claude-sonnet-4-20250514 (Claude)
- gpt-4o (OpenAI)
- gemini-1.5-pro (Gemini)
```

---

## Implementation Strategy

### Phase 1: Local Only (MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL INFERENCE ONLY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    llama.cpp                              │ │
│  │                                                           │ │
│  │  Model: Llama 3.2 3B Q4_K_M                              │ │
│  │  Fully offline capable                                    │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  No network stack required                                      │
│  No authentication complexity                                   │
│  Focus on core OS functionality                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Network Stack

Before cloud integration, we need basic networking:

1. **Ethernet driver** (for testing)
2. **TCP/IP stack** (lwIP or custom minimal)
3. **TLS library** (BearSSL or mbedTLS)
4. **HTTP client**

### Phase 3: Cloud Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID AI ENGINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │   LOCAL ENGINE      │     │   CLOUD ENGINE      │          │
│  │                     │     │                     │          │
│  │   llama.cpp         │     │   HTTP Client       │          │
│  │   Embedding model   │     │   API Wrappers      │          │
│  │                     │     │   Auth Manager      │          │
│  └─────────────────────┘     └─────────────────────┘          │
│            │                           │                       │
│            └───────────┬───────────────┘                       │
│                        │                                        │
│            ┌───────────▼───────────┐                           │
│            │     ROUTER           │                           │
│            │                       │                           │
│            │  - Complexity check   │                           │
│            │  - Privacy check      │                           │
│            │  - Availability check │                           │
│            └───────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Multi-Provider Support

- Add provider preference ordering
- Implement fallback chains
- Load balancing across accounts
- Cost tracking (for paid APIs)

---

## Security Considerations

### API Key Storage

```
/config/
├── providers.enc          # Encrypted provider configs
├── tokens/                # OAuth tokens (encrypted)
│   ├── claude.token
│   ├── openai.token
│   └── gemini.token
└── proxy.conf             # Proxy settings (if used)

Encryption: AES-256-GCM with key derived from user passphrase
```

### Network Isolation

```c
// Privacy-sensitive operations NEVER go to cloud
bool should_use_local(const char* prompt, Context* ctx) {
    // Check for personal data patterns
    if (contains_personal_data(prompt)) return true;

    // Check if prompt references local files
    if (references_local_files(prompt)) return true;

    // Check user's explicit local-only topics
    if (matches_private_topics(prompt, ctx->user_settings)) return true;

    // Check if we're working with user's documents
    if (ctx->has_document_context) return true;

    return false;  // OK to potentially use cloud
}
```

### Data Minimization

When sending to cloud, strip unnecessary context:

```c
char* prepare_cloud_request(const char* prompt, Context* ctx) {
    // Remove local file paths
    // Remove personal identifiers
    // Remove conversation history (unless needed)
    // Only send what's necessary for the task
}
```

---

## User Control Panel

```
┌────────────────────────────────────────────────────────────────┐
│                     AI SETTINGS                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Processing Mode                                               │
│  ───────────────                                               │
│  [●] Local Only          Privacy maximum, offline capable      │
│  [ ] Local Preferred     Cloud for complex tasks only          │
│  [ ] Hybrid              Smart routing based on task           │
│  [ ] Cloud Preferred     Better quality, requires internet     │
│                                                                │
│  Cloud Providers (when enabled)                                │
│  ──────────────────────────────                                │
│  [✓] Claude              Configured (API key)                  │
│  [ ] OpenAI              Not configured                        │
│  [ ] Gemini              Not configured                        │
│  [✓] Local Proxy         http://localhost:8080                 │
│                                                                │
│  Privacy Rules                                                 │
│  ─────────────                                                 │
│  [✓] Never send local file contents                           │
│  [✓] Never send conversation history                          │
│  [✓] Strip personal identifiers                               │
│  [✓] Require confirmation for cloud requests                  │
│                                                                │
│  Local Model                                                   │
│  ───────────                                                   │
│  Current: Llama 3.2 3B Q4_K_M (2.3 GB)                        │
│  [Change Model] [Download New Model]                           │
│                                                                │
│  > /settings save                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Inspiration: Claude Code Model

Claude Code demonstrates the AI-native interface paradigm:

- **Conversation is the interface** - You describe what you want
- **AI has tools** - File operations, terminal commands, web access
- **Context is persistent** - Remembers project state
- **Local execution** - Runs on your machine
- **Cloud intelligence** - Powered by Claude API

AlphaOS takes this further:
- **AI IS the OS** - Not an app running on an OS
- **Local-first AI** - Can run fully offline
- **Unified memory** - All knowledge in one semantic store
- **Hardware integration** - Direct access to system resources

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Claude Code              AlphaOS                              │
│  ───────────              ────────                             │
│  App on macOS/Linux  →    IS the operating system              │
│  Claude API required →    Local model (cloud optional)         │
│  Code-focused        →    General purpose                      │
│  File + terminal     →    Full hardware access                 │
│  Project context     →    Lifetime knowledge base              │
│                                                                │
│  Common Vision:                                                │
│  • Natural language interface                                  │
│  • AI with tools/agency                                        │
│  • Persistent context                                          │
│  • Human intent → machine action                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Future: Federated AI

Long-term vision: Multiple AlphaOS devices can collaborate while preserving privacy.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Your Laptop    │     │  Your Desktop   │     │  Your Server    │
│  AlphaOS        │◄───►│  AlphaOS        │◄───►│  AlphaOS        │
│  3B model       │     │  7B model       │     │  70B model      │
│  Personal data  │     │  Work data      │     │  Heavy compute  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                              │
                    Encrypted P2P mesh
                    Federated inference
                    Distributed knowledge
                    Your data, your devices
```

---

## Summary

| Aspect | Local-First | Cloud-Enhanced |
|--------|-------------|----------------|
| **Privacy** | Maximum | Configurable |
| **Availability** | Always | Requires internet |
| **Capability** | Good (3B model) | Excellent (cloud models) |
| **Speed** | Consistent | Variable (network dependent) |
| **Cost** | Free | API costs |
| **Control** | Complete | Shared |

**AlphaOS default: Local-first, privacy-maximum.**

**User choice: Opt-in to cloud for enhanced capability.**

**Best of both worlds: Your AI, your rules.**

---

*Document Version: 1.0*
*Last Updated: January 2026*
