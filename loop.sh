#!/bin/bash

# Ralph Loop Script
# Usage:
#   ./loop.sh              # Build mode, unlimited iterations
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Planning mode, unlimited
#   ./loop.sh plan 5       # Planning mode, max 5 iterations

set -e

# Parse arguments
MODE="build"
MAX_ITERATIONS=0

if [[ "$1" == "plan" ]]; then
    MODE="plan"
    shift
fi

if [[ -n "$1" ]] && [[ "$1" =~ ^[0-9]+$ ]]; then
    MAX_ITERATIONS=$1
fi

# Select prompt file
if [[ "$MODE" == "plan" ]]; then
    PROMPT_FILE="PROMPT_plan.md"
else
    PROMPT_FILE="PROMPT_build.md"
fi

# Validate prompt file exists
if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "Error: $PROMPT_FILE not found"
    echo "Create it from templates/PROMPT_${MODE}.md"
    exit 1
fi

echo "========================================"
echo "Ralph Loop - $MODE mode"
echo "Prompt: $PROMPT_FILE"
if [[ $MAX_ITERATIONS -gt 0 ]]; then
    echo "Max iterations: $MAX_ITERATIONS"
else
    echo "Iterations: unlimited (Ctrl+C to stop)"
fi
echo "========================================"
echo ""

ITERATION=0

while true; do
    ITERATION=$((ITERATION + 1))

    echo "----------------------------------------"
    echo "Iteration $ITERATION starting..."
    echo "----------------------------------------"

    # Run Claude with the prompt
    cat "$PROMPT_FILE" | claude \
        --dangerously-skip-permissions \
        --model opus \
        --verbose \
        --output-format stream-json

    EXIT_CODE=$?

    if [[ $EXIT_CODE -ne 0 ]]; then
        echo "Claude exited with code $EXIT_CODE"
        echo "Stopping loop."
        exit $EXIT_CODE
    fi

    # Push changes after each iteration (build mode only)
    if [[ "$MODE" == "build" ]]; then
        if git diff --quiet && git diff --staged --quiet; then
            echo "No changes to push"
        else
            echo "Pushing changes..."
            git push 2>/dev/null || echo "Push failed (may need to set upstream)"
        fi
    fi

    echo ""
    echo "Iteration $ITERATION complete."
    echo ""

    # Check iteration limit
    if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
        echo "Reached max iterations ($MAX_ITERATIONS). Stopping."
        exit 0
    fi

    # Small delay between iterations
    sleep 2
done
