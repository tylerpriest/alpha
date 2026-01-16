#!/bin/bash
#
# Download TinyStories model and tokenizer for AlphaOS
#
# Models are from: https://huggingface.co/karpathy/tinyllamas
# Format: llama2.c compatible .bin files
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OS_DIR="$(dirname "$SCRIPT_DIR")"
MODEL_DIR="$OS_DIR/models"

mkdir -p "$MODEL_DIR"

echo "AlphaOS Model Downloader"
echo "========================"
echo ""

# Available models (from Karpathy's tinyllamas)
# stories15M.bin  - 15M params, ~58MB, basic stories
# stories42M.bin  - 42M params, ~85MB, better quality
# stories110M.bin - 110M params, ~220MB, good quality

MODEL_NAME="${1:-stories260K}"
MODEL_FILE="$MODEL_NAME.bin"

case "$MODEL_NAME" in
    stories260K)
        MODEL_URL="https://huggingface.co/karpathy/tinyllamas/resolve/main/stories260K/stories260K.bin"
        TOKENIZER_URL="https://huggingface.co/karpathy/tinyllamas/resolve/main/stories260K/tok512.bin"
        SIZE="~1MB"
        VOCAB="512 tokens"
        ;;
    stories15M)
        MODEL_URL="https://huggingface.co/karpathy/tinyllamas/resolve/main/stories15M.bin"
        TOKENIZER_URL=""  # Requires generating from tokenizer.model
        SIZE="~58MB"
        VOCAB="32K tokens (needs tokenizer.model conversion)"
        ;;
    stories42M)
        MODEL_URL="https://huggingface.co/karpathy/tinyllamas/resolve/main/stories42M.bin"
        TOKENIZER_URL=""
        SIZE="~85MB"
        VOCAB="32K tokens (needs tokenizer.model conversion)"
        ;;
    stories110M)
        MODEL_URL="https://huggingface.co/karpathy/tinyllamas/resolve/main/stories110M.bin"
        TOKENIZER_URL=""
        SIZE="~220MB"
        VOCAB="32K tokens (needs tokenizer.model conversion)"
        ;;
    *)
        echo "Unknown model: $MODEL_NAME"
        echo ""
        echo "Available models:"
        echo "  stories260K - 260K params, ~1MB + tokenizer (recommended for testing)"
        echo "  stories15M  - 15M params, ~58MB"
        echo "  stories42M  - 42M params, ~85MB"
        echo "  stories110M - 110M params, ~220MB"
        echo ""
        echo "Note: stories260K includes a compatible tokenizer."
        echo "Larger models need tokenizer.bin generated from tokenizer.model."
        echo ""
        echo "Usage: $0 [model_name]"
        exit 1
        ;;
esac

echo "Model: $MODEL_NAME ($SIZE, $VOCAB)"
echo ""

# Download function
download_file() {
    local url="$1"
    local dest="$2"

    if [ -f "$dest" ]; then
        echo "  Already exists: $dest"
        return 0
    fi

    echo "  Downloading: $dest"
    if command -v wget &> /dev/null; then
        wget -q --show-progress -O "$dest" "$url"
    elif command -v curl &> /dev/null; then
        curl -L -# -o "$dest" "$url"
    else
        echo "Error: wget or curl required"
        exit 1
    fi
}

# Download model
echo "Downloading model..."
download_file "$MODEL_URL" "$MODEL_DIR/$MODEL_FILE"

# Download tokenizer if available
if [ -n "$TOKENIZER_URL" ]; then
    echo "Downloading tokenizer..."
    download_file "$TOKENIZER_URL" "$MODEL_DIR/tokenizer.bin"
else
    echo ""
    echo "Note: This model requires a 32K vocab tokenizer."
    echo "You need to generate tokenizer.bin from tokenizer.model:"
    echo "  1. pip install sentencepiece"
    echo "  2. wget https://raw.githubusercontent.com/karpathy/llama2.c/master/tokenizer.model"
    echo "  3. wget https://raw.githubusercontent.com/karpathy/llama2.c/master/tokenizer.py"
    echo "  4. python tokenizer.py --tokenizer-model=tokenizer.model"
    echo ""
    echo "Or use stories260K which includes a tokenizer:"
    echo "  ./scripts/download_model.sh stories260K"
fi

# Create symlink as model.bin for ISO building
ln -sf "$MODEL_FILE" "$MODEL_DIR/model.bin"

echo ""
echo "Download complete!"
echo "  Model: $MODEL_DIR/$MODEL_FILE"
if [ -f "$MODEL_DIR/tokenizer.bin" ]; then
    echo "  Tokenizer: $MODEL_DIR/tokenizer.bin"
fi
echo ""
echo "To build ISO with AI:"
echo "  make iso-with-model"
echo ""
echo "Or manually copy to USB after burning ISO:"
echo "  cp $MODEL_DIR/model.bin /path/to/usb/boot/"
if [ -f "$MODEL_DIR/tokenizer.bin" ]; then
    echo "  cp $MODEL_DIR/tokenizer.bin /path/to/usb/boot/"
fi
