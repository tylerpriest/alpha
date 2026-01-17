#!/bin/bash

# Ralph Loop Script
# Usage:
#   ./loop.sh              # Build mode with Claude (default)
#   ./loop.sh plan         # Plan mode with Claude
#   ./loop.sh --agent      # Build mode with Cursor Agent (auto-run)
#   ./loop.sh --agent -i   # Build mode with Cursor Agent (interactive)
#   ./loop.sh plan --agent # Plan mode with Cursor Agent
#   ./loop.sh 20 --agent   # Build mode, 20 iterations, Cursor Agent

set -e

# Parse arguments
MODE="build"
MAX_ITERATIONS=0
USE_AGENT=false
INTERACTIVE=false

for arg in "$@"; do
    case $arg in
        plan)
            MODE="plan"
            ;;
        --agent)
            USE_AGENT=true
            ;;
        -i|--interactive)
            INTERACTIVE=true
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
if [[ "$USE_AGENT" == "true" ]]; then
    if [[ "$INTERACTIVE" == "true" ]]; then
        echo "Agent: Cursor (interactive - can type input)"
    else
        echo "Agent: Cursor (auto-run mode)"
    fi
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
if [[ "$USE_AGENT" == "true" ]] && [[ "$INTERACTIVE" == "true" ]]; then
    echo ""
    echo "TIP: Type '/auto-run on' in agent to enable auto-approval."
fi
echo ""

ITERATION=0

while true; do
    ITERATION=$((ITERATION + 1))

    echo "----------------------------------------"
    echo "Iteration $ITERATION starting..."
    echo "----------------------------------------"

    # Run the agent with the prompt
    if [[ "$USE_AGENT" == "true" ]]; then
        # Cursor Agent CLI
        if [[ "$INTERACTIVE" == "true" ]]; then
            # Interactive mode - allows typing input
            if [[ "$MODE" == "plan" ]]; then
                agent --plan "$(cat "$PROMPT_FILE")"
            else
                agent "$(cat "$PROMPT_FILE")"
            fi
        else
            # Auto-run mode - non-interactive
            if [[ "$MODE" == "plan" ]]; then
                agent --print --plan --output-format text "$(cat "$PROMPT_FILE")"
            else
                agent --print --output-format text "$(cat "$PROMPT_FILE")"
            fi
        fi
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
        if [[ "$USE_AGENT" == "true" ]]; then
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
            git push origin arcology 2>/dev/null || echo "Push failed (may need to set upstream)"
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
