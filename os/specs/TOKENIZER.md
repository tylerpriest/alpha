# Tokenizer Specification

> **Topic:** The tokenizer converts between text and token IDs for the language model.

## Job To Be Done

Enable bidirectional conversion between human-readable text and integer token sequences that the transformer can process.

## Requirements

### Vocabulary Format (llama2.c tokenizer.bin)

Binary format:
```
Offset 0:     max_token_length (int32)
Offset 4:     For each token i in [0, vocab_size):
              - score (float32) - BPE merge priority
              - len (int32) - string length
              - string (len bytes) - token text
```

### Encoding (Text → Tokens)

1. **Byte-fallback encoding**: Unknown bytes map to tokens 3-258 (byte + 3)
2. **BPE merge loop**:
   - Find adjacent token pair with highest combined score
   - If pair exists in vocabulary, merge into single token
   - Repeat until no more merges possible
3. **Special tokens**:
   - Token 1: `<s>` (BOS - beginning of sequence)
   - Token 2: `</s>` (EOS - end of sequence)

### Decoding (Tokens → Text)

1. Look up token string from vocabulary
2. Handle special bytes (tokens 3-258)
3. Handle leading space tokens (tokens starting with `▁` or space)
4. Previous token context for proper spacing

### Edge Cases

- Empty input → empty output
- Unknown characters → byte fallback tokens
- UTF-8 multibyte sequences preserved correctly
- Whitespace normalization (leading space tokens)

## Acceptance Criteria

- [ ] `encode("hello")` returns correct token sequence
- [ ] `decode(encode(text))` ≈ text (modulo whitespace normalization)
- [ ] Byte fallback works for any input byte
- [ ] Special tokens (BOS/EOS) handled correctly
- [ ] Vocabulary loads from tokenizer.bin format
