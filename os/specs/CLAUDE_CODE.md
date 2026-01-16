# Claude Code Integration Specification

> **Topic:** Claude Code as the primary AI interface
> **Status:** Pending (requires networking)

## Implementation Progress

| Component | Status | Notes |
|-----------|--------|-------|
| Ethernet Layer | Done | EthDevice abstraction |
| USB CDC-ECM | Foundation | Driver structure ready |
| IPv4 | Done | Send/receive, checksum, ping |
| ARP | Done | MAC address resolution |
| UDP | Done | Connectionless messaging |
| TCP | Done | Client with 3-way handshake |
| DHCP | Done | Automatic IP configuration |
| DNS | Done | Hostname resolution |
| Crypto | Done | SHA-256, HMAC, AES-128-CBC |
| TLS | Foundation | Needs RSA/big integer for full handshake |
| HTTPS Client | Pending | Depends on TLS completion |
| Claude API | Pending | Depends on HTTPS |
| Tool Executor | Pending | Need filesystem first |

## Job To Be Done

Make Claude Code the primary way users interact with AlphaOS - natural language commands instead of shell syntax, with full tool use capabilities for file operations, code generation, and system control.

## Requirements

### Claude API Client
1. **HTTPS connection** to api.anthropic.com
2. **Streaming responses** (SSE)
3. **Tool use** support
4. **Context management** (conversation history)
5. **API key storage** (secure)

### Tool Definitions
Claude Code needs tools to interact with the system:

```c
// File Operations
tool_read_file(path)           // Read file contents
tool_write_file(path, content) // Write/create file
tool_edit_file(path, old, new) // Edit existing file
tool_list_directory(path)      // List directory contents
tool_glob(pattern)             // Find files by pattern
tool_grep(pattern, path)       // Search file contents

// System Operations
tool_bash(command)             // Execute shell command
tool_process_list()            // List running processes
tool_memory_info()             // Get memory usage
tool_disk_info()               // Get disk usage

// Build Operations
tool_compile(source, output)   // Compile C file
tool_link(objects, output)     // Link objects
tool_make(target)              // Run make

// AI Operations
tool_local_llm(prompt)         // Query local LLM
tool_web_search(query)         // Search web (future)
```

### User Interface
1. **Single prompt** - User types naturally
2. **Streaming output** - See response as it generates
3. **Tool execution** - Show what tools are being used
4. **Error handling** - Clear error messages
5. **Interrupt** - Ctrl+C to cancel

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Input                        │
│              "Create a file called test.c"           │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Claude Code Client                   │
│  ┌────────────────────────────────────────────────┐ │
│  │              Message Builder                    │ │
│  │  - System prompt (AlphaOS context)             │ │
│  │  - Conversation history                        │ │
│  │  - Tool definitions                            │ │
│  │  - User message                                │ │
│  └────────────────────────────────────────────────┘ │
│                         │                           │
│                         ▼                           │
│  ┌────────────────────────────────────────────────┐ │
│  │              HTTPS Client                       │ │
│  │  POST /v1/messages                             │ │
│  │  Host: api.anthropic.com                       │ │
│  │  x-api-key: sk-ant-...                         │ │
│  └────────────────────────────────────────────────┘ │
│                         │                           │
│                         ▼                           │
│  ┌────────────────────────────────────────────────┐ │
│  │           Response Handler (SSE)                │ │
│  │  - Text blocks → display                       │ │
│  │  - Tool use blocks → execute                   │ │
│  │  - Tool results → send back                    │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  Tool Executor                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   File   │  │  System  │  │  Build   │          │
│  │  Tools   │  │  Tools   │  │  Tools   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                Console Output                        │
│  Claude> I'll create that file for you.             │
│  [Using tool: write_file]                           │
│  Created test.c with a basic C program.             │
└─────────────────────────────────────────────────────┘
```

## API Message Format

### Request
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "system": "You are Claude Code running on AlphaOS...",
  "tools": [
    {
      "name": "read_file",
      "description": "Read contents of a file",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {"type": "string", "description": "File path"}
        },
        "required": ["path"]
      }
    }
  ],
  "messages": [
    {"role": "user", "content": "Create a file called test.c"}
  ]
}
```

### Response (Streaming SSE)
```
event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"I'll create"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" that file"}}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01...","name":"write_file","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"path\":"}}
```

## System Prompt

```
You are Claude Code running on AlphaOS, an AI-native operating system.

## Environment
- OS: AlphaOS v0.6.0
- Hardware: MacBook Pro A1706
- Filesystem: /root mounted
- Network: Connected
- Local LLM: Available (stories260K)

## Capabilities
You have access to tools for:
- File operations (read, write, edit, list, search)
- System commands (bash execution)
- Build operations (compile, link, make)
- Local LLM queries (offline AI)

## Methodology
When asked to build or implement something:
1. Research - Search codebase for related code
2. Spec - Create specification in /specs/
3. Plan - Update IMPLEMENTATION_PLAN.md
4. Build - Implement incrementally
5. Verify - Test and validate

## Style
- Be concise in explanations
- Show what tools you're using
- Explain errors clearly
- Offer next steps
```

## Tool Implementations

### read_file
```c
ToolResult tool_read_file(const char* path) {
    File* f = fs_open(path, "r");
    if (!f) {
        return (ToolResult){
            .success = false,
            .error = "File not found"
        };
    }

    char* content = malloc(f->size + 1);
    fs_read(f, content, f->size);
    content[f->size] = '\0';
    fs_close(f);

    return (ToolResult){
        .success = true,
        .content = content
    };
}
```

### bash
```c
ToolResult tool_bash(const char* command) {
    // Execute command and capture output
    char output[4096];
    int exit_code = shell_execute(command, output, sizeof(output));

    return (ToolResult){
        .success = exit_code == 0,
        .content = output,
        .exit_code = exit_code
    };
}
```

## Offline Fallback

When network unavailable, fall back to local LLM:

```c
const char* ai_query(const char* prompt) {
    if (network_available()) {
        return claude_api_query(prompt);
    } else {
        console_printf("(Using local LLM - offline mode)\n");
        return local_llm_generate(prompt);
    }
}
```

## Acceptance Criteria

- [ ] Can connect to api.anthropic.com
- [ ] TLS handshake succeeds
- [ ] API key stored securely
- [ ] Streaming responses displayed in real-time
- [ ] Tool use works (file operations)
- [ ] Conversation history maintained
- [ ] Graceful offline fallback to local LLM
- [ ] Ctrl+C interrupts current request
- [ ] Error messages are clear

## Dependencies

- Networking (TCP/IP + TLS)
- Filesystem (for tools)
- Console I/O (done)
- Local LLM (done)
- JSON parser

## Files to Create

```
ai/claude/
├── api.c           # API client
├── api.h           # API interface
├── tools.c         # Tool implementations
├── tools.h         # Tool definitions
├── streaming.c     # SSE parser
├── json.c          # JSON parser
└── prompt.c        # System prompt builder

kernel/src/
├── shell.c         # Command execution for bash tool
```
