/*
 * AlphaOS - AI Inference Engine
 *
 * Local LLM inference for AI-native operating system
 */

#ifndef _AI_H
#define _AI_H

#include "types.h"

/* AI model configuration */
typedef struct {
    u32 dim;           /* Transformer dimension */
    u32 hidden_dim;    /* FFN hidden dimension */
    u32 n_layers;      /* Number of layers */
    u32 n_heads;       /* Number of attention heads */
    u32 n_kv_heads;    /* Number of KV heads (for GQA) */
    u32 vocab_size;    /* Vocabulary size */
    u32 seq_len;       /* Maximum sequence length */
} AiConfig;

/* AI model state */
typedef struct {
    AiConfig config;
    float* weights;       /* Model weights */
    float* token_emb;     /* Token embeddings */
    usize weights_size;   /* Size of weights in bytes */
    bool loaded;
} AiModel;

/* Inference state */
typedef struct {
    float* x;             /* Current activation */
    float* xb;            /* Activation buffer */
    float* xb2;           /* Another buffer */
    float* hb;            /* FFN hidden buffer */
    float* hb2;           /* FFN hidden buffer 2 */
    float* q;             /* Query */
    float* k;             /* Key */
    float* v;             /* Value */
    float* att;           /* Attention scores */
    float* logits;        /* Output logits */
    float* key_cache;     /* KV cache */
    float* value_cache;
    u32* tokens;          /* Token buffer */
    u32 n_tokens;         /* Number of tokens */
    u32 pos;              /* Current position */
} AiState;

/* AI response callback for streaming */
typedef void (*AiResponseCallback)(const char* token, void* user_data);

/* Initialize AI subsystem with model and tokenizer data from bootloader */
int ai_init(void* model_data, usize model_size,
            void* tokenizer_data, usize tokenizer_size);

/* Shutdown AI subsystem */
void ai_shutdown(void);

/* Check if AI is ready */
bool ai_ready(void);

/* Generate response from prompt */
int ai_generate(const char* prompt, char* response, usize max_len);

/* Generate with streaming callback */
int ai_generate_stream(const char* prompt, AiResponseCallback callback, void* user_data);

/* Get AI status string */
const char* ai_status(void);

/* Get model info */
const char* ai_model_info(void);

#endif /* _AI_H */
