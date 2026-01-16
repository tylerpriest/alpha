# Networking Specification

> **Topic:** Network stack for Claude Code API connectivity

## Job To Be Done

Enable network connectivity so AlphaOS can communicate with Claude Code API (api.anthropic.com) for full AI capabilities beyond local LLM.

## Requirements

### Layer 1-2: Physical/Link
1. **USB Ethernet adapter** (CDC-ECM/NCM class) - Simplest path
2. **WiFi BCM43xx** (optional, complex) - Native MacBook WiFi

### Layer 3: Network (IP)
1. **IPv4 support** (IPv6 optional)
2. **DHCP client** for automatic configuration
3. **Static IP fallback**
4. **ARP for address resolution**

### Layer 4: Transport (TCP)
1. **TCP client** implementation
   - Three-way handshake
   - Sliding window
   - Retransmission
   - Connection teardown
2. **UDP** (optional, for DNS)

### Layer 5-7: Application
1. **DNS resolver** (UDP port 53)
2. **TLS 1.3 client** for HTTPS
3. **HTTP/1.1 client** (HTTP/2 optional)

## Architecture

```
┌─────────────────────────────────────────┐
│           Claude Code Client            │
├─────────────────────────────────────────┤
│              HTTPS Client               │
├─────────────────────────────────────────┤
│         TLS 1.3 (BearSSL/mbedTLS)       │
├─────────────────────────────────────────┤
│              TCP/IP Stack               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │   TCP   │  │   UDP   │  │  ICMP   │ │
│  └────┬────┘  └────┬────┘  └────┬────┘ │
│       └────────────┼────────────┘      │
│              ┌─────┴─────┐             │
│              │    IPv4   │             │
│              └─────┬─────┘             │
│              ┌─────┴─────┐             │
│              │    ARP    │             │
│              └─────┬─────┘             │
├────────────────────┼────────────────────┤
│              ┌─────┴─────┐             │
│              │  Ethernet │             │
│              └─────┬─────┘             │
├────────────────────┼────────────────────┤
│    USB CDC-ECM     │    BCM43xx WiFi   │
│    (Simple)        │    (Complex)       │
└────────────────────┴────────────────────┘
```

## USB Ethernet (Recommended First)

### CDC-ECM Class Driver
```c
// USB CDC-ECM is standardized
// Many USB-Ethernet adapters use it
// Much simpler than WiFi

typedef struct {
    u8 mac_address[6];
    u16 mtu;
    bool link_up;

    // USB endpoints
    u8 bulk_in;
    u8 bulk_out;
    u8 interrupt_in;
} CdcEcmDevice;

int cdcecm_init(UsbDevice* dev);
int cdcecm_send(CdcEcmDevice* eth, void* data, usize len);
int cdcecm_recv(CdcEcmDevice* eth, void* buf, usize max);
```

## TCP/IP Stack (Minimal)

### IP Header
```c
typedef struct {
    u8  version_ihl;
    u8  tos;
    u16 total_length;
    u16 identification;
    u16 flags_fragment;
    u8  ttl;
    u8  protocol;
    u16 checksum;
    u32 src_addr;
    u32 dst_addr;
} __attribute__((packed)) IpHeader;
```

### TCP Implementation Phases
1. **Phase 1:** TCP connect (client only)
2. **Phase 2:** TCP send/recv with ACK
3. **Phase 3:** Retransmission on timeout
4. **Phase 4:** Window management

## TLS 1.3 (Required for Claude API)

### Options
1. **BearSSL** - Small, portable (~400KB)
2. **mbedTLS** - More features (~600KB)
3. **WolfSSL** - Commercial-friendly

### Required Cipher Suites
- TLS_AES_128_GCM_SHA256
- TLS_AES_256_GCM_SHA384
- TLS_CHACHA20_POLY1305_SHA256

## Claude API Client

### API Format
```http
POST /v1/messages HTTP/1.1
Host: api.anthropic.com
Content-Type: application/json
x-api-key: sk-ant-...
anthropic-version: 2023-06-01

{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

### Response Handling
- Streaming SSE for real-time output
- JSON parsing for tool calls
- Error handling for rate limits

## Acceptance Criteria

- [ ] USB Ethernet adapter detected and initialized
- [ ] DHCP obtains IP address automatically
- [ ] Can ping gateway (ICMP echo)
- [ ] TCP connection to api.anthropic.com:443
- [ ] TLS 1.3 handshake succeeds
- [ ] Claude API responds to message

## Dependencies

- xHCI USB driver (partial)
- Heap allocator (done)
- Timer for TCP timeouts (needs IDT)

## Files to Create

- `drivers/network/eth.c` - Ethernet abstraction
- `drivers/network/cdcecm.c` - USB Ethernet driver
- `drivers/network/ip.c` - IPv4 implementation
- `drivers/network/tcp.c` - TCP client
- `drivers/network/dhcp.c` - DHCP client
- `drivers/network/dns.c` - DNS resolver
- `drivers/network/tls.c` - TLS wrapper
- `ai/claude/api.c` - Claude API client
