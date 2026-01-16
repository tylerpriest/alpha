/*
 * AlphaOS - LLM Inference Engine
 *
 * Transformer inference based on llama2.c by Andrej Karpathy.
 * https://github.com/karpathy/llama2.c
 */

#include "llm.h"
#include "math.h"
#include "heap.h"
#include "string.h"

/* ============ Helper Functions ============ */

static void* llm_malloc(usize size) {
    return kmalloc(size);
}

/* ============ Core Math Operations ============ */

/* RMS Normalization */
static void rmsnorm(float* o, float* x, float* weight, int size) {
    /* Calculate sum of squares */
    float ss = 0.0f;
    for (int i = 0; i < size; i++) {
        ss += x[i] * x[i];
    }
    ss /= (float)size;
    ss += 1e-5f;  /* Epsilon for stability */
    ss = 1.0f / sqrtf(ss);

    /* Normalize and scale */
    for (int i = 0; i < size; i++) {
        o[i] = weight[i] * (ss * x[i]);
    }
}

/* Softmax in-place */
static void softmax(float* x, int size) {
    /* Find max for numerical stability */
    float max_val = x[0];
    for (int i = 1; i < size; i++) {
        if (x[i] > max_val) max_val = x[i];
    }

    /* Exp and sum */
    float sum = 0.0f;
    for (int i = 0; i < size; i++) {
        x[i] = expf(x[i] - max_val);
        sum += x[i];
    }

    /* Normalize */
    for (int i = 0; i < size; i++) {
        x[i] /= sum;
    }
}

/* Matrix-vector multiplication: y = W @ x */
static void matmul(float* y, float* x, float* W, int rows, int cols) {
    /* W is [rows, cols], x is [cols], y is [rows] */
    for (int i = 0; i < rows; i++) {
        float sum = 0.0f;
        for (int j = 0; j < cols; j++) {
            sum += W[i * cols + j] * x[j];
        }
        y[i] = sum;
    }
}

/* ============ Transformer Forward Pass ============ */

