import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      'phaser3spectorjs': './src/test/mocks/phaser3spectorjs.ts',
    },
  },
});
