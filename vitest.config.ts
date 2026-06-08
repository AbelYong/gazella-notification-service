import { defineConfig } from 'vitest/config';
import "vitest"

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
    },
    globalSetup: "./tests/global_setup.ts",
    setupFiles: "./tests/setup.ts",
    fileParallelism: false
  },
});

declare module "vitest" {
  export interface ProvidedContext {
    dbUri: string;
    rabbitUri: string;
  }
}