float* llm_forward(LlmTransformer* t, int token, int pos) {
    LlmConfig* cfg = &t->config;
    LlmWeights* w = &t->weights;
    LlmRunState* s = &t->state;

    int dim = cfg->dim;
    int kv_dim = (cfg->dim * cfg->n_kv_heads) / cfg->n_heads;
    int kv_mul = cfg->n_heads / cfg->n_kv_heads;  /* GQA multiplier */
    int hidden_dim = cfg->hidden_dim;
    int head_size = dim / cfg->n_heads;

    /* Copy token embedding to activation */
    float* content_row = w->token_embedding + token * dim;
    memcpy(s->x, content_row, dim * sizeof(float));

    /* Process each transformer layer */
    for (int l = 0; l < cfg->n_layers; l++) {

        /* Attention RMSNorm */
        rmsnorm(s->xb, s->x, w->rms_att_weight + l * dim, dim);

        /* Compute Q, K, V */
        int loff = l * cfg->seq_len * kv_dim;  /* KV cache layer offset */
        matmul(s->q, s->xb, w->wq + l * dim * dim, dim, dim);
        matmul(s->k, s->xb, w->wk + l * dim * kv_dim, kv_dim, dim);
        matmul(s->v, s->xb, w->wv + l * dim * kv_dim, kv_dim, dim);

        /* Apply RoPE positional encoding to Q and K */
        for (int i = 0; i < dim; i += 2) {
            int head_dim = i % head_size;
            float freq = 1.0f / powf(10000.0f, (float)head_dim / (float)head_size);
            float val = (float)pos * freq;
            float fcr = cosf(val);
            float fci = sinf(val);

            /* Rotate Q */
            float q0 = s->q[i];
            float q1 = s->q[i + 1];
            s->q[i] = q0 * fcr - q1 * fci;
            s->q[i + 1] = q0 * fci + q1 * fcr;

            /* Rotate K (only for kv_dim) */
            if (i < kv_dim) {
                float k0 = s->k[i];
                float k1 = s->k[i + 1];
                s->k[i] = k0 * fcr - k1 * fci;
                s->k[i + 1] = k0 * fci + k1 * fcr;
            }
        }

        /* Cache K and V for this position */
        memcpy(s->key_cache + loff + pos * kv_dim, s->k, kv_dim * sizeof(float));
        memcpy(s->value_cache + loff + pos * kv_dim, s->v, kv_dim * sizeof(float));

        /* Multi-head attention */
        memset(s->xb, 0, dim * sizeof(float));

        for (int h = 0; h < cfg->n_heads; h++) {
            float* q_head = s->q + h * head_size;
            float* att = s->att + h * cfg->seq_len;
            int kv_head = h / kv_mul;  /* GQA: which KV head to use */

            /* Compute attention scores for all cached positions */
            for (int t_pos = 0; t_pos <= pos; t_pos++) {
                float* k_cached = s->key_cache + loff + t_pos * kv_dim + kv_head * head_size;
                float score = 0.0f;
                for (int i = 0; i < head_size; i++) {
                    score += q_head[i] * k_cached[i];
                }
                score /= sqrtf((float)head_size);
                att[t_pos] = score;
            }

            /* Softmax attention scores */
            softmax(att, pos + 1);

            /* Weighted sum of values */
            float* xb_head = s->xb + h * head_size;
            for (int t_pos = 0; t_pos <= pos; t_pos++) {
                float* v_cached = s->value_cache + loff + t_pos * kv_dim + kv_head * head_size;
                float a = att[t_pos];
                for (int i = 0; i < head_size; i++) {
                    xb_head[i] += a * v_cached[i];
                }
            }
        }

        /* Attention output projection */
        matmul(s->xb2, s->xb, w->wo + l * dim * dim, dim, dim);

        /* Residual connection */
        for (int i = 0; i < dim; i++) {
            s->x[i] += s->xb2[i];
        }

        /* FFN RMSNorm */
        rmsnorm(s->xb, s->x, w->rms_ffn_weight + l * dim, dim);

        /* FFN: SwiGLU activation */
        /* w1 and w3 compute gate and up projections */
        matmul(s->hb, s->xb, w->w1 + l * dim * hidden_dim, hidden_dim, dim);
        matmul(s->hb2, s->xb, w->w3 + l * dim * hidden_dim, hidden_dim, dim);

        /* SiLU activation on gate, element-wise multiply with up */
        for (int i = 0; i < hidden_dim; i++) {
            float gate = s->hb[i];
            /* SiLU(x) = x * sigmoid(x) */
            gate = gate * (1.0f / (1.0f + expf(-gate)));
            s->hb[i] = gate * s->hb2[i];
        }

        /* Down projection */
        matmul(s->xb, s->hb, w->w2 + l * dim * hidden_dim, dim, hidden_dim);

        /* Residual connection */
        for (int i = 0; i < dim; i++) {
            s->x[i] += s->xb[i];
        }
    }

    /* Final RMSNorm */
    rmsnorm(s->x, s->x, w->rms_final_weight, dim);

    /* Classifier: project to vocabulary */
    matmul(s->logits, s->x, w->wcls, cfg->vocab_size, dim);

    return s->logits;
}

/* ============ Initialization ============ */

usize llm_memory_required(const LlmConfig* cfg) {
    int kv_dim = (cfg->dim * cfg->n_kv_heads) / cfg->n_heads;

    usize size = 0;

    /* Activation buffers */
    size += cfg->dim * sizeof(float);              /* x */
    size += cfg->dim * sizeof(float);              /* xb */
    size += cfg->dim * sizeof(float);              /* xb2 */
    size += cfg->hidden_dim * sizeof(float);       /* hb */
    size += cfg->hidden_dim * sizeof(float);       /* hb2 */
    size += cfg->dim * sizeof(float);              /* q */
    size += kv_dim * sizeof(float);                /* k */
    size += kv_dim * sizeof(float);                /* v */
    size += cfg->n_heads * cfg->seq_len * sizeof(float);  /* att */
    size += cfg->vocab_size * sizeof(float);       /* logits */

    /* KV cache */
    size += cfg->n_layers * cfg->seq_len * kv_dim * sizeof(float);  /* key_cache */
    size += cfg->n_layers * cfg->seq_len * kv_dim * sizeof(float);  /* value_cache */

    return size;
}

