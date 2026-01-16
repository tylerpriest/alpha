# LLM Integration Plan for AlphaOS

## Overview

Two paths to real LLM capability in a bare-metal OS:

### Option A: Local Inference (llama2.c port)
**Status: Implementing Now**

Port Andrej Karpathy's llama2.c - single-file C transformer inference.

**Pros:**
- Works offline, privacy-first
- No network stack required
- ~700 lines of core inference code

**Cons:**
- Need storage driver for larger models
- Limited by RAM (~8GB on MacBook Pro A1706)
- Inference is slower than cloud

**Requirements:**
- FPU/SSE support ✓ (done)
- Heap allocator ✓ (done)
- Math functions (exp, sqrt, sin, cos) - need to implement
- Tokenizer (BPE) - need to implement
- Model weights - embed tiny model or load from storage

### Option B: Cloud LLM via CLIProxyAPI
**Status: Future (requires network stack)**

Use CLIProxyAPI proxy to access Claude/GPT/Gemini.

**Pros:**
- Access to powerful models (Claude, GPT-4, etc.)
- No local storage needed for weights
- Latest model capabilities

**Cons:**
- Requires full network stack
- Internet connectivity required
- Latency dependent on network

**Requirements:**
- Network driver (Intel I219-LM on MacBook Pro)
- TCP/IP stack
- DHCP client
- DNS resolver
- TLS/HTTPS
- HTTP client

## Implementation Plan

### Phase 1: Minimal Local LLM (Current)

1. **Math Library** (`math.h`/`math.c`)
   - expf(), logf(), sqrtf(), powf()
   - sinf(), cosf() (for RoPE)
   - Software implementations using Taylor series

2. **Transformer Engine** (`llm.h`/`llm.c`)
   - Config, Weights, RunState structures
   - Matrix multiplication (matmul)
   - RMSNorm normalization
   - RoPE positional encoding
   - Multi-head attention
   - SwiGLU feed-forward
   - Forward pass

3. **Tokenizer** (`tokenizer.h`/`tokenizer.c`)
   - BPE (Byte-Pair Encoding)
   - Vocabulary embedding
   - Encode/decode functions

4. **Tiny Model**
   - Embed tinyllamas 15M (~30MB) in binary
   - Or use even smaller custom-trained model
   - Sufficient for basic conversation

### Phase 2: Storage Support (Future)

1. **NVMe Driver**
   - PCIe NVMe controller
   - Read/write blocks

2. **Filesystem**
   - Simple FAT32 or custom format
   - Load model files

3. **Larger Models**
   - TinyLlama 1.1B (~600MB quantized)
   - Llama 3.2 1B (~700MB quantized)

### Phase 3: Network + Cloud (Future)

1. **Network Stack**
   - Intel I219-LM driver
   - IP/TCP/UDP
   - DHCP, DNS
   - TLS 1.3

2. **HTTP Client**
   - REST API calls
   - JSON parsing

3. **CLIProxyAPI Integration**
   - Route complex queries to cloud
   - Keep simple queries local
   - Hybrid intelligence

## Model Size vs Capability

| Model | Params | Size (Q4) | RAM Needed | Capability |
|-------|--------|-----------|------------|------------|
| stories15M | 15M | ~8MB | 16MB | Basic chat |
| stories110M | 110M | ~60MB | 120MB | Better chat |
| TinyLlama 1.1B | 1.1B | ~600MB | 1.2GB | Good chat |
| Llama 3.2 1B | 1B | ~700MB | 1.4GB | Very good |
| Llama 3.2 3B | 3B | ~2GB | 4GB | Excellent |

For MacBook Pro A1706 with 8-16GB RAM, we can run up to 3B models locally.

## Architecture

```
┌─────────────────────────────────────────────┐
│                 AI Layer                     │
│  ┌─────────────┐     ┌─────────────────┐    │
│  │ Local LLM   │     │  Cloud Router   │    │
│  │ (llama2.c)  │     │ (CLIProxyAPI)   │    │
│  └──────┬──────┘     └────────┬────────┘    │
│         │                     │              │
│         ▼                     ▼              │
│  ┌─────────────┐     ┌─────────────────┐    │
│  │  Tokenizer  │     │   HTTP Client   │    │
│  │    (BPE)    │     │   (TLS/JSON)    │    │
│  └──────┬──────┘     └────────┬────────┘    │
│         │                     │              │
│         ▼                     ▼              │
│  ┌─────────────┐     ┌─────────────────┐    │
│  │Model Weights│     │  Network Stack  │    │
│  │ (embedded)  │     │  (TCP/IP/ETH)   │    │
│  └─────────────┘     └─────────────────┘    │
└─────────────────────────────────────────────┘
```

## Sources

- [llama2.c by Karpathy](https://github.com/karpathy/llama2.c)
- [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)
- [tinyllamas models](https://huggingface.co/karpathy/tinyllamas)
