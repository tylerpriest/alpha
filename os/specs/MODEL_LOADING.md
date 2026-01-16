# Model Loading Specification

> **Topic:** The model loader retrieves neural network weights from the boot media into memory.

## Job To Be Done

Load pre-trained model weights from the USB boot device so the LLM can perform inference without requiring a filesystem driver.

## Requirements

### Bootloader Module Loading (Limine)

1. **Module Request**: Kernel declares `limine_module_request` in `.requests` section
2. **Module Path**: `boot():/boot/model.bin` specified in limine.conf
3. **Memory Mapping**: Limine loads file into RAM, provides address and size
4. **Response**: Kernel receives `limine_file*` with:
   - `address`: Pointer to file data in memory
   - `size`: File size in bytes
   - `path`: Original file path

### Model Validation

1. **Minimum size**: At least 32 bytes (header)
2. **Config sanity checks**:
   - `0 < dim <= 8192`
   - `0 < n_layers <= 64`
   - `0 < vocab_size <= 128000`
   - `0 < seq_len <= 32768`
3. **Weight size verification**: Calculated size should match `file_size - 28`

### Tokenizer Loading (Future)

1. **Separate file**: `boot():/boot/tokenizer.bin`
2. **Fallback**: Byte-level tokenization if no tokenizer file

### Error Handling

- No module loaded → Demo mode (graceful degradation)
- Invalid config → Log error, fall back to demo mode
- Insufficient memory → Log error, fall back to demo mode

## Acceptance Criteria

- [ ] Model loads from USB via Limine module protocol
- [ ] Config header parsed correctly for TinyStories 15M
- [ ] Weights pointer correctly offset past header
- [ ] Invalid models rejected with clear error message
- [ ] Demo mode activates when no model present