int llm_init(LlmTransformer* t, const LlmConfig* config, const float* weights_data) {
    memcpy(&t->config, config, sizeof(LlmConfig));
    LlmConfig* cfg = &t->config;

    int kv_dim = (cfg->dim * cfg->n_kv_heads) / cfg->n_heads;

    /* Allocate run state */
    LlmRunState* s = &t->state;
    s->x = llm_malloc(cfg->dim * sizeof(float));
    s->xb = llm_malloc(cfg->dim * sizeof(float));
    s->xb2 = llm_malloc(cfg->dim * sizeof(float));
    s->hb = llm_malloc(cfg->hidden_dim * sizeof(float));
    s->hb2 = llm_malloc(cfg->hidden_dim * sizeof(float));
    s->q = llm_malloc(cfg->dim * sizeof(float));
    s->k = llm_malloc(kv_dim * sizeof(float));
    s->v = llm_malloc(kv_dim * sizeof(float));
    s->att = llm_malloc(cfg->n_heads * cfg->seq_len * sizeof(float));
    s->logits = llm_malloc(cfg->vocab_size * sizeof(float));
    s->key_cache = llm_malloc(cfg->n_layers * cfg->seq_len * kv_dim * sizeof(float));
    s->value_cache = llm_malloc(cfg->n_layers * cfg->seq_len * kv_dim * sizeof(float));

    if (!s->x || !s->xb || !s->xb2 || !s->hb || !s->hb2 ||
        !s->q || !s->k || !s->v || !s->att || !s->logits ||
        !s->key_cache || !s->value_cache) {
        return -1;  /* Allocation failed */
    }

    /* Map weights (assuming packed format like llama2.c) */
    LlmWeights* w = &t->weights;
    float* ptr = (float*)weights_data;

    w->token_embedding = ptr;
    ptr += cfg->vocab_size * cfg->dim;

    w->rms_att_weight = ptr;
    ptr += cfg->n_layers * cfg->dim;

    w->wq = ptr;
    ptr += cfg->n_layers * cfg->dim * cfg->dim;

    w->wk = ptr;
    ptr += cfg->n_layers * cfg->dim * kv_dim;

    w->wv = ptr;
    ptr += cfg->n_layers * cfg->dim * kv_dim;

    w->wo = ptr;
    ptr += cfg->n_layers * cfg->dim * cfg->dim;

    w->rms_ffn_weight = ptr;
    ptr += cfg->n_layers * cfg->dim;

    w->w1 = ptr;
    ptr += cfg->n_layers * cfg->dim * cfg->hidden_dim;

    w->w2 = ptr;
    ptr += cfg->n_layers * cfg->hidden_dim * cfg->dim;

    w->w3 = ptr;
    ptr += cfg->n_layers * cfg->dim * cfg->hidden_dim;

    w->rms_final_weight = ptr;
    ptr += cfg->dim;

    /* Classifier weights (may share with embeddings for tied weights) */
    w->wcls = w->token_embedding;  /* Weight tying by default */

    t->initialized = true;
    return 0;
}

void llm_free(LlmTransformer* t) {
    /* Note: Our simple heap doesn't support individual frees yet */
    t->initialized = false;
}

bool llm_ready(LlmTransformer* t) {
    return t && t->initialized;
}

/* ============ Sampler ============ */

void llm_sampler_init(LlmSampler* sampler, float temperature, float topp, u64 seed) {
    sampler->temperature = temperature;
    sampler->topp = topp;
    sampler->rng_state = seed;
}

/* Simple PRNG (xorshift64) */
static u64 random_u64(u64* state) {
    u64 x = *state;
    x ^= x >> 12;
    x ^= x << 25;
    x ^= x >> 27;
    *state = x;
    return x * 0x2545F4914F6CDD1DULL;
}

static float random_f32(u64* state) {
    return (float)(random_u64(state) >> 40) / (float)(1ULL << 24);
}

/* Argmax for greedy sampling */
static int argmax(float* v, int n) {
    int max_i = 0;
    float max_v = v[0];
    for (int i = 1; i < n; i++) {
        if (v[i] > max_v) {
            max_v = v[i];
            max_i = i;
        }
    }
    return max_i;
}

