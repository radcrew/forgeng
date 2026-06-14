import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the `@constants/*`, `@utils/*`, etc. aliases straight from tsconfig.
  resolve: { tsconfigPaths: true },
  test: {
    // Unit tests live in a separate tree mirroring src/, not co-located.
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      // Measure the whole app so the report reflects overall coverage, not just
      // the files currently under test. The number climbs as tests are added.
      include: ["src/**"],
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
