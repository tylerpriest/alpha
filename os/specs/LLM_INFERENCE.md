# LLM Inference Specification

> **Topic:** The LLM inference engine executes transformer forward passes to generate text.

## Job To Be Done

Enable the operating system to generate coherent text responses by running neural network inference locally on the CPU.

## Requirements

### Transformer Architecture (llama2.c compatible)

1. **RMSNorm** - Root Mean Square Layer Normalization
   - Input: activation vector, weight vector, size
   - Output: normalized activation
   - Formula: `o[i] = weight[i] * (x[i] / sqrt(mean(x^2) + epsilon))`

2. **Multi-Head Attention**
   - Query, Key, Value projections via matmul
   - RoPE positional encoding applied to Q and K
   - Scaled dot-product attention: `softmax(Q @ K.T / sqrt(d_k)) @ V`
   - KV-cache for efficient autoregressive generation
   - Support for Grouped Query Attention (GQA) where `n_kv_heads < n_heads`

3. **Feed-Forward Network (SwiGLU)**
   - Gate projection: `w1 @ x`
   - Up projection: `w3 @ x`
   - SiLU activation: `gate * sigmoid(gate)`
   - Down projection: `w2 @ (silu(gate) * up)`

4. **Residual Connections**
   - `x = x + attention_output`
   - `x = x + ffn_output`

### Model Format

Binary format (llama2.c compatible):
```
Offset 0:   Config header (7 x int32 = 28 bytes)
            - dim, hidden_dim, n_layers, n_heads, n_kv_heads, vocab_size, seq_len
Offset 28:  Weights (float32 array)
            - token_embedding [vocab_size, dim]
            - rms_att_weight [n_layers, dim]
            - wq, wk, wv, wo [per layer]
            - rms_ffn_weight [n_layers, dim]
            - w1, w2, w3 [per layer]
            - rms_final_weight [dim]
            - (optional) wcls [vocab_size, dim]
```

### Sampling

1. **Temperature scaling**: `logits = logits / temperature`
2. **Softmax**: Convert logits to probabilities
3. **Top-p (nucleus) sampling**: Sample from smallest set where cumulative prob > p
4. **Greedy**: Return argmax when temperature = 0

### Performance Targets

- Token generation: < 500ms per token on 15M model
- Memory: < 200MB runtime for 15M model
- Support models up to 3B parameters (with sufficient RAM)

## Acceptance Criteria

- [ ] Forward pass produces valid logits for any input token
- [ ] KV-cache correctly stores/retrieves cached states
- [ ] RoPE encoding matches reference implementation
- [ ] Generated text is coherent for loaded model
- [ ] Memory allocation succeeds for target model sizes