int llm_sample(LlmSampler* sampler, float* logits, int vocab_size) {
    /* Greedy sampling if temperature is 0 */
    if (sampler->temperature == 0.0f) {
        return argmax(logits, vocab_size);
    }

    /* Apply temperature */
    for (int i = 0; i < vocab_size; i++) {
        logits[i] /= sampler->temperature;
    }

    /* Softmax */
    softmax(logits, vocab_size);

    /* Top-p (nucleus) sampling */
    float topp = sampler->topp;
    if (topp > 0.0f && topp < 1.0f) {
        /* Sort tokens by probability (simple bubble sort for small vocab) */
        /* For production, use a more efficient algorithm */
        float cumulative = 0.0f;
        int cutoff_idx = vocab_size;

        /* Find cutoff */
        for (int i = 0; i < vocab_size; i++) {
            cumulative += logits[i];
            if (cumulative > topp) {
                cutoff_idx = i + 1;
                break;
            }
        }

        /* Zero out tokens below cutoff */
        for (int i = cutoff_idx; i < vocab_size; i++) {
            logits[i] = 0.0f;
        }

        /* Renormalize */
        float sum = 0.0f;
        for (int i = 0; i < vocab_size; i++) {
            sum += logits[i];
        }
        for (int i = 0; i < vocab_size; i++) {
            logits[i] /= sum;
        }
    }

    /* Sample from distribution */
    float r = random_f32(&sampler->rng_state);
    float cdf = 0.0f;
    for (int i = 0; i < vocab_size; i++) {
        cdf += logits[i];
        if (r < cdf) {
            return i;
        }
    }

    return vocab_size - 1;  /* Fallback */
}

/* ============ Tokenizer ============ */

int llm_tokenizer_init(LlmTokenizer* tok, const char* vocab_data, int vocab_size) {
    tok->vocab_size = vocab_size;
    tok->vocab = llm_malloc(vocab_size * sizeof(char*));
    tok->vocab_scores = llm_malloc(vocab_size * sizeof(float));

    if (!tok->vocab || !tok->vocab_scores) {
        return -1;
    }

    /* Parse vocabulary (format: score\0string\0 repeated) */
    const char* ptr = vocab_data;
    tok->max_token_length = 0;

    for (int i = 0; i < vocab_size; i++) {
        /* Read score */
        memcpy(&tok->vocab_scores[i], ptr, sizeof(float));
        ptr += sizeof(float);

        /* Read string */
        int len = (int)strlen(ptr);
        tok->vocab[i] = llm_malloc(len + 1);
        memcpy(tok->vocab[i], ptr, len + 1);
        ptr += len + 1;

        if (len > tok->max_token_length) {
            tok->max_token_length = len;
        }
    }

    /* Byte pieces for fallback encoding */
    tok->byte_pieces = llm_malloc(512);  /* 256 single-byte strings */
    for (int i = 0; i < 256; i++) {
        tok->byte_pieces[i * 2] = (u8)i;
        tok->byte_pieces[i * 2 + 1] = '\0';
    }

    return 0;
}

/*
 * Initialize tokenizer from binary data (llama2.c tokenizer.bin format)
 *
 * Format:
 *   - Header: max_token_length (int32)
 *   - For each token: score (float32) + len (int32) + string (len bytes)
 */
int llm_tokenizer_init_binary(LlmTokenizer* tok, void* data, usize size, int vocab_size) {
    if (!tok || !data || size < 4 || vocab_size <= 0) {
        return -1;
    }

    u8* ptr = (u8*)data;
    u8* end = ptr + size;

    /* Read header: max_token_length */
    int max_token_length = *(int*)ptr;
    ptr += sizeof(int);

    tok->vocab_size = vocab_size;
    tok->max_token_length = max_token_length;

    /* Allocate vocabulary arrays */
    tok->vocab = llm_malloc(vocab_size * sizeof(char*));
    tok->vocab_scores = llm_malloc(vocab_size * sizeof(float));

    if (!tok->vocab || !tok->vocab_scores) {
        return -1;
    }

    /* Parse each token: score (float) + len (int) + string (len bytes) */
    for (int i = 0; i < vocab_size && ptr < end; i++) {
        /* Read score */
        float score;
        memcpy(&score, ptr, sizeof(float));
        tok->vocab_scores[i] = score;
        ptr += sizeof(float);

        /* Read string length */
        int len;
        memcpy(&len, ptr, sizeof(int));
        ptr += sizeof(int);

        /* Bounds check */
        if (len < 0 || len > max_token_length || ptr + len > end) {
            /* Invalid token, use empty string */
            tok->vocab[i] = llm_malloc(1);
            if (tok->vocab[i]) tok->vocab[i][0] = '\0';
            continue;
        }

        /* Allocate and copy string (add null terminator) */
        tok->vocab[i] = llm_malloc(len + 1);
        if (tok->vocab[i]) {
            memcpy(tok->vocab[i], ptr, len);
            tok->vocab[i][len] = '\0';
        }
        ptr += len;
    }

    /* Byte pieces for fallback encoding (tokens 3-258 represent raw bytes) */
    tok->byte_pieces = llm_malloc(512);  /* 256 single-byte strings */
    if (tok->byte_pieces) {
        for (int i = 0; i < 256; i++) {
            tok->byte_pieces[i * 2] = (u8)i;
            tok->byte_pieces[i * 2 + 1] = '\0';
        }
    }

    return 0;
}

