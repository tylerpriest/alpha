/**
 * Reference examples for LLM-as-Judge pattern
 * 
 * Ralph learns from these examples how to use llm-review.ts
 * for testing subjective acceptance criteria.
 */

import { describe, test, expect } from 'vitest';
import { createReview } from './llm-review';

// Note: These tests are examples/documentation for Ralph
// They demonstrate the pattern but will fail until createReview is implemented
// Ralph should implement createReview based on available LLM APIs

describe('LLM Review Pattern Examples', () => {
  // Example 1: Text evaluation
  test.skip('welcome message tone', async () => {
    const message = 'Welcome to Arcology Builder! Build your vertical city on Venus.';
    const result = await createReview({
      criteria:
        'Message uses warm, conversational tone appropriate for design professionals while clearly conveying value proposition',
      artifact: message, // Text content
    });
    expect(result.pass).toBe(true);
  });

  // Example 2: Vision evaluation (screenshot path)
  test.skip('dashboard visual hierarchy', async () => {
    // In real usage, would take screenshot first:
    // await page.screenshot({ path: './tmp/dashboard.png' });
    const result = await createReview({
      criteria: 'Layout demonstrates clear visual hierarchy with obvious primary action',
      artifact: './tmp/dashboard.png', // Screenshot path
    });
    expect(result.pass).toBe(true);
  });

  // Example 3: Smart intelligence for complex judgment
  test.skip('brand visual consistency', async () => {
    // await page.screenshot({ path: './tmp/homepage.png' });
    const result = await createReview({
      criteria:
        'Visual design maintains professional brand identity suitable for financial services while avoiding corporate sterility',
      artifact: './tmp/homepage.png',
      intelligence: 'smart', // Complex aesthetic judgment
    });
    expect(result.pass).toBe(true);
  });

  // Example 4: UI component visual test
  test.skip('menu visual design', async () => {
    // await page.screenshot({ path: './tmp/menu.png' });
    const result = await createReview({
      criteria:
        'Menu displays with clear visual hierarchy, readable text, and intuitive navigation structure',
      artifact: './tmp/menu.png',
    });
    expect(result.pass).toBe(true);
  });

  // Example 5: Game UI acceptance criteria
  test.skip('game overlay information clarity', async () => {
    // await page.screenshot({ path: './tmp/game-ui.png' });
    const result = await createReview({
      criteria:
        'Game UI overlay shows all critical information (money, population, time) without cluttering the game view',
      artifact: './tmp/game-ui.png',
      intelligence: 'fast',
    });
    expect(result.pass).toBe(true);
  });
});

/**
 * Usage Notes for Ralph:
 * 
 * 1. Both text and screenshots work as artifacts
 * 2. Choose based on what needs evaluation
 * 3. Use 'fast' for straightforward checks, 'smart' for complex aesthetic judgment
 * 4. The fixture handles artifact type detection automatically
 * 5. Binary pass/fail keeps it simple - no scoring complexity
 * 6. Non-deterministic results are expected - iterate until pass
 */
