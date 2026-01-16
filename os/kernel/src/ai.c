/*
 * AlphaOS - AI Inference Engine
 *
 * AI-native operating system inference layer.
 * Integrates with LLM transformer engine for real inference.
 * Falls back to demo mode when no model is loaded.
 */

#include "ai.h"
#include "llm.h"
#include "model_config.h"
#include "console.h"
#include "heap.h"
#include "fpu.h"

/* AI state */
static struct {
    bool initialized;
    bool model_loaded;
    const char* status;
    u32 interaction_count;

    /* LLM engine */
    LlmTransformer transformer;
    LlmTokenizer tokenizer;
    LlmSampler sampler;
} ai_state;

/* String comparison helper */
static bool ai_str_contains(const char* haystack, const char* needle) {
    if (!haystack || !needle) return false;

    while (*haystack) {
        const char* h = haystack;
        const char* n = needle;

        while (*h && *n && (*h == *n || (*h >= 'A' && *h <= 'Z' && *h + 32 == *n) ||
                           (*h >= 'a' && *h <= 'z' && *h - 32 == *n))) {
            h++;
            n++;
        }

        if (*n == '\0') return true;
        haystack++;
    }
    return false;
}

/* Copy string */
static void ai_strcpy(char* dest, const char* src, usize max) {
    usize i = 0;
    while (src[i] && i < max - 1) {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

/* Concatenate string */
static void ai_strcat(char* dest, const char* src, usize max) {
    usize len = 0;
    while (dest[len]) len++;

    usize i = 0;
    while (src[i] && len + i < max - 1) {
        dest[len + i] = src[i];
        i++;
    }
    dest[len + i] = '\0';
}

/* Saved vocab size from model for tokenizer */
static int model_vocab_size = 0;

/*
 * Load model from raw binary data.
 *
 * Model format (llama2.c compatible):
 *   - First 28 bytes: Config header (7 x int32)
 *   - Remainder: Weight data (float32)
 */
static bool load_model_from_data(void* data, usize size) {
    if (!data || size < 32) {
        return false;
    }

    /* Parse config header (7 x int32 = 28 bytes) */
    int* header = (int*)data;
    LlmConfig cfg;
    cfg.dim = header[0];
    cfg.hidden_dim = header[1];
    cfg.n_layers = header[2];
    cfg.n_heads = header[3];
    cfg.n_kv_heads = header[4];
    cfg.vocab_size = header[5];
    cfg.seq_len = header[6];

    /* Validate config */
    if (cfg.dim <= 0 || cfg.dim > 8192 ||
        cfg.n_layers <= 0 || cfg.n_layers > 64 ||
        cfg.vocab_size <= 0 || cfg.vocab_size > 128000) {
        console_printf("  AI: Invalid model config\n");
        return false;
    }

    /* Handle negative vocab_size (indicates unshared weights) */
    bool shared_weights = cfg.vocab_size > 0;
    cfg.vocab_size = cfg.vocab_size < 0 ? -cfg.vocab_size : cfg.vocab_size;
    model_vocab_size = cfg.vocab_size;

    console_printf("  AI: Model config: dim=%d, layers=%d, heads=%d, vocab=%d\n",
                   cfg.dim, cfg.n_layers, cfg.n_heads, cfg.vocab_size);

    /* Weights start after header */
    float* weights = (float*)((u8*)data + 28);

    /* Initialize transformer with weights */
    if (llm_init(&ai_state.transformer, &cfg, weights) != 0) {
        console_printf("  AI: Failed to initialize transformer\n");
        return false;
    }

    (void)shared_weights;  /* May need later for weight tying */

    return true;
}

/*
 * Load tokenizer from binary data.
 *
 * Tokenizer format (llama2.c tokenizer.bin):
 *   - First 4 bytes: max_token_length (int32)
 *   - For each token: score (float32) + len (int32) + string (len bytes)
 */
static bool load_tokenizer_from_data(void* data, usize size, int vocab_size) {
    if (!data || size < 4 || vocab_size <= 0) {
        return false;
    }

    /* Parse header */
    int* header = (int*)data;
    int max_token_length = header[0];
    (void)max_token_length;

    console_printf("  AI: Loading tokenizer (vocab=%d)...\n", vocab_size);

    /* Pass raw data to tokenizer init - it will parse the format */
    if (llm_tokenizer_init_binary(&ai_state.tokenizer, data, size, vocab_size) != 0) {
        console_printf("  AI: Failed to initialize tokenizer\n");
        return false;
    }

    console_printf("  AI: Tokenizer loaded\n");
    return true;
}

/* Initialize AI subsystem */
int ai_init(void* model_data, usize model_size,
            void* tokenizer_data, usize tokenizer_size) {
    console_printf("  AI: Initializing inference engine...\n");

    /* Check FPU availability */
    if (!fpu_available()) {
        console_printf("  AI: Warning - FPU not available\n");
    }

    if (sse_available()) {
        console_printf("  AI: SSE enabled for matrix ops\n");
    }

    /* Initialize sampler with defaults */
    llm_sampler_init(&ai_state.sampler, 0.7f, 0.9f, 12345);

    /* Try to load model from provided data */
    if (model_data && model_size > 0) {
        console_printf("  AI: Loading model from boot module (%lu KB)...\n",
                       model_size / 1024);
        ai_state.model_loaded = load_model_from_data(model_data, model_size);
    } else {
        console_printf("  AI: No model module provided\n");
        ai_state.model_loaded = false;
    }

    /* Load tokenizer if model loaded and tokenizer data available */
    bool tokenizer_loaded = false;
    if (ai_state.model_loaded && tokenizer_data && tokenizer_size > 0) {
        console_printf("  AI: Loading tokenizer (%lu KB)...\n",
                       tokenizer_size / 1024);
        tokenizer_loaded = load_tokenizer_from_data(tokenizer_data, tokenizer_size, model_vocab_size);
    } else if (ai_state.model_loaded) {
        console_printf("  AI: No tokenizer (inference only)\n");
    }

    if (ai_state.model_loaded && tokenizer_loaded) {
        ai_state.status = "Alpha (local LLM)";
        console_printf("  AI: Local model + tokenizer loaded!\n");
    } else if (ai_state.model_loaded) {
        ai_state.status = "Alpha (model only)";
        console_printf("  AI: Model loaded but no tokenizer\n");
    } else {
        ai_state.status = "Alpha (demo mode)";
        console_printf("  AI: Demo mode (add model to USB for real AI)\n");
    }

    ai_state.initialized = true;
    ai_state.interaction_count = 0;

    return 0;
}

/* Shutdown AI subsystem */
void ai_shutdown(void) {
    if (ai_state.model_loaded) {
        llm_free(&ai_state.transformer);
    }
    ai_state.initialized = false;
    ai_state.model_loaded = false;
}

/* Check if AI is ready */
bool ai_ready(void) {
    return ai_state.initialized;
}

/* Get AI status string */
const char* ai_status(void) {
    return ai_state.status;
}

/* Get model info */
const char* ai_model_info(void) {
    if (ai_state.model_loaded) {
        return "Model: Local LLM active";
    } else {
        return "Model: Demo (needs weights file)";
    }
}

/* Demo response generation (used when no model loaded) */
static int demo_generate(const char* prompt, char* response, usize max_len) {
    /* Greeting */
    if (ai_str_contains(prompt, "hello") || ai_str_contains(prompt, "hi") ||
        ai_str_contains(prompt, "hey")) {
        ai_strcpy(response, "Hello! I'm Alpha, your AI operating system. ", max_len);
        ai_strcat(response, "I'm running directly on your MacBook's hardware. ", max_len);
        ai_strcat(response, "How can I help you today?", max_len);
        return 0;
    }

    /* What are you */
    if (ai_str_contains(prompt, "what are you") || ai_str_contains(prompt, "who are you")) {
        ai_strcpy(response, "I am AlphaOS - an AI-native operating system. ", max_len);
        ai_strcat(response, "Unlike traditional OSes that add AI as a feature, ", max_len);
        ai_strcat(response, "I am built from the ground up with AI at the core. ", max_len);
        ai_strcat(response, "I run locally on your device for privacy.", max_len);
        return 0;
    }

    /* Help */
    if (ai_str_contains(prompt, "help") || ai_str_contains(prompt, "what can you do")) {
        ai_strcpy(response, "I'm currently in demo mode. ", max_len);
        ai_strcat(response, "With a loaded LLM model, I can:\n", max_len);
        ai_strcat(response, "- Have real conversations\n", max_len);
        ai_strcat(response, "- Answer questions\n", max_len);
        ai_strcat(response, "- Help with tasks\n", max_len);
        ai_strcat(response, "- Control the system\n", max_len);
        ai_strcat(response, "\nThe LLM engine is ready - just needs model weights!", max_len);
        return 0;
    }

    /* Time */
    if (ai_str_contains(prompt, "time") || ai_str_contains(prompt, "date")) {
        ai_strcpy(response, "I don't have a real-time clock driver yet. ", max_len);
        ai_strcat(response, "That's coming in a future update.", max_len);
        return 0;
    }

    /* System info */
    if (ai_str_contains(prompt, "system") || ai_str_contains(prompt, "status") ||
        ai_str_contains(prompt, "info")) {
        ai_strcpy(response, "System Status:\n", max_len);
        ai_strcat(response, "- Kernel: AlphaOS v0.5.0\n", max_len);
        ai_strcat(response, "- AI: LLM engine ready\n", max_len);
        ai_strcat(response, "- FPU/SSE: Enabled\n", max_len);
        ai_strcat(response, "- Inference: Needs model file\n", max_len);
        ai_strcat(response, "Type 'info' for hardware details.", max_len);
        return 0;
    }

    /* Model */
    if (ai_str_contains(prompt, "model") || ai_str_contains(prompt, "llm") ||
        ai_str_contains(prompt, "load")) {
        ai_strcpy(response, "The LLM inference engine is ready!\n\n", max_len);
        ai_strcat(response, "To enable real AI:\n", max_len);
        ai_strcat(response, "1. Need NVMe storage driver\n", max_len);
        ai_strcat(response, "2. Load model (e.g., stories15M.bin)\n", max_len);
        ai_strcat(response, "3. Or embed tiny model in kernel\n\n", max_len);
        ai_strcat(response, "The transformer forward pass is implemented!", max_len);
        return 0;
    }

    /* Shutdown/reboot */
    if (ai_str_contains(prompt, "shutdown") || ai_str_contains(prompt, "reboot")) {
        ai_strcpy(response, "Type 'reboot' at the prompt to restart.", max_len);
        return 0;
    }

    /* Thank you */
    if (ai_str_contains(prompt, "thank")) {
        ai_strcpy(response, "You're welcome! I'm here to help.", max_len);
        return 0;
    }

    /* Joke */
    if (ai_str_contains(prompt, "joke")) {
        ai_strcpy(response, "Why do programmers prefer dark mode? ", max_len);
        ai_strcat(response, "Because light attracts bugs!", max_len);
        return 0;
    }

    /* Default response */
    ai_strcpy(response, "I heard: \"", max_len);
    ai_strcat(response, prompt, max_len);
    ai_strcat(response, "\"\n\n", max_len);
    ai_strcat(response, "I'm in demo mode - the LLM engine is implemented but ", max_len);
    ai_strcat(response, "needs model weights to generate real responses. ", max_len);
    ai_strcat(response, "Try: hello, help, system, model", max_len);

    return 0;
}

/*
 * Generate response from prompt.
 * Uses LLM if model loaded, otherwise demo responses.
 */
int ai_generate(const char* prompt, char* response, usize max_len) {
    if (!ai_state.initialized) {
        ai_strcpy(response, "Error: AI not initialized", max_len);
        return -1;
    }

    ai_state.interaction_count++;

    /* Use real LLM inference if model is loaded */
    if (ai_state.model_loaded && llm_ready(&ai_state.transformer)) {
        int result = llm_generate(
            &ai_state.transformer,
            &ai_state.tokenizer,
            &ai_state.sampler,
            prompt,
            response,
            (int)max_len
        );

        if (result > 0) {
            return 0;
        }
        /* Fall through to demo if LLM failed */
    }

    /* Demo mode */
    return demo_generate(prompt, response, max_len);
}

/* Generate with streaming callback */
int ai_generate_stream(const char* prompt, AiResponseCallback callback, void* user_data) {
    static char response[1024];
    int result = ai_generate(prompt, response, sizeof(response));

    if (result == 0 && callback) {
        callback(response, user_data);
    }

    return result;
}