/* Simple string comparison */
static int str_cmp(const char* a, const char* b) {
    while (*a && *a == *b) { a++; b++; }
    return (int)(u8)*a - (int)(u8)*b;
}

/* Find token in vocabulary */
static int find_token(LlmTokenizer* tok, const char* str) {
    for (int i = 0; i < tok->vocab_size; i++) {
        if (str_cmp(tok->vocab[i], str) == 0) {
            return i;
        }
    }
    return -1;
}

int llm_encode(LlmTokenizer* tok, const char* text, int* tokens, int max_tokens) {
    if (!text || !tokens || max_tokens <= 0) return 0;

    int n_tokens = 0;

    /* First, encode each byte as a token */
    while (*text && n_tokens < max_tokens) {
        /* Try to find longest matching token (greedy) */
        int best_len = 0;
        int best_token = -1;

        for (int len = tok->max_token_length; len >= 1; len--) {
            /* Build candidate string */
            char candidate[256];
            int i;
            for (i = 0; i < len && text[i]; i++) {
                candidate[i] = text[i];
            }
            candidate[i] = '\0';

            int token = find_token(tok, candidate);
            if (token >= 0) {
                best_len = i;
                best_token = token;
                break;
            }
        }

        if (best_token >= 0) {
            tokens[n_tokens++] = best_token;
            text += best_len;
        } else {
            /* Fallback: encode as byte */
            u8 byte = (u8)*text;
            /* Find byte token */
            char byte_str[4];
            byte_str[0] = (char)byte;
            byte_str[1] = '\0';
            int token = find_token(tok, byte_str);
            if (token >= 0) {
                tokens[n_tokens++] = token;
            }
            text++;
        }
    }

    return n_tokens;
}

int llm_decode(LlmTokenizer* tok, int token, char* output, int prev_token) {
    if (token < 0 || token >= tok->vocab_size) {
        output[0] = '\0';
        return 0;
    }

    const char* piece = tok->vocab[token];
    int len = (int)strlen(piece);
    memcpy(output, piece, len + 1);

    return len;
}

void llm_tokenizer_free(LlmTokenizer* tok) {
    /* Heap doesn't support individual frees */
    tok->vocab_size = 0;
}

/* ============ Generation ============ */

int llm_generate(LlmTransformer* t, LlmTokenizer* tok, LlmSampler* sampler,
                 const char* prompt, char* output, int max_output_len) {
    if (!t->initialized || !tok || !sampler || !prompt || !output) {
        return -1;
    }

    /* Encode prompt */
    int prompt_tokens[512];
    int n_prompt = llm_encode(tok, prompt, prompt_tokens, 512);
    if (n_prompt == 0) {
        return -1;
    }

    /* Generate tokens */
    int output_pos = 0;
    int token = prompt_tokens[0];
    int pos = 0;
    int prev_token = 0;

    /* Process prompt tokens */
    for (int i = 0; i < n_prompt && pos < t->config.seq_len; i++) {
        llm_forward(t, prompt_tokens[i], pos);
        prev_token = prompt_tokens[i];
        pos++;
    }

    /* Generate new tokens */
    int max_new_tokens = t->config.seq_len - n_prompt;
    if (max_new_tokens > 256) max_new_tokens = 256;  /* Limit generation */

    for (int i = 0; i < max_new_tokens && pos < t->config.seq_len; i++) {
        float* logits = llm_forward(t, token, pos);
        int next_token = llm_sample(sampler, logits, t->config.vocab_size);

        /* Check for EOS */
        if (next_token == 1 || next_token == 2) {  /* Common EOS tokens */
            break;
        }

        /* Decode token */
        char piece[256];
        int piece_len = llm_decode(tok, next_token, piece, prev_token);

        /* Append to output */
        if (output_pos + piece_len < max_output_len - 1) {
            memcpy(output + output_pos, piece, piece_len);
            output_pos += piece_len;
        }

        token = next_token;
        prev_token = token;
        pos++;
    }

    output[output_pos] = '\0';
    return output_pos;
}
