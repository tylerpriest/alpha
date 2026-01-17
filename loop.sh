#!/bin/bash

# Ralph Loop Script
# Usage:
#   ./loop.sh              # Build mode with Claude (default)
#   ./loop.sh plan         # Plan mode with Claude
#   ./loop.sh --cursor     # Build mode with Cursor
#   ./loop.sh plan --cursor # Plan mode with Cursor
#   ./loop.sh 20 --cursor  # Build mode, 20 iterations, Cursor

set -e

# Parse arguments
MODE="build"
MAX_ITERATIONS=0
USE_CURSOR=false

for arg in "$@"; do
    case $arg in
        plan)
            MODE="plan"
            ;;
        --cursor)
            USE_CURSOR=true
            ;;
        [0-9]*)
            MAX_ITERATIONS=$arg
            ;;
    esac
done

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
if [[ "$USE_CURSOR" == "true" ]]; then
    echo "Agent: Cursor (interactive - may prompt for approval)"
else
    echo "Agent: Claude (auto-approve enabled)"
fi
echo "Prompt: $PROMPT_FILE"
if [[ $MAX_ITERATIONS -gt 0 ]]; then
    echo "Max iterations: $MAX_ITERATIONS"
else
    echo "Iterations: unlimited (Ctrl+C to stop)"
fi
echo "========================================"
if [[ "$USE_CURSOR" == "true" ]]; then
    echo ""
    echo "NOTE: Cursor CLI may prompt for command approval."
    echo "Enable YOLO mode in Cursor Settings for unattended runs."
fi
echo ""

ITERATION=0

while true; do
    ITERATION=$((ITERATION + 1))

    echo "----------------------------------------"
    echo "Iteration $ITERATION starting..."
    echo "----------------------------------------"

    # Run the agent with the prompt
    if [[ "$USE_CURSOR" == "true" ]]; then
        # Cursor Agent CLI
        cursor --agent -p "$(cat "$PROMPT_FILE")"
    else
        # Claude CLI (default)
        cat "$PROMPT_FILE" | claude \
            --dangerously-skip-permissions \
            --model opus \
            --verbose \
            --output-format stream-json
    fi

    EXIT_CODE=$?

    if [[ $EXIT_CODE -ne 0 ]]; then
        if [[ "$USE_CURSOR" == "true" ]]; then
            echo "Cursor exited with code $EXIT_CODE"
        else
            echo "Claude exited with code $EXIT_CODE"
        fi
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
