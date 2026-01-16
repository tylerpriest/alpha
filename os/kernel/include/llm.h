/*
 * AlphaOS - LLM Inference Engine
 *
 * Minimal transformer inference based on llama2.c by Andrej Karpathy.
 * Designed for running small language models on bare metal.
 */

#ifndef LLM_H
#define LLM_H

#include "types.h"

/* Model configuration */
typedef struct {
    int dim;           /* Transformer dimension */
    int hidden_dim;    /* FFN hidden dimension */
    int n_layers;      /* Number of transformer layers */
    int n_heads;       /* Number of attention heads */
    int n_kv_heads;    /* Number of key/value heads (can be < n_heads for GQA) */
    int vocab_size;    /* Vocabulary size */
    int seq_len;       /* Maximum sequence length */
} LlmConfig;

/* Transformer weights */
typedef struct {
    /* Token embeddings [vocab_size, dim] */
    float* token_embedding;

    /* Attention weights for each layer */
    float* wq;         /* Query weights [n_layers, dim, dim] */
    float* wk;         /* Key weights [n_layers, dim, kv_dim] */
    float* wv;         /* Value weights [n_layers, dim, kv_dim] */
    float* wo;         /* Output weights [n_layers, dim, dim] */

    /* FFN weights for each layer */
    float* w1;         /* FFN gate [n_layers, hidden_dim, dim] */
    float* w2;         /* FFN down [n_layers, dim, hidden_dim] */
    float* w3;         /* FFN up [n_layers, hidden_dim, dim] */

    /* RMSNorm weights */
    float* rms_att_weight;  /* [n_layers, dim] */
    float* rms_ffn_weight;  /* [n_layers, dim] */
    float* rms_final_weight; /* [dim] */

    /* Output classifier (may share with token_embedding) */
    float* wcls;
} LlmWeights;

/* Runtime state for inference */
typedef struct {
    /* Activations */
    float* x;          /* Current activation [dim] */
    float* xb;         /* Activation buffer [dim] */
    float* xb2;        /* Another buffer [dim] */
    float* hb;         /* FFN hidden buffer [hidden_dim] */
    float* hb2;        /* Another FFN buffer [hidden_dim] */

    /* Attention buffers */
    float* q;          /* Query [dim] */
    float* k;          /* Key [kv_dim] */
    float* v;          /* Value [kv_dim] */
    float* att;        /* Attention scores [n_heads, seq_len] */

    /* KV cache */
    float* key_cache;   /* [n_layers, seq_len, kv_dim] */
    float* value_cache; /* [n_layers, seq_len, kv_dim] */

    /* Output */
    float* logits;     /* Output logits [vocab_size] */
} LlmRunState;

/* Complete transformer */
typedef struct {
    LlmConfig config;
    LlmWeights weights;
    LlmRunState state;
    bool initialized;
} LlmTransformer;

/* Tokenizer */
typedef struct {
    char** vocab;           /* Vocabulary strings */
    float* vocab_scores;    /* BPE merge scores */
    int vocab_size;
    int max_token_length;
    u8* byte_pieces;        /* For byte fallback */
} LlmTokenizer;

/* Sampler configuration */
typedef struct {
    float temperature;      /* Sampling temperature (0 = greedy) */
    float topp;             /* Top-p (nucleus) sampling threshold */
    u64 rng_state;          /* Random state for sampling */
} LlmSampler;

/* ============ Core Functions ============ */

/* Initialize transformer with config and weights pointer */
int llm_init(LlmTransformer* t, const LlmConfig* config, const float* weights_data);

/* Free transformer memory */
void llm_free(LlmTransformer* t);

/* Forward pass for single token at position */
float* llm_forward(LlmTransformer* t, int token, int pos);

/* Generate text from prompt tokens */
int llm_generate(LlmTransformer* t, LlmTokenizer* tok, LlmSampler* sampler,
                 const char* prompt, char* output, int max_output_len);

/* ============ Tokenizer Functions ============ */

/* Initialize tokenizer with vocabulary */
int llm_tokenizer_init(LlmTokenizer* tok, const char* vocab_data, int vocab_size);

/* Initialize tokenizer from binary file data (llama2.c tokenizer.bin format) */
int llm_tokenizer_init_binary(LlmTokenizer* tok, void* data, usize size, int vocab_size);

/* Encode text to tokens */
int llm_encode(LlmTokenizer* tok, const char* text, int* tokens, int max_tokens);

/* Decode tokens to text */
int llm_decode(LlmTokenizer* tok, int token, char* output, int prev_token);

/* Free tokenizer */
void llm_tokenizer_free(LlmTokenizer* tok);

/* ============ Sampler Functions ============ */

/* Initialize sampler */
void llm_sampler_init(LlmSampler* sampler, float temperature, float topp, u64 seed);

/* Sample next token from logits */
int llm_sample(LlmSampler* sampler, float* logits, int vocab_size);

/* ============ Utility ============ */

/* Get memory requirements for a config */
usize llm_memory_required(const LlmConfig* config);

/* Check if model is loaded */
bool llm_ready(LlmTransformer* t);

#endif /* LLM_H */
