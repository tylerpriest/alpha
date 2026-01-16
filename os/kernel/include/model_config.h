/*
 * AlphaOS - Model Configuration
 *
 * Configuration for embedded models.
 * Real model weights require storage driver (future).
 */

#ifndef MODEL_CONFIG_H
#define MODEL_CONFIG_H

#include "llm.h"

/*
 * Tiny demonstration model configuration.
 * This is a minimal config to test the inference pipeline.
 * Real models (15M+) require loading from storage.
 *
 * Model size estimates:
 *   stories15M:  ~30MB weights, good for basic stories
 *   stories110M: ~220MB weights, better quality
 *   tinyllama1B: ~600MB quantized, general purpose
 */

/* Micro demo model - fits in ~64KB */
#define DEMO_MODEL_DIM        64
#define DEMO_MODEL_HIDDEN     128
#define DEMO_MODEL_LAYERS     2
#define DEMO_MODEL_HEADS      4
#define DEMO_MODEL_KV_HEADS   4
#define DEMO_MODEL_VOCAB      256   /* Byte-level for simplicity */
#define DEMO_MODEL_SEQ_LEN    64

/* Actual TinyStories 15M config (for when we have storage) */
#define STORIES15M_DIM        288
#define STORIES15M_HIDDEN     768
#define STORIES15M_LAYERS     6
#define STORIES15M_HEADS      6
#define STORIES15M_KV_HEADS   6
#define STORIES15M_VOCAB      32000
#define STORIES15M_SEQ_LEN    256

/* TinyLlama 1.1B config (requires ~600MB with Q4) */
#define TINYLLAMA_DIM         2048
#define TINYLLAMA_HIDDEN      5632
#define TINYLLAMA_LAYERS      22
#define TINYLLAMA_HEADS       32
#define TINYLLAMA_KV_HEADS    4     /* GQA */
#define TINYLLAMA_VOCAB       32000
#define TINYLLAMA_SEQ_LEN     2048

/* Get default demo config */
static inline void model_get_demo_config(LlmConfig* cfg) {
    cfg->dim = DEMO_MODEL_DIM;
    cfg->hidden_dim = DEMO_MODEL_HIDDEN;
    cfg->n_layers = DEMO_MODEL_LAYERS;
    cfg->n_heads = DEMO_MODEL_HEADS;
    cfg->n_kv_heads = DEMO_MODEL_KV_HEADS;
    cfg->vocab_size = DEMO_MODEL_VOCAB;
    cfg->seq_len = DEMO_MODEL_SEQ_LEN;
}

/* Calculate weight size for a config */
static inline usize model_weight_size(const LlmConfig* cfg) {
    int kv_dim = (cfg->dim * cfg->n_kv_heads) / cfg->n_heads;
    usize size = 0;

    /* Embeddings */
    size += cfg->vocab_size * cfg->dim;

    /* Per-layer weights */
    size += cfg->n_layers * cfg->dim;  /* rms_att */
    size += cfg->n_layers * cfg->dim * cfg->dim;  /* wq */
    size += cfg->n_layers * cfg->dim * kv_dim;    /* wk */
    size += cfg->n_layers * cfg->dim * kv_dim;    /* wv */
    size += cfg->n_layers * cfg->dim * cfg->dim;  /* wo */
    size += cfg->n_layers * cfg->dim;  /* rms_ffn */
    size += cfg->n_layers * cfg->dim * cfg->hidden_dim;  /* w1 */
    size += cfg->n_layers * cfg->hidden_dim * cfg->dim;  /* w2 */
    size += cfg->n_layers * cfg->dim * cfg->hidden_dim;  /* w3 */

    /* Final norm */
    size += cfg->dim;

    return size * sizeof(float);
}

#endif /* MODEL_CONFIG_H */
